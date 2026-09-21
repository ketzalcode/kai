import {
  RuntimeError, canonicalJson, commandDigest, criteriaRef, isProducingRun, operatorDecisionActor, subjectEquals,
  validateAuthority, validateCapture, validateCommand, validateOperatorDecision, validateRecord,
} from './contract.mjs';
import {
  effectiveApprovals, effectiveEvidence, effectiveReviews,
  recoveryResolution, requireOperatorApproval,
} from './acceptance.mjs';
import {
  leaseIsLive, requireActingAuthority, requireActorAvailable, requireHostActionGrant,
  requireNamedAuthority, requireRoleAvailable, sameActor,
} from './authority.mjs';
import {applyOperation} from './store.mjs';
import {normalized} from '../workspace-path-safety.mjs';
import {
  assertWorkspacePath, fail, pathPrivacy, retainSubject,
} from './evidence-content.mjs';
import {applyAssetTransition} from './evidence-assets.mjs';
import {bindEvidenceTransaction, contextFor} from './evidence-context.mjs';
import {subjectArtifact, verifyReferences} from './evidence-integrity.mjs';
import {captureInputBasis, artifactInputReferences, privacyRank} from './input-basis.mjs';

export {assertWorkspacePath, hashArtifact, hashBundle} from './evidence-content.mjs';
export {bindEvidenceRuntime} from './evidence-context.mjs';
export {verifyReferences} from './evidence-integrity.mjs';

const clone = value => JSON.parse(canonicalJson(value));

function ordinaryAuthority(tx, item, command, authority) {
  if (item.body.recovery_hold !== null) fail('RECOVERY_REQUIRED', 'operator recovery hold must be resolved first');
  if (item.body.lease === null && command.leaseToken !== null) fail('LEASE_CONFLICT', 'command carries a retired lease');
  requireActingAuthority(tx, item, command, authority, command.kind);
}

function produce(store, command, kind, authority, action) {
  validateCommand(command);
  if (command.kind !== kind) fail('INVALID_INPUT', `producer requires ${kind}`);
  const context = contextFor(store);
  const trusted = clone(authority ?? context.authority);
  validateAuthority(trusted);
  requireActorAvailable(command, trusted);
  const input = clone(command);
  return applyOperation(store, input, (item, tx) => {
    bindEvidenceTransaction(store, tx);
    action({context, item, tx, command: input, authority: trusted});
    // Registration serializes against the item, but never changes lifecycle or criteria.
    return item.body;
  });
}

function putNew(tx, kind, id, item, body) {
  if (tx.get(kind, id)) fail('VERSION_CONFLICT', `${kind}/${id} already exists; history is immutable`);
  tx.put(validateRecord({kind, id, itemId: item.id, version: 1, body}));
}

function currentBinding(body, item, {recovery = false} = {}) {
  if (body.item_id !== item.id || body.criteria_ref !== (recovery ? null : criteriaRef(item.body))
    || (!recovery && !subjectEquals(body.subject, item.body.change_ref))
    || (recovery && body.subject !== null)) {
    fail('EVIDENCE_GAP', 'record must bind the current item, exact subject, and criteria');
  }
}

function independent(item, actor) {
  if (isProducingRun(item.body, actor)) fail('AUTHORITY_REQUIRED', 'every producing run is excluded from independent acceptance');
}

function contentEntries(subject) {
  return subject.kind === 'sha256' ? [{path: subject.path, digest: subject.digest}]
    : subject.kind === 'bundle-sha256' ? subject.entries : [];
}

function operatorDecision(context, command) {
  const supplied = context.verifyOperatorDecision?.(clone(command)) ?? null;
  let proof;
  try {
    proof = clone(supplied);
    validateOperatorDecision(proof);
  } catch (error) {
    if (!(error instanceof RuntimeError) || error.code !== 'INVALID_INPUT') throw error;
    fail('AUTHORITY_REQUIRED', 'an actual host interaction or attributed supplied operator decision is required');
  }
  const body = command.payload.body;
  for (const key of ['item_id', 'subject', 'criteria_ref', 'kind', 'decision', 'deployment', 'recovery']) {
    if (canonicalJson(proof[key]) !== canonicalJson(body[key])) {
      fail('AUTHORITY_REQUIRED', 'operator decision does not bind the exact approval claim');
    }
  }
  if (Date.parse(proof.captured_at) > Date.now()) fail('AUTHORITY_REQUIRED', 'operator decision cannot be future-dated');
  return Object.fromEntries(['source', 'reference', 'attributed_to', 'captured_at'].map(key => [key, proof[key]]));
}

