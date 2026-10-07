// Ships to browsers as well as Node: no imports, no Node built-ins.

export function createScheduler({ bundle, frames }) {
  let clip = bundle.default_clip;
  let frameIndex = -1;
  let pending = null;
  let running = true;
  const queued = [];
  const listeners = { 'clip-ended': [] };

  function assertClip(name) {
    if (!Object.prototype.hasOwnProperty.call(bundle.clips, name)) {
      throw new Error(`unknown clip "${name}"`);
    }
  }

  function emit(event, payload) {
    for (const fn of listeners[event] ?? []) fn(payload);
  }

  function takeNext() {
    if (pending) {
      const next = pending;
      pending = null;
      return next;
    }
    return queued.length > 0 ? queued.shift() : null;
  }

  return {
    play(name, { now = false } = {}) {
      assertClip(name);
      if (now) {
        clip = name;
        frameIndex = -1;
        pending = null;
        queued.length = 0;
        return;
      }
      pending = name;
    },
    queue(...names) {
      for (const name of names) assertClip(name);
      queued.push(...names);
    },
    stop() {
      running = false;
    },
    on(event, fn) {
      if (!listeners[event]) listeners[event] = [];
      listeners[event].push(fn);
    },
    state() {
      return { clip, frameIndex, pending, queued: [...queued], running };
    },
    tick() {
      if (!running) return null;
      const list = frames[clip];
      const next = frameIndex + 1;
      if (next >= list.length) {
        emit('clip-ended', clip);
        const upcoming = takeNext();
        if (upcoming) {
          clip = upcoming;
          frameIndex = 0;
        } else if (bundle.clips[clip].loop) {
          frameIndex = bundle.clips[clip].loop_from;
        } else {
          running = false;
          return null;
        }
      } else {
        frameIndex = next;
      }
      return { clip, frameIndex, frame: frames[clip][frameIndex] };
    },
  };
}

// ---------------------------------------------------------------------------
// Colour decoding
// ---------------------------------------------------------------------------

function decodeBase64(text) {
  const binary = globalThis.atob(text);
  const out = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) out[index] = binary.charCodeAt(index);
  return out;
}

// Each frame stores only the rectangle that differs from frame 0, so playback
// rebuilds a frame by patching the base planes rather than carrying a full
// copy per frame.
export function decodeClip(doc) {
  const first = doc.frames[0];
  const baseFg = decodeBase64(first.fg);
  const baseBg = decodeBase64(first.bg);
  return doc.frames.map((frame, index) => {
    const fg = Uint8Array.from(baseFg);
    const bg = Uint8Array.from(baseBg);
    if (index > 0 && frame.rect) {
      const col0 = frame.rect[0];
      const row0 = frame.rect[1];
      const width = frame.rect[2];
      const height = frame.rect[3];
      const patchFg = decodeBase64(frame.fg);
      const patchBg = decodeBase64(frame.bg);
      for (let row = 0; row < height; row += 1) {
        for (let col = 0; col < width; col += 1) {
          const target = (row0 + row) * doc.cols + (col0 + col);
          fg[target] = patchFg[row * width + col];
          bg[target] = patchBg[row * width + col];
        }
      }
    }
    return { ch: frame.ch, fg, bg };
  });
}

// Every glyph the colour converter emits is an axis-aligned partition of its
// cell, so drawing one is fillRect. That is why no glyph atlas is needed.
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

// Shade blocks are partial coverage rather than a partition, so they paint as
// a blend of the two cell colours.
const SHADES = { '░': 0.25, '▒': 0.5, '▓': 0.75 };

function blend(palette, bgIndex, fgIndex, coverage) {
  const from = palette[bgIndex];
  const to = palette[fgIndex];
  const parse = hex => [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
  const a = parse(from);
  const b = parse(to);
  const mixed = a.map((value, channel) => Math.round(value + (b[channel] - value) * coverage));
  return `rgb(${mixed[0]},${mixed[1]},${mixed[2]})`;
}

export function paintFrame({ context, frame, palette, cols, rows, cellWidth, cellHeight }) {
  for (let row = 0; row < rows; row += 1) {
    const line = frame.ch[row];
    for (let col = 0; col < cols; col += 1) {
      const index = row * cols + col;
      const x = col * cellWidth;
      const y = row * cellHeight;
      const coverage = SHADES[line[col]];
      if (coverage !== undefined) {
        context.fillStyle = blend(palette, frame.bg[index], frame.fg[index], coverage);
        context.fillRect(x, y, cellWidth, cellHeight);
        continue;
      }
      context.fillStyle = palette[frame.bg[index]];
      context.fillRect(x, y, cellWidth, cellHeight);
      const parts = PARTITIONS[line[col]] ?? PARTITIONS['█'];
      if (parts.length === 0) continue;
      context.fillStyle = palette[frame.fg[index]];
      for (let part = 0; part < parts.length; part += 1) {
        const rect = parts[part];
        context.fillRect(
          x + rect[0] * cellWidth,
          y + rect[1] * cellHeight,
          rect[2] * cellWidth,
          rect[3] * cellHeight,
        );
      }
    }
  }
}

export async function mount(selector, bundleUrl, options = {}) {
  const doc = options.document ?? globalThis.document;
  const fetchJson = options.fetchJson ?? (async url => (await globalThis.fetch(url)).json());
  const base = bundleUrl.slice(0, bundleUrl.lastIndexOf('/') + 1);
  const bundle = await fetchJson(bundleUrl);
  const colour = bundle.profile.colour === 'indexed';
  const frames = {};
  const decoded = {};
  let palette = [];
  for (const [name, clip] of Object.entries(bundle.clips)) {
    const clipDoc = await fetchJson(base + clip.frames_ref);
    frames[name] = clipDoc.frames;
    if (colour) {
      decoded[name] = decodeClip(clipDoc);
      palette = clipDoc.colorPalette;
    }
  }
  const scheduler = createScheduler({ bundle, frames });
  const host = doc.querySelector(selector);
  const cols = bundle.profile.grid.cols;
  const rows = bundle.profile.grid.rows;
  const cellWidth = options.cellWidth ?? 8;
  const cellHeight = options.cellHeight ?? 16;

  let view;
  let context = null;
  if (colour) {
    view = doc.createElement('canvas');
    view.width = cols * cellWidth;
    view.height = rows * cellHeight;
    context = view.getContext('2d');
  } else {
    view = doc.createElement('pre');
  }
  view.className = 'ascii-motion';
  host.appendChild(view);

  const interval = setInterval(() => {
    const tick = scheduler.tick();
    if (!tick) {
      clearInterval(interval);
      return;
    }
    if (colour) {
      paintFrame({
        context,
        frame: decoded[tick.clip][tick.frameIndex],
        palette,
        cols,
        rows,
        cellWidth,
        cellHeight,
      });
    } else {
      view.textContent = tick.frame.join('\n');
    }
  }, 1000 / bundle.profile.fps);

  return {
    play: (name, opts) => scheduler.play(name, opts),
    queue: (...names) => scheduler.queue(...names),
    stop: () => scheduler.stop(),
    on: (event, fn) => scheduler.on(event, fn),
    stopRendering: () => clearInterval(interval),
  };
}

export const AsciiMotion = { mount, createScheduler, decodeClip, paintFrame };
