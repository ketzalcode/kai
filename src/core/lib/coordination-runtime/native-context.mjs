import {RuntimeError} from './contract.mjs';
import {contextIdentity, nativeEvents} from './native-receipts.mjs';
import {normalized} from '../workspace-path-safety.mjs';

const fail = message => { throw new RuntimeError('AUTHORITY_REQUIRED', message); };

/** Only root-session metadata is identity evidence. subagent.selected is the
 * measured root CLI role-selection event, not a nested worker-ID mapping.
 */
export async function verifyNativeContext({env, root, preparation, reservedAt}) {
  const id = contextIdentity(env);
  if (id !== preparation.actor.runId) fail('prepared role belongs to another actual host context');
  let start, agent, firstModelAt;
  for await (const {event} of nativeEvents(env, ['session.start', 'subagent.selected', 'assistant.turn_start'])) {
    if (event.agentId) continue;
    if (event.type === 'session.start') {
      if (start) fail('standalone context has ambiguous session starts');
      start = {id: event.id, timestamp: event.timestamp, sessionId: event.data?.sessionId,
        version: event.data?.copilotVersion, cwd: event.data?.context?.cwd};
    } else if (event.type === 'subagent.selected') {
      agent = event.data?.agentName;
    } else {
      if (!start || agent !== preparation.agentId) fail('native model turn did not start in its prepared role');
      if (firstModelAt === undefined) firstModelAt = event.timestamp;
    }
  }
  if (!start || start.sessionId !== id || start.version !== '1.0.85'
    || typeof start.cwd !== 'string' || normalized(start.cwd) !== normalized(root)
    || agent !== preparation.agentId) fail('native session identity, workspace or selected agent does not match its preparation');
  if (!Number.isFinite(Date.parse(start.timestamp)) || Date.parse(start.timestamp) > Date.parse(firstModelAt)
    || !Number.isFinite(Date.parse(firstModelAt)) || !Number.isFinite(Date.parse(reservedAt))
    || Date.parse(firstModelAt) < Date.parse(reservedAt) || Date.parse(firstModelAt) > Date.now()) {
    fail('native model work must start after its persisted reservation/delegation');
  }
  return {sessionId: id, agentId: agent, firstModelAt, reservedAt,
    reference: `host:copilot:${id}:${start.id}`};
}
