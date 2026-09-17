import assert from 'node:assert/strict';
import {randomUUID, createHash} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {
  bindEvidenceRuntime, registerArtifact, recordApproval, recordReview,
} from '../../scripts/lib/coordination-runtime/evidence.mjs';
import {criteriaRef, validateRecord} from '../../scripts/lib/coordination-runtime/contract.mjs';
import {attemptSummary, sanitizeFacts} from '../../scripts/lib/coordination-runtime/host-schema.mjs';
import {readRecord} from '../../scripts/lib/coordination-runtime/store.mjs';
import {authority, command, seedItem, seedRecord} from './coordination-runtime-fixture.mjs';

export const NOW = '2026-09-16T12:00:00.000Z';
export const builder = {role: 'eng-builder-software', runId: 'producer-run'};
export const reviewer = {role: 'eng-reviewer-code', runId: 'report-reviewer'};
export const source = '.kai/runs/report-fixture/exact # subject.html';
export const payload = '<!doctype html><script>globalThis.evidenceExecuted=true</script><img src="https://attacker.invalid/evidence">';
export const hash = value => createHash('sha256').update(value).digest('hex');
export function file(root, path, bytes) {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), {recursive: true});
  writeFileSync(absolute, bytes);
  return absolute;
}

export function setupReport(root, store, overrides = {}, bytes = payload) {
  file(root, source, bytes);
  seedItem(store, {
    state: 'in-review', acceptance_actor: null,
    acceptance: ['Exact behavior verified', 'Keyboard navigation verified'],
    review_requirements: [{role: reviewer.role, kind: 'code'}],
    change_ref: {kind: 'sha256', digest: hash(bytes), path: source},
    ...overrides,
  });
  return addReportArtifact(root, store);
}

export function addReportArtifact(root, store) {
  const item = readRecord(store, 'item', 'demo');
  bindEvidenceRuntime(store, {
    root, authority: authority(builder, ['artifact.register'], {version: item.version}),
    runs: [{actor: builder, directory: '.kai/runs/report-fixture'}],
  });
  const artifactId = randomUUID();
  const assetId = randomUUID();
  const result = registerArtifact(store, command('artifact.register', {
    actor: builder, expectedVersion: item.version, payload: {
      artifactId, assetId, subject: item.body.change_ref,
      projectId: item.body.change_ref?.kind === 'git' ? 'bound' : null, classification: 'internal', mediaType: 'text/html',
      title: 'Synthetic exact HTML evidence — never execute', inputAssetIds: [], at: NOW,
    },
  }));
  assert.equal(result.ok, true);
  return {artifactId, assetId};
}

export function verdict(store, kind, artifactId, overrides = {}) {
  const item = readRecord(store, 'item', 'demo');
  const body = {
    schema_version: 1, item_id: item.id, subject: item.body.change_ref,
    criteria_ref: criteriaRef(item.body), supersedes: [],
    evidence_refs: [`artifact:${artifactId}`], created_at: NOW,
    ...(kind === 'review' ? {
      review_id: randomUUID(), reviewer, kind: 'code',
      criteria: ['Exact behavior verified'], verdict: 'approved', finding_refs: [],
    } : {
      approval_id: randomUUID(), authority: reviewer, kind: 'completion',
      decision: 'approved', deployment: null, recovery: null, reason: 'Independent exact proof',
    }),
    ...overrides,
  };
  return validateRecord({
    kind, id: body[`${kind}_id`], itemId: item.id, version: 1, body,
  });
}

export function appendVerdict(store, record) {
  seedRecord(store, record);
  store.database.prepare('INSERT INTO events (operation_id, item_id, payload) VALUES (?, ?, ?)')
    .run(randomUUID(), record.itemId, JSON.stringify({
      kind: `${record.kind}.record`, recordKind: 'item', recordId: record.itemId,
      payload: {body: record.body},
    }));
  return record;
}

export function acceptReport(root, store, artifactId) {
  const review = verdict(store, 'review', artifactId);
  const approval = verdict(store, 'approval', artifactId);
  for (const [record, recordFn] of [[review, recordReview], [approval, recordApproval]]) {
    const item = readRecord(store, 'item', 'demo');
    const auth = authority(reviewer, ['review.record', 'approval.record'], {version: item.version});
    bindEvidenceRuntime(store, {root, authority: auth, runs: []});
    assert.equal(recordFn(store, command(`${record.kind}.record`, {
      actor: reviewer, expectedVersion: item.version, payload: {body: record.body},
    }), auth).ok, true);
  }
  return {review, approval};
}

export function appendMessage(store, index, {threadId = 'demo', refs = [], long = false} = {}) {
  const id = randomUUID();
  const record = validateRecord({
    kind: 'message', id, itemId: 'demo', version: 1,
    body: {
      schema_version: 1, message_id: id, item_id: 'demo', thread_id: threadId,
      parent_id: null, sender_role: builder.role, sender_run: builder.runId,
      recipient: reviewer.role, kind: 'handoff', created_at: NOW, basis_version: 1,
      payload: {
        did: long ? 'LongMessage'.repeat(300) : `Synthetic step ${index}`,
        needs: 'Independent review', assetState: 'draft', authority: 'pending',
        revalidation: 'required', questions: [],
      },
      artifact_refs: refs, evidence_refs: [], provenance: 'durable-thread',
    },
  });
  seedRecord(store, record);
  store.database.prepare('INSERT INTO events (operation_id, item_id, payload) VALUES (?, ?, ?)')
    .run(randomUUID(), record.itemId, JSON.stringify({
      kind: 'item.handoff', recordKind: 'item', recordId: 'demo', payload: {messageId: id},
    }));
  return record;
}

export function mutateBody(store, kind, id, change) {
  const record = readRecord(store, kind, id);
  change(record.body);
  store.database.prepare('UPDATE records SET body = ? WHERE kind = ? AND id = ?')
    .run(JSON.stringify(record.body), kind, id);
}

export function seedHostAttempt(store, observations = [], overrides = {}) {
  const id = randomUUID();
  const body = {
    schema_version: 1, attempt_id: id, item_id: 'demo', item_version: 1,
    actor: {role: 'eng-lead-architecture', runId: 'lead-run'}, target: builder,
    agent_id: 'kai-engineering:eng-builder-software', profile: 'execution',
    requested_model: 'claude-sonnet-5', requested_effort: null, independence_key: `fixture-${id}`,
    context: 'fresh-single-shot', resume_from: null, resume_session_id: null,
    capabilities: {
      peerDispatch: false, resume: false, modelOverride: true, usage: true,
      models: ['claude-sonnet-5'], efforts: [],
    },
    settings: {model: 'claude-sonnet-5'}, created_at: NOW,
    observations: observations.map(facts => ({
      observationId: randomUUID(), source: 'host', capturedAt: NOW,
      facts: sanitizeFacts({status: 'completed', liveness: 'stopped', ...facts}), sessionConflicts: [],
    })),
    ...overrides,
  };
  Object.assign(body, attemptSummary(body));
  return seedRecord(store, validateRecord({kind: 'host-attempt', id, itemId: 'demo', version: 1, body}));
}
