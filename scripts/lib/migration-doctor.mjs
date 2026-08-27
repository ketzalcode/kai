// The pack-migration doctor's evidence layer: which kai plugins a host actually
// has installed, where each one came from, and what a pack install would collide
// with (#29).
//
// Read-only and pure in effect: it opens files and returns findings. It never
// uninstalls, deletes, or rewrites anything — not a plugin tree, not the host
// config, not `.kai/manifest.json`. Every repair it names is a step for the
// operator to run.
//
// Observed host layout (Copilot CLI on Windows, captured 2026-08-25):
//
//   $COPILOT_HOME/config.json
//     { "installedPlugins": [ { name, marketplace, version, cache_path,
//                               enabled, source, source_sha } ] }
//     `marketplace: ""` is how a direct (repo/URL/path) install records itself.
//     The file carries `//` comments, so it is JSONC and plain JSON.parse fails
//     on every real host.
//
//   $COPILOT_HOME/settings.json
//     { "enabledPlugins": { "kai-core@kai-plugins": true } }
//     This is the user-owned state changed by the interactive `/plugin`
//     dashboard. Absence from the map means no user override, so config remains
//     authoritative; an explicit override must agree or the state is unknown.
//
//   $COPILOT_HOME/installed-plugins/_direct/<owner>--<repo>/    a direct install
//
// Only the `_direct/` bucket has been observed. Any other directory under
// `installed-plugins/` is read as a marketplace bucket and labelled *inferred* —
// never asserted — because a marketplace install has not been seen on disk here.
//
// Dependency-free (Node built-ins only), consistent with the rest of scripts/.

import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from 'node:fs';
import { dirname, isAbsolute, join, relative } from 'node:path';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { PACK_ORDER, packPluginName } from './pack-plan.mjs';

const HERE = dirname(fileURLToPath(import.meta.url));

// The monolith kai ships as today, and the pack names the partition would
// publish. Pack names are derived from the partition rather than restated, so a
// pack added there is detected here without a second list to keep in step.
export const LEGACY_PLUGIN = 'kai';
export const CORE_PLUGIN = packPluginName('core');
export const PACK_PLUGINS = PACK_ORDER.map(packPluginName);
export const DEPARTMENT_PLUGINS = PACK_PLUGINS.filter((n) => n !== CORE_PLUGIN);
export const KAI_PLUGINS = new Set([LEGACY_PLUGIN, ...PACK_PLUGINS]);
export const MARKETPLACE = 'kai-plugins';

// What `.kai/manifest.json` may record as the plugin that scaffolded it: the
// monolith today, `kai-core` once packs are the install surface. A closed set —
// a third value is unrecognized metadata, not a new mode.
export const WORKSPACE_PROVENANCE = new Set([LEGACY_PLUGIN, CORE_PLUGIN]);

const CONFIG_FILE = 'config.json';
const SETTINGS_FILE = 'settings.json';
const INSTALLED_DIR = 'installed-plugins';
const DIRECT_BUCKET = '_direct';
const PLUGIN_MANIFEST = 'plugin.json';

export const defaultHome = () => process.env.COPILOT_HOME || join(homedir(), '.copilot');
export const defaultMarketplaceIndex = () => join(HERE, '..', '..', '.github', 'plugin', 'marketplace.json');

// --- parsing ---------------------------------------------------------------

// The host's own config.json is commented, so JSON.parse is not enough. Comments
// are stripped outside string literals only, or a URL inside a value ("https://…")
// would be eaten along with them.
export function parseJsonc(text) {
  let out = '';
  let inString = false; let escaped = false; let inLine = false; let inBlock = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i]; const next = text[i + 1];
    if (inLine) { if (c === '\n') { inLine = false; out += c; } continue; }
    if (inBlock) { if (c === '*' && next === '/') { inBlock = false; i++; } continue; }
    if (inString) {
      out += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') { inString = true; out += c; continue; }
    if (c === '/' && next === '/') { inLine = true; i++; continue; }
    if (c === '/' && next === '*') { inBlock = true; i++; continue; }
    out += c;
  }
  try { return { ok: true, value: JSON.parse(out) }; }
  catch { return { ok: false, error: 'invalid JSONC syntax' }; }
}

// --- path normalization ----------------------------------------------------

