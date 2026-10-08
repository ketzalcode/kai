import {
  RuntimeError,
  canonicalJson,
  criteriaRef,
  validateHierarchySubject,
} from './contract.mjs';
import {
  effectiveApprovals,
  effectiveReviews,
} from './acceptance-verdicts.mjs';
import {
  DEFAULT_CONTEXT_MAX_BYTES,
  DEFAULT_CONTEXT_RECENT_LIMIT,
  projectContext,
} from './context.mjs';
import {
  listAllRecords,
  listRecords,
  readRecord,
  readSnapshot,
} from './store.mjs';
import {
  GRANTABLE_STATES,
  taskStateSatisfies,
} from './task-engine.mjs';

const PACK_ORDER = ['core', 'creative', 'engineering'];
const TERMINAL_TASK_STATES = new Set(['completed', 'shipped', 'dropped']);
const SHIP_STATES = new Set(['release-ready', 'deploying', 'production-verification']);

function invalid(message) {
  throw new RuntimeError('INVALID_INPUT', message);
}

function gap(message) {
  throw new RuntimeError('EVIDENCE_GAP', message);
}

function validateInputs(direction, roles) {
  if (direction !== null && direction !== undefined) {
    if (!direction || typeof direction !== 'object' || Array.isArray(direction)
      || typeof direction.path !== 'string' || direction.path === ''
      || typeof direction.hash !== 'string' || !/^[0-9a-f]{64}$/i.test(direction.hash)
      || typeof direction.goal !== 'string' || direction.goal === '') {
      invalid('hierarchy view direction must contain path, SHA-256 hash, and goal');
    }
  }
  if (!Array.isArray(roles) || roles.some(role => typeof role !== 'string' || role === '')) {
    invalid('hierarchy view roles must be an array of installed role identities');
  }
}

function directionIdentity(direction) {
  return direction === null || direction === undefined
    ? null
    : {path: direction.path, hash: direction.hash, goal: direction.goal};
}

function readerFor(store) {
  const byKind = new Map();
  const bySubject = new Map();
  const all = kind => {
    if (!byKind.has(kind)) byKind.set(kind, listAllRecords(store, {kind}));
    return byKind.get(kind);
  };
  const get = (kind, id) => {
    const loaded = byKind.get(kind);
    if (loaded) return loaded.find(record => record.id === id) ?? null;
    return readRecord(store, kind, id);
  };
  const subjectRecords = (kind, subject) => {
    const key = `${kind}\0${subject.kind}\0${subject.id}`;
    if (!bySubject.has(key)) bySubject.set(key, listRecords(store, {kind, subject}));
    return bySubject.get(key);
  };
  return {all, get, subjectRecords};
}

function recordSubject(record) {
  return {kind: record.kind, id: record.id};
}

function parentConfig(record) {
  if (record.kind === 'epic') {
    return {
      childKind: 'feature',
      required: record.body.required_features,
      optional: record.body.optional_features,
    };
  }
  if (record.kind === 'feature') {
    return {
      childKind: 'requirement',
      required: record.body.required_requirements,
      optional: record.body.optional_requirements,
    };
  }
  if (record.kind === 'requirement') {
    return {
      childKind: 'task',
      required: record.body.required_tasks,
      optional: record.body.optional_tasks,
    };
  }
  return null;
}

function childSuccessful(record) {
  if (!record) return false;
  if (record.kind === 'feature') {
    return record.body.state === 'completed'
      && record.body.completion_disposition === 'delivered';
  }
  if (record.kind === 'requirement') {
    return record.body.state === 'completed'
      && record.body.completion_disposition === 'satisfied';
  }
  if (record.kind === 'task') {
    return record.body.delivery_class === 'knowledge'
      ? record.body.state === 'completed'
      : record.body.state === 'shipped';
  }
  return record.body.state === 'completed';
}

function directChildren(reader, record) {
  const config = parentConfig(record);
  if (!config) return [];
  return [
    ...config.required.map(id => ({
      required: true,
      record: reader.get(config.childKind, id),
      kind: config.childKind,
      id,
    })),
    ...config.optional.map(id => ({
      required: false,
      record: reader.get(config.childKind, id),
      kind: config.childKind,
      id,
    })),
  ];
}

