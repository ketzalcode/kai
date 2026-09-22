#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  parseScreenplay,
  parseTake
} from "./chunk-KCEE25ST.mjs";

// src/creative/demo-zoom.mjs
import { spawn, spawnSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync, mkdtempSync, rmSync, readFileSync as read } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

// src/creative/lib/cursor-png.mjs
import { deflateSync } from "node:zlib";
var OUTLINE = [[0, 0], [0, 16.4], [3.6, 12.8], [6.1, 18.8], [8.7, 17.7], [6.2, 11.8], [11.2, 11.8]];
var BODY = [[1.15, 2.4], [1.15, 13.7], [4, 10.9], [6.5, 16.7], [7.4, 16.3], [4.85, 10.3], [8.9, 10.3]];
var GRID_W = 12;
var GRID_H = 19;
function inside(poly, px, py) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if (yi > py !== yj > py && px < (xj - xi) * (py - yi) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}
function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = c >>> 1 ^ 3988292384 & -(c & 1);
  }
  return ~c >>> 0;
}
function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, "ascii");
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0))
  ]);
}
function cursorPng(scale = 2) {
  const w = Math.ceil(GRID_W * scale);
  const h = Math.ceil(GRID_H * scale);
  const rgba = Buffer.alloc(w * h * 4);
  const SUB = 3;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let body = 0;
      let outline = 0;
      for (let sy = 0; sy < SUB; sy++) {
        for (let sx = 0; sx < SUB; sx++) {
          const gx = (x + (sx + 0.5) / SUB) / scale;
          const gy = (y + (sy + 0.5) / SUB) / scale;
          if (inside(BODY, gx, gy)) body++;
          else if (inside(OUTLINE, gx, gy)) outline++;
        }
      }
      const total = SUB * SUB;
      const cover = (body + outline) / total;
      if (cover === 0) continue;
      const white = body / (body + outline);
      const v = Math.round(255 * white + 26 * (1 - white));
      const i = (y * w + x) * 4;
      rgba[i] = v;
      rgba[i + 1] = v;
      rgba[i + 2] = v;
      rgba[i + 3] = Math.round(255 * cover);
    }
  }
  return { bytes: encodePng(w, h, rgba), width: w, height: h };
}

