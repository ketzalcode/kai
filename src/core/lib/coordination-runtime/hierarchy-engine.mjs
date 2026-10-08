import {basename, dirname, posix as path} from 'node:path';
import {readDirection} from '../direction.mjs';
import {directionPath} from '../workspace-layout.mjs';
import {readWorkspaceManifest} from '../workspace-resolve.mjs';
import {
  RuntimeError,
  canonicalJson,
  parentClosureRef,
  validateHierarchyRecord,
} from './contract.mjs';
import {changedKeys} from './contract-primitives.mjs';
import {
  hasHostActionGrantForBasis,
  requireAnyNamedAuthority,
  requireHostActionGrant,
  requireNamedAuthority,
  requireRoleAvailable,
} from './authority.mjs';

const PARENT_CONFIG = Object.freeze({
  epic: {
    childKind: 'feature',
    requiredField: 'required_features',
    optionalField: 'optional_features',
    successDisposition: 'achieved',
    childSuccessDisposition: 'delivered',
  },
  feature: {
    childKind: 'requirement',
    requiredField: 'required_requirements',
    optionalField: 'optional_requirements',
    successDisposition: 'delivered',
    childSuccessDisposition: 'satisfied',
  },
  requirement: {
    childKind: 'task',
    requiredField: 'required_tasks',
    optionalField: 'optional_tasks',
    successDisposition: 'satisfied',
    childSuccessDisposition: null,
  },
});

const SCOPE_FIELDS = Object.freeze({
  epic: new Set([
    'owner',
    'scope_authority',
    'completion_authority',
    'outcome',
    'acceptance',
    'direction_ref',
    'contribution',
    'scope_fit',
    'required_features',
    'optional_features',
  ]),
  feature: new Set([
    'owner',
    'scope_authority',
    'completion_authority',
    'outcome',
    'acceptance',
    'required_requirements',
    'optional_requirements',
    'depends_on_features',
  ]),
  requirement: new Set([
    'owner',
    'scope_authority',
    'completion_authority',
    'outcome',
    'acceptance',
    'required_tasks',
    'optional_tasks',
  ]),
});

function fail(code, message) {
  throw new RuntimeError(code, message);
}

function uniqueRecords(records) {
  const unique = new Map();
  for (const record of records.filter(Boolean)) {
    unique.set(`${record.kind}\0${record.id}`, record);
  }
  return [...unique.values()];
}

function relationshipVersion(record, taskDisposition = null) {
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    state: record.body.state,
    disposition: record.kind === 'task'
      ? taskDisposition ?? record.body.state
      : record.body.completion_disposition,
  };
}

function relationshipVersions(records) {
  return uniqueRecords(records)
    .map(record => relationshipVersion(record))
    .sort((left, right) => left.kind.localeCompare(right.kind)
      || left.id.localeCompare(right.id));
}

function directionBasis(direction) {
  return `direction:${direction.path}@${direction.hash}`;
}

function eventTime(command, nextBody) {
  return command.kind.endsWith('.create')
    ? nextBody.created_at
    : command.payload.at;
}

function eventReason(command) {
  if (typeof command.payload.reason === 'string') return command.payload.reason;
  const action = command.kind.split('.')[1];
  if (action === 'create') return 'Created the governed parent proposal.';
  if (action === 'update') return 'Updated the governed parent record.';
  return `Accepted the governed parent ${action} decision.`;
}

function appendMutationEvent(
  tx,
  current,
  nextBody,
  command,
  related,
  {basisRefs = [], extra = {}} = {},
) {
  const oldVersion = current?.version ?? 0;
  tx.appendEvent({
    kind: command.kind,
    actor: command.actor,
    at: eventTime(command, nextBody),
    reason: eventReason(command),
    recordKind: command.recordKind,
    recordId: command.recordId,
    oldVersion,
    newVersion: oldVersion + 1,
    changedFields: current === null
      ? Object.keys(nextBody).sort()
      : changedKeys(current.body, nextBody).sort(),
    basisRefs: [...new Set(basisRefs)],
    relationshipVersions: relationshipVersions(related),
    ...extra,
  });
}

