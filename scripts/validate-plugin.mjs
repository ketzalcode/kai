#!/usr/bin/env node
// Contract validator for the kai plugin. Guards what the plugin sells:
//   • structure — frontmatter, name==path, SKILL.md presence, resolvable
//     agent/skill and `inherit` references, and plugin.json paths;
//   • release hygiene — plugin.json and package.json declare the same version;
//   • host-tool allowlist — every declared `tools:` entry is a real host tool;
//   • workspace-contract consistency — the managed .gitignore block, the
//     .kai/runs areas, initiative artifact directories, and the library/<type>
//     set stay in sync across the manifest schema and scaffolds;
//   • the partition — every agent in exactly one pack, every skill with exactly
//     one provider, every reviewed override still placing a skill inheritance
//     cannot, core's `kai-core-*` namespace held in both directions, no id
//     emitted by two packs, and role availability decided by roster membership;
//   • generated-pack guarantees — legacy department agents carry the canonical
//     fail-closed core preflight and degraded-mode refusal byte for byte, while
//     kai-agent-v1 and core agents carry neither; the probe marker and version
//     remain rigid and the refusal restates no core rule;
//   • cross-pack references — every inherited, user-invoked and orchestrated
//     reference, plus every invoked script and hooks.json itself, resolves to
//     core or to the referring body's own pack;
//   • fixtures — the sample repository-mode manifest matches the schema.
// Dependency-free (Node built-ins only) so CI runs it with no install step.
//
// Run: `node scripts/validate-plugin.mjs` (or `npm run validate`).
// Exit code 0 = contract valid; 1 = one or more violations printed.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname, isAbsolute, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseFrontmatter, stripQuotes, loaderErrors, parseToolList, SUPPORTED_TOOLS,
} from './lib/loader-contract.mjs';
import {
  discoverManifests, manifestParityErrors, marketplaceConsistencyErrors,
  marketplaceSurfacePolicy,
  materializePacks, preflightBlock as canonicalPreflightBlock,
  degradedBlock as canonicalDegradedBlock, degradedBlockErrors, coreContractLines,
  PREFLIGHT_BLOCK_REL, DEGRADED_BLOCK_REL, CONTRACT_SKILL, REFUSAL,
  HOOKS_OWNER, HOOK_ASSET_RE, declaredInherits, dispatchedRefs, packProviders,
  collectReferences, referenceErrors, planAssets, assetOwnershipErrors,
  hooksAssignmentErrors, planPacks, parseGeneratedKey, agentRefPattern, agentTaxonomyErrors,
  requiresCoordinatedRunContracts, progressiveSkillRoutingErrors,
  agentIdentityContractErrors, agentPromptLimitErrors,
  agentAuthoringReferenceErrors,
  partitionErrors, namespaceErrors, providerCollisionErrors, contractPinErrors,
  guaranteeBlockErrors, availabilityErrors, DISPATCHING_ROLES,
  generatedKeyErrors, generatedPackageErrors, generatedRuntimeErrors, hookAssetReferenceErrors,
  PACK_ORDER, packPluginName, sourceAgentFiles, sourceSkillFiles, skillCompanionFiles, sourceFileErrors,
  sourcePlacementErrors,
  agentSourceFile, skillSourceFile, ACTIVITY_EXEMPT,
} from './lib/pack-plan.mjs';
import { MARKETPLACE } from './lib/migration-doctor.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const err = (file, msg) => errors.push({ file, msg });

const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, '/');

// ---------------------------------------------------------------------------
// Collect agents and skills
// ---------------------------------------------------------------------------
const agentFiles = sourceAgentFiles(ROOT);
const skillFiles = sourceSkillFiles(ROOT);
for (const e of sourceFileErrors({ agents: agentFiles, skills: skillFiles })) err(e.file, e.msg);
for (const retiredRoot of ['agents', 'skills']) {
  if (existsSync(join(ROOT, retiredRoot))) {
    err(`${retiredRoot}/`, 'retired root source tree has reappeared — agents and skills are authoritative only inside plugins/');
  }
}

for (const pack of PACK_ORDER) {
  const pluginRoot = join(ROOT, 'plugins', packPluginName(pack));
  const agentsDir = join(pluginRoot, 'agents');
  if (existsSync(agentsDir)) {
    for (const f of readdirSync(agentsDir)) {
      if (f === '.gitkeep' || f.endsWith('.agent.md')) continue;
      if (statSync(join(agentsDir, f)).isFile()) {
        err(rel(join(agentsDir, f)), 'unexpected file in agents/ (expected <name>.agent.md)');
      }
    }
  }
  const skillsDir = join(pluginRoot, 'skills');
  if (!existsSync(skillsDir)) continue;
  for (const d of readdirSync(skillsDir)) {
    const dirPath = join(skillsDir, d);
    if (!statSync(dirPath).isDirectory()) continue;
    if (!existsSync(join(dirPath, 'SKILL.md'))) {
      err(rel(dirPath), 'skill folder is missing SKILL.md');
    }
  }
}

const allFiles = [...agentFiles, ...skillFiles];
const agentIds = new Set(agentFiles.map((a) => a.id));
const skillIds = new Set(skillFiles.map((s) => s.id));

for (const f of agentFiles) {
  for (const msg of agentTaxonomyErrors(f)) err(f.rel, msg);
}

// ---------------------------------------------------------------------------
// Frontmatter + host-loader contract (shared with host-contract.mjs)
// ---------------------------------------------------------------------------
for (const f of allFiles) {
  const raw = readFileSync(f.path, 'utf8');
  const pf = parseFrontmatter(raw);
  if (!pf.ok) { err(rel(f.path), `invalid frontmatter: ${pf.reason}`); continue; }
  f.fm = pf.fm;
  for (const msg of loaderErrors(f.kind, f.id, f.fm)) err(rel(f.path), msg);
}
for (const f of agentFiles.filter((entry) => entry.fm)) {
  const body = readFileSync(f.path, 'utf8');
  for (const msg of agentIdentityContractErrors({ id: f.id, body, fm: f.fm })) err(f.rel, msg);
  for (const msg of agentPromptLimitErrors(body)) err(f.rel, msg);
}

{
  const referenceRoot = join(ROOT, 'plugins', 'kai-core', 'skills', 'kai-core-create-agent', 'references');
  const taxonomyPath = join(referenceRoot, 'taxonomy.md');
  const modelSelectionPath = join(referenceRoot, 'model-selection.md');
  if (!existsSync(taxonomyPath)) {
    err(rel(taxonomyPath), 'missing authoring taxonomy reference');
  }
  if (!existsSync(modelSelectionPath)) {
    err(rel(modelSelectionPath), 'missing approved model reference');
  }
  if (existsSync(taxonomyPath) && existsSync(modelSelectionPath)) {
    const taxonomy = readFileSync(taxonomyPath, 'utf8');
    const modelSelection = readFileSync(modelSelectionPath, 'utf8');
    for (const msg of agentAuthoringReferenceErrors({ taxonomy, modelSelection })) {
      err(rel(referenceRoot), msg);
    }
  }
}

// ---------------------------------------------------------------------------
// Discovery-metadata budget
// ---------------------------------------------------------------------------
// Every agent and skill `description:` is loaded into EVERY session — it is the
// routing surface the host uses to decide what fires, not documentation. Before
// this budget existed the shipped descriptions totalled ~13.5k tokens per
// session (agents ~7.4k, skills ~6.1k), because they had accumulated capability
// inventories, implementation notes and example lists that the bodies already
// carried.
//
// The budget is a ratchet, not a style opinion: without it the prose grows back
// one reasonable-looking sentence at a time, and nothing fails until someone
// re-measures. Skills are held tighter than agents because a skill description
// answers a narrower question — "should this load right now?" — and because
// there is no equivalent of an agent's disambiguation-from-a-neighbour clause.
//
// Raising a limit is a real decision: it is paid by every session of every user,
// so change the constant deliberately rather than to accommodate one file.
const AGENT_DESC_MAX = 250;
const SKILL_DESC_MAX = 180;

