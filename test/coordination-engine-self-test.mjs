import assert from 'node:assert/strict';
import test from 'node:test';
import {createHash, randomUUID} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {
  RuntimeError,
  criteriaRef,
  validateCommand,
  validateRecord,
  validateSubjectRef,
} from '../scripts/lib/coordination-runtime/contract.mjs';
import {applyCommand} from '../scripts/lib/coordination-runtime/engine.mjs';
import {bindEvidenceRuntime} from '../scripts/lib/coordination-runtime/evidence.mjs';
import {retainSubject} from '../scripts/lib/coordination-runtime/evidence-content.mjs';
import {readRecord} from '../scripts/lib/coordination-runtime/store.mjs';
import {
  authority,
  command,
  seedInitiative,
  seedItem,
  seedRecord,
  withWorkspace,
} from './helpers/coordination-runtime-fixture.mjs';

const NOW = '2026-09-16T12:00:00.000Z';
const LATER = '2099-09-16T13:00:00.000Z';
const EXPIRED = '2000-01-01T00:00:00.000Z';
const builder = {role: 'eng-builder-software', runId: 'builder-run'};
const reviewer = {role: 'eng-reviewer-code', runId: 'review-run'};
const quality = {role: 'eng-reviewer-quality', runId: 'quality-run'};
const steward = {role: 'eng-lead-architecture', runId: 'steward-run'};
const shipper = {role: 'workflow-ship', runId: 'ship-run'};
const operator = {role: 'operator', runId: 'operator-run'};
const runDirectory = '.kai/runs/engine/2026-09-16/01-fixture';
const subjectBytes = 'Exact engine completion fixture bytes.';
const subject = {
  kind: 'sha256',
  path: `${runDirectory}/subject.txt`,
  digest: createHash('sha256').update(subjectBytes).digest('hex'),
};

function retainedRefs(store, itemId, artifactSubject = subject, binding = criteriaRef(readRecord(store, 'item', itemId).body)) {
  const root = dirname(dirname(dirname(store.path)));
  bindEvidenceRuntime(store, {root, authority: {roles: [], grants: []}, runs: []});
  const id = randomUUID();
  const exactSubject = artifactSubject ?? subject;
  const absolute = join(root, exactSubject.path);
  mkdirSync(dirname(absolute), {recursive: true});
  writeFileSync(absolute, exactSubject.digest === subject.digest ? subjectBytes : 'Other immutable revision.');
  const retained = retainSubject(root, exactSubject, null, runDirectory, id);
  seedRecord(store, {
    kind: 'artifact', id, itemId, version: 1,
    body: {
      schema_version: 1, artifact_id: id, item_id: itemId, producer: builder,
      subject: exactSubject, criteria_ref: binding, project_id: null, run_directory: runDirectory,
      ...retained, classification: 'internal', media_type: 'text/plain',
      title: 'Engine retained content fixture', created_at: NOW,
    },
  });
  return [`artifact:${id}`];
}

function grant(actor, action, version, options = {}) {
  return authority(actor, action, {version, ...options});
}

function itemCommand(kind, actor, expectedVersion, payload, leaseToken = null) {
  return command(kind, {
    actor,
    expectedVersion,
    leaseToken,
    payload,
  });
}

function seedReview(store, {
  id = randomUUID(),
  itemId = 'demo',
  actor = reviewer,
  kind = 'independent-code',
  reviewSubject = subject,
  verdict = 'approved',
  criteria = ['The runtime behavior is verified.'],
  createdAt = NOW,
  binding = criteriaRef(readRecord(store, 'item', itemId).body),
  supersedes = [],
} = {}) {
  return seedRecord(store, {
    kind: 'review',
    id,
    itemId,
    version: 1,
    body: {
      schema_version: 1,
      review_id: id,
      item_id: itemId,
      reviewer: actor,
      kind,
      subject: reviewSubject,
      criteria,
      criteria_ref: binding,
      supersedes,
      verdict,
      finding_refs: [],
      evidence_refs: retainedRefs(store, itemId, reviewSubject, binding),
      created_at: createdAt,
    },
  });
}

function seedApproval(store, {
  id = randomUUID(),
  itemId = 'demo',
  actor = reviewer,
  kind = 'completion',
  approvalSubject = subject,
  decision = 'approved',
  binding = criteriaRef(readRecord(store, 'item', itemId).body),
  supersedes = [],
  deployment = kind.startsWith('operator-deploy-')
    ? {environment: 'production', environment_class: 'production', deployment_id: 'deploy-123'} : null,
  recovery = null,
} = {}) {
  return seedRecord(store, {
    kind: 'approval',
    id,
    itemId,
    version: 1,
    body: {
      schema_version: 1,
      approval_id: id,
      item_id: itemId,
      authority: actor,
      kind,
      subject: approvalSubject,
      criteria_ref: binding,
      supersedes,
      deployment,
      recovery,
      decision,
      evidence_refs: retainedRefs(store, itemId, approvalSubject, binding),
      reason: 'The exact subject satisfies the acceptance contract.',
      created_at: NOW,
    },
  });
}

function seedEvidence(store, {
  id = randomUUID(),
  itemId = 'demo',
  kind,
  evidenceSubject = subject,
  dimension = null,
  outcome = 'passed',
  data = {},
  supersedes = [],
} = {}) {
  const normalizedData = Object.keys(data).length > 0
    ? data
    : kind === 'deployment'
      ? {environment: 'production', deployment_id: 'deploy-123'}
      : kind === 'production-verification'
        ? {environment: 'production', deployment_id: 'deploy-123', checks: ['smoke', 'health']}
        : {};
  return seedRecord(store, {
    kind: 'evidence',
    id,
    itemId,
    version: 1,
    body: {
      schema_version: 1,
      evidence_id: id,
      item_id: itemId,
      kind,
      subject: evidenceSubject,
      criteria_ref: kind === 'recovery-reconciliation'
        ? null : criteriaRef(readRecord(store, 'item', itemId).body),
      dimension,
      outcome,
      evidence_refs: retainedRefs(store, itemId, evidenceSubject),
      reason: outcome === 'waived' ? 'Not applicable to this bounded change.' : null,
      data: normalizedData,
      supersedes,
      created_at: NOW,
    },
  });
}

function seedReleaseEvidence(store) {
  for (const dimension of [
    'scope-true',
    'verified',
    'reviewed',
    'shippable-safely',
    'documented',
    'coordination-closed',
  ]) {
    seedEvidence(store, {kind: 'dod-dimension', dimension, outcome: 'clear'});
  }
}

function activeLease(holder = builder, token = 'lease-token', overrides = {}) {
  return {
    holder,
    token,
    version_at_grant: 1,
    acquired_at: NOW,
    expires_at: LATER,
    ...overrides,
  };
}

function transitionAuthority(actor, version, action = 'item.transition') {
  return grant(actor, action, version);
}

await test('command and domain validation are closed over Task4 shapes', () => {
  assert.deepEqual(validateSubjectRef({
    kind: 'sha256',
    digest: 'a'.repeat(64),
    path: '.kai/state/artifacts/decision.md',
  }), {
    kind: 'sha256',
    digest: 'a'.repeat(64),
    path: '.kai/state/artifacts/decision.md',
  });
  assert.deepEqual(validateSubjectRef({
    kind: 'bundle-sha256',
    digest: 'b'.repeat(64),
    entries: [{
      path: 'dist/app.js',
      digest: 'c'.repeat(64),
    }],
  }), {
    kind: 'bundle-sha256',
    digest: 'b'.repeat(64),
    entries: [{
      path: 'dist/app.js',
      digest: 'c'.repeat(64),
    }],
  });
  assert.throws(() => validateCommand(itemCommand(
    'item.transition',
    builder,
    1,
    {to: 'in-review', at: NOW, reason: 'Ready', accepted: true},
  )), error => error.code === 'INVALID_INPUT');
  assert.throws(() => validateCommand(itemCommand(
    'question.answer',
    reviewer,
    1,
    {
      questionId: 'q1',
      messageId: randomUUID(),
      parentId: randomUUID(),
      recipient: builder.role,
      kind: 'answer',
      createdAt: NOW,
      content: {status: 'answered', answer: 'Yes', lane: 'in-lane'},
      artifactRefs: [],
      evidenceRefs: [],
      provenance: 'durable-thread',
      clearsBlocker: true,
    },
  )), error => error.code === 'INVALID_INPUT');
  assert.throws(() => validateRecord({
    kind: 'review',
    id: randomUUID(),
    itemId: 'demo',
    version: 1,
    body: {
      schema_version: 1,
      review_id: randomUUID(),
      item_id: 'demo',
      reviewer,
      kind: 'independent-code',
      subject,
      criteria: [],
      verdict: 'approved',
      finding_refs: [],
      evidence_refs: [],
      created_at: NOW,
      accepted: true,
    },
  }), error => error.code === 'INVALID_INPUT');
  assert.throws(() => validateRecord({
    kind: 'review',
    id: randomUUID(),
    itemId: 'demo',
    version: 1,
    body: {
      schema_version: 1,
      review_id: randomUUID(),
      item_id: 'demo',
      reviewer,
      kind: 'independent-code',
      subject: {kind: 'git', base: 'main', head: 'mutable-name'},
      criteria: ['Correctness'],
      verdict: 'approved',
      finding_refs: [],
      evidence_refs: ['review.json'],
      created_at: NOW,
    },
  }), error => error.code === 'INVALID_INPUT');
});

await test('initiative and item creation require explicit authority and preserve supplied scoped inputs', async () => {
  await withWorkspace(({store}) => {
    const initiativeBody = {
      schema_version: 1,
      id: 'initiative-new',
      title: 'New initiative',
      status: 'proposed',
      owner: steward.role,
      scope: {current: ['Use supplied research']},
      milestones: [],
      backlog: [],
      north_star_ref: '.kai/state/initiatives/initiative-new/northstar.md',
      updated_at: NOW,
    };
    const createInitiative = command('initiative.create', {
      actor: steward,
      recordKind: 'initiative',
      recordId: initiativeBody.id,
      expectedVersion: 0,
      payload: {body: initiativeBody},
    });
    assert.throws(() => applyCommand(store, createInitiative, {
      roles: [steward.role],
      grants: [],
    }), error => error.code === 'AUTHORITY_REQUIRED');
    const createdInitiative = applyCommand(
      store,
      createInitiative,
      grant(steward, 'initiative.create', 0, {
        recordKind: 'initiative',
        recordId: initiativeBody.id,
      }),
    );
    assert.equal(createdInitiative.recordVersion, 1);

    const itemBody = {
      ...seedItemBody(),
      id: 'supplied-input',
      initiative: initiativeBody.id,
      state: 'proposed',
      scope_authority: steward.role,
      completion_authority: reviewer.role,
      context_artifacts: ['docs/supplied-scope.md'],
    };
    const createItem = command('item.create', {
      actor: steward,
      recordId: itemBody.id,
      expectedVersion: 0,
      payload: {body: itemBody},
    });
    applyCommand(store, createItem, grant(steward, 'item.create', 0, {
      recordId: itemBody.id,
    }));
    assert.deepEqual(
      readRecord(store, 'item', itemBody.id).body.context_artifacts,
      ['docs/supplied-scope.md'],
    );
  });
});