function featureFor(reader, record) {
  if (record.kind === 'feature') return record;
  if (record.kind === 'requirement' || record.kind === 'task') {
    return reader.get('feature', record.body.feature_id);
  }
  return null;
}

function epicFor(reader, record) {
  if (record.kind === 'epic') return record;
  const feature = featureFor(reader, record);
  return feature ? reader.get('epic', feature.body.epic_id) : null;
}

function ancestorRecords(reader, record) {
  const ancestors = [];
  const epic = epicFor(reader, record);
  const feature = featureFor(reader, record);
  if (epic && epic.id !== record.id) ancestors.push(epic);
  if (feature && feature.id !== record.id) ancestors.push(feature);
  if (record.kind === 'task') {
    for (const id of [...record.body.satisfies].sort()) {
      const requirement = reader.get('requirement', id);
      if (requirement) ancestors.push(requirement);
    }
  }
  return ancestors;
}

function relationshipGap(reader, record) {
  if (record.kind === 'epic') return null;
  const feature = featureFor(reader, record);
  if (!feature) {
    return `${record.kind}/${record.id} references a missing Feature`;
  }
  const epic = reader.get('epic', feature.body.epic_id);
  if (!epic
    || ![...epic.body.required_features, ...epic.body.optional_features].includes(feature.id)) {
    return `feature/${feature.id} is not composed by its current Epic`;
  }
  if (record.kind === 'feature') return null;
  if (record.kind === 'requirement') {
    if (![...feature.body.required_requirements, ...feature.body.optional_requirements]
      .includes(record.id)) {
      return `requirement/${record.id} is not composed by feature/${feature.id}`;
    }
    return null;
  }
  for (const requirementId of record.body.satisfies) {
    const requirement = reader.get('requirement', requirementId);
    if (!requirement || requirement.body.feature_id !== feature.id
      || ![...requirement.body.required_tasks, ...requirement.body.optional_tasks]
        .includes(record.id)) {
      return `task/${record.id} has an invalid Requirement relationship`;
    }
  }
  return null;
}

function addReason(reasons, reason) {
  const key = canonicalJson([
    reason.code,
    reason.attention,
    reason.subject ?? null,
    reason.message,
  ]);
  if (!reasons.some(existing => existing.key === key)) reasons.push({...reason, key});
}

function publicReasons(reasons) {
  return reasons.map(({key, ...reason}) => reason);
}

function reason(code, attention, record, message, source = 'derived') {
  return {
    code,
    attention,
    subject: record ? recordSubject(record) : null,
    message,
    source,
  };
}

function installedRoleGaps(reader, record, roles) {
  const installed = new Set(roles);
  const required = new Map();
  const add = (role, responsibility) => {
    if (role === null || role === undefined || role === 'operator' || installed.has(role)) return;
    const responsibilities = required.get(role) ?? new Set();
    responsibilities.add(responsibility);
    required.set(role, responsibilities);
  };
  if (record.kind === 'task') {
    add(record.body.scope_authority, 'scope-authority');
    add(record.body.completion_authority, 'completion-authority');
    add(record.body.next_role, 'next-role');
    for (const requirement of record.body.review_requirements) {
      add(requirement.role, `review:${requirement.kind}`);
    }
  } else {
    add(record.body.owner, 'owner');
    add(record.body.scope_authority, 'scope-authority');
    add(record.body.completion_authority, 'completion-authority');
    if (record.body.state === 'proposed'
      && (record.kind === 'feature' || record.kind === 'requirement')) {
      add(activationRole(reader, record), 'activation-authority');
    }
  }
  return [...required.entries()]
    .map(([role, responsibilities]) => ({
      role,
      responsibilities: [...responsibilities].sort(),
    }))
    .sort((left, right) => left.role.localeCompare(right.role));
}

function directionIsStale(epic, direction) {
  return epic?.body.state !== 'completed'
    && canonicalJson(epic?.body.direction_ref ?? null) !== canonicalJson(directionIdentity(direction));
}

