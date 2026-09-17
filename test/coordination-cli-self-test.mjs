import assert from 'node:assert/strict';
import {test} from 'node:test';
import {spawnSync} from 'node:child_process';
import {mkdirSync, mkdtempSync, rmSync, writeFileSync, existsSync, appendFileSync, readFileSync} from 'node:fs';
import {dirname, join, delimiter} from 'node:path';
import {fileURLToPath} from 'node:url';
import {randomUUID, createHash} from 'node:crypto';
import {criteriaRef, COMMAND_KINDS} from '../scripts/lib/coordination-runtime/contract.mjs';
import {routingActions, delegatedActions} from '../scripts/lib/coordination-runtime/native-routing.mjs';
import {openStore, closeStore} from '../scripts/lib/coordination-runtime/store.mjs';
import {seedItem, seedInitiative, withWorkspace} from './helpers/coordination-runtime-fixture.mjs';
import {writeIssued, readIssued} from '../scripts/lib/coordination-runtime/native-capabilities.mjs';
import {nativeEvents} from '../scripts/lib/coordination-runtime/native-receipts.mjs';

const checkout = join(dirname(fileURLToPath(import.meta.url)), '..');
const cli = join(checkout, 'scripts', 'coordinate.mjs');
const scratch = join(checkout, '.superpowers', 'cli-tests');
mkdirSync(scratch, {recursive: true});
export function workspace(fn, schema = 4) {
  const root = mkdtempSync(join(scratch, 'case-'));
  mkdirSync(join(root, '.kai', 'state'), {recursive: true});
  writeFileSync(join(root, '.kai', 'manifest.json'), JSON.stringify({
    plugin: 'kai-core', version: 'test', schema_version: schema,
    scaffolded: new Date().toISOString(), workspace_id: randomUUID(),
    storage_mode: 'repo-local', workspace_root: '.', state: '.kai/state',
    runs: '.kai/runs', review: '.kai/review', archive: '.kai/archive',
    personal: '.kai/personal', projects: [], areas: [],
  }));
  // A separate real Git root keeps privacy admission independent of the checkout.
  spawnSync('git', ['init', '--quiet', root]);
  try { return fn(root); } finally { rmSync(root, {recursive: true, force: true}); }
}
function invoke(root, verb, args = [], input, env = {}) {
  const result = spawnSync(process.execPath, [cli, verb, '--root', root, ...args], {
    cwd: checkout, encoding: 'utf8', input: input === undefined ? '' : JSON.stringify(input),
    env: {...process.env, ...env},
  });
  return {...result, json: JSON.parse(result.stdout)};
}

test('read-only inspect reports schema without creating a missing database', () => workspace(root => {
  const result = invoke(root, 'inspect');
  assert.equal(result.status, 0);
  assert.equal(result.json.schemaVersion, 4);
  assert.equal(result.json.mode, 'inspect');
  assert.equal(result.json.storeExists, false);
  assert.equal(existsSync(join(root, '.kai', 'state', 'coordination.sqlite')), false);
}));

test('strict parser rejects raw authority, unknown flags and malformed input', () => workspace(root => {
  for (const args of [['--operator'], ['--adapter', 'evil.mjs'], ['--root', root]]) {
    assert.equal(invoke(root, 'apply', args, {}).json.code, 'INVALID_INPUT');
  }
  const result = spawnSync(process.execPath, [cli, 'apply', '--root', root], {
    encoding: 'utf8', input: '{',
  });
  assert.equal(result.status, 1);
  assert.equal(JSON.parse(result.stdout).code, 'INVALID_INPUT');
  assert.ok(result.stderr.length);
}));

test('schema 3 mutation refuses without creating a store; explicit root wins', () => workspace(root => {
  const result = invoke(root, 'apply', [], {}, {KAI_WORKSPACE_ROOT: 'invalid'});
  assert.equal(result.json.code, 'SCHEMA_MISMATCH');
  assert.equal(existsSync(join(root, '.kai', 'state', 'coordination.sqlite')), false);
  assert.equal(invoke(root, 'inspect', [], undefined, {KAI_WORKSPACE_ROOT: 'invalid'}).json.schemaVersion, 3);
}, 3));

test('direct domain commands have no implicit workspace or database requirement', () => {
  const result = spawnSync(process.execPath, [cli, 'direct'], {encoding: 'utf8'});
  assert.equal(result.status, 0);
  assert.equal(JSON.parse(result.stdout).coordinationRequired, false);
});

test('native metadata reader exports only the measured identity fields, never unrelated private data', () => withWorkspace(async ({root}) => {
  const id = randomUUID();
  const directory = join(root, '.copilot', 'session-state', id);
  mkdirSync(directory, {recursive: true});
  writeFileSync(join(directory, 'events.jsonl'), JSON.stringify({id: randomUUID(), type: 'session.start',
    timestamp: new Date().toISOString(), agentId: null,
    data: {sessionId: id, copilotVersion: '1.0.85', context: {cwd: root, environment: 'PRIVATE_MARKER'},
      reasoning: 'PRIVATE_MARKER', cache: 'PRIVATE_MARKER'}}) + '\n');
  const env = {USERPROFILE: root, COPILOT_AGENT_SESSION_ID: id};
  const frames = [];
  for await (const frame of nativeEvents(env, ['session.start'])) frames.push(frame);
  assert.equal(frames[0].event.data.sessionId, id);
  assert.equal(JSON.stringify(frames).includes('PRIVATE_MARKER'), false);
  await assert.rejects(async () => {
    for await (const frame of nativeEvents(env, ['assistant.reasoning'])) void frame;
  }, error => error.code === 'INVALID_INPUT');
}));

const fixture = join(checkout, 'test', 'helpers', 'coordination-cli-native-fixture.mjs');
function native(root, verb, body, args = [], runId = 'native-context-one') {
  const entry = process.env.KAI_TEST_NATIVE_DEFAULT === '1' ? cli : fixture;
  const result = spawnSync(process.execPath, [entry, verb, '--root', root, ...args], {
    encoding: 'utf8', input: body === undefined ? '' : JSON.stringify(body),
    env: {...process.env, USERPROFILE: root, HOME: root, COPILOT_AGENT_SESSION_ID: runId,
      KAI_COPILOT_PLUGIN_DIRS: ['kai-core', 'kai-engineering', 'kai-creative']
        .map(p => join(checkout, 'plugins', p)).join(delimiter)},
  });
  assert.ok(result.stdout, result.stderr);
  return {...result, json: JSON.parse(result.stdout)};
}
function human(root, request, reply = `APPROVE ${request.nonce}`, runId = 'native-context-one', success = true) {
  // SYNTHETIC human response: exercises the native reader, never actual approval.
  const toolCallId = randomUUID();
  const directory = join(root, '.copilot', 'session-state', runId);
  mkdirSync(directory, {recursive: true});
  const events = [
    {id: randomUUID(), timestamp: new Date().toISOString(), type: 'tool.execution_start',
      data: {toolCallId, toolName: 'ask_user', arguments: {message: request.message, requestedSchema: request.requestedSchema}}},
    {id: randomUUID(), timestamp: new Date().toISOString(), type: 'tool.execution_complete',
      data: {toolCallId, success, result: {content: `User responded: ${reply}`, detailedContent: `User responded:\ndecision: ${reply}`}}},
  ];
  appendFileSync(join(directory, 'events.jsonl'), events.map(e => JSON.stringify(e)).join('\n') + '\n');
  return toolCallId;
}
function authorize(root, body, runId = 'native-context-one') {
  const request = native(root, 'request', body, [], runId);
  assert.equal(request.status, 0, JSON.stringify(request.json));
  const call = human(root, request.json.request);
  const authorization = native(root, 'authorize', undefined, ['--request', request.json.request.nonce, '--tool-call', call]);
  assert.equal(authorization.status, 0, JSON.stringify(authorization.json));
  return authorization.json.capability;
}
function initialize(root) {
  const capability = authorize(root, {type: 'maintenance', action: 'init'});
  const result = native(root, 'init', undefined, ['--confirm', '--capability', capability]);
  assert.equal(result.status, 0, JSON.stringify(result.json));
  assert.equal(result.json.storeExists, true, 'maintenance result must describe the resulting store');
  return result;
}

