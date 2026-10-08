import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync, rmSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  criteriaRef,
  subjectRef,
  validateRecord,
} from '../src/core/lib/coordination-runtime/contract.mjs';
import {
  deriveAttention,
  hierarchyContext,
  hierarchyStatus,
  taskPlan,
} from '../src/core/lib/coordination-runtime/hierarchy-view.mjs';
import {planHierarchy} from '../src/core/lib/coordination-runtime/host-plan.mjs';
import {
  closeStore,
  openStore,
  readRecord,
} from '../src/core/lib/coordination-runtime/store.mjs';
import {parseArguments} from '../src/core/coordinate.mjs';
import {seedRecord} from './helpers/coordination-runtime-fixture.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const scratchRoot = join(repoRoot, '.superpowers', 'hierarchy-view-self-test');
const NOW = '2026-10-06T18:00:00.000Z';
const DIRECTION_BYTES = Buffer.from([
  '# Vision',
  'A composable workspace.',
  '',
  '# Mission',
  'Coordinate exact work safely.',
  '',
  '# Current Goal',
  'Ship hierarchy-aware read surfaces.',
  '',
  '# Out of Scope',
  'Schema 5 workspace activation remains deferred.',
  '',
].join('\n'));
const DIRECTION = Object.freeze({
  path: 'docs/kai/DIRECTION.md',
  hash: createHash('sha256').update(DIRECTION_BYTES).digest('hex'),
  goal: 'Ship hierarchy-aware read surfaces.',
});
const STALE_DIRECTION = Object.freeze({...DIRECTION, hash: 'f'.repeat(64)});
const ROLES = Object.freeze([
  'eng-lead-architecture',
  'eng-builder-software',
  'eng-reviewer-code',
  'workflow-ship',
]);

const ids = Object.freeze({
  alpha: 'epic:alpha',
  beta: 'epic:beta',
  core: 'core:feature:platform',
  completedFeature: 'core:feature:completed',
  engineering: 'engineering:feature:engine',
  creative: 'creative:feature:experience',
  stale: 'engineering:feature:stale',
  coreRequirement: 'core:requirement:platform',
  engineeringRequirement: 'engineering:requirement:engine',
  creativeRequirement: 'creative:requirement:experience',
  staleRequirement: 'engineering:requirement:stale',
  executable: 'core:task:executable',
  dependencyBlocked: 'core:task:dependency-blocked',
  proposed: 'core:task:proposed',
  leased: 'core:task:leased',
  humanGated: 'core:task:human-gated',
  missingEvidence: 'core:task:missing-evidence',
  engineeringTask: 'engineering:task:engine',
  heldTask: 'creative:task:held',
  staleTask: 'engineering:task:stale',
});

function record(kind, body, version = 1) {
  return {kind, id: body.id, subject: null, version, body};
}

function epicBody(id, overrides = {}) {
  return {
    schema_version: 1,
    id,
    title: id === ids.alpha ? 'Deliver hierarchy views' : 'Prepare later work',
    state: 'active',
    completion_disposition: null,
    owner: 'eng-lead-architecture',
    scope_authority: 'eng-lead-architecture',
    completion_authority: 'eng-reviewer-code',
    priority: 1,
    outcome: 'The hierarchy remains explicit.',
    acceptance: ['The hierarchy view is complete and bounded.'],
    hold: null,
    created_at: NOW,
    updated_at: NOW,
    direction_ref: DIRECTION,
    contribution: 'Makes hierarchy state readable.',
    scope_fit: 'Does not activate schema 5.',
    required_features: [],
    optional_features: [],
    ...overrides,
  };
}

function featureBody({id, pack, epicId = ids.alpha, overrides = {}}) {
  return {
    schema_version: 1,
    id,
    pack,
    epic_id: epicId,
    title: `${pack} hierarchy feature`,
    state: 'active',
    completion_disposition: null,
    owner: pack === 'creative' ? 'creative-lead-design' : 'eng-lead-architecture',
    scope_authority: 'eng-lead-architecture',
    completion_authority: 'eng-reviewer-code',
    priority: 1,
    outcome: 'Pack work is visible.',
    acceptance: ['Feature state is represented exactly.'],
    hold: null,
    created_at: NOW,
    updated_at: NOW,
    required_requirements: [],
    optional_requirements: [],
    depends_on_features: [],
    ...overrides,
  };
}

