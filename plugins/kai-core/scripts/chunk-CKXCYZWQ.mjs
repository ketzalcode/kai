import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  listAllRecords,
  listRecords,
  readDirection,
  readMessagePage,
  readRecord,
  readSnapshot,
  readSubjectView
} from "./chunk-S7AQGXMM.mjs";
import {
  readWorkspaceManifest,
  validateSchema5Manifest
} from "./chunk-L4TFCRET.mjs";
import {
  DOD_DIMENSIONS,
  RuntimeError,
  assertExactKeys,
  canonicalJson,
  changedKeys,
  commandKind,
  criteriaRef,
  isProducingRun,
  parentClosureRef,
  subjectEquals,
  subjectRef,
  validateActor,
  validateAuthority,
  validateHierarchyRecord,
  validateHierarchySubject,
  validateSubjectRef
} from "./chunk-HMPQ32NA.mjs";
import {
  COORDINATION_DATABASE,
  TASK_NEEDS_CHANGE_REF,
  TASK_TERMINAL_STATES,
  WORKSPACE_SCHEMA_VERSION,
  badPath,
  directionPath,
  escapesRoot,
  inspectPrivateLanes,
  normalized,
  parseTypedArtifactRoute,
  pathHasLink,
  resolvedProjectPath,
  workspaceRootFromCoordinationDatabase
} from "./chunk-VVVMKUAL.mjs";

// src/core/lib/coordination-runtime/evidence-content.mjs
import { createHash } from "node:crypto";
import {
  closeSync,
  fstatSync,
  fsyncSync,
  mkdirSync,
  openSync,
  readFileSync,
  readSync,
  writeFileSync
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname, isAbsolute, join, resolve } from "node:path";
function fail(code, message) {
  throw new RuntimeError(code, message);
}
function durablePath(value) {
  if (typeof value !== "string" || !value.trim() || badPath(value)) {
    fail("INVALID_INPUT", "a complete workspace-relative or project-qualified path is required");
  }
  const normalized2 = value.replaceAll("\\", "/");
  const qualifier = /^project:([a-z][a-z0-9-]*):(.*)$/.exec(normalized2);
  const path2 = qualifier ? qualifier[2] : normalized2;
  const parts = path2.split("/").filter((part) => part !== ".");
  if (parts.some((part) => !part || /[:<>"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part))) {
    fail("INVALID_INPUT", "path contains an unsafe or ambiguous segment");
  }
  return (qualifier ? `project:${qualifier[1]}:` : "") + parts.join("/");
}
function workspaceManifest(root) {
  if (typeof root !== "string" || !isAbsolute(root)) fail("INVALID_INPUT", "explicit absolute workspace root is required");
  if (/^(\\\\|\/\/)/.test(root)) fail("UNSUPPORTED_HOST", "network workspaces are unsupported");
  if (process.platform === "win32" && !/^[a-z]:[\\/]/i.test(root)) {
    fail("INVALID_INPUT", "workspace root requires an explicit drive, not the current drive");
  }
  const manifestPath = join(root, ".kai", "manifest.json");
  if (pathHasLink(root, manifestPath) || escapesRoot(root, manifestPath)) {
    fail("INVALID_INPUT", "workspace manifest cannot traverse a link");
  }
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail("INVALID_INPUT", result.reason);
  const m = result.manifest;
  if (m.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    fail(
      "SCHEMA_MISMATCH",
      "workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard"
    );
  }
  const validation = validateSchema5Manifest(root, m);
  if (validation.errors.length) fail("INVALID_INPUT", validation.errors.join("; "));
  return m;
}
function projectBinding(root, projectId) {
  const matches = workspaceManifest(root).projects.filter((project2) => project2.id === projectId);
  if (matches.length !== 1 || typeof matches[0].path !== "string" || !matches[0].path.trim()) {
    fail("INVALID_INPUT", "project must have exactly one explicit workspace binding");
  }
  const project = matches[0];
  if (/^(\\\\|\/\/)/.test(project.path)) fail("UNSUPPORTED_HOST", "network projects are unsupported");
  if (/^[a-z]:(?![\\/])/i.test(project.path) || /^\\(?!\\)/.test(project.path) || process.platform === "win32" && isAbsolute(project.path) && !/^[a-z]:[\\/]/i.test(project.path)) {
    fail("INVALID_INPUT", "project binding cannot depend on the current drive or working directory");
  }
  const projectRoot = resolvedProjectPath(root, project.path);
  if (pathHasLink(projectRoot, projectRoot)) fail("INVALID_INPUT", "project root cannot be a link");
  return { project, projectRoot };
}
function assertWorkspacePath(root, relativePath) {
  const manifest = workspaceManifest(root);
  const path2 = durablePath(relativePath);
  const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/.exec(path2);
  let base = root;
  let local = path2;
  if (projectTarget) {
    const { project, projectRoot } = projectBinding(root, projectTarget[1]);
    base = projectRoot;
    local = projectTarget[2];
    const publication = durablePath(project.publication_root);
    if (publication.startsWith("project:") || publication.toLowerCase() === ".kai" || publication.toLowerCase().startsWith(".kai/") || local !== publication && !local.startsWith(`${publication}/`)) {
      fail("INVALID_INPUT", "public target escapes the declared project publication root");
    }
    if (normalized(base) !== normalized(root) && !escapesRoot(join(root, ".kai"), base)) {
      fail("INVALID_INPUT", "a project publication cannot alias private workspace state");
    }
    try {
      if (parseTypedArtifactRoute(local).visibility !== "public") {
        fail("INVALID_INPUT", "project publications require a typed public artifact route");
      }
    } catch (error) {
      if (error instanceof RuntimeError) throw error;
      fail("INVALID_INPUT", error.message);
    }
  } else {
    const runtimePath = path2 === COORDINATION_DATABASE || path2.startsWith(".kai/core/runtime/");
    const personalPath = /^\.kai\/(core|engineering|creative)\/[^/]+\/[^/]+\/personal(?:\/|$)/.test(path2);
    if (!runtimePath && !personalPath) {
      try {
        if (parseTypedArtifactRoute(path2).visibility !== "private") {
          fail("INVALID_INPUT", "private references require a typed .kai artifact route");
        }
      } catch (error) {
        if (error instanceof RuntimeError) throw error;
        fail("INVALID_INPUT", error.message);
      }
    }
  }
  const absolute = resolve(base, ...local.split("/"));
  if (escapesRoot(base, absolute) || pathHasLink(base, absolute)) {
    fail("INVALID_INPUT", "path escapes its root or traverses a symbolic link or junction");
  }
  if (!projectTarget) {
    const inspection = inspectPrivateLanes(root, [".kai"]);
    if (inspection.gitRoots.length || inspection.symbolicLinks.length || inspection.unreadable.length) {
      fail("INVALID_INPUT", "private lanes contain nested Git roots, links, or unreadable directories");
    }
  }
  return absolute;
}
var safePath = assertWorkspacePath;
function pathPrivacy(root, path2) {
  assertWorkspacePath(root, path2);
  if (path2.startsWith("project:")) return "public";
  if (/\/personal(?:\/|$)/i.test(path2)) return "personal";
  return "internal";
}
function readExactFile(root, path2, read) {
  const absolute = assertWorkspacePath(root, path2);
  let fd;
  try {
    fd = openSync(absolute, "r");
    const before = fstatSync(fd);
    if (!before.isFile() || before.nlink > 1) fail("INVALID_INPUT", "evidence must be a regular unshared file");
    const { value, size } = read(fd, before.size);
    const after = fstatSync(fd);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || size !== after.size) {
      fail("EVIDENCE_GAP", "evidence changed while reading");
    }
    return value;
  } catch (error) {
    if (error instanceof RuntimeError) throw error;
    fail("EVIDENCE_GAP", `referenced evidence is missing or unreadable: ${path2}`);
  } finally {
    if (fd !== void 0) closeSync(fd);
  }
}
function exactBytes(root, path2) {
  return readExactFile(root, path2, (fd) => {
    const bytes = readFileSync(fd);
    return { value: bytes, size: bytes.length };
  });
}
var exactFile = exactBytes;
function exclusiveFile(root, path2, bytes) {
  const target = assertWorkspacePath(root, path2);
  mkdirSync(dirname(target), { recursive: true });
  const fd = openSync(target, "wx", 384);
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
function scanExactFile(root, path2, consume = () => {
}) {
  return readExactFile(root, path2, (fd, expectedSize) => {
    const digest2 = createHash("sha256");
    const buffer = Buffer.alloc(64 * 1024);
    let size = 0;
    while (size < expectedSize) {
      const count = readSync(fd, buffer, 0, Math.min(buffer.length, expectedSize - size), null);
      if (!count) break;
      const chunk = buffer.subarray(0, count);
      digest2.update(chunk);
      consume(chunk);
      size += count;
    }
    return { value: { digest: digest2.digest("hex"), size }, size };
  });
}
var hash = (bytes) => createHash("sha256").update(bytes).digest("hex");
function hashArtifact({ root, relativePath }) {
  const path2 = durablePath(relativePath);
  return { kind: "sha256", digest: scanExactFile(root, path2).digest, path: path2 };
}
function orderedPaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0) fail("INVALID_INPUT", "bundle requires paths");
  const normalized2 = paths.map(durablePath).sort();
  if (new Set(normalized2.map((path2) => path2.toLowerCase())).size !== normalized2.length) {
    fail("INVALID_INPUT", "bundle contains duplicate paths or case collisions");
  }
  return normalized2;
}
function hashBundle({ root, paths }) {
  const entries = orderedPaths(paths).map((path2) => {
    const artifact = hashArtifact({ root, relativePath: path2 });
    return { path: path2, digest: artifact.digest };
  });
  return { kind: "bundle-sha256", digest: hash(canonicalJson(entries)), entries };
}
function verifySubject(root, subject, projectId) {
  validateSubjectRef(subject);
  if (subject.kind === "git") {
    if (!/^[0-9a-f]{40}$/.test(subject.base) || !/^[0-9a-f]{40}$/.test(subject.head)) {
      fail("INVALID_INPUT", "Git evidence requires full lowercase immutable commit IDs");
    }
    const { projectRoot } = projectBinding(root, projectId);
    try {
      const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)));
      const git = (args) => execFileSync("git", ["--no-pager", "-C", projectRoot, ...args], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...env, GIT_NO_REPLACE_OBJECTS: "1", GIT_OPTIONAL_LOCKS: "0", GIT_NO_LAZY_FETCH: "1", GIT_TERMINAL_PROMPT: "0" }
      }).trim();
      if (normalized(git(["rev-parse", "--show-toplevel"])) !== normalized(projectRoot)) {
        fail("EVIDENCE_GAP", "selected project must itself be the Git root");
      }
      for (const object of [subject.base, subject.head]) {
        if (git(["rev-parse", "--verify", `${object}^{commit}`]) !== object) {
          fail("EVIDENCE_GAP", "Git evidence does not resolve to the exact commit");
        }
      }
    } catch (error) {
      if (error instanceof RuntimeError) throw error;
      fail("EVIDENCE_GAP", "Git evidence objects do not exist in the selected project");
    }
    return [];
  }
  if (projectId !== null) fail("INVALID_INPUT", "non-Git subjects carry project-qualified paths, not projectId");
  const actual = subject.kind === "sha256" ? hashArtifact({ root, relativePath: subject.path }) : hashBundle({ root, paths: subject.entries.map((entry) => entry.path) });
  if (canonicalJson(actual) !== canonicalJson(subject)) {
    fail("EVIDENCE_GAP", "referenced content or bundle manifest changed");
  }
  return subject.kind === "sha256" ? [{ path: subject.path, digest: subject.digest }] : subject.entries;
}
function retainFile(root, path2, bytes) {
  const absolute = assertWorkspacePath(root, path2);
  mkdirSync(dirname(absolute), { recursive: true });
  assertWorkspacePath(root, path2);
  try {
    writeFileSync(absolute, bytes, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (!exactBytes(root, path2).equals(Buffer.from(bytes))) {
      fail("EVIDENCE_GAP", "retained snapshot already exists with different bytes");
    }
  }
}
function retainSubject(root, subject, projectId, runDirectory, artifactId) {
  const entries = verifySubject(root, subject, projectId);
  if (subject.kind === "git") return { snapshots: [], manifest_path: null };
  const base = `${runDirectory}/.evidence/${artifactId}`;
  const snapshots = entries.map((entry, index) => {
    const bytes = exactBytes(root, entry.path);
    if (hash(bytes) !== entry.digest) fail("EVIDENCE_GAP", "source changed before snapshot");
    const snapshot_path = `${base}/${String(index).padStart(4, "0")}.bin`;
    retainFile(root, snapshot_path, bytes);
    return { ...entry, snapshot_path };
  });
  const manifest_path = `${base}/manifest.json`;
  retainFile(root, manifest_path, canonicalJson({ subject, snapshots }));
  verifySubject(root, subject, projectId);
  return { snapshots, manifest_path };
}
function verifyArtifact(root, artifact) {
  const entries = verifySubject(root, artifact.content_ref, artifact.project_id);
  if (canonicalJson(entries) !== canonicalJson(artifact.snapshots.map(({ path: path2, digest: digest2 }) => ({ path: path2, digest: digest2 })))) {
    fail("EVIDENCE_GAP", "artifact snapshot manifest does not match its exact subject");
  }
  for (const snapshot of artifact.snapshots) {
    if (!snapshot.snapshot_path.startsWith(`${artifact.run_directory}/.evidence/${artifact.artifact_id}/`) || scanExactFile(root, snapshot.snapshot_path).digest !== snapshot.digest) {
      fail("EVIDENCE_GAP", "retained snapshot is missing or changed");
    }
  }
  if (artifact.content_ref.kind !== "git") {
    if (artifact.manifest_path !== `${artifact.run_directory}/.evidence/${artifact.artifact_id}/manifest.json` || scanExactFile(root, artifact.manifest_path).digest !== hash(canonicalJson({
      subject: artifact.content_ref,
      snapshots: artifact.snapshots
    }))) {
      fail("EVIDENCE_GAP", "retained manifest is missing or changed");
    }
  }
}
function verifyTarget(root, target, artifact) {
  if (artifact.content_ref.kind !== "sha256") {
    if (artifact.content_ref.kind === "bundle-sha256" && target.startsWith("project:") && artifact.content_ref.entries.some((entry) => !entry.path.startsWith("project:"))) {
      fail("INVALID_INPUT", "public bundle manifests cannot expose private member references");
    }
    const manifest = artifact.content_ref.kind === "git" ? { project_id: artifact.project_id, subject: artifact.content_ref } : artifact.content_ref;
    if (scanExactFile(root, target).digest !== hash(canonicalJson(manifest))) {
      fail("EVIDENCE_GAP", "canonical target must contain the exact immutable subject manifest");
    }
    return;
  }
  if (hashArtifact({ root, relativePath: target }).digest !== artifact.content_ref.digest) {
    fail("EVIDENCE_GAP", "canonical target does not contain the accepted exact bytes");
  }
}

// src/core/lib/coordination-runtime/acceptance-verdicts.mjs
var contentEquals = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
function matchesAcceptance(body, record, lookup3) {
  return subjectEquals(body.subject, { kind: record.kind, id: record.id }) && body.criteria_ref === criteriaRef(record, lookup3) && (record.kind === "task" ? contentEquals(body.content_ref, record.body.change_ref) : body.content_ref === null);
}
function effectiveRecords(records, idKey, scope, maySupersede) {
  const byId = new Map(records.map((record) => [record[idKey], record]));
  const replaced = /* @__PURE__ */ new Set();
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (record) => {
    const id = record[idKey];
    if (visiting.has(id)) fail("EVIDENCE_GAP", "verdict supersession contains a cycle");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const priorId of record.supersedes) {
      const prior = byId.get(priorId);
      if (!prior || scope(prior) !== scope(record)) {
        fail("EVIDENCE_GAP", `${id} supersedes a missing or differently scoped verdict`);
      }
      if (!maySupersede(record)) {
        fail("AUTHORITY_REQUIRED", "a producing run cannot supersede an independent verdict");
      }
      if (replaced.has(priorId)) fail("EVIDENCE_GAP", "verdict supersession has conflicting successors");
      visit(prior);
      replaced.add(priorId);
    }
    visiting.delete(id);
    visited.add(id);
  };
  records.forEach(visit);
  return records.filter((record) => !replaced.has(record[idKey]));
}
function effectiveReviews(reviews, record, lookup3) {
  return effectiveRecords(
    reviews.filter((review) => matchesAcceptance(review, record, lookup3)),
    "review_id",
    (review) => canonicalJson([review.reviewer.role, review.kind]),
    (review) => !isProducingRun(record.body, review.reviewer)
  );
}
function effectiveApprovals(approvals, record, lookup3) {
  const relevant = approvals.filter((approval) => approval.kind === "operator-recovery-resolution" ? subjectEquals(approval.subject, { kind: record.kind, id: record.id }) && approval.criteria_ref === criteriaRef(record, lookup3) && approval.recovery.attempt_id === record.body.recovery_hold : matchesAcceptance(approval, record, lookup3));
  return effectiveRecords(
    relevant,
    "approval_id",
    (approval) => canonicalJson([approval.authority.role, approval.kind, approval.recovery?.attempt_id ?? null]),
    (approval) => approval.kind !== "completion" || record.kind !== "task" || !isProducingRun(record.body, approval.authority)
  );
}
function evidenceScope(record) {
  return canonicalJson([
    record.kind,
    record.dimension,
    record.data.environment ?? null,
    record.data.deployment_id ?? null
  ]);
}
function effectiveEvidence(evidence, record, lookup3) {
  return effectiveRecords(
    evidence.filter((body) => matchesAcceptance(body, record, lookup3)),
    "evidence_id",
    evidenceScope,
    () => true
  );
}

