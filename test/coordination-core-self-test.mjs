import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import test from 'node:test';
import {
  validateTaskBody,
} from '../src/core/lib/coordination-runtime/contract.mjs';
import {applyCommand} from '../src/core/lib/coordination-runtime/engine.mjs';
import {
  applyOperation,
} from '../src/core/lib/coordination-runtime/store.mjs';
import {
  authority,
  command,
  fixtureIds,
  seedTask,
  taskBody,
  withWorkspace,
} from './helpers/coordination-runtime-fixture.mjs';

const NOW = '2026-09-16T12:00:00.000Z';
const LATER = '2099-09-16T13:00:00.000Z';
const steward = {role: 'eng-lead-software', runId: 'steward-run'};
const builder = {role: 'eng-builder-backend', runId: 'builder-run'};

test('standalone Task shape accepts opaque planning refs and rejects retired planning fields', () => {
  const body = taskBody({
    planning_refs: ['project-management:requirement/engineering:requirement:demo@3'],
  });
  assert.equal(validateTaskBody(body), body);
  assert.throws(() => validateTaskBody({
    ...body,
    feature_id: 'engineering:feature:demo',
  }), /unknown field "feature_id"/);
  assert.throws(() => validateTaskBody({
    ...body,
    satisfies: ['engineering:requirement:demo'],
  }), /unknown field "satisfies"/);
});

test('standalone Task create and promote require only Core authority', async () => {
  await withWorkspace(({store}) => {
    const body = taskBody();
    const created = applyCommand(store, command('task.create', {
      actor: steward,
      expectedVersion: 0,
      payload: {body},
    }), authority(steward, 'task.create', {version: 0}));
    assert.equal(created.data.record.body.state, 'proposed');

    const promoted = applyCommand(store, command('task.promote', {
      actor: steward,
      expectedVersion: 1,
      payload: {at: NOW},
    }), authority(steward, 'task.promote'));
    assert.equal(promoted.data.record.body.state, 'ready');
    assert.deepEqual(promoted.data.record.body.planning_refs, []);
  });
});

test('lease collision and optimistic version checks remain enforced', async () => {
  await withWorkspace(({store}) => {
    seedTask(store, {state: 'ready'});
    const granted = applyCommand(store, command('task.grant', {
      actor: steward,
      payload: {
        holder: builder,
        actions: ['task.update', 'task.transition'],
        acquiredAt: NOW,
        expiresAt: LATER,
      },
    }), authority(steward, 'task.grant'));
    assert.equal(granted.data.record.body.state, 'in-progress');
    assert.equal(granted.data.record.body.lease.holder.runId, builder.runId);

    assert.throws(() => applyCommand(store, command('task.grant', {
      actor: steward,
      expectedVersion: 2,
      payload: {
        holder: builder,
        actions: ['task.update'],
        acquiredAt: NOW,
        expiresAt: LATER,
      },
    }), authority(steward, 'task.grant', {version: 2})),
    error => error.code === 'LEASE_CONFLICT');

    assert.throws(() => applyOperation(store, command('task.update', {
      operationId: randomUUID(),
      expectedVersion: 1,
      payload: {title: 'stale'},
    }), current => ({...current.body, title: 'stale'})),
    error => error.code === 'VERSION_CONFLICT');
  });
});

test('Task dependency cycles remain a Core execution refusal', async () => {
  await withWorkspace(({store}) => {
    const other = 'engineering:task:other';
    seedTask(store, {
      id: fixtureIds.task,
      depends_on: [{task: other, requires: 'completed'}],
    });
    assert.throws(() => applyCommand(store, command('task.create', {
      actor: steward,
      recordId: other,
      expectedVersion: 0,
      payload: {body: taskBody({
        id: other,
        title: 'Other Task',
        depends_on: [{task: fixtureIds.task, requires: 'completed'}],
      })},
    }), authority(steward, 'task.create', {
      recordId: other,
      version: 0,
    })), error => error.code === 'INVALID_INPUT'
      && /dependency cycle/.test(error.message));
  });
});
