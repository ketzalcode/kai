import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import test from 'node:test';
import {
  RuntimeError,
  criteriaRef,
  validateRecord,
} from '../scripts/lib/coordination-runtime/contract.mjs';
import {
  projectContext,
  readDetail,
  readMessages,
} from '../scripts/lib/coordination-runtime/context.mjs';
import {applyCommand} from '../scripts/lib/coordination-runtime/engine.mjs';
import {
  applyOperation,
  closeStore,
  openStore,
} from '../scripts/lib/coordination-runtime/store.mjs';
import {
  command,
  seedItem,
  seedRecord,
  withWorkspace,
} from './helpers/coordination-runtime-fixture.mjs';

const NOW = '2026-09-16T12:00:00.000Z';
const SUBJECT = {
  kind: 'sha256',
  path: '.kai/runs/context/subject.txt',
  digest: 'a'.repeat(64),
};

function uuidFor(index) {
  return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

function handoffPayload(index) {
  return {
    did: `Completed step ${index}.`,
    needs: `Review step ${index}.`,
    assetState: 'none — product change',
    authority: 'pending',
    revalidation: 'not applicable',
    questions: [],
  };
}

function messageRecord({
  id,
  itemId = 'demo',
  threadId = itemId,
  kind = 'handoff',
  createdAt = NOW,
  basisVersion = 1,
  payload = handoffPayload(id),
  artifactRefs = [],
  evidenceRefs = [],
}) {
  return validateRecord({
    kind: 'message',
    id,
    itemId,
    version: 1,
    body: {
      schema_version: 1,
      message_id: id,
      thread_id: threadId,
      item_id: itemId,
      parent_id: null,
      sender_role: 'eng-builder-software',
      sender_run: 'context-builder',
      recipient: 'eng-reviewer-code',
      kind,
      created_at: createdAt,
      basis_version: basisVersion,
      payload,
      artifact_refs: artifactRefs,
      evidence_refs: evidenceRefs,
      provenance: 'durable-thread',
    },
  });
}

function appendMessage(store, record, operationId = `message-${record.id}`, questionId = null) {
  seedRecord(store, record);
  const eventKind = record.body.kind === 'handoff'
    ? 'item.handoff'
    : record.body.kind === 'question'
      ? 'question.open'
      : record.body.kind === 'answer'
        ? 'question.answer'
        : 'attempt.recover';
  const payload = {
    kind: eventKind,
    actor: {
      role: record.body.sender_role,
      runId: record.body.sender_run,
    },
    recordKind: 'item',
    recordId: record.itemId,
    payload: record.body.kind === 'recovery'
      ? {attemptId: record.id}
      : {messageId: record.id, ...(questionId ? {questionId} : {})},
  };
  return Number(store.database.prepare(`
    INSERT INTO events (operation_id, item_id, payload)
    VALUES (?, ?, ?)
  `).run(operationId, record.itemId, JSON.stringify(payload)).lastInsertRowid);
}

function appendApproval(store, item, {
  id = randomUUID(),
  decision = 'approved',
  createdAt = NOW,
  reason = 'Declared acceptance decision; evidence is inspected separately.',
  kind = 'completion',
  recovery = null,
} = {}) {
  const record = validateRecord({
    kind: 'approval',
    id,
    itemId: item.id,
    version: 1,
    body: {
      schema_version: 1,
      approval_id: id,
      item_id: item.id,
      authority: {role: recovery ? 'operator' : item.body.completion_authority, runId: 'acceptance-run'},
      kind,
      subject: recovery ? null : item.body.change_ref,
      criteria_ref: criteriaRef(item.body),
      supersedes: [],
      deployment: null,
      recovery,
      decision,
      evidence_refs: ['legacy/acceptance-report.txt'],
      reason,
      created_at: createdAt,
    },
  });
  seedRecord(store, record);
  const event = {
    kind: 'approval.record',
    actor: record.body.authority,
    recordKind: 'item',
    recordId: item.id,
    payload: {body: record.body},
  };
  const eventSeq = Number(store.database.prepare(`
    INSERT INTO events (operation_id, item_id, payload)
    VALUES (?, ?, ?)
  `).run(`approval-${id}`, item.id, JSON.stringify(event)).lastInsertRowid);
  return {...record, eventSeq};
}

function seedBlockingQuestion(store, itemId = 'demo', {
  index = 900001,
  blocking = true,
  context = 'The exact rollout boundary must remain visible without truncation.',
} = {}) {
  const messageId = uuidFor(index);
  const questionId = `context-question-${index}`;
  appendMessage(store, messageRecord({
    id: messageId,
    itemId,
    kind: 'question',
    payload: {
      questionKind: 'decision',
      blocking,
      context,
      ask: 'Approve the explicit bounded rollout?',
      answerBy: 'before implementation resumes',
    },
  }), `message-${messageId}`, questionId);
  seedRecord(store, validateRecord({
    kind: 'question',
    id: questionId,
    itemId,
    version: 1,
    body: {
      schema_version: 1,
      question_id: questionId,
      item_id: itemId,
      asker: {role: 'eng-builder-software', runId: 'context-builder'},
      recipient: 'eng-reviewer-code',
      kind: 'decision',
      blocking,
      status: 'open',
      context,
      ask: 'Approve the explicit bounded rollout?',
      answer_by: 'before implementation resumes',
      opened_message_id: messageId,
      answer_message_ids: [],
      resolution: null,
    },
  }));
  return {messageId, questionId};
}

function seedRecoveryHold(store, {observed = 'Conflicting edits need an exact operator resolution.'} = {}) {
  const id = uuidFor(910001);
  const evidenceId = uuidFor(910002);
  const staleLease = {
    holder: {role: 'eng-builder-software', runId: 'lost-builder'},
    token: 'stale-context-lease',
    version_at_grant: 1,
    acquired_at: '2026-09-15T10:00:00.000Z',
    expires_at: '2026-09-15T11:00:00.000Z',
  };
  const attempt = validateRecord({
    kind: 'attempt', id, itemId: 'demo', version: 1,
    body: {
      schema_version: 1, attempt_id: id, item_id: 'demo',
      grantor: {role: 'eng-lead-architecture', runId: 'recovery-steward'},
      stale_lease: staleLease, observed, disposition: 'conflicting-partial-work',
      recovery_evidence_ids: [evidenceId], new_lease: null, created_at: NOW,
    },
  });
  seedRecord(store, attempt);
  seedRecord(store, validateRecord({
    kind: 'evidence', id: evidenceId, itemId: 'demo', version: 1,
    body: {
      schema_version: 1, evidence_id: evidenceId, item_id: 'demo',
      kind: 'recovery-reconciliation', subject: null, criteria_ref: null,
      supersedes: [], dimension: null, outcome: 'passed',
      evidence_refs: ['retained/reconciliation.txt'], reason: observed,
      data: {
        stale_lease_token: staleLease.token,
        disposition: 'conflicting-partial-work', observed,
      },
      created_at: NOW,
    },
  }));
  appendMessage(store, messageRecord({
    id, kind: 'recovery', evidenceRefs: [evidenceId],
    payload: {
      observed, disposition: 'conflicting-partial-work',
      staleLeaseToken: staleLease.token, newLeaseToken: null,
    },
  }));
  const item = seedItem(store, {
    state: 'blocked', resume_state: 'in-progress', recovery_hold: id,
    next_role: 'operator',
  });
  return {attempt, item, evidenceId};
}

// Observe real SQLite statements, rows, and plans; no query results are replaced.
function observeQueries(database, run) {
  const prepare = database.prepare;
  const calls = [];
  database.prepare = function(sql) {
    const statement = prepare.call(this, sql);
    return new Proxy(statement, {
      get(target, key) {
        if (key === 'all' || key === 'get') return (...args) => {
          const result = target[key](...args);
          if (/^\s*(SELECT|WITH)\b/i.test(sql)) {
            calls.push({
              sql,
              rows: key === 'all' ? result.length : Number(result !== undefined),
              plan: prepare.call(database, `EXPLAIN QUERY PLAN ${sql}`).all(...args)
                .map(row => row.detail),
            });
          }
          return result;
        };
        const value = Reflect.get(target, key, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  };
  try {
    return {result: run(), calls};
  } finally {
    database.prepare = prepare;
  }
}

await test('recovery hold and operator resolution survive zero recent messages and window eviction', async () => {
  await withWorkspace(({store}) => {
    const {attempt, evidenceId} = seedRecoveryHold(store);
    insertMessageHistory(store, 12);
    for (const recentLimit of [0, 8]) {
      const projection = projectContext(store, {itemId: 'demo', recentLimit});
      const packet = JSON.parse(projection.text);
      assert.equal(packet.item.recovery_hold, attempt.id);
      assert.equal(packet.recovery_hold.observed, attempt.body.observed);
      assert.equal(packet.recovery_hold.disposition, 'conflicting-partial-work');
      assert.equal(packet.recovery_hold.required_resolution.authority, 'operator');
      assert.equal(packet.recovery_hold.required_resolution.attempt_id, attempt.id);
      assert.equal(packet.recovery_hold.required_resolution.stale_lease_token, 'stale-context-lease');
      assert.ok(projection.references.some(ref => ref.kind === 'attempt' && ref.id === attempt.id));
      assert.ok(projection.references.some(ref => ref.kind === 'evidence' && ref.id === evidenceId));
    }
  });
});

await test('readable criteria obligations survive recentLimit zero, not just their hash', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      review_requirements: [{role: 'eng-reviewer-quality', kind: 'behavior-regression'}],
      artifact_expectation: 'owed', artifact_expectation_reason: 'A reusable runbook is owed.',
      artifact_class: 'runbook', durability: 'durable', validity_owner: 'eng-lead-architecture',
      artifact_targets: ['docs/runbook.md', 'docs/recovery.md'],
    });
    const packet = JSON.parse(projectContext(store, {itemId: 'demo', recentLimit: 0}).text);
    assert.deepEqual(packet.review_requirements,
      [{role: 'eng-reviewer-quality', kind: 'behavior-regression'}]);
    assert.deepEqual(packet.artifact_obligations, {
      artifact_expectation: 'owed', artifact_expectation_reason: 'A reusable runbook is owed.',
      artifact_class: 'runbook', durability: 'durable', validity_owner: 'eng-lead-architecture',
      artifact_targets: ['docs/runbook.md', 'docs/recovery.md'],
    });
  });
});

