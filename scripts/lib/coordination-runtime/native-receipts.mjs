import {createReadStream, existsSync, lstatSync, openSync, fstatSync, closeSync} from 'node:fs';
import {join, isAbsolute} from 'node:path';
import {createInterface} from 'node:readline';
import {canonicalJson, RuntimeError} from './contract.mjs';
import {pathHasLink} from '../workspace-path-safety.mjs';

const fail = (code, message) => { throw new RuntimeError(code, message); };
const eventTypes = new Set(['tool.execution_start', 'tool.execution_complete',
  'session.start', 'subagent.selected', 'assistant.turn_start']);
const fields = (value, keys) => Object.fromEntries(keys.filter(k => value?.[k] !== undefined).map(k => [k, value[k]]));
function safeEvent(event) {
  const data = event.data ?? {};
  let selected;
  if (event.type === 'session.start') selected = {
    ...fields(data, ['sessionId', 'copilotVersion', 'startTime']), context: fields(data.context, ['cwd']),
  };
  else if (event.type === 'subagent.selected') selected = fields(data, ['agentName']);
  else if (event.type === 'tool.execution_start') selected = {
    ...fields(data, ['toolCallId', 'toolName']), arguments: fields(data.arguments,
      data.toolName === 'ask_user' ? ['message', 'requestedSchema'] : data.toolName === 'powershell' ? ['command', 'mode'] : []),
  };
  else if (event.type === 'tool.execution_complete') selected = {
    ...fields(data, ['toolCallId', 'success']), result: fields(data.result, ['content', 'detailedContent']),
  };
  else selected = {};
  return {...fields(event, ['id', 'timestamp', 'type', 'agentId']), data: selected};
}
export function contextIdentity(env) {
  const id = env.COPILOT_AGENT_SESSION_ID;
  if (typeof id !== 'string' || !/^[a-z0-9][a-z0-9-]{0,127}$/i.test(id)) {
    fail('UNSUPPORTED_HOST', 'COPILOT_AGENT_SESSION_ID is absent/invalid; read-only and direct work remain available');
  }
  return id;
}

/** Only allowlisted tool start/complete fields escape the streaming reader.
 * Worker contexts often have no journal. A controller may capture its own
 * matched human interaction, but cannot claim the worker's tool execution.
 */
export async function* nativeEvents(env, types = ['tool.execution_start', 'tool.execution_complete']) {
  if (!Array.isArray(types) || types.some(t => !eventTypes.has(t))) fail('INVALID_INPUT', 'native metadata types must be explicitly allowlisted');
  const sessionId = contextIdentity(env);
  const home = env.USERPROFILE || env.HOME;
  if (!home || !isAbsolute(home)) fail('UNSUPPORTED_HOST', 'native session-state home is unavailable');
  const directory = join(home, '.copilot', 'session-state', sessionId);
  const path = join(directory, 'events.jsonl');
  if (!existsSync(path)) fail('UNSUPPORTED_HOST', 'this context has no standalone journal; use prepare, reserve/delegate, then launch the standalone --session-id context. Nested agent IDs are not mapped to parent journals');
  if (pathHasLink(home, path) || !lstatSync(path).isFile() || lstatSync(path).nlink !== 1) {
    fail('UNSUPPORTED_HOST', 'native journal must be an unshared regular local file');
  }
  const stat = lstatSync(path);
  const fd = openSync(path, 'r');
  const opened = fstatSync(fd);
  if (opened.ino !== stat.ino || opened.dev !== stat.dev || opened.nlink !== 1 || !opened.isFile()) {
    closeSync(fd);
    fail('UNSUPPORTED_HOST', 'native journal changed identity while opening');
  }
  if (opened.size === 0) { closeSync(fd); return; }
  const stream = createReadStream(path, {fd, encoding: 'utf8', end: opened.size - 1});
  const lines = createInterface({input: stream, crlfDelay: Infinity});
  let seq = 0;
  try {
    for await (const line of lines) {
      seq++;
      // No assistant messages, reasoning, cache, prompts or usage blobs escape.
      if (!types.some(type => line.includes(type))) continue;
      let event;
      try { event = JSON.parse(line); }
      catch (error) { if (!(error instanceof SyntaxError)) throw error; continue; }
      if (!types.includes(event.type)) continue;
      yield {event: safeEvent(event), seq, sessionId};
    }
  } finally { lines.close(); stream.destroy(); }
}

