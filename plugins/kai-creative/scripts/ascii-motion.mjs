#!/usr/bin/env node
import assert from 'node:assert/strict';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import { buildBundle, validateBundle } from './lib/ascii-motion/bundle.mjs';
import {
  FRAMES_KIND_V2,
  decodeColourFrame,
  frameRows,
  serializeFrames,
  validateFrames,
} from './lib/ascii-motion/frames.mjs';
import { DEFAULT_PROFILES, fitGrid, resolveProfile } from './lib/ascii-motion/profile.mjs';
import { TEMPLATE_IDS, renderTemplate } from './lib/ascii-motion/templates.mjs';
import { createScheduler } from './lib/ascii-motion/player.mjs';
import { makeFakeBackend, negotiate, runBackend } from './lib/ascii-motion/backend.mjs';
import {
  MISSING_HINT,
  PINNED_VERSION,
  createMovieAsciiBackend,
  interpretProbe,
} from './lib/ascii-motion/backend-movie-ascii.mjs';
import {
  frameImageArgs,
  gifAssembleArgs,
  planGif,
  rawVideoArgs,
  renderGif,
  tileArgs,
} from './lib/ascii-motion/gif.mjs';
import { fromHex, rasteriseCells } from './lib/ascii-motion/cells.mjs';
import { BUDGET, validateRig } from './lib/ascii-motion/rig.mjs';
import {
  CELL_HEIGHT,
  CELL_WIDTH,
  buildPhotoClip,
  decodeStill,
  resolveGrid,
} from './lib/ascii-motion/photo.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));
const PLAYER_SOURCE = join(HERE, 'lib', 'ascii-motion', 'player.mjs');
const CONVERT_FORMATS = ['gif', 'mp4', 'html'];
const OPERATIONS = [
  'probe',
  'template',
  'explain',
  'preview',
  'sample',
  'convert',
  'bundle',
  'review',
  'sprite',
  'animate',
];
const FONT_FILE = process.env.KAI_ASCII_MOTION_FONT ?? 'C:/Windows/Fonts/consola.ttf';

// ---------------------------------------------------------------------------
// Argument parsing
// ---------------------------------------------------------------------------

export function parseArgs(argv) {
  const errors = [];
  const options = { print: false };
  let operation = null;
  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    const next = () => argv[index + 1];
    switch (token) {
      case '--self-test':
        operation = 'self-test';
        break;
      case '--print':
        options.print = true;
        break;
      case '--probe':
        operation = 'probe';
        break;
      case '--explain':
        operation = 'explain';
        break;
      case '--template':
        operation = 'template';
        options.template = next();
        index += 1;
        break;
      case '--preview':
      case '--sample':
      case '--convert':
      case '--bundle':
      case '--review':
        operation = token.slice(2);
        options.input = next();
        index += 1;
        break;
      case '--sprite':
      case '--animate':
        operation = token.slice(2);
        options.still = next();
        index += 1;
        break;
      case '--rig':
        options.rig = next();
        index += 1;
        break;
      case '--state':
        options.state = next();
        index += 1;
        break;
      case '--frames':
        options.frames = Number(next());
        index += 1;
        break;
      case '--params':
        try {
          options.params = JSON.parse(next() ?? '');
        } catch (error) {
          errors.push(`--params is not valid JSON: ${error.message}`);
        }
        index += 1;
        break;
      case '--profile':
        options.profile = next();
        index += 1;
        break;
      case '--format':
        options.format = next();
        index += 1;
        break;
      case '--at':
      case '--seconds':
        options[token.slice(2)] = Number(next());
        index += 1;
        break;
      case '--out':
        options.out = next();
        index += 1;
        break;
      default:
        errors.push(`unknown argument "${token}"`);
    }
  }
  if (!operation) {
    errors.push('no operation was requested; see --probe, --template, --bundle, --convert');
  }
  if (options.format && !CONVERT_FORMATS.includes(options.format)) {
    errors.push(`unknown format "${options.format}"; supported formats are ${CONVERT_FORMATS.join(', ')}`);
  }
  if (operation === 'animate' && !options.rig) {
    errors.push('--animate needs --rig pointing at the rig that declares the regions and states');
  }
  return { operation, options, errors };
}

