import {createHmac, randomUUID, timingSafeEqual} from 'node:crypto';
import {
  closeSync,
  chmodSync,
  constants,
  copyFileSync,
  existsSync,
  fsyncSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  statSync,
  unlinkSync,
  writeFileSync,
} from 'node:fs';
import {DatabaseSync} from 'node:sqlite';
import {
  basename,
  dirname,
  isAbsolute,
  join,
  resolve,
  sep,
} from 'node:path';
import {
  HIERARCHY_KINDS,
  canonicalJson,
  validateHierarchyRelationships,
  validateRecord,
} from './contract.mjs';
import {PACKS} from './contract-primitives.mjs';
import {
  closeStore,
  openStore,
  readRecord,
} from './store.mjs';
import {
  exactFile,
  fail,
  fileFingerprint,
  hash,
  logicalStoreDigest,
  migrationManifest,
  nativeWriterTokenPrefix,
  safePath,
  schema5MigrationLockPath,
} from './migration-files.mjs';
import {
  COORDINATION_DATABASE,
  DIRECTION_PATH,
  PRIVATE_ROOT,
  WORKSPACE_SCHEMA_VERSION,
} from '../workspace-layout.mjs';
import {
  loadWorkspaceRegistry,
  readWorkspaceManifest,
  registryPath,
  resolveConfiguredProject,
  validateSchema5Manifest,
} from '../workspace-resolve.mjs';
import {
  ACTIVE_ARTIFACT_LIFECYCLES,
  badPath,
  canonicalPath,
  exactPath,
  escapesRoot,
  normalized,
  pathHasLink,
} from '../workspace-path-safety.mjs';
import {
  inspectGitPrivacy,
  workspaceGit,
} from '../workspace-git-privacy.mjs';
import {readDirection} from '../direction.mjs';
import {
  hierarchyContext,
  hierarchyStatus,
} from './hierarchy-view.mjs';
import {legacyClassificationSources} from './migration-legacy.mjs';

const WORKSHEET_KEYS = [
  'schema_version',
  'source_workspace_schema',
  'source_manifest_digest',
  'source_store_digest',
  'backup_inventory',
  'backup_inventory_digest',
  'direction_ref',
  'placement',
  'backup_root',
  'epics',
  'milestones',
  'items',
  'authored_files',
  'retained_publications',
  'active_work',
  'untracking',
];
const LEGACY_DATABASE = '.kai/state/coordination.sqlite';
const HOST_RUNTIME = '.kai/core/runtime/host/';
const FORBIDDEN_SCHEMA5_ROOTS = [
  '.kai/state',
  '.kai/runs',
  '.kai/review',
  '.kai/archive',
  '.kai/personal',
  '.kai/areas',
  '.kai/shared',
];
const NONTERMINAL_TASK_STATES = new Set([
  'proposed',
  'ready',
  'in-progress',
  'in-review',
  'release-ready',
  'deploying',
  'production-verification',
  'blocked',
]);
const QUIESCENCE_TARGET_STATES = new Set([
  'ready',
  'in-progress',
  'in-review',
  'release-ready',
  'deploying',
  'production-verification',
]);
const TERMINAL_SOURCE_STATES = new Set([
  'completed',
  'shipped',
  'archived',
  'dropped',
]);
const SOURCE_TABLE_ORDER = new Map([
  ['metadata', 'key'],
  ['records', 'kind,id'],
  ['events', 'seq'],
  ['operations', 'id'],
  ['legacy_sources', 'source_id'],
]);
const PROVENANCE_TABLES = [
  'migration_id_map',
  'migration_sources',
  'migration_legacy_metadata',
  'migration_legacy_records',
  'migration_legacy_events',
  'migration_legacy_operations',
  'migration_legacy_extra',
];
const MIGRATION_STATE_KEYS = new Set([
  'schema_version',
  'id',
  'phase',
  'worksheet',
  'worksheet_digest',
  'candidate_manifest',
  'ready_digest',
  'authorization',
  'receipt',
  'installed_targets',
  'database_installed',
]);

const quoteIdentifier = value => `"${value.replaceAll('"', '""')}"`;
const slash = value => value.split(sep).join('/');
const jsonClone = value => JSON.parse(canonicalJson(value));
const exactKeys = (value, keys, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)
    || canonicalJson(Object.keys(value).sort()) !== canonicalJson([...keys].sort())) {
    fail('INVALID_INPUT', `${label} must contain exactly ${[...keys].join(', ')}`);
  }
};
const requiredText = (value, label) => {
  if (typeof value !== 'string' || !value.trim()) fail('INVALID_INPUT', `${label} is required`);
};
const digest = value => hash(typeof value === 'string' || Buffer.isBuffer(value)
  ? value
  : canonicalJson(value));
const sourceKey = source => `${source.kind}\0${source.map_id ?? source.id}`;

function confirmMigration(confirm) {
  if (confirm !== true) {
    fail('AUTHORITY_REQUIRED', 'confirm:true must explicitly acknowledge offline schema-5 migration');
  }
}

function nativeAbsolute(value, label) {
  if (typeof value !== 'string' || !value.trim() || !isAbsolute(value)
    || /^(\\\\|\/\/)/.test(value)) {
    fail('INVALID_INPUT', `${label} must be an absolute local path`);
  }
  const kind = /^[A-Za-z]:[\\/]/.test(value) ? 'windows'
    : value.startsWith('/') ? 'posix'
      : null;
  if (!kind || (process.platform === 'win32' ? kind !== 'windows' : kind !== 'posix')) {
    fail('INVALID_INPUT', `${label} must use the native absolute path form`);
  }
  return resolve(value);
}

function fsyncDirectory(path) {
  let fd;
  try {
    fd = openSync(path, 'r');
    fsyncSync(fd);
  } catch (error) {
    if (!new Set(['EINVAL', 'EPERM', 'EACCES', 'EBADF']).has(error?.code)) throw error;
  } finally {
    if (fd !== undefined) closeSync(fd);
  }
}

function durableWrite(path, bytes, {exclusive = false} = {}) {
  mkdirSync(dirname(path), {recursive: true});
  const fd = openSync(path, exclusive ? 'wx' : 'w', 0o600);
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  fsyncDirectory(dirname(path));
}

function durableCopy(source, target) {
  mkdirSync(dirname(target), {recursive: true});
  const mode = lstatSync(source).mode & 0o777;
  copyFileSync(source, target, constants.COPYFILE_EXCL);
  chmodSync(target, 0o600);
  const fd = openSync(target, 'r+');
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  chmodSync(target, mode);
  fsyncDirectory(dirname(target));
}

function fingerprintAbsolute(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1) {
    fail('RECOVERY_REQUIRED', `migration source is not an exact unshared file: ${path}`);
  }
  const before = statSync(path);
  const bytes = readFileSync(path);
  const after = statSync(path);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs
    || bytes.length !== after.size) {
    fail('RECOVERY_REQUIRED', `migration source changed while reading: ${path}`);
  }
  return {digest: hash(bytes), size: bytes.length};
}

function walkFiles(root, relativeRoot = '') {
  const absoluteRoot = relativeRoot
    ? join(root, ...relativeRoot.split('/'))
    : root;
  if (!existsSync(absoluteRoot)) return [];
  if (pathHasLink(root, absoluteRoot)) {
    fail('INVALID_INPUT', `migration tree traverses a link: ${relativeRoot || root}`);
  }
  const files = [];
  function walk(absolute, relativePath) {
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) {
      fail('INVALID_INPUT', `migration tree contains a symbolic link: ${relativePath}`);
    }
    if (stat.isDirectory()) {
      for (const entry of readdirSync(absolute).sort()) {
        walk(join(absolute, entry), relativePath ? `${relativePath}/${entry}` : entry);
      }
      return;
    }
    if (!stat.isFile() || stat.nlink !== 1) {
      fail('RECOVERY_REQUIRED', `migration tree contains a nonregular or shared file: ${relativePath}`);
    }
    const fingerprint = fingerprintAbsolute(absolute);
    files.push({path: relativePath, ...fingerprint});
  }
  walk(absoluteRoot, relativeRoot);
  return files;
}

function assertNoDatabaseSidecars(root) {
  for (const suffix of ['-wal', '-shm', '-journal']) {
    const path = safePath(root, `${LEGACY_DATABASE}${suffix}`);
    if (existsSync(path)) {
      fail(
        'RECOVERY_REQUIRED',
        `schema-4 database has live or unreconciled SQLite sidecar ${basename(path)}; reconcile it offline first`,
      );
    }
  }
}

function databaseSnapshot(path) {
  const database = new DatabaseSync(path, {readOnly: true});
  try {
    database.exec('PRAGMA query_only=ON');
    const integrity = database.prepare('PRAGMA quick_check').get();
    if (integrity?.quick_check !== 'ok') {
      fail('RECOVERY_REQUIRED', 'schema-4 coordination database integrity check failed');
    }
    const schemaVersion = database.prepare(
      "SELECT value FROM metadata WHERE key='schema_version'",
    ).get()?.value;
    if (!['1', '2'].includes(schemaVersion)) {
      fail('SCHEMA_MISMATCH', `schema-4 store schema ${JSON.stringify(schemaVersion)} is unsupported`);
    }
    const tableNames = database.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all().map(row => row.name);
    const tables = {};
    for (const table of tableNames) {
      if (!/^[a-z][a-z0-9_]*$/i.test(table)) {
        fail('RECOVERY_REQUIRED', `schema-4 store has unsupported table name ${JSON.stringify(table)}`);
      }
      const order = SOURCE_TABLE_ORDER.get(table) ?? 'rowid';
      tables[table] = database.prepare(
        `SELECT * FROM ${quoteIdentifier(table)} ORDER BY ${order}`,
      ).all();
    }
    for (const required of ['metadata', 'records', 'events', 'operations']) {
      if (!Object.hasOwn(tables, required)) {
        fail('RECOVERY_REQUIRED', `schema-4 store is missing table ${required}`);
      }
    }
    const snapshot = {
      store_schema_version: Number(schemaVersion),
      tables,
    };
    return {
      path,
      snapshot,
      digest: digest(snapshot),
      file: fingerprintAbsolute(path),
    };
  } finally {
    database.close();
  }
}

function sourceDatabaseSnapshot(root) {
  assertNoDatabaseSidecars(root);
  const path = safePath(root, LEGACY_DATABASE);
  if (!existsSync(path)) {
    fail('SCHEMA_MISMATCH', `schema-4 coordination database is missing at ${LEGACY_DATABASE}`);
  }
  exactFile(root, LEGACY_DATABASE);
  return databaseSnapshot(path);
}

function legacyRecord(row) {
  let body;
  try {
    body = JSON.parse(row.body);
  } catch {
    fail('RECOVERY_REQUIRED', `schema-4 record ${row.kind}/${row.id} contains invalid JSON`);
  }
  const subjectKind = Object.hasOwn(row, 'subject_kind')
    ? row.subject_kind
    : row.item_id == null ? null : 'item';
  const subjectId = Object.hasOwn(row, 'subject_id') ? row.subject_id : row.item_id;
  return {
    kind: row.kind,
    id: row.id,
    subject: subjectKind == null ? null : {kind: subjectKind, id: subjectId},
    version: Number(row.version),
    body,
  };
}

function sourceDescriptor(record) {
  const lifecycle = record.kind === 'initiative'
    ? record.body.status
    : record.body.state;
  const body = jsonClone(record.body);
  if (body.lease?.token) {
    body.lease = {
      holder: body.lease.holder,
      token_digest: digest(body.lease.token),
      version_at_grant: body.lease.version_at_grant,
      acquired_at: body.lease.acquired_at,
      expires_at: body.lease.expires_at,
    };
  }
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    lifecycle,
    updated_at: record.body.updated_at ?? null,
    digest: digest(record),
    body,
  };
}

function milestoneDescriptor(initiative, milestone) {
  const source = {
    kind: 'milestone',
    id: milestone.id,
    map_id: `${initiative.id}/${milestone.id}`,
    version: 1,
    initiative_id: initiative.id,
    lifecycle: milestone.status,
    updated_at: initiative.body.updated_at,
    body: milestone,
  };
  return {...source, digest: digest(source)};
}

function ownerHint(path) {
  const segment = path.split('/')[1] ?? null;
  if (PACKS.has(segment)) return segment;
  if (new Set(['state', 'runs', 'review', 'archive']).has(segment)) return 'core';
  return null;
}

