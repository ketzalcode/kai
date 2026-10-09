import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {readFileSync} from 'node:fs';
import test from 'node:test';
import {
  COMMAND_KINDS,
  HIERARCHY_KINDS,
  PARENT_DISPOSITIONS,
  PARENT_STATES,
  RECORD_KINDS,
  RuntimeError,
  canonicalJson,
  parentClosureRef,
  validateCommand,
  validateHierarchyRecord,
  validateHierarchyRelationships,
  validateParentCommand,
  validateRecord,
  validateTaskBody,
  validateTaskCommand,
} from '../src/core/lib/coordination-runtime/contract.mjs';

const NOW = '2026-10-06T18:00:00.000Z';
const LATER = '2026-10-06T19:00:00.000Z';

const subject = {
  kind: 'sha256',
  path: '.kai/core/features/hierarchy-contracts/evidence/review.txt',
  digest: 'a'.repeat(64),
};

function actor(role, runId = role) {
  return {role, runId};
}

function uuid(index) {
  return `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`;
}

function invalid(messagePattern = null) {
  return error => error instanceof RuntimeError
    && error.code === 'INVALID_INPUT'
    && (messagePattern === null || messagePattern.test(error.message));
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function importProbe(moduleName, expectedExport) {
  const moduleUrl = new URL(`../src/core/lib/coordination-runtime/${moduleName}`, import.meta.url).href;
  const script = `import(${JSON.stringify(moduleUrl)}).then(module => {
    if (typeof module[${JSON.stringify(expectedExport)}] !== 'function') {
      throw new Error('missing export ${expectedExport}');
    }
    process.stdout.write('imported');
  }).catch(error => {
    process.stderr.write(String(error && error.message));
    process.exit(1);
  });`;
  return execFileSync(process.execPath, ['-e', script], {encoding: 'utf8'});
}

function lookup(records) {
  const byKind = new Map();
  for (const record of records) {
    if (!byKind.has(record.kind)) byKind.set(record.kind, new Map());
    byKind.get(record.kind).set(record.id, record);
  }
  return byKind;
}

function epicBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'epic:schema-five-cutover',
    title: 'Define explicit hierarchy contracts',
    state: 'active',
    completion_disposition: null,
    owner: 'operator',
    scope_authority: 'operator',
    completion_authority: 'operator',
    priority: 1,
    outcome: 'Schema 5 hierarchy contracts validate before the runtime cutover.',
    acceptance: ['Epic, feature, requirement, and task contracts validate.'],
    hold: null,
    created_at: NOW,
    updated_at: NOW,
    direction_ref: {
      path: 'docs/kai/DIRECTION.md',
      hash: 'b'.repeat(64),
      goal: 'Ship schema 5 hierarchy contracts.',
    },
    contribution: 'Introduces explicit hierarchy and Task validation primitives.',
    scope_fit: 'Keeps the live dispatcher untouched until the later cutover task.',
    required_features: ['core:feature:hierarchy-contracts'],
    optional_features: [],
    ...overrides,
  };
}

function featureBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'core:feature:hierarchy-contracts',
    pack: 'core',
    epic_id: 'epic:schema-five-cutover',
    title: 'Define hierarchy contracts',
    state: 'active',
    completion_disposition: null,
    owner: 'eng-lead-architecture',
    scope_authority: 'operator',
    completion_authority: 'eng-reviewer-code',
    priority: 1,
    outcome: 'Hierarchy records and task records validate consistently.',
    acceptance: ['Feature, requirement, and task edges are structurally valid.'],
    hold: null,
    created_at: NOW,
    updated_at: NOW,
    required_requirements: ['core:requirement:validate-hierarchy'],
    optional_requirements: [],
    depends_on_features: [],
    ...overrides,
  };
}

function requirementBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'core:requirement:validate-hierarchy',
    pack: 'core',
    feature_id: 'core:feature:hierarchy-contracts',
    title: 'Validate hierarchy records',
    state: 'active',
    completion_disposition: null,
    owner: 'eng-lead-architecture',
    scope_authority: 'eng-lead-architecture',
    completion_authority: 'eng-reviewer-code',
    priority: 1,
    outcome: 'Hierarchy contracts reject invalid parent-child relationships.',
    acceptance: ['Every hierarchy edge is validated before execution.'],
    hold: null,
    created_at: NOW,
    updated_at: NOW,
    required_tasks: ['core:task:author-contracts'],
    optional_tasks: [],
    ...overrides,
  };
}

function taskBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'core:task:author-contracts',
    pack: 'core',
    feature_id: 'core:feature:hierarchy-contracts',
    satisfies: ['core:requirement:validate-hierarchy'],
    title: 'Author hierarchy contract modules',
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
    outcome: 'Schema 5 hierarchy and Task contracts are implemented.',
    acceptance: ['The shared contract validates hierarchy and Task records.'],
    artifact_expectation: 'none',
    artifact_expectation_reason: 'The code change is the durable result.',
    artifact_class: null,
    durability: null,
    validity_owner: null,
    artifact_targets: [],
    context_artifacts: [],
    touches: ['src/core/lib/coordination-runtime/*'],
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

function itemBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'legacy-item',
    title: 'Legacy executable item',
    initiative: 'legacy-initiative',
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
    outcome: 'Legacy schema 4 item validation still works.',
    acceptance: ['Schema 4 records still validate during the staged cutover.'],
    artifact_expectation: 'none',
    artifact_expectation_reason: 'The code change is the durable result.',
    artifact_class: null,
    durability: null,
    validity_owner: null,
    artifact_targets: [],
    context_artifacts: [],
    touches: ['src/core/lib/coordination-runtime/*'],
    depends_on: [],
    lease: null,
    recovery_hold: null,
    waiting_on_questions: [],
    required_for_milestone: true,
    review_requirements: [],
    change_ref: null,
    updated_at: NOW,
    ...overrides,
  };
}

function record(kind, body, version = 1) {
  return {
    kind,
    id: body.id,
    subject: kind === 'item' ? {kind: 'item', id: body.id} : null,
    version,
    body,
  };
}

function handoffContent() {
  return {
    did: 'Wrote the contract validators.',
    needs: 'Review the new hierarchy rules.',
    assetState: 'no durable asset is owed',
    authority: 'awaiting independent review',
    revalidation: 're-run the focused hierarchy contract test',
    questions: [],
  };
}

function validHierarchy() {
  const epic = record('epic', epicBody());
  const feature = record('feature', featureBody());
  const requirement = record('requirement', requirementBody());
  const task = record('task', taskBody());
  return {
    epic,
    feature,
    requirement,
    task,
    records: [epic, feature, requirement, task],
  };
}

function parentCompleteRecord(kind, body, version, disposition) {
  return record(kind, {
    ...clone(body),
    state: 'completed',
    completion_disposition: disposition,
  }, version);
}

function parentCommand(kind, action, recordId, payload, expectedVersion = 1) {
  return {
    operationId: uuid(expectedVersion + recordId.length + action.length),
    kind: `${kind}.${action}`,
    actor: actor('operator'),
    recordKind: kind,
    recordId,
    expectedVersion,
    leaseToken: null,
    payload,
  };
}

function taskCommand(action, payload, expectedVersion = 1, overrides = {}) {
  return {
    operationId: uuid(expectedVersion + action.length + 100),
    kind: `task.${action}`,
    actor: actor('eng-builder-software', 'builder-run'),
    recordKind: 'task',
    recordId: 'core:task:author-contracts',
    expectedVersion,
    leaseToken: null,
    payload,
    ...overrides,
  };
}