// src/core/lib/coordination-runtime/context.mjs
var DEFAULT_CONTEXT_MAX_BYTES = 24 * 1024;
var DEFAULT_CONTEXT_RECENT_LIMIT = 8;
var MAX_RECENT_LIMIT = 8;
var MAX_MESSAGE_PAGE = 100;
var MAX_EXCERPT_BYTES = 512;
var TERMINAL = /* @__PURE__ */ new Set(["completed", "shipped", "dropped"]);
var bindsSubject = (record, subject) => subjectEquals(record?.subject, subject);
function invalid(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function gap(message) {
  throw new RuntimeError("EVIDENCE_GAP", message);
}
function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value === "") invalid(`${label} must be a string`);
}
function validateProjectionOptions(subject, maxBytes, recentLimit) {
  validateHierarchySubject(subject, "context subject");
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    invalid("context maxBytes must be a positive safe integer");
  }
  if (!Number.isSafeInteger(recentLimit) || recentLimit < 0 || recentLimit > MAX_RECENT_LIMIT) {
    invalid(`context recentLimit must be an integer from 0 through ${MAX_RECENT_LIMIT}`);
  }
}
function excerpt(value) {
  const source = typeof value === "string" ? value : canonicalJson(value);
  const sourceBytes = Buffer.byteLength(source, "utf8");
  if (sourceBytes <= MAX_EXCERPT_BYTES) {
    return { text: source, truncated: false };
  }
  const suffix = "\u2026";
  const suffixBytes = Buffer.byteLength(suffix, "utf8");
  let bytes = 0;
  let text = "";
  for (const character of source) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (bytes + characterBytes + suffixBytes > MAX_EXCERPT_BYTES) break;
    text += character;
    bytes += characterBytes;
  }
  return { text: `${text}${suffix}`, truncated: true };
}
function messageSummary(entry) {
  const message = entry.record.body;
  return {
    ref: `message:${entry.record.id}`,
    event_seq: entry.eventSeq,
    kind: message.kind,
    sender: { role: message.sender_role, runId: message.sender_run },
    recipient: message.recipient,
    parent_id: message.parent_id,
    basis_version: message.basis_version,
    created_at_declared: message.created_at,
    payload_excerpt: excerpt(message.payload),
    artifact_reference_count: message.artifact_refs.length,
    evidence_reference_count: message.evidence_refs.length
  };
}
function detailIdentity(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? { kind: match[1].toLowerCase(), id: match[2] } : null;
}
function unique(values) {
  return [...new Set(values)];
}
function currentDecisions(view, get) {
  const effective = effectiveApprovals(
    view.approvals.map(({ record }) => record.body),
    view.record,
    get
  );
  const byId = new Map(view.approvals.map((entry) => [entry.record.id, entry]));
  return effective.map((body) => {
    const entry = byId.get(body.approval_id);
    if (!entry || entry.eventSeq === null) {
      gap(`approval/${body.approval_id} has no persisted event chronology`);
    }
    return {
      entry,
      summary: {
        ref: `approval:${body.approval_id}`,
        event_seq: entry.eventSeq,
        kind: body.kind,
        authority: body.authority,
        decision: body.decision,
        criteria_ref: body.criteria_ref,
        reason: body.reason,
        recovery: body.recovery,
        created_at_declared: body.created_at,
        evidence_verification: "not_performed"
      }
    };
  }).sort((left, right) => left.entry.eventSeq - right.entry.eventSeq);
}
function unresolvedQuestions(view) {
  const subject = { kind: view.record.kind, id: view.record.id };
  const waiting = new Set(view.record.body.waiting_on_questions ?? []);
  const terminal = TERMINAL.has(view.record.body.state);
  return view.questions.map((entry) => {
    const question = entry.record;
    if (!question) gap("hierarchy subject references a missing question");
    if (!bindsSubject(question, subject) || !terminal && question.body.status !== "open" || !terminal && waiting.has(question.id) && question.body.blocking !== true) {
      gap(`question/${question.id} is not unresolved for ${subject.kind}/${subject.id}`);
    }
    if (entry.eventSeq === null) {
      gap(`question/${question.id} has no persisted opening-message chronology`);
    }
    if (!entry.openedMessage || !bindsSubject(entry.openedMessage, subject) || entry.openedMessage.body.message_id !== question.body.opened_message_id || entry.openedMessage.body.kind !== "question") {
      gap(`question/${question.id} references a missing opening message`);
    }
    for (const message of entry.answerMessages) {
      if (!bindsSubject(message, subject) || message.body.kind !== "answer") {
        gap(`question/${question.id} references a missing answer message`);
      }
    }
    return {
      entry,
      summary: {
        ref: `question:${question.id}`,
        event_seq: entry.eventSeq,
        kind: question.body.kind,
        blocking: question.body.blocking,
        disposition: TERMINAL.has(view.record.body.state) ? "historical-follow-up" : question.body.blocking ? "blocking" : "nonblocking",
        status: question.body.status,
        asker: question.body.asker,
        recipient: question.body.recipient,
        context: question.body.context,
        ask: question.body.ask,
        answer_by: question.body.answer_by,
        opened_message_ref: `message:${question.body.opened_message_id}`,
        answer_message_refs: question.body.answer_message_ids.map((id) => `message:${id}`)
      }
    };
  }).sort((left, right) => left.entry.eventSeq - right.entry.eventSeq || left.entry.record.id.localeCompare(right.entry.record.id));
}
function recoveryHold(view) {
  if (view.record.kind !== "task" || view.record.body.recovery_hold === null) return null;
  const entry = view.recoveryHold;
  const attempt = entry?.record;
  const subject = { kind: "task", id: view.record.id };
  if (!bindsSubject(attempt, subject) || attempt.id !== view.record.body.recovery_hold || attempt.body.disposition !== "conflicting-partial-work") {
    gap(`task/${view.record.id} references a missing or mismatched recovery attempt`);
  }
  if (!entry.message || entry.eventSeq === null || !bindsSubject(entry.message, subject) || entry.message.body.kind !== "recovery") {
    gap(`attempt/${attempt.id} references a missing recovery message or event`);
  }
  return {
    ref: `attempt:${attempt.id}`,
    message_ref: `message:${entry.message.id}`,
    event_seq: entry.eventSeq,
    observed: attempt.body.observed,
    disposition: attempt.body.disposition,
    stale_lease: attempt.body.stale_lease,
    grantor: attempt.body.grantor,
    created_at_declared: attempt.body.created_at,
    evidence_refs: attempt.body.recovery_evidence_ids.map((id) => `evidence:${id}`),
    required_resolution: {
      authority: "operator",
      kind: "operator-recovery-resolution",
      attempt_id: attempt.id,
      stale_lease_token: attempt.body.stale_lease.token,
      criteria_ref: view.criteriaRef,
      disposition: "safe-to-resume",
      scope: TERMINAL.has(view.record.body.state) ? "before-restoration" : "before-resumption",
      release: "persist exact operator approval, then separately authorized task.restore",
      evidence_verification: "not_performed"
    }
  };
}
function dependencies(view) {
  return view.dependencies.map(({ dependency, record }) => {
    const dependencyId = dependency.task;
    if (!record) {
      gap(`${view.record.kind}/${view.record.id} references missing dependency task/${dependencyId}`);
    }
    return {
      task_id: record.id,
      task_version: record.version,
      state: record.body.state,
      resume_state: record.body.resume_state ?? null,
      recovery_hold: record.body.recovery_hold ?? null,
      requires: dependency.requires
    };
  });
}
function ensureMessage(entry, label, subject, version) {
  if (!entry?.record) gap(`${label} references a missing message`);
  const threadId = subjectRef(subject, version);
  if (!bindsSubject(entry.record, subject) || entry.record.body.thread_id !== threadId) {
    gap(`${label} does not belong to ${threadId}`);
  }
  return entry;
}
function addReference(references, kind, id) {
  references.set(`${kind}:${id}`, { kind, id });
}
function selectedEvidenceReferences(view, questions, decisions, selectedMessages, latestHandoff) {
  const values = [
    ...view.record.body.context_artifacts ?? [],
    ...questions.flatMap(({ entry }) => [entry.openedMessage, ...entry.answerMessages].flatMap((message) => [
      ...message.body.artifact_refs,
      ...message.body.evidence_refs
    ])),
    ...(view.recoveryHold?.record?.body.recovery_evidence_ids ?? []).map((id) => `evidence:${id}`),
    ...decisions.flatMap(({ entry }) => entry.record.body.evidence_refs),
    ...latestHandoff ? [
      ...latestHandoff.record.body.artifact_refs,
      ...latestHandoff.record.body.evidence_refs
    ] : [],
    ...selectedMessages.flatMap(({ record }) => [
      ...record.body.artifact_refs,
      ...record.body.evidence_refs
    ])
  ];
  const details = new Map(view.referencedDetails.map((entry) => [entry.reference, entry.record]));
  for (const reference of unique(values)) {
    const identity = detailIdentity(reference);
    if (identity && !details.get(reference)) {
      gap(`${reference} is missing or is not readable in the context snapshot`);
    }
  }
  return unique(values);
}
function historyCursor(view, selectedMessages) {
  const remainingCount = view.messageCount - selectedMessages.length;
  if (remainingCount <= 0) return null;
  return {
    subject: { kind: view.record.kind, id: view.record.id },
    threadId: subjectRef(
      { kind: view.record.kind, id: view.record.id },
      view.record.version
    ),
    basisVersion: view.record.version,
    beforeSeq: selectedMessages.length > 0 ? selectedMessages[0].eventSeq : view.throughSeq + 1,
    remainingCount
  };
}
function packetFor(view, {
  questionEntries,
  recovery,
  decisionEntries,
  dependencyEntries: dependencyEntries2,
  latestHandoff,
  selectedMessages
}) {
  const references = /* @__PURE__ */ new Map();
  for (const question of questionEntries) {
    addReference(references, "question", question.entry.record.id);
    addReference(references, "message", question.entry.record.body.opened_message_id);
    for (const id of question.entry.record.body.answer_message_ids) {
      addReference(references, "message", id);
    }
  }
  if (recovery) {
    addReference(references, "attempt", view.recoveryHold.record.id);
    addReference(references, "message", view.recoveryHold.message.id);
  }
  for (const decision of decisionEntries) {
    addReference(references, "approval", decision.entry.record.id);
  }
  if (latestHandoff) addReference(references, "message", latestHandoff.record.id);
  for (const message of selectedMessages) {
    addReference(references, "message", message.record.id);
  }
  const artifactEvidenceReferences = selectedEvidenceReferences(
    view,
    questionEntries,
    decisionEntries,
    selectedMessages,
    latestHandoff
  );
  for (const reference of artifactEvidenceReferences) {
    const identity = detailIdentity(reference);
    if (identity) addReference(references, identity.kind, identity.id);
  }
  const cursor = historyCursor(view, selectedMessages);
  const referenceList = [...references.values()];
  const record = view.record;
  const subject = { kind: record.kind, id: record.id };
  const packet = {
    schema_version: 1,
    through_seq: view.throughSeq,
    subject: {
      kind: record.kind,
      id: record.id,
      version: record.version,
      title: record.body.title,
      state: record.body.state,
      resume_state: record.body.resume_state ?? null,
      recovery_hold: record.body.recovery_hold ?? null,
      completion_disposition: record.body.completion_disposition ?? null,
      outcome: record.body.outcome
    },
    authority: {
      owner: record.body.owner ?? null,
      scope_authority: record.body.scope_authority,
      completion_authority: record.body.completion_authority,
      acceptance_actor: record.body.acceptance_actor ?? null,
      next_role: record.body.next_role ?? null,
      lease: record.body.lease == null ? null : {
        holder: record.body.lease.holder,
        token: record.body.lease.token,
        version_at_grant: record.body.lease.version_at_grant,
        expires_at: record.body.lease.expires_at
      }
    },
    revision: {
      subject_ref: subjectRef(subject, record.version),
      subject_version: record.version,
      criteria_ref: view.criteriaRef,
      change_ref: record.body.change_ref ?? null,
      updated_at: record.body.updated_at
    },
    acceptance: record.body.acceptance,
    review_requirements: record.body.review_requirements ?? [],
    artifact_obligations: {
      artifact_expectation: record.body.artifact_expectation ?? null,
      artifact_expectation_reason: record.body.artifact_expectation_reason ?? null,
      artifact_class: record.body.artifact_class ?? null,
      durability: record.body.durability ?? null,
      validity_owner: record.body.validity_owner ?? null,
      artifact_targets: record.body.artifact_targets ?? []
    },
    dependencies: dependencyEntries2,
    unresolved_questions: questionEntries.map(({ summary }) => summary),
    recovery_hold: recovery,
    blockers: [
      ...questionEntries.filter(({ summary }) => summary.disposition === "blocking").map(({ summary }) => summary),
      ...recovery && !TERMINAL.has(record.body.state) ? [{ kind: "recovery-hold", ref: recovery.ref, required_authority: "operator" }] : []
    ],
    decisions: decisionEntries.map(({ summary }) => summary),
    latest_handoff: latestHandoff ? messageSummary(latestHandoff) : null,
    selected_artifact_evidence_references: artifactEvidenceReferences,
    recent_messages: selectedMessages.map(messageSummary),
    references: referenceList,
    history_cursor: cursor
  };
  return {
    text: canonicalJson(packet),
    references: referenceList,
    historyCursor: cursor
  };
}
function projectContext(store, {
  subject,
  maxBytes = DEFAULT_CONTEXT_MAX_BYTES,
  recentLimit = DEFAULT_CONTEXT_RECENT_LIMIT
}) {
  validateProjectionOptions(subject, maxBytes, recentLimit);
  const view = readSubjectView(store, {
    subject,
    recentLimit
  });
  if (!view.record) gap(`${subject.kind}/${subject.id} does not exist`);
  const get = (kind, id) => readRecord(store, kind, id);
  view.criteriaRef = criteriaRef(view.record, get);
  const questionEntries = unresolvedQuestions(view);
  const recovery = recoveryHold(view);
  const decisionEntries = currentDecisions(view, get);
  const dependencyEntries2 = dependencies(view);
  const latestHandoff = view.latestHandoff === null ? null : ensureMessage(view.latestHandoff, "latest handoff", subject, view.record.version);
  const recent = view.recentMessages.map((entry, index) => ensureMessage(entry, `recent message ${index + 1}`, subject, view.record.version));
  const fixed = {
    questionEntries,
    recovery,
    decisionEntries,
    dependencyEntries: dependencyEntries2,
    latestHandoff
  };
  let selectedMessages = [];
  let projection = packetFor(view, { ...fixed, selectedMessages });
  let bytes = Buffer.byteLength(projection.text, "utf8");
  if (bytes > maxBytes) {
    throw new RuntimeError(
      "CONTEXT_BUDGET",
      `Required context uses ${bytes} bytes; limit is ${maxBytes}`
    );
  }
  for (let count = 1; count <= recent.length; count += 1) {
    const candidateMessages = recent.slice(-count);
    const candidate = packetFor(view, { ...fixed, selectedMessages: candidateMessages });
    const candidateBytes = Buffer.byteLength(candidate.text, "utf8");
    if (candidateBytes > maxBytes) break;
    selectedMessages = candidateMessages;
    projection = candidate;
    bytes = candidateBytes;
  }
  return {
    throughSeq: view.throughSeq,
    text: projection.text,
    bytes,
    references: projection.references,
    historyCursor: projection.historyCursor
  };
}
function readDetail(store, { kind, id }) {
  assertNonEmptyString(kind, "detail kind");
  assertNonEmptyString(id, "detail id");
  const record = readRecord(store, kind, id);
  if (!record) gap(`${kind}/${id} does not exist`);
  return record;
}
function readMessages(store, {
  subject,
  threadId,
  basisVersion,
  beforeSeq = null,
  limit = 50
}) {
  validateHierarchySubject(subject, "message subject");
  assertNonEmptyString(threadId, "message threadId");
  if (!Number.isSafeInteger(basisVersion) || basisVersion < 1) {
    invalid("message basisVersion must be a positive safe integer");
  }
  if (threadId !== subjectRef(subject, basisVersion)) {
    invalid("message threadId must bind the requested typed subject and basisVersion");
  }
  if (beforeSeq !== null && (!Number.isSafeInteger(beforeSeq) || beforeSeq < 1)) {
    invalid("message beforeSeq must be a positive safe integer or null");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_MESSAGE_PAGE) {
    invalid(`message limit must be an integer from 1 through ${MAX_MESSAGE_PAGE}`);
  }
  return readMessagePage(store, {
    subject,
    threadId,
    basisVersion,
    beforeSeq,
    limit
  });
}

// src/core/lib/coordination-runtime/input-basis.mjs
import { createHash as createHash2 } from "node:crypto";
var digest = (value) => createHash2("sha256").update(canonicalJson(value)).digest("hex");
var privacyRank = { public: 0, internal: 1, confidential: 2, personal: 3 };
function captureInputBasis(context, tx, references, seen = /* @__PURE__ */ new Set(), observe) {
  return [...new Set(references)].sort().map((reference) => {
    if (seen.has(reference)) fail("EVIDENCE_GAP", "applicable inputs contain a cycle");
    const next = /* @__PURE__ */ new Set([...seen, reference]);
    const match = /^(artifact|asset|evidence):([0-9a-f-]+)$/i.exec(reference);
    if (!match) {
      const subject = hashArtifact({ root: context.root, relativePath: reference });
      observe?.({ subject, classification: pathPrivacy(context.root, subject.path) });
      return { reference, digest: digest(subject) };
    }
    const [, kind, id] = match;
    const record = tx.get(kind, id);
    if (!record) fail("EVIDENCE_GAP", `applicable input ${reference} is missing`);
    if (kind === "artifact") {
      verifyArtifact(context.root, record.body);
      observe?.(record.body);
      if (record.body.input_basis === void 0) {
        fail("EVIDENCE_GAP", `applicable input ${reference} has unknown captured lineage; register a fresh explicit input basis`);
      }
      verifyInputBasis(context, tx, record.body.input_basis, next, observe);
    } else if (kind === "asset") {
      captureInputBasis(context, tx, [
        `artifact:${record.body.artifact_id}`,
        ...record.body.input_asset_ids.map((id2) => `asset:${id2}`)
      ], next, observe);
    } else {
      captureInputBasis(context, tx, record.body.evidence_refs, next, observe);
    }
    const owner = record.subject ? tx.get(record.subject.kind, record.subject.id) : null;
    if (!owner) fail("EVIDENCE_GAP", `applicable input ${reference} has no owning hierarchy subject`);
    return {
      reference,
      digest: digest({
        record,
        ownerCriteria: criteriaRef(owner, (kind2, id2) => tx.get(kind2, id2))
      })
    };
  });
}
function verifyInputBasis(context, tx, basis, seen = /* @__PURE__ */ new Set(), observe) {
  if (canonicalJson(captureInputBasis(context, tx, basis.map((b) => b.reference), seen, observe)) !== canonicalJson(basis)) {
    fail("EVIDENCE_GAP", "applicable design/brief/input revision changed; register a fresh output basis and independent acceptance");
  }
}
function inputBasisCurrent(context, tx, basis) {
  try {
    verifyInputBasis(context, tx, basis);
    return true;
  } catch (error) {
    if (error.code !== "EVIDENCE_GAP") throw error;
    return false;
  }
}
function artifactInputReferences(item, inputAssetIds) {
  return [...item.context_artifacts ?? [], ...inputAssetIds.map((id) => `asset:${id}`)];
}

