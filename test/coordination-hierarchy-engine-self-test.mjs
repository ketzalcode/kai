import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
import test from 'node:test';
import {
  RuntimeError,
  parentClosureRef,
} from '../src/core/lib/coordination-runtime/contract.mjs';
import {applyCommand} from '../src/core/lib/coordination-runtime/engine.mjs';
import {
  assertAlignedAncestors,
  closureEligibility,
  parentHandlers,
} from '../src/core/lib/coordination-runtime/hierarchy-engine.mjs';
import {
  parentGovernanceActions,
  routingActions,
} from '../src/core/lib/coordination-runtime/native-routing.mjs';
import {
  closeStore,
  listRecords,
  openStore,
  readRecord,
} from '../src/core/lib/coordination-runtime/store.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const scratchRoot = join(repoRoot, '.test-workspaces');
const NOW = '2026-10-06T18:00:00.000Z';
const LATER = '2026-10-06T19:00:00.000Z';
const DIRECTION = [
  '# Vision',
  'A composable workspace.',
  '',
  '# Mission',
  'Coordinate exact work safely.',
  '',
  '# Current Goal',
  'Ship schema 5 hierarchy governance.',
  '',
  '# Out of Scope',
  'Do not cut executable Tasks over before Task 6.',
  '',
].join('\n');

const operator = actor('operator', 'operator-run');
const steward = actor('eng-lead-architecture', 'steward-run');
const packOwner = actor('eng-lead-software', 'pack-owner-run');
const packDelegate = actor('eng-product-manager', 'pack-delegate-run');
const goalSteward = actor('eng-product-strategy', 'goal-steward-run');
const requirementOwner = actor('eng-builder-software', 'requirement-owner-run');
const reviewer = actor('eng-reviewer-code', 'reviewer-run');
const outsider = actor('eng-reviewer-quality', 'outsider-run');

function actor(role, runId = role) {
  return {role, runId};
}

function runtimeError(code, pattern = null) {
  return error => error instanceof RuntimeError
    && error.code === code
    && (pattern === null || pattern.test(error.message));
}

function directionReference(
  bytes = DIRECTION,
  {
    path = 'docs/kai/DIRECTION.md',
    goal = 'Ship schema 5 hierarchy governance.',
  } = {},
) {
  return {
    path,
    hash: createHash('sha256').update(bytes).digest('hex'),
    goal,
  };
}

function directionBasis(reference = directionReference()) {
  return `direction:${reference.path}@${reference.hash}`;
}

function epicBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'epic:governance',
    title: 'Govern hierarchy work',
    state: 'proposed',
    completion_disposition: null,
    owner: steward.role,
    scope_authority: steward.role,
    completion_authority: reviewer.role,
    priority: 1,
    outcome: 'Parent work is governed transactionally.',
    acceptance: ['Parent mutations enforce exact authority and relationships.'],
    hold: null,
    created_at: NOW,
    updated_at: NOW,
    direction_ref: directionReference(),
    contribution: 'Adds governance needed to advance the current Goal.',
    scope_fit: 'Keeps executable item cutover out of this task.',
    required_features: [],
    optional_features: [],
    ...overrides,
  };
}

function featureBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'engineering:feature:governance',
    pack: 'engineering',
    epic_id: 'epic:governance',
    title: 'Enforce parent governance',
    state: 'proposed',
    completion_disposition: null,
    owner: packOwner.role,
    scope_authority: packDelegate.role,
    completion_authority: reviewer.role,
    priority: 1,
    outcome: 'Feature decisions use named authority.',
    acceptance: ['Feature hierarchy gates are enforced.'],
    hold: null,
    created_at: NOW,
    updated_at: NOW,
    required_requirements: [],
    optional_requirements: [],
    depends_on_features: [],
    ...overrides,
  };
}

function requirementBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'engineering:requirement:governance',
    pack: 'engineering',
    feature_id: 'engineering:feature:governance',
    title: 'Validate governance',
    state: 'proposed',
    completion_disposition: null,
    owner: requirementOwner.role,
    scope_authority: requirementOwner.role,
    completion_authority: reviewer.role,
    priority: 1,
    outcome: 'Every parent mutation is checked.',
    acceptance: ['Focused hierarchy tests pass.'],
    hold: null,
    created_at: NOW,
    updated_at: NOW,
    required_tasks: [],
    optional_tasks: [],
    ...overrides,
  };
}

function taskBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'engineering:task:governance',
    pack: 'engineering',
    feature_id: 'engineering:feature:governance',
    satisfies: ['engineering:requirement:governance'],
    title: 'Implement hierarchy governance',
    delivery_class: 'knowledge',
    state: 'proposed',
    resume_state: null,
    scope_authority: requirementOwner.role,
    completion_authority: reviewer.role,
    producer_actor: null,
    producing_actors: [],
    acceptance_actor: null,
    priority: 1,
    next_role: requirementOwner.role,
    outcome: 'Hierarchy parent handlers are implemented.',
    acceptance: ['The focused tests pass.'],
    artifact_expectation: 'none',
    artifact_expectation_reason: 'The code change is the durable result.',
    artifact_class: null,
    durability: null,
    validity_owner: null,
    artifact_targets: [],
    context_artifacts: [],
    touches: ['src/core/lib/coordination-runtime/hierarchy-engine.mjs'],
    depends_on: [],
    lease: null,
    recovery_hold: null,
    waiting_on_questions: [],
    review_requirements: [],
    change_ref: null,
    updated_at: NOW,
    ...overrides,
  };
}

function record(kind, body, version = 1) {
  return {kind, id: body.id, subject: null, version, body};
}

