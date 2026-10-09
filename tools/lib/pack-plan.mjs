// The single machine-readable source of the pack partition and the per-pack
// manifest contract. The preview/generator (scripts/pack-preview.mjs) and the
// validator (scripts/validate-plugin.mjs) both import from here, so the pack
// partition is defined once and every path agrees on it byte-for-byte.
//
// Read-only and pure: this module reads plugin-local agents/skills and computes
// plans and gate decisions. Writing derived files or managed regions to disk is
// the caller's job, so nothing here mutates the working tree.
//
// Dependency-free (Node built-ins only), consistent with the rest of scripts/.

import { readFileSync, readdirSync, existsSync, statSync } from 'node:fs';
import { builtinModules } from 'node:module';
import { join, dirname, posix, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { packPluginName, PACK_ORDER } from '../../src/core/lib/pack-names.mjs';
import {incubatedIds} from './incubation-contract.mjs';
import { bundlePack } from './bundle.mjs';
import {
  ROLE_FAMILY_PACK, ROLE_POSTURE_PROFILES, KIND_AGENT_PROFILES, ROLE_PROFILE_MODELS,
  KIND_AGENT_FAMILIES, ROLE_POSTURES, MODEL_POLICY_VERSION, AGENT_PROMPT_HARD_LIMIT,
  agentProfileModelErrors as profileModelErrors,
} from '../../src/core/lib/agent-model-policy.mjs';
import {
  parseFrontmatter,
  PUBLICATION_ENTRYPOINT_KEY,
} from '../../src/core/lib/loader-contract.mjs';

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

export const PUBLICATION_SKILLS = Object.freeze({
  core: 'kai-core-workspace-publication',
  engineering: 'engineering-workspace-publication',
  creative: 'creative-workspace-publication',
});

export function publicationSkillForPack(pack) {
  return PUBLICATION_SKILLS[pack] ?? null;
}

const PUBLICATION_CONTRACT_KEYS = Object.freeze([
  'pack',
  'skill',
  'entries',
]);
const PUBLICATION_ENTRY_KEYS = Object.freeze([
  'type',
  'subtype',
  'privateForm',
  'publicForm',
  'formats',
  'authority',
  'privacy',
]);
const PUBLICATION_AUTHORITIES = new Set(['completion', 'operator']);
const PUBLICATION_PRIVACY = new Set(['evidence-private']);
const PUBLICATION_SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const PUBLICATION_CONTROL = /[\u0000-\u001f\u007f]/;
const PUBLICATION_FORMATS = new Set([
  'markdown',
  'markdown-single-file',
  'markdown-destination-record',
  'json',
  'html',
  'diagram',
  'image',
  'media',
  'bundle',
]);

const exactKeys = (value, expected) =>
  Object.keys(value).sort().join('|') === [...expected].sort().join('|');

function validatePublicationPath({entry, field, label, pack}) {
  const value = entry[field];
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error(`${label}.${field} must be a non-empty string`);
  }
  if (PUBLICATION_CONTROL.test(value)) {
    throw new Error(`${label}.${field} must not contain control characters or newlines`);
  }
  if (value.includes('|')) {
    throw new Error(`${label}.${field} must not contain a pipe`);
  }
  if (value.includes('`')) {
    throw new Error(`${label}.${field} must not contain a backtick`);
  }
  if (value.includes('\\')) {
    throw new Error(`${label}.${field} must use forward slashes and must not contain backslash traversal`);
  }
  if (value.split('/').includes('..')) {
    throw new Error(`${label}.${field} must not contain path traversal`);
  }

  if (field === 'privateForm') {
    const root = `.kai/${pack}/`;
    if (!value.startsWith(root)) {
      throw new Error(`${label}.privateForm must be under ${root}`);
    }
    return;
  }

  const coreDirection = pack === 'core'
    && entry.type === 'direction'
    && entry.subtype === null;
  if (coreDirection) {
    if (value !== 'docs/kai/DIRECTION.md') {
      throw new Error(`${label}.publicForm for Core Direction must be exactly docs/kai/DIRECTION.md`);
    }
    return;
  }
  const root = `docs/kai/${pack}/`;
  if (!value.startsWith(root)) {
    throw new Error(`${label}.publicForm must be under ${root}`);
  }
}

