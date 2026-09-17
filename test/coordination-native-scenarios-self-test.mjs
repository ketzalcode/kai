// Explicitly authorized installed-host scenarios. `KAI_TEST_NATIVE_SCENARIOS=1`
// launches the real executable; `rehearsal` exercises the same runtime plumbing
// with locally executed commands in clearly synthetic frames and never contacts
// a model. This file is not part of `npm test` or CI.
//
// Measured 2026-09-17 against Copilot CLI 1.0.85: in the live run both workers
// had every shell tool call refused with code `denied` ("Permission denied and
// could not request permission from user"), so scenario 1 failed at capture
// conversion. The launch arguments below are exactly the ones that produced that
// result and are left unchanged; the passing handshake test differs by granting
// `--add-dir` trusted read directories, which is a hypothesis for the denial and
// not a verified fix. The same live journal also showed the agent dropping the
// generated `# Kai capture <nonce>` comment line from the exact command, which
// would defeat receipt matching independently of permissions.
import assert from 'node:assert/strict';
import {test} from 'node:test';import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync, appendFileSync, existsSync, readdirSync, rmSync} from 'node:fs';
import {dirname, join, delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID, createHash} from 'node:crypto';
import {withWorkspace, seedItem, seedInitiative, allocateTemporaryRoot} from './helpers/coordination-runtime-fixture.mjs';
import {criteriaRef} from '../scripts/lib/coordination-runtime/contract.mjs';
import {readRecord, listRecords} from '../scripts/lib/coordination-runtime/store.mjs';
import {privateAdmission} from '../scripts/lib/coordination-runtime/migration-files.mjs';
import {readIssued} from '../scripts/lib/coordination-runtime/native-capabilities.mjs';

