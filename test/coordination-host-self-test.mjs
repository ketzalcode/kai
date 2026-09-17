import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {
  bindHostRuntime, planDispatch, recordAttempt, recordHostResult, recordEffect,
} from '../scripts/lib/coordination-runtime/host.mjs';
import {
  commandDigest, validateCommand, validateRecord,
} from '../scripts/lib/coordination-runtime/contract.mjs';
import {
  readRecord, listRecords, openStore, closeStore, applyOperation,
} from '../scripts/lib/coordination-runtime/store.mjs';
import {readDetail, projectContext} from '../scripts/lib/coordination-runtime/context.mjs';
import {applyCommand} from '../scripts/lib/coordination-runtime/engine.mjs';
import {ROLE_PROFILE_MODELS, agentProfileModelErrors} from '../scripts/lib/pack-plan.mjs';
import {parseFrontmatter, stripQuotes, loaderErrors} from '../scripts/lib/loader-contract.mjs';
import {authority, command, seedItem, withWorkspace} from './helpers/coordination-runtime-fixture.mjs';

const role = 'eng-builder-software';
const model = 'claude-sonnet-5';
const qualifiedId = 'kai-engineering:eng-builder-software';
const actor = {role, runId: 'host-recorder'};
const roster = [{id: qualifiedId, role, model}];
const profiles = {[role]: 'execution'};
const capabilities = {
  peerDispatch: false, resume: false, modelOverride: false, usage: true,
  models: [model], efforts: [],
};
const code = expected => error => error.code === expected;
const tests = [];
const check = (name, fn) => tests.push([name, fn]);
const input = overrides => ({
  item: {next_role: role}, roster, profiles, capabilities, ...overrides,
});

// Only this adapter can attest observations. JSON copies of its opaque handles
// are untrusted; all storage, validation, receipts and decisions remain real.
function adapter(root, store, overrides = {}) {
  const handles = new WeakMap();
  let grants = [];
  const options = {
    root, roster, profiles, capabilities, maxAttempts: 3,
    authority: {roles: [role], grants},
    verifyObservation(cmd, handle) {
      const entry = handles.get(handle);
      if (!entry || entry.digest !== commandDigest(cmd)) return null;
      return structuredClone(entry.proof);
    },
    ...overrides,
  };
  const bind = () => bindHostRuntime(store, {...options, authority: {...options.authority, grants}});
  bind();
  return {
    authorize(cmd) {
      grants = authority(cmd.actor, cmd.kind, {
        roles: options.authority.roles, recordKind: cmd.recordKind,
        recordId: cmd.recordId, version: cmd.expectedVersion,
      }).grants;
      if (cmd.kind === 'attempt.start' || cmd.kind === 'effect.intent') {
        grants.push(...authority(cmd.actor, cmd.kind, {
          recordId: cmd.payload.itemId, version: cmd.payload.itemVersion,
        }).grants);
      }
      bind();
      return cmd;
    },
    capture(cmd, facts = {}, {source = 'host', proof = {}} = {}) {
      const handle = Object.freeze({});
      handles.set(handle, {
        digest: commandDigest(cmd),
        proof: {
          commandDigest: commandDigest(cmd), actor: cmd.actor,
          observationId: cmd.payload.observationId,
          attemptId: cmd.recordKind === 'host-attempt' ? cmd.recordId : cmd.payload.attemptId,
          effectId: cmd.recordKind === 'effect' ? cmd.recordId : null,
          capturedAt: '2026-09-16T12:00:01.000Z',
          source, facts, ...proof,
        },
      });
      return handle;
    },
  };
}

function start(overrides = {}) {
  const {payload, ...rest} = overrides;
  return command('attempt.start', {
    actor, recordKind: 'host-attempt', recordId: randomUUID(), expectedVersion: 0,
    ...rest,
    payload: {
      itemId: 'demo', itemVersion: 1, target: {role, runId: randomUUID()},
      profile: 'execution', requestedModel: model, effort: null,
      independenceKey: 'implementation', resumeFrom: null,
      createdAt: '2026-09-16T12:00:00.000Z', ...payload,
    },
  });
}
function result(attempt, overrides = {}) {
  return command('attempt.result', {
    actor, recordKind: 'host-attempt', recordId: attempt.recordId, expectedVersion: 1,
    payload: {observationId: randomUUID()}, ...overrides,
  });
}
function effect(attempt, payload = {}) {
  return command('effect.intent', {
    actor, recordKind: 'effect', recordId: randomUUID(), expectedVersion: 0,
    payload: {
      itemId: 'demo', itemVersion: 1, attemptId: attempt.recordId,
      intendedAction: 'send invoice', idempotencyKey: null, external: true, paid: false,
      createdAt: '2026-09-16T12:00:00.000Z', ...payload,
    },
  });
}
function effectResult(intent, overrides = {}) {
  return command('effect.result', {
    actor, recordKind: 'effect', recordId: intent.recordId, expectedVersion: 1,
    payload: {attemptId: intent.payload.attemptId, observationId: randomUUID()}, ...overrides,
  });
}
function setup(store) {
  return seedItem(store, {state: 'in-progress', next_role: role});
}
function observe(host, store, cmd, facts = {}, options) {
  host.authorize(cmd);
  return recordHostResult(store, cmd, host.capture(cmd, facts, options));
}
const stopped = {status: 'failed', liveness: 'stopped', actualModel: model, sessionId: 'session-a'};
const shipper = {role: 'workflow-ship', runId: 'shipping-run'};
const shippingHost = (root, store) => adapter(root, store, {
  roster: [...roster, {id: 'kai-engineering:workflow-ship', role: shipper.role, model}],
  profiles: {...profiles, [shipper.role]: 'procedure'},
});
const shippingItem = (store, state, overrides = {}) => seedItem(store, {
  delivery_class: 'product-change', state, next_role: shipper.role,
  change_ref: {kind: 'sha256', path: 'src/shipping.mjs', digest: 'a'.repeat(64)},
  ...overrides,
});

