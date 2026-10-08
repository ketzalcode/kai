import {existsSync, readFileSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {RuntimeError} from './contract.mjs';
import {pathHasLink} from '../workspace-path-safety.mjs';
import {migrationManifest} from './migration-files.mjs';
import {
  readWorkspaceManifest,
  validateSchema5Manifest,
} from '../workspace-resolve.mjs';
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
} from '../workspace-layout.mjs';
import {inspectGitPrivacy} from '../workspace-git-privacy.mjs';
import {readDirection} from '../direction.mjs';

const fail = (code, message) => { throw new RuntimeError(code, message); };

export function readWorkspaceContract(root, {
  env = process.env,
  versions = [3, 4, WORKSPACE_SCHEMA_VERSION],
} = {}) {
  root = resolve(root);
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail('INVALID_INPUT', result.reason);
  const manifest = result.manifest;
  if (!versions.includes(manifest.schema_version)) {
    fail('SCHEMA_MISMATCH', `unsupported workspace schema ${manifest.schema_version}`);
  }
  if (manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    return migrationManifest(root, versions.filter(version => version !== WORKSPACE_SCHEMA_VERSION), env);
  }
  if (pathHasLink(root, result.path)) fail('INVALID_INPUT', 'workspace manifest cannot traverse links');
  const validation = validateSchema5Manifest(root, manifest, {env});
  if (validation.errors.length) fail('INVALID_INPUT', validation.errors.join('; '));
  try {
    readDirection({workspaceRoot: root, manifest});
  } catch (error) {
    fail(error.code ?? 'INVALID_INPUT', error.message);
  }
  return manifest;
}

/** The store remains usable in isolation; the canonical live workspace store
 * must never mutate behind a historical manifest or a linked/private-policy gap.
 */
export function assertWorkspaceWrite(path, {
  privateCheck = true,
  requirePrivate = false,
  env = process.env,
} = {}) {
  path = resolve(path);
  const runtime = dirname(path);
  const core = dirname(runtime);
  const privateRoot = dirname(core);
  const root = dirname(privateRoot);
  const expected = resolve(root, ...COORDINATION_DATABASE.split('/'));
  if ((process.platform === 'win32' ? path.toLowerCase() : path)
    !== (process.platform === 'win32' ? expected.toLowerCase() : expected)) return;
  const manifest = join(root, '.kai', 'manifest.json');
  if (!existsSync(manifest)) fail('SCHEMA_MISMATCH', 'workspace coordination writes require a schema 5 manifest');
  if (pathHasLink(root, manifest) || pathHasLink(root, path)) fail('INVALID_INPUT', 'coordination workspace paths cannot traverse links');
  let parsed;
  try { parsed = JSON.parse(readFileSync(manifest, 'utf8')); }
  catch { fail('SCHEMA_MISMATCH', 'coordination manifest is unreadable'); }
  if (parsed.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    fail('SCHEMA_MISMATCH', 'schema 3/4/future workspaces are inspect-only; coordinated writes require schema 5');
  }
  const validation = validateSchema5Manifest(root, parsed, {env});
  if (validation.errors.length) fail('INVALID_INPUT', validation.errors.join('; '));
  if (existsSync(join(runtime, 'migration.lock'))) {
    fail('RECOVERY_REQUIRED', 'offline migration/rollback lock prevents coordinated work');
  }
  if (privateCheck && requirePrivate) {
    const privacy = inspectGitPrivacy(root, parsed.placement);
    const errors = [...privacy.errors, ...privacy.missing.map(name =>
      `private workspace path must be ignored: ${name}`)];
    if (parsed.placement === 'repo-local' && !privacy.gitRoot) {
      errors.push('repo-local placement requires a readable Git work tree');
    }
    if (errors.length) fail('INVALID_INPUT', errors.join('; '));
  }
}
