// Shared activity-log reading and writing.
//
// The activity log is the *ephemeral* sibling of the coordination item record.
// The item record is a compare-and-swap surface: every write is version-
// incrementing and lease-verified, so a high-frequency heartbeat cannot live
// there without inflating the very field that detects racing. This log is the
// opposite shape — append-only, one line per record, never read-modify-write.
//
// THE BOUNDARY (enforced here, not merely documented)
// ---------------------------------------------------
// This log carries "who is doing what right now". It MUST NOT carry state,
// verdicts, reviews, or decisions — those stay authoritative on the item. A
// record that tries to express one is rejected at write time by `buildRecord`,
// because a boundary defended only by prose is a boundary that drifts.
//
// SAFETY (measured, not assumed)
// ------------------------------
// Each agent is a separate OS process, so JS being single-threaded grants no
// mutual exclusion. What makes concurrent writes safe is O_APPEND plus one
// write() per record: 8 concurrent processes x 400 appends produced 3200 intact
// lines with zero loss or corruption. Hence: append-only, one line, bounded.
//
// PRIVACY
// -------
// kai is a public plugin and this file is gitignored but pasteable. No absolute
// path, no username, no command text, no prompt text, and only one short
// bounded free-text field ever reaches it.
//
// Node built-ins only; imported by checks CI runs with no install step.

import { appendFileSync, readFileSync, existsSync, mkdirSync, renameSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';

// Workspace-relative by contract: an absolute path must never be recorded.
export const LOG_REL = '.kai/activity.jsonl';

// Closed vocabulary. An unknown event is dropped rather than invented, on the
// classifyGapReason precedent — a free-form event type is a free-form schema.
export const EVENTS = new Set(['start', 'progress', 'stop']);

// Why a run ended. "stop" is deliberately outcome-poor: it says the run ended
// and how it handed off, never what the work concluded.
export const OUTCOMES = new Set(['handoff', 'done', 'blocked', 'abandoned']);

// Fields that would fork the truth with the item record. Naming any of these is
// a contract violation, not a warning: the item is the only place they are real.
export const FORBIDDEN_FIELDS = new Set([
  'state', 'resume_state', 'verdict', 'review', 'completed_reviews',
  'review_requirements', 'change_ref', 'version', 'lease', 'decision', 'approved',
]);

// Field shapes, shared by the write path and the read path. The writer enforces
// them, but the reader must too: a hand-edited, externally written, or partially
// corrupt line would otherwise carry a username or a path straight into output
// that is designed to be pasted into a public issue.
const ROLE_RE = /^[a-z0-9-]{1,60}$/;
const ITEM_RE = /^[a-z0-9-]{1,80}$/;
const RUN_RE = /^[a-z0-9]{6,16}$/;

export const MAX_NOTE = 120;
export const MAX_LINE = 1024;
export const MAX_BYTES = 512 * 1024;

// A short non-identifying digest. Used for run correlation only: it pairs a
// start with its stop without naming a machine, a user, or a path.
export function digest(input) {
  let h1 = 0x811c9dc5, h2 = 0x01000193;
  const s = String(input);
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 0x01000193) >>> 0;
    h2 = Math.imul(h2 + s.charCodeAt(i) + 1, 0x85ebca6b) >>> 0;
  }
  return (h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0')).slice(0, 12);
}

