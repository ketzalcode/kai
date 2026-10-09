import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {
  criteriaRef,
  subjectRef,
  validateRecord,
} from '../src/core/lib/coordination-runtime/contract.mjs';
import {applyCommand} from '../src/core/lib/coordination-runtime/engine.mjs';
import {bindEvidenceRuntime} from '../src/core/lib/coordination-runtime/evidence.mjs';
import {retainSubject} from '../src/core/lib/coordination-runtime/evidence-content.mjs';
import {
  applyOperation,
  closeStore,
  openStore,
  readRecord,
  readSubjectView,
} from '../src/core/lib/coordination-runtime/store.mjs';
import {
  authority,
  command,
  fixtureIds,
  seedRecord,
  seedTask,
  withWorkspace,
} from './helpers/coordination-runtime-fixture.mjs';

const NOW = '2026-09-16T12:00:00.000Z';
const LATER = '2099-09-16T13:00:00.000Z';
const builder = {role: 'eng-builder-software', runId: 'builder-run'};
const reviewer = {role: 'eng-reviewer-code', runId: 'review-run'};
const steward = {role: 'eng-lead-architecture', runId: 'steward-run'};
const roles = [builder.role, reviewer.role, steward.role, 'workflow-ship'];
const taskSubject = id => ({kind: 'task', id});

function taskCommand(kind, actor, expectedVersion, payload, leaseToken = null, recordId = fixtureIds.task) {
  return command(kind, {actor, expectedVersion, leaseToken, payload, recordId});
}

function grant(actor, action, version, recordId = fixtureIds.task) {
  return authority(actor, action, {version, recordId});
}

function activeLease(holder = builder, token = 'lease-token') {
  return {
    holder,
    token,
    version_at_grant: 1,
    acquired_at: NOW,
    expires_at: LATER,
  };
}

function questionBody(id, subject) {
  return {
    schema_version: 1,
    question_id: id,
    subject,
    asker: builder,
    recipient: reviewer.role,
    kind: 'fact',
    blocking: false,
    status: 'open',
    context: 'Cross-subject isolation.',
    ask: 'Does this question remain on its own subject?',
    answer_by: 'next-dispatch',
    opened_message_id: randomUUID(),
    answer_message_ids: [],
    resolution: null,
  };
}

function messageBody(id, {
  kind = 'handoff',
  subject = taskSubject(fixtureIds.task),
} = {}) {
  const payload = kind === 'question'
    ? {
        questionKind: 'fact',
        blocking: false,
        context: 'Cross-subject isolation.',
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
    sender_role: builder.role,
    sender_run: builder.runId,
    recipient: reviewer.role,
    kind,
    created_at: NOW,
    basis_version: 1,
    payload,
    artifact_refs: [],
    evidence_refs: [],
    provenance: 'durable-thread',
  };
}

function directionRef(root) {
  const path = 'docs/kai/DIRECTION.md';
  return {
    path,
    hash: createHash('sha256').update(readFileSync(join(root, path))).digest('hex'),
    goal: 'Exercise Task runtime behavior.',
  };
}

