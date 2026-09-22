import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  artifactPreviewLimits,
  fileName,
  hash as hash2,
  inspectRuntime,
  knownGap,
  persistReportFiles,
  projectContext,
  readDetail,
  readMessages,
  redactReport,
  renderCompanions,
  renderHtml,
  renderLanding,
  renderMarkdown,
  reportPaths,
  snapshotWarning
} from "./chunk-KZHPWPXN.mjs";
import "./chunk-5QXOH5X2.mjs";
import {
  DATABASE,
  artifactBasisCurrent,
  assertWorkspaceWrite,
  bindEvidenceReadView,
  closeStore,
  completionApproval,
  effectiveApprovals,
  effectiveEvidence,
  effectiveReviews,
  exactFile,
  hash,
  hashArtifact,
  itemStateSatisfies,
  listAllRecords,
  listRecords,
  matchesAcceptance,
  migrationManifest,
  normalized,
  openStore,
  privateAdmission,
  projectBinding,
  readContextView,
  readLegacyRecords,
  readRecord,
  readSnapshot,
  readStoreSummary,
  recoveryResolution,
  requireDeploymentEvidence,
  requireOperatorApproval,
  requireReleaseEvidence,
  requireReviews,
  safePath,
  scanExactFile,
  sourceSnapshot,
  verifyArtifact,
  verifyAssetContent,
  verifyReferences,
  verifySubject,
  verifyVerdict,
  workspaceManifest
} from "./chunk-SQAAX6CQ.mjs";
import "./chunk-MIK5J3AD.mjs";
import {
  resolveWorkspaceRoot
} from "./chunk-VTZRFV57.mjs";
import {
  RuntimeError,
  canonicalJson,
  criteriaRef,
  isProducingRun,
  subjectEquals,
  validateCommand,
  validateRecord
} from "./chunk-VP4QXWCX.mjs";

// src/core/lib/coordination-runtime/cli.mjs
import { existsSync } from "node:fs";

// src/core/lib/coordination-runtime/report-data.mjs
import { dirname, join } from "node:path";

