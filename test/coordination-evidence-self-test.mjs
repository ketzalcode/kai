import assert from 'node:assert/strict';
import {test} from 'node:test';
import {randomUUID, createHash} from 'node:crypto';
import {
  existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import {dirname, join} from 'node:path';
import {execFileSync} from 'node:child_process';
import {
  bindEvidenceRuntime, assertWorkspacePath, hashArtifact, hashBundle,
  registerArtifact, transitionAsset, registerEvidence, recordReview, recordApproval,
} from '../scripts/lib/coordination-runtime/evidence.mjs';
import {canonicalJson, commandDigest, criteriaRef, validateCommand} from '../scripts/lib/coordination-runtime/contract.mjs';
import {
  completionApproval, requireReviews, requireReleaseEvidence,
} from '../scripts/lib/coordination-runtime/acceptance.mjs';
import {applyCommand} from '../scripts/lib/coordination-runtime/engine.mjs';
import {bindEvidenceTransaction} from '../scripts/lib/coordination-runtime/evidence-context.mjs';
import {readRecord, listRecords} from '../scripts/lib/coordination-runtime/store.mjs';
import {withWorkspace, seedItem, command, authority} from './helpers/coordination-runtime-fixture.mjs';

const builder = {role: 'eng-builder-software', runId: 'producer-run'};
const reviewer = {role: 'eng-reviewer-code', runId: 'independent-review'};
const operator = {role: 'operator', runId: 'human-session'};
const lead = {role: 'eng-lead-architecture', runId: 'lead-session'};
const runDirectory = '.kai/runs/review/2026-09-16/01-evidence-demo';
const source = `${runDirectory}/mock.html`;
const workingTarget = '.kai/state/initiatives/demo-initiative/artifacts/mock.html';
const actions = ['artifact.register', 'asset.transition', 'evidence.register', 'review.record', 'approval.record'];
const code = expected => error => error?.code === expected;
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
function file(root, path, bytes = '<h1>First</h1>') {
  const absolute = join(root, path);
  mkdirSync(dirname(absolute), {recursive: true});
  writeFileSync(absolute, bytes);
  return absolute;
}
function txView(store) {
  return bindEvidenceTransaction(store, {
    list: (kind, itemId) => listRecords(store, {kind, itemId}),
    get: (kind, id) => readRecord(store, kind, id),
  });
}
function runtime(root, store, actor = builder, extra = {}) {
  const item = readRecord(store, 'item', 'demo');
  const auth = authority(actor, actions, {version: item.version});
  bindEvidenceRuntime(store, {
    root, authority: auth,
    runs: [{actor, directory: runDirectory}],
    ...extra,
  });
  return auth;
}
function cmd(store, kind, payload, actor = builder, extras = {}) {
  return command(kind, {
    actor, expectedVersion: readRecord(store, 'item', 'demo').version, payload, ...extras,
  });
}
function setup(root, store, overrides = {}) {
  file(root, source);
  file(root, workingTarget);
  seedItem(store, {
    state: 'in-review', acceptance_actor: null,
    change_ref: {kind: 'sha256', digest: digest('<h1>First</h1>'), path: source},
    ...overrides,
    artifact_targets: [workingTarget, ...(overrides.artifact_targets ?? [])],
  });
  runtime(root, store);
}
function artifactCommand(store, extra = {}) {
  return cmd(store, 'artifact.register', {
    artifactId: randomUUID(), assetId: randomUUID(),
    subject: readRecord(store, 'item', 'demo').body.change_ref,
    projectId: null, classification: 'internal', mediaType: 'text/html',
    title: 'Mock', inputAssetIds: [], at: new Date().toISOString(), ...extra,
  });
}
function register(root, store, extra = {}) {
  runtime(root, store);
  const c = artifactCommand(store, extra);
  assert.equal(registerArtifact(store, c).ok, true);
  return c.payload;
}
function verdict(store, kind, refs, overrides = {}, actor = reviewer) {
  const item = readRecord(store, 'item', 'demo').body;
  const common = {
    schema_version: 1, item_id: 'demo', subject: item.change_ref,
    criteria_ref: criteriaRef(item), supersedes: [], evidence_refs: refs,
    created_at: new Date().toISOString(),
  };
  const body = kind === 'review.record' ? {
    ...common, review_id: randomUUID(), reviewer: actor, kind: 'code',
    criteria: ['The commissioned behavior works'], verdict: 'approved', finding_refs: [],
    ...overrides,
  } : {
    ...common, approval_id: randomUUID(), authority: actor, kind: 'completion',
    decision: 'approved', deployment: null, recovery: null, reason: 'Verified exact revision',
    ...overrides,
  };
  return cmd(store, kind, {body}, actor);
}
function accept(root, store, artifactId) {
  const auth = runtime(root, store, reviewer);
  const c = verdict(store, 'approval.record', [`artifact:${artifactId}`]);
  assert.equal(recordApproval(store, c, auth).ok, true);
  return c.payload.body.approval_id;
}
function assetCommand(store, assetId, changes = {}, actor = reviewer) {
  return cmd(store, 'asset.transition', {
    assetId, disposition: 'working', validity: 'provisional',
    target: changes.disposition && changes.disposition !== 'working' ? null : workingTarget,
    approvalId: null, supersedes: null, reason: 'Selected for durable work',
    at: new Date().toISOString(), ...changes,
  }, actor);
}
function captureFor(c, changes = {}) {
  return {
    command_digest: commandDigest(c),
    source: 'host-command', reference: 'host:tool-result-1',
    actor: c.actor, captured_at: c.payload.body.created_at,
    command: ['node', 'test.mjs'], exit_code: 0,
    checks: ['behavior'], classification: 'internal', ...changes,
  };
}
function evidenceCommand(store, artifactId, overrides = {}, tier = 'observed', actor = builder) {
  const item = readRecord(store, 'item', 'demo').body;
  return cmd(store, 'evidence.register', {tier, body: {
    schema_version: 1, evidence_id: randomUUID(), item_id: 'demo',
    kind: 'dod-dimension', subject: item.change_ref, criteria_ref: criteriaRef(item),
    supersedes: [], dimension: 'verified', outcome: 'clear',
    evidence_refs: [`artifact:${artifactId}`], reason: null, data: {},
    created_at: new Date().toISOString(), ...overrides,
  }}, actor);
}
function operatorProof(c, overrides = {}) {
  const b = c.payload.body;
  return {
    source: 'host-interaction', reference: 'host:user-turn-2', attributed_to: 'Operator',
    captured_at: b.created_at, item_id: b.item_id, subject: b.subject,
    criteria_ref: b.criteria_ref, kind: b.kind, decision: b.decision,
    deployment: b.deployment, recovery: b.recovery, ...overrides,
  };
}

function complete(store) {
  const c = cmd(store, 'item.transition', {
    to: 'completed', at: new Date().toISOString(), reason: 'Accept current retained evidence',
  }, reviewer);
  return applyCommand(store, c, authority(reviewer, 'item.transition', {version: c.expectedVersion}));
}
function makeCurrent(root, store, a) {
  const approvalId = accept(root, store, a.artifactId);
  transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
  transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId}), runtime(root, store, reviewer));
  return approvalId;
}
function publicWorkspace(root) {
  const manifest = JSON.parse(readFileSync(join(root, '.kai', 'manifest.json')));
  manifest.projects = [{id: 'app', path: '.', publication_root: 'docs/kai'}];
  file(root, '.kai/manifest.json', JSON.stringify(manifest));
  file(root, 'docs/kai/mock.html');
  return 'project:app:docs/kai/mock.html';
}
function publish(root, store) {
  const target = publicWorkspace(root);
  setup(root, store, {artifact_targets: [target, 'project:app:docs/kai/other.html']});
  const a = register(root, store, {classification: 'public'});
  makeCurrent(root, store, a);
  transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'published', validity: 'current', target}),
    runtime(root, store, reviewer));
  return {...a, target};
}

for (const damage of ['source changed', 'source missing', 'snapshot changed', 'snapshot missing', 'manifest changed']) {
  test(`fix1 F1 engine completion refuses ${damage} after positive acceptance`, async () => {
    await withWorkspace(({root, store}) => {
      setup(root, store, {review_requirements: [{role: reviewer.role, kind: 'code'}]});
      const a = register(root, store);
      recordReview(store, verdict(store, 'review.record', [`artifact:${a.artifactId}`]), runtime(root, store, reviewer));
      const approvalId = accept(root, store, a.artifactId);
      const artifact = readRecord(store, 'artifact', a.artifactId).body;
      const path = damage.startsWith('source') ? source : damage.startsWith('snapshot')
        ? artifact.snapshots[0].snapshot_path : artifact.manifest_path;
      if (damage.endsWith('missing')) rmSync(join(root, path));
      else file(root, path, 'changed after approval');
      const version = readRecord(store, 'item', 'demo').version;
      assert.throws(() => complete(store), code('EVIDENCE_GAP'));
      assert.equal(readRecord(store, 'item', 'demo').version, version);
      assert.equal(readRecord(store, 'approval', approvalId).body.decision, 'approved');
    });
  });
}

