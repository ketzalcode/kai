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
  PACKS, PACKS_DIR, COMMITTED_PACKS, CONTRACT_SKILL, REFUSAL, SKILL_OWNER_OVERRIDES,
  planPacks, planManifests, materializePacks,
  manifestParityErrors, marketplaceConsistencyErrors, normalizeLF,
  inheritedSkills as inheritedSkillsOf,
} from './lib/pack-plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The partition, the contract-skill name and the refusal token live once in
// scripts/lib/pack-plan.mjs. Re-exported here so callers and the locked
// partition doc that name them on pack-preview keep resolving.
export { PACKS, CONTRACT_SKILL, REFUSAL, planPacks };

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
// Committed pack trees — the deterministic generator (materialise + diff)
//
// Unlike the preview above, this path is the authoritative generator: it copies
// agent/skill bodies verbatim from root (root stays the single source of truth),
// stamps a per-pack plugin.json, and normalises to LF so the output is
// byte-identical on every platform. Guarantee-block injection and non-markdown
// asset routing are added by downstream items; this ships the machinery.
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
  if (r.plan.orphans.length) {
    console.log(`\nexplicitly placed outside inheritance:`);
    for (const skill of r.plan.orphans) {
      console.log(`  ${skill} -> ${SKILL_OWNER_OVERRIDES[skill]}`);
    }
  }
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
  console.log('usage: node scripts/pack-preview.mjs --check          (regenerate + diff committed packs/)');
  console.log('       node scripts/pack-preview.mjs --write          (materialise committed packs/)');
  console.log('       node scripts/pack-preview.mjs --out <dir> [--no-core] [--contract N]');
  console.log('       node scripts/pack-preview.mjs --all --out <dir>');
  console.log('       node scripts/pack-preview.mjs --self-test');
}