for (const f of allFiles) {
  if (!f.fm) continue;
  const desc = stripQuotes(f.fm.description || '');
  const max = f.kind === 'agent' ? AGENT_DESC_MAX : SKILL_DESC_MAX;
  if (desc.length > max) {
    err(rel(f.path), `\`description\` is ${desc.length} chars, over the ${max}-char ${f.kind} budget `
      + `by ${desc.length - max} — it loads in every session, so move detail into the body and keep `
      + 'the description to what it does plus when it fires');
  }
}

// ---------------------------------------------------------------------------
// Cross-reference integrity
// ---------------------------------------------------------------------------

// Prose kai ships to readers. Splitting the README into docs/ moved the most
// reference-dense content (the agent catalog, the flow walkthroughs, the
// workspace contract) out of the one file these checks used to cover, so the
// whole docs/ tree is scanned too — otherwise an extracted page could name a
// deleted agent, or write `library/` without its `kai/` parent, and no test
// would notice. CHANGELOG.md is deliberately excluded: historical entries
// legitimately describe retired layouts and removed agents.
const publicDocFiles = () => {
  const out = [];
  const walk = (dir) => {
    if (!existsSync(dir)) return;
    for (const e of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (e.name.endsWith('.md')) out.push(p);
    }
  };
  walk(join(ROOT, 'docs'));
  return out;
};

const refScanFiles = [
  ...allFiles.map((f) => f.path),
  ...skillFiles.flatMap((skill) => skillCompanionFiles(ROOT, skill.id).map((entry) => entry.path)),
  join(ROOT, 'AGENTS.md'),
  join(ROOT, 'README.md'),
  ...publicDocFiles(),
].filter(existsSync);

// Backtick tokens matching either a supported kind prefix or the complete new
// provider-posture-scope prefix are agent references. Requiring the posture
// segment keeps generic domain terms such as `core-workspace` out of this scan.
const AGENT_REF = agentRefPattern();
// A kai identifier is kebab-case with at least one hyphen (skill/agent shape).
const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)+$/;

for (const p of refScanFiles) {
  const raw = readFileSync(p, 'utf8');
  const r = rel(p);

  for (const m of raw.matchAll(AGENT_REF)) {
    if (!agentIds.has(m[1])) err(r, `references unknown agent \`${m[1]}\``);
  }

  // A backticked kai-identifier that follows the verb "inherit(s)" on a line
  // must resolve to a real skill or agent (catches renamed/removed contracts).
  // Only tokens after the verb are checked, so lifecycle states like
  // `in-review` that merely share the line are not misread as references.
  for (const line of raw.split(/\r?\n/)) {
    if (/^\*\*Inherits:\*\*/.test(line)) continue;
    const verb = line.match(/inherits?\b/i);
    if (!verb) continue;
    const after = verb.index + verb[0].length;
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      if (m.index < after) continue;
      const tok = m[1];
      if (!KEBAB.test(tok)) continue;
      if (!skillIds.has(tok) && !agentIds.has(tok)) {
        err(r, `"inherit" line references unknown skill/agent \`${tok}\``);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Skill declarations
//
// A plugin's own root AGENTS.md is never loaded as custom instructions in a
// consumer workspace, so shared rules only reach a session through a skill the
// agent names. kai-agent-v1 uses scoped dispatch entries; legacy agents use the
// `**Inherits:**` line and the checks below preserve that migration baseline.
// ---------------------------------------------------------------------------
const BASELINE_SKILL = 'kai-core-team-operating-rules';
const ASSET_LIFECYCLE_SKILL = 'kai-core-asset-lifecycle';

// Agents that do bounded, delegated work must declare that they are running.
//
// This became load-bearing rather than nice-to-have: the host emits no subagent
// lifecycle events for plugin-provided agents, so `.kai/activity.jsonl` is the
// ONLY evidence that a kai persona ran at all. An agent in a coordinating
// family that does not route `kai-core-work-activity` is invisible in both
// tiers, and the fleet view renders it as though it never existed.
//
// The rule is an opt-OUT, deliberately. A new agent routes the obligation by
// default; forgetting to exempt one costs a line of bookkeeping, while
// forgetting to opt one in costs an agent that cannot be seen.
const ACTIVITY_SKILL = 'kai-core-work-activity';
const CONTRACT_HEADING = /^## (?:Contracts you inherit|Inherited contracts)[^\n]*\n/gm;
const blockPath = join(ROOT, 'scripts/lib/inherits-block.txt');
const inheritsBlock = existsSync(blockPath)
  ? readFileSync(blockPath, 'utf8').replace(/\r\n/g, '\n').trimEnd()
  : null;
if (!inheritsBlock) err('scripts/lib/inherits-block.txt', 'missing (canonical inherited-contract directive)');

// ---------------------------------------------------------------------------
// Communication-style block
//
// This block is the one thing kai ships that binds the MAIN CLI agent rather
// than a kai agent: the host loads AGENTS.md from the user's repo, so a
// consumer opts into it at onboarding. kai carries the same block in its own
// AGENTS.md — a style shipped to users and not used here would be a
// recommendation nobody tested. One canonical file, pinned byte for byte, is
// what stops the shipped copy and the dogfooded copy from drifting.
// ---------------------------------------------------------------------------
const stylePath = join(ROOT, 'scripts/lib/communication-style-block.md');
const styleBlock = existsSync(stylePath)
  ? readFileSync(stylePath, 'utf8').replace(/\r\n/g, '\n').trim()
  : null;
if (!styleBlock) {
  err('scripts/lib/communication-style-block.md', 'missing (canonical communication-style block)');
} else {
  const OPEN = '<!-- >>> kai communication style (managed by workflow-workspace-init) >>> -->';
  const CLOSE = '<!-- <<< kai communication style <<< -->';
  if (!styleBlock.startsWith(OPEN) || !styleBlock.endsWith(CLOSE)) {
    err('scripts/lib/communication-style-block.md', 'must open and close with the exact managed-block markers, or onboarding cannot update or remove its own block without touching user text');
  }
  const ownAgents = join(ROOT, 'AGENTS.md');
  const ownRaw = existsSync(ownAgents) ? readFileSync(ownAgents, 'utf8').replace(/\r\n/g, '\n') : '';
  if (!ownRaw.includes(styleBlock)) {
    err('AGENTS.md', 'missing the verbatim communication-style block from scripts/lib/communication-style-block.md (kai must use the style it ships)');
  }
  // Onboarding is what installs the block in a consumer workspace; if it stops
  // naming the canonical file, the block ships to nobody.
  const onboarding = skillSourceFile(ROOT, 'kai-core-workspace-onboarding');
  if (onboarding && existsSync(onboarding)) {
    const ob = readFileSync(onboarding, 'utf8');
    if (!ob.includes('scripts/lib/communication-style-block.md')) {
      err(rel(onboarding), 'does not reference scripts/lib/communication-style-block.md, so the opt-in style block would never reach a consumer workspace');
    }
  }
}

for (const agent of agentFiles) {
  const raw = readFileSync(agent.path, 'utf8').replace(/\r\n/g, '\n');
  const r = rel(agent.path);
  const all = raw.split('\n');
  const lines = all.filter((l) => /^\*\*Inherits:\*\*/.test(l));
  const progressive = raw.includes('**Identity contract:** `kai-agent-v1`');

  if (progressive) {
    for (const msg of progressiveSkillRoutingErrors({
      id: agent.id,
      body: raw,
      tools: parseToolList(agent.fm?.tools) || [],
      knownSkills: skillIds,
      activityExempt: ACTIVITY_EXEMPT.has(agent.id),
    })) err(r, msg);
    continue;
  }

  if (lines.length === 0) {
    err(r, 'missing a `**Inherits:** ...` line declaring its inherited skills');
    continue;
  }
  if (lines.length > 1) {
    err(r, `has ${lines.length} \`**Inherits:**\` lines; exactly one is allowed`);
    continue;
  }

  // The declaration must be the first body line so it is read before anything
  // else, not buried where a model may never reach it.
  const fm = raw.match(/^---\n[\s\S]*?\n---\n\n/);
  const body = fm ? raw.slice(fm[0].length) : raw;
  if (!/^\*\*Inherits:\*\*/.test(body)) {
    err(r, '`**Inherits:**` must be the first line of the body, directly under the frontmatter');
  }

  // A skill named in the profile is inert unless the agent is told to load it,
  // so the declaration carries a verbatim, CI-pinned directive.
  if (inheritsBlock && !body.replace(/\r\n/g, '\n').includes(inheritsBlock)) {
    err(r, 'missing the verbatim inherited-contract directive from scripts/lib/inherits-block.txt');
  }

  const declared = [...lines[0].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
  if (declared.length === 0) {
    err(r, '`**Inherits:**` line lists no backticked skills');
    continue;
  }
  const tools = new Set(parseToolList(agent.fm?.tools) || []);
  if (!tools.has('skill')) {
    err(r, 'inherits skills but its `tools` list omits `skill` — delegated agents cannot load inherited contracts');
  }

  const seen = new Set();
  for (const tok of declared) {
    if (!skillIds.has(tok)) err(r, `inherits unknown skill \`${tok}\``);
    if (seen.has(tok)) err(r, `inherits \`${tok}\` more than once`);
    seen.add(tok);
  }

  if (!seen.has(BASELINE_SKILL)) {
    err(r, `must inherit \`${BASELINE_SKILL}\` (the shared operating contract)`);
  }
  if (!seen.has(ASSET_LIFECYCLE_SKILL)) {
    err(r, `must inherit \`${ASSET_LIFECYCLE_SKILL}\` (every run must classify generated assets or explicitly declare none)`);
  }
  if (requiresCoordinatedRunContracts(agent.id) && !seen.has('kai-core-workspace-conventions')) {
    err(r, 'durable and coordinating roles must inherit `kai-core-workspace-conventions`');
  }
  if (requiresCoordinatedRunContracts(agent.id)
    && !seen.has(ACTIVITY_SKILL)
    && !ACTIVITY_EXEMPT.has(agent.id)) {
    err(r, `durable and coordinating roles must inherit \`${ACTIVITY_SKILL}\`, or be listed in ACTIVITY_EXEMPT with a reason `
      + '(the host observes no plugin agent, so this log is the only evidence the role ran)');
  }
  if (ACTIVITY_EXEMPT.has(agent.id) && seen.has(ACTIVITY_SKILL)) {
    // Otherwise the exemption list rots into a lie about the fleet.
    err(r, `is listed in ACTIVITY_EXEMPT but inherits \`${ACTIVITY_SKILL}\`; remove the exemption`);
  }

  // A structured "Contracts you inherit" section is the profile's own claim
  // about what binds it; the declaration must cover all of it.
  for (const h of raw.matchAll(CONTRACT_HEADING)) {
    const start = h.index + h[0].length;
    const next = raw.indexOf('\n## ', start);
    const section = raw.slice(start, next === -1 ? raw.length : next);
    for (const t of section.matchAll(/`([^`]+)`/g)) {
      if (skillIds.has(t[1]) && !seen.has(t[1])) {
        err(r, `"Contracts you inherit" names \`${t[1]}\` but the \`**Inherits:**\` line omits it`);
      }
    }
  }

  // Freeform prose that claims an inherited contract must match too.
  for (const line of all) {
    if (/^\*\*Inherits:\*\*/.test(line)) continue;
    const verb = line.match(/\binherits?\b/i);
    if (!verb) continue;
    const after = verb.index + verb[0].length;
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      if (m.index < after) continue;
      const tok = m[1];
      if (!skillIds.has(tok) || seen.has(tok)) continue;
      err(r, `prose says it inherits \`${tok}\` but the \`**Inherits:**\` line omits it`);
    }
  }
}

