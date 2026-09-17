import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {
  readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import {dirname, isAbsolute, join, relative, sep} from 'node:path';
import test from 'node:test';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';
import {
  COMMAND_KINDS,
  RECORD_KINDS,
  RuntimeError,
  canonicalJson,
  commandDigest,
  validateCommand,
  validateRecord,
} from '../scripts/lib/coordination-runtime/contract.mjs';
import {
  applyOperation,
  closeStore,
  listRecords,
  openStore,
  readRecord,
} from '../scripts/lib/coordination-runtime/store.mjs';
import {
  allocateTemporaryRoot,
  command,
  seedItem,
  withWorkspace,
} from './helpers/coordination-runtime-fixture.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function questionBody(id, ask) {
  return {
    schema_version: 1,
    question_id: id,
    item_id: 'demo',
    asker: {role: 'eng-builder-software', runId: 'builder-run'},
    recipient: 'eng-reviewer-code',
    kind: 'fact',
    blocking: false,
    status: 'open',
    context: 'Store transaction coverage.',
    ask,
    answer_by: 'next-dispatch',
    opened_message_id: '00000000-0000-4000-8000-000000000099',
    answer_message_ids: [],
    resolution: null,
  };
}

function allocatedCase(prefix, fn) {
  const root = allocateTemporaryRoot(`kai-coordination-${prefix}-`, repoRoot);
  try {
    return fn(root);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
}

function assertOutsideCheckout(root) {
  const pathFromCheckout = relative(repoRoot, root);
  assert.ok(
    pathFromCheckout === '..'
      || pathFromCheckout.startsWith(`..${sep}`)
      || isAbsolute(pathFromCheckout),
    `allocated root must be outside checkout: ${root}`,
  );
}

await test('runtime workspace fixture allocates outside the checkout', async () => {
  await withWorkspace(({root}) => {
    assertOutsideCheckout(root);
  });
});

await test('store case fixture allocates outside the checkout', () => {
  allocatedCase('location', root => {
    assertOutsideCheckout(root);
  });
});

await test('temporary root allocator refuses OS temp inside the checkout', () => {
  const previousTemp = process.env.TEMP;
  const previousTmp = process.env.TMP;
  let allocatedRoot;
  process.env.TEMP = repoRoot;
  process.env.TMP = repoRoot;
  try {
    assert.throws(
      () => {
        allocatedRoot = allocateTemporaryRoot(
          'kai-coordination-refused-location-',
          repoRoot,
        );
      },
      /OS temporary directory must be outside checkout/,
    );
  } finally {
    if (allocatedRoot) rmSync(allocatedRoot, {recursive: true, force: true});
    if (previousTemp === undefined) delete process.env.TEMP;
    else process.env.TEMP = previousTemp;
    if (previousTmp === undefined) delete process.env.TMP;
    else process.env.TMP = previousTmp;
  }
});

function waitForMessage(child, expected) {
  return new Promise((resolve, reject) => {
    let received = false;
    const onMessage = message => {
      if (message === expected) {
        received = true;
        child.off('message', onMessage);
        resolve();
      }
    };
    child.on('message', onMessage);
    child.once('error', reject);
    child.once('exit', code => {
      if (!received) {
        reject(new Error(`lock holder exited ${code} before ${expected}`));
      }
    });
  });
}

function waitForExit(child) {
  return new Promise((resolve, reject) => {
    child.once('error', reject);
    child.once('exit', code => code === 0
      ? resolve()
      : reject(new Error(`child exited ${code}`)));
  });
}

async function withChildLock(databasePath, begin, fn) {
  const storeModule = pathToFileURL(join(
    repoRoot,
    'scripts',
    'lib',
    'coordination-runtime',
    'store.mjs',
  )).href;
  const holderSource = `
    import {closeStore, openStore} from ${JSON.stringify(storeModule)};
    const store = openStore({path: process.argv[1], mode: 'write'});
    store.database.exec(${JSON.stringify(begin)});
    process.send('LOCKED');
    process.on('message', message => {
      if (message !== 'RELEASE') return;
      store.database.exec('ROLLBACK');
      closeStore(store);
      process.send('RELEASED', () => process.disconnect());
    });
  `;
  const holder = spawn(process.execPath, [
    '--input-type=module',
    '--eval',
    holderSource,
    databasePath,
  ], {
    stdio: ['ignore', 'ignore', 'inherit', 'ipc'],
  });
  const holderExit = waitForExit(holder);
  await waitForMessage(holder, 'LOCKED');
  try {
    return await fn();
  } finally {
    const released = waitForMessage(holder, 'RELEASED');
    holder.send('RELEASE');
    await released;
    await holderExit;
  }
}

assert.equal(
  canonicalJson({z: 1, nested: {b: true, a: null}, list: [3, 2, 1]}),
  '{"list":[3,2,1],"nested":{"a":null,"b":true},"z":1}',
);
assert.equal(
  commandDigest(command('item.update', {
    operationId: '00000000-0000-4000-8000-000000000001',
    payload: {title: 'Revised'},
  })),
  commandDigest(command('item.update', {
    operationId: '00000000-0000-4000-8000-000000000001',
    payload: {title: 'Revised'},
  })),
);
assert.throws(() => canonicalJson({bad: Number.NaN}), error =>
  error instanceof RuntimeError && error.code === 'INVALID_INPUT');
const cyclic = {};
cyclic.self = cyclic;
assert.throws(() => canonicalJson(cyclic), error =>
  error instanceof RuntimeError && error.code === 'INVALID_INPUT');
assert.throws(() => canonicalJson({bad: undefined}), error =>
  error instanceof RuntimeError && error.code === 'INVALID_INPUT');

assert.ok(COMMAND_KINDS.has('item.update'));
assert.ok(RECORD_KINDS.has('item'));
assert.throws(() => validateCommand(command('unknown.command')), error =>
  error.code === 'INVALID_INPUT');
assert.throws(() => validateCommand(command('item.update', {
  payload: {state: 'shipped'},
})), error => error.code === 'INVALID_INPUT');
assert.throws(() => validateCommand({
  ...command('item.update', {payload: {title: 'Valid'}}),
  authority: {roles: ['operator']},
}), error => error.code === 'INVALID_INPUT');
assert.throws(() => validateRecord({
  kind: 'item',
  id: 'demo',
  itemId: 'demo',
  version: 1,
  body: [],
}), error => error.code === 'INVALID_INPUT');

await withWorkspace(({store}) => {
  seedItem(store);
  assert.deepEqual(
    store.database.prepare('SELECT key, value FROM metadata ORDER BY key').all()
      .map(({key, value}) => ({key, value})),
    [
      {key: 'message_schema_version', value: '1'},
      {key: 'schema_version', value: '1'},
    ],
  );
  const op = command('item.update', {payload: {title: 'Revised'}});
  const mutate = current => ({...current.body, title: 'Revised'});
  const first = applyOperation(store, op, mutate);
  assert.deepEqual(applyOperation(store, op, mutate), first);
  assert.equal(first.recordVersion, 2);
  assert.equal(readRecord(store, 'item', 'demo').version, 2);
  assert.throws(() => applyOperation(store,
    {...op, payload: {title: 'Different'}}, mutate),
  error => error.code === 'OPERATION_CONFLICT');
  assert.throws(() => applyOperation(store,
    command('item.update', {
      expectedVersion: 1,
      payload: {title: 'Stale'},
    }), mutate),
  error => error.code === 'VERSION_CONFLICT');
});

await withWorkspace(({store}) => {
  seedItem(store);
  assert.throws(() => applyOperation(
    store,
    command('item.update', {payload: {title: 'Allowed'}}),
    current => ({...current.body, title: 'Allowed', state: 'shipped'}),
  ), error => error.code === 'INVALID_INPUT');
  assert.equal(readRecord(store, 'item', 'demo').body.state, 'completed');
  assert.throws(() => readRecord(store, 'unknown', 'demo'), error =>
    error.code === 'INVALID_INPUT');
  assert.throws(() => listRecords(store, {kind: 'unknown', itemId: 'demo'}), error =>
    error.code === 'INVALID_INPUT');
});

await test('mutation cannot rewrite the primary validation baseline', async () => {
  await withWorkspace(({store}) => {
    seedItem(store);
    assert.throws(() => applyOperation(
      store,
      command('item.update', {payload: {title: 'Allowed'}}),
      current => {
        current.body.state = 'shipped';
        return {...current.body, title: 'Allowed'};
      },
    ), error => error.code === 'INVALID_INPUT');
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'completed');
  });
});

