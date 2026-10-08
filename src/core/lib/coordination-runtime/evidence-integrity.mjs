import {canonicalJson, criteriaRef, isProducingRun, subjectEquals} from './contract.mjs';
import {effectiveEvidence, evidenceScope, matchesAcceptance} from './acceptance-verdicts.mjs';
import {contextFor} from './evidence-context.mjs';
import {fail, verifyArtifact, verifyTarget} from './evidence-content.mjs';
import {verifyInputBasis, inputBasisCurrent} from './input-basis.mjs';

const contentEquals = (left, right) =>
  left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
const bindsSubject = (record, subject) => subjectEquals(record?.subject, subject);
const lookup = tx => (kind, id) => tx.get(kind, id);

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

export function artifactBasisCurrent(context, tx, item, artifact) {
  return artifact.criteria_ref === criteriaRef(item, lookup(tx))
    && item.body.context_artifacts.every(ref => artifact.input_basis?.some(b => b.reference === ref))
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
        const scoped = effective.filter(b => evidenceScope(b) === evidenceScope(record.body));
        if (!effective.some(b => b.evidence_id === id)
          || scoped.some(b => !new Set(['clear', 'waived', 'passed']).has(b.outcome))) {
          fail('EVIDENCE_GAP', 'superseded or negative evidence cannot establish acceptance');
        }
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
