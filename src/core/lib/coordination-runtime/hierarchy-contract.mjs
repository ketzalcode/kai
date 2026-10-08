import {createHash} from 'node:crypto';
import {
  HEX_DIGEST,
  assertBoolean,
  assertChangedOnly,
  assertExactKeys,
  assertNonEmptyString,
  assertNullableString,
  assertStringArray,
  assertTimestamp,
  canonicalJson,
  invalid,
  isPlainObject,
  parseEpicId,
  parseTypedId,
  validateActor,
  validateChangesPayload,
} from './contract-primitives.mjs';
import {validateTaskBody} from './task-contract.mjs';

const COMMON_PARENT_FIELDS = [
  'schema_version',
  'id',
  'title',
  'state',
  'completion_disposition',
  'owner',
  'scope_authority',
  'completion_authority',
  'priority',
  'outcome',
  'acceptance',
  'hold',
  'created_at',
  'updated_at',
];

const FEATURE_DEPENDENCY_REQUIRES = new Set(['delivered']);

// Composition descends one kind at a time, so the directed graph cannot cycle
// by construction. `singleParent` records which children one parent may claim:
// a Task is composed by several Requirements inside its one Feature.
const COMPOSITION_EDGES = Object.freeze({
  epic: {
    childKind: 'feature',
    lists: ['required_features', 'optional_features'],
    parentField: 'epic_id',
    singleParent: true,
  },
  feature: {
    childKind: 'requirement',
    lists: ['required_requirements', 'optional_requirements'],
    parentField: 'feature_id',
    singleParent: true,
  },
  requirement: {
    childKind: 'task',
    lists: ['required_tasks', 'optional_tasks'],
    parentField: null,
    singleParent: false,
  },
});

export const HIERARCHY_KINDS = new Set(['epic', 'feature', 'requirement', 'task']);
export const PARENT_STATES = new Set(['proposed', 'active', 'completed']);
export const PARENT_DISPOSITIONS = Object.freeze({
  epic: new Set(['achieved', 'cancelled', 'superseded']),
  feature: new Set(['delivered', 'cancelled', 'superseded']),
  requirement: new Set(['satisfied', 'cancelled', 'superseded']),
});

export const PARENT_COMMAND_KINDS = new Set([
  'epic.create',
  'epic.update',
  'epic.activate',
  'epic.hold',
  'epic.release',
  'epic.complete',
  'feature.create',
  'feature.update',
  'feature.activate',
  'feature.hold',
  'feature.release',
  'feature.complete',
  'requirement.create',
  'requirement.update',
  'requirement.activate',
  'requirement.hold',
  'requirement.release',
  'requirement.complete',
]);

const PARENT_UPDATE_FIELDS = new Map([
  ['epic', new Set([
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
  ])],
  ['feature', new Set([
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
  ])],
  ['requirement', new Set([
    'title',
    'owner',
    'scope_authority',
    'completion_authority',
    'priority',
    'outcome',
    'acceptance',
    'required_tasks',
    'optional_tasks',
  ])],
]);

function validateDirectionRef(value, label) {
  assertExactKeys(value, new Set(['path', 'hash', 'goal']), label);
  assertNonEmptyString(value.path, `${label}.path`);
  if (!HEX_DIGEST.test(value.hash)) invalid(`${label}.hash must be SHA-256`);
  assertNonEmptyString(value.goal, `${label}.goal`);
}

function validateHold(value, label) {
  if (value === null) return;
  assertExactKeys(value, new Set([
    'reason',
    'set_by',
    'set_at',
    'release_condition',
    'basis_refs',
  ]), label);
  assertNonEmptyString(value.reason, `${label}.reason`);
  validateActor(value.set_by, `${label}.set_by`);
  assertTimestamp(value.set_at, `${label}.set_at`);
  assertNonEmptyString(value.release_condition, `${label}.release_condition`);
  assertStringArray(value.basis_refs, `${label}.basis_refs`);
}

