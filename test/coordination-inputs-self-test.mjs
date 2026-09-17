import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID} from 'node:crypto';
import {mkdirSync, writeFileSync} from 'node:fs';
import {join, dirname} from 'node:path';
import {withWorkspace, seedItem, seedInitiative, authority, command} from './helpers/coordination-runtime-fixture.mjs';
import {criteriaRef} from '../scripts/lib/coordination-runtime/contract.mjs';
import {bindEvidenceRuntime, hashArtifact, registerArtifact, recordApproval, transitionAsset} from '../scripts/lib/coordination-runtime/evidence.mjs';
import {readRecord} from '../scripts/lib/coordination-runtime/store.mjs';
import {applyCommand} from '../scripts/lib/coordination-runtime/engine.mjs';
import {projectContext} from '../scripts/lib/coordination-runtime/context.mjs';
import {buildReport} from '../scripts/lib/coordination-runtime/report.mjs';

const builder = {role: 'eng-builder-software', runId: 'build-context'};
const reviewer = {role: 'eng-reviewer-code', runId: 'review-context'};
const inputFile = '.kai/state/design.md';
const outputFile = '.kai/runs/native/build-context/answer.md';
const at = () => new Date().toISOString();
function file(root, path, bytes) {
  mkdirSync(dirname(join(root, path)), {recursive: true});
  writeFileSync(join(root, path), bytes);
}
function bind(root, store, actor, kind, id) {
  const item = readRecord(store, 'item', id);
  const auth = authority(actor, kind, {recordId: id, version: item.version});
  bindEvidenceRuntime(store, {root, authority: auth, runs: [{actor, directory: `.kai/runs/native/${actor.runId}`}]});
  return auth;
}
function cmd(store, kind, id, payload, actor = builder) {
  return command(kind, {recordId: id, expectedVersion: readRecord(store, 'item', id).version, payload, actor});
}

test('changing applicable context references changes the acceptance criteria', () => withWorkspace(({store}) => {
  const item = seedItem(store);
  assert.notEqual(criteriaRef({...item.body, context_artifacts: ['.kai/state/brief-a.md']}),
    criteriaRef({...item.body, context_artifacts: ['.kai/state/brief-b.md']}));
}));

test('cross-item design is context, not same-item verdict evidence; changing its bytes invalidates acceptance', () => withWorkspace(({root, store}) => {
  seedInitiative(store);
  file(root, inputFile, 'Approved design v1');
  const design = seedItem(store, {id: 'design', state: 'in-review', producer_actor: builder,
    acceptance_actor: null, change_ref: hashArtifact({root, relativePath: inputFile}), artifact_targets: [inputFile]});
  const artifactId = randomUUID(), assetId = randomUUID();
  bind(root, store, builder, 'artifact.register', 'design');
  registerArtifact(store, cmd(store, 'artifact.register', 'design', {
    artifactId, assetId, subject: design.body.change_ref, projectId: null,
    classification: 'internal', mediaType: 'text/markdown', title: 'Cross-item design', inputAssetIds: [], at: at(),
  }));
  file(root, outputFile, 'Implementation follows design v1');
  seedItem(store, {id: 'implementation', state: 'in-review', producer_actor: builder,
    acceptance_actor: null, change_ref: hashArtifact({root, relativePath: outputFile})});
  const reference = `artifact:${artifactId}`;
  const update = cmd(store, 'item.update', 'implementation', {changes: {context_artifacts: [reference]}});
  applyCommand(store, update, bind(root, store, builder, 'item.update', 'implementation'));
  const projected = JSON.parse(projectContext(store, {itemId: 'implementation'}).text);
  assert.ok(projected.selected_artifact_evidence_references.includes(reference));
  const outputId = randomUUID();
  bind(root, store, builder, 'artifact.register', 'implementation');
  registerArtifact(store, cmd(store, 'artifact.register', 'implementation', {
    artifactId: outputId, assetId: randomUUID(), subject: readRecord(store, 'item', 'implementation').body.change_ref,
    projectId: null, classification: 'internal', mediaType: 'text/markdown',
    title: 'Output', inputAssetIds: [], at: at(),
  }));
  const item = readRecord(store, 'item', 'implementation');
  const approval = cmd(store, 'approval.record', 'implementation', {body: {
    schema_version: 1, approval_id: randomUUID(), item_id: item.id, authority: reviewer,
    kind: 'completion', subject: item.body.change_ref, criteria_ref: criteriaRef(item.body),
    supersedes: [], deployment: null, recovery: null, decision: 'approved',
    evidence_refs: [`artifact:${outputId}`], reason: 'Reviewed output against design', created_at: at(),
  }}, reviewer);
  bind(root, store, reviewer, 'approval.record', item.id);
  recordApproval(store, approval);
  file(root, inputFile, 'Design v2 changes the contract');
  const finish = cmd(store, 'item.transition', item.id, {to: 'completed', at: at(), reason: 'Done'}, reviewer);
  assert.throws(() => applyCommand(store, finish, bind(root, store, reviewer, 'item.transition', item.id)),
    error => error.code === 'EVIDENCE_GAP');
  const before = readRecord(store, 'item', item.id).version;
  assert.equal(before, finish.expectedVersion);
}));