const checkout = join(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(checkout, 'scripts', 'coordinate.mjs');
const mode = process.env.KAI_TEST_NATIVE_SCENARIOS ?? '';
const live = mode === '1';
// "rehearsal" exercises the same runtime plumbing with locally executed commands
// wrapped in SYNTHETIC native frames. It never contacts a model and never
// establishes host acceptance; only "1" launches the installed executable.
const gate = mode !== '1' && mode !== 'rehearsal'
  && 'explicitly authorized installed-host scenario; never automatic';
const digest = bytes => createHash('sha256').update(bytes).digest('hex');
const at = () => new Date().toISOString();
const shellTail = /(?:^|\n)<shellId: [^\r\n<>]+ completed with exit code (-?\d+)>\s*$/;

function baseEnv(packs) {
  const env = {...process.env,
    KAI_COPILOT_PLUGIN_DIRS: packs.map(p => join(checkout, 'plugins', p)).join(delimiter),
    PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`};
  delete env.COPILOT_ALLOW_ALL;
  return env;
}

/** A schema-4 workspace with no coordination database, unlike the shared fixture. */
async function withBareWorkspace(fn) {
  const root = allocateTemporaryRoot('kai-coordination-scenario-');
  mkdirSync(join(root, '.kai', 'state'), {recursive: true});
  writeFileSync(join(root, '.kai', 'manifest.json'), JSON.stringify({
    plugin: 'kai-core', version: 'test', schema_version: 4, scaffolded: at(),
    workspace_id: `scenario-${randomUUID()}`, storage_mode: 'repo-local', workspace_root: '.',
    state: '.kai/state', runs: '.kai/runs', review: '.kai/review', archive: '.kai/archive',
    personal: '.kai/personal', projects: [], areas: [],
  }, null, 2) + '\n');
  try { return await fn({root}); } finally { rmSync(root, {recursive: true, force: true}); }
}

function runner(root, env) {
  const run = (verb, body, args = [], launchEnv = env) => {
    const result = spawnSync(process.execPath, [cli, verb, '--root', root, ...args], {
      cwd: root, encoding: 'utf8', input: body === undefined ? '' : JSON.stringify(body),
      env: launchEnv, timeout: 90_000,
    });
    assert.ok(result.stdout, result.stderr || String(result.error));
    return {status: result.status, result: JSON.parse(result.stdout)};
  };
  const invoke = (...args) => {
    const output = run(...args);
    assert.equal(output.status, 0, `${args[0]}: ${JSON.stringify(output.result)}`);
    return output.result;
  };
  return {run, invoke};
}

/** SYNTHETIC human decision in an isolated test home. Never actual approval. */
function syntheticApproval(home, runId, request) {
  const directory = join(home, '.copilot', 'session-state', runId);
  mkdirSync(directory, {recursive: true});
  const toolCallId = randomUUID();
  appendFileSync(join(directory, 'events.jsonl'), [
    {id: randomUUID(), type: 'tool.execution_start', timestamp: at(), agentId: null,
      data: {toolCallId, toolName: 'ask_user',
        arguments: {message: request.message, requestedSchema: request.requestedSchema}}},
    {id: randomUUID(), type: 'tool.execution_complete', timestamp: at(), agentId: null,
      data: {toolCallId, success: true, result: {content: `User responded: APPROVE ${request.nonce}`,
        detailedContent: `User responded:\ndecision: APPROVE ${request.nonce}`}}},
  ].map(event => JSON.stringify(event)).join('\n') + '\n');
}

/** Rehearsal only: real local command results inside SYNTHETIC native frames. */
function rehearseWorker(home, root, preparation, commands) {
  const directory = join(home, '.copilot', 'session-state', preparation.actor.runId);
  mkdirSync(directory, {recursive: true});
  const timestamp = at();
  const events = [
    {id: randomUUID(), type: 'session.start', timestamp, agentId: null,
      data: {sessionId: preparation.actor.runId, copilotVersion: '1.0.85', startTime: timestamp, context: {cwd: root}}},
    {id: randomUUID(), type: 'subagent.selected', timestamp, agentId: null,
      data: {agentName: preparation.agentId, agentDisplayName: preparation.actor.role, tools: ['execute']}},
    {id: randomUUID(), type: 'assistant.turn_start', timestamp, agentId: null, data: {turnId: '0'}},
  ];
  for (const command of commands) {
    const result = spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', command],
      {encoding: 'utf8', cwd: root});
    assert.equal(result.error, undefined, `rehearsal command failed to start: ${command}`);
    const toolCallId = randomUUID();
    const content = `${result.stdout}\n<shellId: rehearsal completed with exit code ${result.status}>`;
    events.push({id: randomUUID(), type: 'tool.execution_start', timestamp: at(), agentId: null,
      data: {toolCallId, toolName: 'powershell', arguments: {command, description: 'SYNTHETIC rehearsal frame'}}},
    {id: randomUUID(), type: 'tool.execution_complete', timestamp: at(), agentId: null,
      data: {toolCallId, success: true, result: {content, detailedContent: content}}});
  }
  appendFileSync(join(directory, 'events.jsonl'), events.map(event => JSON.stringify(event)).join('\n') + '\n');
}

function publish(name, evidence) {
  const directory = process.env.KAI_TEST_NATIVE_SCENARIOS_DIR;
  if (directory) writeFileSync(join(directory, `${name}.json`), JSON.stringify(evidence, null, 2) + '\n');
  console.log(JSON.stringify({scenario: name, ...evidence}));
}

test('coordinated engineering worker reads bounded context and produces the content proof its observed evidence binds to', {
  skip: gate,
}, async () => withWorkspace(async ({root, store}) => {
  const env = baseEnv(['kai-core', 'kai-engineering', 'kai-creative']);
  const {run, invoke} = runner(root, env);
  privateAdmission(root, {admit: true});
  const prepared = invoke('prepare', {role: 'eng-builder-software'});
  const actor = prepared.preparation.actor;
  assert.equal(prepared.discovery.modelPromptSent, false);
  const relativePath = `.kai/runs/native/${actor.runId}/output.md`;
  const bytes = 'Coordinated scenario subject. Acceptance line: CONTEXT_AND_EVIDENCE.\n';
  mkdirSync(dirname(join(root, relativePath)), {recursive: true});
  writeFileSync(join(root, relativePath), bytes);
  const subject = {kind: 'sha256', path: relativePath, digest: digest(bytes)};
  seedInitiative(store);
  const seeded = seedItem(store, {state: 'ready', next_role: 'eng-builder-software',
    producer_actor: null, producing_actors: [], acceptance_actor: null,
    change_ref: subject, artifact_targets: [relativePath]});
  const criteria = criteriaRef(seeded.body);
  const syntheticHome = join(root, 'synthetic-human-home');
  const directorEnv = {...env, USERPROFILE: syntheticHome, HOME: syntheticHome};
  const director = {role: 'eng-lead-architecture', runId: env.COPILOT_AGENT_SESSION_ID};
  const version = () => invoke('detail', undefined, ['--kind', 'item', '--id', 'demo']).record.version;
  const grant = {operationId: randomUUID(), kind: 'item.grant', actor: director,
    recordKind: 'item', recordId: 'demo', expectedVersion: version(), leaseToken: null,
    payload: {holder: actor, actions: ['artifact.register', 'evidence.register'],
      acquiredAt: at(), expiresAt: new Date(Date.now() + 3600_000).toISOString()}};
  const grantRequest = invoke('request', {type: 'command', command: grant}, [], directorEnv).request;
  syntheticApproval(syntheticHome, director.runId, grantRequest);
  const capability = invoke('authorize', undefined, ['--request', grantRequest.nonce], directorEnv).capability;
  const reserved = invoke('apply', grant, ['--capability', capability], directorEnv);
  const leaseToken = reserved.data.record.body.lease.token;
  assert.equal(reserved.data.record.body.lease.holder.runId, actor.runId);

  const workerEnv = live
    ? {...env, COPILOT_AGENT_SESSION_ID: actor.runId}
    : {...env, COPILOT_AGENT_SESSION_ID: actor.runId,
      USERPROFILE: join(root, 'rehearsal-home'), HOME: join(root, 'rehearsal-home')};
  const contextRequest = invoke('request', {type: 'capture', actor, itemId: 'demo', classification: 'internal',
    command: `node '${cli}' context --root '${root}' --item demo`,
    checks: ['Bounded coordination context read under the prepared identity']}, [], workerEnv).request;
  const proofRequest = invoke('request', {type: 'capture', actor, itemId: 'demo', classification: 'internal',
    command: `node '${cli}' hash --root '${root}' --path '${relativePath}'`,
    checks: ['Declared subject content digest recomputed from the retained file']}, [], workerEnv).request;

  const evidence = {purpose: 'One coordinated engineering scenario against the installed host',
    humanAuthority: 'SYNTHETIC isolated fixture; never actual approval',
    host: prepared.discovery.host, preparedActor: actor, mode: live ? 'installed-host' : 'rehearsal',
    launchStatus: null, launchError: null, contextRead: null, proofRead: null,
    evidenceRegistered: false, workerWroteNoRecords: false};
  try {
    if (live) {
      const prompt = 'This is an explicitly authorized read-only integration test, not domain work. '
        + 'The test prepared your actual native session and reserved a synthetic test lease before launching you. '
        + 'The human approval fixture is SYNTHETIC; do not report human acceptance. '
        + 'Node is available as node via PATH. Do not edit files, start agents, ask questions, '
        + 'retry failed commands, or run any other shell command. '
        + 'Run this exact powershell command once to read your bounded coordination context:\n'
        + contextRequest.command
        + '\nThen run this exact powershell command once to recompute the declared subject digest:\n'
        + proofRequest.command
        + '\nOnly report PROBE_COMPLETE if both commands actually executed successfully. '
        + 'If a command is unavailable or you have a genuine safety concern, stop and explain it; '
        + 'do not bypass the restriction or invent a receipt.';
      const launched = spawnSync(prepared.launch.executable, [
        ...prepared.launch.arguments, '--disable-builtin-mcps', '--available-tools=powershell',
        '--allow-tool=shell(node)', '--deny-tool=write', '--no-ask-user', '--no-auto-update',
        '--no-remote-export', '--no-custom-instructions', '-p', prompt,
      ], {cwd: root, env, stdio: 'ignore', timeout: 180_000, windowsHide: true});
      evidence.launchStatus = launched.status;
      evidence.launchError = launched.error?.code ?? launched.signal ?? null;
      assert.equal(launched.status, 0, `scenario launch did not complete: ${evidence.launchError}`);
    } else {
      rehearseWorker(workerEnv.USERPROFILE, root, prepared.preparation,
        [contextRequest.command, proofRequest.command]);
    }
    const before = listRecords(store, {kind: 'evidence', itemId: 'demo'}).length;
    const contextCapture = invoke('capture', {requestId: contextRequest.nonce}, [], workerEnv);
    const proofCapture = invoke('capture', {requestId: proofRequest.nonce}, [], workerEnv);
    const saved = id => {
      const issued = readIssued(root, 'captures', id);
      return {issued, output: issued.result.replace(shellTail, '').trim()};
    };
    const contextResult = saved(contextCapture.capture);
    const proofResult = saved(proofCapture.capture);
    assert.equal(contextResult.issued.proof.exit_code, 0);
    assert.equal(proofResult.issued.proof.exit_code, 0);
    const projection = JSON.parse(contextResult.output);
    evidence.contextRead = {bytes: projection.context.bytes, throughSeq: projection.context.throughSeq,
      reference: contextResult.issued.proof.reference};
    assert.equal(projection.mode, 'context');
    assert.ok(projection.context.bytes > 0 && projection.context.bytes <= 24 * 1024);
    assert.match(projection.context.text, /Demo knowledge item/);
    const recomputed = JSON.parse(proofResult.output);
    evidence.proofRead = {digest: recomputed.subject.digest, reference: proofResult.issued.proof.reference};
    assert.deepEqual(recomputed.subject, subject);
    assert.equal(before, listRecords(store, {kind: 'evidence', itemId: 'demo'}).length);
    evidence.workerWroteNoRecords = true;

    // The worker cannot pipe a command body through its own shell, so the harness
    // performs the two authoritative writes under the worker's persisted lease.
    // The host-owned capture, not the harness, is what binds them to real work.
    const artifactId = randomUUID();
    const artifact = {operationId: randomUUID(), kind: 'artifact.register', actor,
      recordKind: 'item', recordId: 'demo', expectedVersion: version(), leaseToken,
      payload: {artifactId, assetId: randomUUID(), subject, projectId: null, classification: 'internal',
        mediaType: 'text/markdown', title: 'Coordinated scenario subject', inputAssetIds: [], at: at()}};
    invoke('apply', artifact, [], workerEnv);
    const evidenceId = randomUUID();
    const register = {operationId: randomUUID(), kind: 'evidence.register', actor,
      recordKind: 'item', recordId: 'demo', expectedVersion: version(), leaseToken,
      payload: {tier: 'observed', body: {schema_version: 1, evidence_id: evidenceId, item_id: 'demo',
        kind: 'dod-dimension', subject, criteria_ref: criteria, supersedes: [], dimension: 'verified',
        outcome: 'clear', evidence_refs: [`artifact:${artifactId}`], reason: null, data: {},
        created_at: proofCapture.capturedAt}}};
    const declared = run('apply', register, [], workerEnv);
    assert.equal(declared.result.code, 'EVIDENCE_GAP', JSON.stringify(declared.result));
    invoke('apply', register, ['--capture', proofCapture.capture], workerEnv);
    const stored = readRecord(store, 'evidence', evidenceId);
    assert.equal(stored.body.provenance.tier, 'observed');
    assert.equal(stored.body.provenance.capture.reference, proofResult.issued.proof.reference);
    assert.equal(stored.body.provenance.capture.exit_code, 0);
    evidence.evidenceRegistered = true;
    evidence.observedEvidence = {evidenceId, reference: stored.body.provenance.capture.reference,
      checks: stored.body.provenance.capture.checks};
  } finally {
    publish('scenario-coordinated-engineering', evidence);
  }
}));

test('creative direct work runs with core+creative installed, without a coordination database', {
  skip: gate,
}, async () => withBareWorkspace(async ({root}) => {
  const env = baseEnv(['kai-core', 'kai-creative']);
  const {invoke} = runner(root, env);
  const direct = invoke('direct');
  assert.equal(direct.coordinationRequired, false);
  const databasePath = join(root, '.kai', 'state', 'coordination.sqlite');
  const evidence = {purpose: 'Direct creative work with no engineering package and no coordination store',
    mode: live ? 'installed-host' : 'rehearsal', installedPacks: ['kai-core', 'kai-creative'],
    directCoordinationRequired: direct.coordinationRequired, roster: null,
    launchStatus: null, launchError: null, storeCreated: null, capture: null};
  try {
    const catalog = invoke('capabilities').discovery;
    evidence.roster = catalog.roster.map(entry => entry.id).sort();
    assert.ok(evidence.roster.some(id => id.startsWith('kai-creative:')));
    assert.ok(!evidence.roster.some(id => id.startsWith('kai-engineering:')),
      'engineering roles must be absent when the package is not supplied');
    if (live) {
      const raw = process.env.KAI_TEST_NATIVE_SCENARIOS_RAW;
      assert.ok(raw, 'KAI_TEST_NATIVE_SCENARIOS_RAW must name the raw capture path to sanitize');
      const agentId = catalog.roster.find(entry => entry.role === 'creative-lead-design').id;
      const launched = spawnSync('copilot', ['--agent', agentId,
        ...['kai-core', 'kai-creative'].flatMap(pack => ['--plugin-dir', join(checkout, 'plugins', pack)]),
        '--disable-builtin-mcps', '--available-tools=powershell', '--allow-tool=shell(node)',
        '--deny-tool=write', '--no-ask-user', '--no-auto-update', '--no-remote-export',
        '--no-custom-instructions', '--output-format', 'json', '-p',
        'This is an explicitly authorized read-only integration test, not domain work. '
        + 'Supplied input (do not fetch anything else): a plugin that records who did what, '
        + 'why, and with what evidence. Reply with exactly one plain sentence naming the '
        + 'single clearest benefit for a first-time reader. '
        + 'Then run this exact powershell command once and report its JSON verbatim:\n'
        + `node '${cli}' direct\n`
        + 'Do not edit files, ask questions, or run any other command.',
      ], {cwd: root, env, encoding: 'utf8', timeout: 180_000, windowsHide: true, maxBuffer: 64 * 1024 * 1024});
      evidence.launchStatus = launched.status;
      evidence.launchError = launched.error?.code ?? launched.signal ?? null;
      writeFileSync(raw, launched.stdout ?? '');
      evidence.capture = {rawCapturePath: raw, sanitizeWith: 'sanitize-host-output.mjs'};
      assert.equal(launched.status, 0, `direct creative run did not complete: ${evidence.launchError}`);
    }
    evidence.storeCreated = existsSync(databasePath);
    assert.equal(evidence.storeCreated, false, 'direct work must not create a coordination store');
    assert.ok(!readdirSync(join(root, '.kai', 'state')).includes('coordination.sqlite'));
  } finally {
    publish('scenario-direct-creative', evidence);
  }
}));

test('a role the installed host does not advertise fails with the exact gap instead of a substituted role', {
  skip: gate,
}, async () => withBareWorkspace(async ({root}) => {
  const env = baseEnv(['kai-core', 'kai-creative']);
  const {run, invoke} = runner(root, env);
  const evidence = {purpose: 'Role unavailability measured against the installed host roster',
    installedPacks: ['kai-core', 'kai-creative'], modelPromptSent: null, result: null, roster: null};
  try {
    const catalog = invoke('capabilities').discovery;
    evidence.modelPromptSent = catalog.modelPromptSent;
    evidence.roster = catalog.roster.map(entry => entry.id).sort();
    const missing = run('prepare', {role: 'eng-builder-software'});
    evidence.result = missing.result;
    assert.equal(missing.status, 1);
    assert.equal(missing.result.code, 'ROLE_UNAVAILABLE');
    assert.equal(missing.result.ok, false);
    assert.equal(missing.result.retryable, false);
    assert.equal(catalog.modelPromptSent, false);
    assert.ok(!existsSync(join(root, '.kai', 'state', 'host', 'preparations')),
      'an unavailable role must not leave a prepared identity behind');
    const present = invoke('prepare', {role: 'creative-lead-design'});
    assert.equal(present.preparation.actor.role, 'creative-lead-design');
    assert.notEqual(present.preparation.agentId, 'kai-engineering:eng-builder-software');
    evidence.installedFallback = present.preparation.agentId;
  } finally {
    publish('scenario-role-unavailable', evidence);
  }
}));