for (const state of ['release-ready', 'deploying', 'production-verification']) {
  for (const restored of [false, true]) {
    check(`round1 shipping ${state} accepts an engine lease${restored ? ' after authorized restore' : ''}`, () =>
      withWorkspace(({root, store, now}) => {
        let item = shippingItem(store, restored ? 'blocked' : state,
          restored ? {resume_state: state} : {});
        if (restored) {
          const restore = command('item.restore', {actor: shipper, payload: {at: now}});
          const wrongRole = {...restore, actor};
          assert.throws(() => applyCommand(store, wrongRole, authority(actor, 'item.restore')),
            code('AUTHORITY_REQUIRED'));
          assert.throws(() => applyCommand(store, restore, {roles: authority(actor, 'item.restore').roles, grants: []}),
            code('AUTHORITY_REQUIRED'));
          item = applyCommand(store, restore, authority(shipper, 'item.restore')).data.record;
          assert.equal(item.body.state, state);
        }
        const grant = command('item.grant', {
          expectedVersion: item.version,
          payload: {holder: shipper, actions: ['item.transition'], acquiredAt: now, expiresAt: '2099-01-01T00:00:00.000Z'},
        });
        item = applyCommand(store, grant, authority(grant.actor, grant.kind, {version: item.version})).data.record;
        const host = shippingHost(root, store);
        const cmd = start({
          leaseToken: item.body.lease.token,
          payload: {itemVersion: item.version, target: shipper, profile: 'procedure'},
        });
        assert.equal(recordAttempt(store, host.authorize(cmd)).ok, true);
        assert.deepEqual(readRecord(store, 'item', 'demo'), item);
        assert.equal(listRecords(store, {kind: 'grant', itemId: 'demo'}).length, 1);
        assert.throws(() => recordAttempt(store, host.authorize(start({
          leaseToken: item.body.lease.token, payload: {itemVersion: item.version},
        }))), code('AUTHORITY_REQUIRED'));
        if (state !== 'production-verification') {
          const transition = command('item.transition', {
            actor: shipper, expectedVersion: item.version, leaseToken: item.body.lease.token,
            payload: {to: state === 'release-ready' ? 'deploying' : 'production-verification',
              at: now, reason: 'Recording intent is not operator deployment confirmation.'},
          });
          assert.throws(() => applyCommand(store, transition, {roles: authority(actor, grant.kind).roles, grants: []}),
            code('AUTHORITY_REQUIRED'));
        }
        assert.deepEqual(readRecord(store, 'item', 'demo'), item);
        assert.deepEqual(listRecords(store, {kind: 'approval', itemId: 'demo'}), []);
      }));
  }
}

check('round1 shipping operator routing cannot be replaced by a host attempt', () =>
  withWorkspace(({root, store}) => {
    const item = shippingItem(store, 'release-ready', {next_role: 'operator'});
    const host = shippingHost(root, store);
    assert.throws(() => recordAttempt(store, host.authorize(start({
      payload: {target: shipper, profile: 'procedure'},
    }))), code('INVALID_INPUT'));
    assert.throws(() => recordAttempt(store, host.authorize(start({
      payload: {target: {role: 'operator', runId: 'operator-run'}, profile: 'procedure'},
    }))), code('AUTHORITY_REQUIRED'));
    assert.deepEqual(readRecord(store, 'item', 'demo'), item);
    assert.equal(listRecords(store, {kind: 'host-attempt', itemId: 'demo'}).length, 0);
  }));

check('missing exact role and ambiguous qualified IDs fail rather than alias matching', () => {
  assert.throws(() => planDispatch(input({roster: [], profiles: {}, capabilities: {}})), code('ROLE_UNAVAILABLE'));
  assert.throws(() => planDispatch(input({roster: [{...roster[0], role: 'builder'}]})), code('ROLE_UNAVAILABLE'));
  assert.throws(() => planDispatch(input({roster: [...roster, {...roster[0], id: 'other:eng-builder-software'}]})),
    code('ROLE_UNAVAILABLE'));
});

check('no-peer planning emits an ordered manual queue with the exact host ID and fresh context', () => {
  const packet = planDispatch(input());
  assert.equal(packet.mode, 'ordered-queue');
  assert.equal(packet.automatic, false);
  assert.equal(packet.queue[0].agentId, qualifiedId);
  assert.equal(packet.queue[0].context, 'fresh-single-shot');
  assert.equal(packet.queue[0].requestedModel, model);
  assert.deepEqual(packet.queue[0].settings, {});
});

check('only approved available models and supported overrides are planned, never an invented fallback', () => {
  assert.throws(() => planDispatch(input({capabilities: {...capabilities, models: []}})), code('MODEL_UNAVAILABLE'));
  assert.throws(() => planDispatch(input({roster: [{...roster[0], model: 'other'}]})), code('MODEL_UNAVAILABLE'));
  assert.throws(() => planDispatch(input({request: {fallbackModel: 'claude-opus-5'}})), code('MODEL_UNAVAILABLE'));
  assert.throws(() => planDispatch(input({request: {model: 'claude-opus-5'}})), code('MODEL_UNAVAILABLE'));
  assert.throws(() => planDispatch(input({request: {profile: 'judgment'}})), code('INVALID_INPUT'));
  assert.throws(() => planDispatch(input({request: {role: 'eng-reviewer-code'}})), code('INVALID_INPUT'));
  assert.throws(() => planDispatch(input({profiles: {[role]: 'judgment'}})), code('INVALID_INPUT'));
  assert.throws(() => planDispatch(input({request: {effort: 'high'}})), code('UNSUPPORTED_HOST'));
  const packet = planDispatch(input({
    roster: [{...roster[0], model: null}], request: {effort: 'high'},
    capabilities: {...capabilities, peerDispatch: true, modelOverride: true, efforts: ['high']},
  }));
  assert.equal(packet.mode, 'peer-available');
  assert.deepEqual(packet.queue[0].settings, {model, effort: 'high'});
});

