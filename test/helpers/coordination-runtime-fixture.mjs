import {randomUUID} from 'node:crypto';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {dirname, isAbsolute, join, relative, resolve, sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {
  closeStore,
  openStore,
} from '../../scripts/lib/coordination-runtime/store.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const fixedNow = '2026-09-16T12:00:00.000Z';

export function allocateTemporaryRoot(prefix, checkoutRoot = repoRoot) {
  const temporaryDirectory = resolve(tmpdir());
  const checkout = resolve(checkoutRoot);
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
  const stateDirectory = join(root, '.kai', 'state');
  mkdirSync(stateDirectory, {recursive: true});
  writeFileSync(join(root, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: 'test',
    schema_version: 4,
    scaffolded: fixedNow,
    workspace_id: `test-${randomUUID()}`,
    storage_mode: 'repo-local',
    workspace_root: '.',
    state: '.kai/state',
    runs: '.kai/runs',
    review: '.kai/review',
    archive: '.kai/archive',
    personal: '.kai/personal',
    projects: [],
    areas: [],
  }, null, 2)}\n`);
  const store = openStore({
    path: join(stateDirectory, 'coordination.sqlite'),
    mode: 'create',
  });
  try {
    return await fn({root, store, now: fixedNow});
  } finally {
    closeStore(store);
    rmSync(root, {recursive: true, force: true});
  }
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
  seedRecord(store, {
    kind: 'item',
    id: body.id,
    itemId: body.id,
    version: 1,
    body,
  });
  return {
    kind: 'item',
    id: body.id,
    itemId: body.id,
    version: 1,
    body,
  };
}

export function seedRecord(store, record) {
  store.database.prepare(`
    INSERT INTO records (kind, id, item_id, version, body)
    VALUES (?, ?, ?, ?, ?)
  `).run(
    record.kind,
    record.id,
    record.itemId,
    record.version ?? 1,
    JSON.stringify(record.body),
  );
  return record;
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
    itemId: null,
    version: 1,
    body,
  });
}

export function authority(actor, action, {
  roles = [
    'eng-lead-architecture',
    'eng-builder-software',
    'eng-reviewer-code',
    'eng-reviewer-quality',
    'workflow-ship',
  ],
  recordKind = 'item',
  recordId = 'demo',
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
    recordKind: 'item',
    recordId: 'demo',
    expectedVersion: 1,
    leaseToken: null,
    payload: {},
    ...overrides,
  };
}