function requirementBody({id, pack, featureId, taskIds, overrides = {}}) {
  return {
    schema_version: 1,
    id,
    pack,
    feature_id: featureId,
    title: `${pack} hierarchy requirement`,
    state: 'active',
    completion_disposition: null,
    owner: 'eng-builder-software',
    scope_authority: 'eng-builder-software',
    completion_authority: 'eng-reviewer-code',
    priority: 1,
    outcome: 'Required behavior is verifiable.',
    acceptance: ['Every Task remains visible.'],
    hold: null,
    created_at: NOW,
    updated_at: NOW,
    required_tasks: taskIds,
    optional_tasks: [],
    ...overrides,
  };
}

function taskBody({id, pack, featureId, requirementId, overrides = {}}) {
  return {
    schema_version: 1,
    id,
    pack,
    feature_id: featureId,
    satisfies: [requirementId],
    title: id.split(':').at(-1).replaceAll('-', ' '),
    delivery_class: 'knowledge',
    state: 'ready',
    resume_state: null,
    scope_authority: 'eng-builder-software',
    completion_authority: 'eng-reviewer-code',
    producer_actor: null,
    producing_actors: [],
    acceptance_actor: null,
    priority: 1,
    next_role: 'eng-builder-software',
    outcome: 'The focused Task is complete.',
    acceptance: ['The exact Task result is verified.'],
    artifact_expectation: 'none',
    artifact_expectation_reason: 'The code change is the durable result.',
    artifact_class: null,
    durability: null,
    validity_owner: null,
    artifact_targets: [],
    context_artifacts: [],
    touches: ['src/core/lib/coordination-runtime/**'],
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

function insertMessage(store, feature) {
  const messageId = randomUUID();
  const questionId = `hierarchy-question-${randomUUID()}`;
  const subject = {kind: 'feature', id: feature.id};
  const message = validateRecord({
    kind: 'message',
    id: messageId,
    subject,
    version: 1,
    body: {
      schema_version: 1,
      message_id: messageId,
      subject,
      thread_id: subjectRef(subject, feature.version),
      parent_id: null,
      sender_role: 'creative-lead-design',
      sender_run: 'creative-context',
      recipient: 'operator',
      kind: 'question',
      created_at: NOW,
      basis_version: feature.version,
      payload: {
        questionKind: 'decision',
        blocking: true,
        context: 'The hold needs an explicit operator decision.',
        ask: 'May the held Feature continue?',
        answerBy: 'Before any new grant',
      },
      artifact_refs: [],
      evidence_refs: [],
      provenance: 'durable-thread',
    },
  });
  seedRecord(store, message);
  seedRecord(store, validateRecord({
    kind: 'question',
    id: questionId,
    subject,
    version: 1,
    body: {
      schema_version: 1,
      question_id: questionId,
      subject,
      asker: {role: 'creative-lead-design', runId: 'creative-context'},
      recipient: 'operator',
      kind: 'decision',
      blocking: true,
      status: 'open',
      context: 'The hold needs an explicit operator decision.',
      ask: 'May the held Feature continue?',
      answer_by: 'Before any new grant',
      opened_message_id: messageId,
      answer_message_ids: [],
      resolution: null,
    },
  }));
  store.database.prepare(`
    INSERT INTO events (operation_id, subject_kind, subject_id, payload)
    VALUES (?, ?, ?, ?)
  `).run(`message-${messageId}`, subject.kind, subject.id, JSON.stringify({
    kind: 'question.open',
    actor: {role: message.body.sender_role, runId: message.body.sender_run},
    recordKind: subject.kind,
    recordId: subject.id,
    payload: {messageId, questionId},
  }));
  return {messageId, questionId};
}

function insertDecision(store, feature) {
  const approvalId = randomUUID();
  const subject = {kind: 'feature', id: feature.id};
  const approval = validateRecord({
    kind: 'approval',
    id: approvalId,
    subject,
    version: 1,
    body: {
      schema_version: 1,
      approval_id: approvalId,
      subject,
      authority: {role: 'eng-reviewer-code', runId: 'feature-review'},
      kind: 'completion',
      content_ref: null,
      criteria_ref: criteriaRef(feature, (kind, id) => readRecord(store, kind, id)),
      supersedes: [],
      deployment: null,
      recovery: null,
      decision: 'approved',
      evidence_refs: ['decision:feature-review'],
      reason: 'The current decision remains visible in bounded context.',
      created_at: NOW,
      recorded_at_subject_version: feature.version,
    },
  });
  seedRecord(store, approval);
  store.database.prepare(`
    INSERT INTO events (operation_id, subject_kind, subject_id, payload)
    VALUES (?, ?, ?, ?)
  `).run(`approval-${approvalId}`, subject.kind, subject.id, JSON.stringify({
    kind: 'approval.record',
    actor: approval.body.authority,
    recordKind: subject.kind,
    recordId: subject.id,
    payload: {body: approval.body},
  }));
  return approvalId;
}

function seedHierarchy(store) {
  const coreTasks = [
    taskBody({
      id: ids.executable,
      pack: 'core',
      featureId: ids.core,
      requirementId: ids.coreRequirement,
      overrides: {priority: 0},
    }),
    taskBody({
      id: ids.dependencyBlocked,
      pack: 'core',
      featureId: ids.core,
      requirementId: ids.coreRequirement,
      overrides: {depends_on: [{task: ids.executable, requires: 'completed'}]},
    }),
    taskBody({
      id: ids.proposed,
      pack: 'core',
      featureId: ids.core,
      requirementId: ids.coreRequirement,
      overrides: {state: 'proposed'},
    }),
    taskBody({
      id: ids.leased,
      pack: 'core',
      featureId: ids.core,
      requirementId: ids.coreRequirement,
      overrides: {
        lease: {
          holder: {role: 'eng-builder-software', runId: 'leased-run'},
          token: 'active-lease',
          version_at_grant: 1,
          acquired_at: NOW,
          expires_at: '2099-01-01T00:00:00.000Z',
        },
      },
    }),
    taskBody({
      id: ids.humanGated,
      pack: 'core',
      featureId: ids.core,
      requirementId: ids.coreRequirement,
      overrides: {
        delivery_class: 'product-change',
        state: 'release-ready',
        next_role: 'workflow-ship',
        change_ref: {
          kind: 'sha256',
          path: 'src/human-gated.mjs',
          digest: 'a'.repeat(64),
        },
      },
    }),
    taskBody({
      id: ids.missingEvidence,
      pack: 'core',
      featureId: ids.core,
      requirementId: ids.coreRequirement,
      overrides: {context_artifacts: [`artifact:${randomUUID()}`]},
    }),
  ];
  const engineeringTask = taskBody({
    id: ids.engineeringTask,
    pack: 'engineering',
    featureId: ids.engineering,
    requirementId: ids.engineeringRequirement,
  });
  const heldTask = taskBody({
    id: ids.heldTask,
    pack: 'creative',
    featureId: ids.creative,
    requirementId: ids.creativeRequirement,
  });
  const staleTask = taskBody({
    id: ids.staleTask,
    pack: 'engineering',
    featureId: ids.stale,
    requirementId: ids.staleRequirement,
  });

  const alpha = record('epic', epicBody(ids.alpha, {
    required_features: [ids.core, ids.engineering, ids.creative],
    optional_features: [ids.completedFeature],
  }));
  const beta = record('epic', epicBody(ids.beta, {
    state: 'proposed',
    scope_authority: 'operator',
    direction_ref: STALE_DIRECTION,
    required_features: [ids.stale],
  }));
  const core = record('feature', featureBody({
    id: ids.core,
    pack: 'core',
    overrides: {required_requirements: [ids.coreRequirement]},
  }));
  const engineering = record('feature', featureBody({
    id: ids.engineering,
    pack: 'engineering',
    overrides: {
      required_requirements: [ids.engineeringRequirement],
      depends_on_features: [{feature: ids.core, requires: 'delivered'}],
    },
  }));
  const creative = record('feature', featureBody({
    id: ids.creative,
    pack: 'creative',
    overrides: {
      required_requirements: [ids.creativeRequirement],
      depends_on_features: [{feature: ids.core, requires: 'delivered'}],
      hold: {
        reason: 'An operator decision is required before continuing.',
        set_by: {role: 'creative-lead-design', runId: 'creative-context'},
        set_at: NOW,
        release_condition: 'Operator approves the revised public identity.',
        basis_refs: ['direction:public-identity'],
      },
    },
  }));
  const stale = record('feature', featureBody({
    id: ids.stale,
    pack: 'engineering',
    epicId: ids.beta,
    overrides: {required_requirements: [ids.staleRequirement]},
  }));
  const requirements = [
    record('requirement', requirementBody({
      id: ids.coreRequirement,
      pack: 'core',
      featureId: ids.core,
      taskIds: coreTasks.map(task => task.id),
    })),
    record('requirement', requirementBody({
      id: ids.engineeringRequirement,
      pack: 'engineering',
      featureId: ids.engineering,
      taskIds: [engineeringTask.id],
    })),
    record('requirement', requirementBody({
      id: ids.creativeRequirement,
      pack: 'creative',
      featureId: ids.creative,
      taskIds: [heldTask.id],
    })),
    record('requirement', requirementBody({
      id: ids.staleRequirement,
      pack: 'engineering',
      featureId: ids.stale,
      taskIds: [staleTask.id],
    })),
  ];

  for (const entry of [
    alpha,
    beta,
    core,
    record('feature', featureBody({
      id: ids.completedFeature,
      pack: 'core',
      overrides: {
        title: 'Completed hierarchy feature',
        state: 'completed',
        completion_disposition: 'delivered',
      },
    })),
    engineering,
    creative,
    stale,
    ...requirements,
    ...coreTasks.map(body => record('task', body)),
    record('task', engineeringTask),
    record('task', heldTask),
    record('task', staleTask),
  ]) {
    seedRecord(store, entry);
  }
  const communication = insertMessage(store, creative);
  const decisionId = insertDecision(store, creative);
  return {alpha, beta, core, engineering, creative, stale, communication, decisionId};
}

async function withHierarchyWorkspace(run) {
  const root = join(scratchRoot, randomUUID());
  mkdirSync(join(root, '.kai', 'state'), {recursive: true});
  mkdirSync(join(root, 'docs', 'kai'), {recursive: true});
  writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), DIRECTION_BYTES);
  writeFileSync(join(root, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: 'test',
    schema_version: 4,
    scaffolded: NOW,
    workspace_id: `hierarchy-view-${randomUUID()}`,
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
    path: join(root, '.kai', 'state', 'coordination.sqlite'),
    mode: 'create',
  });
  try {
    const fixture = seedHierarchy(store);
    return await run({root, store, fixture});
  } finally {
    closeStore(store);
    rmSync(root, {recursive: true, force: true});
  }
}