function validatePackScopedIds(value, label, kind, pack = null) {
  assertStringArray(value, label);
  for (const [index, id] of value.entries()) {
    const parsed = parseTypedId(id, kind, `${label}[${index}]`);
    if (pack !== null && parsed.pack !== pack) invalid(`${label} must stay within the ${pack} pack`);
  }
}

function assertDisjointLists(required, optional, label) {
  const overlap = required.find(id => optional.includes(id));
  if (overlap) invalid(`${label} required and optional child lists must not overlap`);
}

function validateFeatureDependencies(value, label) {
  if (!Array.isArray(value)) invalid(`${label} must be an array`);
  const seen = new Set();
  for (const [index, dependency] of value.entries()) {
    assertExactKeys(dependency, new Set(['feature', 'requires']), `${label}[${index}]`);
    parseTypedId(dependency.feature, 'feature', `${label}[${index}].feature`);
    if (!FEATURE_DEPENDENCY_REQUIRES.has(dependency.requires)) {
      invalid(`${label}[${index}].requires is unsupported`);
    }
    if (seen.has(dependency.feature)) {
      invalid(`${label} contains duplicate feature "${dependency.feature}"`);
    }
    seen.add(dependency.feature);
  }
}

function validateCommonParentBody(body, label, kind, extraFields) {
  assertExactKeys(body, new Set([...COMMON_PARENT_FIELDS, ...extraFields]), label);
  if (body.schema_version !== 1) invalid(`${label}.schema_version must be 1`);
  for (const key of ['id', 'title', 'owner', 'scope_authority', 'completion_authority', 'outcome']) {
    assertNonEmptyString(body[key], `${label}.${key}`);
  }

  if (kind === 'epic') {
    parseEpicId(body.id, `${label}.id`);
  } else {
    assertNonEmptyString(body.pack, `${label}.pack`);
    const parsed = parseTypedId(body.id, kind, `${label}.id`);
    if (parsed.pack !== body.pack) invalid(`${label}.pack must match its typed id`);
  }

  if (!PARENT_STATES.has(body.state)) invalid(`${label}.state is unsupported`);
  if (body.state === 'completed') {
    if (body.completion_disposition === null) {
      invalid(`${label}.completed parents require a completion_disposition`);
    }
    if (!PARENT_DISPOSITIONS[kind].has(body.completion_disposition)) {
      invalid(`${label}.completion_disposition is unsupported for ${kind}`);
    }
  } else if (body.completion_disposition !== null) {
    invalid(`${label}.completion_disposition must be null until the parent is completed`);
  }

  if (!Number.isSafeInteger(body.priority) || body.priority < 0) {
    invalid(`${label}.priority must be a non-negative safe integer`);
  }
  assertStringArray(body.acceptance, `${label}.acceptance`, {nonEmpty: true});
  validateHold(body.hold, `${label}.hold`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}

function validateEpicBody(body, label) {
  validateCommonParentBody(body, label, 'epic', [
    'direction_ref',
    'contribution',
    'scope_fit',
    'required_features',
    'optional_features',
  ]);
  validateDirectionRef(body.direction_ref, `${label}.direction_ref`);
  assertNonEmptyString(body.contribution, `${label}.contribution`);
  assertNonEmptyString(body.scope_fit, `${label}.scope_fit`);
  validatePackScopedIds(body.required_features, `${label}.required_features`, 'feature');
  validatePackScopedIds(body.optional_features, `${label}.optional_features`, 'feature');
  assertDisjointLists(body.required_features, body.optional_features, `${label}.required_features`);
}

function validateFeatureBody(body, label) {
  validateCommonParentBody(body, label, 'feature', [
    'pack',
    'epic_id',
    'required_requirements',
    'optional_requirements',
    'depends_on_features',
  ]);
  parseEpicId(body.epic_id, `${label}.epic_id`);
  validatePackScopedIds(body.required_requirements, `${label}.required_requirements`, 'requirement', body.pack);
  validatePackScopedIds(body.optional_requirements, `${label}.optional_requirements`, 'requirement', body.pack);
  assertDisjointLists(body.required_requirements, body.optional_requirements, `${label}.required_requirements`);
  validateFeatureDependencies(body.depends_on_features, `${label}.depends_on_features`);
}

function validateRequirementBody(body, label) {
  validateCommonParentBody(body, label, 'requirement', [
    'pack',
    'feature_id',
    'required_tasks',
    'optional_tasks',
  ]);
  const feature = parseTypedId(body.feature_id, 'feature', `${label}.feature_id`);
  if (feature.pack !== body.pack) invalid(`${label}.feature_id must stay within the ${body.pack} pack`);
  validatePackScopedIds(body.required_tasks, `${label}.required_tasks`, 'task', body.pack);
  validatePackScopedIds(body.optional_tasks, `${label}.optional_tasks`, 'task', body.pack);
  assertDisjointLists(body.required_tasks, body.optional_tasks, `${label}.required_tasks`);
}

function resolveLookup(lookup, kind, id) {
  if (!lookup) return null;
  if (typeof lookup === 'function') return lookup(kind, id) ?? null;
  if (lookup instanceof Map) {
    if (lookup.has(kind) && lookup.get(kind) instanceof Map) {
      return lookup.get(kind).get(id) ?? null;
    }
    const keyed = lookup.get(`${kind}\0${id}`);
    if (keyed) return keyed;
    const byId = lookup.get(id);
    if (byId?.kind === kind) return byId;
    return null;
  }
  if (isPlainObject(lookup)) {
    if (lookup[kind] && isPlainObject(lookup[kind])) return lookup[kind][id] ?? null;
    const keyed = lookup[`${kind}\0${id}`];
    if (keyed) return keyed;
    const byId = lookup[id];
    if (byId?.kind === kind) return byId;
  }
  return null;
}

function bodyValidator(kind) {
  if (kind === 'epic') return validateEpicBody;
  if (kind === 'feature') return validateFeatureBody;
  if (kind === 'requirement') return validateRequirementBody;
  return validateTaskBody;
}

function contains(listA, listB, id) {
  return listA.includes(id) || listB.includes(id);
}

export function validateHierarchyRecord(record, lookup = null) {
  if (!isPlainObject(record)) invalid('record must be an object');
  assertExactKeys(record, new Set(['kind', 'id', 'subject', 'version', 'body']), 'record');
  if (!HIERARCHY_KINDS.has(record.kind)) {
    invalid(`unsupported hierarchy record kind "${record.kind}"`);
  }
  assertNonEmptyString(record.id, 'record.id');
  if (record.subject !== null) {
    invalid(`${record.kind} record envelope must have null subject`);
  }
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid('record.version must be a positive safe integer');
  }

  bodyValidator(record.kind)(record.body, `record ${record.kind}/${record.id} body`);
  if (record.id !== record.body.id) invalid(`${record.kind} record envelope must match body.id`);

  const resolve = (kind, id) => resolveLookup(lookup, kind, id);

  if (record.kind === 'feature' && lookup) {
    const epic = resolve('epic', record.body.epic_id);
    if (!epic) invalid(`feature/${record.id} must reference an existing epic`);
    if (!contains(epic.body.required_features, epic.body.optional_features, record.id)) {
      invalid(`feature/${record.id} must appear in epic/${epic.id}`);
    }
  }

  if (record.kind === 'requirement' && lookup) {
    const feature = resolve('feature', record.body.feature_id);
    if (!feature || feature.body.pack !== record.body.pack) {
      invalid(`requirement/${record.id} must reference an existing same-pack feature`);
    }
    if (!contains(feature.body.required_requirements, feature.body.optional_requirements, record.id)) {
      invalid(`requirement/${record.id} must appear in feature/${feature.id}`);
    }
  }

  if (record.kind === 'task' && lookup) {
    const feature = resolve('feature', record.body.feature_id);
    if (!feature || feature.body.pack !== record.body.pack) {
      invalid(`task/${record.id} must reference an existing same-pack feature`);
    }
    for (const requirementId of record.body.satisfies) {
      const requirement = resolve('requirement', requirementId);
      if (!requirement) invalid(`task/${record.id} must reference existing requirements in satisfies`);
      if (requirement.body.feature_id !== record.body.feature_id) {
        invalid(`task/${record.id} must satisfy only requirements that belong to its feature`);
      }
      if (!contains(requirement.body.required_tasks, requirement.body.optional_tasks, record.id)) {
        invalid('requirement-task edges must agree bidirectionally');
      }
    }
  }

  return record;
}

