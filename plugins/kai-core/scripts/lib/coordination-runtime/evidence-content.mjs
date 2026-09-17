import {createHash} from 'node:crypto';
import {
  closeSync, fstatSync, mkdirSync, openSync, readFileSync, readSync, writeFileSync,
} from 'node:fs';
import {execFileSync} from 'node:child_process';
import {dirname, isAbsolute, join, resolve} from 'node:path';
import {
  RuntimeError, canonicalJson, validateSubjectRef,
} from './contract.mjs';
import {
  badPath, escapesRoot, inspectPrivateLanes, normalized, pathHasLink, resolvedProjectPath,
} from '../workspace-path-safety.mjs';
import {readWorkspaceManifest} from '../workspace-resolve.mjs';

export function fail(code, message) {
  throw new RuntimeError(code, message);
}

export function durablePath(value) {
  if (typeof value !== 'string' || !value.trim() || badPath(value)) {
    fail('INVALID_INPUT', 'a complete workspace-relative or project-qualified path is required');
  }
  const normalized = value.replaceAll('\\', '/');
  const qualifier = /^project:([a-z][a-z0-9-]*):(.*)$/.exec(normalized);
  const path = qualifier ? qualifier[2] : normalized;
  const parts = path.split('/').filter(part => part !== '.');
  if (parts.some(part => !part || /[:<>"|?*\x00-\x1f]/.test(part)
    || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part))) {
    fail('INVALID_INPUT', 'path contains an unsafe or ambiguous segment');
  }
  return (qualifier ? `project:${qualifier[1]}:` : '') + parts.join('/');
}

export function workspaceManifest(root) {
  if (typeof root !== 'string' || !isAbsolute(root)) fail('INVALID_INPUT', 'explicit absolute workspace root is required');
  if (/^(\\\\|\/\/)/.test(root)) fail('UNSUPPORTED_HOST', 'network workspaces are unsupported');
  if (process.platform === 'win32' && !/^[a-z]:[\\/]/i.test(root)) {
    fail('INVALID_INPUT', 'workspace root requires an explicit drive, not the current drive');
  }
  const manifestPath = join(root, '.kai', 'manifest.json');
  if (pathHasLink(root, manifestPath) || escapesRoot(root, manifestPath)) {
    fail('INVALID_INPUT', 'workspace manifest cannot traverse a link');
  }
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail('INVALID_INPUT', result.reason);
  const m = result.manifest;
  if (m.schema_version !== 4) fail('SCHEMA_MISMATCH', 'evidence requires workspace schema 4');
  if (!Array.isArray(m.projects)) fail('INVALID_INPUT', 'workspace projects must be declared');
  for (const lane of ['state', 'runs', 'review', 'archive', 'personal']) {
    if (m[lane] !== `.kai/${lane}`) fail('INVALID_INPUT', `unsupported workspace ${lane} binding`);
  }
  return m;
}

export function projectBinding(root, projectId) {
  const matches = workspaceManifest(root).projects.filter(project => project.id === projectId);
  if (matches.length !== 1 || typeof matches[0].path !== 'string' || !matches[0].path.trim()) {
    fail('INVALID_INPUT', 'project must have exactly one explicit workspace binding');
  }
  const project = matches[0];
  if (/^(\\\\|\/\/)/.test(project.path)) fail('UNSUPPORTED_HOST', 'network projects are unsupported');
  if (/^[a-z]:(?![\\/])/i.test(project.path)
    || (process.platform === 'win32' && isAbsolute(project.path) && !/^[a-z]:[\\/]/i.test(project.path))) {
    fail('INVALID_INPUT', 'project binding cannot depend on the current drive or working directory');
  }
  const projectRoot = resolvedProjectPath(root, project.path);
  if (pathHasLink(projectRoot, projectRoot)) fail('INVALID_INPUT', 'project root cannot be a link');
  return {project, projectRoot};
}