function dependencyEntries(reader, record) {
  if (record.kind === 'feature') {
    return record.body.depends_on_features.map(dependency => {
      const upstream = reader.get('feature', dependency.feature);
      return {
        kind: 'feature',
        id: dependency.feature,
        requires: dependency.requires,
        record: upstream,
        satisfied: upstream?.body.state === 'completed'
          && upstream.body.completion_disposition === 'delivered',
      };
    });
  }
  if (record.kind === 'task') {
    return record.body.depends_on.map(dependency => {
      const upstream = reader.get('task', dependency.task);
      return {
        kind: 'task',
        id: dependency.task,
        requires: dependency.requires,
        record: upstream,
        satisfied: upstream ? taskStateSatisfies(upstream, dependency.requires) : false,
      };
    });
  }
  const feature = featureFor(reader, record);
  return feature && feature.id !== record.id ? dependencyEntries(reader, feature) : [];
}

function typedReference(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? {kind: match[1].toLowerCase(), id: match[2]} : null;
}

function currentCriteria(reader, record) {
  try {
    return criteriaRef(record, (kind, id) => reader.get(kind, id));
  } catch (error) {
    if (error instanceof RuntimeError && error.code === 'INVALID_INPUT') return null;
    throw error;
  }
}

function currentApprovals(reader, record) {
  const criteria = currentCriteria(reader, record);
  if (criteria === null) return [];
  return effectiveApprovals(
    reader.subjectRecords('approval', recordSubject(record)).map(entry => entry.body),
    record,
    (kind, id) => reader.get(kind, id),
  );
}

function reviewsSatisfied(reader, task) {
  if (task.body.review_requirements.length === 0) return true;
  const reviews = effectiveReviews(
    reader.subjectRecords('review', recordSubject(task)).map(entry => entry.body),
    task,
    (kind, id) => reader.get(kind, id),
  );
  return task.body.review_requirements.every(requirement =>
    reviews.some(review =>
      review.reviewer.role === requirement.role
      && review.kind === requirement.kind
      && review.verdict === 'approved'));
}

function parentReadyToClose(reader, record) {
  const children = directChildren(reader, record).filter(child => child.required);
  return children.length === 0
    || children.every(child => child.record && childSuccessful(child.record));
}

function activationRole(reader, record) {
  if (record.kind === 'epic') return record.body.scope_authority;
  if (record.kind === 'feature') return epicFor(reader, record)?.body.owner ?? null;
  if (record.kind === 'requirement') return featureFor(reader, record)?.body.owner ?? null;
  return record.body.scope_authority;
}

function nextAction(reader, record) {
  if (record.kind !== 'task') {
    if (record.body.state === 'completed') return null;
    if (record.body.state === 'proposed') {
      return {kind: `${record.kind}.activate`, role: activationRole(reader, record)};
    }
    if (parentReadyToClose(reader, record)) {
      return {kind: `${record.kind}.complete`, role: record.body.completion_authority};
    }
    return {kind: 'advance-required-children', role: record.body.owner};
  }
  if (TERMINAL_TASK_STATES.has(record.body.state)) return null;
  if (record.body.state === 'proposed') {
    return {kind: 'task.promote', role: record.body.scope_authority};
  }
  if (record.body.state === 'blocked') {
    return {kind: 'resolve-task-blockers', role: record.body.next_role};
  }
  if (SHIP_STATES.has(record.body.state)) {
    return {kind: 'human-production-action', role: 'operator'};
  }
  return {
    kind: record.body.lease === null ? 'task.grant' : 'continue-leased-task',
    role: record.body.next_role,
  };
}

