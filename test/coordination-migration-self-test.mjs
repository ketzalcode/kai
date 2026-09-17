import assert from 'node:assert/strict';
import test from 'node:test';
import fs from 'node:fs';
import {isAbsolute, join, dirname, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {execFileSync} from 'node:child_process';
import {syncBuiltinESMExports} from 'node:module';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {
  migrateWorkspace, canRollback, rollbackMigration, recoverMigration,
  readLegacyRecords, bindMigrationRepair, repairLegacyRecord,
} from '../scripts/lib/coordination-runtime/migration.mjs';
import {inspectRuntime} from '../scripts/lib/coordination-runtime/inspection.mjs';
import {openStore, closeStore, readRecord} from '../scripts/lib/coordination-runtime/store.mjs';
import {applyCommand} from '../scripts/lib/coordination-runtime/engine.mjs';
import {checkWorkspace} from '../scripts/workspace-doctor.mjs';
import {collect} from '../scripts/work-status.mjs';
import {resolveWorkspaceRoot} from '../scripts/lib/workspace-resolve.mjs';
import {
  allocateTemporaryRoot, command, authority, seedItem, seedInitiative,
} from './helpers/coordination-runtime-fixture.mjs';
import {buildReport, writeReport} from '../scripts/lib/coordination-runtime/report.mjs';
import {bindEvidenceRuntime, hashArtifact, registerArtifact} from '../scripts/lib/coordination-runtime/evidence.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const roles = ['eng-lead-architecture', 'eng-builder-software', 'eng-reviewer-code'];
const stamp = '2026-09-16T12:00:00.000Z';
const put = (root, path, bytes) => {
  const target = join(root, ...path.split('/'));
  fs.mkdirSync(dirname(target), {recursive: true});
  fs.writeFileSync(target, bytes);
};
const manifest = root => join(root, '.kai', 'manifest.json');
const dbPath = root => join(root, '.kai', 'state', 'coordination.sqlite');
const readManifest = root => JSON.parse(fs.readFileSync(manifest(root)));
const assertOutsideCheckout = root => {
  const pathFromCheckout = relative(repo, root);
  assert.ok(
    pathFromCheckout === '..'
      || pathFromCheckout.startsWith(`..${sep}`)
      || isAbsolute(pathFromCheckout),
    `allocated root must be outside checkout: ${root}`,
  );
};
function fixture(fn, {git = true, mode = 'repo-local'} = {}) {
  const root = allocateTemporaryRoot('kai-coordination-migration-fixture-', repo);
  try {
    put(root, '.kai/manifest.json', JSON.stringify({
      plugin: 'kai-core', version: 'test', schema_version: 3, scaffolded: stamp,
      workspace_id: 'migration-test-workspace', storage_mode: mode, workspace_root: '.',
      state: '.kai/state', runs: '.kai/runs', review: '.kai/review',
      archive: '.kai/archive', personal: '.kai/personal',
      projects: [{id: 'project', path: '.', publication_root: 'docs'}], areas: [],
    }, null, 2) + '\n');
    for (const file of ['CONVENTIONS.md', 'state/ACTIVE.md', 'state/BOARD.md', 'state/backlog.md', 'state/initiatives/INDEX.md']) {
      put(root, `.kai/${file}`, '# Legacy source\n');
    }
    fs.mkdirSync(join(root, '.kai', 'state', 'threads'), {recursive: true});
    put(root, '.kai/state/initiatives/demo-initiative/initiative.md', `---
id: demo-initiative
title: Demo initiative
status: active
owner: operator
scope:
  - migration runtime
milestones: []
backlog: []
north_star_ref: .kai/state/initiatives/demo-initiative/northstar.md
updated: ${stamp}
---
Original initiative.
`);
    put(root, '.kai/state/initiatives/demo-initiative/northstar.md', '# Original north star\n');
    put(root, '.kai/state/items/demo.md', legacyItem());
    if (git) {
      gitRun(root, ['init', '--quiet']);
      gitRun(root, ['config', 'core.autocrlf', 'false']);
      put(root, '.gitignore', mode === 'repo-local' ? '.kai/\n' : '.kai/runs/\n.kai/review/\n.kai/archive/\n.kai/personal/\n');
    }
    return fn(root);
  } finally { fs.rmSync(root, {recursive: true, force: true, maxRetries: 5, retryDelay: 100}); }
}
function gitRun(root, args) {
  return execFileSync('git', ['-C', root, ...args], {encoding: 'utf8', windowsHide: true,
    env: {...process.env, GIT_CONFIG_COUNT: '0'}, stdio: ['ignore', 'pipe', 'pipe']});
}
function legacyItem(extra = '') {
  return `---
id: demo
title: Safe nonterminal work
initiative: demo-initiative
version: 7
state: proposed
owner: operator
scope_authority: operator
completion_authority: eng-reviewer-code
delivery_class: knowledge
priority: 1
next_role: eng-builder-software
outcome: Preserve source truth.
acceptance:
  - Verify migration.
artifact_expectation: none
artifact_expectation_reason: No artifact owed.
artifact_class: null
durability: null
validity_owner: null
artifact_targets: []
context_artifacts: []
touches: []
depends_on: []
lease: null
waiting_on_questions: []
review_requirements: []
completed_reviews: []
required_for_milestone: false
change_ref: null
updated: ${stamp}
${extra}---
Original raw body — retained, not generated.
`;
}

test('migration fixture allocates outside the checkout', () => fixture(root => {
  assertOutsideCheckout(root);
}));
function migrated(root) {
  const receipt = migrateWorkspace({root, confirm: true, roles});
  assert.equal(readManifest(root).schema_version, 4);
  return receipt;
}
function withStore(root, fn, mode = 'read') {
  const store = openStore({path: dbPath(root), mode});
  try { return fn(store); } finally { closeStore(store); }
}
function boundary(name, replacement, fn) {
  const original = fs[name];
  fs[name] = (...args) => replacement(original, ...args);
  syncBuiltinESMExports();
  try { return fn(); } finally { fs[name] = original; syncBuiltinESMExports(); }
}

test('explicit offline migration preserves bytes and IDs while converting safe source authorities', () => fixture(root => {
  const before = fs.readFileSync(manifest(root));
  const itemBytes = fs.readFileSync(join(root, '.kai', 'state', 'items', 'demo.md'));
  assert.throws(() => migrateWorkspace({root, roles}), /confirm|offline/i);
  const receipt = migrated(root);
  assert.ok(receipt.backupPath);
  assert.deepEqual(fs.readFileSync(join(receipt.backupPath, '.kai', 'manifest.json')), before);
  assert.deepEqual(fs.readFileSync(join(receipt.backupPath, '.kai', 'state', 'items', 'demo.md')), itemBytes);
  assert.equal(fs.statSync(join(receipt.backupPath, '.kai', 'state', 'items', 'demo.md')).mode & 0o200, 0);
  assert.deepEqual(fs.readFileSync(join(root, '.kai', 'state', 'items', 'demo.md')), itemBytes);
  withStore(root, store => {
    const item = readRecord(store, 'item', 'demo');
    assert.equal(item.version, 7);
    assert.equal(item.body.scope_authority, 'operator');
    assert.equal(item.body.state, 'proposed');
    assert.equal(item.body.producer_actor, null);
    assert.equal(item.body.acceptance_actor, null);
    assert.equal(item.body.updated_at, stamp);
    const source = readLegacyRecords(store).find(r => r.declaredId === 'demo');
    assert.equal(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw.toString(), itemBytes.toString());
    assert.equal(canRollback(store), true);
  });
}));

test('legacy inspection stays read only and coordinate intent refuses schema 3', () => fixture(root => {
  const before = fs.readFileSync(manifest(root));
  assert.ok(checkWorkspace(root, {intent: 'coordinate'}).errors.some(e => /schema.?3|migration/i.test(e)));
  inspectRuntime(root);
  collect(root);
  assert.deepEqual(fs.readFileSync(manifest(root)), before);
  assert.equal(fs.existsSync(dbPath(root)), false);
}));

test('future schema inspection refuses without creating a store', () => fixture(root => {
  put(root, '.kai/manifest.json', JSON.stringify({...readManifest(root), schema_version: 99}));
  assert.ok(inspectRuntime(root).errors.some(e => /schema/i.test(e)));
  assert.equal(collect(root).ok, false);
  assert.equal(fs.existsSync(dbPath(root)), false);
}));

test('malformed and duplicate IDs, retired owners and uncertain acceptance are visible quarantine', () => fixture(root => {
  put(root, '.kai/state/items/broken.md', 'not frontmatter');
  put(root, '.kai/state/items/duplicate.md', legacyItem());
  put(root, '.kai/state/items/retired.md', legacyItem().replace('id: demo\n', 'id: retired\n').replace('owner: operator', 'owner: product-manager'));
  put(root, '.kai/state/items/closed.md', legacyItem().replace('id: demo\n', 'id: closed\n').replace('state: proposed', 'state: completed'));
  migrated(root);
  withStore(root, store => {
    assert.equal(readRecord(store, 'item', 'demo'), null);
    const sources = readLegacyRecords(store);
    for (const id of ['demo', 'retired', 'closed']) {
      assert.ok(sources.some(r => r.declaredId === id && r.status === 'quarantined' && r.issues.length));
    }
    assert.ok(sources.some(r => r.declaredId === null && r.issues.length));
    assert.equal(store.database.prepare("SELECT count(*) AS n FROM records WHERE kind IN ('approval','review')").get().n, 0);
  });
  assert.ok(inspectRuntime(root).warnings.some(e => /quarantin/i.test(e)));
  assert.ok(collect(root).findings.some(f => /quarantin/i.test(f.headline)));
}));

test('both legacy thread forms retain unknown runs and times without inventing peer independence', () => fixture(root => {
  put(root, '.kai/state/threads/demo.md', `QUESTION [Q-demo-01] — eng-builder-software → @eng-reviewer-code
- kind: decision
- status: open
- blocking: yes
- ask: Which source?
ANSWER Q-demo-01 2026-09-16-1200 - eng-reviewer-code -> @eng-builder-software
- answer: Original source.
- lane: in-lane
- provenance: durable-thread
ANSWER [Q-demo-01] — eng-reviewer-code → @eng-builder-software
- answer: Different source.
- lane: in-lane
- provenance: durable-thread
`);
  migrated(root);
  withStore(root, store => {
    const thread = readLegacyRecords(store).find(r => r.kind === 'thread');
    assert.equal(thread.parsed.messages.length, 3);
    assert.equal(thread.parsed.messages[0].timestamp, null);
    assert.equal(thread.parsed.messages[0].senderRun, null);
    assert.equal(thread.parsed.messages[1].timestamp, '2026-09-16-1200');
    assert.ok(thread.issues.some(e => /conflict/i.test(e)));
    assert.equal(readRecord(store, 'item', 'demo'), null);
    assert.equal(store.database.prepare("SELECT count(*) AS n FROM records WHERE kind='message'").get().n, 0);
  });
}));

test('actual rename failure before activation leaves source authoritative and explicit recovery usable', () => fixture(root => {
  const before = fs.readFileSync(manifest(root));
  boundary('renameSync', (original, from, to) => {
    if (resolve(to) === manifest(root)) return original(`${from}.missing`, to);
    return original(from, to);
  }, () => assert.throws(() => migrateWorkspace({root, confirm: true, roles})));
  assert.deepEqual(fs.readFileSync(manifest(root)), before);
  assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /recover|incomplete|migration/i);
  const inspection = inspectRuntime(root);
  assert.ok(inspection.migrations.some(e => /recover|incomplete/i.test(e)));
  const receipt = recoverMigration({root, confirm: true, action: 'activate'});
  assert.equal(receipt.activated, true);
  assert.equal(readManifest(root).schema_version, 4);
}));

