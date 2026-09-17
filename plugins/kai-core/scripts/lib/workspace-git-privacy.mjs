import {spawnSync} from 'node:child_process';

export const PRIVATE_PREFIXES = ['.kai/runs/', '.kai/review/', '.kai/personal/', '.kai/archive/'];
export const PRIVATE_FILES = [
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
    if (mode !== 'external') warnings.push(`storage_mode "${mode}" is not inside a readable git work tree`);
    return {errors, warnings, missing, gitRoot: null};
  }
  const tracked = git(['ls-files', '-z', '--', '.kai']);
  if (tracked.status !== 0) {
    errors.push('cannot inspect tracked private workspace state');
    return {errors, warnings, missing, gitRoot: top.stdout.trim()};
  }
  const paths = tracked.stdout.split('\0').filter(Boolean);
  const privatePaths = [...PRIVATE_PREFIXES, ...PRIVATE_FILES, ...extraPrivate];
  const isPrivate = path => privatePaths.some(p => p.endsWith('/') ? path.startsWith(p) : path === p);
  const bad = mode === 'repo-local' ? paths : paths.filter(path => isPrivate(path)
    || (privateDatabases && /\.(?:sqlite|sqlite3|db)(?:-(?:wal|shm|journal))?$/i.test(path)));
  if (bad.length) errors.push(`storage_mode "${mode}" has tracked private .kai path(s); these must be untracked: ${bad.join(', ')}`);
  const ignored = path => {
    const result = git(['check-ignore', '--no-index', '-q', '--', path]);
    if (![0, 1].includes(result.status)) errors.push(`cannot inspect Git privacy for ${path}`);
    return result.status === 0;
  };
  if (mode === 'repo-local') {
    if (!ignored('.kai/')) missing.push('.kai/');
  } else if (mode === 'shared' || mode === 'external') {
    if (ignored('.kai/manifest.json') || ignored('.kai/state/BOARD.md')) {
      errors.push(`storage_mode "${mode}" requires .kai/manifest.json and .kai/state/ to remain trackable in a version-controlled workspace`);
    }
    for (const path of privatePaths) if (!ignored(path)) missing.push(path);
  }
  return {errors, warnings, missing, gitRoot: top.stdout.trim()};
}