function seedItemBody(overrides = {}) {
  return {
    schema_version: 1,
    id: 'demo',
    title: 'Demo item',
    initiative: 'demo-initiative',
    delivery_class: 'knowledge',
    state: 'completed',
    resume_state: null,
    scope_authority: steward.role,
    completion_authority: reviewer.role,
    producer_actor: builder,
    acceptance_actor: reviewer,
    priority: 1,
    next_role: null,
    outcome: 'Deliver the requested result.',
    acceptance: ['The result is evidenced.'],
    artifact_expectation: 'none',
    artifact_expectation_reason: 'No separate artifact is required.',
    artifact_class: null,
    durability: null,
    validity_owner: null,
    artifact_targets: [],
    context_artifacts: [],
    touches: ['src/demo/**'],
    depends_on: [],
    lease: null,
    recovery_hold: null,
    producing_actors: overrides.producer_actor === null ? [] : [overrides.producer_actor ?? builder],
    waiting_on_questions: [],
    required_for_milestone: true,
    review_requirements: [],
    change_ref: null,
    updated_at: NOW,
    ...overrides,
  };
}

await test('initiative updates lifecycle, milestones, and backlog only under its owner grant', async () => {
  await withWorkspace(({store}) => {
    seedInitiative(store, {status: 'proposed'});
    const update = command('initiative.update', {
      actor: steward,
      recordKind: 'initiative',
      recordId: 'demo-initiative',
      payload: {
        changes: {
          status: 'active',
          milestones: [{
            id: 'm1',
            title: 'Runtime complete',
            delivery_class: 'knowledge',
            required_items: [],
            status: 'active',
          }],
          backlog: [{
            id: 'b1',
            title: 'Later enhancement',
            status: 'parked',
            item_id: null,
            reason: 'Not in the thin core.',
          }],
          updated_at: NOW,
        },
      },
    });
    assert.throws(() => applyCommand(store, update, {
      roles: [steward.role],
      grants: [],
    }), error => error.code === 'AUTHORITY_REQUIRED');
    applyCommand(store, update, grant(steward, 'initiative.update', 1, {
      recordKind: 'initiative',
      recordId: 'demo-initiative',
    }));
    assert.equal(readRecord(store, 'initiative', 'demo-initiative').body.status, 'active');
  });
});

await test('item.update changes descriptive fields but cannot change lifecycle or scope approval', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'in-progress', lease: activeLease()});
    const result = applyCommand(store, itemCommand(
      'item.update',
      builder,
      1,
      {changes: {title: 'Revised', updated_at: NOW}},
      'lease-token',
    ), grant(builder, 'item.update', 1));
    assert.equal(result.data.record.body.title, 'Revised');
    assert.throws(() => validateCommand(itemCommand(
      'item.update',
      builder,
      2,
      {changes: {state: 'shipped'}},
      'lease-token',
    )), error => error.code === 'INVALID_INPUT');
    assert.throws(() => validateCommand(itemCommand(
      'item.update',
      builder,
      2,
      {changes: {scope_authority: builder.role}},
      'lease-token',
    )), error => error.code === 'INVALID_INPUT');
  });
});

await test('promotion requires the declared scope authority plus an explicit grant', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'proposed',
      producer_actor: null,
      acceptance_actor: null,
    });
    const promote = itemCommand('item.promote', steward, 1, {at: NOW});
    assert.throws(() => applyCommand(store, promote, {
      roles: [
        steward.role,
        reviewer.role,
        builder.role,
      ],
      grants: [],
    }), error => error.code === 'AUTHORITY_REQUIRED');
    assert.throws(() => applyCommand(store, {
      ...promote,
      operationId: randomUUID(),
      actor: builder,
    }, grant(builder, 'item.promote', 1)), error =>
      error.code === 'AUTHORITY_REQUIRED');
    const result = applyCommand(store, {
      ...promote,
      operationId: randomUUID(),
    }, grant(steward, 'item.promote', 1));
    assert.equal(result.data.record.body.state, 'ready');
  });
});

await test('granting rejects pending dependencies without calling them blocked', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'ready',
      producer_actor: null,
      acceptance_actor: null,
      depends_on: [{item: 'upstream', requires: 'completed'}],
    });
    seedRecord(store, {
      kind: 'item',
      id: 'upstream',
      itemId: 'upstream',
      version: 1,
      body: seedItemBody({
        id: 'upstream',
        state: 'in-progress',
        producer_actor: builder,
        acceptance_actor: null,
      }),
    });
    const reserve = itemCommand('item.grant', steward, 1, {
      holder: builder,
      actions: ['item.update', 'item.transition', 'item.handoff', 'question.open'],
      acquiredAt: NOW,
      expiresAt: LATER,
    });
    assert.throws(() => applyCommand(store, reserve, grant(steward, 'item.grant', 1)),
      error => error.code === 'EVIDENCE_GAP');
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'ready');
  });
});

await test('ready items cannot bypass reservation with a direct transition', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'ready',
      producer_actor: null,
      acceptance_actor: null,
    });
    assert.throws(() => applyCommand(store, itemCommand(
      'item.transition',
      builder,
      1,
      {to: 'in-progress', at: NOW, reason: 'Bypass the grant.'},
    ), transitionAuthority(builder, 1)), error =>
      error.code === 'INVALID_INPUT');
  });
});

await test('granting converts a failed dependency into a truthful blocked resume state', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'ready',
      producer_actor: null,
      acceptance_actor: null,
      depends_on: [{item: 'upstream', requires: 'completed'}],
    });
    seedRecord(store, {
      kind: 'item',
      id: 'upstream',
      itemId: 'upstream',
      version: 1,
      body: seedItemBody({id: 'upstream', state: 'dropped'}),
    });
    const result = applyCommand(store, itemCommand('item.grant', steward, 1, {
      holder: builder,
      actions: ['item.update'],
      acquiredAt: NOW,
      expiresAt: LATER,
    }), grant(steward, 'item.grant', 1));
    assert.equal(result.data.record.body.state, 'blocked');
    assert.equal(result.data.record.body.resume_state, 'ready');
    assert.equal(result.data.record.body.lease, null);
  });
});

await test('granting rejects same-role regrant, stale tokens, unavailable roles, and touch conflicts', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'in-progress', lease: activeLease()});
    assert.throws(() => applyCommand(store, itemCommand('item.grant', steward, 1, {
      holder: builder,
      actions: ['item.update'],
      acquiredAt: NOW,
      expiresAt: LATER,
    }), grant(steward, 'item.grant', 1)), error =>
      error.code === 'LEASE_CONFLICT');

    assert.throws(() => applyCommand(store, itemCommand(
      'item.update',
      builder,
      1,
      {changes: {title: 'Stale token'}},
      'old-token',
    ), grant(builder, 'item.update', 1)), error =>
      error.code === 'LEASE_CONFLICT');
  });

  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'ready',
      producer_actor: null,
      acceptance_actor: null,
      touches: ['src/demo/**'],
    });
    assert.throws(() => applyCommand(store, itemCommand('item.grant', steward, 1, {
      holder: {role: 'missing-role', runId: 'missing-run'},
      actions: ['item.update'],
      acquiredAt: NOW,
      expiresAt: LATER,
    }), grant(steward, 'item.grant', 1)), error =>
      error.code === 'ROLE_UNAVAILABLE');
  });

  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'ready',
      producer_actor: null,
      acceptance_actor: null,
      touches: ['src/demo/**'],
    });
    seedRecord(store, {
      kind: 'item',
      id: 'active-item',
      itemId: 'active-item',
      version: 1,
      body: seedItemBody({
        id: 'active-item',
        state: 'in-progress',
        touches: ['src/demo/file.mjs'],
        lease: activeLease(quality, 'other-token'),
      }),
    });
    assert.throws(() => applyCommand(store, itemCommand('item.grant', steward, 1, {
      holder: builder,
      actions: ['item.update'],
      acquiredAt: NOW,
      expiresAt: LATER,
    }), grant(steward, 'item.grant', 1)), error =>
      error.code === 'LEASE_CONFLICT');
  });
});

await test('review-state grants preserve state and issue persisted lease authority', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      delivery_class: 'product-change',
      state: 'in-review',
      change_ref: subject,
      producer_actor: builder,
      acceptance_actor: null,
      next_role: reviewer.role,
      review_requirements: [{role: reviewer.role, kind: 'independent-code'}],
    });
    const result = applyCommand(store, itemCommand('item.grant', steward, 1, {
      holder: reviewer,
      actions: ['item.handoff', 'item.transition'],
      acquiredAt: NOW,
      expiresAt: LATER,
    }), grant(steward, 'item.grant', 1));
    assert.equal(result.data.record.body.state, 'in-review');
    assert.deepEqual(result.data.record.body.change_ref, subject);
    assert.equal(result.data.record.body.lease.holder.role, reviewer.role);
    assert.notEqual(result.data.record.body.lease.token, null);
    const persistedGrant = store.database.prepare(`
      SELECT id FROM records WHERE kind = 'grant' AND item_id = 'demo'
    `).get();
    assert.equal(readRecord(store, 'grant', persistedGrant.id).body.lease_token,
      result.data.record.body.lease.token);
  });
});