test('shared contract accepts explicit hierarchy records and Task commands', () => {
  const {epic, feature, requirement, task, records} = validHierarchy();
  const taskFieldSet = new Set(Object.keys(task.body));

  assert.deepEqual(HIERARCHY_KINDS, new Set(['epic', 'feature', 'requirement', 'task']));
  assert.deepEqual(PARENT_STATES, new Set(['proposed', 'active', 'completed']));
  assert.deepEqual([...PARENT_DISPOSITIONS.epic], ['achieved', 'cancelled', 'superseded']);
  assert.deepEqual([...PARENT_DISPOSITIONS.feature], ['delivered', 'cancelled', 'superseded']);
  assert.deepEqual([...PARENT_DISPOSITIONS.requirement], ['satisfied', 'cancelled', 'superseded']);
  assert.ok(RECORD_KINDS.has('epic'));
  assert.ok(RECORD_KINDS.has('feature'));
  assert.ok(RECORD_KINDS.has('requirement'));
  assert.ok(RECORD_KINDS.has('task'));

  assert.deepEqual(taskFieldSet, new Set([
    'schema_version',
    'id',
    'pack',
    'feature_id',
    'satisfies',
    'title',
    'delivery_class',
    'state',
    'resume_state',
    'scope_authority',
    'completion_authority',
    'producer_actor',
    'producing_actors',
    'acceptance_actor',
    'priority',
    'next_role',
    'outcome',
    'acceptance',
    'artifact_expectation',
    'artifact_expectation_reason',
    'artifact_class',
    'durability',
    'validity_owner',
    'artifact_targets',
    'context_artifacts',
    'touches',
    'depends_on',
    'lease',
    'recovery_hold',
    'waiting_on_questions',
    'review_requirements',
    'change_ref',
    'updated_at',
  ]));

  records.forEach(entry => assert.equal(validateRecord(entry), entry));
  validateTaskBody(task.body, 'task');
  validateHierarchyRecord(epic, lookup(records));
  validateHierarchyRecord(feature, lookup(records));
  validateHierarchyRecord(requirement, lookup(records));
  validateHierarchyRecord(task, lookup(records));
  validateHierarchyRelationships(records);

  const completedFeature = parentCompleteRecord('feature', feature.body, 3, 'delivered');
  const completedRequirement = parentCompleteRecord('requirement', requirement.body, 4, 'satisfied');
  const completedEpic = parentCompleteRecord('epic', epic.body, 2, 'achieved');
  const epicClosureRef = parentClosureRef(completedEpic, [completedFeature]);
  const featureClosureRef = parentClosureRef(completedFeature, [completedRequirement]);
  const requirementClosureRef = parentClosureRef(completedRequirement, [{
    kind: 'task',
    id: task.id,
    version: 5,
    body: {completion_disposition: 'completed'},
  }]);

  const commands = [
    parentCommand('epic', 'create', epic.id, {body: epic.body}, 0),
    parentCommand('epic', 'update', epic.id, {
      at: LATER,
      changes: {title: 'Refine epic title'},
    }),
    parentCommand('epic', 'activate', epic.id, {at: NOW}),
    parentCommand('epic', 'hold', epic.id, {
      at: NOW,
      reason: 'Waiting for a direction revision.',
      releaseCondition: 'Operator approves the new direction.',
      basisRefs: ['docs/kai/DIRECTION.md#current-goal'],
    }),
    parentCommand('epic', 'release', epic.id, {
      at: NOW,
      reason: 'Direction was revised.',
      conditionMet: true,
      basisRefs: ['docs/kai/DIRECTION.md#current-goal'],
    }),
    parentCommand('epic', 'complete', epic.id, {
      at: NOW,
      disposition: 'achieved',
      reason: 'Every required feature is delivered.',
      closureRef: epicClosureRef,
      basisRefs: ['approval:epic-completion'],
    }),
    parentCommand('feature', 'create', feature.id, {body: feature.body}, 0),
    parentCommand('feature', 'update', feature.id, {
      at: LATER,
      changes: {title: 'Refine feature title'},
    }),
    parentCommand('feature', 'activate', feature.id, {at: NOW}),
    parentCommand('feature', 'hold', feature.id, {
      at: NOW,
      reason: 'Waiting for pack acceptance.',
      releaseCondition: 'The pack authority approves the updated scope.',
      basisRefs: ['approval:feature-hold'],
    }),
    parentCommand('feature', 'release', feature.id, {
      at: NOW,
      reason: 'Scope approval landed.',
      conditionMet: true,
      basisRefs: ['approval:feature-hold'],
    }),
    parentCommand('feature', 'complete', feature.id, {
      at: NOW,
      disposition: 'delivered',
      reason: 'Every required requirement is satisfied.',
      closureRef: featureClosureRef,
      basisRefs: ['approval:feature-completion'],
    }),
    parentCommand('requirement', 'create', requirement.id, {body: requirement.body}, 0),
    parentCommand('requirement', 'update', requirement.id, {
      at: LATER,
      changes: {title: 'Refine requirement title'},
    }),
    parentCommand('requirement', 'activate', requirement.id, {at: NOW}),
    parentCommand('requirement', 'hold', requirement.id, {
      at: NOW,
      reason: 'Waiting on a human decision.',
      releaseCondition: 'The human answers the blocking requirement question.',
      basisRefs: ['question:blocking-requirement'],
    }),
    parentCommand('requirement', 'release', requirement.id, {
      at: NOW,
      reason: 'The answer arrived.',
      conditionMet: true,
      basisRefs: ['question:blocking-requirement'],
    }),
    parentCommand('requirement', 'complete', requirement.id, {
      at: NOW,
      disposition: 'satisfied',
      reason: 'Every required task reached its terminal state.',
      closureRef: requirementClosureRef,
      basisRefs: ['approval:requirement-completion'],
    }),
    taskCommand('create', {body: task.body}, 0),
    taskCommand('update', {
      changes: {
        title: 'Refine the Task title',
        updated_at: LATER,
      },
    }),
    taskCommand('promote', {at: NOW}),
    taskCommand('grant', {
      holder: actor('eng-builder-software', 'builder-run'),
      actions: [
        'task.update',
        'task.transition',
        'task.handoff',
        'question.open',
        'artifact.register',
        'asset.transition',
        'evidence.register',
        'review.record',
        'approval.record',
      ],
      acquiredAt: NOW,
      expiresAt: LATER,
    }),
    taskCommand('transition', {
      to: 'in-review',
      at: NOW,
      reason: 'Ready for independent review.',
      subject,
    }),
    taskCommand('handoff', {
      toRole: 'eng-reviewer-code',
      state: 'in-review',
      createdAt: NOW,
      messageId: uuid(900001),
      parentId: null,
      content: handoffContent(),
      artifactRefs: [],
      evidenceRefs: [],
      provenance: 'durable-thread',
      subject,
    }),
    taskCommand('restore', {
      at: NOW,
      recoveryApprovalId: uuid(900002),
    }),
  ];

  commands.forEach((command) => {
    assert.ok(COMMAND_KINDS.has(command.kind), command.kind);
    assert.equal(validateCommand(command), command);
    if (command.kind.startsWith('task.')) {
      assert.equal(validateTaskCommand(command), command);
    } else {
      assert.equal(validateParentCommand(command), command);
    }
  });

  const legacyRecord = record('item', itemBody());
  const legacyCommand = {
    operationId: uuid(999901),
    kind: 'item.create',
    actor: actor('eng-builder-software', 'builder-run'),
    recordKind: 'item',
    recordId: legacyRecord.id,
    expectedVersion: 0,
    leaseToken: null,
    payload: {body: legacyRecord.body},
  };
  assert.throws(() => validateRecord(legacyRecord), invalid());
  assert.throws(() => validateCommand(legacyCommand), invalid());
});

