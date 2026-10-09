#!/usr/bin/env node
// The deterministic pack generator, and the host-behaviour preview it grew from.
//
// Two jobs, one partition (scripts/lib/pack-plan.mjs):
//   • generate  — refresh derived files around the LIVE plugin-local roster,
//     byte-stably, with a per-plugin plugin.json. `--write` also synchronises the
//     marked dependency-guard region without replacing authoritative bodies;
//     `--check` reports derived or managed-region drift.
//   • preview   — a throwaway committed-slice or five-plugin build (`--out`/`--all`) that
//     answers the host-behaviour questions gating the split: does a fail-closed
//     preflight hold on a real agent, what happens when core is absent or
//     version-skewed, which provider wins a name collision, and what a pack does
//     when it references an uninstalled pack. Preview output ships nothing.
//   • gate      — the same rules the self-test proves by mutation, run over the
//     live tree as four named CI gates (`--gate`), so a red build names the
//     guarantee that broke.
//   • ci        — the runtime-dependency legs CI runs, derived from the committed
//     pack set (`--ci-matrix`) and from the declared dependency plan
//     (`--ci-runtime-binaries <pack>`), so publishing a pack never means editing
//     the workflow to make that pack legal.
//
// Run: node scripts/pack-preview.mjs --check | --write
//      node scripts/pack-preview.mjs --out <dir> [--no-core] [--contract N] | --all
//      node scripts/pack-preview.mjs --self-test
//      node scripts/pack-preview.mjs --gate <partition|collision|partial-install|version-skew|all>
//      node scripts/pack-preview.mjs --ci-matrix | --ci-runtime-binaries <pack>
//
// Dependency-free (Node built-ins only), consistent with the rest of scripts/.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  parseFrontmatter, parseToolList,
} from '../src/core/lib/loader-contract.mjs';
import {
  PACKS, PACKS_DIR, COMMITTED_PACKS, PUBLISHED_PACKS, INCUBATED_PACKS, PACK_ORDER, CONTRACT_SKILL, CONTRACT_VERSION, REFUSAL,
  HOOKS_FILE, HOOKS_OWNER,
  packPluginName, sourceAssetIndex,
  planPacks, planManifests, materializePacks,
  normalizeLF,
  collectReferences, referenceErrors, packProviders,
  planAssets, assetOwnershipErrors, hooksAssignmentErrors,
  generatedKeyErrors, generatedRuntimeErrors, hookAssetReferenceErrors,
  partitionErrors, namespaceErrors, providerCollisionErrors, contractPinErrors,
  parseGeneratedKey, agentRoutingErrors,
  publicationSkillForPack, publicationEntrypointDeclaration, publicationRoutingErrors,
  ACTIVITY_EXEMPT, ACTING_EXEMPT,
  hookAssetsIn, agentSourceFile, skillSourceFile,
  sourceAgentFiles, sourceSkillFiles, skillCompanionFiles, sourceFileErrors,
  syncGuaranteeRegion, removeGuaranteeRegion,
} from './lib/pack-plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The partition, the contract-skill name and the refusal token live once in
// scripts/lib/pack-plan.mjs. Re-exported here so callers and the locked partition
// doc that name them on pack-preview keep resolving.
export {
  PACKS, CONTRACT_SKILL, CONTRACT_VERSION, REFUSAL, planPacks,
};

// The two-plugin preview defaults to learning, a capability with a real local
// method. It selects the canonical partition, never a second roster or a
// compatibility alias for the retired personal plugin.

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


// Legacy agents still carry a preflight in their own bodies; every agent now
// routes the probe just before its first core skill. This evaluator keeps the
// core-absent and version-skew behavior deterministic during staged migration.