// Anything that looks like a filesystem location or a home directory is a leak
// vector: absolute paths carry the username on every platform.
const ABSOLUTE = /(^|[\s"'(=])([A-Za-z]:[\\/]|\/(?:home|Users|root|mnt|var|tmp|etc)\b|\\\\|~[\\/])/;

export function looksAbsolute(s) {
  return typeof s === 'string' && ABSOLUTE.test(s);
}

// Free text is the only place model-authored prose enters the log, so it is
// bounded, single-line, and stripped of anything path-shaped.
export function safeNote(note) {
  if (typeof note !== 'string') return null;
  const flat = note.replace(/[\r\n\t]+/g, ' ').replace(/\s{2,}/g, ' ').trim();
  if (!flat) return null;
  if (looksAbsolute(flat)) return null;
  return flat.length > MAX_NOTE ? `${flat.slice(0, MAX_NOTE - 1)}~` : flat;
}

/**
 * Validate and normalize one record. Returns { ok, record } or { ok:false, reason }.
 * Rejection is the enforcement point for the item/log boundary.
 */
export function buildRecord(input, now = Date.now()) {
  if (!input || typeof input !== 'object') return { ok: false, reason: 'record must be an object' };

  for (const k of Object.keys(input)) {
    if (FORBIDDEN_FIELDS.has(k)) {
      return { ok: false, reason: `field "${k}" belongs to the item record, not the activity log` };
    }
  }

  const e = String(input.e || '').trim();
  if (!EVENTS.has(e)) return { ok: false, reason: `unknown event "${e}"` };

  const role = String(input.role || '').trim();
  if (!ROLE_RE.test(role)) return { ok: false, reason: 'role must be a kebab-case role id' };

  const item = input.item == null ? null : String(input.item).trim();
  if (item !== null && !ITEM_RE.test(item)) return { ok: false, reason: 'item must be a kebab-case item id' };

  const run = String(input.run || '').trim();
  if (!RUN_RE.test(run)) return { ok: false, reason: 'run must be a short opaque id' };

  // Epoch SECONDS, consistently. `next_report_by`, `runs()`, and the overlay all
  // work in seconds; a millisecond `t` here would make every silence figure
  // nonsense. `now` arrives in milliseconds because callers pass `Date.now()`.
  const nowSec = Math.floor(now / 1000);
  const rec = {
    t: input.t != null ? Math.floor(Number(input.t)) : nowSec,
    src: 'declared', e, role, run,
  };
  if (!Number.isFinite(rec.t)) return { ok: false, reason: 't must be an epoch-seconds integer' };
  if (item) rec.item = item;

  if (e === 'stop') {
    const outcome = String(input.outcome || '').trim();
    if (!OUTCOMES.has(outcome)) return { ok: false, reason: `unknown outcome "${outcome}"` };
    rec.outcome = outcome;
  }

  // A self-declared deadline is what makes silence checkable. Without it a
  // quiet run is indistinguishable from a dead one, which is exactly the
  // ambiguity this log exists to reduce.
  if (input.next_report_by != null) {
    const by = Math.floor(Number(input.next_report_by));
    if (!Number.isFinite(by)) return { ok: false, reason: 'next_report_by must be an epoch-seconds integer' };
    rec.next_report_by = by;
  } else if (e !== 'stop') {
    return { ok: false, reason: 'start and progress must declare next_report_by' };
  }

  const note = safeNote(input.note);
  if (note) rec.note = note;

  const line = JSON.stringify(rec);
  if (line.length > MAX_LINE) return { ok: false, reason: 'record exceeds the line bound' };
  if (looksAbsolute(line)) return { ok: false, reason: 'record contains a filesystem path' };

  return { ok: true, record: rec, line };
}

export function logPath(root) {
  return join(root, LOG_REL);
}

// Rotation is best-effort and MAY run concurrently: every append from every
// process calls it. Two processes past the bound will both try to rename, and
// the loser's rename simply fails and is swallowed. Losing history is
// acceptable here; corrupting a live append is not.
function rotate(file) {
  try {
    if (!existsSync(file)) return;
    if (statSync(file).size < MAX_BYTES) return;
    renameSync(file, `${file}.1`);
  } catch { /* a failed rotation must never block the work being reported */ }
}

/**
 * Append one record. Returns { ok, reason? }. Never throws: a failure to
 * report must not fail the work being reported.
 */
export function append(root, input, now = Date.now()) {
  const built = buildRecord(input, now);
  if (!built.ok) return built;
  const file = logPath(root);
  try {
    mkdirSync(dirname(file), { recursive: true });
    rotate(file);
    appendFileSync(file, `${built.line}\n`);
    return { ok: true, record: built.record };
  } catch (err) {
    return { ok: false, reason: `append failed: ${err.code || 'unknown'}` };
  }
}

// Re-validate on read. The writer cannot be the only gate: the log is a plain
// file, so a hand-edit, an external writer, or a partial line could otherwise
// carry a path or a username into rendered output. A record that fails these
// shapes is counted as skipped, exactly like a corrupt line.
function readable(r) {
  if (!r || typeof r !== 'object') return false;
  if (!EVENTS.has(r.e)) return false;
  if (typeof r.run !== 'string' || !RUN_RE.test(r.run)) return false;
  if (typeof r.role !== 'string' || !ROLE_RE.test(r.role)) return false;
  if (r.item != null && !(typeof r.item === 'string' && ITEM_RE.test(r.item))) return false;
  if (r.next_report_by != null && !Number.isFinite(Number(r.next_report_by))) return false;
  if (r.outcome != null && !OUTCOMES.has(r.outcome)) return false;
  if (r.note != null && (typeof r.note !== 'string' || r.note.length > MAX_NOTE || looksAbsolute(r.note))) return false;
  return Number.isFinite(Number(r.t));
}

/**
 * Read the log. A partial or corrupt line is skipped, not fatal — the overlay
 * must degrade to absent rather than break the report that consumes it.
 */
export function read(root) {
  const file = logPath(root);
  if (!existsSync(file)) return { present: false, records: [], skipped: 0 };
  let raw;
  try { raw = readFileSync(file, 'utf8'); } catch { return { present: false, records: [], skipped: 0 }; }
  const records = [];
  let skipped = 0;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (readable(r)) records.push(r);
      else skipped++;
    } catch { skipped++; }
  }
  return { present: true, records, skipped };
}

/**
 * Fold records into per-run state. Pairs start with stop; a run with no stop is
 * open. Deliberately reports `overdue` rather than "crashed": this log is
 * self-reported, and silence past a deadline is the strongest honest claim
 * available without an external observer.
 */
export function runs(records, now = Date.now()) {
  const nowSec = Math.floor(now / 1000);
  const byRun = new Map();
  for (const r of records) {
    let s = byRun.get(r.run);
    if (!s) {
      s = { run: r.run, role: r.role, item: r.item || null, started: null, last: null, deadline: null, stopped: null, outcome: null, events: 0 };
      byRun.set(r.run, s);
    }
    s.events++;
    if (r.role) s.role = r.role;
    if (r.item) s.item = r.item;
    if (r.e === 'start') s.started = r.t;
    if (r.e === 'stop') { s.stopped = r.t; s.outcome = r.outcome || null; }
    if (s.last === null || r.t >= s.last) {
      s.last = r.t;
      if (r.next_report_by != null) s.deadline = r.next_report_by;
    }
  }
  const out = [];
  for (const s of byRun.values()) {
    s.open = s.stopped === null;
    s.overdue = s.open && s.deadline != null && s.deadline < nowSec;
    s.silent_for = s.open && s.last != null ? nowSec - s.last : null;
    out.push(s);
  }
  return out.sort((a, b) => (b.last || 0) - (a.last || 0));
}
