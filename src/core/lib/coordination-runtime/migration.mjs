import {chmodSync, closeSync, constants, copyFileSync, existsSync, fsyncSync, mkdirSync, openSync, renameSync, unlinkSync} from 'node:fs';
import {dirname, resolve} from 'node:path';
import {randomUUID} from 'node:crypto';
import {openStore, closeStore, readSnapshot, readRecord} from './store.mjs';
import {assertExactKeys, canonicalJson, validateRecord, validateActor} from './contract.mjs';
import {assertWorkspacePath, exactBytes} from './evidence-content.mjs';
import {parseLegacySources, roleKnown} from './migration-legacy.mjs';
import {
  DATABASE, LOCK, MIGRATIONS, hash, fail, safePath, exactFile, exclusiveFile,
  migrationManifest, privateAdmission, sourceSnapshot, sameSnapshot, fileFingerprint,
} from './migration-files.mjs';
import {read as readActivity, runs} from '../activity.mjs';
import {isNull, TERMINAL} from '../coordination.mjs';
import {assertWorkspaceWrite} from './workspace-guard.mjs';
import {captureInputBasis} from './input-basis.mjs';

const inFlight = new Set();
const repairs = new WeakMap();
const json = (root, path) => JSON.parse(exactFile(root, path));
function confirmed(confirm) {
  if (confirm !== true) fail('AUTHORITY_REQUIRED', 'confirm:true must explicitly acknowledge offline migration/recovery');
}
function privateWorkspace(root, admit = false) {
  const privacy = privateAdmission(root, {admit});
  if (privacy.errors.length) fail('INVALID_INPUT', privacy.errors.join('; '));
  return privacy;
}
function logicalDigest(store) {
  const db = store.database;
  const result = {};
  for (const table of ['records', 'events', 'operations', 'legacy_sources']) {
    result[table] = db.prepare(`SELECT * FROM ${table} ORDER BY 1, 2`).all().map(row =>
      Object.fromEntries(Object.entries(row).map(([key, v]) => [key, v instanceof Uint8Array ? Buffer.from(v).toString('hex') : v])));
  }
  result.metadata = db.prepare("SELECT * FROM metadata WHERE key != 'migration_baseline' ORDER BY key").all();
  return hash(canonicalJson(result));
}
function finishStore(store) {
  const result = store.database.prepare('PRAGMA wal_checkpoint(TRUNCATE)').get();
  if (result.busy) fail('STORE_BUSY', 'staged WAL checkpoint is busy');
  closeStore(store);
}
function assertOffline(root) {
  const activity = readActivity(root);
  if (activity.skipped) fail('RECOVERY_REQUIRED', 'malformed legacy activity prevents proving offline state');
  if (runs(activity.records, Date.now()).some(r => r.open)) fail('RECOVERY_REQUIRED', 'active/unreconciled legacy run prevents offline migration');
}
function assertNoDatabase(root) {
  for (const name of [DATABASE, `${DATABASE}-wal`, `${DATABASE}-shm`, `${DATABASE}-journal`]) {
    if (existsSync(safePath(root, name))) fail('RECOVERY_REQUIRED', 'existing or incomplete migration database requires explicit recovery; never copy a live WAL/main file');
  }
}
function receiptFor(root, plan) {
  return {id: plan.id, activated: true, backupPath: safePath(root, `${plan.directory}/backup`),
    sourceCount: plan.files.length, databasePath: safePath(root, DATABASE),
    privateAdmission: plan.privateAdmission};
}
function vacant(root, name) {
  if (existsSync(safePath(root, name))) fail('RECOVERY_REQUIRED', `unexpected existing migration target: ${name}`);
}
function verifyBackup(root, plan) {
  if (plan.schema_version !== 1 || !/^[0-9a-f-]{36}$/.test(plan.id)
    || plan.directory !== `${MIGRATIONS}/${plan.id}` || !Array.isArray(plan.files)) fail('RECOVERY_REQUIRED', 'invalid migration plan');
  const seen = new Set();
  for (const entry of plan.files) {
    if (!entry || typeof entry.path !== 'string' || seen.has(entry.path)) fail('RECOVERY_REQUIRED', 'invalid backup inventory');
    seen.add(entry.path);
    const file = fileFingerprint(root, `${plan.directory}/backup/${entry.path}`);
    if (file.size !== entry.size || file.digest !== entry.digest) fail('RECOVERY_REQUIRED', `tampered migration backup: ${entry.path}`);
  }
  const original = exactFile(root, `${plan.directory}/backup/.kai/manifest.json`);
  if (hash(original) !== plan.originalManifestDigest) fail('RECOVERY_REQUIRED', 'migration manifest backup mismatch');
}
function readyPlan(root, directory) {
  const planBytes = exactFile(root, `${directory}/plan.json`);
  const plan = JSON.parse(planBytes);
  if (plan.directory !== directory) fail('RECOVERY_REQUIRED', 'migration directory mismatch');
  const ready = json(root, `${directory}/ready.json`);
  if (ready.planDigest !== hash(planBytes) || ready.id !== plan.id) fail('RECOVERY_REQUIRED', 'migration plan/ready identity mismatch');
  verifyBackup(root, plan);
  return {plan, ready};
}
function validateStagedStore(root, plan, ready, name) {
  const store = openStore({path: safePath(root, name), mode: 'read'});
  try {
    if (!canRollback(store) || logicalDigest(store) !== ready.stateDigest) fail('RECOVERY_REQUIRED', 'staged store changed or contains new runtime work');
    for (const row of store.database.prepare('SELECT kind,id FROM records').all()) readRecord(store, row.kind, row.id);
    const identity = JSON.parse(store.database.prepare("SELECT value FROM metadata WHERE key='migration'").get().value);
    if (identity.id !== plan.id || identity.root !== resolve(root) || identity.workspaceId !== plan.workspaceId) {
      fail('RECOVERY_REQUIRED', 'staged store belongs to another workspace/migration');
    }
  } finally { closeStore(store); }
}
function activatedManifestBytes(root, plan) {
  const original = JSON.parse(exactFile(root, `${plan.directory}/backup/.kai/manifest.json`));
  return Buffer.from(`${JSON.stringify({...original, schema_version: 4, coordination_migration: {
    id: plan.id, directory: plan.directory, readyDigest: hash(exactFile(root, `${plan.directory}/ready.json`)),
  }}, null, 2)}\n`);
}
function activate(root, plan, ready, env) {
  migrationManifest(root, [3], env);
  privateWorkspace(root);
  assertOffline(root);
  verifyBackup(root, plan);
  const retained = readyPlan(root, plan.directory);
  if (canonicalJson(retained.plan) !== canonicalJson(plan) || canonicalJson(retained.ready) !== canonicalJson(ready)) {
    fail('RECOVERY_REQUIRED', 'migration plan or ready state changed before activation');
  }
  sameSnapshot(plan.files, sourceSnapshot(root));
  const staged = `${plan.directory}/staged.sqlite`;
  if (!existsSync(safePath(root, DATABASE))) {
    assertNoDatabase(root);
    validateStagedStore(root, plan, ready, staged);
    vacant(root, DATABASE);
    renameSync(safePath(root, staged), safePath(root, DATABASE));
  } else {
    if (existsSync(safePath(root, staged))) fail('RECOVERY_REQUIRED', 'both staged and final databases exist; cannot choose authority');
    validateStagedStore(root, plan, ready, DATABASE);
  }
  sameSnapshot(plan.files, sourceSnapshot(root));
  verifyBackup(root, plan);
  const bytes = activatedManifestBytes(root, plan);
  const stageManifest = `${plan.directory}/manifest-4.json`;
  if (existsSync(safePath(root, stageManifest))) {
    if (!exactFile(root, stageManifest).equals(bytes)) fail('RECOVERY_REQUIRED', 'unexpected changed manifest stage');
  } else exclusiveFile(root, stageManifest, bytes);
  sameSnapshot(plan.files, sourceSnapshot(root));
  renameSync(safePath(root, stageManifest), safePath(root, '.kai/manifest.json'));
  return receiptFor(root, plan);
}
function releaseLock(root, expected) {
  if (!exactFile(root, LOCK).equals(Buffer.from(expected))) fail('RECOVERY_REQUIRED', 'migration lock changed; refusing removal');
  unlinkSync(safePath(root, LOCK));
}