function authoredCategory(path) {
  if (/^\.kai\/state\/(?:items|threads|initiatives)\//.test(path)) {
    return 'coordination-source';
  }
  if (/^\.kai\/(?:runs|review|archive)\//.test(path)) return 'runtime-history';
  return 'authored';
}

function authoredFilesFromInventory(privateFiles) {
  return privateFiles
    .filter(entry => entry.path !== '.kai/manifest.json'
      && entry.path !== LEGACY_DATABASE
      && !entry.path.startsWith(HOST_RUNTIME)
      && !new RegExp(`^${LEGACY_DATABASE.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-(?:wal|shm|journal)$`).test(entry.path))
    .map(({type, ...entry}) => ({
      ...entry,
      category: authoredCategory(entry.path),
      owner_hint: ownerHint(entry.path),
      classification: null,
    }));
}

function configuredProjects(root, manifest) {
  if (!Array.isArray(manifest.projects) || manifest.projects.length === 0) {
    fail('INVALID_INPUT', 'schema-4 manifest requires project bindings');
  }
  return manifest.projects.map(project => resolveConfiguredProject({
    workspaceRoot: root,
    manifest,
    projectId: project.id,
  }));
}

function retainedPublications(root, manifest) {
  const rows = new Map();
  for (const project of configuredProjects(root, manifest)) {
    for (const publicationRoot of new Set([project.publicationRoot, 'docs/kai'])) {
      for (const entry of walkFiles(project.projectRoot, publicationRoot)) {
        rows.set(`${project.project.id}\0${entry.path}`, {
          project_id: project.project.id,
          path: entry.path,
          digest: entry.digest,
          size: entry.size,
          classification: null,
        });
      }
    }
  }
  return [...rows.values()].sort((left, right) =>
    left.project_id.localeCompare(right.project_id)
    || left.path.localeCompare(right.path));
}

function backupInventory(root, manifest, env) {
  const privateFiles = snapshotPrivate(root)
    .map(entry => ({...entry, type: 'file'}));
  const publicFiles = retainedPublications(root, manifest)
    .map(({classification, ...entry}) => ({...entry, type: 'file'}));
  const registry = existsSync(registryPath(env))
    ? {
        path: registryPath(env),
        ...fingerprintAbsolute(registryPath(env)),
        type: 'file',
      }
    : null;
  return {
    schema_version: 1,
    private_files: privateFiles,
    public_files: publicFiles,
    registry,
    git_tracking: trackedPrivateFiles(root, manifest),
  };
}

function commandQuote(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}

function trackedPrivateFiles(root, manifest) {
  if (manifest.storage_mode === 'external') return [];
  const project = configuredProjects(root, manifest).find(entry =>
    normalized(entry.projectRoot) === normalized(root));
  if (!project) return [];
  const result = workspaceGit(project.projectRoot, ['ls-files', '-z', '--', '.kai']);
  if (result.status !== 0) {
    fail('RECOVERY_REQUIRED', `cannot inspect tracked private files: ${result.stderr.trim()}`);
  }
  return result.stdout.split('\0').filter(Boolean).sort().map(path => ({
    path: slash(path),
    command: `git -C ${commandQuote(project.projectRoot)} rm --cached -- ${commandQuote(slash(path))}`,
  }));
}

function activeWork(records) {
  const rows = [];
  for (const record of records) {
    let reasons = [];
    if (new Set(['item', 'task']).has(record.kind)) {
      if (record.body.lease !== null) reasons.push('active lease');
      if (NONTERMINAL_TASK_STATES.has(record.body.state)) {
        reasons.push(`nonterminal state ${record.body.state}`);
      }
      if (record.body.recovery_hold !== null) reasons.push('active recovery hold');
      if (record.body.waiting_on_questions?.length) reasons.push('unresolved blocking questions');
      if (record.body.producer_actor !== null && !new Set(['completed', 'shipped', 'dropped']).has(record.body.state)) {
        reasons.push('active producer');
      }
    } else if (record.kind === 'grant') {
      if (record.body.status === 'active') reasons.push('active grant');
    } else if (record.kind === 'question') {
      if (record.body.status === 'open') {
        const subject = record.body.subject ?? record.subject;
        reasons.push(
          `open ${record.body.blocking === true ? 'blocking' : 'nonblocking'} question on `
          + `${subject?.kind ?? 'unknown'}/${subject?.id ?? 'unknown'}`,
        );
      }
    } else if (record.kind === 'host-attempt') {
      if (!new Set(['completed', 'failed']).has(record.body.status)) reasons.push(`host attempt ${record.body.status}`);
    } else if (record.kind === 'effect') {
      if (!new Set(['succeeded', 'not-applied']).has(record.body.outcome)) reasons.push(`effect ${record.body.outcome}`);
    }
    reasons = [...new Set(reasons)].sort();
    if (reasons.length) {
      rows.push({
        source: {
          kind: record.kind,
          id: record.id,
          version: record.version,
        },
        reasons,
        resolution: null,
      });
    }
  }
  return rows.sort((left, right) =>
    left.source.kind.localeCompare(right.source.kind)
    || left.source.id.localeCompare(right.source.id));
}

function directionForManifest(root, manifest) {
  const selected = manifest.projects.length === 1
    ? manifest.projects[0]
    : manifest.projects.find(project => project?.id === 'default');
  if (!selected) {
    fail('INVALID_INPUT', 'schema-4 migration requires one project or an explicit default project for Direction');
  }
  const direction = readDirection({
    workspaceRoot: root,
    manifest: {
      projects: [{
        ...selected,
        publication_root: 'docs/kai',
      }],
    },
  });
  return {
    path: direction.path,
    hash: direction.hash,
    goal: direction.goal,
  };
}

function manifestBytes(root) {
  return exactFile(root, '.kai/manifest.json');
}

function worksheetFromSource({
  manifestDigest,
  store,
  directionRef,
  inventory,
}) {
  const records = store.snapshot.tables.records.map(legacyRecord);
  const initiatives = records
    .filter(record => record.kind === 'initiative')
    .sort((left, right) => left.id.localeCompare(right.id));
  const typedEpics = records
    .filter(record => record.kind === 'epic')
    .sort((left, right) => left.id.localeCompare(right.id));
  const typedMilestones = records
    .filter(record => new Set(['feature', 'requirement']).has(record.kind))
    .sort((left, right) =>
      left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
  const items = records
    .filter(record => new Set(['item', 'task']).has(record.kind))
    .sort((left, right) => left.id.localeCompare(right.id));
  const existing = new Set(records.map(record => `${record.kind}\0${record.id}`));
  const supplemental = legacyClassificationSources(
    store.snapshot.tables.legacy_sources ?? [],
    existing,
  );
  const epics = [
    ...initiatives.map(record => sourceDescriptor(record)),
    ...typedEpics.map(record => sourceDescriptor(record)),
    ...supplemental.filter(source => source.kind === 'initiative'),
  ].sort((left, right) => left.id.localeCompare(right.id)).map(source => ({
    source,
    classification: null,
  }));
  const milestones = [
    ...initiatives.flatMap(initiative =>
      initiative.body.milestones.map(milestone => milestoneDescriptor(initiative, milestone))),
    ...typedMilestones.map(record => sourceDescriptor(record)),
  ].map(source => ({source, classification: null}))
    .sort((left, right) =>
      left.source.id.localeCompare(right.source.id)
      || (left.source.initiative_id ?? '').localeCompare(
        right.source.initiative_id ?? '',
      ));
  const inventoryDigest = digest(inventory);
  return {
    schema_version: 1,
    source_workspace_schema: 4,
    source_manifest_digest: manifestDigest,
    source_store_digest: store.digest,
    backup_inventory: inventory,
    backup_inventory_digest: inventoryDigest,
    direction_ref: directionRef,
    placement: {target: null, project_binding: null},
    backup_root: null,
    epics,
    milestones,
    items: [
      ...items.map(record => sourceDescriptor(record)),
      ...supplemental.filter(source => source.kind === 'item'),
    ].sort((left, right) => left.id.localeCompare(right.id)).map(source => ({
      source,
      classification: null,
    })),
    authored_files: authoredFilesFromInventory(inventory.private_files),
    retained_publications: inventory.public_files.map(({type, ...entry}) => ({
      ...entry,
      classification: null,
    })),
    active_work: activeWork(records),
    untracking: jsonClone(inventory.git_tracking),
  };
}

export function buildMigrationWorksheet({root, env = process.env} = {}) {
  const manifest = migrationManifest(root, [4], env);
  const store = sourceDatabaseSnapshot(root);
  const inventory = backupInventory(root, manifest, env);
  assertNoDatabaseSidecars(root);
  const manifestEntry = inventory.private_files.find(entry =>
    entry.path === '.kai/manifest.json');
  const databaseEntry = inventory.private_files.find(entry =>
    entry.path === LEGACY_DATABASE);
  if (manifestEntry?.digest !== hash(manifestBytes(root))
    || databaseEntry?.digest !== store.file.digest
    || databaseEntry?.size !== store.file.size) {
    fail('RECOVERY_REQUIRED', 'schema-4 source changed while building the migration plan');
  }
  return worksheetFromSource({
    manifestDigest: manifestEntry.digest,
    store,
    directionRef: directionForManifest(root, manifest),
    inventory,
  });
}

function resetWorksheet(worksheet) {
  const reset = jsonClone(worksheet);
  reset.placement = {target: null, project_binding: null};
  reset.backup_root = null;
  for (const collection of ['epics', 'milestones', 'items']) {
    for (const entry of reset[collection]) entry.classification = null;
  }
  for (const entry of reset.authored_files) entry.classification = null;
  for (const entry of reset.retained_publications) entry.classification = null;
  for (const entry of reset.active_work) entry.resolution = null;
  return reset;
}

function candidateManifest(root, source, placement) {
  return {
    plugin: 'kai-core',
    version: source.version,
    schema_version: WORKSPACE_SCHEMA_VERSION,
    scaffolded: source.scaffolded,
    workspace_id: source.workspace_id,
    placement: placement.target,
    workspace_root: placement.target === 'external' ? resolve(root) : '.',
    private_root: PRIVATE_ROOT,
    direction: DIRECTION_PATH,
    projects: [{
      id: placement.project_binding.id,
      path: placement.project_binding.path,
      publication_root: placement.project_binding.publication_root,
    }],
  };
}

function validatePlacement(root, sourceManifest, worksheet, env) {
  exactKeys(worksheet.placement, new Set(['target', 'project_binding']), 'worksheet.placement');
  if (!new Set(['repo-local', 'external']).has(worksheet.placement.target)) {
    fail('INVALID_INPUT', 'worksheet placement target must explicitly be repo-local or external');
  }
  const binding = worksheet.placement.project_binding;
  exactKeys(
    binding,
    new Set(['id', 'path', 'publication_root', 'registry_digest']),
    'worksheet.placement.project_binding',
  );
  requiredText(binding.id, 'project binding id');
  requiredText(binding.path, 'project binding path');
  if (binding.publication_root !== 'docs/kai') {
    fail('INVALID_INPUT', 'schema-5 project publication_root must be exactly docs/kai');
  }
  if (worksheet.placement.target === 'repo-local') {
    if (binding.path !== '.' || binding.registry_digest !== null) {
      fail('INVALID_INPUT', 'repo-local placement requires path "." and null registry digest');
    }
  } else {
    nativeAbsolute(binding.path, 'external project binding path');
    requiredText(binding.registry_digest, 'external registry digest');
    const registry = registryPath(env);
    if (!existsSync(registry) || hash(readFileSync(registry)) !== binding.registry_digest) {
      fail('RECOVERY_REQUIRED', 'external workspace registry digest changed; create a fresh worksheet and capability');
    }
    const loaded = loadWorkspaceRegistry(env);
    if (!loaded.ok) fail('INVALID_INPUT', loaded.reason);
  }
  const manifest = candidateManifest(root, sourceManifest, worksheet.placement);
  const validation = validateSchema5Manifest(root, manifest, {env});
  if (validation.errors.length) fail('INVALID_INPUT', validation.errors.join('; '));
  const privacy = inspectGitPrivacy(root, manifest.placement);
  const privacyErrors = [
    ...privacy.errors,
    ...privacy.missing.map(path => `private path is not ignored: ${path}`),
  ];
  if (manifest.placement === 'repo-local' && !privacy.gitRoot) {
    privacyErrors.push('repo-local placement requires a readable Git work tree');
  }
  if (privacyErrors.length) fail('INVALID_INPUT', privacyErrors.join('; '));
  return {
    manifest,
    projects: validation.projects,
    direction: readDirection({workspaceRoot: root, manifest}),
  };
}

function validateBackupRoot(root, projects, value) {
  const backupRoot = nativeAbsolute(value, 'worksheet backup_root');
  if (!existsSync(backupRoot) || !lstatSync(backupRoot).isDirectory()
    || pathHasLink(backupRoot, backupRoot) || !exactPath(backupRoot)) {
    fail('INVALID_INPUT', 'worksheet backup_root must be an existing exact unlinked directory');
  }
  for (const tree of [root, ...projects.map(project => project.projectRoot)]) {
    if (!escapesRoot(tree, backupRoot) || !escapesRoot(backupRoot, tree)) {
      fail('INVALID_INPUT', 'worksheet backup_root must resolve outside workspace and project trees');
    }
  }
  return backupRoot;
}

function knownRole(role, roles) {
  return role === 'operator' || roles.includes(role);
}

function recordRoles(record) {
  const body = record.body;
  const roles = [];
  for (const key of ['owner', 'scope_authority', 'completion_authority', 'next_role', 'validity_owner']) {
    if (typeof body[key] === 'string' && body[key]) roles.push([key, body[key]]);
  }
  for (const actor of [
    body.producer_actor,
    body.acceptance_actor,
    ...(body.producing_actors ?? []),
  ].filter(Boolean)) roles.push(['actor', actor.role]);
  for (const review of body.review_requirements ?? []) roles.push(['review role', review.role]);
  return roles;
}

function validateClassification(entry, collection, records, roles, worksheet) {
  const classification = entry.classification;
  exactKeys(
    classification,
    new Set(['disposition', 'primary', 'records', 'reason']),
    `${collection} ${entry.source.id} classification`,
  );
  requiredText(classification.reason, `${collection} ${entry.source.id} classification reason`);
  if (!new Set(['mapped', 'historical-only', 'direction-only']).has(classification.disposition)) {
    fail('INVALID_INPUT', `${collection} ${entry.source.id} has unsupported disposition`);
  }
  if (classification.disposition !== 'mapped') {
    if (classification.primary !== null || !Array.isArray(classification.records)
      || classification.records.length !== 0) {
      fail('INVALID_INPUT', `${collection} ${entry.source.id} historical/direction disposition cannot create records`);
    }
    if (classification.disposition === 'direction-only' && collection !== 'epics') {
      fail('INVALID_INPUT', 'only an initiative source may be classified as direction-only');
    }
    return null;
  }
  if (entry.source.record_available === false) {
    fail(
      'INVALID_INPUT',
      `${collection} ${entry.source.id} has ambiguous legacy metadata and may only be classified historical-only`,
    );
  }
  exactKeys(classification.primary, new Set(['kind', 'id']), 'classification primary');
  const allowed = collection === 'epics'
    ? new Set(['epic'])
    : collection === 'milestones'
      ? new Set(['epic', 'feature', 'requirement'])
      : new Set(['requirement', 'task']);
  if (!allowed.has(classification.primary.kind)) {
    fail('INVALID_INPUT', `${collection} ${entry.source.id} cannot map to ${classification.primary.kind}`);
  }
  if (!Array.isArray(classification.records) || classification.records.length === 0) {
    fail('INVALID_INPUT', `${collection} ${entry.source.id} mapped classification requires records`);
  }
  let primary = null;
  for (const raw of classification.records) {
    const record = validateRecord(jsonClone(raw));
    if (!HIERARCHY_KINDS.has(record.kind)) {
      fail('INVALID_INPUT', 'migration classification may create only hierarchy records');
    }
    const key = `${record.kind}\0${record.id}`;
    if (records.has(key)) fail('INVALID_INPUT', `duplicate migration target ${record.kind}/${record.id}`);
    records.set(key, record);
    if (record.kind === classification.primary.kind && record.id === classification.primary.id) {
      primary = record;
    }
    for (const [label, role] of recordRoles(record)) {
      if (!knownRole(role, roles)) {
        fail('ROLE_UNAVAILABLE', `${record.kind}/${record.id} ${label} role is unavailable: ${role}`);
      }
    }
    if (record.kind === 'epic'
      && canonicalJson(record.body.direction_ref) !== canonicalJson(worksheet.direction_ref)) {
      fail('INVALID_INPUT', `epic/${record.id} has stale Direction binding`);
    }
    if (record.kind === 'task' && record.body.acceptance_actor !== null) {
      fail('INVALID_INPUT', 'historical schema-4 acceptance cannot become current Task acceptance');
    }
  }
  if (!primary) fail('INVALID_INPUT', `${collection} ${entry.source.id} primary target is absent`);
  if (primary.version !== entry.source.version) {
    fail('INVALID_INPUT', `${collection} ${entry.source.id} primary target must preserve source version`);
  }
  if (entry.source.updated_at !== null
    && primary.body.updated_at !== entry.source.updated_at) {
    fail('INVALID_INPUT', `${collection} ${entry.source.id} primary target must preserve source updated_at`);
  }
  if (TERMINAL_SOURCE_STATES.has(entry.source.lifecycle)
    && primary.body.state !== 'proposed') {
    fail(
      'INVALID_INPUT',
      `${collection} ${entry.source.id} historical terminal state cannot become current acceptance; map a proposed counterpart or keep it historical-only`,
    );
  }
  return primary;
}

function validateAuthoredFiles(worksheet) {
  const targets = new Set();
  const sourcePaths = new Set(worksheet.authored_files.map(entry => entry.path));
  for (const entry of worksheet.authored_files) {
    const classification = entry.classification;
    exactKeys(
      classification,
      new Set(['action', 'pack', 'target', 'ownership_basis']),
      `authored file ${entry.path} classification`,
    );
    if (!new Set(['migrate', 'provenance-only']).has(classification.action)) {
      fail('INVALID_INPUT', `authored file ${entry.path} needs migrate or provenance-only action`);
    }
    if (!PACKS.has(classification.pack)) {
      fail('INVALID_INPUT', `authored file ${entry.path} has unknown or incubated pack ownership`);
    }
    requiredText(classification.ownership_basis, `authored file ${entry.path} ownership basis`);
    if (classification.action === 'provenance-only') {
      if (classification.target !== null) {
        fail('INVALID_INPUT', `provenance-only authored file ${entry.path} cannot have a target`);
      }
      continue;
    }
    requiredText(classification.target, `authored file ${entry.path} target`);
    const target = classification.target.replaceAll('\\', '/');
    const segments = target.split('/');
    if (badPath(target) || !target.startsWith(`.kai/${classification.pack}/`)
      || target.startsWith('.kai/core/runtime/')
      || FORBIDDEN_SCHEMA5_ROOTS.some(root => target === root || target.startsWith(`${root}/`))
      || !new Set([6, 7]).has(segments.length)
      || !ACTIVE_ARTIFACT_LIFECYCLES.has(segments.at(-2))) {
      fail('INVALID_INPUT', `authored file ${entry.path} has unsafe or untyped schema-5 target`);
    }
    if (target === entry.path) {
      fail('INVALID_INPUT', `authored file ${entry.path} must move to an explicit schema-5 typed path`);
    }
    if (sourcePaths.has(target)) {
      fail('INVALID_INPUT', `authored file target already belongs to another schema-4 source: ${target}`);
    }
    if (targets.has(target)) fail('INVALID_INPUT', `duplicate authored file target ${target}`);
    targets.add(target);
  }
}

function validateRetainedPublications(worksheet) {
  for (const entry of worksheet.retained_publications) {
    exactKeys(
      entry.classification,
      new Set(['action', 'reason']),
      `retained publication ${entry.path} classification`,
    );
    if (entry.classification.action !== 'retain-in-place') {
      fail('INVALID_INPUT', `accepted publication ${entry.path} must remain in place`);
    }
    requiredText(entry.classification.reason, `retained publication ${entry.path} reason`);
  }
}

function validateActiveWork(worksheet, primaryTargets) {
  for (const entry of worksheet.active_work) {
    if (entry.resolution === null) {
      fail(
        'RECOVERY_REQUIRED',
        `active work ${entry.source.kind}/${entry.source.id} requires explicit reconciliation`,
      );
    }
    exactKeys(
      entry.resolution,
      new Set([
        'status',
        'state',
        'lease',
        'grants',
        'recovery',
        'production',
        'reason',
      ]),
      `active work ${entry.source.kind}/${entry.source.id} resolution`,
    );
    if (entry.resolution.status !== 'reconciled'
      || !new Set(['quiesced', 'terminal', 'none']).has(entry.resolution.state)
      || !new Set(['released', 'expired', 'none']).has(entry.resolution.lease)
      || !new Set(['revoked', 'expired', 'none']).has(entry.resolution.grants)
      || !new Set(['resolved', 'abandoned', 'none']).has(entry.resolution.recovery)
      || !new Set(['completed', 'abandoned', 'none']).has(entry.resolution.production)) {
      fail('RECOVERY_REQUIRED', `active work ${entry.source.kind}/${entry.source.id} is not reconciled`);
    }
    const reasons = entry.reasons.join('\n');
    if (/state|producer|question/i.test(reasons)
      && entry.resolution.state === 'none') {
      fail('RECOVERY_REQUIRED', `active work ${entry.source.kind}/${entry.source.id} state is not quiesced`);
    }
    if (/lease/i.test(reasons) && entry.resolution.lease === 'none') {
      fail('RECOVERY_REQUIRED', `active work ${entry.source.kind}/${entry.source.id} lease is not reconciled`);
    }
    if (/grant/i.test(reasons) && entry.resolution.grants === 'none') {
      fail('RECOVERY_REQUIRED', `active work ${entry.source.kind}/${entry.source.id} grant is not reconciled`);
    }
    if (/recovery/i.test(reasons) && entry.resolution.recovery === 'none') {
      fail('RECOVERY_REQUIRED', `active work ${entry.source.kind}/${entry.source.id} recovery is not reconciled`);
    }
    if (/deploy|production|host attempt|effect/i.test(reasons)
      && entry.resolution.production === 'none') {
      fail('RECOVERY_REQUIRED', `active work ${entry.source.kind}/${entry.source.id} production is not reconciled`);
    }
    requiredText(entry.resolution.reason, 'active work reconciliation reason');
    const primary = primaryTargets.get(sourceKey(entry.source));
    if (new Set(['item', 'task']).has(entry.source.kind) && primary?.kind === 'task') {
      if (primary.body.lease !== null || primary.body.producer_actor !== null
        || primary.body.producing_actors.length
        || primary.body.recovery_hold !== null
        || primary.body.waiting_on_questions.length
        || QUIESCENCE_TARGET_STATES.has(primary.body.state)) {
        fail('RECOVERY_REQUIRED', `active work ${entry.source.id} target retains in-flight state`);
      }
    }
  }
}

function validateTaskDependencies(records) {
  for (const record of records.values()) {
    if (record.kind !== 'task') continue;
    for (const dependency of record.body.depends_on) {
      if (!records.has(`task\0${dependency.task}`)) {
        fail('INVALID_INPUT', `task/${record.id} has unresolved dependency ${dependency.task}`);
      }
    }
  }
}

function validateMappedLegacyDependencies(worksheet, primaryTargets) {
  const items = new Map(
    worksheet.items.map(entry => [`${entry.source.kind}\0${entry.source.id}`, entry]),
  );
  for (const entry of worksheet.items) {
    const target = primaryTargets.get(sourceKey(entry.source));
    if (target?.kind !== 'task' || !Array.isArray(entry.source.body?.depends_on)) continue;
    const expected = entry.source.body.depends_on.map(dependency => {
      const sourceKind = Object.hasOwn(dependency, 'item')
        ? 'item'
        : Object.hasOwn(dependency, 'task')
          ? 'task'
          : null;
      if (sourceKind === null
        || typeof dependency[sourceKind] !== 'string'
        || typeof dependency.requires !== 'string'
        || Object.keys(dependency).some(key =>
          !new Set([sourceKind, 'requires']).has(key))) {
        fail(
          'INVALID_INPUT',
          `${entry.source.kind} ${entry.source.id} has an invalid dependency source form`,
        );
      }
      const sourceId = dependency[sourceKind];
      const sourceDependency = items.get(`${sourceKind}\0${sourceId}`);
      const mapped = sourceDependency
        ? primaryTargets.get(sourceKey(sourceDependency.source))
        : null;
      if (mapped?.kind !== 'task') {
        fail(
          'INVALID_INPUT',
          `${entry.source.kind} ${entry.source.id} dependency ${sourceId} must map to a Task`,
        );
      }
      return {task: mapped.id, requires: dependency.requires};
    });
    if (canonicalJson(target.body.depends_on) !== canonicalJson(expected)) {
      fail('INVALID_INPUT', `task/${target.id} must preserve every schema-4 dependency mapping`);
    }
  }
}

function validateWorksheetAgainstSource({
  root,
  worksheet,
  roles = [],
  env = process.env,
  fresh,
  sourceManifest,
} = {}) {
  exactKeys(worksheet, new Set(WORKSHEET_KEYS), 'migration worksheet');
  if (worksheet.schema_version !== 1 || worksheet.source_workspace_schema !== 4) {
    fail('SCHEMA_MISMATCH', 'migration worksheet must describe schema 4 with worksheet schema 1');
  }
  if (worksheet.backup_inventory?.schema_version !== 1
    || digest(worksheet.backup_inventory) !== worksheet.backup_inventory_digest) {
    fail('RECOVERY_REQUIRED', 'migration worksheet backup inventory binding is invalid');
  }
  if (!Array.isArray(roles) || roles.some(role => typeof role !== 'string')) {
    fail('INVALID_INPUT', 'installed migration roles must be explicit strings');
  }
  if (existsSync(safePath(root, COORDINATION_DATABASE))) {
    fail(
      'RECOVERY_REQUIRED',
      `unexpected schema-5 database already exists at ${COORDINATION_DATABASE}; reconcile it before creating a worksheet`,
    );
  }
  if (canonicalJson(resetWorksheet(worksheet)) !== canonicalJson(fresh)) {
    fail('RECOVERY_REQUIRED', 'schema-4 source, Direction, publications, Git tracking, or store changed; create a fresh worksheet and capability');
  }
  if (fresh.untracking.length) {
    const commands = fresh.untracking.map(entry => entry.command).join('\n');
    fail(
      'RECOVERY_REQUIRED',
      `tracked private files must be untracked by the operator; Kai will not run Git mutations.\n${commands}\nRun migration-plan again and request a fresh worksheet/capability.`,
    );
  }
  const placement = validatePlacement(root, sourceManifest, worksheet, env);
  const sourceProjects = configuredProjects(root, sourceManifest);
  const selectedSourceProjects = sourceProjects.filter(project =>
    project.project.id === placement.projects[0].project.id
    && normalized(project.projectRoot) === normalized(placement.projects[0].projectRoot));
  if (selectedSourceProjects.length !== 1) {
    fail(
      'INVALID_INPUT',
      'schema-5 project binding must explicitly select one existing schema-4 project; relocate first, then create a fresh worksheet',
    );
  }
  const backupRoot = validateBackupRoot(
    root,
    [...sourceProjects, ...placement.projects],
    worksheet.backup_root,
  );
  const currentDirection = {
    path: placement.direction.path,
    hash: placement.direction.hash,
    goal: placement.direction.goal,
  };
  if (canonicalJson(currentDirection) !== canonicalJson(worksheet.direction_ref)) {
    fail('RECOVERY_REQUIRED', 'worksheet Direction binding is stale; create a fresh worksheet and capability');
  }
  const records = new Map();
  const primaryTargets = new Map();
  for (const collection of ['epics', 'milestones', 'items']) {
    for (const entry of worksheet[collection]) {
      if (entry.classification === null) {
        fail('INVALID_INPUT', `${collection} source ${entry.source.id} is unclassified`);
      }
      const primary = validateClassification(entry, collection, records, roles, worksheet);
      primaryTargets.set(sourceKey(entry.source), primary);
    }
  }
  validateHierarchyRelationships([...records.values()]);
  validateTaskDependencies(records);
  validateMappedLegacyDependencies(worksheet, primaryTargets);
  validateAuthoredFiles(worksheet);
  validateRetainedPublications(worksheet);
  validateActiveWork(worksheet, primaryTargets);
  return {
    worksheet: jsonClone(worksheet),
    worksheetDigest: digest(worksheet),
    sourceManifest,
    candidateManifest: placement.manifest,
    direction: placement.direction,
    projects: placement.projects,
    sourceProjects,
    backupRoot,
    records,
    primaryTargets,
  };
}

export function validateMigrationWorksheet({
  root,
  worksheet,
  roles = [],
  env = process.env,
} = {}) {
  const sourceManifest = migrationManifest(root, [4], env);
  return validateWorksheetAgainstSource({
    root,
    worksheet,
    roles,
    env,
    sourceManifest,
    fresh: buildMigrationWorksheet({root, env}),
  });
}

export function v5MigrationLockPath(root) {
  return schema5MigrationLockPath(root);
}

function v5StagePath(root, id) {
  const resolved = canonicalPath(root);
  return join(dirname(resolved), `.${basename(resolved)}.kai-stage-${id}`);
}

function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail('RECOVERY_REQUIRED', `${label} is missing or invalid: ${error.message}`);
  }
}

