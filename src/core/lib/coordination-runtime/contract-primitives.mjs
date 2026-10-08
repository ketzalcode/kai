import {createHash} from 'node:crypto';

export const SUBJECT_KINDS = new Set(['git', 'sha256', 'bundle-sha256']);
export const PACKS = new Set(['core', 'engineering', 'creative']);

export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export const HEX_DIGEST = /^[0-9a-f]{64}$/i;
export const GIT_OBJECT = /^[0-9a-f]{7,40}$/i;
export const SLUG = '[a-z0-9]+(?:-[a-z0-9]+)*';
export const EPIC_ID = new RegExp(`^epic:(?<slug>${SLUG})$`);
export const TYPED_ID = new RegExp(`^(?<pack>core|engineering|creative):(?<kind>feature|requirement|task):(?<slug>${SLUG})$`);

export class RuntimeError extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = 'RuntimeError';
    this.code = code;
    this.retryable = retryable;
  }
}

export function invalid(message) {
  throw new RuntimeError('INVALID_INPUT', message);
}

export function isPlainObject(value) {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

export function assertExactKeys(value, allowed, label, required = allowed) {
  if (!isPlainObject(value)) invalid(`${label} must be an object`);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) invalid(`${label} contains unknown field "${key}"`);
  }
  for (const key of required) {
    if (!Object.hasOwn(value, key)) invalid(`${label} is missing "${key}"`);
  }
}

export function assertNonEmptyString(value, label) {
  if (typeof value !== 'string' || value.trim() === '') {
    invalid(`${label} must be a non-empty string`);
  }
}

export function assertNullableString(value, label) {
  if (value !== null) assertNonEmptyString(value, label);
}

export function assertBoolean(value, label) {
  if (typeof value !== 'boolean') invalid(`${label} must be a boolean`);
}

export function assertTimestamp(value, label) {
  assertNonEmptyString(value, label);
  if (Number.isNaN(Date.parse(value))) invalid(`${label} must be an ISO-compatible timestamp`);
}

export function assertUuid(value, label) {
  if (typeof value !== 'string' || !UUID.test(value)) invalid(`${label} must be a UUID`);
}

export function assertStringArray(value, label, {nonEmpty = false} = {}) {
  if (!Array.isArray(value) || (nonEmpty && value.length === 0)) {
    invalid(`${label} must be ${nonEmpty ? 'a non-empty' : 'an'} array`);
  }
  for (const entry of value) assertNonEmptyString(entry, `${label} entry`);
  if (new Set(value).size !== value.length) invalid(`${label} must not contain duplicates`);
}

export function validateActor(actor, label = 'actor') {
  assertExactKeys(actor, new Set(['role', 'runId']), label);
  assertNonEmptyString(actor.role, `${label}.role`);
  assertNonEmptyString(actor.runId, `${label}.runId`);
}

export function validateNullableActor(actor, label) {
  if (actor !== null) validateActor(actor, label);
}

function encodeCanonical(value, ancestors) {
  if (value === null) return 'null';
  if (typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) invalid('JSON numbers must be finite');
    return JSON.stringify(value);
  }
  if (typeof value !== 'object') {
    invalid(`unsupported JSON value type "${typeof value}"`);
  }
  if (ancestors.has(value)) invalid('cyclic JSON values are not supported');

  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) invalid('sparse arrays are not supported');
      }
      return `[${value.map(entry => encodeCanonical(entry, ancestors)).join(',')}]`;
    }
    if (!isPlainObject(value)) invalid('JSON objects must use a plain object prototype');
    if (Object.getOwnPropertySymbols(value).length > 0) {
      invalid('symbol-keyed JSON fields are not supported');
    }
    const keys = Object.keys(value).sort();
    return `{${keys.map(key =>
      `${JSON.stringify(key)}:${encodeCanonical(value[key], ancestors)}`).join(',')}}`;
  } finally {
    ancestors.delete(value);
  }
}

export function canonicalJson(value) {
  return encodeCanonical(value, new WeakSet());
}

export function commandDigest(command) {
  return createHash('sha256').update(canonicalJson(command), 'utf8').digest('hex');
}

export function validateSubjectRef(subject, label = 'subject') {
  if (!isPlainObject(subject)) invalid(`${label} must be an object`);
  if (!SUBJECT_KINDS.has(subject.kind)) invalid(`${label}.kind is unsupported`);
  if (subject.kind === 'git') {
    assertExactKeys(subject, new Set(['kind', 'base', 'head']), label);
    if (!GIT_OBJECT.test(subject.base) || !GIT_OBJECT.test(subject.head)) {
      invalid(`${label} git base/head must be immutable git object IDs`);
    }
  } else if (subject.kind === 'sha256') {
    assertExactKeys(subject, new Set(['kind', 'digest', 'path']), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid(`${label}.digest must be SHA-256`);
    assertNonEmptyString(subject.path, `${label}.path`);
  } else {
    assertExactKeys(subject, new Set(['kind', 'digest', 'entries']), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid(`${label}.digest must be SHA-256`);
    if (!Array.isArray(subject.entries) || subject.entries.length === 0) {
      invalid(`${label}.entries must be a non-empty array`);
    }
    for (const [index, entry] of subject.entries.entries()) {
      assertExactKeys(entry, new Set(['path', 'digest']), `${label}.entries[${index}]`);
      assertNonEmptyString(entry.path, `${label}.entries[${index}].path`);
      if (!HEX_DIGEST.test(entry.digest)) {
        invalid(`${label}.entries[${index}].digest must be SHA-256`);
      }
    }
  }
  return subject;
}

export function validateNullableSubject(subject, label) {
  if (subject !== null) validateSubjectRef(subject, label);
}

export function parseEpicId(value, label) {
  const match = typeof value === 'string' ? value.match(EPIC_ID) : null;
  if (!match) invalid(`${label} must match "epic:<slug>"`);
  return match.groups;
}

export function parseTypedId(value, expectedKind, label) {
  const match = typeof value === 'string' ? value.match(TYPED_ID) : null;
  if (!match || match.groups.kind !== expectedKind) {
    invalid(`${label} must match "<pack>:${expectedKind}:<slug>"`);
  }
  return match.groups;
}

export function validateChangesPayload(command, fields, label) {
  assertExactKeys(command.payload, new Set(['changes']), `${label} payload`);
  if (!isPlainObject(command.payload.changes)
    || Object.keys(command.payload.changes).length === 0) {
    invalid(`${label} payload.changes must be a non-empty object`);
  }
  for (const key of Object.keys(command.payload.changes)) {
    if (!fields.has(key)) invalid(`${label} cannot change "${key}"`);
  }
}

export function changedKeys(before, after) {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter(key => canonicalJson(before[key]) !== canonicalJson(after[key]));
}

export function assertChangedOnly(current, nextBody, allowed, label) {
  for (const key of changedKeys(current.body, nextBody)) {
    if (!allowed.has(key)) invalid(`${label} may not change "${key}"`);
  }
}