/** Explicit offline migration; no current grants, approvals or invented actors. */
export function migrateWorkspace({root, confirm, roles = [], env = process.env} = {}) {
  confirmed(confirm);
  const manifest = migrationManifest(root, [3], env);
  if (!Array.isArray(roles) || roles.some(r => typeof r !== 'string')) fail('INVALID_INPUT', 'installed role identities must be supplied');
  if (inFlight.has(root) || existsSync(safePath(root, LOCK))) fail('RECOVERY_REQUIRED', 'incomplete or competing migration; inspect and explicitly recover');
  const privacy = privateWorkspace(root, true);
  assertNoDatabase(root);
  assertOffline(root);
  const id = randomUUID();
  const directory = `${MIGRATIONS}/${id}`;
  const lockBytes = canonicalJson({id, directory, pid: process.pid});
  exclusiveFile(root, LOCK, lockBytes);
  inFlight.add(root);
  let store;
  try {
    const files = sourceSnapshot(root);
    const sources = parseLegacySources(root, files, roles);
    mkdirSync(safePath(root, MIGRATIONS), {recursive: true});
    mkdirSync(safePath(root, directory), {recursive: false});
    const plan = {schema_version: 1, id, directory, workspaceId: manifest.workspace_id,
      root: resolve(root), files, privateAdmission: privacy.admitted,
      originalManifestDigest: hash(exactFile(root, '.kai/manifest.json'))};
    exclusiveFile(root, `${directory}/plan.json`, canonicalJson(plan));
    for (const file of files) {
      const target = safePath(root, `${directory}/backup/${file.path}`);
      mkdirSync(dirname(target), {recursive: true});
      copyFileSync(safePath(root, file.path), target, constants.COPYFILE_EXCL);
      const fd = openSync(target, 'r+');
      try { fsyncSync(fd); } finally { closeSync(fd); }
      chmodSync(target, 0o400);
    }
    verifyBackup(root, plan);
    sameSnapshot(files, sourceSnapshot(root));
    exclusiveFile(root, `${directory}/staged.sqlite`, Buffer.alloc(0));
    store = openStore({path: safePath(root, `${directory}/staged.sqlite`), mode: 'create'});
    store.database.exec(`BEGIN IMMEDIATE;
      CREATE TABLE legacy_sources (
        source_id TEXT PRIMARY KEY, path TEXT NOT NULL UNIQUE, digest TEXT NOT NULL,
        kind TEXT NOT NULL, declared_id TEXT, size INTEGER NOT NULL, backup_path TEXT NOT NULL, parsed TEXT NOT NULL,
        issues TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL
      );`);
    const insert = store.database.prepare('INSERT INTO legacy_sources VALUES (?,?,?,?,?,?,?,?,?,?,?)');
    for (const source of sources) {
      insert.run(source.sourceId, source.path, source.digest, source.kind, source.declaredId,
        source.size, `${directory}/backup/${source.path}`, JSON.stringify(source.parsed), canonicalJson(source.issues), source.status, source.version);
      if (source.status === 'converted') {
        const r = source.record;
        store.database.prepare('INSERT INTO records VALUES (?,?,?,?,?)').run(r.kind, r.id, r.itemId, r.version, canonicalJson(r.body));
      }
    }
    store.database.prepare('INSERT INTO events(operation_id,item_id,payload) VALUES(?,NULL,?)').run(id,
      canonicalJson({kind: 'workspace.migrate', actor: null, sourceSchema: 3, migrationId: id,
        sourceCount: sources.length, provenance: 'legacy-declared', timestamp: null}));
    store.database.prepare('INSERT INTO metadata VALUES (?,?)').run('migration',
      canonicalJson({id, root: resolve(root), workspaceId: manifest.workspace_id, directory}));
    const stateDigest = logicalDigest(store);
    store.database.prepare('INSERT INTO metadata VALUES (?,?)').run('migration_baseline', stateDigest);
    store.database.exec('COMMIT');
    finishStore(store);
    const ready = {id, planDigest: hash(exactFile(root, `${directory}/plan.json`)), stateDigest};
    exclusiveFile(root, `${directory}/ready.json`, canonicalJson(ready));
    const receipt = activate(root, plan, ready, env);
    releaseLock(root, lockBytes);
    return receipt;
  } finally { closeStore(store); inFlight.delete(root); }
}

