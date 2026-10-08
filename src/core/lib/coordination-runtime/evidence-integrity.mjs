import {canonicalJson, criteriaRef, isProducingRun, subjectEquals} from './contract.mjs';
import {
  effectiveEvidence,
  evidenceScope,
  matchesAcceptance,
} from './acceptance-verdicts.mjs';
import {contextFor} from './evidence-context.mjs';
import {fail, pathPrivacy, verifyArtifact, verifyTarget} from './evidence-content.mjs';
import {verifyInputBasis, inputBasisCurrent} from './input-basis.mjs';
import {parseTypedArtifactRoute} from '../workspace-layout.mjs';

const contentEquals = (left, right) =>
  left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
const bindsSubject = (record, subject) => subjectEquals(record?.subject, subject);
const lookup = tx => (kind, id) => tx.get(kind, id);
const positiveEvidenceOutcomes = new Set(['clear', 'waived', 'passed']);

function hasPublicSafeExcerptPath(root, path) {
  if (pathPrivacy(root, path) === 'public') return true;
  try {
    const parsed = parseTypedArtifactRoute(path);
    return parsed.visibility === 'private'
      && parsed.routes.length === 1
      && parsed.routes[0].lifecycle === 'drafts';
  } catch {
    return false;
  }
}

function requirePositiveEffectiveEvidence(effective, record) {
  const scoped = effective.filter(candidate =>
    evidenceScope(candidate) === evidenceScope(record));
  if (!effective.some(candidate => candidate.evidence_id === record.evidence_id)
    || scoped.some(candidate => !positiveEvidenceOutcomes.has(candidate.outcome))) {
    fail('EVIDENCE_GAP',
      'superseded or negative evidence, including conflicting scoped evidence, cannot establish acceptance');
  }
}

export function hasPublicationHistory(asset) {
  return asset.history.some(h => ['published', 'retracted'].includes(h.disposition)
    || (h.target.startsWith('project:') && !h.target.endsWith(':@git') && h.validity === 'current'));
}

export function verifyAssetContent(context, tx, asset) {
  const artifact = tx.get('artifact', asset.artifact_id);
  if (!bindsSubject(artifact, asset.subject)) fail('EVIDENCE_GAP', 'asset has no registered artifact');
  verifyArtifact(context.root, artifact.body);
  verifyInputBasis(context, tx, artifact.body.input_basis ?? []);
  // Initial bundle retention manifests and Git object refs are not publication targets.
  const initial = artifact.body.content_ref.kind === 'sha256' ? artifact.body.content_ref.path
    : artifact.body.manifest_path ?? `project:${artifact.body.project_id}:@git`;
  if (asset.target !== initial || asset.history.some(h => ['working', 'published'].includes(h.disposition))) {
    verifyTarget(context.root, asset.target, artifact.body);
  }
  return artifact.body;
}

function verifyRegisteredArtifact(context, tx, record) {
  verifyInputBasis(context, tx, record.body.input_basis ?? []);
  const assets = tx.list('asset', record.subject)
    .filter(asset => asset.body.artifact_id === record.id);
  if (assets.length === 0) verifyArtifact(context.root, record.body);
  else assets.forEach(asset => verifyAssetContent(context, tx, asset.body));
}

function parentReportArtifact(context, tx, parent, reference, approvalId = null) {
  const match = /^artifact:([0-9a-f-]+)$/i.exec(reference);
  if (!match) {
    fail('EVIDENCE_GAP', 'parent completion proof must reference persisted report artifacts');
  }
  const artifact = tx.get('artifact', match[1]);
  if (!bindsSubject(artifact, {kind: parent.kind, id: parent.id})
    || artifact.body.classification !== 'public'
    || !artifactBasisCurrent(context, tx, parent, artifact.body)) {
    fail('EVIDENCE_GAP', 'parent completion report artifact is missing, stale, or not public');
  }
  const paths = artifact.body.content_ref.kind === 'git'
    ? []
    : artifact.body.content_ref.kind === 'sha256'
      ? [artifact.body.content_ref.path]
      : artifact.body.content_ref.entries.map(entry => entry.path);
  if (paths.some(path => !hasPublicSafeExcerptPath(context.root, path))) {
    fail('EVIDENCE_GAP', 'parent completion report artifact has no public safe-excerpt lane');
  }
  verifyRegisteredArtifact(context, tx, artifact);
  if (approvalId !== null) {
    const assets = tx.list('asset', artifact.subject)
      .filter(record => record.body.artifact_id === artifact.id
        && record.body.validity === 'current'
        && !new Set(['scratch', 'draft', 'discarded', 'retracted'])
          .has(record.body.disposition)
        && record.body.completion_approval_id === approvalId);
    if (assets.length !== 1
      || assets[0].body.history.at(-1).at_subject_version !== parent.version) {
      fail('EVIDENCE_GAP',
        'parent completion report artifact lacks one accepted current revision');
    }
    verifyAssetContent(context, tx, assets[0].body);
  }
  return artifact.body;
}

export function verifyParentCompletionEvidence(
  context,
  tx,
  parent,
  refs,
  {approvalId = null} = {},
) {
  if (parent.kind === 'task' || !Array.isArray(refs) || refs.length === 0
    || refs.some(reference => !/^artifact:([0-9a-f-]+)$/i.test(reference))
    || new Set(refs).size !== refs.length) {
    fail('EVIDENCE_GAP', 'parent completion requires exact accepted report artifact proof');
  }
  return refs.map(reference =>
    parentReportArtifact(context, tx, parent, reference, approvalId));
}