// src/creative/demo-zoom.mjs
var MAX_ZOOM = 10;
var MAX_FPS = 240;
var MAX_SEGMENTS = 200;
function fail(message) {
  throw new Error(message);
}
function num(value, label) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    fail(`${label} must be a finite number, got ${JSON.stringify(value)}`);
  }
  return value;
}
function safePath(value, label) {
  if (typeof value !== "string" || value.length === 0) fail(`${label} is required`);
  if (value.startsWith("-")) fail(`${label} may not start with "-" (it would be read as an ffmpeg option)`);
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
function parsePlan(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`plan is not valid JSON: ${error.message}`);
  }
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) fail("plan must be a JSON object");
  const source = safePath(raw.source, "source");
  const output = safePath(raw.output, "output");
  if (source === output) fail("source and output must differ; rendering over the input would destroy it");
  const fps = num(raw.fps === void 0 ? 30 : raw.fps, "fps");
  if (fps < 1 || fps > MAX_FPS) fail(`fps must be between 1 and ${MAX_FPS}`);
  const size = parseSize(raw.size === void 0 ? "1280x720" : raw.size);
  if (!Array.isArray(raw.focus)) fail('plan needs a "focus" array (it may be empty)');
  if (raw.focus.length > MAX_SEGMENTS) fail(`too many focus segments (limit ${MAX_SEGMENTS})`);
  const focus = raw.focus.map((segment, index) => {
    const at = `focus[${index}]`;
    if (!segment || typeof segment !== "object" || Array.isArray(segment)) fail(`${at} must be an object`);
    const start = num(segment.start, `${at}.start`);
    const end = num(segment.end, `${at}.end`);
    if (start < 0) fail(`${at}.start may not be negative`);
    if (end <= start) fail(`${at}.end must be greater than start`);
    const x = num(segment.x, `${at}.x`);
    const y = num(segment.y, `${at}.y`);
    if (x < 0 || x > 1 || y < 0 || y > 1) fail(`${at}.x and .y are fractions of the frame and must be within 0..1`);
    const zoom = num(segment.zoom === void 0 ? 2 : segment.zoom, `${at}.zoom`);
    if (zoom < 1) fail(`${at}.zoom may not be below 1; 1 means no zoom`);
    if (zoom > MAX_ZOOM) fail(`${at}.zoom above ${MAX_ZOOM} magnifies past the source resolution`);
    const ease = num(segment.ease === void 0 ? 0.4 : segment.ease, `${at}.ease`);
    if (ease < 0) fail(`${at}.ease may not be negative`);
    if (ease * 2 > end - start) {
      fail(`${at}.ease of ${ease}s does not fit twice inside a ${(end - start).toFixed(2)}s segment; the zoom would never reach ${zoom}x`);
    }
    const label = segment.label === void 0 ? "" : String(segment.label);
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
      const crf = raw.crf === void 0 ? 18 : num(raw.crf, "crf");
      if (crf < 0 || crf > 51) fail("crf must be within 0..51, the range libx264 accepts");
      return crf;
    })()
  };
}
function parseCursor(raw) {
  if (raw === void 0 || raw === null) return null;
  if (!Array.isArray(raw.track) || raw.track.length === 0) {
    fail("cursor.track must list at least one measured sample; a cursor cannot be drawn from nothing");
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
  return { track, clicks, scale: raw.scale === void 0 ? 2.2 : num(raw.scale, "cursor.scale") };
}
function smoothstep(u) {
  const c = Math.min(1, Math.max(0, u));
  return c * c * (3 - 2 * c);
}
function weightAt(segment, t) {
  if (t < segment.start || t >= segment.end) return 0;
  if (segment.ease === 0) return 1;
  return Math.min(
    smoothstep((t - segment.start) / segment.ease),
    smoothstep((segment.end - t) / segment.ease)
  );
}
function zoomAt(plan, t) {
  return plan.focus.reduce((total, segment) => total + (segment.zoom - 1) * weightAt(segment, t), 1);
}
function centerAt(plan, t) {
  return plan.focus.reduce(
    (acc, segment) => {
      const w = weightAt(segment, t);
      return { x: acc.x + (segment.x - 0.5) * w, y: acc.y + (segment.y - 0.5) * w };
    },
    { x: 0.5, y: 0.5 }
  );
}
var f = (n) => {
  const s = Number(n).toFixed(6);
  return s.replace(/0+$/, "").replace(/\.$/, "");
};
function weightExpr(segment, T) {
  const inside2 = `gte(${T},${f(segment.start)})*lt(${T},${f(segment.end)})`;
  if (segment.ease === 0) return inside2;
  const rampIn = `clip((${T}-${f(segment.start)})/${f(segment.ease)},0,1)`;
  const rampOut = `clip((${f(segment.end)}-${T})/${f(segment.ease)},0,1)`;
  const ss = (u) => `(${u})*(${u})*(3-2*(${u}))`;
  return `${inside2}*min(${ss(rampIn)},${ss(rampOut)})`;
}
function normalizePrefix(plan, factor = 1) {
  const w = plan.size.w * factor;
  const h = plan.size.h * factor;
  return [
    `fps=${f(plan.fps)}`,
    `scale=${w}:${h}:force_original_aspect_ratio=decrease`,
    `pad=${w}:${h}:(ow-iw)/2:(oh-ih)/2`,
    "setsar=1"
  ].join(",");
}
var SUPERSAMPLE = 2;
var MAX_FILTER_CHARS = 8e3;
function buildFilter(plan) {
  const T = `(on/${f(plan.fps)})`;
  if (plan.focus.length === 0) {
    return normalizePrefix(plan);
  }
  const terms = plan.focus.map((segment) => `(${f(segment.zoom - 1)})*(${weightExpr(segment, T)})`);
  const z = `1+${terms.join("+")}`;
  const cx = `0.5+${plan.focus.map((s) => `(${f(s.x - 0.5)})*(${weightExpr(s, T)})`).join("+")}`;
  const cy = `0.5+${plan.focus.map((s) => `(${f(s.y - 0.5)})*(${weightExpr(s, T)})`).join("+")}`;
  const x = `clip((${cx})*iw-(iw/zoom)/2,0,iw-iw/zoom)`;
  const y = `clip((${cy})*ih-(ih/zoom)/2,0,ih-ih/zoom)`;
  const filter = `${normalizePrefix(plan, SUPERSAMPLE)},zoompan=z='${z}':x='${x}':y='${y}':d=1:s=${plan.size.text}:fps=${f(plan.fps)}`;
  if (filter.length > MAX_FILTER_CHARS) {
    fail(`this plan builds a ${filter.length}-character filter from ${plan.focus.length} segments, past the ${MAX_FILTER_CHARS} this tool will hand to ffmpeg on one command line. Split the demo into shorter renders.`);
  }
  return filter;
}
function trackExpr(track, key) {
  let expr = f(track[track.length - 1][key]);
  for (let i = track.length - 1; i > 0; i -= 1) {
    const a = track[i - 1];
    const b = track[i];
    const span = b.t - a.t;
    const at = span <= 0 ? f(b[key]) : `(${f(a[key])}+(${f(b[key] - a[key])})*(t-${f(a.t)})/${f(span)})`;
    expr = `if(lt(t,${f(b.t)}),${at},${expr})`;
  }
  return `if(lt(t,${f(track[0].t)}),${f(track[0][key])},${expr})`;
}
function cursorOverlay(plan) {
  const c = plan.cursor;
  if (!c) return null;
  const T = "t";
  const z = plan.focus.length === 0 ? "1" : `(1+${plan.focus.map((s) => `(${f(s.zoom - 1)})*(${weightExpr(s, T)})`).join("+")})`;
  const cx = plan.focus.length === 0 ? "0.5" : `(0.5+${plan.focus.map((s) => `(${f(s.x - 0.5)})*(${weightExpr(s, T)})`).join("+")})`;
  const cy = plan.focus.length === 0 ? "0.5" : `(0.5+${plan.focus.map((s) => `(${f(s.y - 0.5)})*(${weightExpr(s, T)})`).join("+")})`;
  const originX = `clip(${cx}-1/(2*${z}),0,1-1/${z})`;
  const originY = `clip(${cy}-1/(2*${z}),0,1-1/${z})`;
  const x = `(${trackExpr(c.track, "x")}-(${originX}))*${z}*${plan.size.w}`;
  const y = `(${trackExpr(c.track, "y")}-(${originY}))*${z}*${plan.size.h}`;
  const hidden = [];
  for (let i = 0; i < c.track.length - 1; i += 1) {
    if (!c.track[i].visible) hidden.push(`between(t,${f(c.track[i].t)},${f(c.track[i + 1].t)})`);
  }
  const enable = hidden.length ? `:enable='not(${hidden.join("+")})'` : "";
  return `overlay=x='${x}':y='${y}':eval=frame${enable}`;
}
function writeCursorImage(plan) {
  if (!plan.cursor) return null;
  const { bytes } = cursorPng(plan.cursor.scale);
  const path = `${plan.output.replace(/\.[^.]+$/, "")}-cursor.png`;
  writeFileSync(path, bytes);
  return path;
}
function buildArgs(plan, hasAudio = true, cursorImage = null) {
  const audio = hasAudio ? ["-c:a", "aac", "-b:a", "192k"] : [];
  const overlay = plan.cursor && cursorImage ? cursorOverlay(plan) : null;
  const video = overlay ? [
    "-i",
    cursorImage,
    "-filter_complex",
    `[0:v]${buildFilter(plan)}[z];[z][1:v]${overlay}[v]`,
    "-map",
    "[v]"
  ] : ["-vf", buildFilter(plan), "-map", "0:v:0"];
  return [
    "-y",
    "-i",
    plan.source,
    ...video,
    "-c:v",
    "libx264",
    "-preset",
    "medium",
    "-crf",
    String(plan.crf),
    "-pix_fmt",
    "yuv420p",
    "-map",
    "0:a?",
    ...audio,
    plan.output
  ];
}
function quoteArg(arg) {
  if (/^[A-Za-z0-9_@%+=:,./-]+$/.test(arg)) return arg;
  return `"${arg.replace(/(["\\$`])/g, "\\$1")}"`;
}
function printable(plan) {
  return ["ffmpeg", ...buildArgs(plan)].map(quoteArg).join(" ");
}
function effectiveCenter(x, zoom) {
  const half = 1 / (2 * zoom);
  return Math.min(1 - half, Math.max(half, x));
}
function probeDuration(source) {
  const run = spawnSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    source
  ], { encoding: "utf8" });
  if (run.error || run.status !== 0) return null;
  const seconds = Number(String(run.stdout).trim());
  return Number.isFinite(seconds) && seconds > 0 ? seconds : null;
}
function probeHasAudio(source) {
  const run = spawnSync("ffprobe", [
    "-v",
    "error",
    "-select_streams",
    "a",
    "-show_entries",
    "stream=index",
    "-of",
    "default=noprint_wrappers=1:nokey=1",
    source
  ], { encoding: "utf8" });
  if (run.error || run.status !== 0) return true;
  return String(run.stdout).trim().length > 0;
}
function overrunning(plan, duration) {
  if (duration === null) return [];
  return plan.focus.filter((s) => s.start >= duration || s.end > duration + 1e-3);
}
function explain(plan, duration = null) {
  const lines = [];
  lines.push(`source ${plan.source}`);
  lines.push(`output ${plan.output}  ${plan.size.text} @ ${plan.fps}fps  crf ${plan.crf}`);
  if (duration !== null) lines.push(`source runs ${duration.toFixed(2)}s`);
  else lines.push("source duration unknown (ffprobe did not report it)");
  if (plan.focus.length === 0) {
    lines.push("no focus segments: the render only normalises size and frame rate");
    return lines.join("\n");
  }
  lines.push("");
  lines.push("  start     end   zoom   ease  asked for    lands on     label");
  for (const s of plan.focus) {
    const asked = `${s.x.toFixed(2)},${s.y.toFixed(2)}`;
    const lands = `${effectiveCenter(s.x, s.zoom).toFixed(2)},${effectiveCenter(s.y, s.zoom).toFixed(2)}`;
    lines.push(
      `${String(s.start.toFixed(2)).padStart(7)} ${String(s.end.toFixed(2)).padStart(7)}${`${s.zoom}x`.padStart(7)}${`${s.ease}s`.padStart(7)}   ${asked.padEnd(12)} ${lands.padEnd(12)} ${s.label}`
    );
  }
  const clamped = plan.focus.filter((s) => effectiveCenter(s.x, s.zoom) !== s.x || effectiveCenter(s.y, s.zoom) !== s.y);
  const held = plan.focus.reduce((total, s) => total + (s.end - s.start), 0);
  lines.push("");
  lines.push(`${plan.focus.length} segment(s), ${held.toFixed(1)}s under zoom`);
  if (clamped.length > 0) {
    lines.push(`${clamped.length} segment(s) sit too close to an edge to be centred; the shot stops at the frame and the point lands off-centre, as shown above`);
  }
  const past = overrunning(plan, duration);
  if (past.length > 0) {
    lines.push(`${past.length} segment(s) run past the end of the source; ffmpeg would simply stop there`);
  }
  return lines.join("\n");
}
var ANCHOR_MARGIN = 0.02;
function anchorPoint(anchor, rect, pointer, region, zoom) {
  const half = 1 / (2 * zoom);
  const cx = rect ? (rect.x0 + rect.x1) / 2 / region.w : 0.5;
  const cy = rect ? (rect.y0 + rect.y1) / 2 / region.h : 0.5;
  if (anchor === "pointer") {
    if (!pointer) fail("an emphasis anchored to the pointer needs a pointer position in the take manifest");
    return { x: pointer.x / region.w, y: pointer.y / region.h };
  }
  if (!rect) fail("an emphasis needs the rectangle the step acted on; the take manifest recorded none");
  if (anchor === "leading") return { x: Math.min(cx, rect.x0 / region.w - ANCHOR_MARGIN + half), y: cy };
  if (anchor === "trailing") return { x: Math.max(cx, rect.x1 / region.w + ANCHOR_MARGIN - half), y: cy };
  return { x: cx, y: cy };
}
var MIN_SEGMENT = 0.5;
function compile(screenplay, take, options = {}) {
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
    if (measured.status === "failed") {
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
      label: e.label
    });
  }
  segments.sort((a, b) => a.start - b.start);
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
      output: options.output ?? "demo-focused.mp4",
      size: options.size ?? `${region.w}x${region.h}`,
      fps: take.capture.fps,
      focus: kept.map((s) => ({
        start: round(s.start),
        end: round(s.end),
        x: round(s.x),
        y: round(s.y),
        zoom: s.zoom,
        ease: s.ease,
        label: s.label
      })),
      // Carried straight through from the take. The compiler does not smooth,
      // resample, or extend this: it is the record of where the pointer was,
      // and editing it here would make the drawn arrow a claim rather than a
      // measurement. A take without telemetry simply produces no cursor.
      ...take.pointer ? {
        cursor: {
          track: take.pointer.track.map((s) => ({
            t: round(s.t),
            x: round(s.x),
            y: round(s.y),
            visible: s.visible
          })),
          clicks: take.pointer.clicks.map(round)
        }
      } : {}
    },
    notes
  };
}
var EXAMPLE = `{
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
function findFfmpeg() {
  const probe = spawnSync("ffmpeg", ["-version"], { encoding: "utf8" });
  return !probe.error && probe.status === 0;
}
function render(plan) {
  if (!existsSync(plan.source)) {
    console.error(`demo-zoom: source not found: ${plan.source}`);
    return 1;
  }
  if (!findFfmpeg()) {
    console.error("demo-zoom: ffmpeg is not on PATH. Install it, or use --print and run the command yourself.");
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
  console.log("");
  console.log("rendering...");
  return new Promise((resolve) => {
    const child = spawn("ffmpeg", args, { stdio: ["ignore", "inherit", "inherit"] });
    child.on("error", (error) => {
      console.error(`demo-zoom: could not run ffmpeg: ${error.message}`);
      resolve(1);
    });
    child.on("close", (code) => {
      if (code === 0) console.log(`