export function registerArtifact(store, command) {
  return produce(store, command, 'artifact.register', undefined, ({context, item, tx, command, authority}) => {
    const p = command.payload;
    if (p.recoveryLeaseToken !== undefined) {
      requireNamedAuthority(tx, command, authority, command.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease)
        || item.body.lease.token !== p.recoveryLeaseToken || command.leaseToken !== null) {
        fail('RECOVERY_REQUIRED', 'recovery artifacts require the exact expired lease and no acting lease');
      }
    } else {
      ordinaryAuthority(tx, item, command, authority);
    }
    if (tx.get('artifact', p.artifactId) || tx.get('asset', p.assetId)) fail('VERSION_CONFLICT', 'artifact and asset identities must be new');
    const run = context.runs.find(run => sameActor(run.actor, command.actor));
    if (!run) fail('AUTHORITY_REQUIRED', 'actor has no approved producing run directory');
    const entries = contentEntries(p.subject);
    const sourcePaths = entries.map(entry => entry.path);
    const registered = tx.list('artifact');
    const requirePrivacy = ({subject, classification}) => {
      if (privacyRank[p.classification] < privacyRank[classification]) {
        fail('INVALID_INPUT', 'derived artifacts cannot downgrade applicable input privacy');
      }
      const selected = contentEntries(subject);
      if (selected.some(entry => privacyRank[p.classification] < privacyRank[pathPrivacy(context.root, entry.path)])) {
        fail('INVALID_INPUT', 'derived artifacts cannot downgrade resolved source privacy');
      }
      const paths = new Set(selected.map(e => normalized(assertWorkspacePath(context.root, e.path))));
      for (const previous of registered) {
        if ((subjectEquals(subject, previous.body.subject) || contentEntries(previous.body.subject).some(prior =>
          selected.some(entry => entry.digest === prior.digest)
          || paths.has(normalized(assertWorkspacePath(context.root, prior.path)))))
          && privacyRank[p.classification] < privacyRank[previous.body.classification]) {
          fail('INVALID_INPUT', 'a caller label cannot downgrade registered source privacy');
        }
      }
    };
    requirePrivacy({subject: p.subject, classification: p.classification});
    for (const path of sourcePaths) {
      if (!path.startsWith(`${run.directory}/`) && !item.body.artifact_targets.includes(path)) {
        fail('AUTHORITY_REQUIRED', 'artifact source is outside the approved run and declared targets');
      }
      if ((path.startsWith('project:') && p.classification !== 'public')
        || (pathPrivacy(context.root, path) === 'personal' && p.classification !== 'personal')) {
        fail('INVALID_INPUT', 'artifact classification conflicts with source privacy');
      }
    }
    const inputBasis = captureInputBasis(context, tx, artifactInputReferences(item.body, p.inputAssetIds), new Set(), requirePrivacy);
    // Filesystem output is intentionally not deleted on transaction failure.
    const retained = retainSubject(context.root, p.subject, p.projectId, run.directory, p.artifactId);
    putNew(tx, 'artifact', p.artifactId, item, {
      schema_version: 1, artifact_id: p.artifactId, item_id: item.id, producer: command.actor,
      subject: p.subject, criteria_ref: criteriaRef(item.body), project_id: p.projectId,
      run_directory: run.directory, ...retained, classification: p.classification,
      media_type: p.mediaType, title: p.title, created_at: p.at,
      input_basis: inputBasis,
    });
    const target = p.subject.kind === 'sha256' ? p.subject.path
      : retained.manifest_path ?? `project:${p.projectId}:@git`;
    const disposition = sourcePaths.some(path => pathPrivacy(context.root, path) === 'personal') ? 'personal' : 'scratch';
    putNew(tx, 'asset', p.assetId, item, {
      schema_version: 1, asset_id: p.assetId, item_id: item.id, artifact_id: p.artifactId,
      revision: 1, producer: command.actor, completion_authority: item.body.completion_authority,
      validity_owner: item.body.validity_owner, disposition, validity: 'provisional', target,
      completion_approval_id: null, input_asset_ids: p.inputAssetIds,
      supersedes: null, superseded_by: null, updated_at: p.at,
      history: [{
        disposition, validity: 'provisional', target, reason: 'Registered exact output',
        at: p.at, at_item_version: command.expectedVersion,
      }],
    });
  });
}