// Deterministic evaluation of the preflight's own rule against a built preview:
// read what `kai-core-contract-v1` would return from the built core, if any, and
// apply the three conditions the preflight states. This is what makes the
// core-absent and version-skew arms answerable without a live host.
export function evaluatePreflight(out) {
  const probe = join(out, 'kai-core-preview', 'skills', CONTRACT_SKILL, 'SKILL.md');
  if (!existsSync(probe)) {
    return { ok: false, reply: REFUSAL, detail: `no ${CONTRACT_SKILL} skill is installed (core absent)` };
  }
  const text = normalizeLF(readFileSync(probe, 'utf8'));
  if (!/^KAI_CORE_READY$/m.test(text)) {
    return { ok: false, reply: REFUSAL, detail: `${CONTRACT_SKILL} returns no KAI_CORE_READY marker` };
  }
  const declared = text.match(/^contract:\s*(\S+)$/m);
  if (!declared) {
    return { ok: false, reply: REFUSAL, detail: `${CONTRACT_SKILL} returns no contract version` };
  }
  if (declared[1] !== CONTRACT_VERSION) {
    return {
      ok: false,
      reply: REFUSAL,
      detail: `core speaks contract ${declared[1]}, the preflight requires ${CONTRACT_VERSION} (version skew)`,
    };
  }
  return {
    ok: true,
    reply: null,
    detail: `core reports contract ${CONTRACT_VERSION} — department agents continue silently`,
  };
}

function reportPreflight(out) {
  const pf = evaluatePreflight(out);
  console.log(`\npreflight: ${pf.reply ?? 'ready'} — ${pf.detail}`);
}

// Core's copy of the probe: the real shipped skill, or a synthesized build when
// --contract asks for a version core does not actually speak. Skew is only
// testable if the preview can lie about the version on purpose.
const contractSkillText = (contract) => (contract === 1
  ? normalizeLF(readFileSync(skillPath(CONTRACT_SKILL), 'utf8'))
  : contractSkill(contract));

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
  withCore = true, contract = 1 }) {
  rmSync(out, { recursive: true, force: true });
  const plan = planPacks();
  const built = [];

  if (withCore) {
    const dir = join(out, 'kai-core-preview');
    writePlugin(dir, 'kai-core-preview', 'Preview of the kai shared core. Not for use.',
      PACKS.core, plan.core);
    // plan.core already copied the real probe; this rewrite is what a --contract
    // other than 1 uses to build a core the agents must refuse.
    writeSkill(dir, CONTRACT_SKILL, contractSkillText(contract));
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

// Synthesize a probe reporting an arbitrary contract version. Only the skew arms
// use this: contract 1 is served by the real shipped skill.
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
export function build({ out, withCore = true, contract = 1, pack = 'learning' }) {
  const { plan } = buildAll({ out, packs: [pack], withCore, contract });
  return {
    coreDir: withCore ? join(out, 'kai-core-preview') : null,
    packDir: join(out, `kai-${pack}-preview`),
    agents: PACKS[pack],
    core: plan.core,
    local: plan.local[pack],
  };
}

// ---------------------------------------------------------------------------
// Committed pack trees — the deterministic generator (materialise + diff)
//
// Unlike the preview above, this path generates only derived plugin files:
// manifests, dependency locks, routed non-markdown assets, and hooks. Agent and
// skill bodies are authoritative in plugins/ and are never replaced wholesale.
// `--write` may update only the explicitly marked core-dependency guard region
// inside department agents and the publication table region inside each pack's
// publication skill.
// ---------------------------------------------------------------------------

// Stamp generated packs in lockstep with the monolith. Falls back to the preview
// version when plugin.json is unreadable, so the generator never hard-fails here.
function committedVersion() {
  try { return JSON.parse(readFileSync(join(ROOT, 'plugin.json'), 'utf8')).version || '0.0.0-preview'; }
  catch { return '0.0.0-preview'; }
}

// Every file present under a committed tree, as pack-relative forward-slash keys
// (never OS separators), so it compares directly against the generator's plan.
function walkCommitted(base) {
  const out = [];
  const ignored = new Set(['.DS_Store', 'Thumbs.db']);
  const walk = (dir, prefix) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      if (ignored.has(e.name)) continue;
      const key = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(dir, e.name), key);
      else out.push(key);
    }
  };
  walk(base, '');
  return out;
}

const isSourceKey = (key) => {
  const entry = parseGeneratedKey(key);
  return entry?.kind === 'agent' || entry?.kind === 'skill' || entry?.kind === 'skill-companion';
};

