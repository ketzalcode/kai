const frozen = value => Object.freeze(value);
const mutationRefused = () => {
  throw new TypeError('coordination schema collections are read-only');
};
const readonlyMap = entries => {
  const data = new Map(entries);
  Object.defineProperties(data, {
    set: {value: mutationRefused},
    delete: {value: mutationRefused},
    clear: {value: mutationRefused},
  });
  return frozen(data);
};
const readonlySet = values => {
  const data = new Set(values);
  Object.defineProperties(data, {
    add: {value: mutationRefused},
    delete: {value: mutationRefused},
    clear: {value: mutationRefused},
  });
  return frozen(data);
};
const record = validator => frozen({validator});
const command = (subjectKind, authority, validator, handler, allowedMutations = []) =>
  frozen({
    subjectKind,
    authority: frozen(authority),
    validator,
    handler,
    allowedMutations: frozen(allowedMutations),
  });

const parentUpdateFields = new Map([
  ['epic', [
    'title',
    'owner',
    'scope_authority',
    'completion_authority',
    'priority',
    'outcome',
    'acceptance',
    'direction_ref',
    'contribution',
    'scope_fit',
    'required_features',
    'optional_features',
    'updated_at',
  ]],
  ['feature', [
    'title',
    'owner',
    'scope_authority',
    'completion_authority',
    'priority',
    'outcome',
    'acceptance',
    'required_requirements',
    'optional_requirements',
    'depends_on_features',
    'updated_at',
  ]],
  ['requirement', [
    'title',
    'owner',
    'scope_authority',
    'completion_authority',
    'priority',
    'outcome',
    'acceptance',
    'required_tasks',
    'optional_tasks',
    'updated_at',
  ]],
]);
const taskUpdateFields = [
  'title',
  'priority',
  'next_role',
  'outcome',
  'acceptance',
  'artifact_expectation',
  'artifact_expectation_reason',
  'artifact_class',
  'durability',
  'validity_owner',
  'artifact_targets',
  'context_artifacts',
  'touches',
  'depends_on',
  'updated_at',
];

const records = readonlyMap([
  ['epic', record('hierarchy')],
  ['feature', record('hierarchy')],
  ['requirement', record('hierarchy')],
  ['task', record('task')],
  ['question', record('contract')],
  ['attempt', record('contract')],
  ['host-attempt', record('host')],
  ['artifact', record('contract')],
  ['asset', record('contract')],
  ['evidence', record('contract')],
  ['review', record('contract')],
  ['approval', record('contract')],
  ['effect', record('host')],
  ['message', record('contract')],
  ['grant', record('contract')],
]);

const commandEntries = new Map();
for (const kind of ['epic', 'feature', 'requirement']) {
  commandEntries.set(`${kind}.create`,
    command(kind, ['host'], 'hierarchy', `${kind}.create`));
  commandEntries.set(`${kind}.update`,
    command(kind, ['host', 'named'], 'hierarchy', `${kind}.update`, parentUpdateFields.get(kind)));
  commandEntries.set(`${kind}.activate`,
    command(kind, ['host'], 'hierarchy', `${kind}.activate`, ['state', 'updated_at']));
  commandEntries.set(`${kind}.hold`,
    command(kind, ['named'], 'hierarchy', `${kind}.hold`, ['hold', 'updated_at']));
  commandEntries.set(`${kind}.release`,
    command(kind, ['named'], 'hierarchy', `${kind}.release`, ['hold', 'updated_at']));
  commandEntries.set(`${kind}.complete`,
    command(kind, ['host'], 'hierarchy', `${kind}.complete`,
      ['state', 'completion_disposition', 'updated_at']));
}

commandEntries.set('task.create',
  command('task', ['grant'], 'task', 'task.create'));
commandEntries.set('task.update',
  command('task', ['acting'], 'task', 'task.update', taskUpdateFields));
commandEntries.set('task.promote',
  command('task', ['named'], 'task', 'task.promote', ['state', 'updated_at']));
commandEntries.set('task.grant',
  command('task', ['grant'], 'task', 'task.grant',
    ['state', 'resume_state', 'producer_actor', 'producing_actors', 'next_role', 'lease', 'updated_at']));
commandEntries.set('task.transition',
  command('task', ['acting', 'named'], 'task', 'task.transition',
    ['state', 'resume_state', 'acceptance_actor', 'next_role', 'lease', 'change_ref', 'updated_at']));
commandEntries.set('task.handoff',
  command('task', ['acting', 'leased', 'named'], 'task', 'task.handoff',
    ['state', 'resume_state', 'acceptance_actor', 'next_role', 'lease', 'change_ref', 'updated_at']));
commandEntries.set('task.restore',
  command('task', ['host'], 'task', 'task.restore',
    ['state', 'resume_state', 'next_role', 'recovery_hold', 'updated_at']));
commandEntries.set('question.open',
  command('hierarchy', ['acting', 'grant'], 'message', 'question.open',
    ['state', 'resume_state', 'lease', 'waiting_on_questions', 'updated_at']));
commandEntries.set('question.answer',
  command('hierarchy', ['actor', 'grant', 'host'], 'message', 'question.answer',
    ['state', 'resume_state', 'lease', 'waiting_on_questions', 'updated_at']));
commandEntries.set('attempt.recover',
  command('task', ['grant', 'host'], 'recovery', 'attempt.recover',
    ['state', 'resume_state', 'next_role', 'lease', 'producer_actor',
      'producing_actors', 'recovery_hold', 'updated_at']));

commandEntries.set('attempt.start',
  command('task', ['host'], 'host', 'attempt.start'));
commandEntries.set('attempt.result',
  command('task', ['host'], 'host', 'attempt.result',
    ['observations', 'gaps', 'status']));
commandEntries.set('effect.intent',
  command('task', ['host'], 'host', 'effect.intent'));
commandEntries.set('effect.result',
  command('task', ['host'], 'host', 'effect.result',
    ['observations', 'gaps', 'outcome']));
for (const kind of [
  'artifact.register',
  'asset.transition',
  'evidence.register',
  'review.record',
  'approval.record',
]) {
  commandEntries.set(kind, command('hierarchy',
    ['acting', 'leased', 'named', 'host'], 'producer', kind));
}
const commands = readonlyMap(commandEntries);

export const COORDINATION_SCHEMA = frozen({records, commands});

export const RECORD_KINDS = readonlySet(records.keys());
export const COMMAND_KINDS = readonlySet(commands.keys());
export const HIERARCHY_KINDS = readonlySet(
  [...records].filter(([, declaration]) =>
    declaration.validator === 'hierarchy' || declaration.validator === 'task')
    .map(([kind]) => kind),
);
export const PARENT_COMMAND_KINDS = readonlySet(
  [...commands].filter(([, declaration]) => declaration.validator === 'hierarchy')
    .map(([kind]) => kind),
);
export const TASK_COMMAND_KINDS = readonlySet(
  [...commands].filter(([, declaration]) => declaration.validator === 'task')
    .map(([kind]) => kind),
);
export const HOST_COMMAND_KINDS = readonlySet(
  [...commands].filter(([, declaration]) => declaration.validator === 'host')
    .map(([kind]) => kind),
);

export function recordKind(kind) {
  return records.get(kind) ?? null;
}

export function commandKind(kind) {
  return commands.get(kind) ?? null;
}