function hierarchyLookup(records) {
  const index = new Map();
  for (const record of records) {
    const key = `${record.kind}\0${record.id}`;
    if (index.has(key)) invalid(`duplicate hierarchy record ${record.kind}/${record.id}`);
    index.set(key, record);
  }
  return index;
}

function readHierarchy(index, kind, id) {
  return index.get(`${kind}\0${id}`) ?? null;
}

function nodeKey(kind, id) {
  return `${kind}\0${id}`;
}

function describeNode(node) {
  return node.replace('\0', '/');
}

function detectDirectedCycle(adjacency, label) {
  const visiting = new Set();
  const visited = new Set();

  function walk(node) {
    if (visited.has(node)) return;
    if (visiting.has(node)) invalid(`${label} detected at ${describeNode(node)}`);
    visiting.add(node);
    for (const next of adjacency.get(node) ?? []) {
      if (adjacency.has(next)) walk(next);
    }
    visiting.delete(node);
    visited.add(node);
  }

  for (const node of adjacency.keys()) walk(node);
}

function dependencyAdjacency(records, getTargets) {
  return new Map(records.map(record => [
    nodeKey(record.kind, record.id),
    new Set(getTargets(record).map(id => nodeKey(record.kind, id))),
  ]));
}

function compositionChildren(record) {
  const edge = COMPOSITION_EDGES[record.kind];
  if (!edge) return [];
  return edge.lists.flatMap(list => record.body[list]);
}