test('revising a cross-item input asset invalidates the derived output even when its bytes and reference ID stay the same', () => withWorkspace(({root, store}) => {
    const register = (id, path, inputs = []) => {
      file(root, path, id);
      const subject = hashArtifact({root, relativePath: path});
      seedItem(store, {id, state: 'in-review', acceptance_actor: null, producer_actor: builder,
        change_ref: subject, artifact_targets: [path]});
      const artifactId = randomUUID(), assetId = randomUUID();
      bind(root, store, builder, 'artifact.register', id);
      registerArtifact(store, cmd(store, 'artifact.register', id, {artifactId, assetId, subject,
        projectId: null, classification: 'internal', mediaType: 'text/markdown',
        title: id, inputAssetIds: inputs, at: at()}));
      return {artifactId, assetId, subject};
    };
    const input = register('input', inputFile);
    const output = register('derived', outputFile, [input.assetId]);
    const item = readRecord(store, 'item', 'derived');
    bind(root, store, reviewer, 'approval.record', item.id);
    recordApproval(store, cmd(store, 'approval.record', item.id, {body: {
      schema_version: 1, approval_id: randomUUID(), item_id: item.id, authority: reviewer,
      kind: 'completion', subject: output.subject, criteria_ref: criteriaRef(item.body), supersedes: [],
      deployment: null, recovery: null, decision: 'approved', evidence_refs: [`artifact:${output.artifactId}`],
      reason: 'Accept this exact input revision', created_at: at(),
    }}, reviewer));
    bind(root, store, builder, 'asset.transition', 'input');
    transitionAsset(store, cmd(store, 'asset.transition', 'input', {assetId: input.assetId,
      disposition: 'draft', validity: 'provisional', target: null, approvalId: null,
      supersedes: null, reason: 'New input lifecycle revision', at: at()}));
    const finish = cmd(store, 'item.transition', item.id, {to: 'completed', at: at(), reason: 'Attempt stale close'}, reviewer);
    assert.throws(() => applyCommand(store, finish, bind(root, store, reviewer, 'item.transition', item.id)),
      error => error.code === 'EVIDENCE_GAP');
  }));

