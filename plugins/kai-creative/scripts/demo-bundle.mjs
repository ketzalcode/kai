#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  EDITED_TAKE_SCHEMA,
  TAKE_SCHEMA,
  cueHash,
  parseEditedTake,
  parseMusicAcceptance,
  parseMusicCue,
  parseScreenplay,
  parseTake,
  requireAcceptance
} from "./runtime-creative.mjs";

// src/creative/demo-bundle.mjs
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync, lstatSync, statSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, join, extname, resolve } from "node:path";
var BUNDLE_SCHEMA = "kai.demo-edit-bundle/v1";
var VARIANTS = /* @__PURE__ */ new Set(["draft", "accepted"]);
function fail(message) {
  throw new Error(message);
}
function loadTake(takePath, sourceTakePath) {
  const text = readFileSync(takePath, "utf8");
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`${takePath} is not valid JSON: ${error.message}`);
  }
  if (raw.schema === TAKE_SCHEMA) return { take: parseTake(text), schema: TAKE_SCHEMA, sourceTakeId: null };
  if (raw.schema === EDITED_TAKE_SCHEMA) {
    if (!sourceTakePath) fail(`${takePath} is an edited take (${EDITED_TAKE_SCHEMA}); bundling it needs the raw source take too, to record the edit's provenance`);
    const sourceTake = parseTake(readFileSync(sourceTakePath, "utf8"));
    const edited = parseEditedTake(text, sourceTake);
    return { take: edited, schema: EDITED_TAKE_SCHEMA, sourceTakeId: sourceTake.take_id };
  }
  fail(`${takePath} must declare "schema": "${TAKE_SCHEMA}" or "${EDITED_TAKE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
}
function loadAcceptedMusic(cuePath, acceptancePath) {
  const cueText = readFileSync(cuePath, "utf8");
  const cue = parseMusicCue(cueText);
  const acceptance = parseMusicAcceptance(readFileSync(acceptancePath, "utf8"));
  requireAcceptance(cueText, acceptance);
  return { cue, cueText, cuePath, acceptancePath, acceptance };
}
function buildBundleManifest({
  variant,
  screenplayPath,
  takePath,
  sourceTakePath = null,
  narrationPlanPath,
  renderPath,
  musicCuePath = null,
  musicAcceptancePath = null
}) {
  if (!VARIANTS.has(variant)) fail(`variant must be one of ${[...VARIANTS].join(", ")}, got ${JSON.stringify(variant)}`);
  if (!existsSync(renderPath)) fail(`${renderPath} (the final render) does not exist`);
  const screenplay = parseScreenplay(readFileSync(screenplayPath, "utf8"));
  const { take, schema: takeSchema, sourceTakeId } = loadTake(takePath, sourceTakePath);
  let plan;
  try {
    plan = JSON.parse(readFileSync(narrationPlanPath, "utf8"));
  } catch (error) {
    fail(`${narrationPlanPath} is not valid JSON: ${error.message}`);
  }
  if (plan.ok !== true) {
    fail(`${narrationPlanPath} is a rejected narration plan (ok: false); a rejected placement is not ready to hand off. Resolve its rejections and re-place first.`);
  }
  if (!Array.isArray(plan.beats) || plan.beats.length === 0) fail(`${narrationPlanPath} places no narration beats`);
  if (plan.schema !== "kai.demo-narration-plan/v1") fail("the narration plan must use the canonical plan schema");
  if (plan.take_id !== take.take_id || plan.recording !== take.recording) fail("the narration plan and take identify different recordings");
  const authoredBeats = new Map(screenplay.narration.map((beat) => [beat.id, beat]));
  if (authoredBeats.size !== plan.beats.length) fail("the narration plan does not cover the current screenplay beats");
  const beatIds = /* @__PURE__ */ new Set();
  for (const beat of plan.beats) {
    if (!/^[a-z0-9][a-z0-9._-]*$/i.test(beat.beat ?? "") || beatIds.has(beat.beat)) fail("bundle narration beat IDs must be unique filename-safe identifiers");
    beatIds.add(beat.beat);
    if (authoredBeats.get(beat.beat)?.text !== beat.text) fail(`the narration plan carries stale or unrelated text for "${beat.beat}"`);
    if (!Number.isFinite(beat.start) || !Number.isFinite(beat.end) || beat.start < 0 || beat.end <= beat.start) fail(`invalid measured timing for narration beat "${beat.beat}"`);
    if (!existsSync(beat.path)) fail(`the narration plan names clip "${beat.path}" for beat "${beat.beat}", which does not exist`);
  }
  const missing = [];
  let music = null;
  if (musicCuePath || musicAcceptancePath) {
    if (!musicCuePath || !musicAcceptancePath) fail("supplying music needs both a cue and its acceptance; a cue with no recorded acceptance is not an included track");
    music = loadAcceptedMusic(musicCuePath, musicAcceptancePath);
    if (!existsSync(music.cue.path)) fail(`the music cue names "${music.cue.path}", which does not exist`);
  } else {
    missing.push({ component: "music", reason: "no accepted music track was supplied; the demo hands off narration-only" });
  }
  const timelineEnd = Math.max(...plan.beats.map((beat) => beat.end));
  const recordingPath = resolve(dirname(takePath), take.recording);
  const recording = existsSync(recordingPath) ? recordingPath : null;
  if (!recording) missing.push({ component: "source-recording", reason: "the source footage was not available; the take alone cannot reconstruct the recording" });
  const rawRecordingPath = sourceTakePath ? resolve(dirname(sourceTakePath), parseTake(readFileSync(sourceTakePath, "utf8")).recording) : null;
  const rawRecording = rawRecordingPath && existsSync(rawRecordingPath) ? rawRecordingPath : null;
  if (sourceTakePath && !rawRecording) missing.push({ component: "raw-recording", reason: "the edited timeline source capture is unavailable" });
  return {
    schema: BUNDLE_SCHEMA,
    variant,
    native_export: {
      supported: false,
      note: "This bundle does not produce or claim a native editor project (for example a Premiere or Final Cut project) export. It is an editor-neutral folder of aligned source files and a manifest."
    },
    distribution: "private",
    distribution_note: "Packaging this bundle does not authorize publishing it. Treat its contents as the same typed private evidence the source assets already were.",
    render: { role: "final-render", path: renderPath, variant },
    screenplay: { role: "source-screenplay", path: screenplayPath, title: screenplay.title, placement: screenplay.placement },
    take: {
      role: "source-take",
      path: takePath,
      schema: takeSchema,
      take_id: take.take_id ?? null,
      source_take_id: sourceTakeId,
      source_path: sourceTakePath,
      recording_path: recording,
      raw_recording_path: rawRecording
    },
    narration: {
      role: "aligned-narration",
      plan_path: narrationPlanPath,
      timeline_end_sec: timelineEnd,
      beats: plan.beats.map((beat) => ({
        id: beat.beat,
        path: beat.path,
        start: beat.start,
        end: beat.end,
        text: beat.text ?? null
      }))
    },
    music: music ? {
      role: "accepted-music",
      cue_path: music.cuePath,
      track_path: music.cue.path,
      title: music.cue.title,
      source: music.cue.source,
      rights: music.cue.rights,
      cue_hash: cueHash(music.cueText),
      accepted_by: music.acceptance.operator ?? null,
      accepted_at: music.acceptance.accepted_at ?? null,
      acceptance_path: music.acceptancePath
    } : null,
    missing
  };
}
function assertEmptyOrReplace(destDir, replace) {
  if (!existsSync(destDir)) return;
  const entries = readdirSync(destDir);
  if (entries.length > 0 && !replace) {
    fail(`${destDir} already exists and is not empty; pass --replace to write into it anyway (existing files with the same bundle-relative name will be overwritten)`);
  }
}
function writeBundle(manifest, destDir, { replace = false, renderDurationSec = null } = {}) {
  assertEmptyOrReplace(destDir, replace);
  if (existsSync(destDir) && lstatSync(destDir).isSymbolicLink()) fail("bundle destination must not be a link");
  mkdirSync(destDir, { recursive: true });
  mkdirSync(join(destDir, "source"), { recursive: true });
  mkdirSync(join(destDir, "narration"), { recursive: true });
  const written = [];
  const copy = (src, relDest) => {
    const dest = join(destDir, relDest);
    if (resolve(src) === resolve(dest)) fail("bundle destination aliases a source asset");
    let parent = resolve(destDir);
    for (const part of relDest.split("/").slice(0, -1)) {
      parent = join(parent, part);
      if (existsSync(parent) && lstatSync(parent).isSymbolicLink()) fail("bundle subdirectories must not be links");
    }
    if (existsSync(dest) && lstatSync(dest).isSymbolicLink()) fail("bundle files must not be links");
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(resolve(src), dest);
    written.push(relDest);
    return relDest;
  };
  const out = JSON.parse(JSON.stringify(manifest));
  out.render.path = copy(manifest.render.path, `render/final${extname(manifest.render.path) || ".mp4"}`);
  out.screenplay.path = copy(manifest.screenplay.path, "source/screenplay.json");
  out.take.path = copy(manifest.take.path, "source/take.json");
  if (manifest.take.source_path) out.take.source_path = copy(manifest.take.source_path, "source/raw-take.json");
  if (manifest.take.recording_path) out.take.recording_path = copy(manifest.take.recording_path, `source/recording${extname(manifest.take.recording_path)}`);
  if (manifest.take.raw_recording_path) out.take.raw_recording_path = copy(manifest.take.raw_recording_path, `source/raw-recording${extname(manifest.take.raw_recording_path)}`);
  out.narration.plan_path = copy(manifest.narration.plan_path, "source/narration-plan.json");
  out.narration.beats = manifest.narration.beats.map((beat) => ({
    ...beat,
    path: copy(beat.path, `narration/clips/${beat.id}${extname(beat.path) || ".wav"}`)
  }));
  if (manifest.music) {
    mkdirSync(join(destDir, "music"), { recursive: true });
    out.music.cue_path = copy(manifest.music.cue_path, "music/cue.json");
    out.music.acceptance_path = copy(manifest.music.acceptance_path, "music/acceptance.json");
    out.music.track_path = copy(manifest.music.track_path, `music/track${extname(manifest.music.track_path)}`);
  }
  if (renderDurationSec !== null) {
    const stemPath = join(destDir, "narration", "voice-aligned.wav");
    const result = spawnSync("ffmpeg", buildNarrationStemArgs(manifest, stemPath, renderDurationSec, replace), { encoding: "utf8" });
    if (result.error || result.status !== 0) fail(`aligned narration export failed: ${result.error?.message ?? result.stderr}`);
    out.narration.aligned_stem = "narration/voice-aligned.wav";
    out.narration.timeline_end_sec = renderDurationSec;
    written.push(out.narration.aligned_stem);
  } else {
    out.missing.push({ component: "aligned-narration-stem", reason: "only timed source clips were packaged; no measured render duration was supplied for a full-length stem" });
  }
  const manifestPath = join(destDir, "manifest.json");
  writeFileSync(manifestPath, JSON.stringify(out, null, 2));
  written.push("manifest.json");
  return { destDir, written, manifest: out };
}
function buildNarrationStemArgs(manifest, out, durationSec, replace = false) {
  if (!Number.isFinite(durationSec) || durationSec < manifest.narration.timeline_end_sec) fail("measured render duration must cover every narration beat");
  const outputStat = existsSync(out) ? statSync(out) : null;
  for (const beat of manifest.narration.beats) {
    const inputStat = outputStat && existsSync(beat.path) ? statSync(beat.path) : null;
    if (resolve(beat.path) === resolve(out) || inputStat && inputStat.dev === outputStat.dev && inputStat.ino === outputStat.ino) {
      fail("aligned stem output must be distinct from every source clip");
    }
  }
  const inputs = manifest.narration.beats.flatMap((beat) => ["-i", beat.path]);
  const delays = manifest.narration.beats.map((beat, i) => `[${i}:a]adelay=${Math.round(beat.start * 1e3)}:all=1[v${i}]`);
  const voices = manifest.narration.beats.map((_, i) => `[v${i}]`).join("");
  const chain = [...delays, `${voices}amix=inputs=${manifest.narration.beats.length}:normalize=0:dropout_transition=0,apad=whole_dur=${durationSec},atrim=duration=${durationSec}[voice]`].join(";");
  return [replace ? "-y" : "-n", "-v", "error", ...inputs, "-filter_complex", chain, "-map", "[voice]", "-c:a", "pcm_s16le", out];
}
function renderDuration(path) {
  const result = spawnSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "default=nw=1:nk=1", path], { encoding: "utf8" });
  if (result.error || result.status !== 0) fail(`cannot measure final render: ${result.error?.message ?? result.stderr}`);
  const seconds = Number(result.stdout.trim());
  if (!Number.isFinite(seconds) || seconds <= 0) fail("final render has no measurable positive duration");
  return seconds;
}
function usage() {
  console.log(`demo-bundle \u2014 assemble an editor-neutral edit-ready handoff

  --build --screenplay <screenplay.json> --take <take.json> [--source-take <raw_take.json>]
          --plan <narration-plan.json> --render <final.mp4>
          [--music <cue.json> --music-accept <acceptance.json>]
          --variant draft|accepted --out <bundle-dir> [--replace]
      Validate every input, copy it into a role-named folder layout, and write
      manifest.json. Refuses a rejected narration plan, a missing clip, an
      unaccepted or changed music cue, and an existing non-empty destination
      unless replacement is explicitly authorized. Does not produce a native
      editor project export.

  --inspect (same inputs, without --out)
      Validate and print the asset manifest without copying files or exporting media.
`);
}
function flag(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}
function main(argv) {
  if (argv.includes("--build") || argv.includes("--inspect")) {
    const screenplayPath = flag(argv, "--screenplay") ?? fail("--build needs --screenplay <screenplay.json>");
    const takePath = flag(argv, "--take") ?? fail("--build needs --take <take.json>");
    const sourceTakePath = flag(argv, "--source-take");
    const narrationPlanPath = flag(argv, "--plan") ?? fail("--build needs --plan <narration-plan.json>");
    const renderPath = flag(argv, "--render") ?? fail("--build needs --render <final.mp4>");
    const musicCuePath = flag(argv, "--music");
    const musicAcceptancePath = flag(argv, "--music-accept");
    const variant = flag(argv, "--variant") ?? fail("--build needs --variant draft|accepted");
    const manifest = buildBundleManifest({
      variant,
      screenplayPath,
      takePath,
      sourceTakePath,
      narrationPlanPath,
      renderPath,
      musicCuePath,
      musicAcceptancePath
    });
    if (argv.includes("--inspect")) {
      console.log(JSON.stringify(manifest, null, 2));
      return 0;
    }
    const out = flag(argv, "--out") ?? fail("--build needs --out <bundle-dir>");
    const result = writeBundle(manifest, out, {
      replace: argv.includes("--replace"),
      renderDurationSec: renderDuration(renderPath)
    });
    console.log(JSON.stringify(result.manifest, null, 2));
    console.log(`
wrote ${result.written.length} file(s) to ${result.destDir}`);
    if (result.manifest.missing.length > 0) {
      console.log(`missing: ${result.manifest.missing.map((m) => `${m.component} (${m.reason})`).join("; ")}`);
    }
    return 0;
  }
  usage();
  return 2;
}
if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith("demo-bundle.mjs")) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`demo-bundle: ${error.message}`);
    process.exit(1);
  }
}
export {
  BUNDLE_SCHEMA,
  buildBundleManifest,
  buildNarrationStemArgs,
  writeBundle
};
