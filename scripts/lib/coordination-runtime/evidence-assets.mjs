import {criteriaRef, isProducingRun, operatorDecisionActor, subjectEquals} from './contract.mjs';
import {effectiveApprovals, requireReviews} from './acceptance.mjs';
import {requireActingAuthority, sameActor} from './authority.mjs';
import {assertWorkspacePath, fail, verifyTarget} from './evidence-content.mjs';
import {hasPublicationHistory, verifyAssetContent, verifyVerdict} from './evidence-integrity.mjs';

const DISPOSITION = new Map([
  ['scratch', ['draft', 'discarded']],
  ['draft', ['working', 'discarded']],
  ['working', ['published', 'archived']],
  ['published', ['archived', 'retracted']],
  ['personal', ['archived', 'discarded']],
  ['archived', []], ['retracted', []], ['discarded', []],
]);
const VALIDITY = new Map([
  ['unknown', ['provisional', 'current', 'stale', 'superseded', 'invalidated', 'retired']],
  ['provisional', ['current', 'stale', 'superseded', 'invalidated', 'retired']],
  ['current', ['stale', 'superseded', 'invalidated', 'retired']],
  ['stale', ['current', 'expired', 'superseded', 'invalidated', 'retired']],
  ['expired', ['superseded', 'invalidated', 'retired']],
  ['superseded', []], ['invalidated', []], ['retired', []],
]);

function artifactFor(context, tx, asset, verify = true) {
  if (verify) return verifyAssetContent(context, tx, asset);
  const artifact = tx.get('artifact', asset.artifact_id);
  if (!artifact || artifact.itemId !== asset.item_id) fail('EVIDENCE_GAP', 'asset has no registered artifact');
  return artifact.body;
}

function accepted(tx, item, asset, artifact, approvalId) {
  requireReviews(tx, item);
  const approvals = effectiveApprovals(tx.list('approval', item.id).map(r => r.body), item.body)
    .filter(a => a.kind === 'completion' && a.authority.role === item.body.completion_authority);
  const decision = approvals.find(a => a.approval_id === approvalId);
  if (!decision || approvals.some(a => a.decision !== 'approved')
    || isProducingRun(item.body, decision.authority)
    || decision.authority.runId === asset.producer.runId
    || !subjectEquals(decision.subject, artifact.subject)
    || artifact.criteria_ref !== criteriaRef(item.body)
    || !decision.evidence_refs.includes(`artifact:${artifact.artifact_id}`)) {
    fail('EVIDENCE_GAP', 'asset acceptance requires an effective independent decision for these exact bytes and criteria');
  }
  verifyVerdict(tx, item, decision, decision.authority);
  return decision;
}

function inputsCurrent(context, tx, asset, seen = new Set()) {
  if (seen.has(asset.asset_id)) fail('EVIDENCE_GAP', 'asset inputs contain a cycle');
  seen = new Set([...seen, asset.asset_id]);
  return asset.input_asset_ids.every(id => {
    const input = tx.get('asset', id)?.body;
    if (!input || input.validity !== 'current' || input.superseded_by !== null
      || new Set(['scratch', 'draft', 'discarded', 'retracted']).has(input.disposition)) return false;
    const item = tx.get('item', input.item_id);
    const artifact = artifactFor(context, tx, input);
    accepted(tx, item, input, artifact, input.completion_approval_id);
    return inputsCurrent(context, tx, input, seen);
  });
}

function moved(record, changes, reason, at, itemVersion) {
  const body = {...record.body, ...changes, updated_at: at};
  body.history = [...body.history, {
    disposition: body.disposition, validity: body.validity, target: body.target, reason, at, at_item_version: itemVersion,
  }];
  return {...record, version: record.version + 1, body};
}

