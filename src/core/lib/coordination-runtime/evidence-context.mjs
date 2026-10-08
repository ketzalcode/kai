import {isAbsolute, join} from 'node:path';
import {assertExactKeys, canonicalJson, validateActor, validateAuthority} from './contract.mjs';
import {normalized} from '../workspace-path-safety.mjs';
import {assertWorkspacePath, durablePath, fail, workspaceManifest} from './evidence-content.mjs';
import {
  COORDINATION_DATABASE,
  LEGACY_COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
} from '../workspace-layout.mjs';

const bindings = new WeakMap();
const transactions = new WeakMap();
const clone = value => JSON.parse(canonicalJson(value));

// Host composition only: neither paths nor verifier capabilities come from command JSON.
export function bindEvidenceRuntime(store, options) {
  assertExactKeys(options, new Set([
    'root', 'authority', 'runs', 'verifyCapture', 'verifyOperatorDecision',
  ]), 'evidence runtime', new Set(['root', 'authority', 'runs']));
  const manifest = workspaceManifest(options.root);
  const database = manifest.schema_version === WORKSPACE_SCHEMA_VERSION
    ? COORDINATION_DATABASE
    : LEGACY_COORDINATION_DATABASE;
  if (!store || store.closed || !isAbsolute(store.path)
    || normalized(store.path) !== normalized(join(options.root, ...database.split('/')))) {
    fail('INVALID_INPUT', 'evidence workspace must be explicitly bound to this store');
  }
  assertWorkspacePath(options.root, database);
  validateAuthority(options.authority);
  if (!Array.isArray(options.runs)) fail('INVALID_INPUT', 'approved run bindings must be an array');
  const actors = new Set();
  const directories = new Set();
  for (const run of options.runs) {
    assertExactKeys(run, new Set(['actor', 'directory']), 'approved run');
    validateActor(run.actor);
    const directory = durablePath(run.directory);
    if (directory !== run.directory
      || !/^\.kai\/(core|engineering|creative)\/[a-z0-9][a-z0-9._-]*\/[a-z0-9][a-z0-9._-]*\/(drafts|evidence|scratch)(?:\/[a-z0-9][a-z0-9._-]*)*$/.test(directory)
      || actors.has(canonicalJson(run.actor)) || directories.has(directory.toLowerCase())) {
      fail('INVALID_INPUT', 'approved run directories must be unique typed private artifact paths');
    }
    assertWorkspacePath(options.root, `${directory}/.evidence/probe`);
    actors.add(canonicalJson(run.actor));
    directories.add(directory.toLowerCase());
  }
  for (const key of ['verifyCapture', 'verifyOperatorDecision']) {
    if (options[key] !== undefined && typeof options[key] !== 'function') {
      fail('INVALID_INPUT', `${key} must be a trusted host function`);
    }
  }
  bindings.set(store, {
    ...options, root: normalized(options.root),
    authority: clone(options.authority), runs: clone(options.runs),
  });
}

export function bindEvidenceTransaction(store, tx) {
  transactions.set(tx, store);
  return tx;
}

/** Ephemeral filesystem verification context, not a host or mutation grant. */
export function bindEvidenceReadView(tx, {root}) {
  workspaceManifest(root);
  bindings.set(tx, {root: normalized(root)});
  return tx;
}

export function contextFor(storeOrTransaction) {
  const store = transactions.get(storeOrTransaction) ?? storeOrTransaction;
  const context = bindings.get(store);
  if (!context || store.closed) {
    fail('AUTHORITY_REQUIRED', 'bind the explicit workspace and host authority before evidence operations or acceptance');
  }
  workspaceManifest(context.root);
  return context;
}
