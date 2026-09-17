import {dirname, join} from 'node:path';
import {RuntimeError, criteriaRef, isProducingRun, subjectEquals} from './contract.mjs';
import {
  completionApproval, effectiveApprovals, effectiveEvidence, effectiveReviews,
  matchesAcceptance, recoveryResolution, requireDeploymentEvidence,
  requireOperatorApproval, requireReleaseEvidence, requireReviews,
} from './acceptance.mjs';
import {verifyArtifact, workspaceManifest} from './evidence-content.mjs';
import {bindEvidenceReadView} from './evidence-context.mjs';
import {itemStateSatisfies} from './engine.mjs';
import {captureArtifacts, captureChanges, captureHistory} from './report-capture.mjs';
import {artifactBasisCurrent, verifyAssetContent, verifyReferences, verifyVerdict} from './evidence-integrity.mjs';
import {normalized} from '../workspace-path-safety.mjs';
import {listRecords, readContextView, readRecord, readSnapshot} from './store.mjs';
import {artifactPreviewLimits, knownGap, redactReport, snapshotWarning} from './report-safety.mjs';

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
export function buildReport(store, {itemId}) {
  if (typeof itemId !== 'string' || !itemId) throw new RuntimeError('INVALID_INPUT', 'report itemId is required');
  const root = dirname(dirname(dirname(store.path)));
  const manifest = workspaceManifest(root);
  if (normalized(store.path) !== normalized(join(root, '.kai', 'state', 'coordination.sqlite'))) {
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
    const contextRead = check(`item:${itemId}`, () => readContextView(store, {itemId, recentLimit: 8}));
    const context = contextRead.value;
    const item = context?.item ?? readRecord(store, 'item', itemId);
    if (!item) throw new RuntimeError('EVIDENCE_GAP', `item/${itemId} does not exist`);
    const throughSeq = context?.throughSeq ?? Number(store.database.prepare(
      'SELECT COALESCE(MAX(seq), 0) AS seq FROM events').get().seq);
    const cache = new Map();
    const recordsById = new Map();
    const list = (kind, id) => {
      const key = `${kind}\0${id}`;
      if (!cache.has(key)) {
        const records = listRecords(store, {kind, itemId: id});
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
    const artifacts = list('artifact', itemId).map(record => ({
      id: record.id, ref: `artifact:${record.id}`, version: record.version, ...record.body,
      status: matchesAcceptance(record.body, body) ? 'current' : 'historical',
      integrity: 'not-rechecked', assets: [],
    }));
    const assets = list('asset', itemId);
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
      const records = list(kind, itemId);
      const result = check(`${kind}s`, () => effectiveFn(records.map(r => r.body), body));
      const effectiveIds = result.ok ? new Set(result.value.map(b => b[idKey])) : null;
      verdicts[kind] = records.map(record => {
        const b = record.body;
        const recovery = b.kind === 'operator-recovery-resolution';
        const current = recovery ? b.criteria_ref === criteriaRef(body)
          && b.recovery.attempt_id === body.recovery_hold : matchesAcceptance(b, body);
        const actor = b.reviewer ?? b.authority ?? null;
        const independent = actor === null ? null : !isProducingRun(body, actor)
          && !artifacts.some(a => subjectEquals(a.subject, b.subject)
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
          } else {
            verifyVerdict(tx, item, b, actor);
            if (artifacts.some(a => a.status === 'current' && a.integrity === 'gap')) {
              throw new RuntimeError('EVIDENCE_GAP', 'Current subject artifact or asset has an integrity/validity gap.');
            }
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
      const requiredReviews = check('required-reviews', () => requireReviews(tx, item), 'broken-claim');
      if (!completion.ok || !requiredReviews.ok) completionClaims.forEach(c => { c.integrity = 'gap'; });
    }
    if (terminal.has(body.state) && body.state !== 'dropped' && !completionClaims.length) {
      addGap('completion', 'Recorded terminal state retained; current completion proof is missing or stale.');
    }
    const recordedPhase = body.state === 'blocked' ? body.resume_state : body.state;
    if (['release-ready', 'deploying', 'production-verification', 'shipped'].includes(recordedPhase)) {
      check('completion', () => completionApproval(tx, item), 'broken-claim');
      check('required-reviews', () => requireReviews(tx, item), 'broken-claim');
      check('release-evidence', () => requireReleaseEvidence(tx, item), 'broken-claim');
    }
    if (['deploying', 'production-verification', 'shipped'].includes(recordedPhase)) {
      check('deployment-start', () => requireOperatorApproval(tx, item, 'operator-deploy-start'), 'broken-claim');
    }
    if (['production-verification', 'shipped'].includes(recordedPhase)) {
      check('deployment-complete', () => requireOperatorApproval(tx, item, 'operator-deploy-complete'), 'broken-claim');
      check('deployment', () => requireDeploymentEvidence(tx, item, 'deployment'), 'broken-claim');
    }
    if (recordedPhase === 'shipped') {
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
        id: `criterion-${index + 1}`, text, criteriaRef: criteriaRef(body),
        status: bad ? 'gap' : good.length ? 'verified' : 'pending',
        verdictRefs: support.map(r => r.ref),
        evidenceRefs: [...new Set(support.flatMap(r => r.evidence_refs))],
        explanation: 'Exact criterion text matched to review criteria or observed check labels; item-level approval alone does not imply per-criterion coverage.',
      };
    });
    const references = new Set([
      ...body.context_artifacts,
      ...(context?.referencedDetails.map(d => d.reference) ?? []),
    ]);
    for (const reference of references) {
      const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
      if (!match) addGap(reference, 'Reference is not a registered artifact/evidence identity; not linked.');
      else if (!tx.get(match[1].toLowerCase(), match[2])) addGap(reference, 'Referenced record is missing.');
    }
    const questions = list('question', itemId).map(record => ({
      id: record.id, ref: `question:${record.id}`, version: record.version, ...record.body,
      disposition: terminal.has(body.state) ? 'historical-follow-up'
        : record.body.status === 'answered' ? 'addressed'
          : record.body.blocking ? 'blocking' : 'nonblocking',
    }));
    const blockers = questions.filter(q => q.disposition === 'blocking');
    const questionsById = new Map(questions.map(q => [q.id, q]));
    for (const id of body.waiting_on_questions) {
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
      if (!opening || opening.itemId !== itemId || opening.body.kind !== 'question') {
        addGap(question.ref, 'Question opening message is missing or mismatched.');
      }
      for (const id of question.answer_message_ids) {
        const answer = tx.get('message', id);
        if (!answer || answer.itemId !== itemId || answer.body.kind !== 'answer') {
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
      if (!attempt || attempt.itemId !== itemId || attempt.body.disposition !== 'conflicting-partial-work') {
        addGap(`attempt:${body.recovery_hold}`, 'Recovery hold attempt is missing or mismatched.');
      }
    }
    const dependencies = (context?.dependencies ?? body.depends_on.map(dependency => ({
      dependency, record: tx.get('item', dependency.item),
    }))).map(({dependency, record}) => ({
      item: dependency.item, requires: dependency.requires, state: record?.body.state ?? null,
      version: record?.version ?? null,
      status: !record ? 'missing' : record.body.state === 'dropped' ? 'failed'
        : itemStateSatisfies(record, dependency.requires) ? 'satisfied' : 'pending',
    }));
    for (const dependency of dependencies) {
      if (dependency.status === 'satisfied') continue;
      const ref = `item:${dependency.item}`;
      const ask = dependency.status === 'pending'
        ? `Waiting for ${dependency.item}: recorded ${dependency.state}; requires ${dependency.requires}.`
        : dependency.status === 'failed'
          ? `Dependency ${dependency.item} was dropped; recorded requirement ${dependency.requires} failed. Owner decision required.`
          : `Dependency ${dependency.item} is missing; restore evidence before resolving its requirement.`;
      addGap(ref, ask, dependency.status === 'pending' ? 'pending' : 'gap');
      if (!terminal.has(body.state)) blockers.push({ref, kind: 'dependency', status: dependency.status, ask});
    }
    const attempts = [
      ...list('host-attempt', itemId).map(r => ({id: r.id, ref: `host-attempt:${r.id}`, type: 'host', version: r.version, ...r.body})),
      ...list('attempt', itemId).map(r => ({id: r.id, ref: `attempt:${r.id}`, type: 'recovery', version: r.version, ...r.body})),
    ];
    const effects = list('effect', itemId).map(r => ({id: r.id, ref: `effect:${r.id}`, version: r.version, ...r.body}));
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
      const inScope = record.itemId === itemId && record.body.thread_id === itemId;
      if (!inScope) addGap(`message:${record.id}`, 'Message item/thread mismatches captured scope; content withheld.');
      return inScope;
    }).map(({record, eventSeq}) => ({
      id: record.id, ref: `message:${record.id}`, eventSeq, ...record.body,
    }));
    // Redact across records before making excerpts, so a bearer copied into prose
    // is removed even if its defining field is outside the selected excerpt.
    const inspection = {
      threadId: itemId, throughSeq,
      messagePages: captureHistory(store, itemId, throughSeq, addGap),
      artifactPreviews: captureArtifacts(root, artifacts, addGap),
    };
    inspection.previewBudget = {...artifactPreviewLimits,
      capturedBytes: inspection.artifactPreviews.reduce((sum, preview) => sum + preview.previewBytes, 0)};
    const changes = captureChanges(root, artifacts, addGap);
    const safe = redactReport({
      schema_version: 1,
      workspace: {id: manifest.workspace_id, root: normalized(root)},
      item: {...body, version: item.version, criteriaRef: criteriaRef(body)},
      decisions, criteria, artifacts, reviews, evidence, questions, blockers, attempts, effects,
      changes, inspection,
      messages: rawMessages, gaps, throughSeq, generatedAt: new Date().toISOString(),
      snapshotWarning,
      integrity: {
        status: gaps.some(g => g.severity !== 'pending') ? 'gap'
          : [...reviews, ...decisions, ...evidence].some(v => v.integrity === 'verified') ? 'verified' : 'pending',
        scope: 'Current proof checks only; not an acceptance decision or coverage total.',
      },
      obligations: {
        reviewRequirements: body.review_requirements,
        artifactExpectation: body.artifact_expectation,
        artifactReason: body.artifact_expectation_reason,
        artifactTargets: body.artifact_targets,
        dependencies,
      },
      history: {
        totalMessages: context?.messageCount ?? null,
        shownMessages: rawMessages.length,
        cursor: !context ? {threadId: itemId, beforeSeq: throughSeq + 1, remainingCount: null}
          : context.messageCount > rawMessages.length ? {
          threadId: itemId, beforeSeq: rawMessages[0]?.eventSeq ?? throughSeq + 1,
          remainingCount: context.messageCount - rawMessages.length,
        } : null,
        limitation: 'Recent message excerpts only (512 UTF-8 bytes each). Full and older messages are captured in linked offline pages from this same database snapshot. Verdicts, artifact registry metadata and question records below are not truncated. Artifact content previews have separately disclosed byte budgets.',
      },
    });
    safe.messages = safe.messages.map(({payload, ...message}) => ({...message, payloadExcerpt: excerpt(payload)}));
    return safe;
  });
}
