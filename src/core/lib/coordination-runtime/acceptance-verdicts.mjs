import {canonicalJson, criteriaRef, isProducingRun, subjectEquals} from './contract.mjs';
import {fail} from './evidence-content.mjs';

const contentEquals = (left, right) =>
  left !== null && right !== null && canonicalJson(left) === canonicalJson(right);

export function matchesAcceptance(body, record, lookup) {
  return subjectEquals(body.subject, {kind: record.kind, id: record.id})
    && body.criteria_ref === criteriaRef(record, lookup)
    && (record.kind === 'task'
      ? contentEquals(body.content_ref, record.body.change_ref)
      : body.content_ref === null);
}

function effectiveRecords(records, idKey, scope, maySupersede) {
  const byId = new Map(records.map(record => [record[idKey], record]));
  const replaced = new Set();
  const visiting = new Set();
  const visited = new Set();
  const visit = record => {
    const id = record[idKey];
    if (visiting.has(id)) fail('EVIDENCE_GAP', 'verdict supersession contains a cycle');
    if (visited.has(id)) return;
    visiting.add(id);
    for (const priorId of record.supersedes) {
      const prior = byId.get(priorId);
      if (!prior || scope(prior) !== scope(record)) {
        fail('EVIDENCE_GAP', `${id} supersedes a missing or differently scoped verdict`);
      }
      if (!maySupersede(record)) {
        fail('AUTHORITY_REQUIRED', 'a producing run cannot supersede an independent verdict');
      }
      if (replaced.has(priorId)) fail('EVIDENCE_GAP', 'verdict supersession has conflicting successors');
      visit(prior);
      replaced.add(priorId);
    }
    visiting.delete(id);
    visited.add(id);
  };
  records.forEach(visit);
  return records.filter(record => !replaced.has(record[idKey]));
}

export function effectiveReviews(reviews, record, lookup) {
  return effectiveRecords(
    reviews.filter(review => matchesAcceptance(review, record, lookup)),
    'review_id',
    review => canonicalJson([review.reviewer.role, review.kind]),
    review => !isProducingRun(record.body, review.reviewer),
  );
}

export function effectiveApprovals(approvals, record, lookup) {
  const relevant = approvals.filter(approval =>
    approval.kind === 'operator-recovery-resolution'
      ? subjectEquals(approval.subject, {kind: record.kind, id: record.id})
        && approval.criteria_ref === criteriaRef(record, lookup)
        && approval.recovery.attempt_id === record.body.recovery_hold
      : matchesAcceptance(approval, record, lookup));
  return effectiveRecords(
    relevant,
    'approval_id',
    approval => canonicalJson([approval.authority.role, approval.kind, approval.recovery?.attempt_id ?? null]),
    approval => approval.kind !== 'completion'
      || record.kind !== 'task'
      || !isProducingRun(record.body, approval.authority),
  );
}

export function evidenceScope(record) {
  return canonicalJson([
    record.kind, record.dimension, record.data.environment ?? null, record.data.deployment_id ?? null,
  ]);
}

export function effectiveEvidence(evidence, record, lookup) {
  return effectiveRecords(
    evidence.filter(body => matchesAcceptance(body, record, lookup)),
    'evidence_id',
    evidenceScope,
    () => true,
  );
}