check('six real core sources retain their profiles and acquire the shared approved model pins', () => {
  const expected = {
    'director-chief-of-staff': 'judgment',
    'workflow-initiative-init': 'procedure',
    'workflow-proactive-scan': 'procedure',
    'workflow-self-check': 'procedure',
    'workflow-weekly-pulse': 'procedure',
    'workflow-workspace-init': 'procedure',
  };
  for (const [id, profile] of Object.entries(expected)) {
    const body = readFileSync(new URL(`../plugins/kai-core/agents/${id}.agent.md`, import.meta.url), 'utf8');
    const {fm} = parseFrontmatter(body);
    assert.match(body, new RegExp(`^\\*\\*Primary profile:\\*\\* ${profile}$`, 'm'));
    assert.deepEqual(loaderErrors('agent', id, fm), [], id);
    assert.equal(stripQuotes(fm.model), ROLE_PROFILE_MODELS[profile], id);
    assert.deepEqual(agentProfileModelErrors({id, body, fm}), []);
    const packet = planDispatch(input({
      item: {next_role: id}, roster: [{id: `kai-core:${id}`, role: id, model: stripQuotes(fm.model)}],
      profiles: {[id]: profile}, capabilities: {...capabilities, models: [stripQuotes(fm.model)]},
    }));
    assert.equal(packet.queue[0].requestedModel, stripQuotes(fm.model));
  }
});

check('host intent persists separately from recovery attempts without changing the item or its live lease', () =>
  withWorkspace(({root, store}) => {
    const cmd = start();
    cmd.leaseToken = 'live-worker-token';
    const item = seedItem(store, {
      state: 'in-progress', next_role: role,
      lease: {token: cmd.leaseToken, holder: cmd.payload.target, version_at_grant: 1,
        acquired_at: '2026-09-16T12:00:00.000Z', expires_at: '2099-01-01T00:00:00.000Z'},
    });
    const host = adapter(root, store);
    const receipt = recordAttempt(store, host.authorize(cmd));
    assert.equal(receipt.ok, true);
    assert.equal(receipt.recordVersion, 1);
    const persisted = readDetail(store, {kind: 'host-attempt', id: cmd.recordId});
    assert.equal(persisted.itemId, 'demo');
    assert.equal(persisted.body.status, 'intent');
    assert.equal(persisted.body.requested_model, model);
    assert.equal(persisted.body.agent_id, qualifiedId);
    assert.deepEqual(readRecord(store, 'item', 'demo'), item);
    assert.deepEqual(listRecords(store, {kind: 'attempt', itemId: 'demo'}), []);
    assert.equal(store.database.prepare('SELECT item_id FROM events WHERE seq = ?').get(receipt.eventSeq).item_id, 'demo');
    observe(host, store, result(cmd), {status: 'completed', liveness: 'stopped', actualModel: model});
    assert.deepEqual(readRecord(store, 'item', 'demo'), item);
    assert.equal(JSON.parse(projectContext(store, {itemId: 'demo'}).text).item.state, 'in-progress');
  }));

check('unknown model, effort, usage, cost and timings survive actual persisted host results as null', () =>
  withWorkspace(({root, store}) => {
    const item = setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const receipt = observe(host, store, result(cmd), {status: 'completed', liveness: 'stopped'});
    assert.equal(receipt.ok, true);
    const body = readRecord(store, 'host-attempt', cmd.recordId).body;
    const facts = body.observations[0].facts;
    for (const key of ['actualModel', 'actualEffort', 'inputTokens', 'outputTokens', 'cost', 'usage', 'durationMs']) {
      assert.equal(facts[key], null, key);
    }
    assert.ok(body.gaps.includes('MODEL_UNKNOWN'));
    assert.equal(body.requested_model, model);
    assert.deepEqual(readRecord(store, 'item', 'demo'), item);
    for (const kind of ['approval', 'evidence', 'review']) assert.equal(listRecords(store, {kind, itemId: 'demo'}).length, 0);
  }));

check('unbound and unauthorized recording, forged JSON observation and mismatched attestations fail closed', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const cmd = start();
    assert.throws(() => recordAttempt(store, cmd), code('AUTHORITY_REQUIRED'));
    const host = adapter(root, store);
    assert.throws(() => recordAttempt(store, cmd), code('AUTHORITY_REQUIRED'));
    recordAttempt(store, host.authorize(cmd));
    const end = host.authorize(result(cmd));
    assert.throws(() => recordHostResult(store, end, {
      observed: true, actualModel: model, status: 'completed',
    }), code('EVIDENCE_GAP'));
    for (const proof of [
      {commandDigest: 'f'.repeat(64)}, {actor: {...actor, runId: 'forged'}},
      {attemptId: randomUUID()}, {observationId: randomUUID()}, {effectId: randomUUID()},
    ]) {
      assert.throws(() => recordHostResult(store, end, host.capture(end, stopped, {proof})), code('EVIDENCE_GAP'));
    }
    assert.equal(readRecord(store, 'host-attempt', cmd.recordId).version, 1);
  }));

