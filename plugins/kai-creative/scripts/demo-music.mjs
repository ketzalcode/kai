#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  ACCEPTANCE_SCHEMA,
  CUE_SCHEMA,
  acceptCue,
  assertSafeOutput,
  cueHash,
  parseMusicAcceptance,
  parseMusicCue,
  requireAcceptance
} from "./runtime-creative.mjs";

// src/creative/demo-music.mjs
import { readFileSync, existsSync, writeFileSync, mkdirSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname } from "node:path";
function fail(message) {
  throw new Error(message);
}
function num(value, label, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) fail(`${label} must be a number, got ${JSON.stringify(value)}`);
  if (n < min || n > max) fail(`${label} must be within ${min}..${max}, got ${n}`);
  return n;
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
function buildMusicMixArgs(plan, cue, cueText, acceptance, {
  video,
  out,
  videoInfo,
  replace = false,
  duckDb = -14,
  fadeSec = 1.5,
  voiceDb = 0,
  musicDb = -6
} = {}) {
  requireAcceptance(cueText, acceptance);
  if (!plan.ok) fail("this narration plan was rejected, so there is nothing to mix; fix the rejections first");
  if (plan.beats.length === 0) fail("this narration plan places no beats");
  for (const label of [video, out]) {
    if (label.startsWith("-")) fail(`"${label}" starts with a dash and would be read as an option, not a file`);
  }
  const videoEnd = num(videoInfo?.seconds, "measured video duration", { min: 0.1 });
  if (videoInfo?.audioStreams !== 0) fail("source video has an existing or unmeasured audio track; this composition cannot silently replace it");
  if (videoEnd < Math.max(...plan.beats.map((beat) => beat.end))) fail("narration extends beyond the measured video duration");
  duckDb = num(duckDb, "duckDb", { min: -60, max: 0 });
  fadeSec = Math.min(num(fadeSec, "fadeSec", { min: 0.01, max: 30 }), videoEnd / 2);
  voiceDb = num(voiceDb, "voiceDb", { min: -60, max: 12 });
  musicDb = num(musicDb, "musicDb", { min: -60, max: 0 });
  if (cue.duration_sec < videoEnd) {
    fail(`the music cue is ${cue.duration_sec}s long, shorter than the narrated timeline it would score (${plan.beats[plan.beats.length - 1].end}s); supply a longer or looped track rather than mixing a track that runs out`);
  }
  assertSafeOutput(
    [
      { role: "video input", path: video },
      { role: "music track", path: cue.path },
      ...plan.beats.map((beat) => ({ role: `narration clip "${beat.beat}"`, path: beat.path }))
    ],
    out,
    replace
  );
  const inputs = [];
  const chain = [];
  const voiceLabels = [];
  plan.beats.forEach((beat, i) => {
    inputs.push("-i", beat.path);
    chain.push(`[${i + 2}:a]adelay=${Math.round(beat.start * 1e3)}:all=1[v${i}]`);
    voiceLabels.push(`[v${i}]`);
  });
  const duckGain = `${duckDb}dB`;
  const duckStages = plan.beats.map((beat) => `volume=${duckGain}:enable='between(t,${beat.start},${beat.end})'`).join(",");
  const fadeOutStart = Math.max(0, videoEnd - fadeSec);
  chain.push(`[1:a]atrim=0:${videoEnd},volume=${musicDb}dB,afade=t=in:d=${fadeSec},afade=t=out:st=${fadeOutStart}:d=${fadeSec},${duckStages}[music]`);
  chain.push(`${voiceLabels.join("")}amix=inputs=${plan.beats.length}:normalize=0:dropout_transition=0,volume=${voiceDb}dB[voice]`);
  chain.push("[voice][music]amix=inputs=2:normalize=0:dropout_transition=0[premix]");
  chain.push("[premix]alimiter=limit=0.95:level=false[mix]");
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
    "[mix]",
    "-c:v",
    "copy",
    "-c:a",
    "aac",
    "-b:a",
    "128k",
    "-t",
    String(videoEnd),
    out
  ];
}
function probeVideoInfo(video) {
  const result = spawnSync("ffprobe", [
    "-v",
    "error",
    "-show_entries",
    "format=duration:stream=codec_type",
    "-of",
    "json",
    video
  ], { encoding: "utf8" });
  if (result.error || result.status !== 0) fail(`cannot inspect source video: ${result.error?.message ?? result.stderr}`);
  const metadata = JSON.parse(result.stdout);
  if (!metadata.streams?.some((stream) => stream.codec_type === "video")) fail("source has no video stream");
  return {
    seconds: num(metadata.format?.duration, "measured video duration", { min: 0.1 }),
    audioStreams: metadata.streams.filter((stream) => stream.codec_type === "audio").length
  };
}
function buildPeakCheckArgs(mediaPath) {
  if (mediaPath.startsWith("-")) fail(`"${mediaPath}" starts with a dash and would be read as an option, not a file`);
  return [
    "-hide_banner",
    "-v",
    "info",
    "-i",
    mediaPath,
    "-af",
    "astats=metadata=1:reset=1",
    "-f",
    "null",
    "-"
  ];
}
function usage() {
  console.log(`demo-music \u2014 audition, accept, and mix a background-music candidate

  --audition   <plan.json> --music <cue.json> --video <render.mp4> --out <sample.mp4> [--replace]
      Print the ffmpeg command for a short speech+music sample, for an operator to listen to.
      Existing outputs are refused unless replacement is explicitly authorized.

  --accept     <cue.json> --operator "<name>" [--note "<text>"] [--auditioned speech+music|music-only] --out <acceptance.json>
      Record that an operator judged this exact cue, keyed by its content hash.

  --mix        <plan.json> --music <cue.json> --acceptance <acceptance.json> --video <render.mp4> --out <scored.mp4>
               [--duck-db -14] [--fade-sec 1.5] [--voice-db 0] [--music-db -6] [--replace]
      Probe the video, then print the ffmpeg command for the full narration+music composition. Refuses existing source audio and an
      unaccepted or changed cue, a cue shorter than the narrated timeline, and an
      existing output unless replacement is explicitly authorized.

  --check-levels <media file>
      Print the ffmpeg command that measures actual peak level in a rendered file.
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
    const cue = parseMusicCue(cueText);
    assertSafeOutput([{ role: "music cue", path: cuePath }, { role: "music track", path: cue.path }], out, argv.includes("--replace"));
    const acceptance = acceptCue(cueText, { operator, note, auditioned });
    console.log(JSON.stringify(acceptance, null, 2));
    mkdirSync(dirname(out) || ".", { recursive: true });
    writeFileSync(out, JSON.stringify(acceptance, null, 2));
    console.log(`
wrote ${out}`);
    return 0;
  }
  if (argv.includes("--mix")) {
    const plan = JSON.parse(readFileSync(argv[argv.indexOf("--mix") + 1], "utf8"));
    const cuePath = flag(argv, "--music") ?? fail("--mix needs --music <cue.json>");
    const acceptancePath = flag(argv, "--acceptance") ?? fail("--mix needs --acceptance <acceptance.json>");
    const video = flag(argv, "--video") ?? fail("--mix needs --video <render.mp4>");
    const out = flag(argv, "--out") ?? fail("--mix needs --out <scored.mp4>");
    if (!existsSync(video)) fail(`${video} does not exist`);
    const cueText = readFileSync(cuePath, "utf8");
    const cue = parseMusicCue(cueText);
    if (!existsSync(cue.path)) fail(`the cue names "${cue.path}", which does not exist`);
    const acceptance = parseMusicAcceptance(readFileSync(acceptancePath, "utf8"));
    const duckDb = Number(flag(argv, "--duck-db", -14));
    const fadeSec = Number(flag(argv, "--fade-sec", 1.5));
    const args = buildMusicMixArgs(plan, cue, cueText, acceptance, {
      video,
      out,
      videoInfo: probeVideoInfo(video),
      replace: argv.includes("--replace"),
      duckDb,
      fadeSec,
      voiceDb: Number(flag(argv, "--voice-db", 0)),
      musicDb: Number(flag(argv, "--music-db", -6))
    });
    console.log(["ffmpeg", ...args].map((a) => /[\s;'"[\]]/.test(a) ? `"${a}"` : a).join(" "));
    return 0;
  }
  if (argv.includes("--check-levels")) {
    const mediaPath = argv[argv.indexOf("--check-levels") + 1];
    if (!mediaPath) fail("--check-levels needs a media file path");
    console.log(["ffmpeg", ...buildPeakCheckArgs(mediaPath)].map((a) => /[\s;'"[\]]/.test(a) ? `"${a}"` : a).join(" "));
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
  buildMusicMixArgs,
  buildPeakCheckArgs,
  cueHash,
  parseMusicAcceptance,
  parseMusicCue,
  probeVideoInfo,
  requireAcceptance
};