function validateSingleCompositionParent(entries) {
  const claims = new Map();
  for (const record of entries) {
    const edge = COMPOSITION_EDGES[record.kind];
    if (!edge?.singleParent) continue;
    const parentNode = nodeKey(record.kind, record.id);
    for (const childId of compositionChildren(record)) {
      const childNode = nodeKey(edge.childKind, childId);
      const claimed = claims.get(childNode);
      if (claimed !== undefined && claimed !== parentNode) {
        invalid(`${edge.childKind}/${childId} must belong to exactly one ${record.kind}`);
      }
      claims.set(childNode, parentNode);
    }
  }
}

function validateCompositionStructure(entries, resolve) {
  validateSingleCompositionParent(entries);

  const adjacency = new Map(entries.map(record => [nodeKey(record.kind, record.id), new Set()]));
  for (const record of entries) {
    const edge = COMPOSITION_EDGES[record.kind];
    if (!edge) continue;
    const children = adjacency.get(nodeKey(record.kind, record.id));
    for (const childId of compositionChildren(record)) {
      const child = resolve(edge.childKind, childId);
      if (edge.parentField === null) {
        if (!child) {
          invalid(`${record.kind}/${record.id} references a missing ${edge.childKind} ${childId}`);
        }
        if (child.body.feature_id !== record.body.feature_id) {
          invalid(`${edge.childKind}/${childId} must share ${record.kind}/${record.id} feature ${record.body.feature_id}`);
        }
        if (!child.body.satisfies.includes(record.id)) {
          invalid('requirement-task edges must agree bidirectionally');
        }
      } else if (!child || child.body[edge.parentField] !== record.id) {
        invalid(`${record.kind}/${record.id} references a missing or mismatched ${edge.childKind} ${childId}`);
      }
      children.add(nodeKey(edge.childKind, childId));
    }
  }

  detectDirectedCycle(adjacency, 'composition cycle');
}

