import { validateProvenance } from './provenance.mjs';

export const FRAMES_KIND = 'kai.ascii-motion-frames/v1';
export const FRAMES_KIND_V2 = 'kai.ascii-motion-frames/v2';
export const FRAMES_KINDS = Object.freeze([FRAMES_KIND, FRAMES_KIND_V2]);

export function buildFrames({ profile, frames, provenance }) {
  return {
    kind: FRAMES_KIND,
    cols: profile.cols,
    rows: profile.rows,
    fps: profile.fps,
    palette: profile.palette,
    color: profile.color,
    frameCount: frames.length,
    frames: frames.map(frame => [...frame]),
    provenance,
  };
}

// ---------------------------------------------------------------------------
// v2: v1 plus optional colour side-channels
// ---------------------------------------------------------------------------
//
// `ch` is unchanged, so a reader that ignores unknown keys still renders
// correct monochrome text. Colour rides alongside as palette indices — one
// byte per cell per plane rather than three — and each plane carries only its
// dirty rectangle relative to frame 0. Both decisions are needed to keep a
// clip inside the web-bundle budget; indices alone are not enough.

function encodePlane(values) {
  return Buffer.from(Uint8Array.from(values)).toString('base64');
}

function decodePlane(text) {
  return new Uint8Array(Buffer.from(text, 'base64'));
}

function sliceRect(plane, cols, rect) {
  const out = [];
  for (let row = rect.row; row < rect.row + rect.rows; row += 1) {
    for (let col = rect.col; col < rect.col + rect.cols; col += 1) {
      out.push(plane[row * cols + col]);
    }
  }
  return out;
}

function dirtyRect({ base, frame, cols, rows }) {
  let minCol = cols;
  let minRow = rows;
  let maxCol = -1;
  let maxRow = -1;
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const changed =
        base.ch[row][col] !== frame.ch[row][col] ||
        base.fg[index] !== frame.fg[index] ||
        base.bg[index] !== frame.bg[index];
      if (!changed) continue;
      if (col < minCol) minCol = col;
      if (col > maxCol) maxCol = col;
      if (row < minRow) minRow = row;
      if (row > maxRow) maxRow = row;
    }
  }
  if (maxCol < 0) return { col: 0, row: 0, cols: 0, rows: 0 };
  return { col: minCol, row: minRow, cols: maxCol - minCol + 1, rows: maxRow - minRow + 1 };
}

/**
 * @param cellFrames array of `{ ch: string[][], fg: Uint8Array, bg: Uint8Array }`
 *        where fg/bg hold palette indices for the whole grid.
 */
export function buildColourFrames({ profile, cellFrames, palette, provenance }) {
  const { cols, rows } = profile;
  const [base] = cellFrames;
  const frames = cellFrames.map((frame, index) => {
    const rect = index === 0 ? { col: 0, row: 0, cols, rows } : dirtyRect({ base, frame, cols, rows });
    const entry = { ch: frame.ch.map(row => row.join('')) };
    if (rect.cols > 0 && rect.rows > 0) {
      entry.rect = [rect.col, rect.row, rect.cols, rect.rows];
      entry.fg = encodePlane(sliceRect(frame.fg, cols, rect));
      entry.bg = encodePlane(sliceRect(frame.bg, cols, rect));
    }
    return entry;
  });
  return {
    kind: FRAMES_KIND_V2,
    cols,
    rows,
    fps: profile.fps,
    palette: profile.palette,
    color: 'indexed',
    colorPalette: [...palette],
    frameCount: frames.length,
    frames,
    provenance,
  };
}