await test('mutation cannot change the command after its digest is computed', async () => {
  await withWorkspace(({store}) => {
    seedItem(store);
    const operation = command('item.update', {payload: {title: 'Original'}});
    assert.throws(() => applyOperation(store, operation, current => {
      operation.payload.title = 'Injected';
      return {...current.body, title: 'Injected'};
    }), error => error.code === 'INVALID_INPUT');
    assert.equal(readRecord(store, 'item', 'demo').body.title, 'Demo knowledge item');
    operation.payload.title = 'Original';
    const result = applyOperation(
      store,
      operation,
      current => ({...current.body, title: 'Original'}),
    );
    assert.equal(result.data.record.body.title, 'Original');
  });
});

await test('callback lock-shaped errors remain callback errors', async () => {
  await withWorkspace(({store}) => {
    seedItem(store);
    const callbackError = new Error('database is locked');
    callbackError.code = 'ERR_SQLITE_ERROR';
    callbackError.errcode = 5;
    assert.throws(() => applyOperation(
      store,
      command('item.update', {payload: {title: 'Not written'}}),
      () => {
        throw callbackError;
      },
    ), error => error === callbackError);
  });
});

await withWorkspace(({store}) => {
  seedItem(store);
  let escapedTransaction;
  applyOperation(
    store,
    command('item.update', {payload: {title: 'Scoped transaction'}}),
    (current, tx) => {
      escapedTransaction = tx;
      return {...current.body, title: 'Scoped transaction'};
    },
  );
  assert.throws(() => escapedTransaction.appendEvent({kind: 'too-late'}), error =>
    error.code === 'INVALID_INPUT');
});