test('source edits at activation boundary are preserved and prevent activation/recovery', () => fixture(root => {
  const item = join(root, '.kai', 'state', 'items', 'demo.md');
  boundary('renameSync', (original, from, to) => {
    if (resolve(to) === dbPath(root)) fs.appendFileSync(item, '\nConcurrent user edit\n');
    return original(from, to);
  }, () => assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /chang|fingerprint/i));
  assert.equal(readManifest(root).schema_version, 3);
  assert.match(fs.readFileSync(item, 'utf8'), /Concurrent user edit/);
  assert.throws(() => recoverMigration({root, confirm: true, action: 'activate'}), /chang|fingerprint/i);
}));

test('rollback preserves unrelated user edits but refuses new runtime events and altered backup', () => fixture(root => {
  const original = fs.readFileSync(manifest(root));
  const receipt = migrated(root);
  put(root, 'user.txt', 'new user work');
  rollbackMigration({root, confirm: true});
  assert.deepEqual(fs.readFileSync(manifest(root)), original);
  assert.equal(fs.readFileSync(join(root, 'user.txt'), 'utf8'), 'new user work');
  assert.equal(fs.existsSync(receipt.backupPath), true);
  migrated(root);
  withStore(root, store => {
    const cmd = command('item.update', {actor: {role: 'operator', runId: 'real-operator-run'}, expectedVersion: 7, payload: {title: 'New work'}});
    applyCommand(store, cmd, authority(cmd.actor, 'item.update', {version: 7}));
    assert.equal(canRollback(store), false);
  }, 'write');
  assert.throws(() => rollbackMigration({root, confirm: true}), /new|runtime|rollback/i);
}));

test('tracked SQLite is refused and shared privacy admission only changes private Git metadata', () => fixture(root => {
  const ignore = fs.readFileSync(join(root, '.gitignore'));
  migrated(root);
  assert.deepEqual(fs.readFileSync(join(root, '.gitignore')), ignore);
  for (const suffix of ['', '-wal', '-shm', '-journal']) {
    assert.equal(gitRun(root, ['check-ignore', '--no-index', dbPath(root) + suffix]).trim().length > 0, true);
  }
}, {git: true, mode: 'shared'}));

test('external schema 4 registry resolves and duplicate bindings still fail', () => fixture(root => {
  const project = join(root, 'project');
  fs.mkdirSync(project);
  const external = join(root, 'external');
  fs.mkdirSync(join(external, '.kai'), {recursive: true});
  put(external, '.kai/manifest.json', JSON.stringify({...readManifest(root), schema_version: 4, storage_mode: 'external', projects: [{id: 'p', path: project, publication_root: 'docs'}]}));
  const env = {KAI_HOME: join(root, 'home')};
  const entry = {project_root: project, workspace_root: external, workspace_id: 'migration-test-workspace'};
  put(root, 'home/workspaces.json', JSON.stringify({schema_version: 1, workspaces: [entry]}));
  assert.equal(resolveWorkspaceRoot({cwd: project, env}).root, root); // In-tree wins.
  fs.unlinkSync(manifest(root));
  assert.equal(resolveWorkspaceRoot({cwd: project, env}).root, external);
  put(root, 'home/workspaces.json', JSON.stringify({schema_version: 1, workspaces: [entry, entry]}));
  assert.match(resolveWorkspaceRoot({cwd: project, env}).reason, /2 entries/);
}));

test('runtime commands cannot bypass schema 3 or recreate a quarantined original ID', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
  migrated(root);
  withStore(root, store => {
    const body = {...seedBody(), state: 'proposed'};
    const cmd = command('item.create', {actor: {role: 'operator', runId: 'new-real-run'}, expectedVersion: 0, payload: {body}});
    assert.throws(() => applyCommand(store, cmd, authority(cmd.actor, 'item.create', {version: 0})), /quarantin|legacy/i);
    put(root, '.kai/manifest.json', JSON.stringify({...readManifest(root), schema_version: 3}));
    assert.throws(() => applyCommand(store, cmd, authority(cmd.actor, 'item.create', {version: 0})), /schema/i);
  }, 'write');
}));

function seedBody() {
  const database = new DatabaseSync(':memory:');
  try {
    database.exec('CREATE TABLE records (kind TEXT, id TEXT, item_id TEXT, version INTEGER, body TEXT)');
    return seedItem({database}, {state: 'proposed', producer_actor: null, producing_actors: [], acceptance_actor: null,
      scope_authority: 'operator', completion_authority: 'eng-reviewer-code', next_role: 'eng-builder-software'}).body;
  } finally { database.close(); }
}

test('unsupported list encodings are quarantined rather than silently emptied', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('depends_on: []', 'depends_on: [upstream]'));
  migrated(root);
  withStore(root, store => {
    assert.equal(readRecord(store, 'item', 'demo'), null);
    assert.match(readLegacyRecords(store).find(s => s.declaredId === 'demo').issues.join(';'), /depends_on|dependenc/);
  });
}));

test('declared northstar slug and structured backlog/asset identities survive as inspectable history', () => fixture(root => {
  fs.unlinkSync(join(root, '.kai', 'state', 'initiatives', 'demo-initiative', 'initiative.md'));
  put(root, '.kai/state/initiatives/demo-initiative/northstar.md', `---
type: initiative
slug: demo-initiative
title: Original northstar
status: active
owner: operator
scope:
  current:
    - migration
milestones: []
backlog: []
updated: ${stamp}
---
Original mission.
`);
  put(root, '.kai/state/initiatives/demo-initiative/backlog.md', `---
id: backlog-original
---
| ID | Title | Status |
| --- | --- | --- |
| idea-17 | Preserve idea | parked |
`);
  put(root, '.kai/state/initiatives/demo-initiative/artifacts/note.md', `---
asset_id: original-asset-23
state: current
completion_authority: operator
---
Historical artifact, not newly accepted.
`);
  migrated(root);
  withStore(root, store => {
    assert.ok(readRecord(store, 'initiative', 'demo-initiative'), 'declared northstar is a convertible initiative');
    assert.equal(readRecord(store, 'initiative', 'demo-initiative').body.scope.current[0], 'migration');
    assert.equal(readRecord(store, 'item', 'demo').id, 'demo');
    const sources = readLegacyRecords(store);
    assert.equal(sources.find(s => s.kind === 'asset').declaredId, 'original-asset-23');
    assert.equal(sources.find(s => s.kind === 'backlog' && s.declaredId === 'backlog-original').parsed.entries[0].id, 'idea-17');
  });
}));

