#!/usr/bin/env node
// ---------------------------------------------------------------------------
// observe-watch -- an ambient view of the subagent fleet.
//
// WHY THIS EXISTS
//
// `.kai/observed.jsonl` answers the question that reports cannot: which roles
// actually took part in a piece of work, in what order. But reading a JSONL
// file is not watching a team. The gap this closes is attention: a supervisor
// should be able to glance at a second terminal and see who is working, rather
// than scrolling a transcript or waiting on a subagent to return.
//
// WHY IT IS A SEPARATE PROCESS
//
// The observer is not a daemon -- the host spawns it for ~66ms per event and it
// exits. Nothing holds state between events. So the live view has to be its own
// long-running process, and the file is the only thing the two share. That is
// deliberate: the writer cannot be slowed down, blocked, or crashed by whatever
// is rendering, because it does not know a renderer exists.
//
// WHAT IT REFUSES TO DO
//
// It never writes to `observed.jsonl`. A viewer that mutates its own source
// becomes a second, competing writer, and the append-only integrity that makes
// concurrent subagents safe would be gone. This process is strictly read-only.
//
// It also does not invent liveness. A role is shown as working because a start
// was recorded and no stop was, which is a fact about the log -- not a claim
// that a process is alive. An agent that was killed leaves a start behind, so
// long-running entries are aged rather than trusted.
// ---------------------------------------------------------------------------
import { readFileSync, existsSync, watch, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parsePath } from 'node:path';

export const OBSERVED_REL = '.kai/observed.jsonl';
// The writer rotates at MAX_BYTES, so the previous generation is where an
// in-flight start goes when a rotation lands mid-run. Reading only the current
// file would erase workers that are still open.
export const ROTATED_REL = '.kai/observed.jsonl.1';

// The declared tier. Agents write this themselves; the host writes the observed
// tier. Both are needed because neither is complete on its own: the host emits
// no lifecycle events at all for plugin-provided agents, so every kai persona
// is invisible to `observed.jsonl` by construction, while the declared tier
// only ever contains what an agent chose to say before it died.
//
// They are merged for display and never reconciled into a single truth. An
// agent present in one tier and absent from the other is the normal case, not
// a discrepancy to resolve.
export const ACTIVITY_REL = '.kai/activity.jsonl';
// The declared writer rotates at the same bound as the observer, so an
// in-flight declared run lives in the previous generation after a rotation.
// Omitting this made a healthy, running agent vanish from the view.
export const ACTIVITY_ROTATED_REL = '.kai/activity.jsonl.1';

// Kept in step with the writer. A viewer that read more than the writer can
// produce would be reading something else.
const MAX_READ = 512 * 1024;

// The role vocabulary the writer enforces. Anything else reached the file by
// hand, so it is quarantined rather than rendered: a role is a screen label,
// and a label is the one place a hand-edited path or escape sequence would be
// printed verbatim.
// A leading `namespace:` is allowed because the host qualifies plugin-provided
// agents that way (`kai:principal-swe-architect`). Without it, the day those
// events start arriving every one of them would be quarantined as invalid.
const ROLE_RE = /^([a-z0-9-]{1,20}:)?[a-z0-9-]{1,60}$/;
const EVENTS = new Set(['start', 'stop', 'progress']);
// Only these two open and close a run. `progress` refreshes liveness.
const PAIRING_EVENTS = new Set(['start', 'stop']);
export const INVALID_ROLE = '<invalid-role>';

// Everything rendered passes through here. The writer strips control
// characters, but the watcher must not depend on that: it reads a file any
// process on the machine can append to, and a terminal treats an escape
// sequence in a summary as an instruction, not as text.
export function safeText(value, max = 120) {
  if (typeof value !== 'string') return '';
  let out = '';
  for (const ch of value) {
    const c = ch.codePointAt(0);
    // C0, DEL, C1, and the Unicode line/paragraph separators.
    if (c < 0x20 || c === 0x7f || (c >= 0x80 && c <= 0x9f) || c === 0x2028 || c === 0x2029) continue;
    out += ch;
  }
  out = out.trim();
  return out.length > max ? `${out.slice(0, max - 1)}~` : out;
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------
export function findWorkspace(cwd) {
  if (typeof cwd !== 'string' || !cwd) return null;
  let dir = cwd;
  for (let i = 0; i < 64; i++) {
    if (existsSync(join(dir, '.kai')) || existsSync(join(dir, '.git'))) return dir;
    const up = dirname(dir);
    if (up === dir || up === parsePath(dir).root) return null;
    dir = up;
  }
  return null;
}

// A record is skipped, never fatal. The writer appends concurrently, so a torn
// final line is an expected state of the world rather than corruption.
//
// Every field is validated here rather than trusted, because the watcher does
// not read its own output: it reads a plain file that anything can write.
export function parseRecords(text, forcedSrc = null) {
  const out = [];
  if (typeof text !== 'string') return out;
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (!t) continue;
    let rec;
    try {
      rec = JSON.parse(t);
    } catch { continue; /* a partial append, or a hand-edited line */ }
    if (!rec || typeof rec !== 'object') continue;
    // The two writers disagree on the field name: the observer writes `event`,
    // the declared tier writes `e`. Normalising here keeps the disagreement in
    // one place rather than spreading it through pairing and rendering.
    const event = typeof rec.event === 'string' ? rec.event : rec.e;
    if (typeof event !== 'string' || !EVENTS.has(event)) continue;
    if (typeof rec.role !== 'string' || !rec.role) continue;
    const valid = ROLE_RE.test(rec.role);
    const ts = Number(rec.t);
    // Provenance comes from the FILE, never from the record. A record claiming
    // its own tier is a record that can lie about it: anything able to append
    // to the observed log could mark itself `declared` and be rendered as an
    // agent's own considered account, or the reverse. The caller reads one file
    // at a time and states what it opened.
    const src = forcedSrc || (rec.src === 'declared' ? 'declared' : 'observed');
    const nextBy = Number(rec.next_report_by);
    out.push({
      event,
      src,
      role: valid ? rec.role : INVALID_ROLE,
      // A missing session is not the same session as another missing session,
      // so it never becomes a shared pairing key -- see reduceState.
      session: typeof rec.session === 'string' && rec.session ? safeText(rec.session, 40) : '',
      // A run id pairs exactly, but only the declared tier issues them. Taking
      // one from an observed record would let either log close the other's
      // runs, so it is read only from the tier that owns the concept.
      run: src === 'declared' && typeof rec.run === 'string' && rec.run ? safeText(rec.run, 40) : '',
      agent: typeof rec.agent === 'string' && rec.agent ? safeText(rec.agent, 40) : '',
      t: Number.isFinite(ts) && ts >= 0 && ts < 1e12 ? Math.floor(ts) : 0,
      nextBy: Number.isFinite(nextBy) && nextBy > 0 && nextBy < 1e12 ? Math.floor(nextBy) : 0,
      tldr: safeText(rec.tldr || rec.note, 96),
      invalid: !valid,
    });
  }
  return out;
}