await withWorkspace(({root, store}) => {
  seedItem(store);
  const operation = command('item.update', {payload: {title: 'Persisted'}});
  const result = applyOperation(store, operation, (current, tx) => {
    tx.put({
      kind: 'question',
      id: 'question-1',
      itemId: 'demo',
      version: 1,
      body: questionBody('question-1', 'Persisted?'),
    });
    tx.appendEvent({kind: 'item.updated', title: 'Persisted'});
    return {...current.body, title: 'Persisted'};
  });
  assert.ok(result.eventSeq > 0);
  assert.equal(listRecords(store, {kind: 'question', itemId: 'demo'}).length, 1);
  closeStore(store);

  const reopened = openStore({
    path: join(root, '.kai', 'state', 'coordination.sqlite'),
    mode: 'write',
  });
  try {
    assert.equal(readRecord(reopened, 'item', 'demo').body.title, 'Persisted');
    assert.equal(readRecord(reopened, 'question', 'question-1').version, 1);
    assert.deepEqual(applyOperation(reopened, operation, () => {
      throw new Error('replay must not call mutate');
    }), result);
  } finally {
    closeStore(reopened);
  }
});

await withWorkspace(({store}) => {
  seedItem(store);
  const beforeEvents = store.database.prepare('SELECT count(*) AS count FROM events').get().count;
  const failed = command('item.update', {payload: {title: 'Rolled back'}});
  assert.throws(() => applyOperation(store, failed, (current, tx) => {
    tx.put({
      kind: 'question',
      id: 'rolled-back-question',
      itemId: 'demo',
      version: 1,
      body: questionBody('rolled-back-question', 'Must disappear'),
    });
    tx.appendEvent({kind: 'must.rollback'});
    throw new Error('mutation failed');
  }), /mutation failed/);
  assert.equal(readRecord(store, 'item', 'demo').body.title, 'Demo knowledge item');
  assert.equal(readRecord(store, 'question', 'rolled-back-question'), null);
  assert.equal(
    store.database.prepare('SELECT count(*) AS count FROM events').get().count,
    beforeEvents,
  );
  assert.equal(
    store.database.prepare('SELECT count(*) AS count FROM operations WHERE id = ?')
      .get(failed.operationId).count,
    0,
  );
});

