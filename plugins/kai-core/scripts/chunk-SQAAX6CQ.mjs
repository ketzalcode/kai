import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  read,
  runs
} from "./chunk-MIK5J3AD.mjs";
import {
  loadWorkspaceRegistry,
  readWorkspaceManifest
} from "./chunk-VTZRFV57.mjs";
import {
  DOD_DIMENSIONS,
  NEEDS_CHANGE_REF,
  RECORD_KINDS,
  RuntimeError,
  TERMINAL,
  assertExactKeys,
  canonicalJson,
  commandDigest,
  criteriaRef,
  frontmatter,
  isNull,
  isProducingRun,
  lease,
  listBlock,
  mapListBlock,
  parseStamp,
  parseThread,
  scalar,
  subjectEquals,
  unquote,
  validateActor,
  validateAuthority,
  validateCommand,
  validateCommandMutation,
  validateRecord,
  validateSubjectRef
} from "./chunk-VP4QXWCX.mjs";

// src/core/lib/workspace-path-safety.mjs
import { existsSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
function badPath(p) {
  const t = unquote(p);
  if (isNull(t) || t === "[]") return null;
  const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/i.exec(t);
  const candidate = projectTarget ? projectTarget[2] : t;
  if (projectTarget && !candidate.trim()) return "project target with no relative path";
  const norm = candidate.replace(/\\/g, "/");
  if (t.startsWith("\\\\") || norm.startsWith("//")) return "UNC / share path";
  if (/^[A-Za-z]:\//.test(norm) || norm.startsWith("/")) return "machine-absolute path";
  if (t.includes(".../")) return "abbreviated `.../` path";
  if (norm.split("/").some((seg) => seg === "..")) return "path escaping the workspace root";
  if (/session-state/i.test(t)) return "session-state-relative path";
  return null;
}
function canonicalPath(path) {
  let existing = resolve(path);
  const tail = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    tail.unshift(basename(existing));
    existing = parent;
  }
  const canonical = existsSync(existing) ? realpathSync.native(existing) : existing;
  return resolve(canonical, ...tail);
}
function normalized(path) {
  const value = canonicalPath(path);
  return process.platform === "win32" ? value.toLowerCase() : value;
}
function resolvedProjectPath(root, projectPath) {
  return isAbsolute(projectPath) ? resolve(projectPath) : resolve(root, projectPath);
}
function escapesRoot(root, candidate) {
  const rel = relative(canonicalPath(root), canonicalPath(candidate));
  return rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel);
}
function inspectPrivateLanes(root, lanes = [".kai/runs", ".kai/review", ".kai/archive", ".kai/personal"]) {
  const gitRoots = [];
  const symbolicLinks = [];
  const unreadable = [];
  for (const lane of lanes) {
    const laneRoot = join(root, ...lane.split("/"));
    let laneStat;
    try {
      laneStat = lstatSync(laneRoot);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      unreadable.push(`${lane}: ${error.message}`);
      continue;
    }
    if (laneStat.isSymbolicLink()) {
      symbolicLinks.push(lane);
      continue;
    }
    const pending = [laneRoot];
    while (pending.length) {
      const current = pending.pop();
      let entries;
      try {
        entries = readdirSync(current, { withFileTypes: true });
      } catch (error) {
        unreadable.push(`${relative(root, current).replace(/\\/g, "/")}: ${error.message}`);
        continue;
      }
      for (const entry of entries) {
        const path = join(current, entry.name);
        if (entry.name.toLowerCase() === ".git") {
          gitRoots.push(relative(root, current).replace(/\\/g, "/") || ".");
          continue;
        }
        if (entry.isSymbolicLink()) {
          symbolicLinks.push(relative(root, path).replace(/\\/g, "/"));
          continue;
        }
        if (entry.isDirectory()) pending.push(path);
      }
    }
  }
  return { gitRoots, symbolicLinks, unreadable };
}
function pathHasLink(root, candidate) {
  let current = resolve(root);
  const segments = relative(current, resolve(candidate)).split(sep).filter(Boolean);
  for (const segment of ["", ...segments]) {
    if (segment) current = join(current, segment);
    try {
      if (lstatSync(current).isSymbolicLink()) return true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return false;
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
import { dirname as dirname2, isAbsolute as isAbsolute2, join as join2, resolve as resolve2 } from "node:path";
function fail(code, message) {
  throw new RuntimeError(code, message);
}
function durablePath(value) {
  if (typeof value !== "string" || !value.trim() || badPath(value)) {
    fail("INVALID_INPUT", "a complete workspace-relative or project-qualified path is required");
  }
  const normalized2 = value.replaceAll("\\", "/");
  const qualifier = /^project:([a-z][a-z0-9-]*):(.*)$/.exec(normalized2);
  const path = qualifier ? qualifier[2] : normalized2;
  const parts = path.split("/").filter((part) => part !== ".");
  if (parts.some((part) => !part || /[:<>"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part))) {
    fail("INVALID_INPUT", "path contains an unsafe or ambiguous segment");
  }
  return (qualifier ? `project:${qualifier[1]}:` : "") + parts.join("/");
}
function workspaceManifest(root) {
  if (typeof root !== "string" || !isAbsolute2(root)) fail("INVALID_INPUT", "explicit absolute workspace root is required");
  if (/^(\\\\|\/\/)/.test(root)) fail("UNSUPPORTED_HOST", "network workspaces are unsupported");
  if (process.platform === "win32" && !/^[a-z]:[\\/]/i.test(root)) {
    fail("INVALID_INPUT", "workspace root requires an explicit drive, not the current drive");
  }
  const manifestPath = join2(root, ".kai", "manifest.json");
  if (pathHasLink(root, manifestPath) || escapesRoot(root, manifestPath)) {
    fail("INVALID_INPUT", "workspace manifest cannot traverse a link");
  }
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail("INVALID_INPUT", result.reason);
  const m = result.manifest;
  if (m.schema_version !== 4) fail("SCHEMA_MISMATCH", "evidence requires workspace schema 4");
  if (!Array.isArray(m.projects)) fail("INVALID_INPUT", "workspace projects must be declared");
  for (const lane of ["state", "runs", "review", "archive", "personal"]) {
    if (m[lane] !== `.kai/${lane}`) fail("INVALID_INPUT", `unsupported workspace ${lane} binding`);
  }
  return m;
}
function projectBinding(root, projectId) {
  const matches = workspaceManifest(root).projects.filter((project2) => project2.id === projectId);
  if (matches.length !== 1 || typeof matches[0].path !== "string" || !matches[0].path.trim()) {
    fail("INVALID_INPUT", "project must have exactly one explicit workspace binding");
  }
  const project = matches[0];
  if (/^(\\\\|\/\/)/.test(project.path)) fail("UNSUPPORTED_HOST", "network projects are unsupported");
  if (/^[a-z]:(?![\\/])/i.test(project.path) || /^\\(?!\\)/.test(project.path) || process.platform === "win32" && isAbsolute2(project.path) && !/^[a-z]:[\\/]/i.test(project.path)) {
    fail("INVALID_INPUT", "project binding cannot depend on the current drive or working directory");
  }
  const projectRoot = resolvedProjectPath(root, project.path);
  if (pathHasLink(projectRoot, projectRoot)) fail("INVALID_INPUT", "project root cannot be a link");
  return { project, projectRoot };
}
function assertWorkspacePath(root, relativePath) {
  workspaceManifest(root);
  const path = durablePath(relativePath);
  const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/.exec(path);
  let base = root;
  let local = path;
  if (projectTarget) {
    const { project, projectRoot } = projectBinding(root, projectTarget[1]);
    base = projectRoot;
    local = projectTarget[2];
    const publication = durablePath(project.publication_root);
    if (publication.startsWith("project:") || publication.toLowerCase() === ".kai" || publication.toLowerCase().startsWith(".kai/") || local !== publication && !local.startsWith(`${publication}/`)) {
      fail("INVALID_INPUT", "public target escapes the declared project publication root");
    }
    if (normalized(base) !== normalized(root) && !escapesRoot(join2(root, ".kai"), base)) {
      fail("INVALID_INPUT", "a project publication cannot alias private workspace state");
    }
  } else if (!/^\.kai\/(runs|review|state|archive|personal)\//.test(path)) {
    fail("INVALID_INPUT", "private references require a .kai lane; public paths must be project-qualified");
  }
  const absolute = resolve2(base, ...local.split("/"));
  if (escapesRoot(base, absolute) || pathHasLink(base, absolute)) {
    fail("INVALID_INPUT", "path escapes its root or traverses a symbolic link or junction");
  }
  if (!projectTarget) {
    const inspection = inspectPrivateLanes(root, [
      ".kai/state",
      ".kai/runs",
      ".kai/review",
      ".kai/archive",
      ".kai/personal"
    ]);
    if (inspection.gitRoots.length || inspection.symbolicLinks.length || inspection.unreadable.length) {
      fail("INVALID_INPUT", "private lanes contain nested Git roots, links, or unreadable directories");
    }
  }
  return absolute;
}
function pathPrivacy(root, path) {
  return escapesRoot(join2(root, ".kai", "personal"), assertWorkspacePath(root, path)) ? "public" : "personal";
}
function readExactFile(root, path, read2) {
  const absolute = assertWorkspacePath(root, path);
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
    fail("EVIDENCE_GAP", `referenced evidence is missing or unreadable: ${path}`);
  } finally {
    if (fd !== void 0) closeSync(fd);
  }
}
function exactBytes(root, path) {
  return readExactFile(root, path, (fd) => {
    const bytes = readFileSync(fd);
    return { value: bytes, size: bytes.length };
  });
}
function scanExactFile(root, path, consume = () => {
}) {
  return readExactFile(root, path, (fd, expectedSize) => {
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
  const path = durablePath(relativePath);
  return { kind: "sha256", digest: scanExactFile(root, path).digest, path };
}
function orderedPaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0) fail("INVALID_INPUT", "bundle requires paths");
  const normalized2 = paths.map(durablePath).sort();
  if (new Set(normalized2.map((path) => path.toLowerCase())).size !== normalized2.length) {
    fail("INVALID_INPUT", "bundle contains duplicate paths or case collisions");
  }
  return normalized2;
}
function hashBundle({ root, paths }) {
  const entries = orderedPaths(paths).map((path) => {
    const artifact = hashArtifact({ root, relativePath: path });
    return { path, digest: artifact.digest };
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
function retainFile(root, path, bytes) {
  const absolute = assertWorkspacePath(root, path);
  mkdirSync(dirname2(absolute), { recursive: true });
  assertWorkspacePath(root, path);
  try {
    writeFileSync(absolute, bytes, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (!exactBytes(root, path).equals(Buffer.from(bytes))) {
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
  const entries = verifySubject(root, artifact.subject, artifact.project_id);
  if (canonicalJson(entries) !== canonicalJson(artifact.snapshots.map(({ path, digest: digest2 }) => ({ path, digest: digest2 })))) {
    fail("EVIDENCE_GAP", "artifact snapshot manifest does not match its exact subject");
  }
  for (const snapshot of artifact.snapshots) {
    if (!snapshot.snapshot_path.startsWith(`${artifact.run_directory}/.evidence/${artifact.artifact_id}/`) || scanExactFile(root, snapshot.snapshot_path).digest !== snapshot.digest) {
      fail("EVIDENCE_GAP", "retained snapshot is missing or changed");
    }
  }
  if (artifact.subject.kind !== "git") {
    if (artifact.manifest_path !== `${artifact.run_directory}/.evidence/${artifact.artifact_id}/manifest.json` || scanExactFile(root, artifact.manifest_path).digest !== hash(canonicalJson({
      subject: artifact.subject,
      snapshots: artifact.snapshots
    }))) {
      fail("EVIDENCE_GAP", "retained manifest is missing or changed");
    }
  }
}
function verifyTarget(root, target, artifact) {
  if (artifact.subject.kind !== "sha256") {
    if (artifact.subject.kind === "bundle-sha256" && target.startsWith("project:") && artifact.subject.entries.some((entry) => !entry.path.startsWith("project:"))) {
      fail("INVALID_INPUT", "public bundle manifests cannot expose private member references");
    }
    const manifest = artifact.subject.kind === "git" ? { project_id: artifact.project_id, subject: artifact.subject } : artifact.subject;
    if (scanExactFile(root, target).digest !== hash(canonicalJson(manifest))) {
      fail("EVIDENCE_GAP", "canonical target must contain the exact immutable subject manifest");
    }
    return;
  }
  if (hashArtifact({ root, relativePath: target }).digest !== artifact.subject.digest) {
    fail("EVIDENCE_GAP", "canonical target does not contain the accepted exact bytes");
  }
}

// src/core/lib/workspace-git-privacy.mjs
import { spawnSync } from "node:child_process";
var PRIVATE_PREFIXES = [".kai/runs/", ".kai/review/", ".kai/personal/", ".kai/archive/"];
var PRIVATE_FILES = [
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
    if (mode !== "external") warnings.push(`storage_mode "${mode}" is not inside a readable git work tree`);
    return { errors, warnings, missing, gitRoot: null };
  }
  const tracked = git(["ls-files", "-z", "--", ".kai"]);
  if (tracked.status !== 0) {
    errors.push("cannot inspect tracked private workspace state");
    return { errors, warnings, missing, gitRoot: canonicalPath(top.stdout.trim()) };
  }
  const paths = tracked.stdout.split("\0").filter(Boolean);
  const privatePaths = [...PRIVATE_PREFIXES, ...PRIVATE_FILES, ...extraPrivate];
  const isPrivate = (path) => privatePaths.some((p) => p.endsWith("/") ? path.startsWith(p) : path === p);
  const bad = mode === "repo-local" ? paths : paths.filter((path) => isPrivate(path) || privateDatabases && /\.(?:sqlite|sqlite3|db)(?:-(?:wal|shm|journal))?$/i.test(path));
  if (bad.length) errors.push(`storage_mode "${mode}" has tracked private .kai path(s); these must be untracked: ${bad.join(", ")}`);
  const ignored = (path) => {
    const result = git(["check-ignore", "--no-index", "-q", "--", path]);
    if (![0, 1].includes(result.status)) errors.push(`cannot inspect Git privacy for ${path}`);
    return result.status === 0;
  };
  if (mode === "repo-local") {
    if (!ignored(".kai/")) missing.push(".kai/");
  } else if (mode === "shared" || mode === "external") {
    if (ignored(".kai/manifest.json") || ignored(".kai/state/BOARD.md")) {
      errors.push(`storage_mode "${mode}" requires .kai/manifest.json and .kai/state/ to remain trackable in a version-controlled workspace`);
    }
    for (const path of privatePaths) if (!ignored(path)) missing.push(path);
  }
  return { errors, warnings, missing, gitRoot: canonicalPath(top.stdout.trim()) };
}

// src/core/lib/coordination-runtime/migration-files.mjs
import {
  closeSync as closeSync2,
  existsSync as existsSync2,
  fstatSync as fstatSync2,
  fsyncSync,
  lstatSync as lstatSync2,
  mkdirSync as mkdirSync2,
  openSync as openSync2,
  readFileSync as readFileSync2,
  readdirSync as readdirSync2,
  readSync as readSync2,
  writeFileSync as writeFileSync2
} from "node:fs";
import { createHash as createHash2 } from "node:crypto";
import { dirname as dirname3, isAbsolute as isAbsolute3, join as join3, relative as relative2, resolve as resolve3 } from "node:path";
var hash2 = (bytes) => createHash2("sha256").update(bytes).digest("hex");
var fail2 = (code, message) => {
  throw new RuntimeError(code, message);
};
var LOCK = ".kai/state/migration.lock";
var DATABASE = ".kai/state/coordination.sqlite";
var MIGRATIONS = ".kai/archive/coordination-migrations";
function safePath(root, name) {
  const path = durablePath(name);
  if (!path.startsWith(".kai/") || path.startsWith("project:")) fail2("INVALID_INPUT", "migration paths must be private workspace paths");
  const absolute = resolve3(root, ...path.split("/"));
  if (pathHasLink(root, absolute) || escapesRoot(root, absolute)) fail2("INVALID_INPUT", "migration path traverses a link or escapes the workspace");
  return absolute;
}
function exactFile(root, name) {
  const path = safePath(root, name);
  const stat = lstatSync2(path);
  if (!stat.isFile() || stat.nlink !== 1) fail2("RECOVERY_REQUIRED", `not a regular unshared file: ${name}`);
  const fd = openSync2(path, "r");
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
  const path = safePath(root, name);
  const stat = lstatSync2(path);
  if (!stat.isFile() || stat.nlink !== 1) fail2("RECOVERY_REQUIRED", `not a regular unshared file: ${name}`);
  const fd = openSync2(path, "r");
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
  mkdirSync2(dirname3(target), { recursive: true });
  const fd = openSync2(safePath(root, name), "wx", 384);
  try {
    writeFileSync2(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync2(fd);
  }
}
function migrationManifest(root, versions = [3, 4], env = process.env) {
  if (typeof root !== "string" || !isAbsolute3(root)) fail2("INVALID_INPUT", "explicit absolute workspace root required");
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
  if (m.storage_mode === "external" && (typeof m.workspace_root !== "string" || !isAbsolute3(m.workspace_root) || normalized(m.workspace_root) !== normalized(root)) || m.storage_mode !== "external" && m.workspace_root !== ".") fail2("INVALID_INPUT", "workspace_root does not match the selected storage/root binding");
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
    if (!project || !/^[a-z][a-z0-9-]*$/.test(project.id) || ids.has(project.id) || typeof project.path !== "string" || !isAbsolute3(project.path) && project.path !== ".") {
      fail2("INVALID_INPUT", "ambiguous project binding");
    }
    ids.add(project.id);
    if (/^(\\\\|\/\/)/.test(project.path)) fail2("UNSUPPORTED_HOST", "network project unsupported");
    const projectRoot = resolve3(root, project.path);
    if (!existsSync2(projectRoot) || pathHasLink(projectRoot, projectRoot)) fail2("INVALID_INPUT", "missing or linked project binding");
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
  LOCK,
  `${MIGRATIONS}/`,
  ".kai/review/coordination/",
  ".kai/state/host/"
];
function privateAdmission(root, { admit = false } = {}) {
  const manifest = readWorkspaceManifest(root);
  if (!manifest.ok) fail2("INVALID_INPUT", manifest.reason);
  const git = (args) => workspaceGit(root, args);
  const privacy = inspectGitPrivacy(root, manifest.manifest.storage_mode, { extraPrivate: privateNames, privateDatabases: true });
  if (privacy.errors.length) return { errors: privacy.errors, admitted: [] };
  if (!privacy.gitRoot) return { errors: [], admitted: [] };
  const prefix = relative2(privacy.gitRoot, canonicalPath(root)).replaceAll("\\", "/");
  const name = (path2) => prefix ? `${prefix}/${path2}` : path2;
  const ignored = (path2) => git(["check-ignore", "--no-index", "-q", "--", path2]).status === 0;
  const missing = privacy.missing;
  if (!missing.length) return { errors: [], admitted: [] };
  if (!admit) return { errors: missing.map((path2) => `private SQLite/runtime path must be ignored: ${path2}`), admitted: [] };
  const exclude = git(["rev-parse", "--git-path", "info/exclude"]);
  if (exclude.status !== 0) fail2("RECOVERY_REQUIRED", "cannot resolve private Git exclude metadata");
  const path = resolve3(root, exclude.stdout.trim());
  if (pathHasLink(dirname3(path), path)) fail2("INVALID_INPUT", "Git exclude metadata is linked");
  if (existsSync2(path) && (!lstatSync2(path).isFile() || lstatSync2(path).nlink !== 1)) fail2("INVALID_INPUT", "Git exclude metadata is shared or nonregular");
  mkdirSync2(dirname3(path), { recursive: true });
  const literal = (text) => text.replace(/[\\*?[\]#! ]/g, (c) => `\\${c}`);
  const bytes = `
# kai private coordination runtime
${missing.map((p) => `/${literal(name(p))}`).join("\n")}
`;
  const fd = openSync2(path, "a", 384);
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
    if (name === LOCK || name === MIGRATIONS || name === DATABASE || name.startsWith(`${DATABASE}-`) || name.toLowerCase() === ".kai/state/host") return;
    const path = safePath(root, name);
    const stat = lstatSync2(path);
    if (stat.isDirectory()) {
      for (const child of readdirSync2(path).sort()) walk(`${name}/${child}`);
    } else {
      const { digest: digest2, size, prefix } = fileFingerprint(root, name, { prefixBytes: 16 });
      if (/(?:-wal|-shm|-journal)$/i.test(name) || (prefix.toString("latin1") === "SQLite format 3\0" || /\.(sqlite|sqlite3|db)$/i.test(name)) && ["-wal", "-shm", "-journal"].some((suffix) => existsSync2(safePath(root, `${name}${suffix}`)))) {
        fail2("UNSUPPORTED_HOST", `SQLite evidence with live/unreconciled sidecars requires offline reconciliation: ${name}`);
      }
      files.push({ path: name, digest: digest2, size });
    }
  }
  for (const child of readdirSync2(join3(root, ".kai")).sort()) walk(`.kai/${child}`);
  return files;
}
function sameSnapshot(expected, actual) {
  if (canonicalJson(expected) !== canonicalJson(actual)) fail2("RECOVERY_REQUIRED", "source fingerprint/write set changed; preserve user edits and reconcile offline");
}

// src/core/lib/coordination-runtime/workspace-guard.mjs
import { existsSync as existsSync3, readFileSync as readFileSync3 } from "node:fs";
import { basename as basename2, dirname as dirname4, join as join4, resolve as resolve4 } from "node:path";
function assertWorkspaceWrite(path, { privateCheck = true, requirePrivate = false } = {}) {
  if (basename2(path) !== "coordination.sqlite") return;
  const state = dirname4(resolve4(path));
  if (basename2(state) !== "state" || basename2(dirname4(state)) !== ".kai") return;
  const root = dirname4(dirname4(state));
  const manifest = join4(root, ".kai", "manifest.json");
  if (!existsSync3(manifest)) throw new RuntimeError("SCHEMA_MISMATCH", "workspace coordination writes require a schema 4 manifest");
  if (pathHasLink(root, manifest) || pathHasLink(root, path)) throw new RuntimeError("INVALID_INPUT", "coordination workspace paths cannot traverse links");
  let parsed;
  try {
    parsed = JSON.parse(readFileSync3(manifest, "utf8"));
  } catch {
    throw new RuntimeError("SCHEMA_MISMATCH", "coordination manifest is unreadable");
  }
  if (parsed.schema_version !== 4) throw new RuntimeError("SCHEMA_MISMATCH", "schema 3/future workspaces are inspect-only; coordinated writes require schema 4");
  if (existsSync3(join4(state, "migration.lock"))) throw new RuntimeError("RECOVERY_REQUIRED", "offline migration/rollback lock prevents coordinated work");
  if (privateCheck && (requirePrivate || parsed.coordination_migration)) {
    const privacy = privateAdmission(root);
    if (privacy.errors.length) throw new RuntimeError("INVALID_INPUT", privacy.errors.join("; "));
  }
}

// src/core/lib/coordination-runtime/store.mjs
import { existsSync as existsSync4, mkdirSync as mkdirSync3, statSync } from "node:fs";
import { dirname as dirname5 } from "node:path";
import { DatabaseSync } from "node:sqlite";
var SCHEMA_VERSION = 1;
var MESSAGE_SCHEMA_VERSION = 1;
var STORE_MODES = /* @__PURE__ */ new Set(["create", "read", "write"]);
var EVENTS_TABLE_SQL = `CREATE TABLE events (
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
var REQUIRED_INDEX_SQL = [
  "CREATE INDEX records_by_item ON records(kind, item_id)",
  `CREATE INDEX records_by_question_status ON records(item_id, json_extract(body, '$.status'))
    WHERE kind = 'question'`,
  `CREATE INDEX records_by_criteria ON records(kind, item_id, json_extract(body, '$.criteria_ref'))`,
  `CREATE INDEX events_by_thread ON events(thread_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_message ON events(message_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_item_kind ON events(item_id, event_kind, seq, question_id)`,
  `CREATE INDEX events_by_approval ON events(approval_id, seq) WHERE approval_id IS NOT NULL`
];
var REQUIRED_TRIGGER_SQL = [
  `CREATE TRIGGER events_capture_thread AFTER INSERT ON events
    WHEN NEW.message_id IS NOT NULL
    BEGIN
      UPDATE events SET thread_id = COALESCE(
        (SELECT json_extract(body, '$.thread_id') FROM records
          WHERE kind = 'message' AND id = NEW.message_id), NEW.item_id)
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
    "create table records(kind text not null,id text not null,item_id text,version integer not null check(version>0),body text not null check(json_valid(body)),primary key(kind,id))"
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
  kind TEXT NOT NULL, id TEXT NOT NULL, item_id TEXT,
  version INTEGER NOT NULL CHECK (version > 0),
  body TEXT NOT NULL CHECK (json_valid(body)),
  PRIMARY KEY (kind, id)
);
${EVENTS_TABLE_SQL};
CREATE TABLE operations (
  id TEXT PRIMARY KEY, payload_digest TEXT NOT NULL,
  receipt TEXT NOT NULL CHECK (json_valid(receipt))
);
${[...REQUIRED_INDEX_SQL, ...REQUIRED_TRIGGER_SQL].join(";\n")};
`;
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
function decodeRecord(row) {
  if (!row) return null;
  const record = {
    kind: row.kind,
    id: row.id,
    itemId: row.item_id,
    version: row.version,
    body: parseJson(row.body, `record ${row.kind}/${row.id}`)
  };
  try {
    return validateRecord(record);
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "INVALID_INPUT") {
      recovery(`record ${row.kind}/${row.id} is malformed: ${error.message}`);
    }
    throw error;
  }
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
function validatePhysicalSchema(database) {
  for (const [table, expectedColumns] of REQUIRED_COLUMNS) {
    const columns = runSqlite(() => database.prepare(`PRAGMA table_xinfo(${table})`).all());
    const actualColumns = columns.map((column) => [
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
    if (normalizedSql !== REQUIRED_TABLE_SQL.get(table)) {
      recovery(`coordination database table "${table}" has unsupported constraints`);
    }
  }
  for (const definition of [...REQUIRED_INDEX_SQL, ...REQUIRED_TRIGGER_SQL]) {
    const [, type, name] = /^CREATE (INDEX|TRIGGER) (\w+)/.exec(definition);
    const row = runSqlite(() => database.prepare(
      "SELECT sql FROM sqlite_master WHERE type = ? AND name = ?"
    ).get(type.toLowerCase(), name));
    if (!row || normalizeSchemaSql(row.sql) !== normalizeSchemaSql(definition)) {
      recovery(`coordination database ${type.toLowerCase()} "${name}" is missing or unsupported`);
    }
  }
}
function validateSchema(database) {
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
  validatePhysicalSchema(database);
  const metadata = runSqlite(() => database.prepare(
    "SELECT value FROM metadata WHERE key = 'schema_version'"
  ).get());
  if (!metadata) recovery("coordination database has no schema version");
  if (metadata.value !== String(SCHEMA_VERSION)) {
    throw new RuntimeError(
      "SCHEMA_MISMATCH",
      `coordination database schema ${JSON.stringify(metadata.value)} is unsupported; expected ${SCHEMA_VERSION}`
    );
  }
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
function openStore({ path, mode }) {
  if (typeof path !== "string" || path.trim() === "") invalid("store path must be a string");
  if (!STORE_MODES.has(mode)) invalid(`unsupported store mode "${mode}"`);
  const existed = existsSync4(path);
  if (mode !== "create" && !existed) {
    recovery(`coordination database does not exist at ${path}`);
  }
  if (mode === "create") mkdirSync3(dirname5(path), { recursive: true });
  let database;
  try {
    database = new DatabaseSync(path, { readOnly: mode === "read" });
    runSqlite(() => database.exec("PRAGMA busy_timeout=1000"));
    const shouldInitialize = mode === "create" && (!existed || statSync(path).size === 0);
    if (shouldInitialize) initializeSchema(database);
    validateSchema(database);
    return {
      database,
      path,
      mode,
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
    SELECT kind, id, item_id, version, body
    FROM records
    WHERE kind = ? AND id = ?
  `).get(kind, id));
  return decodeRecord(row);
}
function listRecords(store, { kind, itemId }) {
  assertStore(store);
  if (!RECORD_KINDS.has(kind)) invalid(`unsupported record kind "${kind}"`);
  if (itemId !== null && typeof itemId !== "string") {
    invalid("record itemId must be a string or null");
  }
  const rows = runSqlite(() => itemId === null ? store.database.prepare(`
      SELECT kind, id, item_id, version, body
      FROM records
      WHERE kind = ? AND item_id IS NULL
      ORDER BY id
    `).all(kind) : store.database.prepare(`
      SELECT kind, id, item_id, version, body
      FROM records
      WHERE kind = ? AND item_id = ?
      ORDER BY id
    `).all(kind, itemId));
  return rows.map(decodeRecord);
}
function listAllRecords(store, { kind }) {
  assertStore(store);
  if (!RECORD_KINDS.has(kind)) invalid(`unsupported record kind "${kind}"`);
  return runSqlite(() => store.database.prepare(`
    SELECT kind, id, item_id, version, body FROM records WHERE kind = ? ORDER BY id
  `).all(kind)).map(decodeRecord);
}
function readStoreSummary(store) {
  return readSnapshot(store, () => runSqlite(() => {
    const throughSeq = Number(store.database.prepare("SELECT COALESCE(MAX(seq), 0) AS seq FROM events").get().seq);
    const itemCount = Number(store.database.prepare("SELECT COUNT(*) AS count FROM records WHERE kind = 'item'").get().count);
    return { throughSeq, itemCount };
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
function readContextView(store, { itemId, recentLimit }) {
  assertStore(store);
  if (typeof itemId !== "string" || itemId === "") invalid("context itemId must be a string");
  if (!Number.isSafeInteger(recentLimit) || recentLimit < 0 || recentLimit > 8) {
    invalid("context recentLimit must be an integer from 0 through 8");
  }
  return readSnapshot(store, () => {
    const throughSeq = Number(runSqlite(() => store.database.prepare(
      "SELECT COALESCE(MAX(seq), 0) AS seq FROM events"
    ).get()).seq);
    const item = readRecord(store, "item", itemId);
    if (!item) {
      return {
        throughSeq,
        item: null,
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
    const dependencies = item.body.depends_on.map((dependency) => ({
      dependency,
      record: readRecord(store, "item", dependency.item)
    }));
    const chronology = (column, id) => {
      const row = runSqlite(() => store.database.prepare(`
        SELECT seq FROM events WHERE ${column} = ? AND item_id = ? AND seq <= ?
        ORDER BY seq DESC LIMIT 1
      `).get(id, itemId, throughSeq));
      return row ? Number(row.seq) : null;
    };
    const missingQuestion = runSqlite(() => store.database.prepare(`
      SELECT e.question_id FROM events e
      LEFT JOIN records r ON r.kind = 'question' AND r.id = e.question_id AND r.item_id = e.item_id
      WHERE e.item_id = ? AND e.event_kind = 'question.open' AND e.seq <= ?
        AND e.question_id IS NOT NULL AND r.id IS NULL
      LIMIT 1
    `).get(itemId, throughSeq));
    if (missingQuestion) {
      throw new RuntimeError("EVIDENCE_GAP", `question/${missingQuestion.question_id} referenced by an opening event is missing`);
    }
    const questionRecords = runSqlite(() => store.database.prepare(`
      SELECT kind, id, item_id, version, body FROM records INDEXED BY records_by_question_status
      WHERE kind = 'question' AND item_id = ? AND json_extract(body, '$.status') = 'open'
    `).all(itemId)).map(decodeRecord);
    const questionsById = new Map(questionRecords.map((record) => [record.id, record]));
    for (const id of item.body.waiting_on_questions) {
      if (!questionsById.has(id)) questionsById.set(id, readRecord(store, "question", id));
    }
    const questions = [...questionsById.values()].map((record) => ({
      record,
      eventSeq: record ? chronology("message_id", record.body.opened_message_id) : null,
      openedMessage: record ? readRecord(store, "message", record.body.opened_message_id) : null,
      answerMessages: record ? record.body.answer_message_ids.map((id) => readRecord(store, "message", id)) : []
    }));
    const approvals = runSqlite(() => store.database.prepare(`
      SELECT kind, id, item_id, version, body FROM records
      WHERE kind = 'approval' AND item_id = ? AND json_extract(body, '$.criteria_ref') = ?
    `).all(itemId, criteriaRef(item.body))).map((row) => {
      const record = decodeRecord(row);
      return { record, eventSeq: chronology("approval_id", record.id) };
    });
    const recoveryHold = item.body.recovery_hold === null ? null : {
      record: readRecord(store, "attempt", item.body.recovery_hold),
      eventSeq: chronology("message_id", item.body.recovery_hold),
      message: readRecord(store, "message", item.body.recovery_hold)
    };
    const recentMessages = messageRows(store, itemId, throughSeq + 1, recentLimit).map((row) => ({ eventSeq: Number(row.seq), record: decodeMessageRow(row) })).reverse();
    const handoffRow = runSqlite(() => store.database.prepare(`
      SELECT e.seq, e.message_id, r.kind, r.id, r.item_id, r.version, r.body
      FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
      WHERE e.item_id = ? AND e.event_kind = 'item.handoff' AND e.seq <= ?
      ORDER BY e.seq DESC LIMIT 1
    `).get(itemId, throughSeq));
    const latestHandoff = handoffRow ? {
      eventSeq: Number(handoffRow.seq),
      record: decodeMessageRow(handoffRow)
    } : null;
    const messageCount = Number(runSqlite(() => store.database.prepare(`
      SELECT COUNT(*) AS count FROM events
      WHERE thread_id = ? AND message_id IS NOT NULL AND seq <= ?
    `).get(itemId, throughSeq)).count);
    const references = new Set(item.body.context_artifacts);
    for (const { record } of approvals) {
      record.body.evidence_refs.forEach((reference) => references.add(reference));
    }
    for (const { record } of recentMessages) {
      if (!record) continue;
      record.body.artifact_refs.forEach((reference) => references.add(reference));
      record.body.evidence_refs.forEach((reference) => references.add(reference));
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
      item,
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
function messageRows(store, threadId, beforeSeq, limit) {
  return runSqlite(() => store.database.prepare(`
    SELECT e.seq, e.message_id, r.kind, r.id, r.item_id, r.version, r.body
    FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
    WHERE e.thread_id = ? AND e.message_id IS NOT NULL AND e.seq < ?
    ORDER BY e.seq DESC LIMIT ?
  `).all(threadId, beforeSeq, limit));
}
function decodeMessageRow(row) {
  if (row.id === null) {
    throw new RuntimeError(
      "EVIDENCE_GAP",
      `message/${row.message_id} referenced by event ${row.seq} is missing`
    );
  }
  return decodeRecord(row);
}
function readMessagePage(store, { threadId, beforeSeq = null, limit }) {
  assertStore(store);
  if (typeof threadId !== "string" || threadId === "") {
    invalid("message threadId must be a string");
  }
  if (beforeSeq !== null && (!Number.isSafeInteger(beforeSeq) || beforeSeq < 1)) {
    invalid("message beforeSeq must be a positive safe integer or null");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    invalid("message limit must be an integer from 1 through 100");
  }
  return readSnapshot(store, () => {
    const rows = messageRows(store, threadId, beforeSeq ?? Number.MAX_SAFE_INTEGER, limit + 1);
    const messages = rows.map((row) => ({
      ...decodeMessageRow(row),
      eventSeq: Number(row.seq)
    })).slice(0, limit);
    const hasMore = rows.length > limit;
    const nextCursor = hasMore ? {
      threadId,
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
      INSERT INTO records (kind, id, item_id, version, body)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      record.kind,
      record.id,
      record.itemId,
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
    SET item_id = ?, version = ?, body = ?
    WHERE kind = ? AND id = ? AND version = ?
  `).run(
    record.itemId,
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
    const operationItemId = primaryBaseline?.itemId ?? (internalCommand.recordKind === "item" ? internalCommand.recordId : ["attempt.start", "effect.intent"].includes(internalCommand.kind) ? internalCommand.payload.itemId : null);
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
        INSERT INTO events (operation_id, item_id, payload)
        VALUES (?, ?, ?)
      `).run(
        internalCommand.operationId,
        operationItemId,
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
      list(kind, itemId = void 0) {
        requireTransaction();
        if (!RECORD_KINDS.has(kind)) invalid(`unsupported record kind "${kind}"`);
        if (itemId !== void 0 && itemId !== null && typeof itemId !== "string") {
          invalid("record itemId must be a string, null, or undefined");
        }
        const rows = runSqlite(() => {
          if (itemId === void 0) {
            return store.database.prepare(`
              SELECT kind, id, item_id, version, body
              FROM records
              WHERE kind = ?
              ORDER BY id
            `).all(kind);
          }
          if (itemId === null) {
            return store.database.prepare(`
              SELECT kind, id, item_id, version, body
              FROM records
              WHERE kind = ? AND item_id IS NULL
              ORDER BY id
            `).all(kind);
          }
          return store.database.prepare(`
            SELECT kind, id, item_id, version, body
            FROM records
            WHERE kind = ? AND item_id = ?
            ORDER BY id
          `).all(kind, itemId);
        });
        return rows.map(decodeRecord);
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
    const primary = validateRecord({
      kind: internalCommand.recordKind,
      id: internalCommand.recordId,
      itemId: operationItemId,
      version: internalCommand.expectedVersion + 1,
      body: nextBody
    });
    writeRecord(store.database, primary);
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

// src/core/lib/coordination-runtime/input-basis.mjs
import { createHash as createHash3 } from "node:crypto";
var digest = (value) => createHash3("sha256").update(canonicalJson(value)).digest("hex");
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
    const owner = tx.get("item", record.itemId);
    if (!owner) fail("EVIDENCE_GAP", `applicable input ${reference} has no owning item`);
    return { reference, digest: digest({ record, ownerCriteria: criteriaRef(owner.body) }) };
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
  return [...item.context_artifacts, ...inputAssetIds.map((id) => `asset:${id}`)];
}

// src/core/lib/coordination-runtime/migration.mjs
import { chmodSync, closeSync as closeSync3, constants, copyFileSync, existsSync as existsSync6, fsyncSync as fsyncSync2, mkdirSync as mkdirSync4, openSync as openSync3, renameSync, unlinkSync } from "node:fs";
import { dirname as dirname6, resolve as resolve5 } from "node:path";
import { randomUUID } from "node:crypto";

// src/core/lib/coordination-runtime/migration-legacy.mjs
import { basename as basename3 } from "node:path";
import { existsSync as existsSync5 } from "node:fs";
var nullable = (v) => isNull(v) ? null : v;
var METADATA_LIMIT = 64 * 1024;
var retired = (role) => /^(product-|gtm-|personal-|kai-product-|kai-go-to-market-)/.test(role ?? "");
var roleKnown = (role, roles) => role === "operator" || !retired(role) && roles.includes(role);
function block(lines, key) {
  const start = lines.findIndex((l) => l.startsWith(`${key}:`));
  if (start < 0) return [];
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^\S/.test(line)) break;
    out.push(line);
  }
  return out;
}
function section(text, heading) {
  return new RegExp(`(?:^|\\n)## ${heading}\\s*\\r?\\n([\\s\\S]*?)(?=\\n## |$)`).exec(text)?.[1].trim();
}
function timestamp(value) {
  const parsed = parseStamp(value);
  return parsed === null ? null : new Date(parsed).toISOString();
}
function scalarShape(raw, { emptyList = false } = {}) {
  const value = raw.trim();
  if (emptyList && value === "[]") return true;
  if (!value || value === "~") return false;
  if (/^"[^"\r\n]*"$|^'[^'\r\n]*'$/.test(value)) return true;
  return !/^[\[\]{}|>&*!?#"'%-]|:\s|[\r\n\t]/.test(value);
}
function collection(lines, key, issues, { keys = null, emptyLists = [] } = {}) {
  const head = lines.find((l) => l.startsWith(`${key}:`));
  const body = block(lines, key).filter((l) => l.trim() && !/^\s*#/.test(l));
  if (!head || !new RegExp(`^${key}:\\s*(\\[\\])?\\s*$`).test(head) || scalar(lines, key) === "[]" && body.length || scalar(lines, key) === "" && !body.length) {
    issues.push(`unsupported or indeterminate ${key} collection shape`);
    return [];
  }
  let valid = true, current = null;
  const complete = () => {
    if (current && keys.some((k) => !current.has(k))) valid = false;
  };
  for (const line of body) {
    if (!keys) {
      const value = /^ {2}- (.+)$/.exec(line)?.[1];
      if (!value || !scalarShape(value)) valid = false;
      continue;
    }
    const start = /^ {2}- ([a-z_]+):\s?(.*)$/.exec(line);
    const continuation = /^ {4}([a-z_]+):\s?(.*)$/.exec(line);
    if (start) {
      complete();
      current = /* @__PURE__ */ new Set();
      if (start[1] !== keys[0]) valid = false;
    }
    const entry = start ?? continuation;
    if (!entry || !current || !keys.includes(entry[1]) || current.has(entry[1]) || !scalarShape(entry[2], { emptyList: emptyLists.includes(entry[1]) })) {
      valid = false;
    }
    if (entry && current) current.add(entry[1]);
  }
  complete();
  if (!valid) {
    issues.push(`malformed, partial or nested ${key} collection`);
    return [];
  }
  return keys ? mapListBlock(lines, key) : listBlock(lines, key);
}
function headerMetadata(lines, kind, issues) {
  const fields = {};
  const declarations = /* @__PURE__ */ new Map();
  for (const line of lines) {
    const match = /^([a-z_]+):/.exec(line);
    if (!match) {
      if (/^\S/.test(line)) issues.push("unsupported or malformed top-level metadata");
      continue;
    }
    const key = match[1];
    const values = declarations.get(key) ?? [];
    if (values.length) issues.push(`ambiguous duplicate field ${key}`);
    values.push(scalar([line], key));
    declarations.set(key, values);
    fields[key] = values[0];
  }
  let identityUnresolved = ["id", "slug"].some((key) => (declarations.get(key)?.length ?? 0) > 1);
  if (kind === "initiative" && fields.id && fields.slug && fields.id !== fields.slug) {
    issues.push("ambiguous id versus declared slug");
    identityUnresolved = true;
  }
  const lifecycle = ["state", "status"].flatMap((key) => declarations.get(key) ?? []);
  const lifecycleAmbiguous = new Set(lifecycle).size > 1 || ["state", "status"].some((key) => (declarations.get(key)?.length ?? 0) > 1);
  const declaredState = fields[kind === "initiative" ? "status" : "state"] ?? null;
  if (lifecycleAmbiguous) issues.push("ambiguous or conflicting lifecycle declarations");
  if (declaredState === null || isNull(declaredState)) issues.push(`missing explicit ${kind} lifecycle`);
  return {
    fields,
    declaredState,
    producerRun: fields.producer_run ?? null,
    updated: fields.updated ?? fields.updated_at ?? null,
    metadataSupported: issues.length === 0,
    identityUnresolved,
    lifecycleAmbiguous,
    terminalHistory: lifecycle.some((state) => TERMINAL.has(state) || state === "archived")
  };
}
function parseSource(root, entry, roles) {
  const candidate = /\.md$/i.test(entry.path);
  const file = candidate ? fileFingerprint(root, entry.path, { prefixBytes: METADATA_LIMIT }) : null;
  if (file && (file.digest !== entry.digest || file.size !== entry.size)) fail2("RECOVERY_REQUIRED", "legacy source changed during parsing");
  const text = file?.prefix.toString("utf8") ?? "";
  const invalidEncoding = file && !file.prefix.equals(Buffer.from(text));
  const fm = frontmatter(text)?.filter((line) => !/^\s*#/.test(line)) ?? null;
  const archivedItem = entry.path.startsWith(".kai/archive/") && fm && (scalar(fm, "type") === "work-item" || scalar(fm, "id") && scalar(fm, "initiative") && scalar(fm, "state") && scalar(fm, "version"));
  const kind = entry.path.startsWith(".kai/state/items/") && !/\/README\.md$/i.test(entry.path) || archivedItem ? "item" : entry.path.startsWith(".kai/state/threads/") && !/\/README\.md$/i.test(entry.path) ? "thread" : /\/initiative\.md$/.test(entry.path) || /\/northstar\.md$/.test(entry.path) && fm ? "initiative" : /backlog\.md$/.test(entry.path) ? "backlog" : fm && scalar(fm, "asset_id") ? "asset" : "archive";
  const source = {
    sourceId: hash2(entry.path),
    path: entry.path,
    digest: entry.digest,
    kind,
    declaredId: fm ? nullable(scalar(fm, kind === "asset" ? "asset_id" : "id")) ?? (kind === "initiative" ? nullable(scalar(fm, "slug")) : null) : null,
    size: entry.size,
    parsed: {},
    issues: [],
    status: "archived",
    version: 1,
    record: null
  };
  if (fm && !invalidEncoding && ["item", "initiative"].includes(kind)) {
    source.parsed = headerMetadata(fm, kind, source.issues);
  }
  if (candidate && (entry.size > METADATA_LIMIT || invalidEncoding) && (kind !== "archive" || text.startsWith("---"))) {
    source.status = "quarantined";
    source.issues.push("unsupported encoding or oversized coordination metadata; 64 KiB limit, exact bytes retained externally");
    if (!fm || invalidEncoding) {
      source.declaredId = null;
      source.parsed.identityUnresolved = true;
    } else if (!source.parsed.fields) source.parsed = {
      declaredState: scalar(fm, "state") ?? scalar(fm, "status") ?? null,
      fields: Object.fromEntries(fm.filter((l) => /^[a-z_]+:/.test(l)).map((l) => {
        const key = l.slice(0, l.indexOf(":"));
        return [key, scalar(fm, key)];
      }))
    };
    source.parsed.metadataSupported = false;
    return source;
  }
  if (kind === "thread") {
    const thread = parseThread(text);
    source.parsed = { ...thread, messages: thread.messages.map((m) => ({ ...m, senderRun: m.fields.sender_run ?? null })) };
    source.declaredId = fm ? nullable(scalar(fm, "id")) : null;
    source.parsed.itemId = fm ? nullable(scalar(fm, "item_id")) ?? basename3(entry.path, ".md") : basename3(entry.path, ".md");
    source.issues.push(...thread.diagnostics.map((d) => `${d.type}: ${d.message}`));
    if (thread.messages.length) source.issues.push("legacy thread requires explicit revalidation; roles alone do not prove run identity or current answers");
    if (/\b(?:QUESTION|ANSWER|HANDOFF)\b/.test(text) && !thread.messages.length) source.issues.push("unparsed legacy thread packet");
    if (source.issues.length) source.status = "quarantined";
    return source;
  }
  if (!["item", "initiative"].includes(kind)) {
    source.parsed = { declaredState: fm ? scalar(fm, "state") ?? scalar(fm, "status") ?? null : null };
    if (kind === "asset") {
      source.declaredId = nullable(scalar(fm, "asset_id"));
      source.parsed.metadata = Object.fromEntries(fm.filter((l) => /^[a-z_]+:/.test(l)).map((l) => {
        const key = l.slice(0, l.indexOf(":"));
        return [key, scalar(fm, key)];
      }));
      source.issues.push("legacy asset validity/acceptance is historical and requires fresh runtime evidence");
      source.status = "quarantined";
    }
    if (kind === "backlog") {
      source.parsed.entries = text.split(/\r?\n/).filter((l) => /^\|/.test(l)).map((l) => l.split("|").slice(1, -1).map((s) => s.trim())).filter((c) => c.length >= 3 && c[0] && !/^(id|[-: ]+)$/i.test(c[0])).map((c) => ({ id: c[0], title: c[1], status: c[2], rawCells: c }));
    }
    return source;
  }
  source.status = "quarantined";
  if (!fm) {
    source.parsed = { identityUnresolved: true, metadataSupported: false };
    source.issues.push("malformed frontmatter");
    return source;
  }
  const { fields } = source.parsed;
  const seen = new Set(Object.keys(fields));
  if (kind === "initiative") {
    source.declaredId ??= nullable(fields.slug);
    source.parsed.milestones = block(fm, "milestones");
  }
  if (!source.declaredId) source.issues.push("missing declared original ID");
  const declaredLease = lease(fm);
  if (!isNull(fields.lease) && fields.lease !== "" || !isNull(declaredLease.holder) || !isNull(declaredLease.token) || /^(in-progress|deploying|production-verification)$/.test(fields.state ?? "")) {
    fail2("RECOVERY_REQUIRED", `offline migration refuses active or unreconciled work: ${entry.path}`);
  }
  for (const key of ["owner", "scope_authority", "completion_authority", "next_role", "validity_owner"]) {
    if (!isNull(fields[key]) && !roleKnown(fields[key], roles)) source.issues.push(`unresolved or retired ${key}: ${fields[key]}`);
  }
  if (kind === "item" && TERMINAL.has(fields.state)) source.issues.push("historical terminal acceptance is unverifiable; retain lifecycle without reopening it");
  if (archivedItem) source.issues.push("archived work identity/version is historical, never new dispatchable work");
  if (kind === "initiative" && ["completed", "shipped", "archived", "dropped"].includes(fields.status)) {
    source.issues.push("historical terminal initiative closure is unverified");
  }
  if (kind === "item" && fields.state !== "proposed") source.issues.push("legacy advancement needs explicit scope revalidation; no current approval imported");
  const requireField = (key) => {
    if (!seen.has(key)) source.issues.push(`missing explicit ${key}`);
  };
  const checkedCollection = (lines, key, options) => {
    const issues = [];
    const value = collection(lines, key, issues, options);
    if (issues.length) source.parsed.metadataSupported = false;
    source.issues.push(...issues);
    return value;
  };
  const list = (key) => checkedCollection(fm, key);
  const mapList = (key, keys, emptyLists = []) => checkedCollection(fm, key, { keys, emptyLists });
  const collections = new Set(kind === "item" ? ["acceptance", "artifact_targets", "context_artifacts", "touches", "depends_on", "waiting_on_questions", "review_requirements", "completed_reviews"] : ["scope", "milestones", "backlog"]);
  for (const key of seen) {
    if (!collections.has(key) && block(fm, key).some((l) => l.trim() && !/^\s*#/.test(l))) {
      source.issues.push(`unsupported nested ${key} metadata`);
      source.parsed.metadataSupported = false;
    }
  }
  let body;
  if (kind === "item") {
    for (const key of ["owner", "scope_authority", "completion_authority", "lease", "change_ref", "required_for_milestone", "depends_on", "review_requirements", "completed_reviews"]) requireField(key);
    const reviews = mapList("review_requirements", ["role", "kind"]);
    source.parsed.completedReviews = mapList("completed_reviews", ["role", "kind", "evidence", "verdict", "timestamp", "change_ref"]);
    if (source.parsed.completedReviews.length) source.issues.push("historical reviews retained, not current acceptance");
    const dependencies = mapList("depends_on", ["item", "requires"]);
    if (fields.review_requirements !== "" && fields.review_requirements !== "[]") source.issues.push("unsupported review requirements");
    reviews.forEach((r) => {
      if (!roleKnown(r.role, roles)) source.issues.push(`unavailable reviewer ${r.role}`);
    });
    if (!isNull(fields.change_ref)) source.issues.push("legacy revision needs explicit artifact registration");
    if (!["true", "false", "yes", "no"].includes(fields.required_for_milestone)) source.issues.push("unknown milestone requirement");
    body = {
      schema_version: 1,
      id: source.declaredId,
      title: fields.title,
      initiative: fields.initiative,
      delivery_class: fields.delivery_class,
      state: fields.state,
      resume_state: null,
      scope_authority: fields.scope_authority,
      completion_authority: fields.completion_authority,
      producer_actor: null,
      producing_actors: [],
      acceptance_actor: null,
      priority: Number(fields.priority),
      next_role: nullable(fields.next_role),
      outcome: fields.outcome ?? section(text, "Outcome"),
      acceptance: seen.has("acceptance") ? list("acceptance") : section(text, "Acceptance")?.split(/\r?\n/).map((l) => /^- \[[ x]\] (.+)$/.exec(l)?.[1]) ?? [],
      artifact_expectation: fields.artifact_expectation,
      artifact_expectation_reason: nullable(fields.artifact_expectation_reason),
      artifact_class: nullable(fields.artifact_class),
      durability: nullable(fields.durability),
      validity_owner: nullable(fields.validity_owner),
      artifact_targets: list("artifact_targets"),
      context_artifacts: list("context_artifacts"),
      touches: list("touches"),
      depends_on: dependencies,
      lease: null,
      recovery_hold: null,
      waiting_on_questions: list("waiting_on_questions"),
      required_for_milestone: ["true", "yes"].includes(fields.required_for_milestone),
      review_requirements: reviews,
      change_ref: null,
      updated_at: timestamp(fields.updated_at ?? fields.updated)
    };
    if (body.waiting_on_questions.length) source.issues.push("unresolved legacy blocking questions");
    if (fields.producer_run || fields.producer_actor || fields.producing_actors) source.issues.push("declared production history needs explicit revalidation");
    for (const path of [...body.context_artifacts, ...body.artifact_targets]) {
      try {
        if (path.startsWith("project:")) {
          source.issues.push(`project artifact requires explicit revalidation: ${path}`);
          continue;
        }
        if (!existsSync5(safePath(root, path))) source.issues.push(`missing artifact: ${path}`);
      } catch {
        source.issues.push(`unsafe artifact: ${path}`);
      }
    }
  } else {
    const milestones = mapList("milestones", ["id", "title", "delivery_class", "required_items", "status"], ["required_items"]).map((m) => ({
      id: m.id,
      title: m.title,
      delivery_class: m.delivery_class,
      required_items: m.required_items === "[]" ? [] : null,
      status: m.status
    }));
    const backlog = mapList("backlog", ["id", "title", "status", "item_id", "reason"]).map((b) => ({
      id: b.id,
      title: b.title,
      status: b.status,
      item_id: nullable(b.item_id),
      reason: nullable(b.reason)
    }));
    source.parsed.terminalMilestones = milestones.some((m) => TERMINAL.has(m.status));
    if (source.parsed.terminalMilestones) source.issues.push("historical terminal milestone closure is unverified");
    const scopeBlock = block(fm, "scope");
    let scopeCurrent;
    if (scopeBlock.some((l) => /^ {2}current:/.test(l))) {
      const nested = scopeBlock.map((l) => l.slice(2));
      if (fields.scope !== "" || scopeBlock.some((l) => l.trim() && !l.startsWith("  ")) || nested.filter((l) => /^\S/.test(l) && !/^#/.test(l)).length !== 1) {
        source.issues.push("unsupported scope mapping");
        source.parsed.metadataSupported = false;
      }
      const issues = [];
      scopeCurrent = collection(nested, "current", issues);
      if (issues.length) source.parsed.metadataSupported = false;
      source.issues.push(...issues.map((i) => `scope: ${i}`));
    } else scopeCurrent = list("scope");
    body = {
      schema_version: 1,
      id: source.declaredId,
      title: fields.title,
      status: fields.status,
      owner: fields.owner,
      scope: { current: scopeCurrent },
      milestones,
      backlog,
      north_star_ref: fields.north_star_ref ?? entry.path,
      updated_at: timestamp(fields.updated_at ?? fields.updated)
    };
    try {
      if (!existsSync5(safePath(root, body.north_star_ref))) source.issues.push("missing north star");
    } catch {
      source.issues.push("unsafe north star");
    }
  }
  const version = kind === "item" ? Number(fields.version) : Number(fields.version ?? 1);
  try {
    source.record = validateRecord({ kind, id: source.declaredId, itemId: kind === "item" ? source.declaredId : null, version, body });
  } catch (error) {
    source.issues.push(error.message);
    source.record = null;
  }
  if (!source.issues.length) source.status = "converted";
  return source;
}
function parseLegacySources(root, files, roles) {
  const sources = files.map((entry) => parseSource(root, entry, roles));
  const identities = /* @__PURE__ */ new Map();
  for (const source of sources) {
    if (!source.declaredId || !["item", "initiative"].includes(source.kind)) continue;
    const key = `${source.kind}/${source.declaredId}`;
    const group = identities.get(key) ?? [];
    group.push(source);
    identities.set(key, group);
  }
  for (const group of identities.values()) {
    if (group.length > 1) group.forEach((s) => {
      s.issues.push("ambiguous duplicate declared ID");
      s.status = "quarantined";
    });
  }
  for (const source of sources.filter((s) => s.kind === "item")) {
    if (sources.some((s) => s.kind === "thread" && s.parsed.itemId === source.declaredId && s.issues.length)) {
      source.issues.push("legacy thread has unresolved authority/history");
      source.status = "quarantined";
    }
  }
  let changed;
  do {
    changed = false;
    const safe = new Map(sources.filter((s) => s.status === "converted").map((s) => [`${s.kind}/${s.declaredId}`, s]));
    for (const s of safe.values()) {
      if (s.kind === "initiative") {
        const references = [
          ...s.record.body.milestones.flatMap((m) => m.required_items),
          ...s.record.body.backlog.map((b) => b.item_id).filter(Boolean)
        ];
        if (references.some((id) => !safe.has(`item/${id}`))) {
          s.issues.push("unresolved milestone/backlog item reference");
          s.status = "quarantined";
          changed = true;
        }
      }
      if (s.kind !== "item") continue;
      const body = s.record.body;
      if (!safe.has(`initiative/${body.initiative}`) || body.depends_on.some((d) => !safe.has(`item/${d.item}`))) {
        s.issues.push("unresolved initiative or dependency");
        s.status = "quarantined";
        changed = true;
      }
      const visiting = /* @__PURE__ */ new Set();
      const visit = (id) => {
        if (visiting.has(id)) return true;
        visiting.add(id);
        const cycle = (safe.get(`item/${id}`)?.record.body.depends_on ?? []).some((d) => visit(d.item));
        visiting.delete(id);
        return cycle;
      };
      if (visit(s.declaredId)) {
        s.issues.push("dependency cycle");
        s.status = "quarantined";
        changed = true;
      }
    }
  } while (changed);
  return sources;
}

// src/core/lib/coordination-runtime/migration.mjs
var inFlight = /* @__PURE__ */ new Set();
var repairs = /* @__PURE__ */ new WeakMap();
var json = (root, path) => JSON.parse(exactFile(root, path));
function confirmed(confirm) {
  if (confirm !== true) fail2("AUTHORITY_REQUIRED", "confirm:true must explicitly acknowledge offline migration/recovery");
}
function privateWorkspace(root, admit = false) {
  const privacy = privateAdmission(root, { admit });
  if (privacy.errors.length) fail2("INVALID_INPUT", privacy.errors.join("; "));
  return privacy;
}
function logicalDigest(store) {
  const db = store.database;
  const result = {};
  for (const table of ["records", "events", "operations", "legacy_sources"]) {
    result[table] = db.prepare(`SELECT * FROM ${table} ORDER BY 1, 2`).all().map((row) => Object.fromEntries(Object.entries(row).map(([key, v]) => [key, v instanceof Uint8Array ? Buffer.from(v).toString("hex") : v])));
  }
  result.metadata = db.prepare("SELECT * FROM metadata WHERE key != 'migration_baseline' ORDER BY key").all();
  return hash2(canonicalJson(result));
}
function finishStore(store) {
  const result = store.database.prepare("PRAGMA wal_checkpoint(TRUNCATE)").get();
  if (result.busy) fail2("STORE_BUSY", "staged WAL checkpoint is busy");
  closeStore(store);
}
function assertOffline(root) {
  const activity = read(root);
  if (activity.skipped) fail2("RECOVERY_REQUIRED", "malformed legacy activity prevents proving offline state");
  if (runs(activity.records, Date.now()).some((r) => r.open)) fail2("RECOVERY_REQUIRED", "active/unreconciled legacy run prevents offline migration");
}
function assertNoDatabase(root) {
  for (const name of [DATABASE, `${DATABASE}-wal`, `${DATABASE}-shm`, `${DATABASE}-journal`]) {
    if (existsSync6(safePath(root, name))) fail2("RECOVERY_REQUIRED", "existing or incomplete migration database requires explicit recovery; never copy a live WAL/main file");
  }
}
function receiptFor(root, plan) {
  return {
    id: plan.id,
    activated: true,
    backupPath: safePath(root, `${plan.directory}/backup`),
    sourceCount: plan.files.length,
    databasePath: safePath(root, DATABASE),
    privateAdmission: plan.privateAdmission
  };
}
function vacant(root, name) {
  if (existsSync6(safePath(root, name))) fail2("RECOVERY_REQUIRED", `unexpected existing migration target: ${name}`);
}
function verifyBackup(root, plan) {
  if (plan.schema_version !== 1 || !/^[0-9a-f-]{36}$/.test(plan.id) || plan.directory !== `${MIGRATIONS}/${plan.id}` || !Array.isArray(plan.files)) fail2("RECOVERY_REQUIRED", "invalid migration plan");
  const seen = /* @__PURE__ */ new Set();
  for (const entry of plan.files) {
    if (!entry || typeof entry.path !== "string" || seen.has(entry.path)) fail2("RECOVERY_REQUIRED", "invalid backup inventory");
    seen.add(entry.path);
    const file = fileFingerprint(root, `${plan.directory}/backup/${entry.path}`);
    if (file.size !== entry.size || file.digest !== entry.digest) fail2("RECOVERY_REQUIRED", `tampered migration backup: ${entry.path}`);
  }
  const original = exactFile(root, `${plan.directory}/backup/.kai/manifest.json`);
  if (hash2(original) !== plan.originalManifestDigest) fail2("RECOVERY_REQUIRED", "migration manifest backup mismatch");
}
function readyPlan(root, directory) {
  const planBytes = exactFile(root, `${directory}/plan.json`);
  const plan = JSON.parse(planBytes);
  if (plan.directory !== directory) fail2("RECOVERY_REQUIRED", "migration directory mismatch");
  const ready = json(root, `${directory}/ready.json`);
  if (ready.planDigest !== hash2(planBytes) || ready.id !== plan.id) fail2("RECOVERY_REQUIRED", "migration plan/ready identity mismatch");
  verifyBackup(root, plan);
  return { plan, ready };
}
function validateStagedStore(root, plan, ready, name) {
  const store = openStore({ path: safePath(root, name), mode: "read" });
  try {
    if (!canRollback(store) || logicalDigest(store) !== ready.stateDigest) fail2("RECOVERY_REQUIRED", "staged store changed or contains new runtime work");
    for (const row of store.database.prepare("SELECT kind,id FROM records").all()) readRecord(store, row.kind, row.id);
    const identity = JSON.parse(store.database.prepare("SELECT value FROM metadata WHERE key='migration'").get().value);
    if (identity.id !== plan.id || identity.root !== resolve5(root) || identity.workspaceId !== plan.workspaceId) {
      fail2("RECOVERY_REQUIRED", "staged store belongs to another workspace/migration");
    }
  } finally {
    closeStore(store);
  }
}
function activatedManifestBytes(root, plan) {
  const original = JSON.parse(exactFile(root, `${plan.directory}/backup/.kai/manifest.json`));
  return Buffer.from(`${JSON.stringify({ ...original, schema_version: 4, coordination_migration: {
    id: plan.id,
    directory: plan.directory,
    readyDigest: hash2(exactFile(root, `${plan.directory}/ready.json`))
  } }, null, 2)}
`);
}
function activate(root, plan, ready, env) {
  migrationManifest(root, [3], env);
  privateWorkspace(root);
  assertOffline(root);
  verifyBackup(root, plan);
  const retained = readyPlan(root, plan.directory);
  if (canonicalJson(retained.plan) !== canonicalJson(plan) || canonicalJson(retained.ready) !== canonicalJson(ready)) {
    fail2("RECOVERY_REQUIRED", "migration plan or ready state changed before activation");
  }
  sameSnapshot(plan.files, sourceSnapshot(root));
  const staged = `${plan.directory}/staged.sqlite`;
  if (!existsSync6(safePath(root, DATABASE))) {
    assertNoDatabase(root);
    validateStagedStore(root, plan, ready, staged);
    vacant(root, DATABASE);
    renameSync(safePath(root, staged), safePath(root, DATABASE));
  } else {
    if (existsSync6(safePath(root, staged))) fail2("RECOVERY_REQUIRED", "both staged and final databases exist; cannot choose authority");
    validateStagedStore(root, plan, ready, DATABASE);
  }
  sameSnapshot(plan.files, sourceSnapshot(root));
  verifyBackup(root, plan);
  const bytes = activatedManifestBytes(root, plan);
  const stageManifest = `${plan.directory}/manifest-4.json`;
  if (existsSync6(safePath(root, stageManifest))) {
    if (!exactFile(root, stageManifest).equals(bytes)) fail2("RECOVERY_REQUIRED", "unexpected changed manifest stage");
  } else exclusiveFile(root, stageManifest, bytes);
  sameSnapshot(plan.files, sourceSnapshot(root));
  renameSync(safePath(root, stageManifest), safePath(root, ".kai/manifest.json"));
  return receiptFor(root, plan);
}
function releaseLock(root, expected) {
  if (!exactFile(root, LOCK).equals(Buffer.from(expected))) fail2("RECOVERY_REQUIRED", "migration lock changed; refusing removal");
  unlinkSync(safePath(root, LOCK));
}
function migrateWorkspace({ root, confirm, roles = [], env = process.env } = {}) {
  confirmed(confirm);
  const manifest = migrationManifest(root, [3], env);
  if (!Array.isArray(roles) || roles.some((r) => typeof r !== "string")) fail2("INVALID_INPUT", "installed role identities must be supplied");
  if (inFlight.has(root) || existsSync6(safePath(root, LOCK))) fail2("RECOVERY_REQUIRED", "incomplete or competing migration; inspect and explicitly recover");
  const privacy = privateWorkspace(root, true);
  assertNoDatabase(root);
  assertOffline(root);
  const id = randomUUID();
  const directory = `${MIGRATIONS}/${id}`;
  const lockBytes = canonicalJson({ id, directory, pid: process.pid });
  exclusiveFile(root, LOCK, lockBytes);
  inFlight.add(root);
  let store;
  try {
    const files = sourceSnapshot(root);
    const sources = parseLegacySources(root, files, roles);
    mkdirSync4(safePath(root, MIGRATIONS), { recursive: true });
    mkdirSync4(safePath(root, directory), { recursive: false });
    const plan = {
      schema_version: 1,
      id,
      directory,
      workspaceId: manifest.workspace_id,
      root: resolve5(root),
      files,
      privateAdmission: privacy.admitted,
      originalManifestDigest: hash2(exactFile(root, ".kai/manifest.json"))
    };
    exclusiveFile(root, `${directory}/plan.json`, canonicalJson(plan));
    for (const file of files) {
      const target = safePath(root, `${directory}/backup/${file.path}`);
      mkdirSync4(dirname6(target), { recursive: true });
      copyFileSync(safePath(root, file.path), target, constants.COPYFILE_EXCL);
      const fd = openSync3(target, "r+");
      try {
        fsyncSync2(fd);
      } finally {
        closeSync3(fd);
      }
      chmodSync(target, 256);
    }
    verifyBackup(root, plan);
    sameSnapshot(files, sourceSnapshot(root));
    exclusiveFile(root, `${directory}/staged.sqlite`, Buffer.alloc(0));
    store = openStore({ path: safePath(root, `${directory}/staged.sqlite`), mode: "create" });
    store.database.exec(`BEGIN IMMEDIATE;
      CREATE TABLE legacy_sources (
        source_id TEXT PRIMARY KEY, path TEXT NOT NULL UNIQUE, digest TEXT NOT NULL,
        kind TEXT NOT NULL, declared_id TEXT, size INTEGER NOT NULL, backup_path TEXT NOT NULL, parsed TEXT NOT NULL,
        issues TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL
      );`);
    const insert = store.database.prepare("INSERT INTO legacy_sources VALUES (?,?,?,?,?,?,?,?,?,?,?)");
    for (const source of sources) {
      insert.run(
        source.sourceId,
        source.path,
        source.digest,
        source.kind,
        source.declaredId,
        source.size,
        `${directory}/backup/${source.path}`,
        JSON.stringify(source.parsed),
        canonicalJson(source.issues),
        source.status,
        source.version
      );
      if (source.status === "converted") {
        const r = source.record;
        store.database.prepare("INSERT INTO records VALUES (?,?,?,?,?)").run(r.kind, r.id, r.itemId, r.version, canonicalJson(r.body));
      }
    }
    store.database.prepare("INSERT INTO events(operation_id,item_id,payload) VALUES(?,NULL,?)").run(
      id,
      canonicalJson({
        kind: "workspace.migrate",
        actor: null,
        sourceSchema: 3,
        migrationId: id,
        sourceCount: sources.length,
        provenance: "legacy-declared",
        timestamp: null
      })
    );
    store.database.prepare("INSERT INTO metadata VALUES (?,?)").run(
      "migration",
      canonicalJson({ id, root: resolve5(root), workspaceId: manifest.workspace_id, directory })
    );
    const stateDigest = logicalDigest(store);
    store.database.prepare("INSERT INTO metadata VALUES (?,?)").run("migration_baseline", stateDigest);
    store.database.exec("COMMIT");
    finishStore(store);
    const ready = { id, planDigest: hash2(exactFile(root, `${directory}/plan.json`)), stateDigest };
    exclusiveFile(root, `${directory}/ready.json`, canonicalJson(ready));
    const receipt = activate(root, plan, ready, env);
    releaseLock(root, lockBytes);
    return receipt;
  } finally {
    closeStore(store);
    inFlight.delete(root);
  }
}
function canRollback(store) {
  return readSnapshot(store, () => {
    const baseline = store.database.prepare("SELECT value FROM metadata WHERE key='migration_baseline'").get();
    return !!baseline && logicalDigest(store) === baseline.value;
  });
}
function recoverMigration({ root, confirm, action, env = process.env } = {}) {
  confirmed(confirm);
  migrationManifest(root, [3, 4], env);
  if (!["activate", "abandon"].includes(action)) fail2("INVALID_INPUT", "recovery action must be activate or abandon");
  if (inFlight.has(root)) fail2("STORE_BUSY", "migration is active in this process");
  const lockBytes = exactFile(root, LOCK);
  const lock = JSON.parse(lockBytes);
  if (lock.directory !== `${MIGRATIONS}/${lock.id}` || !/^[0-9a-f-]{36}$/.test(lock.id) || !Number.isSafeInteger(lock.pid) || lock.pid < 1) fail2("RECOVERY_REQUIRED", "unrecognized migration lock");
  if (lock.pid !== process.pid) {
    try {
      process.kill(lock.pid, 0);
      fail2("STORE_BUSY", "migration owner process is still active");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
  const recoveryLock = `${lock.directory}/recovery.lock`;
  exclusiveFile(root, recoveryLock, lockBytes);
  try {
    const m = migrationManifest(root, [3, 4], env);
    if (m.schema_version === 4) {
      const { plan: plan2 } = activePlan(root, m);
      if (plan2.id !== lock.id || action !== "activate") fail2("RECOVERY_REQUIRED", "activated migration requires rollback API");
      const { ready: ready2 } = readyPlan(root, lock.directory);
      validateStagedStore(root, plan2, ready2, DATABASE);
      releaseLock(root, lockBytes);
      return receiptFor(root, plan2);
    }
    if (action === "abandon") {
      if (existsSync6(safePath(root, DATABASE))) {
        const { plan: plan2, ready: ready2 } = readyPlan(root, lock.directory);
        validateStagedStore(root, plan2, ready2, DATABASE);
        vacant(root, `${lock.directory}/abandoned.sqlite`);
        renameSync(safePath(root, DATABASE), safePath(root, `${lock.directory}/abandoned.sqlite`));
      }
      releaseLock(root, lockBytes);
      return { id: lock.id, activated: false, abandoned: true, retainedPath: safePath(root, lock.directory) };
    }
    const { plan, ready } = readyPlan(root, lock.directory);
    const receipt = activate(root, plan, ready, env);
    releaseLock(root, lockBytes);
    return receipt;
  } finally {
    if (!exactFile(root, recoveryLock).equals(lockBytes)) fail2("RECOVERY_REQUIRED", "recovery lock changed; preserving it");
    unlinkSync(safePath(root, recoveryLock));
  }
}
function activePlan(root, manifest = migrationManifest(root, [4])) {
  const identity = manifest.coordination_migration;
  if (!identity || identity.directory !== `${MIGRATIONS}/${identity.id}`) fail2("RECOVERY_REQUIRED", "no recognized migration backup");
  const bytes = exactFile(root, `${identity.directory}/ready.json`);
  if (hash2(bytes) !== identity.readyDigest) fail2("RECOVERY_REQUIRED", "changed migration receipt");
  const { plan, ready } = readyPlan(root, identity.directory);
  if (plan.id !== identity.id || plan.workspaceId !== manifest.workspace_id || plan.root !== resolve5(root)) fail2("RECOVERY_REQUIRED", "migration workspace identity mismatch");
  return { plan, ready };
}
function verifyMigration(root, { env = process.env } = {}) {
  const { plan, ready } = activePlan(root, migrationManifest(root, [4], env));
  return { plan, ready };
}
function rollbackMigration({ root, confirm, env = process.env } = {}) {
  confirmed(confirm);
  const manifest = migrationManifest(root, [4], env);
  const { plan, ready } = activePlan(root, manifest);
  const activatedManifest = activatedManifestBytes(root, plan);
  if (!exactFile(root, ".kai/manifest.json").equals(activatedManifest)) fail2("RECOVERY_REQUIRED", "manifest changed after migration; rollback will not overwrite user edits");
  vacant(root, `${plan.directory}/rolled-back.sqlite`);
  if (existsSync6(safePath(root, LOCK))) fail2("RECOVERY_REQUIRED", "finish pending migration recovery first");
  const lockBytes = canonicalJson({ id: plan.id, directory: plan.directory, pid: process.pid, rollback: true });
  exclusiveFile(root, LOCK, lockBytes);
  let store;
  try {
    privateWorkspace(root);
    verifyBackup(root, plan);
    const live = sourceSnapshot(root).filter((e) => e.path !== ".kai/manifest.json");
    const original = plan.files.filter((e) => e.path !== ".kai/manifest.json");
    sameSnapshot(original, live);
    validateStagedStore(root, plan, ready, DATABASE);
    store = openStore({ path: safePath(root, DATABASE), mode: "write" });
    store.database.exec("BEGIN IMMEDIATE");
    if (!canRollbackInTransaction(store, ready)) fail2("RECOVERY_REQUIRED", "new runtime work prevents rollback");
    store.database.exec("COMMIT");
    finishStore(store);
    const bytes = exactFile(root, `${plan.directory}/backup/.kai/manifest.json`);
    const next = `${plan.directory}/rollback-manifest-${randomUUID()}.json`;
    exclusiveFile(root, next, bytes);
    sameSnapshot(original, sourceSnapshot(root).filter((e) => e.path !== ".kai/manifest.json"));
    if (!exactFile(root, ".kai/manifest.json").equals(activatedManifest)) fail2("RECOVERY_REQUIRED", "manifest changed during rollback");
    vacant(root, `${plan.directory}/rolled-back.sqlite`);
    renameSync(safePath(root, next), safePath(root, ".kai/manifest.json"));
    renameSync(safePath(root, DATABASE), safePath(root, `${plan.directory}/rolled-back.sqlite`));
    releaseLock(root, lockBytes);
    return { id: plan.id, rolledBack: true, backupPath: safePath(root, `${plan.directory}/backup`) };
  } catch (error) {
    if (store && !store.closed) {
      try {
        store.database.exec("ROLLBACK");
      } catch {
      }
    }
    if (migrationManifest(root, [3, 4], env).schema_version === 4) releaseLock(root, lockBytes);
    throw error;
  } finally {
    closeStore(store);
  }
}
function canRollbackInTransaction(store, ready) {
  return logicalDigest(store) === ready.stateDigest;
}
function readLegacyRecords(store, { sourceId, includeRaw = false } = {}) {
  if (includeRaw && typeof sourceId !== "string") fail2("INVALID_INPUT", "raw legacy reads require a single sourceId");
  const table = store.database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='legacy_sources'").get();
  if (!table) return [];
  const columns = store.database.prepare("PRAGMA table_info(legacy_sources)").all().map((c) => c.name);
  if (columns.includes("raw") || !columns.includes("backup_path") || !columns.includes("size")) {
    fail2("SCHEMA_MISMATCH", "legacy source storage requires external backup references; no automatic database rewrite is supported");
  }
  const select = "SELECT source_id,path,digest,kind,declared_id,size,backup_path,parsed,issues,status,version FROM legacy_sources";
  const rows = sourceId === void 0 ? store.database.prepare(`${select} ORDER BY path`).all() : store.database.prepare(`${select} WHERE source_id=?`).all(sourceId);
  return rows.map((r) => {
    const source = {
      sourceId: r.source_id,
      path: r.path,
      digest: r.digest,
      kind: r.kind,
      declaredId: r.declared_id,
      size: r.size,
      backupPath: r.backup_path,
      parsed: JSON.parse(r.parsed),
      issues: JSON.parse(r.issues),
      status: r.status,
      version: r.version
    };
    if (includeRaw) {
      const identity = JSON.parse(store.database.prepare("SELECT value FROM metadata WHERE key='migration'").get().value);
      if (source.backupPath !== `${MIGRATIONS}/${identity.id}/backup/${source.path}` || identity.directory !== `${MIGRATIONS}/${identity.id}` || source.sourceId !== hash2(source.path)) fail2("EVIDENCE_GAP", "invalid legacy backup reference");
      const root = identity.root;
      const canonical = safePath(root, DATABASE);
      const retained = ["staged.sqlite", "rolled-back.sqlite", "abandoned.sqlite"].map((n) => safePath(root, `${identity.directory}/${n}`));
      if (![canonical, ...retained].includes(resolve5(store.path))) fail2("EVIDENCE_GAP", "legacy backup belongs to another store/root");
      source.raw = exactFile(root, source.backupPath);
      if (source.raw.length !== source.size || hash2(source.raw) !== source.digest) fail2("EVIDENCE_GAP", "legacy backup size/digest changed");
    }
    return source;
  });
}
function bindMigrationRepair(store, { root, roles, verify } = {}) {
  migrationManifest(root, [4]);
  if (store.closed || store.mode === "read" || resolve5(store.path) !== safePath(root, DATABASE) || !Array.isArray(roles) || typeof verify !== "function") fail2("AUTHORITY_REQUIRED", "repair requires explicit store/root and trusted host verifier");
  repairs.set(store, { root, roles: [...roles], verify });
}
function repairLegacyRecord(store, request) {
  const binding = repairs.get(store);
  if (!binding || store.closed) fail2("AUTHORITY_REQUIRED", "bind a trusted host repair verifier first");
  const input = JSON.parse(canonicalJson(request));
  assertExactKeys(input, /* @__PURE__ */ new Set(["operationId", "sourceId", "expectedVersion", "actor", "reason", "body"]), "legacy repair");
  validateActor(input.actor);
  if (!/^[0-9a-f-]{36}$/.test(input.operationId) || typeof input.reason !== "string" || !input.reason.trim()) fail2("INVALID_INPUT", "repair requires operation UUID and rationale");
  const digest2 = hash2(canonicalJson(input));
  store.database.exec("BEGIN IMMEDIATE");
  try {
    assertWorkspaceWrite(store.path, { requirePrivate: true });
    migrationManifest(binding.root, [4]);
    const previous = store.database.prepare("SELECT * FROM operations WHERE id=?").get(input.operationId);
    if (previous) {
      if (previous.payload_digest !== digest2) fail2("OPERATION_CONFLICT", "repair operation reused with changed content");
      store.database.exec("COMMIT");
      return JSON.parse(previous.receipt);
    }
    const source = readLegacyRecords(store, { sourceId: input.sourceId, includeRaw: true })[0];
    if (!source || source.status !== "quarantined" || source.version !== input.expectedVersion) fail2("VERSION_CONFLICT", "quarantine source missing, changed or already repaired");
    if (!source.declaredId || !["item", "initiative"].includes(source.kind)) fail2("INVALID_INPUT", "only records with a declared original identity can be revalidated");
    if (hash2(source.raw) !== source.digest) fail2("EVIDENCE_GAP", "legacy source bytes changed; cannot revalidate unverified history");
    const history = source.parsed;
    const fields = history.fields ?? {};
    const lifecycle = fields[source.kind === "initiative" ? "status" : "state"];
    if (history.metadataSupported !== true || history.identityUnresolved || history.lifecycleAmbiguous || isNull(lifecycle) || fields.state !== void 0 && fields.status !== void 0 && fields.state !== fields.status) {
      fail2("INVALID_INPUT", "ambiguous or unsupported source history requires offline reconciliation, not partial repair");
    }
    if (history.terminalHistory || [fields.state, fields.status].some((state) => TERMINAL.has(state) || state === "archived")) {
      fail2("INVALID_INPUT", "historical completed/shipped work cannot be reopened");
    }
    if (source.path.startsWith(".kai/archive/") || source.parsed.terminalMilestones) {
      fail2("INVALID_INPUT", "historical archived work or terminal milestones cannot be reopened");
    }
    if (readLegacyRecords(store).filter((s) => s.kind === source.kind && s.declaredId === source.declaredId).length !== 1) fail2("INVALID_INPUT", "duplicate declared identity requires explicit source reconciliation");
    if (readRecord(store, source.kind, source.declaredId)) fail2("VERSION_CONFLICT", "runtime record already exists");
    const originalVersion = source.parsed.fields?.version ?? (source.kind === "initiative" ? "1" : null);
    if (typeof originalVersion !== "string" || !/^[1-9]\d*$/.test(originalVersion) || !Number.isSafeInteger(Number(originalVersion))) {
      fail2("INVALID_INPUT", "unknown or unsupported original version history cannot be revalidated");
    }
    const record = validateRecord({
      kind: source.kind,
      id: source.declaredId,
      itemId: source.kind === "item" ? source.declaredId : null,
      version: Number(originalVersion),
      body: input.body
    });
    if (record.kind === "item") {
      const b = record.body;
      if (b.state !== "proposed" || b.lease !== null || b.change_ref !== null || b.producer_actor !== null || b.acceptance_actor !== null || b.producing_actors.length || b.waiting_on_questions.length || b.recovery_hold !== null) {
        fail2("INVALID_INPUT", "revalidation starts proposed scope, never historical production or acceptance");
      }
      for (const role of [b.scope_authority, b.completion_authority, b.next_role, ...b.review_requirements.map((r) => r.role)].filter(Boolean)) {
        if (!roleKnown(role, binding.roles)) fail2("ROLE_UNAVAILABLE", `unavailable repair role: ${role}`);
      }
      if (!readRecord(store, "initiative", b.initiative) || b.depends_on.some((d) => !readRecord(store, "item", d.item))) fail2("EVIDENCE_GAP", "repair has unresolved initiative/dependencies");
      captureInputBasis({ root: binding.root }, { get: (kind, id) => readRecord(store, kind, id) }, b.context_artifacts);
      for (const path of b.artifact_targets) assertWorkspacePath(binding.root, path);
    } else if (!["proposed", "active", "paused"].includes(record.body.status) || !roleKnown(record.body.owner, binding.roles) || record.body.milestones.some((m) => TERMINAL.has(m.status))) {
      fail2("INVALID_INPUT", "initiative repair cannot fabricate closure or an unavailable owner");
    } else {
      exactBytes(binding.root, record.body.north_star_ref);
      for (const id of [
        ...record.body.milestones.flatMap((m) => m.required_items),
        ...record.body.backlog.map((b) => b.item_id).filter(Boolean)
      ]) {
        if (!readRecord(store, "item", id)) fail2("EVIDENCE_GAP", "initiative repair has an unresolved item reference");
      }
    }
    if (!roleKnown(input.actor.role, binding.roles) || binding.verify({ request: input, source, record }) !== true) fail2("AUTHORITY_REQUIRED", "explicit repair/revalidation decision not verified by host");
    migrationManifest(binding.root, [4]);
    assertWorkspaceWrite(store.path, { requirePrivate: true });
    store.database.prepare("INSERT INTO records VALUES (?,?,?,?,?)").run(record.kind, record.id, record.itemId, record.version, canonicalJson(record.body));
    store.database.prepare("UPDATE legacy_sources SET status='revalidated',version=version+1 WHERE source_id=?").run(source.sourceId);
    const event = store.database.prepare("INSERT INTO events(operation_id,item_id,payload) VALUES(?,?,?)").run(
      input.operationId,
      record.itemId,
      canonicalJson({
        kind: "legacy.revalidate",
        actor: input.actor,
        sourceId: source.sourceId,
        sourceDigest: source.digest,
        sourcePath: source.path,
        sourceSize: source.size,
        sourceBackupPath: source.backupPath,
        reason: input.reason,
        recordKind: record.kind,
        recordId: record.id,
        body: record.body
      })
    );
    const receipt = { ok: true, operationId: input.operationId, recordVersion: record.version, eventSeq: Number(event.lastInsertRowid), data: { record } };
    store.database.prepare("INSERT INTO operations VALUES(?,?,?)").run(input.operationId, digest2, canonicalJson(receipt));
    store.database.exec("COMMIT");
    return receipt;
  } catch (error) {
    store.database.exec("ROLLBACK");
    throw error;
  }
}

// src/core/lib/coordination-runtime/authority.mjs
function fail3(code, message) {
  throw new RuntimeError(code, message);
}
function sameActor(left, right) {
  return left?.role === right?.role && left?.runId === right?.runId;
}
function requireRoleAvailable(role, authority, label) {
  if (role !== "operator" && !authority.roles.includes(role)) {
    fail3("ROLE_UNAVAILABLE", `${label} role "${role}" is not available`);
  }
}
function requireActorAvailable(command, authority) {
  requireRoleAvailable(command.actor.role, authority, "actor");
}
function hostGrantMatches(grant, command, action) {
  return sameActor(grant.actor, command.actor) && grant.actions.includes(action) && grant.recordKind === command.recordKind && grant.recordId === command.recordId && grant.basisRef === `${command.recordKind}/${command.recordId}@${command.expectedVersion}`;
}
function persistedGrantMatches(record, command, action) {
  const grant = record.body;
  return grant.status === "active" && sameActor(grant.actor, command.actor) && grant.actions.includes(action) && grant.record_kind === command.recordKind && grant.record_id === command.recordId && grant.lease_token === command.leaseToken && Date.parse(grant.expires_at) > Date.now();
}
function hasHostActionGrant(command, authority, action) {
  return authority.grants.some((grant) => hostGrantMatches(grant, command, action));
}
function requireActionGrant(tx, command, authority, action) {
  const allowed = hasHostActionGrant(command, authority, action) || command.leaseToken !== null && tx.list("grant", command.recordId).some((record) => persistedGrantMatches(record, command, action));
  if (!allowed) {
    fail3(
      "AUTHORITY_REQUIRED",
      `${command.actor.role} lacks explicit ${action} authority for ${command.recordKind}/${command.recordId}`
    );
  }
}
function requireHostActionGrant(command, authority, action) {
  if (!hasHostActionGrant(command, authority, action)) {
    fail3(
      "AUTHORITY_REQUIRED",
      `${command.actor.role} lacks trusted host ${action} authority for ${command.recordKind}/${command.recordId}`
    );
  }
}
function requireNamedAuthority(tx, command, authority, action, role) {
  if (command.actor.role !== role) {
    fail3(
      "AUTHORITY_REQUIRED",
      `${action} requires declared authority "${role}", not "${command.actor.role}"`
    );
  }
  requireHostActionGrant(command, authority, action);
}
function leaseIsLive(lease2) {
  return lease2 !== null && Date.parse(lease2.expires_at) > Date.now();
}
function requireLease(item, command) {
  if (item.body.lease !== null && !leaseIsLive(item.body.lease)) {
    fail3("RECOVERY_REQUIRED", `item/${item.id} lease expired and must be reconciled`);
  }
  if (item.body.lease === null || !sameActor(item.body.lease.holder, command.actor) || item.body.lease.token !== command.leaseToken) {
    fail3("LEASE_CONFLICT", `command does not hold the current lease for item/${item.id}`);
  }
}
function requireActingAuthority(tx, item, command, authority, action) {
  if (item.body.lease === null) {
    requireHostActionGrant(command, authority, action);
    return;
  }
  requireLease(item, command);
  requireActionGrant(tx, command, authority, action);
}

// src/core/lib/coordination-runtime/acceptance-verdicts.mjs
function matchesAcceptance(record, item) {
  return record.item_id === item.id && record.criteria_ref === criteriaRef(item) && subjectEquals(record.subject, item.change_ref);
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
function effectiveReviews(reviews, item) {
  return effectiveRecords(
    reviews.filter((review) => matchesAcceptance(review, item)),
    "review_id",
    (review) => canonicalJson([review.reviewer.role, review.kind]),
    (review) => !isProducingRun(item, review.reviewer)
  );
}
function effectiveApprovals(approvals, item) {
  const relevant = approvals.filter((approval) => approval.kind === "operator-recovery-resolution" ? approval.item_id === item.id && approval.criteria_ref === criteriaRef(item) && approval.recovery.attempt_id === item.recovery_hold : matchesAcceptance(approval, item));
  return effectiveRecords(
    relevant,
    "approval_id",
    (approval) => canonicalJson([approval.authority.role, approval.kind, approval.recovery?.attempt_id ?? null]),
    (approval) => approval.kind !== "completion" || !isProducingRun(item, approval.authority)
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
function effectiveEvidence(evidence, item) {
  return effectiveRecords(
    evidence.filter((record) => matchesAcceptance(record, item)),
    "evidence_id",
    evidenceScope,
    () => true
  );
}

// src/core/lib/coordination-runtime/evidence-context.mjs
import { isAbsolute as isAbsolute4, join as join5 } from "node:path";
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
  if (!store || store.closed || !isAbsolute4(store.path) || normalized(store.path) !== normalized(join5(options.root, ".kai", "state", "coordination.sqlite"))) {
    fail("INVALID_INPUT", "evidence workspace must be explicitly bound to this store");
  }
  assertWorkspacePath(options.root, ".kai/state/coordination.sqlite");
  validateAuthority(options.authority);
  if (!Array.isArray(options.runs)) fail("INVALID_INPUT", "approved run bindings must be an array");
  const actors = /* @__PURE__ */ new Set();
  const directories = /* @__PURE__ */ new Set();
  for (const run of options.runs) {
    assertExactKeys(run, /* @__PURE__ */ new Set(["actor", "directory"]), "approved run");
    validateActor(run.actor);
    const directory = durablePath(run.directory);
    if (directory !== run.directory || !directory.startsWith(".kai/runs/") || actors.has(canonicalJson(run.actor)) || directories.has(directory.toLowerCase())) {
      fail("INVALID_INPUT", "approved run directories must be unique private run paths");
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
function hasPublicationHistory(asset) {
  return asset.history.some((h) => ["published", "retracted"].includes(h.disposition) || h.target.startsWith("project:") && !h.target.endsWith(":@git") && h.validity === "current");
}
function verifyAssetContent(context, tx, asset) {
  const artifact = tx.get("artifact", asset.artifact_id);
  if (!artifact || artifact.itemId !== asset.item_id) fail("EVIDENCE_GAP", "asset has no registered artifact");
  verifyArtifact(context.root, artifact.body);
  verifyInputBasis(context, tx, artifact.body.input_basis ?? []);
  const initial = artifact.body.subject.kind === "sha256" ? artifact.body.subject.path : artifact.body.manifest_path ?? `project:${artifact.body.project_id}:@git`;
  if (asset.target !== initial || asset.history.some((h) => ["working", "published"].includes(h.disposition))) {
    verifyTarget(context.root, asset.target, artifact.body);
  }
  return artifact.body;
}
function verifyRegisteredArtifact(context, tx, record) {
  verifyInputBasis(context, tx, record.body.input_basis ?? []);
  const assets = tx.list("asset", record.itemId).filter((asset) => asset.body.artifact_id === record.id);
  if (assets.length === 0) verifyArtifact(context.root, record.body);
  else assets.forEach((asset) => verifyAssetContent(context, tx, asset.body));
}
function artifactBasisCurrent(context, tx, item, artifact) {
  return artifact.criteria_ref === criteriaRef(item.body) && item.body.context_artifacts.every((ref) => artifact.input_basis?.some((b) => b.reference === ref)) && inputBasisCurrent(context, tx, artifact.input_basis ?? []);
}
function subjectArtifact(context, tx, item, subject, acceptingActor = null) {
  const history = tx.list("artifact", item.id).filter((record) => subjectEquals(record.body.subject, subject));
  if (acceptingActor && (isProducingRun(item.body, acceptingActor) || history.some((record) => record.body.producer.runId === acceptingActor.runId))) {
    fail("AUTHORITY_REQUIRED", "a producing run cannot independently accept its exact subject");
  }
  const candidates = history.filter((record) => artifactBasisCurrent(context, tx, item, record.body));
  if (candidates.length === 0) fail("EVIDENCE_GAP", "exact current subject has no registered retained artifact");
  for (const candidate of candidates) verifyRegisteredArtifact(context, tx, candidate);
}
function verifyReferences(context, tx, item, refs, { recovery: recovery2 = false, positive = true } = {}) {
  const artifacts = [];
  const visit = (ref, seen) => {
    const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(ref);
    if (!match || seen.has(ref)) fail("EVIDENCE_GAP", "references must name registered acyclic artifact/evidence records");
    const [, kind, id] = match;
    const record = tx.get(kind, id);
    if (!record || record.itemId !== item.id) fail("EVIDENCE_GAP", "referenced evidence is missing or belongs to another item");
    if (kind === "artifact") {
      if (record.body.criteria_ref !== criteriaRef(item.body)) fail("EVIDENCE_GAP", "artifact criteria changed");
      verifyRegisteredArtifact(context, tx, record);
      artifacts.push(record.body);
    } else {
      if (!recovery2 && !matchesAcceptance(record.body, item.body)) fail("EVIDENCE_GAP", "referenced evidence is not current");
      if (!recovery2 && positive) {
        const effective = effectiveEvidence(tx.list("evidence", item.id).map((r) => r.body), item.body);
        const scoped = effective.filter((b) => evidenceScope(b) === evidenceScope(record.body));
        if (!effective.some((b) => b.evidence_id === id) || scoped.some((b) => !(/* @__PURE__ */ new Set(["clear", "waived", "passed"])).has(b.outcome))) {
          fail("EVIDENCE_GAP", "superseded or negative evidence cannot establish acceptance");
        }
      }
      record.body.evidence_refs.forEach((child) => visit(child, /* @__PURE__ */ new Set([...seen, ref])));
    }
  };
  refs.forEach((ref) => visit(ref, /* @__PURE__ */ new Set()));
  return artifacts;
}
function verifyVerdict(tx, item, verdict, actor = null) {
  const context = contextFor(tx);
  subjectArtifact(context, tx, item, verdict.subject, actor);
  verifyReferences(context, tx, item, [...verdict.evidence_refs, ...verdict.finding_refs ?? []]);
}

// src/core/lib/coordination-runtime/acceptance.mjs
function fail4(code, message) {
  throw new RuntimeError(code, message);
}
function bodies(tx, kind, item) {
  return tx.list(kind, item.id).map((record) => record.body);
}
function requireReviews(tx, item) {
  const reviews = effectiveReviews(bodies(tx, "review", item), item.body);
  for (const requirement of item.body.review_requirements) {
    const matching = reviews.filter((review) => review.reviewer.role === requirement.role && review.kind === requirement.kind);
    if (matching.length === 0) {
      fail4("EVIDENCE_GAP", `item/${item.id} lacks current ${requirement.role} ${requirement.kind} review`);
    }
    const independent = matching.filter((review) => !isProducingRun(item.body, review.reviewer));
    if (independent.length === 0) {
      fail4("AUTHORITY_REQUIRED", "a producing run cannot review its own subject");
    }
    if (independent.some((review) => review.verdict !== "approved")) {
      fail4("EVIDENCE_GAP", `item/${item.id} has an unresolved negative ${requirement.kind} review`);
    }
    if (requirement.kind === "product-design-acceptance" && (requirement.role !== item.body.completion_authority || item.body.producing_actors.some((actor) => actor.role === requirement.role))) {
      fail4("AUTHORITY_REQUIRED", "product-design acceptance requires an independent completion authority");
    }
    independent.forEach((review) => verifyVerdict(tx, item, review, review.reviewer));
  }
}
function completionApproval(tx, item) {
  const matching = effectiveApprovals(bodies(tx, "approval", item), item.body).filter((approval) => approval.kind === "completion" && approval.authority.role === item.body.completion_authority);
  if (matching.length === 0) {
    fail4("EVIDENCE_GAP", `item/${item.id} lacks current completion-authority approval`);
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
  const evidence = effectiveEvidence(bodies(tx, "evidence", item), item.body).filter((record) => record.kind === "dod-dimension");
  for (const dimension of DOD_DIMENSIONS) {
    const matching = evidence.filter((record) => record.dimension === dimension);
    if (matching.length === 0 || matching.some((record) => record.outcome === "gap")) {
      fail4("EVIDENCE_GAP", `item/${item.id} lacks accepted ${dimension} evidence for its current criteria`);
    }
    matching.forEach((record) => verifyVerdict(tx, item, record));
  }
}
function requireOperatorApproval(tx, item, kind) {
  const approvals = effectiveApprovals(bodies(tx, "approval", item), item.body).filter((approval) => approval.kind === kind && approval.authority.role === "operator");
  if (approvals.length === 0 || approvals.some((approval) => approval.decision !== "approved")) {
    fail4("AUTHORITY_REQUIRED", `item/${item.id} lacks effective ${kind} operator confirmation`);
  }
  if (new Set(approvals.map((approval) => canonicalJson(approval.deployment))).size !== 1) {
    fail4("AUTHORITY_REQUIRED", "operator confirmations disagree about the production deployment");
  }
  approvals.forEach((approval) => verifyVerdict(tx, item, approval, approval.authority));
  return approvals[0];
}
function requireDeploymentEvidence(tx, item, kind) {
  const start = requireOperatorApproval(tx, item, "operator-deploy-start");
  const complete = requireOperatorApproval(tx, item, "operator-deploy-complete");
  if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment)) {
    fail4("AUTHORITY_REQUIRED", "deployment completion does not match the confirmed production start");
  }
  const evidence = effectiveEvidence(bodies(tx, "evidence", item), item.body).filter((record) => record.kind === kind && record.data.environment === start.deployment.environment && record.data.deployment_id === start.deployment.deployment_id);
  if (evidence.length === 0 || evidence.some((record) => record.outcome !== "passed")) {
    fail4("EVIDENCE_GAP", `item/${item.id} lacks passed ${kind} evidence for the confirmed production deployment`);
  }
  evidence.forEach((record) => verifyVerdict(tx, item, record));
}
function recoveryResolution(tx, item, approvalId) {
  const approvals = effectiveApprovals(bodies(tx, "approval", item), item.body).filter((approval2) => approval2.kind === "operator-recovery-resolution" && approval2.authority.role === "operator");
  const approval = approvals.find((candidate) => candidate.approval_id === approvalId);
  const attempt = tx.get("attempt", item.body.recovery_hold);
  if (!approval || approvals.some((candidate) => candidate.decision !== "approved") || new Set(approvals.map((candidate) => canonicalJson(candidate.recovery))).size !== 1 || !attempt || attempt.itemId !== item.id || attempt.body.disposition !== "conflicting-partial-work" || attempt.body.stale_lease.token !== approval.recovery.stale_lease_token) {
    fail4("AUTHORITY_REQUIRED", "conflicting partial work requires exact persisted operator resolution");
  }
  return approval;
}

// src/core/lib/coordination-runtime/engine.mjs
import { randomUUID as randomUUID2 } from "node:crypto";
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
var INITIATIVE_TRANSITIONS = /* @__PURE__ */ new Map([
  ["proposed", /* @__PURE__ */ new Set(["proposed", "active"])],
  ["active", /* @__PURE__ */ new Set(["active", "paused", "completed", "shipped"])],
  ["paused", /* @__PURE__ */ new Set(["paused", "active"])],
  ["completed", /* @__PURE__ */ new Set(["completed", "archived"])],
  ["shipped", /* @__PURE__ */ new Set(["shipped", "archived"])],
  ["archived", /* @__PURE__ */ new Set(["archived"])]
]);
function fail5(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}
function requireKnownItemRoles(body, authority) {
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
function itemStateSatisfies(item, requirement) {
  if (requirement === "in-review") {
    return (/* @__PURE__ */ new Set([
      "in-review",
      "completed",
      "release-ready",
      "deploying",
      "production-verification",
      "shipped"
    ])).has(item.body.state);
  }
  if (requirement === "completed") {
    return item.body.delivery_class === "knowledge" && item.body.state === "completed";
  }
  if (requirement === "release-ready") {
    return item.body.delivery_class !== "knowledge" && (/* @__PURE__ */ new Set([
      "release-ready",
      "deploying",
      "production-verification",
      "shipped"
    ])).has(item.body.state);
  }
  return item.body.delivery_class !== "knowledge" && item.body.state === "shipped";
}
function dependencyStatus(tx, item) {
  const pending = [];
  const failed = [];
  for (const dependency of item.body.depends_on) {
    const upstream = tx.get("item", dependency.item);
    if (!upstream) {
      fail5(
        "EVIDENCE_GAP",
        `dependency item/${dependency.item} does not exist`
      );
    }
    if (upstream.body.state === "dropped") {
      failed.push(dependency.item);
    } else if (!itemStateSatisfies(upstream, dependency.requires)) {
      pending.push(dependency.item);
    }
  }
  return { pending, failed };
}
function assertNoDependencyCycle(tx, candidate) {
  const all = new Map(tx.list("item").map((record) => [record.id, record.body]));
  all.set(candidate.id, candidate);
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (id) => {
    if (visiting.has(id)) fail5("INVALID_INPUT", `dependency cycle includes item/${id}`);
    if (visited.has(id)) return;
    const item = all.get(id);
    if (!item) return;
    visiting.add(id);
    for (const dependency of item.depends_on) visit(dependency.item);
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
  const path = segments.filter((segment) => segment !== "" && segment !== ".").join("/");
  const wildcard = path.search(/[*?[\]{}()!+@]/);
  return {
    prefix: wildcard === -1 ? path : path.slice(0, wildcard),
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
function requireNoTouchConflict(tx, item) {
  for (const other of tx.list("item")) {
    if (other.id === item.id || !leaseIsLive(other.body.lease)) continue;
    if (touchesOverlap(item.body.touches, other.body.touches)) {
      fail5(
        "LEASE_CONFLICT",
        `item/${item.id} touch set conflicts with active item/${other.id}`
      );
    }
  }
}
function requireNoOpenQuestions(item) {
  if (item.body.waiting_on_questions.length > 0) {
    fail5(
      "EVIDENCE_GAP",
      `item/${item.id} has unanswered blocking questions`
    );
  }
}
function requireImmutableSubject(item) {
  if (item.body.change_ref === null) {
    fail5("EVIDENCE_GAP", `item/${item.id} has no immutable change subject`);
  }
}
function requireTransition(tx, item, command, authority, to) {
  const from = item.body.state;
  if (!ALLOWED_TRANSITIONS.get(from)?.has(to)) {
    fail5("INVALID_INPUT", `item lifecycle does not allow ${from} -> ${to}`);
  }
  if (item.body.lease !== null && !leaseIsLive(item.body.lease)) {
    fail5("RECOVERY_REQUIRED", `item/${item.id} lease expired and must be reconciled`);
  }
  if (to !== "blocked" && to !== "dropped") requireNoOpenQuestions(item);
  const dependencies = dependencyStatus(tx, item);
  if (dependencies.failed.length > 0 && to !== "blocked" && to !== "dropped") {
    fail5(
      "RECOVERY_REQUIRED",
      `item/${item.id} has failed dependencies: ${dependencies.failed.join(", ")}`
    );
  }
  if (dependencies.pending.length > 0 && to !== "blocked" && to !== "dropped") {
    fail5(
      "EVIDENCE_GAP",
      `item/${item.id} has pending dependencies: ${dependencies.pending.join(", ")}`
    );
  }
  if (to === "ready") {
    requireNamedAuthority(
      tx,
      command,
      authority,
      "item.promote",
      item.body.scope_authority
    );
    return null;
  }
  if (to === "dropped") {
    requireNamedAuthority(
      tx,
      command,
      authority,
      "item.transition",
      item.body.scope_authority
    );
    return null;
  }
  requireActingAuthority(tx, item, command, authority, "item.transition");
  if (to === "in-review") {
    if (!sameActor(command.actor, item.body.producer_actor)) {
      fail5("AUTHORITY_REQUIRED", "only the producing actor may submit its work for review");
    }
    requireImmutableSubject(item);
  }
  if (to === "completed") {
    if (item.body.delivery_class !== "knowledge") {
      fail5("INVALID_INPUT", "completed is reserved for knowledge items");
    }
    requireImmutableSubject(item);
    requireReviews(tx, item);
    return completionApproval(tx, item);
  }
  if (to === "release-ready") {
    if (item.body.delivery_class === "knowledge") {
      fail5("INVALID_INPUT", "knowledge items do not enter release-ready");
    }
    if (command.actor.role !== "workflow-ship") {
      fail5("AUTHORITY_REQUIRED", "workflow-ship owns release readiness");
    }
    requireImmutableSubject(item);
    requireReviews(tx, item);
    const approval = completionApproval(tx, item);
    requireReleaseEvidence(tx, item);
    return approval;
  }
  if (to === "deploying") {
    if (command.actor.role !== "workflow-ship") {
      fail5("AUTHORITY_REQUIRED", "workflow-ship owns deployment recording");
    }
    requireOperatorApproval(tx, item, "operator-deploy-start");
  }
  if (to === "production-verification") {
    if (command.actor.role !== "workflow-ship") {
      fail5("AUTHORITY_REQUIRED", "workflow-ship owns deployment recording");
    }
    requireOperatorApproval(tx, item, "operator-deploy-complete");
    requireDeploymentEvidence(tx, item, "deployment");
  }
  if (to === "shipped") {
    if (command.actor.role !== "workflow-ship") {
      fail5("AUTHORITY_REQUIRED", "workflow-ship owns shipment recording");
    }
    requireDeploymentEvidence(tx, item, "deployment");
    requireDeploymentEvidence(tx, item, "production-verification");
  }
  return null;
}
function transitionBody(tx, item, command, authority, to, at) {
  const candidate = to === "in-review" ? {
    ...item,
    body: {
      ...item.body,
      change_ref: command.payload.subject
    }
  } : item;
  const approval = requireTransition(tx, candidate, command, authority, to);
  let nextRole = item.body.next_role;
  if (to === "in-progress") {
    nextRole = item.body.producer_actor?.role ?? item.body.next_role;
  } else if (to === "in-review") {
    nextRole = item.body.review_requirements[0]?.role ?? item.body.completion_authority;
  } else if (to === "release-ready") {
    nextRole = "operator";
  } else if (to === "deploying" || to === "production-verification") {
    nextRole = "workflow-ship";
  } else if (TERMINAL.has(to)) {
    nextRole = null;
  }
  retireLeaseGrants(tx, item, "revoked");
  return {
    ...item.body,
    state: to,
    resume_state: to === "blocked" ? item.body.state : null,
    acceptance_actor: approval?.authority ?? item.body.acceptance_actor,
    next_role: nextRole,
    change_ref: to === "in-review" ? command.payload.subject : item.body.change_ref,
    lease: null,
    updated_at: at
  };
}
function putMessage(tx, item, command, {
  messageId,
  parentId,
  recipient,
  kind,
  createdAt,
  content,
  artifactRefs,
  evidenceRefs,
  provenance
}) {
  if (tx.get("message", messageId)) {
    fail5("OPERATION_CONFLICT", `message/${messageId} already exists`);
  }
  if (parentId !== null && !tx.get("message", parentId)) {
    fail5("INVALID_INPUT", `parent message/${parentId} does not exist`);
  }
  const body = {
    schema_version: 1,
    message_id: messageId,
    thread_id: item.id,
    item_id: item.id,
    parent_id: parentId,
    sender_role: command.actor.role,
    sender_run: command.actor.runId,
    recipient,
    kind,
    created_at: createdAt,
    basis_version: item.version,
    payload: content,
    artifact_refs: artifactRefs,
    evidence_refs: evidenceRefs,
    provenance
  };
  tx.put({
    kind: "message",
    id: messageId,
    itemId: item.id,
    version: 1,
    body
  });
  return body;
}
function handleInitiativeCreate(current, tx, command, authority) {
  if (current !== null) fail5("VERSION_CONFLICT", `initiative/${command.recordId} exists`);
  requireActionGrant(tx, command, authority, "initiative.create");
  const body = command.payload.body;
  if (body.status !== "proposed" || body.milestones.some((milestone) => milestone.status !== "proposed") || body.backlog.some((entry) => entry.status !== "parked")) {
    fail5("INVALID_INPUT", "new initiatives and milestones must begin proposed with parked backlog");
  }
  requireRoleAvailable(body.owner, authority, "initiative owner");
  return body;
}
function requireInitiativeClosure(tx, initiative, status) {
  if (status !== "completed" && status !== "shipped") return;
  if (initiative.milestones.length === 0) {
    fail5("EVIDENCE_GAP", "initiative closure requires at least one milestone");
  }
  const includesProduction = initiative.milestones.some(
    (milestone) => milestone.delivery_class !== "knowledge"
  );
  if (status === "completed" && includesProduction) {
    fail5("INVALID_INPUT", "initiatives with production milestones must finish shipped");
  }
  if (status === "shipped" && !includesProduction) {
    fail5("INVALID_INPUT", "knowledge-only initiatives finish completed");
  }
  for (const milestone of initiative.milestones) {
    if (milestone.required_items.length === 0) {
      fail5("EVIDENCE_GAP", `milestone/${milestone.id} has no required items`);
    }
    for (const id of milestone.required_items) {
      const item = tx.get("item", id);
      if (!item) fail5("EVIDENCE_GAP", `required item/${id} does not exist`);
      const required = milestone.delivery_class === "knowledge" ? "completed" : "shipped";
      if (item.body.state !== required) {
        fail5("EVIDENCE_GAP", `required item/${id} has not reached ${required}`);
      }
    }
  }
}
function handleInitiativeUpdate(current, tx, command, authority) {
  requireNamedAuthority(tx, command, authority, "initiative.update", current.body.owner);
  const next = { ...current.body, ...command.payload.changes };
  if (!INITIATIVE_TRANSITIONS.get(current.body.status)?.has(next.status)) {
    fail5(
      "INVALID_INPUT",
      `initiative lifecycle does not allow ${current.body.status} -> ${next.status}`
    );
  }
  requireInitiativeClosure(tx, next, next.status);
  return next;
}
function handleItemCreate(current, tx, command, authority) {
  if (current !== null) fail5("VERSION_CONFLICT", `item/${command.recordId} exists`);
  requireActionGrant(tx, command, authority, "item.create");
  const body = command.payload.body;
  if (body.state !== "proposed") {
    fail5("INVALID_INPUT", "new items must begin proposed");
  }
  if (!tx.get("initiative", body.initiative)) {
    fail5("EVIDENCE_GAP", `initiative/${body.initiative} does not exist`);
  }
  requireKnownItemRoles(body, authority);
  if (body.producer_actor && sameActor(body.producer_actor, body.acceptance_actor)) {
    fail5("AUTHORITY_REQUIRED", "the producer cannot be the acceptance actor");
  }
  assertNoDependencyCycle(tx, body);
  return body;
}
function handleItemUpdate(current, tx, command, authority) {
  requireActingAuthority(tx, current, command, authority, "item.update");
  const changes = Object.hasOwn(command.payload, "changes") ? command.payload.changes : { title: command.payload.title };
  const next = { ...current.body, ...changes };
  const acceptedState = current.body.state === "blocked" ? current.body.resume_state : current.body.state;
  if ((TERMINAL.has(acceptedState) || SHIP_STATES.has(acceptedState)) && criteriaRef(next) !== criteriaRef(current.body)) {
    fail5("INVALID_INPUT", "accepted criteria are frozen; record changed requirements as new work");
  }
  if (current.body.recovery_hold !== null && Object.hasOwn(changes, "next_role")) {
    fail5("AUTHORITY_REQUIRED", "operator resolution must release the recovery routing hold");
  }
  requireKnownItemRoles(next, authority);
  assertNoDependencyCycle(tx, next);
  if (current.body.lease !== null && Object.hasOwn(changes, "touches")) {
    requireNoTouchConflict(tx, { ...current, body: next });
  }
  return next;
}
function handleItemPromote(current, tx, command, authority) {
  if (current.body.state !== "proposed") {
    fail5("INVALID_INPUT", "item.promote requires a proposed item");
  }
  requireKnownItemRoles(current.body, authority);
  requireNamedAuthority(
    tx,
    command,
    authority,
    "item.promote",
    current.body.scope_authority
  );
  dependencyStatus(tx, current);
  return {
    ...current.body,
    state: "ready",
    updated_at: command.payload.at
  };
}
function createPersistedGrant(tx, item, command, holder, actions, acquiredAt, expiresAt, token) {
  const grantId = randomUUID2();
  tx.put({
    kind: "grant",
    id: grantId,
    itemId: item.id,
    version: 1,
    body: {
      schema_version: 1,
      grant_id: grantId,
      item_id: item.id,
      actor: holder,
      actions,
      record_kind: "item",
      record_id: item.id,
      basis_ref: `item/${item.id}@${item.version}`,
      lease_token: token,
      issued_by: command.actor,
      created_at: acquiredAt,
      expires_at: expiresAt,
      status: "active"
    }
  });
  return grantId;
}
function retireLeaseGrants(tx, item, status) {
  if (item.body.lease === null) return;
  for (const record of tx.list("grant", item.id)) {
    if (record.body.lease_token === item.body.lease.token && record.body.status === "active") {
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
function handleItemGrant(current, tx, command, authority) {
  requireActionGrant(tx, command, authority, "item.grant");
  requireKnownItemRoles(current.body, authority);
  if (current.body.recovery_hold !== null) {
    fail5("AUTHORITY_REQUIRED", "operator resolution is required before regrant");
  }
  if (current.body.lease !== null) {
    if (leaseIsLive(current.body.lease)) {
      fail5("LEASE_CONFLICT", `item/${current.id} already has a live lease`);
    }
    fail5(
      "RECOVERY_REQUIRED",
      `item/${current.id} has an expired lease that must be reconciled`
    );
  }
  if (!GRANTABLE_STATES.has(current.body.state)) {
    fail5("INVALID_INPUT", `item/${current.id} cannot be granted from ${current.body.state}`);
  }
  requireRoleAvailable(command.payload.holder.role, authority, "lease holder");
  if (command.payload.holder.role === "operator") {
    fail5("INVALID_INPUT", "operator is a reserved endpoint and cannot hold a lease");
  }
  if (current.body.next_role !== null && current.body.next_role !== command.payload.holder.role) {
    fail5(
      "AUTHORITY_REQUIRED",
      `item/${current.id} is routed to ${current.body.next_role}`
    );
  }
  if (Date.parse(command.payload.expiresAt) <= Date.now()) {
    fail5("INVALID_INPUT", "a new lease must expire in the future");
  }
  requireNoOpenQuestions(current);
  const dependencies = dependencyStatus(tx, current);
  if (dependencies.failed.length > 0) {
    return {
      ...current.body,
      state: "blocked",
      resume_state: current.body.state,
      lease: null,
      updated_at: command.payload.acquiredAt
    };
  }
  if (dependencies.pending.length > 0) {
    fail5(
      "EVIDENCE_GAP",
      `item/${current.id} has pending dependencies: ${dependencies.pending.join(", ")}`
    );
  }
  requireNoTouchConflict(tx, current);
  const token = randomUUID2();
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
function handleItemTransition(current, tx, command, authority) {
  return transitionBody(
    tx,
    current,
    command,
    authority,
    command.payload.to,
    command.payload.at
  );
}
function handleItemHandoff(current, tx, command, authority) {
  requireActingAuthority(tx, current, command, authority, "item.handoff");
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
      command.payload.state,
      command.payload.createdAt
    );
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
function requireRestorationAuthority(item, command, authority) {
  requireHostActionGrant(command, authority, "item.restore");
  if (SHIP_STATES.has(item.body.resume_state) && command.actor.role !== "workflow-ship") {
    fail5("AUTHORITY_REQUIRED", `workflow-ship must restore ${item.body.resume_state}`);
  }
}
function handleItemRestore(current, tx, command, authority) {
  requireRestorationAuthority(current, command, authority);
  if (current.body.state !== "blocked" || current.body.resume_state === null) {
    fail5("INVALID_INPUT", "item.restore requires a blocked item with resume_state");
  }
  const resolution = current.body.recovery_hold !== null ? recoveryResolution(tx, current, command.payload.recoveryApprovalId) : null;
  if (resolution) requireRoleAvailable(resolution.recovery.resume_role, authority, "recovery recipient");
  if (!resolution && command.payload.recoveryApprovalId) {
    fail5("INVALID_INPUT", "item has no recovery hold to resolve");
  }
  if (current.body.lease !== null) {
    fail5("RECOVERY_REQUIRED", "the blocked reservation must be reconciled before restoration");
  }
  requireNoOpenQuestions(current);
  const dependencies = dependencyStatus(tx, current);
  if (dependencies.failed.length > 0) {
    fail5(
      "RECOVERY_REQUIRED",
      `item/${current.id} still has failed dependencies`
    );
  }
  if (dependencies.pending.length > 0) {
    fail5(
      "EVIDENCE_GAP",
      `item/${current.id} still has pending dependencies`
    );
  }
  if (NEEDS_CHANGE_REF.has(current.body.resume_state) && current.body.change_ref === null) {
    fail5(
      "EVIDENCE_GAP",
      `item/${current.id} cannot restore ${current.body.resume_state} without a change subject`
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
function handleQuestionOpen(current, tx, command, authority) {
  requireActingAuthority(tx, current, command, authority, "question.open");
  if (TERMINAL.has(current.body.state)) {
    fail5("INVALID_INPUT", "terminal items cannot open questions");
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
    itemId: current.id,
    version: 1,
    body: {
      schema_version: 1,
      question_id: command.payload.questionId,
      item_id: current.id,
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
  if (!content.blocking) {
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
  const answers = answerIds.map((id) => tx.get("message", id)?.body).filter((candidate) => candidate?.kind === "answer" && candidate.item_id === question.itemId && candidate.sender_role === question.body.recipient && candidate.recipient === question.body.asker.role && candidate.parent_id === question.body.opened_message_id && candidate.payload.status === "answered" && candidate.payload.lane === "in-lane");
  const replaced = new Set(answers.flatMap((answer) => answer.payload.resolves ?? []));
  return answers.filter((answer) => !replaced.has(answer.message_id));
}
function handleQuestionAnswer(current, tx, command, authority) {
  if (command.payload.kind !== "answer") {
    fail5("INVALID_INPUT", 'question.answer message kind must be "answer"');
  }
  const question = tx.get("question", command.payload.questionId);
  if (!question || question.itemId !== current.id) {
    fail5(
      "INVALID_INPUT",
      `question/${command.payload.questionId} does not belong to item/${current.id}`
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
  if (TERMINAL.has(current.body.state)) {
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
function recoveryEvidence(tx, item, command) {
  if (command.payload.recoveryEvidenceIds.length === 0) {
    fail5("EVIDENCE_GAP", "lease expiry alone cannot authorize recovery");
  }
  for (const id of command.payload.recoveryEvidenceIds) {
    const record = tx.get("evidence", id);
    if (!record || record.itemId !== item.id || record.body.kind !== "recovery-reconciliation" || record.body.outcome !== "passed" || record.body.data.stale_lease_token !== item.body.lease.token || record.body.data.disposition !== command.payload.disposition || record.body.data.observed !== command.payload.observed || Date.parse(record.body.created_at) < Date.parse(item.body.lease.expires_at)) {
      fail5(
        "EVIDENCE_GAP",
        `evidence/${id} does not reconcile the stale lease and disposition`
      );
    }
  }
}
function handleAttemptRecover(current, tx, command, authority) {
  requireActionGrant(tx, command, authority, "attempt.recover");
  if (TERMINAL.has(current.body.state)) {
    fail5(
      "INVALID_INPUT",
      `item/${current.id} cannot recover a lease from ${current.body.state}`
    );
  }
  if (current.body.lease === null) {
    fail5("INVALID_INPUT", `item/${current.id} has no lease to recover`);
  }
  if (leaseIsLive(current.body.lease)) {
    fail5("LEASE_CONFLICT", `item/${current.id} lease has not expired`);
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
  let recoveryHold = current.body.recovery_hold;
  if (command.payload.disposition === "safe-to-resume" && recoveryHold !== null) {
    fail5("AUTHORITY_REQUIRED", "operator resolution is required before recovery");
  }
  if (command.payload.disposition === "safe-to-resume" && command.payload.redispatch !== null) {
    requireNoOpenQuestions(current);
    const dependencies = dependencyStatus(tx, current);
    if (dependencies.failed.length > 0) {
      fail5("RECOVERY_REQUIRED", `item/${current.id} has failed dependencies`);
    }
    if (dependencies.pending.length > 0) {
      fail5("EVIDENCE_GAP", `item/${current.id} has pending dependencies`);
    }
    if (state === "blocked") {
      requireRestorationAuthority(current, command, authority);
      state = resumeState;
      resumeState = null;
      if (!GRANTABLE_STATES.has(state)) {
        fail5("INVALID_INPUT", "blocked lease has no resumable work state");
      }
    }
    if (NEEDS_CHANGE_REF.has(state) && current.body.change_ref === null) {
      fail5("EVIDENCE_GAP", `item/${current.id} cannot resume ${state} without an immutable subject`);
    }
    requireRoleAvailable(command.payload.redispatch.role, authority, "recovery recipient");
    if (command.payload.redispatch.role === "operator") {
      fail5("INVALID_INPUT", "operator cannot receive a recovery lease");
    }
    if (Date.parse(command.payload.expiresAt) <= Date.now()) {
      fail5("INVALID_INPUT", "a recovered lease must expire in the future");
    }
    requireNoTouchConflict(tx, current);
    const token = randomUUID2();
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
      ["item.update", "item.transition", "item.handoff", "question.open"],
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
    recoveryHold = command.payload.attemptId;
  }
  retireLeaseGrants(tx, current, "recovered");
  tx.put({
    kind: "attempt",
    id: command.payload.attemptId,
    itemId: current.id,
    version: 1,
    body: {
      schema_version: 1,
      attempt_id: command.payload.attemptId,
      item_id: current.id,
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
    recovery_hold: recoveryHold,
    lease: newLease,
    updated_at: command.payload.createdAt
  };
}
var handlers = /* @__PURE__ */ new Map([
  ["initiative.create", handleInitiativeCreate],
  ["initiative.update", handleInitiativeUpdate],
  ["item.create", handleItemCreate],
  ["item.update", handleItemUpdate],
  ["item.promote", handleItemPromote],
  ["item.grant", handleItemGrant],
  ["item.transition", handleItemTransition],
  ["item.handoff", handleItemHandoff],
  ["item.restore", handleItemRestore],
  ["question.open", handleQuestionOpen],
  ["question.answer", handleQuestionAnswer],
  ["attempt.recover", handleAttemptRecover]
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
    fail5(
      "OPERATION_CONFLICT",
      `message/${messageId} was already used with different content`
    );
  }
  return existing.receipt;
}
function applyCommand(store, command, authority) {
  validateCommand(command);
  if (!handlers.has(command.kind)) fail5("INVALID_INPUT", `${command.kind} requires its dedicated evidence producer`);
  validateAuthority(authority);
  requireActorAvailable(command, authority);
  const duplicate = duplicateMessageReceipt(store, command);
  if (duplicate) return duplicate;
  try {
    return applyOperation(store, command, (current, tx) => {
      bindEvidenceTransaction(store, tx);
      const handler = handlers.get(command.kind);
      return handler(current, tx, command, authority);
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
  badPath,
  canonicalPath,
  normalized,
  resolvedProjectPath,
  escapesRoot,
  inspectPrivateLanes,
  pathHasLink,
  fail,
  workspaceManifest,
  projectBinding,
  assertWorkspacePath,
  pathPrivacy,
  scanExactFile,
  hashArtifact,
  verifySubject,
  retainSubject,
  verifyArtifact,
  verifyTarget,
  inspectGitPrivacy,
  hash2 as hash,
  LOCK,
  DATABASE,
  safePath,
  exactFile,
  exclusiveFile,
  migrationManifest,
  privateAdmission,
  sourceSnapshot,
  assertWorkspaceWrite,
  openStore,
  closeStore,
  readRecord,
  listRecords,
  listAllRecords,
  readStoreSummary,
  readSnapshot,
  readContextView,
  readMessagePage,
  readOperationReceipt,
  applyOperation,
  matchesAcceptance,
  effectiveReviews,
  effectiveApprovals,
  effectiveEvidence,
  privacyRank,
  captureInputBasis,
  artifactInputReferences,
  migrateWorkspace,
  recoverMigration,
  verifyMigration,
  rollbackMigration,
  readLegacyRecords,
  bindMigrationRepair,
  repairLegacyRecord,
  bindEvidenceRuntime,
  bindEvidenceTransaction,
  bindEvidenceReadView,
  contextFor,
  hasPublicationHistory,
  verifyAssetContent,
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
  requireActingAuthority,
  GRANTABLE_STATES,
  SHIP_STATES,
  itemStateSatisfies,
  applyCommand
};