function hierarchyBodies(root) {
  const ids = {
    epic: 'epic:lean-suite',
    feature: 'engineering:feature:lean-suite',
    requirement: 'engineering:requirement:lean-suite',
    task: 'engineering:task:lean-suite',
  };
  return {
    ids,
    epic: {
      schema_version: 1,
      id: ids.epic,
      title: 'Exercise the lean coordination suite',
      state: 'proposed',
      completion_disposition: null,
      owner: steward.role,
      scope_authority: steward.role,
      completion_authority: reviewer.role,
      priority: 1,
      outcome: 'The hierarchy is executable.',
      acceptance: ['The full hierarchy can be created.'],
      hold: null,
      created_at: NOW,
      updated_at: NOW,
      direction_ref: directionRef(root),
      contribution: 'Protects the current coordination hierarchy.',
      scope_fit: 'Covers only the current schema.',
      required_features: [ids.feature],
      optional_features: [],
    },
    feature: {
      schema_version: 1,
      id: ids.feature,
      pack: 'engineering',
      epic_id: ids.epic,
      title: 'Create current hierarchy records',
      state: 'proposed',
      completion_disposition: null,
      owner: steward.role,
      scope_authority: steward.role,
      completion_authority: reviewer.role,
      priority: 1,
      outcome: 'Feature creation uses its Epic.',
      acceptance: ['The Feature owns its Requirement.'],
      hold: null,
      created_at: NOW,
      updated_at: NOW,
      required_requirements: [ids.requirement],
      optional_requirements: [],
      depends_on_features: [],
    },
    requirement: {
      schema_version: 1,
      id: ids.requirement,
      pack: 'engineering',
      feature_id: ids.feature,
      title: 'Create an executable Task',
      state: 'proposed',
      completion_disposition: null,
      owner: steward.role,
      scope_authority: steward.role,
      completion_authority: reviewer.role,
      priority: 1,
      outcome: 'Requirement creation uses its Feature.',
      acceptance: ['The Requirement owns its Task.'],
      hold: null,
      created_at: NOW,
      updated_at: NOW,
      required_tasks: [ids.task],
      optional_tasks: [],
    },
    task: {
      schema_version: 1,
      id: ids.task,
      pack: 'engineering',
      feature_id: ids.feature,
      satisfies: [ids.requirement],
      title: 'Implement the hierarchy case',
      delivery_class: 'knowledge',
      state: 'proposed',
      resume_state: null,
      scope_authority: steward.role,
      completion_authority: reviewer.role,
      producer_actor: null,
      producing_actors: [],
      acceptance_actor: null,
      priority: 1,
      next_role: steward.role,
      outcome: 'The Task is created under active ancestors.',
      acceptance: ['The hierarchy case passes.'],
      artifact_expectation: 'none',
      artifact_expectation_reason: 'The test result is the durable outcome.',
      artifact_class: null,
      durability: null,
      validity_owner: null,
      artifact_targets: [],
      context_artifacts: [],
      touches: ['test/coordination-core-self-test.mjs'],
      depends_on: [],
      lease: null,
      recovery_hold: null,
      waiting_on_questions: [],
      review_requirements: [],
      change_ref: null,
      updated_at: NOW,
    },
  };
}

function applyHierarchy(store, kind, action, bodyOrId, expectedVersion, payload = null) {
  const recordId = typeof bodyOrId === 'string' ? bodyOrId : bodyOrId.id;
  const kindCommand = `${kind}.${action}`;
  return applyCommand(store, command(kindCommand, {
    actor: steward,
    recordKind: kind,
    recordId,
    expectedVersion,
    payload: action === 'create' ? {body: bodyOrId} : payload,
  }), authority(steward, kindCommand, {
    recordKind: kind,
    recordId,
    version: expectedVersion,
  })).data.record;
}

function retainCompletionSubject(root, store, task, actor = builder) {
  const runDirectory = '.kai/engineering/reports/lean-suite/scratch';
  const bytes = 'Exact completion subject bytes.';
  const path = `${runDirectory}/subject.txt`;
  const subject = {
    kind: 'sha256',
    path,
    digest: createHash('sha256').update(bytes).digest('hex'),
  };
  const absolute = join(root, ...path.split('/'));
  mkdirSync(dirname(absolute), {recursive: true});
  writeFileSync(absolute, bytes);
  store.database.prepare(
    "UPDATE records SET body = ? WHERE kind = 'task' AND id = ?",
  ).run(JSON.stringify({...task.body, change_ref: subject}), task.id);
  const currentTask = readRecord(store, 'task', task.id);
  bindEvidenceRuntime(store, {
    root,
    authority: {roles, grants: []},
    runs: [{actor, directory: runDirectory}],
  });
  const artifactId = randomUUID();
  seedRecord(store, {
    kind: 'artifact',
    id: artifactId,
    subject: taskSubject(task.id),
    version: 1,
    body: {
      schema_version: 1,
      artifact_id: artifactId,
      subject: taskSubject(task.id),
      producer: actor,
      content_ref: subject,
      criteria_ref: criteriaRef(currentTask, (kind, id) => readRecord(store, kind, id)),
      project_id: null,
      run_directory: runDirectory,
      ...retainSubject(root, subject, null, runDirectory, artifactId),
      classification: 'internal',
      media_type: 'text/plain',
      title: 'Lean-suite completion subject',
      created_at: NOW,
    },
  });
  return {artifactId, subject, task: currentTask};
}

