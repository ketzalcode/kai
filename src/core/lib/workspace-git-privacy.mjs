import {spawnSync} from 'node:child_process';
import {canonicalPath} from './workspace-path-safety.mjs';
import {readWorkspaceManifest} from './workspace-resolve.mjs';
import {WORKSPACE_SCHEMA_VERSION} from './workspace-layout.mjs';

export const PRIVATE_PREFIXES = ['.kai/'];
export const PRIVATE_FILES = [
  '.kai/core/runtime/activity.jsonl', '.kai/core/runtime/activity.jsonl.1',
  '.kai/core/runtime/observed.jsonl', '.kai/core/runtime/observed.jsonl.1',
  '.kai/core/runtime/observer-consent', '.kai/local.json',
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
export function inspectGitPrivacy(root, mode) {
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
  if (paths.length) {
    errors.push(`placement "${mode}" has tracked private .kai path(s); these must be untracked: ${paths.join(', ')}`);
  }
  const ignored = path => {
    const result = git(['check-ignore', '--no-index', '-q', '--', path]);
    if (![0, 1].includes(result.status)) errors.push(`cannot inspect Git privacy for ${path}`);
    return result.status === 0;
  };
  if (mode === 'repo-local' || mode === 'external') {
    if (!ignored('.kai/')) missing.push('.kai/');
  } else {
    errors.push(`placement must be "repo-local" or "external" (found ${JSON.stringify(mode)})`);
  }
  return {errors, warnings, missing, gitRoot: canonicalPath(top.stdout.trim())};
}

export function privateAdmission(root) {
  const result = readWorkspaceManifest(root);
  if (!result.ok) return {errors: [result.reason], admitted: []};
  if (result.manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    return {
      errors: ['workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard'],
      admitted: [],
    };
  }
  const privacy = inspectGitPrivacy(root, result.manifest.placement);
  const errors = [
    ...privacy.errors,
    ...privacy.missing.map(path => `private workspace path must be ignored: ${path}`),
  ];
  if (result.manifest.placement === 'repo-local' && !privacy.gitRoot) {
    errors.push('repo-local placement requires a readable Git work tree');
  }
  return {errors, admitted: []};
}