test('parent updates require an explicit mutation timestamp', () => {
  const missingTimestamp = parentCommand(
    'epic',
    'update',
    'epic:schema-five-cutover',
    {changes: {title: 'No mutation time'}},
  );
  assert.throws(
    () => validateParentCommand(missingTimestamp),
    invalid(/payload.*at|missing.*at/i),
  );

  const embeddedTimestamp = parentCommand(
    'epic',
    'update',
    'epic:schema-five-cutover',
    {at: LATER, changes: {title: 'Wrong timestamp location', updated_at: LATER}},
  );
  assert.throws(
    () => validateParentCommand(embeddedTimestamp),
    invalid(/updated_at|cannot change/i),
  );
});

test('parentClosureRef canonicalizes parent and required child ordering', () => {
  const parent = parentCompleteRecord('feature', featureBody({
    id: 'core:feature:ordered-parent',
    required_requirements: ['core:requirement:alpha', 'core:requirement:zeta'],
  }), 9, 'delivered');
  const alpha = parentCompleteRecord('requirement', requirementBody({
    id: 'core:requirement:alpha',
    required_tasks: ['core:task:author-contracts'],
  }), 3, 'satisfied');
  const zeta = parentCompleteRecord('requirement', requirementBody({
    id: 'core:requirement:zeta',
    required_tasks: ['core:task:author-contracts'],
  }), 7, 'satisfied');

  const expected = createHash('sha256').update(canonicalJson({
    parent: {
      kind: 'feature',
      id: 'core:feature:ordered-parent',
      version: 9,
    },
    requiredChildren: [
      {
        kind: 'requirement',
        id: 'core:requirement:alpha',
        version: 3,
        disposition: 'satisfied',
      },
      {
        kind: 'requirement',
        id: 'core:requirement:zeta',
        version: 7,
        disposition: 'satisfied',
      },
    ],
  })).digest('hex');

  assert.equal(parentClosureRef(parent, [zeta, alpha]), expected);
  assert.equal(parentClosureRef(parent, [alpha, zeta]), expected);
});

