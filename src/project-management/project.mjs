#!/usr/bin/env node

import {randomUUID} from 'node:crypto';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  realpathSync,
} from 'node:fs';
import {dirname, isAbsolute, join, resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {DatabaseSync} from 'node:sqlite';

const DATABASE = '.kai/project-management/runtime/project.sqlite';
const SCHEMA_VERSION = 1;
const WORKSPACE_SCHEMA_VERSION = 6;
const KINDS = new Set(['direction', 'epic', 'feature', 'requirement']);
const STATES = new Set(['proposed', 'active', 'completed']);
const DISPOSITIONS = new Map([
  ['direction', new Set(['achieved', 'cancelled', 'superseded'])],
  ['epic', new Set(['achieved', 'cancelled', 'superseded'])],
  ['feature', new Set(['delivered', 'cancelled', 'superseded'])],
  ['requirement', new Set(['satisfied', 'cancelled', 'superseded'])],
]);
const SUCCESS = new Map([
  ['direction', 'achieved'],
  ['epic', 'achieved'],
  ['feature', 'delivered'],
  ['requirement', 'satisfied'],
]);
const CHILDREN = new Map([
  ['direction', ['epic', 'required_epics', 'optional_epics', 'direction_id']],
  ['epic', ['feature', 'required_features', 'optional_features', 'epic_id']],
  ['feature', ['requirement', 'required_requirements', 'optional_requirements', 'feature_id']],
]);
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';
const PACK = '(?:core|project-management|engineering|creative)';
const IDS = new Map([
  ['direction', new RegExp(`^direction:${SLUG}$`)],
  ['epic', new RegExp(`^epic:${SLUG}$`)],
  ['feature', new RegExp(`^${PACK}:feature:${SLUG}$`)],
  ['requirement', new RegExp(`^${PACK}:requirement:${SLUG}$`)],
]);
const TASK_ID = new RegExp(`^(?<pack>${PACK}):task:${SLUG}$`);

class ProjectError extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = 'ProjectError';
    this.code = code;
    this.retryable = retryable;
  }
}

const fail = (code, message, retryable = false) => {
  throw new ProjectError(code, message, retryable);
};
const object = (value, label) => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    fail('INVALID_INPUT', `${label} must be an object`);
  }
  return value;
};
const text = (value, label) => {
  if (typeof value !== 'string' || value.trim() === '') {
    fail('INVALID_INPUT', `${label} must be a non-empty string`);
  }
  return value;
};
const nullableText = (value, label) => value === null ? null : text(value, label);
const stringArray = (value, label) => {
  if (!Array.isArray(value) || value.some(entry => typeof entry !== 'string' || entry.trim() === '')) {
    fail('INVALID_INPUT', `${label} must be an array of non-empty strings`);
  }
  if (new Set(value).size !== value.length) fail('INVALID_INPUT', `${label} must not contain duplicates`);
  return value;
};
const exact = (value, keys, label) => {
  object(value, label);
  const allowed = new Set(keys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) fail('INVALID_INPUT', `${label} contains unknown field "${key}"`);
  }
  for (const key of allowed) {
    if (!Object.hasOwn(value, key)) fail('INVALID_INPUT', `${label} is missing "${key}"`);
  }
};
const canonical = value => {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  return `{${Object.keys(value).sort().map(key => `${JSON.stringify(key)}:${canonical(value[key])}`).join(',')}}`;
};
const timestamp = (value, label) => {
  text(value, label);
  if (!Number.isFinite(Date.parse(value))) fail('INVALID_INPUT', `${label} must be an ISO timestamp`);
};
const actor = (value, label = 'actor') => {
  exact(value, ['role', 'runId'], label);
  text(value.role, `${label}.role`);
  text(value.runId, `${label}.runId`);
};
const idFor = (kind, id, label = `${kind} id`) => {
  if (!IDS.get(kind)?.test(id)) fail('INVALID_INPUT', `${label} has an invalid typed id`);
};
const packOf = id => id.split(':')[0];

function validateHold(value, label) {
  if (value === null) return;
  exact(value, ['reason', 'set_by', 'set_at', 'release_condition', 'basis_refs'], label);
  text(value.reason, `${label}.reason`);
  actor(value.set_by, `${label}.set_by`);
  timestamp(value.set_at, `${label}.set_at`);
  text(value.release_condition, `${label}.release_condition`);
  stringArray(value.basis_refs, `${label}.basis_refs`);
}

