// Shared workspace discovery for every kai CLI.
//
// Resolution precedence:
//   1. exact explicit root
//   2. exact KAI_WORKSPACE_ROOT
//   3. in-tree .kai/manifest.json
//   4. machine-local project registry
//
// The registry is what makes an external workspace rediscoverable without
// leaving kai files in the project repository.

import { existsSync, readFileSync, realpathSync } from 'node:fs';
import { homedir } from 'node:os';
import {
  dirname, isAbsolute, join, parse as parsePath, relative, resolve as resolvePath, sep,
} from 'node:path';
import {
  badPath, canonicalPath, escapesRoot, exactPath, normalized, pathHasLink, resolvedProjectPath,
} from './workspace-path-safety.mjs';
import {
  DIRECTION_PATH,
  PRIVATE_ROOT,
  WORKSPACE_SCHEMA_VERSION,
} from './workspace-layout.mjs';

export const MANIFEST_REL = join('.kai', 'manifest.json');
export const REGISTRY_FILE = 'workspaces.json';
export const SCHEMA5_MANIFEST_KEYS = Object.freeze([
  'plugin',
  'version',
  'schema_version',
  'scaffolded',
  'workspace_id',
  'placement',
  'workspace_root',
  'private_root',
  'direction',
  'projects',
]);
export const SCHEMA5_PROJECT_KEYS = Object.freeze([
  'id',
  'path',
  'publication_root',
]);
const MAX_SEARCH_DEPTH = 64;
const PROJECT_ID = /^[a-z][a-z0-9-]*$/;
const WORKSPACE_ID = /^[a-z0-9][a-z0-9-]{7,}$/i;

function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}

function isWithin(parent, candidate) {
  const rel = relative(normalized(parent), normalized(candidate));
  return rel === '' || (rel !== '..' && !rel.startsWith(`..${sep}`) && !isAbsolute(rel));
}

function hasManifest(dir) {
  return existsSync(join(dir, MANIFEST_REL));
}

function readJson(path) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(path, 'utf8')) };
  } catch (error) {
    return { ok: false, reason: `${path} is not valid JSON: ${error.message}` };
  }
}

export function defaultKaiHome(env = process.env) {
  return resolvePath(env.KAI_HOME || join(homedir(), '.kai'));
}

export function registryPath(env = process.env) {
  return join(defaultKaiHome(env), REGISTRY_FILE);
}

export function searchUpward(startDir) {
  if (nativeAbsolutePathProblem(startDir, {
    label: 'workspace search root',
    requireExisting: true,
    requireCanonical: true,
  })) return null;
  let dir = resolvePath(startDir);
  for (let depth = 0; depth < MAX_SEARCH_DEPTH; depth++) {
    if (hasManifest(dir)) return dir;
    const parent = dirname(dir);
    if (parent === dir || parent === parsePath(dir).root) return null;
    dir = parent;
  }
  return null;
}

export function readWorkspaceManifest(root) {
  const path = join(resolvePath(root), MANIFEST_REL);
  if (!existsSync(path)) {
    return { ok: false, reason: `no ${MANIFEST_REL} in workspace root "${resolvePath(root)}"` };
  }
  const parsed = readJson(path);
  if (!parsed.ok) return parsed;
  if (!parsed.value || typeof parsed.value !== 'object' || Array.isArray(parsed.value)) {
    return { ok: false, reason: `${path} must contain a JSON object` };
  }
  return { ok: true, path, manifest: parsed.value };
}

function exactKeys(value, required, label, errors) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  const expected = new Set(required);
  for (const key of required) {
    if (!Object.hasOwn(value, key)) errors.push(`${label} missing required key "${key}"`);
  }
  for (const key of Object.keys(value)) {
    if (!expected.has(key)) errors.push(`${label} contains unexpected key "${key}"`);
  }
}

