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
//   node scripts/workspace-doctor.mjs --initialize --root <dir> --confirm < manifest.json
//   node scripts/workspace-doctor.mjs --migration-check [--rollback] [--home <dir>] [--root <dir>] [--json]
//
// Workspace exit code: 0 = healthy, 1 = invalid.
// Migration exit code: 0 = clear, 2 = blocked, 3 = unknown.

import {
  readFileSync, existsSync, readdirSync, writeFileSync, mkdirSync, rmSync,
  lstatSync, renameSync, openSync, closeSync, unlinkSync, rmdirSync,
} from 'node:fs';
import { join, resolve, dirname, basename, relative, isAbsolute, sep } from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import {
  LIFECYCLE, NEEDS_CHANGE_REF, REQUIRES_STATES,
  frontmatter, scalar, cleanScalar, isNull, unquote, dependsOn, lease, listBlock, parseStamp,
} from './lib/coordination.mjs';
import {
  WORKSPACE_PROVENANCE, LEGACY_PLUGIN, CORE_PLUGIN,
  defaultHome, migrationReport,
} from './lib/migration-doctor.mjs';
import {
  defaultKaiHome, loadWorkspaceRegistry, loadWorkspaceRegistryForCleanup,
  readWorkspaceManifest, registryPath, resolveWorkspaceRoot,
  nativeAbsolutePathProblem, validateSchema5Manifest,
} from './lib/workspace-resolve.mjs';
import {
  badPath, normalized, canonicalPath, resolvedProjectPath, escapesRoot, exactPath,
  inspectPrivateLanes, pathHasLink,
} from './lib/workspace-path-safety.mjs';
import { inspectRuntime } from './lib/coordination-runtime/inspection.mjs';
import { inspectGitPrivacy } from './lib/workspace-git-privacy.mjs';
import {readDirection} from './lib/direction.mjs';
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
} from './lib/workspace-layout.mjs';
import {
  closeStore,
  openStore,
} from './lib/coordination-runtime/store.mjs';
import {schema5MigrationLockPath} from './lib/coordination-runtime/migration-files.mjs';

