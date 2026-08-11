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

// Kept in step with the writer. A viewer that read more than the writer can
// produce would be reading something else.
const MAX_READ = 512 * 1024;

// The role vocabulary the writer enforces. Anything else reached the file by
// hand, so it is quarantined rather than rendered: a role is a screen label,
// and a label is the one place a hand-edited path or escape sequence would be
// printed verbatim.
const ROLE_RE = /^[a-z0-9-]{1,60}$/;
const EVENTS = new Set(['start', 'stop']);
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
export function parseRecords(text) {
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
    if (typeof rec.event !== 'string' || !EVENTS.has(rec.event)) continue;
    if (typeof rec.role !== 'string' || !rec.role) continue;
    const valid = ROLE_RE.test(rec.role);
    const ts = Number(rec.t);
    out.push({
      event: rec.event,
      role: valid ? rec.role : INVALID_ROLE,
      // A missing session is not the same session as another missing session,
      // so it never becomes a shared pairing key -- see reduceState.
      session: typeof rec.session === 'string' && rec.session ? safeText(rec.session, 40) : '',
      t: Number.isFinite(ts) && ts >= 0 && ts < 1e12 ? Math.floor(ts) : 0,
      tldr: safeText(rec.tldr, 96),
      invalid: !valid,
    });
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
    // A record with no session cannot be told apart from any other, so it is
    // paired by role alone and the guess is declared rather than hidden.
    const key = rec.session ? `${rec.session}::${rec.role}` : `::${rec.role}`;
    if (rec.t > last) last = rec.t;
    if (rec.event === 'start') {
      const arr = active.get(key) || [];
      arr.push({ role: rec.role, t: rec.t || now });
      if (arr.length > 1) ambiguous = true;
      active.set(key, arr);
    } else if (rec.event === 'stop') {
      const arr = active.get(key);
      if (arr && arr.length) {
        if (arr.length > 1 || !rec.session) ambiguous = true;
        arr.shift(); // oldest start closes first
        if (!arr.length) active.delete(key);
      }
      done.set(rec.role, (done.get(rec.role) || 0) + 1);
    }
  }

  const working = [];
  for (const arr of active.values()) {
    for (const a of arr) working.push({ role: a.role, since: a.t, elapsed: Math.max(0, now - a.t) });
  }
  working.sort((a, b) => a.since - b.since);

  return {
    working,
    done: [...done.entries()].map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count || a.role.localeCompare(b.role)),
    ambiguous,
    invalid,
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
      // A start with no stop is a fact about the log, not proof of life.
      const aged = a.elapsed > stale ? '  (silent a while)' : '';
      const name = a.role.length > 34 ? `${a.role.slice(0, 33)}~` : a.role;
      lines.push(`  ${face}  ${name.padEnd(34)} ${fmtDuration(a.elapsed).padStart(8)} ${busy}${aged}`);
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
  if (state.truncated) {
    lines.push('note:      older history was not read; a run started long ago may be missing');
  }
  if (state.invalid) {
    lines.push(`note:      ${state.invalid} record(s) had a role this plugin never writes; shown as ${INVALID_ROLE}`);
  }
  return lines.join('\n');
}

export function feedLine(rec) {
  const t = Number.isFinite(rec.t) && rec.t >= 0 && rec.t < 1e12 ? rec.t : 0;
  let when = '--:--:--';
  try {
    when = new Date(t * 1000).toISOString().slice(11, 19);
  } catch { /* a timestamp no calendar can represent is still not worth a crash */ }
  const mark = rec.event === 'start' ? '>>' : '<<';
  const role = safeText(rec.role, 60) || INVALID_ROLE;
  const tldr = safeText(rec.tldr, 96);
  return `${when} ${mark} ${role}${tldr ? `  ${tldr}` : ''}`;
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
  let text = '';
  let truncated = false;
  for (const rel of [ROTATED_REL, OBSERVED_REL]) {
    const file = join(root, rel);
    try {
      if (!existsSync(file)) continue;
      if (statSync(file).size > MAX_READ) {
        const buf = readFileSync(file);
        let slice = buf.subarray(buf.length - MAX_READ);
        // Start at the first newline: a byte offset lands mid-line, and
        // mid-line is also mid-character for anything outside ASCII.
        const nl = slice.indexOf(0x0a);
        slice = nl >= 0 ? slice.subarray(nl + 1) : slice;
        text += `${slice.toString('utf8')}\n`;
        truncated = true;
      } else {
        text += `${readFileSync(file, 'utf8')}\n`;
      }
    } catch { /* unreadable right now; the next tick tries again */ }
  }
  return { text, truncated };
}

// The feed prints each event once. Counting records cannot do that -- a
// rotation renumbers everything -- so emission is tracked by identity, with a
// per-batch occurrence index so two genuinely identical events both appear.
function fingerprint(rec, n) {
  return `${rec.t}|${rec.event}|${rec.role}|${rec.session}|${rec.tldr}#${n}`;
}

function runWatch(root, { feed, once }) {
  const dir = join(root, dirname(OBSERVED_REL));
  let tick = 0;
  let emitted = new Set();
  let primed = false;

  const draw = () => {
    const { text, truncated } = readHistory(root);
    const records = parseRecords(text);
    if (feed) {
      const counts = new Map();
      const fps = records.map((rec) => {
        const base = `${rec.t}|${rec.event}|${rec.role}|${rec.session}|${rec.tldr}`;
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
    process.stdout.write(`\x1b[2J\x1b[H${renderScene(state, { tick, width })}\n\n  watching ${OBSERVED_REL} -- ctrl-c to stop\n`);
  };

  draw();
  if (once) return;

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
    if (!existsSync(join(root, OBSERVED_REL))) {
      console.log('No observation log yet.\n');
      console.log('  1. enable:  node scripts/observe-subagent.mjs --enable');
      console.log('  2. restart your session (hook config is read at session start)');
      console.log('  3. run any subagent\n');
      console.log('Waiting for the first record...\n');
    }
    runWatch(root, {
      // A pipe gets the feed, because ANSI screen-clearing into a file or a
      // pager produces garbage. `--scene` forces the ambient view anyway, which
      // is what makes it previewable and testable.
      feed: argv.includes('--feed') || (!process.stdout.isTTY && !argv.includes('--scene')),
      once: argv.includes('--once'),
    });
  }
}