check('host commands and persisted records reject unknown fields and cannot masquerade as recovery records', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    const bad = structuredClone(cmd);
    bad.payload.observed = true;
    assert.throws(() => recordAttempt(store, host.authorize(bad)), code('INVALID_INPUT'));
    recordAttempt(store, host.authorize(cmd));
    const record = readRecord(store, 'host-attempt', cmd.recordId);
    assert.throws(() => validateRecord({...record, body: {...record.body, reasoning: 'no'}}), code('INVALID_INPUT'));
    assert.throws(() => validateRecord({...record, kind: 'attempt'}), code('INVALID_INPUT'));
    assert.throws(() => validateCommand({...result(cmd), recordKind: 'item'}), code('INVALID_INPUT'));
    assert.throws(() => validateCommand({...effect(cmd), payload: {...effect(cmd).payload, replay: true}}), code('INVALID_INPUT'));
  }));

check('lost acknowledgement is durable uncertainty and the same operation retrieves its original receipt', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    const receipt = recordAttempt(store, host.authorize(cmd));
    assert.deepEqual(recordAttempt(store, cmd), receipt);
    assert.throws(() => recordAttempt(store, {...cmd, payload: {...cmd.payload, effort: 'high'}}),
      code('OPERATION_CONFLICT'));
    const end = result(cmd);
    observe(host, store, end, {status: 'acknowledgement-lost', liveness: 'unknown', durationMs: 1400}, {source: 'local'});
    const body = readRecord(store, 'host-attempt', cmd.recordId).body;
    assert.equal(body.status, 'uncertain');
    assert.equal(body.observations[0].source, 'local');
    assert.equal(body.observations[0].facts.durationMs, 1400);
    assert.equal(body.observations[0].facts.actualModel, null);
    assert.throws(() => recordAttempt(store, host.authorize(start())), code('RECOVERY_REQUIRED'));
  }));

check('duplicate completions are idempotent, changed captures conflict, contradictory terminals remain facts', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const end = host.authorize(result(cmd));
    const handle = host.capture(end, {status: 'completed', liveness: 'stopped', actualModel: model});
    const receipt = recordHostResult(store, end, handle);
    assert.deepEqual(recordHostResult(store, end, handle), receipt);
    assert.throws(() => recordHostResult(store, end, host.capture(end, stopped)), code('OPERATION_CONFLICT'));
    const duplicate = host.authorize({...end, operationId: randomUUID(), expectedVersion: 2});
    recordHostResult(store, duplicate, host.capture(duplicate, {status: 'completed', liveness: 'stopped', actualModel: model}));
    assert.equal(readRecord(store, 'host-attempt', cmd.recordId).body.observations.length, 1);
    observe(host, store, result(cmd, {expectedVersion: 3}), stopped);
    const body = readRecord(store, 'host-attempt', cmd.recordId).body;
    assert.equal(body.status, 'conflicting');
    assert.equal(body.observations.length, 2);
    assert.ok(body.gaps.includes('CONFLICTING_RESULTS'));
    assert.throws(() => recordAttempt(store, host.authorize(start())), code('RECOVERY_REQUIRED'));
  }));

const capturedAt = second => `2026-09-16T12:00:0${second}.000Z`;
const running = {...stopped, status: 'timeout', liveness: 'running'};
function captureResult(host, store, attempt, facts, second) {
  const current = readRecord(store, 'host-attempt', attempt.recordId);
  return observe(host, store, result(attempt, {expectedVersion: current.version}), facts,
    {proof: {capturedAt: capturedAt(second)}});
}
function assertRetryBlocked(host, store, attempt) {
  assert.throws(() => recordAttempt(store, host.authorize(start())), code('RECOVERY_REQUIRED'));
  assert.throws(() => recordAttempt(store, host.authorize(start({
    payload: {resumeFrom: attempt.recordId, target: attempt.payload.target},
  }))), code('RECOVERY_REQUIRED'));
  assert.equal(listRecords(store, {kind: 'host-attempt', itemId: 'demo'}).length, 1);
}

for (const {name, captures} of [
  {name: 'delayed older stop cannot supersede a newer running capture', captures: [[running, 2], [stopped, 1]]},
  {name: 'renamed old stop cannot clear an existing running conflict', captures: [[stopped, 1], [running, 2]]},
  {name: 'same-time stop arriving last cannot establish stopped liveness', captures: [[running, 2], [stopped, 2]]},
  {name: 'same-time running arriving last stays conflicting after a renamed stop', captures: [[stopped, 2], [running, 2]]},
]) {
  check(`round1 capture chronology ${name}`, () =>
    withWorkspace(({root, store}) => {
      const item = setup(store);
      const host = adapter(root, store, {capabilities: {...capabilities, resume: true}});
      const attempt = start();
      recordAttempt(store, host.authorize(attempt));
      for (const [facts, second] of captures) captureResult(host, store, attempt, facts, second);
      assertRetryBlocked(host, store, attempt);
      const history = readRecord(store, 'host-attempt', attempt.recordId).body.observations;
      const stopTime = captures.find(([facts]) => facts.liveness === 'stopped')[1];
      captureResult(host, store, attempt, stopped, stopTime);
      assertRetryBlocked(host, store, attempt);
      const body = readRecord(store, 'host-attempt', attempt.recordId).body;
      assert.equal(body.status, 'conflicting');
      assert.ok(body.gaps.includes('CONFLICTING_RESULTS'));
      assert.equal(body.observations.length, 3);
      assert.deepEqual(body.observations.slice(0, 2), history);
      assert.equal(body.observations[2].capturedAt, capturedAt(stopTime));
      assert.notEqual(body.observations[2].observationId,
        history.find(o => o.facts.liveness === 'stopped').observationId);
      assert.deepEqual(readRecord(store, 'item', 'demo'), item);
      for (const kind of ['attempt', 'effect', 'approval', 'evidence']) {
        assert.equal(listRecords(store, {kind, itemId: 'demo'}).length, 0, kind);
      }
    }));
}