// A recorded `cache_path` comes from whichever machine performed the install:
// `C:\Users\me\.copilot\...` on Windows, `/Users/me/.copilot/...` on macOS, with
// mixed separators, duplicated slashes and trailing slashes all seen in the wild.
export const normalizeHostPath = (p) => String(p)
  .replace(/\\/g, '/')
  .replace(/\/{2,}/g, '/')
  .replace(/\/+$/, '');

// The portion of a recorded cache path *below* `installed-plugins/`, which is the
// only part that transfers between machines. An absolute path from another host
// is not comparable; this tail is. `null` means the path does not describe an
// install tree at all — unverifiable, not absent.
export function installTreeTail(cachePath) {
  if (typeof cachePath !== 'string' || !cachePath.trim()) return null;
  const segments = normalizeHostPath(cachePath).split('/').filter(Boolean);
  const at = segments.map((s) => s.toLowerCase()).lastIndexOf(INSTALLED_DIR);
  if (at === -1) return null;
  const tail = segments.slice(at + 1);
  return tail.length ? tail.join('/') : null;
}

// Resolve one path segment against a directory, preferring an exact match and
// falling back to a case-insensitive one. Windows records `Installed-Plugins`
// and `installed-plugins` interchangeably; a case-sensitive filesystem would
// otherwise report a present tree as missing.
function directoryEntries(dir) {
  try {
    return { ok: true, entries: readdirSync(dir, { withFileTypes: true }) };
  } catch (error) {
    return { ok: false, entries: [], error: error?.code ?? 'unreadable' };
  }
}

function directoryState(dir) {
  try {
    return { ok: true, isDirectory: statSync(dir).isDirectory() };
  } catch (error) {
    return { ok: false, isDirectory: false, error: error?.code ?? 'unreadable' };
  }
}

function childDir(base, name) {
  const listing = directoryEntries(base);
  if (!listing.ok) return null;
  const dirs = listing.entries.filter((entry) => directoryState(join(base, entry.name)).isDirectory);
  const hit = dirs.find((entry) => entry.name === name)
    || dirs.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  return hit ? join(base, hit.name) : null;
}

function inspectChildDir(base, name) {
  let entries;
  try {
    entries = readdirSync(base, { withFileTypes: true });
  } catch (error) {
    return { dir: join(base, name), present: false, readable: false, error: error?.code ?? 'unreadable' };
  }
  const hit = entries.find((entry) => entry.name === name)
    || entries.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  if (!hit) return { dir: join(base, name), present: false, readable: true, error: 'missing' };
  const dir = join(base, hit.name);
  const state = directoryState(dir);
  if (!state.ok) return { dir, present: true, readable: false, error: state.error };
  if (!state.isDirectory) return { dir, present: true, readable: false, error: 'not-a-directory' };
  const listing = directoryEntries(dir);
  return { dir, present: true, readable: listing.ok, error: listing.error ?? null };
}

function resolveUnder(base, tail) {
  let dir = base;
  for (const segment of tail.split('/')) {
    dir = childDir(dir, segment);
    if (!dir) return null;
  }
  return dir;
}

const dirNamesIn = (dir, errors) => {
  const listing = directoryEntries(dir);
  if (!listing.ok) {
    errors.push(`${dir} (${listing.error})`);
    return [];
  }
  const names = [];
  for (const entry of listing.entries) {
    const path = join(dir, entry.name);
    const state = directoryState(path);
    if (!state.ok) {
      errors.push(`${path} (${state.error})`);
    } else if (state.isDirectory) {
      names.push(entry.name);
    }
  }
  return names.sort();
};

// --- host inventory --------------------------------------------------------

// `marketplace: ""` is the observed direct marker; an absent key is inferred from
// the cache path and labelled as such, because guessing and knowing must not read
// the same in the report.
function entryProvenance(entry) {
  const raw = entry.marketplace;
  if (typeof raw === 'string' && raw.trim()) return { provenance: `marketplace:${raw.trim()}`, basis: 'recorded' };
  if (raw === '') return { provenance: 'direct', basis: 'recorded' };
  if (raw !== undefined) return { provenance: 'unknown', basis: 'unreadable' };

  const tail = installTreeTail(entry.cache_path);
  if (tail) {
    const bucket = tail.split('/')[0];
    return bucket.toLowerCase() === DIRECT_BUCKET
      ? { provenance: 'direct', basis: 'inferred' }
      : { provenance: `marketplace:${bucket}`, basis: 'inferred' };
  }
  if (entry.source && typeof entry.source === 'object') return { provenance: 'direct', basis: 'inferred' };
  return { provenance: 'unknown', basis: 'unknown' };
}