await withWorkspace(({root, store}) => {
  seedItem(store);
  closeStore(store);
  const readOnly = openStore({
    path: join(root, '.kai', 'state', 'coordination.sqlite'),
    mode: 'read',
  });
  try {
    assert.equal(readRecord(readOnly, 'item', 'demo').version, 1);
    assert.throws(() => applyOperation(
      readOnly,
      command('item.update', {payload: {title: 'Denied'}}),
      current => ({...current.body, title: 'Denied'}),
    ), error => error.code === 'INVALID_INPUT');
  } finally {
    closeStore(readOnly);
  }
});

await withWorkspace(({store}) => {
  store.database.prepare(`
    INSERT INTO records (kind, id, item_id, version, body)
    VALUES ('item', 'malformed', 'malformed', 1, '[]')
  `).run();
  assert.throws(() => readRecord(store, 'item', 'malformed'), error =>
    error.code === 'RECOVERY_REQUIRED');
});

allocatedCase('schema', root => {
  const path = join(root, 'coordination.sqlite');
  const store = openStore({path, mode: 'create'});
  closeStore(store);
  const raw = new DatabaseSync(path);
  raw.prepare("UPDATE metadata SET value = '999' WHERE key = 'schema_version'").run();
  raw.close();
  assert.throws(() => openStore({path, mode: 'write'}), error =>
    error.code === 'SCHEMA_MISMATCH');
});

await test('open rejects a schema missing its required index', () => {
  allocatedCase('schema-index', root => {
    const path = join(root, 'coordination.sqlite');
    const store = openStore({path, mode: 'create'});
    store.database.exec('DROP INDEX records_by_item');
    closeStore(store);
    let reopened;
    try {
      assert.throws(() => {
        reopened = openStore({path, mode: 'write'});
      }, error => error.code === 'RECOVERY_REQUIRED');
    } finally {
      closeStore(reopened);
    }
  });
});

await test('v1 indexed chronology is physical schema, never an implicit read/write migration', () => {
  const objects = [
    ['index', 'events_by_thread'],
    ['index', 'events_by_message'],
    ['index', 'events_by_item_kind'],
    ['index', 'events_by_approval'],
    ['index', 'records_by_question_status'],
    ['index', 'records_by_criteria'],
    ['trigger', 'events_capture_thread'],
    ['trigger', 'messages_capture_thread'],
    ['trigger', 'messages_update_thread'],
  ];
  for (const [type, name] of objects) {
    allocatedCase('schema-chronology', root => {
      const path = join(root, 'coordination.sqlite');
      const store = openStore({path, mode: 'create'});
      try {
        const definition = store.database.prepare(
          'SELECT sql FROM sqlite_master WHERE type = ? AND name = ?',
        ).get(type, name);
        assert.ok(definition, `missing required ${type} ${name}`);
        store.database.exec(`DROP ${type} ${name}`);
      } finally {
        closeStore(store);
      }
      const before = readFileSync(path);
      for (const mode of ['read', 'write', 'create']) {
        assert.throws(() => openStore({path, mode}), error => error.code === 'RECOVERY_REQUIRED');
        assert.deepEqual(readFileSync(path), before, `${mode} must not recreate ${name}`);
      }
    });
  }
});

