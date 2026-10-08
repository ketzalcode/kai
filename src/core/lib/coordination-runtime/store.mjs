import {existsSync, mkdirSync, statSync} from 'node:fs';
import {dirname} from 'node:path';
import {DatabaseSync} from 'node:sqlite';
import {assertWorkspaceWrite} from './workspace-guard.mjs';
import {
  HIERARCHY_KINDS,
  RECORD_KINDS,
  RuntimeError,
  canonicalJson,
  commandDigest,
  criteriaRef,
  validateCommand,
  validateCommandMutation,
  validateRecord,
} from './contract.mjs';

const SCHEMA_VERSION = 2;
const HISTORICAL_SCHEMA_VERSION = 1;
const MESSAGE_SCHEMA_VERSION = 1;
const STORE_MODES = new Set(['create', 'read', 'write']);
const STORE_SUBJECT_KINDS = new Set([...HIERARCHY_KINDS, 'item']);
const EVENTS_TABLE_SQL = `CREATE TABLE events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL,
  subject_kind TEXT,
  subject_id TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  event_kind TEXT GENERATED ALWAYS AS (json_extract(payload, '$.kind')) STORED NOT NULL,
  message_id TEXT GENERATED ALWAYS AS (
    CASE json_extract(payload, '$.kind')
      WHEN 'attempt.recover' THEN json_extract(payload, '$.payload.attemptId')
      WHEN 'question.open' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'question.answer' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'task.handoff' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'item.handoff' THEN json_extract(payload, '$.payload.messageId')
    END
  ) STORED,
  approval_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'approval.record'
      THEN json_extract(payload, '$.payload.body.approval_id') END
  ) STORED,
  question_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'question.open'
      THEN json_extract(payload, '$.payload.questionId') END
  ) STORED,
  thread_id TEXT,
  CHECK ((subject_kind IS NULL) = (subject_id IS NULL))
)`;
const REQUIRED_INDEX_SQL = [
  'CREATE INDEX records_by_subject ON records(kind, subject_kind, subject_id)',
  `CREATE INDEX records_by_question_status ON records(subject_kind, subject_id, json_extract(body, '$.status'))
    WHERE kind = 'question'`,
  `CREATE INDEX records_by_criteria ON records(kind, subject_kind, subject_id, json_extract(body, '$.criteria_ref'))`,
  `CREATE INDEX events_by_thread ON events(thread_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_message ON events(message_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_subject_kind ON events(subject_kind, subject_id, event_kind, seq, question_id)`,
  `CREATE INDEX events_by_approval ON events(approval_id, seq) WHERE approval_id IS NOT NULL`,
];
// Capture thread identity while the message exists, so deleting detail cannot
// erase its history reference. Late inserts and record updates stay consistent.
const REQUIRED_TRIGGER_SQL = [
  `CREATE TRIGGER events_capture_thread AFTER INSERT ON events
    WHEN NEW.message_id IS NOT NULL
    BEGIN
      UPDATE events SET thread_id = COALESCE(
        (SELECT json_extract(body, '$.thread_id') FROM records
          WHERE kind = 'message' AND id = NEW.message_id), NEW.subject_id)
      WHERE seq = NEW.seq;
    END`,
  `CREATE TRIGGER messages_capture_thread AFTER INSERT ON records
    WHEN NEW.kind = 'message'
    BEGIN
      UPDATE events SET thread_id = json_extract(NEW.body, '$.thread_id')
      WHERE message_id = NEW.id;
    END`,
  `CREATE TRIGGER messages_update_thread AFTER UPDATE OF body ON records
    WHEN NEW.kind = 'message'
    BEGIN
      UPDATE events SET thread_id = json_extract(NEW.body, '$.thread_id')
      WHERE message_id = NEW.id;
    END`,
];
const REQUIRED_TABLES = new Set(['metadata', 'records', 'events', 'operations']);
const REQUIRED_COLUMNS = new Map([
  ['metadata', [
    ['key', 'TEXT', 0, null, 1],
    ['value', 'TEXT', 1, null, 0],
  ]],
  ['records', [
    ['kind', 'TEXT', 1, null, 1],
    ['id', 'TEXT', 1, null, 2],
    ['subject_kind', 'TEXT', 0, null, 0],
    ['subject_id', 'TEXT', 0, null, 0],
    ['version', 'INTEGER', 1, null, 0],
    ['body', 'TEXT', 1, null, 0],
  ]],
  ['events', [
    ['seq', 'INTEGER', 0, null, 1],
    ['operation_id', 'TEXT', 1, null, 0],
    ['subject_kind', 'TEXT', 0, null, 0],
    ['subject_id', 'TEXT', 0, null, 0],
    ['payload', 'TEXT', 1, null, 0],
    ['event_kind', 'TEXT', 1, null, 0, 3],
    ['message_id', 'TEXT', 0, null, 0, 3],
    ['approval_id', 'TEXT', 0, null, 0, 3],
    ['question_id', 'TEXT', 0, null, 0, 3],
    ['thread_id', 'TEXT', 0, null, 0],
  ]],
  ['operations', [
    ['id', 'TEXT', 0, null, 1],
    ['payload_digest', 'TEXT', 1, null, 0],
    ['receipt', 'TEXT', 1, null, 0],
  ]],
]);
const REQUIRED_TABLE_SQL = new Map([
  ['metadata',
    'create table metadata(key text primary key,value text not null)'],
  ['records',
    'create table records(kind text not null,id text not null,subject_kind text,subject_id text,version integer not null check(version>0),body text not null check(json_valid(body)),primary key(kind,id),check((subject_kind is null)=(subject_id is null)))'],
  ['events', normalizeSchemaSql(EVENTS_TABLE_SQL)],
  ['operations',
    'create table operations(id text primary key,payload_digest text not null,receipt text not null check(json_valid(receipt)))'],
]);

