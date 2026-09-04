// The single machine-readable source of the pack partition and the per-pack
// manifest contract. The preview/generator (scripts/pack-preview.mjs) and the
// validator (scripts/validate-plugin.mjs) both import from here, so the five-pack
// partition is defined once and every path agrees on it byte-for-byte.
//
// Read-only and pure: this module reads plugin-local agents/skills and computes
// plans and gate decisions. Writing derived files or managed regions to disk is
// the caller's job, so nothing here mutates the working tree.
//
// Dependency-free (Node built-ins only), consistent with the rest of scripts/.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join, dirname, posix } from 'node:path';
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

// Core's owned namespace. Duplicate exposure is not a guaranteed host contract;
// it has been measured on one host only (Windows 11, Copilot CLI 1.0.80). A
// prefix core alone may use removes that ambiguity; see namespaceErrors.
export const CORE_SKILL_PREFIX = 'kai-core-';

// The canonical fail-closed preflight retained by legacy department agents.
// kai-agent-v1 agents check core just in time and carry no copied guard. This
// lives in a file so the generator, preview and CI byte-pin assert the same
// bytes throughout the staged migration.
export const PREFLIGHT_BLOCK_REL = 'scripts/lib/preflight-block.txt';

// The canonical degraded-mode refusal, carried on the same terms. It answers the
// one case the preflight cannot: core answered and is compatible, and the shared
// operating contract still is not in the session. Because a refusal restates no
// rule it has nothing to drift from; `degradedBlockErrors` below is what keeps it
// a refusal instead of a second copy of the contract.
export const DEGRADED_BLOCK_REL = 'scripts/lib/degraded-block.txt';

// The default committed-tree root. release-guard classifies changes under it as
// behavior-sensitive, the validator discovers manifests under it, and the
// generator writes the reviewed committed slice there.
export const PACKS_DIR = 'plugins';

export const GUARANTEE_REGION_OPEN =
  '<!-- >>> kai core dependency guard (managed by pack-preview) >>> -->';
export const GUARANTEE_REGION_CLOSE =
  '<!-- <<< kai core dependency guard <<< -->';
const LEGACY_GUARANTEE_REGION_OPEN =
  '<!-- >>> kai core dependency guard (managed by pack-preview) >>>';

// The host executes hooks.json itself, on every subagent, for everyone who
// installs the plugin that ships it. Two installed packs carrying it means the
// observer runs twice per subagent; none carrying it means it never runs. So it
// is assigned to exactly one pack, and core is that pack: the one plugin every
// department already requires.
export const HOOKS_FILE = 'hooks.json';
export const HOOKS_OWNER = 'core';

// The migration baseline freezes every id that existed before the
// provider-posture-scope taxonomy. New agents go in NEW_AGENT_IDS, including
// new workflows/personas/instructors; adding a retired-family id there fails.
// Keeping the baseline separate makes "no new principal/director/creative
// agents" enforceable without blocking one-at-a-time migration.
const MIGRATION_BASELINE_PACKS = {
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
    'principal-ai-researcher', 'workflow-pull-request',
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

export const NEW_AGENT_IDS = {
  core: [],
  engineering: ['eng-lead-technical-writing'],
  product: [],
  gtm: [],
  personal: [],
};

export const PACKS = Object.fromEntries(
  Object.keys(MIGRATION_BASELINE_PACKS)
    .map((pack) => [pack, [...MIGRATION_BASELINE_PACKS[pack], ...NEW_AGENT_IDS[pack]]]),
);

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
  // The probe is invoked by the injected preflight, not by an `**Inherits:**`
  // line, so inheritance cannot place it. Core provides it: a pack agent asks
  // core whether core is there.
  [CONTRACT_SKILL]: 'core',
  'kai-core-create-agent': 'core',
  'kai-core-fleet-observation': 'core',
  'onboard-to-codebase': 'engineering',
  'review-dependencies': 'engineering',
  'review-performance-scale': 'engineering',
  'review-success-metrics': 'engineering',
};

// The published surface now equals the full locked partition. Retain this alias
// so generation, marketplace policy, rollback policy, and CI share one name.
export const COMMITTED_PACKS = [...PACK_ORDER];

// Runtime dependencies belong to the pack that directly executes them. The
// host copies plugin trees but does not run npm, so these declarations provide
// a deterministic `npm ci --prefix <pack-root>` contract rather than implying
// dependencies are installed automatically.
export const PACK_RUNTIME_DEPENDENCIES = {
  core: ['lectoria'],
  engineering: [],
  product: [],
  gtm: [],
  personal: ['lectoria'],
};

export const RUNTIME_ARTIFACTS = {
  lectoria: {
    version: '0.1.0',
    spec: 'https://github.com/RubenSaucedo/lectoria/releases/download/v0.1.0/lectoria-0.1.0.tgz',
    integrity: 'sha512-EBC2cPfS8AiCK1VvXPJZbxua6MlhswGwSLiJqXQPlA8Repn6KcvjyfSNMgIp5/04LEzHvK2fEEBSFTA8A9tXWw==',
    lockKey: 'node_modules/lectoria',
    // The executable `npm ci` links into <pack>/node_modules/.bin. Declared here
    // so CI asserts a binary the artifact actually provides, not the dependency
    // name it happens to share today.
    binary: 'lectoria',
  },
};

// The plugin name a pack publishes under. Core is the required shared plugin;
// departments are `kai-<department>`.
export const packPluginName = (pack) => (pack === 'core' ? 'kai-core' : `kai-${pack}`);

// The runtime-dependency legs CI runs, derived from the committed pack set and
// the declared dependency plan. A pack declaring none yields a leg with nothing
// to assert, so publishing a department never means editing the workflow to make
// its own pack legal.
export function runtimeDependencyMatrix(packs = COMMITTED_PACKS) {
  return packs.map((pack) => {
    const dependencies = PACK_RUNTIME_DEPENDENCIES[pack];
    if (!dependencies) throw new Error(`no runtime dependency plan exists for pack "${pack}"`);
    return {
      pack,
      name: packPluginName(pack),
      binaries: [...dependencies].sort().map((dependency) => {
        const binary = RUNTIME_ARTIFACTS[dependency]?.binary;
        if (!binary) throw new Error(`runtime dependency "${dependency}" declares no sanctioned executable`);
        return binary;
      }),
    };
  });
}

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

const sourceRel = (pack, ...parts) => `${PACKS_DIR}/${packPluginName(pack)}/${parts.join('/')}`;
const sourcePath = (root, pack, ...parts) => join(root, ...sourceRel(pack, ...parts).split('/'));

export function sourceAgentFiles(root = REPO_ROOT) {
  const files = [];
  for (const pack of PACK_ORDER) {
    const dir = sourcePath(root, pack, 'agents');
    if (!existsSync(dir)) continue;
    for (const f of readdirSync(dir).filter((name) => name.endsWith('.agent.md')).sort()) {
      files.push({
        pack,
        id: f.replace(/\.agent\.md$/, ''),
        kind: 'agent',
        path: join(dir, f),
        rel: sourceRel(pack, 'agents', f),
      });
    }
  }
  return files;
}

export function sourceSkillFiles(root = REPO_ROOT) {
  const files = [];
  for (const pack of PACK_ORDER) {
    const dir = sourcePath(root, pack, 'skills');
    if (!existsSync(dir)) continue;
    for (const d of readdirSync(dir).sort()) {
      const path = join(dir, d, 'SKILL.md');
      if (!existsSync(path)) continue;
      files.push({
        pack,
        id: d,
        kind: 'skill',
        path,
        rel: sourceRel(pack, 'skills', d, 'SKILL.md'),
      });
    }
  }
  return files;
}

export function skillCompanionFiles(root, id) {
  const skill = sourceSkillFiles(root).find((entry) => entry.id === id);
  if (!skill) return [];
  const base = dirname(skill.path);
  const files = [];
  const walk = (dir, prefix = '') => {
    for (const entry of readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
      const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
      const path = join(dir, entry.name);
      if (entry.isDirectory()) walk(path, rel);
      else if (rel !== 'SKILL.md') files.push({ rel, path });
    }
  };
  walk(base);
  return files;
}

export function agentSourceFile(root, id) {
  return sourceAgentFiles(root).find((entry) => entry.id === id)?.path ?? null;
}

export function skillSourceFile(root, id) {
  return sourceSkillFiles(root).find((entry) => entry.id === id)?.path ?? null;
}

export function sourceFileErrors({
  agents = sourceAgentFiles(), skills = sourceSkillFiles(),
} = {}) {
  const errors = [];
  for (const [kind, files] of [['agent', agents], ['skill', skills]]) {
    const byId = new Map();
    for (const file of files) {
      if (!byId.has(file.id)) byId.set(file.id, []);
      byId.get(file.id).push(file);
    }
    for (const [id, copies] of byId) {
      if (copies.length < 2) continue;
      errors.push({
        file: copies.map((copy) => copy.rel).join(', '),
        msg: `${kind} "${id}" has ${copies.length} plugin-local source files — exactly one source is allowed`,
      });
    }
  }
  return errors;
}

export function sourcePlacementErrors({
  agents = sourceAgentFiles(), skills = sourceSkillFiles(), plan, packs = PACKS,
} = {}) {
  const errors = [];
  const expectedAgentPack = new Map();
  for (const [pack, ids] of Object.entries(packs)) {
    for (const id of ids) expectedAgentPack.set(id, pack);
  }
  for (const entry of agents) {
    const expected = expectedAgentPack.get(entry.id);
    if (!expected || expected === entry.pack) continue;
    errors.push({
      file: entry.rel,
      msg: `agent "${entry.id}" belongs in ${packPluginName(expected)}, not ${packPluginName(entry.pack)}`,
    });
  }

  if (!plan) return errors;
  const expectedSkillPack = new Map();
  for (const id of plan.core) expectedSkillPack.set(id, 'core');
  for (const [pack, ids] of Object.entries(plan.local)) {
    for (const id of ids) expectedSkillPack.set(id, pack);
  }
  for (const entry of skills) {
    const expected = expectedSkillPack.get(entry.id);
    if (!expected || expected === entry.pack) continue;
    errors.push({
      file: entry.rel,
      msg: `skill "${entry.id}" belongs in ${packPluginName(expected)}, not ${packPluginName(entry.pack)}`,
    });
  }
  return errors;
}