// src/core/lib/coordination-runtime/report-capture.mjs
import { execFileSync } from "node:child_process";
function captureHistory(store, itemId, throughSeq, addGap) {
  const statement = store.database.prepare(`
    SELECT e.seq, e.message_id, r.kind, r.id, r.item_id, r.version, r.body
    FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
    WHERE e.thread_id = ? AND e.message_id IS NOT NULL AND e.seq < ?
    ORDER BY e.seq DESC LIMIT 50
  `);
  const pages = [];
  let beforeSeq = throughSeq + 1;
  for (; ; ) {
    const rows = statement.all(itemId, beforeSeq);
    if (!rows.length) break;
    pages.push(rows.map((row) => {
      const ref = `message:${row.message_id}`;
      const entry = { ref, eventSeq: Number(row.seq) };
      if (row.id === null) {
        entry.gap = "Message referenced by this event is missing; no payload invented.";
      } else {
        const record = validateRecord({
          kind: row.kind,
          id: row.id,
          itemId: row.item_id,
          version: row.version,
          body: JSON.parse(row.body)
        });
        if (record.itemId !== itemId || record.body.thread_id !== itemId) {
          entry.gap = "Message item/thread mismatches captured scope; content withheld.";
        } else entry.record = record;
      }
      if (entry.gap) addGap(ref, entry.gap);
      return entry;
    }));
    beforeSeq = Number(rows.at(-1).seq);
    if (rows.length < 50) break;
  }
  return pages;
}
function captureArtifacts(root, artifacts, addGap) {
  let remaining = artifactPreviewLimits.aggregateBytes;
  return artifacts.flatMap((artifact) => {
    if (!artifact.snapshots?.length) return [];
    let artifactRemaining = artifactPreviewLimits.perArtifactBytes;
    let manifestError;
    try {
      if (artifact.manifest_path !== `${artifact.run_directory}/.evidence/${artifact.artifact_id}/manifest.json` || scanExactFile(root, artifact.manifest_path).digest !== hash2(canonicalJson({
        subject: artifact.subject,
        snapshots: artifact.snapshots
      }))) throw new RuntimeError("EVIDENCE_GAP", "Retained manifest/path does not match registered artifact.");
    } catch (error) {
      if (!knownGap(error)) throw error;
      manifestError = error;
    }
    return artifact.snapshots.map((snapshot, index) => {
      const preview = {
        ref: artifact.ref,
        index,
        path: snapshot.path,
        retainedPath: snapshot.snapshot_path,
        sourceDigest: snapshot.digest,
        sourceSize: null,
        status: artifact.status,
        encoding: "utf8",
        content: null,
        previewState: "unavailable",
        previewBytes: 0,
        omittedBytes: null,
        limitReasons: []
      };
      try {
        if (manifestError) throw manifestError;
        if (!snapshot.snapshot_path.startsWith(`${artifact.run_directory}/.evidence/${artifact.artifact_id}/`)) {
          throw new RuntimeError("EVIDENCE_GAP", "Retained path does not match registered artifact.");
        }
        const budget = Math.min(remaining, artifactRemaining);
        const prefix = Buffer.alloc(budget);
        const decoder = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
        let captured = 0;
        let binary = false;
        const classify = (chunk, stream) => {
          if (binary) return;
          try {
            binary = /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(decoder.decode(chunk, { stream }));
          } catch (error) {
            if (error.code !== "ERR_ENCODING_INVALID_ENCODED_DATA") throw error;
            binary = true;
          }
        };
        const identity = scanExactFile(root, snapshot.snapshot_path, (chunk) => {
          captured += chunk.copy(prefix, captured, 0, Math.min(chunk.length, budget - captured));
          classify(chunk, true);
        });
        if (identity.digest !== snapshot.digest) throw new RuntimeError("EVIDENCE_GAP", "Retained bytes do not match registered digest.");
        classify(void 0, false);
        const bytes = prefix.subarray(0, captured);
        preview.encoding = binary ? "latin1" : "utf8";
        const content = binary ? bytes.toString("latin1") : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes, { stream: captured < identity.size });
        preview.sourceSize = identity.size;
        preview.previewBytes = Buffer.byteLength(content, preview.encoding);
        preview.omittedBytes = identity.size - preview.previewBytes;
        preview.previewState = !preview.omittedBytes ? "complete" : preview.previewBytes ? "limited" : "omitted";
        preview.content = preview.previewState === "omitted" ? null : content;
        if (identity.size > budget) {
          if (budget === artifactRemaining) preview.limitReasons.push("artifact-preview-budget");
          if (budget === remaining) preview.limitReasons.push("report-preview-budget");
        }
        if (preview.previewBytes < captured) preview.limitReasons.push("utf8-boundary");
        artifactRemaining -= preview.previewBytes;
        remaining -= preview.previewBytes;
      } catch (error) {
        if (!knownGap(error)) throw error;
        preview.gap = error.message;
        addGap(artifact.ref, `Inert preview unavailable: ${error.message}`);
      }
      return preview;
    });
  });
}
function captureChanges(root, artifacts, addGap) {
  const changes = [];
  const seen = /* @__PURE__ */ new Set();
  for (const artifact of artifacts) {
    if (artifact.subject.kind !== "git") {
      for (const entry of artifact.snapshots) changes.push({
        ref: artifact.ref,
        kind: "recorded-revision",
        path: entry.path,
        digest: entry.digest,
        status: artifact.status,
        provenance: "declared"
      });
      continue;
    }
    const key = canonicalJson([artifact.project_id, artifact.subject]);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      verifySubject(root, artifact.subject, artifact.project_id);
      const { projectRoot } = projectBinding(root, artifact.project_id);
      const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));
      const bytes = execFileSync("git", [
        "--no-pager",
        "-C",
        projectRoot,
        "diff",
        "--no-ext-diff",
        "--no-textconv",
        "--no-renames",
        "--name-status",
        "-z",
        artifact.subject.base,
        artifact.subject.head,
        "--"
      ], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 64 * 1024 * 1024,
        env: { ...env, GIT_NO_REPLACE_OBJECTS: "1", GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0", GIT_NO_LAZY_FETCH: "1" }
      });
      const fields = bytes.split("\0");
      if (fields.pop() !== "" || fields.length % 2) throw new RuntimeError("EVIDENCE_GAP", "Malformed Git path listing.");
      for (let i = 0; i < fields.length; i += 2) changes.push({
        ref: artifact.ref,
        kind: "git",
        projectId: artifact.project_id,
        ...artifact.subject,
        path: fields[i + 1],
        status: fields[i],
        provenance: "derived"
      });
    } catch (error) {
      if (error instanceof RuntimeError && !knownGap(error)) throw error;
      addGap(artifact.ref, `Git changed paths unavailable: ${error instanceof RuntimeError ? error.message : "read-only Git inspection failed"}`);
    }
  }
  return changes;
}