test('repair requires bound host authorization, retains history, and forbids reopening terminal work', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
  put(root, '.kai/state/items/closed.md', legacyItem().replace('id: demo\n', 'id: closed\n').replace('state: proposed', 'state: shipped'));
  migrated(root);
  withStore(root, store => {
    const summary = readLegacyRecords(store).find(s => s.declaredId === 'demo');
    const source = readLegacyRecords(store, {sourceId: summary.sourceId, includeRaw: true})[0];
    const request = {operationId: randomUUID(), sourceId: source.sourceId, expectedVersion: 1,
      actor: {role: 'operator', runId: 'real-revalidation-run'}, reason: 'Explicitly accept supplied scope for a new attempt.',
      body: seedBody()};
    assert.throws(() => repairLegacyRecord(store, request), /bind|authority/i);
    bindMigrationRepair(store, {root, roles, verify: () => false});
    assert.throws(() => repairLegacyRecord(store, request), /verified|authority/i);
    bindMigrationRepair(store, {root, roles, verify: ({request: r}) => r.actor.role === 'operator' && r.reason === request.reason});
    const receipt = repairLegacyRecord(store, request);
    assert.equal(receipt.data.record.body.state, 'proposed');
    assert.equal(receipt.data.record.body.acceptance_actor, null);
    assert.deepEqual(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw, source.raw);
    assert.equal(readLegacyRecords(store).find(s => s.sourceId === source.sourceId).parsed.declaredState, 'ready');
    assert.deepEqual(repairLegacyRecord(store, request), receipt);
    assert.equal(canRollback(store), false);
    const closed = readLegacyRecords(store).find(s => s.declaredId === 'closed');
    assert.throws(() => repairLegacyRecord(store, {...request, operationId: randomUUID(), sourceId: closed.sourceId, body: {...seedBody(), id: 'closed'}}), /reopen|historical/i);
    // The revalidated scope still needs a new explicit host action grant to promote.
    const promote = command('item.promote', {actor: request.actor, expectedVersion: 7, payload: {at: stamp}});
    assert.throws(() => applyCommand(store, promote, {roles, grants: []}), /authority/i);
    assert.equal(applyCommand(store, promote, authority(promote.actor, 'item.promote', {version: 7})).data.record.body.state, 'ready');
  }, 'write');
}));

test('read-only inspection validates current owned report plus member, view and metadata digests', () => fixture(root => {
  migrated(root);
  let output;
  withStore(root, store => {
    output = writeReport({root, itemId: 'demo', view: buildReport(store, {itemId: 'demo'})});
  });
  assert.equal(inspectRuntime(root).warnings.some(w => /changed\/incomplete derived/.test(w)), false);
  const html = fs.readFileSync(output.path);
  fs.appendFileSync(output.path, '\nEdited report');
  assert.ok(inspectRuntime(root).warnings.some(w => /changed\/incomplete derived/.test(w)));
  fs.writeFileSync(output.path, html);
  const metadata = fs.readFileSync(output.metadataPath);
  const changed = JSON.parse(metadata);
  changed.view.item.title = 'Tampered view';
  fs.writeFileSync(output.metadataPath, JSON.stringify(changed));
  assert.ok(inspectRuntime(root).warnings.some(w => /changed\/incomplete derived/.test(w)));
  fs.writeFileSync(output.metadataPath, metadata);
  fs.appendFileSync(output.indexPath, 'User content');
  assert.ok(inspectRuntime(root).warnings.some(w => /changed\/incomplete derived/.test(w)));
  assert.equal(readManifest(root).schema_version, 4);
}));

test('backup tamper and legacy view edits refuse rollback without overwriting edits', () => fixture(root => {
  const receipt = migrated(root);
  const backup = join(receipt.backupPath, '.kai', 'state', 'items', 'demo.md');
  const original = fs.readFileSync(backup);
  fs.chmodSync(backup, 0o600);
  fs.appendFileSync(backup, 'tampered');
  assert.throws(() => rollbackMigration({root, confirm: true}), /backup|tamper/i);
  assert.ok(inspectRuntime(root).warnings.some(w => /backup.*gap/.test(w)));
  fs.writeFileSync(backup, original);
  put(root, '.kai/state/BOARD.md', 'user board edit');
  assert.throws(() => rollbackMigration({root, confirm: true}), /chang|fingerprint/i);
  assert.equal(fs.readFileSync(join(root, '.kai', 'state', 'BOARD.md'), 'utf8'), 'user board edit');
  assert.ok(inspectRuntime(root).warnings.some(w => /view drift/.test(w)));
}));

test('WAL store inspection is read-only and checkpointed rollback keeps every baseline record', () => fixture(root => {
  migrated(root);
  withStore(root, store => {
    store.database.exec('PRAGMA journal_mode=WAL; BEGIN IMMEDIATE; COMMIT;');
    const before = fs.readdirSync(join(root, '.kai', 'state')).sort();
    assert.equal(inspectRuntime(root).runtime.items[0].id, 'demo');
    assert.deepEqual(fs.readdirSync(join(root, '.kai', 'state')).sort(), before);
    assert.equal(canRollback(store), true);
  }, 'write');
  rollbackMigration({root, confirm: true});
  assert.equal(readManifest(root).schema_version, 3);
  assert.equal(fs.existsSync(dbPath(root)), false);
}));

test('active lease and known unsupported network storage refuse before activation', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('lease: null', 'lease:\n  holder: eng-builder-software\n  token: held-token\n  expires: 2099-01-01'));
  assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /active|unreconciled/i);
  assert.equal(readManifest(root).schema_version, 3);
  assert.equal(fs.existsSync(dbPath(root)), false);
  put(root, '.kai/manifest.json', JSON.stringify({...readManifest(root), filesystem: 'smb'}));
  assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /unsupported|network/i);
}));

test('tracked DB and preexisting partial SQLite refuse without replacing either file', () => fixture(root => {
  put(root, '.kai/state/coordination.sqlite', 'unactivated');
  gitRun(root, ['add', '-f', '--', '.kai/state/coordination.sqlite']);
  assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /tracked/i);
  assert.equal(fs.readFileSync(dbPath(root), 'utf8'), 'unactivated');
  gitRun(root, ['rm', '--cached', '--quiet', '--', '.kai/state/coordination.sqlite']);
  assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /incomplete|existing/i);
  assert.equal(fs.readFileSync(dbPath(root), 'utf8'), 'unactivated');
}, {mode: 'shared'}));

test('manifest edits are never overwritten by rollback', () => fixture(root => {
  migrated(root);
  const changed = {...readManifest(root), user_note: 'keep my manifest edit'};
  put(root, '.kai/manifest.json', JSON.stringify(changed));
  assert.throws(() => rollbackMigration({root, confirm: true}), /manifest|chang|fingerprint/i);
  assert.deepEqual(readManifest(root), changed);
}));

test('external migration uses explicit registry environment through activation and inspection', () => fixture(root => {
  const project = allocateTemporaryRoot('kai-coordination-migration-project-', repo);
  try {
    assertOutsideCheckout(project);
    gitRun(project, ['init', '--quiet']);
    const env = {KAI_HOME: join(root, 'home')};
    const m = {...readManifest(root), storage_mode: 'external', workspace_root: root,
      projects: [{id: 'project', path: project, publication_root: 'docs'}]};
    put(root, '.kai/manifest.json', JSON.stringify(m));
    put(root, 'home/workspaces.json', JSON.stringify({schema_version: 1, workspaces: [{
      project_root: project, workspace_root: root, workspace_id: m.workspace_id,
    }]}));
    const receipt = migrateWorkspace({root, confirm: true, roles, env});
    assert.equal(receipt.activated, true);
    assert.equal(inspectRuntime(root, {env}).errors.length, 0);
    assert.equal(fs.existsSync(join(project, '.kai')), false);
    rollbackMigration({root, confirm: true, env});
    assert.equal(readManifest(root).schema_version, 3);
  } finally { fs.rmSync(project, {recursive: true, force: true}); }
}, {mode: 'shared'}));

test('missing retained artifact and missing timestamps stay visible unknowns', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('context_artifacts: []', 'context_artifacts:\n  - .kai/archive/missing.md').replace(`updated: ${stamp}\n`, ''));
  migrated(root);
  withStore(root, store => {
    const source = readLegacyRecords(store).find(s => s.declaredId === 'demo');
    assert.equal(source.parsed.updated, null);
    assert.equal(source.status, 'quarantined');
    assert.ok(source.issues.some(i => /missing artifact/.test(i)));
    assert.equal(readRecord(store, 'item', 'demo'), null);
  });
}));

test('incomplete backup failure can be abandoned without deleting new user files', () => fixture(root => {
  boundary('writeFileSync', (original, path, ...args) => {
    // A real filesystem error after lock/plan creation, before a complete backup.
    if (typeof path === 'number' && fs.existsSync(join(root, '.kai', 'archive', 'coordination-migrations'))
      && fs.readdirSync(join(root, '.kai', 'archive', 'coordination-migrations')).length) {
      return original(join(root, 'missing-directory', 'not-created'), ...args);
    }
    return original(path, ...args);
  }, () => assert.throws(() => migrateWorkspace({root, confirm: true, roles})));
  put(root, '.kai/state/user-added.md', 'preserved user change');
  assert.throws(() => recoverMigration({root, confirm: true, action: 'activate'}));
  const result = recoverMigration({root, confirm: true, action: 'abandon'});
  assert.equal(result.abandoned, true);
  assert.equal(fs.readFileSync(join(root, '.kai', 'state', 'user-added.md'), 'utf8'), 'preserved user change');
  assert.equal(fs.existsSync(result.retainedPath), true);
  migrated(root);
}));

test('report live sequence and partial exports warn without blocking unrelated safe coordination', () => fixture(root => {
  migrated(root);
  let report;
  withStore(root, store => { report = writeReport({root, itemId: 'demo', view: buildReport(store, {itemId: 'demo'})}); });
  put(root, '.kai/review/coordination/' + report.directory.split(/[\\/]/).at(-1) + '/snapshot-9-partial.html', 'partial output');
  withStore(root, store => {
    const cmd = command('item.update', {actor: {role: 'operator', runId: 'new-run'}, expectedVersion: 7, payload: {title: 'Changed runtime title'}});
    applyCommand(store, cmd, authority(cmd.actor, 'item.update', {version: 7}));
  }, 'write');
  const inspected = inspectRuntime(root);
  assert.ok(inspected.warnings.some(w => /stale derived report/.test(w)));
  assert.ok(inspected.warnings.some(w => /partial derived output/.test(w)));
  assert.equal(checkWorkspace(root, {intent: 'coordinate'}).errors.length, 0);
  assert.equal(collect(root).totals.items, 1);
}));

