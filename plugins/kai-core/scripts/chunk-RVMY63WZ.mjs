import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
  badPath,
  canonicalPath,
  directionPath,
  escapesRoot,
  exactPath,
  inspectPrivateLanes,
  loadWorkspaceRegistry,
  normalized,
  pathHasLink,
  readWorkspaceManifest,
  resolveConfiguredProject,
  resolvedProjectPath,
  validateSchema5Manifest
} from "./chunk-KUPTE65K.mjs";
import {
  HIERARCHY_KINDS,
  RECORD_KINDS,
  RuntimeError,
  canonicalJson,
  commandDigest,
  criteriaRef,
  subjectRef,
  validateCommand,
  validateCommandMutation,
  validateHierarchySubject,
  validateRecord,
  validateSubjectRef
} from "./chunk-XLDNBMDG.mjs";

// src/core/lib/workspace-git-privacy.mjs
import { spawnSync } from "node:child_process";
var PRIVATE_PREFIXES = [".kai/"];
var PRIVATE_FILES = [
  ".kai/core/runtime/activity.jsonl",
  ".kai/core/runtime/activity.jsonl.1",
  ".kai/core/runtime/observed.jsonl",
  ".kai/core/runtime/observed.jsonl.1",
  ".kai/core/runtime/observer-consent",
  ".kai/local.json"
];
var LEGACY_PRIVATE_PREFIXES = [".kai/runs/", ".kai/review/", ".kai/personal/", ".kai/archive/"];
var LEGACY_PRIVATE_FILES = [
  ".kai/activity.jsonl",
  ".kai/activity.jsonl.1",
  ".kai/observed.jsonl",
  ".kai/observed.jsonl.1",
  ".kai/observer-consent",
  ".kai/local.json"
];
function workspaceGit(root, args) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)));
  return spawnSync("git", ["--no-pager", "-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
    env: { ...env, GIT_OPTIONAL_LOCKS: "0" },
    maxBuffer: 16 * 1024 * 1024
  });
}
function inspectGitPrivacy(root, mode, { extraPrivate = [], privateDatabases = false } = {}) {
  const errors = [], warnings = [], missing = [];
  const git = (args) => workspaceGit(root, args);
  const top = git(["rev-parse", "--show-toplevel"]);
  if (top.status !== 0) {
    if (mode !== "external") warnings.push(`placement "${mode}" is not inside a readable git work tree`);
    return { errors, warnings, missing, gitRoot: null };
  }
  const tracked = git(["ls-files", "-z", "--", ".kai"]);
  if (tracked.status !== 0) {
    errors.push("cannot inspect tracked private workspace state");
    return { errors, warnings, missing, gitRoot: canonicalPath(top.stdout.trim()) };
  }
  const paths = tracked.stdout.split("\0").filter(Boolean);
  const privatePaths = mode === "shared" ? [...LEGACY_PRIVATE_PREFIXES, ...LEGACY_PRIVATE_FILES, ...extraPrivate] : [...PRIVATE_PREFIXES, ...PRIVATE_FILES, ...extraPrivate];
  const isPrivate = (path2) => privatePaths.some((p) => p.endsWith("/") ? path2.startsWith(p) : path2 === p);
  const bad = mode === "shared" ? paths.filter((path2) => isPrivate(path2) || privateDatabases && /\.(?:sqlite|sqlite3|db)(?:-(?:wal|shm|journal))?$/i.test(path2)) : paths;
  if (bad.length) errors.push(`placement "${mode}" has tracked private .kai path(s); these must be untracked: ${bad.join(", ")}`);
  const ignored = (path2) => {
    const result = git(["check-ignore", "--no-index", "-q", "--", path2]);
    if (![0, 1].includes(result.status)) errors.push(`cannot inspect Git privacy for ${path2}`);
    return result.status === 0;
  };
  if (mode === "repo-local" || mode === "external") {
    if (!ignored(".kai/")) missing.push(".kai/");
  } else if (mode === "shared") {
    if (ignored(".kai/manifest.json") || ignored(".kai/state/BOARD.md")) {
      errors.push("legacy shared storage requires .kai/manifest.json and .kai/state/ to remain trackable");
    }
    for (const path2 of privatePaths) if (!ignored(path2)) missing.push(path2);
  } else {
    errors.push(`placement must be "repo-local" or "external" (found ${JSON.stringify(mode)})`);
  }
  return { errors, warnings, missing, gitRoot: canonicalPath(top.stdout.trim()) };
}