function portableAbsoluteKind(value) {
  if (typeof value !== 'string') return null;
  if (/^(?:\\\\|\/\/)/.test(value)) return 'network';
  if (/^[A-Za-z]:[\\/]/.test(value)) return 'windows';
  if (/^\//.test(value)) return 'posix';
  return null;
}

function isNativeAbsolute(value) {
  const kind = portableAbsoluteKind(value);
  return isAbsolute(value)
    && (process.platform === 'win32' ? kind === 'windows' : kind === 'posix');
}

function usesCanonicalPhysicalPath(value) {
  return exactPath(value);
}

export function nativeAbsolutePathProblem(value, {
  label = 'path',
  requireExisting = false,
  requireCanonical = false,
} = {}) {
  if (typeof value !== 'string' || !value.trim()) return `${label} must be a native absolute path`;
  const kind = portableAbsoluteKind(value);
  if (kind === 'network') return `${label} cannot use a UNC, device, or network path`;
  if (!kind || !isNativeAbsolute(value)) return `${label} must be a native absolute path`;
  if (requireExisting && !existsSync(value)) return `${label} does not exist`;
  if (requireCanonical && (!usesCanonicalPhysicalPath(value) || pathHasLink(value, value))) {
    return `${label} cannot use links, junctions, or filesystem aliases`;
  }
  return null;
}

export function validateSchema5Manifest(root, manifest, {
  env = process.env,
  allowUnregisteredExternal = false,
} = {}) {
  root = resolvePath(root);
  const errors = [];
  exactKeys(manifest, SCHEMA5_MANIFEST_KEYS, '.kai/manifest.json', errors);
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    return {errors, projects: []};
  }
  const rootKind = portableAbsoluteKind(root);
  if (rootKind === 'network') errors.push('workspace root cannot use a UNC, device, or network path');
  else if (pathHasLink(root, root) || !usesCanonicalPhysicalPath(root)) {
    errors.push('workspace root cannot use a symbolic link, junction, or filesystem alias');
  }
  if (manifest.plugin !== 'kai-core') errors.push('.kai/manifest.json "plugin" must be exactly "kai-core"');
  if (typeof manifest.version !== 'string' || !manifest.version.trim()) {
    errors.push('.kai/manifest.json "version" must be a non-empty string');
  }
  if (manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    errors.push(`.kai/manifest.json "schema_version" must be ${WORKSPACE_SCHEMA_VERSION}`);
  }
  if (typeof manifest.scaffolded !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(manifest.scaffolded)) {
    errors.push('.kai/manifest.json "scaffolded" must be an ISO date or timestamp');
  }
  if (typeof manifest.workspace_id !== 'string' || !WORKSPACE_ID.test(manifest.workspace_id)) {
    errors.push('.kai/manifest.json "workspace_id" must be a stable UUID or UUID-like identifier');
  }
  if (!['repo-local', 'external'].includes(manifest.placement)) {
    errors.push('.kai/manifest.json "placement" must be "repo-local" or "external"');
  }
  if (manifest.private_root !== PRIVATE_ROOT) {
    errors.push(`.kai/manifest.json "private_root" must be exactly "${PRIVATE_ROOT}"`);
  }
  if (manifest.direction !== DIRECTION_PATH) {
    errors.push(`.kai/manifest.json "direction" must be exactly "${DIRECTION_PATH}"`);
  }
  if (manifest.placement === 'repo-local' && manifest.workspace_root !== '.') {
    errors.push('.kai/manifest.json repo-local "workspace_root" must be "."');
  }
  if (manifest.placement === 'external') {
    const kind = portableAbsoluteKind(manifest.workspace_root);
    if (!kind || !isNativeAbsolute(manifest.workspace_root)) {
      errors.push('.kai/manifest.json external "workspace_root" must be a native absolute path');
    } else if (kind === 'network') {
      errors.push('.kai/manifest.json external "workspace_root" cannot use a UNC, device, or network path');
    } else if (normalized(manifest.workspace_root) !== normalized(root)) {
      errors.push(`.kai/manifest.json external "workspace_root" does not match "${root}"`);
    }
  }

  const projects = [];
  if (!Array.isArray(manifest.projects) || manifest.projects.length === 0) {
    errors.push('.kai/manifest.json "projects" must contain at least one project binding');
  } else {
    const ids = new Set();
    const roots = new Set();
    for (const [index, project] of manifest.projects.entries()) {
      const label = `.kai/manifest.json projects[${index}]`;
      exactKeys(project, SCHEMA5_PROJECT_KEYS, label, errors);
      if (!project || typeof project !== 'object' || Array.isArray(project)) continue;
      if (!PROJECT_ID.test(project.id || '')) errors.push(`${label}.id must be kebab-case`);
      else if (ids.has(project.id)) errors.push(`${label}.id "${project.id}" is duplicated`);
      else ids.add(project.id);

      try {
        assertSafeProjectPath(project);
      } catch (error) {
        errors.push(`${label}.path is unsafe: ${error.message}`);
      }
      const pathKind = portableAbsoluteKind(project.path);
      if (manifest.placement === 'repo-local' && project.path !== '.') {
        errors.push(`${label}.path must be "." for repo-local placement`);
      }
      if (manifest.placement === 'external' && (!pathKind || !isNativeAbsolute(project.path))) {
        errors.push(`${label}.path must be a native absolute path for external placement`);
      }
      if (pathKind === 'network') errors.push(`${label}.path cannot use a UNC, device, or network path`);

      const publicationProblem = badPath(project.publication_root);
      const publicationRoot = typeof project.publication_root === 'string'
        ? project.publication_root.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '')
        : '';
      if (!publicationRoot) errors.push(`${label}.publication_root is required`);
      else if (publicationProblem) errors.push(`${label}.publication_root is a ${publicationProblem}`);
      else if (publicationRoot.toLowerCase() === PRIVATE_ROOT
        || publicationRoot.toLowerCase().startsWith(`${PRIVATE_ROOT}/`)) {
        errors.push(`${label}.publication_root must be outside ${PRIVATE_ROOT}/`);
      } else if (publicationRoot !== 'docs/kai') {
        errors.push(`${label}.publication_root must be exactly "docs/kai"`);
      }

      if (typeof project.path !== 'string' || !project.path.trim()
        || pathKind === 'network'
        || (manifest.placement === 'repo-local' && project.path !== '.')
        || (manifest.placement === 'external' && !isNativeAbsolute(project.path))) {
        continue;
      }
      const projectRoot = resolvedProjectPath(root, project.path);
      const canonicalRoot = canonicalPath(projectRoot);
      if (!existsSync(projectRoot)) errors.push(`${label}.path does not exist: "${projectRoot}"`);
      else if (pathHasLink(projectRoot, projectRoot) || !usesCanonicalPhysicalPath(projectRoot)) {
        errors.push(`${label}.path cannot use a symbolic link, junction, or filesystem alias`);
      }
      const rootKey = normalized(projectRoot);
      if (roots.has(rootKey)) errors.push(`${label}.path duplicates another project binding`);
      roots.add(rootKey);
      if (manifest.placement === 'external'
        && (!escapesRoot(root, projectRoot) || !escapesRoot(projectRoot, root))) {
        errors.push(`${label}.path overlaps the external workspace root`);
      }
      const projectPrivateRoot = join(projectRoot, '.kai');
      if (manifest.placement === 'external'
        && (existsSync(projectPrivateRoot) || pathHasLink(projectRoot, projectPrivateRoot))) {
        errors.push(`${label}.path must not contain project-local .kai state for external placement`);
      }

      const publicationRootAbsolute = resolvePath(projectRoot, ...publicationRoot.split('/').filter(Boolean));
      if (publicationRoot && (escapesRoot(projectRoot, publicationRootAbsolute)
        || pathHasLink(projectRoot, publicationRootAbsolute)
        || (existsSync(publicationRootAbsolute) && !usesCanonicalPhysicalPath(publicationRootAbsolute)))) {
        errors.push(`${label}.publication_root escapes the configured project through a link or alias`);
      }
      projects.push({
        project,
        projectRoot: canonicalRoot,
        publicationRoot,
        publicationRootAbsolute,
      });
    }
  }

  if (manifest.placement === 'external' && !allowUnregisteredExternal) {
    const registry = loadWorkspaceRegistry(env);
    if (!registry.ok) errors.push(registry.reason);
    else {
      if (!registry.entries.some(entry => entry.workspace_id === manifest.workspace_id
        && normalized(entry.workspace_root) === normalized(root))) {
        errors.push(`external workspace is not registered in "${registry.path}"`);
      }
      for (const {project, projectRoot} of projects) {
        const matches = registry.entries.filter(entry =>
          normalized(entry.project_root) === normalized(projectRoot));
        if (matches.length !== 1) {
          errors.push(`external project "${project.id}" requires exactly one registry binding`);
        } else if (matches[0].workspace_id !== manifest.workspace_id
          || normalized(matches[0].workspace_root) !== normalized(root)) {
          errors.push(`external project "${project.id}" is not paired with this workspace`);
        }
      }
    }
  }
  return {errors, projects};
}

