import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { createRaster, RGB } from '../scripts/lib/ascii-motion/raster.mjs';
import { rasterToCells, rasteriseCells, luminance } from '../scripts/lib/ascii-motion/cells.mjs';
import { buildFrames, buildColourFrames, decodeColourFrame, validateFrames, frameRows, FRAMES_KIND, FRAMES_KIND_V2 }
  from '../scripts/lib/ascii-motion/frames.mjs';
import { validateRig, BUDGET } from '../scripts/lib/ascii-motion/rig.mjs';
import { buildPhotoClip } from '../scripts/lib/ascii-motion/photo.mjs';
import { resolveProfile } from '../scripts/lib/ascii-motion/profile.mjs';
import { buildBundle } from '../scripts/lib/ascii-motion/bundle.mjs';
import { buildProvenance } from '../scripts/lib/ascii-motion/provenance.mjs';
import { decodeClip, paintFrame } from '../scripts/lib/ascii-motion/player.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
assert.equal(process.argv.length, 2, 'the ascii motion check takes no arguments');
assert.ok(typeof buildColourFrames === 'function', 'the colour encoder must be exported');

const CREATED_AT = '2026-09-17T00:00:00.000Z';
const OPERATOR = 'self-test';

function paint(raster, x0, y0, w, h, colour) {
  for (let y = y0; y < y0 + h; y += 1) {
    for (let x = x0; x < x0 + w; x += 1) {
      const offset = (y * raster.width + x) * RGB;
      for (let channel = 0; channel < RGB; channel += 1) raster.data[offset + channel] = colour[channel];
    }
  }
  return raster;
}

// A synthetic still stands in for a photograph. It is deterministic, needs no
// decoder, and still exercises every colour path a real image would.
function synthetic() {
  const still = createRaster(160, 96, 0);
  paint(still, 0, 0, 160, 96, [10, 12, 20]);
  paint(still, 40, 16, 80, 64, [220, 180, 150]);
  paint(still, 56, 36, 16, 6, [40, 60, 120]);
  paint(still, 92, 36, 16, 6, [40, 60, 120]);
  paint(still, 68, 60, 28, 8, [140, 40, 50]);
  return still;
}

const rig = {
  kind: 'kai.ascii-motion-rig/v1',
  source: 'synthetic',
  regions: {
    mouth: { rect: [0.4, 0.58, 0.22, 0.1] },
    eyes: { rect: [0.32, 0.36, 0.38, 0.09] },
  },
  states: {
    talk: [
      { region: 'mouth', motion: 'scaleY', driver: 'envelope', seed: 11, range: [1, 1.8] },
      { region: 'eyes', motion: 'blink', driver: 'random', seed: 3, density: 0.1, width: 3 },
    ],
  },
};

const COLS = 40;
const ROWS = 24;

function photoClip(overrides = {}) {
  const { profile } = resolveProfile({ profile: 'photo' });
  const result = buildPhotoClip({
    still: synthetic(),
    rig,
    state: 'talk',
    frameCount: 8,
    profile: { ...profile, cols: COLS, rows: ROWS },
    palette: 'half',
    operator: OPERATOR,
    createdAt: CREATED_AT,
    source: 'synthetic',
    ...overrides,
  });
  assert.deepEqual(result.errors, [], 'the synthetic clip must build cleanly');
  return result.doc;
}

// Renderer golden. A half-block cell carries two independent colours, which is
// the whole reason this pipeline is sharper than v1's mono ramp.
{
  const raster = createRaster(2, 4, 0);
  paint(raster, 0, 0, 2, 2, [255, 0, 0]);
  paint(raster, 0, 2, 2, 2, [0, 0, 255]);
  const cells = rasterToCells({ raster, cols: 1, rows: 1, palette: 'half' });
  assert.equal(cells.ch[0][0], '▀', 'a top/bottom split resolves to the upper half block');
  assert.deepEqual(cells.fg[0].map(Math.round), [255, 0, 0], 'the foreground is the top half');
  assert.deepEqual(cells.bg[0].map(Math.round), [0, 0, 255], 'the background is the bottom half');
  assert.ok(luminance([255, 255, 255]) > luminance([0, 0, 0]), 'luminance must be monotonic');
}

// Quadrants split both axes, so a left/right divide must not collapse to one
// colour the way a mono ramp would.
{
  const raster = createRaster(4, 4, 0);
  paint(raster, 0, 0, 2, 4, [255, 255, 255]);
  paint(raster, 2, 0, 2, 4, [0, 0, 0]);
  const cells = rasterToCells({ raster, cols: 1, rows: 1, palette: 'quad' });
  assert.equal(cells.ch[0][0], '▌', 'a left/right split resolves to the left half block');
  assert.deepEqual(cells.fg[0].map(Math.round), [255, 255, 255], 'the brighter group leads');
}

