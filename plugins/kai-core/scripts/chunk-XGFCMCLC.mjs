import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  artifactInputReferences,
  assertWorkspacePath,
  bindEvidenceTransaction,
  captureInputBasis,
  contextFor,
  currentDirectionForStore,
  effectiveApprovals,
  effectiveEvidence,
  effectiveReviews,
  fail as fail2,
  hasPublicationHistory,
  hasStaleDirection,
  leaseIsLive,
  parentHandlers,
  pathPrivacy,
  privacyRank,
  recoveryResolution,
  requireActingAuthority,
  requireActorAvailable,
  requireHostActionGrant,
  requireLeasedActingAuthority,
  requireNamedAuthority,
  requireOperatorApproval,
  requireReviews,
  requireRoleAvailable,
  retainSubject,
  sameActor,
  subjectArtifact,
  taskHandlers,
  taskPlan,
  verifyAssetContent,
  verifyParentCompletionApproval,
  verifyParentCompletionEvidence,
  verifyReferences,
  verifyTarget,
  verifyVerdict
} from "./chunk-CKXCYZWQ.mjs";
import {
  applyOperation,
  readMessageOperation
} from "./chunk-S7AQGXMM.mjs";
import {
  RuntimeError,
  approvedProfileModel,
  assertExactKeys,
  canonicalJson,
  clone,
  commandDigest,
  commandKind,
  criteriaRef,
  fail,
  isPlainObject,
  isProducingRun,
  operatorDecisionActor,
  subjectEquals,
  text,
  validateAuthority,
  validateCapabilities,
  validateCapture,
  validateCommand,
  validateOperatorDecision,
  validateRecord
} from "./chunk-HMPQ32NA.mjs";
import {
  normalized,
  parseTypedArtifactRoute
} from "./chunk-VVVMKUAL.mjs";

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
var contentEquals = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var lookup = (tx) => (kind, id) => tx.get(kind, id);
var routeIdentity = (route) => [route.pack, route.type, route.subtype, route.id, route.members];
function typedRoute(path, visibility) {
  const local = path.replace(/^project:[a-z][a-z0-9-]*:/, "");
  try {
    const parsed = parseTypedArtifactRoute(local);
    if (parsed.visibility !== visibility) {
      fail2("INVALID_INPUT", `${visibility} placement requires a typed ${visibility} artifact route`);
    }
    return parsed;
  } catch (error) {
    if (error?.code) throw error;
    fail2("INVALID_INPUT", error.message);
  }
}
function subjectPack(item) {
  return item.kind === "epic" ? "core" : item.body.pack;
}
function artifactFor(context, tx, asset, verify = true) {
  if (verify) return verifyAssetContent(context, tx, asset);
  const artifact = tx.get("artifact", asset.artifact_id);
  if (artifact?.subject?.kind !== asset.subject.kind || artifact.subject.id !== asset.subject.id) {
    fail2("EVIDENCE_GAP", "asset has no registered artifact");
  }
  return artifact.body;
}
function accepted(context, tx, item, asset, artifact, approvalId) {
  if (item.kind === "task") requireReviews(tx, item);
  const approvals = effectiveApprovals(
    tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
    item,
    lookup(tx)
  ).filter((a) => a.kind === "completion" && a.authority.role === item.body.completion_authority);
  const decision = approvals.find((a) => a.approval_id === approvalId);
  if (!decision || approvals.some((a) => a.decision !== "approved") || item.kind === "task" && isProducingRun(item.body, decision.authority) || decision.authority.runId === asset.producer.runId || artifact.criteria_ref !== criteriaRef(item, lookup(tx)) || item.kind === "task" && (!contentEquals(decision.content_ref, artifact.content_ref) || !decision.evidence_refs.includes(`artifact:${artifact.artifact_id}`))) {
    fail2("EVIDENCE_GAP", "asset acceptance requires an effective independent decision for these exact bytes and criteria");
  }
  if (item.kind === "task") {
    verifyVerdict(tx, item, decision, decision.authority);
  } else {
    const acceptedArtifacts = verifyParentCompletionApproval(
      context,
      tx,
      item,
      decision.evidence_refs
    );
    if (!acceptedArtifacts.includes(artifact.artifact_id)) {
      fail2(
        "EVIDENCE_GAP",
        "parent asset acceptance requires this exact report artifact in the completion proof"
      );
    }
  }
  return decision;
}
function inputsCurrent(context, tx, asset, seen = /* @__PURE__ */ new Set()) {
  if (seen.has(asset.asset_id)) fail2("EVIDENCE_GAP", "asset inputs contain a cycle");
  seen = /* @__PURE__ */ new Set([...seen, asset.asset_id]);
  return asset.input_asset_ids.every((id) => {
    const input = tx.get("asset", id)?.body;
    if (!input || input.validity !== "current" || input.superseded_by !== null || (/* @__PURE__ */ new Set(["scratch", "draft", "discarded", "retracted"])).has(input.disposition)) return false;
    const item = tx.get(input.subject.kind, input.subject.id);
    const artifact = artifactFor(context, tx, input);
    accepted(context, tx, item, input, artifact, input.completion_approval_id);
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
    at_subject_version: itemVersion
  }];
  return { ...record, version: record.version + 1, body };
}
function applyAssetTransition({ context, tx, item, command, authority }) {
  const p = command.payload;
  const record = tx.get("asset", p.assetId);
  if (record?.subject?.kind !== item.kind || record.subject.id !== item.id) {
    fail2("EVIDENCE_GAP", "asset transition must bind the owning hierarchy subject");
  }
  const asset = record.body;
  if (p.disposition !== asset.disposition && !DISPOSITION.get(asset.disposition).includes(p.disposition) || p.validity !== asset.validity && !VALIDITY.get(asset.validity).includes(p.validity)) {
    fail2("INVALID_INPUT", "asset disposition or validity transition is not allowed");
  }
  const personalDiscard = asset.disposition === "personal" && p.disposition === "discarded";
  if (p.disposition === "discarded" && (p.validity === "current" || !personalDiscard && p.approvalId !== null || asset.completion_approval_id !== null || asset.history.some((h) => (/* @__PURE__ */ new Set(["working", "published"])).has(h.disposition)))) {
    fail2("INVALID_INPUT", "accepted or team-facing working assets cannot be discarded");
  }
  if (personalDiscard) {
    const decisions = effectiveApprovals(
      tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
      item,
      lookup(tx)
    ).filter((a) => a.kind === "scope" && a.authority.role === "operator");
    const consent = decisions.find((a) => a.approval_id === p.approvalId);
    if (command.actor.role !== "operator" || !consent?.provenance || decisions.some((a) => a.decision !== "approved") || !consent.evidence_refs.includes(`artifact:${asset.artifact_id}`)) {
      fail2("AUTHORITY_REQUIRED", "discarding personal output requires persisted actual operator consent");
    }
  }
  if (command.actor.runId !== asset.producer.runId && ![asset.validity_owner, item.body.completion_authority, item.body.scope_authority, "operator"].includes(command.actor.role)) {
    fail2("AUTHORITY_REQUIRED", "asset changes require its producer, validity owner, or named authority");
  }
  const unchangedTarget = p.target === null || p.target === asset.target;
  const target = p.target ?? asset.target;
  const publishedBefore = hasPublicationHistory(asset);
  if (publishedBefore && !unchangedTarget) fail2("INVALID_INPUT", "published history remains at its canonical path");
  if (!unchangedTarget && !(item.body.artifact_targets ?? []).includes(target)) {
    fail2("AUTHORITY_REQUIRED", "target is not a declared item artifact target");
  }
  const publishing = p.disposition === "published" && asset.disposition !== "published";
  const metadataOnlyInvalidation = unchangedTarget && (/* @__PURE__ */ new Set(["stale", "expired", "invalidated", "retired"])).has(p.validity) && p.supersedes === null && p.approvalId === null && !publishing;
  const artifact = artifactFor(context, tx, asset, !metadataOnlyInvalidation);
  let validity = p.validity;
  const approvalId = personalDiscard ? asset.completion_approval_id : p.approvalId ?? asset.completion_approval_id;
  const publicTarget = target.startsWith("project:") && !(artifact.content_ref.kind === "git" && target === `project:${artifact.project_id}:@git`);
  if (publicTarget && !(metadataOnlyInvalidation && publishedBefore)) {
    if (artifact.classification !== "public" || validity !== "current" || asset.history.some((h) => h.disposition === "personal")) {
      fail2("INVALID_INPUT", "public placement requires current accepted public bytes; personal assets cannot promote");
    }
  }
  if (publishing && (!publicTarget || validity !== "current")) {
    fail2("INVALID_INPUT", "publication requires a current accepted project-qualified target");
  }
  if (publishing) {
    const privateSources = typedRoute(asset.target, "private").routes;
    const publicDestination = typedRoute(target, "public");
    const pack = subjectPack(item);
    const privateSource = privateSources.find((source) => source.lifecycle === "drafts" && source.pack === pack && publicDestination.routes.some((destination) => destination.pack === pack && canonicalJson(routeIdentity(destination)) === canonicalJson(routeIdentity(source))));
    if (asset.disposition !== "working" || asset.validity !== "current" || asset.completion_approval_id === null || !privateSource) {
      fail2(
        "INVALID_INPUT",
        "publication requires an accepted retained draft on the mirrored typed route for this hierarchy subject"
      );
    }
  }
  if (p.supersedes !== null && (validity !== "current" || !["working", "published", "archived"].includes(p.disposition))) {
    fail2("EVIDENCE_GAP", "supersession requires a current accepted durable successor");
  }
  if (p.approvalId !== null && !personalDiscard) {
    accepted(context, tx, item, asset, artifact, approvalId);
  }
  if (validity === "current" || publishing || p.supersedes !== null || publicTarget && !metadataOnlyInvalidation) {
    if ((/* @__PURE__ */ new Set(["stale", "unknown"])).has(asset.validity) && (p.approvalId === null || p.approvalId === asset.completion_approval_id)) {
      fail2("EVIDENCE_GAP", "revalidation requires a fresh explicit independent acceptance");
    }
    const operatorDecision2 = command.actor.role === "operator" ? accepted(context, tx, item, asset, artifact, approvalId) : null;
    const applyingHumanDecision = operatorDecision2?.provenance && sameActor(operatorDecision2.authority, operatorDecisionActor(operatorDecision2.provenance));
    if ((isProducingRun(item.body, command.actor) || asset.producer.runId === command.actor.runId) && !applyingHumanDecision) {
      fail2("AUTHORITY_REQUIRED", "a producing run cannot close its own asset");
    }
    const decision = operatorDecision2 ?? accepted(context, tx, item, asset, artifact, approvalId);
    if ((/* @__PURE__ */ new Set(["stale", "unknown"])).has(asset.validity) && Date.parse(decision.created_at) < Date.parse(asset.history.at(-1).at)) {
      fail2("EVIDENCE_GAP", "revalidation cannot reuse acceptance recorded before the validity change");
    }
    if (!inputsCurrent(context, tx, asset)) {
      if (publicTarget || publishing || p.supersedes !== null) {
        fail2("EVIDENCE_GAP", "incomplete accepted inputs cannot publish or supersede");
      }
      validity = "provisional";
    }
  }
  if (p.validity === "superseded" && asset.superseded_by === null) {
    fail2("INVALID_INPUT", "supersession must be requested by the successor");
  }
  if (p.disposition === "working") {
    const route = typedRoute(target, "private").routes[0];
    if (route.pack !== subjectPack(item)) {
      fail2("INVALID_INPUT", "working assets require a typed private route owned by the hierarchy subject pack");
    }
  } else if (p.disposition === "personal" && !/\/personal(?:\/|$)/.test(target)) {
    fail2("INVALID_INPUT", "personal assets must remain in an explicitly personal typed path");
  }
  if (!metadataOnlyInvalidation && (target !== asset.target || publicTarget)) {
    assertWorkspacePath(context.root, target);
    verifyTarget(context.root, target, artifact);
  }
  if (p.supersedes !== null) {
    if (p.supersedes === asset.asset_id || asset.supersedes !== null && asset.supersedes !== p.supersedes) {
      fail2("EVIDENCE_GAP", "successor already has a different predecessor or supersedes itself");
    }
    const previous = tx.get("asset", p.supersedes);
    if (!previous || previous.body.superseded_by !== null || !VALIDITY.get(previous.body.validity).includes("superseded") || (/* @__PURE__ */ new Set(["retracted", "discarded"])).has(previous.body.disposition)) {
      fail2("EVIDENCE_GAP", "predecessor cannot be superseded or already has a conflicting successor");
    }
    const predecessorTask = previous.subject?.kind === "task" ? tx.get("task", previous.subject.id) : null;
    if (!predecessorTask || predecessorTask.body.recovery_hold !== null) fail2("RECOVERY_REQUIRED", "predecessor is under recovery hold");
    if (previous.subject.id !== item.id) {
      requireActingAuthority(tx, predecessorTask, {
        ...command,
        recordId: predecessorTask.id,
        expectedVersion: predecessorTask.version,
        leaseToken: null
      }, authority, command.kind);
      if (isProducingRun(predecessorTask.body, command.actor)) fail2("AUTHORITY_REQUIRED", "predecessor production history requires independence");
    }
    const previousArtifact = artifactFor(context, tx, previous.body);
    if (previous.body.validity === "current") {
      accepted(
        context,
        tx,
        predecessorTask,
        previous.body,
        previousArtifact,
        previous.body.completion_approval_id
      );
    }
    tx.put(moved(previous, { validity: "superseded", superseded_by: asset.asset_id }, p.reason, p.at, predecessorTask.version));
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
var clone2 = (value) => JSON.parse(canonicalJson(value));
var contentEquals2 = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var lookup2 = (tx) => (kind, id) => tx.get(kind, id);
function ordinaryAuthority(store, tx, item, command, authority) {
  if (item.kind !== "task") {
    if (command.leaseToken !== null) {
      fail2("LEASE_CONFLICT", "parent hierarchy evidence commands cannot carry a Task lease");
    }
    if (![item.body.owner, item.body.scope_authority, item.body.completion_authority].includes(command.actor.role)) {
      fail2(
        "AUTHORITY_REQUIRED",
        "parent hierarchy evidence requires its owner or declared authority"
      );
    }
    requireHostActionGrant(command, authority, command.kind);
    return;
  }
  if (item.body.recovery_hold !== null) fail2("RECOVERY_REQUIRED", "operator recovery hold must be resolved first");
  if (item.body.lease === null && command.leaseToken !== null) fail2("LEASE_CONFLICT", "command carries a retired lease");
  if (item.kind === "task" && hasStaleDirection(
    tx,
    item,
    (directionRef) => currentDirectionForStore(store, directionRef)
  )) {
    requireLeasedActingAuthority(tx, item, command, authority, command.kind);
  } else {
    requireActingAuthority(tx, item, command, authority, command.kind);
  }
}
function produce(store, command, kind, authority, action) {
  validateCommand(command);
  if (command.kind !== kind) fail2("INVALID_INPUT", `producer requires ${kind}`);
  const context = contextFor(store);
  const trusted = clone2(authority ?? context.authority);
  validateAuthority(trusted);
  requireActorAvailable(command, trusted);
  const input = clone2(command);
  return applyOperation(store, input, (item, tx) => {
    bindEvidenceTransaction(store, tx);
    action({ context, item, tx, command: input, authority: trusted });
    return item.body;
  });
}
function putNew(tx, kind, id, item, body) {
  if (tx.get(kind, id)) fail2("VERSION_CONFLICT", `${kind}/${id} already exists; history is immutable`);
  tx.put(validateRecord({
    kind,
    id,
    subject: body.subject,
    version: 1,
    body
  }));
}
function currentBinding(body, item, tx, { recovery = false } = {}) {
  const expected = { kind: item.kind, id: item.id };
  if (!subjectEquals(body.subject, expected) || body.criteria_ref !== (recovery ? null : criteriaRef(item, lookup2(tx))) || !recovery && item.kind === "task" && !contentEquals2(body.content_ref, item.body.change_ref) || (!recovery && item.kind !== "task" || recovery) && body.content_ref !== null) {
    fail2("EVIDENCE_GAP", "record must bind the current hierarchy subject, exact content, and criteria");
  }
}
function independent(item, actor) {
  if (isProducingRun(item.body, actor)) fail2("AUTHORITY_REQUIRED", "every producing run is excluded from independent acceptance");
}
function contentEntries(subject) {
  return subject.kind === "sha256" ? [{ path: subject.path, digest: subject.digest }] : subject.kind === "bundle-sha256" ? subject.entries : [];
}
function operatorDecision(context, command) {
  const supplied = context.verifyOperatorDecision?.(clone2(command)) ?? null;
  let proof;
  try {
    proof = clone2(supplied);
    validateOperatorDecision(proof);
  } catch (error) {
    if (!(error instanceof RuntimeError) || error.code !== "INVALID_INPUT") throw error;
    fail2("AUTHORITY_REQUIRED", "an actual host interaction or attributed supplied operator decision is required");
  }
  const body = command.payload.body;
  for (const key of ["subject", "content_ref", "criteria_ref", "kind", "decision", "deployment", "recovery"]) {
    if (canonicalJson(proof[key]) !== canonicalJson(body[key])) {
      fail2("AUTHORITY_REQUIRED", "operator decision does not bind the exact approval claim");
    }
  }
  if (Date.parse(proof.captured_at) > Date.now()) fail2("AUTHORITY_REQUIRED", "operator decision cannot be future-dated");
  return Object.fromEntries(["source", "reference", "attributed_to", "captured_at"].map((key) => [key, proof[key]]));
}
function registerArtifact(store, command) {
  return produce(store, command, "artifact.register", void 0, ({ context, item, tx, command: command2, authority }) => {
    const p = command2.payload;
    if (p.recoveryLeaseToken !== void 0) {
      if (item.kind !== "task") {
        fail2("INVALID_INPUT", "parent hierarchy artifacts do not support Task lease recovery");
      }
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease) || item.body.lease.token !== p.recoveryLeaseToken || command2.leaseToken !== null) {
        fail2("RECOVERY_REQUIRED", "recovery artifacts require the exact expired lease and no acting lease");
      }
    } else {
      ordinaryAuthority(store, tx, item, command2, authority);
    }
    if (tx.get("artifact", p.artifactId) || tx.get("asset", p.assetId)) fail2("VERSION_CONFLICT", "artifact and asset identities must be new");
    const run = context.runs.find((run2) => sameActor(run2.actor, command2.actor));
    if (!run) fail2("AUTHORITY_REQUIRED", "actor has no approved producing run directory");
    const subjectPack2 = item.kind === "epic" ? "core" : item.body.pack;
    let runRoute;
    try {
      [runRoute] = parseTypedArtifactRoute(run.directory).routes;
    } catch (error) {
      fail2("INVALID_INPUT", error.message);
    }
    if (runRoute.pack !== subjectPack2) {
      fail2("INVALID_INPUT", "approved producing run pack must match the hierarchy subject pack");
    }
    const entries = contentEntries(p.subject);
    const sourcePaths = entries.map((entry) => entry.path);
    const registered = tx.list("artifact");
    const requirePrivacy = ({ subject, classification }) => {
      if (privacyRank[p.classification] < privacyRank[classification]) {
        fail2("INVALID_INPUT", "derived artifacts cannot downgrade applicable input privacy");
      }
      const selected = contentEntries(subject);
      const resolvedPrivacy = (entry) => {
        const privacy = pathPrivacy(context.root, entry.path);
        if (p.classification !== "public" || privacy !== "internal" || entry.path.startsWith("project:")) return privacy;
        try {
          return parseTypedArtifactRoute(entry.path).visibility === "private" ? "public" : privacy;
        } catch {
          return privacy;
        }
      };
      if (selected.some((entry) => privacyRank[p.classification] < privacyRank[resolvedPrivacy(entry)])) {
        fail2("INVALID_INPUT", "derived artifacts cannot downgrade resolved source privacy");
      }
      const paths = new Set(selected.map((e) => normalized(assertWorkspacePath(context.root, e.path))));
      for (const previous of registered) {
        if ((contentEquals2(subject, previous.body.content_ref) || contentEntries(previous.body.content_ref).some((prior) => selected.some((entry) => entry.digest === prior.digest) || paths.has(normalized(assertWorkspacePath(context.root, prior.path))))) && privacyRank[p.classification] < privacyRank[previous.body.classification]) {
          fail2("INVALID_INPUT", "a caller label cannot downgrade registered source privacy");
        }
      }
    };
    requirePrivacy({ subject: p.subject, classification: p.classification });
    for (const path of sourcePaths) {
      const localPath = path.replace(/^project:[a-z][a-z0-9-]*:/, "");
      const personalPack = /^\.kai\/(core|engineering|creative)\/[^/]+\/[^/]+\/personal(?:\/|$)/.exec(localPath)?.[1];
      let pathPacks;
      try {
        pathPacks = personalPack ? /* @__PURE__ */ new Set([personalPack]) : new Set(parseTypedArtifactRoute(localPath).routes.map((route) => route.pack));
      } catch (error) {
        fail2("INVALID_INPUT", error.message);
      }
      if (!pathPacks.has(subjectPack2)) {
        fail2("INVALID_INPUT", "artifact source pack must match the hierarchy subject pack");
      }
      if (!path.startsWith(`${run.directory}/`) && !(item.body.artifact_targets ?? []).includes(path)) {
        fail2("AUTHORITY_REQUIRED", "artifact source is outside the approved run and declared targets");
      }
      if (path.startsWith("project:") && p.classification !== "public" || pathPrivacy(context.root, path) === "personal" && p.classification !== "personal") {
        fail2("INVALID_INPUT", "artifact classification conflicts with source privacy");
      }
    }
    const inputBasis = captureInputBasis(context, tx, artifactInputReferences(item.body, p.inputAssetIds), /* @__PURE__ */ new Set(), requirePrivacy);
    const retained = retainSubject(context.root, p.subject, p.projectId, run.directory, p.artifactId);
    putNew(tx, "artifact", p.artifactId, item, {
      schema_version: 1,
      artifact_id: p.artifactId,
      subject: { kind: item.kind, id: item.id },
      producer: command2.actor,
      content_ref: p.subject,
      criteria_ref: criteriaRef(item, lookup2(tx)),
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
      subject: { kind: item.kind, id: item.id },
      artifact_id: p.artifactId,
      revision: 1,
      producer: command2.actor,
      completion_authority: item.body.completion_authority,
      validity_owner: item.body.validity_owner ?? item.body.completion_authority,
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
        at_subject_version: command2.expectedVersion
      }]
    });
  });
}
function recordReview(store, command) {
  return produce(store, command, "review.record", void 0, ({ context, item, tx, command: command2, authority }) => {
    ordinaryAuthority(store, tx, item, command2, authority);
    const b = command2.payload.body;
    if (!sameActor(b.reviewer, command2.actor)) fail2("AUTHORITY_REQUIRED", "review actor must match the command");
    independent(item, command2.actor);
    currentBinding(b, item, tx);
    if (b.kind === "product-design-acceptance" && (command2.actor.role !== item.body.completion_authority || item.body.producing_actors.some((actor) => actor.role === command2.actor.role))) {
      fail2("AUTHORITY_REQUIRED", "product design acceptance requires an independent completion authority");
    }
    subjectArtifact(context, tx, item, b.content_ref, command2.actor);
    verifyReferences(context, tx, item, [...b.evidence_refs, ...b.finding_refs], { positive: b.verdict === "approved" });
    effectiveReviews([
      ...tx.list("review", { kind: item.kind, id: item.id }).map((r) => r.body),
      b
    ], item, lookup2(tx));
    putNew(tx, "review", b.review_id, item, b);
  });
}
function recordApproval(store, command, authority) {
  return produce(store, command, "approval.record", authority, ({ context, item, tx, command: command2, authority: authority2 }) => {
    const b = command2.payload.body;
    if (!sameActor(b.authority, command2.actor)) fail2("AUTHORITY_REQUIRED", "approval actor must match the command");
    if (item.kind !== "task") {
      requireNamedAuthority(tx, command2, authority2, command2.kind, item.body.completion_authority);
      if (b.kind !== "completion") fail2("INVALID_INPUT", "parent subjects support completion approval only");
      currentBinding(b, item, tx);
      if (command2.actor.role !== item.body.completion_authority) {
        fail2("AUTHORITY_REQUIRED", "parent completion approval requires its declared completion authority");
      }
      verifyParentCompletionApproval(context, tx, item, b.evidence_refs);
      const body2 = { ...b, recorded_at_subject_version: command2.expectedVersion };
      effectiveApprovals([
        ...tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
        body2
      ], item, lookup2(tx));
      putNew(tx, "approval", b.approval_id, item, body2);
      return;
    }
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
      if (b.criteria_ref !== criteriaRef(item, lookup2(tx)) || item.body.recovery_hold !== b.recovery.attempt_id || attempt?.subject?.kind !== "task" || attempt.subject.id !== item.id || attempt.body.disposition !== "conflicting-partial-work" || attempt.body.stale_lease.token !== b.recovery.stale_lease_token) {
        fail2("AUTHORITY_REQUIRED", "operator recovery resolution requires the exact current conflicting attempt");
      }
      requireRoleAvailable(b.recovery.resume_role, authority2, "recovery resume");
    } else {
      if (command2.actor.role === "operator") {
        if (item.body.recovery_hold !== null || item.body.lease !== null && !leaseIsLive(item.body.lease)) {
          fail2("RECOVERY_REQUIRED", "ordinary operator decisions cannot bypass lease recovery");
        }
        if (command2.leaseToken !== null) fail2("LEASE_CONFLICT", "operator decisions do not borrow an execution lease");
        requireHostActionGrant(command2, authority2, command2.kind);
      } else {
        ordinaryAuthority(store, tx, item, command2, authority2);
      }
      currentBinding(b, item, tx);
      subjectArtifact(context, tx, item, b.content_ref, decisionActor);
      const role = b.kind === "completion" ? item.body.completion_authority : b.kind === "scope" ? item.body.scope_authority : "operator";
      if (command2.actor.role !== role) fail2("AUTHORITY_REQUIRED", "approval must come from its declared authority");
    }
    verifyReferences(context, tx, item, b.evidence_refs, { recovery, positive: b.decision === "approved" });
    const body = {
      ...b,
      authority: decisionActor,
      recorded_at_subject_version: command2.expectedVersion,
      ...provenance ? { provenance } : {}
    };
    const effective = effectiveApprovals([
      ...tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
      body
    ], item, lookup2(tx));
    const deployments = effective.filter((a) => a.deployment !== null && a.decision === "approved");
    if (new Set(deployments.map((a) => canonicalJson(a.deployment))).size > 1) {
      fail2("AUTHORITY_REQUIRED", "operator confirmations disagree about the production deployment");
    }
    putNew(tx, "approval", b.approval_id, item, body);
    if (recovery && b.decision === "approved") recoveryResolution(tx, item, b.approval_id);
  });
}
function registerEvidence(store, command, capture) {
  return produce(store, command, "evidence.register", void 0, ({ context, item, tx, command: command2, authority }) => {
    const b = command2.payload.body;
    const parentCompletion = b.kind === "parent-completion";
    const recovery = b.kind === "recovery-reconciliation";
    if (parentCompletion) {
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.completion_authority);
    } else if (recovery) {
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease) || item.body.lease.token !== b.data.stale_lease_token) {
        fail2("RECOVERY_REQUIRED", "reconciliation must observe the exact expired lease");
      }
    } else {
      ordinaryAuthority(store, tx, item, command2, authority);
    }
    currentBinding(b, item, tx, { recovery });
    if (!recovery && item.kind === "task") {
      subjectArtifact(context, tx, item, b.content_ref, b.outcome === "waived" ? command2.actor : null);
    }
    const artifacts = parentCompletion ? verifyParentCompletionEvidence(context, tx, item, b.evidence_refs) : verifyReferences(context, tx, item, b.evidence_refs, { recovery });
    let observation = null;
    if (command2.payload.tier === "observed") {
      if (!context.verifyCapture) fail2("INVALID_INPUT", "agent paste or a source label is not observed capture");
      observation = clone2(context.verifyCapture(clone2(command2), capture));
      validateCapture(observation);
      const positive = (/* @__PURE__ */ new Set(["passed", "clear", "waived"])).has(b.outcome);
      if (observation.command_digest !== commandDigest(command2) || !sameActor(observation.actor, command2.actor) || positive && (observation.exit_code !== 0 || observation.checks.length === 0) || observation.captured_at !== b.created_at || Date.parse(observation.captured_at) > Date.now() || b.kind === "production-verification" && b.data.checks.some((check) => !observation.checks.includes(check))) {
        fail2("EVIDENCE_GAP", "capture does not cover this actor, result, time, and complete claimed checks");
      }
      const privacy = { public: 0, internal: 1, confidential: 2, personal: 3 };
      if (artifacts.some((a) => privacy[a.classification] < privacy[observation.classification])) {
        fail2("EVIDENCE_GAP", "captured confidential data requires equally private evidence storage");
      }
      if (recovery && Date.parse(observation.captured_at) < Date.parse(item.body.lease.expires_at)) {
        fail2("EVIDENCE_GAP", "recovery capture predates lease expiry");
      }
    } else if (!(/* @__PURE__ */ new Set(["gap", "failed"])).has(b.outcome) || recovery) {
      fail2("EVIDENCE_GAP", "a declaration cannot establish observed success, waiver, or recovery");
    }
    if (b.outcome === "waived") {
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.completion_authority);
      independent(item, command2.actor);
      if (artifacts.some((a) => a.producer.runId === command2.actor.runId)) {
        fail2("AUTHORITY_REQUIRED", "a producing run cannot waive verification of its own supporting artifacts");
      }
    }
    if (b.kind === "deployment" || b.kind === "production-verification") {
      const start = requireOperatorApproval(tx, item, "operator-deploy-start");
      const complete = requireOperatorApproval(tx, item, "operator-deploy-complete");
      if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment) || b.data.environment !== start.deployment.environment || b.data.deployment_id !== start.deployment.deployment_id) {
        fail2("AUTHORITY_REQUIRED", "capture must match the operator-confirmed production deployment");
      }
    }
    const body = { ...b, provenance: { tier: command2.payload.tier, capture: observation } };
    if (!recovery) {
      effectiveEvidence([
        ...tx.list("evidence", { kind: item.kind, id: item.id }).map((r) => r.body),
        body
      ], item, lookup2(tx));
    }
    putNew(tx, "evidence", b.evidence_id, item, body);
  });
}
function transitionAsset(store, command, authority) {
  return produce(store, command, "asset.transition", authority, ({ context, item, tx, command: command2, authority: authority2 }) => {
    ordinaryAuthority(store, tx, item, command2, authority2);
    applyAssetTransition({ context, item, tx, command: command2, authority: authority2 });
  });
}