test('hierarchy validators reject invalid ids, packs, states, dispositions, and holds', () => {
  assert.throws(
    () => validateHierarchyRecord(record('epic', epicBody({id: 'core:feature:not-an-epic'}))),
    invalid(/must match "epic:<slug>"/i),
  );
  assert.throws(
    () => validateHierarchyRecord(record('feature', featureBody({id: 'epic:not-a-feature'}))),
    invalid(/must match "<pack>:feature:<slug>"/i),
  );
  assert.throws(
    () => validateHierarchyRecord(record('feature', featureBody({pack: 'engineering'}))),
    invalid(/pack must match its typed id/i),
  );
  assert.throws(
    () => validateHierarchyRecord(record('feature', featureBody({state: 'blocked'}))),
    invalid(/state is unsupported/i),
  );
  assert.throws(
    () => validateHierarchyRecord(record('feature', featureBody({completion_disposition: 'delivered'}))),
    invalid(/completion_disposition must be null until the parent is completed/i),
  );
  assert.throws(
    () => validateHierarchyRecord(record('feature', featureBody({
      state: 'completed',
      completion_disposition: null,
    }))),
    invalid(/completed parents require a completion_disposition/i),
  );
  assert.throws(
    () => validateHierarchyRecord(record('feature', featureBody({
      state: 'completed',
      completion_disposition: 'achieved',
    }))),
    invalid(/completion_disposition is unsupported for feature/i),
  );
  assert.throws(
    () => validateHierarchyRecord(record('feature', featureBody({
      hold: {
        reason: 'Need operator input.',
        set_by: actor('operator'),
        set_at: NOW,
        release_condition: 'Operator answers.',
      },
    }))),
    invalid(/basis_refs/i),
  );
  assert.throws(
    () => validateHierarchyRecord(record('feature', featureBody({
      required_requirements: ['core:requirement:validate-hierarchy'],
      optional_requirements: ['core:requirement:validate-hierarchy'],
    }))),
    invalid(/required and optional child lists must not overlap/i),
  );
});

test('hierarchy validators reject missing parents, empty satisfies, foreign requirements, and inconsistent links', () => {
  const {epic, feature, requirement, task} = validHierarchy();

  assert.throws(
    () => validateHierarchyRecord(feature, lookup([])),
    invalid(/must reference an existing epic/i),
  );
  assert.throws(
    () => validateHierarchyRecord(requirement, lookup([epic])),
    invalid(/must reference an existing same-pack feature/i),
  );
  assert.throws(
    () => validateTaskBody(taskBody({satisfies: []}), 'task'),
    invalid(/satisfies must be a non-empty array/i),
  );
  assert.throws(
    () => validateHierarchyRecord(task, lookup([epic, requirement])),
    invalid(/must reference an existing same-pack feature/i),
  );

  const otherFeature = record('feature', featureBody({
    id: 'core:feature:other-feature',
    required_requirements: ['core:requirement:other-feature-requirement'],
  }));
  const epicWithTwoFeatures = record('epic', epicBody({
    required_features: [feature.id, otherFeature.id],
  }));
  const otherRequirement = record('requirement', requirementBody({
    id: 'core:requirement:other-feature-requirement',
    feature_id: otherFeature.id,
    required_tasks: ['core:task:author-contracts'],
  }));
  const foreignTask = record('task', taskBody({
    satisfies: [otherRequirement.id],
  }));
  assert.throws(
    () => validateHierarchyRelationships([
      epicWithTwoFeatures,
      feature,
      otherFeature,
      requirement,
      otherRequirement,
      foreignTask,
    ]),
    invalid(/must satisfy only requirements that belong to its feature/i),
  );

  const missingBacklinkRequirement = record('requirement', requirementBody({
    required_tasks: [],
    optional_tasks: [],
  }));
  const missingBacklinkTask = record('task', taskBody({
    satisfies: [missingBacklinkRequirement.id],
  }));
  assert.throws(
    () => validateHierarchyRelationships([epic, feature, missingBacklinkRequirement, missingBacklinkTask]),
    invalid(/requirement-task edges must agree bidirectionally/i),
  );
});