for (const consumer of ['completion', 'currentness', 'publication', 'derived input']) {
  for (const support of ['approval', 'review']) {
    test(`fix1 F1 ${consumer} rechecks effective transitive ${support} evidence`, async () => {
      await withWorkspace(({root, store}) => {
        const target = publicWorkspace(root);
        setup(root, store, {artifact_targets: [target], review_requirements: [{role: reviewer.role, kind: 'code'}]});
        const a = register(root, store, {classification: 'public'});
        const observed = evidenceCommand(store, a.artifactId);
        runtime(root, store, builder, {verifyCapture: c => captureFor(c, {classification: 'public'})});
        registerEvidence(store, observed, {});
        const indirect = evidenceCommand(store, a.artifactId, {
          dimension: 'documented', evidence_refs: [`evidence:${observed.payload.body.evidence_id}`],
        });
        runtime(root, store, builder, {verifyCapture: c => captureFor(c, {classification: 'public'})});
        registerEvidence(store, indirect, {});
        const refs = [`artifact:${a.artifactId}`, `evidence:${indirect.payload.body.evidence_id}`];
        runtime(root, store, reviewer);
        recordReview(store, verdict(store, 'review.record', support === 'review' ? refs : refs.slice(0, 1)));
        const approval = verdict(store, 'approval.record', support === 'approval' ? refs : refs.slice(0, 1));
        recordApproval(store, approval, runtime(root, store, reviewer));
        const approvalId = approval.payload.body.approval_id;
        transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
        if (['publication', 'derived input'].includes(consumer)) {
          transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId}), runtime(root, store, reviewer));
        }
        let derived;
        let derivedApproval;
        if (consumer === 'derived input') {
          derived = register(root, store, {classification: 'public', inputAssetIds: [a.assetId]});
          derivedApproval = accept(root, store, derived.artifactId);
          transitionAsset(store, assetCommand(store, derived.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
        }
        runtime(root, store);
        registerEvidence(store, evidenceCommand(store, a.artifactId, {
          outcome: 'gap', reason: 'The earlier check was incomplete', supersedes: [observed.payload.body.evidence_id],
        }, 'declared'), {});
        const action = () => consumer === 'completion' ? complete(store)
          : transitionAsset(store, assetCommand(store, derived?.assetId ?? a.assetId, {
            validity: 'current', approvalId: derivedApproval ?? approvalId,
            ...(consumer === 'publication' ? {disposition: 'published', target} : {}),
          }), runtime(root, store, reviewer));
        assert.throws(action, code('EVIDENCE_GAP'));
        assert.equal(readRecord(store, 'approval', approvalId).body.decision, 'approved');
      });
    });
  }
}

for (const placement of ['confidential draft', 'personal archive', 'public provisional draft']) {
  test(`fix1 F2 public placement refuses ${placement}`, async () => {
    await withWorkspace(({root, store}) => {
      const target = publicWorkspace(root);
      const personal = '.kai/personal/operator/note.html';
      file(root, personal);
      setup(root, store, {artifact_targets: [target, personal]});
      const a = register(root, store, {
        classification: placement.startsWith('personal') ? 'personal'
          : placement.startsWith('confidential') ? 'confidential' : 'public',
        ...(placement.startsWith('personal') ? {subject: hashArtifact({root, relativePath: personal})} : {}),
      });
      assert.throws(() => transitionAsset(store, assetCommand(store, a.assetId, {
        disposition: placement.startsWith('personal') ? 'archived' : 'draft', target,
      }), runtime(root, store, reviewer)), code('INVALID_INPUT'));
      assert.equal(readRecord(store, 'asset', a.assetId).body.target, a.subject.path);
    });
  });
}

for (const consumer of ['currentness', 'completion', 'derived input']) {
  for (const damage of ['changed', 'missing']) {
    test(`fix1 F3 ${consumer} refuses ${damage} unchanged canonical target`, async () => {
      await withWorkspace(({root, store}) => {
        const path = '.kai/state/initiatives/demo-initiative/artifacts/derived.html';
        setup(root, store, {artifact_targets: [path]});
        const a = register(root, store);
        const approvalId = makeCurrent(root, store, a);
        let derived;
        let derivedApproval;
        if (consumer === 'derived input') {
          derived = register(root, store, {inputAssetIds: [a.assetId]});
          derivedApproval = accept(root, store, derived.artifactId);
          transitionAsset(store, assetCommand(store, derived.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
          file(root, path);
          derived.target = path;
        }
        if (damage === 'missing') rmSync(join(root, workingTarget));
        else file(root, workingTarget, 'changed canonical bytes');
        assert.throws(() => consumer === 'completion' ? complete(store)
          : transitionAsset(store, assetCommand(store, derived?.assetId ?? a.assetId, {
            validity: 'current', approvalId: derivedApproval ?? approvalId, target: derived?.target ?? null,
          }), runtime(root, store, reviewer)), code('EVIDENCE_GAP'));
      });
    });
  }
}

test('fix1 F3 canonical path remains protected after published then archived history', async () => {
  await withWorkspace(({root, store}) => {
    const a = publish(root, store);
    transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'archived', validity: 'current'}),
      runtime(root, store, reviewer));
    file(root, 'docs/kai/other.html');
    assert.throws(() => transitionAsset(store, assetCommand(store, a.assetId, {
      disposition: 'archived', validity: 'current', target: 'project:app:docs/kai/other.html',
    }), runtime(root, store, reviewer)), code('INVALID_INPUT'));
    assert.equal(readRecord(store, 'asset', a.assetId).body.target, a.target);
  });
});

for (const successorValidity of ['provisional', 'stale']) {
  test(`fix1 F4 ${successorValidity} accepted successor cannot supersede`, async () => {
    await withWorkspace(({root, store}) => {
      setup(root, store);
      const old = register(root, store);
      makeCurrent(root, store, old);
      const next = register(root, store);
      const approvalId = accept(root, store, next.artifactId);
      assert.throws(() => transitionAsset(store, assetCommand(store, next.assetId, {
        disposition: 'draft', validity: successorValidity, approvalId, supersedes: old.assetId,
      }), runtime(root, store, reviewer)), code('EVIDENCE_GAP'));
      assert.equal(readRecord(store, 'asset', old.assetId).body.superseded_by, null);
      assert.equal(readRecord(store, 'asset', next.assetId).body.supersedes, null);
    });
  });
}

test('fix1 F5 cannot attach completion acceptance while discarding current scratch output', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    const a = register(root, store);
    const approvalId = accept(root, store, a.artifactId);
    assert.throws(() => transitionAsset(store, assetCommand(store, a.assetId, {
      disposition: 'discarded', validity: 'current', approvalId,
    }), runtime(root, store, reviewer)), code('INVALID_INPUT'));
    assert.equal(readRecord(store, 'asset', a.assetId).body.completion_approval_id, null);
  });
});

for (const validity of ['stale', 'invalidated', 'retired']) {
  test(`fix1 F6 published output can become ${validity} after source and target loss`, async () => {
    await withWorkspace(({root, store}) => {
      const a = publish(root, store);
      complete(store);
      const artifact = readRecord(store, 'artifact', a.artifactId).body;
      rmSync(join(root, source));
      rmSync(join(root, artifact.snapshots[0].snapshot_path));
      rmSync(join(root, 'docs/kai/mock.html'));
      const c = assetCommand(store, a.assetId, {disposition: 'published', validity, reason: 'Evidence was lost'}, builder);
      assert.equal(transitionAsset(store, c, runtime(root, store, builder)).ok, true);
      const asset = readRecord(store, 'asset', a.assetId).body;
      assert.equal(asset.validity, validity);
      assert.equal(asset.disposition, 'published');
      assert.equal(asset.target, a.target);
      assert.equal(readRecord(store, 'item', 'demo').body.state, 'completed');
      assert.equal(readRecord(store, 'approval', asset.completion_approval_id).body.decision, 'approved');
    });
  });
}

test('fix1 F7 waiver excludes exact artifact producer outside item producing history', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    runtime(root, store, reviewer);
    const a = artifactCommand(store);
    a.actor = reviewer;
    registerArtifact(store, a);
    runtime(root, store, reviewer, {verifyCapture: captureFor});
    assert.throws(() => registerEvidence(store, evidenceCommand(store, a.payload.artifactId, {
      outcome: 'waived', reason: 'Not applicable',
    }, 'observed', reviewer), {}), code('AUTHORITY_REQUIRED'));
  });
});