await test('nine nonblocking unresolved questions all survive the recent window and recentLimit zero', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'in-progress'});
    const questions = Array.from({length: 9}, (_, index) =>
      seedBlockingQuestion(store, 'demo', {index: 920000 + index, blocking: false}));
    for (const recentLimit of [8, 0]) {
      const projection = projectContext(store, {itemId: 'demo', recentLimit});
      const packet = JSON.parse(projection.text);
      assert.equal(packet.unresolved_questions?.length, 9);
      assert.deepEqual(packet.blockers, []);
      assert.deepEqual(packet.unresolved_questions.map(question => question.disposition),
        Array(9).fill('nonblocking'));
      assert.deepEqual(packet.unresolved_questions.map(question => question.blocking),
        Array(9).fill(false));
      for (const question of questions) {
        assert.ok(projection.references.some(ref => ref.kind === 'question' && ref.id === question.questionId));
        assert.ok(projection.references.some(ref => ref.kind === 'message' && ref.id === question.messageId));
      }
    }
  });
});

await test('a deleted nonblocking question referenced by its opening event is a typed gap after eviction', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'in-progress'});
    const question = seedBlockingQuestion(store, 'demo', {blocking: false});
    insertMessageHistory(store, 12);
    store.database.prepare("DELETE FROM records WHERE kind = 'question' AND id = ?")
      .run(question.questionId);
    assert.throws(() => projectContext(store, {itemId: 'demo', recentLimit: 0}),
      error => error.code === 'EVIDENCE_GAP');
  });
});