export function verifyParentCompletionApproval(
  context,
  tx,
  parent,
  refs,
  {approvalId = null} = {},
) {
  if (parent.kind === 'task' || !Array.isArray(refs) || refs.length === 0
    || new Set(refs).size !== refs.length) {
    fail('EVIDENCE_GAP', 'parent completion approval requires persisted parent-completion evidence');
  }
  const evidenceRefs = refs.filter(reference => /^evidence:([0-9a-f-]+)$/i.test(reference));
  const artifactRefs = refs.filter(reference => /^artifact:([0-9a-f-]+)$/i.test(reference));
  if (evidenceRefs.length === 0 || artifactRefs.length === 0
    || evidenceRefs.length + artifactRefs.length !== refs.length) {
    fail('EVIDENCE_GAP',
      'parent completion approval requires persisted evidence and explicit report artifacts');
  }
  const effective = effectiveEvidence(
    tx.list('evidence', {kind: parent.kind, id: parent.id}).map(record => record.body),
    parent,
    lookup(tx),
  );
  const evidenceArtifacts = new Set();
  for (const reference of evidenceRefs) {
    const id = reference.slice('evidence:'.length);
    const record = tx.get('evidence', id);
    if (!record || !subjectEquals(record.subject, {kind: parent.kind, id: parent.id})
      || record.body.kind !== 'parent-completion'
      || record.body.outcome !== 'passed'
      || record.body.provenance?.tier !== 'observed'
      || !effective.some(candidate => candidate.evidence_id === id)) {
      fail('EVIDENCE_GAP', 'parent completion evidence is missing, stale, negative, or cross-subject');
    }
    requirePositiveEffectiveEvidence(effective, record.body);
    for (const artifact of verifyParentCompletionEvidence(
      context,
      tx,
      parent,
      record.body.evidence_refs,
      {approvalId},
    )) {
      evidenceArtifacts.add(artifact.artifact_id);
    }
  }
  for (const reference of artifactRefs) {
    const artifact = parentReportArtifact(context, tx, parent, reference, approvalId);
    if (!evidenceArtifacts.has(artifact.artifact_id)) {
      fail('EVIDENCE_GAP',
        'explicitly accepted report artifact is not part of the parent completion evidence');
    }
  }
  return artifactRefs.map(reference => reference.slice('artifact:'.length));
}

export function artifactBasisCurrent(context, tx, item, artifact) {
  return artifact.criteria_ref === criteriaRef(item, lookup(tx))
    && (item.body.context_artifacts ?? [])
      .every(ref => artifact.input_basis?.some(b => b.reference === ref))
    && inputBasisCurrent(context, tx, artifact.input_basis ?? []);
}

export function subjectArtifact(context, tx, item, subject, acceptingActor = null) {
  if (item.kind !== 'task') fail('INVALID_INPUT', 'execution artifacts require a Task subject');
  const history = tx.list('artifact', {kind: 'task', id: item.id})
    .filter(record => contentEquals(record.body.content_ref, subject));
  if (acceptingActor && (isProducingRun(item.body, acceptingActor)
    || history.some(record => record.body.producer.runId === acceptingActor.runId))) {
    fail('AUTHORITY_REQUIRED', 'a producing run cannot independently accept its exact subject');
  }
  const candidates = history.filter(record => artifactBasisCurrent(context, tx, item, record.body));
  if (candidates.length === 0) fail('EVIDENCE_GAP', 'exact current subject has no registered retained artifact');
  for (const candidate of candidates) verifyRegisteredArtifact(context, tx, candidate);
}

export function verifyReferences(context, tx, item, refs, {recovery = false, positive = true} = {}) {
  const artifacts = [];
  const visit = (ref, seen) => {
    const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(ref);
    if (!match || seen.has(ref)) fail('EVIDENCE_GAP', 'references must name registered acyclic artifact/evidence records');
    const [, kind, id] = match;
    const record = tx.get(kind, id);
    if (!bindsSubject(record, {kind: item.kind, id: item.id})) {
      fail('EVIDENCE_GAP', 'referenced evidence is missing or belongs to another hierarchy subject');
    }
    if (kind === 'artifact') {
      if (!recovery && record.body.criteria_ref !== criteriaRef(item, lookup(tx))) {
        fail('EVIDENCE_GAP', 'artifact criteria changed');
      }
      verifyRegisteredArtifact(context, tx, record);
      artifacts.push(record.body);
    } else {
      if (!recovery && !matchesAcceptance(record.body, item, lookup(tx))) fail('EVIDENCE_GAP', 'referenced evidence is not current');
      if (!recovery && positive) {
        const effective = effectiveEvidence(
          tx.list('evidence', {kind: item.kind, id: item.id}).map(r => r.body),
          item,
          lookup(tx),
        );
        requirePositiveEffectiveEvidence(effective, record.body);
      }
      record.body.evidence_refs.forEach(child => visit(child, new Set([...seen, ref])));
    }
  };
  refs.forEach(ref => visit(ref, new Set()));
  return artifacts;
}

export function verifyVerdict(tx, item, verdict, actor = null) {
  const context = contextFor(tx);
  subjectArtifact(context, tx, item, verdict.content_ref, actor);
  verifyReferences(context, tx, item, [...verdict.evidence_refs, ...(verdict.finding_refs ?? [])]);
}
