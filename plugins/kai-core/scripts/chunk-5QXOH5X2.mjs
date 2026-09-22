import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  applyOperation,
  artifactInputReferences,
  assertWorkspacePath,
  bindEvidenceTransaction,
  captureInputBasis,
  contextFor,
  effectiveApprovals,
  effectiveEvidence,
  effectiveReviews,
  fail,
  hasPublicationHistory,
  leaseIsLive,
  normalized,
  pathPrivacy,
  privacyRank,
  recoveryResolution,
  requireActingAuthority,
  requireActorAvailable,
  requireHostActionGrant,
  requireNamedAuthority,
  requireOperatorApproval,
  requireReviews,
  requireRoleAvailable,
  retainSubject,
  sameActor,
  subjectArtifact,
  verifyAssetContent,
  verifyReferences,
  verifyTarget,
  verifyVerdict
} from "./chunk-SQAAX6CQ.mjs";
import {
  RuntimeError,
  canonicalJson,
  commandDigest,
  criteriaRef,
  isProducingRun,
  operatorDecisionActor,
  subjectEquals,
  validateAuthority,
  validateCapture,
  validateCommand,
  validateOperatorDecision,
  validateRecord
} from "./chunk-VP4QXWCX.mjs";

// src/core/lib/coordination-runtime/evidence-assets.mjs
var DISPOSITION = /* @__PURE__ */ new Map([
  ["scratch", ["draft", "discarded"]],
  ["draft", ["working", "discarded"]],
  ["working", ["published", "archived"]],
  ["published", ["archived", "retracted"]],
  ["personal", ["archived", "discarded"]],
  ["archived", []],
  ["retracted", []],
  ["discarded", []]
]);
var VALIDITY = /* @__PURE__ */ new Map([
  ["unknown", ["provisional", "current", "stale", "superseded", "invalidated", "retired"]],
  ["provisional", ["current", "stale", "superseded", "invalidated", "retired"]],
  ["current", ["stale", "superseded", "invalidated", "retired"]],
  ["stale", ["current", "expired", "superseded", "invalidated", "retired"]],
  ["expired", ["superseded", "invalidated", "retired"]],
  ["superseded", []],
  ["invalidated", []],
  ["retired", []]
]);
function artifactFor(context, tx, asset, verify = true) {
  if (verify) return verifyAssetContent(context, tx, asset);
  const artifact = tx.get("artifact", asset.artifact_id);
  if (!artifact || artifact.itemId !== asset.item_id) fail("EVIDENCE_GAP", "asset has no registered artifact");
  return artifact.body;
}
function accepted(tx, item, asset, artifact, approvalId) {
  requireReviews(tx, item);
  const approvals = effectiveApprovals(tx.list("approval", item.id).map((r) => r.body), item.body).filter((a) => a.kind === "completion" && a.authority.role === item.body.completion_authority);
  const decision = approvals.find((a) => a.approval_id === approvalId);
  if (!decision || approvals.some((a) => a.decision !== "approved") || isProducingRun(item.body, decision.authority) || decision.authority.runId === asset.producer.runId || !subjectEquals(decision.subject, artifact.subject) || artifact.criteria_ref !== criteriaRef(item.body) || !decision.evidence_refs.includes(`artifact:${artifact.artifact_id}`)) {
    fail("EVIDENCE_GAP", "asset acceptance requires an effective independent decision for these exact bytes and criteria");
  }
  verifyVerdict(tx, item, decision, decision.authority);
  return decision;
}
function inputsCurrent(context, tx, asset, seen = /* @__PURE__ */ new Set()) {
  if (seen.has(asset.asset_id)) fail("EVIDENCE_GAP", "asset inputs contain a cycle");
  seen = /* @__PURE__ */ new Set([...seen, asset.asset_id]);
  return asset.input_asset_ids.every((id) => {
    const input = tx.get("asset", id)?.body;
    if (!input || input.validity !== "current" || input.superseded_by !== null || (/* @__PURE__ */ new Set(["scratch", "draft", "discarded", "retracted"])).has(input.disposition)) return false;
    const item = tx.get("item", input.item_id);
    const artifact = artifactFor(context, tx, input);
    accepted(tx, item, input, artifact, input.completion_approval_id);
    return inputsCurrent(context, tx, input, seen);
  });
}
function moved(record, changes, reason, at, itemVersion) {
  const body = { ...record.body, ...changes, updated_at: at };
  body.history = [...body.history, {
    disposition: body.disposition,
    validity: body.validity,
    target: body.target,
    reason,
    at,
    at_item_version: itemVersion
  }];
  return { ...record, version: record.version + 1, body };
}
function applyAssetTransition({ context, tx, item, command, authority }) {
  const p = command.payload;
  const record = tx.get("asset", p.assetId);
  if (!record || record.itemId !== item.id) fail("EVIDENCE_GAP", "asset transition must bind the owning item");
  const asset = record.body;
  if (p.disposition !== asset.disposition && !DISPOSITION.get(asset.disposition).includes(p.disposition) || p.validity !== asset.validity && !VALIDITY.get(asset.validity).includes(p.validity)) {
    fail("INVALID_INPUT", "asset disposition or validity transition is not allowed");
  }
  const personalDiscard = asset.disposition === "personal" && p.disposition === "discarded";
  if (p.disposition === "discarded" && (p.validity === "current" || !personalDiscard && p.approvalId !== null || asset.completion_approval_id !== null || asset.history.some((h) => (/* @__PURE__ */ new Set(["working", "published"])).has(h.disposition)))) {
    fail("INVALID_INPUT", "accepted or team-facing working assets cannot be discarded");
  }
  if (personalDiscard) {
    const decisions = effectiveApprovals(tx.list("approval", item.id).map((r) => r.body), item.body).filter((a) => a.kind === "scope" && a.authority.role === "operator");
    const consent = decisions.find((a) => a.approval_id === p.approvalId);
    if (command.actor.role !== "operator" || !consent?.provenance || decisions.some((a) => a.decision !== "approved") || !consent.evidence_refs.includes(`artifact:${asset.artifact_id}`)) {
      fail("AUTHORITY_REQUIRED", "discarding personal output requires persisted actual operator consent");
    }
  }
  if (command.actor.runId !== asset.producer.runId && ![asset.validity_owner, item.body.completion_authority, item.body.scope_authority, "operator"].includes(command.actor.role)) {
    fail("AUTHORITY_REQUIRED", "asset changes require its producer, validity owner, or named authority");
  }
  const unchangedTarget = p.target === null || p.target === asset.target;
  const target = p.target ?? asset.target;
  const publishedBefore = hasPublicationHistory(asset);
  if (publishedBefore && !unchangedTarget) fail("INVALID_INPUT", "published history remains at its canonical path");
  if (!unchangedTarget && !item.body.artifact_targets.includes(target)) {
    fail("AUTHORITY_REQUIRED", "target is not a declared item artifact target");
  }
  const publishing = p.disposition === "published" && asset.disposition !== "published";
  const metadataOnlyInvalidation = unchangedTarget && (/* @__PURE__ */ new Set(["stale", "expired", "invalidated", "retired"])).has(p.validity) && p.supersedes === null && p.approvalId === null && !publishing;
  const artifact = artifactFor(context, tx, asset, !metadataOnlyInvalidation);
  let validity = p.validity;
  const approvalId = personalDiscard ? asset.completion_approval_id : p.approvalId ?? asset.completion_approval_id;
  const publicTarget = target.startsWith("project:") && !(artifact.subject.kind === "git" && target === `project:${artifact.project_id}:@git`);
  if (publicTarget && !(metadataOnlyInvalidation && publishedBefore)) {
    if (artifact.classification !== "public" || validity !== "current" || asset.history.some((h) => h.disposition === "personal")) {
      fail("INVALID_INPUT", "public placement requires current accepted public bytes; personal assets cannot promote");
    }
  }
  if (publishing && (!publicTarget || validity !== "current")) {
    fail("INVALID_INPUT", "publication requires a current accepted project-qualified target");
  }
  if (p.supersedes !== null && (validity !== "current" || !["working", "published", "archived"].includes(p.disposition))) {
    fail("EVIDENCE_GAP", "supersession requires a current accepted durable successor");
  }
  if (p.approvalId !== null && !personalDiscard) accepted(tx, item, asset, artifact, approvalId);
  if (validity === "current" || publishing || p.supersedes !== null || publicTarget && !metadataOnlyInvalidation) {
    if ((/* @__PURE__ */ new Set(["stale", "unknown"])).has(asset.validity) && (p.approvalId === null || p.approvalId === asset.completion_approval_id)) {
      fail("EVIDENCE_GAP", "revalidation requires a fresh explicit independent acceptance");
    }
    const operatorDecision2 = command.actor.role === "operator" ? accepted(tx, item, asset, artifact, approvalId) : null;
    const applyingHumanDecision = operatorDecision2?.provenance && sameActor(operatorDecision2.authority, operatorDecisionActor(operatorDecision2.provenance));
    if ((isProducingRun(item.body, command.actor) || asset.producer.runId === command.actor.runId) && !applyingHumanDecision) {
      fail("AUTHORITY_REQUIRED", "a producing run cannot close its own asset");
    }
    const decision = operatorDecision2 ?? accepted(tx, item, asset, artifact, approvalId);
    if ((/* @__PURE__ */ new Set(["stale", "unknown"])).has(asset.validity) && !(decision.recorded_at_item_version > asset.history.at(-1).at_item_version)) {
      fail("EVIDENCE_GAP", "revalidation cannot reuse acceptance recorded before the validity change");
    }
    if (!inputsCurrent(context, tx, asset)) {
      if (publicTarget || publishing || p.supersedes !== null) {
        fail("EVIDENCE_GAP", "incomplete accepted inputs cannot publish or supersede");
      }
      validity = "provisional";
    }
  }
  if (p.validity === "superseded" && asset.superseded_by === null) {
    fail("INVALID_INPUT", "supersession must be requested by the successor");
  }
  if (p.disposition === "working" && !target.startsWith(".kai/state/")) {
    fail("INVALID_INPUT", "working assets require a declared private state target");
  } else if (p.disposition === "personal" && !target.startsWith(".kai/personal/")) {
    fail("INVALID_INPUT", "personal assets must remain in the personal lane");
  }
  if (!metadataOnlyInvalidation && (target !== asset.target || publicTarget)) {
    assertWorkspacePath(context.root, target);
    verifyTarget(context.root, target, artifact);
  }
  if (p.supersedes !== null) {
    if (p.supersedes === asset.asset_id || asset.supersedes !== null && asset.supersedes !== p.supersedes) {
      fail("EVIDENCE_GAP", "successor already has a different predecessor or supersedes itself");
    }
    const previous = tx.get("asset", p.supersedes);
    if (!previous || previous.body.superseded_by !== null || !VALIDITY.get(previous.body.validity).includes("superseded") || (/* @__PURE__ */ new Set(["retracted", "discarded"])).has(previous.body.disposition)) {
      fail("EVIDENCE_GAP", "predecessor cannot be superseded or already has a conflicting successor");
    }
    const predecessorItem = tx.get("item", previous.itemId);
    if (!predecessorItem || predecessorItem.body.recovery_hold !== null) fail("RECOVERY_REQUIRED", "predecessor is under recovery hold");
    if (previous.itemId !== item.id) {
      requireActingAuthority(tx, predecessorItem, {
        ...command,
        recordId: predecessorItem.id,
        expectedVersion: predecessorItem.version,
        leaseToken: null
      }, authority, command.kind);
      if (isProducingRun(predecessorItem.body, command.actor)) fail("AUTHORITY_REQUIRED", "predecessor production history requires independence");
    }
    const previousArtifact = artifactFor(context, tx, previous.body);
    if (previous.body.validity === "current") {
      accepted(tx, predecessorItem, previous.body, previousArtifact, previous.body.completion_approval_id);
    }
    tx.put(moved(previous, { validity: "superseded", superseded_by: asset.asset_id }, p.reason, p.at, predecessorItem.version));
  }
  tx.put(moved(record, {
    disposition: p.disposition,
    validity,
    target,
    completion_approval_id: approvalId,
    supersedes: p.supersedes ?? asset.supersedes
  }, p.reason, p.at, item.version));
}

