// The observed half of fleet visibility.
//
// `work-activity` (#96) is DECLARED: an agent chooses to report. That is enough
// to build a participation timeline, and not enough to trust one -- when the
// question is "why did no designer ever appear on this feature", a missing role
// means either "not consulted" or "consulted and forgot to log", and those two
// demand opposite responses. This file removes that ambiguity by recording what
// the host itself observed, which an agent cannot forget to emit.
//
// Deliberately narrow. It subscribes to subagent lifecycle only:
//
//   * NOT preToolUse / permissionRequest -- command preToolUse hooks are
//     fail-closed, so a crash here would DENY a user's tool call in a repository
//     that has nothing to do with kai. Post-hoc events only, always.
//   * NOT per-tool-call events -- measured at ~66ms per hook spawn, that is
//     13-33s of added latency per session, paid by every installer including one
//     who declines. Two spawns per subagent is noise.
//   * NOT the main agent -- that is the operator's own conversation, not an
//     employee working an item.
//
// Two hard output rules, both load-bearing:
//
//   1. stdout stays EMPTY. The host parses a hook's stdout as a decision object,
//      and `subagentStop` honors `decision: "block"` and `modifiedResponse`. A
//      stray character here could force another turn or rewrite the response the
//      parent agent receives. An observer that alters what it observes is not an
//      observer.
//   2. It never throws and always exits 0. A visibility tool that breaks a
//      session costs more than the visibility is worth.
//
// Privacy: the payload's `response` is the FULL subagent reply and `cwd` is an
// absolute path containing a username. Neither is ever stored. `cwd` is used to
// locate the workspace and then discarded; `response` is reduced to a capped,
// path-scrubbed TLDR through the same `safeNote` boundary the declared log uses.

import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, statSync, renameSync, rmSync } from 'node:fs';
import { join, dirname, parse as parsePath } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { digest, looksAbsolute, safeNote, MAX_NOTE, MAX_LINE, MAX_BYTES } from './lib/activity.mjs';

export const OBSERVED_REL = '.kai/observed.jsonl';
export const CONSENT_REL = '.kai/observer-consent';

// Mirrors the declared log's vocabulary so a viewer can merge the two streams
// without translating between them.
export const OBSERVED_EVENTS = new Set(['start', 'stop']);

// An agent name arrives from the host and is written to a file we later read and
// render, so it is constrained rather than trusted. Deliberately identical to
// the declared log's `ROLE_RE`: the two streams are meant to be merged, and a
// looser rule here would produce records a shared viewer silently drops.
const NAME_RE = /^[a-z0-9-]{1,60}$/;

// ---------------------------------------------------------------------------
// Workspace resolution
//
// The payload gives an absolute `cwd`. We walk up for a marker rather than
// writing beside it, so a subagent spawned in a subdirectory still records to
// the workspace root -- and so the absolute path itself is never persisted.
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

// ---------------------------------------------------------------------------
// Consent
//
// There is no host-level "installed but inactive": a plugin's hooks.json fires
// for everyone who installs it, from their next session. So consent cannot live
// in the host -- it has to be a gate inside this script, and the declined path
// has to be the cheapest one, because a user who never opted in still pays for
// every process spawn.
// ---------------------------------------------------------------------------
export function hasConsent(root) {
  return !!root && existsSync(join(root, CONSENT_REL));
}