export function assertWorkspacePath(root, relativePath) {
  workspaceManifest(root);
  const path = durablePath(relativePath);
  const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/.exec(path);
  let base = root;
  let local = path;
  if (projectTarget) {
    const {project, projectRoot} = projectBinding(root, projectTarget[1]);
    base = projectRoot;
    local = projectTarget[2];
    const publication = durablePath(project.publication_root);
    if (publication.startsWith('project:') || publication.toLowerCase() === '.kai'
      || publication.toLowerCase().startsWith('.kai/')
      || (local !== publication && !local.startsWith(`${publication}/`))) {
      fail('INVALID_INPUT', 'public target escapes the declared project publication root');
    }
    if (normalized(base) !== normalized(root) && !escapesRoot(join(root, '.kai'), base)) {
      fail('INVALID_INPUT', 'a project publication cannot alias private workspace state');
    }
  } else if (!/^\.kai\/(runs|review|state|archive|personal)\//.test(path)) {
    fail('INVALID_INPUT', 'private references require a .kai lane; public paths must be project-qualified');
  }
  const absolute = resolve(base, ...local.split('/'));
  if (escapesRoot(base, absolute) || pathHasLink(base, absolute)) {
    fail('INVALID_INPUT', 'path escapes its root or traverses a symbolic link or junction');
  }
  if (!projectTarget) {
    const inspection = inspectPrivateLanes(root, [
      '.kai/state', '.kai/runs', '.kai/review', '.kai/archive', '.kai/personal',
    ]);
    if (inspection.gitRoots.length || inspection.symbolicLinks.length || inspection.unreadable.length) {
      fail('INVALID_INPUT', 'private lanes contain nested Git roots, links, or unreadable directories');
    }
  }
  return absolute;
}

export function pathPrivacy(root, path) {
  return escapesRoot(join(root, '.kai', 'personal'), assertWorkspacePath(root, path))
    ? 'public' : 'personal';
}

function readExactFile(root, path, read) {
  const absolute = assertWorkspacePath(root, path);
  let fd;
  try {
    fd = openSync(absolute, 'r');
    const before = fstatSync(fd);
    if (!before.isFile() || before.nlink > 1) fail('INVALID_INPUT', 'evidence must be a regular unshared file');
    const {value, size} = read(fd, before.size);
    const after = fstatSync(fd);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || size !== after.size) {
      fail('EVIDENCE_GAP', 'evidence changed while reading');
    }
    return value;
  } catch (error) {
    if (error instanceof RuntimeError) throw error;
    fail('EVIDENCE_GAP', `referenced evidence is missing or unreadable: ${path}`);
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

export function exactBytes(root, path) {
  return readExactFile(root, path, fd => {
    const bytes = readFileSync(fd);
    return {value: bytes, size: bytes.length};
  });
}

/** Full-file identity with bounded reads. Consumers must copy any kept chunk. */
export function scanExactFile(root, path, consume = () => {}) {
  return readExactFile(root, path, (fd, expectedSize) => {
    const digest = createHash('sha256');
    const buffer = Buffer.alloc(64 * 1024);
    let size = 0;
    while (size < expectedSize) {
      const count = readSync(fd, buffer, 0, Math.min(buffer.length, expectedSize - size), null);
      if (!count) break;
      const chunk = buffer.subarray(0, count);
      digest.update(chunk);
      consume(chunk);
      size += count;
    }
    return {value: {digest: digest.digest('hex'), size}, size};
  });
}

const hash = bytes => createHash('sha256').update(bytes).digest('hex');
export function hashArtifact({root, relativePath}) {
  const path = durablePath(relativePath);
  return {kind: 'sha256', digest: scanExactFile(root, path).digest, path};
}

function orderedPaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0) fail('INVALID_INPUT', 'bundle requires paths');
  const normalized = paths.map(durablePath).sort();
  if (new Set(normalized.map(path => path.toLowerCase())).size !== normalized.length) {
    fail('INVALID_INPUT', 'bundle contains duplicate paths or case collisions');
  }
  return normalized;
}

export function hashBundle({root, paths}) {
  const entries = orderedPaths(paths).map(path => {
    const artifact = hashArtifact({root, relativePath: path});
    return {path, digest: artifact.digest};
  });
  return {kind: 'bundle-sha256', digest: hash(canonicalJson(entries)), entries};
}