function deriveAttentionInSnapshot(reader, record, direction, roles) {
  validateHierarchySubject(recordSubject(record), 'attention subject');
  const reasons = [];
  const terminal = record.kind === 'task'
    ? TERMINAL_TASK_STATES.has(record.body.state)
    : record.body.state === 'completed';

  if (!terminal) {
    const invalidRelationship = relationshipGap(reader, record);
    if (invalidRelationship) {
      addReason(reasons, reason(
        'missing-evidence',
        'blocked',
        record,
        invalidRelationship,
      ));
    }
    const epic = epicFor(reader, record);
    if (!epic) {
      addReason(reasons, reason(
        'missing-evidence',
        'blocked',
        record,
        `${record.kind}/${record.id} has no current Epic ancestor`,
      ));
    } else if (directionIsStale(epic, direction)) {
      addReason(reasons, reason(
        'stale-direction',
        'blocked',
        epic,
        `epic/${epic.id} is not aligned to the current Direction`,
      ));
    }

    const ancestors = ancestorRecords(reader, record);
    for (const ancestor of ancestors) {
      if (ancestor.body.state !== 'active') {
        addReason(reasons, reason(
          'inactive-ancestor',
          'blocked',
          ancestor,
          `${ancestor.kind}/${ancestor.id} is ${ancestor.body.state}, not active`,
          'declared',
        ));
      }
    }

    for (const candidate of [record, ...ancestors]) {
      if (candidate.kind === 'task' || candidate.body.hold === null) continue;
      const hold = candidate.body.hold;
      const human = candidate.body.owner === 'operator'
        && candidate.body.scope_authority === 'operator';
      addReason(reasons, reason(
        'hold',
        human ? 'needs-human' : 'blocked',
        candidate,
        hold.reason,
        'declared',
      ));
    }

    for (const dependency of dependencyEntries(reader, record)) {
      if (dependency.satisfied) continue;
      addReason(reasons, reason(
        'unmet-dependency',
        'blocked',
        dependency.record ?? record,
        dependency.record
          ? `${dependency.kind}/${dependency.id} must reach ${dependency.requires}`
          : `${dependency.kind}/${dependency.id} is missing`,
      ));
    }

    const config = parentConfig(record);
    if (config) {
      for (const child of directChildren(reader, record).filter(entry => entry.required)) {
        if (!child.record) {
          addReason(reasons, reason(
            'missing-evidence',
            'blocked',
            record,
            `required ${child.kind}/${child.id} is missing`,
          ));
        }
      }
    }

    if (record.kind === 'task') {
      if (record.body.state === 'blocked') {
        addReason(reasons, reason(
          'blocked',
          'blocked',
          record,
          `task/${record.id} records blocked lifecycle`,
          'declared',
        ));
      }
      for (const reference of record.body.context_artifacts) {
        const identity = typedReference(reference);
        if (identity && !reader.get(identity.kind, identity.id)) {
          addReason(reasons, reason(
            'missing-evidence',
            'blocked',
            record,
            `${reference} is not available`,
          ));
        }
      }
      if (record.body.recovery_hold !== null) {
        addReason(reasons, reason(
          'recovery-hold',
          'needs-human',
          record,
          `task/${record.id} requires exact operator recovery resolution`,
        ));
      }
      if (record.body.state === 'in-review'
        && record.body.completion_authority === 'operator'
        && reviewsSatisfied(reader, record)
        && !currentApprovals(reader, record).some(approval =>
          approval.kind === 'completion'
          && approval.authority.role === 'operator'
          && approval.decision === 'approved')) {
        addReason(reasons, reason(
          'human-approval',
          'needs-human',
          record,
          `task/${record.id} awaits operator completion approval`,
        ));
      }
      if (SHIP_STATES.has(record.body.state)) {
        addReason(reasons, reason(
          'human-approval',
          'needs-human',
          record,
          `task/${record.id} awaits a human production action`,
        ));
      } else if (record.body.next_role === 'operator') {
        addReason(reasons, reason(
          'operator-route',
          'needs-human',
          record,
          `task/${record.id} routes its next action to the operator`,
          'declared',
        ));
      }
    } else if (record.body.state === 'proposed' && activationRole(reader, record) === 'operator') {
      addReason(reasons, reason(
        'human-activation',
        'needs-human',
        record,
        `${record.kind}/${record.id} requires operator activation`,
      ));
    } else if (record.body.state === 'active'
      && parentReadyToClose(reader, record)
      && record.body.completion_authority === 'operator') {
      addReason(reasons, reason(
        'human-approval',
        'needs-human',
        record,
        `${record.kind}/${record.id} requires operator completion acceptance`,
      ));
    }

    for (const question of reader.subjectRecords('question', recordSubject(record))) {
      if (question.body.status !== 'open' || question.body.blocking !== true) continue;
      addReason(reasons, reason(
        question.body.recipient === 'operator' ? 'operator-question' : 'blocking-question',
        question.body.recipient === 'operator' ? 'needs-human' : 'blocked',
        record,
        `question/${question.id} is open for ${question.body.recipient}`,
        'declared',
      ));
    }
  }

  const visible = publicReasons(reasons);
  const value = visible.some(entry => entry.attention === 'needs-human')
    ? 'needs-human'
    : visible.some(entry => entry.attention === 'blocked')
      ? 'blocked'
      : 'none';
  return {
    value,
    reasons: visible,
    staffing_gaps: terminal ? [] : installedRoleGaps(reader, record, roles),
    next_action: nextAction(reader, record),
  };
}