for (const second of [1, 2]) {
  check(`round1 capture chronology host unknown at ${second} does not prove current stop`, () =>
    withWorkspace(({root, store}) => {
      setup(store);
      const host = adapter(root, store, {capabilities: {...capabilities, resume: true}});
      const attempt = start();
      recordAttempt(store, host.authorize(attempt));
      captureResult(host, store, attempt, {...running, liveness: 'unknown'}, second);
      captureResult(host, store, attempt, stopped, 1);
      assertRetryBlocked(host, store, attempt);
      const body = readRecord(store, 'host-attempt', attempt.recordId).body;
      assert.equal(body.status, 'uncertain');
      assert.ok(body.gaps.includes('LIVENESS_UNKNOWN'));
    }));
}

for (const resume of [false, true]) {
  check(`round1 capture chronology a genuinely newer verified stop allows explicit ${resume ? 'resume' : 'fresh retry'}`, () =>
    withWorkspace(({root, store}) => {
      const item = setup(store);
      const host = adapter(root, store, {capabilities: {...capabilities, resume: true}});
      const attempt = start();
      recordAttempt(store, host.authorize(attempt));
      captureResult(host, store, attempt, stopped, 1);
      captureResult(host, store, attempt, running, 2);
      assertRetryBlocked(host, store, attempt);
      captureResult(host, store, attempt, stopped, 3);
      const body = readRecord(store, 'host-attempt', attempt.recordId).body;
      assert.equal(body.status, 'failed');
      assert.equal(body.observations.length, 3);
      assert.equal(body.observations[1].facts.liveness, 'running');
      assert.deepEqual(readRecord(store, 'item', 'demo'), item);
      assert.equal(listRecords(store, {kind: 'host-attempt', itemId: 'demo'}).length, 1);
      const retry = start(resume ? {payload: {resumeFrom: attempt.recordId, target: attempt.payload.target}} : {});
      const receipt = recordAttempt(store, host.authorize(retry));
      assert.equal(receipt.ok, true);
      assert.equal(receipt.data.record.body.context, resume ? 'resume' : 'fresh-single-shot');
      assert.equal(listRecords(store, {kind: 'effect', itemId: 'demo'}).length, 0);
      assert.deepEqual(readRecord(store, 'item', 'demo'), item);
    }));
}

check('round1 capture chronology delayed running history does not override a genuinely newer stop', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const attempt = start();
    recordAttempt(store, host.authorize(attempt));
    captureResult(host, store, attempt, stopped, 3);
    captureResult(host, store, attempt, running, 2);
    assert.equal(readRecord(store, 'host-attempt', attempt.recordId).body.status, 'failed');
    assert.equal(recordAttempt(store, host.authorize(start())).ok, true);
  }));

check('round1 capture chronology fresh stop never erases terminal-result disagreement', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store, {capabilities: {...capabilities, resume: true}});
    const attempt = start();
    recordAttempt(store, host.authorize(attempt));
    captureResult(host, store, attempt, {...stopped, status: 'completed'}, 2);
    captureResult(host, store, attempt, stopped, 1);
    captureResult(host, store, attempt, stopped, 3);
    assertRetryBlocked(host, store, attempt);
    const body = readRecord(store, 'host-attempt', attempt.recordId).body;
    assert.equal(body.status, 'conflicting');
    assert.ok(body.gaps.includes('CONFLICTING_RESULTS'));
    assert.equal(body.observations.length, 3);
  }));

for (const newerVerified of [false, true]) {
  check(`round1 capture chronology resume uses current terminal identity, newer verified=${newerVerified}`, () =>
    withWorkspace(({root, store}) => {
      setup(store);
      const host = adapter(root, store, {capabilities: {...capabilities, resume: true}});
      const attempt = start();
      recordAttempt(store, host.authorize(attempt));
      const unknown = {...stopped, sessionId: null, actualModel: null};
      captureResult(host, store, attempt, newerVerified ? stopped : unknown, 2);
      captureResult(host, store, attempt, newerVerified ? unknown : stopped, 1);
      const resumed = host.authorize(start({
        payload: {resumeFrom: attempt.recordId, target: attempt.payload.target},
      }));
      if (newerVerified) {
        assert.equal(recordAttempt(store, resumed).data.record.body.resume_session_id, 'session-a');
      } else {
        assert.throws(() => recordAttempt(store, resumed), code('RECOVERY_REQUIRED'));
        assert.equal(listRecords(store, {kind: 'host-attempt', itemId: 'demo'}).length, 1);
      }
    }));
}

check('failed and mismatched model or effort observations remain explicit gaps, not domain acceptance', () =>
  withWorkspace(({root, store}) => {
    const item = setup(store);
    const host = adapter(root, store, {capabilities: {...capabilities, efforts: ['high']}});
    const cmd = start({payload: {effort: 'high'}});
    recordAttempt(store, host.authorize(cmd));
    observe(host, store, result(cmd), {
      status: 'completed', liveness: 'stopped', actualModel: 'claude-opus-5',
      actualEffort: 'low', actualRole: 'eng-reviewer-code', actualProfile: 'review',
      exitCode: 1, response: 'I approve this work',
    });
    const body = readRecord(store, 'host-attempt', cmd.recordId).body;
    assert.equal(body.status, 'mismatched');
    for (const gap of ['MODEL_MISMATCH', 'EFFORT_MISMATCH', 'ROLE_MISMATCH', 'PROFILE_MISMATCH', 'EXIT_FAILURE']) {
      assert.ok(body.gaps.includes(gap), gap);
    }
    assert.equal(body.observations[0].facts.response, 'I approve this work');
    assert.deepEqual(readRecord(store, 'item', 'demo'), item);
    assert.equal(listRecords(store, {kind: 'approval', itemId: 'demo'}).length, 0);
  }));