function seedCompletionEvidence(store, task, artifactId, {
  outcome,
  supersedes = [],
}) {
  const id = randomUUID();
  seedRecord(store, {
    kind: 'evidence',
    id,
    subject: taskSubject(task.id),
    version: 1,
    body: {
      schema_version: 1,
      evidence_id: id,
      subject: taskSubject(task.id),
      kind: 'dod-dimension',
      content_ref: task.body.change_ref,
      criteria_ref: criteriaRef(task, (kind, recordId) => readRecord(store, kind, recordId)),
      supersedes,
      dimension: 'verified',
      outcome,
      evidence_refs: [`artifact:${artifactId}`],
      reason: outcome === 'gap' ? 'A concurrent verification found an unresolved gap.' : null,
      data: {},
      created_at: NOW,
    },
  });
  return id;
}

function seedCompletionApproval(
  store,
  task,
  subject,
  artifactId,
  decision = 'approved',
  evidenceIds = [],
) {
  const id = randomUUID();
  seedRecord(store, {
    kind: 'approval',
    id,
    subject: taskSubject(task.id),
    version: 1,
    body: {
      schema_version: 1,
      approval_id: id,
      subject: taskSubject(task.id),
      authority: reviewer,
      kind: 'completion',
      content_ref: subject,
      criteria_ref: criteriaRef(task, (kind, recordId) => readRecord(store, kind, recordId)),
      supersedes: [],
      deployment: null,
      recovery: null,
      decision,
      evidence_refs: [
        `artifact:${artifactId}`,
        ...evidenceIds.map(evidenceId => `evidence:${evidenceId}`),
      ],
      reason: decision === 'approved' ? 'The exact subject is accepted.' : 'The exact subject is rejected.',
      created_at: NOW,
    },
  });
}

test('SQLite transaction rollback leaves records, events, and receipts unchanged', async () => {
  await withWorkspace(({store}) => {
    seedTask(store);
    const operation = command('task.update', {payload: {title: 'Must roll back'}});
    assert.throws(() => applyOperation(store, operation, (current, tx) => {
      tx.appendEvent({kind: 'must.rollback'});
      throw new Error('forced mutation failure');
    }), /forced mutation failure/);
    assert.equal(readRecord(store, 'task', fixtureIds.task).body.title, 'Demo knowledge Task');
    assert.equal(store.database.prepare('SELECT count(*) AS count FROM events').get().count, 0);
    assert.equal(store.database.prepare('SELECT count(*) AS count FROM operations').get().count, 0);
  });
});

test('optimistic version conflict rejects a stale mutation', async () => {
  await withWorkspace(({store}) => {
    seedTask(store);
    applyOperation(
      store,
      command('task.update', {payload: {title: 'Current'}}),
      current => ({...current.body, title: 'Current'}),
    );
    assert.throws(() => applyOperation(
      store,
      command('task.update', {expectedVersion: 1, payload: {title: 'Stale'}}),
      current => ({...current.body, title: 'Stale'}),
    ), error => error.code === 'VERSION_CONFLICT');
    assert.equal(readRecord(store, 'task', fixtureIds.task).body.title, 'Current');
  });
});