export function canRollback(store) {
  return readSnapshot(store, () => {
    const baseline = store.database.prepare("SELECT value FROM metadata WHERE key='migration_baseline'").get();
    return !!baseline && logicalDigest(store) === baseline.value;
  });
}

/** Recovery never guesses that an unactivated store won. Incomplete backup/build
 * can only be abandoned; completed stages may activate after full reconciliation.
 */
export function recoverMigration({root, confirm, action, env = process.env} = {}) {
  confirmed(confirm);
  migrationManifest(root, [3, 4], env);
  if (!['activate', 'abandon'].includes(action)) fail('INVALID_INPUT', 'recovery action must be activate or abandon');
  if (inFlight.has(root)) fail('STORE_BUSY', 'migration is active in this process');
  const lockBytes = exactFile(root, LOCK);
  const lock = JSON.parse(lockBytes);
  if (lock.directory !== `${MIGRATIONS}/${lock.id}` || !/^[0-9a-f-]{36}$/.test(lock.id)
    || !Number.isSafeInteger(lock.pid) || lock.pid < 1) fail('RECOVERY_REQUIRED', 'unrecognized migration lock');
  if (lock.pid !== process.pid) {
    try { process.kill(lock.pid, 0); fail('STORE_BUSY', 'migration owner process is still active'); }
    catch (error) { if (error.code !== 'ESRCH') throw error; }
  }
  const recoveryLock = `${lock.directory}/recovery.lock`;
  exclusiveFile(root, recoveryLock, lockBytes);
  try {
    const m = migrationManifest(root, [3, 4], env);
    if (m.schema_version === 4) {
      const {plan} = activePlan(root, m);
      if (plan.id !== lock.id || action !== 'activate') fail('RECOVERY_REQUIRED', 'activated migration requires rollback API');
      const {ready} = readyPlan(root, lock.directory);
      validateStagedStore(root, plan, ready, DATABASE);
      releaseLock(root, lockBytes);
      return receiptFor(root, plan);
    }
    if (action === 'abandon') {
      if (existsSync(safePath(root, DATABASE))) {
        const {plan, ready} = readyPlan(root, lock.directory);
        validateStagedStore(root, plan, ready, DATABASE);
        vacant(root, `${lock.directory}/abandoned.sqlite`);
        renameSync(safePath(root, DATABASE), safePath(root, `${lock.directory}/abandoned.sqlite`));
      }
      // Preserve all source edits and all partial backup/stage files.
      releaseLock(root, lockBytes);
      return {id: lock.id, activated: false, abandoned: true, retainedPath: safePath(root, lock.directory)};
    }
    const {plan, ready} = readyPlan(root, lock.directory);
    const receipt = activate(root, plan, ready, env);
    releaseLock(root, lockBytes);
    return receipt;
  } finally {
    if (!exactFile(root, recoveryLock).equals(lockBytes)) fail('RECOVERY_REQUIRED', 'recovery lock changed; preserving it');
    unlinkSync(safePath(root, recoveryLock));
  }
}

