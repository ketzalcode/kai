// The single machine-readable source of the pack partition and the per-pack
// manifest contract. The preview/generator (scripts/pack-preview.mjs) and the
// validator (scripts/validate-plugin.mjs) both import from here, so the five-pack
// partition is defined once and every path agrees on it byte-for-byte.
//
// Read-only and pure: this module reads root agents/skills and computes plans and
// gate decisions. Writing generated trees to disk is the caller's job (the
// generator), so nothing here mutates the working tree.
//
// Dependency-free (Node built-ins only), consistent with the rest of scripts/.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

// scripts/lib/ -> repo root is two levels up. Callers may pass an explicit root
// (tests, or a generator run against a checkout) but default to this repo.
export const REPO_ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');

// The version-pinned preflight probe skill and the exact refusal token a
// core-less pack agent must emit. Shared so the generator, the preview and the
// validator assert on the same constants.
export const CONTRACT_SKILL = 'kai-core-contract-v1';
export const CONTRACT_VERSION = '1';
export const REFUSAL = 'KAI-CORE-MISSING';

// The canonical fail-closed preflight, copied into every generated department
// agent's own body. It lives in a file, not in this module, so the generator,
// the preview and the CI byte-pin all assert on the same bytes — the same
// reason scripts/lib/inherits-block.txt is a file.
export const PREFLIGHT_BLOCK_REL = 'scripts/lib/preflight-block.txt';

// The default committed-tree root. release-guard classifies changes under it as
// behavior-sensitive and the validator discovers manifests under it; the
// generated trees themselves land in a downstream item.
export const PACKS_DIR = 'packs';

// The host executes hooks.json itself, on every subagent, for everyone who
// installs the plugin that ships it. Two installed packs carrying it means the
// observer runs twice per subagent; none carrying it means it never runs. So it
// is assigned to exactly one pack, and core is that pack: the one plugin every
// department already requires.
export const HOOKS_FILE = 'hooks.json';
export const HOOKS_OWNER = 'core';

// Every one of the 56 agents belongs to exactly one pack. `core` is the org spine
// and workspace machinery — the roles meaningful with no department installed.
// Insertion order is the emission order (see PACK_ORDER); it matches the locked
// partition doc's evidence, so do not reorder without re-locking that artifact.
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
  personal: [
    'persona-professional-nutritionist', 'persona-professional-trainer', 'persona-self',
    'instructor-tutor', 'instructor-teacher', 'instructor-path-mentor',
    'creative-video-director', 'principal-engineer-career-mentor', 'workflow-course-to-audio',
  ],
};

// Deterministic pack emission order: core first, then the departments in the
// partition's declared order. Fixed so a generated tree and a validator walk
// list the same packs in the same sequence every run.
export const PACK_ORDER = Object.keys(PACKS);

// Skills with no inherited firing path still need one explicit provider. These
// dispositions were ratified in the partition lock; keeping them here makes the
// generator use the reviewed decision instead of silently defaulting to core.
export const SKILL_OWNER_OVERRIDES = {
  'create-product-demo': 'personal',
  'demo-capture': 'personal',
  'demo-narrate': 'personal',
  'demo-zoom': 'personal',
  'fleet-observation': 'core',
  // The probe is invoked by the injected preflight, not by an `**Inherits:**`
  // line, so inheritance cannot place it. Core provides it: a pack agent asks
  // core whether core is there.
  [CONTRACT_SKILL]: 'core',
  'onboard-to-codebase': 'engineering',
  'review-dependencies': 'engineering',
  'review-performance-scale': 'engineering',
  'review-success-metrics': 'engineering',
};

// The generated trees land incrementally. The downstream extraction item
// changes this to ['core', 'personal']; until then --write must not materialise
// every department merely because the full partition is known.
export const COMMITTED_PACKS = [];

// The plugin name a pack publishes under. Core is the required shared plugin;
// departments are `kai-<department>`.
export const packPluginName = (pack) => (pack === 'core' ? 'kai-core' : `kai-${pack}`);

