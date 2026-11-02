import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {existsSync, mkdirSync, writeFileSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';
import {
  validateTaskBody,
  criteriaRef,
} from '../src/core/lib/coordination-runtime/contract.mjs';
import {
  bindEvidenceRuntime,
  recordApproval,
  registerArtifact,
} from '../src/core/lib/coordination-runtime/evidence.mjs';
import {applyCommand} from '../src/core/lib/coordination-runtime/engine.mjs';
import {
  applyOperation,
  readRecord,
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
const reviewer = {role: 'eng-reviewer-code', runId: 'reviewer-run'};

function knowledgeRevision(root, store) {
  const git = (...args) => execFileSync('git', [
    '--no-pager', '-C', root,
    '-c', 'user.name=Knowledge Test', '-c', 'user.email=knowledge@example.test',
    '-c', 'core.autocrlf=false',
    ...args,
  ], {encoding: 'utf8', windowsHide: true}).trim();
  git('add', '.gitignore', 'docs');
  git('commit', '--quiet', '-m', 'Initial repository');
  const base = git('rev-parse', 'HEAD');
  const directory = join(root, 'docs', 'kai', 'engineering', 'decisions', 'demo');
  mkdirSync(directory, {recursive: true});
  const document = join(directory, 'decision.md');
  writeFileSync(document, '# Proposed decision\n\nUse one canonical document.\n');
  git('add', 'docs');
  git('commit', '--quiet', '-m', 'Propose decision');
  const subject = {kind: 'git', base, head: git('rev-parse', 'HEAD')};
  seedTask(store, {
    state: 'in-review',
    producer_actor: builder,
    producing_actors: [builder],
    next_role: reviewer.role,
    change_ref: subject,
  });
  const artifactId = randomUUID();
  const bind = (actor, action) => {
    const task = readRecord(store, 'task', fixtureIds.task);
    bindEvidenceRuntime(store, {
      root,
      authority: authority(actor, action, {version: task.version}),
      runs: [{actor: builder, directory: '.kai/engineering/reports/demo/scratch'}],
    });
    return task;
  };
  bind(builder, 'artifact.register');
  registerArtifact(store, command('artifact.register', {
    actor: builder,
    payload: {
      artifactId, assetId: randomUUID(), subject, projectId: 'default',
      classification: 'public', mediaType: 'text/markdown', title: 'Decision',
      inputAssetIds: [], at: NOW,
    },
  }));
  const approve = (actor, content = subject) => {
    const task = bind(actor, 'approval.record');
    const approvalId = randomUUID();
    recordApproval(store, command('approval.record', {
      actor,
      expectedVersion: task.version,
      payload: {body: {
        schema_version: 1, approval_id: approvalId,
        subject: {kind: 'task', id: fixtureIds.task},
        authority: actor, kind: 'completion', content_ref: content,
        criteria_ref: criteriaRef(task, (kind, id) => readRecord(store, kind, id)),
        supersedes: [], recovery: null, decision: 'approved',
        evidence_refs: [`artifact:${artifactId}`],
        reason: 'The exact committed decision is accepted.', created_at: NOW,
      }},
    }));
    return readRecord(store, 'approval', approvalId);
  };
  return {git, document, subject, approve};
}

test('knowledge acceptance binds immutable Git bytes without a private authoring copy', async () => {
  await withWorkspace(({root, store}) => {
    const {document, subject, approve} = knowledgeRevision(root, store);
    writeFileSync(document, '# A later uncommitted proposal\n');
    const approved = approve(reviewer);
    assert.deepEqual(approved.body.content_ref, subject);
    const task = readRecord(store, 'task', fixtureIds.task);
    const completed = applyCommand(store, command('task.transition', {
      actor: reviewer, expectedVersion: task.version,
      payload: {to: 'completed', at: NOW, reason: 'The exact Git revision was independently accepted.'},
    }), authority(reviewer, 'task.transition', {version: task.version}));
    assert.equal(completed.data.record.body.state, 'completed');
    assert.deepEqual(completed.data.record.body.change_ref, subject);
    assert.equal(existsSync(join(root, '.kai', 'engineering', 'decisions')), false);
  });
});

test('knowledge acceptance rejects producing sessions and a different Git revision', async () => {
  await withWorkspace(({root, store}) => {
    const {git, document, subject, approve} = knowledgeRevision(root, store);
    assert.throws(() => approve({...reviewer, runId: builder.runId}),
      error => error.code === 'AUTHORITY_REQUIRED' && /producing run/.test(error.message));
    writeFileSync(document, '# A different committed proposal\n');
    git('add', 'docs');
    git('commit', '--quiet', '-m', 'Revise decision');
    assert.throws(() => approve(reviewer, {...subject, head: git('rev-parse', 'HEAD')}),
      error => error.code === 'EVIDENCE_GAP' && /exact content/.test(error.message));
    assert.doesNotThrow(() => approve(reviewer));
  });
});

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