await test('v1 rejects replaced chronology indexes, triggers and generated-column expressions', () => {
  const changeMessagePath = path => database => {
    const schema = database.prepare(`
      SELECT type, name, sql FROM sqlite_master
      WHERE (tbl_name = 'events' AND sql IS NOT NULL) OR type = 'trigger'
    `).all();
    for (const entry of schema.filter(entry => entry.type === 'trigger')) {
      database.exec(`DROP TRIGGER ${entry.name}`);
    }
    database.exec('DROP TABLE events');
    const table = schema.find(entry => entry.type === 'table');
    database.exec(table.sql.replaceAll('$.payload.messageId', path));
    for (const entry of schema.filter(entry => entry.type !== 'table')) {
      database.exec(entry.sql);
    }
  };
  for (const sabotage of [
    'DROP INDEX events_by_thread; CREATE INDEX events_by_thread ON events(seq)',
    `DROP TRIGGER events_capture_thread;
     CREATE TRIGGER events_capture_thread AFTER INSERT ON events BEGIN SELECT 1; END`,
    changeMessagePath('$.payload.wrongId'),
    changeMessagePath('$.payload.messageid'),
  ]) {
    allocatedCase('schema-chronology-definition', root => {
      const path = join(root, 'coordination.sqlite');
      const store = openStore({path, mode: 'create'});
      try {
        assert.ok(store.database.prepare('PRAGMA table_xinfo(events)').all()
          .some(column => column.name === 'message_id' && column.hidden === 3),
        'chronology identity must be derived from the stored event');
        if (typeof sabotage === 'function') sabotage(store.database);
        else store.database.exec(sabotage);
      } finally {
        closeStore(store);
      }
      let reopened;
      try {
        assert.throws(() => { reopened = openStore({path, mode: 'read'}); },
          error => error.code === 'RECOVERY_REQUIRED');
      } finally {
        closeStore(reopened);
      }
    });
  }
});

await test('open rejects a schema missing a required column', () => {
  allocatedCase('schema-columns', root => {
    const path = join(root, 'coordination.sqlite');
    const store = openStore({path, mode: 'create'});
    store.database.exec(`
      ALTER TABLE events RENAME TO events_complete;
      CREATE TABLE events (
        seq INTEGER PRIMARY KEY AUTOINCREMENT,
        operation_id TEXT NOT NULL,
        payload TEXT NOT NULL CHECK (json_valid(payload))
      );
      DROP TABLE events_complete;
    `);
    closeStore(store);
    let reopened;
    try {
      assert.throws(() => {
        reopened = openStore({path, mode: 'write'});
      }, error => error.code === 'RECOVERY_REQUIRED');
    } finally {
      closeStore(reopened);
    }
  });
});

await test('open rejects a schema missing a required constraint', () => {
  allocatedCase('schema-constraints', root => {
    const path = join(root, 'coordination.sqlite');
    const store = openStore({path, mode: 'create'});
    store.database.exec(`
      ALTER TABLE operations RENAME TO operations_complete;
      CREATE TABLE operations (
        id TEXT PRIMARY KEY,
        payload_digest TEXT NOT NULL,
        receipt TEXT NOT NULL
      );
      DROP TABLE operations_complete;
    `);
    closeStore(store);
    let reopened;
    try {
      assert.throws(() => {
        reopened = openStore({path, mode: 'write'});
      }, error => error.code === 'RECOVERY_REQUIRED');
    } finally {
      closeStore(reopened);
    }
  });
});

allocatedCase('corrupt', root => {
  const path = join(root, 'coordination.sqlite');
  writeFileSync(path, 'not a sqlite database');
  assert.throws(() => openStore({path, mode: 'write'}), error =>
    error.code === 'RECOVERY_REQUIRED');
});

allocatedCase('modes', root => {
  const path = join(root, 'missing', 'coordination.sqlite');
  assert.throws(() => openStore({path, mode: 'read'}), error =>
    error.code === 'RECOVERY_REQUIRED');
  assert.throws(() => openStore({path, mode: 'write'}), error =>
    error.code === 'RECOVERY_REQUIRED');
  assert.throws(() => openStore({path, mode: 'replace'}), error =>
    error.code === 'INVALID_INPUT');
});