const readAgentBody = (root, id) => {
  const path = agentSourceFile(root, id);
  if (!path) throw new Error(`agent "${id}" belongs to no declared plugin`);
  return readFileSync(path, 'utf8');
};
const skillFile = (root, id) => skillSourceFile(root, id);

const listAgentIds = (root) => sourceAgentFiles(root).map((file) => file.id);

const listSkillIds = (root) => sourceSkillFiles(root).map((file) => file.id).sort();

function readPackageMetadata(root) {
  const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
  const packageLock = JSON.parse(readFileSync(join(root, 'package-lock.json'), 'utf8'));
  if (packageLock.lockfileVersion !== 3 || !packageLock.packages?.['']) {
    throw new Error('package-lock.json must be lockfileVersion 3 with a packages[""] record');
  }
  return { packageJson, packageLock };
}

function parentPackageKey(key) {
  const marker = '/node_modules/';
  const at = key.lastIndexOf(marker);
  return at === -1 ? '' : key.slice(0, at);
}

function lockedDependencyKey(packages, fromKey, dependency) {
  let scope = fromKey;
  while (true) {
    const candidate = scope
      ? `${scope}/node_modules/${dependency}`
      : `node_modules/${dependency}`;
    if (packages[candidate]) return candidate;
    if (!scope) return null;
    scope = parentPackageKey(scope);
  }
}

function projectLockPackages(packageLock, directDependencies) {
  const source = packageLock.packages;
  const projected = new Map();
  const queue = Object.keys(directDependencies).map((name) => {
    const key = lockedDependencyKey(source, '', name);
    if (!key) throw new Error(`package-lock.json has no resolved package for runtime dependency "${name}"`);
    return key;
  });

  while (queue.length) {
    const key = queue.shift();
    if (projected.has(key)) continue;
    const node = source[key];
    if (!node) throw new Error(`package-lock.json is missing required package record "${key}"`);
    projected.set(key, node);

    for (const dependency of Object.keys(node.dependencies ?? {})) {
      const child = lockedDependencyKey(source, key, dependency);
      if (!child) {
        throw new Error(`package-lock.json cannot resolve "${dependency}" required by "${key}"`);
      }
      queue.push(child);
    }
    for (const dependency of [
      ...Object.keys(node.optionalDependencies ?? {}),
      ...Object.keys(node.peerDependencies ?? {}),
    ]) {
      const child = lockedDependencyKey(source, key, dependency);
      if (child) queue.push(child);
    }
  }

  return Object.fromEntries([...projected].sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

function hasFullSha512Integrity(value) {
  if (typeof value !== 'string' || !/^sha512-[A-Za-z0-9+/]+={0,2}$/.test(value)) {
    return false;
  }
  const digest = value.slice('sha512-'.length);
  const bytes = Buffer.from(digest, 'base64');
  return bytes.length === 64 && bytes.toString('base64') === digest;
}

function runtimeDependencyContractMessages(dependencies, packages) {
  const messages = [];
  const sanctionedArtifacts = new Map(
    Object.values(RUNTIME_ARTIFACTS).map((artifact) => [artifact.spec, artifact])
  );

  for (const [key, record] of Object.entries(packages)) {
    if (key === '') continue;
    const resolved = record.resolved;
    let source = null;
    if (typeof resolved !== 'string' || !resolved) {
      messages.push(`lock record "${key}" has no immutable resolved URL`);
    } else {
      try {
        source = new URL(resolved);
      } catch {
        messages.push(`lock record "${key}" has invalid resolved URL "${resolved}"`);
      }
    }
    if (source?.protocol !== 'https:') {
      messages.push(`lock record "${key}" must resolve over HTTPS, got "${resolved ?? 'missing'}"`);
    } else if (source.hostname === 'registry.npmjs.org') {
      // Registry tarballs are the default approved runtime source.
    } else if (!sanctionedArtifacts.has(resolved)) {
      messages.push(`lock record "${key}" resolves from unapproved runtime source "${resolved}"`);
    }
    if (!hasFullSha512Integrity(record.integrity)) {
      messages.push(`lock record "${key}" must carry a complete SHA-512 integrity digest`);
    }
  }

  for (const [dependency, artifact] of Object.entries(RUNTIME_ARTIFACTS)) {
    if (!(dependency in dependencies)) continue;
    if (dependencies[dependency] !== artifact.spec) {
      messages.push(`runtime dependency "${dependency}" must use sanctioned artifact "${artifact.spec}"`);
    }
    const record = packages[artifact.lockKey];
    if (!record) {
      messages.push(`runtime dependency "${dependency}" has no "${artifact.lockKey}" lock record`);
      continue;
    }
    if (record.version !== artifact.version) {
      messages.push(`runtime dependency "${dependency}" must lock version "${artifact.version}"`);
    }
    if (record.resolved !== artifact.spec) {
      messages.push(`runtime dependency "${dependency}" must lock sanctioned artifact "${artifact.spec}"`);
    }
    if (record.integrity !== artifact.integrity) {
      messages.push(`runtime dependency "${dependency}" does not match its pinned SHA-512 integrity`);
    }
  }

  return messages;
}

function packPackageMetadata({ pack, name, version, packageJson, packageLock }) {
  const dependencyNames = PACK_RUNTIME_DEPENDENCIES[pack];
  if (!dependencyNames) throw new Error(`no runtime dependency plan exists for pack "${pack}"`);

  const dependencies = {};
  for (const dependency of [...dependencyNames].sort()) {
    const spec = packageJson.dependencies?.[dependency];
    if (!spec) throw new Error(`package.json does not declare pack runtime dependency "${dependency}"`);
    dependencies[dependency] = spec;
  }

  const manifest = {
    name,
    version,
    private: true,
    engines: packageJson.engines ?? {},
    dependencies,
  };
  const lockRoot = {
    name,
    version,
    dependencies,
    engines: packageJson.engines ?? {},
  };
  const projectedPackages = projectLockPackages(packageLock, dependencies);
  const contractMessages = runtimeDependencyContractMessages(dependencies, projectedPackages);
  if (contractMessages.length) {
    throw new Error(`${name} runtime dependency contract is invalid:\n${contractMessages.join('\n')}`);
  }
  const lock = {
    name,
    version,
    lockfileVersion: 3,
    requires: true,
    packages: {
      '': lockRoot,
      ...projectedPackages,
    },
  };
  return { packageManifest: manifest, packageLock: lock };
}

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
  return declaredInherits(body).filter((s) => skillFile(root, s) !== null);
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
  const packageMetadata = readPackageMetadata(root);
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
    const npm = packPackageMetadata({ pack, name, version, ...packageMetadata });

    return {
      pack,
      name,
      dir: name,
      kind: isCore ? 'core' : 'department',
      agents,
      skills,
      manifest,
      ...npm,
    };
  });
}

// Materialise the installable surface into an in-memory map of pack-relative
// path -> file content (LF-normalised, sorted keys). Agent and skill bodies are
// already authoritative inside their owning plugin and are read in place.
// Routed scripts carry their relative module closure so every copied entry point
// remains loadable inside its plugin.
export function materializePacks({
  root = REPO_ROOT, version = '0.0.0-preview', packs = PACK_ORDER,
} = {}) {
  const files = new Map();
  const manifests = planManifests({ root, version, packs });
  const selected = new Set(manifests.map((entry) => entry.pack));
  for (const p of manifests) {
    files.set(`${p.dir}/plugin.json`, `${JSON.stringify(p.manifest, null, 2)}\n`);
    files.set(`${p.dir}/package.json`, `${JSON.stringify(p.packageManifest, null, 2)}\n`);
    files.set(`${p.dir}/package-lock.json`, `${JSON.stringify(p.packageLock, null, 2)}\n`);
    for (const id of p.agents) {
      const body = normalizeLF(readAgentBody(root, id));
      files.set(`${p.dir}/agents/${id}.agent.md`, body);
    }
    for (const id of p.skills) {
      const path = skillFile(root, id);
      if (!path) throw new Error(`skill "${id}" has no plugin-local source file`);
      files.set(`${p.dir}/skills/${id}/SKILL.md`, normalizeLF(readFileSync(path, 'utf8')));
      for (const companion of skillCompanionFiles(root, id)) {
        files.set(`${p.dir}/skills/${id}/${companion.rel}`,
          normalizeLF(readFileSync(companion.path, 'utf8')));
      }
    }
  }
  const assets = planAssets(collectReferences(root));
  const closure = planAssetClosure({
    assets,
    exists: (asset) => existsSync(join(root, ...asset.split('/'))),
    read: (asset) => readFileSync(join(root, ...asset.split('/')), 'utf8'),
    dependencies: new Map(PACK_ORDER.map((pack) => [
      pack,
      new Set(PACK_RUNTIME_DEPENDENCIES[pack]),
    ])),
  });
  if (closure.errors.length) {
    throw new Error(closure.errors.map((e) => `${e.file}: ${e.msg}`).join('\n'));
  }
  for (const [owner, ownedAssets] of closure.files) {
    if (!selected.has(owner)) continue;
    for (const asset of ownedAssets) {
      files.set(`${packPluginName(owner)}/${asset}`,
        normalizeLF(readFileSync(join(root, ...asset.split('/')), 'utf8')));
    }
  }
  if (selected.has(HOOKS_OWNER)) {
    files.set(`${packPluginName(HOOKS_OWNER)}/${HOOKS_FILE}`,
      normalizeLF(readFileSync(join(root, HOOKS_FILE), 'utf8')));
  }
  return new Map([...files].sort((a, b) => a[0].localeCompare(b[0])));
}