export function deriveAttention(store, {record, direction, roles}) {
  validateInputs(direction, roles);
  if (!record || typeof record !== 'object') invalid('attention record is required');
  validateHierarchySubject(recordSubject(record), 'attention subject');
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const selected = reader.get(record.kind, record.id);
    if (!selected) gap(`${record.kind}/${record.id} does not exist`);
    return deriveAttentionInSnapshot(reader, selected, direction, roles);
  });
}

function statusNode(reader, record, direction, roles, extra = {}) {
  const attention = deriveAttentionInSnapshot(reader, record, direction, roles);
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    title: record.body.title,
    priority: record.body.priority,
    lifecycle: {
      state: record.body.state,
      completion_disposition: record.body.completion_disposition ?? null,
    },
    attention,
    ...extra,
  };
}

function taskNode(reader, task, direction, roles, required) {
  return statusNode(reader, task, direction, roles, {required});
}

function requirementNode(reader, requirement, direction, roles, required) {
  const tasks = directChildren(reader, requirement).map(child =>
    child.record
      ? taskNode(reader, child.record, direction, roles, child.required)
      : {
          kind: 'task',
          id: child.id,
          required: child.required,
          missing: true,
        });
  return statusNode(reader, requirement, direction, roles, {
    required,
    rollup: {
      required: tasks.filter(task => task.required).length,
      required_complete: tasks.filter(task => task.required && !task.missing
        && childSuccessful(reader.get('task', task.id))).length,
      optional: tasks.filter(task => !task.required).length,
      optional_complete: tasks.filter(task => !task.required && !task.missing
        && childSuccessful(reader.get('task', task.id))).length,
    },
    tasks,
  });
}

function featureNode(reader, feature, direction, roles, required) {
  const requirements = directChildren(reader, feature).map(child =>
    child.record
      ? requirementNode(reader, child.record, direction, roles, child.required)
      : {
          kind: 'requirement',
          id: child.id,
          required: child.required,
          missing: true,
        });
  return statusNode(reader, feature, direction, roles, {
    pack: feature.body.pack,
    required,
    rollup: {
      required: requirements.filter(entry => entry.required).length,
      required_complete: requirements.filter(entry => entry.required && !entry.missing
        && childSuccessful(reader.get('requirement', entry.id))).length,
      optional: requirements.filter(entry => !entry.required).length,
      optional_complete: requirements.filter(entry => !entry.required && !entry.missing
        && childSuccessful(reader.get('requirement', entry.id))).length,
    },
    requirements,
  });
}

function throughSeq(store) {
  return Number(store.database.prepare(
    'SELECT COALESCE(MAX(seq), 0) AS seq FROM events',
  ).get().seq);
}

export function hierarchyStatus(store, {direction, roles}) {
  validateInputs(direction, roles);
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const epics = reader.all('epic')
      .map(epic => {
        const features = directChildren(reader, epic).map(child =>
          child.record
            ? featureNode(reader, child.record, direction, roles, child.required)
            : {
                kind: 'feature',
                id: child.id,
                required: child.required,
                missing: true,
              });
        const packs = [...new Set(features.filter(feature => !feature.missing)
          .map(feature => feature.pack))]
          .sort((left, right) =>
            PACK_ORDER.indexOf(left) - PACK_ORDER.indexOf(right)
            || left.localeCompare(right))
          .map(pack => {
            const selected = features.filter(feature => feature.pack === pack);
            return {
              pack,
              rollup: {
                required: selected.filter(feature => feature.required).length,
                required_complete: selected.filter(feature => feature.required
                  && childSuccessful(reader.get('feature', feature.id))).length,
                optional: selected.filter(feature => !feature.required).length,
                optional_complete: selected.filter(feature => !feature.required
                  && childSuccessful(reader.get('feature', feature.id))).length,
              },
              features: selected,
            };
          });
        return statusNode(reader, epic, direction, roles, {
          rollup: {
            required: features.filter(feature => feature.required).length,
            required_complete: features.filter(feature => feature.required && !feature.missing
              && childSuccessful(reader.get('feature', feature.id))).length,
            optional: features.filter(feature => !feature.required).length,
            optional_complete: features.filter(feature => !feature.required && !feature.missing
              && childSuccessful(reader.get('feature', feature.id))).length,
          },
          packs,
        });
      })
      .sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
    const records = [
      ...reader.all('epic'),
      ...reader.all('feature'),
      ...reader.all('requirement'),
      ...reader.all('task'),
    ];
    return {
      schema_version: 1,
      through_seq: throughSeq(store),
      goal: {
        text: direction?.goal ?? null,
        path: direction?.path ?? null,
        hash: direction?.hash ?? null,
      },
      totals: {
        records: records.length,
        epics: reader.all('epic').length,
        features: reader.all('feature').length,
        requirements: reader.all('requirement').length,
        tasks: reader.all('task').length,
        terminal: records.filter(record =>
          record.kind === 'task'
            ? TERMINAL_TASK_STATES.has(record.body.state)
            : record.body.state === 'completed').length,
      },
      epics,
    };
  });
}

