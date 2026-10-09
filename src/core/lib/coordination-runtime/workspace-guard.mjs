import {existsSync, lstatSync} from 'node:fs';
import {dirname, join, resolve} from 'node:path';
import {RuntimeError} from './contract.mjs';
import {exactPath, pathHasLink} from '../workspace-path-safety.mjs';
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
} = {}) {
  root = resolve(root);
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail('INVALID_INPUT', result.reason);
  const manifest = result.manifest;
  if (manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    fail('SCHEMA_MISMATCH',
      'workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard');
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
 * must never mutate behind an unsupported manifest or a linked/private-policy gap.
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
    !== (process.platform === 'win32' ? expected.toLowerCase() : expected)) {
    fail('SCHEMA_MISMATCH',
      'coordination writes require the exact current workspace database');
  }
  const manifest = join(root, '.kai', 'manifest.json');
  if (!existsSync(manifest)) fail('SCHEMA_MISMATCH', 'workspace coordination writes require a schema 5 manifest');
  if (pathHasLink(root, manifest) || !exactPath(manifest) || !lstatSync(manifest).isFile()) {
    fail('INVALID_INPUT', 'coordination manifest must be an exact unlinked regular file');
  }
  const parsed = readWorkspaceContract(root, {env});
  if (!existsSync(path)) fail('SCHEMA_MISMATCH', 'schema-5 coordination database is missing');
  if (pathHasLink(root, path) || !exactPath(path) || !lstatSync(path).isFile()) {
    fail('INVALID_INPUT', 'coordination database must be the exact unlinked schema-5 regular file');
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