function command(kind, actorValue, recordKind, recordId, expectedVersion, payload) {
  return {
    operationId: randomUUID(),
    kind,
    actor: actorValue,
    recordKind,
    recordId,
    expectedVersion,
    leaseToken: null,
    payload,
  };
}

function authority(actorValue, actions, recordKind, recordId, version, basisRef = null) {
  return {
    roles: [
      steward.role,
      packOwner.role,
      packDelegate.role,
      goalSteward.role,
      requirementOwner.role,
      reviewer.role,
      outsider.role,
    ],
    grants: [{
      actor: actorValue,
      actions: Array.isArray(actions) ? actions : [actions],
      recordKind,
      recordId,
      basisRef: basisRef ?? `${recordKind}/${recordId}@${version}`,
    }],
  };
}

function applyParent(store, kind, action, actorValue, expectedVersion, payload) {
  const recordId = payload.body?.id ?? payload.recordId;
  const parentCommand = command(
    `${kind}.${action}`,
    actorValue,
    kind,
    recordId,
    expectedVersion,
    action === 'create' ? {body: payload.body} : payload.payload,
  );
  return applyCommand(
    store,
    parentCommand,
    authority(actorValue, parentCommand.kind, kind, recordId, expectedVersion),
  ).data.record;
}

function seed(store, entry) {
  store.database.prepare(`
    INSERT INTO records (kind, id, subject_kind, subject_id, version, body)
    VALUES (?, ?, NULL, NULL, ?, ?)
  `).run(entry.kind, entry.id, entry.version, JSON.stringify(entry.body));
  return entry;
}

function replaceRecord(store, entry) {
  store.database.prepare(`
    UPDATE records SET version = ?, body = ?
    WHERE kind = ? AND id = ?
  `).run(entry.version, JSON.stringify(entry.body), entry.kind, entry.id);
}

function eventPayloads(store) {
  return store.database.prepare('SELECT payload FROM events ORDER BY seq')
    .all()
    .map(row => JSON.parse(row.payload));
}

function txView(store) {
  return {
    get: (kind, id) => readRecord(store, kind, id),
    list: kind => listRecords(store, {kind}),
  };
}

function currentDirection(root) {
  const bytes = readFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'));
  return {
    ...directionReference(bytes),
    sections: {},
    bytes,
  };
}

function withSqliteTransaction(store, fn) {
  store.database.exec('BEGIN IMMEDIATE');
  try {
    return fn(txView(store));
  } finally {
    store.database.exec('ROLLBACK');
  }
}

async function withHierarchyWorkspace(fn) {
  mkdirSync(scratchRoot, {recursive: true});
  const root = mkdtempSync(join(scratchRoot, 'hierarchy-'));
  spawnSync('git', ['init', '--quiet', root], {windowsHide: true});
  writeFileSync(join(root, '.gitignore'), '/.kai/\n');
  mkdirSync(join(root, '.kai', 'core', 'runtime'), {recursive: true});
  mkdirSync(join(root, 'docs', 'kai'), {recursive: true});
  writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), DIRECTION);
  writeFileSync(join(root, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: 'test',
    schema_version: 5,
    scaffolded: NOW,
    workspace_id: `hierarchy-${randomUUID()}`,
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    direction: 'docs/kai/DIRECTION.md',
    projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
  }, null, 2)}\n`);
  const store = openStore({
    path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
    mode: 'create',
  });
  try {
    return await fn({root, store});
  } finally {
    closeStore(store);
    rmSync(root, {recursive: true, force: true});
  }
}

async function withExternalHierarchyWorkspace(projectDefinitions, fn) {
  mkdirSync(scratchRoot, {recursive: true});
  const caseRoot = mkdtempSync(join(scratchRoot, 'hierarchy-external-'));
  const root = join(caseRoot, 'workspace');
  const home = join(caseRoot, 'home');
  mkdirSync(join(root, '.kai', 'core', 'runtime'), {recursive: true});
  const projects = projectDefinitions.map(definition => {
    const projectRoot = join(caseRoot, definition.id);
    const direction = join(
      projectRoot,
      ...definition.publication_root.split('/'),
      'DIRECTION.md',
    );
    mkdirSync(dirname(direction), {recursive: true});
    writeFileSync(direction, definition.direction);
    return {
      id: definition.id,
      path: projectRoot,
      publication_root: definition.publication_root,
      projectRoot,
    };
  });
  const workspaceId = `hierarchy-${randomUUID()}`;
  writeFileSync(join(root, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: 'test',
    schema_version: 5,
    scaffolded: NOW,
    workspace_id: workspaceId,
    placement: 'external',
    workspace_root: root,
    private_root: '.kai',
    direction: 'docs/kai/DIRECTION.md',
    projects: projects.map(({projectRoot, ...project}) => project),
  }, null, 2)}\n`);
  mkdirSync(home, {recursive: true});
  writeFileSync(join(home, 'workspaces.json'), JSON.stringify({
    schema_version: 1,
    workspaces: projects.map(project => ({
      project_root: project.projectRoot,
      workspace_root: root,
      workspace_id: workspaceId,
    })),
  }));
  const priorHome = process.env.KAI_HOME;
  process.env.KAI_HOME = home;
  const store = openStore({
    path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
    mode: 'create',
  });
  try {
    return await fn({root, store, projects});
  } finally {
    closeStore(store);
    if (priorHome === undefined) delete process.env.KAI_HOME;
    else process.env.KAI_HOME = priorHome;
    rmSync(caseRoot, {recursive: true, force: true});
  }
}

function seedActiveEpic(store, overrides = {}, version = 1) {
  return seed(store, record('epic', epicBody({
    state: 'active',
    ...overrides,
  }), version));
}

function seedActiveFeature(store, overrides = {}, version = 1) {
  return seed(store, record('feature', featureBody({
    state: 'active',
    ...overrides,
  }), version));
}