test('fix1 F8 same immutable Git subject cannot be relabeled public across project aliases', async () => {
  await withWorkspace(({root, store}) => {
    const project = join(root, 'project');
    mkdirSync(project);
    const git = args => execFileSync('git', ['-C', project, ...args], {encoding: 'utf8'}).trim();
    git(['init', '--quiet']);
    file(project, 'a.txt', 'private code');
    git(['add', 'a.txt']);
    git(['-c', 'user.name=Evidence Test', '-c', 'user.email=evidence@example.invalid',
      '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture']);
    const head = git(['rev-parse', 'HEAD']);
    const manifest = JSON.parse(readFileSync(join(root, '.kai', 'manifest.json')));
    manifest.projects = ['app', 'alias'].map(id => ({id, path: 'project', publication_root: 'docs/kai'}));
    file(root, '.kai/manifest.json', JSON.stringify(manifest));
    setup(root, store, {change_ref: {kind: 'git', base: head, head}});
    register(root, store, {projectId: 'app', classification: 'confidential'});
    runtime(root, store);
    assert.throws(() => registerArtifact(store, artifactCommand(store, {
      projectId: 'alias', classification: 'public',
    })), code('INVALID_INPUT'));
  });
});

for (const outcome of ['gap', 'failed']) {
  test(`fix1 minor negative review can cite registered ${outcome} evidence without permitting positive acceptance`, async () => {
    await withWorkspace(({root, store}) => {
      setup(root, store, {review_requirements: [{role: reviewer.role, kind: 'code'}]});
      const a = register(root, store);
      const e = evidenceCommand(store, a.artifactId, {
        ...(outcome === 'failed' ? {
          kind: 'production-verification', dimension: null,
          data: {environment: 'prod', deployment_id: 'd-negative', checks: ['behavior']},
        } : {}),
        outcome, reason: 'Observed problem',
      }, 'declared');
      if (outcome === 'failed') {
        for (const kind of ['operator-deploy-start', 'operator-deploy-complete']) {
          const approval = verdict(store, 'approval.record', [`artifact:${a.artifactId}`], {
            kind, deployment: {environment: 'prod', environment_class: 'production', deployment_id: 'd-negative'},
          }, operator);
          recordApproval(store, approval, runtime(root, store, operator, {verifyOperatorDecision: operatorProof}));
        }
        e.expectedVersion = readRecord(store, 'item', 'demo').version;
      }
      runtime(root, store);
      registerEvidence(store, e, {});
      const refs = [`evidence:${e.payload.body.evidence_id}`];
      runtime(root, store, reviewer);
      assert.equal(recordReview(store, verdict(store, 'review.record', refs, {
        verdict: 'changes-requested', finding_refs: refs,
      })).ok, true);
      runtime(root, store, reviewer);
      assert.throws(() => recordReview(store, verdict(store, 'review.record', refs)), code('EVIDENCE_GAP'));
      assert.throws(() => recordApproval(store, verdict(store, 'approval.record', refs),
        runtime(root, store, reviewer)), code('EVIDENCE_GAP'));
      assert.equal(readRecord(store, 'evidence', e.payload.body.evidence_id).body.outcome, outcome);
    });
  });
}

for (const verifier of ['capture', 'operator']) {
  test(`fix1 callback ${verifier} preserves unexpected trusted verifier failure and cause`, async () => {
    await withWorkspace(({root, store}) => {
      setup(root, store);
      const a = register(root, store);
      const cause = new Error('host storage unavailable');
      const failure = new Error('trusted verifier failed', {cause});
      const broken = () => { throw failure; };
      const c = verifier === 'capture' ? evidenceCommand(store, a.artifactId)
        : verdict(store, 'approval.record', [`artifact:${a.artifactId}`], {
          kind: 'operator-deploy-start',
          deployment: {environment: 'prod', environment_class: 'production', deployment_id: 'd1'},
        }, operator);
      const auth = runtime(root, store, c.actor, verifier === 'capture'
        ? {verifyCapture: broken} : {verifyOperatorDecision: broken});
      assert.throws(() => verifier === 'capture' ? registerEvidence(store, c, {})
        : recordApproval(store, c, auth), error => error === failure && error.cause === cause);
      assert.equal(readRecord(store, 'item', 'demo').version, c.expectedVersion);
    });
  });
}

test('fix1 followup F1 a concurrent effective gap cannot hide behind cited positive support', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    const a = register(root, store);
    runtime(root, store, builder, {verifyCapture: captureFor});
    const clear = evidenceCommand(store, a.artifactId);
    registerEvidence(store, clear, {});
    const approval = verdict(store, 'approval.record', [`artifact:${a.artifactId}`, `evidence:${clear.payload.body.evidence_id}`]);
    recordApproval(store, approval, runtime(root, store, reviewer));
    runtime(root, store);
    registerEvidence(store, evidenceCommand(store, a.artifactId, {
      outcome: 'gap', reason: 'A competing observation is unresolved',
    }, 'declared'), {});
    assert.throws(() => complete(store), code('EVIDENCE_GAP'));
  });
});

test('fix1 followup F7 waiver cannot use supporting artifacts made by its own run', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    register(root, store);
    const path = `${runDirectory}/support.txt`;
    file(root, path, 'my supporting output');
    const supporting = artifactCommand(store, {subject: hashArtifact({root, relativePath: path})});
    supporting.actor = reviewer;
    runtime(root, store, reviewer);
    registerArtifact(store, supporting);
    runtime(root, store, reviewer, {verifyCapture: captureFor});
    assert.throws(() => registerEvidence(store, evidenceCommand(store, supporting.payload.artifactId, {
      outcome: 'waived', reason: 'Waiving my own supporting work',
    }, 'observed', reviewer), {}), code('AUTHORITY_REQUIRED'));
  });
});

test('fix1 followup F3 accepted public placement keeps its canonical path even without published disposition', async () => {
  await withWorkspace(({root, store}) => {
    const target = publicWorkspace(root);
    setup(root, store, {artifact_targets: [target, 'project:app:docs/kai/other.html']});
    const a = register(root, store, {classification: 'public'});
    const approvalId = accept(root, store, a.artifactId);
    transitionAsset(store, assetCommand(store, a.assetId, {
      disposition: 'draft', validity: 'current', approvalId, target,
    }), runtime(root, store, reviewer));
    file(root, 'docs/kai/other.html');
    assert.throws(() => transitionAsset(store, assetCommand(store, a.assetId, {
      disposition: 'draft', validity: 'current', target: 'project:app:docs/kai/other.html',
    }), runtime(root, store, reviewer)), code('INVALID_INPUT'));
  });
});

test('exact bytes change hashes; canonical bundles reject duplicates and case aliases', async () => {
  await withWorkspace(({root}) => {
    file(root, source, 'abc');
    const before = hashArtifact({root, relativePath: source});
    assert.equal(before.digest, 'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
    file(root, source, 'abcd');
    assert.notEqual(hashArtifact({root, relativePath: source}).digest, before.digest);
    const other = `${runDirectory}/second.txt`;
    file(root, other, 'second');
    assert.deepEqual(hashBundle({root, paths: [other, source]}), hashBundle({root, paths: [source, other]}));
    assert.throws(() => hashBundle({root, paths: [source, source]}), code('INVALID_INPUT'));
    assert.throws(() => hashBundle({root, paths: [source, source.toUpperCase()]}), code('INVALID_INPUT'));
    assert.throws(() => hashBundle({root, paths: []}), code('INVALID_INPUT'));
  });
});

test('paths reject absolute, traversal, junctions, nested Git and public/private escapes', async () => {
  await withWorkspace(({root}) => {
    file(root, source);
    assert.equal(assertWorkspacePath(root, source), join(root, source));
    for (const path of ['../outside', 'C:\\outside', 'C:outside', '\\\\server\\share', '/absolute',
      '.kai/runs/../state/x', '.kai/runs/a:stream', 'docs/public.html', 'project:missing:docs/x']) {
      assert.throws(() => assertWorkspacePath(root, path), code('INVALID_INPUT'), path);
    }
    const outside = join(root, 'outside');
    mkdirSync(outside);
    symlinkSync(outside, join(root, '.kai', 'runs', 'escape'), 'junction');
    assert.throws(() => assertWorkspacePath(root, '.kai/runs/escape/x'), code('INVALID_INPUT'));
    rmSync(join(root, '.kai', 'runs', 'escape'));
    mkdirSync(join(root, '.kai', 'runs', 'nested', '.git'), {recursive: true});
    assert.throws(() => assertWorkspacePath(root, source), code('INVALID_INPUT'));
  });
});

test('registration persists authorized item-bound records, exact snapshots and replay receipts', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    const c = artifactCommand(store);
    const receipt = registerArtifact(store, c);
    assert.equal(receipt.ok, true);
    assert.equal(receipt.recordVersion, 2);
    assert.deepEqual(registerArtifact(store, c), receipt);
    const a = readRecord(store, 'artifact', c.payload.artifactId).body;
    assert.equal(a.producer.runId, builder.runId);
    assert.equal(readFileSync(join(root, a.snapshots[0].snapshot_path), 'utf8'), '<h1>First</h1>');
    assert.equal(readFileSync(join(root, source), 'utf8'), '<h1>First</h1>');
    assert.equal(readRecord(store, 'asset', c.payload.assetId).body.validity, 'provisional');
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'in-review');
    assert.equal(store.database.prepare('SELECT COUNT(*) n FROM events').get().n, 1);
    assert.throws(() => registerArtifact(store, {...c, payload: {...c.payload, title: 'different'}}),
      code('OPERATION_CONFLICT'));
  });
});

