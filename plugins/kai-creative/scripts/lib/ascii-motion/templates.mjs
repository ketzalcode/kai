import { buildFrames } from './frames.mjs';
import { buildProvenance } from './provenance.mjs';

export const TEMPLATE_IDS = Object.freeze(['walk-cycle', 'orbit', 'rain']);

const GLYPHS = {
  blocks: ['█', '▓', '▒', '░'],
  ascii: ['@', '#', '+', '.'],
  minimal: ['#', '.', '.', '.'],
};

function blankGrid(cols, rows) {
  return Array.from({ length: rows }, () => Array.from({ length: cols }, () => ' '));
}

function toRows(grid) {
  return grid.map(row => row.join(''));
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function walkCycle({ cols, rows, frameCount, glyphs }) {
  // The subject scales with the grid; a fixed-size silhouette is lost on a
  // tall profile and clipped on a short one.
  const scale = Math.max(1, Math.floor(rows / 8));
  const legLength = scale;
  const bodyHeight = Math.max(2, scale * 2);
  const bodyWidth = Math.max(6, Math.min(28, Math.round(cols * 0.22)));
  // Leave ground margin so the feet are not clipped by the frame edge.
  const baseline = rows - 1 - Math.max(1, scale - 1);
  const bodyBottom = baseline - legLength;
  const bodyTop = Math.max(0, bodyBottom - bodyHeight + 1);
  const headHeight = Math.max(1, scale);
  const headWidth = Math.max(2, scale + 1);
  // Two-phase gait: contact and passing. Fore and hind legs swap each phase so
  // the silhouette reads as a walk rather than a sliding block.
  const gait = [
    [0, 1, 1, 0],
    [1, 0, 0, 1],
  ];
  return Array.from({ length: frameCount }, (_unused, frame) => {
    const grid = blankGrid(cols, rows);
    const x = Math.floor((frame / frameCount) * cols);
    const put = (col, row, glyph) => {
      // The subject wraps rather than entering and exiting, so every frame
      // carries content and the loop has no blank seam.
      const wrapped = ((col % cols) + cols) % cols;
      if (row >= 0 && row < rows) grid[row][wrapped] = glyph;
    };
    const bob = frame % 2 === 0 ? 0 : 1;
    // A solid rectangle reads as a brick, so the body is an outline with a
    // lighter interior.
    for (let dy = bodyTop; dy <= bodyBottom; dy += 1) {
      for (let dx = 0; dx < bodyWidth; dx += 1) {
        const edge = dy === bodyTop || dy === bodyBottom || dx === 0 || dx === bodyWidth - 1;
        put(x + dx, dy - bob, edge ? glyphs[0] : glyphs[2]);
      }
    }
    const headX = x + bodyWidth;
    const headTop = Math.max(0, bodyTop - headHeight - bob);
    for (let dy = headTop; dy <= headTop + headHeight; dy += 1) {
      for (let dx = 0; dx < headWidth; dx += 1) {
        const edge = dy === headTop || dy === headTop + headHeight || dx === 0 || dx === headWidth - 1;
        put(headX + dx, dy, edge ? glyphs[0] : glyphs[2]);
      }
    }
    // A snout forward and an ear up stop the head reading as another box.
    put(headX + headWidth, headTop + headHeight, glyphs[1]);
    put(headX, headTop - 1, glyphs[1]);
    for (let dy = 0; dy < headHeight; dy += 1) {
      put(x - 1 - dy, bodyTop - bob - dy, glyphs[1]);
    }
    const phase = gait[frame % gait.length];
    const legXs = [x, x + 1, x + bodyWidth - 2, x + bodyWidth - 1];
    legXs.forEach((legX, index) => {
      const lift = phase[index];
      const length = Math.max(1, legLength - lift);
      for (let dy = 0; dy < length; dy += 1) {
        put(legX + lift, bodyBottom - bob + 1 + dy, lift === 0 ? glyphs[0] : glyphs[1]);
      }
    });
    return toRows(grid);
  });
}

function orbit({ cols, rows, frameCount, glyphs }) {
  const cx = (cols - 1) / 2;
  const cy = (rows - 1) / 2;
  const radiusX = Math.max(1, cx - 1);
  const radiusY = Math.max(1, cy - 1);
  const at = angle => ({
    x: Math.min(cols - 1, Math.max(0, Math.round(cx + Math.cos(angle) * radiusX))),
    y: Math.min(rows - 1, Math.max(0, Math.round(cy + Math.sin(angle) * radiusY))),
  });
  // A lone dot on a ring does not read as motion, so the satellite drags a
  // fading trail. Trail length scales with the ring so small grids stay legible.
  const trail = Math.max(2, Math.min(6, Math.round(frameCount / 2)));
  return Array.from({ length: frameCount }, (_unused, frame) => {
    const grid = blankGrid(cols, rows);
    const core = at(0);
    grid[Math.round(cy)][Math.round(cx)] = glyphs[0];
    grid[core.y][core.x] = grid[core.y][core.x];
    for (let back = trail; back >= 1; back -= 1) {
      const angle = ((frame - back * 0.5) / frameCount) * Math.PI * 2;
      const point = at(angle);
      const glyph = glyphs[Math.min(glyphs.length - 1, 1 + Math.floor((back / trail) * 2))];
      if (grid[point.y][point.x] === ' ') grid[point.y][point.x] = glyph;
    }
    const head = at((frame / frameCount) * Math.PI * 2);
    grid[head.y][head.x] = glyphs[0];
    return toRows(grid);
  });
}

function rain({ cols, rows, frameCount, glyphs, seed }) {
  const random = mulberry32(seed);
  const drops = Array.from({ length: cols }, () => Math.floor(random() * rows));
  return Array.from({ length: frameCount }, (_unused, frame) => {
    const grid = blankGrid(cols, rows);
    for (let col = 0; col < cols; col += 1) {
      const head = (drops[col] + frame) % rows;
      grid[head][col] = glyphs[0];
      if (head - 1 >= 0) grid[head - 1][col] = glyphs[2];
    }
    return toRows(grid);
  });
}

const RENDERERS = { 'walk-cycle': walkCycle, orbit, rain };

export function renderTemplate({ id, profile, frameCount, operator, seed = 1, createdAt }) {
  if (!TEMPLATE_IDS.includes(id)) {
    return {
      ok: false,
      doc: null,
      errors: [`unknown template "${id}"; v1 ships ${TEMPLATE_IDS.join(', ')}`],
    };
  }
  const glyphs = GLYPHS[profile.palette] ?? GLYPHS.blocks;
  const frames = RENDERERS[id]({
    cols: profile.cols,
    rows: profile.rows,
    frameCount,
    glyphs,
    seed,
  });
  const provenance = buildProvenance({
    tier: 2,
    source: `template:${id}`,
    license: 'kai-creative-builtin',
    operator,
    createdAt,
    notes: [`seed=${seed}`],
  });
  return { ok: true, doc: buildFrames({ profile, frames, provenance }), errors: [] };
}