test('parent handler and native authority surfaces are explicit without Task cutover', () => {
  assert.deepEqual([...parentHandlers.keys()], [
    'epic.create',
    'epic.update',
    'epic.activate',
    'epic.hold',
    'epic.release',
    'epic.complete',
    'feature.create',
    'feature.update',
    'feature.activate',
    'feature.hold',
    'feature.release',
    'feature.complete',
    'requirement.create',
    'requirement.update',
    'requirement.activate',
    'requirement.hold',
    'requirement.release',
    'requirement.complete',
  ]);
  assert.deepEqual(parentGovernanceActions, new Set(parentHandlers.keys()));
  for (const action of parentGovernanceActions) {
    assert.equal(routingActions.has(action), false, `${action} must not become item-bounded routing`);
  }
  assert.equal(parentHandlers.has('task.create'), false);
  assert.equal(parentHandlers.has('item.create'), false);
});

test('Epic proposal, activation, priority, version, allowlist, and event gates use named authority', async () => {
  await withHierarchyWorkspace(({root, store}) => {
    const body = epicBody();
    const unauthorized = command('epic.create', outsider, 'epic', body.id, 0, {body});
    assert.throws(
      () => applyCommand(store, unauthorized, authority(outsider, 'epic.create', 'epic', body.id, 0)),
      runtimeError('AUTHORITY_REQUIRED', /scope authority|operator/i),
    );
    assert.equal(readRecord(store, 'epic', body.id), null);
    assert.equal(eventPayloads(store).length, 0);

    const inventedBody = epicBody({
      id: 'epic:invented-direction',
      direction_ref: {
        ...directionReference(),
        hash: 'f'.repeat(64),
      },
    });
    const invented = command(
      'epic.create', steward, 'epic', inventedBody.id, 0, {body: inventedBody},
    );
    assert.throws(
      () => applyCommand(store, invented,
        authority(steward, 'epic.create', 'epic', inventedBody.id, 0)),
      runtimeError('EVIDENCE_GAP', /runtime-computed Direction/i),
    );

    let epic = applyParent(store, 'epic', 'create', steward, 0, {body});
    assert.equal(epic.body.state, 'proposed');
    const operatorProposal = applyParent(store, 'epic', 'create', operator, 0, {
      body: epicBody({id: 'epic:operator-proposal'}),
    });
    assert.equal(operatorProposal.body.state, 'proposed');

    writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), DIRECTION.replace(
      'Ship schema 5 hierarchy governance.',
      'Ship a stale activation Goal.',
    ));
    const staleActivation = command('epic.activate', steward, 'epic', epic.id, 1, {at: LATER});
    assert.throws(
      () => applyCommand(store, staleActivation,
        authority(steward, 'epic.activate', 'epic', epic.id, 1)),
      runtimeError('EVIDENCE_GAP', /Direction/i),
    );
    writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), DIRECTION);

    const wrongActivation = command('epic.activate', outsider, 'epic', epic.id, 1, {at: LATER});
    assert.throws(
      () => applyCommand(store, wrongActivation,
        authority(outsider, 'epic.activate', 'epic', epic.id, 1)),
      runtimeError('AUTHORITY_REQUIRED', /scope authority/i),
    );

    epic = applyParent(store, 'epic', 'activate', steward, 1, {
      recordId: epic.id,
      payload: {at: LATER},
    });
    assert.equal(epic.body.state, 'active');

    const wrongPriority = command('epic.update', outsider, 'epic', epic.id, 2, {
      at: LATER,
      changes: {priority: 2},
    });
    assert.throws(
      () => applyCommand(store, wrongPriority,
        authority(outsider, 'epic.update', 'epic', epic.id, 2)),
      runtimeError('AUTHORITY_REQUIRED', /priority|steward|operator/i),
    );

    const ownerPriority = command('epic.update', steward, 'epic', epic.id, 2, {
      at: LATER,
      changes: {priority: 2},
    });
    assert.throws(
      () => applyCommand(store, ownerPriority,
        authority(steward, 'epic.update', 'epic', epic.id, 2)),
      runtimeError('AUTHORITY_REQUIRED', /Current Goal steward|operator/i),
    );

    const staleStewardPriority = command(
      'epic.update',
      goalSteward,
      'epic',
      epic.id,
      2,
      {at: LATER, changes: {priority: 2}},
    );
    assert.throws(
      () => applyCommand(
        store,
        staleStewardPriority,
        authority(
          goalSteward,
          'epic.update',
          'epic',
          epic.id,
          2,
          `direction:docs/kai/DIRECTION.md@${'f'.repeat(64)}`,
        ),
      ),
      runtimeError('AUTHORITY_REQUIRED', /Current Goal steward|operator/i),
    );

    const overbroadStewardPriority = command(
      'epic.update',
      goalSteward,
      'epic',
      epic.id,
      2,
      {at: LATER, changes: {priority: 2, title: 'Steward cannot maintain the record'}},
    );
    assert.throws(
      () => applyCommand(
        store,
        overbroadStewardPriority,
        authority(
          goalSteward,
          'epic.update',
          'epic',
          epic.id,
          2,
          directionBasis(),
        ),
      ),
      runtimeError('AUTHORITY_REQUIRED', /declared authority|owner/i),
    );

    const stewardPriority = command('epic.update', goalSteward, 'epic', epic.id, 2, {
      at: LATER,
      changes: {priority: 2},
    });
    epic = applyCommand(
      store,
      stewardPriority,
      authority(
        goalSteward,
        'epic.update',
        'epic',
        epic.id,
        2,
        directionBasis(),
      ),
    ).data.record;
    epic = applyParent(store, 'epic', 'update', steward, 3, {
      recordId: epic.id,
      payload: {at: LATER, changes: {title: 'Owner-maintained title'}},
    });
    assert.equal(epic.body.updated_at, LATER);
    const ownerMaintenanceEvent = eventPayloads(store).at(-1);
    assert.equal(ownerMaintenanceEvent.at, LATER);
    epic = applyParent(store, 'epic', 'update', operator, 4, {
      recordId: epic.id,
      payload: {at: LATER, changes: {priority: 3}},
    });
    assert.equal(epic.body.priority, 3);

    const stale = command('epic.update', steward, 'epic', epic.id, 2, {
      at: LATER,
      changes: {title: 'Stale title'},
    });
    assert.throws(
      () => applyCommand(store, stale, authority(steward, 'epic.update', 'epic', epic.id, 2)),
      runtimeError('VERSION_CONFLICT'),
    );
    const missingTimestamp = command('epic.update', steward, 'epic', epic.id, 5, {
      changes: {title: 'Missing mutation time'},
    });
    assert.throws(
      () => applyCommand(store, missingTimestamp,
        authority(steward, 'epic.update', 'epic', epic.id, 5)),
      runtimeError('INVALID_INPUT', /payload.*at|missing.*at/i),
    );
    const disallowed = command('epic.update', steward, 'epic', epic.id, 5, {
      at: LATER,
      changes: {state: 'completed'},
    });
    assert.throws(
      () => applyCommand(store, disallowed,
        authority(steward, 'epic.update', 'epic', epic.id, 5)),
      runtimeError('INVALID_INPUT', /cannot change "state"/i),
    );

    for (const event of eventPayloads(store)) {
      assert.deepEqual(Object.keys(event).sort(), [
        'actor',
        'at',
        'basisRefs',
        'changedFields',
        'kind',
        'newVersion',
        'oldVersion',
        'reason',
        'recordId',
        'recordKind',
        'relationshipVersions',
      ]);
      assert.equal(typeof event.reason, 'string');
      assert.ok(event.reason.length > 0);
      assert.ok(Array.isArray(event.changedFields));
      assert.ok(Array.isArray(event.basisRefs));
      assert.ok(Array.isArray(event.relationshipVersions));
      assert.equal(event.newVersion, event.oldVersion + 1);
    }
  });
});

