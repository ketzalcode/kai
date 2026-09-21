import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import {existsSync} from 'node:fs';
import {canonicalJson, RuntimeError} from './contract.mjs';
import {safePath, exactFile, exclusiveFile, privateAdmission} from './migration-files.mjs';

const lane = '.kai/state/host';
const fail = (code, message) => { throw new RuntimeError(code, message); };
const kinds = new Set(['requests', 'capabilities', 'captures', 'preparations', 'reservations']);
const requireKind = kind => { if (!kinds.has(kind)) fail('INVALID_INPUT', 'unsupported native issuer record kind'); };
export function capabilityId(id) {
  if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    fail('AUTHORITY_REQUIRED', 'an issued capability/request UUID is required');
  }
  return id;
}
function key(root, create) {
  const name = `${lane}/key`;
  const present = existsSync(safePath(root, name));
  const admission = privateAdmission(root, {admit: create && !present});
  if (admission.errors.length) fail('INVALID_INPUT', admission.errors.join('; '));
  if (!present) {
    if (!create) fail('AUTHORITY_REQUIRED', 'no native capability issuer has been initialized');
    try { exclusiveFile(root, name, randomBytes(32)); }
    catch (error) { if (error.code !== 'EEXIST') throw error; }
  }
  const bytes = exactFile(root, name);
  if (bytes.length !== 32) fail('AUTHORITY_REQUIRED', 'invalid native issuer key');
  return bytes;
}
function signature(root, payload, create = false) {
  return createHmac('sha256', key(root, create)).update(canonicalJson(payload)).digest('hex');
}
export function writeIssued(root, kind, id, payload) {
  requireKind(kind);
  capabilityId(id);
  const value = {payload, mac: signature(root, payload, true)};
  const name = `${lane}/${kind}/${id}.json`;
  if (existsSync(safePath(root, name))) {
    if (canonicalJson(readIssued(root, kind, id)) !== canonicalJson(payload)) fail('OPERATION_CONFLICT', 'issued identity already has different content');
    return;
  }
  exclusiveFile(root, name, canonicalJson(value));
}
export function readIssued(root, kind, id) {
  requireKind(kind);
  capabilityId(id);
  const name = `${lane}/${kind}/${id}.json`;
  if (!existsSync(safePath(root, name))) fail('AUTHORITY_REQUIRED', `no issued ${kind} for this identity`);
  const bytes = exactFile(root, name);
  let value;
  try { value = JSON.parse(bytes); }
  catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    fail('AUTHORITY_REQUIRED', 'issued capability file is malformed');
  }
  if (!value?.payload || typeof value.mac !== 'string' || !/^[a-f0-9]{64}$/.test(value.mac)
    || !timingSafeEqual(Buffer.from(value.mac, 'hex'), Buffer.from(signature(root, value.payload), 'hex'))) {
    fail('AUTHORITY_REQUIRED', 'capability was not issued by this workspace host');
  }
  return value.payload;
}
