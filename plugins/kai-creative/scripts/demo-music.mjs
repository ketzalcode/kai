#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import "./runtime-creative.mjs";

// src/creative/demo-music.mjs
import { readFileSync, existsSync, writeFileSync, mkdirSync, realpathSync } from "node:fs";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
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
    // Freeform, operator-authored: where the track came from and what license
    // or internal authorization covers using it. Required because an
    // unreviewed oscillator bed and a licensed composition are not the same
    // claim, even when both decode cleanly.
    rights: str(raw.rights, "rights"),
    style: typeof raw.style === "string" && raw.style.trim() !== "" ? raw.style : null,
    tempo_bpm: raw.tempo_bpm === void 0 || raw.tempo_bpm === null ? null : num(raw.tempo_bpm, "tempo_bpm", { min: 20, max: 300 }),
    energy,
    // Measured by the same tool that would mix it (ffprobe), supplied here
    // rather than re-probed, so a cue with no measurement is refused rather
    // than silently treated as "long enough".
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
    operator: str(raw.operator, "operator"),
    accepted_at: str(raw.accepted_at, "accepted_at"),
    note: typeof raw.note === "string" ? raw.note : "",
    // What was actually auditioned before acceptance. "speech+music" means the
    // operator heard narration and music together, which is the only sample
    // this tool can honestly call a quality judgment; "music-only" is a weaker
    // claim and is recorded as such rather than silently upgraded.
    auditioned: raw.auditioned === "speech+music" ? "speech+music" : "music-only"
  };
}
function acceptCue(cueText, { operator, note = "", auditioned = "speech+music", now = () => (/* @__PURE__ */ new Date()).toISOString() } = {}) {
  str(operator, "operator");
  return {
    schema: ACCEPTANCE_SCHEMA,
    cue_hash: cueHash(cueText),
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
  if (acceptance.auditioned !== "speech+music") {
    fail(`this acceptance recorded a "${acceptance.auditioned}" audition, not "speech+music"; technical validity is not an aesthetic acceptance, and a music-only audition cannot judge fit against the narration`);
  }
}
function pathIdentity(path) {
  const absolute = resolve(path);
  const identity = existsSync(absolute) ? realpathSync(absolute) : absolute;
  return process.platform === "win32" ? identity.toLowerCase() : identity;
}
function assertSafeOutput(sources, out, replace) {
  const outputIdentity = pathIdentity(out);
  const collision = sources.find((source) => pathIdentity(source.path) === outputIdentity);
  if (collision) fail(`output path "${out}" is the same as the ${collision.role}; this must write a distinct file`);
  if (existsSync(out) && !replace) {
    fail(`output path "${out}" already exists; choose a new destination or pass --replace after authorizing replacement`);
  }
}
function buildAuditionArgs(plan, cue, { video, out, maxBeats = 3, replace = false }) {
  if (!plan.ok) fail("this narration plan was rejected, so there is no speech to audition music against; fix the rejections first");
  if (plan.beats.length === 0) fail("this narration plan places no beats");
  for (const label of [video, out]) {
    if (label.startsWith("-")) fail(`"${label}" starts with a dash and would be read as an option, not a file`);
  }
  const sampleBeats = plan.beats.slice(0, Math.max(1, maxBeats));
  const sampleEnd = sampleBeats[sampleBeats.length - 1].end + 1;
  assertSafeOutput(
    [
      { role: "video input", path: video },
      { role: "music candidate", path: cue.path },
      ...sampleBeats.map((beat) => ({ role: `narration clip "${beat.beat}"`, path: beat.path }))
    ],
    out,
    replace
  );
  const inputs = [];
  const chain = [];
  const voiceLabels = [];
  sampleBeats.forEach((beat, i) => {
    inputs.push("-i", beat.path);
    chain.push(`[${i + 2}:a]adelay=${Math.round(beat.start * 1e3)}:all=1[v${i}]`);
    voiceLabels.push(`[v${i}]`);
  });
  chain.push(`[1:a]atrim=0:${sampleEnd},afade=t=in:d=0.5[music]`);
  chain.push(`${voiceLabels.join("")}amix=inputs=${sampleBeats.length}:normalize=0:dropout_transition=0[voice]`);
  chain.push("[voice][music]amix=inputs=2:normalize=0:dropout_transition=0:weights=1 0.6[sample]");
  return [
    replace ? "-y" : "-n",
    "-hide_banner",
    "-v",
    "error",
    "-i",
    video,
    "-i",
    cue.path,
    ...inputs,
    "-filter_complex",
    chain.join(";"),
    "-map",
    "0:v",
    "-map",
    "[sample]",
    "-t",
    `${sampleEnd}`,
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    out
  ];
}
function usage() {
  console.log(`demo-music \u2014 audition and accept a background-music candidate

  --audition   <plan.json> --music <cue.json> --video <render.mp4> --out <sample.mp4> [--replace]
      Print the ffmpeg command for a short speech+music sample, for an operator to listen to.
      Existing outputs are refused unless replacement is explicitly authorized.

  --accept     <cue.json> --operator "<name>" [--note "<text>"] [--auditioned speech+music|music-only] --out <acceptance.json>
      Record that an operator judged this exact cue, keyed by its content hash.
`);
}
function flag(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}
function main(argv) {
  if (argv.includes("--audition")) {
    const plan = JSON.parse(readFileSync(argv[argv.indexOf("--audition") + 1], "utf8"));
    const cuePath = flag(argv, "--music") ?? fail("--audition needs --music <cue.json>");
    const video = flag(argv, "--video") ?? fail("--audition needs --video <render.mp4>");
    const out = flag(argv, "--out") ?? fail("--audition needs --out <sample.mp4>");
    if (!existsSync(video)) fail(`${video} does not exist`);
    const cue = parseMusicCue(readFileSync(cuePath, "utf8"));
    if (!existsSync(cue.path)) fail(`the cue names "${cue.path}", which does not exist`);
    console.log(["ffmpeg", ...buildAuditionArgs(plan, cue, { video, out, replace: argv.includes("--replace") })].map((a) => /[\s;'"[\]]/.test(a) ? `"${a}"` : a).join(" "));
    return 0;
  }
  if (argv.includes("--accept")) {
    const cuePath = argv[argv.indexOf("--accept") + 1];
    const cueText = readFileSync(cuePath, "utf8");
    parseMusicCue(cueText);
    const operator = flag(argv, "--operator") ?? fail('--accept needs --operator "<name>"');
    const note = flag(argv, "--note", "");
    const auditioned = flag(argv, "--auditioned", "speech+music");
    const out = flag(argv, "--out") ?? fail("--accept needs --out <acceptance.json>");
    const acceptance = acceptCue(cueText, { operator, note, auditioned });
    console.log(JSON.stringify(acceptance, null, 2));
    mkdirSync(dirname(out) || ".", { recursive: true });
    writeFileSync(out, JSON.stringify(acceptance, null, 2));
    console.log(`
wrote ${out}`);
    return 0;
  }
  usage();
  return 2;
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("demo-music.mjs")) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`demo-music: ${error.message}`);
    process.exit(1);
  }
}
export {
  ACCEPTANCE_SCHEMA,
  CUE_SCHEMA,
  acceptCue,
  assertSafeOutput,
  buildAuditionArgs,
  cueHash,
  parseMusicAcceptance,
  parseMusicCue,
  requireAcceptance
};
