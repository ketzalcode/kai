import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  MAX_BYTES,
  MAX_LINE,
  digest,
  looksAbsolute,
  safeNote
} from "./chunk-7QZFFPOT.mjs";
import {
  resolveWorkspaceRoot
} from "./chunk-VTZRFV57.mjs";

// src/core/observe-subagent.mjs
import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, statSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
var OBSERVED_REL = ".kai/observed.jsonl";
var CONSENT_REL = ".kai/observer-consent";
var OBSERVED_EVENTS = /* @__PURE__ */ new Set(["start", "stop"]);
var NAME_RE = /^[a-z0-9-]{1,60}$/;
function findWorkspace(cwd, env = process.env) {
  if (typeof cwd !== "string" || !cwd) return null;
  const r = resolveWorkspaceRoot({ cwd, env });
  return r.ok ? r.root : null;
}
function hasConsent(root) {
  return !!root && existsSync(join(root, CONSENT_REL));
}
function wantsSummary(root) {
  if (!root) return false;
  try {
    return /(^|\s)summary(\s|$)/m.test(readFileSync(join(root, CONSENT_REL), "utf8"));
  } catch {
    return false;
  }
}
function tldrDetail(response) {
  if (typeof response !== "string") return { tldr: null, withheld: "no-prose" };
  let refused = false;
  for (const line of response.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || /^[#>*\-=_`|]/.test(t)) continue;
    const safe = safeNote(t);
    if (safe) return { tldr: safe, withheld: null };
    refused = true;
  }
  return { tldr: null, withheld: refused ? "path" : "no-prose" };
}
function tldrFrom(response) {
  return tldrDetail(response).tldr;
}
function buildObserved(event, payload, now = Date.now(), { summary = false } = {}) {
  if (!OBSERVED_EVENTS.has(event)) return { ok: false, reason: `unknown event "${event}"` };
  if (!payload || typeof payload !== "object") return { ok: false, reason: "payload must be an object" };
  const role = typeof payload.agentName === "string" ? payload.agentName.trim() : "";
  if (!role || !NAME_RE.test(role)) return { ok: false, reason: "payload has no usable agentName" };
  const derived = summary && event === "stop" ? tldrDetail(payload.response) : { tldr: null, withheld: null };
  const rec = {
    t: Math.floor(now / 1e3),
    src: "observed",
    event,
    role,
    // A session id is an opaque host identifier; a digest is enough to group a
    // session's subagents and pair a start with its stop.
    session: payload.sessionId ? digest(payload.sessionId).slice(0, 12) : null,
    // Only `subagentStop` carries agentId. Without it, a start and a stop can be
    // paired only by (session, role) in order -- which is ambiguous when two
    // subagents of the same role run concurrently. The viewer must label that
    // ambiguity rather than resolve it by guessing.
    agent: typeof payload.agentId === "string" && payload.agentId ? digest(payload.agentId).slice(0, 12) : null,
    tldr: derived.tldr
  };
  if (derived.withheld) rec.tldr_withheld = derived.withheld;
  for (const [k, v] of Object.entries(rec)) {
    if (looksAbsolute(v)) return { ok: false, reason: `field "${k}" looks like an absolute path` };
  }
  const line = JSON.stringify(rec);
  if (line.length > MAX_LINE) return { ok: false, reason: "record exceeds the single-line bound" };
  return { ok: true, record: rec, line };
}
function rotate(file) {
  try {
    if (statSync(file).size > MAX_BYTES) renameSync(file, `${file}.1`);
  } catch {
  }
}
function appendObserved(root, event, payload, now = Date.now(), opts = {}) {
  const built = buildObserved(event, payload, now, opts);
  if (!built.ok) return built;
  const file = join(root, OBSERVED_REL);
  try {
    mkdirSync(dirname(file), { recursive: true });
    rotate(file);
    appendFileSync(file, `${built.line}
`);
  } catch (e) {
    return { ok: false, reason: `could not append: ${e.code || "unknown"}` };
  }
  return built;
}
function readStdin() {
  try {
    return readFileSync(0, "utf8");
  } catch {
    return "";
  }
}
function main(argv, stdinText, now = Date.now(), env = process.env) {
  const event = argv.find((a) => !a.startsWith("-")) || "";
  let payload;
  try {
    payload = JSON.parse(stdinText);
  } catch {
    return { ok: false, reason: "payload was not JSON" };
  }
  const resolverEnv = { ...env };
  delete resolverEnv.KAI_WORKSPACE_ROOT;
  const root = findWorkspace(payload && payload.cwd, resolverEnv);
  if (!root) return { ok: false, reason: "no workspace root found" };
  if (!hasConsent(root)) return { ok: false, reason: "observer not enabled for this workspace" };
  return appendObserved(
    root,
    event === "subagentStart" ? "start" : event === "subagentStop" ? "stop" : event,
    payload,
    now,
    { summary: wantsSummary(root) }
  );
}
var isEntry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
function adminCli(argv) {
  const flag = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith("-") ? argv[i + 1] : null;
  };
  const r = resolveWorkspaceRoot({ explicitRoot: flag("root"), cwd: process.cwd() });
  if (!r.ok) {
    console.error(`observe-subagent: ${r.reason}`);
    process.exit(2);
  }
  const root = r.root;
  const marker = join(root, CONSENT_REL);
  if (argv.includes("--enable")) {
    const summary = argv.includes("--with-summary");
    mkdirSync(dirname(marker), { recursive: true });
    writeFileSync(marker, `enabled ${(/* @__PURE__ */ new Date()).toISOString()}
${summary ? "summary\n" : ""}`);
    console.log("Subagent observation ENABLED for this workspace.");
    console.log(`  marker:  ${CONSENT_REL}   (delete it to revoke)`);
    console.log(`  records: ${OBSERVED_REL}  (gitignored, local only)`);
    console.log("");
    console.log("Records who started and who finished, so the participation");
    console.log("sequence of a feature becomes checkable.");
    console.log("");
    if (summary) {
      console.log("Summaries: ON. A one-line summary is scraped from each reply.");
      console.log("It is capped and path-shapes are refused, but it is NOT");
      console.log("secret-scrubbed -- a token or an address in the first prose");
      console.log("line would be stored verbatim. Re-run without --with-summary");
      console.log("to record participation only.");
    } else {
      console.log("Summaries: off. Add --with-summary to also store a one-line");
      console.log("summary scraped from each reply (not secret-scrubbed).");
    }
    console.log("");
    console.log("Hook configuration is read when a session STARTS, so restart your");
    console.log("session before expecting anything to appear.");
    return;
  }
  if (argv.includes("--disable")) {
    if (existsSync(marker)) {
      rmSync(marker);
      console.log("Subagent observation DISABLED. Existing records are left in place.");
    } else console.log("Subagent observation was not enabled.");
    return;
  }
  const on = hasConsent(root);
  const file = join(root, OBSERVED_REL);
  let count = 0;
  if (existsSync(file)) {
    try {
      count = readFileSync(file, "utf8").split("\n").filter(Boolean).length;
    } catch {
      count = 0;
    }
  }
  console.log(`Subagent observation: ${on ? "ENABLED" : "disabled"}`);
  if (on) console.log(`Summaries: ${wantsSummary(root) ? "ON (not secret-scrubbed)" : "off"}`);
  console.log(`Observed records: ${count}`);
  if (!on) console.log("Enable with: npm run observe:enable");
}
if (isEntry) {
  const argv = process.argv.slice(2);
  if (argv.some((a) => ["--enable", "--disable", "--status"].includes(a))) {
    adminCli(argv);
  } else {
    try {
      main(argv, readStdin());
    } catch {
    }
    process.exit(0);
  }
}
export {
  CONSENT_REL,
  OBSERVED_EVENTS,
  OBSERVED_REL,
  appendObserved,
  buildObserved,
  findWorkspace,
  hasConsent,
  main,
  tldrDetail,
  tldrFrom,
  wantsSummary
};
