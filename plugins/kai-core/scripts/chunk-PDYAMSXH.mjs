import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  hierarchyContext,
  hierarchyStatus,
  taskPlan
} from "./chunk-K3LPE7V7.mjs";
import {
  artifactInputReferences,
  bindEvidenceTransaction,
  captureInputBasis,
  contextFor,
  currentDirectionForStore,
  effectiveApprovals,
  effectiveEvidence,
  effectiveReviews,
  hasPublicationHistory,
  hasStaleDirection,
  leaseIsLive,
  legacyClassificationSources,
  privacyRank,
  recoveryResolution,
  requireActingAuthority,
  requireActorAvailable,
  requireHostActionGrant,
  requireLeasedActingAuthority,
  requireNamedAuthority,
  requireOperatorApproval,
  requireReviews,
  requireRoleAvailable,
  sameActor,
  subjectArtifact,
  verifyAssetContent,
  verifyParentCompletionApproval,
  verifyParentCompletionEvidence,
  verifyReferences,
  verifyVerdict
} from "./chunk-AVOAKVOX.mjs";
import {
  applyOperation,
  assertWorkspacePath,
  closeStore,
  exactFile,
  fail as fail2,
  fail2 as fail3,
  fileFingerprint,
  hash,
  inspectGitPrivacy,
  logicalStoreDigest,
  migrationManifest,
  nativeWriterTokenPrefix,
  openStore,
  pathPrivacy,
  readDirection,
  readRecord,
  retainSubject,
  safePath,
  schema5MigrationLockPath,
  verifyTarget,
  workspaceGit
} from "./chunk-RVMY63WZ.mjs";
import {
  ACTIVE_ARTIFACT_LIFECYCLES,
  COORDINATION_DATABASE,
  DIRECTION_PATH,
  PRIVATE_ROOT,
  WORKSPACE_SCHEMA_VERSION,
  badPath,
  canonicalPath,
  escapesRoot,
  exactPath,
  loadWorkspaceRegistry,
  normalized,
  pathHasLink,
  readWorkspaceManifest,
  registryPath,
  resolveConfiguredProject,
  validateSchema5Manifest
} from "./chunk-KUPTE65K.mjs";
import {
  HIERARCHY_KINDS,
  PACKS,
  RuntimeError,
  approvedProfileModel,
  assertExactKeys,
  canonicalJson,
  clone,
  commandDigest,
  criteriaRef,
  fail,
  isPlainObject,
  isProducingRun,
  operatorDecisionActor,
  subjectEquals,
  text,
  validateAuthority,
  validateCapabilities,
  validateCapture,
  validateCommand,
  validateHierarchyRelationships,
  validateOperatorDecision,
  validateRecord
} from "./chunk-XLDNBMDG.mjs";