export function verifySubject(root, subject, projectId) {
  validateSubjectRef(subject);
  if (subject.kind === 'git') {
    if (!/^[0-9a-f]{40}$/.test(subject.base) || !/^[0-9a-f]{40}$/.test(subject.head)) {
      fail('INVALID_INPUT', 'Git evidence requires full lowercase immutable commit IDs');
    }
    const {projectRoot} = projectBinding(root, projectId);
    try {
      const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)));
      const git = args => execFileSync('git', ['--no-pager', '-C', projectRoot, ...args], {
        encoding: 'utf8', windowsHide: true, stdio: ['ignore', 'pipe', 'pipe'],
        env: {...env, GIT_NO_REPLACE_OBJECTS: '1', GIT_OPTIONAL_LOCKS: '0', GIT_NO_LAZY_FETCH: '1', GIT_TERMINAL_PROMPT: '0'},
      }).trim();
      if (normalized(git(['rev-parse', '--show-toplevel'])) !== normalized(projectRoot)) {
        fail('EVIDENCE_GAP', 'selected project must itself be the Git root');
      }
      for (const object of [subject.base, subject.head]) {
        if (git(['rev-parse', '--verify', `${object}^{commit}`]) !== object) {
          fail('EVIDENCE_GAP', 'Git evidence does not resolve to the exact commit');
        }
      }
    } catch (error) {
      if (error instanceof RuntimeError) throw error;
      fail('EVIDENCE_GAP', 'Git evidence objects do not exist in the selected project');
    }
    return [];
  }
  if (projectId !== null) fail('INVALID_INPUT', 'non-Git subjects carry project-qualified paths, not projectId');
  const actual = subject.kind === 'sha256'
    ? hashArtifact({root, relativePath: subject.path})
    : hashBundle({root, paths: subject.entries.map(entry => entry.path)});
  if (canonicalJson(actual) !== canonicalJson(subject)) {
    fail('EVIDENCE_GAP', 'referenced content or bundle manifest changed');
  }
  return subject.kind === 'sha256' ? [{path: subject.path, digest: subject.digest}] : subject.entries;
}

function retainFile(root, path, bytes) {
  const absolute = assertWorkspacePath(root, path);
  mkdirSync(dirname(absolute), {recursive: true});
  assertWorkspacePath(root, path);
  try {
    writeFileSync(absolute, bytes, {flag: 'wx'});
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
    if (!exactBytes(root, path).equals(Buffer.from(bytes))) {
      fail('EVIDENCE_GAP', 'retained snapshot already exists with different bytes');
    }
  }
}

export function retainSubject(root, subject, projectId, runDirectory, artifactId) {
  const entries = verifySubject(root, subject, projectId);
  if (subject.kind === 'git') return {snapshots: [], manifest_path: null};
  const base = `${runDirectory}/.evidence/${artifactId}`;
  const snapshots = entries.map((entry, index) => {
    const bytes = exactBytes(root, entry.path);
    if (hash(bytes) !== entry.digest) fail('EVIDENCE_GAP', 'source changed before snapshot');
    const snapshot_path = `${base}/${String(index).padStart(4, '0')}.bin`;
    retainFile(root, snapshot_path, bytes);
    return {...entry, snapshot_path};
  });
  const manifest_path = `${base}/manifest.json`;
  retainFile(root, manifest_path, canonicalJson({subject, snapshots}));
  verifySubject(root, subject, projectId);
  return {snapshots, manifest_path};
}

export function verifyArtifact(root, artifact) {
  const entries = verifySubject(root, artifact.subject, artifact.project_id);
  if (canonicalJson(entries) !== canonicalJson(artifact.snapshots.map(({path, digest}) => ({path, digest})))) {
    fail('EVIDENCE_GAP', 'artifact snapshot manifest does not match its exact subject');
  }
  for (const snapshot of artifact.snapshots) {
    if (!snapshot.snapshot_path.startsWith(`${artifact.run_directory}/.evidence/${artifact.artifact_id}/`)
      || scanExactFile(root, snapshot.snapshot_path).digest !== snapshot.digest) {
      fail('EVIDENCE_GAP', 'retained snapshot is missing or changed');
    }
  }
  if (artifact.subject.kind !== 'git') {
    if (artifact.manifest_path !== `${artifact.run_directory}/.evidence/${artifact.artifact_id}/manifest.json`
      || scanExactFile(root, artifact.manifest_path).digest !== hash(canonicalJson({
        subject: artifact.subject, snapshots: artifact.snapshots,
      }))) {
      fail('EVIDENCE_GAP', 'retained manifest is missing or changed');
    }
  }
}

export function verifyTarget(root, target, artifact) {
  if (artifact.subject.kind !== 'sha256') {
    if (artifact.subject.kind === 'bundle-sha256' && target.startsWith('project:')
      && artifact.subject.entries.some(entry => !entry.path.startsWith('project:'))) {
      fail('INVALID_INPUT', 'public bundle manifests cannot expose private member references');
    }
    const manifest = artifact.subject.kind === 'git'
      ? {project_id: artifact.project_id, subject: artifact.subject}
      : artifact.subject;
    if (scanExactFile(root, target).digest !== hash(canonicalJson(manifest))) {
      fail('EVIDENCE_GAP', 'canonical target must contain the exact immutable subject manifest');
    }
    return;
  }
  if (hashArtifact({root, relativePath: target}).digest !== artifact.subject.digest) {
    fail('EVIDENCE_GAP', 'canonical target does not contain the accepted exact bytes');
  }
}
