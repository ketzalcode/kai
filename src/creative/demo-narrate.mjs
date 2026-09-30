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

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseScreenplay, parseTake } from './demo-capture.mjs';

export const TAKE_SCHEMA = 'kai.demo-narration-take/v1';
const PLAN_SCHEMA = 'kai.demo-narration-plan/v1';
const PLUGIN_ROOT = dirname(dirname(fileURLToPath(import.meta.url)));

// Silence between beats. Speech that butts straight onto the previous line reads
// as one run-on sentence; this is the smallest pause that still sounds authored.
export const MIN_GAP = 0.25;

// 130 words per minute is the middle of the range measured for explainer
// narration. It is used only to turn "this line is 1.8 seconds too long" into
// "cut about four words", which is the form an author can act on.
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

function wordCount(text) {
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

// -------------------------------------------------------------------- cli

function usage() {
  console.log(`demo-narrate — place measured speech against a measured recording

  --place      <screenplay.json> <take.json> <narration_take.json> [--out plan.json]
      Lay the beats against the measured recording, or refuse and say why.

  --mix        <plan.json> --video <render.mp4> --out <narrated.mp4>
      Print the ffmpeg command that lays the placed clips onto the finished video.
`);
}

function flag(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

function main(argv) {
  const positional = argv.filter((a, i) => !a.startsWith('-') && !argv[i - 1]?.startsWith('--out') && !argv[i - 1]?.startsWith('--video'));

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