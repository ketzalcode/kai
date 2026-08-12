#!/usr/bin/env node
// demo-zoom.mjs -- turn a flat screen recording into a focused one.
//
// Why this exists
// ---------------
// A demo recorded at full screen size is unreadable when embedded in a README
// or a release note: the thing the viewer is supposed to look at occupies a
// few percent of the frame. Commercial recorders solve this by zooming toward
// the cursor. A terminal has no cursor to follow, so this tool takes the
// opposite approach: the director *declares* what matters and when, and this
// script renders that declaration.
//
// Why a declared plan rather than detection
// -----------------------------------------
// Detecting "the interesting region" from pixels is a research problem with a
// failure mode that is worse than useless -- it zooms confidently onto the
// wrong thing. A plan is auditable, reviewable, diffable, and wrong in ways a
// human can see before rendering.
//
// Why one zoompan rather than concat of segments
// ----------------------------------------------
// Cutting the video into segments and re-encoding each one produces visible
// seams and drifts audio. A single expression-driven filter keeps one
// continuous encode, so there is nothing to resynchronise.
//
// Why the weight is a min() of two ramps
// --------------------------------------
// Each focus segment contributes weight 0 outside itself and 1 in its middle,
// easing in and out with a smoothstep. Because segments may not overlap, the
// total is a plain sum -- no nested conditionals, and the zoom curve is
// continuous, so the camera cannot jump between values. Pixel positions are
// still whole numbers, so this says nothing about how a slow pan looks; the
// crop is computed on a supersampled frame to halve that step size.
//
// This script writes nothing except its output file, shells out through an
// argv array (never a shell string), and uses Node built-ins only.

import { spawn, spawnSync } from 'node:child_process';
import { readFileSync, existsSync, mkdtempSync, rmSync, readFileSync as read } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const MAX_ZOOM = 10;
const MAX_FPS = 240;
const MAX_SEGMENTS = 200;

// ---------------------------------------------------------------- validation

function fail(message) {
  throw new Error(message);
}

function num(value, label) {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    fail(`${label} must be a finite number, got ${JSON.stringify(value)}`);
  }
  return value;
}

function safePath(value, label) {
  if (typeof value !== 'string' || value.length === 0) fail(`${label} is required`);
  if (value.startsWith('-')) fail(`${label} may not start with "-" (it would be read as an ffmpeg option)`);
  if (/[\r\n\0]/.test(value)) fail(`${label} may not contain newlines or nulls`);
  return value;
}

function parseSize(value) {
  const match = /^(\d{2,5})x(\d{2,5})$/.exec(String(value));
  if (!match) fail(`size must look like 1280x720, got ${JSON.stringify(value)}`);
  const w = Number(match[1]);
  const h = Number(match[2]);
  if (w < 16 || h < 16) fail(`size ${value} is too small to encode; use at least 16x16`);
  if (w % 2 !== 0 || h % 2 !== 0) fail(`size ${value} must have even dimensions; most encoders reject odd ones`);
  return { w, h, text: `${w}x${h}` };
}

// A plan is only useful if it is wrong loudly. Every rule below exists because
// the alternative is a render that succeeds and looks subtly broken.
export function parsePlan(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`plan is not valid JSON: ${error.message}`);
  }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) fail('plan must be a JSON object');

  const source = safePath(raw.source, 'source');
  const output = safePath(raw.output, 'output');
  if (source === output) fail('source and output must differ; rendering over the input would destroy it');

  const fps = num(raw.fps === undefined ? 30 : raw.fps, 'fps');
  if (fps < 1 || fps > MAX_FPS) fail(`fps must be between 1 and ${MAX_FPS}`);

  const size = parseSize(raw.size === undefined ? '1280x720' : raw.size);

  if (!Array.isArray(raw.focus)) fail('plan needs a "focus" array (it may be empty)');
  if (raw.focus.length > MAX_SEGMENTS) fail(`too many focus segments (limit ${MAX_SEGMENTS})`);

  const focus = raw.focus.map((segment, index) => {
    const at = `focus[${index}]`;
    if (!segment || typeof segment !== 'object' || Array.isArray(segment)) fail(`${at} must be an object`);
    const start = num(segment.start, `${at}.start`);
    const end = num(segment.end, `${at}.end`);
    if (start < 0) fail(`${at}.start may not be negative`);
    if (end <= start) fail(`${at}.end must be greater than start`);
    const x = num(segment.x, `${at}.x`);
    const y = num(segment.y, `${at}.y`);
    if (x < 0 || x > 1 || y < 0 || y > 1) fail(`${at}.x and .y are fractions of the frame and must be within 0..1`);
    const zoom = num(segment.zoom === undefined ? 2 : segment.zoom, `${at}.zoom`);
    if (zoom < 1) fail(`${at}.zoom may not be below 1; 1 means no zoom`);
    if (zoom > MAX_ZOOM) fail(`${at}.zoom above ${MAX_ZOOM} magnifies past the source resolution`);
    const ease = num(segment.ease === undefined ? 0.4 : segment.ease, `${at}.ease`);
    if (ease < 0) fail(`${at}.ease may not be negative`);
    if (ease * 2 > end - start) {
      fail(`${at}.ease of ${ease}s does not fit twice inside a ${(end - start).toFixed(2)}s segment; the zoom would never reach ${zoom}x`);
    }
    const label = segment.label === undefined ? '' : String(segment.label);
    if (/[\r\n]/.test(label)) fail(`${at}.label must be a single line`);
    return { start, end, x, y, zoom, ease, label };
  });

  const ordered = [...focus].sort((a, b) => a.start - b.start);
  for (let i = 1; i < ordered.length; i += 1) {
    if (ordered[i].start < ordered[i - 1].end) {
      fail(`focus segments overlap (${ordered[i - 1].start}-${ordered[i - 1].end} and ${ordered[i].start}-${ordered[i].end}); the camera cannot be in two places at once`);
    }
  }

  return {
    source,
    output,
    fps,
    size,
    focus: ordered,
    crf: (() => {
      const crf = raw.crf === undefined ? 18 : num(raw.crf, 'crf');
      if (crf < 0 || crf > 51) fail('crf must be within 0..51, the range libx264 accepts');
      return crf;
    })(),
  };
}