// --- Contract constants the current plugin generates -----------------------
const CURRENT_SCHEMA_VERSION = WORKSPACE_SCHEMA_VERSION;
const LEGACY_LAYOUT_VERSION = 3;
const LEGACY_REQUIRED_MANIFEST_KEYS = [
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

function checkGitMode(root, mode, err, warn) {
  if (mode === 'shared') return;
  const privacy = inspectGitPrivacy(root, mode);
  privacy.errors.forEach(err);
  privacy.warnings.forEach(warn);
  for (const path of privacy.missing) {
    err(mode === 'repo-local' && path === '.kai/'
      ? 'placement "repo-local" requires the entire .kai/ directory to be ignored'
      : `placement "${mode}" requires "${path}" to be ignored`);
  }
}

const SCHEMA5_FORBIDDEN_ROOTS = [
  '.kai/state',
  '.kai/runs',
  '.kai/review',
  '.kai/archive',
  '.kai/personal',
  '.kai/areas',
  '.kai/shared',
];

function schema5WorkspaceValidation(root, manifest, options = {}) {
  const errors = [];
  const warnings = [];
  const shape = validateSchema5Manifest(root, manifest, {
    env: options.env ?? process.env,
    allowUnregisteredExternal: options.allowUnregisteredExternal ?? false,
  });
  errors.push(...shape.errors);
  if (shape.errors.length) return {errors, warnings, projects: shape.projects};

  const privacy = inspectGitPrivacy(root, manifest.placement);
  errors.push(...privacy.errors);
  warnings.push(...privacy.warnings);
  if (existsSync(schema5MigrationLockPath(root))) {
    errors.push('RECOVERY_REQUIRED: incomplete schema-5 migration requires explicit recovery before coordinated work');
  }
  if (manifest.placement === 'repo-local' && !privacy.gitRoot) {
    errors.push('repo-local placement requires a readable Git work tree so .kai privacy can be verified');
  }
  for (const path of privacy.missing) {
    errors.push(`placement "${manifest.placement}" requires the entire .kai/ directory to be ignored (missing ${path})`);
  }

  if (manifest.placement === 'external') {
    for (const {projectRoot} of shape.projects) {
      if (existsSync(join(projectRoot, '.kai'))) {
        errors.push(`external project "${projectRoot}" must not contain a .kai directory`);
      }
    }
  }

  try {
    readDirection({workspaceRoot: root, manifest});
  } catch (error) {
    errors.push(`${error.code ?? 'INVALID_DIRECTION'}: ${error.message}`);
  }

  const privateRoot = join(root, '.kai');
  if (!existsSync(privateRoot)) {
    if (options.requireActivated) errors.push('schema-5 workspace is missing required directory ".kai"');
  } else if (!lstatSync(privateRoot).isDirectory() || pathHasLink(root, privateRoot) || !exactPath(privateRoot)) {
    errors.push('schema-5 private root ".kai" must be an exact unlinked directory');
  } else if (!options.requireActivated && readdirSync(privateRoot).length > 0) {
    errors.push('schema-5 initialization requires an absent or empty .kai directory');
  }
  for (const forbidden of SCHEMA5_FORBIDDEN_ROOTS) {
    if (existsSync(join(root, ...forbidden.split('/')))) {
      errors.push(`schema-5 workspace contains retired generic root "${forbidden}"`);
    }
  }
  const lanes = inspectPrivateLanes(root, ['.kai']);
  for (const path of lanes.symbolicLinks) errors.push(`private workspace path "${path}" is a symbolic link or junction`);
  for (const path of lanes.gitRoots) errors.push(`private workspace path "${path}" contains a nested Git repository`);
  for (const detail of lanes.unreadable) errors.push(`private workspace path is unreadable: ${detail}`);

  if (!options.requireActivated) return {errors, warnings, projects: shape.projects};

  const databasePath = join(root, ...COORDINATION_DATABASE.split('/'));
  if (!existsSync(databasePath)) {
    errors.push(`schema-5 workspace is missing required store "${COORDINATION_DATABASE}"`);
  } else if (pathHasLink(root, databasePath) || !exactPath(databasePath)
    || !lstatSync(databasePath).isFile()) {
    errors.push(`schema-5 store "${COORDINATION_DATABASE}" must be an exact unlinked file`);
  } else {
    let store;
    try {
      store = openStore({path: databasePath, mode: 'read'});
    } catch (error) {
      errors.push(`${error.code ?? 'SCHEMA_MISMATCH'}: ${error.message}`);
    } finally {
      closeStore(store);
    }
  }

  const selected = shape.projects.length === 1
    ? shape.projects[0]
    : shape.projects.find(project => project.project.id === 'default');
  if (!selected) errors.push('schema-5 workspace with multiple projects requires one "default" project');
  else if (!existsSync(join(selected.publicationRootAbsolute, 'README.md'))) {
    errors.push(`${selected.project.publication_root}/README.md is missing`);
  } else {
    const readme = join(selected.publicationRootAbsolute, 'README.md');
    if (!lstatSync(readme).isFile() || pathHasLink(selected.projectRoot, readme) || !exactPath(readme)) {
      errors.push(`${selected.project.publication_root}/README.md must be an exact unlinked file`);
    }
  }
  return {errors, warnings, projects: shape.projects};
}

const README_CONTENT = [
  '# Kai',
  '',
  'Accepted Kai knowledge belongs below this directory. Private runtime state stays in `.kai/`.',
  '',
].join('\n');

function initializationFingerprint(path) {
  try {
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.nlink !== 1) return null;
    const bytes = readFileSync(path);
    const after = lstatSync(path);
    if (!after.isFile() || after.isSymbolicLink() || after.nlink !== 1
      || after.dev !== stat.dev || after.ino !== stat.ino
      || after.size !== stat.size || after.mtimeMs !== stat.mtimeMs
      || bytes.length !== stat.size) return null;
    return {
      dev: String(stat.dev),
      ino: String(stat.ino),
      size: stat.size,
      mtimeMs: stat.mtimeMs,
      digest: createHash('sha256').update(bytes).digest('hex'),
    };
  } catch {
    return null;
  }
}