// src/core/lib/coordination-runtime/authority.mjs
function fail2(code, message) {
  throw new RuntimeError(code, message);
}
function sameActor(left, right) {
  return left?.role === right?.role && left?.runId === right?.runId;
}
function requireRoleAvailable(role, authority, label) {
  if (role !== "operator" && !authority.roles.includes(role)) {
    fail2("ROLE_UNAVAILABLE", `${label} role "${role}" is not available`);
  }
}
function requireActorAvailable(command, authority) {
  requireRoleAvailable(command.actor.role, authority, "actor");
}
function requirePolicy(command, policy) {
  const declaration = commandKind(command.kind);
  if (!declaration?.authority.includes(policy)) {
    fail2(
      "INVALID_INPUT",
      `${command.kind} does not declare the ${policy} authority mechanism`
    );
  }
}
function hostGrantMatches(grant, command, action) {
  return sameActor(grant.actor, command.actor) && grant.actions.includes(action) && grant.recordKind === command.recordKind && grant.recordId === command.recordId && grant.basisRef === `${command.recordKind}/${command.recordId}@${command.expectedVersion}`;
}
function hostGrantMatchesBasis(grant, command, action, basisRef) {
  return sameActor(grant.actor, command.actor) && grant.actions.includes(action) && grant.recordKind === command.recordKind && grant.recordId === command.recordId && grant.basisRef === basisRef;
}
function persistedGrantMatches(record, command, action) {
  const grant = record.body;
  return grant.status === "active" && sameActor(grant.actor, command.actor) && grant.actions.includes(action) && grant.record_kind === command.recordKind && grant.record_id === command.recordId && grant.lease_token === command.leaseToken && Date.parse(grant.expires_at) > Date.now();
}
function hasHostActionGrant(command, authority, action) {
  return authority.grants.some((grant) => hostGrantMatches(grant, command, action));
}
function hasHostActionGrantForBasis(command, authority, action, basisRef) {
  return authority.grants.some(
    (grant) => hostGrantMatchesBasis(grant, command, action, basisRef)
  );
}
function requireActionGrant(tx, command, authority, action) {
  requirePolicy(command, "grant");
  requireActionGrantUnchecked(tx, command, authority, action);
}
function requireActionGrantUnchecked(tx, command, authority, action) {
  const allowed = hasHostActionGrant(command, authority, action) || command.leaseToken !== null && tx.list("grant", { kind: "task", id: command.recordId }).some((record) => persistedGrantMatches(record, command, action));
  if (!allowed) {
    fail2(
      "AUTHORITY_REQUIRED",
      `${command.actor.role} lacks explicit ${action} authority for ${command.recordKind}/${command.recordId}`
    );
  }
}
function requireHostActionGrant(command, authority, action) {
  requirePolicy(command, "host");
  requireHostActionGrantUnchecked(command, authority, action);
}
function requireHostActionGrantUnchecked(command, authority, action) {
  if (!hasHostActionGrant(command, authority, action)) {
    fail2(
      "AUTHORITY_REQUIRED",
      `${command.actor.role} lacks trusted host ${action} authority for ${command.recordKind}/${command.recordId}`
    );
  }
}
function requireNamedAuthority(tx, command, authority, action, role) {
  requirePolicy(command, "named");
  if (command.actor.role !== role) {
    fail2(
      "AUTHORITY_REQUIRED",
      `${action} requires declared authority "${role}", not "${command.actor.role}"`
    );
  }
  requireHostActionGrantUnchecked(command, authority, action);
}
function requireAnyNamedAuthority(tx, command, authority, action, roles) {
  requirePolicy(command, "named");
  const allowed = [...new Set(roles)];
  if (!allowed.includes(command.actor.role)) {
    fail2(
      "AUTHORITY_REQUIRED",
      `${action} requires one of the declared authorities ${allowed.map((role) => `"${role}"`).join(", ")}, not "${command.actor.role}"`
    );
  }
  requireHostActionGrantUnchecked(command, authority, action);
}
function leaseIsLive(lease) {
  return lease !== null && Date.parse(lease.expires_at) > Date.now();
}
function requireLease(task, command) {
  if (task.body.lease !== null && !leaseIsLive(task.body.lease)) {
    fail2("RECOVERY_REQUIRED", `task/${task.id} lease expired and must be reconciled`);
  }
  if (task.body.lease === null || !sameActor(task.body.lease.holder, command.actor) || task.body.lease.token !== command.leaseToken) {
    fail2("LEASE_CONFLICT", `command does not hold the current lease for task/${task.id}`);
  }
}
function requireLeasedActingAuthority(tx, task, command, authority, action) {
  requirePolicy(command, "leased");
  requireLease(task, command);
  requireActionGrantUnchecked(tx, command, authority, action);
}
function requireActingAuthority(tx, task, command, authority, action) {
  requirePolicy(command, "acting");
  if (task.body.lease === null) {
    requireHostActionGrantUnchecked(command, authority, action);
    return;
  }
  requireLease(task, command);
  requireActionGrantUnchecked(tx, command, authority, action);
}

// src/core/lib/coordination-runtime/hierarchy-engine.mjs
import { basename, posix as path } from "node:path";
var PARENT_CONFIG = Object.freeze({
  epic: {
    childKind: "feature",
    requiredField: "required_features",
    optionalField: "optional_features",
    successDisposition: "achieved",
    childSuccessDisposition: "delivered"
  },
  feature: {
    childKind: "requirement",
    requiredField: "required_requirements",
    optionalField: "optional_requirements",
    successDisposition: "delivered",
    childSuccessDisposition: "satisfied"
  },
  requirement: {
    childKind: "task",
    requiredField: "required_tasks",
    optionalField: "optional_tasks",
    successDisposition: "satisfied",
    childSuccessDisposition: null
  }
});
var SCOPE_FIELDS = Object.freeze({
  epic: /* @__PURE__ */ new Set([
    "owner",
    "scope_authority",
    "completion_authority",
    "outcome",
    "acceptance",
    "direction_ref",
    "contribution",
    "scope_fit",
    "required_features",
    "optional_features"
  ]),
  feature: /* @__PURE__ */ new Set([
    "owner",
    "scope_authority",
    "completion_authority",
    "outcome",
    "acceptance",
    "required_requirements",
    "optional_requirements",
    "depends_on_features"
  ]),
  requirement: /* @__PURE__ */ new Set([
    "owner",
    "scope_authority",
    "completion_authority",
    "outcome",
    "acceptance",
    "required_tasks",
    "optional_tasks"
  ])
});
function fail3(code, message) {
  throw new RuntimeError(code, message);
}
function uniqueRecords(records) {
  const unique2 = /* @__PURE__ */ new Map();
  for (const record of records.filter(Boolean)) {
    unique2.set(`${record.kind}\0${record.id}`, record);
  }
  return [...unique2.values()];
}
function relationshipVersion(record, taskDisposition = null) {
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    state: record.body.state,
    disposition: record.kind === "task" ? taskDisposition ?? record.body.state : record.body.completion_disposition
  };
}
function relationshipVersions(records) {
  return uniqueRecords(records).map((record) => relationshipVersion(record)).sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
}
function directionBasis(direction) {
  return `direction:${direction.path}@${direction.hash}`;
}
function eventTime(command, nextBody) {
  return command.kind.endsWith(".create") ? nextBody.created_at : command.payload.at;
}
function eventReason(command) {
  if (typeof command.payload.reason === "string") return command.payload.reason;
  const action = command.kind.split(".")[1];
  if (action === "create") return "Created the governed parent proposal.";
  if (action === "update") return "Updated the governed parent record.";
  return `Accepted the governed parent ${action} decision.`;
}
function appendMutationEvent(tx, current, nextBody, command, related, { basisRefs = [], extra = {} } = {}) {
  const oldVersion = current?.version ?? 0;
  tx.appendEvent({
    kind: command.kind,
    actor: command.actor,
    at: eventTime(command, nextBody),
    reason: eventReason(command),
    recordKind: command.recordKind,
    recordId: command.recordId,
    oldVersion,
    newVersion: oldVersion + 1,
    changedFields: current === null ? Object.keys(nextBody).sort() : changedKeys(current.body, nextBody).sort(),
    basisRefs: [...new Set(basisRefs)],
    relationshipVersions: relationshipVersions(related),
    ...extra
  });
}
function workspaceRoot(store) {
  return workspaceRootFromCoordinationDatabase(store.path);
}
function configuredDirectionPath(project) {
  if (typeof project?.publication_root !== "string") return null;
  const publicationRoot = project.publication_root.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  return path.join(publicationRoot, basename(directionPath()));
}
function projectIdForDirectionRef(manifest, directionRef) {
  if (!directionRef || typeof directionRef.path !== "string") {
    fail3("EVIDENCE_GAP", "Epic Direction reference must name a configured project path");
  }
  const matches = Array.isArray(manifest.projects) ? manifest.projects.filter(
    (project) => configuredDirectionPath(project) === directionRef.path
  ) : [];
  if (matches.length !== 1) {
    fail3(
      "EVIDENCE_GAP",
      `Epic Direction path "${directionRef.path}" must match exactly one configured project`
    );
  }
  if (typeof matches[0].id !== "string" || !matches[0].id.trim()) {
    fail3("EVIDENCE_GAP", "the configured project matching the Epic Direction path needs an id");
  }
  return matches[0].id;
}
function currentDirectionForStore(store, directionRef) {
  const root = workspaceRoot(store);
  const result = readWorkspaceManifest(root);
  if (!result.ok) {
    fail3("EVIDENCE_GAP", `current Direction cannot be resolved: ${result.reason}`);
  }
  try {
    const projectId = projectIdForDirectionRef(result.manifest, directionRef);
    return readDirection({
      workspaceRoot: root,
      manifest: result.manifest,
      projectId
    });
  } catch (error) {
    fail3("EVIDENCE_GAP", `current Direction cannot be resolved: ${error.message}`);
  }
}
function exactDirectionRef(direction) {
  return {
    path: direction.path,
    hash: direction.hash,
    goal: direction.goal
  };
}
function assertDirectionAligned(epic, direction) {
  if (canonicalJson(epic.body.direction_ref) !== canonicalJson(exactDirectionRef(direction))) {
    fail3(
      "EVIDENCE_GAP",
      `epic/${epic.id} is not aligned to the current runtime-computed Direction`
    );
  }
}
function hasStaleDirection(tx, record, resolveDirection) {
  try {
    const epic = epicAncestor(tx, record);
    const direction = resolveDirection(epic.body.direction_ref);
    return canonicalJson(epic.body.direction_ref) !== canonicalJson(exactDirectionRef(direction));
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "EVIDENCE_GAP") return false;
    throw error;
  }
}
function requireActive(record, label) {
  if (record.body.state !== "active") {
    fail3("EVIDENCE_GAP", `${label} must be active`);
  }
}
function requireNoHold(record, label) {
  if (record.body.hold !== null) {
    fail3("EVIDENCE_GAP", `${label} is under an effective hold`);
  }
}
function featureDependencyRecords(tx, feature, { requireDelivered = false } = {}) {
  const dependencies2 = [];
  for (const dependency of feature.body.depends_on_features) {
    const upstream = tx.get("feature", dependency.feature);
    if (!upstream) {
      fail3(
        "INVALID_INPUT",
        `feature/${feature.id} references a missing dependency ${dependency.feature}`
      );
    }
    if (requireDelivered && (upstream.body.state !== "completed" || upstream.body.completion_disposition !== "delivered")) {
      fail3(
        "EVIDENCE_GAP",
        `feature/${dependency.feature} must be completed with delivered`
      );
    }
    dependencies2.push(upstream);
  }
  return dependencies2;
}
function assertNoFeatureDependencyCycle(tx, candidate) {
  const features = new Map(tx.list("feature").map((record) => [record.id, record]));
  features.set(candidate.id, candidate);
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  function visit(id) {
    if (visiting.has(id)) {
      fail3("INVALID_INPUT", `feature dependency cycle detected at feature/${id}`);
    }
    if (visited.has(id)) return;
    const feature = features.get(id);
    if (!feature) return;
    visiting.add(id);
    for (const dependency of feature.body.depends_on_features) {
      if (!features.has(dependency.feature)) {
        fail3(
          "INVALID_INPUT",
          `feature/${feature.id} references a missing dependency ${dependency.feature}`
        );
      }
      visit(dependency.feature);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of features.keys()) visit(id);
}
function containsChild(parent, config, childId) {
  return parent.body[config.requiredField].includes(childId) || parent.body[config.optionalField].includes(childId);
}
function candidateLookup(tx, candidate) {
  return (kind, id) => kind === candidate.kind && id === candidate.id ? candidate : tx.get(kind, id);
}
function assertUniqueParentClaims(tx, parentKind, candidate) {
  const config = PARENT_CONFIG[parentKind];
  if (!config || parentKind === "requirement") return;
  const claims = /* @__PURE__ */ new Map();
  const parents = tx.list(parentKind).filter((record) => record.id !== candidate.id).concat(candidate);
  for (const parent of parents) {
    for (const childId of [
      ...parent.body[config.requiredField],
      ...parent.body[config.optionalField]
    ]) {
      const claimedBy = claims.get(childId);
      if (claimedBy && claimedBy !== parent.id) {
        fail3(
          "INVALID_INPUT",
          `${config.childKind}/${childId} must belong to exactly one ${parentKind}`
        );
      }
      claims.set(childId, parent.id);
    }
  }
}
function assertExistingChildrenAgree(tx, parent) {
  const config = PARENT_CONFIG[parent.kind];
  const listed = /* @__PURE__ */ new Set([
    ...parent.body[config.requiredField],
    ...parent.body[config.optionalField]
  ]);
  const related = [];
  if (parent.kind === "epic") {
    for (const child of tx.list("feature")) {
      if (child.body.epic_id === parent.id && !listed.has(child.id)) {
        fail3(
          "INVALID_INPUT",
          `feature/${child.id} must remain listed by epic/${parent.id}`
        );
      }
    }
    for (const id of listed) {
      const child = tx.get("feature", id);
      if (!child) continue;
      if (child.body.epic_id !== parent.id) {
        fail3(
          "INVALID_INPUT",
          `epic/${parent.id} references mismatched feature/${id}`
        );
      }
      related.push(child);
    }
  } else if (parent.kind === "feature") {
    for (const child of tx.list("requirement")) {
      if (child.body.feature_id === parent.id && !listed.has(child.id)) {
        fail3(
          "INVALID_INPUT",
          `requirement/${child.id} must remain listed by feature/${parent.id}`
        );
      }
    }
    for (const id of listed) {
      const child = tx.get("requirement", id);
      if (!child) continue;
      if (child.body.feature_id !== parent.id || child.body.pack !== parent.body.pack) {
        fail3(
          "INVALID_INPUT",
          `feature/${parent.id} references mismatched requirement/${id}`
        );
      }
      related.push(child);
    }
  } else {
    for (const child of tx.list("task")) {
      if (child.body.satisfies.includes(parent.id) && !listed.has(child.id)) {
        fail3(
          "INVALID_INPUT",
          `task/${child.id} must remain listed by requirement/${parent.id}`
        );
      }
    }
    for (const id of listed) {
      const child = tx.get("task", id);
      if (!child) continue;
      if (child.body.feature_id !== parent.body.feature_id || !child.body.satisfies.includes(parent.id)) {
        fail3(
          "INVALID_INPUT",
          `requirement/${parent.id} references mismatched task/${id}`
        );
      }
      related.push(child);
    }
  }
  return related;
}
function assertParentRelationships(tx, candidate) {
  validateHierarchyRecord(candidate, candidateLookup(tx, candidate));
  assertUniqueParentClaims(tx, candidate.kind, candidate);
  const related = assertExistingChildrenAgree(tx, candidate);
  if (candidate.kind === "feature") {
    assertNoFeatureDependencyCycle(tx, candidate);
    related.push(...featureDependencyRecords(tx, candidate));
    const epic = tx.get("epic", candidate.body.epic_id);
    if (!epic || !containsChild(epic, PARENT_CONFIG.epic, candidate.id)) {
      fail3(
        "INVALID_INPUT",
        `feature/${candidate.id} must appear in epic/${candidate.body.epic_id}`
      );
    }
    related.push(epic);
  } else if (candidate.kind === "requirement") {
    const feature = tx.get("feature", candidate.body.feature_id);
    if (!feature || !containsChild(feature, PARENT_CONFIG.feature, candidate.id)) {
      fail3(
        "INVALID_INPUT",
        `requirement/${candidate.id} must appear in feature/${candidate.body.feature_id}`
      );
    }
    related.push(feature);
  }
  return uniqueRecords(related);
}
function requireKnownParentRoles(body, authority) {
  for (const [label, role] of [
    ["owner", body.owner],
    ["scope authority", body.scope_authority],
    ["completion authority", body.completion_authority]
  ]) {
    requireRoleAvailable(role, authority, label);
  }
}
function requireAllowedAuthority(command, authority, roles, message) {
  if (!roles.includes(command.actor.role)) {
    fail3("AUTHORITY_REQUIRED", message);
  }
  requireHostActionGrant(command, authority, command.kind);
}
function parentContext(tx, record) {
  if (record.kind === "epic") return [];
  if (record.kind === "feature") {
    return [tx.get("epic", record.body.epic_id)].filter(Boolean);
  }
  return [tx.get("feature", record.body.feature_id)].filter(Boolean);
}
function epicAncestor(tx, record) {
  if (record.kind === "epic") return record;
  const feature = record.kind === "feature" ? record : tx.get("feature", record.body.feature_id);
  if (!feature) {
    fail3("EVIDENCE_GAP", `${record.kind}/${record.id} has no current Feature ancestor`);
  }
  const epic = tx.get("epic", feature.body.epic_id);
  if (!epic) {
    fail3("EVIDENCE_GAP", `feature/${feature.id} has no current Epic ancestor`);
  }
  return epic;
}
function directionForRecord(tx, record, runtime) {
  const epic = epicAncestor(tx, record);
  return runtime.direction(epic.body.direction_ref);
}
function assertAlignedAncestors(tx, record, direction) {
  validateHierarchyRecord(record);
  if (record.kind === "epic") {
    assertDirectionAligned(record, direction);
    return [];
  }
  const feature = record.kind === "feature" ? record : tx.get("feature", record.body.feature_id);
  if (!feature) {
    fail3(
      "EVIDENCE_GAP",
      `${record.kind}/${record.id} has no current Feature ancestor`
    );
  }
  requireActive(feature, `feature/${feature.id}`);
  requireNoHold(feature, `feature/${feature.id}`);
  const epic = tx.get("epic", feature.body.epic_id);
  if (!epic) {
    fail3("EVIDENCE_GAP", `feature/${feature.id} has no current Epic ancestor`);
  }
  requireActive(epic, `epic/${epic.id}`);
  requireNoHold(epic, `epic/${epic.id}`);
  assertDirectionAligned(epic, direction);
  const related = [feature, epic, ...featureDependencyRecords(tx, feature, {
    requireDelivered: true
  })];
  if (record.kind === "requirement") {
    if (record.body.feature_id !== feature.id || !containsChild(feature, PARENT_CONFIG.feature, record.id)) {
      fail3(
        "INVALID_INPUT",
        `requirement/${record.id} does not match feature/${feature.id}`
      );
    }
    return uniqueRecords(related.filter((entry) => entry.id !== record.id));
  }
  if (record.kind === "task") {
    if (record.body.feature_id !== feature.id) {
      fail3("INVALID_INPUT", `task/${record.id} does not match feature/${feature.id}`);
    }
    for (const requirementId of record.body.satisfies) {
      const requirement = tx.get("requirement", requirementId);
      if (!requirement || requirement.body.feature_id !== feature.id || !containsChild(requirement, PARENT_CONFIG.requirement, record.id)) {
        fail3(
          "INVALID_INPUT",
          `task/${record.id} has an invalid Requirement relationship`
        );
      }
      requireActive(requirement, `requirement/${requirement.id}`);
      requireNoHold(requirement, `requirement/${requirement.id}`);
      related.push(requirement);
    }
    return uniqueRecords(related.filter((entry) => entry.id !== record.id));
  }
  return uniqueRecords(related.filter((entry) => entry.id !== record.id));
}
function taskTerminalState(task) {
  return task.body.delivery_class === "knowledge" ? "completed" : "shipped";
}
function closureChildIdentity(record) {
  if (record.kind !== "task") return record;
  return {
    ...record,
    body: {
      ...record.body,
      completion_disposition: record.body.state
    }
  };
}
function closureEligibility(tx, parent) {
  validateHierarchyRecord(parent);
  const config = PARENT_CONFIG[parent.kind];
  if (!config) fail3("INVALID_INPUT", `${parent.kind}/${parent.id} is not a parent record`);
  const requiredChildren = [];
  const related = [];
  const blockers = [];
  for (const id of parent.body[config.requiredField]) {
    const child = tx.get(config.childKind, id);
    if (!child) {
      blockers.push({
        kind: config.childKind,
        id,
        reason: `required ${config.childKind}/${id} is missing`
      });
      continue;
    }
    validateHierarchyRecord(child);
    requiredChildren.push(child);
    related.push(child);
    if (child.kind === "task") {
      const requiredState = taskTerminalState(child);
      if (child.body.state !== requiredState) {
        blockers.push({
          kind: child.kind,
          id: child.id,
          reason: `required task/${child.id} must reach terminal state ${requiredState}`
        });
      }
    } else if (child.body.state !== "completed" || child.body.completion_disposition !== config.childSuccessDisposition) {
      blockers.push({
        kind: child.kind,
        id: child.id,
        reason: `required ${child.kind}/${child.id} must complete with ${config.childSuccessDisposition}`
      });
    }
  }
  if (parent.kind === "feature") {
    for (const dependency of parent.body.depends_on_features) {
      const upstream = tx.get("feature", dependency.feature);
      if (!upstream) {
        blockers.push({
          kind: "feature",
          id: dependency.feature,
          reason: `dependency feature/${dependency.feature} is missing`
        });
        continue;
      }
      validateHierarchyRecord(upstream);
      related.push(upstream);
      if (upstream.body.state !== "completed" || upstream.body.completion_disposition !== "delivered") {
        blockers.push({
          kind: "feature",
          id: upstream.id,
          reason: `dependency feature/${upstream.id} must complete with delivered`
        });
      }
    }
  }
  const eligible = blockers.length === 0;
  const targetParent = {
    ...parent,
    version: parent.body.state === "completed" ? parent.version : parent.version + 1,
    body: {
      ...parent.body,
      state: "completed",
      completion_disposition: config.successDisposition
    }
  };
  return {
    eligible,
    blockers,
    requiredChildren,
    relationshipVersions: uniqueRecords(related).map((record) => relationshipVersion(record)).sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id)),
    closureRef: eligible ? parentClosureRef(
      targetParent,
      requiredChildren.map(closureChildIdentity)
    ) : null
  };
}
function createCandidate(command) {
  return {
    kind: command.recordKind,
    id: command.recordId,
    subject: null,
    version: 1,
    body: command.payload.body
  };
}
function updateCandidate(current, body) {
  return { ...current, version: current.version + 1, body };
}
function requireProposalBody(body) {
  if (body.state !== "proposed" || body.completion_disposition !== null) {
    fail3("INVALID_INPUT", "new parent records must begin proposed without a completion disposition");
  }
  if (body.hold !== null) {
    fail3("INVALID_INPUT", "new parent proposals must record holds through the hold command");
  }
}
function handleEpicCreate(current, tx, command, authority, runtime) {
  if (current !== null) fail3("VERSION_CONFLICT", `epic/${command.recordId} exists`);
  const body = command.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  requireAllowedAuthority(
    command,
    authority,
    ["operator", body.scope_authority],
    "epic.create requires the operator or delegated Epic scope authority"
  );
  const direction = runtime.direction(body.direction_ref);
  const candidate = createCandidate(command);
  assertDirectionAligned(candidate, direction);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command, related, {
    basisRefs: [directionBasis(direction)]
  });
  return body;
}
function handleFeatureCreate(current, tx, command, authority) {
  if (current !== null) fail3("VERSION_CONFLICT", `feature/${command.recordId} exists`);
  const body = command.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  requireAllowedAuthority(
    command,
    authority,
    [body.owner, body.scope_authority],
    "feature.create requires the pack owner or delegated pack authority"
  );
  const epic = tx.get("epic", body.epic_id);
  if (!epic) fail3("EVIDENCE_GAP", `epic/${body.epic_id} does not exist`);
  requireActive(epic, `epic/${epic.id}`);
  const candidate = createCandidate(command);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command, related);
  return body;
}
function handleRequirementCreate(current, tx, command, authority) {
  if (current !== null) fail3("VERSION_CONFLICT", `requirement/${command.recordId} exists`);
  const body = command.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  const feature = tx.get("feature", body.feature_id);
  if (!feature) fail3("EVIDENCE_GAP", `feature/${body.feature_id} does not exist`);
  requireActive(feature, `feature/${feature.id}`);
  requireAllowedAuthority(
    command,
    authority,
    [feature.body.owner, feature.body.scope_authority],
    "requirement.create requires the Feature owner or delegated pack authority"
  );
  const candidate = createCandidate(command);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command, related);
  return body;
}
function requireParentUpdateAuthority(tx, current, command, authority, changes, runtime) {
  const changed = new Set(Object.keys(changes));
  const hasPriority = changed.delete("priority");
  const hasScope = [...changed].some((key) => SCOPE_FIELDS[current.kind].has(key));
  const hasDescription = [...changed].some((key) => key === "title");
  if (current.kind === "epic") {
    if (hasPriority) {
      if (command.actor.role === "operator") {
        requireHostActionGrant(command, authority, command.kind);
      } else {
        const direction = runtime.direction(current.body.direction_ref);
        if (!hasHostActionGrantForBasis(
          command,
          authority,
          command.kind,
          directionBasis(direction)
        )) {
          fail3(
            "AUTHORITY_REQUIRED",
            "Epic priority requires the operator or an explicit Current Goal steward grant"
          );
        }
      }
    }
    if (hasScope) {
      requireNamedAuthority(
        tx,
        command,
        authority,
        command.kind,
        current.body.scope_authority
      );
    }
  } else if (current.kind === "feature") {
    const epic = tx.get("epic", current.body.epic_id);
    if (!epic) fail3("EVIDENCE_GAP", `epic/${current.body.epic_id} does not exist`);
    if (hasPriority || hasScope) {
      requireAllowedAuthority(
        command,
        authority,
        [epic.body.owner],
        "Feature scope and priority require the Epic steward"
      );
    }
  } else {
    const feature = tx.get("feature", current.body.feature_id);
    if (!feature) fail3("EVIDENCE_GAP", `feature/${current.body.feature_id} does not exist`);
    if (hasPriority || hasScope) {
      requireAllowedAuthority(
        command,
        authority,
        [feature.body.owner],
        "Requirement scope and priority require the Feature owner"
      );
    }
  }
  if (hasDescription) {
    requireNamedAuthority(tx, command, authority, command.kind, current.body.owner);
  }
}
function handleParentUpdate(current, tx, command, authority, runtime) {
  if (current.body.state === "completed") {
    fail3("INVALID_INPUT", `${current.kind}/${current.id} is completed and immutable`);
  }
  const changes = command.payload.changes;
  requireParentUpdateAuthority(tx, current, command, authority, changes, runtime);
  const next = {
    ...current.body,
    ...changes,
    updated_at: command.payload.at
  };
  requireKnownParentRoles(next, authority);
  const candidate = updateCandidate(current, next);
  let basisRefs = [];
  if (current.kind === "epic" && Object.hasOwn(changes, "direction_ref")) {
    const direction = runtime.direction(candidate.body.direction_ref);
    assertDirectionAligned(candidate, direction);
    basisRefs = [directionBasis(direction)];
  }
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, current, next, command, related, { basisRefs });
  return next;
}
function activationAuthority(tx, current, command, authority) {
  if (current.kind === "epic") {
    requireAllowedAuthority(
      command,
      authority,
      [current.body.scope_authority],
      "Epic activation requires its scope authority"
    );
    return;
  }
  if (current.kind === "feature") {
    const epic = tx.get("epic", current.body.epic_id);
    if (!epic) fail3("EVIDENCE_GAP", `epic/${current.body.epic_id} does not exist`);
    requireAllowedAuthority(
      command,
      authority,
      [epic.body.owner],
      "Feature activation requires the Epic steward"
    );
    return;
  }
  const feature = tx.get("feature", current.body.feature_id);
  if (!feature) fail3("EVIDENCE_GAP", `feature/${current.body.feature_id} does not exist`);
  requireAllowedAuthority(
    command,
    authority,
    [feature.body.owner],
    "Requirement activation requires the Feature owner"
  );
}
function handleParentActivate(current, tx, command, authority, runtime) {
  if (current.body.state !== "proposed") {
    fail3("INVALID_INPUT", `${current.kind}.activate requires a proposed parent`);
  }
  requireNoHold(current, `${current.kind}/${current.id}`);
  requireKnownParentRoles(current.body, authority);
  activationAuthority(tx, current, command, authority);
  const next = {
    ...current.body,
    state: "active",
    updated_at: command.payload.at
  };
  const candidate = updateCandidate(current, next);
  const direction = directionForRecord(tx, candidate, runtime);
  const related = [
    ...assertParentRelationships(tx, candidate),
    ...assertAlignedAncestors(tx, candidate, direction)
  ];
  appendMutationEvent(tx, current, next, command, related, {
    basisRefs: [directionBasis(direction)]
  });
  return next;
}
function requireOwnerOrScope(current, command, authority) {
  requireAnyNamedAuthority(
    null,
    command,
    authority,
    command.kind,
    [current.body.owner, current.body.scope_authority]
  );
}
function handleParentHold(current, tx, command, authority) {
  if (current.body.state === "completed") {
    fail3("INVALID_INPUT", "completed parents cannot be placed on hold");
  }
  if (current.body.hold !== null) {
    fail3("INVALID_INPUT", `${current.kind}/${current.id} already has a hold`);
  }
  requireOwnerOrScope(current, command, authority);
  const next = {
    ...current.body,
    hold: {
      reason: command.payload.reason,
      set_by: command.actor,
      set_at: command.payload.at,
      release_condition: command.payload.releaseCondition,
      basis_refs: command.payload.basisRefs
    },
    updated_at: command.payload.at
  };
  appendMutationEvent(tx, current, next, command, parentContext(tx, current), {
    basisRefs: command.payload.basisRefs
  });
  return next;
}
function handleParentRelease(current, tx, command, authority) {
  if (current.body.state === "completed") {
    fail3("INVALID_INPUT", "completed parents cannot release holds");
  }
  if (current.body.hold === null) {
    fail3("INVALID_INPUT", `${current.kind}/${current.id} has no hold to release`);
  }
  if (command.payload.basisRefs.length === 0) {
    fail3("EVIDENCE_GAP", "hold release requires evidence basis references");
  }
  requireOwnerOrScope(current, command, authority);
  const next = {
    ...current.body,
    hold: null,
    updated_at: command.payload.at
  };
  appendMutationEvent(tx, current, next, command, parentContext(tx, current), {
    basisRefs: command.payload.basisRefs,
    extra: { releaseConditionMet: command.payload.conditionMet }
  });
  return next;
}
function handleParentComplete(current, tx, command, authority, runtime) {
  if (current.body.state !== "active") {
    fail3("INVALID_INPUT", `${current.kind}.complete requires an active parent`);
  }
  requireAllowedAuthority(
    command,
    authority,
    [current.body.completion_authority],
    `${current.kind}.complete requires its declared completion authority`
  );
  const config = PARENT_CONFIG[current.kind];
  const successful = command.payload.disposition === config.successDisposition;
  let related = parentContext(tx, current);
  let closureRef = null;
  let basisRefs = command.payload.basisRefs;
  if (successful) {
    requireNoHold(current, `${current.kind}/${current.id}`);
    const direction = directionForRecord(tx, current, runtime);
    related = [
      ...related,
      ...assertParentRelationships(tx, current),
      ...assertAlignedAncestors(tx, current, direction)
    ];
    basisRefs = [...basisRefs, directionBasis(direction)];
    const eligibility = closureEligibility(tx, current);
    if (!eligibility.eligible) {
      fail3("EVIDENCE_GAP", eligibility.blockers[0].reason);
    }
    closureRef = eligibility.closureRef;
    if (command.payload.closureRef !== closureRef) {
      fail3(
        "VERSION_CONFLICT",
        `${current.kind}/${current.id} closure reference does not match current child versions`
      );
    }
    related.push(...eligibility.requiredChildren);
    for (const version of eligibility.relationshipVersions) {
      const record = tx.get(version.kind, version.id);
      if (record) related.push(record);
    }
  } else if (Object.hasOwn(command.payload, "closureRef")) {
    fail3(
      "INVALID_INPUT",
      "cancelled and superseded completion must not claim a successful closure reference"
    );
  }
  const next = {
    ...current.body,
    state: "completed",
    completion_disposition: command.payload.disposition,
    updated_at: command.payload.at
  };
  appendMutationEvent(tx, current, next, command, related, {
    basisRefs,
    extra: {
      closureRef,
      disposition: command.payload.disposition
    }
  });
  return next;
}
var parentHandlers = /* @__PURE__ */ new Map([
  ["epic.create", handleEpicCreate],
  ["epic.update", handleParentUpdate],
  ["epic.activate", handleParentActivate],
  ["epic.hold", handleParentHold],
  ["epic.release", handleParentRelease],
  ["epic.complete", handleParentComplete],
  ["feature.create", handleFeatureCreate],
  ["feature.update", handleParentUpdate],
  ["feature.activate", handleParentActivate],
  ["feature.hold", handleParentHold],
  ["feature.release", handleParentRelease],
  ["feature.complete", handleParentComplete],
  ["requirement.create", handleRequirementCreate],
  ["requirement.update", handleParentUpdate],
  ["requirement.activate", handleParentActivate],
  ["requirement.hold", handleParentHold],
  ["requirement.release", handleParentRelease],
  ["requirement.complete", handleParentComplete]
]);

