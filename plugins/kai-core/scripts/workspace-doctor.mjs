#!/usr/bin/env node
// workspace-doctor — dependency-light validator for a kai *consumer* workspace.
//
// `validate-plugin.mjs` proves the plugin SOURCE is internally consistent.
// This doctor proves a GENERATED workspace (a repo or external folder a user
// onboarded) is well-formed and schema-compatible before coordinated agents act
// on it. It uses only Node built-ins so any host can run it.
//
// It also carries the pack-migration check (#29): an explicit, read-only report
// on whether this HOST may install the pack surface — legacy `kai` verifiably
// uninstalled, no coexistence, provenance known. That check is opt-in
// (`--migration-check`) rather than part of the default run, because the default
// run inspects a workspace and must not depend on a host it was not asked about.
//
// Usage:
//   node scripts/workspace-doctor.mjs [--root <dir>]   validate a workspace
//   node scripts/workspace-doctor.mjs --registry [--json]
//   node scripts/workspace-doctor.mjs --adopt <project-dir> --root <external-workspace>
//   node scripts/workspace-doctor.mjs --forget <project-dir>
//   node scripts/workspace-doctor.mjs --migration-check [--rollback] [--home <dir>] [--root <dir>] [--json]
//   node scripts/workspace-doctor.mjs --self-test      run against bundled fixtures
//
// Workspace exit code: 0 = healthy, 1 = invalid.
// Migration exit code: 0 = clear, 2 = blocked, 3 = unknown.

import {
  readFileSync, existsSync, readdirSync, cpSync, writeFileSync, mkdirSync, mkdtempSync, rmSync,
  lstatSync, readlinkSync, renameSync, symlinkSync, realpathSync, openSync, closeSync, unlinkSync,
} from 'node:fs';
import { spawn, spawnSync } from 'node:child_process';
import { join, resolve, dirname, basename, relative, isAbsolute, sep } from 'node:path';
import { tmpdir } from 'node:os';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  LIFECYCLE, NEEDS_CHANGE_REF, REQUIRES_STATES,
  frontmatter, scalar, cleanScalar, isNull, unquote, dependsOn, lease, listBlock, parseStamp,
} from './lib/coordination.mjs';
import {
  WORKSPACE_PROVENANCE, LEGACY_PLUGIN, CORE_PLUGIN,
  defaultHome, migrationReport, parseJsonc, installTreeTail, normalizeHostPath,
} from './lib/migration-doctor.mjs';
import {
  defaultKaiHome, loadWorkspaceRegistry, readWorkspaceManifest, registryPath, resolveWorkspaceRoot,
} from './lib/workspace-resolve.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));

// --- Contract constants the current plugin generates -----------------------
const CURRENT_SCHEMA_VERSION = 3;
const REQUIRED_MANIFEST_KEYS = [
  'plugin', 'version', 'schema_version', 'scaffolded', 'workspace_id',
  'storage_mode', 'workspace_root', 'state', 'runs', 'review', 'archive',
  'personal', 'projects', 'areas',
];
const DEFAULT_ROOTS = {
  state: '.kai/state',
  runs: '.kai/runs',
  review: '.kai/review',
  archive: '.kai/archive',
  personal: '.kai/personal',
};
const CANONICAL_AREAS = new Set([
  'qa', 'eng', 'product', 'revenue', 'support', 'review', 'ship', 'incident',
  'ai', 'learn', 'lessons', 'pulse', 'content',
]);
const STORAGE_MODES = new Set(['external', 'repo-local', 'shared']);
const REQUIRES_EXISTING_ARTIFACTS = new Set([
  'in-review', 'completed', 'release-ready', 'deploying', 'production-verification', 'shipped',
]);
const PROJECT_ID = /^[a-z][a-z0-9-]*$/;
const WORKSPACE_ID = /^[a-z0-9][a-z0-9-]{7,}$/i;
const RETIRED_SCHEMA_2_KEYS = [
  'workspace_mode', 'corpus_visibility', 'kai', 'corpus',
  'coordination', 'initiatives', 'library',
];
const REQUIRED_SCHEMA_3_PATHS = new Map([
  ['.kai/CONVENTIONS.md', 'file'],
  ['.kai/state/ACTIVE.md', 'file'],
  ['.kai/state/BOARD.md', 'file'],
  ['.kai/state/backlog.md', 'file'],
  ['.kai/state/items', 'directory'],
  ['.kai/state/threads', 'directory'],
  ['.kai/state/initiatives/INDEX.md', 'file'],
]);

// A durable path is workspace-relative or project-qualified: no
// machine-absolute root, UNC share, session-state, parent escape, or `.../`.
function badPath(p) {
  const t = unquote(p);
  if (isNull(t) || t === '[]') return null;
  const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/i.exec(t);
  const candidate = projectTarget ? projectTarget[2] : t;
  if (projectTarget && !candidate.trim()) return 'project target with no relative path';
  const norm = candidate.replace(/\\/g, '/');
  if (t.startsWith('\\\\') || norm.startsWith('//')) return 'UNC / share path';
  if (/^[A-Za-z]:\//.test(norm) || norm.startsWith('/')) return 'machine-absolute path';
  if (t.includes('.../')) return 'abbreviated `.../` path';
  if (norm.split('/').some((seg) => seg === '..')) return 'path escaping the workspace root';
  if (/session-state/i.test(t)) return 'session-state-relative path';
  return null;
}

function normalized(path) {
  const value = canonicalPath(path);
  return process.platform === 'win32' ? value.toLowerCase() : value;
}

function canonicalPath(path) {
  let existing = resolve(path);
  const tail = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    tail.unshift(basename(existing));
    existing = parent;
  }
  const canonical = existsSync(existing) ? realpathSync(existing) : existing;
  return resolve(canonical, ...tail);
}

function resolvedProjectPath(root, projectPath) {
  return isAbsolute(projectPath) ? resolve(projectPath) : resolve(root, projectPath);
}

function nestedScalar(fmLines, section, key) {
  let inSection = false;
  for (const line of fmLines) {
    if (line === `${section}:`) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    if (/^\S/.test(line)) return undefined;
    const match = line.match(new RegExp(`^\\s+${key}:\\s?(.*)$`));
    if (match) return cleanScalar(match[1]);
  }
  return undefined;
}

function provenLegacyRoots(root) {
  return ['kai/coordination', 'kai/initiatives', 'kai/library', 'kai/personal']
    .filter((base) => {
      const path = join(root, ...base.split('/'));
      if (!existsSync(path)) return false;
      try {
        return readdirSync(path).length > 0;
      } catch {
        return true;
      }
    });
}

function escapesRoot(root, candidate) {
  const rel = relative(canonicalPath(root), canonicalPath(candidate));
  return rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel);
}

function inspectPrivateLanes(root) {
  const gitRoots = [];
  const symbolicLinks = [];
  const unreadable = [];
  for (const lane of ['.kai/runs', '.kai/review', '.kai/archive', '.kai/personal']) {
    const laneRoot = join(root, ...lane.split('/'));
    let laneStat;
    try {
      laneStat = lstatSync(laneRoot);
    } catch (error) {
      if (error.code === 'ENOENT') continue;
      unreadable.push(`${lane}: ${error.message}`);
      continue;
    }
    if (laneStat.isSymbolicLink()) {
      symbolicLinks.push(lane);
      continue;
    }
    const pending = [laneRoot];
    while (pending.length) {
      const current = pending.pop();
      let entries;
      try {
        entries = readdirSync(current, { withFileTypes: true });
      } catch (error) {
        unreadable.push(`${relative(root, current).replace(/\\/g, '/')}: ${error.message}`);
        continue;
      }
      for (const entry of entries) {
        const path = join(current, entry.name);
        if (entry.name === '.git') {
          gitRoots.push(relative(root, current).replace(/\\/g, '/') || '.');
          continue;
        }
        if (entry.isSymbolicLink()) {
          symbolicLinks.push(relative(root, path).replace(/\\/g, '/'));
          continue;
        }
        if (entry.isDirectory()) pending.push(path);
      }
    }
  }
  return { gitRoots, symbolicLinks, unreadable };
}

function checkGitMode(root, mode, err, warn) {
  const git = (args) => spawnSync('git', ['-C', root, ...args], { encoding: 'utf8', windowsHide: true });
  const tree = git(['rev-parse', '--is-inside-work-tree']);
  if (tree.error || tree.status !== 0 || tree.stdout.trim() !== 'true') {
    if (mode !== 'external') warn(`storage_mode "${mode}" is not inside a readable git work tree`);
    return;
  }
  const top = git(['rev-parse', '--show-toplevel']);
  if (top.status !== 0 || !top.stdout.trim()) {
    warn(`storage_mode "${mode}" could not resolve the containing git work tree`);
    return;
  }
  const gitRoot = resolve(top.stdout.trim());
  const workspaceRel = relative(gitRoot, root).replace(/\\/g, '/');
  if (workspaceRel === '..' || workspaceRel.startsWith('../') || isAbsolute(workspaceRel)) {
    err(`storage_mode "${mode}" workspace is outside the containing git work tree`);
    return;
  }
  const inWorkspace = (path) => workspaceRel ? `${workspaceRel}/${path}` : path;
  const tracked = spawnSync(
    'git',
    ['-C', gitRoot, 'ls-files', '--', inWorkspace('.kai')],
    { encoding: 'utf8', windowsHide: true },
  );
  const trackedPaths = tracked.status === 0 && tracked.stdout.trim()
    ? tracked.stdout.trim().split(/\r?\n/)
    : [];
  const workspaceTrackedPath = (path) => {
    const normalizedPath = path.replace(/\\/g, '/');
    return workspaceRel && normalizedPath.startsWith(`${workspaceRel}/`)
      ? normalizedPath.slice(workspaceRel.length + 1)
      : normalizedPath;
  };
  const ignored = (path) => spawnSync(
    'git',
    ['-C', gitRoot, 'check-ignore', '--no-index', '-q', '--', inWorkspace(path)],
    { encoding: 'utf8', windowsHide: true },
  ).status === 0;
  const privatePrefixes = ['.kai/runs/', '.kai/review/', '.kai/personal/', '.kai/archive/'];
  const privateFiles = new Set([
    '.kai/activity.jsonl', '.kai/activity.jsonl.1', '.kai/observed.jsonl',
    '.kai/observed.jsonl.1', '.kai/observer-consent', '.kai/local.json',
  ]);
  const trackedPrivate = trackedPaths
    .map(workspaceTrackedPath)
    .filter((path) => privateFiles.has(path) || privatePrefixes.some((prefix) => path.startsWith(prefix)));

  if (mode === 'repo-local') {
    if (trackedPaths.length) {
      err(`storage_mode "repo-local" has ${trackedPaths.length} tracked .kai path(s); the private workspace must be untracked`);
    }
    if (!ignored('.kai/')) {
      err('storage_mode "repo-local" requires the entire .kai/ directory to be ignored');
    }
  }
  if (mode === 'shared' || mode === 'external') {
    if (ignored('.kai/manifest.json') || ignored('.kai/state/BOARD.md')) {
      err(`storage_mode "${mode}" requires .kai/manifest.json and .kai/state/ to remain trackable in a version-controlled workspace`);
    }
    if (trackedPrivate.length) {
      err(`storage_mode "${mode}" has ${trackedPrivate.length} tracked private .kai path(s): ${trackedPrivate.join(', ')}`);
    }
    for (const path of [...privatePrefixes, ...privateFiles]) {
      if (!ignored(path)) err(`storage_mode "${mode}" requires "${path}" to be ignored`);
    }
  }
}

