import assert from 'node:assert/strict';
import {randomUUID, createHash} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
import {dirname, join, relative} from 'node:path';
import {
  bindEvidenceRuntime, registerArtifact, recordApproval, recordReview,
} from '../../src/core/lib/coordination-runtime/evidence.mjs';
import {
  canonicalJson, criteriaRef, subjectRef, validateRecord,
} from '../../src/core/lib/coordination-runtime/contract.mjs';
import {attemptSummary, sanitizeFacts} from '../../src/core/lib/coordination-runtime/host-schema.mjs';
import {reportPaths} from '../../src/core/lib/coordination-runtime/report.mjs';
import {redactReport} from '../../src/core/lib/coordination-runtime/report-safety.mjs';
import {listRecords, readRecord} from '../../src/core/lib/coordination-runtime/store.mjs';
import {
  authority, command, fixtureIds, seedRecord, seedTask,
} from './coordination-runtime-fixture.mjs';

export const NOW = '2026-09-16T12:00:00.000Z';
export const builder = {role: 'eng-builder-software', runId: 'producer-run'};
export const reviewer = {role: 'eng-reviewer-code', runId: 'report-reviewer'};
export const reportSubject = Object.freeze({kind: 'task', id: fixtureIds.task});
export const runDirectory = '.kai/engineering/reports/report-fixture/scratch';
export const source = `${runDirectory}/exact # subject.html`;
export const payload = '<!doctype html><script>globalThis.evidenceExecuted=true</script><img src="https://attacker.invalid/evidence">';
export const hash = value => createHash('sha256').update(value).digest('hex');

const lookup = store => (kind, id) => readRecord(store, kind, id);

export function reportWriteInput(root, view) {
  return {
    root,
    subject: reportSubject,
    view,
    target: {
      directory: relative(root, reportPaths({root, subject: reportSubject}).directory)
        .replaceAll('\\', '/'),
      accepted_hash: hash(canonicalJson(redactReport(view))),
    },
  };
}

export function file(root, path, bytes) {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), {recursive: true});
  writeFileSync(absolute, bytes);
  return absolute;
}

export function setupReport(root, store, overrides = {}, bytes = payload) {
  file(root, source, bytes);
  seedTask(store, {
    state: 'in-review',
    acceptance_actor: null,
    acceptance: ['Exact behavior verified', 'Keyboard navigation verified'],
    review_requirements: [{role: reviewer.role, kind: 'code'}],
    change_ref: {kind: 'sha256', digest: hash(bytes), path: source},
    ...overrides,
  });
  return addReportArtifact(root, store);
}

export function addReportArtifact(root, store) {
  const task = readRecord(store, 'task', fixtureIds.task);
  bindEvidenceRuntime(store, {
    root,
    authority: authority(builder, ['artifact.register'], {version: task.version}),
    runs: [{actor: builder, directory: runDirectory}],
  });
  const artifactId = randomUUID();
  const assetId = randomUUID();
  const result = registerArtifact(store, command('artifact.register', {
    actor: builder,
    expectedVersion: task.version,
    payload: {
      artifactId,
      assetId,
      subject: task.body.change_ref,
      projectId: task.body.change_ref?.kind === 'git' ? 'bound' : null,
      classification: 'public',
      mediaType: 'text/html',
      title: 'Synthetic accepted report excerpt — never execute',
      inputAssetIds: [],
      at: NOW,
    },
  }));
  assert.equal(result.ok, true);
  acceptReport(root, store, artifactId);
  return {artifactId, assetId};
}

export function verdict(store, kind, artifactId, overrides = {}) {
  const task = readRecord(store, 'task', fixtureIds.task);
  const body = {
    schema_version: 1,
    subject: reportSubject,
    content_ref: task.body.change_ref,
    criteria_ref: criteriaRef(task, lookup(store)),
    supersedes: [],
    evidence_refs: [`artifact:${artifactId}`],
    created_at: NOW,
    ...(kind === 'review' ? {
      review_id: randomUUID(),
      reviewer,
      kind: 'code',
      criteria: ['Exact behavior verified'],
      verdict: 'approved',
      finding_refs: [],
    } : {
      approval_id: randomUUID(),
      authority: reviewer,
      kind: 'completion',
      decision: 'approved',
      deployment: null,
      recovery: null,
      reason: 'Independent exact proof',
    }),
    ...overrides,
  };
  return validateRecord({
    kind,
    id: body[`${kind}_id`],
    subject: reportSubject,
    version: 1,
    body,
  });
}