// src/core/lib/coordination-runtime/task-engine.mjs
import { randomUUID } from "node:crypto";

// src/core/lib/coordination-runtime/evidence-context.mjs
import { isAbsolute as isAbsolute2, join as join2 } from "node:path";
var bindings = /* @__PURE__ */ new WeakMap();
var transactions = /* @__PURE__ */ new WeakMap();
var clone = (value) => JSON.parse(canonicalJson(value));
function bindEvidenceRuntime(store, options) {
  assertExactKeys(options, /* @__PURE__ */ new Set([
    "root",
    "authority",
    "runs",
    "verifyCapture",
    "verifyOperatorDecision"
  ]), "evidence runtime", /* @__PURE__ */ new Set(["root", "authority", "runs"]));
  workspaceManifest(options.root);
  const database = COORDINATION_DATABASE;
  if (!store || store.closed || !isAbsolute2(store.path) || normalized(store.path) !== normalized(join2(options.root, ...database.split("/")))) {
    fail("INVALID_INPUT", "evidence workspace must be explicitly bound to this store");
  }
  assertWorkspacePath(options.root, database);
  validateAuthority(options.authority);
  if (!Array.isArray(options.runs)) fail("INVALID_INPUT", "approved run bindings must be an array");
  const actors = /* @__PURE__ */ new Set();
  const directories = /* @__PURE__ */ new Set();
  for (const run of options.runs) {
    assertExactKeys(run, /* @__PURE__ */ new Set(["actor", "directory"]), "approved run");
    validateActor(run.actor);
    const directory = durablePath(run.directory);
    let route;
    try {
      const parsed = parseTypedArtifactRoute(directory);
      const completeRoutes = parsed.routes.filter((candidate) => candidate.members.length === 0);
      [route] = completeRoutes;
      if (parsed.visibility !== "private" || completeRoutes.length !== 1) {
        fail("INVALID_INPUT", "approved run directory must be one complete typed private artifact route");
      }
    } catch (error) {
      if (error?.code) throw error;
      fail("INVALID_INPUT", error.message);
    }
    if (directory !== run.directory || actors.has(canonicalJson(run.actor)) || directories.has(directory.toLowerCase())) {
      fail("INVALID_INPUT", "approved run directories must be unique typed private artifact paths");
    }
    assertWorkspacePath(options.root, `${directory}/.evidence/probe`);
    actors.add(canonicalJson(run.actor));
    directories.add(directory.toLowerCase());
  }
  for (const key of ["verifyCapture", "verifyOperatorDecision"]) {
    if (options[key] !== void 0 && typeof options[key] !== "function") {
      fail("INVALID_INPUT", `${key} must be a trusted host function`);
    }
  }
  bindings.set(store, {
    ...options,
    root: normalized(options.root),
    authority: clone(options.authority),
    runs: clone(options.runs)
  });
}
function bindEvidenceTransaction(store, tx) {
  transactions.set(tx, store);
  return tx;
}
function bindEvidenceReadView(tx, { root }) {
  workspaceManifest(root);
  bindings.set(tx, { root: normalized(root) });
  return tx;
}
function contextFor(storeOrTransaction) {
  const store = transactions.get(storeOrTransaction) ?? storeOrTransaction;
  const context = bindings.get(store);
  if (!context || store.closed) {
    fail("AUTHORITY_REQUIRED", "bind the explicit workspace and host authority before evidence operations or acceptance");
  }
  workspaceManifest(context.root);
  return context;
}