function commandReceipt(root, captureRequest, {exit, text, command = captureRequest.command,
  runId = 'native-context-one'} = {}) {
  const result = text === undefined && exit === undefined
    ? spawnSync('pwsh', ['-NoProfile', '-NonInteractive', '-Command', command], {encoding: 'utf8', cwd: root})
    : spawnSync(process.execPath, ['-e', `process.stdout.write(${JSON.stringify(text ?? '')});process.exit(${exit ?? 0})`], {encoding: 'utf8'});
  assert.equal(result.error, undefined);
  const toolCallId = randomUUID();
  const directory = join(root, '.copilot', 'session-state', runId);
  mkdirSync(directory, {recursive: true});
  appendFileSync(join(directory, 'events.jsonl'), [
    {id: randomUUID(), timestamp: new Date().toISOString(), type: 'tool.execution_start',
      data: {toolCallId, toolName: 'powershell', arguments: {command, description: 'SYNTHETIC native receipt wrapping real process result'}}},
    {id: randomUUID(), timestamp: new Date().toISOString(), type: 'tool.execution_complete',
      data: {toolCallId, success: true, result: {content: `${result.stdout}\n<shellId: fixture completed with exit code ${result.status}>`,
        detailedContent: `${result.stdout}\n<shellId: fixture completed with exit code ${result.status}>`}}},
  ].map(e => JSON.stringify(e)).join('\n') + '\n');
  return toolCallId;
}

test('native explicit init requires a matched strict human response, not success or booleans', () => workspace(root => {
  const result = native(root, 'request', {type: 'maintenance', action: 'init'});
  assert.equal(result.status, 0, JSON.stringify(result.json));
  const request = result.json.request;
  assert.ok(request.message.includes(root));
  assert.ok(request.message.includes(request.nonce));
  for (const reply of ['yes', `APPROVE ${request.nonce} if safe`, `DECLINE ${request.nonce}`, `APPROVE ${randomUUID()}`]) {
    const call = human(root, request, reply);
    const refused = native(root, 'authorize', undefined, ['--request', request.nonce, '--tool-call', call]);
    assert.equal(refused.json.code, 'AUTHORITY_REQUIRED');
    assert.equal(existsSync(join(root, '.kai', 'state', 'coordination.sqlite')), false);
  }
  const failed = human(root, request, `APPROVE ${request.nonce}`, 'native-context-one', false);
  assert.equal(native(root, 'authorize', undefined, ['--request', request.nonce, '--tool-call', failed]).json.code, 'AUTHORITY_REQUIRED');
  const approved = human(root, request);
  const grant = native(root, 'authorize', undefined, ['--request', request.nonce, '--tool-call', approved]);
  assert.equal(grant.status, 0, JSON.stringify(grant.json));
  assert.equal(native(root, 'init', undefined, ['--confirm']).json.code, 'AUTHORITY_REQUIRED');
  assert.equal(native(root, 'init', undefined, ['--confirm', '--capability', grant.json.capability]).status, 0);
  assert.equal(invoke(root, 'inspect').json.storeExists, true);
  assert.equal(native(root, 'init', undefined, ['--confirm', '--capability', grant.json.capability]).json.code, 'VERSION_CONFLICT');
}));

test('a prepared worker cannot backdate a lease to legitimize model work started before reservation', () => workspace(root => {
  const owner = {role: 'eng-lead-architecture', runId: 'native-context-one'};
  seededNativeItem(root, {state: 'ready', producer_actor: null, producing_actors: []});
  const prepared = native(root, 'prepare', {role: 'eng-builder-software'}).json.preparation;
  syntheticContext(root, prepared);
  const command = itemCommand(root, 'item.grant', owner, {holder: prepared.actor, actions: ['item.update'],
    acquiredAt: new Date(Date.now() - 60_000).toISOString(), expiresAt: new Date(Date.now() + 3600_000).toISOString()});
  const granted = exactNative(root, command);
  assert.equal(granted.status, 0, JSON.stringify(granted.json));
  const mutation = {...itemCommand(root, 'item.update', prepared.actor, {title: 'Eager work'}),
    leaseToken: granted.json.data.record.body.lease.token};
  assert.equal(native(root, 'apply', mutation, [], prepared.actor.runId).json.code, 'AUTHORITY_REQUIRED');
  assert.equal(native(root, 'claim', undefined, ['--item', 'demo'], prepared.actor.runId).json.code, 'AUTHORITY_REQUIRED');
}));

test('native receipt lookup uses exact canonical request and nonce without exposing journal contents', () => workspace(root => {
  const request = native(root, 'request', {type: 'maintenance', action: 'init'}).json.request;
  human(root, {...request, message: `${request.message}\nDIFFERENT_SCOPE`});
  const call = human(root, request);
  const found = native(root, 'receipt', undefined, ['--request', request.nonce]);
  assert.equal(found.status, 0, JSON.stringify(found.json));
  assert.equal(found.json.receipt.toolCallId, call);
  assert.equal(JSON.stringify(found.json).includes('User responded:'), false);
  const granted = native(root, 'authorize', undefined, ['--request', request.nonce]);
  assert.equal(granted.status, 0, JSON.stringify(granted.json));
  human(root, request);
  assert.equal(native(root, 'authorize', undefined, ['--request', request.nonce]).json.code, 'AUTHORITY_REQUIRED',
    'duplicate canonical human interactions are ambiguous without an exact selector');
  assert.equal(native(root, 'authorize', undefined, ['--request', request.nonce, '--tool-call', call]).status, 0);
}));

test('native issuer rechecks private admission for every write and use after initial setup', () => workspace(root => {
  const request = native(root, 'request', {type: 'maintenance', action: 'init'}).json.request;
  const call = human(root, request);
  const grant = native(root, 'authorize', undefined, ['--request', request.nonce, '--tool-call', call]).json.capability;
  writeFileSync(join(root, '.git', 'info', 'exclude'), '');
  for (const [verb, body, args] of [
    ['request', {type: 'maintenance', action: 'init'}, []],
    ['authorize', undefined, ['--request', request.nonce, '--tool-call', call]],
    ['init', undefined, ['--confirm', '--capability', grant]],
  ]) {
    const result = native(root, verb, body, args);
    assert.equal(result.status, 1, `${verb}: private admission must not be bypassed by an existing key`);
    assert.equal(result.json.code, 'INVALID_INPUT');
  }
}));

function seededNativeItem(root, overrides = {}) {
  initialize(root);
  const store = openStore({path: join(root, '.kai', 'state', 'coordination.sqlite'), mode: 'write'});
  try { seedInitiative(store); return seedItem(store, {state: 'in-review', acceptance_actor: null, ...overrides}); }
  finally { closeStore(store); }
}
function itemCommand(root, kind, actor, payload) {
  return {operationId: randomUUID(), kind, actor, recordKind: 'item', recordId: 'demo',
    expectedVersion: invoke(root, 'detail', ['--kind', 'item', '--id', 'demo']).json.record.version,
    leaseToken: null, payload};
}
function exactNative(root, command) {
  const capability = authorize(root, {type: 'command', command}, command.actor.runId);
  return native(root, 'apply', command, ['--capability', capability], command.actor.runId);
}

