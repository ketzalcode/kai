// The photo path, end to end: a still plus a rig becomes a colour clip.
//
// Ordering matters here. Every frame is converted from a freshly warped
// raster (§2 of the design), but only over the rectangles the rig touched —
// the static background is converted exactly once and then shared, which is
// both cheaper and the reason quantisation shimmer cannot occur.

import { createIndexer, quantise, rasterToCells, toHex } from './cells.mjs';
import { buildColourFrames } from './frames.mjs';
import { buildProvenance } from './provenance.mjs';
import { fitGrid } from './profile.mjs';
import { applyState, compileState, dirtyCells, validateRig } from './rig.mjs';
import { decodeArgs, parseProbeSize, probeSizeArgs, rasterFromBuffer } from './raster.mjs';

export const CELL_WIDTH = 8;
export const CELL_HEIGHT = 16;

/**
 * Works out the grid for a still. When ffprobe answers, the grid follows the
 * image's own aspect so the subject fills it; when it does not, the profile
 * grid is used and the decode letterboxes instead. Either way the caller
 * knows the exact dimensions without trusting the decoder.
 */
export async function resolveGrid({ input, profile, run }) {
  const probe = await run('ffprobe', probeSizeArgs(input));
  const size = probe.code === 0 ? parseProbeSize(probe.stdout) : null;
  if (!size) {
    return { cols: profile.cols, rows: profile.rows, fitted: false };
  }
  const fitted = fitGrid({
    sourceWidth: size.width,
    sourceHeight: size.height,
    maxCols: profile.cols,
    maxRows: profile.rows,
    cellAspect: profile.cellAspect,
  });
  return { ...fitted, fitted: true, source: size };
}

export async function decodeStill({ input, cols, rows, scratchPath, io }) {
  const width = cols * CELL_WIDTH;
  const height = rows * CELL_HEIGHT;
  const result = await io.run('ffmpeg', decodeArgs({ input, width, height, outputPath: scratchPath }));
  if (result.code !== 0) {
    const detail = (result.stderr || result.stdout || `exit ${result.code}`).trim().split('\n').slice(-3).join(' ');
    throw new Error(`ffmpeg could not decode ${input}: ${detail}`);
  }
  return rasterFromBuffer(io.readBinary(scratchPath), width, height);
}

function copyCells(cells, cols, rows) {
  return {
    ch: cells.ch.map(row => [...row]),
    fg: cells.fg.slice(),
    bg: cells.bg.slice(),
    cols,
    rows,
  };
}

/**
 * @returns `{ ok, doc, notes, errors }` — a frames IR v2 document.
 */
export function buildPhotoClip({ still, rig, state, frameCount, profile, palette, operator, createdAt, source, variants = {} }) {
  const rigCheck = validateRig(rig);
  if (!rigCheck.ok) return { ok: false, doc: null, notes: [], errors: rigCheck.errors };
  if (!Object.prototype.hasOwnProperty.call(rig.states, state)) {
    return {
      ok: false,
      doc: null,
      notes: [],
      errors: [`unknown state "${state}"; the rig declares ${Object.keys(rig.states).join(', ')}`],
    };
  }
  const { cols, rows } = profile;
  const series = compileState({ rig, state, frameCount });
  const base = rasterToCells({ raster: still, cols, rows, palette });

  const rawFrames = [copyCells(base, cols, rows)];
  const dirtyRegions = [];
  for (let frameIndex = 1; frameIndex < frameCount; frameIndex += 1) {
    const { raster, dirty } = applyState({ rig, state, still, frameIndex, frameCount, series, variants });
    const bounds = dirtyCells({ rects: dirty, raster, cols, rows });
    const cells = copyCells(base, cols, rows);
    if (bounds.cols > 0 && bounds.rows > 0) {
      rasterToCells({ raster, cols, rows, palette, into: cells, bounds });
    }
    dirtyRegions.push(bounds);
    rawFrames.push(cells);
  }

  const collected = [];
  for (const frame of rawFrames) {
    for (const colour of frame.fg) collected.push(colour);
    for (const colour of frame.bg) collected.push(colour);
  }
  const quantised = quantise(collected, 256);
  const index = createIndexer(quantised);
  const cellFrames = rawFrames.map(frame => ({
    ch: frame.ch,
    fg: Uint8Array.from(frame.fg.map(index)),
    bg: Uint8Array.from(frame.bg.map(index)),
  }));

  const movingCells = dirtyRegions.reduce((total, rect) => Math.max(total, rect.cols * rect.rows), 0);
  const doc = buildColourFrames({
    profile: { ...profile, cols, rows },
    cellFrames,
    palette: quantised.map(toHex),
    provenance: buildProvenance({
      tier: 2,
      source,
      license: 'operator-supplied still',
      operator,
      createdAt,
      notes: [
        'Frames are derived from a single still by declared raster transforms, not from footage.',
        `State "${state}" applies: ${rig.states[state]
          .map(channel => `${channel.region}:${channel.motion}`)
          .join(', ')}.`,
        'Mouth motion is speech-shaped, not speech-derived; no audio was used.',
      ],
    }),
  });
  return {
    ok: true,
    doc,
    errors: [],
    notes: [
      `${frameCount} frames at ${cols}x${rows}, ${profile.fps} fps, ${quantised.length} palette entries`,
      `${movingCells} of ${cols * rows} cells move; the rest was converted once and shared`,
    ],
  };
}