await test('persisted recovery resolution retains its exact reason and binding, without releasing the hold', async () => {
  await withWorkspace(({store}) => {
    const {item, attempt} = seedRecoveryHold(store);
    const reason = 'Keep this entire operator resolution. '.repeat(35);
    const binding = {
      attempt_id: attempt.id, stale_lease_token: 'stale-context-lease',
      disposition: 'safe-to-resume', resume_role: 'eng-builder-software',
    };
    const approval = appendApproval(store, item, {
      kind: 'operator-recovery-resolution', reason, recovery: binding,
    });
    insertMessageHistory(store, 12);
    const projection = projectContext(store, {itemId: 'demo', recentLimit: 0});
    const packet = JSON.parse(projection.text);
    assert.deepEqual(packet.decisions[0].recovery, binding);
    assert.equal(packet.decisions[0].reason, reason);
    assert.equal(packet.item.recovery_hold, attempt.id);
    assert.ok(projection.references.some(ref => ref.kind === 'approval' && ref.id === approval.id));
  });
});

await test('mandatory reference lists are complete beyond sixteen entries and charged to the budget', async () => {
  await withWorkspace(({store}) => {
    const refs = Array.from({length: 17}, (_, index) => `retained/obligation-${index}.txt`);
    seedItem(store, {context_artifacts: refs});
    const projection = projectContext(store, {itemId: 'demo', recentLimit: 0});
    assert.deepEqual(JSON.parse(projection.text).selected_artifact_evidence_references, refs);
    const item = readDetail(store, {kind: 'item', id: 'demo'});
    item.body.context_artifacts[16] = `retained/${'義'.repeat(9000)}`;
    store.database.prepare("UPDATE records SET body = ? WHERE kind = 'item' AND id = 'demo'")
      .run(JSON.stringify(item.body));
    assert.throws(() => projectContext(store, {itemId: 'demo', recentLimit: 0}),
      error => error.code === 'CONTEXT_BUDGET');
  });
});

await test('terminal unresolved questions remain historical follow-ups, not live blockers', async () => {
  for (const state of ['completed', 'shipped', 'dropped']) {
    await withWorkspace(({store}) => {
      const question = seedBlockingQuestion(store);
      seedItem(store, {state, waiting_on_questions: [question.questionId]});
      const packet = JSON.parse(projectContext(store, {itemId: 'demo', recentLimit: 0}).text);
      assert.deepEqual(packet.blockers, []);
      assert.equal(packet.unresolved_questions[0].disposition, 'historical-follow-up');
      assert.equal(packet.unresolved_questions[0].blocking, true);
    });
  }
});