// ------------------------------------------------------------- numeric model
// Mirrors what the filter expression computes. Used by the tests to reason
// about the curve, and by --explain to describe the render in plain numbers.

function smoothstep(u) {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
}

export function weightAt(segment, t) {
  if (t < segment.start || t >= segment.end) return 0;
  if (segment.ease === 0) return 1;
  return Math.min(
    smoothstep((t - segment.start) / segment.ease),
    smoothstep((segment.end - t) / segment.ease),
  );
}

export function zoomAt(plan, t) {
  return plan.focus.reduce((total, segment) => total + (segment.zoom - 1) * weightAt(segment, t), 1);
}

export function centerAt(plan, t) {
  return plan.focus.reduce(
    (acc, segment) => {
      const w = weightAt(segment, t);
      return { x: acc.x + (segment.x - 0.5) * w, y: acc.y + (segment.y - 0.5) * w };
    },
    { x: 0.5, y: 0.5 },
  );
}

// ------------------------------------------------------------- filter graph

const f = (n) => {
  const s = Number(n).toFixed(6);
  return s.replace(/0+$/, '').replace(/\.$/, '');
};

// Why the interval is half-open
// -----------------------------
// Segments are allowed to touch. If both endpoints were inclusive, two
// touching segments would both be fully active for the instant they share,
// and their weights would add: a 2x segment meeting a 3x segment would show
// 4x for one frame. Treating the end as exclusive means a segment has been
// released by the time the next one begins.
function weightExpr(segment, T) {
  const inside = `gte(${T},${f(segment.start)})*lt(${T},${f(segment.end)})`;
  if (segment.ease === 0) return inside;
  const rampIn = `clip((${T}-${f(segment.start)})/${f(segment.ease)},0,1)`;
  const rampOut = `clip((${f(segment.end)}-${T})/${f(segment.ease)},0,1)`;
  const ss = (u) => `(${u})*(${u})*(3-2*(${u}))`;
  return `${inside}*min(${ss(rampIn)},${ss(rampOut)})`;
}

// Why the stream is normalised before the zoom
// --------------------------------------------
// The filter's clock is the output frame index divided by the frame rate, so
// it only tells the truth if the stream entering the zoom really runs at that
// rate. Measured: a 60fps source against a plan declaring 30fps put a segment
// marked 2s-6s onto source seconds 1-3, because the frame index advanced twice
// per second of plan time. Forcing the rate first makes the clock true, and
// also flattens a variable-rate recording, which screen recorders commonly
// produce. Scaling and padding to the declared size in the same prefix means a
// focus point is a fraction of a frame whose dimensions are known, so the same
// coordinates hold whatever the source resolution was.
export function normalizePrefix(plan, factor = 1) {
  const w = plan.size.w * factor;
  const h = plan.size.h * factor;
  return [
    `fps=${f(plan.fps)}`,
    `scale=${w}:${h}:force_original_aspect_ratio=decrease`,
    `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`,
    'setsar=1',
  ].join(',');
}

// The crop origin is a whole number of pixels of whatever frame the zoom reads
// from. Working on a frame twice the output size therefore halves the smallest
// possible step: a slow pan moves in half-output-pixel increments rather than
// whole ones. This is arithmetic, not a claim about how it looks.
const SUPERSAMPLE = 2;

// A filter is passed to ffmpeg as one command-line argument, and Windows caps
// a command line near 32767 characters. A plan can be well-formed and still
// build an expression too long to hand over, so the length is checked rather
// than the segment count, which is only a proxy for it.
const MAX_FILTER_CHARS = 8000;

