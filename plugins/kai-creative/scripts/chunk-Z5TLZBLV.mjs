import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);

// src/creative/lib/screenplay.mjs
var SCREENPLAY_SCHEMA = "kai.demo-screenplay/v1";
var TAKE_SCHEMA = "kai.demo-take/v1";
var ACTIONS = /* @__PURE__ */ new Set(["hold", "click", "type", "key", "navigate"]);
var ANCHORS = /* @__PURE__ */ new Set(["center", "leading", "trailing", "pointer"]);
var MAX_STEPS = 200;
var PLACEMENTS_NAMES = /* @__PURE__ */ new Set(["social-teaser", "landing-hero", "readme", "walkthrough", "deep-walkthrough"]);
var INTENDS = /* @__PURE__ */ new Set(["intended-outcome", "primary-action"]);
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
function parseRegion(value, label = "capture.region") {
  let parts;
  if (Array.isArray(value)) parts = value;
  else if (typeof value === "string") {
    const m = /^\s*(-?\d+)\s*,\s*(-?\d+)\s+(\d+)\s*x\s*(\d+)\s*$/.exec(value);
    if (!m) fail(`${label} must look like "0,0 1280x800", got ${JSON.stringify(value)}`);
    parts = m.slice(1);
  } else fail(`${label} must be a string or an array of four numbers`);
  if (parts.length !== 4) fail(`${label} must have four values: x, y, width, height`);
  const [x, y, w, h] = parts.map((p, i) => {
    const n = num(p, `${label}[${i}]`);
    if (!Number.isInteger(n)) fail(`${label}[${i}] must be a whole pixel, got ${n}`);
    return n;
  });
  if (w <= 0 || h <= 0) fail(`${label} must have a positive width and height, got ${w}x${h}`);
  if (w % 2 !== 0 || h % 2 !== 0) fail(`${label} must be even in both dimensions for h264, got ${w}x${h}`);
  return { x, y, w, h, text: `${x},${y} ${w}x${h}` };
}
function parseRect(value, label) {
  if (!Array.isArray(value) || value.length !== 4) fail(`${label} must be [x0, y0, x1, y1]`);
  const [x0, y0, x1, y1] = value.map((p, i) => num(p, `${label}[${i}]`));
  if (x1 <= x0 || y1 <= y0) fail(`${label} must have x1 > x0 and y1 > y0, got ${JSON.stringify(value)}`);
  return { x0, y0, x1, y1 };
}
function parseScreenplay(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the screenplay is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== SCREENPLAY_SCHEMA) {
    fail(`the screenplay must declare "schema": "${SCREENPLAY_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  const title = str(raw.title, "title");
  const placement = raw.placement === void 0 || raw.placement === null ? null : PLACEMENTS_NAMES.has(raw.placement) ? raw.placement : fail(`placement must be one of ${[...PLACEMENTS_NAMES].join(", ")}, got ${JSON.stringify(raw.placement)}`);
  const maxSeconds = raw.max_seconds === void 0 || raw.max_seconds === null ? null : num(raw.max_seconds, "max_seconds", { min: 1, max: 7200 });
  const captions = raw.captions === true || (typeof raw.captions === "string" && raw.captions.trim() !== "" ? raw.captions : false);
  const capture = raw.capture ?? {};
  const region = parseRegion(capture.region ?? fail("capture.region is required: the driver has to know what rectangle of the screen it is recording"));
  const fps = num(capture.fps ?? 30, "capture.fps", { min: 1, max: 240 });
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail("steps must be a non-empty array");
  if (raw.steps.length > MAX_STEPS) fail(`a screenplay of ${raw.steps.length} steps is past the ${MAX_STEPS} this tool will drive; split the demo`);
  const seen = /* @__PURE__ */ new Set();
  const steps = raw.steps.map((step, i) => {
    const where = `steps[${i}]`;
    const id = str(step.id, `${where}.id`);
    if (seen.has(id)) fail(`${where}.id "${id}" is used twice; a take manifest is keyed by step id`);
    seen.add(id);
    const action = str(step.action, `${where}.action`);
    if (!ACTIONS.has(action)) fail(`${where}.action must be one of ${[...ACTIONS].join(", ")}, got "${action}"`);
    const out = {
      id,
      action,
      settle: num(step.settle ?? 0, `${where}.settle`, { min: 0, max: 120 }),
      note: typeof step.note === "string" ? step.note : ""
    };
    if (action === "hold") out.seconds = num(step.seconds ?? fail(`${where}.seconds is required for a hold`), `${where}.seconds`, { min: 0.1, max: 120 });
    if (action === "click") out.target = str(step.target, `${where}.target`);
    if (action === "type") {
      out.text = str(step.text, `${where}.text`);
      out.target = typeof step.target === "string" && step.target.trim() !== "" ? step.target : null;
      out.clear = step.clear === true;
      out.cps = num(step.cps ?? 18, `${where}.cps`, { min: 1, max: 100 });
    }
    if (action === "key") out.keys = str(step.keys, `${where}.keys`);
    if (action === "navigate") out.url = str(step.url, `${where}.url`);
    if (step.intends_to_show !== void 0 && step.intends_to_show !== null) {
      if (!INTENDS.has(step.intends_to_show)) fail(`${where}.intends_to_show must be one of ${[...INTENDS].join(", ")}, got ${JSON.stringify(step.intends_to_show)}`);
      out.intends_to_show = step.intends_to_show;
    } else out.intends_to_show = null;
    if (step.emphasis !== void 0 && step.emphasis !== null) {
      const e = step.emphasis;
      const anchor = e.anchor ?? "center";
      if (!ANCHORS.has(anchor)) fail(`${where}.emphasis.anchor must be one of ${[...ANCHORS].join(", ")}, got "${anchor}"`);
      if (anchor !== "pointer" && action === "hold") {
        fail(`${where} is a hold with no target, so its emphasis has nothing to anchor to; give the step a target or drop the emphasis`);
      }
      out.emphasis = {
        anchor,
        zoom: num(e.zoom ?? 2, `${where}.emphasis.zoom`, { min: 1, max: 10 }),
        ease: num(e.ease ?? 0.5, `${where}.emphasis.ease`, { min: 0, max: 10 }),
        lead: num(e.lead ?? 0.8, `${where}.emphasis.lead`, { min: 0, max: 30 }),
        hold: num(e.hold ?? 0.8, `${where}.emphasis.hold`, { min: 0, max: 30 }),
        label: typeof e.label === "string" && e.label.trim() !== "" ? e.label : out.note || id
      };
    } else out.emphasis = null;
    return out;
  });
  for (const [i, step] of raw.steps.entries()) {
    for (const forbidden of ["start", "end", "x", "y", "timestamp", "source_second"]) {
      if (step[forbidden] !== void 0) {
        fail(`steps[${i}] declares "${forbidden}". A screenplay carries intent, not measurements: source seconds and frame coordinates come from the take manifest, never from direction.`);
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
    steps,
    narration: parseNarrationBeats(raw.narration, steps)
  };
}
function parseNarrationBeats(raw, steps) {
  if (raw === void 0 || raw === null) return [];
  if (!Array.isArray(raw)) fail("narration must be an array of beats");
  if (raw.length > MAX_STEPS) fail(`a screenplay of ${raw.length} narration beats is past the ${MAX_STEPS} this tool will place; split the demo`);
  const order = new Map(steps.map((step, i) => [step.id, i]));
  const seen = /* @__PURE__ */ new Set();
  return raw.map((beat, i) => {
    const where = `narration[${i}]`;
    if (!beat || typeof beat !== "object" || Array.isArray(beat)) fail(`${where} must be an object`);
    for (const forbidden of ["start", "end", "at", "seconds", "duration", "durationSec", "offset", "timestamp", "source_second"]) {
      if (beat[forbidden] !== void 0) {
        fail(`${where} declares "${forbidden}". A narration beat carries intent, not measurements: how long a line takes to say is measured by the synthesiser and when a state appears is measured by the recorder. Neither can be known while writing.`);
      }
    }
    const id = str(beat.id, `${where}.id`);
    if (seen.has(id)) fail(`${where}.id "${id}" is used twice; a narration take is keyed by beat id`);
    seen.add(id);
    const text = str(beat.text, `${where}.text`);
    const span = beat.visual_span;
    if (!span || typeof span !== "object") fail(`${where}.visual_span is required: a beat has to say which visual states it describes, or nothing can decide whether it fits`);
    const from = str(span.from_step, `${where}.visual_span.from_step`);
    const through = str(span.through_step ?? span.from_step, `${where}.visual_span.through_step`);
    for (const [name, value] of [["from_step", from], ["through_step", through]]) {
      if (!order.has(value)) fail(`${where}.visual_span.${name} names "${value}", which is not a step in this screenplay`);
    }
    if (order.get(through) < order.get(from)) {
      fail(`${where}.visual_span runs backwards: "${through}" happens before "${from}"`);
    }
    let startAfter = null;
    if (beat.start_after !== void 0 && beat.start_after !== null) {
      startAfter = str(beat.start_after, `${where}.start_after`);
      if (!order.has(startAfter)) fail(`${where}.start_after names "${startAfter}", which is not a step in this screenplay`);
      if (order.get(startAfter) < order.get(from) || order.get(startAfter) > order.get(through)) {
        fail(`${where}.start_after names "${startAfter}", which is outside the beat's own visual span; a beat cannot wait for something it does not cover`);
      }
      if (order.get(startAfter) === order.get(through) && order.get(through) > order.get(from)) {
        fail(`${where}.start_after names "${startAfter}", which is also where its span ends, so the beat could only start at the instant it must be finished. Extend through_step to whatever stays on screen while the line is spoken.`);
      }
      if (order.get(startAfter) === order.get(through) && order.get(through) === order.get(from)) {
        fail(`${where} covers only "${from}" and also waits for it to finish, leaving no time in which to speak. Extend through_step past "${from}", or drop start_after if the line describes the step happening rather than its result.`);
      }
    }
    return {
      id,
      text,
      visual_span: { from_step: from, through_step: through },
      start_after: startAfter,
      voice: typeof beat.voice === "string" && beat.voice.trim() !== "" ? beat.voice : null
    };
  }).map((beat, i, all) => {
    if (i > 0 && order.get(beat.visual_span.from_step) < order.get(all[i - 1].visual_span.from_step)) {
      fail(`narration[${i}] ("${beat.id}") starts at an earlier point in the demo than the beat before it; narration must be authored in the order it is heard`);
    }
    return beat;
  });
}
function parseTake(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the take manifest is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== TAKE_SCHEMA) {
    fail(`the take manifest must declare "schema": "${TAKE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  const region = parseRegion(raw.capture?.region ?? fail("capture.region is required in a take manifest"));
  const fps = num(raw.capture?.fps ?? 30, "capture.fps", { min: 1, max: 240 });
  if (!Array.isArray(raw.steps) || raw.steps.length === 0) fail("a take manifest must record at least one step");
  const steps = raw.steps.map((step, i) => {
    const where = `steps[${i}]`;
    const start = num(step.start, `${where}.start`, { min: 0 });
    const end = num(step.end, `${where}.end`, { min: 0 });
    if (end < start) fail(`${where} ends before it starts`);
    return {
      id: str(step.id, `${where}.id`),
      start,
      end,
      rect: step.rect ? parseRect(step.rect, `${where}.rect`) : null,
      pointer: Array.isArray(step.pointer) ? { x: num(step.pointer[0], `${where}.pointer[0]`), y: num(step.pointer[1], `${where}.pointer[1]`) } : null,
      status: step.status === "failed" ? "failed" : step.status === "unsettled" ? "unsettled" : "ok"
    };
  });
  return {
    schema: TAKE_SCHEMA,
    take_id: str(raw.take_id, "take_id"),
    recording: str(raw.recording, "recording"),
    screenplay: typeof raw.screenplay === "string" ? raw.screenplay : null,
    recording_zero_spread: Number.isFinite(Number(raw.recording_zero_spread)) ? Number(raw.recording_zero_spread) : null,
    capture: { region, fps },
    steps,
    pointer: parsePointer(raw.pointer, region)
  };
}
function parsePointer(raw, region) {
  if (!raw || !Array.isArray(raw.samples) || raw.samples.length === 0) return null;
  const track = raw.samples.map((s, i) => {
    const at = `pointer.samples[${i}]`;
    return {
      t: num(s.t, `${at}.t`, { min: 0 }),
      x: Math.min(1, Math.max(0, num(s.x, `${at}.x`) / region.w)),
      y: Math.min(1, Math.max(0, num(s.y, `${at}.y`) / region.h)),
      visible: s.visible !== false
    };
  }).sort((a, b) => a.t - b.t);
  const clicks = Array.isArray(raw.clicks) ? raw.clicks.map((c, i) => num(c, `pointer.clicks[${i}]`, { min: 0 })) : [];
  return { track, clicks };
}

export {
  parseScreenplay,
  parseTake
};