const isDerivedOwnedKey = (key) => {
  const entry = parseGeneratedKey(key);
  if (!entry) return false;
  if (['manifest', 'package', 'lock', 'hooks'].includes(entry.kind)) return true;
  return entry.kind === 'other' && key.startsWith(`${entry.dir}/scripts/`);
};

const isSourceCompanionKey = (key, root) => {
  const [dir, area, id, ...rest] = key.split('/');
  if (area === 'publication.json' && id === undefined) {
    return PACK_ORDER.some((pack) => packPluginName(pack) === dir);
  }
  if (area === 'templates' && rest.length > 0) {
    return PACK_ORDER.some((pack) => packPluginName(pack) === dir);
  }
  if (area !== 'skills' || rest.length === 0) return false;
  return sourceSkillFiles(root)
    .some((entry) => packPluginName(entry.pack) === dir && entry.id === id);
};

const derivedFiles = (files) => new Map([...files].filter(([key]) => !isSourceKey(key)));

function cleanStaleDerivedFiles(base, files) {
  for (const key of walkCommitted(base)) {
    if (files.has(key) || !isDerivedOwnedKey(key)) continue;
    rmSync(join(base, ...key.split('/')), { force: true });
  }
}

// Whether an agent still declares an eager `**Inherits:**` line. That single
// fact — read from the agent's own text, with no pack allowlist or registry —
// decides how its guard region is managed: an inheriting agent keeps the
// region as its only core-dependency guard; a migrated agent on inline routes
// must not carry one, so a stale region is stripped. The rule is correct for
// every agent today and self-corrects as each remaining pack migrates.
const declaresInherits = (body) => /^\*\*Inherits:\*\*/m.test(body);

function managedAgentDrift(root) {
  const drift = [];
  for (const entry of sourceAgentFiles(root)) {
    const raw = normalizeLF(readFileSync(entry.path, 'utf8'));
    try {
      if (declaresInherits(raw)) continue;
      if (syncGuaranteeRegion(raw) !== raw) {
        drift.push(`differs:    ${entry.rel} (managed core dependency guard)`);
      }
    } catch (e) {
      drift.push(`differs:    ${entry.rel} (${e.message})`);
    }
  }
  return drift;
}

// Regenerate derived files and diff them against what is committed. Agent and
// skill bodies are source. A configured tree that is absent fails with the
// command that regenerates its derived surface.
export function checkCommitted({ root = ROOT, base = join(ROOT, PACKS_DIR), version = committedVersion() } = {}) {
  if (!existsSync(base)) {
    if (COMMITTED_PACKS.length === 0) {
      return { ok: true, drift: [], note: `no committed packs configured — ${PACKS_DIR}/ is intentionally absent` };
    }
    return {
      ok: false,
      drift: [`missing:    ${PACKS_DIR}/`],
      note: `committed packs are configured — regenerate with: node scripts/pack-preview.mjs --write`,
    };
  }
  const expected = derivedFiles(materializePacks({ root, version, packs: COMMITTED_PACKS }));
  const drift = managedAgentDrift(root);
  for (const [relPath, content] of expected) {
    const abs = join(base, ...relPath.split('/'));
    if (!existsSync(abs)) { drift.push(`missing:    ${relPath}`); continue; }
    if (normalizeLF(readFileSync(abs, 'utf8')) !== content) drift.push(`differs:    ${relPath}`);
  }
  for (const key of walkCommitted(base)) {
    if (!expected.has(key) && !isSourceKey(key) && !isSourceCompanionKey(key, root)) {
      drift.push(`unexpected: ${key}`);
    }
  }
  return { ok: drift.length === 0, drift };
}