test('status rolls Current Goal to Epics and packs while pack expansion keeps Feature → Requirement → Task', async () =>
  withHierarchyWorkspace(({store}) => {
    const status = hierarchyStatus(store, {direction: DIRECTION, roles: ROLES});

    assert.equal(status.goal.text, DIRECTION.goal);
    assert.deepEqual(status.epics.map(epic => epic.id), [ids.alpha, ids.beta]);
    assert.deepEqual(status.epics[0].packs.map(pack => pack.pack), [
      'core',
      'creative',
      'engineering',
    ]);
    const core = status.epics[0].packs.find(pack => pack.pack === 'core');
    assert.equal(core.features[0].id, ids.core);
    assert.equal(core.features[0].requirements[0].id, ids.coreRequirement);
    assert.equal(core.features[0].requirements[0].tasks[0].kind, 'task');
    assert.equal(status.epics[1].lifecycle.state, 'proposed');
    assert.notEqual(status.epics[1].attention.value, 'completed');
    const completed = core.features.find(feature => feature.id === ids.completedFeature);
    assert.equal(completed.lifecycle.state, 'completed');
    assert.equal(completed.attention.value, 'none');
  }));

test('attention is derived, keeps every reason, gives needs-human precedence, and reports staffing gaps without writes', async () =>
  withHierarchyWorkspace(({store, fixture}) => {
    const before = structuredClone(readRecord(store, 'feature', ids.creative));
    const result = deriveAttention(store, {
      record: before,
      direction: DIRECTION,
      roles: ROLES,
    });

    assert.equal(result.value, 'needs-human');
    assert.deepEqual(
      new Set(result.reasons.map(reason => reason.code)),
      new Set(['hold', 'unmet-dependency', 'operator-question']),
    );
    assert.ok(result.reasons.some(reason => reason.attention === 'blocked'));
    assert.ok(result.reasons.some(reason => reason.attention === 'needs-human'));
    assert.deepEqual(result.staffing_gaps, [{
      role: 'creative-lead-design',
      responsibilities: ['owner'],
    }]);
    assert.deepEqual(readRecord(store, 'feature', fixture.creative.id), before);

    const stale = deriveAttention(store, {
      record: fixture.beta,
      direction: DIRECTION,
      roles: ROLES,
    });
    assert.equal(stale.value, 'needs-human');
    assert.deepEqual(
      new Set(stale.reasons.map(reason => reason.code)),
      new Set(['stale-direction', 'human-activation']),
    );

    const missing = readRecord(store, 'task', ids.missingEvidence);
    assert.equal(deriveAttention(store, {
      record: missing,
      direction: DIRECTION,
      roles: ROLES,
    }).reasons.some(reason => reason.code === 'missing-evidence'), true);
  }));

