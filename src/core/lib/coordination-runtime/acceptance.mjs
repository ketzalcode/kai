import {
  DOD_DIMENSIONS,
  RuntimeError,
  canonicalJson,
  isProducingRun,
} from './contract.mjs';
import {effectiveApprovals, effectiveEvidence, effectiveReviews} from './acceptance-verdicts.mjs';
import {contextFor} from './evidence-context.mjs';
import {
  verifyParentCompletionApproval,
  verifyVerdict,
} from './evidence-integrity.mjs';

export {effectiveApprovals, effectiveEvidence, effectiveReviews, matchesAcceptance} from './acceptance-verdicts.mjs';

function fail(code, message) {
  throw new RuntimeError(code, message);
}

function taskOnly(record, action) {
  if (record.kind !== 'task') fail('INVALID_INPUT', `${action} requires a Task subject`);
}

function lookup(tx) {
  return (kind, id) => tx.get(kind, id);
}

function bodies(tx, kind, record) {
  return tx.list(kind, {kind: record.kind, id: record.id}).map(entry => entry.body);
}

export function requireReviews(tx, item) {
  taskOnly(item, 'review requirements');
  const reviews = effectiveReviews(bodies(tx, 'review', item), item, lookup(tx));
  for (const requirement of item.body.review_requirements) {
    const matching = reviews.filter(review =>
      review.reviewer.role === requirement.role && review.kind === requirement.kind);
    if (matching.length === 0) {
      fail('EVIDENCE_GAP', `task/${item.id} lacks current ${requirement.role} ${requirement.kind} review`);
    }
    const independent = matching.filter(review => !isProducingRun(item.body, review.reviewer));
    if (independent.length === 0) {
      fail('AUTHORITY_REQUIRED', 'a producing run cannot review its own subject');
    }
    if (independent.some(review => review.verdict !== 'approved')) {
      fail('EVIDENCE_GAP', `task/${item.id} has an unresolved negative ${requirement.kind} review`);
    }
    if (requirement.kind === 'product-design-acceptance'
      && (requirement.role !== item.body.completion_authority
        || item.body.producing_actors.some(actor => actor.role === requirement.role))) {
      fail('AUTHORITY_REQUIRED', 'product-design acceptance requires an independent completion authority');
    }
    independent.forEach(review => verifyVerdict(tx, item, review, review.reviewer));
  }
}

export function completionApproval(tx, item) {
  const matching = effectiveApprovals(bodies(tx, 'approval', item), item, lookup(tx)).filter(approval =>
    approval.kind === 'completion' && approval.authority.role === item.body.completion_authority);
  if (matching.length === 0) {
    fail('EVIDENCE_GAP',
      `${item.kind}/${item.id} lacks current completion-authority approval`);
  }
  if (item.kind !== 'task') {
    if (matching.some(approval => approval.decision !== 'approved'
      || approval.recorded_at_subject_version !== item.version)) {
      fail('EVIDENCE_GAP',
        'an effective parent completion decision rejects or predates the current revision');
    }
    const context = contextFor(tx);
    matching.forEach(approval => verifyParentCompletionApproval(
      context,
      tx,
      item,
      approval.evidence_refs,
      {approvalId: approval.approval_id},
    ));
    return matching[0];
  }
  const independent = matching.filter(approval => !isProducingRun(item.body, approval.authority));
  if (independent.length === 0) fail('AUTHORITY_REQUIRED', 'a producing run cannot accept its own work');
  if (independent.some(approval => approval.decision !== 'approved')) {
    fail('EVIDENCE_GAP', 'an effective completion decision rejects the current work');
  }
  independent.forEach(approval => verifyVerdict(tx, item, approval, approval.authority));
  return independent[0];
}

export function requireReleaseEvidence(tx, item) {
  taskOnly(item, 'release evidence');
  const evidence = effectiveEvidence(bodies(tx, 'evidence', item), item, lookup(tx))
    .filter(record => record.kind === 'dod-dimension');
  for (const dimension of DOD_DIMENSIONS) {
    const matching = evidence.filter(record => record.dimension === dimension);
    if (matching.length === 0 || matching.some(record => record.outcome === 'gap')) {
      fail('EVIDENCE_GAP', `task/${item.id} lacks accepted ${dimension} evidence for its current criteria`);
    }
    matching.forEach(record => verifyVerdict(tx, item, record));
  }
}

export function requireOperatorApproval(tx, item, kind) {
  taskOnly(item, 'deployment approval');
  const approvals = effectiveApprovals(bodies(tx, 'approval', item), item, lookup(tx)).filter(approval =>
    approval.kind === kind && approval.authority.role === 'operator');
  if (approvals.length === 0 || approvals.some(approval => approval.decision !== 'approved')) {
    fail('AUTHORITY_REQUIRED', `task/${item.id} lacks effective ${kind} operator confirmation`);
  }
  if (new Set(approvals.map(approval => canonicalJson(approval.deployment))).size !== 1) {
    fail('AUTHORITY_REQUIRED', 'operator confirmations disagree about the production deployment');
  }
  approvals.forEach(approval => verifyVerdict(tx, item, approval, approval.authority));
  return approvals[0];
}

export function requireDeploymentEvidence(tx, item, kind) {
  taskOnly(item, 'deployment evidence');
  const start = requireOperatorApproval(tx, item, 'operator-deploy-start');
  const complete = requireOperatorApproval(tx, item, 'operator-deploy-complete');
  if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment)) {
    fail('AUTHORITY_REQUIRED', 'deployment completion does not match the confirmed production start');
  }
  const evidence = effectiveEvidence(bodies(tx, 'evidence', item), item, lookup(tx)).filter(record =>
    record.kind === kind
    && record.data.environment === start.deployment.environment
    && record.data.deployment_id === start.deployment.deployment_id);
  if (evidence.length === 0 || evidence.some(record => record.outcome !== 'passed')) {
    fail('EVIDENCE_GAP', `task/${item.id} lacks passed ${kind} evidence for the confirmed production deployment`);
  }
  evidence.forEach(record => verifyVerdict(tx, item, record));
}

export function recoveryResolution(tx, item, approvalId) {
  taskOnly(item, 'recovery resolution');
  const approvals = effectiveApprovals(bodies(tx, 'approval', item), item, lookup(tx)).filter(approval =>
    approval.kind === 'operator-recovery-resolution' && approval.authority.role === 'operator');
  const approval = approvals.find(candidate => candidate.approval_id === approvalId);
  const attempt = tx.get('attempt', item.body.recovery_hold);
  if (!approval || approvals.some(candidate => candidate.decision !== 'approved')
    || new Set(approvals.map(candidate => canonicalJson(candidate.recovery))).size !== 1
    || attempt?.subject?.kind !== 'task' || attempt.subject.id !== item.id
    || attempt.body.disposition !== 'conflicting-partial-work'
    || attempt.body.stale_lease.token !== approval.recovery.stale_lease_token) {
    fail('AUTHORITY_REQUIRED', 'conflicting partial work requires exact persisted operator resolution');
  }
  return approval;
}
