import {
  closeSync, existsSync, fstatSync, fsyncSync, lstatSync, mkdirSync, openSync,
  readFileSync, readdirSync, readSync, writeFileSync,
} from 'node:fs';
import {createHash} from 'node:crypto';
import {dirname, isAbsolute, join, relative, resolve} from 'node:path';
import {RuntimeError, canonicalJson} from './contract.mjs';
import {durablePath} from './evidence-content.mjs';
import {pathHasLink, escapesRoot, normalized, inspectPrivateLanes} from '../workspace-path-safety.mjs';
import {readWorkspaceManifest, loadWorkspaceRegistry} from '../workspace-resolve.mjs';
import {inspectGitPrivacy, workspaceGit} from '../workspace-git-privacy.mjs';

export const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export const fail = (code, message) => { throw new RuntimeError(code, message); };
export const LOCK = '.kai/state/migration.lock';
export const DATABASE = '.kai/state/coordination.sqlite';
export const MIGRATIONS = '.kai/archive/coordination-migrations';
export function safePath(root, name) {
  const path = durablePath(name);
  if (!path.startsWith('.kai/') || path.startsWith('project:')) fail('INVALID_INPUT', 'migration paths must be private workspace paths');
  const absolute = resolve(root, ...path.split('/'));
  if (pathHasLink(root, absolute) || escapesRoot(root, absolute)) fail('INVALID_INPUT', 'migration path traverses a link or escapes the workspace');
  return absolute;
}
export function exactFile(root, name) {
  const path = safePath(root, name);
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1) fail('RECOVERY_REQUIRED', `not a regular unshared file: ${name}`);
  const fd = openSync(path, 'r');
  try {
    const before = fstatSync(fd);
    const bytes = readFileSync(fd);
    const after = fstatSync(fd);
    if (stat.ino !== before.ino || stat.dev !== before.dev || before.nlink !== 1
      || before.size !== after.size || before.mtimeMs !== after.mtimeMs || bytes.length !== after.size) {
      fail('RECOVERY_REQUIRED', `file changed while reading: ${name}`);
    }
    return bytes;
  } finally { closeSync(fd); }
}
export function fileFingerprint(root, name, {prefixBytes = 0} = {}) {
  const path = safePath(root, name);
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1) fail('RECOVERY_REQUIRED', `not a regular unshared file: ${name}`);
  const fd = openSync(path, 'r');
  try {
    const before = fstatSync(fd);
    const digest = createHash('sha256');
    const chunk = Buffer.alloc(64 * 1024);
    const prefix = Buffer.alloc(Math.min(prefixBytes, before.size));
    let size = 0, count;
    while ((count = readSync(fd, chunk, 0, chunk.length, null)) > 0) {
      digest.update(chunk.subarray(0, count));
      if (size < prefix.length) chunk.copy(prefix, size, 0, Math.min(count, prefix.length - size));
      size += count;
    }
    const after = fstatSync(fd);
    if (stat.ino !== before.ino || stat.dev !== before.dev || before.nlink !== 1
      || after.nlink !== 1 || before.size !== after.size || before.mtimeMs !== after.mtimeMs || size !== after.size) {
      fail('RECOVERY_REQUIRED', `file changed while reading: ${name}`);
    }
    return {digest: digest.digest('hex'), size, ...(prefixBytes ? {prefix} : {})};
  } finally { closeSync(fd); }
}
export function exclusiveFile(root, name, bytes) {
  const target = safePath(root, name);
  mkdirSync(dirname(target), {recursive: true});
  const fd = openSync(safePath(root, name), 'wx', 0o600);
  try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
}
export function migrationManifest(root, versions = [3, 4], env = process.env) {
  if (typeof root !== 'string' || !isAbsolute(root)) fail('INVALID_INPUT', 'explicit absolute workspace root required');
  if (/^(\\\\|\/\/)/.test(root)) fail('UNSUPPORTED_HOST', 'network workspaces are unsupported');
  exactFile(root, '.kai/manifest.json');
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail('INVALID_INPUT', result.reason);
  const m = result.manifest;
  if (!versions.includes(m.schema_version)) fail('SCHEMA_MISMATCH', `unsupported workspace schema ${m.schema_version}`);
  if (!['repo-local', 'shared', 'external'].includes(m.storage_mode)
    || m.network === true || m.replicated === true || m.storage?.replicated === true
    || /network|replicated|nfs|smb/i.test(m.filesystem ?? '')) {
    fail('UNSUPPORTED_HOST', 'unsupported network, replicated or unknown workspace storage');
  }
  if (typeof m.workspace_id !== 'string' || !m.workspace_id.trim()) fail('INVALID_INPUT', 'workspace identity required');
  if ((m.storage_mode === 'external' && (typeof m.workspace_root !== 'string' || !isAbsolute(m.workspace_root)
    || normalized(m.workspace_root) !== normalized(root)))
    || (m.storage_mode !== 'external' && m.workspace_root !== '.')) fail('INVALID_INPUT', 'workspace_root does not match the selected storage/root binding');
  for (const lane of ['state', 'runs', 'review', 'archive', 'personal']) {
    if (m[lane] !== `.kai/${lane}`) fail('INVALID_INPUT', `unsupported ${lane} binding`);
  }
  const lanes = inspectPrivateLanes(root, ['.kai/state', '.kai/runs', '.kai/review', '.kai/archive', '.kai/personal']);
  if (lanes.symbolicLinks.length || lanes.gitRoots.length || lanes.unreadable.length) {
    fail('INVALID_INPUT', 'private workspace lanes contain links, nested Git, or unreadable paths');
  }
  if (!Array.isArray(m.projects)) fail('INVALID_INPUT', 'project bindings required');
  const ids = new Set();
  for (const project of m.projects) {
    if (!project || !/^[a-z][a-z0-9-]*$/.test(project.id) || ids.has(project.id)
      || typeof project.path !== 'string' || (!isAbsolute(project.path) && project.path !== '.')) {
      fail('INVALID_INPUT', 'ambiguous project binding');
    }
    ids.add(project.id);
    if (/^(\\\\|\/\/)/.test(project.path)) fail('UNSUPPORTED_HOST', 'network project unsupported');
    const projectRoot = resolve(root, project.path);
    if (!existsSync(projectRoot) || pathHasLink(projectRoot, projectRoot)) fail('INVALID_INPUT', 'missing or linked project binding');
    const publication = durablePath(project.publication_root);
    if (publication.startsWith('.kai') || publication.startsWith('project:')) fail('INVALID_INPUT', 'invalid publication binding');
    if (m.storage_mode === 'external') {
      if (!escapesRoot(root, projectRoot) || !escapesRoot(projectRoot, root)) fail('INVALID_INPUT', 'external workspace overlaps project');
      const registry = loadWorkspaceRegistry(env);
      if (!registry.ok) fail('INVALID_INPUT', registry.reason);
      const matches = registry.entries.filter(e => normalized(e.project_root) === normalized(projectRoot));
      if (matches.length !== 1 || matches[0].workspace_id !== m.workspace_id
        || normalized(matches[0].workspace_root) !== normalized(root)) fail('INVALID_INPUT', 'external project requires exactly one matching registry binding');
    }
  }
  return m;
}