function loadWorkspaceRegistryWithPolicy(env = process.env, {
  requireExisting = true,
  requireCanonical = true,
} = {}) {
  const path = registryPath(env);
  if (!existsSync(path)) return { ok: true, path, entries: [] };
  const parsed = readJson(path);
  if (!parsed.ok) return parsed;
  if (parsed.value?.schema_version !== 1 || !Array.isArray(parsed.value.workspaces)) {
    return { ok: false, reason: `${path} must contain schema_version 1 and a workspaces array` };
  }
  for (const [index, entry] of parsed.value.workspaces.entries()) {
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
      return { ok: false, reason: `${path} workspaces[${index}] must be an object` };
    }
    for (const key of ['project_root', 'workspace_root', 'workspace_id']) {
      if (typeof entry[key] !== 'string' || !entry[key].trim()) {
        return { ok: false, reason: `${path} workspaces[${index}] is missing string "${key}"` };
      }
    }
    const projectProblem = nativeAbsolutePathProblem(entry.project_root, {
      label: `${path} workspaces[${index}].project_root`,
      requireExisting,
      requireCanonical,
    });
    const workspaceProblem = nativeAbsolutePathProblem(entry.workspace_root, {
      label: `${path} workspaces[${index}].workspace_root`,
      requireExisting,
      requireCanonical,
    });
    if (projectProblem || workspaceProblem) {
      return {
        ok: false,
        reason: projectProblem ?? workspaceProblem,
      };
    }
  }
  return { ok: true, path, entries: parsed.value.workspaces };
}