export async function readNativeTool({env, toolCallId, toolNames, matchesStart}) {
  if (toolCallId === undefined) {
    if (typeof matchesStart !== 'function') fail('INVALID_INPUT', 'receipt lookup requires a canonical issued request');
    const candidates = [];
    for await (const {event} of nativeEvents(env)) {
      if (event.type === 'tool.execution_start' && toolNames.includes(event.data?.toolName)
        && matchesStart(event.data.arguments)) candidates.push(event.data.toolCallId);
    }
    if (candidates.length !== 1) fail('AUTHORITY_REQUIRED', 'canonical request must match one native interaction; use an exact --tool-call when disambiguation is needed');
    [toolCallId] = candidates;
  }
  if (typeof toolCallId !== 'string' || !toolCallId || toolCallId.length > 256) fail('INVALID_INPUT', 'native --tool-call ID must be nonempty and bounded');
  let start, complete, starts = 0, completions = 0, startSeq, completeSeq, sessionId;
  for await (const frame of nativeEvents(env)) {
      const {event, seq} = frame;
      sessionId = frame.sessionId;
      const data = event.data;
      if (data?.toolCallId !== toolCallId) continue;
      if (event.agentId) {
        fail('UNSUPPORTED_HOST', 'this receipt belongs to a nested host agent; agentId is not a measured mapping to COPILOT_AGENT_SESSION_ID. Use a trusted host-owned identity/capture registry');
      }
      if (event.type === 'tool.execution_start') {
        starts++; startSeq = seq;
        if (!toolNames.includes(data.toolName)) fail('UNSUPPORTED_HOST', 'native tool receipt type is not supported for this operation');
        start = {id: event.id, timestamp: event.timestamp, name: data.toolName, arguments: data.arguments};
      } else if (event.type === 'tool.execution_complete') {
        completions++; completeSeq = seq;
        complete = {id: event.id, timestamp: event.timestamp, success: data.success,
          content: data.result?.content, detailedContent: data.result?.detailedContent};
      }
  }
  if (starts !== 1 || completions !== 1 || startSeq >= completeSeq) {
    fail('AUTHORITY_REQUIRED', 'native receipt requires exactly one ordered matching start and completion');
  }
  if (!start.timestamp || Number.isNaN(Date.parse(start.timestamp))
    || !complete.timestamp || Number.isNaN(Date.parse(complete.timestamp)) || Date.parse(complete.timestamp) > Date.now()
    || Date.parse(start.timestamp) > Date.parse(complete.timestamp)) {
    fail('EVIDENCE_GAP', 'native completion has no valid capture timestamp');
  }
  return {sessionId, toolCallId, start, complete};
}

export async function matchHumanDecision({env, request, toolCallId}) {
  const receipt = await readNativeTool({env, toolCallId, toolNames: ['ask_user'], matchesStart: args =>
    args?.message === request.message && canonicalJson(args?.requestedSchema ?? null) === canonicalJson(request.requestedSchema)});
  const reply = `APPROVE ${request.nonce}`;
  if (receipt.complete.success !== true
    || receipt.start.arguments?.message !== request.message
    || canonicalJson(receipt.start.arguments?.requestedSchema ?? null) !== canonicalJson(request.requestedSchema)
    || receipt.complete.content !== `User responded: ${reply}`
    || receipt.complete.detailedContent !== `User responded:\ndecision: ${reply}`
    || Date.parse(receipt.start.timestamp) < Date.parse(request.createdAt)
    || Date.parse(receipt.complete.timestamp) > Date.parse(request.expiresAt)) {
    fail('AUTHORITY_REQUIRED', 'operator decision requires the exact visible nonce/scope/action and unconditional strict APPROVE reply; tool success alone is not approval');
  }
  return {source: 'host-interaction', reference: `host:copilot:${receipt.sessionId}:${receipt.complete.id}`,
    attributed_to: 'Operator', captured_at: receipt.complete.timestamp,
    requestNonce: request.nonce, toolCallId: receipt.toolCallId, sessionId: receipt.sessionId,
    startEventId: receipt.start.id, completeEventId: receipt.complete.id};
}
