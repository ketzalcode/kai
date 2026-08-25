#!/usr/bin/env node
// The deterministic pack generator, and the host-behaviour preview it grew from.
//
// Two jobs, one partition (scripts/lib/pack-plan.mjs):
//   • generate  — materialise the pack trees from the LIVE root roster, byte-stably,
//     with a per-pack plugin.json. `--write` lands them under packs/; `--check`
//     regenerates and diffs so a hand-edit or a stale copy fails. The committed
//     trees themselves land in a downstream item; this ships the machinery.
//   • preview   — a throwaway two- or five-plugin build (`--out`/`--all`) that
//     answers the host-behaviour questions gating the split: does a fail-closed
//     preflight hold on a real agent, what happens when core is absent or
//     version-skewed, which provider wins a name collision, and what a pack does
//     when it references an uninstalled pack. Preview output ships nothing.
//
// Run: node scripts/pack-preview.mjs --check | --write
//      node scripts/pack-preview.mjs --out <dir> [--no-core] [--contract N] | --all
//      node scripts/pack-preview.mjs --self-test
//
// Dependency-free (Node built-ins only), consistent with the rest of scripts/.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import {
  PACKS, PACKS_DIR, COMMITTED_PACKS, CONTRACT_SKILL, CONTRACT_VERSION, REFUSAL,
  SKILL_OWNER_OVERRIDES, HOOKS_FILE, HOOKS_OWNER,
  planPacks, planManifests, materializePacks, preflightBlock, injectPreflight,
  manifestParityErrors, marketplaceConsistencyErrors, normalizeLF,
  inheritedSkills as inheritedSkillsOf,
  collectReferences, referenceErrors, packProviders,
  planAssets, assetOwnershipErrors, hooksAssignmentErrors,
} from './lib/pack-plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The partition, the contract-skill name, the refusal token and the canonical
// preflight injection live once in scripts/lib/pack-plan.mjs. Re-exported here
// so callers and the locked partition doc that name them on pack-preview keep
// resolving.
export {
  PACKS, CONTRACT_SKILL, CONTRACT_VERSION, REFUSAL, planPacks, preflightBlock, injectPreflight,
};

// The narrow pack under test. Personal roles are chosen deliberately: they are
// the department whose removal from a default install is most defensible, and
// the one #29 named, so the preview doubles as a dry run of the split we would
// most likely ship first.
export const PACK_AGENTS = [
  'persona-professional-nutritionist', 'persona-professional-trainer', 'persona-self',
  'instructor-tutor', 'instructor-teacher', 'instructor-path-mentor',
  'creative-video-director', 'principal-engineer-career-mentor', 'workflow-course-to-audio',
];

const readAgent = (id) => readFileSync(join(ROOT, 'agents', `${id}.agent.md`), 'utf8');
const skillPath = (id) => join(ROOT, 'skills', id, 'SKILL.md');

const inheritedSkills = (body) => inheritedSkillsOf(ROOT, body);

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
// the block is duplicated per agent rather than referenced, and why the
// canonical text and the injection both live in scripts/lib/pack-plan.mjs.

// Deterministic evaluation of the injected block's own rule against a built
// preview: read what `kai-core-contract-v1` would return from the built core, if
// any, and apply the three conditions the block states. This is what makes the
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
      detail: `core speaks contract ${declared[1]}, the injected block requires ${CONTRACT_VERSION} (version skew)`,
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

