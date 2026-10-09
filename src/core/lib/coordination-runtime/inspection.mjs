import {existsSync} from 'node:fs';
import {safePath, exactFile} from './evidence-content.mjs';
import {readWorkspaceManifest, validateSchema5Manifest} from '../workspace-resolve.mjs';
import {COORDINATION_DATABASE, WORKSPACE_SCHEMA_VERSION} from '../workspace-layout.mjs';
import {inspectGitPrivacy} from '../workspace-git-privacy.mjs';
import {readDirection} from '../direction.mjs';
import {closeStore, openStore, readStoreSummary} from './store.mjs';

export function inspectRuntime(root, {env = process.env, intent = 'coordinate'} = {}) {
  const result = {errors: [], warnings: [], runtime: null};
  if (!['inspect', 'coordinate'].includes(intent)) {
    result.errors.push('workspace intent must be inspect or coordinate');
    return result;
  }
  let store;
  try {
    const current = readWorkspaceManifest(root);
    if (!current.ok) {
      result.errors.push(current.reason);
      return result;
    }
    if (current.manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
      result.errors.push(
        'workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard',
      );
      return result;
    }
    const validation = validateSchema5Manifest(root, current.manifest, {env});
    result.errors.push(...validation.errors);
    const privacy = inspectGitPrivacy(root, current.manifest.placement);
    result.errors.push(...privacy.errors, ...privacy.missing.map(path =>
      `private workspace path must be ignored: ${path}`));
    if (current.manifest.placement === 'repo-local' && !privacy.gitRoot) {
      result.errors.push('repo-local placement requires a readable Git work tree');
    }
    result.warnings.push(...privacy.warnings);
    try {
      readDirection({workspaceRoot: root, manifest: current.manifest});
    } catch (error) {
      result.errors.push(error.message);
    }
    if (result.errors.length) return result;
    const databasePath = safePath(root, COORDINATION_DATABASE);
    if (!existsSync(databasePath)) {
      result.errors.push(`schema 5 coordination database is missing at ${COORDINATION_DATABASE}`);
      return result;
    }
    exactFile(root, COORDINATION_DATABASE);
    store = openStore({path: databasePath, mode: 'read'});
    result.runtime = readStoreSummary(store);
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    closeStore(store);
  }
  return result;
}