// A functional, non-marketing manifest description. Published copy is refined at
// the marketplace flip; scaffolding only needs to say what the plugin is.
function packDescription(pack) {
  return pack === 'core'
    ? 'kai-core: the shared operating contract and workspace machinery every kai department pack depends on.'
    : `kai ${pack} department pack — the ${pack} roles, over a required kai-core.`;
}

// The repo checks out CRLF on Windows; normalising every emitted file to LF keeps
// generated output byte-identical across platforms so re-running is stable and a
// committed tree compares cleanly regardless of the checkout's line endings.
export const normalizeLF = (text) => text.replace(/\r\n/g, '\n');

const readAgentBody = (root, id) => readFileSync(join(root, 'agents', `${id}.agent.md`), 'utf8');
const skillFile = (root, id) => join(root, 'skills', id, 'SKILL.md');

const listAgentIds = (root) => readdirSync(join(root, 'agents'))
  .filter((f) => f.endsWith('.agent.md')).map((f) => f.replace(/\.agent\.md$/, ''));

const listSkillIds = (root) => readdirSync(join(root, 'skills'))
  .filter((d) => existsSync(skillFile(root, d))).sort();

// Every skill named on an agent's single `**Inherits:**` line, as written —
// including one that does not exist, which is a reference miss rather than a
// partition input.
export function declaredInherits(body) {
  const line = normalizeLF(body).match(/^\*\*Inherits:\*\*(.*)$/m);
  if (!line) return [];
  return [...line[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

// The skills an agent inherits, read from its single `**Inherits:**` line and
// filtered to those that exist on disk (a named-but-absent skill is a separate
// validator concern, not a partition input).
export function inheritedSkills(root, body) {
  return declaredInherits(body).filter((s) => existsSync(skillFile(root, s)));
}

// Assign every skill on disk to exactly one provider. The mechanical rule handles
// inherited skills; SKILL_OWNER_OVERRIDES carries the reviewed disposition for
// user-invocable and orchestrated skills that inheritance alone cannot place.
export function planPacks(root = REPO_ROOT) {
  const packOf = new Map();
  for (const [pack, ids] of Object.entries(PACKS)) for (const id of ids) packOf.set(id, pack);

  const allAgents = listAgentIds(root);
  const unassigned = allAgents.filter((id) => !packOf.has(id));

  const usedBy = new Map();
  for (const id of allAgents) {
    for (const s of inheritedSkills(root, readAgentBody(root, id))) {
      if (!usedBy.has(s)) usedBy.set(s, new Set());
      usedBy.get(s).add(packOf.get(id) ?? '?');
    }
  }

  const onDisk = listSkillIds(root);

  const inheritedCore = [];
  const inheritedLocal = Object.fromEntries(Object.keys(PACKS).map((p) => [p, []]));
  const orphans = [];
  for (const s of onDisk) {
    const packs = usedBy.get(s);
    if (!packs) { orphans.push(s); continue; }
    if (packs.size > 1 || packs.has('core')) inheritedCore.push(s);
    else inheritedLocal[[...packs][0]].push(s);
  }

  const core = [...inheritedCore];
  const local = Object.fromEntries(
    Object.entries(inheritedLocal).map(([pack, skills]) => [pack, [...skills]]),
  );
  const unplaced = [];
  for (const skill of orphans) {
    const owner = SKILL_OWNER_OVERRIDES[skill];
    if (owner === 'core') core.push(skill);
    else if (owner && local[owner]) local[owner].push(skill);
    else unplaced.push(skill);
  }
  core.sort();
  for (const skills of Object.values(local)) skills.sort();
  return {
    core,
    local,
    orphans,
    unplaced,
    inheritedCore: inheritedCore.sort(),
    inheritedLocal,
    unassigned,
  };
}

// The deterministic plan for a selected portion of the partition: one descriptor
// per pack, in PACK_ORDER, with the reviewed skill ownership already applied.
export function planManifests({
  root = REPO_ROOT, version = '0.0.0-preview', packs = PACK_ORDER,
} = {}) {
  const plan = planPacks(root);
  const selected = [...new Set(packs)];
  const unknown = selected.filter((pack) => !PACKS[pack]);
  if (unknown.length) throw new Error(`unknown pack(s): ${unknown.join(', ')}`);
  return PACK_ORDER.filter((pack) => selected.includes(pack)).map((pack) => {
    const isCore = pack === 'core';
    const name = packPluginName(pack);
    const agents = [...PACKS[pack]].sort();
    const skills = (isCore ? [...plan.core] : [...plan.local[pack]]).sort();

    // Fixed key order for byte-stable JSON: name, version, description, agents, skills.
    const manifest = { name, version, description: packDescription(pack) };
    if (agents.length) manifest.agents = 'agents';
    manifest.skills = 'skills';

    return { pack, name, dir: name, kind: isCore ? 'core' : 'department', agents, skills, manifest };
  });
}

// Materialise the whole partition into an in-memory map of pack-relative path ->
// file content (LF-normalised, sorted keys). Skill bodies and core agent bodies
// are copied verbatim from root — root stays the single source of truth and
// nothing is moved. Department agent bodies additionally carry the canonical
// fail-closed preflight (below); the degraded-mode block and non-markdown asset
// routing are added by downstream items, not here.
export function materializePacks({
  root = REPO_ROOT, version = '0.0.0-preview', packs = PACK_ORDER,
} = {}) {
  const files = new Map();
  const block = preflightBlock(root);
  for (const p of planManifests({ root, version, packs })) {
    files.set(`${p.dir}/plugin.json`, `${JSON.stringify(p.manifest, null, 2)}\n`);
    for (const id of p.agents) {
      const body = normalizeLF(readAgentBody(root, id));
      // Core agents ship inside the pack that provides the probe, so a preflight
      // there could only ever fail on itself.
      files.set(`${p.dir}/agents/${id}.agent.md`,
        p.kind === 'core' ? body : injectPreflight(body, block));
    }
    for (const id of p.skills) {
      files.set(`${p.dir}/skills/${id}/SKILL.md`, normalizeLF(readFileSync(skillFile(root, id), 'utf8')));
    }
  }
  return new Map([...files].sort((a, b) => a[0].localeCompare(b[0])));
}

// The canonical preflight text, read from disk rather than restated here: one
// source is what the CI byte-pin pins, and prose duplicated into JS is prose
// that drifts.
export function preflightBlock(root = REPO_ROOT) {
  return normalizeLF(readFileSync(join(root, ...PREFLIGHT_BLOCK_REL.split('/')), 'utf8')).trimEnd();
}

// Splice the block into an agent body, LF throughout: splicing LF lines into a
// CRLF checkout would leave the generated agent with mixed endings.
export function injectPreflight(body, block) {
  const lines = normalizeLF(body).split('\n');
  const at = afterInheritsDirective(lines);
  const spacer = lines[at] === undefined || lines[at].trim() === '' ? [] : [''];
  lines.splice(at, 0, '', ...block.split('\n'), ...spacer);
  return lines.join('\n');
}

// The first line after the whole inherits directive block — the `**Inherits:**`
// line plus the blockquote that binds it — so the probe never lands between a
// rule and its own instruction. With no directive to anchor to, it goes directly
// under the frontmatter: a pack agent that silently skipped the preflight is the
// exact failure the block exists to prevent.
function afterInheritsDirective(lines) {
  const i = lines.findIndex((l) => l.startsWith('**Inherits:**'));
  if (i === -1) return lines[0] === '---' ? lines.indexOf('---', 1) + 1 : 0;
  let j = i + 1;
  if (lines[j]?.trim() === '' && lines[j + 1]?.startsWith('>')) j += 1;
  while (lines[j]?.startsWith('>')) j += 1;
  return j;
}

// Every committed plugin manifest: the root monolith plus any pack tree under
// packs/. Today packs/ is absent, so this returns just the root manifest and the
// validator behaves exactly as it did in the single-manifest era.
export function discoverManifests(root = REPO_ROOT, packsDir = PACKS_DIR) {
  const found = [];
  const rootManifest = join(root, 'plugin.json');
  if (existsSync(rootManifest)) {
    found.push({ path: rootManifest, dir: root, rel: 'plugin.json', isRoot: true });
  }
  const base = join(root, packsDir);
  if (existsSync(base) && statSync(base).isDirectory()) {
    for (const e of readdirSync(base, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      if (!e.isDirectory()) continue;
      const p = join(base, e.name, 'plugin.json');
      if (existsSync(p)) {
        found.push({ path: p, dir: join(base, e.name), rel: `${packsDir}/${e.name}/plugin.json`, isRoot: false });
      }
    }
  }
  return found;
}

// Per-manifest version agreement. Every shipped manifest — the monolith and every
// pack — must declare the same version. The northstar keeps per-pack semver in
// lockstep, so a pack whose version drifts from the canonical one is a
// release-hygiene failure, not a feature. Pure over parsed manifests
// (`[{ rel, version }]`); returns `[{ rel, msg }]`.
export function manifestParityErrors(manifests, canonicalVersion) {
  const errs = [];
  for (const m of manifests) {
    if (!m.version) { errs.push({ rel: m.rel, msg: 'manifest is missing "version"' }); continue; }
    if (canonicalVersion && m.version !== canonicalVersion) {
      errs.push({
        rel: m.rel,
        msg: `version "${m.version}" must equal the canonical plugin version "${canonicalVersion}" `
          + '— packs release in lockstep, so bump every manifest together',
      });
    }
  }
  return errs;
}

// Marketplace index consistency, generalised to N plugins. The index MAY list
// more than one plugin (kai-core + departments) once packs are published, but:
// the marketplace name is fixed, the monolith entry must remain until the flip
// retires it, no two entries may share a name, and every entry that names an
// in-repo plugin must agree with that plugin's own manifest. A pack manifest with
// no entry is fine — packs stay unpublished until the marketplace flip, so their
// absence from the index must not error. Pure: source-on-disk resolution is the
// one FS check and stays with the caller. Returns plain message strings.
export function marketplaceConsistencyErrors({
  mkt, marketName, monolithName, canonicalVersion, manifestsByName,
}) {
  const errs = [];
  const known = manifestsByName instanceof Map ? manifestsByName : new Map(Object.entries(manifestsByName ?? {}));

  if (mkt.name !== marketName) {
    errs.push(`"name" is "${mkt.name ?? 'missing'}" but every documented install says `
      + `\`${monolithName}@${marketName}\` — the host uses this name as the registration key `
      + 'and offers no local override, so changing it breaks the docs and every existing install');
  }
  if (!mkt.owner?.name) errs.push('missing "owner.name" (the host refuses a marketplace without it)');

  const entries = Array.isArray(mkt.plugins) ? mkt.plugins : null;
  if (!entries) { errs.push('missing "plugins" array (required by the host)'); return errs; }

  const counts = new Map();
  for (const e of entries) {
    if (!e?.name) { errs.push('a "plugins" entry is missing "name"'); continue; }
    counts.set(e.name, (counts.get(e.name) ?? 0) + 1);
  }
  for (const [name, c] of counts) {
    if (c > 1) errs.push(`${c} entries are named "${name}" — which one an install resolves to is unspecified`);
  }
  if (!counts.has(monolithName)) {
    errs.push(`no entry named "${monolithName}" — the index must list this plugin or `
      + `\`plugin install ${monolithName}@${marketName}\` cannot resolve`);
  }

  for (const e of entries) {
    if (!e?.name) continue;
    if (!e.source) errs.push(`entry "${e.name}" is missing "source" (required by the host)`);
    const man = known.get(e.name);
    if (man) {
      if (e.version !== man.version) {
        errs.push(`entry "${e.name}" version "${e.version ?? 'missing'}" must equal plugin.json version `
          + `"${man.version}" — a stale index installs fine and reports the wrong version`);
      }
      if (e.description !== man.description) {
        errs.push(`entry "${e.name}" description must match plugin.json, which is canonical `
          + '— this copy is what `marketplace browse` shows before anyone installs');
      }
    } else if (!e.version) {
      errs.push(`entry "${e.name}" is missing "version"`);
    }
  }

  if (mkt.metadata && mkt.metadata.version && mkt.metadata.version !== canonicalVersion) {
    errs.push(`metadata.version "${mkt.metadata.version}" must equal the canonical plugin version "${canonicalVersion}"`);
  }
  return errs;
}

// ---------------------------------------------------------------------------
// Cross-pack references
//
// A department pack installs with kai-core and nothing else. Every reference a
// shipped body makes therefore has to resolve inside its own pack or inside
// core, on all three paths a skill can reach a session — inherited,
// user-invoked, orchestrated — plus the non-markdown assets an instruction
// tells someone to run. In the monolith all of them resolve trivially, which is
// exactly why the break is invisible until a user installs one pack.
//
// Collection reads the tree; every `*Errors` function below is pure over plain
// data, so the self-test proves each failure mode by name without building a
// fixture repository.
// ---------------------------------------------------------------------------

// The one static shape the roster already uses to declare a situational
// dispatch: `- **`id`** — when it applies`. Deliberately narrower than "any
// backticked mention": prose cross-references ("the technical counterpart to
// `ui-mockup`") are editorial, and reading those as firing paths would make
// most of the corpus a cross-pack dependency it is not.
const DISPATCH_ENTRY = /^\s*[-*]\s+\*\*`([^`]+)`\*\*/;

// Role ids carry a family prefix. A dispatch entry shaped like one that
// resolves to nothing is a renamed or deleted role; a token that is not shaped
// like one (`post-only`) is an output mode, not a reference.
const AGENT_SHAPED = /^(?:principal|workflow|director|persona|instructor|creative)-[a-z0-9-]+$/;

// A non-markdown asset a shipped instruction invokes. Only top-level scripts/
// executables qualify: scripts/lib/ is build-internal, and no shipped body tells
// anyone to run it.
const ASSET_REF = /(?<![A-Za-z0-9_-])scripts\/[A-Za-z0-9_-]+\.(?:mjs|js|cjs|ps1|sh|py)/g;

// Situational dispatch targets declared in a body, in declaration order.
export function dispatchedRefs(body) {
  const out = [];
  for (const line of normalizeLF(body).split('\n')) {
    if (/^\*\*Inherits:\*\*/.test(line)) continue;
    const m = line.match(DISPATCH_ENTRY);
    if (m && !out.includes(m[1])) out.push(m[1]);
  }
  return out;
}

// Every plugin-relative asset path a body invokes, de-duplicated.
function assetRefs(text) {
  return [...new Set(normalizeLF(text).match(ASSET_REF) ?? [])];
}

// skill id -> providing pack, from the same plan the generator emits.
function skillOwners(plan) {
  const owners = new Map();
  for (const id of plan.core) owners.set(id, 'core');
  for (const [pack, ids] of Object.entries(plan.local)) for (const id of ids) owners.set(id, pack);
  return owners;
}

// agent id -> owning pack, straight from the locked partition.
function agentOwners() {
  const owners = new Map();
  for (const [pack, ids] of Object.entries(PACKS)) for (const id of ids) owners.set(id, pack);
  return owners;
}

// What the generator actually emits, indexed as `<kind>:<id> -> [pack, …]`.
// Resolving references against emitted files rather than against the plan is the
// point: the emitted tree is what a user installs, so a provider the generator
// forgot to copy shows up here as a miss instead of as a plan that still adds up.
export function packProviders(files) {
  const providers = new Map();
  const add = (key, pack) => {
    if (!providers.has(key)) providers.set(key, []);
    if (!providers.get(key).includes(pack)) providers.get(key).push(pack);
  };
  for (const key of files.keys()) {
    const [dir, kind, ...rest] = key.split('/');
    const pack = dir.replace(/^kai-/, '');
    if (kind === 'skills' && rest.length === 2 && rest[1] === 'SKILL.md') add(`skill:${rest[0]}`, pack);
    else if (kind === 'agents' && rest.length === 1 && rest[0].endsWith('.agent.md')) {
      add(`agent:${rest[0].replace(/\.agent\.md$/, '')}`, pack);
    }
  }
  for (const list of providers.values()) list.sort();
  return providers;
}

// Every reference that must survive the plugin boundary: one record per
// (consumer, kind, target), carrying the firing paths it travels.
//
//   inherited    — an agent's `**Inherits:**` line, and the assets of a skill
//                  that reaches a session that way;
//   user-invoked — a `user-invocable: true` skill's own entry point and assets,
//                  which fire with no agent to carry a dependency for them;
//   orchestrated — an agent's dispatch entries, and the assets in its own body,
//                  which fire when something dispatches the agent.
export function collectReferences(root = REPO_ROOT) {
  const plan = planPacks(root);
  const skillOf = skillOwners(plan);
  const agentOf = agentOwners();

  const refs = [];
  const add = (from, fromPack, firing, kind, target) => {
    const seen = refs.find((r) => r.from === from && r.kind === kind && r.target === target);
    if (seen) { if (!seen.firing.includes(firing)) seen.firing.push(firing); return; }
    refs.push({ from, fromPack, firing: [firing], kind, target });
  };

  const dispatched = new Set();
  const inherited = new Set();
  for (const id of listAgentIds(root).sort()) {
    const body = readAgentBody(root, id);
    const from = `agents/${id}.agent.md`;
    const pack = agentOf.get(id) ?? null;
    for (const skill of declaredInherits(body)) {
      inherited.add(skill);
      add(from, pack, 'inherited', 'skill', skill);
    }
    for (const token of dispatchedRefs(body)) {
      if (skillOf.has(token)) { dispatched.add(token); add(from, pack, 'orchestrated', 'skill', token); }
      else if (agentOf.has(token) || AGENT_SHAPED.test(token)) add(from, pack, 'orchestrated', 'agent', token);
    }
    for (const asset of assetRefs(body)) add(from, pack, 'orchestrated', 'asset', asset);
  }

  for (const id of listSkillIds(root)) {
    const raw = normalizeLF(readFileSync(skillFile(root, id), 'utf8'));
    const from = `skills/${id}/SKILL.md`;
    const pack = skillOf.get(id) ?? null;
    const firings = [];
    if (inherited.has(id)) firings.push('inherited');
    if (/^user-invocable:\s*true\s*$/m.test(raw)) firings.push('user-invoked');
    if (dispatched.has(id)) firings.push('orchestrated');
    // The direct entry point: `/skills run <id>` resolves across every installed
    // plugin, so the pack that ships it must be the one that provides it.
    if (firings.includes('user-invoked')) add(from, pack, 'user-invoked', 'skill', id);
    for (const firing of firings) {
      for (const asset of assetRefs(raw)) add(from, pack, firing, 'asset', asset);
    }
  }
  return refs;
}

// Resolve collected references against the providers the generator emits.
// Pure: `providers` is the `<kind>:<id> -> [pack, …]` index from packProviders.
export function referenceErrors({ refs, providers }) {
  const errs = [];
  for (const ref of refs) {
    const label = `${ref.firing.join(' + ')} reference to ${ref.kind} \`${ref.target}\``;
    if (ref.kind === 'asset') continue; // owned by assetOwnershipErrors, which knows where assets live
    if (!ref.fromPack) {
      errs.push({
        file: ref.from,
        msg: `${label} comes from a file no pack owns — place it in PACKS or SKILL_OWNER_OVERRIDES `
          + 'before its references can resolve to anything',
      });
      continue;
    }
    const owners = providers.get(`${ref.kind}:${ref.target}`) ?? [];
    if (owners.length === 0) {
      errs.push({
        file: ref.from,
        msg: `${label} resolves to no pack — nothing in the partition provides it, so the reference `
          + `dangles as soon as ${packPluginName(ref.fromPack)} is installed on its own`,
      });
      continue;
    }
    if (owners.length > 1) {
      errs.push({
        file: ref.from,
        msg: `${label} is provided by ${owners.map(packPluginName).join(' and ')} — with both installed, `
          + 'which copy answers is unspecified',
      });
      continue;
    }
    const owner = owners[0];
    if (owner === 'core' || owner === ref.fromPack) continue;
    // An agent is a routing target, not a load-time dependency: naming a role in
    // another department degrades to "that pack is not installed", while a skill
    // is loaded and a missing one breaks the body that named it. The locked
    // partition's dependency-direction claim is about providers, not referrals.
    if (ref.kind === 'agent') continue;
    errs.push({
      file: ref.from,
      msg: `${label} resolves to ${packPluginName(owner)}, but ${packPluginName(ref.fromPack)} may only `
        + 'reach its own pack or kai-core — no department pack depends on another',
    });
  }
  return errs;
}