export function migrationAuthorizationDescriptor(root, capabilityId) {
  if (typeof capabilityId !== 'string'
    || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(capabilityId)) {
    fail('AUTHORITY_REQUIRED', 'migration authorization requires an issued capability UUID');
  }
  const sources = [
    {
      kind: 'request',
      source: `${HOST_RUNTIME}requests/${capabilityId}.json`,
      backup: 'authorization/request.json',
    },
    {
      kind: 'capability',
      source: `${HOST_RUNTIME}capabilities/${capabilityId}.json`,
      backup: 'authorization/capability.json',
    },
    {
      kind: 'issuer-key',
      source: `${HOST_RUNTIME}key`,
      backup: 'authorization/issuer-key',
    },
  ].map(entry => ({
    ...entry,
    ...fileFingerprint(root, entry.source),
    type: 'file',
  }));
  let request;
  let capability;
  try {
    request = JSON.parse(exactFile(root, sources[0].source));
    capability = JSON.parse(exactFile(root, sources[1].source));
  } catch {
    fail('AUTHORITY_REQUIRED', 'migration authorization records are malformed');
  }
  if (!request?.payload || typeof request.mac !== 'string'
    || !capability?.payload || typeof capability.mac !== 'string'
    || capability.payload.request?.nonce !== capabilityId
    || request.payload.nonce !== capabilityId) {
    fail('AUTHORITY_REQUIRED', 'migration authorization records are malformed or mismatched');
  }
  const key = exactFile(root, sources[2].source);
  const signed = envelope => {
    if (!/^[a-f0-9]{64}$/.test(envelope.mac)) return false;
    const expected = createHmac('sha256', key)
      .update(canonicalJson(envelope.payload))
      .digest();
    return timingSafeEqual(expected, Buffer.from(envelope.mac, 'hex'));
  };
  if (key.length !== 32 || !signed(request) || !signed(capability)) {
    fail('AUTHORITY_REQUIRED', 'migration authorization signatures are invalid');
  }
  const payload = {
    schema_version: 1,
    capability_id: capabilityId,
    files: sources,
    request_payload_digest: digest(request.payload),
    capability_payload_digest: digest(capability.payload),
    authorization_receipt_digest: digest(capability.payload.receipt),
    signing: {
      algorithm: 'hmac-sha256',
      key_digest: sources[2].digest,
      request_mac: request.mac,
      capability_mac: capability.mac,
    },
  };
  return {payload, digest: digest(payload)};
}

