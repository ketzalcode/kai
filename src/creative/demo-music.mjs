#!/usr/bin/env node
// demo-music — auditioning and accepting a background-music candidate.
//
// Why this exists
// ----------------
// A background track can pass every technical check -- it decodes, it is long
// enough, it does not clip -- and still be the wrong music for the story. A
// waveform does not know whether it sounds busy under a calm narration, or
// cheerful under a problem-first opening. Only a human listening to speech and
// music together can judge that, so this tool never decides it: it prepares a
// short sample an operator can actually hear, and it records whether they
// accepted it.
//
// What this tool will not do
// ---------------------------
// Compose, license, or download music. It consumes a candidate track an
// operator already supplied, describes it (name, provenance, declared rights),
// and gates any later music-mixing step behind an explicit acceptance of
// *that exact file*. A technically valid track with no recorded acceptance is
// not a soundtrack; it is an unreviewed candidate.

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname } from 'node:path';
import { CUE_SCHEMA, ACCEPTANCE_SCHEMA, cueHash, parseMusicCue, parseMusicAcceptance, acceptCue, requireAcceptance } from './lib/music.mjs';
import { assertSafeOutput } from './lib/media-output.mjs';

export { CUE_SCHEMA, ACCEPTANCE_SCHEMA, cueHash, parseMusicCue, parseMusicAcceptance, acceptCue, requireAcceptance, assertSafeOutput };

function fail(message) {
  throw new Error(message);
}

function num(value, label, { min = -Infinity, max = Infinity } = {}) {
  const n = Number(value);
  if (!Number.isFinite(n)) fail(`${label} must be a number, got ${JSON.stringify(value)}`);
  if (n < min || n > max) fail(`${label} must be within ${min}..${max}, got ${n}`);
  return n;
}

// ----------------------------------------------------------------- audition

// A short sample mixing narration and the candidate music together, so an
// operator can judge balance and fit before any full-length composition
// exists. Deliberately bounded to a handful of placed beats: the point is a
// quick, honest audition, not a second render pipeline.
export function buildAuditionArgs(plan, cue, { video, out, maxBeats = 3, replace = false }) {
  if (!plan.ok) fail('this narration plan was rejected, so there is no speech to audition music against; fix the rejections first');
  if (plan.beats.length === 0) fail('this narration plan places no beats');
  for (const label of [video, out]) {
    if (label.startsWith('-')) fail(`"${label}" starts with a dash and would be read as an option, not a file`);
  }

  const sampleBeats = plan.beats.slice(0, Math.max(1, maxBeats));
  const sampleEnd = sampleBeats[sampleBeats.length - 1].end + 1;

  assertSafeOutput(
    [
      { role: 'video input', path: video },
      { role: 'music candidate', path: cue.path },
      ...sampleBeats.map((beat) => ({ role: `narration clip "${beat.beat}"`, path: beat.path })),
    ],
    out,
    replace,
  );

  const inputs = [];
  const chain = [];
  const voiceLabels = [];
  sampleBeats.forEach((beat, i) => {
    inputs.push('-i', beat.path);
    chain.push(`[${i + 2}:a]adelay=${Math.round(beat.start * 1000)}:all=1[v${i}]`);
    voiceLabels.push(`[v${i}]`);
  });

  // Input 1 is the music candidate, trimmed to the sample window and faded in
  // so the audition does not open on a hard cut.
  chain.push(`[1:a]atrim=0:${sampleEnd},afade=t=in:d=0.5[music]`);
  chain.push(`${voiceLabels.join('')}amix=inputs=${sampleBeats.length}:normalize=0:dropout_transition=0[voice]`);
  chain.push('[voice][music]amix=inputs=2:normalize=0:dropout_transition=0:weights=1 0.6[sample]');

  return [
    replace ? '-y' : '-n', '-hide_banner', '-v', 'error',
    '-i', video,
    '-i', cue.path,
    ...inputs,
    '-filter_complex', chain.join(';'),
    '-map', '0:v', '-map', '[sample]',
    '-t', `${sampleEnd}`,
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
    out,
  ];
}

// -------------------------------------------------------------------- mix