export function appendVerdict(store, record) {
  seedRecord(store, record);
  store.database.prepare(`
    INSERT INTO events (operation_id, subject_kind, subject_id, payload)
    VALUES (?, ?, ?, ?)
  `).run(randomUUID(), record.subject.kind, record.subject.id, JSON.stringify({
    kind: `${record.kind}.record`,
    recordKind: record.subject.kind,
    recordId: record.subject.id,
    payload: {body: record.body},
  }));
  return record;
}

export function acceptReport(root, store, artifactId) {
  let review = listRecords(store, {kind: 'review', subject: reportSubject})
    .find(record => record.body.evidence_refs.includes(`artifact:${artifactId}`));
  let approval = listRecords(store, {kind: 'approval', subject: reportSubject})
    .find(record => record.body.evidence_refs.includes(`artifact:${artifactId}`));
  for (const [kind, existing, recordFn] of [
    ['review', review, recordReview],
    ['approval', approval, recordApproval],
  ]) {
    if (existing) continue;
    const record = verdict(store, kind, artifactId);
    const task = readRecord(store, 'task', fixtureIds.task);
    const auth = authority(reviewer, ['review.record', 'approval.record'], {version: task.version});
    bindEvidenceRuntime(store, {root, authority: auth, runs: []});
    assert.equal(recordFn(store, command(`${record.kind}.record`, {
      actor: reviewer,
      expectedVersion: task.version,
      payload: {body: record.body},
    }), auth).ok, true);
    if (kind === 'review') review = readRecord(store, 'review', record.id);
    else approval = readRecord(store, 'approval', record.id);
  }
  return {review, approval};
}

export function appendMessage(store, index, {
  threadId = subjectRef(reportSubject, 1),
  refs = [],
  long = false,
} = {}) {
  const id = randomUUID();
  const record = validateRecord({
    kind: 'message',
    id,
    subject: reportSubject,
    version: 1,
    body: {
      schema_version: 1,
      message_id: id,
      subject: reportSubject,
      thread_id: threadId,
      parent_id: null,
      sender_role: builder.role,
      sender_run: builder.runId,
      recipient: reviewer.role,
      kind: 'handoff',
      created_at: NOW,
      basis_version: 1,
      payload: {
        did: long ? 'LongMessage'.repeat(300) : `Synthetic step ${index}`,
        needs: 'Independent review',
        assetState: 'draft',
        authority: 'pending',
        revalidation: 'required',
        questions: [],
      },
      artifact_refs: refs,
      evidence_refs: [],
      provenance: 'durable-thread',
    },
  });
  seedRecord(store, record);
  store.database.prepare(`
    INSERT INTO events (operation_id, subject_kind, subject_id, payload)
    VALUES (?, ?, ?, ?)
  `).run(randomUUID(), record.subject.kind, record.subject.id, JSON.stringify({
    kind: 'task.handoff',
    recordKind: 'task',
    recordId: reportSubject.id,
    payload: {messageId: id},
  }));
  return record;
}

export function mutateBody(store, kind, id, change) {
  const recordKind = kind === 'item' ? 'task' : kind;
  const recordId = kind === 'item' && id === 'demo' ? fixtureIds.task : id;
  const record = readRecord(store, recordKind, recordId);
  change(record.body);
  store.database.prepare('UPDATE records SET body = ? WHERE kind = ? AND id = ?')
    .run(JSON.stringify(record.body), recordKind, recordId);
}

export function seedHostAttempt(store, observations = [], overrides = {}) {
  const id = randomUUID();
  const body = {
    schema_version: 1,
    attempt_id: id,
    subject: reportSubject,
    subject_version: 1,
    actor: {role: 'eng-lead-architecture', runId: 'lead-run'},
    target: builder,
    agent_id: 'kai-engineering:eng-builder-software',
    profile: 'execution',
    requested_model: 'claude-sonnet-5',
    requested_effort: null,
    independence_key: `fixture-${id}`,
    context: 'fresh-single-shot',
    resume_from: null,
    resume_session_id: null,
    capabilities: {
      peerDispatch: false,
      resume: false,
      modelOverride: true,
      usage: true,
      models: ['claude-sonnet-5'],
      efforts: [],
    },
    settings: {model: 'claude-sonnet-5'},
    created_at: NOW,
    observations: observations.map(facts => ({
      observationId: randomUUID(),
      source: 'host',
      capturedAt: NOW,
      facts: sanitizeFacts({status: 'completed', liveness: 'stopped', ...facts}),
      sessionConflicts: [],
    })),
    ...overrides,
  };
  Object.assign(body, attemptSummary(body));
  return seedRecord(store, validateRecord({
    kind: 'host-attempt',
    id,
    subject: reportSubject,
    version: 1,
    body,
  }));
}