// src/core/lib/coordination-runtime/host-plan.mjs
function planHierarchy({ store, subject, direction, roles }) {
  return taskPlan(store, { subject, direction, roles });
}
function validateRoster(roster, profiles) {
  if (!Array.isArray(roster) || !isPlainObject(profiles)) fail("INVALID_INPUT", "host roster/profiles are required");
  const ids = /* @__PURE__ */ new Set();
  for (const entry of roster) {
    assertExactKeys(entry, /* @__PURE__ */ new Set(["id", "role", "model"]), "roster entry");
    text(entry.id, "qualified host id");
    text(entry.role, "roster role");
    if (entry.model !== null) text(entry.model, "roster model");
    if (ids.has(entry.id)) fail("INVALID_INPUT", "duplicate host agent id");
    ids.add(entry.id);
  }
}
function planDispatch({ task, roster, profiles, capabilities, request = {} }) {
  if (!task || typeof task.next_role !== "string") {
    fail("ROLE_UNAVAILABLE", "Task has no next role");
  }
  if (!Array.isArray(roster) || roster.some((entry2) => !isPlainObject(entry2))) {
    fail("INVALID_INPUT", "roster must be an array of entries");
  }
  const entries = roster.filter((entry2) => entry2.role === task.next_role);
  if (entries.length !== 1) fail("ROLE_UNAVAILABLE", "exact next role must resolve to one qualified host ID");
  validateRoster(roster, profiles);
  validateCapabilities(capabilities);
  assertExactKeys(request, /* @__PURE__ */ new Set(["role", "profile", "model", "fallbackModel", "effort"]), "dispatch request", /* @__PURE__ */ new Set());
  const profile = profiles[task.next_role];
  const requiredModel = approvedProfileModel(task.next_role, profile);
  if (request.role !== void 0 && request.role !== task.next_role || request.profile !== void 0 && request.profile !== profile) {
    fail("INVALID_INPUT", "requested role/profile is inconsistent with the installed role");
  }
  if (request.model !== void 0 && request.model !== requiredModel || request.fallbackModel !== void 0 && request.fallbackModel !== requiredModel || !capabilities.models.includes(requiredModel)) {
    fail("MODEL_UNAVAILABLE", "required model is unavailable or requested fallback is outside approved policy");
  }
  const [entry] = entries;
  if (!capabilities.modelOverride && entry.model !== requiredModel) {
    fail("MODEL_UNAVAILABLE", "host cannot guarantee the pinned model without a supported override");
  }
  const settings = {};
  if (capabilities.modelOverride) settings.model = requiredModel;
  if (request.effort !== void 0 && request.effort !== null) {
    if (!capabilities.efforts.includes(request.effort)) fail("UNSUPPORTED_HOST", "requested effort override is unsupported");
    settings.effort = request.effort;
  }
  return {
    mode: capabilities.peerDispatch ? "peer-available" : "ordered-queue",
    automatic: false,
    queue: [{
      agentId: entry.id,
      role: task.next_role,
      profile,
      requestedModel: requiredModel,
      settings: clone(settings),
      context: "fresh-single-shot"
    }]
  };
}