export function recordReview(store, command) {
  return produce(store, command, 'review.record', undefined, ({context, item, tx, command, authority}) => {
    ordinaryAuthority(tx, item, command, authority);
    const b = command.payload.body;
    if (!sameActor(b.reviewer, command.actor)) fail('AUTHORITY_REQUIRED', 'review actor must match the command');
    independent(item, command.actor);
    currentBinding(b, item);
    if (b.kind === 'product-design-acceptance'
      && (command.actor.role !== item.body.completion_authority
        || item.body.producing_actors.some(actor => actor.role === command.actor.role))) {
      fail('AUTHORITY_REQUIRED', 'product design acceptance requires an independent completion authority');
    }
    subjectArtifact(context, tx, item, b.subject, command.actor);
    verifyReferences(context, tx, item, [...b.evidence_refs, ...b.finding_refs], {positive: b.verdict === 'approved'});
    effectiveReviews([...tx.list('review', item.id).map(r => r.body), b], item.body);
    putNew(tx, 'review', b.review_id, item, b);
  });
}

export function recordApproval(store, command, authority) {
  return produce(store, command, 'approval.record', authority, ({context, item, tx, command, authority}) => {
    const b = command.payload.body;
    if (!sameActor(b.authority, command.actor)) fail('AUTHORITY_REQUIRED', 'approval actor must match the command');
    const needsHuman = command.actor.role === 'operator' || item.body.artifact_class === 'paid-media';
    let provenance;
    if (needsHuman) {
      requireHostActionGrant(command, authority, command.kind);
      provenance = operatorDecision(context, command);
    }
    // The runner transports an operator decision; it is not the human deciding.
    // This identity is derived only after the host verifier binds the exact claim.
    const decisionActor = command.actor.role === 'operator'
      ? operatorDecisionActor(provenance)
      : command.actor;
    independent(item, decisionActor);
    const recovery = b.kind === 'operator-recovery-resolution';
    if (recovery) {
      requireNamedAuthority(tx, command, authority, command.kind, 'operator');
      const attempt = tx.get('attempt', b.recovery.attempt_id);
      if (b.criteria_ref !== criteriaRef(item.body) || item.body.recovery_hold !== b.recovery.attempt_id
        || !attempt || attempt.itemId !== item.id || attempt.body.disposition !== 'conflicting-partial-work'
        || attempt.body.stale_lease.token !== b.recovery.stale_lease_token) {
        fail('AUTHORITY_REQUIRED', 'operator recovery resolution requires the exact current conflicting attempt');
      }
      requireRoleAvailable(b.recovery.resume_role, authority, 'recovery resume');
    } else {
      if (command.actor.role === 'operator') {
        if (item.body.recovery_hold !== null || (item.body.lease !== null && !leaseIsLive(item.body.lease))) {
          fail('RECOVERY_REQUIRED', 'ordinary operator decisions cannot bypass lease recovery');
        }
        if (command.leaseToken !== null) fail('LEASE_CONFLICT', 'operator decisions do not borrow an execution lease');
        requireHostActionGrant(command, authority, command.kind);
      } else {
        ordinaryAuthority(tx, item, command, authority);
      }
      currentBinding(b, item);
      subjectArtifact(context, tx, item, b.subject, decisionActor);
      const role = b.kind === 'completion' ? item.body.completion_authority
        : b.kind === 'scope' ? item.body.scope_authority : 'operator';
      if (command.actor.role !== role) fail('AUTHORITY_REQUIRED', 'approval must come from its declared authority');
    }
    verifyReferences(context, tx, item, b.evidence_refs, {recovery, positive: b.decision === 'approved'});
    const body = {...b, authority: decisionActor, recorded_at_item_version: command.expectedVersion, ...(provenance ? {provenance} : {})};
    const effective = effectiveApprovals([...tx.list('approval', item.id).map(r => r.body), body], item.body);
    const deployments = effective.filter(a => a.deployment !== null && a.decision === 'approved');
    if (new Set(deployments.map(a => canonicalJson(a.deployment))).size > 1) {
      fail('AUTHORITY_REQUIRED', 'operator confirmations disagree about the production deployment');
    }
    putNew(tx, 'approval', b.approval_id, item, body);
    if (recovery && b.decision === 'approved') recoveryResolution(tx, item, b.approval_id);
  });
}

