import {bindEvidenceTransaction} from './evidence-context.mjs';
import {
  RuntimeError,
  canonicalJson,
  validateAuthority,
  validateCommand,
} from './contract.mjs';
import {commandKind} from './schema.mjs';
import {
  applyOperation,
  readMessageOperation,
} from './store.mjs';
import {requireActorAvailable} from './authority.mjs';
import {
  currentDirectionForStore,
  parentHandlers,
} from './hierarchy-engine.mjs';
import {taskHandlers} from './task-engine.mjs';

export {
  GRANTABLE_STATES,
  SHIP_STATES,
  taskStateSatisfies,
} from './task-engine.mjs';

function fail(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}

const handlers = new Map([
  ...parentHandlers,
  ...taskHandlers,
]);

function duplicateMessageReceipt(store, command) {
  const messageId = command.payload?.messageId;
  if (typeof messageId !== 'string') return null;
  const existing = readMessageOperation(store, messageId);
  if (!existing) return null;
  const expectedEvent = {
    kind: command.kind,
    actor: command.actor,
    recordKind: command.recordKind,
    recordId: command.recordId,
    payload: command.payload,
  };
  if (canonicalJson(existing.event) !== canonicalJson(expectedEvent)) {
    fail('OPERATION_CONFLICT',
      `message/${messageId} was already used with different content`);
  }
  return existing.receipt;
}

export function applyCommand(store, command, authority) {
  validateCommand(command);
  const handlerKey = commandKind(command.kind).handler;
  if (!handlers.has(handlerKey)) {
    fail('INVALID_INPUT', `${command.kind} requires its dedicated evidence producer`);
  }
  validateAuthority(authority);
  requireActorAvailable(command, authority);
  const duplicate = duplicateMessageReceipt(store, command);
  if (duplicate) return duplicate;
  try {
    return applyOperation(store, command, (current, tx) => {
      bindEvidenceTransaction(store, tx);
      const handler = handlers.get(handlerKey);
      return handler(current, tx, command, authority, {
        direction: directionRef => currentDirectionForStore(store, directionRef),
      });
    });
  } catch (error) {
    if (command.payload?.messageId
      && (error?.code === 'VERSION_CONFLICT'
        || error?.code === 'OPERATION_CONFLICT')) {
      const racedDuplicate = duplicateMessageReceipt(store, command);
      if (racedDuplicate) return racedDuplicate;
    }
    throw error;
  }
}