test('broken old registered brief permits exact prospective repair by its scope owner, not old-scope reuse', () => workspace(root => {
  const owner = {role: 'eng-lead-architecture', runId: 'native-context-one'};
  const oldPath = '.kai/state/old-brief.md';
  seededNativeItem(root, {artifact_targets: [oldPath]});
  writeFileSync(join(root, oldPath), 'Registered old brief');
  const oldArtifact = randomUUID();
  assert.equal(exactNative(root, itemCommand(root, 'artifact.register', owner, {
    artifactId: oldArtifact, assetId: randomUUID(), subject: {kind: 'sha256', path: oldPath,
      digest: createHash('sha256').update('Registered old brief').digest('hex')},
    projectId: null, classification: 'internal', mediaType: 'text/markdown',
    title: 'Original registered brief', inputAssetIds: [], at: new Date().toISOString(),
  })).status, 0);
  assert.equal(exactNative(root, itemCommand(root, 'item.update', owner, {
    changes: {context_artifacts: [`artifact:${oldArtifact}`]},
  })).status, 0);
  const oldGrant = authorize(root, {type: 'run', actor: owner, itemId: 'demo', actions: ['item.update']});
  writeFileSync(join(root, oldPath), 'Changed bytes invalidate the registered old brief');
  writeFileSync(join(root, '.kai', 'state', 'replacement.md'), 'Valid replacement brief');
  const repair = itemCommand(root, 'item.update', owner, {changes: {context_artifacts: ['.kai/state/replacement.md']}});
  assert.equal(native(root, 'apply', repair, ['--capability', oldGrant]).json.code, 'EVIDENCE_GAP');
  const wrongOwner = {...repair, actor: {role: 'eng-builder-software', runId: owner.runId}};
  assert.equal(native(root, 'request', {type: 'command', command: wrongOwner}).json.code, 'AUTHORITY_REQUIRED');
  const requested = native(root, 'request', {type: 'command', command: repair});
  assert.equal(requested.status, 0, JSON.stringify(requested.json));
  assert.equal(requested.json.request.priorBasis.gaps.length, 1);
  assert.equal(requested.json.request.prospectiveBasis.inputs.length, 1);
  const call = human(root, requested.json.request);
  const cap = native(root, 'authorize', undefined, ['--request', requested.json.request.nonce, '--tool-call', call]).json.capability;
  const altered = {...repair, payload: {changes: {context_artifacts: []}}};
  assert.equal(native(root, 'apply', altered, ['--capability', cap]).json.code, 'AUTHORITY_REQUIRED');
  writeFileSync(join(root, '.kai', 'state', 'replacement.md'), 'Changed after decision');
  assert.equal(native(root, 'apply', repair, ['--capability', cap]).json.code, 'EVIDENCE_GAP');
  writeFileSync(join(root, '.kai', 'state', 'replacement.md'), 'Valid replacement brief');
  assert.equal(native(root, 'apply', repair, ['--capability', cap]).status, 0);
  assert.equal(native(root, 'apply', repair, ['--capability', cap]).json.operationId, repair.operationId,
    'exact repair redelivery returns its old receipt without reusing the grant for new work');
  const unauthorized = {...repair, actor: {role: 'eng-builder-software', runId: owner.runId}};
  // A different actor cannot turn a broken basis into owner repair authority.
  assert.equal(native(root, 'apply', unauthorized, ['--capability', cap]).json.code, 'AUTHORITY_REQUIRED');
}));

test('synthetic actual-human completion in the producing CLI context has a distinct decision identity', () => workspace(root => {
  const producer = {role: 'creative-lead-design', runId: 'native-context-one'};
  const path = '.kai/state/result.html', bytes = '<h1>Scoped result</h1>';
  const subject = {kind: 'sha256', path, digest: createHash('sha256').update(bytes).digest('hex')};
  seededNativeItem(root, {producer_actor: producer, completion_authority: 'operator',
    change_ref: subject, artifact_targets: [path]});
  writeFileSync(join(root, path), bytes);
  const artifactId = randomUUID(), assetId = randomUUID();
  const registered = exactNative(root, itemCommand(root, 'artifact.register', producer, {
    artifactId, assetId, subject, projectId: null, classification: 'internal',
    mediaType: 'text/html', title: 'Result', inputAssetIds: [], at: new Date().toISOString(),
  }));
  assert.equal(registered.status, 0, JSON.stringify(registered.json));
  const operator = {role: 'operator', runId: producer.runId};
  const item = invoke(root, 'detail', ['--kind', 'item', '--id', 'demo']).json.record;
  const approvalId = randomUUID();
  const approval = itemCommand(root, 'approval.record', operator, {body: {
    schema_version: 1, approval_id: approvalId, item_id: 'demo', authority: operator,
    kind: 'completion', subject, criteria_ref: criteriaRef(item.body), supersedes: [],
    deployment: null, recovery: null, decision: 'approved', evidence_refs: [`artifact:${artifactId}`],
    reason: 'SYNTHETIC human fixture, not real acceptance', created_at: new Date().toISOString(),
  }});
  assert.equal(native(root, 'apply', approval).json.code, 'AUTHORITY_REQUIRED');
  const accepted = exactNative(root, approval);
  assert.equal(accepted.status, 0, JSON.stringify(accepted.json));
  const saved = invoke(root, 'detail', ['--kind', 'approval', '--id', approvalId]).json.record.body;
  assert.notEqual(saved.authority.runId, producer.runId);
  assert.equal(saved.authority.role, 'operator');
  assert.equal(saved.provenance.source, 'host-interaction');
  const impersonation = {...approval, actor: saved.authority,
    payload: {body: {...approval.payload.body, approval_id: randomUUID(), authority: saved.authority}}};
  assert.equal(native(root, 'request', {type: 'command', command: impersonation}).json.code, 'AUTHORITY_REQUIRED');
  for (const [disposition, validity, approvalId] of [['draft', 'provisional', null], ['working', 'current', saved.approval_id]]) {
    const closed = exactNative(root, itemCommand(root, 'asset.transition', operator, {
      assetId, disposition, validity, approvalId, target: null, supersedes: null,
      reason: 'Apply the independently recorded SYNTHETIC human decision', at: new Date().toISOString(),
    }));
    assert.equal(closed.status, 0, JSON.stringify(closed.json));
  }
  const finished = exactNative(root, itemCommand(root, 'item.transition', operator, {
    to: 'completed', at: new Date().toISOString(), reason: 'Apply recorded human acceptance',
  }));
  assert.equal(finished.status, 0, JSON.stringify(finished.json));
  assert.equal(finished.json.data.record.body.acceptance_actor.runId, saved.authority.runId);
  const exported = invoke(root, 'export', ['--item', 'demo']);
  assert.equal(exported.status, 0, JSON.stringify(exported.json));
}));

test('native request expiry, manifest drift and reversed receipt order cannot create authority', () => workspace(root => {
  const request = native(root, 'request', {type: 'maintenance', action: 'init'}).json.request;
  const call = human(root, request);
  const journal = join(root, '.copilot', 'session-state', 'native-context-one', 'events.jsonl');
  const lines = readFileSync(journal, 'utf8').trim().split('\n');
  writeFileSync(journal, `${lines.reverse().join('\n')}\n`);
  assert.equal(native(root, 'authorize', undefined, ['--request', request.nonce, '--tool-call', call]).json.code, 'AUTHORITY_REQUIRED');
  writeFileSync(journal, `${lines.reverse().join('\n')}\n`);
  const cap = native(root, 'authorize', undefined, ['--request', request.nonce, '--tool-call', call]).json.capability;
  const manifestPath = join(root, '.kai', 'manifest.json');
  const manifest = readFileSync(manifestPath, 'utf8');
  writeFileSync(manifestPath, JSON.stringify({...JSON.parse(manifest), version: 'changed'}));
  assert.equal(native(root, 'init', undefined, ['--confirm', '--capability', cap]).json.code, 'AUTHORITY_REQUIRED');
  assert.equal(native(root, 'authorize', undefined, ['--request', request.nonce, '--tool-call', call]).json.code, 'AUTHORITY_REQUIRED');
  writeFileSync(manifestPath, manifest);
  const expired = {...request, nonce: randomUUID(), createdAt: new Date(Date.now() - 7200_000).toISOString(),
    expiresAt: new Date(Date.now() - 3600_000).toISOString()};
  writeIssued(root, 'requests', expired.nonce, expired);
  const expiredCap = {...readIssued(root, 'capabilities', cap), request: expired};
  writeIssued(root, 'capabilities', expired.nonce, expiredCap);
  assert.equal(native(root, 'authorize', undefined, ['--request', expired.nonce, '--tool-call', call]).json.code, 'AUTHORITY_REQUIRED');
  assert.equal(native(root, 'init', undefined, ['--confirm', '--capability', expired.nonce]).json.code, 'AUTHORITY_REQUIRED');
}));