// src/core/lib/coordination-runtime/evidence-integrity.mjs
var contentEquals2 = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var bindsSubject2 = (record, subject) => subjectEquals(record?.subject, subject);
var lookup = (tx) => (kind, id) => tx.get(kind, id);
var positiveEvidenceOutcomes = /* @__PURE__ */ new Set(["clear", "waived", "passed"]);
function hasPublicSafeExcerptPath(root, path2) {
  if (pathPrivacy(root, path2) === "public") return true;
  try {
    const parsed = parseTypedArtifactRoute(path2);
    return parsed.visibility === "private" && parsed.routes.some((route) => route.lifecycle === "drafts");
  } catch {
    return false;
  }
}
function requirePositiveEffectiveEvidence(effective, record) {
  const scoped = effective.filter((candidate) => evidenceScope(candidate) === evidenceScope(record));
  if (!effective.some((candidate) => candidate.evidence_id === record.evidence_id) || scoped.some((candidate) => !positiveEvidenceOutcomes.has(candidate.outcome))) {
    fail(
      "EVIDENCE_GAP",
      "superseded or negative evidence, including conflicting scoped evidence, cannot establish acceptance"
    );
  }
}
function hasPublicationHistory(asset) {
  return asset.history.some((h) => ["published", "retracted"].includes(h.disposition) || h.target.startsWith("project:") && !h.target.endsWith(":@git") && h.validity === "current");
}
function verifyAssetContent(context, tx, asset) {
  const artifact = tx.get("artifact", asset.artifact_id);
  if (!bindsSubject2(artifact, asset.subject)) fail("EVIDENCE_GAP", "asset has no registered artifact");
  verifyArtifact(context.root, artifact.body);
  verifyInputBasis(context, tx, artifact.body.input_basis ?? []);
  const initial = artifact.body.content_ref.kind === "sha256" ? artifact.body.content_ref.path : artifact.body.manifest_path ?? `project:${artifact.body.project_id}:@git`;
  if (asset.target !== initial || asset.history.some((h) => ["working", "published"].includes(h.disposition))) {
    verifyTarget(context.root, asset.target, artifact.body);
  }
  return artifact.body;
}
function verifyRegisteredArtifact(context, tx, record) {
  verifyInputBasis(context, tx, record.body.input_basis ?? []);
  const assets = tx.list("asset", record.subject).filter((asset) => asset.body.artifact_id === record.id);
  if (assets.length === 0) verifyArtifact(context.root, record.body);
  else assets.forEach((asset) => verifyAssetContent(context, tx, asset.body));
}
function parentReportArtifact(context, tx, parent, reference, approvalId = null) {
  const match = /^artifact:([0-9a-f-]+)$/i.exec(reference);
  if (!match) {
    fail("EVIDENCE_GAP", "parent completion proof must reference persisted report artifacts");
  }
  const artifact = tx.get("artifact", match[1]);
  if (!bindsSubject2(artifact, { kind: parent.kind, id: parent.id }) || artifact.body.classification !== "public" || !artifactBasisCurrent(context, tx, parent, artifact.body)) {
    fail("EVIDENCE_GAP", "parent completion report artifact is missing, stale, or not public");
  }
  const paths = artifact.body.content_ref.kind === "git" ? [] : artifact.body.content_ref.kind === "sha256" ? [artifact.body.content_ref.path] : artifact.body.content_ref.entries.map((entry) => entry.path);
  if (paths.some((path2) => !hasPublicSafeExcerptPath(context.root, path2))) {
    fail("EVIDENCE_GAP", "parent completion report artifact has no public safe-excerpt lane");
  }
  verifyRegisteredArtifact(context, tx, artifact);
  if (approvalId !== null) {
    const assets = tx.list("asset", artifact.subject).filter((record) => record.body.artifact_id === artifact.id && record.body.validity === "current" && !(/* @__PURE__ */ new Set(["scratch", "draft", "discarded", "retracted"])).has(record.body.disposition) && record.body.completion_approval_id === approvalId);
    if (assets.length !== 1 || assets[0].body.history.at(-1).at_subject_version !== parent.version) {
      fail(
        "EVIDENCE_GAP",
        "parent completion report artifact lacks one accepted current revision"
      );
    }
    verifyAssetContent(context, tx, assets[0].body);
  }
  return artifact.body;
}
function verifyParentCompletionEvidence(context, tx, parent, refs, { approvalId = null } = {}) {
  if (parent.kind === "task" || !Array.isArray(refs) || refs.length === 0 || refs.some((reference) => !/^artifact:([0-9a-f-]+)$/i.test(reference)) || new Set(refs).size !== refs.length) {
    fail("EVIDENCE_GAP", "parent completion requires exact accepted report artifact proof");
  }
  return refs.map((reference) => parentReportArtifact(context, tx, parent, reference, approvalId));
}
function verifyParentCompletionApproval(context, tx, parent, refs, { approvalId = null } = {}) {
  if (parent.kind === "task" || !Array.isArray(refs) || refs.length === 0 || new Set(refs).size !== refs.length) {
    fail("EVIDENCE_GAP", "parent completion approval requires persisted parent-completion evidence");
  }
  const evidenceRefs = refs.filter((reference) => /^evidence:([0-9a-f-]+)$/i.test(reference));
  const artifactRefs = refs.filter((reference) => /^artifact:([0-9a-f-]+)$/i.test(reference));
  if (evidenceRefs.length === 0 || artifactRefs.length === 0 || evidenceRefs.length + artifactRefs.length !== refs.length) {
    fail(
      "EVIDENCE_GAP",
      "parent completion approval requires persisted evidence and explicit report artifacts"
    );
  }
  const effective = effectiveEvidence(
    tx.list("evidence", { kind: parent.kind, id: parent.id }).map((record) => record.body),
    parent,
    lookup(tx)
  );
  const evidenceArtifacts = /* @__PURE__ */ new Set();
  for (const reference of evidenceRefs) {
    const id = reference.slice("evidence:".length);
    const record = tx.get("evidence", id);
    if (!record || !subjectEquals(record.subject, { kind: parent.kind, id: parent.id }) || record.body.kind !== "parent-completion" || record.body.outcome !== "passed" || record.body.provenance?.tier !== "observed" || !effective.some((candidate) => candidate.evidence_id === id)) {
      fail("EVIDENCE_GAP", "parent completion evidence is missing, stale, negative, or cross-subject");
    }
    requirePositiveEffectiveEvidence(effective, record.body);
    for (const artifact of verifyParentCompletionEvidence(
      context,
      tx,
      parent,
      record.body.evidence_refs,
      { approvalId }
    )) {
      evidenceArtifacts.add(artifact.artifact_id);
    }
  }
  for (const reference of artifactRefs) {
    const artifact = parentReportArtifact(context, tx, parent, reference, approvalId);
    if (!evidenceArtifacts.has(artifact.artifact_id)) {
      fail(
        "EVIDENCE_GAP",
        "explicitly accepted report artifact is not part of the parent completion evidence"
      );
    }
  }
  return artifactRefs.map((reference) => reference.slice("artifact:".length));
}
function artifactBasisCurrent(context, tx, item, artifact) {
  return artifact.criteria_ref === criteriaRef(item, lookup(tx)) && (item.body.context_artifacts ?? []).every((ref) => artifact.input_basis?.some((b) => b.reference === ref)) && inputBasisCurrent(context, tx, artifact.input_basis ?? []);
}
function subjectArtifact(context, tx, item, subject, acceptingActor = null) {
  if (item.kind !== "task") fail("INVALID_INPUT", "execution artifacts require a Task subject");
  const history = tx.list("artifact", { kind: "task", id: item.id }).filter((record) => contentEquals2(record.body.content_ref, subject));
  if (acceptingActor && (isProducingRun(item.body, acceptingActor) || history.some((record) => record.body.producer.runId === acceptingActor.runId))) {
    fail("AUTHORITY_REQUIRED", "a producing run cannot independently accept its exact subject");
  }
  const candidates = history.filter((record) => artifactBasisCurrent(context, tx, item, record.body));
  if (candidates.length === 0) fail("EVIDENCE_GAP", "exact current subject has no registered retained artifact");
  for (const candidate of candidates) verifyRegisteredArtifact(context, tx, candidate);
}
function verifyReferences(context, tx, item, refs, { recovery = false, positive = true } = {}) {
  const artifacts = [];
  const visit = (ref, seen) => {
    const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(ref);
    if (!match || seen.has(ref)) fail("EVIDENCE_GAP", "references must name registered acyclic artifact/evidence records");
    const [, kind, id] = match;
    const record = tx.get(kind, id);
    if (!bindsSubject2(record, { kind: item.kind, id: item.id })) {
      fail("EVIDENCE_GAP", "referenced evidence is missing or belongs to another hierarchy subject");
    }
    if (kind === "artifact") {
      if (!recovery && record.body.criteria_ref !== criteriaRef(item, lookup(tx))) {
        fail("EVIDENCE_GAP", "artifact criteria changed");
      }
      verifyRegisteredArtifact(context, tx, record);
      artifacts.push(record.body);
    } else {
      if (!recovery && !matchesAcceptance(record.body, item, lookup(tx))) fail("EVIDENCE_GAP", "referenced evidence is not current");
      if (!recovery && positive) {
        const effective = effectiveEvidence(
          tx.list("evidence", { kind: item.kind, id: item.id }).map((r) => r.body),
          item,
          lookup(tx)
        );
        requirePositiveEffectiveEvidence(effective, record.body);
      }
      record.body.evidence_refs.forEach((child) => visit(child, /* @__PURE__ */ new Set([...seen, ref])));
    }
  };
  refs.forEach((ref) => visit(ref, /* @__PURE__ */ new Set()));
  return artifacts;
}
function verifyVerdict(tx, item, verdict, actor = null) {
  const context = contextFor(tx);
  subjectArtifact(context, tx, item, verdict.content_ref, actor);
  verifyReferences(context, tx, item, [...verdict.evidence_refs, ...verdict.finding_refs ?? []]);
}

// src/core/lib/coordination-runtime/acceptance.mjs
function fail4(code, message) {
  throw new RuntimeError(code, message);
}
function taskOnly(record, action) {
  if (record.kind !== "task") fail4("INVALID_INPUT", `${action} requires a Task subject`);
}
function lookup2(tx) {
  return (kind, id) => tx.get(kind, id);
}
function bodies(tx, kind, record) {
  return tx.list(kind, { kind: record.kind, id: record.id }).map((entry) => entry.body);
}
function requireReviews(tx, item) {
  taskOnly(item, "review requirements");
  const reviews = effectiveReviews(bodies(tx, "review", item), item, lookup2(tx));
  for (const requirement of item.body.review_requirements) {
    const matching = reviews.filter((review) => review.reviewer.role === requirement.role && review.kind === requirement.kind);
    if (matching.length === 0) {
      fail4("EVIDENCE_GAP", `task/${item.id} lacks current ${requirement.role} ${requirement.kind} review`);
    }
    const independent = matching.filter((review) => !isProducingRun(item.body, review.reviewer));
    if (independent.length === 0) {
      fail4("AUTHORITY_REQUIRED", "a producing run cannot review its own subject");
    }
    if (independent.some((review) => review.verdict !== "approved")) {
      fail4("EVIDENCE_GAP", `task/${item.id} has an unresolved negative ${requirement.kind} review`);
    }
    if (requirement.kind === "product-design-acceptance" && (requirement.role !== item.body.completion_authority || item.body.producing_actors.some((actor) => actor.role === requirement.role))) {
      fail4("AUTHORITY_REQUIRED", "product-design acceptance requires an independent completion authority");
    }
    independent.forEach((review) => verifyVerdict(tx, item, review, review.reviewer));
  }
}
function completionApproval(tx, item) {
  const matching = effectiveApprovals(bodies(tx, "approval", item), item, lookup2(tx)).filter((approval) => approval.kind === "completion" && approval.authority.role === item.body.completion_authority);
  if (matching.length === 0) {
    fail4(
      "EVIDENCE_GAP",
      `${item.kind}/${item.id} lacks current completion-authority approval`
    );
  }
  if (item.kind !== "task") {
    if (matching.some((approval) => approval.decision !== "approved" || approval.recorded_at_subject_version !== item.version)) {
      fail4(
        "EVIDENCE_GAP",
        "an effective parent completion decision rejects or predates the current revision"
      );
    }
    const context = contextFor(tx);
    matching.forEach((approval) => verifyParentCompletionApproval(
      context,
      tx,
      item,
      approval.evidence_refs,
      { approvalId: approval.approval_id }
    ));
    return matching[0];
  }
  const independent = matching.filter((approval) => !isProducingRun(item.body, approval.authority));
  if (independent.length === 0) fail4("AUTHORITY_REQUIRED", "a producing run cannot accept its own work");
  if (independent.some((approval) => approval.decision !== "approved")) {
    fail4("EVIDENCE_GAP", "an effective completion decision rejects the current work");
  }
  independent.forEach((approval) => verifyVerdict(tx, item, approval, approval.authority));
  return independent[0];
}
function requireReleaseEvidence(tx, item) {
  taskOnly(item, "release evidence");
  const evidence = effectiveEvidence(bodies(tx, "evidence", item), item, lookup2(tx)).filter((record) => record.kind === "dod-dimension");
  for (const dimension of DOD_DIMENSIONS) {
    const matching = evidence.filter((record) => record.dimension === dimension);
    if (matching.length === 0 || matching.some((record) => record.outcome === "gap")) {
      fail4("EVIDENCE_GAP", `task/${item.id} lacks accepted ${dimension} evidence for its current criteria`);
    }
    matching.forEach((record) => verifyVerdict(tx, item, record));
  }
}
function requireOperatorApproval(tx, item, kind) {
  taskOnly(item, "deployment approval");
  const approvals = effectiveApprovals(bodies(tx, "approval", item), item, lookup2(tx)).filter((approval) => approval.kind === kind && approval.authority.role === "operator");
  if (approvals.length === 0 || approvals.some((approval) => approval.decision !== "approved")) {
    fail4("AUTHORITY_REQUIRED", `task/${item.id} lacks effective ${kind} operator confirmation`);
  }
  if (new Set(approvals.map((approval) => canonicalJson(approval.deployment))).size !== 1) {
    fail4("AUTHORITY_REQUIRED", "operator confirmations disagree about the production deployment");
  }
  approvals.forEach((approval) => verifyVerdict(tx, item, approval, approval.authority));
  return approvals[0];
}
function requireDeploymentEvidence(tx, item, kind) {
  taskOnly(item, "deployment evidence");
  const start = requireOperatorApproval(tx, item, "operator-deploy-start");
  const complete = requireOperatorApproval(tx, item, "operator-deploy-complete");
  if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment)) {
    fail4("AUTHORITY_REQUIRED", "deployment completion does not match the confirmed production start");
  }
  const evidence = effectiveEvidence(bodies(tx, "evidence", item), item, lookup2(tx)).filter((record) => record.kind === kind && record.data.environment === start.deployment.environment && record.data.deployment_id === start.deployment.deployment_id);
  if (evidence.length === 0 || evidence.some((record) => record.outcome !== "passed")) {
    fail4("EVIDENCE_GAP", `task/${item.id} lacks passed ${kind} evidence for the confirmed production deployment`);
  }
  evidence.forEach((record) => verifyVerdict(tx, item, record));
}
function recoveryResolution(tx, item, approvalId) {
  taskOnly(item, "recovery resolution");
  const approvals = effectiveApprovals(bodies(tx, "approval", item), item, lookup2(tx)).filter((approval2) => approval2.kind === "operator-recovery-resolution" && approval2.authority.role === "operator");
  const approval = approvals.find((candidate) => candidate.approval_id === approvalId);
  const attempt = tx.get("attempt", item.body.recovery_hold);
  if (!approval || approvals.some((candidate) => candidate.decision !== "approved") || new Set(approvals.map((candidate) => canonicalJson(candidate.recovery))).size !== 1 || attempt?.subject?.kind !== "task" || attempt.subject.id !== item.id || attempt.body.disposition !== "conflicting-partial-work" || attempt.body.stale_lease.token !== approval.recovery.stale_lease_token) {
    fail4("AUTHORITY_REQUIRED", "conflicting partial work requires exact persisted operator resolution");
  }
  return approval;
}