// --- validation ------------------------------------------------------------
export function checkWorkspace(root, options = {}) {
  root = resolve(root);
  const errors = [];
  const warnings = [];
  const migrations = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);

  // 1. Manifest -------------------------------------------------------------
  const manifestPath = join(root, '.kai', 'manifest.json');
  if (!existsSync(manifestPath)) {
    err('.kai/manifest.json is missing — the workspace is not onboarded. Run workflow-workspace-init.');
    return { errors, warnings, migrations };
  }
  const manifestResult = readWorkspaceManifest(root);
  if (!manifestResult.ok) {
    err(manifestResult.reason);
    return { errors, warnings, migrations };
  }
  const m = manifestResult.manifest;
  if (!m || typeof m !== 'object' || Array.isArray(m)) {
    err('.kai/manifest.json must contain a JSON object');
    return { errors, warnings, migrations };
  }

  for (const k of REQUIRED_MANIFEST_KEYS) {
    if (!(k in m)) {
      if (k === 'schema_version') continue; // handled by migration logic below
      if (Number.isInteger(m.schema_version) && m.schema_version < CURRENT_SCHEMA_VERSION) continue;
      err(`.kai/manifest.json missing required key "${k}"`);
    }
  }
  if (m.plugin !== undefined && !WORKSPACE_PROVENANCE.has(m.plugin)) {
    err(`.kai/manifest.json "plugin" must be "${LEGACY_PLUGIN}" (monolith) or "${CORE_PLUGIN}" (pack install)`);
  }
  if (m.workspace_id !== undefined && !WORKSPACE_ID.test(m.workspace_id)) {
    err('.kai/manifest.json "workspace_id" must be a stable UUID or UUID-like identifier');
  }
  if (m.storage_mode !== undefined && !STORAGE_MODES.has(m.storage_mode)) {
    err(`.kai/manifest.json "storage_mode" must be "external", "repo-local", or "shared" (found ${JSON.stringify(m.storage_mode)})`);
  }
  if (['repo-local', 'shared'].includes(m.storage_mode) && m.workspace_root !== '.') {
    err(`.kai/manifest.json ${m.storage_mode} "workspace_root" must be "."`);
  }
  if (m.storage_mode === 'external') {
    if (!isAbsolute(m.workspace_root || '')) {
      err('.kai/manifest.json external "workspace_root" must be absolute');
    } else if (normalized(m.workspace_root) !== normalized(root)) {
      err(`.kai/manifest.json external "workspace_root" resolves to "${resolve(m.workspace_root)}", not "${root}"`);
    }
  }
  if (Number.isInteger(m.schema_version) && m.schema_version >= CURRENT_SCHEMA_VERSION && !Array.isArray(m.areas)) {
    err('.kai/manifest.json "areas" must be an array');
  } else if (Array.isArray(m.areas)) {
    const a = new Set(m.areas);
    if (a.size !== m.areas.length) err('.kai/manifest.json "areas" must not contain duplicates');
    for (const x of a) if (!CANONICAL_AREAS.has(x)) err(`.kai/manifest.json declares unknown run area "${x}"`);
    for (const x of CANONICAL_AREAS) if (!a.has(x)) err(`.kai/manifest.json is missing run area "${x}"`);
  }

  const sv = m.schema_version;
  if (sv === undefined || sv === 0) {
    migrations.push(`schema_version absent → migrate to ${CURRENT_SCHEMA_VERSION} (add schema_version, reconcile fixed roots/areas, drop retired fields).`);
    err(`workspace schema is pre-versioned; migration to schema_version ${CURRENT_SCHEMA_VERSION} required before claiming work.`);
  } else if (!Number.isInteger(sv)) {
    err(`.kai/manifest.json "schema_version" must be an integer (found ${JSON.stringify(sv)}).`);
  } else if (sv < CURRENT_SCHEMA_VERSION) {
    for (let v = sv + 1; v <= CURRENT_SCHEMA_VERSION; v++) migrations.push(`apply migration step → ${v} (see kai-core-workspace-onboarding ladder).`);
    err(`workspace schema_version ${sv} is behind the current contract ${CURRENT_SCHEMA_VERSION}; migration required before claiming work.`);
  } else if (sv > CURRENT_SCHEMA_VERSION) {
    err(`workspace schema_version ${sv} is newer than this plugin's contract ${CURRENT_SCHEMA_VERSION}; update kai-core before claiming work.`);
  }

  if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION) {
    for (const retired of RETIRED_SCHEMA_2_KEYS) {
      if (retired in m) err(`.kai/manifest.json still contains retired schema-2 key "${retired}"`);
    }
    const contractPaths = new Map([['.kai', 'directory'], ...REQUIRED_SCHEMA_3_PATHS]);
    for (const [requiredPath, expectedType] of contractPaths) {
      const fullPath = join(root, ...requiredPath.split('/'));
      if (!existsSync(fullPath)) {
        err(`schema-3 workspace is missing required path "${requiredPath}"`);
      } else if (escapesRoot(root, fullPath)) {
        err(`schema-3 path "${requiredPath}" resolves outside the workspace through a symbolic link or junction`);
      } else if (
        (expectedType === 'file' && !lstatSync(fullPath).isFile())
        || (expectedType === 'directory' && !lstatSync(fullPath).isDirectory())
      ) {
        err(`schema-3 path "${requiredPath}" must be a ${expectedType}`);
      }
    }
    for (const lane of Object.values(DEFAULT_ROOTS)) {
      const lanePath = join(root, ...lane.split('/'));
      if (existsSync(lanePath) && escapesRoot(root, lanePath)) {
        err(`schema-3 path "${lane}" resolves outside the workspace through a symbolic link or junction`);
      }
    }
    for (const legacyRoot of provenLegacyRoots(root)) {
      err(`schema-3 workspace still contains retired schema-2 root "${legacyRoot}"`);
    }
    const privateLanes = inspectPrivateLanes(root);
    for (const path of privateLanes.symbolicLinks) {
      err(`private workspace path "${path}" is a symbolic link or junction; private lanes must not redirect writes`);
    }
    for (const path of privateLanes.gitRoots) {
      err(`private workspace path "${path}" contains a nested Git repository`);
    }
    for (const detail of privateLanes.unreadable) {
      err(`private workspace path is unreadable: ${detail}`);
    }
  }

  const rootOf = (key) => {
    const v = m[key];
    return typeof v === 'string' && v.trim() ? v.trim().replace(/\/+$/, '') : DEFAULT_ROOTS[key];
  };
  for (const key of Object.keys(DEFAULT_ROOTS)) {
    const declared = rootOf(key);
    if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION && m[key] !== DEFAULT_ROOTS[key]) {
      err(`.kai/manifest.json "${key}" must be exactly "${DEFAULT_ROOTS[key]}" (found ${JSON.stringify(m[key])}); the layout is a contract constant, not a per-workspace setting.`);
    }
  }

  const projectIds = new Set();
  const projectPublicationRoots = new Map();
  const projectRoots = new Map();
  if (!Array.isArray(m.projects) || m.projects.length === 0) {
    if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION) {
      err('.kai/manifest.json "projects" must contain at least one project binding');
    }
  } else {
    for (const [index, project] of m.projects.entries()) {
      const prefix = `.kai/manifest.json projects[${index}]`;
      if (!project || typeof project !== 'object') {
        err(`${prefix} must be an object`);
        continue;
      }
      if (!PROJECT_ID.test(project.id || '')) err(`${prefix}.id must be kebab-case`);
      else if (projectIds.has(project.id)) err(`${prefix}.id "${project.id}" is duplicated`);
      else projectIds.add(project.id);
      if (typeof project.path !== 'string' || !project.path.trim()) {
        err(`${prefix}.path is required`);
      } else {
        const pathReason = !isAbsolute(project.path) && project.path !== '.'
          ? 'must be absolute or "."'
          : null;
        if (pathReason) err(`${prefix}.path ${pathReason}`);
        if (project.path === '.' && m.storage_mode === 'external') {
          err(`${prefix}.path cannot be "." for an external workspace`);
        }
        if (project.path !== '.' && !isAbsolute(project.path)) {
          err(`${prefix}.path must be absolute`);
        }
        if (project.path === '.' && !['repo-local', 'shared'].includes(m.storage_mode)) {
          err(`${prefix}.path "." is only valid for repo-local or shared storage`);
        }
      }
      const publicationReason = badPath(project.publication_root);
      const normalizedPublicationRoot = typeof project.publication_root === 'string'
        ? project.publication_root.replace(/\\/g, '/').replace(/^\.\//, '').replace(/\/+$/, '')
        : '';
      if (typeof project.publication_root !== 'string' || !project.publication_root.trim()) {
        err(`${prefix}.publication_root is required`);
      } else if (publicationReason) {
        err(`${prefix}.publication_root is a ${publicationReason}`);
      } else if (
        normalizedPublicationRoot.toLowerCase() === '.kai'
        || normalizedPublicationRoot.toLowerCase().startsWith('.kai/')
      ) {
        err(`${prefix}.publication_root must be outside .kai/`);
      } else if (PROJECT_ID.test(project.id || '')) {
        projectPublicationRoots.set(project.id, normalizedPublicationRoot);
      }
      if (typeof project.path === 'string') {
        const projectRoot = resolvedProjectPath(root, project.path);
        if (PROJECT_ID.test(project.id || '')) projectRoots.set(project.id, projectRoot);
        if (!existsSync(projectRoot)) err(`${prefix}.path does not exist: "${projectRoot}"`);
        if (
          m.storage_mode === 'external'
          && existsSync(projectRoot)
          && (!escapesRoot(root, projectRoot) || !escapesRoot(projectRoot, root))
        ) {
          err(`${prefix}.path overlaps the external workspace root; external workspaces must remain outside their bound projects`);
        }
        const publicationRoot = resolve(projectRoot, project.publication_root || '.');
        const rel = relative(projectRoot, publicationRoot);
        if (rel === '..' || rel.startsWith(`..${sep}`) || isAbsolute(rel)) {
          err(`${prefix}.publication_root escapes project "${project.id || index}"`);
        } else {
          const realProjectRoot = canonicalPath(projectRoot);
          const realPublicationRoot = canonicalPath(publicationRoot);
          const realRel = relative(realProjectRoot, realPublicationRoot);
          if (realRel === '..' || realRel.startsWith(`..${sep}`) || isAbsolute(realRel)) {
            err(`${prefix}.publication_root resolves outside project "${project.id || index}" through a symbolic link or junction`);
          }
        }
      }
    }
  }

  if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION) {
    checkGitMode(root, m.storage_mode, err, warn);
  }

  if (m.storage_mode === 'external' && !options.allowUnregisteredExternal) {
    const registry = loadWorkspaceRegistry(options.env || process.env);
    if (!registry.ok) {
      err(registry.reason);
    } else {
      if (!registry.entries.some((entry) => entry.workspace_id === m.workspace_id)) {
        err(`external workspace is not registered in "${registry.path}"; run workspace-doctor --adopt <project-dir> --root "${root}"`);
      }
      for (const project of Array.isArray(m.projects) ? m.projects : []) {
        if (!project || typeof project !== 'object' || typeof project.path !== 'string') continue;
        const projectRoot = resolvedProjectPath(root, project.path);
        const matches = registry.entries.filter(
          (entry) => normalized(entry.project_root) === normalized(projectRoot),
        );
        if (matches.length !== 1) {
          err(`external project "${project.id}" has ${matches.length} registry bindings in "${registry.path}"; exactly one is required`);
          continue;
        }
        const [match] = matches;
        if (match.workspace_id !== m.workspace_id || normalized(match.workspace_root) !== normalized(root)) {
          err(`external project "${project.id}" is not paired with this workspace in "${registry.path}"`);
        }
      }
    }
  }

  const coordinationRoot = rootOf('state');
  const validateArtifactTarget = (target, label, itemContract) => {
    const cleanTarget = unquote(target || '');
    const reason = badPath(cleanTarget);
    if (reason) {
      err(`${label} is a ${reason}; use a private .kai/ path or project:<id>:<relative-path>`);
      return;
    }
    if (isNull(cleanTarget) || cleanTarget === '[]') return;

    const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/i.exec(cleanTarget);
    if (!projectTarget) {
      const privatePath = cleanTarget.replace(/\\/g, '/').replace(/^\.\//, '');
      if (!privatePath.startsWith('.kai/')) {
        err(`${label} is an unqualified project path; public targets must use project:<id>:<relative-path>`);
        return;
      }
      const targetPath = resolve(root, ...privatePath.split('/'));
      if (escapesRoot(root, targetPath)) {
        err(`${label} resolves outside the workspace through a symbolic link or junction`);
      } else if (REQUIRES_EXISTING_ARTIFACTS.has(itemContract.state) && !existsSync(targetPath)) {
        err(`${label} does not exist for item state "${itemContract.state}"`);
      }
      return;
    }

    const [, projectId, rawPublicPath] = projectTarget;
    if (!projectIds.has(projectId)) {
      err(`${label} names unknown manifest project "${projectId}"`);
      return;
    }
    const publicPath = rawPublicPath.replace(/\\/g, '/').replace(/^\.\//, '');
    const publicationRoot = projectPublicationRoots.get(projectId);
    if (publicationRoot && publicPath !== publicationRoot && !publicPath.startsWith(`${publicationRoot}/`)) {
      err(`${label} escapes project "${projectId}" publication_root "${publicationRoot}"`);
      return;
    }
    const projectRoot = projectRoots.get(projectId);
    if (!projectRoot) return;
    const targetPath = resolve(projectRoot, ...publicPath.split('/'));
    const realRel = relative(canonicalPath(projectRoot), canonicalPath(targetPath));
    if (realRel === '..' || realRel.startsWith(`..${sep}`) || isAbsolute(realRel)) {
      err(`${label} resolves outside project "${projectId}" through a symbolic link or junction`);
      return;
    }
    if (!existsSync(targetPath)) {
      if (REQUIRES_EXISTING_ARTIFACTS.has(itemContract.state)) {
        err(`${label} does not exist for item state "${itemContract.state}"`);
      }
      return;
    }
    if (!targetPath.toLowerCase().endsWith('.md')) return;
    const assetFrontmatter = frontmatter(readFileSync(targetPath, 'utf8'));
    if (!assetFrontmatter) {
      err(`${label} points to a published Markdown asset with no lifecycle frontmatter`);
      return;
    }
    const disposition = nestedScalar(assetFrontmatter, 'disposition', 'status');
    const verdict = nestedScalar(assetFrontmatter, 'completion', 'verdict');
    const revision = scalar(assetFrontmatter, 'revision');
    const acceptedRevision = nestedScalar(assetFrontmatter, 'completion', 'revision_at_verdict');
    const validity = nestedScalar(assetFrontmatter, 'validity', 'status');
    const requiredMetadata = new Map([
      ['asset_id', scalar(assetFrontmatter, 'asset_id')],
      ['asset_class', scalar(assetFrontmatter, 'asset_class')],
      ['item', scalar(assetFrontmatter, 'item')],
      ['produced_by', scalar(assetFrontmatter, 'produced_by')],
      ['created', scalar(assetFrontmatter, 'created')],
      ['revision', revision],
      ['disposition.status', disposition],
      ['completion.authority', nestedScalar(assetFrontmatter, 'completion', 'authority')],
      ['completion.verdict', verdict],
      ['validity.status', validity],
      ['validity.owner', nestedScalar(assetFrontmatter, 'validity', 'owner')],
    ]);
    const missingMetadata = [...requiredMetadata]
      .filter(([, value]) => isNull(value))
      .map(([key]) => key);
    if (missingMetadata.length) {
      err(`${label} points to a published Markdown asset missing lifecycle metadata: ${missingMetadata.join(', ')}`);
    }
    const assetItem = scalar(assetFrontmatter, 'item');
    if (!isNull(assetItem) && assetItem !== itemContract.id) {
      err(`${label} points to a project asset owned by item "${assetItem}", not "${itemContract.id}"`);
    }
    const assetClass = scalar(assetFrontmatter, 'asset_class');
    const completionAuthority = nestedScalar(assetFrontmatter, 'completion', 'authority');
    const validityOwner = nestedScalar(assetFrontmatter, 'validity', 'owner');
    for (const [field, declared, actual] of [
      ['asset_class', itemContract.artifactClass, assetClass],
      ['completion.authority', itemContract.completionAuthority, completionAuthority],
      ['validity.owner', itemContract.validityOwner, validityOwner],
    ]) {
      if (isNull(declared)) {
        err(`${label} cannot validate published asset ${field} because the work item declaration is missing`);
      } else if (actual !== declared) {
        err(`${label} published asset ${field} "${actual}" does not match work item declaration "${declared}"`);
      }
    }
    if (!isNull(completionAuthority) && completionAuthority === scalar(assetFrontmatter, 'produced_by')) {
      err(`${label} points to a project asset accepted by its own producer "${completionAuthority}"`);
    }
    if (disposition !== 'published' || verdict !== 'accepted') {
      err(`${label} points to a project asset that is not accepted and published`);
    }
    if (validity !== 'current') {
      err(`${label} points to a project asset whose validity is not current`);
    }
    if (isNull(revision) || acceptedRevision !== revision) {
      err(`${label} points to a project asset whose accepted revision does not match its current revision`);
    }
  };

  // 2. Coordination items ---------------------------------------------------
  const itemsDir = join(root, ...coordinationRoot.split('/'), 'items');
  const itemIds = new Set();
  const deps = new Map(); // id -> [depId]
  if (existsSync(itemsDir) && lstatSync(itemsDir).isDirectory()) {
    // README.md is the lane's own scaffold file, not a work item.
    const files = readdirSync(itemsDir).filter((f) => f.endsWith('.md') && f !== 'README.md');
    for (const f of files) {
      const id = basename(f, '.md');
      const rel = `${coordinationRoot}/items/${f}`.replace(/\\/g, '/');
      const fm = frontmatter(readFileSync(join(itemsDir, f), 'utf8'));
      if (!fm) { err(`${rel}: missing YAML frontmatter`); continue; }
      itemIds.add(id);

      if (scalar(fm, 'type') !== 'work-item') err(`${rel}: frontmatter "type" must be "work-item"`);
      const fid = scalar(fm, 'id');
      if (fid !== id) err(`${rel}: frontmatter id "${fid}" must equal filename id "${id}"`);

      const state = scalar(fm, 'state');
      if (!LIFECYCLE.has(state)) err(`${rel}: invalid lifecycle state "${state}"`);
      const changeRef = scalar(fm, 'change_ref');
      if (NEEDS_CHANGE_REF.has(state) && isNull(changeRef)) {
        err(`${rel}: state "${state}" requires a non-null change_ref`);
      }
      // change_ref must content-address a git object (commit/PR-head SHA), not an
      // ad hoc digest — the only reproducible-across-machines form (see #31).
      if (!isNull(changeRef) && !/^[0-9a-f]{7,40}$/i.test(changeRef)) {
        err(`${rel}: change_ref "${changeRef}" must be a git commit/PR-head SHA (7–40 hex chars); bespoke diff hashes are not allowed`);
      }

      const ver = scalar(fm, 'version');
      if (!/^\d+$/.test(ver ?? '')) err(`${rel}: "version" must be an integer (found ${JSON.stringify(ver)})`);

      const lz = lease(fm);
      if (!isNull(lz.holder)) {
        if (isNull(lz.expires)) {
          err(`${rel}: lease held by ${lz.holder} but has no expiry`);
        }
        if (isNull(lz.token)) {
          err(`${rel}: lease held by ${lz.holder} but has no token (a held lease must carry a unique grant token — see kai-core-work-coordination "Claiming work safely")`);
        }
        if (isNull(lz.versionAtGrant)) {
          err(`${rel}: lease held by ${lz.holder} but has no version_at_grant (the grant must be bound to the item version it was issued against)`);
        } else if (!/^\d+$/.test(lz.versionAtGrant)) {
          err(`${rel}: lease version_at_grant must be an integer (found ${JSON.stringify(lz.versionAtGrant)})`);
        } else if (/^\d+$/.test(ver ?? '') && Number(lz.versionAtGrant) >= Number(ver)) {
          err(`${rel}: lease version_at_grant ${lz.versionAtGrant} must be strictly less than the item version ${ver} — granting increments the version, so version_at_grant >= version signals a grant that skipped the increment (a racy or tampered lease)`);
        }
      }
      if (!isNull(lz.expires)) {
        const ts = parseStamp(lz.expires);
        if (ts === null) {
          warn(`${rel}: lease expires "${lz.expires}" is not a recognizable timestamp`);
        } else if (ts < Date.now()) {
          warn(`${rel}: lease expired at ${lz.expires} (stale-work recovery signal; the director should reconcile before reclaiming)`);
        }
      }

      const itemContract = {
        id,
        state,
        artifactClass: scalar(fm, 'artifact_class'),
        completionAuthority: scalar(fm, 'completion_authority'),
        validityOwner: scalar(fm, 'validity_owner'),
      };
      for (const key of ['artifact_target']) {
        const target = scalar(fm, key);
        validateArtifactTarget(target, `${rel}: ${key}`, itemContract);
      }
      for (const target of listBlock(fm, 'artifact_targets')) {
        validateArtifactTarget(target, `${rel}: artifact_targets entry "${target}"`, itemContract);
      }

      const dlist = dependsOn(fm);
      for (const d of dlist) {
        if (isNull(d.requires)) warn(`${rel}: depends_on "${d.item}" has no required upstream state`);
        else if (!REQUIRES_STATES.has(d.requires)) err(`${rel}: depends_on "${d.item}" has invalid requires "${d.requires}" (expected in-review|completed|release-ready|shipped)`);
      }
      deps.set(id, dlist.map((d) => d.item));
    }
  }

  // dangling dependencies
  for (const [id, list] of deps) {
    for (const d of list) if (!itemIds.has(d)) err(`${coordinationRoot}/items/${id}.md: depends_on references unknown item "${d}"`);
  }
  // dependency cycles (DFS)
  const cycle = findCycle(deps);
  if (cycle) err(`coordination dependency cycle: ${cycle.join(' -> ')}`);

  // 3. BOARD drift ----------------------------------------------------------
  const boardPath = join(root, ...coordinationRoot.split('/'), 'BOARD.md');
  if (existsSync(boardPath) && lstatSync(boardPath).isFile() && itemIds.size > 0) {
    const board = readFileSync(boardPath, 'utf8');
    const rowIds = new Set(
      [...board.matchAll(/^\|\s*([a-z][a-z0-9-]+)\s*\|/gm)].map((x) => x[1]).filter((x) => x !== 'id'),
    );
    for (const id of itemIds) if (!rowIds.has(id)) warn(`${coordinationRoot}/BOARD.md is missing a row for item "${id}" (derived index is stale)`);
    for (const id of rowIds) if (!itemIds.has(id)) warn(`${coordinationRoot}/BOARD.md row "${id}" has no item record (derived index is stale)`);
  } else if (!existsSync(boardPath) && itemIds.size > 0) {
    warn(`${coordinationRoot}/BOARD.md is absent though coordination items exist (derived index missing)`);
  }

  return { errors, warnings, migrations };
}

// Parse a `YYYY-MM-DD-HHMM` (or `YYYY-MM-DD`) stamp to epoch ms, else null.

function findCycle(deps) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = new Map();
  const stack = [];
  let found = null;
  const visit = (n) => {
    if (found) return;
    color.set(n, GRAY); stack.push(n);
    for (const d of deps.get(n) || []) {
      if (!deps.has(d)) continue;
      const c = color.get(d) || WHITE;
      if (c === GRAY) { found = [...stack.slice(stack.indexOf(d)), d]; return; }
      if (c === WHITE) { visit(d); if (found) return; }
    }
    color.set(n, BLACK); stack.pop();
  };
  for (const n of deps.keys()) if ((color.get(n) || WHITE) === WHITE) { visit(n); if (found) break; }
  return found;
}