function recordSummary(record) {
  return {
    kind: record.kind,
    id: record.id,
    version: record.version,
    title: record.body.title,
    state: record.body.state,
    completion_disposition: record.body.completion_disposition ?? null,
    priority: record.body.priority,
  };
}

function contextChildren(reader, record) {
  return directChildren(reader, record).map(child => ({
    ...(child.record ? recordSummary(child.record) : {
      kind: child.kind,
      id: child.id,
      missing: true,
    }),
    required: child.required,
  }));
}

function contextDependencies(reader, record) {
  return dependencyEntries(reader, record).map(dependency => ({
    kind: dependency.kind,
    id: dependency.id,
    requires: dependency.requires,
    satisfied: dependency.satisfied,
    version: dependency.record?.version ?? null,
    state: dependency.record?.body.state ?? null,
    completion_disposition: dependency.record?.body.completion_disposition ?? null,
  }));
}

function contextActiveHold(reader, record) {
  const candidates = [];
  if (record.kind !== 'task') candidates.push(record);
  if (record.kind === 'task') {
    for (const requirementId of [...record.body.satisfies].sort()) {
      const requirement = reader.get('requirement', requirementId);
      if (requirement) candidates.push(requirement);
    }
  }
  const feature = featureFor(reader, record);
  if (feature && feature.id !== record.id) candidates.push(feature);
  const epic = epicFor(reader, record);
  if (epic && epic.id !== record.id) candidates.push(epic);
  const source = candidates.find(candidate => candidate.body.hold !== null);
  return source ? {source: recordSubject(source), ...source.body.hold} : null;
}

function hierarchyContextExtras(reader, record, direction, roles, basePacket) {
  const attention = deriveAttentionInSnapshot(reader, record, direction, roles);
  return {
    direction: directionIdentity(direction),
    selected_record: record,
    ancestors: ancestorRecords(reader, record).map(recordSummary),
    direct_children: contextChildren(reader, record),
    dependencies: contextDependencies(reader, record),
    authorities: basePacket.authority,
    current_decisions: basePacket.decisions,
    active_hold: contextActiveHold(reader, record),
    attention,
    next_allowed_action: attention.next_action,
  };
}

function mergedProjection(projection, extras) {
  const packet = {...JSON.parse(projection.text), ...extras};
  const text = canonicalJson(packet);
  return {
    throughSeq: projection.throughSeq,
    text,
    bytes: Buffer.byteLength(text, 'utf8'),
    references: projection.references,
    historyCursor: projection.historyCursor,
  };
}