// ---------------------------------------------------------------------------
// Duplicate delivery
// ---------------------------------------------------------------------------
// The host occasionally delivers one hook event twice. It is intermittent --
// one confirmed case in a 46-record corpus, not the norm -- so this collapses
// only what it can defend and accepts an undercount of duplicates elsewhere.
//
// The rule depends on whether the record carries an identity:
//
//   with a `run` or `agent` id -- within one second counts as a duplicate.
//   with neither               -- only an IDENTICAL timestamp counts.
//
// The asymmetry is the point. A `start` carries no id at all, so two genuine
// agents of one role launched a second apart are indistinguishable from one
// event delivered twice, and collapsing them would delete an agent that really
// ran. A double-count is visible in the view; a vanished agent is not. So the
// identity-less case is deliberately strict and some duplicate starts survive.
//
// One second is also the ceiling for the identified case: the same corpus shows
// an `agentId` REUSED by two distinct runs 90,244 seconds apart in one session,
// so identity alone is never sufficient.
export function dedupe(records) {
  const seen = new Map();
  const out = [];
  for (const rec of records) {
    // Timestamps are reconciled later, in reduceState. A record with no usable
    // timestamp has nothing to compare against here, so it is passed through
    // untouched rather than being collapsed against, or overwriting, a record
    // whose time is known.
    if (!rec.t) { out.push(rec); continue; }
    const identified = Boolean(rec.run || rec.agent);
    const key = `${rec.src}|${rec.session}|${rec.role}|${rec.event}|${rec.run}|${rec.agent}`;
    const prev = seen.get(key);
    const window = identified ? 1 : 0;
    if (prev !== undefined && Math.abs(rec.t - prev) <= window) continue;
    seen.set(key, rec.t);
    out.push(rec);
  }
  return out;
}

// ---------------------------------------------------------------------------
// State
//
// `subagentStart` carries no agentId, so a start and a stop can only be paired
// by (session, role) in arrival order. When two subagents of the same role run
// at once that pairing is a guess, so the guess is LABELLED rather than
// presented as fact -- the same discipline the reports use.
// ---------------------------------------------------------------------------
export function reduceState(records, now = Math.floor(Date.now() / 1000), opts = {}) {
  const active = new Map(); // key -> array of { role, t }
  const done = new Map();   // role -> count
  let ambiguous = false;
  let invalid = 0;
  let last = 0;
  let startless = false;
  let mismatched = false;
  // Records are ordered by timestamp, so a stop whose clock ran behind its own
  // start sorts ahead of it and looks like two separate half-runs. That is
  // detectable -- an orphan stop and a never-closed start on the same key --
  // and it is reported rather than repaired, because guessing which pair
  // belongs together would invent a run boundary the log does not contain.
  const orphanStops = new Set();
  // Every run the log can account for, open or closed, in the order they
  // began. The ambient view answers "who is working now"; this answers "what
  // happened, in what order", which is the question worth coaching on.
  const runs = [];
  const declaredOnly = new Set();
  const observedOnly = new Set();

  // The file is append-ordered, but timestamps are written by concurrent
  // processes and a hand-edited line can carry anything, so pairing is done on
  // reconciled time. A record with no usable timestamp inherits the one before
  // it: file order is the best evidence available for it, and dropping it would
  // hide a real event.
  const seq = records.map((rec, i) => ({ ...rec, i }));
  let carried = 0;
  for (const rec of seq) {
    if (rec.t > 0) carried = rec.t;
    else rec.t = carried;
  }
  seq.sort((a, b) => a.t - b.t || a.i - b.i);

  for (const rec of seq) {
    if (rec.invalid) invalid++;
    if (rec.src === 'declared') declaredOnly.add(rec.role);
    else observedOnly.add(rec.role);
    // A declared run carries its own id, so it pairs by identity and never
    // needs the ordering guess below. The tier is part of every key: the two
    // logs are written by different things, and a key either of them could
    // construct is a key either of them could use to close the other's runs.
    const key = rec.run
      ? `${rec.src}::run::${rec.run}`
      : (rec.session ? `${rec.src}::${rec.session}::${rec.role}` : `${rec.src}::::${rec.role}`);
    if (rec.t > last) last = rec.t;
    if (rec.event === 'progress') {
      // Not a run boundary. It renews the promise to report, which is what
      // stops a long, healthy run from being rendered as silent.
      const arr = active.get(key);
      if (arr && arr.length) {
        arr[arr.length - 1].heard = rec.t;
        arr[arr.length - 1].nextBy = rec.nextBy || arr[arr.length - 1].nextBy;
      } else if (rec.run) {
        // A run reporting progress with no start in view is still a running
        // agent. Its start rotated out, or the history was cut. Dropping it
        // renders a working fleet as an idle one, which is the one thing this
        // view must never do -- so it is shown, and flagged as incomplete.
        active.set(key, [{
          role: rec.role, t: rec.t, src: rec.src, heard: rec.t, nextBy: rec.nextBy, startless: true,
        }]);
        startless = true;
      }
      continue;
    }
    if (rec.event === 'start') {
      const arr = active.get(key) || [];
      // A run id is unique, so a second start for one is a retry or a replayed
      // line, not a second agent. Pushing it would leave a worker that no stop
      // can ever clear.
      if (rec.run && arr.length) {
        arr[arr.length - 1].heard = rec.t;
        if (rec.nextBy) arr[arr.length - 1].nextBy = rec.nextBy;
        continue;
      }
      arr.push({ role: rec.role, t: rec.t || now, src: rec.src, heard: rec.t || now, nextBy: rec.nextBy });
      if (arr.length > 1 && !rec.run) ambiguous = true;
      active.set(key, arr);
    } else if (rec.event === 'stop') {
      const arr = active.get(key);
      if (arr && arr.length) {
        if (!rec.run && (arr.length > 1 || !rec.session)) ambiguous = true;
        const opened = arr.shift(); // oldest start closes first
        // The run is described by the start it closes, not by the stop that
        // closed it. A stop naming a different role would otherwise rewrite
        // which role took part -- a log line silently editing history.
        if (opened.role !== rec.role || opened.src !== rec.src) mismatched = true;
        runs.push({
          role: opened.role,
          src: opened.src,
          start: opened.t,
          end: rec.t,
          open: false,
          startless: Boolean(opened.startless),
          note: rec.tldr || opened.note || '',
        });
        if (!arr.length) active.delete(key);
      } else {
        // A stop with no start in view. The run is real -- something ended --
        // but its span is unknown, and a zero-length run would read as an
        // instant one rather than as a missing fact.
        runs.push({ role: rec.role, src: rec.src, start: null, end: rec.t, open: false, startless: true, note: rec.tldr || '' });
        orphanStops.add(key);
      }
      done.set(rec.role, (done.get(rec.role) || 0) + 1);
    }
  }

  const working = [];
  let outOfOrder = false;
  for (const [key, arr] of active.entries()) {
    if (orphanStops.has(key)) outOfOrder = true;
    for (const a of arr) {
      working.push({
        role: a.role,
        since: a.t,
        src: a.src,
        elapsed: Math.max(0, now - a.t),
        quiet: Math.max(0, now - (a.heard || a.t)),
        startless: Boolean(a.startless),
        // The agent named the time it would report by. Passing it is a fact it
        // supplied about itself, which is far stronger evidence of trouble
        // than elapsed time a watcher picked a threshold for.
        overdue: Boolean(a.nextBy && now > a.nextBy),
      });
      // A run still open is part of the sequence too. Leaving it out would
      // make the most recent, most relevant work the only work not shown.
      runs.push({
        role: a.role,
        src: a.src,
        start: a.t,
        end: null,
        open: true,
        startless: Boolean(a.startless),
        overdue: Boolean(a.nextBy && now > a.nextBy),
        note: a.note || '',
      });
    }
  }
  working.sort((a, b) => a.since - b.since);
  // Ordered by when each run began. A run with no start in view has no place
  // in that order, so it sorts by the only time it has and is marked.
  runs.sort((a, b) => (a.start ?? a.end) - (b.start ?? b.end));

  // Roles that appear in the declared tier and nowhere in the observed tier
  // WITHIN THE RETAINED HISTORY. That last qualifier is load-bearing: the two
  // logs rotate independently, so a role whose observed records have scrolled
  // away looks identical to one the host never emitted. The label says "no
  // observed record here" rather than "the host cannot see it", because only
  // the first is something this function actually knows.
  const unobserved = [...declaredOnly].filter((r) => !observedOnly.has(r)).sort();

  return {
    working,
    done: [...done.entries()].map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count || a.role.localeCompare(b.role)),
    ambiguous,
    invalid,
    unobserved,
    startless,
    runs,
    outOfOrder,
    mismatched,
    // History was cut, so an open start may have scrolled out of reach. The
    // view says so instead of reporting an empty fleet as if it were quiet.
    truncated: Boolean(opts.truncated),
    last,
    total: records.length,
  };
}

