import {join} from 'node:path';
import {
  RuntimeError,
  canonicalJson,
  criteriaRef,
  isProducingRun,
  subjectRef,
} from './contract.mjs';
import {
  completionApproval, effectiveApprovals, effectiveEvidence, effectiveReviews,
  matchesAcceptance, recoveryResolution, requireDeploymentEvidence,
  requireOperatorApproval, requireReleaseEvidence, requireReviews,
} from './acceptance.mjs';
import {verifyArtifact, workspaceManifest} from './evidence-content.mjs';
import {bindEvidenceReadView} from './evidence-context.mjs';
import {taskStateSatisfies} from './engine.mjs';
import {captureArtifacts, captureChanges, captureHistory} from './report-capture.mjs';
import {artifactBasisCurrent, verifyAssetContent, verifyReferences, verifyVerdict} from './evidence-integrity.mjs';
import {normalized} from '../workspace-path-safety.mjs';
import {
  COORDINATION_DATABASE,
  workspaceRootFromCoordinationDatabase,
} from '../workspace-layout.mjs';
import {listRecords, readRecord, readSnapshot, readSubjectView} from './store.mjs';
import {artifactPreviewLimits, knownGap, redactReport, snapshotWarning} from './report-safety.mjs';

const bindsSubject = (record, subject) =>
  record?.subject?.kind === subject.kind && record.subject.id === subject.id;
const contentEquals = (left, right) =>
  left !== null && right !== null && canonicalJson(left) === canonicalJson(right);

const terminal = new Set(['completed', 'shipped', 'dropped']);
const positive = value => ['approved', 'clear', 'waived', 'passed'].includes(value);
const negativeValidity = new Set(['stale', 'expired', 'superseded', 'invalidated', 'retired']);

function excerpt(value, limit = 512) {
  const text = typeof value === 'string' ? value : JSON.stringify(value);
  if (Buffer.byteLength(text) <= limit) return {text, truncated: false};
  let result = '';
  let bytes = 0;
  for (const character of text) {
    const size = Buffer.byteLength(character);
    if (bytes + size > limit - 3) break;
    result += character;
    bytes += size;
  }
  return {text: `${result}…`, truncated: true};
}

/**
 * Human view: full obligation/verdict metadata, eight recent message excerpts,
 * plus paginated complete history and inert retained content preparation.
 * Preparation is O(n) in human export size; agent projectContext stays bounded.
 * All DB reads share one SQLite snapshot. Filesystem integrity is separately
 * checked during generation; this is not an atomic DB+filesystem snapshot.
 */