function workspaceRoot(store) {
  return dirname(dirname(dirname(store.path)));
}

function configuredDirectionPath(project) {
  if (typeof project?.publication_root !== 'string') return null;
  const publicationRoot = project.publication_root
    .replace(/\\/g, '/')
    .replace(/^\.\//, '')
    .replace(/\/+$/, '');
  return path.join(publicationRoot, basename(directionPath()));
}

function projectIdForDirectionRef(manifest, directionRef) {
  if (!directionRef || typeof directionRef.path !== 'string') {
    fail('EVIDENCE_GAP', 'Epic Direction reference must name a configured project path');
  }
  const matches = Array.isArray(manifest.projects)
    ? manifest.projects.filter(
      project => configuredDirectionPath(project) === directionRef.path,
    )
    : [];
  if (matches.length !== 1) {
    fail(
      'EVIDENCE_GAP',
      `Epic Direction path "${directionRef.path}" must match exactly one configured project`,
    );
  }
  if (typeof matches[0].id !== 'string' || !matches[0].id.trim()) {
    fail('EVIDENCE_GAP', 'the configured project matching the Epic Direction path needs an id');
  }
  return matches[0].id;
}

export function currentDirectionForStore(store, directionRef) {
  const root = workspaceRoot(store);
  const result = readWorkspaceManifest(root);
  if (!result.ok) {
    fail('EVIDENCE_GAP', `current Direction cannot be resolved: ${result.reason}`);
  }
  try {
    const projectId = projectIdForDirectionRef(result.manifest, directionRef);
    return readDirection({
      workspaceRoot: root,
      manifest: result.manifest,
      projectId,
    });
  } catch (error) {
    fail('EVIDENCE_GAP', `current Direction cannot be resolved: ${error.message}`);
  }
}

function exactDirectionRef(direction) {
  return {
    path: direction.path,
    hash: direction.hash,
    goal: direction.goal,
  };
}

function assertDirectionAligned(epic, direction) {
  if (canonicalJson(epic.body.direction_ref) !== canonicalJson(exactDirectionRef(direction))) {
    fail('EVIDENCE_GAP',
      `epic/${epic.id} is not aligned to the current runtime-computed Direction`);
  }
}

export function hasStaleDirection(tx, record, resolveDirection) {
  try {
    const epic = epicAncestor(tx, record);
    const direction = resolveDirection(epic.body.direction_ref);
    return canonicalJson(epic.body.direction_ref) !== canonicalJson(exactDirectionRef(direction));
  } catch (error) {
    if (error instanceof RuntimeError && error.code === 'EVIDENCE_GAP') return false;
    throw error;
  }
}

function requireActive(record, label) {
  if (record.body.state !== 'active') {
    fail('EVIDENCE_GAP', `${label} must be active`);
  }
}

function requireNoHold(record, label) {
  if (record.body.hold !== null) {
    fail('EVIDENCE_GAP', `${label} is under an effective hold`);
  }
}

function featureDependencyRecords(tx, feature, {requireDelivered = false} = {}) {
  const dependencies = [];
  for (const dependency of feature.body.depends_on_features) {
    const upstream = tx.get('feature', dependency.feature);
    if (!upstream) {
      fail('INVALID_INPUT',
        `feature/${feature.id} references a missing dependency ${dependency.feature}`);
    }
    if (requireDelivered
      && (upstream.body.state !== 'completed'
        || upstream.body.completion_disposition !== 'delivered')) {
      fail('EVIDENCE_GAP',
        `feature/${dependency.feature} must be completed with delivered`);
    }
    dependencies.push(upstream);
  }
  return dependencies;
}

function assertNoFeatureDependencyCycle(tx, candidate) {
  const features = new Map(tx.list('feature').map(record => [record.id, record]));
  features.set(candidate.id, candidate);
  const visiting = new Set();
  const visited = new Set();

  function visit(id) {
    if (visiting.has(id)) {
      fail('INVALID_INPUT', `feature dependency cycle detected at feature/${id}`);
    }
    if (visited.has(id)) return;
    const feature = features.get(id);
    if (!feature) return;
    visiting.add(id);
    for (const dependency of feature.body.depends_on_features) {
      if (!features.has(dependency.feature)) {
        fail('INVALID_INPUT',
          `feature/${feature.id} references a missing dependency ${dependency.feature}`);
      }
      visit(dependency.feature);
    }
    visiting.delete(id);
    visited.add(id);
  }

  for (const id of features.keys()) visit(id);
}

function containsChild(parent, config, childId) {
  return parent.body[config.requiredField].includes(childId)
    || parent.body[config.optionalField].includes(childId);
}

function candidateLookup(tx, candidate) {
  return (kind, id) => kind === candidate.kind && id === candidate.id
    ? candidate
    : tx.get(kind, id);
}

function assertUniqueParentClaims(tx, parentKind, candidate) {
  const config = PARENT_CONFIG[parentKind];
  if (!config || parentKind === 'requirement') return;
  const claims = new Map();
  const parents = tx.list(parentKind)
    .filter(record => record.id !== candidate.id)
    .concat(candidate);
  for (const parent of parents) {
    for (const childId of [
      ...parent.body[config.requiredField],
      ...parent.body[config.optionalField],
    ]) {
      const claimedBy = claims.get(childId);
      if (claimedBy && claimedBy !== parent.id) {
        fail('INVALID_INPUT',
          `${config.childKind}/${childId} must belong to exactly one ${parentKind}`);
      }
      claims.set(childId, parent.id);
    }
  }
}

function assertExistingChildrenAgree(tx, parent) {
  const config = PARENT_CONFIG[parent.kind];
  const listed = new Set([
    ...parent.body[config.requiredField],
    ...parent.body[config.optionalField],
  ]);
  const related = [];

  if (parent.kind === 'epic') {
    for (const child of tx.list('feature')) {
      if (child.body.epic_id === parent.id && !listed.has(child.id)) {
        fail('INVALID_INPUT',
          `feature/${child.id} must remain listed by epic/${parent.id}`);
      }
    }
    for (const id of listed) {
      const child = tx.get('feature', id);
      if (!child) continue;
      if (child.body.epic_id !== parent.id) {
        fail('INVALID_INPUT',
          `epic/${parent.id} references mismatched feature/${id}`);
      }
      related.push(child);
    }
  } else if (parent.kind === 'feature') {
    for (const child of tx.list('requirement')) {
      if (child.body.feature_id === parent.id && !listed.has(child.id)) {
        fail('INVALID_INPUT',
          `requirement/${child.id} must remain listed by feature/${parent.id}`);
      }
    }
    for (const id of listed) {
      const child = tx.get('requirement', id);
      if (!child) continue;
      if (child.body.feature_id !== parent.id || child.body.pack !== parent.body.pack) {
        fail('INVALID_INPUT',
          `feature/${parent.id} references mismatched requirement/${id}`);
      }
      related.push(child);
    }
  } else {
    for (const child of tx.list('task')) {
      if (child.body.satisfies.includes(parent.id) && !listed.has(child.id)) {
        fail('INVALID_INPUT',
          `task/${child.id} must remain listed by requirement/${parent.id}`);
      }
    }
    for (const id of listed) {
      const child = tx.get('task', id);
      if (!child) continue;
      if (child.body.feature_id !== parent.body.feature_id
        || !child.body.satisfies.includes(parent.id)) {
        fail('INVALID_INPUT',
          `requirement/${parent.id} references mismatched task/${id}`);
      }
      related.push(child);
    }
  }
  return related;
}

function assertParentRelationships(tx, candidate) {
  validateHierarchyRecord(candidate, candidateLookup(tx, candidate));
  assertUniqueParentClaims(tx, candidate.kind, candidate);
  const related = assertExistingChildrenAgree(tx, candidate);

  if (candidate.kind === 'feature') {
    assertNoFeatureDependencyCycle(tx, candidate);
    related.push(...featureDependencyRecords(tx, candidate));
    const epic = tx.get('epic', candidate.body.epic_id);
    if (!epic || !containsChild(epic, PARENT_CONFIG.epic, candidate.id)) {
      fail('INVALID_INPUT',
        `feature/${candidate.id} must appear in epic/${candidate.body.epic_id}`);
    }
    related.push(epic);
  } else if (candidate.kind === 'requirement') {
    const feature = tx.get('feature', candidate.body.feature_id);
    if (!feature || !containsChild(feature, PARENT_CONFIG.feature, candidate.id)) {
      fail('INVALID_INPUT',
        `requirement/${candidate.id} must appear in feature/${candidate.body.feature_id}`);
    }
    related.push(feature);
  }
  return uniqueRecords(related);
}

function requireKnownParentRoles(body, authority) {
  for (const [label, role] of [
    ['owner', body.owner],
    ['scope authority', body.scope_authority],
    ['completion authority', body.completion_authority],
  ]) {
    requireRoleAvailable(role, authority, label);
  }
}

function requireAllowedAuthority(command, authority, roles, message) {
  if (!roles.includes(command.actor.role)) {
    fail('AUTHORITY_REQUIRED', message);
  }
  requireHostActionGrant(command, authority, command.kind);
}

function parentContext(tx, record) {
  if (record.kind === 'epic') return [];
  if (record.kind === 'feature') {
    return [tx.get('epic', record.body.epic_id)].filter(Boolean);
  }
  return [tx.get('feature', record.body.feature_id)].filter(Boolean);
}

function epicAncestor(tx, record) {
  if (record.kind === 'epic') return record;
  const feature = record.kind === 'feature'
    ? record
    : tx.get('feature', record.body.feature_id);
  if (!feature) {
    fail('EVIDENCE_GAP', `${record.kind}/${record.id} has no current Feature ancestor`);
  }
  const epic = tx.get('epic', feature.body.epic_id);
  if (!epic) {
    fail('EVIDENCE_GAP', `feature/${feature.id} has no current Epic ancestor`);
  }
  return epic;
}

function directionForRecord(tx, record, runtime) {
  const epic = epicAncestor(tx, record);
  return runtime.direction(epic.body.direction_ref);
}

export function assertAlignedAncestors(tx, record, direction) {
  validateHierarchyRecord(record);
  if (record.kind === 'epic') {
    assertDirectionAligned(record, direction);
    return [];
  }

  const feature = record.kind === 'feature'
    ? record
    : tx.get('feature', record.body.feature_id);
  if (!feature) {
    fail('EVIDENCE_GAP',
      `${record.kind}/${record.id} has no current Feature ancestor`);
  }
  requireActive(feature, `feature/${feature.id}`);
  requireNoHold(feature, `feature/${feature.id}`);

  const epic = tx.get('epic', feature.body.epic_id);
  if (!epic) {
    fail('EVIDENCE_GAP', `feature/${feature.id} has no current Epic ancestor`);
  }
  requireActive(epic, `epic/${epic.id}`);
  requireNoHold(epic, `epic/${epic.id}`);
  assertDirectionAligned(epic, direction);
  const related = [feature, epic, ...featureDependencyRecords(tx, feature, {
    requireDelivered: true,
  })];

  if (record.kind === 'requirement') {
    if (record.body.feature_id !== feature.id
      || !containsChild(feature, PARENT_CONFIG.feature, record.id)) {
      fail('INVALID_INPUT',
        `requirement/${record.id} does not match feature/${feature.id}`);
    }
    return uniqueRecords(related.filter(entry => entry.id !== record.id));
  }

  if (record.kind === 'task') {
    if (record.body.feature_id !== feature.id) {
      fail('INVALID_INPUT', `task/${record.id} does not match feature/${feature.id}`);
    }
    for (const requirementId of record.body.satisfies) {
      const requirement = tx.get('requirement', requirementId);
      if (!requirement || requirement.body.feature_id !== feature.id
        || !containsChild(requirement, PARENT_CONFIG.requirement, record.id)) {
        fail('INVALID_INPUT',
          `task/${record.id} has an invalid Requirement relationship`);
      }
      requireActive(requirement, `requirement/${requirement.id}`);
      requireNoHold(requirement, `requirement/${requirement.id}`);
      related.push(requirement);
    }
    return uniqueRecords(related.filter(entry => entry.id !== record.id));
  }

  return uniqueRecords(related.filter(entry => entry.id !== record.id));
}

function taskTerminalState(task) {
  return task.body.delivery_class === 'knowledge' ? 'completed' : 'shipped';
}

function closureChildIdentity(record) {
  if (record.kind !== 'task') return record;
  return {
    ...record,
    body: {
      ...record.body,
      completion_disposition: record.body.state,
    },
  };
}

export function closureEligibility(tx, parent) {
  validateHierarchyRecord(parent);
  const config = PARENT_CONFIG[parent.kind];
  if (!config) fail('INVALID_INPUT', `${parent.kind}/${parent.id} is not a parent record`);

  const requiredChildren = [];
  const related = [];
  const blockers = [];
  for (const id of parent.body[config.requiredField]) {
    const child = tx.get(config.childKind, id);
    if (!child) {
      blockers.push({
        kind: config.childKind,
        id,
        reason: `required ${config.childKind}/${id} is missing`,
      });
      continue;
    }
    validateHierarchyRecord(child);
    requiredChildren.push(child);
    related.push(child);
    if (child.kind === 'task') {
      const requiredState = taskTerminalState(child);
      if (child.body.state !== requiredState) {
        blockers.push({
          kind: child.kind,
          id: child.id,
          reason: `required task/${child.id} must reach terminal state ${requiredState}`,
        });
      }
    } else if (child.body.state !== 'completed'
      || child.body.completion_disposition !== config.childSuccessDisposition) {
      blockers.push({
        kind: child.kind,
        id: child.id,
        reason: `required ${child.kind}/${child.id} must complete with ${config.childSuccessDisposition}`,
      });
    }
  }

  if (parent.kind === 'feature') {
    for (const dependency of parent.body.depends_on_features) {
      const upstream = tx.get('feature', dependency.feature);
      if (!upstream) {
        blockers.push({
          kind: 'feature',
          id: dependency.feature,
          reason: `dependency feature/${dependency.feature} is missing`,
        });
        continue;
      }
      validateHierarchyRecord(upstream);
      related.push(upstream);
      if (upstream.body.state !== 'completed'
        || upstream.body.completion_disposition !== 'delivered') {
        blockers.push({
          kind: 'feature',
          id: upstream.id,
          reason: `dependency feature/${upstream.id} must complete with delivered`,
        });
      }
    }
  }

  const eligible = blockers.length === 0;
  const targetParent = {
    ...parent,
    version: parent.body.state === 'completed' ? parent.version : parent.version + 1,
    body: {
      ...parent.body,
      state: 'completed',
      completion_disposition: config.successDisposition,
    },
  };
  return {
    eligible,
    blockers,
    requiredChildren,
    relationshipVersions: uniqueRecords(related)
      .map(record => relationshipVersion(record))
      .sort((left, right) => left.kind.localeCompare(right.kind)
        || left.id.localeCompare(right.id)),
    closureRef: eligible
      ? parentClosureRef(
        targetParent,
        requiredChildren.map(closureChildIdentity),
      )
      : null,
  };
}

function createCandidate(command) {
  return {
    kind: command.recordKind,
    id: command.recordId,
    subject: null,
    version: 1,
    body: command.payload.body,
  };
}

function updateCandidate(current, body) {
  return {...current, version: current.version + 1, body};
}

function requireProposalBody(body) {
  if (body.state !== 'proposed' || body.completion_disposition !== null) {
    fail('INVALID_INPUT', 'new parent records must begin proposed without a completion disposition');
  }
  if (body.hold !== null) {
    fail('INVALID_INPUT', 'new parent proposals must record holds through the hold command');
  }
}

function handleEpicCreate(current, tx, command, authority, runtime) {
  if (current !== null) fail('VERSION_CONFLICT', `epic/${command.recordId} exists`);
  const body = command.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  requireAllowedAuthority(
    command,
    authority,
    ['operator', body.scope_authority],
    'epic.create requires the operator or delegated Epic scope authority',
  );
  const direction = runtime.direction(body.direction_ref);
  const candidate = createCandidate(command);
  assertDirectionAligned(candidate, direction);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command, related, {
    basisRefs: [directionBasis(direction)],
  });
  return body;
}