function lockMigration(root, state) {
  const path = v5MigrationLockPath(root);
  try {
    durableWrite(path, canonicalJson(state), {exclusive: true});
  } catch (error) {
    if (error.code === 'EEXIST') {
      fail('RECOVERY_REQUIRED', 'incomplete or competing schema-5 migration requires explicit recovery');
    }
    throw error;
  }
  return path;
}

function drainNativeWriterTokens(root, {timeoutMs = 30_000} = {}) {
  const canonical = canonicalPath(root);
  const parent = dirname(canonical);
  const prefix = nativeWriterTokenPrefix(root);
  const deadline = Date.now() + timeoutMs;
  const wait = new Int32Array(new SharedArrayBuffer(4));
  while (true) {
    const names = readdirSync(parent)
      .filter(name => name.startsWith(prefix) && name.endsWith('.lock'))
      .sort();
    if (names.length === 0) return;
    for (const name of names) {
      const id = name.slice(prefix.length, -'.lock'.length);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        fail('RECOVERY_REQUIRED', `unrecognized native writer token: ${name}`);
      }
      const path = join(parent, name);
      let stat;
      try {
        stat = lstatSync(path);
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        throw error;
      }
      if (!stat.isFile() || stat.nlink !== 1
        || pathHasLink(parent, path) || !exactPath(path)) {
        fail('RECOVERY_REQUIRED', `native writer token changed type or identity: ${name}`);
      }
      let token;
      try {
        token = JSON.parse(readFileSync(path, 'utf8'));
      } catch (error) {
        if (error.code === 'ENOENT') continue;
        fail('RECOVERY_REQUIRED', `native writer token is malformed: ${name}`);
      }
      if (!token || typeof token !== 'object' || Array.isArray(token)
        || canonicalJson(Object.keys(token).sort()) !== canonicalJson([
          'created_at',
          'id',
          'pid',
          'root',
          'schema_version',
        ])
        || token.schema_version !== 1
        || token.id !== id
        || normalized(token.root) !== normalized(canonical)
        || !Number.isSafeInteger(token.pid)
        || token.pid < 1
        || Number.isNaN(Date.parse(token.created_at))) {
        fail('RECOVERY_REQUIRED', `native writer token binding is invalid: ${name}`);
      }
    }
    if (Date.now() >= deadline) {
      fail('STORE_BUSY', 'native host writers did not drain before rollback');
    }
    Atomics.wait(wait, 0, 0, 10);
  }
}

function readLock(root) {
  const path = v5MigrationLockPath(root);
  if (!existsSync(path)) fail('RECOVERY_REQUIRED', 'no interrupted schema-5 migration lock exists');
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1 || pathHasLink(dirname(path), path)
    || !exactPath(path)) {
    fail('RECOVERY_REQUIRED', 'schema-5 migration lock is linked, shared, or aliased');
  }
  const lock = readJson(path, 'schema-5 migration lock');
  if (lock.schema_version !== 1 || normalized(lock.root) !== normalized(canonicalPath(root))
    || !/^[0-9a-f-]{36}$/i.test(lock.id)
    || typeof lock.backup_path !== 'string'
    || typeof lock.stage_path !== 'string'
    || !/^[a-f0-9]{64}$/.test(lock.worksheet_digest)
    || !/^[a-f0-9]{64}$/.test(lock.backup_inventory_digest)
    || (lock.authorization_digest !== null
      && !/^[a-f0-9]{64}$/.test(lock.authorization_digest))) {
    fail('RECOVERY_REQUIRED', 'schema-5 migration lock is unrecognized');
  }
  if (lock.pid !== process.pid) {
    try {
      process.kill(lock.pid, 0);
      fail('STORE_BUSY', 'schema-5 migration owner process is still active');
    } catch (error) {
      if (error.code !== 'ESRCH') throw error;
    }
  }
  return {path, lock};
}

function writeState(lock, state) {
  durableWrite(join(lock.backup_path, 'state.json'), canonicalJson(state));
}

function readState(lock) {
  return readJson(join(lock.backup_path, 'state.json'), 'schema-5 migration state');
}

function verifyStateBinding(lock, state) {
  if (state.schema_version !== 1 || state.id !== lock.id
    || state.worksheet_digest !== lock.worksheet_digest
    || digest(state.worksheet) !== state.worksheet_digest
    || state.worksheet.backup_inventory_digest !== lock.backup_inventory_digest
    || (state.authorization?.digest ?? null) !== (lock.authorization_digest ?? null)
    || typeof state.ready_digest !== 'string') {
    fail('RECOVERY_REQUIRED', 'schema-5 migration state no longer matches its lock, worksheet, or verified backup');
  }
  const ready = readJson(join(lock.backup_path, 'ready.json'), 'schema-5 migration ready record');
  if (ready.digest !== state.ready_digest
    || digest(ready.payload) !== ready.digest
    || ready.payload.migration_id !== lock.id
    || ready.payload.worksheet_digest !== state.worksheet_digest
    || ready.payload.backup_inventory_digest !== lock.backup_inventory_digest
    || canonicalJson(ready.payload.backup_inventory)
      !== canonicalJson(state.worksheet.backup_inventory)
    || ready.payload.source_manifest_digest
      !== state.worksheet.source_manifest_digest
    || ready.payload.source_store_digest !== state.worksheet.source_store_digest
    || ready.payload.authorization_digest !== (state.authorization?.digest ?? null)) {
    fail('RECOVERY_REQUIRED', 'schema-5 migration ready record binding changed');
  }
  verifyBackup(lock.backup_path, state.worksheet, ready, state.authorization);
  if (state.receipt !== null) {
    const retained = readJson(join(lock.backup_path, 'receipt.json'), 'schema-5 migration receipt');
    if (canonicalJson(retained) !== canonicalJson(state.receipt)) {
      fail('RECOVERY_REQUIRED', 'schema-5 migration state receipt binding changed');
    }
    state.receipt = retained;
  }
  return {state, ready};
}

function snapshotPrivate(root) {
  return walkFiles(root, '.kai')
    .filter(entry => !entry.path.startsWith(HOST_RUNTIME));
}

function sameInventory(expected, actual, message) {
  const ordered = entries => Array.isArray(entries)
    ? [...entries].sort((left, right) =>
        left.path < right.path ? -1 : left.path > right.path ? 1 : 0)
    : entries;
  expected = ordered(expected);
  actual = ordered(actual);
  if (canonicalJson(expected) !== canonicalJson(actual)) {
    let changed = null;
    if (Array.isArray(expected) && Array.isArray(actual)) {
      const expectedByPath = new Map(expected.map(entry => [entry.path, entry]));
      const actualByPath = new Map(actual.map(entry => [entry.path, entry]));
      changed = [...new Set([
        ...expectedByPath.keys(),
        ...actualByPath.keys(),
      ])].sort().find(path =>
        canonicalJson(expectedByPath.get(path) ?? null)
          !== canonicalJson(actualByPath.get(path) ?? null));
    }
    fail(
      'RECOVERY_REQUIRED',
      `${message}${changed ? `: ${changed}` : ''}`,
    );
  }
}

function sourceProjectMap(validated) {
  return new Map(
    [...validated.sourceProjects, ...validated.projects]
      .map(project => [project.project.id, project]),
  );
}

function copyAuthorization(root, backupPath, authorization) {
  if (authorization === null) return;
  if (!authorization?.payload
    || digest(authorization.payload) !== authorization.digest
    || canonicalJson(migrationAuthorizationDescriptor(
      root,
      authorization.payload.capability_id,
    )) !== canonicalJson(authorization)) {
    fail('AUTHORITY_REQUIRED', 'migration authorization descriptor binding is invalid');
  }
  for (const entry of authorization.payload.files) {
    const actual = fileFingerprint(root, entry.source);
    if (entry.type !== 'file'
      || actual.digest !== entry.digest
      || actual.size !== entry.size) {
      fail('AUTHORITY_REQUIRED', `migration authorization source changed: ${entry.kind}`);
    }
    durableCopy(
      safePath(root, entry.source),
      join(backupPath, ...entry.backup.split('/')),
    );
  }
  durableWrite(
    join(backupPath, 'authorization.json'),
    canonicalJson(authorization),
  );
}

function frozenWorksheet(backupPath, worksheet) {
  const manifestPath = join(backupPath, 'private', '.kai', 'manifest.json');
  const sourceManifestBytes = readFileSync(manifestPath);
  let sourceManifest;
  try {
    sourceManifest = JSON.parse(sourceManifestBytes);
  } catch {
    fail('RECOVERY_REQUIRED', 'frozen schema-4 manifest is invalid');
  }
  if (sourceManifest.schema_version !== 4
    || hash(sourceManifestBytes) !== worksheet.source_manifest_digest) {
    fail('RECOVERY_REQUIRED', 'frozen schema-4 manifest does not match the authorized plan');
  }
  const store = databaseSnapshot(
    join(backupPath, 'private', ...LEGACY_DATABASE.split('/')),
  );
  if (store.digest !== worksheet.source_store_digest) {
    fail('RECOVERY_REQUIRED', 'frozen schema-4 store does not match the authorized plan');
  }
  const selected = sourceManifest.projects.length === 1
    ? sourceManifest.projects[0]
    : sourceManifest.projects.find(project => project?.id === 'default');
  const direction = worksheet.backup_inventory.public_files.find(entry =>
    entry.project_id === selected?.id
    && entry.path === worksheet.direction_ref.path);
  if (!selected || !direction || direction.digest !== worksheet.direction_ref.hash) {
    fail('RECOVERY_REQUIRED', 'frozen Direction does not match the authorized plan');
  }
  const fresh = worksheetFromSource({
    manifestDigest: hash(sourceManifestBytes),
    store,
    directionRef: worksheet.direction_ref,
    inventory: worksheet.backup_inventory,
  });
  return {fresh, sourceManifest};
}

function copySnapshot(root, preliminary, lock, roles, env, authorization) {
  mkdirSync(lock.backup_path, {recursive: false});
  if (pathHasLink(preliminary.backupRoot, lock.backup_path)
    || !exactPath(lock.backup_path)) {
    fail('RECOVERY_REQUIRED', 'migration backup directory resolved through a link or alias');
  }
  let state = {
    schema_version: 1,
    id: lock.id,
    phase: 'locked',
    worksheet: preliminary.worksheet,
    worksheet_digest: preliminary.worksheetDigest,
    candidate_manifest: preliminary.candidateManifest,
    ready_digest: null,
    authorization,
    receipt: null,
    installed_targets: [],
    database_installed: null,
  };
  writeState(lock, state);
  const inventory = preliminary.worksheet.backup_inventory;
  sameInventory(
    inventory,
    backupInventory(root, preliminary.sourceManifest, env),
    'schema-4 source inventory changed after migration lock acquisition',
  );
  for (const entry of inventory.private_files) {
    durableCopy(
      join(root, ...entry.path.split('/')),
      join(lock.backup_path, 'private', ...entry.path.split('/')),
    );
  }
  const projectMap = sourceProjectMap(preliminary);
  for (const entry of inventory.public_files) {
    const project = projectMap.get(entry.project_id);
    if (!project) fail('RECOVERY_REQUIRED', `missing project for publication ${entry.path}`);
    durableCopy(
      join(project.projectRoot, ...entry.path.split('/')),
      join(lock.backup_path, 'public', entry.project_id, ...entry.path.split('/')),
    );
  }
  if (inventory.registry) {
    durableCopy(
      inventory.registry.path,
      join(lock.backup_path, 'registry', 'workspaces.json'),
    );
  }
  durableWrite(
    join(lock.backup_path, 'git-tracking.json'),
    canonicalJson(inventory.git_tracking),
  );
  durableWrite(
    join(lock.backup_path, 'worksheet.json'),
    canonicalJson(preliminary.worksheet),
  );
  copyAuthorization(root, lock.backup_path, authorization);
  const frozen = frozenWorksheet(lock.backup_path, preliminary.worksheet);
  const validated = validateWorksheetAgainstSource({
    root,
    worksheet: preliminary.worksheet,
    roles,
    env,
    fresh: frozen.fresh,
    sourceManifest: frozen.sourceManifest,
  });
  if (validated.worksheetDigest !== preliminary.worksheetDigest
    || canonicalJson(validated.candidateManifest)
      !== canonicalJson(preliminary.candidateManifest)) {
    fail('RECOVERY_REQUIRED', 'frozen migration validation changed the authorized result');
  }
  const readyPayload = {
    schema_version: 1,
    migration_id: lock.id,
    worksheet_digest: validated.worksheetDigest,
    backup_inventory: inventory,
    backup_inventory_digest: validated.worksheet.backup_inventory_digest,
    source_manifest_digest: validated.worksheet.source_manifest_digest,
    source_store_digest: validated.worksheet.source_store_digest,
    authorization_digest: authorization?.digest ?? null,
  };
  const ready = {
    payload: readyPayload,
    digest: digest(readyPayload),
  };
  durableWrite(join(lock.backup_path, 'ready.json'), canonicalJson(ready));
  state = readState(lock);
  state.ready_digest = ready.digest;
  state.phase = 'backup-verified';
  writeState(lock, state);
  verifyBackup(lock.backup_path, validated.worksheet, ready, authorization);
  return {state, validated, ready};
}

function actualInventory(root) {
  return walkFiles(root).map(entry => ({...entry, type: 'file'}));
}

