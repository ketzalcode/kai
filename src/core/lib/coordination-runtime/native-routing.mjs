import {
  PARENT_COMMAND_KINDS,
  RuntimeError,
  canonicalJson,
  criteriaRef,
} from './contract.mjs';
import {captureInputBasis} from './input-basis.mjs';
import {readRecord} from './store.mjs';

export const routingActions = new Set([
  'task.grant', 'task.promote', 'task.update', 'task.handoff',
  'question.open', 'question.answer',
]);
export const delegatedActions = new Set(['question.answer', 'task.handoff']);
export const parentGovernanceActions = new Set(PARENT_COMMAND_KINDS);
const fail = message => { throw new RuntimeError('AUTHORITY_REQUIRED', message); };

export function routingBasis(root, store, task) {
  return {criteria: criteriaRef(task, (kind, id) => readRecord(store, kind, id)), inputs: captureInputBasis({root},
    {get: (kind, id) => readRecord(store, kind, id)}, task.body.context_artifacts),
  feature: task.body.feature_id, requirements: task.body.satisfies,
  scopeAuthority: task.body.scope_authority,
  touches: task.body.touches, dependencies: task.body.depends_on};
}

export function requireRoutingScope(root, store, cap, command = null) {
  const scope = cap.request.scope;
  const task = readRecord(store, 'task', scope.taskId);
  if (!task || canonicalJson(routingBasis(root, store, task)) !== canonicalJson(cap.request.routingBasis)) {
    fail('coordinator/delegation criteria, inputs or work scope changed');
  }
  if (!command) return task;
  if (command.recordKind !== 'task' || command.recordId !== scope.taskId
    || !scope.actions.includes(command.kind) || !routingActions.has(command.kind)) fail('bounded routing does not grant this domain action');
  if (command.kind === 'task.handoff' && (command.payload.state !== null || command.payload.subject !== undefined)) {
    fail('bounded routing cannot supply a new subject or domain/acceptance transition');
  }
  if (command.kind === 'task.update' && Object.keys(command.payload.changes ?? command.payload)
    .some(k => !['next_role', 'priority', 'title', 'updated_at'].includes(k))) {
    fail('bounded routing cannot change requirements, inputs or product scope');
  }
  if (command.kind === 'question.answer') {
    const question = readRecord(store, 'question', command.payload.questionId);
    if (question?.subject?.kind !== 'task' || question.subject.id !== task.id
      || question.body.recipient !== command.actor.role
      || command.actor.role === 'operator' || command.payload.content.resolves
      || (scope.type === 'delegation' && command.payload.questionId !== scope.questionId)) {
      fail('bounded answer requires the exact addressed non-operator question; conflict resolution needs separate authority');
    }
  }
  return task;
}
