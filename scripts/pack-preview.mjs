#!/usr/bin/env node
// Materialises a throwaway two-plugin preview of the pack architecture proposed
// in docs/proposals/pack-architecture.md, built from the LIVE roster rather than
// from toy fixtures. Nothing here ships: it exists to answer the host-behaviour
// questions that gate the split, using real agents whose bodies and tool grants
// are the ones we would actually publish.
//
// The questions it is built to answer:
//   1. does a fail-closed preflight work on a REAL agent with full tool grants,
//      or only on a restricted probe that had nothing else it could do?
//   2. what happens when core is absent, or present at an incompatible version?
//   3. when legacy `kai` and `kai-core` both provide `kai-core-team-operating-rules`,
//      which one resolves?
//   4. what does a pack agent do when it references an agent from a pack the
//      user did not install?
//
// Run: node scripts/pack-preview.mjs --out <dir> [--no-core] [--contract N]
//      node scripts/pack-preview.mjs --self-test
//
// Dependency-free (Node built-ins only), consistent with the rest of scripts/.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The narrow pack under test. Personal roles are chosen deliberately: they are
// the department whose removal from a default install is most defensible, and
// the one #29 named, so the preview doubles as a dry run of the split we would
// most likely ship first.
export const PACK_AGENTS = [
  'persona-professional-nutritionist', 'persona-professional-trainer', 'persona-self',
  'instructor-tutor', 'instructor-teacher', 'instructor-path-mentor',
  'creative-video-director', 'principal-engineer-career-mentor', 'workflow-course-to-audio',
];

export const CONTRACT_SKILL = 'kai-core-contract-v1';

// The refusal an agent must produce when core is missing. Pinned as a constant
// so the test can assert on it exactly rather than on a paraphrase -- a preflight
// that "sort of" refuses is indistinguishable from one that silently continued.
export const REFUSAL = 'KAI-CORE-MISSING';

const readAgent = (id) => readFileSync(join(ROOT, 'agents', `${id}.agent.md`), 'utf8');
const skillPath = (id) => join(ROOT, 'skills', id, 'SKILL.md');

function inheritedSkills(body) {
  const line = body.match(/^\*\*Inherits:\*\*(.*)$/m);
  if (!line) return [];
  return [...line[1].matchAll(/`([^`]+)`/g)].map((m) => m[1])
    .filter((s) => existsSync(skillPath(s)));
}

// Split the roster's skills into "core must provide" and "pack owns", using the
// same rule the real split would use: a skill inherited by any agent outside the
// pack cannot live inside the pack, or the pack becomes a dependency of the rest
// of the plugin.
export function planSkills(packAgents) {
  const allAgents = readdirSync(join(ROOT, 'agents'))
    .filter((f) => f.endsWith('.agent.md')).map((f) => f.replace(/\.agent\.md$/, ''));
  const inPack = new Set(packAgents);

  const packNeeds = new Set();
  for (const id of packAgents) for (const s of inheritedSkills(readAgent(id))) packNeeds.add(s);

  const usedOutside = new Set();
  for (const id of allAgents) {
    if (inPack.has(id)) continue;
    for (const s of inheritedSkills(readAgent(id))) usedOutside.add(s);
  }

  const core = [...packNeeds].filter((s) => usedOutside.has(s)).sort();
  const local = [...packNeeds].filter((s) => !usedOutside.has(s)).sort();
  return { core, local };
}

// The preflight is written into each pack agent's OWN body, never into an
// inherited skill: an agent that cannot reach core also cannot reach a skill
// that tells it what to do about core. That circularity is the whole reason
// this block is duplicated per agent rather than referenced.
export function preflightBlock() {
  return [
    '',
    '## Core preflight — before anything else',
    '',
    `Your first action in every session is to invoke the \`${CONTRACT_SKILL}\` skill.`,
    '',
    `- If it returns \`KAI_CORE_READY\` and a \`contract:\` line whose value is \`1\`,`,
    '  continue normally and do not mention the check.',
    '- If the skill is unavailable, or the marker is missing, or the contract value',
    `  is anything other than \`1\`: **stop immediately**. Reply with exactly`,
    `  \`${REFUSAL}\` and nothing else. Do not claim work, take a lease, write`,
    '  workspace state, use any other tool, or attempt the request from memory.',
    '',
  ].join('\n');
}