// ---------------------------------------------------------------------------
// Guarantee blocks (generated department agents)
//
// Legacy department agents retain the fail-closed probe and degraded-mode
// refusal in their own bodies until migration. kai-agent-v1 agents check core
// just in time before using a core skill and carry neither block. Core agents
// are also excluded because they ship inside kai-core itself.
// ---------------------------------------------------------------------------

const preflightPath = join(ROOT, PREFLIGHT_BLOCK_REL);
const preflight = existsSync(preflightPath) ? canonicalPreflightBlock(ROOT) : null;
const degradedPath = join(ROOT, DEGRADED_BLOCK_REL);
const degraded = existsSync(degradedPath) ? canonicalDegradedBlock(ROOT) : null;

// What the authoritative generator emits, materialised once: the block pins below
// and the cross-pack reference checks further down both resolve against the tree a
// user would install, not against a plan that only adds up on paper. Generation
// needs both canonical blocks, so when either is missing this stands down behind
// the error reported for it instead of crashing the whole run.
const generatedPacks = preflight && degraded
  ? materializePacks({ root: ROOT, version: '0.0.0-validate' })
  : new Map();

for (const e of generatedKeyErrors(generatedPacks)) err(e.file, e.msg);
for (const e of generatedPackageErrors(generatedPacks, { root: ROOT })) err(e.file, e.msg);
for (const e of generatedRuntimeErrors(generatedPacks)) err(e.file, e.msg);

// The contract version, pinned wherever it is stated: the probe skill's name,
// the canonical legacy block's prose, and the probe body. A missing block is
// reported here too because unmigrated agents still depend on these pins.
{
  const probePath = skillSourceFile(ROOT, CONTRACT_SKILL);
  for (const e of contractPinErrors({
    block: preflight,
    probe: probePath && existsSync(probePath) ? readFileSync(probePath, 'utf8') : null,
  })) err(e.file, e.msg);
}

// The refusal restates no operating rule — that is the whole reason it cannot
// drift from core, so it is checked rather than trusted.
if (!degraded) {
  err(DEGRADED_BLOCK_REL, 'missing (canonical degraded-mode refusal block)');
} else {
  for (const msg of degradedBlockErrors({
    block: degraded,
    refusalToken: REFUSAL,
    ids: new Set([...skillIds, ...agentIds]),
    contractLines: coreContractLines(ROOT),
  })) err(DEGRADED_BLOCK_REL, msg);
}

// The pin that decides it: what the authoritative generator actually emits. The
// map is empty when either canonical block is missing, so this reports the copy
// state only when there is a copy to judge. Which files count as generated agent
// bodies is derived from the partition (parseGeneratedKey), never matched with a
// name pattern a future pack key could fall outside.
for (const e of guaranteeBlockErrors({
  files: generatedPacks, preflight, degraded, inheritsBlock,
})) err(e.file, e.msg);