function commonBody(body, kind, extras) {
  exact(body, [
    'schema_version', 'id', 'title', 'state', 'completion_disposition',
    'owner', 'scope_authority', 'completion_authority', 'priority',
    'outcome', 'acceptance', 'hold', 'created_at', 'updated_at', ...extras,
  ], `${kind} body`);
  if (body.schema_version !== 1) fail('INVALID_INPUT', `${kind}.schema_version must be 1`);
  idFor(kind, body.id);
  for (const key of ['title', 'owner', 'scope_authority', 'completion_authority', 'outcome']) {
    text(body[key], `${kind}.${key}`);
  }
  if (!STATES.has(body.state)) fail('INVALID_INPUT', `${kind}.state is unsupported`);
  if (body.state === 'completed') {
    if (!DISPOSITIONS.get(kind).has(body.completion_disposition)) {
      fail('INVALID_INPUT', `${kind}.completion_disposition is unsupported`);
    }
  } else if (body.completion_disposition !== null) {
    fail('INVALID_INPUT', `${kind}.completion_disposition must be null before completion`);
  }
  if (!Number.isSafeInteger(body.priority) || body.priority < 0) {
    fail('INVALID_INPUT', `${kind}.priority must be a non-negative integer`);
  }
  stringArray(body.acceptance, `${kind}.acceptance`);
  if (body.acceptance.length === 0) fail('INVALID_INPUT', `${kind}.acceptance must not be empty`);
  validateHold(body.hold, `${kind}.hold`);
  timestamp(body.created_at, `${kind}.created_at`);
  timestamp(body.updated_at, `${kind}.updated_at`);
}

function validateBody(kind, body) {
  if (kind === 'direction') {
    commonBody(body, kind, [
      'vision', 'mission', 'current_goal', 'out_of_scope',
      'required_epics', 'optional_epics',
    ]);
    for (const key of ['vision', 'mission', 'current_goal']) text(body[key], `direction.${key}`);
    stringArray(body.out_of_scope, 'direction.out_of_scope');
    for (const field of ['required_epics', 'optional_epics']) {
      stringArray(body[field], `direction.${field}`);
      body[field].forEach(id => idFor('epic', id));
    }
  } else if (kind === 'epic') {
    commonBody(body, kind, [
      'direction_id', 'contribution', 'scope_fit',
      'required_features', 'optional_features',
    ]);
    idFor('direction', body.direction_id, 'epic.direction_id');
    text(body.contribution, 'epic.contribution');
    text(body.scope_fit, 'epic.scope_fit');
    for (const field of ['required_features', 'optional_features']) {
      stringArray(body[field], `epic.${field}`);
      body[field].forEach(id => idFor('feature', id));
    }
  } else if (kind === 'feature') {
    commonBody(body, kind, [
      'epic_id', 'required_requirements', 'optional_requirements',
      'depends_on_features',
    ]);
    idFor('epic', body.epic_id, 'feature.epic_id');
    for (const field of ['required_requirements', 'optional_requirements']) {
      stringArray(body[field], `feature.${field}`);
      body[field].forEach(id => {
        idFor('requirement', id);
        if (packOf(id) !== packOf(body.id)) {
          fail('INVALID_INPUT', `feature.${field} must stay within one package`);
        }
      });
    }
    stringArray(body.depends_on_features, 'feature.depends_on_features');
    body.depends_on_features.forEach(id => idFor('feature', id));
  } else {
    commonBody(body, kind, [
      'feature_id', 'required_tasks', 'optional_tasks',
    ]);
    idFor('feature', body.feature_id, 'requirement.feature_id');
    if (packOf(body.feature_id) !== packOf(body.id)) {
      fail('INVALID_INPUT', 'Requirement and Feature must use the same package');
    }
    for (const field of ['required_tasks', 'optional_tasks']) {
      stringArray(body[field], `requirement.${field}`);
      body[field].forEach(id => {
        if (!TASK_ID.test(id) || packOf(id) !== packOf(body.id)) {
          fail('INVALID_INPUT', `requirement.${field} must contain same-package Core Task ids`);
        }
      });
    }
  }
  const required = body.required_epics ?? body.required_features
    ?? body.required_requirements ?? body.required_tasks;
  const optional = body.optional_epics ?? body.optional_features
    ?? body.optional_requirements ?? body.optional_tasks;
  const overlap = required.find(id => optional.includes(id));
  if (overlap) fail('INVALID_INPUT', `${kind} required and optional lists overlap at ${overlap}`);
  return body;
}