test('missing/changed originals, unauthorized registration and cross-workspace binding retain orphan outputs', async () => {
  await withWorkspace(async ({root, store}) => {
    setup(root, store);
    const c = artifactCommand(store);
    file(root, source, 'changed');
    assert.throws(() => registerArtifact(store, c), code('EVIDENCE_GAP'));
    assert.equal(readFileSync(join(root, source), 'utf8'), 'changed');
    assert.equal(readRecord(store, 'artifact', c.payload.artifactId), null);
    file(root, source);
    runtime(root, store, builder, {authority: {roles: [builder.role], grants: []}});
    assert.throws(() => registerArtifact(store, c), code('AUTHORITY_REQUIRED'));
    assert.equal(existsSync(join(root, source)), true);
    rmSync(join(root, source));
    runtime(root, store);
    assert.throws(() => registerArtifact(store, c), code('EVIDENCE_GAP'));
    await withWorkspace(({root: other}) => {
      assert.throws(() => runtime(other, store), code('INVALID_INPUT'));
    });
  });
});

test('bundles retain exact sorted manifest and reject later snapshot or manifest damage', async () => {
  await withWorkspace(({root, store}) => {
    const other = `${runDirectory}/b.bin`;
    file(root, source);
    file(root, other, Buffer.from([0, 255, 10]));
    setup(root, store, {change_ref: hashBundle({root, paths: [other, source]})});
    const a = register(root, store);
    const record = readRecord(store, 'artifact', a.artifactId).body;
    assert.equal(record.snapshots.length, 2);
    assert.ok(existsSync(join(root, record.manifest_path)));
    file(root, record.manifest_path, 'tampered');
    runtime(root, store, reviewer);
    assert.throws(() => recordReview(store, verdict(store, 'review.record', [`artifact:${a.artifactId}`])),
      code('EVIDENCE_GAP'));
  });
});

test('Git evidence resolves full immutable objects only within declared selected project', async () => {
  await withWorkspace(({root, store}) => {
    const project = join(root, 'project');
    mkdirSync(project);
    const git = args => execFileSync('git', ['-C', project, ...args], {encoding: 'utf8'}).trim();
    git(['init', '--quiet']);
    file(project, 'a.txt', 'a');
    git(['add', 'a.txt']);
    git(['-c', 'user.name=Evidence Test', '-c', 'user.email=evidence@example.invalid',
      '-c', 'commit.gpgsign=false', 'commit', '--quiet', '-m', 'fixture']);
    const head = git(['rev-parse', 'HEAD']);
    const manifest = JSON.parse(readFileSync(join(root, '.kai', 'manifest.json')));
    manifest.projects = [{id: 'app', path: 'project', publication_root: 'docs/kai'}];
    file(root, '.kai/manifest.json', JSON.stringify(manifest));
    setup(root, store, {change_ref: {kind: 'git', base: head, head}});
    const c = artifactCommand(store, {projectId: 'app'});
    assert.equal(registerArtifact(store, c).ok, true);
    runtime(root, store);
    assert.throws(() => registerArtifact(store, artifactCommand(store, {projectId: 'unknown'})),
      code('INVALID_INPUT'));
    assert.throws(() => registerArtifact(store, artifactCommand(store, {
      projectId: 'app', subject: {kind: 'git', base: head, head: 'f'.repeat(40)},
    })), code('EVIDENCE_GAP'));
    assert.throws(() => registerArtifact(store, artifactCommand(store, {
      projectId: 'app', subject: {kind: 'git', base: head.slice(0, 7), head: head.slice(0, 7)},
    })), code('INVALID_INPUT'));
    file(root, workingTarget, canonicalJson({project_id: 'app', subject: c.payload.subject}));
    const approvalId = accept(root, store, c.payload.artifactId);
    transitionAsset(store, assetCommand(store, c.payload.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
    transitionAsset(store, assetCommand(store, c.payload.assetId, {validity: 'current', approvalId}), runtime(root, store, reviewer));
    assert.equal(readRecord(store, 'asset', c.payload.assetId).body.validity, 'current');
  });
});

test('reviews are persisted independent current-subject/current-criteria verdicts, not caller booleans', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {review_requirements: [{role: reviewer.role, kind: 'code'}]});
    const a = register(root, store);
    runtime(root, store, reviewer);
    const c = verdict(store, 'review.record', [`artifact:${a.artifactId}`]);
    assert.equal(recordReview(store, c).ok, true);
    assert.equal(readRecord(store, 'review', c.payload.body.review_id).body.criteria_ref,
      criteriaRef(readRecord(store, 'item', 'demo').body));
    assert.doesNotThrow(() => requireReviews(txView(store), readRecord(store, 'item', 'demo')));
    runtime(root, store, reviewer);
    assert.throws(() => recordReview(store, verdict(store, 'review.record', [`artifact:${a.artifactId}`],
      {criteria_ref: 'f'.repeat(64)})), code('EVIDENCE_GAP'));
    assert.throws(() => recordReview(store, verdict(store, 'review.record', [`artifact:${a.artifactId}`],
      {subject: {...c.payload.body.subject, digest: 'a'.repeat(64)}})), code('EVIDENCE_GAP'));
    const self = {...reviewer, runId: builder.runId};
    runtime(root, store, self);
    assert.throws(() => recordReview(store, verdict(store, 'review.record', [`artifact:${a.artifactId}`], {}, self)),
      code('AUTHORITY_REQUIRED'));
    const noAuth = {roles: [reviewer.role], grants: []};
    runtime(root, store, reviewer, {authority: noAuth});
    assert.throws(() => recordReview(store, verdict(store, 'review.record', [`artifact:${a.artifactId}`])),
      code('AUTHORITY_REQUIRED'));
    assert.throws(() => validateCommand({...c, payload: {...c.payload, approved: true}}), code('INVALID_INPUT'));
  });
});

test('old producer history cannot approve and missing snapshots cannot satisfy acceptance', async () => {
  await withWorkspace(({root, store}) => {
    const old = {...reviewer, runId: 'old-producer'};
    setup(root, store, {producing_actors: [builder, old]});
    const a = register(root, store);
    const auth = runtime(root, store, old);
    assert.throws(() => recordApproval(store, verdict(store, 'approval.record', [`artifact:${a.artifactId}`], {}, old), auth),
      code('AUTHORITY_REQUIRED'));
    const record = readRecord(store, 'artifact', a.artifactId);
    rmSync(join(root, record.body.snapshots[0].snapshot_path));
    const independent = runtime(root, store, reviewer);
    assert.throws(() => recordApproval(store, verdict(store, 'approval.record', [`artifact:${a.artifactId}`]), independent),
      code('EVIDENCE_GAP'));
  });
});

test('negative review/approval history requires explicit effective supersession without forks', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {review_requirements: [{role: reviewer.role, kind: 'code'}]});
    const a = register(root, store);
    const refs = [`artifact:${a.artifactId}`];
    runtime(root, store, reviewer);
    const bad = verdict(store, 'review.record', refs, {verdict: 'changes-requested'});
    recordReview(store, bad);
    runtime(root, store, reviewer);
    recordReview(store, verdict(store, 'review.record', refs));
    assert.throws(() => requireReviews(txView(store), readRecord(store, 'item', 'demo')), code('EVIDENCE_GAP'));
    runtime(root, store, reviewer);
    recordReview(store, verdict(store, 'review.record', refs, {supersedes: [bad.payload.body.review_id]}));
    assert.doesNotThrow(() => requireReviews(txView(store), readRecord(store, 'item', 'demo')));
    runtime(root, store, reviewer);
    assert.throws(() => recordReview(store, verdict(store, 'review.record', refs,
      {supersedes: [bad.payload.body.review_id]})), code('EVIDENCE_GAP'));
    const rejected = verdict(store, 'approval.record', refs, {decision: 'rejected'});
    recordApproval(store, rejected, runtime(root, store, reviewer));
    accept(root, store, a.artifactId);
    assert.throws(() => completionApproval(txView(store), readRecord(store, 'item', 'demo')), code('EVIDENCE_GAP'));
    const replacement = verdict(store, 'approval.record', refs, {supersedes: [rejected.payload.body.approval_id]});
    recordApproval(store, replacement, runtime(root, store, reviewer));
    assert.doesNotThrow(() => completionApproval(txView(store), readRecord(store, 'item', 'demo')));
  });
});