// src/core/lib/coordination-runtime/migration-v5.mjs
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
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
  writeFileSync
} from "node:fs";
import { DatabaseSync } from "node:sqlite";
import {
  basename,
  dirname,
  isAbsolute,
  join,
  resolve,
  sep
} from "node:path";
var WORKSHEET_KEYS = [
  "schema_version",
  "source_workspace_schema",
  "source_manifest_digest",
  "source_store_digest",
  "backup_inventory",
  "backup_inventory_digest",
  "direction_ref",
  "placement",
  "backup_root",
  "epics",
  "milestones",
  "items",
  "authored_files",
  "retained_publications",
  "active_work",
  "untracking"
];
var LEGACY_DATABASE = ".kai/state/coordination.sqlite";
var HOST_RUNTIME = ".kai/core/runtime/host/";
var ABANDON_ANCHOR_METADATA = "migration_v5_abandon_anchor";
var ACTIVATION_READY_FILE = "activation-ready.json";
var FORBIDDEN_SCHEMA5_ROOTS = [
  ".kai/state",
  ".kai/runs",
  ".kai/review",
  ".kai/archive",
  ".kai/personal",
  ".kai/areas",
  ".kai/shared"
];
var NONTERMINAL_TASK_STATES = /* @__PURE__ */ new Set([
  "proposed",
  "ready",
  "in-progress",
  "in-review",
  "release-ready",
  "deploying",
  "production-verification",
  "blocked"
]);
var QUIESCENCE_TARGET_STATES = /* @__PURE__ */ new Set([
  "ready",
  "in-progress",
  "in-review",
  "release-ready",
  "deploying",
  "production-verification"
]);
var TERMINAL_SOURCE_STATES = /* @__PURE__ */ new Set([
  "completed",
  "shipped",
  "archived",
  "dropped"
]);
var SOURCE_TABLE_ORDER = /* @__PURE__ */ new Map([
  ["metadata", "key"],
  ["records", "kind,id"],
  ["events", "seq"],
  ["operations", "id"],
  ["legacy_sources", "source_id"]
]);
var PROVENANCE_TABLES = [
  "migration_id_map",
  "migration_sources",
  "migration_legacy_metadata",
  "migration_legacy_records",
  "migration_legacy_events",
  "migration_legacy_operations",
  "migration_legacy_extra"
];
var MIGRATION_STATE_KEYS = /* @__PURE__ */ new Set([
  "schema_version",
  "id",
  "phase",
  "worksheet",
  "worksheet_digest",
  "candidate_manifest",
  "ready_digest",
  "authorization",
  "receipt",
  "installed_targets",
  "database_installed"
]);
var quoteIdentifier = (value) => `"${value.replaceAll('"', '""')}"`;
var slash = (value) => value.split(sep).join("/");
var jsonClone = (value) => JSON.parse(canonicalJson(value));
var exactKeys = (value, keys, label) => {
  if (!value || typeof value !== "object" || Array.isArray(value) || canonicalJson(Object.keys(value).sort()) !== canonicalJson([...keys].sort())) {
    fail3("INVALID_INPUT", `${label} must contain exactly ${[...keys].join(", ")}`);
  }
};
var requiredText = (value, label) => {
  if (typeof value !== "string" || !value.trim()) fail3("INVALID_INPUT", `${label} is required`);
};
var digest = (value) => hash(typeof value === "string" || Buffer.isBuffer(value) ? value : canonicalJson(value));
var sourceKey = (source) => `${source.kind}\0${source.map_id ?? source.id}`;
function confirmMigration(confirm) {
  if (confirm !== true) {
    fail3("AUTHORITY_REQUIRED", "confirm:true must explicitly acknowledge offline schema-5 migration");
  }
}
function nativeAbsolute(value, label) {
  if (typeof value !== "string" || !value.trim() || !isAbsolute(value) || /^(\\\\|\/\/)/.test(value)) {
    fail3("INVALID_INPUT", `${label} must be an absolute local path`);
  }
  const kind = /^[A-Za-z]:[\\/]/.test(value) ? "windows" : value.startsWith("/") ? "posix" : null;
  if (!kind || (process.platform === "win32" ? kind !== "windows" : kind !== "posix")) {
    fail3("INVALID_INPUT", `${label} must use the native absolute path form`);
  }
  return resolve(value);
}
function schema5InventoryPath(value, label) {
  if (typeof value !== "string" || value.includes("\\") || badPath(value) || !value.startsWith(".kai/") || value.split("/").some((segment) => segment === "" || segment === "." || segment === "..")) {
    fail3("RECOVERY_REQUIRED", `${label} is not a safe private relative path`);
  }
  return value;
}
function liveSchema5InventoryPath(root, value, label) {
  return safePath(root, schema5InventoryPath(value, label));
}
function stagedSchema5InventoryPath(lock, value, label) {
  value = schema5InventoryPath(value, label);
  const base = resolve(lock.stage_path, "schema5-files");
  const target = resolve(base, ...value.split("/"));
  if (escapesRoot(base, target) || !normalized(target).startsWith(`${normalized(base)}${sep}`)) {
    fail3("RECOVERY_REQUIRED", `${label} escapes the migration stage`);
  }
  if (existsSync(target) && pathHasLink(base, target)) {
    fail3("RECOVERY_REQUIRED", `${label} traverses a linked migration stage`);
  }
  return target;
}
function schema5ManifestBytes(candidateManifest2) {
  return Buffer.from(
    `${JSON.stringify(JSON.parse(canonicalJson(candidateManifest2)), null, 2)}
`
  );
}
function schema5InstalledInventory(worksheet, candidateManifest2) {
  const manifestBytes2 = schema5ManifestBytes(candidateManifest2);
  const authoredTargets = worksheet.authored_files.filter((entry) => entry.classification.action === "migrate").map((entry) => ({
    path: schema5InventoryPath(
      entry.classification.target,
      `authored target ${entry.classification.target}`
    ),
    type: "file",
    digest: entry.digest,
    size: entry.size
  })).sort((left, right) => left.path.localeCompare(right.path));
  if (new Set(authoredTargets.map((entry) => entry.path)).size !== authoredTargets.length) {
    fail3("RECOVERY_REQUIRED", "schema-5 installed inventory has duplicate targets");
  }
  return {
    schema_version: 1,
    manifest: {
      path: ".kai/manifest.json",
      type: "file",
      digest: hash(manifestBytes2),
      size: manifestBytes2.length
    },
    authored_targets: authoredTargets,
    database: {
      path: COORDINATION_DATABASE,
      type: "sqlite"
    }
  };
}
function migrationStateIdentity(state) {
  return {
    schema_version: state.schema_version,
    migration_id: state.id,
    worksheet_digest: state.worksheet_digest,
    backup_inventory_digest: state.worksheet.backup_inventory_digest,
    candidate_manifest_digest: digest(state.candidate_manifest),
    ready_digest: state.ready_digest,
    authorization_digest: state.authorization?.digest ?? null
  };
}
function receiptBasisFromPayload(payload) {
  return {
    schema_version: payload.schema_version,
    migration_id: payload.migration_id,
    workspace_id: payload.workspace_id,
    workspace_root: payload.workspace_root,
    source_manifest_digest: payload.source_manifest_digest,
    source_store_digest: payload.source_store_digest,
    worksheet_digest: payload.worksheet_digest,
    backup_inventory_digest: payload.backup_inventory_digest,
    ready_digest: payload.ready_digest,
    authorization_digest: payload.authorization_digest,
    backup_path: payload.backup_path,
    activated_manifest_digest: payload.activated_manifest_digest,
    activation_baseline: payload.activation_baseline,
    schema5_files: {
      schema_version: payload.schema5_files?.schema_version,
      manifest: payload.schema5_files?.manifest,
      authored_targets: payload.schema5_files?.authored_targets,
      database: {
        path: payload.schema5_files?.database?.path,
        type: payload.schema5_files?.database?.type
      }
    }
  };
}
function abandonAnchor({ state, receiptBasis, installedInventory }) {
  const stateIdentity = migrationStateIdentity(state);
  const payload = {
    schema_version: 1,
    migration_id: state.id,
    worksheet_digest: state.worksheet_digest,
    ready_digest: state.ready_digest,
    state_identity: stateIdentity,
    state_identity_digest: digest(stateIdentity),
    receipt_basis: receiptBasis,
    receipt_basis_digest: digest(receiptBasis),
    installed_inventory: installedInventory,
    installed_inventory_digest: digest(installedInventory)
  };
  return { payload, digest: digest(payload) };
}
function fsyncDirectory(path) {
  let fd;
  try {
    fd = openSync(path, "r");
    fsyncSync(fd);
  } catch (error) {
    if (!(/* @__PURE__ */ new Set(["EINVAL", "EPERM", "EACCES", "EBADF"])).has(error?.code)) throw error;
  } finally {
    if (fd !== void 0) closeSync(fd);
  }
}
function fsyncFile(path) {
  const mode = lstatSync(path).mode & 511;
  let fd;
  try {
    chmodSync(path, 384);
    fd = openSync(path, "r+");
    fsyncSync(fd);
  } finally {
    try {
      if (fd !== void 0) closeSync(fd);
    } finally {
      chmodSync(path, mode);
    }
  }
}
function fsyncParents(path, boundary) {
  let current = dirname(path);
  const stop = normalized(boundary);
  while (normalized(current).startsWith(stop)) {
    fsyncDirectory(current);
    if (normalized(current) === stop) break;
    const parent = dirname(current);
    if (parent === current) break;
    current = parent;
  }
}
function durableWrite(path, bytes, { exclusive = false } = {}) {
  mkdirSync(dirname(path), { recursive: true });
  const fd = openSync(path, exclusive ? "wx" : "w", 384);
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  fsyncDirectory(dirname(path));
}
function durableCopy(source, target) {
  mkdirSync(dirname(target), { recursive: true });
  const mode = lstatSync(source).mode & 511;
  copyFileSync(source, target, constants.COPYFILE_EXCL);
  chmodSync(target, 384);
  const fd = openSync(target, "r+");
  try {
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
  chmodSync(target, mode);
  fsyncDirectory(dirname(target));
}
function durableReplace(source, target, id) {
  mkdirSync(dirname(target), { recursive: true });
  const staged = `${target}.kai-restore-${id}`;
  try {
    if (existsSync(staged)) {
      const expected = fingerprintAbsolute(source);
      const actual = fingerprintAbsolute(staged);
      if (canonicalJson(actual) !== canonicalJson(expected)) {
        fail3("RECOVERY_REQUIRED", `staged restoration bytes changed: ${staged}`);
      }
    } else {
      durableCopy(source, staged);
    }
    renameSync(staged, target);
    fsyncFile(target);
    fsyncDirectory(dirname(target));
  } catch (error) {
    if (existsSync(staged)) {
      try {
        unlinkSync(staged);
        fsyncDirectory(dirname(staged));
      } catch {
      }
    }
    throw error;
  }
}
function fingerprintAbsolute(path) {
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1) {
    fail3("RECOVERY_REQUIRED", `migration source is not an exact unshared file: ${path}`);
  }
  const before = statSync(path);
  const bytes = readFileSync(path);
  const after = statSync(path);
  if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || bytes.length !== after.size) {
    fail3("RECOVERY_REQUIRED", `migration source changed while reading: ${path}`);
  }
  return { digest: hash(bytes), size: bytes.length };
}
function walkFiles(root, relativeRoot = "") {
  const absoluteRoot = relativeRoot ? join(root, ...relativeRoot.split("/")) : root;
  if (!existsSync(absoluteRoot)) return [];
  if (pathHasLink(root, absoluteRoot)) {
    fail3("INVALID_INPUT", `migration tree traverses a link: ${relativeRoot || root}`);
  }
  const files = [];
  function walk(absolute, relativePath) {
    const stat = lstatSync(absolute);
    if (stat.isSymbolicLink()) {
      fail3("INVALID_INPUT", `migration tree contains a symbolic link: ${relativePath}`);
    }
    if (stat.isDirectory()) {
      for (const entry of readdirSync(absolute).sort()) {
        walk(join(absolute, entry), relativePath ? `${relativePath}/${entry}` : entry);
      }
      return;
    }
    if (!stat.isFile() || stat.nlink !== 1) {
      fail3("RECOVERY_REQUIRED", `migration tree contains a nonregular or shared file: ${relativePath}`);
    }
    const fingerprint = fingerprintAbsolute(absolute);
    files.push({ path: relativePath, ...fingerprint });
  }
  walk(absoluteRoot, relativeRoot);
  return files;
}
function assertNoDatabaseSidecars(root) {
  for (const suffix of ["-wal", "-shm", "-journal"]) {
    const path = safePath(root, `${LEGACY_DATABASE}${suffix}`);
    if (existsSync(path)) {
      fail3(
        "RECOVERY_REQUIRED",
        `schema-4 database has live or unreconciled SQLite sidecar ${basename(path)}; reconcile it offline first`
      );
    }
  }
}
function databaseSnapshot(path) {
  const database = new DatabaseSync(path, { readOnly: true });
  try {
    database.exec("PRAGMA query_only=ON");
    const integrity = database.prepare("PRAGMA quick_check").get();
    if (integrity?.quick_check !== "ok") {
      fail3("RECOVERY_REQUIRED", "schema-4 coordination database integrity check failed");
    }
    const schemaVersion = database.prepare(
      "SELECT value FROM metadata WHERE key='schema_version'"
    ).get()?.value;
    if (!["1", "2"].includes(schemaVersion)) {
      fail3("SCHEMA_MISMATCH", `schema-4 store schema ${JSON.stringify(schemaVersion)} is unsupported`);
    }
    const tableNames = database.prepare(`
      SELECT name FROM sqlite_master
      WHERE type='table' AND name NOT LIKE 'sqlite_%'
      ORDER BY name
    `).all().map((row) => row.name);
    const tables = {};
    for (const table of tableNames) {
      if (!/^[a-z][a-z0-9_]*$/i.test(table)) {
        fail3("RECOVERY_REQUIRED", `schema-4 store has unsupported table name ${JSON.stringify(table)}`);
      }
      const order = SOURCE_TABLE_ORDER.get(table) ?? "rowid";
      tables[table] = database.prepare(
        `SELECT * FROM ${quoteIdentifier(table)} ORDER BY ${order}`
      ).all();
    }
    for (const required of ["metadata", "records", "events", "operations"]) {
      if (!Object.hasOwn(tables, required)) {
        fail3("RECOVERY_REQUIRED", `schema-4 store is missing table ${required}`);
      }
    }
    const snapshot = {
      store_schema_version: Number(schemaVersion),
      tables
    };
    return {
      path,
      snapshot,
      digest: digest(snapshot),
      file: fingerprintAbsolute(path)
    };
  } finally {
    database.close();
  }
}
function sourceDatabaseSnapshot(root) {
  assertNoDatabaseSidecars(root);
  const path = safePath(root, LEGACY_DATABASE);
  if (!existsSync(path)) {
    fail3("SCHEMA_MISMATCH", `schema-4 coordination database is missing at ${LEGACY_DATABASE}`);
  }
  exactFile(root, LEGACY_DATABASE);
  return databaseSnapshot(path);
}
function legacyRecord(row) {
  let body;
  try {
    body = JSON.parse(row.body);
  } catch {
    fail3("RECOVERY_REQUIRED", `schema-4 record ${row.kind}/${row.id} contains invalid JSON`);
  }
  const subjectKind = Object.hasOwn(row, "subject_kind") ? row.subject_kind : row.item_id == null ? null : "item";
  const subjectId = Object.hasOwn(row, "subject_id") ? row.subject_id : row.item_id;
  return {
    kind: row.kind,
    id: row.id,
    subject: subjectKind == null ? null : { kind: subjectKind, id: subjectId },
    version: Number(row.version),
    body
  };
}
function sourceDescriptor(record) {
  const lifecycle = record.kind === "initiative" ? record.body.status : record.body.state;
  const body = jsonClone(record.body);
  if (body.lease?.token) {
    body.lease = {
      holder: body.lease.holder,
      token_digest: digest(body.lease.token),
      version_at_grant: body.lease.version_at_grant,
      acquired_at: body.lease.acquired_at,
      expires_at: body.lease.expires_at
    };
  }
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    lifecycle,
    updated_at: record.body.updated_at ?? null,
    digest: digest(record),
    body
  };
}
function milestoneDescriptor(initiative, milestone) {
  const source = {
    kind: "milestone",
    id: milestone.id,
    map_id: `${initiative.id}/${milestone.id}`,
    version: 1,
    initiative_id: initiative.id,
    lifecycle: milestone.status,
    updated_at: initiative.body.updated_at,
    body: milestone
  };
  return { ...source, digest: digest(source) };
}
function ownerHint(path) {
  const segment = path.split("/")[1] ?? null;
  if (PACKS.has(segment)) return segment;
  if ((/* @__PURE__ */ new Set(["state", "runs", "review", "archive"])).has(segment)) return "core";
  return null;
}
function authoredCategory(path) {
  if (/^\.kai\/state\/(?:items|threads|initiatives)\//.test(path)) {
    return "coordination-source";
  }
  if (/^\.kai\/(?:runs|review|archive)\//.test(path)) return "runtime-history";
  return "authored";
}
function authoredFilesFromInventory(privateFiles) {
  return privateFiles.filter((entry) => entry.path !== ".kai/manifest.json" && entry.path !== LEGACY_DATABASE && !entry.path.startsWith(HOST_RUNTIME) && !new RegExp(`^${LEGACY_DATABASE.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}-(?:wal|shm|journal)$`).test(entry.path)).map(({ type, ...entry }) => ({
    ...entry,
    category: authoredCategory(entry.path),
    owner_hint: ownerHint(entry.path),
    classification: null
  }));
}
function configuredProjects(root, manifest) {
  if (!Array.isArray(manifest.projects) || manifest.projects.length === 0) {
    fail3("INVALID_INPUT", "schema-4 manifest requires project bindings");
  }
  return manifest.projects.map((project) => resolveConfiguredProject({
    workspaceRoot: root,
    manifest,
    projectId: project.id
  }));
}
function retainedPublications(root, manifest) {
  const rows = /* @__PURE__ */ new Map();
  for (const project of configuredProjects(root, manifest)) {
    for (const publicationRoot of /* @__PURE__ */ new Set([project.publicationRoot, "docs/kai"])) {
      for (const entry of walkFiles(project.projectRoot, publicationRoot)) {
        rows.set(`${project.project.id}\0${entry.path}`, {
          project_id: project.project.id,
          path: entry.path,
          digest: entry.digest,
          size: entry.size,
          classification: null
        });
      }
    }
  }
  return [...rows.values()].sort((left, right) => left.project_id.localeCompare(right.project_id) || left.path.localeCompare(right.path));
}
function backupInventory(root, manifest, env) {
  const privateFiles = snapshotPrivate(root).map((entry) => ({ ...entry, type: "file" }));
  const publicFiles = retainedPublications(root, manifest).map(({ classification, ...entry }) => ({ ...entry, type: "file" }));
  const registry = existsSync(registryPath(env)) ? {
    path: registryPath(env),
    ...fingerprintAbsolute(registryPath(env)),
    type: "file"
  } : null;
  return {
    schema_version: 1,
    private_files: privateFiles,
    public_files: publicFiles,
    registry,
    git_tracking: trackedPrivateFiles(root, manifest)
  };
}
function commandQuote(value) {
  return `"${String(value).replaceAll('"', '\\"')}"`;
}
function trackedPrivateFiles(root, manifest) {
  if (manifest.storage_mode === "external") return [];
  const project = configuredProjects(root, manifest).find((entry) => normalized(entry.projectRoot) === normalized(root));
  if (!project) return [];
  const result = workspaceGit(project.projectRoot, ["ls-files", "-z", "--", ".kai"]);
  if (result.status !== 0) {
    fail3("RECOVERY_REQUIRED", `cannot inspect tracked private files: ${result.stderr.trim()}`);
  }
  return result.stdout.split("\0").filter(Boolean).sort().map((path) => ({
    path: slash(path),
    command: `git -C ${commandQuote(project.projectRoot)} rm --cached -- ${commandQuote(slash(path))}`
  }));
}
function activeWork(records) {
  const rows = [];
  for (const record of records) {
    let reasons = [];
    if ((/* @__PURE__ */ new Set(["item", "task"])).has(record.kind)) {
      if (record.body.lease !== null) reasons.push("active lease");
      if (NONTERMINAL_TASK_STATES.has(record.body.state)) {
        reasons.push(`nonterminal state ${record.body.state}`);
      }
      if (record.body.recovery_hold !== null) reasons.push("active recovery hold");
      if (record.body.waiting_on_questions?.length) reasons.push("unresolved blocking questions");
      if (record.body.producer_actor !== null && !(/* @__PURE__ */ new Set(["completed", "shipped", "dropped"])).has(record.body.state)) {
        reasons.push("active producer");
      }
    } else if (record.kind === "grant") {
      if (record.body.status === "active") reasons.push("active grant");
    } else if (record.kind === "question") {
      if (record.body.status === "open") {
        const subject = record.body.subject ?? record.subject;
        reasons.push(
          `open ${record.body.blocking === true ? "blocking" : "nonblocking"} question on ${subject?.kind ?? "unknown"}/${subject?.id ?? "unknown"}`
        );
      }
    } else if (record.kind === "host-attempt") {
      if (!(/* @__PURE__ */ new Set(["completed", "failed"])).has(record.body.status)) reasons.push(`host attempt ${record.body.status}`);
    } else if (record.kind === "effect") {
      if (!(/* @__PURE__ */ new Set(["succeeded", "not-applied"])).has(record.body.outcome)) reasons.push(`effect ${record.body.outcome}`);
    }
    reasons = [...new Set(reasons)].sort();
    if (reasons.length) {
      rows.push({
        source: {
          kind: record.kind,
          id: record.id,
          version: record.version
        },
        reasons,
        resolution: null
      });
    }
  }
  return rows.sort((left, right) => left.source.kind.localeCompare(right.source.kind) || left.source.id.localeCompare(right.source.id));
}
function directionForManifest(root, manifest) {
  const selected = manifest.projects.length === 1 ? manifest.projects[0] : manifest.projects.find((project) => project?.id === "default");
  if (!selected) {
    fail3("INVALID_INPUT", "schema-4 migration requires one project or an explicit default project for Direction");
  }
  const direction = readDirection({
    workspaceRoot: root,
    manifest: {
      projects: [{
        ...selected,
        publication_root: "docs/kai"
      }]
    }
  });
  return {
    path: direction.path,
    hash: direction.hash,
    goal: direction.goal
  };
}
function manifestBytes(root) {
  return exactFile(root, ".kai/manifest.json");
}
function worksheetFromSource({
  manifestDigest,
  store,
  directionRef,
  inventory
}) {
  const records = store.snapshot.tables.records.map(legacyRecord);
  const initiatives = records.filter((record) => record.kind === "initiative").sort((left, right) => left.id.localeCompare(right.id));
  const typedEpics = records.filter((record) => record.kind === "epic").sort((left, right) => left.id.localeCompare(right.id));
  const typedMilestones = records.filter((record) => (/* @__PURE__ */ new Set(["feature", "requirement"])).has(record.kind)).sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
  const items = records.filter((record) => (/* @__PURE__ */ new Set(["item", "task"])).has(record.kind)).sort((left, right) => left.id.localeCompare(right.id));
  const existing = new Set(records.map((record) => `${record.kind}\0${record.id}`));
  const supplemental = legacyClassificationSources(
    store.snapshot.tables.legacy_sources ?? [],
    existing
  );
  const epics = [
    ...initiatives.map((record) => sourceDescriptor(record)),
    ...typedEpics.map((record) => sourceDescriptor(record)),
    ...supplemental.filter((source) => source.kind === "initiative")
  ].sort((left, right) => left.id.localeCompare(right.id)).map((source) => ({
    source,
    classification: null
  }));
  const milestones = [
    ...initiatives.flatMap((initiative) => initiative.body.milestones.map((milestone) => milestoneDescriptor(initiative, milestone))),
    ...typedMilestones.map((record) => sourceDescriptor(record))
  ].map((source) => ({ source, classification: null })).sort((left, right) => left.source.id.localeCompare(right.source.id) || (left.source.initiative_id ?? "").localeCompare(
    right.source.initiative_id ?? ""
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
    placement: { target: null, project_binding: null },
    backup_root: null,
    epics,
    milestones,
    items: [
      ...items.map((record) => sourceDescriptor(record)),
      ...supplemental.filter((source) => source.kind === "item")
    ].sort((left, right) => left.id.localeCompare(right.id)).map((source) => ({
      source,
      classification: null
    })),
    authored_files: authoredFilesFromInventory(inventory.private_files),
    retained_publications: inventory.public_files.map(({ type, ...entry }) => ({
      ...entry,
      classification: null
    })),
    active_work: activeWork(records),
    untracking: jsonClone(inventory.git_tracking)
  };
}
function buildMigrationWorksheet({ root, env = process.env } = {}) {
  const manifest = migrationManifest(root, [4], env);
  const store = sourceDatabaseSnapshot(root);
  const inventory = backupInventory(root, manifest, env);
  assertNoDatabaseSidecars(root);
  const manifestEntry = inventory.private_files.find((entry) => entry.path === ".kai/manifest.json");
  const databaseEntry = inventory.private_files.find((entry) => entry.path === LEGACY_DATABASE);
  if (manifestEntry?.digest !== hash(manifestBytes(root)) || databaseEntry?.digest !== store.file.digest || databaseEntry?.size !== store.file.size) {
    fail3("RECOVERY_REQUIRED", "schema-4 source changed while building the migration plan");
  }
  return worksheetFromSource({
    manifestDigest: manifestEntry.digest,
    store,
    directionRef: directionForManifest(root, manifest),
    inventory
  });
}
function resetWorksheet(worksheet) {
  const reset = jsonClone(worksheet);
  reset.placement = { target: null, project_binding: null };
  reset.backup_root = null;
  for (const collection of ["epics", "milestones", "items"]) {
    for (const entry of reset[collection]) entry.classification = null;
  }
  for (const entry of reset.authored_files) entry.classification = null;
  for (const entry of reset.retained_publications) entry.classification = null;
  for (const entry of reset.active_work) entry.resolution = null;
  return reset;
}
function candidateManifest(root, source, placement) {
  return {
    plugin: "kai-core",
    version: source.version,
    schema_version: WORKSPACE_SCHEMA_VERSION,
    scaffolded: source.scaffolded,
    workspace_id: source.workspace_id,
    placement: placement.target,
    workspace_root: placement.target === "external" ? resolve(root) : ".",
    private_root: PRIVATE_ROOT,
    direction: DIRECTION_PATH,
    projects: [{
      id: placement.project_binding.id,
      path: placement.project_binding.path,
      publication_root: placement.project_binding.publication_root
    }]
  };
}
function validatePlacement(root, sourceManifest, worksheet, env) {
  exactKeys(worksheet.placement, /* @__PURE__ */ new Set(["target", "project_binding"]), "worksheet.placement");
  if (!(/* @__PURE__ */ new Set(["repo-local", "external"])).has(worksheet.placement.target)) {
    fail3("INVALID_INPUT", "worksheet placement target must explicitly be repo-local or external");
  }
  const binding = worksheet.placement.project_binding;
  exactKeys(
    binding,
    /* @__PURE__ */ new Set(["id", "path", "publication_root", "registry_digest"]),
    "worksheet.placement.project_binding"
  );
  requiredText(binding.id, "project binding id");
  requiredText(binding.path, "project binding path");
  if (binding.publication_root !== "docs/kai") {
    fail3("INVALID_INPUT", "schema-5 project publication_root must be exactly docs/kai");
  }
  if (worksheet.placement.target === "repo-local") {
    if (binding.path !== "." || binding.registry_digest !== null) {
      fail3("INVALID_INPUT", 'repo-local placement requires path "." and null registry digest');
    }
  } else {
    nativeAbsolute(binding.path, "external project binding path");
    requiredText(binding.registry_digest, "external registry digest");
    const registry = registryPath(env);
    if (!existsSync(registry) || hash(readFileSync(registry)) !== binding.registry_digest) {
      fail3("RECOVERY_REQUIRED", "external workspace registry digest changed; create a fresh worksheet and capability");
    }
    const loaded = loadWorkspaceRegistry(env);
    if (!loaded.ok) fail3("INVALID_INPUT", loaded.reason);
  }
  const manifest = candidateManifest(root, sourceManifest, worksheet.placement);
  const validation = validateSchema5Manifest(root, manifest, { env });
  if (validation.errors.length) fail3("INVALID_INPUT", validation.errors.join("; "));
  const privacy = inspectGitPrivacy(root, manifest.placement);
  const privacyErrors = [
    ...privacy.errors,
    ...privacy.missing.map((path) => `private path is not ignored: ${path}`)
  ];
  if (manifest.placement === "repo-local" && !privacy.gitRoot) {
    privacyErrors.push("repo-local placement requires a readable Git work tree");
  }
  if (privacyErrors.length) fail3("INVALID_INPUT", privacyErrors.join("; "));
  return {
    manifest,
    projects: validation.projects,
    direction: readDirection({ workspaceRoot: root, manifest })
  };
}
function validateBackupRoot(root, projects, value) {
  const backupRoot = nativeAbsolute(value, "worksheet backup_root");
  if (!existsSync(backupRoot) || !lstatSync(backupRoot).isDirectory() || pathHasLink(backupRoot, backupRoot) || !exactPath(backupRoot)) {
    fail3("INVALID_INPUT", "worksheet backup_root must be an existing exact unlinked directory");
  }
  for (const tree of [root, ...projects.map((project) => project.projectRoot)]) {
    if (!escapesRoot(tree, backupRoot) || !escapesRoot(backupRoot, tree)) {
      fail3("INVALID_INPUT", "worksheet backup_root must resolve outside workspace and project trees");
    }
  }
  return backupRoot;
}
function knownRole(role, roles) {
  return role === "operator" || roles.includes(role);
}
function recordRoles(record) {
  const body = record.body;
  const roles = [];
  for (const key of ["owner", "scope_authority", "completion_authority", "next_role", "validity_owner"]) {
    if (typeof body[key] === "string" && body[key]) roles.push([key, body[key]]);
  }
  for (const actor of [
    body.producer_actor,
    body.acceptance_actor,
    ...body.producing_actors ?? []
  ].filter(Boolean)) roles.push(["actor", actor.role]);
  for (const review of body.review_requirements ?? []) roles.push(["review role", review.role]);
  return roles;
}
function validateClassification(entry, collection, records, roles, worksheet) {
  const classification = entry.classification;
  exactKeys(
    classification,
    /* @__PURE__ */ new Set(["disposition", "primary", "records", "reason"]),
    `${collection} ${entry.source.id} classification`
  );
  requiredText(classification.reason, `${collection} ${entry.source.id} classification reason`);
  if (!(/* @__PURE__ */ new Set(["mapped", "historical-only", "direction-only"])).has(classification.disposition)) {
    fail3("INVALID_INPUT", `${collection} ${entry.source.id} has unsupported disposition`);
  }
  if (classification.disposition !== "mapped") {
    if (classification.primary !== null || !Array.isArray(classification.records) || classification.records.length !== 0) {
      fail3("INVALID_INPUT", `${collection} ${entry.source.id} historical/direction disposition cannot create records`);
    }
    if (classification.disposition === "direction-only" && collection !== "epics") {
      fail3("INVALID_INPUT", "only an initiative source may be classified as direction-only");
    }
    return null;
  }
  if (entry.source.record_available === false) {
    fail3(
      "INVALID_INPUT",
      `${collection} ${entry.source.id} has ambiguous legacy metadata and may only be classified historical-only`
    );
  }
  exactKeys(classification.primary, /* @__PURE__ */ new Set(["kind", "id"]), "classification primary");
  const allowed = collection === "epics" ? /* @__PURE__ */ new Set(["epic"]) : collection === "milestones" ? /* @__PURE__ */ new Set(["epic", "feature", "requirement"]) : /* @__PURE__ */ new Set(["requirement", "task"]);
  if (!allowed.has(classification.primary.kind)) {
    fail3("INVALID_INPUT", `${collection} ${entry.source.id} cannot map to ${classification.primary.kind}`);
  }
  if (!Array.isArray(classification.records) || classification.records.length === 0) {
    fail3("INVALID_INPUT", `${collection} ${entry.source.id} mapped classification requires records`);
  }
  let primary = null;
  for (const raw of classification.records) {
    const record = validateRecord(jsonClone(raw));
    if (!HIERARCHY_KINDS.has(record.kind)) {
      fail3("INVALID_INPUT", "migration classification may create only hierarchy records");
    }
    const key = `${record.kind}\0${record.id}`;
    if (records.has(key)) fail3("INVALID_INPUT", `duplicate migration target ${record.kind}/${record.id}`);
    records.set(key, record);
    if (record.kind === classification.primary.kind && record.id === classification.primary.id) {
      primary = record;
    }
    for (const [label, role] of recordRoles(record)) {
      if (!knownRole(role, roles)) {
        fail3("ROLE_UNAVAILABLE", `${record.kind}/${record.id} ${label} role is unavailable: ${role}`);
      }
    }
    if (record.kind === "epic" && canonicalJson(record.body.direction_ref) !== canonicalJson(worksheet.direction_ref)) {
      fail3("INVALID_INPUT", `epic/${record.id} has stale Direction binding`);
    }
    if (record.kind === "task" && record.body.acceptance_actor !== null) {
      fail3("INVALID_INPUT", "historical schema-4 acceptance cannot become current Task acceptance");
    }
  }
  if (!primary) fail3("INVALID_INPUT", `${collection} ${entry.source.id} primary target is absent`);
  if (primary.version !== entry.source.version) {
    fail3("INVALID_INPUT", `${collection} ${entry.source.id} primary target must preserve source version`);
  }
  if (entry.source.updated_at !== null && primary.body.updated_at !== entry.source.updated_at) {
    fail3("INVALID_INPUT", `${collection} ${entry.source.id} primary target must preserve source updated_at`);
  }
  if (TERMINAL_SOURCE_STATES.has(entry.source.lifecycle) && primary.body.state !== "proposed") {
    fail3(
      "INVALID_INPUT",
      `${collection} ${entry.source.id} historical terminal state cannot become current acceptance; map a proposed counterpart or keep it historical-only`
    );
  }
  return primary;
}
function validateAuthoredFiles(worksheet) {
  const targets = /* @__PURE__ */ new Set();
  const sourcePaths = new Set(worksheet.authored_files.map((entry) => entry.path));
  for (const entry of worksheet.authored_files) {
    const classification = entry.classification;
    exactKeys(
      classification,
      /* @__PURE__ */ new Set(["action", "pack", "target", "ownership_basis"]),
      `authored file ${entry.path} classification`
    );
    if (!(/* @__PURE__ */ new Set(["migrate", "provenance-only"])).has(classification.action)) {
      fail3("INVALID_INPUT", `authored file ${entry.path} needs migrate or provenance-only action`);
    }
    if (!PACKS.has(classification.pack)) {
      fail3("INVALID_INPUT", `authored file ${entry.path} has unknown or incubated pack ownership`);
    }
    requiredText(classification.ownership_basis, `authored file ${entry.path} ownership basis`);
    if (classification.action === "provenance-only") {
      if (classification.target !== null) {
        fail3("INVALID_INPUT", `provenance-only authored file ${entry.path} cannot have a target`);
      }
      continue;
    }
    requiredText(classification.target, `authored file ${entry.path} target`);
    const target = classification.target.replaceAll("\\", "/");
    const segments = target.split("/");
    if (badPath(target) || !target.startsWith(`.kai/${classification.pack}/`) || target.startsWith(".kai/core/runtime/") || FORBIDDEN_SCHEMA5_ROOTS.some((root) => target === root || target.startsWith(`${root}/`)) || !(/* @__PURE__ */ new Set([6, 7])).has(segments.length) || !ACTIVE_ARTIFACT_LIFECYCLES.has(segments.at(-2))) {
      fail3("INVALID_INPUT", `authored file ${entry.path} has unsafe or untyped schema-5 target`);
    }
    if (target === entry.path) {
      fail3("INVALID_INPUT", `authored file ${entry.path} must move to an explicit schema-5 typed path`);
    }
    if (sourcePaths.has(target)) {
      fail3("INVALID_INPUT", `authored file target already belongs to another schema-4 source: ${target}`);
    }
    if (targets.has(target)) fail3("INVALID_INPUT", `duplicate authored file target ${target}`);
    targets.add(target);
  }
}
function validateRetainedPublications(worksheet) {
  for (const entry of worksheet.retained_publications) {
    exactKeys(
      entry.classification,
      /* @__PURE__ */ new Set(["action", "reason"]),
      `retained publication ${entry.path} classification`
    );
    if (entry.classification.action !== "retain-in-place") {
      fail3("INVALID_INPUT", `accepted publication ${entry.path} must remain in place`);
    }
    requiredText(entry.classification.reason, `retained publication ${entry.path} reason`);
  }
}
function validateActiveWork(worksheet, primaryTargets) {
  for (const entry of worksheet.active_work) {
    if (entry.resolution === null) {
      fail3(
        "RECOVERY_REQUIRED",
        `active work ${entry.source.kind}/${entry.source.id} requires explicit reconciliation`
      );
    }
    exactKeys(
      entry.resolution,
      /* @__PURE__ */ new Set([
        "status",
        "state",
        "lease",
        "grants",
        "recovery",
        "production",
        "reason"
      ]),
      `active work ${entry.source.kind}/${entry.source.id} resolution`
    );
    if (entry.resolution.status !== "reconciled" || !(/* @__PURE__ */ new Set(["quiesced", "terminal", "none"])).has(entry.resolution.state) || !(/* @__PURE__ */ new Set(["released", "expired", "none"])).has(entry.resolution.lease) || !(/* @__PURE__ */ new Set(["revoked", "expired", "none"])).has(entry.resolution.grants) || !(/* @__PURE__ */ new Set(["resolved", "abandoned", "none"])).has(entry.resolution.recovery) || !(/* @__PURE__ */ new Set(["completed", "abandoned", "none"])).has(entry.resolution.production)) {
      fail3("RECOVERY_REQUIRED", `active work ${entry.source.kind}/${entry.source.id} is not reconciled`);
    }
    const reasons = entry.reasons.join("\n");
    if (/state|producer|question/i.test(reasons) && entry.resolution.state === "none") {
      fail3("RECOVERY_REQUIRED", `active work ${entry.source.kind}/${entry.source.id} state is not quiesced`);
    }
    if (/lease/i.test(reasons) && entry.resolution.lease === "none") {
      fail3("RECOVERY_REQUIRED", `active work ${entry.source.kind}/${entry.source.id} lease is not reconciled`);
    }
    if (/grant/i.test(reasons) && entry.resolution.grants === "none") {
      fail3("RECOVERY_REQUIRED", `active work ${entry.source.kind}/${entry.source.id} grant is not reconciled`);
    }
    if (/recovery/i.test(reasons) && entry.resolution.recovery === "none") {
      fail3("RECOVERY_REQUIRED", `active work ${entry.source.kind}/${entry.source.id} recovery is not reconciled`);
    }
    if (/deploy|production|host attempt|effect/i.test(reasons) && entry.resolution.production === "none") {
      fail3("RECOVERY_REQUIRED", `active work ${entry.source.kind}/${entry.source.id} production is not reconciled`);
    }
    requiredText(entry.resolution.reason, "active work reconciliation reason");
    const primary = primaryTargets.get(sourceKey(entry.source));
    if ((/* @__PURE__ */ new Set(["item", "task"])).has(entry.source.kind) && primary?.kind === "task") {
      if (primary.body.lease !== null || primary.body.producer_actor !== null || primary.body.producing_actors.length || primary.body.recovery_hold !== null || primary.body.waiting_on_questions.length || QUIESCENCE_TARGET_STATES.has(primary.body.state)) {
        fail3("RECOVERY_REQUIRED", `active work ${entry.source.id} target retains in-flight state`);
      }
    }
  }
}
function validateTaskDependencies(records) {
  for (const record of records.values()) {
    if (record.kind !== "task") continue;
    for (const dependency of record.body.depends_on) {
      if (!records.has(`task\0${dependency.task}`)) {
        fail3("INVALID_INPUT", `task/${record.id} has unresolved dependency ${dependency.task}`);
      }
    }
  }
}
function validateMappedLegacyDependencies(worksheet, primaryTargets) {
  const items = new Map(
    worksheet.items.map((entry) => [`${entry.source.kind}\0${entry.source.id}`, entry])
  );
  for (const entry of worksheet.items) {
    const target = primaryTargets.get(sourceKey(entry.source));
    if (target?.kind !== "task" || !Array.isArray(entry.source.body?.depends_on)) continue;
    const expected = entry.source.body.depends_on.map((dependency) => {
      const sourceKind = Object.hasOwn(dependency, "item") ? "item" : Object.hasOwn(dependency, "task") ? "task" : null;
      if (sourceKind === null || typeof dependency[sourceKind] !== "string" || typeof dependency.requires !== "string" || Object.keys(dependency).some((key) => !(/* @__PURE__ */ new Set([sourceKind, "requires"])).has(key))) {
        fail3(
          "INVALID_INPUT",
          `${entry.source.kind} ${entry.source.id} has an invalid dependency source form`
        );
      }
      const sourceId = dependency[sourceKind];
      const sourceDependency = items.get(`${sourceKind}\0${sourceId}`);
      const mapped = sourceDependency ? primaryTargets.get(sourceKey(sourceDependency.source)) : null;
      if (mapped?.kind !== "task") {
        fail3(
          "INVALID_INPUT",
          `${entry.source.kind} ${entry.source.id} dependency ${sourceId} must map to a Task`
        );
      }
      return { task: mapped.id, requires: dependency.requires };
    });
    if (canonicalJson(target.body.depends_on) !== canonicalJson(expected)) {
      fail3("INVALID_INPUT", `task/${target.id} must preserve every schema-4 dependency mapping`);
    }
  }
}
function validateWorksheetAgainstSource({
  root,
  worksheet,
  roles = [],
  env = process.env,
  fresh,
  sourceManifest
} = {}) {
  exactKeys(worksheet, new Set(WORKSHEET_KEYS), "migration worksheet");
  if (worksheet.schema_version !== 1 || worksheet.source_workspace_schema !== 4) {
    fail3("SCHEMA_MISMATCH", "migration worksheet must describe schema 4 with worksheet schema 1");
  }
  if (worksheet.backup_inventory?.schema_version !== 1 || digest(worksheet.backup_inventory) !== worksheet.backup_inventory_digest) {
    fail3("RECOVERY_REQUIRED", "migration worksheet backup inventory binding is invalid");
  }
  if (!Array.isArray(roles) || roles.some((role) => typeof role !== "string")) {
    fail3("INVALID_INPUT", "installed migration roles must be explicit strings");
  }
  if (existsSync(safePath(root, COORDINATION_DATABASE))) {
    fail3(
      "RECOVERY_REQUIRED",
      `unexpected schema-5 database already exists at ${COORDINATION_DATABASE}; reconcile it before creating a worksheet`
    );
  }
  if (canonicalJson(resetWorksheet(worksheet)) !== canonicalJson(fresh)) {
    fail3("RECOVERY_REQUIRED", "schema-4 source, Direction, publications, Git tracking, or store changed; create a fresh worksheet and capability");
  }
  if (fresh.untracking.length) {
    const commands = fresh.untracking.map((entry) => entry.command).join("\n");
    fail3(
      "RECOVERY_REQUIRED",
      `tracked private files must be untracked by the operator; Kai will not run Git mutations.
${commands}
Run migration-plan again and request a fresh worksheet/capability.`
    );
  }
  const placement = validatePlacement(root, sourceManifest, worksheet, env);
  const sourceProjects = configuredProjects(root, sourceManifest);
  const selectedSourceProjects = sourceProjects.filter((project) => project.project.id === placement.projects[0].project.id && normalized(project.projectRoot) === normalized(placement.projects[0].projectRoot));
  if (selectedSourceProjects.length !== 1) {
    fail3(
      "INVALID_INPUT",
      "schema-5 project binding must explicitly select one existing schema-4 project; relocate first, then create a fresh worksheet"
    );
  }
  const backupRoot = validateBackupRoot(
    root,
    [...sourceProjects, ...placement.projects],
    worksheet.backup_root
  );
  const currentDirection = {
    path: placement.direction.path,
    hash: placement.direction.hash,
    goal: placement.direction.goal
  };
  if (canonicalJson(currentDirection) !== canonicalJson(worksheet.direction_ref)) {
    fail3("RECOVERY_REQUIRED", "worksheet Direction binding is stale; create a fresh worksheet and capability");
  }
  const records = /* @__PURE__ */ new Map();
  const primaryTargets = /* @__PURE__ */ new Map();
  for (const collection of ["epics", "milestones", "items"]) {
    for (const entry of worksheet[collection]) {
      if (entry.classification === null) {
        fail3("INVALID_INPUT", `${collection} source ${entry.source.id} is unclassified`);
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
    primaryTargets
  };
}
function validateMigrationWorksheet({
  root,
  worksheet,
  roles = [],
  env = process.env
} = {}) {
  const sourceManifest = migrationManifest(root, [4], env);
  return validateWorksheetAgainstSource({
    root,
    worksheet,
    roles,
    env,
    sourceManifest,
    fresh: buildMigrationWorksheet({ root, env })
  });
}
function v5MigrationLockPath(root) {
  return schema5MigrationLockPath(root);
}
function v5StagePath(root, id) {
  const resolved = canonicalPath(root);
  return join(dirname(resolved), `.${basename(resolved)}.kai-stage-${id}`);
}
function readJson(path, label) {
  try {
    return JSON.parse(readFileSync(path, "utf8"));
  } catch (error) {
    fail3("RECOVERY_REQUIRED", `${label} is missing or invalid: ${error.message}`);
  }
}
function migrationAuthorizationDescriptor(root, capabilityId) {
  if (typeof capabilityId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(capabilityId)) {
    fail3("AUTHORITY_REQUIRED", "migration authorization requires an issued capability UUID");
  }
  const sources = [
    {
      kind: "request",
      source: `${HOST_RUNTIME}requests/${capabilityId}.json`,
      backup: "authorization/request.json"
    },
    {
      kind: "capability",
      source: `${HOST_RUNTIME}capabilities/${capabilityId}.json`,
      backup: "authorization/capability.json"
    },
    {
      kind: "issuer-key",
      source: `${HOST_RUNTIME}key`,
      backup: "authorization/issuer-key"
    }
  ].map((entry) => ({
    ...entry,
    ...fileFingerprint(root, entry.source),
    type: "file"
  }));
  let request;
  let capability;
  try {
    request = JSON.parse(exactFile(root, sources[0].source));
    capability = JSON.parse(exactFile(root, sources[1].source));
  } catch {
    fail3("AUTHORITY_REQUIRED", "migration authorization records are malformed");
  }
  if (!request?.payload || typeof request.mac !== "string" || !capability?.payload || typeof capability.mac !== "string" || capability.payload.request?.nonce !== capabilityId || request.payload.nonce !== capabilityId) {
    fail3("AUTHORITY_REQUIRED", "migration authorization records are malformed or mismatched");
  }
  const key = exactFile(root, sources[2].source);
  const signed = (envelope) => {
    if (!/^[a-f0-9]{64}$/.test(envelope.mac)) return false;
    const expected = createHmac("sha256", key).update(canonicalJson(envelope.payload)).digest();
    return timingSafeEqual(expected, Buffer.from(envelope.mac, "hex"));
  };
  if (key.length !== 32 || !signed(request) || !signed(capability)) {
    fail3("AUTHORITY_REQUIRED", "migration authorization signatures are invalid");
  }
  const payload = {
    schema_version: 1,
    capability_id: capabilityId,
    files: sources,
    request_payload_digest: digest(request.payload),
    capability_payload_digest: digest(capability.payload),
    authorization_receipt_digest: digest(capability.payload.receipt),
    signing: {
      algorithm: "hmac-sha256",
      key_digest: sources[2].digest,
      request_mac: request.mac,
      capability_mac: capability.mac
    }
  };
  return { payload, digest: digest(payload) };
}
function lockMigration(root, state) {
  const path = v5MigrationLockPath(root);
  try {
    durableWrite(path, canonicalJson(state), { exclusive: true });
  } catch (error) {
    if (error.code === "EEXIST") {
      fail3("RECOVERY_REQUIRED", "incomplete or competing schema-5 migration requires explicit recovery");
    }
    throw error;
  }
  return path;
}
function recoveryOperation(payload) {
  return { payload, digest: digest(payload) };
}
function validateRecoveryOperation(lock) {
  if (lock.operation === void 0) return null;
  const operation = lock.operation;
  const payload = operation?.payload;
  if (!operation || typeof operation !== "object" || Array.isArray(operation) || canonicalJson(Object.keys(operation).sort()) !== canonicalJson(["digest", "payload"]) || !payload || typeof payload !== "object" || Array.isArray(payload) || operation.digest !== digest(payload) || payload.schema_version !== 1 || payload.lock_id !== lock.id || !(/* @__PURE__ */ new Set(["abandon", "rollback"])).has(payload.kind) || payload.worksheet_digest !== lock.worksheet_digest || payload.backup_inventory_digest !== lock.backup_inventory_digest) {
    fail3("RECOVERY_REQUIRED", "schema-5 recovery operation journal is invalid");
  }
  if (payload.kind === "abandon") {
    if (canonicalJson(Object.keys(payload).sort()) !== canonicalJson([
      "backup_inventory_digest",
      "installed_database",
      "installed_targets",
      "kind",
      "lock_id",
      "schema_version",
      "worksheet_digest"
    ]) || lock.rollback === true || !Array.isArray(payload.installed_targets) || payload.installed_database !== null && typeof payload.installed_database !== "object") {
      fail3("RECOVERY_REQUIRED", "schema-5 abandon operation journal is invalid");
    }
  } else if (canonicalJson(Object.keys(payload).sort()) !== canonicalJson([
    "backup_inventory_digest",
    "kind",
    "lock_id",
    "migration_id",
    "receipt_digest",
    "rollback_id",
    "schema_version",
    "worksheet_digest"
  ]) || typeof payload.migration_id !== "string" || !/^[0-9a-f-]{36}$/i.test(payload.rollback_id) || !/^[a-f0-9]{64}$/.test(payload.receipt_digest)) {
    fail3("RECOVERY_REQUIRED", "schema-5 rollback operation journal is invalid");
  }
  return payload;
}
function bindRecoveryOperation(path, lock, payload) {
  if (lock.operation !== void 0) {
    const existing = validateRecoveryOperation(lock);
    if (canonicalJson(existing) !== canonicalJson(payload)) {
      fail3("RECOVERY_REQUIRED", "schema-5 recovery operation journal changed");
    }
    return existing;
  }
  if (canonicalJson(readJson(path, "schema-5 migration lock")) !== canonicalJson(lock)) {
    fail3("RECOVERY_REQUIRED", "schema-5 migration lock changed before recovery intent was recorded");
  }
  const next = { ...lock, operation: recoveryOperation(payload) };
  const staged = `${path}.operation-${randomUUID()}`;
  try {
    durableWrite(staged, canonicalJson(next), { exclusive: true });
    renameSync(staged, path);
    fsyncDirectory(dirname(path));
  } finally {
    rmSync(staged, { force: true });
  }
  lock.operation = next.operation;
  return payload;
}
function drainNativeWriterTokens(root, { timeoutMs = 3e4 } = {}) {
  const canonical = canonicalPath(root);
  const parent = dirname(canonical);
  const prefix = nativeWriterTokenPrefix(root);
  const deadline = Date.now() + timeoutMs;
  const wait = new Int32Array(new SharedArrayBuffer(4));
  while (true) {
    const names = readdirSync(parent).filter((name) => name.startsWith(prefix) && name.endsWith(".lock")).sort();
    if (names.length === 0) return;
    for (const name of names) {
      const id = name.slice(prefix.length, -".lock".length);
      if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
        fail3("RECOVERY_REQUIRED", `unrecognized native writer token: ${name}`);
      }
      const path = join(parent, name);
      let stat;
      try {
        stat = lstatSync(path);
      } catch (error) {
        if (error.code === "ENOENT") continue;
        throw error;
      }
      if (!stat.isFile() || stat.nlink !== 1 || pathHasLink(parent, path) || !exactPath(path)) {
        fail3("RECOVERY_REQUIRED", `native writer token changed type or identity: ${name}`);
      }
      let token;
      try {
        token = JSON.parse(readFileSync(path, "utf8"));
      } catch (error) {
        if (error.code === "ENOENT") continue;
        fail3("RECOVERY_REQUIRED", `native writer token is malformed: ${name}`);
      }
      if (!token || typeof token !== "object" || Array.isArray(token) || canonicalJson(Object.keys(token).sort()) !== canonicalJson([
        "created_at",
        "id",
        "pid",
        "root",
        "schema_version"
      ]) || token.schema_version !== 1 || token.id !== id || normalized(token.root) !== normalized(canonical) || !Number.isSafeInteger(token.pid) || token.pid < 1 || Number.isNaN(Date.parse(token.created_at))) {
        fail3("RECOVERY_REQUIRED", `native writer token binding is invalid: ${name}`);
      }
    }
    if (Date.now() >= deadline) {
      fail3("STORE_BUSY", "native host writers did not drain before rollback");
    }
    Atomics.wait(wait, 0, 0, 10);
  }
}
function readLock(root) {
  const path = v5MigrationLockPath(root);
  if (!existsSync(path)) fail3("RECOVERY_REQUIRED", "no interrupted schema-5 migration lock exists");
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1 || pathHasLink(dirname(path), path) || !exactPath(path)) {
    fail3("RECOVERY_REQUIRED", "schema-5 migration lock is linked, shared, or aliased");
  }
  const lock = readJson(path, "schema-5 migration lock");
  if (lock.schema_version !== 1 || normalized(lock.root) !== normalized(canonicalPath(root)) || !/^[0-9a-f-]{36}$/i.test(lock.id) || typeof lock.backup_path !== "string" || typeof lock.stage_path !== "string" || !/^[a-f0-9]{64}$/.test(lock.worksheet_digest) || !/^[a-f0-9]{64}$/.test(lock.backup_inventory_digest) || lock.authorization_digest !== null && !/^[a-f0-9]{64}$/.test(lock.authorization_digest)) {
    fail3("RECOVERY_REQUIRED", "schema-5 migration lock is unrecognized");
  }
  if (lock.pid !== process.pid) {
    try {
      process.kill(lock.pid, 0);
      fail3("STORE_BUSY", "schema-5 migration owner process is still active");
    } catch (error) {
      if (error.code !== "ESRCH") throw error;
    }
  }
  validateRecoveryOperation(lock);
  return { path, lock };
}
function writeState(lock, state) {
  durableWrite(join(lock.backup_path, "state.json"), canonicalJson(state));
}
function readState(lock) {
  return readJson(join(lock.backup_path, "state.json"), "schema-5 migration state");
}
function verifyStateBinding(lock, state) {
  if (state.schema_version !== 1 || state.id !== lock.id || state.worksheet_digest !== lock.worksheet_digest || digest(state.worksheet) !== state.worksheet_digest || state.worksheet.backup_inventory_digest !== lock.backup_inventory_digest || (state.authorization?.digest ?? null) !== (lock.authorization_digest ?? null) || typeof state.ready_digest !== "string") {
    fail3("RECOVERY_REQUIRED", "schema-5 migration state no longer matches its lock, worksheet, or verified backup");
  }
  const ready = readJson(join(lock.backup_path, "ready.json"), "schema-5 migration ready record");
  if (ready.digest !== state.ready_digest || digest(ready.payload) !== ready.digest || ready.payload.migration_id !== lock.id || ready.payload.worksheet_digest !== state.worksheet_digest || ready.payload.backup_inventory_digest !== lock.backup_inventory_digest || canonicalJson(ready.payload.backup_inventory) !== canonicalJson(state.worksheet.backup_inventory) || ready.payload.source_manifest_digest !== state.worksheet.source_manifest_digest || ready.payload.source_store_digest !== state.worksheet.source_store_digest || ready.payload.authorization_digest !== (state.authorization?.digest ?? null)) {
    fail3("RECOVERY_REQUIRED", "schema-5 migration ready record binding changed");
  }
  verifyBackup(lock.backup_path, state.worksheet, ready, state.authorization);
  if (state.receipt !== null) {
    const retained = readJson(join(lock.backup_path, "receipt.json"), "schema-5 migration receipt");
    if (canonicalJson(retained) !== canonicalJson(state.receipt)) {
      fail3("RECOVERY_REQUIRED", "schema-5 migration state receipt binding changed");
    }
    state.receipt = retained;
  }
  return { state, ready };
}
function snapshotPrivate(root) {
  return walkFiles(root, ".kai").filter((entry) => !entry.path.startsWith(HOST_RUNTIME));
}
function sameInventory(expected, actual, message) {
  const ordered = (entries) => Array.isArray(entries) ? [...entries].sort((left, right) => left.path < right.path ? -1 : left.path > right.path ? 1 : 0) : entries;
  expected = ordered(expected);
  actual = ordered(actual);
  if (canonicalJson(expected) !== canonicalJson(actual)) {
    let changed = null;
    if (Array.isArray(expected) && Array.isArray(actual)) {
      const expectedByPath = new Map(expected.map((entry) => [entry.path, entry]));
      const actualByPath = new Map(actual.map((entry) => [entry.path, entry]));
      changed = [.../* @__PURE__ */ new Set([
        ...expectedByPath.keys(),
        ...actualByPath.keys()
      ])].sort().find((path) => canonicalJson(expectedByPath.get(path) ?? null) !== canonicalJson(actualByPath.get(path) ?? null));
    }
    fail3(
      "RECOVERY_REQUIRED",
      `${message}${changed ? `: ${changed}` : ""}`
    );
  }
}
function sourceProjectMap(validated) {
  return new Map(
    [...validated.sourceProjects, ...validated.projects].map((project) => [project.project.id, project])
  );
}
function copyAuthorization(root, backupPath, authorization) {
  if (authorization === null) return;
  if (!authorization?.payload || digest(authorization.payload) !== authorization.digest || canonicalJson(migrationAuthorizationDescriptor(
    root,
    authorization.payload.capability_id
  )) !== canonicalJson(authorization)) {
    fail3("AUTHORITY_REQUIRED", "migration authorization descriptor binding is invalid");
  }
  for (const entry of authorization.payload.files) {
    const actual = fileFingerprint(root, entry.source);
    if (entry.type !== "file" || actual.digest !== entry.digest || actual.size !== entry.size) {
      fail3("AUTHORITY_REQUIRED", `migration authorization source changed: ${entry.kind}`);
    }
    durableCopy(
      safePath(root, entry.source),
      join(backupPath, ...entry.backup.split("/"))
    );
  }
  durableWrite(
    join(backupPath, "authorization.json"),
    canonicalJson(authorization)
  );
}
function frozenWorksheet(backupPath, worksheet) {
  const manifestPath = join(backupPath, "private", ".kai", "manifest.json");
  const sourceManifestBytes = readFileSync(manifestPath);
  let sourceManifest;
  try {
    sourceManifest = JSON.parse(sourceManifestBytes);
  } catch {
    fail3("RECOVERY_REQUIRED", "frozen schema-4 manifest is invalid");
  }
  if (sourceManifest.schema_version !== 4 || hash(sourceManifestBytes) !== worksheet.source_manifest_digest) {
    fail3("RECOVERY_REQUIRED", "frozen schema-4 manifest does not match the authorized plan");
  }
  const store = databaseSnapshot(
    join(backupPath, "private", ...LEGACY_DATABASE.split("/"))
  );
  if (store.digest !== worksheet.source_store_digest) {
    fail3("RECOVERY_REQUIRED", "frozen schema-4 store does not match the authorized plan");
  }
  const selected = sourceManifest.projects.length === 1 ? sourceManifest.projects[0] : sourceManifest.projects.find((project) => project?.id === "default");
  const direction = worksheet.backup_inventory.public_files.find((entry) => entry.project_id === selected?.id && entry.path === worksheet.direction_ref.path);
  if (!selected || !direction || direction.digest !== worksheet.direction_ref.hash) {
    fail3("RECOVERY_REQUIRED", "frozen Direction does not match the authorized plan");
  }
  const fresh = worksheetFromSource({
    manifestDigest: hash(sourceManifestBytes),
    store,
    directionRef: worksheet.direction_ref,
    inventory: worksheet.backup_inventory
  });
  return { fresh, sourceManifest };
}
function copySnapshot(root, preliminary, lock, roles, env, authorization) {
  mkdirSync(lock.backup_path, { recursive: false });
  if (pathHasLink(preliminary.backupRoot, lock.backup_path) || !exactPath(lock.backup_path)) {
    fail3("RECOVERY_REQUIRED", "migration backup directory resolved through a link or alias");
  }
  let state = {
    schema_version: 1,
    id: lock.id,
    phase: "locked",
    worksheet: preliminary.worksheet,
    worksheet_digest: preliminary.worksheetDigest,
    candidate_manifest: preliminary.candidateManifest,
    ready_digest: null,
    authorization,
    receipt: null,
    installed_targets: [],
    database_installed: null
  };
  writeState(lock, state);
  const inventory = preliminary.worksheet.backup_inventory;
  sameInventory(
    inventory,
    backupInventory(root, preliminary.sourceManifest, env),
    "schema-4 source inventory changed after migration lock acquisition"
  );
  for (const entry of inventory.private_files) {
    durableCopy(
      join(root, ...entry.path.split("/")),
      join(lock.backup_path, "private", ...entry.path.split("/"))
    );
  }
  const projectMap = sourceProjectMap(preliminary);
  for (const entry of inventory.public_files) {
    const project = projectMap.get(entry.project_id);
    if (!project) fail3("RECOVERY_REQUIRED", `missing project for publication ${entry.path}`);
    durableCopy(
      join(project.projectRoot, ...entry.path.split("/")),
      join(lock.backup_path, "public", entry.project_id, ...entry.path.split("/"))
    );
  }
  if (inventory.registry) {
    durableCopy(
      inventory.registry.path,
      join(lock.backup_path, "registry", "workspaces.json")
    );
  }
  durableWrite(
    join(lock.backup_path, "git-tracking.json"),
    canonicalJson(inventory.git_tracking)
  );
  durableWrite(
    join(lock.backup_path, "worksheet.json"),
    canonicalJson(preliminary.worksheet)
  );
  copyAuthorization(root, lock.backup_path, authorization);
  const frozen = frozenWorksheet(lock.backup_path, preliminary.worksheet);
  const validated = validateWorksheetAgainstSource({
    root,
    worksheet: preliminary.worksheet,
    roles,
    env,
    fresh: frozen.fresh,
    sourceManifest: frozen.sourceManifest
  });
  if (validated.worksheetDigest !== preliminary.worksheetDigest || canonicalJson(validated.candidateManifest) !== canonicalJson(preliminary.candidateManifest)) {
    fail3("RECOVERY_REQUIRED", "frozen migration validation changed the authorized result");
  }
  const readyPayload = {
    schema_version: 1,
    migration_id: lock.id,
    worksheet_digest: validated.worksheetDigest,
    backup_inventory: inventory,
    backup_inventory_digest: validated.worksheet.backup_inventory_digest,
    source_manifest_digest: validated.worksheet.source_manifest_digest,
    source_store_digest: validated.worksheet.source_store_digest,
    authorization_digest: authorization?.digest ?? null
  };
  const ready = {
    payload: readyPayload,
    digest: digest(readyPayload)
  };
  durableWrite(join(lock.backup_path, "ready.json"), canonicalJson(ready));
  state = readState(lock);
  state.ready_digest = ready.digest;
  state.phase = "backup-verified";
  writeState(lock, state);
  verifyBackup(lock.backup_path, validated.worksheet, ready, authorization);
  return { state, validated, ready };
}
function actualInventory(root) {
  return walkFiles(root).map((entry) => ({ ...entry, type: "file" }));
}
function verifyAuthorizationBackup(backupPath, authorization) {
  if (authorization === null) {
    if (existsSync(join(backupPath, "authorization")) || existsSync(join(backupPath, "authorization.json"))) {
      fail3("RECOVERY_REQUIRED", "migration backup has unbound authorization files");
    }
    return;
  }
  const retained = readJson(
    join(backupPath, "authorization.json"),
    "migration authorization proof"
  );
  if (retained.digest !== authorization.digest || digest(retained.payload) !== retained.digest || canonicalJson(retained) !== canonicalJson(authorization)) {
    fail3("RECOVERY_REQUIRED", "migration authorization proof changed");
  }
  const expected = authorization.payload.files.map((entry) => ({
    path: entry.backup.replace(/^authorization\//, ""),
    digest: entry.digest,
    size: entry.size,
    type: entry.type
  })).sort((left, right) => left.path.localeCompare(right.path));
  const actual = actualInventory(join(backupPath, "authorization"));
  sameInventory(expected, actual, "migration authorization backup inventory changed");
}
function verifyBackup(backupPath, worksheet, ready, authorization = null) {
  if (!existsSync(backupPath) || !lstatSync(backupPath).isDirectory() || pathHasLink(dirname(backupPath), backupPath) || !exactPath(backupPath)) {
    fail3("RECOVERY_REQUIRED", "migration backup directory changed type, link, or canonical identity");
  }
  if (digest(worksheet.backup_inventory) !== worksheet.backup_inventory_digest) {
    fail3("RECOVERY_REQUIRED", "authorized backup inventory digest changed");
  }
  if (canonicalJson(readJson(join(backupPath, "worksheet.json"), "migration worksheet backup")) !== canonicalJson(worksheet)) {
    fail3("RECOVERY_REQUIRED", "migration worksheet backup changed");
  }
  if (canonicalJson(readJson(join(backupPath, "ready.json"), "migration ready record")) !== canonicalJson(ready)) {
    fail3("RECOVERY_REQUIRED", "migration ready record changed");
  }
  if (ready.digest !== digest(ready.payload) || ready.payload.backup_inventory_digest !== worksheet.backup_inventory_digest || canonicalJson(ready.payload.backup_inventory) !== canonicalJson(worksheet.backup_inventory) || ready.payload.source_manifest_digest !== worksheet.source_manifest_digest || ready.payload.source_store_digest !== worksheet.source_store_digest) {
    fail3("RECOVERY_REQUIRED", "migration ready record does not bind the authorized inventory");
  }
  const inventory = worksheet.backup_inventory;
  sameInventory(
    inventory.private_files,
    actualInventory(join(backupPath, "private")),
    "migration private backup has missing, extra, changed, or mistyped files"
  );
  const expectedPublic = inventory.public_files.map((entry) => ({
    path: `${entry.project_id}/${entry.path}`,
    digest: entry.digest,
    size: entry.size,
    type: entry.type
  })).sort((left, right) => left.path.localeCompare(right.path));
  sameInventory(
    expectedPublic,
    actualInventory(join(backupPath, "public")),
    "migration public backup has missing, extra, changed, or mistyped files"
  );
  if (inventory.registry) {
    const actual = fingerprintAbsolute(join(backupPath, "registry", "workspaces.json"));
    if (actual.digest !== inventory.registry.digest || actual.size !== inventory.registry.size || canonicalJson(actualInventory(join(backupPath, "registry"))) !== canonicalJson([{
      path: "workspaces.json",
      digest: inventory.registry.digest,
      size: inventory.registry.size,
      type: "file"
    }])) {
      fail3("RECOVERY_REQUIRED", "migration registry backup digest mismatch");
    }
  } else if (existsSync(join(backupPath, "registry"))) {
    fail3("RECOVERY_REQUIRED", "migration backup has an unlisted registry tree");
  }
  if (canonicalJson(readJson(join(backupPath, "git-tracking.json"), "Git tracking backup")) !== canonicalJson(inventory.git_tracking)) {
    fail3("RECOVERY_REQUIRED", "migration Git tracking backup changed");
  }
  verifyAuthorizationBackup(backupPath, authorization);
  const allowed = /* @__PURE__ */ new Set([
    "private",
    ...inventory.public_files.length ? ["public"] : [],
    ...inventory.registry ? ["registry"] : [],
    "git-tracking.json",
    "worksheet.json",
    "ready.json",
    "state.json",
    ...authorization ? ["authorization", "authorization.json"] : [],
    ...existsSync(join(backupPath, ACTIVATION_READY_FILE)) ? [ACTIVATION_READY_FILE] : [],
    ...existsSync(join(backupPath, "receipt.json")) ? ["receipt.json"] : []
  ]);
  const unexpected = readdirSync(backupPath).find((name) => !allowed.has(name));
  if (unexpected) {
    fail3("RECOVERY_REQUIRED", `migration backup contains unlisted entry: ${unexpected}`);
  }
  return { worksheet, ready, authorization };
}
function eventBaseline(database) {
  const rows = database.prepare(`
    SELECT seq,operation_id,subject_kind,subject_id,payload,thread_id
    FROM events ORDER BY seq
  `).all();
  return {
    event_count: rows.length,
    event_digest: digest(rows),
    through_seq: rows.length ? Number(rows.at(-1).seq) : 0
  };
}
function createSchema5MigrationStagingStore({ root, stagePath }) {
  const expectedRoot = resolve(stagePath);
  const databasePath = join(expectedRoot, ...COORDINATION_DATABASE.split("/"));
  if (!escapesRoot(resolve(root), databasePath) || !normalized(databasePath).startsWith(`${normalized(expectedRoot)}${sep}`)) {
    fail3("INVALID_INPUT", "schema-5 migration staging database must stay outside the live workspace");
  }
  return openStore({ path: databasePath, mode: "create" });
}
function migrationMapRows(validated) {
  const rows = [];
  for (const collection of ["epics", "milestones", "items"]) {
    for (const entry of validated.worksheet[collection]) {
      const primary = validated.primaryTargets.get(sourceKey(entry.source));
      rows.push({
        source_kind: entry.source.kind,
        source_id: entry.source.map_id ?? entry.source.id,
        source_version: entry.source.version,
        target_kind: primary?.kind ?? null,
        target_id: primary?.id ?? null,
        target_version: primary?.version ?? null,
        disposition: entry.classification.disposition
      });
    }
  }
  return rows;
}
function insertLegacyRows(database, source) {
  const insertMetadata = database.prepare(
    "INSERT INTO migration_legacy_metadata(source_key,row_json,row_digest) VALUES(?,?,?)"
  );
  for (const row of source.tables.metadata) {
    const rowJson = canonicalJson(row);
    insertMetadata.run(row.key, rowJson, digest(rowJson));
  }
  const insertRecord = database.prepare(
    "INSERT INTO migration_legacy_records(kind,id,row_json,row_digest) VALUES(?,?,?,?)"
  );
  for (const row of source.tables.records) {
    const rowJson = canonicalJson(row);
    insertRecord.run(row.kind, row.id, rowJson, digest(rowJson));
  }
  const insertEvent = database.prepare(
    "INSERT INTO migration_legacy_events(source_seq,row_json,row_digest) VALUES(?,?,?)"
  );
  for (const row of source.tables.events) {
    const rowJson = canonicalJson(row);
    insertEvent.run(Number(row.seq), rowJson, digest(rowJson));
  }
  const insertOperation = database.prepare(
    "INSERT INTO migration_legacy_operations(source_id,row_json,row_digest) VALUES(?,?,?)"
  );
  for (const row of source.tables.operations) {
    const rowJson = canonicalJson(row);
    insertOperation.run(row.id, rowJson, digest(rowJson));
  }
  const insertExtra = database.prepare(
    "INSERT INTO migration_legacy_extra(table_name,row_index,row_json,row_digest) VALUES(?,?,?,?)"
  );
  for (const [table, rows] of Object.entries(source.tables)) {
    if ((/* @__PURE__ */ new Set(["metadata", "records", "events", "operations"])).has(table)) continue;
    rows.forEach((row, index) => {
      const rowJson = canonicalJson(row);
      insertExtra.run(table, index, rowJson, digest(rowJson));
    });
  }
}
function immutableTriggers(database) {
  for (const table of PROVENANCE_TABLES) {
    for (const operation of ["INSERT", "UPDATE", "DELETE"]) {
      database.exec(`
        CREATE TRIGGER immutable_${table}_${operation.toLowerCase()}
        BEFORE ${operation} ON ${table}
        BEGIN
          SELECT RAISE(ABORT, 'immutable migration provenance');
        END
      `);
    }
  }
  for (const operation of ["UPDATE", "DELETE"]) {
    database.exec(`
      CREATE TRIGGER immutable_migration_v5_metadata_${operation.toLowerCase()}
      BEFORE ${operation} ON metadata
      WHEN OLD.key IN (
        '${ABANDON_ANCHOR_METADATA}',
        'migration_v5_baseline',
        'migration_v5'
      )
      BEGIN
        SELECT RAISE(ABORT, 'immutable migration metadata');
      END
    `);
  }
}
function stageTargetFiles(root, validated, lock) {
  for (const entry of validated.worksheet.authored_files) {
    if (entry.classification.action !== "migrate") continue;
    const target = join(
      lock.stage_path,
      "schema5-files",
      ...entry.classification.target.split("/")
    );
    const source = join(
      lock.backup_path,
      "private",
      ...entry.path.split("/")
    );
    durableCopy(source, target);
    const fingerprint = fingerprintAbsolute(target);
    if (fingerprint.digest !== entry.digest || fingerprint.size !== entry.size) {
      fail3("RECOVERY_REQUIRED", `staged authored file changed: ${entry.path}`);
    }
  }
}
function migrationSourceRows(inventory, worksheet) {
  const classifications = new Map(
    worksheet.authored_files.map((entry) => [entry.path, entry.classification])
  );
  return inventory.private_files.map(({ type, ...entry }) => ({
    source_id: digest(entry.path),
    path: entry.path,
    digest: entry.digest,
    size: entry.size,
    category: entry.path === ".kai/manifest.json" ? "manifest" : entry.path === LEGACY_DATABASE ? "database" : authoredCategory(entry.path),
    owner_hint: ownerHint(entry.path),
    classification: classifications.get(entry.path) ?? {
      action: "runtime-retained",
      pack: "core",
      target: entry.path.startsWith(HOST_RUNTIME) ? entry.path : null,
      ownership_basis: "Migration runtime source."
    },
    backup_relative: `private/${entry.path}`
  }));
}
function finishStagedStore(store) {
  const checkpoint = store.database.prepare("PRAGMA wal_checkpoint(TRUNCATE)").get();
  if (checkpoint.busy) fail3("STORE_BUSY", "schema-5 staged database checkpoint is busy");
  closeStore(store);
}
function stageMigrationStore(root, validated, lock, state) {
  if (!existsSync(lock.stage_path)) mkdirSync(lock.stage_path, { recursive: false });
  if (pathHasLink(dirname(lock.stage_path), lock.stage_path) || !exactPath(lock.stage_path)) {
    fail3("RECOVERY_REQUIRED", "migration stage directory resolved through a link or alias");
  }
  stageTargetFiles(root, validated, lock);
  const databasePath = join(lock.stage_path, ...COORDINATION_DATABASE.split("/"));
  if (existsSync(databasePath)) {
    fail3("RECOVERY_REQUIRED", "unexpected existing schema-5 staged database");
  }
  const source = databaseSnapshot(
    join(lock.backup_path, "private", ...LEGACY_DATABASE.split("/"))
  );
  let store = createSchema5MigrationStagingStore({ root, stagePath: lock.stage_path });
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
        canonicalJson(record.body)
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
        validated.worksheetDigest
      );
    }
    const insertSource = store.database.prepare(
      "INSERT INTO migration_sources VALUES(?,?,?,?,?,?,?,?)"
    );
    for (const row of migrationSourceRows(
      validated.worksheet.backup_inventory,
      validated.worksheet
    )) {
      insertSource.run(
        row.source_id,
        row.path,
        row.digest,
        row.size,
        row.category,
        row.owner_hint,
        canonicalJson(row.classification),
        row.backup_relative
      );
    }
    insertLegacyRows(store.database, source.snapshot);
    store.database.prepare(`
      INSERT INTO events(operation_id,subject_kind,subject_id,payload)
      VALUES(?,NULL,NULL,?)
    `).run(
      lock.id,
      canonicalJson({
        kind: "workspace.migrate-v5",
        actor: null,
        sourceSchema: 4,
        migrationId: lock.id,
        worksheetDigest: validated.worksheetDigest,
        historicalAcceptanceCurrent: false,
        timestamp: null
      })
    );
    const baseline = eventBaseline(store.database);
    store.database.prepare("INSERT INTO metadata VALUES(?,?)").run(
      "migration_v5_baseline",
      canonicalJson(baseline)
    );
    const installedInventory = schema5InstalledInventory(
      validated.worksheet,
      validated.candidateManifest
    );
    const manifestBytes2 = schema5ManifestBytes(validated.candidateManifest);
    const receiptBasis = {
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
      activated_manifest_digest: installedInventory.manifest.digest,
      activation_baseline: baseline,
      schema5_files: installedInventory
    };
    const anchor = abandonAnchor({
      state,
      receiptBasis,
      installedInventory
    });
    store.database.prepare("INSERT INTO metadata VALUES(?,?)").run(
      ABANDON_ANCHOR_METADATA,
      canonicalJson(anchor)
    );
    immutableTriggers(store.database);
    const databaseDigest = schema5DatabaseDigest(store);
    const activationReadyPayload = {
      schema_version: 1,
      migration_id: lock.id,
      worksheet_digest: validated.worksheetDigest,
      ready_digest: state.ready_digest,
      abandon_anchor_digest: anchor.digest,
      state_identity_digest: anchor.payload.state_identity_digest,
      receipt_basis_digest: anchor.payload.receipt_basis_digest,
      installed_inventory_digest: anchor.payload.installed_inventory_digest,
      database_digest: databaseDigest
    };
    const activationReady = {
      payload: activationReadyPayload,
      digest: digest(activationReadyPayload)
    };
    const payload = {
      ...receiptBasis,
      schema5_files: {
        ...installedInventory,
        database: {
          ...installedInventory.database,
          digest: databaseDigest
        }
      },
      abandon_anchor_digest: anchor.digest,
      activation_ready_digest: activationReady.digest
    };
    const receipt = {
      payload,
      digest: digest(payload),
      backupPath: lock.backup_path,
      databasePath: safePath(root, COORDINATION_DATABASE),
      activated: false,
      id: lock.id
    };
    store.database.prepare("INSERT INTO metadata VALUES(?,?)").run(
      "migration_v5",
      canonicalJson({
        receipt_digest: receipt.digest,
        receipt_path: join(lock.backup_path, "receipt.json"),
        backup_path: lock.backup_path,
        migration_id: lock.id,
        worksheet_digest: validated.worksheetDigest,
        ready_digest: state.ready_digest,
        abandon_anchor_digest: anchor.digest,
        activation_ready_digest: activationReady.digest
      })
    );
    store.database.exec("COMMIT");
    finishStagedStore(store);
    store = null;
    durableWrite(join(lock.stage_path, "schema5-manifest.json"), manifestBytes2);
    durableWrite(
      join(lock.backup_path, ACTIVATION_READY_FILE),
      canonicalJson(activationReady)
    );
    durableWrite(join(lock.backup_path, "receipt.json"), canonicalJson(receipt));
    verifyStagedStore(root, validated, lock, state, receipt);
    state.phase = "staged";
    state.receipt = receipt;
    writeState(lock, state);
    return state;
  } catch (error) {
    if (store && !store.closed) {
      try {
        store.database.exec("ROLLBACK");
      } catch {
      }
    }
    closeStore(store);
    throw error;
  }
}
function verifyStagedStore(root, validated, lock, state, receipt, path = null) {
  const databasePath = path ?? join(lock.stage_path, ...COORDINATION_DATABASE.split("/"));
  const store = openStore({ path: databasePath, mode: "read" });
  try {
    for (const record of validated.records.values()) {
      const persisted = readRecord(store, record.kind, record.id);
      if (canonicalJson(persisted) !== canonicalJson(record)) {
        fail3("RECOVERY_REQUIRED", `staged hierarchy record changed: ${record.kind}/${record.id}`);
      }
    }
    const direction = readDirection({
      workspaceRoot: root,
      manifest: validated.candidateManifest
    });
    const roles = [.../* @__PURE__ */ new Set(["operator", ...validated.roles ?? []])];
    hierarchyStatus(store, { direction, roles });
    for (const record of validated.records.values()) {
      hierarchyContext(store, {
        subject: { kind: record.kind, id: record.id },
        direction,
        roles,
        recentLimit: 0,
        maxBytes: 24 * 1024
      });
    }
    const metadata = JSON.parse(store.database.prepare(
      "SELECT value FROM metadata WHERE key='migration_v5'"
    ).get().value);
    if (metadata.receipt_digest !== receipt.digest || metadata.backup_path !== lock.backup_path) {
      fail3("RECOVERY_REQUIRED", "staged migration receipt binding changed");
    }
    const baseline = JSON.parse(store.database.prepare(
      "SELECT value FROM metadata WHERE key='migration_v5_baseline'"
    ).get().value);
    if (canonicalJson(baseline) !== canonicalJson(eventBaseline(store.database))) {
      fail3("RECOVERY_REQUIRED", "staged migration event baseline changed");
    }
    assertOwnedDatabase(
      databasePath,
      receipt.payload.schema5_files.database,
      "staged schema-5 database",
      store
    );
    verifyInstalledMigrationAnchor({
      root,
      lock,
      state,
      receipt,
      databasePath,
      open: store
    });
  } finally {
    closeStore(store);
  }
}
function samePublic(root, validated) {
  const current = retainedPublications(root, validated.sourceManifest).map(({ classification, ...entry }) => ({ ...entry, type: "file" }));
  if (canonicalJson(current) !== canonicalJson(validated.worksheet.backup_inventory.public_files)) {
    fail3("RECOVERY_REQUIRED", "accepted publication tree changed during migration");
  }
}
function sameRegistry(validated) {
  const registry = validated.worksheet.backup_inventory.registry;
  if (!registry) return;
  const current = fingerprintAbsolute(registry.path);
  if (current.digest !== registry.digest || current.size !== registry.size) {
    fail3("RECOVERY_REQUIRED", "external workspace registry changed during migration");
  }
}
function assertOwnedFile(path, expected, label) {
  if (!existsSync(path)) {
    fail3("RECOVERY_REQUIRED", `${label} disappeared`);
  }
  const stat = lstatSync(path);
  if (expected.type !== "file" || !stat.isFile() || stat.nlink !== 1) {
    fail3("RECOVERY_REQUIRED", `${label} type changed`);
  }
  const actual = fingerprintAbsolute(path);
  if (actual.digest !== expected.digest || actual.size !== expected.size) {
    fail3("RECOVERY_REQUIRED", `${label} digest changed`);
  }
  return actual;
}
function schema5DatabaseDigest(store) {
  return digest({
    logical: logicalStoreDigest(store, {
      excludeMetadata: ["migration_baseline", "migration_v5"]
    }),
    schema: store.database.prepare(`
      SELECT type, name, tbl_name, sql
      FROM sqlite_master
      WHERE name NOT LIKE 'sqlite_%'
      ORDER BY type, name
    `).all()
  });
}
function assertOwnedDatabase(path, expected, label, open = null) {
  if (!expected || expected.path !== COORDINATION_DATABASE || expected.type !== "sqlite" || !/^[a-f0-9]{64}$/.test(expected.digest) || !existsSync(path)) {
    fail3("RECOVERY_REQUIRED", `${label} ownership binding is invalid`);
  }
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1) {
    fail3("RECOVERY_REQUIRED", `${label} type changed`);
  }
  const store = open ?? openStore({ path, mode: "read" });
  try {
    if (schema5DatabaseDigest(store) !== expected.digest) {
      fail3("RECOVERY_REQUIRED", `${label} digest changed`);
    }
  } finally {
    if (open === null) closeStore(store);
  }
}
function metadataJson(database, key, label) {
  let value;
  try {
    value = JSON.parse(database.prepare(
      "SELECT value FROM metadata WHERE key=?"
    ).get(key)?.value ?? "null");
  } catch {
    fail3("RECOVERY_REQUIRED", `${label} is invalid`);
  }
  if (!value) fail3("RECOVERY_REQUIRED", `${label} is missing`);
  return value;
}
function verifyInstalledMigrationAnchor({
  root,
  lock,
  state,
  receipt,
  databasePath,
  open = null,
  activationReady: suppliedActivationReady = null
}) {
  const plannedInventory = schema5InstalledInventory(
    state.worksheet,
    state.candidate_manifest
  );
  const files = receipt?.payload?.schema5_files;
  if (!files || !Array.isArray(files.authored_targets) || !files.database || !/^[a-f0-9]{64}$/.test(files.database.digest)) {
    fail3("RECOVERY_REQUIRED", "migration receipt installed inventory is invalid");
  }
  const expectedFiles = {
    ...plannedInventory,
    database: {
      ...plannedInventory.database,
      digest: files.database.digest
    }
  };
  if (canonicalJson(files) !== canonicalJson(expectedFiles)) {
    fail3("RECOVERY_REQUIRED", "migration receipt installed inventory is outside the authorized plan");
  }
  const store = open ?? openStore({ path: databasePath, mode: "read" });
  try {
    const metadata = metadataJson(
      store.database,
      "migration_v5",
      "schema-5 migration metadata"
    );
    const anchor = metadataJson(
      store.database,
      ABANDON_ANCHOR_METADATA,
      "schema-5 abandon anchor"
    );
    if (!anchor.payload || anchor.digest !== digest(anchor.payload) || anchor.payload.migration_id !== lock.id || anchor.payload.worksheet_digest !== lock.worksheet_digest || canonicalJson(anchor.payload.installed_inventory) !== canonicalJson(plannedInventory) || anchor.payload.installed_inventory_digest !== digest(plannedInventory)) {
      fail3("RECOVERY_REQUIRED", "schema-5 abandon inventory anchor changed");
    }
    const stateIdentity = migrationStateIdentity(state);
    if (canonicalJson(anchor.payload.state_identity) !== canonicalJson(stateIdentity) || anchor.payload.state_identity_digest !== digest(stateIdentity)) {
      fail3("RECOVERY_REQUIRED", "schema-5 abandon state identity is not database-anchored");
    }
    const receiptBasis = receiptBasisFromPayload(receipt.payload);
    if (canonicalJson(anchor.payload.receipt_basis) !== canonicalJson(receiptBasis) || anchor.payload.receipt_basis_digest !== digest(receiptBasis)) {
      fail3("RECOVERY_REQUIRED", "schema-5 receipt basis is not database-anchored");
    }
    if (receipt.digest !== digest(receipt.payload) || receipt.payload.abandon_anchor_digest !== anchor.digest || metadata.receipt_digest !== receipt.digest || metadata.migration_id !== lock.id || metadata.worksheet_digest !== lock.worksheet_digest || metadata.ready_digest !== state.ready_digest || metadata.abandon_anchor_digest !== anchor.digest || metadata.activation_ready_digest !== receipt.payload.activation_ready_digest) {
      fail3("RECOVERY_REQUIRED", "schema-5 receipt digest is not database-anchored");
    }
    const activationReady = suppliedActivationReady ?? readJson(
      join(lock.backup_path, ACTIVATION_READY_FILE),
      "schema-5 activation ready record"
    );
    const expectedActivationPayload = {
      schema_version: 1,
      migration_id: lock.id,
      worksheet_digest: lock.worksheet_digest,
      ready_digest: state.ready_digest,
      abandon_anchor_digest: anchor.digest,
      state_identity_digest: anchor.payload.state_identity_digest,
      receipt_basis_digest: anchor.payload.receipt_basis_digest,
      installed_inventory_digest: anchor.payload.installed_inventory_digest,
      database_digest: files.database.digest
    };
    if (activationReady.digest !== digest(activationReady.payload) || activationReady.digest !== receipt.payload.activation_ready_digest || canonicalJson(activationReady.payload) !== canonicalJson(expectedActivationPayload)) {
      fail3("RECOVERY_REQUIRED", "schema-5 activation ready binding changed");
    }
    assertOwnedDatabase(
      databasePath,
      expectedFiles.database,
      "database-anchored schema-5 store",
      store
    );
    return {
      plannedInventory,
      installedFiles: expectedFiles,
      anchor,
      activationReady
    };
  } finally {
    if (open === null) closeStore(store);
  }
}
function retiredPath(lock, sourcePath) {
  return join(lock.stage_path, "retired", ...sourcePath.split("/"));
}
function retireSources(root, validated, lock, state) {
  for (const entry of validated.worksheet.backup_inventory.private_files) {
    if (entry.path === ".kai/manifest.json" || entry.path.startsWith(HOST_RUNTIME)) continue;
    const source = join(root, ...entry.path.split("/"));
    const retained = retiredPath(lock, entry.path);
    if (existsSync(retained)) {
      assertOwnedFile(retained, entry, `retired schema-4 source ${entry.path}`);
      if (existsSync(source)) {
        fail3(
          "RECOVERY_REQUIRED",
          `schema-4 source authority is ambiguous after retirement: ${entry.path}`
        );
      }
      continue;
    }
    if (!existsSync(source)) {
      fail3("RECOVERY_REQUIRED", `schema-4 source disappeared before retirement: ${entry.path}`);
    }
    assertOwnedFile(source, entry, `schema-4 source ${entry.path}`);
    mkdirSync(dirname(retained), { recursive: true });
    renameSync(source, retained);
  }
  state.phase = "sources-retired";
  writeState(lock, state);
}
function moveAuthoredTargets(root, validated, lock, state) {
  state.installed_targets ??= [];
  for (const entry of validated.worksheet.authored_files) {
    if (entry.classification.action !== "migrate") continue;
    const staged = join(
      lock.stage_path,
      "schema5-files",
      ...entry.classification.target.split("/")
    );
    const live = join(root, ...entry.classification.target.split("/"));
    const expected = {
      path: entry.classification.target,
      type: "file",
      digest: entry.digest,
      size: entry.size
    };
    if (existsSync(live)) {
      if (state.installed_targets.some((target) => target.path === entry.classification.target) && !existsSync(staged)) {
        assertOwnedFile(live, expected, `schema-5 authored target ${expected.path}`);
        continue;
      }
      fail3("RECOVERY_REQUIRED", `schema-5 authored target collision: ${entry.classification.target}`);
    }
    mkdirSync(dirname(live), { recursive: true });
    renameSync(staged, live);
    assertOwnedFile(live, expected, `schema-5 authored target ${expected.path}`);
    state.installed_targets.push(expected);
    writeState(lock, state);
  }
}
function moveDatabase(root, lock, state) {
  const staged = join(lock.stage_path, ...COORDINATION_DATABASE.split("/"));
  const live = safePath(root, COORDINATION_DATABASE);
  if (!existsSync(live)) {
    mkdirSync(dirname(live), { recursive: true });
    renameSync(staged, live);
    assertOwnedDatabase(
      live,
      state.receipt.payload.schema5_files.database,
      "schema-5 migration database"
    );
    state.database_installed = state.receipt.payload.schema5_files.database;
  } else if (existsSync(staged)) {
    fail3("RECOVERY_REQUIRED", "both staged and live schema-5 databases exist");
  } else if (state.database_installed) {
    assertOwnedDatabase(live, state.database_installed, "schema-5 migration database");
  }
  state.phase = "db-moved";
  writeState(lock, state);
}
function removeEmptyDirectories(root) {
  const privateRoot = join(root, ".kai");
  function walk(path) {
    if (!existsSync(path) || !lstatSync(path).isDirectory()) return;
    for (const name of readdirSync(path)) walk(join(path, name));
    if (path !== privateRoot && readdirSync(path).length === 0) {
      rmSync(path, { recursive: true, force: false });
    }
  }
  walk(privateRoot);
}
function validateActivationTree(root, validated, lock, state) {
  const manifestValidation = validateSchema5Manifest(root, validated.candidateManifest, {
    env: validated.env
  });
  if (manifestValidation.errors.length) {
    fail3("RECOVERY_REQUIRED", manifestValidation.errors.join("; "));
  }
  for (const forbidden of FORBIDDEN_SCHEMA5_ROOTS) {
    if (existsSync(join(root, ...forbidden.split("/")))) {
      fail3("RECOVERY_REQUIRED", `retired schema-4 root remains before activation: ${forbidden}`);
    }
  }
  const expectedFiles = /* @__PURE__ */ new Set([
    ".kai/manifest.json",
    COORDINATION_DATABASE,
    ...(state.installed_targets ?? []).map((entry) => entry.path)
  ]);
  const liveFiles = snapshotPrivate(root);
  const unexpected = liveFiles.find((entry) => !expectedFiles.has(entry.path));
  if (unexpected) {
    fail3("RECOVERY_REQUIRED", `unclassified private file appeared during migration: ${unexpected.path}`);
  }
  for (const entry of validated.worksheet.authored_files.filter((source) => source.classification.action === "migrate")) {
    const live = liveFiles.find((candidate) => candidate.path === entry.classification.target);
    if (!live || live.digest !== entry.digest || live.size !== entry.size) {
      fail3("RECOVERY_REQUIRED", `migrated authored target changed before activation: ${entry.classification.target}`);
    }
  }
  const privacy = inspectGitPrivacy(root, validated.candidateManifest.placement);
  if (privacy.errors.length || privacy.missing.length) {
    fail3("RECOVERY_REQUIRED", [...privacy.errors, ...privacy.missing].join("; "));
  }
  samePublic(root, validated);
  sameRegistry(validated);
  const { ready } = verifyStateBinding(lock, state);
  verifyStagedStore(
    root,
    validated,
    lock,
    state,
    state.receipt,
    safePath(root, COORDINATION_DATABASE)
  );
  return ready;
}
function assertAtomicReplacementSupported(lock) {
  const probeRoot = join(lock.stage_path, "atomic-replace-probe");
  mkdirSync(probeRoot, { recursive: true });
  const current = join(probeRoot, "current");
  const next = join(probeRoot, "next");
  durableWrite(current, "old");
  durableWrite(next, "new");
  renameSync(next, current);
  if (readFileSync(current, "utf8") !== "new" || existsSync(next)) {
    fail3("UNSUPPORTED_HOST", "filesystem cannot atomically replace an existing manifest");
  }
  rmSync(probeRoot, { recursive: true, force: false });
}
function releaseLock(path, expected) {
  if (!existsSync(path)) return;
  const stat = lstatSync(path);
  if (!stat.isFile() || stat.nlink !== 1 || pathHasLink(dirname(path), path) || !exactPath(path) || canonicalJson(readJson(path, "schema-5 migration lock")) !== canonicalJson(expected)) {
    fail3("RECOVERY_REQUIRED", "schema-5 migration lock changed; refusing removal");
  }
  unlinkSync(path);
}
function activateStaged(root, validated, lock, state) {
  const recovery = deriveRecoveryAuthority(root, lock, state);
  return continueActivation(root, validated, lock, recovery);
}
function validatedWithRuntime(input, env) {
  const validated = validateMigrationWorksheet({ ...input, env });
  validated.roles = [...input.roles];
  validated.env = env;
  return validated;
}
function migrateWorkspaceV5({
  root,
  confirm,
  worksheet,
  roles = [],
  env = process.env,
  authorization = null
} = {}) {
  confirmMigration(confirm);
  const validated = validatedWithRuntime({ root, worksheet, roles }, env);
  const id = randomUUID();
  const lock = {
    schema_version: 1,
    id,
    root: canonicalPath(root),
    pid: process.pid,
    backup_path: join(
      validated.backupRoot,
      `kai-schema5-${validated.sourceManifest.workspace_id}-${id}`
    ),
    stage_path: v5StagePath(root, id),
    worksheet_digest: validated.worksheetDigest,
    backup_inventory_digest: validated.worksheet.backup_inventory_digest,
    authorization_digest: authorization?.digest ?? null
  };
  if (existsSync(lock.backup_path) || existsSync(lock.stage_path)) {
    fail3("RECOVERY_REQUIRED", "schema-5 migration backup or stage path already exists");
  }
  const lockPath = lockMigration(root, lock);
  try {
    const frozen = copySnapshot(
      root,
      validated,
      lock,
      roles,
      env,
      authorization
    );
    let state = stageMigrationStore(root, frozen.validated, lock, frozen.state);
    return activateStaged(root, frozen.validated, lock, state);
  } catch (error) {
    if (!existsSync(lockPath)) {
      try {
        durableWrite(lockPath, canonicalJson(lock), { exclusive: true });
      } catch {
      }
    }
    throw error;
  }
}
function inspectRecoveryFile(path, expected, label) {
  if (!existsSync(path)) return { exists: false, owned: false, path };
  const stat = lstatSync(path);
  if (stat.isSymbolicLink() || pathHasLink(dirname(path), path) || !exactPath(path) || stat.nlink !== 1) {
    fail3("RECOVERY_REQUIRED", `${label} changed link, sharing, or canonical identity`);
  }
  if (!stat.isFile()) {
    return { exists: true, owned: false, path, type: "non-file" };
  }
  const actual = fingerprintAbsolute(path);
  return {
    exists: true,
    owned: expected?.type === "file" && actual.digest === expected.digest && actual.size === expected.size,
    path,
    type: "file",
    actual
  };
}
function recoveryReceiptIdentity(receipt) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt)) return null;
  const identity = jsonClone(receipt);
  delete identity.activated;
  return identity;
}
function validateMutableRecoveryIdentity(lock, state, immutable) {
  if (state === null) return;
  if (typeof state !== "object" || Array.isArray(state) || canonicalJson(Object.keys(state).sort()) !== canonicalJson([...MIGRATION_STATE_KEYS].sort()) || state.schema_version !== 1 || state.id !== lock.id || state.worksheet_digest !== lock.worksheet_digest || digest(state.worksheet) !== state.worksheet_digest || canonicalJson(state.worksheet) !== canonicalJson(immutable.worksheet) || canonicalJson(state.candidate_manifest) !== canonicalJson(immutable.candidateManifest) || canonicalJson(state.authorization) !== canonicalJson(immutable.authorization) || state.ready_digest !== null && state.ready_digest !== immutable.ready.digest || !Array.isArray(state.installed_targets)) {
    fail3(
      "RECOVERY_REQUIRED",
      "schema-5 recovery state worksheet or identity no longer matches its immutable lock binding"
    );
  }
}
function immutableRecoveryPlan(root, lock, state) {
  const worksheet = readJson(
    join(lock.backup_path, "worksheet.json"),
    "migration worksheet backup"
  );
  if (digest(worksheet) !== lock.worksheet_digest || worksheet.backup_inventory_digest !== lock.backup_inventory_digest) {
    fail3("RECOVERY_REQUIRED", "immutable migration worksheet no longer matches its lock");
  }
  const ready = readJson(
    join(lock.backup_path, "ready.json"),
    "schema-5 migration ready record"
  );
  if (ready.digest !== digest(ready.payload) || ready.payload.migration_id !== lock.id || ready.payload.worksheet_digest !== lock.worksheet_digest || ready.payload.backup_inventory_digest !== lock.backup_inventory_digest) {
    fail3("RECOVERY_REQUIRED", "physical migration ready record is not lock-bound");
  }
  const authorization = lock.authorization_digest === null ? null : readJson(
    join(lock.backup_path, "authorization.json"),
    "migration authorization proof"
  );
  if ((authorization?.digest ?? null) !== lock.authorization_digest) {
    fail3("RECOVERY_REQUIRED", "immutable migration authorization no longer matches its lock");
  }
  verifyBackup(lock.backup_path, worksheet, ready, authorization);
  const sourceManifest = readJson(
    join(lock.backup_path, "private", ".kai", "manifest.json"),
    "backed-up schema-4 manifest"
  );
  const candidate = candidateManifest(root, sourceManifest, worksheet.placement);
  const immutable = {
    worksheet,
    ready,
    authorization,
    sourceManifest,
    candidateManifest: candidate,
    installedInventory: schema5InstalledInventory(worksheet, candidate)
  };
  validateMutableRecoveryIdentity(lock, state, immutable);
  immutable.state = {
    schema_version: 1,
    id: lock.id,
    phase: "backup-verified",
    worksheet,
    worksheet_digest: lock.worksheet_digest,
    candidate_manifest: candidate,
    ready_digest: ready.digest,
    authorization,
    receipt: null,
    installed_targets: [],
    database_installed: null
  };
  return immutable;
}
function inspectRecoveryManifest(root, immutable) {
  const path = safePath(root, ".kai/manifest.json");
  const sourceEntry = immutable.worksheet.backup_inventory.private_files.find((entry) => entry.path === ".kai/manifest.json");
  if (!sourceEntry) {
    fail3("RECOVERY_REQUIRED", "authorized schema-4 manifest inventory is missing");
  }
  const file = inspectRecoveryFile(path, sourceEntry, "live migration manifest");
  if (!file.exists) return { ...file, kind: "missing", sourceEntry };
  if (file.owned) return { ...file, kind: "schema4", sourceEntry };
  const active = inspectRecoveryFile(
    path,
    immutable.installedInventory.manifest,
    "live migration manifest"
  );
  if (active.owned) return { ...active, kind: "schema5", sourceEntry };
  if (file.type === "file") {
    try {
      if (JSON.parse(readFileSync(path, "utf8"))?.schema_version === 5) {
        fail3("RECOVERY_REQUIRED", "active schema-5 manifest changed from its migration plan");
      }
    } catch (error) {
      if (error?.code === "RECOVERY_REQUIRED") throw error;
    }
  }
  return { ...file, kind: "changed", sourceEntry };
}
function inspectAnchoredDatabase({
  root,
  lock,
  immutable,
  databasePath,
  externalReceipt,
  externalActivationReady,
  label
}) {
  if (!existsSync(databasePath)) return { exists: false, authority: null, path: databasePath };
  const stat = lstatSync(databasePath);
  if (!stat.isFile() || stat.nlink !== 1 || pathHasLink(dirname(databasePath), databasePath) || !exactPath(databasePath)) {
    return { exists: true, authority: null, path: databasePath };
  }
  let store;
  try {
    store = openStore({ path: databasePath, mode: "read" });
  } catch {
    return { exists: true, authority: null, path: databasePath };
  }
  try {
    const rows = new Map(store.database.prepare(`
      SELECT key,value FROM metadata
      WHERE key IN (?,?,?)
    `).all(
      ABANDON_ANCHOR_METADATA,
      "migration_v5",
      "migration_v5_baseline"
    ).map((row) => [row.key, row.value]));
    if (rows.size === 0) {
      return { exists: true, authority: null, path: databasePath };
    }
    if (rows.size !== 3) {
      fail3("RECOVERY_REQUIRED", `${label} has incomplete migration metadata anchors`);
    }
    let anchor;
    let migration;
    let baseline;
    try {
      anchor = JSON.parse(rows.get(ABANDON_ANCHOR_METADATA));
      migration = JSON.parse(rows.get("migration_v5"));
      baseline = JSON.parse(rows.get("migration_v5_baseline"));
    } catch {
      fail3("RECOVERY_REQUIRED", `${label} migration metadata is invalid`);
    }
    if (canonicalJson(eventBaseline(store.database)) !== canonicalJson(baseline)) {
      fail3("RECOVERY_REQUIRED", `${label} event baseline changed`);
    }
    const databaseDigest = schema5DatabaseDigest(store);
    const activationReadyPayload = {
      schema_version: 1,
      migration_id: lock.id,
      worksheet_digest: lock.worksheet_digest,
      ready_digest: immutable.ready.digest,
      abandon_anchor_digest: anchor.digest,
      state_identity_digest: anchor.payload?.state_identity_digest,
      receipt_basis_digest: anchor.payload?.receipt_basis_digest,
      installed_inventory_digest: anchor.payload?.installed_inventory_digest,
      database_digest: databaseDigest
    };
    const activationReady = {
      payload: activationReadyPayload,
      digest: digest(activationReadyPayload)
    };
    const receiptPayload = {
      ...anchor.payload?.receipt_basis,
      schema5_files: {
        ...anchor.payload?.installed_inventory,
        database: {
          ...anchor.payload?.installed_inventory?.database,
          digest: databaseDigest
        }
      },
      abandon_anchor_digest: anchor.digest,
      activation_ready_digest: activationReady.digest
    };
    const receipt = {
      payload: receiptPayload,
      digest: digest(receiptPayload),
      backupPath: lock.backup_path,
      databasePath: safePath(root, COORDINATION_DATABASE),
      activated: externalReceipt?.activated === true,
      id: lock.id
    };
    if (migration.receipt_digest !== receipt.digest || migration.activation_ready_digest !== activationReady.digest) {
      fail3("RECOVERY_REQUIRED", `${label} receipt metadata conflicts with its database anchor`);
    }
    if (externalReceipt && canonicalJson(recoveryReceiptIdentity(externalReceipt)) !== canonicalJson(recoveryReceiptIdentity(receipt))) {
      fail3("RECOVERY_REQUIRED", "external migration receipt conflicts with database authority");
    }
    if (externalActivationReady && canonicalJson(externalActivationReady) !== canonicalJson(activationReady)) {
      fail3("RECOVERY_REQUIRED", "external activation-ready record conflicts with database authority");
    }
    const anchored = verifyInstalledMigrationAnchor({
      root,
      lock,
      state: immutable.state,
      receipt,
      databasePath,
      open: store,
      activationReady
    });
    return {
      exists: true,
      authority: {
        ...anchored,
        receipt,
        activationReady,
        migration,
        baseline
      },
      path: databasePath
    };
  } finally {
    closeStore(store);
  }
}
function validateMutableRecoveryInventory(state, recovery) {
  if (state === null) return;
  const expectedTargets = new Map(
    recovery.installedFiles.authored_targets.map((entry) => [entry.path, entry])
  );
  const claimed = /* @__PURE__ */ new Set();
  for (const entry of state.installed_targets) {
    const expected = expectedTargets.get(entry?.path);
    const physical = recovery.targets.find((target) => target.entry.path === entry?.path);
    if (!expected || claimed.has(entry.path) || canonicalJson(entry) !== canonicalJson(expected) || physical?.location !== "live") {
      fail3("RECOVERY_REQUIRED", "mutable recovery target inventory is not physically anchored");
    }
    claimed.add(entry.path);
  }
  if (state.database_installed !== null && (recovery.databaseLocation !== "live" || canonicalJson(state.database_installed) !== canonicalJson(recovery.installedFiles.database))) {
    fail3("RECOVERY_REQUIRED", "mutable recovery database inventory is not physically anchored");
  }
  if (state.receipt !== null) {
    if (typeof state.receipt?.activated !== "boolean" || !recovery.receipt || canonicalJson(recoveryReceiptIdentity(state.receipt)) !== canonicalJson(recoveryReceiptIdentity(recovery.receipt)) || state.receipt.activated === true && recovery.receipt.activated !== true && recovery.manifest.kind !== "schema5") {
      fail3("RECOVERY_REQUIRED", "mutable recovery receipt conflicts with database authority");
    }
  }
}
function deriveLockedRecovery(root, lock, state) {
  if (state !== null) {
    if (typeof state !== "object" || Array.isArray(state) || canonicalJson(Object.keys(state).sort()) !== canonicalJson([...MIGRATION_STATE_KEYS].sort()) || state.schema_version !== 1 || state.id !== lock.id || state.worksheet_digest !== lock.worksheet_digest || digest(state.worksheet) !== state.worksheet_digest || state.worksheet.backup_inventory_digest !== lock.backup_inventory_digest || (state.authorization?.digest ?? null) !== (lock.authorization_digest ?? null) || state.ready_digest !== null || state.receipt !== null || !Array.isArray(state.installed_targets) || state.installed_targets.length !== 0 || state.database_installed !== null) {
      fail3("RECOVERY_REQUIRED", "pre-ready recovery state contains unbound authority");
    }
  }
  const unexpected = [
    join(lock.backup_path, "receipt.json"),
    join(lock.backup_path, ACTIVATION_READY_FILE),
    safePath(root, COORDINATION_DATABASE),
    join(lock.stage_path, ...COORDINATION_DATABASE.split("/")),
    join(lock.stage_path, "schema5-manifest.json")
  ].some((path) => existsSync(path)) || walkFiles(lock.stage_path).length !== 0;
  const current = readWorkspaceManifest(root);
  if (unexpected || !current.ok || current.manifest.schema_version !== 4) {
    fail3("RECOVERY_REQUIRED", "pre-ready recovery has contradictory physical anchors");
  }
  for (const [path, label] of [
    [safePath(root, ".kai/manifest.json"), "schema-4 manifest"],
    [safePath(root, LEGACY_DATABASE), "schema-4 coordination database"]
  ]) {
    if (!existsSync(path)) fail3("RECOVERY_REQUIRED", `${label} is missing`);
    const stat = lstatSync(path);
    if (!stat.isFile() || stat.nlink !== 1 || pathHasLink(dirname(path), path) || !exactPath(path)) {
      fail3("RECOVERY_REQUIRED", `${label} changed type or identity`);
    }
  }
  return {
    phase: "locked",
    state,
    ready: null,
    receipt: null,
    activeSchema5: false,
    targets: [],
    installedTargets: [],
    installedDatabase: null
  };
}
function deriveRecoveryAuthority(root, lock, state) {
  if (!existsSync(join(lock.backup_path, "ready.json"))) {
    return deriveLockedRecovery(root, lock, state);
  }
  const immutable = immutableRecoveryPlan(root, lock, state);
  if (existsSync(lock.stage_path)) {
    const stageStat = lstatSync(lock.stage_path);
    if (!stageStat.isDirectory() || pathHasLink(dirname(lock.stage_path), lock.stage_path) || !exactPath(lock.stage_path)) {
      fail3("RECOVERY_REQUIRED", "migration stage changed type, link, or canonical identity");
    }
  }
  const expectedRetired = new Map(
    immutable.worksheet.backup_inventory.private_files.filter((entry) => entry.path !== ".kai/manifest.json" && !entry.path.startsWith(HOST_RUNTIME)).map((entry) => [entry.path, entry])
  );
  const retiredInventory = walkFiles(join(lock.stage_path, "retired"));
  for (const entry of retiredInventory) {
    const expected = expectedRetired.get(entry.path);
    if (!expected || entry.digest !== expected.digest || entry.size !== expected.size) {
      fail3("RECOVERY_REQUIRED", `retired tree contains unbound bytes: ${entry.path}`);
    }
  }
  const externalReceipt = existsSync(join(lock.backup_path, "receipt.json")) ? readJson(join(lock.backup_path, "receipt.json"), "schema-5 migration receipt") : null;
  if (externalReceipt && typeof externalReceipt.activated !== "boolean") {
    fail3("RECOVERY_REQUIRED", "external migration receipt activation state is invalid");
  }
  const externalActivationReady = existsSync(
    join(lock.backup_path, ACTIVATION_READY_FILE)
  ) ? readJson(
    join(lock.backup_path, ACTIVATION_READY_FILE),
    "schema-5 activation ready record"
  ) : null;
  const stagedDatabasePath = join(
    lock.stage_path,
    ...COORDINATION_DATABASE.split("/")
  );
  const liveDatabasePath = safePath(root, COORDINATION_DATABASE);
  const stagedDatabase = inspectAnchoredDatabase({
    root,
    lock,
    immutable,
    databasePath: stagedDatabasePath,
    externalReceipt,
    externalActivationReady,
    label: "staged schema-5 database"
  });
  const liveDatabase = inspectAnchoredDatabase({
    root,
    lock,
    immutable,
    databasePath: liveDatabasePath,
    externalReceipt,
    externalActivationReady,
    label: "live schema-5 database"
  });
  if (stagedDatabase.authority && liveDatabase.authority) {
    fail3("RECOVERY_REQUIRED", "staged and live schema-5 database authority is ambiguous");
  }
  if (liveDatabase.authority && stagedDatabase.exists) {
    fail3("RECOVERY_REQUIRED", "live schema-5 database conflicts with a remaining staged database");
  }
  const databaseAuthority = liveDatabase.authority ?? stagedDatabase.authority;
  const databaseLocation = liveDatabase.authority ? "live" : stagedDatabase.authority ? "staged" : null;
  if ((externalReceipt || externalActivationReady) && !databaseAuthority) {
    fail3("RECOVERY_REQUIRED", "external migration anchors have no verified database authority");
  }
  const manifest = inspectRecoveryManifest(root, immutable);
  const sourceEntries = immutable.worksheet.backup_inventory.private_files.filter((entry) => entry.path !== ".kai/manifest.json" && !entry.path.startsWith(HOST_RUNTIME));
  const sources = sourceEntries.map((entry) => {
    const livePath = safePath(root, entry.path);
    const retainedPath = retiredPath(lock, entry.path);
    const live = inspectRecoveryFile(livePath, entry, `live schema-4 source ${entry.path}`);
    const retired = inspectRecoveryFile(
      retainedPath,
      entry,
      `retired schema-4 source ${entry.path}`
    );
    if (retired.exists && !retired.owned) {
      fail3("RECOVERY_REQUIRED", `retired schema-4 source changed: ${entry.path}`);
    }
    if (retired.exists && live.exists) {
      fail3(
        "RECOVERY_REQUIRED",
        `schema-4 source authority is ambiguous between live and retired bytes: ${entry.path}`
      );
    }
    return { entry, live, retired };
  });
  const retiredCount = sources.filter((source) => source.retired.owned).length;
  if (!databaseAuthority) {
    walkFiles(lock.stage_path);
    if (manifest.kind === "schema5" || retiredCount !== 0 || liveDatabase.authority || stagedDatabase.authority) {
      fail3("RECOVERY_REQUIRED", "post-ready live mutation has no complete database anchor");
    }
    const recovery2 = {
      ...immutable,
      phase: "backup-verified",
      manifest,
      receipt: null,
      activationReady: null,
      receiptNeedsWrite: false,
      activationReadyNeedsWrite: false,
      databaseLocation: null,
      stagedDatabase,
      liveDatabase,
      targets: immutable.installedInventory.authored_targets.map((entry) => ({
        entry,
        live: inspectRecoveryFile(
          liveSchema5InventoryPath(root, entry.path, `migration target ${entry.path}`),
          entry,
          `migration target ${entry.path}`
        ),
        staged: inspectRecoveryFile(
          stagedSchema5InventoryPath(lock, entry.path, `staged migration target ${entry.path}`),
          entry,
          `staged migration target ${entry.path}`
        ),
        location: null
      })),
      sources,
      installedTargets: [],
      installedDatabase: null,
      installedFiles: immutable.installedInventory,
      activeSchema5: false,
      state: { ...immutable.state }
    };
    validateMutableRecoveryInventory(state, recovery2);
    return recovery2;
  }
  const installedFiles = databaseAuthority.installedFiles;
  const targets = installedFiles.authored_targets.map((entry) => {
    const live = inspectRecoveryFile(
      liveSchema5InventoryPath(root, entry.path, `migration target ${entry.path}`),
      entry,
      `migration target ${entry.path}`
    );
    const staged = inspectRecoveryFile(
      stagedSchema5InventoryPath(lock, entry.path, `staged migration target ${entry.path}`),
      entry,
      `staged migration target ${entry.path}`
    );
    if (live.owned && staged.owned) {
      fail3("RECOVERY_REQUIRED", `schema-5 target authority is ambiguous: ${entry.path}`);
    }
    if (staged.exists && !staged.owned) {
      fail3("RECOVERY_REQUIRED", `staged schema-5 target changed: ${entry.path}`);
    }
    if (live.owned && staged.exists) {
      fail3("RECOVERY_REQUIRED", `installed schema-5 target conflicts with staged bytes: ${entry.path}`);
    }
    if (staged.owned) return { entry, live, staged, location: "staged" };
    if (live.owned) return { entry, live, staged, location: "live" };
    if (live.exists) {
      fail3("RECOVERY_REQUIRED", `schema-5 target has no remaining staged authority: ${entry.path}`);
    }
    fail3("RECOVERY_REQUIRED", `schema-5 target authority is missing: ${entry.path}`);
  });
  const installedTargets = targets.filter((target) => target.location === "live").map((target) => target.entry);
  const allSourcesRetired = retiredCount === sources.length;
  const sourcesCleared = sources.every((source) => source.retired.owned || !source.retired.exists && !source.live.exists);
  const installedSourceAuthority = manifest.kind === "schema5" ? sourcesCleared : allSourcesRetired;
  if (installedTargets.length !== 0 && !installedSourceAuthority) {
    fail3("RECOVERY_REQUIRED", "schema-5 targets were installed before source retirement completed");
  }
  if (databaseLocation === "live" && (!installedSourceAuthority || installedTargets.length !== targets.length)) {
    fail3("RECOVERY_REQUIRED", "live schema-5 database lacks its complete installed inventory");
  }
  const stagedManifest = inspectRecoveryFile(
    join(lock.stage_path, "schema5-manifest.json"),
    installedFiles.manifest,
    "staged schema-5 manifest"
  );
  if (manifest.kind === "schema5") {
    if (databaseLocation !== "live" || installedTargets.length !== targets.length || !sourcesCleared || stagedManifest.exists) {
      fail3("RECOVERY_REQUIRED", "active schema-5 manifest conflicts with incomplete installation anchors");
    }
  } else {
    if (databaseAuthority.receipt.activated === true) {
      fail3("RECOVERY_REQUIRED", "activated receipt conflicts with a non-schema-5 manifest");
    }
    if (!stagedManifest.owned) {
      fail3("RECOVERY_REQUIRED", "staged schema-5 manifest authority is missing or changed");
    }
  }
  let phase = "staged";
  if (manifest.kind === "schema5") phase = "activated";
  else if (databaseLocation === "live") phase = "db-moved";
  else if (allSourcesRetired) phase = "sources-retired";
  const receipt = {
    ...databaseAuthority.receipt,
    activated: externalReceipt?.activated === true
  };
  const normalizedState = {
    ...immutable.state,
    phase,
    receipt,
    installed_targets: installedTargets,
    database_installed: databaseLocation === "live" ? installedFiles.database : null
  };
  const recovery = {
    ...immutable,
    phase,
    manifest,
    receipt,
    activationReady: databaseAuthority.activationReady,
    receiptNeedsWrite: externalReceipt === null,
    activationReadyNeedsWrite: externalActivationReady === null,
    databaseLocation,
    stagedDatabase,
    liveDatabase,
    targets,
    sources,
    installedTargets,
    installedDatabase: normalizedState.database_installed,
    installedFiles,
    activeSchema5: manifest.kind === "schema5",
    allSourcesRetired,
    sourcesCleared,
    state: normalizedState
  };
  validateMutableRecoveryInventory(state, recovery);
  return recovery;
}
function persistRecoveryAuthority(lock, recovery) {
  if (recovery.activationReadyNeedsWrite) {
    durableWrite(
      join(lock.backup_path, ACTIVATION_READY_FILE),
      canonicalJson(recovery.activationReady)
    );
  }
  if (recovery.receiptNeedsWrite) {
    durableWrite(join(lock.backup_path, "receipt.json"), canonicalJson(recovery.receipt));
  }
  writeState(lock, recovery.state);
}
function verifyRecoverySourcesForActivation(root, validated, lock, recovery) {
  for (const source of recovery.sources) {
    if (source.retired.owned) {
      if (source.live.exists) {
        fail3("RECOVERY_REQUIRED", `retired schema-4 source was recreated: ${source.entry.path}`);
      }
      assertOwnedFile(
        retiredPath(lock, source.entry.path),
        source.entry,
        `retired schema-4 source ${source.entry.path}`
      );
    } else {
      assertOwnedFile(
        safePath(root, source.entry.path),
        source.entry,
        `live schema-4 source ${source.entry.path}`
      );
    }
  }
  if (recovery.manifest.kind !== "schema4") {
    fail3("RECOVERY_REQUIRED", "schema-4 manifest changed before activation");
  }
  assertOwnedFile(
    safePath(root, ".kai/manifest.json"),
    recovery.manifest.sourceEntry,
    "live schema-4 manifest"
  );
  if (canonicalJson(trackedPrivateFiles(root, validated.sourceManifest)) !== canonicalJson(validated.worksheet.backup_inventory.git_tracking)) {
    fail3("RECOVERY_REQUIRED", "schema-4 Git tracking changed during recovery");
  }
  samePublic(root, validated);
  sameRegistry(validated);
}
function recoveryValidated(root, lock, recovery, roles, env) {
  if (recovery.databaseLocation !== "live") {
    const frozen = frozenWorksheet(lock.backup_path, recovery.worksheet);
    const validated = validateWorksheetAgainstSource({
      root,
      worksheet: recovery.worksheet,
      roles,
      env,
      fresh: frozen.fresh,
      sourceManifest: frozen.sourceManifest
    });
    validated.roles = [...roles];
    validated.env = env;
    return validated;
  }
  const projects = recovery.candidateManifest.projects.map((project) => ({
    project,
    ...resolveConfiguredProject({
      workspaceRoot: root,
      manifest: recovery.candidateManifest,
      projectId: project.id
    })
  }));
  const records = /* @__PURE__ */ new Map();
  const primaryTargets = /* @__PURE__ */ new Map();
  for (const collection of ["epics", "milestones", "items"]) {
    for (const entry of recovery.worksheet[collection]) {
      const primary = validateClassification(
        entry,
        collection,
        records,
        roles,
        recovery.worksheet
      );
      primaryTargets.set(sourceKey(entry.source), primary);
    }
  }
  validateHierarchyRelationships([...records.values()]);
  validateTaskDependencies(records);
  validateMappedLegacyDependencies(recovery.worksheet, primaryTargets);
  validateAuthoredFiles(recovery.worksheet);
  validateRetainedPublications(recovery.worksheet);
  validateActiveWork(recovery.worksheet, primaryTargets);
  return {
    worksheet: recovery.worksheet,
    worksheetDigest: lock.worksheet_digest,
    sourceManifest: recovery.sourceManifest,
    candidateManifest: recovery.candidateManifest,
    direction: readDirection({ workspaceRoot: root, manifest: recovery.candidateManifest }),
    projects,
    sourceProjects: configuredProjects(root, recovery.sourceManifest),
    backupRoot: dirname(lock.backup_path),
    records,
    primaryTargets,
    roles,
    env
  };
}
function verifyActivatedRecovery(root, lock, recovery, env) {
  if (!recovery.activeSchema5 || recovery.databaseLocation !== "live") {
    fail3("RECOVERY_REQUIRED", "activated recovery lacks live schema-5 authority");
  }
  const current = readWorkspaceManifest(root);
  if (!current.ok || canonicalJson(current.manifest) !== canonicalJson(recovery.candidateManifest)) {
    fail3("RECOVERY_REQUIRED", current.ok ? "active schema-5 manifest changed from its migration plan" : current.reason);
  }
  const validation = validateSchema5Manifest(root, current.manifest, { env });
  if (validation.errors.length) fail3("RECOVERY_REQUIRED", validation.errors.join("; "));
  const { migration } = readLiveMigration(root);
  const receipt = recovery.receipt;
  if (receipt.digest !== migration.receipt_digest || digest(receipt.payload) !== receipt.digest || receipt.id !== receipt.payload.migration_id || receipt.payload.workspace_id !== current.manifest.workspace_id || normalized(receipt.payload.backup_path) !== normalized(migration.backup_path) || normalized(receipt.backupPath) !== normalized(migration.backup_path) || normalized(receipt.databasePath) !== normalized(safePath(root, COORDINATION_DATABASE)) || normalized(receipt.payload.workspace_root) !== normalized(canonicalPath(root)) || hash(manifestBytes(root)) !== receipt.payload.activated_manifest_digest) {
    fail3("RECOVERY_REQUIRED", "activated schema-5 receipt binding is invalid");
  }
  const authority = backupAuthority(migration.backup_path, receipt);
  const plannedInventory = schema5InstalledInventory(
    authority.worksheet,
    current.manifest
  );
  const installedFiles = verifyLiveSchema5Files(
    root,
    receipt,
    plannedInventory
  );
  verifyInstalledMigrationAnchor({
    root,
    lock,
    state: recovery.state,
    receipt,
    databasePath: safePath(root, COORDINATION_DATABASE),
    activationReady: recovery.activationReady
  });
  return {
    manifest: current.manifest,
    migration,
    receipt,
    authority,
    installedFiles
  };
}
function finalizeActivatedRecovery(root, lock, recovery, env) {
  const verified = verifyActivatedRecovery(root, lock, recovery, env);
  const receipt = { ...verified.receipt, activated: true };
  if (recovery.activationReadyNeedsWrite) {
    durableWrite(
      join(lock.backup_path, ACTIVATION_READY_FILE),
      canonicalJson(recovery.activationReady)
    );
  }
  const receiptPath = join(lock.backup_path, "receipt.json");
  const retainedReceipt = existsSync(receiptPath) ? readJson(receiptPath, "schema-5 migration receipt") : null;
  if (canonicalJson(receipt) !== canonicalJson(retainedReceipt)) {
    durableWrite(receiptPath, canonicalJson(receipt));
  }
  writeState(lock, {
    ...recovery.state,
    phase: "activated",
    receipt,
    installed_targets: verified.installedFiles.authored_targets,
    database_installed: verified.installedFiles.database
  });
  if (existsSync(lock.stage_path)) {
    const stat = lstatSync(lock.stage_path);
    if (!stat.isDirectory() || pathHasLink(dirname(lock.stage_path), lock.stage_path) || !exactPath(lock.stage_path)) {
      fail3("RECOVERY_REQUIRED", "migration stage changed type, link, or canonical identity");
    }
    rmSync(lock.stage_path, { recursive: true, force: false });
    fsyncDirectory(dirname(lock.stage_path));
  }
  releaseLock(v5MigrationLockPath(root), lock);
  return receipt;
}
function continueActivation(root, validated, lock, recovery) {
  if (recovery.activeSchema5) {
    return finalizeActivatedRecovery(root, lock, recovery, validated.env);
  }
  let current = recovery;
  if (current.receipt === null) {
    removeAbandonStage(lock, {
      restorationRequired: false,
      restorationVerified: false
    });
    const readyState = {
      ...current.state,
      phase: "backup-verified",
      receipt: null,
      installed_targets: [],
      database_installed: null
    };
    writeState(lock, readyState);
    stageMigrationStore(root, validated, lock, readyState);
    current = deriveRecoveryAuthority(root, lock, readState(lock));
  }
  persistRecoveryAuthority(lock, current);
  if (!current.allSourcesRetired) {
    assertAtomicReplacementSupported(lock);
    verifyRecoverySourcesForActivation(root, validated, lock, current);
    retireSources(root, validated, lock, current.state);
    current = deriveRecoveryAuthority(root, lock, readState(lock));
    persistRecoveryAuthority(lock, current);
  }
  if (current.databaseLocation !== "live") {
    const state = {
      ...current.state,
      phase: "sources-retired",
      installed_targets: current.installedTargets,
      database_installed: null
    };
    writeState(lock, state);
    moveAuthoredTargets(root, validated, lock, state);
    moveDatabase(root, lock, state);
    current = deriveRecoveryAuthority(root, lock, readState(lock));
    persistRecoveryAuthority(lock, current);
  }
  if (current.manifest.kind !== "schema5") {
    const state = {
      ...current.state,
      phase: "db-moved",
      installed_targets: current.installedTargets,
      database_installed: current.installedFiles.database
    };
    writeState(lock, state);
    removeEmptyDirectories(root);
    validateActivationTree(root, validated, lock, state);
    if (current.manifest.kind !== "schema4") {
      fail3("RECOVERY_REQUIRED", "schema-4 manifest changed before activation");
    }
    renameSync(
      join(lock.stage_path, "schema5-manifest.json"),
      safePath(root, ".kai/manifest.json")
    );
    current = deriveRecoveryAuthority(root, lock, readState(lock));
  }
  return finalizeActivatedRecovery(root, lock, current, validated.env);
}
function abandonRecoveryFromOperation(root, lock, state, operation) {
  const immutable = immutableRecoveryPlan(root, lock, state);
  const expectedTargets = new Map(
    immutable.installedInventory.authored_targets.map((entry) => [entry.path, entry])
  );
  const seen = /* @__PURE__ */ new Set();
  for (const entry of operation.installed_targets) {
    const expected = expectedTargets.get(entry?.path);
    if (!expected || seen.has(entry.path) || canonicalJson(entry) !== canonicalJson(expected)) {
      fail3("RECOVERY_REQUIRED", "abandon operation target inventory is outside the migration plan");
    }
    seen.add(entry.path);
  }
  const installedDatabase = operation.installed_database;
  if (installedDatabase !== null && (installedDatabase.path !== immutable.installedInventory.database.path || installedDatabase.type !== "sqlite" || !/^[a-f0-9]{64}$/.test(installedDatabase.digest))) {
    fail3("RECOVERY_REQUIRED", "abandon operation database inventory is outside the migration plan");
  }
  return {
    ...immutable,
    installedTargets: operation.installed_targets,
    installedDatabase,
    sources: []
  };
}
function preflightJournalRestoration(root, recovery) {
  for (const entry of recovery.worksheet.backup_inventory.private_files) {
    if (entry.path.startsWith(HOST_RUNTIME)) continue;
    const backup = join(
      recovery.lock.backup_path,
      "private",
      ...entry.path.split("/")
    );
    assertOwnedFile(backup, entry, `backed-up schema-4 authority ${entry.path}`);
    const live = safePath(root, entry.path);
    if (existsSync(live)) {
      const stat = lstatSync(live);
      if (!stat.isFile() || stat.nlink !== 1 || pathHasLink(dirname(live), live) || !exactPath(live)) {
        fail3("RECOVERY_REQUIRED", `schema-4 restore target changed type or identity: ${entry.path}`);
      }
    }
  }
}
function removeJournaledSchema5Files(root, recovery) {
  for (const entry of recovery.installedTargets) {
    const path2 = liveSchema5InventoryPath(
      root,
      entry.path,
      `migration-owned target ${entry.path}`
    );
    if (!existsSync(path2)) continue;
    assertOwnedFile(path2, entry, `migration-owned target ${entry.path}`);
    unlinkSync(path2);
    fsyncParents(path2, root);
  }
  if (!recovery.installedDatabase) return;
  const path = safePath(root, COORDINATION_DATABASE);
  if (!existsSync(path)) return;
  assertOwnedDatabase(
    path,
    recovery.installedDatabase,
    "migration-owned schema-5 database"
  );
  unlinkSync(path);
  fsyncParents(path, root);
}
function preflightSchema4Restoration(root, lock, recovery) {
  for (const entry of recovery.worksheet.backup_inventory.private_files) {
    if (entry.path.startsWith(HOST_RUNTIME)) continue;
    const backup = join(lock.backup_path, "private", ...entry.path.split("/"));
    assertOwnedFile(backup, entry, `backed-up schema-4 authority ${entry.path}`);
    const live = safePath(root, entry.path);
    if (!existsSync(live)) continue;
    const stat = lstatSync(live);
    if (!stat.isFile() || stat.nlink !== 1 || pathHasLink(dirname(live), live) || !exactPath(live)) {
      fail3("RECOVERY_REQUIRED", `schema-4 restore target changed type or identity: ${entry.path}`);
    }
  }
  for (const source of recovery.sources ?? []) {
    if (source.retired.exists && source.live.exists) {
      fail3(
        "RECOVERY_REQUIRED",
        `schema-4 restore target was concurrently recreated: ${source.entry.path}`
      );
    }
  }
}
function restoreExactSchema4(root, lock, recovery) {
  const entries = recovery.worksheet.backup_inventory.private_files.filter((entry) => !entry.path.startsWith(HOST_RUNTIME)).sort((left, right) => left.path === ".kai/manifest.json" ? 1 : right.path === ".kai/manifest.json" ? -1 : left.path.localeCompare(right.path));
  for (const entry of entries) {
    const backup = join(lock.backup_path, "private", ...entry.path.split("/"));
    const live = safePath(root, entry.path);
    durableReplace(backup, live, lock.id);
    assertOwnedFile(live, entry, `restored schema-4 authority ${entry.path}`);
    fsyncParents(live, root);
  }
  fsyncDirectory(join(root, ".kai"));
}
function verifyAbandonRestoration(root, recovery) {
  for (const entry of recovery.worksheet.backup_inventory.private_files) {
    if (entry.path.startsWith(HOST_RUNTIME)) continue;
    assertOwnedFile(
      safePath(root, entry.path),
      entry,
      `restored schema-4 authority ${entry.path}`
    );
  }
  for (const entry of recovery.installedTargets) {
    if (existsSync(liveSchema5InventoryPath(
      root,
      entry.path,
      `migration-owned target ${entry.path}`
    ))) {
      fail3("RECOVERY_REQUIRED", `schema-5 target remains after abandon: ${entry.path}`);
    }
  }
  if (recovery.installedDatabase && existsSync(safePath(root, COORDINATION_DATABASE))) {
    fail3("RECOVERY_REQUIRED", "schema-5 database remains after abandon");
  }
  const current = readWorkspaceManifest(root);
  if (!current.ok || current.manifest.schema_version !== 4) {
    fail3("RECOVERY_REQUIRED", current.ok ? "schema-4 authority was not restored" : current.reason);
  }
}
function removeAbandonStage(lock, { restorationRequired, restorationVerified }) {
  if (!existsSync(lock.stage_path)) return;
  const stat = lstatSync(lock.stage_path);
  if (!stat.isDirectory() || pathHasLink(dirname(lock.stage_path), lock.stage_path) || !exactPath(lock.stage_path)) {
    fail3("RECOVERY_REQUIRED", "migration stage changed type, link, or canonical identity");
  }
  const retired = walkFiles(lock.stage_path, "retired");
  if (retired.length !== 0 && !restorationVerified || restorationRequired && !restorationVerified) {
    fail3(
      "RECOVERY_REQUIRED",
      "refusing to remove a migration stage before retired sources are durably restored"
    );
  }
  rmSync(lock.stage_path, { recursive: true, force: false });
  fsyncDirectory(dirname(lock.stage_path));
}
function resumeAbandonOperation(root, lock, lockPath, state, operation) {
  const journaled = abandonRecoveryFromOperation(
    root,
    lock,
    state,
    operation
  );
  journaled.lock = lock;
  preflightJournalRestoration(root, journaled);
  removeJournaledSchema5Files(root, journaled);
  restoreExactSchema4(root, lock, journaled);
  verifyAbandonRestoration(root, journaled);
  removeAbandonStage(lock, {
    restorationRequired: true,
    restorationVerified: true
  });
  releaseLock(lockPath, lock);
  return {
    id: lock.id,
    activated: false,
    abandoned: true,
    backupPath: lock.backup_path
  };
}
function abandonMigration(root, lock, recovery, env) {
  if (lock.rollback === true || normalized(lock.stage_path) !== normalized(v5StagePath(root, lock.id))) {
    fail3("RECOVERY_REQUIRED", "abandon lock does not name the canonical migration stage");
  }
  if (recovery.activeSchema5) {
    const verified = verifyActivatedRecovery(root, lock, recovery, env);
    const lockPath2 = v5MigrationLockPath(root);
    const rollbackId = randomUUID();
    bindRecoveryOperation(
      lockPath2,
      lock,
      rollbackOperationPayload(lock, verified.receipt, rollbackId)
    );
    return rollbackActivatedWorkspace({
      root,
      lock,
      lockPath: lockPath2,
      rollbackId
    });
  }
  if (recovery.phase === "locked") {
    removeAbandonStage(lock, {
      restorationRequired: false,
      restorationVerified: false
    });
    releaseLock(v5MigrationLockPath(root), lock);
    return {
      id: lock.id,
      activated: false,
      abandoned: true,
      backupPath: existsSync(lock.backup_path) ? lock.backup_path : null
    };
  }
  assertAtomicReplacementSupported(lock);
  preflightSchema4Restoration(root, lock, recovery);
  const lockPath = v5MigrationLockPath(root);
  const operation = bindRecoveryOperation(lockPath, lock, {
    schema_version: 1,
    kind: "abandon",
    lock_id: lock.id,
    worksheet_digest: lock.worksheet_digest,
    backup_inventory_digest: lock.backup_inventory_digest,
    installed_targets: recovery.installedTargets,
    installed_database: recovery.installedDatabase
  });
  return resumeAbandonOperation(
    root,
    lock,
    lockPath,
    existsSync(join(lock.backup_path, "state.json")) ? readState(lock) : null,
    operation
  );
}
function recoverWorkspaceV5({
  root,
  confirm,
  action,
  roles = [],
  env = process.env
} = {}) {
  confirmMigration(confirm);
  if (!Array.isArray(roles) || roles.some((role) => typeof role !== "string")) {
    fail3("INVALID_INPUT", "installed recovery roles must be explicit strings");
  }
  if (!(/* @__PURE__ */ new Set(["activate", "abandon"])).has(action)) {
    fail3("INVALID_INPUT", "schema-5 recovery action must be activate or abandon");
  }
  const { path: lockPath, lock } = readLock(root);
  const statePath = join(lock.backup_path, "state.json");
  const state = existsSync(statePath) ? readState(lock) : null;
  const operation = validateRecoveryOperation(lock);
  if (operation) {
    if (action !== "abandon") {
      fail3("RECOVERY_REQUIRED", "an interrupted abandon or rollback may only resume through recover --action abandon");
    }
    if (operation.kind === "abandon") {
      return resumeAbandonOperation(root, lock, lockPath, state, operation);
    }
    return rollbackActivatedWorkspace({
      root,
      lock,
      lockPath,
      rollbackId: operation.rollback_id
    });
  }
  const recovery = deriveRecoveryAuthority(root, lock, state);
  if (action === "abandon") return abandonMigration(root, lock, recovery, env);
  if (recovery.phase === "locked") {
    fail3("RECOVERY_REQUIRED", "schema-5 migration backup was not verified; only abandon is safe");
  }
  if (recovery.activeSchema5) {
    return finalizeActivatedRecovery(root, lock, recovery, env);
  }
  const validated = recoveryValidated(root, lock, recovery, roles, env);
  return continueActivation(root, validated, lock, recovery);
}
function migrationMetadata(database, label) {
  let migration;
  let baseline;
  try {
    migration = JSON.parse(database.prepare(
      "SELECT value FROM metadata WHERE key='migration_v5'"
    ).get()?.value ?? "null");
    baseline = JSON.parse(database.prepare(
      "SELECT value FROM metadata WHERE key='migration_v5_baseline'"
    ).get()?.value ?? "null");
  } catch {
    fail3("RECOVERY_REQUIRED", `${label} migration metadata is invalid`);
  }
  if (!migration || !baseline) {
    fail3("RECOVERY_REQUIRED", "schema-5 workspace has no recognized migration receipt");
  }
  return { migration, baseline };
}
function readLiveMigration(root) {
  const store = openStore({
    path: safePath(root, COORDINATION_DATABASE),
    mode: "read"
  });
  try {
    const result = migrationMetadata(store.database, "schema-5");
    if (canonicalJson(eventBaseline(store.database)) !== canonicalJson(result.baseline)) {
      fail3(
        "RECOVERY_REQUIRED",
        "schema-5 event log advanced beyond the activation baseline; explicit reconciliation is required"
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
    mode: "write"
  });
  try {
    store.database.exec("BEGIN EXCLUSIVE");
    const result = migrationMetadata(store.database, "rollback");
    if (result.migration.receipt_digest !== expectedReceiptDigest || canonicalJson(eventBaseline(store.database)) !== canonicalJson(result.baseline)) {
      fail3(
        "RECOVERY_REQUIRED",
        "schema-5 event log or migration receipt changed under rollback barrier"
      );
    }
    return { store, active: true };
  } catch (error) {
    closeStore(store);
    throw error;
  }
}
function closeRollbackBarrier(barrier, commit) {
  if (!barrier?.active) return;
  try {
    barrier.store.database.exec(commit ? "COMMIT" : "ROLLBACK");
  } finally {
    barrier.active = false;
    closeStore(barrier.store);
  }
}
function backupAuthority(backupPath, receipt) {
  const worksheet = readJson(
    join(backupPath, "worksheet.json"),
    "migration worksheet backup"
  );
  if (digest(worksheet) !== receipt.payload.worksheet_digest || worksheet.backup_inventory_digest !== receipt.payload.backup_inventory_digest) {
    fail3("RECOVERY_REQUIRED", "migration receipt does not bind the backup worksheet inventory");
  }
  const ready = readJson(join(backupPath, "ready.json"), "migration ready record");
  if (ready.digest !== receipt.payload.ready_digest) {
    fail3("RECOVERY_REQUIRED", "migration receipt does not bind the ready record");
  }
  const authorization = receipt.payload.authorization_digest === null ? null : readJson(join(backupPath, "authorization.json"), "migration authorization proof");
  if ((authorization?.digest ?? null) !== receipt.payload.authorization_digest) {
    fail3("RECOVERY_REQUIRED", "migration receipt does not bind the authorization proof");
  }
  verifyBackup(backupPath, worksheet, ready, authorization);
  return { worksheet, ready, authorization };
}
function stageRollbackInventory(backupPath, stagePath, inventory) {
  const restoreRoot = join(stagePath, "restore");
  mkdirSync(restoreRoot, { recursive: true });
  for (const entry of inventory.private_files) {
    const source = join(backupPath, "private", ...entry.path.split("/"));
    assertOwnedFile(source, entry, `backed-up schema-4 source ${entry.path}`);
    const target = join(restoreRoot, ...entry.path.split("/"));
    if (existsSync(target)) {
      assertOwnedFile(target, entry, `staged rollback source ${entry.path}`);
    } else {
      durableCopy(source, target);
    }
  }
  sameInventory(
    inventory.private_files,
    actualInventory(restoreRoot),
    "staged rollback inventory changed"
  );
  return restoreRoot;
}
function preserveRollbackHost(root, backupPath, rollbackId, receipt) {
  const hostRoot = join(root, ...HOST_RUNTIME.slice(0, -1).split("/"));
  const auditRoot = join(
    dirname(backupPath),
    `${basename(backupPath)}-rollback-${rollbackId}`
  );
  const pendingRoot = `${auditRoot}.pending`;
  const publishedProof = () => {
    const retainedRoot2 = join(auditRoot, "host");
    const proofPath2 = join(auditRoot, "receipt.json");
    const proof2 = readJson(proofPath2, "rollback host audit receipt");
    if (proof2.digest !== digest(proof2.payload) || proof2.payload?.schema_version !== 1 || proof2.payload.rollback_id !== rollbackId || proof2.payload.migration_receipt_digest !== receipt.digest || !Array.isArray(proof2.payload.live_inventory)) {
      fail3("RECOVERY_REQUIRED", "rollback host audit receipt binding is invalid");
    }
    const expectedRetained2 = proof2.payload.live_inventory.map((entry) => ({
      ...entry,
      path: entry.path.slice(HOST_RUNTIME.length)
    }));
    sameInventory(
      expectedRetained2,
      actualInventory(retainedRoot2),
      "external rollback host audit copy changed"
    );
    return {
      hostRoot,
      liveInventory: proof2.payload.live_inventory,
      auditRoot
    };
  };
  if (existsSync(auditRoot)) {
    const published = lstatSync(auditRoot);
    if (!published.isDirectory() || pathHasLink(dirname(auditRoot), auditRoot) || !exactPath(auditRoot)) {
      fail3("RECOVERY_REQUIRED", "published rollback host audit changed type, link, or canonical identity");
    }
    if (existsSync(pendingRoot)) {
      fail3("RECOVERY_REQUIRED", "published rollback host audit conflicts with an incomplete staging directory");
    }
    return publishedProof();
  }
  if (!existsSync(hostRoot)) {
    if (existsSync(pendingRoot)) {
      fail3("RECOVERY_REQUIRED", "incomplete rollback host audit has no live host inventory to rebuild");
    }
    return null;
  }
  if (receipt.payload.authorization_digest === null) {
    fail3(
      "RECOVERY_REQUIRED",
      "schema-5 host runtime cannot be removed without external migration authorization proof"
    );
  }
  const liveInventory = walkFiles(root, HOST_RUNTIME.slice(0, -1)).map((entry) => ({ ...entry, type: "file" }));
  if (existsSync(pendingRoot)) {
    const pending = lstatSync(pendingRoot);
    if (!pending.isDirectory() || pathHasLink(dirname(pendingRoot), pendingRoot) || !exactPath(pendingRoot)) {
      fail3("RECOVERY_REQUIRED", "rollback host audit staging changed type, link, or canonical identity");
    }
    walkFiles(pendingRoot);
    rmSync(pendingRoot, { recursive: true, force: false });
    fsyncDirectory(dirname(pendingRoot));
  }
  const retainedRoot = join(pendingRoot, "host");
  const proofPath = join(pendingRoot, "receipt.json");
  mkdirSync(pendingRoot, { recursive: false });
  for (const entry of liveInventory) {
    durableCopy(
      join(root, ...entry.path.split("/")),
      join(retainedRoot, ...entry.path.slice(HOST_RUNTIME.length).split("/"))
    );
  }
  const retainedInventory = actualInventory(retainedRoot);
  const expectedRetained = liveInventory.map((entry) => ({
    ...entry,
    path: entry.path.slice(HOST_RUNTIME.length)
  }));
  sameInventory(
    expectedRetained,
    retainedInventory,
    "external rollback host audit copy changed"
  );
  const payload = {
    schema_version: 1,
    rollback_id: rollbackId,
    migration_receipt_digest: receipt.digest,
    live_inventory: liveInventory
  };
  const proof = { payload, digest: digest(payload) };
  durableWrite(
    proofPath,
    canonicalJson(proof)
  );
  fsyncDirectory(pendingRoot);
  renameSync(pendingRoot, auditRoot);
  fsyncDirectory(dirname(auditRoot));
  return { hostRoot, liveInventory, auditRoot };
}
function verifyLiveSchema5Files(root, receipt, plannedInventory, store = null) {
  const files = receipt.payload.schema5_files;
  if (!files?.manifest || !Array.isArray(files.authored_targets) || !files.database) {
    fail3("RECOVERY_REQUIRED", "migration receipt lacks exact schema-5 file ownership");
  }
  const expectedFiles = {
    ...plannedInventory,
    database: {
      ...plannedInventory.database,
      digest: files.database.digest
    }
  };
  if (canonicalJson(files) !== canonicalJson(expectedFiles)) {
    fail3("RECOVERY_REQUIRED", "migration receipt file inventory is outside the authorized plan");
  }
  assertOwnedFile(
    safePath(root, ".kai/manifest.json"),
    expectedFiles.manifest,
    "live schema-5 manifest"
  );
  for (const entry of expectedFiles.authored_targets) {
    assertOwnedFile(
      liveSchema5InventoryPath(
        root,
        entry.path,
        `live schema-5 authored target ${entry.path}`
      ),
      entry,
      `live schema-5 authored target ${entry.path}`
    );
  }
  assertOwnedDatabase(
    safePath(root, COORDINATION_DATABASE),
    expectedFiles.database,
    "live schema-5 database",
    store
  );
  return expectedFiles;
}
function installRollbackFiles(root, restoreRoot, inventory) {
  for (const entry of inventory.private_files) {
    if (entry.path === ".kai/manifest.json") continue;
    const staged = join(restoreRoot, ...entry.path.split("/"));
    const live = join(root, ...entry.path.split("/"));
    if (existsSync(live)) {
      assertOwnedFile(live, entry, `restored schema-4 source ${entry.path}`);
      if (existsSync(staged)) unlinkSync(staged);
      continue;
    }
    mkdirSync(dirname(live), { recursive: true });
    renameSync(staged, live);
    assertOwnedFile(live, entry, `restored schema-4 source ${entry.path}`);
  }
}
function finishSchema5Cleanup(root, installedFiles, hostProof) {
  for (const entry of installedFiles.authored_targets) {
    const target = liveSchema5InventoryPath(
      root,
      entry.path,
      `migration-owned schema-5 target ${entry.path}`
    );
    if (existsSync(target)) {
      assertOwnedFile(target, entry, `migration-owned schema-5 target ${entry.path}`);
    }
  }
  const database = safePath(root, COORDINATION_DATABASE);
  if (existsSync(database)) {
    assertOwnedDatabase(
      database,
      installedFiles.database,
      "migration-owned schema-5 database"
    );
  }
  if (hostProof && existsSync(hostProof.hostRoot)) {
    const currentHost = walkFiles(root, HOST_RUNTIME.slice(0, -1)).map((entry) => ({ ...entry, type: "file" }));
    const expected = new Map(hostProof.liveInventory.map((entry) => [entry.path, entry]));
    for (const entry of currentHost) {
      const owned = expected.get(entry.path);
      if (!owned || canonicalJson(entry) !== canonicalJson(owned)) {
        fail3("RECOVERY_REQUIRED", "schema-5 host runtime changed after external audit preservation");
      }
    }
  }
  for (const entry of installedFiles.authored_targets) {
    const path = liveSchema5InventoryPath(
      root,
      entry.path,
      `migration-owned schema-5 target ${entry.path}`
    );
    if (existsSync(path)) unlinkSync(path);
  }
  if (existsSync(database)) unlinkSync(database);
  if (hostProof && existsSync(hostProof.hostRoot)) {
    rmSync(hostProof.hostRoot, { recursive: true, force: false });
  }
  removeEmptyDirectories(root);
}
function rollbackOperationPayload(lock, receipt, rollbackId = lock.id) {
  return {
    schema_version: 1,
    kind: "rollback",
    lock_id: lock.id,
    rollback_id: rollbackId,
    migration_id: receipt.payload.migration_id,
    receipt_digest: receipt.digest,
    worksheet_digest: lock.worksheet_digest,
    backup_inventory_digest: lock.backup_inventory_digest
  };
}
function rollbackAuthorityFromOperation(root, lock, operation) {
  const receipt = readJson(
    join(lock.backup_path, "receipt.json"),
    "schema-5 migration receipt"
  );
  if (receipt.digest !== operation.receipt_digest || digest(receipt.payload) !== receipt.digest || receipt.payload.migration_id !== operation.migration_id || receipt.payload.worksheet_digest !== lock.worksheet_digest || receipt.payload.backup_inventory_digest !== lock.backup_inventory_digest) {
    fail3("RECOVERY_REQUIRED", "rollback operation receipt binding is invalid");
  }
  const authority = backupAuthority(lock.backup_path, receipt);
  const sourceManifest = readJson(
    join(lock.backup_path, "private", ".kai", "manifest.json"),
    "backed-up schema-4 manifest"
  );
  const candidate = candidateManifest(root, sourceManifest, authority.worksheet.placement);
  const plannedInventory = schema5InstalledInventory(authority.worksheet, candidate);
  const installedFiles = {
    ...plannedInventory,
    database: {
      ...plannedInventory.database,
      digest: receipt.payload.schema5_files?.database?.digest
    }
  };
  if (canonicalJson(receipt.payload.schema5_files) !== canonicalJson(installedFiles)) {
    fail3("RECOVERY_REQUIRED", "rollback operation file inventory is outside the migration plan");
  }
  return {
    authority,
    candidate,
    installedFiles,
    plannedInventory,
    receipt,
    sourceManifest
  };
}
function inspectRollbackManifest(root, authority) {
  const path = safePath(root, ".kai/manifest.json");
  const schema4 = authority.authority.worksheet.backup_inventory.private_files.find((entry) => entry.path === ".kai/manifest.json");
  if (!schema4) fail3("RECOVERY_REQUIRED", "rollback backup omits the schema-4 manifest");
  const historical = inspectRecoveryFile(path, schema4, "rollback schema-4 manifest");
  if (historical.owned) return { kind: "schema4", entry: schema4 };
  const active = inspectRecoveryFile(
    path,
    authority.installedFiles.manifest,
    "rollback schema-5 manifest"
  );
  if (active.owned) return { kind: "schema5", entry: authority.installedFiles.manifest };
  fail3("RECOVERY_REQUIRED", "rollback manifest is neither the bound schema-5 nor schema-4 authority");
}
function rollbackActivatedWorkspace({
  root,
  lock,
  lockPath,
  rollbackId
}) {
  const operation = validateRecoveryOperation(lock);
  if (!operation || operation.kind !== "rollback") {
    fail3("RECOVERY_REQUIRED", "rollback requires a durable operation journal");
  }
  const journaled = rollbackAuthorityFromOperation(root, lock, operation);
  let barrier = null;
  try {
    drainNativeWriterTokens(root);
    const restoreRoot = stageRollbackInventory(
      lock.backup_path,
      lock.stage_path,
      journaled.authority.worksheet.backup_inventory
    );
    assertAtomicReplacementSupported(lock);
    const currentManifest = inspectRollbackManifest(root, journaled);
    if (currentManifest.kind === "schema5") {
      verifyLiveSchema5Files(
        root,
        journaled.receipt,
        journaled.plannedInventory
      );
      barrier = beginRollbackBarrier(root, journaled.receipt.digest);
    } else {
      for (const entry of journaled.installedFiles.authored_targets) {
        const path = liveSchema5InventoryPath(
          root,
          entry.path,
          `migration-owned schema-5 target ${entry.path}`
        );
        if (existsSync(path)) {
          assertOwnedFile(path, entry, `migration-owned schema-5 target ${entry.path}`);
        }
      }
      const database = safePath(root, COORDINATION_DATABASE);
      if (existsSync(database)) {
        assertOwnedDatabase(
          database,
          journaled.installedFiles.database,
          "migration-owned schema-5 database"
        );
      }
    }
    const hostProof = preserveRollbackHost(
      root,
      lock.backup_path,
      rollbackId,
      journaled.receipt
    );
    installRollbackFiles(
      root,
      restoreRoot,
      journaled.authority.worksheet.backup_inventory
    );
    const stagedManifest = join(restoreRoot, ".kai", "manifest.json");
    const liveManifest = safePath(root, ".kai/manifest.json");
    for (const entry of journaled.authority.worksheet.backup_inventory.private_files) {
      if (entry.path === ".kai/manifest.json") {
        assertOwnedFile(stagedManifest, entry, "staged schema-4 manifest");
      } else {
        assertOwnedFile(
          join(root, ...entry.path.split("/")),
          entry,
          `restored schema-4 source ${entry.path}`
        );
      }
    }
    if (currentManifest.kind === "schema5") {
      verifyLiveSchema5Files(
        root,
        journaled.receipt,
        journaled.plannedInventory,
        barrier.store
      );
      renameSync(stagedManifest, liveManifest);
      closeRollbackBarrier(barrier, true);
      barrier = null;
    } else {
      assertOwnedFile(
        liveManifest,
        currentManifest.entry,
        "restored schema-4 manifest"
      );
      unlinkSync(stagedManifest);
    }
    finishSchema5Cleanup(root, journaled.installedFiles, hostProof);
    for (const entry of journaled.authority.worksheet.backup_inventory.private_files) {
      assertOwnedFile(
        join(root, ...entry.path.split("/")),
        entry,
        `rolled-back schema-4 source ${entry.path}`
      );
    }
    rmSync(lock.stage_path, { recursive: true, force: true });
    releaseLock(lockPath, lock);
    return {
      id: journaled.receipt.payload.migration_id,
      rolledBack: true,
      backupPath: lock.backup_path,
      rollbackAuditPath: hostProof?.auditRoot ?? null,
      schemaVersion: 4
    };
  } catch (error) {
    if (barrier) {
      try {
        closeRollbackBarrier(barrier, false);
      } catch (barrierError) {
        error.cause = new AggregateError(
          [error, barrierError],
          "rollback failure also failed to release the SQLite barrier"
        );
      }
    }
    throw error;
  }
}
function rollbackWorkspaceV5({
  root,
  confirm,
  env = process.env
} = {}) {
  confirmMigration(confirm);
  const current = readWorkspaceManifest(root);
  if (!current.ok || current.manifest.schema_version !== 5) {
    fail3("SCHEMA_MISMATCH", "schema-5 rollback requires an active schema-5 workspace");
  }
  const validation = validateSchema5Manifest(root, current.manifest, { env });
  if (validation.errors.length) fail3("RECOVERY_REQUIRED", validation.errors.join("; "));
  const manifest = current.manifest;
  const { migration } = readLiveMigration(root);
  const receipt = readJson(migration.receipt_path, "schema-5 migration receipt");
  if (receipt.digest !== migration.receipt_digest || digest(receipt.payload) !== receipt.digest || receipt.activated !== true || receipt.id !== receipt.payload.migration_id || receipt.payload.workspace_id !== manifest.workspace_id || typeof receipt.payload.backup_path !== "string" || typeof receipt.backupPath !== "string" || normalized(receipt.payload.backup_path) !== normalized(migration.backup_path) || normalized(receipt.backupPath) !== normalized(migration.backup_path) || typeof receipt.databasePath !== "string" || normalized(receipt.databasePath) !== normalized(safePath(root, COORDINATION_DATABASE)) || normalized(receipt.payload.workspace_root) !== normalized(canonicalPath(root))) {
    fail3("RECOVERY_REQUIRED", "schema-5 migration receipt binding is invalid");
  }
  if (hash(manifestBytes(root)) !== receipt.payload.activated_manifest_digest) {
    fail3("RECOVERY_REQUIRED", "schema-5 manifest changed after activation");
  }
  const authority = backupAuthority(migration.backup_path, receipt);
  const rollbackId = randomUUID();
  const lock = {
    schema_version: 1,
    id: rollbackId,
    root: canonicalPath(root),
    pid: process.pid,
    backup_path: migration.backup_path,
    stage_path: v5StagePath(root, `rollback-${randomUUID()}`),
    worksheet_digest: receipt.payload.worksheet_digest,
    backup_inventory_digest: receipt.payload.backup_inventory_digest,
    authorization_digest: receipt.payload.authorization_digest,
    rollback: true
  };
  lock.operation = recoveryOperation(rollbackOperationPayload(lock, receipt));
  const lockPath = lockMigration(root, lock);
  return rollbackActivatedWorkspace({
    root,
    lock,
    lockPath,
    rollbackId
  });
}

// src/core/lib/coordination-runtime/evidence-assets.mjs
var DISPOSITION = /* @__PURE__ */ new Map([
  ["scratch", ["draft", "discarded"]],
  ["draft", ["working", "discarded"]],
  ["working", ["published", "archived"]],
  ["published", ["archived", "retracted"]],
  ["personal", ["archived", "discarded"]],
  ["archived", []],
  ["retracted", []],
  ["discarded", []]
]);
var VALIDITY = /* @__PURE__ */ new Map([
  ["unknown", ["provisional", "current", "stale", "superseded", "invalidated", "retired"]],
  ["provisional", ["current", "stale", "superseded", "invalidated", "retired"]],
  ["current", ["stale", "superseded", "invalidated", "retired"]],
  ["stale", ["current", "expired", "superseded", "invalidated", "retired"]],
  ["expired", ["superseded", "invalidated", "retired"]],
  ["superseded", []],
  ["invalidated", []],
  ["retired", []]
]);
var contentEquals = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var lookup = (tx) => (kind, id) => tx.get(kind, id);
function artifactFor(context, tx, asset, verify = true) {
  if (verify) return verifyAssetContent(context, tx, asset);
  const artifact = tx.get("artifact", asset.artifact_id);
  if (artifact?.subject?.kind !== asset.subject.kind || artifact.subject.id !== asset.subject.id) {
    fail2("EVIDENCE_GAP", "asset has no registered artifact");
  }
  return artifact.body;
}
function accepted(context, tx, item, asset, artifact, approvalId) {
  if (item.kind === "task") requireReviews(tx, item);
  const approvals = effectiveApprovals(
    tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
    item,
    lookup(tx)
  ).filter((a) => a.kind === "completion" && a.authority.role === item.body.completion_authority);
  const decision = approvals.find((a) => a.approval_id === approvalId);
  if (!decision || approvals.some((a) => a.decision !== "approved") || item.kind === "task" && isProducingRun(item.body, decision.authority) || decision.authority.runId === asset.producer.runId || artifact.criteria_ref !== criteriaRef(item, lookup(tx)) || item.kind === "task" && (!contentEquals(decision.content_ref, artifact.content_ref) || !decision.evidence_refs.includes(`artifact:${artifact.artifact_id}`))) {
    fail2("EVIDENCE_GAP", "asset acceptance requires an effective independent decision for these exact bytes and criteria");
  }
  if (item.kind === "task") {
    verifyVerdict(tx, item, decision, decision.authority);
  } else {
    const acceptedArtifacts = verifyParentCompletionApproval(
      context,
      tx,
      item,
      decision.evidence_refs
    );
    if (!acceptedArtifacts.includes(artifact.artifact_id)) {
      fail2(
        "EVIDENCE_GAP",
        "parent asset acceptance requires this exact report artifact in the completion proof"
      );
    }
  }
  return decision;
}
function inputsCurrent(context, tx, asset, seen = /* @__PURE__ */ new Set()) {
  if (seen.has(asset.asset_id)) fail2("EVIDENCE_GAP", "asset inputs contain a cycle");
  seen = /* @__PURE__ */ new Set([...seen, asset.asset_id]);
  return asset.input_asset_ids.every((id) => {
    const input = tx.get("asset", id)?.body;
    if (!input || input.validity !== "current" || input.superseded_by !== null || (/* @__PURE__ */ new Set(["scratch", "draft", "discarded", "retracted"])).has(input.disposition)) return false;
    const item = tx.get(input.subject.kind, input.subject.id);
    const artifact = artifactFor(context, tx, input);
    accepted(context, tx, item, input, artifact, input.completion_approval_id);
    return inputsCurrent(context, tx, input, seen);
  });
}
function moved(record, changes, reason, at, itemVersion) {
  const body = { ...record.body, ...changes, updated_at: at };
  body.history = [...body.history, {
    disposition: body.disposition,
    validity: body.validity,
    target: body.target,
    reason,
    at,
    at_subject_version: itemVersion
  }];
  return { ...record, version: record.version + 1, body };
}
function applyAssetTransition({ context, tx, item, command, authority }) {
  const p = command.payload;
  const record = tx.get("asset", p.assetId);
  if (record?.subject?.kind !== item.kind || record.subject.id !== item.id) {
    fail2("EVIDENCE_GAP", "asset transition must bind the owning hierarchy subject");
  }
  const asset = record.body;
  if (p.disposition !== asset.disposition && !DISPOSITION.get(asset.disposition).includes(p.disposition) || p.validity !== asset.validity && !VALIDITY.get(asset.validity).includes(p.validity)) {
    fail2("INVALID_INPUT", "asset disposition or validity transition is not allowed");
  }
  const personalDiscard = asset.disposition === "personal" && p.disposition === "discarded";
  if (p.disposition === "discarded" && (p.validity === "current" || !personalDiscard && p.approvalId !== null || asset.completion_approval_id !== null || asset.history.some((h) => (/* @__PURE__ */ new Set(["working", "published"])).has(h.disposition)))) {
    fail2("INVALID_INPUT", "accepted or team-facing working assets cannot be discarded");
  }
  if (personalDiscard) {
    const decisions = effectiveApprovals(
      tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
      item,
      lookup(tx)
    ).filter((a) => a.kind === "scope" && a.authority.role === "operator");
    const consent = decisions.find((a) => a.approval_id === p.approvalId);
    if (command.actor.role !== "operator" || !consent?.provenance || decisions.some((a) => a.decision !== "approved") || !consent.evidence_refs.includes(`artifact:${asset.artifact_id}`)) {
      fail2("AUTHORITY_REQUIRED", "discarding personal output requires persisted actual operator consent");
    }
  }
  if (command.actor.runId !== asset.producer.runId && ![asset.validity_owner, item.body.completion_authority, item.body.scope_authority, "operator"].includes(command.actor.role)) {
    fail2("AUTHORITY_REQUIRED", "asset changes require its producer, validity owner, or named authority");
  }
  const unchangedTarget = p.target === null || p.target === asset.target;
  const target = p.target ?? asset.target;
  const publishedBefore = hasPublicationHistory(asset);
  if (publishedBefore && !unchangedTarget) fail2("INVALID_INPUT", "published history remains at its canonical path");
  if (!unchangedTarget && !(item.body.artifact_targets ?? []).includes(target)) {
    fail2("AUTHORITY_REQUIRED", "target is not a declared item artifact target");
  }
  const publishing = p.disposition === "published" && asset.disposition !== "published";
  const metadataOnlyInvalidation = unchangedTarget && (/* @__PURE__ */ new Set(["stale", "expired", "invalidated", "retired"])).has(p.validity) && p.supersedes === null && p.approvalId === null && !publishing;
  const artifact = artifactFor(context, tx, asset, !metadataOnlyInvalidation);
  let validity = p.validity;
  const approvalId = personalDiscard ? asset.completion_approval_id : p.approvalId ?? asset.completion_approval_id;
  const publicTarget = target.startsWith("project:") && !(artifact.content_ref.kind === "git" && target === `project:${artifact.project_id}:@git`);
  if (publicTarget && !(metadataOnlyInvalidation && publishedBefore)) {
    if (artifact.classification !== "public" || validity !== "current" || asset.history.some((h) => h.disposition === "personal")) {
      fail2("INVALID_INPUT", "public placement requires current accepted public bytes; personal assets cannot promote");
    }
  }
  if (publishing && (!publicTarget || validity !== "current")) {
    fail2("INVALID_INPUT", "publication requires a current accepted project-qualified target");
  }
  if (p.supersedes !== null && (validity !== "current" || !["working", "published", "archived"].includes(p.disposition))) {
    fail2("EVIDENCE_GAP", "supersession requires a current accepted durable successor");
  }
  if (p.approvalId !== null && !personalDiscard) {
    accepted(context, tx, item, asset, artifact, approvalId);
  }
  if (validity === "current" || publishing || p.supersedes !== null || publicTarget && !metadataOnlyInvalidation) {
    if ((/* @__PURE__ */ new Set(["stale", "unknown"])).has(asset.validity) && (p.approvalId === null || p.approvalId === asset.completion_approval_id)) {
      fail2("EVIDENCE_GAP", "revalidation requires a fresh explicit independent acceptance");
    }
    const operatorDecision2 = command.actor.role === "operator" ? accepted(context, tx, item, asset, artifact, approvalId) : null;
    const applyingHumanDecision = operatorDecision2?.provenance && sameActor(operatorDecision2.authority, operatorDecisionActor(operatorDecision2.provenance));
    if ((isProducingRun(item.body, command.actor) || asset.producer.runId === command.actor.runId) && !applyingHumanDecision) {
      fail2("AUTHORITY_REQUIRED", "a producing run cannot close its own asset");
    }
    const decision = operatorDecision2 ?? accepted(context, tx, item, asset, artifact, approvalId);
    if ((/* @__PURE__ */ new Set(["stale", "unknown"])).has(asset.validity) && Date.parse(decision.created_at) < Date.parse(asset.history.at(-1).at)) {
      fail2("EVIDENCE_GAP", "revalidation cannot reuse acceptance recorded before the validity change");
    }
    if (!inputsCurrent(context, tx, asset)) {
      if (publicTarget || publishing || p.supersedes !== null) {
        fail2("EVIDENCE_GAP", "incomplete accepted inputs cannot publish or supersede");
      }
      validity = "provisional";
    }
  }
  if (p.validity === "superseded" && asset.superseded_by === null) {
    fail2("INVALID_INPUT", "supersession must be requested by the successor");
  }
  if (p.disposition === "working" && !/^\.kai\/(core|engineering|creative)\//.test(target)) {
    fail2("INVALID_INPUT", "working assets require a typed private artifact target");
  } else if (p.disposition === "personal" && !/\/personal(?:\/|$)/.test(target)) {
    fail2("INVALID_INPUT", "personal assets must remain in an explicitly personal typed path");
  }
  if (!metadataOnlyInvalidation && (target !== asset.target || publicTarget)) {
    assertWorkspacePath(context.root, target);
    verifyTarget(context.root, target, artifact);
  }
  if (p.supersedes !== null) {
    if (p.supersedes === asset.asset_id || asset.supersedes !== null && asset.supersedes !== p.supersedes) {
      fail2("EVIDENCE_GAP", "successor already has a different predecessor or supersedes itself");
    }
    const previous = tx.get("asset", p.supersedes);
    if (!previous || previous.body.superseded_by !== null || !VALIDITY.get(previous.body.validity).includes("superseded") || (/* @__PURE__ */ new Set(["retracted", "discarded"])).has(previous.body.disposition)) {
      fail2("EVIDENCE_GAP", "predecessor cannot be superseded or already has a conflicting successor");
    }
    const predecessorTask = previous.subject?.kind === "task" ? tx.get("task", previous.subject.id) : null;
    if (!predecessorTask || predecessorTask.body.recovery_hold !== null) fail2("RECOVERY_REQUIRED", "predecessor is under recovery hold");
    if (previous.subject.id !== item.id) {
      requireActingAuthority(tx, predecessorTask, {
        ...command,
        recordId: predecessorTask.id,
        expectedVersion: predecessorTask.version,
        leaseToken: null
      }, authority, command.kind);
      if (isProducingRun(predecessorTask.body, command.actor)) fail2("AUTHORITY_REQUIRED", "predecessor production history requires independence");
    }
    const previousArtifact = artifactFor(context, tx, previous.body);
    if (previous.body.validity === "current") {
      accepted(
        context,
        tx,
        predecessorTask,
        previous.body,
        previousArtifact,
        previous.body.completion_approval_id
      );
    }
    tx.put(moved(previous, { validity: "superseded", superseded_by: asset.asset_id }, p.reason, p.at, predecessorTask.version));
  }
  tx.put(moved(record, {
    disposition: p.disposition,
    validity,
    target,
    completion_approval_id: approvalId,
    supersedes: p.supersedes ?? asset.supersedes
  }, p.reason, p.at, item.version));
}

// src/core/lib/coordination-runtime/evidence.mjs
var clone2 = (value) => JSON.parse(canonicalJson(value));
var contentEquals2 = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var lookup2 = (tx) => (kind, id) => tx.get(kind, id);
function ordinaryAuthority(store, tx, item, command, authority) {
  if (item.kind !== "task") {
    if (command.leaseToken !== null) {
      fail2("LEASE_CONFLICT", "parent hierarchy evidence commands cannot carry a Task lease");
    }
    if (![item.body.owner, item.body.scope_authority, item.body.completion_authority].includes(command.actor.role)) {
      fail2(
        "AUTHORITY_REQUIRED",
        "parent hierarchy evidence requires its owner or declared authority"
      );
    }
    requireHostActionGrant(command, authority, command.kind);
    return;
  }
  if (item.body.recovery_hold !== null) fail2("RECOVERY_REQUIRED", "operator recovery hold must be resolved first");
  if (item.body.lease === null && command.leaseToken !== null) fail2("LEASE_CONFLICT", "command carries a retired lease");
  if (item.kind === "task" && hasStaleDirection(
    tx,
    item,
    (directionRef) => currentDirectionForStore(store, directionRef)
  )) {
    requireLeasedActingAuthority(tx, item, command, authority, command.kind);
  } else {
    requireActingAuthority(tx, item, command, authority, command.kind);
  }
}
function produce(store, command, kind, authority, action) {
  validateCommand(command);
  if (command.kind !== kind) fail2("INVALID_INPUT", `producer requires ${kind}`);
  const context = contextFor(store);
  const trusted = clone2(authority ?? context.authority);
  validateAuthority(trusted);
  requireActorAvailable(command, trusted);
  const input = clone2(command);
  return applyOperation(store, input, (item, tx) => {
    bindEvidenceTransaction(store, tx);
    action({ context, item, tx, command: input, authority: trusted });
    return item.body;
  });
}
function putNew(tx, kind, id, item, body) {
  if (tx.get(kind, id)) fail2("VERSION_CONFLICT", `${kind}/${id} already exists; history is immutable`);
  tx.put(validateRecord({
    kind,
    id,
    subject: body.subject,
    version: 1,
    body
  }));
}
function currentBinding(body, item, tx, { recovery = false } = {}) {
  const expected = { kind: item.kind, id: item.id };
  if (!subjectEquals(body.subject, expected) || body.criteria_ref !== (recovery ? null : criteriaRef(item, lookup2(tx))) || !recovery && item.kind === "task" && !contentEquals2(body.content_ref, item.body.change_ref) || (!recovery && item.kind !== "task" || recovery) && body.content_ref !== null) {
    fail2("EVIDENCE_GAP", "record must bind the current hierarchy subject, exact content, and criteria");
  }
}
function independent(item, actor) {
  if (isProducingRun(item.body, actor)) fail2("AUTHORITY_REQUIRED", "every producing run is excluded from independent acceptance");
}
function contentEntries(subject) {
  return subject.kind === "sha256" ? [{ path: subject.path, digest: subject.digest }] : subject.kind === "bundle-sha256" ? subject.entries : [];
}
function operatorDecision(context, command) {
  const supplied = context.verifyOperatorDecision?.(clone2(command)) ?? null;
  let proof;
  try {
    proof = clone2(supplied);
    validateOperatorDecision(proof);
  } catch (error) {
    if (!(error instanceof RuntimeError) || error.code !== "INVALID_INPUT") throw error;
    fail2("AUTHORITY_REQUIRED", "an actual host interaction or attributed supplied operator decision is required");
  }
  const body = command.payload.body;
  for (const key of ["subject", "content_ref", "criteria_ref", "kind", "decision", "deployment", "recovery"]) {
    if (canonicalJson(proof[key]) !== canonicalJson(body[key])) {
      fail2("AUTHORITY_REQUIRED", "operator decision does not bind the exact approval claim");
    }
  }
  if (Date.parse(proof.captured_at) > Date.now()) fail2("AUTHORITY_REQUIRED", "operator decision cannot be future-dated");
  return Object.fromEntries(["source", "reference", "attributed_to", "captured_at"].map((key) => [key, proof[key]]));
}
function registerArtifact(store, command) {
  return produce(store, command, "artifact.register", void 0, ({ context, item, tx, command: command2, authority }) => {
    const p = command2.payload;
    if (p.recoveryLeaseToken !== void 0) {
      if (item.kind !== "task") {
        fail2("INVALID_INPUT", "parent hierarchy artifacts do not support Task lease recovery");
      }
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease) || item.body.lease.token !== p.recoveryLeaseToken || command2.leaseToken !== null) {
        fail2("RECOVERY_REQUIRED", "recovery artifacts require the exact expired lease and no acting lease");
      }
    } else {
      ordinaryAuthority(store, tx, item, command2, authority);
    }
    if (tx.get("artifact", p.artifactId) || tx.get("asset", p.assetId)) fail2("VERSION_CONFLICT", "artifact and asset identities must be new");
    const run = context.runs.find((run2) => sameActor(run2.actor, command2.actor));
    if (!run) fail2("AUTHORITY_REQUIRED", "actor has no approved producing run directory");
    const entries = contentEntries(p.subject);
    const sourcePaths = entries.map((entry) => entry.path);
    const registered = tx.list("artifact");
    const requirePrivacy = ({ subject, classification }) => {
      if (privacyRank[p.classification] < privacyRank[classification]) {
        fail2("INVALID_INPUT", "derived artifacts cannot downgrade applicable input privacy");
      }
      const selected = contentEntries(subject);
      if (selected.some((entry) => privacyRank[p.classification] < privacyRank[pathPrivacy(context.root, entry.path)])) {
        fail2("INVALID_INPUT", "derived artifacts cannot downgrade resolved source privacy");
      }
      const paths = new Set(selected.map((e) => normalized(assertWorkspacePath(context.root, e.path))));
      for (const previous of registered) {
        if ((contentEquals2(subject, previous.body.content_ref) || contentEntries(previous.body.content_ref).some((prior) => selected.some((entry) => entry.digest === prior.digest) || paths.has(normalized(assertWorkspacePath(context.root, prior.path))))) && privacyRank[p.classification] < privacyRank[previous.body.classification]) {
          fail2("INVALID_INPUT", "a caller label cannot downgrade registered source privacy");
        }
      }
    };
    requirePrivacy({ subject: p.subject, classification: p.classification });
    for (const path of sourcePaths) {
      if (!path.startsWith(`${run.directory}/`) && !(item.body.artifact_targets ?? []).includes(path)) {
        fail2("AUTHORITY_REQUIRED", "artifact source is outside the approved run and declared targets");
      }
      if (path.startsWith("project:") && p.classification !== "public" || pathPrivacy(context.root, path) === "personal" && p.classification !== "personal") {
        fail2("INVALID_INPUT", "artifact classification conflicts with source privacy");
      }
    }
    const inputBasis = captureInputBasis(context, tx, artifactInputReferences(item.body, p.inputAssetIds), /* @__PURE__ */ new Set(), requirePrivacy);
    const retained = retainSubject(context.root, p.subject, p.projectId, run.directory, p.artifactId);
    putNew(tx, "artifact", p.artifactId, item, {
      schema_version: 1,
      artifact_id: p.artifactId,
      subject: { kind: item.kind, id: item.id },
      producer: command2.actor,
      content_ref: p.subject,
      criteria_ref: criteriaRef(item, lookup2(tx)),
      project_id: p.projectId,
      run_directory: run.directory,
      ...retained,
      classification: p.classification,
      media_type: p.mediaType,
      title: p.title,
      created_at: p.at,
      input_basis: inputBasis
    });
    const target = p.subject.kind === "sha256" ? p.subject.path : retained.manifest_path ?? `project:${p.projectId}:@git`;
    const disposition = sourcePaths.some((path) => pathPrivacy(context.root, path) === "personal") ? "personal" : "scratch";
    putNew(tx, "asset", p.assetId, item, {
      schema_version: 1,
      asset_id: p.assetId,
      subject: { kind: item.kind, id: item.id },
      artifact_id: p.artifactId,
      revision: 1,
      producer: command2.actor,
      completion_authority: item.body.completion_authority,
      validity_owner: item.body.validity_owner ?? item.body.completion_authority,
      disposition,
      validity: "provisional",
      target,
      completion_approval_id: null,
      input_asset_ids: p.inputAssetIds,
      supersedes: null,
      superseded_by: null,
      updated_at: p.at,
      history: [{
        disposition,
        validity: "provisional",
        target,
        reason: "Registered exact output",
        at: p.at,
        at_subject_version: command2.expectedVersion
      }]
    });
  });
}
function recordReview(store, command) {
  return produce(store, command, "review.record", void 0, ({ context, item, tx, command: command2, authority }) => {
    ordinaryAuthority(store, tx, item, command2, authority);
    const b = command2.payload.body;
    if (!sameActor(b.reviewer, command2.actor)) fail2("AUTHORITY_REQUIRED", "review actor must match the command");
    independent(item, command2.actor);
    currentBinding(b, item, tx);
    if (b.kind === "product-design-acceptance" && (command2.actor.role !== item.body.completion_authority || item.body.producing_actors.some((actor) => actor.role === command2.actor.role))) {
      fail2("AUTHORITY_REQUIRED", "product design acceptance requires an independent completion authority");
    }
    subjectArtifact(context, tx, item, b.content_ref, command2.actor);
    verifyReferences(context, tx, item, [...b.evidence_refs, ...b.finding_refs], { positive: b.verdict === "approved" });
    effectiveReviews([
      ...tx.list("review", { kind: item.kind, id: item.id }).map((r) => r.body),
      b
    ], item, lookup2(tx));
    putNew(tx, "review", b.review_id, item, b);
  });
}
function recordApproval(store, command, authority) {
  return produce(store, command, "approval.record", authority, ({ context, item, tx, command: command2, authority: authority2 }) => {
    const b = command2.payload.body;
    if (!sameActor(b.authority, command2.actor)) fail2("AUTHORITY_REQUIRED", "approval actor must match the command");
    if (item.kind !== "task") {
      requireNamedAuthority(tx, command2, authority2, command2.kind, item.body.completion_authority);
      if (b.kind !== "completion") fail2("INVALID_INPUT", "parent subjects support completion approval only");
      currentBinding(b, item, tx);
      if (command2.actor.role !== item.body.completion_authority) {
        fail2("AUTHORITY_REQUIRED", "parent completion approval requires its declared completion authority");
      }
      verifyParentCompletionApproval(context, tx, item, b.evidence_refs);
      const body2 = { ...b, recorded_at_subject_version: command2.expectedVersion };
      effectiveApprovals([
        ...tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
        body2
      ], item, lookup2(tx));
      putNew(tx, "approval", b.approval_id, item, body2);
      return;
    }
    const needsHuman = command2.actor.role === "operator" || item.body.artifact_class === "paid-media";
    let provenance;
    if (needsHuman) {
      requireHostActionGrant(command2, authority2, command2.kind);
      provenance = operatorDecision(context, command2);
    }
    const decisionActor = command2.actor.role === "operator" ? operatorDecisionActor(provenance) : command2.actor;
    independent(item, decisionActor);
    const recovery = b.kind === "operator-recovery-resolution";
    if (recovery) {
      requireNamedAuthority(tx, command2, authority2, command2.kind, "operator");
      const attempt = tx.get("attempt", b.recovery.attempt_id);
      if (b.criteria_ref !== criteriaRef(item, lookup2(tx)) || item.body.recovery_hold !== b.recovery.attempt_id || attempt?.subject?.kind !== "task" || attempt.subject.id !== item.id || attempt.body.disposition !== "conflicting-partial-work" || attempt.body.stale_lease.token !== b.recovery.stale_lease_token) {
        fail2("AUTHORITY_REQUIRED", "operator recovery resolution requires the exact current conflicting attempt");
      }
      requireRoleAvailable(b.recovery.resume_role, authority2, "recovery resume");
    } else {
      if (command2.actor.role === "operator") {
        if (item.body.recovery_hold !== null || item.body.lease !== null && !leaseIsLive(item.body.lease)) {
          fail2("RECOVERY_REQUIRED", "ordinary operator decisions cannot bypass lease recovery");
        }
        if (command2.leaseToken !== null) fail2("LEASE_CONFLICT", "operator decisions do not borrow an execution lease");
        requireHostActionGrant(command2, authority2, command2.kind);
      } else {
        ordinaryAuthority(store, tx, item, command2, authority2);
      }
      currentBinding(b, item, tx);
      subjectArtifact(context, tx, item, b.content_ref, decisionActor);
      const role = b.kind === "completion" ? item.body.completion_authority : b.kind === "scope" ? item.body.scope_authority : "operator";
      if (command2.actor.role !== role) fail2("AUTHORITY_REQUIRED", "approval must come from its declared authority");
    }
    verifyReferences(context, tx, item, b.evidence_refs, { recovery, positive: b.decision === "approved" });
    const body = {
      ...b,
      authority: decisionActor,
      recorded_at_subject_version: command2.expectedVersion,
      ...provenance ? { provenance } : {}
    };
    const effective = effectiveApprovals([
      ...tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
      body
    ], item, lookup2(tx));
    const deployments = effective.filter((a) => a.deployment !== null && a.decision === "approved");
    if (new Set(deployments.map((a) => canonicalJson(a.deployment))).size > 1) {
      fail2("AUTHORITY_REQUIRED", "operator confirmations disagree about the production deployment");
    }
    putNew(tx, "approval", b.approval_id, item, body);
    if (recovery && b.decision === "approved") recoveryResolution(tx, item, b.approval_id);
  });
}
function registerEvidence(store, command, capture) {
  return produce(store, command, "evidence.register", void 0, ({ context, item, tx, command: command2, authority }) => {
    const b = command2.payload.body;
    const parentCompletion = b.kind === "parent-completion";
    const recovery = b.kind === "recovery-reconciliation";
    if (parentCompletion) {
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.completion_authority);
    } else if (recovery) {
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease) || item.body.lease.token !== b.data.stale_lease_token) {
        fail2("RECOVERY_REQUIRED", "reconciliation must observe the exact expired lease");
      }
    } else {
      ordinaryAuthority(store, tx, item, command2, authority);
    }
    currentBinding(b, item, tx, { recovery });
    if (!recovery && item.kind === "task") {
      subjectArtifact(context, tx, item, b.content_ref, b.outcome === "waived" ? command2.actor : null);
    }
    const artifacts = parentCompletion ? verifyParentCompletionEvidence(context, tx, item, b.evidence_refs) : verifyReferences(context, tx, item, b.evidence_refs, { recovery });
    let observation = null;
    if (command2.payload.tier === "observed") {
      if (!context.verifyCapture) fail2("INVALID_INPUT", "agent paste or a source label is not observed capture");
      observation = clone2(context.verifyCapture(clone2(command2), capture));
      validateCapture(observation);
      const positive = (/* @__PURE__ */ new Set(["passed", "clear", "waived"])).has(b.outcome);
      if (observation.command_digest !== commandDigest(command2) || !sameActor(observation.actor, command2.actor) || positive && (observation.exit_code !== 0 || observation.checks.length === 0) || observation.captured_at !== b.created_at || Date.parse(observation.captured_at) > Date.now() || b.kind === "production-verification" && b.data.checks.some((check) => !observation.checks.includes(check))) {
        fail2("EVIDENCE_GAP", "capture does not cover this actor, result, time, and complete claimed checks");
      }
      const privacy = { public: 0, internal: 1, confidential: 2, personal: 3 };
      if (artifacts.some((a) => privacy[a.classification] < privacy[observation.classification])) {
        fail2("EVIDENCE_GAP", "captured confidential data requires equally private evidence storage");
      }
      if (recovery && Date.parse(observation.captured_at) < Date.parse(item.body.lease.expires_at)) {
        fail2("EVIDENCE_GAP", "recovery capture predates lease expiry");
      }
    } else if (!(/* @__PURE__ */ new Set(["gap", "failed"])).has(b.outcome) || recovery) {
      fail2("EVIDENCE_GAP", "a declaration cannot establish observed success, waiver, or recovery");
    }
    if (b.outcome === "waived") {
      requireNamedAuthority(tx, command2, authority, command2.kind, item.body.completion_authority);
      independent(item, command2.actor);
      if (artifacts.some((a) => a.producer.runId === command2.actor.runId)) {
        fail2("AUTHORITY_REQUIRED", "a producing run cannot waive verification of its own supporting artifacts");
      }
    }
    if (b.kind === "deployment" || b.kind === "production-verification") {
      const start = requireOperatorApproval(tx, item, "operator-deploy-start");
      const complete = requireOperatorApproval(tx, item, "operator-deploy-complete");
      if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment) || b.data.environment !== start.deployment.environment || b.data.deployment_id !== start.deployment.deployment_id) {
        fail2("AUTHORITY_REQUIRED", "capture must match the operator-confirmed production deployment");
      }
    }
    const body = { ...b, provenance: { tier: command2.payload.tier, capture: observation } };
    if (!recovery) {
      effectiveEvidence([
        ...tx.list("evidence", { kind: item.kind, id: item.id }).map((r) => r.body),
        body
      ], item, lookup2(tx));
    }
    putNew(tx, "evidence", b.evidence_id, item, body);
  });
}
function transitionAsset(store, command, authority) {
  return produce(store, command, "asset.transition", authority, ({ context, item, tx, command: command2, authority: authority2 }) => {
    ordinaryAuthority(store, tx, item, command2, authority2);
    applyAssetTransition({ context, item, tx, command: command2, authority: authority2 });
  });
}

