export const PALETTES = Object.freeze(['blocks', 'ascii', 'minimal', 'half', 'quad']);
export const COLORS = Object.freeze(['mono', 'indexed']);
export const COLOUR_PALETTES = Object.freeze(['half', 'quad']);

export const DEFAULT_PROFILES = Object.freeze({
  readme: Object.freeze({
    id: 'readme',
    cols: 80,
    rows: 24,
    fps: 12,
    palette: 'blocks',
    color: 'mono',
    cellAspect: 0.5,
  }),
  web: Object.freeze({
    id: 'web',
    cols: 100,
    rows: 32,
    fps: 24,
    palette: 'blocks',
    color: 'mono',
    cellAspect: 0.5,
  }),
  photo: Object.freeze({
    id: 'photo',
    cols: 110,
    rows: 44,
    fps: 12,
    palette: 'half',
    color: 'indexed',
    cellAspect: 0.5,
  }),
});

function isPositiveInteger(value) {
  return Number.isInteger(value) && value > 0;
}

export function resolveProfile(input = {}) {
  const errors = [];
  const id = input.id ?? 'readme';
  const base = DEFAULT_PROFILES[id];
  if (!base) {
    return { ok: false, profile: null, errors: [`unknown profile id "${id}"`] };
  }
  const profile = { ...base, ...input, id };
  for (const key of ['cols', 'rows', 'fps']) {
    if (!isPositiveInteger(profile[key])) {
      errors.push(`${key} must be a positive integer, received ${JSON.stringify(profile[key])}`);
    }
  }
  if (!PALETTES.includes(profile.palette)) {
    errors.push(`palette must be one of ${PALETTES.join(', ')}`);
  }
  if (!COLORS.includes(profile.color)) {
    errors.push(`color must be one of ${COLORS.join(', ')}`);
  }
  // v1 accepted a colour mode and then discarded it in both the GIF path and
  // the player. A mode is either honoured end to end or rejected here.
  const colourPalette = COLOUR_PALETTES.includes(profile.palette);
  if (colourPalette && profile.color !== 'indexed') {
    errors.push(`palette "${profile.palette}" carries per-cell colour, so color must be "indexed"`);
  }
  if (!colourPalette && profile.color === 'indexed') {
    errors.push(
      `color "indexed" needs a sub-cell palette (${COLOUR_PALETTES.join(' or ')}), not "${profile.palette}"`,
    );
  }
  if (!(typeof profile.cellAspect === 'number' && profile.cellAspect > 0)) {
    errors.push('cellAspect must be a positive number');
  }
  return errors.length > 0
    ? { ok: false, profile: null, errors }
    : { ok: true, profile, errors: [] };
}

export function fitGrid({ sourceWidth, sourceHeight, maxCols, maxRows, cellAspect }) {
  const ratio = (sourceHeight / sourceWidth) * cellAspect;
  let cols = maxCols;
  let rows = Math.max(1, Math.round(cols * ratio));
  if (rows > maxRows) {
    rows = maxRows;
    cols = Math.max(1, Math.round(rows / ratio));
  }
  return { cols, rows };
}
