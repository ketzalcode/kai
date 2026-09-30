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
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readFileSync as read } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { parseScreenplay, parseTake } from './demo-capture.mjs';
import { cursorPng } from './lib/cursor-png.mjs';

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
    cursor: parseCursor(raw.cursor),
    crf: (() => {
      const crf = raw.crf === undefined ? 18 : num(raw.crf, 'crf');
      if (crf < 0 || crf > 51) fail('crf must be within 0..51, the range libx264 accepts');
      return crf;
    })(),
  };
}

// A cursor track is a list of measured samples, not a path to invent between.
// Each sample is a normalised position the pointer was actually at, at a
// measured second. The renderer interpolates linearly between consecutive
// samples, which is exact only because the driver moves the real pointer
// linearly in time -- so the drawn arrow retraces the path the application
// actually saw, rather than a plausible-looking curve it never received.
export function parseCursor(raw) {
  if (raw === undefined || raw === null) return null;
  if (!Array.isArray(raw.track) || raw.track.length === 0) {
    fail('cursor.track must list at least one measured sample; a cursor cannot be drawn from nothing');
  }
  const track = raw.track.map((sample, i) => {
    const at = `cursor.track[${i}]`;
    const t = num(sample.t, `${at}.t`);
    if (t < 0) fail(`${at}.t must not be negative`);
    const x = num(sample.x, `${at}.x`);
    const y = num(sample.y, `${at}.y`);
    if (x < 0 || x > 1 || y < 0 || y > 1) {
      fail(`${at} is outside the frame (${x}, ${y}); positions are fractions of the source frame`);
    }
    return { t, x, y, visible: sample.visible !== false };
  });
  for (let i = 1; i < track.length; i += 1) {
    if (track[i].t < track[i - 1].t) fail(`cursor.track[${i}] goes backwards in time; samples must be ordered`);
  }
  const clicks = (raw.clicks ?? []).map((c, i) => num(c, `cursor.clicks[${i}]`));
  return { track, clicks, scale: raw.scale === undefined ? 2.2 : num(raw.scale, 'cursor.scale') };
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

// A piecewise-linear expression over measured samples. Held flat before the
// first sample and after the last, so the arrow never flies in from a corner.
function trackExpr(track, key) {
  let expr = f(track[track.length - 1][key]);
  for (let i = track.length - 1; i > 0; i -= 1) {
    const a = track[i - 1];
    const b = track[i];
    const span = b.t - a.t;
    const at = span <= 0
      ? f(b[key])
      : `(${f(a[key])}+(${f(b[key] - a[key])})*(t-${f(a.t)})/${f(span)})`;
    expr = `if(lt(t,${f(b.t)}),${at},${expr})`;
  }
  return `if(lt(t,${f(track[0].t)}),${f(track[0][key])},${expr})`;
}

// Where the arrow lands in the finished frame.
//
// Drawing it before the zoom would be simpler and is wrong: the arrow would be
// magnified with everything else, so its size would change shot to shot, its
// edges would blur under the same interpolation as the pixels, and it would be
// clipped by the crop. Instead the measured source position is pushed through
// the crop the zoom is performing, and a constant-size arrow is drawn in output
// space.
//
// The crop origin in normalised terms is the same clip() the zoom uses, so the
// two cannot drift: a point at source fraction u lands at (u - X) * zoom * W.
export function cursorOverlay(plan) {
  const c = plan.cursor;
  if (!c) return null;
  const T = 't';
  const z = plan.focus.length === 0
    ? '1'
    : `(1+${plan.focus.map((s) => `(${f(s.zoom - 1)})*(${weightExpr(s, T)})`).join('+')})`;
  const cx = plan.focus.length === 0
    ? '0.5'
    : `(0.5+${plan.focus.map((s) => `(${f(s.x - 0.5)})*(${weightExpr(s, T)})`).join('+')})`;
  const cy = plan.focus.length === 0
    ? '0.5'
    : `(0.5+${plan.focus.map((s) => `(${f(s.y - 0.5)})*(${weightExpr(s, T)})`).join('+')})`;

  const originX = `clip(${cx}-1/(2*${z}),0,1-1/${z})`;
  const originY = `clip(${cy}-1/(2*${z}),0,1-1/${z})`;

  const x = `(${trackExpr(c.track, 'x')}-(${originX}))*${z}*${plan.size.w}`;
  const y = `(${trackExpr(c.track, 'y')}-(${originY}))*${z}*${plan.size.h}`;

  // Intervals the driver measured as keyboard-only. The pointer is parked and
  // irrelevant then, and leaving it sitting over the field it just clicked
  // covers the very text the shot exists to show.
  const hidden = [];
  for (let i = 0; i < c.track.length - 1; i += 1) {
    if (!c.track[i].visible) hidden.push(`between(t,${f(c.track[i].t)},${f(c.track[i + 1].t)})`);
  }
  const enable = hidden.length ? `:enable='not(${hidden.join('+')})'` : '';

  return `overlay=x='${x}':y='${y}':eval=frame${enable}`;
}

// The arrow is drawn to a file next to the output rather than committed as an
// asset, so its size can follow the render and nobody has to keep a binary in
// the repository in step with the code that places it.
export function writeCursorImage(plan) {
  if (!plan.cursor) return null;
  const { bytes } = cursorPng(plan.cursor.scale);
  const path = `${plan.output.replace(/\.[^.]+$/, '')}-cursor.png`;
  writeFileSync(path, bytes);
  return path;
}

// A screen recording usually has no audio at all. `-map 0:a?` already tolerates
// that, but passing `-c:a`/`-b:a` anyway makes ffmpeg print a paragraph about an
// unused AVOption that reads like a fault, on what is this tool's most common
// path. So the audio arguments are added only when a stream is actually there.
export function buildArgs(plan, hasAudio = true, cursorImage = null) {
  const audio = hasAudio
    // Re-encoded rather than copied: a stream copy fails outright when the
    // source codec cannot live in the output container, and a demo is not
    // worth losing to that.
    ? ['-c:a', 'aac', '-b:a', '192k']
    : [];
  const overlay = plan.cursor && cursorImage ? cursorOverlay(plan) : null;
  const video = overlay
    ? ['-i', cursorImage,
       '-filter_complex', `[0:v]${buildFilter(plan)}[z];[z][1:v]${overlay}[v]`,
       '-map', '[v]']
    : ['-vf', buildFilter(plan), '-map', '0:v:0'];
  return [
    '-y',
    '-i', plan.source,
    ...video,
    '-c:v', 'libx264',
    '-preset', 'medium',
    '-crf', String(plan.crf),
    '-pix_fmt', 'yuv420p',
    '-map', '0:a?',
    ...audio,
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

// Whether the source carries an audio stream at all. `true` when ffprobe cannot
// say, so an unavailable ffprobe keeps the previous behaviour rather than
// silently dropping audio that is really there.
export function probeHasAudio(source) {
  const run = spawnSync('ffprobe', [
    '-v', 'error', '-select_streams', 'a',
    '-show_entries', 'stream=index',
    '-of', 'default=noprint_wrappers=1:nokey=1', source,
  ], { encoding: 'utf8' });
  if (run.error || run.status !== 0) return true;
  return String(run.stdout).trim().length > 0;
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

// ------------------------------------------------------------------ compile
// A screenplay says what mattered. A take says when it happened and where. Only
// together do they make a focus plan, and neither half can be guessed from the
// other: direction cannot know a source second, and a recorder cannot know what
// deserved a closer look. This is the join, and it is arithmetic, not judgement.

const ANCHOR_MARGIN = 0.02;

// A point says where to aim; it does not say what has to stay visible. Typing
// starts at the left edge of a field and grows right, so centring the field puts
// the first characters outside the crop — which is exactly how a plan can be
// valid, render cleanly, and miss the thing being demonstrated. `leading` frames
// the near edge with a margin instead, and never pans further than centring the
// element would, so a small target still just gets centred.
export function anchorPoint(anchor, rect, pointer, region, zoom) {
  const half = 1 / (2 * zoom);
  const cx = (rect ? (rect.x0 + rect.x1) / 2 / region.w : 0.5);
  const cy = (rect ? (rect.y0 + rect.y1) / 2 / region.h : 0.5);

  if (anchor === 'pointer') {
    if (!pointer) fail('an emphasis anchored to the pointer needs a pointer position in the take manifest');
    return { x: pointer.x / region.w, y: pointer.y / region.h };
  }
  if (!rect) fail('an emphasis needs the rectangle the step acted on; the take manifest recorded none');
  if (anchor === 'leading') return { x: Math.min(cx, rect.x0 / region.w - ANCHOR_MARGIN + half), y: cy };
  if (anchor === 'trailing') return { x: Math.max(cx, rect.x1 / region.w + ANCHOR_MARGIN - half), y: cy };
  return { x: cx, y: cy };
}

const MIN_SEGMENT = 0.5;

export function compile(screenplay, take, options = {}) {
  const notes = [];
  const byId = new Map(take.steps.map((step) => [step.id, step]));
  const region = take.capture.region;

  let segments = [];
  for (const step of screenplay.steps) {
    if (!step.emphasis) continue;
    const measured = byId.get(step.id);
    if (!measured) {
      notes.push(`${step.id}: marked for emphasis but the take never recorded it; skipped`);
      continue;
    }
    if (measured.status === 'failed') {
      notes.push(`${step.id}: the take recorded this step as failed; skipped rather than zooming into a mistake`);
      continue;
    }
    const e = step.emphasis;
    let point;
    try {
      point = anchorPoint(e.anchor, measured.rect, measured.pointer, region, e.zoom);
    } catch (error) {
      notes.push(`${step.id}: ${error.message}; skipped`);
      continue;
    }
    segments.push({
      id: step.id,
      start: Math.max(0, measured.start - e.lead),
      end: measured.end + e.hold,
      x: Math.min(1, Math.max(0, point.x)),
      y: Math.min(1, Math.max(0, point.y)),
      zoom: e.zoom,
      ease: e.ease,
      label: e.label,
    });
  }

  segments.sort((a, b) => a.start - b.start);

  // The camera cannot be in two places at once, and `demo-zoom` refuses a plan
  // that asks it to be. Lead-in and hold are generous by design, so neighbours
  // collide routinely; the fair split is the midpoint of the overlap.
  for (let i = 1; i < segments.length; i += 1) {
    const previous = segments[i - 1];
    const current = segments[i];
    if (current.start < previous.end) {
      const midpoint = (current.start + previous.end) / 2;
      notes.push(`${previous.id} and ${current.id} overlapped by ${(previous.end - current.start).toFixed(2)}s; split at ${midpoint.toFixed(2)}s`);
      previous.end = midpoint;
      current.start = midpoint;
    }
  }

  const kept = [];
  for (const segment of segments) {
    const duration = segment.end - segment.start;
    if (duration < MIN_SEGMENT) {
      notes.push(`${segment.id}: only ${duration.toFixed(2)}s of clear time, too short to zoom into; skipped`);
      continue;
    }
    // The ease has to fit twice or the zoom never reaches its factor. Trimming
    // it is better than refusing the plan, but it is said out loud.
    const room = duration / 2 - 0.01;
    if (segment.ease > room) {
      notes.push(`${segment.id}: ease trimmed from ${segment.ease}s to ${room.toFixed(2)}s to fit a ${duration.toFixed(2)}s segment`);
      segment.ease = Math.max(0, Number(room.toFixed(3)));
    }
    kept.push(segment);
  }

  const round = (n) => Number(n.toFixed(3));
  return {
    plan: {
      // Stamped so a plan cannot silently be rendered against a different
      // recording than the one whose clock produced its timings.
      compiled_from: { screenplay: screenplay.title, take_id: take.take_id, recording: take.recording },
      source: take.recording,
      output: options.output ?? 'demo-focused.mp4',
      size: options.size ?? `${region.w}x${region.h}`,
      fps: take.capture.fps,
      focus: kept.map((s) => ({
        start: round(s.start), end: round(s.end),
        x: round(s.x), y: round(s.y),
        zoom: s.zoom, ease: s.ease, label: s.label,
      })),
      // Carried straight through from the take. The compiler does not smooth,
      // resample, or extend this: it is the record of where the pointer was,
      // and editing it here would make the drawn arrow a claim rather than a
      // measurement. A take without telemetry simply produces no cursor.
      ...(take.pointer
        ? {
          cursor: {
            track: take.pointer.track.map((s) => ({
              t: round(s.t), x: round(s.x), y: round(s.y), visible: s.visible,
            })),
            clicks: take.pointer.clicks.map(round),
          },
        }
        : {}),
    },
    notes,
  };
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
    args = buildArgs(plan, probeHasAudio(plan.source), writeCursorImage(plan));
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
// The test suite proves the arithmetic. Only ffmpeg can prove the render, so
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

// ------------------------------------------------------------------- review
// Validation proves the arithmetic; it cannot tell you the shot is right. Both
// ways a demo really fails are editorial: the moment has already passed by the
// time the camera arrives, or the thing that is changing sits inside the element
// but outside the crop. Both are obvious in four frames side by side, and
// invisible in any number that a validator could check. So this builds the
// contact sheet and leaves the judgement to a person.

export function reviewSampleTimes(segment) {
  const mid = (segment.start + segment.end) / 2;
  return [
    { at: Math.max(0, segment.start - 0.3), of: 'source', what: 'before' },
    { at: mid, of: 'source', what: 'at' },
    { at: mid, of: 'render', what: 'peak' },
    { at: Math.max(segment.start, segment.end - 0.2), of: 'render', what: 'end' },
  ];
}

const REVIEW_CELL = { w: 480, h: 300 };

export function reviewLegend(plan) {
  const lines = ['contact sheet: one row per focus segment', ''];
  lines.push('  row  time            zoom   source before | source at | rendered peak | rendered end');
  plan.focus.forEach((segment, index) => {
    lines.push(`  ${String(index + 1).padStart(3)}  ${segment.start.toFixed(2)}-${segment.end.toFixed(2)}s`.padEnd(24)
      + `${`${segment.zoom}x`.padStart(5)}   ${segment.label}`);
  });
  lines.push('');
  lines.push('Look for two things a validator cannot see: whether the moment has already');
  lines.push('passed by the time the camera arrives, and whether what is changing is');
  lines.push('inside the crop. This sheet is not evidence the demo is correct.');
  return lines.join('\n');
}

function review(plan, out) {
  if (plan.focus.length === 0) {
    console.error('demo-zoom: this plan has no focus segments, so there is nothing to review');
    return 1;
  }
  for (const path of [plan.source, plan.output]) {
    if (!existsSync(path)) {
      console.error(`demo-zoom: --review compares the recording with the render, and ${path} does not exist yet. Render first.`);
      return 1;
    }
  }
  if (!findFfmpeg()) {
    console.error('demo-zoom: ffmpeg is not on PATH.');
    return 1;
  }

  const dir = mkdtempSync(join(tmpdir(), 'demo-zoom-review-'));
  try {
    let n = 0;
    for (const segment of plan.focus) {
      for (const sample of reviewSampleTimes(segment)) {
        const cell = join(dir, `cell${String(n).padStart(3, '0')}.png`);
        const from = sample.of === 'source' ? plan.source : plan.output;
        const run = spawnSync('ffmpeg', [
          '-y', '-loglevel', 'error', '-ss', String(sample.at), '-i', from, '-frames:v', '1',
          '-vf', `scale=${REVIEW_CELL.w}:${REVIEW_CELL.h}:force_original_aspect_ratio=decrease,`
            + `pad=${REVIEW_CELL.w}:${REVIEW_CELL.h}:(ow-iw)/2:(oh-ih)/2:color=0x202020,setsar=1`,
          cell,
        ], { encoding: 'utf8' });
        if (run.error || run.status !== 0 || !existsSync(cell)) {
          console.error(`demo-zoom: could not sample ${from} at ${sample.at.toFixed(2)}s`);
          return 1;
        }
        n += 1;
      }
    }

    const tile = spawnSync('ffmpeg', [
      '-y', '-loglevel', 'error',
      '-f', 'image2', '-i', join(dir, 'cell%03d.png'),
      '-vf', `tile=4x${plan.focus.length}:margin=8:padding=4:color=0x101010`,
      '-frames:v', '1', out,
    ], { encoding: 'utf8' });
    if (tile.error || tile.status !== 0 || !existsSync(out)) {
      console.error(`demo-zoom: could not build the contact sheet${tile.stderr ? `: ${tile.stderr.trim()}` : ''}`);
      return 1;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }

  console.log(reviewLegend(plan));
  console.log('');
  console.log(`wrote ${out}`);
  console.log('Open it. A render is not finished until someone has looked at it.');
  return 0;
}

// --------------------------------------------------------------------- cli

function compileCommand(argv) {
  const i = argv.indexOf('--compile');
  const screenplayPath = argv[i + 1];
  const takePath = argv[i + 2];
  if (!screenplayPath || !takePath || screenplayPath.startsWith('-') || takePath.startsWith('-')) {
    console.error('demo-zoom: --compile needs a screenplay and a take manifest: --compile demo_screenplay.json demo_take.json');
    return 1;
  }
  for (const path of [screenplayPath, takePath]) {
    if (!existsSync(path)) {
      console.error(`demo-zoom: not found: ${path}`);
      return 1;
    }
  }

  const outIndex = argv.indexOf('--out');
  const out = outIndex === -1 ? null : argv[outIndex + 1];
  const outputIndex = argv.indexOf('--output');

  let result;
  try {
    const screenplay = parseScreenplay(readFileSync(screenplayPath, 'utf8'));
    const take = parseTake(readFileSync(takePath, 'utf8'));
    result = compile(screenplay, take, {
      output: outputIndex === -1 ? undefined : argv[outputIndex + 1],
    });
  } catch (error) {
    console.error(`demo-zoom: ${error.message}`);
    return 1;
  }

  const text = `${JSON.stringify(result.plan, null, 2)}\n`;

  // Compiled or hand-written, a plan goes through the same front door. A
  // compiler that emitted something the renderer would reject would only move
  // the failure later.
  let plan;
  try {
    plan = parsePlan(text);
  } catch (error) {
    console.error(`demo-zoom: the compiled plan is not renderable: ${error.message}`);
    return 1;
  }

  for (const note of result.notes) console.error(`  note: ${note}`);
  if (result.notes.length > 0) console.error('');

  if (out) {
    writeFileSync(out, text, 'utf8');
    console.error(`wrote ${out}  (${plan.focus.length} focus segment(s) from take ${result.plan.compiled_from.take_id})`);
  } else {
    process.stdout.write(text);
  }
  return 0;
}

function usage() {
  console.log(`demo-zoom -- render a focused demo from a declared focus plan

  node demo-zoom.mjs --plan <file>            render it (needs ffmpeg)
  node demo-zoom.mjs --plan <file> --print    print the ffmpeg command instead
  node demo-zoom.mjs --plan <file> --explain  describe the render in plain numbers
  node demo-zoom.mjs --plan <file> --review [--out sheet.png]
                                              contact sheet, four frames per
                                              segment, so a person can see
                                              whether the shot is right
  node demo-zoom.mjs --grid <video> --at 3.5 [--plan <file> | --size 1920x1080]
                                              lift out that frame, ruled into
                                              tenths, fitted the way the render
                                              will fit it
  node demo-zoom.mjs --compile <screenplay> <take> [--out plan.json]
                                              join a screenplay's intent to a
                                              take's measured timings and
                                              rectangles, so no source second is
                                              ever typed by hand
  node demo-zoom.mjs --example                print a starter plan
  node demo-zoom.mjs --verify                 prove a real render lands on target

A plan declares what the viewer should look at and when. Coordinates are
fractions of the frame: 0,0 is the top left and 1,1 the bottom right. They are
targets: a point close to an edge cannot be centred without showing padding, so
the shot stops at the edge. --explain reports where each shot really lands.`);
}

async function main(argv) {
  if (argv.includes('--verify')) return verify();
  if (argv.includes('--compile')) return compileCommand(argv);
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
  if (argv.includes('--review')) {
    const at = argv.indexOf('--out');
    return review(plan, at === -1 || !argv[at + 1] ? 'demo-review.png' : argv[at + 1]);
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
