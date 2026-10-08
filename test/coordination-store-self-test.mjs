import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {
  existsSync, mkdirSync, readFileSync, rmSync, writeFileSync,
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
  criteriaRef,
  subjectRef,
  validateCommand,
  validateRecord,
} from '../src/core/lib/coordination-runtime/contract.mjs';
import * as storeApi from '../src/core/lib/coordination-runtime/store.mjs';
import * as migrationFiles from '../src/core/lib/coordination-runtime/migration-files.mjs';
import {
  allocateTemporaryRoot,
  command,
  fixtureIds,
  seedTask,
  seedRecord,
  withWorkspace,
} from './helpers/coordination-runtime-fixture.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const {
  applyOperation,
  closeStore,
  listRecords,
  openHistoricalStore,
  openStore,
  readRecord,
  readSubjectView,
} = storeApi;
const {logicalStoreDigest} = migrationFiles;
const taskSubject = id => ({kind: 'task', id});
const primaryId = fixtureIds.task;

function questionBody(id, ask, subject = taskSubject(primaryId)) {
  return {
    schema_version: 1,
    question_id: id,
    subject,
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

function epicBody(id = 'epic:typed-store') {
  return {
    schema_version: 1,
    id,
    title: 'Exercise typed SQLite subjects',
    state: 'active',
    completion_disposition: null,
    owner: 'operator',
    scope_authority: 'operator',
    completion_authority: 'operator',
    priority: 1,
    outcome: 'The coordination store persists typed hierarchy subjects.',
    acceptance: ['Typed subjects remain isolated and durable.'],
    hold: null,
    created_at: '2026-09-16T12:00:00.000Z',
    updated_at: '2026-09-16T12:00:00.000Z',
    direction_ref: {
      path: 'docs/kai/DIRECTION.md',
      hash: 'b'.repeat(64),
      goal: 'Ship typed coordination subjects.',
    },
    contribution: 'Generalizes the store before the semantic Task cutover.',
    scope_fit: 'Changes only the persistence envelope and query boundary.',
    required_features: [],
    optional_features: [],
  };
}

function legacyItemBody(id = 'historical-item') {
  return {
    schema_version: 1,
    id,
    title: 'Historical schema-4 item',
    initiative: 'historical-initiative',
    delivery_class: 'knowledge',
    state: 'proposed',
    resume_state: null,
    scope_authority: 'eng-lead-architecture',
    completion_authority: 'eng-reviewer-code',
    producer_actor: null,
    producing_actors: [],
    acceptance_actor: null,
    priority: 1,
    next_role: 'eng-builder-software',
    outcome: 'Released schema-1 records remain readable.',
    acceptance: ['The historical item decodes without schema-5 reinterpretation.'],
    artifact_expectation: 'none',
    artifact_expectation_reason: 'The historical record is the test subject.',
    artifact_class: null,
    durability: null,
    validity_owner: null,
    artifact_targets: [],
    context_artifacts: [],
    touches: ['src/core/lib/coordination-runtime/store.mjs'],
    depends_on: [],
    lease: null,
    recovery_hold: null,
    waiting_on_questions: [],
    required_for_milestone: true,
    review_requirements: [],
    change_ref: null,
    updated_at: '2026-09-16T12:00:00.000Z',
  };
}

function messageBody(id, {
  kind = 'handoff',
  artifactRefs = [],
  evidenceRefs = [],
  subject = taskSubject(primaryId),
} = {}) {
  const payload = kind === 'question'
    ? {
        questionKind: 'fact',
        blocking: false,
        context: 'Typed-subject isolation.',
        ask: 'Can a foreign subject enter this view?',
        answerBy: 'before projection',
      }
    : kind === 'answer'
      ? {
          status: 'answered',
          answer: 'No.',
          lane: 'in-lane',
        }
      : kind === 'recovery'
        ? {
            observed: 'Foreign recovery record.',
            disposition: 'conflicting-partial-work',
            staleLeaseToken: 'foreign-stale-lease',
            newLeaseToken: null,
          }
        : {
            did: 'Persisted a foreign handoff.',
            needs: 'Keep typed subjects isolated.',
            assetState: 'none — product change',
            authority: 'pending',
            revalidation: 'not applicable',
            questions: [],
          };
  return {
    schema_version: 1,
    message_id: id,
    subject,
    thread_id: subjectRef(subject, 1),
    parent_id: null,
    sender_role: 'eng-builder-software',
    sender_run: 'foreign-subject-run',
    recipient: 'eng-reviewer-code',
    kind,
    created_at: '2026-09-16T12:00:00.000Z',
    basis_version: 1,
    payload,
    artifact_refs: artifactRefs,
    evidence_refs: evidenceRefs,
    provenance: 'durable-thread',
  };
}

function createSchema1Store(path) {
  const database = new DatabaseSync(path);
  database.exec(`
    CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE records (
      kind TEXT NOT NULL, id TEXT NOT NULL, item_id TEXT,
      version INTEGER NOT NULL CHECK (version > 0),
      body TEXT NOT NULL CHECK (json_valid(body)),
      PRIMARY KEY (kind, id)
    );
    CREATE TABLE events (
      seq INTEGER PRIMARY KEY AUTOINCREMENT,
      operation_id TEXT NOT NULL, item_id TEXT,
      payload TEXT NOT NULL CHECK (json_valid(payload)),
      event_kind TEXT GENERATED ALWAYS AS (json_extract(payload, '$.kind')) STORED,
      message_id TEXT GENERATED ALWAYS AS (
        CASE json_extract(payload, '$.kind')
          WHEN 'attempt.recover' THEN json_extract(payload, '$.payload.attemptId')
          WHEN 'question.open' THEN json_extract(payload, '$.payload.messageId')
          WHEN 'question.answer' THEN json_extract(payload, '$.payload.messageId')
          WHEN 'item.handoff' THEN json_extract(payload, '$.payload.messageId')
        END
      ) STORED,
      approval_id TEXT GENERATED ALWAYS AS (
        CASE WHEN json_extract(payload, '$.kind') = 'approval.record'
          THEN json_extract(payload, '$.payload.body.approval_id') END
      ) STORED,
      question_id TEXT GENERATED ALWAYS AS (
        CASE WHEN json_extract(payload, '$.kind') = 'question.open'
          THEN json_extract(payload, '$.payload.questionId') END
      ) STORED,
      thread_id TEXT
    );
    CREATE TABLE operations (
      id TEXT PRIMARY KEY, payload_digest TEXT NOT NULL,
      receipt TEXT NOT NULL CHECK (json_valid(receipt))
    );
    CREATE INDEX records_by_item ON records(kind, item_id);
    CREATE INDEX records_by_question_status ON records(item_id, json_extract(body, '$.status'))
      WHERE kind = 'question';
    CREATE INDEX records_by_criteria ON records(kind, item_id, json_extract(body, '$.criteria_ref'));
    CREATE INDEX events_by_thread ON events(thread_id, seq) WHERE message_id IS NOT NULL;
    CREATE INDEX events_by_message ON events(message_id, seq) WHERE message_id IS NOT NULL;
    CREATE INDEX events_by_item_kind ON events(item_id, event_kind, seq, question_id);
    CREATE INDEX events_by_approval ON events(approval_id, seq) WHERE approval_id IS NOT NULL;
    CREATE TRIGGER events_capture_thread AFTER INSERT ON events
      WHEN NEW.message_id IS NOT NULL
      BEGIN
        UPDATE events SET thread_id = COALESCE(
          (SELECT json_extract(body, '$.thread_id') FROM records
            WHERE kind = 'message' AND id = NEW.message_id), NEW.item_id)
        WHERE seq = NEW.seq;
      END;
    CREATE TRIGGER messages_capture_thread AFTER INSERT ON records
      WHEN NEW.kind = 'message'
      BEGIN
        UPDATE events SET thread_id = json_extract(NEW.body, '$.thread_id')
        WHERE message_id = NEW.id;
      END;
    CREATE TRIGGER messages_update_thread AFTER UPDATE OF body ON records
      WHEN NEW.kind = 'message'
      BEGIN
        UPDATE events SET thread_id = json_extract(NEW.body, '$.thread_id')
        WHERE message_id = NEW.id;
      END;
  `);
  database.prepare("INSERT INTO metadata VALUES ('schema_version', '1')").run();
  database.prepare("INSERT INTO metadata VALUES ('message_schema_version', '1')").run();
  database.close();
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
    'src',
    'core',
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
  commandDigest(command('task.update', {
    operationId: '00000000-0000-4000-8000-000000000001',
    payload: {title: 'Revised'},
  })),
  commandDigest(command('task.update', {
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

assert.ok(COMMAND_KINDS.has('task.update'));
assert.ok(RECORD_KINDS.has('item'));
assert.throws(() => validateCommand(command('unknown.command')), error =>
  error.code === 'INVALID_INPUT');
assert.throws(() => validateCommand(command('task.update', {
  payload: {state: 'shipped'},
})), error => error.code === 'INVALID_INPUT');
assert.throws(() => validateCommand({
  ...command('task.update', {payload: {title: 'Valid'}}),
  authority: {roles: ['operator']},
}), error => error.code === 'INVALID_INPUT');
assert.throws(() => validateRecord({
  kind: 'item',
  id: 'demo',
  subject: taskSubject(primaryId),
  version: 1,
  body: [],
}), error => error.code === 'INVALID_INPUT');

await withWorkspace(({store}) => {
  seedTask(store);
  assert.deepEqual(
    store.database.prepare('SELECT key, value FROM metadata ORDER BY key').all()
      .map(({key, value}) => ({key, value})),
    [
      {key: 'message_schema_version', value: '1'},
      {key: 'schema_version', value: '2'},
    ],
  );
  const op = command('task.update', {payload: {title: 'Revised'}});
  const mutate = current => ({...current.body, title: 'Revised'});
  const first = applyOperation(store, op, mutate);
  assert.deepEqual(applyOperation(store, op, mutate), first);
  assert.equal(first.recordVersion, 2);
  assert.equal(readRecord(store, 'task', primaryId).version, 2);
  assert.deepEqual(
    {...store.database.prepare(`
      SELECT subject_kind, subject_id FROM events WHERE seq = ?
    `).get(first.eventSeq)},
    {subject_kind: 'task', subject_id: primaryId},
  );
  assert.throws(() => applyOperation(store,
    {...op, payload: {title: 'Different'}}, mutate),
  error => error.code === 'OPERATION_CONFLICT');
  assert.throws(() => applyOperation(store,
    command('task.update', {
      expectedVersion: 1,
      payload: {title: 'Stale'},
    }), mutate),
  error => error.code === 'VERSION_CONFLICT');
});

await test('schema 2 stores root records and isolates typed hierarchy subjects', async () => {
  await withWorkspace(({store}) => {
    const columns = store.database.prepare('PRAGMA table_xinfo(records)').all()
      .map(column => column.name);
    assert.deepEqual(columns, [
      'kind',
      'id',
      'subject_kind',
      'subject_id',
      'version',
      'body',
    ]);

    const epic = {
      kind: 'epic',
      id: 'epic:typed-store',
      subject: null,
      version: 1,
      body: epicBody(),
    };
    seedRecord(store, epic);
    assert.deepEqual(readRecord(store, epic.kind, epic.id).subject, null);

    const subjects = [
      {kind: 'epic', id: 'epic:typed-store'},
      {kind: 'feature', id: 'core:feature:typed-store'},
      {kind: 'requirement', id: 'core:requirement:typed-store'},
      {kind: 'task', id: 'core:task:typed-store'},
    ];
    for (const [index, subject] of subjects.entries()) {
      const id = `typed-question-${index}`;
      seedRecord(store, {
        kind: 'question',
        id,
        subject,
        version: 1,
        body: questionBody(id, `Question for ${subject.kind}`, subject),
      });
    }

    assert.equal(listRecords(store, {kind: 'question'}).length, subjects.length);
    assert.deepEqual(
      listRecords(store, {kind: 'question', subject: subjects[0]})
        .map(record => record.subject),
      [subjects[0]],
    );
    assert.deepEqual(listRecords(store, {kind: 'question', subject: null}), []);

    assert.throws(
      () => listRecords(store, {
        kind: 'question',
        subject: {kind: 'epic', id: null},
      }),
      error => error.code === 'INVALID_INPUT',
    );
    assert.throws(
      () => validateRecord({
        kind: 'question',
        id: 'invalid-subject',
        subject: {kind: 'epic'},
        version: 1,
        body: questionBody('invalid-subject', 'Invalid subject'),
      }),
      error => error.code === 'INVALID_INPUT',
    );
    assert.throws(() => store.database.prepare(`
      INSERT INTO records (kind, id, subject_kind, subject_id, version, body)
      VALUES ('question', 'sql-mismatch', 'epic', NULL, 1, '{}')
    `).run(), error => error.code === 'ERR_SQLITE_ERROR');
    assert.throws(() => store.database.prepare(`
      INSERT INTO events (operation_id, subject_kind, subject_id, payload)
      VALUES ('sql-mismatch', NULL, 'epic:typed-store', '{"kind":"mismatch"}')
    `).run(), error => error.code === 'ERR_SQLITE_ERROR');

    const before = logicalStoreDigest(store);
    store.database.prepare(`
      UPDATE records SET subject_id = 'epic:other'
      WHERE kind = 'question' AND id = 'typed-question-0'
    `).run();
    assert.notEqual(logicalStoreDigest(store), before);
  });
});

await test('readSubjectView loads cross-subject inputs but keeps local obligations isolated', async () => {
  await withWorkspace(({store}) => {
    const foreignSubject = {kind: 'task', id: 'engineering:task:foreign-store'};
    const openingId = '00000000-0000-4000-8000-000000000101';
    const answerId = '00000000-0000-4000-8000-000000000102';
    const recoveryId = '00000000-0000-4000-8000-000000000103';
    const artifactId = '00000000-0000-4000-8000-000000000104';
    const evidenceId = '00000000-0000-4000-8000-000000000105';
    const item = seedTask(store, {
      state: 'blocked',
      resume_state: 'in-progress',
      next_role: 'operator',
      waiting_on_questions: ['foreign-question'],
      recovery_hold: recoveryId,
      context_artifacts: [`artifact:${artifactId}`, `evidence:${evidenceId}`],
    });
    const foreignTask = seedTask(store, {id: foreignSubject.id});
    seedRecord(store, validateRecord({
      kind: 'question',
      id: 'local-question',
      subject: taskSubject(primaryId),
      version: 1,
      body: {
        ...questionBody('local-question', 'Do foreign messages stay excluded?'),
        opened_message_id: openingId,
        answer_message_ids: [answerId],
      },
    }));
    seedRecord(store, validateRecord({
      kind: 'question',
      id: 'foreign-question',
      subject: foreignSubject,
      version: 1,
      body: questionBody('foreign-question', 'Do foreign questions stay excluded?', foreignSubject),
    }));
    for (const [id, kind] of [[openingId, 'question'], [answerId, 'answer'], [recoveryId, 'recovery']]) {
      seedRecord(store, validateRecord({
        kind: 'message',
        id,
        subject: foreignSubject,
        version: 1,
        body: messageBody(id, {kind, subject: foreignSubject}),
      }));
    }
    const staleLease = {
      holder: {role: 'eng-builder-software', runId: 'foreign-subject-run'},
      token: 'foreign-stale-lease',
      version_at_grant: 1,
      acquired_at: '2026-09-16T10:00:00.000Z',
      expires_at: '2026-09-16T11:00:00.000Z',
    };
    seedRecord(store, validateRecord({
      kind: 'attempt',
      id: recoveryId,
      subject: foreignSubject,
      version: 1,
      body: {
        schema_version: 1,
        attempt_id: recoveryId,
        subject: foreignSubject,
        grantor: {role: 'eng-lead-architecture', runId: 'recovery-steward'},
        stale_lease: staleLease,
        observed: 'Foreign recovery record.',
        disposition: 'conflicting-partial-work',
        recovery_evidence_ids: [evidenceId],
        new_lease: null,
        created_at: '2026-09-16T12:00:00.000Z',
      },
    }));
    seedRecord(store, validateRecord({
      kind: 'artifact',
      id: artifactId,
      subject: foreignSubject,
      version: 1,
      body: {
        schema_version: 1,
        artifact_id: artifactId,
        subject: foreignSubject,
        producer: {role: 'eng-builder-software', runId: 'foreign-subject-run'},
        content_ref: {kind: 'git', base: 'a'.repeat(40), head: 'b'.repeat(40)},
        criteria_ref: criteriaRef(foreignTask, (kind, id) => readRecord(store, kind, id)),
        project_id: null,
        run_directory: '.kai/engineering/reports/foreign-store/scratch',
        snapshots: [],
        manifest_path: null,
        classification: 'internal',
        media_type: 'text/plain',
        title: 'Foreign artifact',
        created_at: '2026-09-16T12:00:00.000Z',
      },
    }));
    seedRecord(store, validateRecord({
      kind: 'evidence',
      id: evidenceId,
      subject: foreignSubject,
      version: 1,
      body: {
        schema_version: 1,
        evidence_id: evidenceId,
        subject: foreignSubject,
        kind: 'recovery-reconciliation',
        content_ref: null,
        criteria_ref: null,
        supersedes: [],
        dimension: null,
        outcome: 'passed',
        evidence_refs: ['retained/foreign-recovery.txt'],
        reason: 'Foreign evidence must not enter the item view.',
        data: {
          stale_lease_token: staleLease.token,
          disposition: 'conflicting-partial-work',
          observed: 'Foreign recovery record.',
        },
        created_at: '2026-09-16T12:00:00.000Z',
      },
    }));

    const view = readSubjectView(store, {
      subject: taskSubject(primaryId),
      recentLimit: 0,
    });
    const localQuestion = view.questions.find(entry => entry.record?.id === 'local-question');
    assert.equal(view.questions.filter(entry => entry.record === null).length, 1);
    assert.equal(localQuestion.openedMessage, null);
    assert.deepEqual(localQuestion.answerMessages, [null]);
    assert.equal(view.recoveryHold.record, null);
    assert.equal(view.recoveryHold.message, null);
    assert.deepEqual(
      view.referencedDetails.map(entry => [entry.reference, entry.record?.subject]),
      [
        [`artifact:${artifactId}`, foreignSubject],
        [`evidence:${evidenceId}`, foreignSubject],
      ],
    );
  });
});

await test('readSubjectView recent messages and counts isolate same-ID typed threads', async () => {
  await withWorkspace(({store}) => {
    seedTask(store);
    const messageId = '00000000-0000-4000-8000-000000000106';
    seedRecord(store, validateRecord({
      kind: 'message',
      id: messageId,
      subject: {kind: 'task', id: primaryId},
      version: 1,
      body: messageBody(messageId),
    }));
    store.database.prepare(`
      INSERT INTO events (operation_id, subject_kind, subject_id, payload)
      VALUES (?, 'task', 'demo', ?)
    `).run('foreign-thread-event', JSON.stringify({
      kind: 'task.handoff',
      payload: {messageId},
    }));

    const view = readSubjectView(store, {
      subject: taskSubject(primaryId),
      recentLimit: 8,
    });
    assert.deepEqual(view.recentMessages, []);
    assert.equal(view.messageCount, 0);
    assert.equal(view.latestHandoff, null);
  });
});

await test('readSubjectView holds one SQLite snapshot while a WAL writer advances', async () => {
  await withWorkspace(({store}) => {
    store.database.exec('PRAGMA journal_mode=WAL');
    seedTask(store);
    const writer = openStore({path: store.path, mode: 'write'});
    const prepare = store.database.prepare;
    let advanced = false;
    try {
      store.database.prepare = function(sql) {
        if (!advanced && /\bFROM records\b/i.test(sql)) {
          advanced = true;
          applyOperation(
            writer,
            command('task.update', {payload: {title: 'Writer advanced'}}),
            current => ({...current.body, title: 'Writer advanced'}),
          );
        }
        return prepare.call(this, sql);
      };
      const view = readSubjectView(store, {
        subject: taskSubject(primaryId),
        recentLimit: 0,
      });
      assert.equal(advanced, true);
      assert.equal(view.throughSeq, 0);
      assert.equal(view.record.body.title, 'Demo knowledge Task');
    } finally {
      store.database.prepare = prepare;
      closeStore(writer);
    }
    assert.equal(
      readSubjectView(store, {
        subject: taskSubject(primaryId),
        recentLimit: 0,
      }).record.body.title,
      'Writer advanced',
    );
  });
});

await withWorkspace(({store}) => {
  seedTask(store);
  assert.throws(() => applyOperation(
    store,
    command('task.update', {payload: {title: 'Allowed'}}),
    current => ({...current.body, title: 'Allowed', state: 'shipped'}),
  ), error => error.code === 'INVALID_INPUT');
  assert.equal(readRecord(store, 'task', primaryId).body.state, 'completed');
  assert.throws(() => readRecord(store, 'unknown', 'demo'), error =>
    error.code === 'INVALID_INPUT');
  assert.throws(() => listRecords(store, {kind: 'unknown', subject: taskSubject(primaryId)}), error =>
    error.code === 'INVALID_INPUT');
});

await test('mutation cannot rewrite the primary validation baseline', async () => {
  await withWorkspace(({store}) => {
    seedTask(store);
    assert.throws(() => applyOperation(
      store,
      command('task.update', {payload: {title: 'Allowed'}}),
      current => {
        current.body.state = 'shipped';
        return {...current.body, title: 'Allowed'};
      },
    ), error => error.code === 'INVALID_INPUT');
    assert.equal(readRecord(store, 'task', primaryId).body.state, 'completed');
  });
});

await test('mutation cannot change the command after its digest is computed', async () => {
  await withWorkspace(({store}) => {
    seedTask(store);
    const operation = command('task.update', {payload: {title: 'Original'}});
    assert.throws(() => applyOperation(store, operation, current => {
      operation.payload.title = 'Injected';
      return {...current.body, title: 'Injected'};
    }), error => error.code === 'INVALID_INPUT');
    assert.equal(readRecord(store, 'task', primaryId).body.title, 'Demo knowledge Task');
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
    seedTask(store);
    const callbackError = new Error('database is locked');
    callbackError.code = 'ERR_SQLITE_ERROR';
    callbackError.errcode = 5;
    assert.throws(() => applyOperation(
      store,
      command('task.update', {payload: {title: 'Not written'}}),
      () => {
        throw callbackError;
      },
    ), error => error === callbackError);
  });
});

await withWorkspace(({store}) => {
  seedTask(store);
  let escapedTransaction;
  applyOperation(
    store,
    command('task.update', {payload: {title: 'Scoped transaction'}}),
    (current, tx) => {
      escapedTransaction = tx;
      return {...current.body, title: 'Scoped transaction'};
    },
  );
  assert.throws(() => escapedTransaction.appendEvent({kind: 'too-late'}), error =>
    error.code === 'INVALID_INPUT');
});

await withWorkspace(({root, store}) => {
  seedTask(store);
  const operation = command('task.update', {payload: {title: 'Persisted'}});
  const result = applyOperation(store, operation, (current, tx) => {
    tx.put({
      kind: 'question',
      id: 'question-1',
      subject: taskSubject(primaryId),
      version: 1,
      body: questionBody('question-1', 'Persisted?'),
    });
    tx.appendEvent({kind: 'item.updated', title: 'Persisted'});
    return {...current.body, title: 'Persisted'};
  });
  assert.ok(result.eventSeq > 0);
  assert.equal(listRecords(store, {kind: 'question', subject: taskSubject(primaryId)}).length, 1);
  closeStore(store);

  const reopened = openStore({
    path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
    mode: 'write',
  });
  try {
    assert.equal(readRecord(reopened, 'task', primaryId).body.title, 'Persisted');
    assert.equal(readRecord(reopened, 'question', 'question-1').version, 1);
    assert.deepEqual(applyOperation(reopened, operation, () => {
      throw new Error('replay must not call mutate');
    }), result);
  } finally {
    closeStore(reopened);
  }
});

await withWorkspace(({store}) => {
  seedTask(store);
  const beforeEvents = store.database.prepare('SELECT count(*) AS count FROM events').get().count;
  const failed = command('task.update', {payload: {title: 'Rolled back'}});
  assert.throws(() => applyOperation(store, failed, (current, tx) => {
    tx.put({
      kind: 'question',
      id: 'rolled-back-question',
      subject: taskSubject(primaryId),
      version: 1,
      body: questionBody('rolled-back-question', 'Must disappear'),
    });
    tx.appendEvent({kind: 'must.rollback'});
    throw new Error('mutation failed');
  }), /mutation failed/);
  assert.equal(readRecord(store, 'task', primaryId).body.title, 'Demo knowledge Task');
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
  seedTask(store);
  closeStore(store);
  const readOnly = openStore({
    path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
    mode: 'read',
  });
  try {
    assert.equal(readRecord(readOnly, 'task', primaryId).version, 1);
    assert.throws(() => applyOperation(
      readOnly,
      command('task.update', {payload: {title: 'Denied'}}),
      current => ({...current.body, title: 'Denied'}),
    ), error => error.code === 'INVALID_INPUT');
  } finally {
    closeStore(readOnly);
  }
});

await withWorkspace(({store}) => {
  store.database.prepare(`
    INSERT INTO records (kind, id, subject_kind, subject_id, version, body)
    VALUES ('item', 'malformed', 'item', 'malformed', 1, '[]')
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

await test('lower-level mutations fail closed for schema 3/4 and non-live database paths', async () => {
  for (const schema of [3, 4]) {
    allocatedCase(`historical-write-${schema}`, root => {
      const state = join(root, '.kai', 'state');
      mkdirSync(state, {recursive: true});
      writeFileSync(join(root, '.kai', 'manifest.json'), `${JSON.stringify({
        plugin: 'kai-core',
        version: 'test',
        schema_version: schema,
        scaffolded: '2026-10-02',
        workspace_id: `historical-${schema}`,
        storage_mode: 'repo-local',
        workspace_root: '.',
        state: '.kai/state',
        runs: '.kai/runs',
        review: '.kai/review',
        archive: '.kai/archive',
        personal: '.kai/personal',
        projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
        areas: [],
      }, null, 2)}\n`);
      const store = openStore({
        path: join(state, 'coordination.sqlite'),
        mode: 'create',
      });
      try {
        seedTask(store);
        assert.throws(
          () => applyOperation(
            store,
            command('task.update', {payload: {title: 'Forbidden historical write'}}),
            current => ({...current.body, title: 'Forbidden historical write'}),
          ),
          error => error.code === 'SCHEMA_MISMATCH',
        );
        assert.equal(readRecord(store, 'task', primaryId).version, 1);
        assert.equal(existsSync(join(root, '.kai', 'state', 'migration.lock')), false);
      } finally {
        closeStore(store);
      }
    });
  }

  allocatedCase('foreign-write-path', root => {
    const store = openStore({path: join(root, 'coordination.sqlite'), mode: 'create'});
    try {
      seedTask(store);
      assert.throws(
        () => applyOperation(
          store,
          command('task.update', {payload: {title: 'Forbidden foreign write'}}),
          current => ({...current.body, title: 'Forbidden foreign write'}),
        ),
        error => error.code === 'SCHEMA_MISMATCH',
      );
      assert.equal(readRecord(store, 'task', primaryId).version, 1);
    } finally {
      closeStore(store);
    }
  });
});

await test('schema 1 stores open only through the read-only historical API', () => {
  allocatedCase('historical-schema', root => {
    const path = join(root, 'coordination.sqlite');
    createSchema1Store(path);
    const database = new DatabaseSync(path);
    const body = legacyItemBody();
    database.prepare(`
      INSERT INTO records (kind, id, item_id, version, body)
      VALUES ('item', ?, ?, 1, ?)
    `).run(body.id, body.id, JSON.stringify(body));
    database.close();
    assert.throws(() => openStore({path, mode: 'read'}), error =>
      error.code === 'SCHEMA_MISMATCH');
    assert.throws(() => openHistoricalStore({
      path,
      expectedStoreVersion: 1,
      mode: 'write',
    }), error => error.code === 'INVALID_INPUT');

    const historical = openHistoricalStore({
      path,
      expectedStoreVersion: 1,
    });
    try {
      assert.equal(historical.mode, 'read');
      assert.equal(historical.schemaVersion, 1);
      assert.deepEqual(listRecords(historical, {kind: 'item'}), [{
        kind: 'item',
        id: body.id,
        subject: {kind: 'item', id: body.id},
        version: 1,
        body,
      }]);
      assert.throws(
        () => historical.database.prepare(`
          INSERT INTO metadata (key, value) VALUES ('forbidden', 'write')
        `).run(),
        error => error.code === 'ERR_SQLITE_ERROR',
      );
      assert.throws(
        () => applyOperation(
          historical,
          command('task.update', {payload: {title: 'Denied'}}),
          current => current.body,
        ),
        error => error.code === 'INVALID_INPUT',
      );
    } finally {
      closeStore(historical);
    }
  });
});

await test('historical schema 1 rejects impossible schema-5 Task records', () => {
  allocatedCase('historical-schema-task', root => {
    const path = join(root, 'coordination.sqlite');
    createSchema1Store(path);
    const database = new DatabaseSync(path);
    database.prepare(`
      INSERT INTO records (kind, id, item_id, version, body)
      VALUES ('task', 'core:task:impossible', NULL, 1, '{}')
    `).run();
    database.close();
    let historical;
    try {
      assert.throws(
        () => {
          historical = openHistoricalStore({path, expectedStoreVersion: 1});
        },
        error => error.code === 'RECOVERY_REQUIRED'
          && /schema 1 cannot contain task records/i.test(error.message),
      );
    } finally {
      closeStore(historical);
    }
  });
});

await test('open rejects a schema missing its required index', () => {
  allocatedCase('schema-index', root => {
    const path = join(root, 'coordination.sqlite');
    const store = openStore({path, mode: 'create'});
    store.database.exec('DROP INDEX records_by_subject');
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

await test('v2 indexed chronology is physical schema, never an implicit read/write migration', () => {
  const objects = [
    ['index', 'events_by_thread'],
    ['index', 'events_by_message'],
    ['index', 'events_by_subject_kind'],
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

await test('v2 rejects replaced chronology indexes, triggers and generated-column expressions', () => {
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
  seedTask(store);
  const databasePath = join(root, '.kai', 'core', 'runtime', 'coordination.sqlite');
  await withChildLock(databasePath, 'BEGIN IMMEDIATE', () => {
    const started = Date.now();
    assert.throws(() => applyOperation(
      store,
      command('task.update', {payload: {title: 'Contended'}}),
      current => ({...current.body, title: 'Contended'}),
    ), error => error.code === 'STORE_BUSY' && error.retryable === true);
    assert.ok(Date.now() - started >= 800, 'busy_timeout should bound contention near one second');
  });
  assert.equal(readRecord(store, 'task', primaryId).version, 1);
});

await test('read operations translate SQLite lock exhaustion to STORE_BUSY', async () => {
  await withWorkspace(async ({root, store}) => {
    seedTask(store);
    const databasePath = join(root, '.kai', 'core', 'runtime', 'coordination.sqlite');
    await withChildLock(databasePath, 'BEGIN EXCLUSIVE', () => {
      assert.throws(() => readRecord(store, 'task', primaryId), error =>
        error.code === 'STORE_BUSY' && error.retryable === true);
      assert.throws(() => listRecords(store, {kind: 'item', subject: taskSubject(primaryId)}), error =>
        error.code === 'STORE_BUSY' && error.retryable === true);
    });
  });
});

await test('receipt insertion failure rolls back the primary write and event', async () => {
  await withWorkspace(({store}) => {
    seedTask(store);
    store.database.exec(`
      CREATE TRIGGER abort_receipt_insert
      BEFORE INSERT ON operations
      BEGIN
        SELECT RAISE(ABORT, 'forced receipt abort');
      END
    `);
    assert.throws(() => applyOperation(
      store,
      command('task.update', {payload: {title: 'Must roll back'}}),
      (current, tx) => {
        tx.appendEvent({kind: 'must.rollback'});
        return {...current.body, title: 'Must roll back'};
      },
    ), error =>
      error.code === 'ERR_SQLITE_ERROR'
      && /forced receipt abort/.test(error.message));
    assert.equal(readRecord(store, 'task', primaryId).body.title, 'Demo knowledge Task');
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
    seedTask(store);
    const databasePath = join(root, '.kai', 'core', 'runtime', 'coordination.sqlite');
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
        command('task.update', {payload: {title: 'Must roll back'}}),
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
      assert.equal(readRecord(reopened, 'task', primaryId).body.title, 'Demo knowledge Task');
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