test('deriveAttention rereads the selected record inside its SQLite snapshot', async () =>
  withHierarchyWorkspace(({root, store}) => {
    const stale = readRecord(store, 'feature', ids.core);
    const writer = openStore({
      path: join(root, '.kai', 'state', 'coordination.sqlite'),
      mode: 'write',
    });
    const originalExec = store.database.exec.bind(store.database);
    let advanced = false;
    store.database.exec = sql => {
      const result = originalExec(sql);
      if (sql === 'BEGIN DEFERRED' && !advanced) {
        advanced = true;
        const current = readRecord(writer, 'feature', ids.core);
        writer.database.prepare(`
          UPDATE records
          SET version = ?, body = ?
          WHERE kind = 'feature' AND id = ?
        `).run(
          current.version + 1,
          JSON.stringify({
            ...current.body,
            state: 'proposed',
            scope_authority: 'operator',
            updated_at: '2026-10-06T18:01:00.000Z',
          }),
          ids.core,
        );
        const epic = readRecord(writer, 'epic', ids.alpha);
        writer.database.prepare(`
          UPDATE records
          SET version = ?, body = ?
          WHERE kind = 'epic' AND id = ?
        `).run(
          epic.version + 1,
          JSON.stringify({
            ...epic.body,
            owner: 'operator',
            updated_at: '2026-10-06T18:01:00.000Z',
          }),
          ids.alpha,
        );
      }
      return result;
    };
    try {
      const attention = deriveAttention(store, {
        record: stale,
        direction: DIRECTION,
        roles: ROLES,
      });
      assert.equal(advanced, true);
      assert.equal(attention.value, 'needs-human');
      assert.ok(attention.reasons.some(reason => reason.code === 'human-activation'));
      assert.deepEqual(attention.next_action, {
        kind: 'feature.activate',
        role: 'operator',
      });
    } finally {
      store.database.exec = originalExec;
      closeStore(writer);
    }
  }));