export function publicationContract(pack, root = REPO_ROOT) {
  const expectedSkill = publicationSkillForPack(pack);
  if (!expectedSkill) throw new Error(`unknown publication pack ${JSON.stringify(pack)}`);
  const declarationPath = sourcePath(root, pack, 'publication.json');
  if (!existsSync(declarationPath)) {
    throw new Error(`${sourceRel(pack, 'publication.json')} is missing`);
  }

  let parsed;
  try {
    parsed = JSON.parse(readFileSync(declarationPath, 'utf8'));
  } catch (error) {
    throw new Error(`${sourceRel(pack, 'publication.json')} is not valid JSON: ${error.message}`);
  }
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)
    || !exactKeys(parsed, PUBLICATION_CONTRACT_KEYS)) {
    throw new Error(`${sourceRel(pack, 'publication.json')} must contain exactly pack, skill, and entries`);
  }
  if (parsed.pack !== pack) {
    throw new Error(`${sourceRel(pack, 'publication.json')} pack must be ${JSON.stringify(pack)}`);
  }
  if (parsed.skill !== expectedSkill) {
    throw new Error(`${sourceRel(pack, 'publication.json')} skill must be ${JSON.stringify(expectedSkill)}`);
  }
  if (!Array.isArray(parsed.entries) || parsed.entries.length === 0) {
    throw new Error(`${sourceRel(pack, 'publication.json')} entries must be a non-empty array`);
  }

  const seen = new Set();
  for (const [index, entry] of parsed.entries.entries()) {
    const label = `${sourceRel(pack, 'publication.json')} entries[${index}]`;
    if (!entry || typeof entry !== 'object' || Array.isArray(entry)
      || !exactKeys(entry, PUBLICATION_ENTRY_KEYS)) {
      throw new Error(`${label} must contain exactly ${PUBLICATION_ENTRY_KEYS.join(', ')}`);
    }
    if (typeof entry.type !== 'string' || !PUBLICATION_SLUG.test(entry.type)) {
      throw new Error(`${label}.type must be a safe slug using lowercase letters, digits, and hyphens`);
    }
    if (entry.subtype !== null
      && (typeof entry.subtype !== 'string' || !PUBLICATION_SLUG.test(entry.subtype))) {
      throw new Error(`${label}.subtype must be null or a safe slug using lowercase letters, digits, and hyphens`);
    }
    validatePublicationPath({entry, field: 'privateForm', label, pack});
    validatePublicationPath({entry, field: 'publicForm', label, pack});
    if (!Array.isArray(entry.formats) || entry.formats.length === 0
      || entry.formats.some(format =>
        typeof format !== 'string' || !PUBLICATION_FORMATS.has(format))) {
      throw new Error(`${label}.formats must use known non-empty format identifiers`);
    }
    if (!PUBLICATION_AUTHORITIES.has(entry.authority)) {
      throw new Error(`${label}.authority must be completion or operator`);
    }
    if (!PUBLICATION_PRIVACY.has(entry.privacy)) {
      throw new Error(`${label}.privacy must be evidence-private`);
    }
    const key = `${entry.type}/${entry.subtype ?? '-'}`;
    if (seen.has(key)) throw new Error(`${label} duplicates publication entry ${key}`);
    seen.add(key);
  }

  return {
    ...parsed,
    declarationPath,
    skillPath: sourcePath(root, pack, 'skills', parsed.skill, 'SKILL.md'),
  };
}

// The default committed-tree root. release-guard classifies changes under it as
// behavior-sensitive, the validator discovers manifests under it, and the
// generator writes the reviewed committed slice there.
export const PACKS_DIR = 'plugins';

// Where product source lives. A shipped body invokes `scripts/foo.mjs` — the
// path a consumer actually runs — while the file is authored at
// `src/<pack>/foo.mjs`. The shipped path is deliberately unchanged, so
// `hooks.json` and every markdown command string keep working; only the
// authoring location moved.
export const SRC_DIR = 'src';

// The prefix a shipped instruction uses for an executable. It is a shipped
// path, not a source path, which is why it stays `scripts/`.
export const SHIPPED_ASSET_DIR = 'scripts';

// Shipped asset key -> { pack, path }. Built by walking `src/<pack>/`, so the
// pack that owns an asset is declared by where the file lives rather than
// inferred from whoever happens to mention it. That inference is what let a
// developer script reach consumers: one agent's prose named it, and the closure
// shipped it plus everything it imported.
export function sourceAssetIndex(root = REPO_ROOT) {
  const index = new Map();
  const collisions = [];
  for (const pack of PACK_ORDER) {
    const base = join(root, SRC_DIR, pack);
    if (!existsSync(base)) continue;
    const walk = (dir, rel) => {
      for (const entry of readdirSync(dir, { withFileTypes: true })
        .sort((a, b) => a.name.localeCompare(b.name))) {
        const next = rel ? `${rel}/${entry.name}` : entry.name;
        const path = join(dir, entry.name);
        if (entry.isDirectory()) { walk(path, next); continue; }
        const key = `${SHIPPED_ASSET_DIR}/${next}`;
        if (index.has(key)) {
          collisions.push(`${key} is authored in both ${packPluginName(index.get(key).pack)} `
            + `and ${packPluginName(pack)} — one shipped path cannot have two sources`);
          continue;
        }
        index.set(key, { pack, path });
      }
    };
    walk(base, '');
  }
  if (collisions.length) throw new Error(collisions.join('\n'));
  return index;
}

// Where an asset is authored must agree with the pack that ends up shipping it.
//
// `planAssets` derives an owner from whoever invokes a path, which is the
// inference that let a developer script reach consumers. The source location is
// the declaration. When the two disagree, a file authored under
// `src/creative/` would be copied into `plugins/kai-core/scripts/` with nothing
// reporting it — so the disagreement is the error.
//
// An asset invoked from more than one pack is a real case: it promotes to core,
// and must therefore be authored in `src/core/`.
export function sourceAssetPath(root, asset, index = sourceAssetIndex(root)) {
  return index.get(asset)?.path ?? null;
}

export function assetLocationErrors({ assets, index }) {
  const errors = [];
  for (const [asset, entry] of assets) {
    const declared = index.get(asset);
    if (!declared) continue; // absence is reported by assetOwnershipErrors
    if (declared.pack === entry.owner) continue;
    const invokers = [...entry.packs].sort().map(packPluginName).join(' and ');
    errors.push({
      file: asset,
      msg: `is authored in ${packPluginName(declared.pack)} but routes to `
        + `${packPluginName(entry.owner)} (invoked from ${invokers}) — move the source to `
        + `src/${entry.owner}/, or stop invoking it from outside ${packPluginName(declared.pack)}`,
    });
  }
  return errors;
}



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