function verifyAuthorizationBackup(backupPath, authorization) {
  if (authorization === null) {
    if (existsSync(join(backupPath, 'authorization'))
      || existsSync(join(backupPath, 'authorization.json'))) {
      fail('RECOVERY_REQUIRED', 'migration backup has unbound authorization files');
    }
    return;
  }
  const retained = readJson(
    join(backupPath, 'authorization.json'),
    'migration authorization proof',
  );
  if (retained.digest !== authorization.digest
    || digest(retained.payload) !== retained.digest
    || canonicalJson(retained) !== canonicalJson(authorization)) {
    fail('RECOVERY_REQUIRED', 'migration authorization proof changed');
  }
  const expected = authorization.payload.files
    .map(entry => ({
      path: entry.backup.replace(/^authorization\//, ''),
      digest: entry.digest,
      size: entry.size,
      type: entry.type,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  const actual = actualInventory(join(backupPath, 'authorization'));
  sameInventory(expected, actual, 'migration authorization backup inventory changed');
}

function verifyBackup(backupPath, worksheet, ready, authorization = null) {
  if (!existsSync(backupPath)
    || !lstatSync(backupPath).isDirectory()
    || pathHasLink(dirname(backupPath), backupPath)
    || !exactPath(backupPath)) {
    fail('RECOVERY_REQUIRED', 'migration backup directory changed type, link, or canonical identity');
  }
  if (digest(worksheet.backup_inventory) !== worksheet.backup_inventory_digest) {
    fail('RECOVERY_REQUIRED', 'authorized backup inventory digest changed');
  }
  if (canonicalJson(readJson(join(backupPath, 'worksheet.json'), 'migration worksheet backup'))
    !== canonicalJson(worksheet)) {
    fail('RECOVERY_REQUIRED', 'migration worksheet backup changed');
  }
  if (canonicalJson(readJson(join(backupPath, 'ready.json'), 'migration ready record'))
    !== canonicalJson(ready)) {
    fail('RECOVERY_REQUIRED', 'migration ready record changed');
  }
  if (ready.digest !== digest(ready.payload)
    || ready.payload.backup_inventory_digest !== worksheet.backup_inventory_digest
    || canonicalJson(ready.payload.backup_inventory)
      !== canonicalJson(worksheet.backup_inventory)
    || ready.payload.source_manifest_digest !== worksheet.source_manifest_digest
    || ready.payload.source_store_digest !== worksheet.source_store_digest) {
    fail('RECOVERY_REQUIRED', 'migration ready record does not bind the authorized inventory');
  }
  const inventory = worksheet.backup_inventory;
  sameInventory(
    inventory.private_files,
    actualInventory(join(backupPath, 'private')),
    'migration private backup has missing, extra, changed, or mistyped files',
  );
  const expectedPublic = inventory.public_files
    .map(entry => ({
      path: `${entry.project_id}/${entry.path}`,
      digest: entry.digest,
      size: entry.size,
      type: entry.type,
    }))
    .sort((left, right) => left.path.localeCompare(right.path));
  sameInventory(
    expectedPublic,
    actualInventory(join(backupPath, 'public')),
    'migration public backup has missing, extra, changed, or mistyped files',
  );
  if (inventory.registry) {
    const actual = fingerprintAbsolute(join(backupPath, 'registry', 'workspaces.json'));
    if (actual.digest !== inventory.registry.digest
      || actual.size !== inventory.registry.size
      || canonicalJson(actualInventory(join(backupPath, 'registry')))
        !== canonicalJson([{
          path: 'workspaces.json',
          digest: inventory.registry.digest,
          size: inventory.registry.size,
          type: 'file',
        }])) {
      fail('RECOVERY_REQUIRED', 'migration registry backup digest mismatch');
    }
  } else if (existsSync(join(backupPath, 'registry'))) {
    fail('RECOVERY_REQUIRED', 'migration backup has an unlisted registry tree');
  }
  if (canonicalJson(readJson(join(backupPath, 'git-tracking.json'), 'Git tracking backup'))
    !== canonicalJson(inventory.git_tracking)) {
    fail('RECOVERY_REQUIRED', 'migration Git tracking backup changed');
  }
  verifyAuthorizationBackup(backupPath, authorization);
  const allowed = new Set([
    'private',
    ...(inventory.public_files.length ? ['public'] : []),
    ...(inventory.registry ? ['registry'] : []),
    'git-tracking.json',
    'worksheet.json',
    'ready.json',
    'state.json',
    ...(authorization ? ['authorization', 'authorization.json'] : []),
    ...(existsSync(join(backupPath, 'receipt.json')) ? ['receipt.json'] : []),
  ]);
  const unexpected = readdirSync(backupPath).find(name => !allowed.has(name));
  if (unexpected) {
    fail('RECOVERY_REQUIRED', `migration backup contains unlisted entry: ${unexpected}`);
  }
  return {worksheet, ready, authorization};
}

function eventBaseline(database) {
  const rows = database.prepare(`
    SELECT seq,operation_id,subject_kind,subject_id,payload,thread_id
    FROM events ORDER BY seq
  `).all();
  return {
    event_count: rows.length,
    event_digest: digest(rows),
    through_seq: rows.length ? Number(rows.at(-1).seq) : 0,
  };
}

export function createSchema5MigrationStagingStore({root, stagePath}) {
  const expectedRoot = resolve(stagePath);
  const databasePath = join(expectedRoot, ...COORDINATION_DATABASE.split('/'));
  if (!escapesRoot(resolve(root), databasePath)
    || !normalized(databasePath).startsWith(`${normalized(expectedRoot)}${sep}`)) {
    fail('INVALID_INPUT', 'schema-5 migration staging database must stay outside the live workspace');
  }
  return openStore({path: databasePath, mode: 'create'});
}

function migrationMapRows(validated) {
  const rows = [];
  for (const collection of ['epics', 'milestones', 'items']) {
    for (const entry of validated.worksheet[collection]) {
      const primary = validated.primaryTargets.get(sourceKey(entry.source));
      rows.push({
        source_kind: entry.source.kind,
        source_id: entry.source.map_id ?? entry.source.id,
        source_version: entry.source.version,
        target_kind: primary?.kind ?? null,
        target_id: primary?.id ?? null,
        target_version: primary?.version ?? null,
        disposition: entry.classification.disposition,
      });
    }
  }
  return rows;
}

function insertLegacyRows(database, source) {
  const insertMetadata = database.prepare(
    'INSERT INTO migration_legacy_metadata(source_key,row_json,row_digest) VALUES(?,?,?)',
  );
  for (const row of source.tables.metadata) {
    const rowJson = canonicalJson(row);
    insertMetadata.run(row.key, rowJson, digest(rowJson));
  }
  const insertRecord = database.prepare(
    'INSERT INTO migration_legacy_records(kind,id,row_json,row_digest) VALUES(?,?,?,?)',
  );
  for (const row of source.tables.records) {
    const rowJson = canonicalJson(row);
    insertRecord.run(row.kind, row.id, rowJson, digest(rowJson));
  }
  const insertEvent = database.prepare(
    'INSERT INTO migration_legacy_events(source_seq,row_json,row_digest) VALUES(?,?,?)',
  );
  for (const row of source.tables.events) {
    const rowJson = canonicalJson(row);
    insertEvent.run(Number(row.seq), rowJson, digest(rowJson));
  }
  const insertOperation = database.prepare(
    'INSERT INTO migration_legacy_operations(source_id,row_json,row_digest) VALUES(?,?,?)',
  );
  for (const row of source.tables.operations) {
    const rowJson = canonicalJson(row);
    insertOperation.run(row.id, rowJson, digest(rowJson));
  }
  const insertExtra = database.prepare(
    'INSERT INTO migration_legacy_extra(table_name,row_index,row_json,row_digest) VALUES(?,?,?,?)',
  );
  for (const [table, rows] of Object.entries(source.tables)) {
    if (new Set(['metadata', 'records', 'events', 'operations']).has(table)) continue;
    rows.forEach((row, index) => {
      const rowJson = canonicalJson(row);
      insertExtra.run(table, index, rowJson, digest(rowJson));
    });
  }
}

function immutableTriggers(database) {
  for (const table of PROVENANCE_TABLES) {
    for (const operation of ['INSERT', 'UPDATE', 'DELETE']) {
      database.exec(`
        CREATE TRIGGER immutable_${table}_${operation.toLowerCase()}
        BEFORE ${operation} ON ${table}
        BEGIN
          SELECT RAISE(ABORT, 'immutable migration provenance');
        END
      `);
    }
  }
}

function stageTargetFiles(root, validated, lock) {
  for (const entry of validated.worksheet.authored_files) {
    if (entry.classification.action !== 'migrate') continue;
    const target = join(
      lock.stage_path,
      'schema5-files',
      ...entry.classification.target.split('/'),
    );
    const source = join(
      lock.backup_path,
      'private',
      ...entry.path.split('/'),
    );
    durableCopy(source, target);
    const fingerprint = fingerprintAbsolute(target);
    if (fingerprint.digest !== entry.digest || fingerprint.size !== entry.size) {
      fail('RECOVERY_REQUIRED', `staged authored file changed: ${entry.path}`);
    }
  }
}

function migrationSourceRows(inventory, worksheet) {
  const classifications = new Map(
    worksheet.authored_files.map(entry => [entry.path, entry.classification]),
  );
  return inventory.private_files.map(({type, ...entry}) => ({
    source_id: digest(entry.path),
    path: entry.path,
    digest: entry.digest,
    size: entry.size,
    category: entry.path === '.kai/manifest.json'
      ? 'manifest'
      : entry.path === LEGACY_DATABASE
        ? 'database'
        : authoredCategory(entry.path),
    owner_hint: ownerHint(entry.path),
    classification: classifications.get(entry.path) ?? {
      action: 'runtime-retained',
      pack: 'core',
      target: entry.path.startsWith(HOST_RUNTIME) ? entry.path : null,
      ownership_basis: 'Migration runtime source.',
    },
    backup_relative: `private/${entry.path}`,
  }));
}

function finishStagedStore(store) {
  const checkpoint = store.database.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get();
  if (checkpoint.busy) fail('STORE_BUSY', 'schema-5 staged database checkpoint is busy');
  closeStore(store);
}

function stageMigrationStore(root, validated, lock, state) {
  if (!existsSync(lock.stage_path)) mkdirSync(lock.stage_path, {recursive: false});
  if (pathHasLink(dirname(lock.stage_path), lock.stage_path)
    || !exactPath(lock.stage_path)) {
    fail('RECOVERY_REQUIRED', 'migration stage directory resolved through a link or alias');
  }
  stageTargetFiles(root, validated, lock);
  const databasePath = join(lock.stage_path, ...COORDINATION_DATABASE.split('/'));
  if (existsSync(databasePath)) {
    fail('RECOVERY_REQUIRED', 'unexpected existing schema-5 staged database');
  }
  const source = databaseSnapshot(
    join(lock.backup_path, 'private', ...LEGACY_DATABASE.split('/')),
  );
  let store = createSchema5MigrationStagingStore({root, stagePath: lock.stage_path});
  try {
    store.database.exec(`BEGIN IMMEDIATE;
      CREATE TABLE migration_id_map (
        source_kind TEXT NOT NULL,
        source_id TEXT NOT NULL,
        source_version INTEGER NOT NULL,
        target_kind TEXT,
        target_id TEXT,
        target_version INTEGER,
        disposition TEXT NOT NULL,
        worksheet_digest TEXT NOT NULL,
        PRIMARY KEY(source_kind,source_id)
      );
      CREATE TABLE migration_sources (
        source_id TEXT PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        digest TEXT NOT NULL,
        size INTEGER NOT NULL,
        category TEXT NOT NULL,
        owner_hint TEXT,
        classification TEXT NOT NULL,
        backup_relative TEXT NOT NULL
      );
      CREATE TABLE migration_legacy_metadata (
        source_key TEXT PRIMARY KEY,
        row_json TEXT NOT NULL,
        row_digest TEXT NOT NULL
      );
      CREATE TABLE migration_legacy_records (
        kind TEXT NOT NULL,
        id TEXT NOT NULL,
        row_json TEXT NOT NULL,
        row_digest TEXT NOT NULL,
        PRIMARY KEY(kind,id)
      );
      CREATE TABLE migration_legacy_events (
        source_seq INTEGER PRIMARY KEY,
        row_json TEXT NOT NULL,
        row_digest TEXT NOT NULL
      );
      CREATE TABLE migration_legacy_operations (
        source_id TEXT PRIMARY KEY,
        row_json TEXT NOT NULL,
        row_digest TEXT NOT NULL
      );
      CREATE TABLE migration_legacy_extra (
        table_name TEXT NOT NULL,
        row_index INTEGER NOT NULL,
        row_json TEXT NOT NULL,
        row_digest TEXT NOT NULL,
        PRIMARY KEY(table_name,row_index)
      );`);
    const insertRecord = store.database.prepare(`
      INSERT INTO records(kind,id,subject_kind,subject_id,version,body)
      VALUES(?,?,?,?,?,?)
    `);
    for (const record of validated.records.values()) {
      insertRecord.run(
        record.kind,
        record.id,
        null,
        null,
        record.version,
        canonicalJson(record.body),
      );
    }
    const insertMap = store.database.prepare(`
      INSERT INTO migration_id_map
      VALUES(?,?,?,?,?,?,?,?)
    `);
    for (const row of migrationMapRows(validated)) {
      insertMap.run(
        row.source_kind,
        row.source_id,
        row.source_version,
        row.target_kind,
        row.target_id,
        row.target_version,
        row.disposition,
        validated.worksheetDigest,
      );
    }
    const insertSource = store.database.prepare(
      'INSERT INTO migration_sources VALUES(?,?,?,?,?,?,?,?)',
    );
    for (const row of migrationSourceRows(
      validated.worksheet.backup_inventory,
      validated.worksheet,
    )) {
      insertSource.run(
        row.source_id,
        row.path,
        row.digest,
        row.size,
        row.category,
        row.owner_hint,
        canonicalJson(row.classification),
        row.backup_relative,
      );
    }
    insertLegacyRows(store.database, source.snapshot);
    store.database.prepare(`
      INSERT INTO events(operation_id,subject_kind,subject_id,payload)
      VALUES(?,NULL,NULL,?)
    `).run(
      lock.id,
      canonicalJson({
        kind: 'workspace.migrate-v5',
        actor: null,
        sourceSchema: 4,
        migrationId: lock.id,
        worksheetDigest: validated.worksheetDigest,
        historicalAcceptanceCurrent: false,
        timestamp: null,
      }),
    );
    const baseline = eventBaseline(store.database);
    store.database.prepare('INSERT INTO metadata VALUES(?,?)').run(
      'migration_v5_baseline',
      canonicalJson(baseline),
    );
    immutableTriggers(store.database);
    const databaseDigest = schema5DatabaseDigest(store);
    const manifestBytes = Buffer.from(`${JSON.stringify(validated.candidateManifest, null, 2)}\n`);
    const payload = {
      schema_version: 1,
      migration_id: lock.id,
      workspace_id: validated.sourceManifest.workspace_id,
      workspace_root: canonicalPath(root),
      source_manifest_digest: validated.worksheet.source_manifest_digest,
      source_store_digest: validated.worksheet.source_store_digest,
      worksheet_digest: validated.worksheetDigest,
      backup_inventory_digest: validated.worksheet.backup_inventory_digest,
      ready_digest: state.ready_digest,
      authorization_digest: state.authorization?.digest ?? null,
      backup_path: lock.backup_path,
      activated_manifest_digest: hash(manifestBytes),
      activation_baseline: baseline,
      schema5_files: {
        manifest: {
          path: '.kai/manifest.json',
          type: 'file',
          digest: hash(manifestBytes),
          size: manifestBytes.length,
        },
        authored_targets: validated.worksheet.authored_files
          .filter(entry => entry.classification.action === 'migrate')
          .map(entry => ({
            path: entry.classification.target,
            type: 'file',
            digest: entry.digest,
            size: entry.size,
          })),
        database: {
          path: COORDINATION_DATABASE,
          type: 'sqlite',
          digest: databaseDigest,
        },
      },
    };
    const receipt = {
      payload,
      digest: digest(payload),
      backupPath: lock.backup_path,
      databasePath: safePath(root, COORDINATION_DATABASE),
      activated: false,
      id: lock.id,
    };
    store.database.prepare('INSERT INTO metadata VALUES(?,?)').run(
      'migration_v5',
      canonicalJson({
        receipt_digest: receipt.digest,
        receipt_path: join(lock.backup_path, 'receipt.json'),
        backup_path: lock.backup_path,
        migration_id: lock.id,
      }),
    );
    store.database.exec('COMMIT');
    finishStagedStore(store);
    store = null;
    durableWrite(join(lock.stage_path, 'schema5-manifest.json'), manifestBytes);
    durableWrite(join(lock.backup_path, 'receipt.json'), canonicalJson(receipt));
    verifyStagedStore(root, validated, lock, receipt);
    state.phase = 'staged';
    state.receipt = receipt;
    writeState(lock, state);
    return state;
  } catch (error) {
    if (store && !store.closed) {
      try {
        store.database.exec('ROLLBACK');
      } catch {}
    }
    closeStore(store);
    throw error;
  }
}

function verifyStagedStore(root, validated, lock, receipt, path = null) {
  const databasePath = path ?? join(lock.stage_path, ...COORDINATION_DATABASE.split('/'));
  const store = openStore({path: databasePath, mode: 'read'});
  try {
    for (const record of validated.records.values()) {
      const persisted = readRecord(store, record.kind, record.id);
      if (canonicalJson(persisted) !== canonicalJson(record)) {
        fail('RECOVERY_REQUIRED', `staged hierarchy record changed: ${record.kind}/${record.id}`);
      }
    }
    const direction = readDirection({
      workspaceRoot: root,
      manifest: validated.candidateManifest,
    });
    const roles = [...new Set(['operator', ...(validated.roles ?? [])])];
    hierarchyStatus(store, {direction, roles});
    for (const record of validated.records.values()) {
      hierarchyContext(store, {
        subject: {kind: record.kind, id: record.id},
        direction,
        roles,
        recentLimit: 0,
        maxBytes: 24 * 1024,
      });
    }
    const metadata = JSON.parse(store.database.prepare(
      "SELECT value FROM metadata WHERE key='migration_v5'",
    ).get().value);
    if (metadata.receipt_digest !== receipt.digest || metadata.backup_path !== lock.backup_path) {
      fail('RECOVERY_REQUIRED', 'staged migration receipt binding changed');
    }
    const baseline = JSON.parse(store.database.prepare(
      "SELECT value FROM metadata WHERE key='migration_v5_baseline'",
    ).get().value);
    if (canonicalJson(baseline) !== canonicalJson(eventBaseline(store.database))) {
      fail('RECOVERY_REQUIRED', 'staged migration event baseline changed');
    }
    assertOwnedDatabase(
      databasePath,
      receipt.payload.schema5_files.database,
      'staged schema-5 database',
      store,
    );
  } finally {
    closeStore(store);
  }
}

function sameSourceInventory(root, validated) {
  sameInventory(
    validated.worksheet.backup_inventory,
    backupInventory(root, validated.sourceManifest, validated.env),
    'schema-4 source digest changed during migration',
  );
}

function samePublic(root, validated) {
  const current = retainedPublications(root, validated.sourceManifest)
    .map(({classification, ...entry}) => ({...entry, type: 'file'}));
  if (canonicalJson(current)
    !== canonicalJson(validated.worksheet.backup_inventory.public_files)) {
    fail('RECOVERY_REQUIRED', 'accepted publication tree changed during migration');
  }
}

function sameRegistry(validated) {
  const registry = validated.worksheet.backup_inventory.registry;
  if (!registry) return;
  const current = fingerprintAbsolute(registry.path);
  if (current.digest !== registry.digest || current.size !== registry.size) {
    fail('RECOVERY_REQUIRED', 'external workspace registry changed during migration');
  }
}

function assertOwnedFile(path, expected, label) {
  if (!existsSync(path)) {
    fail('RECOVERY_REQUIRED', `${label} disappeared`);
  }
  const stat = lstatSync(path);
  if (expected.type !== 'file' || !stat.isFile() || stat.nlink !== 1) {
    fail('RECOVERY_REQUIRED', `${label} type changed`);
  }
  const actual = fingerprintAbsolute(path);
  if (actual.digest !== expected.digest || actual.size !== expected.size) {
    fail('RECOVERY_REQUIRED', `${label} digest changed`);
  }
  return actual;
}

function schema5DatabaseDigest(store) {
  return digest({
    logical: logicalStoreDigest(store, {
      excludeMetadata: ['migration_baseline', 'migration_v5'],
    }),
    schema: store.database.prepare(`
      SELECT type, name, tbl_name, sql
      FROM sqlite_master
      WHERE name NOT LIKE 'sqlite_%'
      ORDER BY type, name
    `).all(),
  });
}

function assertOwnedDatabase(path, expected, label, open = null) {
  if (!expected || expected.path !== COORDINATION_DATABASE
    || expected.type !== 'sqlite'
    || !/^[a-f0-9]{64}$/.test(expected.digest)
    || !existsSync(path)) {
    fail('RECOVERY_REQUIRED', `${label} ownership binding is invalid`);
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1) {
    fail('RECOVERY_REQUIRED', `${label} type changed`);
  }
  const store = open ?? openStore({path, mode: 'read'});
  try {
    if (schema5DatabaseDigest(store) !== expected.digest) {
      fail('RECOVERY_REQUIRED', `${label} digest changed`);
    }
  } finally {
    if (open === null) closeStore(store);
  }
}

function retiredPath(lock, sourcePath) {
  return join(lock.stage_path, 'retired', ...sourcePath.split('/'));
}

function retireSources(root, validated, lock, state) {
  for (const entry of validated.worksheet.backup_inventory.private_files) {
    if (entry.path === '.kai/manifest.json' || entry.path.startsWith(HOST_RUNTIME)) continue;
    const source = join(root, ...entry.path.split('/'));
    const retained = retiredPath(lock, entry.path);
    if (existsSync(retained)) {
      assertOwnedFile(retained, entry, `retired schema-4 source ${entry.path}`);
      continue;
    }
    if (!existsSync(source)) {
      fail('RECOVERY_REQUIRED', `schema-4 source disappeared before retirement: ${entry.path}`);
    }
    assertOwnedFile(source, entry, `schema-4 source ${entry.path}`);
    mkdirSync(dirname(retained), {recursive: true});
    renameSync(source, retained);
  }
  state.phase = 'sources-retired';
  writeState(lock, state);
}

function moveAuthoredTargets(root, validated, lock, state) {
  state.installed_targets ??= [];
  for (const entry of validated.worksheet.authored_files) {
    if (entry.classification.action !== 'migrate') continue;
    const staged = join(
      lock.stage_path,
      'schema5-files',
      ...entry.classification.target.split('/'),
    );
    const live = join(root, ...entry.classification.target.split('/'));
    const expected = {
      path: entry.classification.target,
      type: 'file',
      digest: entry.digest,
      size: entry.size,
    };
    if (existsSync(live)) {
      if (state.installed_targets.some(target =>
        target.path === entry.classification.target)
        && !existsSync(staged)) {
        assertOwnedFile(live, expected, `schema-5 authored target ${expected.path}`);
        continue;
      }
      fail('RECOVERY_REQUIRED', `schema-5 authored target collision: ${entry.classification.target}`);
    }
    mkdirSync(dirname(live), {recursive: true});
    renameSync(staged, live);
    assertOwnedFile(live, expected, `schema-5 authored target ${expected.path}`);
    state.installed_targets.push(expected);
    writeState(lock, state);
  }
}

function moveDatabase(root, lock, state) {
  const staged = join(lock.stage_path, ...COORDINATION_DATABASE.split('/'));
  const live = safePath(root, COORDINATION_DATABASE);
  if (!existsSync(live)) {
    mkdirSync(dirname(live), {recursive: true});
    renameSync(staged, live);
    assertOwnedDatabase(
      live,
      state.receipt.payload.schema5_files.database,
      'schema-5 migration database',
    );
    state.database_installed = state.receipt.payload.schema5_files.database;
  } else if (existsSync(staged)) {
    fail('RECOVERY_REQUIRED', 'both staged and live schema-5 databases exist');
  } else if (state.database_installed) {
    assertOwnedDatabase(live, state.database_installed, 'schema-5 migration database');
  }
  state.phase = 'db-moved';
  writeState(lock, state);
}

function removeEmptyDirectories(root) {
  const privateRoot = join(root, '.kai');
  function walk(path) {
    if (!existsSync(path) || !lstatSync(path).isDirectory()) return;
    for (const name of readdirSync(path)) walk(join(path, name));
    if (path !== privateRoot && readdirSync(path).length === 0) {
      rmSync(path, {recursive: true, force: false});
    }
  }
  walk(privateRoot);
}

function validateActivationTree(root, validated, lock, state) {
  const manifestValidation = validateSchema5Manifest(root, validated.candidateManifest, {
    env: validated.env,
  });
  if (manifestValidation.errors.length) {
    fail('RECOVERY_REQUIRED', manifestValidation.errors.join('; '));
  }
  for (const forbidden of FORBIDDEN_SCHEMA5_ROOTS) {
    if (existsSync(join(root, ...forbidden.split('/')))) {
      fail('RECOVERY_REQUIRED', `retired schema-4 root remains before activation: ${forbidden}`);
    }
  }
  const expectedFiles = new Set([
    '.kai/manifest.json',
    COORDINATION_DATABASE,
    ...(state.installed_targets ?? []).map(entry => entry.path),
  ]);
  const liveFiles = snapshotPrivate(root);
  const unexpected = liveFiles.find(entry => !expectedFiles.has(entry.path));
  if (unexpected) {
    fail('RECOVERY_REQUIRED', `unclassified private file appeared during migration: ${unexpected.path}`);
  }
  for (const entry of validated.worksheet.authored_files
    .filter(source => source.classification.action === 'migrate')) {
    const live = liveFiles.find(candidate => candidate.path === entry.classification.target);
    if (!live || live.digest !== entry.digest || live.size !== entry.size) {
      fail('RECOVERY_REQUIRED', `migrated authored target changed before activation: ${entry.classification.target}`);
    }
  }
  const privacy = inspectGitPrivacy(root, validated.candidateManifest.placement);
  if (privacy.errors.length || privacy.missing.length) {
    fail('RECOVERY_REQUIRED', [...privacy.errors, ...privacy.missing].join('; '));
  }
  samePublic(root, validated);
  sameRegistry(validated);
  const {ready} = verifyStateBinding(lock, state);
  verifyStagedStore(
    root,
    validated,
    lock,
    state.receipt,
    safePath(root, COORDINATION_DATABASE),
  );
  return ready;
}

function assertAtomicReplacementSupported(lock) {
  const probeRoot = join(lock.stage_path, 'atomic-replace-probe');
  mkdirSync(probeRoot, {recursive: true});
  const current = join(probeRoot, 'current');
  const next = join(probeRoot, 'next');
  durableWrite(current, 'old');
  durableWrite(next, 'new');
  renameSync(next, current);
  if (readFileSync(current, 'utf8') !== 'new' || existsSync(next)) {
    fail('UNSUPPORTED_HOST', 'filesystem cannot atomically replace an existing manifest');
  }
  rmSync(probeRoot, {recursive: true, force: false});
}

function releaseLock(path, expected) {
  if (!existsSync(path)) return;
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1 || pathHasLink(dirname(path), path)
    || !exactPath(path)
    || canonicalJson(readJson(path, 'schema-5 migration lock')) !== canonicalJson(expected)) {
    fail('RECOVERY_REQUIRED', 'schema-5 migration lock changed; refusing removal');
  }
  unlinkSync(path);
}

function activationReceipt(state) {
  return state.receipt;
}

function activateStaged(root, validated, lock, state) {
  verifyStateBinding(lock, state);
  if (state.phase === 'staged' || state.phase === 'backup-verified') {
    if (state.phase === 'backup-verified') state = stageMigrationStore(root, validated, lock, state);
    assertAtomicReplacementSupported(lock);
    sameSourceInventory(root, validated);
    retireSources(root, validated, lock, state);
  }
  if (state.phase === 'sources-retired') {
    moveAuthoredTargets(root, validated, lock, state);
    moveDatabase(root, lock, state);
  }
  if (state.phase === 'db-moved') {
    removeEmptyDirectories(root);
    validateActivationTree(root, validated, lock, state);
    const stagedManifest = join(lock.stage_path, 'schema5-manifest.json');
    const liveManifest = safePath(root, '.kai/manifest.json');
    const alreadyActivated = state.receipt
      && hash(exactFile(root, '.kai/manifest.json'))
        === state.receipt.payload.activated_manifest_digest;
    if (!alreadyActivated) {
      const sourceManifest = validated.worksheet.backup_inventory.private_files
        .find(entry => entry.path === '.kai/manifest.json');
      assertOwnedFile(liveManifest, sourceManifest, 'live schema-4 manifest');
      renameSync(stagedManifest, liveManifest);
    }
    state.receipt.activated = true;
    durableWrite(join(lock.backup_path, 'receipt.json'), canonicalJson(state.receipt));
    state.phase = 'activated';
    writeState(lock, state);
  }
  if (state.phase !== 'activated') {
    fail('RECOVERY_REQUIRED', `unsupported schema-5 migration phase ${state.phase}`);
  }
  rmSync(lock.stage_path, {recursive: true, force: true});
  releaseLock(v5MigrationLockPath(root), lock);
  return activationReceipt(state);
}

function validatedWithRuntime(input, env) {
  const validated = validateMigrationWorksheet({...input, env});
  validated.roles = [...input.roles];
  validated.env = env;
  return validated;
}

export function migrateWorkspaceV5({
  root,
  confirm,
  worksheet,
  roles = [],
  env = process.env,
  authorization = null,
} = {}) {
  confirmMigration(confirm);
  const validated = validatedWithRuntime({root, worksheet, roles}, env);
  const id = randomUUID();
  const lock = {
    schema_version: 1,
    id,
    root: canonicalPath(root),
    pid: process.pid,
    backup_path: join(
      validated.backupRoot,
      `kai-schema5-${validated.sourceManifest.workspace_id}-${id}`,
    ),
    stage_path: v5StagePath(root, id),
    worksheet_digest: validated.worksheetDigest,
    backup_inventory_digest: validated.worksheet.backup_inventory_digest,
    authorization_digest: authorization?.digest ?? null,
  };
  if (existsSync(lock.backup_path) || existsSync(lock.stage_path)) {
    fail('RECOVERY_REQUIRED', 'schema-5 migration backup or stage path already exists');
  }
  const lockPath = lockMigration(root, lock);
  try {
    const frozen = copySnapshot(
      root,
      validated,
      lock,
      roles,
      env,
      authorization,
    );
    let state = stageMigrationStore(root, frozen.validated, lock, frozen.state);
    return activateStaged(root, frozen.validated, lock, state);
  } catch (error) {
    if (!existsSync(lockPath)) {
      try {
        durableWrite(lockPath, canonicalJson(lock), {exclusive: true});
      } catch {}
    }
    throw error;
  }
}

function restoreRetired(root, lock, state) {
  if (!new Set(['sources-retired', 'db-moved']).has(state?.phase)) return;
  const sourceEntries = state?.worksheet?.backup_inventory?.private_files ?? [];
  for (const entry of sourceEntries) {
    if (entry.path === '.kai/manifest.json' || entry.path.startsWith(HOST_RUNTIME)) continue;
    const live = join(root, ...entry.path.split('/'));
    const retired = retiredPath(lock, entry.path);
    if (existsSync(live)) {
      if (existsSync(retired)) {
        fail(
          'RECOVERY_REQUIRED',
          `schema-4 restore target was concurrently replaced: ${entry.path}`,
        );
      }
      continue;
    }
    mkdirSync(dirname(live), {recursive: true});
    if (existsSync(retired)) {
      assertOwnedFile(retired, entry, `retired schema-4 source ${entry.path}`);
      renameSync(retired, live);
    } else {
      const backup = join(lock.backup_path, 'private', ...entry.path.split('/'));
      assertOwnedFile(backup, entry, `backed-up schema-4 source ${entry.path}`);
      durableCopy(backup, live);
    }
  }

}

function assertRetiredRestorable(root, lock, state) {
  if (!new Set(['sources-retired', 'db-moved']).has(state?.phase)) return;
  for (const entry of state.worksheet.backup_inventory.private_files) {
    if (entry.path === '.kai/manifest.json' || entry.path.startsWith(HOST_RUNTIME)) continue;
    const live = join(root, ...entry.path.split('/'));
    const retired = retiredPath(lock, entry.path);
    if (existsSync(live)) {
      fail(
        'RECOVERY_REQUIRED',
        `schema-4 restore target was concurrently replaced: ${entry.path}`,
      );
    }
    if (existsSync(retired)) {
      assertOwnedFile(retired, entry, `retired schema-4 source ${entry.path}`);
    } else {
      assertOwnedFile(
        join(lock.backup_path, 'private', ...entry.path.split('/')),
        entry,
        `backed-up schema-4 source ${entry.path}`,
      );
    }
  }
}

function validateAbandonState(root, lock, state) {
  if (!state || typeof state !== 'object' || Array.isArray(state)
    || canonicalJson(Object.keys(state).sort())
      !== canonicalJson([...MIGRATION_STATE_KEYS].sort())
    || state.schema_version !== 1
    || state.id !== lock.id
    || state.worksheet_digest !== lock.worksheet_digest
    || digest(state.worksheet) !== state.worksheet_digest
    || state.worksheet.backup_inventory_digest !== lock.backup_inventory_digest
    || (state.authorization?.digest ?? null) !== (lock.authorization_digest ?? null)
    || !Array.isArray(state.installed_targets)) {
    fail('RECOVERY_REQUIRED', 'schema-5 abandon state binding is invalid');
  }
  if (state.ready_digest === null) {
    if (state.phase !== 'locked'
      || state.receipt !== null
      || state.installed_targets.length !== 0
      || state.database_installed !== null) {
      fail('RECOVERY_REQUIRED', 'pre-ready abandon state contains unbound live cleanup entries');
    }
    return {live: false, targets: [], database: null};
  }
  verifyStateBinding(lock, state);
  const prelive = new Set(['backup-verified', 'staged']);
  const live = new Set(['sources-retired', 'db-moved']);
  if (!prelive.has(state.phase) && !live.has(state.phase)) {
    fail('RECOVERY_REQUIRED', `unsupported abandon phase ${state.phase}`);
  }
  if (state.phase === 'backup-verified') {
    if (state.receipt !== null) {
      fail('RECOVERY_REQUIRED', 'backup-only abandon state unexpectedly names a receipt');
    }
  } else if (!state.receipt
    || state.receipt.payload.migration_id !== lock.id
    || state.receipt.payload.worksheet_digest !== lock.worksheet_digest
    || state.receipt.payload.ready_digest !== state.ready_digest
    || state.receipt.payload.backup_inventory_digest
      !== lock.backup_inventory_digest) {
    fail('RECOVERY_REQUIRED', 'abandon receipt does not bind the immutable migration plan');
  }
  if (prelive.has(state.phase)) {
    if (state.installed_targets.length !== 0
      || state.database_installed !== null) {
      fail('RECOVERY_REQUIRED', 'pre-activation abandon cannot nominate live deletion targets');
    }
    if (existsSync(join(lock.stage_path, 'retired'))) {
      fail('RECOVERY_REQUIRED', 'pre-activation abandon state conflicts with retired live sources');
    }
    const liveDatabase = safePath(root, COORDINATION_DATABASE);
    if (existsSync(liveDatabase)) {
      fail('RECOVERY_REQUIRED', 'pre-activation abandon found an unbound live schema-5 database');
    }
    if (state.phase === 'staged') {
      const files = state.receipt.payload.schema5_files;
      if (!files || !Array.isArray(files.authored_targets) || !files.database) {
        fail('RECOVERY_REQUIRED', 'staged abandon receipt lacks immutable file inventory');
      }
      for (const entry of files.authored_targets) {
        assertOwnedFile(
          join(
            lock.stage_path,
            'schema5-files',
            ...entry.path.split('/'),
          ),
          entry,
          `staged schema-5 target ${entry.path}`,
        );
      }
      assertOwnedDatabase(
        join(lock.stage_path, ...COORDINATION_DATABASE.split('/')),
        files.database,
        'staged schema-5 database',
      );
    }
    return {live: false, targets: [], database: null};
  }

  const files = state.receipt.payload.schema5_files;
  if (!files || !Array.isArray(files.authored_targets) || !files.database) {
    fail('RECOVERY_REQUIRED', 'abandon receipt lacks immutable live cleanup inventory');
  }
  const expectedTargets = new Map(files.authored_targets.map(entry => [entry.path, entry]));
  const stateTargets = new Map();
  for (const entry of state.installed_targets) {
    const expected = expectedTargets.get(entry.path);
    if (!expected || stateTargets.has(entry.path)
      || canonicalJson(entry) !== canonicalJson(expected)) {
      fail('RECOVERY_REQUIRED', 'abandon state names an unbound or changed live target');
    }
    stateTargets.set(entry.path, entry);
  }
  const installedTargets = [];
  for (const entry of files.authored_targets) {
    const livePath = join(root, ...entry.path.split('/'));
    const stagedPath = join(
      lock.stage_path,
      'schema5-files',
      ...entry.path.split('/'),
    );
    const liveExists = existsSync(livePath);
    const stagedExists = existsSync(stagedPath);
    if (liveExists && !stagedExists) {
      assertOwnedFile(livePath, entry, `migration-owned target ${entry.path}`);
      installedTargets.push(entry);
    } else if (liveExists && stagedExists) {
      if (stateTargets.has(entry.path)) {
        fail('RECOVERY_REQUIRED', `abandon target ownership is ambiguous: ${entry.path}`);
      }
    } else if (!liveExists && !stagedExists) {
      fail('RECOVERY_REQUIRED', `abandon target ownership is missing: ${entry.path}`);
    }
  }
  if (canonicalJson([...stateTargets.values()].sort((left, right) =>
    left.path.localeCompare(right.path)))
    !== canonicalJson([...installedTargets].sort((left, right) =>
      left.path.localeCompare(right.path)))) {
    fail('RECOVERY_REQUIRED', 'abandon state target inventory does not match installed bytes');
  }

  const liveDatabase = safePath(root, COORDINATION_DATABASE);
  const stagedDatabase = join(lock.stage_path, ...COORDINATION_DATABASE.split('/'));
  const databaseLive = existsSync(liveDatabase);
  const databaseStaged = existsSync(stagedDatabase);
  let installedDatabase = null;
  if (databaseLive && !databaseStaged) {
    assertOwnedDatabase(
      liveDatabase,
      files.database,
      'migration-owned schema-5 database',
    );
    installedDatabase = files.database;
  } else if (databaseLive && databaseStaged) {
    if (state.database_installed !== null) {
      fail('RECOVERY_REQUIRED', 'abandon database ownership is ambiguous');
    }
  } else if (!databaseLive && !databaseStaged) {
    fail('RECOVERY_REQUIRED', 'abandon database ownership is missing');
  }
  if (canonicalJson(state.database_installed)
    !== canonicalJson(installedDatabase)) {
    fail('RECOVERY_REQUIRED', 'abandon state database inventory does not match installed bytes');
  }
  if (state.phase === 'sources-retired' && installedDatabase !== null) {
    fail('RECOVERY_REQUIRED', 'sources-retired phase cannot own a live schema-5 database');
  }
  if (state.phase === 'db-moved'
    && (installedDatabase === null
      || installedTargets.length !== files.authored_targets.length)) {
    fail('RECOVERY_REQUIRED', 'db-moved phase lacks its complete immutable live inventory');
  }
  return {live: true, targets: installedTargets, database: installedDatabase};
}

function removeMigratedTargets(root, authority) {
  for (const entry of authority.targets) {
    assertOwnedFile(
      join(root, ...entry.path.split('/')),
      entry,
      `migration-owned target ${entry.path}`,
    );
  }
  if (authority.database) {
    assertOwnedDatabase(
      safePath(root, COORDINATION_DATABASE),
      authority.database,
      'migration-owned schema-5 database',
    );
  }
  for (const entry of authority.targets) {
    unlinkSync(join(root, ...entry.path.split('/')));
  }
  if (authority.database) unlinkSync(safePath(root, COORDINATION_DATABASE));
}

function abandonMigration(root, lock, state) {
  if (lock.rollback === true
    || normalized(lock.stage_path) !== normalized(v5StagePath(root, lock.id))) {
    fail('RECOVERY_REQUIRED', 'abandon lock does not name the canonical migration stage');
  }
  const current = readWorkspaceManifest(root);
  if (!current.ok) fail('RECOVERY_REQUIRED', current.reason);
  if (current.manifest.schema_version === 5) {
    fail('RECOVERY_REQUIRED', 'activated schema-5 migration requires rollback, not abandon');
  }
  if (state) {
    const authority = validateAbandonState(root, lock, state);
    if (authority.live) {
      assertRetiredRestorable(root, lock, state);
      removeMigratedTargets(root, authority);
      restoreRetired(root, lock, state);
      const manifestBackup = join(lock.backup_path, 'private', '.kai', 'manifest.json');
      const liveManifest = safePath(root, '.kai/manifest.json');
      const manifestEntry = state.worksheet.backup_inventory.private_files
        .find(entry => entry.path === '.kai/manifest.json');
      if (!existsSync(liveManifest)) {
        assertOwnedFile(manifestBackup, manifestEntry, 'backed-up schema-4 manifest');
        durableCopy(manifestBackup, liveManifest);
      } else {
        assertOwnedFile(liveManifest, manifestEntry, 'live schema-4 manifest');
      }
    }
    rmSync(lock.stage_path, {recursive: true, force: true});
  }
  releaseLock(v5MigrationLockPath(root), lock);
  return {
    id: lock.id,
    activated: false,
    abandoned: true,
    backupPath: existsSync(lock.backup_path) ? lock.backup_path : null,
  };
}

export function recoverWorkspaceV5({
  root,
  confirm,
  action,
  roles = [],
  env = process.env,
} = {}) {
  confirmMigration(confirm);
  if (!Array.isArray(roles) || roles.some(role => typeof role !== 'string')) {
    fail('INVALID_INPUT', 'installed recovery roles must be explicit strings');
  }
  if (!new Set(['activate', 'abandon']).has(action)) {
    fail('INVALID_INPUT', 'schema-5 recovery action must be activate or abandon');
  }
  const {lock} = readLock(root);
  const statePath = join(lock.backup_path, 'state.json');
  const state = existsSync(statePath) ? readState(lock) : null;
  if (action === 'abandon') return abandonMigration(root, lock, state);
  if (!state || state.phase === 'locked') {
    fail('RECOVERY_REQUIRED', 'schema-5 migration backup was not verified; only abandon is safe');
  }
  verifyStateBinding(lock, state);
  let validated;
  if (new Set(['backup-verified', 'staged']).has(state.phase)) {
    const frozen = frozenWorksheet(lock.backup_path, state.worksheet);
    validated = validateWorksheetAgainstSource({
      root,
      worksheet: state.worksheet,
      roles,
      env,
      fresh: frozen.fresh,
      sourceManifest: frozen.sourceManifest,
    });
    validated.roles = [...roles];
    validated.env = env;
  } else {
    const sourceManifest = readJson(
      join(lock.backup_path, 'private', '.kai', 'manifest.json'),
      'backed-up schema-4 manifest',
    );
    const expectedCandidate = candidateManifest(root, sourceManifest, state.worksheet.placement);
    if (canonicalJson(expectedCandidate) !== canonicalJson(state.candidate_manifest)) {
      fail('RECOVERY_REQUIRED', 'schema-5 candidate manifest changed after worksheet authorization');
    }
    const projects = state.candidate_manifest.projects.map(project => ({
      project,
      ...resolveConfiguredProject({
        workspaceRoot: root,
        manifest: state.candidate_manifest,
        projectId: project.id,
      }),
    }));
    const records = new Map();
    const primaryTargets = new Map();
    for (const collection of ['epics', 'milestones', 'items']) {
      for (const entry of state.worksheet[collection]) {
        const primary = validateClassification(
          entry,
          collection,
          records,
          roles,
          state.worksheet,
        );
        primaryTargets.set(sourceKey(entry.source), primary);
      }
    }
    validateHierarchyRelationships([...records.values()]);
    validateTaskDependencies(records);
    validateMappedLegacyDependencies(state.worksheet, primaryTargets);
    validateAuthoredFiles(state.worksheet);
    validateRetainedPublications(state.worksheet);
    validateActiveWork(state.worksheet, primaryTargets);
    validated = {
      worksheet: state.worksheet,
      worksheetDigest: state.worksheet_digest,
      sourceManifest,
      candidateManifest: state.candidate_manifest,
      direction: readDirection({workspaceRoot: root, manifest: state.candidate_manifest}),
      projects,
      sourceProjects: configuredProjects(root, sourceManifest),
      backupRoot: dirname(lock.backup_path),
      records,
      primaryTargets,
      roles,
      env,
    };
  }
  return activateStaged(root, validated, lock, state);
}

function migrationMetadata(database, label) {
  let migration;
  let baseline;
  try {
    migration = JSON.parse(database.prepare(
      "SELECT value FROM metadata WHERE key='migration_v5'",
    ).get()?.value ?? 'null');
    baseline = JSON.parse(database.prepare(
      "SELECT value FROM metadata WHERE key='migration_v5_baseline'",
    ).get()?.value ?? 'null');
  } catch {
    fail('RECOVERY_REQUIRED', `${label} migration metadata is invalid`);
  }
  if (!migration || !baseline) {
    fail('RECOVERY_REQUIRED', 'schema-5 workspace has no recognized migration receipt');
  }
  return {migration, baseline};
}

function readLiveMigration(root) {
  const store = openStore({
    path: safePath(root, COORDINATION_DATABASE),
    mode: 'read',
  });
  try {
    const result = migrationMetadata(store.database, 'schema-5');
    if (canonicalJson(eventBaseline(store.database))
      !== canonicalJson(result.baseline)) {
      fail(
        'RECOVERY_REQUIRED',
        'schema-5 event log advanced beyond the activation baseline; explicit reconciliation is required',
      );
    }
    return result;
  } finally {
    closeStore(store);
  }
}

function beginRollbackBarrier(root, expectedReceiptDigest) {
  const store = openStore({
    path: safePath(root, COORDINATION_DATABASE),
    mode: 'write',
  });
  try {
    store.database.exec('BEGIN EXCLUSIVE');
    const result = migrationMetadata(store.database, 'rollback');
    if (result.migration.receipt_digest !== expectedReceiptDigest
      || canonicalJson(eventBaseline(store.database))
        !== canonicalJson(result.baseline)) {
      fail(
        'RECOVERY_REQUIRED',
        'schema-5 event log or migration receipt changed under rollback barrier',
      );
    }
    return {store, active: true};
  } catch (error) {
    closeStore(store);
    throw error;
  }
}

function closeRollbackBarrier(barrier, commit) {
  if (!barrier?.active) return;
  try {
    barrier.store.database.exec(commit ? 'COMMIT' : 'ROLLBACK');
  } finally {
    barrier.active = false;
    closeStore(barrier.store);
  }
}

function backupAuthority(backupPath, receipt) {
  const worksheet = readJson(
    join(backupPath, 'worksheet.json'),
    'migration worksheet backup',
  );
  if (digest(worksheet) !== receipt.payload.worksheet_digest
    || worksheet.backup_inventory_digest
      !== receipt.payload.backup_inventory_digest) {
    fail('RECOVERY_REQUIRED', 'migration receipt does not bind the backup worksheet inventory');
  }
  const ready = readJson(join(backupPath, 'ready.json'), 'migration ready record');
  if (ready.digest !== receipt.payload.ready_digest) {
    fail('RECOVERY_REQUIRED', 'migration receipt does not bind the ready record');
  }
  const authorization = receipt.payload.authorization_digest === null
    ? null
    : readJson(join(backupPath, 'authorization.json'), 'migration authorization proof');
  if ((authorization?.digest ?? null) !== receipt.payload.authorization_digest) {
    fail('RECOVERY_REQUIRED', 'migration receipt does not bind the authorization proof');
  }
  verifyBackup(backupPath, worksheet, ready, authorization);
  return {worksheet, ready, authorization};
}

function stageRollbackInventory(backupPath, stagePath, inventory) {
  const restoreRoot = join(stagePath, 'restore');
  mkdirSync(restoreRoot, {recursive: true});
  for (const entry of inventory.private_files) {
    const source = join(backupPath, 'private', ...entry.path.split('/'));
    assertOwnedFile(source, entry, `backed-up schema-4 source ${entry.path}`);
    durableCopy(source, join(restoreRoot, ...entry.path.split('/')));
  }
  sameInventory(
    inventory.private_files,
    actualInventory(restoreRoot),
    'staged rollback inventory changed',
  );
  return restoreRoot;
}

function preserveRollbackHost(root, backupPath, rollbackId, receipt) {
  const hostRoot = join(root, ...HOST_RUNTIME.slice(0, -1).split('/'));
  if (!existsSync(hostRoot)) return null;
  if (receipt.payload.authorization_digest === null) {
    fail(
      'RECOVERY_REQUIRED',
      'schema-5 host runtime cannot be removed without external migration authorization proof',
    );
  }
  const liveInventory = walkFiles(root, HOST_RUNTIME.slice(0, -1))
    .map(entry => ({...entry, type: 'file'}));
  const auditRoot = join(
    dirname(backupPath),
    `${basename(backupPath)}-rollback-${rollbackId}`,
  );
  mkdirSync(auditRoot, {recursive: false});
  const retainedRoot = join(auditRoot, 'host');
  for (const entry of liveInventory) {
    durableCopy(
      join(root, ...entry.path.split('/')),
      join(retainedRoot, ...entry.path.slice(HOST_RUNTIME.length).split('/')),
    );
  }
  const retainedInventory = actualInventory(retainedRoot);
  const expectedRetained = liveInventory.map(entry => ({
    ...entry,
    path: entry.path.slice(HOST_RUNTIME.length),
  }));
  sameInventory(
    expectedRetained,
    retainedInventory,
    'external rollback host audit copy changed',
  );
  const payload = {
    schema_version: 1,
    rollback_id: rollbackId,
    migration_receipt_digest: receipt.digest,
    live_inventory: liveInventory,
  };
  const proof = {payload, digest: digest(payload)};
  durableWrite(
    join(auditRoot, 'receipt.json'),
    canonicalJson(proof),
  );
  return {hostRoot, liveInventory, auditRoot};
}

function verifyLiveSchema5Files(root, receipt, store = null) {
  const files = receipt.payload.schema5_files;
  if (!files?.manifest || !Array.isArray(files.authored_targets)
    || !files.database) {
    fail('RECOVERY_REQUIRED', 'migration receipt lacks exact schema-5 file ownership');
  }
  assertOwnedFile(
    safePath(root, '.kai/manifest.json'),
    files.manifest,
    'live schema-5 manifest',
  );
  for (const entry of files.authored_targets) {
    assertOwnedFile(
      join(root, ...entry.path.split('/')),
      entry,
      `live schema-5 authored target ${entry.path}`,
    );
  }
  assertOwnedDatabase(
    safePath(root, COORDINATION_DATABASE),
    files.database,
    'live schema-5 database',
    store,
  );
}

function installRollbackFiles(root, restoreRoot, inventory) {
  const installed = [];
  for (const entry of inventory.private_files) {
    if (entry.path === '.kai/manifest.json') continue;
    const staged = join(restoreRoot, ...entry.path.split('/'));
    const live = join(root, ...entry.path.split('/'));
    if (existsSync(live)) {
      fail('RECOVERY_REQUIRED', `schema-4 rollback target already exists: ${entry.path}`);
    }
    mkdirSync(dirname(live), {recursive: true});
    renameSync(staged, live);
    assertOwnedFile(live, entry, `restored schema-4 source ${entry.path}`);
    installed.push({path: live, entry});
  }
  return installed;
}

function removeInstalledRollbackFiles(installed) {
  for (const {path, entry} of [...installed].reverse()) {
    if (!existsSync(path)) continue;
    assertOwnedFile(path, entry, `partially restored schema-4 source ${entry.path}`);
    unlinkSync(path);
  }
}

function finishSchema5Cleanup(root, receipt, hostProof) {
  for (const entry of receipt.payload.schema5_files.authored_targets) {
    const target = join(root, ...entry.path.split('/'));
    assertOwnedFile(target, entry, `migration-owned schema-5 target ${entry.path}`);
  }
  const database = safePath(root, COORDINATION_DATABASE);
  assertOwnedDatabase(
    database,
    receipt.payload.schema5_files.database,
    'migration-owned schema-5 database',
  );
  if (hostProof) {
    const currentHost = walkFiles(root, HOST_RUNTIME.slice(0, -1))
      .map(entry => ({...entry, type: 'file'}));
    sameInventory(
      hostProof.liveInventory,
      currentHost,
      'schema-5 host runtime changed after external audit preservation',
    );
  }
  for (const entry of receipt.payload.schema5_files.authored_targets) {
    unlinkSync(join(root, ...entry.path.split('/')));
  }
  unlinkSync(database);
  if (hostProof) rmSync(hostProof.hostRoot, {recursive: true, force: false});
  removeEmptyDirectories(root);
}

export function rollbackWorkspaceV5({
  root,
  confirm,
  env = process.env,
} = {}) {
  confirmMigration(confirm);
  const current = readWorkspaceManifest(root);
  if (!current.ok || current.manifest.schema_version !== 5) {
    fail('SCHEMA_MISMATCH', 'schema-5 rollback requires an active schema-5 workspace');
  }
  const validation = validateSchema5Manifest(root, current.manifest, {env});
  if (validation.errors.length) fail('RECOVERY_REQUIRED', validation.errors.join('; '));
  const manifest = current.manifest;
  const {migration} = readLiveMigration(root);
  const receipt = readJson(migration.receipt_path, 'schema-5 migration receipt');
  if (receipt.digest !== migration.receipt_digest
    || digest(receipt.payload) !== receipt.digest
    || receipt.activated !== true
    || receipt.id !== receipt.payload.migration_id
    || receipt.payload.workspace_id !== manifest.workspace_id
    || typeof receipt.payload.backup_path !== 'string'
    || typeof receipt.backupPath !== 'string'
    || normalized(receipt.payload.backup_path) !== normalized(migration.backup_path)
    || normalized(receipt.backupPath) !== normalized(migration.backup_path)
    || typeof receipt.databasePath !== 'string'
    || normalized(receipt.databasePath)
      !== normalized(safePath(root, COORDINATION_DATABASE))
    || normalized(receipt.payload.workspace_root) !== normalized(canonicalPath(root))) {
    fail('RECOVERY_REQUIRED', 'schema-5 migration receipt binding is invalid');
  }
  if (hash(manifestBytes(root)) !== receipt.payload.activated_manifest_digest) {
    fail('RECOVERY_REQUIRED', 'schema-5 manifest changed after activation');
  }
  const authority = backupAuthority(migration.backup_path, receipt);
  const lock = {
    schema_version: 1,
    id: randomUUID(),
    root: canonicalPath(root),
    pid: process.pid,
    backup_path: migration.backup_path,
    stage_path: v5StagePath(root, `rollback-${randomUUID()}`),
    worksheet_digest: receipt.payload.worksheet_digest,
    backup_inventory_digest: receipt.payload.backup_inventory_digest,
    authorization_digest: receipt.payload.authorization_digest,
    rollback: true,
  };
  const lockPath = lockMigration(root, lock);
  let barrier = null;
  let installed = [];
  let manifestSwitched = false;
  try {
    drainNativeWriterTokens(root);
    const restoreRoot = stageRollbackInventory(
      migration.backup_path,
      lock.stage_path,
      authority.worksheet.backup_inventory,
    );
    assertAtomicReplacementSupported(lock);
    verifyLiveSchema5Files(root, receipt);
    barrier = beginRollbackBarrier(root, migration.receipt_digest);
    const hostProof = preserveRollbackHost(
      root,
      migration.backup_path,
      lock.id,
      receipt,
    );
    installed = installRollbackFiles(
      root,
      restoreRoot,
      authority.worksheet.backup_inventory,
    );
    const stagedManifest = join(restoreRoot, '.kai', 'manifest.json');
    const liveManifest = safePath(root, '.kai/manifest.json');
    for (const entry of authority.worksheet.backup_inventory.private_files) {
      if (entry.path === '.kai/manifest.json') {
        assertOwnedFile(stagedManifest, entry, 'staged schema-4 manifest');
      } else {
        assertOwnedFile(
          join(root, ...entry.path.split('/')),
          entry,
          `restored schema-4 source ${entry.path}`,
        );
      }
    }
    verifyLiveSchema5Files(root, receipt, barrier.store);
    renameSync(stagedManifest, liveManifest);
    manifestSwitched = true;
    closeRollbackBarrier(barrier, true);
    barrier = null;
    finishSchema5Cleanup(root, receipt, hostProof);
    for (const entry of authority.worksheet.backup_inventory.private_files) {
      assertOwnedFile(
        join(root, ...entry.path.split('/')),
        entry,
        `rolled-back schema-4 source ${entry.path}`,
      );
    }
    rmSync(lock.stage_path, {recursive: true, force: true});
    releaseLock(lockPath, lock);
    return {
      id: receipt.payload.migration_id,
      rolledBack: true,
      backupPath: migration.backup_path,
      rollbackAuditPath: hostProof?.auditRoot ?? null,
      schemaVersion: 4,
    };
  } catch (error) {
    if (barrier) {
      try {
        closeRollbackBarrier(barrier, false);
      } catch (barrierError) {
        error.cause = new AggregateError(
          [error, barrierError],
          'rollback failure also failed to release the SQLite barrier',
        );
      }
    }
    if (!manifestSwitched) {
      try {
        removeInstalledRollbackFiles(installed);
      } catch (cleanupError) {
        error.cause = new AggregateError(
          [error, cleanupError],
          'rollback failed and partially restored schema-4 files require recovery',
        );
      }
    }
    throw error;
  }
}