// Assign every referenced asset to one pack, by the ratified rule: an asset
// travels with the sole pack that invokes it, and an asset invoked from more
// than one pack promotes to core, the plugin every pack already requires.
// Pure over collected references; the generator consumes this to route assets
// into trees, and the checks below re-derive the invariants from the consumers.
export function planAssets(refs) {
  const assets = new Map();
  for (const ref of refs) {
    if (ref.kind !== 'asset') continue;
    const entry = assets.get(ref.target) ?? { asset: ref.target, consumers: [], packs: new Set() };
    entry.consumers.push({ from: ref.from, pack: ref.fromPack });
    if (ref.fromPack) entry.packs.add(ref.fromPack);
    assets.set(ref.target, entry);
  }
  for (const entry of assets.values()) {
    entry.owner = entry.packs.size === 1 ? [...entry.packs][0] : 'core';
  }
  return new Map([...assets].sort((a, b) => a[0].localeCompare(b[0])));
}

// Check the asset plan against the bodies that invoke it: the file exists, a
// shared asset is owned by core, and every consumer can reach its owner.
// `exists` is injected so this stays pure and testable off a real tree.
export function assetOwnershipErrors({ assets, exists }) {
  const errs = [];
  for (const [asset, entry] of assets) {
    const packs = [...entry.packs].sort();
    if (!exists(asset)) {
      errs.push({
        file: entry.consumers[0].from,
        msg: `invokes \`${asset}\`, which does not exist in this plugin — the pack that ships that `
          + 'instruction would carry a command nobody can run',
      });
      continue;
    }
    if (packs.length > 1 && entry.owner !== 'core') {
      errs.push({
        file: asset,
        msg: `is invoked from ${packs.map(packPluginName).join(' and ')} but is assigned to `
          + `${packPluginName(entry.owner)} — an asset shared across packs belongs to kai-core`,
      });
      continue;
    }
    for (const consumer of entry.consumers) {
      if (!consumer.pack) {
        errs.push({ file: consumer.from, msg: `invokes \`${asset}\` but belongs to no pack` });
        continue;
      }
      if (entry.owner === 'core' || entry.owner === consumer.pack) continue;
      errs.push({
        file: consumer.from,
        msg: `invokes \`${asset}\`, which ships in ${packPluginName(entry.owner)} — `
          + `${packPluginName(consumer.pack)} can only run its own assets or kai-core's`,
      });
    }
  }
  return errs;
}