// ---------------------------------------------------------------------------
// Injected side effects
// ---------------------------------------------------------------------------

function writeFileDeep(path, text) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, text, 'utf8');
}

function runCommand(command, args) {
  return new Promise(resolve => {
    const child = spawn(command, args, { shell: false });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', chunk => {
      stdout += chunk;
    });
    child.stderr?.on('data', chunk => {
      stderr += chunk;
    });
    child.on('error', error => resolve({ code: 127, stdout, stderr: error.message }));
    child.on('close', code => resolve({ code, stdout, stderr }));
  });
}

async function toolAvailable(command) {
  const result = await runCommand(command, ['-version']);
  return result.code === 0;
}

export function defaultIo(overrides = {}) {
  return {
    readJson: path => JSON.parse(readFileSync(path, 'utf8')),
    readBinary: path => readFileSync(path),
    writeText: (path, text) => writeFileDeep(path, text),
    writeBinary: (path, buffer) => {
      mkdirSync(dirname(path), { recursive: true });
      writeFileSync(path, buffer);
    },
    writeJson: (path, value) => writeFileDeep(path, `${JSON.stringify(value, null, 2)}\n`),
    copyAsset: (from, to) => {
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(from, to);
    },
    ffmpegAvailable: false,
    run: runCommand,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Colour rendering
// ---------------------------------------------------------------------------

function isColour(doc) {
  return doc.kind === FRAMES_KIND_V2;
}

/**
 * Rasterises selected frames of a colour clip into one concatenated rgb24
 * buffer. ffmpeg reads it as `rawvideo`, which sidesteps `drawtext` — that
 * filter cannot carry per-cell colour at all.
 */
function writeColourRaw(doc, indices, rawPath, io) {
  const palette = doc.colorPalette.map(fromHex);
  const buffers = [];
  let width = 0;
  let height = 0;
  for (const index of indices) {
    const frame = decodeColourFrame(doc, index);
    const image = rasteriseCells({
      ch: frame.ch,
      fg: Array.from(frame.fg, entry => palette[entry]),
      bg: Array.from(frame.bg, entry => palette[entry]),
      cols: doc.cols,
      rows: doc.rows,
      cellWidth: CELL_WIDTH,
      cellHeight: CELL_HEIGHT,
    });
    width = image.width;
    height = image.height;
    buffers.push(Buffer.from(image.data));
  }
  io.writeBinary(rawPath, Buffer.concat(buffers));
  return { width, height, count: indices.length };
}

// ---------------------------------------------------------------------------
// Operations
// ---------------------------------------------------------------------------

export function runTemplateOp({ template, profile, params = {}, out }, io) {
  const resolved = resolveProfile({ id: profile ?? 'readme', ...(params.profile ?? {}) });
  if (!resolved.ok) return { status: 'failed', outputPath: null, notes: resolved.errors };
  const rendered = renderTemplate({
    id: template,
    profile: resolved.profile,
    frameCount: params.frameCount ?? resolved.profile.fps,
    operator: params.operator ?? 'unknown',
    seed: params.seed ?? 1,
    createdAt: params.createdAt,
  });
  if (!rendered.ok) return { status: 'failed', outputPath: null, notes: rendered.errors };
  io.writeText(out, serializeFrames(rendered.doc));
  return {
    status: 'ok',
    outputPath: out,
    notes: [
      `${rendered.doc.frameCount} frames at ${rendered.doc.cols}x${rendered.doc.rows}, ${rendered.doc.fps} fps`,
      'A template clip is generated arithmetic, not footage of a named subject.',
    ],
  };
}

export async function runBundleOp({ input, out }, io) {
  const manifest = io.readJson(input);
  const manifestDir = input.includes('/') ? input.slice(0, input.lastIndexOf('/')) : '.';
  const clips = manifest.clips.map(entry => ({
    name: entry.name,
    doc: io.readJson(entry.clip.includes('/') ? entry.clip : `${manifestDir}/${entry.clip}`),
    framesRef: `${entry.name}.frames.json`,
    loop: entry.loop ?? true,
    loopFrom: entry.loopFrom ?? 0,
  }));
  const built = buildBundle({ clips, defaultClip: manifest.default_clip });
  if (!built.ok) return { status: 'failed', files: [], notes: built.errors };
  const files = [];
  for (const clip of clips) {
    const path = `${out}/${clip.framesRef}`;
    io.writeText(path, serializeFrames(clip.doc));
    files.push(path);
  }
  io.writeJson(`${out}/bundle.json`, built.bundle);
  files.push(`${out}/bundle.json`);
  io.copyAsset(PLAYER_SOURCE, `${out}/player.mjs`);
  files.push(`${out}/player.mjs`);
  return {
    status: 'ok',
    files,
    notes: [`${clips.length} clip(s) sharing ${built.bundle.profile.grid.cols}x${built.bundle.profile.grid.rows}`],
  };
}

function missingFfmpeg() {
  return {
    status: 'blocked',
    outputPath: null,
    notes: [
      'ffmpeg is not available, so nothing was rendered. kai never installs tools for you.',
      'Re-run with --print to prepare the commands for a host that has ffmpeg.',
    ],
    commands: [],
  };
}

async function renderFrameImages(doc, indices, outDir, io) {
  const notes = [];
  // ffmpeg reads a "%04d" sequence contiguously from zero and stops at the
  // first gap, so outputs are numbered by position, not by source index.
  for (const [position, index] of indices.entries()) {
    const stem = `${outDir}/f${String(position).padStart(4, '0')}`;
    io.writeText(`${stem}.txt`, `${frameRows(doc, index).join('\n')}\n`);
    const args = frameImageArgs({
      textPath: `${stem}.txt`,
      outputPath: `${stem}.png`,
      doc,
      fontFile: FONT_FILE,
    });
    const result = await io.run('ffmpeg', args);
    if (result.code !== 0) {
      // Stop at the first failure: every later frame uses the same command
      // shape, so repeating it only buries the one diagnostic that matters.
      const detail = (result.stderr || result.stdout || `exit ${result.code}`).trim().split('\n').slice(-3).join(' ');
      notes.push(`ffmpeg failed on frame ${index}: ${detail}`);
      return notes;
    }
  }
  return notes;
}

export async function runPreviewOp({ input, at = 0, out }, io) {
  const doc = io.readJson(input);
  if (!io.ffmpegAvailable) return missingFfmpeg();
  const index = Math.min(doc.frameCount - 1, Math.max(0, Math.round(at * doc.fps)));
  const spatialNote = 'A still answers the spatial gate only; it is not evidence the motion reads.';
  if (isColour(doc)) {
    const rawPath = `${out}.raw`;
    const { width, height } = writeColourRaw(doc, [index], rawPath, io);
    const result = await io.run(
      'ffmpeg',
      rawVideoArgs({ rawPath, width, height, fps: doc.fps, outputPath: out, frames: 1 }),
    );
    return result.code === 0
      ? { status: 'ok', outputPath: out, notes: [`frame ${index} of ${doc.frameCount}`, spatialNote], commands: [] }
      : {
          status: 'blocked',
          outputPath: null,
          notes: [`ffmpeg failed: ${(result.stderr || `exit ${result.code}`).trim().split('\n').slice(-3).join(' ')}`],
          commands: [],
        };
  }
  io.writeText(`${out}.txt`, `${frameRows(doc, index).join('\n')}\n`);
  const args = frameImageArgs({ textPath: `${out}.txt`, outputPath: out, doc, fontFile: FONT_FILE });
  const result = await io.run('ffmpeg', args);
  return result.code === 0
    ? {
        status: 'ok',
        outputPath: out,
        notes: [`frame ${index} of ${doc.frameCount}`, spatialNote],
        commands: [],
      }
    : {
        status: 'blocked',
        outputPath: null,
        notes: [`ffmpeg failed: ${(result.stderr || `exit ${result.code}`).trim().split('\n').slice(-3).join(' ')}`],
        commands: [],
      };
}

export async function runSampleOp({ input, seconds = 2, out }, io) {
  const doc = io.readJson(input);
  if (!io.ffmpegAvailable) return missingFfmpeg();
  const count = Math.min(doc.frameCount, Math.max(1, Math.round(seconds * doc.fps)));
  const indices = Array.from({ length: count }, (_unused, index) => index);
  const note = `${count} frames sampled for the temporal gate`;
  if (isColour(doc)) {
    const rawPath = `${out}.raw`;
    const { width, height } = writeColourRaw(doc, indices, rawPath, io);
    const result = await io.run(
      'ffmpeg',
      rawVideoArgs({ rawPath, width, height, fps: doc.fps, outputPath: out }),
    );
    return result.code === 0
      ? { status: 'ok', outputPath: out, notes: [note], commands: [] }
      : { status: 'blocked', outputPath: null, notes: ['ffmpeg failed'], commands: [] };
  }
  const dir = `${out}.frames`;
  const notes = await renderFrameImages(doc, indices, dir, io);
  const result = await io.run(
    'ffmpeg',
    gifAssembleArgs({ frameGlob: `${dir}/f%04d.png`, fps: doc.fps, outputPath: out }),
  );
  return result.code === 0 && notes.length === 0
    ? { status: 'ok', outputPath: out, notes: [note], commands: [] }
    : { status: 'blocked', outputPath: null, notes: [...notes, 'ffmpeg failed'], commands: [] };
}

export async function runConvertOp({ input, format = 'gif', out, print = false }, io) {
  const doc = io.readJson(input);
  if (format !== 'gif') {
    return {
      status: 'unsupported',
      outputPath: null,
      notes: [
        `${format} export is not in this version; the looping GIF and the web bundle are the shipped artifacts`,
      ],
      commands: [],
    };
  }
  const dir = `${out}.frames`;
  if (isColour(doc)) {
    if (!io.ffmpegAvailable) return missingFfmpeg();
    const rawPath = `${out}.raw`;
    const indices = doc.frames.map((_frame, index) => index);
    const { width, height } = writeColourRaw(doc, indices, rawPath, io);
    const result = await io.run(
      'ffmpeg',
      rawVideoArgs({ rawPath, width, height, fps: doc.fps, outputPath: out }),
    );
    return result.code === 0
      ? {
          status: 'ok',
          outputPath: out,
          notes: [`${indices.length} colour frames rasterised as rectangle fills, no font involved`],
          commands: [],
        }
      : {
          status: 'blocked',
          outputPath: null,
          notes: [`ffmpeg failed: ${(result.stderr || `exit ${result.code}`).trim().split('\n').slice(-3).join(' ')}`],
          commands: [],
        };
  }
  if (io.ffmpegAvailable) {
    const notes = await renderFrameImages(doc, doc.frames.map((_frame, index) => index), dir, io);
    if (notes.length > 0) return { status: 'blocked', outputPath: null, notes, commands: [] };
  }
  return renderGif(
    { doc, framesDir: dir, outputPath: out, fontFile: FONT_FILE },
    { ffmpegAvailable: io.ffmpegAvailable, run: io.run, print },
  );
}

export async function runReviewOp({ input, out }, io) {
  const doc = io.readJson(input);
  if (!io.ffmpegAvailable) return missingFfmpeg();
  const step = Math.max(1, Math.floor(doc.frameCount / 6));
  const indices = [];
  for (let index = 0; index < doc.frameCount && indices.length < 6; index += step) indices.push(index);
  const sheetNotes = [`sampled frames ${indices.join(', ')}`, 'A sheet supplies evidence; it does not make the judgement.'];
  if (isColour(doc)) {
    const rawPath = `${out}.raw`;
    const { width, height } = writeColourRaw(doc, indices, rawPath, io);
    const result = await io.run(
      'ffmpeg',
      tileArgs({ rawPath, width, height, columns: 3, rows: 2, outputPath: out }),
    );
    return result.code === 0
      ? { status: 'ok', outputPath: out, notes: sheetNotes, commands: [] }
      : { status: 'blocked', outputPath: null, notes: ['ffmpeg failed'], commands: [] };
  }
  const dir = `${out}.frames`;
  const notes = await renderFrameImages(doc, indices, dir, io);
  const result = await io.run('ffmpeg', [
    '-y',
    '-i', `${dir}/f%04d.png`,
    '-filter_complex', 'tile=3x2',
    '-frames:v', '1',
    out,
  ]);
  return result.code === 0 && notes.length === 0
    ? { status: 'ok', outputPath: out, notes: sheetNotes, commands: [] }
    : { status: 'blocked', outputPath: null, notes: [...notes, 'ffmpeg failed'], commands: [] };
}

// ---------------------------------------------------------------------------
// The photo path
// ---------------------------------------------------------------------------

async function loadStill({ still, profile, io, scratch }) {
  const grid = await resolveGrid({ input: still, profile, run: io.run });
  const raster = await decodeStill({
    input: still,
    cols: grid.cols,
    rows: grid.rows,
    scratchPath: scratch,
    io,
  });
  return { grid, raster };
}

/** A still with no motion at all: the fidelity gate, before any rig exists. */
export async function runSpriteOp({ still, profile, params = {}, out }, io) {
  if (!io.ffmpegAvailable) return missingFfmpeg();
  const resolved = resolveProfile({ id: profile ?? 'photo', ...(params.profile ?? {}) });
  if (!resolved.ok) return { status: 'failed', outputPath: null, notes: resolved.errors };
  const { grid, raster } = await loadStill({ still, profile: resolved.profile, io, scratch: `${out}.raw` });
  const rig = {
    kind: 'kai.ascii-motion-rig/v1',
    source: still,
    regions: { whole: { rect: [0, 0, 1, 1] } },
    states: { still: [{ region: 'whole', motion: 'hold' }] },
  };
  const built = buildPhotoClip({
    still: raster,
    rig,
    state: 'still',
    frameCount: 1,
    profile: { ...resolved.profile, cols: grid.cols, rows: grid.rows },
    palette: resolved.profile.palette,
    operator: params.operator ?? 'unknown',
    createdAt: params.createdAt,
    source: still,
  });
  if (!built.ok) return { status: 'failed', outputPath: null, notes: built.errors };
  io.writeText(out, serializeFrames(built.doc));
  return {
    status: 'ok',
    outputPath: out,
    notes: [
      ...built.notes,
      grid.fitted
        ? `grid follows the still's own aspect (${grid.source.width}x${grid.source.height})`
        : 'ffprobe was unavailable, so the profile grid was used and the decode letterboxed',
    ],
  };
}

export async function runAnimateOp({ still, rig: rigPath, state = 'idle', frames, profile, params = {}, out }, io) {
  if (!io.ffmpegAvailable) return missingFfmpeg();
  const resolved = resolveProfile({ id: profile ?? 'photo', ...(params.profile ?? {}) });
  if (!resolved.ok) return { status: 'failed', outputPath: null, notes: resolved.errors };
  const rig = io.readJson(rigPath);
  const check = validateRig(rig);
  if (!check.ok) return { status: 'refused', outputPath: null, notes: check.errors };
  const source = still ?? rig.source;
  const { grid, raster } = await loadStill({ still: source, profile: resolved.profile, io, scratch: `${out}.raw` });
  const built = buildPhotoClip({
    still: raster,
    rig,
    state,
    frameCount: frames ?? resolved.profile.fps * 2,
    profile: { ...resolved.profile, cols: grid.cols, rows: grid.rows },
    palette: resolved.profile.palette,
    operator: params.operator ?? 'unknown',
    createdAt: params.createdAt,
    source,
  });
  if (!built.ok) return { status: 'refused', outputPath: null, notes: built.errors };
  io.writeText(out, serializeFrames(built.doc));
  return { status: 'ok', outputPath: out, notes: built.notes };
}

export async function runProbeOp(io) {
  const backend = createMovieAsciiBackend({ run: io.run });
  let movieAscii;
  try {
    movieAscii = await backend.probe();
  } catch (error) {
    movieAscii = interpretProbe({ code: 127, stdout: '', stderr: error.message });
  }
  const ffprobe = await toolAvailable('ffprobe');
  return {
    node: process.version,
    templates: TEMPLATE_IDS,
    profiles: Object.keys(DEFAULT_PROFILES),
    ffmpeg: io.ffmpegAvailable ? 'present' : 'absent',
    ffprobe: ffprobe ? 'present' : 'absent',
    occlusionBudget: BUDGET,
    movieAscii: { pinned: PINNED_VERSION, ...movieAscii },
    notes: [
      'Templates need neither Python nor ffmpeg.',
      io.ffmpegAvailable
        ? 'The photo path and GIF export are available.'
        : 'The photo path needs ffmpeg to decode a still; without it only templates run.',
      ffprobe
        ? ''
        : 'ffprobe is absent, so a still cannot be fitted to its own aspect and will letterbox instead.',
      movieAscii.available ? '' : MISSING_HINT,
    ].filter(Boolean),
  };
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

export async function main(argv) {
  const { operation, options, errors } = parseArgs(argv);
  if (errors.length > 0) {
    console.error(errors.map(line => `  - ${line}`).join('\n'));
    return 1;
  }
  if (operation === 'self-test') {
    selfTest();
    console.log('ascii-motion helper self-test passed');
    return 0;
  }
  const io = defaultIo({ ffmpegAvailable: await toolAvailable('ffmpeg') });
  let result;
  switch (operation) {
    case 'probe':
      console.log(JSON.stringify(await runProbeOp(io), null, 2));
      return 0;
    case 'explain': {
      const resolved = resolveProfile({ id: options.profile ?? 'readme' });
      console.log(JSON.stringify(resolved, null, 2));
      return resolved.ok ? 0 : 1;
    }
    case 'template':
      result = runTemplateOp(options, io);
      break;
    case 'bundle':
      result = await runBundleOp(options, io);
      break;
    case 'preview':
      result = await runPreviewOp(options, io);
      break;
    case 'sample':
      result = await runSampleOp(options, io);
      break;
    case 'convert':
      result = await runConvertOp(options, io);
      break;
    case 'review':
      result = await runReviewOp(options, io);
      break;
    case 'sprite':
      result = await runSpriteOp(options, io);
      break;
    case 'animate':
      result = await runAnimateOp(options, io);
      break;
    default:
      console.error(`operation "${operation}" is not recognised`);
      return 1;
  }
  console.log(JSON.stringify(result, null, 2));
  return result.status === 'ok' || result.status === 'printed' ? 0 : 1;
}

export function selfTest() {
  assert.equal(parseArgs(['--probe']).operation, 'probe');
  assert.ok(parseArgs([]).errors.length > 0);
  assert.ok(parseArgs(['--convert', 'c.json', '--format', 'webm']).errors.some(e => e.includes('webm')));
  assert.ok(parseArgs(['--animate', 'a.png']).errors.some(e => e.includes('--rig')));
  assert.equal(parseArgs(['--sprite', 'a.png']).options.still, 'a.png');
  assert.deepEqual(Object.keys(DEFAULT_PROFILES), ['readme', 'web', 'photo']);
  assert.deepEqual(
    fitGrid({ sourceWidth: 2, sourceHeight: 1, maxCols: 10, maxRows: 10, cellAspect: 0.5 }),
    { cols: 10, rows: 3 },
  );

  // A colour mode is honoured end to end or rejected here; v1 accepted one and
  // then silently discarded it in both the GIF path and the player.
  assert.ok(resolveProfile({ id: 'readme', color: 'indexed' }).errors.some(e => e.includes('sub-cell')));
  assert.ok(resolveProfile({ id: 'photo', color: 'mono' }).errors.some(e => e.includes('indexed')));
  assert.equal(resolveProfile({ id: 'photo' }).ok, true);

  const { profile } = resolveProfile({ id: 'readme', cols: 8, rows: 4 });
  for (const id of TEMPLATE_IDS) {
    const { ok, doc } = renderTemplate({ id, profile, frameCount: 4, operator: 'self-test' });
    assert.ok(ok, `template ${id} failed to render`);
    assert.deepEqual(validateFrames(doc), { ok: true, errors: [] });
  }

  const { doc } = renderTemplate({ id: 'walk-cycle', profile, frameCount: 4, operator: 'self-test' });
  const built = buildBundle({ clips: [{ name: 'idle', doc, framesRef: 'idle.frames.json' }], defaultClip: 'idle' });
  assert.ok(built.ok);
  assert.deepEqual(validateBundle(built.bundle), { ok: true, errors: [] });

  const scheduler = createScheduler({ bundle: built.bundle, frames: { idle: doc.frames } });
  assert.equal(scheduler.tick().clip, 'idle');
  assert.throws(() => scheduler.play('nope'), /unknown clip/);
  assert.deepEqual(frameRows(doc, 0), doc.frames[0]);

  // The occlusion budget refuses by name rather than rendering smear.
  const overRig = {
    kind: 'kai.ascii-motion-rig/v1',
    source: 'face.png',
    regions: { head: { rect: [0.2, 0.2, 0.6, 0.6] } },
    states: { pan: [{ region: 'head', motion: 'translate', driver: 'sine', amount: 0.4 }] },
  };
  const refused = validateRig(overRig);
  assert.equal(refused.ok, false);
  assert.ok(refused.errors.some(e => e.includes('head') && e.includes('occlusion budget')));
  assert.ok(refused.errors.some(e => e.includes('multi-pose sprite sheet')));
  overRig.states.pan[0].amount = BUDGET.translateFraction;
  assert.equal(validateRig(overRig).ok, true);

  assert.equal(negotiate(makeFakeBackend(), 'gif').status, 'ok');
  assert.equal(
    negotiate(makeFakeBackend({ capabilities: { formats: ['gif'], direct: true } }), 'frames').status,
    'unsupported',
  );
  assert.equal(interpretProbe({ code: 1, stdout: '', stderr: 'nope' }).status, 'missing');
  assert.equal(interpretProbe({ code: 0, stdout: `x ${PINNED_VERSION}`, stderr: '' }).status, 'pinned');
  assert.equal(planGif({ doc, framesDir: 'd', outputPath: 'o.gif', fontFile: 'f.ttf' }).commands.length, 5);
  assert.ok(rawVideoArgs({ rawPath: 'r', width: 4, height: 4, fps: 2, outputPath: 'o.gif' }).includes('rawvideo'));
  assert.ok(tileArgs({ rawPath: 'r', width: 4, height: 4, columns: 3, rows: 2, outputPath: 'o.png' }).includes('tile=3x2'));
  assert.deepEqual(fromHex('#0a141e'), [10, 20, 30]);
  assert.equal(typeof runBackend, 'function');
  assert.equal(typeof renderGif, 'function');
  assert.equal(typeof buildPhotoClip, 'function');
  assert.equal(typeof decodeStill, 'function');
  assert.equal(typeof resolveGrid, 'function');
  assert.equal(typeof decodeColourFrame, 'function');
  assert.equal(CELL_WIDTH * 2, CELL_HEIGHT);
  assert.equal(OPERATIONS.length, 10);
  assert.ok(existsSync(PLAYER_SOURCE));
}

if (process.argv[1] && process.argv[1].endsWith('ascii-motion.mjs')) {
  process.exit(await main(process.argv.slice(2)));
}