test('hierarchy context is bounded and includes the selected record, chain, children, dependencies, decisions, questions, messages, and hold', async () =>
  withHierarchyWorkspace(({store, fixture}) => {
    const projection = hierarchyContext(store, {
      subject: {kind: 'feature', id: ids.creative},
      maxBytes: 24 * 1024,
      recentLimit: 8,
      direction: DIRECTION,
      roles: ROLES,
    });
    const packet = JSON.parse(projection.text);

    assert.ok(projection.bytes <= 24 * 1024);
    assert.equal(packet.selected_record.id, ids.creative);
    assert.deepEqual(packet.ancestors.map(record => record.id), [ids.alpha]);
    assert.deepEqual(packet.direct_children.map(record => record.id), [ids.creativeRequirement]);
    assert.deepEqual(packet.dependencies.map(dependency => dependency.id), [ids.core]);
    assert.deepEqual(packet.acceptance, fixture.creative.body.acceptance);
    assert.equal(packet.authority.scope_authority, fixture.creative.body.scope_authority);
    assert.equal(packet.current_decisions[0].ref, `approval:${fixture.decisionId}`);
    assert.equal(packet.unresolved_questions[0].ref, `question:${fixture.communication.questionId}`);
    assert.equal(packet.recent_messages[0].ref, `message:${fixture.communication.messageId}`);
    assert.deepEqual(packet.active_hold, {
      source: {kind: 'feature', id: ids.creative},
      ...fixture.creative.body.hold,
    });
    assert.equal(packet.attention.value, 'needs-human');
  }));