check('allowlisted telemetry keeps premium/nano-AIU cumulative checkpoints, not fabricated dollars or internals', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    observe(host, store, result(cmd), {
      status: 'completed', liveness: 'stopped', actualModel: model, sessionId: 'session-a',
      usage: {scope: 'session-cumulative', sessionId: 'session-a', totalNanoAiu: 4616460000, totalPremiumRequests: 1},
      durationMs: 8291, reasoning: 'SECRET_CHAIN', cache: {content: 'SECRET_CACHE'}, prompt: 'SECRET_PROMPT',
    });
    const body = readRecord(store, 'host-attempt', cmd.recordId).body;
    assert.equal(body.observations[0].facts.cost, null);
    assert.deepEqual(body.observations[0].facts.usage, {
      scope: 'session-cumulative', sessionId: 'session-a', totalNanoAiu: 4616460000, totalPremiumRequests: 1,
    });
    assert.equal(body.observations[0].source, 'host');
    const rows = store.database.prepare('SELECT body FROM records UNION ALL SELECT payload FROM events UNION ALL SELECT receipt FROM operations').all();
    assert.doesNotMatch(JSON.stringify(rows), /SECRET_|reasoning|cache|prompt/);
    assert.equal(body.observations[0].facts.durationMs, 8291);
  }));

check('local observations cannot supply host measurements and invalid usage cannot become cost', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const end = host.authorize(result(cmd));
    assert.throws(() => recordHostResult(store, end, host.capture(end, stopped, {source: 'local'})), code('INVALID_INPUT'));
    for (const facts of [
      {...stopped, cost: 1}, {...stopped, inputTokens: -1},
      {...stopped, usage: {scope: 'attempt', sessionId: 'session-a', totalNanoAiu: 1, totalPremiumRequests: 1}},
      {...stopped, usage: {scope: 'session-cumulative', sessionId: 'other', totalNanoAiu: 1, totalPremiumRequests: 1}},
    ]) assert.throws(() => recordHostResult(store, end, host.capture(end, facts)), code('INVALID_INPUT'));
    assert.equal(readRecord(store, 'host-attempt', cmd.recordId).version, 1);
  }));

check('unsupported resume, uncertain liveness and attempt bounds prevent redispatch', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store, {maxAttempts: 2});
    const first = start();
    recordAttempt(store, host.authorize(first));
    observe(host, store, result(first), stopped);
    assert.throws(() => recordAttempt(store, host.authorize(start({
      payload: {resumeFrom: first.recordId, target: first.payload.target},
    }))), code('UNSUPPORTED_HOST'));
    const second = start();
    recordAttempt(store, host.authorize(second));
    observe(host, store, result(second), {...stopped, sessionId: 'session-b'});
    assert.throws(() => recordAttempt(store, host.authorize(start())), code('RECOVERY_REQUIRED'));
    assert.equal(listRecords(store, {kind: 'host-attempt', itemId: 'demo'}).length, 2);
  }));

check('timeout is unknown liveness even with elapsed local timing, and a later host fact may resolve it', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const first = start();
    recordAttempt(store, host.authorize(first));
    observe(host, store, result(first), {status: 'timeout', liveness: 'unknown', durationMs: 30000}, {source: 'local'});
    assert.throws(() => recordAttempt(store, host.authorize(start())), code('RECOVERY_REQUIRED'));
    observe(host, store, result(first, {expectedVersion: 2}), stopped);
    const second = start();
    assert.equal(recordAttempt(store, host.authorize(second)).ok, true);
    const body = readRecord(store, 'host-attempt', first.recordId).body;
    assert.equal(body.observations.length, 2);
    assert.equal(body.observations[0].facts.liveness, 'unknown');
    assert.equal(body.status, 'failed');
  }));

check('resume requires the same role, profile, run, independence boundary and a stopped known session', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store, {capabilities: {...capabilities, resume: true}});
    const first = start();
    recordAttempt(store, host.authorize(first));
    observe(host, store, result(first), stopped);
    for (const change of [
      {independenceKey: 'independent-review'}, {target: {role, runId: randomUUID()}},
      {profile: 'review'},
    ]) {
      assert.throws(() => recordAttempt(store, host.authorize(start({
        payload: {resumeFrom: first.recordId, target: first.payload.target, ...change},
      }))), error => ['INVALID_INPUT', 'RECOVERY_REQUIRED'].includes(error.code));
    }
    const resumed = start({payload: {resumeFrom: first.recordId, target: first.payload.target}});
    const receipt = recordAttempt(store, host.authorize(resumed));
    assert.equal(receipt.data.record.body.context, 'resume');
    assert.equal(receipt.data.record.body.resume_session_id, 'session-a');
  }));

check('a fresh context cannot recycle an old run across items or independent reviewing roles', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const first = start();
    recordAttempt(store, host.authorize(first));
    observe(host, store, result(first), stopped);
    seedItem(store, {id: 'other', state: 'in-progress', next_role: role});
    assert.throws(() => recordAttempt(store, host.authorize(start({
      payload: {itemId: 'other', target: first.payload.target},
    }))), code('RECOVERY_REQUIRED'));
    assert.throws(() => recordAttempt(store, host.authorize(start({
      payload: {target: first.payload.target, independenceKey: 'independent-review'},
    }))), code('RECOVERY_REQUIRED'));
  }));

check('stale item versions and blocked lifecycle cannot create executable intents', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    assert.throws(() => recordAttempt(store, host.authorize(start({payload: {itemVersion: 2}}))), code('VERSION_CONFLICT'));
    const item = readRecord(store, 'item', 'demo');
    const changed = {...item.body, state: 'completed'};
    store.database.prepare("UPDATE records SET body = ? WHERE kind = 'item' AND id = 'demo'").run(JSON.stringify(changed));
    assert.throws(() => recordAttempt(store, host.authorize(start())), code('RECOVERY_REQUIRED'));
    assert.equal(listRecords(store, {kind: 'host-attempt', itemId: 'demo'}).length, 0);
  }));

