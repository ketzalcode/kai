#!/usr/bin/env node
// Host-behaviour previews and structural pack gates.
//
// Two jobs, one partition (tools/lib/pack-plan.mjs):
//   • preview   — a throwaway committed-slice or multi-plugin build (`--out`/`--all`) that
//     answers the host-behaviour questions gating the split: which provider wins
//     a name collision and what a pack does when it references an uninstalled
//     pack. Preview output ships nothing.
//   • gate      — the same rules the self-test proves by mutation, run over the
//     live tree as four named CI gates (`--gate`), so a red build names the
//     guarantee that broke.
//   • ci        — the runtime-dependency legs CI runs, derived from the committed
//     pack set (`--ci-matrix`) and from the declared dependency plan
//     (`--ci-runtime-binaries <pack>`), so publishing a pack never means editing
//     the workflow to make that pack legal.
//
// Run: node tools/pack-preview.mjs --out <dir> [--no-core] | --all
//      node tools/pack-preview.mjs --self-test
//      node tools/pack-preview.mjs --gate <partition|collision|partial-install|routing|all>
//      node tools/pack-preview.mjs --ci-matrix | --ci-runtime-binaries <pack>
//
import {
  readFileSync, writeFileSync, mkdirSync, rmSync, existsSync,
} from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseFrontmatter, parseToolList,
} from '../src/core/lib/loader-contract.mjs';
import {
  PACKS, PUBLISHED_PACKS, INCUBATED_PACKS, PACK_ORDER,
  packPluginName, sourceAssetIndex,
  planPacks, planManifests, materializePacks,
  normalizeLF,
  collectReferences, referenceErrors, packProviders,
  planAssets, assetOwnershipErrors,
  generatedKeyErrors, generatedRuntimeErrors,
  partitionErrors, namespaceErrors, providerCollisionErrors,
  agentRoutingErrors,
  publicationSkillForPack, publicationEntrypointDeclaration, publicationRoutingErrors,
  ACTIVITY_EXEMPT, ACTING_EXEMPT,
  agentSourceFile, skillSourceFile,
  sourceAgentFiles, sourceSkillFiles, skillCompanionFiles, sourceFileErrors,
} from './lib/pack-plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The partition lives once in tools/lib/pack-plan.mjs and is re-exported for
// callers that build previews.
export { PACKS, planPacks };

// The two-plugin preview defaults to learning, a capability with a real local
// method. It selects the canonical partition.

const readAgent = (id) => readFileSync(agentSourceFile(ROOT, id), 'utf8');
const skillPath = (id) => skillSourceFile(ROOT, id);

// Every agent and skill on disk, which is what the partition is checked against:
// the roster in PACKS is a claim about this list, not a substitute for it.
const rosterAgentIds = () => sourceAgentFiles(ROOT).map((entry) => entry.id).sort();

const rosterSkillIds = () => sourceSkillFiles(ROOT).map((entry) => entry.id).sort();

const declaredTools = (body) => {
  const parsed = parseFrontmatter(body);
  return new Set(parsed.ok ? parseToolList(parsed.fm.tools) || [] : []);
};

const frontmatter = (body) => normalizeLF(body).match(/^---\n[\s\S]*?\n---/)?.[0] ?? null;


// The pack partition (PACKS) and the skill->provider rule (planPacks) are
// defined once in scripts/lib/pack-plan.mjs and imported above.