test('Task context includes the nearest effective ancestor hold and its release basis', async () =>
  withHierarchyWorkspace(({store, fixture}) => {
    const projection = hierarchyContext(store, {
      subject: {kind: 'task', id: ids.heldTask},
      maxBytes: 24 * 1024,
      recentLimit: 8,
      direction: DIRECTION,
      roles: ROLES,
    });
    const packet = JSON.parse(projection.text);

    assert.deepEqual(packet.active_hold, {
      source: {kind: 'feature', id: ids.creative},
      ...fixture.creative.body.hold,
    });
  }));

test('plan returns only executable Tasks, never dispatches, and explains every exclusion', async () =>
  withHierarchyWorkspace(({store}) => {
    const core = taskPlan(store, {
      subject: {kind: 'feature', id: ids.core},
      direction: DIRECTION,
      roles: ROLES,
    });
    assert.equal(core.automatic, false);
    assert.deepEqual(core.tasks.map(task => task.id), [ids.executable]);
    assert.deepEqual(new Set(core.excluded.flatMap(entry => entry.reasons.map(reason => reason.code))),
      new Set([
        'unmet-dependency',
        'proposed',
        'leased',
        'needs-human',
        'missing-evidence',
      ]));

    const held = taskPlan(store, {
      subject: {kind: 'feature', id: ids.creative},
      direction: DIRECTION,
      roles: ROLES,
    });
    assert.deepEqual(held.tasks, []);
    assert.ok(held.excluded[0].reasons.some(reason => reason.code === 'hold'));

    const stale = planHierarchy({
      store,
      subject: {kind: 'epic', id: ids.beta},
      direction: DIRECTION,
      roles: ROLES,
    });
    assert.equal(stale.automatic, false);
    assert.deepEqual(stale.tasks, []);
    assert.ok(stale.excluded[0].reasons.some(reason => reason.code === 'stale-direction'));
  }));

test('Requirement plan excludes Tasks whose reverse Requirement membership is missing', async () =>
  withHierarchyWorkspace(({store}) => {
    const secondRequirement = 'core:requirement:secondary';
    const oneSidedTask = 'core:task:one-sided-membership';
    const core = readRecord(store, 'feature', ids.core);
    store.database.prepare(`
      UPDATE records
      SET body = ?
      WHERE kind = 'feature' AND id = ?
    `).run(JSON.stringify({
      ...core.body,
      required_requirements: [...core.body.required_requirements, secondRequirement],
    }), ids.core);
    seedRecord(store, record('requirement', requirementBody({
      id: secondRequirement,
      pack: 'core',
      featureId: ids.core,
      taskIds: [oneSidedTask],
    })));
    seedRecord(store, record('task', taskBody({
      id: oneSidedTask,
      pack: 'core',
      featureId: ids.core,
      requirementId: secondRequirement,
    })));
    const selected = readRecord(store, 'requirement', ids.coreRequirement);
    store.database.prepare(`
      UPDATE records
      SET body = ?
      WHERE kind = 'requirement' AND id = ?
    `).run(JSON.stringify({
      ...selected.body,
      required_tasks: [...selected.body.required_tasks, oneSidedTask],
    }), ids.coreRequirement);

    const plan = taskPlan(store, {
      subject: {kind: 'requirement', id: ids.coreRequirement},
      direction: DIRECTION,
      roles: ROLES,
    });
    assert.equal(plan.tasks.some(task => task.id === oneSidedTask), false);
    const exclusion = plan.excluded.find(task => task.id === oneSidedTask);
    assert.ok(exclusion);
    assert.deepEqual(exclusion.reasons, [{
      code: 'relationship-invalid',
      message: `Task does not declare Requirement ${ids.coreRequirement}`,
    }]);
  }));