// The five-pack partition (PACKS) and the skill->provider rule (planPacks) are
// defined once in scripts/lib/pack-plan.mjs and imported above.

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
      PACKS.core, plan.core, null);
    // plan.core already copied the real probe; this rewrite is what a --contract
    // other than 1 uses to build a core the agents must refuse.
    writeSkill(dir, CONTRACT_SKILL, contractSkillText(contract));
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
    writeSkill(coreDir, CONTRACT_SKILL, contractSkillText(contract));
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
// Committed pack trees — the deterministic generator (materialise + diff)
//
// Unlike the preview above, this path is the authoritative generator: it copies
// skill and core-agent bodies verbatim from root (root stays the single source of
// truth), injects the canonical fail-closed preflight into every department
// agent, stamps a per-pack plugin.json, and normalises to LF so the output is
// byte-identical on every platform. The degraded-mode block and non-markdown
// asset routing are added by downstream items.
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
  const walk = (dir, prefix) => {
    for (const e of readdirSync(dir, { withFileTypes: true })) {
      const key = prefix ? `${prefix}/${e.name}` : e.name;
      if (e.isDirectory()) walk(join(dir, e.name), key);
      else out.push(key);
    }
  };
  walk(base, '');
  return out;
}

// Regenerate the pack trees from root and diff against what is committed. Drift —
// a hand-edit, a stale copy, a missing or an extra file — fails, so a committed
// tree can only ever be exactly what the generator produces. With nothing
// committed yet (this item ships the machinery; the trees land downstream) there
// is nothing to verify and the check passes.
export function checkCommitted({ root = ROOT, base = join(ROOT, PACKS_DIR), version = committedVersion() } = {}) {
  if (!existsSync(base) && COMMITTED_PACKS.length === 0) {
    return { ok: true, drift: [], note: `no committed packs configured — ${PACKS_DIR}/ is intentionally absent` };
  }
  const expected = materializePacks({ root, version, packs: COMMITTED_PACKS });
  const drift = [];
  for (const [relPath, content] of expected) {
    const abs = join(base, ...relPath.split('/'));
    if (!existsSync(abs)) { drift.push(`missing:    ${relPath}`); continue; }
    if (normalizeLF(readFileSync(abs, 'utf8')) !== content) drift.push(`differs:    ${relPath}`);
  }
  for (const key of walkCommitted(base)) {
    if (!expected.has(key)) drift.push(`unexpected: ${key}`);
  }
  return { ok: drift.length === 0, drift };
}