function workspace(root) {
  if (!isAbsolute(root)) fail('INVALID_INPUT', '--root must be absolute');
  root = resolve(root);
  if (!existsSync(root)
    || (process.platform === 'win32'
      ? realpathSync.native(root).toLowerCase() !== root.toLowerCase()
      : realpathSync.native(root) !== root)) {
    fail('INVALID_INPUT', 'workspace root must be an exact existing physical path');
  }
  const manifestPath = join(root, '.kai', 'manifest.json');
  if (!existsSync(manifestPath)
    || !lstatSync(manifestPath).isFile()
    || lstatSync(manifestPath).isSymbolicLink()) {
    fail('RECOVERY_REQUIRED', 'schema-6 workspace manifest is missing or linked');
  }
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  if (manifest.schema_version !== WORKSPACE_SCHEMA_VERSION
    || manifest.plugin !== 'kai-core'
    || manifest.private_root !== '.kai') {
    fail('SCHEMA_MISMATCH', 'Project Management requires a current schema-6 Core workspace');
  }
  return {root, manifest, path: join(root, ...DATABASE.split('/'))};
}

const SCHEMA = `
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE records (
  kind TEXT NOT NULL,
  id TEXT NOT NULL,
  version INTEGER NOT NULL CHECK (version > 0),
  body TEXT NOT NULL CHECK (json_valid(body)),
  PRIMARY KEY (kind, id)
);
CREATE TABLE events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  record_kind TEXT NOT NULL,
  record_id TEXT NOT NULL,
  actor TEXT NOT NULL CHECK (json_valid(actor)),
  at TEXT NOT NULL,
  payload TEXT NOT NULL CHECK (json_valid(payload))
);
CREATE TABLE operations (
  id TEXT PRIMARY KEY,
  payload TEXT NOT NULL,
  receipt TEXT NOT NULL CHECK (json_valid(receipt))
);
`;

function openProject(path, mode) {
  if (mode === 'create') {
    if (existsSync(path)) fail('VERSION_CONFLICT', 'Project Management database already exists');
    mkdirSync(dirname(path), {recursive: true});
  } else if (!existsSync(path)) {
    fail('RECOVERY_REQUIRED', 'Project Management is not initialized; run project.mjs init');
  }
  if (existsSync(path)
    && (!lstatSync(path).isFile() || lstatSync(path).isSymbolicLink())) {
    fail('RECOVERY_REQUIRED', 'Project Management database must be an exact regular file');
  }
  const database = new DatabaseSync(path, {
    open: true,
    readOnly: mode === 'read',
    allowExtension: false,
  });
  database.exec('PRAGMA foreign_keys = ON; PRAGMA busy_timeout = 5000');
  if (mode === 'create') {
    database.exec(SCHEMA);
    database.prepare('INSERT INTO metadata (key, value) VALUES (?, ?)').run(
      'schema_version',
      String(SCHEMA_VERSION),
    );
  }
  const version = database.prepare(
    "SELECT value FROM metadata WHERE key = 'schema_version'",
  ).get()?.value;
  if (version !== String(SCHEMA_VERSION)) {
    database.close();
    fail('RECOVERY_REQUIRED', `unsupported Project Management schema ${JSON.stringify(version)}`);
  }
  return database;
}

function record(database, kind, id) {
  const row = database.prepare(
    'SELECT kind, id, version, body FROM records WHERE kind = ? AND id = ?',
  ).get(kind, id);
  return row ? {...row, body: validateBody(row.kind, JSON.parse(row.body))} : null;
}

function records(database, kind = null) {
  const rows = kind === null
    ? database.prepare('SELECT kind, id, version, body FROM records ORDER BY kind, id').all()
    : database.prepare('SELECT kind, id, version, body FROM records WHERE kind = ? ORDER BY id').all(kind);
  return rows.map(row => ({...row, body: validateBody(row.kind, JSON.parse(row.body))}));
}

function requireAuthority(command, body, role) {
  if (command.actor.role !== role) {
    fail('AUTHORITY_REQUIRED', `${command.kind} requires ${role}`);
  }
}

function parentFor(database, kind, body) {
  if (kind === 'direction') return null;
  const parentKind = kind === 'epic' ? 'direction' : kind === 'feature' ? 'epic' : 'feature';
  const parentId = body[`${parentKind}_id`];
  const parent = record(database, parentKind, parentId);
  if (!parent) fail('EVIDENCE_GAP', `${parentKind}/${parentId} does not exist`);
  const [, requiredField, optionalField] = CHILDREN.get(parentKind);
  if (!parent.body[requiredField].includes(body.id)
    && !parent.body[optionalField].includes(body.id)) {
    fail('INVALID_INPUT', `${kind}/${body.id} is not declared by ${parentKind}/${parentId}`);
  }
  return parent;
}

