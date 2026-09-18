// Raster to character cells.
//
// The fidelity jump over the v1 glyph ramp comes from two properties, neither
// of which needs glyph shape-matching, a font, or an external tool:
//
//   1. per-cell foreground AND background colour, and
//   2. sub-cell resolution — a half block carries two independent colours and
//      so doubles vertical resolution; quadrants double both axes.
//
// Everything here is arithmetic over an RGB buffer.

import { RGB } from './raster.mjs';

export const CELL_PALETTES = Object.freeze(['half', 'quad']);
export const MONO_RAMPS = Object.freeze({
  blocks: [' ', '░', '▒', '▓', '█'],
  ascii: [' ', '.', ':', '-', '=', '+', '*', '#', '%', '@'],
  minimal: [' ', '.', '*', '#'],
});

// Quadrant glyph for a 4-bit occupancy mask: TL=1, TR=2, BL=4, BR=8.
const QUADRANTS = [
  ' ', '▘', '▝', '▀', '▖', '▌', '▞', '▛',
  '▗', '▚', '▐', '▜', '▄', '▙', '▟', '█',
];

function averageBlock(raster, x0, y0, width, height) {
  let r = 0;
  let g = 0;
  let b = 0;
  let count = 0;
  const maxX = Math.min(x0 + width, raster.width);
  const maxY = Math.min(y0 + height, raster.height);
  for (let y = y0; y < maxY; y += 1) {
    for (let x = x0; x < maxX; x += 1) {
      const offset = (y * raster.width + x) * RGB;
      r += raster.data[offset];
      g += raster.data[offset + 1];
      b += raster.data[offset + 2];
      count += 1;
    }
  }
  return count === 0 ? [0, 0, 0] : [r / count, g / count, b / count];
}

function distance(a, b) {
  const dr = a[0] - b[0];
  const dg = a[1] - b[1];
  const db = a[2] - b[2];
  return dr * dr + dg * dg + db * db;
}

function mean(colours) {
  if (colours.length === 0) return [0, 0, 0];
  const total = colours.reduce(
    (acc, colour) => [acc[0] + colour[0], acc[1] + colour[1], acc[2] + colour[2]],
    [0, 0, 0],
  );
  return total.map(value => value / colours.length);
}

