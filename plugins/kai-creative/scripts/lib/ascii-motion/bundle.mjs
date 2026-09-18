import { validateFrames } from './frames.mjs';

export const BUNDLE_SCHEMA = 'kai.ascii-motion-bundle/v1';

export function buildBundle({ clips, defaultClip }) {
  const errors = [];
  if (!Array.isArray(clips) || clips.length === 0) {
    return { ok: false, bundle: null, errors: ['a bundle needs at least one clip'] };
  }
  const [first] = clips;
  const profile = {
    grid: { cols: first.doc.cols, rows: first.doc.rows },
    colour: first.doc.color,
    fps: first.doc.fps,
  };
  const entries = {};
  for (const clip of clips) {
    const frames = validateFrames(clip.doc);
    for (const error of frames.errors) errors.push(`${clip.name}: ${error}`);
    if (clip.doc.cols !== profile.grid.cols || clip.doc.rows !== profile.grid.rows) {
      errors.push(
        `${clip.name}: grid ${clip.doc.cols}x${clip.doc.rows} disagrees with bundle grid ${profile.grid.cols}x${profile.grid.rows}`,
      );
    }
    if (clip.doc.fps !== profile.fps) {
      errors.push(`${clip.name}: fps ${clip.doc.fps} disagrees with bundle fps ${profile.fps}`);
    }
    if (clip.doc.color !== profile.colour) {
      errors.push(`${clip.name}: colour ${clip.doc.color} disagrees with bundle colour ${profile.colour}`);
    }
    const loopFrom = clip.loopFrom ?? 0;
    if (!Number.isInteger(loopFrom) || loopFrom < 0 || loopFrom >= clip.doc.frameCount) {
      errors.push(`${clip.name}: loop_from ${loopFrom} is outside 0..${clip.doc.frameCount - 1}`);
    }
    entries[clip.name] = {
      frames_ref: clip.framesRef,
      loop: clip.loop ?? true,
      loop_from: loopFrom,
    };
  }
  if (!Object.prototype.hasOwnProperty.call(entries, defaultClip)) {
    errors.push(`default_clip "${defaultClip}" is not one of ${Object.keys(entries).join(', ')}`);
  }
  const bundle = { schema: BUNDLE_SCHEMA, profile, clips: entries, default_clip: defaultClip };
  return errors.length > 0 ? { ok: false, bundle: null, errors } : { ok: true, bundle, errors: [] };
}

export function validateBundle(bundle) {
  const errors = [];
  if (!bundle || bundle.schema !== BUNDLE_SCHEMA) {
    return { ok: false, errors: [`schema must be ${BUNDLE_SCHEMA}`] };
  }
  const names = Object.keys(bundle.clips ?? {});
  if (names.length === 0) errors.push('a bundle needs at least one clip');
  for (const name of names) {
    const clip = bundle.clips[name];
    if (typeof clip.frames_ref !== 'string' || clip.frames_ref.trim() === '') {
      errors.push(`${name}: frames_ref is required`);
    }
    if (typeof clip.loop !== 'boolean') errors.push(`${name}: loop must be a boolean`);
    if (!Number.isInteger(clip.loop_from) || clip.loop_from < 0) {
      errors.push(`${name}: loop_from must be a non-negative integer`);
    }
  }
  if (!names.includes(bundle.default_clip)) {
    errors.push(`default_clip "${bundle.default_clip}" is not one of ${names.join(', ')}`);
  }
  return { ok: errors.length === 0, errors };
}