await test('late answered blockers on terminal work stay historical and remain readable', async () => {
  await withWorkspace(({store}) => {
    const question = seedBlockingQuestion(store);
    seedItem(store, {
      state: 'blocked',
      resume_state: 'in-progress',
      waiting_on_questions: [question.questionId],
      lease: null,
    });

    const dropped = applyCommand(store, command('item.transition', {
      actor: {role: 'eng-lead-architecture', runId: 'steward-run'},
      expectedVersion: 1,
      payload: {
        to: 'dropped',
        at: NOW,
        reason: 'The prerequisite was abandoned.',
      },
    }), {
      roles: ['eng-lead-architecture'],
      grants: [{
        actor: {role: 'eng-lead-architecture', runId: 'steward-run'},
        actions: ['item.transition'],
        recordKind: 'item',
        recordId: 'demo',
        basisRef: 'item/demo@1',
      }],
    });
    assert.equal(dropped.data.record.body.state, 'dropped');

    const answered = applyCommand(store, command('question.answer', {
      actor: {role: 'eng-reviewer-code', runId: 'review-run'},
      expectedVersion: dropped.data.record.version,
      payload: {
        questionId: question.questionId,
        messageId: randomUUID(),
        parentId: question.messageId,
        recipient: 'eng-builder-software',
        kind: 'answer',
        createdAt: NOW,
        content: {
          status: 'answered',
          answer: 'Proceed after the drop.',
          lane: 'in-lane',
        },
        artifactRefs: [],
        evidenceRefs: [],
        provenance: 'durable-thread',
      },
    }), {
      roles: ['eng-reviewer-code'],
      grants: [],
    });
    assert.equal(answered.data.record.body.state, 'dropped');
    assert.equal(readDetail(store, {kind: 'question', id: question.questionId}).body.status, 'answered');

    const packet = JSON.parse(projectContext(store, {itemId: 'demo', recentLimit: 0}).text);
    const historical = packet.unresolved_questions.find(entry => entry.ref === `question:${question.questionId}`);
    assert.ok(historical);
    assert.equal(historical.status, 'answered');
    assert.equal(historical.disposition, 'historical-follow-up');
    assert.deepEqual(packet.blockers, []);

    store.database.prepare('DELETE FROM records WHERE kind = ? AND id = ?')
      .run('question', question.questionId);
    assert.throws(() => projectContext(store, {itemId: 'demo', recentLimit: 0}),
      error => error.code === 'EVIDENCE_GAP');
  });
});

await test('missing referenced holds, questions and opening messages are typed gaps with no recent messages', async t => {
  for (const missing of ['attempt', 'question', 'message', 'evidence']) {
    await t.test(missing, () => withWorkspace(({store}) => {
      let id;
      if (missing === 'attempt' || missing === 'evidence') {
        const held = seedRecoveryHold(store);
        id = missing === 'attempt' ? held.attempt.id : held.evidenceId;
      } else {
        const question = seedBlockingQuestion(store);
        seedItem(store, {
          state: 'blocked', resume_state: 'in-progress',
          waiting_on_questions: [question.questionId],
        });
        id = missing === 'question' ? question.questionId : question.messageId;
      }
      store.database.prepare('DELETE FROM records WHERE kind = ? AND id = ?').run(missing, id);
      assert.throws(() => projectContext(store, {itemId: 'demo', recentLimit: 0}),
        error => error.code === 'EVIDENCE_GAP', `missing ${missing} must not disappear`);
    }));
  }
});

await test('all mandatory obligation, hold, question and reference bytes overflow explicitly at 24 KiB', async t => {
  const huge = '義務😀'.repeat(4000);
  for (const field of [
    'review_requirements', 'artifact_expectation_reason', 'artifact_class', 'durability',
    'validity_owner', 'artifact_targets', 'context_artifacts', 'hold', 'question',
  ]) {
    await t.test(field, () => withWorkspace(({store}) => {
      if (field === 'hold') seedRecoveryHold(store, {observed: huge});
      else if (field === 'question') {
        seedItem(store, {state: 'in-progress'});
        seedBlockingQuestion(store, 'demo', {blocking: false, context: huge});
      } else {
        seedItem(store, {
          [field]: field === 'review_requirements' ? [{role: 'eng-reviewer-quality', kind: huge}]
            : field.endsWith('_targets') || field === 'context_artifacts' ? [huge] : huge,
        });
      }
      assert.throws(() => projectContext(store, {itemId: 'demo', recentLimit: 0}),
        error => error.code === 'CONTEXT_BUDGET' && /limit is 24576/.test(error.message), field);
    }));
  }
});