// hooks.json is assigned to exactly one pack, and the scripts it runs ship in
// that same pack. Pure: `owners` is every pack claiming the file, `hookAssets`
// the plugin-relative commands it runs, `assets` the plan from planAssets.
export function hooksAssignmentErrors({ owners, hookAssets = [], assets = new Map(), packs = PACK_ORDER }) {
  const errs = [];
  const file = HOOKS_FILE;
  if (owners.length === 0) {
    errs.push({
      file,
      msg: 'is assigned to no pack — the host-executed subagent observer would ship in no plugin at all',
    });
  } else if (owners.length > 1) {
    errs.push({
      file,
      msg: `is claimed by ${owners.map(packPluginName).join(' and ')} — the host loads every installed `
        + 'copy, so the observer would fire once per pack on every subagent',
    });
  }
  for (const owner of owners) {
    if (!packs.includes(owner)) errs.push({ file, msg: `is assigned to "${owner}", which is not a pack` });
  }
  const owner = owners.length === 1 ? owners[0] : null;
  for (const asset of hookAssets) {
    const entry = assets.get(asset);
    if (!entry) {
      errs.push({
        file,
        msg: `runs \`${asset}\`, which no pack owns — a hook cannot point at a file its own plugin `
          + 'does not ship',
      });
      continue;
    }
    if (owner && entry.owner !== owner) {
      errs.push({
        file,
        msg: `runs \`${asset}\`, owned by ${packPluginName(entry.owner)}, but ships in `
          + `${packPluginName(owner)} — \${PLUGIN_ROOT} resolves inside the hook's own plugin`,
      });
    }
  }
  return errs;
}