test('Feature and Requirement proposal, activation, and priority follow parent ownership and delegation', async () => {
  await withHierarchyWorkspace(({store}) => {
    seedActiveEpic(store, {
      required_features: [
        'engineering:feature:governance',
        'engineering:feature:owner-created',
      ],
    });

    const ownerCreated = applyParent(store, 'feature', 'create', packOwner, 0, {
      body: featureBody({id: 'engineering:feature:owner-created'}),
    });
    assert.equal(ownerCreated.body.state, 'proposed');

    const feature = featureBody({
      required_requirements: [
        'engineering:requirement:governance',
        'engineering:requirement:delegated',
      ],
    });
    const wrongFeatureCreate = command(
      'feature.create', outsider, 'feature', feature.id, 0, {body: feature},
    );
    assert.throws(
      () => applyCommand(store, wrongFeatureCreate,
        authority(outsider, 'feature.create', 'feature', feature.id, 0)),
      runtimeError('AUTHORITY_REQUIRED', /pack owner|delegate/i),
    );
    let savedFeature = applyParent(store, 'feature', 'create', packDelegate, 0, {body: feature});

    const wrongFeatureActivation = command(
      'feature.activate', packOwner, 'feature', feature.id, 1, {at: LATER},
    );
    assert.throws(
      () => applyCommand(store, wrongFeatureActivation,
        authority(packOwner, 'feature.activate', 'feature', feature.id, 1)),
      runtimeError('AUTHORITY_REQUIRED', /Epic steward/i),
    );
    savedFeature = applyParent(store, 'feature', 'activate', steward, 1, {
      recordId: feature.id,
      payload: {at: LATER},
    });

    const wrongFeaturePriority = command('feature.update', packOwner, 'feature', feature.id, 2, {
      at: LATER,
      changes: {priority: 2},
    });
    assert.throws(
      () => applyCommand(store, wrongFeaturePriority,
        authority(packOwner, 'feature.update', 'feature', feature.id, 2)),
      runtimeError('AUTHORITY_REQUIRED', /Epic steward/i),
    );
    savedFeature = applyParent(store, 'feature', 'update', steward, 2, {
      recordId: feature.id,
      payload: {at: LATER, changes: {priority: 2}},
    });
    assert.equal(savedFeature.body.priority, 2);

    const requirement = requirementBody();
    const wrongRequirementCreate = command(
      'requirement.create',
      requirementOwner,
      'requirement',
      requirement.id,
      0,
      {body: requirement},
    );
    assert.throws(
      () => applyCommand(store, wrongRequirementCreate,
        authority(requirementOwner, 'requirement.create', 'requirement', requirement.id, 0)),
      runtimeError('AUTHORITY_REQUIRED', /Feature owner/i),
    );
    const delegatedRequirement = applyParent(
      store,
      'requirement',
      'create',
      packDelegate,
      0,
      {body: requirementBody({id: 'engineering:requirement:delegated'})},
    );
    assert.equal(delegatedRequirement.body.state, 'proposed');
    let savedRequirement = applyParent(
      store, 'requirement', 'create', packOwner, 0, {body: requirement},
    );

    const wrongRequirementActivation = command(
      'requirement.activate',
      requirementOwner,
      'requirement',
      requirement.id,
      1,
      {at: LATER},
    );
    assert.throws(
      () => applyCommand(store, wrongRequirementActivation,
        authority(requirementOwner, 'requirement.activate', 'requirement', requirement.id, 1)),
      runtimeError('AUTHORITY_REQUIRED', /Feature owner/i),
    );
    savedRequirement = applyParent(store, 'requirement', 'activate', packOwner, 1, {
      recordId: requirement.id,
      payload: {at: LATER},
    });
    assert.equal(savedRequirement.body.state, 'active');

    const events = eventPayloads(store);
    const featureCreate = events.find(event =>
      event.kind === 'feature.create' && event.recordId === feature.id);
    const featureActivate = events.find(event => event.kind === 'feature.activate');
    const featurePriority = events.find(event => event.kind === 'feature.update');
    const requirementCreate = events.find(event => event.kind === 'requirement.create');
    const requirementActivate = events.find(event => event.kind === 'requirement.activate');
    assert.deepEqual(featureCreate.relationshipVersions, [{
      kind: 'epic', id: 'epic:governance', version: 1,
      state: 'active', disposition: null,
    }]);
    assert.ok(featureActivate.relationshipVersions.some(entry => entry.kind === 'epic'));
    assert.ok(featurePriority.relationshipVersions.some(entry => entry.kind === 'epic'));
    assert.ok(requirementCreate.relationshipVersions.some(entry => entry.kind === 'feature'));
    assert.ok(requirementActivate.relationshipVersions.some(entry => entry.kind === 'feature'));
  });
});