export function fmtDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return '--';
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ${String(sec % 60).padStart(2, '0')}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, '0')}m`;
}

// ---------------------------------------------------------------------------
// Rendering
//
// Plain ASCII on purpose. This runs in whatever terminal a supervisor already
// has open, including ones that render box-drawing and emoji badly, and a view
// that garbles itself is worse than no view.
// ---------------------------------------------------------------------------
const FACES = ['(o_o)', '(-_-)', '(o_o)', '(^_^)'];
const BUSY = ['.  ', '.. ', '...', ' ..'];

function faceFor(role, tick) {
  let h = 0;
  for (let i = 0; i < role.length; i++) h = (h * 31 + role.charCodeAt(i)) & 0xffff;
  return FACES[(tick + h) % FACES.length];
}

export function renderScene(state, { tick = 0, width = 72, stale = 900 } = {}) {
  const w = Math.max(40, Math.min(width, 100));
  const rule = '-'.repeat(w);
  const lines = [];

  lines.push(`kai fleet   ${state.working.length} working   ${state.done.reduce((n, d) => n + d.count, 0)} finished`);
  lines.push(rule);

  if (!state.working.length) {
    lines.push('');
    lines.push('   nobody is working right now.');
    lines.push('');
  } else {
    for (const a of state.working) {
      const face = faceFor(a.role, tick);
      const busy = BUSY[tick % BUSY.length];
      // A start with no stop is a fact about the log, not proof of life. When
      // the agent named its own reporting deadline, a missed deadline is said
      // plainly; otherwise all that can honestly be said is that it is quiet.
      // Each caveat has a short form, because dropping it on a narrow terminal
      // would silently upgrade a doubtful row into a confident one.
      let full = '';
      let compact = '';
      if (a.startless) { full = '  (start not in view)'; compact = '  !partial'; }
      else if (a.overdue) { full = '  (past its own check-in)'; compact = '  !late'; }
      else if (a.quiet > stale) { full = '  (silent a while)'; compact = '  !quiet'; }
      // Provenance is on every row. The two tiers mean different things -- one
      // is the host reporting what it ran, the other is an agent reporting
      // what it intends -- and a row that hides which one it is invites the
      // reader to trust a claim more than it deserves.
      const tier = a.src === 'declared' ? 'said' : 'seen';
      // The name column is sized from what is actually around it, not from a
      // constant that was correct for one earlier layout. Every other part of
      // the row has a known width, so the name gets the remainder -- and when
      // even a minimum name will not fit, the suffix contracts rather than the
      // row overflowing. A wrapped row destroys the alignment the view is for.
      const MIN_NAME = 8;
      const width = (suffix) => 2 + face.length + 2 + 2 + 4 + 2 + 8 + 1 + busy.length + suffix.length;
      // The caveat is never dropped, only shortened. A row that has lost its
      // doubt reads as a confident row, and the whole point of the mark is
      // that this one is not. The name gives up space instead.
      const suffix = width(full) + MIN_NAME > w ? compact : full;
      const room = Math.max(3, w - width(suffix));
      const name = a.role.length > room ? `${a.role.slice(0, room - 1)}~` : a.role;
      lines.push(`  ${face}  ${name.padEnd(room)}  ${tier}  ${fmtDuration(a.elapsed).padStart(8)} ${busy}${suffix}`);
    }
  }

  lines.push(rule);
  if (state.done.length) {
    const roster = state.done.map((d) => (d.count > 1 ? `${d.role} x${d.count}` : d.role)).join('   ');
    lines.push(`finished:  ${roster.length > w - 11 ? `${roster.slice(0, w - 14)}...` : roster}`);
  } else {
    lines.push('finished:  nothing yet');
  }
  if (state.ambiguous) {
    lines.push('note:      two subagents of one role overlapped; pairing is by order, not identity');
  }
  if (state.unobserved && state.unobserved.length) {
    // Deliberately not phrased as a fault, and deliberately not phrased as
    // certainty. The host emits no lifecycle events for plugin-provided
    // agents, so a kai persona reporting its own work and never appearing in
    // the observed tier is working exactly as designed -- but this function
    // only reads retained history, so "no observed record here" is the whole
    // of what it knows. Rendering either as "did not run" would be false.
    const lead = 'note:      self-reported; no observed record here: ';
    const roster = state.unobserved.join(', ');
    // A narrow terminal cannot hold the roster and the sentence. The count is
    // the part that must survive: it tells the reader something is being
    // withheld, which a truncated list of names does not.
    if (w < lead.length + 8) {
      lines.push(`note:      ${state.unobserved.length} role(s) self-reported, not observed`.slice(0, w));
    } else {
      const room = w - lead.length;
      lines.push(lead + (roster.length > room ? `${roster.slice(0, room - 3)}...` : roster));
    }
  }
  if (state.startless) {
    lines.push('note:      a run reported progress with no start in view; history may be cut');
  }
  if (state.truncated) {
    lines.push('note:      older history was not read; a run started long ago may be missing');
  }
  if (state.invalid) {
    lines.push(`note:      ${state.invalid} record(s) had a role this plugin never writes; shown as ${INVALID_ROLE}`);
  }
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// The sequence view
// ---------------------------------------------------------------------------
// The ambient scene answers "who is working right now". This answers the
// question the feature exists for: which roles took part, in what order.
//
// What it deliberately does NOT do is name the roles that *should* have taken
// part. That would need a plan, and kai has none -- inventing an expected
// roster and rendering the difference would produce exactly the display that
// looks authoritative and is not. Every line here is something a log recorded.
export function clockOf(t) {
  if (!Number.isFinite(t) || t <= 0) return '--:--:--';
  try {
    return new Date(t * 1000).toISOString().slice(11, 19);
  } catch { return '--:--:--'; }
}

export function renderSequence(state, { width = 72 } = {}) {
  const w = Math.max(40, Math.min(width, 100));
  const rule = '-'.repeat(w);
  const lines = [];
  // A malformed role must not take the view down; the other render paths
  // already normalise, and a crashed watcher tells the operator nothing.
  const runs = (state.runs || []).map((r) => ({
    ...r, role: typeof r.role === 'string' && r.role ? r.role : 'unknown',
  }));

  // Notes are prose, and prose that overflows wraps -- which destroys the
  // alignment of everything above it. It is wrapped here to a known width
  // instead of trusting the terminal to break it somewhere sensible.
  const label = 'note:      ';
  const note = (text) => {
    const room = Math.max(20, w - label.length);
    const out = [];
    let line = '';
    for (const word of text.split(/\s+/)) {
      if (!line) line = word;
      else if (line.length + 1 + word.length <= room) line += ` ${word}`;
      else { out.push(line); line = word; }
    }
    if (line) out.push(line);
    out.forEach((l, i) => lines.push((i === 0 ? label : ' '.repeat(label.length)) + l));
  };
  // Every caveat that applies to the run of the view, printed on every render
  // including the empty one. The empty view is the render most likely to be
  // read as "nothing ran", so it is the last place these may be omitted.
  const caveats = () => {
    note('a missing role means no record, not no work. The host observes no kai agent, and an agent can run without declaring. Check before reporting a gap.');
    note('this is the retained history only; older runs may have rotated out, and "run N" counts repeats in this view, not overall.');
    if (state.ambiguous) note('some observed runs were paired by order, not identity.');
    if (state.outOfOrder) note('a stop is timestamped before its own start; order and pairing around it are unreliable.');
    if (state.mismatched) note('a stop named a different role than the start it closed; the start is shown.');
    if (state.truncated) note('older history was not read; earlier runs may be missing.');
  };

  // A startless run contributes only its end: its other timestamp is the first
  // thing heard from it, not a start, so counting it would understate the span
  // while looking exact.
  const bounds = runs.flatMap((r) => (r.startless ? [r.end] : [r.start, r.end]))
    .filter((t) => Number.isFinite(t) && t > 0);
  const span = bounds.length ? Math.max(...bounds) - Math.min(...bounds) : 0;
  const roles = new Set(runs.map((r) => r.role));
  const head = `kai participation   ${roles.size} role(s)   ${runs.length} run(s)   ${fmtDuration(span)} span`;
  const shortHead = `kai participation   ${roles.size} role(s)   ${runs.length} run(s)`;
  lines.push(head.length <= w ? head : (shortHead.length <= w ? shortHead : `kai participation   ${runs.length} run(s)`));
  lines.push(rule);

  if (!runs.length) {
    lines.push('');
    lines.push('   no runs recorded.');
    lines.push('');
    lines.push(rule);
    note('nothing recorded is not the same as nothing happened.');
    caveats();
    return lines.join('\n');
  }

  // A narrow terminal loses the end clock before it loses the role name: the
  // duration already carries the span, so the second timestamp is the least
  // informative thing on the row.
  const wide = w >= 64;
  const whenW = wide ? 17 : 8;
  const idxW = String(runs.length).length;
  // One name column for the whole table, not one per row. Sizing it from each
  // row's own flags made the column jump around, which is precisely the
  // alignment a sequence view exists to provide.
  const base = 2 + idxW + 2 + 2 + 4 + 2 + whenW + 2 + 8;
  const longest = runs.reduce((m, r) => Math.max(m, r.role.length), 0);
  const nameW = Math.max(3, Math.min(longest, w - base - 2));
  // Repeated runs of one role are worth noticing -- often retrying rather than
  // escalating -- so the ordinal is shown rather than left for the reader to
  // count.
  const seenCount = new Map();
  runs.forEach((r, i) => {
    const n = (seenCount.get(r.role) || 0) + 1;
    seenCount.set(r.role, n);
    const flags = [];
    if (r.open) flags.push(r.overdue ? 'no stop recorded, past check-in' : 'no stop recorded');
    if (r.startless) flags.push('start not in view');
    if (n > 1) flags.push(`run ${n}`);
    const flag = flags.length ? `  ${flags.join('; ')}` : '';
    const tier = r.src === 'declared' ? 'said' : 'seen';
    // A startless run has no known beginning, so it prints neither a start
    // clock nor a span. The timestamp it carries is the first thing heard from
    // it, and showing that as a start would be a fabricated fact.
    const known = !r.startless && Number.isFinite(r.start) && Number.isFinite(r.end) && r.end >= r.start;
    const dur = known ? fmtDuration(r.end - r.start) : '--';
    const from = r.startless ? '--:--:--' : clockOf(r.start);
    const when = wide ? `${from} ${r.end ? clockOf(r.end) : '        '}` : from;
    const idx = String(i + 1).padStart(idxW);
    // Flags are never truncated; a row that lost its caveat reads as a clean
    // row. When they will not fit beside the name they move to their own line,
    // because the alternative is cutting the one part of the row that carries
    // doubt.
    const inline = base + nameW + flag.length <= w ? flag : '';
    const name = r.role.length > nameW ? `${r.role.slice(0, nameW - 1)}~` : r.role;
    lines.push(`  ${idx}  ${name.padEnd(nameW)}  ${tier}  ${when}  ${dur.padStart(8)}${inline}`);
    if (flag && !inline) {
      const indent = ' '.repeat(4 + idxW);
      let line = indent;
      for (const part of flags) {
        const piece = line.trim() ? `; ${part}` : part;
        if (line.length + piece.length > w) { lines.push(line); line = indent + part; }
        else line += piece;
      }
      if (line.trim()) lines.push(line);
    }
  });

  lines.push(rule);
  // The limit is printed with the data, not left in documentation someone may
  // not have read. A sequence invites the reader to notice who is missing, and
  // for kai's own agents that inference is guaranteed wrong.
  if (runs.some((r) => r.open)) {
    note('"no stop recorded" means the log has no stop. It is not evidence that a process is still alive.');
  }
  caveats();
  return lines.join('\n');
}

export function feedLine(rec) {
  const t = Number.isFinite(rec.t) && rec.t >= 0 && rec.t < 1e12 ? rec.t : 0;
  let when = '--:--:--';
  try {
    when = new Date(t * 1000).toISOString().slice(11, 19);
  } catch { /* a timestamp no calendar can represent is still not worth a crash */ }
  const mark = rec.event === 'start' ? '>>' : (rec.event === 'progress' ? '..' : '<<');
  const tier = rec.src === 'declared' ? '~' : ' ';
  const role = safeText(rec.role, 60) || INVALID_ROLE;
  const tldr = safeText(rec.tldr, 96);
  return `${when} ${tier}${mark} ${role}${tldr ? `  ${tldr}` : ''}`;
}

// ---------------------------------------------------------------------------
// The loop
// ---------------------------------------------------------------------------
// Reads the log as history rather than as a file. The writer rotates at the
// same bound, so a run that started before a rotation lives in the previous
// generation -- reading only the current file would quietly retire a worker
// that never stopped. When even that is not enough, the shortfall is reported
// instead of being rendered as an empty fleet.
function readHistory(root) {
  const chunks = [];
  let truncated = false;
  // Each file is read and parsed on its own so that its tier comes from the
  // path. Concatenating them first would mean trusting a `src` field that the
  // other writer could also set.
  const sources = [
    [ROTATED_REL, 'observed'],
    [OBSERVED_REL, 'observed'],
    [ACTIVITY_ROTATED_REL, 'declared'],
    [ACTIVITY_REL, 'declared'],
  ];
  for (const [rel, src] of sources) {
    const file = join(root, rel);
    try {
      if (!existsSync(file)) continue;
      let text;
      if (statSync(file).size > MAX_READ) {
        const buf = readFileSync(file);
        let slice = buf.subarray(buf.length - MAX_READ);
        // Start at the first newline: a byte offset lands mid-line, and
        // mid-line is also mid-character for anything outside ASCII.
        const nl = slice.indexOf(0x0a);
        slice = nl >= 0 ? slice.subarray(nl + 1) : slice;
        text = slice.toString('utf8');
        truncated = true;
      } else {
        text = readFileSync(file, 'utf8');
      }
      chunks.push({ text, src });
    } catch { /* unreadable right now; the next tick tries again */ }
  }
  return { chunks, truncated };
}

// Parses each file under its own tier, then orders the merged result by time.
// The two logs are written by unrelated processes, so file order says nothing
// across them.
export function readAndParse(chunks) {
  const out = [];
  for (const { text, src } of chunks) {
    const recs = parseRecords(text, src);
    // A record with no usable timestamp inherits the one before it, but only
    // from its OWN file: append order is evidence within a log and means
    // nothing between two logs written by unrelated processes.
    let carried = 0;
    for (const rec of recs) {
      if (rec.t > 0) carried = rec.t;
      else rec.t = carried;
    }
    out.push(...recs);
  }
  // Merged by time, stably. Without this the whole of one tier would print
  // after the whole of the other, which for a chronological feed is a lie
  // about the order things happened in.
  return out.map((rec, i) => ({ rec, i }))
    .sort((a, b) => a.rec.t - b.rec.t || a.i - b.i)
    .map(({ rec }) => rec);
}

// The feed prints each event once. Counting records cannot do that -- a
// rotation renumbers everything -- so emission is tracked by identity, with a
// per-batch occurrence index so two genuinely identical events both appear.
function fingerprint(rec, n) {
  return `${rec.t}|${rec.src}|${rec.event}|${rec.role}|${rec.session}|${rec.run}|${rec.tldr}#${n}`;
}

