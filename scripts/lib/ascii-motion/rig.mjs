// The rig: named regions of a still, and how each one moves.
//
// Motion happens in RASTER space, before conversion, because glyphs do not
// rotate — a limb drawn from block characters and rotated in the character
// grid has no representation in the character set and comes out as noise.
// Converting every frame afresh keeps frame 40 as sharp as frame 0.
//
// What bounds this is occlusion, not rendering: move a region and you expose
// what was behind it, and a photograph has no behind. So amplitude is capped
// and anything past the cap is REFUSED by name rather than smeared.

import { mulberry32 } from './random.mjs';
import { cloneRaster, lowerLid, regionPixels, warpRegion } from './raster.mjs';

export const RIG_KIND = 'kai.ascii-motion-rig/v1';
export const MOTIONS = Object.freeze(['translate', 'scaleX', 'scaleY', 'rotate', 'swap', 'blink', 'hold']);
export const DRIVERS = Object.freeze(['sine', 'loop', 'random', 'envelope']);

// Starting points, not derived values. The first thing to revisit against
// real photographs.
export const BUDGET = Object.freeze({
  translateFraction: 0.06,
  rotateDegrees: 12,
});

function isRect(value) {
  return (
    Array.isArray(value) &&
    value.length === 4 &&
    value.every(entry => typeof entry === 'number' && Number.isFinite(entry)) &&
    value[2] > 0 &&
    value[3] > 0 &&
    value[0] >= 0 &&
    value[1] >= 0 &&
    value[0] + value[2] <= 1 &&
    value[1] + value[3] <= 1
  );
}

// Largest distance any edge of the region travels, as a fraction of the frame.
// Translation moves the whole region; a scale moves its edges by half the
// change in extent. Both are displacement, so both answer to the same budget.
function displacement(channel, region) {
  const amount = channel.amount ?? 0;
  const range = channel.range ?? [1, 1];
  const extent = Math.max(range[0], range[1]) - Math.min(range[0], range[1]);
  switch (channel.motion) {
    case 'translate':
      return Math.abs(amount);
    case 'scaleX':
      return (extent * region.rect[2]) / 2;
    case 'scaleY':
      return (extent * region.rect[3]) / 2;
    default:
      return 0;
  }
}

export function validateRig(rig) {
  const errors = [];
  if (!rig || rig.kind !== RIG_KIND) {
    return { ok: false, errors: [`kind must be ${RIG_KIND}`] };
  }
  if (typeof rig.source !== 'string' || rig.source.trim() === '') {
    errors.push('source must name the still the rig animates');
  }
  const regions = rig.regions ?? {};
  if (Object.keys(regions).length === 0) errors.push('a rig needs at least one region');
  for (const [name, region] of Object.entries(regions)) {
    if (!isRect(region?.rect)) {
      errors.push(`region "${name}": rect must be four normalised numbers inside the frame`);
    }
  }
  const states = rig.states ?? {};
  if (Object.keys(states).length === 0) errors.push('a rig needs at least one state');
  for (const [stateName, channels] of Object.entries(states)) {
    if (!Array.isArray(channels) || channels.length === 0) {
      errors.push(`state "${stateName}" must list at least one channel`);
      continue;
    }
    for (const channel of channels) {
      const region = regions[channel?.region];
      if (!region) {
        errors.push(`state "${stateName}": unknown region "${channel?.region}"`);
        continue;
      }
      if (!MOTIONS.includes(channel.motion)) {
        errors.push(
          `state "${stateName}" region "${channel.region}": motion must be one of ${MOTIONS.join(', ')}`,
        );
        continue;
      }
      if (channel.motion !== 'hold' && !DRIVERS.includes(channel.driver)) {
        errors.push(
          `state "${stateName}" region "${channel.region}": driver must be one of ${DRIVERS.join(', ')}`,
        );
      }
      if (channel.motion === 'rotate') {
        const degrees = Math.abs(channel.amount ?? 0);
        if (degrees > BUDGET.rotateDegrees) {
          errors.push(
            `state "${stateName}" region "${channel.region}": rotating ${degrees}° exceeds the ${BUDGET.rotateDegrees}° occlusion budget. ` +
              'A single still cannot show what rotating past that uncovers; supply a multi-pose sprite sheet instead.',
          );
        }
      }
      const moved = displacement(channel, region);
      if (!Number.isFinite(moved)) {
        errors.push(
          `state "${stateName}" region "${channel.region}": ${channel.motion} needs a finite numeric amount or range`,
        );
      } else if (moved > BUDGET.translateFraction + 1e-9) {
        errors.push(
          `state "${stateName}" region "${channel.region}": displacing ${(moved * 100).toFixed(1)}% of the frame exceeds the ${(BUDGET.translateFraction * 100).toFixed(0)}% occlusion budget. ` +
            'A single still cannot show what moving that far uncovers; supply a multi-pose sprite sheet instead.',
        );
      }
      if (channel.motion === 'swap' && !Array.isArray(channel.variants)) {
        errors.push(`state "${stateName}" region "${channel.region}": swap needs a variants array`);
      }
    }
  }
  return { ok: errors.length === 0, errors };
}

// ---------------------------------------------------------------------------
// Drivers: every one returns 0..1 for a given frame, deterministically.
// ---------------------------------------------------------------------------

