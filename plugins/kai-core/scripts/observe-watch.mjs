#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  resolveWorkspaceRoot
} from "./chunk-2WT4K7YK.mjs";
import "./chunk-ITUOITH3.mjs";

// src/core/observe-watch.mjs
import { readFileSync, existsSync, watch, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
var OBSERVED_REL = ".kai/core/runtime/observed.jsonl";
var ROTATED_REL = ".kai/core/runtime/observed.jsonl.1";
var ACTIVITY_REL = ".kai/core/runtime/activity.jsonl";
var ACTIVITY_ROTATED_REL = ".kai/core/runtime/activity.jsonl.1";
var MAX_READ = 512 * 1024;
var ROLE_RE = /^([a-z0-9-]{1,20}:)?[a-z0-9-]{1,60}$/;
var EVENTS = /* @__PURE__ */ new Set(["start", "stop", "progress"]);
var INVALID_ROLE = "<invalid-role>";
function safeText(value, max = 120) {
  if (typeof value !== "string") return "";
  let out = "";
  for (const ch of value) {
    const c = ch.codePointAt(0);
    if (c < 32 || c === 127 || c >= 128 && c <= 159 || c === 8232 || c === 8233) continue;
    out += ch;
  }
  out = out.trim();
  return out.length > max ? `${out.slice(0, max - 1)}~` : out;
}
function findWorkspace(cwd) {
  if (typeof cwd !== "string" || !cwd) return null;
  const r = resolveWorkspaceRoot({ cwd });
  return r.ok ? r.root : null;
}
function parseRecords(text, forcedSrc = null) {
  const out = [];
  if (typeof text !== "string") return out;
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t) continue;
    let rec;
    try {
      rec = JSON.parse(t);
    } catch {
      continue;
    }
    if (!rec || typeof rec !== "object") continue;
    const event = typeof rec.event === "string" ? rec.event : rec.e;
    if (typeof event !== "string" || !EVENTS.has(event)) continue;
    if (typeof rec.role !== "string" || !rec.role) continue;
    const valid = ROLE_RE.test(rec.role);
    const ts = Number(rec.t);
    const src = forcedSrc || (rec.src === "declared" ? "declared" : "observed");
    const nextBy = Number(rec.next_report_by);
    out.push({
      event,
      src,
      role: valid ? rec.role : INVALID_ROLE,
      // A missing session is not the same session as another missing session,
      // so it never becomes a shared pairing key -- see reduceState.
      session: typeof rec.session === "string" && rec.session ? safeText(rec.session, 40) : "",
      // A run id pairs exactly, but only the declared tier issues them. Taking
      // one from an observed record would let either log close the other's
      // runs, so it is read only from the tier that owns the concept.
      run: src === "declared" && typeof rec.run === "string" && rec.run ? safeText(rec.run, 40) : "",
      agent: typeof rec.agent === "string" && rec.agent ? safeText(rec.agent, 40) : "",
      t: Number.isFinite(ts) && ts >= 0 && ts < 1e12 ? Math.floor(ts) : 0,
      nextBy: Number.isFinite(nextBy) && nextBy > 0 && nextBy < 1e12 ? Math.floor(nextBy) : 0,
      tldr: safeText(rec.tldr || rec.note, 96),
      // Why no summary was stored. Carried through so the feed can say
      // "withheld" instead of showing the same blank as "never asked for one".
      withheld: rec.tldr_withheld === "path" || rec.tldr_withheld === "no-prose" ? rec.tldr_withheld : "",
      invalid: !valid
    });
  }
  return out;
}
function dedupe(records) {
  const seen = /* @__PURE__ */ new Map();
  const out = [];
  for (const rec of records) {
    if (!rec.t) {
      out.push(rec);
      continue;
    }
    const identified = Boolean(rec.run || rec.agent);
    const key = `${rec.src}|${rec.session}|${rec.role}|${rec.event}|${rec.run}|${rec.agent}`;
    const prev = seen.get(key);
    const window = identified ? 1 : 0;
    if (prev !== void 0 && Math.abs(rec.t - prev) <= window) continue;
    seen.set(key, rec.t);
    out.push(rec);
  }
  return out;
}
function reduceState(records, now = Math.floor(Date.now() / 1e3), opts = {}) {
  const active = /* @__PURE__ */ new Map();
  const done = /* @__PURE__ */ new Map();
  let ambiguous = false;
  let invalid = 0;
  let last = 0;
  let startless = false;
  let mismatched = false;
  const orphanStops = /* @__PURE__ */ new Set();
  const runs = [];
  const declaredOnly = /* @__PURE__ */ new Set();
  const observedOnly = /* @__PURE__ */ new Set();
  const seq = records.map((rec, i) => ({ ...rec, i }));
  let carried = 0;
  for (const rec of seq) {
    if (rec.t > 0) carried = rec.t;
    else rec.t = carried;
  }
  seq.sort((a, b) => a.t - b.t || a.i - b.i);
  for (const rec of seq) {
    if (rec.invalid) invalid++;
    if (rec.src === "declared") declaredOnly.add(rec.role);
    else observedOnly.add(rec.role);
    const key = rec.run ? `${rec.src}::run::${rec.run}` : rec.session ? `${rec.src}::${rec.session}::${rec.role}` : `${rec.src}::::${rec.role}`;
    if (rec.t > last) last = rec.t;
    if (rec.event === "progress") {
      const arr = active.get(key);
      if (arr && arr.length) {
        arr[arr.length - 1].heard = rec.t;
        arr[arr.length - 1].nextBy = rec.nextBy || arr[arr.length - 1].nextBy;
      } else if (rec.run) {
        active.set(key, [{
          role: rec.role,
          t: rec.t,
          src: rec.src,
          heard: rec.t,
          nextBy: rec.nextBy,
          startless: true
        }]);
        startless = true;
      }
      continue;
    }
    if (rec.event === "start") {
      const arr = active.get(key) || [];
      if (rec.run && arr.length) {
        arr[arr.length - 1].heard = rec.t;
        if (rec.nextBy) arr[arr.length - 1].nextBy = rec.nextBy;
        continue;
      }
      arr.push({ role: rec.role, t: rec.t || now, src: rec.src, heard: rec.t || now, nextBy: rec.nextBy });
      if (arr.length > 1 && !rec.run) ambiguous = true;
      active.set(key, arr);
    } else if (rec.event === "stop") {
      const arr = active.get(key);
      if (arr && arr.length) {
        if (!rec.run && (arr.length > 1 || !rec.session)) ambiguous = true;
        const opened = arr.shift();
        if (opened.role !== rec.role || opened.src !== rec.src) mismatched = true;
        runs.push({
          role: opened.role,
          src: opened.src,
          start: opened.t,
          end: rec.t,
          open: false,
          startless: Boolean(opened.startless),
          note: rec.tldr || opened.note || ""
        });
        if (!arr.length) active.delete(key);
      } else {
        runs.push({ role: rec.role, src: rec.src, start: null, end: rec.t, open: false, startless: true, note: rec.tldr || "" });
        orphanStops.add(key);
      }
      done.set(rec.role, (done.get(rec.role) || 0) + 1);
    }
  }
  const working = [];
  let outOfOrder = false;
  for (const [key, arr] of active.entries()) {
    if (orphanStops.has(key)) outOfOrder = true;
    for (const a of arr) {
      working.push({
        role: a.role,
        since: a.t,
        src: a.src,
        elapsed: Math.max(0, now - a.t),
        quiet: Math.max(0, now - (a.heard || a.t)),
        startless: Boolean(a.startless),
        // The agent named the time it would report by. Passing it is a fact it
        // supplied about itself, which is far stronger evidence of trouble
        // than elapsed time a watcher picked a threshold for.
        overdue: Boolean(a.nextBy && now > a.nextBy)
      });
      runs.push({
        role: a.role,
        src: a.src,
        start: a.t,
        end: null,
        open: true,
        startless: Boolean(a.startless),
        overdue: Boolean(a.nextBy && now > a.nextBy),
        note: a.note || ""
      });
    }
  }
  working.sort((a, b) => a.since - b.since);
  runs.sort((a, b) => (a.start ?? a.end) - (b.start ?? b.end));
  const unobserved = [...declaredOnly].filter((r) => !observedOnly.has(r)).sort();
  return {
    working,
    done: [...done.entries()].map(([role, count]) => ({ role, count })).sort((a, b) => b.count - a.count || a.role.localeCompare(b.role)),
    ambiguous,
    invalid,
    unobserved,
    startless,
    runs,
    outOfOrder,
    mismatched,
    // History was cut, so an open start may have scrolled out of reach. The
    // view says so instead of reporting an empty fleet as if it were quiet.
    truncated: Boolean(opts.truncated),
    last,
    total: records.length
  };
}
function fmtDuration(sec) {
  if (!Number.isFinite(sec) || sec < 0) return "--";
  if (sec < 60) return `${sec}s`;
  const m = Math.floor(sec / 60);
  if (m < 60) return `${m}m ${String(sec % 60).padStart(2, "0")}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${String(m % 60).padStart(2, "0")}m`;
}
var FACES = ["(o_o)", "(-_-)", "(o_o)", "(^_^)"];
var BUSY = [".  ", ".. ", "...", " .."];
function faceFor(role, tick) {
  let h = 0;
  for (let i = 0; i < role.length; i++) h = h * 31 + role.charCodeAt(i) & 65535;
  return FACES[(tick + h) % FACES.length];
}
function renderScene(state, { tick = 0, width = 72, stale = 900 } = {}) {
  const w = Math.max(40, Math.min(width, 100));
  const rule = "-".repeat(w);
  const lines = [];
  lines.push(`kai fleet   ${state.working.length} working   ${state.done.reduce((n, d) => n + d.count, 0)} finished`);
  lines.push(rule);
  if (!state.working.length) {
    lines.push("");
    lines.push("   nobody is working right now.");
    lines.push("");
  } else {
    for (const a of state.working) {
      const face = faceFor(a.role, tick);
      const busy = BUSY[tick % BUSY.length];
      let full = "";
      let compact = "";
      if (a.startless) {
        full = "  (start not in view)";
        compact = "  !partial";
      } else if (a.overdue) {
        full = "  (past its own check-in)";
        compact = "  !late";
      } else if (a.quiet > stale) {
        full = "  (silent a while)";
        compact = "  !quiet";
      }
      const tier = a.src === "declared" ? "said" : "seen";
      const MIN_NAME = 8;
      const width2 = (suffix2) => 2 + face.length + 2 + 2 + 4 + 2 + 8 + 1 + busy.length + suffix2.length;
      const suffix = width2(full) + MIN_NAME > w ? compact : full;
      const room = Math.max(3, w - width2(suffix));
      const name = a.role.length > room ? `${a.role.slice(0, room - 1)}~` : a.role;
      lines.push(`  ${face}  ${name.padEnd(room)}  ${tier}  ${fmtDuration(a.elapsed).padStart(8)} ${busy}${suffix}`);
    }
  }
  lines.push(rule);
  if (state.done.length) {
    const roster = state.done.map((d) => d.count > 1 ? `${d.role} x${d.count}` : d.role).join("   ");
    lines.push(`finished:  ${roster.length > w - 11 ? `${roster.slice(0, w - 14)}...` : roster}`);
  } else {
    lines.push("finished:  nothing yet");
  }
  if (state.ambiguous) {
    lines.push("note:      two subagents of one role overlapped; pairing is by order, not identity");
  }
  if (state.unobserved && state.unobserved.length) {
    const lead = "note:      self-reported; no observed record here: ";
    const roster = state.unobserved.join(", ");
    if (w < lead.length + 8) {
      lines.push(`note:      ${state.unobserved.length} role(s) self-reported, not observed`.slice(0, w));
    } else {
      const room = w - lead.length;
      lines.push(lead + (roster.length > room ? `${roster.slice(0, room - 3)}...` : roster));
    }
  }
  if (state.startless) {
    lines.push("note:      a run reported progress with no start in view; history may be cut");
  }
  if (state.truncated) {
    lines.push("note:      older history was not read; a run started long ago may be missing");
  }
  if (state.invalid) {
    lines.push(`note:      ${state.invalid} record(s) had a role this plugin never writes; shown as ${INVALID_ROLE}`);
  }
  return lines.join("\n");
}
function fitHeight(text, rows, width) {
  const lines = text.split("\n");
  if (!Number.isFinite(rows)) return text;
  const budget = Math.max(1, Math.floor(rows));
  const cols = Number.isFinite(width) && width > 0 ? Math.floor(width) : Infinity;
  const cost = (l) => cols === Infinity ? 1 : Math.max(1, Math.ceil(l.length / cols));
  const height = (ls) => ls.reduce((n, l) => n + cost(l), 0);
  if (height(lines) <= budget) return text;
  const bail = () => {
    const msg = ["  window too short for the live view.", "  use --sequence, or make it taller."];
    while (msg.length > 1 && height(msg) > budget) msg.pop();
    return height(msg) > budget ? msg[0].slice(0, Math.max(1, cols === Infinity ? msg[0].length : cols * budget)) : msg.join("\n");
  };
  let tailStart = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^-{3,}$/.test(lines[i].trim())) {
      tailStart = i;
      break;
    }
  }
  const HEAD = 2;
  if (tailStart < HEAD) return bail();
  const head = lines.slice(0, HEAD);
  const body = lines.slice(HEAD, tailStart);
  const tail = lines.slice(tailStart);
  const marker = (n) => `  ... ${n} more row(s) not shown -- window too short`;
  const fixed = height(head) + height(tail) + cost(marker(body.length));
  if (fixed >= budget) return bail();
  let room = budget - fixed;
  const kept = [];
  for (const line of body) {
    const c = cost(line);
    if (c > room) break;
    kept.push(line);
    room -= c;
  }
  const hidden = body.length - kept.length;
  return [...head, ...kept, marker(hidden), ...tail].join("\n");
}
function clockOf(t) {
  if (!Number.isFinite(t) || t <= 0) return "--:--:--";
  try {
    return new Date(t * 1e3).toISOString().slice(11, 19);
  } catch {
    return "--:--:--";
  }
}
function renderSequence(state, { width = 72 } = {}) {
  const w = Math.max(40, Math.min(width, 100));
  const rule = "-".repeat(w);
  const lines = [];
  const runs = (state.runs || []).map((r) => ({
    ...r,
    role: typeof r.role === "string" && r.role ? r.role : "unknown"
  }));
  const label = "note:      ";
  const note = (text) => {
    const room = Math.max(20, w - label.length);
    const out = [];
    let line = "";
    for (const word of text.split(/\s+/)) {
      if (!line) line = word;
      else if (line.length + 1 + word.length <= room) line += ` ${word}`;
      else {
        out.push(line);
        line = word;
      }
    }
    if (line) out.push(line);
    out.forEach((l, i) => lines.push((i === 0 ? label : " ".repeat(label.length)) + l));
  };
  const caveats = () => {
    note("a missing role means no record, not no work. The host observes no kai agent, and an agent can run without declaring. Check before reporting a gap.");
    note('this is the retained history only; older runs may have rotated out, and "run N" counts repeats in this view, not overall.');
    if (state.ambiguous) note("some observed runs were paired by order, not identity.");
    if (state.outOfOrder) note("a stop is timestamped before its own start; order and pairing around it are unreliable.");
    if (state.mismatched) note("a stop named a different role than the start it closed; the start is shown.");
    if (state.truncated) note("older history was not read; earlier runs may be missing.");
  };
  const bounds = runs.flatMap((r) => r.startless ? [r.end] : [r.start, r.end]).filter((t) => Number.isFinite(t) && t > 0);
  const span = bounds.length ? Math.max(...bounds) - Math.min(...bounds) : 0;
  const roles = new Set(runs.map((r) => r.role));
  const head = `kai participation   ${roles.size} role(s)   ${runs.length} run(s)   ${fmtDuration(span)} span`;
  const shortHead = `kai participation   ${roles.size} role(s)   ${runs.length} run(s)`;
  lines.push(head.length <= w ? head : shortHead.length <= w ? shortHead : `kai participation   ${runs.length} run(s)`);
  lines.push(rule);
  if (!runs.length) {
    lines.push("");
    lines.push("   no runs recorded.");
    lines.push("");
    lines.push(rule);
    note("nothing recorded is not the same as nothing happened.");
    caveats();
    return lines.join("\n");
  }
  const wide = w >= 64;
  const whenW = wide ? 17 : 8;
  const idxW = String(runs.length).length;
  const base = 2 + idxW + 2 + 2 + 4 + 2 + whenW + 2 + 8;
  const longest = runs.reduce((m, r) => Math.max(m, r.role.length), 0);
  const nameW = Math.max(3, Math.min(longest, w - base - 2));
  const seenCount = /* @__PURE__ */ new Map();
  runs.forEach((r, i) => {
    const n = (seenCount.get(r.role) || 0) + 1;
    seenCount.set(r.role, n);
    const flags = [];
    if (r.open) flags.push(r.overdue ? "no stop recorded, past check-in" : "no stop recorded");
    if (r.startless) flags.push("start not in view");
    if (n > 1) flags.push(`run ${n}`);
    const flag = flags.length ? `  ${flags.join("; ")}` : "";
    const tier = r.src === "declared" ? "said" : "seen";
    const known = !r.startless && Number.isFinite(r.start) && Number.isFinite(r.end) && r.end >= r.start;
    const dur = known ? fmtDuration(r.end - r.start) : "--";
    const from = r.startless ? "--:--:--" : clockOf(r.start);
    const when = wide ? `${from} ${r.end ? clockOf(r.end) : "        "}` : from;
    const idx = String(i + 1).padStart(idxW);
    const inline = base + nameW + flag.length <= w ? flag : "";
    const name = r.role.length > nameW ? `${r.role.slice(0, nameW - 1)}~` : r.role;
    lines.push(`  ${idx}  ${name.padEnd(nameW)}  ${tier}  ${when}  ${dur.padStart(8)}${inline}`);
    if (flag && !inline) {
      const indent = " ".repeat(4 + idxW);
      let line = indent;
      for (const part of flags) {
        const piece = line.trim() ? `; ${part}` : part;
        if (line.length + piece.length > w) {
          lines.push(line);
          line = indent + part;
        } else line += piece;
      }
      if (line.trim()) lines.push(line);
    }
  });
  lines.push(rule);
  if (runs.some((r) => r.open)) {
    note('"no stop recorded" means the log has no stop. It is not evidence that a process is still alive.');
  }
  caveats();
  return lines.join("\n");
}
function feedLine(rec) {
  const t = Number.isFinite(rec.t) && rec.t >= 0 && rec.t < 1e12 ? rec.t : 0;
  let when = "--:--:--";
  try {
    when = new Date(t * 1e3).toISOString().slice(11, 19);
  } catch {
  }
  const mark = rec.event === "start" ? ">>" : rec.event === "progress" ? ".." : "<<";
  const tier = rec.src === "declared" ? "~" : " ";
  const role = safeText(rec.role, 60) || INVALID_ROLE;
  const tldr = safeText(rec.tldr, 96);
  const withheld = !tldr && rec.withheld ? rec.withheld === "path" ? "  [summary withheld: named a path]" : "  [no summary: no prose in the reply]" : "";
  return `${when} ${tier}${mark} ${role}${tldr ? `  ${tldr}` : withheld}`;
}
function readHistory(root) {
  const chunks = [];
  let truncated = false;
  const sources = [
    [ROTATED_REL, "observed"],
    [OBSERVED_REL, "observed"],
    [ACTIVITY_ROTATED_REL, "declared"],
    [ACTIVITY_REL, "declared"]
  ];
  for (const [rel, src] of sources) {
    const file = join(root, rel);
    try {
      if (!existsSync(file)) continue;
      let text;
      if (statSync(file).size > MAX_READ) {
        const buf = readFileSync(file);
        let slice = buf.subarray(buf.length - MAX_READ);
        const nl = slice.indexOf(10);
        slice = nl >= 0 ? slice.subarray(nl + 1) : slice;
        text = slice.toString("utf8");
        truncated = true;
      } else {
        text = readFileSync(file, "utf8");
      }
      chunks.push({ text, src });
    } catch {
    }
  }
  return { chunks, truncated };
}
function readAndParse(chunks) {
  const out = [];
  for (const { text, src } of chunks) {
    const recs = parseRecords(text, src);
    let carried = 0;
    for (const rec of recs) {
      if (rec.t > 0) carried = rec.t;
      else rec.t = carried;
    }
    out.push(...recs);
  }
  return out.map((rec, i) => ({ rec, i })).sort((a, b) => a.rec.t - b.rec.t || a.i - b.i).map(({ rec }) => rec);
}
function fingerprint(rec, n) {
  return `${rec.t}|${rec.src}|${rec.event}|${rec.role}|${rec.session}|${rec.run}|${rec.tldr}#${n}`;
}
function runWatch(root, { feed, once, sequence }) {
  const dir = join(root, dirname(OBSERVED_REL));
  const live = Boolean(process.stdout.isTTY) && !feed && !once && !sequence;
  let tick = 0;
  let emitted = /* @__PURE__ */ new Set();
  let primed = false;
  const draw = () => {
    const { chunks, truncated } = readHistory(root);
    const records = dedupe(readAndParse(chunks));
    if (feed) {
      const counts = /* @__PURE__ */ new Map();
      const fps = records.map((rec) => {
        const base = `${rec.t}|${rec.src}|${rec.event}|${rec.role}|${rec.session}|${rec.run}|${rec.tldr}`;
        const n = (counts.get(base) || 0) + 1;
        counts.set(base, n);
        return fingerprint(rec, n);
      });
      records.forEach((rec, i) => {
        if (primed && emitted.has(fps[i])) return;
        process.stdout.write(`${feedLine(rec)}
`);
      });
      primed = true;
      emitted = new Set(fps);
      return;
    }
    const state = reduceState(records, void 0, { truncated });
    const width = process.stdout.columns || 72;
    if (sequence) {
      process.stdout.write(`${renderSequence(state, { width })}
`);
      return;
    }
    const frame = `${renderScene(state, { tick, width })}

  watching ${OBSERVED_REL} + ${ACTIVITY_REL} -- ctrl-c to stop`;
    if (!live) {
      process.stdout.write(`${frame}
`);
      return;
    }
    const rows = Math.max(1, (process.stdout.rows || 24) - 1);
    const out = fitHeight(frame, rows, width).split("\n").join("\x1B[K\n");
    process.stdout.write(`\x1B[H${out}\x1B[K\x1B[J`);
  };
  if (live) process.stdout.write("\x1B[?1049h\x1B[?25l");
  let restored = false;
  const restore = () => {
    if (restored || !live) return;
    restored = true;
    process.stdout.write("\x1B[?25h\x1B[?1049l");
  };
  process.on("exit", restore);
  draw();
  if (once || sequence) {
    restore();
    return;
  }
  const timer = setInterval(() => {
    tick++;
    draw();
  }, feed ? 1e3 : 700);
  let watcher = null;
  try {
    watcher = watch(dir, { persistent: true }, () => draw());
    watcher.on("error", () => {
      try {
        watcher.close();
      } catch {
      }
      watcher = null;
    });
  } catch {
  }
  const stop = () => {
    if (watcher) {
      try {
        watcher.close();
      } catch {
      }
    }
    clearInterval(timer);
    if (!live) {
      process.stdout.write("\n");
      process.exit(0);
      return;
    }
    restored = true;
    const done = () => {
      if (!ended) {
        ended = true;
        process.exit(0);
      }
    };
    let ended = false;
    setTimeout(done, 200).unref?.();
    process.stdout.write("\x1B[?25h\x1B[?1049l\n", done);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  process.on("SIGHUP", stop);
  process.on("uncaughtException", (err) => {
    restore();
    console.error(err);
    process.exit(1);
  });
  process.on("unhandledRejection", (err) => {
    restore();
    console.error(err);
    process.exit(1);
  });
  if (live && process.stdout.on) process.stdout.on("resize", () => draw());
}
var isEntry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isEntry) {
  const argv = process.argv.slice(2);
  const rootFlag = argv.indexOf("--root");
  const r = resolveWorkspaceRoot({ explicitRoot: rootFlag !== -1 ? argv[rootFlag + 1] : null, cwd: process.cwd() });
  if (!r.ok) {
    console.error(`observe-watch: ${r.reason}`);
    process.exit(2);
  }
  const root = r.root;
  if (!existsSync(join(root, OBSERVED_REL)) && !existsSync(join(root, ACTIVITY_REL))) {
    console.log("No observation log yet.\n");
    console.log("  1. enable:  node src/core/observe-subagent.mjs --enable");
    console.log("  2. restart your session (hook config is read at session start)");
    console.log("  3. run any subagent\n");
    console.log("Waiting for the first record...\n");
  }
  const sequence = argv.includes("--sequence");
  runWatch(root, {
    // A pipe gets the feed, because ANSI screen-clearing into a file or a
    // pager produces garbage. `--scene` forces the ambient view anyway, which
    // is what makes it previewable and testable.
    feed: !sequence && (argv.includes("--feed") || !process.stdout.isTTY && !argv.includes("--scene")),
    once: argv.includes("--once"),
    sequence
  });
}
export {
  ACTIVITY_REL,
  ACTIVITY_ROTATED_REL,
  INVALID_ROLE,
  OBSERVED_REL,
  ROTATED_REL,
  clockOf,
  dedupe,
  feedLine,
  findWorkspace,
  fitHeight,
  fmtDuration,
  parseRecords,
  readAndParse,
  reduceState,
  renderScene,
  renderSequence,
  safeText
};