function runWatch(root, { feed, once, sequence }) {
  const dir = join(root, dirname(OBSERVED_REL));
  let tick = 0;
  let emitted = new Set();
  let primed = false;

  const draw = () => {
    const { chunks, truncated } = readHistory(root);
    const records = dedupe(readAndParse(chunks));
    if (feed) {
      const counts = new Map();
      const fps = records.map((rec) => {
        const base = `${rec.t}|${rec.src}|${rec.event}|${rec.role}|${rec.session}|${rec.run}|${rec.tldr}`;
        const n = (counts.get(base) || 0) + 1;
        counts.set(base, n);
        return fingerprint(rec, n);
      });
      records.forEach((rec, i) => {
        // The first pass prints the history that is already there; every pass
        // after it prints only what it has not printed before.
        if (primed && emitted.has(fps[i])) return;
        process.stdout.write(`${feedLine(rec)}\n`);
      });
      primed = true;
      // Rebuilt from what the file still holds, so it cannot grow unbounded.
      emitted = new Set(fps);
      return;
    }
    const state = reduceState(records, undefined, { truncated });
    const width = process.stdout.columns || 72;
    if (sequence) {
      // No animation and no screen clear: the sequence is a report, and a
      // reader wants to scroll back through it rather than watch it blink.
      process.stdout.write(`${renderSequence(state, { width })}\n`);
      return;
    }
    process.stdout.write(`\x1b[2J\x1b[H${renderScene(state, { tick, width })}\n\n  watching ${OBSERVED_REL} + ${ACTIVITY_REL} -- ctrl-c to stop\n`);
  };

  draw();
  if (once || sequence) return;

  // Rendering is driven by a timer, not by the watcher: fs.watch coalesces and
  // can miss on some filesystems, and the animation needs a heartbeat anyway.
  // The watch is an optimisation for latency, not the source of truth.
  const timer = setInterval(() => { tick++; draw(); }, feed ? 1000 : 700);
  let watcher = null;
  try {
    // Watch the directory, not the file: rotation replaces the inode.
    watcher = watch(dir, { persistent: true }, () => draw());
    // A watcher can fail long after it was created -- the directory is deleted,
    // or the handle limit is reached. Losing the latency optimisation is not a
    // reason to lose the view, so it falls back to the timer alone.
    watcher.on('error', () => { try { watcher.close(); } catch { /* already gone */ } watcher = null; });
  } catch { /* no .kai yet; the timer picks it up when it appears */ }
  process.on('SIGINT', () => {
    if (watcher) { try { watcher.close(); } catch { /* already gone */ } }
    clearInterval(timer);
    process.stdout.write('\n');
    process.exit(0);
  });
}