// --- reporting -------------------------------------------------------------
function report(root, res) {
  const rel = root === process.cwd() ? '.' : root;
  for (const m of res.migrations) console.log(`  ↑ migration: ${m}`);
  for (const w of res.warnings) console.log(`  ! ${w}`);
  for (const e of res.errors) console.log(`  ✗ ${e}`);
  if (res.errors.length === 0) {
    console.log(`✓ workspace healthy — claimable (${rel})${res.warnings.length ? ` — ${res.warnings.length} warning(s)` : ''}`);
    return 0;
  }
  console.log(`✗ workspace not claimable: ${res.errors.length} error(s)${res.migrations.length ? `, migration required` : ''} (${rel})`);
  return 1;
}

// The pack-migration verdict, printed. Read-only throughout: every repair is a
// numbered step for the operator, never something this process performs.
const SEVERITY_MARK = { refusal: '✗', unverified: '?', note: '✓' };
const VERDICT = {
  clear: '✓ clear — no legacy/pack conflict on this host; a pack install may proceed',
  blocked: '✗ blocked — do NOT install packs here until the steps above are done and re-checked',
  unknown: '? unknown — the install state could not be verified, so it is NOT treated as clear',
};

const migrationExitCode = (status) => (status === 'clear' ? 0 : status === 'blocked' ? 2 : 3);
const terminalText = (value) => String(value)
  .replace(/[\x00-\x1f\x7f-\x9f\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '?');
const jsonText = (value) => JSON.stringify(value, null, 2)
  .replace(/[\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, (character) => (
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  ));

function migrationInventory(report) {
  if (!report.host?.records) return [];
  return [...report.host.records.values()]
    .map((record) => {
      const enabledStates = record.entries.map((entry) => entry.enabled);
      const enabled = enabledStates.length && enabledStates.every((state) => state === true)
        ? true
        : (enabledStates.some((state) => state === false) ? false : null);
      return {
        name: record.name,
        presence: record.presence,
        versions: [...new Set(record.entries.map((entry) => entry.version).filter(Boolean))].sort(),
        enabled,
        provenances: [...record.provenances].sort(),
      };
    })
    .sort((left, right) => left.name.localeCompare(right.name));
}

function reportRegistry({ env, json = false }) {
  const registry = loadWorkspaceRegistry(env);
  if (!registry.ok) {
    console.error(`workspace registry: ${registry.reason}`);
    return 1;
  }
  if (json) {
    console.log(jsonText({
      path: registry.path,
      kai_home: defaultKaiHome(env),
      workspaces: registry.entries,
    }));
    return 0;
  }
  console.log(`kai workspace registry — ${registry.path}`);
  if (!registry.entries.length) {
    console.log('  (empty)');
    return 0;
  }
  for (const entry of registry.entries) {
    console.log(`  ${entry.project_root} -> ${entry.workspace_root} (${entry.workspace_id})`);
  }
  return 0;
}

function reportMigration({ home, root, json = false, rollback = false }) {
  const res = migrationReport({ home, root, rollback });
  if (json) {
    const output = {
      status: res.status,
      codes: res.codes,
      home: res.home,
      root: res.root,
      rollback: res.rollback,
      findings: res.findings,
      steps: res.steps,
      notices: res.notices,
      workspace: res.workspace,
      plugins: migrationInventory(res),
    };
    console.log(jsonText(output));
    return migrationExitCode(res.status);
  }
  console.log(`kai migration doctor (read-only) — host ${terminalText(res.home)}`);
  console.log(`  workspace ${terminalText(root ?? '(not inspected)')}\n`);
  for (const f of res.findings) console.log(`  ${SEVERITY_MARK[f.severity]} ${terminalText(f.message)}`);
  if (res.steps.length) {
    console.log('\n  remediation — run these yourself; this check changed nothing:');
    res.steps.forEach((s, i) => console.log(`    ${i + 1}. ${terminalText(s)}`));
  }
  for (const n of res.notices) console.log(`\n  ! ${terminalText(n)}`);
  console.log(`\n${VERDICT[res.status]}`);
  return migrationExitCode(res.status);
}

const registryWait = new Int32Array(new SharedArrayBuffer(4));

function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== 'ESRCH';
  }
}