test('a fresh registered input basis and explicitly superseding verdict can revalidate unchanged output bytes', () => withWorkspace(({root, store}) => {
    file(root, inputFile, 'Brief v1');
    file(root, outputFile, 'The same output meets either brief after review');
    const subject = hashArtifact({root, relativePath: outputFile});
    seedItem(store, {state: 'in-review', acceptance_actor: null, producer_actor: builder,
      change_ref: subject, context_artifacts: [inputFile]});
    const register = () => {
      const artifactId = randomUUID();
      bind(root, store, builder, 'artifact.register', 'demo');
      registerArtifact(store, cmd(store, 'artifact.register', 'demo', {artifactId, assetId: randomUUID(), subject,
        projectId: null, classification: 'internal', mediaType: 'text/markdown', title: 'Output basis',
        inputAssetIds: [], at: at()}));
      return artifactId;
    };
    const accept = (artifactId, supersedes = []) => {
      const approvalId = randomUUID();
      bind(root, store, reviewer, 'approval.record', 'demo');
      recordApproval(store, cmd(store, 'approval.record', 'demo', {body: {
        schema_version: 1, approval_id: approvalId, item_id: 'demo', authority: reviewer,
        kind: 'completion', subject, criteria_ref: criteriaRef(readRecord(store, 'item', 'demo').body),
        supersedes, deployment: null, recovery: null, decision: 'approved',
        evidence_refs: [`artifact:${artifactId}`], reason: 'Reviewed against this registered basis', created_at: at(),
      }}, reviewer));
      return approvalId;
    };
    const firstArtifact = register();
    const first = accept(firstArtifact);
    file(root, inputFile, 'Brief v2');
    const second = register();
    const fresh = accept(second, [first]);
    const finish = cmd(store, 'item.transition', 'demo', {to: 'completed', at: at(), reason: 'Fresh explicit acceptance'}, reviewer);
    assert.equal(applyCommand(store, finish, bind(root, store, reviewer, 'item.transition', 'demo')).ok, true);
    const report = buildReport(store, {itemId: 'demo'});
    assert.equal(report.decisions.find(a => a.id === fresh).integrity, 'verified',
      'obsolete same-output input basis must not poison fresh superseding approval');
    assert.equal(report.artifacts.find(a => a.id === firstArtifact).status, 'historical');
    assert.equal(report.decisions.find(a => a.id === first).status, 'superseded');
    assert.equal(report.decisions.find(a => a.id === first).integrity, 'gap',
      'supersession must not hide the stale cited input basis');
    assert.ok(report.gaps.some(g => g.ref === `artifact:${firstArtifact}`),
      'the old basis gap remains explicit');
}));