// Update managed source regions, then materialise derived files without
// deleting authoritative agent or skill sources.
export function writeCommitted({ root = ROOT, base = join(ROOT, PACKS_DIR), version = committedVersion() } = {}) {
  if (COMMITTED_PACKS.length === 0) {
    throw new Error('no committed packs configured; the extraction item must set COMMITTED_PACKS first');
  }
  let managed = 0;
  for (const entry of sourceAgentFiles(root)) {
    const raw = normalizeLF(readFileSync(entry.path, 'utf8'));
    if (declaresInherits(raw)) continue;
    const next = removeGuaranteeRegion(raw);
    if (next !== raw) {
      writeFileSync(entry.path, next);
      managed += 1;
    }
  }
  const files = derivedFiles(materializePacks({ root, version, packs: COMMITTED_PACKS }));
  for (const [relPath, content] of files) {
    const abs = join(base, ...relPath.split('/'));
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  cleanStaleDerivedFiles(base, files);
  return { written: files.size, managed, dir: base };
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

  const scratch = join(ROOT, 'test', '.pack-preview-self-test');
  rmSync(scratch, {recursive: true, force: true});
  try {
    const noCore = join(scratch, 'no-core');
    buildAll({out: noCore, packs: ['creative'], withCore: false});
    ok(evaluatePreflight(noCore).reply === REFUSAL,
      'missing Core contract fails closed');

    const skew = join(scratch, 'version-skew');
    buildAll({out: skew, packs: ['creative'], contract: 2});
    ok(evaluatePreflight(skew).reply === REFUSAL,
      'version-skewed Core contract fails closed');
  } finally {
    rmSync(scratch, {recursive: true, force: true});
  }

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
  ok(publicationRoutingErrors({
    pack: 'engineering',
    id: 'bypass',
    kind: 'skill',
    body: 'Load `kai-core-asset-producing` now.',
    fm: {},
  }).some(message => /direct `kai-core-asset-producing` route/.test(message)),
  'direct asset-producing bypass is rejected');

  const missingBase = join(ROOT, 'test', '.pack-preview-missing');
  rmSync(missingBase, {recursive: true, force: true});
  const missingCheck = checkCommitted({
    root: ROOT,
    base: missingBase,
    version: '0.0.0-self-test',
  });
  ok(!missingCheck.ok && missingCheck.drift.includes(`missing:    ${PACKS_DIR}/`),
    'missing generated file surface is rejected');

  ok(generatedRuntimeErrors(new Map([
    ['kai-core/plugin.json', '{}'],
    ['kai-core/scripts/start.mjs', "import runtime from '@scope/runtime';\n"],
  ])).some(error => /imports bare module/.test(error.msg)),
  'external runtime import is rejected');

  const observer = 'scripts/observe-subagent.mjs';
  ok(hooksAssignmentErrors({
    owners: [HOOKS_OWNER],
    hookAssets: [observer],
    assets: new Map([[observer, {
      asset: observer,
      consumers: [],
      packs: new Set(['engineering']),
      owner: 'engineering',
    }]]),
  }).some(error => /owned by kai-engineering/.test(error.msg)),
  'hooks owned by the wrong package are rejected');

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
// guarantee broke — "partition" and "version-skew" are different problems with
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

// The scripts hooks.json runs, read out of the file itself so the gate cannot
// drift from what the host would execute.
function liveHookAssets() {
  const path = join(ROOT, HOOKS_FILE);
  return existsSync(path) ? hookAssetsIn(readFileSync(path, 'utf8')) : [];
}

// A department installed with kai-core and nothing else: every reference
// resolves, every invoked script travels with the pack that invokes it, and
// hooks has one owner. There is one agent shape now, so there is no guard block
// to police here — agent routing is gated in gateSkew.
function gatePartialInstall() {
  const files = materializePacks({ root: ROOT, version: GATE_VERSION });
  const refs = collectReferences(ROOT);
  const assets = planAssets(refs);
  const claimants = [...files.keys()]
    .map((key) => parseGeneratedKey(key))
    .filter((entry) => entry && entry.kind === 'hooks')
    .map((entry) => entry.pack);
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
    ...hooksAssignmentErrors({
      owners: [...new Set([HOOKS_OWNER, ...claimants])],
      hookAssets: liveHookAssets(),
      assets,
    }),
    ...hookAssetReferenceErrors(readFileSync(join(ROOT, HOOKS_FILE), 'utf8')),
  ].map((e) => `${e.file}: ${e.msg}`);
}

// The contract version wherever it is stated, and the one agent shape: every
// agent must route the pinned probe first, load its required contracts inline,
// and state its non-blocking single-shot fallback.
function gateSkew() {
  const errs = contractPinErrors({
    probe: existsSync(skillPath(CONTRACT_SKILL))
      ? readFileSync(skillPath(CONTRACT_SKILL), 'utf8')
      : null,
  }).map((e) => `${e.file}: ${e.msg}`);

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

  const dir = join(ROOT, 'test', '.pack-preview-gate-skew');
  rmSync(dir, {recursive: true, force: true});
  try {
    const arm = (name, opts) => {
      const out = join(dir, name);
      buildAll({ out, packs: ['creative'], ...opts });
      return evaluatePreflight(out);
    };
    const ready = arm('ready', {});
    const absent = arm('no-core', { withCore: false });
    const skew = arm('skew', { contract: 2 });
    if (!ready.ok) errs.push(`a real core does not pass its own preflight: ${ready.detail}`);
    if (absent.reply !== REFUSAL) {
      errs.push(`an absent core does not fail closed with ${REFUSAL}: ${absent.detail}`);
    }
    if (skew.reply !== REFUSAL) {
      errs.push(`a core speaking another contract version does not fail closed with ${REFUSAL}: ${skew.detail}`);
    }
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
  return errs;
}

const GATES = new Map([
  ['partition', gatePartition],
  ['collision', gateCollision],
  ['partial-install', gatePartialInstall],
  ['version-skew', gateSkew],
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
} else if (args.includes('--check')) {
  const r = checkCommitted();
  if (r.ok) {
    console.log(`\u2713 pack-preview --check: ${r.note ?? `${PACKS_DIR}/ matches the generator`}`);
    process.exit(0);
  }
  console.error(`\u2717 pack-preview --check: ${r.drift.length} drift(s) between ${PACKS_DIR}/ and the generator\n`);
  for (const d of r.drift) console.error(`  ${d}`);
  console.error('\n  regenerate with: node scripts/pack-preview.mjs --write');
  process.exit(1);
} else if (args.includes('--write')) {
  const r = writeCommitted();
  console.log(`pack-preview --write: ${r.written} derived file(s), ${r.managed} managed agent region(s) -> ${r.dir}`);
} else if (args.includes('--all')) {
  const packsArg = flag('--packs', '');
  const out = flag('--out');
  const r = buildAll({
    out,
    packs: packsArg ? packsArg.split(',') : undefined,
    withCore: !args.includes('--no-core'),
    contract: Number(flag('--contract', '1')),
  });
  for (const b of r.built) {
    console.log(`  ${b.name.padEnd(28)} ${String(b.agents).padStart(2)} agents  ${b.dir}`);
  }
  console.log(`\ncore skills: ${r.plan.core.length}`);
  for (const [p, l] of Object.entries(r.plan.local)) {
    if (l.length) console.log(`  ${p} owns ${l.length}: ${l.join(', ')}`);
  }
  reportPreflight(out);
} else if (args.includes('--out')) {
  const out = flag('--out');
  const r = build({
    out,
    withCore: !args.includes('--no-core'),
    contract: Number(flag('--contract', '1')),
  });
  console.log(`core skills: ${r.core.length}${r.coreDir ? '' : ' (OMITTED)'}`);
  console.log(`pack agents: ${r.agents.length}, pack-local skills: ${r.local.length}`);
  console.log(r.coreDir ? `core: ${r.coreDir}` : 'core: not built');
  console.log(`pack: ${r.packDir}`);
  reportPreflight(out);
} else {
  console.log('usage: node scripts/pack-preview.mjs --check          (regenerate + diff committed plugins/)');
  console.log('       node scripts/pack-preview.mjs --write          (materialise committed plugins/)');
  console.log('       node scripts/pack-preview.mjs --out <dir> [--no-core] [--contract N]');
  console.log('       node scripts/pack-preview.mjs --all --out <dir>');
  console.log('       node scripts/pack-preview.mjs --self-test');
  console.log(`       node scripts/pack-preview.mjs --gate <${[...GATES.keys()].join('|')}|all>`);
}