test('readSubjectView loads foreign inputs without leaking local obligations', async () => {
  await withWorkspace(({store}) => {
    const localSubject = taskSubject(fixtureIds.task);
    const foreignSubject = taskSubject('engineering:task:foreign-subject');
    const openingId = '00000000-0000-4000-8000-000000000101';
    const answerId = '00000000-0000-4000-8000-000000000102';
    const recoveryId = '00000000-0000-4000-8000-000000000103';
    const artifactId = '00000000-0000-4000-8000-000000000104';
    const evidenceId = '00000000-0000-4000-8000-000000000105';
    const handoffId = '00000000-0000-4000-8000-000000000106';
    seedTask(store, {
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
      subject: localSubject,
      version: 1,
      body: {
        ...questionBody('local-question', localSubject),
        opened_message_id: openingId,
        answer_message_ids: [answerId],
      },
    }));
    seedRecord(store, validateRecord({
      kind: 'question',
      id: 'foreign-question',
      subject: foreignSubject,
      version: 1,
      body: questionBody('foreign-question', foreignSubject),
    }));
    for (const [id, kind] of [
      [openingId, 'question'],
      [answerId, 'answer'],
      [recoveryId, 'recovery'],
    ]) {
      seedRecord(store, validateRecord({
        kind: 'message',
        id,
        subject: foreignSubject,
        version: 1,
        body: messageBody(id, {kind, subject: foreignSubject}),
      }));
    }
    seedRecord(store, validateRecord({
      kind: 'message',
      id: handoffId,
      subject: localSubject,
      version: 1,
      body: messageBody(handoffId, {subject: localSubject}),
    }));
    const staleLease = {
      holder: builder,
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
        grantor: steward,
        stale_lease: staleLease,
        observed: 'Foreign recovery record.',
        disposition: 'conflicting-partial-work',
        recovery_evidence_ids: [evidenceId],
        new_lease: null,
        created_at: NOW,
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
        producer: builder,
        content_ref: {kind: 'git', base: 'a'.repeat(40), head: 'b'.repeat(40)},
        criteria_ref: criteriaRef(foreignTask, (kind, id) => readRecord(store, kind, id)),
        project_id: null,
        run_directory: '.kai/engineering/reports/foreign-subject/scratch',
        snapshots: [],
        manifest_path: null,
        classification: 'internal',
        media_type: 'text/plain',
        title: 'Foreign artifact',
        created_at: NOW,
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
        reason: 'Foreign evidence may load only as an explicit input.',
        data: {
          stale_lease_token: staleLease.token,
          disposition: 'conflicting-partial-work',
          observed: 'Foreign recovery record.',
        },
        created_at: NOW,
      },
    }));
    store.database.prepare(`
      INSERT INTO events (operation_id, subject_kind, subject_id, payload)
      VALUES (?, ?, ?, ?)
    `).run(
      'foreign-thread-event',
      foreignSubject.kind,
      foreignSubject.id,
      JSON.stringify({kind: 'task.handoff', payload: {messageId: handoffId}}),
    );

    const view = readSubjectView(store, {subject: localSubject, recentLimit: 8});
    const localQuestion = view.questions.find(entry => entry.record?.id === 'local-question');
    assert.equal(view.questions.filter(entry => entry.record === null).length, 1);
    assert.equal(view.questions.some(entry => entry.record?.id === 'foreign-question'), false);
    assert.equal(localQuestion.openedMessage, null);
    assert.deepEqual(localQuestion.answerMessages, [null]);
    assert.deepEqual(view.recentMessages, []);
    assert.equal(view.messageCount, 0);
    assert.equal(view.latestHandoff, null);
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

test('unauthorized transition is refused without acting authority', async () => {
  await withWorkspace(({store}) => {
    seedTask(store, {state: 'in-progress', lease: null, next_role: builder.role});
    assert.throws(() => applyCommand(
      store,
      taskCommand('task.transition', builder, 1, {
        to: 'blocked',
        at: NOW,
        reason: 'No authority was granted.',
      }),
      {roles, grants: []},
    ), error => error.code === 'AUTHORITY_REQUIRED');
    assert.equal(readRecord(store, 'task', fixtureIds.task).body.state, 'in-progress');
  });
});