test('proposed Feature and Requirement staffing includes the owning parent activation authority', async () =>
  withHierarchyWorkspace(({store}) => {
    const alpha = readRecord(store, 'epic', ids.alpha);
    store.database.prepare(`
      UPDATE records
      SET body = ?
      WHERE kind = 'epic' AND id = ?
    `).run(JSON.stringify({...alpha.body, owner: 'missing-epic-owner'}), ids.alpha);
    const core = readRecord(store, 'feature', ids.core);
    store.database.prepare(`
      UPDATE records
      SET body = ?
      WHERE kind = 'feature' AND id = ?
    `).run(JSON.stringify({...core.body, state: 'proposed'}), ids.core);

    assert.deepEqual(deriveAttention(store, {
      record: readRecord(store, 'feature', ids.core),
      direction: DIRECTION,
      roles: ROLES,
    }).staffing_gaps, [{
      role: 'missing-epic-owner',
      responsibilities: ['activation-authority'],
    }]);
  }));

test('proposed Requirement staffing uses the Feature owner as activation authority', async () =>
  withHierarchyWorkspace(({store}) => {
    const core = readRecord(store, 'feature', ids.core);
    store.database.prepare(`
      UPDATE records
      SET body = ?
      WHERE kind = 'feature' AND id = ?
    `).run(JSON.stringify({...core.body, owner: 'missing-feature-owner'}), ids.core);
    const requirement = readRecord(store, 'requirement', ids.coreRequirement);
    store.database.prepare(`
      UPDATE records
      SET body = ?
      WHERE kind = 'requirement' AND id = ?
    `).run(JSON.stringify({...requirement.body, state: 'proposed'}), ids.coreRequirement);

    assert.deepEqual(deriveAttention(store, {
      record: readRecord(store, 'requirement', ids.coreRequirement),
      direction: DIRECTION,
      roles: ROLES,
    }).staffing_gaps, [{
      role: 'missing-feature-owner',
      responsibilities: ['activation-authority'],
    }]);
  }));

test('each hierarchy projection uses one SQLite snapshot even when nested context readers participate', async () =>
  withHierarchyWorkspace(({store}) => {
    const originalExec = store.database.exec.bind(store.database);
    let begins = 0;
    store.database.exec = sql => {
      if (sql === 'BEGIN DEFERRED') begins += 1;
      return originalExec(sql);
    };
    try {
      hierarchyStatus(store, {direction: DIRECTION, roles: ROLES});
      assert.equal(begins, 1);
      begins = 0;
      hierarchyContext(store, {
        subject: {kind: 'feature', id: ids.creative},
        maxBytes: 24 * 1024,
        recentLimit: 8,
        direction: DIRECTION,
        roles: ROLES,
      });
      assert.equal(begins, 1);
      begins = 0;
      taskPlan(store, {
        subject: {kind: 'epic', id: ids.alpha},
        direction: DIRECTION,
        roles: ROLES,
      });
      assert.equal(begins, 1);
    } finally {
      store.database.exec = originalExec;
    }
  }));

test('typed CLI identities reject mismatched IDs and every old --item selector', () => {
  assert.throws(
    () => parseArguments(['context', '--kind', 'feature', '--id', ids.executable]),
    error => error.code === 'INVALID_INPUT',
  );
  assert.throws(
    () => parseArguments(['claim', '--item', ids.executable]),
    error => error.code === 'INVALID_INPUT',
  );
  assert.throws(
    () => parseArguments(['plan', '--item', ids.executable]),
    error => error.code === 'INVALID_INPUT',
  );
  assert.deepEqual(parseArguments(['claim', '--task', ids.executable]), {
    verb: 'claim',
    options: {task: ids.executable},
  });
});