export function validateHierarchyRelationships(records) {
  const entries = [...records];
  const index = hierarchyLookup(entries);
  const resolve = (kind, id) => readHierarchy(index, kind, id);

  entries.forEach(record => validateHierarchyRecord(record, resolve));

  validateCompositionStructure(entries, resolve);

  for (const feature of entries.filter(record => record.kind === 'feature')) {
    for (const dependency of feature.body.depends_on_features) {
      if (!resolve('feature', dependency.feature)) {
        invalid(`feature/${feature.id} references a missing dependency ${dependency.feature}`);
      }
    }
  }

  for (const task of entries.filter(record => record.kind === 'task')) {
    const feature = resolve('feature', task.body.feature_id);
    for (const dependency of task.body.depends_on) {
      const upstream = resolve('task', dependency.task);
      if (!upstream) invalid(`task/${task.id} references a missing dependency ${dependency.task}`);
      const upstreamFeature = resolve('feature', upstream.body.feature_id);
      if (feature && upstreamFeature && upstreamFeature.body.epic_id !== feature.body.epic_id) {
        invalid(`task/${task.id} dependencies must stay within one epic`);
      }
    }
  }

  detectDirectedCycle(
    dependencyAdjacency(
      entries.filter(record => record.kind === 'feature'),
      feature => feature.body.depends_on_features.map(dependency => dependency.feature),
    ),
    'feature dependency cycle',
  );
  detectDirectedCycle(
    dependencyAdjacency(
      entries.filter(record => record.kind === 'task'),
      task => task.body.depends_on.map(dependency => dependency.task),
    ),
    'task dependency cycle',
  );

  return entries;
}

function validateParentCreate(command, parentKind) {
  if (command.recordKind !== parentKind) {
    invalid(`${command.kind} requires recordKind "${parentKind}"`);
  }
  if (command.expectedVersion !== 0) invalid(`${command.kind} requires version 0`);
  if (command.leaseToken !== null) invalid(`${command.kind} cannot carry a lease token`);
  assertExactKeys(command.payload, new Set(['body']), `${command.kind} payload`);
  bodyValidator(parentKind)(command.payload.body, `${command.kind} payload.body`);
  if (command.payload.body.id !== command.recordId) {
    invalid(`${command.kind} body id must match command.recordId`);
  }
}

function validateExistingParentCommand(command, parentKind) {
  if (command.recordKind !== parentKind) invalid(`${command.kind} requires recordKind "${parentKind}"`);
  if (command.expectedVersion < 1) invalid(`${command.kind} requires an existing record version`);
  if (command.leaseToken !== null) invalid(`${command.kind} cannot carry a lease token`);
}

function validateParentUpdate(command, parentKind) {
  validateExistingParentCommand(command, parentKind);
  assertExactKeys(command.payload, new Set(['at', 'changes']), `${command.kind} payload`);
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
  validateChangesPayload(
    {...command, payload: {changes: command.payload.changes}},
    PARENT_UPDATE_FIELDS.get(parentKind),
    command.kind,
  );
}

function validateAtPayload(command, parentKind, fields, required = fields) {
  validateExistingParentCommand(command, parentKind);
  assertExactKeys(command.payload, new Set(fields), `${command.kind} payload`, new Set(required));
}

function validateParentActivate(command, parentKind) {
  validateAtPayload(command, parentKind, ['at']);
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
}

function validateParentHold(command, parentKind) {
  validateAtPayload(command, parentKind, ['at', 'reason', 'releaseCondition', 'basisRefs']);
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
  assertNonEmptyString(command.payload.reason, `${command.kind} payload.reason`);
  assertNonEmptyString(command.payload.releaseCondition, `${command.kind} payload.releaseCondition`);
  assertStringArray(command.payload.basisRefs, `${command.kind} payload.basisRefs`);
}

function validateParentRelease(command, parentKind) {
  validateAtPayload(command, parentKind, ['at', 'reason', 'conditionMet', 'basisRefs']);
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
  assertNonEmptyString(command.payload.reason, `${command.kind} payload.reason`);
  assertBoolean(command.payload.conditionMet, `${command.kind} payload.conditionMet`);
  assertStringArray(command.payload.basisRefs, `${command.kind} payload.basisRefs`);
}

