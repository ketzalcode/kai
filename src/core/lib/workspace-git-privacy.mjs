import {spawnSync} from 'node:child_process';
import {canonicalPath} from './workspace-path-safety.mjs';

export const PRIVATE_PREFIXES = ['.kai/'];
export const PRIVATE_FILES = [
  '.kai/core/runtime/activity.jsonl', '.kai/core/runtime/activity.jsonl.1',
  '.kai/core/runtime/observed.jsonl', '.kai/core/runtime/observed.jsonl.1',
  '.kai/core/runtime/observer-consent', '.kai/local.json',
];
const LEGACY_PRIVATE_PREFIXES = ['.kai/runs/', '.kai/review/', '.kai/personal/', '.kai/archive/'];
const LEGACY_PRIVATE_FILES = [
  '.kai/activity.jsonl', '.kai/activity.jsonl.1', '.kai/observed.jsonl',
  '.kai/observed.jsonl.1', '.kai/observer-consent', '.kai/local.json',
];

export function workspaceGit(root, args) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !/^GIT_/i.test(key)));
  return spawnSync('git', ['--no-pager', '-C', root, ...args], {
    encoding: 'utf8', windowsHide: true, env: {...env, GIT_OPTIONAL_LOCKS: '0'}, maxBuffer: 16 * 1024 * 1024,
  });
}

/** Missing ignores may be admitted separately. Tracked data and hidden shared
 * state are errors, never an instruction to untrack data or edit product files.
 */
export function inspectGitPrivacy(root, mode, {extraPrivate = [], privateDatabases = false} = {}) {
  const errors = [], warnings = [], missing = [];
  const git = args => workspaceGit(root, args);
  const top = git(['rev-parse', '--show-toplevel']);
  if (top.status !== 0) {
    if (mode !== 'external') warnings.push(`placement "${mode}" is not inside a readable git work tree`);
    return {errors, warnings, missing, gitRoot: null};
  }
  const tracked = git(['ls-files', '-z', '--', '.kai']);
  if (tracked.status !== 0) {
    errors.push('cannot inspect tracked private workspace state');
    return {errors, warnings, missing, gitRoot: canonicalPath(top.stdout.trim())};
  }
  const paths = tracked.stdout.split('\0').filter(Boolean);
  const privatePaths = mode === 'shared'
    ? [...LEGACY_PRIVATE_PREFIXES, ...LEGACY_PRIVATE_FILES, ...extraPrivate]
    : [...PRIVATE_PREFIXES, ...PRIVATE_FILES, ...extraPrivate];
  const isPrivate = path => privatePaths.some(p => p.endsWith('/') ? path.startsWith(p) : path === p);
  const bad = mode === 'shared'
    ? paths.filter(path => isPrivate(path)
      || (privateDatabases && /\.(?:sqlite|sqlite3|db)(?:-(?:wal|shm|journal))?$/i.test(path)))
    : paths;
  if (bad.length) errors.push(`placement "${mode}" has tracked private .kai path(s); these must be untracked: ${bad.join(', ')}`);
  const ignored = path => {
    const result = git(['check-ignore', '--no-index', '-q', '--', path]);
    if (![0, 1].includes(result.status)) errors.push(`cannot inspect Git privacy for ${path}`);
    return result.status === 0;
  };
  if (mode === 'repo-local' || mode === 'external') {
    if (!ignored('.kai/')) missing.push('.kai/');
  } else if (mode === 'shared') {
    if (ignored('.kai/manifest.json') || ignored('.kai/state/BOARD.md')) {
      errors.push('legacy shared storage requires .kai/manifest.json and .kai/state/ to remain trackable');
    }
    for (const path of privatePaths) if (!ignored(path)) missing.push(path);
  } else {
    errors.push(`placement must be "repo-local" or "external" (found ${JSON.stringify(mode)})`);
  }
  return {errors, warnings, missing, gitRoot: canonicalPath(top.stdout.trim())};
}
