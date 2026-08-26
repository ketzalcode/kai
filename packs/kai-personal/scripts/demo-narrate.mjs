#!/usr/bin/env node
// demo-narrate — placing measured speech against a measured recording.
//
// Why this exists
// ---------------
// The demo pipeline works because whoever cannot know a number is not allowed to
// write it down. A director cannot watch footage that does not exist yet, so a
// screenplay is refused a `start`, an `end`, an `x` or a `y`. Narration has to
// inherit that rule or it reintroduces exactly the guessing the recorder removed.
//
// The obvious design is one line per step, with the line's length driving how
// long the step dwells. It is wrong. A 0.3-second click is not a nine-second
// visual scene, and keying one to the other manufactures long inert holds. Worse,
// knowing a clip's duration up front still does not say when the line should
// start: that depends on when the interface actually reached the state being
// described, which is only knowable after the take.
//
// So there are two independent measurements, taken by two different tools:
//
//   how long a line takes to say  <- measured by the synthesiser, before capture
//   when a state appears on screen <- measured by the recorder, during capture
//
// This tool owns neither. It reads both and answers one question: can they be
// laid against each other without materially falsifying either? When they cannot,
// it refuses and says which line, by how much, and what would fix it.
//
// What it will not do
// -------------------
// Stretch time, freeze a frame to cover latency, slow typing to fit prose, or let
// a line claim an outcome before it is visible. A freeze that conceals latency is
// a lie about how fast the product is. Those are script defects, and the fix is a
// shorter line or a wider span -- both of which this tool computes for you.

import { readFileSync, writeFileSync, existsSync, mkdirSync, mkdtempSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseScreenplay, parseTake } from './demo-capture.mjs';

const TAKE_SCHEMA = 'kai.demo-narration-take/v1';
const PLAN_SCHEMA = 'kai.demo-narration-plan/v1';

// Silence between beats. Speech that butts straight onto the previous line reads
// as one run-on sentence; this is the smallest pause that still sounds authored.
const MIN_GAP = 0.25;

// 130 words per minute is the middle of the range measured for explainer
// narration. It is used only to turn "this line is 1.8 seconds too long" into
// "cut about four words", which is the form an author can act on, and for a
// pre-synthesis estimate that is clearly labelled as one.
const WORDS_PER_SECOND = 130 / 60;

function fail(message) {
  throw new Error(message);
}

function num(value, label, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) fail(`${label} must be a number, got ${JSON.stringify(value)}`);
  if (n < min || n > max) fail(`${label} must be within ${min}..${max}, got ${n}`);
  return n;
}

function str(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be a non-empty string`);
  return value;
}

const round = (n) => Math.round(n * 1000) / 1000;

// The text a clip was paid for, pinned. Editing a line after synthesis leaves a
// clip that still plays the old words, and nothing about the file would show it.
export function textHash(text) {
  return createHash('sha256').update(text.trim(), 'utf8').digest('hex').slice(0, 16);
}

export function wordCount(text) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

// --------------------------------------------------------------- narration take

// The measured, paid output of the synthesiser. It is a separate file from the
// screenplay on purpose: narration is regenerated per language and per voice
// while the automation stays fixed, and authored intent must not be overwritten
// by a provider's answer.
export function parseNarrationTake(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the narration take is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== TAKE_SCHEMA) {
    fail(`the narration take must declare "schema": "${TAKE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  if (!Array.isArray(raw.clips) || raw.clips.length === 0) fail('a narration take must record at least one clip');

  const clips = new Map();
  for (const [i, clip] of raw.clips.entries()) {
    const where = `clips[${i}]`;
    const beat = str(clip.beat, `${where}.beat`);
    if (clips.has(beat)) fail(`${where} is a second clip for beat "${beat}"; a beat is spoken once`);
    const status = clip.status === 'failed' ? 'failed' : 'ok';
    clips.set(beat, {
      beat,
      status,
      // A failed clip carries no duration to trust, and must not be silently
      // treated as zero seconds of speech.
      path: status === 'ok' ? str(clip.path, `${where}.path`) : (typeof clip.path === 'string' ? clip.path : ''),
      durationSec: status === 'ok' ? num(clip.durationSec, `${where}.durationSec`, { min: 0.01, max: 600 }) : 0,
      characters: Number.isFinite(Number(clip.characters)) ? Number(clip.characters) : null,
      text_sha256: typeof clip.text_sha256 === 'string' ? clip.text_sha256 : null,
      reason: typeof clip.reason === 'string' ? clip.reason : '',
    });
  }

  return {
    schema: TAKE_SCHEMA,
    provider: typeof raw.provider === 'string' ? raw.provider : null,
    voice: typeof raw.voice === 'string' ? raw.voice : null,
    region: typeof raw.region === 'string' ? raw.region : null,
    clips,
  };
}

