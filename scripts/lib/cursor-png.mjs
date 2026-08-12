// A cursor image, drawn rather than shipped.
//
// This exists because the alternative was committing a binary asset to a
// repository whose only executable code is dependency-free Node, and because a
// generated arrow can be re-scaled for a different output size without anyone
// hunting for the original artwork. `zlib` is a Node built-in, so a PNG can be
// produced here without adding a package.
//
// The shape is the conventional left-pointing arrow: a white body with a dark
// outline, which stays legible over both light and dark application chrome.
// That contrast is the whole point of drawing our own cursor, so it is not
// configurable.

import { deflateSync } from 'node:zlib';

// The classic arrow, in a 12 x 19 grid. Two polygons rather than a computed
// inset: an outline offset is fiddly to derive and trivial to hand-place, and
// these coordinates are checked by eye once rather than recomputed per render.
const OUTLINE = [[0, 0], [0, 16.4], [3.6, 12.8], [6.1, 18.8], [8.7, 17.7], [6.2, 11.8], [11.2, 11.8]];
const BODY = [[1.15, 2.4], [1.15, 13.7], [4.0, 10.9], [6.5, 16.7], [7.4, 16.3], [4.85, 10.3], [8.9, 10.3]];

const GRID_W = 12;
const GRID_H = 19;

function inside(poly, px, py) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

function crc32(buf) {
  let c = ~0;
  for (let i = 0; i < buf.length; i++) {
    c ^= buf[i];
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const head = Buffer.alloc(8);
  head.writeUInt32BE(data.length, 0);
  head.write(type, 4, 'ascii');
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([head.subarray(4), data])), 0);
  return Buffer.concat([head, data, crc]);
}

export function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0;
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // truecolour with alpha
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// `scale` is pixels per grid unit. Supersampling is 3x3 per output pixel, which
// is enough to keep the diagonal edges from crawling without making the arrow
// look soft at the tip -- and the tip is the part a viewer reads as "here".
export function cursorPng(scale = 2) {
  const w = Math.ceil(GRID_W * scale);
  const h = Math.ceil(GRID_H * scale);
  const rgba = Buffer.alloc(w * h * 4);
  const SUB = 3;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let body = 0;
      let outline = 0;
      for (let sy = 0; sy < SUB; sy++) {
        for (let sx = 0; sx < SUB; sx++) {
          const gx = (x + (sx + 0.5) / SUB) / scale;
          const gy = (y + (sy + 0.5) / SUB) / scale;
          if (inside(BODY, gx, gy)) body++;
          else if (inside(OUTLINE, gx, gy)) outline++;
        }
      }
      const total = SUB * SUB;
      const cover = (body + outline) / total;
      if (cover === 0) continue;
      // Where both shapes contribute to one pixel, the body colour wins in
      // proportion to how much of the pixel it covers.
      const white = body / (body + outline);
      const v = Math.round(255 * white + 26 * (1 - white));
      const i = (y * w + x) * 4;
      rgba[i] = v;
      rgba[i + 1] = v;
      rgba[i + 2] = v;
      rgba[i + 3] = Math.round(255 * cover);
    }
  }
  return { bytes: encodePng(w, h, rgba), width: w, height: h };
}

// The arrow's point is its origin: a cursor at (x, y) has its tip there, not
// its top-left corner. Overlay positions the image by its corner, so callers
// need this to place it. In this artwork the tip sits at grid (0, 0).
export const HOTSPOT = { x: 0, y: 0 };