await test('persisted lease grants authorize the holder without caller-invented grants', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'ready',
      producer_actor: null,
      acceptance_actor: null,
      next_role: builder.role,
    });
    const reserved = applyCommand(store, itemCommand('item.grant', steward, 1, {
      holder: builder,
      actions: ['item.update', 'item.transition', 'item.handoff', 'question.open'],
      acquiredAt: NOW,
      expiresAt: LATER,
    }), grant(steward, 'item.grant', 1));
    const token = reserved.data.record.body.lease.token;
    const updated = applyCommand(store, itemCommand(
      'item.update',
      builder,
      2,
      {changes: {title: 'Authorized by persisted grant', updated_at: NOW}},
      token,
    ), {
      roles: [
        steward.role,
        builder.role,
        reviewer.role,
        quality.role,
        shipper.role,
      ],
      grants: [],
    });
    assert.equal(updated.data.record.body.title, 'Authorized by persisted grant');
  });
});

await test('dependency cycles are rejected on create and update', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      id: 'a',
      depends_on: [{item: 'b', requires: 'completed'}],
    });
    seedRecord(store, {
      kind: 'item',
      id: 'b',
      itemId: 'b',
      version: 1,
      body: seedItemBody({id: 'b', depends_on: []}),
    });
    const update = command('item.update', {
      actor: steward,
      recordId: 'b',
      payload: {
        changes: {
          depends_on: [{item: 'a', requires: 'completed'}],
          updated_at: NOW,
        },
      },
    });
    assert.throws(() => applyCommand(store, update, grant(steward, 'item.update', 1, {
      recordId: 'b',
    })), error => error.code === 'INVALID_INPUT');
  });
});

await test('blocking questions update item, question, and message atomically', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'in-review', lease: activeLease(builder)});
    const messageId = randomUUID();
    const opened = applyCommand(store, itemCommand(
      'question.open',
      builder,
      1,
      {
        questionId: 'q1',
        messageId,
        parentId: null,
        recipient: reviewer.role,
        kind: 'question',
        createdAt: NOW,
        content: {
          questionKind: 'fact',
          blocking: true,
          context: 'A release fact is missing.',
          ask: 'Is the artifact valid?',
          answerBy: 'next-dispatch',
        },
        artifactRefs: [],
        evidenceRefs: [],
        provenance: 'durable-thread',
      },
      'lease-token',
    ), grant(builder, 'question.open', 1));
    assert.equal(opened.data.record.body.state, 'blocked');
    assert.equal(opened.data.record.body.resume_state, 'in-review');
    assert.deepEqual(opened.data.record.body.waiting_on_questions, ['q1']);
    assert.equal(readRecord(store, 'question', 'q1').body.status, 'open');
    assert.equal(readRecord(store, 'message', messageId).body.basis_version, 1);
  });
});

await test('valid peer answers clear only their question and require authorized restoration', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'blocked',
      resume_state: 'in-review',
      waiting_on_questions: ['q1', 'q2'],
      lease: null,
      change_ref: subject,
    });
    const q1Message = seedQuestion(store, 'q1', reviewer.role);
    const q2Message = seedQuestion(store, 'q2', quality.role);
    answerQuestion(store, {
      questionId: 'q1',
      parentId: q1Message,
      sender: reviewer,
      recipient: builder.role,
      expectedVersion: 1,
      answer: 'The artifact is valid.',
    });
    assert.deepEqual(readRecord(store, 'item', 'demo').body.waiting_on_questions, ['q2']);
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'blocked');
    assert.throws(() => applyCommand(store, itemCommand(
      'item.restore',
      shipper,
      2,
      {at: NOW},
    ), grant(shipper, 'item.restore', 2)), error =>
      error.code === 'EVIDENCE_GAP');
    answerQuestion(store, {
      questionId: 'q2',
      parentId: q2Message,
      sender: quality,
      recipient: builder.role,
      expectedVersion: 2,
      answer: 'The checks are green.',
    });
    assert.deepEqual(readRecord(store, 'item', 'demo').body.waiting_on_questions, []);
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'blocked');

    const denied = itemCommand('item.restore', reviewer, 3, {at: NOW});
    assert.throws(() => applyCommand(store, denied, {
      roles: [reviewer.role],
      grants: [],
    }), error => error.code === 'AUTHORITY_REQUIRED');
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'blocked');

    const restored = applyCommand(store, {
      ...denied,
      operationId: randomUUID(),
      actor: shipper,
    }, grant(shipper, 'item.restore', 3));
    assert.equal(restored.data.record.body.state, 'in-review');
    assert.equal(restored.data.record.body.resume_state, null);
  });
});

function seedQuestion(store, id, recipient) {
  const messageId = randomUUID();
  seedRecord(store, {
    kind: 'message',
    id: messageId,
    itemId: 'demo',
    version: 1,
    body: {
      schema_version: 1,
      message_id: messageId,
      thread_id: 'demo',
      item_id: 'demo',
      parent_id: null,
      sender_role: builder.role,
      sender_run: builder.runId,
      recipient,
      kind: 'question',
      created_at: NOW,
      basis_version: 1,
      payload: {
        questionKind: 'fact',
        blocking: true,
        context: 'Context',
        ask: 'Question?',
        answerBy: 'next-dispatch',
      },
      artifact_refs: [],
      evidence_refs: [],
      provenance: 'durable-thread',
    },
  });
  seedRecord(store, {
    kind: 'question',
    id,
    itemId: 'demo',
    version: 1,
    body: {
      schema_version: 1,
      question_id: id,
      item_id: 'demo',
      asker: builder,
      recipient,
      kind: 'fact',
      blocking: true,
      status: 'open',
      context: 'Context',
      ask: 'Question?',
      answer_by: 'next-dispatch',
      opened_message_id: messageId,
      answer_message_ids: [],
      resolution: null,
    },
  });
  return messageId;
}

function answerQuestion(store, {
  questionId,
  parentId,
  sender,
  recipient,
  expectedVersion,
  answer,
  lane = 'in-lane',
  actorAuthority = {roles: [sender.role], grants: []},
  resolves,
}) {
  return applyCommand(store, itemCommand(
    'question.answer',
    sender,
    expectedVersion,
    {
      questionId,
      messageId: randomUUID(),
      parentId,
      recipient,
      kind: 'answer',
      createdAt: NOW,
      content: {status: 'answered', answer, lane, ...(resolves ? {resolves} : {})},
      artifactRefs: [],
      evidenceRefs: [],
      provenance: 'durable-thread',
    },
  ), actorAuthority);
}

await test('out-of-lane and contradictory answers do not clear blockers', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'blocked',
      resume_state: 'in-progress',
      waiting_on_questions: ['q1'],
      lease: null,
    });
    const parentId = seedQuestion(store, 'q1', reviewer.role);
    answerQuestion(store, {
      questionId: 'q1',
      parentId,
      sender: reviewer,
      recipient: builder.role,
      expectedVersion: 1,
      answer: 'Ask another team.',
      lane: 'out-of-lane',
    });
    assert.deepEqual(readRecord(store, 'item', 'demo').body.waiting_on_questions, ['q1']);
    answerQuestion(store, {
      questionId: 'q1',
      parentId,
      sender: reviewer,
      recipient: builder.role,
      expectedVersion: 2,
      answer: 'First answer.',
    });
    assert.deepEqual(readRecord(store, 'item', 'demo').body.waiting_on_questions, []);
    answerQuestion(store, {
      questionId: 'q1',
      parentId,
      sender: reviewer,
      recipient: builder.role,
      expectedVersion: 3,
      answer: 'Contradictory answer.',
    });
    assert.deepEqual(readRecord(store, 'item', 'demo').body.waiting_on_questions, ['q1']);
    assert.equal(readRecord(store, 'question', 'q1').body.status, 'open');
  });
});

await test('answers enforce addressed sender, recipient, parent, and operator reservation', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'blocked',
      resume_state: 'in-progress',
      waiting_on_questions: ['q1'],
      lease: null,
    });
    const parentId = seedQuestion(store, 'q1', reviewer.role);
    assert.throws(() => answerQuestion(store, {
      questionId: 'q1',
      parentId,
      sender: quality,
      recipient: builder.role,
      expectedVersion: 1,
      answer: 'Not addressed to me.',
    }), error => error.code === 'AUTHORITY_REQUIRED');
    assert.throws(() => answerQuestion(store, {
      questionId: 'q1',
      parentId: randomUUID(),
      sender: reviewer,
      recipient: builder.role,
      expectedVersion: 1,
      answer: 'Wrong parent.',
    }), error => error.code === 'INVALID_INPUT');
    assert.throws(() => applyCommand(store, itemCommand('item.grant', steward, 1, {
      holder: operator,
      actions: ['question.answer'],
      acquiredAt: NOW,
      expiresAt: LATER,
    }), {
      roles: [steward.role, 'operator'],
      grants: grant(steward, 'item.grant', 1).grants,
    }), error => error.code === 'INVALID_INPUT');
  });
});

await test('operator answers use an explicit host grant without becoming an installed role', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'blocked',
      resume_state: 'in-progress',
      waiting_on_questions: ['q1'],
      lease: null,
    });
    const parentId = seedQuestion(store, 'q1', 'operator');
    const answered = answerQuestion(store, {
      questionId: 'q1',
      parentId,
      sender: operator,
      recipient: builder.role,
      expectedVersion: 1,
      answer: 'Proceed with the bounded scope.',
      actorAuthority: {
        roles: [builder.role],
        grants: [{
          actor: operator,
          actions: ['question.answer'],
          recordKind: 'item',
          recordId: 'demo',
          basisRef: 'item/demo@1',
        }],
      },
    });
    assert.deepEqual(answered.data.record.body.waiting_on_questions, []);
  });
});

await test('operator is not used as the recipient for role-owned fact questions', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'in-progress', lease: activeLease()});
    assert.throws(() => applyCommand(store, itemCommand(
      'question.open',
      builder,
      1,
      {
        questionId: 'q1',
        messageId: randomUUID(),
        parentId: null,
        recipient: 'operator',
        kind: 'question',
        createdAt: NOW,
        content: {
          questionKind: 'fact',
          blocking: true,
          context: 'A technical fact is missing.',
          ask: 'What does the implementation do?',
          answerBy: 'next-dispatch',
        },
        artifactRefs: [],
        evidenceRefs: [],
        provenance: 'durable-thread',
      },
      'lease-token',
    ), grant(builder, 'question.open', 1)), error =>
      error.code === 'AUTHORITY_REQUIRED');
  });
});