// Whole packages moved into `incubator/` while development returns to core.
// They are not discovered, not validated as packs and not emitted; their source
// and ids are preserved on disk so re-entry is a move, not a rewrite.
export const INCUBATED_PACKS = Object.freeze([
  'assistant', 'product', 'marketing', 'revenue', 'learning',
]);

export const INCUBATED_AGENT_IDS = Object.freeze(
  [...incubatedIds(REPO_ROOT, 'agent')].sort(),
);

export function packageAgentInventory(root = REPO_ROOT) {
  return Object.freeze(Object.fromEntries(PACK_ORDER.map((pack) => {
    const dir = join(root, PACKS_DIR, packPluginName(pack), 'agents');
    const agents = existsSync(dir)
      ? readdirSync(dir).filter(name => name.endsWith('.agent.md'))
        .map(name => name.replace(/\.agent\.md$/, '')).sort()
      : [];
    return [pack, Object.freeze(agents)];
  })));
}

// Compatibility inventory for callers operating on this checkout. Any caller
// that accepts a root must use packageAgentInventory(root) instead.
export const PACKS = packageAgentInventory();
export const SKILL_OWNER_OVERRIDES = Object.freeze({});

// Retained source and validation cover every active package. Publication is a
// separate decision, but the active partition and the default index are now the
// same three packages: an unfinished package is incubated, not half-shipped.
export const COMMITTED_PACKS = [...PACK_ORDER];
export const PUBLISHED_PACKS = Object.freeze(['core', 'engineering', 'creative']);

// No pack declares a runtime npm dependency, and none may. The host copies
// plugin trees and never runs npm, so a declared dependency could only resolve
// on a machine where someone manually ran `npm ci` into the install directory —
// which every plugin update overwrites. Shipped code therefore imports only Node
// built-ins and its own relative modules; anything else is an external tool the
// instructions name and the operator installs deliberately. `generatedRuntimeErrors`
// and `planAssetClosure` enforce this, so there is no dependency plan to declare.

// Re-exported from the shipped module so there is exactly one definition. That
// module is what consumer code imports; duplicating the name here would let the
// two drift without anything failing.
export { packPluginName, PACK_ORDER };

// A functional, non-marketing manifest description. Published copy is refined at
// the marketplace flip; scaffolding only needs to say what the plugin is. A pack
// whose name does not describe a department states its capability here instead,
// because the published marketplace entry must repeat plugin.json byte-for-byte
// (marketplaceConsistencyErrors) — two texts for one plugin is a drift the index
// cannot hold.
const PACK_DESCRIPTIONS = {
  core: 'kai-core: the shared operating contract and workspace machinery every kai department pack depends on.',
  creative: 'UI/UX, visual identity, design assets, and supported media production over kai-core.',
  engineering: 'Standalone software and platform implementation, technical investigation, independent review, and delivery procedures over kai-core.',
};