test('other live SQLite files are refused rather than blindly copied with a WAL', () => fixture(root => {
  const database = new DatabaseSync(join(root, '.kai', 'state', 'other.sqlite'));
  try {
    database.exec('PRAGMA journal_mode=WAL; CREATE TABLE live(value TEXT); INSERT INTO live VALUES (\'only in WAL\')');
    assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /SQLite|database|WAL/i);
    assert.equal(readManifest(root).schema_version, 3);
    assert.equal(database.prepare('SELECT value FROM live').get().value, 'only in WAL');
  } finally { database.close(); }
}));

test('shared privacy loss after activation blocks runtime writes without editing Git files', () => fixture(root => {
  migrated(root);
  withStore(root, store => {
    gitRun(root, ['add', '-f', '--', '.kai/state/coordination.sqlite']);
    const cmd = command('item.update', {actor: {role: 'operator', runId: 'operator-run'}, expectedVersion: 7, payload: {title: 'Unsafe write'}});
    assert.throws(() => applyCommand(store, cmd, authority(cmd.actor, 'item.update', {version: 7})), /tracked|private/i);
    assert.equal(readRecord(store, 'item', 'demo').version, 7);
  }, 'write');
}, {mode: 'shared'}));

test('nonempty milestone/backlog conversion preserves original IDs', () => fixture(root => {
  const path = join(root, '.kai', 'state', 'initiatives', 'demo-initiative', 'initiative.md');
  fs.writeFileSync(path, fs.readFileSync(path, 'utf8').replace('milestones: []', `milestones:
  - id: milestone-original
    title: Initial milestone
    delivery_class: knowledge
    required_items: []
    status: proposed`).replace('backlog: []', `backlog:
  - id: parked-original
    title: Saved idea
    status: parked
    item_id: null
    reason: Explicitly deferred`));
  migrated(root);
  withStore(root, store => {
    const body = readRecord(store, 'initiative', 'demo-initiative').body;
    assert.equal(body.milestones[0].id, 'milestone-original');
    assert.equal(body.backlog[0].id, 'parked-original');
  });
}));

test('repair checks fresh references and never accepts missing artifact bytes', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
  migrated(root);
  withStore(root, store => {
    const source = readLegacyRecords(store).find(s => s.declaredId === 'demo');
    bindMigrationRepair(store, {root, roles, verify: () => true});
    assert.throws(() => repairLegacyRecord(store, {operationId: randomUUID(), sourceId: source.sourceId,
      expectedVersion: 1, actor: {role: 'operator', runId: 'explicit-run'},
      reason: 'Fresh scope', body: {...seedBody(), context_artifacts: ['.kai/archive/absent.md']}}), /artifact|reference|missing/i);
    assert.equal(readRecord(store, 'item', 'demo'), null);
  }, 'write');
}));

test('linked private lanes and shared source hardlinks are refused before any activation', () => fixture(root => {
  const source = join(root, '.kai', 'state', 'items', 'demo.md');
  fs.linkSync(source, join(root, 'shared-user-file.md'));
  assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /unshared|regular/i);
  assert.equal(readManifest(root).schema_version, 3);
  assert.match(fs.readFileSync(join(root, 'shared-user-file.md'), 'utf8'), /Original raw body/);
}));

test('valid bracketed and timestamped answers reconcile once but remain historical authority', () => fixture(root => {
  put(root, '.kai/state/threads/demo.md', `QUESTION [Q-demo-01] — eng-builder-software → @eng-reviewer-code
- kind: fact
- blocking: yes
- status: open
- ask: Which source?
ANSWER Q-demo-01 2026-09-16-1200 - eng-reviewer-code -> @eng-builder-software
- answer: Original source.
- lane: in-lane
- provenance: durable-thread
`);
  migrated(root);
  withStore(root, store => {
    const thread = readLegacyRecords(store).find(s => s.kind === 'thread');
    assert.equal(thread.parsed.questions.length, 1);
    assert.equal(thread.parsed.questions[0].status, 'answered');
    assert.equal(thread.parsed.questions[0].provenance, 'durable-thread');
    assert.equal(thread.parsed.messages[0].senderRun, null);
    assert.equal(thread.status, 'quarantined');
  });
}));

test('empty indeterminate requirement blocks are not converted as explicit empty lists', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('review_requirements: []', 'review_requirements:'));
  migrated(root);
  withStore(root, store => {
    assert.equal(readRecord(store, 'item', 'demo'), null);
    assert.ok(readLegacyRecords(store).find(s => s.declaredId === 'demo').issues.some(i => /review_requirements/.test(i)));
  });
}));

test('a competing real process cannot migrate while the offline owner holds its lock', () => fixture(root => {
  let competed = false;
  boundary('renameSync', (original, from, to) => {
    if (resolve(to) === dbPath(root)) {
      const moduleUrl = new URL('../scripts/lib/coordination-runtime/migration.mjs', import.meta.url).href;
      const code = `import {migrateWorkspace} from ${JSON.stringify(moduleUrl)};
        try { migrateWorkspace({root:process.argv[1],confirm:true}); process.exit(7); }
        catch(e) { if(e.code!=='RECOVERY_REQUIRED') throw e; console.log(e.code); }`;
      assert.equal(execFileSync(process.execPath, ['--input-type=module', '-e', code, root], {encoding: 'utf8'}).trim(), 'RECOVERY_REQUIRED');
      competed = true;
    }
    return original(from, to);
  }, () => migrated(root));
  assert.equal(competed, true);
}));

test('rollback refuses an unexpected retirement target without replacing manifest or user bytes', () => fixture(root => {
  const receipt = migrated(root);
  const identity = readManifest(root).coordination_migration;
  const target = `${identity.directory}/rolled-back.sqlite`;
  put(root, target, 'user-owned collision');
  const before = fs.readFileSync(manifest(root));
  assert.throws(() => rollbackMigration({root, confirm: true}), /exist|collision|unexpected/i);
  assert.deepEqual(fs.readFileSync(manifest(root)), before);
  assert.equal(fs.readFileSync(join(root, ...target.split('/')), 'utf8'), 'user-owned collision');
  assert.equal(fs.existsSync(receipt.databasePath), true);
}));

test('dangling promoted backlog references quarantine the initiative and dependent item', () => fixture(root => {
  const path = join(root, '.kai', 'state', 'initiatives', 'demo-initiative', 'initiative.md');
  fs.writeFileSync(path, fs.readFileSync(path, 'utf8').replace('backlog: []', `backlog:
  - id: original-idea
    title: Unresolved promotion
    status: promoted
    item_id: nonexistent
    reason: Legacy claim`));
  migrated(root);
  withStore(root, store => {
    assert.equal(readRecord(store, 'initiative', 'demo-initiative'), null);
    assert.ok(readLegacyRecords(store).find(s => s.declaredId === 'demo-initiative').issues.some(i => /reference|backlog/.test(i)));
    assert.equal(readRecord(store, 'item', 'demo'), null);
  });
}));

function repairRequest(store) {
  return {operationId: randomUUID(), sourceId: readLegacyRecords(store).find(s => s.declaredId === 'demo').sourceId,
    expectedVersion: 1, actor: {role: 'operator', runId: 'authorized-repair-run'},
    reason: 'Explicit fresh scope decision', body: seedBody()};
}

test('round1 repair obeys offline guard inside transaction including authorized verifier boundary', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
  migrated(root);
  withStore(root, store => {
    const request = repairRequest(store);
    const lock = join(root, '.kai', 'state', 'migration.lock');
    bindMigrationRepair(store, {root, roles, verify: () => {
      fs.writeFileSync(lock, 'offline owner');
      return true;
    }});
    try {
      assert.throws(() => repairLegacyRecord(store, request), /offline|lock|recovery/i);
      assert.equal(readRecord(store, 'item', 'demo'), null);
      assert.equal(canRollback(store), true);
    } finally { if (fs.existsSync(lock)) fs.unlinkSync(lock); }
    bindMigrationRepair(store, {root, roles, verify: () => true});
    fs.writeFileSync(lock, 'offline owner');
    try {
      assert.throws(() => repairLegacyRecord(store, request), /offline|lock|recovery/i);
      assert.equal(readRecord(store, 'item', 'demo'), null);
    } finally { fs.unlinkSync(lock); }
    assert.equal(repairLegacyRecord(store, request).ok, true);
    assert.throws(() => rollbackMigration({root, confirm: true}), /new|runtime|changed/i);
    assert.equal(readRecord(store, 'item', 'demo').version, 7);
  }, 'write');
}));

test('round1 rollback cannot retire a concurrently authorized repair at manifest boundary', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
  migrated(root);
  let attempted = false;
  boundary('renameSync', (original, from, to) => {
    if (resolve(to) === manifest(root)) {
      withStore(root, store => {
        bindMigrationRepair(store, {root, roles, verify: () => true});
        assert.throws(() => repairLegacyRecord(store, repairRequest(store)), /offline|lock|recovery/i);
        assert.equal(readRecord(store, 'item', 'demo'), null);
        attempted = true;
      }, 'write');
    }
    return original(from, to);
  }, () => rollbackMigration({root, confirm: true}));
  assert.equal(attempted, true);
  assert.equal(readManifest(root).schema_version, 3);
}));