// src/core/lib/coordination-runtime/task-engine.mjs
var GRANTABLE_STATES = /* @__PURE__ */ new Set([
  "ready",
  "in-progress",
  "in-review",
  "release-ready",
  "deploying",
  "production-verification"
]);
var SHIP_STATES = /* @__PURE__ */ new Set([
  "release-ready",
  "deploying",
  "production-verification"
]);
var ALLOWED_TRANSITIONS = /* @__PURE__ */ new Map([
  ["proposed", /* @__PURE__ */ new Set(["dropped"])],
  ["ready", /* @__PURE__ */ new Set(["blocked", "dropped"])],
  ["in-progress", /* @__PURE__ */ new Set(["in-review", "blocked", "dropped"])],
  ["in-review", /* @__PURE__ */ new Set(["in-progress", "completed", "release-ready", "blocked", "dropped"])],
  ["release-ready", /* @__PURE__ */ new Set(["deploying", "blocked", "dropped"])],
  ["deploying", /* @__PURE__ */ new Set(["production-verification", "blocked", "dropped"])],
  ["production-verification", /* @__PURE__ */ new Set(["shipped", "blocked", "dropped"])],
  ["blocked", /* @__PURE__ */ new Set(["dropped"])],
  ["completed", /* @__PURE__ */ new Set()],
  ["shipped", /* @__PURE__ */ new Set()],
  ["dropped", /* @__PURE__ */ new Set()]
]);
function fail5(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}
function requireKnownTaskRoles(body, authority) {
  for (const [label, role] of [
    ["scope authority", body.scope_authority],
    ["completion authority", body.completion_authority],
    ["next role", body.next_role],
    ["producer", body.producer_actor?.role ?? null],
    ["acceptance actor", body.acceptance_actor?.role ?? null]
  ]) {
    if (role !== null) requireRoleAvailable(role, authority, label);
  }
  for (const requirement of body.review_requirements) {
    requireRoleAvailable(requirement.role, authority, "review requirement");
  }
}
function taskRecord(body, version = 1) {
  return {
    kind: "task",
    id: body.id,
    subject: null,
    version,
    body
  };
}
function assertCurrentAlignment(tx, task, runtime) {
  const feature = tx.get("feature", task.body.feature_id);
  if (!feature) {
    fail5("EVIDENCE_GAP", `task/${task.id} has no current Feature ancestor`);
  }
  const epic = tx.get("epic", feature.body.epic_id);
  if (!epic) {
    fail5("EVIDENCE_GAP", `feature/${feature.id} has no current Epic ancestor`);
  }
  return assertAlignedAncestors(tx, task, runtime.direction(epic.body.direction_ref));
}
function alignmentFailure(tx, task, runtime) {
  try {
    assertCurrentAlignment(tx, task, runtime);
    return null;
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "EVIDENCE_GAP") return error;
    throw error;
  }
}
function taskStateSatisfies(task, requirement) {
  if (requirement === "in-review") {
    return (/* @__PURE__ */ new Set([
      "in-review",
      "completed",
      "release-ready",
      "deploying",
      "production-verification",
      "shipped"
    ])).has(task.body.state);
  }
  if (requirement === "completed") {
    return task.body.delivery_class === "knowledge" && task.body.state === "completed";
  }
  if (requirement === "release-ready") {
    return task.body.delivery_class !== "knowledge" && (/* @__PURE__ */ new Set([
      "release-ready",
      "deploying",
      "production-verification",
      "shipped"
    ])).has(task.body.state);
  }
  return task.body.delivery_class !== "knowledge" && task.body.state === "shipped";
}
function dependencyStatus(tx, task) {
  const pending = [];
  const failed = [];
  for (const dependency of task.body.depends_on) {
    const upstream = tx.get("task", dependency.task);
    if (!upstream) {
      fail5(
        "EVIDENCE_GAP",
        `dependency task/${dependency.task} does not exist`
      );
    }
    if (upstream.body.state === "dropped") {
      failed.push(dependency.task);
    } else if (!taskStateSatisfies(upstream, dependency.requires)) {
      pending.push(dependency.task);
    }
  }
  return { pending, failed };
}
function assertNoDependencyCycle(tx, candidate) {
  const all = new Map(tx.list("task").map((record) => [record.id, record.body]));
  all.set(candidate.id, candidate);
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (id) => {
    if (visiting.has(id)) fail5("INVALID_INPUT", `dependency cycle includes task/${id}`);
    if (visited.has(id)) return;
    const task = all.get(id);
    if (!task) return;
    visiting.add(id);
    for (const dependency of task.depends_on) visit(dependency.task);
    visiting.delete(id);
    visited.add(id);
  };
  visit(candidate.id);
}
function touchPrefix(touch) {
  const normalized2 = touch.replaceAll("\\", "/").toLowerCase();
  const segments = normalized2.split("/");
  if (segments.includes("..") || normalized2.startsWith("/") || /^[a-z]:/.test(normalized2)) {
    return { prefix: "", wildcard: true };
  }
  const path2 = segments.filter((segment) => segment !== "" && segment !== ".").join("/");
  const wildcard = path2.search(/[*?[\]{}()!+@]/);
  return {
    prefix: wildcard === -1 ? path2 : path2.slice(0, wildcard),
    wildcard: wildcard !== -1 || normalized2.endsWith("/")
  };
}
function touchesOverlap(left, right) {
  for (const leftTouch of left) {
    for (const rightTouch of right) {
      const left2 = touchPrefix(leftTouch);
      const right2 = touchPrefix(rightTouch);
      if (left2.prefix === right2.prefix) return true;
      if ((left2.wildcard || right2.wildcard) && (left2.prefix.startsWith(right2.prefix) || right2.prefix.startsWith(left2.prefix))) return true;
    }
  }
  return false;
}
function requireNoTouchConflict(tx, task) {
  for (const other of tx.list("task")) {
    if (other.id === task.id || !leaseIsLive(other.body.lease)) continue;
    if (touchesOverlap(task.body.touches, other.body.touches)) {
      fail5(
        "LEASE_CONFLICT",
        `task/${task.id} touch set conflicts with active task/${other.id}`
      );
    }
  }
}
function requireNoOpenQuestions(task) {
  if (task.body.waiting_on_questions.length > 0) {
    fail5(
      "EVIDENCE_GAP",
      `task/${task.id} has unanswered blocking questions`
    );
  }
}
function requireImmutableSubject(task) {
  if (task.body.change_ref === null) {
    fail5("EVIDENCE_GAP", `task/${task.id} has no immutable change subject`);
  }
}
function requireTransition(tx, task, command, authority, to) {
  const from = task.body.state;
  if (!ALLOWED_TRANSITIONS.get(from)?.has(to)) {
    fail5("INVALID_INPUT", `task lifecycle does not allow ${from} -> ${to}`);
  }
  if (task.body.lease !== null && !leaseIsLive(task.body.lease)) {
    fail5("RECOVERY_REQUIRED", `task/${task.id} lease expired and must be reconciled`);
  }
  if (to !== "blocked" && to !== "dropped") requireNoOpenQuestions(task);
  const dependencies2 = dependencyStatus(tx, task);
  if (dependencies2.failed.length > 0 && to !== "blocked" && to !== "dropped") {
    fail5(
      "RECOVERY_REQUIRED",
      `task/${task.id} has failed dependencies: ${dependencies2.failed.join(", ")}`
    );
  }
  if (dependencies2.pending.length > 0 && to !== "blocked" && to !== "dropped") {
    fail5(
      "EVIDENCE_GAP",
      `task/${task.id} has pending dependencies: ${dependencies2.pending.join(", ")}`
    );
  }
  if (to === "ready") {
    requireNamedAuthority(
      tx,
      command,
      authority,
      "task.promote",
      task.body.scope_authority
    );
    return null;
  }
  if (to === "dropped") {
    requireNamedAuthority(
      tx,
      command,
      authority,
      "task.transition",
      task.body.scope_authority
    );
    return null;
  }
  requireActingAuthority(tx, task, command, authority, "task.transition");
  if (to === "in-review") {
    if (!sameActor(command.actor, task.body.producer_actor)) {
      fail5("AUTHORITY_REQUIRED", "only the producing actor may submit its work for review");
    }
    requireImmutableSubject(task);
  }
  if (to === "completed") {
    if (task.body.delivery_class !== "knowledge") {
      fail5("INVALID_INPUT", "completed is reserved for knowledge Tasks");
    }
    requireImmutableSubject(task);
    requireReviews(tx, task);
    return completionApproval(tx, task);
  }
  if (to === "release-ready") {
    if (task.body.delivery_class === "knowledge") {
      fail5("INVALID_INPUT", "knowledge Tasks do not enter release-ready");
    }
    if (command.actor.role !== "workflow-ship") {
      fail5("AUTHORITY_REQUIRED", "workflow-ship owns release readiness");
    }
    requireImmutableSubject(task);
    requireReviews(tx, task);
    const approval = completionApproval(tx, task);
    requireReleaseEvidence(tx, task);
    return approval;
  }
  if (to === "deploying") {
    if (command.actor.role !== "workflow-ship") {
      fail5("AUTHORITY_REQUIRED", "workflow-ship owns deployment recording");
    }
    requireOperatorApproval(tx, task, "operator-deploy-start");
  }
  if (to === "production-verification") {
    if (command.actor.role !== "workflow-ship") {
      fail5("AUTHORITY_REQUIRED", "workflow-ship owns deployment recording");
    }
    requireOperatorApproval(tx, task, "operator-deploy-complete");
    requireDeploymentEvidence(tx, task, "deployment");
  }
  if (to === "shipped") {
    if (command.actor.role !== "workflow-ship") {
      fail5("AUTHORITY_REQUIRED", "workflow-ship owns shipment recording");
    }
    requireDeploymentEvidence(tx, task, "deployment");
    requireDeploymentEvidence(tx, task, "production-verification");
  }
  return null;
}
function transitionBody(tx, task, command, authority, runtime, to, at) {
  if (to !== "blocked" && to !== "dropped" || hasStaleDirection(tx, task, runtime.direction)) {
    assertCurrentAlignment(tx, task, runtime);
  }
  const candidate = to === "in-review" ? {
    ...task,
    body: {
      ...task.body,
      change_ref: command.payload.subject
    }
  } : task;
  const approval = requireTransition(tx, candidate, command, authority, to);
  let nextRole = task.body.next_role;
  if (to === "in-progress") {
    nextRole = task.body.producer_actor?.role ?? task.body.next_role;
  } else if (to === "in-review") {
    nextRole = task.body.review_requirements[0]?.role ?? task.body.completion_authority;
  } else if (to === "release-ready") {
    nextRole = "operator";
  } else if (to === "deploying" || to === "production-verification") {
    nextRole = "workflow-ship";
  } else if (TASK_TERMINAL_STATES.has(to)) {
    nextRole = null;
  }
  retireLeaseGrants(tx, task, "revoked");
  return {
    ...task.body,
    state: to,
    resume_state: to === "blocked" ? task.body.state : null,
    acceptance_actor: approval?.authority ?? task.body.acceptance_actor,
    next_role: nextRole,
    change_ref: to === "in-review" ? command.payload.subject : task.body.change_ref,
    lease: null,
    updated_at: at
  };
}
function putMessage(tx, task, command, {
  messageId,
  parentId,
  recipient,
  kind,
  createdAt,
  content,
  artifactRefs,
  evidenceRefs,
  provenance
}, basisVersion = task.version + 1) {
  if (tx.get("message", messageId)) {
    fail5("OPERATION_CONFLICT", `message/${messageId} already exists`);
  }
  if (parentId !== null) {
    const parent = tx.get("message", parentId);
    if (!parent) fail5("INVALID_INPUT", `parent message/${parentId} does not exist`);
    if (!subjectEquals(parent.subject, { kind: task.kind, id: task.id })) {
      fail5("INVALID_INPUT", `parent message/${parentId} belongs to another hierarchy subject`);
    }
  }
  const body = {
    schema_version: 1,
    message_id: messageId,
    subject: { kind: task.kind, id: task.id },
    thread_id: subjectRef({ kind: task.kind, id: task.id }, basisVersion),
    parent_id: parentId,
    sender_role: command.actor.role,
    sender_run: command.actor.runId,
    recipient,
    kind,
    created_at: createdAt,
    basis_version: basisVersion,
    payload: content,
    artifact_refs: artifactRefs,
    evidence_refs: evidenceRefs,
    provenance
  };
  tx.put({
    kind: "message",
    id: messageId,
    subject: body.subject,
    version: 1,
    body
  });
  return body;
}
function handleTaskCreate(current, tx, command, authority, runtime) {
  if (current !== null) fail5("VERSION_CONFLICT", `task/${command.recordId} exists`);
  const body = command.payload.body;
  if (body.state !== "proposed") {
    fail5("INVALID_INPUT", "new Tasks must begin proposed");
  }
  assertCurrentAlignment(tx, taskRecord(body), runtime);
  requireActionGrant(tx, command, authority, "task.create");
  requireKnownTaskRoles(body, authority);
  if (body.producer_actor && sameActor(body.producer_actor, body.acceptance_actor)) {
    fail5("AUTHORITY_REQUIRED", "the producer cannot be the acceptance actor");
  }
  assertNoDependencyCycle(tx, body);
  return body;
}
function handleTaskUpdate(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireActingAuthority(tx, current, command, authority, "task.update");
  const changes = Object.hasOwn(command.payload, "changes") ? command.payload.changes : { title: command.payload.title };
  const next = { ...current.body, ...changes };
  const acceptedState = current.body.state === "blocked" ? current.body.resume_state : current.body.state;
  if ((TASK_TERMINAL_STATES.has(acceptedState) || SHIP_STATES.has(acceptedState)) && criteriaRef({ ...current, body: next }, (kind, id) => tx.get(kind, id)) !== criteriaRef(current, (kind, id) => tx.get(kind, id))) {
    fail5("INVALID_INPUT", "accepted criteria are frozen; record changed requirements as new work");
  }
  if (current.body.recovery_hold !== null && Object.hasOwn(changes, "next_role")) {
    fail5("AUTHORITY_REQUIRED", "operator resolution must release the recovery routing hold");
  }
  requireKnownTaskRoles(next, authority);
  assertNoDependencyCycle(tx, next);
  if (current.body.lease !== null && Object.hasOwn(changes, "touches")) {
    requireNoTouchConflict(tx, { ...current, body: next });
  }
  return next;
}
function handleTaskPromote(current, tx, command, authority, runtime) {
  if (current.body.state !== "proposed") {
    fail5("INVALID_INPUT", "task.promote requires a proposed task");
  }
  assertCurrentAlignment(tx, current, runtime);
  requireKnownTaskRoles(current.body, authority);
  requireNamedAuthority(
    tx,
    command,
    authority,
    "task.promote",
    current.body.scope_authority
  );
  dependencyStatus(tx, current);
  return {
    ...current.body,
    state: "ready",
    updated_at: command.payload.at
  };
}
function createPersistedGrant(tx, task, command, holder, actions, acquiredAt, expiresAt, token) {
  const grantId = randomUUID();
  tx.put({
    kind: "grant",
    id: grantId,
    subject: { kind: "task", id: task.id },
    version: 1,
    body: {
      schema_version: 1,
      grant_id: grantId,
      subject: { kind: "task", id: task.id },
      actor: holder,
      actions,
      record_kind: "task",
      record_id: task.id,
      basis_ref: subjectRef({ kind: "task", id: task.id }, task.version),
      lease_token: token,
      issued_by: command.actor,
      created_at: acquiredAt,
      expires_at: expiresAt,
      status: "active"
    }
  });
  return grantId;
}
function retireLeaseGrants(tx, task, status) {
  if (task.body.lease === null) return;
  for (const record of tx.list("grant", { kind: "task", id: task.id })) {
    if (record.body.lease_token === task.body.lease.token && record.body.status === "active") {
      tx.put({ ...record, version: record.version + 1, body: { ...record.body, status } });
    }
  }
}
function withProducer(body, actor) {
  const history = [...body.producing_actors];
  for (const producer of [body.producer_actor, actor]) {
    if (producer && !history.some((previous) => sameActor(previous, producer))) history.push(producer);
  }
  return { producer_actor: actor, producing_actors: history };
}
function handleTaskGrant(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireActionGrant(tx, command, authority, "task.grant");
  requireKnownTaskRoles(current.body, authority);
  if (current.body.recovery_hold !== null) {
    fail5("AUTHORITY_REQUIRED", "operator resolution is required before regrant");
  }
  if (current.body.lease !== null) {
    if (leaseIsLive(current.body.lease)) {
      fail5("LEASE_CONFLICT", `task/${current.id} already has a live lease`);
    }
    fail5(
      "RECOVERY_REQUIRED",
      `task/${current.id} has an expired lease that must be reconciled`
    );
  }
  if (!GRANTABLE_STATES.has(current.body.state)) {
    fail5("INVALID_INPUT", `task/${current.id} cannot be granted from ${current.body.state}`);
  }
  requireRoleAvailable(command.payload.holder.role, authority, "lease holder");
  if (command.payload.holder.role === "operator") {
    fail5("INVALID_INPUT", "operator is a reserved endpoint and cannot hold a lease");
  }
  if (current.body.next_role !== null && current.body.next_role !== command.payload.holder.role) {
    fail5(
      "AUTHORITY_REQUIRED",
      `task/${current.id} is routed to ${current.body.next_role}`
    );
  }
  if (Date.parse(command.payload.expiresAt) <= Date.now()) {
    fail5("INVALID_INPUT", "a new lease must expire in the future");
  }
  requireNoOpenQuestions(current);
  const dependencies2 = dependencyStatus(tx, current);
  if (dependencies2.failed.length > 0) {
    return {
      ...current.body,
      state: "blocked",
      resume_state: current.body.state,
      lease: null,
      updated_at: command.payload.acquiredAt
    };
  }
  if (dependencies2.pending.length > 0) {
    fail5(
      "EVIDENCE_GAP",
      `task/${current.id} has pending dependencies: ${dependencies2.pending.join(", ")}`
    );
  }
  requireNoTouchConflict(tx, current);
  const token = randomUUID();
  createPersistedGrant(
    tx,
    current,
    command,
    command.payload.holder,
    command.payload.actions,
    command.payload.acquiredAt,
    command.payload.expiresAt,
    token
  );
  return {
    ...current.body,
    state: current.body.state === "ready" ? "in-progress" : current.body.state,
    ...current.body.state === "ready" || current.body.state === "in-progress" ? withProducer(current.body, command.payload.holder) : {},
    next_role: command.payload.holder.role,
    lease: {
      holder: command.payload.holder,
      token,
      version_at_grant: current.version,
      acquired_at: command.payload.acquiredAt,
      expires_at: command.payload.expiresAt
    },
    updated_at: command.payload.acquiredAt
  };
}
function handleTaskTransition(current, tx, command, authority, runtime) {
  return transitionBody(
    tx,
    current,
    command,
    authority,
    runtime,
    command.payload.to,
    command.payload.at
  );
}
function handleTaskHandoff(current, tx, command, authority, runtime) {
  const staleDirection = hasStaleDirection(tx, current, runtime.direction);
  if (staleDirection) {
    requireLeasedActingAuthority(tx, current, command, authority, "task.handoff");
    if (command.payload.state !== null) {
      fail5(
        "AUTHORITY_REQUIRED",
        `Direction-stale task/${current.id} handoff must preserve execution state`
      );
    }
    if (!(/* @__PURE__ */ new Set([current.body.scope_authority, "operator"])).has(command.payload.toRole)) {
      fail5(
        "AUTHORITY_REQUIRED",
        `Direction-stale task/${current.id} may hand off only to a safe owner`
      );
    }
  } else {
    requireActingAuthority(tx, current, command, authority, "task.handoff");
  }
  if (current.body.recovery_hold !== null) {
    fail5("AUTHORITY_REQUIRED", "operator resolution is required before handoff");
  }
  requireRoleAvailable(command.payload.toRole, authority, "handoff recipient");
  let next = current.body;
  if (command.payload.state !== null) {
    next = transitionBody(
      tx,
      current,
      command,
      authority,
      runtime,
      command.payload.state,
      command.payload.createdAt
    );
  } else if (!staleDirection) {
    const alignment = alignmentFailure(tx, current, runtime);
    if (alignment && !(/* @__PURE__ */ new Set([current.body.scope_authority, "operator"])).has(command.payload.toRole)) {
      fail5(
        "AUTHORITY_REQUIRED",
        `Direction-stale task/${current.id} may hand off only to a safe owner`
      );
    }
  }
  putMessage(tx, current, command, {
    messageId: command.payload.messageId,
    parentId: command.payload.parentId,
    recipient: command.payload.toRole,
    kind: "handoff",
    createdAt: command.payload.createdAt,
    content: command.payload.content,
    artifactRefs: command.payload.artifactRefs,
    evidenceRefs: command.payload.evidenceRefs,
    provenance: command.payload.provenance
  });
  retireLeaseGrants(tx, current, "revoked");
  return {
    ...next,
    next_role: command.payload.toRole,
    lease: null,
    updated_at: command.payload.createdAt
  };
}
function requireRestorationAuthority(task, command, authority) {
  requireHostActionGrant(command, authority, "task.restore");
  if (SHIP_STATES.has(task.body.resume_state) && command.actor.role !== "workflow-ship") {
    fail5("AUTHORITY_REQUIRED", `workflow-ship must restore ${task.body.resume_state}`);
  }
}
function handleTaskRestore(current, tx, command, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireRestorationAuthority(current, command, authority);
  if (current.body.state !== "blocked" || current.body.resume_state === null) {
    fail5("INVALID_INPUT", "task.restore requires a blocked task with resume_state");
  }
  const resolution = current.body.recovery_hold !== null ? recoveryResolution(tx, current, command.payload.recoveryApprovalId) : null;
  if (resolution) requireRoleAvailable(resolution.recovery.resume_role, authority, "recovery recipient");
  if (!resolution && command.payload.recoveryApprovalId) {
    fail5("INVALID_INPUT", "task has no recovery hold to resolve");
  }
  if (current.body.lease !== null) {
    fail5("RECOVERY_REQUIRED", "the blocked reservation must be reconciled before restoration");
  }
  requireNoOpenQuestions(current);
  const dependencies2 = dependencyStatus(tx, current);
  if (dependencies2.failed.length > 0) {
    fail5(
      "RECOVERY_REQUIRED",
      `task/${current.id} still has failed dependencies`
    );
  }
  if (dependencies2.pending.length > 0) {
    fail5(
      "EVIDENCE_GAP",
      `task/${current.id} still has pending dependencies`
    );
  }
  if (TASK_NEEDS_CHANGE_REF.has(current.body.resume_state) && current.body.change_ref === null) {
    fail5(
      "EVIDENCE_GAP",
      `task/${current.id} cannot restore ${current.body.resume_state} without a change subject`
    );
  }
  return {
    ...current.body,
    state: current.body.resume_state,
    resume_state: null,
    recovery_hold: null,
    next_role: resolution?.recovery.resume_role ?? current.body.next_role,
    updated_at: command.payload.at
  };
}
function handleQuestionOpen(current, tx, command, authority, runtime) {
  const task = current.kind === "task";
  if (task) {
    assertCurrentAlignment(tx, current, runtime);
    requireActingAuthority(tx, current, command, authority, "question.open");
  } else {
    requireActionGrant(tx, command, authority, "question.open");
  }
  if (task && TASK_TERMINAL_STATES.has(current.body.state)) {
    fail5("INVALID_INPUT", "terminal Tasks cannot open questions");
  }
  if (command.payload.kind !== "question") {
    fail5("INVALID_INPUT", 'question.open message kind must be "question"');
  }
  requireRoleAvailable(command.payload.recipient, authority, "question recipient");
  if (command.payload.recipient === "operator" && command.payload.content.questionKind === "fact") {
    fail5(
      "AUTHORITY_REQUIRED",
      "fact questions must be addressed to the real role that owns the fact"
    );
  }
  if (tx.get("question", command.payload.questionId)) {
    fail5(
      "OPERATION_CONFLICT",
      `question/${command.payload.questionId} already exists`
    );
  }
  const message = putMessage(tx, current, command, {
    messageId: command.payload.messageId,
    parentId: command.payload.parentId,
    recipient: command.payload.recipient,
    kind: "question",
    createdAt: command.payload.createdAt,
    content: command.payload.content,
    artifactRefs: command.payload.artifactRefs,
    evidenceRefs: command.payload.evidenceRefs,
    provenance: command.payload.provenance
  });
  const content = command.payload.content;
  tx.put({
    kind: "question",
    id: command.payload.questionId,
    subject: { kind: current.kind, id: current.id },
    version: 1,
    body: {
      schema_version: 1,
      question_id: command.payload.questionId,
      subject: { kind: current.kind, id: current.id },
      asker: command.actor,
      recipient: command.payload.recipient,
      kind: content.questionKind,
      blocking: content.blocking,
      status: "open",
      context: content.context,
      ask: content.ask,
      answer_by: content.answerBy,
      opened_message_id: message.message_id,
      answer_message_ids: [],
      resolution: null
    }
  });
  if (!task || !content.blocking) {
    return { ...current.body, updated_at: command.payload.createdAt };
  }
  retireLeaseGrants(tx, current, "revoked");
  const waiting = current.body.waiting_on_questions.includes(command.payload.questionId) ? current.body.waiting_on_questions : [...current.body.waiting_on_questions, command.payload.questionId];
  return {
    ...current.body,
    state: "blocked",
    resume_state: current.body.state === "blocked" ? current.body.resume_state : current.body.state,
    waiting_on_questions: waiting,
    lease: null,
    updated_at: command.payload.createdAt
  };
}
function effectiveAnswers(tx, question, answerIds) {
  const answers = answerIds.map((id) => tx.get("message", id)?.body).filter((candidate) => candidate?.kind === "answer" && candidate.subject.kind === question.subject.kind && candidate.subject.id === question.subject.id && candidate.sender_role === question.body.recipient && candidate.recipient === question.body.asker.role && candidate.parent_id === question.body.opened_message_id && candidate.payload.status === "answered" && candidate.payload.lane === "in-lane");
  const replaced = new Set(answers.flatMap((answer) => answer.payload.resolves ?? []));
  return answers.filter((answer) => !replaced.has(answer.message_id));
}
function handleQuestionAnswer(current, tx, command, authority, runtime) {
  const task = current.kind === "task";
  if (task) assertCurrentAlignment(tx, current, runtime);
  if (command.payload.kind !== "answer") {
    fail5("INVALID_INPUT", 'question.answer message kind must be "answer"');
  }
  const question = tx.get("question", command.payload.questionId);
  if (question?.subject?.kind !== current.kind || question.subject.id !== current.id) {
    fail5(
      "INVALID_INPUT",
      `question/${command.payload.questionId} does not belong to task/${current.id}`
    );
  }
  if (command.actor.role !== question.body.recipient) {
    fail5(
      "AUTHORITY_REQUIRED",
      `question/${question.id} is addressed to ${question.body.recipient}`
    );
  }
  if (command.actor.role === "operator") {
    requireActionGrant(tx, command, authority, "question.answer");
  } else {
    requireActorAvailable(command, authority);
  }
  if (command.payload.recipient !== question.body.asker.role) {
    fail5("INVALID_INPUT", "answer recipient must be the original asker");
  }
  if (command.payload.parentId !== question.body.opened_message_id) {
    fail5("INVALID_INPUT", "answer parent must be the opening question message");
  }
  if (command.payload.content.resolves) {
    requireHostActionGrant(command, authority, "question.answer");
    const prior = effectiveAnswers(tx, question, question.body.answer_message_ids);
    const targets = new Set(command.payload.content.resolves);
    if (targets.size !== prior.length || prior.some((answer) => !targets.has(answer.message_id))) {
      fail5("INVALID_INPUT", "explicit question resolution must address every effective prior answer");
    }
  }
  const message = putMessage(tx, current, command, {
    messageId: command.payload.messageId,
    parentId: command.payload.parentId,
    recipient: command.payload.recipient,
    kind: "answer",
    createdAt: command.payload.createdAt,
    content: command.payload.content,
    artifactRefs: command.payload.artifactRefs,
    evidenceRefs: command.payload.evidenceRefs,
    provenance: command.payload.provenance
  });
  const answerIds = [...question.body.answer_message_ids, message.message_id];
  const answers = effectiveAnswers(tx, question, answerIds);
  const distinctAnswers = new Set(answers.map((answer) => answer.payload.answer.trim()));
  const resolved = distinctAnswers.size === 1;
  const resolvingMessage = resolved ? answers.at(-1) : null;
  tx.put({
    ...question,
    version: question.version + 1,
    body: {
      ...question.body,
      status: resolved ? "answered" : "open",
      answer_message_ids: answerIds,
      resolution: resolved ? {
        answer: resolvingMessage.payload.answer,
        lane: "in-lane",
        provenance: resolvingMessage.provenance,
        message_id: resolvingMessage.message_id,
        answered_at: resolvingMessage.created_at,
        sender: {
          role: resolvingMessage.sender_role,
          runId: resolvingMessage.sender_run
        }
      } : null
    }
  });
  if (!task || TASK_TERMINAL_STATES.has(current.body.state)) {
    return { ...current.body, updated_at: command.payload.createdAt };
  }
  let waiting = current.body.waiting_on_questions;
  if (question.body.blocking) {
    if (resolved) {
      waiting = waiting.filter((id) => id !== question.id);
    } else if (!waiting.includes(question.id)) {
      waiting = [...waiting, question.id];
    }
  }
  const shouldBlock = question.body.blocking && !resolved;
  const releaseLease = shouldBlock && leaseIsLive(current.body.lease);
  if (releaseLease) retireLeaseGrants(tx, current, "revoked");
  return {
    ...current.body,
    state: shouldBlock ? "blocked" : current.body.state,
    resume_state: shouldBlock && current.body.state !== "blocked" ? current.body.state : current.body.resume_state,
    waiting_on_questions: waiting,
    lease: releaseLease ? null : current.body.lease,
    updated_at: command.payload.createdAt
  };
}
function recoveryEvidence(tx, task, command) {
  if (command.payload.recoveryEvidenceIds.length === 0) {
    fail5("EVIDENCE_GAP", "lease expiry alone cannot authorize recovery");
  }
  for (const id of command.payload.recoveryEvidenceIds) {
    const record = tx.get("evidence", id);
    if (record?.subject?.kind !== "task" || record.subject.id !== task.id || record.body.kind !== "recovery-reconciliation" || record.body.outcome !== "passed" || record.body.data.stale_lease_token !== task.body.lease.token || record.body.data.disposition !== command.payload.disposition || record.body.data.observed !== command.payload.observed || Date.parse(record.body.created_at) < Date.parse(task.body.lease.expires_at)) {
      fail5(
        "EVIDENCE_GAP",
        `evidence/${id} does not reconcile the stale lease and disposition`
      );
    }
  }
}
function handleAttemptRecover(current, tx, command, authority, runtime) {
  requireActionGrant(tx, command, authority, "attempt.recover");
  if (TASK_TERMINAL_STATES.has(current.body.state)) {
    fail5(
      "INVALID_INPUT",
      `task/${current.id} cannot recover a lease from ${current.body.state}`
    );
  }
  if (current.body.lease === null) {
    fail5("INVALID_INPUT", `task/${current.id} has no lease to recover`);
  }
  if (leaseIsLive(current.body.lease)) {
    fail5("LEASE_CONFLICT", `task/${current.id} lease has not expired`);
  }
  recoveryEvidence(tx, current, command);
  if (tx.get("attempt", command.payload.attemptId) || tx.get("message", command.payload.attemptId)) {
    fail5(
      "OPERATION_CONFLICT",
      `attempt/${command.payload.attemptId} already exists`
    );
  }
  const staleLease = current.body.lease;
  let newLease = null;
  let state = current.body.state;
  let resumeState = current.body.resume_state;
  let nextRole = current.body.next_role;
  let producing = {};
  let recoveryHold2 = current.body.recovery_hold;
  if (command.payload.disposition === "safe-to-resume" && recoveryHold2 !== null) {
    fail5("AUTHORITY_REQUIRED", "operator resolution is required before recovery");
  }
  if (command.payload.disposition === "safe-to-resume" && command.payload.redispatch !== null) {
    assertCurrentAlignment(tx, current, runtime);
    requireNoOpenQuestions(current);
    const dependencies2 = dependencyStatus(tx, current);
    if (dependencies2.failed.length > 0) {
      fail5("RECOVERY_REQUIRED", `task/${current.id} has failed dependencies`);
    }
    if (dependencies2.pending.length > 0) {
      fail5("EVIDENCE_GAP", `task/${current.id} has pending dependencies`);
    }
    if (state === "blocked") {
      requireRestorationAuthority(current, command, authority);
      state = resumeState;
      resumeState = null;
      if (!GRANTABLE_STATES.has(state)) {
        fail5("INVALID_INPUT", "blocked lease has no resumable work state");
      }
    }
    if (TASK_NEEDS_CHANGE_REF.has(state) && current.body.change_ref === null) {
      fail5("EVIDENCE_GAP", `task/${current.id} cannot resume ${state} without an immutable subject`);
    }
    requireRoleAvailable(command.payload.redispatch.role, authority, "recovery recipient");
    if (command.payload.redispatch.role === "operator") {
      fail5("INVALID_INPUT", "operator cannot receive a recovery lease");
    }
    if (Date.parse(command.payload.expiresAt) <= Date.now()) {
      fail5("INVALID_INPUT", "a recovered lease must expire in the future");
    }
    requireNoTouchConflict(tx, current);
    const token = randomUUID();
    newLease = {
      holder: command.payload.redispatch,
      token,
      version_at_grant: current.version,
      acquired_at: command.payload.createdAt,
      expires_at: command.payload.expiresAt
    };
    createPersistedGrant(
      tx,
      current,
      command,
      command.payload.redispatch,
      ["task.update", "task.transition", "task.handoff", "question.open"],
      command.payload.createdAt,
      command.payload.expiresAt,
      token
    );
    nextRole = command.payload.redispatch.role;
    if (state === "in-progress") {
      producing = withProducer(current.body, command.payload.redispatch);
    }
  } else if (command.payload.disposition === "conflicting-partial-work") {
    if (state !== "blocked") {
      resumeState = state;
      state = "blocked";
    }
    nextRole = "operator";
    recoveryHold2 = command.payload.attemptId;
  }
  retireLeaseGrants(tx, current, "recovered");
  tx.put({
    kind: "attempt",
    id: command.payload.attemptId,
    subject: { kind: "task", id: current.id },
    version: 1,
    body: {
      schema_version: 1,
      attempt_id: command.payload.attemptId,
      subject: { kind: "task", id: current.id },
      grantor: command.actor,
      stale_lease: staleLease,
      observed: command.payload.observed,
      disposition: command.payload.disposition,
      recovery_evidence_ids: command.payload.recoveryEvidenceIds,
      new_lease: newLease,
      created_at: command.payload.createdAt
    }
  });
  putMessage(tx, current, command, {
    messageId: command.payload.attemptId,
    parentId: null,
    recipient: command.payload.redispatch?.role ?? (command.payload.disposition === "conflicting-partial-work" ? "operator" : current.body.next_role ?? command.actor.role),
    kind: "recovery",
    createdAt: command.payload.createdAt,
    content: {
      observed: command.payload.observed,
      disposition: command.payload.disposition,
      staleLeaseToken: staleLease.token,
      newLeaseToken: newLease?.token ?? null
    },
    artifactRefs: [],
    evidenceRefs: command.payload.recoveryEvidenceIds,
    provenance: "durable-thread"
  });
  return {
    ...current.body,
    state,
    resume_state: resumeState,
    next_role: nextRole,
    ...producing,
    recovery_hold: recoveryHold2,
    lease: newLease,
    updated_at: command.payload.createdAt
  };
}
var taskHandlers = /* @__PURE__ */ new Map([
  ["task.create", handleTaskCreate],
  ["task.update", handleTaskUpdate],
  ["task.promote", handleTaskPromote],
  ["task.grant", handleTaskGrant],
  ["task.transition", handleTaskTransition],
  ["task.handoff", handleTaskHandoff],
  ["task.restore", handleTaskRestore],
  ["question.open", handleQuestionOpen],
  ["question.answer", handleQuestionAnswer],
  ["attempt.recover", handleAttemptRecover]
]);