export function readHostConfig(home) {
  const path = join(home, CONFIG_FILE);
  if (!existsSync(path)) return { path, present: false, ok: false, entries: [] };

  let text;
  try { text = readFileSync(path, 'utf8'); }
  catch (error) {
    return { path, present: true, ok: false, error: `could not be read (${error?.code ?? 'unreadable'})`, entries: [] };
  }

  const parsed = parseJsonc(text);
  if (!parsed.ok) return { path, present: true, ok: false, error: parsed.error, entries: [] };

  const raw = parsed.value?.installedPlugins;
  if (raw === undefined) return { path, present: true, ok: true, listed: false, entries: [] };
  if (!Array.isArray(raw)) {
    return { path, present: true, ok: false, error: '"installedPlugins" is not an array', entries: [] };
  }

  const entries = raw.map((value, index) => {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return { index, name: null, malformed: 'entry is not an object', provenance: 'unknown', basis: 'unknown' };
    }
    const name = typeof value.name === 'string' && value.name.trim() ? value.name.trim() : null;
    const { provenance, basis } = entryProvenance(value);
    return {
      index,
      name,
      malformed: name ? null : 'entry has no "name"',
      provenance,
      basis,
      version: typeof value.version === 'string' ? value.version : null,
      cachePath: typeof value.cache_path === 'string' ? value.cache_path : null,
      cacheTail: installTreeTail(value.cache_path),
      enabled: typeof value.enabled === 'boolean' ? value.enabled : null,
    };
  });
  return { path, present: true, ok: true, listed: true, entries };
}

export function readHostSettings(home) {
  const path = join(home, SETTINGS_FILE);
  if (!existsSync(path)) return { path, present: false, ok: false, listed: false, values: new Map() };

  let text;
  try { text = readFileSync(path, 'utf8'); }
  catch (error) {
    return {
      path, present: true, ok: false, listed: false,
      error: `could not be read (${error?.code ?? 'unreadable'})`,
      values: new Map(),
    };
  }

  const parsed = parseJsonc(text);
  if (!parsed.ok) {
    return { path, present: true, ok: false, listed: false, error: parsed.error, values: new Map() };
  }
  const raw = parsed.value?.enabledPlugins;
  if (raw === undefined) return { path, present: true, ok: true, listed: false, values: new Map() };
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      path, present: true, ok: false, listed: false,
      error: '"enabledPlugins" is not an object',
      values: new Map(),
    };
  }

  const values = new Map();
  const malformed = [];
  for (const [id, enabled] of Object.entries(raw)) {
    if (typeof enabled === 'boolean') values.set(id, enabled);
    else malformed.push(id);
  }
  if (malformed.length) {
    return {
      path, present: true, ok: false, listed: true,
      error: `non-boolean enabled state for ${malformed.map((id) => `"${id}"`).join(', ')}`,
      values,
    };
  }
  return { path, present: true, ok: true, listed: true, values };
}

function reconcileEnabledState(config, settings) {
  if (!settings.present) return config;
  if (!settings.ok) {
    return {
      ...config,
      entries: config.entries.map((entry) => (
        entry.name ? { ...entry, enabled: null, configEnabled: entry.enabled, settingEnabled: null } : entry
      )),
    };
  }
  if (!settings.listed) return config;
  return {
    ...config,
    entries: config.entries.map((entry) => {
      if (!entry.name) return entry;
      const marketplace = entry.provenance.startsWith('marketplace:')
        ? entry.provenance.slice('marketplace:'.length)
        : null;
      const id = marketplace ? `${entry.name}@${marketplace}` : entry.name;
      const settingEnabled = settings.values.get(id);
      if (typeof settingEnabled !== 'boolean') return entry;
      const enabled = typeof entry.enabled === 'boolean' && settingEnabled === entry.enabled
        ? settingEnabled
        : null;
      return { ...entry, enabled, configEnabled: entry.enabled, settingEnabled: settingEnabled ?? null };
    }),
  };
}

// A directory basename identifies a plugin only by convention (`<owner>--<repo>`),
// so it is a fallback for a tree whose own plugin.json cannot be read — and one
// that keeps the tree flagged as unidentified rather than silently named.
const inferNameFromDir = (name) => (name.includes('--') ? name.slice(name.lastIndexOf('--') + 2) : name);