// ------------------------------------------------------------------- placement

// Lay every beat against the measured recording, or refuse. All problems are
// collected rather than thrown one at a time, because a script with four long
// lines should be fixed in one sitting, not four.
export function place(screenplay, take, narrationTake) {
  const beats = screenplay.narration;
  if (!beats || beats.length === 0) fail('this screenplay has no narration beats, so there is nothing to place');

  const measured = new Map(take.steps.map((step) => [step.id, step]));
  const rejections = [];
  const placed = [];
  let cursor = 0;

  for (const beat of beats) {
    const from = measured.get(beat.visual_span.from_step);
    const through = measured.get(beat.visual_span.through_step);

    // A beat can only be placed against states the take actually recorded.
    if (!from || !through) {
      rejections.push({
        beat: beat.id,
        reason: 'unrecorded-step',
        detail: `beat "${beat.id}" spans ${!from ? `"${beat.visual_span.from_step}"` : `"${beat.visual_span.through_step}"`}, which this take does not contain; the screenplay and the take are not from the same demo`,
      });
      continue;
    }

    // Narrating over a step the driver knows went wrong sells a defect as a
    // feature. `unsettled` is just as disqualifying: the tool recorded that it
    // never saw the interface stop changing, so it cannot say the described
    // state was ever reached.
    const broken = [from, through].filter((s) => s.status !== 'ok');
    if (broken.length > 0) {
      rejections.push({
        beat: beat.id,
        reason: `step-${broken[0].status}`,
        detail: `beat "${beat.id}" describes step "${broken[0].id}", which the take recorded as ${broken[0].status}; narrating over it would describe something that did not happen. Re-record before narrating.`,
      });
      continue;
    }

    const clip = narrationTake.clips.get(beat.id);
    if (!clip) {
      rejections.push({ beat: beat.id, reason: 'no-clip', detail: `beat "${beat.id}" has no clip in the narration take; synthesis was partial` });
      continue;
    }
    if (clip.status !== 'ok') {
      rejections.push({ beat: beat.id, reason: 'clip-failed', detail: `the clip for beat "${beat.id}" failed to synthesise${clip.reason ? ` (${clip.reason})` : ''}; a failed clip is not silence` });
      continue;
    }
    if (clip.text_sha256 && clip.text_sha256 !== textHash(beat.text)) {
      rejections.push({
        beat: beat.id,
        reason: 'stale-text',
        detail: `the clip for beat "${beat.id}" was synthesised from different words than the screenplay now carries; it would play the old line. Re-synthesise.`,
      });
      continue;
    }

    const spanStart = from.start;
    const spanEnd = through.end;

    // The earliest honest start. Defaulting to the start of the span claims
    // nothing; naming a `start_after` step waits for that step's *result*.
    const gate = beat.start_after ? measured.get(beat.start_after) : null;
    if (beat.start_after && !gate) {
      rejections.push({ beat: beat.id, reason: 'unrecorded-step', detail: `beat "${beat.id}" waits for "${beat.start_after}", which this take does not contain` });
      continue;
    }
    const earliest = gate ? gate.end : spanStart;

    const start = Math.max(earliest, cursor);
    const end = start + clip.durationSec;

    if (end > spanEnd + 1e-6) {
      const over = end - spanEnd;
      // "Too long" is not something an author can act on. Two fixes exist, and
      // which one applies is computable rather than a matter of taste: either a
      // later state stays on screen long enough to carry the line, or none does
      // and the line has to be shorter. Naming the *smallest* span that would
      // work stops the author widening it further than the line deserves.
      const throughAt = take.steps.findIndex((s) => s.id === through.id);
      const later = take.steps.slice(throughAt + 1);
      const widen = later.find((s) => s.status === 'ok' && s.end >= end - 1e-6);
      const furthest = later.length > 0 ? later[later.length - 1].end : spanEnd;
      const mustCut = widen ? over : end - furthest;
      rejections.push({
        beat: beat.id,
        reason: 'overruns-span',
        detail: [
          `beat "${beat.id}" is ${round(over)}s longer than the visual states it describes`,
          `(speaks ${round(clip.durationSec)}s from ${round(start)}s, but "${through.id}" is over at ${round(spanEnd)}s).`,
          widen
            ? `Either extend through_step to "${widen.id}", which is still on screen at ${round(end)}s, or cut about ${Math.max(1, Math.ceil(mustCut * WORDS_PER_SECOND))} words.`
            : `No later state stays on screen long enough to carry it -- even spanning to the end of the recording it is ${round(mustCut)}s too long -- so cut about ${Math.max(1, Math.ceil(mustCut * WORDS_PER_SECOND))} words, or record a real hold on the result.`,
          'This tool will not slow the recording to fit prose.',
        ].join(' '),
      });
      continue;
    }

    placed.push({
      beat: beat.id,
      path: clip.path,
      start: round(start),
      end: round(end),
      durationSec: round(clip.durationSec),
      span: { start: round(spanStart), end: round(spanEnd) },
      // How much later than its earliest honest position the line had to sit
      // because the previous one was still speaking. Visible so an author can
      // see narration drifting away from the action before it becomes a reject.
      deferred: round(Math.max(0, start - earliest)),
      text: beat.text,
    });

    cursor = end + MIN_GAP;
  }

  return {
    schema: PLAN_SCHEMA,
    recording: take.recording,
    take_id: take.take_id,
    provider: narrationTake.provider,
    voice: narrationTake.voice,
    beats: placed,
    rejections,
    ok: rejections.length === 0,
  };
}