// src/core/lib/coordination-runtime/hierarchy-view.mjs
var PACK_ORDER = ["core", "creative", "engineering"];
var TERMINAL_TASK_STATES = /* @__PURE__ */ new Set(["completed", "shipped", "dropped"]);
var SHIP_STATES2 = /* @__PURE__ */ new Set(["release-ready", "deploying", "production-verification"]);
function invalid2(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function gap2(message) {
  throw new RuntimeError("EVIDENCE_GAP", message);
}
function validateInputs(direction, roles) {
  if (direction !== null && direction !== void 0) {
    if (!direction || typeof direction !== "object" || Array.isArray(direction) || typeof direction.path !== "string" || direction.path === "" || typeof direction.hash !== "string" || !/^[0-9a-f]{64}$/i.test(direction.hash) || typeof direction.goal !== "string" || direction.goal === "") {
      invalid2("hierarchy view direction must contain path, SHA-256 hash, and goal");
    }
  }
  if (!Array.isArray(roles) || roles.some((role) => typeof role !== "string" || role === "")) {
    invalid2("hierarchy view roles must be an array of installed role identities");
  }
}
function directionIdentity(direction) {
  return direction === null || direction === void 0 ? null : { path: direction.path, hash: direction.hash, goal: direction.goal };
}
function readerFor(store) {
  const byKind = /* @__PURE__ */ new Map();
  const bySubject = /* @__PURE__ */ new Map();
  const all = (kind) => {
    if (!byKind.has(kind)) byKind.set(kind, listAllRecords(store, { kind }));
    return byKind.get(kind);
  };
  const get = (kind, id) => {
    const loaded = byKind.get(kind);
    if (loaded) return loaded.find((record) => record.id === id) ?? null;
    return readRecord(store, kind, id);
  };
  const subjectRecords = (kind, subject) => {
    const key = `${kind}\0${subject.kind}\0${subject.id}`;
    if (!bySubject.has(key)) bySubject.set(key, listRecords(store, { kind, subject }));
    return bySubject.get(key);
  };
  return { all, get, subjectRecords };
}
function recordSubject(record) {
  return { kind: record.kind, id: record.id };
}
function parentConfig(record) {
  if (record.kind === "epic") {
    return {
      childKind: "feature",
      required: record.body.required_features,
      optional: record.body.optional_features
    };
  }
  if (record.kind === "feature") {
    return {
      childKind: "requirement",
      required: record.body.required_requirements,
      optional: record.body.optional_requirements
    };
  }
  if (record.kind === "requirement") {
    return {
      childKind: "task",
      required: record.body.required_tasks,
      optional: record.body.optional_tasks
    };
  }
  return null;
}
function childSuccessful(record) {
  if (!record) return false;
  if (record.kind === "feature") {
    return record.body.state === "completed" && record.body.completion_disposition === "delivered";
  }
  if (record.kind === "requirement") {
    return record.body.state === "completed" && record.body.completion_disposition === "satisfied";
  }
  if (record.kind === "task") {
    return record.body.delivery_class === "knowledge" ? record.body.state === "completed" : record.body.state === "shipped";
  }
  return record.body.state === "completed";
}
function directChildren(reader, record) {
  const config = parentConfig(record);
  if (!config) return [];
  return [
    ...config.required.map((id) => ({
      required: true,
      record: reader.get(config.childKind, id),
      kind: config.childKind,
      id
    })),
    ...config.optional.map((id) => ({
      required: false,
      record: reader.get(config.childKind, id),
      kind: config.childKind,
      id
    }))
  ];
}
function featureFor(reader, record) {
  if (record.kind === "feature") return record;
  if (record.kind === "requirement" || record.kind === "task") {
    return reader.get("feature", record.body.feature_id);
  }
  return null;
}
function epicFor(reader, record) {
  if (record.kind === "epic") return record;
  const feature = featureFor(reader, record);
  return feature ? reader.get("epic", feature.body.epic_id) : null;
}
function ancestorRecords(reader, record) {
  const ancestors = [];
  const epic = epicFor(reader, record);
  const feature = featureFor(reader, record);
  if (epic && epic.id !== record.id) ancestors.push(epic);
  if (feature && feature.id !== record.id) ancestors.push(feature);
  if (record.kind === "task") {
    for (const id of [...record.body.satisfies].sort()) {
      const requirement = reader.get("requirement", id);
      if (requirement) ancestors.push(requirement);
    }
  }
  return ancestors;
}
function relationshipGap(reader, record) {
  if (record.kind === "epic") return null;
  const feature = featureFor(reader, record);
  if (!feature) {
    return `${record.kind}/${record.id} references a missing Feature`;
  }
  const epic = reader.get("epic", feature.body.epic_id);
  if (!epic || ![...epic.body.required_features, ...epic.body.optional_features].includes(feature.id)) {
    return `feature/${feature.id} is not composed by its current Epic`;
  }
  if (record.kind === "feature") return null;
  if (record.kind === "requirement") {
    if (![...feature.body.required_requirements, ...feature.body.optional_requirements].includes(record.id)) {
      return `requirement/${record.id} is not composed by feature/${feature.id}`;
    }
    return null;
  }
  for (const requirementId of record.body.satisfies) {
    const requirement = reader.get("requirement", requirementId);
    if (!requirement || requirement.body.feature_id !== feature.id || ![...requirement.body.required_tasks, ...requirement.body.optional_tasks].includes(record.id)) {
      return `task/${record.id} has an invalid Requirement relationship`;
    }
  }
  return null;
}
function addReason(reasons, reason2) {
  const key = canonicalJson([
    reason2.code,
    reason2.attention,
    reason2.subject ?? null,
    reason2.message
  ]);
  if (!reasons.some((existing) => existing.key === key)) reasons.push({ ...reason2, key });
}
function publicReasons(reasons) {
  return reasons.map(({ key, ...reason2 }) => reason2);
}
function reason(code, attention, record, message, source = "derived") {
  return {
    code,
    attention,
    subject: record ? recordSubject(record) : null,
    message,
    source
  };
}
function installedRoleGaps(reader, record, roles) {
  const installed = new Set(roles);
  const required = /* @__PURE__ */ new Map();
  const add = (role, responsibility) => {
    if (role === null || role === void 0 || role === "operator" || installed.has(role)) return;
    const responsibilities = required.get(role) ?? /* @__PURE__ */ new Set();
    responsibilities.add(responsibility);
    required.set(role, responsibilities);
  };
  if (record.kind === "task") {
    add(record.body.scope_authority, "scope-authority");
    add(record.body.completion_authority, "completion-authority");
    add(record.body.next_role, "next-role");
    for (const requirement of record.body.review_requirements) {
      add(requirement.role, `review:${requirement.kind}`);
    }
  } else {
    add(record.body.owner, "owner");
    add(record.body.scope_authority, "scope-authority");
    add(record.body.completion_authority, "completion-authority");
    if (record.body.state === "proposed" && (record.kind === "feature" || record.kind === "requirement")) {
      add(activationRole(reader, record), "activation-authority");
    }
  }
  return [...required.entries()].map(([role, responsibilities]) => ({
    role,
    responsibilities: [...responsibilities].sort()
  })).sort((left, right) => left.role.localeCompare(right.role));
}
function directionIsStale(epic, direction) {
  return epic?.body.state !== "completed" && canonicalJson(epic?.body.direction_ref ?? null) !== canonicalJson(directionIdentity(direction));
}
function dependencyEntries(reader, record) {
  if (record.kind === "feature") {
    return record.body.depends_on_features.map((dependency) => {
      const upstream = reader.get("feature", dependency.feature);
      return {
        kind: "feature",
        id: dependency.feature,
        requires: dependency.requires,
        record: upstream,
        satisfied: upstream?.body.state === "completed" && upstream.body.completion_disposition === "delivered"
      };
    });
  }
  if (record.kind === "task") {
    return record.body.depends_on.map((dependency) => {
      const upstream = reader.get("task", dependency.task);
      return {
        kind: "task",
        id: dependency.task,
        requires: dependency.requires,
        record: upstream,
        satisfied: upstream ? taskStateSatisfies(upstream, dependency.requires) : false
      };
    });
  }
  const feature = featureFor(reader, record);
  return feature && feature.id !== record.id ? dependencyEntries(reader, feature) : [];
}
function typedReference(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? { kind: match[1].toLowerCase(), id: match[2] } : null;
}
function currentCriteria(reader, record) {
  try {
    return criteriaRef(record, (kind, id) => reader.get(kind, id));
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "INVALID_INPUT") return null;
    throw error;
  }
}
function currentApprovals(reader, record) {
  const criteria = currentCriteria(reader, record);
  if (criteria === null) return [];
  return effectiveApprovals(
    reader.subjectRecords("approval", recordSubject(record)).map((entry) => entry.body),
    record,
    (kind, id) => reader.get(kind, id)
  );
}
function reviewsSatisfied(reader, task) {
  if (task.body.review_requirements.length === 0) return true;
  const reviews = effectiveReviews(
    reader.subjectRecords("review", recordSubject(task)).map((entry) => entry.body),
    task,
    (kind, id) => reader.get(kind, id)
  );
  return task.body.review_requirements.every((requirement) => reviews.some((review) => review.reviewer.role === requirement.role && review.kind === requirement.kind && review.verdict === "approved"));
}
function parentReadyToClose(reader, record) {
  const children = directChildren(reader, record).filter((child) => child.required);
  return children.length === 0 || children.every((child) => child.record && childSuccessful(child.record));
}
function activationRole(reader, record) {
  if (record.kind === "epic") return record.body.scope_authority;
  if (record.kind === "feature") return epicFor(reader, record)?.body.owner ?? null;
  if (record.kind === "requirement") return featureFor(reader, record)?.body.owner ?? null;
  return record.body.scope_authority;
}
function nextAction(reader, record) {
  if (record.kind !== "task") {
    if (record.body.state === "completed") return null;
    if (record.body.state === "proposed") {
      return { kind: `${record.kind}.activate`, role: activationRole(reader, record) };
    }
    if (parentReadyToClose(reader, record)) {
      return { kind: `${record.kind}.complete`, role: record.body.completion_authority };
    }
    return { kind: "advance-required-children", role: record.body.owner };
  }
  if (TERMINAL_TASK_STATES.has(record.body.state)) return null;
  if (record.body.state === "proposed") {
    return { kind: "task.promote", role: record.body.scope_authority };
  }
  if (record.body.state === "blocked") {
    return { kind: "resolve-task-blockers", role: record.body.next_role };
  }
  if (SHIP_STATES2.has(record.body.state)) {
    return { kind: "human-production-action", role: "operator" };
  }
  return {
    kind: record.body.lease === null ? "task.grant" : "continue-leased-task",
    role: record.body.next_role
  };
}
function deriveAttentionInSnapshot(reader, record, direction, roles) {
  validateHierarchySubject(recordSubject(record), "attention subject");
  const reasons = [];
  const terminal = record.kind === "task" ? TERMINAL_TASK_STATES.has(record.body.state) : record.body.state === "completed";
  if (!terminal) {
    const invalidRelationship = relationshipGap(reader, record);
    if (invalidRelationship) {
      addReason(reasons, reason(
        "missing-evidence",
        "blocked",
        record,
        invalidRelationship
      ));
    }
    const epic = epicFor(reader, record);
    if (!epic) {
      addReason(reasons, reason(
        "missing-evidence",
        "blocked",
        record,
        `${record.kind}/${record.id} has no current Epic ancestor`
      ));
    } else if (directionIsStale(epic, direction)) {
      addReason(reasons, reason(
        "stale-direction",
        "blocked",
        epic,
        `epic/${epic.id} is not aligned to the current Direction`
      ));
    }
    const ancestors = ancestorRecords(reader, record);
    for (const ancestor of ancestors) {
      if (ancestor.body.state !== "active") {
        addReason(reasons, reason(
          "inactive-ancestor",
          "blocked",
          ancestor,
          `${ancestor.kind}/${ancestor.id} is ${ancestor.body.state}, not active`,
          "declared"
        ));
      }
    }
    for (const candidate of [record, ...ancestors]) {
      if (candidate.kind === "task" || candidate.body.hold === null) continue;
      const hold = candidate.body.hold;
      const human = candidate.body.owner === "operator" && candidate.body.scope_authority === "operator";
      addReason(reasons, reason(
        "hold",
        human ? "needs-human" : "blocked",
        candidate,
        hold.reason,
        "declared"
      ));
    }
    for (const dependency of dependencyEntries(reader, record)) {
      if (dependency.satisfied) continue;
      addReason(reasons, reason(
        "unmet-dependency",
        "blocked",
        dependency.record ?? record,
        dependency.record ? `${dependency.kind}/${dependency.id} must reach ${dependency.requires}` : `${dependency.kind}/${dependency.id} is missing`
      ));
    }
    const config = parentConfig(record);
    if (config) {
      for (const child of directChildren(reader, record).filter((entry) => entry.required)) {
        if (!child.record) {
          addReason(reasons, reason(
            "missing-evidence",
            "blocked",
            record,
            `required ${child.kind}/${child.id} is missing`
          ));
        }
      }
    }
    if (record.kind === "task") {
      if (record.body.state === "blocked") {
        addReason(reasons, reason(
          "blocked",
          "blocked",
          record,
          `task/${record.id} records blocked lifecycle`,
          "declared"
        ));
      }
      for (const reference of record.body.context_artifacts) {
        const identity = typedReference(reference);
        if (identity && !reader.get(identity.kind, identity.id)) {
          addReason(reasons, reason(
            "missing-evidence",
            "blocked",
            record,
            `${reference} is not available`
          ));
        }
      }
      if (record.body.recovery_hold !== null) {
        addReason(reasons, reason(
          "recovery-hold",
          "needs-human",
          record,
          `task/${record.id} requires exact operator recovery resolution`
        ));
      }
      if (record.body.state === "in-review" && record.body.completion_authority === "operator" && reviewsSatisfied(reader, record) && !currentApprovals(reader, record).some((approval) => approval.kind === "completion" && approval.authority.role === "operator" && approval.decision === "approved")) {
        addReason(reasons, reason(
          "human-approval",
          "needs-human",
          record,
          `task/${record.id} awaits operator completion approval`
        ));
      }
      if (SHIP_STATES2.has(record.body.state)) {
        addReason(reasons, reason(
          "human-approval",
          "needs-human",
          record,
          `task/${record.id} awaits a human production action`
        ));
      } else if (record.body.next_role === "operator") {
        addReason(reasons, reason(
          "operator-route",
          "needs-human",
          record,
          `task/${record.id} routes its next action to the operator`,
          "declared"
        ));
      }
    } else if (record.body.state === "proposed" && activationRole(reader, record) === "operator") {
      addReason(reasons, reason(
        "human-activation",
        "needs-human",
        record,
        `${record.kind}/${record.id} requires operator activation`
      ));
    } else if (record.body.state === "active" && parentReadyToClose(reader, record) && record.body.completion_authority === "operator") {
      addReason(reasons, reason(
        "human-approval",
        "needs-human",
        record,
        `${record.kind}/${record.id} requires operator completion acceptance`
      ));
    }
    for (const question of reader.subjectRecords("question", recordSubject(record))) {
      if (question.body.status !== "open" || question.body.blocking !== true) continue;
      addReason(reasons, reason(
        question.body.recipient === "operator" ? "operator-question" : "blocking-question",
        question.body.recipient === "operator" ? "needs-human" : "blocked",
        record,
        `question/${question.id} is open for ${question.body.recipient}`,
        "declared"
      ));
    }
  }
  const visible = publicReasons(reasons);
  const value = visible.some((entry) => entry.attention === "needs-human") ? "needs-human" : visible.some((entry) => entry.attention === "blocked") ? "blocked" : "none";
  return {
    value,
    reasons: visible,
    staffing_gaps: terminal ? [] : installedRoleGaps(reader, record, roles),
    next_action: nextAction(reader, record)
  };
}
function statusNode(reader, record, direction, roles, extra = {}) {
  const attention = deriveAttentionInSnapshot(reader, record, direction, roles);
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    title: record.body.title,
    priority: record.body.priority,
    lifecycle: {
      state: record.body.state,
      completion_disposition: record.body.completion_disposition ?? null
    },
    attention,
    ...extra
  };
}
function taskNode(reader, task, direction, roles, required) {
  return statusNode(reader, task, direction, roles, { required });
}
function requirementNode(reader, requirement, direction, roles, required) {
  const tasks = directChildren(reader, requirement).map((child) => child.record ? taskNode(reader, child.record, direction, roles, child.required) : {
    kind: "task",
    id: child.id,
    required: child.required,
    missing: true
  });
  return statusNode(reader, requirement, direction, roles, {
    required,
    rollup: {
      required: tasks.filter((task) => task.required).length,
      required_complete: tasks.filter((task) => task.required && !task.missing && childSuccessful(reader.get("task", task.id))).length,
      optional: tasks.filter((task) => !task.required).length,
      optional_complete: tasks.filter((task) => !task.required && !task.missing && childSuccessful(reader.get("task", task.id))).length
    },
    tasks
  });
}
function featureNode(reader, feature, direction, roles, required) {
  const requirements = directChildren(reader, feature).map((child) => child.record ? requirementNode(reader, child.record, direction, roles, child.required) : {
    kind: "requirement",
    id: child.id,
    required: child.required,
    missing: true
  });
  return statusNode(reader, feature, direction, roles, {
    pack: feature.body.pack,
    required,
    rollup: {
      required: requirements.filter((entry) => entry.required).length,
      required_complete: requirements.filter((entry) => entry.required && !entry.missing && childSuccessful(reader.get("requirement", entry.id))).length,
      optional: requirements.filter((entry) => !entry.required).length,
      optional_complete: requirements.filter((entry) => !entry.required && !entry.missing && childSuccessful(reader.get("requirement", entry.id))).length
    },
    requirements
  });
}
function throughSeq(store) {
  return Number(store.database.prepare(
    "SELECT COALESCE(MAX(seq), 0) AS seq FROM events"
  ).get().seq);
}
function hierarchyStatus(store, { direction, roles }) {
  validateInputs(direction, roles);
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const epics = reader.all("epic").map((epic) => {
      const features = directChildren(reader, epic).map((child) => child.record ? featureNode(reader, child.record, direction, roles, child.required) : {
        kind: "feature",
        id: child.id,
        required: child.required,
        missing: true
      });
      const packs = [...new Set(features.filter((feature) => !feature.missing).map((feature) => feature.pack))].sort((left, right) => PACK_ORDER.indexOf(left) - PACK_ORDER.indexOf(right) || left.localeCompare(right)).map((pack) => {
        const selected = features.filter((feature) => feature.pack === pack);
        return {
          pack,
          rollup: {
            required: selected.filter((feature) => feature.required).length,
            required_complete: selected.filter((feature) => feature.required && childSuccessful(reader.get("feature", feature.id))).length,
            optional: selected.filter((feature) => !feature.required).length,
            optional_complete: selected.filter((feature) => !feature.required && childSuccessful(reader.get("feature", feature.id))).length
          },
          features: selected
        };
      });
      return statusNode(reader, epic, direction, roles, {
        rollup: {
          required: features.filter((feature) => feature.required).length,
          required_complete: features.filter((feature) => feature.required && !feature.missing && childSuccessful(reader.get("feature", feature.id))).length,
          optional: features.filter((feature) => !feature.required).length,
          optional_complete: features.filter((feature) => !feature.required && !feature.missing && childSuccessful(reader.get("feature", feature.id))).length
        },
        packs
      });
    }).sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
    const records = [
      ...reader.all("epic"),
      ...reader.all("feature"),
      ...reader.all("requirement"),
      ...reader.all("task")
    ];
    return {
      schema_version: 1,
      through_seq: throughSeq(store),
      goal: {
        text: direction?.goal ?? null,
        path: direction?.path ?? null,
        hash: direction?.hash ?? null
      },
      totals: {
        records: records.length,
        epics: reader.all("epic").length,
        features: reader.all("feature").length,
        requirements: reader.all("requirement").length,
        tasks: reader.all("task").length,
        terminal: records.filter((record) => record.kind === "task" ? TERMINAL_TASK_STATES.has(record.body.state) : record.body.state === "completed").length
      },
      epics
    };
  });
}
function recordSummary(record) {
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    title: record.body.title,
    state: record.body.state,
    completion_disposition: record.body.completion_disposition ?? null,
    priority: record.body.priority
  };
}
function contextChildren(reader, record) {
  return directChildren(reader, record).map((child) => ({
    ...child.record ? recordSummary(child.record) : {
      kind: child.kind,
      id: child.id,
      missing: true
    },
    required: child.required
  }));
}
function contextDependencies(reader, record) {
  return dependencyEntries(reader, record).map((dependency) => ({
    kind: dependency.kind,
    id: dependency.id,
    requires: dependency.requires,
    satisfied: dependency.satisfied,
    version: dependency.record?.version ?? null,
    state: dependency.record?.body.state ?? null,
    completion_disposition: dependency.record?.body.completion_disposition ?? null
  }));
}
function contextActiveHold(reader, record) {
  const candidates = [];
  if (record.kind !== "task") candidates.push(record);
  if (record.kind === "task") {
    for (const requirementId of [...record.body.satisfies].sort()) {
      const requirement = reader.get("requirement", requirementId);
      if (requirement) candidates.push(requirement);
    }
  }
  const feature = featureFor(reader, record);
  if (feature && feature.id !== record.id) candidates.push(feature);
  const epic = epicFor(reader, record);
  if (epic && epic.id !== record.id) candidates.push(epic);
  const source = candidates.find((candidate) => candidate.body.hold !== null);
  return source ? { source: recordSubject(source), ...source.body.hold } : null;
}
function hierarchyContextExtras(reader, record, direction, roles, basePacket) {
  const attention = deriveAttentionInSnapshot(reader, record, direction, roles);
  return {
    direction: directionIdentity(direction),
    selected_record: record,
    ancestors: ancestorRecords(reader, record).map(recordSummary),
    direct_children: contextChildren(reader, record),
    dependencies: contextDependencies(reader, record),
    authorities: basePacket.authority,
    current_decisions: basePacket.decisions,
    active_hold: contextActiveHold(reader, record),
    attention,
    next_allowed_action: attention.next_action
  };
}
function mergedProjection(projection, extras) {
  const packet = { ...JSON.parse(projection.text), ...extras };
  const text = canonicalJson(packet);
  return {
    throughSeq: projection.throughSeq,
    text,
    bytes: Buffer.byteLength(text, "utf8"),
    references: projection.references,
    historyCursor: projection.historyCursor
  };
}
function hierarchyContext(store, {
  subject,
  maxBytes = DEFAULT_CONTEXT_MAX_BYTES,
  recentLimit = DEFAULT_CONTEXT_RECENT_LIMIT,
  direction,
  roles
}) {
  validateInputs(direction, roles);
  validateHierarchySubject(subject, "context subject");
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const record = reader.get(subject.kind, subject.id);
    if (!record) gap2(`${subject.kind}/${subject.id} does not exist`);
    const required = projectContext(store, {
      subject,
      maxBytes,
      recentLimit: 0
    });
    const requiredPacket = JSON.parse(required.text);
    const extras = hierarchyContextExtras(reader, record, direction, roles, requiredPacket);
    const requiredMerged = mergedProjection(required, extras);
    if (requiredMerged.bytes > maxBytes) {
      throw new RuntimeError(
        "CONTEXT_BUDGET",
        `Required hierarchy context uses ${requiredMerged.bytes} bytes; limit is ${maxBytes}`
      );
    }
    const overhead = requiredMerged.bytes - required.bytes;
    const projection = recentLimit === 0 ? required : projectContext(store, {
      subject,
      maxBytes: maxBytes - overhead,
      recentLimit
    });
    const merged = mergedProjection(projection, extras);
    if (merged.bytes > maxBytes) {
      throw new RuntimeError(
        "CONTEXT_BUDGET",
        `Required hierarchy context uses ${merged.bytes} bytes; limit is ${maxBytes}`
      );
    }
    return merged;
  });
}
function taskCandidates(reader, subject) {
  if (subject.kind === "task") {
    const task = reader.get("task", subject.id);
    return task ? [task] : [];
  }
  if (subject.kind === "requirement") {
    const requirement = reader.get("requirement", subject.id);
    return requirement ? directChildren(reader, requirement).map((child) => child.record).filter(Boolean) : [];
  }
  if (subject.kind === "feature") {
    return reader.all("task").filter((task) => task.body.feature_id === subject.id);
  }
  const featureIds = new Set(reader.all("feature").filter((feature) => feature.body.epic_id === subject.id).map((feature) => feature.id));
  return reader.all("task").filter((task) => featureIds.has(task.body.feature_id));
}
function exclusionReasons(task, attention, selected) {
  const reasons = [];
  const add = (code, message) => {
    if (!reasons.some((entry) => entry.code === code && entry.message === message)) {
      reasons.push({ code, message });
    }
  };
  if (selected.kind === "requirement" && !task.body.satisfies.includes(selected.id)) {
    add("relationship-invalid", `Task does not declare Requirement ${selected.id}`);
  }
  if (task.body.state === "proposed") add("proposed", "Task is still proposed");
  else if (!GRANTABLE_STATES.has(task.body.state)) {
    add(
      TERMINAL_TASK_STATES.has(task.body.state) ? "terminal" : "not-executable",
      `Task lifecycle ${task.body.state} is not executable`
    );
  }
  if (task.body.lease !== null) add("leased", "Task already has a lease");
  for (const entry of attention.reasons) {
    if (entry.attention === "blocked" || (/* @__PURE__ */ new Set(["hold", "stale-direction"])).has(entry.code)) {
      add(entry.code, entry.message);
    }
  }
  if (attention.value === "needs-human") {
    add("needs-human", "Only a human can perform the next action");
  }
  const actionRole = attention.next_action?.role ?? null;
  const blockingStaffing = attention.staffing_gaps.filter((staffing) => staffing.role === actionRole);
  if (blockingStaffing.length > 0) {
    add(
      "staffing-gap",
      `Missing installed role(s): ${blockingStaffing.map((gap3) => gap3.role).join(", ")}`
    );
  }
  return reasons;
}
function taskPlan(store, { subject, direction, roles }) {
  validateInputs(direction, roles);
  validateHierarchySubject(subject, "plan subject");
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const selected = reader.get(subject.kind, subject.id);
    if (!selected) gap2(`${subject.kind}/${subject.id} does not exist`);
    const tasks = [];
    const excluded = [];
    for (const task of taskCandidates(reader, subject).sort((left, right) => left.body.priority - right.body.priority || left.id.localeCompare(right.id))) {
      const attention = deriveAttentionInSnapshot(reader, task, direction, roles);
      const reasons = exclusionReasons(task, attention, selected);
      if (reasons.length > 0) {
        excluded.push({
          kind: "task",
          id: task.id,
          version: task.version,
          state: task.body.state,
          reasons
        });
        continue;
      }
      tasks.push({
        kind: "task",
        id: task.id,
        version: task.version,
        title: task.body.title,
        priority: task.body.priority,
        state: task.body.state,
        next_role: task.body.next_role,
        acceptance: task.body.acceptance,
        attention
      });
    }
    return {
      schema_version: 1,
      through_seq: throughSeq(store),
      subject,
      automatic: false,
      tasks,
      excluded
    };
  });
}