if (generatedPacks.size && !generatedPacks.has(`kai-core/skills/${CONTRACT_SKILL}/SKILL.md`)) {
  err('scripts/lib/pack-plan.mjs', `does not place \`${CONTRACT_SKILL}\` in kai-core — the probe must ship with the pack whose presence it proves`);
}

// ---------------------------------------------------------------------------
// Skill firing paths
//
// A skill reaches a session in exactly one of three ways, and a skill with none
// of them is dead on arrival while still passing every other check and
// appearing in the catalog:
//
//   1. inherited    — named on some agent's `**Inherits:**` line;
//   2. user-invoked — `user-invocable: true` in its own frontmatter, so the
//                     operator can run it directly;
//   3. orchestrated — declared as a dispatch entry in an agent's prose, in the
//                     list shape `- **`skill-id`** — when it applies`, which
//                     dispatches it situationally (the `workflow-doc-review`
//                     lenses).
//
// All three are legitimate designs, so this asserts only that at least one
// exists. The orchestrated form is matched by that specific declaration shape
// rather than by any backticked mention, so an incidental reference — a
// cross-link, or a "do not use `x`" sentence — cannot pass a skill off as
// reachable. It exists because the absence of this check produced a filed issue
// claiming user-invocable skills "never fire".
// ---------------------------------------------------------------------------
{
  const inherited = new Set();
  const dispatched = new Set();
  for (const agent of agentFiles) {
    const raw = readFileSync(agent.path, 'utf8');
    for (const skill of declaredInherits(raw)) inherited.add(skill);
    for (const token of dispatchedRefs(raw)) dispatched.add(token);
  }
  for (const skill of skillFiles) {
    const id = skill.id;
    if (inherited.has(id) || dispatched.has(id)) continue;
    // The version-pinned probe fires from the legacy canonical preflight and
    // from kai-agent-v1 dispatch entries. This exception preserves old
    // monolith validation, where generated department bodies are absent.
    if (preflight && id === CONTRACT_SKILL && preflight.includes(id)) continue;
    const raw = readFileSync(skill.path, 'utf8');
    if (/^user-invocable:\s*true\s*$/m.test(raw)) continue;
    err(rel(skill.path), 'has no firing path: no agent inherits or dispatches it, and it is not `user-invocable: true` — it can never reach a session');
  }
}

// ---------------------------------------------------------------------------
// The partition (who ships what)
//
// Everything downstream — the generated trees, the cross-pack resolution below,
// the marketplace listing — is derived from one partition in
// scripts/lib/pack-plan.mjs. If that partition is wrong, every derived check is
// answering the wrong question consistently. All three failures here are silent
// in a host: an agent in no pack ships nowhere, an agent or skill in two packs
// has ambiguous provider ownership, and a core-provided skill without the
// `kai-core-*` prefix collides with the legacy monolith.
// ---------------------------------------------------------------------------
const PARTITION_SOURCE = 'scripts/lib/pack-plan.mjs';
{
  const plan = planPacks(ROOT);
  for (const e of sourcePlacementErrors({ agents: agentFiles, skills: skillFiles, plan })) {
    err(e.file, e.msg);
  }
  for (const msg of partitionErrors({
    plan, agents: [...agentIds], skills: [...skillIds],
  })) err(PARTITION_SOURCE, msg);

  for (const msg of namespaceErrors({ core: plan.core, local: plan.local })) {
    err(PARTITION_SOURCE, msg);
  }

  if (generatedPacks.size) {
    for (const msg of providerCollisionErrors({ providers: packProviders(generatedPacks) })) {
      err(PARTITION_SOURCE, msg);
    }
  }

  // Role availability, at the one place it is decided. A director that recalls
  // a roster instead of reading it, or counts it instead of testing membership,
  // is wrong in whichever direction its guess fell — and says nothing either way.
  for (const id of DISPATCHING_ROLES) {
    const path = agentSourceFile(ROOT, id);
    if (!path || !existsSync(path)) {
      err(`agent:${id}`, 'missing (a lease-granting role the availability contract pins)');
      continue;
    }
    for (const msg of availabilityErrors({ body: readFileSync(path, 'utf8') })) {
      err(rel(path), msg);
    }
  }
}

// ---------------------------------------------------------------------------
// Cross-pack references (the plugin boundary)
//
// The check above proves a skill can fire at all. This one proves it can still
// fire once the plugin is five plugins: a department pack installs with kai-core
// and nothing else, so an inherited skill, a user-invoked entry point, an
// orchestrated dispatch or an invoked script that lives in a third pack is a
// break the monolith can never show — every reference resolves here today
// because everything ships in one directory.
//
// References resolve against what the generator emits, so a provider the
// generator would not copy is a miss now rather than a support ticket later. The
// parsers, the partition and the resolution rules are the ones in
// scripts/lib/pack-plan.mjs that the generator itself uses; nothing is re-parsed
// with a second regex here.
// ---------------------------------------------------------------------------
const packRefs = collectReferences(ROOT);
const packAssets = planAssets(packRefs);
{
  // With no generated tree there is nothing to resolve against; that case is
  // already reported above, so this stands down rather than blaming every
  // reference in the repository for one missing file.
  if (generatedPacks.size) {
    for (const e of referenceErrors({ refs: packRefs, providers: packProviders(generatedPacks) })) {
      err(e.file, e.msg);
    }
  }
  const exists = (asset) => existsSync(join(ROOT, ...asset.split('/')));
  for (const e of assetOwnershipErrors({ assets: packAssets, exists })) err(e.file, e.msg);
}

// ---------------------------------------------------------------------------
// Assessor roster and the kai-core-no-self-remediation contract
//
// The taxonomy leans on roles that judge without acting on what they judge. An
// assessor that quietly fixes what it found destroys the independence that made
// the assessment worth having, and does it invisibly: the finding is never
// reported because it no longer reproduces.
//
// That constraint is directional (write your evidence, not the target under
// review) and a `tools` grant is a capability, so it cannot be expressed in
// frontmatter — one `edit` grant covers both sides of the line. Pinning the
// roster here is what stops the contract from silently falling off a role
// during an unrelated edit, which is the failure a prose-only rule invites.
// ---------------------------------------------------------------------------
const ASSESSOR_CONTRACT = 'kai-core-no-self-remediation';
const ASSESSOR_ROLES = [
  'principal-security',
  'principal-privacy-compliance',
  'principal-qa-ui',
  'principal-seo',
  'persona-ux-first-time-user',
  'persona-professional-nutritionist',
  'persona-professional-trainer',
  'workflow-doc-review',
  'workflow-experiment-review',
  'workflow-issue-analysis',
  'workflow-self-check',
];
{
  if (!skillIds.has(ASSESSOR_CONTRACT)) {
    err(`skill:${ASSESSOR_CONTRACT}`, 'missing (the assessor write contract the roster depends on)');
  }
  for (const id of ASSESSOR_ROLES) {
    const agent = agentFiles.find((a) => a.id === id);
    if (!agent) {
      err('scripts/validate-plugin.mjs', `assessor roster names \`${id}\`, which is not an agent — update the roster or restore the agent`);
      continue;
    }
    const raw = readFileSync(agent.path, 'utf8').replace(/\r\n/g, '\n');
    const line = (raw.match(/^\*\*Inherits:\*\*.*$/m) || [''])[0];
    if (!line.includes(`\`${ASSESSOR_CONTRACT}\``)) {
      err(rel(agent.path), `is on the assessor roster but does not inherit \`${ASSESSOR_CONTRACT}\``);
    }
  }
}

