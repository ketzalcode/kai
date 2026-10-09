import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  planHierarchy
} from "./chunk-XGFCMCLC.mjs";
import {
  artifactBasisCurrent,
  bindEvidenceReadView,
  completionApproval,
  currentDirectionForStore,
  effectiveApprovals,
  effectiveEvidence,
  effectiveReviews,
  exactFile,
  hashArtifact,
  hierarchyContext,
  hierarchyStatus,
  matchesAcceptance,
  projectBinding,
  readDetail,
  readMessages,
  recoveryResolution,
  requireDeploymentEvidence,
  requireOperatorApproval,
  requireReleaseEvidence,
  requireReviews,
  safePath,
  scanExactFile,
  taskStateSatisfies,
  verifyArtifact,
  verifyAssetContent,
  verifyReferences,
  verifySubject,
  verifyVerdict,
  workspaceManifest
} from "./chunk-CKXCYZWQ.mjs";
import {
  assertWorkspaceWrite,
  closeStore,
  inspectGitPrivacy,
  listAllRecords,
  listRecords,
  openStore,
  readDirection,
  readRecord,
  readSnapshot,
  readStoreSummary,
  readSubjectView,
  readWorkspaceContract
} from "./chunk-S7AQGXMM.mjs";
import {
  readWorkspaceManifest,
  resolveWorkspaceRoot,
  validateSchema5Manifest
} from "./chunk-L4TFCRET.mjs";
import {
  RuntimeError,
  canonicalJson,
  criteriaRef,
  isProducingRun,
  subjectEquals,
  subjectRef,
  validateCommand,
  validateHierarchySubject,
  validateRecord
} from "./chunk-HMPQ32NA.mjs";
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
  normalized,
  workspaceRootFromCoordinationDatabase
} from "./chunk-VVVMKUAL.mjs";

// src/core/lib/coordination-runtime/cli.mjs
import { existsSync as existsSync2 } from "node:fs";

// src/core/lib/coordination-runtime/inspection.mjs
import { existsSync } from "node:fs";
function inspectRuntime(root, { env = process.env, intent = "coordinate" } = {}) {
  const result = { errors: [], warnings: [], runtime: null };
  if (!["inspect", "coordinate"].includes(intent)) {
    result.errors.push("workspace intent must be inspect or coordinate");
    return result;
  }
  let store;
  try {
    const current = readWorkspaceManifest(root);
    if (!current.ok) {
      result.errors.push(current.reason);
      return result;
    }
    if (current.manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
      result.errors.push(
        "workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard"
      );
      return result;
    }
    const validation = validateSchema5Manifest(root, current.manifest, { env });
    result.errors.push(...validation.errors);
    const privacy = inspectGitPrivacy(root, current.manifest.placement);
    result.errors.push(...privacy.errors, ...privacy.missing.map((path) => `private workspace path must be ignored: ${path}`));
    if (current.manifest.placement === "repo-local" && !privacy.gitRoot) {
      result.errors.push("repo-local placement requires a readable Git work tree");
    }
    result.warnings.push(...privacy.warnings);
    try {
      readDirection({ workspaceRoot: root, manifest: current.manifest });
    } catch (error) {
      result.errors.push(error.message);
    }
    if (result.errors.length) return result;
    const databasePath = safePath(root, COORDINATION_DATABASE);
    if (!existsSync(databasePath)) {
      result.errors.push(`schema 5 coordination database is missing at ${COORDINATION_DATABASE}`);
      return result;
    }
    exactFile(root, COORDINATION_DATABASE);
    store = openStore({ path: databasePath, mode: "read" });
    result.runtime = readStoreSummary(store);
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    closeStore(store);
  }
  return result;
}