export function buildFilter(plan) {
  // zoompan exposes no wall-clock variable on every build in the wild, but it
  // always exposes the output frame index, and this filter emits exactly one
  // output frame per input frame. Frame index over fps is therefore the most
  // portable clock available here.
  const T = `(on/${f(plan.fps)})`;

  if (plan.focus.length === 0) {
    // Nothing to focus on. Still normalise size and rate so the output of this
    // tool is predictable whether or not a plan has segments yet.
    return normalizePrefix(plan);
  }

  const terms = plan.focus.map((segment) => `(${f(segment.zoom - 1)})*(${weightExpr(segment, T)})`);
  const z = `1+${terms.join('+')}`;

  const cx = `0.5+${plan.focus.map((s) => `(${f(s.x - 0.5)})*(${weightExpr(s, T)})`).join('+')}`;
  const cy = `0.5+${plan.focus.map((s) => `(${f(s.y - 0.5)})*(${weightExpr(s, T)})`).join('+')}`;

  // Crop origin, clamped inside the frame so a focus point near an edge pans
  // as far as it can rather than showing padding. The consequence is that a
  // point close to an edge cannot reach the centre of the shot; --explain
  // reports where the shot actually lands.
  const x = `clip((${cx})*iw-(iw/zoom)/2,0,iw-iw/zoom)`;
  const y = `clip((${cy})*ih-(ih/zoom)/2,0,ih-ih/zoom)`;

  const filter = `${normalizePrefix(plan, SUPERSAMPLE)},`
    + `zoompan=z='${z}':x='${x}':y='${y}':d=1:s=${plan.size.text}:fps=${f(plan.fps)}`;

  if (filter.length > MAX_FILTER_CHARS) {
    fail(`this plan builds a ${filter.length}-character filter from ${plan.focus.length} segments, past the ${MAX_FILTER_CHARS} this tool will hand to ffmpeg on one command line. Split the demo into shorter renders.`);
  }
  return filter;
}

export function buildArgs(plan) {
  return [
    '-y',
    '-i', plan.source,
    '-vf', buildFilter(plan),
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', String(plan.crf),
    '-pix_fmt', 'yuv420p',
    '-map', '0:v:0',
    '-map', '0:a?',
    // Re-encoded rather than copied: a stream copy fails outright when the
    // source codec cannot live in the output container, and a demo is not
    // worth losing to that.
    '-c:a', 'aac',
    '-b:a', '192k',
    plan.output,
  ];
}

// argv joined by spaces is not a command. Paths contain spaces and the filter
// contains parentheses and quotes, both of which a shell would eat.
export function quoteArg(arg) {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(arg)) return arg;
  return `"${arg.replace(/(["\\$`])/g, '\\$1')}"`;
}

export function printable(plan) {
  return ['ffmpeg', ...buildArgs(plan)].map(quoteArg).join(' ');
}

// ------------------------------------------------------------------ explain

// Where a shot actually lands. A focus point near an edge cannot be centred,
// because centring it would show padding beyond the frame, so the crop stops
// at the edge and the declared point sits off-centre. Reporting this is the
// difference between a coordinate being a target and a coordinate being a lie.
export function effectiveCenter(x, zoom) {
  const half = 1 / (2 * zoom);
  return Math.min(1 - half, Math.max(half, x));
}

// Duration of a source, when ffprobe is available to say. Returns null when it
// cannot be determined, which is reported as unknown rather than assumed fine.
export function probeDuration(source) {
  const run = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration',
    '-of', 'default=noprint_wrappers=1:nokey=1', source,
  ], { encoding: 'utf8' });
  if (run.error || run.status !== 0) return null;
  const seconds = Number(String(run.stdout).trim());
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}

export function overrunning(plan, duration) {
  if (duration === null) return [];
  return plan.focus.filter((s) => s.start >= duration || s.end > duration + 0.001);
}

export function explain(plan, duration = null) {
  const lines = [];
  lines.push(`source ${plan.source}`);
  lines.push(`output ${plan.output}  ${plan.size.text} @ ${plan.fps}fps  crf ${plan.crf}`);
  if (duration !== null) lines.push(`source runs ${duration.toFixed(2)}s`);
  else lines.push('source duration unknown (ffprobe did not report it)');
  if (plan.focus.length === 0) {
    lines.push('no focus segments: the render only normalises size and frame rate');
    return lines.join('\n');
  }
  lines.push('');
  lines.push('  start     end   zoom   ease  asked for    lands on     label');
  for (const s of plan.focus) {
    const asked = `${s.x.toFixed(2)},${s.y.toFixed(2)}`;
    const lands = `${effectiveCenter(s.x, s.zoom).toFixed(2)},${effectiveCenter(s.y, s.zoom).toFixed(2)}`;
    lines.push(
      `${String(s.start.toFixed(2)).padStart(7)} ${String(s.end.toFixed(2)).padStart(7)}` +
      `${(`${s.zoom}x`).padStart(7)}${(`${s.ease}s`).padStart(7)}   ${asked.padEnd(12)} ${lands.padEnd(12)} ${s.label}`,
    );
  }
  const clamped = plan.focus.filter((s) => effectiveCenter(s.x, s.zoom) !== s.x || effectiveCenter(s.y, s.zoom) !== s.y);
  const held = plan.focus.reduce((total, s) => total + (s.end - s.start), 0);
  lines.push('');
  lines.push(`${plan.focus.length} segment(s), ${held.toFixed(1)}s under zoom`);
  if (clamped.length > 0) {
    lines.push(`${clamped.length} segment(s) sit too close to an edge to be centred; the shot stops at the frame and the point lands off-centre, as shown above`);
  }
  const past = overrunning(plan, duration);
  if (past.length > 0) {
    lines.push(`${past.length} segment(s) run past the end of the source; ffmpeg would simply stop there`);
  }
  return lines.join('\n');
}