function readTree(dir, tail, provenance, basis) {
  const manifest = join(dir, PLUGIN_MANIFEST);
  const tree = {
    dir, tail, provenance, basis, declaredName: null, malformed: null,
    inferredName: inferNameFromDir(tail.split('/').pop()),
  };
  if (!existsSync(manifest)) { tree.malformed = `no ${PLUGIN_MANIFEST}`; return tree; }
  try {
    const value = JSON.parse(readFileSync(manifest, 'utf8'));
    if (typeof value?.name === 'string' && value.name.trim()) tree.declaredName = value.name.trim();
    else tree.malformed = `${PLUGIN_MANIFEST} declares no "name"`;
  } catch {
    tree.malformed = `${PLUGIN_MANIFEST} could not be read as valid JSON`;
  }
  return tree;
}

const looksKaiName = (name) => KAI_PLUGINS.has(name)
  || /(^|[-_])kai([-_]|$)/i.test(name);

// A tree is kai's when it names a kai plugin, or when it cannot be identified at
// all yet sits in a kai-shaped directory — the second case is exactly the
// leftover a half-finished uninstall produces.
export const looksKai = (tree) => KAI_PLUGINS.has(tree.declaredName)
  || KAI_PLUGINS.has(tree.inferredName)
  || looksKaiName(tree.inferredName);

// Every install tree under the home, kai's or not: a config entry named `kai`
// pointing at a tree that declares something else is a finding, and filtering
// here would hide it as a merely missing tree.
export function scanInstallTrees(home) {
  const root = inspectChildDir(home, INSTALLED_DIR);
  if (!root.present || !root.readable) {
    return {
      dir: root.dir,
      present: root.present,
      readable: false,
      error: root.error,
      errors: [],
      trees: [],
    };
  }

  const base = root.dir;
  let baseReal;
  try {
    baseReal = realpathSync(base);
  } catch (error) {
    return {
      dir: base,
      present: true,
      readable: false,
      error: error?.code ?? 'unreadable',
      errors: [],
      trees: [],
    };
  }
  const trees = [];
  const errors = [];
  const visited = new Set();
  const walk = (dir, segments) => {
    let real;
    try {
      real = realpathSync(dir);
    } catch (error) {
      errors.push(`${dir} (${error?.code ?? 'unreadable'})`);
      return;
    }
    const fromBase = relative(baseReal, real);
    if (fromBase.startsWith('..') || isAbsolute(fromBase)) {
      errors.push(`${dir} resolves outside ${base}`);
      return;
    }
    if (visited.has(real)) return;
    visited.add(real);

    if (segments.length && existsSync(join(dir, PLUGIN_MANIFEST))) {
      const tail = segments.join('/');
      const bucket = segments[0];
      const provenance = bucket.toLowerCase() === DIRECT_BUCKET
        ? 'direct'
        : `marketplace:${bucket}`;
      const basis = bucket.toLowerCase() === DIRECT_BUCKET ? 'recorded' : 'inferred';
      trees.push(readTree(dir, tail, provenance, basis));
      return;
    }

    const childNames = dirNamesIn(dir, errors);
    if (segments.length >= 2) {
      const inferredName = inferNameFromDir(segments.at(-1));
      if (looksKaiName(inferredName)) {
        const tail = segments.join('/');
        const bucket = segments[0];
        const provenance = bucket.toLowerCase() === DIRECT_BUCKET
          ? 'direct'
          : `marketplace:${bucket}`;
        const basis = bucket.toLowerCase() === DIRECT_BUCKET ? 'recorded' : 'inferred';
        trees.push(readTree(dir, tail, provenance, basis));
      }
    }

    for (const name of childNames) {
      walk(join(dir, name), [...segments, name]);
    }
  };

  walk(base, []);
  return { dir: base, present: true, readable: errors.length === 0, error: null, errors, trees };
}