function handleFeatureCreate(current, tx, command, authority) {
  if (current !== null) fail('VERSION_CONFLICT', `feature/${command.recordId} exists`);
  const body = command.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  requireAllowedAuthority(
    command,
    authority,
    [body.owner, body.scope_authority],
    'feature.create requires the pack owner or delegated pack authority',
  );
  const epic = tx.get('epic', body.epic_id);
  if (!epic) fail('EVIDENCE_GAP', `epic/${body.epic_id} does not exist`);
  requireActive(epic, `epic/${epic.id}`);
  const candidate = createCandidate(command);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command, related);
  return body;
}

function handleRequirementCreate(current, tx, command, authority) {
  if (current !== null) fail('VERSION_CONFLICT', `requirement/${command.recordId} exists`);
  const body = command.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  const feature = tx.get('feature', body.feature_id);
  if (!feature) fail('EVIDENCE_GAP', `feature/${body.feature_id} does not exist`);
  requireActive(feature, `feature/${feature.id}`);
  requireAllowedAuthority(
    command,
    authority,
    [feature.body.owner, feature.body.scope_authority],
    'requirement.create requires the Feature owner or delegated pack authority',
  );
  const candidate = createCandidate(command);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command, related);
  return body;
}

function requireParentUpdateAuthority(
  tx,
  current,
  command,
  authority,
  changes,
  runtime,
) {
  const changed = new Set(Object.keys(changes));
  const hasPriority = changed.delete('priority');
  const hasScope = [...changed].some(key => SCOPE_FIELDS[current.kind].has(key));
  const hasDescription = [...changed].some(key => key === 'title');

  if (current.kind === 'epic') {
    if (hasPriority) {
      if (command.actor.role === 'operator') {
        requireHostActionGrant(command, authority, command.kind);
      } else {
        const direction = runtime.direction(current.body.direction_ref);
        if (!hasHostActionGrantForBasis(
          command,
          authority,
          command.kind,
          directionBasis(direction),
        )) {
          fail(
            'AUTHORITY_REQUIRED',
            'Epic priority requires the operator or an explicit Current Goal steward grant',
          );
        }
      }
    }
    if (hasScope) {
      requireNamedAuthority(
        tx, command, authority, command.kind, current.body.scope_authority,
      );
    }
  } else if (current.kind === 'feature') {
    const epic = tx.get('epic', current.body.epic_id);
    if (!epic) fail('EVIDENCE_GAP', `epic/${current.body.epic_id} does not exist`);
    if (hasPriority || hasScope) {
      requireAllowedAuthority(
        command,
        authority,
        [epic.body.owner],
        'Feature scope and priority require the Epic steward',
      );
    }
  } else {
    const feature = tx.get('feature', current.body.feature_id);
    if (!feature) fail('EVIDENCE_GAP', `feature/${current.body.feature_id} does not exist`);
    if (hasPriority || hasScope) {
      requireAllowedAuthority(
        command,
        authority,
        [feature.body.owner],
        'Requirement scope and priority require the Feature owner',
      );
    }
  }

  if (hasDescription) {
    requireNamedAuthority(tx, command, authority, command.kind, current.body.owner);
  }
}