// ------------------------------------------------------------------------ mix

// Narration is laid onto the finished render rather than mixed during it, so a
// re-narration in another language never re-encodes the video and can never
// change a single frame of what was recorded.
export function buildMixArgs(plan, { video, out }) {
  if (!plan.ok) fail('this narration plan was rejected, so there is nothing to mix; fix the rejections first');
  if (plan.beats.length === 0) fail('this narration plan places no beats');
  for (const label of [video, out]) {
    if (label.startsWith('-')) fail(`"${label}" starts with a dash and would be read as an option, not a file`);
  }

  const inputs = [];
  const chain = [];
  const labels = [];
  plan.beats.forEach((beat, i) => {
    inputs.push('-i', beat.path);
    // adelay takes milliseconds, and `all=1` applies the same delay to every
    // channel; without it only the first channel moves and a stereo clip tears.
    chain.push(`[${i + 1}:a]adelay=${Math.round(beat.start * 1000)}:all=1[n${i}]`);
    labels.push(`[n${i}]`);
  });
  // normalize=0 because beats never overlap: amix's default would divide every
  // clip's level by the number of inputs and make a ten-beat demo inaudible.
  chain.push(`${labels.join('')}amix=inputs=${plan.beats.length}:normalize=0:dropout_transition=0[mix]`);

  return [
    '-y', '-hide_banner', '-v', 'error',
    '-i', video,
    ...inputs,
    '-filter_complex', chain.join(';'),
    '-map', '0:v', '-map', '[mix]',
    // The video is copied, not re-encoded. Only the audio is created here.
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
    out,
  ];
}

// -------------------------------------------------------------- lectoria seam

// kai's scripts import nothing outside Node's standard library, which is why CI
// needs no install step. `lectoria` carries sixteen runtime dependencies,
// including a PDF parser and a DOM implementation, and none of them belong in a
// script that only needs a duration back. So it is treated as an external tool
// and shelled out to, exactly as ffmpeg is.
//
// Where it lives is not a guess. kai pins lectoria as a git dependency, so
// `npm install` puts it at `node_modules/.bin/lectoria` -- not on PATH, and not
// global. `kai-core-generate-audio` already resolves it that way; looking only on PATH
// would report it absent on precisely the machines where it is correctly
// installed, with a message accurate about what it checked and wrong about the
// conclusion.
export function findLectoria(env = process.env, probe = defaultProbe, exists = existsSync) {
  const explicit = env.LECTORIA_BIN;
  if (explicit) return { path: explicit, source: 'LECTORIA_BIN' };

  // The plugin root is two levels up from this file (scripts/demo-narrate.mjs).
  const root = dirname(dirname(fileURLToPath(import.meta.url)));
  for (const name of process.platform === 'win32' ? ['lectoria.cmd', 'lectoria.ps1', 'lectoria'] : ['lectoria']) {
    const local = join(root, 'node_modules', '.bin', name);
    if (exists(local)) return { path: local, source: 'node_modules/.bin' };
  }

  return probe('lectoria') ? { path: 'lectoria', source: 'PATH' } : null;
}

// Every place that has to say lectoria is missing says the same thing, and says
// what was checked -- a bare "not found" sends people looking in the wrong place.
export const LECTORIA_MISSING = [
  'lectoria was not found, so narration cannot be synthesised. Checked LECTORIA_BIN,',
  "this plugin's node_modules/.bin, and PATH.",
  'Run `npm install` in the plugin (lectoria is pinned there as a git dependency), or set',
  'LECTORIA_BIN to its executable. Note lectoria needs Node ^22.22.2 || ^24.15.0 || >=26.0.0,',
  'so a version error can look like an install problem.',
  'Nothing was recorded as narrated.',
].join(' ');

