#!/usr/bin/env node
// The deterministic pack generator, and the host-behaviour preview it grew from.
//
// Two jobs, one partition (scripts/lib/pack-plan.mjs):
//   • generate  — materialise the pack trees from the LIVE root roster, byte-stably,
//     with a per-pack plugin.json. `--write` lands them under packs/; `--check`
//     regenerates and diffs so a hand-edit or a stale copy fails. The reviewed
//     committed slice currently contains kai-core and kai-personal.
//   • preview   — a throwaway two- or five-plugin build (`--out`/`--all`) that
//     answers the host-behaviour questions gating the split: does a fail-closed
//     preflight hold on a real agent, what happens when core is absent or
//     version-skewed, which provider wins a name collision, and what a pack does
//     when it references an uninstalled pack. Preview output ships nothing.
//   • gate      — the same rules the self-test proves by mutation, run over the
//     live tree as four named CI gates (`--gate`), so a red build names the
//     guarantee that broke.
//
// Run: node scripts/pack-preview.mjs --check | --write
//      node scripts/pack-preview.mjs --out <dir> [--no-core] [--contract N] | --all
//      node scripts/pack-preview.mjs --self-test
//      node scripts/pack-preview.mjs --gate <partition|collision|partial-install|version-skew|all>
//
// Dependency-free (Node built-ins only), consistent with the rest of scripts/.

import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, readdirSync, mkdtempSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { parseFrontmatter, parseToolList } from './lib/loader-contract.mjs';
import {
  PACKS, PACKS_DIR, COMMITTED_PACKS, CONTRACT_SKILL, CONTRACT_VERSION, REFUSAL,
  SKILL_OWNER_OVERRIDES, HOOKS_FILE, HOOKS_OWNER, DEGRADED_BLOCK_MAX, CORE_SKILL_PREFIX,
  RUNTIME_ARTIFACTS,
  planPacks, planManifests, materializePacks, preflightBlock, injectPreflight,
  degradedBlock, guaranteeBlocks, injectBlocks, degradedBlockErrors, coreContractLines,
  manifestParityErrors, marketplaceConsistencyErrors, normalizeLF,
  collectReferences, referenceErrors, packProviders,
  planAssets, planAssetClosure, assetOwnershipErrors, hooksAssignmentErrors,
  generatedKeyErrors, generatedPackageErrors, generatedRuntimeErrors, hookAssetReferenceErrors,
  partitionErrors, namespaceErrors, providerCollisionErrors, contractPinErrors,
  guaranteeBlockErrors, availabilityErrors, parseGeneratedKey, agentShapedPattern,
  hookAssetsIn, DISPATCHING_ROLES, AVAILABILITY_RULES,
} from './lib/pack-plan.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');

// The partition, the contract-skill name, the refusal token and the canonical
// block injection live once in scripts/lib/pack-plan.mjs. Re-exported here so
// callers and the locked partition doc that name them on pack-preview keep
// resolving.
export {
  PACKS, CONTRACT_SKILL, CONTRACT_VERSION, REFUSAL, planPacks,
  preflightBlock, injectPreflight, degradedBlock, guaranteeBlocks, injectBlocks,
};

// The narrow pack under test in the two-plugin preview is `personal`: the
// department whose removal from a default install is most defensible, and the
// one #29 named. It is a SELECTION of the canonical partition (PACKS.personal),
// never a second roster to keep in step.

const readAgent = (id) => readFileSync(join(ROOT, 'agents', `${id}.agent.md`), 'utf8');
const skillPath = (id) => join(ROOT, 'skills', id, 'SKILL.md');

// Every agent and skill on disk, which is what the partition is checked against:
// the roster in PACKS is a claim about this list, not a substitute for it.
const rosterAgentIds = () => readdirSync(join(ROOT, 'agents'))
  .filter((f) => f.endsWith('.agent.md')).map((f) => f.replace(/\.agent\.md$/, '')).sort();

const rosterSkillIds = () => readdirSync(join(ROOT, 'skills'), { withFileTypes: true })
  .filter((e) => e.isDirectory() && existsSync(skillPath(e.name)))
  .map((e) => e.name).sort();

const declaredTools = (body) => {
  const parsed = parseFrontmatter(body);
  return new Set(parsed.ok ? parseToolList(parsed.fm.tools) || [] : []);
};

const frontmatter = (body) => normalizeLF(body).match(/^---\n[\s\S]*?\n---/)?.[0] ?? null;


// The preflight is written into each pack agent's OWN body, never into an
// inherited skill: an agent that cannot reach core also cannot reach a skill
// that tells it what to do about core. That circularity is the whole reason
// the block is duplicated per agent rather than referenced, and why the
// canonical text and the injection both live in scripts/lib/pack-plan.mjs. The
// degraded-mode refusal rides the same path, immediately after it.

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