function activePlan(root, manifest = migrationManifest(root, [4])) {
  const identity = manifest.coordination_migration;
  if (!identity || identity.directory !== `${MIGRATIONS}/${identity.id}`) fail('RECOVERY_REQUIRED', 'no recognized migration backup');
  const bytes = exactFile(root, `${identity.directory}/ready.json`);
  if (hash(bytes) !== identity.readyDigest) fail('RECOVERY_REQUIRED', 'changed migration receipt');
  const {plan, ready} = readyPlan(root, identity.directory);
  if (plan.id !== identity.id || plan.workspaceId !== manifest.workspace_id || plan.root !== resolve(root)) fail('RECOVERY_REQUIRED', 'migration workspace identity mismatch');
  return {plan, ready};
}
export function verifyMigration(root, {env = process.env} = {}) {
  const {plan, ready} = activePlan(root, migrationManifest(root, [4], env));
  return {plan, ready};
}
export function rollbackMigration({root, confirm, env = process.env} = {}) {
  confirmed(confirm);
  const manifest = migrationManifest(root, [4], env);
  const {plan, ready} = activePlan(root, manifest);
  const activatedManifest = activatedManifestBytes(root, plan);
  if (!exactFile(root, '.kai/manifest.json').equals(activatedManifest)) fail('RECOVERY_REQUIRED', 'manifest changed after migration; rollback will not overwrite user edits');
  vacant(root, `${plan.directory}/rolled-back.sqlite`);
  if (existsSync(safePath(root, LOCK))) fail('RECOVERY_REQUIRED', 'finish pending migration recovery first');
  const lockBytes = canonicalJson({id: plan.id, directory: plan.directory, pid: process.pid, rollback: true});
  exclusiveFile(root, LOCK, lockBytes);
  let store;
  try {
    privateWorkspace(root);
    verifyBackup(root, plan);
    // Legacy files were never overwritten. A rollback only changes the manifest.
    const live = sourceSnapshot(root).filter(e => e.path !== '.kai/manifest.json');
    const original = plan.files.filter(e => e.path !== '.kai/manifest.json');
    sameSnapshot(original, live);
    validateStagedStore(root, plan, ready, DATABASE);
    store = openStore({path: safePath(root, DATABASE), mode: 'write'});
    store.database.exec('BEGIN IMMEDIATE');
    if (!canRollbackInTransaction(store, ready)) fail('RECOVERY_REQUIRED', 'new runtime work prevents rollback');
    store.database.exec('COMMIT');
    finishStore(store);
    const bytes = exactFile(root, `${plan.directory}/backup/.kai/manifest.json`);
    const next = `${plan.directory}/rollback-manifest-${randomUUID()}.json`;
    exclusiveFile(root, next, bytes);
    sameSnapshot(original, sourceSnapshot(root).filter(e => e.path !== '.kai/manifest.json'));
    if (!exactFile(root, '.kai/manifest.json').equals(activatedManifest)) fail('RECOVERY_REQUIRED', 'manifest changed during rollback');
    vacant(root, `${plan.directory}/rolled-back.sqlite`);
    // Schema 3 refuses new runtime work before the closed database is retired.
    renameSync(safePath(root, next), safePath(root, '.kai/manifest.json'));
    renameSync(safePath(root, DATABASE), safePath(root, `${plan.directory}/rolled-back.sqlite`));
    releaseLock(root, lockBytes);
    return {id: plan.id, rolledBack: true, backupPath: safePath(root, `${plan.directory}/backup`)};
  } catch (error) {
    if (store && !store.closed) { try { store.database.exec('ROLLBACK'); } catch {} }
    // On a clean refusal no runtime/file state changed; don't strand the workspace.
    if (migrationManifest(root, [3, 4], env).schema_version === 4) releaseLock(root, lockBytes);
    throw error;
  } finally { closeStore(store); }
}
function canRollbackInTransaction(store, ready) {
  return logicalDigest(store) === ready.stateDigest;
}