test('feature edges, task edges, and cycle classes stay distinct', () => {
  const {epic, feature, requirement, task} = validHierarchy();

  assert.throws(
    () => validateHierarchyRecord(record('feature', featureBody({
      depends_on_features: [{feature: task.id, requires: 'delivered'}],
    }))),
    invalid(/must match "<pack>:feature:<slug>"/i),
  );
  assert.throws(
    () => validateTaskBody(taskBody({
      depends_on: [{feature: feature.id, requires: 'completed'}],
    }), 'task'),
    invalid(/depends_on\[0\] contains unknown field "feature"/i),
  );

  const featureA = record('feature', featureBody({
    id: 'core:feature:alpha',
    required_requirements: ['core:requirement:alpha'],
    depends_on_features: [{feature: 'core:feature:beta', requires: 'delivered'}],
  }));
  const featureB = record('feature', featureBody({
    id: 'core:feature:beta',
    required_requirements: ['core:requirement:beta'],
    depends_on_features: [{feature: 'core:feature:alpha', requires: 'delivered'}],
  }));
  const requirementA = record('requirement', requirementBody({
    id: 'core:requirement:alpha',
    feature_id: featureA.id,
    required_tasks: ['core:task:alpha'],
  }));
  const requirementB = record('requirement', requirementBody({
    id: 'core:requirement:beta',
    feature_id: featureB.id,
    required_tasks: ['core:task:beta'],
  }));
  const taskA = record('task', taskBody({
    id: 'core:task:alpha',
    feature_id: featureA.id,
    satisfies: [requirementA.id],
  }));
  const taskB = record('task', taskBody({
    id: 'core:task:beta',
    feature_id: featureB.id,
    satisfies: [requirementB.id],
  }));
  const dependencyEpic = record('epic', epicBody({
    required_features: [featureA.id, featureB.id],
  }));
  assert.throws(
    () => validateHierarchyRelationships([
      dependencyEpic,
      featureA,
      featureB,
      requirementA,
      requirementB,
      taskA,
      taskB,
    ]),
    invalid(/feature dependency cycle/i),
  );

  const taskCycleFeature = record('feature', featureBody({
    id: 'core:feature:task-cycle',
    required_requirements: ['core:requirement:cycle'],
  }));
  const taskCycleEpic = record('epic', epicBody({
    required_features: [taskCycleFeature.id],
  }));
  const cyclicalRequirement = record('requirement', requirementBody({
    id: 'core:requirement:cycle',
    feature_id: taskCycleFeature.id,
    required_tasks: ['core:task:one', 'core:task:two'],
  }));
  const taskOne = record('task', taskBody({
    id: 'core:task:one',
    feature_id: taskCycleFeature.id,
    satisfies: [cyclicalRequirement.id],
    depends_on: [{task: 'core:task:two', requires: 'completed'}],
  }));
  const taskTwo = record('task', taskBody({
    id: 'core:task:two',
    feature_id: taskCycleFeature.id,
    satisfies: [cyclicalRequirement.id],
    depends_on: [{task: 'core:task:one', requires: 'completed'}],
  }));
  assert.throws(
    () => validateHierarchyRelationships([
      taskCycleEpic,
      taskCycleFeature,
      cyclicalRequirement,
      taskOne,
      taskTwo,
    ]),
    invalid(/task dependency cycle/i),
  );

  const crossPackEpic = record('epic', epicBody({
    id: 'epic:cross-pack-support',
    required_features: ['engineering:feature:tooling'],
  }));
  const crossPackFeature = record('feature', featureBody({
    id: 'engineering:feature:tooling',
    pack: 'engineering',
    epic_id: crossPackEpic.id,
    required_requirements: ['engineering:requirement:tooling'],
    depends_on_features: [{feature: feature.id, requires: 'delivered'}],
  }));
  const crossPackRequirement = record('requirement', requirementBody({
    id: 'engineering:requirement:tooling',
    pack: 'engineering',
    feature_id: crossPackFeature.id,
    required_tasks: ['engineering:task:tooling'],
  }));
  const crossPackTask = record('task', taskBody({
    id: 'engineering:task:tooling',
    pack: 'engineering',
    feature_id: crossPackFeature.id,
    satisfies: [crossPackRequirement.id],
  }));
  const crossPackRecords = [
    epic,
    feature,
    requirement,
    task,
    crossPackEpic,
    crossPackFeature,
    crossPackRequirement,
    crossPackTask,
  ];
  assert.deepEqual(validateHierarchyRelationships(crossPackRecords), crossPackRecords);
});