// src/core/lib/coordination-runtime/host-plan.mjs
function planHierarchy({ store, subject, direction, roles }) {
  return taskPlan(store, { subject, direction, roles });
}
function validateRoster(roster, profiles) {
  if (!Array.isArray(roster) || !isPlainObject(profiles)) fail("INVALID_INPUT", "host roster/profiles are required");
  const ids = /* @__PURE__ */ new Set();
  for (const entry of roster) {
    assertExactKeys(entry, /* @__PURE__ */ new Set(["id", "role", "model"]), "roster entry");
    text(entry.id, "qualified host id");
    text(entry.role, "roster role");
    if (entry.model !== null) text(entry.model, "roster model");
    if (ids.has(entry.id)) fail("INVALID_INPUT", "duplicate host agent id");
    ids.add(entry.id);
  }
}
function planDispatch({ task, roster, profiles, capabilities, request = {} }) {
  if (!task || typeof task.next_role !== "string") {
    fail("ROLE_UNAVAILABLE", "Task has no next role");
  }
  if (!Array.isArray(roster) || roster.some((entry2) => !isPlainObject(entry2))) {
    fail("INVALID_INPUT", "roster must be an array of entries");
  }
  const entries = roster.filter((entry2) => entry2.role === task.next_role);
  if (entries.length !== 1) fail("ROLE_UNAVAILABLE", "exact next role must resolve to one qualified host ID");
  validateRoster(roster, profiles);
  validateCapabilities(capabilities);
  assertExactKeys(request, /* @__PURE__ */ new Set(["role", "profile", "model", "fallbackModel", "effort"]), "dispatch request", /* @__PURE__ */ new Set());
  const profile = profiles[task.next_role];
  const requiredModel = approvedProfileModel(task.next_role, profile);
  if (request.role !== void 0 && request.role !== task.next_role || request.profile !== void 0 && request.profile !== profile) {
    fail("INVALID_INPUT", "requested role/profile is inconsistent with the installed role");
  }
  if (request.model !== void 0 && request.model !== requiredModel || request.fallbackModel !== void 0 && request.fallbackModel !== requiredModel || !capabilities.models.includes(requiredModel)) {
    fail("MODEL_UNAVAILABLE", "required model is unavailable or requested fallback is outside approved policy");
  }
  const [entry] = entries;
  if (!capabilities.modelOverride && entry.model !== requiredModel) {
    fail("MODEL_UNAVAILABLE", "host cannot guarantee the pinned model without a supported override");
  }
  const settings = {};
  if (capabilities.modelOverride) settings.model = requiredModel;
  if (request.effort !== void 0 && request.effort !== null) {
    if (!capabilities.efforts.includes(request.effort)) fail("UNSUPPORTED_HOST", "requested effort override is unsupported");
    settings.effort = request.effort;
  }
  return {
    mode: capabilities.peerDispatch ? "peer-available" : "ordered-queue",
    automatic: false,
    queue: [{
      agentId: entry.id,
      role: task.next_role,
      profile,
      requestedModel: requiredModel,
      settings: clone(settings),
      context: "fresh-single-shot"
    }]
  };
}

export {
  buildMigrationWorksheet,
  validateMigrationWorksheet,
  migrationAuthorizationDescriptor,
  migrateWorkspaceV5,
  recoverWorkspaceV5,
  rollbackWorkspaceV5,
  registerArtifact,
  recordReview,
  recordApproval,
  registerEvidence,
  transitionAsset,
  planHierarchy,
  validateRoster,
  planDispatch
};