function recoverDeadRegistryLock(lockPath) {
  let owner;
  try {
    owner = JSON.parse(readFileSync(lockPath, 'utf8'));
  } catch {
    return false;
  }
  if (typeof owner.token !== 'string' || processIsAlive(owner.pid)) return false;

  const claimPath = `${lockPath}.reclaim-${owner.token.replace(/[^a-z0-9.-]/gi, '_')}`;
  let claim;
  try {
    claim = openSync(claimPath, 'wx');
  } catch {
    return false;
  }
  try {
    let current;
    try {
      current = JSON.parse(readFileSync(lockPath, 'utf8'));
    } catch {
      return false;
    }
    if (current.token !== owner.token || processIsAlive(current.pid)) return false;
    unlinkSync(lockPath);
    return true;
  } catch {
    return false;
  } finally {
    closeSync(claim);
    rmSync(claimPath, { force: true });
  }
}

function withRegistryLock(env, action) {
  const path = registryPath(env);
  const lockPath = `${path}.lock`;
  const ownerToken = `${process.pid}:${randomUUID()}`;
  mkdirSync(dirname(path), { recursive: true });
  const deadline = Date.now() + 5000;
  let lock;
  while (Date.now() < deadline) {
    try {
      lock = openSync(lockPath, 'wx');
      writeFileSync(lock, `${JSON.stringify({ pid: process.pid, token: ownerToken })}\n`);
      break;
    } catch (error) {
      if (error.code !== 'EEXIST') return { ok: false, reason: `cannot lock workspace registry: ${error.message}` };
      if (recoverDeadRegistryLock(lockPath)) continue;
      Atomics.wait(registryWait, 0, 0, 50);
    }
  }
  if (lock === undefined) return { ok: false, reason: `workspace registry is busy: ${lockPath}` };
  try {
    return action();
  } finally {
    closeSync(lock);
    try {
      const currentOwner = JSON.parse(readFileSync(lockPath, 'utf8'));
      if (currentOwner.token === ownerToken) unlinkSync(lockPath);
    } catch {
      // The mutation remains valid; never remove a lock whose ownership cannot be proven.
    }
  }
}

function writeRegistryUnlocked(entries, env = process.env) {
  const path = registryPath(env);
  mkdirSync(dirname(path), { recursive: true });
  const next = `${path}.${process.pid}.${randomUUID()}.tmp`;
  const body = { schema_version: 1, workspaces: entries };
  writeFileSync(next, `${JSON.stringify(body, null, 2)}\n`);
  const deadline = Date.now() + 2000;
  try {
    while (true) {
      try {
        renameSync(next, path);
        return path;
      } catch (error) {
        if (!['EPERM', 'EACCES', 'EBUSY'].includes(error.code) || Date.now() >= deadline) throw error;
        sleepSync(25);
      }
    }
  } finally {
    if (existsSync(next)) rmSync(next, { force: true });
  }
}

function writeRegistry(entries, env = process.env) {
  return withRegistryLock(env, () => ({ ok: true, path: writeRegistryUnlocked(entries, env) }));
}