export function hierarchyContext(store, {
  subject,
  maxBytes = DEFAULT_CONTEXT_MAX_BYTES,
  recentLimit = DEFAULT_CONTEXT_RECENT_LIMIT,
  direction,
  roles,
}) {
  validateInputs(direction, roles);
  validateHierarchySubject(subject, 'context subject');
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const record = reader.get(subject.kind, subject.id);
    if (!record) gap(`${subject.kind}/${subject.id} does not exist`);

    const required = projectContext(store, {
      subject,
      maxBytes,
      recentLimit: 0,
    });
    const requiredPacket = JSON.parse(required.text);
    const extras = hierarchyContextExtras(reader, record, direction, roles, requiredPacket);
    const requiredMerged = mergedProjection(required, extras);
    if (requiredMerged.bytes > maxBytes) {
      throw new RuntimeError(
        'CONTEXT_BUDGET',
        `Required hierarchy context uses ${requiredMerged.bytes} bytes; limit is ${maxBytes}`,
      );
    }

    const overhead = requiredMerged.bytes - required.bytes;
    const projection = recentLimit === 0
      ? required
      : projectContext(store, {
          subject,
          maxBytes: maxBytes - overhead,
          recentLimit,
        });
    const merged = mergedProjection(projection, extras);
    if (merged.bytes > maxBytes) {
      throw new RuntimeError(
        'CONTEXT_BUDGET',
        `Required hierarchy context uses ${merged.bytes} bytes; limit is ${maxBytes}`,
      );
    }
    return merged;
  });
}

function taskCandidates(reader, subject) {
  if (subject.kind === 'task') {
    const task = reader.get('task', subject.id);
    return task ? [task] : [];
  }
  if (subject.kind === 'requirement') {
    const requirement = reader.get('requirement', subject.id);
    return requirement
      ? directChildren(reader, requirement)
          .map(child => child.record)
          .filter(Boolean)
      : [];
  }
  if (subject.kind === 'feature') {
    return reader.all('task').filter(task => task.body.feature_id === subject.id);
  }
  const featureIds = new Set(reader.all('feature')
    .filter(feature => feature.body.epic_id === subject.id)
    .map(feature => feature.id));
  return reader.all('task').filter(task => featureIds.has(task.body.feature_id));
}

function exclusionReasons(task, attention, selected) {
  const reasons = [];
  const add = (code, message) => {
    if (!reasons.some(entry => entry.code === code && entry.message === message)) {
      reasons.push({code, message});
    }
  };
  if (selected.kind === 'requirement' && !task.body.satisfies.includes(selected.id)) {
    add('relationship-invalid', `Task does not declare Requirement ${selected.id}`);
  }
  if (task.body.state === 'proposed') add('proposed', 'Task is still proposed');
  else if (!GRANTABLE_STATES.has(task.body.state)) {
    add(
      TERMINAL_TASK_STATES.has(task.body.state) ? 'terminal' : 'not-executable',
      `Task lifecycle ${task.body.state} is not executable`,
    );
  }
  if (task.body.lease !== null) add('leased', 'Task already has a lease');
  for (const entry of attention.reasons) {
    if (entry.attention === 'blocked'
      || new Set(['hold', 'stale-direction']).has(entry.code)) {
      add(entry.code, entry.message);
    }
  }
  if (attention.value === 'needs-human') {
    add('needs-human', 'Only a human can perform the next action');
  }
  const actionRole = attention.next_action?.role ?? null;
  const blockingStaffing = attention.staffing_gaps
    .filter(staffing => staffing.role === actionRole);
  if (blockingStaffing.length > 0) {
    add(
      'staffing-gap',
      `Missing installed role(s): ${blockingStaffing.map(gap => gap.role).join(', ')}`,
    );
  }
  return reasons;
}

export function taskPlan(store, {subject, direction, roles}) {
  validateInputs(direction, roles);
  validateHierarchySubject(subject, 'plan subject');
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const selected = reader.get(subject.kind, subject.id);
    if (!selected) gap(`${subject.kind}/${subject.id} does not exist`);
    const tasks = [];
    const excluded = [];
    for (const task of taskCandidates(reader, subject)
      .sort((left, right) =>
        left.body.priority - right.body.priority || left.id.localeCompare(right.id))) {
      const attention = deriveAttentionInSnapshot(reader, task, direction, roles);
      const reasons = exclusionReasons(task, attention, selected);
      if (reasons.length > 0) {
        excluded.push({
          kind: 'task',
          id: task.id,
          version: task.version,
          state: task.body.state,
          reasons,
        });
        continue;
      }
      tasks.push({
        kind: 'task',
        id: task.id,
        version: task.version,
        title: task.body.title,
        priority: task.body.priority,
        state: task.body.state,
        next_role: task.body.next_role,
        acceptance: task.body.acceptance,
        attention,
      });
    }
    return {
      schema_version: 1,
      through_seq: throughSeq(store),
      subject,
      automatic: false,
      tasks,
      excluded,
    };
  });
}