function insertMessageHistory(store, count, {threadId = 'demo', itemId = 'demo'} = {}) {
  const insertRecord = store.database.prepare(`
    INSERT INTO records (kind, id, item_id, version, body)
    VALUES ('message', ?, ?, 1, ?)
  `);
  const insertEvent = store.database.prepare(`
    INSERT INTO events (operation_id, item_id, payload)
    VALUES (?, ?, ?)
  `);
  store.database.exec('BEGIN');
  try {
    for (let index = 1; index <= count; index += 1) {
      const id = uuidFor(index);
      const record = messageRecord({
        id,
        itemId,
        threadId,
        createdAt: new Date(Date.parse(NOW) - index * 1000).toISOString(),
        payload: handoffPayload(index),
      });
      insertRecord.run(id, itemId, JSON.stringify(record.body));
      insertEvent.run(`bulk-message-${index}`, itemId, JSON.stringify({
        kind: 'item.handoff',
        actor: {role: record.body.sender_role, runId: record.body.sender_run},
        recordKind: 'item',
        recordId: itemId,
        payload: {messageId: id},
      }));
    }
    store.database.exec('COMMIT');
  } catch (error) {
    store.database.exec('ROLLBACK');
    throw error;
  }
}

await test('project context is deterministic, bounded, complete, and ordered by events', async () => {
  await withWorkspace(({store}) => {
    const blocker = seedBlockingQuestion(store);
    const item = seedItem(store, {
      state: 'blocked',
      resume_state: 'in-progress',
      waiting_on_questions: [blocker.questionId],
      change_ref: SUBJECT,
      acceptance: [
        'Preserve every required acceptance criterion.',
        'Count UTF-8 bytes rather than JavaScript code units.',
      ],
    });
    const decision = appendApproval(store, item, {
      createdAt: '1999-01-01T00:00:00.000Z',
    });
    for (let index = 1; index <= 12; index += 1) {
      appendMessage(store, messageRecord({
        id: uuidFor(200 - index),
        createdAt: new Date(Date.parse(NOW) - index * 86_400_000).toISOString(),
      }));
    }

    const before = {
      records: store.database.prepare('SELECT count(*) AS count FROM records').get().count,
      events: store.database.prepare('SELECT count(*) AS count FROM events').get().count,
      operations: store.database.prepare('SELECT count(*) AS count FROM operations').get().count,
      changes: store.database.prepare('SELECT total_changes() AS count').get().count,
    };
    const first = projectContext(store, {itemId: 'demo'});
    const second = projectContext(store, {itemId: 'demo'});
    const packet = JSON.parse(first.text);

    assert.deepEqual(second, first);
    assert.ok(first.bytes <= 24576);
    assert.equal(first.bytes, Buffer.byteLength(first.text, 'utf8'));
    assert.equal(packet.through_seq, first.throughSeq);
    assert.deepEqual(packet.references, first.references);
    assert.deepEqual(packet.history_cursor, first.historyCursor);
    assert.equal(packet.authority.completion_authority, 'eng-reviewer-code');
    assert.deepEqual(packet.acceptance, item.body.acceptance);
    assert.equal(packet.revision.item_version, 1);
    assert.equal(packet.revision.criteria_ref, criteriaRef(item.body));
    assert.deepEqual(packet.revision.change_ref, SUBJECT);
    assert.equal(packet.blockers[0].ask, 'Approve the explicit bounded rollout?');
    assert.equal(packet.decisions[0].decision, 'approved');
    assert.equal(packet.decisions[0].evidence_verification, 'not_performed');
    assert.equal(packet.decisions[0].ref, `approval:${decision.id}`);
    assert.equal(packet.recent_messages.length, 8);
    assert.deepEqual(
      packet.recent_messages.map(message => message.ref),
      Array.from({length: 8}, (_, offset) => `message:${uuidFor(195 - offset)}`),
      'the newest persisted event sequences are selected and displayed chronologically',
    );
    assert.equal(first.historyCursor.remainingCount, 5);
    assert.ok(first.references.some(ref =>
      ref.kind === 'question' && ref.id === blocker.questionId));
    assert.ok(first.references.some(ref =>
      ref.kind === 'message' && ref.id === blocker.messageId));
    const requiredOnly = projectContext(store, {itemId: 'demo', recentLimit: 0});
    const constrained = projectContext(store, {
      itemId: 'demo',
      maxBytes: requiredOnly.bytes,
      recentLimit: 8,
    });
    assert.equal(JSON.parse(constrained.text).recent_messages.length, 0);
    assert.equal(constrained.historyCursor.remainingCount, 13);
    assert.deepEqual({
      records: store.database.prepare('SELECT count(*) AS count FROM records').get().count,
      events: store.database.prepare('SELECT count(*) AS count FROM events').get().count,
      operations: store.database.prepare('SELECT count(*) AS count FROM operations').get().count,
      changes: store.database.prepare('SELECT total_changes() AS count').get().count,
    }, before, 'all context reads leave SQLite state unchanged');

    assert.throws(() => projectContext(store, {itemId: 'demo', maxBytes: 1}),
      error => error.code === 'CONTEXT_BUDGET');
  });
});