for (const state of ['completed', 'shipped']) {
  test(`round1 archived ${state} identity and version cannot be reused or repaired`, () => fixture(root => {
    const path = '.kai/archive/old-work/closed.md';
    const raw = legacyItem().replace('id: demo\n', 'id: closed\n').replace('state: proposed', `state: ${state}`).replace('version: 7', 'version: 9');
    put(root, path, raw);
    migrated(root);
    withStore(root, store => {
      const cmd = command('item.create', {recordId: 'closed', actor: {role: 'operator', runId: 'new-run'},
        expectedVersion: 0, payload: {body: {...seedBody(), id: 'closed'}}});
      assert.throws(() => applyCommand(store, cmd, authority(cmd.actor, 'item.create', {recordId: 'closed', version: 0})), /legacy|histor|quarantin/i);
      const source = readLegacyRecords(store).find(s => s.path === path);
      assert.equal(source.kind, 'item');
      assert.equal(source.declaredId, 'closed');
      assert.equal(source.parsed.fields.version, '9');
      assert.equal(source.parsed.declaredState, state);
      bindMigrationRepair(store, {root, roles, verify: () => true});
      assert.throws(() => repairLegacyRecord(store, {...repairRequest(store), sourceId: source.sourceId,
        body: {...seedBody(), id: 'closed'}}), /historical|reopen/i);
      assert.equal(readRecord(store, 'item', 'closed'), null);
      assert.equal(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw.toString(), raw);
    }, 'write');
  }));
}

for (const mode of ['repo-local', 'shared', 'external']) {
  for (const path of ['.kai/runs/evidence.md', '.kai/personal/note.md', '.kai/activity.jsonl',
    '.kai/observed.jsonl.1', '.kai/observer-consent', '.kai/local.json', '.kai/review/raw.md', '.kai/archive/raw.md']) {
    test(`round1 ${mode} admission refuses tracked private ${path}`, () => fixture(root => {
      let env = process.env;
      if (mode === 'external') {
        const project = join(root, 'project');
        fs.mkdirSync(project);
        // Independent fixture workspace and project Git roots, with no shared metadata.
        gitRun(project, ['init', '--quiet']);
        const home = join(root, 'home');
        env = {...process.env, KAI_HOME: home};
        const external = join(root, 'external');
        fs.mkdirSync(external);
        fs.renameSync(join(root, '.kai'), join(external, '.kai'));
        gitRun(external, ['init', '--quiet']);
        put(external, '.gitignore', '.kai/runs/\n.kai/review/\n.kai/archive/\n.kai/personal/\n');
        put(external, '.kai/manifest.json', JSON.stringify({...readManifest(external), storage_mode: 'external',
          workspace_root: external, projects: [{id: 'project', path: project, publication_root: 'docs'}]}));
        put(root, 'home/workspaces.json', JSON.stringify({schema_version: 1, workspaces: [{
          project_root: project, workspace_root: external, workspace_id: 'migration-test-workspace',
        }]}));
        root = external;
      }
      put(root, path, path.endsWith('.jsonl') ? '' : 'original private bytes');
      gitRun(root, ['add', '-f', '--', path]);
      const tracked = gitRun(root, ['ls-files', '--stage']);
      const ignore = fs.readFileSync(join(root, '.gitignore'));
      assert.throws(() => migrateWorkspace({root, confirm: true, roles, env}), /tracked.*private|private.*tracked|untracked/i);
      assert.equal(readManifest(root).schema_version, 3);
      assert.equal(gitRun(root, ['ls-files', '--stage']), tracked);
      assert.deepEqual(fs.readFileSync(join(root, '.gitignore')), ignore);
    }, {mode: mode === 'external' ? 'shared' : mode}));
  }
}

test('round1 schema4 checks every existing private lane and storage mode without changing files', () => fixture(root => {
  migrated(root);
  for (const path of ['.kai/runs/raw.md', '.kai/personal/note.md', '.kai/local.json', '.kai/activity.jsonl.1']) {
    put(root, path, 'private bytes');
    gitRun(root, ['add', '-f', '--', path]);
    const before = gitRun(root, ['ls-files', '--stage']);
    assert.ok(checkWorkspace(root, {intent: 'coordinate'}).errors.some(e => /tracked|private/.test(e)));
    withStore(root, store => {
      const cmd = command('item.update', {actor: {role: 'operator', runId: 'run'}, expectedVersion: 7, payload: {title: 'Unsafe'}});
      assert.throws(() => applyCommand(store, cmd, authority(cmd.actor, 'item.update', {version: 7})), /tracked|private/i);
    }, 'write');
    assert.equal(gitRun(root, ['ls-files', '--stage']), before);
    gitRun(root, ['rm', '--cached', '--quiet', '--', path]);
  }
}, {mode: 'shared'}));

test('round1 per-mode admission refuses tracked repo-local state and ignored shared state', () => {
  fixture(root => {
    gitRun(root, ['add', '-f', '--', '.kai/state/BOARD.md']);
    assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /tracked|untracked/i);
  });
  fixture(root => {
    put(root, '.gitignore', '.kai/\n');
    assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /trackable/i);
  }, {mode: 'shared'});
});

const malformedCollections = [
  ['context_artifacts', '  required: .kai/archive/missing.md'],
  ['artifact_targets', '  - .kai/archive/target.md\n    required: .kai/archive/missing.md'],
  ['touches', '  - path: product.md'],
  ['waiting_on_questions', '  unresolved: Q-original'],
  ['acceptance', '  required: Original acceptance'],
  ['depends_on', '  - item: upstream\n    requires: completed\n    extra: original'],
  ['review_requirements', '  - role: eng-reviewer-code'],
  ['completed_reviews', '  - role: eng-reviewer-code\n    evidence:\n      path: original.md'],
];
for (const [key, block] of malformedCollections) {
  test(`round1 malformed collection ${key} quarantines without dropping original inputs`, () => fixture(root => {
    const raw = legacyItem().replace(key === 'acceptance' ? 'acceptance:\n  - Verify migration.' : `${key}: []`, `${key}:\n${block}`);
    put(root, '.kai/state/items/demo.md', raw);
    migrated(root);
    withStore(root, store => {
      assert.equal(readRecord(store, 'item', 'demo'), null);
      const source = readLegacyRecords(store).find(s => s.declaredId === 'demo');
      assert.equal(source.status, 'quarantined');
      assert.ok(source.issues.some(i => i.includes(key)));
      assert.equal(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw.toString(), raw);
    });
  }));
}

for (const [key, block] of [
  ['scope', '  current:\n    - safe\n    required: missing'],
  ['milestones', '  required: original-milestone'],
  ['milestones', '  - id: original\n    title: Original\n    delivery_class: knowledge\n    required_items: []\n    status: proposed\n    extra: retained'],
  ['backlog', '  parked:\n    id: original-idea'],
  ['backlog', '  - id: original\n    title: Original\n    status: parked'],
]) {
  test(`round1 malformed initiative ${key} ${block.split('\n')[0]} remains quarantine`, () => fixture(root => {
    const path = '.kai/state/initiatives/demo-initiative/initiative.md';
    const before = fs.readFileSync(join(root, ...path.split('/')), 'utf8');
    const raw = before.replace(key === 'scope' ? 'scope:\n  - migration runtime' : `${key}: []`, `${key}:\n${block}`);
    put(root, path, raw);
    migrated(root);
    withStore(root, store => {
      assert.equal(readRecord(store, 'initiative', 'demo-initiative'), null);
      const source = readLegacyRecords(store).find(s => s.declaredId === 'demo-initiative');
      assert.ok(source.issues.some(i => i.includes(key)));
      assert.equal(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw.toString(), raw);
    });
  }));
}

for (const terminal of ['completed', 'shipped', 'archived', 'milestone']) {
  test(`round1 terminal initiative ${terminal} retains unverified history not current closure`, () => fixture(root => {
    const path = '.kai/state/initiatives/demo-initiative/initiative.md';
    const before = fs.readFileSync(join(root, ...path.split('/')), 'utf8');
    const raw = terminal === 'milestone' ? before.replace('milestones: []', `milestones:
  - id: old-milestone
    title: Original closure
    delivery_class: knowledge
    required_items: []
    status: completed`) : before.replace('status: active', `status: ${terminal}`);
    put(root, path, raw);
    migrated(root);
    withStore(root, store => {
      assert.equal(readRecord(store, 'initiative', 'demo-initiative'), null);
      const source = readLegacyRecords(store).find(s => s.declaredId === 'demo-initiative');
      assert.equal(source.status, 'quarantined');
      assert.ok(source.issues.some(i => /terminal|closure|histor/.test(i)));
      assert.equal(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw.toString(), raw);
    });
  }));
}

