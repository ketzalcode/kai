import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, join} from 'node:path';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  parseArguments,
  runCLI,
} from '../src/core/coordinate.mjs';
import {
  subjectRef,
  validateRecord,
} from '../src/core/lib/coordination-runtime/contract.mjs';
import {
  closeStore,
  openStore,
  readRecord,
} from '../src/core/lib/coordination-runtime/store.mjs';
import {
  fixtureIds,
  seedRecord,
  seedTask,
} from './helpers/coordination-runtime-fixture.mjs';

const checkout = join(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(checkout, 'src', 'core', 'coordinate.mjs');
const scratch = join(checkout, '.superpowers', 'cli-tests');
const NOW = '2026-10-06T18:00:00.000Z';
const DIRECTION = [
  '# Vision',
  'A composable workspace.',
  '',
  '# Mission',
  'Coordinate exact work safely.',
  '',
  '# Current Goal',
  'Exercise Task runtime behavior.',
  '',
  '# Out of Scope',
  'Schema 5 workspace activation remains deferred.',
  '',
].join('\n');
const roles = [
  'eng-lead-architecture',
  'eng-builder-software',
  'eng-reviewer-code',
  'eng-reviewer-quality',
  'workflow-ship',
];

function caseAlias(path) {
  if (process.platform !== 'win32') return null;
  const upper = path.toUpperCase();
  if (upper !== path) return upper;
  const lower = path.toLowerCase();
  return lower !== path ? lower : null;
}

mkdirSync(scratch, {recursive: true});

async function workspace(run, {schema = 5, createStore = false} = {}) {
  const root = mkdtempSync(join(scratch, 'case-'));
  spawnSync('git', ['init', '--quiet', root], {windowsHide: true});
  writeFileSync(join(root, '.gitignore'), '/.kai/\n');
  const runtimeRoot = schema === 5
    ? join(root, '.kai', 'core', 'runtime')
    : join(root, '.kai', 'state');
  mkdirSync(runtimeRoot, {recursive: true});
  mkdirSync(join(root, 'docs', 'kai'), {recursive: true});
  writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), DIRECTION);
  const common = {
    plugin: 'kai-core',
    version: 'test',
    schema_version: schema,
    scaffolded: NOW,
    workspace_id: `cli-${randomUUID()}`,
    workspace_root: '.',
    projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
  };
  const manifest = schema === 5
    ? {
      ...common,
      placement: 'repo-local',
      private_root: '.kai',
      direction: 'docs/kai/DIRECTION.md',
    }
    : {
      ...common,
      storage_mode: 'repo-local',
      state: '.kai/state',
      runs: '.kai/runs',
      review: '.kai/review',
      archive: '.kai/archive',
      personal: '.kai/personal',
      areas: [],
    };
  writeFileSync(join(root, '.kai', 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  let store = null;
  if (createStore) {
    store = openStore({
      path: join(runtimeRoot, 'coordination.sqlite'),
      mode: 'create',
    });
  }
  try {
    return await run({root, store});
  } finally {
    closeStore(store);
    rmSync(root, {recursive: true, force: true});
  }
}

function host(overrides = {}) {
  const calls = {claim: [], plan: 0};
  return {
    calls,
    async capabilities() {
      return {
        discovery: {
          roster: roles.map(role => ({id: `fixture:${role}`, role, model: null})),
        },
      };
    },
    async claim(input) {
      calls.claim.push(input);
      return {claimed: input.options.task};
    },
    async plan() {
      calls.plan += 1;
      throw new Error('CLI plan must not call host dispatch planning');
    },
    async apply() {
      throw new Error('unexpected mutation');
    },
    ...overrides,
  };
}

function appendMessage(store, task) {
  const messageId = randomUUID();
  const subject = {kind: 'task', id: task.id};
  const message = validateRecord({
    kind: 'message',
    id: messageId,
    subject,
    version: 1,
    body: {
      schema_version: 1,
      message_id: messageId,
      subject,
      thread_id: subjectRef(subject, task.version),
      parent_id: null,
      sender_role: 'eng-builder-software',
      sender_run: 'cli-message-run',
      recipient: 'eng-reviewer-code',
      kind: 'handoff',
      created_at: NOW,
      basis_version: task.version,
      payload: {
        did: 'Prepared typed CLI context.',
        needs: 'Review the bounded projection.',
        assetState: 'none',
        authority: 'eng-reviewer-code',
        revalidation: 'Required after a Task revision.',
        questions: [],
      },
      artifact_refs: [],
      evidence_refs: [],
      provenance: 'durable-thread',
    },
  });
  seedRecord(store, message);
  store.database.prepare(`
    INSERT INTO events (operation_id, subject_kind, subject_id, payload)
    VALUES (?, ?, ?, ?)
  `).run(`message-${messageId}`, subject.kind, subject.id, JSON.stringify({
    kind: 'task.handoff',
    actor: {role: message.body.sender_role, runId: message.body.sender_run},
    recordKind: subject.kind,
    recordId: subject.id,
    payload: {messageId},
  }));
  return messageId;
}

test('read-only inspect reports schema without creating a missing database', async () =>
  workspace(async ({root}) => {
    const result = await runCLI(['inspect', '--root', root]);
    assert.equal(result.exitCode, 0);
    assert.equal(result.result.schemaVersion, 5);
    assert.equal(result.result.storeExists, false);
    assert.equal(existsSync(join(root, '.kai', 'core', 'runtime', 'coordination.sqlite')), false);
  }, {schema: 5}));

test('strict parser rejects unknown flags, malformed identities, and every old --item selector', () => {
  for (const argv of [
    ['init'],
    ['apply', '--operator'],
    ['context', '--kind', 'feature', '--id', fixtureIds.task],
    ['context', '--kind', 'unknown', '--id', fixtureIds.task],
    ['claim', '--item', fixtureIds.task],
    ['plan', '--item', fixtureIds.task],
    ['context', '--item', fixtureIds.task],
    ['detail', '--kind', 'item', '--id', 'demo'],
  ]) {
    assert.throws(() => parseArguments(argv), error => error.code === 'INVALID_INPUT');
  }
  assert.deepEqual(parseArguments(['claim', '--task', fixtureIds.task]), {
    verb: 'claim',
    options: {task: fixtureIds.task},
  });
  assert.deepEqual(parseArguments([
    'plan',
    '--kind',
    'feature',
    '--id',
    fixtureIds.feature,
  ]), {
    verb: 'plan',
    options: {kind: 'feature', id: fixtureIds.feature},
  });
});

test('schema 3 and 4 remain inspect/status-only and every write is SCHEMA_MISMATCH', async () => {
  for (const schema of [3, 4]) {
    await workspace(async ({root, store}) => {
      if (store) {
        seedTask(store, {
          state: 'ready',
          producer_actor: null,
          producing_actors: [],
          acceptance_actor: null,
        });
        closeStore(store);
      }
      for (const argv of [
        ['apply', '--root', root],
        ['request', '--root', root],
        ['claim', '--root', root, '--task', fixtureIds.task],
      ]) {
        const input = argv[0] === 'apply'
          ? '{}'
          : argv[0] === 'request'
            ? JSON.stringify({type: 'maintenance', action: 'init'})
            : undefined;
        const result = await runCLI(argv, {input});
        assert.equal(result.exitCode, 1, `${schema}: ${argv[0]}`);
        assert.equal(result.result.code, 'SCHEMA_MISMATCH', `${schema}: ${argv[0]}`);
      }
      const inspect = await runCLI(['inspect', '--root', root]);
      const status = await runCLI(['status', '--root', root]);
      assert.equal(inspect.exitCode, 0, `${schema}: inspect`);
      assert.equal(status.exitCode, 0, `${schema}: status`);
      assert.equal(existsSync(join(root, '.kai', 'core', 'runtime', 'coordination.sqlite')), false);
    }, {schema, createStore: schema === 4});
  }

  const direct = await runCLI(['direct']);
  assert.equal(direct.exitCode, 0);
  assert.equal(direct.result.coordinationRequired, false);
});

test('native maintenance cannot initialize or leave host authorization state before activation', async () =>
  workspace(async ({root}) => {
    const result = await runCLI(['request', '--root', root], {
      input: JSON.stringify({type: 'maintenance', action: 'init'}),
      env: {...process.env, COPILOT_AGENT_SESSION_ID: randomUUID()},
    });
    assert.equal(result.exitCode, 1);
    assert.equal(result.result.code, 'INVALID_INPUT');
    assert.equal(existsSync(join(root, '.kai', 'core', 'runtime', 'host')), false);
    assert.equal(existsSync(join(root, '.kai', 'core', 'runtime', 'coordination.sqlite')), false);
  }, {schema: 5}));

test('schema-5 writes accept Windows case aliases that resolve to the live workspace', async () => {
  if (process.platform !== 'win32') return;
  await workspace(async ({root, store}) => {
    seedTask(store, {
      state: 'ready',
      producer_actor: null,
      producing_actors: [],
      acceptance_actor: null,
    });
    closeStore(store);
    const aliasedRoot = caseAlias(root);
    assert.ok(aliasedRoot && aliasedRoot !== root);
    const result = await runCLI(['claim', '--root', aliasedRoot, '--task', fixtureIds.task], {
      host: host(),
    });
    assert.equal(result.exitCode, 0);
    assert.equal(result.result.claimed, fixtureIds.task);
  }, {schema: 5, createStore: true});
});

test('typed status, context, detail, messages, export, and plan share the hierarchy surface', async () =>
  workspace(async ({root, store}) => {
    const task = seedTask(store, {
      state: 'ready',
      producer_actor: null,
      producing_actors: [],
      acceptance_actor: null,
    });
    const messageId = appendMessage(store, task);
    const selectedHost = host();
    const before = {
      task: structuredClone(readRecord(store, 'task', fixtureIds.task)),
      events: Number(store.database.prepare('SELECT COUNT(*) AS count FROM events').get().count),
      changes: store.database.prepare('SELECT total_changes() AS count').get().count,
    };
    closeStore(store);

    const status = await runCLI(['status', '--root', root], {host: selectedHost});
    assert.equal(status.exitCode, 0, JSON.stringify(status.result));
    assert.equal(status.result.status.goal.text, 'Exercise Task runtime behavior.');
    assert.equal(status.result.status.epics[0].packs[0].features[0].requirements[0].tasks[0].id,
      fixtureIds.task);

    const context = await runCLI([
      'context',
      '--root',
      root,
      '--kind',
      'task',
      '--id',
      fixtureIds.task,
    ], {host: selectedHost});
    assert.equal(context.exitCode, 0);
    const packet = JSON.parse(context.result.context.text);
    assert.equal(packet.selected_record.id, fixtureIds.task);
    assert.deepEqual(packet.ancestors.map(record => record.kind), [
      'epic',
      'feature',
      'requirement',
    ]);
    assert.equal(packet.recent_messages[0].ref, `message:${messageId}`);

    const detail = await runCLI([
      'detail',
      '--root',
      root,
      '--kind',
      'task',
      '--id',
      fixtureIds.task,
    ]);
    assert.equal(detail.exitCode, 0);
    assert.equal(detail.result.record.id, fixtureIds.task);

    const messages = await runCLI([
      'messages',
      '--root',
      root,
      '--kind',
      'task',
      '--id',
      fixtureIds.task,
      '--limit',
      '10',
    ]);
    assert.equal(messages.exitCode, 0);
    assert.deepEqual(messages.result.messages.map(message => message.id), [messageId]);

    const exported = await runCLI([
      'export',
      '--root',
      root,
      '--kind',
      'task',
      '--id',
      fixtureIds.task,
    ]);
    assert.equal(exported.exitCode, 0);
    assert.equal(exported.result.report.subject.id, fixtureIds.task);
    assert.equal(existsSync(join(root, '.kai', 'review', 'coordination')), false);

    const plan = await runCLI([
      'plan',
      '--root',
      root,
      '--kind',
      'feature',
      '--id',
      fixtureIds.feature,
    ], {host: selectedHost});
    assert.equal(plan.exitCode, 0);
    assert.equal(plan.result.automatic, false);
    assert.deepEqual(plan.result.tasks.map(entry => entry.id), [fixtureIds.task], JSON.stringify(plan.result));
    assert.equal(selectedHost.calls.plan, 0);

    const verify = openStore({
      path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'read',
    });
    try {
      assert.deepEqual(readRecord(verify, 'task', fixtureIds.task), before.task);
      assert.equal(Number(verify.database.prepare(
        'SELECT COUNT(*) AS count FROM events',
      ).get().count), before.events);
      assert.equal(verify.database.prepare(
        'SELECT total_changes() AS count',
      ).get().count, 0);
    } finally {
      closeStore(verify);
    }
  }, {schema: 5, createStore: true}));

test('claim accepts only --task and forwards the exact typed Task without changing it', async () =>
  workspace(async ({root, store}) => {
    const task = seedTask(store, {
      state: 'ready',
      producer_actor: null,
      producing_actors: [],
      acceptance_actor: null,
    });
    closeStore(store);
    const selectedHost = host();
    const result = await runCLI([
      'claim',
      '--root',
      root,
      '--task',
      fixtureIds.task,
    ], {host: selectedHost});
    assert.equal(result.exitCode, 0);
    assert.equal(result.result.claimed, fixtureIds.task);
    assert.equal(selectedHost.calls.claim.length, 1);
    assert.equal(selectedHost.calls.claim[0].options.task, fixtureIds.task);

    const verify = openStore({
      path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'read',
    });
    try {
      assert.deepEqual(readRecord(verify, 'task', fixtureIds.task), task);
    } finally {
      closeStore(verify);
    }
  }, {schema: 5, createStore: true}));

test('context limits and typed read errors are returned as INVALID_INPUT JSON', async () =>
  workspace(async ({root, store}) => {
    seedTask(store);
    closeStore(store);
    for (const argv of [
      ['context', '--root', root, '--kind', 'feature', '--id', fixtureIds.task],
      ['context', '--root', root, '--kind', 'task', '--id', fixtureIds.task, '--max-bytes', '24577'],
      ['messages', '--root', root, '--kind', 'requirement', '--id', fixtureIds.task],
      ['plan', '--root', root, '--kind', 'epic', '--id', fixtureIds.feature],
    ]) {
      const result = await runCLI(argv, {host: host()});
      assert.equal(result.exitCode, 1);
      assert.equal(result.result.code, 'INVALID_INPUT');
    }
  }, {schema: 5, createStore: true}));

test('ordinary inspect validates the existing SQLite schema and reports Task count', async () =>
  workspace(async ({root, store}) => {
    seedTask(store);
    closeStore(store);
    const good = await runCLI(['inspect', '--root', root]);
    assert.equal(good.exitCode, 0);
    assert.equal(good.result.runtime.taskCount, 1);

    const writable = openStore({
      path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
      mode: 'write',
    });
    writable.database.prepare(
      "UPDATE metadata SET value = '99' WHERE key = 'schema_version'",
    ).run();
    closeStore(writable);
    const unsupported = await runCLI(['inspect', '--root', root]);
    assert.equal(unsupported.exitCode, 1);
    assert.equal(unsupported.result.code, 'SCHEMA_MISMATCH');
  }, {schema: 5, createStore: true}));

test('SQLite-disabled process is a precise host gap', () =>
  workspace(({root}) => {
    const result = spawnSync(process.execPath, [
      '--no-experimental-sqlite',
      cli,
      'inspect',
      '--root',
      root,
    ], {encoding: 'utf8'});
    assert.equal(result.status, 1);
    assert.equal(JSON.parse(result.stdout).code, 'UNSUPPORTED_HOST');
  }, {schema: 5}));