export function loadWorkspaceRegistry(env = process.env) {
  return loadWorkspaceRegistryWithPolicy(env, {
    requireExisting: true,
    requireCanonical: true,
  });
}

export function loadWorkspaceRegistryForCleanup(env = process.env) {
  return loadWorkspaceRegistryWithPolicy(env, {
    requireExisting: false,
    requireCanonical: false,
  });
}

function validateRegisteredWorkspace(entry, projectRoot) {
  if (!entry || typeof entry !== 'object') {
    return { ok: false, reason: 'workspace registry contains a non-object entry' };
  }
  for (const key of ['project_root', 'workspace_root', 'workspace_id']) {
    if (typeof entry[key] !== 'string' || !entry[key].trim()) {
      return { ok: false, reason: `workspace registry entry is missing "${key}"` };
    }
  }
  const projectProblem = nativeAbsolutePathProblem(entry.project_root, {
    label: 'workspace registry project_root',
    requireExisting: true,
    requireCanonical: true,
  });
  const workspaceProblem = nativeAbsolutePathProblem(entry.workspace_root, {
    label: 'workspace registry workspace_root',
    requireExisting: true,
    requireCanonical: true,
  });
  if (projectProblem || workspaceProblem) return {ok: false, reason: projectProblem ?? workspaceProblem};
  if (normalized(entry.project_root) !== normalized(projectRoot)) {
    return { ok: false, reason: 'workspace registry project path changed during resolution' };
  }
  const manifestResult = readWorkspaceManifest(entry.workspace_root);
  if (!manifestResult.ok) return manifestResult;
  const manifest = manifestResult.manifest;
  if (![3, 4, 5].includes(manifest.schema_version)) {
    return {
      ok: false,
      reason: `registered workspace manifest uses schema ${JSON.stringify(manifest.schema_version)}, expected schema 3, 4, or 5`,
    };
  }
  const placement = manifest.schema_version === 5 ? manifest.placement : manifest.storage_mode;
  if (placement !== 'external') {
    return {
      ok: false,
      reason: `registered workspace manifest placement must be "external", found ${JSON.stringify(placement)}`,
    };
  }
  if (manifest.workspace_id !== entry.workspace_id) {
    return {
      ok: false,
      reason: `workspace registry id "${entry.workspace_id}" does not match manifest id ${JSON.stringify(manifest.workspace_id)}`,
    };
  }
  if (!Array.isArray(manifest.projects)) {
    return { ok: false, reason: 'registered workspace manifest has no projects array' };
  }
  const bindsProject = manifest.projects.some((project) => {
    if (!project || typeof project.path !== 'string') return false;
    const manifestProject = resolvedProjectPath(entry.workspace_root, project.path);
    return normalized(manifestProject) === normalized(projectRoot);
  });
  if (!bindsProject) {
    return {
      ok: false,
      reason: `workspace manifest "${manifestResult.path}" does not bind registered project "${projectRoot}"`,
    };
  }
  return { ok: true, root: realpathSync.native(entry.workspace_root) };
}