await test('duplicate message command returns its original receipt', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'in-progress', lease: activeLease()});
    const open = itemCommand('question.open', builder, 1, {
      questionId: 'q1',
      messageId: randomUUID(),
      parentId: null,
      recipient: reviewer.role,
      kind: 'question',
      createdAt: NOW,
      content: {
        questionKind: 'fact',
        blocking: false,
        context: 'Context',
        ask: 'Question?',
        answerBy: 'next-dispatch',
      },
      artifactRefs: [],
      evidenceRefs: [],
      provenance: 'durable-thread',
    }, 'lease-token');
    const first = applyCommand(store, open, grant(builder, 'question.open', 1));
    assert.deepEqual(applyCommand(store, open, grant(builder, 'question.open', 1)), first);
    const duplicateDelivery = {
      ...open,
      operationId: randomUUID(),
      expectedVersion: 2,
    };
    assert.deepEqual(
      applyCommand(store, duplicateDelivery, grant(builder, 'question.open', 2)),
      first,
    );
  });
});

await test('handoff applies lifecycle guards, writes a message, and clears the lease', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress',
      lease: activeLease(),
      producer_actor: builder,
      review_requirements: [{role: reviewer.role, kind: 'independent-code'}],
    });
    const messageId = randomUUID();
    const result = applyCommand(store, itemCommand(
      'item.handoff',
      builder,
      1,
      {
        toRole: reviewer.role,
        state: 'in-review',
        subject,
        createdAt: NOW,
        messageId,
        parentId: null,
        content: {
          did: 'Implemented the change.',
          needs: 'Independent review.',
          assetState: 'none — product change',
          authority: 'pending',
          revalidation: 'not applicable',
          questions: [],
        },
        artifactRefs: [],
        evidenceRefs: ['test/results.txt'],
        provenance: 'durable-thread',
      },
      'lease-token',
    ), grant(builder, ['item.handoff', 'item.transition'], 1));
    assert.equal(result.data.record.body.state, 'in-review');
    assert.deepEqual(result.data.record.body.change_ref, subject);
    assert.equal(result.data.record.body.lease, null);
    assert.equal(readRecord(store, 'message', messageId).body.kind, 'handoff');
  });
});

await test('knowledge completion consumes persisted reviews and completion approval', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-review',
      lease: activeLease(reviewer, 'review-token'),
      change_ref: subject,
      producer_actor: builder,
      acceptance_actor: null,
      review_requirements: [{role: reviewer.role, kind: 'independent-code'}],
    });
    seedReview(store);
    seedApproval(store);
    const result = applyCommand(store, itemCommand(
      'item.transition',
      reviewer,
      1,
      {to: 'completed', at: NOW, reason: 'Accepted exact revision.'},
      'review-token',
    ), transitionAuthority(reviewer, 1));
    assert.equal(result.data.record.body.state, 'completed');
    assert.deepEqual(result.data.record.body.acceptance_actor, reviewer);
  });
});

await test('a producer cannot self-accept and mutable names cannot satisfy subject binding', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-review',
      lease: activeLease(builder),
      change_ref: subject,
      producer_actor: builder,
      acceptance_actor: null,
      completion_authority: builder.role,
      review_requirements: [],
    });
    seedApproval(store, {actor: builder});
    assert.throws(() => applyCommand(store, itemCommand(
      'item.transition',
      builder,
      1,
      {to: 'completed', at: NOW, reason: 'Self accepted.'},
      'lease-token',
    ), transitionAuthority(builder, 1)), error =>
      error.code === 'AUTHORITY_REQUIRED');
  });
});

await test('reviews and approvals for another immutable subject cannot satisfy completion', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-review',
      lease: activeLease(reviewer, 'review-token'),
      change_ref: subject,
      producer_actor: builder,
      acceptance_actor: null,
      review_requirements: [{role: reviewer.role, kind: 'independent-code'}],
    });
    const otherSubject = {
      kind: 'sha256',
      path: `${runDirectory}/other.txt`,
      digest: createHash('sha256').update('Other immutable revision.').digest('hex'),
    };
    seedReview(store, {reviewSubject: otherSubject});
    seedApproval(store, {approvalSubject: otherSubject});
    assert.throws(() => applyCommand(store, itemCommand(
      'item.transition',
      reviewer,
      1,
      {to: 'completed', at: NOW, reason: 'Wrong revision.'},
      'review-token',
    ), transitionAuthority(reviewer, 1)), error =>
      error.code === 'EVIDENCE_GAP');
  });
});

await test('release readiness requires all persisted reviews, acceptance, and six evidenced dimensions', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      delivery_class: 'product-change',
      state: 'in-review',
      lease: activeLease(shipper, 'ship-token'),
      change_ref: subject,
      producer_actor: builder,
      acceptance_actor: null,
      completion_authority: reviewer.role,
      review_requirements: [
        {role: reviewer.role, kind: 'independent-code'},
        {role: quality.role, kind: 'ui-system'},
      ],
    });
    seedReview(store);
    seedApproval(store);
    seedReleaseEvidence(store);
    assert.throws(() => applyCommand(store, itemCommand(
      'item.transition',
      shipper,
      1,
      {to: 'release-ready', at: NOW, reason: 'All gates claimed in payload.'},
      'ship-token',
    ), transitionAuthority(shipper, 1)), error =>
      error.code === 'EVIDENCE_GAP');
    seedReview(store, {actor: quality, kind: 'ui-system'});
    const result = applyCommand(store, itemCommand(
      'item.transition',
      shipper,
      1,
      {to: 'release-ready', at: NOW, reason: 'Persisted gates are complete.'},
      'ship-token',
    ), transitionAuthority(shipper, 1));
    assert.equal(result.data.record.body.state, 'release-ready');
  });
});

await test('deployment start, completion, and shipped use separate persisted operator/evidence gates', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      delivery_class: 'product-change',
      state: 'release-ready',
      lease: activeLease(shipper, 'ship-token'),
      change_ref: subject,
      producer_actor: builder,
      acceptance_actor: reviewer,
    });
    const start = itemCommand(
      'item.transition',
      shipper,
      1,
      {to: 'deploying', at: NOW, reason: 'Operator started deployment.'},
      'ship-token',
    );
    assert.throws(() => applyCommand(store, start, transitionAuthority(shipper, 1)),
      error => error.code === 'AUTHORITY_REQUIRED');
    seedApproval(store, {actor: operator, kind: 'operator-deploy-start'});
    const deploying = applyCommand(store, {
      ...start,
      operationId: randomUUID(),
    }, transitionAuthority(shipper, 1));
    assert.equal(deploying.data.record.body.state, 'deploying');

    const completionLease = activeLease(shipper, 'complete-token', {version_at_grant: 2});
    store.database.prepare(`
      UPDATE records SET body = ? WHERE kind = 'item' AND id = 'demo'
    `).run(JSON.stringify({...deploying.data.record.body, lease: completionLease}));
    const complete = itemCommand(
      'item.transition',
      shipper,
      2,
      {to: 'production-verification', at: NOW, reason: 'Deployment completed.'},
      'complete-token',
    );
    assert.throws(() => applyCommand(store, complete, transitionAuthority(shipper, 2)),
      error => error.code === 'AUTHORITY_REQUIRED');
    seedApproval(store, {actor: operator, kind: 'operator-deploy-complete'});
    assert.throws(() => applyCommand(store, {
      ...complete,
      operationId: randomUUID(),
    }, transitionAuthority(shipper, 2)), error => error.code === 'EVIDENCE_GAP');
    seedEvidence(store, {kind: 'deployment'});
    const verifying = applyCommand(store, {
      ...complete,
      operationId: randomUUID(),
    }, transitionAuthority(shipper, 2));
    assert.equal(verifying.data.record.body.state, 'production-verification');

    const verifyLease = activeLease(shipper, 'verify-token', {version_at_grant: 3});
    store.database.prepare(`
      UPDATE records SET body = ? WHERE kind = 'item' AND id = 'demo'
    `).run(JSON.stringify({...verifying.data.record.body, lease: verifyLease}));
    const finish = itemCommand(
      'item.transition',
      shipper,
      3,
      {to: 'shipped', at: NOW, reason: 'Production checks passed.'},
      'verify-token',
    );
    assert.throws(() => applyCommand(store, finish, transitionAuthority(shipper, 3)),
      error => error.code === 'EVIDENCE_GAP');
    seedEvidence(store, {kind: 'production-verification'});
    const shipped = applyCommand(store, {
      ...finish,
      operationId: randomUUID(),
    }, transitionAuthority(shipper, 3));
    assert.equal(shipped.data.record.body.state, 'shipped');
  });
});

await test('recovery requires expiry plus reconciled evidence and invalidates the stale token', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress',
      lease: activeLease(builder, 'stale-token', {
        expires_at: EXPIRED,
      }),
    });
    const recover = itemCommand('attempt.recover', steward, 1, {
      attemptId: randomUUID(),
      observed: 'No partial product changes.',
      disposition: 'safe-to-resume',
      recoveryEvidenceIds: [],
      redispatch: reviewer,
      createdAt: NOW,
      expiresAt: LATER,
    });
    assert.throws(() => applyCommand(store, recover,
      grant(steward, 'attempt.recover', 1)), error =>
      error.code === 'EVIDENCE_GAP');
    const evidence = seedEvidence(store, {
      kind: 'recovery-reconciliation',
      evidenceSubject: null,
      data: {
        stale_lease_token: readRecord(store, 'item', 'demo').body.lease.token,
        disposition: 'safe-to-resume',
        observed: 'No partial product changes.',
      },
    });
    const recovered = applyCommand(store, {
      ...recover,
      operationId: randomUUID(),
      payload: {
        ...recover.payload,
        recoveryEvidenceIds: [evidence.id],
      },
    }, grant(steward, 'attempt.recover', 1));
    assert.equal(recovered.data.record.body.lease.holder.role, reviewer.role);
    assert.notEqual(recovered.data.record.body.lease.token, 'stale-token');
    assert.equal(readRecord(store, 'attempt', recover.payload.attemptId).body.disposition,
      'safe-to-resume');
  });
});