// Materialise the trees to `base`, replacing any existing tree so the output is
// exactly the plan with no stale leftovers. Used by the downstream item that
// lands the committed trees; wired here as the generator's write path.
export function writeCommitted({ root = ROOT, base = join(ROOT, PACKS_DIR), version = committedVersion() } = {}) {
  if (COMMITTED_PACKS.length === 0) {
    throw new Error('no committed packs configured; the extraction item must set COMMITTED_PACKS first');
  }
  rmSync(base, { recursive: true, force: true });
  const files = materializePacks({ root, version, packs: COMMITTED_PACKS });
  for (const [relPath, content] of files) {
    const abs = join(base, ...relPath.split('/'));
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, content);
  }
  return { written: files.size, dir: base };
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

  // --- the canonical fail-closed preflight -------------------------------
  const block = preflightBlock();
  const injected = injectPreflight(readAgent(PACK_AGENTS[0]), block);
  const injectedLines = injected.split('\n');
  const iInherits = injectedLines.findIndex((l) => l.startsWith('**Inherits:**'));
  const iPreflight = injectedLines.findIndex((l) => l.startsWith('## Core preflight'));
  ok(iInherits !== -1 && iPreflight > iInherits
    && injectedLines[iPreflight - 1] === '' && injectedLines[iPreflight - 2]?.startsWith('>'),
  'the preflight lands after the whole inherits directive, not between the line and the directive that binds it');
  ok(injected.split(block).length === 2,
    'the canonical block is copied in verbatim, exactly once');
  ok(injected.split('**Inherits:**').length === 2,
    'injection does not duplicate the inherits line CI pins to exactly one');
  ok(injected.includes(REFUSAL),
    'the agent carries the exact refusal token the test asserts on');
  ok(/^---\n/.test(injected) && !injected.includes('\r'),
    'frontmatter still opens the file and endings are uniform LF, so the host can load it');

  const noAnchor = injectPreflight('---\nname: x\n---\n\nbody\n', block);
  ok(noAnchor.includes(block) && noAnchor.startsWith('---\n'),
    'an agent with no inherits line still gets the preflight, under its frontmatter rather than above it');

  const shippedProbe = normalizeLF(readFileSync(skillPath(CONTRACT_SKILL), 'utf8'));
  ok(/^KAI_CORE_READY$/m.test(shippedProbe)
    && new RegExp(`^contract: ${CONTRACT_VERSION}$`, 'm').test(shippedProbe),
    'the shipped probe skill returns the rigid marker and pins contract 1');
  ok(contractSkill(2).includes('contract: 2'),
    'the preview can still synthesize a skewed core, or version skew is untestable');

  let arms = null;
  try {
    arms = mkdtempSync(join(tmpdir(), 'kai-preflight-'));
    const arm = (name, opts) => {
      const out = join(arms, name);
      buildAll({ out, packs: ['personal'], ...opts });
      return evaluatePreflight(out);
    };
    const ready = arm('ready', {});
    const noCore = arm('no-core', { withCore: false });
    const skew = arm('skew', { contract: 2 });
    ok(ready.ok && ready.reply === null,
      'against the real core the preflight is ready, and the agent continues silently');
    ok(noCore.reply === REFUSAL,
      `the core-absent arm fails closed with the exact ${REFUSAL} token`);
    ok(skew.reply === REFUSAL,
      'the contract-2 arm fails closed with the same exact token — absence and skew share one refusal path');
    ok(readFileSync(join(arms, 'ready', 'kai-personal-preview', 'agents', 'persona-self.agent.md'), 'utf8')
      .includes(block),
    'a built department agent carries the canonical block on disk, not only in memory');
  } catch (e) {
    ok(false, `preflight arms threw: ${e.message}`);
  } finally {
    if (arms) rmSync(arms, { recursive: true, force: true });
  }

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
  ok(plan.orphans.length === Object.keys(SKILL_OWNER_OVERRIDES).length,
    'skills no agent inherits remain visible as mechanical orphans before overrides');
  ok(plan.unplaced.length === 0,
    'every mechanical orphan has an explicit reviewed provider');
  ok(plan.core.includes('fleet-observation')
    && plan.local.personal.includes('create-product-demo')
    && plan.local.engineering.includes('review-dependencies'),
  'the generator applies the ratified core, personal, and engineering orphan dispositions');

  // --- generator determinism + committed-tree gate -----------------------
  const selectedPacks = ['core', 'personal'];
  const m1 = materializePacks({ root: ROOT, version: '9.9.9-selftest', packs: selectedPacks });
  const m2 = materializePacks({ root: ROOT, version: '9.9.9-selftest', packs: selectedPacks });
  ok([...m1.keys()].join('\n') === [...m2.keys()].join('\n')
    && [...m1].every(([k, v]) => m2.get(k) === v),
    'materialising the partition twice yields byte-identical output (re-running is stable)');
  ok([...m1.values()].every((v) => !v.includes('\r')),
    'generated files are LF-normalised, so output is identical on a CRLF checkout');
  ok(m1.has('kai-core/plugin.json') && m1.has('kai-personal/plugin.json')
    && m1.has('kai-personal/agents/persona-self.agent.md'),
    'the materialised tree places a per-pack plugin.json and copied agent bodies');
  ok(m1.get('kai-personal/agents/persona-self.agent.md').includes(block),
    'the authoritative generator injects the canonical preflight into department agents');
  ok(PACKS.core.every((id) => !m1.get(`kai-core/agents/${id}.agent.md`).includes(block)),
    'and never into a core agent, which ships inside the pack that provides the probe');
  ok(m1.has(`kai-core/skills/${CONTRACT_SKILL}/SKILL.md`),
    'core provides the probe the injected block tells department agents to invoke');
  ok(![...m1.keys()].some((key) => key.startsWith('kai-engineering/')),
    'a core-plus-personal slice does not materialise unselected departments');

  const manifests = planManifests({ root: ROOT, version: '9.9.9-selftest', packs: selectedPacks });
  const coreM = manifests.find((p) => p.pack === 'core');
  const personalM = manifests.find((p) => p.pack === 'personal');
  ok(coreM && coreM.manifest.name === 'kai-core' && coreM.manifest.skills === 'skills',
    'the generator plans a kai-core manifest with a skills path');
  ok(personalM && personalM.manifest.name === 'kai-personal'
    && personalM.manifest.agents === 'agents' && personalM.manifest.skills === 'skills',
    'a department manifest carries per-pack agents and skills paths');
  ok(manifests.every((p) => p.manifest.version === '9.9.9-selftest'),
    'every planned manifest stamps the version it was generated with (lockstep)');

  let scratch = null;
  try {
    scratch = mkdtempSync(join(tmpdir(), 'kai-pack-check-'));
    const generated = materializePacks({
      root: ROOT, version: '9.9.9-selftest', packs: selectedPacks,
    });
    for (const [relPath, content] of generated) {
      const abs = join(scratch, ...relPath.split('/'));
      mkdirSync(dirname(abs), { recursive: true });
      writeFileSync(abs, content);
    }
    const checkSelected = () => {
      const expected = materializePacks({
        root: ROOT, version: '9.9.9-selftest', packs: selectedPacks,
      });
      const drift = [];
      for (const [relPath, content] of expected) {
        const abs = join(scratch, ...relPath.split('/'));
        if (!existsSync(abs)) drift.push(`missing: ${relPath}`);
        else if (normalizeLF(readFileSync(abs, 'utf8')) !== content) drift.push(`differs: ${relPath}`);
      }
      return drift;
    };
    ok(checkSelected().length === 0,
      'a freshly generated tree passes the regenerate-and-diff check with no drift');
    const victim = join(scratch, 'kai-core', 'plugin.json');
    writeFileSync(victim, `${readFileSync(victim, 'utf8')}tampered`);
    ok(checkSelected().length > 0,
      'a hand-edit to a committed tree is caught as drift');
  } catch (e) {
    ok(false, `committed-tree check round-trip threw: ${e.message}`);
  } finally {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  }
  let writeRefused = false;
  try {
    writeCommitted({ root: ROOT, base: join(tmpdir(), 'kai-pack-write-must-refuse') });
  } catch (e) {
    writeRefused = /no committed packs configured/.test(e.message);
  }
  ok(writeRefused,
    '--write refuses until the downstream extraction item selects committed packs');
  ok(checkCommitted().ok,
    'with no committed pack selection yet, the check passes without creating all departments');

  // --- multi-manifest gate helpers (shared with validate-plugin) ---------
  const parity = manifestParityErrors(
    [{ rel: 'plugin.json', version: '1.2.3' },
      { rel: 'packs/kai-core/plugin.json', version: '1.2.3' },
      { rel: 'packs/kai-personal/plugin.json', version: '0.9.0' }],
    '1.2.3');
  ok(parity.length === 1 && parity[0].rel === 'packs/kai-personal/plugin.json',
    'manifest parity flags exactly the pack whose version drifts from canonical');
  ok(manifestParityErrors([{ rel: 'plugin.json', version: '1.2.3' }], '1.2.3').length === 0,
    'a lone monolith manifest at the canonical version raises no parity error (backwards compatible)');

  const mkt = (plugins) => ({ name: 'kai-plugins', owner: { name: 'x' }, plugins, metadata: { version: '1.2.3' } });
  const kaiEntry = { name: 'kai', source: '.', version: '1.2.3', description: 'd' };
  const coreEntry = { name: 'kai-core', source: './packs/kai-core', version: '1.2.3', description: 'core' };
  const known = { kai: { version: '1.2.3', description: 'd' }, 'kai-core': { version: '1.2.3', description: 'core' } };
  const mktArgs = (m) => ({ mkt: m, marketName: 'kai-plugins', monolithName: 'kai', canonicalVersion: '1.2.3', manifestsByName: known });
  ok(marketplaceConsistencyErrors(mktArgs(mkt([kaiEntry]))).length === 0,
    'the single-plugin marketplace still validates clean (no regression)');
  ok(marketplaceConsistencyErrors(mktArgs(mkt([kaiEntry, coreEntry]))).length === 0,
    'a marketplace listing multiple plugins validates when every entry agrees with its manifest');
  ok(marketplaceConsistencyErrors(mktArgs(mkt([kaiEntry, { ...coreEntry, version: '0.0.1' }])))
    .some((e) => /kai-core.*must equal plugin\.json version/.test(e)),
    'a marketplace entry whose version disagrees with its plugin.json is caught');
  ok(marketplaceConsistencyErrors(mktArgs(mkt([coreEntry])))
    .some((e) => /no entry named "kai"/.test(e)),
    'the monolith entry is still required until the flip retires it');

  // --- cross-pack references: the live corpus ---------------------------
  // Every arm below runs against synthetic inputs, so the failure it proves is
  // the rule and not a fixture. These first checks are the other half: without
  // them a collector that silently found nothing would make every arm pass.
  const liveRefs = collectReferences(ROOT);
  const liveProviders = packProviders(materializePacks({ root: ROOT, version: '9.9.9-selftest' }));
  const firing = (path, kind) => liveRefs.filter((r) => r.firing.includes(path) && r.kind === kind);
  const carries = (path, kind, from, target) => firing(path, kind)
    .some((r) => r.from === from && r.target === target);

  ok(carries('inherited', 'skill', 'agents/persona-self.agent.md', 'kai-core-team-operating-rules'),
    'the inherited path is really collected: a department agent inheriting the core contract is seen');
  ok(carries('orchestrated', 'skill', 'agents/workflow-doc-review.agent.md', 'review-rationale'),
    'the orchestrated path is really collected: a dispatched lens is seen as a reference');
  ok(carries('orchestrated', 'agent', 'agents/principal-swe-manager.agent.md', 'principal-product-manager'),
    'agent-to-agent dispatch is really collected, across the department boundary');
  ok(carries('user-invoked', 'asset', 'skills/demo-zoom/SKILL.md', 'scripts/demo-zoom.mjs'),
    'the user-invoked path is really collected, down to the script the skill tells you to run');
  ok(firing('inherited', 'skill').length > 100 && firing('orchestrated', 'agent').length > 5
    && firing('user-invoked', 'skill').length > 5 && liveRefs.some((r) => r.kind === 'asset'),
  'all three firing paths and the asset path are populated, so no arm is vacuous');
  ok(referenceErrors({ refs: liveRefs, providers: liveProviders }).length === 0,
    'every reference in the live corpus resolves to core or its own pack');
  const liveAssets = planAssets(liveRefs);
  ok(liveAssets.get('scripts/demo-zoom.mjs')?.owner === 'personal'
    && liveAssets.get('scripts/generate-audio.ps1')?.owner === 'core',
  'an asset invoked from one pack travels with it; one invoked from two promotes to core');
  ok(assetOwnershipErrors({
    assets: liveAssets,
    exists: (a) => existsSync(join(ROOT, ...a.split('/'))),
  }).length === 0,
  'every invoked script exists and is reachable from the pack that invokes it');

  // --- cross-pack references: the mutation arms -------------------------
  const providersOf = (entries) => new Map(Object.entries(entries));
  const ref = (over) => ({ from: 'agents/x.agent.md', fromPack: 'engineering', firing: ['inherited'], kind: 'skill', target: 'video-direction', ...over });
  const messages = (refs, providers) => referenceErrors({ refs, providers: providersOf(providers) }).map((e) => e.msg);

  ok(messages([ref({})], { 'skill:video-direction': ['personal'] })
    .some((m) => /inherited reference to skill `video-direction` resolves to kai-personal/.test(m)),
  'an inherited skill provided by another department fails by name');
  ok(messages([ref({ target: 'gone-skill' })], {})
    .some((m) => /resolves to no pack/.test(m)),
  'an inherited skill no pack provides fails as a dangling reference');
  ok(messages([ref({ from: 'skills/create-product-demo/SKILL.md', fromPack: 'personal', firing: ['user-invoked'], target: 'create-product-demo' })],
    { 'skill:create-product-demo': ['personal', 'gtm'] })
    .some((m) => /user-invoked reference to skill `create-product-demo` is provided by kai-personal and kai-gtm/.test(m)),
  'a user-invoked entry point two packs both provide fails as an unspecified resolution');
  ok(messages([ref({ firing: ['orchestrated'], target: 'ui-mockup' })], { 'skill:ui-mockup': ['product'] })
    .some((m) => /orchestrated reference to skill `ui-mockup` resolves to kai-product/.test(m)),
  'an orchestrated dispatch of another department\'s skill fails by name');
  ok(messages([ref({ firing: ['orchestrated'], kind: 'agent', target: 'principal-gone' })], {})
    .some((m) => /orchestrated reference to agent `principal-gone` resolves to no pack/.test(m)),
  'an orchestrated dispatch of an agent that no longer exists fails by name');
  ok(messages([ref({ firing: ['orchestrated'], kind: 'agent', target: 'persona-self' })], { 'agent:persona-self': ['personal'] })
    .length === 0,
  'but dispatching a real agent in another pack is allowed: a referral degrades, it does not fail to load');
  ok(messages([ref({ fromPack: null })], { 'skill:video-direction': ['personal'] })
    .some((m) => /comes from a file no pack owns/.test(m)),
  'a reference from a body the partition never placed fails instead of resolving by luck');

  const assetRef = (from, pack, target) => ({ from, fromPack: pack, firing: ['user-invoked'], kind: 'asset', target });
  const assetMsgs = (refs, exists = () => true) => assetOwnershipErrors({ assets: planAssets(refs), exists }).map((e) => e.msg);

  ok(assetMsgs([assetRef('skills/demo-zoom/SKILL.md', 'personal', 'scripts/gone.mjs')], () => false)
    .some((m) => /invokes `scripts\/gone\.mjs`, which does not exist in this plugin/.test(m)),
  'an invoked script that is not in the plugin fails by name');
  ok(assetMsgs([
    assetRef('skills/a/SKILL.md', 'personal', 'scripts/shared.mjs'),
    assetRef('skills/b/SKILL.md', 'engineering', 'scripts/shared.mjs'),
  ]).length === 0,
  'a script invoked from two packs is promoted to core by the plan, so neither reference breaks');
  const sharedToDepartment = new Map([['scripts/shared.mjs', {
    asset: 'scripts/shared.mjs',
    consumers: [{ from: 'skills/a/SKILL.md', pack: 'personal' }, { from: 'skills/b/SKILL.md', pack: 'engineering' }],
    packs: new Set(['personal', 'engineering']),
    owner: 'personal',
  }]]);
  ok(assetOwnershipErrors({ assets: sharedToDepartment, exists: () => true })
    .some((e) => /is invoked from kai-engineering and kai-personal but is assigned to kai-personal/.test(e.msg)),
  'and routing a shared script into a department instead of core fails by name');
  const departmentAsset = new Map([['scripts/demo-zoom.mjs', {
    asset: 'scripts/demo-zoom.mjs',
    consumers: [{ from: 'skills/onboard-to-codebase/SKILL.md', pack: 'engineering' }],
    packs: new Set(['personal']),
    owner: 'personal',
  }]]);
  ok(assetOwnershipErrors({ assets: departmentAsset, exists: () => true })
    .some((e) => /ships in kai-personal — kai-engineering can only run its own assets/.test(e.msg)),
  'a script invoked across the boundary from another department fails by name');

  // --- hooks.json belongs to exactly one pack ---------------------------
  const observer = 'scripts/observe-subagent.mjs';
  const hookAssets = [observer];
  const owned = (pack) => new Map([[observer, { asset: observer, consumers: [], packs: new Set([pack]), owner: pack }]]);
  const hookMsgs = (args) => hooksAssignmentErrors({ hookAssets, assets: owned(HOOKS_OWNER), ...args }).map((e) => e.msg);

  ok(hookMsgs({ owners: [HOOKS_OWNER] }).length === 0,
    `${HOOKS_FILE} assigned to exactly one pack, running a script that pack owns, is clean`);
  ok(hookMsgs({ owners: [] }).some((m) => /is assigned to no pack/.test(m)),
    `${HOOKS_FILE} assigned to zero packs fails by name`);
  ok(hookMsgs({ owners: ['core', 'personal'] })
    .some((m) => /is claimed by kai-core and kai-personal/.test(m)),
  `${HOOKS_FILE} claimed by two packs fails by name — the observer would fire twice per subagent`);
  ok(hooksAssignmentErrors({ owners: [HOOKS_OWNER], hookAssets, assets: owned('personal') })
    .some((e) => /runs `scripts\/observe-subagent\.mjs`, owned by kai-personal/.test(e.msg)),
  'a hook whose script is owned by another pack fails: ${PLUGIN_ROOT} never crosses the boundary');
  ok(hooksAssignmentErrors({ owners: [HOOKS_OWNER], hookAssets, assets: new Map() })
    .some((e) => /which no pack owns/.test(e.msg)),
  'a hook whose script no pack owns fails rather than shipping a command nobody can run');
  ok(hookMsgs({ owners: ['nope'] }).some((m) => /is assigned to "nope", which is not a pack/.test(m)),
    'assigning the hooks file to a pack that does not exist fails by name');
  ok(HOOKS_OWNER === 'core' && liveAssets.get(observer)?.owner === HOOKS_OWNER,
    `${HOOKS_FILE} and the script it runs are both owned by kai-core in the live partition`);

  console.log(`\npack-preview self-test: ${pass} checks passed${fails.length ? `, ${fails.length} FAILED` : ''}`);
  return fails.length === 0;
}

