#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  FORBIDDEN_FIELDS,
  LOG_REL,
  activityWorkspaceAdmission,
  append,
  read,
  runs
} from "./chunk-CEFA2NA7.mjs";
import "./chunk-S7AQGXMM.mjs";
import {
  resolveWorkspaceRoot
} from "./chunk-L4TFCRET.mjs";
import "./chunk-HMPQ32NA.mjs";
import "./chunk-VVVMKUAL.mjs";

// src/core/activity.mjs
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { randomBytes } from "node:crypto";
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
      "  --task <typed-id>    the coordination Task this run serves",
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
      console.log(`  ${r2.role}${r2.task ? ` on ${r2.task}` : ""} \u2014 run ${r2.run}, silent ${Math.round((r2.silent_for || 0) / 60)}m${flag}`);
    }
    return 0;
  }
  if (!["start", "progress", "stop"].includes(cmd)) {
    console.error(`activity: unknown command "${cmd}"`);
    return 1;
  }
  const admitted = activityWorkspaceAdmission(root);
  if (!admitted.ok) {
    console.error(`activity: not recorded \u2014 ${admitted.reason}`);
    return 1;
  }
  const input = { e: cmd, role: args.role, run: args.run, task: args.task, note: args.note };
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
var isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  process.exit(main(argv));
}
export {
  newRunId,
  parseArgs,
  parseDuration
};