export function applyAssetTransition({context, tx, item, command, authority}) {
  const p = command.payload;
  const record = tx.get('asset', p.assetId);
  if (!record || record.itemId !== item.id) fail('EVIDENCE_GAP', 'asset transition must bind the owning item');
  const asset = record.body;
  if ((p.disposition !== asset.disposition && !DISPOSITION.get(asset.disposition).includes(p.disposition))
    || (p.validity !== asset.validity && !VALIDITY.get(asset.validity).includes(p.validity))) {
    fail('INVALID_INPUT', 'asset disposition or validity transition is not allowed');
  }
  const personalDiscard = asset.disposition === 'personal' && p.disposition === 'discarded';
  if (p.disposition === 'discarded'
    && (p.validity === 'current' || (!personalDiscard && p.approvalId !== null)
      || asset.completion_approval_id !== null || asset.history.some(h =>
      new Set(['working', 'published']).has(h.disposition)))) {
    fail('INVALID_INPUT', 'accepted or team-facing working assets cannot be discarded');
  }
  if (personalDiscard) {
    const decisions = effectiveApprovals(tx.list('approval', item.id).map(r => r.body), item.body)
      .filter(a => a.kind === 'scope' && a.authority.role === 'operator');
    const consent = decisions.find(a => a.approval_id === p.approvalId);
    if (command.actor.role !== 'operator' || !consent?.provenance
      || decisions.some(a => a.decision !== 'approved')
      || !consent.evidence_refs.includes(`artifact:${asset.artifact_id}`)) {
      fail('AUTHORITY_REQUIRED', 'discarding personal output requires persisted actual operator consent');
    }
  }
  if (command.actor.runId !== asset.producer.runId
    && ![asset.validity_owner, item.body.completion_authority, item.body.scope_authority, 'operator'].includes(command.actor.role)) {
    fail('AUTHORITY_REQUIRED', 'asset changes require its producer, validity owner, or named authority');
  }
  const unchangedTarget = p.target === null || p.target === asset.target;
  const target = p.target ?? asset.target;
  const publishedBefore = hasPublicationHistory(asset);
  if (publishedBefore && !unchangedTarget) fail('INVALID_INPUT', 'published history remains at its canonical path');
  if (!unchangedTarget && !item.body.artifact_targets.includes(target)) {
    fail('AUTHORITY_REQUIRED', 'target is not a declared item artifact target');
  }
  const publishing = p.disposition === 'published' && asset.disposition !== 'published';
  const metadataOnlyInvalidation = unchangedTarget
    && new Set(['stale', 'expired', 'invalidated', 'retired']).has(p.validity)
    && p.supersedes === null && p.approvalId === null && !publishing;
  const artifact = artifactFor(context, tx, asset, !metadataOnlyInvalidation);
  let validity = p.validity;
  const approvalId = personalDiscard ? asset.completion_approval_id : p.approvalId ?? asset.completion_approval_id;
  const publicTarget = target.startsWith('project:')
    && !(artifact.subject.kind === 'git' && target === `project:${artifact.project_id}:@git`);
  if (publicTarget && !(metadataOnlyInvalidation && publishedBefore)) {
    if (artifact.classification !== 'public' || validity !== 'current'
      || asset.history.some(h => h.disposition === 'personal')) {
      fail('INVALID_INPUT', 'public placement requires current accepted public bytes; personal assets cannot promote');
    }
  }
  if (publishing && (!publicTarget || validity !== 'current')) {
    fail('INVALID_INPUT', 'publication requires a current accepted project-qualified target');
  }
  if (p.supersedes !== null && (validity !== 'current'
    || !['working', 'published', 'archived'].includes(p.disposition))) {
    fail('EVIDENCE_GAP', 'supersession requires a current accepted durable successor');
  }
  if (p.approvalId !== null && !personalDiscard) accepted(tx, item, asset, artifact, approvalId);
  if (validity === 'current' || publishing || p.supersedes !== null || (publicTarget && !metadataOnlyInvalidation)) {
    if (new Set(['stale', 'unknown']).has(asset.validity)
      && (p.approvalId === null || p.approvalId === asset.completion_approval_id)) {
      fail('EVIDENCE_GAP', 'revalidation requires a fresh explicit independent acceptance');
    }
    const operatorDecision = command.actor.role === 'operator' ? accepted(tx, item, asset, artifact, approvalId) : null;
    const applyingHumanDecision = operatorDecision?.provenance
      && sameActor(operatorDecision.authority, operatorDecisionActor(operatorDecision.provenance));
    if ((isProducingRun(item.body, command.actor) || asset.producer.runId === command.actor.runId) && !applyingHumanDecision) {
      fail('AUTHORITY_REQUIRED', 'a producing run cannot close its own asset');
    }
    const decision = operatorDecision ?? accepted(tx, item, asset, artifact, approvalId);
    if (new Set(['stale', 'unknown']).has(asset.validity)
      && !(decision.recorded_at_item_version > asset.history.at(-1).at_item_version)) {
      fail('EVIDENCE_GAP', 'revalidation cannot reuse acceptance recorded before the validity change');
    }
    if (!inputsCurrent(context, tx, asset)) {
      if (publicTarget || publishing || p.supersedes !== null) {
        fail('EVIDENCE_GAP', 'incomplete accepted inputs cannot publish or supersede');
      }
      validity = 'provisional';
    }
  }
  if (p.validity === 'superseded' && asset.superseded_by === null) {
    fail('INVALID_INPUT', 'supersession must be requested by the successor');
  }
  if (p.disposition === 'working' && !target.startsWith('.kai/state/')) {
    fail('INVALID_INPUT', 'working assets require a declared private state target');
  } else if (p.disposition === 'personal' && !target.startsWith('.kai/personal/')) {
    fail('INVALID_INPUT', 'personal assets must remain in the personal lane');
  }
  if (!metadataOnlyInvalidation && (target !== asset.target || publicTarget)) {
    assertWorkspacePath(context.root, target);
    verifyTarget(context.root, target, artifact);
  }
  if (p.supersedes !== null) {
    if (p.supersedes === asset.asset_id || (asset.supersedes !== null && asset.supersedes !== p.supersedes)) {
      fail('EVIDENCE_GAP', 'successor already has a different predecessor or supersedes itself');
    }
    const previous = tx.get('asset', p.supersedes);
    if (!previous || previous.body.superseded_by !== null
      || !VALIDITY.get(previous.body.validity).includes('superseded')
      || new Set(['retracted', 'discarded']).has(previous.body.disposition)) {
      fail('EVIDENCE_GAP', 'predecessor cannot be superseded or already has a conflicting successor');
    }
    const predecessorItem = tx.get('item', previous.itemId);
    if (!predecessorItem || predecessorItem.body.recovery_hold !== null) fail('RECOVERY_REQUIRED', 'predecessor is under recovery hold');
    if (previous.itemId !== item.id) {
      requireActingAuthority(tx, predecessorItem, {
        ...command, recordId: predecessorItem.id, expectedVersion: predecessorItem.version, leaseToken: null,
      }, authority, command.kind);
      if (isProducingRun(predecessorItem.body, command.actor)) fail('AUTHORITY_REQUIRED', 'predecessor production history requires independence');
    }
    const previousArtifact = artifactFor(context, tx, previous.body);
    if (previous.body.validity === 'current') {
      accepted(tx, predecessorItem, previous.body, previousArtifact, previous.body.completion_approval_id);
    }
    tx.put(moved(previous, {validity: 'superseded', superseded_by: asset.asset_id}, p.reason, p.at, predecessorItem.version));
  }
  tx.put(moved(record, {
    disposition: p.disposition, validity, target, completion_approval_id: approvalId,
    supersedes: p.supersedes ?? asset.supersedes,
  }, p.reason, p.at, item.version));
}