const EXAMPLE = `{
  "source": "demo.mp4",
  "output": "demo-focused.mp4",
  "size": "1280x720",
  "fps": 30,
  "focus": [
    { "start": 2.0, "end": 7.5, "x": 0.30, "y": 0.22, "zoom": 2.2, "ease": 0.5,
      "label": "the command being typed" },
    { "start": 9.0, "end": 14.0, "x": 0.50, "y": 0.70, "zoom": 1.8, "ease": 0.5,
      "label": "the output table" }
  ]
}
`;

// -------------------------------------------------------------------- render

function findFfmpeg() {
  const probe = spawnSync('ffmpeg', ['-version'], { encoding: 'utf8' });
  return !probe.error && probe.status === 0;
}

function render(plan) {
  if (!existsSync(plan.source)) {
    console.error(`demo-zoom: source not found: ${plan.source}`);
    return 1;
  }
  if (!findFfmpeg()) {
    console.error('demo-zoom: ffmpeg is not on PATH. Install it, or use --print and run the command yourself.');
    return 1;
  }
  let args;
  try {
    args = buildArgs(plan);
  } catch (error) {
    console.error(`demo-zoom: ${error.message}`);
    return 1;
  }
  console.log(explain(plan, probeDuration(plan.source)));
  console.log('');
  console.log('rendering...');
  return new Promise((resolve) => {
    const child = spawn('ffmpeg', args, { stdio: ['ignore', 'inherit', 'inherit'] });
    child.on('error', (error) => {
      console.error(`demo-zoom: could not run ffmpeg: ${error.message}`);
      resolve(1);
    });
    child.on('close', (code) => {
      if (code === 0) console.log(`\nwrote ${plan.output}`);
      resolve(code === 0 ? 0 : 1);
    });
  });
}

// ---------------------------------------------------------------- self-test

let checks = 0;
function ok(condition, label) {
  checks += 1;
  if (!condition) {
    console.error(`x ${label}`);
    process.exitCode = 1;
    throw new Error(`self-test failed: ${label}`);
  }
  console.log(`  ok ${label}`);
}

function rejects(text, fragment, label) {
  let message = '';
  try {
    parsePlan(text);
  } catch (error) {
    message = error.message;
  }
  ok(message.includes(fragment), `${label} (said: ${message || 'nothing, which is the bug'})`);
}

const VALID = JSON.stringify({
  source: 'a.mp4',
  output: 'b.mp4',
  focus: [{ start: 2, end: 6, x: 0.7, y: 0.3, zoom: 2.5, ease: 0.5 }],
});