function removeOwnedInitializationFile(path, fingerprint) {
  if (fingerprint === null) return {ok: true, removed: false};
  const current = initializationFingerprint(path);
  if (current === null) {
    try {
      lstatSync(path);
    } catch (error) {
      if (error.code === 'ENOENT') return {ok: true, removed: false};
      return {
        ok: false,
        owned: false,
        code: error.code ?? 'FILESYSTEM_ERROR',
        reason: 'initialization cleanup could not verify file ownership',
      };
    }
    return {
      ok: false,
      owned: false,
      code: 'OWNERSHIP_CHANGED',
      reason: 'initialization cleanup retained a file whose ownership changed',
    };
  }
  if (JSON.stringify(current) !== JSON.stringify(fingerprint)) {
    return {
      ok: false,
      owned: false,
      code: 'OWNERSHIP_CHANGED',
      reason: 'initialization cleanup retained a file whose ownership changed',
    };
  }
  try {
    rmSync(path, {force: true});
    return {ok: true, removed: true};
  } catch (error) {
    return {
      ok: false,
      owned: true,
      code: error.code ?? 'FILESYSTEM_ERROR',
      reason: error.message,
    };
  }
}

export function initializeWorkspace({
  root,
  manifest,
  env = process.env,
  confirm = false,
} = {}) {
  if (confirm !== true) {
    return {
      ok: false,
      code: 'AUTHORITY_REQUIRED',
      reason: 'workspace initialization requires explicit confirmation',
    };
  }
  const rootProblem = nativeAbsolutePathProblem(root, {
    label: 'workspace initialization root',
    requireExisting: true,
    requireCanonical: true,
  });
  if (rootProblem) return {ok: false, code: 'INVALID_INPUT', reason: rootProblem};
  root = resolve(root);
  const manifestPath = join(root, '.kai', 'manifest.json');
  if (existsSync(manifestPath)) {
    return {ok: false, code: 'VERSION_CONFLICT', reason: '.kai/manifest.json already exists'};
  }
  const validation = schema5WorkspaceValidation(root, manifest, {
    env,
    requireActivated: false,
  });
  if (validation.errors.length) {
    const [first] = validation.errors;
    const code = /^([A-Z_]+):/.exec(first)?.[1] ?? 'INVALID_INPUT';
    return {ok: false, code, reason: first};
  }

  const selected = validation.projects.length === 1
    ? validation.projects[0]
    : validation.projects.find(project => project.project.id === 'default');
  if (!selected) {
    return {ok: false, code: 'INVALID_INPUT', reason: 'multiple projects require one "default" project'};
  }

  const privateRoot = join(root, '.kai');
  const coreRoot = join(privateRoot, 'core');
  const runtimeRoot = join(coreRoot, 'runtime');
  const databasePath = join(root, ...COORDINATION_DATABASE.split('/'));
  const readmePath = join(selected.publicationRootAbsolute, 'README.md');
  const invocationId = randomUUID();
  const claimPath = join(privateRoot, '.initialize.json');
  const stagedManifest = join(privateRoot, `.manifest-${process.pid}-${invocationId}.tmp`);
  const createdPrivateRoot = !existsSync(privateRoot);
  const createdDirectories = [];
  const ownedFiles = new Map();
  const cleanupFailures = [];
  let claimFingerprint = null;
  let claimCleanup = {ok: true, removed: false};
  let activated = false;
  let result;
  let store;
  try {
    mkdirSync(privateRoot, {recursive: true});
    try {
      writeFileSync(claimPath, `${JSON.stringify({
        schema_version: 1,
        workspace_id: manifest.workspace_id,
        invocation_id: invocationId,
        manifest_digest: createHash('sha256')
          .update(JSON.stringify(manifest))
          .digest('hex'),
      }, null, 2)}\n`, {flag: 'wx', mode: 0o600});
    } catch (error) {
      if (error.code === 'EEXIST') {
        throw Object.assign(new Error('workspace initialization is already in progress'), {
          code: 'VERSION_CONFLICT',
        });
      }
      throw error;
    }
    claimFingerprint = initializationFingerprint(claimPath);
    if (claimFingerprint === null) {
      throw Object.assign(new Error('workspace initialization claim changed identity'), {
        code: 'RECOVERY_REQUIRED',
      });
    }
    if (existsSync(manifestPath)) {
      throw Object.assign(new Error('.kai/manifest.json already exists'), {
        code: 'VERSION_CONFLICT',
      });
    }
    const unexpectedPrivateEntries = readdirSync(privateRoot)
      .filter(entry => entry !== basename(claimPath));
    if (unexpectedPrivateEntries.length > 0) {
      throw Object.assign(new Error(
        `workspace initialization found pre-existing private state: ${unexpectedPrivateEntries.join(', ')}`,
      ), {code: 'VERSION_CONFLICT'});
    }
    for (const path of [coreRoot, runtimeRoot]) {
      if (!existsSync(path)) {
        mkdirSync(path);
        createdDirectories.push(path);
      }
    }
    if (existsSync(databasePath)) {
      throw Object.assign(new Error(`${COORDINATION_DATABASE} already exists`), {
        code: 'VERSION_CONFLICT',
      });
    }
    writeFileSync(stagedManifest, `${JSON.stringify(manifest, null, 2)}\n`, {flag: 'wx', mode: 0o600});
    ownedFiles.set(stagedManifest, initializationFingerprint(stagedManifest));
    store = openStore({path: databasePath, mode: 'create'});
    closeStore(store);
    store = null;
    for (const path of [
      databasePath,
      `${databasePath}-wal`,
      `${databasePath}-shm`,
      `${databasePath}-journal`,
    ]) {
      if (existsSync(path)) ownedFiles.set(path, initializationFingerprint(path));
    }
    if (!existsSync(readmePath)) {
      writeFileSync(readmePath, README_CONTENT, {flag: 'wx'});
      ownedFiles.set(readmePath, initializationFingerprint(readmePath));
    } else if (!lstatSync(readmePath).isFile() || pathHasLink(selected.projectRoot, readmePath)
      || !exactPath(readmePath)) {
      throw Object.assign(new Error('docs/kai/README.md must be an exact unlinked file'), {code: 'INVALID_INPUT'});
    }
    const activation = schema5WorkspaceValidation(root, manifest, {
      env,
      requireActivated: true,
    });
    if (activation.errors.length) {
      throw Object.assign(new Error(activation.errors.join('; ')), {code: 'INVALID_INPUT'});
    }
    renameSync(stagedManifest, manifestPath);
    ownedFiles.delete(stagedManifest);
    activated = true;
    result = {
      ok: true,
      root,
      manifestPath,
      databasePath,
      readmePath,
    };
  } catch (error) {
    closeStore(store);
    for (const [path, fingerprint] of ownedFiles) {
      const cleanup = removeOwnedInitializationFile(path, fingerprint);
      if (!cleanup.ok) {
        cleanupFailures.push({
          path: relative(root, path).split(sep).join('/'),
          owned: cleanup.owned,
          cleanup_error: {code: cleanup.code, reason: cleanup.reason},
        });
      }
    }
    for (const path of [...createdDirectories].reverse()) {
      try { rmdirSync(path); } catch { /* preserve pre-existing or non-empty directories */ }
    }
    result = {
      ok: false,
      code: error.code ?? 'INVALID_INPUT',
      reason: error.message,
    };
  } finally {
    claimCleanup = removeOwnedInitializationFile(claimPath, claimFingerprint);
    if (!claimCleanup.ok) {
      cleanupFailures.push({
        path: '.kai/.initialize.json',
        owned: claimCleanup.owned,
        cleanup_error: {code: claimCleanup.code, reason: claimCleanup.reason},
      });
    }
    if (!activated && createdPrivateRoot) {
      try { rmdirSync(privateRoot); } catch { /* preserve a winner's or external state */ }
    }
  }
  if (cleanupFailures.length > 0) {
    return {
      ok: false,
      code: 'RECOVERY_REQUIRED',
      reason: activated
        ? 'workspace activated but initialization cleanup requires explicit recovery'
        : 'workspace initialization failed and cleanup requires explicit recovery',
      activated,
      ...(activated ? {
        root: result.root,
        manifestPath: result.manifestPath,
        databasePath: result.databasePath,
        readmePath: result.readmePath,
      } : {}),
      recovery: {
        claim: claimCleanup.ok ? null : {
          path: '.kai/.initialize.json',
          owned: claimCleanup.owned,
          stale: true,
          cleanup_error: {code: claimCleanup.code, reason: claimCleanup.reason},
        },
        cleanup: cleanupFailures,
        original_failure: result.ok ? null : {
          code: result.code,
          reason: result.reason,
        },
      },
    };
  }
  return result;
}