await test('conflicting recovery blocks and routes to operator without a new lease', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress',
      lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    const evidence = seedEvidence(store, {
      kind: 'recovery-reconciliation',
      evidenceSubject: null,
      data: {
        stale_lease_token: 'stale-token',
        disposition: 'conflicting-partial-work',
        observed: 'Overlapping uncommitted changes exist.',
      },
    });
    const result = applyCommand(store, itemCommand('attempt.recover', steward, 1, {
      attemptId: randomUUID(),
      observed: 'Overlapping uncommitted changes exist.',
      disposition: 'conflicting-partial-work',
      recoveryEvidenceIds: [evidence.id],
      redispatch: null,
      createdAt: NOW,
      expiresAt: null,
    }), grant(steward, 'attempt.recover', 1));
    assert.equal(result.data.record.body.state, 'blocked');
    assert.equal(result.data.record.body.resume_state, 'in-progress');
    assert.equal(result.data.record.body.lease, null);
    assert.equal(result.data.record.body.next_role, 'operator');
  });
});

await test('the required two-blocker restore case refuses role-name-only authority', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'blocked',
      resume_state: 'in-review',
      waiting_on_questions: ['q1', 'q2'],
    });
    const auth = {roles: ['eng-reviewer-code'], grants: []};
    const denied = command('item.restore', {
      actor: reviewer,
      payload: {at: NOW},
    });
    assert.throws(() => applyCommand(store, denied, auth),
      error => error.code === 'AUTHORITY_REQUIRED');
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'blocked');
  });
});

assert.ok(RuntimeError);

function reviewItem(store, overrides = {}) {
  return seedItem(store, {
    state: 'in-review',
    change_ref: subject,
    producer_actor: builder,
    acceptance_actor: null,
    next_role: reviewer.role,
    review_requirements: [{role: reviewer.role, kind: 'independent-code'}],
    ...overrides,
  });
}

function completeKnowledge(store, version = 1) {
  return applyCommand(store, itemCommand('item.transition', reviewer, version, {
    to: 'completed', at: NOW, reason: 'Accept the current criteria and subject.',
  }), grant(reviewer, 'item.transition', version));
}

function reserve(store, holder = builder, version = 1) {
  return applyCommand(store, itemCommand('item.grant', steward, version, {
    holder, actions: ['item.update', 'item.transition', 'item.handoff', 'question.open'],
    acquiredAt: NOW, expiresAt: LATER,
  }), grant(steward, 'item.grant', version));
}

function recoverExpired(store, overrides = {}, version = 1, actions = ['attempt.recover']) {
  const payload = {
    attemptId: randomUUID(),
    observed: 'Partial work inspected.',
    disposition: 'safe-to-resume',
    redispatch: {...builder, runId: 'replacement-run'},
    createdAt: NOW,
    expiresAt: LATER,
    ...overrides,
  };
  const evidence = seedEvidence(store, {
    kind: 'recovery-reconciliation', evidenceSubject: null,
    data: {
      stale_lease_token: readRecord(store, 'item', 'demo').body.lease.token,
      disposition: payload.disposition,
      observed: payload.observed,
    },
  });
  return applyCommand(store, itemCommand('attempt.recover', steward, version, {
    ...payload, recoveryEvidenceIds: [evidence.id],
  }), grant(steward, actions, version));
}

await test('round1 F1 reviews and approval cannot accept changed current criteria', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    seedReview(store);
    seedApproval(store);
    applyCommand(store, itemCommand('item.update', reviewer, 1, {
      changes: {acceptance: ['New unreviewed acceptance criterion.']},
    }), grant(reviewer, 'item.update', 1));
    assert.throws(() => completeKnowledge(store, 2), error => error.code === 'EVIDENCE_GAP');
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'in-review');
  });
});

await test('round1 F2 a negative review is not erased by approval filtering or caller time', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    seedReview(store, {createdAt: LATER});
    seedReview(store, {verdict: 'changes-requested', createdAt: EXPIRED});
    seedApproval(store);
    assert.throws(() => completeKnowledge(store), error => error.code === 'EVIDENCE_GAP');
  });
});

await test('round1 F3 staging verification cannot establish shipment', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store, {delivery_class: 'product-change', state: 'production-verification'});
    seedApproval(store, {actor: operator, kind: 'operator-deploy-start'});
    seedApproval(store, {actor: operator, kind: 'operator-deploy-complete'});
    seedEvidence(store, {kind: 'deployment'});
    seedEvidence(store, {
      kind: 'production-verification',
      data: {environment: 'staging', deployment_id: 'deploy-123', checks: ['smoke']},
    });
    assert.throws(() => applyCommand(store, itemCommand('item.transition', shipper, 1, {
      to: 'shipped', at: NOW, reason: 'Staging is not production.',
    }), grant(shipper, 'item.transition', 1)), error => error.code === 'EVIDENCE_GAP');
  });
});

await test('round1 F4 live touch-set update cannot collide with another holder', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'in-progress', touches: ['src/a.mjs'], lease: activeLease()});
    seedItem(store, {
      id: 'other', state: 'in-progress', touches: ['src/b.mjs'],
      lease: activeLease(quality, 'other-token'),
    });
    assert.throws(() => applyCommand(store, itemCommand('item.update', builder, 1, {
      changes: {touches: ['src/b.mjs']},
    }, 'lease-token'), grant(builder, 'item.update', 1)),
    error => error.code === 'LEASE_CONFLICT');
    assert.deepEqual(readRecord(store, 'item', 'demo').body.touches, ['src/a.mjs']);
  });
});

await test('round1 F4 uncertain intersecting globs serialize', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'ready', touches: ['src/f*'], next_role: builder.role});
    seedItem(store, {
      id: 'other', state: 'in-progress', touches: ['src/foo*'],
      lease: activeLease(quality, 'other-token'),
    });
    assert.throws(() => reserve(store), error => error.code === 'LEASE_CONFLICT');
  });
});

await test('round1 F5 trusted host grant cannot bypass lease expiry', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress', lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    assert.throws(() => applyCommand(store, itemCommand('item.update', builder, 1, {
      changes: {title: 'Expired mutation'},
    }, 'stale-token'), grant(builder, 'item.update', 1)),
    error => error.code === 'RECOVERY_REQUIRED');
  });
});

await test('round1 F6 restored in-progress work is reservable by a replacement run', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'blocked', resume_state: 'in-progress', next_role: builder.role,
      producer_actor: builder, acceptance_actor: null,
    });
    applyCommand(store, itemCommand('item.restore', steward, 1, {at: NOW}),
      grant(steward, 'item.restore', 1));
    const result = reserve(store, {...builder, runId: 'replacement-run'}, 2);
    assert.equal(result.data.record.body.state, 'in-progress');
    assert.equal(result.data.record.body.lease.holder.runId, 'replacement-run');
  });
});

await test('round1 F6 review rework routes back to a reservable producing role', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    applyCommand(store, itemCommand('item.transition', reviewer, 1, {
      to: 'in-progress', at: NOW, reason: 'Rework is needed.',
    }), grant(reviewer, 'item.transition', 1));
    const result = reserve(store, {...builder, runId: 'replacement-run'}, 2);
    assert.equal(result.data.record.body.lease.holder.runId, 'replacement-run');
  });
});

await test('round1 F7 recovered builder can submit without erasing prior producing actors', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress', producer_actor: builder, acceptance_actor: null,
      lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    const recovered = recoverExpired(store).data.record;
    const replacement = recovered.body.lease.holder;
    const submitted = applyCommand(store, itemCommand('item.transition', replacement, 2, {
      to: 'in-review', at: NOW, reason: 'Reconciled work is ready.', subject,
    }, recovered.body.lease.token), {roles: grant(steward, 'item.grant', 1).roles, grants: []});
    assert.equal(submitted.data.record.body.state, 'in-review');
    assert.deepEqual(submitted.data.record.body.producing_actors, [builder, replacement]);
  });
});

await test('round1 F8 recovery cannot redispatch after a failed dependency', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {id: 'upstream', state: 'dropped'});
    seedItem(store, {
      state: 'in-progress', depends_on: [{item: 'upstream', requires: 'completed'}],
      lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    assert.throws(() => recoverExpired(store), error => error.code === 'RECOVERY_REQUIRED');
    assert.equal(readRecord(store, 'item', 'demo').body.lease.token, 'stale-token');
  });
});

await test('round1 F8 recovery cannot redispatch with unanswered blockers', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress', waiting_on_questions: ['q1'],
      lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    seedQuestion(store, 'q1', reviewer.role);
    assert.throws(() => recoverExpired(store), error => error.code === 'EVIDENCE_GAP');
  });
});

await test('round1 F9 conflicting partial work requires persisted operator resolution', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress',
      lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    recoverExpired(store, {
      disposition: 'conflicting-partial-work', redispatch: null, expiresAt: null,
    });
    assert.throws(() => applyCommand(store, itemCommand('item.restore', steward, 2, {at: NOW}),
      grant(steward, 'item.restore', 2)), error => error.code === 'AUTHORITY_REQUIRED');
  });
});

await test('round1 F10 late contradictory answer cannot reopen terminal work', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'completed'});
    const parentId = seedQuestion(store, 'q1', reviewer.role);
    const answer = version => ({
      questionId: 'q1', parentId, sender: reviewer, recipient: builder.role,
      expectedVersion: version, answer: version === 1 ? 'Yes.' : 'No.',
    });
    answerQuestion(store, answer(1));
    answerQuestion(store, answer(2));
    const item = readRecord(store, 'item', 'demo').body;
    assert.equal(item.state, 'completed');
    assert.equal(item.resume_state, null);
    assert.deepEqual(item.waiting_on_questions, []);
    assert.equal(readRecord(store, 'question', 'q1').body.answer_message_ids.length, 2);
  });
});

await test('round1 F10 late contradiction releases the live review reservation safely', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    const parentId = seedQuestion(store, 'q1', quality.role);
    answerQuestion(store, {
      questionId: 'q1', parentId, sender: quality, recipient: builder.role,
      expectedVersion: 1, answer: 'Yes.',
    });
    const reserved = reserve(store, reviewer, 2).data.record;
    answerQuestion(store, {
      questionId: 'q1', parentId, sender: quality, recipient: builder.role,
      expectedVersion: 3, answer: 'No.',
    });
    const blocked = readRecord(store, 'item', 'demo').body;
    assert.equal(blocked.state, 'blocked');
    assert.equal(blocked.resume_state, 'in-review');
    assert.equal(blocked.lease, null);
    const grants = store.database.prepare("SELECT id FROM records WHERE kind = 'grant'").all();
    assert.ok(grants.every(({id}) => readRecord(store, 'grant', id).body.status === 'revoked'));
    assert.throws(() => applyCommand(store, itemCommand('item.update', reviewer, 4, {
      changes: {title: 'Stale holder'},
    }, reserved.body.lease.token), {roles: grant(steward, 'item.grant', 1).roles, grants: []}),
    error => error.code === 'AUTHORITY_REQUIRED');
  });
});