// Join config metadata to what is on disk. A plugin is only "installed" when both
// agree; every other combination is a state a migration must not walk past.
export function reconcileInstalls(config, scan) {
  const records = new Map();
  const record = (name) => {
    if (!records.has(name)) {
      records.set(name, { name, entries: [], trees: [], provenances: new Set(), mismatches: [] });
    }
    return records.get(name);
  };

  const claimed = new Set();
  for (const entry of config.entries) {
    if (!entry.name || !KAI_PLUGINS.has(entry.name)) continue;
    const target = record(entry.name);
    target.entries.push(entry);
    target.provenances.add(entry.provenance);

    const dir = entry.cacheTail && scan.dir ? resolveUnder(scan.dir, entry.cacheTail) : null;
    const tree = dir ? scan.trees.find((t) => t.dir === dir) : null;
    if (tree) {
      claimed.add(tree);
      target.trees.push(tree);
      target.provenances.add(tree.provenance);
      if (tree.declaredName && tree.declaredName !== entry.name) {
        target.mismatches.push(
          `config lists "${entry.name}" at ${dir}, but that tree's ${PLUGIN_MANIFEST} declares "${tree.declaredName}"`,
        );
      }
    }
  }

  const unidentified = [];
  for (const tree of scan.trees) {
    if (claimed.has(tree) || !looksKai(tree)) continue;
    const name = KAI_PLUGINS.has(tree.declaredName)
      ? tree.declaredName
      : (!tree.declaredName && KAI_PLUGINS.has(tree.inferredName) ? tree.inferredName : null);
    if (!name) { unidentified.push(tree); continue; }
    const target = record(name);
    target.trees.push(tree);
    target.provenances.add(tree.provenance);
  }

  for (const target of records.values()) {
    if (target.entries.length && target.trees.length) target.presence = 'installed';
    else if (target.entries.length) target.presence = 'incomplete';
    else target.presence = 'stale';
  }
  return { records, unidentified };
}

export function inspectHost(home) {
  if (!existsSync(home)) return { home, exists: false };
  const settings = readHostSettings(home);
  const config = reconcileEnabledState(readHostConfig(home), settings);
  const scan = scanInstallTrees(home);
  const { records, unidentified } = reconcileInstalls(config, scan);
  return { home, exists: true, config, settings, scan, records, unidentified };
}

// --- workspace provenance --------------------------------------------------

// Which plugin scaffolded this workspace. Read-only: the doctor reports the
// recorded value and, when the host settles the question, prints the one-key edit
// that reconciles it. Applying that edit twice is a no-op, which is what makes an
// interrupted migration safe to resume.
export function readWorkspaceProvenance(root) {
  const path = join(root, '.kai', 'manifest.json');
  if (!existsSync(path)) return { path, present: false };
  let value;
  let text;
  try {
    text = readFileSync(path, 'utf8');
  } catch (error) {
    return { path, present: true, ok: false, error: `could not be read (${error?.code ?? 'unreadable'})` };
  }
  try {
    value = JSON.parse(text);
  } catch {
    return { path, present: true, ok: false, error: 'is not valid JSON' };
  }
  const plugin = value?.plugin;
  if (typeof plugin !== 'string' || !plugin.trim()) {
    return { path, present: true, ok: false, error: 'manifest has no "plugin" value' };
  }
  return { path, present: true, ok: true, plugin: plugin.trim(), recognized: WORKSPACE_PROVENANCE.has(plugin.trim()) };
}

// --- assessment ------------------------------------------------------------

const label = (provenance) => {
  if (provenance === 'direct') return 'direct install';
  if (provenance.startsWith('marketplace:')) return `marketplace install (${provenance.slice('marketplace:'.length)})`;
  return 'unknown provenance';
};

const describe = (target) => {
  const provenances = [...target.provenances].map(label).join(' + ') || 'unknown provenance';
  const where = target.trees.map((t) => t.dir).join(', ');
  if (target.presence === 'installed') return `${provenances}, tree at ${where}`;
  if (target.presence === 'incomplete') {
    const paths = target.entries.map((e) => e.cachePath ?? '(no cache_path recorded)').join(', ');
    return `${provenances}, but no install tree at ${paths}`;
  }
  return `${provenances}, tree at ${where} with no entry in the host config`;
};

function publishedPluginNames(indexPath) {
  if (!indexPath || !existsSync(indexPath)) return null;
  try {
    const index = JSON.parse(readFileSync(indexPath, 'utf8'));
    if (!Array.isArray(index?.plugins)) return null;
    return index.plugins.map((p) => p?.name).filter((n) => typeof n === 'string');
  } catch { return null; }
}