// --- validation ------------------------------------------------------------
export function checkWorkspace(root, options = {}) {
  const rootProblem = nativeAbsolutePathProblem(root, {
    label: 'workspace root',
    requireExisting: true,
    requireCanonical: true,
  });
  if (rootProblem) return {errors: [rootProblem], warnings: [], migrations: []};
  root = resolve(root);
  const errors = [];
  const warnings = [];
  const migrations = [];
  const err = (m) => errors.push(m);
  const warn = (m) => warnings.push(m);
  const intent = options.intent ?? 'inspect';
  if (!['inspect', 'coordinate'].includes(intent)) {
    return {errors: ['workspace intent must be inspect or coordinate'], warnings, migrations};
  }

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
  if (m.schema_version === CURRENT_SCHEMA_VERSION) {
    const checked = schema5WorkspaceValidation(root, m, {
      env: options.env ?? process.env,
      allowUnregisteredExternal: options.allowUnregisteredExternal ?? false,
      requireActivated: true,
    });
    return {
      errors: checked.errors,
      warnings: checked.warnings,
      migrations,
    };
  }
  if (m.schema_version === 4) {
    const inspection = inspectRuntime(root, {env: options.env ?? process.env, intent});
    if (intent === 'coordinate' && inspection.migrations.length) {
      inspection.errors.push('pending migration recovery prevents coordinated writes');
    }
    inspection.migrations.push('schema 4 is inspect-only; run migration-plan, authorize migrate-v5, then execute the confirmed offline migration');
    if (intent === 'coordinate') {
      inspection.errors.push('schema 4 coordinated writes are refused; explicitly migrate to schema 5 first');
    }
    return {errors: inspection.errors, warnings: inspection.warnings, migrations: inspection.migrations};
  }
  if (m.schema_version === 3) {
    migrations.push('schema 3 is inspect-only; first run its explicit historical schema-4 migration, then classify schema 4 for schema 5');
    if (intent === 'coordinate') {
      err('schema 3 coordinated writes are refused; migrate explicitly to schema 4 before requesting schema-5 classification');
    }
  }

  for (const k of LEGACY_REQUIRED_MANIFEST_KEYS) {
    if (!(k in m)) {
      if (k === 'schema_version') continue; // handled by migration logic below
      if (Number.isInteger(m.schema_version) && m.schema_version < LEGACY_LAYOUT_VERSION) continue;
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
  if (Number.isInteger(m.schema_version) && m.schema_version >= LEGACY_LAYOUT_VERSION && !Array.isArray(m.areas)) {
    err('.kai/manifest.json "areas" must be an array');
  } else if (Array.isArray(m.areas)) {
    const a = new Set(m.areas);
    if (a.size !== m.areas.length) err('.kai/manifest.json "areas" must not contain duplicates');
    for (const x of a) if (!CANONICAL_AREAS.has(x)) err(`.kai/manifest.json declares unknown run area "${x}"`);
    for (const x of CANONICAL_AREAS) if (!a.has(x)) err(`.kai/manifest.json is missing run area "${x}"`);
  }

  const sv = m.schema_version;
  if (sv === undefined || sv === 0) {
    migrations.push(`schema_version absent → migrate explicitly to ${CURRENT_SCHEMA_VERSION}.`);
    err(`workspace schema is pre-versioned; migration to schema_version ${CURRENT_SCHEMA_VERSION} required before claiming work.`);
  } else if (!Number.isInteger(sv)) {
    err(`.kai/manifest.json "schema_version" must be an integer (found ${JSON.stringify(sv)}).`);
  } else if (sv < LEGACY_LAYOUT_VERSION) {
    migrations.push(`apply explicit migration to schema ${CURRENT_SCHEMA_VERSION} (see kai-core-workspace-onboarding ladder).`);
    err(`workspace schema_version ${sv} is behind the current contract ${CURRENT_SCHEMA_VERSION}; migration required before claiming work.`);
  } else if (sv > CURRENT_SCHEMA_VERSION) {
    err(`workspace schema_version ${sv} is newer than this plugin's contract ${CURRENT_SCHEMA_VERSION}; update kai-core before claiming work.`);
  }

  if (Number.isInteger(sv) && sv >= LEGACY_LAYOUT_VERSION) {
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
    if (Number.isInteger(sv) && sv >= LEGACY_LAYOUT_VERSION && m[key] !== DEFAULT_ROOTS[key]) {
      err(`.kai/manifest.json "${key}" must be exactly "${DEFAULT_ROOTS[key]}" (found ${JSON.stringify(m[key])}); the layout is a contract constant, not a per-workspace setting.`);
    }
  }

  const projectIds = new Set();
  const projectPublicationRoots = new Map();
  const projectRoots = new Map();
  if (!Array.isArray(m.projects) || m.projects.length === 0) {
    if (Number.isInteger(sv) && sv >= LEGACY_LAYOUT_VERSION) {
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

  if (Number.isInteger(sv) && sv >= LEGACY_LAYOUT_VERSION) {
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
          err(`${rel}: lease held by ${lz.holder} but has no token (a held lease must carry a unique grant token — see kai-core-work-granting "Claiming work safely")`);
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

export const migrationExitCode = (status) => (status === 'clear' ? 0 : status === 'blocked' ? 2 : 3);
const terminalText = (value) => String(value)
  .replace(/[\x00-\x1f\x7f-\x9f\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, '?');
const jsonText = (value) => JSON.stringify(value, null, 2)
  .replace(/[\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, (character) => (
    `\\u${character.charCodeAt(0).toString(16).padStart(4, '0')}`
  ));

export function migrationInventory(report) {
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

export function writeRegistry(entries, env = process.env) {
  return withRegistryLock(env, () => ({ ok: true, path: writeRegistryUnlocked(entries, env) }));
}

function sleepSync(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}

export function adoptWorkspace({ root, projectRoot, env = process.env }) {
  const rootProblem = nativeAbsolutePathProblem(root, {
    label: 'external workspace root',
    requireExisting: true,
    requireCanonical: true,
  });
  const projectProblem = nativeAbsolutePathProblem(projectRoot, {
    label: 'external project root',
    requireExisting: true,
    requireCanonical: true,
  });
  if (rootProblem || projectProblem) return {ok: false, reason: rootProblem ?? projectProblem};
  root = resolve(root);
  projectRoot = resolve(projectRoot);
  const checked = checkWorkspace(root, { allowUnregisteredExternal: true });
  if (checked.errors.length) {
    return { ok: false, reason: `workspace is invalid: ${checked.errors[0]}` };
  }
  const manifest = readWorkspaceManifest(root).manifest;
  const placement = manifest.schema_version === CURRENT_SCHEMA_VERSION
    ? manifest.placement
    : manifest.storage_mode;
  if (placement !== 'external') {
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
  const projectProblem = nativeAbsolutePathProblem(projectRoot, {
    label: 'external project root',
    requireExisting: false,
    requireCanonical: true,
  });
  if (projectProblem) return {ok: false, reason: projectProblem};
  projectRoot = resolve(projectRoot);
  const projectKey = process.platform === 'win32' ? projectRoot.toLowerCase() : projectRoot;
  return withRegistryLock(env, () => {
    const registry = loadWorkspaceRegistryForCleanup(env);
    if (!registry.ok) return registry;
    const retained = registry.entries.filter(
      (entry) => (process.platform === 'win32'
        ? resolve(entry.project_root).toLowerCase()
        : resolve(entry.project_root)) !== projectKey,
    );
    if (retained.length === registry.entries.length) {
      return { ok: false, reason: `project "${projectRoot}" is not registered` };
    }
    return { ok: true, path: writeRegistryUnlocked(retained, env) };
  });
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
  if (argv.includes('--migration-check')) {
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
  } else if (argv.includes('--initialize')) {
    const root = value('--root');
    if (!root || !argv.includes('--confirm')) {
      console.error('--initialize requires --root <workspace> and --confirm');
      process.exit(1);
    }
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(0, 'utf8'));
    } catch (error) {
      console.error(`workspace initialization failed: stdin must contain one manifest JSON object (${error.message})`);
      process.exit(1);
    }
    const result = initializeWorkspace({
      root,
      manifest,
      env: process.env,
      confirm: true,
    });
    if (!result.ok) {
      console.error(`workspace initialization failed: ${result.code}: ${result.reason}`);
      process.exit(1);
    }
    console.log(`workspace initialized at ${result.root}`);
    process.exit(0);
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