await test('round1 F11 scope authority can drop blocked work with failed dependencies', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {id: 'upstream', state: 'dropped'});
    seedItem(store, {
      state: 'blocked', resume_state: 'ready',
      depends_on: [{item: 'upstream', requires: 'completed'}],
    });
    const drop = actor => itemCommand('item.transition', actor, 1, {
      to: 'dropped', at: NOW, reason: 'The prerequisite was abandoned.',
    });
    assert.throws(() => applyCommand(store, drop(reviewer), grant(reviewer, 'item.transition', 1)),
      error => error.code === 'AUTHORITY_REQUIRED');
    assert.equal(applyCommand(store, drop(steward), grant(steward, 'item.transition', 1))
      .data.record.body.state, 'dropped');
  });
});

await test('round1 F12 initiative creation cannot bypass closure guards', async () => {
  await withWorkspace(({store}) => {
    const body = seedInitiative(store).body;
    const create = command('initiative.create', {
      actor: steward, recordKind: 'initiative', recordId: 'closed', expectedVersion: 0,
      payload: {body: {...body, id: 'closed', status: 'shipped'}},
    });
    assert.throws(() => applyCommand(store, create, grant(steward, 'initiative.create', 0, {
      recordKind: 'initiative', recordId: 'closed',
    })), error => error.code === 'INVALID_INPUT');
    assert.equal(readRecord(store, 'initiative', 'closed'), null);
  });
});

await test('round1 F1 refreshed review cannot reuse stale completion approval', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    seedReview(store);
    seedApproval(store);
    applyCommand(store, itemCommand('item.update', reviewer, 1, {
      changes: {acceptance: ['Replacement criterion.']},
    }), grant(reviewer, 'item.update', 1));
    seedReview(store, {criteria: ['Replacement criterion.']});
    assert.throws(() => completeKnowledge(store, 2), error => error.code === 'EVIDENCE_GAP');
    seedApproval(store);
    assert.equal(completeKnowledge(store, 2).data.record.body.state, 'completed');
  });
});

await test('round1 F2 explicit supersession resolves a negative without deleting its evidence', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    const rejected = seedReview(store, {verdict: 'changes-requested', createdAt: LATER});
    seedReview(store, {createdAt: NOW});
    seedApproval(store);
    assert.throws(() => completeKnowledge(store), error => error.code === 'EVIDENCE_GAP');
    seedReview(store, {createdAt: EXPIRED, supersedes: [rejected.id]});
    assert.equal(completeKnowledge(store).data.record.body.state, 'completed');
    assert.equal(readRecord(store, 'review', rejected.id).body.verdict, 'changes-requested');
  });
});

await test('round1 F2 a rejected completion decision must be explicitly superseded', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    seedReview(store);
    seedApproval(store);
    const rejected = seedApproval(store, {decision: 'rejected'});
    assert.throws(() => completeKnowledge(store), error => error.code === 'EVIDENCE_GAP');
    seedApproval(store, {supersedes: [rejected.id]});
    assert.equal(completeKnowledge(store).data.record.body.state, 'completed');
  });
});

await test('round1 F2 a producing run cannot supersede an independent negative review', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    const rejected = seedReview(store, {verdict: 'blocked'});
    seedReview(store);
    seedReview(store, {
      actor: {...reviewer, runId: builder.runId}, supersedes: [rejected.id],
    });
    seedApproval(store);
    assert.throws(() => completeKnowledge(store), error => error.code === 'AUTHORITY_REQUIRED');
  });
});

await test('round1 F3 verification must match the operator-confirmed deployment identity', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store, {delivery_class: 'product-change', state: 'production-verification'});
    const deployment = {
      environment: 'prod-eu-west', environment_class: 'production', deployment_id: 'release-42',
    };
    seedApproval(store, {actor: operator, kind: 'operator-deploy-start', deployment});
    seedApproval(store, {actor: operator, kind: 'operator-deploy-complete', deployment});
    seedEvidence(store, {
      kind: 'deployment', data: {environment: 'prod-eu-west', deployment_id: 'release-42'},
    });
    seedEvidence(store, {
      kind: 'production-verification',
      data: {environment: 'prod-eu-west', deployment_id: 'older-release', checks: ['health']},
    });
    const finish = () => applyCommand(store, itemCommand('item.transition', shipper, 1, {
      to: 'shipped', at: NOW, reason: 'Verify the confirmed production deployment.',
    }), grant(shipper, 'item.transition', 1));
    assert.throws(finish, error => error.code === 'EVIDENCE_GAP');
    seedEvidence(store, {
      kind: 'production-verification',
      data: {environment: 'prod-eu-west', deployment_id: 'release-42', checks: ['health']},
    });
    assert.equal(finish().data.record.body.state, 'shipped');
  });
});

await test('round1 F7 every earlier producing run remains ineligible for independent review', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store, {
      producer_actor: {...builder, runId: 'third-builder'},
      producing_actors: [builder, {...builder, runId: 'second-builder'}, {...builder, runId: 'third-builder'}],
    });
    seedReview(store, {actor: {...reviewer, runId: builder.runId}});
    seedApproval(store);
    assert.throws(() => completeKnowledge(store), error => error.code === 'AUTHORITY_REQUIRED');
  });
});

await test('round1 F7 every earlier producing run remains ineligible for completion approval', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store, {
      producer_actor: {...builder, runId: 'third-builder'},
      producing_actors: [builder, {...builder, runId: 'second-builder'}, {...builder, runId: 'third-builder'}],
    });
    seedReview(store);
    seedApproval(store, {actor: {...reviewer, runId: 'second-builder'}});
    assert.throws(() => completeKnowledge(store), error => error.code === 'AUTHORITY_REQUIRED');
  });
});

await test('round1 F9 operator resolution binds the attempt and permits separately granted resumption', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress', producer_actor: builder, acceptance_actor: null,
      lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    const recovered = recoverExpired(store, {
      disposition: 'conflicting-partial-work', redispatch: null, expiresAt: null,
    }).data.record;
    const redispatch = {...builder, runId: 'resolved-builder'};
    const recovery = {
      attempt_id: recovered.body.recovery_hold, stale_lease_token: 'stale-token',
      disposition: 'safe-to-resume', resume_role: redispatch.role,
    };
    const resolution = seedApproval(store, {
      actor: operator, kind: 'operator-recovery-resolution', approvalSubject: null, recovery,
    });
    const result = applyCommand(store, itemCommand('item.restore', steward, 2, {
      at: NOW, recoveryApprovalId: resolution.id,
    }), grant(steward, 'item.restore', 2));
    assert.equal(result.data.record.body.state, 'in-progress');
    assert.equal(result.data.record.body.recovery_hold, null);
    assert.equal(result.data.record.body.lease, null);
    const reserved = reserve(store, redispatch, 3).data.record;
    assert.deepEqual(reserved.body.producing_actors, [builder, redispatch]);
    assert.equal(readRecord(store, 'attempt', recovery.attempt_id).body.disposition,
      'conflicting-partial-work');
  });
});

await test('round1 F1 accepted states cannot silently acquire unaccepted replacement criteria', async () => {
  for (const state of ['completed', 'release-ready', 'deploying', 'production-verification', 'shipped']) {
    await withWorkspace(({store}) => {
      reviewItem(store, {state, delivery_class: state === 'completed' ? 'knowledge' : 'product-change'});
      assert.throws(() => applyCommand(store, itemCommand('item.update', steward, 1, {
        changes: {acceptance: ['Unaccepted replacement criterion.']},
      }), grant(steward, 'item.update', 1)), error => error.code === 'INVALID_INPUT');
      const title = applyCommand(store, itemCommand('item.update', steward, 1, {
        changes: {title: 'An accurate descriptive title'},
      }), grant(steward, 'item.update', 1));
      assert.equal(title.data.record.body.state, state);
    });
  }
});

await test('round1 F4 aliased path separators and dot segments cannot claim disjointness', async () => {
  for (const touches of [['src/./foo*'], ['src//foo*'], ['.\\src\\foo*']]) {
    await withWorkspace(({store}) => {
      seedItem(store, {state: 'ready', touches, next_role: builder.role});
      seedItem(store, {
        id: 'other', state: 'in-progress', touches: ['src/foo.mjs'],
        lease: activeLease(quality, 'other-token'),
      });
      assert.throws(() => reserve(store), error => error.code === 'LEASE_CONFLICT');
    });
  }
});

await test('round1 F8 recovering a blocked review still requires an immutable submitted subject', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'blocked', resume_state: 'in-review', change_ref: null,
      lease: activeLease(reviewer, 'stale-token', {expires_at: EXPIRED}),
    });
    assert.throws(() => recoverExpired(store, {redispatch: reviewer}, 1,
      ['attempt.recover', 'item.restore']),
      error => error.code === 'EVIDENCE_GAP');
  });
});

await test('round1 F9 incompatible operator resolutions cannot be selected opportunistically', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress', lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    const recovered = recoverExpired(store, {
      disposition: 'conflicting-partial-work', redispatch: null, expiresAt: null,
    }).data.record;
    const recovery = {
      attempt_id: recovered.body.recovery_hold, stale_lease_token: 'stale-token',
      disposition: 'safe-to-resume', resume_role: builder.role,
    };
    const first = seedApproval(store, {
      actor: operator, kind: 'operator-recovery-resolution', approvalSubject: null, recovery,
    });
    const other = seedApproval(store, {
      actor: operator, kind: 'operator-recovery-resolution', approvalSubject: null,
      recovery: {...recovery, resume_role: quality.role},
    });
    const restore = id => applyCommand(store, itemCommand('item.restore', steward, 2, {
      at: NOW, recoveryApprovalId: id,
    }), grant(steward, 'item.restore', 2));
    assert.throws(() => restore(first.id), error => error.code === 'AUTHORITY_REQUIRED');
    const resolved = seedApproval(store, {
      actor: operator, kind: 'operator-recovery-resolution', approvalSubject: null,
      recovery, supersedes: [first.id, other.id],
    });
    assert.equal(restore(resolved.id).data.record.body.next_role, builder.role);
  });
});

