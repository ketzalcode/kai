import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  MAX_BYTES,
  MAX_LINE,
  MAX_NOTE,
  digest,
  looksAbsolute,
  safeNote
} from "./chunk-MIK5J3AD.mjs";
import {
  resolveWorkspaceRoot
} from "./chunk-VTZRFV57.mjs";

// src/core/observe-subagent.mjs
import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, statSync, renameSync, rmSync } from "node:fs";
import { join, dirname } from "node:path";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
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
function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => {
    if (cond) console.log(`\u2713 observe self-test: ${msg}`);
    else {
      console.error(`\u2717 observe self-test: ${msg}`);
      failed++;
    }
  };
  const tmp = join(tmpdir(), `kai-observe-${process.pid}`);
  mkdirSync(join(tmp, ".kai"), { recursive: true });
  writeFileSync(join(tmp, ".kai", "manifest.json"), "{}");
  const payload = (extra = {}) => ({
    sessionId: "session-uuid-abc",
    timestamp: Date.now(),
    cwd: tmp,
    agentName: "principal-qa-ui",
    ...extra
  });
  const S = { summary: true };
  const leaky = buildObserved("stop", payload({
    agentId: "agent-1",
    response: "C:\\Users\\someone\\secret\\report.md is where I wrote it"
  }), Date.now(), S);
  ok(leaky.ok && leaky.record.tldr === null, "a response whose only line is an absolute path yields no tldr");
  ok(
    leaky.ok && leaky.record.tldr_withheld === "path",
    "a refusal says so, because a silent null reads as a broken feature rather than a privacy choice"
  );
  ok(
    leaky.ok && !JSON.stringify(leaky.record).includes("secret"),
    "the reason for the refusal never carries the text that caused it"
  );
  const noProse = buildObserved("stop", payload({ response: "## Heading\n\n- bullet" }), Date.now(), S);
  ok(
    noProse.ok && noProse.record.tldr_withheld === "no-prose",
    "a reply with no prose at all is distinguished from one that was refused"
  );
  const clean = buildObserved("stop", payload({ response: "All good." }), Date.now(), S);
  ok(
    clean.ok && clean.record.tldr_withheld === void 0,
    "a stored summary carries no withheld marker"
  );
  const optedOut = buildObserved("stop", payload({ response: "/home/me/x.md is the file" }));
  ok(
    optedOut.ok && optedOut.record.tldr_withheld === void 0,
    "without the summary opt-in nothing is withheld, because nothing was attempted"
  );
  const recovered = buildObserved("stop", payload({
    response: "I wrote it to /home/someone/notes.md for you.\nThe review finished cleanly."
  }), Date.now(), S);
  ok(
    recovered.ok && recovered.record.tldr === "The review finished cleanly.",
    "a path-shaped first line does not discard a clean sentence that follows it"
  );
  ok(
    recovered.ok && recovered.record.tldr_withheld === void 0,
    "a recovered summary is not also reported as withheld"
  );
  const posix = buildObserved("stop", payload({ response: "/home/someone/notes.md holds the detail" }), Date.now(), S);
  ok(posix.ok && posix.record.tldr === null, "a POSIX absolute path is refused just like a Windows one");
  const long = buildObserved("stop", payload({ response: "x".repeat(500) }), Date.now(), S);
  ok(long.ok && long.record.tldr.length <= MAX_NOTE, "a long response is capped, not stored whole");
  const full = buildObserved("stop", payload({
    response: "Found three issues.\nThe second one is a blocker.\nDetail follows."
  }), Date.now(), S);
  ok(full.ok && full.record.tldr === "Found three issues.", "the tldr is the first meaningful line, never the whole response");
  ok(full.ok && !JSON.stringify(full.record).includes("blocker"), "the rest of the response never reaches the record");
  const heading = buildObserved("stop", payload({ response: "## Summary\n\n- bullet\n\nReview passed cleanly." }), Date.now(), S);
  ok(heading.ok && heading.record.tldr === "Review passed cleanly.", "headings and bullets are skipped in favour of prose");
  const noSum = buildObserved("stop", payload({ response: "Found three issues." }));
  ok(noSum.ok && noSum.record.tldr === null, "no summary is stored unless summaries were explicitly opted into");
  const secret = buildObserved("stop", payload({ response: "Rotated key AKIAIOSFODNN7EXAMPLE today." }), Date.now(), S);
  ok(
    secret.ok && secret.record.tldr.includes("AKIAIOSFODNN7EXAMPLE"),
    "a summary is NOT secret-scrubbed -- which is exactly why it is a separate opt-in"
  );
  const rec = buildObserved("start", payload());
  ok(rec.ok && !JSON.stringify(rec.record).includes(tmp), "the record never contains the absolute cwd it was resolved from");
  ok(rec.ok && !JSON.stringify(rec.record).includes("session-uuid-abc"), "the raw session id is digested, never stored");
  ok(rec.ok && rec.record.tldr === null, "a start event carries no tldr -- there is no response yet");
  ok(!buildObserved("progress", payload()).ok, "an event outside the closed vocabulary is refused");
  ok(!buildObserved("start", payload({ agentName: "../../etc/passwd" })).ok, "an agentName that is not a plain name is refused");
  ok(!buildObserved("start", payload({ agentName: "" })).ok, "a missing agentName is refused rather than recorded as unknown");
  const denied = main(["subagentStart"], JSON.stringify(payload()));
  ok(!denied.ok && /not enabled/.test(denied.reason), "without a consent marker nothing is written");
  ok(!existsSync(join(tmp, OBSERVED_REL)), "the declined path leaves no file behind at all");
  writeFileSync(join(tmp, CONSENT_REL), "enabled\n");
  const allowed = main(["subagentStop"], JSON.stringify(payload({ agentId: "agent-1", response: "Done." })));
  ok(allowed.ok, "with consent present the record is written");
  const written = readFileSync(join(tmp, OBSERVED_REL), "utf8").trim();
  ok(JSON.parse(written).src === "observed", "the record is tiered as observed, distinct from declared activity");
  ok(JSON.parse(written).event === "stop", "the host event name is mapped into the shared vocabulary");
  ok(!written.includes(tmp), "the persisted line contains no absolute workspace path");
  ok(!written.includes("session-uuid-abc"), "the persisted line contains no raw session id");
  ok(!written.includes("agent-1"), "the persisted line contains no raw agent id");
  ok(!wantsSummary(tmp), "a plain consent marker does not opt into summaries");
  ok(JSON.parse(written).tldr === null, "end to end, consent alone stores participation without any prose");
  writeFileSync(join(tmp, CONSENT_REL), "enabled\nsummary\n");
  ok(wantsSummary(tmp), "the summary opt-in is read from the consent marker");
  rmSync(join(tmp, OBSERVED_REL));
  main(["subagentStop"], JSON.stringify(payload({ agentId: "agent-2", response: "Shipped it." })));
  const withSum = readFileSync(join(tmp, OBSERVED_REL), "utf8").trim();
  ok(JSON.parse(withSum).tldr === "Shipped it.", "end to end, the summary opt-in stores the derived line");
  writeFileSync(join(tmp, CONSENT_REL), "enabled\n");
  {
    const unrelatedWs = join(tmpdir(), `kai-observe-unrelated-${process.pid}`);
    mkdirSync(join(unrelatedWs, ".kai"), { recursive: true });
    writeFileSync(join(unrelatedWs, ".kai", "manifest.json"), "{}");
    rmSync(join(tmp, OBSERVED_REL), { force: true });
    const prevEnvRoot = process.env.KAI_WORKSPACE_ROOT;
    process.env.KAI_WORKSPACE_ROOT = unrelatedWs;
    try {
      main(["subagentStop"], JSON.stringify(payload({ agentId: "agent-3", response: "Ignored the override." })));
    } finally {
      if (prevEnvRoot === void 0) delete process.env.KAI_WORKSPACE_ROOT;
      else process.env.KAI_WORKSPACE_ROOT = prevEnvRoot;
    }
    ok(existsSync(join(tmp, OBSERVED_REL)), "the record lands in the payload cwd workspace, not an ambient override");
    ok(
      !existsSync(join(unrelatedWs, OBSERVED_REL)),
      "a real KAI_WORKSPACE_ROOT set in the environment never redirects a hook event to an unrelated workspace"
    );
    rmSync(unrelatedWs, { recursive: true, force: true });
  }
  {
    const customRoot = join(tmpdir(), `kai-observe-external-${process.pid}`);
    const projectRoot = join(customRoot, "project");
    const workspaceRoot = join(customRoot, "workspace");
    const kaiHome = join(customRoot, "home");
    mkdirSync(projectRoot, { recursive: true });
    mkdirSync(join(workspaceRoot, ".kai"), { recursive: true });
    mkdirSync(kaiHome, { recursive: true });
    writeFileSync(join(workspaceRoot, ".kai", "manifest.json"), `${JSON.stringify({
      schema_version: 3,
      storage_mode: "external",
      workspace_id: "observer-external-workspace",
      projects: [{ id: "fixture", path: projectRoot }]
    }, null, 2)}
`);
    writeFileSync(join(workspaceRoot, CONSENT_REL), "enabled\n");
    writeFileSync(join(kaiHome, "workspaces.json"), `${JSON.stringify({
      schema_version: 1,
      workspaces: [{
        project_root: projectRoot,
        workspace_root: workspaceRoot,
        workspace_id: "observer-external-workspace"
      }]
    }, null, 2)}
`);
    const observed = main(
      ["subagentStop"],
      JSON.stringify(payload({ cwd: projectRoot, agentId: "agent-4", response: "External event." })),
      Date.now(),
      { KAI_HOME: kaiHome, KAI_WORKSPACE_ROOT: tmp }
    );
    ok(
      observed.ok && existsSync(join(workspaceRoot, OBSERVED_REL)),
      "a hook preserves custom KAI_HOME discovery while ignoring KAI_WORKSPACE_ROOT"
    );
    rmSync(customRoot, { recursive: true, force: true });
  }
  ok(!main(["subagentStart"], "not json").ok, "a non-JSON payload is refused without throwing");
  ok(!main(["subagentStart"], "{}").ok, "a payload with no cwd is refused without throwing");
  const self = fileURLToPath(import.meta.url);
  for (const [name, input] of [
    ["a valid payload", JSON.stringify(payload({ agentId: "a", response: "Done." }))],
    ["a malformed payload", "not json at all"],
    ["an empty payload", ""]
  ]) {
    const r = spawnSync(process.execPath, [self, "subagentStop"], { input, encoding: "utf8" });
    ok(r.stdout === "", `stdout stays empty for ${name}, so it can never be read as a decision`);
    ok(r.status === 0, `exit code stays 0 for ${name}, so a subagent never fails because of the observer`);
  }
  rmSync(tmp, { recursive: true, force: true });
  if (failed) {
    console.error(`observe self-test: ${failed} failure(s)`);
    process.exit(1);
  }
  console.log("\u2713 observe-subagent self-test: all checks passed");
}
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
  if (argv.includes("--self-test")) {
    selfTest();
  } else if (argv.some((a) => ["--enable", "--disable", "--status"].includes(a))) {
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