export function luminance([r, g, b]) {
  return (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
}

// Splits four sub-cell colours into two groups and returns the glyph whose
// partition matches, plus the mean colour of each group. Picking the two most
// distant samples as seeds is enough at this size and is deterministic, which
// matters because clips must reproduce byte for byte.
function partitionQuad(samples) {
  let seedA = 0;
  let seedB = 1;
  let best = -1;
  for (let i = 0; i < samples.length; i += 1) {
    for (let j = i + 1; j < samples.length; j += 1) {
      const spread = distance(samples[i], samples[j]);
      if (spread > best) {
        best = spread;
        seedA = i;
        seedB = j;
      }
    }
  }
  if (best === 0) {
    return { glyph: '█', fg: samples[0], bg: samples[0] };
  }
  let mask = 0;
  const groupA = [];
  const groupB = [];
  samples.forEach((sample, index) => {
    if (distance(sample, samples[seedA]) <= distance(sample, samples[seedB])) {
      groupA.push(sample);
      mask |= 1 << index;
    } else {
      groupB.push(sample);
    }
  });
  const fg = mean(groupA);
  const bg = mean(groupB);
  // Keep the brighter group as foreground so a mono reader of `ch` still sees
  // a sensible image.
  if (luminance(bg) > luminance(fg)) {
    return { glyph: QUADRANTS[(~mask) & 0b1111], fg: bg, bg: fg };
  }
  return { glyph: QUADRANTS[mask], fg, bg };
}

/**
 * Converts a raster into character cells.
 *
 * `bounds` restricts the work to a cell rectangle, which is how the dirty-rect
 * path avoids re-converting a static background.
 */
export function rasterToCells({ raster, cols, rows, palette = 'half', into = null, bounds = null }) {
  const cellWidth = raster.width / cols;
  const cellHeight = raster.height / rows;
  const ch = into ? into.ch : Array.from({ length: rows }, () => new Array(cols).fill(' '));
  const fg = into ? into.fg : new Array(cols * rows).fill(null);
  const bg = into ? into.bg : new Array(cols * rows).fill(null);
  const area = bounds ?? { col: 0, row: 0, cols, rows };
  const mono = MONO_RAMPS[palette];

  for (let row = area.row; row < area.row + area.rows; row += 1) {
    for (let col = area.col; col < area.col + area.cols; col += 1) {
      const x0 = Math.floor(col * cellWidth);
      const y0 = Math.floor(row * cellHeight);
      const w = Math.max(1, Math.floor(cellWidth));
      const h = Math.max(1, Math.floor(cellHeight));
      const index = row * cols + col;
      if (mono) {
        const value = luminance(averageBlock(raster, x0, y0, w, h));
        const step = Math.min(mono.length - 1, Math.max(0, Math.round(value * (mono.length - 1))));
        ch[row][col] = mono[step];
        fg[index] = [255, 255, 255];
        bg[index] = [0, 0, 0];
        continue;
      }
      const halfW = Math.max(1, Math.floor(w / 2));
      const halfH = Math.max(1, Math.floor(h / 2));
      if (palette === 'half') {
        const top = averageBlock(raster, x0, y0, w, halfH);
        const bottom = averageBlock(raster, x0, y0 + halfH, w, h - halfH);
        ch[row][col] = '▀';
        fg[index] = top;
        bg[index] = bottom;
        continue;
      }
      const samples = [
        averageBlock(raster, x0, y0, halfW, halfH),
        averageBlock(raster, x0 + halfW, y0, w - halfW, halfH),
        averageBlock(raster, x0, y0 + halfH, halfW, h - halfH),
        averageBlock(raster, x0 + halfW, y0 + halfH, w - halfW, h - halfH),
      ];
      const picked = partitionQuad(samples);
      ch[row][col] = picked.glyph;
      fg[index] = picked.fg;
      bg[index] = picked.bg;
    }
  }
  return { ch, fg, bg };
}

// ---------------------------------------------------------------------------
// Palette quantisation
// ---------------------------------------------------------------------------

function boxOf(colours) {
  const low = [255, 255, 255];
  const high = [0, 0, 0];
  for (const colour of colours) {
    for (let channel = 0; channel < RGB; channel += 1) {
      if (colour[channel] < low[channel]) low[channel] = colour[channel];
      if (colour[channel] > high[channel]) high[channel] = colour[channel];
    }
  }
  return { colours, low, high, spread: Math.max(...high.map((v, i) => v - low[i])) };
}

/**
 * Median-cut quantisation to at most `max` entries. Deterministic: ties in the
 * sort resolve by channel order, and no randomness is involved anywhere.
 */
export function quantise(colours, max = 256) {
  if (colours.length === 0) return [[0, 0, 0]];
  let boxes = [boxOf(colours)];
  while (boxes.length < max) {
    boxes.sort((a, b) => b.spread - a.spread || b.colours.length - a.colours.length);
    const target = boxes.find(box => box.colours.length > 1 && box.spread > 0);
    if (!target) break;
    const channel = target.high.map((v, i) => v - target.low[i]).indexOf(target.spread);
    const sorted = [...target.colours].sort((a, b) => a[channel] - b[channel]);
    const middle = Math.floor(sorted.length / 2);
    boxes = boxes.filter(box => box !== target);
    boxes.push(boxOf(sorted.slice(0, middle)), boxOf(sorted.slice(middle)));
  }
  return boxes.map(box => mean(box.colours).map(value => Math.round(value)));
}

export function toHex([r, g, b]) {
  const clamp = value => Math.min(255, Math.max(0, Math.round(value)));
  return `#${[r, g, b].map(v => clamp(v).toString(16).padStart(2, '0')).join('')}`;
}

export function fromHex(hex) {
  const value = hex.replace('#', '');
  return [
    Number.parseInt(value.slice(0, 2), 16),
    Number.parseInt(value.slice(2, 4), 16),
    Number.parseInt(value.slice(4, 6), 16),
  ];
}

export function createIndexer(palette) {
  const cache = new Map();
  return colour => {
    const key = `${Math.round(colour[0])},${Math.round(colour[1])},${Math.round(colour[2])}`;
    const hit = cache.get(key);
    if (hit !== undefined) return hit;
    let best = 0;
    let bestDistance = Infinity;
    for (let index = 0; index < palette.length; index += 1) {
      const candidate = distance(colour, palette[index]);
      if (candidate < bestDistance) {
        bestDistance = candidate;
        best = index;
      }
    }
    cache.set(key, best);
    return best;
  };
}

// ---------------------------------------------------------------------------
// Cells back to pixels, for the GIF path
// ---------------------------------------------------------------------------

// Every glyph the colour path emits is an axis-aligned partition of the cell,
// so drawing one is rectangle fills. No font file, no glyph metrics, and no
// `drawtext` — which cannot carry per-cell colour at all.
const PARTITIONS = {
  ' ': [],
  '█': [[0, 0, 1, 1]],
  '▀': [[0, 0, 1, 0.5]],
  '▄': [[0, 0.5, 1, 0.5]],
  '▌': [[0, 0, 0.5, 1]],
  '▐': [[0.5, 0, 0.5, 1]],
  '▘': [[0, 0, 0.5, 0.5]],
  '▝': [[0.5, 0, 0.5, 0.5]],
  '▖': [[0, 0.5, 0.5, 0.5]],
  '▗': [[0.5, 0.5, 0.5, 0.5]],
  '▛': [[0, 0, 1, 0.5], [0, 0.5, 0.5, 0.5]],
  '▜': [[0, 0, 1, 0.5], [0.5, 0.5, 0.5, 0.5]],
  '▙': [[0, 0, 0.5, 0.5], [0, 0.5, 1, 0.5]],
  '▟': [[0.5, 0, 0.5, 0.5], [0, 0.5, 1, 0.5]],
  '▚': [[0, 0, 0.5, 0.5], [0.5, 0.5, 0.5, 0.5]],
  '▞': [[0.5, 0, 0.5, 0.5], [0, 0.5, 0.5, 0.5]],
};

// Shade blocks are partial coverage rather than a partition, so they rasterise
// as a blend of the two cell colours. This is what lets a mono ramp clip go
// through the same path as a colour one.
const SHADES = { '░': 0.25, '▒': 0.5, '▓': 0.75 };

export function isRasterisableGlyph(glyph) {
  return (
    Object.prototype.hasOwnProperty.call(PARTITIONS, glyph) ||
    Object.prototype.hasOwnProperty.call(SHADES, glyph)
  );
}

export function rasteriseCells({ ch, fg, bg, cols, rows, cellWidth = 8, cellHeight = 16 }) {
  const width = cols * cellWidth;
  const height = rows * cellHeight;
  const data = new Uint8Array(width * height * RGB);
  const paint = (x0, y0, w, h, colour) => {
    for (let y = y0; y < y0 + h; y += 1) {
      for (let x = x0; x < x0 + w; x += 1) {
        const offset = (y * width + x) * RGB;
        data[offset] = colour[0];
        data[offset + 1] = colour[1];
        data[offset + 2] = colour[2];
      }
    }
  };
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const glyph = ch[row][col];
      const x0 = col * cellWidth;
      const y0 = row * cellHeight;
      const coverage = SHADES[glyph];
      if (coverage !== undefined) {
        const blended = bg[index].map(
          (value, channel) => Math.round(value + (fg[index][channel] - value) * coverage),
        );
        paint(x0, y0, cellWidth, cellHeight, blended);
        continue;
      }
      paint(x0, y0, cellWidth, cellHeight, bg[index]);
      for (const [rx, ry, rw, rh] of PARTITIONS[glyph] ?? PARTITIONS['█']) {
        paint(
          x0 + Math.round(rx * cellWidth),
          y0 + Math.round(ry * cellHeight),
          Math.round(rw * cellWidth),
          Math.round(rh * cellHeight),
          fg[index],
        );
      }
    }
  }
  return { width, height, data };
}