await test('round1 F10 the authorized question owner can reconcile a late contradiction and restore work', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    const parentId = seedQuestion(store, 'q1', quality.role);
    const answer = (version, text, options = {}) => answerQuestion(store, {
      questionId: 'q1', parentId, sender: quality, recipient: builder.role,
      expectedVersion: version, answer: text, ...options,
    });
    answer(1, 'Yes.');
    reserve(store, reviewer, 2);
    answer(3, 'No.');
    const resolves = readRecord(store, 'question', 'q1').body.answer_message_ids;
    const reconciled = answer(4, 'No: the earlier answer was incorrect.', {
      resolves, actorAuthority: grant(quality, 'question.answer', 4),
    });
    assert.equal(reconciled.data.record.body.state, 'blocked');
    assert.deepEqual(reconciled.data.record.body.waiting_on_questions, []);
    applyCommand(store, itemCommand('item.restore', steward, 5, {at: NOW}),
      grant(steward, 'item.restore', 5));
    const resumed = reserve(store, reviewer, 6);
    assert.equal(resumed.data.record.body.state, 'in-review');
    assert.equal(resumed.data.record.body.lease.holder.runId, reviewer.runId);
    assert.equal(readRecord(store, 'question', 'q1').body.answer_message_ids.length, 3);
  });
});

await test('round1 F1 changed acceptance requires renewed six-dimension release evidence', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store, {delivery_class: 'product-change'});
    seedReview(store);
    seedApproval(store);
    seedReleaseEvidence(store);
    applyCommand(store, itemCommand('item.update', steward, 1, {
      changes: {acceptance: ['Revised release criteria.']},
    }), grant(steward, 'item.update', 1));
    seedReview(store, {criteria: ['Revised release criteria.']});
    seedApproval(store);
    const release = () => applyCommand(store, itemCommand('item.transition', shipper, 2, {
      to: 'release-ready', at: NOW, reason: 'Accept the revised release.',
    }), grant(shipper, 'item.transition', 2));
    assert.throws(release, error => error.code === 'EVIDENCE_GAP');
    seedReleaseEvidence(store);
    assert.equal(release().data.record.body.state, 'release-ready');
  });
});

await test('round1 F2 supersession rejects missing references, cross-scope links, and cycles', async () => {
  for (const scenario of ['missing', 'cross-scope', 'cycle']) {
    await withWorkspace(({store}) => {
      reviewItem(store);
      const firstId = randomUUID();
      const secondId = randomUUID();
      seedReview(store, {id: firstId, supersedes: [secondId]});
      if (scenario !== 'missing') {
        seedReview(store, {
          id: secondId, verdict: 'blocked',
          kind: scenario === 'cross-scope' ? 'different-review-kind' : 'independent-code',
          supersedes: scenario === 'cycle' ? [firstId] : [],
        });
      }
      seedApproval(store);
      assert.throws(() => completeKnowledge(store), error => error.code === 'EVIDENCE_GAP');
      assert.equal(readRecord(store, 'item', 'demo').version, 1);
    });
  }
});

await test('round1 F3 staging deployment and mismatched operator contexts cannot advance', async () => {
  for (const scenario of ['staging', 'different-start', 'rejected-start']) {
    await withWorkspace(({store}) => {
      reviewItem(store, {delivery_class: 'product-change', state: 'deploying'});
      seedApproval(store, {actor: operator, kind: 'operator-deploy-start'});
      seedApproval(store, {
        actor: operator, kind: 'operator-deploy-complete',
        ...(scenario === 'different-start' ? {
          deployment: {environment: 'another-prod', environment_class: 'production', deployment_id: 'different'},
        } : {}),
      });
      if (scenario === 'rejected-start') {
        seedApproval(store, {actor: operator, kind: 'operator-deploy-start', decision: 'rejected'});
      }
      seedEvidence(store, {
        kind: 'deployment',
        data: {environment: scenario === 'staging' ? 'staging' : 'production', deployment_id: 'deploy-123'},
      });
      assert.throws(() => applyCommand(store, itemCommand('item.transition', shipper, 1, {
        to: 'production-verification', at: NOW, reason: 'Record observed deployment.',
      }), grant(shipper, 'item.transition', 1)),
      error => error.code === (scenario === 'staging' ? 'EVIDENCE_GAP' : 'AUTHORITY_REQUIRED'));
    });
  }
});

await test('round1 F4 proven disjoint touch sets still permit grants and live updates', async () => {
  for (const [left, right] of [
    ['src/foo.mjs', 'src/foobar.mjs'],
    ['src/a/**', 'src/b/**'],
    ['src/f*', 'test/f*'],
  ]) {
    await withWorkspace(({store}) => {
      seedItem(store, {state: 'ready', touches: [left], next_role: builder.role});
      seedItem(store, {
        id: 'other', state: 'in-progress', touches: [right],
        lease: activeLease(quality, 'other-token'),
      });
      const reserved = reserve(store).data.record;
      const updated = applyCommand(store, itemCommand('item.update', builder, 2, {
        changes: {touches: ['docs/independent.md']},
      }, reserved.body.lease.token), {roles: grant(steward, 'item.grant', 1).roles, grants: []});
      assert.deepEqual(updated.data.record.body.touches, ['docs/independent.md']);
    });
  }
});

await test('round1 F5 expiry refuses host-authorized transition, handoff, and question opening', async () => {
  for (const kind of ['item.transition', 'item.handoff', 'question.open']) {
    await withWorkspace(({store}) => {
      seedItem(store, {
        state: 'in-progress', producer_actor: builder, acceptance_actor: null,
        lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
      });
      const payload = kind === 'item.transition'
        ? {to: 'in-review', at: NOW, reason: 'Submit expired work.', subject}
        : kind === 'item.handoff' ? {
          toRole: reviewer.role, state: 'in-review', subject, createdAt: NOW,
          messageId: randomUUID(), parentId: null, artifactRefs: [], evidenceRefs: [],
          provenance: 'durable-thread',
          content: {did: 'Work', needs: 'Review', assetState: 'Ready', authority: 'Pending',
            revalidation: 'Required', questions: []},
        } : {
          questionId: 'q1', messageId: randomUUID(), parentId: null, recipient: reviewer.role,
          kind: 'question', createdAt: NOW, artifactRefs: [], evidenceRefs: [], provenance: 'durable-thread',
          content: {questionKind: 'fact', blocking: true, context: 'Context', ask: 'Question?',
            answerBy: 'next-dispatch'},
        };
      assert.throws(() => applyCommand(store, itemCommand(kind, builder, 1, payload, 'stale-token'),
        grant(builder, [...new Set([kind, 'item.transition'])], 1)),
      error => error.code === 'RECOVERY_REQUIRED');
      assert.equal(readRecord(store, 'item', 'demo').body.lease.token, 'stale-token');
      assert.equal(store.database.prepare("SELECT count(*) AS n FROM records WHERE kind = 'message'").get().n, 0);
    });
  }
});

await test('round1 F7 successive replacement builders retain the complete producer history', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {
      state: 'in-progress', producer_actor: builder, acceptance_actor: null,
      lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    const second = {...builder, runId: 'second-builder'};
    const third = {...builder, runId: 'third-builder'};
    const replaced = recoverExpired(store, {redispatch: second}).data.record;
    store.database.prepare("UPDATE records SET body = ? WHERE kind = 'item' AND id = 'demo'")
      .run(JSON.stringify({...replaced.body, lease: {...replaced.body.lease, expires_at: EXPIRED}}));
    const recovered = recoverExpired(store, {redispatch: third}, 2).data.record;
    assert.deepEqual(recovered.body.producing_actors, [builder, second, third]);
    assert.deepEqual(recovered.body.producer_actor, third);
    const submitted = applyCommand(store, itemCommand('item.transition', third, 3, {
      to: 'in-review', at: NOW, reason: 'Submit all reconciled work.', subject,
    }, recovered.body.lease.token), {roles: grant(steward, 'item.grant', 1).roles, grants: []});
    assert.equal(submitted.data.record.body.state, 'in-review');
  });
});

await test('round1 F8 pending dependencies and unavailable recipients refuse recovery atomically', async () => {
  for (const scenario of ['pending', 'unavailable']) {
    await withWorkspace(({store}) => {
      seedItem(store, {id: 'upstream', state: 'in-progress'});
      seedItem(store, {
        state: 'in-progress', producer_actor: builder, acceptance_actor: null,
        depends_on: scenario === 'pending' ? [{item: 'upstream', requires: 'completed'}] : [],
        lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
      });
      assert.throws(() => recoverExpired(store, {
        redispatch: scenario === 'unavailable' ? {role: 'missing', runId: 'missing-run'} : builder,
      }), error => error.code === (scenario === 'pending' ? 'EVIDENCE_GAP' : 'ROLE_UNAVAILABLE'));
      assert.equal(readRecord(store, 'item', 'demo').body.lease.token, 'stale-token');
      assert.equal(store.database.prepare("SELECT count(*) AS n FROM records WHERE kind IN ('attempt','grant','message')").get().n, 0);
    });
  }
});

await test('round1 F9 routing updates, handoffs, and regrants cannot release a recovery hold', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {state: 'in-progress', lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED})});
    recoverExpired(store, {disposition: 'conflicting-partial-work', redispatch: null, expiresAt: null});
    assert.throws(() => applyCommand(store, itemCommand('item.update', steward, 2, {
      changes: {next_role: builder.role},
    }), grant(steward, 'item.update', 2)), error => error.code === 'AUTHORITY_REQUIRED');
    assert.throws(() => reserve(store, builder, 2), error => error.code === 'AUTHORITY_REQUIRED');
    assert.throws(() => applyCommand(store, itemCommand('item.handoff', steward, 2, {
      toRole: builder.role, state: null, createdAt: NOW, messageId: randomUUID(), parentId: null,
      content: {did: 'Inspected', needs: 'Resume', assetState: 'Pending', authority: 'Claimed',
        revalidation: 'Pending', questions: []},
      artifactRefs: [], evidenceRefs: [], provenance: 'durable-thread',
    }), grant(steward, 'item.handoff', 2)), error => error.code === 'AUTHORITY_REQUIRED');
    assert.equal(readRecord(store, 'item', 'demo').body.next_role, 'operator');
  });
});