function writePlugin(dir, name, description, agentIds, skills, blocks) {
  mkdirSync(dir, { recursive: true });
  const manifest = { name, version: '0.0.0-preview', description, skills: 'skills' };
  if (agentIds.length) manifest.agents = 'agents';
  writeFileSync(join(dir, 'plugin.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (agentIds.length) {
    mkdirSync(join(dir, 'agents'), { recursive: true });
    for (const id of agentIds) {
      const body = readAgent(id);
      writeFileSync(join(dir, 'agents', `${id}.agent.md`),
        blocks.length ? injectBlocks(body, blocks) : normalizeLF(body));
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
      PACKS.core, plan.core, []);
    // plan.core already copied the real probe; this rewrite is what a --contract
    // other than 1 uses to build a core the agents must refuse.
    writeSkill(dir, CONTRACT_SKILL, contractSkillText(contract));
    built.push({ name: 'kai-core-preview', dir, agents: PACKS.core.length });
  }

  const blocks = guaranteeBlocks();
  for (const p of packs) {
    const dir = join(out, `kai-${p}-preview`);
    writePlugin(dir, `kai-${p}-preview`, `Preview of the kai ${p} department. Not for use.`,
      PACKS[p], plan.local[p], blocks);
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

// The two-plugin preview `--out` builds: core plus one department. It is a
// selection of the same partition `--all` uses, so the roster it ships can no
// longer disagree with PACKS.
export function build({ out, withCore = true, contract = 1, pack = 'personal' }) {
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
// Unlike the preview above, this path is the authoritative generator: it copies
// skill and core-agent bodies verbatim from root (root stays the single source of
// truth), injects the canonical fail-closed preflight and the degraded-mode
// refusal that follows it into every department agent, stamps a per-pack
// plugin.json, routes non-markdown assets and hooks by the reviewed ownership
// plan, and normalises to LF so output is byte-identical on every platform.
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

// Regenerate the pack trees from root and diff against what is committed. Drift —
// a hand-edit, a stale copy, a missing or an extra file — fails, so a committed
// tree can only ever be exactly what the generator produces. A configured slice
// with no packs/ directory fails with the command that regenerates it.
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
// exactly the reviewed committed slice with no stale leftovers.
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

  // The canonical partition, planned once. Every check below reads this — there
  // is no second roster and no second planner to fall out of step with it.
  const plan = planPacks();
  const rosterAgents = rosterAgentIds();
  const rosterSkills = rosterSkillIds();
  const core = plan.core;
  const local = plan.local.personal;
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
  const degraded = degradedBlock();
  const injected = injectBlocks(readAgent(PACKS.personal[0]), guaranteeBlocks());
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

  // --- the canonical degraded-mode refusal -------------------------------
  const preflightEnd = injected.indexOf(block) + block.length;
  const refusalAt = injected.indexOf(degraded);
  ok(injected.split(degraded).length === 2,
    'the canonical refusal is copied in verbatim, exactly once');
  ok(refusalAt > preflightEnd,
    'and lands after the preflight, which stays the first executable instruction');
  ok(/^\s*$/.test(injected.slice(preflightEnd, refusalAt)),
    'with nothing wedged between the two guarantee blocks');
  ok(!degraded.includes(REFUSAL),
    `the refusal does not reuse the preflight's ${REFUSAL} token — core answered, so that token would be a lie`);

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

    // The acceptance criterion, read back off disk: every agent a full --all
    // build writes, not the one file a spot check happens to open.
    const full = join(arms, 'all');
    buildAll({ out: full });
    const builtAgents = [];
    for (const pack of Object.keys(PACKS)) {
      const dir = join(full, `kai-${pack}-preview`, 'agents');
      for (const file of readdirSync(dir)) {
        builtAgents.push({
          pack,
          id: file.replace(/\.agent\.md$/, ''),
          body: readFileSync(join(dir, file), 'utf8'),
        });
      }
    }
    const departmentAgents = builtAgents.filter((a) => a.pack !== 'core');
    const coreAgents = builtAgents.filter((a) => a.pack === 'core');
    ok(departmentAgents.length === Object.entries(PACKS)
      .filter(([pack]) => pack !== 'core').reduce((n, [, ids]) => n + ids.length, 0)
      && departmentAgents.every((a) => a.body.split(degraded).length === 2
        && a.body.indexOf(degraded) > a.body.indexOf(block) + block.length),
    `all ${departmentAgents.length} department agents from --all carry the refusal once, after the preflight`);
    ok(coreAgents.length === PACKS.core.length
      && coreAgents.every((a) => !a.body.includes(degraded) && !a.body.includes(block)),
    'and no core agent carries either block: kai-core cannot be absent from itself');
    ok(builtAgents.every((a) => declaredTools(a.body).has('skill')),
      `all ${builtAgents.length} generated agents declare skill access for delegated inherited-contract loading`);
    ok(!declaredTools(builtAgents[0].body.replace(/,\s*"skill"/, '')).has('skill'),
      'removing skill access from a generated agent is detected rather than false-passing from workspace files');
    ok(builtAgents.every((a) => frontmatter(a.body) === frontmatter(readAgent(a.id))),
      'generated agent frontmatter is a byte-identical projection of canonical source');
  } catch (e) {
    ok(false, `preflight arms threw: ${e.message}`);
  } finally {
    if (arms) rmSync(arms, { recursive: true, force: true });
  }

  const rosterSize = rosterAgents.length;
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
  ok(plan.core.includes('kai-core-fleet-observation')
    && plan.local.personal.includes('create-product-demo')
    && plan.local.engineering.includes('review-dependencies'),
  'the generator applies the ratified core, personal, and engineering orphan dispositions');

  // --- the refusal's own rules, each failure proven by name --------------
  // Mutations of the shipped block, so what fails is the rule and not a fixture.
  const contractLines = coreContractLines(ROOT);
  const shippedIds = new Set([
    ...plan.core, ...Object.values(plan.local).flat(), ...Object.values(PACKS).flat(),
  ]);
  const refusalErrors = (text) => degradedBlockErrors({
    block: text, refusalToken: REFUSAL, ids: shippedIds, contractLines,
  });

  ok(contractLines.size > 100,
    'the shipped core contract really was read, or every "restates no rule" arm below is vacuous');
  ok(refusalErrors(degraded).length === 0,
    'the shipped refusal satisfies every rule the validator pins it to');
  ok(refusalErrors(`${degraded}\n- Write your handoff into the coordination thread.`)
    .some((m) => /affirmative instruction/.test(m)),
  'an affirmative coordination instruction added to the block fails by name');
  ok(refusalErrors(degraded.replace('`kai-core`', '`kai-core-work-coordination`'))
    .some((m) => /names the shipped contract/.test(m)),
  'citing a shipped contract fails: a refusal names none, so it can copy none');
  ok(refusalErrors(`${degraded}\n${[...contractLines][0]}`)
    .some((m) => /restates the shipped core contract verbatim/.test(m)),
  'a line lifted verbatim out of core fails — that is "restates no rule", mechanically');
  ok(refusalErrors(`${degraded}\n${REFUSAL}`)
    .some((m) => new RegExp(`${REFUSAL}\`? token`).test(m)),
  `reusing the ${REFUSAL} token fails: the two refusals answer different questions`);
  ok(refusalErrors(`${degraded}\nReport \`contract: 9\` to the operator.`)
    .some((m) => /contract version/.test(m)),
  'a second contract-version literal fails — the fail-open skew the preflight pin already forbids');
  ok(refusalErrors(`${degraded}\n${'x'.repeat(DEGRADED_BLOCK_MAX)}`)
    .some((m) => /refusal budget/.test(m)),
  'a block that outgrows the refusal budget fails before it becomes a fallback contract');
  ok(refusalErrors(degraded.replace('single-shot', 'staged'))
    .some((m) => /single-shot/.test(m)),
  'dropping the single-shot instruction fails: a pause is not a refusal');
  ok(refusalErrors(degraded.replace(/^- Tell the operator to install.*$/m, '- Do not continue.'))
    .some((m) => /exactly one .Tell the operator to install/.test(m)),
  'losing the install remedy fails: a refusal with no way out is a dead end');

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
    && m1.has('kai-core/package.json') && m1.has('kai-core/package-lock.json')
    && m1.has('kai-personal/package.json') && m1.has('kai-personal/package-lock.json')
    && m1.has('kai-personal/agents/persona-self.agent.md'),
    'the materialised tree places per-pack plugin and npm manifests with copied agent bodies');
  ok(m1.get('kai-personal/agents/persona-self.agent.md').includes(block),
    'the authoritative generator injects the canonical preflight into department agents');
  ok(m1.get('kai-personal/agents/persona-self.agent.md').includes(degraded),
    'and the degraded refusal alongside it, from the same authoritative path');
  ok(PACKS.core.every((id) => !m1.get(`kai-core/agents/${id}.agent.md`).includes(block)
    && !m1.get(`kai-core/agents/${id}.agent.md`).includes(degraded)),
  'and neither into a core agent, which ships inside the pack whose absence they cover');
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
  ok(coreM.packageManifest.dependencies.lectoria
    && personalM.packageManifest.dependencies.lectoria
    && coreM.packageLock.packages['node_modules/lectoria']
    && personalM.packageLock.packages['node_modules/lectoria']
    && !coreM.packageManifest.devDependencies
    && !coreM.packageLock.packages['node_modules/playwright'],
  'core and personal project the exact pinned lectoria dependency and its reachable lock graph');
  const emptyPack = planManifests({
    root: ROOT, version: '9.9.9-selftest', packs: ['engineering'],
  })[0];
  ok(Object.keys(emptyPack.packageManifest.dependencies).length === 0
    && Object.keys(emptyPack.packageLock.packages).length === 1,
  'a pack with no runtime dependencies still gets a valid empty manifest and lockfile');

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

    // Softening the refusal in a shipped tree is the drift this whole pin
    // exists to catch, so it is proven on the exact file it would land in.
    const agentPath = join(scratch, 'kai-personal', 'agents', 'persona-self.agent.md');
    const original = readFileSync(agentPath, 'utf8');
    writeFileSync(agentPath, original.replace(degraded, degraded.replace('Refuse', 'Consider refusing')));
    ok(checkSelected().some((d) => d.includes('kai-personal/agents/persona-self.agent.md')),
      'a softened refusal inside a generated agent is caught as drift, on that exact file');
    writeFileSync(agentPath, original);
    ok(checkSelected().length === 0,
      'and restoring it clears the drift, so the check reports state rather than history');

    const victim = join(scratch, 'kai-core', 'plugin.json');
    writeFileSync(victim, `${readFileSync(victim, 'utf8')}tampered`);
    ok(checkSelected().length > 0,
      'a hand-edit to a committed tree is caught as drift');
  } catch (e) {
    ok(false, `committed-tree check round-trip threw: ${e.message}`);
  } finally {
    if (scratch) rmSync(scratch, { recursive: true, force: true });
  }
  ok(COMMITTED_PACKS.length === 2
    && COMMITTED_PACKS[0] === 'core' && COMMITTED_PACKS[1] === 'personal',
  'the committed slice is exactly core plus personal');
  const missingBase = join(tmpdir(), `kai-pack-missing-${process.pid}`);
  const missingCheck = checkCommitted({ root: ROOT, base: missingBase, version: '9.9.9-selftest' });
  ok(!missingCheck.ok && missingCheck.drift.includes(`missing:    ${PACKS_DIR}/`)
    && /regenerate with/.test(missingCheck.note),
  'a configured slice with no packs directory fails with regeneration guidance, not ENOENT');

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

  // The whole lens set, not one sample. A dispatch entry naming a skill that no
  // longer exists is dropped silently by the collector (a dispatch line is prose,
  // and prose that names nothing resolvable is not a reference), so the only
  // defence is asserting the set the agent actually orchestrates — one arm per
  // lens would pass while eight of nine went missing.
  const DOC_REVIEW_LENSES = [
    'review-alternatives', 'review-dependencies', 'review-performance-scale',
    'review-rationale', 'review-risks-scope', 'review-rollout-operability',
    'review-security-privacy', 'review-success-metrics', 'review-ux-accessibility',
  ];
  const missingLenses = DOC_REVIEW_LENSES
    .filter((lens) => !carries('orchestrated', 'skill', 'agents/workflow-doc-review.agent.md', lens));
  ok(missingLenses.length === 0,
    `all ${DOC_REVIEW_LENSES.length} doc-review lenses are collected as dispatched references `
    + `(missing: ${missingLenses.join(', ') || 'none'})`);
  ok(DOC_REVIEW_LENSES.every((lens) => rosterSkills.includes(lens)),
    'and every dispatched lens is a skill on disk, so a renamed lens cannot be silently dropped');
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
  const bareAsset = new Map([['scripts/start.mjs', {
    asset: 'scripts/start.mjs',
    consumers: [{ from: 'skills/x/SKILL.md', pack: 'core' }],
    packs: new Set(['core']),
    owner: 'core',
  }]]);
  const bareClosure = (dependencies) => planAssetClosure({
    assets: bareAsset,
    exists: () => true,
    read: () => "import runtime from '@scope/runtime/subpath';\n",
    dependencies,
  });
  ok(bareClosure(new Map()).errors
    .some((e) => /add `@scope\/runtime` to kai-core's runtime dependency plan/.test(e.msg)),
  'asset closure rejects an undeclared scoped bare import by package name');
  ok(bareClosure(new Map([['core', new Set(['@scope/runtime'])]])).errors.length === 0,
    'asset closure accepts the same bare import after the owning pack declares it');
  const liveFiles = materializePacks({ root: ROOT, version: '9.9.9-selftest' });
  ok(liveFiles.has('kai-core/hooks.json')
    && !liveFiles.has('kai-personal/hooks.json')
    && liveFiles.has('kai-core/scripts/observe-subagent.mjs')
    && liveFiles.has('kai-core/scripts/lib/activity.mjs')
    && liveFiles.has('kai-personal/scripts/demo-zoom.mjs')
    && liveFiles.has('kai-personal/scripts/lib/cursor-png.mjs'),
  'materialization emits hooks once and closes each routed script over its relative modules');
  ok(generatedKeyErrors(liveFiles).length === 0,
    'every live generated key belongs to a declared pack');
  ok(generatedPackageErrors(liveFiles).length === 0,
    'every emitted package manifest and lockfile matches the deterministic root projection');
  ok(generatedRuntimeErrors(liveFiles).length === 0,
    'every emitted JavaScript asset resolves locally and declares each bare runtime import');
  ok(generatedKeyErrors(new Map([['kai-unknown/plugin.json', '{}']]))
    .some((e) => /belongs to no declared pack/.test(e.msg)),
  'a generated key outside the declared pack set fails in the one shared check');
  ok(generatedRuntimeErrors(new Map([
    ['kai-core/plugin.json', '{}'],
    ['kai-core/scripts/start.mjs', "import './lib/missing.mjs';\n"],
  ])).some((e) => /missing from kai-core/.test(e.msg)),
  'a copied entry point with a missing relative module fails by name');
  ok(generatedRuntimeErrors(new Map([
    ['kai-core/plugin.json', '{}'],
    ['kai-core/scripts/start.mjs', "import './lib/missing.mjs'\n"],
  ])).some((e) => /missing from kai-core/.test(e.msg)),
  'a semicolon-less relative import cannot escape the emitted-tree closure gate');
  ok(generatedRuntimeErrors(new Map([
    ['kai-core/plugin.json', '{}'],
    ['kai-core/scripts/start.mjs', "import runtime from 'third-party-runtime';\n"],
  ])).some((e) => /imports undeclared bare module `third-party-runtime`/.test(e.msg)),
  'a copied entry point with an undeclared npm dependency fails by name');
  const declaredRuntime = new Map([
    ['kai-core/plugin.json', '{}'],
    ['kai-core/package.json', JSON.stringify({
      dependencies: { 'third-party-runtime': '1.0.0' },
    })],
    ['kai-core/package-lock.json', JSON.stringify({
      packages: {
        '': {},
        'node_modules/third-party-runtime': {
          version: '1.0.0',
          resolved: 'https://registry.npmjs.org/third-party-runtime/-/third-party-runtime-1.0.0.tgz',
          integrity: 'sha512-AAAA',
        },
      },
    })],
    ['kai-core/scripts/start.mjs', "import runtime from 'third-party-runtime/subpath';\n"],
  ]);
  ok(generatedRuntimeErrors(declaredRuntime).length === 0,
    'a bare subpath import passes when its package is declared and locked in the same pack');
  const missingDeclaration = new Map(declaredRuntime);
  missingDeclaration.set('kai-core/package.json', JSON.stringify({ dependencies: {} }));
  ok(generatedRuntimeErrors(missingDeclaration)
    .some((e) => /must declare `third-party-runtime`/.test(e.msg)),
  'deleting the package declaration makes the same bare import fail');
  const missingLock = new Map(declaredRuntime);
  missingLock.set('kai-core/package-lock.json', JSON.stringify({ packages: { '': {} } }));
  ok(generatedRuntimeErrors(missingLock)
    .some((e) => /has no `node_modules\/third-party-runtime` record/.test(e.msg)),
  'deleting the lock record makes the same bare import fail');
  const missingPackage = new Map(liveFiles);
  missingPackage.delete('kai-core/package.json');
  ok(generatedPackageErrors(missingPackage)
    .some((e) => /package\.json.*missing from the generated pack/.test(`${e.file} ${e.msg}`)),
  'deleting a generated package manifest fails the deterministic package gate');
  const driftedLock = new Map(liveFiles);
  const lock = JSON.parse(driftedLock.get('kai-personal/package-lock.json'));
  delete lock.packages['node_modules/lectoria'];
  driftedLock.set('kai-personal/package-lock.json', `${JSON.stringify(lock, null, 2)}\n`);
  ok(generatedPackageErrors(driftedLock)
    .some((e) => /reachable dependency projection/.test(e.msg)),
  'a generated lockfile that drops the pinned runtime package fails the exact projection gate');
  const mutateGeneratedJson = (files, key, mutate) => {
    const changed = new Map(files);
    const value = JSON.parse(changed.get(key));
    mutate(value);
    changed.set(key, `${JSON.stringify(value, null, 2)}\n`);
    return changed;
  };
  const changedSpec = mutateGeneratedJson(
    liveFiles,
    'kai-core/package.json',
    (value) => { value.dependencies.lectoria = `${RUNTIME_ARTIFACTS.lectoria.spec}?changed`; }
  );
  ok(generatedRuntimeErrors(changedSpec)
    .some((e) => /must use sanctioned artifact/.test(e.msg)),
  'changing the direct Lectoria artifact spec fails the sanctioned-source gate');
  const sshRuntime = mutateGeneratedJson(
    liveFiles,
    'kai-core/package-lock.json',
    (value) => {
      value.packages['node_modules/lectoria'].resolved =
        'git+ssh://git@github.com/RubenSaucedo/lectoria.git#c284b6c';
    }
  );
  ok(generatedRuntimeErrors(sshRuntime)
    .some((e) => /must resolve over HTTPS/.test(e.msg)),
  'an SSH-resolved runtime dependency fails the transport gate');
  const mirroredRuntime = mutateGeneratedJson(
    liveFiles,
    'kai-core/package-lock.json',
    (value) => {
      value.packages['node_modules/lectoria'].resolved =
        'https://mirror.example/lectoria-0.1.0.tgz';
    }
  );
  ok(generatedRuntimeErrors(mirroredRuntime)
    .some((e) => /unapproved runtime source/.test(e.msg)),
  'an HTTPS mirror outside the runtime source allowlist fails by URL');
  const weakIntegrity = mutateGeneratedJson(
    liveFiles,
    'kai-core/package-lock.json',
    (value) => { value.packages['node_modules/lectoria'].integrity = 'sha1-AAAA'; }
  );
  ok(generatedRuntimeErrors(weakIntegrity)
    .some((e) => /must carry non-empty SHA-512 integrity/.test(e.msg)),
  'a runtime lock record without SHA-512 integrity fails closed');
  const changedIntegrity = mutateGeneratedJson(
    liveFiles,
    'kai-core/package-lock.json',
    (value) => { value.packages['node_modules/lectoria'].integrity = 'sha512-AAAA'; }
  );
  ok(generatedRuntimeErrors(changedIntegrity)
    .some((e) => /does not match its pinned SHA-512 integrity/.test(e.msg)),
  'changing the sanctioned artifact integrity fails the exact pin');

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
  ok(hookAssetReferenceErrors(readFileSync(join(ROOT, HOOKS_FILE), 'utf8')).length === 0,
    'the live hooks file invokes one supported top-level asset per command');
  const multiHook = JSON.stringify({ hooks: { subagentStart: [{
    command: 'node "${PLUGIN_ROOT}/scripts/a.mjs" "${PLUGIN_ROOT}/scripts/b.mjs"',
  }] } });
  ok(hookAssetReferenceErrors(multiHook)
    .some((e) => /contains 2 \$\{PLUGIN_ROOT\} paths/.test(e.msg)),
  'a hook command with multiple plugin-relative paths fails by name');
  const nestedHook = JSON.stringify({ hooks: { subagentStart: [{
    command: 'node "${PLUGIN_ROOT}/scripts/lib/a.mjs"',
  }] } });
  ok(hookAssetReferenceErrors(nestedHook)
    .some((e) => /outside the supported top-level/.test(e.msg)),
  'a nested hook asset fails by name without widening the asset key-space');

  // --- the partition itself, each failure proven by name ----------------
  // A synthetic two-pack world, so what fails is the rule and not the live
  // roster: every arm below is one mutation away from the clean baseline.
  const world = (over = {}) => ({
    plan: {
      core: ['kai-core-shared'],
      local: { core: [], personal: ['personal-skill'] },
      orphans: [],
    },
    agents: ['director-a', 'persona-b'],
    skills: ['kai-core-shared', 'personal-skill'],
    packs: { core: ['director-a'], personal: ['persona-b'] },
    overrides: {},
    ...over,
  });
  const partitionMsgs = (over) => partitionErrors(world(over));
  const cleanPlan = world().plan;

  ok(partitionMsgs({}).length === 0,
    'a complete, unambiguous partition raises nothing, or every arm below is vacuous');
  ok(partitionMsgs({ packs: { core: ['director-a', 'director-gone'], personal: ['persona-b'] } })
    .some((m) => /names agent `director-gone`, which is not on disk/.test(m)),
  'a roster naming an agent that is not on disk fails by name');
  ok(partitionMsgs({ packs: { core: ['director-a', 'persona-b'], personal: ['persona-b'] } })
    .some((m) => /agent `persona-b` is claimed by both kai-core and kai-personal/.test(m)),
  'an agent claimed by two packs fails by name — provider ownership must be partition-defined');
  ok(partitionMsgs({ agents: ['director-a', 'persona-b', 'persona-stray'] })
    .some((m) => /agent `persona-stray` belongs to no pack/.test(m)),
  'an agent on disk that no pack claims fails by name: it would ship in nothing');
  ok(partitionMsgs({
    plan: { ...cleanPlan, local: { core: [], personal: ['kai-core-shared'] } },
  }).some((m) => /skill `kai-core-shared` is provided by both kai-core and kai-personal/.test(m)),
  'a skill two packs both provide fails by name — provider ownership is ambiguous');
  ok(partitionMsgs({ skills: ['kai-core-shared', 'personal-skill', 'unprovided-skill'] })
    .some((m) => /skill `unprovided-skill` has no provider/.test(m)),
  'a skill on disk with no provider fails by name');
  ok(partitionMsgs({
    plan: { ...cleanPlan, local: { core: [], personal: ['personal-skill', 'ghost-skill'] } },
  }).some((m) => /skill `ghost-skill` is planned into kai-personal but is not a skill on disk/.test(m)),
  'a planned skill that no longer exists on disk fails by name');
  ok(partitionMsgs({ overrides: { 'gone-skill': 'core' } })
    .some((m) => /places `gone-skill`, which is not a skill on disk/.test(m)),
  'a reviewed disposition for a renamed or deleted skill fails instead of placing nothing');
  ok(partitionMsgs({ overrides: { 'personal-skill': 'nope' } })
    .some((m) => /places `personal-skill` in "nope", which is not a pack/.test(m)),
  'an override naming a pack that does not exist fails by name');
  ok(partitionMsgs({ overrides: { 'personal-skill': 'personal' } })
    .some((m) => /but an agent already inherits it/.test(m)),
  'an override for a skill inheritance already places fails: one skill, one truth about its provider');
  ok(partitionMsgs({ plan: { ...cleanPlan, orphans: ['personal-skill'] } })
    .some((m) => /has no reviewed provider in SKILL_OWNER_OVERRIDES/.test(m)),
  'an orphan with no reviewed disposition fails by name: it would ship in no pack at all');

  // --- core's namespace, in both directions -----------------------------
  ok(namespaceErrors({ core: plan.core, local: plan.local }).length === 0,
    `every core-provided skill carries the ${CORE_SKILL_PREFIX}* prefix in the live partition`);
  ok(namespaceErrors({ core: ['fleet-observation'], local: {} })
    .some((m) => /rename it to `kai-core-fleet-observation`/.test(m)),
  'a core-provided skill without the prefix fails by name, and says what to rename it to');
  ok(namespaceErrors({ core: [], local: { personal: ['kai-core-sneaky'] } })
    .some((m) => /claims core's `kai-core-\*` namespace/.test(m)),
  'a department claiming a kai-core-* name fails by name — the id would promise core shipped it');

  // --- one emitter per generated id -------------------------------------
  const providerIndex = (entries) => new Map(Object.entries(entries));
  ok(providerCollisionErrors({ providers: liveProviders }).length === 0,
    'no id is emitted by two packs in the live generated tree');
  ok(providerCollisionErrors({ providers: providerIndex({ 'agent:persona-self': ['personal', 'gtm'] }) })
    .some((m) => /agent `persona-self` is emitted by kai-personal and kai-gtm/.test(m)),
  'the same agent emitted by two packs fails by name');
  ok(providerCollisionErrors({ providers: providerIndex({ 'skill:coding-style': ['core', 'engineering'] }) })
    .some((m) => /skill `coding-style` is emitted by kai-core and kai-engineering/.test(m)),
  'the same skill emitted by two packs fails by name — provider ownership would be ambiguous');

  // --- generated-key parsing: a future pack key cannot escape the gates --
  // The gates used to select generated files with a `kai-[a-z]+/` pattern, so a
  // pack key carrying a hyphen or a digit would have been skipped in silence —
  // shipping a department with no preflight and no refusal, and passing CI.
  const parsed = (key, packs) => parseGeneratedKey(key, packs);
  ok(parsed('kai-personal/agents/persona-self.agent.md', ['core', 'personal'])?.kind === 'agent',
    'a generated agent body is recognised as one');
  ok(parsed('kai-fleet-ops/agents/persona-x.agent.md', ['core', 'fleet-ops'])?.pack === 'fleet-ops',
    'a hyphenated pack key resolves to its pack rather than silently skipping the gates');
  ok(parsed('kai-team2/skills/s/SKILL.md', ['core', 'team2'])?.kind === 'skill',
    'a pack key with a digit resolves too: the partition decides membership, not a name pattern');
  ok(parsed('kai-core/hooks.json', ['core'])?.kind === 'hooks'
    && parsed('kai-core/plugin.json', ['core'])?.kind === 'manifest',
  'the manifest and the hooks file are identified by the same parse, so neither is claimed twice');
  ok(parsed('kai-unknown/agents/x.agent.md', ['core', 'personal']) === null,
    'a key belonging to no known pack resolves to nothing rather than to a guess');

  // --- the guarantee blocks, over what the generator emits ---------------
  const inherits = '**Inherits:** `kai-core-team-operating-rules`';
  const departmentBody = (over = {}) => {
    const { first = block, second = degraded, wedge = '', pack = 'personal' } = over;
    return [`kai-${pack}/agents/persona-x.agent.md`,
      `---\nname: persona-x\n---\n\n${inherits}\n\n${first}\n${wedge}\n${second}\n\nbody\n`];
  };
  const blockMsgs = (entries, packs = ['core', 'personal']) => guaranteeBlockErrors({
    files: new Map(entries), preflight: block, degraded, packs,
  }).map((e) => `${e.file}: ${e.msg}`);

  ok(blockMsgs([departmentBody()]).length === 0,
    'a department agent carrying both blocks, in order, contiguously, raises nothing');
  ok(blockMsgs([departmentBody({ first: '' })])
    .some((m) => /carries the verbatim core-preflight block 0 time\(s\)/.test(m)),
  'a department agent missing the preflight fails by name');
  ok(blockMsgs([departmentBody({ first: `${block}\n${block}` })])
    .some((m) => /carries the verbatim core-preflight block 2 time\(s\)/.test(m)),
  'a duplicated preflight fails by name: two probes are a contradiction, not a belt and braces');
  ok(blockMsgs([departmentBody({ second: '' })])
    .some((m) => /carries the verbatim degraded-mode refusal 0 time\(s\)/.test(m)),
  'a department agent missing the degraded-mode refusal fails by name');
  ok(blockMsgs([departmentBody({ wedge: '\nDo something else first.\n' })])
    .some((m) => /places content between the core preflight and the degraded-mode refusal/.test(m)),
  'content wedged between the two guarantee blocks fails by name');
  ok(blockMsgs([departmentBody({ first: degraded, second: block })])
    .some((m) => /places the degraded-mode refusal before the end of the core preflight/.test(m)),
  'inverting the two blocks fails: the preflight stays the first executable instruction');
  ok(blockMsgs([departmentBody({ pack: 'core' })], ['core', 'personal'])
    .some((m) => /carries the core-preflight block; a core agent/.test(m)),
  'a core agent carrying the preflight fails: it would only ever fail on itself');
  ok(blockMsgs([departmentBody({ first: '', pack: 'fleet-ops' })], ['core', 'fleet-ops'])
    .some((m) => /kai-fleet-ops\/agents\/persona-x\.agent\.md/.test(m)),
  'and a hyphenated pack is held to the same guarantee, rather than skipped by a name pattern');
  ok(blockMsgs([['kai-unknown/agents/persona-x.agent.md', 'body']]).length === 0,
    'the guarantee checker relies on the shared generated-key gate instead of deciding null keys again');

  // --- the contract version, pinned wherever it is stated ---------------
  const pinMsgs = (over) => contractPinErrors({
    block, probe: shippedProbe, ...over,
  }).map((e) => `${e.file}: ${e.msg}`);

  ok(pinMsgs({}).length === 0,
    'the shipped block, probe and constants agree on the contract version');
  ok(pinMsgs({ version: '2' })
    .some((m) => /CONTRACT_SKILL `kai-core-contract-v1` and CONTRACT_VERSION "2" disagree/.test(m)),
  'bumping the version constant without the probe skill name fails by name');
  ok(pinMsgs({ probe: contractSkill(2) })
    .some((m) => /returns `contract: 2`, but its name pins it to 1/.test(m)),
  'a probe reporting a version its own name does not promise fails by name');
  ok(pinMsgs({ probe: contractSkill(1).replace('KAI_CORE_READY', 'KAI_CORE_OK') })
    .some((m) => /does not return the exact `KAI_CORE_READY` marker/.test(m)),
  'a probe whose marker drifted fails: every injected block matches on that exact line');
  ok(pinMsgs({ probe: null })
    .some((m) => /missing — every generated department agent invokes this skill/.test(m)),
  'a missing probe fails by name rather than by a crash in the generator');
  ok(pinMsgs({ block: `${block}\nReport \`contract: 9\` if unsure.` })
    .some((m) => /must demand exactly one contract version/.test(m)),
  'a second contract-version literal in the block fails: skew handling must not fail open');
  ok(pinMsgs({ block: block.replace(`\`${CONTRACT_SKILL}\``, '`kai-core-contract`') })
    .some((m) => new RegExp(`does not name \`${CONTRACT_SKILL}\``).test(m)),
  'a block naming the wrong probe fails: it would probe nothing');

  // --- role availability is membership, never a count -------------------
  const directorBody = readAgent(DISPATCHING_ROLES[0]);
  ok(DISPATCHING_ROLES.every((id) => availabilityErrors({ body: readAgent(id) }).length === 0),
    'every lease-granting role states that availability is read from the roster by membership');
  for (const rule of AVAILABILITY_RULES) {
    const stripped = normalizeLF(directorBody).replace(rule.pattern, '');
    ok(availabilityErrors({ body: stripped }).some((m) => m.includes(rule.rule)),
      `dropping "${rule.rule}" from a lease-granting role fails by name`);
  }

  // --- one family list for every agent-shaped token ---------------------
  ok(rosterAgents.every((id) => agentShapedPattern().test(id)),
    'every shipped agent id matches the agent-shaped pattern the reference checks use (one family list, not two)');

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

// Every agent in exactly one pack, every skill with exactly one provider, every
// reviewed override still placing something, core's namespace respected in both
// directions, and role availability still decided by roster membership.
function gatePartition() {
  const plan = planPacks(ROOT);
  const errs = [
    ...partitionErrors({ plan, agents: rosterAgentIds(), skills: rosterSkillIds() }),
    ...namespaceErrors({ core: plan.core, local: plan.local }),
  ];
  for (const id of DISPATCHING_ROLES) {
    for (const msg of availabilityErrors({ body: readAgent(id) })) {
      errs.push(`agents/${id}.agent.md ${msg}`);
    }
  }
  return errs;
}

// Two packs emitting one id. Duplicate-provider behavior differs by host and
// namespace surface, so this is checked over what the generator actually emits
// rather than over the plan that produced it.
function gateCollision() {
  const files = materializePacks({ root: ROOT, version: GATE_VERSION });
  return [
    ...generatedKeyErrors(files).map((e) => `${e.file}: ${e.msg}`),
    ...generatedPackageErrors(files).map((e) => `${e.file}: ${e.msg}`),
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
// resolves, every invoked script travels with the pack that invokes it, the
// hooks file has exactly one owner, and both guarantee blocks are in place.
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
    ...generatedPackageErrors(files),
    ...generatedRuntimeErrors(files),
    ...referenceErrors({ refs, providers: packProviders(files) }),
    ...assetOwnershipErrors({
      assets,
      exists: (asset) => existsSync(join(ROOT, ...asset.split('/'))),
    }),
    ...hooksAssignmentErrors({
      owners: [...new Set([HOOKS_OWNER, ...claimants])],
      hookAssets: liveHookAssets(),
      assets,
    }),
    ...hookAssetReferenceErrors(readFileSync(join(ROOT, HOOKS_FILE), 'utf8')),
    ...guaranteeBlockErrors({
      files, preflight: preflightBlock(), degraded: degradedBlock(),
    }),
  ].map((e) => `${e.file}: ${e.msg}`);
}

// The contract version, wherever it is stated, plus the two refusal paths a
// department agent has to take: no core at all, and a core speaking a version
// the injected block does not accept.
function gateSkew() {
  const errs = contractPinErrors({
    block: preflightBlock(),
    probe: existsSync(skillPath(CONTRACT_SKILL))
      ? readFileSync(skillPath(CONTRACT_SKILL), 'utf8')
      : null,
  }).map((e) => `${e.file}: ${e.msg}`);

  const dir = mkdtempSync(join(tmpdir(), 'kai-gate-skew-'));
  try {
    const arm = (name, opts) => {
      const out = join(dir, name);
      buildAll({ out, packs: ['personal'], ...opts });
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
  console.log(`pack agents: ${r.agents.length}, pack-local skills: ${r.local.length}`);
  console.log(r.coreDir ? `core: ${r.coreDir}` : 'core: not built');
  console.log(`pack: ${r.packDir}`);
  reportPreflight(out);
} else {
  console.log('usage: node scripts/pack-preview.mjs --check          (regenerate + diff committed packs/)');
  console.log('       node scripts/pack-preview.mjs --write          (materialise committed packs/)');
  console.log('       node scripts/pack-preview.mjs --out <dir> [--no-core] [--contract N]');
  console.log('       node scripts/pack-preview.mjs --all --out <dir>');
  console.log('       node scripts/pack-preview.mjs --self-test');
  console.log(`       node scripts/pack-preview.mjs --gate <${[...GATES.keys()].join('|')}|all>`);
}