for (const inputKind of ['artifact', 'asset', 'evidence', 'file', 'recursive', 'legacy-personal', 'legacy-context']) {
  test(`known personal ${inputKind} context cannot produce a public derivative`, () => withWorkspace(({root, store}) => {
    const privateFile = '.kai/personal/brief.md';
    file(root, privateFile, 'Private personal source');
    const source = hashArtifact({root, relativePath: privateFile});
    seedItem(store, {id: 'personal-input', state: 'in-review', acceptance_actor: null,
      producer_actor: builder, change_ref: source, artifact_targets: [privateFile]});
    const artifactId = randomUUID(), assetId = randomUUID();
    bind(root, store, builder, 'artifact.register', 'personal-input');
    registerArtifact(store, cmd(store, 'artifact.register', 'personal-input', {
      artifactId, assetId, subject: source, projectId: null, classification: 'personal',
      mediaType: 'text/markdown', title: 'Personal brief', inputAssetIds: [], at: at(),
    }));
    if (inputKind === 'legacy-personal') store.database.prepare("UPDATE records SET body = json_remove(body, '$.input_basis') WHERE kind='artifact' AND id=?")
      .run(artifactId);
    let reference = inputKind === 'asset' ? `asset:${assetId}` : `artifact:${artifactId}`;
    if (inputKind === 'file') reference = privateFile;
    if (inputKind === 'evidence') {
      // Legacy supported evidence whose public metadata points at personal content.
      const evidenceId = randomUUID();
      store.database.prepare('INSERT INTO records (kind,id,item_id,version,body) VALUES (?,?,?,?,?)')
        .run('evidence', evidenceId, 'personal-input', 1, JSON.stringify({
          schema_version: 1, evidence_id: evidenceId, item_id: 'personal-input',
          kind: 'dod-dimension', subject: source,
          criteria_ref: criteriaRef(readRecord(store, 'item', 'personal-input').body),
          supersedes: [], dimension: 'verified', outcome: 'clear',
          evidence_refs: [`artifact:${artifactId}`], reason: null, data: {}, created_at: at(),
          provenance: {tier: 'declared', capture: null},
        }));
      reference = `evidence:${evidenceId}`;
    }
    if (inputKind === 'recursive' || inputKind === 'legacy-context') {
      file(root, inputFile, 'Private derivative');
      seedItem(store, {id: 'intermediate', state: 'in-review', acceptance_actor: null,
        producer_actor: builder, context_artifacts: [`artifact:${artifactId}`], artifact_targets: [inputFile]});
      const intermediate = randomUUID();
      bind(root, store, builder, 'artifact.register', 'intermediate');
      registerArtifact(store, cmd(store, 'artifact.register', 'intermediate', {
        artifactId: intermediate, assetId: randomUUID(), subject: hashArtifact({root, relativePath: inputFile}),
        projectId: null, classification: 'personal', mediaType: 'text/markdown',
        title: 'Intermediate', inputAssetIds: [], at: at(),
      }));
      // A historical underclassified record must not erase its known recursive basis.
      store.database.prepare("UPDATE records SET body = json_set(body, '$.classification', 'public') WHERE kind='artifact' AND id=?")
        .run(intermediate);
      if (inputKind === 'legacy-context') store.database.prepare("UPDATE records SET body = json_remove(body, '$.input_basis') WHERE kind='artifact' AND id=?")
        .run(intermediate);
      reference = `artifact:${intermediate}`;
    }
    file(root, outputFile, 'Different output bytes');
    seedItem(store, {state: 'in-review', acceptance_actor: null, producer_actor: builder,
      context_artifacts: [reference]});
    const outputId = randomUUID();
    bind(root, store, builder, 'artifact.register', 'demo');
    const output = cmd(store, 'artifact.register', 'demo', {
      artifactId: outputId, assetId: randomUUID(), subject: hashArtifact({root, relativePath: outputFile}),
      projectId: null, classification: 'public', mediaType: 'text/markdown', title: 'Derivative',
      inputAssetIds: [], at: at(),
    });
    assert.throws(() => registerArtifact(store, output), error => inputKind === 'legacy-context'
      ? error.code === 'EVIDENCE_GAP' && /unknown.*lineage/i.test(error.message)
      : error.code === 'INVALID_INPUT' && /privacy/.test(error.message));
    assert.equal(readRecord(store, 'artifact', outputId), null);
  }));
}