function validateParentComplete(command, parentKind) {
  validateAtPayload(
    command,
    parentKind,
    ['at', 'disposition', 'reason', 'closureRef', 'basisRefs'],
    ['at', 'disposition', 'reason', 'basisRefs'],
  );
  assertTimestamp(command.payload.at, `${command.kind} payload.at`);
  assertNullableString(command.payload.closureRef ?? null, `${command.kind} payload.closureRef`);
  if (command.payload.closureRef !== undefined && !HEX_DIGEST.test(command.payload.closureRef)) {
    invalid(`${command.kind} payload.closureRef must be SHA-256`);
  }
  assertNonEmptyString(command.payload.reason, `${command.kind} payload.reason`);
  if (!PARENT_DISPOSITIONS[parentKind].has(command.payload.disposition)) {
    invalid(`${command.kind} payload.disposition is unsupported`);
  }
  assertStringArray(command.payload.basisRefs, `${command.kind} payload.basisRefs`);
  const successDisposition = new Map([
    ['epic', 'achieved'],
    ['feature', 'delivered'],
    ['requirement', 'satisfied'],
  ]).get(parentKind);
  if (command.payload.disposition === successDisposition && !Object.hasOwn(command.payload, 'closureRef')) {
    invalid(`${command.kind} payload.closureRef is required for successful completion`);
  }
}

export function validateParentCommand(command) {
  if (!PARENT_COMMAND_KINDS.has(command.kind)) {
    invalid(`unsupported command kind "${command.kind}"`);
  }

  const [parentKind, action] = command.kind.split('.');
  if (action === 'create') validateParentCreate(command, parentKind);
  else if (action === 'update') validateParentUpdate(command, parentKind);
  else if (action === 'activate') validateParentActivate(command, parentKind);
  else if (action === 'hold') validateParentHold(command, parentKind);
  else if (action === 'release') validateParentRelease(command, parentKind);
  else validateParentComplete(command, parentKind);
  return command;
}

export function validateParentCommandMutation(command, current, nextBody) {
  if (!isPlainObject(nextBody)) invalid(`${command.kind} must produce an object body`);
  if (command.kind.endsWith('.create')) {
    if (current) invalid(`${command.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command.payload.body)) {
      invalid(`${command.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid(`${command.kind} requires an existing record`);

  const [, action] = command.kind.split('.');
  if (action === 'update') {
    const expected = {
      ...current.body,
      ...command.payload.changes,
      updated_at: command.payload.at,
    };
    if (canonicalJson(nextBody) !== canonicalJson(expected)) {
      invalid(`${command.kind} may only apply the changes in its payload`);
    }
    return nextBody;
  }

  const allowedByAction = new Map([
    ['activate', new Set(['state', 'updated_at'])],
    ['hold', new Set(['hold', 'updated_at'])],
    ['release', new Set(['hold', 'updated_at'])],
    ['complete', new Set(['state', 'completion_disposition', 'updated_at'])],
  ]);
  assertChangedOnly(current, nextBody, allowedByAction.get(action), command.kind);
  return nextBody;
}

function closureIdentity(record, label) {
  if (!isPlainObject(record)) invalid(`${label} must be an object`);
  if (!HIERARCHY_KINDS.has(record.kind)) invalid(`${label}.kind is unsupported`);
  assertNonEmptyString(record.id, `${label}.id`);
  if (!Number.isSafeInteger(record.version) || record.version < 1) {
    invalid(`${label}.version must be a positive safe integer`);
  }
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    disposition: record.body?.completion_disposition ?? record.completion_disposition ?? null,
  };
}

export function parentClosureRef(parent, requiredChildren) {
  const parentIdentity = closureIdentity(parent, 'parent');
  if (!Array.isArray(requiredChildren)) invalid('requiredChildren must be an array');
  const children = requiredChildren.map((record, index) => closureIdentity(record, `requiredChildren[${index}]`))
    .sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
  return createHash('sha256').update(canonicalJson({
    parent: {
      kind: parentIdentity.kind,
      id: parentIdentity.id,
      version: parentIdentity.version,
    },
    requiredChildren: children.map(child => ({
      kind: child.kind,
      id: child.id,
      version: child.version,
      disposition: child.disposition,
    })),
  })).digest('hex');
}