function packDescription(pack) {
  return PACK_DESCRIPTIONS[pack] ?? `kai ${pack} department pack — the ${pack} roles, over a required kai-core.`;
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

export function publicationDeclarationInventoryErrors(
  entries,
  root = REPO_ROOT,
  packs = PACK_ORDER,
) {
  const errors = [];
  for (const pack of packs) {
    let contract;
    try {
      contract = publicationContract(pack, root);
    } catch (error) {
      errors.push(error.message);
      continue;
    }
    const matches = entries.filter(entry =>
      entry?.kind === 'skill' && entry.pack === pack && entry.id === contract.skill);
    if (matches.length !== 1) {
      errors.push(`${packPluginName(pack)} declaration names publication skill `
        + `\`${contract.skill}\`, but the active source inventory contains ${matches.length}`);
    }
  }
  return errors;
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
    if (files.length === 0) {
      errors.push({
        file: 'plugins/',
        msg: `active ${kind} source corpus is empty`,
      });
      continue;
    }
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
  agents = sourceAgentFiles(), skills = sourceSkillFiles(), plan, packs,
} = {}) {
  const errors = [];
  const expectedAgentPack = new Map();
  for (const [pack, ids] of Object.entries(packs ?? plan?.packages ?? PACKS)) {
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

// Every skill named on an agent's single `**Inherits:**` line, as written —
// including one that does not exist, which is a reference miss rather than a
// partition input.
export function declaredInherits(body) {
  const line = normalizeLF(body).match(/^\*\*Inherits:\*\*(.*)$/m);
  if (!line) return [];
  return [...line[1].matchAll(/`([^`]+)`/g)].map((m) => m[1]);
}

// The partition input: the skills an agent loads — from its eager `**Inherits:**`
// line and its inline routes both — filtered to those that exist on disk. A
// named-but-absent skill is a reference miss that referenceErrors reports, not a
// partition input; the filter keeps that distinction load-bearing instead of
// collapsing the two concerns. `loadedSkills` (below) is the same union without
// the filter, for the reference corpus that must see the miss.
export function loadedSkillsOnDisk(root, body) {
  return [...loadedSkills(body)].filter((s) => skillFile(root, s) !== null);
}

// The one answer to "which contracts does this agent load". A migrated agent
// routes them inline at the step that needs each one; an agent still on the
// eager line declares them all up front. Both are the same question, so every
// check that asks it reads this rather than picking a side and passing
// vacuously on the other half of the repo. When the last pack migrates, the
// eager arm disappears and this collapses to `routedSkills` alone.
export function loadedSkills(body) {
  return new Set([...declaredInherits(body), ...routedSkills(body)]);
}

// Physical package directories are the ownership declaration for both agents
// and skills. References may validate whether one package can use another
// package's skill, but usage never changes who provides it.
export function planPacks(root = REPO_ROOT) {
  const packages = packageAgentInventory(root);
  const byPack = Object.fromEntries(PACK_ORDER.map(pack => [pack, []]));
  for (const skill of sourceSkillFiles(root)) byPack[skill.pack].push(skill.id);
  for (const skills of Object.values(byPack)) skills.sort();

  const core = [...byPack.core];
  const local = Object.fromEntries(PACK_ORDER.map(pack => [
    pack,
    pack === 'core' ? [] : [...byPack[pack]],
  ]));
  return {
    core,
    local,
    packages,
    // Compatibility diagnostics. Physical placement means every discovered
    // entry already has an owner; no usage-derived orphan/override phase exists.
    orphans: [],
    unplaced: [],
    unassigned: [],
  };
}

// The deterministic plan for a selected portion of the partition: one descriptor
// per pack, in PACK_ORDER, with the reviewed skill ownership already applied.
export function planManifests({
  root = REPO_ROOT, version = '0.0.0-preview', packs = PACK_ORDER,
} = {}) {
  const plan = planPacks(root);
  const selected = [...new Set(packs)];
  const unknown = selected.filter((pack) => !Object.hasOwn(plan.packages, pack));
  if (unknown.length) throw new Error(`unknown pack(s): ${unknown.join(', ')}`);
  return PACK_ORDER.filter((pack) => selected.includes(pack)).map((pack) => {
    const isCore = pack === 'core';
    const name = packPluginName(pack);
    const agents = [...plan.packages[pack]];
    const skills = (isCore ? [...plan.core] : [...plan.local[pack]]).sort();

    // Fixed key order for byte-stable JSON: name, version, description, agents, skills.
    const manifest = { name, version, description: packDescription(pack) };
    if (agents.length) manifest.agents = 'agents';
    if (skills.length) manifest.skills = 'skills';

    return {
      pack,
      name,
      dir: name,
      kind: isCore ? 'core' : 'department',
      agents,
      skills,
      manifest,
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
  const assetIndex = sourceAssetIndex(root);
  // The closure still runs, but for VALIDATION rather than copying: it is what
  // proves a referenced asset exists, resolves, and does not cross a pack
  // boundary. The bundler owns the module graph now, so nothing under `lib/`
  // is emitted as a separate file.
  const closure = planAssetClosure({
    assets,
    exists: (asset) => assetIndex.has(asset),
    read: (asset) => readFileSync(assetIndex.get(asset).path, 'utf8'),
  });
  const located = assetLocationErrors({ assets, index: assetIndex });
  if (closure.errors.length || located.length) {
    throw new Error([...closure.errors, ...located]
      .map((e) => `${e.file}: ${e.msg}`).join('\n'));
  }
  for (const pack of PACK_ORDER) {
    if (!selected.has(pack)) continue;
    const bundled = bundlePack({
      root, srcDir: SRC_DIR, shippedDir: SHIPPED_ASSET_DIR, pack,
    });
    for (const [shipped, text] of bundled.files) {
      files.set(`${packPluginName(pack)}/${shipped}`, normalizeLF(text));
    }
  }
  if (selected.has(HOOKS_OWNER)) {
    files.set(`${packPluginName(HOOKS_OWNER)}/${HOOKS_FILE}`,
      normalizeLF(readFileSync(join(root, HOOKS_FILE), 'utf8')));
  }
  if (selected.has('core')) {
    // Onboarding reads this data file; executable/module routing cannot discover it.
    const block = 'scripts/lib/repository-instructions-block.md';
    files.set(`${packPluginName('core')}/${block}`,
      normalizeLF(readFileSync(assetIndex.get(block).path, 'utf8')));
  }
  return new Map([...files].sort((a, b) => a[0].localeCompare(b[0])));
}

// There is now one agent shape: every agent routes its contracts inline and
// carries no copied dependency guard. Synchronising an agent therefore only ever
// removes a stale managed region — one is never inserted. A malformed half-region
// still fails, so a partially hand-deleted guard cannot slip through. Kept as the
// single entry point the generator and preview call so a leftover region from the
// legacy era is stripped on the next `--write`.
export function syncGuaranteeRegion(body) {
  return removeGuaranteeRegion(body);
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
// DERIVED from publication policy: `packs` serves only the selected default
// packages, and `legacy-rollback` restores the monolith alone — so it forbids
// every name `packPluginName` can emit, including packs published after this
// code was written. A literal here would silently bless a rollback index that
// restored the monolith beside a department pack.
export function marketplaceSurfacePolicy({
  mkt, canonicalVersion, monolithName,
  publishedPackNames = PUBLISHED_PACKS.map(packPluginName),
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
// core, on all three paths a skill can reach a session — loaded,
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
// a named method") are editorial, and reading those as firing paths would make
// most of the corpus a cross-pack dependency it is not.
const DISPATCH_ENTRY = /^\s*[-*]\s+\*\*`([^`]+)`\*\*/;

// An agent body names its skills inside the instruction that needs them,
// so the bullet shape above cannot be the only firing path. An imperative to
// load a skill is still narrower than "any backticked mention": it is a
// directive, not an editorial cross-reference ("the technical counterpart to
// a named method") the rule above deliberately ignores.
const PROSE_DISPATCH = /\b(?:Load|Invoke|Apply|Run)\s+(?:the\s+)?`([a-z0-9][a-z0-9-]*)`/g;

// Role ids carry a family prefix. A dispatch entry shaped like one that
// resolves to nothing is a renamed or deleted role; a token that is not shaped
// like one (`post-only`) is an output mode, not a reference. Current source and
// incubated source provide the exact pre-taxonomy ids that remain recognizable.
// New durable roles use their provider family plus a controlled posture and
// scope.
// Naming-policy families that map to an active install package. `personal`,
// `prod` and `gtm` are retired namespace tokens whose owners were incubated;
// they are not aliases and no active role may claim them.
// The model policy is shipped source: the coordination host validates the same
// rule at runtime. Tooling imports it rather than owning it, so shipped code
// never has to reach into release machinery for a model name.
export {
  ROLE_FAMILY_PACK, ROLE_POSTURES, MODEL_POLICY_VERSION, AGENT_PROMPT_HARD_LIMIT,
  ROLE_POSTURE_PROFILES, KIND_AGENT_PROFILES, ROLE_PROFILE_MODELS,
} from '../../src/core/lib/agent-model-policy.mjs';
const RETIRED_AGENT_FAMILIES = [
  'principal', 'director',
];

export const AGENT_FAMILIES = [
  ...RETIRED_AGENT_FAMILIES, ...KIND_AGENT_FAMILIES, ...Object.keys(ROLE_FAMILY_PACK),
];

const ACTIVE_AGENT_IDS = new Set(Object.values(PACKS).flat());
const INACTIVE_AGENT_IDS = new Set(INCUBATED_AGENT_IDS);
const DECLARED_AGENT_IDS = new Set([...ACTIVE_AGENT_IDS, ...INACTIVE_AGENT_IDS]);
const RETIRED_OR_KIND_ALT = [...RETIRED_AGENT_FAMILIES, ...KIND_AGENT_FAMILIES].join('|');
const AGENT_FAMILY_ALT = AGENT_FAMILIES.join('|');
const ROLE_FAMILY_ALT = Object.keys(ROLE_FAMILY_PACK).join('|');
const ROLE_POSTURE_ALT = ROLE_POSTURES.join('|');
const DECLARED_AGENT_ID_ALT = [...DECLARED_AGENT_IDS].sort().join('|');
const AGENT_ID_SOURCE = `(?:${DECLARED_AGENT_ID_ALT}|(?:${RETIRED_OR_KIND_ALT})-[a-z0-9-]+`
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
  [...DECLARED_AGENT_IDS]
    .filter((id) => RETIRED_AGENT_FAMILIES.includes(id.split('-')[0])),
);

// The new grammar coexists with exact baseline ids while roles are migrated one
// or two at a time. New ids in a provider-family namespace have their posture
// and placement enforced immediately.
export function agentTaxonomyErrors({ id, pack }) {
  const [family, posture, ...scope] = (id ?? '').split('-');
  if (RETIRED_AGENT_FAMILIES.includes(family)) {
    return RETIRED_AGENT_IDS.has(id)
      ? []
      : [`agent family \`${family}-*\` is migration-only; new agents must use a provider-family posture or a supported kind prefix`];
  }
  if (INACTIVE_AGENT_IDS.has(id)) return [];
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
  ['principal-engineer-career-mentor', 'open-ended mentoring conversation, not a bounded run'],
  ['principal-ai-researcher', 'no shell by design; cannot append without gaining `execute`'],
  ['principal-ai-applied-engineer', 'no shell by design; cannot append without gaining `execute`'],
]);

// `kai-core-work-acting` is the acting half of coordination: verify-lease-
// before-write, collisions, handoffs, and review routing for a Task the role
// already holds. A role that never holds a coordinated Task —
// it only reads team state and writes its own private lane — has nothing to
// act on, so requiring the contract is miscalibrated. No shipped role claims
// that exemption today; the map stays as the declared seam for the next one.
export const ACTING_EXEMPT = new Map([
]);

export function agentRoutingErrors({
  id, pack = null, body, tools = [], knownSkills = [], knownAgents = [],
  activityExempt = false, actingExempt = false,
}) {
  const text = normalizeLF(body ?? '');
  const errors = [];
  // An agent still on the eager regime declares this line; an agent on inline
  // routes must not. That one self-describing fact — no pack list, no registry
  // — is what tells the two regimes apart wherever they need telling apart.
  const declaresEagerInherits = /^\*\*Inherits:\*\*/m.test(text);
  if (declaresEagerInherits) {
    errors.push('an agent routes skills just in time and must not declare an eager `**Inherits:**` line');
  }

  // A skill is routed wherever the instruction that needs it lives. Hoisting
  // every route into one section reproduces the `**Inherits:**` manifest this
  // contract removed. Validation therefore checks route identity, order, and
  // tool access without compiling the surrounding explanation.
  const available = knownSkills instanceof Set ? knownSkills : new Set(knownSkills);
  const knownAgentSet = knownAgents instanceof Set ? knownAgents : new Set(knownAgents);
  const occurrences = routedSkillOccurrences(text);
  const routed = new Set(occurrences.map(route => route.id));
  for (const skill of routed) {
    if (available.has(skill)) continue;
    // A route verb before an agent id ("invoke `principal-x`") is a lowercase
    // orchestrated dispatch, not a loaded contract: `ROUTE_SENTENCE` is
    // case-insensitive where `PROSE_DISPATCH` is not, so the same sentence is
    // seen as a route here. Skip agent-shaped tokens exactly as
    // `collectReferences` does, so a genuine skill typo still surfaces while a
    // dispatch sentence is not misread as an unknown skill route.
    if (knownAgentSet.has(skill) || AGENT_CANDIDATE.test(skill)) continue;
    errors.push(`routes unknown skill \`${skill}\``);
  }
  const firstCoreRoute = occurrences.find(route => route.id.startsWith(CORE_SKILL_PREFIX));
  if (firstCoreRoute && firstCoreRoute.id !== CONTRACT_SKILL) {
    errors.push(`must route \`${CONTRACT_SKILL}\` before every other core skill`);
  }

  const required = [CONTRACT_SKILL, 'kai-core-operating-rules'];
  if (requiresCoordinatedRunContracts(id)) {
    required.push('kai-core-workspace-paths');
    if (!actingExempt) required.push('kai-core-work-acting');
    if (!activityExempt) required.push('kai-core-work-activity');
  }
  // kai-core-asset-producing is deliberately not required — an agent that
  // produces no durable artifact should not route it. The per-role table in the
  // rewritten agents governs where it is routed.
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
  if (actingExempt && routed.has('kai-core-work-acting')) {
    errors.push('is acting-exempt but routes `kai-core-work-acting`; remove the exemption or the route');
  }
  if (pack !== null) {
    errors.push(...publicationRoutingErrors({pack, id, kind: 'agent', body: text}));
  }
  return errors;
}

// The only reader of `**Primary profile:** <profile>` and its mapping through
// ROLE_PROFILE_MODELS / ROLE_POSTURE_PROFILES / KIND_AGENT_PROFILES to an
// approved frontmatter model. This is the live half of what used to be
// agentIdentityContractErrors — the identity-marker half went with the marker,
// but the profile/model binding has no other home, so it is preserved here,
// keyed on the agent's family/posture rather than on any opt-in marker.
export function agentProfileModelErrors({ id, body, fm = {} }) {
  return profileModelErrors({ id, body, fm });
}

export function agentPromptLimitErrors(body) {
  const length = [...normalizeLF(body ?? '')].length;
  return length > AGENT_PROMPT_HARD_LIMIT
    ? [`agent prompt is ${length} characters, over the ${AGENT_PROMPT_HARD_LIMIT}-character host limit`]
    : [];
}

// A non-markdown asset a shipped instruction invokes. Only top-level scripts/
// executables qualify: scripts/lib/ is build-internal, and no shipped body tells
// anyone to run it.
const ASSET_REF = /(?<![A-Za-z0-9_-])scripts\/[A-Za-z0-9_-]+\.(?:mjs|js|cjs|ps1|sh|py)/g;

// A mention becomes a route only when an imperative verb points at it. Without
// this, "do not invoke `x`" counts as loading x, and a route that never fires is
// invisible: the agent silently never loads the contract and does lower-quality
// work with nothing failing. The negation guard is the whole point.
const ROUTE_SENTENCE = /\b(?:Load|Invoke|Apply|Run)\s+(?:the\s+)?`([a-z0-9][a-z0-9-]*)`/gi;
const ROUTE_NEGATION = /\b(?:not|never|without|avoid)\b/i;
// Structural markdown lines form clause boundaries independent of punctuation.
const STRUCT_LINE = /^(?:#|\s*[-*+|]|\s*\d+\.)/;

// Collapse prose to a flat string while inserting a clause terminator at each
// structural markdown boundary (heading, list item, table row, blank line).
// This prevents a negation in a heading or bullet from scoping into the next
// line; soft wraps inside a running paragraph are still collapsed to a space.
function flattenProse(text) {
  const lines = text.split('\n');
  const parts = [];
  for (let i = 0; i < lines.length; i++) {
    if (i > 0) {
      const prev = lines[i - 1];
      const cur = lines[i];
      if (prev.trim() === '' || cur.trim() === '' || STRUCT_LINE.test(prev) || STRUCT_LINE.test(cur)) {
        parts.push('.');
      }
    }
    parts.push(lines[i]);
  }
  return parts.join(' ').replace(/\s+/g, ' ');
}

function routedSkillOccurrences(body) {
  // Strip fenced code blocks (properly closed or unterminated, indented or not)
  // so that documented examples are not parsed as routes.
  const stripped = normalizeLF(body ?? '')
    .replace(/^\s*```[\s\S]*?^\s*```/gm, '')  // closed fences (possibly indented)
    .replace(/^\s*```[\s\S]*/m, '');            // unterminated fence → strip to end
  // Flatten to a single line, inserting clause terminators at structural
  // boundaries so negations cannot cross into the next structural element.
  const flat = flattenProse(stripped);
  const out = [];
  for (const m of flat.matchAll(ROUTE_SENTENCE)) {
    // Scope the negation test to the clause containing the match: look back
    // only to the nearest preceding sentence terminator (.;:!?) so a negation
    // in an earlier clause does not suppress a valid route in a later one.
    const prefix = flat.slice(0, m.index);
    const clauseStart = Math.max(
      prefix.lastIndexOf('.'),
      prefix.lastIndexOf(';'),
      prefix.lastIndexOf(':'),
      prefix.lastIndexOf('!'),
      prefix.lastIndexOf('?'),
    );
    const clause = flat.slice(clauseStart + 1, m.index);
    if (ROUTE_NEGATION.test(clause)) continue;
    out.push({id: m[1], index: m.index, end: m.index + m[0].length});
  }
  return out;
}

export function routedSkills(body) {
  const out = [];
  for (const route of routedSkillOccurrences(body)) {
    if (!out.includes(route.id)) out.push(route.id);
  }
  return out;
}

export function publicationEntrypointDeclaration({body, fm}) {
  if (fm && Object.hasOwn(fm, PUBLICATION_ENTRYPOINT_KEY)) {
    return fm[PUBLICATION_ENTRYPOINT_KEY]?.trim() || null;
  }
  const parsed = parseFrontmatter(body ?? '');
  if (parsed.ok) return parsed.fm[PUBLICATION_ENTRYPOINT_KEY]?.trim() || null;
  const fallback = normalizeLF(body ?? '')
    .match(/^publication-entrypoint:\s*(\S+)\s*$/m);
  return fallback?.[1] ?? null;
}

export function publicationRoutingErrors({pack, id = '(unknown)', kind = 'skill', body, fm}) {
  const errors = [];
  const owner = publicationSkillForPack(pack);
  if (!owner) {
    return [`${id}: cannot derive an owning publication skill from source pack ${pack ?? '(missing)'}`];
  }

  const publicationBody = normalizeLF(body ?? '').replace(
    /\bUse(\s+(?:the\s+)?`[a-z0-9][a-z0-9-]*`)/gi,
    'Load$1',
  );
  const occurrences = routedSkillOccurrences(publicationBody);
  const publicationIds = new Set(Object.values(PUBLICATION_SKILLS));
  const publicationRoutes = occurrences.filter(route => publicationIds.has(route.id));
  const productionRoutes = occurrences.filter(route => route.id === 'kai-core-asset-producing');
  const foreign = publicationRoutes.filter(route => route.id !== owner);
  for (const route of foreign) {
    errors.push(`cannot route publication skill owned by another pack: \`${route.id}\`; `
      + `${packPluginName(pack)} owns \`${owner}\``);
  }

  const entrypoint = publicationEntrypointDeclaration({body, fm});
  if (!entrypoint) {
    if (productionRoutes.length > 0) {
      errors.push('direct `kai-core-asset-producing` route requires a declared publication entrypoint');
    }
    if (publicationRoutes.some(route => route.id === owner)) {
      errors.push(`route to publication entrypoint \`${owner}\` requires frontmatter `
        + `\`${PUBLICATION_ENTRYPOINT_KEY}: ${owner}\``);
    }
    return [...new Set(errors)];
  }

  if (entrypoint !== owner) {
    errors.push(`frontmatter publication entrypoint \`${entrypoint}\` belongs to another pack; `
      + `${packPluginName(pack)} must declare \`${owner}\``);
    return [...new Set(errors)];
  }
  if (!publicationRoutes.some(route => route.id === owner)) {
    errors.push(`declared publication entrypoint \`${owner}\` must be routed by this ${kind}`);
  }
  for (const productionRoute of productionRoutes) {
    if (!publicationRoutes.some(route =>
      route.id === owner && route.index < productionRoute.index)) {
      errors.push(`each \`kai-core-asset-producing\` route must have an earlier `
        + `\`${owner}\` route`);
    }
  }
  return [...new Set(errors)];
}

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

// agent id -> owning pack, straight from the selected root's physical package
// directories.
function agentOwners(packages = PACKS) {
  const owners = new Map();
  for (const [pack, ids] of Object.entries(packages)) for (const id of ids) owners.set(id, pack);
  return owners;
}

// One reading of a generated-tree key, for every check that consumes generator
// output. The pack directory set is derived from the partition itself rather
// than matched with a pattern: `/^kai-[a-z]+\//` agrees with the current
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
//   loaded       — a contract an agent loads, from its eager `**Inherits:**`
//                  line or an inline route both, and the assets of a skill that
//                  reaches a session that way;
//   user-invoked — a `user-invocable: true` skill's own entry point and assets,
//                  which fire with no agent to carry a dependency for them;
//   orchestrated — an agent's dispatch entries, and the assets in its own body,
//                  which fire when something dispatches the agent.
export function collectReferences(root = REPO_ROOT) {
  const plan = planPacks(root);
  const skillOf = skillOwners(plan);
  const agentOf = agentOwners(plan.packages);

  const refs = [];
  const add = (from, fromPack, firing, kind, target) => {
    const seen = refs.find((r) => r.from === from && r.kind === kind && r.target === target);
    if (seen) { if (!seen.firing.includes(firing)) seen.firing.push(firing); return; }
    refs.push({ from, fromPack, firing: [firing], kind, target });
  };

  const dispatched = new Set();
  const loaded = new Set();
  for (const id of listAgentIds(root).sort()) {
    const body = readAgentBody(root, id);
    const fromPath = agentSourceFile(root, id);
    const from = fromPath
      ? fromPath.slice(root.length + 1).replace(/\\/g, '/')
      : `agent:${id}`;
    const pack = agentOf.get(id) ?? null;
    for (const skill of loadedSkills(body)) {
      // A route verb before an agent id (an inline "dispatch `principal-x`") is an
      // orchestrated referral, collected below, not a loaded contract. Skip it
      // here unless it names a real skill, so a genuine skill-route typo still
      // surfaces as a dangling reference rather than being silently dropped.
      if (!skillOf.has(skill) && (agentOf.has(skill) || AGENT_CANDIDATE.test(skill))) continue;
      loaded.add(skill);
      add(from, pack, 'loaded', 'skill', skill);
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
    if (loaded.has(id)) firings.push('loaded');
    if (/^user-invocable:\s*true\s*$/m.test(raw)) firings.push('user-invoked');
    if (dispatched.has(id)) firings.push('orchestrated');
    // The direct entry point: `/skills run <id>` resolves across every installed
    // plugin, so the pack that ships it must be the one that provides it.
    if (firings.includes('user-invoked')) add(from, pack, 'user-invoked', 'skill', id);
    // A skill body routes other skills the same way an agent body does, and
    // until 16.0.1 nothing collected those edges: the loop below recorded only
    // how *this* skill fires and which assets it names. A core skill could
    // therefore instruct `Apply <department-skill>` and every gate stayed green,
    // because `referenceErrors` can only judge references it was given. One had
    // shipped that way.
    //
    // The route is recorded as `loaded` because that is what it does — the
    // routed skill is loaded into the same session. It is deliberately not
    // treated as a firing path for the target: reachability through a skill is
    // only as real as the routing skill's own reachability, and the firing-path
    // check in validate-plugin.mjs answers that separate question from agents.
    for (const text of [raw, ...companionBodies]) {
      // `routedSkills`, not `loadedSkills`: the latter also unions
      // `declaredInherits`, which reads an agent's `**Inherits:**` line. That
      // construct has no meaning in a skill, and it carries neither fence
      // stripping nor an id charset — so a fenced authoring example in a skill
      // body would become a live reference.
      for (const target of routedSkills(text)) {
        if (target === id) continue;
        // Same agent-versus-skill disambiguation the agent loop applies, and
        // the same recovery: a route verb naming a role is a referral, not a
        // loaded contract, so it is recorded as one rather than dropped. The
        // agent loop gets that recovery from its second `dispatchedRefs` pass;
        // without it here, a mistyped agent-shaped id in a skill body would be
        // referenced by nothing and fail no gate.
        if (!skillOf.has(target) && (agentOf.has(target) || AGENT_CANDIDATE.test(target))) {
          add(from, pack, 'orchestrated', 'agent', target);
          continue;
        }
        add(from, pack, 'loaded', 'skill', target);
      }
    }
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
        msg: `${label} comes from a file no pack owns — place it under exactly one `
          + '`plugins/<pack>/agents` or `plugins/<pack>/skills` directory before its references '
          + 'can resolve to anything',
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

// Top-level assets are routed by their invoking bodies. Their relative module
// dependencies must travel with them or the copied entry point cannot load.
export function planAssetClosure({ assets, read, exists }) {
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
          errors.push({
            file: current,
            msg: `imports bare module \`${specifier}\`, which nothing installs — the host copies `
              + 'plugin trees and never runs npm, so shipped code may import only Node built-ins '
              + 'and its own relative modules',
          });
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


// Validate the emitted runtime surface itself. Every copied JavaScript entry
// point must resolve local modules and declare each bare runtime dependency in
// the same pack's manifest and lockfile.
// Validate the emitted runtime surface itself. Every copied JavaScript entry
// point must resolve its local modules inside its own pack, and must import
// nothing but Node built-ins from outside it.
//
// No pack may declare a runtime npm dependency, because the host copies plugin
// trees and never installs anything — so a bare import could only resolve on a
// machine where someone manually ran `npm ci` into the install directory, which
// the next plugin update overwrites. A bare import in emitted code is therefore
// a shipped break, not a missing declaration.
export function generatedRuntimeErrors(files, packs = PACK_ORDER) {
  const errs = [];

  for (const [key, text] of files) {
    const entry = parseGeneratedKey(key, packs);
    if (!entry) continue;
    if (entry.kind !== 'other' || !JAVASCRIPT_ASSET.test(entry.id)) continue;
    for (const specifier of moduleSpecifiers(text)) {
      if (NODE_MODULES.has(specifier)) continue;
      if (!specifier.startsWith('.')) {
        errs.push({
          file: `generated ${key}`,
          msg: `imports bare module \`${specifier}\`, which nothing installs: the host copies `
            + 'plugin trees and never runs npm, so shipped code may import only Node built-ins '
            + 'and its own relative modules',
        });
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

// Every agent and skill has exactly one physical package provider.
// Returns plain message strings.
export function partitionErrors({
  plan, agents = [], skills = [], packs = plan?.packages ?? PACKS,
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
// carries it and the probe body reports it, so both are held to one constant.
// The copied preflight block that once demanded it in prose is gone — agents now
// route the probe skill inline — so only the name pin and the probe body remain.
// Returns `[{ file, msg }]`.
export function contractPinErrors({
  probe, skill = CONTRACT_SKILL, version = CONTRACT_VERSION, planRel = 'scripts/lib/pack-plan.mjs',
}) {
  const errs = [];
  const probeRel = `skills/${skill}/SKILL.md`;
  const add = (file, msg) => errs.push({ file, msg });

  if (!skill.endsWith(`-v${version}`)) {
    add(planRel, `CONTRACT_SKILL \`${skill}\` and CONTRACT_VERSION "${version}" disagree — the probe `
      + "skill's name is the version pin, so bumping one without the other ships a probe demanding a "
      + 'version no shipped skill name promises');
  }

  if (probe === null || probe === undefined) {
    add(probeRel, 'missing — every pack agent invokes this skill as its first action');
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