// Summaries are a SECOND opt-in, on top of consent, and off by default.
//
// The reason is a real limit, not caution: the derived summary is scraped from
// prose a subagent wrote for its parent, not authored for a log. Unlike the
// declared log -- where an agent writes its own `--note` knowing it is being
// recorded, and can self-redact -- there is no redaction opportunity here. Path
// shapes are refused, but a token, an email address, or a customer name sitting
// in the first prose line would be stored verbatim. Participation alone answers
// the question the observer exists to answer, so participation alone is the
// default.
export function wantsSummary(root) {
  if (!root) return false;
  try {
    return /(^|\s)summary(\s|$)/m.test(readFileSync(join(root, CONSENT_REL), 'utf8'));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// The TLDR
//
// `response` is written for the parent agent, not for a supervisor glancing at a
// board, and it is the single largest leak surface in the payload: full prose,
// often containing absolute paths, command output, and code.
//
// This is the DERIVED tier -- a deterministic reduction, never presented as if
// the agent authored a summary for us. A purpose-built declared TLDR is a
// separate open question (see issue #93); when one exists it should win, and be
// labeled as declared.
// ---------------------------------------------------------------------------
export function tldrFrom(response) {
  if (typeof response !== 'string') return null;
  for (const line of response.split(/\r?\n/)) {
    const t = line.trim();
    // Skip structure, fences, and headings -- they describe shape, not outcome.
    if (!t || /^[#>*\-=_`|]/.test(t)) continue;
    const safe = safeNote(t);
    if (safe) return safe;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Record construction
//
// A whitelist, not a copy-with-deletions: fields are named explicitly, so a
// payload field the host adds in a future release cannot silently start flowing
// into the log. Everything else in the payload is dropped on the floor.
// ---------------------------------------------------------------------------
export function buildObserved(event, payload, now = Date.now(), { summary = false } = {}) {
  if (!OBSERVED_EVENTS.has(event)) return { ok: false, reason: `unknown event "${event}"` };
  if (!payload || typeof payload !== 'object') return { ok: false, reason: 'payload must be an object' };

  const role = typeof payload.agentName === 'string' ? payload.agentName.trim() : '';
  if (!role || !NAME_RE.test(role)) return { ok: false, reason: 'payload has no usable agentName' };

  const rec = {
    t: Math.floor(now / 1000),
    src: 'observed',
    event,
    role,
    // A session id is an opaque host identifier; a digest is enough to group a
    // session's subagents and pair a start with its stop.
    session: payload.sessionId ? digest(payload.sessionId).slice(0, 12) : null,
    // Only `subagentStop` carries agentId. Without it, a start and a stop can be
    // paired only by (session, role) in order -- which is ambiguous when two
    // subagents of the same role run concurrently. The viewer must label that
    // ambiguity rather than resolve it by guessing.
    agent: typeof payload.agentId === 'string' && payload.agentId ? digest(payload.agentId).slice(0, 12) : null,
    tldr: summary && event === 'stop' ? tldrFrom(payload.response) : null,
  };

  // Defense in depth. `safeNote` already rejects path-shaped text, but this is
  // the boundary that matters most in a public repository, so it is asserted on
  // the assembled record rather than trusted from the field that produced it.
  for (const [k, v] of Object.entries(rec)) {
    if (looksAbsolute(v)) return { ok: false, reason: `field "${k}" looks like an absolute path` };
  }

  const line = JSON.stringify(rec);
  if (line.length > MAX_LINE) return { ok: false, reason: 'record exceeds the single-line bound' };
  return { ok: true, record: rec, line };
}

// Same append-only discipline as the declared log: one sub-4KB write per record,
// which O_APPEND makes atomic across concurrent processes. Measured in #96 at
// 720/720 records intact across six writers.
function rotate(file) {
  try {
    if (statSync(file).size > MAX_BYTES) renameSync(file, `${file}.1`);
  } catch { /* absent, or another process rotated it first */ }
}

export function appendObserved(root, event, payload, now = Date.now(), opts = {}) {
  const built = buildObserved(event, payload, now, opts);
  if (!built.ok) return built;
  const file = join(root, OBSERVED_REL);
  try {
    mkdirSync(dirname(file), { recursive: true });
    rotate(file);
    appendFileSync(file, `${built.line}\n`);
  } catch (e) {
    return { ok: false, reason: `could not append: ${e.code || 'unknown'}` };
  }
  return built;
}

// ---------------------------------------------------------------------------
// Hook entry
// ---------------------------------------------------------------------------
function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

export function main(argv, stdinText, now = Date.now()) {
  const event = argv.find((a) => !a.startsWith('-')) || '';
  let payload;
  try {
    payload = JSON.parse(stdinText);
  } catch {
    return { ok: false, reason: 'payload was not JSON' };
  }
  const root = findWorkspace(payload && payload.cwd);
  if (!root) return { ok: false, reason: 'no workspace root found' };
  if (!hasConsent(root)) return { ok: false, reason: 'observer not enabled for this workspace' };
  return appendObserved(
    root,
    event === 'subagentStart' ? 'start' : event === 'subagentStop' ? 'stop' : event,
    payload,
    now,
    { summary: wantsSummary(root) },
  );
}

const isEntry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

// ---------------------------------------------------------------------------
// Self-test
// ---------------------------------------------------------------------------
function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => {
    if (cond) console.log(`\u2713 observe self-test: ${msg}`);
    else { console.error(`\u2717 observe self-test: ${msg}`); failed++; }
  };

  const tmp = join(tmpdir(), `kai-observe-${process.pid}`);
  mkdirSync(join(tmp, '.kai'), { recursive: true });
  const payload = (extra = {}) => ({
    sessionId: 'session-uuid-abc',
    timestamp: Date.now(),
    cwd: tmp,
    agentName: 'principal-qa-ui',
    ...extra,
  });

  // --- the boundary that matters most -------------------------------------
  // Summaries are a second opt-in, so every summary assertion must ask for one.
  const S = { summary: true };

  const leaky = buildObserved('stop', payload({
    agentId: 'agent-1',
    response: 'C:\\Users\\someone\\secret\\report.md is where I wrote it',
  }), Date.now(), S);
  ok(leaky.ok && leaky.record.tldr === null, 'a response whose only line is an absolute path yields no tldr');

  const posix = buildObserved('stop', payload({ response: '/home/someone/notes.md holds the detail' }), Date.now(), S);
  ok(posix.ok && posix.record.tldr === null, 'a POSIX absolute path is refused just like a Windows one');

  const long = buildObserved('stop', payload({ response: 'x'.repeat(500) }), Date.now(), S);
  ok(long.ok && long.record.tldr.length <= MAX_NOTE, 'a long response is capped, not stored whole');

  const full = buildObserved('stop', payload({
    response: 'Found three issues.\nThe second one is a blocker.\nDetail follows.',
  }), Date.now(), S);
  ok(full.ok && full.record.tldr === 'Found three issues.', 'the tldr is the first meaningful line, never the whole response');
  ok(full.ok && !JSON.stringify(full.record).includes('blocker'), 'the rest of the response never reaches the record');

  const heading = buildObserved('stop', payload({ response: '## Summary\n\n- bullet\n\nReview passed cleanly.' }), Date.now(), S);
  ok(heading.ok && heading.record.tldr === 'Review passed cleanly.', 'headings and bullets are skipped in favour of prose');

  // --- summaries are off unless asked for ----------------------------------
  const noSum = buildObserved('stop', payload({ response: 'Found three issues.' }));
  ok(noSum.ok && noSum.record.tldr === null, 'no summary is stored unless summaries were explicitly opted into');

  // The honest limit, asserted rather than left to a doc claim: the derived
  // summary is scraped prose, so a secret in the first line IS stored. This
  // test exists so nobody later reads "privacy bounds" as "secret-scrubbed".
  const secret = buildObserved('stop', payload({ response: 'Rotated key AKIAIOSFODNN7EXAMPLE today.' }), Date.now(), S);
  ok(secret.ok && secret.record.tldr.includes('AKIAIOSFODNN7EXAMPLE'),
    'a summary is NOT secret-scrubbed -- which is exactly why it is a separate opt-in');

  // --- no host identifiers -------------------------------------------------
  const rec = buildObserved('start', payload());
  ok(rec.ok && !JSON.stringify(rec.record).includes(tmp), 'the record never contains the absolute cwd it was resolved from');
  ok(rec.ok && !JSON.stringify(rec.record).includes('session-uuid-abc'), 'the raw session id is digested, never stored');
  ok(rec.ok && rec.record.tldr === null, 'a start event carries no tldr -- there is no response yet');

  // --- vocabulary ----------------------------------------------------------
  ok(!buildObserved('progress', payload()).ok, 'an event outside the closed vocabulary is refused');
  ok(!buildObserved('start', payload({ agentName: '../../etc/passwd' })).ok, 'an agentName that is not a plain name is refused');
  ok(!buildObserved('start', payload({ agentName: '' })).ok, 'a missing agentName is refused rather than recorded as unknown');

  // --- consent gate --------------------------------------------------------
  const denied = main(['subagentStart'], JSON.stringify(payload()));
  ok(!denied.ok && /not enabled/.test(denied.reason), 'without a consent marker nothing is written');
  ok(!existsSync(join(tmp, OBSERVED_REL)), 'the declined path leaves no file behind at all');

  writeFileSync(join(tmp, CONSENT_REL), 'enabled\n');
  const allowed = main(['subagentStop'], JSON.stringify(payload({ agentId: 'agent-1', response: 'Done.' })));
  ok(allowed.ok, 'with consent present the record is written');
  const written = readFileSync(join(tmp, OBSERVED_REL), 'utf8').trim();
  ok(JSON.parse(written).src === 'observed', 'the record is tiered as observed, distinct from declared activity');
  ok(JSON.parse(written).event === 'stop', 'the host event name is mapped into the shared vocabulary');
  // Asserted on the bytes that actually landed on disk, not on the object the
  // builder just returned -- otherwise the privacy claim is tested one layer
  // above the only place it can be broken.
  ok(!written.includes(tmp), 'the persisted line contains no absolute workspace path');
  ok(!written.includes('session-uuid-abc'), 'the persisted line contains no raw session id');
  ok(!written.includes('agent-1'), 'the persisted line contains no raw agent id');

  // --- summaries are a second, separate opt-in ----------------------------
  ok(!wantsSummary(tmp), 'a plain consent marker does not opt into summaries');
  ok(JSON.parse(written).tldr === null, 'end to end, consent alone stores participation without any prose');

  writeFileSync(join(tmp, CONSENT_REL), 'enabled\nsummary\n');
  ok(wantsSummary(tmp), 'the summary opt-in is read from the consent marker');
  rmSync(join(tmp, OBSERVED_REL));
  main(['subagentStop'], JSON.stringify(payload({ agentId: 'agent-2', response: 'Shipped it.' })));
  const withSum = readFileSync(join(tmp, OBSERVED_REL), 'utf8').trim();
  ok(JSON.parse(withSum).tldr === 'Shipped it.', 'end to end, the summary opt-in stores the derived line');
  writeFileSync(join(tmp, CONSENT_REL), 'enabled\n');

  // --- malformed input never escalates ------------------------------------
  ok(!main(['subagentStart'], 'not json').ok, 'a non-JSON payload is refused without throwing');
  ok(!main(['subagentStart'], '{}').ok, 'a payload with no cwd is refused without throwing');

  // --- the guarantee the host depends on ----------------------------------
  // A single stray byte on stdout can be parsed as a decision object, and
  // `subagentStop` honors both `decision: "block"` and `modifiedResponse`. This
  // asserts the real process, not the exported function.
  const self = fileURLToPath(import.meta.url);
  for (const [name, input] of [
    ['a valid payload', JSON.stringify(payload({ agentId: 'a', response: 'Done.' }))],
    ['a malformed payload', 'not json at all'],
    ['an empty payload', ''],
  ]) {
    const r = spawnSync(process.execPath, [self, 'subagentStop'], { input, encoding: 'utf8' });
    ok(r.stdout === '', `stdout stays empty for ${name}, so it can never be read as a decision`);
    ok(r.status === 0, `exit code stays 0 for ${name}, so a subagent never fails because of the observer`);
  }

  rmSync(tmp, { recursive: true, force: true });
  if (failed) { console.error(`observe self-test: ${failed} failure(s)`); process.exit(1); }
  console.log('\u2713 observe-subagent self-test: all checks passed');
}

// ---------------------------------------------------------------------------
// Operator commands
//
// Consent is a file because the hook must be able to check it without a runtime,
// and because revoking it must be as easy as deleting something. There is no
// central registry and no daemon to stop.
// ---------------------------------------------------------------------------
function adminCli(argv) {
  const flag = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[i + 1] : null;
  };
  const root = findWorkspace(flag('root') || process.cwd());
  if (!root) {
    console.error('observe-subagent: no workspace found (looked for a .kai or .git directory)');
    process.exit(2);
  }
  const marker = join(root, CONSENT_REL);

  if (argv.includes('--enable')) {
    const summary = argv.includes('--with-summary');
    mkdirSync(dirname(marker), { recursive: true });
    writeFileSync(marker, `enabled ${new Date().toISOString()}\n${summary ? 'summary\n' : ''}`);
    console.log('Subagent observation ENABLED for this workspace.');
    console.log(`  marker:  ${CONSENT_REL}   (delete it to revoke)`);
    console.log(`  records: ${OBSERVED_REL}  (gitignored, local only)`);
    console.log('');
    console.log('Records who started and who finished, so the participation');
    console.log('sequence of a feature becomes checkable.');
    console.log('');
    if (summary) {
      console.log('Summaries: ON. A one-line summary is scraped from each reply.');
      console.log('It is capped and path-shapes are refused, but it is NOT');
      console.log('secret-scrubbed -- a token or an address in the first prose');
      console.log('line would be stored verbatim. Re-run without --with-summary');
      console.log('to record participation only.');
    } else {
      console.log('Summaries: off. Add --with-summary to also store a one-line');
      console.log('summary scraped from each reply (not secret-scrubbed).');
    }
    console.log('');
    console.log('Hook configuration is read when a session STARTS, so restart your');
    console.log('session before expecting anything to appear.');
    return;
  }

  if (argv.includes('--disable')) {
    if (existsSync(marker)) { rmSync(marker); console.log('Subagent observation DISABLED. Existing records are left in place.'); }
    else console.log('Subagent observation was not enabled.');
    return;
  }

  const on = hasConsent(root);
  const file = join(root, OBSERVED_REL);
  let count = 0;
  if (existsSync(file)) {
    try { count = readFileSync(file, 'utf8').split('\n').filter(Boolean).length; } catch { count = 0; }
  }
  console.log(`Subagent observation: ${on ? 'ENABLED' : 'disabled'}`);
  if (on) console.log(`Summaries: ${wantsSummary(root) ? 'ON (not secret-scrubbed)' : 'off'}`);
  console.log(`Observed records: ${count}`);
  if (!on) console.log('Enable with: npm run observe:enable');
}

if (isEntry) {
  const argv = process.argv.slice(2);
  if (argv.includes('--self-test')) {
    selfTest();
  } else if (argv.some((a) => ['--enable', '--disable', '--status'].includes(a))) {
    adminCli(argv);
  } else {
    // Everything is swallowed. stdout stays empty and the exit code stays 0 no
    // matter what happened, because this process sits in the path of a real
    // subagent's completion.
    try {
      main(argv, readStdin());
    } catch { /* never let an observer break the thing it observes */ }
    process.exit(0);
  }
}
