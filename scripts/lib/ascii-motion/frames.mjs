import { validateProvenance } from './provenance.mjs';

export const FRAMES_KIND = 'kai.ascii-motion-frames/v1';

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

export function validateFrames(doc) {
  const errors = [];
  if (!doc || doc.kind !== FRAMES_KIND) {
    return { ok: false, errors: [`kind must be ${FRAMES_KIND}`] };
  }
  if (!Array.isArray(doc.frames) || doc.frames.length === 0) {
    errors.push('frames must be a non-empty array');
  } else {
    if (doc.frameCount !== doc.frames.length) {
      errors.push(`frameCount ${doc.frameCount} does not match ${doc.frames.length} frames`);
    }
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
  }
  const provenance = validateProvenance(doc.provenance);
  for (const error of provenance.errors) errors.push(`provenance: ${error}`);
  return { ok: errors.length === 0, errors };
}

export function serializeFrames(doc) {
  return `${JSON.stringify(doc, null, 2)}\n`;
}