export function selfTest() {
  console.log('demo-zoom self-test');

  const plan = parsePlan(VALID);
  ok(plan.focus.length === 1, 'a valid plan parses');
  ok(plan.size.text === '1280x720' && plan.fps === 30, 'size and rate have defaults');

  rejects('{ not json', 'not valid JSON', 'a malformed plan names the parse error');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'a.mp4', focus: [] }),
    'must differ', 'rendering over the source is refused');
  rejects(JSON.stringify({ source: '-i evil', output: 'b.mp4', focus: [] }),
    'read as an ffmpeg option', 'a path that would smuggle an option is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4' }),
    'focus', 'a missing focus list is refused rather than assumed');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [{ start: 5, end: 2, x: 0.5, y: 0.5 }] }),
    'greater than start', 'a segment that ends before it starts is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [{ start: 0, end: 2, x: 1.4, y: 0.5 }] }),
    'within 0..1', 'a focus point outside the frame is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [{ start: 0, end: 2, x: 0.5, y: 0.5, zoom: 0.5 }] }),
    'may not be below 1', 'a zoom that shrinks the frame is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [{ start: 0, end: 1, x: 0.5, y: 0.5, ease: 0.9 }] }),
    'never reach', 'an ease too long for its segment is refused, with the reason');
  rejects(JSON.stringify({
    source: 'a.mp4', output: 'b.mp4',
    focus: [{ start: 0, end: 5, x: 0.5, y: 0.5 }, { start: 3, end: 8, x: 0.5, y: 0.5 }],
  }), 'two places at once', 'overlapping segments are refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', size: '1281x721', focus: [] }),
    'even dimensions', 'an odd output size is refused before the encoder rejects it');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', fps: 0, focus: [] }),
    'fps must be', 'a zero frame rate is refused');

  // The curve itself.
  const s = plan.focus[0];
  ok(weightAt(s, 1.99) === 0, 'the camera is untouched before a segment begins');
  ok(weightAt(s, 6.01) === 0, 'the camera is released after a segment ends');
  ok(weightAt(s, 2) === 0 && weightAt(s, 6) === 0, 'weight is zero exactly at both edges, so there is no jump');
  ok(Math.abs(weightAt(s, 4) - 1) < 1e-9, 'weight reaches a full 1 in the middle');
  ok(Math.abs(zoomAt(plan, 4) - 2.5) < 1e-9, 'zoom reaches the requested factor');
  ok(Math.abs(zoomAt(plan, 0) - 1) < 1e-9, 'zoom rests at 1 outside every segment');
  const monotonic = [2.1, 2.2, 2.3, 2.4, 2.5].map((t) => zoomAt(plan, t));
  ok(monotonic.every((v, i) => i === 0 || v > monotonic[i - 1]), 'the ramp is monotonic, so the zoom never stutters');
  const c = centerAt(plan, 4);
  ok(Math.abs(c.x - 0.7) < 1e-9 && Math.abs(c.y - 0.3) < 1e-9, 'the frame centres on the focus point at full zoom');
  const c0 = centerAt(plan, 0);
  ok(c0.x === 0.5 && c0.y === 0.5, 'the frame is centred when nothing is in focus');

  // Continuity: no step larger than a small epsilon anywhere on the timeline.
  let biggest = 0;
  for (let t = 0; t < 8; t += 0.01) {
    biggest = Math.max(biggest, Math.abs(zoomAt(plan, t + 0.01) - zoomAt(plan, t)));
  }
  ok(biggest < 0.05, `the zoom curve is continuous everywhere (largest step ${biggest.toFixed(4)})`);

  // The emitted expression.
  const filter = buildFilter(plan);
  ok(filter.startsWith('fps=30,'), 'the rate is forced before the zoom, so the filter clock matches real time');
  ok(filter.includes('force_original_aspect_ratio=decrease') && filter.includes('pad='),
    'the frame is fitted to the declared size, so a coordinate means the same thing on any source');
  ok(filter.includes('setsar=1'), 'pixels are square before the crop, so a non-square source cannot skew the zoom');
  ok(filter.includes('scale=2560:1440'), 'the zoom reads from a frame twice the output size, halving the smallest crop step');
  ok(filter.includes('s=1280x720'), 'the output size is still the declared one');
  ok(filter.includes('zoompan='), 'the zoom is a single pass, so there are no seams to resynchronise');
  ok(!filter.includes('/2)*2'), 'the crop origin is not coarsened to even pixels, which would enlarge each step rather than smooth it');
  ok(filter.includes('d=1'), 'one output frame per input frame');
  ok(filter.includes('s=1280x720'), 'the output size is pinned in the filter');
  ok(filter.includes('clip('), 'the crop origin is clamped, so a focus point near an edge cannot show padding');
  ok(!/\bif\(/.test(filter), 'the expression is a sum of weights rather than nested conditionals');
  ok(filter.includes('on/30'), 'time is derived from the frame index, the portable clock');

  // Touching segments. The end of an interval is exclusive precisely so two
  // adjacent hard cuts cannot both be active and add their zoom together.
  const touching = parsePlan(JSON.stringify({
    source: 'a.mp4', output: 'b.mp4',
    focus: [
      { start: 0, end: 2, x: 0.5, y: 0.5, zoom: 2, ease: 0 },
      { start: 2, end: 4, x: 0.5, y: 0.5, zoom: 3, ease: 0 },
    ],
  }));
  ok(Math.abs(zoomAt(touching, 2) - 3) < 1e-9,
    'where two hard-cut segments meet, only the second is active (a 2x and a 3x do not add to 4x)');
  ok(Math.abs(zoomAt(touching, 1) - 2) < 1e-9, 'a hard cut holds its own factor for its own span');
  ok(Math.abs(zoomAt(touching, 4) - 1) < 1e-9, 'the last segment releases at its end rather than one frame late');
  ok(buildFilter(touching).includes('gte(') && buildFilter(touching).includes('lt('),
    'the interval is half-open in the emitted expression too, not only in the model');

  // A well-formed plan can still be too large to hand to a process.
  const huge = {
    source: 'a.mp4', output: 'b.mp4',
    focus: Array.from({ length: 120 }, (_, i) => ({ start: i * 2, end: i * 2 + 1.5, x: 0.4, y: 0.6, zoom: 2, ease: 0.3 })),
  };
  let tooLong = '';
  try { buildFilter(parsePlan(JSON.stringify(huge))); } catch (error) { tooLong = error.message; }
  ok(tooLong.includes('command line'),
    'a plan whose filter would exceed what a command line can carry is refused with the reason, not left to fail inside spawn');

  // Clamping is disclosed rather than pretended away.
  ok(Math.abs(effectiveCenter(0.95, 2) - 0.75) < 1e-9, 'a point near an edge lands where the crop can actually reach');
  ok(Math.abs(effectiveCenter(0.5, 2) - 0.5) < 1e-9, 'a point with room to spare lands exactly where it was asked to');
  const edge = parsePlan(JSON.stringify({
    source: 'a.mp4', output: 'b.mp4', focus: [{ start: 0, end: 3, x: 0.95, y: 0.95, zoom: 2, ease: 0.5 }],
  }));
  ok(explain(edge).includes('lands on') && explain(edge).includes('0.75'),
    'the explanation shows where an edge shot really lands, instead of echoing the request back');
  ok(explain(edge).includes('too close to an edge'), 'the explanation says plainly that a shot was clamped');
  ok(explain(edge).includes('duration unknown'), 'an unknown source duration is declared rather than assumed fine');
  ok(explain(edge, 1).includes('past the end'), 'a segment running past the end of the source is called out');
  ok(!explain(edge, 10).includes('past the end'), 'a segment inside the source is not flagged');
  ok(overrunning(edge, null).length === 0, 'without a duration nothing is claimed about overrun either way');

  const empty = parsePlan(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [] }));
  ok(!buildFilter(empty).includes('zoompan'), 'a plan with no focus segments does not pretend to zoom');
  ok(buildFilter(empty).includes('fps='), 'a plan with no focus segments still normalises rate and size');

  const g = gridArgs('in.mp4', 3.5, 'out.png');
  ok(g[g.indexOf('-ss') + 1] === '3.5', 'the grid seeks to the requested time');
  ok(g.some((a) => a.includes('iw/10')), 'the grid rules the frame into tenths, matching the plan coordinates');
  const gridFilter = g[g.indexOf('-vf') + 1];
  ok(gridFilter.includes('force_original_aspect_ratio=decrease') && gridFilter.includes('pad='),
    'the grid is drawn on the same fitted frame the render produces, so measured coordinates transfer');
  ok(gridArgs('in.mp4', 0, 'out.png', '1920x1080')[g.indexOf('-vf') + 1].includes('1920:1080'),
    'the grid follows the declared output size rather than assuming one');
  let gridRefused = '';
  try { gridArgs('in.mp4', -1, 'out.png'); } catch (error) { gridRefused = error.message; }
  ok(gridRefused.includes('at or after zero'), 'a negative grid time is refused');

  const args = buildArgs(plan);
  ok(Array.isArray(args) && args.every((a) => typeof a === 'string'), 'ffmpeg is given an argv array, never a shell string');
  ok(args[args.length - 1] === 'b.mp4', 'the output path is the final argument');
  ok(args.includes('0:a?'), 'audio is carried through when present and not demanded when absent');
  ok(args.includes('aac'), 'audio is re-encoded rather than copied, which would fail on a container the codec cannot enter');

  const spaced = parsePlan(JSON.stringify({
    source: 'my clips/a b.mp4', output: 'out dir/c.mp4',
    focus: [{ start: 0, end: 3, x: 0.5, y: 0.5 }],
  }));
  const printed = printable(spaced);
  ok(printed.includes('"my clips/a b.mp4"'), 'a path with a space survives --print as one argument');
  ok(/-vf "/.test(printed), 'the filter is quoted in --print, so a shell cannot eat its parentheses');
  ok(quoteArg('simple.mp4') === 'simple.mp4', 'an ordinary path is not needlessly quoted');

  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', size: '00x00', focus: [] }),
    'too small', 'a zero-sized output is refused rather than failing inside the encoder');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', fps: 0.0000001, focus: [] }),
    'fps must be', 'a frame rate that would round to zero is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', crf: 100, focus: [] }),
    '0..51', 'a quality setting libx264 would reject is refused here, where the message is readable');

  const many = parsePlan(JSON.stringify({
    source: 'a.mp4', output: 'b.mp4',
    focus: [
      { start: 0, end: 3, x: 0.2, y: 0.2, zoom: 2, ease: 0.3 },
      { start: 5, end: 9, x: 0.8, y: 0.9, zoom: 3, ease: 0.3 },
    ],
  }));
  ok(Math.abs(zoomAt(many, 4) - 1) < 1e-9, 'the camera fully releases between two segments');
  ok(Math.abs(zoomAt(many, 7) - 3) < 1e-9, 'the second segment reaches its own factor independently');
  ok(explain(many).includes('2 segment(s)'), 'the explanation counts what will actually be rendered');

  console.log(`demo-zoom self-test: ${checks} checks passed`);
  return true;
}