export function findRegisteredWorkspace(cwd, env = process.env) {
  const cwdProblem = nativeAbsolutePathProblem(cwd, {
    label: 'registry discovery cwd',
    requireExisting: true,
    requireCanonical: true,
  });
  if (cwdProblem) return {ok: false, reason: cwdProblem};
  const registry = loadWorkspaceRegistry(env);
  if (!registry.ok) return registry;
  const matches = registry.entries
    .filter((entry) => isWithin(entry.project_root, cwd))
    .sort((left, right) => normalized(right.project_root).length - normalized(left.project_root).length);
  if (!matches.length) return { ok: true, root: null, registryPath: registry.path };

  const projectRoot = realpathSync.native(matches[0].project_root);
  const duplicate = matches.filter(
    (entry) => normalized(entry.project_root) === normalized(projectRoot),
  );
  if (duplicate.length > 1) {
    return {
      ok: false,
      reason: `workspace registry has ${duplicate.length} entries for project "${projectRoot}"`,
    };
  }
  const validated = validateRegisteredWorkspace(matches[0], projectRoot);
  if (!validated.ok) return validated;
  return { ok: true, root: validated.root, projectRoot, registryPath: registry.path };
}

/**
 * Resolve the workspace root a CLI should operate against.
 *
 * @returns {{ok: true, root: string, source: 'explicit'|'env'|'search'|'registry', projectRoot?: string}
 *   | {ok: false, reason: string}}
 */
export function resolveWorkspaceRoot(opts = {}) {
  const { explicitRoot, cwd = process.cwd(), env = process.env } = opts;

  if (explicitRoot) {
    const problem = nativeAbsolutePathProblem(explicitRoot, {
      label: 'explicit workspace root',
      requireExisting: true,
      requireCanonical: true,
    });
    if (problem) return {ok: false, reason: problem};
    const root = resolvePath(explicitRoot);
    if (hasManifest(root)) return { ok: true, root, source: 'explicit' };
    return {
      ok: false,
      reason: `no ${MANIFEST_REL} in explicit root "${root}" -- explicit roots are validated directly and never searched upward`,
    };
  }

  const envRoot = env.KAI_WORKSPACE_ROOT;
  if (envRoot) {
    const problem = nativeAbsolutePathProblem(envRoot, {
      label: 'KAI_WORKSPACE_ROOT',
      requireExisting: true,
      requireCanonical: true,
    });
    if (problem) return {ok: false, reason: problem};
    const root = resolvePath(envRoot);
    if (!hasManifest(root)) {
      return { ok: false, reason: `KAI_WORKSPACE_ROOT "${root}" has no ${MANIFEST_REL}` };
    }
    return { ok: true, root, source: 'env' };
  }

  const cwdProblem = nativeAbsolutePathProblem(cwd, {
    label: 'workspace discovery cwd',
    requireExisting: true,
    requireCanonical: true,
  });
  if (cwdProblem) return {ok: false, reason: cwdProblem};
  const found = searchUpward(cwd);
  if (found) return { ok: true, root: found, source: 'search' };

  const registered = findRegisteredWorkspace(cwd, env);
  if (!registered.ok) return registered;
  if (registered.root) {
    return {
      ok: true,
      root: registered.root,
      source: 'registry',
      projectRoot: registered.projectRoot,
    };
  }
  return {
    ok: false,
    reason: `no kai workspace found from "${resolvePath(cwd)}"; no in-tree manifest or registry binding exists`,
  };
}