await test('round1 F9 operator resolution rejects a different stale token, owner, or rejected decision', async () => {
  for (const scenario of ['token', 'owner', 'rejected']) {
    await withWorkspace(({store}) => {
      seedItem(store, {state: 'in-progress', lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED})});
      const held = recoverExpired(store, {
        disposition: 'conflicting-partial-work', redispatch: null, expiresAt: null,
      }).data.record;
      const approval = seedApproval(store, {
        actor: scenario === 'owner' ? steward : operator,
        kind: 'operator-recovery-resolution', approvalSubject: null,
        decision: scenario === 'rejected' ? 'rejected' : 'approved',
        recovery: {
          attempt_id: held.body.recovery_hold,
          stale_lease_token: scenario === 'token' ? 'different-token' : 'stale-token',
          disposition: 'safe-to-resume', resume_role: builder.role,
        },
      });
      assert.throws(() => applyCommand(store, itemCommand('item.restore', steward, 2, {
        at: NOW, recoveryApprovalId: approval.id,
      }), grant(steward, 'item.restore', 2)), error => error.code === 'AUTHORITY_REQUIRED');
      assert.equal(readRecord(store, 'item', 'demo').body.recovery_hold, held.body.recovery_hold);
    });
  }
});

await test('round1 F10 late contradiction on an expired reservation remains recoverable after owner resolution', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store, {lease: activeLease(reviewer, 'stale-token', {expires_at: EXPIRED})});
    const parentId = seedQuestion(store, 'q1', quality.role);
    const answer = (version, text, options = {}) => answerQuestion(store, {
      questionId: 'q1', parentId, sender: quality, recipient: builder.role,
      expectedVersion: version, answer: text, ...options,
    });
    answer(1, 'Yes.');
    answer(2, 'No.');
    const blocked = readRecord(store, 'item', 'demo').body;
    assert.equal(blocked.state, 'blocked');
    assert.equal(blocked.lease.token, 'stale-token');
    assert.throws(() => recoverExpired(store, {redispatch: reviewer}, 3),
      error => error.code === 'EVIDENCE_GAP');
    const resolves = readRecord(store, 'question', 'q1').body.answer_message_ids;
    assert.throws(() => answer(3, 'Definitive.', {resolves}),
      error => error.code === 'AUTHORITY_REQUIRED');
    assert.throws(() => answer(3, 'Incomplete.', {
      resolves: resolves.slice(0, 1), actorAuthority: grant(quality, 'question.answer', 3),
    }), error => error.code === 'INVALID_INPUT');
    answer(3, 'Definitive.', {resolves, actorAuthority: grant(quality, 'question.answer', 3)});
    const recovered = recoverExpired(store, {redispatch: reviewer}, 4,
      ['attempt.recover', 'item.restore']).data.record;
    assert.equal(recovered.body.state, 'in-review');
    assert.equal(recovered.body.resume_state, null);
    assert.deepEqual(recovered.body.producing_actors, [builder]);
    assert.notEqual(recovered.body.lease.token, 'stale-token');
  });
});

await test('round1 F8 F11 expired failed-dependency work can reconcile without redispatch before dropping', async () => {
  await withWorkspace(({store}) => {
    seedItem(store, {id: 'upstream', state: 'dropped'});
    seedItem(store, {
      state: 'blocked', resume_state: 'in-progress',
      depends_on: [{item: 'upstream', requires: 'completed'}],
      lease: activeLease(builder, 'stale-token', {expires_at: EXPIRED}),
    });
    const reconciled = recoverExpired(store, {redispatch: null, expiresAt: null}).data.record;
    assert.equal(reconciled.body.state, 'blocked');
    assert.equal(reconciled.body.lease, null);
    assert.equal(store.database.prepare("SELECT count(*) AS n FROM records WHERE kind = 'grant'").get().n, 0);
    const dropped = applyCommand(store, itemCommand('item.transition', steward, 2, {
      to: 'dropped', at: NOW, reason: 'Safely reconciled; prerequisite was dropped.',
    }), grant(steward, 'item.transition', 2));
    assert.equal(dropped.data.record.body.state, 'dropped');
  });
});

await test('round1 evidenced gaps require explicit supersession rather than disappearing behind a pass', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store, {delivery_class: 'product-change'});
    seedReview(store);
    seedApproval(store);
    seedReleaseEvidence(store);
    const gap = seedEvidence(store, {kind: 'dod-dimension', dimension: 'verified', outcome: 'gap'});
    const release = () => applyCommand(store, itemCommand('item.transition', shipper, 1, {
      to: 'release-ready', at: NOW, reason: 'Reverify the previous evidence gap.',
    }), grant(shipper, 'item.transition', 1));
    assert.throws(release, error => error.code === 'EVIDENCE_GAP');
    seedEvidence(store, {kind: 'dod-dimension', dimension: 'verified', outcome: 'clear', supersedes: [gap.id]});
    assert.equal(release().data.record.body.state, 'release-ready');
    assert.equal(readRecord(store, 'evidence', gap.id).body.outcome, 'gap');
  });
});

await test('round1 failed production checks need same-deployment supersession before shipment', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store, {delivery_class: 'product-change', state: 'production-verification'});
    seedApproval(store, {actor: operator, kind: 'operator-deploy-start'});
    seedApproval(store, {actor: operator, kind: 'operator-deploy-complete'});
    seedEvidence(store, {kind: 'deployment'});
    const failed = seedEvidence(store, {kind: 'production-verification', outcome: 'failed'});
    seedEvidence(store, {kind: 'production-verification'});
    const finish = () => applyCommand(store, itemCommand('item.transition', shipper, 1, {
      to: 'shipped', at: NOW, reason: 'Recheck the failed production condition.',
    }), grant(shipper, 'item.transition', 1));
    assert.throws(finish, error => error.code === 'EVIDENCE_GAP');
    seedEvidence(store, {kind: 'production-verification', supersedes: [failed.id]});
    assert.equal(finish().data.record.body.state, 'shipped');
    assert.equal(readRecord(store, 'evidence', failed.id).body.outcome, 'failed');
  });
});

await test('round1 consumed bindings reject missing references and arbitrary approval flags', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store);
    const approval = seedApproval(store);
    const review = seedReview(store);
    const evidence = seedEvidence(store, {kind: 'deployment'});
    for (const record of [approval, review, evidence]) {
      const body = {...record.body};
      delete body.criteria_ref;
      assert.throws(() => validateRecord({...record, body}), error => error.code === 'INVALID_INPUT');
    }
    assert.throws(() => validateRecord({...approval, body: {...approval.body, approved: true}}),
      error => error.code === 'INVALID_INPUT');
    const deploymentApproval = seedApproval(store, {actor: operator, kind: 'operator-deploy-start'});
    assert.throws(() => validateRecord({
      ...deploymentApproval, body: {...deploymentApproval.body, deployment: true},
    }), error => error.code === 'INVALID_INPUT');
  });
});

await test('round2 recovery authority alone cannot restore blocked review work', async () => {
  await withWorkspace(({store}) => {
    reviewItem(store, {
      state: 'blocked', resume_state: 'in-review',
      lease: activeLease(reviewer, 'stale-token', {expires_at: EXPIRED}),
    });
    const evidence = seedEvidence(store, {
      kind: 'recovery-reconciliation', evidenceSubject: null,
      data: {stale_lease_token: 'stale-token', disposition: 'safe-to-resume', observed: 'Reviewed snapshot reconciled.'},
    });
    const recoveryOnly = grant(steward, 'attempt.recover', 1);
    const recover = itemCommand('attempt.recover', steward, 1, {
      attemptId: randomUUID(), observed: 'Reviewed snapshot reconciled.',
      disposition: 'safe-to-resume', recoveryEvidenceIds: [evidence.id],
      redispatch: reviewer, createdAt: NOW, expiresAt: LATER,
    });
    assert.throws(() => applyCommand(store, itemCommand('item.restore', steward, 1, {
      at: NOW,
    }), recoveryOnly), error => error.code === 'AUTHORITY_REQUIRED');
    assert.throws(() => applyCommand(store, recover, recoveryOnly),
      error => error.code === 'AUTHORITY_REQUIRED');
    const unchanged = readRecord(store, 'item', 'demo');
    assert.equal(unchanged.version, 1);
    assert.equal(unchanged.body.state, 'blocked');
    assert.equal(unchanged.body.resume_state, 'in-review');
    assert.equal(unchanged.body.lease.token, 'stale-token');
    assert.equal(store.database.prepare("SELECT count(*) AS n FROM records WHERE kind IN ('attempt','grant','message')").get().n, 0);
    const restored = applyCommand(store, recover,
      grant(steward, ['attempt.recover', 'item.restore'], 1)).data.record;
    assert.equal(restored.body.state, 'in-review');
    assert.equal(restored.body.resume_state, null);
    assert.deepEqual(restored.body.lease.holder, reviewer);
    assert.notEqual(restored.body.lease.token, 'stale-token');
  });
});

await test('round2 blocked shipping recovery requires workflow-ship and restoration authority', async () => {
  for (const resumeState of ['release-ready', 'deploying', 'production-verification']) {
    await withWorkspace(({store}) => {
      reviewItem(store, {
        delivery_class: 'product-change', state: 'blocked', resume_state: resumeState,
        lease: activeLease(shipper, 'stale-token', {expires_at: EXPIRED}),
      });
      const evidence = seedEvidence(store, {
        kind: 'recovery-reconciliation', evidenceSubject: null,
        data: {stale_lease_token: 'stale-token', disposition: 'safe-to-resume', observed: 'Production action reconciled.'},
      });
      const recover = itemCommand('attempt.recover', shipper, 1, {
        attemptId: randomUUID(), observed: 'Production action reconciled.',
        disposition: 'safe-to-resume', recoveryEvidenceIds: [evidence.id],
        redispatch: shipper, createdAt: NOW, expiresAt: LATER,
      });
      assert.throws(() => applyCommand(store, {...recover, actor: steward},
        grant(steward, ['attempt.recover', 'item.restore'], 1)),
      error => error.code === 'AUTHORITY_REQUIRED');
      assert.throws(() => applyCommand(store, recover, grant(shipper, 'attempt.recover', 1)),
        error => error.code === 'AUTHORITY_REQUIRED');
      const restored = applyCommand(store, recover,
        grant(shipper, ['attempt.recover', 'item.restore'], 1)).data.record;
      assert.equal(restored.body.state, resumeState);
      assert.equal(restored.body.resume_state, null);
      assert.deepEqual(restored.body.lease.holder, shipper);
    });
  }
});

console.log('coordination engine self-test passed');