function handleParentUpdate(current, tx, command, authority, runtime) {
  if (current.body.state === 'completed') {
    fail('INVALID_INPUT', `${current.kind}/${current.id} is completed and immutable`);
  }
  const changes = command.payload.changes;
  requireParentUpdateAuthority(tx, current, command, authority, changes, runtime);
  const next = {
    ...current.body,
    ...changes,
    updated_at: command.payload.at,
  };
  requireKnownParentRoles(next, authority);
  const candidate = updateCandidate(current, next);
  let basisRefs = [];
  if (current.kind === 'epic' && Object.hasOwn(changes, 'direction_ref')) {
    const direction = runtime.direction(candidate.body.direction_ref);
    assertDirectionAligned(candidate, direction);
    basisRefs = [directionBasis(direction)];
  }
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, current, next, command, related, {basisRefs});
  return next;
}

function activationAuthority(tx, current, command, authority) {
  if (current.kind === 'epic') {
    requireAllowedAuthority(
      command,
      authority,
      [current.body.scope_authority],
      'Epic activation requires its scope authority',
    );
    return;
  }
  if (current.kind === 'feature') {
    const epic = tx.get('epic', current.body.epic_id);
    if (!epic) fail('EVIDENCE_GAP', `epic/${current.body.epic_id} does not exist`);
    requireAllowedAuthority(
      command,
      authority,
      [epic.body.owner],
      'Feature activation requires the Epic steward',
    );
    return;
  }
  const feature = tx.get('feature', current.body.feature_id);
  if (!feature) fail('EVIDENCE_GAP', `feature/${current.body.feature_id} does not exist`);
  requireAllowedAuthority(
    command,
    authority,
    [feature.body.owner],
    'Requirement activation requires the Feature owner',
  );
}