test('observed evidence needs trusted capture, successful complete results, privacy and exact coverage', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    const a = register(root, store);
    let c = evidenceCommand(store, a.artifactId);
    runtime(root, store);
    assert.throws(() => registerEvidence(store, c, {source: 'host-command', approved: true}),
      code('INVALID_INPUT'));
    for (const bad of [{exit_code: 1}, {checks: []}, {classification: 'confidential'}, {actor: reviewer}]) {
      runtime(root, store, builder, {verifyCapture: claim => captureFor(claim, bad)});
      assert.throws(() => registerEvidence(store, c, {}), code('EVIDENCE_GAP'));
    }
    runtime(root, store, builder, {verifyCapture: captureFor});
    assert.equal(registerEvidence(store, c, {}).ok, true);
    assert.equal(readRecord(store, 'evidence', c.payload.body.evidence_id).body.provenance.tier, 'observed');
    c = evidenceCommand(store, a.artifactId, {}, 'declared');
    runtime(root, store);
    assert.throws(() => registerEvidence(store, c, {source: 'agent-paste', text: 'passed'}), code('EVIDENCE_GAP'));
    c = evidenceCommand(store, a.artifactId, {outcome: 'gap', reason: 'Not executed'}, 'declared');
    assert.equal(registerEvidence(store, c, {source: 'agent-declaration'}).ok, true);
    assert.throws(() => requireReleaseEvidence(txView(store), readRecord(store, 'item', 'demo')), code('EVIDENCE_GAP'));
  });
});

test('lease and recovery guards cannot be bypassed by bound grants', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {state: 'ready', next_role: builder.role});
    const g = cmd(store, 'item.grant', {
      holder: builder, actions: ['artifact.register', 'evidence.register'],
      acquiredAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(),
    }, lead);
    applyCommand(store, g, authority(lead, 'item.grant'));
    const token = readRecord(store, 'item', 'demo').body.lease.token;
    runtime(root, store, builder, {authority: {roles: [builder.role], grants: []}});
    const c = artifactCommand(store);
    assert.throws(() => registerArtifact(store, c), code('LEASE_CONFLICT'));
    assert.equal(registerArtifact(store, {...c, leaseToken: token}).ok, true);
    const r = verdict(store, 'review.record', [`artifact:${c.payload.artifactId}`]);
    runtime(root, store, reviewer);
    assert.throws(() => recordReview(store, r), code('LEASE_CONFLICT'));
  });
});

test('fake operator authority is rejected; attributed supplied approval binds exact deployment context', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    const a = register(root, store);
    const deployment = {environment: 'production-west', environment_class: 'production', deployment_id: 'deploy-1'};
    const c = verdict(store, 'approval.record', [`artifact:${a.artifactId}`],
      {kind: 'operator-deploy-start', deployment}, operator);
    let auth = runtime(root, store, operator);
    assert.throws(() => recordApproval(store, c, auth), code('AUTHORITY_REQUIRED'));
    auth = runtime(root, store, operator, {verifyOperatorDecision: () => true});
    assert.throws(() => recordApproval(store, c, auth), code('AUTHORITY_REQUIRED'));
    auth = runtime(root, store, operator, {verifyOperatorDecision: x => operatorProof(x, {criteria_ref: 'f'.repeat(64)})});
    assert.throws(() => recordApproval(store, c, auth), code('AUTHORITY_REQUIRED'));
    auth = runtime(root, store, operator, {verifyOperatorDecision: x => operatorProof(x, {source: 'attributed-supplied'})});
    assert.equal(recordApproval(store, c, auth).ok, true);
    const conflicting = verdict(store, 'approval.record', [`artifact:${a.artifactId}`], {
      kind: 'operator-deploy-complete', deployment: {...deployment, deployment_id: 'deploy-other'},
    }, operator);
    auth = runtime(root, store, operator, {verifyOperatorDecision: operatorProof});
    assert.throws(() => recordApproval(store, conflicting, auth), code('AUTHORITY_REQUIRED'));
  });
});

test('asset acceptance stays provisional for incomplete inputs; aged assets never reopen completed items', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {state: 'completed', acceptance_actor: reviewer, validity_owner: reviewer.role});
    const input = register(root, store);
    const a = register(root, store, {inputAssetIds: [input.assetId]});
    const approvalId = accept(root, store, a.artifactId);
    let auth = runtime(root, store, reviewer);
    transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'draft'}), auth);
    auth = runtime(root, store, reviewer);
    transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId}), auth);
    assert.equal(readRecord(store, 'asset', a.assetId).body.validity, 'provisional');
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'completed');
    const ready = register(root, store);
    const accepted = accept(root, store, ready.artifactId);
    transitionAsset(store, assetCommand(store, ready.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
    transitionAsset(store, assetCommand(store, ready.assetId, {validity: 'current', approvalId: accepted}), runtime(root, store, reviewer));
    transitionAsset(store, assetCommand(store, ready.assetId, {validity: 'stale'}), runtime(root, store, reviewer));
    assert.equal(readRecord(store, 'asset', ready.assetId).body.validity, 'stale');
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'completed');
    assert.throws(() => transitionAsset(store, assetCommand(store, ready.assetId, {disposition: 'discarded'}), runtime(root, store, reviewer)),
      code('INVALID_INPUT'));
  });
});

test('supersession updates both asset records atomically and rejects conflicting successors', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {validity_owner: reviewer.role});
    const assets = [register(root, store), register(root, store), register(root, store)];
    for (const a of assets) {
      const approvalId = accept(root, store, a.artifactId);
      transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
      transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId}), runtime(root, store, reviewer));
    }
    const [old, next, conflicting] = assets;
    transitionAsset(store, assetCommand(store, next.assetId, {validity: 'current', supersedes: old.assetId}),
      runtime(root, store, reviewer));
    assert.equal(readRecord(store, 'asset', old.assetId).body.superseded_by, next.assetId);
    assert.equal(readRecord(store, 'asset', old.assetId).body.validity, 'superseded');
    assert.equal(readRecord(store, 'asset', next.assetId).body.supersedes, old.assetId);
    assert.throws(() => transitionAsset(store, assetCommand(store, conflicting.assetId, {
      validity: 'current', supersedes: old.assetId,
    }), runtime(root, store, reviewer)), code('EVIDENCE_GAP'));
    assert.equal(readRecord(store, 'asset', conflicting.assetId).body.supersedes, null);
  });
});

test('publication requires declared contained public target; retraction retains exact HTML and history', async () => {
  await withWorkspace(({root, store}) => {
    const manifest = JSON.parse(readFileSync(join(root, '.kai', 'manifest.json')));
    manifest.projects = [{id: 'app', path: '.', publication_root: 'docs/kai'}];
    file(root, '.kai/manifest.json', JSON.stringify(manifest));
    const target = 'project:app:docs/kai/mock.html';
    setup(root, store, {artifact_targets: [target], validity_owner: reviewer.role});
    const a = register(root, store, {classification: 'public'});
    const approvalId = accept(root, store, a.artifactId);
    transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
    transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId}), runtime(root, store, reviewer));
    assert.throws(() => transitionAsset(store, assetCommand(store, a.assetId, {
      disposition: 'published', validity: 'current', target,
    }), runtime(root, store, reviewer)), code('EVIDENCE_GAP'));
    file(root, 'docs/kai/mock.html');
    transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'published', validity: 'current', target}),
      runtime(root, store, reviewer));
    transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'retracted', validity: 'invalidated', reason: 'Unsafe guidance'}),
      runtime(root, store, reviewer));
    assert.equal(readFileSync(join(root, 'docs/kai/mock.html'), 'utf8'), '<h1>First</h1>');
    assert.equal(readRecord(store, 'asset', a.assetId).body.history.some(h => h.disposition === 'published'), true);
    assert.throws(() => transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'discarded'}),
      runtime(root, store, reviewer)), code('INVALID_INPUT'));
    for (const path of ['project:app:outside/x', 'project:app:.kai/x', 'project:app:docs/kai/../../x']) {
      assert.throws(() => assertWorkspacePath(root, path), code('INVALID_INPUT'));
    }
  });
});