/** Reconstructs the full-grid index planes for one frame of a v2 document. */
export function decodeColourFrame(doc, index) {
  const { cols } = doc;
  const first = doc.frames[0];
  const full = { fg: decodePlane(first.fg), bg: decodePlane(first.bg) };
  const frame = doc.frames[index];
  if (index > 0 && frame.rect) {
    const [col0, row0, width, height] = frame.rect;
    const patchFg = decodePlane(frame.fg);
    const patchBg = decodePlane(frame.bg);
    for (let row = 0; row < height; row += 1) {
      for (let col = 0; col < width; col += 1) {
        const target = (row0 + row) * cols + (col0 + col);
        full.fg[target] = patchFg[row * width + col];
        full.bg[target] = patchBg[row * width + col];
      }
    }
  }
  return { ch: frame.ch.map(row => [...row]), fg: full.fg, bg: full.bg, cols, rows: doc.rows };
}

function validateV2(doc) {
  const errors = [];
  if (!Array.isArray(doc.colorPalette) || doc.colorPalette.length === 0) {
    errors.push('colorPalette must be a non-empty array');
  } else if (doc.colorPalette.length > 256) {
    errors.push(
      `colorPalette holds ${doc.colorPalette.length} entries, more than the 256 an index byte can address`,
    );
  }
  const first = doc.frames?.[0];
  if (first && (typeof first.fg !== 'string' || typeof first.bg !== 'string')) {
    errors.push('frame 0 must carry full fg and bg planes');
  }
  (doc.frames ?? []).forEach((frame, index) => {
    if (!Array.isArray(frame.ch) || frame.ch.length !== doc.rows) {
      errors.push(`frame ${index} has ${frame.ch?.length ?? 0} rows, expected ${doc.rows}`);
      return;
    }
    frame.ch.forEach((row, rowIndex) => {
      if (typeof row !== 'string' || [...row].length !== doc.cols) {
        errors.push(`frame ${index} row ${rowIndex} is not ${doc.cols} characters wide`);
      }
    });
    if (!frame.rect) return;
    const [col, row, width, height] = frame.rect;
    if (col < 0 || row < 0 || col + width > doc.cols || row + height > doc.rows) {
      errors.push(
        `frame ${index} dirty rect ${frame.rect.join(',')} falls outside the ${doc.cols}x${doc.rows} grid`,
      );
      return;
    }
    for (const plane of ['fg', 'bg']) {
      const bytes = decodePlane(frame[plane] ?? '').length;
      if (bytes !== width * height) {
        errors.push(`frame ${index} ${plane} plane holds ${bytes} bytes, expected ${width * height}`);
      }
    }
  });
  return errors;
}

function validateV1(doc) {
  const errors = [];
  doc.frames.forEach((frame, frameIndex) => {
    if (!Array.isArray(frame) || frame.length !== doc.rows) {
      errors.push(
        `frame ${frameIndex} has ${Array.isArray(frame) ? frame.length : 0} rows, expected ${doc.rows}`,
      );
      return;
    }
    frame.forEach((row, rowIndex) => {
      if (typeof row !== 'string' || [...row].length !== doc.cols) {
        errors.push(`frame ${frameIndex} row ${rowIndex} is not ${doc.cols} characters wide`);
      }
    });
  });
  return errors;
}

export function validateFrames(doc) {
  const errors = [];
  if (!doc || !FRAMES_KINDS.includes(doc.kind)) {
    return { ok: false, errors: [`kind must be one of ${FRAMES_KINDS.join(', ')}`] };
  }
  if (!Array.isArray(doc.frames) || doc.frames.length === 0) {
    errors.push('frames must be a non-empty array');
  } else {
    if (doc.frameCount !== doc.frames.length) {
      errors.push(`frameCount ${doc.frameCount} does not match ${doc.frames.length} frames`);
    }
    const kindErrors = doc.kind === FRAMES_KIND_V2 ? validateV2(doc) : validateV1(doc);
    for (const error of kindErrors) errors.push(error);
  }
  const provenance = validateProvenance(doc.provenance);
  for (const error of provenance.errors) errors.push(`provenance: ${error}`);
  return { ok: errors.length === 0, errors };
}

/** The text rows of a frame, whichever version the document is. */
export function frameRows(doc, index) {
  const frame = doc.frames[index];
  return Array.isArray(frame) ? frame : frame.ch;
}

export function serializeFrames(doc) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}
