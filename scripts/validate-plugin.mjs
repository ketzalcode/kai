#!/usr/bin/env node
// Contract validator for the kai plugin. Guards what the plugin sells:
//   • structure — frontmatter, name==path, SKILL.md presence, resolvable
//     agent/skill and `inherit` references, and plugin.json paths;
//   • release hygiene — plugin.json and package.json declare the same version;
//   • host-tool allowlist — every declared `tools:` entry is a real host tool;
//   • workspace-contract consistency — the managed .gitignore block, the
//     .kai/runs areas, initiative artifact directories, and the library/<type>
//     set stay in sync across the manifest schema and scaffolds;
//   • generated-pack guarantees — the canonical fail-closed core preflight, byte
//     for byte, exactly once, in every generated department agent and in no core
//     agent, over a probe skill whose marker and version are rigid;
//   • fixtures — the sample repository-mode manifest matches the schema.
// Dependency-free (Node built-ins only) so CI runs it with no install step.
//
// Run: `node scripts/validate-plugin.mjs` (or `npm run validate`).
// Exit code 0 = contract valid; 1 = one or more violations printed.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseFrontmatter, stripQuotes, loaderErrors, parseToolList, SUPPORTED_TOOLS,
} from './lib/loader-contract.mjs';
import {
  discoverManifests, manifestParityErrors, marketplaceConsistencyErrors,
  materializePacks, preflightBlock as canonicalPreflightBlock,
  PREFLIGHT_BLOCK_REL, CONTRACT_SKILL, CONTRACT_VERSION, REFUSAL,
} from './lib/pack-plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const errors = [];
const err = (file, msg) => errors.push({ file, msg });

const rel = (p) => p.slice(ROOT.length + 1).replace(/\\/g, '/');

// ---------------------------------------------------------------------------
// Collect agents and skills
// ---------------------------------------------------------------------------
const agentsDir = join(ROOT, 'agents');
const skillsDir = join(ROOT, 'skills');

const agentFiles = readdirSync(agentsDir)
  .filter((f) => f.endsWith('.agent.md'))
  .map((f) => ({
    id: f.replace(/\.agent\.md$/, ''),
    kind: 'agent',
    path: join(agentsDir, f),
  }));

// Any non-.gitkeep, non-*.agent.md file under agents/ is a mistake.
for (const f of readdirSync(agentsDir)) {
  if (f === '.gitkeep' || f.endsWith('.agent.md')) continue;
  if (statSync(join(agentsDir, f)).isFile()) {
    err(`agents/${f}`, 'unexpected file in agents/ (expected <name>.agent.md)');
  }
}

const skillFiles = [];
for (const d of readdirSync(skillsDir)) {
  const dirPath = join(skillsDir, d);
  if (!statSync(dirPath).isDirectory()) continue;
  const skillPath = join(dirPath, 'SKILL.md');
  if (!existsSync(skillPath)) {
    err(`skills/${d}`, 'skill folder is missing SKILL.md');
    continue;
  }
  skillFiles.push({ id: d, kind: 'skill', path: skillPath });
}

const allFiles = [...agentFiles, ...skillFiles];
const agentIds = new Set(agentFiles.map((a) => a.id));
const skillIds = new Set(skillFiles.map((s) => s.id));

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
  join(ROOT, 'AGENTS.md'),
  join(ROOT, 'README.md'),
  ...publicDocFiles(),
].filter(existsSync);

// Backtick tokens with an agent-role prefix are unambiguous agent references;
// no domain terms start with these prefixes.
const AGENT_REF = /`((?:principal|workflow|director|persona|instructor)-[a-z0-9-]+)`/g;
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
// Inherited-contract declarations
//
// A plugin's own root AGENTS.md is never loaded as custom instructions in a
// consumer workspace, so shared rules only reach a session through a skill the
// agent names. The `**Inherits:**` line is that machine-checkable declaration.
// ---------------------------------------------------------------------------
const BASELINE_SKILL = 'kai-core-team-operating-rules';
const COORDINATING_FAMILIES = ['director', 'principal', 'workflow'];