// The canonical block texts, read from disk rather than restated here: one source
// is what the CI byte-pin pins, and prose duplicated into JS is prose that drifts.
const readBlock = (root, relPath) =>
  normalizeLF(readFileSync(join(root, ...relPath.split('/')), 'utf8')).trimEnd();

export const preflightBlock = (root = REPO_ROOT) => readBlock(root, PREFLIGHT_BLOCK_REL);

export const degradedBlock = (root = REPO_ROOT) => readBlock(root, DEGRADED_BLOCK_REL);

// The guarantee blocks every legacy department agent carries, in the order they
// must appear. kai-agent-v1 agents use progressive skill routing and omit them.
// Defined once so the generator, preview and validator cannot disagree during
// the staged migration.
export const guaranteeBlocks = (root = REPO_ROOT) => [preflightBlock(root), degradedBlock(root)];

export const guaranteeRegion = (root = REPO_ROOT) => [
  GUARANTEE_REGION_OPEN,
  ...guaranteeBlocks(root),
  GUARANTEE_REGION_CLOSE,
].join('\n\n');

// Legacy department agents carry one explicitly managed region. `--write` may
// replace it without treating the rest of the authoritative body as generated
// output. kai-agent-v1 agents have any stale region removed. Missing legacy
// regions are inserted at the original safe anchor; malformed half-regions fail.
export function syncGuaranteeRegion(body, root = REPO_ROOT) {
  const normalized = normalizeLF(body);
  if (normalized.includes(`**Identity contract:** \`${ROLE_IDENTITY_CONTRACT}\``)) {
    return removeGuaranteeRegion(normalized);
  }
  const canonicalOpenAt = normalized.indexOf(GUARANTEE_REGION_OPEN);
  const legacyOpenAt = normalized.indexOf(LEGACY_GUARANTEE_REGION_OPEN);
  const openAt = canonicalOpenAt !== -1 ? canonicalOpenAt : legacyOpenAt;
  const openMarker = canonicalOpenAt !== -1
    ? GUARANTEE_REGION_OPEN
    : legacyOpenAt !== -1 ? LEGACY_GUARANTEE_REGION_OPEN : null;
  const closeAt = normalized.indexOf(GUARANTEE_REGION_CLOSE);
  if ((openAt === -1) !== (closeAt === -1)) {
    throw new Error('agent has only one core dependency guard marker');
  }
  const region = guaranteeRegion(root);
  if (openAt === -1) {
    const [preflight, degraded] = guaranteeBlocks(root);
    const preflightAt = normalized.indexOf(preflight);
    const degradedAt = normalized.indexOf(degraded);
    if ((preflightAt === -1) !== (degradedAt === -1)) {
      throw new Error('agent has only one legacy core dependency guard block');
    }
    if (preflightAt !== -1) {
      const preflightEnd = preflightAt + preflight.length;
      if (degradedAt < preflightEnd
        || normalized.slice(preflightEnd, degradedAt).trim() !== '') {
        throw new Error('agent legacy core dependency guard blocks are not adjacent');
      }
      return `${normalized.slice(0, preflightAt)}${region}${normalized.slice(degradedAt + degraded.length)}`;
    }
    return injectBlocks(normalized, [region]);
  }
  if (normalized.indexOf(GUARANTEE_REGION_OPEN, openAt + openMarker.length) !== -1
    || normalized.indexOf(LEGACY_GUARANTEE_REGION_OPEN, openAt + openMarker.length) !== -1
    || normalized.indexOf(GUARANTEE_REGION_CLOSE, closeAt + 1) !== -1) {
    throw new Error('agent has more than one core dependency guard region');
  }
  if (closeAt < openAt) throw new Error('agent core dependency guard closes before it opens');
  const end = closeAt + GUARANTEE_REGION_CLOSE.length;
  return `${normalized.slice(0, openAt)}${region}${normalized.slice(end)}`;
}

export function removeGuaranteeRegion(body) {
  const normalized = normalizeLF(body);
  const markerLines = normalized.split('\n');
  const openCount = markerLines.filter((line) =>
    line === GUARANTEE_REGION_OPEN || line === LEGACY_GUARANTEE_REGION_OPEN).length;
  const closeCount = markerLines.filter((line) => line === GUARANTEE_REGION_CLOSE).length;
  if (openCount > 1 || closeCount > 1) {
    throw new Error('agent has more than one core dependency guard region');
  }
  const canonicalOpenAt = normalized.indexOf(GUARANTEE_REGION_OPEN);
  const legacyOpenAt = normalized.indexOf(LEGACY_GUARANTEE_REGION_OPEN);
  const openAt = canonicalOpenAt !== -1 ? canonicalOpenAt : legacyOpenAt;
  const closeAt = normalized.indexOf(GUARANTEE_REGION_CLOSE);
  if (openAt === -1 && closeAt === -1) return normalized;
  if (openAt === -1 || closeAt === -1 || closeAt < openAt) {
    throw new Error('agent has a malformed core dependency guard region');
  }
  const end = closeAt + GUARANTEE_REGION_CLOSE.length;
  const before = normalized.slice(0, openAt).replace(/\n+$/, '');
  const after = normalized.slice(end).replace(/^\n+/, '');
  return `${before}\n\n${after}`;
}

// Splice the ordered blocks into an agent body, LF throughout: splicing LF lines
// into a CRLF checkout would leave the generated agent with mixed endings. One
// splice, in argument order — injecting twice would re-resolve the same anchor
// and push the newer block above the preflight that has to stay first.
export function injectBlocks(body, blocks) {
  const lines = normalizeLF(body).split('\n');
  const at = afterInheritsDirective(lines);
  const spacer = lines[at] === undefined || lines[at].trim() === '' ? [] : [''];
  const spliced = blocks.flatMap((block) => ['', ...block.split('\n')]);
  lines.splice(at, 0, ...spliced, ...spacer);
  return lines.join('\n');
}

// The single-block form, kept for callers that inject only the preflight.
export const injectPreflight = (body, block) => injectBlocks(body, [block]);

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

// ---------------------------------------------------------------------------
// The degraded refusal's own rules
//
// The block's entire value is that it restates nothing: a prohibition stays
// correct however core evolves, while an affirmative instruction is a second
// copy of the operating contract that drifts from it silently. So the rules
// below allow exactly three things to be said — refuse, prohibit, install
// `kai-core` — and reject anything that names, quotes or outgrows the contract.
// Pure over plain data, so the preview self-test proves each failure by name.
// ---------------------------------------------------------------------------

// A refusal needing more room than this has become the fallback contract it
// exists not to be. Raising it is a decision, not a formatting fix.
export const DEGRADED_BLOCK_MAX = 1200;

// Long enough that a shared line is a lifted sentence rather than a coincidence.
const DEGRADED_QUOTE_MIN = 40;

// The two affirmative instructions the block may give — the single-shot refusal
// and the one remedy — plus the prohibitions, which cannot drift.
const DEGRADED_OPENERS = [/^Do not\b/, /^Never\b/, /^Refuse\b/, /^Tell the operator to install\b/];

// Every substantial line of the shipped core contract, derived from the live core
// skills so the "restates no rule" check re-derives as core evolves instead of
// pinning a list that rots.
export function coreContractLines(root = REPO_ROOT) {
  const lines = new Set();
  for (const id of listSkillIds(root)) {
    if (!id.startsWith('kai-core-')) continue;
    for (const line of normalizeLF(readFileSync(skillFile(root, id), 'utf8')).split('\n')) {
      const text = line.trim();
      if (text.length >= DEGRADED_QUOTE_MIN) lines.add(text);
    }
  }
  return lines;
}