const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i === -1 ? d : args[i + 1]; };

if (args.includes('--self-test')) {
  process.exit(selfTest() ? 0 : 1);
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
  console.log(`pack-preview --write: ${r.written} file(s) -> ${r.dir}`);
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
  console.log(`\ncore skills: ${r.plan.core.length} (+${r.plan.orphans.length} inherited by nobody)`);
  for (const [p, l] of Object.entries(r.plan.local)) {
    if (l.length) console.log(`  ${p} owns ${l.length}: ${l.join(', ')}`);
  }
  if (r.plan.orphans.length) {
    console.log(`\nexplicitly placed outside inheritance:`);
    for (const skill of r.plan.orphans) {
      console.log(`  ${skill} -> ${SKILL_OWNER_OVERRIDES[skill]}`);
    }
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
  console.log(`pack agents: ${PACK_AGENTS.length}, pack-local skills: ${r.local.length}`);
  console.log(r.coreDir ? `core: ${r.coreDir}` : 'core: not built');
  console.log(`pack: ${r.packDir}`);
  reportPreflight(out);
} else {
  console.log('usage: node scripts/pack-preview.mjs --check          (regenerate + diff committed packs/)');
  console.log('       node scripts/pack-preview.mjs --write          (materialise committed packs/)');
  console.log('       node scripts/pack-preview.mjs --out <dir> [--no-core] [--contract N]');
  console.log('       node scripts/pack-preview.mjs --all --out <dir>');
  console.log('       node scripts/pack-preview.mjs --self-test');
}
