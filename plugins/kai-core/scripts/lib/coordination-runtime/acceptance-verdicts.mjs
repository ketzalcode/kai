import {canonicalJson, criteriaRef, isProducingRun, subjectEquals} from './contract.mjs';
import {fail} from './evidence-content.mjs';

export function matchesAcceptance(record, item) {
  return record.item_id === item.id
    && record.criteria_ref === criteriaRef(item)
    && subjectEquals(record.subject, item.change_ref);
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

export function effectiveReviews(reviews, item) {
  return effectiveRecords(
    reviews.filter(review => matchesAcceptance(review, item)),
    'review_id',
    review => canonicalJson([review.reviewer.role, review.kind]),
    review => !isProducingRun(item, review.reviewer),
  );
}

export function effectiveApprovals(approvals, item) {
  const relevant = approvals.filter(approval =>
    approval.kind === 'operator-recovery-resolution'
      ? approval.item_id === item.id && approval.criteria_ref === criteriaRef(item)
        && approval.recovery.attempt_id === item.recovery_hold
      : matchesAcceptance(approval, item));
  return effectiveRecords(
    relevant,
    'approval_id',
    approval => canonicalJson([approval.authority.role, approval.kind, approval.recovery?.attempt_id ?? null]),
    approval => approval.kind !== 'completion' || !isProducingRun(item, approval.authority),
  );
}

export function evidenceScope(record) {
  return canonicalJson([
    record.kind, record.dimension, record.data.environment ?? null, record.data.deployment_id ?? null,
  ]);
}

export function effectiveEvidence(evidence, item) {
  return effectiveRecords(
    evidence.filter(record => matchesAcceptance(record, item)),
    'evidence_id',
    evidenceScope,
    () => true,
  );
}