// Insert the preflight directly after the inherits directive block, which ends
// at the first blank line following the `**Inherits:**` line. Output is
// normalised to LF: the repo checks out CRLF on Windows, and splicing LF-joined
// lines into a CRLF file would leave generated agents with mixed endings.
export function injectPreflight(body, block) {
  const lines = body.replace(/\r\n/g, '\n').split('\n');
  const i = lines.findIndex((l) => l.startsWith('**Inherits:**'));
  if (i === -1) return block + lines.join('\n');
  let j = i + 1;
  while (j < lines.length && lines[j].trim() !== '') j++;
  lines.splice(j, 0, block);
  return lines.join('\n');
}

// ---------------------------------------------------------------------------
// The full five-pack partition, for the whole-roster tests
// ---------------------------------------------------------------------------

// Every one of the 56 agents belongs to exactly one pack. `core` holds the org
// spine and the workspace machinery: the roles that are meaningful with no
// department installed at all.
export const PACKS = {
  core: [
    'director-chief-of-staff', 'director-executive-assistant', 'workflow-workspace-init',
    'workflow-self-check', 'workflow-proactive-scan', 'workflow-weekly-pulse',
    'workflow-initiative-init',
  ],
  engineering: [
    'principal-swe-architect', 'principal-swe-backend', 'principal-swe-frontend',
    'principal-swe-infra', 'principal-swe-manager', 'principal-solutions-architect',
    'principal-sre', 'principal-security', 'principal-privacy-compliance',
    'principal-qa-ui', 'principal-data-engineer', 'principal-ai-applied-engineer',
    'principal-ai-researcher', 'principal-technical-writer', 'workflow-pull-request',
    'workflow-issue-analysis', 'workflow-incident-response', 'workflow-ship',
    'workflow-doc-review', 'workflow-localization',
  ],
  product: [
    'principal-product-manager', 'principal-product-designer', 'principal-product-strategist',
    'principal-brand-designer', 'principal-data-analytics', 'persona-ux-first-time-user',
    'workflow-product-explore', 'workflow-experiment-review', 'workflow-customer-feedback',
  ],
  gtm: [
    'principal-sales', 'principal-growth', 'principal-demand-generation',
    'principal-product-marketing', 'principal-seo', 'principal-linkedin-strategist',
    'principal-partnerships', 'principal-pricing-monetization',
    'principal-revenue-operations', 'principal-customer-success', 'workflow-support-triage',
  ],
  personal: PACK_AGENTS,
};

// Assign every skill on disk to exactly one provider. The rule is the one the
// real split uses: a skill inherited by agents in more than one pack, or by a
// core agent, must come from core -- otherwise a pack becomes a dependency of
// another pack, or of core, and the dependency direction inverts.
//
// Skills that NO agent inherits cannot be placed by inheritance at all. They are
// returned separately rather than silently swept into core, because "we could
// not decide this mechanically" is a finding, not a default.
export function planPacks() {
  const packOf = new Map();
  for (const [pack, ids] of Object.entries(PACKS)) for (const id of ids) packOf.set(id, pack);

  const allAgents = readdirSync(join(ROOT, 'agents'))
    .filter((f) => f.endsWith('.agent.md')).map((f) => f.replace(/\.agent\.md$/, ''));
  const unassigned = allAgents.filter((id) => !packOf.has(id));

  const usedBy = new Map();
  for (const id of allAgents) {
    for (const s of inheritedSkills(readAgent(id))) {
      if (!usedBy.has(s)) usedBy.set(s, new Set());
      usedBy.get(s).add(packOf.get(id) ?? '?');
    }
  }

  const onDisk = readdirSync(join(ROOT, 'skills'))
    .filter((d) => existsSync(skillPath(d))).sort();

  const core = [];
  const local = Object.fromEntries(Object.keys(PACKS).map((p) => [p, []]));
  const orphans = [];
  for (const s of onDisk) {
    const packs = usedBy.get(s);
    if (!packs) { orphans.push(s); continue; }
    if (packs.size > 1 || packs.has('core')) core.push(s);
    else local[[...packs][0]].push(s);
  }
  return { core, local, orphans, unassigned };
}