function handleParentActivate(current, tx, command, authority, runtime) {
  if (current.body.state !== 'proposed') {
    fail('INVALID_INPUT', `${current.kind}.activate requires a proposed parent`);
  }
  requireNoHold(current, `${current.kind}/${current.id}`);
  requireKnownParentRoles(current.body, authority);
  activationAuthority(tx, current, command, authority);
  const next = {
    ...current.body,
    state: 'active',
    updated_at: command.payload.at,
  };
  const candidate = updateCandidate(current, next);
  const direction = directionForRecord(tx, candidate, runtime);
  const related = [
    ...assertParentRelationships(tx, candidate),
    ...assertAlignedAncestors(tx, candidate, direction),
  ];
  appendMutationEvent(tx, current, next, command, related, {
    basisRefs: [directionBasis(direction)],
  });
  return next;
}

function requireOwnerOrScope(current, command, authority) {
  requireAnyNamedAuthority(
    null,
    command,
    authority,
    command.kind,
    [current.body.owner, current.body.scope_authority],
  );
}

function handleParentHold(current, tx, command, authority) {
  if (current.body.state === 'completed') {
    fail('INVALID_INPUT', 'completed parents cannot be placed on hold');
  }
  if (current.body.hold !== null) {
    fail('INVALID_INPUT', `${current.kind}/${current.id} already has a hold`);
  }
  requireOwnerOrScope(current, command, authority);
  const next = {
    ...current.body,
    hold: {
      reason: command.payload.reason,
      set_by: command.actor,
      set_at: command.payload.at,
      release_condition: command.payload.releaseCondition,
      basis_refs: command.payload.basisRefs,
    },
    updated_at: command.payload.at,
  };
  appendMutationEvent(tx, current, next, command, parentContext(tx, current), {
    basisRefs: command.payload.basisRefs,
  });
  return next;
}