// Rasterising a cell back out reproduces the split, so the looping image and
// the browser cannot disagree about what a glyph means.
{
  const out = rasteriseCells({
    ch: [['▀']],
    fg: [[255, 0, 0]],
    bg: [[0, 0, 255]],
    cols: 1,
    rows: 1,
    cellWidth: 2,
    cellHeight: 4,
  });
  assert.deepEqual([...out.data.slice(0, 3)], [255, 0, 0], 'the top half rasterises as foreground');
  const bottom = 3 * out.width * RGB;
  assert.deepEqual([...out.data.slice(bottom, bottom + 3)], [0, 0, 255], 'the bottom half is background');
}

// A shade block is partial coverage, not a partition. It must blend, or a mono
// ramp clip would render as solid blocks once it travels the colour path.
{
  const out = rasteriseCells({
    ch: [['▒']],
    fg: [[255, 255, 255]],
    bg: [[0, 0, 0]],
    cols: 1,
    rows: 1,
    cellWidth: 1,
    cellHeight: 1,
  });
  assert.deepEqual([...out.data.slice(0, 3)], [128, 128, 128], 'a medium shade blends halfway');
}

// IR v2 round-trip: what goes in comes out, dirty rectangles and all.
{
  const doc = photoClip();
  assert.equal(doc.kind, FRAMES_KIND_V2, 'the photo path emits IR v2');
  assert.deepEqual(validateFrames(doc).errors, [], 'a built v2 document must validate');
  assert.deepEqual(doc.frames[0].rect, [0, 0, COLS, ROWS], 'frame 0 carries the whole grid');
  assert.ok(doc.colorPalette.length <= 256, 'the palette is bounded at a single byte per cell');

  for (let index = 0; index < doc.frameCount; index += 1) {
    const frame = decodeColourFrame(doc, index);
    assert.equal(frame.fg.length, COLS * ROWS, `frame ${index} decodes to the full grid`);
    assert.equal(frame.bg.length, COLS * ROWS, `frame ${index} decodes both planes`);
    assert.equal(frame.ch.length, ROWS, `frame ${index} carries every row`);
    assert.ok(frame.ch.every(row => row.length === COLS), `frame ${index} rows are the full width`);
  }
}

// Dirty-rect stability. Cells outside the rig's reach are byte-identical to
// frame 0, which is what makes quantisation shimmer structurally impossible
// rather than merely unlikely.
{
  const doc = photoClip();
  const base = decodeColourFrame(doc, 0);
  for (let index = 1; index < doc.frameCount; index += 1) {
    const [col0, row0, width, height] = doc.frames[index].rect ?? [0, 0, 0, 0];
    const decoded = decodeColourFrame(doc, index);
    let compared = 0;
    for (let row = 0; row < ROWS; row += 1) {
      for (let col = 0; col < COLS; col += 1) {
        if (col >= col0 && col < col0 + width && row >= row0 && row < row0 + height) continue;
        const cell = row * COLS + col;
        assert.equal(decoded.fg[cell], base.fg[cell], `static cell ${col},${row} drifted in frame ${index}`);
        assert.equal(decoded.bg[cell], base.bg[cell], `static cell ${col},${row} drifted in frame ${index}`);
        assert.equal(decoded.ch[row][col], base.ch[row][col], `static glyph ${col},${row} drifted`);
        compared += 1;
      }
    }
    assert.ok(compared > 0, `frame ${index} must leave some of the grid static`);
  }
}

// Determinism. The same still, rig and seed must produce a byte-identical clip,
// or a rebuild would churn a committed artifact for no reason.
{
  assert.equal(JSON.stringify(photoClip()), JSON.stringify(photoClip()),
    'the photo path must be deterministic');
}

// The occlusion budget refuses by name and points somewhere, rather than
// silently producing a frame that exposes what a photograph cannot show.
{
  const check = validateRig({
    ...rig,
    states: {
      walk: [{ region: 'mouth', motion: 'translate', driver: 'sine', amount: BUDGET.translateFraction * 3 }],
    },
  });
  assert.equal(check.ok, false, 'a large translation must be refused');
  const joined = check.errors.join(' ');
  assert.match(joined, /mouth/, 'the refusal names the region');
  assert.match(joined, /multi-pose sprite sheet/, 'the refusal points at the deferred path');
}

// A malformed amount must be an error, not a budget check that quietly passes
// because the comparison was against NaN.
{
  const check = validateRig({
    ...rig,
    states: {
      walk: [{ region: 'mouth', motion: 'translate', driver: 'sine', amount: [0.5, 0] }],
    },
  });
  assert.equal(check.ok, false, 'a non-numeric amount must be refused');
  assert.match(check.errors.join(' '), /finite numeric amount/, 'the error says what was wrong');
}

{
  const check = validateRig({ ...rig, states: { talk: [{ region: 'jaw', motion: 'hold' }] } });
  assert.equal(check.ok, false, 'a channel must not reference an undeclared region');
  assert.match(check.errors.join(' '), /jaw/, 'the error names the missing region');
}

