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

// The version-pinned preflight probe skill (materialised downstream, not on disk
// today) and the exact refusal token a core-less pack agent must emit. Shared so
// the preview and any future gate assert on the same constants.
export const CONTRACT_SKILL = 'kai-core-contract-v1';
export const REFUSAL = 'KAI-CORE-MISSING';

// The default committed-tree root. release-guard classifies changes under it as
// behavior-sensitive and the validator discovers manifests under it; the
// generated trees themselves land in a downstream item.
export const PACKS_DIR = 'packs';

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

// The skills an agent inherits, read from its single `**Inherits:**` line and
// filtered to those that exist on disk (a named-but-absent skill is a separate
// validator concern, not a partition input).
export function inheritedSkills(root, body) {
  const line = body.match(/^\*\*Inherits:\*\*(.*)$/m);
  if (!line) return [];
  return [...line[1].matchAll(/`([^`]+)`/g)].map((m) => m[1])
    .filter((s) => existsSync(skillFile(root, s)));
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

  const onDisk = readdirSync(join(root, 'skills'))
    .filter((d) => existsSync(skillFile(root, d))).sort();

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
// file content (LF-normalised, sorted keys). Agent and skill bodies are copied
// verbatim from root — root stays the single source of truth and nothing is
// moved. Guarantee-block injection (preflight, degraded-mode) and non-markdown
// asset routing are added by downstream items, not here.
export function materializePacks({
  root = REPO_ROOT, version = '0.0.0-preview', packs = PACK_ORDER,
} = {}) {
  const files = new Map();
  for (const p of planManifests({ root, version, packs })) {
    files.set(`${p.dir}/plugin.json`, `${JSON.stringify(p.manifest, null, 2)}\n`);
    for (const id of p.agents) {
      files.set(`${p.dir}/agents/${id}.agent.md`, normalizeLF(readAgentBody(root, id)));
    }
    for (const id of p.skills) {
      files.set(`${p.dir}/skills/${id}/SKILL.md`, normalizeLF(readFileSync(skillFile(root, id), 'utf8')));
    }
  }
  return new Map([...files].sort((a, b) => a[0].localeCompare(b[0])));
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