await test('mandatory Unicode context uses actual UTF-8 bytes and never truncates acceptance', async () => {
  await withWorkspace(({store}) => {
    const acceptance = `Required criterion ${'😀'.repeat(700)}`;
    seedItem(store, {acceptance: [acceptance]});
    assert.throws(
      () => projectContext(store, {itemId: 'demo', maxBytes: 2500}),
      error => error instanceof RuntimeError
        && error.code === 'CONTEXT_BUDGET'
        && /Required context uses \d+ bytes; limit is 2500/.test(error.message),
    );
    const projection = projectContext(store, {itemId: 'demo', maxBytes: 8192});
    assert.equal(JSON.parse(projection.text).acceptance[0], acceptance);
    assert.equal(projection.bytes, Buffer.byteLength(projection.text, 'utf8'));
  });
});

await test('huge mandatory blockers overflow rather than being truncated or suppressed', async () => {
  await withWorkspace(({store}) => {
    const {questionId} = seedBlockingQuestion(store);
    seedItem(store, {
      state: 'blocked',
      resume_state: 'in-progress',
      waiting_on_questions: [questionId],
      acceptance: [`Mandatory ${'criterion '.repeat(800)}`],
    });
    assert.throws(
      () => projectContext(store, {itemId: 'demo', maxBytes: 4096}),
      error => error.code === 'CONTEXT_BUDGET',
    );
  });
});

await test('projection sequence advances without mutating or retroactively changing old snapshots', async () => {
  await withWorkspace(({store}) => {
    seedItem(store);
    const before = projectContext(store, {itemId: 'demo'});
    applyOperation(
      store,
      command('item.update', {payload: {title: 'Advanced snapshot'}}),
      current => ({...current.body, title: 'Advanced snapshot'}),
    );
    const after = projectContext(store, {itemId: 'demo'});
    assert.equal(JSON.parse(before.text).item.title, 'Demo knowledge item');
    assert.equal(JSON.parse(before.text).revision.item_version, 1);
    assert.equal(JSON.parse(after.text).item.title, 'Advanced snapshot');
    assert.equal(JSON.parse(after.text).revision.item_version, 2);
    assert.ok(after.throughSeq > before.throughSeq);
  });
});

await test('projection holds one SQLite snapshot while a WAL writer advances', async () => {
  await withWorkspace(({store}) => {
    store.database.exec('PRAGMA journal_mode=WAL');
    const item = seedItem(store, {change_ref: SUBJECT});
    const firstMessage = messageRecord({id: uuidFor(600001)});
    appendMessage(store, firstMessage);
    const firstApproval = appendApproval(store, item);
    const initialThroughSeq = store.database.prepare(
      'SELECT MAX(seq) AS seq FROM events',
    ).get().seq;
    const writer = openStore({path: store.path, mode: 'write'});
    const prepare = store.database.prepare;
    let advanced = false;
    try {
      store.database.prepare = function(sql) {
        if (!advanced && /\bFROM records\b/i.test(sql)) {
          advanced = true;
          const secondMessage = messageRecord({id: uuidFor(600002)});
          const secondApprovalId = uuidFor(600003);
          const secondApproval = validateRecord({
            kind: 'approval',
            id: secondApprovalId,
            itemId: item.id,
            version: 1,
            body: {
              ...readDetail(writer, {kind: 'approval', id: firstApproval.id}).body,
              approval_id: secondApprovalId,
            },
          });
          applyOperation(
            writer,
            command('item.update', {payload: {title: 'Writer advanced'}}),
            (current, tx) => {
              tx.put(secondMessage);
              tx.put(secondApproval);
              tx.appendEvent({
                kind: 'item.handoff',
                actor: {
                  role: secondMessage.body.sender_role,
                  runId: secondMessage.body.sender_run,
                },
                recordKind: 'item',
                recordId: item.id,
                payload: {messageId: secondMessage.id},
              });
              tx.appendEvent({
                kind: 'approval.record',
                actor: secondApproval.body.authority,
                recordKind: 'item',
                recordId: item.id,
                payload: {body: secondApproval.body},
              });
              return {...current.body, title: 'Writer advanced'};
            },
          );
        }
        return prepare.call(this, sql);
      };

      const projection = projectContext(store, {itemId: 'demo'});
      const packet = JSON.parse(projection.text);
      assert.equal(advanced, true);
      assert.equal(projection.throughSeq, initialThroughSeq);
      assert.equal(packet.item.title, 'Demo knowledge item');
      assert.equal(packet.revision.item_version, 1);
      assert.equal(packet.recent_messages.length, 1);
      assert.equal(packet.decisions.length, 1);
    } finally {
      store.database.prepare = prepare;
      closeStore(writer);
    }

    const advancedProjection = JSON.parse(projectContext(store, {itemId: 'demo'}).text);
    assert.equal(advancedProjection.item.title, 'Writer advanced');
    assert.equal(advancedProjection.revision.item_version, 2);
    assert.equal(advancedProjection.recent_messages.length, 2);
    assert.equal(advancedProjection.decisions.length, 2);
  });
});