function defaultProbe(name) {
  const finder = process.platform === 'win32' ? 'where' : 'which';
  const r = spawnSync(finder, [name], { encoding: 'utf8' });
  return r.status === 0;
}

// A projection, not a measurement, and labelled as one everywhere it surfaces.
// Its only job is to let a person see the size and cost of a synthesis run
// before authorising a paid call.
export function estimate(screenplay) {
  const beats = screenplay.narration ?? [];
  const rows = beats.map((beat) => ({
    beat: beat.id,
    words: wordCount(beat.text),
    characters: beat.text.trim().length,
    projectedSec: round(wordCount(beat.text) / WORDS_PER_SECOND),
  }));
  return {
    estimated: true,
    beats: rows,
    totalCharacters: rows.reduce((a, r) => a + r.characters, 0),
    totalProjectedSec: round(rows.reduce((a, r) => a + r.projectedSec, 0)),
  };
}

// One paid call per beat, each one measured. Failure is recorded as a failed
// clip rather than retried: a retry of a paid request nobody asked for is a
// charge nobody agreed to, and a partial take must be visibly partial.
export function synthesize(screenplay, { outDir, voice, run = runLectoria }) {
  const beats = screenplay.narration ?? [];
  if (beats.length === 0) fail('this screenplay has no narration beats to synthesise');
  mkdirSync(outDir, { recursive: true });

  const clips = [];
  for (const beat of beats) {
    const path = join(outDir, `${beat.id}.mp3`);
    const textFile = join(outDir, `${beat.id}.txt`);
    writeFileSync(textFile, beat.text, 'utf8');
    const result = run({ textFile, out: path, voice: beat.voice || voice });

    // A machine with no Azure configuration will fail identically on every
    // beat, so continuing produces a wall of the same message and buries the
    // one fact that matters. Nothing has been billed either, so there is
    // nothing to preserve by finishing.
    if (!result.ok && result.fatal) {
      fail(`${result.reason}\nStopped before beat "${beat.id}". No further calls were attempted, and nothing was billed.`);
    }
    if (!result.ok) {
      clips.push({ beat: beat.id, status: 'failed', reason: result.reason, text_sha256: textHash(beat.text) });
      continue;
    }
    clips.push({
      beat: beat.id,
      status: 'ok',
      path,
      durationSec: result.durationSec,
      characters: result.characters ?? beat.text.trim().length,
      text_sha256: textHash(beat.text),
    });
  }

  return { schema: TAKE_SCHEMA, provider: 'lectoria', voice: voice ?? null, region: null, clips };
}

function runLectoria({ textFile, out, voice }) {
  const found = findLectoria();
  if (!found) {
    fail(LECTORIA_MISSING);
  }
  const args = ['speak', '--text-file', textFile, '--out', out, '--json'];
  if (voice) args.push('--voice', voice);
  const r = spawnSync(found.path, args, { encoding: 'utf8', shell: process.platform === 'win32' });
  return readLectoriaResult(r);
}

// Reads what `lectoria speak --json` said. Kept separate from spawning so the
// contract between the two tools can be tested without an Azure account.
export function readLectoriaResult(r) {
  let parsed = null;
  try {
    parsed = JSON.parse(r.stdout);
  } catch {
    parsed = null;
  }

  if (r.status !== 0) {
    // lectoria prints a structured reason on stdout under --json. Prefer it:
    // scraping the last line of stderr turns a multi-line explanation into a
    // fragment, and cannot distinguish a machine that was never set up from a
    // call that was attempted and failed.
    if (parsed?.error?.reason) {
      return {
        ok: false,
        reason: parsed.error.message,
        // `not-configured` means nothing was attempted and nothing billed, so
        // every remaining beat would fail the same way.
        fatal: parsed.error.reason === 'not-configured',
      };
    }
    return { ok: false, reason: (r.stderr || r.error?.message || `exit ${r.status}`).trim().split('\n').pop() };
  }

  if (!parsed) {
    return { ok: false, reason: 'lectoria did not print the JSON measurement this expects; it may predate the `speak` subcommand (RubenSaucedo/lectoria#27)' };
  }
  // The whole point of this seam is that the duration is *measured*. lectoria
  // reports a projection under a different key for exactly this reason, so a
  // payload that is an estimate, or that carries no usable duration at all, is
  // refused rather than placed as though somebody had heard it.
  if (parsed.estimated === true || !Number.isFinite(Number(parsed.durationSec)) || Number(parsed.durationSec) <= 0) {
    return { ok: false, reason: `lectoria returned no measured duration for this line${parsed.estimated === true ? ' (it returned an estimate, which must never be placed as a measurement)' : ''}` };
  }
  return { ok: true, durationSec: Number(parsed.durationSec), characters: parsed.characters };
}

