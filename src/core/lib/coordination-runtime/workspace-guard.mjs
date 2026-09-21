import {existsSync, readFileSync} from 'node:fs';
import {basename, dirname, join, resolve} from 'node:path';
import {RuntimeError} from './contract.mjs';
import {pathHasLink} from '../workspace-path-safety.mjs';
import {privateAdmission} from './migration-files.mjs';

/** The store remains usable in isolation; canonical workspace stores must never
 * mutate behind a schema-3 manifest or an offline migration/rollback lock.
 */
export function assertWorkspaceWrite(path, {privateCheck = true, requirePrivate = false} = {}) {
  if (basename(path) !== 'coordination.sqlite') return;
  const state = dirname(resolve(path));
  if (basename(state) !== 'state' || basename(dirname(state)) !== '.kai') return;
  const root = dirname(dirname(state));
  const manifest = join(root, '.kai', 'manifest.json');
  if (!existsSync(manifest)) throw new RuntimeError('SCHEMA_MISMATCH', 'workspace coordination writes require a schema 4 manifest');
  if (pathHasLink(root, manifest) || pathHasLink(root, path)) throw new RuntimeError('INVALID_INPUT', 'coordination workspace paths cannot traverse links');
  let parsed;
  try { parsed = JSON.parse(readFileSync(manifest, 'utf8')); }
  catch { throw new RuntimeError('SCHEMA_MISMATCH', 'coordination manifest is unreadable'); }
  if (parsed.schema_version !== 4) throw new RuntimeError('SCHEMA_MISMATCH', 'schema 3/future workspaces are inspect-only; coordinated writes require schema 4');
  if (existsSync(join(state, 'migration.lock'))) throw new RuntimeError('RECOVERY_REQUIRED', 'offline migration/rollback lock prevents coordinated work');
  if (privateCheck && (requirePrivate || parsed.coordination_migration)) {
    const privacy = privateAdmission(root);
    if (privacy.errors.length) throw new RuntimeError('INVALID_INPUT', privacy.errors.join('; '));
  }
}