// ---------------------------------------------------------------------------
// Entry
// ---------------------------------------------------------------------------
const isEntry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => {
    if (!cond) failed++;
    console.log(`${cond ? '\u2713' : '\u2717'} watch self-test: ${msg}`);
  };
  const rec = (o) => JSON.stringify({ t: 1000, src: 'observed', session: 's1', ...o });

  // --- parsing tolerates the writer ---------------------------------------
  ok(parseRecords(`${rec({ event: 'start', role: 'a' })}\n{"partial`).length === 1,
    'a torn final line is skipped, not fatal -- the writer appends concurrently');
  ok(parseRecords('').length === 0, 'an empty log parses to nothing rather than throwing');
  ok(parseRecords(null).length === 0, 'a non-string input is refused without throwing');
  ok(parseRecords('{"t":1,"src":"observed"}\n').length === 0,
    'a record with no role or event is not counted as an agent');

  // --- pairing -------------------------------------------------------------
  const open = reduceState(parseRecords([rec({ event: 'start', role: 'explore' })].join('\n')), 1060);
  ok(open.working.length === 1 && open.working[0].role === 'explore', 'a start with no stop shows as working');
  ok(open.working[0].elapsed === 60, 'elapsed is computed in seconds, matching the writer');

  const closed = reduceState(parseRecords([
    rec({ event: 'start', role: 'explore' }),
    rec({ event: 'stop', role: 'explore' }),
  ].join('\n')));
  ok(closed.working.length === 0, 'a matched stop clears the working row');
  ok(closed.done.length === 1 && closed.done[0].count === 1, 'a completed run is counted in the roster');

  // A stop for a role that never started must not create a negative or ghost
  // row -- the log can begin mid-session.
  const orphan = reduceState(parseRecords(rec({ event: 'stop', role: 'ghost' })));
  ok(orphan.working.length === 0, 'a stop with no start does not produce a ghost worker');
  ok(orphan.done[0].count === 1, 'a stop with no start still counts as finished work');

  // Different sessions must not close each other's runs.
  const twoSessions = reduceState(parseRecords([
    JSON.stringify({ t: 1, event: 'start', role: 'explore', session: 'A' }),
    JSON.stringify({ t: 2, event: 'stop', role: 'explore', session: 'B' }),
  ].join('\n')));
  ok(twoSessions.working.length === 1, 'a stop in one session cannot close a start in another');

  // --- the declared tier ---------------------------------------------------
  const decl = (o) => JSON.stringify({ t: 1000, src: 'declared', ...o });

  ok(parseRecords(decl({ e: 'start', role: 'principal-swe-backend', run: 'r1' }))[0].src === 'declared',
    'a declared record keeps its provenance instead of being flattened into the observed tier');
  ok(parseRecords(rec({ event: 'start', role: 'a' }))[0].src === 'observed',
    'a record that names no tier is treated as observed, the weaker claim');
  ok(parseRecords(decl({ e: 'start', role: 'a', run: 'r1' }))[0].event === 'start',
    'the declared tier writes `e` where the observer writes `event`; both parse');

  // A run id pairs by identity, so two runs of one role at the same time are
  // not a guess -- which is the whole reason the declared tier is worth having.
  const twoRuns = reduceState(parseRecords([
    decl({ t: 10, e: 'start', role: 'principal-swe-backend', run: 'r1' }),
    decl({ t: 11, e: 'start', role: 'principal-swe-backend', run: 'r2' }),
    decl({ t: 12, e: 'stop', role: 'principal-swe-backend', run: 'r1' }),
  ].join('\n')), 20);
  ok(twoRuns.working.length === 1, 'a run id closes exactly the run it names, not the oldest of that role');
  ok(twoRuns.ambiguous === false,
    'overlapping declared runs are not ambiguous: they carry ids, so nothing was guessed');

  // The central claim of the merged view: absence from the observed tier is
  // NOT absence of work. The host emits no events at all for plugin agents.
  const merged = reduceState(parseRecords([
    decl({ t: 10, e: 'start', role: 'principal-swe-backend', run: 'r1' }),
    JSON.stringify({ t: 11, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
  ].join('\n')), 20);
  ok(merged.working.length === 2, 'both tiers appear in one view rather than one hiding the other');
  ok(merged.unobserved.join() === 'principal-swe-backend',
    'a role only ever self-reported is named as such, never rendered as not having run');
  ok(!renderScene(merged, { width: 100 }).includes('did not run'),
    'the view never claims an unobserved agent did not run');

  // A deadline the agent set for itself beats a threshold the watcher invented.
  const late = reduceState(parseRecords(
    decl({ t: 10, e: 'start', role: 'a', run: 'r1', next_report_by: 50 }),
  ), 100);
  ok(late.working[0].overdue === true, 'a run past the check-in time it promised is marked overdue');
  const onTime = reduceState(parseRecords(
    decl({ t: 10, e: 'start', role: 'a', run: 'r1', next_report_by: 500 }),
  ), 100);
  ok(onTime.working[0].overdue === false, 'a run inside its own deadline is not flagged, however long it has run');

  // `progress` renews liveness without opening or closing anything.
  const prog = reduceState(parseRecords([
    decl({ t: 10, e: 'start', role: 'a', run: 'r1', next_report_by: 50 }),
    decl({ t: 40, e: 'progress', role: 'a', run: 'r1', next_report_by: 500 }),
  ].join('\n')), 100);
  ok(prog.working.length === 1, 'progress neither starts a second run nor closes the first');
  ok(prog.working[0].overdue === false, 'progress renews the deadline, clearing an overdue mark');
  ok(prog.working[0].quiet === 60, 'quiet time is measured from the last word, not from the start');

  // --- duplicate delivery --------------------------------------------------
  const dupPair = parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'explore', session: 's1', agent: 'a1' }),
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'explore', session: 's1', agent: 'a1' }),
  ].join('\n'));
  ok(dedupe(dupPair).length === 1, 'one event delivered twice in the same second is counted once');

  // The corpus contains an agentId reused by two real runs 90,244s apart, so
  // collapsing on identity alone would delete a run that genuinely happened.
  // This is the failing case for the fix originally proposed for that bug.
  const reused = parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'explore', session: 's1', agent: 'a1' }),
    JSON.stringify({ t: 90344, src: 'observed', event: 'stop', role: 'explore', session: 's1', agent: 'a1' }),
  ].join('\n'));
  ok(dedupe(reused).length === 2,
    'an agent id reused a day later is two runs, not a duplicate -- identity alone must not collapse them');
  ok(dedupe(parseRecords([
    decl({ t: 100, e: 'stop', role: 'a', run: 'r1' }),
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'a', session: 's1' }),
  ].join('\n'))).length === 2,
    'the same moment reported by both tiers is two records; they are merged for display, not reconciled');

  // --- roles the host qualifies -------------------------------------------
  ok(parseRecords(rec({ event: 'start', role: 'kai:principal-swe-architect' }))[0].invalid === false,
    'a namespaced role from the host is a valid role, not a quarantined one');
  ok(parseRecords(rec({ event: 'start', role: 'a:b:c' }))[0].invalid === true,
    'only one namespace segment is allowed; anything else is still quarantined');

  // --- provenance comes from the file, not the record ----------------------
  // Both logs are local files. If a record could name its own tier, anything
  // able to append to the observed log could present itself as an agent's own
  // account, and the `said`/`seen` distinction would be worthless.
  ok(parseRecords(JSON.stringify({ t: 1, src: 'declared', event: 'start', role: 'a' }), 'observed')[0].src === 'observed',
    'a record claiming to be declared, found in the observed log, is observed');
  ok(parseRecords(decl({ e: 'start', role: 'a', run: 'r1' }), 'declared')[0].run === 'r1',
    'a run id is read from the tier that issues them');
  ok(parseRecords(JSON.stringify({ t: 1, event: 'stop', role: 'a', run: 'r1' }), 'observed')[0].run === '',
    'a run id in the observed log is discarded: it could otherwise close a declared run');

  // The same key in two tiers must not collide, or either log could close the
  // other's runs.
  const crossTier = reduceState(readAndParse([
    { src: 'declared', text: decl({ t: 10, e: 'start', role: 'a', run: 'r1' }) },
    { src: 'observed', text: JSON.stringify({ t: 11, event: 'stop', role: 'a', run: 'r1', session: 's1' }) },
  ]), 20);
  ok(crossTier.working.length === 1, 'an observed stop cannot close a declared run, even naming its id');

  // --- rotation ------------------------------------------------------------
  // The declared writer rotates exactly like the observer. Reading only the
  // current generation retires an agent that is still running.
  ok(ACTIVITY_ROTATED_REL === '.kai/activity.jsonl.1',
    'the rotated declared log is read, matching what the activity writer renames to');
  const acrossRotation = reduceState(readAndParse([
    { src: 'declared', text: decl({ t: 10, e: 'start', role: 'a', run: 'r1', next_report_by: 900 }) },
    { src: 'declared', text: decl({ t: 40, e: 'progress', role: 'a', run: 'r1', next_report_by: 900 }) },
  ]), 100);
  ok(acrossRotation.working.length === 1, 'a start in the rotated generation still pairs with progress in the current one');

  // A run that reports progress with no start in view is running, not absent.
  const orphanProgress = reduceState(parseRecords(
    decl({ t: 40, e: 'progress', role: 'a', run: 'r1', next_report_by: 900 }), 'declared',
  ), 100);
  ok(orphanProgress.working.length === 1, 'progress with no start shows a worker rather than an empty fleet');
  ok(orphanProgress.startless === true, 'and the missing start is disclosed rather than papered over');

  // --- a repeated start for one run is not a second agent ------------------
  const retried = reduceState(parseRecords([
    decl({ t: 10, e: 'start', role: 'a', run: 'r1' }),
    decl({ t: 12, e: 'start', role: 'a', run: 'r1' }),
    decl({ t: 20, e: 'stop', role: 'a', run: 'r1' }),
  ].join('\n'), 'declared'), 30);
  ok(retried.working.length === 0,
    'a replayed start for one run id does not leave a worker no stop can ever clear');

  // --- timestamps and dedupe ordering --------------------------------------
  // dedupe runs before reduceState reconciles times, so a record with no
  // usable timestamp has nothing to compare and must pass through untouched
  // rather than collapsing against, or overwriting, a known time.
  const noTime = dedupe(parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'a', session: 's1', agent: 'x' }),
    JSON.stringify({ src: 'observed', event: 'stop', role: 'a', session: 's1', agent: 'x' }),
    JSON.stringify({ t: 100, src: 'observed', event: 'stop', role: 'a', session: 's1', agent: 'x' }),
  ].join('\n'), 'observed'));
  ok(noTime.length === 2,
    'a timestamp-less record neither collapses nor resets dedupe state for the records around it');

  // Without an identity, one second is not evidence of duplication: a start
  // carries no id, so two real agents a second apart look exactly like one
  // event delivered twice. Deleting a real agent is the worse error.
  const twoFastStarts = dedupe(parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
    JSON.stringify({ t: 101, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
  ].join('\n'), 'observed'));
  ok(twoFastStarts.length === 2,
    'two identity-less starts a second apart are both kept: a double-count is visible, a deleted agent is not');
  const sameInstant = dedupe(parseRecords([
    JSON.stringify({ t: 100, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
    JSON.stringify({ t: 100, src: 'observed', event: 'start', role: 'explore', session: 's1' }),
  ].join('\n'), 'observed'));
  ok(sameInstant.length === 1, 'an identical timestamp with no identity is still collapsed');

  // --- the view fits the terminal it was given -----------------------------
  const fitState = reduceState(readAndParse([
    { src: 'declared', text: [
      decl({ t: 10, e: 'start', role: 'principal-swe-architect', run: 'r1', next_report_by: 20 }),
      decl({ t: 10, e: 'start', role: 'creative-video-director', run: 'r2', next_report_by: 20 }),
    ].join('\n') },
    { src: 'observed', text: JSON.stringify({ t: 12, event: 'start', role: 'explore', session: 's1' }) },
  ]), 100);
  for (const width of [40, 56, 72, 100]) {
    const over = renderScene(fitState, { width }).split('\n').filter((l) => l.length > Math.max(40, Math.min(width, 100)));
    ok(over.length === 0, `every rendered line fits within ${width} columns`);
    // Narrowing may shorten a caveat but must never remove it: a row that has
    // quietly lost its doubt reads as a confident row.
    const marked = renderScene(fitState, { width }).split('\n')
      .filter((l) => l.includes('said')).every((l) => /check-in|!late/.test(l));
    ok(marked, `an overdue run is still marked as overdue at ${width} columns`);
  }

  const overlap = reduceState(parseRecords([
    rec({ event: 'start', role: 'explore' }),
    rec({ event: 'start', role: 'explore' }),
    rec({ event: 'stop', role: 'explore' }),
  ].join('\n')), 1000);
  ok(overlap.working.length === 1, 'two overlapping runs of one role leave one open after a single stop');
  ok(overlap.ambiguous === true, 'overlapping same-role runs are flagged as ambiguous, not silently guessed');
  ok(closed.ambiguous === false, 'a clean sequence is not flagged ambiguous');

  // --- rendering -----------------------------------------------------------
  const scene = renderScene(open, { tick: 0 });
  ok(scene.includes('explore'), 'the scene names the working role');
  ok(scene.includes('1 working'), 'the scene counts the working agents');
  ok(!/[A-Za-z]:\\|\/home\/|\/Users\//.test(scene), 'the scene never renders an absolute path');  ok(renderScene(reduceState([]), { tick: 0 }).includes('nobody is working'),
    'an empty log renders an honest empty state rather than a blank screen');
  ok(renderScene(overlap, { tick: 0 }).includes('pairing is by order'),
    'the ambiguity is surfaced to the reader, not hidden in the data');

  const longRole = reduceState(parseRecords(rec({ event: 'start', role: 'principal-a-very-long-role-name-that-overflows-the-column' })), 1000);
  const wide = renderScene(longRole, { tick: 0, width: 72 });
  ok(wide.split('\n').every((l) => l.length <= 100), 'a long role name cannot break the layout');

  const stale = reduceState(parseRecords(rec({ event: 'start', role: 'explore' })), 1000 + 5000);
  ok(renderScene(stale, { tick: 0 }).includes('silent a while'),
    'a long-open start is aged rather than presented as certain liveness');

  // Animation must actually change, or it is a static picture claiming to live.
  const frames = new Set([0, 1, 2, 3].map((t) => renderScene(open, { tick: t })));
  ok(frames.size > 1, 'the view animates across ticks');

  // --- hostile input -------------------------------------------------------
  // The watcher reads a plain file that any process on the machine can append
  // to. Everything below is what a hand-edited line can carry, and none of it
  // may reach the terminal as written.
  const hostileRole = parseRecords(JSON.stringify({ t: 1, event: 'start', role: 'C:\\Users\\alice\\secret', session: 's1' }));
  ok(hostileRole.length === 1 && hostileRole[0].role === INVALID_ROLE,
    'a role this plugin never writes is quarantined, not rendered as a label');
  ok(!renderScene(reduceState(hostileRole, 2), { tick: 0 }).includes('alice'),
    'a path smuggled in as a role never reaches the screen');
  ok(renderScene(reduceState(hostileRole, 2), { tick: 0 }).includes('never writes'),
    'the quarantine is reported rather than silently swallowing the record');

  const esc = parseRecords(JSON.stringify({ t: 1, event: 'stop', role: 'explore', session: 's1', tldr: 'a\u001b[2Jb\u0007c' }));
  ok(!feedLine(esc[0]).includes('\u001b') && !feedLine(esc[0]).includes('\u0007'),
    'terminal control sequences in a summary are stripped before printing');
  ok(feedLine(esc[0]).includes('a[2Jbc'),
    'stripping the escape byte leaves its payload as plain text, which is harmless');

  ok(feedLine({ t: 1e100, event: 'start', role: 'explore' }).includes('>>'),
    'an impossible timestamp is formatted, not thrown');
  ok(parseRecords(JSON.stringify({ t: 1e100, event: 'start', role: 'explore' }))[0].t === 0,
    'a timestamp outside any real clock is refused rather than trusted');

  // Out-of-order arrival: a stop written before its own start must not leave
  // the run counted as both finished and still working.
  const reordered = reduceState(parseRecords([
    JSON.stringify({ t: 20, event: 'stop', role: 'explore', session: 's1' }),
    JSON.stringify({ t: 10, event: 'start', role: 'explore', session: 's1' }),
  ].join('\n')), 30);
  ok(reordered.working.length === 0, 'a stop recorded before its start does not leave a ghost worker');

  // Two sessionless records may not close each other's runs without saying so.
  const sessionless = reduceState(parseRecords([
    JSON.stringify({ t: 1, event: 'start', role: 'explore' }),
    JSON.stringify({ t: 2, event: 'stop', role: 'explore' }),
  ].join('\n')), 3);
  ok(sessionless.ambiguous === true, 'pairing records with no session is declared as a guess');

  // --- honesty about missing history ---------------------------------------
  ok(renderScene(reduceState([], 1, { truncated: true }), { tick: 0 }).includes('older history'),
    'a truncated read is reported rather than shown as a quiet fleet');

  // --- feed ---------------------------------------------------------------
  const line = feedLine({ t: 1786488059, event: 'stop', role: 'explore', tldr: 'Did the thing.' });
  ok(line.includes('explore') && line.includes('Did the thing.'), 'a feed line carries the role and any summary');
  ok(feedLine({ t: 0, event: 'start', role: 'explore' }).includes('>>'), 'a start is marked distinctly from a stop');

  // --- the sequence view ---------------------------------------------------
  const seqRecs = parseRecords([
    JSON.stringify({ t: 100, event: 'start', role: 'workflow-issue-analysis', session: 's' }),
    JSON.stringify({ t: 160, event: 'stop', role: 'workflow-issue-analysis', session: 's' }),
    JSON.stringify({ t: 200, event: 'start', role: 'principal-swe-backend', session: 's' }),
    JSON.stringify({ t: 500, event: 'stop', role: 'principal-swe-backend', session: 's' }),
    JSON.stringify({ t: 600, event: 'start', role: 'principal-swe-backend', session: 's' }),
  ].join('\n'), 'observed');
  const seqState = reduceState(seqRecs, 700);
  ok(seqState.runs.length === 3, 'every run reaches the sequence, closed and open alike');
  ok(seqState.runs[0].role === 'workflow-issue-analysis' && seqState.runs[2].open === true,
    'runs are ordered by when they began, and the open one is last');
  const seq = renderSequence(seqState, { width: 100 });
  ok(seq.includes('workflow-issue-analysis') && seq.includes('principal-swe-backend'),
    'the sequence names each role that took part');
  // Assertions are made against whitespace-normalised text: these notes wrap to
  // the terminal, so a literal substring would be testing the line breaks
  // rather than the words.
  const flat = (s) => s.replace(/\s+/g, ' ');
  ok(seq.includes('run 2'), 'a repeated role is marked rather than left for the reader to count');
  ok(seq.includes('no stop recorded'), 'a run with no stop is shown as such, not as finished');
  ok(flat(seq).includes('not evidence that a process is still alive'),
    'an open run carries the liveness caveat in the report itself');
  ok(!/\bopen\b/.test(seq.split('note:')[0]), 'no row claims a run is "open", which reads as alive');
  ok(/1m 0/.test(seq), 'a closed run reports the span between its own start and stop');
  // The one inference this view must never invite.
  ok(!/did not run|idle|never ran|absent|skipped/i.test(seq),
    'the sequence never reports a role as not having run');
  ok(flat(seq).includes('no record, not no work') && flat(seq).includes('host observes no kai agent'),
    'the measured host limitation travels with the data, not documentation nobody read');
  ok(flat(seq).includes('retained history'),
    'the view says it shows retained history rather than implying it is complete');
  ok(flat(seq).includes('counts repeats in this view'),
    'the repeat ordinal is scoped to the view rather than read as a global count');

  // The empty render is the one most likely to be read as "nothing ran", so it
  // is the last place a caveat may be dropped.
  const emptySeq = flat(renderSequence(reduceState([], 1, { truncated: true }), { width: 72 }));
  ok(emptySeq.includes('nothing recorded is not the same'),
    'an empty sequence still refuses to read as an empty fleet');
  ok(emptySeq.includes('host observes no kai agent'),
    'the empty sequence keeps the measured host limitation');
  ok(emptySeq.includes('older history was not read'),
    'the empty sequence still reports that history was truncated');

  // A stop whose start fell outside the read window is a real run with an
  // unknown span; showing it as instant would be a fabricated duration.
  const orphanStop = reduceState(parseRecords(
    JSON.stringify({ t: 900, event: 'stop', role: 'explore', session: 's' }), 'observed'), 950);
  ok(orphanStop.runs.length === 1 && orphanStop.runs[0].start === null,
    'a stop with no start in view keeps an unknown span rather than inventing one');
  ok(renderSequence(orphanStop, { width: 72 }).includes('start not in view'),
    'an unknown span is labelled, not silently rendered as a duration');

  // A run first heard from at `progress` has a timestamp, but that timestamp is
  // not its start -- so it has no span, and printing one would be fabrication.
  const progressOnly = reduceState(parseRecords([
    JSON.stringify({ t: 100, e: 'progress', role: 'principal-swe-backend', run: 'r9' }),
    JSON.stringify({ t: 160, e: 'stop', role: 'principal-swe-backend', run: 'r9' }),
  ].join('\n'), 'declared'), 200);
  const progressSeq = renderSequence(progressOnly, { width: 100 });
  ok(progressOnly.runs.length === 1 && progressOnly.runs[0].startless === true,
    'a run first heard at progress is marked as having no start in view');
  ok(flat(progressSeq).includes('--:--:-- 00:02:40 -- start not in view'),
    'a run with no known start prints neither a start clock nor a span, because its first record is not its start');

  // A stop timestamped before its own start sorts ahead of it and looks like
  // two half-runs. That is reported, never quietly repaired.
  const skew = reduceState(parseRecords([
    JSON.stringify({ t: 100, event: 'start', role: 'explore', session: 's' }),
    JSON.stringify({ t: 50, event: 'stop', role: 'explore', session: 's' }),
  ].join('\n'), 'observed'), 200);
  ok(skew.outOfOrder === true, 'a stop preceding its own start is detected rather than shown as two runs');
  ok(renderSequence(skew, { width: 100 }).includes('order and pairing around it are unreliable'),
    'out-of-order records are disclosed in the render');

  // A stop naming a different role must not rewrite which role took part.
  const swapped = reduceState(parseRecords([
    JSON.stringify({ t: 10, e: 'start', role: 'principal-swe-backend', run: 'r7' }),
    JSON.stringify({ t: 70, e: 'stop', role: 'principal-security', run: 'r7' }),
  ].join('\n'), 'declared'), 100);
  ok(swapped.runs[0].role === 'principal-swe-backend',
    'a run is described by the start it closes, so a stop cannot rewrite the role');
  ok(swapped.mismatched === true && renderSequence(swapped, { width: 100 }).includes('named a different role'),
    'a role disagreement between start and stop is disclosed, not silently resolved');

  const declaredSeq = reduceState(parseRecords([
    JSON.stringify({ t: 10, e: 'start', role: 'principal-swe-backend', run: 'r1' }),
    JSON.stringify({ t: 70, e: 'stop', role: 'principal-swe-backend', run: 'r1' }),
  ].join('\n'), 'declared'), 100);
  ok(renderSequence(declaredSeq, { width: 72 }).includes('said'),
    'a self-declared run is labelled as said, never as observed');

  // A malformed record must not take the whole view down.
  ok(renderSequence({ runs: [{ role: null, src: 'observed', start: 1, end: 2 }] }, { width: 72 }).includes('unknown'),
    'a run with no usable role renders as unknown rather than crashing');

  const crowded = reduceState(parseRecords([
    JSON.stringify({ t: 10, event: 'stop', role: 'creative-video-director', session: 's' }),
    JSON.stringify({ t: 20, event: 'stop', role: 'creative-video-director', session: 's' }),
    JSON.stringify({ t: 30, event: 'start', role: 'principal-swe-architect', session: 's' }),
  ].join('\n'), 'observed'), 40);
  // Three-digit run counts must not push the index column into the name.
  const many = { runs: Array.from({ length: 120 }, (_, i) => ({
    role: 'principal-swe-architect', src: 'observed', start: i * 10, end: i * 10 + 5,
  })) };
  for (const width of [40, 56, 72, 100]) {
    for (const st of [seqState, crowded, orphanStop, skew, many, reduceState([], 1, { truncated: true })]) {
      const over = renderSequence(st, { width }).split('\n')
        .filter((l) => l.length > Math.max(40, Math.min(width, 100)));
      ok(over.length === 0, `the sequence fits ${width} columns without wrapping`);
    }
    // Every flag survives the narrowest layout, on its own line if it must.
    const out = renderSequence(crowded, { width });
    ok(out.includes('start not in view') && out.includes('run 2'),
      `no caveat is dropped at ${width} columns`);
  }

  console.log(failed === 0 ? '\u2713 observe-watch self-test: all checks passed' : `\u2717 observe-watch self-test: ${failed} failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
}

if (isEntry) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) {
    selfTest();
  } else {
    const rootFlag = argv.indexOf('--root');
    const root = findWorkspace(rootFlag !== -1 ? argv[rootFlag + 1] : process.cwd());
    if (!root) {
      console.error('observe-watch: no workspace found (looked for a .kai or .git directory)');
      process.exit(2);
    }
    if (!existsSync(join(root, OBSERVED_REL)) && !existsSync(join(root, ACTIVITY_REL))) {
      // Only when *neither* log exists. The declared tier stands on its own --
      // it is the only tier that records kai's own agents -- so telling an
      // operator with a full activity log that there is "no observation log
      // yet" sends them to configure a hook they do not need.
      console.log('No observation log yet.\n');
      console.log('  1. enable:  node scripts/observe-subagent.mjs --enable');
      console.log('  2. restart your session (hook config is read at session start)');
      console.log('  3. run any subagent\n');
      console.log('Waiting for the first record...\n');
    }
    const sequence = argv.includes('--sequence');
    runWatch(root, {
      // A pipe gets the feed, because ANSI screen-clearing into a file or a
      // pager produces garbage. `--scene` forces the ambient view anyway, which
      // is what makes it previewable and testable.
      feed: !sequence && (argv.includes('--feed') || (!process.stdout.isTTY && !argv.includes('--scene'))),
      once: argv.includes('--once'),
      sequence,
    });
  }
}