const personalAliases = [
  '.kai\\personal\\brief.md', '.kai/./personal/brief.md', '.kai/personal/./brief.md',
  ...(process.platform === 'win32' ? ['.kai/personal/BRIEF.md'] : []),
];
for (const alias of personalAliases) {
  for (const via of ['file', 'evidence', 'captured-artifact']) {
    test(`canonical personal input privacy through ${via}: ${alias}`, () => withWorkspace(({root, store}) => {
      file(root, '.kai/personal/brief.md', 'Unregistered personal bytes');
      file(root, outputFile, 'Unrelated derivative bytes');
      seedItem(store, {state: 'in-review', acceptance_actor: null, producer_actor: builder,
        context_artifacts: [alias]});
      let reference = alias;
      if (via === 'evidence') {
        const evidenceId = randomUUID();
        store.database.prepare('INSERT INTO records (kind,id,item_id,version,body) VALUES (?,?,?,?,?)')
          .run('evidence', evidenceId, 'demo', 1, JSON.stringify({
            schema_version: 1, evidence_id: evidenceId, item_id: 'demo',
            kind: 'dod-dimension', subject: hashArtifact({root, relativePath: outputFile}),
            criteria_ref: criteriaRef(readRecord(store, 'item', 'demo').body),
            supersedes: [], dimension: 'verified', outcome: 'clear', evidence_refs: [alias],
            reason: null, data: {}, created_at: at(), provenance: {tier: 'declared', capture: null},
          }));
        reference = `evidence:${evidenceId}`;
      } else if (via === 'captured-artifact') {
        const intermediate = randomUUID();
        bind(root, store, builder, 'artifact.register', 'demo');
        registerArtifact(store, cmd(store, 'artifact.register', 'demo', {
          artifactId: intermediate, assetId: randomUUID(), subject: hashArtifact({root, relativePath: outputFile}),
          projectId: null, classification: 'personal', mediaType: 'text/markdown',
          title: 'Known captured personal input', inputAssetIds: [], at: at(),
        }));
        store.database.prepare("UPDATE records SET body = json_set(body, '$.classification', 'public') WHERE kind='artifact' AND id=?")
          .run(intermediate);
        reference = `artifact:${intermediate}`;
      }
      seedItem(store, {id: 'derivative', state: 'in-review', acceptance_actor: null, producer_actor: builder,
        context_artifacts: [reference]});
      const derivativeFile = '.kai/runs/native/build-context/derivative.md';
      file(root, derivativeFile, 'New derivative, not a registered content alias');
      const register = classification => {
        bind(root, store, builder, 'artifact.register', 'derivative');
        return registerArtifact(store, cmd(store, 'artifact.register', 'derivative', {
          artifactId: randomUUID(), assetId: randomUUID(), subject: hashArtifact({root, relativePath: derivativeFile}),
          projectId: null, classification, mediaType: 'text/markdown', title: 'Derivative',
          inputAssetIds: [], at: at(),
        }));
      };
      const version = readRecord(store, 'item', 'derivative').version;
      assert.throws(() => register('public'), error => error.code === 'INVALID_INPUT' && /privacy/.test(error.message));
      assert.equal(readRecord(store, 'item', 'derivative').version, version);
      assert.equal(register('personal').ok, true, 'same resolved input is allowed without a privacy downgrade');
    }));
  }
}

test('canonical public file aliases still permit a public derivative', () => withWorkspace(({root, store}) => {
  file(root, inputFile, 'Public design');
  file(root, outputFile, 'Public output');
  seedItem(store, {state: 'in-review', producer_actor: builder, acceptance_actor: null,
    context_artifacts: ['.kai\\state\\design.md', '.kai/./state/design.md']});
  bind(root, store, builder, 'artifact.register', 'demo');
  assert.equal(registerArtifact(store, cmd(store, 'artifact.register', 'demo', {
    artifactId: randomUUID(), assetId: randomUUID(), subject: hashArtifact({root, relativePath: outputFile}),
    projectId: null, classification: 'public', mediaType: 'text/markdown',
    title: 'Public aliases', inputAssetIds: [], at: at(),
  })).ok, true);
}));

for (const legacy of [false, true]) {
  test(`mutable owner context cannot invent historical artifact ancestry (${legacy ? 'legacy unknown' : 'captured empty'})`, () => withWorkspace(({root, store}) => {
    file(root, inputFile, 'Original independent brief');
    file(root, outputFile, 'Later derivative');
    seedItem(store, {state: 'in-review', producer_actor: builder, acceptance_actor: null,
      artifact_targets: [inputFile]});
    const artifactId = randomUUID();
    bind(root, store, builder, 'artifact.register', 'demo');
    registerArtifact(store, cmd(store, 'artifact.register', 'demo', {
      artifactId, assetId: randomUUID(), subject: hashArtifact({root, relativePath: inputFile}),
      projectId: null, classification: 'public', mediaType: 'text/markdown',
      title: 'Independent brief', inputAssetIds: [], at: at(),
    }));
    assert.deepEqual(readRecord(store, 'artifact', artifactId).body.input_basis, []);
    if (legacy) store.database.prepare("UPDATE records SET body = json_remove(body, '$.input_basis') WHERE kind='artifact' AND id=?")
      .run(artifactId);
    const update = cmd(store, 'item.update', 'demo', {changes: {context_artifacts: [`artifact:${artifactId}`]}});
    applyCommand(store, update, bind(root, store, builder, 'item.update', 'demo'));
    bind(root, store, builder, 'artifact.register', 'demo');
    const register = () => registerArtifact(store, cmd(store, 'artifact.register', 'demo', {
      artifactId: randomUUID(), assetId: randomUUID(), subject: hashArtifact({root, relativePath: outputFile}),
      projectId: null, classification: 'public', mediaType: 'text/markdown',
      title: 'Later output', inputAssetIds: [], at: at(),
    }));
    if (legacy) assert.throws(register, error => error.code === 'EVIDENCE_GAP' && /unknown.*lineage/i.test(error.message)
      && !/cycle/i.test(error.message));
    else assert.equal(register().ok, true, 'adding an earlier artifact as context is not a historical cycle');
  }));
}