function writePlugin(dir, name, description, agentIds, skills, block) {
  mkdirSync(dir, { recursive: true });
  const manifest = { name, version: '0.0.0-preview', description, skills: 'skills' };
  if (agentIds.length) manifest.agents = 'agents';
  writeFileSync(join(dir, 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (agentIds.length) {
    mkdirSync(join(dir, 'agents'), { recursive: true });
    for (const id of agentIds) {
      const body = readAgent(id);
      writeFileSync(join(dir, 'agents', `${id}.agent.md`),
        block ? injectPreflight(body, block) : body.replace(/\r\n/g, '\n'));
    }
  }
  for (const s of skills) writeSkill(dir, s, readFileSync(skillPath(s), 'utf8'));
}

// Materialise core plus any subset of the departments. A subset is the point:
// the interesting failures are what a pack does when a pack it references is
// not installed, and what core alone can still do.
export function buildAll({ out, packs = Object.keys(PACKS).filter((p) => p !== 'core'),
  withCore = true, contract = 1 }) {
  rmSync(out, { recursive: true, force: true });
  const plan = planPacks();
  const built = [];

  if (withCore) {
    const dir = join(out, 'kai-core-preview');
    writePlugin(dir, 'kai-core-preview', 'Preview of the kai shared core. Not for use.',
      PACKS.core, [...plan.core, ...plan.orphans], null);
    writeSkill(dir, CONTRACT_SKILL, contractSkill(contract));
    built.push({ name: 'kai-core-preview', dir, agents: PACKS.core.length });
  }

  const block = preflightBlock();
  for (const p of packs) {
    const dir = join(out, `kai-${p}-preview`);
    writePlugin(dir, `kai-${p}-preview`, `Preview of the kai ${p} department. Not for use.`,
      PACKS[p], plan.local[p], block);
    built.push({ name: `kai-${p}-preview`, dir, agents: PACKS[p].length });
  }
  return { built, plan };
}

export function contractSkill(contractVersion) {
  return [
    '---',
    `name: ${CONTRACT_SKILL}`,
    'description: "Reports that kai-core is loaded and which contract version it '
      + 'provides. Use as the first action of any kai pack agent."',
    '---',
    '',
    '# kai core contract',
    '',
    'Report these two lines to the calling agent verbatim, then stop:',
    '',
    '```text',
    'KAI_CORE_READY',
    `contract: ${contractVersion}`,
    '```',
    '',
  ].join('\n');
}

function writeSkill(dir, id, text) {
  mkdirSync(join(dir, 'skills', id), { recursive: true });
  writeFileSync(join(dir, 'skills', id, 'SKILL.md'), text);
}

export function build({ out, withCore = true, contract = 1 }) {
  rmSync(out, { recursive: true, force: true });
  const { core, local } = planSkills(PACK_AGENTS);

  const coreDir = join(out, 'kai-core-preview');
  if (withCore) {
    mkdirSync(coreDir, { recursive: true });
    writeFileSync(join(coreDir, 'plugin.json'), `${JSON.stringify({
      name: 'kai-core-preview', version: '0.0.0-preview',
      description: 'Preview of the kai shared contract layer. Not for use.',
      skills: 'skills',
    }, null, 2)}\n`);
    for (const s of core) writeSkill(coreDir, s, readFileSync(skillPath(s), 'utf8'));
    writeSkill(coreDir, CONTRACT_SKILL, contractSkill(contract));
  }

  const packDir = join(out, 'kai-personal-preview');
  mkdirSync(join(packDir, 'agents'), { recursive: true });
  writeFileSync(join(packDir, 'plugin.json'), `${JSON.stringify({
    name: 'kai-personal-preview', version: '0.0.0-preview',
    description: 'Preview of the kai personal department. Not for use.',
    agents: 'agents', skills: 'skills',
  }, null, 2)}\n`);
  const block = preflightBlock();
  for (const id of PACK_AGENTS) {
    writeFileSync(join(packDir, 'agents', `${id}.agent.md`), injectPreflight(readAgent(id), block));
  }
  for (const s of local) writeSkill(packDir, s, readFileSync(skillPath(s), 'utf8'));

  return { coreDir: withCore ? coreDir : null, packDir, core, local };
}

// ---------------------------------------------------------------------------
// Self-test
// ---------------------------------------------------------------------------
function selfTest() {
  let pass = 0; const fails = [];
  const ok = (cond, msg) => { if (cond) { pass++; console.log(`  ok ${msg}`); } else { fails.push(msg); console.log(`  FAIL ${msg}`); } };

  const { core, local } = planSkills(PACK_AGENTS);
  ok(core.includes('kai-core-team-operating-rules'),
    'the universal contract is planned into core, never into the pack');
  ok(!local.includes('kai-core-team-operating-rules'),
    'and it is not also duplicated into the pack, which is the whole point');
  ok(local.length > 0,
    'a pack that owns no skills of its own would not be testing anything');
  ok(core.every((s) => !local.includes(s)),
    'core and pack skill sets are disjoint: a skill has exactly one provider');

  const body = readAgent(PACK_AGENTS[0]);
  const injected = injectPreflight(body, preflightBlock());
  const iInherits = injected.split('\n').findIndex((l) => l.startsWith('**Inherits:**'));
  const iPreflight = injected.split('\n').findIndex((l) => l.includes('Core preflight'));
  ok(iInherits !== -1 && iPreflight > iInherits,
    'the preflight lands after the inherits directive, not before it');
  ok(injected.split('**Inherits:**').length === 2,
    'injection does not duplicate the inherits line CI pins to exactly one');
  ok(injected.includes(REFUSAL),
    'the agent carries the exact refusal token the test asserts on');
  ok(/^---\n/.test(injected) && !injected.includes('\r'),
    'frontmatter still opens the file and endings are uniform LF, so the host can load it');

  const noAnchor = injectPreflight('no directive here\n', preflightBlock());
  ok(noAnchor.includes('Core preflight'),
    'an agent without an inherits line still gets the preflight rather than silently skipping it');

  ok(contractSkill(1).includes('contract: 1') && contractSkill(2).includes('contract: 2'),
    'the contract skill reports the version it was built with, so skew is testable');

  const plan = planPacks();
  const rosterSize = readdirSync(join(ROOT, 'agents')).filter((f) => f.endsWith('.agent.md')).length;
  const assigned = Object.values(PACKS).reduce((n, l) => n + l.length, 0);
  ok(plan.unassigned.length === 0,
    `every agent belongs to a pack (unassigned: ${plan.unassigned.join(', ') || 'none'})`);
  ok(assigned === rosterSize,
    `the partition covers the roster exactly: ${assigned} of ${rosterSize}`);
  ok(new Set(Object.values(PACKS).flat()).size === assigned,
    'no agent is claimed by two packs, which would make its home ambiguous');
  ok(plan.core.includes('kai-core-team-operating-rules'),
    'the universal contract is provided by core in the full partition too');
  const localAll = Object.values(plan.local).flat();
  ok(localAll.every((s) => !plan.core.includes(s)),
    'no skill is provided by both core and a pack: exactly one provider each');
  ok(plan.orphans.length > 0 ? plan.orphans.every((s) => !localAll.includes(s)) : true,
    'skills no agent inherits are reported separately, not silently defaulted into a pack');

  console.log(`\npack-preview self-test: ${pass} checks passed${fails.length ? `, ${fails.length} FAILED` : ''}`);
  return fails.length === 0;
}

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };

if (args.includes('--self-test')) {
  process.exit(selfTest() ? 0 : 1);
} else if (args.includes('--all')) {
  const packsArg = flag('--packs', '');
  const r = buildAll({
    out: flag('--out'),
    packs: packsArg ? packsArg.split(',') : undefined,
    withCore: !args.includes('--no-core'),
    contract: Number(flag('--contract', '1')),
  });
  for (const b of r.built) {
    console.log(`  ${b.name.padEnd(28)} ${String(b.agents).padStart(2)} agents  ${b.dir}`);
  }
  console.log(`\ncore skills: ${r.plan.core.length} (+${r.plan.orphans.length} inherited by nobody)`);
  for (const [p, l] of Object.entries(r.plan.local)) {
    if (l.length) console.log(`  ${p} owns ${l.length}: ${l.join(', ')}`);
  }
  if (r.plan.orphans.length) console.log(`\nunplaceable by inheritance: ${r.plan.orphans.join(', ')}`);
} else if (args.includes('--out')) {
  const r = build({
    out: flag('--out'),
    withCore: !args.includes('--no-core'),
    contract: Number(flag('--contract', '1')),
  });
  console.log(`core skills: ${r.core.length}${r.coreDir ? '' : ' (OMITTED)'}`);
  console.log(`pack agents: ${PACK_AGENTS.length}, pack-local skills: ${r.local.length}`);
  console.log(r.coreDir ? `core: ${r.coreDir}` : 'core: not built');
  console.log(`pack: ${r.packDir}`);
} else {
  console.log('usage: node scripts/pack-preview.mjs --out <dir> [--no-core] [--contract N]');
  console.log('       node scripts/pack-preview.mjs --self-test');
}
