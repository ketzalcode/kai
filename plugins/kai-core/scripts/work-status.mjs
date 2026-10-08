#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  checkWorkspace
} from "./chunk-GKSNJIJN.mjs";
import "./chunk-3LIPICJ5.mjs";
import {
  hierarchyStatus
} from "./chunk-K3LPE7V7.mjs";
import {
  currentDirectionForStore,
  readLegacyRecords
} from "./chunk-AVOAKVOX.mjs";
import {
  closeStore,
  listAllRecords,
  openStore,
  read,
  readSnapshot,
  runs
} from "./chunk-RVMY63WZ.mjs";
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
  readWorkspaceManifest,
  resolveWorkspaceRoot
} from "./chunk-KUPTE65K.mjs";
import "./chunk-XLDNBMDG.mjs";
import {
  OPERATOR_GATED,
  TERMINAL,
  dependsOn,
  frontmatter,
  isNull,
  lease,
  listBlock,
  mapListBlock,
  parseStamp,
  parseThread,
  scalar
} from "./chunk-ITUOITH3.mjs";

// src/core/work-status.mjs
import { readFileSync, existsSync, readdirSync } from "node:fs";
import { join, resolve, basename, delimiter } from "node:path";
import { fileURLToPath } from "node:url";
import { execFileSync } from "node:child_process";
var SECTIONS = [
  ["needs-you", "NEEDS YOU", "waiting on the operator \u2014 nothing moves without a human"],
  ["integrity", "INTEGRITY", "records contradict each other; the board cannot be trusted here"],
  ["blocked", "BLOCKED", "work stopped on a dependency or an unanswered question"],
  ["unknown", "UNKNOWN", "cannot tell from the records alone \u2014 inspect before assuming"]
];
function overlay(items, activity, now) {
  const findings = [];
  if (!activity.present) return { findings, live: null };
  const open = runs(activity.records, now).filter((r) => r.open);
  const known = new Set(items.filter((i) => !i.unparseable).map((i) => i.id));
  const overdue = open.filter((r) => r.overdue);
  const byTarget = /* @__PURE__ */ new Map();
  for (const r of overdue) {
    const key = r.item && known.has(r.item) ? r.item : `run:${r.run}`;
    const prev = byTarget.get(key);
    if (!prev || (r.deadline ?? 0) < (prev.deadline ?? 0)) byTarget.set(key, { ...r, n: (prev?.n || 0) + 1 });
    else byTarget.set(key, { ...prev, n: prev.n + 1 });
  }
  for (const [key, r] of byTarget) {
    const item = key.startsWith("run:") ? null : items.find((i) => i.id === key);
    const late = Math.round((Math.floor(now / 1e3) - r.deadline) / 60);
    findings.push({
      section: "unknown",
      item: key,
      tier: "derived",
      headline: `${r.role} declared it would report ${late}m ago and has not${r.n > 1 ? ` (${r.n} open runs)` : ""}`,
      why: "The run set that deadline itself. It may still be working, or it may have stopped without recording it \u2014 this cannot tell which.",
      path: item ? item.rel : ".kai/activity.jsonl"
    });
  }
  return {
    findings,
    live: {
      open: open.length,
      overdue: open.filter((r) => r.overdue).length,
      skipped: activity.skipped,
      roles: [...new Set(open.map((r) => r.role))].sort()
    }
  };
}
function readItems(coordRoot) {
  const dir = join(coordRoot, "items");
  if (!existsSync(dir)) return [];
  const out = [];
  for (const f of readdirSync(dir)) {
    if (!f.endsWith(".md") || f === "README.md") continue;
    const path = join(dir, f);
    const raw = readFileSync(path, "utf8");
    const fm = frontmatter(raw);
    const rel = `.kai/state/items/${f}`;
    if (!fm) {
      out.push({ id: basename(f, ".md"), path, rel, unparseable: true });
      continue;
    }
    out.push({
      id: scalar(fm, "id") || basename(f, ".md"),
      path,
      rel,
      title: scalar(fm, "title") || "",
      state: scalar(fm, "state"),
      owner: scalar(fm, "owner"),
      nextRole: scalar(fm, "next_role"),
      changeRef: scalar(fm, "change_ref"),
      version: scalar(fm, "version"),
      updated: scalar(fm, "updated"),
      deliveryClass: scalar(fm, "delivery_class"),
      lease: lease(fm),
      dependsOn: dependsOn(fm),
      questionIds: listBlock(fm, "waiting_on_questions"),
      required: mapListBlock(fm, "review_requirements"),
      completed: mapListBlock(fm, "completed_reviews")
    });
  }
  return out;
}
function readThread(coordRoot, id) {
  const p = join(coordRoot, "threads", `${id}.md`);
  if (!existsSync(p)) return null;
  return parseThread(readFileSync(p, "utf8"));
}
function analyze(items, threads, now) {
  const findings = [];
  const byId = new Map(items.map((i) => [i.id, i]));
  const add = (section, item, tier, headline, why) => findings.push({ section, item: item.id, tier, headline, why, path: item.rel });
  for (const it of items) {
    if (it.unparseable) {
      add(
        "integrity",
        it,
        "derived",
        "item record has no readable frontmatter",
        "It cannot be counted, claimed, or trusted; every other number here excludes it."
      );
      continue;
    }
    const terminal = TERMINAL.has(it.state);
    const thread = threads.get(it.id);
    const qs = thread ? thread.questions : null;
    for (const q of qs || []) {
      if (!/^@?operator$/i.test(q.to)) continue;
      if (q.status && q.status !== "open") continue;
      add(
        "needs-you",
        it,
        "declared",
        `open ${q.kind || "question"} for the operator: ${q.id}`,
        `Asked by ${q.from || "an agent"}${q.blocking === "yes" ? ", and it is blocking" : ""}.`
      );
    }
    if (OPERATOR_GATED.has(it.state)) {
      add(
        "needs-you",
        it,
        "declared",
        `state "${it.state}" waits on a human`,
        "Deployment and production verification are operator acts; no kai role can advance this."
      );
    }
    if (it.questionIds.length && !terminal) {
      const seen = new Set((qs || []).map((q) => q.id));
      const missing = it.questionIds.filter((q) => !seen.has(q));
      if (missing.length) {
        add(
          "unknown",
          it,
          "derived",
          `waiting_on_questions names ${missing.length} question(s) with no packet in the thread`,
          `Missing: ${missing.join(", ")}. Either the thread was not updated or the ID is wrong \u2014 the block cannot be verified or cleared.`
        );
      }
    }
    if (it.questionIds.length && !terminal && it.state !== "blocked") {
      add(
        "unknown",
        it,
        "derived",
        `waiting_on_questions is set but the state is "${it.state}", not blocked`,
        `Named: ${it.questionIds.join(", ")}. Either the block was cleared without clearing the field, or the item is running while it should be waiting.`
      );
    }
    for (const d of thread ? thread.diagnostics : []) {
      add(
        "integrity",
        it,
        "derived",
        `thread packet ${d.id} does not reconcile (${d.type.replace(/-/g, " ")})`,
        d.message
      );
    }
    if (it.state === "blocked") {
      const openQ = (qs || []).filter((q) => !q.status || q.status === "open");
      add(
        "blocked",
        it,
        "declared",
        "state is blocked",
        openQ.length ? `Open question(s): ${openQ.map((q) => `${q.id} -> @${q.to}`).join(", ")}.` : "No open question packet found in the thread, so the blocker is not recorded where a reader can act on it."
      );
    }
    for (const d of it.dependsOn) {
      if (terminal) break;
      const dep = byId.get(d.item);
      if (!dep) {
        add(
          "integrity",
          it,
          "derived",
          `depends on unknown item "${d.item}"`,
          "The dependency cannot be satisfied because no such record exists."
        );
        continue;
      }
      if (d.requires && dep.state !== d.requires && !(d.requires === "completed" && TERMINAL.has(dep.state))) {
        add(
          "blocked",
          it,
          "derived",
          `waits for "${d.item}" to reach ${d.requires}`,
          `That item is currently "${dep.state}".`
        );
      }
    }
    const fresh = new Set(it.completed.filter((r) => r.change_ref === it.changeRef).map((r) => `${r.role}|${r.kind}`));
    for (const r of it.completed) {
      if (!r.change_ref || isNull(r.change_ref) || !it.changeRef || isNull(it.changeRef)) continue;
      if (fresh.has(`${r.role}|${r.kind}`)) continue;
      if (r.change_ref !== it.changeRef) {
        add(
          "integrity",
          it,
          "derived",
          `${r.role || "a review"} approved ${r.change_ref}, but the item is now at ${it.changeRef}`,
          "The implementation changed after the review, so that sign-off no longer certifies what would ship."
        );
      }
    }
    if (TERMINAL.has(it.state) && it.required.length) {
      const done = new Set(it.completed.filter((r) => !it.changeRef || isNull(it.changeRef) || r.change_ref === it.changeRef).map((r) => `${r.role}|${r.kind}`));
      const unmet = it.required.filter((r) => !done.has(`${r.role}|${r.kind}`));
      if (unmet.length) {
        add(
          "integrity",
          it,
          "derived",
          `state "${it.state}" but ${unmet.length} required review(s) unmet at the current ref`,
          `Unmet: ${unmet.map((r) => `${r.role} (${r.kind})`).join(", ")}.`
        );
      }
    }
    if (!isNull(it.lease.holder) && !isNull(it.lease.expires)) {
      const exp = parseStamp(it.lease.expires);
      if (exp !== null && exp < now) {
        add(
          "unknown",
          it,
          "derived",
          `lease held by ${it.lease.holder} expired at ${it.lease.expires}`,
          "The holder may still be working, may have crashed, or may have abandoned it. Reconcile before reclaiming."
        );
      }
    }
    if (!terminal && it.state !== "proposed" && it.state !== "blocked" && !OPERATOR_GATED.has(it.state) && isNull(it.nextRole) && isNull(it.lease.holder)) {
      add(
        "unknown",
        it,
        "derived",
        `state "${it.state}" with no next_role and no lease holder`,
        "Nothing identifies who acts next, so this will sit until someone notices."
      );
    }
  }
  return findings;
}
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
function findCoordRoot(root) {
  const stateRoot = join(root, ".kai", "state");
  return existsSync(join(stateRoot, "items")) ? stateRoot : null;
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
function collectHierarchy(root, now, roles, database = ".kai/state/coordination.sqlite") {
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
    for (const source of readLegacyRecords(store).filter((source2) => source2.status === "quarantined")) {
      findings.push({
        section: "integrity",
        item: source.declaredId ?? source.path,
        tier: "derived",
        headline: `quarantined legacy ${source.kind}`,
        why: source.issues.join("; "),
        path: source.path
      });
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
  if (manifest.ok && manifest.manifest.schema_version === 4) {
    return collectHierarchy(root, now, roles);
  }
  if (manifest.ok && manifest.manifest.schema_version !== 3) {
    return { ok: false, reason: `unsupported workspace schema ${manifest.manifest.schema_version}; inspection refuses to guess` };
  }
  const coordRoot = findCoordRoot(root);
  if (!coordRoot) return { ok: false, reason: "no .kai/state/items directory found under this root" };
  const items = readItems(coordRoot);
  const threads = /* @__PURE__ */ new Map();
  for (const it of items) threads.set(it.id, readThread(coordRoot, it.id));
  const findings = analyze(items, threads, now);
  let live = null;
  try {
    const ov = overlay(items, read(root), now);
    findings.push(...ov.findings);
    live = ov.live;
  } catch {
    live = null;
  }
  let doctor = null;
  try {
    const r = checkWorkspace(root);
    doctor = { errors: r.errors.length, warnings: r.warnings.length };
  } catch {
    doctor = null;
  }
  const flagged = new Set(findings.map((f) => f.item));
  return {
    ok: true,
    generated_at: new Date(now).toISOString(),
    // Deliberately the folder name, not the absolute path: this output is meant
    // to be pasted into issues, and the caller already knows where it ran.
    workspace: basename(root),
    git: gitContext(root),
    totals: {
      items: items.length,
      flagged: flagged.size,
      healthy: items.length - flagged.size,
      terminal: items.filter((i) => !i.unparseable && TERMINAL.has(i.state)).length
    },
    doctor,
    live,
    findings
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
  analyze,
  collect,
  overlay,
  render
};