function writePlugin(dir, name, description, agentIds, skills) {
  mkdirSync(dir, { recursive: true });
  const manifest = { name, version: '0.0.0-preview', description, skills: 'skills' };
  if (agentIds.length) manifest.agents = 'agents';
  writeFileSync(join(dir, 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (agentIds.length) {
    mkdirSync(join(dir, 'agents'), { recursive: true });
    for (const id of agentIds) {
      const body = readAgent(id);
      writeFileSync(join(dir, 'agents', `${id}.agent.md`), normalizeLF(body));
    }
  }
  for (const s of skills) {
    writeSkill(dir, s, readFileSync(skillPath(s), 'utf8'), skillCompanionFiles(ROOT, s));
  }
}

// Materialise core plus any subset of the departments. A subset is the point:
// the interesting failures are what a pack does when a pack it references is
// not installed, and what core alone can still do.
export function buildAll({ out, packs = Object.keys(PACKS).filter((p) => p !== 'core'),
  withCore = true }) {
  rmSync(out, { recursive: true, force: true });
  const plan = planPacks();
  const built = [];

  if (withCore) {
    const dir = join(out, 'kai-core-preview');
    writePlugin(dir, 'kai-core-preview', 'Preview of the kai shared core. Not for use.',
      PACKS.core, plan.core);
    built.push({ name: 'kai-core-preview', dir, agents: PACKS.core.length });
  }

  for (const p of packs) {
    const dir = join(out, `kai-${p}-preview`);
    writePlugin(dir, `kai-${p}-preview`, `Preview of the kai ${p} department. Not for use.`,
      PACKS[p], plan.local[p]);
    built.push({ name: `kai-${p}-preview`, dir, agents: PACKS[p].length });
  }
  return { built, plan };
}

function writeSkill(dir, id, text, companions = []) {
  mkdirSync(join(dir, 'skills', id), { recursive: true });
  writeFileSync(join(dir, 'skills', id, 'SKILL.md'), normalizeLF(text));
  for (const companion of companions) {
    const target = join(dir, 'skills', id, ...companion.rel.split('/'));
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, normalizeLF(readFileSync(companion.path, 'utf8')));
  }
}

// The two-plugin preview `--out` builds: core plus one department. It is a
// selection of the same partition `--all` uses, so the roster it ships can no
// longer disagree with PACKS.
export function build({ out, withCore = true, pack = 'learning' }) {
  const { plan } = buildAll({ out, packs: [pack], withCore });
  return {
    coreDir: withCore ? join(out, 'kai-core-preview') : null,
    packDir: join(out, `kai-${pack}-preview`),
    agents: PACKS[pack],
    core: plan.core,
    local: plan.local[pack],
  };
}

// ---------------------------------------------------------------------------
// Self-test
// ---------------------------------------------------------------------------
function selfTest() {
  let pass = 0;
  const fails = [];
  const ok = (condition, message) => {
    if (condition) {
      pass += 1;
      console.log(`  ok ${message}`);
    } else {
      fails.push(message);
      console.log(`  FAIL ${message}`);
    }
  };

  const world = {
    plan: {
      core: ['kai-core-shared'],
      local: {core: [], engineering: ['engineering-skill']},
      orphans: [],
    },
    agents: ['director-a'],
    skills: ['kai-core-shared', 'engineering-skill'],
    packs: {core: ['director-a'], engineering: []},
  };
  ok(partitionErrors({
    ...world,
    packs: {core: ['director-a', 'director-missing'], engineering: []},
  }).some(message => /director-missing.*not on disk/.test(message)),
  'missing agent ID is rejected');
  ok(partitionErrors({
    ...world,
    plan: {...world.plan, local: {core: [], engineering: ['kai-core-shared']}},
  }).some(message => /provided by both kai-core and kai-engineering/.test(message)),
  'duplicate skill provider is rejected');

  ok(referenceErrors({
    refs: [{
      from: 'plugins/kai-engineering/agents/x.agent.md',
      fromPack: 'engineering',
      firing: ['loaded'],
      kind: 'skill',
      target: 'creative-only',
    }],
    providers: new Map([['skill:creative-only', ['creative']]]),
  }).some(error => /may only reach its own pack or kai-core/.test(error.msg)),
  'foreign package reference is rejected');

  ok(namespaceErrors({core: [], local: {engineering: ['kai-core-sneaky']}})
    .some(message => /claims core's `kai-core-\*` namespace/.test(message)),
  'namespace escape is rejected');

  const routedSources = [
    ...sourceAgentFiles(ROOT),
    ...sourceSkillFiles(ROOT),
  ].map(entry => ({...entry, body: readFileSync(entry.path, 'utf8')}));
  const producer = routedSources.find(entry =>
    publicationEntrypointDeclaration(entry) !== null);
  const owner = producer && publicationSkillForPack(producer.pack);
  const foreignPublication = producer?.pack === 'creative'
    ? 'engineering-workspace-publication'
    : 'creative-workspace-publication';
  ok(Boolean(producer) && publicationRoutingErrors({
    ...producer,
    body: producer.body.replace(/^\s*publication-entrypoint:\s*\S+\s*$/m, ''),
  }).some(message => /requires frontmatter/.test(message)),
  'missing publication entrypoint is rejected');
  ok(Boolean(producer) && publicationRoutingErrors({
    ...producer,
    body: producer.body.replace(
      `publication-entrypoint: ${owner}`,
      `publication-entrypoint: ${foreignPublication}`,
    ),
  }).some(message => /belongs to another pack/.test(message)),
  'foreign publication entrypoint is rejected');
  ok(generatedRuntimeErrors(new Map([
    ['kai-core/plugin.json', '{}'],
    ['kai-core/scripts/start.mjs', "import runtime from '@scope/runtime';\n"],
  ])).some(error => /imports bare module/.test(error.msg)),
  'external runtime import is rejected');

  ok(sourceFileErrors({agents: [], skills: []})
    .filter(error => /active (?:agent|skill) source corpus is empty/.test(error.msg)).length === 2,
  'empty active corpus is rejected');

  console.log(`\npack-preview self-test: ${pass} checks passed${fails.length ? `, ${fails.length} FAILED` : ''}`);
  return fails.length === 0;
}

// ---------------------------------------------------------------------------
// CI gates
//
// The self-test proves each rule with a mutation. These run the same functions
// over the live tree, split into four named gates so a red build says which
// guarantee broke — "partition" and "routing" are different problems with
// different owners, and a single "self-test failed" line makes the reader go
// find out which. Every gate is a pure read of the repository.
// ---------------------------------------------------------------------------
const GATE_VERSION = '0.0.0-gate';

// Every agent and skill has exactly one physical package provider, core's
// namespace is respected in both directions, and role availability is still
// decided by roster membership.
function gatePartition() {
  const plan = planPacks(ROOT);
  return [
    ...partitionErrors({ plan, agents: rosterAgentIds(), skills: rosterSkillIds() }),
    ...namespaceErrors({ core: plan.core, local: plan.local }),
  ];
}

// Two packs emitting one id. Duplicate-provider behavior differs by host and
// namespace surface, so this is checked over what the generator actually emits
// rather than over the plan that produced it.
function gateCollision() {
  const files = materializePacks({ root: ROOT, version: GATE_VERSION });
  return [
    ...generatedKeyErrors(files).map((e) => `${e.file}: ${e.msg}`),
    ...generatedRuntimeErrors(files).map((e) => `${e.file}: ${e.msg}`),
    ...providerCollisionErrors({ providers: packProviders(files) }),
  ];
}

// A department installed with kai-core and nothing else: every reference
// resolves, every invoked script travels with the pack that invokes it, and
// hooks has one owner. There is one agent shape now, so there is no guard block
// to police here — agent routing is gated in gateRouting.
function gatePartialInstall() {
  const files = materializePacks({ root: ROOT, version: GATE_VERSION });
  const refs = collectReferences(ROOT);
  const assets = planAssets(refs);
  return [
    ...generatedKeyErrors(files),
    ...generatedRuntimeErrors(files),
    ...referenceErrors({ refs, providers: packProviders(files) }),
    ...assetOwnershipErrors({
      assets,
      // Shipped key -> source under src/<pack>/; the gate must resolve the
      // same way the generator does or it reports every asset as missing.
      exists: (asset) => sourceAssetIndex(ROOT).has(asset),
    }),
  ].map((e) => `${e.file}: ${e.msg}`);
}

// Every agent loads its required contracts inline.
function gateRouting() {
  const errs = [];
  const knownSkills = new Set(rosterSkillIds());
  const knownAgents = new Set(sourceAgentFiles(ROOT).map((a) => a.id));
  for (const agent of sourceAgentFiles(ROOT)) {
    const body = readFileSync(agent.path, 'utf8');
    for (const msg of agentRoutingErrors({
      id: agent.id,
      pack: agent.pack,
      body,
      tools: declaredTools(body),
      knownSkills,
      knownAgents,
      activityExempt: ACTIVITY_EXEMPT.has(agent.id),
      actingExempt: ACTING_EXEMPT.has(agent.id),
    })) {
      errs.push(`${agent.rel}: ${msg}`);
    }
  }

  return errs;
}

const GATES = new Map([
  ['partition', gatePartition],
  ['collision', gateCollision],
  ['partial-install', gatePartialInstall],
  ['routing', gateRouting],
]);

function runGates(name) {
  const selected = name === 'all' ? [...GATES.keys()] : [name];
  const unknown = selected.filter((g) => !GATES.has(g));
  if (unknown.length) {
    console.error(`\u2717 unknown gate(s): ${unknown.join(', ')}`);
    console.error(`  available: ${[...GATES.keys()].join(', ')}, all`);
    return false;
  }
  let failed = 0;
  for (const gate of selected) {
    const errs = GATES.get(gate)();
    if (errs.length === 0) {
      console.log(`\u2713 gate ${gate}: clean`);
      continue;
    }
    failed += 1;
    console.error(`\u2717 gate ${gate}: ${errs.length} violation(s)`);
    for (const msg of errs) console.error(`  ${msg}`);
  }
  return failed === 0;
}

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };
if (args.includes('--self-test')) {
  process.exit(selfTest() ? 0 : 1);
} else if (args.includes('--gate')) {
  process.exit(runGates(flag('--gate', 'all')) ? 0 : 1);
} else if (args.includes('--all')) {
  const packsArg = flag('--packs', '');
  const out = flag('--out');
  const r = buildAll({
    out,
    packs: packsArg ? packsArg.split(',') : undefined,
    withCore: !args.includes('--no-core'),
  });
  for (const b of r.built) {
    console.log(`  ${b.name.padEnd(28)} ${String(b.agents).padStart(2)} agents  ${b.dir}`);
  }
  console.log(`\ncore skills: ${r.plan.core.length}`);
  for (const [p, l] of Object.entries(r.plan.local)) {
    if (l.length) console.log(`  ${p} owns ${l.length}: ${l.join(', ')}`);
  }
} else if (args.includes('--out')) {
  const out = flag('--out');
  const r = build({
    out,
    withCore: !args.includes('--no-core'),
  });
  console.log(`core skills: ${r.core.length}${r.coreDir ? '' : ' (OMITTED)'}`);
  console.log(`pack agents: ${r.agents.length}, pack-local skills: ${r.local.length}`);
  console.log(r.coreDir ? `core: ${r.coreDir}` : 'core: not built');
  console.log(`pack: ${r.packDir}`);
} else {
  console.error('usage: node tools/pack-preview.mjs --out <dir> [--no-core]');
  console.error('       node tools/pack-preview.mjs --all --out <dir>');
  console.error('       node tools/pack-preview.mjs --self-test');
  console.error(`       node tools/pack-preview.mjs --gate <${[...GATES.keys()].join('|')}|all>`);
  process.exit(1);
}