await withWorkspace(async ({root, store}) => {
  seedItem(store);
  const databasePath = join(root, '.kai', 'state', 'coordination.sqlite');
  await withChildLock(databasePath, 'BEGIN IMMEDIATE', () => {
    const started = Date.now();
    assert.throws(() => applyOperation(
      store,
      command('item.update', {payload: {title: 'Contended'}}),
      current => ({...current.body, title: 'Contended'}),
    ), error => error.code === 'STORE_BUSY' && error.retryable === true);
    assert.ok(Date.now() - started >= 800, 'busy_timeout should bound contention near one second');
  });
  assert.equal(readRecord(store, 'item', 'demo').version, 1);
});

await test('read operations translate SQLite lock exhaustion to STORE_BUSY', async () => {
  await withWorkspace(async ({root, store}) => {
    seedItem(store);
    const databasePath = join(root, '.kai', 'state', 'coordination.sqlite');
    await withChildLock(databasePath, 'BEGIN EXCLUSIVE', () => {
      assert.throws(() => readRecord(store, 'item', 'demo'), error =>
        error.code === 'STORE_BUSY' && error.retryable === true);
      assert.throws(() => listRecords(store, {kind: 'item', itemId: 'demo'}), error =>
        error.code === 'STORE_BUSY' && error.retryable === true);
    });
  });
});

await test('receipt insertion failure rolls back the primary write and event', async () => {
  await withWorkspace(({store}) => {
    seedItem(store);
    store.database.exec(`
      CREATE TRIGGER abort_receipt_insert
      BEFORE INSERT ON operations
      BEGIN
        SELECT RAISE(ABORT, 'forced receipt abort');
      END
    `);
    assert.throws(() => applyOperation(
      store,
      command('item.update', {payload: {title: 'Must roll back'}}),
      (current, tx) => {
        tx.appendEvent({kind: 'must.rollback'});
        return {...current.body, title: 'Must roll back'};
      },
    ), error =>
      error.code === 'ERR_SQLITE_ERROR'
      && /forced receipt abort/.test(error.message));
    assert.equal(readRecord(store, 'item', 'demo').body.title, 'Demo knowledge item');
    assert.equal(
      store.database.prepare('SELECT count(*) AS count FROM events').get().count,
      0,
    );
    assert.equal(
      store.database.prepare('SELECT count(*) AS count FROM operations').get().count,
      0,
    );
  });
});

await test('late receipt failure rolls back and exposes rollback uncertainty', async () => {
  await withWorkspace(({root, store}) => {
    seedItem(store);
    const databasePath = join(root, '.kai', 'state', 'coordination.sqlite');
    store.database.exec(`
      CREATE TRIGGER abort_receipt
      BEFORE INSERT ON operations
      BEGIN
        SELECT RAISE(ROLLBACK, 'forced receipt rollback');
      END
    `);
    let failure;
    try {
      applyOperation(
        store,
        command('item.update', {payload: {title: 'Must roll back'}}),
        (current, tx) => {
          tx.appendEvent({kind: 'must.rollback'});
          return {...current.body, title: 'Must roll back'};
        },
      );
    } catch (error) {
      failure = error;
    }
    assert.equal(failure?.code, 'RECOVERY_REQUIRED');
    assert.equal(failure?.retryable, false);
    assert.ok(failure?.cause instanceof AggregateError);
    assert.equal(failure.cause.errors.length, 2);
    assert.match(failure.cause.errors[0].message, /forced receipt rollback/);
    assert.match(failure.cause.errors[1].message, /cannot rollback/i);
    assert.equal(store.closed, true);

    const reopened = openStore({path: databasePath, mode: 'write'});
    try {
      assert.equal(readRecord(reopened, 'item', 'demo').body.title, 'Demo knowledge item');
      assert.equal(
        reopened.database.prepare('SELECT count(*) AS count FROM events').get().count,
        0,
      );
      assert.equal(
        reopened.database.prepare('SELECT count(*) AS count FROM operations').get().count,
        0,
      );
    } finally {
      closeStore(reopened);
    }
  });
});

console.log('coordination store self-test passed');