const privateNames = [DATABASE, `${DATABASE}-wal`, `${DATABASE}-shm`, `${DATABASE}-journal`,
  LOCK, `${MIGRATIONS}/`, '.kai/review/coordination/', '.kai/state/host/'];
export function privateAdmission(root, {admit = false} = {}) {
  const manifest = readWorkspaceManifest(root);
  if (!manifest.ok) fail('INVALID_INPUT', manifest.reason);
  const git = args => workspaceGit(root, args);
  const privacy = inspectGitPrivacy(root, manifest.manifest.storage_mode, {extraPrivate: privateNames, privateDatabases: true});
  if (privacy.errors.length) return {errors: privacy.errors, admitted: []};
  if (!privacy.gitRoot) return {errors: [], admitted: []};
  const prefix = relative(privacy.gitRoot, root).replaceAll('\\', '/');
  const name = path => prefix ? `${prefix}/${path}` : path;
  const ignored = path => git(['check-ignore', '--no-index', '-q', '--', path]).status === 0;
  const missing = privacy.missing;
  if (!missing.length) return {errors: [], admitted: []};
  if (!admit) return {errors: missing.map(path => `private SQLite/runtime path must be ignored: ${path}`), admitted: []};
  const exclude = git(['rev-parse', '--git-path', 'info/exclude']);
  if (exclude.status !== 0) fail('RECOVERY_REQUIRED', 'cannot resolve private Git exclude metadata');
  const path = resolve(root, exclude.stdout.trim());
  if (pathHasLink(dirname(path), path)) fail('INVALID_INPUT', 'Git exclude metadata is linked');
  if (existsSync(path) && (!lstatSync(path).isFile() || lstatSync(path).nlink !== 1)) fail('INVALID_INPUT', 'Git exclude metadata is shared or nonregular');
  mkdirSync(dirname(path), {recursive: true});
  // Append only scoped literal entries to private Git metadata, never .gitignore.
  const literal = text => text.replace(/[\\*?[\]#! ]/g, c => `\\${c}`);
  const bytes = `\n# kai private coordination runtime\n${missing.map(p => `/${literal(name(p))}`).join('\n')}\n`;
  const fd = openSync(path, 'a', 0o600);
  try { writeFileSync(fd, bytes); fsyncSync(fd); } finally { closeSync(fd); }
  const remaining = missing.filter(p => !ignored(p));
  return {errors: remaining.map(p => `privacy admission failed: ${p}`), admitted: missing};
}

export function sourceSnapshot(root) {
  const files = [];
  function walk(name) {
    if (name === LOCK || name === MIGRATIONS || name === DATABASE || name.startsWith(`${DATABASE}-`)
      || name.toLowerCase() === '.kai/state/host') return;
    const path = safePath(root, name);
    const stat = lstatSync(path);
    if (stat.isDirectory()) {
      for (const child of readdirSync(path).sort()) walk(`${name}/${child}`);
    } else {
      const {digest, size, prefix} = fileFingerprint(root, name, {prefixBytes: 16});
      if (/(?:-wal|-shm|-journal)$/i.test(name)
        || ((prefix.toString('latin1') === 'SQLite format 3\0' || /\.(sqlite|sqlite3|db)$/i.test(name))
          && ['-wal', '-shm', '-journal'].some(suffix => existsSync(safePath(root, `${name}${suffix}`))))) {
        fail('UNSUPPORTED_HOST', `SQLite evidence with live/unreconciled sidecars requires offline reconciliation: ${name}`);
      }
      files.push({path: name, digest, size});
    }
  }
  for (const child of readdirSync(join(root, '.kai')).sort()) walk(`.kai/${child}`);
  return files;
}
export function sameSnapshot(expected, actual) {
  if (canonicalJson(expected) !== canonicalJson(actual)) fail('RECOVERY_REQUIRED', 'source fingerprint/write set changed; preserve user edits and reconcile offline');
}