test('paid media cannot be accepted without independently verified operator consent', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {artifact_class: 'paid-media'});
    const a = register(root, store);
    const c = verdict(store, 'approval.record', [`artifact:${a.artifactId}`]);
    assert.throws(() => recordApproval(store, c, runtime(root, store, reviewer)), code('AUTHORITY_REQUIRED'));
    assert.equal(recordApproval(store, c, runtime(root, store, reviewer, {
      verifyOperatorDecision: operatorProof,
    })).ok, true);
  });
});

  test('actual criteria and subject revisions invalidate retained approval/review claims', async () => {
    await withWorkspace(({root, store}) => {
      setup(root, store);
      const a = register(root, store);
      const stale = verdict(store, 'review.record', [`artifact:${a.artifactId}`]);
      const update = cmd(store, 'item.update', {changes: {acceptance: ['New acceptance requirement']}});
      applyCommand(store, update, authority(builder, 'item.update', {version: update.expectedVersion}));
      runtime(root, store, reviewer);
      assert.throws(() => recordReview(store, {...stale, expectedVersion: readRecord(store, 'item', 'demo').version}),
        code('EVIDENCE_GAP'));
      for (const to of ['in-progress', 'in-review']) {
        const payload = {to, at: new Date().toISOString(), reason: 'Revise the commissioned work'};
        if (to === 'in-review') {
          file(root, source, 'new exact subject');
          payload.subject = hashArtifact({root, relativePath: source});
        }
        const change = cmd(store, 'item.transition', payload);
        applyCommand(store, change, authority(builder, 'item.transition', {version: change.expectedVersion}));
      }
      runtime(root, store, reviewer);
      assert.throws(() => recordReview(store, {...stale, expectedVersion: readRecord(store, 'item', 'demo').version}),
        code('EVIDENCE_GAP'));
    });
  });

  test('private state nested Git and dangling links are rejected just like run-lane hazards', async () => {
    await withWorkspace(({root}) => {
      file(root, source);
      mkdirSync(join(root, '.kai', 'state', 'nested', '.git'), {recursive: true});
      assert.throws(() => assertWorkspacePath(root, '.kai/state/nested/data'), code('INVALID_INPUT'));
      rmSync(join(root, '.kai', 'state', 'nested'), {recursive: true});
      const dangling = join(root, 'removed');
      mkdirSync(dangling);
      symlinkSync(dangling, join(root, '.kai', 'review'), 'junction');
      rmSync(dangling, {recursive: true});
      assert.throws(() => assertWorkspacePath(root, source), code('INVALID_INPUT'));
    });
  });

  test('registered confidentiality cannot be downgraded by relabeling the same source', async () => {
    await withWorkspace(({root, store}) => {
      setup(root, store);
      register(root, store, {classification: 'confidential'});
      runtime(root, store);
      assert.throws(() => registerArtifact(store, artifactCommand(store, {classification: 'public'})),
        code('INVALID_INPUT'));
    });
  });

  test('recovery can retain fresh observations only under exact expired-lease host authority', async () => {
    await withWorkspace(({root, store}) => {
      const expired = {
        holder: builder, token: 'expired-task5-token', version_at_grant: 1,
        acquired_at: '2026-09-01T00:00:00Z', expires_at: '2026-09-02T00:00:00Z',
      };
      setup(root, store, {lease: expired});
      runtime(root, store, lead);
      const c = artifactCommand(store, {recoveryLeaseToken: expired.token});
      c.actor = lead;
      assert.equal(registerArtifact(store, c).ok, true);
      runtime(root, store, lead, {verifyCapture: captureFor});
      const e = evidenceCommand(store, c.payload.artifactId, {
        kind: 'recovery-reconciliation', subject: null, criteria_ref: null, dimension: null,
        outcome: 'passed', data: {stale_lease_token: expired.token, disposition: 'safe-to-resume', observed: 'No partial writes'},
      }, 'observed', lead);
      assert.equal(registerEvidence(store, e, {}).ok, true);
      runtime(root, store, lead);
      const wrong = artifactCommand(store, {recoveryLeaseToken: 'wrong-token'});
      wrong.actor = lead;
      assert.throws(() => registerArtifact(store, wrong), code('RECOVERY_REQUIRED'));
      const self = artifactCommand(store, {recoveryLeaseToken: expired.token});
      runtime(root, store, builder);
      assert.throws(() => registerArtifact(store, self), code('AUTHORITY_REQUIRED'));
    });
  });

  test('post-registration byte changes prevent later review, even while original manifest exists', async () => {
    await withWorkspace(({root, store}) => {
      setup(root, store);
      const a = register(root, store);
      file(root, source, 'silently edited output');
      runtime(root, store, reviewer);
      assert.throws(() => recordReview(store, verdict(store, 'review.record', [`artifact:${a.artifactId}`])),
        code('EVIDENCE_GAP'));
    });
  });

  test('effective negative observed evidence persists until explicitly superseded; forks fail closed', async () => {
    await withWorkspace(({root, store}) => {
      setup(root, store);
      const a = register(root, store);
      const bad = evidenceCommand(store, a.artifactId, {outcome: 'gap', reason: 'Test failed'});
      runtime(root, store, builder, {verifyCapture: c => captureFor(c, {exit_code: 1})});
      registerEvidence(store, bad, {});
      runtime(root, store, builder, {verifyCapture: captureFor});
      registerEvidence(store, evidenceCommand(store, a.artifactId), {});
      assert.equal(listRecords(store, {kind: 'evidence', itemId: 'demo'}).length, 2);
      const corrected = evidenceCommand(store, a.artifactId, {supersedes: [bad.payload.body.evidence_id]});
      runtime(root, store, builder, {verifyCapture: captureFor});
      registerEvidence(store, corrected, {});
      runtime(root, store, builder, {verifyCapture: captureFor});
      assert.throws(() => registerEvidence(store, evidenceCommand(store, a.artifactId, {
        supersedes: [bad.payload.body.evidence_id],
      }), {}), code('EVIDENCE_GAP'));
    });
  });

  test('production verification requires operator context and all captured checks', async () => {
    await withWorkspace(({root, store}) => {
      setup(root, store);
      const a = register(root, store);
      const data = {environment: 'prod-eu', deployment_id: 'd-77', checks: ['behavior', 'health']};
      let c = evidenceCommand(store, a.artifactId, {
        kind: 'production-verification', dimension: null, outcome: 'passed', data,
      });
      runtime(root, store, builder, {verifyCapture: x => captureFor(x, {checks: data.checks})});
      assert.throws(() => registerEvidence(store, c, {}), code('AUTHORITY_REQUIRED'));
      for (const kind of ['operator-deploy-start', 'operator-deploy-complete']) {
        const approval = verdict(store, 'approval.record', [`artifact:${a.artifactId}`], {
          kind, deployment: {environment: data.environment, deployment_id: data.deployment_id, environment_class: 'production'},
        }, operator);
        recordApproval(store, approval, runtime(root, store, operator, {verifyOperatorDecision: operatorProof}));
      }
      c = evidenceCommand(store, a.artifactId, {kind: 'production-verification', dimension: null, outcome: 'passed', data});
      runtime(root, store, builder, {verifyCapture: captureFor});
      assert.throws(() => registerEvidence(store, c, {}), code('EVIDENCE_GAP'));
      runtime(root, store, builder, {verifyCapture: x => captureFor(x, {checks: data.checks})});
      assert.equal(registerEvidence(store, c, {}).ok, true);
    });
  });

test('a valid capture cannot be replayed against a different claimed outcome', async () => {
      await withWorkspace(({root, store}) => {
        setup(root, store);
        const a = register(root, store);
        const c = evidenceCommand(store, a.artifactId);
        const staleCapture = captureFor({...c, payload: {...c.payload, body: {
          ...c.payload.body, dimension: 'documented',
        }}});
        runtime(root, store, builder, {verifyCapture: () => staleCapture});
        assert.throws(() => registerEvidence(store, c, {}), code('EVIDENCE_GAP'));
      });
});

test('late transaction failure preserves exact unregistered snapshots without false database success', async () => {
      await withWorkspace(({root, store}) => {
        setup(root, store);
        const c = artifactCommand(store);
        store.database.exec(`CREATE TRIGGER reject_receipt BEFORE INSERT ON operations
          BEGIN SELECT RAISE(ABORT, 'task5 receipt failure'); END`);
        assert.throws(() => registerArtifact(store, c), /task5 receipt failure/);
        assert.equal(readRecord(store, 'artifact', c.payload.artifactId), null);
        assert.equal(readRecord(store, 'asset', c.payload.assetId), null);
        assert.equal(readRecord(store, 'item', 'demo').version, 1);
        assert.equal(store.database.prepare('SELECT COUNT(*) n FROM events').get().n, 0);
        assert.equal(readFileSync(join(root, source), 'utf8'), '<h1>First</h1>');
        assert.equal(readFileSync(join(root, runDirectory, '.evidence', c.payload.artifactId, '0000.bin'), 'utf8'),
          '<h1>First</h1>');
        store.database.exec('DROP TRIGGER reject_receipt');
        assert.equal(registerArtifact(store, c).ok, true);
      });
});