test('every issued coordination action is executable by the command contract', () => workspace(root => {
  const actor = {role: 'eng-lead-architecture', runId: 'native-context-one'};
  seededNativeItem(root, {state: 'ready', producer_actor: null, producing_actors: []});
  for (const action of routingActions) {
    const issued = native(root, 'request', {type: 'coordination', actor, itemId: 'demo', actions: [action]});
    assert.equal(issued.status, 0, JSON.stringify(issued.json));
    for (const kind of issued.json.request.scope.actions) assert.ok(COMMAND_KINDS.has(kind), `issued unexecutable action ${kind}`);
  }
  for (const kind of delegatedActions) assert.ok(COMMAND_KINDS.has(kind), `delegates advertise unexecutable action ${kind}`);
}));

test('unsupported message action cannot be requested as coordination or run authority', () => workspace(root => {
  const actor = {role: 'eng-lead-architecture', runId: 'native-context-one'};
  seededNativeItem(root, {state: 'ready', producer_actor: null, producing_actors: []});
  for (const type of ['coordination', 'run']) {
    const result = native(root, 'request', {type, actor, itemId: 'demo', actions: ['message.append']});
    assert.equal(result.json.code, 'INVALID_INPUT', `${type} must refuse an unexecutable capability before issuance`);
  }
}));

test('a legacy signed coordination request cannot newly authorize an unsupported action', () => workspace(root => {
  const actor = {role: 'eng-lead-architecture', runId: 'native-context-one'};
  seededNativeItem(root, {state: 'ready', producer_actor: null, producing_actors: []});
  const request = native(root, 'request', {type: 'coordination', actor, itemId: 'demo', actions: ['item.handoff']}).json.request;
  const nonce = randomUUID();
  // A genuinely issuer-signed old request with matching visible text and human fixture.
  const legacy = JSON.parse(JSON.stringify(request).replaceAll(request.nonce, nonce).replaceAll('item.handoff', 'message.append'));
  writeIssued(root, 'requests', nonce, legacy);
  human(root, legacy);
  const result = native(root, 'authorize', undefined, ['--request', nonce]);
  assert.equal(result.json.code, 'INVALID_INPUT');
  assert.equal(existsSync(join(root, '.kai', 'state', 'host', 'capabilities', `${nonce}.json`)), false);
}));

for (const action of ['question.answer', 'item.handoff']) {
  test(`issued ${action} delegation and claim refuse legacy unsupported actions`, () => workspace(root => {
    const owner = {role: 'eng-lead-architecture', runId: 'native-context-one'};
    seededNativeItem(root, {state: 'ready', next_role: 'eng-reviewer-code', producer_actor: null, producing_actors: []});
    const prep = native(root, 'prepare', {role: 'eng-reviewer-code'}).json.preparation;
    const capability = authorize(root, {type: 'coordination', actor: owner, itemId: 'demo',
      actions: ['question.open', action]});
    let questionId = null;
    if (action === 'question.answer') {
      questionId = randomUUID();
      const opened = native(root, 'apply', itemCommand(root, 'question.open', owner, {
        questionId, messageId: randomUUID(), parentId: null, recipient: prep.actor.role, kind: 'question',
        createdAt: new Date().toISOString(), content: {questionKind: 'fact', blocking: false,
          context: 'Bounded question', ask: 'Which test?', answerBy: 'Before review'},
        artifactRefs: [], evidenceRefs: [], provenance: 'durable-thread',
      }), ['--capability', capability]);
      assert.equal(opened.status, 0, JSON.stringify(opened.json));
    }
    const body = {actor: owner, itemId: 'demo', preparation: prep.id, actions: [action], questionId};
    const delegated = native(root, 'delegate', body, ['--capability', capability]);
    assert.equal(delegated.status, 0, JSON.stringify(delegated.json));
    syntheticContext(root, prep);
    const args = ['--item', 'demo', '--capability', delegated.json.capability];
    const claimed = native(root, 'claim', undefined, args, prep.actor.runId);
    assert.equal(claimed.status, 0, JSON.stringify(claimed.json));
    assert.deepEqual(claimed.json.actions, [action]);
    assert.ok(claimed.json.actions.every(kind => COMMAND_KINDS.has(kind)));
    // Trusted fixture for a capability issued by the older vocabulary, not raw caller authority.
    const parent = readIssued(root, 'capabilities', capability);
    const legacyParent = randomUUID(), legacyDelegation = randomUUID();
    parent.request.nonce = legacyParent;
    parent.request.scope.actions.push('message.append');
    writeIssued(root, 'capabilities', legacyParent, parent);
    const old = readIssued(root, 'capabilities', delegated.json.capability);
    old.request.nonce = legacyDelegation;
    old.parentCapability = legacyParent;
    old.request.scope.actions.push('message.append');
    writeIssued(root, 'capabilities', legacyDelegation, old);
    const rejectedClaim = native(root, 'claim', undefined, ['--item', 'demo', '--capability', legacyDelegation], prep.actor.runId);
    assert.equal(rejectedClaim.json.code, 'AUTHORITY_REQUIRED', 'claim must not advertise an unexecutable legacy action');
    const rejectedDelegation = native(root, 'delegate', {...body, actions: [action, 'message.append']}, ['--capability', legacyParent]);
    assert.equal(rejectedDelegation.json.code, 'AUTHORITY_REQUIRED');
  }));
}