test('Direction validation refuses an ambiguous multi-project Direction path', async () => {
  await withExternalHierarchyWorkspace([
    {id: 'default', publication_root: 'docs/kai', direction: DIRECTION},
    {id: 'mirror', publication_root: 'docs/kai', direction: DIRECTION},
  ], ({store}) => {
    const ambiguous = epicBody({id: 'epic:ambiguous-project'});
    const create = command('epic.create', steward, 'epic', ambiguous.id, 0, {
      body: ambiguous,
    });
    assert.throws(
      () => applyCommand(store, create,
        authority(steward, 'epic.create', 'epic', ambiguous.id, 0)),
      runtimeError('EVIDENCE_GAP', /unique|exactly one|configured project/i),
    );
    assert.equal(readRecord(store, 'epic', ambiguous.id), null);
  });
});

test('Direction realignment records the exact current Direction basis', async () => {
  await withHierarchyWorkspace(({root, store}) => {
    const epic = seedActiveEpic(store);
    const changedDirection = DIRECTION.replace(
      'Ship schema 5 hierarchy governance.',
      'Ship the realigned hierarchy.',
    );
    writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), changedDirection);
    const reference = directionReference(changedDirection, {
      goal: 'Ship the realigned hierarchy.',
    });
    const realigned = applyParent(store, 'epic', 'update', steward, epic.version, {
      recordId: epic.id,
      payload: {
        at: LATER,
        changes: {direction_ref: reference},
      },
    });
    assert.deepEqual(realigned.body.direction_ref, reference);
    const event = eventPayloads(store).at(-1);
    assert.equal(event.kind, 'epic.update');
    assert.equal(event.at, LATER);
    assert.deepEqual(event.basisRefs, [directionBasis(reference)]);
  });
});

test('runtime Direction changes and holds block descendant activation, promotion, and grants', async () => {
  await withHierarchyWorkspace(({root, store}) => {
    seedActiveEpic(store, {
      required_features: ['engineering:feature:governance'],
    });
    let feature = applyParent(store, 'feature', 'create', packDelegate, 0, {
      body: featureBody({
        required_requirements: ['engineering:requirement:governance'],
      }),
    });

    writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), DIRECTION.replace(
      'Ship schema 5 hierarchy governance.',
      'Ship a changed Goal.',
    ));
    const staleFeature = command('feature.activate', steward, 'feature', feature.id, 1, {at: LATER});
    assert.throws(
      () => applyCommand(store, staleFeature,
        authority(steward, 'feature.activate', 'feature', feature.id, 1)),
      runtimeError('EVIDENCE_GAP', /Direction/i),
    );
    assert.equal(readRecord(store, 'feature', feature.id).body.state, 'proposed');

    writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), DIRECTION);
    feature = applyParent(store, 'feature', 'activate', steward, 1, {
      recordId: feature.id,
      payload: {at: LATER},
    });
    let requirement = applyParent(store, 'requirement', 'create', packOwner, 0, {
      body: requirementBody({
        required_tasks: ['engineering:task:governance'],
      }),
    });
    const task = seed(store, record('task', taskBody()));

    writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), DIRECTION.replace(
      'Ship schema 5 hierarchy governance.',
      'Ship another changed Goal.',
    ));
    const staleRequirement = command(
      'requirement.activate', packOwner, 'requirement', requirement.id, 1, {at: LATER},
    );
    assert.throws(
      () => applyCommand(store, staleRequirement,
        authority(packOwner, 'requirement.activate', 'requirement', requirement.id, 1)),
      runtimeError('EVIDENCE_GAP', /Direction/i),
    );
    for (const action of ['promotion', 'grant']) {
      assert.throws(
        () => withSqliteTransaction(store, tx =>
          assertAlignedAncestors(tx, task, currentDirection(root))),
        runtimeError('EVIDENCE_GAP', /Direction/i),
        `stale Direction must block Task ${action}`,
      );
    }

    writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), DIRECTION);
    feature = applyParent(store, 'feature', 'hold', packOwner, feature.version, {
      recordId: feature.id,
      payload: {
        at: LATER,
        reason: 'Wait for explicit pack acceptance.',
        releaseCondition: 'Pack acceptance evidence is recorded.',
        basisRefs: ['decision:pack-acceptance'],
      },
    });
    assert.equal(feature.body.state, 'active');
    assert.equal(feature.body.hold.reason, 'Wait for explicit pack acceptance.');

    const heldRequirement = command(
      'requirement.activate', packOwner, 'requirement', requirement.id, 1, {at: LATER},
    );
    assert.throws(
      () => applyCommand(store, heldRequirement,
        authority(packOwner, 'requirement.activate', 'requirement', requirement.id, 1)),
      runtimeError('EVIDENCE_GAP', /hold/i),
    );
    assert.throws(
      () => withSqliteTransaction(store, tx =>
        assertAlignedAncestors(tx, task, currentDirection(root))),
      runtimeError('EVIDENCE_GAP', /hold/i),
    );

    feature = applyParent(store, 'feature', 'release', packOwner, feature.version, {
      recordId: feature.id,
      payload: {
        at: LATER,
        reason: 'The owner explicitly released the hold.',
        conditionMet: false,
        basisRefs: ['decision:owner-override', 'evidence:pack-review'],
      },
    });
    assert.equal(feature.body.hold, null);
    requirement = applyParent(store, 'requirement', 'activate', packOwner, 1, {
      recordId: requirement.id,
      payload: {at: LATER},
    });
    assert.equal(requirement.body.state, 'active');

    const [holdEvent, releaseEvent] = eventPayloads(store).slice(-3, -1);
    assert.equal(holdEvent.kind, 'feature.hold');
    assert.equal(holdEvent.oldVersion, 2);
    assert.equal(holdEvent.newVersion, 3);
    assert.equal(releaseEvent.kind, 'feature.release');
    assert.equal(releaseEvent.actor.runId, packOwner.runId);
    assert.equal(releaseEvent.at, LATER);
    assert.equal(releaseEvent.reason, 'The owner explicitly released the hold.');
    assert.deepEqual(releaseEvent.basisRefs, [
      'decision:owner-override',
      'evidence:pack-review',
    ]);
    assert.equal(releaseEvent.releaseConditionMet, false);
  });
});