await test('detail reads are exact, historical, read-only, and report missing references as gaps', async () => {
  await withWorkspace(({store}) => {
    const item = seedItem(store, {change_ref: SUBJECT});
    const rejected = appendApproval(store, item, {decision: 'rejected'});
    assert.equal(
      readDetail(store, {kind: 'approval', id: rejected.id}).body.decision,
      'rejected',
      'historical inspection does not require current acceptance to be green',
    );
    assert.throws(
      () => readDetail(store, {kind: 'artifact', id: randomUUID()}),
      error => error.code === 'EVIDENCE_GAP',
    );
    assert.throws(
      () => readDetail(store, {kind: 'unknown', id: 'x'}),
      error => error.code === 'INVALID_INPUT',
    );
  });

  await withWorkspace(({store}) => {
    seedItem(store, {
      context_artifacts: [`artifact:${uuidFor(700001)}`],
    });
    assert.throws(
      () => projectContext(store, {itemId: 'demo'}),
      error => error.code === 'EVIDENCE_GAP',
    );
  });
});

await test('10,000 messages keep projection metadata bounded and remain pageable', async () => {
  await withWorkspace(({store}) => {
    seedItem(store);
    insertMessageHistory(store, 10_000);
    const contextQueries = observeQueries(store.database,
      () => projectContext(store, {itemId: 'demo'}));
    const projection = contextQueries.result;
    const packet = JSON.parse(projection.text);

    assert.ok(projection.bytes <= 24576);
    assert.equal(packet.recent_messages.length, 8);
    assert.equal(projection.historyCursor.remainingCount, 9_992);
    assert.deepEqual(Object.keys(projection.historyCursor).sort(),
      ['beforeSeq', 'remainingCount', 'threadId']);
    assert.ok(projection.references.length <= 8,
      'history size cannot make projection reference metadata grow');
    assert.doesNotMatch(projection.text, new RegExp(uuidFor(1)));

    const seen = new Set(packet.recent_messages.map(message => message.ref.slice('message:'.length)));
    let cursor = projection.historyCursor;
    let retrieved = 0;
    const pageCalls = [];
    let pageCount = 0;
    while (cursor) {
      const observed = observeQueries(store.database, () => readMessages(store, {
        threadId: cursor.threadId,
        beforeSeq: cursor.beforeSeq,
        remainingCount: -999, // Never trust caller counts to terminate pagination.
        limit: 97,
      }));
      const page = observed.result;
      assert.equal(page.hasMore, page.nextCursor !== null);
      if (page.nextCursor) assert.deepEqual(Object.keys(page.nextCursor).sort(), ['beforeSeq', 'threadId']);
      pageCalls.push(...observed.calls);
      pageCount += 1;
      assert.ok(page.messages.length <= 97);
      for (let index = 1; index < page.messages.length; index += 1) {
        assert.ok(page.messages[index - 1].eventSeq > page.messages[index].eventSeq);
      }
      for (const message of page.messages) {
        assert.equal(message.body.thread_id, 'demo');
        assert.equal(seen.has(message.id), false);
        seen.add(message.id);
      }
      retrieved += page.messages.length;
      cursor = page.nextCursor;
    }
    assert.equal(retrieved, 9_992);
    assert.equal(seen.size, 10_000);
    assert.equal(readDetail(store, {kind: 'message', id: uuidFor(1)}).id, uuidFor(1));
    const contextRows = contextQueries.calls.reduce((sum, call) => sum + call.rows, 0);
    const suffixCounts = pageCalls.filter(call => /\bCOUNT\s*\(/i.test(call.sql)).length;
    console.log(JSON.stringify({
      history: 10_000, contextRows, pageCount, suffixCounts,
      pageRows: pageCalls.reduce((sum, call) => sum + call.rows, 0),
      firstPagePlan: pageCalls[0].plan, lastPagePlan: pageCalls.at(-1).plan,
    }));
    assert.ok(contextRows <= 40, `bounded snapshot must not materialize history: ${contextRows} rows`);
    assert.equal(suffixCounts, 0, 'continuation pages must never recount the remaining suffix');
    assert.ok(pageCalls.every(call => call.rows <= 98), 'each keyset query reads at most LIMIT + 1');
    assert.ok(pageCalls.every(call => call.plan.every(detail =>
      !/\bSCAN\b|USE TEMP B-TREE/i.test(detail))), 'all history page plans must use indexed seeks without sorting');
    assert.ok(pageCalls.every(call => call.plan.some(detail =>
      /SEARCH.*thread_id=\?.*seq<\?/i.test(detail))), 'each page seeks the thread and beforeSeq key');
    assert.equal(pageCalls.length, pageCount, 'one bounded SELECT per continuation, no side scans');
    assert.ok(pageCalls.reduce((sum, call) => sum + call.rows, 0) <= 9_992 + pageCount);
  });
});

await test('1,000-message projection selects a bounded snapshot without event payload reads', async () => {
  await withWorkspace(({store}) => {
    seedItem(store);
    insertMessageHistory(store, 1000);
    const {result, calls} = observeQueries(store.database,
      () => projectContext(store, {itemId: 'demo'}));
    assert.equal(result.historyCursor.remainingCount, 992);
    const rows = calls.reduce((sum, call) => sum + call.rows, 0);
    console.log(JSON.stringify({history: 1000, contextRows: rows, plans: calls.map(call => call.plan)}));
    assert.ok(rows <= 40, `bounded snapshot must not materialize history: ${rows} rows`);
    assert.ok(calls.every(call => !/\bSELECT\s+seq,\s*payload/i.test(call.sql)));
    assert.ok(calls.some(call => call.plan.some(detail =>
      /records_by_question_status.*item_id=\?.*<expr>=\?/.test(detail))),
    'select open questions through the status index, not all historical question bodies');
  });
});

await test('thread identity survives missing cross-item detail and late insertion repairs event scoping', async () => {
  await withWorkspace(({store}) => {
    const id = uuidFor(990001);
    const eventSeq = Number(store.database.prepare(`
      INSERT INTO events(operation_id, item_id, payload) VALUES (?, ?, ?)
    `).run('late-message', 'other-item', JSON.stringify({
      kind: 'item.handoff', payload: {messageId: id},
    })).lastInsertRowid);
    assert.throws(() => readMessages(store, {threadId: 'other-item'}),
      error => error.code === 'EVIDENCE_GAP');
    seedRecord(store, messageRecord({id, itemId: 'other-item', threadId: 'demo'}));
    assert.deepEqual(readMessages(store, {threadId: 'other-item'}).messages, []);
    const page = readMessages(store, {threadId: 'demo'});
    assert.equal(page.messages[0].eventSeq, eventSeq);
    assert.equal(page.hasMore, false);
    store.database.prepare("DELETE FROM records WHERE kind = 'message' AND id = ?").run(id);
    assert.throws(() => readMessages(store, {threadId: 'demo'}),
      error => error.code === 'EVIDENCE_GAP', 'deletion must not erase the indexed thread identity');
  });
});

await test('message pagination scopes and validates thread cursors and limits', async () => {
  await withWorkspace(({store}) => {
    seedItem(store);
    appendMessage(store, messageRecord({id: uuidFor(800001)}));
    appendMessage(store, messageRecord({
      id: uuidFor(800002),
      itemId: 'other',
      threadId: 'other-thread',
    }));
    appendMessage(store, messageRecord({
      id: uuidFor(800003),
      itemId: 'other',
      threadId: 'demo',
    }));
    assert.deepEqual(
      readMessages(store, {threadId: 'demo', limit: 10}).messages.map(message => message.id),
      [uuidFor(800003), uuidFor(800001)],
    );
    for (const options of [
      {threadId: '', limit: 10},
      {threadId: 'demo', beforeSeq: 0, limit: 10},
      {threadId: 'demo', beforeSeq: 1.5, limit: 10},
      {threadId: 'demo', limit: 0},
      {threadId: 'demo', limit: 101},
    ]) {
      assert.throws(() => readMessages(store, options),
        error => error.code === 'INVALID_INPUT');
    }
    assert.throws(() => projectContext(store, {itemId: '', recentLimit: 8}),
      error => error.code === 'INVALID_INPUT');
    assert.throws(() => projectContext(store, {itemId: 'demo', recentLimit: 9}),
      error => error.code === 'INVALID_INPUT');
    store.database.prepare(`
      INSERT INTO events (operation_id, item_id, payload)
      VALUES (?, ?, ?)
    `).run('missing-message-event', 'demo', JSON.stringify({
      kind: 'item.handoff',
      actor: {role: 'eng-builder-software', runId: 'missing-message'},
      recordKind: 'item',
      recordId: 'demo',
      payload: {messageId: uuidFor(899999)},
    }));
    assert.throws(() => readMessages(store, {threadId: 'demo'}),
      error => error.code === 'EVIDENCE_GAP');
  });
});

console.log('✓ coordination-context self-test: all checks passed');