wrote ${plan.output}`);
      resolve(code === 0 ? 0 : 1);
    });
  });
}
var checks = 0;
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
  let message = "";
  try {
    parsePlan(text);
  } catch (error) {
    message = error.message;
  }
  ok(message.includes(fragment), `${label} (said: ${message || "nothing, which is the bug"})`);
}
var VALID = JSON.stringify({
  source: "a.mp4",
  output: "b.mp4",
  focus: [{ start: 2, end: 6, x: 0.7, y: 0.3, zoom: 2.5, ease: 0.5 }]
});
function selfTest() {
  console.log("demo-zoom self-test");
  const plan = parsePlan(VALID);
  ok(plan.focus.length === 1, "a valid plan parses");
  ok(plan.size.text === "1280x720" && plan.fps === 30, "size and rate have defaults");
  rejects("{ not json", "not valid JSON", "a malformed plan names the parse error");
  rejects(
    JSON.stringify({ source: "a.mp4", output: "a.mp4", focus: [] }),
    "must differ",
    "rendering over the source is refused"
  );
  rejects(
    JSON.stringify({ source: "-i evil", output: "b.mp4", focus: [] }),
    "read as an ffmpeg option",
    "a path that would smuggle an option is refused"
  );
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4" }),
    "focus",
    "a missing focus list is refused rather than assumed"
  );
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4", focus: [{ start: 5, end: 2, x: 0.5, y: 0.5 }] }),
    "greater than start",
    "a segment that ends before it starts is refused"
  );
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4", focus: [{ start: 0, end: 2, x: 1.4, y: 0.5 }] }),
    "within 0..1",
    "a focus point outside the frame is refused"
  );
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4", focus: [{ start: 0, end: 2, x: 0.5, y: 0.5, zoom: 0.5 }] }),
    "may not be below 1",
    "a zoom that shrinks the frame is refused"
  );
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4", focus: [{ start: 0, end: 1, x: 0.5, y: 0.5, ease: 0.9 }] }),
    "never reach",
    "an ease too long for its segment is refused, with the reason"
  );
  rejects(JSON.stringify({
    source: "a.mp4",
    output: "b.mp4",
    focus: [{ start: 0, end: 5, x: 0.5, y: 0.5 }, { start: 3, end: 8, x: 0.5, y: 0.5 }]
  }), "two places at once", "overlapping segments are refused");
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4", size: "1281x721", focus: [] }),
    "even dimensions",
    "an odd output size is refused before the encoder rejects it"
  );
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4", fps: 0, focus: [] }),
    "fps must be",
    "a zero frame rate is refused"
  );
  const s = plan.focus[0];
  ok(weightAt(s, 1.99) === 0, "the camera is untouched before a segment begins");
  ok(weightAt(s, 6.01) === 0, "the camera is released after a segment ends");
  ok(weightAt(s, 2) === 0 && weightAt(s, 6) === 0, "weight is zero exactly at both edges, so there is no jump");
  ok(Math.abs(weightAt(s, 4) - 1) < 1e-9, "weight reaches a full 1 in the middle");
  ok(Math.abs(zoomAt(plan, 4) - 2.5) < 1e-9, "zoom reaches the requested factor");
  ok(Math.abs(zoomAt(plan, 0) - 1) < 1e-9, "zoom rests at 1 outside every segment");
  const monotonic = [2.1, 2.2, 2.3, 2.4, 2.5].map((t) => zoomAt(plan, t));
  ok(monotonic.every((v, i) => i === 0 || v > monotonic[i - 1]), "the ramp is monotonic, so the zoom never stutters");
  const c = centerAt(plan, 4);
  ok(Math.abs(c.x - 0.7) < 1e-9 && Math.abs(c.y - 0.3) < 1e-9, "the frame centres on the focus point at full zoom");
  const c0 = centerAt(plan, 0);
  ok(c0.x === 0.5 && c0.y === 0.5, "the frame is centred when nothing is in focus");
  let biggest = 0;
  for (let t = 0; t < 8; t += 0.01) {
    biggest = Math.max(biggest, Math.abs(zoomAt(plan, t + 0.01) - zoomAt(plan, t)));
  }
  ok(biggest < 0.05, `the zoom curve is continuous everywhere (largest step ${biggest.toFixed(4)})`);
  const filter = buildFilter(plan);
  ok(filter.startsWith("fps=30,"), "the rate is forced before the zoom, so the filter clock matches real time");
  ok(
    filter.includes("force_original_aspect_ratio=decrease") && filter.includes("pad="),
    "the frame is fitted to the declared size, so a coordinate means the same thing on any source"
  );
  ok(filter.includes("setsar=1"), "pixels are square before the crop, so a non-square source cannot skew the zoom");
  ok(filter.includes("scale=2560:1440"), "the zoom reads from a frame twice the output size, halving the smallest crop step");
  ok(filter.includes("s=1280x720"), "the output size is still the declared one");
  ok(filter.includes("zoompan="), "the zoom is a single pass, so there are no seams to resynchronise");
  ok(!filter.includes("/2)*2"), "the crop origin is not coarsened to even pixels, which would enlarge each step rather than smooth it");
  ok(filter.includes("d=1"), "one output frame per input frame");
  ok(filter.includes("s=1280x720"), "the output size is pinned in the filter");
  ok(filter.includes("clip("), "the crop origin is clamped, so a focus point near an edge cannot show padding");
  ok(!/\bif\(/.test(filter), "the expression is a sum of weights rather than nested conditionals");
  ok(filter.includes("on/30"), "time is derived from the frame index, the portable clock");
  const touching = parsePlan(JSON.stringify({
    source: "a.mp4",
    output: "b.mp4",
    focus: [
      { start: 0, end: 2, x: 0.5, y: 0.5, zoom: 2, ease: 0 },
      { start: 2, end: 4, x: 0.5, y: 0.5, zoom: 3, ease: 0 }
    ]
  }));
  ok(
    Math.abs(zoomAt(touching, 2) - 3) < 1e-9,
    "where two hard-cut segments meet, only the second is active (a 2x and a 3x do not add to 4x)"
  );
  ok(Math.abs(zoomAt(touching, 1) - 2) < 1e-9, "a hard cut holds its own factor for its own span");
  ok(Math.abs(zoomAt(touching, 4) - 1) < 1e-9, "the last segment releases at its end rather than one frame late");
  ok(
    buildFilter(touching).includes("gte(") && buildFilter(touching).includes("lt("),
    "the interval is half-open in the emitted expression too, not only in the model"
  );
  const huge = {
    source: "a.mp4",
    output: "b.mp4",
    focus: Array.from({ length: 120 }, (_, i) => ({ start: i * 2, end: i * 2 + 1.5, x: 0.4, y: 0.6, zoom: 2, ease: 0.3 }))
  };
  let tooLong = "";
  try {
    buildFilter(parsePlan(JSON.stringify(huge)));
  } catch (error) {
    tooLong = error.message;
  }
  ok(
    tooLong.includes("command line"),
    "a plan whose filter would exceed what a command line can carry is refused with the reason, not left to fail inside spawn"
  );
  ok(Math.abs(effectiveCenter(0.95, 2) - 0.75) < 1e-9, "a point near an edge lands where the crop can actually reach");
  ok(Math.abs(effectiveCenter(0.5, 2) - 0.5) < 1e-9, "a point with room to spare lands exactly where it was asked to");
  const edge = parsePlan(JSON.stringify({
    source: "a.mp4",
    output: "b.mp4",
    focus: [{ start: 0, end: 3, x: 0.95, y: 0.95, zoom: 2, ease: 0.5 }]
  }));
  ok(
    explain(edge).includes("lands on") && explain(edge).includes("0.75"),
    "the explanation shows where an edge shot really lands, instead of echoing the request back"
  );
  ok(explain(edge).includes("too close to an edge"), "the explanation says plainly that a shot was clamped");
  ok(explain(edge).includes("duration unknown"), "an unknown source duration is declared rather than assumed fine");
  ok(explain(edge, 1).includes("past the end"), "a segment running past the end of the source is called out");
  ok(!explain(edge, 10).includes("past the end"), "a segment inside the source is not flagged");
  ok(overrunning(edge, null).length === 0, "without a duration nothing is claimed about overrun either way");
  const empty = parsePlan(JSON.stringify({ source: "a.mp4", output: "b.mp4", focus: [] }));
  ok(!buildFilter(empty).includes("zoompan"), "a plan with no focus segments does not pretend to zoom");
  ok(buildFilter(empty).includes("fps="), "a plan with no focus segments still normalises rate and size");
  const g = gridArgs("in.mp4", 3.5, "out.png");
  ok(g[g.indexOf("-ss") + 1] === "3.5", "the grid seeks to the requested time");
  ok(g.some((a) => a.includes("iw/10")), "the grid rules the frame into tenths, matching the plan coordinates");
  const gridFilter = g[g.indexOf("-vf") + 1];
  ok(
    gridFilter.includes("force_original_aspect_ratio=decrease") && gridFilter.includes("pad="),
    "the grid is drawn on the same fitted frame the render produces, so measured coordinates transfer"
  );
  ok(
    gridArgs("in.mp4", 0, "out.png", "1920x1080")[g.indexOf("-vf") + 1].includes("1920:1080"),
    "the grid follows the declared output size rather than assuming one"
  );
  let gridRefused = "";
  try {
    gridArgs("in.mp4", -1, "out.png");
  } catch (error) {
    gridRefused = error.message;
  }
  ok(gridRefused.includes("at or after zero"), "a negative grid time is refused");
  const args = buildArgs(plan);
  ok(Array.isArray(args) && args.every((a) => typeof a === "string"), "ffmpeg is given an argv array, never a shell string");
  ok(args[args.length - 1] === "b.mp4", "the output path is the final argument");
  ok(args.includes("0:a?"), "audio is carried through when present and not demanded when absent");
  ok(args.includes("aac"), "audio is re-encoded rather than copied, which would fail on a container the codec cannot enter");
  const silent = buildArgs(plan, false);
  ok(
    !silent.includes("aac") && !silent.includes("-b:a"),
    "a source with no audio stream is given no audio encoder options, which would otherwise print an unused-AVOption warning"
  );
  ok(silent.includes("0:a?"), "a silent source still tolerates audio appearing, rather than refusing it");
  const screenplay = parseScreenplay(JSON.stringify({
    schema: "kai.demo-screenplay/v1",
    title: "issue demo",
    capture: { region: "0,0 1256x784", fps: 30 },
    steps: [
      { id: "st-1", action: "click", target: "new-issue", emphasis: { anchor: "center", zoom: 2, lead: 1, hold: 0.5, ease: 0.4, label: "the button" } },
      { id: "st-2", action: "type", target: "title-input", text: "hello", emphasis: { anchor: "leading", zoom: 2.2, lead: 0.8, hold: 1, ease: 0.4, label: "the title being typed" } }
    ]
  }));
  const take = parseTake(JSON.stringify({
    schema: "kai.demo-take/v1",
    take_id: "T1",
    recording: "raw.mp4",
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [
      { id: "st-1", start: 6.4, end: 6.7, rect: [1090, 190, 1230, 222] },
      { id: "st-2", start: 12.9, end: 15.2, rect: [78, 254, 940, 282] }
    ]
  }));
  const compiled = compile(screenplay, take, { output: "focused.mp4" });
  ok(compiled.plan.focus.length === 2, "a screenplay and a take compile into one segment per emphasised step");
  ok(compiled.plan.source === "raw.mp4", "the compiled plan renders the recording the take actually produced");
  ok(compiled.plan.compiled_from.take_id === "T1", "a compiled plan is stamped with the take it came from, so it cannot silently render against another recording");
  ok(compiled.plan.fps === 30 && compiled.plan.size === "1256x784", "the output frame and rate come from the take, not from a guess");
  const [button, typing] = compiled.plan.focus;
  ok(
    Math.abs(button.start - 5.4) < 1e-3 && Math.abs(button.end - 7.2) < 1e-3,
    "a segment starts a declared lead before the measured action and holds after it"
  );
  const half = 1 / (2 * 2.2);
  const textStart = 78 / 1256;
  ok(typing.x - half <= textStart, `the leading anchor keeps the left edge of the field in frame (visible from ${(typing.x - half).toFixed(3)}, field starts ${textStart.toFixed(3)})`);
  ok(typing.x < (78 + 940) / 2 / 1256, "the leading anchor sits left of the field centre, which is where the text actually is");
  ok(Math.abs(button.x - (1090 + 1230) / 2 / 1256) < 1e-3, "a click is centred on the rectangle it clicked");
  ok(button.end < typing.start, "compiled segments never overlap, so the camera is never asked to be in two places");
  parsePlan(JSON.stringify(compiled.plan));
  ok(true, "a compiled plan passes the same validation as a hand-written one");
  const collide = compile(screenplay, parseTake(JSON.stringify({
    schema: "kai.demo-take/v1",
    take_id: "T2",
    recording: "raw.mp4",
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [
      { id: "st-1", start: 6.4, end: 6.7, rect: [1090, 190, 1230, 222] },
      { id: "st-2", start: 7, end: 9, rect: [78, 254, 940, 282] }
    ]
  })));
  ok(collide.notes.some((n) => n.includes("overlapped")), "overlapping lead-in and hold are split rather than refused, and the split is reported");
  parsePlan(JSON.stringify(collide.plan));
  ok(true, "the split result is still renderable");
  const failed = compile(screenplay, parseTake(JSON.stringify({
    schema: "kai.demo-take/v1",
    take_id: "T3",
    recording: "raw.mp4",
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [{ id: "st-1", start: 6.4, end: 6.7, rect: [1090, 190, 1230, 222], status: "failed" }]
  })));
  ok(
    failed.plan.focus.length === 0 && failed.notes.some((n) => n.includes("failed")),
    "a step the take recorded as failed is not zoomed into, because magnifying a mistake is worse than not zooming"
  );
  const unrecorded = compile(screenplay, parseTake(JSON.stringify({
    schema: "kai.demo-take/v1",
    take_id: "T4",
    recording: "raw.mp4",
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [{ id: "st-1", start: 1, end: 2, rect: [10, 10, 20, 20] }]
  })));
  ok(unrecorded.notes.some((n) => n.includes("st-2")), "an emphasised step the take never recorded is named, not silently dropped");
  const samples = reviewSampleTimes({ start: 4, end: 8 });
  ok(samples.length === 4, "a review row samples four frames");
  ok(samples[0].at < 4 && samples[0].of === "source", "the first cell shows the source just before the camera moves");
  ok(
    samples[1].at === 6 && samples[2].at === 6,
    "the source and the render are sampled at the same instant, so the pair shows what the zoom did to it"
  );
  ok(reviewSampleTimes({ start: 0, end: 1 })[0].at === 0, "a segment at the very start does not sample a negative time");
  ok(reviewLegend(plan).includes("not evidence"), "the legend refuses to let a contact sheet stand in for grounding");
  const spaced = parsePlan(JSON.stringify({
    source: "my clips/a b.mp4",
    output: "out dir/c.mp4",
    focus: [{ start: 0, end: 3, x: 0.5, y: 0.5 }]
  }));
  const printed = printable(spaced);
  ok(printed.includes('"my clips/a b.mp4"'), "a path with a space survives --print as one argument");
  ok(/-vf "/.test(printed), "the filter is quoted in --print, so a shell cannot eat its parentheses");
  ok(quoteArg("simple.mp4") === "simple.mp4", "an ordinary path is not needlessly quoted");
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4", size: "00x00", focus: [] }),
    "too small",
    "a zero-sized output is refused rather than failing inside the encoder"
  );
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4", fps: 1e-7, focus: [] }),
    "fps must be",
    "a frame rate that would round to zero is refused"
  );
  rejects(
    JSON.stringify({ source: "a.mp4", output: "b.mp4", crf: 100, focus: [] }),
    "0..51",
    "a quality setting libx264 would reject is refused here, where the message is readable"
  );
  const many = parsePlan(JSON.stringify({
    source: "a.mp4",
    output: "b.mp4",
    focus: [
      { start: 0, end: 3, x: 0.2, y: 0.2, zoom: 2, ease: 0.3 },
      { start: 5, end: 9, x: 0.8, y: 0.9, zoom: 3, ease: 0.3 }
    ]
  }));
  ok(Math.abs(zoomAt(many, 4) - 1) < 1e-9, "the camera fully releases between two segments");
  ok(Math.abs(zoomAt(many, 7) - 3) < 1e-9, "the second segment reaches its own factor independently");
  ok(explain(many).includes("2 segment(s)"), "the explanation counts what will actually be rendered");
  console.log(`demo-zoom self-test: ${checks} checks passed`);
  return true;
}
function gridArgs(source, at, out, size = "1280x720") {
  safePath(source, "source");
  safePath(out, "out");
  if (!Number.isFinite(at) || at < 0) fail("--at must be a time in seconds, at or after zero");
  const parsed = parseSize(size);
  const shape = `scale=${parsed.w}:${parsed.h}:force_original_aspect_ratio=decrease,pad=${parsed.w}:${parsed.h}:(ow-iw)/2:(oh-ih)/2,setsar=1`;
  return [
    "-y",
    "-loglevel",
    "error",
    "-ss",
    String(at),
    "-i",
    source,
    "-vf",
    `${shape},drawgrid=w=iw/10:h=ih/10:t=1:c=cyan@0.7,drawgrid=w=iw/2:h=ih/2:t=2:c=yellow@0.9`,
    "-frames:v",
    "1",
    out
  ];
}
function grid(argv) {
  const source = argv[argv.indexOf("--grid") + 1];
  const atIndex = argv.indexOf("--at");
  const at = atIndex === -1 ? 0 : Number(argv[atIndex + 1]);
  const outIndex = argv.indexOf("--out");
  const out = outIndex === -1 ? "demo-grid.png" : argv[outIndex + 1];
  const sizeIndex = argv.indexOf("--size");
  const planIndex = argv.indexOf("--plan");
  let size = sizeIndex === -1 ? "1280x720" : argv[sizeIndex + 1];
  if (planIndex !== -1) {
    const planPath = argv[planIndex + 1];
    if (!planPath || !existsSync(planPath)) {
      console.error(`demo-zoom: plan not found: ${planPath || "(missing argument)"}`);
      return 1;
    }
    try {
      size = parsePlan(readFileSync(planPath, "utf8")).size.text;
    } catch (error) {
      console.error(`demo-zoom: ${error.message}`);
      console.error("The grid must match the size the render will use, so this is fatal rather than a fallback.");
      return 1;
    }
  }
  if (!source) {
    console.error("demo-zoom: --grid <video> is required");
    return 1;
  }
  if (!existsSync(source)) {
    console.error(`demo-zoom: video not found: ${source}`);
    return 1;
  }
  if (!findFfmpeg()) {
    console.error("demo-zoom: ffmpeg is not on PATH.");
    return 1;
  }
  let args;
  try {
    args = gridArgs(source, at, out, size);
  } catch (error) {
    console.error(`demo-zoom: ${error.message}`);
    return 1;
  }
  const run = spawnSync("ffmpeg", args, { encoding: "utf8" });
  if (run.status !== 0) {
    console.error(`demo-zoom: could not extract the frame:
${run.stderr}`);
    return 1;
  }
  console.log(`wrote ${out} -- the frame at ${at}s, ruled into tenths.`);
  console.log("Each cyan cell is 0.1 wide and 0.1 tall. The yellow lines mark 0.5.");
  console.log("Count cells from the top left to read the x and y for a focus segment.");
  return 0;
}
function verify() {
  if (!findFfmpeg()) {
    console.log("demo-zoom verify: ffmpeg absent, skipping");
    return 0;
  }
  const dir = mkdtempSync(join(tmpdir(), "demo-zoom-"));
  try {
    for (const rate of ["30", "60", "vfr"]) {
      const marker = join(dir, `marker-${rate}.mp4`);
      const px = join(dir, `px-${rate}.raw`);
      const mkArgs = [
        "-y",
        "-loglevel",
        "error",
        "-f",
        "lavfi",
        "-i",
        "color=c=black:size=1280x720:rate=30:duration=6"
      ];
      if (rate === "vfr") {
        mkArgs.push(
          "-vf",
          "drawbox=x=876:y=196:w=40:h=40:color=red:t=fill,select=lt(mod(n\\,7)\\,2)",
          "-fps_mode",
          "passthrough"
        );
      } else {
        mkArgs.push("-vf", "drawbox=x=876:y=196:w=40:h=40:color=red:t=fill", "-r", String(rate));
      }
      const mk = spawnSync("ffmpeg", [...mkArgs, marker], { encoding: "utf8" });
      if (mk.status !== 0) {
        console.error(`demo-zoom verify: could not build the ${rate} fixture: ${mk.stderr}`);
        return 1;
      }
      const plan = parsePlan(JSON.stringify({
        source: marker,
        output: join(dir, `out-${rate}.mp4`),
        fps: 30,
        focus: [{ start: 2, end: 6, x: 0.7, y: 0.3, zoom: 2.5, ease: 0.5 }]
      }));
      const sample = spawnSync("ffmpeg", [
        "-y",
        "-loglevel",
        "error",
        "-i",
        marker,
        "-vf",
        `${buildFilter(plan)},crop=w=2:h=2:x=639:y=359,format=rgb24`,
        "-f",
        "rawvideo",
        px
      ], { encoding: "utf8" });
      if (sample.status !== 0) {
        console.error(`demo-zoom verify: the filter was rejected by ffmpeg:
${sample.stderr}`);
        return 1;
      }
      const bytes = read(px);
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
      const expected = rate === "vfr" ? 170 : 180;
      if (frames < expected) {
        console.error(`demo-zoom verify: expected at least ${expected} output frames at 30fps, got ${frames}`);
        return 1;
      }
      if (!black || !red) {
        console.error(`demo-zoom verify: the ${rate} render did not land on the declared focus point at the declared time`);
        return 1;
      }
    }
    console.log("demo-zoom verify: the render centres on the declared point, at the declared time, from a 30fps, a 60fps, and a variable-rate source");
    return 0;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}
function reviewSampleTimes(segment) {
  const mid = (segment.start + segment.end) / 2;
  return [
    { at: Math.max(0, segment.start - 0.3), of: "source", what: "before" },
    { at: mid, of: "source", what: "at" },
    { at: mid, of: "render", what: "peak" },
    { at: Math.max(segment.start, segment.end - 0.2), of: "render", what: "end" }
  ];
}
var REVIEW_CELL = { w: 480, h: 300 };
function reviewLegend(plan) {
  const lines = ["contact sheet: one row per focus segment", ""];
  lines.push("  row  time            zoom   source before | source at | rendered peak | rendered end");
  plan.focus.forEach((segment, index) => {
    lines.push(`  ${String(index + 1).padStart(3)}  ${segment.start.toFixed(2)}-${segment.end.toFixed(2)}s`.padEnd(24) + `${`${segment.zoom}x`.padStart(5)}   ${segment.label}`);
  });
  lines.push("");
  lines.push("Look for two things a validator cannot see: whether the moment has already");
  lines.push("passed by the time the camera arrives, and whether what is changing is");
  lines.push("inside the crop. This sheet is not evidence the demo is correct.");
  return lines.join("\n");
}
function review(plan, out) {
  if (plan.focus.length === 0) {
    console.error("demo-zoom: this plan has no focus segments, so there is nothing to review");
    return 1;
  }
  for (const path of [plan.source, plan.output]) {
    if (!existsSync(path)) {
      console.error(`demo-zoom: --review compares the recording with the render, and ${path} does not exist yet. Render first.`);
      return 1;
    }
  }
  if (!findFfmpeg()) {
    console.error("demo-zoom: ffmpeg is not on PATH.");
    return 1;
  }
  const dir = mkdtempSync(join(tmpdir(), "demo-zoom-review-"));
  try {
    let n = 0;
    for (const segment of plan.focus) {
      for (const sample of reviewSampleTimes(segment)) {
        const cell = join(dir, `cell${String(n).padStart(3, "0")}.png`);
        const from = sample.of === "source" ? plan.source : plan.output;
        const run = spawnSync("ffmpeg", [
          "-y",
          "-loglevel",
          "error",
          "-ss",
          String(sample.at),
          "-i",
          from,
          "-frames:v",
          "1",
          "-vf",
          `scale=${REVIEW_CELL.w}:${REVIEW_CELL.h}:force_original_aspect_ratio=decrease,pad=${REVIEW_CELL.w}:${REVIEW_CELL.h}:(ow-iw)/2:(oh-ih)/2:color=0x202020,setsar=1`,
          cell
        ], { encoding: "utf8" });
        if (run.error || run.status !== 0 || !existsSync(cell)) {
          console.error(`demo-zoom: could not sample ${from} at ${sample.at.toFixed(2)}s`);
          return 1;
        }
        n += 1;
      }
    }
    const tile = spawnSync("ffmpeg", [
      "-y",
      "-loglevel",
      "error",
      "-f",
      "image2",
      "-i",
      join(dir, "cell%03d.png"),
      "-vf",
      `tile=4x${plan.focus.length}:margin=8:padding=4:color=0x101010`,
      "-frames:v",
      "1",
      out
    ], { encoding: "utf8" });
    if (tile.error || tile.status !== 0 || !existsSync(out)) {
      console.error(`demo-zoom: could not build the contact sheet${tile.stderr ? `: ${tile.stderr.trim()}` : ""}`);
      return 1;
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  console.log(reviewLegend(plan));
  console.log("");
  console.log(`wrote ${out}`);
  console.log("Open it. A render is not finished until someone has looked at it.");
  return 0;
}
function compileCommand(argv) {
  const i = argv.indexOf("--compile");
  const screenplayPath = argv[i + 1];
  const takePath = argv[i + 2];
  if (!screenplayPath || !takePath || screenplayPath.startsWith("-") || takePath.startsWith("-")) {
    console.error("demo-zoom: --compile needs a screenplay and a take manifest: --compile demo_screenplay.json demo_take.json");
    return 1;
  }
  for (const path of [screenplayPath, takePath]) {
    if (!existsSync(path)) {
      console.error(`demo-zoom: not found: ${path}`);
      return 1;
    }
  }
  const outIndex = argv.indexOf("--out");
  const out = outIndex === -1 ? null : argv[outIndex + 1];
  const outputIndex = argv.indexOf("--output");
  let result;
  try {
    const screenplay = parseScreenplay(readFileSync(screenplayPath, "utf8"));
    const take = parseTake(readFileSync(takePath, "utf8"));
    result = compile(screenplay, take, {
      output: outputIndex === -1 ? void 0 : argv[outputIndex + 1]
    });
  } catch (error) {
    console.error(`demo-zoom: ${error.message}`);
    return 1;
  }
  const text = `${JSON.stringify(result.plan, null, 2)}