test('composition keeps parent integrity while several requirements share tasks', () => {
  const requirementOne = record('requirement', requirementBody({
    id: 'core:requirement:one',
    required_tasks: ['core:task:first', 'core:task:second'],
  }));
  const requirementTwo = record('requirement', requirementBody({
    id: 'core:requirement:two',
    required_tasks: ['core:task:first', 'core:task:second'],
  }));
  const firstTask = record('task', taskBody({
    id: 'core:task:first',
    satisfies: [requirementOne.id, requirementTwo.id],
  }));
  const secondTask = record('task', taskBody({
    id: 'core:task:second',
    satisfies: [requirementOne.id, requirementTwo.id],
  }));
  const sharedFeature = record('feature', featureBody({
    required_requirements: [requirementOne.id, requirementTwo.id],
  }));
  const sharedEpic = record('epic', epicBody({
    required_features: [sharedFeature.id],
  }));
  const shared = [sharedEpic, sharedFeature, requirementOne, requirementTwo, firstTask, secondTask];

  assert.deepEqual(validateHierarchyRelationships(shared), shared);

  const rivalEpic = record('epic', epicBody({
    id: 'epic:rival-claim',
    required_features: [sharedFeature.id],
  }));
  assert.throws(
    () => validateHierarchyRelationships([...shared, rivalEpic]),
    invalid(/feature\/core:feature:hierarchy-contracts must belong to exactly one epic/i),
  );

  const rivalFeature = record('feature', featureBody({
    id: 'core:feature:rival',
    required_requirements: [requirementOne.id],
  }));
  const twoFeatureEpic = record('epic', epicBody({
    required_features: [sharedFeature.id, rivalFeature.id],
  }));
  assert.throws(
    () => validateHierarchyRelationships([
      twoFeatureEpic,
      sharedFeature,
      rivalFeature,
      requirementOne,
      requirementTwo,
      firstTask,
      secondTask,
    ]),
    invalid(/requirement\/core:requirement:one must belong to exactly one feature/i),
  );
});

test('hierarchy and Task contract modules import without the shared contract', () => {
  assert.equal(importProbe('hierarchy-contract.mjs', 'validateHierarchyRecord'), 'imported');
  assert.equal(importProbe('task-contract.mjs', 'validateTaskBody'), 'imported');
  assert.equal(importProbe('contract-primitives.mjs', 'canonicalJson'), 'imported');

  for (const module of ['hierarchy-contract.mjs', 'task-contract.mjs', 'contract-primitives.mjs']) {
    const source = readFileSync(new URL(
      `../src/core/lib/coordination-runtime/${module}`,
      import.meta.url,
    ), 'utf8');
    assert.ok(
      !/from '\.\/contract\.mjs'/.test(source),
      `${module} must not import the shared contract surface`,
    );
  }
});

console.log('coordination hierarchy contract self-test: all checks passed');