// src/core/lib/coordination-runtime/evidence-content.mjs
import { createHash } from "node:crypto";
import {
  closeSync,
  fstatSync,
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
  if (m.schema_version === 4) {
    if (!Array.isArray(m.projects)) fail("INVALID_INPUT", "workspace projects must be declared");
    if (m.state !== ".kai/state") fail("INVALID_INPUT", "unsupported workspace state binding");
    return m;
  }
  if (m.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    fail("SCHEMA_MISMATCH", "evidence requires workspace schema 4 or 5");
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
  workspaceManifest(root);
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
  } else if (!/^\.kai\/(?:state|core|engineering|creative)\//.test(path2)) {
    fail("INVALID_INPUT", "private references require a typed .kai pack path; public paths must be project-qualified");
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
function pathPrivacy(root, path2) {
  assertWorkspacePath(root, path2);
  if (path2.startsWith("project:")) return "public";
  if (/\/personal(?:\/|$)/i.test(path2)) return "personal";
  if (/^\.kai\/(core|engineering|creative)\/reports\//.test(path2)) return "public";
  return "internal";
}
function readExactFile(root, path2, read2) {
  const absolute = assertWorkspacePath(root, path2);
  let fd;
  try {
    fd = openSync(absolute, "r");
    const before = fstatSync(fd);
    if (!before.isFile() || before.nlink > 1) fail("INVALID_INPUT", "evidence must be a regular unshared file");
    const { value, size } = read2(fd, before.size);
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

// src/core/lib/coordination-runtime/migration-files.mjs
import {
  closeSync as closeSync2,
  existsSync,
  fstatSync as fstatSync2,
  fsyncSync,
  lstatSync,
  mkdirSync as mkdirSync2,
  openSync as openSync2,
  readFileSync as readFileSync2,
  readdirSync,
  readSync as readSync2,
  writeFileSync as writeFileSync2
} from "node:fs";
import { createHash as createHash2 } from "node:crypto";
import { basename, dirname as dirname2, isAbsolute as isAbsolute2, join as join2, relative, resolve as resolve2 } from "node:path";
var hash2 = (bytes) => createHash2("sha256").update(bytes).digest("hex");
function schema5MigrationLockPath(root) {
  const canonical = canonicalPath(root);
  return join2(
    dirname2(canonical),
    `.${basename(canonical)}.${hash2(canonical).slice(0, 12)}.schema5-migration.lock`
  );
}
function nativeWriterTokenPrefix(root) {
  const canonical = canonicalPath(root);
  return `.${basename(canonical)}.${hash2(canonical).slice(0, 12)}.native-writer-`;
}
function nativeWriterTokenPath(root, id) {
  const canonical = canonicalPath(root);
  return join2(dirname2(canonical), `${nativeWriterTokenPrefix(root)}${id}.lock`);
}
var fail2 = (code, message) => {
  throw new RuntimeError(code, message);
};
var LOCK = ".kai/state/migration.lock";
var DATABASE = ".kai/state/coordination.sqlite";
var MIGRATIONS = ".kai/archive/coordination-migrations";
function logicalStoreDigest(store, {
  excludeMetadata = ["migration_baseline"]
} = {}) {
  const database = store?.database;
  if (!database || typeof database.prepare !== "function") {
    fail2("INVALID_INPUT", "logical store digest requires an open coordination store");
  }
  if (!Array.isArray(excludeMetadata) || excludeMetadata.some((key) => typeof key !== "string")) {
    fail2("INVALID_INPUT", "logical store digest metadata exclusions must be strings");
  }
  const tables = new Set(database.prepare(
    "SELECT name FROM sqlite_master WHERE type = 'table'"
  ).all().map((row) => row.name));
  const result = {
    records: database.prepare(`
      SELECT kind, id, subject_kind, subject_id, version, body
      FROM records ORDER BY kind, id
    `).all(),
    events: database.prepare(`
      SELECT seq, operation_id, subject_kind, subject_id, event_kind, payload,
        message_id, approval_id, question_id, thread_id
      FROM events ORDER BY seq
    `).all(),
    operations: database.prepare(`
      SELECT id, payload_digest, receipt FROM operations ORDER BY id
    `).all()
  };
  if (tables.has("legacy_sources")) {
    result.legacy_sources = database.prepare(
      "SELECT * FROM legacy_sources ORDER BY source_id"
    ).all();
  }
  for (const [table, order] of [
    ["migration_id_map", "source_kind, source_id"],
    ["migration_sources", "path"],
    ["migration_legacy_metadata", "source_key"],
    ["migration_legacy_records", "kind, id"],
    ["migration_legacy_events", "source_seq"],
    ["migration_legacy_operations", "source_id"],
    ["migration_legacy_extra", "table_name, row_index"]
  ]) {
    if (tables.has(table)) {
      result[table] = database.prepare(`SELECT * FROM ${table} ORDER BY ${order}`).all();
    }
  }
  const excluded = new Set(excludeMetadata);
  result.metadata = database.prepare(
    "SELECT key, value FROM metadata ORDER BY key"
  ).all().filter((row) => !excluded.has(row.key));
  return hash2(canonicalJson(result));
}
function safePath(root, name) {
  const path2 = durablePath(name);
  if (!path2.startsWith(".kai/") || path2.startsWith("project:")) fail2("INVALID_INPUT", "migration paths must be private workspace paths");
  const absolute = resolve2(root, ...path2.split("/"));
  if (pathHasLink(root, absolute) || escapesRoot(root, absolute)) fail2("INVALID_INPUT", "migration path traverses a link or escapes the workspace");
  return absolute;
}
function exactFile(root, name) {
  const path2 = safePath(root, name);
  const stat = lstatSync(path2);
  if (!stat.isFile() || stat.nlink !== 1) fail2("RECOVERY_REQUIRED", `not a regular unshared file: ${name}`);
  const fd = openSync2(path2, "r");
  try {
    const before = fstatSync2(fd);
    const bytes = readFileSync2(fd);
    const after = fstatSync2(fd);
    if (stat.ino !== before.ino || stat.dev !== before.dev || before.nlink !== 1 || before.size !== after.size || before.mtimeMs !== after.mtimeMs || bytes.length !== after.size) {
      fail2("RECOVERY_REQUIRED", `file changed while reading: ${name}`);
    }
    return bytes;
  } finally {
    closeSync2(fd);
  }
}
function fileFingerprint(root, name, { prefixBytes = 0 } = {}) {
  const path2 = safePath(root, name);
  const stat = lstatSync(path2);
  if (!stat.isFile() || stat.nlink !== 1) fail2("RECOVERY_REQUIRED", `not a regular unshared file: ${name}`);
  const fd = openSync2(path2, "r");
  try {
    const before = fstatSync2(fd);
    const digest2 = createHash2("sha256");
    const chunk = Buffer.alloc(64 * 1024);
    const prefix = Buffer.alloc(Math.min(prefixBytes, before.size));
    let size = 0, count;
    while ((count = readSync2(fd, chunk, 0, chunk.length, null)) > 0) {
      digest2.update(chunk.subarray(0, count));
      if (size < prefix.length) chunk.copy(prefix, size, 0, Math.min(count, prefix.length - size));
      size += count;
    }
    const after = fstatSync2(fd);
    if (stat.ino !== before.ino || stat.dev !== before.dev || before.nlink !== 1 || after.nlink !== 1 || before.size !== after.size || before.mtimeMs !== after.mtimeMs || size !== after.size) {
      fail2("RECOVERY_REQUIRED", `file changed while reading: ${name}`);
    }
    return { digest: digest2.digest("hex"), size, ...prefixBytes ? { prefix } : {} };
  } finally {
    closeSync2(fd);
  }
}
function exclusiveFile(root, name, bytes) {
  const target = safePath(root, name);
  mkdirSync2(dirname2(target), { recursive: true });
  const fd = openSync2(safePath(root, name), "wx", 384);
  try {
    writeFileSync2(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync2(fd);
  }
}
function migrationManifest(root, versions = [3, 4], env = process.env) {
  if (typeof root !== "string" || !isAbsolute2(root)) fail2("INVALID_INPUT", "explicit absolute workspace root required");
  if (/^(\\\\|\/\/)/.test(root)) fail2("UNSUPPORTED_HOST", "network workspaces are unsupported");
  exactFile(root, ".kai/manifest.json");
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail2("INVALID_INPUT", result.reason);
  const m = result.manifest;
  if (!versions.includes(m.schema_version)) fail2("SCHEMA_MISMATCH", `unsupported workspace schema ${m.schema_version}`);
  if (!["repo-local", "shared", "external"].includes(m.storage_mode) || m.network === true || m.replicated === true || m.storage?.replicated === true || /network|replicated|nfs|smb/i.test(m.filesystem ?? "")) {
    fail2("UNSUPPORTED_HOST", "unsupported network, replicated or unknown workspace storage");
  }
  if (typeof m.workspace_id !== "string" || !m.workspace_id.trim()) fail2("INVALID_INPUT", "workspace identity required");
  if (m.storage_mode === "external" && (typeof m.workspace_root !== "string" || !isAbsolute2(m.workspace_root) || normalized(m.workspace_root) !== normalized(root)) || m.storage_mode !== "external" && m.workspace_root !== ".") fail2("INVALID_INPUT", "workspace_root does not match the selected storage/root binding");
  for (const lane of ["state", "runs", "review", "archive", "personal"]) {
    if (m[lane] !== `.kai/${lane}`) fail2("INVALID_INPUT", `unsupported ${lane} binding`);
  }
  const lanes = inspectPrivateLanes(root, [".kai/state", ".kai/runs", ".kai/review", ".kai/archive", ".kai/personal"]);
  if (lanes.symbolicLinks.length || lanes.gitRoots.length || lanes.unreadable.length) {
    fail2("INVALID_INPUT", "private workspace lanes contain links, nested Git, or unreadable paths");
  }
  if (!Array.isArray(m.projects)) fail2("INVALID_INPUT", "project bindings required");
  const ids = /* @__PURE__ */ new Set();
  for (const project of m.projects) {
    if (!project || !/^[a-z][a-z0-9-]*$/.test(project.id) || ids.has(project.id) || typeof project.path !== "string" || !isAbsolute2(project.path) && project.path !== ".") {
      fail2("INVALID_INPUT", "ambiguous project binding");
    }
    ids.add(project.id);
    if (/^(\\\\|\/\/)/.test(project.path)) fail2("UNSUPPORTED_HOST", "network project unsupported");
    const projectRoot = resolve2(root, project.path);
    if (!existsSync(projectRoot) || pathHasLink(projectRoot, projectRoot)) fail2("INVALID_INPUT", "missing or linked project binding");
    const publication = durablePath(project.publication_root);
    if (publication.startsWith(".kai") || publication.startsWith("project:")) fail2("INVALID_INPUT", "invalid publication binding");
    if (m.storage_mode === "external") {
      if (!escapesRoot(root, projectRoot) || !escapesRoot(projectRoot, root)) fail2("INVALID_INPUT", "external workspace overlaps project");
      const registry = loadWorkspaceRegistry(env);
      if (!registry.ok) fail2("INVALID_INPUT", registry.reason);
      const matches = registry.entries.filter((e) => normalized(e.project_root) === normalized(projectRoot));
      if (matches.length !== 1 || matches[0].workspace_id !== m.workspace_id || normalized(matches[0].workspace_root) !== normalized(root)) fail2("INVALID_INPUT", "external project requires exactly one matching registry binding");
    }
  }
  return m;
}
var privateNames = [
  DATABASE,
  `${DATABASE}-wal`,
  `${DATABASE}-shm`,
  `${DATABASE}-journal`,
  COORDINATION_DATABASE,
  `${COORDINATION_DATABASE}-wal`,
  `${COORDINATION_DATABASE}-shm`,
  `${COORDINATION_DATABASE}-journal`,
  LOCK,
  `${MIGRATIONS}/`,
  ".kai/core/runtime/host/",
  ".kai/state/host/"
];
function privateAdmission(root, { admit = false } = {}) {
  const manifest = readWorkspaceManifest(root);
  if (!manifest.ok) fail2("INVALID_INPUT", manifest.reason);
  const git = (args) => workspaceGit(root, args);
  const placement = manifest.manifest.schema_version === 5 ? manifest.manifest.placement : manifest.manifest.storage_mode;
  const privacy = inspectGitPrivacy(root, placement, { extraPrivate: privateNames, privateDatabases: true });
  if (privacy.errors.length) return { errors: privacy.errors, admitted: [] };
  if (placement === "repo-local" && !privacy.gitRoot) {
    return { errors: ["repo-local placement requires a readable Git work tree"], admitted: [] };
  }
  if (!privacy.gitRoot) return { errors: [], admitted: [] };
  const prefix = relative(privacy.gitRoot, canonicalPath(root)).replaceAll("\\", "/");
  const name = (path3) => prefix ? `${prefix}/${path3}` : path3;
  const ignored = (path3) => git(["check-ignore", "--no-index", "-q", "--", path3]).status === 0;
  const missing = privacy.missing;
  if (!missing.length) return { errors: [], admitted: [] };
  if (!admit) return { errors: missing.map((path3) => `private SQLite/runtime path must be ignored: ${path3}`), admitted: [] };
  const exclude = git(["rev-parse", "--git-path", "info/exclude"]);
  if (exclude.status !== 0) fail2("RECOVERY_REQUIRED", "cannot resolve private Git exclude metadata");
  const path2 = resolve2(root, exclude.stdout.trim());
  if (pathHasLink(dirname2(path2), path2)) fail2("INVALID_INPUT", "Git exclude metadata is linked");
  if (existsSync(path2) && (!lstatSync(path2).isFile() || lstatSync(path2).nlink !== 1)) fail2("INVALID_INPUT", "Git exclude metadata is shared or nonregular");
  mkdirSync2(dirname2(path2), { recursive: true });
  const literal = (text) => text.replace(/[\\*?[\]#! ]/g, (c) => `\\${c}`);
  const bytes = `
# kai private coordination runtime
${missing.map((p) => `/${literal(name(p))}`).join("\n")}
`;
  const fd = openSync2(path2, "a", 384);
  try {
    writeFileSync2(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync2(fd);
  }
  const remaining = missing.filter((p) => !ignored(p));
  return { errors: remaining.map((p) => `privacy admission failed: ${p}`), admitted: missing };
}
function sourceSnapshot(root) {
  const files = [];
  function walk(name) {
    if (name === LOCK || name === MIGRATIONS || name === DATABASE || name.startsWith(`${DATABASE}-`) || name.toLowerCase() === ".kai/state/host" || name.toLowerCase().startsWith(".kai/state/host/") || name.toLowerCase() === ".kai/core/runtime/host" || name.toLowerCase().startsWith(".kai/core/runtime/host/")) return;
    const path2 = safePath(root, name);
    const stat = lstatSync(path2);
    if (stat.isDirectory()) {
      for (const child of readdirSync(path2).sort()) walk(`${name}/${child}`);
    } else {
      const { digest: digest2, size, prefix } = fileFingerprint(root, name, { prefixBytes: 16 });
      if (/(?:-wal|-shm|-journal)$/i.test(name) || (prefix.toString("latin1") === "SQLite format 3\0" || /\.(sqlite|sqlite3|db)$/i.test(name)) && ["-wal", "-shm", "-journal"].some((suffix) => existsSync(safePath(root, `${name}${suffix}`)))) {
        fail2("UNSUPPORTED_HOST", `SQLite evidence with live/unreconciled sidecars requires offline reconciliation: ${name}`);
      }
      files.push({ path: name, digest: digest2, size });
    }
  }
  for (const child of readdirSync(join2(root, ".kai")).sort()) walk(`.kai/${child}`);
  return files;
}
function sameSnapshot(expected, actual) {
  if (canonicalJson(expected) !== canonicalJson(actual)) fail2("RECOVERY_REQUIRED", "source fingerprint/write set changed; preserve user edits and reconcile offline");
}

// src/core/lib/direction.mjs
import { createHash as createHash3 } from "node:crypto";
import { readFileSync as readFileSync3 } from "node:fs";
import { basename as basename2, join as join3, posix as path } from "node:path";
var SECTION_ORDER = [
  ["Vision", "vision"],
  ["Mission", "mission"],
  ["Current Goal", "currentGoal"],
  ["Out of Scope", "outOfScope"]
];
var decoder = new TextDecoder("utf-8", { fatal: true });
function fail3(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function exactDirectionFile(publicationRoot) {
  return path.join(publicationRoot, basename2(directionPath()));
}
function parseTopLevelSections(markdown) {
  const headings = [];
  let inFence = false;
  let fenceChar = null;
  let fenceSize = 0;
  const lines = markdown.matchAll(/.*?(?:\r\n|\n|\r|$)/g);
  for (const match of lines) {
    const line = match[0];
    const start = match.index ?? 0;
    if (!line && start === markdown.length) break;
    const content = line.replace(/[\r\n]+$/, "");
    const fence = /^[ \t]*(`{3,}|~{3,})/.exec(content);
    if (fence) {
      const marker = fence[1];
      if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceSize = marker.length;
      } else if (marker[0] === fenceChar && marker.length >= fenceSize) {
        inFence = false;
        fenceChar = null;
        fenceSize = 0;
      }
      continue;
    }
    if (inFence) continue;
    const heading = /^# ([^\r\n]+?)\s*$/.exec(content);
    if (!heading) continue;
    headings.push({
      title: heading[1],
      bodyStart: start + line.length,
      start
    });
  }
  if (headings.length !== SECTION_ORDER.length) {
    fail3("INVALID_DIRECTION", "direction must contain exactly Vision, Mission, Current Goal, and Out of Scope once each");
  }
  const sections = {};
  for (const [index, [expectedTitle, key]] of SECTION_ORDER.entries()) {
    if (headings[index].title !== expectedTitle) {
      fail3("INVALID_DIRECTION", "direction headings must appear exactly once in the required order");
    }
    const bodyEnd = headings[index + 1]?.start ?? markdown.length;
    const body = markdown.slice(headings[index].bodyStart, bodyEnd).trim();
    if (!body) fail3("INVALID_DIRECTION", `${expectedTitle} must have a non-empty body`);
    sections[key] = body;
  }
  return sections;
}
function readDirection({ workspaceRoot, manifest, projectId }) {
  const project = resolveConfiguredProject({ workspaceRoot, manifest, projectId });
  const relativePath = exactDirectionFile(project.publicationRoot);
  const absolutePath = join3(project.projectRoot, ...relativePath.split("/"));
  let bytes;
  try {
    if (pathHasLink(project.projectRoot, absolutePath) || !exactPath(absolutePath)) {
      fail3("PATH_ESCAPE", `${relativePath} must resolve without link or case aliases`);
    }
    bytes = readFileSync3(absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") fail3("DIRECTION_REQUIRED", `coordinated work requires ${relativePath}`);
    if (error?.code === "PATH_ESCAPE") throw error;
    throw error;
  }
  let markdown;
  try {
    markdown = decoder.decode(bytes);
  } catch {
    fail3("INVALID_DIRECTION", `${relativePath} must be valid UTF-8`);
  }
  const sections = parseTopLevelSections(markdown);
  return {
    path: relativePath,
    hash: createHash3("sha256").update(bytes).digest("hex"),
    goal: sections.currentGoal,
    sections,
    bytes
  };
}

// src/core/lib/coordination-runtime/workspace-guard.mjs
import { existsSync as existsSync2, lstatSync as lstatSync2 } from "node:fs";
import { dirname as dirname3, join as join4, resolve as resolve3 } from "node:path";
var fail4 = (code, message) => {
  throw new RuntimeError(code, message);
};
function readWorkspaceContract(root, {
  env = process.env,
  versions = [3, 4, WORKSPACE_SCHEMA_VERSION]
} = {}) {
  root = resolve3(root);
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail4("INVALID_INPUT", result.reason);
  const manifest = result.manifest;
  if (!versions.includes(manifest.schema_version)) {
    fail4("SCHEMA_MISMATCH", `unsupported workspace schema ${manifest.schema_version}`);
  }
  if (manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    return migrationManifest(root, versions.filter((version) => version !== WORKSPACE_SCHEMA_VERSION), env);
  }
  if (pathHasLink(root, result.path)) fail4("INVALID_INPUT", "workspace manifest cannot traverse links");
  const validation = validateSchema5Manifest(root, manifest, { env });
  if (validation.errors.length) fail4("INVALID_INPUT", validation.errors.join("; "));
  try {
    readDirection({ workspaceRoot: root, manifest });
  } catch (error) {
    fail4(error.code ?? "INVALID_INPUT", error.message);
  }
  return manifest;
}
function assertWorkspaceWrite(path2, {
  privateCheck = true,
  requirePrivate = false,
  env = process.env
} = {}) {
  path2 = resolve3(path2);
  const runtime = dirname3(path2);
  const core = dirname3(runtime);
  const privateRoot = dirname3(core);
  const root = dirname3(privateRoot);
  const expected = resolve3(root, ...COORDINATION_DATABASE.split("/"));
  if ((process.platform === "win32" ? path2.toLowerCase() : path2) !== (process.platform === "win32" ? expected.toLowerCase() : expected)) {
    fail4(
      "SCHEMA_MISMATCH",
      "coordination writes require the exact schema-5 database; schema 3/4 and standalone stores are read-only"
    );
  }
  const manifest = join4(root, ".kai", "manifest.json");
  if (!existsSync2(manifest)) fail4("SCHEMA_MISMATCH", "workspace coordination writes require a schema 5 manifest");
  if (pathHasLink(root, manifest) || !exactPath(manifest) || !lstatSync2(manifest).isFile()) {
    fail4("INVALID_INPUT", "coordination manifest must be an exact unlinked regular file");
  }
  const parsed = readWorkspaceContract(root, {
    env,
    versions: [WORKSPACE_SCHEMA_VERSION]
  });
  if (!existsSync2(path2)) fail4("SCHEMA_MISMATCH", "schema-5 coordination database is missing");
  if (pathHasLink(root, path2) || !exactPath(path2) || !lstatSync2(path2).isFile()) {
    fail4("INVALID_INPUT", "coordination database must be the exact unlinked schema-5 regular file");
  }
  if (existsSync2(join4(runtime, "migration.lock"))) {
    fail4("RECOVERY_REQUIRED", "offline migration/rollback lock prevents coordinated work");
  }
  if (existsSync2(schema5MigrationLockPath(root))) {
    fail4("RECOVERY_REQUIRED", "incomplete schema-5 migration prevents coordinated work");
  }
  if (privateCheck && requirePrivate) {
    const privacy = inspectGitPrivacy(root, parsed.placement);
    const errors = [...privacy.errors, ...privacy.missing.map((name) => `private workspace path must be ignored: ${name}`)];
    if (parsed.placement === "repo-local" && !privacy.gitRoot) {
      errors.push("repo-local placement requires a readable Git work tree");
    }
    if (errors.length) fail4("INVALID_INPUT", errors.join("; "));
  }
}

// src/core/lib/coordination-runtime/store.mjs
import { existsSync as existsSync3, mkdirSync as mkdirSync3, statSync } from "node:fs";
import { dirname as dirname4 } from "node:path";
import { DatabaseSync } from "node:sqlite";
var SCHEMA_VERSION = 2;
var HISTORICAL_SCHEMA_VERSION = 1;
var MESSAGE_SCHEMA_VERSION = 1;
var STORE_MODES = /* @__PURE__ */ new Set(["create", "read", "write"]);
var MESSAGE_COMMANDS = /* @__PURE__ */ new Set([
  "task.handoff",
  "question.open",
  "question.answer",
  "attempt.recover"
]);
var EVENTS_TABLE_SQL = `CREATE TABLE events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL,
  subject_kind TEXT,
  subject_id TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  event_kind TEXT GENERATED ALWAYS AS (json_extract(payload, '$.kind')) STORED NOT NULL,
  message_id TEXT GENERATED ALWAYS AS (
    CASE json_extract(payload, '$.kind')
      WHEN 'attempt.recover' THEN json_extract(payload, '$.payload.attemptId')
      WHEN 'question.open' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'question.answer' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'task.handoff' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'epic.message' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'feature.message' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'requirement.message' THEN json_extract(payload, '$.payload.messageId')
    END
  ) STORED,
  approval_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'approval.record'
      THEN json_extract(payload, '$.payload.body.approval_id') END
  ) STORED,
  question_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'question.open'
      THEN json_extract(payload, '$.payload.questionId') END
  ) STORED,
  thread_id TEXT,
  CHECK ((subject_kind IS NULL) = (subject_id IS NULL))
)`;
var REQUIRED_INDEX_SQL = [
  "CREATE INDEX records_by_subject ON records(kind, subject_kind, subject_id)",
  `CREATE INDEX records_by_question_status ON records(subject_kind, subject_id, json_extract(body, '$.status'))
    WHERE kind = 'question'`,
  `CREATE INDEX records_by_criteria ON records(kind, subject_kind, subject_id, json_extract(body, '$.criteria_ref'))`,
  `CREATE INDEX events_by_thread ON events(thread_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_message ON events(message_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_subject_messages ON events(subject_kind, subject_id, seq)
    WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_subject_kind ON events(subject_kind, subject_id, event_kind, seq, question_id)`,
  `CREATE INDEX events_by_approval ON events(approval_id, seq) WHERE approval_id IS NOT NULL`
];
var REQUIRED_TRIGGER_SQL = [
  `CREATE TRIGGER events_capture_thread AFTER INSERT ON events
    WHEN NEW.message_id IS NOT NULL
    BEGIN
      UPDATE events SET thread_id = COALESCE(
        (SELECT json_extract(body, '$.thread_id') FROM records
          WHERE kind = 'message' AND id = NEW.message_id), NEW.thread_id, NEW.subject_id)
      WHERE seq = NEW.seq;
    END`,
  `CREATE TRIGGER messages_capture_thread AFTER INSERT ON records
    WHEN NEW.kind = 'message'
    BEGIN
      UPDATE events SET thread_id = json_extract(NEW.body, '$.thread_id')
      WHERE message_id = NEW.id;
    END`,
  `CREATE TRIGGER messages_update_thread AFTER UPDATE OF body ON records
    WHEN NEW.kind = 'message'
    BEGIN
      UPDATE events SET thread_id = json_extract(NEW.body, '$.thread_id')
      WHERE message_id = NEW.id;
    END`
];
var REQUIRED_TABLES = /* @__PURE__ */ new Set(["metadata", "records", "events", "operations"]);
var REQUIRED_COLUMNS = /* @__PURE__ */ new Map([
  ["metadata", [
    ["key", "TEXT", 0, null, 1],
    ["value", "TEXT", 1, null, 0]
  ]],
  ["records", [
    ["kind", "TEXT", 1, null, 1],
    ["id", "TEXT", 1, null, 2],
    ["subject_kind", "TEXT", 0, null, 0],
    ["subject_id", "TEXT", 0, null, 0],
    ["version", "INTEGER", 1, null, 0],
    ["body", "TEXT", 1, null, 0]
  ]],
  ["events", [
    ["seq", "INTEGER", 0, null, 1],
    ["operation_id", "TEXT", 1, null, 0],
    ["subject_kind", "TEXT", 0, null, 0],
    ["subject_id", "TEXT", 0, null, 0],
    ["payload", "TEXT", 1, null, 0],
    ["event_kind", "TEXT", 1, null, 0, 3],
    ["message_id", "TEXT", 0, null, 0, 3],
    ["approval_id", "TEXT", 0, null, 0, 3],
    ["question_id", "TEXT", 0, null, 0, 3],
    ["thread_id", "TEXT", 0, null, 0]
  ]],
  ["operations", [
    ["id", "TEXT", 0, null, 1],
    ["payload_digest", "TEXT", 1, null, 0],
    ["receipt", "TEXT", 1, null, 0]
  ]]
]);
var REQUIRED_TABLE_SQL = /* @__PURE__ */ new Map([
  [
    "metadata",
    "create table metadata(key text primary key,value text not null)"
  ],
  [
    "records",
    "create table records(kind text not null,id text not null,subject_kind text,subject_id text,version integer not null check(version>0),body text not null check(json_valid(body)),primary key(kind,id),check((subject_kind is null)=(subject_id is null)))"
  ],
  ["events", normalizeSchemaSql(EVENTS_TABLE_SQL)],
  [
    "operations",
    "create table operations(id text primary key,payload_digest text not null,receipt text not null check(json_valid(receipt)))"
  ]
]);
var SCHEMA = `
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE records (
  kind TEXT NOT NULL, id TEXT NOT NULL,
  subject_kind TEXT, subject_id TEXT,
  version INTEGER NOT NULL CHECK (version > 0),
  body TEXT NOT NULL CHECK (json_valid(body)),
  PRIMARY KEY (kind, id),
  CHECK ((subject_kind IS NULL) = (subject_id IS NULL))
);
${EVENTS_TABLE_SQL};
CREATE TABLE operations (
  id TEXT PRIMARY KEY, payload_digest TEXT NOT NULL,
  receipt TEXT NOT NULL CHECK (json_valid(receipt))
);
${[...REQUIRED_INDEX_SQL, ...REQUIRED_TRIGGER_SQL].join(";\n")};
`;
var HISTORICAL_EVENTS_TABLE_SQL = `CREATE TABLE events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL, item_id TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  event_kind TEXT GENERATED ALWAYS AS (json_extract(payload, '$.kind')) STORED,
  message_id TEXT GENERATED ALWAYS AS (
    CASE json_extract(payload, '$.kind')
      WHEN 'attempt.recover' THEN json_extract(payload, '$.payload.attemptId')
      WHEN 'question.open' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'question.answer' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'item.handoff' THEN json_extract(payload, '$.payload.messageId')
    END
  ) STORED,
  approval_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'approval.record'
      THEN json_extract(payload, '$.payload.body.approval_id') END
  ) STORED,
  question_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'question.open'
      THEN json_extract(payload, '$.payload.questionId') END
  ) STORED,
  thread_id TEXT
)`;
var HISTORICAL_INDEX_SQL = [
  "CREATE INDEX records_by_item ON records(kind, item_id)",
  `CREATE INDEX records_by_question_status ON records(item_id, json_extract(body, '$.status'))
    WHERE kind = 'question'`,
  `CREATE INDEX records_by_criteria ON records(kind, item_id, json_extract(body, '$.criteria_ref'))`,
  `CREATE INDEX events_by_thread ON events(thread_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_message ON events(message_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_item_kind ON events(item_id, event_kind, seq, question_id)`,
  `CREATE INDEX events_by_approval ON events(approval_id, seq) WHERE approval_id IS NOT NULL`
];
var HISTORICAL_TRIGGER_SQL = [
  `CREATE TRIGGER events_capture_thread AFTER INSERT ON events
    WHEN NEW.message_id IS NOT NULL
    BEGIN
      UPDATE events SET thread_id = COALESCE(
        (SELECT json_extract(body, '$.thread_id') FROM records
          WHERE kind = 'message' AND id = NEW.message_id), NEW.item_id)
      WHERE seq = NEW.seq;
    END`,
  ...REQUIRED_TRIGGER_SQL.slice(1)
];
var HISTORICAL_COLUMNS = /* @__PURE__ */ new Map([
  ["metadata", REQUIRED_COLUMNS.get("metadata")],
  ["records", [
    ["kind", "TEXT", 1, null, 1],
    ["id", "TEXT", 1, null, 2],
    ["item_id", "TEXT", 0, null, 0],
    ["version", "INTEGER", 1, null, 0],
    ["body", "TEXT", 1, null, 0]
  ]],
  ["events", [
    ["seq", "INTEGER", 0, null, 1],
    ["operation_id", "TEXT", 1, null, 0],
    ["item_id", "TEXT", 0, null, 0],
    ["payload", "TEXT", 1, null, 0],
    ["event_kind", "TEXT", 0, null, 0, 3],
    ["message_id", "TEXT", 0, null, 0, 3],
    ["approval_id", "TEXT", 0, null, 0, 3],
    ["question_id", "TEXT", 0, null, 0, 3],
    ["thread_id", "TEXT", 0, null, 0]
  ]],
  ["operations", REQUIRED_COLUMNS.get("operations")]
]);
var HISTORICAL_TABLE_SQL = /* @__PURE__ */ new Map([
  ["metadata", REQUIRED_TABLE_SQL.get("metadata")],
  [
    "records",
    "create table records(kind text not null,id text not null,item_id text,version integer not null check(version>0),body text not null check(json_valid(body)),primary key(kind,id))"
  ],
  ["events", normalizeSchemaSql(HISTORICAL_EVENTS_TABLE_SQL)],
  ["operations", REQUIRED_TABLE_SQL.get("operations")]
]);
function invalid(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function recovery(message) {
  throw new RuntimeError("RECOVERY_REQUIRED", message);
}
function isSqliteError(error) {
  return error?.code === "ERR_SQLITE_ERROR" && Number.isInteger(error?.errcode);
}
function translateSqliteError(error) {
  if (error instanceof RuntimeError) return error;
  if (isSqliteError(error) && (error.errcode === 5 || error.errcode === 6)) {
    const busy = new RuntimeError("STORE_BUSY", "coordination store is busy", true);
    busy.cause = error;
    return busy;
  }
  return error;
}
function runSqlite(operation) {
  try {
    return operation();
  } catch (error) {
    throw translateSqliteError(error);
  }
}
function assertStore(store) {
  if (!store || typeof store !== "object" || !(store.database instanceof DatabaseSync)) {
    invalid("store must be an open coordination store");
  }
  if (store.closed) invalid("coordination store is closed");
}
function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch {
    recovery(`${label} contains invalid JSON`);
  }
}
function validateStoreSubject(subject, label, {
  allowNull = true,
  allowUndefined = false,
  allowLegacyItem = false
} = {}) {
  if (subject === void 0 && allowUndefined) return subject;
  if (subject === null && allowNull) return subject;
  if (!subject || typeof subject !== "object" || Array.isArray(subject)) {
    invalid(`${label} must be a typed subject${allowNull ? " or null" : ""}`);
  }
  if (canonicalJson(Object.keys(subject).sort()) !== '["id","kind"]') {
    invalid(`${label} must contain only kind and id`);
  }
  if (allowLegacyItem && subject.kind === "item") {
    if (typeof subject.id !== "string" || subject.id === "") {
      invalid(`${label}.id must be a non-empty string`);
    }
  } else {
    validateHierarchySubject(subject, label);
  }
  return subject;
}
function validateHistoricalRecord(record) {
  if (record.kind === "item" || record.kind === "initiative") return validateRecord(record);
  if (!record.body || typeof record.body !== "object" || Array.isArray(record.body) || record.body.schema_version !== 1 || record.subject?.kind !== "item" || record.body.item_id !== record.subject.id) {
    recovery(`historical record ${record.kind}/${record.id} has an invalid Item binding`);
  }
  const identityKeys = /* @__PURE__ */ new Map([
    ["artifact", "artifact_id"],
    ["asset", "asset_id"],
    ["question", "question_id"],
    ["attempt", "attempt_id"],
    ["host-attempt", "attempt_id"],
    ["effect", "effect_id"],
    ["evidence", "evidence_id"],
    ["review", "review_id"],
    ["approval", "approval_id"],
    ["message", "message_id"],
    ["grant", "grant_id"]
  ]);
  const identityKey = identityKeys.get(record.kind);
  if (!identityKey || record.body[identityKey] !== record.id) {
    recovery(`historical record ${record.kind}/${record.id} has an invalid identity`);
  }
  return record;
}
function decodeRecord(row, store = null) {
  if (!row) return null;
  const record = {
    kind: row.kind,
    id: row.id,
    subject: row.subject_kind === null ? null : { kind: row.subject_kind, id: row.subject_id },
    version: row.version,
    body: parseJson(row.body, `record ${row.kind}/${row.id}`)
  };
  try {
    if (store?.schemaVersion === HISTORICAL_SCHEMA_VERSION) {
      return validateHistoricalRecord(record);
    }
    return validateRecord(record);
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "INVALID_INPUT") {
      recovery(`record ${row.kind}/${row.id} is malformed: ${error.message}`);
    }
    throw error;
  }
}
function recordProjection(store, alias = "") {
  const prefix = alias ? `${alias}.` : "";
  if (store.schemaVersion === HISTORICAL_SCHEMA_VERSION) {
    return `${prefix}kind, ${prefix}id,
      CASE WHEN ${prefix}item_id IS NULL THEN NULL ELSE 'item' END AS subject_kind,
      ${prefix}item_id AS subject_id, ${prefix}version, ${prefix}body`;
  }
  return `${prefix}kind, ${prefix}id, ${prefix}subject_kind, ${prefix}subject_id,
    ${prefix}version, ${prefix}body`;
}
function subjectFilter(store, subject, alias = "") {
  validateStoreSubject(subject, "record subject", {
    allowLegacyItem: store.schemaVersion === HISTORICAL_SCHEMA_VERSION
  });
  const prefix = alias ? `${alias}.` : "";
  if (store.schemaVersion === HISTORICAL_SCHEMA_VERSION) {
    if (subject === null) return { sql: `${prefix}item_id IS NULL`, params: [] };
    if (subject.kind !== "item") return { sql: "0 = 1", params: [] };
    return { sql: `${prefix}item_id = ?`, params: [subject.id] };
  }
  if (subject === null) {
    return {
      sql: `${prefix}subject_kind IS NULL AND ${prefix}subject_id IS NULL`,
      params: []
    };
  }
  return {
    sql: `${prefix}subject_kind = ? AND ${prefix}subject_id = ?`,
    params: [subject.kind, subject.id]
  };
}
function matchingSubjects(store, leftAlias, rightAlias) {
  if (store.schemaVersion === HISTORICAL_SCHEMA_VERSION) {
    return `${leftAlias}.item_id IS ${rightAlias}.item_id`;
  }
  return `${leftAlias}.subject_kind IS ${rightAlias}.subject_kind
    AND ${leftAlias}.subject_id IS ${rightAlias}.subject_id`;
}
function readSubjectRecord(store, kind, id, subject) {
  const filter = subjectFilter(store, subject);
  const row = runSqlite(() => store.database.prepare(`
    SELECT ${recordProjection(store)}
    FROM records
    WHERE kind = ? AND id = ? AND ${filter.sql}
  `).get(kind, id, ...filter.params));
  return decodeRecord(row, store);
}
function validateReceipt(receipt, operationId) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt) || receipt.ok !== true || receipt.operationId !== operationId || !Number.isSafeInteger(receipt.recordVersion) || !Number.isSafeInteger(receipt.eventSeq) || !receipt.data || typeof receipt.data !== "object" || Array.isArray(receipt.data)) {
    recovery(`operation ${operationId} has a malformed receipt`);
  }
  return receipt;
}
function normalizeSchemaSql(sql) {
  const literals = [];
  return sql.replace(/'(?:''|[^'])*'/g, (literal) => {
    literals.push(literal);
    return `@literal${literals.length - 1}@`;
  }).toLowerCase().replace(/["`\[\]]/g, "").replace(/\s+/g, " ").replace(/\s*([(),>])\s*/g, "$1").trim().replace(/@literal(\d+)@/g, (_, index) => literals[Number(index)]);
}
function validatePhysicalSchema(database, {
  columns,
  tableSql,
  indexSql,
  triggerSql
}) {
  for (const [table, expectedColumns] of columns) {
    const columns2 = runSqlite(() => database.prepare(`PRAGMA table_xinfo(${table})`).all());
    const actualColumns = columns2.map((column) => [
      column.name,
      column.type,
      column.notnull,
      column.dflt_value,
      column.pk,
      column.hidden
    ]);
    const expected = expectedColumns.map((column) => column.length === 5 ? [...column, 0] : column);
    if (canonicalJson(actualColumns) !== canonicalJson(expected)) {
      recovery(`coordination database table "${table}" has an unsupported column layout`);
    }
    const row = runSqlite(() => database.prepare(`
      SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?
    `).get(table));
    const normalizedSql = normalizeSchemaSql(row?.sql ?? "");
    if (normalizedSql !== tableSql.get(table)) {
      recovery(`coordination database table "${table}" has unsupported constraints`);
    }
  }
  for (const definition of [...indexSql, ...triggerSql]) {
    const [, type, name] = /^CREATE (INDEX|TRIGGER) (\w+)/.exec(definition);
    const row = runSqlite(() => database.prepare(
      "SELECT sql FROM sqlite_master WHERE type = ? AND name = ?"
    ).get(type.toLowerCase(), name));
    if (!row || normalizeSchemaSql(row.sql) !== normalizeSchemaSql(definition)) {
      recovery(`coordination database ${type.toLowerCase()} "${name}" is missing or unsupported`);
    }
  }
}
function validateSchema(database, expectedVersion) {
  const quickCheck = runSqlite(() => database.prepare("PRAGMA quick_check").get());
  if (!quickCheck || quickCheck.quick_check !== "ok") {
    recovery("coordination database integrity check failed");
  }
  const tableRows = runSqlite(() => database.prepare(`
    SELECT name FROM sqlite_master WHERE type = 'table'
  `).all());
  const tables = new Set(tableRows.map((row) => row.name));
  for (const table of REQUIRED_TABLES) {
    if (!tables.has(table)) recovery(`coordination database is missing table "${table}"`);
  }
  const metadata = runSqlite(() => database.prepare(
    "SELECT value FROM metadata WHERE key = 'schema_version'"
  ).get());
  if (!metadata) recovery("coordination database has no schema version");
  if (metadata.value !== String(expectedVersion)) {
    throw new RuntimeError(
      "SCHEMA_MISMATCH",
      `coordination database schema ${JSON.stringify(metadata.value)} is unsupported; expected ${expectedVersion}`
    );
  }
  validatePhysicalSchema(database, expectedVersion === HISTORICAL_SCHEMA_VERSION ? {
    columns: HISTORICAL_COLUMNS,
    tableSql: HISTORICAL_TABLE_SQL,
    indexSql: HISTORICAL_INDEX_SQL,
    triggerSql: HISTORICAL_TRIGGER_SQL
  } : {
    columns: REQUIRED_COLUMNS,
    tableSql: REQUIRED_TABLE_SQL,
    indexSql: REQUIRED_INDEX_SQL,
    triggerSql: REQUIRED_TRIGGER_SQL
  });
  const messageMetadata = runSqlite(() => database.prepare(
    "SELECT value FROM metadata WHERE key = 'message_schema_version'"
  ).get());
  if (!messageMetadata) recovery("coordination database has no message schema version");
  if (messageMetadata.value !== String(MESSAGE_SCHEMA_VERSION)) {
    throw new RuntimeError(
      "SCHEMA_MISMATCH",
      `coordination message schema ${JSON.stringify(messageMetadata.value)} is unsupported; expected ${MESSAGE_SCHEMA_VERSION}`
    );
  }
  if (expectedVersion === HISTORICAL_SCHEMA_VERSION) {
    const impossible = runSqlite(() => database.prepare(`
      SELECT kind FROM records
      WHERE kind IN ('epic', 'feature', 'requirement', 'task')
      ORDER BY kind, id
      LIMIT 1
    `).get());
    if (impossible) {
      recovery(`historical schema 1 cannot contain ${impossible.kind} records`);
    }
  }
}
function initializeSchema(database) {
  runSqlite(() => database.exec("BEGIN IMMEDIATE"));
  try {
    runSqlite(() => database.exec(SCHEMA));
    runSqlite(() => database.prepare(
      "INSERT INTO metadata (key, value) VALUES ('schema_version', ?)"
    ).run(String(SCHEMA_VERSION)));
    runSqlite(() => database.prepare(
      "INSERT INTO metadata (key, value) VALUES ('message_schema_version', ?)"
    ).run(String(MESSAGE_SCHEMA_VERSION)));
    runSqlite(() => database.exec("COMMIT"));
  } catch (error) {
    runSqlite(() => database.exec("ROLLBACK"));
    throw error;
  }
}
function openStoreConnection({
  path: path2,
  mode,
  expectedVersion,
  initialize = false
}) {
  if (typeof path2 !== "string" || path2.trim() === "") invalid("store path must be a string");
  const existed = existsSync3(path2);
  if (!initialize && !existed) {
    recovery(`coordination database does not exist at ${path2}`);
  }
  if (initialize) mkdirSync3(dirname4(path2), { recursive: true });
  let database;
  try {
    database = new DatabaseSync(path2, { readOnly: mode === "read" });
    runSqlite(() => database.exec("PRAGMA busy_timeout=1000"));
    const shouldInitialize = initialize && (!existed || statSync(path2).size === 0);
    if (shouldInitialize) initializeSchema(database);
    validateSchema(database, expectedVersion);
    return {
      database,
      path: path2,
      mode,
      schemaVersion: expectedVersion,
      closed: false
    };
  } catch (error) {
    try {
      database?.close();
    } catch {
    }
    const translated = translateSqliteError(error);
    if (translated instanceof RuntimeError) throw translated;
    throw new RuntimeError(
      "RECOVERY_REQUIRED",
      `cannot open coordination database: ${translated.message}`
    );
  }
}
function openStore({ path: path2, mode }) {
  if (!STORE_MODES.has(mode)) invalid(`unsupported store mode "${mode}"`);
  return openStoreConnection({
    path: path2,
    mode,
    expectedVersion: SCHEMA_VERSION,
    initialize: mode === "create"
  });
}
function openHistoricalStore({
  path: path2,
  expectedStoreVersion,
  mode = "read"
}) {
  if (mode !== "read") invalid("historical coordination stores are read-only");
  if (expectedStoreVersion !== HISTORICAL_SCHEMA_VERSION) {
    invalid(`unsupported historical store schema "${expectedStoreVersion}"`);
  }
  return openStoreConnection({
    path: path2,
    mode,
    expectedVersion: expectedStoreVersion
  });
}
function closeStore(store) {
  if (!store || typeof store !== "object" || store.closed) return;
  try {
    store.database.close();
  } finally {
    store.closed = true;
  }
}
function readRecord(store, kind, id) {
  assertStore(store);
  if (!RECORD_KINDS.has(kind)) invalid(`unsupported record kind "${kind}"`);
  if (typeof id !== "string" || id === "") invalid("record id must be a string");
  const row = runSqlite(() => store.database.prepare(`
    SELECT ${recordProjection(store)}
    FROM records
    WHERE kind = ? AND id = ?
  `).get(kind, id));
  return decodeRecord(row, store);
}
function listRecords(store, options) {
  assertStore(store);
  if (!options || typeof options !== "object" || Array.isArray(options) || Object.keys(options).some((key) => !["kind", "subject"].includes(key))) {
    invalid("record list options must contain only kind and subject");
  }
  const { kind, subject = void 0 } = options;
  if (!RECORD_KINDS.has(kind)) invalid(`unsupported record kind "${kind}"`);
  validateStoreSubject(subject, "record subject", {
    allowNull: true,
    allowUndefined: true,
    allowLegacyItem: store.schemaVersion === HISTORICAL_SCHEMA_VERSION
  });
  const rows = runSqlite(() => {
    if (subject === void 0) {
      return store.database.prepare(`
        SELECT ${recordProjection(store)}
        FROM records
        WHERE kind = ?
        ORDER BY id
      `).all(kind);
    }
    const filter = subjectFilter(store, subject);
    return store.database.prepare(`
      SELECT ${recordProjection(store)}
      FROM records
      WHERE kind = ? AND ${filter.sql}
      ORDER BY id
    `).all(kind, ...filter.params);
  });
  return rows.map((row) => decodeRecord(row, store));
}
function listAllRecords(store, { kind }) {
  return listRecords(store, { kind });
}
function readStoreSummary(store) {
  return readSnapshot(store, () => runSqlite(() => {
    const throughSeq = Number(store.database.prepare("SELECT COALESCE(MAX(seq), 0) AS seq FROM events").get().seq);
    const taskCount = Number(store.database.prepare("SELECT COUNT(*) AS count FROM records WHERE kind = 'task'").get().count);
    return { throughSeq, taskCount };
  }));
}
var activeReadSnapshots = /* @__PURE__ */ new WeakSet();
function readSnapshot(store, read2) {
  assertStore(store);
  if (typeof read2 !== "function") invalid("snapshot reader must be a function");
  if (activeReadSnapshots.has(store)) return read2();
  let inTransaction = false;
  try {
    runSqlite(() => store.database.exec("BEGIN DEFERRED"));
    inTransaction = true;
    activeReadSnapshots.add(store);
    const result = read2();
    if (result && typeof result.then === "function") invalid("snapshot readers must be synchronous");
    runSqlite(() => store.database.exec("COMMIT"));
    inTransaction = false;
    return result;
  } catch (error) {
    if (inTransaction) {
      try {
        runSqlite(() => store.database.exec("ROLLBACK"));
      } catch (rollbackError) {
        const errors = [error, rollbackError];
        const closeError = invalidateStore(store);
        if (closeError) errors.push(closeError);
        const failure = new RuntimeError(
          "RECOVERY_REQUIRED",
          `read snapshot failed and rollback could not be confirmed: ${error.message}; rollback failed: ${rollbackError.message}`
        );
        failure.cause = new AggregateError(errors, "coordination read snapshot and rollback both failed");
        throw failure;
      }
    }
    throw error;
  } finally {
    activeReadSnapshots.delete(store);
  }
}
function referencedRecordId(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? { kind: match[1].toLowerCase(), id: match[2] } : null;
}
function readSubjectView(store, options) {
  assertStore(store);
  if (!options || typeof options !== "object" || Array.isArray(options) || Object.keys(options).some((key) => !["subject", "recentLimit"].includes(key))) {
    invalid("subject view options must contain only subject and recentLimit");
  }
  const { subject, recentLimit } = options;
  validateStoreSubject(subject, "context subject", { allowNull: false });
  if (!Number.isSafeInteger(recentLimit) || recentLimit < 0 || recentLimit > 8) {
    invalid("context recentLimit must be an integer from 0 through 8");
  }
  return readSnapshot(store, () => {
    const throughSeq = Number(runSqlite(() => store.database.prepare(
      "SELECT COALESCE(MAX(seq), 0) AS seq FROM events"
    ).get()).seq);
    const record = readRecord(store, subject.kind, subject.id);
    if (!record) {
      return {
        throughSeq,
        record: null,
        dependencies: [],
        questions: [],
        recoveryHold: null,
        approvals: [],
        recentMessages: [],
        latestHandoff: null,
        messageCount: 0,
        referencedDetails: []
      };
    }
    const dependencies = (record.kind === "task" ? record.body.depends_on : []).map((dependency) => ({
      dependency,
      record: readRecord(
        store,
        "task",
        dependency.task
      )
    }));
    const chronology = (column, id) => {
      const filter = subjectFilter(store, subject);
      const row = runSqlite(() => store.database.prepare(`
        SELECT seq FROM events WHERE ${column} = ? AND ${filter.sql} AND seq <= ?
        ORDER BY seq DESC LIMIT 1
      `).get(id, ...filter.params, throughSeq));
      return row ? Number(row.seq) : null;
    };
    const eventFilter = subjectFilter(store, subject, "e");
    const missingQuestion = runSqlite(() => store.database.prepare(`
      SELECT e.question_id FROM events e
      LEFT JOIN records r ON r.kind = 'question' AND r.id = e.question_id
        AND ${matchingSubjects(store, "r", "e")}
      WHERE ${eventFilter.sql} AND e.event_kind = 'question.open' AND e.seq <= ?
        AND e.question_id IS NOT NULL AND r.id IS NULL
      LIMIT 1
    `).get(...eventFilter.params, throughSeq));
    if (missingQuestion) {
      throw new RuntimeError("EVIDENCE_GAP", `question/${missingQuestion.question_id} referenced by an opening event is missing`);
    }
    const questionFilter = subjectFilter(store, subject);
    const questionIndex = store.schemaVersion === HISTORICAL_SCHEMA_VERSION ? "records_by_question_status" : "records_by_question_status";
    const questionRecords = runSqlite(() => store.database.prepare(`
      SELECT ${recordProjection(store)} FROM records INDEXED BY ${questionIndex}
      WHERE kind = 'question' AND ${questionFilter.sql}
        AND json_extract(body, '$.status') = 'open'
    `).all(...questionFilter.params)).map((row) => decodeRecord(row, store));
    const questionsById = new Map(questionRecords.map((record2) => [record2.id, record2]));
    for (const id of record.body.waiting_on_questions ?? []) {
      if (!questionsById.has(id)) {
        questionsById.set(id, readSubjectRecord(store, "question", id, subject));
      }
    }
    const questions = [...questionsById.values()].map((record2) => ({
      record: record2,
      eventSeq: record2 ? chronology("message_id", record2.body.opened_message_id) : null,
      openedMessage: record2 ? readSubjectRecord(store, "message", record2.body.opened_message_id, subject) : null,
      answerMessages: record2 ? record2.body.answer_message_ids.map((id) => readSubjectRecord(store, "message", id, subject)) : []
    }));
    const approvalFilter = subjectFilter(store, subject);
    const approvals = runSqlite(() => store.database.prepare(`
      SELECT ${recordProjection(store)} FROM records
      WHERE kind = 'approval' AND ${approvalFilter.sql}
        AND json_extract(body, '$.criteria_ref') = ?
    `).all(...approvalFilter.params, criteriaRef(record, (kind, id) => readRecord(store, kind, id)))).map((row) => {
      const record2 = decodeRecord(row, store);
      return { record: record2, eventSeq: chronology("approval_id", record2.id) };
    });
    const recoveryHoldId = record.body.recovery_hold ?? null;
    const recoveryHold = recoveryHoldId === null ? null : {
      record: readSubjectRecord(store, "attempt", recoveryHoldId, subject),
      eventSeq: chronology("message_id", recoveryHoldId),
      message: readSubjectRecord(store, "message", recoveryHoldId, subject)
    };
    const threadId = subjectRef(subject, record.version);
    const recentMessages = messageRows(store, threadId, throughSeq + 1, recentLimit, subject).map((row) => ({ eventSeq: Number(row.seq), record: decodeMessageRow(row, store) })).reverse();
    const handoffFilter = subjectFilter(store, subject, "e");
    const handoffRow = runSqlite(() => store.database.prepare(`
      SELECT e.seq, e.message_id, ${recordProjection(store, "r")}
      FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
        AND ${matchingSubjects(store, "r", "e")}
      WHERE ${handoffFilter.sql}
        AND e.event_kind = 'task.handoff'
        AND json_extract(r.body, '$.basis_version') = ?
        AND e.seq <= ?
      ORDER BY e.seq DESC LIMIT 1
    `).get(...handoffFilter.params, record.version, throughSeq));
    const latestHandoff = handoffRow ? {
      eventSeq: Number(handoffRow.seq),
      record: decodeMessageRow(handoffRow, store)
    } : null;
    const messageCountFilter = subjectFilter(store, subject);
    const messageCount = Number(runSqlite(() => store.database.prepare(`
      SELECT COUNT(*) AS count FROM events
      WHERE thread_id = ? AND ${messageCountFilter.sql}
        AND message_id IS NOT NULL AND seq <= ?
    `).get(threadId, ...messageCountFilter.params, throughSeq)).count);
    const references = new Set(record.body.context_artifacts ?? []);
    for (const { record: record2 } of approvals) {
      record2.body.evidence_refs.forEach((reference) => references.add(reference));
    }
    for (const { record: record2 } of recentMessages) {
      if (!record2) continue;
      record2.body.artifact_refs.forEach((reference) => references.add(reference));
      record2.body.evidence_refs.forEach((reference) => references.add(reference));
    }
    if (latestHandoff?.record) {
      latestHandoff.record.body.artifact_refs.forEach((reference) => references.add(reference));
      latestHandoff.record.body.evidence_refs.forEach((reference) => references.add(reference));
    }
    for (const { openedMessage, answerMessages } of questions) {
      for (const message of [openedMessage, ...answerMessages]) {
        if (!message) continue;
        message.body.artifact_refs.forEach((reference) => references.add(reference));
        message.body.evidence_refs.forEach((reference) => references.add(reference));
      }
    }
    for (const id of recoveryHold?.record?.body.recovery_evidence_ids ?? []) {
      references.add(`evidence:${id}`);
    }
    const referencedDetails = [];
    for (const reference of references) {
      const identity = referencedRecordId(reference);
      if (identity) {
        referencedDetails.push({
          reference,
          record: readRecord(store, identity.kind, identity.id)
        });
      }
    }
    return {
      throughSeq,
      record,
      dependencies,
      questions,
      recoveryHold,
      approvals,
      recentMessages,
      latestHandoff,
      messageCount,
      referencedDetails
    };
  });
}
function messageRows(store, threadId, beforeSeq, limit, subject = void 0) {
  const filter = subject === void 0 ? { sql: "1 = 1", params: [] } : subjectFilter(store, subject, "e");
  return runSqlite(() => store.database.prepare(`
    SELECT e.seq, e.message_id, ${recordProjection(store, "r")}
    FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
      AND ${matchingSubjects(store, "r", "e")}
    WHERE e.thread_id = ? AND ${filter.sql}
      AND e.message_id IS NOT NULL AND e.seq < ?
    ORDER BY e.seq DESC LIMIT ?
  `).all(threadId, ...filter.params, beforeSeq, limit));
}
function decodeMessageRow(row, store) {
  if (row.id === null) {
    throw new RuntimeError(
      "EVIDENCE_GAP",
      `message/${row.message_id} referenced by event ${row.seq} is missing`
    );
  }
  return decodeRecord(row, store);
}
function readMessagePage(store, {
  subject,
  threadId,
  basisVersion,
  beforeSeq = null,
  limit
}) {
  assertStore(store);
  validateStoreSubject(subject, "message subject", { allowNull: false });
  if (typeof threadId !== "string" || threadId !== subjectRef(subject, basisVersion)) {
    invalid("message thread must bind the requested typed subject and basis version");
  }
  if (!Number.isSafeInteger(basisVersion) || basisVersion < 1) {
    invalid("message basis version must be a positive safe integer");
  }
  if (beforeSeq !== null && (!Number.isSafeInteger(beforeSeq) || beforeSeq < 1)) {
    invalid("message beforeSeq must be a positive safe integer or null");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    invalid("message limit must be an integer from 1 through 100");
  }
  return readSnapshot(store, () => {
    const rows = messageRows(
      store,
      threadId,
      beforeSeq ?? Number.MAX_SAFE_INTEGER,
      limit + 1,
      subject
    );
    const messages = rows.map((row) => {
      const record = decodeMessageRow(row, store);
      if (record.body.thread_id !== threadId || record.body.basis_version !== basisVersion) {
        throw new RuntimeError(
          "EVIDENCE_GAP",
          `message/${record.id} does not belong to ${threadId}`
        );
      }
      return { ...record, eventSeq: Number(row.seq) };
    }).slice(0, limit);
    const hasMore = rows.length > limit;
    const nextCursor = hasMore ? {
      subject,
      threadId,
      basisVersion,
      beforeSeq: messages.at(-1).eventSeq
    } : null;
    return { messages, hasMore, nextCursor };
  });
}
function readOperationReceipt(store, command) {
  assertStore(store);
  validateCommand(command);
  const row = runSqlite(() => store.database.prepare(
    "SELECT payload_digest, receipt FROM operations WHERE id = ?"
  ).get(command.operationId));
  if (!row) return null;
  if (row.payload_digest !== commandDigest(command)) {
    throw new RuntimeError("OPERATION_CONFLICT", `operation ${command.operationId} was already used with a different command`);
  }
  return validateReceipt(parseJson(row.receipt, `operation ${command.operationId} receipt`), command.operationId);
}
function readMessageOperation(store, messageId) {
  assertStore(store);
  if (typeof messageId !== "string" || messageId === "") {
    invalid("message id must be a string");
  }
  const row = runSqlite(() => store.database.prepare(`
    SELECT e.operation_id, e.payload, o.receipt
    FROM events e
    JOIN operations o ON o.id = e.operation_id
    WHERE json_extract(e.payload, '$.payload.messageId') = ?
    ORDER BY e.seq
    LIMIT 1
  `).get(messageId));
  if (!row) return null;
  return {
    operationId: row.operation_id,
    event: parseJson(row.payload, `message/${messageId} event`),
    receipt: validateReceipt(
      parseJson(row.receipt, `operation ${row.operation_id} receipt`),
      row.operation_id
    )
  };
}
function writeRecord(database, record) {
  const current = runSqlite(() => database.prepare(`
    SELECT version FROM records WHERE kind = ? AND id = ?
  `).get(record.kind, record.id));
  if (!current) {
    if (record.version !== 1) {
      throw new RuntimeError(
        "VERSION_CONFLICT",
        `new record ${record.kind}/${record.id} must begin at version 1`
      );
    }
    runSqlite(() => database.prepare(`
      INSERT INTO records (kind, id, subject_kind, subject_id, version, body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      record.kind,
      record.id,
      record.subject?.kind ?? null,
      record.subject?.id ?? null,
      record.version,
      canonicalJson(record.body)
    ));
    return;
  }
  if (record.version !== current.version + 1) {
    throw new RuntimeError(
      "VERSION_CONFLICT",
      `record ${record.kind}/${record.id} expected next version ${current.version + 1}, received ${record.version}`
    );
  }
  const outcome = runSqlite(() => database.prepare(`
    UPDATE records
    SET subject_kind = ?, subject_id = ?, version = ?, body = ?
    WHERE kind = ? AND id = ? AND version = ?
  `).run(
    record.subject?.kind ?? null,
    record.subject?.id ?? null,
    record.version,
    canonicalJson(record.body),
    record.kind,
    record.id,
    current.version
  ));
  if (outcome.changes !== 1) {
    throw new RuntimeError(
      "VERSION_CONFLICT",
      `record ${record.kind}/${record.id} changed during update`
    );
  }
}
function snapshotJson(value) {
  return JSON.parse(canonicalJson(value));
}
function invalidateStore(store) {
  let closeError;
  try {
    store.database.close();
  } catch (error) {
    closeError = error;
  } finally {
    store.closed = true;
  }
  return closeError;
}
function rollbackOperation(store, operationError) {
  try {
    runSqlite(() => store.database.exec("ROLLBACK"));
  } catch (rollbackError) {
    const errors = [operationError, rollbackError];
    const closeError = invalidateStore(store);
    if (closeError) errors.push(closeError);
    const failure = new RuntimeError(
      "RECOVERY_REQUIRED",
      `operation failed and rollback could not be confirmed: ${operationError.message}; rollback failed: ${rollbackError.message}`
    );
    failure.cause = new AggregateError(
      errors,
      "coordination operation and rollback both failed"
    );
    throw failure;
  }
}
function applyOperation(store, command, mutate) {
  assertStore(store);
  if (store.mode === "read") invalid("read-only coordination store cannot apply operations");
  assertWorkspaceWrite(store.path, { privateCheck: false });
  const internalCommand = snapshotJson(command);
  validateCommand(internalCommand);
  if (typeof mutate !== "function") invalid("operation mutate callback must be a function");
  const digest2 = commandDigest(internalCommand);
  let inTransaction = false;
  try {
    runSqlite(() => store.database.exec("BEGIN IMMEDIATE"));
    inTransaction = true;
    assertWorkspaceWrite(store.path);
    const legacy = store.database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='legacy_sources'").get();
    if (legacy && store.database.prepare(
      "SELECT source_id FROM legacy_sources WHERE kind=? AND declared_id=? AND status IN ('quarantined','archived') LIMIT 1"
    ).get(internalCommand.recordKind, internalCommand.recordId)) {
      throw new RuntimeError("EVIDENCE_GAP", "legacy identity is quarantined; use explicit authorized revalidation, not a new runtime record");
    }
    if (legacy && internalCommand.expectedVersion === 0 && ["item", "initiative"].includes(internalCommand.recordKind) && store.database.prepare(`SELECT source_id FROM legacy_sources
        WHERE status='quarantined' AND
          ((kind=? AND declared_id IS NULL) OR json_extract(parsed,'$.identityUnresolved')=1) LIMIT 1`).get(internalCommand.recordKind)) {
      throw new RuntimeError("EVIDENCE_GAP", "unresolved legacy identity prevents new records until explicit source reconciliation");
    }
    const receipt = readOperationReceipt(store, internalCommand);
    if (receipt) {
      runSqlite(() => store.database.exec("COMMIT"));
      inTransaction = false;
      return receipt;
    }
    const primaryBaseline = readRecord(
      store,
      internalCommand.recordKind,
      internalCommand.recordId
    );
    const actualVersion = primaryBaseline?.version ?? 0;
    if (actualVersion !== internalCommand.expectedVersion) {
      throw new RuntimeError(
        "VERSION_CONFLICT",
        `record ${internalCommand.recordKind}/${internalCommand.recordId} is version ${actualVersion}; expected ${internalCommand.expectedVersion}`
      );
    }
    const callbackCurrent = primaryBaseline === null ? null : snapshotJson(primaryBaseline);
    const primarySubject = primaryBaseline?.subject ?? (HIERARCHY_KINDS.has(internalCommand.recordKind) || internalCommand.recordKind === "initiative" ? null : ["attempt.start", "effect.intent"].includes(internalCommand.kind) ? { kind: "task", id: internalCommand.payload.taskId } : null);
    const eventSubject = HIERARCHY_KINDS.has(internalCommand.recordKind) ? { kind: internalCommand.recordKind, id: internalCommand.recordId } : primarySubject;
    let eventSeq = 0;
    let appendedEvents = 0;
    let transactionAvailable = true;
    const requireTransaction = () => {
      if (!transactionAvailable) {
        invalid("transaction methods are only available during mutate");
      }
    };
    const appendEvent = (payload) => {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        invalid("event payload must be an object");
      }
      const outcome = runSqlite(() => store.database.prepare(`
        INSERT INTO events (operation_id, subject_kind, subject_id, payload)
        VALUES (?, ?, ?, ?)
      `).run(
        internalCommand.operationId,
        eventSubject?.kind ?? null,
        eventSubject?.id ?? null,
        canonicalJson(payload)
      ));
      appendedEvents += 1;
      eventSeq = Number(outcome.lastInsertRowid);
      return eventSeq;
    };
    const tx = {
      get(kind, id) {
        requireTransaction();
        return readRecord(store, kind, id);
      },
      list(kind, subject = void 0) {
        requireTransaction();
        return listRecords(store, { kind, subject });
      },
      put(record) {
        requireTransaction();
        validateRecord(record);
        if (record.kind === internalCommand.recordKind && record.id === internalCommand.recordId) {
          invalid("mutate must return the primary record body instead of putting it");
        }
        writeRecord(store.database, record);
      },
      appendEvent(payload) {
        requireTransaction();
        return appendEvent(payload);
      }
    };
    let nextBody;
    try {
      nextBody = mutate(callbackCurrent, tx);
    } finally {
      transactionAvailable = false;
    }
    if (nextBody && typeof nextBody.then === "function") {
      invalid("operation mutate callback must be synchronous");
    }
    validateCommandMutation(internalCommand, primaryBaseline, nextBody);
    const unchangedPrimary = primaryBaseline !== null && !MESSAGE_COMMANDS.has(internalCommand.kind) && canonicalJson(nextBody) === canonicalJson(primaryBaseline.body);
    const primary = unchangedPrimary ? primaryBaseline : validateRecord({
      kind: internalCommand.recordKind,
      id: internalCommand.recordId,
      subject: primarySubject,
      version: internalCommand.expectedVersion + 1,
      body: nextBody
    });
    if (!unchangedPrimary) writeRecord(store.database, primary);
    if (appendedEvents === 0) {
      eventSeq = appendEvent({
        kind: internalCommand.kind,
        actor: internalCommand.actor,
        recordKind: internalCommand.recordKind,
        recordId: internalCommand.recordId,
        payload: internalCommand.payload
      });
    }
    const accepted = {
      ok: true,
      operationId: internalCommand.operationId,
      recordVersion: primary.version,
      eventSeq,
      data: { record: primary }
    };
    runSqlite(() => store.database.prepare(`
      INSERT INTO operations (id, payload_digest, receipt)
      VALUES (?, ?, ?)
    `).run(internalCommand.operationId, digest2, canonicalJson(accepted)));
    runSqlite(() => store.database.exec("COMMIT"));
    inTransaction = false;
    return accepted;
  } catch (error) {
    if (inTransaction) {
      rollbackOperation(store, error);
    }
    throw error;
  }
}

// src/core/lib/activity.mjs
import {
  appendFileSync,
  readFileSync as readFileSync4,
  existsSync as existsSync4,
  lstatSync as lstatSync3,
  mkdirSync as mkdirSync4,
  renameSync,
  statSync as statSync2
} from "node:fs";
import { join as join5, dirname as dirname5 } from "node:path";
var LOG_REL = ".kai/core/runtime/activity.jsonl";
var LEGACY_LOG_REL = ".kai/activity.jsonl";
var EVENTS = /* @__PURE__ */ new Set(["start", "progress", "stop"]);
var OUTCOMES = /* @__PURE__ */ new Set(["handoff", "done", "blocked", "abandoned"]);
var FORBIDDEN_FIELDS = /* @__PURE__ */ new Set([
  "state",
  "resume_state",
  "verdict",
  "review",
  "completed_reviews",
  "review_requirements",
  "change_ref",
  "version",
  "lease",
  "decision",
  "approved"
]);
var ROLE_RE = /^[a-z0-9-]{1,60}$/;
var TASK_RE = /^(?:core|engineering|creative):task:[a-z0-9]+(?:-[a-z0-9]+)*$/;
var LEGACY_ITEM_RE = /^[a-z0-9-]{1,80}$/;
var RUN_RE = /^[a-z0-9]{6,16}$/;
var MAX_NOTE = 120;
var MAX_LINE = 1024;
var MAX_BYTES = 512 * 1024;
function digest(input) {
  let h1 = 2166136261, h2 = 16777619;
  const s = String(input);
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + s.charCodeAt(i) + 1, 2246822507) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, 12);
}
var ABSOLUTE = /(^|[\s"'(=])([A-Za-z]:[\\/]|\/(?:home|Users|root|mnt|var|tmp|etc)\b|\\\\|~[\\/])/;
function looksAbsolute(s) {
  return typeof s === "string" && ABSOLUTE.test(s);
}
function safeNote(note) {
  if (typeof note !== "string") return null;
  const flat = note.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (!flat) return null;
  if (looksAbsolute(flat)) return null;
  return flat.length > MAX_NOTE ? `${flat.slice(0, MAX_NOTE - 1)}~` : flat;
}
function buildRecord(input, now = Date.now()) {
  if (!input || typeof input !== "object") return { ok: false, reason: "record must be an object" };
  for (const k of Object.keys(input)) {
    if (FORBIDDEN_FIELDS.has(k)) {
      return { ok: false, reason: `field "${k}" belongs to the Task record, not the activity log` };
    }
  }
  const e = String(input.e || "").trim();
  if (!EVENTS.has(e)) return { ok: false, reason: `unknown event "${e}"` };
  const role = String(input.role || "").trim();
  if (!ROLE_RE.test(role)) return { ok: false, reason: "role must be a kebab-case role id" };
  const task = input.task == null ? null : String(input.task).trim();
  if (task !== null && !TASK_RE.test(task)) {
    return { ok: false, reason: 'task must be a typed "<pack>:task:<slug>" identity' };
  }
  const run = String(input.run || "").trim();
  if (!RUN_RE.test(run)) return { ok: false, reason: "run must be a short opaque id" };
  const nowSec = Math.floor(now / 1e3);
  const rec = {
    t: input.t != null ? Math.floor(Number(input.t)) : nowSec,
    src: "declared",
    e,
    role,
    run
  };
  if (!Number.isFinite(rec.t)) return { ok: false, reason: "t must be an epoch-seconds integer" };
  if (task) rec.task = task;
  if (e === "stop") {
    const outcome = String(input.outcome || "").trim();
    if (!OUTCOMES.has(outcome)) return { ok: false, reason: `unknown outcome "${outcome}"` };
    rec.outcome = outcome;
  }
  if (input.next_report_by != null) {
    const by = Math.floor(Number(input.next_report_by));
    if (!Number.isFinite(by)) return { ok: false, reason: "next_report_by must be an epoch-seconds integer" };
    rec.next_report_by = by;
  } else if (e !== "stop") {
    return { ok: false, reason: "start and progress must declare next_report_by" };
  }
  const note = safeNote(input.note);
  if (note) rec.note = note;
  const line = JSON.stringify(rec);
  if (line.length > MAX_LINE) return { ok: false, reason: "record exceeds the line bound" };
  if (looksAbsolute(line)) return { ok: false, reason: "record contains a filesystem path" };
  return { ok: true, record: rec, line };
}
function logPath(root) {
  return join5(root, LOG_REL);
}
function activityWorkspaceAdmission(root, env = process.env) {
  let store;
  try {
    const manifest = readWorkspaceContract(root, {
      env,
      versions: [WORKSPACE_SCHEMA_VERSION]
    });
    const privacy = inspectGitPrivacy(root, manifest.placement);
    const errors = [
      ...privacy.errors,
      ...privacy.missing.map((path2) => `private workspace path must be ignored: ${path2}`)
    ];
    if (manifest.placement === "repo-local" && !privacy.gitRoot) {
      errors.push("repo-local placement requires a readable Git work tree");
    }
    if (errors.length) return { ok: false, reason: errors.join("; ") };
    const database = join5(root, ...COORDINATION_DATABASE.split("/"));
    if (!existsSync4(database)) {
      return { ok: false, reason: `coordination database is missing at ${COORDINATION_DATABASE}` };
    }
    if (pathHasLink(root, database) || !exactPath(database) || !lstatSync3(database).isFile()) {
      return {
        ok: false,
        reason: `coordination database must be an exact unlinked regular file at ${COORDINATION_DATABASE}`
      };
    }
    store = openStore({ path: database, mode: "read" });
    return { ok: true, manifest };
  } catch (error) {
    return { ok: false, reason: `${error.code ?? "INVALID_INPUT"}: ${error.message}` };
  } finally {
    closeStore(store);
  }
}
function rotate(file) {
  try {
    if (!existsSync4(file)) return;
    if (statSync2(file).size < MAX_BYTES) return;
    renameSync(file, `${file}.1`);
  } catch {
  }
}
function append(root, input, now = Date.now(), env = process.env) {
  const built = buildRecord(input, now);
  if (!built.ok) return built;
  const admitted = activityWorkspaceAdmission(root, env);
  if (!admitted.ok) return admitted;
  const file = logPath(root);
  if (escapesRoot(root, file) || pathHasLink(root, file)) {
    return { ok: false, reason: "activity path traverses a link or escapes the workspace" };
  }
  try {
    mkdirSync4(dirname5(file), { recursive: true });
    rotate(file);
    appendFileSync(file, `${built.line}
`);
    return { ok: true, record: built.record };
  } catch (err) {
    return { ok: false, reason: `append failed: ${err.code || "unknown"}` };
  }
}
function readable(r, { legacy = false } = {}) {
  if (!r || typeof r !== "object") return false;
  if (!EVENTS.has(r.e)) return false;
  if (typeof r.run !== "string" || !RUN_RE.test(r.run)) return false;
  if (typeof r.role !== "string" || !ROLE_RE.test(r.role)) return false;
  if (r.task != null && !(typeof r.task === "string" && TASK_RE.test(r.task))) return false;
  if (r.item != null && (!legacy || typeof r.item !== "string" || !LEGACY_ITEM_RE.test(r.item))) return false;
  if (r.next_report_by != null && !Number.isFinite(Number(r.next_report_by))) return false;
  if (r.outcome != null && !OUTCOMES.has(r.outcome)) return false;
  if (r.note != null && (typeof r.note !== "string" || r.note.length > MAX_NOTE || looksAbsolute(r.note))) return false;
  return Number.isFinite(Number(r.t));
}
function read(root) {
  const manifest = readWorkspaceManifest(root);
  const legacy = manifest.ok && manifest.manifest.schema_version < WORKSPACE_SCHEMA_VERSION;
  const file = legacy ? join5(root, LEGACY_LOG_REL) : logPath(root);
  if (!existsSync4(file)) return { present: false, records: [], skipped: 0 };
  let raw;
  try {
    raw = readFileSync4(file, "utf8");
  } catch {
    return { present: false, records: [], skipped: 0 };
  }
  const records = [];
  let skipped = 0;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (readable(r, { legacy })) records.push(r);
      else skipped++;
    } catch {
      skipped++;
    }
  }
  return { present: true, records, skipped };
}
function runs(records, now = Date.now()) {
  const nowSec = Math.floor(now / 1e3);
  const byRun = /* @__PURE__ */ new Map();
  for (const r of records) {
    let s = byRun.get(r.run);
    if (!s) {
      s = {
        run: r.run,
        role: r.role,
        task: r.task || null,
        item: r.item || null,
        started: null,
        last: null,
        deadline: null,
        stopped: null,
        outcome: null,
        events: 0
      };
      byRun.set(r.run, s);
    }
    s.events++;
    if (r.role) s.role = r.role;
    if (r.task) s.task = r.task;
    if (r.item) s.item = r.item;
    if (r.e === "start") s.started = r.t;
    if (r.e === "stop") {
      s.stopped = r.t;
      s.outcome = r.outcome || null;
    }
    if (s.last === null || r.t >= s.last) {
      s.last = r.t;
      if (r.next_report_by != null) s.deadline = r.next_report_by;
    }
  }
  const out = [];
  for (const s of byRun.values()) {
    s.open = s.stopped === null;
    s.overdue = s.open && s.deadline != null && s.deadline < nowSec;
    s.silent_for = s.open && s.last != null ? nowSec - s.last : null;
    out.push(s);
  }
  return out.sort((a, b) => (b.last || 0) - (a.last || 0));
}

export {
  workspaceGit,
  inspectGitPrivacy,
  fail,
  durablePath,
  workspaceManifest,
  projectBinding,
  assertWorkspacePath,
  pathPrivacy,
  exactBytes,
  scanExactFile,
  hashArtifact,
  verifySubject,
  retainSubject,
  verifyArtifact,
  verifyTarget,
  hash2 as hash,
  schema5MigrationLockPath,
  nativeWriterTokenPrefix,
  nativeWriterTokenPath,
  fail2,
  LOCK,
  DATABASE,
  MIGRATIONS,
  logicalStoreDigest,
  safePath,
  exactFile,
  fileFingerprint,
  exclusiveFile,
  migrationManifest,
  privateAdmission,
  sourceSnapshot,
  sameSnapshot,
  readDirection,
  readWorkspaceContract,
  assertWorkspaceWrite,
  openStore,
  openHistoricalStore,
  closeStore,
  readRecord,
  listRecords,
  listAllRecords,
  readStoreSummary,
  readSnapshot,
  readSubjectView,
  readMessagePage,
  readOperationReceipt,
  readMessageOperation,
  applyOperation,
  LOG_REL,
  FORBIDDEN_FIELDS,
  MAX_LINE,
  MAX_BYTES,
  digest,
  looksAbsolute,
  safeNote,
  activityWorkspaceAdmission,
  append,
  read,
  runs
};
