import {dirname, posix as path, resolve} from 'node:path';
import {
  ACTIVE_ARTIFACT_LIFECYCLES,
  assertArtifactLifecycle,
  assertShippedPackNamespace,
  assertWorkspaceSegment,
  badPath,
} from './workspace-path-safety.mjs';

export const WORKSPACE_CONTRACT = Object.freeze({
  schemaVersion: 5,
  privateRoot: '.kai',
  publicationRoot: 'docs/kai',
  directionPath: 'docs/kai/DIRECTION.md',
  coordinationDatabase: '.kai/core/runtime/coordination.sqlite',
  packs: Object.freeze(['core', 'creative', 'engineering']),
  lifecycles: Object.freeze(['drafts', 'evidence', 'scratch']),
});

export const WORKSPACE_SCHEMA_VERSION = WORKSPACE_CONTRACT.schemaVersion;
export const PRIVATE_ROOT = WORKSPACE_CONTRACT.privateRoot;
export const PUBLICATION_ROOT = WORKSPACE_CONTRACT.publicationRoot;
export const DIRECTION_PATH = WORKSPACE_CONTRACT.directionPath;
export const COORDINATION_DATABASE = WORKSPACE_CONTRACT.coordinationDatabase;

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

function safeRouteSegments(relativePath) {
  if (typeof relativePath !== 'string' || relativePath.includes('\\')) {
    throw new TypeError('typed artifact route must use a workspace-relative POSIX path');
  }
  const problem = badPath(relativePath);
  if (problem) throw new TypeError(`typed artifact route must stay workspace-relative (${problem})`);
  const segments = relativePath.split('/');
  if (segments.some(segment => segment.length === 0)) {
    throw new TypeError('typed artifact route cannot contain empty segments');
  }
  return segments;
}

function parsedRoute({pack, type, subtype = null, id, lifecycle = null, members = []}) {
  return {
    pack: assertShippedPackNamespace(pack),
    type: assertWorkspaceSegment(type, 'type'),
    subtype: subtype === null ? null : assertWorkspaceSegment(subtype, 'subtype'),
    id: assertWorkspaceSegment(id, 'id'),
    lifecycle,
    members: members.map((member, index) => assertWorkspaceSegment(member, `member[${index}]`)),
  };
}

export function parseTypedArtifactRoute(relativePath) {
  const segments = safeRouteSegments(relativePath);
  if (segments[0] === PRIVATE_ROOT) {
    const route = segments.slice(1);
    const routes = [];
    if (ACTIVE_ARTIFACT_LIFECYCLES.has(route[3])) {
      routes.push(parsedRoute({
        pack: route[0],
        type: route[1],
        id: route[2],
        lifecycle: assertArtifactLifecycle(route[3]),
        members: route.slice(4),
      }));
    }
    if (ACTIVE_ARTIFACT_LIFECYCLES.has(route[4])) {
      routes.push(parsedRoute({
        pack: route[0],
        type: route[1],
        subtype: route[2],
        id: route[3],
        lifecycle: assertArtifactLifecycle(route[4]),
        members: route.slice(5),
      }));
    }
    if (routes.length === 0) {
      throw new TypeError(
        'typed private artifact route must contain pack, type, optional subtype, id, and lifecycle',
      );
    }
    return {path: relativePath, visibility: 'private', routes};
  }

  const publicRoot = PUBLICATION_ROOT.split('/');
  if (segments[0] !== publicRoot[0] || segments[1] !== publicRoot[1]) {
    throw new TypeError(`typed public artifact route must stay below ${PUBLICATION_ROOT}`);
  }
  const route = segments.slice(publicRoot.length);
  if (route.length < 3) {
    throw new TypeError('typed public artifact route must contain pack, type, optional subtype, and id');
  }
  const routes = [parsedRoute({
    pack: route[0],
    type: route[1],
    id: route[2],
    members: route.slice(3),
  })];
  if (route.length >= 4) {
    routes.push(parsedRoute({
      pack: route[0],
      type: route[1],
      subtype: route[2],
      id: route[3],
      members: route.slice(4),
    }));
  }
  return {path: relativePath, visibility: 'public', routes};
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
  let root = absolute;
  for (const _segment of COORDINATION_DATABASE.split('/')) root = dirname(root);
  const candidate = resolve(root, ...COORDINATION_DATABASE.split('/'));
  if ((process.platform === 'win32' ? candidate.toLowerCase() : candidate) ===
    (process.platform === 'win32' ? absolute.toLowerCase() : absolute)) return root;
  throw new TypeError('coordination database path does not use the current workspace location');
}