function normalizePublicationRoot(publicationRoot) {
  if (typeof publicationRoot !== 'string' || !publicationRoot.trim()) {
    fail('PATH_ESCAPE', 'project publication_root is required');
  }
  const problem = badPath(publicationRoot);
  if (problem) fail('PATH_ESCAPE', `project publication_root must stay project-relative (${problem})`);
  const normalizedRoot = publicationRoot.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '');
  if (!normalizedRoot) fail('PATH_ESCAPE', 'project publication_root is required');
  if (normalizedRoot.toLowerCase() === '.kai' || normalizedRoot.toLowerCase().startsWith('.kai/')) {
    fail('PATH_ESCAPE', 'project publication_root must stay outside .kai/');
  }
  return normalizedRoot;
}

function selectConfiguredProject(manifest, projectId) {
  if (!manifest || typeof manifest !== 'object' || Array.isArray(manifest)) {
    throw new TypeError('workspace manifest must be an object');
  }
  if (!Array.isArray(manifest.projects) || manifest.projects.length === 0) {
    throw new TypeError('workspace manifest must declare at least one project');
  }
  if (projectId != null) {
    const matches = manifest.projects.filter(project => project?.id === projectId);
    if (matches.length !== 1) throw new TypeError(`manifest project "${projectId}" must resolve exactly once`);
    return matches[0];
  }
  if (manifest.projects.length === 1) return manifest.projects[0];
  const defaults = manifest.projects.filter(project => project?.id === 'default');
  if (defaults.length === 1) return defaults[0];
  throw new TypeError('projectId is required when the manifest declares multiple projects');
}

function assertSafeProjectPath(project) {
  if (typeof project?.path !== 'string' || !project.path.trim()) {
    fail('PATH_ESCAPE', 'project path is required');
  }
  if (/^(\\\\|\/\/)/.test(project.path)) fail('PATH_ESCAPE', 'project path cannot use a network share');
  if (/^[A-Za-z]:(?![\\/])/.test(project.path)
    || /^\\(?!\\)/.test(project.path)
    || (process.platform === 'win32' && isAbsolute(project.path) && !/^[A-Za-z]:[\\/]/.test(project.path))) {
    fail('PATH_ESCAPE', 'project path cannot depend on the current drive or working directory');
  }
}

export function resolveConfiguredProject({workspaceRoot, manifest, projectId}) {
  const root = resolvePath(workspaceRoot);
  const project = selectConfiguredProject(manifest, projectId);
  assertSafeProjectPath(project);

  const projectRoot = resolvedProjectPath(root, project.path);
  if (pathHasLink(projectRoot, projectRoot) || !exactPath(projectRoot)) {
    fail('PATH_ESCAPE', `project "${project.id ?? 'configured'}" must resolve to its exact canonical path`);
  }
  if (normalized(projectRoot) !== normalized(root) && !escapesRoot(join(root, '.kai'), projectRoot)) {
    fail('PATH_ESCAPE', 'configured project cannot alias private workspace state');
  }

  const publicationRoot = normalizePublicationRoot(project.publication_root);
  const publicationRootAbsolute = resolvePath(projectRoot, ...publicationRoot.split('/'));
  if (escapesRoot(projectRoot, publicationRootAbsolute)
    || pathHasLink(projectRoot, publicationRootAbsolute)
    || !exactPath(publicationRootAbsolute)) {
    fail('PATH_ESCAPE', `project "${project.id ?? 'configured'}" publication_root escapes the configured project`);
  }

  return {
    project,
    projectRoot,
    publicationRoot,
    publicationRootAbsolute,
    workspaceRoot: root,
  };
}