// src/core/lib/coordination-runtime/engine.mjs
function fail3(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}
var handlers = new Map([
  ...parentHandlers,
  ...taskHandlers
]);
function duplicateMessageReceipt(store, command) {
  const messageId = command.payload?.messageId;
  if (typeof messageId !== "string") return null;
  const existing = readMessageOperation(store, messageId);
  if (!existing) return null;
  const expectedEvent = {
    kind: command.kind,
    actor: command.actor,
    recordKind: command.recordKind,
    recordId: command.recordId,
    payload: command.payload
  };
  if (canonicalJson(existing.event) !== canonicalJson(expectedEvent)) {
    fail3(
      "OPERATION_CONFLICT",
      `message/${messageId} was already used with different content`
    );
  }
  return existing.receipt;
}
function applyCommand(store, command, authority) {
  validateCommand(command);
  const handlerKey = commandKind(command.kind).handler;
  if (!handlers.has(handlerKey)) {
    fail3("INVALID_INPUT", `${command.kind} requires its dedicated evidence producer`);
  }
  validateAuthority(authority);
  requireActorAvailable(command, authority);
  const duplicate = duplicateMessageReceipt(store, command);
  if (duplicate) return duplicate;
  try {
    return applyOperation(store, command, (current, tx) => {
      bindEvidenceTransaction(store, tx);
      const handler = handlers.get(handlerKey);
      return handler(current, tx, command, authority, {
        direction: (directionRef) => currentDirectionForStore(store, directionRef)
      });
    });
  } catch (error) {
    if (command.payload?.messageId && (error?.code === "VERSION_CONFLICT" || error?.code === "OPERATION_CONFLICT")) {
      const racedDuplicate = duplicateMessageReceipt(store, command);
      if (racedDuplicate) return racedDuplicate;
    }
    throw error;
  }
}

export {
  applyCommand,
  registerArtifact,
  recordReview,
  recordApproval,
  registerEvidence,
  transitionAsset,
  planHierarchy,
  validateRoster,
  planDispatch
};