// Agents that do bounded, delegated work must declare that they are running.
//
// This became load-bearing rather than nice-to-have: the host emits no subagent
// lifecycle events for plugin-provided agents, so `.kai/activity.jsonl` is the
// ONLY evidence that a kai persona ran at all. An agent in a coordinating
// family that does not inherit `kai-core-work-activity` is invisible in both tiers, and
// the fleet view renders it as though it never existed.
//
// The rule is an opt-OUT, deliberately. A new agent inherits the obligation by
// default; forgetting to exempt one costs a line of bookkeeping, while
// forgetting to opt one in costs an agent that cannot be seen.
const ACTIVITY_SKILL = 'kai-core-work-activity';
// Conversational roles, exempt because they have no bounded run to report.
// Two appends per run is the contract; a role whose "run" is an open-ended
// conversation with the operator would emit bookkeeping noise instead, and the
// activity skill is explicit that a drifted-from log is worse than no log.
const ACTIVITY_EXEMPT = new Map([
  ['director-executive-assistant', 'interactive routing and agenda assembly, not a bounded run'],
  ['principal-engineer-career-mentor', 'open-ended mentoring conversation, not a bounded run'],
  // These two DO bounded work worth seeing, and are exempt for a worse reason:
  // they hold no `bash` tool, and `kai-core-work-activity` needs one to append. Granting
  // a shell to a research-and-write role purely so it can log would trade a
  // sandbox boundary for observability, which is the wrong way round. They stay
  // invisible until the delegating agent can record on their behalf.
  ['principal-ai-researcher', 'no shell by design; cannot append without gaining `bash`'],
  ['principal-ai-applied-engineer', 'no shell by design; cannot append without gaining `bash`'],
]);
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
  const onboarding = join(ROOT, 'skills/kai-core-workspace-onboarding/SKILL.md');
  if (existsSync(onboarding)) {
    const ob = readFileSync(onboarding, 'utf8');
    if (!ob.includes('scripts/lib/communication-style-block.md')) {
      err('skills/kai-core-workspace-onboarding/SKILL.md', 'does not reference scripts/lib/communication-style-block.md, so the opt-in style block would never reach a consumer workspace');
    }
  }
}