test('prepared native role delegation answers without a product lease and cannot impersonate another role', () => workspace(root => {
  const owner = {role: 'eng-lead-architecture', runId: 'native-context-one'};
  seededNativeItem(root, {state: 'ready', producer_actor: null, producing_actors: []});
  const prep = native(root, 'prepare', {role: 'eng-reviewer-code'});
  assert.equal(prep.status, 0, JSON.stringify(prep.json));
  const recipient = prep.json.preparation.actor;
  const capability = authorize(root, {type: 'coordination', actor: owner, itemId: 'demo',
    actions: ['question.open', 'question.answer', 'item.handoff', 'item.update', 'item.grant']});
  const questionId = randomUUID(), messageId = randomUUID();
  const opened = native(root, 'apply', itemCommand(root, 'question.open', owner, {
    questionId, messageId, parentId: null, recipient: recipient.role, kind: 'question',
    createdAt: new Date().toISOString(), content: {questionKind: 'fact', blocking: false,
      context: 'Bounded supplied question', ask: 'Which test targets this?', answerBy: 'Before review'},
    artifactRefs: [], evidenceRefs: [], provenance: 'durable-thread',
  }), ['--capability', capability]);
  assert.equal(opened.status, 0, JSON.stringify(opened.json));
  const delegated = native(root, 'delegate', {actor: owner, itemId: 'demo',
    preparation: prep.json.preparation.id, actions: ['question.answer'], questionId}, ['--capability', capability]);
  assert.equal(delegated.status, 0, JSON.stringify(delegated.json));
  syntheticContext(root, prep.json.preparation);
  const answer = itemCommand(root, 'question.answer', recipient, {questionId, messageId: randomUUID(), parentId: messageId,
    recipient: owner.role, kind: 'answer', createdAt: new Date().toISOString(),
    content: {status: 'answered', answer: 'Use the focused regression runner.', lane: 'in-lane'},
    artifactRefs: [], evidenceRefs: [], provenance: 'durable-thread'});
  const args = ['--capability', delegated.json.capability];
  const claimed = native(root, 'claim', undefined, ['--item', 'demo', ...args], recipient.runId);
  assert.equal(claimed.status, 0, JSON.stringify(claimed.json));
  assert.deepEqual(claimed.json.actions, ['question.answer']);
  assert.ok(claimed.json.actions.every(kind => COMMAND_KINDS.has(kind)));
  const impersonated = {...answer, actor: {...recipient, role: owner.role}};
  assert.equal(native(root, 'apply', impersonated, args, recipient.runId).json.code, 'AUTHORITY_REQUIRED');
  assert.equal(native(root, 'apply', answer, args, randomUUID()).json.code, 'AUTHORITY_REQUIRED');
  const answered = native(root, 'apply', answer, args, recipient.runId);
  assert.equal(answered.status, 0, JSON.stringify(answered.json));
  assert.equal(invoke(root, 'detail', ['--kind', 'question', '--id', questionId]).json.record.body.status, 'answered');
  const widen = itemCommand(root, 'item.update', recipient, {title: 'Cannot widen'});
  assert.equal(native(root, 'apply', widen, args, recipient.runId).json.code, 'AUTHORITY_REQUIRED');
  syntheticContext(root, prep.json.preparation, {agentId: 'kai-engineering:eng-lead-architecture', append: true});
  assert.equal(native(root, 'apply', answer, args, recipient.runId).json.code, 'AUTHORITY_REQUIRED',
    'signed role flags cannot override the real selected native agent');
}));

function syntheticContext(root, preparation, {agentId = preparation.agentId, append = false, firstModelAt} = {}) {
  const directory = join(root, '.copilot', 'session-state', preparation.actor.runId);
  mkdirSync(directory, {recursive: true});
  const timestamp = new Date().toISOString();
  const events = [
    ...(!append ? [{id: randomUUID(), timestamp, type: 'session.start', agentId: null,
      data: {sessionId: preparation.actor.runId, copilotVersion: '1.0.85', startTime: timestamp, context: {cwd: root}}}] : []),
    {id: randomUUID(), timestamp, type: 'subagent.selected', agentId: null,
      data: {agentName: agentId, agentDisplayName: preparation.actor.role, tools: ['execute', 'read', 'edit', 'search', 'skill']}},
    ...(!append ? [{id: randomUUID(), timestamp: firstModelAt ?? timestamp, type: 'assistant.turn_start', agentId: null, data: {turnId: '0'}}] : []),
  ];
  // SYNTHETIC native transport frames for process regressions, not actual model work.
  appendFileSync(join(directory, 'events.jsonl'), events.map(e => JSON.stringify(e)).join('\n') + '\n');
}

test('coordinator routing survives implementation-subject changes but not criteria changes or acceptance widening', () => workspace(root => {
  const owner = {role: 'eng-lead-architecture', runId: 'native-context-one'};
  seededNativeItem(root, {state: 'in-review'});
  const capability = authorize(root, {type: 'coordination', actor: owner, itemId: 'demo',
    actions: ['item.handoff', 'item.grant', 'item.update']});
  const path = '.kai/state/new-output.md', bytes = 'New implementation subject';
  writeFileSync(join(root, path), bytes);
  const subject = {kind: 'sha256', path, digest: createHash('sha256').update(bytes).digest('hex')};
  const store = openStore({path: join(root, '.kai', 'state', 'coordination.sqlite'), mode: 'write'});
  try { store.database.prepare("UPDATE records SET body = json_set(body, '$.change_ref', json(?)) WHERE kind='item' AND id='demo'").run(JSON.stringify(subject)); }
  finally { closeStore(store); }
  const route = itemCommand(root, 'item.handoff', owner, {
    toRole: 'eng-reviewer-code', state: null, createdAt: new Date().toISOString(), messageId: randomUUID(), parentId: null,
    content: {did: 'Routed after implementation', needs: 'Independent review', assetState: 'scratch',
      authority: 'eng-reviewer-code', revalidation: 'New basis needs acceptance', questions: []},
    artifactRefs: [], evidenceRefs: [], provenance: 'durable-thread',
  });
  assert.equal(native(root, 'apply', route, ['--capability', capability]).status, 0);
  const acceptance = {...route, operationId: randomUUID(), payload: {...route.payload, state: 'completed'}};
  assert.equal(native(root, 'apply', acceptance, ['--capability', capability]).json.code, 'AUTHORITY_REQUIRED');
  const change = itemCommand(root, 'item.update', owner, {changes: {acceptance: ['New scope']}});
  assert.equal(native(root, 'apply', change, ['--capability', capability]).json.code, 'AUTHORITY_REQUIRED');
  assert.equal(exactNative(root, change).status, 0);
  const old = itemCommand(root, 'item.update', owner, {changes: {next_role: 'eng-reviewer-code'}});
  assert.equal(native(root, 'apply', old, ['--capability', capability]).json.code, 'AUTHORITY_REQUIRED');
}));

test('worker without a standalone journal can request but cannot fabricate operator proof', () => workspace(root => {
  const worker = 'worker-context-no-journal';
  const result = native(root, 'request', {type: 'maintenance', action: 'init'}, [], worker);
  assert.equal(result.status, 0, JSON.stringify(result.json));
  assert.equal(native(root, 'authorize', undefined, ['--request', result.json.request.nonce,
    '--tool-call', 'made-up'], worker).json.code, 'UNSUPPORTED_HOST');
  const call = human(root, result.json.request);
  const auth = native(root, 'authorize', undefined, ['--request', result.json.request.nonce, '--tool-call', call]);
  assert.equal(auth.status, 0, JSON.stringify(auth.json));
  assert.equal(native(root, 'init', undefined, ['--confirm', '--capability', auth.json.capability], worker).status, 0);
}));

test('issued command capability cannot relabel the host context, widen action or alter command', () => workspace(root => {
  initialize(root);
  const command = {
    operationId: randomUUID(), kind: 'initiative.create',
    actor: {role: 'eng-lead-architecture', runId: 'native-context-one'},
    recordKind: 'initiative', recordId: 'demo', expectedVersion: 0, leaseToken: null,
    payload: {body: {
      schema_version: 1, id: 'demo', title: 'Scope', status: 'proposed',
      owner: 'eng-lead-architecture', scope: {current: ['CLI']}, milestones: [], backlog: [],
      north_star_ref: '.kai/state/northstar.md', updated_at: new Date().toISOString(),
    }},
  };
  assert.equal(native(root, 'apply', command).json.code, 'AUTHORITY_REQUIRED');
  const cap = authorize(root, {type: 'command', command});
  assert.equal(native(root, 'apply', command, ['--capability', cap], 'different-context').json.code, 'AUTHORITY_REQUIRED');
  assert.equal(native(root, 'apply', {...command, payload: {body: {...command.payload.body, title: 'Other'}}},
    ['--capability', cap]).json.code, 'AUTHORITY_REQUIRED');
  assert.equal(native(root, 'apply', {...command, authority: {roles: ['operator'], grants: []}},
    ['--capability', cap]).json.code, 'INVALID_INPUT');
  const accepted = native(root, 'apply', command, ['--capability', cap]);
  assert.equal(accepted.status, 0, JSON.stringify(accepted.json));
  assert.equal(native(root, 'apply', command, ['--capability', cap]).json.operationId, command.operationId);
  assert.equal(invoke(root, 'detail', ['--kind', 'initiative', '--id', 'demo']).json.record.version, 1);
}));