export {
  fail,
  workspaceManifest,
  projectBinding,
  assertWorkspacePath,
  safePath,
  pathPrivacy,
  exactFile,
  exclusiveFile,
  scanExactFile,
  hashArtifact,
  verifySubject,
  retainSubject,
  verifyArtifact,
  verifyTarget,
  matchesAcceptance,
  effectiveReviews,
  effectiveApprovals,
  effectiveEvidence,
  readDetail,
  readMessages,
  bindEvidenceRuntime,
  bindEvidenceTransaction,
  bindEvidenceReadView,
  contextFor,
  privacyRank,
  captureInputBasis,
  artifactInputReferences,
  hasPublicationHistory,
  verifyAssetContent,
  verifyParentCompletionEvidence,
  verifyParentCompletionApproval,
  artifactBasisCurrent,
  subjectArtifact,
  verifyReferences,
  verifyVerdict,
  requireReviews,
  completionApproval,
  requireReleaseEvidence,
  requireOperatorApproval,
  requireDeploymentEvidence,
  recoveryResolution,
  sameActor,
  requireRoleAvailable,
  requireActorAvailable,
  requireHostActionGrant,
  requireNamedAuthority,
  leaseIsLive,
  requireLease,
  requireLeasedActingAuthority,
  requireActingAuthority,
  currentDirectionForStore,
  hasStaleDirection,
  assertAlignedAncestors,
  parentHandlers,
  GRANTABLE_STATES,
  SHIP_STATES,
  taskStateSatisfies,
  taskHandlers,
  hierarchyStatus,
  hierarchyContext,
  taskPlan
};
