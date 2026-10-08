import {dirname, posix as path, resolve} from 'node:path';
import {
  assertArtifactLifecycle,
  assertShippedPackNamespace,
  assertWorkspaceSegment,
  badPath,
} from './workspace-path-safety.mjs';

export const WORKSPACE_SCHEMA_VERSION = 5;
export const PRIVATE_ROOT = '.kai';
export const PUBLICATION_ROOT = 'docs/kai';
export const DIRECTION_PATH = 'docs/kai/DIRECTION.md';
export const COORDINATION_DATABASE = '.kai/core/runtime/coordination.sqlite';
export const LEGACY_COORDINATION_DATABASE = '.kai/state/coordination.sqlite';

function artifactRoute({pack, type, subtype = null, id}) {
  return [
    assertShippedPackNamespace(pack),
    assertWorkspaceSegment(type, 'type'),
    ...(subtype == null ? [] : [assertWorkspaceSegment(subtype, 'subtype')]),
    assertWorkspaceSegment(id, 'id'),
  ];
}

function assertDerivedPath(relativePath, label) {
  const problem = badPath(relativePath);
  if (problem) throw new TypeError(`${label} must stay workspace-relative (${problem})`);
  return relativePath;
}

export function privateArtifactDirectory({pack, type, subtype = null, id, lifecycle}) {
  return assertDerivedPath(
    path.join(PRIVATE_ROOT, ...artifactRoute({pack, type, subtype, id}), assertArtifactLifecycle(lifecycle)),
    'private artifact path',
  );
}

export function archivedArtifactDirectory({pack, type, subtype = null, id}) {
  const [safePack, safeType, ...tail] = artifactRoute({pack, type, subtype, id});
  return assertDerivedPath(path.join(PRIVATE_ROOT, safePack, 'archive', safeType, ...tail), 'archived artifact path');
}

export function publicationDirectory({pack, type, subtype = null, id}) {
  return assertDerivedPath(path.join(PUBLICATION_ROOT, ...artifactRoute({pack, type, subtype, id})), 'publication path');
}

export function directionPath() {
  return assertDerivedPath(DIRECTION_PATH, 'direction path');
}

export function workspaceRootFromCoordinationDatabase(databasePath) {
  const absolute = resolve(databasePath);
  for (const relativePath of [COORDINATION_DATABASE, LEGACY_COORDINATION_DATABASE]) {
    let root = absolute;
    for (const _segment of relativePath.split('/')) root = dirname(root);
    const candidate = resolve(root, ...relativePath.split('/'));
    if ((process.platform === 'win32' ? candidate.toLowerCase() : candidate) ===
      (process.platform === 'win32' ? absolute.toLowerCase() : absolute)) return root;
  }
  throw new TypeError('coordination database path does not use a supported workspace location');
}