// -------------------------------------------------------------------- reporting

export function formatReport(plan) {
  const lines = [];
  for (const beat of plan.beats) {
    const drift = beat.deferred > 0.05 ? `  (+${beat.deferred}s after its earliest honest start)` : '';
    lines.push(`  ok    ${beat.beat}  ${beat.start}s -> ${beat.end}s   within ${beat.span.start}..${beat.span.end}${drift}`);
  }
  for (const r of plan.rejections) lines.push(`  REJECT ${r.beat}  [${r.reason}] ${r.detail}`);
  lines.push('');
  lines.push(plan.ok
    ? `${plan.beats.length} beat(s) placed against measured states.`
    : `${plan.rejections.length} beat(s) rejected. Measured speech could not be aligned with measured visual states without falsifying one of them.`);
  return lines.join('\n');
}

// ------------------------------------------------------------------- self-test

function selfTest() {
  let pass = 0;
  let failed = 0;
  const ok = (cond, label) => {
    if (cond) { pass += 1; console.log(`  ok ${label}`); } else { failed += 1; console.log(`  FAIL ${label}`); }
  };
  const rejects = (fn, needle, label) => {
    try { fn(); failed += 1; console.log(`  FAIL ${label} (nothing was refused)`); } catch (e) {
      if (String(e.message).includes(needle)) { pass += 1; console.log(`  ok ${label}`); } else { failed += 1; console.log(`  FAIL ${label}: ${e.message}`); }
    }
  };

  const play = (narration) => JSON.stringify({
    schema: 'kai.demo-screenplay/v1',
    title: 't',
    capture: { region: '0,0 100x100' },
    steps: [
      { id: 'open', action: 'click', target: 'a' },
      { id: 'fill', action: 'type', text: 'hello', target: 'a' },
      { id: 'save', action: 'click', target: 'a' },
      { id: 'result', action: 'hold', seconds: 4 },
    ],
    narration,
  });

  const takeJson = (over = {}) => JSON.stringify({
    schema: 'kai.demo-take/v1',
    take_id: 'k',
    recording: 'r.mp4',
    capture: { region: '0,0 100x100' },
    steps: [
      { id: 'open', start: 0, end: 2 },
      { id: 'fill', start: 2, end: 10 },
      { id: 'save', start: 10, end: 14 },
      { id: 'result', start: 14, end: 22 },
      ...(over.extra ?? []),
    ].map((s) => ({ ...s, ...(over.status?.[s.id] ? { status: over.status[s.id] } : {}) })),
  });

  const narrTake = (clips) => JSON.stringify({ schema: TAKE_SCHEMA, provider: 'lectoria', clips });

  // --- the authoring rule: a beat may not carry numbers nobody can know yet
  for (const forbidden of ['start', 'end', 'seconds', 'duration', 'offset']) {
    rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open' }, [forbidden]: 1 }])),
      'carries intent, not measurements',
      `a beat declaring "${forbidden}" is refused, because neither speech length nor UI readiness is knowable while writing`);
  }
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x' }])), 'visual_span is required', 'a beat with no visual span is refused: nothing could decide whether it fits');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'nope' } }])), 'not a step in this screenplay', 'a beat spanning a step that does not exist is refused');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'save', through_step: 'open' } }])), 'runs backwards', 'a span that runs backwards is refused');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open' }, start_after: 'save' } ])), 'outside the beat', 'a beat cannot wait for a step it does not cover');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open', through_step: 'save' }, start_after: 'save' }])), 'the instant it must be finished', 'waiting for the last step of your own span is refused: no clip is short enough to fit, so it is an authoring error rather than an overrun');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open' }, start_after: 'open' }])), 'no time in which to speak', 'a one-step beat that also waits for that step to finish is refused while writing, not as a mystifying overrun later');
  rejects(() => parseScreenplay(play([
    { id: 'n1', text: 'x', visual_span: { from_step: 'fill' } },
    { id: 'n2', text: 'y', visual_span: { from_step: 'open' } },
  ])), 'in the order it is heard', 'beats authored out of order are refused rather than silently resequenced');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open' } }, { id: 'n1', text: 'y', visual_span: { from_step: 'fill' } }])), 'used twice', 'a duplicated beat id is refused: a narration take is keyed by it');

  const sp = parseScreenplay(play([
    { id: 'n1', text: 'First we open the form.', visual_span: { from_step: 'open', through_step: 'fill' } },
    { id: 'n2', text: 'Then we save it.', visual_span: { from_step: 'save', through_step: 'result' }, start_after: 'save' },
  ]));
  ok(sp.narration.length === 2, 'a screenplay with no narration is still valid, and one with beats carries them');
  ok(parseScreenplay(play(undefined)).narration.length === 0, 'narration is optional: a silent demo is a legitimate demo');
  ok(parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'fill' } }])).narration[0].visual_span.through_step === 'fill',
    'through_step defaults to from_step, so a beat covering one state need not say it twice');

  // --- placement against measured states
  const take = parseTake(takeJson());
  const good = place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'n1.mp3', durationSec: 4 },
    { beat: 'n2', path: 'n2.mp3', durationSec: 2 },
  ])));
  ok(good.ok && good.beats.length === 2, 'two beats that fit their measured spans are placed');
  ok(good.beats[0].start === 0, 'a beat with no start_after begins when its first state begins');
  ok(good.beats[1].start === 14, 'a beat gated on a step begins when that step is *over*, so it never claims a result before it is visible');

  const shifted = place(parseScreenplay(play([
    { id: 'n1', text: 'a', visual_span: { from_step: 'open', through_step: 'result' } },
    { id: 'n2', text: 'b', visual_span: { from_step: 'open', through_step: 'result' } },
  ])), take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a.mp3', durationSec: 3 },
    { beat: 'n2', path: 'b.mp3', durationSec: 3 },
  ])));
  ok(shifted.ok && shifted.beats[1].start === round(3 + MIN_GAP), 'a second beat waits for the first to finish speaking rather than talking over it');
  ok(shifted.beats[1].deferred > 0, 'how far a line drifted from its earliest honest position is reported, not hidden');

  // --- the refusals
  const long = place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'n1.mp3', durationSec: 30 },
    { beat: 'n2', path: 'n2.mp3', durationSec: 2 },
  ])));
  ok(!long.ok && long.rejections[0].reason === 'overruns-span', 'a line longer than the states it describes is rejected, not fitted by slowing the video');
  ok(/cut about \d+ words/.test(long.rejections[0].detail), 'the rejection says how many words to cut, because "too long" is not something an author can act on');
  ok(place(parseScreenplay(play([{ id: 'n1', text: 'a', visual_span: { from_step: 'open', through_step: 'fill' } }])), take, parseNarrationTake(narrTake([{ beat: 'n1', path: 'a', durationSec: 15 }]))).rejections[0].detail.includes('extend through_step to "result"'), 'when a later state does stay on screen long enough, the rejection names the smallest span that would work instead of only telling the author to cut');
  ok(long.rejections[0].detail.includes('will not slow the recording'), 'the rejection states the thing it refuses to do, so nobody goes looking for the option');

  ok(place(sp, parseTake(takeJson({ status: { open: 'failed' } })), parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a', durationSec: 1 }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).rejections.some((r) => r.reason === 'step-failed'), 'narrating over a step the driver recorded as failed is refused');
  ok(place(sp, parseTake(takeJson({ status: { open: 'unsettled' } })), parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a', durationSec: 1 }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).rejections.some((r) => r.reason === 'step-unsettled'), 'a screen that never settled cannot be said to have reached the described state');
  ok(place(sp, take, parseNarrationTake(narrTake([{ beat: 'n1', path: 'a', durationSec: 1 }]))).rejections.some((r) => r.reason === 'no-clip'),
    'a partial synthesis is rejected rather than rendered with a silent gap');
  ok(place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', status: 'failed', reason: 'auth' }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).rejections.some((r) => r.reason === 'clip-failed'), 'a failed clip is not treated as silence');
  ok(place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a', durationSec: 1, text_sha256: 'deadbeefdeadbeef' }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).rejections.some((r) => r.reason === 'stale-text'), 'a clip synthesised from words the screenplay no longer carries is rejected, because it would play the old line');
  ok(place(sp, parseTake(JSON.stringify({
    schema: 'kai.demo-take/v1', take_id: 'k', recording: 'r.mp4', capture: { region: '0,0 100x100' },
    steps: [{ id: 'other', start: 0, end: 5 }],
  })), parseNarrationTake(narrTake([{ beat: 'n1', path: 'a', durationSec: 1 }]))).rejections.some((r) => r.reason === 'unrecorded-step'),
    'a screenplay placed against a take from a different demo is rejected');
  ok(place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a', durationSec: 1, text_sha256: textHash('First we open the form.') }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).ok, 'a hash matching the current words places normally');

  rejects(() => parseNarrationTake(JSON.stringify({ schema: 'other', clips: [] })), 'must declare', 'a foreign narration take schema is refused');
  rejects(() => parseNarrationTake(narrTake([{ beat: 'n1', path: 'a', durationSec: 1 }, { beat: 'n1', path: 'b', durationSec: 1 }])), 'spoken once', 'two clips for one beat are refused');

  // --- mixing
  const args = buildMixArgs(good, { video: 'in.mp4', out: 'out.mp4' });
  ok(args.includes('-c:v') && args[args.indexOf('-c:v') + 1] === 'copy', 'the video is copied, so re-narrating in another language cannot change a frame of what was recorded');
  ok(args.join(' ').includes('adelay=14000:all=1'), 'a clip is delayed to its measured position, in milliseconds, on every channel');
  ok(args.join(' ').includes('normalize=0'), 'amix does not normalise, which would divide every clip level by the number of beats');
  ok(!args.includes('-shortest'), 'the output is not truncated to the shorter stream: placement already guarantees the narration fits inside measured steps, so -shortest could only ever cut the end off the demo');
  rejects(() => buildMixArgs({ ...good, ok: false }, { video: 'a', out: 'b' }), 'was rejected', 'a rejected plan cannot be mixed');
  rejects(() => buildMixArgs(good, { video: '-evil', out: 'b' }), 'read as an option', 'a filename that would be read as an option is refused');

  // --- the optional-tool seam
  ok(findLectoria({ LECTORIA_BIN: 'C:\\x\\lectoria.cmd' }, () => false, () => true).source === 'LECTORIA_BIN', 'an explicit LECTORIA_BIN wins over everything, so an uninstalled checkout can still be used');
  ok(findLectoria({}, () => false, () => true).source === 'node_modules/.bin', 'the pinned dependency is found where npm actually puts it, which is not on PATH');
  ok(findLectoria({}, () => true, () => false).source === 'PATH', 'a global install still answers when the pinned dependency is not installed');
  ok(findLectoria({}, () => false, () => false) === null, 'a genuinely missing lectoria is reported as absent rather than assumed present');

  // --- the contract with `lectoria speak --json`, pinned against real payloads
  const measured = readLectoriaResult({ status: 0, stdout: JSON.stringify({ path: 'a.mp3', durationSec: 4.812, characters: 143, estimated: false }) });
  ok(measured.ok && measured.durationSec === 4.812 && measured.characters === 143, 'a measured duration is read from lectoria\'s JSON');
  ok(readLectoriaResult({ status: 0, stdout: JSON.stringify({ estimatedDurationSec: 3.3, estimated: true }) }).ok === false,
    'an estimate is refused rather than placed as a measurement: lectoria reports a projection under a different key precisely so this cannot pass silently');
  ok(readLectoriaResult({ status: 0, stdout: JSON.stringify({ path: 'a.mp3', durationSec: 0 }) }).ok === false,
    'a zero duration is refused: it would place a beat that nobody can hear');
  ok(readLectoriaResult({ status: 0, stdout: 'not json' }).ok === false, 'output that is not the expected JSON is refused rather than half-read');

  const unconfigured = readLectoriaResult({ status: 2, stdout: JSON.stringify({ error: { reason: 'not-configured', message: 'AZURE_SPEECH_REGION is not set. Nothing was attempted and nothing was billed.' } }) });
  ok(unconfigured.fatal === true, 'an unconfigured machine is fatal: every remaining beat would fail identically, and nothing has been billed to preserve');
  ok(unconfigured.reason.includes('nothing was billed'), 'the whole structured message survives, rather than the last line of stderr');
  ok(readLectoriaResult({ status: 3, stdout: JSON.stringify({ error: { reason: 'synthesis-failed', message: 'closed without an answer' } }) }).fatal === false,
    'a failed call is not fatal: it may be transient, and the other beats are still worth attempting');
  ok(readLectoriaResult({ status: 1, stdout: '', stderr: 'lectoria speak: something\nlast line' }).reason === 'last line',
    'an older lectoria with no structured error still yields something, so the seam degrades rather than breaking');

  const stopped = (() => {
    try {
      synthesize(sp, { outDir: mkdtempSync(join(tmpdir(), 'kai-narr-')), run: () => ({ ok: false, fatal: true, reason: 'not configured' }) });
      return null;
    } catch (e) { return e.message; }
  })();
  ok(stopped?.includes('No further calls were attempted'), 'synthesis stops at the first fatal failure instead of producing one identical failure per beat');
  ok(findLectoria({}, () => true, () => true).source === 'node_modules/.bin', 'the pinned version wins over whatever is on PATH, so a demo is narrated by the version this plugin pins rather than a stray global');
  ok(['LECTORIA_BIN', 'node_modules', 'PATH'].every((p) => LECTORIA_MISSING.includes(p)), 'the absence message names every place that was checked, because a bare "not found" sends people looking in the wrong one');

  const est = estimate(sp);
  ok(est.estimated === true, 'a pre-synthesis estimate is labelled an estimate everywhere it surfaces');
  ok(est.totalCharacters === sp.narration.reduce((a, b) => a + b.text.trim().length, 0), 'the estimate counts the characters that would actually be billed');

  console.log(`\ndemo-narrate self-test: ${pass} checks passed${failed ? `, ${failed} FAILED` : ''}`);
  return failed === 0;
}

// -------------------------------------------------------------------- cli

function usage() {
  console.log(`demo-narrate — place measured speech against a measured recording

  --estimate   <screenplay.json>
      What a synthesis run would cost and roughly how long it would speak.
      Makes no paid call.

  --synthesize <screenplay.json> --out <dir> [--voice <name>]
      One paid call per beat, each measured, written to <dir>/demo_narration_take.json.
      Requires lectoria on PATH or LECTORIA_BIN.

  --place      <screenplay.json> <take.json> <narration_take.json> [--out plan.json]
      Lay the beats against the measured recording, or refuse and say why.

  --mix        <plan.json> --video <render.mp4> --out <narrated.mp4>
      Print the ffmpeg command that lays the placed clips onto the finished video.

  --self-test`);
}

function flag(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest() ? 0 : 1;
  const positional = argv.filter((a, i) => !a.startsWith('-') && !argv[i - 1]?.startsWith('--out') && !argv[i - 1]?.startsWith('--voice') && !argv[i - 1]?.startsWith('--video'));

  if (argv.includes('--estimate')) {
    const sp = parseScreenplay(readFileSync(positional[0], 'utf8'));
    const est = estimate(sp);
    for (const row of est.beats) console.log(`  ${row.beat}  ${row.characters} chars, ~${row.projectedSec}s (estimated)`);
    console.log(`\n${est.totalCharacters} characters across ${est.beats.length} beat(s), roughly ${est.totalProjectedSec}s of speech.`);
    console.log('These are projections at 130 wpm, not measurements. Real durations come back from synthesis.');
    return 0;
  }

  if (argv.includes('--synthesize')) {
    const sp = parseScreenplay(readFileSync(positional[0], 'utf8'));
    const outDir = flag(argv, '--out') ?? fail('--synthesize needs --out <dir>');
    const take = synthesize(sp, { outDir, voice: flag(argv, '--voice') });
    const path = join(outDir, 'demo_narration_take.json');
    writeFileSync(path, JSON.stringify(take, null, 2));
    const bad = take.clips.filter((c) => c.status !== 'ok');
    console.log(`wrote ${path} (${take.clips.length - bad.length}/${take.clips.length} clips measured)`);
    if (bad.length) console.log(`  ${bad.length} clip(s) failed and were recorded as failed, not retried: ${bad.map((c) => `${c.beat} (${c.reason})`).join(', ')}`);
    return bad.length ? 1 : 0;
  }

  if (argv.includes('--place')) {
    const [screenplayPath, takePath, narrPath] = positional;
    if (!screenplayPath || !takePath || !narrPath) { usage(); return 2; }
    const plan = place(
      parseScreenplay(readFileSync(screenplayPath, 'utf8')),
      parseTake(readFileSync(takePath, 'utf8')),
      parseNarrationTake(readFileSync(narrPath, 'utf8')),
    );
    console.log(formatReport(plan));
    const out = flag(argv, '--out');
    if (out && plan.ok) { mkdirSync(dirname(out) || '.', { recursive: true }); writeFileSync(out, JSON.stringify(plan, null, 2)); console.log(`\nwrote ${out}`); }
    return plan.ok ? 0 : 1;
  }

  if (argv.includes('--mix')) {
    const plan = JSON.parse(readFileSync(positional[0], 'utf8'));
    const video = flag(argv, '--video') ?? fail('--mix needs --video <render.mp4>');
    const out = flag(argv, '--out') ?? fail('--mix needs --out <narrated.mp4>');
    if (!existsSync(video)) fail(`${video} does not exist; mix the narration onto a render that was already made`);
    console.log(['ffmpeg', ...buildMixArgs(plan, { video, out })].map((a) => (/[\s;'"\[\]]/.test(a) ? `"${a}"` : a)).join(' '));
    return 0;
  }

  usage();
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('demo-narrate.mjs')) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`demo-narrate: ${error.message}`);
    process.exit(1);
  }
}