// v1 documents still validate and still read, because bundles already shipped
// are not ours to break.
{
  const { profile } = resolveProfile({});
  const rowsOf = count => Array.from({ length: profile.rows }, () => '#'.repeat(profile.cols));
  const v1 = buildFrames({
    profile,
    frames: Array.from({ length: 3 }, rowsOf),
    provenance: buildProvenance({
      tier: 2,
      source: 'template:self-test',
      license: 'procedural',
      operator: OPERATOR,
      createdAt: CREATED_AT,
    }),
  });
  assert.equal(v1.kind, FRAMES_KIND, 'the template path still emits IR v1');
  assert.deepEqual(validateFrames(v1).errors, [], 'a v1 document must still validate');
  assert.equal(frameRows(v1, 0).length, profile.rows, 'v1 rows read through the shared accessor');
  assert.equal(frameRows(photoClip(), 0).length, ROWS, 'v2 rows read through the same accessor');
}

// A bundle is a set of clips a host page switches between, so a colour clip and
// a mono clip together would snap on switch. Reject rather than resize.
{
  const colour = photoClip();
  const { profile } = resolveProfile({});
  const mono = buildFrames({
    profile: { ...profile, cols: COLS, rows: ROWS },
    frames: [Array.from({ length: ROWS }, () => '#'.repeat(COLS))],
    provenance: buildProvenance({
      tier: 2,
      source: 'template:self-test',
      license: 'procedural',
      operator: OPERATOR,
      createdAt: CREATED_AT,
    }),
  });
  const mixed = buildBundle({
    clips: [
      { name: 'talk', framesRef: 'talk.json', doc: colour },
      { name: 'idle', framesRef: 'idle.json', doc: mono },
    ],
    defaultClip: 'talk',
  });
  assert.equal(mixed.ok, false, 'a mixed-colour bundle must be rejected');
  assert.match(mixed.errors.join(' '), /colour \w+ disagrees with bundle colour/,
    'the rejection names colour as the disagreement');

  const uniform = buildBundle({
    clips: [
      { name: 'talk', framesRef: 'talk.json', doc: colour },
      { name: 'again', framesRef: 'again.json', doc: photoClip() },
    ],
    defaultClip: 'talk',
  });
  assert.deepEqual(uniform.errors, [], 'clips that agree must bundle cleanly');
}

// The player ships to browsers verbatim, so drive it through a stub context and
// confirm it paints what the looping image paints. A disagreement here would
// otherwise only surface in someone else's browser.
{
  const doc = photoClip();
  const frames = decodeClip(doc);
  assert.equal(frames.length, doc.frameCount, 'every frame decodes for the player');
  for (let index = 0; index < doc.frameCount; index += 1) {
    const node = decodeColourFrame(doc, index);
    assert.deepEqual([...frames[index].fg], [...node.fg],
      `player and helper must decode frame ${index} foreground identically`);
    assert.deepEqual([...frames[index].bg], [...node.bg],
      `player and helper must decode frame ${index} background identically`);
  }

  const fills = [];
  const context = {
    set fillStyle(value) { this.style = value; },
    get fillStyle() { return this.style; },
    fillRect(x, y, w, h) { fills.push([this.style, x, y, w, h]); },
  };
  paintFrame({
    context,
    frame: frames[0],
    palette: doc.colorPalette,
    cols: doc.cols,
    rows: doc.rows,
    cellWidth: 8,
    cellHeight: 16,
  });
  assert.ok(fills.length >= doc.cols * doc.rows, 'every cell must be painted at least once');
  assert.ok(fills.every(([style]) => typeof style === 'string' && style.length > 0),
    'every fill must carry a resolved colour');

  const shade = [];
  const shadeContext = {
    set fillStyle(value) { this.style = value; },
    get fillStyle() { return this.style; },
    fillRect() { shade.push(this.style); },
  };
  paintFrame({
    context: shadeContext,
    frame: { ch: ['▒'], fg: Uint8Array.from([1]), bg: Uint8Array.from([0]) },
    palette: ['#000000', '#ffffff'],
    cols: 1,
    rows: 1,
    cellWidth: 1,
    cellHeight: 1,
  });
  assert.deepEqual(shade, ['rgb(128,128,128)'],
    'the player must blend a shade block exactly as the looping image does');
}

// The player must stay dependency-free: it is served to a browser as-is.
{
  const source = readFileSync(join(root, 'scripts/lib/ascii-motion/player.mjs'), 'utf8');
  assert.doesNotMatch(source, /^\s*import\s/m, 'the player must not import anything');
  assert.doesNotMatch(source, /require\(|node:/, 'the player must not reach for Node built-ins');
}

// Finally the helper's own self-test, which covers the CLI surface the skills
// actually invoke.
execFileSync(process.execPath, [join(root, 'scripts/ascii-motion.mjs'), '--self-test'], { stdio: 'ignore' });

console.log('creative ascii motion assertions passed');