// Full-length narration + music composition. Everything an audition cannot
// verify by ear -- the acceptance gate, ducking under every beat, fades, and a
// hard peak ceiling -- is mechanical and belongs here, not in judgment.
//
// Ducking is built as a chain of per-beat `volume` filters with `enable`
// windows rather than a dynamic sidechain compressor. A fixed window is
// exactly as wide as the beat it protects, computable from the same placement
// plan the voice track already uses, and its correctness does not depend on
// signal level the way a compressor's threshold would -- so a reviewer can
// read the generated command and see precisely which seconds are ducked.
export function buildMusicMixArgs(plan, cue, cueText, acceptance, {
  video,
  out,
  videoInfo,
  replace = false,
  duckDb = -14,
  fadeSec = 1.5,
  voiceDb = 0,
  musicDb = -6,
} = {}) {
  requireAcceptance(cueText, acceptance);
  if (!plan.ok) fail('this narration plan was rejected, so there is nothing to mix; fix the rejections first');
  if (plan.beats.length === 0) fail('this narration plan places no beats');
  for (const label of [video, out]) {
    if (label.startsWith('-')) fail(`"${label}" starts with a dash and would be read as an option, not a file`);
  }
  const videoEnd = num(videoInfo?.seconds, 'measured video duration', { min: 0.1 });
  if (videoInfo?.audioStreams !== 0) fail('source video has an existing or unmeasured audio track; this composition cannot silently replace it');
  if (videoEnd < Math.max(...plan.beats.map((beat) => beat.end))) fail('narration extends beyond the measured video duration');
  duckDb = num(duckDb, 'duckDb', { min: -60, max: 0 });
  fadeSec = Math.min(num(fadeSec, 'fadeSec', { min: 0.01, max: 30 }), videoEnd / 2);
  voiceDb = num(voiceDb, 'voiceDb', { min: -60, max: 12 });
  musicDb = num(musicDb, 'musicDb', { min: -60, max: 0 });
  if (cue.duration_sec < videoEnd) {
    fail(`the music cue is ${cue.duration_sec}s long, shorter than the narrated timeline it would score (${plan.beats[plan.beats.length - 1].end}s); supply a longer or looped track rather than mixing a track that runs out`);
  }

  assertSafeOutput(
    [
      { role: 'video input', path: video },
      { role: 'music track', path: cue.path },
      ...plan.beats.map((beat) => ({ role: `narration clip "${beat.beat}"`, path: beat.path })),
    ],
    out,
    replace,
  );

  const inputs = [];
  const chain = [];
  const voiceLabels = [];
  plan.beats.forEach((beat, i) => {
    inputs.push('-i', beat.path);
    chain.push(`[${i + 2}:a]adelay=${Math.round(beat.start * 1000)}:all=1[v${i}]`);
    voiceLabels.push(`[v${i}]`);
  });

  // One `volume` stage per beat, each only active (`enable='between(...)'`)
  // during that beat's own window; ffmpeg leaves the signal at unity gain
  // everywhere else, so the music plays at full level whenever nobody is
  // speaking over it.
  const duckGain = `${duckDb}dB`;
  const duckStages = plan.beats
    .map((beat) => `volume=${duckGain}:enable='between(t,${beat.start},${beat.end})'`)
    .join(',');
  const fadeOutStart = Math.max(0, videoEnd - fadeSec);
  chain.push(`[1:a]atrim=0:${videoEnd},volume=${musicDb}dB,afade=t=in:d=${fadeSec},afade=t=out:st=${fadeOutStart}:d=${fadeSec},${duckStages}[music]`);
  chain.push(`${voiceLabels.join('')}amix=inputs=${plan.beats.length}:normalize=0:dropout_transition=0,volume=${voiceDb}dB[voice]`);
  // A hard limiter on the final mix bounds peak level by construction; it does
  // not replace an actual post-render peak check, which `buildPeakCheckArgs`
  // prints separately for the operator to run against the rendered file.
  chain.push('[voice][music]amix=inputs=2:normalize=0:dropout_transition=0[premix]');
  chain.push('[premix]alimiter=limit=0.95:level=false[mix]');

  return [
    replace ? '-y' : '-n', '-hide_banner', '-v', 'error',
    '-i', video,
    '-i', cue.path,
    ...inputs,
    '-filter_complex', chain.join(';'),
    '-map', '0:v', '-map', '[mix]',
    '-c:v', 'copy', '-c:a', 'aac', '-b:a', '128k',
    '-t', String(videoEnd),
    out,
  ];
}

export function probeVideoInfo(video) {
  const result = spawnSync('ffprobe', [
    '-v', 'error', '-show_entries', 'format=duration:stream=codec_type',
    '-of', 'json', video,
  ], { encoding: 'utf8' });
  if (result.error || result.status !== 0) fail(`cannot inspect source video: ${result.error?.message ?? result.stderr}`);
  const metadata = JSON.parse(result.stdout);
  if (!metadata.streams?.some((stream) => stream.codec_type === 'video')) fail('source has no video stream');
  return {
    seconds: num(metadata.format?.duration, 'measured video duration', { min: 0.1 }),
    audioStreams: metadata.streams.filter((stream) => stream.codec_type === 'audio').length,
  };
}

