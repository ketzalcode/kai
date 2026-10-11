import {randomUUID} from 'node:crypto';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {
  closeStore,
  openStore,
} from '../../src/core/lib/coordination-runtime/store.mjs';

export const fixedNow = '2026-09-16T12:00:00.000Z';
export const fixtureIds = Object.freeze({
  task: 'engineering:task:demo',
});

export async function withWorkspace(fn) {
  const root = mkdtempSync(join(tmpdir(), 'kai-core-task-fixture-'));
  mkdirSync(join(root, '.kai', 'core', 'runtime'), {recursive: true});
  mkdirSync(join(root, 'docs', 'kai'), {recursive: true});
  spawnSync('git', ['init', '--quiet', root], {windowsHide: true});
  writeFileSync(join(root, '.gitignore'), '/.kai/\n');
  writeFileSync(join(root, 'docs', 'kai', 'README.md'), '# Kai\n');
  writeFileSync(join(root, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: 'test',
    schema_version: 6,
    scaffolded: fixedNow,
    workspace_id: `test-${randomUUID()}`,
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
  }, null, 2)}\n`);
  const store = openStore({
    path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
    mode: 'create',
  });
  try {
    return await fn({root, store, now: fixedNow});
  } finally {
    closeStore(store);
    rmSync(root, {recursive: true, force: true});
  }
}

export function taskBody(overrides = {}) {
  const body = {
    schema_version: 1,
    id: fixtureIds.task,
    pack: 'engineering',
    planning_refs: [],
    title: 'Demo knowledge Task',
    delivery_class: 'knowledge',
    state: 'proposed',
    resume_state: null,
    scope_authority: 'eng-lead-software',
    completion_authority: 'eng-reviewer-code',
    producer_actor: null,
    producing_actors: [],
    acceptance_actor: null,
    next_role: 'eng-builder-backend',
    outcome: 'Demonstrate standalone Task execution.',
    acceptance: ['The standalone Task behavior is verified.'],
    artifact_expectation: 'none',
    artifact_expectation_reason: 'The product change is the durable result.',
    artifact_class: null,
    durability: null,
    validity_owner: null,
    artifact_targets: [],
    context_artifacts: [],
    touches: ['src/**'],
    depends_on: [],
    lease: null,
    recovery_hold: null,
    waiting_on_questions: [],
    review_requirements: [],
    change_ref: null,
    updated_at: fixedNow,
    ...overrides,
  };
  body.producing_actors ??= body.producer_actor ? [body.producer_actor] : [];
  return body;
}

export function seedRecord(store, record) {
  store.database.prepare(`
    INSERT INTO records (kind, id, subject_kind, subject_id, version, body)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    record.kind,
    record.id,
    record.subject?.kind ?? null,
    record.subject?.id ?? null,
    record.version ?? 1,
    JSON.stringify(record.body),
  );
  return record;
}

export function seedTask(store, overrides = {}) {
  const body = taskBody(overrides);
  return seedRecord(store, {
    kind: 'task',
    id: body.id,
    subject: null,
    version: 1,
    body,
  });
}

export function authority(actor, action, {
  roles = [
    'eng-lead-software',
    'eng-builder-backend',
    'eng-builder-frontend',
    'eng-reviewer-code',
    'eng-lead-technical-writing',
  ],
  recordId = fixtureIds.task,
  version = 1,
} = {}) {
  return {
    roles,
    grants: [{
      actor,
      actions: Array.isArray(action) ? action : [action],
      recordKind: 'task',
      recordId,
      basisRef: `task/${recordId}@${version}`,
    }],
  };
}

export function command(kind, overrides = {}) {
  return {
    operationId: randomUUID(),
    kind,
    actor: {role: 'eng-builder-backend', runId: 'builder-run'},
    recordKind: 'task',
    recordId: fixtureIds.task,
    expectedVersion: 1,
    leaseToken: null,
    payload: {},
    ...overrides,
  };
}