check('unresolved external/paid intent blocks replay, survives uncertain results and never changes lifecycle', () =>
  withWorkspace(({root, store}) => {
    const item = setup(store);
    const host = adapter(root, store);
    const attempt = start();
    recordAttempt(store, host.authorize(attempt));
    const intent = effect(attempt, {paid: true, idempotencyKey: 'invoice-42'});
    const receipt = recordEffect(store, host.authorize(intent));
    assert.equal(receipt.data.record.itemId, 'demo');
    assert.equal(receipt.data.record.body.outcome, 'unknown');
    assert.equal(receipt.data.record.body.attempt_id, attempt.recordId);
    assert.deepEqual(recordEffect(store, intent), receipt);
    assert.throws(() => recordEffect(store, host.authorize(effect(attempt))), code('RECOVERY_REQUIRED'));
    observe(host, store, result(attempt), stopped);
    assert.throws(() => recordAttempt(store, host.authorize(start())), code('RECOVERY_REQUIRED'));
    const end = host.authorize(effectResult(intent));
    recordEffect(store, end, host.capture(end, {outcome: 'unknown'}));
    assert.throws(() => recordAttempt(store, host.authorize(start())), code('RECOVERY_REQUIRED'));
    assert.deepEqual(readRecord(store, 'item', 'demo'), item);
    assert.equal(listRecords(store, {kind: 'approval', itemId: 'demo'}).length, 0);
  }));

check('verified not-applied effects permit an explicit bounded retry; conflicting effects stay uncertain', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const attempt = start();
    recordAttempt(store, host.authorize(attempt));
    const intent = effect(attempt);
    recordEffect(store, host.authorize(intent));
    const end = host.authorize(effectResult(intent));
    const handle = host.capture(end, {outcome: 'not-applied'});
    const receipt = recordEffect(store, end, handle);
    assert.deepEqual(recordEffect(store, end, handle), receipt);
    observe(host, store, result(attempt), stopped);
    assert.equal(recordAttempt(store, host.authorize(start())).ok, true);
    const conflict = host.authorize(effectResult(intent, {expectedVersion: 2}));
    recordEffect(store, conflict, host.capture(conflict, {outcome: 'succeeded'}));
    const body = readRecord(store, 'effect', intent.recordId).body;
    assert.equal(body.outcome, 'conflicting');
    assert.equal(body.observations.length, 2);
  }));

check('a second SQLite connection sees durable intents and can still use its unchanged acting lease/version', () =>
  withWorkspace(({root, store}) => {
    const cmd = start();
    cmd.leaseToken = 'acting-lease';
    const item = seedItem(store, {
      state: 'in-progress', next_role: role,
      lease: {token: 'acting-lease', holder: cmd.payload.target, version_at_grant: 1,
        acquired_at: '2026-09-16T12:00:00.000Z', expires_at: '2099-01-01T00:00:00.000Z'},
    });
    const observer = openStore({path: store.path, mode: 'write'});
    try {
      const host = adapter(root, store);
      const wrong = start({payload: {target: {...cmd.payload.target, runId: 'not-holder'}}});
      assert.throws(() => recordAttempt(store, host.authorize(wrong)), code('LEASE_CONFLICT'));
      recordAttempt(store, host.authorize(cmd));
      assert.equal(readRecord(observer, 'host-attempt', cmd.recordId).body.status, 'intent');
      const intent = effect(cmd);
      intent.leaseToken = 'acting-lease';
      recordEffect(store, host.authorize(intent));
      observe(host, store, result(cmd), stopped);
      const end = host.authorize(effectResult(intent));
      recordEffect(store, end, host.capture(end, {outcome: 'unknown'}));
      assert.deepEqual(readRecord(observer, 'item', 'demo'), item);
      const edit = command('item.update', {
        actor: cmd.payload.target, leaseToken: cmd.leaseToken,
        payload: {title: 'Worker can still persist its own change'},
      });
      const updated = applyOperation(observer, edit, current => ({...current.body, title: edit.payload.title}));
      assert.equal(updated.recordVersion, 2);
      assert.deepEqual(updated.data.record.body.lease, item.body.lease);
      observe(host, store, result(cmd, {expectedVersion: 2}), stopped);
      assert.deepEqual(readRecord(observer, 'item', 'demo'), updated.data.record);
    } finally {
      closeStore(observer);
    }
  }));

check('explicit observed currency is scoped and cumulative checkpoints stay separate', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    observe(host, store, result(cmd), {
      ...stopped,
      usage: {scope: 'session-cumulative', sessionId: 'session-a', totalNanoAiu: 100, totalPremiumRequests: 1},
    });
    const second = result(cmd, {expectedVersion: 2});
    observe(host, store, second, {
      ...stopped,
      usage: {scope: 'session-cumulative', sessionId: 'session-a', totalNanoAiu: 200, totalPremiumRequests: 2},
      cost: {amount: 0.03, currency: 'USD', scope: 'session-cumulative', sessionId: 'session-a'},
    });
    const observations = readRecord(store, 'host-attempt', cmd.recordId).body.observations;
    assert.deepEqual(observations.map(o => o.facts.usage.totalNanoAiu), [100, 200]);
    assert.equal(observations[0].facts.cost, null);
    assert.deepEqual(observations[1].facts.cost, {
      amount: 0.03, currency: 'USD', scope: 'session-cumulative', sessionId: 'session-a',
    });
  }));