function handleParentRelease(current, tx, command, authority) {
  if (current.body.state === 'completed') {
    fail('INVALID_INPUT', 'completed parents cannot release holds');
  }
  if (current.body.hold === null) {
    fail('INVALID_INPUT', `${current.kind}/${current.id} has no hold to release`);
  }
  if (command.payload.basisRefs.length === 0) {
    fail('EVIDENCE_GAP', 'hold release requires evidence basis references');
  }
  requireOwnerOrScope(current, command, authority);
  const next = {
    ...current.body,
    hold: null,
    updated_at: command.payload.at,
  };
  appendMutationEvent(tx, current, next, command, parentContext(tx, current), {
    basisRefs: command.payload.basisRefs,
    extra: {releaseConditionMet: command.payload.conditionMet},
  });
  return next;
}

function handleParentComplete(current, tx, command, authority, runtime) {
  if (current.body.state !== 'active') {
    fail('INVALID_INPUT', `${current.kind}.complete requires an active parent`);
  }
  requireAllowedAuthority(
    command,
    authority,
    [current.body.completion_authority],
    `${current.kind}.complete requires its declared completion authority`,
  );
  const config = PARENT_CONFIG[current.kind];
  const successful = command.payload.disposition === config.successDisposition;
  let related = parentContext(tx, current);
  let closureRef = null;
  let basisRefs = command.payload.basisRefs;

  if (successful) {
    requireNoHold(current, `${current.kind}/${current.id}`);
    const direction = directionForRecord(tx, current, runtime);
    related = [
      ...related,
      ...assertParentRelationships(tx, current),
      ...assertAlignedAncestors(tx, current, direction),
    ];
    basisRefs = [...basisRefs, directionBasis(direction)];
    const eligibility = closureEligibility(tx, current);
    if (!eligibility.eligible) {
      fail('EVIDENCE_GAP', eligibility.blockers[0].reason);
    }
    closureRef = eligibility.closureRef;
    if (command.payload.closureRef !== closureRef) {
      fail('VERSION_CONFLICT',
        `${current.kind}/${current.id} closure reference does not match current child versions`);
    }
    related.push(...eligibility.requiredChildren);
    for (const version of eligibility.relationshipVersions) {
      const record = tx.get(version.kind, version.id);
      if (record) related.push(record);
    }
  } else if (Object.hasOwn(command.payload, 'closureRef')) {
    fail('INVALID_INPUT',
      'cancelled and superseded completion must not claim a successful closure reference');
  }

  const next = {
    ...current.body,
    state: 'completed',
    completion_disposition: command.payload.disposition,
    updated_at: command.payload.at,
  };
  appendMutationEvent(tx, current, next, command, related, {
    basisRefs,
    extra: {
      closureRef,
      disposition: command.payload.disposition,
    },
  });
  return next;
}

export const parentHandlers = new Map([
  ['epic.create', handleEpicCreate],
  ['epic.update', handleParentUpdate],
  ['epic.activate', handleParentActivate],
  ['epic.hold', handleParentHold],
  ['epic.release', handleParentRelease],
  ['epic.complete', handleParentComplete],
  ['feature.create', handleFeatureCreate],
  ['feature.update', handleParentUpdate],
  ['feature.activate', handleParentActivate],
  ['feature.hold', handleParentHold],
  ['feature.release', handleParentRelease],
  ['feature.complete', handleParentComplete],
  ['requirement.create', handleRequirementCreate],
  ['requirement.update', handleParentUpdate],
  ['requirement.activate', handleParentActivate],
  ['requirement.hold', handleParentHold],
  ['requirement.release', handleParentRelease],
  ['requirement.complete', handleParentComplete],
]);