test('capture requires exact actual authorized tool execution; retains result without replaying effects', () => workspace(root => {
  initialize(root);
  const request = native(root, 'request', {
    type: 'capture', actor: {role: 'eng-builder-software', runId: 'native-context-one'},
    itemId: null, command: 'node --version', checks: ['Node version'], classification: 'internal',
  });
  assert.equal(request.status, 0, JSON.stringify(request.json));
  const handle = request.json.request.nonce;
  const mismatched = commandReceipt(root, request.json.request, {command: 'some other command'});
  assert.equal(native(root, 'receipt', undefined, ['--request', handle, '--tool-call', mismatched]).json.code, 'EVIDENCE_GAP');
  assert.equal(native(root, 'capture', {requestId: handle}, ['--tool-call', mismatched]).json.code, 'EVIDENCE_GAP');
  const nativeStream = commandReceipt(root, request.json.request, {text: JSON.stringify({
    type: 'assistant.message', data: {content: 'visible', reasoning: 'MUST_NOT_RETAIN_REASONING'},
  })});
  assert.equal(native(root, 'capture', {requestId: handle}, ['--tool-call', nativeStream]).json.code, 'UNSUPPORTED_HOST');
  assert.equal(existsSync(join(root, '.kai', 'state', 'host', 'captures', `${handle}.json`)), false);
  const receipt = commandReceipt(root, request.json.request, {exit: 7, text: 'ACTUAL_FAILURE_MARKER'});
  const captured = native(root, 'capture', {requestId: handle}, ['--tool-call', receipt]);
  assert.equal(captured.status, 0, JSON.stringify(captured.json));
  assert.equal(captured.json.exitCode, 7);
  assert.equal(captured.json.capturedCommand, request.json.request.command);
  const saved = readFileSync(join(root, '.kai', 'state', 'host', 'captures', `${captured.json.capture}.json`), 'utf8');
  assert.ok(saved.includes('ACTUAL_FAILURE_MARKER'));
  assert.ok(saved.includes('node --version'));
  assert.equal(native(root, 'capture', {requestId: handle, exit_code: 0}, ['--tool-call', receipt]).json.code, 'INVALID_INPUT');
}));

test('status lists runtime items without an item selector', () => workspace(root => {
  initialize(root);
  const status = invoke(root, 'status');
  assert.equal(status.status, 0, JSON.stringify(status.json));
  assert.deepEqual(status.json.items, []);
}));

// `apply` refuses a workspace whose private Git metadata drifted, but `export`
// writes the full HTML evidence bundle into `.kai/review/coordination/`. In a
// shared-mode workspace that lost its `.git/info/exclude` entries — a fresh
// clone, a recreated `.git`, a new worktree — that directory is trackable, so
// export must refuse exactly like every other write path.
test('export refuses to write private evidence once shared-mode Git exclusions drift', () => workspace(root => {
  const manifestPath = join(root, '.kai', 'manifest.json');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  writeFileSync(manifestPath, JSON.stringify({...manifest, storage_mode: 'shared'}));
  const item = seededNativeItem(root);
  assert.equal(item.body.id, 'demo');
  const exclude = join(root, '.git', 'info', 'exclude');
  assert.match(readFileSync(exclude, 'utf8'), /\.kai\/review\/coordination\//,
    'init admits the private report directory into shared-mode Git metadata');
  const exported = invoke(root, 'export', ['--item', 'demo']);
  assert.equal(exported.status, 0, JSON.stringify(exported.json));
  assert.equal(existsSync(join(root, '.kai', 'review', 'coordination')), true);
  rmSync(join(root, '.kai', 'review'), {recursive: true, force: true});
  writeFileSync(exclude, '');
  const command = itemCommand(root, 'item.update', {role: 'operator', runId: 'native-context-one'}, {title: 'Drifted'});
  assert.equal(native(root, 'apply', command, []).json.code, 'INVALID_INPUT',
    'the coordinated write path already refuses a drifted shared workspace');
  const refused = invoke(root, 'export', ['--item', 'demo']);
  assert.equal(refused.status, 1, 'export must not write evidence into a Git-trackable directory');
  assert.equal(refused.json.code, 'INVALID_INPUT');
  assert.match(refused.json.message, /ignored/i);
  assert.equal(existsSync(join(root, '.kai', 'review', 'coordination')), false,
    'no derived evidence may survive the refusal');
}));

