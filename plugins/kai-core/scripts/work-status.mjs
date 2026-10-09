#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
  closeStore,
  currentDirectionForStore,
  hierarchyStatus,
  listAllRecords,
  openStore,
  readSnapshot,
  readWorkspaceManifest,
  resolveWorkspaceRoot
} from "./runtime-core.mjs";

// src/core/work-status.mjs
import { existsSync, readdirSync } from "node:fs";
import { join, resolve, basename, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
var SECTIONS = [
  ["needs-you", "NEEDS YOU", "waiting on the operator \u2014 nothing moves without a human"],
  ["integrity", "INTEGRITY", "records contradict each other; the board cannot be trusted here"],
  ["blocked", "BLOCKED", "work stopped on a dependency or an unanswered question"],
  ["unknown", "UNKNOWN", "cannot tell from the records alone \u2014 inspect before assuming"]
];
function gitContext(root) {
  const run = (args) => {
    try {
      return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
    } catch {
      return null;
    }
  };
  const rev = run(["rev-parse", "--short", "HEAD"]);
  if (rev === null) return { revision: null, dirty: null };
  return { revision: rev, dirty: run(["status", "--porcelain"]) !== "" };
}
function installedRoles(env = process.env) {
  const roles = /* @__PURE__ */ new Set();
  for (const pluginRoot of (env.KAI_COPILOT_PLUGIN_DIRS ?? "").split(delimiter).filter(Boolean)) {
    const directory = join(pluginRoot, "agents");
    if (!existsSync(directory)) continue;
    for (const file of readdirSync(directory)) {
      if (file.endsWith(".agent.md")) roles.add(file.slice(0, -".agent.md".length));
    }
  }
  return [...roles].sort();
}
function hierarchyNodes(status) {
  const nodes = [];
  for (const epic of status.epics) {
    nodes.push(epic);
    for (const pack of epic.packs) {
      for (const feature of pack.features) {
        nodes.push(feature);
        for (const requirement of feature.requirements) {
          nodes.push(requirement);
          nodes.push(...requirement.tasks);
        }
      }
    }
  }
  return nodes.filter((node) => !node.missing);
}
function collectHierarchy(root, now, roles, database) {
  const path = join(root, ...database.split("/"));
  if (!existsSync(path)) {
    return { ok: false, reason: `coordination database is missing at ${database}` };
  }
  let store;
  try {
    store = openStore({ path, mode: "read" });
    const status = readSnapshot(store, () => {
      const [epic] = listAllRecords(store, { kind: "epic" });
      const direction = epic ? currentDirectionForStore(store, epic.body.direction_ref) : null;
      return hierarchyStatus(store, { direction, roles });
    });
    const findings = [];
    const nodes = hierarchyNodes(status);
    for (const node of nodes) {
      const item = `${node.kind}/${node.id}`;
      for (const attention of node.attention.reasons) {
        findings.push({
          section: attention.attention === "needs-human" ? "needs-you" : "blocked",
          item,
          tier: "derived",
          headline: attention.message,
          why: `Derived ${attention.code} condition from the transactionally consistent hierarchy snapshot.`,
          path: database
        });
      }
      for (const staffing of node.attention.staffing_gaps) {
        findings.push({
          section: "unknown",
          item,
          tier: "derived",
          headline: `installed role "${staffing.role}" is unavailable`,
          why: `Session staffing gap for ${staffing.responsibilities.join(", ")}; the hierarchy record was not changed.`,
          path: database
        });
      }
    }
    const hierarchyIds = new Set(nodes.map((node) => `${node.kind}/${node.id}`));
    const flagged = new Set(findings.map((finding) => finding.item).filter((item) => hierarchyIds.has(item)));
    return {
      ok: true,
      hierarchy: true,
      generated_at: new Date(now).toISOString(),
      workspace: basename(root),
      git: gitContext(root),
      through_seq: status.through_seq,
      goal: status.goal,
      status,
      live: null,
      doctor: null,
      totals: {
        records: status.totals.records,
        flagged: flagged.size,
        healthy: status.totals.records - flagged.size,
        terminal: status.totals.terminal
      },
      findings
    };
  } catch (error) {
    return { ok: false, reason: error.message };
  } finally {
    closeStore(store);
  }
}
function collect(root, now = Date.now(), { roles = [] } = {}) {
  const manifest = readWorkspaceManifest(root);
  if (manifest.ok && manifest.manifest.schema_version === WORKSPACE_SCHEMA_VERSION) {
    return collectHierarchy(root, now, roles, COORDINATION_DATABASE);
  }
  return {
    ok: false,
    reason: manifest.ok ? "workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard" : manifest.reason
  };
}
function render(r) {
  const L = [];
  if (!r.ok) return `work-status: ${r.reason}`;
  const bySection = new Map(SECTIONS.map(([k]) => [k, []]));
  for (const f of r.findings) bySection.get(f.section)?.push(f);
  const counts = SECTIONS.map(([k, label]) => `${label} ${bySection.get(k).length}`).join("   ");
  L.push(counts);
  L.push("=".repeat(Math.max(40, counts.length)));
  for (const [key, label, blurb] of SECTIONS) {
    const fs = bySection.get(key);
    if (!fs.length) continue;
    L.push("");
    L.push(`${label} (${fs.length}) \u2014 ${blurb}`);
    for (const f of fs) {
      L.push(`  [${f.tier}] ${f.item}: ${f.headline}`);
      L.push(`      ${f.why}`);
      L.push(`      ${f.path}`);
    }
  }
  L.push("");
  if (!r.findings.length) L.push("Nothing needs you. No exception found in the recorded state.");
  const total = r.hierarchy ? r.totals.records : r.totals.items;
  L.push(`${total} ${r.hierarchy ? "hierarchy record(s)" : "item(s)"}: ${r.totals.flagged} flagged, ${r.totals.healthy} without a finding (${r.totals.terminal} terminal).`);
  if (r.live) {
    L.push(r.live.open ? `Activity: ${r.live.open} run(s) open${r.live.overdue ? `, ${r.live.overdue} past its declared deadline` : ""} \u2014 ${r.live.roles.join(", ")}. Role attribution is self-reported.` : "Activity: no run currently open.");
  }
  if (r.doctor && (r.doctor.errors || r.doctor.warnings)) {
    L.push(`workspace-doctor: ${r.doctor.errors} error(s), ${r.doctor.warnings} warning(s) \u2014 run \`workspace-doctor\` for detail.`);
  }
  const rev = r.git.revision ? `${r.git.revision}${r.git.dirty ? " (uncommitted changes present)" : ""}` : "not a git worktree";
  L.push(`Recorded state at ${rev}, generated ${r.generated_at}.`);
  L.push("Reports what agents have DECLARED, not verified live activity. A silent item may be working, stopped, or forgotten.");
  return L.join("\n");
}
var isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  const rootIdx = argv.indexOf("--root");
  const r = resolveWorkspaceRoot({ explicitRoot: rootIdx === -1 ? null : argv[rootIdx + 1], cwd: process.cwd() });
  if (!r.ok) {
    console.error(`work-status: ${r.reason}`);
    process.exit(2);
  }
  const root = r.root;
  const status = collect(root, Date.now(), { roles: installedRoles() });
  if (argv.includes("--json")) console.log(JSON.stringify(status, null, 2));
  else console.log(render(status));
  if (!status.ok) process.exit(2);
  process.exit(status.findings.some((f) => f.section === "integrity") ? 1 : 0);
}
export {
  collect,
  render
};