// ---------------------------------------------------------------------------
// Inherited-skill tool requirements
//
// A skill whose procedure is mandatory can require a capability the agent must
// actually hold: `kai-core-work-activity` tells an agent to run `scripts/activity.mjs`,
// which is impossible without `execute`. Nothing otherwise connects the two, so a
// well-meant tool removal ("assessors should not hold shell") can silently
// break a contract the same agent is required to follow.
//
// This is deliberately opt-in via `requires_tools:` rather than derived from a
// skill's own `tools:` line. A skill's `tools` is what that skill may use when
// loaded; treating it as a requirement would force `edit` back onto
// `workflow-issue-analysis`, whose whole design is that it cannot write.
//
// Parsing goes through the canonical frontmatter parser rather than a regex over
// the raw file: a second parser drifts from the first, and here it would drift
// toward a false negative -- a requirement silently unenforced, which is exactly
// the defect class this check exists to catch. Block-form YAML and trailing
// comments therefore fail loudly instead of parsing as "no requirement".
// ---------------------------------------------------------------------------
{
  const requires = new Map();
  for (const skill of skillFiles) {
    const parsed = parseFrontmatter(readFileSync(skill.path, 'utf8'));
    if (!parsed.ok) continue; // already reported by the loader-contract check
    const raw = parsed.fm.requires_tools;
    if (raw === undefined) continue;
    const list = parseToolList(raw);
    if (!list) {
      err(rel(skill.path), 'frontmatter `requires_tools` must be an inline array like [a, b]');
      continue;
    }
    if (list.length === 0) {
      err(rel(skill.path), '`requires_tools:` is empty — remove it or name the tools the skill cannot work without');
      continue;
    }
    // A typo here would blame every inheriting agent for omitting a tool that
    // does not exist, so it is caught at the declaration instead.
    for (const tool of list) {
      if (!SUPPORTED_TOOLS.has(tool)) {
        err(rel(skill.path), `\`requires_tools\` names unsupported tool "${tool}" (not in the host allowlist)`);
      }
    }
    requires.set(skill.id, list);
  }
  for (const agent of agentFiles) {
    const raw = readFileSync(agent.path, 'utf8').replace(/\r\n/g, '\n');
    const parsed = parseFrontmatter(raw);
    const held = new Set(parsed.ok ? parseToolList(parsed.fm.tools) || [] : []);
    const line = (raw.match(/^\*\*Inherits:\*\*.*$/m) || [''])[0];
    for (const m of line.matchAll(/`([^`]+)`/g)) {
      const need = requires.get(m[1]);
      if (!need) continue;
      for (const tool of need) {
        if (!held.has(tool)) {
          err(rel(agent.path), `inherits \`${m[1]}\`, which requires the \`${tool}\` tool, but its \`tools\` list omits it`);
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Plugin manifests (retired-root release metadata + installable plugins)
//
// Root plugin.json remains temporarily as the lockstep version authority, but
// the retired monolith is no longer installable and therefore has no agent or
// skill directories. Only plugin-local manifests are checked as host surfaces.
// ---------------------------------------------------------------------------
const MARKETPLACE_REL = '.github/plugin/marketplace.json';
const MARKETPLACE_NAME = 'kai-plugins';
const MONOLITH_NAME = 'kai';

const manifests = discoverManifests(ROOT);
const parsedManifests = [];
for (const m of manifests) {
  let pj;
  try { pj = JSON.parse(readFileSync(m.path, 'utf8')); }
  catch (e) { err(m.rel, `invalid JSON: ${e.message}`); continue; }
  // Installable plugin paths must resolve relative to their own manifest.
  if (!m.isRoot) {
    for (const key of ['agents', 'skills']) {
      if (!pj[key]) err(m.rel, `missing "${key}" path`);
      else if (!existsSync(join(m.dir, pj[key]))) err(m.rel, `"${key}" path "${pj[key]}" does not exist`);
    }
  }
  if (!pj.version) err(m.rel, 'missing "version"');
  parsedManifests.push({ rel: m.rel, dir: m.dir, isRoot: m.isRoot, name: pj.name, version: pj.version, description: pj.description });
}

const rootManifest = parsedManifests.find((m) => m.isRoot) ?? null;
const canonicalVersion = rootManifest?.version ?? null;
if (!rootManifest) err('plugin.json', 'missing');

// The monolith plugin.json and package.json must carry the same version — a
// release bumps both together (see AGENTS.md -> "Releasing this plugin").
if (rootManifest) {
  const pkgPath = join(ROOT, 'package.json');
  if (existsSync(pkgPath)) {
    let pkg;
    try { pkg = JSON.parse(readFileSync(pkgPath, 'utf8')); }
    catch (e) { err('package.json', `invalid JSON: ${e.message}`); }
    if (pkg) {
      if (!pkg.version) err('package.json', 'missing "version"');
      if (rootManifest.version && pkg.version && rootManifest.version !== pkg.version) {
        err('plugin.json', `version "${rootManifest.version}" must equal package.json version "${pkg.version}" (bump both together on release)`);
      }
    }
  }
}

// Per-manifest version agreement: every committed pack ships in lockstep with the
// monolith, so a pack whose version drifts is a release-hygiene failure.
for (const e of manifestParityErrors(parsedManifests.filter((m) => !m.isRoot), canonicalVersion)) {
  err(e.rel, e.msg);
}

// The marketplace index is how kai is installed once the host removes direct
// installs, and it carries its own copy of each plugin's version, name and
// description. A stale entry does not fail an install -- it succeeds and reports
// the wrong version, which is worse than a broken one. The name is checked against
// a constant because the host uses it as the registration key with no override, so
// renaming it silently invalidates `kai@kai-plugins` everywhere. Which plugin names
// the index must and must not carry is derived from the pack partition, so a pack
// published later is covered without editing this call.
const mktPath = join(ROOT, MARKETPLACE_REL);
if (!existsSync(mktPath)) {
  err(MARKETPLACE_REL, 'missing — kai publishes itself as a marketplace so it can be installed without a deprecated direct install');
} else {
  let mkt;
  try { mkt = JSON.parse(readFileSync(mktPath, 'utf8')); }
  catch (e) { err(MARKETPLACE_REL, `invalid JSON: ${e.message}`); }
  if (mkt) {
    const manifestsByName = {};
    const manifestsBySource = {};
    for (const m of parsedManifests) if (m.name) manifestsByName[m.name] = { version: m.version, description: m.description };
    for (const m of parsedManifests) {
      const source = m.isRoot ? '.' : m.rel.replace(/\/plugin\.json$/, '');
      manifestsBySource[source] = { name: m.name };
    }
    const surface = marketplaceSurfacePolicy({
      mkt,
      canonicalVersion,
      monolithName: MONOLITH_NAME,
    });
    for (const msg of surface.errors) err(MARKETPLACE_REL, msg);
    for (const msg of marketplaceConsistencyErrors({
      mkt,
      marketName: MARKETPLACE_NAME,
      monolithName: MONOLITH_NAME,
      canonicalVersion,
      manifestsByName,
      manifestsBySource,
      requiredPluginNames: surface.requiredPluginNames,
      forbiddenPluginNames: surface.forbiddenPluginNames,
    })) {
      err(MARKETPLACE_REL, msg);
    }
    // The one FS check the pure helper leaves to the caller: a listed source that
    // does not resolve to a plugin.json passes the host's schema but fails at
    // install time, on the user's machine.
    for (const entry of Array.isArray(mkt.plugins) ? mkt.plugins : []) {
      if (typeof entry?.source === 'string' && entry.source.trim()) {
        const relSrc = entry.source.replace(/^\.\/?/, '');
        const target = resolve(ROOT, relSrc);
        const targetFromRoot = relative(ROOT, target);
        if (targetFromRoot.startsWith('..') || isAbsolute(targetFromRoot)) {
          err(MARKETPLACE_REL, `entry "${entry.name}" source "${entry.source}" escapes the repository root`);
          continue;
        }
        const sourceManifestPath = join(target, 'plugin.json');
        if (!existsSync(sourceManifestPath)) {
          err(MARKETPLACE_REL, `entry "${entry.name}" source "${entry.source}" does not contain a plugin.json — the install would fail on the user's machine, not here`);
          continue;
        }
        try {
          const sourceManifest = JSON.parse(readFileSync(sourceManifestPath, 'utf8'));
          if (sourceManifest.name !== entry.name) {
            err(MARKETPLACE_REL, `entry "${entry.name}" source "${entry.source}" contains plugin `
              + `"${sourceManifest.name ?? 'unnamed'}" — marketplace names must match their source manifest`);
          }
        } catch (e) {
          err(MARKETPLACE_REL, `entry "${entry.name}" source "${entry.source}" has invalid plugin.json: ${e.message}`);
        }
      } else if (entry?.name) {
        err(MARKETPLACE_REL, `entry "${entry.name}" source must be a non-empty repository-relative string`);
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Host-tool allowlist is enforced per entry by `loaderErrors` (shared contract).
// Adding a genuinely new host tool is a deliberate edit to SUPPORTED_TOOLS in
// scripts/lib/loader-contract.mjs.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Contract consistency — the workspace contract is described in several files
// that must not drift apart. Structural checks stay green when, say, a new run
// area is added to the manifest but forgotten in a scaffold; these catch it.
// ---------------------------------------------------------------------------
const readIf = (p) => (existsSync(p) ? readFileSync(p, 'utf8') : null);
const conventionsPath = skillSourceFile(ROOT, 'kai-core-workspace-conventions');
const onboardingPath = skillSourceFile(ROOT, 'kai-core-workspace-onboarding');
const wsInitPath = agentSourceFile(ROOT, 'workflow-workspace-init');
const initiativeInitPath = agentSourceFile(ROOT, 'workflow-initiative-init');
const conventions = conventionsPath ? readIf(conventionsPath) : null;
const onboarding = onboardingPath ? readIf(onboardingPath) : null;
const wsInit = wsInitPath ? readIf(wsInitPath) : null;
const initiativeInit = initiativeInitPath ? readIf(initiativeInitPath) : null;
const conventionsRel = conventionsPath ? rel(conventionsPath) : 'skill:kai-core-workspace-conventions';
const onboardingRel = onboardingPath ? rel(onboardingPath) : 'skill:kai-core-workspace-onboarding';
const wsInitRel = wsInitPath ? rel(wsInitPath) : 'agent:workflow-workspace-init';
const initiativeInitRel = initiativeInitPath ? rel(initiativeInitPath) : 'agent:workflow-initiative-init';
const gitignore = readIf(join(ROOT, '.gitignore'));

const toSet = (arr) => new Set(arr);
const setEq = (a, b) => a && b && a.size === b.size && [...a].every((x) => b.has(x));
const dirTokens = (s) => toSet([...s.matchAll(/([a-z][a-z0-9-]*)\//g)].map((m) => m[1]).filter((d) => d !== 'library' && d !== 'runs'));

// The split installer is prose executed by an agent, so pin the load-bearing
// order and failure semantics here instead of treating documentation presence
// as behavioral coverage.
const guidedInstallCommands = PACK_ORDER.map(
  (pack) => `copilot plugin install ${packPluginName(pack)}@${MARKETPLACE}`,
);
const guidedCorePlugin = packPluginName('core');
if (onboarding) {
  const onboardingProse = onboarding.replace(/\s+/g, ' ');
  let previousCommandIndex = -1;
  for (const command of guidedInstallCommands) {
    const commandIndex = onboarding.indexOf(command);
    if (commandIndex === -1) {
      err(onboardingRel, `guided installer is missing exact command \`${command}\``);
      continue;
    }
    if (commandIndex <= previousCommandIndex) {
      err(onboardingRel, `guided installer command \`${command}\` is out of canonical core-first order`);
    }
    previousCommandIndex = commandIndex;
  }
  const marketplaceBrowse = `copilot plugin marketplace browse ${MARKETPLACE}`;
  const browseIndex = onboarding.indexOf(marketplaceBrowse);
  const firstInstallIndex = onboarding.indexOf(guidedInstallCommands[0]);
  if (browseIndex === -1 || firstInstallIndex === -1 || browseIndex >= firstInstallIndex) {
    err(onboardingRel, 'guided installer must browse the marketplace before the first plugin install command');
  }
  for (const requiredText of [
    marketplaceBrowse,
    'get explicit confirmation',
    'stop on the first failed or unverified step',
    'Rollback: not attempted or verified',
    'start a fresh session before invoking pack agents',
    'Never substitute a direct repository or subdirectory install as a fallback',
    'Pack install: complete | partial | blocked | unknown',
    'Not attempted:',
    'Legacy kai:',
    'never reuse a path into a plugin uninstalled or updated during this run',
    'End the current run; a session still carrying the removed monolith must not continue the migration',
    'at the exact version reported by the browse step',
    'use its `plugins` inventory for enabled state and provenance',
    `open \`/plugin\` in an interactive Copilot session, enable \`${guidedCorePlugin}@${MARKETPLACE}\``,
    `open \`/plugin\`, enable \`<name>@${MARKETPLACE}\``,
    'Do not name the unavailable',
    '`copilot plugins enable` command',
    `${guidedCorePlugin}\` and every requested department are listed at one common version`,
    'partial` when at least one plugin install or update succeeded in this run',
    'unknown` when required host, marketplace, plugin-list, version, or workspace evidence is unreadable',
    'blocked` for every other known pre-mutation refusal or failed command',
    'perform the update from a session that does not have the pack loaded',
  ]) {
    if (!onboardingProse.includes(requiredText)) {
      err(onboardingRel, `guided installer is missing required contract text: ${JSON.stringify(requiredText)}`);
    }
  }
}
if (wsInit) {
  const workspaceInitProse = wsInit.replace(/\s+/g, ' ');
  for (const requiredText of [
    'Pack installation',
    'kai-core-workspace-onboarding',
    'Never install a department before an enabled, versioned `kai-core` row',
    'Rollback: not attempted or verified',
    'requires a fresh session only when the run actually installed or updated a pack',
  ]) {
    if (!workspaceInitProse.includes(requiredText)) {
      err(wsInitRel, `does not bind the guided installer contract: ${JSON.stringify(requiredText)}`);
    }
  }
}

// 1. The source repository dogfoods external mode, while onboarding documents
//    mode-specific managed blocks. Both must keep recognizable markers.
function managedBlock(text) {
  if (!text) return null;
  const start = text.indexOf('# >>> kai workspace');
  const endMarker = text.indexOf('# <<< kai workspace');
  if (start === -1 || endMarker === -1) return null;
  const endLine = text.indexOf('\n', endMarker);
  const block = text.slice(start, endLine === -1 ? text.length : endLine);
  return block.split(/\r?\n/).map((l) => l.replace(/\s+$/, '')).join('\n');
}
const giBlock = managedBlock(gitignore);
const obBlock = managedBlock(onboarding);
if (giBlock === null) err('.gitignore', 'missing the managed "# >>> kai workspace" block');
if (obBlock === null) err(onboardingRel, 'missing the managed gitignore block template');
if (giBlock && !giBlock.includes('/.kai/')) {
  err('.gitignore', 'external-mode dogfood block must ignore the repository-root .kai directory');
}

// 2. The .kai/runs areas must match the documented manifest and fixture.
const mAreasM = conventions && conventions.match(/"areas":\s*\[([^\]]*)\]/);
const mAreas = mAreasM ? toSet(mAreasM[1].split(',').map((x) => stripQuotes(x)).filter(Boolean)) : null;
if (!mAreas) err(conventionsRel, 'could not locate the manifest "areas" list');

// 2b. Every concrete `.kai/runs/<area>/` literal in a shipped agent or skill must
//     resolve to a registered run area. Placeholder segments like
//     `.kai/runs/<area>/` never match — the capture requires a lowercase letter,
//     not `<` — so only real, hard-coded area names are checked. The trailing
//     lookahead accepts a path separator or any word boundary (backtick, quote,
//     whitespace, punctuation, end), so `.kai/runs/self-check` without a trailing
//     slash is still caught. This flags an agent inventing an unregistered area.
if (mAreas) {
  const AREA_LITERAL = /\.kai[/\\]runs[/\\]([a-z][a-z0-9-]+)(?=[/\\`'"\s.,;:)\]]|$)/g;
  for (const f of allFiles) {
    const raw = readFileSync(f.path, 'utf8');
    const seen = new Set();
    for (const m of raw.matchAll(AREA_LITERAL)) {
      if (mAreas.has(m[1]) || seen.has(m[1])) continue;
      seen.add(m[1]);
      err(rel(f.path), `references unregistered run area \`.kai/runs/${m[1]}/\` (add it to the manifest areas list or use a registered area)`);
    }
  }
}

// 2c. Schema 3 removes the visible kai/ corpus. Shipped prompts, docs, and
//     examples may name schema-2 paths only inside an explicit migration region.
const RETIRED_CORPUS = /(^|[^.])kai[/\\](coordination|initiatives|library|personal)(?=[/\\`'"\s.,;:)\]]|$)/g;
const LEGACY_OPEN = /<!--\s*kai:allow-legacy-roots\s*-->/;
const LEGACY_CLOSE = /<!--\s*\/kai:allow-legacy-roots\s*-->/;
const corpusScanFiles = [...allFiles.map((f) => f.path), ...publicDocFiles()];
for (const extra of ['AGENTS.md', 'README.md']) {
  const p = join(ROOT, extra);
  if (existsSync(p)) corpusScanFiles.push(p);
}
const examplesDir = join(ROOT, 'examples');
if (existsSync(examplesDir)) {
  const walk = (dir) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const p = join(dir, e.name);
      if (e.isDirectory()) walk(p);
      else if (/\.(md|ya?ml|json|sh|ps1|mjs|js)$/i.test(e.name)) corpusScanFiles.push(p);
    }
  };
  walk(examplesDir);
}
for (const path of corpusScanFiles) {
  const lines = readFileSync(path, 'utf8').split(/\r?\n/);
  const seen = new Set();
  let exempt = false;
  lines.forEach((line, i) => {
    if (LEGACY_OPEN.test(line)) { exempt = true; return; }
    if (LEGACY_CLOSE.test(line)) { exempt = false; return; }
    if (exempt) return;
    for (const m of line.matchAll(RETIRED_CORPUS)) {
      const retiredRoot = m[2];
      const key = `${retiredRoot}:${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      err(rel(path), `line ${i + 1} references retired schema-2 path \`kai/${retiredRoot}\`; use .kai state or the project publication root, or wrap deliberate migration text in <!-- kai:allow-legacy-roots -->`);
    }
  });
  if (exempt) err(rel(path), 'an unclosed <!-- kai:allow-legacy-roots --> region suppresses retired-path checking to end of file');
}

// 3. The authoritative documents must expose the schema-3 private/public split.
for (const [path, text] of [
  [conventionsRel, conventions],
  [onboardingRel, onboarding],
  [wsInitRel, wsInit],
]) {
  for (const required of ['.kai/state', 'publication_root', 'storage_mode']) {
    if (!text?.includes(required)) err(path, `does not bind schema-3 workspace concept ${JSON.stringify(required)}`);
  }
}

// ---------------------------------------------------------------------------
// Fixtures — a self-contained shared workspace manifest that must match schema 3.
// ---------------------------------------------------------------------------
const REQUIRED_MANIFEST_KEYS = [
  'plugin', 'version', 'schema_version', 'scaffolded', 'workspace_id',
  'storage_mode', 'workspace_root', 'state', 'runs', 'review', 'archive',
  'personal', 'projects', 'areas',
];
const fixtureManifest = join(ROOT, 'test/fixtures/repo-workspace/.kai/manifest.json');
if (existsSync(fixtureManifest)) {
  const fr = 'test/fixtures/repo-workspace/.kai/manifest.json';
  let fx;
  try { fx = JSON.parse(readFileSync(fixtureManifest, 'utf8')); }
  catch (e) { err(fr, `invalid JSON: ${e.message}`); }
  if (fx) {
    for (const k of REQUIRED_MANIFEST_KEYS) {
      if (!(k in fx)) err(fr, `manifest missing required key "${k}"`);
    }
    if (fx.plugin !== 'kai-core') err(fr, 'manifest "plugin" must be "kai-core"');
    if (fx.schema_version !== 3) err(fr, 'manifest "schema_version" must be 3');
    if (fx.storage_mode !== 'shared') err(fr, 'fixture "storage_mode" must be "shared"');
    if (fx.workspace_root !== '.') err(fr, 'shared fixture "workspace_root" must be "."');
    if (fx.state !== '.kai/state') err(fr, 'fixture "state" must be ".kai/state"');
    if (!Array.isArray(fx.projects) || fx.projects.length !== 1
      || fx.projects[0].path !== '.' || fx.projects[0].publication_root !== 'docs/kai') {
      err(fr, 'fixture must bind one local project with publication_root "docs/kai"');
    }
    if (mAreas && !setEq(toSet(fx.areas || []), mAreas)) {
      err(fr, 'fixture manifest areas differ from the documented manifest areas');
    }
  }
}

// ---------------------------------------------------------------------------
// Release hygiene (#35): a released version must be well-formed and fully
// documented, and dependency metadata must stay internally consistent. These
// are static, git-free checks so `npm test` runs them everywhere; the
// "behavior change requires a bump" gate lives in scripts/release-guard.mjs.
// ---------------------------------------------------------------------------
const SANCTIONED_GIT_DEPS = new Map([
  // name -> the repository identity its lockfile `resolved` URL must contain, so
  // a dep merely *named* lectoria pointing at another repo is still rejected.
  ['lectoria', 'github.com/RubenSaucedo/lectoria'],
]);

(() => {
  const readJSON = (p, label) => {
    if (!existsSync(p)) { err(label, 'missing'); return null; }
    try { return JSON.parse(readFileSync(p, 'utf8')); }
    catch (e) { err(label, `invalid JSON: ${e.message}`); return null; }
  };
  const pj = readJSON(join(ROOT, 'plugin.json'), 'plugin.json');
  const pkg = readJSON(join(ROOT, 'package.json'), 'package.json');
  const lock = readJSON(join(ROOT, 'package-lock.json'), 'package-lock.json');
  const version = pj?.version;
  if (!version) return; // missing/parity already reported by the plugin.json block

  // 1. Semantic version format (strict semver: no leading zeros).
  if (!/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)(?:-(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*)(?:\.(?:0|[1-9]\d*|\d*[A-Za-z-][0-9A-Za-z-]*))*)?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/.test(version)) {
    err('plugin.json', `version "${version}" is not valid semver (x.y.z)`);
  }
  const esc = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

  // 2. CHANGELOG carries a dated section and a reference link for this version.
  const changelog = readIf(join(ROOT, 'CHANGELOG.md'));
  if (changelog === null) err('CHANGELOG.md', 'missing');
  else {
    if (!new RegExp(`^##\\s*\\[${esc}\\]\\s*-\\s*\\d{4}-\\d{2}-\\d{2}`, 'm').test(changelog)) {
      err('CHANGELOG.md', `missing a dated "## [${version}] - YYYY-MM-DD" section for the current version`);
    }
    if (!new RegExp(`^\\[${esc}\\]:\\s*https?://`, 'm').test(changelog)) {
      err('CHANGELOG.md', `missing a reference link "[${version}]: <url>" for the current version`);
    }
  }

  // 3. README "## Status" stamp references the current version.
  const readme = readIf(join(ROOT, 'README.md'));
  if (readme === null) err('README.md', 'missing');
  else {
    const idx = readme.indexOf('## Status');
    if (idx === -1) {
      err('README.md', 'missing a "## Status" heading carrying the current-version stamp');
    } else if (!readme.slice(idx, idx + 400).includes(`\`v${version}\``)) {
      err('README.md', `the "## Status" stamp must reference the current version as \`v${version}\``);
    }
  }

  // 4. Dependency consistency: package.json and the lockfile root agree.
  if (pkg && lock) {
    const lockRoot = lock.packages?.[''] ?? {};
    if (pkg.version) {
      if (lock.version !== pkg.version) {
        err('package-lock.json', `top-level "version" (${lock.version ?? 'missing'}) must equal package.json version "${pkg.version}" (run \`npm install\` after a version bump)`);
      }
      if (lockRoot.version !== pkg.version) {
        err('package-lock.json', `packages[""].version (${lockRoot.version ?? 'missing'}) must equal package.json version "${pkg.version}" (run \`npm install\` after a version bump)`);
      }
    }
    for (const field of ['dependencies', 'devDependencies']) {
      const declared = pkg[field] ?? {};
      const locked = lockRoot[field] ?? {};
      for (const [name, spec] of Object.entries(declared)) {
        if (!(name in locked)) err('package-lock.json', `"${name}" is declared in package.json (${field}) but absent from the lockfile root (run \`npm install\`)`);
        else if (locked[name] !== spec) err('package-lock.json', `"${name}" spec "${locked[name]}" in the lockfile disagrees with package.json "${spec}"`);
      }
      for (const name of Object.keys(locked)) {
        if (!(name in declared)) err('package-lock.json', `lockfile root ${field} lists "${name}" but package.json does not declare it (stale lockfile — run \`npm install\`)`);
      }
    }

    // 5. Git dependency allowlist (name + repository identity) + immutable pin.
    for (const [key, node] of Object.entries(lock.packages ?? {})) {
      if (key === '') continue;
      const resolved = node?.resolved ?? '';
      if (!/^git\+|^git:|\.git(#|$)/.test(resolved)) continue;
      const name = key.replace(/^.*node_modules\//, '');
      const expectedRepo = SANCTIONED_GIT_DEPS.get(name);
      if (expectedRepo === undefined) {
        err('package-lock.json', `unsanctioned git dependency "${name}" resolves to "${resolved}" — only [${[...SANCTIONED_GIT_DEPS.keys()].join(', ')}] may be git-sourced`);
      } else if (!resolved.includes(expectedRepo)) {
        err('package-lock.json', `git dependency "${name}" resolves to "${resolved}" but must come from ${expectedRepo}`);
      }
      if (!/#[0-9a-f]{40}$/.test(resolved)) {
        err('package-lock.json', `git dependency "${name}" is not pinned to a 40-hex commit SHA ("${resolved}") — a floating git ref is not reproducible`);
      }
    }
  }
})();

// ---------------------------------------------------------------------------
// The plugin hooks contract.
//
// hooks.json is the one file in this repository the HOST executes on its own,
// on every subagent, for everyone who installs kai. Nobody reads it in review
// the way they read a prompt, and a mistake here is silent: a wrong path just
// fails to spawn, over and over, in someone else's session.
//
// So the shape is pinned rather than trusted.
// ---------------------------------------------------------------------------
(() => {
  const rel = 'hooks.json';
  const raw = readIf(join(ROOT, rel));
  if (!raw) return; // the observer is optional; only its shape is enforced

  let cfg;
  try {
    cfg = JSON.parse(raw);
  } catch (e) {
    err(rel, `is not valid JSON (${e.message}) — the host would drop every kai hook`);
    return;
  }
  for (const e of hookAssetReferenceErrors(raw)) err(e.file, e.msg);
  if (cfg.version !== 1) err(rel, `version must be 1, found ${JSON.stringify(cfg.version)}`);

  const events = Object.keys(cfg.hooks || {});
  // Deliberately narrow. preToolUse is FAIL-CLOSED -- a crash there denies the
  // tool call -- and per-tool-call events cost ~66ms each. Neither belongs in a
  // file that installs itself.
  const ALLOWED = new Set(['subagentStart', 'subagentStop']);
  for (const ev of events) {
    if (!ALLOWED.has(ev)) {
      err(rel, `subscribes to "${ev}"; kai ships only ${[...ALLOWED].join(' and ')} (see docs/workspaces.md)`);
    }
  }
  for (const ev of ALLOWED) {
    if (!events.includes(ev)) err(rel, `does not subscribe to "${ev}" — a start without a stop cannot be paired`);
  }

  const hookAssets = new Set();
  for (const [ev, entries] of Object.entries(cfg.hooks || {})) {
    for (const entry of Array.isArray(entries) ? entries : []) {
      const cmd = entry.command || entry.bash || entry.powershell || '';
      // Verified empirically: ${PLUGIN_ROOT} expands to the install directory.
      // A relative path would resolve against the USER's repository instead.
      if (!cmd.includes('${PLUGIN_ROOT}')) {
        err(rel, `${ev} command does not use \${PLUGIN_ROOT}; it would resolve against the user's repository, not the plugin`);
      }
      const m = cmd.match(HOOK_ASSET_RE);
      if (m) {
        hookAssets.add(m[1]);
        if (!existsSync(join(ROOT, m[1]))) {
          err(rel, `${ev} command points at "${m[1]}", which does not exist in this plugin`);
        }
      }
      if (typeof entry.timeoutSec !== 'number' || entry.timeoutSec > 15) {
        err(rel, `${ev} entry needs a timeoutSec of 15s or less — it sits in the path of every subagent`);
      }
    }
  }

  // ${PLUGIN_ROOT} resolves inside the hook's own plugin, so the scripts it runs
  // have to be owned by that same pack. This check rejects a second claimant;
  // the emitted-tree equality arm in pack-preview's self-test proves one core
  // copy exists and no department copy does.
  const claimants = [...generatedPacks.keys()]
    .map((key) => parseGeneratedKey(key))
    .filter((entry) => entry && entry.kind === 'hooks')
    .map((entry) => entry.pack);
  for (const e of hooksAssignmentErrors({
    owners: [...new Set([HOOKS_OWNER, ...claimants])],
    hookAssets: [...hookAssets],
    assets: packAssets,
  })) {
    err(e.file, e.msg);
  }
})();

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------
const counts = `${agentFiles.length} agents, ${skillFiles.length} skills`;
if (errors.length === 0) {
  console.log(`\u2713 kai plugin contract valid (${counts})`);
  process.exit(0);
}
console.error(`\u2717 kai plugin contract: ${errors.length} error(s) (${counts})\n`);
for (const e of errors) console.error(`  ${e.file}: ${e.msg}`);
process.exit(1);