for (const domain of ['engineering', 'creative']) {
  test(`${domain} real process CLI chain: scope, lease, answer, retained evidence, independent review, acceptance, handoff, export and reopen`, () => workspace(root => {
    initialize(root);
    const at = () => new Date().toISOString();
    const lead = {role: 'eng-lead-architecture', runId: 'scope-context'};
    const prepared = native(root, 'prepare', {role: domain === 'engineering' ? 'eng-builder-software' : 'creative-lead-design'}).json.preparation;
    const producer = prepared.actor;
    const reviewer = {role: domain === 'engineering' ? 'eng-reviewer-code' : 'creative-lead-design', runId: 'independent-review-context'};
    const completion = domain === 'creative' ? {role: 'operator', runId: 'operator-context'} : reviewer;
    const itemId = domain;
    const get = () => invoke(root, 'detail', ['--kind', 'item', '--id', itemId]).json.record;
    const envelope = (kind, actor, payload, extra = {}) => ({
      operationId: randomUUID(), kind, actor, recordKind: 'item', recordId: itemId,
      expectedVersion: get()?.version ?? 0, leaseToken: null, payload, ...extra,
    });
    const exactApply = command => {
      const capability = authorize(root, {type: 'command', command}, command.actor.runId);
      const result = native(root, 'apply', command, ['--capability', capability], command.actor.runId);
      assert.equal(result.status, 0, JSON.stringify(result.json));
      return result.json;
    };
    const initiative = {schema_version: 1, id: 'initiative', title: 'CLI integration', status: 'proposed',
      owner: lead.role, scope: {current: [domain]}, milestones: [], backlog: [],
      north_star_ref: '.kai/state/northstar.md', updated_at: at()};
    exactApply(envelope('initiative.create', lead, {body: initiative}, {recordKind: 'initiative', recordId: initiative.id, expectedVersion: 0}));
    const body = {
      schema_version: 1, id: itemId, title: `${domain} answer`, initiative: initiative.id,
      delivery_class: 'knowledge', state: 'proposed', resume_state: null,
      scope_authority: lead.role, completion_authority: completion.role,
      producer_actor: null, producing_actors: [], acceptance_actor: null,
      priority: 1, next_role: producer.role, outcome: 'An exact independently accepted result',
      acceptance: ['Check result against the supplied brief'], artifact_expectation: domain === 'creative' ? 'owed' : 'none',
      artifact_expectation_reason: domain === 'creative' ? null : 'A retained knowledge answer is sufficient',
      artifact_class: domain === 'creative' ? 'html-demo' : null,
      durability: domain === 'creative' ? 'durable' : null,
      validity_owner: domain === 'creative' ? completion.role : null,
      artifact_targets: ['.kai/state/output.html'], context_artifacts: [], touches: [`${domain}/**`], depends_on: [],
      lease: null, recovery_hold: null, waiting_on_questions: [], required_for_milestone: true,
      review_requirements: [{role: reviewer.role, kind: domain === 'engineering' ? 'code' : 'visual'}],
      change_ref: null, updated_at: at(),
    };
    exactApply(envelope('item.create', lead, {body}, {expectedVersion: 0}));
    // A separately owned design/brief is an input, not verdict evidence for this item.
    const inputId = `${domain}-brief`, inputPath = '.kai/state/brief.md';
    writeFileSync(join(root, inputPath), 'Supplied cross-item design/brief, revision one');
    const inputSubject = {kind: 'sha256', path: inputPath,
      digest: createHash('sha256').update('Supplied cross-item design/brief, revision one').digest('hex')};
    const inputArtifact = randomUUID();
    exactApply(envelope('item.create', lead, {body: {...body, id: inputId,
      artifact_targets: [inputPath], artifact_expectation: 'none', artifact_expectation_reason: 'Supplied brief',
      artifact_class: null, durability: null, validity_owner: null,
    }}, {recordId: inputId, expectedVersion: 0}));
    exactApply(envelope('artifact.register', lead, {artifactId: inputArtifact, assetId: randomUUID(),
      subject: inputSubject, projectId: null, classification: 'internal', mediaType: 'text/markdown',
      title: 'Applicable design/brief', inputAssetIds: [], at: at(),
    }, {recordId: inputId, expectedVersion: 1}));
    exactApply(envelope('item.update', lead, {changes: {context_artifacts: [`artifact:${inputArtifact}`]}}));
    exactApply(envelope('item.promote', lead, {at: at()}));
    const granted = exactApply(envelope('item.grant', lead, {
      holder: producer, actions: ['item.update', 'artifact.register', 'evidence.register', 'item.handoff', 'item.transition', 'question.open'],
      acquiredAt: at(), expiresAt: new Date(Date.now() + 3600_000).toISOString(),
    }));
    const lease = granted.data.record.body.lease.token;
    syntheticContext(root, prepared);
    const acting = (kind, payload) => {
      const command = envelope(kind, producer, payload, {leaseToken: lease});
      const result = native(root, 'apply', command, [], producer.runId);
      assert.equal(result.status, 0, JSON.stringify(result.json));
      return result.json;
    };
    const questionId = randomUUID(), messageId = randomUUID();
    acting('question.open', {questionId, messageId, parentId: null, recipient: lead.role,
      kind: 'question', createdAt: at(), content: {questionKind: 'fact', blocking: false,
        context: 'Supplied brief', ask: 'Use the supplied output target?', answerBy: 'Before handoff'},
      artifactRefs: [], evidenceRefs: [], provenance: 'durable-thread'});
    exactApply(envelope('question.answer', lead, {questionId, messageId: randomUUID(), parentId: messageId,
      recipient: producer.role, kind: 'answer', createdAt: at(), content: {
        status: 'answered', answer: 'Yes, use the declared private output target.', lane: 'in-lane'},
      artifactRefs: [], evidenceRefs: [], provenance: 'durable-thread'}));
    const path = `.kai/runs/native/${producer.runId}/output.html`;
    const bytes = `<html><h1>${domain} result</h1><p>Supplied brief fulfilled.</p></html>`;
    mkdirSync(dirname(join(root, path)), {recursive: true});
    writeFileSync(join(root, path), bytes);
    writeFileSync(join(root, '.kai', 'state', 'output.html'), bytes);
    const subject = {kind: 'sha256', path, digest: createHash('sha256').update(bytes).digest('hex')};
    const artifactId = randomUUID(), assetId = randomUUID();
    acting('artifact.register', {artifactId, assetId, subject, projectId: null,
      classification: 'internal', mediaType: 'text/html', title: `${domain} exact output`, inputAssetIds: [], at: at()});
    acting('item.handoff', {toRole: reviewer.role, state: 'in-review', createdAt: at(), messageId: randomUUID(),
      parentId: null, content: {did: 'Produced exact output', needs: 'Independent review', assetState: 'scratch/provisional',
        authority: completion.role, revalidation: 'Required on any input change', questions: []},
      artifactRefs: [`artifact:${artifactId}`], evidenceRefs: [], provenance: 'durable-thread', subject});
    const retired = native(root, 'apply', envelope('item.update', producer, {title: 'No'}, {leaseToken: lease}), [], producer.runId);
    assert.equal(retired.json.code, 'AUTHORITY_REQUIRED');
    const captureRequest = native(root, 'request', {type: 'capture', actor: producer, itemId,
      command: `& '${process.execPath}' -e 'const assert=require("node:assert/strict");const fs=require("node:fs");assert.match(fs.readFileSync(process.argv[1],"utf8"),/Supplied brief fulfilled/);console.log("Exact output check passed");' '${join(root, path)}'`,
      checks: ['exact output fulfills supplied brief'], classification: 'internal'}, [], producer.runId);
    assert.equal(captureRequest.status, 0, JSON.stringify(captureRequest.json));
    const toolCall = commandReceipt(root, captureRequest.json.request, {runId: producer.runId});
    const capture = native(root, 'capture', {requestId: captureRequest.json.request.nonce}, ['--tool-call', toolCall], producer.runId);
    assert.equal(capture.status, 0, JSON.stringify(capture.json));
    const scoped = authorize(root, {type: 'run', actor: producer, itemId,
      actions: ['item.update']}, producer.runId);
    const wrongAction = native(root, 'apply', envelope('item.promote', producer, {at: at()}),
      ['--capability', scoped], producer.runId);
    assert.equal(wrongAction.json.code, 'AUTHORITY_REQUIRED');
    writeFileSync(join(root, inputPath), 'Changed brief while a scoped capability remains live');
    const changedInput = native(root, 'apply', envelope('item.update', producer, {title: 'Still old scope'}),
      ['--capability', scoped], producer.runId);
    assert.equal(changedInput.json.code, 'EVIDENCE_GAP');
    writeFileSync(join(root, inputPath), 'Supplied cross-item design/brief, revision one');
    const evidenceId = randomUUID();
    const evidence = envelope('evidence.register', producer, {tier: 'observed', body: {
      schema_version: 1, evidence_id: evidenceId, item_id: itemId, kind: 'dod-dimension',
      subject, criteria_ref: criteriaRef(get().body), supersedes: [], dimension: 'verified', outcome: 'clear',
      evidence_refs: [`artifact:${artifactId}`], reason: null, data: {}, created_at: capture.json.capturedAt,
    }});
    const evidenceCap = authorize(root, {type: 'command', command: evidence}, producer.runId);
    assert.equal(native(root, 'apply', evidence, ['--capability', evidenceCap], producer.runId).json.code, 'EVIDENCE_GAP');
    const observed = native(root, 'apply', evidence, ['--capability', evidenceCap, '--capture', capture.json.capture], producer.runId);
    assert.equal(observed.status, 0, JSON.stringify(observed.json));
    const reviewBody = {schema_version: 1, review_id: randomUUID(), item_id: itemId, reviewer,
      kind: body.review_requirements[0].kind, subject, criteria_ref: criteriaRef(get().body),
      supersedes: [], criteria: body.acceptance, verdict: 'approved', finding_refs: [],
      evidence_refs: [`artifact:${artifactId}`, `evidence:${evidenceId}`], created_at: at()};
    const self = {...reviewer, runId: producer.runId};
    const selfCommand = envelope('review.record', self, {body: {...reviewBody, reviewer: self}});
    const selfCap = authorize(root, {type: 'command', command: selfCommand}, self.runId);
    assert.equal(native(root, 'apply', selfCommand, ['--capability', selfCap], self.runId).json.code, 'AUTHORITY_REQUIRED');
    exactApply(envelope('review.record', reviewer, {body: reviewBody}));
    const approvalId = randomUUID();
    exactApply(envelope('approval.record', completion, {body: {
      schema_version: 1, approval_id: approvalId, item_id: itemId, authority: completion,
      kind: 'completion', subject, criteria_ref: criteriaRef(get().body), supersedes: [],
      deployment: null, recovery: null, decision: 'approved',
      evidence_refs: [`artifact:${artifactId}`, `evidence:${evidenceId}`], reason: 'Independent exact acceptance (synthetic human where required)', created_at: at(),
    }}));
    if (domain === 'creative') {
      for (const [disposition, validity, target, approval] of [
        ['draft', 'provisional', null, null], ['working', 'current', '.kai/state/output.html', approvalId],
      ]) exactApply(envelope('asset.transition', completion, {assetId, disposition, validity, target,
        approvalId: approval, supersedes: null, reason: 'Retain accepted creative asset', at: at()}));
    }
    const stale = envelope('item.transition', completion, {to: 'completed', at: at(), reason: 'Try stale acceptance'});
    const staleCap = authorize(root, {type: 'command', command: stale}, completion.runId);
    writeFileSync(join(root, inputPath), 'Revision two changes the applicable design');
    assert.equal(native(root, 'apply', stale, ['--capability', staleCap], completion.runId).json.code, 'EVIDENCE_GAP');
    writeFileSync(join(root, inputPath), 'Supplied cross-item design/brief, revision one');
    exactApply(envelope('item.handoff', completion, {toRole: lead.role, state: 'completed',
      createdAt: at(), messageId: randomUUID(), parentId: null,
      content: {did: 'Accepted exact result', needs: 'No further implementation', assetState: 'retained',
        authority: completion.role, revalidation: 'Changed input is new acceptance work', questions: []},
      artifactRefs: [`artifact:${artifactId}`], evidenceRefs: [`evidence:${evidenceId}`], provenance: 'durable-thread'}));
    const version = get().version;
    const exported = invoke(root, 'export', ['--item', itemId]);
    assert.equal(exported.status, 0, exported.stderr);
    assert.equal(get().version, version);
    const context = invoke(root, 'context', ['--item', itemId]);
    assert.equal(context.status, 0, context.stderr);
    assert.equal(JSON.parse(context.json.context.text).item.state, 'completed');
    assert.equal(invoke(root, 'inspect', ['--deep']).status, 0);
    assert.equal(invoke(root, 'status').json.items.find(item => item.id === itemId).body.state, 'completed');
  }));
}