function validateRelationships(database, kind, body) {
  const parent = parentFor(database, kind, body);
  if (parent && (parent.body.state !== 'active' || parent.body.hold !== null)) {
    fail('EVIDENCE_GAP', `${parent.kind}/${parent.id} must be active and not held`);
  }
  if (kind === 'feature') {
    for (const dependencyId of body.depends_on_features) {
      const dependency = record(database, 'feature', dependencyId);
      if (!dependency) fail('EVIDENCE_GAP', `feature/${dependencyId} does not exist`);
    }
    const features = new Map(records(database, 'feature').map(entry => [entry.id, entry.body]));
    features.set(body.id, body);
    const visiting = new Set();
    const visited = new Set();
    const visit = id => {
      if (visiting.has(id)) fail('INVALID_INPUT', `Feature dependency cycle includes ${id}`);
      if (visited.has(id)) return;
      const feature = features.get(id);
      if (!feature) return;
      visiting.add(id);
      feature.depends_on_features.forEach(visit);
      visiting.delete(id);
      visited.add(id);
    };
    features.forEach((_feature, id) => visit(id));
  }
  const child = CHILDREN.get(kind);
  if (child) {
    const [childKind, requiredField, optionalField, parentField] = child;
    const listed = new Set([...body[requiredField], ...body[optionalField]]);
    for (const entry of records(database, childKind)) {
      if (entry.body[parentField] === body.id && !listed.has(entry.id)) {
        fail('INVALID_INPUT', `${childKind}/${entry.id} must remain listed by ${kind}/${body.id}`);
      }
    }
    for (const id of listed) {
      const entry = record(database, childKind, id);
      if (entry && entry.body[parentField] !== body.id) {
        fail('INVALID_INPUT', `${kind}/${body.id} references mismatched ${childKind}/${id}`);
      }
    }
  }
  return parent;
}

function closure(database, current, command) {
  const successful = command.payload.disposition === SUCCESS.get(current.kind);
  if (!successful) return;
  if (current.body.hold !== null) fail('EVIDENCE_GAP', `${current.kind}/${current.id} is held`);
  stringArray(command.payload.basisRefs, `${command.kind}.basisRefs`);
  if (command.payload.basisRefs.length === 0) fail('EVIDENCE_GAP', 'successful completion requires basisRefs');
  if (current.kind === 'requirement') {
    stringArray(command.payload.completedTaskRefs, `${command.kind}.completedTaskRefs`);
    const required = [...current.body.required_tasks].sort();
    const completed = [...command.payload.completedTaskRefs].sort();
    if (canonical(required) !== canonical(completed)) {
      fail('EVIDENCE_GAP', 'Requirement completion must name every required Core Task exactly');
    }
    return;
  }
  const [childKind, requiredField] = CHILDREN.get(current.kind);
  for (const id of current.body[requiredField]) {
    const child = record(database, childKind, id);
    if (!child || child.body.state !== 'completed'
      || child.body.completion_disposition !== SUCCESS.get(childKind)) {
      fail('EVIDENCE_GAP', `${childKind}/${id} has not completed successfully`);
    }
  }
}