// -------------------------------------------------------------------- grid
// Authoring a plan means naming a point as a fraction of the frame, which
// nobody can eyeball from a video player. This lifts one frame out of the
// recording and rules it into tenths, so the director reads coordinates off
// the picture instead of guessing and re-rendering.

export function gridArgs(source, at, out, size = '1280x720') {
  safePath(source, 'source');
  safePath(out, 'out');
  if (!Number.isFinite(at) || at < 0) fail('--at must be a time in seconds, at or after zero');
  const parsed = parseSize(size);
  // The same scale and pad the render applies, so a coordinate counted off
  // this picture means the same thing at render time. Without it, a source
  // whose shape differs from the output would be measured in one frame and
  // rendered in another.
  const shape = `scale=${parsed.w}:${parsed.h}:force_original_aspect_ratio=decrease,`
    + `pad=${parsed.w}:${parsed.h}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
  return [
    '-y', '-loglevel', 'error',
    '-ss', String(at),
    '-i', source,
    '-vf', `${shape},drawgrid=w=iw/10:h=ih/10:t=1:c=cyan@0.7,drawgrid=w=iw/2:h=ih/2:t=2:c=yellow@0.9`,
    '-frames:v', '1',
    out,
  ];
}

function grid(argv) {
  const source = argv[argv.indexOf('--grid') + 1];
  const atIndex = argv.indexOf('--at');
  const at = atIndex === -1 ? 0 : Number(argv[atIndex + 1]);
  const outIndex = argv.indexOf('--out');
  const out = outIndex === -1 ? 'demo-grid.png' : argv[outIndex + 1];
  const sizeIndex = argv.indexOf('--size');
  const planIndex = argv.indexOf('--plan');
  let size = sizeIndex === -1 ? '1280x720' : argv[sizeIndex + 1];
  // A plan already states the size. Taking it from there removes the chance of
  // measuring against one shape and rendering into another. An explicitly
  // named plan that cannot be read is an error, not something to shrug at: the
  // fallback would silently produce coordinates for a different frame.
  if (planIndex !== -1) {
    const planPath = argv[planIndex + 1];
    if (!planPath || !existsSync(planPath)) {
      console.error(`demo-zoom: plan not found: ${planPath || '(missing argument)'}`);
      return 1;
    }
    try {
      size = parsePlan(readFileSync(planPath, 'utf8')).size.text;
    } catch (error) {
      console.error(`demo-zoom: ${error.message}`);
      console.error('The grid must match the size the render will use, so this is fatal rather than a fallback.');
      return 1;
    }
  }
  if (!source) {
    console.error('demo-zoom: --grid <video> is required');
    return 1;
  }
  if (!existsSync(source)) {
    console.error(`demo-zoom: video not found: ${source}`);
    return 1;
  }
  if (!findFfmpeg()) {
    console.error('demo-zoom: ffmpeg is not on PATH.');
    return 1;
  }
  let args;
  try {
    args = gridArgs(source, at, out, size);
  } catch (error) {
    console.error(`demo-zoom: ${error.message}`);
    return 1;
  }
  const run = spawnSync('ffmpeg', args, { encoding: 'utf8' });
  if (run.status !== 0) {
    console.error(`demo-zoom: could not extract the frame:\n${run.stderr}`);
    return 1;
  }
  console.log(`wrote ${out} -- the frame at ${at}s, ruled into tenths.`);
  console.log('Each cyan cell is 0.1 wide and 0.1 tall. The yellow lines mark 0.5.');
  console.log('Count cells from the top left to read the x and y for a focus segment.');
  return 0;
}

// ----------------------------------------------------------------- verify
// The self-test proves the arithmetic. Only ffmpeg can prove the render, so
// this renders a frame with a marker at a known point and reads the pixel
// back. Requires ffmpeg; skipped where it is absent.

function verify() {
  if (!findFfmpeg()) {
    console.log('demo-zoom verify: ffmpeg absent, skipping');
    return 0;
  }
  const dir = mkdtempSync(join(tmpdir(), 'demo-zoom-'));
  try {
    // Three fixtures: the declared rate, double it, and a variable-rate file.
    // The second is the regression guard -- before the rate was forced, a
    // 60fps source put a segment marked 2s-6s onto source seconds 1-3. The
    // third is the case screen recorders actually produce, where frames arrive
    // only when the screen changes.
    for (const rate of ['30', '60', 'vfr']) {
      const marker = join(dir, `marker-${rate}.mp4`);
      const px = join(dir, `px-${rate}.raw`);
      // A black frame with one red square whose centre sits at 0.7, 0.3.
      const mkArgs = ['-y', '-loglevel', 'error',
        '-f', 'lavfi', '-i', 'color=c=black:size=1280x720:rate=30:duration=6'];
      if (rate === 'vfr') {
        // Keep an irregular subset of frames and preserve their original
        // timestamps, which is what a screen recorder produces when it only
        // emits a frame once the screen changes. Measured on the fixture:
        // 52 frames across 5.9s, with gaps alternating between 0.033s and 0.2s.
        mkArgs.push('-vf', 'drawbox=x=876:y=196:w=40:h=40:color=red:t=fill,select=lt(mod(n\\,7)\\,2)',
          '-fps_mode', 'passthrough');
      } else {
        mkArgs.push('-vf', 'drawbox=x=876:y=196:w=40:h=40:color=red:t=fill', '-r', String(rate));
      }
      const mk = spawnSync('ffmpeg', [...mkArgs, marker], { encoding: 'utf8' });
      if (mk.status !== 0) {
        console.error(`demo-zoom verify: could not build the ${rate} fixture: ${mk.stderr}`);
        return 1;
      }
      const plan = parsePlan(JSON.stringify({
        source: marker, output: join(dir, `out-${rate}.mp4`), fps: 30,
        focus: [{ start: 2, end: 6, x: 0.7, y: 0.3, zoom: 2.5, ease: 0.5 }],
      }));
      const sample = spawnSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', marker,
        '-vf', `${buildFilter(plan)},crop=w=2:h=2:x=639:y=359,format=rgb24`,
        '-f', 'rawvideo', px], { encoding: 'utf8' });
      if (sample.status !== 0) {
        console.error(`demo-zoom verify: the filter was rejected by ffmpeg:\n${sample.stderr}`);
        return 1;
      }
      const bytes = read(px);
      // The stream is normalised to the declared 30fps, so frame index is
      // simply seconds times 30 whatever the source rate was.
      const at = (second) => {
        const i = Math.round(second * 30) * 12;
        return [bytes[i], bytes[i + 1], bytes[i + 2]];
      };
      const before = at(0);
      const during = at(5);
      const frames = bytes.length / 12;
      const red = during[0] > 200 && during[1] < 60 && during[2] < 60;
      const black = before[0] < 40 && before[1] < 40 && before[2] < 40;
      console.log(`  ${rate} source -> ${frames} frames at 30fps`);
      console.log(`    centre at 0.0s: rgb(${before}) -- expected black, the marker is off-centre`);
      console.log(`    centre at 5.0s: rgb(${during}) -- expected red, the marker fills the frame`);
      // The variable-rate fixture drops its trailing frames, so it is short of
      // a full six seconds by design; the point it proves is the timing of the
      // zoom, not the length of the file.
      const expected = rate === 'vfr' ? 170 : 180;
      if (frames < expected) {
        console.error(`demo-zoom verify: expected at least ${expected} output frames at 30fps, got ${frames}`);
        return 1;
      }
      if (!black || !red) {
        console.error(`demo-zoom verify: the ${rate} render did not land on the declared focus point at the declared time`);
        return 1;
      }
    }
    console.log('demo-zoom verify: the render centres on the declared point, at the declared time, from a 30fps, a 60fps, and a variable-rate source');
    return 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

// --------------------------------------------------------------------- cli

function usage() {
  console.log(`demo-zoom -- render a focused demo from a declared focus plan

  node demo-zoom.mjs --plan <file>            render it (needs ffmpeg)
  node demo-zoom.mjs --plan <file> --print    print the ffmpeg command instead
  node demo-zoom.mjs --plan <file> --explain  describe the render in plain numbers
  node demo-zoom.mjs --grid <video> --at 3.5 [--plan <file> | --size 1920x1080]
                                              lift out that frame, ruled into
                                              tenths, fitted the way the render
                                              will fit it
  node demo-zoom.mjs --example                print a starter plan
  node demo-zoom.mjs --self-test              check the arithmetic, no ffmpeg needed
  node demo-zoom.mjs --verify                 prove a real render lands on target

A plan declares what the viewer should look at and when. Coordinates are
fractions of the frame: 0,0 is the top left and 1,1 the bottom right. They are
targets: a point close to an edge cannot be centred without showing padding, so
the shot stops at the edge. --explain reports where each shot really lands.`);
}

async function main(argv) {
  if (argv.includes('--self-test')) {
    selfTest();
    return 0;
  }
  if (argv.includes('--verify')) return verify();
  if (argv.includes('--grid')) return grid(argv);
  if (argv.includes('--example')) {
    process.stdout.write(EXAMPLE);
    return 0;
  }
  if (argv.length === 0 || argv.includes('--help') || argv.includes('-h')) {
    usage();
    return argv.length === 0 ? 1 : 0;
  }

  const i = argv.indexOf('--plan');
  if (i === -1 || !argv[i + 1]) {
    console.error('demo-zoom: --plan <file> is required');
    return 1;
  }
  const file = argv[i + 1];
  if (!existsSync(file)) {
    console.error(`demo-zoom: plan not found: ${file}`);
    return 1;
  }

  let plan;
  try {
    plan = parsePlan(readFileSync(file, 'utf8'));
  } catch (error) {
    console.error(`demo-zoom: ${error.message}`);
    return 1;
  }

  if (argv.includes('--explain')) {
    console.log(explain(plan, existsSync(plan.source) ? probeDuration(plan.source) : null));
    return 0;
  }
  if (argv.includes('--print')) {
    try {
      console.log(printable(plan));
    } catch (error) {
      console.error(`demo-zoom: ${error.message}`);
      return 1;
    }
    return 0;
  }
  return render(plan);
}

const invoked = process.argv[1] && process.argv[1].endsWith('demo-zoom.mjs');
if (invoked) {
  main(process.argv.slice(2)).then((code) => { process.exitCode = code; });
}