// A read-only measurement command, not a mix: astats reports the actual peak
// level of a rendered file so an operator can confirm the limiter held,
// rather than trusting that it did. This tool does not execute it or read its
// output; it only prints the command to run.
export function buildPeakCheckArgs(mediaPath) {
  if (mediaPath.startsWith('-')) fail(`"${mediaPath}" starts with a dash and would be read as an option, not a file`);
  return [
    '-hide_banner', '-v', 'info',
    '-i', mediaPath,
    '-af', 'astats=metadata=1:reset=1',
    '-f', 'null', '-',
  ];
}

// -------------------------------------------------------------------- cli

function usage() {
  console.log(`demo-music — audition, accept, and mix a background-music candidate

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
  if (argv.includes('--audition')) {
    const plan = JSON.parse(readFileSync(argv[argv.indexOf('--audition') + 1], 'utf8'));
    const cuePath = flag(argv, '--music') ?? fail('--audition needs --music <cue.json>');
    const video = flag(argv, '--video') ?? fail('--audition needs --video <render.mp4>');
    const out = flag(argv, '--out') ?? fail('--audition needs --out <sample.mp4>');
    if (!existsSync(video)) fail(`${video} does not exist`);
    const cue = parseMusicCue(readFileSync(cuePath, 'utf8'));
    if (!existsSync(cue.path)) fail(`the cue names "${cue.path}", which does not exist`);
    console.log(['ffmpeg', ...buildAuditionArgs(plan, cue, { video, out, replace: argv.includes('--replace') })].map((a) => (/[\s;'"[\]]/.test(a) ? `"${a}"` : a)).join(' '));
    return 0;
  }

  if (argv.includes('--accept')) {
    const cuePath = argv[argv.indexOf('--accept') + 1];
    const cueText = readFileSync(cuePath, 'utf8');
    parseMusicCue(cueText); // validate before recording acceptance of it
    const operator = flag(argv, '--operator') ?? fail('--accept needs --operator "<name>"');
    const note = flag(argv, '--note', '');
    const auditioned = flag(argv, '--auditioned', 'speech+music');
    const out = flag(argv, '--out') ?? fail('--accept needs --out <acceptance.json>');
    const cue = parseMusicCue(cueText);
    assertSafeOutput([{ role: 'music cue', path: cuePath }, { role: 'music track', path: cue.path }], out, argv.includes('--replace'));
    const acceptance = acceptCue(cueText, { operator, note, auditioned });
    console.log(JSON.stringify(acceptance, null, 2));
    mkdirSync(dirname(out) || '.', { recursive: true });
    writeFileSync(out, JSON.stringify(acceptance, null, 2));
    console.log(`\nwrote ${out}`);
    return 0;
  }

  if (argv.includes('--mix')) {
    const plan = JSON.parse(readFileSync(argv[argv.indexOf('--mix') + 1], 'utf8'));
    const cuePath = flag(argv, '--music') ?? fail('--mix needs --music <cue.json>');
    const acceptancePath = flag(argv, '--acceptance') ?? fail('--mix needs --acceptance <acceptance.json>');
    const video = flag(argv, '--video') ?? fail('--mix needs --video <render.mp4>');
    const out = flag(argv, '--out') ?? fail('--mix needs --out <scored.mp4>');
    if (!existsSync(video)) fail(`${video} does not exist`);
    const cueText = readFileSync(cuePath, 'utf8');
    const cue = parseMusicCue(cueText);
    if (!existsSync(cue.path)) fail(`the cue names "${cue.path}", which does not exist`);
    const acceptance = parseMusicAcceptance(readFileSync(acceptancePath, 'utf8'));
    const duckDb = Number(flag(argv, '--duck-db', -14));
    const fadeSec = Number(flag(argv, '--fade-sec', 1.5));
    const args = buildMusicMixArgs(plan, cue, cueText, acceptance, {
      video, out, videoInfo: probeVideoInfo(video), replace: argv.includes('--replace'), duckDb, fadeSec,
      voiceDb: Number(flag(argv, '--voice-db', 0)),
      musicDb: Number(flag(argv, '--music-db', -6)),
    });
    console.log(['ffmpeg', ...args].map((a) => (/[\s;'"[\]]/.test(a) ? `"${a}"` : a)).join(' '));
    return 0;
  }

  if (argv.includes('--check-levels')) {
    const mediaPath = argv[argv.indexOf('--check-levels') + 1];
    if (!mediaPath) fail('--check-levels needs a media file path');
    console.log(['ffmpeg', ...buildPeakCheckArgs(mediaPath)].map((a) => (/[\s;'"[\]]/.test(a) ? `"${a}"` : a)).join(' '));
    return 0;
  }

  usage();
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('demo-music.mjs')) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`demo-music: ${error.message}`);
    process.exit(1);
  }
}