function pulseTrain({ frameCount, seed, density = 0.08, width = 2 }) {
  const random = mulberry32(seed);
  const values = new Array(frameCount).fill(0);
  for (let frame = 0; frame < frameCount; frame += 1) {
    if (random() < density) {
      for (let step = 0; step < width && frame + step < frameCount; step += 1) {
        // A blink shuts fast and opens slightly slower.
        values[frame + step] = Math.max(values[frame + step], step === 0 ? 1 : 1 - step / width);
      }
    }
  }
  return values;
}

// Speech-shaped rather than speech-derived. There is no audio anywhere in this
// pipeline and the provenance record says so.
function speechEnvelope({ frameCount, seed }) {
  const random = mulberry32(seed);
  const values = new Array(frameCount).fill(0);
  let frame = 0;
  while (frame < frameCount) {
    const silent = random() < 0.22;
    const run = 2 + Math.floor(random() * 5);
    const peak = silent ? 0 : 0.45 + random() * 0.55;
    for (let step = 0; step < run && frame < frameCount; step += 1, frame += 1) {
      const shape = Math.sin((Math.PI * (step + 0.5)) / run);
      values[frame] = peak * shape;
    }
  }
  return values;
}

export function driverSeries(channel, frameCount) {
  const seed = channel.seed ?? 1;
  switch (channel.driver) {
    case 'sine': {
      const cycles = channel.cycles ?? 1;
      const phase = channel.phase ?? 0;
      return Array.from({ length: frameCount }, (_unused, frame) =>
        (Math.sin(2 * Math.PI * ((frame / frameCount) * cycles + phase)) + 1) / 2,
      );
    }
    case 'loop': {
      const values = channel.values ?? [0, 1];
      return Array.from({ length: frameCount }, (_unused, frame) => values[frame % values.length]);
    }
    case 'random':
      return pulseTrain({ frameCount, seed, density: channel.density ?? 0.08, width: channel.width ?? 3 });
    case 'envelope':
      return speechEnvelope({ frameCount, seed });
    default:
      return new Array(frameCount).fill(0);
  }
}

function lerp(range, amount) {
  const [low, high] = range ?? [0, 1];
  return low + (high - low) * amount;
}

/**
 * Applies one state to the still for a single frame.
 *
 * Returns a fresh raster plus the cell rectangles that changed, so the caller
 * can re-convert only those. Converting the static background exactly once is
 * what makes quantisation shimmer structurally impossible rather than merely
 * unlikely.
 */
export function applyState({ rig, state, still, frameIndex, frameCount, series, variants = {} }) {
  const channels = rig.states[state];
  const target = cloneRaster(still);
  const dirty = [];
  channels.forEach((channel, channelIndex) => {
    const region = rig.regions[channel.region];
    const bounds = regionPixels(region.rect, still.width, still.height);
    if (channel.motion === 'hold') return;
    const amount = series[channelIndex][frameIndex];
    switch (channel.motion) {
      case 'translate': {
        const axis = channel.axis ?? 'x';
        const distance = lerp([-(channel.amount ?? 0), channel.amount ?? 0], amount);
        warpRegion({
          source: still,
          target,
          bounds,
          translate: axis === 'x' ? [distance * still.width, 0] : [0, distance * still.height],
        });
        break;
      }
      case 'scaleX':
        warpRegion({ source: still, target, bounds, scale: [lerp(channel.range, amount), 1] });
        break;
      case 'scaleY':
        warpRegion({ source: still, target, bounds, scale: [1, lerp(channel.range, amount)] });
        break;
      case 'rotate':
        warpRegion({
          source: still,
          target,
          bounds,
          rotate: (lerp([-(channel.amount ?? 0), channel.amount ?? 0], amount) * Math.PI) / 180,
        });
        break;
      case 'blink':
        lowerLid({ source: still, target, bounds, amount });
        break;
      case 'swap': {
        const list = channel.variants ?? [];
        const pick = list[Math.min(list.length - 1, Math.floor(amount * list.length))];
        const image = variants[pick];
        if (image) {
          warpRegion({ source: image, target, bounds });
        }
        break;
      }
      default:
        break;
    }
    dirty.push(bounds);
  });
  return { raster: target, dirty };
}

/** Pre-computes every channel's driver series, so a state is deterministic. */
export function compileState({ rig, state, frameCount }) {
  return rig.states[state].map(channel => driverSeries(channel, frameCount));
}

/** Union of pixel rectangles, expressed in whole cells and clamped to the grid. */
export function dirtyCells({ rects, raster, cols, rows, pad = 1 }) {
  if (rects.length === 0) return { col: 0, row: 0, cols: 0, rows: 0 };
  const cellWidth = raster.width / cols;
  const cellHeight = raster.height / rows;
  let minCol = cols;
  let minRow = rows;
  let maxCol = -1;
  let maxRow = -1;
  for (const rect of rects) {
    minCol = Math.min(minCol, Math.floor(rect.x / cellWidth) - pad);
    minRow = Math.min(minRow, Math.floor(rect.y / cellHeight) - pad);
    maxCol = Math.max(maxCol, Math.ceil((rect.x + rect.width) / cellWidth) + pad);
    maxRow = Math.max(maxRow, Math.ceil((rect.y + rect.height) / cellHeight) + pad);
  }
  const col = Math.max(0, minCol);
  const row = Math.max(0, minRow);
  return {
    col,
    row,
    cols: Math.min(cols, maxCol) - col,
    rows: Math.min(rows, maxRow) - row,
  };
}
