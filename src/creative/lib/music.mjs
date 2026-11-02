import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

export const CUE_SCHEMA = 'kai.demo-music-cue/v1';
export const ACCEPTANCE_SCHEMA = 'kai.demo-music-acceptance/v1';

const SOURCES = new Set(['supplied', 'licensed', 'generated']);
const ENERGIES = new Set(['low', 'medium', 'high']);

function fail(message) {
  throw new Error(message);
}

function num(value, label, {min = -Infinity, max = Infinity} = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) fail(`${label} must be a number, got ${JSON.stringify(value)}`);
  if (n < min || n > max) fail(`${label} must be within ${min}..${max}, got ${n}`);
  return n;
}

function str(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be a non-empty string`);
  return value;
}

export function cueHash(cueText) {
  return createHash('sha256').update(cueText.trim(), 'utf8').digest('hex').slice(0, 16);
}

export function parseMusicCue(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the music cue is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== CUE_SCHEMA) {
    fail(`the music cue must declare "schema": "${CUE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  const source = str(raw.source, 'source');
  if (!SOURCES.has(source)) fail(`source must be one of ${[...SOURCES].join(', ')}, got ${JSON.stringify(source)}`);

  const energy = raw.energy === undefined || raw.energy === null ? null : str(raw.energy, 'energy');
  if (energy !== null && !ENERGIES.has(energy)) fail(`energy must be one of ${[...ENERGIES].join(', ')}, got ${JSON.stringify(energy)}`);

  return {
    schema: CUE_SCHEMA,
    path: str(raw.path, 'path'),
    title: str(raw.title, 'title'),
    source,
    rights: str(raw.rights, 'rights'),
    style: typeof raw.style === 'string' && raw.style.trim() !== '' ? raw.style : null,
    tempo_bpm: raw.tempo_bpm === undefined || raw.tempo_bpm === null ? null : num(raw.tempo_bpm, 'tempo_bpm', {min: 20, max: 300}),
    energy,
    duration_sec: num(raw.duration_sec, 'duration_sec', {min: 0.1, max: 36000}),
  };
}

export function parseMusicAcceptance(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the music acceptance is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== ACCEPTANCE_SCHEMA) {
    fail(`the music acceptance must declare "schema": "${ACCEPTANCE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  return {
    schema: ACCEPTANCE_SCHEMA,
    cue_hash: str(raw.cue_hash, 'cue_hash'),
    track_hash: str(raw.track_hash, 'track_hash'),
    operator: str(raw.operator, 'operator'),
    accepted_at: str(raw.accepted_at, 'accepted_at'),
    note: typeof raw.note === 'string' ? raw.note : '',
    auditioned: raw.auditioned === 'speech+music' ? 'speech+music' : 'music-only',
  };
}

export function acceptCue(cueText, {operator, note = '', auditioned = 'speech+music', now = () => new Date().toISOString()} = {}) {
  str(operator, 'operator');
  return {
    schema: ACCEPTANCE_SCHEMA,
    cue_hash: cueHash(cueText),
    track_hash: createHash('sha256').update(readFileSync(parseMusicCue(cueText).path)).digest('hex'),
    operator,
    accepted_at: now(),
    note,
    auditioned: auditioned === 'speech+music' ? 'speech+music' : 'music-only',
  };
}

// Acceptance covers the cue metadata and the exact audio bytes auditioned.
export function requireAcceptance(cueText, acceptance) {
  const expected = cueHash(cueText);
  if (acceptance.cue_hash !== expected) {
    fail(`this acceptance names cue hash "${acceptance.cue_hash}", but the supplied cue hashes to "${expected}"; it was not accepted -- the cue changed, or a different candidate was approved`);
  }
  const trackHash = createHash('sha256').update(readFileSync(parseMusicCue(cueText).path)).digest('hex');
  if (acceptance.track_hash !== trackHash) fail('the music track bytes changed after acceptance; audition and accept the new track before using it');
  if (acceptance.auditioned !== 'speech+music') {
    fail(`this acceptance recorded a "${acceptance.auditioned}" audition, not "speech+music"; technical validity is not an aesthetic acceptance, and a music-only audition cannot judge fit against the narration`);
  }
}