check('host record validation rejects altered policy', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const record = readRecord(store, 'host-attempt', cmd.recordId);
    assert.throws(() => validateRecord({...record, body: {...record.body, requested_model: 'claude-opus-5'}}),
      code('INVALID_INPUT'));
  }));

check('command mutation cannot rewrite an intended effect', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const intent = effect(cmd);
    const receipt = recordEffect(store, host.authorize(intent));
    const other = effect(cmd, {intendedAction: 'charge a card', external: false});
    assert.throws(() => applyOperation(store, other, () => ({
      ...receipt.data.record.body, effect_id: other.recordId, intended_action: 'send a message',
    })), code('INVALID_INPUT'));
    assert.equal(readRecord(store, 'effect', other.recordId), null);
  }));

check('raw flags cannot supply a verifier, workspace binding must match and plain handle copies have no authority', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    assert.throws(() => bindHostRuntime(store, {
      root, authority: {roles: [role], grants: []}, roster, profiles, capabilities,
      maxAttempts: 3, verifyObservation: {verified: true},
    }), code('INVALID_INPUT'));
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const end = host.authorize(result(cmd));
    const handle = host.capture(end, stopped);
    assert.throws(() => recordHostResult(store, end, JSON.parse(JSON.stringify(handle))), code('EVIDENCE_GAP'));
    const foreignRoot = `${root}-not-this-store`;
    assert.throws(() => bindHostRuntime(store, {
      root: foreignRoot, authority: {roles: [role], grants: []}, roster, profiles, capabilities, maxAttempts: 3,
    }));
    assert.equal(readRecord(store, 'host-attempt', cmd.recordId).version, 1);
  }));

check('an observation whose session disagrees with requested resume remains a mismatched fact', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store, {capabilities: {...capabilities, resume: true}});
    const first = start();
    recordAttempt(store, host.authorize(first));
    observe(host, store, result(first), stopped);
    const resumed = start({payload: {resumeFrom: first.recordId, target: first.payload.target}});
    recordAttempt(store, host.authorize(resumed));
    observe(host, store, result(resumed), {...stopped, sessionId: 'unexpected-session'});
    const body = readRecord(store, 'host-attempt', resumed.recordId).body;
    assert.equal(body.status, 'mismatched');
    assert.ok(body.gaps.includes('SESSION_MISMATCH'));
    assert.equal(body.observations[0].facts.sessionId, 'unexpected-session');
  }));

check('observation bounds stop record growth without replay and conflicting effect captures do not disappear in receipts', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const intent = effect(cmd);
    recordEffect(store, host.authorize(intent));
    const end = host.authorize(effectResult(intent));
    recordEffect(store, end, host.capture(end, {outcome: 'unknown'}));
    assert.throws(() => recordEffect(store, end, host.capture(end, {outcome: 'succeeded'})), code('OPERATION_CONFLICT'));
    for (let index = 1; index <= 32; index += 1) {
      observe(host, store, result(cmd, {expectedVersion: index}), stopped);
    }
    const overflow = host.authorize(result(cmd, {expectedVersion: 33}));
    assert.throws(() => recordHostResult(store, overflow, host.capture(overflow, stopped)), code('RECOVERY_REQUIRED'));
    assert.equal(readRecord(store, 'host-attempt', cmd.recordId).body.observations.length, 32);
  }));

check('declared risk flags cannot bypass unresolved effect reconciliation', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const intent = effect(cmd, {external: false, paid: false});
    recordEffect(store, host.authorize(intent));
    observe(host, store, result(cmd), stopped);
    assert.throws(() => recordAttempt(store, host.authorize(start())), code('RECOVERY_REQUIRED'));
  }));

check('observed session reuse contradicts a fresh context instead of silently crossing an independence boundary', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const first = start();
    recordAttempt(store, host.authorize(first));
    observe(host, store, result(first), stopped);
    const second = start({payload: {independenceKey: 'separate-context'}});
    recordAttempt(store, host.authorize(second));
    const end = host.authorize(result(second));
    const handle = host.capture(end, stopped);
    const receipt = recordHostResult(store, end, handle);
    assert.equal(receipt.data.record.body.status, 'mismatched');
    assert.ok(receipt.data.record.body.gaps.includes('SESSION_BOUNDARY_MISMATCH'));
    assert.deepEqual(receipt.data.record.body.observations[0].sessionConflicts, [first.recordId]);
    assert.deepEqual(recordHostResult(store, end, handle), receipt);
  }));

check('malformed host roster fails with the shared input error', () => {
  assert.throws(() => planDispatch(input({roster: [null]})), code('INVALID_INPUT'));
});

check('malformed host observation container fails with the shared input error', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const record = readRecord(store, 'host-attempt', cmd.recordId);
    assert.throws(() => validateRecord({...record, body: {...record.body, observations: [null]}}), code('INVALID_INPUT'));
  }));

check('malformed host mutation fails with the shared input error', () =>
  withWorkspace(({root, store}) => {
    setup(store);
    const host = adapter(root, store);
    const cmd = start();
    recordAttempt(store, host.authorize(cmd));
    const record = readRecord(store, 'host-attempt', cmd.recordId);
    const other = start();
    const body = {...record.body, attempt_id: other.recordId, target: other.payload.target};
    delete body.observations;
    assert.throws(() => applyOperation(store, other, () => body), code('INVALID_INPUT'));
  }));

check('private host schema imports independently without a contract initialization cycle', () => {
  assert.doesNotThrow(() => execFileSync(process.execPath, [
    '--input-type=module', '-e', "await import('./scripts/lib/coordination-runtime/host-schema.mjs')",
  ], {cwd: fileURLToPath(new URL('..', import.meta.url)), stdio: 'pipe'}));
});

for (const [name, fn] of tests) test(name, fn);