for (const agent of agentFiles) {
  const raw = readFileSync(agent.path, 'utf8').replace(/\r\n/g, '\n');
  const r = rel(agent.path);
  const all = raw.split('\n');
  const lines = all.filter((l) => /^\*\*Inherits:\*\*/.test(l));

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

  const seen = new Set();
  for (const tok of declared) {
    if (!skillIds.has(tok)) err(r, `inherits unknown skill \`${tok}\``);
    if (seen.has(tok)) err(r, `inherits \`${tok}\` more than once`);
    seen.add(tok);
  }

  if (!seen.has(BASELINE_SKILL)) {
    err(r, `must inherit \`${BASELINE_SKILL}\` (the shared operating contract)`);
  }
  if (COORDINATING_FAMILIES.includes(agent.id.split('-')[0]) && !seen.has('kai-core-workspace-conventions')) {
    err(r, 'coordinating roles must inherit `kai-core-workspace-conventions`');
  }
  if (COORDINATING_FAMILIES.includes(agent.id.split('-')[0])
    && !seen.has(ACTIVITY_SKILL)
    && !ACTIVITY_EXEMPT.has(agent.id)) {
    err(r, `coordinating roles must inherit \`${ACTIVITY_SKILL}\`, or be listed in ACTIVITY_EXEMPT with a reason `
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
// Core preflight block (generated department agents)
//
// A pack agent that cannot reach core cannot reach a skill that would tell it
// what to do about core, so the fail-closed probe is copied into every generated
// department agent's OWN body. One canonical file, pinned byte for byte here, is
// what stops those copies from drifting — the same reasoning as
// inherits-block.txt above. Core agents are excluded: they ship inside the pack
// that provides the probe.
// ---------------------------------------------------------------------------
const preflightPath = join(ROOT, PREFLIGHT_BLOCK_REL);
const preflight = existsSync(preflightPath) ? canonicalPreflightBlock(ROOT) : null;
if (!preflight) {
  err(PREFLIGHT_BLOCK_REL, 'missing (canonical fail-closed core-preflight block)');
} else {
  if (!preflight.includes(`\`${CONTRACT_SKILL}\``)) {
    err(PREFLIGHT_BLOCK_REL, `does not name \`${CONTRACT_SKILL}\`, so the injected block would probe nothing`);
  }
  if (!preflight.includes(REFUSAL)) {
    err(PREFLIGHT_BLOCK_REL, `does not carry the exact refusal token \`${REFUSAL}\` the block promises`);
  }
  const demandedVersions = [...preflight.matchAll(/`contract:\s*([^`]+)`/g)]
    .map((match) => match[1]);
  if (demandedVersions.length !== 1 || demandedVersions[0] !== CONTRACT_VERSION) {
    err(PREFLIGHT_BLOCK_REL, `must demand exactly one contract version and it must be ${CONTRACT_VERSION}; found ${JSON.stringify(demandedVersions)} — duplicated prose literals can drift into fail-open skew handling`);
  }
  if (!preflight.includes('Do not load or apply any inherited skill until this preflight passes.')) {
    err(PREFLIGHT_BLOCK_REL, 'does not explicitly override the inherited-skill loading order — a pack agent could touch missing core skills before proving core is compatible');
  }

  // The probe itself. The version is pinned by the skill's own name, so a body
  // reporting anything but `contract: 1` makes every injected block wrong.
  const probeRel = `skills/${CONTRACT_SKILL}/SKILL.md`;
  const probePath = join(ROOT, 'skills', CONTRACT_SKILL, 'SKILL.md');
  if (!existsSync(probePath)) {
    err(probeRel, 'missing — every generated department agent invokes this skill as its first action');
  } else {
    const probe = readFileSync(probePath, 'utf8').replace(/\r\n/g, '\n');
    if (!/^KAI_CORE_READY$/m.test(probe)) {
      err(probeRel, 'does not return the exact `KAI_CORE_READY` marker line the preflight matches on');
    }
    const declared = probe.match(/^contract:\s*(\S+)$/m);
    if (!declared) err(probeRel, 'does not return a `contract: <version>` line');
    else if (declared[1] !== CONTRACT_VERSION) {
      err(probeRel, `returns \`contract: ${declared[1]}\`, but its name pins it to ${CONTRACT_VERSION} — a skew here is invisible to the agents that trust it`);
    }
  }

  // The pin that decides it: what the authoritative generator actually emits.
  const generated = materializePacks({ root: ROOT, version: '0.0.0-validate' });
  for (const [key, body] of generated) {
    if (!/^kai-[a-z]+\/agents\/.+\.agent\.md$/.test(key)) continue;
    const copies = body.split(preflight).length - 1;
    if (key.startsWith('kai-core/')) {
      if (copies !== 0) {
        err(`generated ${key}`, 'carries the core-preflight block; a core agent ships inside the pack that provides the probe, so it would only ever fail on itself');
      }
      continue;
    }
    if (copies !== 1) {
      err(`generated ${key}`, `carries the verbatim core-preflight block ${copies} time(s); exactly one copy is required`);
      continue;
    }
    const at = body.indexOf(preflight);
    const directiveAt = inheritsBlock ? body.indexOf(inheritsBlock) : -1;
    const directiveEnd = directiveAt === -1 ? -1 : directiveAt + inheritsBlock.length;
    if (at < body.indexOf('**Inherits:**')) {
      err(`generated ${key}`, 'places the core-preflight block before the `**Inherits:**` line it must follow');
    } else if (inheritsBlock && at < directiveAt) {
      err(`generated ${key}`, 'splits the inherited-contract directive from the `**Inherits:**` line it binds');
    } else if (directiveEnd !== -1 && !/^\s*$/.test(body.slice(directiveEnd, at))) {
      err(`generated ${key}`, 'places content between the inherited-contract directive and the core preflight — the preflight must remain the first executable instruction');
    }
  }
  if (!generated.has(`kai-core/skills/${CONTRACT_SKILL}/SKILL.md`)) {
    err('scripts/lib/pack-plan.mjs', `does not place \`${CONTRACT_SKILL}\` in kai-core — the probe must ship with the pack whose presence it proves`);
  }
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
    const raw = readFileSync(agent.path, 'utf8').replace(/\r\n/g, '\n');
    for (const line of raw.split('\n')) {
      if (/^\*\*Inherits:\*\*/.test(line)) {
        for (const m of line.matchAll(/`([^`]+)`/g)) inherited.add(m[1]);
        continue;
      }
      const d = line.match(/^\s*[-*]\s+\*\*`([^`]+)`\*\*/);
      if (d) dispatched.add(d[1]);
    }
  }
  for (const skill of skillFiles) {
    const id = skill.id;
    if (inherited.has(id) || dispatched.has(id)) continue;
    // The version-pinned probe fires from the canonical preflight block injected
    // into every generated department agent — a path with no `**Inherits:**`
    // line to grep, because the monolith has no injected bodies.
    if (preflight && id === CONTRACT_SKILL && preflight.includes(id)) continue;
    const raw = readFileSync(skill.path, 'utf8');
    if (/^user-invocable:\s*true\s*$/m.test(raw)) continue;
    err(rel(skill.path), 'has no firing path: no agent inherits or dispatches it, and it is not `user-invocable: true` — it can never reach a session');
  }
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
    err(`skills/${ASSESSOR_CONTRACT}/SKILL.md`, 'missing (the assessor write contract the roster depends on)');
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
// which is impossible without `bash`. Nothing otherwise connects the two, so a
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
// Shell tools are declared in the portable pair
// ---------------------------------------------------------------------------
// `bash` alone grants no shell on Windows. The host does not map it per-OS and
// does not complain: it drops the name and hands the agent a toolset with no
// way to run anything, so every script-running contract fails silently on the
// platform. `shell` resolves to the platform terminal. Declaring both is the
// only form that works everywhere, and this check stops the pair from being
// split again by a well-meant tidy-up.
// ---------------------------------------------------------------------------
{
  const checkPair = (file, list, field) => {
    if (!list) return;
    const has = new Set(list);
    if (has.has('bash') && !has.has('shell')) {
      err(file, `\`${field}\` names \`bash\` without \`shell\` — on Windows that grants no shell at all; declare both`);
    }
    if (has.has('shell') && !has.has('bash')) {
      err(file, `\`${field}\` names \`shell\` without \`bash\` — declare both so the pair stays portable`);
    }
  };
  for (const agent of agentFiles) {
    const parsed = parseFrontmatter(readFileSync(agent.path, 'utf8'));
    if (!parsed.ok) continue;
    checkPair(rel(agent.path), parseToolList(parsed.fm.tools), 'tools');
  }
  for (const skill of skillFiles) {
    const parsed = parseFrontmatter(readFileSync(skill.path, 'utf8'));
    if (!parsed.ok) continue;
    checkPair(rel(skill.path), parseToolList(parsed.fm.tools), 'tools');
    checkPair(rel(skill.path), parseToolList(parsed.fm.requires_tools), 'requires_tools');
  }
}

// ---------------------------------------------------------------------------
// Plugin manifests (the monolith + any committed pack trees)
//
// The repo is single-manifest today (just the root plugin.json). The pack split
// adds committed packs/<name>/plugin.json trees, so every check here iterates the
// discovered manifests: a pack tree is validated exactly like the monolith
// (structure, and a version kept in lockstep with the canonical release), and the
// marketplace index may list more than one plugin. With no packs/ present this
// reduces to the original single-manifest behavior, byte-for-byte.
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
  // Declared agent/skill paths must resolve, relative to the manifest's own
  // directory (root for the monolith, the pack dir for a pack).
  for (const key of ['agents', 'skills']) {
    if (!pj[key]) err(m.rel, `missing "${key}" path`);
    else if (!existsSync(join(m.dir, pj[key]))) err(m.rel, `"${key}" path "${pj[key]}" does not exist`);
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
// renaming it silently invalidates `kai@kai-plugins` everywhere. The index may
// list more than one plugin once packs publish; an in-repo plugin with no entry is
// fine, because packs stay unpublished until the marketplace flip.
const mktPath = join(ROOT, MARKETPLACE_REL);
if (!existsSync(mktPath)) {
  err(MARKETPLACE_REL, 'missing — kai publishes itself as a marketplace so it can be installed without a deprecated direct install');
} else {
  let mkt;
  try { mkt = JSON.parse(readFileSync(mktPath, 'utf8')); }
  catch (e) { err(MARKETPLACE_REL, `invalid JSON: ${e.message}`); }
  if (mkt) {
    const manifestsByName = {};
    for (const m of parsedManifests) if (m.name) manifestsByName[m.name] = { version: m.version, description: m.description };
    for (const msg of marketplaceConsistencyErrors({
      mkt, marketName: MARKETPLACE_NAME, monolithName: MONOLITH_NAME, canonicalVersion, manifestsByName,
    })) {
      err(MARKETPLACE_REL, msg);
    }
    // The one FS check the pure helper leaves to the caller: a listed source that
    // does not resolve to a plugin.json passes the host's schema but fails at
    // install time, on the user's machine.
    for (const entry of Array.isArray(mkt.plugins) ? mkt.plugins : []) {
      if (typeof entry?.source === 'string') {
        const relSrc = entry.source.replace(/^\.\/?/, '');
        const target = relSrc === '' ? ROOT : join(ROOT, relSrc);
        if (!existsSync(join(target, 'plugin.json'))) {
          err(MARKETPLACE_REL, `entry "${entry.name}" source "${entry.source}" does not contain a plugin.json — the install would fail on the user's machine, not here`);
        }
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
const conventions = readIf(join(ROOT, 'skills/kai-core-workspace-conventions/SKILL.md'));
const onboarding = readIf(join(ROOT, 'skills/kai-core-workspace-onboarding/SKILL.md'));
const wsInit = readIf(join(ROOT, 'agents/workflow-workspace-init.agent.md'));
const initiativeInit = readIf(join(ROOT, 'agents/workflow-initiative-init.agent.md'));
const gitignore = readIf(join(ROOT, '.gitignore'));

const toSet = (arr) => new Set(arr);
const setEq = (a, b) => a && b && a.size === b.size && [...a].every((x) => b.has(x));
const dirTokens = (s) => toSet([...s.matchAll(/([a-z][a-z0-9-]*)\//g)].map((m) => m[1]).filter((d) => d !== 'library' && d !== 'runs'));

// 1. The managed .gitignore block installed by onboarding must be byte-identical
//    to the one committed in the repo .gitignore.
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
if (obBlock === null) err('skills/kai-core-workspace-onboarding/SKILL.md', 'missing the managed gitignore block template');
if (giBlock && obBlock && giBlock !== obBlock) {
  err('.gitignore', 'managed gitignore block differs from the kai-core-workspace-onboarding template (they must stay identical)');
}

// 2. The .kai/runs areas must match across the manifest schema and the two
//    scaffolds that create the run directories.
const mAreasM = conventions && conventions.match(/"areas":\s*\[([^\]]*)\]/);
const mAreas = mAreasM ? toSet(mAreasM[1].split(',').map((x) => stripQuotes(x)).filter(Boolean)) : null;
const obAreasM = onboarding && onboarding.match(/\n\s*(qa\/[^\n]*)\n/);
const obAreas = obAreasM ? dirTokens(obAreasM[1]) : null;
const wiAreasM = wsInit && wsInit.match(/runs\/\{([^}]*)\}/s);
const wiAreas = wiAreasM ? dirTokens(wiAreasM[1]) : null;
if (!mAreas) err('skills/kai-core-workspace-conventions/SKILL.md', 'could not locate the manifest "areas" list');
if (!obAreas) err('skills/kai-core-workspace-onboarding/SKILL.md', 'could not locate the runs/ area scaffold');
if (!wiAreas) err('agents/workflow-workspace-init.agent.md', 'could not locate the runs/ area scaffold');
if (mAreas && obAreas && !setEq(mAreas, obAreas)) {
  err('skills/kai-core-workspace-onboarding/SKILL.md', `runs/ areas ${JSON.stringify([...obAreas].sort())} differ from manifest areas ${JSON.stringify([...mAreas].sort())}`);
}
if (mAreas && wiAreas && !setEq(mAreas, wiAreas)) {
  err('agents/workflow-workspace-init.agent.md', `runs/ areas ${JSON.stringify([...wiAreas].sort())} differ from manifest areas ${JSON.stringify([...mAreas].sort())}`);
}

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

// 2c. Schema 2 moved the working corpus under `kai/`. A single shipped prompt,
//     doc, or distributed example still naming a bare root would silently
//     recreate the retired schema-1 layout beside the real one (split-brain),
//     so a root segment is only accepted when it is immediately parented by
//     `kai/`. Text that deliberately names the retired roots — legacy
//     detection, the migration ladder, retired ignore rules — must say so
//     explicitly by wrapping the region in `<!-- kai:allow-legacy-roots -->` …
//     `<!-- /kai:allow-legacy-roots -->`, so the exemption is a decision on the
//     record rather than a keyword coincidence.
const ROOT_SEGMENT = /(coordination|initiatives|library|personal)[/\\]/g;
const LEGACY_OPEN = /<!--\s*kai:allow-legacy-roots\s*-->/;
const LEGACY_CLOSE = /<!--\s*\/kai:allow-legacy-roots\s*-->/;
const TREE_LINE = /[├└│]/;
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
    // Tree diagrams render the roots as indented children of `kai/`.
    if (TREE_LINE.test(line)) return;
    for (const m of line.matchAll(ROOT_SEGMENT)) {
      const before = line.slice(0, m.index);
      // Correctly parented — the only accepted form.
      if (/kai[/\\]$/.test(before)) continue;
      // Part of a longer identifier (`sub-library/`, `mylibrary/`), not a root.
      if (/[\w-]$/.test(before)) continue;
      const key = `${m[1]}:${i}`;
      if (seen.has(key)) continue;
      seen.add(key);
      err(rel(path), `line ${i + 1} references the retired schema-1 root \`${m[1]}/\` — the working corpus lives at \`kai/${m[1]}/\` (a bare root forks the workspace; wrap deliberate legacy text in <!-- kai:allow-legacy-roots -->)`);
    }
  });
  if (exempt) err(rel(path), 'an unclosed <!-- kai:allow-legacy-roots --> region suppresses bare-root checking to end of file');
}

// 3. The library/<type>/ set must match across the conventions "Library types"
//    table and the two library scaffolds.
function libTypesFromTable(text) {
  if (!text) return null;
  const start = text.indexOf('### Library types');
  if (start === -1) return null;
  const rest = text.slice(start + 1);
  const nextHeading = rest.search(/\n#{2,3} /);
  const section = nextHeading === -1 ? rest : rest.slice(0, nextHeading);
  return toSet([...section.matchAll(/`kai\/library\/([a-z0-9-]+)\/`/g)].map((m) => m[1]));
}
const obLibM = onboarding && onboarding.match(/\nkai\/library\/\r?\n([\s\S]*?)\r?\n```/);
const obLib = obLibM ? dirTokens(obLibM[1]) : null;
const wiLibM = wsInit && wsInit.match(/library\/\{([^}]*)\}/s);
const wiLib = wiLibM ? dirTokens(wiLibM[1]) : null;
const tableLib = libTypesFromTable(conventions);
if (!tableLib) err('skills/kai-core-workspace-conventions/SKILL.md', 'could not locate the "Library types" table');
if (tableLib && !obLib) err('skills/kai-core-workspace-onboarding/SKILL.md', 'could not locate the library/ scaffold');
if (tableLib && !wiLib) err('agents/workflow-workspace-init.agent.md', 'could not locate the library/ scaffold');
if (tableLib && obLib && !setEq(tableLib, obLib)) {
  err('skills/kai-core-workspace-onboarding/SKILL.md', `library/ types ${JSON.stringify([...obLib].sort())} differ from the conventions Library types table ${JSON.stringify([...tableLib].sort())}`);
}
if (tableLib && wiLib && !setEq(tableLib, wiLib)) {
  err('agents/workflow-workspace-init.agent.md', `library/ types ${JSON.stringify([...wiLib].sort())} differ from the conventions Library types table ${JSON.stringify([...tableLib].sort())}`);
}

// 4. Initiative artifact directories must match between the canonical workspace
//    tree and the bounded workflow that creates an initiative.
const conventionArtifactsM = conventions && conventions.match(/artifacts\/\r?\n([\s\S]*?)\r?\n   ├─ library\//);
const conventionArtifacts = conventionArtifactsM ? dirTokens(conventionArtifactsM[1]) : null;
const wiArtifactsM = initiativeInit && initiativeInit.match(/kai\/initiatives\/<slug>\/artifacts\/\r?\n([\s\S]*?)\r?\nkai\/coordination\//);
const wiArtifacts = wiArtifactsM ? dirTokens(wiArtifactsM[1]) : null;
if (!conventionArtifacts) {
  err('skills/kai-core-workspace-conventions/SKILL.md', 'could not locate the initiative artifacts/ scaffold');
}
if (!wiArtifacts) {
  err('agents/workflow-initiative-init.agent.md', 'could not locate the initiative artifacts/ scaffold');
}
if (conventionArtifacts && wiArtifacts && !setEq(conventionArtifacts, wiArtifacts)) {
  err('agents/workflow-initiative-init.agent.md', `initiative artifact directories ${JSON.stringify([...wiArtifacts].sort())} differ from workspace conventions ${JSON.stringify([...conventionArtifacts].sort())}`);
}

// ---------------------------------------------------------------------------
// Fixtures — a self-contained repository-mode workspace manifest that must match
// the documented schema and canonical areas, with no machine-specific paths.
// ---------------------------------------------------------------------------
const REQUIRED_MANIFEST_KEYS = ['plugin', 'version', 'schema_version', 'scaffolded', 'workspace_mode', 'workspace_root', 'kai', 'runs', 'corpus', 'coordination', 'initiatives', 'library', 'personal', 'areas'];
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
    if (fx.plugin !== 'kai') err(fr, 'manifest "plugin" must be "kai"');
    if (!Number.isInteger(fx.schema_version)) {
      err(fr, 'manifest "schema_version" must be an integer');
    }
    if (fx.workspace_mode === 'repository' && fx.workspace_root !== '.') {
      err(fr, 'repository-mode "workspace_root" must be "."');
    }
    for (const [k, v] of Object.entries(fx)) {
      if (typeof v === 'string' && /^[A-Za-z]:[\\/]|^\/[A-Za-z]/.test(v)) {
        err(fr, `manifest value for "${k}" looks like a machine-specific absolute path`);
      }
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

  for (const [ev, entries] of Object.entries(cfg.hooks || {})) {
    for (const entry of Array.isArray(entries) ? entries : []) {
      const cmd = entry.command || entry.bash || entry.powershell || '';
      // Verified empirically: ${PLUGIN_ROOT} expands to the install directory.
      // A relative path would resolve against the USER's repository instead.
      if (!cmd.includes('${PLUGIN_ROOT}')) {
        err(rel, `${ev} command does not use \${PLUGIN_ROOT}; it would resolve against the user's repository, not the plugin`);
      }
      const m = cmd.match(/\$\{PLUGIN_ROOT\}\/([A-Za-z0-9_\-./]+)/);
      if (m && !existsSync(join(ROOT, m[1]))) {
        err(rel, `${ev} command points at "${m[1]}", which does not exist in this plugin`);
      }
      if (typeof entry.timeoutSec !== 'number' || entry.timeoutSec > 15) {
        err(rel, `${ev} entry needs a timeoutSec of 15s or less — it sits in the path of every subagent`);
      }
    }
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
