#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  FORBIDDEN_FIELDS,
  LOG_REL,
  append,
  buildRecord,
  digest,
  read,
  runs,
  safeNote
} from "./chunk-MIK5J3AD.mjs";
import {
  resolveWorkspaceRoot
} from "./chunk-VTZRFV57.mjs";

// src/core/activity.mjs
import { resolve, join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { randomBytes } from "node:crypto";
import { mkdtempSync, writeFileSync, rmSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { spawnSync } from "node:child_process";
var REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..", "..");
var DUR = /^(\d+)(s|m|h)$/;
function parseDuration(v) {
  const m = DUR.exec(String(v || "").trim());
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === "s" ? n : m[2] === "m" ? n * 60 : n * 3600;
}
function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const body = a.slice(2);
      const eq = body.indexOf("=");
      if (eq !== -1) {
        out[body.slice(0, eq)] = body.slice(eq + 1);
        continue;
      }
      const key = body;
      const next = argv[i + 1];
      if (next === void 0 || next.startsWith("--")) out[key] = true;
      else {
        out[key] = next;
        i++;
      }
    } else out._.push(a);
  }
  return out;
}
function newRunId() {
  return randomBytes(5).toString("hex");
}
function main(argv) {
  const args = parseArgs(argv);
  const cmd = args._[0];
  if (!cmd || args.help) {
    console.log([
      "usage: activity <start|progress|stop|show> --root <workspace> --role <role> --run <id> [options]",
      "",
      `  writes ${LOG_REL} (gitignored, append-only)`,
      "",
      "  --for <30m|2h|90s>   when this run will report next (required for start/progress)",
      "  --item <item-id>     the coordination item this run serves",
      "  --outcome <handoff|done|blocked|abandoned>   required for stop",
      '  --note "<text>"      one short bounded line; paths are rejected',
      "  --new-run            print a fresh run id and exit"
    ].join("\n"));
    return 0;
  }
  if (args["new-run"] || cmd === "new-run") {
    console.log(newRunId());
    return 0;
  }
  const resolved = resolveWorkspaceRoot({ explicitRoot: args.root, cwd: process.cwd() });
  if (!resolved.ok) {
    console.error(`activity: ${resolved.reason}`);
    return 1;
  }
  const root = resolved.root;
  if (cmd === "show") {
    const log = read(root);
    if (!log.present) {
      console.log("activity: no log yet");
      return 0;
    }
    const open = runs(log.records).filter((r2) => r2.open);
    if (!open.length) {
      console.log(`activity: ${log.records.length} record(s), no open run`);
      return 0;
    }
    for (const r2 of open) {
      const flag = r2.overdue ? " OVERDUE" : "";
      console.log(`  ${r2.role}${r2.item ? ` on ${r2.item}` : ""} \u2014 run ${r2.run}, silent ${Math.round((r2.silent_for || 0) / 60)}m${flag}`);
    }
    return 0;
  }
  if (!["start", "progress", "stop"].includes(cmd)) {
    console.error(`activity: unknown command "${cmd}"`);
    return 1;
  }
  const input = { e: cmd, role: args.role, run: args.run, item: args.item, note: args.note };
  for (const k of Object.keys(args)) {
    if (FORBIDDEN_FIELDS.has(k.toLowerCase().replace(/-/g, "_"))) input[k.toLowerCase().replace(/-/g, "_")] = args[k];
  }
  if (cmd === "stop") input.outcome = args.outcome;
  else {
    const secs = parseDuration(args.for);
    if (secs === null) {
      console.error("activity: --for is required for start/progress (e.g. --for 30m)");
      return 1;
    }
    input.next_report_by = Math.floor(Date.now() / 1e3) + secs;
  }
  const r = append(root, input);
  if (!r.ok) {
    if (args.quiet) return 0;
    console.error(`activity: not recorded \u2014 ${r.reason}`);
    return 1;
  }
  if (!args.quiet) console.log(`activity: ${cmd} recorded for ${r.record.role} (run ${r.record.run})`);
  return 0;
}
function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => {
    if (cond) console.log(`\u2713 self-test: ${msg}`);
    else {
      console.error(`\u2717 self-test: ${msg}`);
      failed++;
    }
  };
  const NOW = 177e10;
  const nowSec = Math.floor(NOW / 1e3);
  const base = { e: "start", role: "principal-swe-backend", run: "a1b2c3d4e5", item: "export-audit", next_report_by: nowSec + 1800 };
  ok(buildRecord(base, NOW).ok, "a well-formed start record is accepted");
  for (const f of ["state", "verdict", "change_ref", "version", "lease"]) {
    const bad = buildRecord({ ...base, [f]: "x" }, NOW);
    ok(!bad.ok && /item record/.test(bad.reason), `a record carrying "${f}" is rejected as item state`);
  }
  ok(!buildRecord({ ...base, e: "thinking" }, NOW).ok, "an event outside the closed vocabulary is rejected");
  ok(!buildRecord({ ...base, e: "stop", outcome: "great" }, NOW).ok, "an outcome outside the closed vocabulary is rejected");
  ok(buildRecord({ ...base, e: "stop", outcome: "handoff" }, NOW).ok, "a stop with a known outcome is accepted");
  ok(
    !buildRecord({ ...base, next_report_by: void 0 }, NOW).ok,
    "a start with no declared deadline is rejected \u2014 silence must stay checkable"
  );
  ok(safeNote("see C:\\Users\\someone\\repo\\x.ts") === null, "a note containing a Windows path is dropped");
  ok(safeNote("see /home/someone/repo/x.ts") === null, "a note containing a POSIX home path is dropped");
  const long = safeNote("x".repeat(500));
  ok(long !== null && long.length <= 120, "a long note is truncated to the bound");
  ok(safeNote("line one\nline two") === "line one line two", "a multi-line note is flattened to one line");
  const built = buildRecord({ ...base, note: "refactoring the parser" }, NOW);
  ok(built.ok && !/[A-Za-z]:\\|\/home\//.test(built.line), "no absolute path can reach a serialized record");
  ok(built.ok && built.record.src === "declared", "every record is tiered declared, matching work-status");
  ok(!("sid" in built.record) && !("cwd" in built.record), "no session or directory identifier is recorded");
  ok(digest("abc") === digest("abc") && digest("abc") !== digest("abd"), "the digest is stable and discriminating");
  ok(
    parseDuration("30m") === 1800 && parseDuration("2h") === 7200 && parseDuration("45s") === 45,
    "durations parse to seconds"
  );
  ok(parseDuration("soon") === null, "an unparseable duration is rejected rather than guessed");
  {
    const wsTmp = mkdtempSync(join(tmpdir(), "kai-activity-ws-"));
    try {
      const withManifest = (...segments) => {
        const dir = join(wsTmp, ...segments);
        mkdirSync(join(dir, ".kai"), { recursive: true });
        writeFileSync(join(dir, ".kai", "manifest.json"), "{}");
        return dir;
      };
      const explicitWs = withManifest("explicit-ws");
      const explicitR = resolveWorkspaceRoot({ explicitRoot: explicitWs, cwd: wsTmp, env: {} });
      ok(
        explicitR.ok && explicitR.root === explicitWs && explicitR.source === "explicit",
        "an explicit caller root resolves directly and wins over everything else"
      );
      const searchWs = withManifest("search-ws");
      mkdirSync(join(searchWs, "a", "b", "c"), { recursive: true });
      const searchR = resolveWorkspaceRoot({ cwd: join(searchWs, "a", "b", "c"), env: {} });
      ok(
        searchR.ok && searchR.root === searchWs && searchR.source === "search",
        "a cwd nested under the workspace resolves upward to the manifest that carries it"
      );
      const explicitNested = resolveWorkspaceRoot({ explicitRoot: join(searchWs, "a", "b", "c"), env: {} });
      ok(
        !explicitNested.ok && /never searched upward/.test(explicitNested.reason),
        "an explicit root naming a non-workspace subdirectory fails instead of resolving upward to its ancestor"
      );
      const envWs = withManifest("env-ws");
      const envR = resolveWorkspaceRoot({ cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: envWs } });
      ok(
        envR.ok && envR.root === envWs && envR.source === "env",
        "KAI_WORKSPACE_ROOT is honored when no explicit root is given"
      );
      const explicitBeatsEnv = resolveWorkspaceRoot({ explicitRoot: explicitWs, cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: envWs } });
      ok(
        explicitBeatsEnv.ok && explicitBeatsEnv.root === explicitWs,
        "an explicit root wins over KAI_WORKSPACE_ROOT, not merely over cwd"
      );
      const relativeEnv = resolveWorkspaceRoot({ cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: "relative/path" } });
      ok(
        !relativeEnv.ok && /absolute/.test(relativeEnv.reason),
        "a relative KAI_WORKSPACE_ROOT is refused rather than resolved against an unstated base"
      );
      const noManifestDir = join(wsTmp, "no-manifest-here");
      mkdirSync(noManifestDir, { recursive: true });
      const unmanifestedEnv = resolveWorkspaceRoot({ cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: noManifestDir } });
      ok(
        !unmanifestedEnv.ok && /manifest/.test(unmanifestedEnv.reason),
        "an absolute KAI_WORKSPACE_ROOT with no manifest.json is refused, not silently accepted"
      );
      const emptyDir = join(wsTmp, "nothing-here");
      mkdirSync(emptyDir, { recursive: true });
      const missing = resolveWorkspaceRoot({ cwd: emptyDir, env: {} });
      ok(
        !missing.ok && /manifest/.test(missing.reason),
        "a directory with no manifest anywhere upward reports a clear not-found, not a guess"
      );
      const gitOnlyDir = join(wsTmp, "git-only-repo");
      mkdirSync(join(gitOnlyDir, ".git"), { recursive: true });
      const gitOnly = resolveWorkspaceRoot({ cwd: gitOnlyDir, env: {} });
      ok(!gitOnly.ok, "a bare .git with no .kai/manifest.json is no longer treated as a kai workspace");
    } finally {
      rmSync(wsTmp, { recursive: true, force: true });
    }
  }
  const recs = [
    { t: nowSec - 3600, src: "declared", e: "start", role: "r1", run: "run1", next_report_by: nowSec - 1800 },
    { t: nowSec - 600, src: "declared", e: "start", role: "r2", run: "run2", next_report_by: nowSec + 1800 },
    { t: nowSec - 500, src: "declared", e: "stop", role: "r2", run: "run2", outcome: "handoff" },
    { t: nowSec - 60, src: "declared", e: "start", role: "r3", run: "run3", next_report_by: nowSec + 600 }
  ];
  const folded = runs(recs, NOW);
  const byId = new Map(folded.map((r) => [r.run, r]));
  ok(byId.get("run1").open && byId.get("run1").overdue, "a run silent past its own deadline is overdue");
  ok(!byId.get("run2").open && byId.get("run2").outcome === "handoff", "a stopped run is closed with its outcome");
  ok(byId.get("run3").open && !byId.get("run3").overdue, "a run inside its deadline is open but not overdue");
  const parsed = (() => {
    const lines = ['{"e":"start","role":"r","run":"z1","t":1}', "not json", '{"e":"start"', ""];
    let good = 0, bad = 0;
    for (const l of lines) {
      if (!l.trim()) continue;
      try {
        JSON.parse(l);
        good++;
      } catch {
        bad++;
      }
    }
    return { good, bad };
  })();
  ok(parsed.good === 1 && parsed.bad === 2, "a partial write is a skipped line, not a parse failure");
  const tmp = mkdtempSync(join(tmpdir(), "kai-activity-"));
  try {
    const W = 6, N = 120;
    const worker = join(tmp, "w.mjs");
    const libUrl = pathToFileURL(join(REPO_ROOT, "src", "core", "lib", "activity.mjs")).href;
    writeFileSync(worker, [
      `const { append } = await import(${JSON.stringify(libUrl)});`,
      "const [root, id] = process.argv.slice(2);",
      `for (let i = 0; i < ${N}; i++) {`,
      "  append(root, { e: 'progress', role: `worker-${id}`, run: `run${id}0000`, next_report_by: 9999999999, note: `tick ${i}` });",
      "}"
    ].join("\n"));
    const kids = [];
    for (let i = 0; i < W; i++) kids.push(spawnSync(process.execPath, [worker, tmp, String(i)], { encoding: "utf8" }));
    ok(kids.every((k) => k.status === 0), "every concurrent writer exited cleanly");
    const after = read(tmp);
    ok(
      after.present && after.records.length === W * N && after.skipped === 0,
      `${W} concurrent processes x ${N} appends produced ${after.records.length}/${W * N} intact records, ${after.skipped} corrupt`
    );
    const perWorker = new Set(after.records.map((r) => r.role));
    ok(perWorker.size === W, "no writer was starved out by the others");
    const cli = join(REPO_ROOT, "src", "core", "activity.mjs");
    const e2eRoot = mkdtempSync(join(tmpdir(), "kai-activity-e2e-"));
    mkdirSync(join(e2eRoot, ".kai"), { recursive: true });
    writeFileSync(join(e2eRoot, ".kai", "manifest.json"), "{}");
    const s1 = spawnSync(process.execPath, [
      cli,
      "start",
      "--root",
      e2eRoot,
      "--role",
      "principal-swe-backend",
      "--run",
      "abc123def4",
      "--item",
      "export-audit",
      "--for",
      "30m"
    ], { encoding: "utf8" });
    const s2 = spawnSync(process.execPath, [
      cli,
      "stop",
      "--root",
      e2eRoot,
      "--role",
      "principal-swe-backend",
      "--run",
      "abc123def4",
      "--outcome",
      "handoff"
    ], { encoding: "utf8" });
    ok(s1.status === 0 && s2.status === 0, "the CLI records a start and a stop");
    const e2e = read(e2eRoot);
    ok(e2e.present && e2e.records.length === 2, "both records land in the log");
    ok(runs(e2e.records).every((r) => !r.open), "the run pairs and closes");
    const written = e2e.records[0];
    ok(
      Math.abs(written.t - Math.floor(Date.now() / 1e3)) < 120,
      "a written record stamps epoch SECONDS, the same unit as next_report_by"
    );
    const liveRoot = mkdtempSync(join(tmpdir(), "kai-activity-live-"));
    mkdirSync(join(liveRoot, ".kai"), { recursive: true });
    writeFileSync(join(liveRoot, ".kai", "manifest.json"), "{}");
    spawnSync(process.execPath, [
      cli,
      "start",
      "--root",
      liveRoot,
      "--role",
      "principal-sre",
      "--run",
      "aaaa1111bb",
      "--for",
      "30m"
    ], { encoding: "utf8" });
    const folded2 = runs(read(liveRoot).records)[0];
    ok(
      folded2.silent_for >= 0 && folded2.silent_for < 120,
      `a just-written run reports a sane silence (${folded2.silent_for}s), not a unit-mismatched number`
    );
    ok(folded2.open && !folded2.overdue, "a just-written run inside its window is open and not overdue");
    rmSync(liveRoot, { recursive: true, force: true });
    const badState = spawnSync(process.execPath, [
      cli,
      "start",
      "--root",
      e2eRoot,
      "--role",
      "r",
      "--run",
      "abc123def4",
      "--for",
      "5m",
      "--state",
      "shipped"
    ], { encoding: "utf8" });
    ok(
      badState.status === 1 && /item record/.test(badState.stderr),
      "the CLI refuses to record item state and says why"
    );
    const badEq = spawnSync(process.execPath, [
      cli,
      "start",
      "--root",
      e2eRoot,
      "--role",
      "r",
      "--run",
      "abc123def4",
      "--for",
      "5m",
      "--State=shipped"
    ], { encoding: "utf8" });
    ok(
      badEq.status === 1 && /item record/.test(badEq.stderr),
      "the --Key=value form is seen and rejected too, not silently ignored"
    );
    const evilRoot = mkdtempSync(join(tmpdir(), "kai-activity-evil-"));
    mkdirSync(join(evilRoot, ".kai"), { recursive: true });
    writeFileSync(join(evilRoot, ".kai", "activity.jsonl"), [
      JSON.stringify({ t: 1, e: "start", run: "aaaa1111bb", role: "/home/alice/secret", next_report_by: 2 }),
      JSON.stringify({ t: 1, e: "start", run: "aaaa1111bb", role: "ok-role", item: "../../etc/passwd" }),
      JSON.stringify({ t: 1, e: "start", run: "aaaa1111bb", role: "ok-role", note: "C:\\Users\\alice\\x.ts" }),
      JSON.stringify({ t: 1, e: "start", run: "aaaa1111bb", role: "ok-role", next_report_by: 2 })
    ].join("\n"));
    const evil = read(evilRoot);
    ok(
      evil.records.length === 1 && evil.skipped === 3,
      "a hand-written record carrying a path, a traversal, or a leaky note is skipped on READ, not just on write"
    );
    rmSync(evilRoot, { recursive: true, force: true });
    rmSync(e2eRoot, { recursive: true, force: true });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }
  console.log(failed === 0 ? "\u2713 activity self-test: all checks passed" : `\u2717 activity self-test: ${failed} failure(s)`);
  return failed === 0 ? 0 : 1;
}
var isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  process.exit(argv.includes("--self-test") ? selfTest() : main(argv));
}
export {
  newRunId,
  parseArgs,
  parseDuration
};