test('round1 2MiB opaque evidence stays external with lazy exact verified backup references', t => fixture(root => {
  const bytes = Buffer.alloc(2 * 1024 * 1024, 0x61);
  bytes[1024] = 0xff;
  const path = '.kai/archive/opaque.md';
  put(root, path, bytes);
  const receipt = migrated(root);
  withStore(root, store => {
    const databaseSize = fs.statSync(dbPath(root)).size;
    assert.ok(databaseSize < 512 * 1024, 'opaque evidence must not grow the coordinator by 2MiB');
    assert.equal(store.database.prepare('PRAGMA table_info(legacy_sources)').all().some(c => c.name === 'raw' || c.type === 'BLOB'), false);
    t.diagnostic(`opaque source: ${bytes.length} bytes; coordinator: ${databaseSize} bytes; raw BLOB columns: 0`);
    const source = readLegacyRecords(store).find(s => s.path === path);
    assert.equal(source.raw, undefined, 'lists must not eagerly load raw bytes');
    assert.equal(source.size, bytes.length);
    assert.equal(source.backupPath, `${readManifest(root).coordination_migration.directory}/backup/${path}`);
    assert.ok(JSON.stringify(source.parsed).length < 1024, 'parsed metadata is not a raw-body replacement');
    const backup = join(receipt.backupPath, ...path.split('/'));
    fs.unlinkSync(join(root, ...path.split('/')));
    boundary('readFileSync', (original, file, ...args) => {
      if (typeof file === 'string' && resolve(file) === backup) assert.fail('list read raw backup');
      return original(file, ...args);
    }, () => assert.equal(readLegacyRecords(store).find(s => s.path === path).size, bytes.length));
    assert.deepEqual(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw, bytes);
    fs.chmodSync(backup, 0o600);
    fs.appendFileSync(backup, 'tamper');
    assert.throws(() => readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true}), /digest|backup|changed|size/i);
  });
}));

test('round1 oversized coordination metadata quarantines exact original identity and bytes', () => fixture(root => {
  const raw = legacyItem().replace('title: Safe nonterminal work', `title: ${'x'.repeat(80 * 1024)}`);
  put(root, '.kai/state/items/demo.md', raw);
  migrated(root);
  withStore(root, store => {
    assert.equal(readRecord(store, 'item', 'demo'), null);
    const source = readLegacyRecords(store).find(s => s.path === '.kai/state/items/demo.md');
    assert.equal(source.status, 'quarantined');
    assert.ok(source.issues.some(i => /oversized|limit|bounded/i.test(i)));
    assert.equal(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw.toString(), raw);
    const cmd = command('item.create', {actor: {role: 'operator', runId: 'run'}, expectedVersion: 0, payload: {body: seedBody()}});
    assert.throws(() => applyCommand(store, cmd, authority(cmd.actor, 'item.create', {version: 0})), /legacy|quarantin|identity/i);
  }, 'write');
}));

test('round1 closed ordinary SQLite evidence is preserved exactly outside coordinator', () => fixture(root => {
  const path = '.kai/archive/evidence.sqlite';
  fs.mkdirSync(join(root, '.kai', 'archive'), {recursive: true});
  const database = new DatabaseSync(join(root, ...path.split('/')));
  database.exec("CREATE TABLE evidence(value TEXT); INSERT INTO evidence VALUES ('original evidence')");
  database.close();
  const bytes = fs.readFileSync(join(root, ...path.split('/')));
  const receipt = migrated(root);
  assert.deepEqual(fs.readFileSync(join(receipt.backupPath, ...path.split('/'))), bytes);
  withStore(root, store => {
    const source = readLegacyRecords(store).find(s => s.path === path);
    assert.ok(source, 'ordinary database evidence has retained source provenance');
    assert.equal(source.kind, 'archive');
    assert.deepEqual(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw, bytes);
  });
  assert.equal(inspectRuntime(root).errors.length, 0);
  rollbackMigration({root, confirm: true});
  assert.deepEqual(fs.readFileSync(join(root, ...path.split('/'))), bytes);
}));

test('round1 repair refuses unknown original version rather than inventing version one', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('version: 7', 'version: unknown').replace('state: proposed', 'state: ready'));
  migrated(root);
  withStore(root, store => {
    bindMigrationRepair(store, {root, roles, verify: () => true});
    assert.throws(() => repairLegacyRecord(store, repairRequest(store)), /version|history/i);
    assert.equal(readRecord(store, 'item', 'demo'), null);
  }, 'write');
}));

test('round1 malformed top-level metadata is never partially converted', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem('unparsed original field\n'));
  migrated(root);
  withStore(root, store => {
    assert.equal(readRecord(store, 'item', 'demo'), null);
    assert.ok(readLegacyRecords(store).find(s => s.declaredId === 'demo').issues.some(i => /unsupported|malformed/i.test(i)));
  });
}));

test('round1 initiative repair cannot discard or fabricate terminal milestone history', () => fixture(root => {
  const path = '.kai/state/initiatives/demo-initiative/initiative.md';
  const before = fs.readFileSync(join(root, ...path.split('/')), 'utf8');
  put(root, path, before.replace('owner: operator', 'owner: missing-owner'));
  migrated(root);
  withStore(root, store => {
    const source = readLegacyRecords(store).find(s => s.declaredId === 'demo-initiative');
    bindMigrationRepair(store, {root, roles, verify: () => true});
    assert.throws(() => repairLegacyRecord(store, {operationId: randomUUID(), sourceId: source.sourceId,
      expectedVersion: 1, actor: {role: 'operator', runId: 'initiative-owner-run'}, reason: 'Fresh scope',
      body: {schema_version: 1, id: 'demo-initiative', title: 'New scope', status: 'active', owner: 'operator',
        scope: {current: ['scope']}, milestones: [{id: 'original', title: 'Claimed closed',
          delivery_class: 'knowledge', required_items: [], status: 'completed'}], backlog: [],
        north_star_ref: '.kai/state/initiatives/demo-initiative/northstar.md', updated_at: stamp}}), /closure|initiative|terminal/i);
    assert.equal(readRecord(store, 'initiative', 'demo-initiative'), null);
  }, 'write');
}));

test('round1 real process repair is refused during rollback and accepted work prevents retirement', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
  migrated(root);
  let request;
  withStore(root, store => { request = repairRequest(store); });
  const migrationUrl = new URL('../scripts/lib/coordination-runtime/migration.mjs', import.meta.url).href;
  const storeUrl = new URL('../scripts/lib/coordination-runtime/store.mjs', import.meta.url).href;
  const code = `import {bindMigrationRepair,repairLegacyRecord} from ${JSON.stringify(migrationUrl)};
    import {openStore,closeStore} from ${JSON.stringify(storeUrl)};
    const store=openStore({path:process.argv[2],mode:'write'});
    try { bindMigrationRepair(store,{root:process.argv[1],roles:${JSON.stringify(roles)},verify:()=>true});
      const result=repairLegacyRecord(store,${JSON.stringify(request)}); console.log(result.ok?'ACCEPTED':'UNEXPECTED');
    } catch(e) { if(e.code!=='RECOVERY_REQUIRED') throw e; console.log(e.code); }
    finally {closeStore(store);}`;
  const compete = () => execFileSync(process.execPath, ['--input-type=module', '-e', code, root, dbPath(root)], {encoding: 'utf8'}).trim();
  let competed = false;
  boundary('renameSync', (original, from, to) => {
    if (resolve(to) === manifest(root)) {
      assert.equal(compete(), 'RECOVERY_REQUIRED');
      competed = true;
      return original(`${from}.missing`, to);
    }
    return original(from, to);
  }, () => assert.throws(() => rollbackMigration({root, confirm: true}), /ENOENT/));
  assert.equal(competed, true);
  assert.equal(compete(), 'ACCEPTED');
  assert.throws(() => rollbackMigration({root, confirm: true}), /new|runtime|changed/i);
  withStore(root, store => {
    assert.equal(readRecord(store, 'item', 'demo').version, 7);
    const event = JSON.parse(store.database.prepare("SELECT payload FROM events WHERE seq=2").get().payload);
    assert.equal(event.actor.runId, 'authorized-repair-run');
  });
}));

test('round1 recovery lock blocks repair after manifest activation until explicit recovery', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
  boundary('renameSync', (original, from, to) => {
    const result = original(from, to);
    if (resolve(to) === manifest(root)) original(`${from}.missing`, to);
    return result;
  }, () => assert.throws(() => migrateWorkspace({root, confirm: true, roles}), /ENOENT/));
  assert.equal(readManifest(root).schema_version, 4);
  withStore(root, store => {
    bindMigrationRepair(store, {root, roles, verify: () => true});
    assert.throws(() => repairLegacyRecord(store, repairRequest(store)), /offline|lock/i);
    assert.equal(canRollback(store), true);
  }, 'write');
  assert.equal(recoverMigration({root, confirm: true, action: 'activate'}).activated, true);
  withStore(root, store => {
    bindMigrationRepair(store, {root, roles, verify: () => true});
    assert.equal(repairLegacyRecord(store, repairRequest(store)).ok, true);
  }, 'write');
  assert.throws(() => rollbackMigration({root, confirm: true}), /new|runtime|changed/i);
}));

test('round1 ambiguous terminal source cannot be repaired as its first nonterminal declaration', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem('state: shipped\n').replace('state: proposed', 'state: ready'));
  migrated(root);
  withStore(root, store => {
    bindMigrationRepair(store, {root, roles, verify: () => true});
    assert.throws(() => repairLegacyRecord(store, repairRequest(store)), /ambiguous|history|unsupported/i);
    assert.equal(readRecord(store, 'item', 'demo'), null);
  }, 'write');
}));

test('round1 invalid UTF8 metadata does not invent a replacement-character identity', () => fixture(root => {
  const raw = Buffer.concat([Buffer.from('---\nid: '), Buffer.from([0xff]), Buffer.from('\n' + legacyItem().split('\n').slice(2).join('\n'))]);
  put(root, '.kai/state/items/demo.md', raw);
  migrated(root);
  withStore(root, store => {
    const source = readLegacyRecords(store).find(s => s.path === '.kai/state/items/demo.md');
    assert.equal(source.declaredId, null);
    assert.equal(source.status, 'quarantined');
    assert.deepEqual(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw, raw);
  });
}));