function assessHost(host, out) {
  const { add, step } = out;
  const { config, settings, scan, records, unidentified, home } = host;
  const configClassified = config.entries.every((entry) => !entry.malformed);

  if (!config.present) {
    add('unverified', 'unreadable-metadata',
      `${config.path} is missing — install state cannot be verified from disk alone.`);
  } else if (!config.ok) {
    add('unverified', 'unreadable-metadata',
      `${config.path} could not be read as install metadata (${config.error}); no install state is claimed from it.`);
  } else if (!config.listed) {
    add('unverified', 'unreadable-metadata',
      `${config.path} has no "installedPlugins" list — this host's install metadata shape is not recognized.`);
  }
  if (settings.present && !settings.ok) {
    add('unverified', 'enabled-state-unverified',
      `${settings.path} could not be read as enabled-plugin metadata (${settings.error}); `
      + 'installed plugins are not assumed enabled.');
  }

  if (!scan.present) {
    add('unverified', 'unreadable-install-tree',
      `${scan.dir} is missing — the install-tree surface was not available, so absence is not verified.`);
  } else if (!scan.readable) {
    const detail = scan.errors?.length ? ` Unreadable paths: ${scan.errors.join(', ')}.` : '';
    add('unverified', 'unreadable-install-tree',
      `${scan.dir} could not be fully enumerated (${scan.error ?? 'nested directory unreadable'}).${detail}`);
  }

  for (const entry of config.entries) {
    if (entry.malformed) {
      add('unverified', 'unreadable-metadata',
        `${config.path} installedPlugins[${entry.index}]: ${entry.malformed} — this entry cannot be classified.`);
    }
  }

  for (const tree of unidentified) {
    add('unverified', 'unknown-provenance',
      `${tree.dir} looks like a kai install tree but cannot be trusted as a known kai identity `
      + `(${tree.malformed ?? `declares "${tree.declaredName}"`}) — `
      + 'treated as possibly present, never as absent.');
  }

  for (const target of records.values()) {
    for (const tree of target.trees) {
      if (!tree.malformed) continue;
      add('unverified', 'unknown-provenance',
        `${tree.dir} is read as "${target.name}" from its directory name only (${tree.malformed}) — `
        + 'the identity is inferred, not confirmed.');
    }
    for (const mismatch of target.mismatches) {
      add('refusal', 'identity-mismatch',
        `${mismatch} — the install metadata and the tree disagree about what is installed, which is a half-applied migration.`);
    }
    const entryProvenances = new Set(target.entries.map((entry) => entry.provenance));
    const treeProvenances = new Set(target.trees.map((tree) => tree.provenance));
    const hasProvenanceCollision = target.entries.length > 1 || target.trees.length > 1;
    const hasProvenanceDisagreement = entryProvenances.size && treeProvenances.size
      && [...entryProvenances].some((provenance) => !treeProvenances.has(provenance));
    if (hasProvenanceCollision) {
      add('refusal', 'provenance-collision',
        `"${target.name}" is installed from more than one source (${[...target.provenances].map(label).join(' + ')}) — `
        + 'two copies of the same plugin load together and the host binds whichever it sees first.');
      if (config.ok && config.listed && configClassified) {
        step(`copilot plugin uninstall ${target.name}   # removes one copy; run it until \`copilot plugin list\` shows none`);
      }
    } else if (hasProvenanceDisagreement) {
      add('unverified', 'provenance-disagreement',
        `"${target.name}" has recorded provenance that disagrees with its install-tree location — `
        + 'the source cannot be trusted until the host layout is verified.');
    }
    if ([...target.provenances].includes('unknown')) {
      add('unverified', 'unknown-provenance',
        `"${target.name}" is installed but its source could not be determined — direct and marketplace installs are not distinguishable here.`);
    }
    const inferred = target.entries.filter((e) => e.basis === 'inferred');
    if (inferred.length) {
      add('unverified', 'unknown-provenance',
        `"${target.name}" records no "marketplace" field, so its source was inferred from its cache path `
        + `(${[...target.provenances].map(label).join(' + ')}) — inferred, not recorded.`);
    }
    if (target.presence === 'incomplete') {
      if (scan.readable) {
        add('refusal', 'incomplete-install',
          `"${target.name}" is recorded as installed (${describe(target)}) — an interrupted install or uninstall left the metadata and the disk out of step.`);
        step(`copilot plugin uninstall ${target.name}   # clears the stale entry in ${config.path}`);
      } else {
        add('unverified', 'install-tree-unverified',
          `"${target.name}" is recorded as installed, but its tree could not be verified while the install directory was unreadable — `
          + 'no uninstall is recommended from incomplete evidence.');
      }
    }
    if (target.presence === 'stale') {
      const treesUseObservedLayout = target.trees.every((tree) => tree.basis === 'recorded');
      const treeIdentitiesConfirmed = target.trees.every((tree) => !tree.malformed);
      if (config.ok && config.listed && configClassified && treesUseObservedLayout && treeIdentitiesConfirmed) {
        add('refusal', 'stale-install',
          `"${target.name}" has a leftover install tree (${describe(target)}) — an uninstall removed the entry and left the files, which the host may still load.`);
        step('remove each leftover install tree named in the stale-install finding above');
      } else {
        add('unverified', 'install-tree-unverified',
          `"${target.name}" has an install tree, but its metadata or on-disk layout is unverified — `
          + 'the tree is not labelled stale and no removal is recommended from incomplete evidence.');
      }
    }
    if (target.entries.some((e) => e.enabled === null)) {
      add('unverified', 'enabled-state-unverified',
        `"${target.name}" has contradictory or unreadable enabled-state evidence `
        + '— an explicit settings.json override must agree with config.json.');
    } else if (target.entries.some((e) => e.enabled === false)) {
      add('note', 'disabled-install',
        `"${target.name}" is installed but disabled — disabled is not uninstalled; it still occupies the name and can be re-enabled.`);
    }
  }

  const legacy = records.get(LEGACY_PLUGIN);
  const packs = PACK_PLUGINS.map((n) => records.get(n)).filter(Boolean);
  const legacyIdentityConfirmed = legacy?.entries.length > 0
    || legacy?.trees.some((tree) => tree.declaredName === LEGACY_PLUGIN);
  const actionableLegacy = legacy
    && legacyIdentityConfirmed
    && (legacy.entries.length > 0 || (config.ok && config.listed && configClassified));

  if (actionableLegacy && packs.length) {
    add('refusal', 'coexistence',
      `legacy "${LEGACY_PLUGIN}" and ${packs.map((p) => `"${p.name}"`).join(', ')} are installed together — `
      + 'both provide the core operating contract, the host binds one of them by load order, and a pack agent can pass its own '
      + 'preflight while running the stale copy. This is refused, not warned through.');
  }
  if (actionableLegacy) {
    add('refusal', 'legacy-installed',
      `legacy "${LEGACY_PLUGIN}" is present (${describe(legacy)}) — it must be verifiably uninstalled before any pack is installed.`);
    step(`copilot plugin uninstall ${LEGACY_PLUGIN}`);
    step(`copilot plugin list   # confirm no "${LEGACY_PLUGIN}" row remains before installing any pack`);
    if (legacy.trees.length) {
      step('confirm every legacy install tree named above is gone; uninstall can leave files behind on some hosts');
    }
  }

  const core = records.get(CORE_PLUGIN);
  const departments = DEPARTMENT_PLUGINS.map((n) => records.get(n)).filter(Boolean);
  if (departments.length && !core) {
    add('refusal', 'partial-pack-set',
      `${departments.map((d) => `"${d.name}"`).join(', ')} installed without "${CORE_PLUGIN}" — `
      + 'a department pack inherits its operating contract from core, and core missing does not raise a host error.');
    step(`copilot plugin install ${CORE_PLUGIN}@${MARKETPLACE}   # core is required, never optional`);
  }
  if (core && core.presence === 'installed') {
    out.notice(`"${CORE_PLUGIN}" is installed; a session that started before it does not have it loaded — `
      + 'start a new session before invoking pack agents.');
  }
  // "Nothing is installed" is a claim, so it is only made when both surfaces were
  // readable and every entry classified. Junk metadata is unknown, not empty.
  const bothSurfacesReadable = config.present && config.ok && config.listed
    && scan.present && scan.readable;
  if (!records.size && !unidentified.length && bothSurfacesReadable && configClassified) {
    add('note', 'nothing-installed',
      `no kai plugin is installed under ${home} — verified by reading ${config.path} and ${scan.dir}.`);
  }
  return { legacy: actionableLegacy || null, core, departments };
}