test('unknown legacy lineage is qualified even when current owner context is empty', () => withWorkspace(({root, store}) => {
  file(root, inputFile, 'Old brief');
  file(root, outputFile, 'New output');
  seedItem(store, {state: 'in-review', producer_actor: builder, acceptance_actor: null, artifact_targets: [inputFile]});
  const artifactId = randomUUID();
  bind(root, store, builder, 'artifact.register', 'demo');
  registerArtifact(store, cmd(store, 'artifact.register', 'demo', {
    artifactId, assetId: randomUUID(), subject: hashArtifact({root, relativePath: inputFile}),
    projectId: null, classification: 'public', mediaType: 'text/markdown',
    title: 'Old unknown basis', inputAssetIds: [], at: at(),
  }));
  store.database.prepare("UPDATE records SET body = json_remove(body, '$.input_basis') WHERE kind='artifact' AND id=?").run(artifactId);
  seedItem(store, {id: 'derived', state: 'in-review', producer_actor: builder, acceptance_actor: null,
    context_artifacts: [`artifact:${artifactId}`]});
  bind(root, store, builder, 'artifact.register', 'derived');
  assert.throws(() => registerArtifact(store, cmd(store, 'artifact.register', 'derived', {
    artifactId: randomUUID(), assetId: randomUUID(), subject: hashArtifact({root, relativePath: outputFile}),
    projectId: null, classification: 'public', mediaType: 'text/markdown',
    title: 'Cannot certify missing history', inputAssetIds: [], at: at(),
  })), error => error.code === 'EVIDENCE_GAP' && /unknown.*lineage/i.test(error.message));
}));

test('true captured artifact lineage cycles remain rejected', () => withWorkspace(({root, store}) => {
  file(root, inputFile, 'Cyclic legacy artifact');
  file(root, outputFile, 'New output');
  seedItem(store, {state: 'in-review', producer_actor: builder, acceptance_actor: null, artifact_targets: [inputFile]});
  const artifactId = randomUUID();
  bind(root, store, builder, 'artifact.register', 'demo');
  registerArtifact(store, cmd(store, 'artifact.register', 'demo', {
    artifactId, assetId: randomUUID(), subject: hashArtifact({root, relativePath: inputFile}),
    projectId: null, classification: 'public', mediaType: 'text/markdown',
    title: 'Artifact with corrupt captured ancestry', inputAssetIds: [], at: at(),
  }));
  store.database.prepare("UPDATE records SET body = json_set(body, '$.input_basis', json(?)) WHERE kind='artifact' AND id=?")
    .run(JSON.stringify([{reference: `artifact:${artifactId}`, digest: '0'.repeat(64)}]), artifactId);
  seedItem(store, {id: 'derived', state: 'in-review', producer_actor: builder, acceptance_actor: null,
    context_artifacts: [`artifact:${artifactId}`]});
  bind(root, store, builder, 'artifact.register', 'derived');
  assert.throws(() => registerArtifact(store, cmd(store, 'artifact.register', 'derived', {
    artifactId: randomUUID(), assetId: randomUUID(), subject: hashArtifact({root, relativePath: outputFile}),
    projectId: null, classification: 'public', mediaType: 'text/markdown',
    title: 'Reject a real cycle', inputAssetIds: [], at: at(),
  })), error => error.code === 'EVIDENCE_GAP' && /cycle/.test(error.message));
}));