`;
  let plan;
  try {
    plan = parsePlan(text);
  } catch (error) {
    console.error(`demo-zoom: the compiled plan is not renderable: ${error.message}`);
    return 1;
  }
  for (const note of result.notes) console.error(`  note: ${note}`);
  if (result.notes.length > 0) console.error("");
  if (out) {
    writeFileSync(out, text, "utf8");
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
  node demo-zoom.mjs --self-test              check the arithmetic, no ffmpeg needed
  node demo-zoom.mjs --verify                 prove a real render lands on target

A plan declares what the viewer should look at and when. Coordinates are
fractions of the frame: 0,0 is the top left and 1,1 the bottom right. They are
targets: a point close to an edge cannot be centred without showing padding, so
the shot stops at the edge. --explain reports where each shot really lands.`);
}
async function main(argv) {
  if (argv.includes("--self-test")) {
    selfTest();
    return 0;
  }
  if (argv.includes("--verify")) return verify();
  if (argv.includes("--compile")) return compileCommand(argv);
  if (argv.includes("--grid")) return grid(argv);
  if (argv.includes("--example")) {
    process.stdout.write(EXAMPLE);
    return 0;
  }
  if (argv.length === 0 || argv.includes("--help") || argv.includes("-h")) {
    usage();
    return argv.length === 0 ? 1 : 0;
  }
  const i = argv.indexOf("--plan");
  if (i === -1 || !argv[i + 1]) {
    console.error("demo-zoom: --plan <file> is required");
    return 1;
  }
  const file = argv[i + 1];
  if (!existsSync(file)) {
    console.error(`demo-zoom: plan not found: ${file}`);
    return 1;
  }
  let plan;
  try {
    plan = parsePlan(readFileSync(file, "utf8"));
  } catch (error) {
    console.error(`demo-zoom: ${error.message}`);
    return 1;
  }
  if (argv.includes("--explain")) {
    console.log(explain(plan, existsSync(plan.source) ? probeDuration(plan.source) : null));
    return 0;
  }
  if (argv.includes("--review")) {
    const at = argv.indexOf("--out");
    return review(plan, at === -1 || !argv[at + 1] ? "demo-review.png" : argv[at + 1]);
  }
  if (argv.includes("--print")) {
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
var invoked = process.argv[1] && process.argv[1].endsWith("demo-zoom.mjs");
if (invoked) {
  main(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
  });
}
export {
  anchorPoint,
  buildArgs,
  buildFilter,
  centerAt,
  compile,
  cursorOverlay,
  effectiveCenter,
  explain,
  gridArgs,
  normalizePrefix,
  overrunning,
  parseCursor,
  parsePlan,
  printable,
  probeDuration,
  probeHasAudio,
  quoteArg,
  reviewLegend,
  reviewSampleTimes,
  selfTest,
  weightAt,
  writeCursorImage,
  zoomAt
};