test('round1 repair cannot lose privacy checks when the manifest migration marker is removed', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
  migrated(root);
  withStore(root, store => {
    bindMigrationRepair(store, {root, roles, verify: () => true});
    const changed = readManifest(root);
    delete changed.coordination_migration;
    put(root, '.kai/manifest.json', JSON.stringify(changed));
    put(root, '.kai/personal/secret.md', 'private source');
    gitRun(root, ['add', '-f', '--', '.kai/personal/secret.md']);
    assert.throws(() => repairLegacyRecord(store, repairRequest(store)), /private|tracked|migration/i);
    assert.equal(readRecord(store, 'item', 'demo'), null);
  }, 'write');
}));

test('round1 ambiguous archived IDs reserve unresolved identities rather than only the first ID', () => fixture(root => {
  put(root, '.kai/archive/ambiguous.md', legacyItem('id: second-original\nstate: completed\n'));
  migrated(root);
  withStore(root, store => {
    const cmd = command('item.create', {recordId: 'second-original', actor: {role: 'operator', runId: 'new-run'},
      expectedVersion: 0, payload: {body: {...seedBody(), id: 'second-original'}}});
    assert.throws(() => applyCommand(store, cmd, authority(cmd.actor, 'item.create', {recordId: 'second-original', version: 0})),
      /legacy|quarantin|identity/i);
    assert.equal(readRecord(store, 'item', 'second-original'), null);
  }, 'write');
}));

function createItem(store, id) {
  const cmd = command('item.create', {recordId: id, actor: {role: 'operator', runId: 'fresh-scope-run'},
    expectedVersion: 0, payload: {body: {...seedBody(), id}}});
  return applyCommand(store, cmd, authority(cmd.actor, 'item.create', {recordId: id, version: 0}));
}

for (const identity of ['id: second-original', 'slug: second-original']) {
  test(`round2 oversized complete header preserves ambiguous ${identity} reservation`, () => fixture(root => {
    const initiative = identity.startsWith('slug');
    const path = initiative ? '.kai/state/initiatives/history/initiative.md' : '.kai/archive/old-work/closed.md';
    const raw = (initiative
      ? `---\nid: first-original\n${identity}\nstatus: completed\nversion: 9\n---\n`
      : legacyItem(`${identity}\n`).replace('id: demo\n', 'id: first-original\n')
        .replace('state: proposed', 'state: completed').replace('version: 7', 'version: 9')) + 'x'.repeat(70 * 1024);
    put(root, path, raw);
    migrated(root);
    withStore(root, store => {
      assert.throws(() => createItem(store, 'second-original'), /legacy|quarantin|identity/i);
      const source = readLegacyRecords(store).find(s => s.path === path);
      assert.equal(source.status, 'quarantined');
      assert.equal(source.parsed.identityUnresolved, true);
      assert.equal(source.parsed.metadataSupported, false);
      assert.equal(source.parsed.fields.version, '9');
      assert.equal(source.parsed.declaredState, 'completed');
      assert.ok(source.issues.some(i => /ambiguous/.test(i)));
      assert.equal(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw.toString(), raw);
      assert.equal(readRecord(store, 'item', 'second-original'), null);
      assert.equal(canRollback(store), true);
    }, 'write');
  }));
}

test('round2 oversized unambiguous complete header reserves only its original identity', () => fixture(root => {
  const path = '.kai/archive/old-work/closed.md';
  const raw = legacyItem().replace('id: demo\n', 'id: first-original\n').replace('state: proposed', 'state: completed')
    .replace('version: 7', 'version: 9') + 'x'.repeat(70 * 1024);
  put(root, path, raw);
  migrated(root);
  withStore(root, store => {
    assert.throws(() => createItem(store, 'first-original'), /legacy|quarantin|identity/i);
    const source = readLegacyRecords(store).find(s => s.path === path);
    assert.equal(source.declaredId, 'first-original');
    assert.notEqual(source.parsed.identityUnresolved, true);
    assert.equal(source.parsed.fields.version, '9');
    assert.equal(source.parsed.declaredState, 'completed');
    assert.equal(createItem(store, 'fresh-independent').recordVersion, 1);
    assert.equal(readRecord(store, 'item', 'fresh-independent').body.state, 'proposed');
  }, 'write');
}));

const invalidRepairManifests = [
  ['network', m => ({...m, network: true})],
  ['replicated', m => ({...m, storage: {replicated: true}})],
  ['filesystem', m => ({...m, filesystem: 'smb'})],
  ['storage mode', m => ({...m, storage_mode: 'unknown'})],
  ['workspace root', m => ({...m, workspace_root: '..'})],
  ['lane binding', m => ({...m, review: '.kai/other-review'})],
  ['project binding', m => ({...m, projects: [...m.projects, ...m.projects]})],
];
for (const phase of ['before repair', 'in verifier']) {
  test(`round2 full current repair admission ${phase} refuses manifest drift and preserves replay guard`, () => fixture(root => {
    put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
    migrated(root);
    withStore(root, store => {
      const original = fs.readFileSync(manifest(root));
      const request = repairRequest(store);
      for (const [label, change] of invalidRepairManifests) {
        const mutate = () => put(root, '.kai/manifest.json', JSON.stringify(change(JSON.parse(original))));
        bindMigrationRepair(store, {root, roles, verify: () => {
          if (phase === 'in verifier') mutate();
          return true;
        }});
        if (phase === 'before repair') mutate();
        if (phase === 'before repair') assert.ok(inspectRuntime(root).errors.length > 0, label);
        else assert.equal(inspectRuntime(root).errors.length, 0, label);
        assert.throws(() => repairLegacyRecord(store, request), /unsupported|network|binding|workspace_root/i, label);
        assert.equal(readRecord(store, 'item', 'demo'), null, label);
        assert.equal(store.database.prepare('SELECT max(seq) AS seq FROM events').get().seq, 1, label);
        assert.equal(store.database.prepare('SELECT count(*) AS n FROM operations').get().n, 0, label);
        const source = readLegacyRecords(store).find(s => s.sourceId === request.sourceId);
        assert.equal(source.status, 'quarantined', label);
        assert.equal(source.version, 1, label);
        fs.writeFileSync(manifest(root), original);
        assert.equal(canRollback(store), true, label);
      }
      bindMigrationRepair(store, {root, roles, verify: () => true});
      const receipt = repairLegacyRecord(store, request);
      assert.equal(receipt.eventSeq, 2);
      assert.equal(receipt.recordVersion, 7);
      for (const [label, change] of invalidRepairManifests) {
        put(root, '.kai/manifest.json', JSON.stringify(change(JSON.parse(original))));
        assert.throws(() => repairLegacyRecord(store, request), /unsupported|network|binding|workspace_root/i, `replay: ${label}`);
      }
      fs.writeFileSync(manifest(root), original);
      assert.deepEqual(repairLegacyRecord(store, request), receipt);
    }, 'write');
  }));
}

for (const phase of ['before repair', 'in verifier']) {
  test(`round2 full repair admission ${phase} rechecks external registry binding`, () => fixture(root => {
    const project = allocateTemporaryRoot('kai-coordination-migration-project-', repo);
    const priorHome = process.env.KAI_HOME;
    try {
      assertOutsideCheckout(project);
      gitRun(project, ['init', '--quiet']);
      process.env.KAI_HOME = join(root, 'home');
      put(root, '.kai/manifest.json', JSON.stringify({...readManifest(root), storage_mode: 'external', workspace_root: root,
        projects: [{id: 'project', path: project, publication_root: 'docs'}]}));
      const registry = {schema_version: 1, workspaces: [{
        project_root: project, workspace_root: root, workspace_id: 'migration-test-workspace',
      }]};
      put(root, 'home/workspaces.json', JSON.stringify(registry));
      put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
      migrated(root);
      withStore(root, store => {
        const request = repairRequest(store);
        const mutate = () => put(root, 'home/workspaces.json', JSON.stringify({...registry, workspaces: []}));
        bindMigrationRepair(store, {root, roles, verify: () => {
          if (phase === 'in verifier') mutate();
          return true;
        }});
        if (phase === 'before repair') mutate();
        assert.throws(() => repairLegacyRecord(store, request), /registry|binding/i);
        assert.ok(inspectRuntime(root).errors.some(e => /registry|binding/i.test(e)));
        assert.equal(readRecord(store, 'item', 'demo'), null);
        assert.equal(store.database.prepare('SELECT max(seq) AS seq FROM events').get().seq, 1);
        put(root, 'home/workspaces.json', JSON.stringify(registry));
        assert.equal(canRollback(store), true);
        bindMigrationRepair(store, {root, roles, verify: () => true});
        assert.equal(repairLegacyRecord(store, request).eventSeq, 2);
      }, 'write');
      assert.equal(fs.existsSync(join(project, '.kai')), false);
    } finally {
      if (priorHome === undefined) delete process.env.KAI_HOME;
      else process.env.KAI_HOME = priorHome;
      fs.rmSync(project, {recursive: true, force: true});
    }
  }, {mode: 'shared'}));
}

for (const missing of [true, false]) {
  test(`round2 collection comments retain ${missing ? 'missing' : 'valid'} references after column-zero comments`, () => fixture(root => {
    put(root, '.kai/archive/first.md', 'first input');
    if (!missing) put(root, '.kai/archive/second.md', 'second input');
    const raw = legacyItem().replace('context_artifacts: []', `context_artifacts:
  - .kai/archive/first.md
# comment does not end the collection
  # indented comment

  - .kai/archive/second.md`);
    put(root, '.kai/state/items/demo.md', raw);
    migrated(root);
    withStore(root, store => {
      const source = readLegacyRecords(store).find(s => s.declaredId === 'demo');
      if (missing) {
        assert.equal(source.status, 'quarantined');
        assert.ok(source.issues.some(i => /missing artifact: .*second.md/.test(i)));
        assert.equal(readRecord(store, 'item', 'demo'), null);
      } else {
        assert.equal(source.status, 'converted');
        assert.deepEqual(readRecord(store, 'item', 'demo').body.context_artifacts, ['.kai/archive/first.md', '.kai/archive/second.md']);
      }
      assert.equal(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw.toString(), raw);
    });
  }));
}