test('explicit migration and rollback use reviewed offline APIs without leaking issuer material as legacy', () => workspace(root => {
  mkdirSync(join(root, '.kai', 'state', 'Host'), {recursive: true});
  const cap = authorize(root, {type: 'maintenance', action: 'migrate'});
  assert.equal(native(root, 'migrate', undefined, ['--capability', cap]).json.code, 'AUTHORITY_REQUIRED');
  const migrated = native(root, 'migrate', undefined, ['--confirm', '--capability', cap]);
  assert.equal(migrated.status, 0, JSON.stringify(migrated.json));
  assert.equal(migrated.json.schemaVersion, 4);
  assert.equal(invoke(root, 'inspect').json.schemaVersion, 4);
  const legacy = invoke(root, 'legacy');
  assert.equal(legacy.status, 0, JSON.stringify(legacy.json));
  assert.equal(legacy.json.sources.some(source => source.path.toLowerCase().startsWith('.kai/state/host/')), false);
  const rollback = authorize(root, {type: 'maintenance', action: 'rollback'});
  const rolledBack = native(root, 'rollback', undefined, ['--confirm', '--capability', rollback]);
  assert.equal(rolledBack.status, 0, JSON.stringify(rolledBack.json));
  assert.equal(rolledBack.json.schemaVersion, 3);
  assert.equal(rolledBack.json.storeExists, false);
  assert.equal(invoke(root, 'inspect').json.schemaVersion, 3);
}, 3));

test('SQLite-disabled process is a precise host gap; context override cannot exceed 24 KiB', () => workspace(root => {
  const missing = spawnSync(process.execPath, ['--no-experimental-sqlite', cli, 'inspect', '--root', root], {encoding: 'utf8'});
  assert.equal(missing.status, 1);
  assert.equal(JSON.parse(missing.stdout).code, 'UNSUPPORTED_HOST');
  assert.equal(invoke(root, 'context', ['--item', 'any', '--max-bytes', '24577']).json.code, 'INVALID_INPUT');
}));

test('request decoders and missing recovery state fail with typed JSON, never raw exceptions', () => workspace(root => {
  for (const request of [
    {type: 'repair', request: null}, {type: 'run', actor: null, itemId: 'none', actions: []},
    {type: 'maintenance', action: 'init', operator: true}, {type: 'command', command: {}},
  ]) assert.equal(native(root, 'request', request).json.code, 'INVALID_INPUT');
  initialize(root);
  const cap = authorize(root, {type: 'maintenance', action: 'recover-activate'});
  assert.equal(native(root, 'recover', undefined, ['--confirm', '--action', 'activate', '--capability', cap]).json.code, 'RECOVERY_REQUIRED');
}));

test('schema 3 legacy inspection exposes exact selected original bytes without offline admission or a database', () => workspace(root => {
  const bytes = '---\nid: active\nstate: in-progress\n---\nOriginal active work; inspect only.\n';
  writeFileSync(join(root, '.kai', 'state', 'active.md'), bytes);
  const listing = invoke(root, 'legacy');
  assert.equal(listing.status, 0, JSON.stringify(listing.json));
  assert.ok(Array.isArray(listing.json.sources));
  const source = listing.json.sources.find(s => s.path === '.kai/state/active.md');
  assert.ok(source);
  const selected = invoke(root, 'legacy', ['--source', source.sourceId, '--raw']);
  assert.equal(selected.status, 0, JSON.stringify(selected.json));
  assert.equal(Buffer.from(selected.json.sources[0].raw, 'base64').toString(), bytes);
  assert.equal(existsSync(join(root, '.kai', 'state', 'coordination.sqlite')), false);
}, 3));

test('real SQLite writer contention returns retryable exit 2 without replaying the command', () => workspace(root => {
  initialize(root);
  const command = {operationId: randomUUID(), kind: 'initiative.create',
    actor: {role: 'eng-lead-architecture', runId: 'native-context-one'},
    recordKind: 'initiative', recordId: 'busy', expectedVersion: 0, leaseToken: null,
    payload: {body: {schema_version: 1, id: 'busy', title: 'Contention', status: 'proposed',
      owner: 'eng-lead-architecture', scope: {current: ['CLI']}, milestones: [], backlog: [],
      north_star_ref: '.kai/state/northstar.md', updated_at: new Date().toISOString()}}};
  const capability = authorize(root, {type: 'command', command});
  const store = openStore({path: join(root, '.kai', 'state', 'coordination.sqlite'), mode: 'write'});
  try {
    store.database.exec('BEGIN IMMEDIATE');
    const result = native(root, 'apply', command, ['--capability', capability]);
    assert.equal(result.status, 2, JSON.stringify(result.json));
    assert.equal(result.json.code, 'STORE_BUSY');
    assert.equal(result.json.retryable, true);
    store.database.exec('ROLLBACK');
    assert.equal(invoke(root, 'detail', ['--kind', 'initiative', '--id', 'busy']).json.code, 'EVIDENCE_GAP');
  } finally { closeStore(store); }
}));

test('ordinary inspect validates the existing SQLite schema without auditing historical reports', () => workspace(root => {
  initialize(root);
  const good = invoke(root, 'inspect');
  assert.equal(good.status, 0);
  assert.equal(good.json.runtime?.itemCount, 0);
  const store = openStore({path: join(root, '.kai', 'state', 'coordination.sqlite'), mode: 'write'});
  store.database.prepare("UPDATE metadata SET value = '99' WHERE key = 'schema_version'").run();
  closeStore(store);
  const unsupported = invoke(root, 'inspect');
  assert.equal(unsupported.status, 1);
  assert.equal(unsupported.json.code, 'SCHEMA_MISMATCH');
}));