// Returns plain message strings, one per violated rule.
export function degradedBlockErrors({
  block, refusalToken, ids = new Set(), contractLines = new Set(),
}) {
  const errs = [];
  const known = ids instanceof Set ? ids : new Set(ids);
  const contract = contractLines instanceof Set ? contractLines : new Set(contractLines);
  const text = normalizeLF(block);

  if (!text.includes('`kai-core`')) {
    errs.push('never names `kai-core`, so it states the problem and withholds the one thing that fixes it');
  }
  if (!text.includes('single-shot')) {
    errs.push('does not say the session is single-shot — without that it reads as a pause, not a refusal');
  }
  if (refusalToken && text.includes(refusalToken)) {
    errs.push(`carries the preflight's exact \`${refusalToken}\` token, which means core is missing or skewed; `
      + 'this block covers the case where core answered, so overloading the token makes both refusals unreadable');
  }
  if (/`contract:/.test(text)) {
    errs.push('states a contract version; compatibility belongs to the preflight alone, and a second version '
      + 'literal is exactly the fail-open skew the preflight pin exists to prevent');
  }
  if (text.length > DEGRADED_BLOCK_MAX) {
    errs.push(`is ${text.length} characters, over the ${DEGRADED_BLOCK_MAX}-character refusal budget — `
      + 'a refusal that needs this much room has become the fallback contract it exists not to be');
  }

  const bullets = text.split('\n').filter((l) => /^-\s+/.test(l)).map((l) => l.replace(/^-\s+/, ''));
  if (!bullets.length) errs.push('states no instruction at all');
  for (const bullet of bullets) {
    if (DEGRADED_OPENERS.some((re) => re.test(bullet))) continue;
    errs.push(`gives the affirmative instruction "${bullet}" — the block may only refuse, prohibit, or say to `
      + 'install `kai-core`; anything else is a coordination rule, and a coordination rule here drifts from core');
  }
  const opening = (re) => bullets.filter((b) => re.test(b)).length;
  if (opening(/^Refuse\b/) !== 1) {
    errs.push('must carry exactly one `Refuse …` instruction — the single-shot refusal is the whole block');
  }
  if (opening(/^Tell the operator to install\b/) !== 1) {
    errs.push('must carry exactly one `Tell the operator to install …` instruction — one remedy, stated once');
  }
  if (!opening(/^(Do not|Never)\b/)) errs.push('carries no prohibition, so it refuses nothing');

  for (const m of text.matchAll(/`([^`]+)`/g)) {
    if (!known.has(m[1])) continue;
    errs.push(`names the shipped contract \`${m[1]}\` — a refusal cites no contract, and citing one is the `
      + 'first step to copying it');
  }
  for (const line of text.split('\n')) {
    const t = line.trim();
    if (t.length < DEGRADED_QUOTE_MIN || !contract.has(t)) continue;
    errs.push(`restates the shipped core contract verbatim ("${t.slice(0, 60)}…") — the block states the `
      + 'absence of the contract, it never carries a copy of it');
  }
  return errs;
}

// Every committed plugin manifest: the root monolith plus any plugin tree under
// plugins/. The validator applies version parity across the root monolith and
// every committed generated pack it discovers here.
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
// in-repo plugin must agree with that plugin's own manifest. Which names are
// required and which are forbidden is the caller's decision, derived in
// `marketplaceSurfacePolicy`. Pure: source-on-disk resolution is the one FS check
// and stays with the caller. Returns plain message strings.
export function marketplaceConsistencyErrors({
  mkt, marketName, monolithName, canonicalVersion, manifestsByName,
  manifestsBySource = {}, requiredPluginNames = [monolithName],
  forbiddenPluginNames = [],
}) {
  const errs = [];
  const known = manifestsByName instanceof Map ? manifestsByName : new Map(Object.entries(manifestsByName ?? {}));
  const knownSources = manifestsBySource instanceof Map
    ? manifestsBySource
    : new Map(Object.entries(manifestsBySource ?? {}));

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
  for (const name of requiredPluginNames) {
    if (counts.has(name)) continue;
    errs.push(`no entry named "${name}" — the published install surface requires `
      + `\`plugin install ${name}@${marketName}\``);
  }
  for (const name of forbiddenPluginNames) {
    if (!counts.has(name)) continue;
    errs.push(`entry "${name}" is not part of the published install surface and must not be listed`);
  }

  for (const e of entries) {
    if (!e?.name) continue;
    if (typeof e.source !== 'string' || !e.source.trim()) {
      errs.push(`entry "${e.name}" has a non-string or missing "source" (required by the host)`);
    }
    const sourceKey = typeof e.source === 'string'
      ? e.source.replace(/\\/g, '/').replace(/^\.\/?/, '').replace(/\/+$/, '') || '.'
      : null;
    const sourceManifest = sourceKey ? knownSources.get(sourceKey) : null;
    if (sourceManifest?.name && sourceManifest.name !== e.name) {
      errs.push(`entry "${e.name}" source "${e.source}" contains plugin "${sourceManifest.name}" `
        + '— marketplace names must match the manifest at their source');
    }
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

// Which plugin names the published index must and must not carry. Both sets are
// DERIVED from the partition, never listed: `packs` serves exactly the committed
// pack set, and `legacy-rollback` restores the monolith alone — so it forbids
// every name `packPluginName` can emit, including packs published after this
// code was written. A literal here would silently bless a rollback index that
// restored the monolith beside a department pack.
export function marketplaceSurfacePolicy({
  mkt, canonicalVersion, monolithName,
  publishedPackNames = COMMITTED_PACKS.map(packPluginName),
  publishablePackNames = PACK_ORDER.map(packPluginName),
}) {
  const errors = [];
  const majorVersion = Number.parseInt(canonicalVersion?.split('.')[0] ?? '', 10);
  const postOne = Number.isInteger(majorVersion) && majorVersion >= 1;
  const installSurface = mkt.metadata?.installSurface;

  if (!postOne) {
    if (installSurface) {
      errors.push('metadata.installSurface is reserved for the 1.0.0-or-later pack publication surface');
    }
    return {
      errors,
      requiredPluginNames: [monolithName],
      forbiddenPluginNames: [],
    };
  }

  if (!['packs', 'legacy-rollback'].includes(installSurface)) {
    errors.push('metadata.installSurface must be "packs" or "legacy-rollback" at version 1.0.0 or later');
  }
  const legacyRollback = installSurface === 'legacy-rollback';
  const unpublished = publishablePackNames.filter((name) => !publishedPackNames.includes(name));
  return {
    errors,
    requiredPluginNames: legacyRollback ? [monolithName] : publishedPackNames,
    forbiddenPluginNames: legacyRollback
      ? publishablePackNames
      : [monolithName, ...unpublished],
  };
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

// A kai-agent-v1 body names its skills inside the instruction that needs them,
// so the bullet shape above cannot be the only firing path. An imperative to
// load a skill is still narrower than "any backticked mention": it is a
// directive, not the editorial cross-reference ("the technical counterpart to
// `ui-mockup`") the rule above deliberately ignores.
const PROSE_DISPATCH = /\b(?:Load|Invoke|Apply|Run)\s+(?:the\s+)?`([a-z0-9][a-z0-9-]*)`/g;

// Role ids carry a family prefix. A dispatch entry shaped like one that
// resolves to nothing is a renamed or deleted role; a token that is not shaped
// like one (`post-only`) is an output mode, not a reference. Baseline families
// remain recognized during the staged migration. New durable roles use their
// provider family plus a controlled posture and scope.
export const ROLE_FAMILY_PACK = Object.freeze({
  core: 'core',
  personal: 'personal',
  prod: 'product',
  eng: 'engineering',
  gtm: 'gtm',
});

export const ROLE_POSTURES = Object.freeze([
  'lead', 'builder', 'reviewer', 'operator', 'coordinator', 'advisor',
]);
export const ROLE_IDENTITY_CONTRACT = 'kai-agent-v1';
export const MODEL_POLICY_VERSION = 'kai-agent-models-v2';
export const AGENT_PROMPT_HARD_LIMIT = 30_000;
export const ROLE_POSTURE_PROFILES = Object.freeze({
  lead: Object.freeze(['judgment', 'technical-judgment']),
  builder: Object.freeze(['execution']),
  reviewer: Object.freeze(['review', 'technical-review']),
  operator: Object.freeze(['operations']),
  coordinator: Object.freeze(['coordination']),
  advisor: Object.freeze(['judgment', 'technical-judgment', 'advisory']),
});
export const KIND_AGENT_PROFILES = Object.freeze({
  workflow: Object.freeze(['procedure']),
  persona: Object.freeze(['simulation']),
  instructor: Object.freeze(['teaching']),
});
export const ROLE_PROFILE_MODELS = Object.freeze({
  judgment: 'claude-opus-5',
  'technical-judgment': 'gpt-5.6-sol',
  review: 'claude-opus-5',
  'technical-review': 'gpt-5.6-terra',
  execution: 'claude-sonnet-5',
  operations: 'claude-sonnet-5',
  coordination: 'claude-sonnet-5',
  advisory: 'claude-sonnet-5',
  procedure: 'claude-sonnet-5',
  teaching: 'claude-sonnet-5',
  simulation: 'claude-sonnet-5',
});

const RETIRED_AGENT_FAMILIES = [
  'principal', 'director', 'creative',
];

const KIND_AGENT_FAMILIES = [
  'workflow', 'persona', 'instructor',
];

export const AGENT_FAMILIES = [
  ...RETIRED_AGENT_FAMILIES, ...KIND_AGENT_FAMILIES, ...Object.keys(ROLE_FAMILY_PACK),
];

const RETIRED_OR_KIND_ALT = [...RETIRED_AGENT_FAMILIES, ...KIND_AGENT_FAMILIES].join('|');
const AGENT_FAMILY_ALT = AGENT_FAMILIES.join('|');
const ROLE_FAMILY_ALT = Object.keys(ROLE_FAMILY_PACK).join('|');
const ROLE_POSTURE_ALT = ROLE_POSTURES.join('|');
const AGENT_ID_SOURCE = `(?:(?:${RETIRED_OR_KIND_ALT})-[a-z0-9-]+`
  + `|(?:${ROLE_FAMILY_ALT})-(?:${ROLE_POSTURE_ALT})-[a-z0-9-]+)`;
const AGENT_CANDIDATE_SOURCE = `(?:(?:${AGENT_FAMILY_ALT})-[a-z0-9-]+)`;

// Fresh instances, because a shared global regex carries `lastIndex` between
// callers and would skip matches depending on who scanned first.
export const agentShapedPattern = () => new RegExp(`^${AGENT_ID_SOURCE}$`);
export const agentCandidatePattern = () => new RegExp(`^${AGENT_CANDIDATE_SOURCE}$`);
export const agentRefPattern = () => new RegExp(`\`(${AGENT_ID_SOURCE})\``, 'g');

const AGENT_SHAPED = agentShapedPattern();
const AGENT_CANDIDATE = agentCandidatePattern();
const RETIRED_AGENT_IDS = new Set(
  Object.values(MIGRATION_BASELINE_PACKS).flat()
    .filter((id) => RETIRED_AGENT_FAMILIES.includes(id.split('-')[0])),
);
const LEGACY_AGENT_IDS = new Set(Object.values(MIGRATION_BASELINE_PACKS).flat());

// The new grammar can coexist with legacy ids while roles are migrated one or
// two at a time. Once an id enters a provider-family namespace, however, its
// posture and placement are enforced immediately.
export function agentTaxonomyErrors({ id, pack }) {
  const [family, posture, ...scope] = (id ?? '').split('-');
  if (RETIRED_AGENT_FAMILIES.includes(family)) {
    return RETIRED_AGENT_IDS.has(id)
      ? []
      : [`agent family \`${family}-*\` is migration-only; new agents must use a provider-family posture or a supported kind prefix`];
  }
  if (KIND_AGENT_FAMILIES.includes(family)) return [];
  if (!(family in ROLE_FAMILY_PACK)) {
    return [`agent family \`${family || '(missing)'}-*\` is not supported`];
  }

  const errs = [];
  if (ROLE_FAMILY_PACK[family] !== pack) {
    errs.push(`agent family \`${family}-*\` belongs to ${packPluginName(ROLE_FAMILY_PACK[family])}, `
      + `not ${packPluginName(pack)}`);
  }
  if (!ROLE_POSTURES.includes(posture)) {
    errs.push(`agent posture \`${posture || '(missing)'}\` is not one of: ${ROLE_POSTURES.join(', ')}`);
  }
  if (scope.length === 0 || scope.some((part) => !part)) {
    errs.push('new durable-role ids must use `<family>-<posture>-<scope>`');
  }
  if (scope.some((part) => ['fe', 'be', 'swe'].includes(part))) {
    errs.push('agent scope must use full responsibility words (`frontend`, `backend`, `software`), not `fe`, `be`, or `swe`');
  }
  return errs;
}

export function requiresCoordinatedRunContracts(id) {
  const [family, posture] = (id ?? '').split('-');
  if (['director', 'principal', 'workflow'].includes(family)) return true;
  return family in ROLE_FAMILY_PACK && ROLE_POSTURES.includes(posture);
}

// Conversational roles have no bounded run to report. Research-only roles lack
// `execute`, so requiring the append-based activity contract would force a
// broader sandbox solely for observability.
export const ACTIVITY_EXEMPT = new Map([
  ['director-executive-assistant', 'interactive routing and agenda assembly, not a bounded run'],
  ['principal-engineer-career-mentor', 'open-ended mentoring conversation, not a bounded run'],
  ['principal-ai-researcher', 'no shell by design; cannot append without gaining `execute`'],
  ['principal-ai-applied-engineer', 'no shell by design; cannot append without gaining `execute`'],
]);

export function progressiveSkillRoutingErrors({
  id, body, tools = [], knownSkills = [], activityExempt = false,
}) {
  const text = normalizeLF(body ?? '');
  if (!text.includes(`**Identity contract:** \`${ROLE_IDENTITY_CONTRACT}\``)) return [];

  const errors = [];
  if (/^\*\*Inherits:\*\*/m.test(text)) {
    errors.push(`${ROLE_IDENTITY_CONTRACT} agents route skills just in time and must not declare an eager \`**Inherits:**\` line`);
  }

  // A skill is routed wherever the instruction that needs it lives. Hoisting
  // every route into one section reproduces the `**Inherits:**` manifest this
  // contract removed, and forces a "do not preload" disclaimer that only exists
  // to argue with its own list. So the checks below are semantic: the named
  // skill must exist, the core probe and its fallback must be stated, and the
  // agent must hold the tool that loads them. Where the sentence sits is the
  // author's judgment. Line wrapping is an authoring choice, not a contract
  // change, so the sentence checks run against a whitespace-collapsed copy.
  const flat = text.replace(/\s+/g, ' ');
  const available = knownSkills instanceof Set ? knownSkills : new Set(knownSkills);
  const mentioned = new Set(
    [...text.matchAll(/`([a-z0-9][a-z0-9-]*)`/g)].map((match) => match[1])
  );
  const routed = new Set([...mentioned].filter(
    (name) => available.has(name) || name.startsWith(CORE_SKILL_PREFIX)
  ));
  for (const skill of routed) {
    if (!available.has(skill)) errors.push(`names unknown skill \`${skill}\``);
  }
  if (!/`kai-core-contract-v1`[\s\S]{0,160}?\bfirst\b[\s\S]{0,80}?\bcore\b/i.test(flat)
    && !/\bbefore\b[\s\S]{0,120}?\bfirst\b[\s\S]{0,120}?`kai-core-contract-v1`/i.test(flat)) {
    errors.push(`must state that \`${CONTRACT_SKILL}\` runs before the first other core skill`);
  }

  const required = [
    CONTRACT_SKILL,
    'kai-core-team-operating-rules',
    'kai-core-asset-lifecycle',
  ];
  if (requiresCoordinatedRunContracts(id)) {
    required.push('kai-core-workspace-conventions');
    if (!activityExempt) required.push('kai-core-work-activity');
  }
  for (const skill of required) {
    if (!routed.has(skill)) {
      errors.push(`must load \`${skill}\` at the step that needs it`);
    }
  }

  const held = tools instanceof Set ? tools : new Set(tools);
  if (routed.size > 0 && !held.has('skill')) {
    errors.push('routes skills but its `tools` list omits `skill`');
  }
  if (activityExempt && routed.has('kai-core-work-activity')) {
    errors.push('is activity-exempt but routes `kai-core-work-activity`; remove the exemption or the route');
  }
  // Line wrapping is an authoring choice, not a contract change, so these
  // sentence checks run against the whitespace-collapsed copy above.
  if (!/If core is unavailable or incompatible,[\s\S]{0,200}\bsingle-shot\b/i.test(flat)
    || !/do not create `\.kai` state/i.test(flat)
    || !/tell\s+the operator to install or update `kai-core`/i.test(flat)) {
    errors.push('must state the non-blocking core fallback: continue single-shot, avoid `.kai` state, and tell the operator to install or update `kai-core`');
  }
  return errors;
}

export function agentIdentityContractErrors({ id, body, fm = {} }) {
  const [family, posture] = (id ?? '').split('-');
  const isDurableRole = family in ROLE_FAMILY_PACK;
  const isNewKind = KIND_AGENT_FAMILIES.includes(family) && !LEGACY_AGENT_IDS.has(id);
  if (!isDurableRole && !isNewKind) return [];
  const marker = `**Identity contract:** \`${ROLE_IDENTITY_CONTRACT}\``;
  const errors = [];
  if (!(body ?? '').includes(marker)) errors.push(`new agent must declare ${marker}`);

  const profiles = [...(body ?? '').matchAll(
    /^\*\*Primary profile:\*\*\s+`?([a-z][a-z-]*)`?\s*$/gm
  )].map((match) => match[1]);
  if (profiles.length !== 1) {
    errors.push(`new agent must declare exactly one \`**Primary profile:** <profile>\` line (found ${profiles.length})`);
    return errors;
  }
  const [profile] = profiles;
  const expected = ROLE_PROFILE_MODELS[profile];
  if (!expected) {
    errors.push(`primary profile \`${profile}\` has no approved model mapping`);
    return errors;
  }
  const allowed = isDurableRole ? ROLE_POSTURE_PROFILES[posture] : KIND_AGENT_PROFILES[family];
  if (!allowed?.includes(profile)) {
    errors.push(`${isDurableRole ? `posture \`${posture}\`` : `kind \`${family}\``} requires primary profile `
      + `${(allowed ?? []).map((value) => `\`${value}\``).join(' or ') || '(none)'}, not \`${profile}\``);
  }
  const model = (fm.model ?? '').trim().replace(/^(['"])(.*)\1$/, '$2');
  if (!model) {
    errors.push(`new agent with profile \`${profile}\` must declare frontmatter model "${expected}"`);
  } else if (model !== expected) {
    errors.push(`primary profile \`${profile}\` requires frontmatter model "${expected}", not "${model}"`);
  }
  return errors;
}

export function agentPromptLimitErrors(body) {
  const length = [...normalizeLF(body ?? '')].length;
  return length > AGENT_PROMPT_HARD_LIMIT
    ? [`agent prompt is ${length} characters, over the ${AGENT_PROMPT_HARD_LIMIT}-character host limit`]
    : [];
}

const markdownTable = (text, heading) => {
  const normalized = normalizeLF(text ?? '');
  const start = normalized.indexOf(`## ${heading}\n`);
  if (start === -1) return new Map();
  const body = normalized.slice(start + heading.length + 4);
  const end = body.search(/\n## /);
  const section = end === -1 ? body : body.slice(0, end);
  const clean = (cell) => cell.trim().replaceAll('`', '');
  const lines = section.split('\n');
  const tableStart = lines.findIndex((line) => /^\|.*\|$/.test(line));
  const tableRest = tableStart === -1 ? [] : lines.slice(tableStart);
  const tableEnd = tableRest.findIndex((line) => !/^\|.*\|$/.test(line));
  const tableLines = tableEnd === -1 ? tableRest : tableRest.slice(0, tableEnd);
  const rows = tableLines
    .map((line) => line.slice(1, -1).split('|').map(clean))
    .filter((row) => row.length > 1 && !/^[-:]+$/.test(row[0]));
  return new Map(rows.slice(1).map((row) => [row[0], row.slice(1)]));
};

const commaValues = (value) => (value ?? '').split(',').map((item) => item.trim()).filter(Boolean).sort();
const sameValues = (actual, expected) =>
  actual.length === expected.length && actual.every((value, index) => value === expected[index]);

export function agentAuthoringReferenceErrors({ taxonomy, modelSelection }) {
  const errors = [];
  const compareKeys = (label, rows, expected) => {
    const actual = [...rows.keys()].sort();
    const wanted = [...expected].sort();
    if (!sameValues(actual, wanted)) {
      errors.push(`${label} rows are [${actual.join(', ')}], expected [${wanted.join(', ')}]`);
    }
  };

  const providers = markdownTable(taxonomy, 'Provider families');
  compareKeys('provider family', providers, Object.keys(ROLE_FAMILY_PACK));
  for (const [family, pack] of Object.entries(ROLE_FAMILY_PACK)) {
    const provider = providers.get(family)?.[0];
    if (provider && provider !== packPluginName(pack)) {
      errors.push(`provider family \`${family}\` names \`${provider}\`, expected \`${packPluginName(pack)}\``);
    }
  }

  const postures = markdownTable(taxonomy, 'Durable-role postures');
  compareKeys('durable-role posture', postures, ROLE_POSTURES);

  const profiles = markdownTable(taxonomy, 'Execution profiles');
  compareKeys('execution profile', profiles, Object.keys(ROLE_PROFILE_MODELS));
  const expectedProfileKinds = new Map(Object.keys(ROLE_PROFILE_MODELS).map((profile) => [profile, []]));
  for (const [posture, allowed] of Object.entries(ROLE_POSTURE_PROFILES)) {
    for (const profile of allowed) expectedProfileKinds.get(profile).push(posture);
  }
  for (const [kind, allowed] of Object.entries(KIND_AGENT_PROFILES)) {
    for (const profile of allowed) expectedProfileKinds.get(profile).push(kind);
  }
  for (const [profile, expected] of expectedProfileKinds) {
    const actual = commaValues(profiles.get(profile)?.[0]);
    const wanted = [...expected].sort();
    if (!sameValues(actual, wanted)) {
      errors.push(`execution profile \`${profile}\` applies to [${actual.join(', ')}], expected [${wanted.join(', ')}]`);
    }
  }

  const policyMarker = `**Policy version:** \`${MODEL_POLICY_VERSION}\``;
  if (!(modelSelection ?? '').includes(policyMarker)) {
    errors.push(`model selection reference must declare ${policyMarker}`);
  }
  const models = markdownTable(modelSelection, 'Approved models');
  const expectedModels = [...new Set(Object.values(ROLE_PROFILE_MODELS))];
  compareKeys('approved model', models, expectedModels);
  for (const model of expectedModels) {
    const actual = commaValues(models.get(model)?.[0]);
    const wanted = Object.entries(ROLE_PROFILE_MODELS)
      .filter(([, mapped]) => mapped === model)
      .map(([profile]) => profile)
      .sort();
    if (!sameValues(actual, wanted)) {
      errors.push(`approved model \`${model}\` covers [${actual.join(', ')}], expected [${wanted.join(', ')}]`);
    }
  }

  const identityMarker = `**Identity contract:** \`${ROLE_IDENTITY_CONTRACT}\``;
  if (!(taxonomy ?? '').includes(identityMarker)) {
    errors.push(`taxonomy reference must declare ${identityMarker}`);
  }
  return errors;
}

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
  for (const m of normalizeLF(body).matchAll(PROSE_DISPATCH)) {
    if (!out.includes(m[1])) out.push(m[1]);
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

// One reading of a generated-tree key, for every check that consumes generator
// output. The pack directory set is derived from the partition itself rather
// than matched with a pattern: `/^kai-[a-z]+\//` agrees with the five current
// keys by coincidence, and the day one carries a hyphen or a digit
// (`kai-customer-success`) that pack's files stop matching and skip whatever
// guarantee the pattern was gating — silently, because a pin that selects
// nothing reports nothing.
export function parseGeneratedKey(key, packs = PACK_ORDER) {
  const [dir, ...rest] = key.split('/');
  const pack = packs.find((p) => packPluginName(p) === dir);
  if (!pack) return null;
  const at = { pack, dir };
  if (rest.length === 1 && rest[0] === 'plugin.json') return { ...at, kind: 'manifest', id: null };
  if (rest.length === 1 && rest[0] === 'package.json') return { ...at, kind: 'package', id: null };
  if (rest.length === 1 && rest[0] === 'package-lock.json') return { ...at, kind: 'lock', id: null };
  if (rest.length === 1 && rest[0] === HOOKS_FILE) return { ...at, kind: 'hooks', id: null };
  if (rest.length === 2 && rest[0] === 'agents' && rest[1].endsWith('.agent.md')) {
    return { ...at, kind: 'agent', id: rest[1].replace(/\.agent\.md$/, '') };
  }
  if (rest.length === 3 && rest[0] === 'skills' && rest[2] === 'SKILL.md') {
    return { ...at, kind: 'skill', id: rest[1] };
  }
  if (rest.length >= 3 && rest[0] === 'skills') {
    return { ...at, kind: 'skill-companion', id: rest.slice(1).join('/'), skill: rest[1] };
  }
  return { ...at, kind: 'other', id: rest.join('/') };
}

// One fail-closed check for generated keys outside the declared pack set.
// Consumers may skip a null parse only because this runs in the same validation
// and gate paths before their narrower checks.
export function generatedKeyErrors(files, packs = PACK_ORDER) {
  const errs = [];
  for (const key of files.keys()) {
    if (parseGeneratedKey(key, packs)) continue;
    errs.push({
      file: `generated ${key}`,
      msg: 'belongs to no declared pack — generated files must not escape validation',
    });
  }
  return errs;
}

// What the generator actually emits, indexed as `<kind>:<id> -> [pack, …]`.
// Resolving references against emitted files rather than against the plan is the
// point: the emitted tree is what a user installs, so a provider the generator
// forgot to copy shows up here as a miss instead of as a plan that still adds up.
export function packProviders(files, packs = PACK_ORDER) {
  const providers = new Map();
  const add = (key, pack) => {
    if (!providers.has(key)) providers.set(key, []);
    if (!providers.get(key).includes(pack)) providers.get(key).push(pack);
  };
  for (const key of files.keys()) {
    const entry = parseGeneratedKey(key, packs);
    if (!entry || (entry.kind !== 'skill' && entry.kind !== 'agent')) continue;
    add(`${entry.kind}:${entry.id}`, entry.pack);
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
    const fromPath = agentSourceFile(root, id);
    const from = fromPath
      ? fromPath.slice(root.length + 1).replace(/\\/g, '/')
      : `agent:${id}`;
    const pack = agentOf.get(id) ?? null;
    for (const skill of declaredInherits(body)) {
      inherited.add(skill);
      add(from, pack, 'inherited', 'skill', skill);
    }
    for (const token of dispatchedRefs(body)) {
      if (skillOf.has(token)) { dispatched.add(token); add(from, pack, 'orchestrated', 'skill', token); }
      else if (agentOf.has(token) || AGENT_CANDIDATE.test(token)) add(from, pack, 'orchestrated', 'agent', token);
    }
    for (const asset of assetRefs(body)) add(from, pack, 'orchestrated', 'asset', asset);
  }

  for (const id of listSkillIds(root)) {
    const path = skillFile(root, id);
    const raw = normalizeLF(readFileSync(path, 'utf8'));
    const companionBodies = skillCompanionFiles(root, id)
      .map((entry) => normalizeLF(readFileSync(entry.path, 'utf8')));
    const from = path.slice(root.length + 1).replace(/\\/g, '/');
    const pack = skillOf.get(id) ?? null;
    const firings = [];
    if (inherited.has(id)) firings.push('inherited');
    if (/^user-invocable:\s*true\s*$/m.test(raw)) firings.push('user-invoked');
    if (dispatched.has(id)) firings.push('orchestrated');
    // The direct entry point: `/skills run <id>` resolves across every installed
    // plugin, so the pack that ships it must be the one that provides it.
    if (firings.includes('user-invoked')) add(from, pack, 'user-invoked', 'skill', id);
    for (const firing of firings) {
      for (const text of [raw, ...companionBodies]) {
        for (const asset of assetRefs(text)) add(from, pack, firing, 'asset', asset);
      }
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

const JAVASCRIPT_ASSET = /\.(?:mjs|js|cjs)$/;
const NODE_MODULES = new Set([
  ...builtinModules,
  ...builtinModules.map((name) => `node:${name}`),
]);

export function moduleSpecifiers(text) {
  const specifiers = new Set();
  const patterns = [
    /\b(?:import|export)\s+(?:[^;]*?\s+from\s+)?['"]([^'"]+)['"]\s*;?/g,
    /\b(?:import|require)\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
  ];
  for (const pattern of patterns) {
    for (const match of text.matchAll(pattern)) specifiers.add(match[1]);
  }
  return [...specifiers];
}

function moduleCandidates(asset, specifier) {
  const clean = specifier.split(/[?#]/, 1)[0];
  const resolved = posix.normalize(posix.join(posix.dirname(asset), clean));
  if (!resolved.startsWith('scripts/')) return [];
  if (posix.extname(resolved)) return [resolved];
  return [
    resolved,
    `${resolved}.mjs`,
    `${resolved}.js`,
    `${resolved}.cjs`,
    `${resolved}/index.mjs`,
    `${resolved}/index.js`,
    `${resolved}/index.cjs`,
  ];
}

function resolveRelativeModule(asset, specifier, exists) {
  return moduleCandidates(asset, specifier).find(exists) ?? null;
}

function barePackageName(specifier) {
  const parts = specifier.split('/');
  return specifier.startsWith('@') ? parts.slice(0, 2).join('/') : parts[0];
}

// Top-level assets are routed by their invoking bodies. Their relative module
// dependencies must travel with them or the copied entry point cannot load.
export function planAssetClosure({ assets, read, exists, dependencies = new Map() }) {
  const files = new Map();
  const errors = [];
  for (const [asset, entry] of assets) {
    if (!files.has(entry.owner)) files.set(entry.owner, new Set());
    const owned = files.get(entry.owner);
    const queue = [asset];
    while (queue.length) {
      const current = queue.shift();
      if (owned.has(current)) continue;
      if (!exists(current)) {
        errors.push({
          file: current,
          msg: `is required by ${packPluginName(entry.owner)} but does not exist`,
        });
        continue;
      }
      owned.add(current);
      if (!JAVASCRIPT_ASSET.test(current)) continue;
      for (const specifier of moduleSpecifiers(read(current))) {
        if (NODE_MODULES.has(specifier)) continue;
        if (!specifier.startsWith('.')) {
          const dependency = barePackageName(specifier);
          if (!dependencies.get(entry.owner)?.has(dependency)) {
            errors.push({
              file: current,
              msg: `imports undeclared bare module \`${specifier}\` — add \`${dependency}\` to `
                + `${packPluginName(entry.owner)}'s runtime dependency plan`,
            });
          }
          continue;
        }
        const dependency = resolveRelativeModule(current, specifier, exists);
        if (!dependency) {
          errors.push({
            file: current,
            msg: `imports \`${specifier}\`, which does not resolve to a plugin file`,
          });
          continue;
        }
        queue.push(dependency);
      }
    }
  }
  return {
    files: new Map([...files].map(([pack, owned]) => [pack, [...owned].sort()])),
    errors,
  };
}

function parseGeneratedJson(files, key, errs) {
  const text = files.get(key);
  if (text === undefined) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    errs.push({ file: `generated ${key}`, msg: `is not valid JSON (${error.message})` });
    return null;
  }
}

// Validate package metadata against the exact deterministic projection of the
// root dependency graph. Generated trees declare installation; the host does
// not perform it.
export function generatedPackageErrors(files, {
  root = REPO_ROOT,
  packs = PACK_ORDER,
} = {}) {
  const errs = [];
  const selected = packs.filter((pack) => files.has(`${packPluginName(pack)}/plugin.json`));

  for (const pack of selected) {
    const dir = packPluginName(pack);
    const pluginKey = `${dir}/plugin.json`;
    const packageKey = `${dir}/package.json`;
    const lockKey = `${dir}/package-lock.json`;
    const plugin = parseGeneratedJson(files, pluginKey, errs);
    const packageJson = parseGeneratedJson(files, packageKey, errs);
    const packageLock = parseGeneratedJson(files, lockKey, errs);

    if (!files.has(packageKey)) {
      errs.push({ file: `generated ${packageKey}`, msg: 'is missing from the generated pack' });
    }
    if (!files.has(lockKey)) {
      errs.push({ file: `generated ${lockKey}`, msg: 'is missing from the generated pack' });
    }
    if (!plugin || !packageJson || !packageLock) continue;

    const [expected] = planManifests({ root, version: plugin.version, packs: [pack] });
    const expectedPackage = `${JSON.stringify(expected.packageManifest, null, 2)}\n`;
    const expectedLock = `${JSON.stringify(expected.packageLock, null, 2)}\n`;
    if (normalizeLF(files.get(packageKey)) !== expectedPackage) {
      errs.push({
        file: `generated ${packageKey}`,
        msg: 'does not match the deterministic runtime dependency projection from root package.json',
      });
    }
    if (normalizeLF(files.get(lockKey)) !== expectedLock) {
      errs.push({
        file: `generated ${lockKey}`,
        msg: 'does not match the deterministic reachable dependency projection from root package-lock.json',
      });
    }
  }
  return errs;
}

// Validate the emitted runtime surface itself. Every copied JavaScript entry
// point must resolve local modules and declare each bare runtime dependency in
// the same pack's manifest and lockfile.
export function generatedRuntimeErrors(files, packs = PACK_ORDER) {
  const errs = [];
  const packageState = new Map();
  for (const pack of packs) {
    const dir = packPluginName(pack);
    const packageJson = parseGeneratedJson(files, `${dir}/package.json`, errs);
    const packageLock = parseGeneratedJson(files, `${dir}/package-lock.json`, errs);
    packageState.set(pack, {
      dependencies: packageJson?.dependencies ?? {},
      locked: packageLock?.packages ?? {},
      hasPackage: packageJson !== null,
      hasLock: packageLock !== null,
    });
    if (packageJson && packageLock) {
      for (const msg of runtimeDependencyContractMessages(
        packageJson.dependencies ?? {},
        packageLock.packages ?? {}
      )) {
        errs.push({ file: `generated ${dir}/package-lock.json`, msg });
      }
    }
  }

  for (const [key, text] of files) {
    const entry = parseGeneratedKey(key, packs);
    if (!entry) continue;
    if (entry.kind !== 'other' || !JAVASCRIPT_ASSET.test(entry.id)) continue;
    for (const specifier of moduleSpecifiers(text)) {
      if (NODE_MODULES.has(specifier)) continue;
      if (!specifier.startsWith('.')) {
        const dependency = barePackageName(specifier);
        const state = packageState.get(entry.pack);
        if (!state?.hasPackage || !(dependency in state.dependencies)) {
          errs.push({
            file: `generated ${key}`,
            msg: `imports undeclared bare module \`${specifier}\`; ${entry.dir}/package.json `
              + `must declare \`${dependency}\` as a runtime dependency`,
          });
        } else if (!state.hasLock || !state.locked[`node_modules/${dependency}`]) {
          errs.push({
            file: `generated ${key}`,
            msg: `imports bare module \`${specifier}\`, but ${entry.dir}/package-lock.json `
              + `has no \`node_modules/${dependency}\` record`,
          });
        }
        continue;
      }
      const dependency = moduleCandidates(entry.id, specifier)
        .map((candidate) => `${entry.dir}/${candidate}`)
        .find((candidate) => files.has(candidate));
      if (!dependency) {
        errs.push({
          file: `generated ${key}`,
          msg: `imports \`${specifier}\`, which is missing from ${entry.dir}`,
        });
      }
    }
  }
  return errs;
}

// hooks.json is assigned to exactly one pack, and the scripts it runs ship in
// that same pack. Pure: `owners` is every pack claiming the file, `hookAssets`
// the plugin-relative commands it runs, `assets` the plan from planAssets.

// The one place a hook command's plugin-relative path is recognised. The host
// executes these on every subagent, so the validator and the CI gate read them
// with the same expression rather than each carrying its own.
export const HOOK_ASSET_RE = /\$\{PLUGIN_ROOT\}\/([A-Za-z0-9_\-./]+)/;

const hookAssetMatches = (command) =>
  [...command.matchAll(/\$\{PLUGIN_ROOT\}\/([A-Za-z0-9_\-./]+)/g)].map((match) => match[1]);

const HOOK_ASSET_PATH = /^scripts\/[A-Za-z0-9_-]+\.(?:mjs|js|cjs|ps1|sh|py)$/;

export function hookAssetReferenceErrors(text) {
  let cfg;
  try { cfg = JSON.parse(text); } catch { return []; }
  const errs = [];
  for (const [event, entries] of Object.entries(cfg.hooks ?? {})) {
    for (const [index, entry] of (Array.isArray(entries) ? entries : []).entries()) {
      const command = entry.command || entry.bash || entry.powershell || '';
      const assets = hookAssetMatches(command);
      if (assets.length > 1) {
        errs.push({
          file: HOOKS_FILE,
          msg: `${event}[${index}] contains ${assets.length} \${PLUGIN_ROOT} paths — one hook command `
            + 'must invoke one owned asset so routing is unambiguous',
        });
      }
      for (const asset of assets) {
        if (HOOK_ASSET_PATH.test(asset)) continue;
        errs.push({
          file: HOOKS_FILE,
          msg: `${event}[${index}] invokes \`${asset}\` outside the supported top-level `
            + '`scripts/<name>.<ext>` asset key-space',
        });
      }
    }
  }
  return errs;
}

// The scripts a hooks.json runs, in declaration order, deduplicated. Invalid
// JSON yields nothing: its own error is reported where the file is parsed.
export function hookAssetsIn(text) {
  let cfg;
  try { cfg = JSON.parse(text); } catch { return []; }
  const out = new Set();
  for (const entries of Object.values(cfg.hooks ?? {})) {
    for (const entry of Array.isArray(entries) ? entries : []) {
      const command = entry.command || entry.bash || entry.powershell || '';
      for (const asset of hookAssetMatches(command)) out.add(asset);
    }
  }
  return [...out];
}

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

// ---------------------------------------------------------------------------
// Partition gates
//
// The partition above is a plan; these are the checks that make it a guarantee.
// Every one is pure over plain data, so the self-test proves each failure by
// name without building a fixture repository, and the validator runs the same
// function over the live tree.
// ---------------------------------------------------------------------------

// Every agent in exactly one pack, every skill with exactly one provider, and
// every reviewed override still pointing at a skill inheritance cannot place.
// Returns plain message strings.
export function partitionErrors({
  plan, agents = [], skills = [], packs = PACKS, overrides = SKILL_OWNER_OVERRIDES,
}) {
  const errs = [];
  const onDisk = new Set(agents);
  const claimedBy = new Map();
  for (const [pack, ids] of Object.entries(packs)) {
    for (const id of ids) {
      if (!onDisk.has(id)) {
        errs.push(`the ${pack} roster names agent \`${id}\`, which is not on disk — a pack cannot ship `
          + 'an agent that does not exist, and the miss is invisible until someone installs that pack');
      }
      const prior = claimedBy.get(id);
      if (prior !== undefined) {
        errs.push(`agent \`${id}\` is claimed by both ${packPluginName(prior)} and ${packPluginName(pack)} `
          + '— every agent belongs to exactly one pack, or two plugins ship the same id');
      } else claimedBy.set(id, pack);
    }
  }
  for (const id of agents) {
    if (!claimedBy.has(id)) {
      errs.push(`agent \`${id}\` belongs to no pack — add it to PACKS, or it ships in nothing`);
    }
  }

  const providerOf = new Map();
  for (const id of plan.core) providerOf.set(id, 'core');
  for (const [pack, ids] of Object.entries(plan.local ?? {})) {
    for (const id of ids) {
      const prior = providerOf.get(id);
      if (prior !== undefined) {
        errs.push(`skill \`${id}\` is provided by both ${packPluginName(prior)} and ${packPluginName(pack)} `
          + '— duplicate providers make resolution host-dependent instead of partition-defined');
      } else providerOf.set(id, pack);
    }
  }
  const skillSet = new Set(skills);
  for (const id of skills) {
    if (!providerOf.has(id)) {
      errs.push(`skill \`${id}\` has no provider — every skill on disk ships in exactly one pack`);
    }
  }
  for (const [id, pack] of providerOf) {
    if (!skillSet.has(id)) {
      errs.push(`skill \`${id}\` is planned into ${packPluginName(pack)} but is not a skill on disk`);
    }
  }

  const orphans = new Set(plan.orphans ?? []);
  for (const [id, owner] of Object.entries(overrides)) {
    if (!skillSet.has(id)) {
      errs.push(`SKILL_OWNER_OVERRIDES places \`${id}\`, which is not a skill on disk — a reviewed `
        + 'disposition for a renamed or deleted skill places nothing and says so nowhere');
      continue;
    }
    if (owner !== 'core' && !packs[owner]) {
      errs.push(`SKILL_OWNER_OVERRIDES places \`${id}\` in "${owner}", which is not a pack`);
      continue;
    }
    if (!orphans.has(id)) {
      errs.push(`SKILL_OWNER_OVERRIDES places \`${id}\`, but an agent already inherits it — inheritance `
        + 'places it, so the override is a second truth about one skill');
    }
  }
  for (const id of orphans) {
    if (!(id in overrides)) {
      errs.push(`skill \`${id}\` is inherited by no agent and has no reviewed provider in `
        + 'SKILL_OWNER_OVERRIDES — it would ship in no pack at all');
    }
  }
  return errs;
}

// Core's owned namespace, in both directions: core may only provide `kai-core-*`
// names, and no department may claim one.
export function namespaceErrors({ core = [], local = {}, prefix = CORE_SKILL_PREFIX }) {
  const errs = [];
  for (const id of core) {
    if (id.startsWith(prefix)) continue;
    errs.push(`kai-core provides skill \`${id}\`, which does not carry the \`${prefix}*\` prefix — a `
      + 'legacy `kai` install provides that same bare name, so provider ownership is ambiguous; '
      + `rename it to \`${prefix}${id}\``);
  }
  for (const [pack, ids] of Object.entries(local)) {
    for (const id of ids) {
      if (!id.startsWith(prefix)) continue;
      errs.push(`${packPluginName(pack)} provides skill \`${id}\`, which claims core's \`${prefix}*\` `
        + 'namespace — the name promises core shipped it, so another provider makes ownership ambiguous');
    }
  }
  return errs;
}

// Two packs emitting one id. Duplicate-provider behavior differs by host and
// namespace surface, so the partition must decide ownership before installation.
// Pure over the packProviders index.
export function providerCollisionErrors({ providers }) {
  const errs = [];
  for (const [key, owners] of providers) {
    if (owners.length < 2) continue;
    const cut = key.indexOf(':');
    errs.push(`${key.slice(0, cut)} \`${key.slice(cut + 1)}\` is emitted by `
      + `${owners.map(packPluginName).join(' and ')} — duplicate providers make resolution ambiguous`);
  }
  return errs;
}

// The contract version, pinned everywhere it is stated. The demanded version is
// the one thing a fully green build can still get wrong: the probe skill's name
// carries it, the canonical block demands it in prose, and the probe body
// reports it, so all three are held to one constant. Returns `[{ file, msg }]`.
export function contractPinErrors({
  block, probe, skill = CONTRACT_SKILL, version = CONTRACT_VERSION, refusal = REFUSAL,
  blockRel = PREFLIGHT_BLOCK_REL, planRel = 'scripts/lib/pack-plan.mjs',
}) {
  const errs = [];
  const probeRel = `skills/${skill}/SKILL.md`;
  const add = (file, msg) => errs.push({ file, msg });

  if (!skill.endsWith(`-v${version}`)) {
    add(planRel, `CONTRACT_SKILL \`${skill}\` and CONTRACT_VERSION "${version}" disagree — the probe `
      + "skill's name is the version pin, so bumping one without the other ships a block demanding a "
      + 'version no shipped skill name promises');
  }

  if (block === null || block === undefined) {
    add(blockRel, 'missing (canonical fail-closed core-preflight block)');
  } else {
    if (!block.includes(`\`${skill}\``)) {
      add(blockRel, `does not name \`${skill}\`, so the injected block would probe nothing`);
    }
    if (!block.includes(refusal)) {
      add(blockRel, `does not carry the exact refusal token \`${refusal}\` the block promises`);
    }
    const demanded = [...block.matchAll(/`contract:\s*([^`]+)`/g)].map((m) => m[1].trim());
    if (demanded.length !== 1 || demanded[0] !== version) {
      add(blockRel, `must demand exactly one contract version and it must be ${version}; found `
        + `${JSON.stringify(demanded)} — duplicated prose literals can drift into fail-open skew handling`);
    }
    if (!block.includes('Do not load or apply any inherited skill until this preflight passes.')) {
      add(blockRel, 'does not explicitly override the inherited-skill loading order — a pack agent '
        + 'could touch missing core skills before proving core is compatible');
    }
  }

  if (probe === null || probe === undefined) {
    add(probeRel, 'missing — every legacy department agent invokes this skill as its first action');
    return errs;
  }
  const text = normalizeLF(probe);
  if (!/^KAI_CORE_READY$/m.test(text)) {
    add(probeRel, 'does not return the exact `KAI_CORE_READY` marker line the preflight matches on');
  }
  const declared = text.match(/^contract:\s*(\S+)$/m);
  if (!declared) add(probeRel, 'does not return a `contract: <version>` line');
  else if (declared[1] !== version) {
    add(probeRel, `returns \`contract: ${declared[1]}\`, but its name pins it to ${version} — a skew `
      + 'here is invisible to the agents that trust it');
  }
  return errs;
}

// The roles that grant leases resolve which agents a session actually exposes
// before dispatching. Once kai ships as packs the answer stops being "all of
// them", and both failure directions are silent — claim a role is present and
// the director answers in its voice; claim it is missing and it refuses work the
// operator can staff. Membership is the only sound test, so the rules that say
// so are pinned rather than trusted to survive an unrelated edit.
export const DISPATCHING_ROLES = ['director-chief-of-staff'];

export const AVAILABILITY_RULES = [
  { rule: 'read the roster rather than recall it', pattern: /\*\*Read the roster; do not recall it\.\*\*/ },
  { rule: 'test membership', pattern: /\*\*Test membership\.\*\*/ },
  { rule: 'never compute or compare counts', pattern: /\*\*Never compute or compare counts\.\*\*/ },
];

export function availabilityErrors({ body, rules = AVAILABILITY_RULES }) {
  const text = normalizeLF(body ?? '');
  return rules
    .filter((r) => !r.pattern.test(text))
    .map((r) => `grants leases but no longer states "${r.rule}" — role availability is decided by `
      + 'membership in the roster the session exposes, never by a count over it, and a director that '
      + 'guesses either way fails silently');
}

// The guarantee blocks, pinned into what the generator emits. This lives here
// rather than in the validator so the function the CI gate runs is the one the
// self-test mutates: a missing copy, a duplicate, wedged content, an inverted
// order or a core agent carrying either block are otherwise only reachable by
// breaking the real generator. `files` is a materializePacks map; returns
// `[{ file, msg }]` with `file` naming the generated key.
export function guaranteeBlockErrors({
  files, preflight, degraded, inheritsBlock = null, packs = PACK_ORDER,
}) {
  const errs = [];
  if (!preflight || !degraded) return errs;
  const add = (key, msg) => errs.push({ file: `generated ${key}`, msg });

  for (const [key, body] of files) {
    const entry = parseGeneratedKey(key, packs);
    if (!entry) continue;
    if (entry.kind !== 'agent') continue;
    const copies = body.split(preflight).length - 1;
    const refusals = body.split(degraded).length - 1;
    const progressive = body.includes(`**Identity contract:** \`${ROLE_IDENTITY_CONTRACT}\``);
    if (progressive) {
      if (copies !== 0 || refusals !== 0
        || body.includes(GUARANTEE_REGION_OPEN) || body.includes(GUARANTEE_REGION_CLOSE)) {
        add(key, `uses ${ROLE_IDENTITY_CONTRACT} progressive skill routing and must not carry the legacy core dependency guard`);
      }
      continue;
    }
    if (entry.pack === 'core') {
      if (copies !== 0) {
        add(key, 'carries the core-preflight block; a core agent ships inside the pack that provides '
          + 'the probe, so it would only ever fail on itself');
      }
      if (refusals !== 0) {
        add(key, 'carries the degraded-mode refusal; a core agent ships inside kai-core, so the absence '
          + 'it refuses is not a state it can be in');
      }
      if (body.includes(GUARANTEE_REGION_OPEN) || body.includes(GUARANTEE_REGION_CLOSE)) {
        add(key, 'carries managed dependency-guard markers; core agents must carry no guard region');
      }
      continue;
    }
    if (copies !== 1) {
      add(key, `carries the verbatim core-preflight block ${copies} time(s); exactly one copy is required`);
      continue;
    }
    if (refusals !== 1) {
      add(key, `carries the verbatim degraded-mode refusal ${refusals} time(s); exactly one copy is required`);
      continue;
    }
    if (body.split(GUARANTEE_REGION_OPEN).length !== 2
      || body.split(GUARANTEE_REGION_CLOSE).length !== 2) {
      add(key, 'must carry exactly one complete managed dependency-guard region');
      continue;
    }
    const at = body.indexOf(preflight);
    const directiveAt = inheritsBlock ? body.indexOf(inheritsBlock) : -1;
    const directiveEnd = directiveAt === -1 ? -1 : directiveAt + inheritsBlock.length;
    if (at < body.indexOf('**Inherits:**')) {
      add(key, 'places the core-preflight block before the `**Inherits:**` line it must follow');
    } else if (inheritsBlock && at < directiveAt) {
      add(key, 'splits the inherited-contract directive from the `**Inherits:**` line it binds');
    } else if (directiveEnd !== -1
      && !/^\s*$/.test(body.slice(directiveEnd, at).replace(GUARANTEE_REGION_OPEN, ''))) {
      add(key, 'places content between the inherited-contract directive and the core preflight — the '
        + 'preflight must remain the first executable instruction');
    }

    // Order is the contract between the two blocks: the preflight decides
    // whether core is there, and the refusal answers only after it has passed.
    const preflightEnd = at + preflight.length;
    const refusalAt = body.indexOf(degraded);
    if (refusalAt < preflightEnd) {
      add(key, 'places the degraded-mode refusal before the end of the core preflight — the preflight '
        + 'must remain the first executable instruction, and the refusal is what a passed preflight '
        + 'falls to');
    } else if (!/^\s*$/.test(body.slice(preflightEnd, refusalAt))) {
      add(key, 'places content between the core preflight and the degraded-mode refusal — the two '
        + 'guarantee blocks are contiguous, in that order');
    }
  }
  return errs;
}