export function registerEvidence(store, command, capture) {
  return produce(store, command, 'evidence.register', undefined, ({context, item, tx, command, authority}) => {
    const b = command.payload.body;
    const recovery = b.kind === 'recovery-reconciliation';
    if (recovery) {
      requireNamedAuthority(tx, command, authority, command.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease)
        || item.body.lease.token !== b.data.stale_lease_token) {
        fail('RECOVERY_REQUIRED', 'reconciliation must observe the exact expired lease');
      }
    } else {
      ordinaryAuthority(tx, item, command, authority);
    }
    currentBinding(b, item, {recovery});
    if (!recovery) subjectArtifact(context, tx, item, b.subject, b.outcome === 'waived' ? command.actor : null);
    const artifacts = verifyReferences(context, tx, item, b.evidence_refs, {recovery});
    let observation = null;
    if (command.payload.tier === 'observed') {
      if (!context.verifyCapture) fail('INVALID_INPUT', 'agent paste or a source label is not observed capture');
      observation = clone(context.verifyCapture(clone(command), capture));
      validateCapture(observation);
      const positive = new Set(['passed', 'clear', 'waived']).has(b.outcome);
      if (observation.command_digest !== commandDigest(command)
        || !sameActor(observation.actor, command.actor)
        || (positive && (observation.exit_code !== 0 || observation.checks.length === 0))
        || observation.captured_at !== b.created_at || Date.parse(observation.captured_at) > Date.now()
        || (b.kind === 'production-verification' && b.data.checks.some(check => !observation.checks.includes(check)))) {
        fail('EVIDENCE_GAP', 'capture does not cover this actor, result, time, and complete claimed checks');
      }
      const privacy = {public: 0, internal: 1, confidential: 2, personal: 3};
      if (artifacts.some(a => privacy[a.classification] < privacy[observation.classification])) {
        fail('EVIDENCE_GAP', 'captured confidential data requires equally private evidence storage');
      }
      if (recovery && Date.parse(observation.captured_at) < Date.parse(item.body.lease.expires_at)) {
        fail('EVIDENCE_GAP', 'recovery capture predates lease expiry');
      }
    } else if (!new Set(['gap', 'failed']).has(b.outcome) || recovery) {
      fail('EVIDENCE_GAP', 'a declaration cannot establish observed success, waiver, or recovery');
    }
    if (b.outcome === 'waived') {
      requireNamedAuthority(tx, command, authority, command.kind, item.body.completion_authority);
      independent(item, command.actor);
      if (artifacts.some(a => a.producer.runId === command.actor.runId)) {
        fail('AUTHORITY_REQUIRED', 'a producing run cannot waive verification of its own supporting artifacts');
      }
    }
    if (b.kind === 'deployment' || b.kind === 'production-verification') {
      const start = requireOperatorApproval(tx, item, 'operator-deploy-start');
      const complete = requireOperatorApproval(tx, item, 'operator-deploy-complete');
      if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment)
        || b.data.environment !== start.deployment.environment
        || b.data.deployment_id !== start.deployment.deployment_id) {
        fail('AUTHORITY_REQUIRED', 'capture must match the operator-confirmed production deployment');
      }
    }
    const body = {...b, provenance: {tier: command.payload.tier, capture: observation}};
    if (!recovery) effectiveEvidence([...tx.list('evidence', item.id).map(r => r.body), body], item.body);
    putNew(tx, 'evidence', b.evidence_id, item, body);
  });
}

export function transitionAsset(store, command, authority) {
  return produce(store, command, 'asset.transition', authority, ({context, item, tx, command, authority}) => {
    ordinaryAuthority(tx, item, command, authority);
    applyAssetTransition({context, item, tx, command, authority});
  });
}