test('Feature dependencies cross packs and Epics, require delivered, and reject cycles', async () => {
  await withHierarchyWorkspace(({store}) => {
    seedActiveEpic(store, {
      id: 'epic:downstream',
      required_features: [
        'engineering:feature:downstream',
        'engineering:feature:pending-downstream',
        'engineering:feature:cycle-a',
      ],
    });
    seedActiveEpic(store, {
      id: 'epic:upstream',
      required_features: [
        'creative:feature:upstream',
        'creative:feature:pending',
        'creative:feature:cycle-b',
      ],
    });
    seed(store, record('feature', featureBody({
      id: 'creative:feature:upstream',
      pack: 'creative',
      epic_id: 'epic:upstream',
      state: 'completed',
      completion_disposition: 'delivered',
    })));
    seed(store, record('feature', featureBody({
      id: 'creative:feature:pending',
      pack: 'creative',
      epic_id: 'epic:upstream',
      state: 'active',
      completion_disposition: null,
    })));

    const downstreamBody = featureBody({
      id: 'engineering:feature:downstream',
      epic_id: 'epic:downstream',
      depends_on_features: [{
        feature: 'creative:feature:upstream',
        requires: 'delivered',
      }],
    });
    let downstream = applyParent(store, 'feature', 'create', packDelegate, 0, {
      body: downstreamBody,
    });
    downstream = applyParent(store, 'feature', 'activate', steward, 1, {
      recordId: downstream.id,
      payload: {at: LATER},
    });
    assert.equal(downstream.body.state, 'active');

    const pendingBody = featureBody({
      id: 'engineering:feature:pending-downstream',
      epic_id: 'epic:downstream',
      depends_on_features: [{
        feature: 'creative:feature:pending',
        requires: 'delivered',
      }],
    });
    applyParent(store, 'feature', 'create', packDelegate, 0, {body: pendingBody});
    const pendingActivation = command(
      'feature.activate', steward, 'feature', pendingBody.id, 1, {at: LATER},
    );
    assert.throws(
      () => applyCommand(store, pendingActivation,
        authority(steward, 'feature.activate', 'feature', pendingBody.id, 1)),
      runtimeError('EVIDENCE_GAP', /delivered/i),
    );

    const invalidRequirement = featureBody({
      id: 'engineering:feature:bad-dependency',
      epic_id: 'epic:downstream',
      depends_on_features: [{
        feature: 'creative:feature:upstream',
        requires: 'completed',
      }],
    });
    const invalidCreate = command(
      'feature.create',
      packDelegate,
      'feature',
      invalidRequirement.id,
      0,
      {body: invalidRequirement},
    );
    assert.throws(
      () => applyCommand(store, invalidCreate,
        authority(packDelegate, 'feature.create', 'feature', invalidRequirement.id, 0)),
      runtimeError('INVALID_INPUT', /requires is unsupported/i),
    );

    seed(store, record('feature', featureBody({
      id: 'engineering:feature:cycle-a',
      epic_id: 'epic:downstream',
      depends_on_features: [],
    })));
    seed(store, record('feature', featureBody({
      id: 'creative:feature:cycle-b',
      pack: 'creative',
      epic_id: 'epic:upstream',
      depends_on_features: [{
        feature: 'engineering:feature:cycle-a',
        requires: 'delivered',
      }],
    })));
    const cycle = command('feature.update', steward, 'feature',
      'engineering:feature:cycle-a', 1, {
        at: LATER,
        changes: {
          depends_on_features: [{
            feature: 'creative:feature:cycle-b',
            requires: 'delivered',
          }],
        },
      });
    assert.throws(
      () => applyCommand(store, cycle,
        authority(steward, 'feature.update', 'feature', cycle.recordId, 1)),
      runtimeError('INVALID_INPUT', /cycle/i),
    );
    assert.deepEqual(
      readRecord(store, 'feature', cycle.recordId).body.depends_on_features,
      [],
    );
  });
});