/** Lists expose bounded metadata only. Raw history is an explicit single-source
 * read of the verified external backup, never the editable original file.
 */
export function readLegacyRecords(store, {sourceId, includeRaw = false} = {}) {
  if (includeRaw && typeof sourceId !== 'string') fail('INVALID_INPUT', 'raw legacy reads require a single sourceId');
  const table = store.database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='legacy_sources'").get();
  if (!table) return [];
  const columns = store.database.prepare('PRAGMA table_info(legacy_sources)').all().map(c => c.name);
  if (columns.includes('raw') || !columns.includes('backup_path') || !columns.includes('size')) {
    fail('SCHEMA_MISMATCH', 'legacy source storage requires external backup references; no automatic database rewrite is supported');
  }
  const select = 'SELECT source_id,path,digest,kind,declared_id,size,backup_path,parsed,issues,status,version FROM legacy_sources';
  const rows = sourceId === undefined ? store.database.prepare(`${select} ORDER BY path`).all()
    : store.database.prepare(`${select} WHERE source_id=?`).all(sourceId);
  return rows.map(r => {
    const source = {sourceId: r.source_id, path: r.path, digest: r.digest, kind: r.kind,
      declaredId: r.declared_id, size: r.size, backupPath: r.backup_path, parsed: JSON.parse(r.parsed),
      issues: JSON.parse(r.issues), status: r.status, version: r.version};
    if (includeRaw) {
      const identity = JSON.parse(store.database.prepare("SELECT value FROM metadata WHERE key='migration'").get().value);
      if (source.backupPath !== `${MIGRATIONS}/${identity.id}/backup/${source.path}`
        || identity.directory !== `${MIGRATIONS}/${identity.id}`
        || source.sourceId !== hash(source.path)) fail('EVIDENCE_GAP', 'invalid legacy backup reference');
      const root = identity.root;
      const canonical = safePath(root, DATABASE);
      const retained = ['staged.sqlite', 'rolled-back.sqlite', 'abandoned.sqlite'].map(n => safePath(root, `${identity.directory}/${n}`));
      if (![canonical, ...retained].includes(resolve(store.path))) fail('EVIDENCE_GAP', 'legacy backup belongs to another store/root');
      source.raw = exactFile(root, source.backupPath);
      if (source.raw.length !== source.size || hash(source.raw) !== source.digest) fail('EVIDENCE_GAP', 'legacy backup size/digest changed');
    }
    return source;
  });
}