const SCHEMA = `
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE records (
  kind TEXT NOT NULL, id TEXT NOT NULL,
  subject_kind TEXT, subject_id TEXT,
  version INTEGER NOT NULL CHECK (version > 0),
  body TEXT NOT NULL CHECK (json_valid(body)),
  PRIMARY KEY (kind, id),
  CHECK ((subject_kind IS NULL) = (subject_id IS NULL))
);
${EVENTS_TABLE_SQL};
CREATE TABLE operations (
  id TEXT PRIMARY KEY, payload_digest TEXT NOT NULL,
  receipt TEXT NOT NULL CHECK (json_valid(receipt))
);
${[...REQUIRED_INDEX_SQL, ...REQUIRED_TRIGGER_SQL].join(';\n')};
`;

const HISTORICAL_EVENTS_TABLE_SQL = `CREATE TABLE events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL, item_id TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  event_kind TEXT GENERATED ALWAYS AS (json_extract(payload, '$.kind')) STORED,
  message_id TEXT GENERATED ALWAYS AS (
    CASE json_extract(payload, '$.kind')
      WHEN 'attempt.recover' THEN json_extract(payload, '$.payload.attemptId')
      WHEN 'question.open' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'question.answer' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'item.handoff' THEN json_extract(payload, '$.payload.messageId')
    END
  ) STORED,
  approval_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'approval.record'
      THEN json_extract(payload, '$.payload.body.approval_id') END
  ) STORED,
  question_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'question.open'
      THEN json_extract(payload, '$.payload.questionId') END
  ) STORED,
  thread_id TEXT
)`;
const HISTORICAL_INDEX_SQL = [
  'CREATE INDEX records_by_item ON records(kind, item_id)',
  `CREATE INDEX records_by_question_status ON records(item_id, json_extract(body, '$.status'))
    WHERE kind = 'question'`,
  `CREATE INDEX records_by_criteria ON records(kind, item_id, json_extract(body, '$.criteria_ref'))`,
  `CREATE INDEX events_by_thread ON events(thread_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_message ON events(message_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_item_kind ON events(item_id, event_kind, seq, question_id)`,
  `CREATE INDEX events_by_approval ON events(approval_id, seq) WHERE approval_id IS NOT NULL`,
];
const HISTORICAL_TRIGGER_SQL = [
  `CREATE TRIGGER events_capture_thread AFTER INSERT ON events
    WHEN NEW.message_id IS NOT NULL
    BEGIN
      UPDATE events SET thread_id = COALESCE(
        (SELECT json_extract(body, '$.thread_id') FROM records
          WHERE kind = 'message' AND id = NEW.message_id), NEW.item_id)
      WHERE seq = NEW.seq;
    END`,
  ...REQUIRED_TRIGGER_SQL.slice(1),
];
const HISTORICAL_COLUMNS = new Map([
  ['metadata', REQUIRED_COLUMNS.get('metadata')],
  ['records', [
    ['kind', 'TEXT', 1, null, 1],
    ['id', 'TEXT', 1, null, 2],
    ['item_id', 'TEXT', 0, null, 0],
    ['version', 'INTEGER', 1, null, 0],
    ['body', 'TEXT', 1, null, 0],
  ]],
  ['events', [
    ['seq', 'INTEGER', 0, null, 1],
    ['operation_id', 'TEXT', 1, null, 0],
    ['item_id', 'TEXT', 0, null, 0],
    ['payload', 'TEXT', 1, null, 0],
    ['event_kind', 'TEXT', 0, null, 0, 3],
    ['message_id', 'TEXT', 0, null, 0, 3],
    ['approval_id', 'TEXT', 0, null, 0, 3],
    ['question_id', 'TEXT', 0, null, 0, 3],
    ['thread_id', 'TEXT', 0, null, 0],
  ]],
  ['operations', REQUIRED_COLUMNS.get('operations')],
]);
const HISTORICAL_TABLE_SQL = new Map([
  ['metadata', REQUIRED_TABLE_SQL.get('metadata')],
  ['records',
    'create table records(kind text not null,id text not null,item_id text,version integer not null check(version>0),body text not null check(json_valid(body)),primary key(kind,id))'],
  ['events', normalizeSchemaSql(HISTORICAL_EVENTS_TABLE_SQL)],
  ['operations', REQUIRED_TABLE_SQL.get('operations')],
]);

function invalid(message) {
  throw new RuntimeError('INVALID_INPUT', message);
}

function recovery(message) {
  throw new RuntimeError('RECOVERY_REQUIRED', message);
}

function isSqliteError(error) {
  return error?.code === 'ERR_SQLITE_ERROR'
    && Number.isInteger(error?.errcode);
}

function translateSqliteError(error) {
  if (error instanceof RuntimeError) return error;
  if (isSqliteError(error) && (error.errcode === 5 || error.errcode === 6)) {
    const busy = new RuntimeError('STORE_BUSY', 'coordination store is busy', true);
    busy.cause = error;
    return busy;
  }
  return error;
}

function runSqlite(operation) {
  try {
    return operation();
  } catch (error) {
    throw translateSqliteError(error);
  }
}

function assertStore(store) {
  if (!store || typeof store !== 'object' || !(store.database instanceof DatabaseSync)) {
    invalid('store must be an open coordination store');
  }
  if (store.closed) invalid('coordination store is closed');
}

function parseJson(text, label) {
  try {
    return JSON.parse(text);
  } catch {
    recovery(`${label} contains invalid JSON`);
  }
}