function sleepSync(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

export function adoptWorkspace({ root, projectRoot, env = process.env }) {
  root = resolve(root);
  projectRoot = resolve(projectRoot);
  const checked = checkWorkspace(root, { allowUnregisteredExternal: true });
  if (checked.errors.length) {
    return { ok: false, reason: `workspace is invalid: ${checked.errors[0]}` };
  }
  const manifest = readWorkspaceManifest(root).manifest;
  if (manifest.storage_mode !== 'external') {
    return { ok: false, reason: 'only external workspaces need machine-local registry adoption' };
  }
  const project = manifest.projects.find(
    (candidate) => normalized(resolvedProjectPath(root, candidate.path)) === normalized(projectRoot),
  );
  if (!project) {
    return { ok: false, reason: `manifest does not bind project "${projectRoot}"` };
  }
  return withRegistryLock(env, () => {
    const registry = loadWorkspaceRegistry(env);
    if (!registry.ok) return registry;
    const canonicalProjectRoot = canonicalPath(projectRoot);
    const canonicalWorkspaceRoot = canonicalPath(root);
    const retained = registry.entries.filter(
      (entry) => normalized(entry.project_root) !== normalized(canonicalProjectRoot),
    );
    retained.push({
      project_root: canonicalProjectRoot,
      workspace_root: canonicalWorkspaceRoot,
      workspace_id: manifest.workspace_id,
    });
    retained.sort((left, right) => left.project_root.localeCompare(right.project_root));
    return { ok: true, path: writeRegistryUnlocked(retained, env) };
  });
}

export function forgetWorkspace({ projectRoot, env = process.env }) {
  projectRoot = resolve(projectRoot);
  return withRegistryLock(env, () => {
    const registry = loadWorkspaceRegistry(env);
    if (!registry.ok) return registry;
    const retained = registry.entries.filter(
      (entry) => normalized(entry.project_root) !== normalized(projectRoot),
    );
    if (retained.length === registry.entries.length) {
      return { ok: false, reason: `project "${projectRoot}" is not registered` };
    }
    return { ok: true, path: writeRegistryUnlocked(retained, env) };
  });
}

function selfTest() {
  const fx = join(__dirname, '..', 'test', 'fixtures');
  let failed = 0;
  const ok = (condition, message, details = []) => {
    if (condition) console.log(`✓ self-test: ${message}`);
    else {
      failed++;
      console.log(`✗ self-test: ${message}`);
      details.forEach((detail) => console.log(`    ${detail}`));
    }
  };

  const good = checkWorkspace(join(fx, 'repo-workspace'));
  ok(good.errors.length === 0, 'healthy schema-3 shared fixture passes', good.errors);

  const bad = checkWorkspace(join(fx, 'broken-workspace'));
  const badText = bad.errors.join('\n');
  ok(
    /migration .*required/i.test(badText)
      && /requires a non-null change_ref/i.test(badText)
      && /unknown item/i.test(badText),
    'broken fixture reports migration, item, and dependency failures',
    bad.errors,
  );

  const concurrency = checkWorkspace(join(fx, 'concurrency-workspace'));
  const concurrencyText = concurrency.errors.join('\n');
  ok(
    /has no token/i.test(concurrencyText)
      && /has no version_at_grant/i.test(concurrencyText)
      && /strictly less/i.test(concurrencyText)
      && /stale-work recovery signal/i.test(concurrency.warnings.join('\n')),
    'coordination lease integrity still fails closed',
    [...concurrency.errors, ...concurrency.warnings],
  );

  const example = checkWorkspace(join(__dirname, '..', 'examples', 'e2e-feature-delivery'));
  ok(example.errors.length === 0, 'end-to-end schema-3 example is claimable', example.errors);

  const publicationTemplates = ['decision.md', 'spec.md', 'report.md'].map((name) => ({
    name,
    fm: frontmatter(readFileSync(join(__dirname, '..', 'plugins', 'kai-core', 'templates', 'publication', name), 'utf8')),
  }));
  ok(
    publicationTemplates.every(({ fm }) => fm && scalar(fm, 'item') === '<work-item-id>'),
    'publication templates declare the owning work item',
    publicationTemplates.filter(({ fm }) => !fm || scalar(fm, 'item') !== '<work-item-id>').map(({ name }) => name),
  );

  const tmpRoot = mkdtempSync(join(tmpdir(), 'kai-schema3-'));
  try {
    const publicationWorkspace = join(tmpRoot, 'publication-workspace');
    cpSync(join(fx, 'repo-workspace'), publicationWorkspace, { recursive: true });
    const publicationItem = join(publicationWorkspace, '.kai', 'state', 'items', 'sample-api.md');
    const originalItem = readFileSync(publicationItem, 'utf8');
    const publicationItemText = (target) => originalItem.replace(
      'artifact_target: null',
      [
        'artifact_expectation: owed',
        'artifact_class: design',
        'completion_authority: principal-product-manager',
        'validity_owner: principal-swe-architect',
        `artifact_target: ${target}`,
      ].join('\n'),
    );
    writeFileSync(
      publicationItem,
      publicationItemText('project:fixture:docs/kai/reports/sample-api.md'),
    );
    const missingPublication = checkWorkspace(publicationWorkspace);
    ok(/does not exist for item state "in-review"/i.test(missingPublication.errors.join('\n')),
      'review-stage items cannot claim missing published targets',
      missingPublication.errors);

    const publishedAsset = join(publicationWorkspace, 'docs', 'kai', 'reports', 'sample-api.md');
    mkdirSync(dirname(publishedAsset), { recursive: true });
    writeFileSync(publishedAsset, [
      '---',
      'asset_id: sample-api',
      'asset_class: design',
      'item: sample-api',
      'produced_by: principal-swe-architect',
      'created: 2026-08-31',
      'revision: 2',
      'disposition:',
      '  status: published',
      'completion:',
      '  authority: principal-product-manager',
      '  verdict: pending',
      '  revision_at_verdict: 1',
      'validity:',
      '  status: provisional',
      '  owner: principal-swe-architect',
      '---',
      '',
      '# Sample API',
      '',
    ].join('\n'));
    const unacceptedPublication = checkWorkspace(publicationWorkspace);
    ok(/not accepted and published|accepted revision does not match/i.test(unacceptedPublication.errors.join('\n')),
      'a public target is rejected until its current revision is accepted',
      unacceptedPublication.errors);

    writeFileSync(publishedAsset, [
      '---',
      'asset_id: sample-api',
      'asset_class: design',
      'item: sample-api',
      'produced_by: principal-swe-architect',
      'created: 2026-08-31',
      'revision: 2',
      'disposition:',
      '  status: published',
      'completion:',
      '  authority: principal-product-manager',
      '  verdict: accepted',
      '  revision_at_verdict: 2',
      'validity:',
      '  status: current',
      '  owner: principal-swe-architect',
      '---',
      '',
      '# Sample API',
      '',
    ].join('\n'));
    const acceptedPublication = checkWorkspace(publicationWorkspace);
    ok(acceptedPublication.errors.length === 0,
      'an accepted current project-qualified revision remains claimable',
      acceptedPublication.errors);

    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      'item: sample-api',
      'item: another-item',
    ));
    const mismatchedAssetItem = checkWorkspace(publicationWorkspace);
    ok(/owned by item "another-item", not "sample-api"/i.test(mismatchedAssetItem.errors.join('\n')),
      'a published asset remains bound to the item that claims it',
      mismatchedAssetItem.errors);
    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      'item: another-item',
      'item: sample-api',
    ));

    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      '  authority: principal-product-manager',
      '  authority: principal-swe-architect',
    ));
    const mismatchedAuthority = checkWorkspace(publicationWorkspace);
    ok(/completion\.authority .* does not match work item declaration/i.test(mismatchedAuthority.errors.join('\n')),
      'published acceptance must come from the work item declared authority',
      mismatchedAuthority.errors);
    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      '  authority: principal-swe-architect',
      '  authority: principal-product-manager',
    ));

    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      '  status: current',
      '  status: invalidated',
    ));
    const invalidatedPublication = checkWorkspace(publicationWorkspace);
    ok(/validity is not current/i.test(invalidatedPublication.errors.join('\n')),
      'an invalidated public revision is no longer claimable',
      invalidatedPublication.errors);

    writeFileSync(publishedAsset, readFileSync(publishedAsset, 'utf8').replace(
      '  status: invalidated',
      '  status: current',
    ));

    writeFileSync(
      publicationItem,
      publicationItemText('project:fixture:reports/sample-api.md'),
    );
    const escapedPublication = checkWorkspace(publicationWorkspace);
    ok(/escapes project .* publication_root/i.test(escapedPublication.errors.join('\n')),
      'project-qualified artifact targets cannot bypass the configured publication root',
      escapedPublication.errors);

    writeFileSync(
      publicationItem,
      publicationItemText('docs/kai/reports/sample-api.md'),
    );
    const unqualifiedPublication = checkWorkspace(publicationWorkspace);
    ok(/unqualified project path/i.test(unqualifiedPublication.errors.join('\n')),
      'public artifact targets cannot bypass project qualification',
      unqualifiedPublication.errors);

    const incompleteWorkspace = join(tmpRoot, 'incomplete-workspace');
    cpSync(join(fx, 'repo-workspace'), incompleteWorkspace, { recursive: true });
    rmSync(join(incompleteWorkspace, '.kai', 'CONVENTIONS.md'));
    mkdirSync(join(incompleteWorkspace, 'kai', 'personal'), { recursive: true });
    writeFileSync(join(incompleteWorkspace, 'kai', 'personal', 'inbox.md'), '# Legacy inbox\n');
    mkdirSync(join(incompleteWorkspace, 'kai', 'initiatives', 'orphaned'), { recursive: true });
    writeFileSync(join(incompleteWorkspace, 'kai', 'initiatives', 'orphaned', 'northstar.md'), '# Legacy initiative\n');
    const incomplete = checkWorkspace(incompleteWorkspace);
    ok(
      /missing required path ".kai\/CONVENTIONS.md"/i.test(incomplete.errors.join('\n'))
        && /retired schema-2 root "kai\/personal"/i.test(incomplete.errors.join('\n'))
        && /retired schema-2 root "kai\/initiatives"/i.test(incomplete.errors.join('\n')),
      'schema-3 validation rejects incomplete and split-brain layouts',
      incomplete.errors,
    );

    const malformedWorkspace = join(tmpRoot, 'malformed-workspace');
    cpSync(join(fx, 'repo-workspace'), malformedWorkspace, { recursive: true });
    const malformedManifestPath = join(malformedWorkspace, '.kai', 'manifest.json');
    const malformedManifest = JSON.parse(readFileSync(malformedManifestPath, 'utf8'));
    malformedManifest.state = null;
    malformedManifest.areas = {};
    writeFileSync(malformedManifestPath, `${JSON.stringify(malformedManifest, null, 2)}\n`);
    rmSync(join(malformedWorkspace, '.kai', 'state', 'items'), { recursive: true });
    writeFileSync(join(malformedWorkspace, '.kai', 'state', 'items'), 'not a directory\n');
    const malformed = checkWorkspace(malformedWorkspace);
    ok(
      /"state" must be exactly ".kai\/state"/i.test(malformed.errors.join('\n'))
        && /"areas" must be an array/i.test(malformed.errors.join('\n'))
        && /path ".kai\/state\/items" must be a directory/i.test(malformed.errors.join('\n')),
      'malformed schema-3 roots and path types fail as validation errors',
      malformed.errors,
    );

    const scalarManifestWorkspace = join(tmpRoot, 'scalar-manifest-workspace');
    cpSync(join(fx, 'repo-workspace'), scalarManifestWorkspace, { recursive: true });
    writeFileSync(join(scalarManifestWorkspace, '.kai', 'manifest.json'), 'null\n');
    const scalarManifest = checkWorkspace(scalarManifestWorkspace);
    ok(/manifest\.json must contain a JSON object/i.test(scalarManifest.errors.join('\n')),
      'valid JSON scalars fail as manifest validation errors',
      scalarManifest.errors);
    const scalarManifestProject = join(tmpRoot, 'scalar-manifest-project');
    const scalarManifestEnv = { KAI_HOME: join(tmpRoot, 'scalar-manifest-home') };
    mkdirSync(scalarManifestProject, { recursive: true });
    writeRegistry([{
      project_root: scalarManifestProject,
      workspace_root: scalarManifestWorkspace,
      workspace_id: 'scalar-manifest-workspace',
    }], scalarManifestEnv);
    const scalarResolution = resolveWorkspaceRoot({ cwd: scalarManifestProject, env: scalarManifestEnv });
    ok(!scalarResolution.ok && /must contain a JSON object/i.test(scalarResolution.reason),
      'registry discovery rejects scalar external manifests without throwing',
      [scalarResolution.reason]);

    const malformedExternalWorkspace = join(tmpRoot, 'malformed-external-workspace');
    cpSync(join(fx, 'external-workspace'), malformedExternalWorkspace, { recursive: true });
    const malformedExternalManifestPath = join(malformedExternalWorkspace, '.kai', 'manifest.json');
    const malformedExternalManifest = JSON.parse(readFileSync(malformedExternalManifestPath, 'utf8'));
    malformedExternalManifest.workspace_root = malformedExternalWorkspace;
    malformedExternalManifest.projects = [null];
    writeFileSync(malformedExternalManifestPath, `${JSON.stringify(malformedExternalManifest, null, 2)}\n`);
    const malformedExternal = checkWorkspace(malformedExternalWorkspace, {
      env: { KAI_HOME: join(tmpRoot, 'malformed-external-home') },
    });
    ok(/projects\[0\] must be an object/i.test(malformedExternal.errors.join('\n')),
      'malformed external project entries fail without crashing registry validation',
      malformedExternal.errors);

    const repoLocalWorkspace = join(tmpRoot, 'repo-local-workspace');
    cpSync(join(fx, 'repo-workspace'), repoLocalWorkspace, { recursive: true });
    const repoLocalManifestPath = join(repoLocalWorkspace, '.kai', 'manifest.json');
    const repoLocalManifest = JSON.parse(readFileSync(repoLocalManifestPath, 'utf8'));
    repoLocalManifest.storage_mode = 'repo-local';
    writeFileSync(repoLocalManifestPath, `${JSON.stringify(repoLocalManifest, null, 2)}\n`);
    writeFileSync(join(repoLocalWorkspace, '.gitignore'), [
      '!/.kai/',
      '!/.kai/**',
      '/.kai/manifest.json',
      '/.kai/state/BOARD.md',
      '',
    ].join('\n'));
    spawnSync('git', ['init', '--quiet', repoLocalWorkspace], { encoding: 'utf8', windowsHide: true });
    const partiallyIgnored = checkWorkspace(repoLocalWorkspace);
    ok(/requires the entire \.kai\/ directory to be ignored/i.test(partiallyIgnored.errors.join('\n')),
      'repo-local mode rejects sentinel-only ignore rules',
      partiallyIgnored.errors);
    writeFileSync(join(repoLocalWorkspace, '.gitignore'), '/.kai/\n');
    const fullyIgnored = checkWorkspace(repoLocalWorkspace);
    ok(fullyIgnored.errors.length === 0,
      'repo-local mode accepts a fully ignored private workspace',
      fullyIgnored.errors);

    const privateTargetWorkspace = join(tmpRoot, 'private-target-workspace');
    const outsidePrivateTarget = join(tmpRoot, 'outside-private-target');
    cpSync(join(fx, 'repo-workspace'), privateTargetWorkspace, { recursive: true });
    mkdirSync(outsidePrivateTarget, { recursive: true });
    symlinkSync(outsidePrivateTarget, join(privateTargetWorkspace, '.kai', 'state', 'escaped-artifacts'), 'junction');
    const privateTargetItem = join(privateTargetWorkspace, '.kai', 'state', 'items', 'sample-api.md');
    writeFileSync(
      privateTargetItem,
      readFileSync(privateTargetItem, 'utf8').replace(
        'artifact_target: null',
        'artifact_target: .kai/state/escaped-artifacts/sample-api.md',
      ),
    );
    const escapedPrivateTarget = checkWorkspace(privateTargetWorkspace);
    ok(/artifact_target resolves outside the workspace/i.test(escapedPrivateTarget.errors.join('\n')),
      'private artifact targets cannot escape through state-tree links',
      escapedPrivateTarget.errors);

    const linkedPrivateWorkspace = join(tmpRoot, 'linked-private-workspace');
    const outsidePrivateLane = join(tmpRoot, 'outside-private-lane');
    cpSync(join(fx, 'repo-workspace'), linkedPrivateWorkspace, { recursive: true });
    mkdirSync(outsidePrivateLane, { recursive: true });
    symlinkSync(outsidePrivateLane, join(linkedPrivateWorkspace, '.kai', 'runs'), 'junction');
    const linkedPrivate = checkWorkspace(linkedPrivateWorkspace);
    ok(/schema-3 path ".kai\/runs" resolves outside the workspace/i.test(linkedPrivate.errors.join('\n')),
      'private lanes cannot escape the workspace through a symbolic link or junction',
      linkedPrivate.errors);

    const danglingPrivateWorkspace = join(tmpRoot, 'dangling-private-workspace');
    const removedPrivateTarget = join(tmpRoot, 'removed-private-target');
    cpSync(join(fx, 'repo-workspace'), danglingPrivateWorkspace, { recursive: true });
    mkdirSync(removedPrivateTarget, { recursive: true });
    symlinkSync(removedPrivateTarget, join(danglingPrivateWorkspace, '.kai', 'review'), 'junction');
    rmSync(removedPrivateTarget, { recursive: true });
    const danglingPrivate = checkWorkspace(danglingPrivateWorkspace);
    ok(/private workspace path ".kai\/review" is a symbolic link or junction/i.test(danglingPrivate.errors.join('\n')),
      'dangling private-lane links fail closed',
      danglingPrivate.errors);

    const nestedGitWorkspace = join(tmpRoot, 'nested-git-workspace');
    cpSync(join(fx, 'repo-workspace'), nestedGitWorkspace, { recursive: true });
    mkdirSync(join(nestedGitWorkspace, '.kai', 'runs', 'cloned-evidence', '.git'), { recursive: true });
    const nestedGit = checkWorkspace(nestedGitWorkspace);
    ok(/private workspace path .* contains a nested Git repository/i.test(nestedGit.errors.join('\n')),
      'private lanes cannot hide independently tracked Git repositories',
      nestedGit.errors);

    const privatePublicationWorkspace = join(tmpRoot, 'private-publication-workspace');
    cpSync(join(fx, 'repo-workspace'), privatePublicationWorkspace, { recursive: true });
    const privateManifestPath = join(privatePublicationWorkspace, '.kai', 'manifest.json');
    const privateManifest = JSON.parse(readFileSync(privateManifestPath, 'utf8'));
    privateManifest.projects[0].publication_root = './.KaI';
    writeFileSync(privateManifestPath, `${JSON.stringify(privateManifest, null, 2)}\n`);
    const privatePublication = checkWorkspace(privatePublicationWorkspace);
    ok(/publication_root must be outside .kai/i.test(privatePublication.errors.join('\n')),
      'publication_root cannot alias the private .kai control tree',
      privatePublication.errors);

    const linkedPublicationWorkspace = join(tmpRoot, 'linked-publication-workspace');
    const outsidePublication = join(tmpRoot, 'outside-publication');
    cpSync(join(fx, 'repo-workspace'), linkedPublicationWorkspace, { recursive: true });
    mkdirSync(outsidePublication, { recursive: true });
    symlinkSync(outsidePublication, join(linkedPublicationWorkspace, 'docs'), 'junction');
    const linkedPublication = checkWorkspace(linkedPublicationWorkspace);
    ok(/symbolic link or junction/i.test(linkedPublication.errors.join('\n')),
      'publication_root cannot escape the project through a symbolic link or junction',
      linkedPublication.errors);

    const overlappingProjectRoot = join(tmpRoot, 'overlapping-project');
    const overlappingWorkspaceRoot = join(overlappingProjectRoot, 'external-workspace');
    mkdirSync(overlappingProjectRoot, { recursive: true });
    cpSync(join(fx, 'external-workspace'), overlappingWorkspaceRoot, { recursive: true });
    const overlappingManifestPath = join(overlappingWorkspaceRoot, '.kai', 'manifest.json');
    const overlappingManifest = JSON.parse(readFileSync(overlappingManifestPath, 'utf8'));
    overlappingManifest.workspace_root = overlappingWorkspaceRoot;
    overlappingManifest.projects[0].path = overlappingProjectRoot;
    writeFileSync(overlappingManifestPath, `${JSON.stringify(overlappingManifest, null, 2)}\n`);
    const overlapping = checkWorkspace(overlappingWorkspaceRoot, { allowUnregisteredExternal: true });
    ok(/overlaps the external workspace root/i.test(overlapping.errors.join('\n')),
      'external workspaces cannot be nested in or contain their bound projects',
      overlapping.errors);

    const projectRoot = join(tmpRoot, 'project');
    const workspaceRoot = join(tmpRoot, 'workspace');
    mkdirSync(projectRoot, { recursive: true });
    cpSync(join(fx, 'external-workspace'), workspaceRoot, { recursive: true });
    const manifestPath = join(workspaceRoot, '.kai', 'manifest.json');
    const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
    manifest.workspace_root = workspaceRoot;
    manifest.projects[0].path = projectRoot;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

    const env = { KAI_HOME: join(tmpRoot, 'home') };
    const unregistered = checkWorkspace(workspaceRoot, { env });
    ok(/--adopt/i.test(unregistered.errors.join('\n')),
      'an external workspace is not claimable before registry adoption',
      unregistered.errors);

    const adopted = adoptWorkspace({ root: workspaceRoot, projectRoot, env });
    ok(adopted.ok, 'external workspace adoption writes the machine-local registry', [adopted.reason]);
    const registered = checkWorkspace(workspaceRoot, { env });
    ok(registered.errors.length === 0, 'adopted external workspace validates its registry pairing', registered.errors);

    if (adopted.ok) {
      const selfPath = fileURLToPath(import.meta.url);
      const cliEnv = { ...process.env, ...env };
      const registryCli = spawnSync(
        process.execPath,
        [selfPath, '--registry', '--json', '--kai-home', env.KAI_HOME],
        { encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      let registryJson = null;
      try {
        registryJson = JSON.parse(registryCli.stdout);
      } catch {
        registryJson = null;
      }
      ok(registryCli.status === 0 && registryJson?.workspaces?.length === 1,
        'the registry CLI reports populated JSON without crashing',
        [registryCli.stderr, registryCli.stdout].filter(Boolean));

      const resolvedCli = spawnSync(
        process.execPath,
        [selfPath],
        { cwd: projectRoot, encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      ok(resolvedCli.status === 0 && /workspace healthy/i.test(resolvedCli.stdout),
        'the default doctor resolves a registered external workspace from the project',
        [resolvedCli.stderr, resolvedCli.stdout].filter(Boolean));

      const registeredEntries = loadWorkspaceRegistry(env).entries;
      writeRegistry([...registeredEntries, {
        project_root: registeredEntries[0].project_root,
        workspace_root: join(tmpRoot, 'duplicate-workspace'),
        workspace_id: 'duplicate-workspace',
      }], env);
      const duplicateBinding = checkWorkspace(workspaceRoot, { env });
      ok(/exactly one is required/i.test(duplicateBinding.errors.join('\n')),
        'duplicate external project bindings fail closed',
        duplicateBinding.errors);
      writeRegistry(registeredEntries, env);

      const concurrentHome = join(tmpRoot, 'concurrent-home');
      const concurrentEnv = { ...process.env, KAI_HOME: concurrentHome };
      const concurrentProjects = ['alpha', 'beta'].map((name) => {
        const concurrentProject = join(tmpRoot, `concurrent-project-${name}`);
        const concurrentWorkspace = join(tmpRoot, `concurrent-workspace-${name}`);
        mkdirSync(concurrentProject, { recursive: true });
        cpSync(join(fx, 'external-workspace'), concurrentWorkspace, { recursive: true });
        const concurrentManifestPath = join(concurrentWorkspace, '.kai', 'manifest.json');
        const concurrentManifest = JSON.parse(readFileSync(concurrentManifestPath, 'utf8'));
        concurrentManifest.workspace_id = `concurrent-workspace-${name}`;
        concurrentManifest.workspace_root = concurrentWorkspace;
        concurrentManifest.projects[0].id = name;
        concurrentManifest.projects[0].path = concurrentProject;
        writeFileSync(concurrentManifestPath, `${JSON.stringify(concurrentManifest, null, 2)}\n`);
        return { project: concurrentProject, workspace: concurrentWorkspace };
      });
      const concurrentLogs = [];
      for (const candidate of concurrentProjects) {
        const logPath = `${candidate.workspace}.log`;
        const log = openSync(logPath, 'w');
        spawn(
          process.execPath,
          [selfPath, '--adopt', candidate.project, '--root', candidate.workspace],
          { env: concurrentEnv, stdio: ['ignore', log, log], windowsHide: true },
        );
        closeSync(log);
        concurrentLogs.push(logPath);
      }
      const concurrentDeadline = Date.now() + 15000;
      let concurrentRegistry = { ok: true, entries: [] };
      while (Date.now() < concurrentDeadline) {
        concurrentRegistry = loadWorkspaceRegistry({ KAI_HOME: concurrentHome });
        if (concurrentRegistry.ok && concurrentRegistry.entries.length === concurrentProjects.length) break;
        sleepSync(25);
      }
      ok(concurrentRegistry.ok && concurrentRegistry.entries.length === concurrentProjects.length,
        'concurrent registry adoption preserves every project binding',
        [
          ...(concurrentRegistry.ok
            ? concurrentRegistry.entries.map((entry) => JSON.stringify(entry))
            : [concurrentRegistry.reason]),
          ...concurrentLogs.flatMap((path) => {
            const output = existsSync(path) ? readFileSync(path, 'utf8').trim() : '';
            return output ? [`${basename(path)}: ${output}`] : [];
          }),
        ]);

      const staleEnv = { KAI_HOME: join(tmpRoot, 'stale-lock-home') };
      const staleRegistryPath = registryPath(staleEnv);
      mkdirSync(dirname(staleRegistryPath), { recursive: true });
      const deadOwner = spawnSync(process.execPath, ['-e', 'process.exit(0)'], { windowsHide: true });
      writeFileSync(`${staleRegistryPath}.lock`, `${JSON.stringify({
        pid: deadOwner.pid,
        token: 'stale-owner-token',
      })}\n`);
      const recoveredWrite = writeRegistry([], staleEnv);
      ok(recoveredWrite.ok && !existsSync(`${staleRegistryPath}.lock`),
        'a registry mutation safely recovers a lock whose recorded owner exited',
        [recoveredWrite.reason].filter(Boolean));

      const registry = loadWorkspaceRegistry(env);
      registry.entries[0].workspace_id = 'mismatched-workspace';
      writeRegistry(registry.entries, env);
      const mismatched = checkWorkspace(workspaceRoot, { env });
      ok(/not paired|not registered/i.test(mismatched.errors.join('\n')),
        'registry and manifest workspace ids cannot drift silently', mismatched.errors);

      writeRegistry([{
        project_root: projectRoot,
        workspace_root: workspaceRoot,
        workspace_id: manifest.workspace_id,
      }], env);
      const forgotten = forgetWorkspace({ projectRoot, env });
      ok(forgotten.ok && loadWorkspaceRegistry(env).entries.length === 0,
        'forget removes one project binding without deleting workspace state', [forgotten.reason]);

      const emptyRegistryCli = spawnSync(
        process.execPath,
        [selfPath, '--registry', '--kai-home', env.KAI_HOME],
        { encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      ok(emptyRegistryCli.status === 0 && /\(empty\)/.test(emptyRegistryCli.stdout),
        'the registry CLI reports an empty registry',
        [emptyRegistryCli.stderr, emptyRegistryCli.stdout].filter(Boolean));

      writeFileSync(registryPath(env), '{not-json\n');
      const malformedRegistryCli = spawnSync(
        process.execPath,
        [selfPath, '--registry', '--kai-home', env.KAI_HOME],
        { encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      ok(malformedRegistryCli.status === 1 && /not valid JSON/i.test(malformedRegistryCli.stderr),
        'the registry CLI fails clearly on malformed registry data',
        [malformedRegistryCli.stderr, malformedRegistryCli.stdout].filter(Boolean));

      writeFileSync(registryPath(env), `${JSON.stringify({
        schema_version: 1,
        workspaces: [{ project_root: null, workspace_root: workspaceRoot, workspace_id: manifest.workspace_id }],
      }, null, 2)}\n`);
      const malformedEntryCli = spawnSync(
        process.execPath,
        [selfPath, '--registry', '--kai-home', env.KAI_HOME],
        { encoding: 'utf8', env: cliEnv, windowsHide: true },
      );
      ok(malformedEntryCli.status === 1 && /missing string "project_root"/i.test(malformedEntryCli.stderr),
        'the registry CLI fails clearly on malformed registry entries',
        [malformedEntryCli.stderr, malformedEntryCli.stdout].filter(Boolean));
    }
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }

  if (!migrationSelfTest()) failed++;
  return failed === 0 ? 0 : 1;
}

// --- pack-migration self-test ----------------------------------------------
// The scenarios the migration check must get right, each pinned to a status and
// the finding codes behind it. `status` is asserted exactly: a case that should
// be `unknown` must not pass as `clear`, which is the whole point of separating
// unverifiable evidence from verified absence.
const MIGRATION_CASES = [
  {
    label: 'legacy monolith installed (direct), workspace scaffolded by it',
    home: 'legacy-direct', workspace: 'monolith', status: 'blocked',
    expect: ['legacy-installed', 'workspace-provenance-current'],
    forbid: ['coexistence', 'nothing-installed'],
    steps: [/^copilot plugin uninstall kai$/, /copilot plugin list/, /confirm every legacy install tree/],
  },
  {
    label: 'clean pack set (core + one department, marketplace), workspace already migrated',
    home: 'packs-marketplace', workspace: 'pack', status: 'clear',
    expect: ['workspace-provenance-migrated'],
    forbid: ['legacy-installed', 'workspace-provenance-stale'],
    noSteps: true, notices: [/start a new session/i],
  },
  {
    label: 'legacy `kai` and `kai-core` installed together',
    home: 'coexistence', status: 'blocked',
    expect: ['coexistence', 'legacy-installed'],
    steps: [/^copilot plugin uninstall kai$/],
  },
  {
    label: 'department pack installed without kai-core',
    home: 'partial-packs', status: 'blocked',
    expect: ['partial-pack-set'], forbid: ['legacy-installed', 'coexistence'],
    steps: [/copilot plugin install kai-core@kai-plugins/],
  },
  {
    label: 'stale direct install tree left behind by an uninstall',
    home: 'stale-direct', status: 'blocked',
    expect: ['stale-install', 'legacy-installed'],
    steps: [/remove each leftover install tree/],
  },
  {
    label: 'same pack installed from both a direct source and the marketplace',
    home: 'provenance-collision', status: 'blocked',
    expect: ['provenance-collision'], steps: [/copilot plugin uninstall kai-core/],
  },
  {
    label: 'provenance inferred from a cache path, plus an unidentifiable kai tree',
    home: 'inferred-provenance', status: 'unknown',
    expect: ['unknown-provenance'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'host config truncated mid-write',
    home: 'malformed-config', status: 'unknown',
    expect: ['unreadable-metadata', 'install-tree-unverified'],
    forbid: ['nothing-installed', 'stale-install'], noRefusal: true, noSteps: true,
  },
  {
    label: 'host config parses but its entries are junk; workspace records an unknown plugin',
    home: 'malformed-entries', workspace: 'unrecognized', status: 'unknown',
    expect: ['unreadable-metadata', 'workspace-provenance-unknown'], noRefusal: true,
  },
  {
    label: 'settings.json is unreadable, so a config-enabled pack is not assumed enabled',
    home: 'malformed-settings', status: 'unknown',
    expect: ['enabled-state-unverified'],
    forbid: ['nothing-installed', 'disabled-install'], noRefusal: true, noSteps: true,
  },
  {
    label: 'settings.json carries a non-boolean enabled state',
    home: 'nonboolean-enabled-state', status: 'unknown',
    expect: ['enabled-state-unverified'],
    forbid: ['nothing-installed', 'disabled-install'], noRefusal: true, noSteps: true,
  },
  {
    label: 'same pack has two direct install trees',
    home: 'same-source-collision', status: 'blocked',
    expect: ['provenance-collision'], forbid: ['nothing-installed'],
  },
  {
    label: 'Windows and macOS cache paths (case, separators, trailing slash) both resolve',
    home: 'path-normalization', status: 'clear', noSteps: true, noRefusal: true,
  },
  {
    label: 'nothing installed, and both surfaces were readable',
    home: 'absent', status: 'clear', expect: ['nothing-installed'], noSteps: true,
  },
  {
    label: 'host config has no installedPlugins list',
    home: 'missing-installed-list', status: 'unknown',
    expect: ['unreadable-metadata'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'install directory is missing',
    home: 'missing-install-dir', status: 'unknown',
    expect: ['unreadable-install-tree'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'install directory path is not a directory',
    home: 'install-path-file', status: 'unknown',
    expect: ['unreadable-install-tree'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'symlinked install directory is followed and legacy leftovers remain blocked',
    home: 'symlinked-install-dir', status: 'blocked',
    expect: ['stale-install', 'legacy-installed'], forbid: ['nothing-installed'],
  },
  {
    label: 'kai-shaped tree declares a foreign plugin identity',
    home: 'foreign-identity', status: 'unknown',
    expect: ['unknown-provenance'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'manifest-less legacy remnant with child content does not disappear',
    home: 'manifestless-legacy-remnant', status: 'unknown',
    expect: ['unknown-provenance'], forbid: ['nothing-installed'], noRefusal: true, noSteps: true,
  },
  {
    label: 'deep marketplace layout still reveals a stale kai install',
    home: 'deep-marketplace-layout', status: 'unknown',
    expect: ['install-tree-unverified'], forbid: ['nothing-installed', 'stale-install'], noRefusal: true, noSteps: true,
  },
  {
    label: 'recorded marketplace and inferred bucket disagreement is unknown, not collision',
    home: 'provenance-disagreement', status: 'unknown',
    expect: ['provenance-disagreement'], forbid: ['provenance-collision'], noRefusal: true,
  },
  {
    label: 'dangling install link makes enumeration unknown',
    home: 'dangling-install-link', status: 'unknown',
    expect: ['unreadable-install-tree'], forbid: ['nothing-installed'], noRefusal: true,
  },
  {
    label: 'packs installed but the workspace still records the monolith',
    home: 'packs-marketplace', workspace: 'monolith', status: 'blocked',
    expect: ['workspace-provenance-stale'],
    steps: [/set "plugin": "kai-core"/, /workspace-doctor\.mjs --root/],
  },
  {
    label: 'config still lists the monolith after its files were removed',
    home: 'incomplete-uninstall', status: 'blocked',
    expect: ['incomplete-install', 'legacy-installed'], forbid: ['stale-install'],
  },
  {
    label: 'config and the install tree disagree about what is installed',
    home: 'identity-mismatch', status: 'blocked', expect: ['identity-mismatch'],
  },
  {
    label: 'workspace migrated ahead of the host, legacy still installed',
    home: 'legacy-direct', workspace: 'pack', status: 'blocked',
    expect: ['workspace-provenance-ahead', 'legacy-installed'],
    steps: [/^copilot plugin uninstall kai$/],
    forbidSteps: [/set "plugin": "kai"/],
  },
  {
    label: 'explicit rollback reverses a migrated workspace without uninstalling the restored monolith',
    home: 'legacy-direct', workspace: 'pack', rollback: true, status: 'blocked',
    expect: ['legacy-rollback-restored', 'workspace-provenance-ahead'],
    forbid: ['legacy-installed', 'legacy-rollback-unverified', 'coexistence'],
    steps: [/^edit .*set "plugin": "kai"/, /workspace-doctor\.mjs --root/],
    forbidSteps: [/^copilot plugin uninstall kai$/, /confirm no "kai" row/, /confirm every legacy install tree/],
  },
  {
    label: 'completed rollback has matching monolith workspace provenance',
    home: 'legacy-direct', workspace: 'monolith', rollback: true, status: 'clear',
    expect: ['legacy-rollback-restored', 'workspace-provenance-current'],
    forbid: ['legacy-installed', 'legacy-rollback-unverified', 'workspace-provenance-ahead'],
    noSteps: true, noRefusal: true,
  },
  {
    label: 'rollback refuses a monolith whose install tree declares the pack identity',
    home: 'identity-mismatch', workspace: 'pack', rollback: true, status: 'blocked',
    expect: ['identity-mismatch', 'legacy-rollback-unverified', 'workspace-provenance-ahead'],
    forbid: ['legacy-rollback-restored'],
    forbidSteps: [/set "plugin": "kai"/, /^copilot plugin uninstall kai$/],
  },
  {
    label: 'rollback refuses duplicate monolith trees without uninstalling or reversing provenance',
    home: 'duplicate-legacy', workspace: 'pack', rollback: true, status: 'blocked',
    expect: ['provenance-collision', 'legacy-rollback-unverified', 'workspace-provenance-ahead'],
    forbid: ['legacy-rollback-restored'],
    forbidSteps: [/set "plugin": "kai"/, /^copilot plugin uninstall kai/],
  },
  {
    label: 'rollback refuses monolith provenance inferred from cache path',
    home: 'inferred-legacy-provenance', workspace: 'pack', rollback: true, status: 'blocked',
    expect: ['unknown-provenance', 'legacy-rollback-unverified', 'workspace-provenance-ahead'],
    forbid: ['legacy-rollback-restored'],
    forbidSteps: [/set "plugin": "kai"/, /^copilot plugin uninstall kai/],
  },
  {
    label: 'workspace manifest unreadable',
    home: 'absent', workspace: 'malformed', status: 'unknown',
    expect: ['workspace-provenance-unreadable'], noRefusal: true,
  },
];

// The fixtures are data rather than committed directories: a host cache tree and
// an empty directory are both things a checkout cannot reproduce faithfully.
function materializeHostFixtures(dest) {
  const fx = JSON.parse(readFileSync(join(__dirname, '..', 'test', 'fixtures', 'host-installs.json'), 'utf8'));
  const write = (base, files) => {
    for (const [rel, content] of Object.entries(files)) {
      const target = resolve(base, ...rel.split('/').filter(Boolean));
      const fromBase = relative(resolve(base), target);
      if (fromBase === '..' || fromBase.startsWith(`..${sep}`) || isAbsolute(fromBase)) {
        throw new Error(`fixture path escapes its root: ${rel}`);
      }
      if (content === null) { mkdirSync(target, { recursive: true }); continue; }
      mkdirSync(dirname(target), { recursive: true });
      const text = Array.isArray(content) ? `${content.join('\n')}\n` : `${JSON.stringify(content, null, 2)}\n`;
      writeFileSync(target, text);
    }
  };
  const fixtureBase = (kind, name) => {
    if (!name || name === '.' || name === '..' || /[\\/]/.test(name)) {
      throw new Error(`invalid ${kind} fixture name: ${name}`);
    }
    return join(dest, kind, name);
  };
  for (const [name, files] of Object.entries(fx.homes)) write(fixtureBase('homes', name), files);
  for (const [name, files] of Object.entries(fx.workspaces)) write(fixtureBase('workspaces', name), files);

  const linkedStore = join(dest, 'linked-install-store');
  write(linkedStore, {
    '_direct/RubenSaucedo--kai/plugin.json': { name: 'kai', version: '0.55.0' },
  });
  symlinkSync(linkedStore, join(dest, 'homes', 'symlinked-install-dir', 'installed-plugins'), 'junction');
  symlinkSync(
    join(dest, 'missing-linked-install-store'),
    join(dest, 'homes', 'dangling-install-link', 'installed-plugins'),
    'junction',
  );
}

// Path + content of every file below `dir`, so "this check mutates nothing" is
// asserted rather than asserted-in-a-comment.
function snapshotTree(dir, prefix = '') {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (lstatSync(join(dir, entry.name)).isSymbolicLink()) out.push(`${rel}->${readlinkSync(join(dir, entry.name))}`);
    else if (entry.isDirectory()) out.push(`${rel}/`, ...snapshotTree(join(dir, entry.name), rel));
    else out.push(`${rel}:${readFileSync(join(dir, entry.name), 'utf8')}`);
  }
  return out;
}

function migrationSelfTest() {
  let ok = true;
  const fail = (msg, detail = []) => { ok = false; console.log(`✗ ${msg}`); detail.forEach((d) => console.log(`    ${d}`)); };

  // Host metadata is JSONC — the shipped config.json opens with two comment
  // lines, so a plain JSON.parse fails on every real host.
  const commented = parseJsonc('// managed\n{"a": 1, "url": "https://x/y" /* inline */}\n');
  if (!commented.ok || commented.value.a !== 1 || commented.value.url !== 'https://x/y') {
    fail('self-test: commented host config was not parsed with its string values intact');
  }
  if (parseJsonc('{"installedPlugins": [').ok) fail('self-test: truncated host config parsed as valid');

  const tails = [
    ['C:\\Users\\dev\\.copilot\\installed-plugins\\_direct\\RubenSaucedo--kai', '_direct/RubenSaucedo--kai'],
    ['/Users/dev/.copilot/installed-plugins//kai-plugins/kai-engineering/', 'kai-plugins/kai-engineering'],
    ['C:\\Users\\dev\\.copilot\\Installed-Plugins\\kai-plugins\\kai-core', 'kai-plugins/kai-core'],
    ['/opt/elsewhere/kai-core', null],
  ];
  for (const [input, want] of tails) {
    if (installTreeTail(input) !== want) {
      fail(`self-test: cache path "${input}" normalized to ${JSON.stringify(installTreeTail(input))}, expected ${JSON.stringify(want)}`);
    }
  }
  if (normalizeHostPath('C:\\a\\\\b\\') !== 'C:/a/b') fail('self-test: host path normalization did not collapse separators');
  if (migrationExitCode('clear') !== 0 || migrationExitCode('blocked') !== 2 || migrationExitCode('unknown') !== 3) {
    fail('self-test: migration verdict exit codes are not distinct');
  }

  const tmpRoot = mkdtempSync(join(tmpdir(), 'kai-migration-'));
  try {
    materializeHostFixtures(tmpRoot);
    const before = snapshotTree(tmpRoot).join('\n');
    const missingHome = migrationReport({ home: join(tmpRoot, 'homes', 'no-such-home') });
    if (missingHome.status !== 'unknown' || !missingHome.codes.includes('no-host-home')) {
      fail(`self-test: an uninspectable host home reported "${missingHome.status}" instead of unknown`);
    }

    let passed = 0;
    for (const c of MIGRATION_CASES) {
      const home = join(tmpRoot, 'homes', c.home);
      const root = c.workspace ? join(tmpRoot, 'workspaces', c.workspace) : null;
      const res = migrationReport({ home, root, rollback: c.rollback ?? false });
      const problems = [];
      if (res.status !== c.status) problems.push(`status "${res.status}", expected "${c.status}"`);
      for (const code of c.expect ?? []) if (!res.codes.includes(code)) problems.push(`missing finding "${code}"`);
      for (const code of c.forbid ?? []) if (res.codes.includes(code)) problems.push(`unexpected finding "${code}"`);
      for (const re of c.steps ?? []) {
        if (!res.steps.some((s) => re.test(s))) problems.push(`no remediation step matching ${re}`);
      }
      for (const re of c.forbidSteps ?? []) {
        if (res.steps.some((s) => re.test(s))) problems.push(`unexpected remediation step matching ${re}`);
      }
      for (const re of c.notices ?? []) {
        if (!res.notices.some((n) => re.test(n))) problems.push(`no notice matching ${re}`);
      }
      if (c.noSteps && res.steps.length) problems.push(`expected no remediation steps, got ${res.steps.length}`);
      if (c.noRefusal && res.findings.some((f) => f.severity === 'refusal')) {
        problems.push('expected no refusal-severity finding');
      }
      if (problems.length) fail(`self-test: migration case "${c.label}"`, [...problems, `codes: ${res.codes.join(', ') || '(none)'}`]);
      else passed++;
    }
    if (passed === MIGRATION_CASES.length) {
      console.log(`✓ self-test: ${passed} migration scenarios verdict correctly (legacy, packs, coexistence, partial set, unreadable surfaces, stale/incomplete installs, provenance collision, unknown provenance, malformed metadata, path normalization)`);
    }

    const inventoryReport = migrationReport({
      home: join(tmpRoot, 'homes', 'packs-marketplace'),
      root: join(tmpRoot, 'workspaces', 'pack'),
    });
    const inventory = migrationInventory(inventoryReport);
    const core = inventory.find((plugin) => plugin.name === 'kai-core');
    if (core?.presence !== 'installed' || core.enabled !== true || !core.versions.length
      || !core.provenances.includes('marketplace:kai-plugins')) {
      fail('self-test: migration JSON inventory does not expose safe core version, enabled-state, and provenance evidence');
    } else {
      console.log('✓ self-test: migration JSON inventory exposes version, enabled state, and provenance without cache paths');
    }

    const disabledInventory = migrationInventory(migrationReport({
      home: join(tmpRoot, 'homes', 'packs-disabled'),
    }));
    if (disabledInventory.find((plugin) => plugin.name === 'kai-core')?.enabled !== false) {
      fail('self-test: an explicitly disabled core install is not exposed as disabled');
    } else {
      console.log('✓ self-test: migration JSON inventory exposes an explicitly disabled core install');
    }

    const disagreementReport = migrationReport({
      home: join(tmpRoot, 'homes', 'packs-enabled-disagreement'),
    });
    const disagreementCore = migrationInventory(disagreementReport)
      .find((plugin) => plugin.name === 'kai-core');
    if (disagreementReport.status !== 'unknown'
      || !disagreementReport.codes.includes('enabled-state-unverified')
      || disagreementCore?.enabled !== null) {
      fail('self-test: disagreeing config/settings enabled state did not fail closed as unknown');
    } else {
      console.log('✓ self-test: disagreeing enabled-state surfaces fail closed as unknown');
    }

    const directNoOverride = migrationReport({
      home: join(tmpRoot, 'homes', 'legacy-direct'),
    });
    const directCoreState = directNoOverride.host.records.get('kai')?.entries[0]?.enabled;
    if (directCoreState !== true || directNoOverride.codes.includes('enabled-state-unverified')) {
      fail('self-test: a direct install with no settings override did not retain its managed config state');
    } else {
      console.log('✓ self-test: an empty settings override map preserves direct-install enabled state');
    }

    const absentSettings = migrationReport({
      home: join(tmpRoot, 'homes', 'path-normalization'),
    });
    if (absentSettings.codes.includes('enabled-state-unverified')) {
      fail('self-test: an absent settings file incorrectly invalidated managed config enabled state');
    } else {
      console.log('✓ self-test: an absent settings file falls back to managed config enabled state');
    }

    // The other half of the same rule: settings that cannot be trusted must blank
    // the state config declared, not let `enabled: true` stand unverified.
    for (const home of ['malformed-settings', 'nonboolean-enabled-state']) {
      const report = migrationReport({ home: join(tmpRoot, 'homes', home) });
      const record = migrationInventory(report).find((plugin) => plugin.name === 'kai-core');
      if (record?.enabled !== null || !report.codes.includes('enabled-state-unverified')) {
        fail(`self-test: "${home}" did not blank the config-declared enabled state it could not verify`,
          [`enabled: ${JSON.stringify(record?.enabled)}`, `codes: ${report.codes.join(', ') || '(none)'}`]);
      } else {
        console.log(`✓ self-test: unverifiable settings (${home}) blank the config enabled state instead of trusting it`);
      }
    }

    if (snapshotTree(tmpRoot).join('\n') !== before) {
      fail('self-test: the migration check modified the host/workspace fixtures — it must be read-only');
    } else {
      console.log('✓ self-test: the migration check left every inspected file byte-identical (read-only)');
    }
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
  return ok;
}

// --- main ------------------------------------------------------------------
// Guarded so importing `checkWorkspace` (see work-status.mjs) does not execute
// the CLI. Without this, an importer's own flags are consumed by this module.
const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  const value = (flag) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
  };
  if (argv.includes('--self-test')) {
    process.exit(selfTest());
  } else if (argv.includes('--migration-check')) {
    const home = value('--home') ? resolve(value('--home')) : defaultHome();
    // Without an explicit --root, the workspace half runs only where a workspace
    // actually is, so a run from an unrelated directory reports on the host and
    // says plainly that it inspected no workspace.
    const rootArg = value('--root');
    const cwdIsWorkspace = existsSync(join(process.cwd(), '.kai', 'manifest.json'));
    const root = rootArg ? resolve(rootArg) : (cwdIsWorkspace ? process.cwd() : null);
    process.exit(reportMigration({
      home,
      root,
      json: argv.includes('--json'),
      rollback: argv.includes('--rollback'),
    }));
  } else if (argv.includes('--registry')) {
    const env = value('--kai-home')
      ? { ...process.env, KAI_HOME: resolve(value('--kai-home')) }
      : process.env;
    process.exit(reportRegistry({ env, json: argv.includes('--json') }));
  } else if (value('--adopt')) {
    const root = value('--root');
    if (!root) {
      console.error('--adopt requires --root <external-workspace>');
      process.exit(1);
    }
    const env = value('--kai-home')
      ? { ...process.env, KAI_HOME: resolve(value('--kai-home')) }
      : process.env;
    const result = adoptWorkspace({ root, projectRoot: value('--adopt'), env });
    if (!result.ok) {
      console.error(`workspace adoption failed: ${result.reason}`);
      process.exit(1);
    }
    console.log(`workspace adopted in ${result.path}`);
    process.exit(0);
  } else if (value('--forget')) {
    const env = value('--kai-home')
      ? { ...process.env, KAI_HOME: resolve(value('--kai-home')) }
      : process.env;
    const result = forgetWorkspace({ projectRoot: value('--forget'), env });
    if (!result.ok) {
      console.error(`workspace removal failed: ${result.reason}`);
      process.exit(1);
    }
    console.log(`workspace binding removed from ${result.path}; workspace files were not deleted`);
    process.exit(0);
  } else if (argv.includes('--rollback')) {
    console.error('--rollback requires --migration-check');
    process.exit(1);
  } else {
    const resolvedWorkspace = resolveWorkspaceRoot({
      explicitRoot: value('--root'),
      cwd: process.cwd(),
      env: process.env,
    });
    if (!resolvedWorkspace.ok) {
      console.error(`workspace-doctor: ${resolvedWorkspace.reason}`);
      process.exit(1);
    }
    process.exit(report(
      resolvedWorkspace.root,
      checkWorkspace(resolvedWorkspace.root, { env: process.env }),
    ));
  }
}