// src/core/lib/coordination-runtime/report-safety.mjs
import { createHash } from "node:crypto";
var hash = (value) => createHash("sha256").update(value).digest("hex");
var knownGap = (error) => error instanceof RuntimeError && ["EVIDENCE_GAP", "AUTHORITY_REQUIRED", "INVALID_INPUT"].includes(error.code);
var tokenKey = (key) => /^token$|lease.*token$/i.test(key);
function possibleBearerSuffix(text, secret) {
  const prefix = secret.slice(0, Math.min(text.length, secret.length - 1));
  const fallback = new Uint32Array(prefix.length);
  let matched = 0;
  for (let i = 1; i < prefix.length; i++) {
    while (matched && prefix[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (prefix[i] === prefix[matched]) matched++;
    fallback[i] = matched;
  }
  matched = 0;
  for (let i = text.length - prefix.length; i < text.length; i++) {
    while (matched && text[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (text[i] === prefix[matched]) matched++;
  }
  return matched;
}
function redactPreview(preview, secrets, notice) {
  const text = preview.content;
  if (!secrets.size) return { content: text, boundaryWithheldBytes: 0 };
  const patterns = new Set(secrets);
  if (preview.encoding === "latin1") {
    for (const secret of secrets) patterns.add(Buffer.from(secret.slice(0, text.length + 1)).toString("latin1"));
  }
  const masked = new Uint8Array(text.length);
  const mark = (start, end, flag) => {
    if (preview.encoding === "utf8") {
      if (/[\uDC00-\uDFFF]/.test(text[start]) && /[\uD800-\uDBFF]/.test(text[start - 1])) start--;
      if (/[\uD800-\uDBFF]/.test(text[end - 1]) && /[\uDC00-\uDFFF]/.test(text[end])) end++;
    }
    for (let i = start; i < end; i++) if (!masked[i]) masked[i] = flag;
  };
  let boundaryStart = text.length;
  for (const secret of patterns) {
    let markedThrough = 0;
    for (let start = text.indexOf(secret); start !== -1; start = text.indexOf(secret, start + 1)) {
      mark(Math.max(start, markedThrough), start + secret.length, 1);
      markedThrough = start + secret.length;
      notice.occurrences++;
    }
    if (preview.previewState === "limited") {
      boundaryStart = Math.min(boundaryStart, text.length - possibleBearerSuffix(text, secret));
    }
  }
  let boundaryWithheldBytes = 0;
  if (boundaryStart < text.length) {
    mark(boundaryStart, text.length, 2);
    for (let start = 0; start < text.length; ) {
      if (masked[start] !== 2) {
        start++;
        continue;
      }
      let end = start + 1;
      while (masked[end] === 2) end++;
      boundaryWithheldBytes += Buffer.byteLength(text.slice(start, end), preview.encoding);
      start = end;
    }
    if (boundaryWithheldBytes) notice.boundaries++;
  }
  const parts = [];
  for (let start = 0; start < text.length; ) {
    let end = start;
    let flags = 0;
    const withheld = !!masked[start];
    while (end < text.length && !!masked[end] === withheld) flags |= masked[end++];
    parts.push(!withheld ? text.slice(start, end) : flags & 2 ? "[withheld possible bearer-boundary]" : "[redacted bearer]");
    start = end;
  }
  return { content: parts.join(""), boundaryWithheldBytes };
}
function redaction(value) {
  const secrets = /* @__PURE__ */ new Set();
  const notice = { fields: 0, occurrences: 0, boundaries: 0 };
  const previews = new Set(value?.inspection?.artifactPreviews ?? []);
  function find(entry) {
    if (!entry || typeof entry !== "object") return;
    for (const [key, child] of Object.entries(entry)) {
      if (tokenKey(key) && typeof child === "string" && child) secrets.add(child);
      else find(child);
    }
  }
  find(value);
  function cleanText(entry, replaceKnown = true) {
    if (replaceKnown) for (const secret of secrets) entry = entry.replaceAll(secret, () => {
      notice.occurrences++;
      return "[redacted bearer]";
    });
    entry = entry.replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, () => {
      notice.occurrences++;
      return "[redacted bearer]";
    }).replace(/("(?:token|[^"]*lease[^"]*token)"\s*:\s*")([^"]+)(")/gi, (match, start, value2, end) => {
      if (value2 === "[redacted bearer]") return match;
      notice.occurrences++;
      return `${start}[redacted bearer]${end}`;
    });
    return entry;
  }
  function clean(entry) {
    if (typeof entry === "string") return cleanText(entry);
    if (Array.isArray(entry)) return entry.map(clean);
    if (!entry || typeof entry !== "object") return entry;
    const preview = previews.has(entry) && typeof entry.content === "string" ? redactPreview(entry, secrets, notice) : null;
    const result = Object.fromEntries(Object.entries(entry).filter(([key]) => {
      if (!tokenKey(key)) return true;
      notice.fields++;
      return false;
    }).map(([key, child]) => [key, preview && key === "content" ? cleanText(preview.content, false) : clean(child)]));
    if (preview?.boundaryWithheldBytes) {
      result.boundaryWithheldBytes = (entry.boundaryWithheldBytes ?? 0) + preview.boundaryWithheldBytes;
    }
    return result;
  }
  return { value: clean(value), notice };
}
function redactReport(value) {
  const result = redaction(value);
  const boundaries = (value.redactions?.boundaries ?? 0) + result.notice.boundaries;
  return { ...result.value, redactions: {
    fields: (value.redactions?.fields ?? 0) + result.notice.fields,
    occurrences: (value.redactions?.occurrences ?? 0) + result.notice.occurrences,
    ...boundaries || value.redactions?.boundaries !== void 0 ? { boundaries } : {}
  } };
}
var artifactPreviewLimits = Object.freeze({ perArtifactBytes: 64 * 1024, aggregateBytes: 1024 * 1024 });
var snapshotWarning = "Snapshot \u2014 not live. Recorded lifecycle is historical truth, not a new acceptance or shipping decision. Current proof checks and their gaps are listed; historical proof is not reaccepted. Files can change after generation.";

// src/core/lib/coordination-runtime/report-data.mjs
import { join } from "node:path";

// src/core/lib/coordination-runtime/report-capture.mjs
import { execFileSync } from "node:child_process";
function captureHistory(store, subject, version, throughSeq, addGap) {
  const subjectColumn = store.schemaVersion === 1 ? "item_id" : "subject_id";
  const subjectKind = store.schemaVersion === 1 ? null : subject.kind;
  const subjectFilter = store.schemaVersion === 1 ? `e.${subjectColumn} = ?` : `e.subject_kind = ? AND e.${subjectColumn} = ?`;
  const statement = store.database.prepare(`
    SELECT e.seq, e.message_id, r.kind, r.id, r.subject_kind, r.subject_id,
      r.version, r.body
    FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
    WHERE e.thread_id = ? AND ${subjectFilter}
      AND e.message_id IS NOT NULL AND e.seq < ?
    ORDER BY e.seq DESC LIMIT 50
  `);
  const pages = [];
  let beforeSeq = throughSeq + 1;
  const threadId = subjectRef(subject, version);
  for (; ; ) {
    const rows = statement.all(
      threadId,
      ...subjectKind === null ? [subject.id] : [subjectKind, subject.id],
      beforeSeq
    );
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
          subject: row.subject_kind === null ? null : { kind: row.subject_kind, id: row.subject_id },
          version: row.version,
          body: JSON.parse(row.body)
        });
        if (!subjectEquals(record.subject, subject) || record.body.thread_id !== threadId || record.body.basis_version !== version) {
          entry.gap = "Message subject/thread mismatches captured scope; content withheld.";
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
      if (artifact.manifest_path !== `${artifact.run_directory}/.evidence/${artifact.artifact_id}/manifest.json` || scanExactFile(root, artifact.manifest_path).digest !== hash(canonicalJson({
        subject: artifact.content_ref,
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
    if (artifact.content_ref.kind !== "git") {
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
    const key = canonicalJson([artifact.project_id, artifact.content_ref]);
    if (seen.has(key)) continue;
    seen.add(key);
    try {
      verifySubject(root, artifact.content_ref, artifact.project_id);
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
        artifact.content_ref.base,
        artifact.content_ref.head,
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
        ...artifact.content_ref,
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
var bindsSubject = (record, subject) => record?.subject?.kind === subject.kind && record.subject.id === subject.id;
var contentEquals = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
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
function buildReport(store, { subject }) {
  if (!subject || typeof subject !== "object") throw new RuntimeError("INVALID_INPUT", "report subject is required");
  const root = workspaceRootFromCoordinationDatabase(store.path);
  const manifest = workspaceManifest(root);
  const database = COORDINATION_DATABASE;
  if (normalized(store.path) !== normalized(join(root, ...database.split("/")))) {
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
    const contextRead = check(`${subject.kind}:${subject.id}`, () => readSubjectView(store, {
      subject,
      recentLimit: 8
    }));
    const context = contextRead.value;
    const item = context?.record ?? readRecord(store, subject.kind, subject.id);
    if (!item) throw new RuntimeError("EVIDENCE_GAP", `${subject.kind}/${subject.id} does not exist`);
    const throughSeq = context?.throughSeq ?? Number(store.database.prepare(
      "SELECT COALESCE(MAX(seq), 0) AS seq FROM events"
    ).get().seq);
    const cache = /* @__PURE__ */ new Map();
    const recordsById = /* @__PURE__ */ new Map();
    const itemSubject = subject;
    const list = (kind, subject2 = void 0) => {
      const key = `${kind}\0${subject2 === void 0 ? "*" : canonicalJson(subject2)}`;
      if (!cache.has(key)) {
        const records = listRecords(store, { kind, subject: subject2 });
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
    const currentCriteria = check(
      "criteria",
      () => criteriaRef(item, (kind, id) => tx.get(kind, id))
    ).value ?? null;
    const artifacts = list("artifact", itemSubject).map((record) => ({
      id: record.id,
      ref: `artifact:${record.id}`,
      version: record.version,
      ...record.body,
      status: bindsSubject(record, itemSubject) && currentCriteria !== null && record.body.criteria_ref === currentCriteria && (item.kind !== "task" || contentEquals(record.body.content_ref, item.body.change_ref)) ? "current" : "historical",
      integrity: "not-rechecked",
      assets: []
    }));
    const assets = list("asset", itemSubject);
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
      const records = list(kind, itemSubject);
      const result = check(`${kind}s`, () => effectiveFn(records.map((r) => r.body), item, (recordKind, id) => tx.get(recordKind, id)));
      const effectiveIds = result.ok ? new Set(result.value.map((b) => b[idKey])) : null;
      verdicts[kind] = records.map((record) => {
        const b = record.body;
        const recovery = b.kind === "operator-recovery-resolution";
        const current = currentCriteria !== null && (recovery ? b.criteria_ref === currentCriteria && b.recovery.attempt_id === body.recovery_hold : matchesAcceptance(b, item, (recordKind, id) => tx.get(recordKind, id)));
        const actor = b.reviewer ?? b.authority ?? null;
        const independent = actor === null ? null : (item.kind !== "task" || !isProducingRun(body, actor)) && !artifacts.some((a) => contentEquals(a.content_ref, b.content_ref) && a.producer.runId === actor.runId);
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
          } else if (item.kind === "task") {
            verifyVerdict(tx, item, b, actor);
            if (artifacts.some((a) => a.status === "current" && a.integrity === "gap")) {
              throw new RuntimeError("EVIDENCE_GAP", "Current subject artifact or asset has an integrity/validity gap.");
            }
          } else {
            verifyReferences({ root }, tx, item, b.evidence_refs);
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
      const requiredReviews = item.kind === "task" ? check("required-reviews", () => requireReviews(tx, item), "broken-claim") : { ok: true };
      if (!completion.ok || !requiredReviews.ok) {
        completionClaims.forEach((c) => {
          c.integrity = "gap";
        });
      }
    }
    if (terminal.has(body.state) && body.state !== "dropped" && !completionClaims.length) {
      addGap("completion", "Recorded terminal state retained; current completion proof is missing or stale.");
    }
    const recordedPhase = body.state === "blocked" ? body.resume_state : body.state;
    if (item.kind === "task" && ["release-ready", "deploying", "production-verification", "shipped"].includes(recordedPhase)) {
      check("completion", () => completionApproval(tx, item), "broken-claim");
      check("required-reviews", () => requireReviews(tx, item), "broken-claim");
      check("release-evidence", () => requireReleaseEvidence(tx, item), "broken-claim");
    }
    if (item.kind === "task" && ["deploying", "production-verification", "shipped"].includes(recordedPhase)) {
      check("deployment-start", () => requireOperatorApproval(tx, item, "operator-deploy-start"), "broken-claim");
    }
    if (item.kind === "task" && ["production-verification", "shipped"].includes(recordedPhase)) {
      check("deployment-complete", () => requireOperatorApproval(tx, item, "operator-deploy-complete"), "broken-claim");
      check("deployment", () => requireDeploymentEvidence(tx, item, "deployment"), "broken-claim");
    }
    if (item.kind === "task" && recordedPhase === "shipped") {
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
        criteriaRef: currentCriteria,
        status: bad ? "gap" : good.length ? "verified" : "pending",
        verdictRefs: support.map((r) => r.ref),
        evidenceRefs: [...new Set(support.flatMap((r) => r.evidence_refs))],
        explanation: "Exact criterion text matched to review criteria or observed check labels; subject-level approval alone does not imply per-criterion coverage."
      };
    });
    const references = /* @__PURE__ */ new Set([
      ...body.context_artifacts ?? [],
      ...context?.referencedDetails.map((d) => d.reference) ?? []
    ]);
    for (const reference of references) {
      const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
      if (!match) addGap(reference, "Reference is not a registered artifact/evidence identity; not linked.");
      else if (!tx.get(match[1].toLowerCase(), match[2])) addGap(reference, "Referenced record is missing.");
    }
    const questions = list("question", itemSubject).map((record) => ({
      id: record.id,
      ref: `question:${record.id}`,
      version: record.version,
      ...record.body,
      disposition: terminal.has(body.state) ? "historical-follow-up" : record.body.status === "answered" ? "addressed" : record.body.blocking ? "blocking" : "nonblocking"
    }));
    const blockers = questions.filter((q) => q.disposition === "blocking");
    const questionsById = new Map(questions.map((q) => [q.id, q]));
    for (const id of body.waiting_on_questions ?? []) {
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
      if (!bindsSubject(opening, subject) || opening.body.kind !== "question") {
        addGap(question.ref, "Question opening message is missing or mismatched.");
      }
      for (const id of question.answer_message_ids) {
        const answer = tx.get("message", id);
        if (!bindsSubject(answer, subject) || answer.body.kind !== "answer") {
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
      if (!bindsSubject(attempt, subject) || attempt.body.disposition !== "conflicting-partial-work") {
        addGap(`attempt:${body.recovery_hold}`, "Recovery hold attempt is missing or mismatched.");
      }
    }
    const dependencies = (context?.dependencies ?? (body.depends_on ?? []).map((dependency) => {
      const dependencyId = dependency.task;
      return { dependency, record: tx.get("task", dependencyId) };
    })).map(({ dependency, record }) => {
      const dependencyId = dependency.task;
      return {
        task: dependencyId,
        requires: dependency.requires,
        state: record?.body.state ?? null,
        version: record?.version ?? null,
        status: !record ? "missing" : record.body.state === "dropped" ? "failed" : taskStateSatisfies(record, dependency.requires) ? "satisfied" : "pending"
      };
    });
    for (const dependency of dependencies) {
      if (dependency.status === "satisfied") continue;
      const ref = `task:${dependency.task}`;
      const ask = dependency.status === "pending" ? `Waiting for ${dependency.task}: recorded ${dependency.state}; requires ${dependency.requires}.` : dependency.status === "failed" ? `Dependency ${dependency.task} was dropped; recorded requirement ${dependency.requires} failed. Owner decision required.` : `Dependency ${dependency.task} is missing; restore evidence before resolving its requirement.`;
      addGap(ref, ask, dependency.status === "pending" ? "pending" : "gap");
      if (!terminal.has(body.state)) blockers.push({ ref, kind: "dependency", status: dependency.status, ask });
    }
    const attempts = [
      ...list("host-attempt", itemSubject).map((r) => ({ id: r.id, ref: `host-attempt:${r.id}`, type: "host", version: r.version, ...r.body })),
      ...list("attempt", itemSubject).map((r) => ({ id: r.id, ref: `attempt:${r.id}`, type: "recovery", version: r.version, ...r.body }))
    ];
    const effects = list("effect", itemSubject).map((r) => ({ id: r.id, ref: `effect:${r.id}`, version: r.version, ...r.body }));
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
      const inScope = bindsSubject(record, subject) && record.body.thread_id === subjectRef(subject, item.version);
      if (!inScope) addGap(`message:${record.id}`, "Message subject/thread mismatches captured scope; content withheld.");
      return inScope;
    }).map(({ record, eventSeq }) => ({
      id: record.id,
      ref: `message:${record.id}`,
      eventSeq,
      ...record.body
    }));
    const acceptedReportArtifacts = new Set(decisions.filter((decision) => decision.status === "current" && decision.kind === "completion" && decision.decision === "approved" && decision.integrity === "verified").flatMap((decision) => decision.evidence_refs).filter((reference) => reference.startsWith("artifact:")).map((reference) => reference.slice("artifact:".length)));
    const acceptedApprovalIds = new Set(decisions.filter((decision) => decision.status === "current" && decision.kind === "completion" && decision.decision === "approved" && decision.integrity === "verified").map((decision) => decision.approval_id));
    const reportArtifacts = artifacts.filter((artifact) => artifact.classification === "public" && artifact.status === "current" && artifact.integrity === "verified" && acceptedReportArtifacts.has(artifact.id) && (item.kind === "task" || artifact.assets.some((asset) => asset.validity === "current" && acceptedApprovalIds.has(asset.completion_approval_id) && !(/* @__PURE__ */ new Set(["scratch", "draft", "discarded", "retracted"])).has(asset.disposition))));
    if (artifacts.length > reportArtifacts.length) {
      addGap("private-evidence", "Private evidence metadata and bytes were withheld from the report.", "pending");
    }
    const reportEvidence = evidence.filter((entry) => {
      const classification = entry.provenance?.capture?.classification ?? "public";
      if (classification === "public") return true;
      addGap(
        entry.ref,
        "Private evidence content was withheld; only an accepted public report artifact safe excerpt may be shown.",
        "pending"
      );
      return false;
    });
    const inspection = {
      subject,
      throughSeq,
      messagePages: captureHistory(store, subject, item.version, throughSeq, addGap),
      artifactPreviews: captureArtifacts(root, reportArtifacts, addGap)
    };
    inspection.previewBudget = {
      ...artifactPreviewLimits,
      capturedBytes: inspection.artifactPreviews.reduce((sum, preview) => sum + preview.previewBytes, 0)
    };
    const changes = captureChanges(root, reportArtifacts, addGap);
    const safe = redactReport({
      schema_version: 2,
      workspace: { id: manifest.workspace_id, root: normalized(root) },
      subject: {
        kind: item.kind,
        id: item.id,
        version: item.version,
        ...body,
        criteriaRef: currentCriteria
      },
      decisions,
      criteria,
      artifacts: reportArtifacts,
      reviews,
      evidence: reportEvidence,
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
        reviewRequirements: body.review_requirements ?? [],
        artifactExpectation: body.artifact_expectation ?? null,
        artifactReason: body.artifact_expectation_reason ?? null,
        artifactTargets: body.artifact_targets ?? [],
        dependencies
      },
      history: {
        totalMessages: context?.messageCount ?? null,
        shownMessages: rawMessages.length,
        cursor: !context ? {
          subject,
          threadId: subjectRef(subject, item.version),
          basisVersion: item.version,
          beforeSeq: throughSeq + 1,
          remainingCount: null
        } : context.messageCount > rawMessages.length ? {
          subject,
          threadId: subjectRef(subject, item.version),
          basisVersion: item.version,
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

// src/core/lib/coordination-runtime/cli.mjs
var fail = (code, message) => {
  throw new RuntimeError(code, message);
};
var reads = /* @__PURE__ */ new Set([
  "inspect",
  "status",
  "context",
  "detail",
  "messages",
  "export",
  "hash",
  "plan"
]);
var required = (options, name) => options[name] ?? fail("INVALID_INPUT", `--${name} is required`);
var hierarchySubject = (options) => validateHierarchySubject({
  kind: required(options, "kind"),
  id: required(options, "id")
});
async function installedRoles(host, root, env) {
  let selected = host;
  if (!selected) {
    const { createNativeHost } = await import("./chunk-IX3C5PB7.mjs");
    selected = createNativeHost({ env });
  }
  if (!selected?.capabilities) return [];
  let result;
  try {
    result = await selected.capabilities({ root });
  } catch (error) {
    if (error instanceof RuntimeError && (/* @__PURE__ */ new Set(["ROLE_UNAVAILABLE", "UNSUPPORTED_HOST"])).has(error.code)) {
      return [];
    }
    throw error;
  }
  const roster = result?.discovery?.roster;
  if (!Array.isArray(roster)) return [];
  return [...new Set(roster.map((entry) => entry?.role).filter((role) => typeof role === "string" && role !== ""))].sort();
}
function hierarchyDirection(store) {
  const [epic] = listAllRecords(store, { kind: "epic" });
  return epic ? currentDirectionForStore(store, epic.body.direction_ref) : null;
}
async function execute({ verb, options, body, host, cwd, env }) {
  const resolved = resolveWorkspaceRoot({ explicitRoot: options.root, cwd, env });
  if (!resolved.ok) fail(resolved.code ?? "INVALID_INPUT", resolved.reason);
  const { root } = resolved;
  const manifest = readWorkspaceContract(root, { env });
  const database = COORDINATION_DATABASE;
  const path = safePath(root, database);
  const base = { ok: true, mode: verb, root, schemaVersion: manifest.schema_version, storeExists: existsSync2(path) };
  if (reads.has(verb)) {
    if (verb === "inspect") {
      let runtime = null;
      if (base.storeExists) {
        const store3 = openStore({ path, mode: "read" });
        try {
          runtime = readStoreSummary(store3);
        } finally {
          closeStore(store3);
        }
      }
      return { ...base, runtime, ...options.deep ? { inspection: inspectRuntime(root, { env, intent: "inspect" }) } : {} };
    }
    if (!base.storeExists) fail("RECOVERY_REQUIRED", "coordination store is missing; use the standalone workspace initializer");
    const store2 = openStore({ path, mode: "read" });
    try {
      const roles = ["status", "context", "plan"].includes(verb) ? await installedRoles(host, root, env) : [];
      if (verb === "status") {
        return readSnapshot(store2, () => ({
          ...base,
          status: hierarchyStatus(store2, {
            direction: hierarchyDirection(store2),
            roles
          })
        }));
      }
      if (verb === "context") {
        return readSnapshot(store2, () => ({
          ...base,
          context: hierarchyContext(store2, {
            subject: hierarchySubject(options),
            maxBytes: options["max-bytes"],
            recentLimit: options["recent-limit"],
            direction: hierarchyDirection(store2),
            roles
          })
        }));
      }
      if (verb === "detail") {
        return readSnapshot(store2, () => ({
          ...base,
          record: readDetail(store2, {
            kind: required(options, "kind"),
            id: required(options, "id")
          })
        }));
      }
      if (verb === "messages") {
        return readSnapshot(store2, () => {
          const subject = hierarchySubject(options);
          const record = readDetail(store2, subject);
          return {
            ...base,
            ...readMessages(store2, {
              subject,
              threadId: subjectRef(subject, record.version),
              basisVersion: record.version,
              beforeSeq: options["before-seq"],
              limit: options.limit
            })
          };
        });
      }
      if (verb === "hash") return { ...base, subject: hashArtifact({ root, relativePath: required(options, "path") }) };
      if (verb === "export") {
        const subject = hierarchySubject(options);
        return readSnapshot(store2, () => ({
          ...base,
          report: buildReport(store2, { subject })
        }));
      }
      if (verb === "plan") {
        return readSnapshot(store2, () => ({
          ...base,
          ...planHierarchy({
            store: store2,
            subject: hierarchySubject(options),
            direction: hierarchyDirection(store2),
            roles
          })
        }));
      }
    } finally {
      closeStore(store2);
    }
  }
  if (verb === "apply") validateCommand(body);
  if (!base.storeExists) fail("RECOVERY_REQUIRED", "coordination store is missing; use the standalone workspace initializer");
  assertWorkspaceWrite(path, { requirePrivate: true, env });
  if (["request", "authorize", "receipt", "capture", "capabilities", "prepare"].includes(verb)) {
    const admitted = openStore({ path, mode: "read" });
    closeStore(admitted);
  }
  if (!host) {
    const { createNativeHost } = await import("./chunk-IX3C5PB7.mjs");
    host = createNativeHost({ env });
  }
  if (["request", "authorize", "receipt", "capture", "capabilities", "prepare"].includes(verb)) {
    return { ...base, ...await host[verb]({ root, body, options }) };
  }
  const store = openStore({ path, mode: "write" });
  try {
    if (verb === "delegate") return { ...base, ...await host.delegate({ root, store, body, options }) };
    if (verb === "claim") return { ...base, ...await host.claim({ root, store, options }) };
    return await host.apply({ root, store, command: body, options });
  } finally {
    closeStore(store);
  }
}
export {
  execute
};
