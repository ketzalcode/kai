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

export const MANIFEST_REL = join('.kai', 'manifest.json');
export const REGISTRY_FILE = 'workspaces.json';
const MAX_SEARCH_DEPTH = 64;

function normalizePath(path) {
  let existing = resolvePath(path);
  const tail = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    tail.unshift(existing.slice(parent.length).replace(/^[\\/]+/, ''));
    existing = parent;
  }
  const canonical = existsSync(existing) ? realpathSync(existing) : existing;
  const resolved = resolvePath(canonical, ...tail);
  return process.platform === 'win32' ? resolved.toLowerCase() : resolved;
}

function isWithin(parent, candidate) {
  const rel = relative(normalizePath(parent), normalizePath(candidate));
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

export function loadWorkspaceRegistry(env = process.env) {
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
    if (!isAbsolute(entry.project_root) || !isAbsolute(entry.workspace_root)) {
      return { ok: false, reason: `${path} workspaces[${index}] project_root and workspace_root must be absolute` };
    }
  }
  return { ok: true, path, entries: parsed.value.workspaces };
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
  if (!isAbsolute(entry.project_root) || !isAbsolute(entry.workspace_root)) {
    return { ok: false, reason: 'workspace registry paths must be absolute' };
  }
  if (normalizePath(entry.project_root) !== normalizePath(projectRoot)) {
    return { ok: false, reason: 'workspace registry project path changed during resolution' };
  }

  const manifestResult = readWorkspaceManifest(entry.workspace_root);
  if (!manifestResult.ok) return manifestResult;
  const manifest = manifestResult.manifest;
  if (manifest.schema_version !== 3) {
    return {
      ok: false,
      reason: `registered workspace manifest uses schema ${JSON.stringify(manifest.schema_version)}, expected schema 3`,
    };
  }
  if (manifest.storage_mode !== 'external') {
    return {
      ok: false,
      reason: `registered workspace manifest storage_mode must be "external", found ${JSON.stringify(manifest.storage_mode)}`,
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
    const manifestProject = isAbsolute(project.path)
      ? project.path
      : resolvePath(entry.workspace_root, project.path);
    return normalizePath(manifestProject) === normalizePath(projectRoot);
  });
  if (!bindsProject) {
    return {
      ok: false,
      reason: `workspace manifest "${manifestResult.path}" does not bind registered project "${projectRoot}"`,
    };
  }
  return { ok: true, root: realpathSync(entry.workspace_root) };
}

export function findRegisteredWorkspace(cwd, env = process.env) {
  const registry = loadWorkspaceRegistry(env);
  if (!registry.ok) return registry;
  const matches = registry.entries
    .filter((entry) => typeof entry?.project_root === 'string' && isAbsolute(entry.project_root))
    .filter((entry) => isWithin(entry.project_root, cwd))
    .sort((left, right) => normalizePath(right.project_root).length - normalizePath(left.project_root).length);
  if (!matches.length) return { ok: true, root: null, registryPath: registry.path };

  const projectRoot = realpathSync(matches[0].project_root);
  const duplicate = matches.filter(
    (entry) => normalizePath(entry.project_root) === normalizePath(projectRoot),
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
    const root = resolvePath(explicitRoot);
    if (hasManifest(root)) return { ok: true, root, source: 'explicit' };
    return {
      ok: false,
      reason: `no ${MANIFEST_REL} in explicit root "${root}" -- explicit roots are validated directly and never searched upward`,
    };
  }

  const envRoot = env.KAI_WORKSPACE_ROOT;
  if (envRoot) {
    if (!isAbsolute(envRoot)) {
      return { ok: false, reason: `KAI_WORKSPACE_ROOT must be an absolute path, got "${envRoot}"` };
    }
    const root = resolvePath(envRoot);
    if (!hasManifest(root)) {
      return { ok: false, reason: `KAI_WORKSPACE_ROOT "${root}" has no ${MANIFEST_REL}` };
    }
    return { ok: true, root, source: 'env' };
  }

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