function assessWorkspace(root, hostSummary, host, out) {
  const { add, step } = out;
  if (!root) {
    add('note', 'workspace-not-inspected',
      'no workspace root was supplied or detected; this verdict covers host install state only.');
    return null;
  }

  const provenance = readWorkspaceProvenance(root);
  if (!provenance.present) {
    add('note', 'no-workspace', `no kai workspace at ${root} (${provenance.path} is absent) — nothing to migrate.`);
    return provenance;
  }
  if (!provenance.ok) {
    add('unverified', 'workspace-provenance-unreadable',
      `${provenance.path} ${provenance.error} — the workspace's recorded provenance cannot be read, so it is not migrated or assumed.`);
    return provenance;
  }
  if (!provenance.recognized) {
    add('unverified', 'workspace-provenance-unknown',
      `${provenance.path} records plugin "${provenance.plugin}", which is neither "${LEGACY_PLUGIN}" nor "${CORE_PLUGIN}" — `
      + 'left exactly as written; an unrecognized value is not migrated on a guess.');
    return provenance;
  }

  const { legacy, core } = hostSummary;
  const coreInstalled = core?.presence === 'installed';
  const evidenceComplete = host.config.ok && host.config.listed
    && host.scan.present && host.scan.readable && host.unidentified.length === 0;

  if (provenance.plugin === LEGACY_PLUGIN) {
    if (legacy) {
      add('note', 'workspace-provenance-current',
        `${provenance.path} records "${LEGACY_PLUGIN}", matching the installed monolith — nothing to migrate.`);
    } else if (coreInstalled && evidenceComplete) {
      add('refusal', 'workspace-provenance-stale',
        `${provenance.path} still records "${LEGACY_PLUGIN}" while this host runs the pack install — `
        + 'the migration is applied to the host but not to the workspace.');
      step(`edit ${provenance.path}: set "plugin": "${CORE_PLUGIN}" (this one key; every other value stays as written)`);
      step('node <kai-plugin>/scripts/workspace-doctor.mjs --root <workspace-root>   # confirm the workspace is healthy after the edit');
    } else {
      add('note', 'workspace-provenance-current',
        `${provenance.path} records "${LEGACY_PLUGIN}" and no verified pack install was found — nothing to migrate yet.`);
    }
    return provenance;
  }

  if (legacy) {
    add('refusal', 'workspace-provenance-ahead',
      `${provenance.path} records "${CORE_PLUGIN}" while legacy "${LEGACY_PLUGIN}" is still installed — `
      + 'the workspace was migrated ahead of the host, so the recorded provenance is not what is loaded.');
  } else if (coreInstalled) {
    add('note', 'workspace-provenance-migrated',
      `${provenance.path} records "${CORE_PLUGIN}", matching the installed pack surface — already migrated, re-applying changes nothing.`);
  } else {
    add('unverified', 'workspace-provenance-unconfirmed',
      `${provenance.path} records "${CORE_PLUGIN}" but no "${CORE_PLUGIN}" install was verified on this host — `
      + 'the recorded provenance is neither confirmed nor rewritten.');
  }
  return provenance;
}