// src/core/lib/coordination-runtime/report-data.mjs
var terminal = /* @__PURE__ */ new Set(["completed", "shipped", "dropped"]);
var positive = (value) => ["approved", "clear", "waived", "passed"].includes(value);
var negativeValidity = /* @__PURE__ */ new Set(["stale", "expired", "superseded", "invalidated", "retired"]);
function excerpt(value, limit = 512) {
  const text = typeof value === "string" ? value : JSON.stringify(value);
  if (Buffer.byteLength(text) <= limit) return { text, truncated: false };
  let result = "";
  let bytes = 0;
  for (const character of text) {
    const size = Buffer.byteLength(character);
    if (bytes + size > limit - 3) break;
    result += character;
    bytes += size;
  }
  return { text: `${result}\u2026`, truncated: true };
}
function buildReport(store, { itemId }) {
  if (typeof itemId !== "string" || !itemId) throw new RuntimeError("INVALID_INPUT", "report itemId is required");
  const root = dirname(dirname(dirname(store.path)));
  const manifest = workspaceManifest(root);
  if (normalized(store.path) !== normalized(join(root, ".kai", "state", "coordination.sqlite"))) {
    throw new RuntimeError("INVALID_INPUT", "report store must belong to the explicit workspace");
  }
  return readSnapshot(store, () => {
    const gaps = [];
    const gapKeys = /* @__PURE__ */ new Set();
    const addGap = (ref, message, severity = "gap", code = "EVIDENCE_GAP") => {
      const key = JSON.stringify([ref, message]);
      if (!gapKeys.has(key)) {
        gapKeys.add(key);
        gaps.push({ ref, code, severity, message });
      }
    };
    const check = (ref, action, severity = "gap") => {
      try {
        return { ok: true, value: action() };
      } catch (error) {
        if (!knownGap(error)) throw error;
        addGap(ref, error.message, severity, error.code);
        return { ok: false };
      }
    };
    const contextRead = check(`item:${itemId}`, () => readContextView(store, { itemId, recentLimit: 8 }));
    const context = contextRead.value;
    const item = context?.item ?? readRecord(store, "item", itemId);
    if (!item) throw new RuntimeError("EVIDENCE_GAP", `item/${itemId} does not exist`);
    const throughSeq = context?.throughSeq ?? Number(store.database.prepare(
      "SELECT COALESCE(MAX(seq), 0) AS seq FROM events"
    ).get().seq);
    const cache = /* @__PURE__ */ new Map();
    const recordsById = /* @__PURE__ */ new Map();
    const list = (kind, id) => {
      const key = `${kind}\0${id}`;
      if (!cache.has(key)) {
        const records = listRecords(store, { kind, itemId: id });
        cache.set(key, records);
        records.forEach((r) => recordsById.set(`${kind}\0${r.id}`, r));
      }
      return cache.get(key);
    };
    const tx = bindEvidenceReadView({
      list,
      get: (kind, id) => {
        const key = `${kind}\0${id}`;
        if (!recordsById.has(key)) recordsById.set(key, readRecord(store, kind, id));
        return recordsById.get(key);
      }
    }, { root });
    const body = item.body;
    const artifacts = list("artifact", itemId).map((record) => ({
      id: record.id,
      ref: `artifact:${record.id}`,
      version: record.version,
      ...record.body,
      status: matchesAcceptance(record.body, body) ? "current" : "historical",
      integrity: "not-rechecked",
      assets: []
    }));
    const assets = list("asset", itemId);
    const assetsByArtifact = /* @__PURE__ */ new Map();
    for (const asset of assets) {
      const entries = assetsByArtifact.get(asset.body.artifact_id) ?? [];
      entries.push(asset.body);
      assetsByArtifact.set(asset.body.artifact_id, entries);
    }
    for (const artifact of artifacts) {
      artifact.assets = assetsByArtifact.get(artifact.id) ?? [];
      if (artifact.status !== "current") continue;
      const basis = check(artifact.ref, () => artifactBasisCurrent({ root }, tx, item, artifact), "pending");
      if (!basis.ok || !basis.value) {
        artifact.status = "historical";
        artifact.integrity = "gap";
        addGap(artifact.ref, "Historical output basis is obsolete or incomplete; retained without reacceptance.", "pending");
        continue;
      }
      const verified = check(artifact.ref, () => {
        if (artifact.assets.length) artifact.assets.forEach((asset) => verifyAssetContent({ root }, tx, asset));
        else verifyArtifact(root, artifact);
      });
      artifact.integrity = verified.ok ? "verified" : "gap";
      for (const asset of artifact.assets) {
        if (negativeValidity.has(asset.validity)) {
          artifact.integrity = "gap";
          addGap(`asset:${asset.asset_id}`, `Current-subject asset validity is ${asset.validity}; not current proof.`);
        }
      }
    }
    const artifactIds = new Set(artifacts.map((a) => a.id));
    for (const asset of assets) {
      if (!artifactIds.has(asset.body.artifact_id)) {
        addGap(`asset:${asset.id}`, "Registered asset references a missing artifact.");
      }
    }
    const groups = [
      ["review", "review_id", effectiveReviews],
      ["approval", "approval_id", effectiveApprovals],
      ["evidence", "evidence_id", effectiveEvidence]
    ];
    const approvalChronology = new Map((context?.approvals ?? []).map((a) => [a.record.id, a.eventSeq]));
    const verdicts = {};
    for (const [kind, idKey, effectiveFn] of groups) {
      const records = list(kind, itemId);
      const result = check(`${kind}s`, () => effectiveFn(records.map((r) => r.body), body));
      const effectiveIds = result.ok ? new Set(result.value.map((b) => b[idKey])) : null;
      verdicts[kind] = records.map((record) => {
        const b = record.body;
        const recovery = b.kind === "operator-recovery-resolution";
        const current = recovery ? b.criteria_ref === criteriaRef(body) && b.recovery.attempt_id === body.recovery_hold : matchesAcceptance(b, body);
        const actor = b.reviewer ?? b.authority ?? null;
        const independent = actor === null ? null : !isProducingRun(body, actor) && !artifacts.some((a) => subjectEquals(a.subject, b.subject) && a.producer.runId === actor.runId);
        const status = !current ? "historical" : effectiveIds === null ? "conflict" : effectiveIds.has(record.id) ? "current" : "superseded";
        const entry = {
          id: record.id,
          ref: `${kind}:${record.id}`,
          version: record.version,
          ...b,
          status,
          independent,
          integrity: "not-rechecked",
          eventSeq: kind === "approval" ? approvalChronology.get(record.id) ?? null : null
        };
        if (status === "historical") {
          addGap(entry.ref, "Historical proof is stale for the current criteria/subject; retained without reacceptance.", "pending");
        }
        if (status === "conflict") entry.integrity = "gap";
        if (status === "superseded") {
          const retained = check(entry.ref, () => verifyReferences(
            { root },
            tx,
            item,
            [...b.evidence_refs, ...b.finding_refs ?? []],
            { recovery, positive: false }
          ), "pending");
          entry.integrity = retained.ok ? "verified" : "gap";
        }
        if (status !== "current") return entry;
        if (!positive(b.verdict ?? b.decision ?? b.outcome)) {
          entry.integrity = "negative";
          addGap(entry.ref, `Current ${kind} records ${b.verdict ?? b.decision ?? b.outcome}; unresolved negative verdict.`);
          return entry;
        }
        const verified = check(entry.ref, () => {
          if (kind === "approval" && entry.eventSeq === null) {
            throw new RuntimeError("EVIDENCE_GAP", "Current approval is missing persisted decision chronology.");
          }
          if (recovery) {
            recoveryResolution(tx, item, record.id);
            verifyReferences({ root }, tx, item, b.evidence_refs, { recovery: true, positive: false });
          } else {
            verifyVerdict(tx, item, b, actor);
            if (artifacts.some((a) => a.status === "current" && a.integrity === "gap")) {
              throw new RuntimeError("EVIDENCE_GAP", "Current subject artifact or asset has an integrity/validity gap.");
            }
          }
        }, "broken-claim");
        entry.integrity = verified.ok ? "verified" : "gap";
        return entry;
      });
    }
    const decisions = verdicts.approval.sort((a, b) => (a.eventSeq ?? 0) - (b.eventSeq ?? 0));
    const reviews = verdicts.review;
    const evidence = verdicts.evidence;
    const completionClaims = decisions.filter((d) => d.status === "current" && d.kind === "completion" && d.decision === "approved");
    if (completionClaims.length) {
      const completion = check("completion", () => completionApproval(tx, item), "broken-claim");
      const requiredReviews = check("required-reviews", () => requireReviews(tx, item), "broken-claim");
      if (!completion.ok || !requiredReviews.ok) completionClaims.forEach((c) => {
        c.integrity = "gap";
      });
    }
    if (terminal.has(body.state) && body.state !== "dropped" && !completionClaims.length) {
      addGap("completion", "Recorded terminal state retained; current completion proof is missing or stale.");
    }
    const recordedPhase = body.state === "blocked" ? body.resume_state : body.state;
    if (["release-ready", "deploying", "production-verification", "shipped"].includes(recordedPhase)) {
      check("completion", () => completionApproval(tx, item), "broken-claim");
      check("required-reviews", () => requireReviews(tx, item), "broken-claim");
      check("release-evidence", () => requireReleaseEvidence(tx, item), "broken-claim");
    }
    if (["deploying", "production-verification", "shipped"].includes(recordedPhase)) {
      check("deployment-start", () => requireOperatorApproval(tx, item, "operator-deploy-start"), "broken-claim");
    }
    if (["production-verification", "shipped"].includes(recordedPhase)) {
      check("deployment-complete", () => requireOperatorApproval(tx, item, "operator-deploy-complete"), "broken-claim");
      check("deployment", () => requireDeploymentEvidence(tx, item, "deployment"), "broken-claim");
    }
    if (recordedPhase === "shipped") {
      check("production-verification", () => requireDeploymentEvidence(tx, item, "production-verification"), "broken-claim");
    }
    const criteria = body.acceptance.map((text, index) => {
      const support = [
        ...reviews.filter((r) => r.criteria.includes(text)),
        ...evidence.filter((e) => e.provenance?.tier === "observed" && e.provenance.capture.checks.includes(text))
      ].filter((r) => ["current", "conflict"].includes(r.status));
      const bad = support.some((r) => ["gap", "negative"].includes(r.integrity));
      const good = support.filter((r) => r.integrity === "verified");
      return {
        id: `criterion-${index + 1}`,
        text,
        criteriaRef: criteriaRef(body),
        status: bad ? "gap" : good.length ? "verified" : "pending",
        verdictRefs: support.map((r) => r.ref),
        evidenceRefs: [...new Set(support.flatMap((r) => r.evidence_refs))],
        explanation: "Exact criterion text matched to review criteria or observed check labels; item-level approval alone does not imply per-criterion coverage."
      };
    });
    const references = /* @__PURE__ */ new Set([
      ...body.context_artifacts,
      ...context?.referencedDetails.map((d) => d.reference) ?? []
    ]);
    for (const reference of references) {
      const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
      if (!match) addGap(reference, "Reference is not a registered artifact/evidence identity; not linked.");
      else if (!tx.get(match[1].toLowerCase(), match[2])) addGap(reference, "Referenced record is missing.");
    }
    const questions = list("question", itemId).map((record) => ({
      id: record.id,
      ref: `question:${record.id}`,
      version: record.version,
      ...record.body,
      disposition: terminal.has(body.state) ? "historical-follow-up" : record.body.status === "answered" ? "addressed" : record.body.blocking ? "blocking" : "nonblocking"
    }));
    const blockers = questions.filter((q) => q.disposition === "blocking");
    const questionsById = new Map(questions.map((q) => [q.id, q]));
    for (const id of body.waiting_on_questions) {
      const question = questionsById.get(id);
      if (!question || !terminal.has(body.state) && (question.status !== "open" || !question.blocking)) {
        addGap(`question:${id}`, "Required question is missing or no longer matches its blocking obligation.");
        if (!terminal.has(body.state) && !blockers.some((b) => b.ref === `question:${id}`)) {
          blockers.push({ ref: `question:${id}`, ask: "Restore missing question evidence before resolving this obligation." });
        }
      }
    }
    for (const entry of context?.questions ?? []) {
      if (entry.record && entry.eventSeq === null) {
        addGap(`question:${entry.record.id}`, "Question is missing persisted opening-message chronology.");
      }
    }
    for (const question of questions) {
      const opening = tx.get("message", question.opened_message_id);
      if (!opening || opening.itemId !== itemId || opening.body.kind !== "question") {
        addGap(question.ref, "Question opening message is missing or mismatched.");
      }
      for (const id of question.answer_message_ids) {
        const answer = tx.get("message", id);
        if (!answer || answer.itemId !== itemId || answer.body.kind !== "answer") {
          addGap(question.ref, "Question answer message is missing or mismatched.");
        }
      }
      if (question.status === "answered" && (!question.resolution || !question.answer_message_ids.includes(question.resolution.message_id))) {
        addGap(question.ref, "Question resolution does not name a retained answer message.");
      }
    }
    if (body.recovery_hold && !terminal.has(body.state)) {
      blockers.push({ ref: `attempt:${body.recovery_hold}`, kind: "recovery-hold", ask: "Operator resolution required before resumption." });
    }
    if (body.recovery_hold) {
      const attempt = tx.get("attempt", body.recovery_hold);
      if (!attempt || attempt.itemId !== itemId || attempt.body.disposition !== "conflicting-partial-work") {
        addGap(`attempt:${body.recovery_hold}`, "Recovery hold attempt is missing or mismatched.");
      }
    }
    const dependencies = (context?.dependencies ?? body.depends_on.map((dependency) => ({
      dependency,
      record: tx.get("item", dependency.item)
    }))).map(({ dependency, record }) => ({
      item: dependency.item,
      requires: dependency.requires,
      state: record?.body.state ?? null,
      version: record?.version ?? null,
      status: !record ? "missing" : record.body.state === "dropped" ? "failed" : itemStateSatisfies(record, dependency.requires) ? "satisfied" : "pending"
    }));
    for (const dependency of dependencies) {
      if (dependency.status === "satisfied") continue;
      const ref = `item:${dependency.item}`;
      const ask = dependency.status === "pending" ? `Waiting for ${dependency.item}: recorded ${dependency.state}; requires ${dependency.requires}.` : dependency.status === "failed" ? `Dependency ${dependency.item} was dropped; recorded requirement ${dependency.requires} failed. Owner decision required.` : `Dependency ${dependency.item} is missing; restore evidence before resolving its requirement.`;
      addGap(ref, ask, dependency.status === "pending" ? "pending" : "gap");
      if (!terminal.has(body.state)) blockers.push({ ref, kind: "dependency", status: dependency.status, ask });
    }
    const attempts = [
      ...list("host-attempt", itemId).map((r) => ({ id: r.id, ref: `host-attempt:${r.id}`, type: "host", version: r.version, ...r.body })),
      ...list("attempt", itemId).map((r) => ({ id: r.id, ref: `attempt:${r.id}`, type: "recovery", version: r.version, ...r.body }))
    ];
    const effects = list("effect", itemId).map((r) => ({ id: r.id, ref: `effect:${r.id}`, version: r.version, ...r.body }));
    for (const attempt of attempts.filter((a) => a.type === "host")) {
      if (["intent", "uncertain", "conflicting", "mismatched"].includes(attempt.status)) {
        const message = `Host attempt is ${attempt.status}; reconcile liveness, model and outcome before further execution.`;
        addGap(attempt.ref, message);
        if (!terminal.has(body.state)) blockers.push({ ref: attempt.ref, ask: message });
      }
    }
    for (const effect of effects) {
      if (["unknown", "conflicting"].includes(effect.outcome)) {
        const message = `Recorded effect outcome is ${effect.outcome}; no safe retry is implied.`;
        addGap(effect.ref, message);
        if (!terminal.has(body.state)) blockers.push({ ref: effect.ref, ask: message });
      }
    }
    const rawMessages = (context?.recentMessages ?? []).filter(({ record }) => {
      const inScope = record.itemId === itemId && record.body.thread_id === itemId;
      if (!inScope) addGap(`message:${record.id}`, "Message item/thread mismatches captured scope; content withheld.");
      return inScope;
    }).map(({ record, eventSeq }) => ({
      id: record.id,
      ref: `message:${record.id}`,
      eventSeq,
      ...record.body
    }));
    const inspection = {
      threadId: itemId,
      throughSeq,
      messagePages: captureHistory(store, itemId, throughSeq, addGap),
      artifactPreviews: captureArtifacts(root, artifacts, addGap)
    };
    inspection.previewBudget = {
      ...artifactPreviewLimits,
      capturedBytes: inspection.artifactPreviews.reduce((sum, preview) => sum + preview.previewBytes, 0)
    };
    const changes = captureChanges(root, artifacts, addGap);
    const safe = redactReport({
      schema_version: 1,
      workspace: { id: manifest.workspace_id, root: normalized(root) },
      item: { ...body, version: item.version, criteriaRef: criteriaRef(body) },
      decisions,
      criteria,
      artifacts,
      reviews,
      evidence,
      questions,
      blockers,
      attempts,
      effects,
      changes,
      inspection,
      messages: rawMessages,
      gaps,
      throughSeq,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      snapshotWarning,
      integrity: {
        status: gaps.some((g) => g.severity !== "pending") ? "gap" : [...reviews, ...decisions, ...evidence].some((v) => v.integrity === "verified") ? "verified" : "pending",
        scope: "Current proof checks only; not an acceptance decision or coverage total."
      },
      obligations: {
        reviewRequirements: body.review_requirements,
        artifactExpectation: body.artifact_expectation,
        artifactReason: body.artifact_expectation_reason,
        artifactTargets: body.artifact_targets,
        dependencies
      },
      history: {
        totalMessages: context?.messageCount ?? null,
        shownMessages: rawMessages.length,
        cursor: !context ? { threadId: itemId, beforeSeq: throughSeq + 1, remainingCount: null } : context.messageCount > rawMessages.length ? {
          threadId: itemId,
          beforeSeq: rawMessages[0]?.eventSeq ?? throughSeq + 1,
          remainingCount: context.messageCount - rawMessages.length
        } : null,
        limitation: "Recent message excerpts only (512 UTF-8 bytes each). Full and older messages are captured in linked offline pages from this same database snapshot. Verdicts, artifact registry metadata and question records below are not truncated. Artifact content previews have separately disclosed byte budgets."
      }
    });
    safe.messages = safe.messages.map(({ payload, ...message }) => ({ ...message, payloadExcerpt: excerpt(payload) }));
    return safe;
  });
}