test('lease collision refuses overlapping active work', async () => {
  await withWorkspace(({store}) => {
    seedTask(store, {
      state: 'ready',
      producer_actor: null,
      acceptance_actor: null,
      touches: ['src/core/**'],
    });
    seedTask(store, {
      id: 'engineering:task:active-overlap',
      state: 'in-progress',
      touches: ['src/core/runtime.mjs'],
      lease: activeLease(reviewer, 'other-lease'),
    });
    assert.throws(() => applyCommand(
      store,
      taskCommand('task.grant', steward, 1, {
        holder: builder,
        actions: ['task.update'],
        acquiredAt: NOW,
        expiresAt: LATER,
      }),
      grant(steward, 'task.grant', 1),
    ), error => error.code === 'LEASE_CONFLICT');
  });
});

test('Epic -> Feature -> Requirement -> Task creation persists the current hierarchy', async () => {
  await withWorkspace(({root, store}) => {
    const bodies = hierarchyBodies(root);
    applyHierarchy(store, 'epic', 'create', bodies.epic, 0);
    applyHierarchy(store, 'epic', 'activate', bodies.ids.epic, 1, {at: NOW});
    applyHierarchy(store, 'feature', 'create', bodies.feature, 0);
    applyHierarchy(store, 'feature', 'activate', bodies.ids.feature, 1, {at: NOW});
    applyHierarchy(store, 'requirement', 'create', bodies.requirement, 0);
    applyHierarchy(store, 'requirement', 'activate', bodies.ids.requirement, 1, {at: NOW});
    const task = applyCommand(store, command('task.create', {
      actor: steward,
      recordId: bodies.ids.task,
      expectedVersion: 0,
      payload: {body: bodies.task},
    }), grant(steward, 'task.create', 0, bodies.ids.task)).data.record;

    assert.equal(task.body.state, 'proposed');
    assert.equal(readRecord(store, 'feature', bodies.ids.feature).body.epic_id, bodies.ids.epic);
    assert.equal(
      readRecord(store, 'requirement', bodies.ids.requirement).body.feature_id,
      bodies.ids.feature,
    );
    assert.deepEqual(task.body.satisfies, [bodies.ids.requirement]);
  });
});

test('Task reservation and completion use the persisted lease and current approval', async () => {
  await withWorkspace(({root, store}) => {
    seedTask(store, {
      state: 'in-review',
      producer_actor: builder,
      producing_actors: [builder],
      acceptance_actor: null,
      completion_authority: reviewer.role,
      next_role: reviewer.role,
      review_requirements: [],
      change_ref: null,
      lease: null,
    });
    const reserved = applyCommand(store, taskCommand('task.grant', steward, 1, {
      holder: reviewer,
      actions: ['task.transition'],
      acquiredAt: NOW,
      expiresAt: LATER,
    }), grant(steward, 'task.grant', 1)).data.record;
    const retained = retainCompletionSubject(root, store, reserved);
    const current = retained.task;
    seedCompletionApproval(store, current, retained.subject, retained.artifactId);

    const completed = applyCommand(store, taskCommand(
      'task.transition',
      reviewer,
      current.version,
      {to: 'completed', at: NOW, reason: 'Accepted the exact retained subject.'},
      reserved.body.lease.token,
    ), {roles, grants: []}).data.record;
    assert.equal(completed.body.state, 'completed');
    assert.deepEqual(completed.body.acceptance_actor, reviewer);
    assert.equal(completed.body.lease, null);
  });
});