// The single entry point: read-only inspection of one host home and (optionally)
// one workspace, returning a status, the findings behind it, and the exact steps
// an operator would run. Nothing here writes.
export function migrationReport({
  home = defaultHome(),
  root = null,
  marketplaceIndexPath = defaultMarketplaceIndex(),
} = {}) {
  const findings = [];
  const steps = [];
  const notices = [];
  const out = {
    add: (severity, code, message) => findings.push({ severity, code, message }),
    step: (text) => { if (!steps.includes(text)) steps.push(text); },
    notice: (text) => { if (!notices.includes(text)) notices.push(text); },
  };

  const host = inspectHost(home);
  if (!host.exists) {
    out.add('unverified', 'no-host-home',
      `no host home at ${home} — nothing was inspected, so nothing is claimed about what is installed. `
      + 'Set COPILOT_HOME or pass --home <dir> if the CLI keeps its plugins elsewhere.');
    return finish({ home, root, findings, steps, notices, host, workspace: null });
  }

  const hostSummary = assessHost(host, out);
  const workspace = assessWorkspace(root, hostSummary, host, out);

  const published = publishedPluginNames(marketplaceIndexPath);
  if (published && !published.includes(CORE_PLUGIN)) {
    out.notice(`packs are not published in the ${MARKETPLACE} index yet, so there is no pack install command to run — `
      + 'this check reports readiness for that day, and today\'s supported install is still the single `kai` plugin.');
  }
  if (steps.length) {
    out.notice('plugins load at session start: run the steps above, then start a NEW session before invoking any kai agent.');
  }

  return finish({ home, root, findings, steps, notices, host, workspace });
}

// Fail closed: only `clear` means a pack install may proceed. `unknown` is not a
// softer `clear` — it says the evidence did not settle the question, so it is
// never reported as success.
function finish(report) {
  const severities = new Set(report.findings.map((f) => f.severity));
  report.status = severities.has('refusal') ? 'blocked' : severities.has('unverified') ? 'unknown' : 'clear';
  report.codes = report.findings.map((f) => f.code);
  return report;
}