test('forged operator discard does not remove or reclassify personal output', async () => {
      await withWorkspace(({root, store}) => {
        const personal = '.kai/personal/operator/note.html';
        setup(root, store, {artifact_targets: [personal]});
        file(root, personal);
        const a = register(root, store, {
          classification: 'personal', subject: hashArtifact({root, relativePath: personal}),
        });
        const c = assetCommand(store, a.assetId, {disposition: 'discarded', validity: 'provisional'}, operator);
        assert.throws(() => transitionAsset(store, c, runtime(root, store, operator)), code('AUTHORITY_REQUIRED'));
        assert.equal(readRecord(store, 'asset', a.assetId).body.disposition, 'personal');
        assert.equal(existsSync(join(root, personal)), true);
      });
});

test('publication cannot escape through a project junction or private project binding', async () => {
      await withWorkspace(({root}) => {
        const manifest = JSON.parse(readFileSync(join(root, '.kai', 'manifest.json')));
        manifest.projects = [{id: 'app', path: '.', publication_root: 'docs/kai'}];
        file(root, '.kai/manifest.json', JSON.stringify(manifest));
        const outside = join(root, 'elsewhere');
        mkdirSync(outside);
        symlinkSync(outside, join(root, 'docs'), 'junction');
        assert.throws(() => assertWorkspacePath(root, 'project:app:docs/kai/x'), code('INVALID_INPUT'));
        rmSync(join(root, 'docs'));
        manifest.projects[0].path = '.kai/state/private-project';
        file(root, '.kai/manifest.json', JSON.stringify(manifest));
        assert.throws(() => assertWorkspacePath(root, 'project:app:docs/kai/x'), code('INVALID_INPUT'));
      });
});

test('actual persisted recovery approval resolves only its exact conflicting attempt', async () => {
  await withWorkspace(({root, store}) => {
    const staleLease = {
      holder: builder, token: 'recovery-resolution-token', version_at_grant: 1,
      acquired_at: '2026-09-01T00:00:00Z', expires_at: '2026-09-02T00:00:00Z',
    };
    setup(root, store, {lease: staleLease});
    runtime(root, store, lead);
    const a = artifactCommand(store, {recoveryLeaseToken: staleLease.token});
    a.actor = lead;
    registerArtifact(store, a);
    runtime(root, store, lead, {verifyCapture: captureFor});
    const data = {
      stale_lease_token: staleLease.token, disposition: 'conflicting-partial-work', observed: 'Conflicting partial output',
    };
    const e = evidenceCommand(store, a.payload.artifactId, {
      kind: 'recovery-reconciliation', subject: null, criteria_ref: null,
      dimension: null, outcome: 'passed', data,
    }, 'observed', lead);
    registerEvidence(store, e, {});
    const attemptId = randomUUID();
    const recover = cmd(store, 'attempt.recover', {
      attemptId, observed: data.observed, disposition: data.disposition,
      recoveryEvidenceIds: [e.payload.body.evidence_id], redispatch: null, expiresAt: null,
      createdAt: new Date().toISOString(),
    }, lead);
    applyCommand(store, recover, authority(lead, 'attempt.recover', {version: recover.expectedVersion}));
    assert.equal(readRecord(store, 'item', 'demo').body.recovery_hold, attemptId);
    const recovery = {
      attempt_id: attemptId, stale_lease_token: staleLease.token, disposition: 'safe-to-resume', resume_role: builder.role,
    };
    const approval = verdict(store, 'approval.record', [`evidence:${e.payload.body.evidence_id}`], {
      kind: 'operator-recovery-resolution', subject: null, recovery,
    }, operator);
    const bad = structuredClone(approval);
    bad.payload.body.recovery.stale_lease_token = 'not-the-stale-lease';
    assert.throws(() => recordApproval(store, bad, runtime(root, store, operator, {verifyOperatorDecision: operatorProof})),
      code('AUTHORITY_REQUIRED'));
    recordApproval(store, approval, runtime(root, store, operator, {verifyOperatorDecision: operatorProof}));
    const restore = cmd(store, 'item.restore', {
      at: new Date().toISOString(), recoveryApprovalId: approval.payload.body.approval_id,
    }, lead);
    applyCommand(store, restore, authority(lead, 'item.restore', {version: restore.expectedVersion}));
    assert.equal(readRecord(store, 'item', 'demo').body.recovery_hold, null);
    assert.equal(readRecord(store, 'item', 'demo').body.lease, null);
  });
});

test('scope-authorized personal discard preserves historical bytes and records actual consent', async () => {
  await withWorkspace(({root, store}) => {
    const personal = '.kai/personal/operator/note.html';
    file(root, personal);
    setup(root, store, {
      scope_authority: 'operator', artifact_targets: [personal],
      change_ref: hashArtifact({root, relativePath: personal}),
    });
    const a = register(root, store, {classification: 'personal'});
    const approval = verdict(store, 'approval.record', [`artifact:${a.artifactId}`], {kind: 'scope'}, operator);
    recordApproval(store, approval, runtime(root, store, operator, {verifyOperatorDecision: operatorProof}));
    const c = assetCommand(store, a.assetId, {
      disposition: 'discarded', validity: 'provisional', approvalId: approval.payload.body.approval_id,
    }, operator);
    transitionAsset(store, c, runtime(root, store, operator));
    assert.equal(readRecord(store, 'asset', a.assetId).body.disposition, 'discarded');
    assert.equal(readRecord(store, 'asset', a.assetId).body.completion_approval_id, null);
    assert.equal(existsSync(join(root, personal)), true);
  });
});

test('successor work can atomically supersede a completed predecessor only with both item grants', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {state: 'completed', validity_owner: reviewer.role});
    const old = register(root, store);
    const oldApproval = accept(root, store, old.artifactId);
    transitionAsset(store, assetCommand(store, old.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
    transitionAsset(store, assetCommand(store, old.assetId, {validity: 'current', approvalId: oldApproval}), runtime(root, store, reviewer));
    seedItem(store, {...readRecord(store, 'item', 'demo').body, id: 'successor'});
    const bindNext = (actor, both = false) => {
      const next = readRecord(store, 'item', 'successor');
      const auth = authority(actor, actions, {recordId: next.id, version: next.version});
      if (both) auth.grants.push(...authority(actor, 'asset.transition', {
        version: readRecord(store, 'item', 'demo').version,
      }).grants);
      bindEvidenceRuntime(store, {root, authority: auth, runs: [{actor, directory: runDirectory}]});
      return auth;
    };
    const nextCommand = c => ({
      ...c, recordId: 'successor', expectedVersion: readRecord(store, 'item', 'successor').version,
    });
    const next = nextCommand(artifactCommand(store));
    bindNext(builder);
    registerArtifact(store, next);
    const approve = nextCommand(verdict(store, 'approval.record', [`artifact:${next.payload.artifactId}`], {item_id: 'successor'}));
    recordApproval(store, approve, bindNext(reviewer));
    transitionAsset(store, nextCommand(assetCommand(store, next.payload.assetId, {disposition: 'draft'})), bindNext(reviewer));
    transitionAsset(store, nextCommand(assetCommand(store, next.payload.assetId, {
      validity: 'current', approvalId: approve.payload.body.approval_id,
    })), bindNext(reviewer));
    const supersede = nextCommand(assetCommand(store, next.payload.assetId, {validity: 'current', supersedes: old.assetId}));
    assert.throws(() => transitionAsset(store, supersede, bindNext(reviewer)), code('AUTHORITY_REQUIRED'));
    assert.equal(readRecord(store, 'asset', old.assetId).body.validity, 'current');
    transitionAsset(store, supersede, bindNext(reviewer, true));
    assert.equal(readRecord(store, 'asset', old.assetId).body.superseded_by, next.payload.assetId);
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'completed');
    assert.equal(readRecord(store, 'item', 'successor').body.state, 'completed');
  });
});

test('source privacy survives case aliases and byte-identical copies with a new public label', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    register(root, store, {classification: 'confidential'});
    const copy = `${runDirectory}/copy.html`;
    file(root, copy);
    for (const path of [source.replace('mock.html', 'MOCK.html'), copy]) {
      runtime(root, store);
      const c = artifactCommand(store, {
        classification: 'public', subject: {kind: 'sha256', path, digest: digest('<h1>First</h1>')},
      });
      assert.throws(() => registerArtifact(store, c), code('INVALID_INPUT'));
    }
  });
});

test('engine rejects producer-only commands with a typed routing error and no writes', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    const c = artifactCommand(store);
    assert.throws(() => applyCommand(store, c, authority(builder, 'artifact.register')), code('INVALID_INPUT'));
    assert.equal(readRecord(store, 'item', 'demo').version, 1);
  });
});