test('round2 collection comments retain complete map entries and nested initiative scope', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('review_requirements: []', `review_requirements:
  - role: eng-reviewer-code
# continue the same map
    kind: code
# continue the map list
  - role: eng-lead-architecture
    kind: architecture`));
  const path = '.kai/state/initiatives/demo-initiative/initiative.md';
  const original = fs.readFileSync(join(root, ...path.split('/')), 'utf8');
  put(root, path, original.replace('scope:\n  - migration runtime', `scope:
  current:
    - first scope
# scope continuation
    - second scope`).replace('milestones: []', `milestones:
  - id: first
    title: First milestone
# map continuation
    delivery_class: knowledge
    required_items: []
    status: active
# next milestone
  - id: second
    title: Second milestone
    delivery_class: knowledge
    required_items: []
    status: proposed`));
  migrated(root);
  withStore(root, store => {
    const item = readRecord(store, 'item', 'demo');
    assert.ok(item, 'supported comments must not prevent safe conversion');
    assert.deepEqual(item.body.review_requirements, [
      {role: 'eng-reviewer-code', kind: 'code'}, {role: 'eng-lead-architecture', kind: 'architecture'},
    ]);
    const initiative = readRecord(store, 'initiative', 'demo-initiative');
    assert.deepEqual(initiative.body.scope.current, ['first scope', 'second scope']);
    assert.deepEqual(initiative.body.milestones.map(m => m.id), ['first', 'second']);
  });
}));

test('round2 unsupported collection continuation after a comment cannot pass partial validation', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('touches: []', `touches:
  - existing.md
# not the end of the list
    missing: hidden.md`));
  migrated(root);
  withStore(root, store => {
    const source = readLegacyRecords(store).find(s => s.declaredId === 'demo');
    assert.equal(source.status, 'quarantined');
    assert.equal(source.parsed.metadataSupported, false);
    assert.equal(readRecord(store, 'item', 'demo'), null);
    bindMigrationRepair(store, {root, roles, verify: () => true});
    assert.throws(() => repairLegacyRecord(store, repairRequest(store)), /unsupported|ambiguous|history/i);
  }, 'write');
}));

function initiativeRepairBody() {
  return {schema_version: 1, id: 'demo-initiative', title: 'Fresh scope', status: 'active', owner: 'operator',
    scope: {current: ['explicit new scope']}, milestones: [], backlog: [],
    north_star_ref: '.kai/state/initiatives/demo-initiative/northstar.md', updated_at: stamp};
}

for (const [kind, declarations, declaredState] of [
  ['initiative', 'state: ready\nstatus: completed', 'completed'],
  ['initiative', 'status: active\nstate: completed', 'active'],
  ['initiative', 'status: active\nstatus: completed', 'active'],
  ['item', 'state: ready\nstatus: completed', 'ready'],
]) {
  for (const oversized of [false, true]) {
    test(`round2 ${kind} lifecycle ${JSON.stringify(declarations)} ${oversized ? 'oversized' : 'bounded'} cannot reopen`, () => fixture(root => {
      const path = kind === 'item' ? '.kai/state/items/demo.md' : '.kai/state/initiatives/demo-initiative/initiative.md';
      const before = fs.readFileSync(join(root, ...path.split('/')), 'utf8');
      const raw = before.replace(kind === 'item' ? 'state: proposed' : 'status: active', declarations)
        + (oversized ? 'x'.repeat(70 * 1024) : '');
      put(root, path, raw);
      migrated(root);
      withStore(root, store => {
        const source = readLegacyRecords(store).find(s => s.path === path);
        assert.equal(source.status, 'quarantined');
        bindMigrationRepair(store, {root, roles, verify: () => true});
        const request = {...repairRequest(store), sourceId: source.sourceId,
          body: kind === 'item' ? seedBody() : initiativeRepairBody()};
        assert.throws(() => repairLegacyRecord(store, request), /unsupported|ambiguous|history|historical|reopen/i);
        assert.equal(source.parsed.metadataSupported, false);
        assert.equal(source.parsed.declaredState, declaredState);
        assert.equal(source.parsed.terminalHistory, true);
        assert.equal(source.parsed.lifecycleAmbiguous, true);
        assert.equal(readRecord(store, kind, source.declaredId), null);
        assert.equal(readLegacyRecords(store, {sourceId: source.sourceId, includeRaw: true})[0].raw.toString(), raw);
        assert.equal(canRollback(store), true);
      }, 'write');
    }));
  }
}

test('round2 kind-specific nonterminal initiative history permits fresh repair but never target closure', () => fixture(root => {
  const path = '.kai/state/initiatives/demo-initiative/initiative.md';
  const before = fs.readFileSync(join(root, ...path.split('/')), 'utf8');
  put(root, path, before.replace('owner: operator', 'owner: missing-owner'));
  migrated(root);
  withStore(root, store => {
    const source = readLegacyRecords(store).find(s => s.path === path);
    assert.equal(source.parsed.declaredState, 'active');
    assert.equal(source.parsed.metadataSupported, true);
    bindMigrationRepair(store, {root, roles, verify: () => true});
    const request = {...repairRequest(store), sourceId: source.sourceId, body: initiativeRepairBody()};
    assert.throws(() => repairLegacyRecord(store, {...request, body: {...request.body, status: 'completed'}}), /closure|initiative|terminal/i);
    assert.throws(() => repairLegacyRecord(store, {...request, body: {...request.body,
      milestones: [{id: 'closed', title: 'No fabricated closure', delivery_class: 'knowledge', required_items: [], status: 'completed'}]}}),
    /closure|initiative|terminal/i);
    assert.equal(repairLegacyRecord(store, request).data.record.body.status, 'active');
    assert.equal(readLegacyRecords(store).find(s => s.sourceId === source.sourceId).parsed.declaredState, 'active');
  }, 'write');
}));

for (const kind of ['item', 'initiative']) {
  test(`round2 missing canonical ${kind} lifecycle is unsupported history rather than an alias`, () => fixture(root => {
    const path = kind === 'item' ? '.kai/state/items/demo.md' : '.kai/state/initiatives/demo-initiative/initiative.md';
    const before = fs.readFileSync(join(root, ...path.split('/')), 'utf8');
    put(root, path, before.replace(kind === 'item' ? 'state: proposed' : 'status: active',
      kind === 'item' ? 'status: completed' : 'state: completed'));
    migrated(root);
    withStore(root, store => {
      const source = readLegacyRecords(store).find(s => s.path === path);
      assert.equal(source.parsed.metadataSupported, false);
      assert.equal(source.parsed.declaredState, null);
      assert.equal(source.parsed.terminalHistory, true);
      assert.equal(source.status, 'quarantined');
      bindMigrationRepair(store, {root, roles, verify: () => true});
      assert.throws(() => repairLegacyRecord(store, {...repairRequest(store), sourceId: source.sourceId,
        body: kind === 'item' ? seedBody() : initiativeRepairBody()}), /unsupported|ambiguous|history/i);
      assert.equal(readRecord(store, kind, source.declaredId), null);
    }, 'write');
  }));
}

test('round2 matching nonterminal lifecycle declarations remain safely convertible', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem('status: proposed\n'));
  const path = '.kai/state/initiatives/demo-initiative/initiative.md';
  const before = fs.readFileSync(join(root, ...path.split('/')), 'utf8');
  put(root, path, before.replace('status: active', 'status: active\nstate: active'));
  migrated(root);
  withStore(root, store => {
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'proposed');
    assert.equal(readRecord(store, 'initiative', 'demo-initiative').body.status, 'active');
  });
}));

test('Task10A repair accepts a registered cross-item design as context without treating it as verdict evidence', () => fixture(root => {
  put(root, '.kai/state/items/demo.md', legacyItem().replace('state: proposed', 'state: ready'));
  migrated(root);
  withStore(root, store => {
    const actor = {role: 'eng-builder-software', runId: 'design-producer'};
    const path = '.kai/state/brief.md';
    put(root, path, 'Cross-item design revision');
    const subject = hashArtifact({root, relativePath: path});
    seedItem(store, {id: 'design', state: 'in-review', producer_actor: actor,
      acceptance_actor: null, change_ref: subject, artifact_targets: [path]});
    const artifactId = randomUUID();
    bindEvidenceRuntime(store, {root, authority: authority(actor, 'artifact.register', {recordId: 'design'}),
      runs: [{actor, directory: '.kai/runs/design-producer'}]});
    registerArtifact(store, command('artifact.register', {
      recordId: 'design', actor, payload: {artifactId, assetId: randomUUID(), subject,
        projectId: null, classification: 'internal', mediaType: 'text/markdown', title: 'Design',
        inputAssetIds: [], at: stamp},
    }));
    const request = repairRequest(store);
    request.body.context_artifacts = [`artifact:${artifactId}`];
    // Synthetic operator decision at the existing trusted test seam.
    bindMigrationRepair(store, {root, roles, verify: () => true});
    assert.equal(repairLegacyRecord(store, request).ok, true);
    assert.deepEqual(readRecord(store, 'item', 'demo').body.context_artifacts, [`artifact:${artifactId}`]);
  }, 'write');
}));