// src/core/lib/coordination-runtime/report.mjs
function writeReport({ root, itemId, view }) {
  const manifest = workspaceManifest(root);
  const privacy = privateAdmission(root);
  if (privacy.errors.length) throw new RuntimeError("INVALID_INPUT", privacy.errors.join("; "));
  if (view?.item?.id !== itemId || view.workspace?.id !== manifest.workspace_id || view.workspace?.root !== normalized(root) || !Number.isSafeInteger(view.throughSeq) || view.throughSeq < 0 || typeof view.generatedAt !== "string" || !Number.isFinite(Date.parse(view.generatedAt))) {
    throw new RuntimeError("INVALID_INPUT", "report identity, sequence or generation time does not match workspace/item");
  }
  const safe = redactReport(view);
  if (safe.inspection && (safe.inspection.threadId !== itemId || safe.inspection.throughSeq !== safe.throughSeq)) {
    throw new RuntimeError("INVALID_INPUT", "inspection scope must match the captured report");
  }
  if (!safe.inspection && ((safe.history?.totalMessages ?? 0) > 0 || safe.artifacts?.length)) {
    throw new RuntimeError("EVIDENCE_GAP", "full captured inspection is required; rebuild this report from its store");
  }
  const html = renderHtml(safe);
  const markdown = renderMarkdown(safe);
  const digest = hash2(html);
  const paths = reportPaths({ root, itemId, throughSeq: view.throughSeq, digest });
  const companions = renderCompanions(safe, fileName(paths.path));
  const metadata = {
    schema_version: 2,
    kind: "kai-coordination-report",
    derived: true,
    workspace: safe.workspace,
    item: { id: itemId, version: safe.item.version },
    through_seq: safe.throughSeq,
    generated_at: safe.generatedAt,
    snapshot_warning: snapshotWarning,
    html: { file: fileName(paths.path), digest },
    markdown: { file: fileName(paths.markdownPath), digest: hash2(markdown) },
    companions: companions.map(({ file, kind, bytes }) => ({ file, kind, digest: hash2(bytes) })),
    redactions: safe.redactions,
    view_digest: hash2(JSON.stringify(safe)),
    view: safe
  };
  const landing = renderLanding(metadata);
  metadata.landing = { file: "index.html", digest: hash2(landing) };
  return persistReportFiles({
    root,
    itemId,
    throughSeq: safe.throughSeq,
    digest,
    html,
    markdown,
    companions,
    landing,
    metadata: `${JSON.stringify(metadata, null, 2)}
`
  });
}