/** Host-only capability. verify must attest an explicit fresh scope decision;
 * source bytes and unknown historical actors remain untouched.
 */
export function bindMigrationRepair(store, {root, roles, verify} = {}) {
  migrationManifest(root, [4]);
  if (store.closed || store.mode === 'read' || resolve(store.path) !== safePath(root, DATABASE)
    || !Array.isArray(roles) || typeof verify !== 'function') fail('AUTHORITY_REQUIRED', 'repair requires explicit store/root and trusted host verifier');
  repairs.set(store, {root, roles: [...roles], verify});
}
export function repairLegacyRecord(store, request) {
  const binding = repairs.get(store);
  if (!binding || store.closed) fail('AUTHORITY_REQUIRED', 'bind a trusted host repair verifier first');
  const input = JSON.parse(canonicalJson(request));
  assertExactKeys(input, new Set(['operationId', 'sourceId', 'expectedVersion', 'actor', 'reason', 'body']), 'legacy repair');
  validateActor(input.actor);
  if (!/^[0-9a-f-]{36}$/.test(input.operationId) || typeof input.reason !== 'string' || !input.reason.trim()) fail('INVALID_INPUT', 'repair requires operation UUID and rationale');
  const digest = hash(canonicalJson(input));
  store.database.exec('BEGIN IMMEDIATE');
  try {
    assertWorkspaceWrite(store.path, {requirePrivate: true});
    migrationManifest(binding.root, [4]);
    const previous = store.database.prepare('SELECT * FROM operations WHERE id=?').get(input.operationId);
    if (previous) {
      if (previous.payload_digest !== digest) fail('OPERATION_CONFLICT', 'repair operation reused with changed content');
      store.database.exec('COMMIT');
      return JSON.parse(previous.receipt);
    }
    const source = readLegacyRecords(store, {sourceId: input.sourceId, includeRaw: true})[0];
    if (!source || source.status !== 'quarantined' || source.version !== input.expectedVersion) fail('VERSION_CONFLICT', 'quarantine source missing, changed or already repaired');
    if (!source.declaredId || !['item', 'initiative'].includes(source.kind)) fail('INVALID_INPUT', 'only records with a declared original identity can be revalidated');
    if (hash(source.raw) !== source.digest) fail('EVIDENCE_GAP', 'legacy source bytes changed; cannot revalidate unverified history');
    const history = source.parsed;
    const fields = history.fields ?? {};
    const lifecycle = fields[source.kind === 'initiative' ? 'status' : 'state'];
    if (history.metadataSupported !== true || history.identityUnresolved || history.lifecycleAmbiguous || isNull(lifecycle)
      || (fields.state !== undefined && fields.status !== undefined && fields.state !== fields.status)) {
      fail('INVALID_INPUT', 'ambiguous or unsupported source history requires offline reconciliation, not partial repair');
    }
    if (history.terminalHistory || [fields.state, fields.status].some(state => TERMINAL.has(state) || state === 'archived')) {
      fail('INVALID_INPUT', 'historical completed/shipped work cannot be reopened');
    }
    if (source.path.startsWith('.kai/archive/') || source.parsed.terminalMilestones) {
      fail('INVALID_INPUT', 'historical archived work or terminal milestones cannot be reopened');
    }
    if (readLegacyRecords(store).filter(s => s.kind === source.kind && s.declaredId === source.declaredId).length !== 1) fail('INVALID_INPUT', 'duplicate declared identity requires explicit source reconciliation');
    if (readRecord(store, source.kind, source.declaredId)) fail('VERSION_CONFLICT', 'runtime record already exists');
    const originalVersion = source.parsed.fields?.version ?? (source.kind === 'initiative' ? '1' : null);
    if (typeof originalVersion !== 'string' || !/^[1-9]\d*$/.test(originalVersion) || !Number.isSafeInteger(Number(originalVersion))) {
      fail('INVALID_INPUT', 'unknown or unsupported original version history cannot be revalidated');
    }
    const record = validateRecord({kind: source.kind, id: source.declaredId, itemId: source.kind === 'item' ? source.declaredId : null,
      version: Number(originalVersion), body: input.body});
    if (record.kind === 'item') {
      const b = record.body;
      if (b.state !== 'proposed' || b.lease !== null || b.change_ref !== null || b.producer_actor !== null
        || b.acceptance_actor !== null || b.producing_actors.length || b.waiting_on_questions.length || b.recovery_hold !== null) {
        fail('INVALID_INPUT', 'revalidation starts proposed scope, never historical production or acceptance');
      }
      for (const role of [b.scope_authority, b.completion_authority, b.next_role, ...b.review_requirements.map(r => r.role)].filter(Boolean)) {
        if (!roleKnown(role, binding.roles)) fail('ROLE_UNAVAILABLE', `unavailable repair role: ${role}`);
      }
      if (!readRecord(store, 'initiative', b.initiative) || b.depends_on.some(d => !readRecord(store, 'item', d.item))) fail('EVIDENCE_GAP', 'repair has unresolved initiative/dependencies');
      captureInputBasis({root: binding.root}, {get: (kind, id) => readRecord(store, kind, id)}, b.context_artifacts);
      for (const path of b.artifact_targets) assertWorkspacePath(binding.root, path);
    } else if (!['proposed', 'active', 'paused'].includes(record.body.status) || !roleKnown(record.body.owner, binding.roles)
      || record.body.milestones.some(m => TERMINAL.has(m.status))) {
      fail('INVALID_INPUT', 'initiative repair cannot fabricate closure or an unavailable owner');
    } else {
      exactBytes(binding.root, record.body.north_star_ref);
      for (const id of [...record.body.milestones.flatMap(m => m.required_items),
        ...record.body.backlog.map(b => b.item_id).filter(Boolean)]) {
        if (!readRecord(store, 'item', id)) fail('EVIDENCE_GAP', 'initiative repair has an unresolved item reference');
      }
    }
    if (!roleKnown(input.actor.role, binding.roles)
      || binding.verify({request: input, source, record}) !== true) fail('AUTHORITY_REQUIRED', 'explicit repair/revalidation decision not verified by host');
    // A host decision may change storage admission or yield to an offline owner.
    migrationManifest(binding.root, [4]);
    assertWorkspaceWrite(store.path, {requirePrivate: true});
    store.database.prepare('INSERT INTO records VALUES (?,?,?,?,?)').run(record.kind, record.id, record.itemId, record.version, canonicalJson(record.body));
    store.database.prepare("UPDATE legacy_sources SET status='revalidated',version=version+1 WHERE source_id=?").run(source.sourceId);
    const event = store.database.prepare('INSERT INTO events(operation_id,item_id,payload) VALUES(?,?,?)').run(input.operationId, record.itemId,
      canonicalJson({kind: 'legacy.revalidate', actor: input.actor, sourceId: source.sourceId, sourceDigest: source.digest,
        sourcePath: source.path, sourceSize: source.size, sourceBackupPath: source.backupPath,
        reason: input.reason, recordKind: record.kind, recordId: record.id, body: record.body}));
    const receipt = {ok: true, operationId: input.operationId, recordVersion: record.version, eventSeq: Number(event.lastInsertRowid), data: {record}};
    store.database.prepare('INSERT INTO operations VALUES(?,?,?)').run(input.operationId, digest, canonicalJson(receipt));
    store.database.exec('COMMIT');
    return receipt;
  } catch (error) { store.database.exec('ROLLBACK'); throw error; }
}
