import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  closeStore,
  inspectGitPrivacy,
  openStore,
  readWorkspaceContract
} from "./chunk-S7AQGXMM.mjs";
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
  escapesRoot,
  exactPath,
  pathHasLink
} from "./chunk-VVVMKUAL.mjs";

// src/core/lib/activity.mjs
import {
  appendFileSync,
  readFileSync,
  existsSync,
  lstatSync,
  mkdirSync,
  renameSync,
  statSync
} from "node:fs";
import { join, dirname } from "node:path";
var LOG_REL = ".kai/core/runtime/activity.jsonl";
var EVENTS = /* @__PURE__ */ new Set(["start", "progress", "stop"]);
var OUTCOMES = /* @__PURE__ */ new Set(["handoff", "done", "blocked", "abandoned"]);
var FORBIDDEN_FIELDS = /* @__PURE__ */ new Set([
  "state",
  "resume_state",
  "verdict",
  "review",
  "completed_reviews",
  "review_requirements",
  "change_ref",
  "version",
  "lease",
  "decision",
  "approved"
]);
var ROLE_RE = /^[a-z0-9-]{1,60}$/;
var TASK_RE = /^(?:core|engineering|creative):task:[a-z0-9]+(?:-[a-z0-9]+)*$/;
var RUN_RE = /^[a-z0-9]{6,16}$/;
var MAX_NOTE = 120;
var MAX_LINE = 1024;
var MAX_BYTES = 512 * 1024;
function digest(input) {
  let h1 = 2166136261, h2 = 16777619;
  const s = String(input);
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + s.charCodeAt(i) + 1, 2246822507) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, 12);
}
var ABSOLUTE = /(^|[\s"'(=])([A-Za-z]:[\\/]|\/(?:home|Users|root|mnt|var|tmp|etc)\b|\\\\|~[\\/])/;
function looksAbsolute(s) {
  return typeof s === "string" && ABSOLUTE.test(s);
}
function safeNote(note) {
  if (typeof note !== "string") return null;
  const flat = note.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (!flat) return null;
  if (looksAbsolute(flat)) return null;
  return flat.length > MAX_NOTE ? `${flat.slice(0, MAX_NOTE - 1)}~` : flat;
}
function buildRecord(input, now = Date.now()) {
  if (!input || typeof input !== "object") return { ok: false, reason: "record must be an object" };
  for (const k of Object.keys(input)) {
    if (FORBIDDEN_FIELDS.has(k)) {
      return { ok: false, reason: `field "${k}" belongs to the Task record, not the activity log` };
    }
  }
  const e = String(input.e || "").trim();
  if (!EVENTS.has(e)) return { ok: false, reason: `unknown event "${e}"` };
  const role = String(input.role || "").trim();
  if (!ROLE_RE.test(role)) return { ok: false, reason: "role must be a kebab-case role id" };
  const task = input.task == null ? null : String(input.task).trim();
  if (task !== null && !TASK_RE.test(task)) {
    return { ok: false, reason: 'task must be a typed "<pack>:task:<slug>" identity' };
  }
  const run = String(input.run || "").trim();
  if (!RUN_RE.test(run)) return { ok: false, reason: "run must be a short opaque id" };
  const nowSec = Math.floor(now / 1e3);
  const rec = {
    t: input.t != null ? Math.floor(Number(input.t)) : nowSec,
    src: "declared",
    e,
    role,
    run
  };
  if (!Number.isFinite(rec.t)) return { ok: false, reason: "t must be an epoch-seconds integer" };
  if (task) rec.task = task;
  if (e === "stop") {
    const outcome = String(input.outcome || "").trim();
    if (!OUTCOMES.has(outcome)) return { ok: false, reason: `unknown outcome "${outcome}"` };
    rec.outcome = outcome;
  }
  if (input.next_report_by != null) {
    const by = Math.floor(Number(input.next_report_by));
    if (!Number.isFinite(by)) return { ok: false, reason: "next_report_by must be an epoch-seconds integer" };
    rec.next_report_by = by;
  } else if (e !== "stop") {
    return { ok: false, reason: "start and progress must declare next_report_by" };
  }
  const note = safeNote(input.note);
  if (note) rec.note = note;
  const line = JSON.stringify(rec);
  if (line.length > MAX_LINE) return { ok: false, reason: "record exceeds the line bound" };
  if (looksAbsolute(line)) return { ok: false, reason: "record contains a filesystem path" };
  return { ok: true, record: rec, line };
}
function logPath(root) {
  return join(root, LOG_REL);
}
function activityWorkspaceAdmission(root, env = process.env) {
  let store;
  try {
    const manifest = readWorkspaceContract(root, {
      env,
      versions: [WORKSPACE_SCHEMA_VERSION]
    });
    const privacy = inspectGitPrivacy(root, manifest.placement);
    const errors = [
      ...privacy.errors,
      ...privacy.missing.map((path) => `private workspace path must be ignored: ${path}`)
    ];
    if (manifest.placement === "repo-local" && !privacy.gitRoot) {
      errors.push("repo-local placement requires a readable Git work tree");
    }
    if (errors.length) return { ok: false, reason: errors.join("; ") };
    const database = join(root, ...COORDINATION_DATABASE.split("/"));
    if (!existsSync(database)) {
      return { ok: false, reason: `coordination database is missing at ${COORDINATION_DATABASE}` };
    }
    if (pathHasLink(root, database) || !exactPath(database) || !lstatSync(database).isFile()) {
      return {
        ok: false,
        reason: `coordination database must be an exact unlinked regular file at ${COORDINATION_DATABASE}`
      };
    }
    store = openStore({ path: database, mode: "read" });
    return { ok: true, manifest };
  } catch (error) {
    return { ok: false, reason: `${error.code ?? "INVALID_INPUT"}: ${error.message}` };
  } finally {
    closeStore(store);
  }
}
function rotate(file) {
  try {
    if (!existsSync(file)) return;
    if (statSync(file).size < MAX_BYTES) return;
    renameSync(file, `${file}.1`);
  } catch {
  }
}
function append(root, input, now = Date.now(), env = process.env) {
  const built = buildRecord(input, now);
  if (!built.ok) return built;
  const admitted = activityWorkspaceAdmission(root, env);
  if (!admitted.ok) return admitted;
  const file = logPath(root);
  if (escapesRoot(root, file) || pathHasLink(root, file)) {
    return { ok: false, reason: "activity path traverses a link or escapes the workspace" };
  }
  try {
    mkdirSync(dirname(file), { recursive: true });
    rotate(file);
    appendFileSync(file, `${built.line}
`);
    return { ok: true, record: built.record };
  } catch (err) {
    return { ok: false, reason: `append failed: ${err.code || "unknown"}` };
  }
}
function readable(r) {
  if (!r || typeof r !== "object") return false;
  if (!EVENTS.has(r.e)) return false;
  if (typeof r.run !== "string" || !RUN_RE.test(r.run)) return false;
  if (typeof r.role !== "string" || !ROLE_RE.test(r.role)) return false;
  if (r.task != null && !(typeof r.task === "string" && TASK_RE.test(r.task))) return false;
  if (r.item != null) return false;
  if (r.next_report_by != null && !Number.isFinite(Number(r.next_report_by))) return false;
  if (r.outcome != null && !OUTCOMES.has(r.outcome)) return false;
  if (r.note != null && (typeof r.note !== "string" || r.note.length > MAX_NOTE || looksAbsolute(r.note))) return false;
  return Number.isFinite(Number(r.t));
}
function read(root) {
  const file = logPath(root);
  if (!existsSync(file)) return { present: false, records: [], skipped: 0 };
  let raw;
  try {
    raw = readFileSync(file, "utf8");
  } catch {
    return { present: false, records: [], skipped: 0 };
  }
  const records = [];
  let skipped = 0;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (readable(r)) records.push(r);
      else skipped++;
    } catch {
      skipped++;
    }
  }
  return { present: true, records, skipped };
}
function runs(records, now = Date.now()) {
  const nowSec = Math.floor(now / 1e3);
  const byRun = /* @__PURE__ */ new Map();
  for (const r of records) {
    let s = byRun.get(r.run);
    if (!s) {
      s = {
        run: r.run,
        role: r.role,
        task: r.task || null,
        started: null,
        last: null,
        deadline: null,
        stopped: null,
        outcome: null,
        events: 0
      };
      byRun.set(r.run, s);
    }
    s.events++;
    if (r.role) s.role = r.role;
    if (r.task) s.task = r.task;
    if (r.e === "start") s.started = r.t;
    if (r.e === "stop") {
      s.stopped = r.t;
      s.outcome = r.outcome || null;
    }
    if (s.last === null || r.t >= s.last) {
      s.last = r.t;
      if (r.next_report_by != null) s.deadline = r.next_report_by;
    }
  }
  const out = [];
  for (const s of byRun.values()) {
    s.open = s.stopped === null;
    s.overdue = s.open && s.deadline != null && s.deadline < nowSec;
    s.silent_for = s.open && s.last != null ? nowSec - s.last : null;
    out.push(s);
  }
  return out.sort((a, b) => (b.last || 0) - (a.last || 0));
}

export {
  LOG_REL,
  FORBIDDEN_FIELDS,
  MAX_LINE,
  MAX_BYTES,
  digest,
  looksAbsolute,
  safeNote,
  activityWorkspaceAdmission,
  append,
  read,
  runs
};
