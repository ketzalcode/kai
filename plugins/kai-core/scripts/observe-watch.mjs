#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  resolveWorkspaceRoot
} from "./chunk-VTZRFV57.mjs";

// src/core/observe-watch.mjs
import { readFileSync, existsSync, watch, statSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
var OBSERVED_REL = ".kai/observed.jsonl";
var ROTATED_REL = ".kai/observed.jsonl.1";
var ACTIVITY_REL = ".kai/activity.jsonl";
var ACTIVITY_ROTATED_REL = ".kai/activity.jsonl.1";
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
function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => {
    if (!cond) failed++;
    console.log(`${cond ? "\u2713" : "\u2717"} watch self-test: ${msg}`);
  };
  const rec = (o) => JSON.stringify({ t: 1e3, src: "observed", session: "s1", ...o });
  ok(
    parseRecords(`${rec({ event: "start", role: "a" })}
{"partial`).length === 1,
    "a torn final line is skipped, not fatal -- the writer appends concurrently"
  );
  ok(parseRecords("").length === 0, "an empty log parses to nothing rather than throwing");
  ok(parseRecords(null).length === 0, "a non-string input is refused without throwing");
  ok(
    parseRecords('{"t":1,"src":"observed"}\n').length === 0,
    "a record with no role or event is not counted as an agent"
  );
  const open = reduceState(parseRecords([rec({ event: "start", role: "explore" })].join("\n")), 1060);
  ok(open.working.length === 1 && open.working[0].role === "explore", "a start with no stop shows as working");
  ok(open.working[0].elapsed === 60, "elapsed is computed in seconds, matching the writer");
  const closed = reduceState(parseRecords([
    rec({ event: "start", role: "explore" }),
    rec({ event: "stop", role: "explore" })
  ].join("\n")));
  ok(closed.working.length === 0, "a matched stop clears the working row");
  ok(closed.done.length === 1 && closed.done[0].count === 1, "a completed run is counted in the roster");
  const orphan = reduceState(parseRecords(rec({ event: "stop", role: "ghost" })));
  ok(orphan.working.length === 0, "a stop with no start does not produce a ghost worker");
  ok(orphan.done[0].count === 1, "a stop with no start still counts as finished work");
  const twoSessions = reduceState(parseRecords([
    JSON.stringify({ t: 1, event: "start", role: "explore", session: "A" }),
    JSON.stringify({ t: 2, event: "stop", role: "explore", session: "B" })
  ].join("\n")));
  ok(twoSessions.working.length === 1, "a stop in one session cannot close a start in another");
  const decl = (o) => JSON.stringify({ t: 1e3, src: "declared", ...o });
  ok(
    parseRecords(decl({ e: "start", role: "principal-swe-backend", run: "r1" }))[0].src === "declared",
    "a declared record keeps its provenance instead of being flattened into the observed tier"
  );
  ok(
    parseRecords(rec({ event: "start", role: "a" }))[0].src === "observed",
    "a record that names no tier is treated as observed, the weaker claim"
  );
  ok(
    parseRecords(decl({ e: "start", role: "a", run: "r1" }))[0].event === "start",
    "the declared tier writes `e` where the observer writes `event`; both parse"
  );
  const twoRuns = reduceState(parseRecords([
    decl({ t: 10, e: "start", role: "principal-swe-backend", run: "r1" }),
    decl({ t: 11, e: "start", role: "principal-swe-backend", run: "r2" }),
    decl({ t: 12, e: "stop", role: "principal-swe-backend", run: "r1" })
  ].join("\n")), 20);
  ok(twoRuns.working.length === 1, "a run id closes exactly the run it names, not the oldest of that role");
  ok(
    twoRuns.ambiguous === false,
    "overlapping declared runs are not ambiguous: they carry ids, so nothing was guessed"
  );
  const merged = reduceState(parseRecords([
    decl({ t: 10, e: "start", role: "principal-swe-backend", run: "r1" }),
    JSON.stringify({ t: 11, src: "observed", event: "start", role: "explore", session: "s1" })
  ].join("\n")), 20);
  ok(merged.working.length === 2, "both tiers appear in one view rather than one hiding the other");
  ok(
    merged.unobserved.join() === "principal-swe-backend",
    "a role only ever self-reported is named as such, never rendered as not having run"
  );
  ok(
    !renderScene(merged, { width: 100 }).includes("did not run"),
    "the view never claims an unobserved agent did not run"
  );
  const late = reduceState(parseRecords(
    decl({ t: 10, e: "start", role: "a", run: "r1", next_report_by: 50 })
  ), 100);
  ok(late.working[0].overdue === true, "a run past the check-in time it promised is marked overdue");
  const onTime = reduceState(parseRecords(
    decl({ t: 10, e: "start", role: "a", run: "r1", next_report_by: 500 })
  ), 100);
  ok(onTime.working[0].overdue === false, "a run inside its own deadline is not flagged, however long it has run");
  const prog = reduceState(parseRecords([
    decl({ t: 10, e: "start", role: "a", run: "r1", next_report_by: 50 }),
    decl({ t: 40, e: "progress", role: "a", run: "r1", next_report_by: 500 })
  ].join("\n")), 100);
  ok(prog.working.length === 1, "progress neither starts a second run nor closes the first");
  ok(prog.working[0].overdue === false, "progress renews the deadline, clearing an overdue mark");
  ok(prog.working[0].quiet === 60, "quiet time is measured from the last word, not from the start");
  const dupPair = parseRecords([
    JSON.stringify({ t: 100, src: "observed", event: "stop", role: "explore", session: "s1", agent: "a1" }),
    JSON.stringify({ t: 100, src: "observed", event: "stop", role: "explore", session: "s1", agent: "a1" })
  ].join("\n"));
  ok(dedupe(dupPair).length === 1, "one event delivered twice in the same second is counted once");
  const reused = parseRecords([
    JSON.stringify({ t: 100, src: "observed", event: "stop", role: "explore", session: "s1", agent: "a1" }),
    JSON.stringify({ t: 90344, src: "observed", event: "stop", role: "explore", session: "s1", agent: "a1" })
  ].join("\n"));
  ok(
    dedupe(reused).length === 2,
    "an agent id reused a day later is two runs, not a duplicate -- identity alone must not collapse them"
  );
  ok(
    dedupe(parseRecords([
      decl({ t: 100, e: "stop", role: "a", run: "r1" }),
      JSON.stringify({ t: 100, src: "observed", event: "stop", role: "a", session: "s1" })
    ].join("\n"))).length === 2,
    "the same moment reported by both tiers is two records; they are merged for display, not reconciled"
  );
  ok(
    parseRecords(rec({ event: "start", role: "kai:principal-swe-architect" }))[0].invalid === false,
    "a namespaced role from the host is a valid role, not a quarantined one"
  );
  ok(
    parseRecords(rec({ event: "start", role: "a:b:c" }))[0].invalid === true,
    "only one namespace segment is allowed; anything else is still quarantined"
  );
  ok(
    parseRecords(JSON.stringify({ t: 1, src: "declared", event: "start", role: "a" }), "observed")[0].src === "observed",
    "a record claiming to be declared, found in the observed log, is observed"
  );
  ok(
    parseRecords(decl({ e: "start", role: "a", run: "r1" }), "declared")[0].run === "r1",
    "a run id is read from the tier that issues them"
  );
  ok(
    parseRecords(JSON.stringify({ t: 1, event: "stop", role: "a", run: "r1" }), "observed")[0].run === "",
    "a run id in the observed log is discarded: it could otherwise close a declared run"
  );
  const crossTier = reduceState(readAndParse([
    { src: "declared", text: decl({ t: 10, e: "start", role: "a", run: "r1" }) },
    { src: "observed", text: JSON.stringify({ t: 11, event: "stop", role: "a", run: "r1", session: "s1" }) }
  ]), 20);
  ok(crossTier.working.length === 1, "an observed stop cannot close a declared run, even naming its id");
  ok(
    ACTIVITY_ROTATED_REL === ".kai/activity.jsonl.1",
    "the rotated declared log is read, matching what the activity writer renames to"
  );
  const acrossRotation = reduceState(readAndParse([
    { src: "declared", text: decl({ t: 10, e: "start", role: "a", run: "r1", next_report_by: 900 }) },
    { src: "declared", text: decl({ t: 40, e: "progress", role: "a", run: "r1", next_report_by: 900 }) }
  ]), 100);
  ok(acrossRotation.working.length === 1, "a start in the rotated generation still pairs with progress in the current one");
  const orphanProgress = reduceState(parseRecords(
    decl({ t: 40, e: "progress", role: "a", run: "r1", next_report_by: 900 }),
    "declared"
  ), 100);
  ok(orphanProgress.working.length === 1, "progress with no start shows a worker rather than an empty fleet");
  ok(orphanProgress.startless === true, "and the missing start is disclosed rather than papered over");
  const retried = reduceState(parseRecords([
    decl({ t: 10, e: "start", role: "a", run: "r1" }),
    decl({ t: 12, e: "start", role: "a", run: "r1" }),
    decl({ t: 20, e: "stop", role: "a", run: "r1" })
  ].join("\n"), "declared"), 30);
  ok(
    retried.working.length === 0,
    "a replayed start for one run id does not leave a worker no stop can ever clear"
  );
  const noTime = dedupe(parseRecords([
    JSON.stringify({ t: 100, src: "observed", event: "stop", role: "a", session: "s1", agent: "x" }),
    JSON.stringify({ src: "observed", event: "stop", role: "a", session: "s1", agent: "x" }),
    JSON.stringify({ t: 100, src: "observed", event: "stop", role: "a", session: "s1", agent: "x" })
  ].join("\n"), "observed"));
  ok(
    noTime.length === 2,
    "a timestamp-less record neither collapses nor resets dedupe state for the records around it"
  );
  const twoFastStarts = dedupe(parseRecords([
    JSON.stringify({ t: 100, src: "observed", event: "start", role: "explore", session: "s1" }),
    JSON.stringify({ t: 101, src: "observed", event: "start", role: "explore", session: "s1" })
  ].join("\n"), "observed"));
  ok(
    twoFastStarts.length === 2,
    "two identity-less starts a second apart are both kept: a double-count is visible, a deleted agent is not"
  );
  const sameInstant = dedupe(parseRecords([
    JSON.stringify({ t: 100, src: "observed", event: "start", role: "explore", session: "s1" }),
    JSON.stringify({ t: 100, src: "observed", event: "start", role: "explore", session: "s1" })
  ].join("\n"), "observed"));
  ok(sameInstant.length === 1, "an identical timestamp with no identity is still collapsed");
  const fitState = reduceState(readAndParse([
    { src: "declared", text: [
      decl({ t: 10, e: "start", role: "principal-swe-architect", run: "r1", next_report_by: 20 }),
      decl({ t: 10, e: "start", role: "creative-lead-video", run: "r2", next_report_by: 20 })
    ].join("\n") },
    { src: "observed", text: JSON.stringify({ t: 12, event: "start", role: "explore", session: "s1" }) }
  ]), 100);
  for (const width of [40, 56, 72, 100]) {
    const over = renderScene(fitState, { width }).split("\n").filter((l) => l.length > Math.max(40, Math.min(width, 100)));
    ok(over.length === 0, `every rendered line fits within ${width} columns`);
    const marked = renderScene(fitState, { width }).split("\n").filter((l) => l.includes("said")).every((l) => /check-in|!late/.test(l));
    ok(marked, `an overdue run is still marked as overdue at ${width} columns`);
  }
  const overlap = reduceState(parseRecords([
    rec({ event: "start", role: "explore" }),
    rec({ event: "start", role: "explore" }),
    rec({ event: "stop", role: "explore" })
  ].join("\n")), 1e3);
  ok(overlap.working.length === 1, "two overlapping runs of one role leave one open after a single stop");
  ok(overlap.ambiguous === true, "overlapping same-role runs are flagged as ambiguous, not silently guessed");
  ok(closed.ambiguous === false, "a clean sequence is not flagged ambiguous");
  const scene = renderScene(open, { tick: 0 });
  ok(scene.includes("explore"), "the scene names the working role");
  ok(scene.includes("1 working"), "the scene counts the working agents");
  ok(!/[A-Za-z]:\\|\/home\/|\/Users\//.test(scene), "the scene never renders an absolute path");
  ok(
    renderScene(reduceState([]), { tick: 0 }).includes("nobody is working"),
    "an empty log renders an honest empty state rather than a blank screen"
  );
  ok(
    renderScene(overlap, { tick: 0 }).includes("pairing is by order"),
    "the ambiguity is surfaced to the reader, not hidden in the data"
  );
  const longRole = reduceState(parseRecords(rec({ event: "start", role: "principal-a-very-long-role-name-that-overflows-the-column" })), 1e3);
  const wide = renderScene(longRole, { tick: 0, width: 72 });
  ok(wide.split("\n").every((l) => l.length <= 100), "a long role name cannot break the layout");
  const stale = reduceState(parseRecords(rec({ event: "start", role: "explore" })), 1e3 + 5e3);
  ok(
    renderScene(stale, { tick: 0 }).includes("silent a while"),
    "a long-open start is aged rather than presented as certain liveness"
  );
  const frames = new Set([0, 1, 2, 3].map((t) => renderScene(open, { tick: t })));
  ok(frames.size > 1, "the view animates across ticks");
  const hostileRole = parseRecords(JSON.stringify({ t: 1, event: "start", role: "C:\\Users\\alice\\secret", session: "s1" }));
  ok(
    hostileRole.length === 1 && hostileRole[0].role === INVALID_ROLE,
    "a role this plugin never writes is quarantined, not rendered as a label"
  );
  ok(
    !renderScene(reduceState(hostileRole, 2), { tick: 0 }).includes("alice"),
    "a path smuggled in as a role never reaches the screen"
  );
  ok(
    renderScene(reduceState(hostileRole, 2), { tick: 0 }).includes("never writes"),
    "the quarantine is reported rather than silently swallowing the record"
  );
  const esc = parseRecords(JSON.stringify({ t: 1, event: "stop", role: "explore", session: "s1", tldr: "a\x1B[2Jb\x07c" }));
  ok(
    !feedLine(esc[0]).includes("\x1B") && !feedLine(esc[0]).includes("\x07"),
    "terminal control sequences in a summary are stripped before printing"
  );
  ok(
    feedLine(esc[0]).includes("a[2Jbc"),
    "stripping the escape byte leaves its payload as plain text, which is harmless"
  );
  ok(
    feedLine({ t: 1e100, event: "start", role: "explore" }).includes(">>"),
    "an impossible timestamp is formatted, not thrown"
  );
  ok(
    parseRecords(JSON.stringify({ t: 1e100, event: "start", role: "explore" }))[0].t === 0,
    "a timestamp outside any real clock is refused rather than trusted"
  );
  const reordered = reduceState(parseRecords([
    JSON.stringify({ t: 20, event: "stop", role: "explore", session: "s1" }),
    JSON.stringify({ t: 10, event: "start", role: "explore", session: "s1" })
  ].join("\n")), 30);
  ok(reordered.working.length === 0, "a stop recorded before its start does not leave a ghost worker");
  const sessionless = reduceState(parseRecords([
    JSON.stringify({ t: 1, event: "start", role: "explore" }),
    JSON.stringify({ t: 2, event: "stop", role: "explore" })
  ].join("\n")), 3);
  ok(sessionless.ambiguous === true, "pairing records with no session is declared as a guess");
  ok(
    renderScene(reduceState([], 1, { truncated: true }), { tick: 0 }).includes("older history"),
    "a truncated read is reported rather than shown as a quiet fleet"
  );
  const line = feedLine({ t: 1786488059, event: "stop", role: "explore", tldr: "Did the thing." });
  ok(line.includes("explore") && line.includes("Did the thing."), "a feed line carries the role and any summary");
  const held = parseRecords(JSON.stringify({
    t: 1786488059,
    event: "stop",
    role: "explore",
    tldr: null,
    tldr_withheld: "path"
  }));
  ok(
    feedLine(held[0]).includes("summary withheld: named a path"),
    "the feed says a summary was withheld rather than showing nothing"
  );
  const noProseLine = parseRecords(JSON.stringify({
    t: 1786488059,
    event: "stop",
    role: "explore",
    tldr: null,
    tldr_withheld: "no-prose"
  }));
  ok(
    feedLine(noProseLine[0]).includes("no prose in the reply"),
    "a reply with no prose is distinguished from a refusal"
  );
  const plain = parseRecords(JSON.stringify({ t: 1786488059, event: "stop", role: "explore" }));
  ok(
    !/withheld|no summary/.test(feedLine(plain[0])),
    "a record with no marker claims nothing about why a summary is absent"
  );
  const bogus = parseRecords(JSON.stringify({
    t: 1,
    event: "stop",
    role: "explore",
    tldr_withheld: "C:\\Users\\someone\\leak.md"
  }));
  ok(bogus[0].withheld === "", "a reason outside the allowlist is dropped at the parser, not carried");
  ok(
    !feedLine(bogus[0]).includes("someone") && !/withheld|no summary/.test(feedLine(bogus[0])),
    "a hostile reason renders as no claim at all, rather than as a refusal that never happened"
  );
  ok(feedLine({ t: 0, event: "start", role: "explore" }).includes(">>"), "a start is marked distinctly from a stop");
  const seqRecs = parseRecords([
    JSON.stringify({ t: 100, event: "start", role: "workflow-issue-analysis", session: "s" }),
    JSON.stringify({ t: 160, event: "stop", role: "workflow-issue-analysis", session: "s" }),
    JSON.stringify({ t: 200, event: "start", role: "principal-swe-backend", session: "s" }),
    JSON.stringify({ t: 500, event: "stop", role: "principal-swe-backend", session: "s" }),
    JSON.stringify({ t: 600, event: "start", role: "principal-swe-backend", session: "s" })
  ].join("\n"), "observed");
  const seqState = reduceState(seqRecs, 700);
  ok(seqState.runs.length === 3, "every run reaches the sequence, closed and open alike");
  ok(
    seqState.runs[0].role === "workflow-issue-analysis" && seqState.runs[2].open === true,
    "runs are ordered by when they began, and the open one is last"
  );
  const seq = renderSequence(seqState, { width: 100 });
  ok(
    seq.includes("workflow-issue-analysis") && seq.includes("principal-swe-backend"),
    "the sequence names each role that took part"
  );
  const flat = (s) => s.replace(/\s+/g, " ");
  ok(seq.includes("run 2"), "a repeated role is marked rather than left for the reader to count");
  ok(seq.includes("no stop recorded"), "a run with no stop is shown as such, not as finished");
  ok(
    flat(seq).includes("not evidence that a process is still alive"),
    "an open run carries the liveness caveat in the report itself"
  );
  ok(!/\bopen\b/.test(seq.split("note:")[0]), 'no row claims a run is "open", which reads as alive');
  ok(/1m 0/.test(seq), "a closed run reports the span between its own start and stop");
  ok(
    !/did not run|idle|never ran|absent|skipped/i.test(seq),
    "the sequence never reports a role as not having run"
  );
  ok(
    flat(seq).includes("no record, not no work") && flat(seq).includes("host observes no kai agent"),
    "the measured host limitation travels with the data, not documentation nobody read"
  );
  ok(
    flat(seq).includes("retained history"),
    "the view says it shows retained history rather than implying it is complete"
  );
  ok(
    flat(seq).includes("counts repeats in this view"),
    "the repeat ordinal is scoped to the view rather than read as a global count"
  );
  const emptySeq = flat(renderSequence(reduceState([], 1, { truncated: true }), { width: 72 }));
  ok(
    emptySeq.includes("nothing recorded is not the same"),
    "an empty sequence still refuses to read as an empty fleet"
  );
  ok(
    emptySeq.includes("host observes no kai agent"),
    "the empty sequence keeps the measured host limitation"
  );
  ok(
    emptySeq.includes("older history was not read"),
    "the empty sequence still reports that history was truncated"
  );
  const orphanStop = reduceState(parseRecords(
    JSON.stringify({ t: 900, event: "stop", role: "explore", session: "s" }),
    "observed"
  ), 950);
  ok(
    orphanStop.runs.length === 1 && orphanStop.runs[0].start === null,
    "a stop with no start in view keeps an unknown span rather than inventing one"
  );
  ok(
    renderSequence(orphanStop, { width: 72 }).includes("start not in view"),
    "an unknown span is labelled, not silently rendered as a duration"
  );
  const progressOnly = reduceState(parseRecords([
    JSON.stringify({ t: 100, e: "progress", role: "principal-swe-backend", run: "r9" }),
    JSON.stringify({ t: 160, e: "stop", role: "principal-swe-backend", run: "r9" })
  ].join("\n"), "declared"), 200);
  const progressSeq = renderSequence(progressOnly, { width: 100 });
  ok(
    progressOnly.runs.length === 1 && progressOnly.runs[0].startless === true,
    "a run first heard at progress is marked as having no start in view"
  );
  ok(
    flat(progressSeq).includes("--:--:-- 00:02:40 -- start not in view"),
    "a run with no known start prints neither a start clock nor a span, because its first record is not its start"
  );
  const skew = reduceState(parseRecords([
    JSON.stringify({ t: 100, event: "start", role: "explore", session: "s" }),
    JSON.stringify({ t: 50, event: "stop", role: "explore", session: "s" })
  ].join("\n"), "observed"), 200);
  ok(skew.outOfOrder === true, "a stop preceding its own start is detected rather than shown as two runs");
  ok(
    renderSequence(skew, { width: 100 }).includes("order and pairing around it are unreliable"),
    "out-of-order records are disclosed in the render"
  );
  const swapped = reduceState(parseRecords([
    JSON.stringify({ t: 10, e: "start", role: "principal-swe-backend", run: "r7" }),
    JSON.stringify({ t: 70, e: "stop", role: "principal-security", run: "r7" })
  ].join("\n"), "declared"), 100);
  ok(
    swapped.runs[0].role === "principal-swe-backend",
    "a run is described by the start it closes, so a stop cannot rewrite the role"
  );
  ok(
    swapped.mismatched === true && renderSequence(swapped, { width: 100 }).includes("named a different role"),
    "a role disagreement between start and stop is disclosed, not silently resolved"
  );
  const declaredSeq = reduceState(parseRecords([
    JSON.stringify({ t: 10, e: "start", role: "principal-swe-backend", run: "r1" }),
    JSON.stringify({ t: 70, e: "stop", role: "principal-swe-backend", run: "r1" })
  ].join("\n"), "declared"), 100);
  ok(
    renderSequence(declaredSeq, { width: 72 }).includes("said"),
    "a self-declared run is labelled as said, never as observed"
  );
  ok(
    renderSequence({ runs: [{ role: null, src: "observed", start: 1, end: 2 }] }, { width: 72 }).includes("unknown"),
    "a run with no usable role renders as unknown rather than crashing"
  );
  const crowded = reduceState(parseRecords([
    JSON.stringify({ t: 10, event: "stop", role: "creative-lead-video", session: "s" }),
    JSON.stringify({ t: 20, event: "stop", role: "creative-lead-video", session: "s" }),
    JSON.stringify({ t: 30, event: "start", role: "principal-swe-architect", session: "s" })
  ].join("\n"), "observed"), 40);
  const many = { runs: Array.from({ length: 120 }, (_, i) => ({
    role: "principal-swe-architect",
    src: "observed",
    start: i * 10,
    end: i * 10 + 5
  })) };
  for (const width of [40, 56, 72, 100]) {
    for (const st of [seqState, crowded, orphanStop, skew, many, reduceState([], 1, { truncated: true })]) {
      const over = renderSequence(st, { width }).split("\n").filter((l) => l.length > Math.max(40, Math.min(width, 100)));
      ok(over.length === 0, `the sequence fits ${width} columns without wrapping`);
    }
    const out = renderSequence(crowded, { width });
    ok(
      out.includes("start not in view") && out.includes("run 2"),
      `no caveat is dropped at ${width} columns`
    );
  }
  const tallScene = renderScene(reduceState(parseRecords(
    Array.from({ length: 30 }, (_, i) => JSON.stringify({
      t: 100 + i,
      event: "start",
      role: `principal-role-${i}`,
      session: `s${i}`
    })).join("\n"),
    "observed"
  ), 500), { width: 80 });
  ok(tallScene.split("\n").length > 20, "the fixture is genuinely taller than a short window");
  const fitted = fitHeight(tallScene, 20);
  ok(fitted.split("\n").length <= 20, "a tall frame is cut down to the rows available");
  ok(fitted.includes("more row(s) not shown"), "the rows that were dropped are declared, not silently missing");
  const tailOf = (s) => {
    const ls = s.split("\n");
    for (let i = ls.length - 1; i >= 0; i--) if (/^-{3,}$/.test(ls[i].trim())) return ls.slice(i).join("\n");
    return "";
  };
  ok(
    tailOf(tallScene).length > 0 && tailOf(fitted) === tailOf(tallScene),
    "every caveat survives the cut -- workers are dropped, warnings never are"
  );
  ok(fitHeight(tallScene, 500) === tallScene, "a frame that already fits is returned untouched");
  ok(
    fitHeight(tallScene, 4).includes("too short"),
    "a window too short for even the caveats renders a plain explanation, not a confident fragment"
  );
  ok(
    !fitHeight(tallScene, 4).includes("principal-role-0"),
    "the too-short fallback shows no worker rows, so it cannot be read as the whole fleet"
  );
  const wrapping = ["a".repeat(70), "-".repeat(20), "note: keep me"].join("\n");
  ok(
    fitHeight(wrapping, 4, 20).includes("too short"),
    "a frame is measured in wrapped rows, not lines: 3 lines can be far more than 3 rows"
  );
  ok(fitHeight(wrapping, 40, 20) === wrapping, "the same frame is untouched when the rows really are there");
  const narrow = fitHeight(tallScene, 6, 20);
  ok(
    narrow.split("\n").reduce((n, l) => n + Math.max(1, Math.ceil(l.length / 20)), 0) <= 6,
    "the fitted frame fits the window once wrapping is counted"
  );
  ok(
    fitHeight(tallScene, 0, 80).split("\n").length === 1 && !fitHeight(tallScene, 0, 80).includes("principal-role-"),
    "a window with no usable rows renders one line, never the whole frame"
  );
  ok(fitHeight(tallScene, void 0) === tallScene, "an unknown budget is not guessed at");
  ok(
    fitHeight("head\nrule\nrow\nrow\nrow\nrow", 3, 80).includes("too short"),
    "a frame with no caveat rule is refused rather than truncated blind"
  );
  console.log(failed === 0 ? "\u2713 observe-watch self-test: all checks passed" : `\u2717 observe-watch self-test: ${failed} failure(s)`);
  process.exit(failed === 0 ? 0 : 1);
}
if (isEntry) {
  const argv = process.argv.slice(2);
  if (argv.includes("--self-test")) {
    selfTest();
  } else {
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
