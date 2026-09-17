import {RuntimeError, canonicalJson, criteriaRef} from './contract.mjs';
import {captureInputBasis} from './input-basis.mjs';
import {readRecord} from './store.mjs';

export const routingActions = new Set([
  'item.grant', 'item.promote', 'item.update', 'item.handoff',
  'question.open', 'question.answer',
]);
export const delegatedActions = new Set(['question.answer', 'item.handoff']);
const fail = message => { throw new RuntimeError('AUTHORITY_REQUIRED', message); };

export function routingBasis(root, store, item) {
  return {criteria: criteriaRef(item.body), inputs: captureInputBasis({root},
    {get: (kind, id) => readRecord(store, kind, id)}, item.body.context_artifacts),
  initiative: item.body.initiative, scopeAuthority: item.body.scope_authority,
  touches: item.body.touches, dependencies: item.body.depends_on};
}

export function requireRoutingScope(root, store, cap, command = null) {
  const scope = cap.request.scope;
  const item = readRecord(store, 'item', scope.itemId);
  if (!item || canonicalJson(routingBasis(root, store, item)) !== canonicalJson(cap.request.routingBasis)) {
    fail('coordinator/delegation criteria, inputs or work scope changed');
  }
  if (!command) return item;
  if (command.recordKind !== 'item' || command.recordId !== scope.itemId
    || !scope.actions.includes(command.kind) || !routingActions.has(command.kind)) fail('bounded routing does not grant this domain action');
  if (command.kind === 'item.handoff' && (command.payload.state !== null || command.payload.subject !== undefined)) {
    fail('bounded routing cannot supply a new subject or domain/acceptance transition');
  }
  if (command.kind === 'item.update' && Object.keys(command.payload.changes ?? command.payload)
    .some(k => !['next_role', 'priority', 'title', 'updated_at'].includes(k))) {
    fail('bounded routing cannot change requirements, inputs or product scope');
  }
  if (command.kind === 'question.answer') {
    const question = readRecord(store, 'question', command.payload.questionId);
    if (!question || question.itemId !== item.id || question.body.recipient !== command.actor.role
      || command.actor.role === 'operator' || command.payload.content.resolves
      || (scope.type === 'delegation' && command.payload.questionId !== scope.questionId)) {
      fail('bounded answer requires the exact addressed non-operator question; conflict resolution needs separate authority');
    }
  }
  return item;
}