test('stale Direction handoff refuses an unsafe recipient', async () => {
  await withWorkspace(({root, store}) => {
    seedTask(store, {
      state: 'ready',
      producer_actor: null,
      acceptance_actor: null,
      next_role: builder.role,
    });
    const reserved = applyCommand(store, taskCommand('task.grant', steward, 1, {
      holder: builder,
      actions: ['task.handoff'],
      acquiredAt: NOW,
      expiresAt: LATER,
    }), grant(steward, 'task.grant', 1)).data.record;
    writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), [
      '# Vision',
      'A composable workspace.',
      '',
      '# Mission',
      'Coordinate exact work safely.',
      '',
      '# Current Goal',
      'A changed Direction invalidates forward execution.',
      '',
      '# Out of Scope',
      'Schema 5 workspace activation remains deferred.',
      '',
    ].join('\n'));
    assert.throws(() => applyCommand(store, taskCommand(
      'task.handoff',
      builder,
      reserved.version,
      {
        toRole: reviewer.role,
        state: null,
        createdAt: NOW,
        messageId: randomUUID(),
        parentId: null,
        content: {
          did: 'Preserved stale work.',
          needs: 'Realign the Task.',
          assetState: 'Preserved.',
          authority: 'Direction changed.',
          revalidation: 'Required.',
          questions: [],
        },
        artifactRefs: [],
        evidenceRefs: [],
        provenance: 'durable-thread',
      },
      reserved.body.lease.token,
    ), {roles, grants: []}), error =>
      error.code === 'AUTHORITY_REQUIRED' && /safe owner/i.test(error.message));
  });
});

test('conflicting current completion evidence refuses completion', async () => {
  await withWorkspace(({root, store}) => {
    seedTask(store, {
      state: 'in-review',
      producer_actor: builder,
      producing_actors: [builder],
      acceptance_actor: null,
      completion_authority: reviewer.role,
      next_role: reviewer.role,
      review_requirements: [],
      lease: activeLease(reviewer, 'review-lease'),
    });
    const task = readRecord(store, 'task', fixtureIds.task);
    const retained = retainCompletionSubject(root, store, task);
    const current = retained.task;
    const positiveId = seedCompletionEvidence(store, current, retained.artifactId, {
      outcome: 'clear',
    });
    seedCompletionApproval(
      store,
      current,
      retained.subject,
      retained.artifactId,
      'approved',
      [positiveId],
    );
    const negativeId = seedCompletionEvidence(store, current, retained.artifactId, {
      outcome: 'gap',
    });

    assert.throws(() => applyCommand(store, taskCommand(
      'task.transition',
      reviewer,
      current.version,
      {to: 'completed', at: NOW, reason: 'Conflicting evidence must not pass.'},
      'review-lease',
    ), grant(reviewer, 'task.transition', current.version)), error =>
      error.code === 'EVIDENCE_GAP' && /negative|conflict/i.test(error.message));
    assert.equal(readRecord(store, 'task', task.id).body.state, 'in-review');

    seedCompletionEvidence(store, current, retained.artifactId, {
      outcome: 'clear',
      supersedes: [negativeId],
    });
    const completed = applyCommand(store, taskCommand(
      'task.transition',
      reviewer,
      current.version,
      {to: 'completed', at: NOW, reason: 'The negative evidence was explicitly superseded.'},
      'review-lease',
    ), grant(reviewer, 'task.transition', current.version)).data.record;
    assert.equal(completed.body.state, 'completed');
  });
});

test('snapshot and current version stay internally consistent while a writer advances', async () => {
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
      const snapshot = readSubjectView(store, {
        subject: taskSubject(fixtureIds.task),
        recentLimit: 0,
      });
      assert.equal(advanced, true);
      assert.equal(snapshot.throughSeq, 0);
      assert.equal(snapshot.record.version, 1);
      assert.equal(snapshot.record.body.title, 'Demo knowledge Task');
    } finally {
      store.database.prepare = prepare;
      closeStore(writer);
    }
    const current = readSubjectView(store, {
      subject: taskSubject(fixtureIds.task),
      recentLimit: 0,
    });
    assert.equal(current.throughSeq, 1);
    assert.equal(current.record.version, 2);
    assert.equal(current.record.body.title, 'Writer advanced');
  });
});