function validateStoreSubject(subject, label, {allowNull = true, allowUndefined = false} = {}) {
  if (subject === undefined && allowUndefined) return subject;
  if (subject === null && allowNull) return subject;
  if (!subject || typeof subject !== 'object' || Array.isArray(subject)) {
    invalid(`${label} must be a typed subject${allowNull ? ' or null' : ''}`);
  }
  if (canonicalJson(Object.keys(subject).sort()) !== '["id","kind"]') {
    invalid(`${label} must contain only kind and id`);
  }
  if (!STORE_SUBJECT_KINDS.has(subject.kind)) {
    invalid(`${label}.kind is unsupported`);
  }
  if (typeof subject.id !== 'string' || subject.id === '') {
    invalid(`${label}.id must be a non-empty string`);
  }
  return subject;
}

function decodeRecord(row) {
  if (!row) return null;
  const record = {
    kind: row.kind,
    id: row.id,
    subject: row.subject_kind === null
      ? null
      : {kind: row.subject_kind, id: row.subject_id},
    version: row.version,
    body: parseJson(row.body, `record ${row.kind}/${row.id}`),
  };
  try {
    return validateRecord(record);
  } catch (error) {
    if (error instanceof RuntimeError && error.code === 'INVALID_INPUT') {
      recovery(`record ${row.kind}/${row.id} is malformed: ${error.message}`);
    }
    throw error;
  }
}

function recordProjection(store, alias = '') {
  const prefix = alias ? `${alias}.` : '';
  if (store.schemaVersion === HISTORICAL_SCHEMA_VERSION) {
    return `${prefix}kind, ${prefix}id,
      CASE WHEN ${prefix}item_id IS NULL THEN NULL ELSE 'item' END AS subject_kind,
      ${prefix}item_id AS subject_id, ${prefix}version, ${prefix}body`;
  }
  return `${prefix}kind, ${prefix}id, ${prefix}subject_kind, ${prefix}subject_id,
    ${prefix}version, ${prefix}body`;
}

function subjectFilter(store, subject, alias = '') {
  validateStoreSubject(subject, 'record subject');
  const prefix = alias ? `${alias}.` : '';
  if (store.schemaVersion === HISTORICAL_SCHEMA_VERSION) {
    if (subject === null) return {sql: `${prefix}item_id IS NULL`, params: []};
    if (subject.kind !== 'item') return {sql: '0 = 1', params: []};
    return {sql: `${prefix}item_id = ?`, params: [subject.id]};
  }
  if (subject === null) {
    return {
      sql: `${prefix}subject_kind IS NULL AND ${prefix}subject_id IS NULL`,
      params: [],
    };
  }
  return {
    sql: `${prefix}subject_kind = ? AND ${prefix}subject_id = ?`,
    params: [subject.kind, subject.id],
  };
}

function matchingSubjects(store, leftAlias, rightAlias) {
  if (store.schemaVersion === HISTORICAL_SCHEMA_VERSION) {
    return `${leftAlias}.item_id IS ${rightAlias}.item_id`;
  }
  return `${leftAlias}.subject_kind IS ${rightAlias}.subject_kind
    AND ${leftAlias}.subject_id IS ${rightAlias}.subject_id`;
}

function readSubjectRecord(store, kind, id, subject) {
  const filter = subjectFilter(store, subject);
  const row = runSqlite(() => store.database.prepare(`
    SELECT ${recordProjection(store)}
    FROM records
    WHERE kind = ? AND id = ? AND ${filter.sql}
  `).get(kind, id, ...filter.params));
  return decodeRecord(row);
}

function validateReceipt(receipt, operationId) {
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)
    || receipt.ok !== true
    || receipt.operationId !== operationId
    || !Number.isSafeInteger(receipt.recordVersion)
    || !Number.isSafeInteger(receipt.eventSeq)
    || !receipt.data
    || typeof receipt.data !== 'object'
    || Array.isArray(receipt.data)) {
    recovery(`operation ${operationId} has a malformed receipt`);
  }
  return receipt;
}

