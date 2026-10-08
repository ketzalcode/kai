import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {tmpdir} from 'node:os';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  closeStore,
  openStore,
} from '../../src/core/lib/coordination-runtime/store.mjs';
import {canonicalPath} from '../../src/core/lib/workspace-path-safety.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixedNow = '2026-09-16T12:00:00.000Z';
const directionBytes = [
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

export const fixtureIds = Object.freeze({
  epic: 'epic:demo',
  feature: 'engineering:feature:demo',
  requirement: 'engineering:requirement:demo',
  task: 'engineering:task:demo',
});

export function allocateTemporaryRoot(prefix, checkoutRoot = repoRoot) {
  const temporaryDirectory = canonicalPath(tmpdir());
  const checkout = canonicalPath(checkoutRoot);
  const pathFromCheckout = relative(checkout, temporaryDirectory);
  const outsideCheckout = pathFromCheckout === '..'
    || pathFromCheckout.startsWith(`..${sep}`)
    || isAbsolute(pathFromCheckout);
  if (!outsideCheckout) {
    throw new Error(
      `OS temporary directory must be outside checkout: ${temporaryDirectory} is within ${checkout}`,
    );
  }
  return mkdtempSync(join(temporaryDirectory, prefix));
}

export async function withWorkspace(fn) {
  const root = allocateTemporaryRoot('kai-coordination-runtime-fixture-');
  const runtimeDirectory = join(root, '.kai', 'core', 'runtime');
  mkdirSync(runtimeDirectory, {recursive: true});
  mkdirSync(join(root, 'docs', 'kai'), {recursive: true});
  spawnSync('git', ['init', '--quiet', root], {windowsHide: true});
  writeFileSync(join(root, '.gitignore'), '/.kai/\n');
  writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), directionBytes);
  writeFileSync(join(root, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: 'test',
    schema_version: 5,
    scaffolded: fixedNow,
    workspace_id: `test-${randomUUID()}`,
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    direction: 'docs/kai/DIRECTION.md',
    projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
  }, null, 2)}\n`);
  const store = openStore({
    path: join(runtimeDirectory, 'coordination.sqlite'),
    mode: 'create',
  });
  try {
    return await fn({root, store, now: fixedNow});
  } finally {
    closeStore(store);
    rmSync(root, {recursive: true, force: true});
  }
}

function seedActiveTaskAncestors(store, body) {
  const directionRef = {
    path: 'docs/kai/DIRECTION.md',
    hash: createHash('sha256').update(directionBytes).digest('hex'),
    goal: 'Exercise Task runtime behavior.',
  };
  const requirementIds = [...new Set(body.satisfies)];
  const existingFeature = store.database.prepare(
    "SELECT body FROM records WHERE kind = 'feature' AND id = ?",
  ).get(body.feature_id);
  const epicId = existingFeature
    ? JSON.parse(existingFeature.body).epic_id
    : fixtureIds.epic;
  if (!store.database.prepare(
    "SELECT 1 FROM records WHERE kind = 'epic' AND id = ?",
  ).get(epicId)) {
    seedRecord(store, {
      kind: 'epic',
      id: epicId,
      subject: null,
      version: 1,
      body: {
        schema_version: 1,
        id: epicId,
        title: 'Demo Task runtime',
        state: 'active',
        completion_disposition: null,
        owner: 'eng-lead-architecture',
        scope_authority: 'eng-lead-architecture',
        completion_authority: 'eng-reviewer-code',
        priority: 1,
        outcome: 'Exercise the executable Task runtime.',
        acceptance: ['Task lifecycle gates remain intact.'],
        hold: null,
        created_at: fixedNow,
        updated_at: fixedNow,
        direction_ref: directionRef,
        contribution: 'Validates executable Task behavior.',
        scope_fit: 'Keeps schema 5 workspace activation deferred.',
        required_features: [body.feature_id],
        optional_features: [],
      },
    });
  }
  if (!existingFeature) {
    seedRecord(store, {
      kind: 'feature',
      id: body.feature_id,
      subject: null,
      version: 1,
      body: {
        schema_version: 1,
        id: body.feature_id,
        pack: body.pack,
        epic_id: epicId,
        title: 'Demo executable Tasks',
        state: 'active',
        completion_disposition: null,
        owner: 'eng-lead-architecture',
        scope_authority: 'eng-lead-architecture',
        completion_authority: 'eng-reviewer-code',
        priority: 1,
        outcome: 'Executable behavior uses Tasks.',
        acceptance: ['Every Task belongs to active Requirements.'],
        hold: null,
        created_at: fixedNow,
        updated_at: fixedNow,
        required_requirements: requirementIds,
        optional_requirements: [],
        depends_on_features: [],
      },
    });
  } else {
    const feature = JSON.parse(existingFeature.body);
    const required = [...new Set([...feature.required_requirements, ...requirementIds])];
    store.database.prepare(
      "UPDATE records SET body = ? WHERE kind = 'feature' AND id = ?",
    ).run(JSON.stringify({...feature, required_requirements: required}), body.feature_id);
  }
  for (const requirementId of requirementIds) {
    const existing = store.database.prepare(
      "SELECT body FROM records WHERE kind = 'requirement' AND id = ?",
    ).get(requirementId);
    if (!existing) {
      seedRecord(store, {
        kind: 'requirement',
        id: requirementId,
        subject: null,
        version: 1,
        body: {
          schema_version: 1,
          id: requirementId,
          pack: body.pack,
          feature_id: body.feature_id,
          title: 'Demo Task requirement',
          state: 'active',
          completion_disposition: null,
          owner: body.scope_authority,
          scope_authority: body.scope_authority,
          completion_authority: body.completion_authority,
          priority: 1,
          outcome: 'The executable Task is complete.',
          acceptance: ['The Task acceptance contract is satisfied.'],
          hold: null,
          created_at: fixedNow,
          updated_at: fixedNow,
          required_tasks: [body.id],
          optional_tasks: [],
        },
      });
    } else {
      const requirement = JSON.parse(existing.body);
      const required = [...new Set([...requirement.required_tasks, body.id])];
      store.database.prepare(
        "UPDATE records SET body = ? WHERE kind = 'requirement' AND id = ?",
      ).run(JSON.stringify({...requirement, required_tasks: required}), requirementId);
    }
  }
}

export function seedTask(store, overrides = {}) {
  const body = {
    schema_version: 1,
    id: fixtureIds.task,
    pack: 'engineering',
    feature_id: fixtureIds.feature,
    satisfies: [fixtureIds.requirement],
    title: 'Demo knowledge Task',
    delivery_class: 'knowledge',
    state: 'completed',
    resume_state: null,
    scope_authority: 'eng-lead-architecture',
    completion_authority: 'eng-reviewer-code',
    producer_actor: {role: 'eng-builder-software', runId: 'producer-run'},
    acceptance_actor: {role: 'eng-reviewer-code', runId: 'acceptance-run'},
    priority: 1,
    next_role: null,
    outcome: 'Demonstrate the coordination runtime.',
    acceptance: ['The runtime behavior is verified.'],
    artifact_expectation: 'none',
    artifact_expectation_reason: 'The product change is the durable result.',
    artifact_class: null,
    durability: null,
    validity_owner: null,
    artifact_targets: [],
    context_artifacts: [],
    touches: ['scripts/lib/coordination-runtime/**'],
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
  seedActiveTaskAncestors(store, body);
  seedRecord(store, {
    kind: 'task',
    id: body.id,
    subject: null,
    version: 1,
    body,
  });
  return {
    kind: 'task',
    id: body.id,
    subject: null,
    version: 1,
    body,
  };
}

export function seedItem(store, overrides = {}) {
  const body = {
    schema_version: 1,
    id: 'demo',
    title: 'Demo knowledge item',
    initiative: 'demo-initiative',
    delivery_class: 'knowledge',
    state: 'completed',
    resume_state: null,
    scope_authority: 'eng-lead-architecture',
    completion_authority: 'eng-reviewer-code',
    producer_actor: {role: 'eng-builder-software', runId: 'producer-run'},
    acceptance_actor: {role: 'eng-reviewer-code', runId: 'acceptance-run'},
    priority: 1,
    next_role: null,
    outcome: 'Demonstrate the coordination runtime.',
    acceptance: ['The runtime behavior is verified.'],
    artifact_expectation: 'none',
    artifact_expectation_reason: 'The product change is the durable result.',
    artifact_class: null,
    durability: null,
    validity_owner: null,
    artifact_targets: [],
    context_artifacts: [],
    touches: ['scripts/lib/coordination-runtime/**'],
    depends_on: [],
    lease: null,
    recovery_hold: null,
    waiting_on_questions: [],
    required_for_milestone: true,
    review_requirements: [],
    change_ref: null,
    updated_at: fixedNow,
    ...overrides,
  };
  body.producing_actors ??= body.producer_actor ? [body.producer_actor] : [];
  return seedRecord(store, {
    kind: 'item',
    id: body.id,
    subject: {kind: 'item', id: body.id},
    version: 1,
    body,
  });
}

export function seedInitiative(store, overrides = {}) {
  const body = {
    schema_version: 1,
    id: 'demo-initiative',
    title: 'Demo initiative',
    status: 'active',
    owner: 'eng-lead-architecture',
    scope: {current: ['coordination runtime']},
    milestones: [],
    backlog: [],
    north_star_ref: '.kai/state/initiatives/demo-initiative/northstar.md',
    updated_at: fixedNow,
    ...overrides,
  };
  return seedRecord(store, {
    kind: 'initiative',
    id: body.id,
    subject: null,
    version: 1,
    body,
  });
}

export function seedRecord(store, record) {
  if (!Object.hasOwn(record, 'subject')) {
    throw new Error('seedRecord requires an explicit typed subject or null');
  }
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

export function authority(actor, action, {
  roles = [
    'eng-lead-architecture',
    'eng-builder-software',
    'eng-reviewer-code',
    'eng-reviewer-quality',
    'workflow-ship',
  ],
  recordKind = 'task',
  recordId = fixtureIds.task,
  version = 1,
} = {}) {
  return {
    roles,
    grants: [{
      actor,
      actions: Array.isArray(action) ? action : [action],
      recordKind,
      recordId,
      basisRef: `${recordKind}/${recordId}@${version}`,
    }],
  };
}

export function command(kind, overrides = {}) {
  return {
    operationId: randomUUID(),
    kind,
    actor: {role: 'eng-builder-software', runId: 'builder-run'},
    recordKind: 'task',
    recordId: fixtureIds.task,
    expectedVersion: 1,
    leaseToken: null,
    payload: {},
    ...overrides,
  };
}