test('successful closure uses exact required children while optional and child completion do not close parents', async () => {
  await withHierarchyWorkspace(({store}) => {
    const parent = seedActiveEpic(store, {
      id: 'epic:closure',
      required_features: ['engineering:feature:required'],
      optional_features: ['creative:feature:optional'],
      completion_authority: operator.role,
    });
    seed(store, record('feature', featureBody({
      id: 'engineering:feature:required',
      epic_id: parent.id,
      state: 'completed',
      completion_disposition: 'delivered',
    }), 3));
    seed(store, record('feature', featureBody({
      id: 'creative:feature:optional',
      pack: 'creative',
      epic_id: parent.id,
      state: 'active',
    }), 8));

    const unchanged = readRecord(store, 'epic', parent.id);
    assert.equal(unchanged.body.state, 'active', 'child completion never auto-closes a parent');
    const eligibility = closureEligibility(txView(store), unchanged);
    assert.equal(eligibility.eligible, true);
    assert.deepEqual(eligibility.relationshipVersions, [{
      kind: 'feature',
      id: 'engineering:feature:required',
      version: 3,
      state: 'completed',
      disposition: 'delivered',
    }]);

    const completed = applyParent(store, 'epic', 'complete', operator, 1, {
      recordId: parent.id,
      payload: {
        at: LATER,
        disposition: 'achieved',
        reason: 'The exact required Feature was delivered.',
        closureRef: eligibility.closureRef,
        basisRefs: ['approval:epic-closure'],
      },
    });
    assert.equal(completed.body.state, 'completed');
    assert.equal(completed.body.completion_disposition, 'achieved');
    const event = eventPayloads(store).at(-1);
    assert.ok(event.relationshipVersions.some(entry =>
      entry.kind === 'feature'
      && entry.id === 'engineering:feature:required'
      && entry.version === 3
      && entry.disposition === 'delivered'));
    assert.ok(event.relationshipVersions.some(entry =>
      entry.kind === 'feature'
      && entry.id === 'creative:feature:optional'
      && entry.version === 8));
    assert.equal(event.closureRef, eligibility.closureRef);
  });
});

test('cancelled children and changed child versions invalidate successful closure', async () => {
  await withHierarchyWorkspace(({store}) => {
    const parent = seedActiveEpic(store, {
      id: 'epic:invalid-closure',
      required_features: ['engineering:feature:required'],
      completion_authority: operator.role,
    });
    const required = seed(store, record('feature', featureBody({
      id: 'engineering:feature:required',
      epic_id: parent.id,
      state: 'completed',
      completion_disposition: 'delivered',
    })));
    const eligible = closureEligibility(txView(store), parent);
    replaceRecord(store, {...required, version: 2});
    const staleClosure = command('epic.complete', operator, 'epic', parent.id, 1, {
      at: LATER,
      disposition: 'achieved',
      reason: 'Use the stale child version.',
      closureRef: eligible.closureRef,
      basisRefs: ['approval:stale'],
    });
    assert.throws(
      () => applyCommand(store, staleClosure,
        authority(operator, 'epic.complete', 'epic', parent.id, 1)),
      runtimeError('VERSION_CONFLICT', /closure/i),
    );
    assert.equal(readRecord(store, 'epic', parent.id).body.state, 'active');

    const cancelledParent = seedActiveEpic(store, {
      id: 'epic:cancelled-child',
      required_features: ['engineering:feature:cancelled'],
      completion_authority: operator.role,
    });
    seed(store, record('feature', featureBody({
      id: 'engineering:feature:cancelled',
      epic_id: cancelledParent.id,
      state: 'completed',
      completion_disposition: 'cancelled',
    })));
    const ineligible = closureEligibility(txView(store), cancelledParent);
    assert.equal(ineligible.eligible, false);
    assert.match(ineligible.blockers[0].reason, /delivered/i);
    const inventedClosure = parentClosureRef({
      ...cancelledParent,
      version: 2,
      body: {
        ...cancelledParent.body,
        state: 'completed',
        completion_disposition: 'achieved',
      },
    }, [{
      kind: 'feature',
      id: 'engineering:feature:cancelled',
      version: 1,
      completion_disposition: 'delivered',
    }]);
    const invalidClosure = command(
      'epic.complete', operator, 'epic', cancelledParent.id, 1, {
        at: LATER,
        disposition: 'achieved',
        reason: 'Pretend cancellation delivered the Feature.',
        closureRef: inventedClosure,
        basisRefs: ['approval:invented'],
      },
    );
    assert.throws(
      () => applyCommand(store, invalidClosure,
        authority(operator, 'epic.complete', 'epic', cancelledParent.id, 1)),
      runtimeError('EVIDENCE_GAP', /delivered/i),
    );
  });
});