// src/core/lib/coordination-runtime/cli.mjs
var fail = (code, message) => {
  throw new RuntimeError(code, message);
};
var reads = /* @__PURE__ */ new Set(["inspect", "status", "context", "detail", "messages", "export", "legacy", "hash"]);
var required = (options, name) => options[name] ?? fail("INVALID_INPUT", `--${name} is required`);
async function execute({ verb, options, body, host, cwd, env }) {
  const resolved = resolveWorkspaceRoot({ explicitRoot: options.root, cwd, env });
  if (!resolved.ok) fail("INVALID_INPUT", resolved.reason);
  const { root } = resolved;
  const manifest = migrationManifest(root, [3, 4], env);
  const path = safePath(root, DATABASE);
  const base = { ok: true, mode: verb, root, schemaVersion: manifest.schema_version, storeExists: existsSync(path) };
  if (reads.has(verb)) {
    if (verb === "inspect") {
      let runtime = null;
      if (manifest.schema_version === 4 && base.storeExists) {
        const store3 = openStore({ path, mode: "read" });
        try {
          runtime = readStoreSummary(store3);
        } finally {
          closeStore(store3);
        }
      }
      return { ...base, runtime, ...options.deep ? { inspection: inspectRuntime(root, { env, intent: "inspect" }) } : {} };
    }
    if (manifest.schema_version === 3) {
      if (verb === "legacy") {
        if (options.raw && !options.source) fail("INVALID_INPUT", "raw legacy reads require one --source ID");
        const sources = sourceSnapshot(root).map((source) => ({ ...source, sourceId: hash(source.path), status: "historical-unverified" })).filter((source) => !options.source || source.sourceId === options.source);
        if (options.source && sources.length !== 1) fail("EVIDENCE_GAP", "legacy source identity does not exist");
        return { ...base, sources: sources.map((source) => ({ ...source, ...options.raw ? {
          raw: exactFile(root, source.path).toString("base64"),
          rawEncoding: "base64"
        } : {} })) };
      }
      if (verb === "status") {
        const { collect } = await import("./work-status.mjs");
        return { ...base, status: collect(root) };
      }
      fail("SCHEMA_MISMATCH", "schema 3 supports inspect/status/legacy only; explicitly migrate for runtime detail");
    }
    if (!base.storeExists) fail("SCHEMA_MISMATCH", "coordination store is missing; use explicit authorized init");
    const store2 = openStore({ path, mode: "read" });
    try {
      if (verb === "status") return { ...base, items: listAllRecords(store2, { kind: "item" }) };
      if (verb === "context") return { ...base, context: projectContext(store2, {
        itemId: required(options, "item"),
        maxBytes: options["max-bytes"],
        recentLimit: options["recent-limit"]
      }) };
      if (verb === "detail") return { ...base, record: readDetail(store2, { kind: required(options, "kind"), id: required(options, "id") }) };
      if (verb === "messages") return { ...base, ...readMessages(store2, {
        threadId: required(options, "item"),
        beforeSeq: options["before-seq"],
        limit: options.limit
      }) };
      if (verb === "legacy") return { ...base, sources: readLegacyRecords(store2, {
        sourceId: options.source,
        includeRaw: options.raw ?? false
      }).map((source) => ({ ...source, ...source.raw ? { raw: source.raw.toString("base64"), rawEncoding: "base64" } : {} })) };
      if (verb === "hash") return { ...base, subject: hashArtifact({ root, relativePath: required(options, "path") }) };
      if (verb === "export") {
        const itemId = required(options, "item");
        const view = buildReport(store2, { itemId });
        return { ...base, report: writeReport({ root, itemId, view }) };
      }
    } finally {
      closeStore(store2);
    }
  }
  if (manifest.schema_version !== 4 && !["request", "authorize", "receipt", "capabilities", "migrate", "recover", "rollback"].includes(verb)) {
    fail("SCHEMA_MISMATCH", "schema 3 is inspect-only; use explicit offline migration");
  }
  if (verb === "apply") validateCommand(body);
  if (!host) {
    const { createNativeHost } = await import("./chunk-JUWHGISQ.mjs");
    host = createNativeHost({ env });
  }
  if (["request", "authorize", "receipt", "capture", "capabilities", "prepare"].includes(verb)) {
    return { ...base, ...await host[verb]({ root, body, options }) };
  }
  if (["init", "migrate", "recover", "rollback", "repair"].includes(verb)) {
    const result = await host.maintenance({ root, verb, body, options, env });
    return {
      ...base,
      ...result,
      schemaVersion: migrationManifest(root, [3, 4], env).schema_version,
      storeExists: existsSync(path)
    };
  }
  assertWorkspaceWrite(path, { requirePrivate: true });
  if (!base.storeExists) fail("SCHEMA_MISMATCH", "coordination store is missing; use explicit authorized init");
  const store = openStore({ path, mode: "write" });
  try {
    if (verb === "delegate") return { ...base, ...await host.delegate({ root, store, body, options }) };
    if (verb === "claim") return { ...base, ...await host.claim({ root, store, options }) };
    if (verb === "plan") return { ...base, ...await host.plan({ root, store, itemId: required(options, "item") }) };
    return await host.apply({ root, store, command: body, options });
  } finally {
    closeStore(store);
  }
}
export {
  execute
};
