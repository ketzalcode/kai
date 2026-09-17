import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {mkdirSync, writeFileSync, appendFileSync} from 'node:fs';
import {dirname, join, delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID} from 'node:crypto';
import {withWorkspace, seedItem, seedInitiative} from './helpers/coordination-runtime-fixture.mjs';
import {readRecord, readStoreSummary} from '../scripts/lib/coordination-runtime/store.mjs';
import {privateAdmission} from '../scripts/lib/coordination-runtime/migration-files.mjs';
import {readIssued} from '../scripts/lib/coordination-runtime/native-capabilities.mjs';
import {nativeEvents} from '../scripts/lib/coordination-runtime/native-receipts.mjs';

const checkout = join(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(checkout, 'scripts', 'coordinate.mjs');

test('actual native preparation -> reservation -> standalone context -> safe command receipt correspondence', {
  skip: process.env.KAI_TEST_NATIVE_HANDSHAKE !== '1' && 'one explicitly authorized read-only model probe; never automatic',
}, async () => withWorkspace(async ({root, store}) => {
  const env = {...process.env, KAI_COPILOT_PLUGIN_DIRS: ['kai-core', 'kai-engineering', 'kai-creative']
    .map(p => join(checkout, 'plugins', p)).join(delimiter),
  PATH: `${dirname(process.execPath)}${delimiter}${process.env.PATH}`};
  delete env.COPILOT_ALLOW_ALL;
  const run = (verb, body, args = [], launchEnv = env) => {
    const result = spawnSync(process.execPath, [cli, verb, '--root', root, ...args], {
      cwd: root, encoding: 'utf8', input: body === undefined ? '' : JSON.stringify(body), env: launchEnv, timeout: 90_000,
    });
    return {status: result.status, result: JSON.parse(result.stdout)};
  };
  const invoke = (...args) => {
    const output = run(...args);
    assert.equal(output.status, 0, `${args[0]}: ${JSON.stringify(output.result)}`);
    return output.result;
  };
  privateAdmission(root, {admit: true});
  seedInitiative(store);
  seedItem(store, {state: 'ready', next_role: 'eng-builder-software', producer_actor: null,
    producing_actors: [], acceptance_actor: null});
  const prepared = invoke('prepare', {role: 'eng-builder-software'});
  const actor = prepared.preparation.actor;
  assert.equal(actor.runId, prepared.discovery.advertised.sessionId);
  assert.equal(prepared.discovery.modelPromptSent, false);
  // Synthetic human decision in an isolated test home. NEVER touch a real human
  // journal or claim this fixture is actual approval of this or any domain work.
  const syntheticHome = join(root, 'synthetic-human-home');
  const directorEnv = {...env, USERPROFILE: syntheticHome, HOME: syntheticHome};
  const director = {role: 'eng-lead-architecture', runId: env.COPILOT_AGENT_SESSION_ID};
  const command = {operationId: randomUUID(), kind: 'item.grant', actor: director,
    recordKind: 'item', recordId: 'demo', expectedVersion: 1, leaseToken: null,
    payload: {holder: actor, actions: ['evidence.register', 'item.handoff'],
      acquiredAt: new Date().toISOString(), expiresAt: new Date(Date.now() + 3600_000).toISOString()}};
  const request = invoke('request', {type: 'command', command}, [], directorEnv).request;
  const journalDir = join(syntheticHome, '.copilot', 'session-state', director.runId);
  mkdirSync(journalDir, {recursive: true});
  const toolCallId = randomUUID();
  appendFileSync(join(journalDir, 'events.jsonl'), [
    {id: randomUUID(), type: 'tool.execution_start', timestamp: new Date().toISOString(), agentId: null,
      data: {toolCallId, toolName: 'ask_user', arguments: {message: request.message, requestedSchema: request.requestedSchema}}},
    {id: randomUUID(), type: 'tool.execution_complete', timestamp: new Date().toISOString(), agentId: null,
      data: {toolCallId, success: true, result: {content: `User responded: APPROVE ${request.nonce}`,
        detailedContent: `User responded:\ndecision: APPROVE ${request.nonce}`}}},
  ].map(e => JSON.stringify(e)).join('\n') + '\n');
  const capability = invoke('authorize', undefined, ['--request', request.nonce], directorEnv).capability;
  const reserved = invoke('apply', command, ['--capability', capability], directorEnv);
  assert.equal(reserved.data.record.body.lease.holder.runId, actor.runId);
  const before = readStoreSummary(store);
  const workerEnv = {...env, COPILOT_AGENT_SESSION_ID: actor.runId};
  const capture = invoke('request', {type: 'capture', actor, itemId: 'demo', classification: 'internal',
    command: `node '${cli}' claim --root '${root}' --item demo`,
    checks: ['Native actual context matches prepared reservation']}, [], workerEnv).request;
  const identityCapture = invoke('request', {type: 'capture', actor, itemId: 'demo', classification: 'internal',
    command: 'Write-Output $env:COPILOT_AGENT_SESSION_ID',
    checks: ['Actual tool environment identity only; not a coordination CLI receipt']}, [], workerEnv).request;
  const trustedDirectories = [join(checkout, 'scripts'), join(checkout, 'plugins', 'kai-core'),
    join(checkout, 'plugins', 'kai-engineering')];
  const prompt = 'This is an explicitly authorized read-only integration test, not domain work. '
    + 'The test prepared your actual native session and reserved a synthetic test lease before launching you. '
    + 'The human approval fixture is SYNTHETIC; do not report human acceptance. '
    + 'Node 24 is available as node via PATH; no private executable path needs to be invoked. '
    + `Read access is granted only to the trusted runtime source/provider directories needed here: ${trustedDirectories.join('; ')}. `
    + `You may use view to inspect ${cli}, the claim branch in scripts/lib/coordination-runtime/cli.mjs, `
    + 'and native-host.mjs/native-context.mjs and their imported runtime helpers in that same trusted source tree. '
    + 'The claim implementation inspects the existing session/reservation; it does not grant a lease or advance domain state. '
    + 'Do not edit files, start agents, ask questions, retry failed commands, or run other shell commands. '
    + 'First run this exact powershell command once to measure only your environment identity:\n'
    + identityCapture.command + '\nThen inspect the read-only claim implementation if needed and run this exact powershell command once:\n'
    + capture.command + '\nOnly report PROBE_COMPLETE if both commands actually executed successfully. '
    + 'If a command is unavailable or you have a genuine safety concern, stop and explain it; do not bypass the restriction or invent a receipt.';
  const launched = spawnSync(prepared.launch.executable, [
    ...prepared.launch.arguments, '--disable-builtin-mcps', '--available-tools=powershell,view',
    ...trustedDirectories.flatMap(directory => ['--add-dir', directory]),
    '--allow-tool=shell(Write-Output)', '--allow-tool=shell(node)',
    '--deny-tool=write', '--no-ask-user', '--no-auto-update',
    '--no-remote-export', '--no-custom-instructions', '-p', prompt,
  ], {cwd: root, env, stdio: 'ignore', timeout: 120_000, windowsHide: true});
  const evidence = {purpose: 'One real read-only native correspondence probe; human authority fixture is SYNTHETIC',
    host: prepared.discovery.host, preparedActor: actor, trustedReadDirectories: trustedDirectories,
    launchStatus: launched.status, launchError: launched.error?.code ?? launched.signal,
    environmentIdentityMatched: false, actualCLIReceiptMatched: false, toolStarts: []};
  try {
    assert.equal(launched.status, 0, `one native probe did not complete: ${launched.error?.code ?? launched.signal}`);
    for await (const {event} of nativeEvents(workerEnv, ['tool.execution_start'])) {
      evidence.toolStarts.push({tool: event.data.toolName,
        identityCommand: event.data.arguments?.command === identityCapture.command,
        claimCommand: event.data.arguments?.command === capture.command});
    }
    evidence.parentInspection = run('claim', undefined, ['--item', 'demo'], workerEnv);
    evidence.identityCapture = run('capture', {requestId: identityCapture.nonce}, [], workerEnv);
    evidence.claimCapture = run('capture', {requestId: capture.nonce}, [], workerEnv);
    if (evidence.identityCapture.status === 0) {
      const saved = readIssued(root, 'captures', evidence.identityCapture.result.capture);
      const output = saved.result.replace(/<shellId: [^\r\n<>]+ completed with exit code -?\d+>\s*$/, '').trim();
      evidence.environmentIdentityMatched = saved.proof.exit_code === 0 && output === actor.runId;
    }
    if (evidence.claimCapture.status === 0) {
      const saved = readIssued(root, 'captures', evidence.claimCapture.result.capture);
      const output = saved.result.replace(/<shellId: [^\r\n<>]+ completed with exit code -?\d+>\s*$/, '').trim();
      if (saved.proof.exit_code === 0) {
        const actualClaim = JSON.parse(output);
        assert.equal(actualClaim.mode, 'claim');
        assert.equal(actualClaim.actor.runId, actor.runId);
        assert.equal(actualClaim.context.sessionId, actor.runId);
        assert.equal(actualClaim.context.agentId, 'kai-engineering:eng-builder-software');
        assert.ok(Date.parse(actualClaim.context.firstModelAt) >= Date.parse(actualClaim.context.reservedAt));
        assert.equal(saved.actor.runId, actor.runId);
        assert.equal(saved.proof.command[2], capture.command);
        evidence.actualCLIReceiptMatched = true;
      }
    }
    evidence.unchangedRuntime = JSON.stringify(readStoreSummary(store)) === JSON.stringify(before);
    assert.equal(evidence.unchangedRuntime, true, 'native probe did not perform domain writes');
    assert.equal(readRecord(store, 'item', 'demo').version, 2);
    assert.equal(evidence.environmentIdentityMatched, true, JSON.stringify(evidence.identityCapture));
    assert.equal(evidence.actualCLIReceiptMatched, true, JSON.stringify(evidence.claimCapture));
  } finally {
    const summary = structuredClone(evidence);
    if (summary.parentInspection?.result) delete summary.parentInspection.result.leaseToken;
    if (process.env.KAI_TEST_NATIVE_HANDSHAKE_REPORT) {
      writeFileSync(process.env.KAI_TEST_NATIVE_HANDSHAKE_REPORT, JSON.stringify(summary, null, 2));
    }
    console.log(JSON.stringify(summary));
  }
}));