export function buildReport(store, {subject}) {
  if (!subject || typeof subject !== 'object') throw new RuntimeError('INVALID_INPUT', 'report subject is required');
  const root = workspaceRootFromCoordinationDatabase(store.path);
  const manifest = workspaceManifest(root);
  const database = COORDINATION_DATABASE;
  if (normalized(store.path) !== normalized(join(root, ...database.split('/')))) {
    throw new RuntimeError('INVALID_INPUT', 'report store must belong to the explicit workspace');
  }
  return readSnapshot(store, () => {
    const gaps = [];
    const gapKeys = new Set();
    const addGap = (ref, message, severity = 'gap', code = 'EVIDENCE_GAP') => {
      const key = JSON.stringify([ref, message]);
      if (!gapKeys.has(key)) {
        gapKeys.add(key);
        gaps.push({ref, code, severity, message});
      }
    };
    const check = (ref, action, severity = 'gap') => {
      try { return {ok: true, value: action()}; }
      catch (error) {
        if (!knownGap(error)) throw error;
        addGap(ref, error.message, severity, error.code);
        return {ok: false};
      }
    };
    const contextRead = check(`${subject.kind}:${subject.id}`, () => readSubjectView(store, {
      subject,
      recentLimit: 8,
    }));
    const context = contextRead.value;
    const item = context?.record ?? readRecord(store, subject.kind, subject.id);
    if (!item) throw new RuntimeError('EVIDENCE_GAP', `${subject.kind}/${subject.id} does not exist`);
    const throughSeq = context?.throughSeq ?? Number(store.database.prepare(
      'SELECT COALESCE(MAX(seq), 0) AS seq FROM events').get().seq);
    const cache = new Map();
    const recordsById = new Map();
    const itemSubject = subject;
    const list = (kind, subject = undefined) => {
      const key = `${kind}\0${subject === undefined ? '*' : canonicalJson(subject)}`;
      if (!cache.has(key)) {
        const records = listRecords(store, {kind, subject});
        cache.set(key, records);
        records.forEach(r => recordsById.set(`${kind}\0${r.id}`, r));
      }
      return cache.get(key);
    };
    const tx = bindEvidenceReadView({
      list,
      get: (kind, id) => {
        const key = `${kind}\0${id}`;
        if (!recordsById.has(key)) recordsById.set(key, readRecord(store, kind, id));
        return recordsById.get(key);
      },
    }, {root});
    const body = item.body;
    const currentCriteria = check(
      'criteria',
      () => criteriaRef(item, (kind, id) => tx.get(kind, id)),
    ).value ?? null;
    const artifacts = list('artifact', itemSubject).map(record => ({
      id: record.id, ref: `artifact:${record.id}`, version: record.version, ...record.body,
      status: bindsSubject(record, itemSubject)
        && currentCriteria !== null
        && record.body.criteria_ref === currentCriteria
        && (item.kind !== 'task' || contentEquals(record.body.content_ref, item.body.change_ref))
        ? 'current'
        : 'historical',
      integrity: 'not-rechecked', assets: [],
    }));
    const assets = list('asset', itemSubject);
    const assetsByArtifact = new Map();
    for (const asset of assets) {
      const entries = assetsByArtifact.get(asset.body.artifact_id) ?? [];
      entries.push(asset.body);
      assetsByArtifact.set(asset.body.artifact_id, entries);
    }
    for (const artifact of artifacts) {
      artifact.assets = assetsByArtifact.get(artifact.id) ?? [];
      if (artifact.status !== 'current') continue;
      const basis = check(artifact.ref, () => artifactBasisCurrent({root}, tx, item, artifact), 'pending');
      if (!basis.ok || !basis.value) {
        artifact.status = 'historical';
        artifact.integrity = 'gap';
        addGap(artifact.ref, 'Historical output basis is obsolete or incomplete; retained without reacceptance.', 'pending');
        continue;
      }
      const verified = check(artifact.ref, () => {
        if (artifact.assets.length) artifact.assets.forEach(asset => verifyAssetContent({root}, tx, asset));
        else verifyArtifact(root, artifact);
      });
      artifact.integrity = verified.ok ? 'verified' : 'gap';
      for (const asset of artifact.assets) {
        if (negativeValidity.has(asset.validity)) {
          artifact.integrity = 'gap';
          addGap(`asset:${asset.asset_id}`, `Current-subject asset validity is ${asset.validity}; not current proof.`);
        }
      }
    }
    const artifactIds = new Set(artifacts.map(a => a.id));
    for (const asset of assets) {
      if (!artifactIds.has(asset.body.artifact_id)) {
        addGap(`asset:${asset.id}`, 'Registered asset references a missing artifact.');
      }
    }
    const groups = [
      ['review', 'review_id', effectiveReviews],
      ['approval', 'approval_id', effectiveApprovals],
      ['evidence', 'evidence_id', effectiveEvidence],
    ];
    const approvalChronology = new Map((context?.approvals ?? []).map(a => [a.record.id, a.eventSeq]));
    const verdicts = {};
    for (const [kind, idKey, effectiveFn] of groups) {
      const records = list(kind, itemSubject);
      const result = check(`${kind}s`, () =>
        effectiveFn(records.map(r => r.body), item, (recordKind, id) => tx.get(recordKind, id)));
      const effectiveIds = result.ok ? new Set(result.value.map(b => b[idKey])) : null;
      verdicts[kind] = records.map(record => {
        const b = record.body;
        const recovery = b.kind === 'operator-recovery-resolution';
        const current = currentCriteria !== null
          && (recovery
            ? b.criteria_ref === currentCriteria
              && b.recovery.attempt_id === body.recovery_hold
            : matchesAcceptance(b, item, (recordKind, id) => tx.get(recordKind, id)));
        const actor = b.reviewer ?? b.authority ?? null;
        const independent = actor === null ? null : (item.kind !== 'task' || !isProducingRun(body, actor))
          && !artifacts.some(a => contentEquals(a.content_ref, b.content_ref)
            && a.producer.runId === actor.runId);
        const status = !current ? 'historical' : effectiveIds === null ? 'conflict'
          : effectiveIds.has(record.id) ? 'current' : 'superseded';
        const entry = {
          id: record.id, ref: `${kind}:${record.id}`, version: record.version, ...b,
          status, independent, integrity: 'not-rechecked',
          eventSeq: kind === 'approval' ? approvalChronology.get(record.id) ?? null : null,
        };
        if (status === 'historical') {
          addGap(entry.ref, 'Historical proof is stale for the current criteria/subject; retained without reacceptance.', 'pending');
        }
        if (status === 'conflict') entry.integrity = 'gap';
        if (status === 'superseded') {
          const retained = check(entry.ref, () => verifyReferences({root}, tx, item,
            [...b.evidence_refs, ...(b.finding_refs ?? [])], {recovery, positive: false}), 'pending');
          entry.integrity = retained.ok ? 'verified' : 'gap';
        }
        if (status !== 'current') return entry;
        if (!positive(b.verdict ?? b.decision ?? b.outcome)) {
          entry.integrity = 'negative';
          addGap(entry.ref, `Current ${kind} records ${b.verdict ?? b.decision ?? b.outcome}; unresolved negative verdict.`);
          return entry;
        }
        const verified = check(entry.ref, () => {
          if (kind === 'approval' && entry.eventSeq === null) {
            throw new RuntimeError('EVIDENCE_GAP', 'Current approval is missing persisted decision chronology.');
          }
          if (recovery) {
            recoveryResolution(tx, item, record.id);
            verifyReferences({root}, tx, item, b.evidence_refs, {recovery: true, positive: false});
          } else if (item.kind === 'task') {
            verifyVerdict(tx, item, b, actor);
            if (artifacts.some(a => a.status === 'current' && a.integrity === 'gap')) {
              throw new RuntimeError('EVIDENCE_GAP', 'Current subject artifact or asset has an integrity/validity gap.');
            }
          } else {
            verifyReferences({root}, tx, item, b.evidence_refs);
          }
        }, 'broken-claim');
        entry.integrity = verified.ok ? 'verified' : 'gap';
        return entry;
      });
    }
    const decisions = verdicts.approval.sort((a, b) => (a.eventSeq ?? 0) - (b.eventSeq ?? 0));
    const reviews = verdicts.review;
    const evidence = verdicts.evidence;
    const completionClaims = decisions.filter(d => d.status === 'current'
      && d.kind === 'completion' && d.decision === 'approved');
    if (completionClaims.length) {
      const completion = check('completion', () => completionApproval(tx, item), 'broken-claim');
      const requiredReviews = item.kind === 'task'
        ? check('required-reviews', () => requireReviews(tx, item), 'broken-claim')
        : {ok: true};
      if (!completion.ok || !requiredReviews.ok) {
        completionClaims.forEach(c => { c.integrity = 'gap'; });
      }
    }
    if (terminal.has(body.state) && body.state !== 'dropped' && !completionClaims.length) {
      addGap('completion', 'Recorded terminal state retained; current completion proof is missing or stale.');
    }
    const recordedPhase = body.state === 'blocked' ? body.resume_state : body.state;
    if (item.kind === 'task'
      && ['release-ready', 'deploying', 'production-verification', 'shipped'].includes(recordedPhase)) {
      check('completion', () => completionApproval(tx, item), 'broken-claim');
      check('required-reviews', () => requireReviews(tx, item), 'broken-claim');
      check('release-evidence', () => requireReleaseEvidence(tx, item), 'broken-claim');
    }
    if (item.kind === 'task' && ['deploying', 'production-verification', 'shipped'].includes(recordedPhase)) {
      check('deployment-start', () => requireOperatorApproval(tx, item, 'operator-deploy-start'), 'broken-claim');
    }
    if (item.kind === 'task' && ['production-verification', 'shipped'].includes(recordedPhase)) {
      check('deployment-complete', () => requireOperatorApproval(tx, item, 'operator-deploy-complete'), 'broken-claim');
      check('deployment', () => requireDeploymentEvidence(tx, item, 'deployment'), 'broken-claim');
    }
    if (item.kind === 'task' && recordedPhase === 'shipped') {
      check('production-verification', () => requireDeploymentEvidence(tx, item, 'production-verification'), 'broken-claim');
    }
    const criteria = body.acceptance.map((text, index) => {
      const support = [
        ...reviews.filter(r => r.criteria.includes(text)),
        ...evidence.filter(e => e.provenance?.tier === 'observed'
          && e.provenance.capture.checks.includes(text)),
      ].filter(r => ['current', 'conflict'].includes(r.status));
      const bad = support.some(r => ['gap', 'negative'].includes(r.integrity));
      const good = support.filter(r => r.integrity === 'verified');
      return {
        id: `criterion-${index + 1}`,
        text,
        criteriaRef: currentCriteria,
        status: bad ? 'gap' : good.length ? 'verified' : 'pending',
        verdictRefs: support.map(r => r.ref),
        evidenceRefs: [...new Set(support.flatMap(r => r.evidence_refs))],
        explanation: 'Exact criterion text matched to review criteria or observed check labels; subject-level approval alone does not imply per-criterion coverage.',
      };
    });
    const references = new Set([
      ...(body.context_artifacts ?? []),
      ...(context?.referencedDetails.map(d => d.reference) ?? []),
    ]);
    for (const reference of references) {
      const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
      if (!match) addGap(reference, 'Reference is not a registered artifact/evidence identity; not linked.');
      else if (!tx.get(match[1].toLowerCase(), match[2])) addGap(reference, 'Referenced record is missing.');
    }
    const questions = list('question', itemSubject).map(record => ({
      id: record.id, ref: `question:${record.id}`, version: record.version, ...record.body,
      disposition: terminal.has(body.state) ? 'historical-follow-up'
        : record.body.status === 'answered' ? 'addressed'
          : record.body.blocking ? 'blocking' : 'nonblocking',
    }));
    const blockers = questions.filter(q => q.disposition === 'blocking');
    const questionsById = new Map(questions.map(q => [q.id, q]));
    for (const id of body.waiting_on_questions ?? []) {
      const question = questionsById.get(id);
      if (!question || (!terminal.has(body.state) && (question.status !== 'open' || !question.blocking))) {
        addGap(`question:${id}`, 'Required question is missing or no longer matches its blocking obligation.');
        if (!terminal.has(body.state) && !blockers.some(b => b.ref === `question:${id}`)) {
          blockers.push({ref: `question:${id}`, ask: 'Restore missing question evidence before resolving this obligation.'});
        }
      }
    }
    for (const entry of context?.questions ?? []) {
      if (entry.record && entry.eventSeq === null) {
        addGap(`question:${entry.record.id}`, 'Question is missing persisted opening-message chronology.');
      }
    }
    for (const question of questions) {
      const opening = tx.get('message', question.opened_message_id);
      if (!bindsSubject(opening, subject) || opening.body.kind !== 'question') {
        addGap(question.ref, 'Question opening message is missing or mismatched.');
      }
      for (const id of question.answer_message_ids) {
        const answer = tx.get('message', id);
        if (!bindsSubject(answer, subject) || answer.body.kind !== 'answer') {
          addGap(question.ref, 'Question answer message is missing or mismatched.');
        }
      }
      if (question.status === 'answered' && (!question.resolution
        || !question.answer_message_ids.includes(question.resolution.message_id))) {
        addGap(question.ref, 'Question resolution does not name a retained answer message.');
      }
    }
    if (body.recovery_hold && !terminal.has(body.state)) {
      blockers.push({ref: `attempt:${body.recovery_hold}`, kind: 'recovery-hold', ask: 'Operator resolution required before resumption.'});
    }
    if (body.recovery_hold) {
      const attempt = tx.get('attempt', body.recovery_hold);
      if (!bindsSubject(attempt, subject)
        || attempt.body.disposition !== 'conflicting-partial-work') {
        addGap(`attempt:${body.recovery_hold}`, 'Recovery hold attempt is missing or mismatched.');
      }
    }
    const dependencies = (context?.dependencies ?? (body.depends_on ?? []).map(dependency => {
      const dependencyId = dependency.task;
      return {dependency, record: tx.get('task', dependencyId)};
    })).map(({dependency, record}) => {
      const dependencyId = dependency.task;
      return {
        task: dependencyId, requires: dependency.requires, state: record?.body.state ?? null,
        version: record?.version ?? null,
        status: !record ? 'missing' : record.body.state === 'dropped' ? 'failed'
          : taskStateSatisfies(record, dependency.requires) ? 'satisfied' : 'pending',
      };
    });
    for (const dependency of dependencies) {
      if (dependency.status === 'satisfied') continue;
      const ref = `task:${dependency.task}`;
      const ask = dependency.status === 'pending'
        ? `Waiting for ${dependency.task}: recorded ${dependency.state}; requires ${dependency.requires}.`
        : dependency.status === 'failed'
          ? `Dependency ${dependency.task} was dropped; recorded requirement ${dependency.requires} failed. Owner decision required.`
          : `Dependency ${dependency.task} is missing; restore evidence before resolving its requirement.`;
      addGap(ref, ask, dependency.status === 'pending' ? 'pending' : 'gap');
      if (!terminal.has(body.state)) blockers.push({ref, kind: 'dependency', status: dependency.status, ask});
    }
    const attempts = [
      ...list('host-attempt', itemSubject).map(r => ({id: r.id, ref: `host-attempt:${r.id}`, type: 'host', version: r.version, ...r.body})),
      ...list('attempt', itemSubject).map(r => ({id: r.id, ref: `attempt:${r.id}`, type: 'recovery', version: r.version, ...r.body})),
    ];
    const effects = list('effect', itemSubject).map(r => ({id: r.id, ref: `effect:${r.id}`, version: r.version, ...r.body}));
    for (const attempt of attempts.filter(a => a.type === 'host')) {
      if (['intent', 'uncertain', 'conflicting', 'mismatched'].includes(attempt.status)) {
        const message = `Host attempt is ${attempt.status}; reconcile liveness, model and outcome before further execution.`;
        addGap(attempt.ref, message);
        if (!terminal.has(body.state)) blockers.push({ref: attempt.ref, ask: message});
      }
    }
    for (const effect of effects) {
      if (['unknown', 'conflicting'].includes(effect.outcome)) {
        const message = `Recorded effect outcome is ${effect.outcome}; no safe retry is implied.`;
        addGap(effect.ref, message);
        if (!terminal.has(body.state)) blockers.push({ref: effect.ref, ask: message});
      }
    }
    const rawMessages = (context?.recentMessages ?? []).filter(({record}) => {
      const inScope = bindsSubject(record, subject)
        && record.body.thread_id === subjectRef(subject, item.version);
      if (!inScope) addGap(`message:${record.id}`, 'Message subject/thread mismatches captured scope; content withheld.');
      return inScope;
    }).map(({record, eventSeq}) => ({
      id: record.id, ref: `message:${record.id}`, eventSeq, ...record.body,
    }));
    // Redact across records before making excerpts, so a bearer copied into prose
    // is removed even if its defining field is outside the selected excerpt.
    const acceptedReportArtifacts = new Set(decisions
      .filter(decision => decision.status === 'current'
        && decision.kind === 'completion'
        && decision.decision === 'approved'
        && decision.integrity === 'verified')
      .flatMap(decision => decision.evidence_refs)
      .filter(reference => reference.startsWith('artifact:'))
      .map(reference => reference.slice('artifact:'.length)));
    const acceptedApprovalIds = new Set(decisions
      .filter(decision => decision.status === 'current'
        && decision.kind === 'completion'
        && decision.decision === 'approved'
        && decision.integrity === 'verified')
      .map(decision => decision.approval_id));
    const reportArtifacts = artifacts.filter(artifact =>
      artifact.classification === 'public'
      && artifact.status === 'current'
      && artifact.integrity === 'verified'
      && acceptedReportArtifacts.has(artifact.id)
      && (item.kind === 'task' || artifact.assets.some(asset =>
          asset.validity === 'current'
          && acceptedApprovalIds.has(asset.completion_approval_id)
          && !new Set(['scratch', 'draft', 'discarded', 'retracted'])
            .has(asset.disposition))));
    if (artifacts.length > reportArtifacts.length) {
      addGap('private-evidence', 'Private evidence metadata and bytes were withheld from the report.', 'pending');
    }
    const reportEvidence = evidence.filter(entry => {
      const classification = entry.provenance?.capture?.classification ?? 'public';
      if (classification === 'public') return true;
      addGap(entry.ref,
        'Private evidence content was withheld; only an accepted public report artifact safe excerpt may be shown.',
        'pending');
      return false;
    });
    const inspection = {
      subject,
      throughSeq,
      messagePages: captureHistory(store, subject, item.version, throughSeq, addGap),
      artifactPreviews: captureArtifacts(root, reportArtifacts, addGap),
    };
    inspection.previewBudget = {...artifactPreviewLimits,
      capturedBytes: inspection.artifactPreviews.reduce((sum, preview) => sum + preview.previewBytes, 0)};
    const changes = captureChanges(root, reportArtifacts, addGap);
    const safe = redactReport({
      schema_version: 2,
      workspace: {id: manifest.workspace_id, root: normalized(root)},
      subject: {
        kind: item.kind,
        id: item.id,
        version: item.version,
        ...body,
        criteriaRef: currentCriteria,
      },
      decisions,
      criteria,
      artifacts: reportArtifacts,
      reviews,
      evidence: reportEvidence,
      questions,
      blockers,
      attempts,
      effects,
      changes, inspection,
      messages: rawMessages, gaps, throughSeq, generatedAt: new Date().toISOString(),
      snapshotWarning,
      integrity: {
        status: gaps.some(g => g.severity !== 'pending') ? 'gap'
          : [...reviews, ...decisions, ...evidence].some(v => v.integrity === 'verified') ? 'verified' : 'pending',
        scope: 'Current proof checks only; not an acceptance decision or coverage total.',
      },
      obligations: {
        reviewRequirements: body.review_requirements ?? [],
        artifactExpectation: body.artifact_expectation ?? null,
        artifactReason: body.artifact_expectation_reason ?? null,
        artifactTargets: body.artifact_targets ?? [],
        dependencies,
      },
      history: {
        totalMessages: context?.messageCount ?? null,
        shownMessages: rawMessages.length,
        cursor: !context ? {
          subject,
          threadId: subjectRef(subject, item.version),
          basisVersion: item.version,
          beforeSeq: throughSeq + 1,
          remainingCount: null,
        }
          : context.messageCount > rawMessages.length ? {
          subject,
          threadId: subjectRef(subject, item.version),
          basisVersion: item.version,
          beforeSeq: rawMessages[0]?.eventSeq ?? throughSeq + 1,
          remainingCount: context.messageCount - rawMessages.length,
        } : null,
        limitation: 'Recent message excerpts only (512 UTF-8 bytes each). Full and older messages are captured in linked offline pages from this same database snapshot. Verdicts, artifact registry metadata and question records below are not truncated. Artifact content previews have separately disclosed byte budgets.',
      },
    });
    safe.messages = safe.messages.map(({payload, ...message}) => ({...message, payloadExcerpt: excerpt(payload)}));
    return safe;
  });
}