function apply(database, command) {
  exact(command, [
    'operationId', 'kind', 'actor', 'recordKind', 'recordId',
    'expectedVersion', 'payload',
  ], 'command');
  if (!UUID.test(command.operationId)) fail('INVALID_INPUT', 'command.operationId must be a UUID');
  actor(command.actor);
  if (!KINDS.has(command.recordKind)) fail('INVALID_INPUT', 'command.recordKind is unsupported');
  idFor(command.recordKind, command.recordId);
  if (!Number.isSafeInteger(command.expectedVersion) || command.expectedVersion < 0) {
    fail('INVALID_INPUT', 'command.expectedVersion must be a non-negative integer');
  }
  object(command.payload, 'command.payload');
  const prior = database.prepare('SELECT payload, receipt FROM operations WHERE id = ?')
    .get(command.operationId);
  const serialized = canonical(command);
  if (prior) {
    if (prior.payload !== serialized) fail('OPERATION_CONFLICT', 'operation id was reused');
    return JSON.parse(prior.receipt);
  }

  const [kind, action] = command.kind.split('.');
  if (command.kind !== `${kind}.${action}`
    || kind !== command.recordKind || !new Set([
    'create', 'update', 'activate', 'hold', 'release', 'complete',
  ]).has(action)) {
    fail('INVALID_INPUT', 'command kind does not match a supported record action');
  }
  const current = record(database, kind, command.recordId);
  if ((current?.version ?? 0) !== command.expectedVersion) {
    fail('VERSION_CONFLICT', `${kind}/${command.recordId} version changed`);
  }

  let next;
  let at;
  if (action === 'create') {
    exact(command.payload, ['body'], `${command.kind} payload`);
    next = validateBody(kind, command.payload.body);
    if (next.id !== command.recordId || next.state !== 'proposed'
      || next.completion_disposition !== null || next.hold !== null) {
      fail('INVALID_INPUT', 'new planning records must begin as unheld proposals');
    }
    requireAuthority(command, next, next.scope_authority);
    validateRelationships(database, kind, next);
    at = next.created_at;
  } else {
    if (!current) fail('EVIDENCE_GAP', `${kind}/${command.recordId} does not exist`);
    at = command.payload.at;
    timestamp(at, `${command.kind}.at`);
    if (current.body.state === 'completed') fail('INVALID_INPUT', 'completed planning records are immutable');
    if (action === 'update') {
      exact(command.payload, ['at', 'changes'], `${command.kind} payload`);
      object(command.payload.changes, `${command.kind}.changes`);
      const forbidden = new Set([
        'schema_version', 'id', 'state', 'completion_disposition',
        'hold', 'created_at', 'updated_at',
      ]);
      if (Object.keys(command.payload.changes).some(key => forbidden.has(key))) {
        fail('INVALID_INPUT', `${command.kind} cannot mutate lifecycle fields`);
      }
      const authority = Object.hasOwn(command.payload.changes, 'priority')
        || Object.keys(command.payload.changes).some(key => /^required_|^optional_|depends_on_/.test(key))
        ? current.body.scope_authority
        : current.body.owner;
      requireAuthority(command, current.body, authority);
      next = validateBody(kind, {
        ...current.body,
        ...command.payload.changes,
        updated_at: at,
      });
      validateRelationships(database, kind, next);
    } else if (action === 'activate') {
      exact(command.payload, ['at'], `${command.kind} payload`);
      requireAuthority(command, current.body, current.body.scope_authority);
      if (current.body.state !== 'proposed' || current.body.hold !== null) {
        fail('INVALID_INPUT', `${command.kind} requires an unheld proposal`);
      }
      if (kind === 'direction' && records(database, 'direction').some(entry =>
        entry.id !== current.id && entry.body.state === 'active')) {
        fail('INVALID_INPUT', 'only one Direction may be active');
      }
      validateRelationships(database, kind, current.body);
      next = {...current.body, state: 'active', updated_at: at};
    } else if (action === 'hold') {
      exact(command.payload, ['at', 'reason', 'releaseCondition', 'basisRefs'], `${command.kind} payload`);
      if (current.body.hold !== null) fail('INVALID_INPUT', `${kind}/${current.id} is already held`);
      requireAuthority(command, current.body, current.body.scope_authority);
      text(command.payload.reason, `${command.kind}.reason`);
      text(command.payload.releaseCondition, `${command.kind}.releaseCondition`);
      stringArray(command.payload.basisRefs, `${command.kind}.basisRefs`);
      next = {...current.body, hold: {
        reason: command.payload.reason,
        set_by: command.actor,
        set_at: at,
        release_condition: command.payload.releaseCondition,
        basis_refs: command.payload.basisRefs,
      }, updated_at: at};
    } else if (action === 'release') {
      exact(command.payload, ['at', 'basisRefs'], `${command.kind} payload`);
      if (current.body.hold === null) fail('INVALID_INPUT', `${kind}/${current.id} is not held`);
      requireAuthority(command, current.body, current.body.scope_authority);
      stringArray(command.payload.basisRefs, `${command.kind}.basisRefs`);
      if (command.payload.basisRefs.length === 0) fail('EVIDENCE_GAP', 'hold release requires basisRefs');
      next = {...current.body, hold: null, updated_at: at};
    } else {
      const keys = kind === 'requirement'
        ? ['at', 'disposition', 'reason', 'basisRefs', 'completedTaskRefs']
        : ['at', 'disposition', 'reason', 'basisRefs'];
      exact(command.payload, keys, `${command.kind} payload`);
      if (current.body.state !== 'active') fail('INVALID_INPUT', `${command.kind} requires an active record`);
      requireAuthority(command, current.body, current.body.completion_authority);
      if (!DISPOSITIONS.get(kind).has(command.payload.disposition)) {
        fail('INVALID_INPUT', `${command.kind}.disposition is unsupported`);
      }
      text(command.payload.reason, `${command.kind}.reason`);
      stringArray(command.payload.basisRefs, `${command.kind}.basisRefs`);
      if (kind === 'requirement') {
        stringArray(command.payload.completedTaskRefs, `${command.kind}.completedTaskRefs`);
      }
      closure(database, current, command);
      next = {
        ...current.body,
        state: 'completed',
        completion_disposition: command.payload.disposition,
        updated_at: at,
      };
    }
  }

  database.exec('BEGIN IMMEDIATE');
  try {
    if (current) {
      database.prepare(
        'UPDATE records SET version = ?, body = ? WHERE kind = ? AND id = ?',
      ).run(current.version + 1, canonical(next), kind, command.recordId);
    } else {
      database.prepare(
        'INSERT INTO records (kind, id, version, body) VALUES (?, ?, 1, ?)',
      ).run(kind, command.recordId, canonical(next));
    }
    const event = database.prepare(`
      INSERT INTO events (operation_id, kind, record_kind, record_id, actor, at, payload)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      command.operationId,
      command.kind,
      kind,
      command.recordId,
      canonical(command.actor),
      at,
      canonical(command.payload),
    );
    const receipt = {
      ok: true,
      operationId: command.operationId,
      recordVersion: (current?.version ?? 0) + 1,
      eventSeq: Number(event.lastInsertRowid),
      data: {record: {kind, id: command.recordId, version: (current?.version ?? 0) + 1, body: next}},
    };
    database.prepare('INSERT INTO operations (id, payload, receipt) VALUES (?, ?, ?)')
      .run(command.operationId, serialized, canonical(receipt));
    database.exec('COMMIT');
    return receipt;
  } catch (error) {
    database.exec('ROLLBACK');
    throw error;
  }
}

function projectStatus(database) {
  const all = records(database);
  const byKey = new Map(all.map(entry => [`${entry.kind}\0${entry.id}`, entry]));
  const rows = all.map(entry => {
    const blockers = [];
    if (entry.body.hold) blockers.push({code: 'HOLD', message: entry.body.hold.reason});
    if (entry.kind === 'feature') {
      for (const dependency of entry.body.depends_on_features) {
        const upstream = byKey.get(`feature\0${dependency}`);
        if (!upstream || upstream.body.state !== 'completed'
          || upstream.body.completion_disposition !== 'delivered') {
          blockers.push({code: 'DEPENDENCY', message: `feature/${dependency} is not delivered`});
        }
      }
    }
    return {
      kind: entry.kind,
      id: entry.id,
      version: entry.version,
      title: entry.body.title,
      state: entry.body.state,
      completion_disposition: entry.body.completion_disposition,
      priority: entry.body.priority,
      owner: entry.body.owner,
      blockers,
    };
  }).sort((left, right) => left.priority - right.priority
    || left.kind.localeCompare(right.kind)
    || left.id.localeCompare(right.id));
  return {
    schema_version: 1,
    through_seq: Number(database.prepare(
      'SELECT COALESCE(MAX(seq), 0) AS seq FROM events',
    ).get().seq),
    records: rows,
    totals: {
      records: rows.length,
      blocked: rows.filter(row => row.blockers.length > 0).length,
      completed: rows.filter(row => row.state === 'completed').length,
    },
  };
}

function planningRefs(database, requirement) {
  const feature = record(database, 'feature', requirement.body.feature_id);
  const epic = feature && record(database, 'epic', feature.body.epic_id);
  const direction = epic && record(database, 'direction', epic.body.direction_id);
  const chain = [direction, epic, feature, requirement];
  if (chain.some(entry => !entry || entry.body.state !== 'active' || entry.body.hold !== null)) {
    fail('EVIDENCE_GAP', 'planning handoff requires an active, unheld Direction-to-Requirement chain');
  }
  for (const dependencyId of feature.body.depends_on_features) {
    const dependency = record(database, 'feature', dependencyId);
    if (!dependency || dependency.body.state !== 'completed'
      || dependency.body.completion_disposition !== 'delivered') {
      fail('EVIDENCE_GAP', `feature/${dependencyId} must be delivered before Task handoff`);
    }
  }
  return chain.map(entry => `project-management:${entry.kind}/${entry.id}@${entry.version}`);
}

function taskHandoff(database, input) {
  exact(input, [
    'requirementId', 'taskId', 'title', 'deliveryClass', 'nextRole',
    'artifactExpectation', 'artifactExpectationReason', 'artifactClass',
    'durability', 'validityOwner', 'artifactTargets', 'contextArtifacts',
    'touches', 'dependsOn', 'reviewRequirements', 'updatedAt',
  ], 'handoff input');
  idFor('requirement', input.requirementId);
  const taskMatch = typeof input.taskId === 'string' ? input.taskId.match(TASK_ID) : null;
  if (!taskMatch) fail('INVALID_INPUT', 'handoff taskId must be a typed Core Task id');
  const requirement = record(database, 'requirement', input.requirementId);
  if (!requirement) fail('EVIDENCE_GAP', `requirement/${input.requirementId} does not exist`);
  if (taskMatch.groups.pack !== packOf(requirement.id)) {
    fail('INVALID_INPUT', 'handoff Task must use the Requirement package');
  }
  if (![...requirement.body.required_tasks, ...requirement.body.optional_tasks]
    .includes(input.taskId)) {
    fail('INVALID_INPUT', 'handoff Task must be declared by the Requirement');
  }
  for (const key of ['title', 'deliveryClass', 'nextRole', 'artifactExpectation', 'updatedAt']) {
    text(input[key], `handoff.${key}`);
  }
  timestamp(input.updatedAt, 'handoff.updatedAt');
  if (!new Set(['knowledge', 'product-change', 'operational']).has(input.deliveryClass)) {
    fail('INVALID_INPUT', 'handoff.deliveryClass is unsupported');
  }
  if (!new Set(['owed', 'none']).has(input.artifactExpectation)) {
    fail('INVALID_INPUT', 'handoff.artifactExpectation is unsupported');
  }
  nullableText(input.artifactExpectationReason, 'handoff.artifactExpectationReason');
  nullableText(input.artifactClass, 'handoff.artifactClass');
  nullableText(input.durability, 'handoff.durability');
  nullableText(input.validityOwner, 'handoff.validityOwner');
  if (input.artifactExpectation === 'none' && input.artifactExpectationReason === null) {
    fail('INVALID_INPUT', 'handoff without an artifact requires a reason');
  }
  if (input.artifactExpectation === 'owed'
    && [input.artifactClass, input.durability, input.validityOwner].includes(null)) {
    fail('INVALID_INPUT', 'handoff with an owed artifact requires class, durability, and validity owner');
  }
  for (const key of ['artifactTargets', 'contextArtifacts', 'touches']) {
    stringArray(input[key], `handoff.${key}`);
  }
  if (!Array.isArray(input.dependsOn) || !Array.isArray(input.reviewRequirements)) {
    fail('INVALID_INPUT', 'handoff dependencies and review requirements must be arrays');
  }
  const dependencyIds = new Set();
  for (const [index, dependency] of input.dependsOn.entries()) {
    exact(dependency, ['task', 'requires'], `handoff.dependsOn[${index}]`);
    if (!TASK_ID.test(dependency.task)) {
      fail('INVALID_INPUT', `handoff.dependsOn[${index}].task is invalid`);
    }
    if (!new Set(['in-review', 'completed', 'release-ready', 'shipped'])
      .has(dependency.requires)) {
      fail('INVALID_INPUT', `handoff.dependsOn[${index}].requires is unsupported`);
    }
    if (dependencyIds.has(dependency.task)) {
      fail('INVALID_INPUT', 'handoff.dependsOn contains duplicate Tasks');
    }
    dependencyIds.add(dependency.task);
  }
  const reviews = new Set();
  for (const [index, review] of input.reviewRequirements.entries()) {
    exact(review, ['role', 'kind'], `handoff.reviewRequirements[${index}]`);
    text(review.role, `handoff.reviewRequirements[${index}].role`);
    text(review.kind, `handoff.reviewRequirements[${index}].kind`);
    const key = `${review.role}\0${review.kind}`;
    if (reviews.has(key)) fail('INVALID_INPUT', 'handoff.reviewRequirements contains duplicates');
    reviews.add(key);
  }
  return {
    schema_version: 1,
    id: input.taskId,
    pack: taskMatch.groups.pack,
    planning_refs: planningRefs(database, requirement),
    title: input.title,
    delivery_class: input.deliveryClass,
    state: 'proposed',
    resume_state: null,
    scope_authority: requirement.body.scope_authority,
    completion_authority: requirement.body.completion_authority,
    producer_actor: null,
    producing_actors: [],
    acceptance_actor: null,
    next_role: input.nextRole,
    outcome: requirement.body.outcome,
    acceptance: requirement.body.acceptance,
    artifact_expectation: input.artifactExpectation,
    artifact_expectation_reason: input.artifactExpectationReason,
    artifact_class: input.artifactClass,
    durability: input.durability,
    validity_owner: input.validityOwner,
    artifact_targets: input.artifactTargets,
    context_artifacts: input.contextArtifacts,
    touches: input.touches,
    depends_on: input.dependsOn,
    lease: null,
    recovery_hold: null,
    waiting_on_questions: [],
    review_requirements: input.reviewRequirements,
    change_ref: null,
    updated_at: input.updatedAt,
  };
}

function parseArguments(argv) {
  const [verb, ...rest] = argv;
  if (!new Set(['init', 'inspect', 'status', 'detail', 'apply', 'handoff']).has(verb)) {
    fail('INVALID_INPUT', 'expected init, inspect, status, detail, apply, or handoff');
  }
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    const key = rest[index]?.startsWith('--') ? rest[index].slice(2) : '';
    const value = rest[index + 1];
    if (!new Set(['root', 'kind', 'id']).has(key) || !value || value.startsWith('--')) {
      fail('INVALID_INPUT', `invalid option ${rest[index] ?? ''}`);
    }
    if (Object.hasOwn(options, key)) fail('INVALID_INPUT', `duplicate --${key}`);
    options[key] = value;
  }
  if (!options.root) fail('INVALID_INPUT', '--root is required');
  return {verb, options};
}

async function readInput(stream) {
  const chunks = [];
  let size = 0;
  for await (const chunk of stream) {
    size += Buffer.byteLength(chunk);
    if (size > 1024 * 1024) fail('INVALID_INPUT', 'input exceeds 1 MiB');
    chunks.push(Buffer.from(chunk));
  }
  try {
    return object(JSON.parse(Buffer.concat(chunks).toString('utf8')), 'input');
  } catch (error) {
    if (error instanceof ProjectError) throw error;
    fail('INVALID_INPUT', 'stdin must contain one JSON object');
  }
}

export async function runCLI(argv, {input, stdin = process.stdin} = {}) {
  let database;
  try {
    const {verb, options} = parseArguments(argv);
    const selected = workspace(options.root);
    if (verb === 'init') {
      database = openProject(selected.path, 'create');
      return {exitCode: 0, result: {
        ok: true,
        mode: verb,
        root: selected.root,
        database: DATABASE,
        schemaVersion: SCHEMA_VERSION,
      }};
    }
    if (verb === 'inspect') {
      if (!existsSync(selected.path)) {
        return {exitCode: 0, result: {
          ok: true,
          mode: verb,
          root: selected.root,
          storeExists: false,
          database: DATABASE,
        }};
      }
      database = openProject(selected.path, 'read');
      return {exitCode: 0, result: {
        ok: true,
        mode: verb,
        root: selected.root,
        storeExists: true,
        database: DATABASE,
        schemaVersion: SCHEMA_VERSION,
        summary: projectStatus(database).totals,
      }};
    }
    database = openProject(selected.path, verb === 'apply' ? 'write' : 'read');
    if (verb === 'status') {
      return {exitCode: 0, result: {ok: true, mode: verb, status: projectStatus(database)}};
    }
    if (verb === 'detail') {
      if (!KINDS.has(options.kind) || !options.id) fail('INVALID_INPUT', 'detail requires --kind and --id');
      const found = record(database, options.kind, options.id);
      if (!found) fail('EVIDENCE_GAP', `${options.kind}/${options.id} does not exist`);
      return {exitCode: 0, result: {ok: true, mode: verb, record: found}};
    }
    const body = input ?? await readInput(stdin);
    if (verb === 'handoff') {
      return {exitCode: 0, result: {ok: true, mode: verb, task: taskHandoff(database, body)}};
    }
    return {exitCode: 0, result: apply(database, body)};
  } catch (error) {
    if (!(error instanceof ProjectError)) throw error;
    return {
      exitCode: error.retryable ? 2 : 1,
      result: {
        ok: false,
        code: error.code,
        message: error.message,
        retryable: error.retryable,
      },
    };
  } finally {
    database?.close();
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const {exitCode, result} = await runCLI(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (exitCode) process.stderr.write(`${result.code}: ${result.message}\n`);
    process.exitCode = exitCode;
  } catch (error) {
    process.stderr.write(`Internal failure: ${error.message}\n`);
    process.exitCode = 1;
  }
}
