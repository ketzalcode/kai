import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);

// src/creative/lib/media-output.mjs
import { existsSync, realpathSync, statSync } from "node:fs";
import { resolve } from "node:path";
function pathIdentity(path) {
  const absolute = resolve(path);
  const identity = existsSync(absolute) ? realpathSync(absolute) : absolute;
  return process.platform === "win32" ? identity.toLowerCase() : identity;
}
function assertSafeOutput(sources, out, replace) {
  const outputIdentity = pathIdentity(out);
  const outputStat = existsSync(out) ? statSync(out) : null;
  const collision = sources.find((source) => {
    if (pathIdentity(source.path) === outputIdentity) return true;
    const inputStat = outputStat && existsSync(source.path) ? statSync(source.path) : null;
    return inputStat && inputStat.dev === outputStat.dev && inputStat.ino === outputStat.ino;
  });
  if (collision) throw new Error(`output path "${out}" is the same as the ${collision.role}; this must write a distinct file`);
  if (existsSync(out) && !replace) {
    throw new Error(`output path "${out}" already exists; choose a new destination or pass --replace after authorizing replacement`);
  }
}

// src/creative/lib/music.mjs
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
var CUE_SCHEMA = "kai.demo-music-cue/v1";
var ACCEPTANCE_SCHEMA = "kai.demo-music-acceptance/v1";
var SOURCES = /* @__PURE__ */ new Set(["supplied", "licensed", "generated"]);
var ENERGIES = /* @__PURE__ */ new Set(["low", "medium", "high"]);
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
  if (typeof value !== "string" || value.trim() === "") fail(`${label} must be a non-empty string`);
  return value;
}
function cueHash(cueText) {
  return createHash("sha256").update(cueText.trim(), "utf8").digest("hex").slice(0, 16);
}
function parseMusicCue(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the music cue is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== CUE_SCHEMA) {
    fail(`the music cue must declare "schema": "${CUE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  const source = str(raw.source, "source");
  if (!SOURCES.has(source)) fail(`source must be one of ${[...SOURCES].join(", ")}, got ${JSON.stringify(source)}`);
  const energy = raw.energy === void 0 || raw.energy === null ? null : str(raw.energy, "energy");
  if (energy !== null && !ENERGIES.has(energy)) fail(`energy must be one of ${[...ENERGIES].join(", ")}, got ${JSON.stringify(energy)}`);
  return {
    schema: CUE_SCHEMA,
    path: str(raw.path, "path"),
    title: str(raw.title, "title"),
    source,
    rights: str(raw.rights, "rights"),
    style: typeof raw.style === "string" && raw.style.trim() !== "" ? raw.style : null,
    tempo_bpm: raw.tempo_bpm === void 0 || raw.tempo_bpm === null ? null : num(raw.tempo_bpm, "tempo_bpm", { min: 20, max: 300 }),
    energy,
    duration_sec: num(raw.duration_sec, "duration_sec", { min: 0.1, max: 36e3 })
  };
}
function parseMusicAcceptance(text) {
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
    cue_hash: str(raw.cue_hash, "cue_hash"),
    track_hash: str(raw.track_hash, "track_hash"),
    operator: str(raw.operator, "operator"),
    accepted_at: str(raw.accepted_at, "accepted_at"),
    note: typeof raw.note === "string" ? raw.note : "",
    auditioned: raw.auditioned === "speech+music" ? "speech+music" : "music-only"
  };
}
function acceptCue(cueText, { operator, note = "", auditioned = "speech+music", now = () => (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  str(operator, "operator");
  return {
    schema: ACCEPTANCE_SCHEMA,
    cue_hash: cueHash(cueText),
    track_hash: createHash("sha256").update(readFileSync(parseMusicCue(cueText).path)).digest("hex"),
    operator,
    accepted_at: now(),
    note,
    auditioned: auditioned === "speech+music" ? "speech+music" : "music-only"
  };
}
function requireAcceptance(cueText, acceptance) {
  const expected = cueHash(cueText);
  if (acceptance.cue_hash !== expected) {
    fail(`this acceptance names cue hash "${acceptance.cue_hash}", but the supplied cue hashes to "${expected}"; it was not accepted -- the cue changed, or a different candidate was approved`);
  }
  const trackHash = createHash("sha256").update(readFileSync(parseMusicCue(cueText).path)).digest("hex");
  if (acceptance.track_hash !== trackHash) fail("the music track bytes changed after acceptance; audition and accept the new track before using it");
  if (acceptance.auditioned !== "speech+music") {
    fail(`this acceptance recorded a "${acceptance.auditioned}" audition, not "speech+music"; technical validity is not an aesthetic acceptance, and a music-only audition cannot judge fit against the narration`);
  }
}

// src/creative/lib/screenplay.mjs
var SCREENPLAY_SCHEMA = "kai.demo-screenplay/v1";
var TAKE_SCHEMA = "kai.demo-take/v1";
var EDITED_TAKE_SCHEMA = "kai.demo-edited-take/v1";
var ACTIONS = /* @__PURE__ */ new Set(["hold", "click", "type", "key", "navigate"]);
var ANCHORS = /* @__PURE__ */ new Set(["center", "leading", "trailing", "pointer"]);
var TAKE_STATUSES = /* @__PURE__ */ new Set(["ok", "failed", "unsettled"]);
var MAX_STEPS = 200;
var PLACEMENTS_NAMES = /* @__PURE__ */ new Set(["social-teaser", "landing-hero", "readme", "walkthrough", "deep-walkthrough"]);
var CAPTURE_MODES = /* @__PURE__ */ new Set(["recorded", "replay", "illustration"]);
var INTENDS = /* @__PURE__ */ new Set(["intended-outcome", "primary-action"]);
function fail2(message) {
  throw new Error(message);
}
function num2(value, label, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) fail2(`${label} must be a number, got ${JSON.stringify(value)}`);
  if (n < min || n > max) fail2(`${label} must be within ${min}..${max}, got ${n}`);
  return n;
}
function str2(value, label) {
  if (typeof value !== "string" || value.trim() === "") fail2(`${label} must be a non-empty string`);
  return value;
}
function parseRegion(value, label = "capture.region") {
  let parts;
  if (Array.isArray(value)) parts = value;
  else if (typeof value === "string") {
    const m = /^\s*(-?\d+)\s*,\s*(-?\d+)\s+(\d+)\s*x\s*(\d+)\s*$/.exec(value);
    if (!m) fail2(`${label} must look like "0,0 1280x800", got ${JSON.stringify(value)}`);
    parts = m.slice(1);
  } else fail2(`${label} must be a string or an array of four numbers`);
  if (parts.length !== 4) fail2(`${label} must have four values: x, y, width, height`);
  const [x, y, w, h] = parts.map((p, i) => {
    const n = num2(p, `${label}[${i}]`);
    if (!Number.isInteger(n)) fail2(`${label}[${i}] must be a whole pixel, got ${n}`);
    return n;
  });
  if (w <= 0 || h <= 0) fail2(`${label} must have a positive width and height, got ${w}x${h}`);
  if (w % 2 !== 0 || h % 2 !== 0) fail2(`${label} must be even in both dimensions for h264, got ${w}x${h}`);
  return { x, y, w, h, text: `${x},${y} ${w}x${h}` };
}
function parseRect(value, label) {
  if (!Array.isArray(value) || value.length !== 4) fail2(`${label} must be [x0, y0, x1, y1]`);
  const [x0, y0, x1, y1] = value.map((p, i) => num2(p, `${label}[${i}]`));
  if (x1 <= x0 || y1 <= y0) fail2(`${label} must have x1 > x0 and y1 > y0, got ${JSON.stringify(value)}`);
  return { x0, y0, x1, y1 };
}
function parseScreenplay(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail2(`the screenplay is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== SCREENPLAY_SCHEMA) {
    fail2(`the screenplay must declare "schema": "${SCREENPLAY_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  const title = str2(raw.title, "title");
  const placement = raw.placement === void 0 || raw.placement === null ? null : PLACEMENTS_NAMES.has(raw.placement) ? raw.placement : fail2(`placement must be one of ${[...PLACEMENTS_NAMES].join(", ")}, got ${JSON.stringify(raw.placement)}`);
  const maxSeconds = raw.max_seconds === void 0 || raw.max_seconds === null ? null : num2(raw.max_seconds, "max_seconds", { min: 1, max: 7200 });
  const captions = raw.captions === true || (typeof raw.captions === "string" && raw.captions.trim() !== "" ? raw.captions : false);
  const capture = raw.capture ?? {};
  const region = parseRegion(capture.region ?? fail2("capture.region is required: the driver has to know what rectangle of the screen it is recording"));
  const fps = num2(capture.fps ?? 30, "capture.fps", { min: 1, max: 240 });
  const captureMode = raw.capture_mode === void 0 || raw.capture_mode === null ? "recorded" : raw.capture_mode;
  if (!CAPTURE_MODES.has(captureMode)) {
    fail2(`capture_mode must be one of ${[...CAPTURE_MODES].join(", ")}, got ${JSON.stringify(raw.capture_mode)}`);
  }
  const captureModeNote = captureMode === "recorded" ? null : str2(raw.capture_mode_note, "capture_mode_note (required to explain a replay or illustration, since it is not an actual recording)");
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail2("steps must be a non-empty array");
  if (raw.steps.length > MAX_STEPS) fail2(`a screenplay of ${raw.steps.length} steps is past the ${MAX_STEPS} this tool will drive; split the demo`);
  const seen = /* @__PURE__ */ new Set();
  const steps = raw.steps.map((step, i) => {
    const where = `steps[${i}]`;
    const id = str2(step.id, `${where}.id`);
    if (seen.has(id)) fail2(`${where}.id "${id}" is used twice; a take manifest is keyed by step id`);
    seen.add(id);
    const action = str2(step.action, `${where}.action`);
    if (!ACTIONS.has(action)) fail2(`${where}.action must be one of ${[...ACTIONS].join(", ")}, got "${action}"`);
    const out = {
      id,
      action,
      settle: num2(step.settle ?? 0, `${where}.settle`, { min: 0, max: 120 }),
      note: typeof step.note === "string" ? step.note : ""
    };
    if (action === "hold") out.seconds = num2(step.seconds ?? fail2(`${where}.seconds is required for a hold`), `${where}.seconds`, { min: 0.1, max: 120 });
    if (action === "click") out.target = str2(step.target, `${where}.target`);
    if (action === "type") {
      out.text = str2(step.text, `${where}.text`);
      out.target = typeof step.target === "string" && step.target.trim() !== "" ? step.target : null;
      out.clear = step.clear === true;
      out.cps = num2(step.cps ?? 18, `${where}.cps`, { min: 1, max: 100 });
    }
    if (action === "key") out.keys = str2(step.keys, `${where}.keys`);
    if (action === "navigate") out.url = str2(step.url, `${where}.url`);
    if (step.intends_to_show !== void 0 && step.intends_to_show !== null) {
      if (!INTENDS.has(step.intends_to_show)) fail2(`${where}.intends_to_show must be one of ${[...INTENDS].join(", ")}, got ${JSON.stringify(step.intends_to_show)}`);
      out.intends_to_show = step.intends_to_show;
    } else out.intends_to_show = null;
    if (step.emphasis !== void 0 && step.emphasis !== null) {
      const e = step.emphasis;
      const anchor = e.anchor ?? "center";
      if (!ANCHORS.has(anchor)) fail2(`${where}.emphasis.anchor must be one of ${[...ANCHORS].join(", ")}, got "${anchor}"`);
      if (anchor !== "pointer" && action === "hold") {
        fail2(`${where} is a hold with no target, so its emphasis has nothing to anchor to; give the step a target or drop the emphasis`);
      }
      out.emphasis = {
        anchor,
        zoom: num2(e.zoom ?? 2, `${where}.emphasis.zoom`, { min: 1, max: 10 }),
        ease: num2(e.ease ?? 0.5, `${where}.emphasis.ease`, { min: 0, max: 10 }),
        lead: num2(e.lead ?? 0.8, `${where}.emphasis.lead`, { min: 0, max: 30 }),
        hold: num2(e.hold ?? 0.8, `${where}.emphasis.hold`, { min: 0, max: 30 }),
        label: typeof e.label === "string" && e.label.trim() !== "" ? e.label : out.note || id
      };
    } else out.emphasis = null;
    return out;
  });
  for (const [i, step] of raw.steps.entries()) {
    for (const forbidden of ["start", "end", "x", "y", "timestamp", "source_second"]) {
      if (step[forbidden] !== void 0) {
        fail2(`steps[${i}] declares "${forbidden}". A screenplay carries intent, not measurements: source seconds and frame coordinates come from the take manifest, never from direction.`);
      }
    }
  }
  return {
    schema: SCREENPLAY_SCHEMA,
    title,
    placement,
    max_seconds: maxSeconds,
    captions,
    capture: { region, fps },
    capture_mode: captureMode,
    capture_mode_note: captureModeNote,
    steps,
    narration: parseNarrationBeats(raw.narration, steps)
  };
}
function parseNarrationBeats(raw, steps) {
  if (raw === void 0 || raw === null) return [];
  if (!Array.isArray(raw)) fail2("narration must be an array of beats");
  if (raw.length > MAX_STEPS) fail2(`a screenplay of ${raw.length} narration beats is past the ${MAX_STEPS} this tool will place; split the demo`);
  const order = new Map(steps.map((step, i) => [step.id, i]));
  const seen = /* @__PURE__ */ new Set();
  return raw.map((beat, i) => {
    const where = `narration[${i}]`;
    if (!beat || typeof beat !== "object" || Array.isArray(beat)) fail2(`${where} must be an object`);
    for (const forbidden of ["start", "end", "at", "seconds", "duration", "durationSec", "offset", "timestamp", "source_second"]) {
      if (beat[forbidden] !== void 0) {
        fail2(`${where} declares "${forbidden}". A narration beat carries intent, not measurements: how long a line takes to say is measured by the synthesiser and when a state appears is measured by the recorder. Neither can be known while writing.`);
      }
    }
    const id = str2(beat.id, `${where}.id`);
    if (seen.has(id)) fail2(`${where}.id "${id}" is used twice; a narration take is keyed by beat id`);
    seen.add(id);
    const text = str2(beat.text, `${where}.text`);
    const span = beat.visual_span;
    if (!span || typeof span !== "object") fail2(`${where}.visual_span is required: a beat has to say which visual states it describes, or nothing can decide whether it fits`);
    const from = str2(span.from_step, `${where}.visual_span.from_step`);
    const through = str2(span.through_step ?? span.from_step, `${where}.visual_span.through_step`);
    for (const [name, value] of [["from_step", from], ["through_step", through]]) {
      if (!order.has(value)) fail2(`${where}.visual_span.${name} names "${value}", which is not a step in this screenplay`);
    }
    if (order.get(through) < order.get(from)) {
      fail2(`${where}.visual_span runs backwards: "${through}" happens before "${from}"`);
    }
    let startAfter = null;
    if (beat.start_after !== void 0 && beat.start_after !== null) {
      startAfter = str2(beat.start_after, `${where}.start_after`);
      if (!order.has(startAfter)) fail2(`${where}.start_after names "${startAfter}", which is not a step in this screenplay`);
      if (order.get(startAfter) < order.get(from) || order.get(startAfter) > order.get(through)) {
        fail2(`${where}.start_after names "${startAfter}", which is outside the beat's own visual span; a beat cannot wait for something it does not cover`);
      }
      if (order.get(startAfter) === order.get(through) && order.get(through) > order.get(from)) {
        fail2(`${where}.start_after names "${startAfter}", which is also where its span ends, so the beat could only start at the instant it must be finished. Extend through_step to whatever stays on screen while the line is spoken.`);
      }
      if (order.get(startAfter) === order.get(through) && order.get(through) === order.get(from)) {
        fail2(`${where} covers only "${from}" and also waits for it to finish, leaving no time in which to speak. Extend through_step past "${from}", or drop start_after if the line describes the step happening rather than its result.`);
      }
    }
    let referencesStep = null;
    if (beat.references_step !== void 0 && beat.references_step !== null) {
      referencesStep = str2(beat.references_step, `${where}.references_step`);
      if (!order.has(referencesStep)) fail2(`${where}.references_step names "${referencesStep}", which is not a step in this screenplay`);
      if (order.get(referencesStep) < order.get(from) || order.get(referencesStep) > order.get(through)) {
        fail2(`${where}.references_step names "${referencesStep}", which is outside the beat's own visual span; a beat cannot claim evidence it does not cover`);
      }
      if (startAfter === null || order.get(startAfter) < order.get(referencesStep)) {
        fail2(`${where}.references_step names "${referencesStep}" as the evidence this beat is about, but start_after is ${startAfter ? `"${startAfter}"` : "unset"}, which does not gate on it; the line could begin before that evidence is on screen. Set start_after to "${referencesStep}" or a later step in the span.`);
      }
    }
    return {
      id,
      text,
      visual_span: { from_step: from, through_step: through },
      start_after: startAfter,
      references_step: referencesStep,
      voice: typeof beat.voice === "string" && beat.voice.trim() !== "" ? beat.voice : null
    };
  }).map((beat, i, all) => {
    if (i > 0 && order.get(beat.visual_span.from_step) < order.get(all[i - 1].visual_span.from_step)) {
      fail2(`narration[${i}] ("${beat.id}") starts at an earlier point in the demo than the beat before it; narration must be authored in the order it is heard`);
    }
    return beat;
  });
}
function parseTake(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail2(`the take manifest is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== TAKE_SCHEMA) {
    fail2(`the take manifest must declare "schema": "${TAKE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  const region = parseRegion(raw.capture?.region ?? fail2("capture.region is required in a take manifest"));
  const fps = num2(raw.capture?.fps ?? 30, "capture.fps", { min: 1, max: 240 });
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail2("a take manifest must record at least one step");
  const steps = raw.steps.map((step, i) => {
    const where = `steps[${i}]`;
    const start = num2(step.start, `${where}.start`, { min: 0 });
    const end = num2(step.end, `${where}.end`, { min: 0 });
    if (end < start) fail2(`${where} ends before it starts`);
    if (!TAKE_STATUSES.has(step.status)) {
      fail2(`${where}.status must be one of ${[...TAKE_STATUSES].join(", ")}, got ${JSON.stringify(step.status ?? null)}`);
    }
    return {
      id: str2(step.id, `${where}.id`),
      start,
      end,
      rect: step.rect ? parseRect(step.rect, `${where}.rect`) : null,
      pointer: Array.isArray(step.pointer) ? { x: num2(step.pointer[0], `${where}.pointer[0]`), y: num2(step.pointer[1], `${where}.pointer[1]`) } : null,
      status: step.status
    };
  });
  return {
    schema: TAKE_SCHEMA,
    take_id: str2(raw.take_id, "take_id"),
    recording: str2(raw.recording, "recording"),
    screenplay: typeof raw.screenplay === "string" ? raw.screenplay : null,
    recording_zero_spread: Number.isFinite(Number(raw.recording_zero_spread)) ? Number(raw.recording_zero_spread) : null,
    capture: { region, fps },
    steps,
    pointer: parsePointer(raw.pointer, region)
  };
}
function parseEditedTake(text, sourceTake) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail2(`the edited take is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== EDITED_TAKE_SCHEMA) {
    fail2(`the edited take must declare "schema": "${EDITED_TAKE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  if (!sourceTake || sourceTake.schema !== TAKE_SCHEMA) {
    fail2("an edited take must be validated against its parsed source capture take (kai.demo-take/v1); provenance cannot be assumed");
  }
  if (str2(raw.source_take_id, "source_take_id") !== sourceTake.take_id) {
    fail2(`source_take_id "${raw.source_take_id}" does not match the supplied source take's take_id "${sourceTake.take_id}"; this edited take was not cut from that recording`);
  }
  const region = parseRegion(raw.capture?.region ?? fail2("capture.region is required in an edited take"));
  const fps = num2(raw.capture?.fps ?? 30, "capture.fps", { min: 1, max: 240 });
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail2("an edited take must record at least one step");
  const sourceSteps = new Map(sourceTake.steps.map((step) => [step.id, step]));
  const seen = /* @__PURE__ */ new Set();
  const steps = raw.steps.map((step, i) => {
    const where = `steps[${i}]`;
    const id = str2(step.id, `${where}.id`);
    if (seen.has(id)) fail2(`${where}.id "${id}" is used twice; an edited take is keyed by step id`);
    seen.add(id);
    const source = sourceSteps.get(id);
    if (!source) fail2(`${where}.id "${id}" does not appear in the source take; an edit can trim or reorder a measured step, it cannot invent one`);
    const start = num2(step.start, `${where}.start`, { min: 0 });
    const end = num2(step.end, `${where}.end`, { min: 0 });
    if (end < start) fail2(`${where} ends before it starts`);
    const status = step.status === void 0 ? source.status : step.status;
    if (!TAKE_STATUSES.has(status)) {
      fail2(`${where}.status must be one of ${[...TAKE_STATUSES].join(", ")}, got ${JSON.stringify(status)}`);
    }
    if (status !== source.status) {
      fail2(`${where}.status is "${status}", but the source take measured "${id}" as "${source.status}"; an edited take may re-time or drop a step, it may not change what the recorder saw`);
    }
    return {
      id,
      start,
      end,
      status,
      rect: step.rect ? parseRect(step.rect, `${where}.rect`) : source.rect,
      pointer: Array.isArray(step.pointer) ? { x: num2(step.pointer[0], `${where}.pointer[0]`), y: num2(step.pointer[1], `${where}.pointer[1]`) } : source.pointer
    };
  });
  const droppedSteps = sourceTake.steps.map((step) => step.id).filter((id) => !seen.has(id));
  return {
    schema: EDITED_TAKE_SCHEMA,
    take_id: str2(raw.take_id, "take_id"),
    source_take_id: sourceTake.take_id,
    // The file this timeline actually describes: an assembled/rendered cut,
    // not the raw capture. It may equal the source recording when the edit
    // only reorders or trims within the same single file.
    recording: str2(raw.recording, "recording"),
    screenplay: typeof raw.screenplay === "string" ? raw.screenplay : sourceTake.screenplay,
    capture: { region, fps },
    steps,
    // Steps present in the source recording but cut from this timeline. A
    // narration beat spanning a dropped step has nothing left to place
    // against, and callers need this list to say why, not to guess.
    dropped_steps: droppedSteps,
    pointer: parsePointer(raw.pointer, region)
  };
}
function parsePointer(raw, region) {
  if (!raw || !Array.isArray(raw.samples) || raw.samples.length === 0) return null;
  const track = raw.samples.map((s, i) => {
    const at = `pointer.samples[${i}]`;
    return {
      t: num2(s.t, `${at}.t`, { min: 0 }),
      x: Math.min(1, Math.max(0, num2(s.x, `${at}.x`) / region.w)),
      y: Math.min(1, Math.max(0, num2(s.y, `${at}.y`) / region.h)),
      visible: s.visible !== false
    };
  }).sort((a, b) => a.t - b.t);
  const clicks = Array.isArray(raw.clicks) ? raw.clicks.map((c, i) => num2(c, `pointer.clicks[${i}]`, { min: 0 })) : [];
  return { track, clicks };
}

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

export {
  cursorPng,
  assertSafeOutput,
  CUE_SCHEMA,
  ACCEPTANCE_SCHEMA,
  cueHash,
  parseMusicCue,
  parseMusicAcceptance,
  acceptCue,
  requireAcceptance,
  TAKE_SCHEMA,
  EDITED_TAKE_SCHEMA,
  parseScreenplay,
  parseTake,
  parseEditedTake
};