test('review and approval cannot self-accept an exact subject artifact produced outside item history', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store);
    runtime(root, store, reviewer);
    const a = artifactCommand(store);
    a.actor = reviewer;
    registerArtifact(store, a);
    runtime(root, store, reviewer);
    assert.throws(() => recordReview(store, verdict(store, 'review.record', [`artifact:${a.payload.artifactId}`])),
      code('AUTHORITY_REQUIRED'));
    assert.throws(() => recordApproval(store, verdict(store, 'approval.record', [`artifact:${a.payload.artifactId}`]),
      runtime(root, store, reviewer)), code('AUTHORITY_REQUIRED'));
  });
});

test('independent reviewers can persist verdicts using real live engine-granted leases', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {next_role: reviewer.role});
    const a = register(root, store);
    const grant = cmd(store, 'item.grant', {
      holder: reviewer, actions: ['review.record', 'approval.record'],
      acquiredAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(),
    }, lead);
    applyCommand(store, grant, authority(lead, 'item.grant', {version: grant.expectedVersion}));
    const leaseToken = readRecord(store, 'item', 'demo').body.lease.token;
    runtime(root, store, reviewer, {authority: {roles: [reviewer.role], grants: []}});
    const review = {...verdict(store, 'review.record', [`artifact:${a.artifactId}`]), leaseToken};
    assert.equal(recordReview(store, review).ok, true);
    const approval = {...verdict(store, 'approval.record', [`artifact:${a.artifactId}`]), leaseToken};
    assert.equal(recordApproval(store, approval, {roles: [reviewer.role], grants: []}).ok, true);
    assert.doesNotThrow(() => completionApproval(txView(store), readRecord(store, 'item', 'demo')));
  });
});

test('asset currentness cannot bypass an effective negative required review', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {review_requirements: [{role: reviewer.role, kind: 'code'}]});
    const a = register(root, store);
    runtime(root, store, reviewer);
    recordReview(store, verdict(store, 'review.record', [`artifact:${a.artifactId}`], {verdict: 'blocked'}));
    const approvalId = accept(root, store, a.artifactId);
    transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
    assert.throws(() => transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId}),
      runtime(root, store, reviewer)), code('EVIDENCE_GAP'));
    assert.equal(readRecord(store, 'asset', a.assetId).body.validity, 'provisional');
  });
});

test('stale assets need fresh acceptance, while missing bytes may still be honestly invalidated', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {state: 'completed', validity_owner: reviewer.role});
    const a = register(root, store);
    const approvalId = accept(root, store, a.artifactId);
    transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
    transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId}), runtime(root, store, reviewer));
    const earlierAlternative = accept(root, store, a.artifactId);
    transitionAsset(store, assetCommand(store, a.assetId, {validity: 'stale'}), runtime(root, store, reviewer));
    assert.throws(() => transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current'}),
      runtime(root, store, reviewer)), code('EVIDENCE_GAP'));
    assert.throws(() => transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId: earlierAlternative}),
      runtime(root, store, reviewer)), code('EVIDENCE_GAP'));
    const fresh = accept(root, store, a.artifactId);
    transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId: fresh}), runtime(root, store, reviewer));
    rmSync(join(root, readRecord(store, 'artifact', a.artifactId).body.snapshots[0].snapshot_path));
    transitionAsset(store, assetCommand(store, a.assetId, {validity: 'invalidated', reason: 'Snapshot was lost'}),
      runtime(root, store, reviewer));
    assert.equal(readRecord(store, 'asset', a.assetId).body.validity, 'invalidated');
    assert.equal(readRecord(store, 'item', 'demo').body.state, 'completed');
  });
});

test('a current successor can replace a stale predecessor without pretending the predecessor is current', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {validity_owner: reviewer.role});
    const [old, next] = [register(root, store), register(root, store)];
    for (const a of [old, next]) {
      const approvalId = accept(root, store, a.artifactId);
      transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
      transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', approvalId}), runtime(root, store, reviewer));
    }
    transitionAsset(store, assetCommand(store, old.assetId, {validity: 'stale'}), runtime(root, store, reviewer));
    transitionAsset(store, assetCommand(store, next.assetId, {validity: 'current', supersedes: old.assetId}),
      runtime(root, store, reviewer));
    assert.equal(readRecord(store, 'asset', old.assetId).body.validity, 'superseded');
    assert.equal(readRecord(store, 'asset', old.assetId).body.history.at(-2).validity, 'stale');
  });
});

test('declared project bindings reject drive-relative roots rather than consulting process cwd', async () => {
  await withWorkspace(({root}) => {
    const manifest = JSON.parse(readFileSync(join(root, '.kai', 'manifest.json')));
    for (const path of ['C:project', '\\project']) {
      manifest.projects = [{id: 'app', path, publication_root: 'docs/kai'}];
      file(root, '.kai/manifest.json', JSON.stringify(manifest));
      assert.throws(() => assertWorkspacePath(root, 'project:app:docs/kai/x'), code('INVALID_INPUT'));
    }
  });
});

test('bundle assets close against exact manifests and publish only with already-public member paths', async () => {
  for (const publishable of [false, true]) {
    await withWorkspace(({root, store}) => {
      const manifest = JSON.parse(readFileSync(join(root, '.kai', 'manifest.json')));
      manifest.projects = [{id: 'app', path: '.', publication_root: 'docs/kai'}];
      file(root, '.kai/manifest.json', JSON.stringify(manifest));
      const paths = publishable
        ? ['project:app:docs/kai/one.html', 'project:app:docs/kai/two.css']
        : [`${runDirectory}/one.html`, `${runDirectory}/two.css`];
      for (const path of paths) file(root, path.replace('project:app:', ''), 'bundle member');
      const subject = hashBundle({root, paths});
      const privateManifest = '.kai/state/initiatives/demo-initiative/artifacts/bundle.json';
      const publicManifest = 'project:app:docs/kai/bundle.json';
      setup(root, store, {
        change_ref: subject, artifact_targets: [...paths, privateManifest, publicManifest],
      });
      const a = register(root, store, {classification: 'public', mediaType: 'application/json'});
      const approvalId = accept(root, store, a.artifactId);
      file(root, privateManifest, canonicalJson(subject));
      transitionAsset(store, assetCommand(store, a.assetId, {disposition: 'draft'}), runtime(root, store, reviewer));
      transitionAsset(store, assetCommand(store, a.assetId, {validity: 'current', target: privateManifest, approvalId}),
        runtime(root, store, reviewer));
      file(root, 'docs/kai/bundle.json', canonicalJson(subject));
      const c = assetCommand(store, a.assetId, {disposition: 'published', validity: 'current', target: publicManifest});
      if (publishable) {
        assert.equal(transitionAsset(store, c, runtime(root, store, reviewer)).ok, true);
        assert.equal(readFileSync(join(root, 'docs/kai/bundle.json'), 'utf8'), canonicalJson(subject));
      } else {
        assert.throws(() => transitionAsset(store, c, runtime(root, store, reviewer)), code('INVALID_INPUT'));
        assert.equal(readRecord(store, 'asset', a.assetId).body.disposition, 'working');
      }
    });
  }
});

test('host provenance does not persist machine-absolute capture or supplied-decision references', async () => {
      await withWorkspace(({root, store}) => {
        setup(root, store);
        const a = register(root, store);
        runtime(root, store, builder, {verifyCapture: c => captureFor(c, {reference: 'C:\\private\\capture.txt'})});
        assert.throws(() => registerEvidence(store, evidenceCommand(store, a.artifactId), {}), code('INVALID_INPUT'));
        const approval = verdict(store, 'approval.record', [`artifact:${a.artifactId}`], {
          kind: 'operator-deploy-start',
          deployment: {environment: 'prod', environment_class: 'production', deployment_id: 'd1'},
        }, operator);
        assert.throws(() => recordApproval(store, approval, runtime(root, store, operator, {
          verifyOperatorDecision: c => operatorProof(c, {reference: '\\\\server\\private\\approval.txt'}),
        })), code('AUTHORITY_REQUIRED'));
      });
    });

test('actual operator decisions do not require or replace the executing agents live lease', async () => {
  await withWorkspace(({root, store}) => {
    setup(root, store, {next_role: builder.role});
    const a = register(root, store);
    const grant = cmd(store, 'item.grant', {
      holder: builder, actions: ['item.transition'],
      acquiredAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 60000).toISOString(),
    }, lead);
    applyCommand(store, grant, authority(lead, 'item.grant', {version: grant.expectedVersion}));
    const lease = readRecord(store, 'item', 'demo').body.lease;
    const approval = verdict(store, 'approval.record', [`artifact:${a.artifactId}`], {
      kind: 'operator-deploy-start',
      deployment: {environment: 'prod', environment_class: 'production', deployment_id: 'd-live'},
    }, operator);
    assert.equal(recordApproval(store, approval, runtime(root, store, operator, {
      verifyOperatorDecision: operatorProof,
    })).ok, true);
    assert.deepEqual(readRecord(store, 'item', 'demo').body.lease, lease);
  });
});