function normalizeSchemaSql(sql) {
  const literals = [];
  return sql.replace(/'(?:''|[^'])*'/g, literal => {
    literals.push(literal);
    return `@literal${literals.length - 1}@`;
  }).toLowerCase()
    .replace(/["`\[\]]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\s*([(),>])\s*/g, '$1')
    .trim()
    .replace(/@literal(\d+)@/g, (_, index) => literals[Number(index)]);
}

function validatePhysicalSchema(database, {
  columns,
  tableSql,
  indexSql,
  triggerSql,
}) {
  for (const [table, expectedColumns] of columns) {
    const columns = runSqlite(() =>
      database.prepare(`PRAGMA table_xinfo(${table})`).all());
    const actualColumns = columns.map(column => [
      column.name,
      column.type,
      column.notnull,
      column.dflt_value,
      column.pk,
      column.hidden,
    ]);
    const expected = expectedColumns.map(column => column.length === 5 ? [...column, 0] : column);
    if (canonicalJson(actualColumns) !== canonicalJson(expected)) {
      recovery(`coordination database table "${table}" has an unsupported column layout`);
    }

    const row = runSqlite(() => database.prepare(`
      SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?
    `).get(table));
    const normalizedSql = normalizeSchemaSql(row?.sql ?? '');
    if (normalizedSql !== tableSql.get(table)) {
      recovery(`coordination database table "${table}" has unsupported constraints`);
    }
  }

  for (const definition of [...indexSql, ...triggerSql]) {
    const [, type, name] = /^CREATE (INDEX|TRIGGER) (\w+)/.exec(definition);
    const row = runSqlite(() => database.prepare(
      'SELECT sql FROM sqlite_master WHERE type = ? AND name = ?',
    ).get(type.toLowerCase(), name));
    if (!row || normalizeSchemaSql(row.sql) !== normalizeSchemaSql(definition)) {
      recovery(`coordination database ${type.toLowerCase()} "${name}" is missing or unsupported`);
    }
  }
}

function validateSchema(database, expectedVersion) {
  const quickCheck = runSqlite(() => database.prepare('PRAGMA quick_check').get());
  if (!quickCheck || quickCheck.quick_check !== 'ok') {
    recovery('coordination database integrity check failed');
  }
  const tableRows = runSqlite(() => database.prepare(`
    SELECT name FROM sqlite_master WHERE type = 'table'
  `).all());
  const tables = new Set(tableRows.map(row => row.name));
  for (const table of REQUIRED_TABLES) {
    if (!tables.has(table)) recovery(`coordination database is missing table "${table}"`);
  }
  const metadata = runSqlite(() => database.prepare(
    "SELECT value FROM metadata WHERE key = 'schema_version'",
  ).get());
  if (!metadata) recovery('coordination database has no schema version');
  if (metadata.value !== String(expectedVersion)) {
    throw new RuntimeError(
      'SCHEMA_MISMATCH',
      `coordination database schema ${JSON.stringify(metadata.value)} is unsupported; expected ${expectedVersion}`,
    );
  }
  validatePhysicalSchema(database, expectedVersion === HISTORICAL_SCHEMA_VERSION
    ? {
        columns: HISTORICAL_COLUMNS,
        tableSql: HISTORICAL_TABLE_SQL,
        indexSql: HISTORICAL_INDEX_SQL,
        triggerSql: HISTORICAL_TRIGGER_SQL,
      }
    : {
        columns: REQUIRED_COLUMNS,
        tableSql: REQUIRED_TABLE_SQL,
        indexSql: REQUIRED_INDEX_SQL,
        triggerSql: REQUIRED_TRIGGER_SQL,
      });
  const messageMetadata = runSqlite(() => database.prepare(
    "SELECT value FROM metadata WHERE key = 'message_schema_version'",
  ).get());
  if (!messageMetadata) recovery('coordination database has no message schema version');
  if (messageMetadata.value !== String(MESSAGE_SCHEMA_VERSION)) {
    throw new RuntimeError(
      'SCHEMA_MISMATCH',
      `coordination message schema ${JSON.stringify(messageMetadata.value)} is unsupported; expected ${MESSAGE_SCHEMA_VERSION}`,
    );
  }
  if (expectedVersion === HISTORICAL_SCHEMA_VERSION) {
    const impossible = runSqlite(() => database.prepare(`
      SELECT kind FROM records
      WHERE kind IN ('epic', 'feature', 'requirement', 'task')
      ORDER BY kind, id
      LIMIT 1
    `).get());
    if (impossible) {
      recovery(`historical schema 1 cannot contain ${impossible.kind} records`);
    }
  }
}

function initializeSchema(database) {
  runSqlite(() => database.exec('BEGIN IMMEDIATE'));
  try {
    runSqlite(() => database.exec(SCHEMA));
    runSqlite(() => database.prepare(
      "INSERT INTO metadata (key, value) VALUES ('schema_version', ?)",
    ).run(String(SCHEMA_VERSION)));
    runSqlite(() => database.prepare(
      "INSERT INTO metadata (key, value) VALUES ('message_schema_version', ?)",
    ).run(String(MESSAGE_SCHEMA_VERSION)));
    runSqlite(() => database.exec('COMMIT'));
  } catch (error) {
    runSqlite(() => database.exec('ROLLBACK'));
    throw error;
  }
}

function openStoreConnection({
  path,
  mode,
  expectedVersion,
  initialize = false,
}) {
  if (typeof path !== 'string' || path.trim() === '') invalid('store path must be a string');

  const existed = existsSync(path);
  if (!initialize && !existed) {
    recovery(`coordination database does not exist at ${path}`);
  }
  if (initialize) mkdirSync(dirname(path), {recursive: true});

  let database;
  try {
    database = new DatabaseSync(path, {readOnly: mode === 'read'});
    runSqlite(() => database.exec('PRAGMA busy_timeout=1000'));
    const shouldInitialize = initialize
      && (!existed || statSync(path).size === 0);
    if (shouldInitialize) initializeSchema(database);
    validateSchema(database, expectedVersion);
    return {
      database,
      path,
      mode,
      schemaVersion: expectedVersion,
      closed: false,
    };
  } catch (error) {
    try {
      database?.close();
    } catch {
      // Preserve the original open or validation failure.
    }
    const translated = translateSqliteError(error);
    if (translated instanceof RuntimeError) throw translated;
    throw new RuntimeError(
      'RECOVERY_REQUIRED',
      `cannot open coordination database: ${translated.message}`,
    );
  }
}

export function openStore({path, mode}) {
  if (!STORE_MODES.has(mode)) invalid(`unsupported store mode "${mode}"`);
  return openStoreConnection({
    path,
    mode,
    expectedVersion: SCHEMA_VERSION,
    initialize: mode === 'create',
  });
}

export function openHistoricalStore({
  path,
  expectedStoreVersion,
  mode = 'read',
}) {
  if (mode !== 'read') invalid('historical coordination stores are read-only');
  if (expectedStoreVersion !== HISTORICAL_SCHEMA_VERSION) {
    invalid(`unsupported historical store schema "${expectedStoreVersion}"`);
  }
  return openStoreConnection({
    path,
    mode,
    expectedVersion: expectedStoreVersion,
  });
}

export function closeStore(store) {
  if (!store || typeof store !== 'object' || store.closed) return;
  try {
    store.database.close();
  } finally {
    store.closed = true;
  }
}

export function readRecord(store, kind, id) {
  assertStore(store);
  if (!RECORD_KINDS.has(kind)) invalid(`unsupported record kind "${kind}"`);
  if (typeof id !== 'string' || id === '') invalid('record id must be a string');
  const row = runSqlite(() => store.database.prepare(`
    SELECT ${recordProjection(store)}
    FROM records
    WHERE kind = ? AND id = ?
  `).get(kind, id));
  return decodeRecord(row);
}

export function listRecords(store, options) {
  assertStore(store);
  if (!options || typeof options !== 'object' || Array.isArray(options)
    || Object.keys(options).some(key => !['kind', 'subject'].includes(key))) {
    invalid('record list options must contain only kind and subject');
  }
  const {kind, subject = undefined} = options;
  if (!RECORD_KINDS.has(kind)) invalid(`unsupported record kind "${kind}"`);
  validateStoreSubject(subject, 'record subject', {
    allowNull: true,
    allowUndefined: true,
  });

  const rows = runSqlite(() => {
    if (subject === undefined) {
      return store.database.prepare(`
        SELECT ${recordProjection(store)}
        FROM records
        WHERE kind = ?
        ORDER BY id
      `).all(kind);
    }
    const filter = subjectFilter(store, subject);
    return store.database.prepare(`
      SELECT ${recordProjection(store)}
      FROM records
      WHERE kind = ? AND ${filter.sql}
      ORDER BY id
    `).all(kind, ...filter.params);
  });
  return rows.map(decodeRecord);
}

export function listAllRecords(store, {kind}) {
  return listRecords(store, {kind});
}

export function readStoreSummary(store) {
  return readSnapshot(store, () => runSqlite(() => {
    const throughSeq = Number(store.database.prepare('SELECT COALESCE(MAX(seq), 0) AS seq FROM events').get().seq);
    const itemCount = Number(store.database.prepare("SELECT COUNT(*) AS count FROM records WHERE kind = 'item'").get().count);
    return {throughSeq, itemCount};
  }));
}

const activeReadSnapshots = new WeakSet();

/** Synchronous composition of read APIs into one snapshot; nested reads share it. */
export function readSnapshot(store, read) {
  assertStore(store);
  if (typeof read !== 'function') invalid('snapshot reader must be a function');
  if (activeReadSnapshots.has(store)) return read();
  let inTransaction = false;
  try {
    runSqlite(() => store.database.exec('BEGIN DEFERRED'));
    inTransaction = true;
    activeReadSnapshots.add(store);
    const result = read();
    if (result && typeof result.then === 'function') invalid('snapshot readers must be synchronous');
    runSqlite(() => store.database.exec('COMMIT'));
    inTransaction = false;
    return result;
  } catch (error) {
    if (inTransaction) {
      try {
        runSqlite(() => store.database.exec('ROLLBACK'));
      } catch (rollbackError) {
        const errors = [error, rollbackError];
        const closeError = invalidateStore(store);
        if (closeError) errors.push(closeError);
        const failure = new RuntimeError(
          'RECOVERY_REQUIRED',
          `read snapshot failed and rollback could not be confirmed: ${error.message}; rollback failed: ${rollbackError.message}`,
        );
        failure.cause = new AggregateError(errors, 'coordination read snapshot and rollback both failed');
        throw failure;
      }
    }
    throw error;
  } finally {
    activeReadSnapshots.delete(store);
  }
}

function referencedRecordId(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? {kind: match[1].toLowerCase(), id: match[2]} : null;
}

/**
 * Read the persisted records needed by report/CLI context projection from one
 * SQLite snapshot. Indexed selections materialize only current obligations,
 * their exact references, the latest handoff, and the bounded recent tail.
 * One covering-index count supplies the initial cursor, never later pages.
 */
export function readSubjectView(store, options) {
  assertStore(store);
  if (!options || typeof options !== 'object' || Array.isArray(options)
    || Object.keys(options).some(key => !['subject', 'recentLimit'].includes(key))) {
    invalid('subject view options must contain only subject and recentLimit');
  }
  const {subject, recentLimit} = options;
  validateStoreSubject(subject, 'context subject', {allowNull: false});
  if (!Number.isSafeInteger(recentLimit) || recentLimit < 0 || recentLimit > 8) {
    invalid('context recentLimit must be an integer from 0 through 8');
  }

  return readSnapshot(store, () => {
    const throughSeq = Number(runSqlite(() => store.database.prepare(
      'SELECT COALESCE(MAX(seq), 0) AS seq FROM events',
    ).get()).seq);
    const item = readRecord(store, subject.kind, subject.id)
      ?? (subject.kind === 'item' ? readRecord(store, 'task', subject.id) : null);
    if (!item) {
      return {
        throughSeq,
        item: null,
        dependencies: [],
        questions: [],
        recoveryHold: null,
        approvals: [],
        recentMessages: [],
        latestHandoff: null,
        messageCount: 0,
        referencedDetails: [],
      };
    }

    const dependencies = (item.body.depends_on ?? []).map(dependency => ({
      dependency,
      record: readRecord(
        store,
        item.kind,
        item.kind === 'task' ? dependency.task : dependency.item,
      ),
    }));
    const chronology = (column, id) => {
      const filter = subjectFilter(store, subject);
      const row = runSqlite(() => store.database.prepare(`
        SELECT seq FROM events WHERE ${column} = ? AND ${filter.sql} AND seq <= ?
        ORDER BY seq DESC LIMIT 1
      `).get(id, ...filter.params, throughSeq));
      return row ? Number(row.seq) : null;
    };
    // A missing nonblocking question is not present in waiting_on_questions.
    // Validate retained opening identities without loading event/question bodies.
    const eventFilter = subjectFilter(store, subject, 'e');
    const missingQuestion = runSqlite(() => store.database.prepare(`
      SELECT e.question_id FROM events e
      LEFT JOIN records r ON r.kind = 'question' AND r.id = e.question_id
        AND ${matchingSubjects(store, 'r', 'e')}
      WHERE ${eventFilter.sql} AND e.event_kind = 'question.open' AND e.seq <= ?
        AND e.question_id IS NOT NULL AND r.id IS NULL
      LIMIT 1
    `).get(...eventFilter.params, throughSeq));
    if (missingQuestion) {
      throw new RuntimeError('EVIDENCE_GAP', `question/${missingQuestion.question_id} referenced by an opening event is missing`);
    }
    const questionFilter = subjectFilter(store, subject);
    const questionIndex = store.schemaVersion === HISTORICAL_SCHEMA_VERSION
      ? 'records_by_question_status'
      : 'records_by_question_status';
    const questionRecords = runSqlite(() => store.database.prepare(`
      SELECT ${recordProjection(store)} FROM records INDEXED BY ${questionIndex}
      WHERE kind = 'question' AND ${questionFilter.sql}
        AND json_extract(body, '$.status') = 'open'
    `).all(...questionFilter.params)).map(decodeRecord);
    const questionsById = new Map(questionRecords.map(record => [record.id, record]));
    for (const id of item.body.waiting_on_questions ?? []) {
      if (!questionsById.has(id)) {
        questionsById.set(id, readSubjectRecord(store, 'question', id, subject));
      }
    }
    const questions = [...questionsById.values()].map(record => ({
      record,
      eventSeq: record ? chronology('message_id', record.body.opened_message_id) : null,
      openedMessage: record
        ? readSubjectRecord(store, 'message', record.body.opened_message_id, subject)
        : null,
      answerMessages: record
        ? record.body.answer_message_ids.map(id =>
            readSubjectRecord(store, 'message', id, subject))
        : [],
    }));
    const approvalFilter = subjectFilter(store, subject);
    const approvals = runSqlite(() => store.database.prepare(`
      SELECT ${recordProjection(store)} FROM records
      WHERE kind = 'approval' AND ${approvalFilter.sql}
        AND json_extract(body, '$.criteria_ref') = ?
    `).all(...approvalFilter.params, criteriaRef(item.body))).map(row => {
      const record = decodeRecord(row);
      return {record, eventSeq: chronology('approval_id', record.id)};
    });
    const recoveryHoldId = item.body.recovery_hold ?? null;
    const recoveryHold = recoveryHoldId === null ? null : {
      record: readSubjectRecord(store, 'attempt', recoveryHoldId, subject),
      eventSeq: chronology('message_id', recoveryHoldId),
      message: readSubjectRecord(store, 'message', recoveryHoldId, subject),
    };
    const recentMessages = messageRows(store, subject.id, throughSeq + 1, recentLimit, subject)
      .map(row => ({eventSeq: Number(row.seq), record: decodeMessageRow(row)}))
      .reverse();
    const handoffFilter = subjectFilter(store, subject, 'e');
    const handoffRow = runSqlite(() => store.database.prepare(`
      SELECT e.seq, e.message_id, ${recordProjection(store, 'r')}
      FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
        AND ${matchingSubjects(store, 'r', 'e')}
      WHERE ${handoffFilter.sql}
        AND e.event_kind IN ('item.handoff', 'task.handoff') AND e.seq <= ?
      ORDER BY e.seq DESC LIMIT 1
    `).get(...handoffFilter.params, throughSeq));
    const latestHandoff = handoffRow ? {
      eventSeq: Number(handoffRow.seq), record: decodeMessageRow(handoffRow),
    } : null;
    const messageCountFilter = subjectFilter(store, subject);
    const messageCount = Number(runSqlite(() => store.database.prepare(`
      SELECT COUNT(*) AS count FROM events
      WHERE thread_id = ? AND ${messageCountFilter.sql}
        AND message_id IS NOT NULL AND seq <= ?
    `).get(subject.id, ...messageCountFilter.params, throughSeq)).count);

    const references = new Set(item.body.context_artifacts ?? []);
    for (const {record} of approvals) {
      record.body.evidence_refs.forEach(reference => references.add(reference));
    }
    for (const {record} of recentMessages) {
      if (!record) continue;
      record.body.artifact_refs.forEach(reference => references.add(reference));
      record.body.evidence_refs.forEach(reference => references.add(reference));
    }
    if (latestHandoff?.record) {
      latestHandoff.record.body.artifact_refs.forEach(reference => references.add(reference));
      latestHandoff.record.body.evidence_refs.forEach(reference => references.add(reference));
    }
    for (const {openedMessage, answerMessages} of questions) {
      for (const message of [openedMessage, ...answerMessages]) {
        if (!message) continue;
        message.body.artifact_refs.forEach(reference => references.add(reference));
        message.body.evidence_refs.forEach(reference => references.add(reference));
      }
    }
    for (const id of recoveryHold?.record?.body.recovery_evidence_ids ?? []) {
      references.add(`evidence:${id}`);
    }
    const referencedDetails = [];
    for (const reference of references) {
      const identity = referencedRecordId(reference);
      if (identity) {
        referencedDetails.push({
          reference,
          record: readSubjectRecord(store, identity.kind, identity.id, subject),
        });
      }
    }

    return {
      throughSeq,
      item,
      dependencies,
      questions,
      recoveryHold,
      approvals,
      recentMessages,
      latestHandoff,
      messageCount,
      referencedDetails,
    };
  });
}

function messageRows(store, threadId, beforeSeq, limit, subject = undefined) {
  const filter = subject === undefined
    ? {sql: '1 = 1', params: []}
    : subjectFilter(store, subject, 'e');
  return runSqlite(() => store.database.prepare(`
    SELECT e.seq, e.message_id, ${recordProjection(store, 'r')}
    FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
      AND ${matchingSubjects(store, 'r', 'e')}
    WHERE e.thread_id = ? AND ${filter.sql}
      AND e.message_id IS NOT NULL AND e.seq < ?
    ORDER BY e.seq DESC LIMIT ?
  `).all(threadId, ...filter.params, beforeSeq, limit));
}

function decodeMessageRow(row) {
  if (row.id === null) {
    throw new RuntimeError(
      'EVIDENCE_GAP',
      `message/${row.message_id} referenced by event ${row.seq} is missing`,
    );
  }
  return decodeRecord(row);
}

/**
 * Read one bounded page from a durable message thread in reverse event order.
 * LIMIT + 1 determines hasMore. Continuation cursors contain only threadId and
 * beforeSeq, never an untrusted count or a per-page suffix recount.
 */
export function readMessagePage(store, {threadId, beforeSeq = null, limit}) {
  assertStore(store);
  if (typeof threadId !== 'string' || threadId === '') {
    invalid('message threadId must be a string');
  }
  if (beforeSeq !== null
    && (!Number.isSafeInteger(beforeSeq) || beforeSeq < 1)) {
    invalid('message beforeSeq must be a positive safe integer or null');
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    invalid('message limit must be an integer from 1 through 100');
  }

  return readSnapshot(store, () => {
    const rows = messageRows(store, threadId, beforeSeq ?? Number.MAX_SAFE_INTEGER, limit + 1);
    const messages = rows.map(row => ({
      ...decodeMessageRow(row),
      eventSeq: Number(row.seq),
    })).slice(0, limit);
    const hasMore = rows.length > limit;
    const nextCursor = hasMore
      ? {
          threadId,
          beforeSeq: messages.at(-1).eventSeq,
        }
      : null;
    return {messages, hasMore, nextCursor};
  });
}

export function readOperationReceipt(store, command) {
  assertStore(store);
  validateCommand(command);
  const row = runSqlite(() => store.database.prepare(
    'SELECT payload_digest, receipt FROM operations WHERE id = ?').get(command.operationId));
  if (!row) return null;
  if (row.payload_digest !== commandDigest(command)) {
    throw new RuntimeError('OPERATION_CONFLICT', `operation ${command.operationId} was already used with a different command`);
  }
  return validateReceipt(parseJson(row.receipt, `operation ${command.operationId} receipt`), command.operationId);
}

export function readMessageOperation(store, messageId) {
  assertStore(store);
  if (typeof messageId !== 'string' || messageId === '') {
    invalid('message id must be a string');
  }
  const row = runSqlite(() => store.database.prepare(`
    SELECT e.operation_id, e.payload, o.receipt
    FROM events e
    JOIN operations o ON o.id = e.operation_id
    WHERE json_extract(e.payload, '$.payload.messageId') = ?
    ORDER BY e.seq
    LIMIT 1
  `).get(messageId));
  if (!row) return null;
  return {
    operationId: row.operation_id,
    event: parseJson(row.payload, `message/${messageId} event`),
    receipt: validateReceipt(
      parseJson(row.receipt, `operation ${row.operation_id} receipt`),
      row.operation_id,
    ),
  };
}

function writeRecord(database, record) {
  const current = runSqlite(() => database.prepare(`
    SELECT version FROM records WHERE kind = ? AND id = ?
  `).get(record.kind, record.id));
  if (!current) {
    if (record.version !== 1) {
      throw new RuntimeError(
        'VERSION_CONFLICT',
        `new record ${record.kind}/${record.id} must begin at version 1`,
      );
    }
    runSqlite(() => database.prepare(`
      INSERT INTO records (kind, id, subject_kind, subject_id, version, body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      record.kind,
      record.id,
      record.subject?.kind ?? null,
      record.subject?.id ?? null,
      record.version,
      canonicalJson(record.body),
    ));
    return;
  }
  if (record.version !== current.version + 1) {
    throw new RuntimeError(
      'VERSION_CONFLICT',
      `record ${record.kind}/${record.id} expected next version ${current.version + 1}, received ${record.version}`,
    );
  }
  const outcome = runSqlite(() => database.prepare(`
    UPDATE records
    SET subject_kind = ?, subject_id = ?, version = ?, body = ?
    WHERE kind = ? AND id = ? AND version = ?
  `).run(
    record.subject?.kind ?? null,
    record.subject?.id ?? null,
    record.version,
    canonicalJson(record.body),
    record.kind,
    record.id,
    current.version,
  ));
  if (outcome.changes !== 1) {
    throw new RuntimeError(
      'VERSION_CONFLICT',
      `record ${record.kind}/${record.id} changed during update`,
    );
  }
}

function snapshotJson(value) {
  return JSON.parse(canonicalJson(value));
}

function invalidateStore(store) {
  let closeError;
  try {
    store.database.close();
  } catch (error) {
    closeError = error;
  } finally {
    store.closed = true;
  }
  return closeError;
}

function rollbackOperation(store, operationError) {
  try {
    runSqlite(() => store.database.exec('ROLLBACK'));
  } catch (rollbackError) {
    const errors = [operationError, rollbackError];
    const closeError = invalidateStore(store);
    if (closeError) errors.push(closeError);
    const failure = new RuntimeError(
      'RECOVERY_REQUIRED',
      `operation failed and rollback could not be confirmed: ${operationError.message}; rollback failed: ${rollbackError.message}`,
    );
    failure.cause = new AggregateError(
      errors,
      'coordination operation and rollback both failed',
    );
    throw failure;
  }
}

export function applyOperation(store, command, mutate) {
  assertStore(store);
  if (store.mode === 'read') invalid('read-only coordination store cannot apply operations');
  assertWorkspaceWrite(store.path, {privateCheck: false});
  const internalCommand = snapshotJson(command);
  validateCommand(internalCommand);
  if (typeof mutate !== 'function') invalid('operation mutate callback must be a function');
  const digest = commandDigest(internalCommand);
  let inTransaction = false;

  try {
    runSqlite(() => store.database.exec('BEGIN IMMEDIATE'));
    inTransaction = true;
    assertWorkspaceWrite(store.path);
    const legacy = store.database.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='legacy_sources'").get();
    if (legacy && store.database.prepare(
      "SELECT source_id FROM legacy_sources WHERE kind=? AND declared_id=? AND status IN ('quarantined','archived') LIMIT 1",
    ).get(internalCommand.recordKind, internalCommand.recordId)) {
      throw new RuntimeError('EVIDENCE_GAP', 'legacy identity is quarantined; use explicit authorized revalidation, not a new runtime record');
    }
    if (legacy && internalCommand.expectedVersion === 0 && ['item', 'initiative'].includes(internalCommand.recordKind)
      && store.database.prepare(`SELECT source_id FROM legacy_sources
        WHERE status='quarantined' AND
          ((kind=? AND declared_id IS NULL) OR json_extract(parsed,'$.identityUnresolved')=1) LIMIT 1`).get(internalCommand.recordKind)) {
      throw new RuntimeError('EVIDENCE_GAP', 'unresolved legacy identity prevents new records until explicit source reconciliation');
    }

    const receipt = readOperationReceipt(store, internalCommand);
    if (receipt) {
      runSqlite(() => store.database.exec('COMMIT'));
      inTransaction = false;
      return receipt;
    }

    const primaryBaseline = readRecord(
      store,
      internalCommand.recordKind,
      internalCommand.recordId,
    );
    const actualVersion = primaryBaseline?.version ?? 0;
    if (actualVersion !== internalCommand.expectedVersion) {
      throw new RuntimeError(
        'VERSION_CONFLICT',
        `record ${internalCommand.recordKind}/${internalCommand.recordId} is version ${actualVersion}; expected ${internalCommand.expectedVersion}`,
      );
    }
    const callbackCurrent = primaryBaseline === null
      ? null
      : snapshotJson(primaryBaseline);
    const primarySubject = primaryBaseline?.subject
      ?? (internalCommand.recordKind === 'item'
        ? {kind: 'item', id: internalCommand.recordId}
        : HIERARCHY_KINDS.has(internalCommand.recordKind)
          || internalCommand.recordKind === 'initiative'
          ? null
        : ['attempt.start', 'effect.intent'].includes(internalCommand.kind)
          ? {kind: 'item', id: internalCommand.payload.taskId}
          : null);
    const eventSubject = HIERARCHY_KINDS.has(internalCommand.recordKind)
      ? {kind: internalCommand.recordKind, id: internalCommand.recordId}
      : primarySubject;

    let eventSeq = 0;
    let appendedEvents = 0;
    let transactionAvailable = true;
    const requireTransaction = () => {
      if (!transactionAvailable) {
        invalid('transaction methods are only available during mutate');
      }
    };
    const appendEvent = payload => {
      if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
        invalid('event payload must be an object');
      }
      const outcome = runSqlite(() => store.database.prepare(`
        INSERT INTO events (operation_id, subject_kind, subject_id, payload)
        VALUES (?, ?, ?, ?)
      `).run(
        internalCommand.operationId,
        eventSubject?.kind ?? null,
        eventSubject?.id ?? null,
        canonicalJson(payload),
      ));
      appendedEvents += 1;
      eventSeq = Number(outcome.lastInsertRowid);
      return eventSeq;
    };
    const tx = {
      get(kind, id) {
        requireTransaction();
        return readRecord(store, kind, id);
      },
      list(kind, subject = undefined) {
        requireTransaction();
        return listRecords(store, {kind, subject});
      },
      put(record) {
        requireTransaction();
        validateRecord(record);
        if (record.kind === internalCommand.recordKind
          && record.id === internalCommand.recordId) {
          invalid('mutate must return the primary record body instead of putting it');
        }
        writeRecord(store.database, record);
      },
      appendEvent(payload) {
        requireTransaction();
        return appendEvent(payload);
      },
    };

    let nextBody;
    try {
      nextBody = mutate(callbackCurrent, tx);
    } finally {
      transactionAvailable = false;
    }
    if (nextBody && typeof nextBody.then === 'function') {
      invalid('operation mutate callback must be synchronous');
    }
    validateCommandMutation(internalCommand, primaryBaseline, nextBody);
    const primary = validateRecord({
      kind: internalCommand.recordKind,
      id: internalCommand.recordId,
      subject: primarySubject,
      version: internalCommand.expectedVersion + 1,
      body: nextBody,
    });
    writeRecord(store.database, primary);
    if (appendedEvents === 0) {
      eventSeq = appendEvent({
        kind: internalCommand.kind,
        actor: internalCommand.actor,
        recordKind: internalCommand.recordKind,
        recordId: internalCommand.recordId,
        payload: internalCommand.payload,
      });
    }

    const accepted = {
      ok: true,
      operationId: internalCommand.operationId,
      recordVersion: primary.version,
      eventSeq,
      data: {record: primary},
    };
    runSqlite(() => store.database.prepare(`
      INSERT INTO operations (id, payload_digest, receipt)
      VALUES (?, ?, ?)
    `).run(internalCommand.operationId, digest, canonicalJson(accepted)));
    runSqlite(() => store.database.exec('COMMIT'));
    inTransaction = false;
    return accepted;
  } catch (error) {
    if (inTransaction) {
      rollbackOperation(store, error);
    }
    throw error;
  }
}