test('Requirement closure validates live Task kind and exact terminal state before accepting a reference', async () => {
  await withHierarchyWorkspace(({store}) => {
    seedActiveEpic(store, {
      required_features: ['engineering:feature:governance'],
    });
    seedActiveFeature(store, {
      required_requirements: [
        'engineering:requirement:governance',
        'engineering:requirement:bare-identity',
        'engineering:requirement:product-terminal',
      ],
    });

    const requirement = seed(store, record('requirement', requirementBody({
      state: 'active',
      required_tasks: ['engineering:task:governance'],
    })));
    seed(store, record('task', taskBody({
      state: 'completed',
      next_role: null,
    }), 4));
    const eligible = closureEligibility(txView(store), requirement);
    assert.equal(eligible.eligible, true);
    assert.deepEqual(eligible.relationshipVersions, [{
      kind: 'task',
      id: 'engineering:task:governance',
      version: 4,
      state: 'completed',
      disposition: 'completed',
    }]);
    const completed = applyParent(store, 'requirement', 'complete', reviewer, 1, {
      recordId: requirement.id,
      payload: {
        at: LATER,
        disposition: 'satisfied',
        reason: 'The exact knowledge Task completed.',
        closureRef: eligible.closureRef,
        basisRefs: ['approval:requirement-closure'],
      },
    });
    assert.equal(completed.body.completion_disposition, 'satisfied');

    const bareParent = seed(store, record('requirement', requirementBody({
      id: 'engineering:requirement:bare-identity',
      state: 'active',
      required_tasks: ['engineering:task:bare-identity'],
    })));
    seed(store, record('task', taskBody({
      id: 'engineering:task:bare-identity',
      satisfies: ['engineering:requirement:bare-identity'],
      state: 'proposed',
    })));
    const invented = parentClosureRef({
      ...bareParent,
      version: 2,
      body: {
        ...bareParent.body,
        state: 'completed',
        completion_disposition: 'satisfied',
      },
    }, [{
      kind: 'task',
      id: 'engineering:task:bare-identity',
      version: 1,
      completion_disposition: 'completed',
    }]);
    const bareClosure = command(
      'requirement.complete', reviewer, 'requirement', bareParent.id, 1, {
        at: LATER,
        disposition: 'satisfied',
        reason: 'Accept a caller-invented bare identity.',
        closureRef: invented,
        basisRefs: ['approval:invented-task'],
      },
    );
    assert.throws(
      () => applyCommand(store, bareClosure,
        authority(reviewer, 'requirement.complete', 'requirement', bareParent.id, 1)),
      runtimeError('EVIDENCE_GAP', /terminal|completed/i),
    );

    const productParent = seed(store, record('requirement', requirementBody({
      id: 'engineering:requirement:product-terminal',
      state: 'active',
      required_tasks: ['engineering:task:product-terminal'],
    })));
    seed(store, record('task', taskBody({
      id: 'engineering:task:product-terminal',
      satisfies: ['engineering:requirement:product-terminal'],
      delivery_class: 'product-change',
      state: 'completed',
      next_role: null,
    })));
    const productEligibility = closureEligibility(txView(store), productParent);
    assert.equal(productEligibility.eligible, false);
    assert.match(productEligibility.blockers[0].reason, /shipped/i);
  });
});

test('cancellation and supersession require completion authority and rationale, not child roll-up', async () => {
  await withHierarchyWorkspace(({store}) => {
    seedActiveEpic(store, {
      required_features: [
        'engineering:feature:cancel-me',
        'engineering:feature:supersede-me',
        'engineering:feature:independent-acceptance',
      ],
    });
    const incomplete = seed(store, record('requirement', requirementBody({
      id: 'engineering:requirement:incomplete',
      state: 'active',
    })));
    const cancelFeature = seed(store, record('feature', featureBody({
      id: 'engineering:feature:cancel-me',
      state: 'active',
      required_requirements: [incomplete.id],
    })));

    const selfCancel = command(
      'feature.complete', packOwner, 'feature', cancelFeature.id, 1, {
        at: LATER,
        disposition: 'cancelled',
        reason: 'The owner cannot self-accept an independently governed completion.',
        basisRefs: ['decision:cancel'],
      },
    );
    assert.throws(
      () => applyCommand(store, selfCancel,
        authority(packOwner, 'feature.complete', 'feature', cancelFeature.id, 1)),
      runtimeError('AUTHORITY_REQUIRED', /completion authority/i),
    );
    const cancelled = applyParent(store, 'feature', 'complete', reviewer, 1, {
      recordId: cancelFeature.id,
      payload: {
        at: LATER,
        disposition: 'cancelled',
        reason: 'The approved scope is no longer needed.',
        basisRefs: ['decision:cancel'],
      },
    });
    assert.equal(cancelled.body.completion_disposition, 'cancelled');

    const supersedeFeature = seed(store, record('feature', featureBody({
      id: 'engineering:feature:supersede-me',
      state: 'active',
      required_requirements: [incomplete.id],
    })));
    const superseded = applyParent(store, 'feature', 'complete', reviewer, 1, {
      recordId: supersedeFeature.id,
      payload: {
        at: LATER,
        disposition: 'superseded',
        reason: 'A replacement Feature now owns this outcome.',
        basisRefs: ['decision:supersede'],
      },
    });
    assert.equal(superseded.body.completion_disposition, 'superseded');

    const independent = seed(store, record('feature', featureBody({
      id: 'engineering:feature:independent-acceptance',
      state: 'active',
      required_requirements: [],
    })));
    const eligible = closureEligibility(txView(store), independent);
    const producerAcceptance = command(
      'feature.complete', packOwner, 'feature', independent.id, 1, {
        at: LATER,
        disposition: 'delivered',
        reason: 'The producer tries to accept its own governed outcome.',
        closureRef: eligible.closureRef,
        basisRefs: ['approval:self'],
      },
    );
    assert.throws(
      () => applyCommand(store, producerAcceptance,
        authority(packOwner, 'feature.complete', 'feature', independent.id, 1)),
      runtimeError('AUTHORITY_REQUIRED', /completion authority/i),
    );

    const missingRationale = command(
      'feature.complete', reviewer, 'feature', independent.id, 1, {
        at: LATER,
        disposition: 'cancelled',
        reason: '',
        basisRefs: ['decision:cancel'],
      },
    );
    assert.throws(
      () => applyCommand(store, missingRationale,
        authority(reviewer, 'feature.complete', 'feature', independent.id, 1)),
      runtimeError('INVALID_INPUT', /reason/i),
    );
  });
});
