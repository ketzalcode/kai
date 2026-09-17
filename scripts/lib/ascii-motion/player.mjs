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

export async function mount(selector, bundleUrl, options = {}) {
  const doc = options.document ?? globalThis.document;
  const fetchJson = options.fetchJson ?? (async url => (await globalThis.fetch(url)).json());
  const base = bundleUrl.slice(0, bundleUrl.lastIndexOf('/') + 1);
  const bundle = await fetchJson(bundleUrl);
  const frames = {};
  for (const [name, clip] of Object.entries(bundle.clips)) {
    frames[name] = (await fetchJson(base + clip.frames_ref)).frames;
  }
  const scheduler = createScheduler({ bundle, frames });
  const host = doc.querySelector(selector);
  const view = doc.createElement('pre');
  view.className = 'ascii-motion';
  host.appendChild(view);
  const interval = setInterval(() => {
    const tick = scheduler.tick();
    if (!tick) {
      clearInterval(interval);
      return;
    }
    view.textContent = tick.frame.join('\n');
  }, 1000 / bundle.profile.fps);
  return {
    play: (name, opts) => scheduler.play(name, opts),
    queue: (...names) => scheduler.queue(...names),
    stop: () => scheduler.stop(),
    on: (event, fn) => scheduler.on(event, fn),
    stopRendering: () => clearInterval(interval),
  };
}

export const AsciiMotion = { mount, createScheduler };