// src/core/lib/coordination-runtime/evidence.mjs
var clone = (value) => JSON.parse(canonicalJson(value));
function ordinaryAuthority(tx, item, command, authority) {
  if (item.body.recovery_hold !== null) fail("RECOVERY_REQUIRED", "operator recovery hold must be resolved first");
  if (item.body.lease === null && command.leaseToken !== null) fail("LEASE_CONFLICT", "command carries a retired lease");
  requireActingAuthority(tx, item, command, authority, command.kind);
}
function produce(store, command, kind, authority, action) {
  validateCommand(command);
  if (command.kind !== kind) fail("INVALID_INPUT", `producer requires ${kind}`);
  const context = contextFor(store);
  const trusted = clone(authority ?? context.authority);
  validateAuthority(trusted);
  requireActorAvailable(command, trusted);
  const input = clone(command);
  return applyOperation(store, input, (item, tx) => {
    bindEvidenceTransaction(store, tx);
    action({ context, item, tx, command: input, authority: trusted });
    return item.body;
  });
}
function putNew(tx, kind, id, item, body) {
  if (tx.get(kind, id)) fail("VERSION_CONFLICT", `${kind}/${id} already exists; history is immutable`);
  tx.put(validateRecord({ kind, id, itemId: item.id, version: 1, body }));
}
function currentBinding(body, item, { recovery = false } = {}) {
  if (body.item_id !== item.id || body.criteria_ref !== (recovery ? null : criteriaRef(item.body)) || !recovery && !subjectEquals(body.subject, item.body.change_ref) || recovery && body.subject !== null) {
    fail("EVIDENCE_GAP", "record must bind the current item, exact subject, and criteria");
  }
}
function independent(item, actor) {
  if (isProducingRun(item.body, actor)) fail("AUTHORITY_REQUIRED", "every producing run is excluded from independent acceptance");
}
function contentEntries(subject) {
  return subject.kind === "sha256" ? [{ path: subject.path, digest: subject.digest }] : subject.kind === "bundle-sha256" ? subject.entries : [];
}
function operatorDecision(context, command) {
  const supplied = context.verifyOperatorDecision?.(clone(command)) ?? null;
  let proof;
  try {
    proof = clone(supplied);
    validateOperatorDecision(proof);
  } catch (error) {
    if (!(error instanceof RuntimeError) || error.code !== "INVALID_INPUT") throw error;
    fail("AUTHORITY_REQUIRED", "an actual host interaction or attributed supplied operator decision is required");
  }
  const body = command.payload.body;
  for (const key of ["item_id", "subject", "criteria_ref", "kind", "decision", "deployment", "recovery"]) {
    if (canonicalJson(proof[key]) !== canonicalJson(body[key])) {
      fail("AUTHORITY_REQUIRED", "operator decision does not bind the exact approval claim");
    }
  }
  if (Date.parse(proof.captured_at) > Date.now()) fail("AUTHORITY_REQUIRED", "operator decision cannot be future-dated");
  return Object.fromEntries(["source", "reference", "attributed_to", "captured_at"].map((key) => [key, proof[key]]));
}
function registerArtifact(store, command) {
  return produce(store, command, "artifact.register", void 0, ({ context, item, tx, command: command2, authority }) => {
    const p = command2.payload;
    if (p.recoveryLeaseToken !== void 0) {
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease) || item.body.lease.token !== p.recoveryLeaseToken || command2.leaseToken !== null) {
        fail("RECOVERY_REQUIRED", "recovery artifacts require the exact expired lease and no acting lease");
      }
    } else {
      ordinaryAuthority(tx, item, command2, authority);
    }
    if (tx.get("artifact", p.artifactId) || tx.get("asset", p.assetId)) fail("VERSION_CONFLICT", "artifact and asset identities must be new");
    const run = context.runs.find((run2) => sameActor(run2.actor, command2.actor));
    if (!run) fail("AUTHORITY_REQUIRED", "actor has no approved producing run directory");
    const entries = contentEntries(p.subject);
    const sourcePaths = entries.map((entry) => entry.path);
    const registered = tx.list("artifact");
    const requirePrivacy = ({ subject, classification }) => {
      if (privacyRank[p.classification] < privacyRank[classification]) {
        fail("INVALID_INPUT", "derived artifacts cannot downgrade applicable input privacy");
      }
      const selected = contentEntries(subject);
      if (selected.some((entry) => privacyRank[p.classification] < privacyRank[pathPrivacy(context.root, entry.path)])) {
        fail("INVALID_INPUT", "derived artifacts cannot downgrade resolved source privacy");
      }
      const paths = new Set(selected.map((e) => normalized(assertWorkspacePath(context.root, e.path))));
      for (const previous of registered) {
        if ((subjectEquals(subject, previous.body.subject) || contentEntries(previous.body.subject).some((prior) => selected.some((entry) => entry.digest === prior.digest) || paths.has(normalized(assertWorkspacePath(context.root, prior.path))))) && privacyRank[p.classification] < privacyRank[previous.body.classification]) {
          fail("INVALID_INPUT", "a caller label cannot downgrade registered source privacy");
        }
      }
    };
    requirePrivacy({ subject: p.subject, classification: p.classification });
    for (const path of sourcePaths) {
      if (!path.startsWith(`${run.directory}/`) && !item.body.artifact_targets.includes(path)) {
        fail("AUTHORITY_REQUIRED", "artifact source is outside the approved run and declared targets");
      }
      if (path.startsWith("project:") && p.classification !== "public" || pathPrivacy(context.root, path) === "personal" && p.classification !== "personal") {
        fail("INVALID_INPUT", "artifact classification conflicts with source privacy");
      }
    }
    const inputBasis = captureInputBasis(context, tx, artifactInputReferences(item.body, p.inputAssetIds), /* @__PURE__ */ new Set(), requirePrivacy);
    const retained = retainSubject(context.root, p.subject, p.projectId, run.directory, p.artifactId);
    putNew(tx, "artifact", p.artifactId, item, {
      schema_version: 1,
      artifact_id: p.artifactId,
      item_id: item.id,
      producer: command2.actor,
      subject: p.subject,
      criteria_ref: criteriaRef(item.body),
      project_id: p.projectId,
      run_directory: run.directory,
      ...retained,
      classification: p.classification,
      media_type: p.mediaType,
      title: p.title,
      created_at: p.at,
      input_basis: inputBasis
    });
    const target = p.subject.kind === "sha256" ? p.subject.path : retained.manifest_path ?? `project:${p.projectId}:@git`;
    const disposition = sourcePaths.some((path) => pathPrivacy(context.root, path) === "personal") ? "personal" : "scratch";
    putNew(tx, "asset", p.assetId, item, {
      schema_version: 1,
      asset_id: p.assetId,
      item_id: item.id,
      artifact_id: p.artifactId,
      revision: 1,
      producer: command2.actor,
      completion_authority: item.body.completion_authority,
      validity_owner: item.body.validity_owner,
      disposition,
      validity: "provisional",
      target,
      completion_approval_id: null,
      input_asset_ids: p.inputAssetIds,
      supersedes: null,
      superseded_by: null,
      updated_at: p.at,
      history: [{
        disposition,
        validity: "provisional",
        target,
        reason: "Registered exact output",
        at: p.at,
        at_item_version: command2.expectedVersion
      }]
    });
  });
}
function recordReview(store, command) {
  return produce(store, command, "review.record", void 0, ({ context, item, tx, command: command2, authority }) => {
    ordinaryAuthority(tx, item, command2, authority);
    const b = command2.payload.body;
    if (!sameActor(b.reviewer, command2.actor)) fail("AUTHORITY_REQUIRED", "review actor must match the command");
    independent(item, command2.actor);
    currentBinding(b, item);
    if (b.kind === "product-design-acceptance" && (command2.actor.role !== item.body.completion_authority || item.body.producing_actors.some((actor) => actor.role === command2.actor.role))) {
      fail("AUTHORITY_REQUIRED", "product design acceptance requires an independent completion authority");
    }
    subjectArtifact(context, tx, item, b.subject, command2.actor);
    verifyReferences(context, tx, item, [...b.evidence_refs, ...b.finding_refs], { positive: b.verdict === "approved" });
    effectiveReviews([...tx.list("review", item.id).map((r) => r.body), b], item.body);
    putNew(tx, "review", b.review_id, item, b);
  });
}
function recordApproval(store, command, authority) {
  return produce(store, command, "approval.record", authority, ({ context, item, tx, command: command2, authority: authority2 }) => {
    const b = command2.payload.body;
    if (!sameActor(b.authority, command2.actor)) fail("AUTHORITY_REQUIRED", "approval actor must match the command");
    const needsHuman = command2.actor.role === "operator" || item.body.artifact_class === "paid-media";
    let provenance;
    if (needsHuman) {
      requireHostActionGrant(command2, authority2, command2.kind);
      provenance = operatorDecision(context, command2);
    }
    const decisionActor = command2.actor.role === "operator" ? operatorDecisionActor(provenance) : command2.actor;
    independent(item, decisionActor);
    const recovery = b.kind === "operator-recovery-resolution";
    if (recovery) {
      requireNamedAuthority(tx, command2, authority2, command2.kind, "operator");
      const attempt = tx.get("attempt", b.recovery.attempt_id);
      if (b.criteria_ref !== criteriaRef(item.body) || item.body.recovery_hold !== b.recovery.attempt_id || !attempt || attempt.itemId !== item.id || attempt.body.disposition !== "conflicting-partial-work" || attempt.body.stale_lease.token !== b.recovery.stale_lease_token) {
        fail("AUTHORITY_REQUIRED", "operator recovery resolution requires the exact current conflicting attempt");
      }
      requireRoleAvailable(b.recovery.resume_role, authority2, "recovery resume");
    } else {
      if (command2.actor.role === "operator") {
        if (item.body.recovery_hold !== null || item.body.lease !== null && !leaseIsLive(item.body.lease)) {
          fail("RECOVERY_REQUIRED", "ordinary operator decisions cannot bypass lease recovery");
        }
        if (command2.leaseToken !== null) fail("LEASE_CONFLICT", "operator decisions do not borrow an execution lease");
        requireHostActionGrant(command2, authority2, command2.kind);
      } else {
        ordinaryAuthority(tx, item, command2, authority2);
      }
      currentBinding(b, item);
      subjectArtifact(context, tx, item, b.subject, decisionActor);
      const role = b.kind === "completion" ? item.body.completion_authority : b.kind === "scope" ? item.body.scope_authority : "operator";
      if (command2.actor.role !== role) fail("AUTHORITY_REQUIRED", "approval must come from its declared authority");
    }
    verifyReferences(context, tx, item, b.evidence_refs, { recovery, positive: b.decision === "approved" });
    const body = { ...b, authority: decisionActor, recorded_at_item_version: command2.expectedVersion, ...provenance ? { provenance } : {} };
    const effective = effectiveApprovals([...tx.list("approval", item.id).map((r) => r.body), body], item.body);
    const deployments = effective.filter((a) => a.deployment !== null && a.decision === "approved");
    if (new Set(deployments.map((a) => canonicalJson(a.deployment))).size > 1) {
      fail("AUTHORITY_REQUIRED", "operator confirmations disagree about the production deployment");
    }
    putNew(tx, "approval", b.approval_id, item, body);
    if (recovery && b.decision === "approved") recoveryResolution(tx, item, b.approval_id);
  });
}
function registerEvidence(store, command, capture) {
  return produce(store, command, "evidence.register", void 0, ({ context, item, tx, command: command2, authority }) => {
    const b = command2.payload.body;
    const recovery = b.kind === "recovery-reconciliation";
    if (recovery) {
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease) || item.body.lease.token !== b.data.stale_lease_token) {
        fail("RECOVERY_REQUIRED", "reconciliation must observe the exact expired lease");
      }
    } else {
      ordinaryAuthority(tx, item, command2, authority);
    }
    currentBinding(b, item, { recovery });
    if (!recovery) subjectArtifact(context, tx, item, b.subject, b.outcome === "waived" ? command2.actor : null);
    const artifacts = verifyReferences(context, tx, item, b.evidence_refs, { recovery });
    let observation = null;
    if (command2.payload.tier === "observed") {
      if (!context.verifyCapture) fail("INVALID_INPUT", "agent paste or a source label is not observed capture");
      observation = clone(context.verifyCapture(clone(command2), capture));
      validateCapture(observation);
      const positive = (/* @__PURE__ */ new Set(["passed", "clear", "waived"])).has(b.outcome);
      if (observation.command_digest !== commandDigest(command2) || !sameActor(observation.actor, command2.actor) || positive && (observation.exit_code !== 0 || observation.checks.length === 0) || observation.captured_at !== b.created_at || Date.parse(observation.captured_at) > Date.now() || b.kind === "production-verification" && b.data.checks.some((check) => !observation.checks.includes(check))) {
        fail("EVIDENCE_GAP", "capture does not cover this actor, result, time, and complete claimed checks");
      }
      const privacy = { public: 0, internal: 1, confidential: 2, personal: 3 };
      if (artifacts.some((a) => privacy[a.classification] < privacy[observation.classification])) {
        fail("EVIDENCE_GAP", "captured confidential data requires equally private evidence storage");
      }
      if (recovery && Date.parse(observation.captured_at) < Date.parse(item.body.lease.expires_at)) {
        fail("EVIDENCE_GAP", "recovery capture predates lease expiry");
      }
    } else if (!(/* @__PURE__ */ new Set(["gap", "failed"])).has(b.outcome) || recovery) {
      fail("EVIDENCE_GAP", "a declaration cannot establish observed success, waiver, or recovery");
    }
    if (b.outcome === "waived") {
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.completion_authority);
      independent(item, command2.actor);
      if (artifacts.some((a) => a.producer.runId === command2.actor.runId)) {
        fail("AUTHORITY_REQUIRED", "a producing run cannot waive verification of its own supporting artifacts");
      }
    }
    if (b.kind === "deployment" || b.kind === "production-verification") {
      const start = requireOperatorApproval(tx, item, "operator-deploy-start");
      const complete = requireOperatorApproval(tx, item, "operator-deploy-complete");
      if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment) || b.data.environment !== start.deployment.environment || b.data.deployment_id !== start.deployment.deployment_id) {
        fail("AUTHORITY_REQUIRED", "capture must match the operator-confirmed production deployment");
      }
    }
    const body = { ...b, provenance: { tier: command2.payload.tier, capture: observation } };
    if (!recovery) effectiveEvidence([...tx.list("evidence", item.id).map((r) => r.body), body], item.body);
    putNew(tx, "evidence", b.evidence_id, item, body);
  });
}
function transitionAsset(store, command, authority) {
  return produce(store, command, "asset.transition", authority, ({ context, item, tx, command: command2, authority: authority2 }) => {
    ordinaryAuthority(tx, item, command2, authority2);
    applyAssetTransition({ context, item, tx, command: command2, authority: authority2 });
  });
}

export {
  registerArtifact,
  recordReview,
  recordApproval,
  registerEvidence,
  transitionAsset
};
