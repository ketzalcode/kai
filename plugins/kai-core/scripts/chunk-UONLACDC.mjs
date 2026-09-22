import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  inspectRuntime
} from "./chunk-KZHPWPXN.mjs";
import {
  badPath,
  canonicalPath,
  escapesRoot,
  inspectGitPrivacy,
  inspectPrivateLanes,
  normalized,
  resolvedProjectPath
} from "./chunk-SQAAX6CQ.mjs";
import {
  defaultKaiHome,
  loadWorkspaceRegistry,
  readWorkspaceManifest,
  registryPath,
  resolveWorkspaceRoot
} from "./chunk-VTZRFV57.mjs";
import {
  LIFECYCLE,
  NEEDS_CHANGE_REF,
  REQUIRES_STATES,
  cleanScalar,
  dependsOn,
  frontmatter,
  isNull,
  lease,
  listBlock,
  parseStamp,
  scalar,
  unquote
} from "./chunk-VP4QXWCX.mjs";

// src/core/workspace-doctor.mjs
import {
  readFileSync as readFileSync2,
  existsSync as existsSync2,
  readdirSync as readdirSync2,
  cpSync,
  writeFileSync,
  mkdirSync,
  mkdtempSync,
  rmSync,
  lstatSync,
  readlinkSync,
  renameSync,
  symlinkSync,
  openSync,
  closeSync,
  unlinkSync
} from "node:fs";
import { spawn, spawnSync } from "node:child_process";
import { join as join2, resolve, dirname as dirname2, basename, relative as relative2, isAbsolute as isAbsolute2, sep } from "node:path";
import { tmpdir } from "node:os";
import { randomUUID } from "node:crypto";
import { fileURLToPath as fileURLToPath2 } from "node:url";

// src/core/lib/migration-doctor.mjs
import { existsSync, readdirSync, readFileSync, realpathSync, statSync } from "node:fs";
import { dirname, isAbsolute, join, relative } from "node:path";
import { homedir } from "node:os";
import { fileURLToPath } from "node:url";

// src/core/lib/pack-names.mjs
var PACK_ORDER = Object.freeze(["core", "creative", "engineering"]);
var packPluginName = (pack) => pack === "core" ? "kai-core" : `kai-${pack}`;

// src/core/lib/migration-doctor.mjs
var HERE = dirname(fileURLToPath(import.meta.url));
var LEGACY_PLUGIN = "kai";
var CORE_PLUGIN = packPluginName("core");
var PACK_PLUGINS = PACK_ORDER.map(packPluginName);
var DEPARTMENT_PLUGINS = PACK_PLUGINS.filter((n) => n !== CORE_PLUGIN);
var KAI_PLUGINS = /* @__PURE__ */ new Set([LEGACY_PLUGIN, ...PACK_PLUGINS]);
var MARKETPLACE = "kai-plugins";
var WORKSPACE_PROVENANCE = /* @__PURE__ */ new Set([LEGACY_PLUGIN, CORE_PLUGIN]);
var CONFIG_FILE = "config.json";
var SETTINGS_FILE = "settings.json";
var INSTALLED_DIR = "installed-plugins";
var DIRECT_BUCKET = "_direct";
var PLUGIN_MANIFEST = "plugin.json";
var defaultHome = () => process.env.COPILOT_HOME || join(homedir(), ".copilot");
var defaultMarketplaceIndex = () => join(HERE, "..", "..", "..", ".github", "plugin", "marketplace.json");
function parseJsonc(text) {
  let out = "";
  let inString = false;
  let escaped = false;
  let inLine = false;
  let inBlock = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    const next = text[i + 1];
    if (inLine) {
      if (c === "\n") {
        inLine = false;
        out += c;
      }
      continue;
    }
    if (inBlock) {
      if (c === "*" && next === "/") {
        inBlock = false;
        i++;
      }
      continue;
    }
    if (inString) {
      out += c;
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      out += c;
      continue;
    }
    if (c === "/" && next === "/") {
      inLine = true;
      i++;
      continue;
    }
    if (c === "/" && next === "*") {
      inBlock = true;
      i++;
      continue;
    }
    out += c;
  }
  try {
    return { ok: true, value: JSON.parse(out) };
  } catch {
    return { ok: false, error: "invalid JSONC syntax" };
  }
}
var normalizeHostPath = (p) => String(p).replace(/\\/g, "/").replace(/\/{2,}/g, "/").replace(/\/+$/, "");
function installTreeTail(cachePath) {
  if (typeof cachePath !== "string" || !cachePath.trim()) return null;
  const segments = normalizeHostPath(cachePath).split("/").filter(Boolean);
  const at = segments.map((s) => s.toLowerCase()).lastIndexOf(INSTALLED_DIR);
  if (at === -1) return null;
  const tail = segments.slice(at + 1);
  return tail.length ? tail.join("/") : null;
}
function directoryEntries(dir) {
  try {
    return { ok: true, entries: readdirSync(dir, { withFileTypes: true }) };
  } catch (error) {
    return { ok: false, entries: [], error: error?.code ?? "unreadable" };
  }
}
function directoryState(dir) {
  try {
    return { ok: true, isDirectory: statSync(dir).isDirectory() };
  } catch (error) {
    return { ok: false, isDirectory: false, error: error?.code ?? "unreadable" };
  }
}
function childDir(base, name) {
  const listing = directoryEntries(base);
  if (!listing.ok) return null;
  const dirs = listing.entries.filter((entry) => directoryState(join(base, entry.name)).isDirectory);
  const hit = dirs.find((entry) => entry.name === name) || dirs.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  return hit ? join(base, hit.name) : null;
}
function inspectChildDir(base, name) {
  let entries;
  try {
    entries = readdirSync(base, { withFileTypes: true });
  } catch (error) {
    return { dir: join(base, name), present: false, readable: false, error: error?.code ?? "unreadable" };
  }
  const hit = entries.find((entry) => entry.name === name) || entries.find((entry) => entry.name.toLowerCase() === name.toLowerCase());
  if (!hit) return { dir: join(base, name), present: false, readable: true, error: "missing" };
  const dir = join(base, hit.name);
  const state = directoryState(dir);
  if (!state.ok) return { dir, present: true, readable: false, error: state.error };
  if (!state.isDirectory) return { dir, present: true, readable: false, error: "not-a-directory" };
  const listing = directoryEntries(dir);
  return { dir, present: true, readable: listing.ok, error: listing.error ?? null };
}
function resolveUnder(base, tail) {
  let dir = base;
  for (const segment of tail.split("/")) {
    dir = childDir(dir, segment);
    if (!dir) return null;
  }
  return dir;
}
var dirNamesIn = (dir, errors) => {
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
function entryProvenance(entry) {
  const raw = entry.marketplace;
  if (typeof raw === "string" && raw.trim()) return { provenance: `marketplace:${raw.trim()}`, basis: "recorded" };
  if (raw === "") return { provenance: "direct", basis: "recorded" };
  if (raw !== void 0) return { provenance: "unknown", basis: "unreadable" };
  const tail = installTreeTail(entry.cache_path);
  if (tail) {
    const bucket = tail.split("/")[0];
    return bucket.toLowerCase() === DIRECT_BUCKET ? { provenance: "direct", basis: "inferred" } : { provenance: `marketplace:${bucket}`, basis: "inferred" };
  }
  if (entry.source && typeof entry.source === "object") return { provenance: "direct", basis: "inferred" };
  return { provenance: "unknown", basis: "unknown" };
}
function readHostConfig(home) {
  const path = join(home, CONFIG_FILE);
  if (!existsSync(path)) return { path, present: false, ok: false, entries: [] };
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    return { path, present: true, ok: false, error: `could not be read (${error?.code ?? "unreadable"})`, entries: [] };
  }
  const parsed = parseJsonc(text);
  if (!parsed.ok) return { path, present: true, ok: false, error: parsed.error, entries: [] };
  const raw = parsed.value?.installedPlugins;
  if (raw === void 0) return { path, present: true, ok: true, listed: false, entries: [] };
  if (!Array.isArray(raw)) {
    return { path, present: true, ok: false, error: '"installedPlugins" is not an array', entries: [] };
  }
  const entries = raw.map((value, index) => {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
      return { index, name: null, malformed: "entry is not an object", provenance: "unknown", basis: "unknown" };
    }
    const name = typeof value.name === "string" && value.name.trim() ? value.name.trim() : null;
    const { provenance, basis } = entryProvenance(value);
    return {
      index,
      name,
      malformed: name ? null : 'entry has no "name"',
      provenance,
      basis,
      version: typeof value.version === "string" ? value.version : null,
      cachePath: typeof value.cache_path === "string" ? value.cache_path : null,
      cacheTail: installTreeTail(value.cache_path),
      enabled: typeof value.enabled === "boolean" ? value.enabled : null
    };
  });
  return { path, present: true, ok: true, listed: true, entries };
}
function readHostSettings(home) {
  const path = join(home, SETTINGS_FILE);
  if (!existsSync(path)) return { path, present: false, ok: false, listed: false, values: /* @__PURE__ */ new Map() };
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    return {
      path,
      present: true,
      ok: false,
      listed: false,
      error: `could not be read (${error?.code ?? "unreadable"})`,
      values: /* @__PURE__ */ new Map()
    };
  }
  const parsed = parseJsonc(text);
  if (!parsed.ok) {
    return { path, present: true, ok: false, listed: false, error: parsed.error, values: /* @__PURE__ */ new Map() };
  }
  const raw = parsed.value?.enabledPlugins;
  if (raw === void 0) return { path, present: true, ok: true, listed: false, values: /* @__PURE__ */ new Map() };
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return {
      path,
      present: true,
      ok: false,
      listed: false,
      error: '"enabledPlugins" is not an object',
      values: /* @__PURE__ */ new Map()
    };
  }
  const values = /* @__PURE__ */ new Map();
  const malformed = [];
  for (const [id, enabled] of Object.entries(raw)) {
    if (typeof enabled === "boolean") values.set(id, enabled);
    else malformed.push(id);
  }
  if (malformed.length) {
    return {
      path,
      present: true,
      ok: false,
      listed: true,
      error: `non-boolean enabled state for ${malformed.map((id) => `"${id}"`).join(", ")}`,
      values
    };
  }
  return { path, present: true, ok: true, listed: true, values };
}
function reconcileEnabledState(config, settings) {
  if (!settings.present) return config;
  if (!settings.ok) {
    return {
      ...config,
      entries: config.entries.map((entry) => entry.name ? { ...entry, enabled: null, configEnabled: entry.enabled, settingEnabled: null } : entry)
    };
  }
  if (!settings.listed) return config;
  return {
    ...config,
    entries: config.entries.map((entry) => {
      if (!entry.name) return entry;
      const marketplace = entry.provenance.startsWith("marketplace:") ? entry.provenance.slice("marketplace:".length) : null;
      const id = marketplace ? `${entry.name}@${marketplace}` : entry.name;
      const settingEnabled = settings.values.get(id);
      if (typeof settingEnabled !== "boolean") return entry;
      const enabled = typeof entry.enabled === "boolean" && settingEnabled === entry.enabled ? settingEnabled : null;
      return { ...entry, enabled, configEnabled: entry.enabled, settingEnabled: settingEnabled ?? null };
    })
  };
}
var inferNameFromDir = (name) => name.includes("--") ? name.slice(name.lastIndexOf("--") + 2) : name;
function readTree(dir, tail, provenance, basis) {
  const manifest = join(dir, PLUGIN_MANIFEST);
  const tree = {
    dir,
    tail,
    provenance,
    basis,
    declaredName: null,
    malformed: null,
    inferredName: inferNameFromDir(tail.split("/").pop())
  };
  if (!existsSync(manifest)) {
    tree.malformed = `no ${PLUGIN_MANIFEST}`;
    return tree;
  }
  try {
    const value = JSON.parse(readFileSync(manifest, "utf8"));
    if (typeof value?.name === "string" && value.name.trim()) tree.declaredName = value.name.trim();
    else tree.malformed = `${PLUGIN_MANIFEST} declares no "name"`;
  } catch {
    tree.malformed = `${PLUGIN_MANIFEST} could not be read as valid JSON`;
  }
  return tree;
}
var looksKaiName = (name) => KAI_PLUGINS.has(name) || /(^|[-_])kai([-_]|$)/i.test(name);
var looksKai = (tree) => KAI_PLUGINS.has(tree.declaredName) || KAI_PLUGINS.has(tree.inferredName) || looksKaiName(tree.inferredName);
function scanInstallTrees(home) {
  const root = inspectChildDir(home, INSTALLED_DIR);
  if (!root.present || !root.readable) {
    return {
      dir: root.dir,
      present: root.present,
      readable: false,
      error: root.error,
      errors: [],
      trees: []
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
      error: error?.code ?? "unreadable",
      errors: [],
      trees: []
    };
  }
  const trees = [];
  const errors = [];
  const visited = /* @__PURE__ */ new Set();
  const walk = (dir, segments) => {
    let real;
    try {
      real = realpathSync(dir);
    } catch (error) {
      errors.push(`${dir} (${error?.code ?? "unreadable"})`);
      return;
    }
    const fromBase = relative(baseReal, real);
    if (fromBase.startsWith("..") || isAbsolute(fromBase)) {
      errors.push(`${dir} resolves outside ${base}`);
      return;
    }
    if (visited.has(real)) return;
    visited.add(real);
    if (segments.length && existsSync(join(dir, PLUGIN_MANIFEST))) {
      const tail = segments.join("/");
      const bucket = segments[0];
      const provenance = bucket.toLowerCase() === DIRECT_BUCKET ? "direct" : `marketplace:${bucket}`;
      const basis = bucket.toLowerCase() === DIRECT_BUCKET ? "recorded" : "inferred";
      trees.push(readTree(dir, tail, provenance, basis));
      return;
    }
    const childNames = dirNamesIn(dir, errors);
    if (segments.length >= 2) {
      const inferredName = inferNameFromDir(segments.at(-1));
      if (looksKaiName(inferredName)) {
        const tail = segments.join("/");
        const bucket = segments[0];
        const provenance = bucket.toLowerCase() === DIRECT_BUCKET ? "direct" : `marketplace:${bucket}`;
        const basis = bucket.toLowerCase() === DIRECT_BUCKET ? "recorded" : "inferred";
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
function reconcileInstalls(config, scan) {
  const records = /* @__PURE__ */ new Map();
  const record = (name) => {
    if (!records.has(name)) {
      records.set(name, { name, entries: [], trees: [], provenances: /* @__PURE__ */ new Set(), mismatches: [] });
    }
    return records.get(name);
  };
  const claimed = /* @__PURE__ */ new Set();
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
          `config lists "${entry.name}" at ${dir}, but that tree's ${PLUGIN_MANIFEST} declares "${tree.declaredName}"`
        );
      }
    }
  }
  const unidentified = [];
  for (const tree of scan.trees) {
    if (claimed.has(tree) || !looksKai(tree)) continue;
    const name = KAI_PLUGINS.has(tree.declaredName) ? tree.declaredName : !tree.declaredName && KAI_PLUGINS.has(tree.inferredName) ? tree.inferredName : null;
    if (!name) {
      unidentified.push(tree);
      continue;
    }
    const target = record(name);
    target.trees.push(tree);
    target.provenances.add(tree.provenance);
  }
  for (const target of records.values()) {
    if (target.entries.length && target.trees.length) target.presence = "installed";
    else if (target.entries.length) target.presence = "incomplete";
    else target.presence = "stale";
  }
  return { records, unidentified };
}
function inspectHost(home) {
  if (!existsSync(home)) return { home, exists: false };
  const settings = readHostSettings(home);
  const config = reconcileEnabledState(readHostConfig(home), settings);
  const scan = scanInstallTrees(home);
  const { records, unidentified } = reconcileInstalls(config, scan);
  return { home, exists: true, config, settings, scan, records, unidentified };
}
function readWorkspaceProvenance(root) {
  const path = join(root, ".kai", "manifest.json");
  if (!existsSync(path)) return { path, present: false };
  let value;
  let text;
  try {
    text = readFileSync(path, "utf8");
  } catch (error) {
    return { path, present: true, ok: false, error: `could not be read (${error?.code ?? "unreadable"})` };
  }
  try {
    value = JSON.parse(text);
  } catch {
    return { path, present: true, ok: false, error: "is not valid JSON" };
  }
  const plugin = value?.plugin;
  if (typeof plugin !== "string" || !plugin.trim()) {
    return { path, present: true, ok: false, error: 'manifest has no "plugin" value' };
  }
  return { path, present: true, ok: true, plugin: plugin.trim(), recognized: WORKSPACE_PROVENANCE.has(plugin.trim()) };
}
var label = (provenance) => {
  if (provenance === "direct") return "direct install";
  if (provenance.startsWith("marketplace:")) return `marketplace install (${provenance.slice("marketplace:".length)})`;
  return "unknown provenance";
};
var describe = (target) => {
  const provenances = [...target.provenances].map(label).join(" + ") || "unknown provenance";
  const where = target.trees.map((t) => t.dir).join(", ");
  if (target.presence === "installed") return `${provenances}, tree at ${where}`;
  if (target.presence === "incomplete") {
    const paths = target.entries.map((e) => e.cachePath ?? "(no cache_path recorded)").join(", ");
    return `${provenances}, but no install tree at ${paths}`;
  }
  return `${provenances}, tree at ${where} with no entry in the host config`;
};
function publishedPluginNames(indexPath) {
  if (!indexPath || !existsSync(indexPath)) return null;
  try {
    const index = JSON.parse(readFileSync(indexPath, "utf8"));
    if (!Array.isArray(index?.plugins)) return null;
    return index.plugins.map((p) => p?.name).filter((n) => typeof n === "string");
  } catch {
    return null;
  }
}
function assessHost(host, out, { rollback = false } = {}) {
  const { add, step } = out;
  const { config, settings, scan, records, unidentified, home } = host;
  const configClassified = config.entries.every((entry) => !entry.malformed);
  if (!config.present) {
    add(
      "unverified",
      "unreadable-metadata",
      `${config.path} is missing \u2014 install state cannot be verified from disk alone.`
    );
  } else if (!config.ok) {
    add(
      "unverified",
      "unreadable-metadata",
      `${config.path} could not be read as install metadata (${config.error}); no install state is claimed from it.`
    );
  } else if (!config.listed) {
    add(
      "unverified",
      "unreadable-metadata",
      `${config.path} has no "installedPlugins" list \u2014 this host's install metadata shape is not recognized.`
    );
  }
  if (settings.present && !settings.ok) {
    add(
      "unverified",
      "enabled-state-unverified",
      `${settings.path} could not be read as enabled-plugin metadata (${settings.error}); installed plugins are not assumed enabled.`
    );
  }
  if (!scan.present) {
    add(
      "unverified",
      "unreadable-install-tree",
      `${scan.dir} is missing \u2014 the install-tree surface was not available, so absence is not verified.`
    );
  } else if (!scan.readable) {
    const detail = scan.errors?.length ? ` Unreadable paths: ${scan.errors.join(", ")}.` : "";
    add(
      "unverified",
      "unreadable-install-tree",
      `${scan.dir} could not be fully enumerated (${scan.error ?? "nested directory unreadable"}).${detail}`
    );
  }
  for (const entry of config.entries) {
    if (entry.malformed) {
      add(
        "unverified",
        "unreadable-metadata",
        `${config.path} installedPlugins[${entry.index}]: ${entry.malformed} \u2014 this entry cannot be classified.`
      );
    }
  }
  for (const tree of unidentified) {
    add(
      "unverified",
      "unknown-provenance",
      `${tree.dir} looks like a kai install tree but cannot be trusted as a known kai identity (${tree.malformed ?? `declares "${tree.declaredName}"`}) \u2014 treated as possibly present, never as absent.`
    );
  }
  for (const target of records.values()) {
    for (const tree of target.trees) {
      if (!tree.malformed) continue;
      add(
        "unverified",
        "unknown-provenance",
        `${tree.dir} is read as "${target.name}" from its directory name only (${tree.malformed}) \u2014 the identity is inferred, not confirmed.`
      );
    }
    for (const mismatch of target.mismatches) {
      add(
        "refusal",
        "identity-mismatch",
        `${mismatch} \u2014 the install metadata and the tree disagree about what is installed, which is a half-applied migration.`
      );
    }
    const entryProvenances = new Set(target.entries.map((entry) => entry.provenance));
    const treeProvenances = new Set(target.trees.map((tree) => tree.provenance));
    const hasProvenanceCollision = target.entries.length > 1 || target.trees.length > 1;
    const hasProvenanceDisagreement = entryProvenances.size && treeProvenances.size && [...entryProvenances].some((provenance) => !treeProvenances.has(provenance));
    if (hasProvenanceCollision) {
      add(
        "refusal",
        "provenance-collision",
        `"${target.name}" is installed from more than one source (${[...target.provenances].map(label).join(" + ")}) \u2014 two copies of the same plugin load together and the host binds whichever it sees first.`
      );
      if (config.ok && config.listed && configClassified && !(rollback && target.name === LEGACY_PLUGIN)) {
        step(`copilot plugin uninstall ${target.name}   # removes one copy; run it until \`copilot plugin list\` shows none`);
      }
    } else if (hasProvenanceDisagreement) {
      add(
        "unverified",
        "provenance-disagreement",
        `"${target.name}" has recorded provenance that disagrees with its install-tree location \u2014 the source cannot be trusted until the host layout is verified.`
      );
    }
    if ([...target.provenances].includes("unknown")) {
      add(
        "unverified",
        "unknown-provenance",
        `"${target.name}" is installed but its source could not be determined \u2014 direct and marketplace installs are not distinguishable here.`
      );
    }
    const inferred = target.entries.filter((e) => e.basis === "inferred");
    if (inferred.length) {
      add(
        "unverified",
        "unknown-provenance",
        `"${target.name}" records no "marketplace" field, so its source was inferred from its cache path (${[...target.provenances].map(label).join(" + ")}) \u2014 inferred, not recorded.`
      );
    }
    if (target.presence === "incomplete") {
      if (scan.readable) {
        add(
          "refusal",
          "incomplete-install",
          `"${target.name}" is recorded as installed (${describe(target)}) \u2014 an interrupted install or uninstall left the metadata and the disk out of step.`
        );
        if (!(rollback && target.name === LEGACY_PLUGIN)) {
          step(`copilot plugin uninstall ${target.name}   # clears the stale entry in ${config.path}`);
        }
      } else {
        add(
          "unverified",
          "install-tree-unverified",
          `"${target.name}" is recorded as installed, but its tree could not be verified while the install directory was unreadable \u2014 no uninstall is recommended from incomplete evidence.`
        );
      }
    }
    if (target.presence === "stale") {
      const treesUseObservedLayout = target.trees.every((tree) => tree.basis === "recorded");
      const treeIdentitiesConfirmed = target.trees.every((tree) => !tree.malformed);
      if (config.ok && config.listed && configClassified && treesUseObservedLayout && treeIdentitiesConfirmed) {
        add(
          "refusal",
          "stale-install",
          `"${target.name}" has a leftover install tree (${describe(target)}) \u2014 an uninstall removed the entry and left the files, which the host may still load.`
        );
        step("remove each leftover install tree named in the stale-install finding above");
      } else {
        add(
          "unverified",
          "install-tree-unverified",
          `"${target.name}" has an install tree, but its metadata or on-disk layout is unverified \u2014 the tree is not labelled stale and no removal is recommended from incomplete evidence.`
        );
      }
    }
    if (target.entries.some((e) => e.enabled === null)) {
      add(
        "unverified",
        "enabled-state-unverified",
        `"${target.name}" has contradictory or unreadable enabled-state evidence \u2014 an explicit settings.json override must agree with config.json.`
      );
    } else if (target.entries.some((e) => e.enabled === false)) {
      add(
        "note",
        "disabled-install",
        `"${target.name}" is installed but disabled \u2014 disabled is not uninstalled; it still occupies the name and can be re-enabled.`
      );
    }
  }
  const legacy = records.get(LEGACY_PLUGIN);
  const packs = PACK_PLUGINS.map((n) => records.get(n)).filter(Boolean);
  const legacyIdentityConfirmed = legacy?.entries.length > 0 || legacy?.trees.some((tree) => tree.declaredName === LEGACY_PLUGIN);
  const actionableLegacy = legacy && legacyIdentityConfirmed && (legacy.entries.length > 0 || config.ok && config.listed && configClassified);
  const hostEvidenceComplete = config.present && config.ok && config.listed && configClassified && scan.present && scan.readable && unidentified.length === 0;
  const legacyEnabled = legacy?.entries.length > 0 && legacy.entries.every((entry) => entry.enabled === true);
  const legacyIdentityConsistent = legacy?.entries.length === 1 && legacy.trees.length === 1 && legacy.mismatches.length === 0 && !legacy.entries[0].malformed && !legacy.trees[0].malformed && legacy.entries[0].basis === "recorded" && legacy.trees[0].declaredName === LEGACY_PLUGIN && legacy.entries[0].provenance === legacy.trees[0].provenance && records.size === 1;
  const rollbackReady = Boolean(rollback && actionableLegacy && legacy.presence === "installed" && legacyEnabled && legacyIdentityConsistent && packs.length === 0 && hostEvidenceComplete);
  if (actionableLegacy && packs.length) {
    add(
      "refusal",
      "coexistence",
      `legacy "${LEGACY_PLUGIN}" and ${packs.map((p) => `"${p.name}"`).join(", ")} are installed together \u2014 both provide the core operating contract, the host binds one of them by load order, and a pack agent can pass its own preflight while running the stale copy. This is refused, not warned through.`
    );
  }
  if (actionableLegacy && !rollback) {
    add(
      "refusal",
      "legacy-installed",
      `legacy "${LEGACY_PLUGIN}" is present (${describe(legacy)}) \u2014 it must be verifiably uninstalled before any pack is installed.`
    );
    step(`copilot plugin uninstall ${LEGACY_PLUGIN}`);
    step(`copilot plugin list   # confirm no "${LEGACY_PLUGIN}" row remains before installing any pack`);
    if (legacy.trees.length) {
      step("confirm every legacy install tree named above is gone; uninstall can leave files behind on some hosts");
    }
  }
  if (rollbackReady) {
    add(
      "note",
      "legacy-rollback-restored",
      `rollback intent is explicit and legacy "${LEGACY_PLUGIN}" is installed, enabled, and the only verified kai surface.`
    );
  } else if (rollback) {
    add(
      "refusal",
      "legacy-rollback-unverified",
      `rollback intent was requested, but legacy "${LEGACY_PLUGIN}" was not verified as one installed, enabled, identity-consistent, pack-free surface \u2014 workspace provenance is not safe to reverse.`
    );
  }
  const core = records.get(CORE_PLUGIN);
  const departments = DEPARTMENT_PLUGINS.map((n) => records.get(n)).filter(Boolean);
  if (departments.length && !core) {
    add(
      "refusal",
      "partial-pack-set",
      `${departments.map((d) => `"${d.name}"`).join(", ")} installed without "${CORE_PLUGIN}" \u2014 a department pack inherits its operating contract from core, and core missing does not raise a host error.`
    );
    step(`copilot plugin install ${CORE_PLUGIN}@${MARKETPLACE}   # core is required, never optional`);
  }
  if (core && core.presence === "installed") {
    out.notice(`"${CORE_PLUGIN}" is installed; a session that started before it does not have it loaded \u2014 start a new session before invoking pack agents.`);
  }
  const bothSurfacesReadable = config.present && config.ok && config.listed && scan.present && scan.readable;
  if (!records.size && !unidentified.length && bothSurfacesReadable && configClassified) {
    add(
      "note",
      "nothing-installed",
      `no kai plugin is installed under ${home} \u2014 verified by reading ${config.path} and ${scan.dir}.`
    );
  }
  return { legacy: actionableLegacy || null, core, departments, rollbackReady };
}
function assessWorkspace(root, hostSummary, host, out) {
  const { add, step } = out;
  if (!root) {
    add(
      "note",
      "workspace-not-inspected",
      "no workspace root was supplied or detected; this verdict covers host install state only."
    );
    return null;
  }
  const provenance = readWorkspaceProvenance(root);
  if (!provenance.present) {
    add("note", "no-workspace", `no kai workspace at ${root} (${provenance.path} is absent) \u2014 nothing to migrate.`);
    return provenance;
  }
  if (!provenance.ok) {
    add(
      "unverified",
      "workspace-provenance-unreadable",
      `${provenance.path} ${provenance.error} \u2014 the workspace's recorded provenance cannot be read, so it is not migrated or assumed.`
    );
    return provenance;
  }
  if (!provenance.recognized) {
    add(
      "unverified",
      "workspace-provenance-unknown",
      `${provenance.path} records plugin "${provenance.plugin}", which is neither "${LEGACY_PLUGIN}" nor "${CORE_PLUGIN}" \u2014 left exactly as written; an unrecognized value is not migrated on a guess.`
    );
    return provenance;
  }
  const { legacy, core, rollbackReady } = hostSummary;
  const coreInstalled = core?.presence === "installed";
  const evidenceComplete = host.config.ok && host.config.listed && host.scan.present && host.scan.readable && host.unidentified.length === 0;
  if (provenance.plugin === LEGACY_PLUGIN) {
    if (legacy) {
      add(
        "note",
        "workspace-provenance-current",
        `${provenance.path} records "${LEGACY_PLUGIN}", matching the installed monolith \u2014 nothing to migrate.`
      );
    } else if (coreInstalled && evidenceComplete) {
      add(
        "refusal",
        "workspace-provenance-stale",
        `${provenance.path} still records "${LEGACY_PLUGIN}" while this host runs the pack install \u2014 the migration is applied to the host but not to the workspace.`
      );
      step(`edit ${provenance.path}: set "plugin": "${CORE_PLUGIN}" (this one key; every other value stays as written)`);
      step("node <kai-plugin>/scripts/workspace-doctor.mjs --root <workspace-root>   # confirm the workspace is healthy after the edit");
    } else {
      add(
        "note",
        "workspace-provenance-current",
        `${provenance.path} records "${LEGACY_PLUGIN}" and no verified pack install was found \u2014 nothing to migrate yet.`
      );
    }
    return provenance;
  }
  if (legacy) {
    add(
      "refusal",
      "workspace-provenance-ahead",
      `${provenance.path} records "${CORE_PLUGIN}" while legacy "${LEGACY_PLUGIN}" is still installed \u2014 the workspace was migrated ahead of the host, so the recorded provenance is not what is loaded.`
    );
    if (rollbackReady) {
      step(`edit ${provenance.path}: set "plugin": "${LEGACY_PLUGIN}" (this one key; every other value stays as written)`);
      step("node <kai-plugin>/scripts/workspace-doctor.mjs --root <workspace-root>   # confirm the workspace is healthy after the edit");
    }
  } else if (coreInstalled) {
    add(
      "note",
      "workspace-provenance-migrated",
      `${provenance.path} records "${CORE_PLUGIN}", matching the installed pack surface \u2014 already migrated, re-applying changes nothing.`
    );
  } else {
    add(
      "unverified",
      "workspace-provenance-unconfirmed",
      `${provenance.path} records "${CORE_PLUGIN}" but no "${CORE_PLUGIN}" install was verified on this host \u2014 the recorded provenance is neither confirmed nor rewritten.`
    );
  }
  return provenance;
}
function migrationReport({
  home = defaultHome(),
  root = null,
  marketplaceIndexPath = defaultMarketplaceIndex(),
  rollback = false
} = {}) {
  const findings = [];
  const steps = [];
  const notices = [];
  const out = {
    add: (severity, code, message) => findings.push({ severity, code, message }),
    step: (text) => {
      if (!steps.includes(text)) steps.push(text);
    },
    notice: (text) => {
      if (!notices.includes(text)) notices.push(text);
    }
  };
  const host = inspectHost(home);
  if (!host.exists) {
    out.add(
      "unverified",
      "no-host-home",
      `no host home at ${home} \u2014 nothing was inspected, so nothing is claimed about what is installed. Set COPILOT_HOME or pass --home <dir> if the CLI keeps its plugins elsewhere.`
    );
    return finish({ home, root, rollback, findings, steps, notices, host, workspace: null });
  }
  const hostSummary = assessHost(host, out, { rollback });
  const workspace = assessWorkspace(root, hostSummary, host, out);
  const published = publishedPluginNames(marketplaceIndexPath);
  if (published && !published.includes(CORE_PLUGIN)) {
    out.notice(`packs are not published in the ${MARKETPLACE} index yet, so there is no pack install command to run \u2014 this check reports readiness for that day, and today's supported install is still the single \`kai\` plugin.`);
  }
  if (steps.length) {
    out.notice("plugins load at session start: run the steps above, then start a NEW session before invoking any kai agent.");
  }
  return finish({ home, root, rollback, findings, steps, notices, host, workspace });
}
function finish(report2) {
  const severities = new Set(report2.findings.map((f) => f.severity));
  report2.status = severities.has("refusal") ? "blocked" : severities.has("unverified") ? "unknown" : "clear";
  report2.codes = report2.findings.map((f) => f.code);
  return report2;
}

// src/core/workspace-doctor.mjs
var __dirname = dirname2(fileURLToPath2(import.meta.url));
var REPO_ROOT = join2(__dirname, "..", "..");
var CURRENT_SCHEMA_VERSION = 3;
var CURRENT_CONTRACT_VERSION = 4;
var REQUIRED_MANIFEST_KEYS = [
  "plugin",
  "version",
  "schema_version",
  "scaffolded",
  "workspace_id",
  "storage_mode",
  "workspace_root",
  "state",
  "runs",
  "review",
  "archive",
  "personal",
  "projects",
  "areas"
];
var DEFAULT_ROOTS = {
  state: ".kai/state",
  runs: ".kai/runs",
  review: ".kai/review",
  archive: ".kai/archive",
  personal: ".kai/personal"
};
var CANONICAL_AREAS = /* @__PURE__ */ new Set([
  "qa",
  "eng",
  "product",
  "revenue",
  "support",
  "review",
  "ship",
  "incident",
  "ai",
  "learn",
  "lessons",
  "pulse",
  "content"
]);
var STORAGE_MODES = /* @__PURE__ */ new Set(["external", "repo-local", "shared"]);
var REQUIRES_EXISTING_ARTIFACTS = /* @__PURE__ */ new Set([
  "in-review",
  "completed",
  "release-ready",
  "deploying",
  "production-verification",
  "shipped"
]);
var PROJECT_ID = /^[a-z][a-z0-9-]*$/;
var WORKSPACE_ID = /^[a-z0-9][a-z0-9-]{7,}$/i;
var RETIRED_SCHEMA_2_KEYS = [
  "workspace_mode",
  "corpus_visibility",
  "kai",
  "corpus",
  "coordination",
  "initiatives",
  "library"
];
var REQUIRED_SCHEMA_3_PATHS = /* @__PURE__ */ new Map([
  [".kai/CONVENTIONS.md", "file"],
  [".kai/state/ACTIVE.md", "file"],
  [".kai/state/BOARD.md", "file"],
  [".kai/state/backlog.md", "file"],
  [".kai/state/items", "directory"],
  [".kai/state/threads", "directory"],
  [".kai/state/initiatives/INDEX.md", "file"]
]);
function nestedScalar(fmLines, section, key) {
  let inSection = false;
  for (const line of fmLines) {
    if (line === `${section}:`) {
      inSection = true;
      continue;
    }
    if (!inSection) continue;
    if (/^\S/.test(line)) return void 0;
    const match = line.match(new RegExp(`^\\s+${key}:\\s?(.*)$`));
    if (match) return cleanScalar(match[1]);
  }
  return void 0;
}
function provenLegacyRoots(root) {
  return ["kai/coordination", "kai/initiatives", "kai/library", "kai/personal"].filter((base) => {
    const path = join2(root, ...base.split("/"));
    if (!existsSync2(path)) return false;
    try {
      return readdirSync2(path).length > 0;
    } catch {
      return true;
    }
  });
}
function checkGitMode(root, mode, err, warn) {
  const privacy = inspectGitPrivacy(root, mode);
  privacy.errors.forEach(err);
  privacy.warnings.forEach(warn);
  for (const path of privacy.missing) {
    err(mode === "repo-local" && path === ".kai/" ? 'storage_mode "repo-local" requires the entire .kai/ directory to be ignored' : `storage_mode "${mode}" requires "${path}" to be ignored`);
  }
}
function checkWorkspace(root, options = {}) {
  root = resolve(root);
  const errors = [];
  const warnings = [];
  const migrations = [];
  const err = (m2) => errors.push(m2);
  const warn = (m2) => warnings.push(m2);
  const intent = options.intent ?? "inspect";
  if (!["inspect", "coordinate"].includes(intent)) {
    return { errors: ["workspace intent must be inspect or coordinate"], warnings, migrations };
  }
  const manifestPath = join2(root, ".kai", "manifest.json");
  if (!existsSync2(manifestPath)) {
    err(".kai/manifest.json is missing \u2014 the workspace is not onboarded. Run workflow-workspace-init.");
    return { errors, warnings, migrations };
  }
  const manifestResult = readWorkspaceManifest(root);
  if (!manifestResult.ok) {
    err(manifestResult.reason);
    return { errors, warnings, migrations };
  }
  const m = manifestResult.manifest;
  if (!m || typeof m !== "object" || Array.isArray(m)) {
    err(".kai/manifest.json must contain a JSON object");
    return { errors, warnings, migrations };
  }
  if (m.schema_version === 4) {
    const inspection = inspectRuntime(root, { env: options.env ?? process.env, intent });
    if (intent === "coordinate" && inspection.migrations.length) {
      inspection.errors.push("pending migration recovery prevents coordinated writes");
    }
    return { errors: inspection.errors, warnings: inspection.warnings, migrations: inspection.migrations };
  }
  if (m.schema_version === 3) {
    migrations.push("schema 3 is inspect-only; explicit offline migration to schema 4 is required for coordination");
    if (intent === "coordinate") err("schema 3 coordinated writes are refused; explicitly migrate to schema 4 first");
  }
  for (const k of REQUIRED_MANIFEST_KEYS) {
    if (!(k in m)) {
      if (k === "schema_version") continue;
      if (Number.isInteger(m.schema_version) && m.schema_version < CURRENT_SCHEMA_VERSION) continue;
      err(`.kai/manifest.json missing required key "${k}"`);
    }
  }
  if (m.plugin !== void 0 && !WORKSPACE_PROVENANCE.has(m.plugin)) {
    err(`.kai/manifest.json "plugin" must be "${LEGACY_PLUGIN}" (monolith) or "${CORE_PLUGIN}" (pack install)`);
  }
  if (m.workspace_id !== void 0 && !WORKSPACE_ID.test(m.workspace_id)) {
    err('.kai/manifest.json "workspace_id" must be a stable UUID or UUID-like identifier');
  }
  if (m.storage_mode !== void 0 && !STORAGE_MODES.has(m.storage_mode)) {
    err(`.kai/manifest.json "storage_mode" must be "external", "repo-local", or "shared" (found ${JSON.stringify(m.storage_mode)})`);
  }
  if (["repo-local", "shared"].includes(m.storage_mode) && m.workspace_root !== ".") {
    err(`.kai/manifest.json ${m.storage_mode} "workspace_root" must be "."`);
  }
  if (m.storage_mode === "external") {
    if (!isAbsolute2(m.workspace_root || "")) {
      err('.kai/manifest.json external "workspace_root" must be absolute');
    } else if (normalized(m.workspace_root) !== normalized(root)) {
      err(`.kai/manifest.json external "workspace_root" resolves to "${resolve(m.workspace_root)}", not "${root}"`);
    }
  }
  if (Number.isInteger(m.schema_version) && m.schema_version >= CURRENT_SCHEMA_VERSION && !Array.isArray(m.areas)) {
    err('.kai/manifest.json "areas" must be an array');
  } else if (Array.isArray(m.areas)) {
    const a = new Set(m.areas);
    if (a.size !== m.areas.length) err('.kai/manifest.json "areas" must not contain duplicates');
    for (const x of a) if (!CANONICAL_AREAS.has(x)) err(`.kai/manifest.json declares unknown run area "${x}"`);
    for (const x of CANONICAL_AREAS) if (!a.has(x)) err(`.kai/manifest.json is missing run area "${x}"`);
  }
  const sv = m.schema_version;
  if (sv === void 0 || sv === 0) {
    migrations.push(`schema_version absent \u2192 migrate to ${CURRENT_SCHEMA_VERSION} (add schema_version, reconcile fixed roots/areas, drop retired fields).`);
    migrations.push(`apply migration step \u2192 ${CURRENT_CONTRACT_VERSION} (explicit offline migration into the coordination store; schema ${CURRENT_SCHEMA_VERSION} alone is inspect-only).`);
    err(`workspace schema is pre-versioned; migration to schema_version ${CURRENT_CONTRACT_VERSION} required before claiming work.`);
  } else if (!Number.isInteger(sv)) {
    err(`.kai/manifest.json "schema_version" must be an integer (found ${JSON.stringify(sv)}).`);
  } else if (sv < CURRENT_SCHEMA_VERSION) {
    for (let v = sv + 1; v <= CURRENT_SCHEMA_VERSION; v++) migrations.push(`apply migration step \u2192 ${v} (see kai-core-workspace-onboarding ladder).`);
    migrations.push(`apply migration step \u2192 ${CURRENT_CONTRACT_VERSION} (explicit offline migration into the coordination store; schema ${CURRENT_SCHEMA_VERSION} alone is inspect-only).`);
    err(`workspace schema_version ${sv} is behind the current contract ${CURRENT_CONTRACT_VERSION}; migration required before claiming work.`);
  } else if (sv > CURRENT_SCHEMA_VERSION) {
    err(`workspace schema_version ${sv} is newer than this plugin's contract ${CURRENT_CONTRACT_VERSION}; update kai-core before claiming work.`);
  }
  if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION) {
    for (const retired of RETIRED_SCHEMA_2_KEYS) {
      if (retired in m) err(`.kai/manifest.json still contains retired schema-2 key "${retired}"`);
    }
    const contractPaths = new Map([[".kai", "directory"], ...REQUIRED_SCHEMA_3_PATHS]);
    for (const [requiredPath, expectedType] of contractPaths) {
      const fullPath = join2(root, ...requiredPath.split("/"));
      if (!existsSync2(fullPath)) {
        err(`schema-3 workspace is missing required path "${requiredPath}"`);
      } else if (escapesRoot(root, fullPath)) {
        err(`schema-3 path "${requiredPath}" resolves outside the workspace through a symbolic link or junction`);
      } else if (expectedType === "file" && !lstatSync(fullPath).isFile() || expectedType === "directory" && !lstatSync(fullPath).isDirectory()) {
        err(`schema-3 path "${requiredPath}" must be a ${expectedType}`);
      }
    }
    for (const lane of Object.values(DEFAULT_ROOTS)) {
      const lanePath = join2(root, ...lane.split("/"));
      if (existsSync2(lanePath) && escapesRoot(root, lanePath)) {
        err(`schema-3 path "${lane}" resolves outside the workspace through a symbolic link or junction`);
      }
    }
    for (const legacyRoot of provenLegacyRoots(root)) {
      err(`schema-3 workspace still contains retired schema-2 root "${legacyRoot}"`);
    }
    const privateLanes = inspectPrivateLanes(root);
    for (const path of privateLanes.symbolicLinks) {
      err(`private workspace path "${path}" is a symbolic link or junction; private lanes must not redirect writes`);
    }
    for (const path of privateLanes.gitRoots) {
      err(`private workspace path "${path}" contains a nested Git repository`);
    }
    for (const detail of privateLanes.unreadable) {
      err(`private workspace path is unreadable: ${detail}`);
    }
  }
  const rootOf = (key) => {
    const v = m[key];
    return typeof v === "string" && v.trim() ? v.trim().replace(/\/+$/, "") : DEFAULT_ROOTS[key];
  };
  for (const key of Object.keys(DEFAULT_ROOTS)) {
    const declared = rootOf(key);
    if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION && m[key] !== DEFAULT_ROOTS[key]) {
      err(`.kai/manifest.json "${key}" must be exactly "${DEFAULT_ROOTS[key]}" (found ${JSON.stringify(m[key])}); the layout is a contract constant, not a per-workspace setting.`);
    }
  }
  const projectIds = /* @__PURE__ */ new Set();
  const projectPublicationRoots = /* @__PURE__ */ new Map();
  const projectRoots = /* @__PURE__ */ new Map();
  if (!Array.isArray(m.projects) || m.projects.length === 0) {
    if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION) {
      err('.kai/manifest.json "projects" must contain at least one project binding');
    }
  } else {
    for (const [index, project] of m.projects.entries()) {
      const prefix = `.kai/manifest.json projects[${index}]`;
      if (!project || typeof project !== "object") {
        err(`${prefix} must be an object`);
        continue;
      }
      if (!PROJECT_ID.test(project.id || "")) err(`${prefix}.id must be kebab-case`);
      else if (projectIds.has(project.id)) err(`${prefix}.id "${project.id}" is duplicated`);
      else projectIds.add(project.id);
      if (typeof project.path !== "string" || !project.path.trim()) {
        err(`${prefix}.path is required`);
      } else {
        const pathReason = !isAbsolute2(project.path) && project.path !== "." ? 'must be absolute or "."' : null;
        if (pathReason) err(`${prefix}.path ${pathReason}`);
        if (project.path === "." && m.storage_mode === "external") {
          err(`${prefix}.path cannot be "." for an external workspace`);
        }
        if (project.path !== "." && !isAbsolute2(project.path)) {
          err(`${prefix}.path must be absolute`);
        }
        if (project.path === "." && !["repo-local", "shared"].includes(m.storage_mode)) {
          err(`${prefix}.path "." is only valid for repo-local or shared storage`);
        }
      }
      const publicationReason = badPath(project.publication_root);
      const normalizedPublicationRoot = typeof project.publication_root === "string" ? project.publication_root.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "") : "";
      if (typeof project.publication_root !== "string" || !project.publication_root.trim()) {
        err(`${prefix}.publication_root is required`);
      } else if (publicationReason) {
        err(`${prefix}.publication_root is a ${publicationReason}`);
      } else if (normalizedPublicationRoot.toLowerCase() === ".kai" || normalizedPublicationRoot.toLowerCase().startsWith(".kai/")) {
        err(`${prefix}.publication_root must be outside .kai/`);
      } else if (PROJECT_ID.test(project.id || "")) {
        projectPublicationRoots.set(project.id, normalizedPublicationRoot);
      }
      if (typeof project.path === "string") {
        const projectRoot = resolvedProjectPath(root, project.path);
        if (PROJECT_ID.test(project.id || "")) projectRoots.set(project.id, projectRoot);
        if (!existsSync2(projectRoot)) err(`${prefix}.path does not exist: "${projectRoot}"`);
        if (m.storage_mode === "external" && existsSync2(projectRoot) && (!escapesRoot(root, projectRoot) || !escapesRoot(projectRoot, root))) {
          err(`${prefix}.path overlaps the external workspace root; external workspaces must remain outside their bound projects`);
        }
        const publicationRoot = resolve(projectRoot, project.publication_root || ".");
        const rel = relative2(projectRoot, publicationRoot);
        if (rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute2(rel)) {
          err(`${prefix}.publication_root escapes project "${project.id || index}"`);
        } else {
          const realProjectRoot = canonicalPath(projectRoot);
          const realPublicationRoot = canonicalPath(publicationRoot);
          const realRel = relative2(realProjectRoot, realPublicationRoot);
          if (realRel === ".." || realRel.startsWith(`..${sep}`) || isAbsolute2(realRel)) {
            err(`${prefix}.publication_root resolves outside project "${project.id || index}" through a symbolic link or junction`);
          }
        }
      }
    }
  }
  if (Number.isInteger(sv) && sv >= CURRENT_SCHEMA_VERSION) {
    checkGitMode(root, m.storage_mode, err, warn);
  }
  if (m.storage_mode === "external" && !options.allowUnregisteredExternal) {
    const registry = loadWorkspaceRegistry(options.env || process.env);
    if (!registry.ok) {
      err(registry.reason);
    } else {
      if (!registry.entries.some((entry) => entry.workspace_id === m.workspace_id)) {
        err(`external workspace is not registered in "${registry.path}"; run workspace-doctor --adopt <project-dir> --root "${root}"`);
      }
      for (const project of Array.isArray(m.projects) ? m.projects : []) {
        if (!project || typeof project !== "object" || typeof project.path !== "string") continue;
        const projectRoot = resolvedProjectPath(root, project.path);
        const matches = registry.entries.filter(
          (entry) => normalized(entry.project_root) === normalized(projectRoot)
        );
        if (matches.length !== 1) {
          err(`external project "${project.id}" has ${matches.length} registry bindings in "${registry.path}"; exactly one is required`);
          continue;
        }
        const [match] = matches;
        if (match.workspace_id !== m.workspace_id || normalized(match.workspace_root) !== normalized(root)) {
          err(`external project "${project.id}" is not paired with this workspace in "${registry.path}"`);
        }
      }
    }
  }
  const coordinationRoot = rootOf("state");
  const validateArtifactTarget = (target, label2, itemContract) => {
    const cleanTarget = unquote(target || "");
    const reason = badPath(cleanTarget);
    if (reason) {
      err(`${label2} is a ${reason}; use a private .kai/ path or project:<id>:<relative-path>`);
      return;
    }
    if (isNull(cleanTarget) || cleanTarget === "[]") return;
    const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/i.exec(cleanTarget);
    if (!projectTarget) {
      const privatePath = cleanTarget.replace(/\\/g, "/").replace(/^\.\//, "");
      if (!privatePath.startsWith(".kai/")) {
        err(`${label2} is an unqualified project path; public targets must use project:<id>:<relative-path>`);
        return;
      }
      const targetPath2 = resolve(root, ...privatePath.split("/"));
      if (escapesRoot(root, targetPath2)) {
        err(`${label2} resolves outside the workspace through a symbolic link or junction`);
      } else if (REQUIRES_EXISTING_ARTIFACTS.has(itemContract.state) && !existsSync2(targetPath2)) {
        err(`${label2} does not exist for item state "${itemContract.state}"`);
      }
      return;
    }
    const [, projectId, rawPublicPath] = projectTarget;
    if (!projectIds.has(projectId)) {
      err(`${label2} names unknown manifest project "${projectId}"`);
      return;
    }
    const publicPath = rawPublicPath.replace(/\\/g, "/").replace(/^\.\//, "");
    const publicationRoot = projectPublicationRoots.get(projectId);
    if (publicationRoot && publicPath !== publicationRoot && !publicPath.startsWith(`${publicationRoot}/`)) {
      err(`${label2} escapes project "${projectId}" publication_root "${publicationRoot}"`);
      return;
    }
    const projectRoot = projectRoots.get(projectId);
    if (!projectRoot) return;
    const targetPath = resolve(projectRoot, ...publicPath.split("/"));
    const realRel = relative2(canonicalPath(projectRoot), canonicalPath(targetPath));
    if (realRel === ".." || realRel.startsWith(`..${sep}`) || isAbsolute2(realRel)) {
      err(`${label2} resolves outside project "${projectId}" through a symbolic link or junction`);
      return;
    }
    if (!existsSync2(targetPath)) {
      if (REQUIRES_EXISTING_ARTIFACTS.has(itemContract.state)) {
        err(`${label2} does not exist for item state "${itemContract.state}"`);
      }
      return;
    }
    if (!targetPath.toLowerCase().endsWith(".md")) return;
    const assetFrontmatter = frontmatter(readFileSync2(targetPath, "utf8"));
    if (!assetFrontmatter) {
      err(`${label2} points to a published Markdown asset with no lifecycle frontmatter`);
      return;
    }
    const disposition = nestedScalar(assetFrontmatter, "disposition", "status");
    const verdict = nestedScalar(assetFrontmatter, "completion", "verdict");
    const revision = scalar(assetFrontmatter, "revision");
    const acceptedRevision = nestedScalar(assetFrontmatter, "completion", "revision_at_verdict");
    const validity = nestedScalar(assetFrontmatter, "validity", "status");
    const requiredMetadata = /* @__PURE__ */ new Map([
      ["asset_id", scalar(assetFrontmatter, "asset_id")],
      ["asset_class", scalar(assetFrontmatter, "asset_class")],
      ["item", scalar(assetFrontmatter, "item")],
      ["produced_by", scalar(assetFrontmatter, "produced_by")],
      ["created", scalar(assetFrontmatter, "created")],
      ["revision", revision],
      ["disposition.status", disposition],
      ["completion.authority", nestedScalar(assetFrontmatter, "completion", "authority")],
      ["completion.verdict", verdict],
      ["validity.status", validity],
      ["validity.owner", nestedScalar(assetFrontmatter, "validity", "owner")]
    ]);
    const missingMetadata = [...requiredMetadata].filter(([, value]) => isNull(value)).map(([key]) => key);
    if (missingMetadata.length) {
      err(`${label2} points to a published Markdown asset missing lifecycle metadata: ${missingMetadata.join(", ")}`);
    }
    const assetItem = scalar(assetFrontmatter, "item");
    if (!isNull(assetItem) && assetItem !== itemContract.id) {
      err(`${label2} points to a project asset owned by item "${assetItem}", not "${itemContract.id}"`);
    }
    const assetClass = scalar(assetFrontmatter, "asset_class");
    const completionAuthority = nestedScalar(assetFrontmatter, "completion", "authority");
    const validityOwner = nestedScalar(assetFrontmatter, "validity", "owner");
    for (const [field, declared, actual] of [
      ["asset_class", itemContract.artifactClass, assetClass],
      ["completion.authority", itemContract.completionAuthority, completionAuthority],
      ["validity.owner", itemContract.validityOwner, validityOwner]
    ]) {
      if (isNull(declared)) {
        err(`${label2} cannot validate published asset ${field} because the work item declaration is missing`);
      } else if (actual !== declared) {
        err(`${label2} published asset ${field} "${actual}" does not match work item declaration "${declared}"`);
      }
    }
    if (!isNull(completionAuthority) && completionAuthority === scalar(assetFrontmatter, "produced_by")) {
      err(`${label2} points to a project asset accepted by its own producer "${completionAuthority}"`);
    }
    if (disposition !== "published" || verdict !== "accepted") {
      err(`${label2} points to a project asset that is not accepted and published`);
    }
    if (validity !== "current") {
      err(`${label2} points to a project asset whose validity is not current`);
    }
    if (isNull(revision) || acceptedRevision !== revision) {
      err(`${label2} points to a project asset whose accepted revision does not match its current revision`);
    }
  };
  const itemsDir = join2(root, ...coordinationRoot.split("/"), "items");
  const itemIds = /* @__PURE__ */ new Set();
  const deps = /* @__PURE__ */ new Map();
  if (existsSync2(itemsDir) && lstatSync(itemsDir).isDirectory()) {
    const files = readdirSync2(itemsDir).filter((f) => f.endsWith(".md") && f !== "README.md");
    for (const f of files) {
      const id = basename(f, ".md");
      const rel = `${coordinationRoot}/items/${f}`.replace(/\\/g, "/");
      const fm = frontmatter(readFileSync2(join2(itemsDir, f), "utf8"));
      if (!fm) {
        err(`${rel}: missing YAML frontmatter`);
        continue;
      }
      itemIds.add(id);
      if (scalar(fm, "type") !== "work-item") err(`${rel}: frontmatter "type" must be "work-item"`);
      const fid = scalar(fm, "id");
      if (fid !== id) err(`${rel}: frontmatter id "${fid}" must equal filename id "${id}"`);
      const state = scalar(fm, "state");
      if (!LIFECYCLE.has(state)) err(`${rel}: invalid lifecycle state "${state}"`);
      const changeRef = scalar(fm, "change_ref");
      if (NEEDS_CHANGE_REF.has(state) && isNull(changeRef)) {
        err(`${rel}: state "${state}" requires a non-null change_ref`);
      }
      if (!isNull(changeRef) && !/^[0-9a-f]{7,40}$/i.test(changeRef)) {
        err(`${rel}: change_ref "${changeRef}" must be a git commit/PR-head SHA (7\u201340 hex chars); bespoke diff hashes are not allowed`);
      }
      const ver = scalar(fm, "version");
      if (!/^\d+$/.test(ver ?? "")) err(`${rel}: "version" must be an integer (found ${JSON.stringify(ver)})`);
      const lz = lease(fm);
      if (!isNull(lz.holder)) {
        if (isNull(lz.expires)) {
          err(`${rel}: lease held by ${lz.holder} but has no expiry`);
        }
        if (isNull(lz.token)) {
          err(`${rel}: lease held by ${lz.holder} but has no token (a held lease must carry a unique grant token \u2014 see kai-core-work-granting "Claiming work safely")`);
        }
        if (isNull(lz.versionAtGrant)) {
          err(`${rel}: lease held by ${lz.holder} but has no version_at_grant (the grant must be bound to the item version it was issued against)`);
        } else if (!/^\d+$/.test(lz.versionAtGrant)) {
          err(`${rel}: lease version_at_grant must be an integer (found ${JSON.stringify(lz.versionAtGrant)})`);
        } else if (/^\d+$/.test(ver ?? "") && Number(lz.versionAtGrant) >= Number(ver)) {
          err(`${rel}: lease version_at_grant ${lz.versionAtGrant} must be strictly less than the item version ${ver} \u2014 granting increments the version, so version_at_grant >= version signals a grant that skipped the increment (a racy or tampered lease)`);
        }
      }
      if (!isNull(lz.expires)) {
        const ts = parseStamp(lz.expires);
        if (ts === null) {
          warn(`${rel}: lease expires "${lz.expires}" is not a recognizable timestamp`);
        } else if (ts < Date.now()) {
          warn(`${rel}: lease expired at ${lz.expires} (stale-work recovery signal; the director should reconcile before reclaiming)`);
        }
      }
      const itemContract = {
        id,
        state,
        artifactClass: scalar(fm, "artifact_class"),
        completionAuthority: scalar(fm, "completion_authority"),
        validityOwner: scalar(fm, "validity_owner")
      };
      for (const key of ["artifact_target"]) {
        const target = scalar(fm, key);
        validateArtifactTarget(target, `${rel}: ${key}`, itemContract);
      }
      for (const target of listBlock(fm, "artifact_targets")) {
        validateArtifactTarget(target, `${rel}: artifact_targets entry "${target}"`, itemContract);
      }
      const dlist = dependsOn(fm);
      for (const d of dlist) {
        if (isNull(d.requires)) warn(`${rel}: depends_on "${d.item}" has no required upstream state`);
        else if (!REQUIRES_STATES.has(d.requires)) err(`${rel}: depends_on "${d.item}" has invalid requires "${d.requires}" (expected in-review|completed|release-ready|shipped)`);
      }
      deps.set(id, dlist.map((d) => d.item));
    }
  }
  for (const [id, list] of deps) {
    for (const d of list) if (!itemIds.has(d)) err(`${coordinationRoot}/items/${id}.md: depends_on references unknown item "${d}"`);
  }
  const cycle = findCycle(deps);
  if (cycle) err(`coordination dependency cycle: ${cycle.join(" -> ")}`);
  const boardPath = join2(root, ...coordinationRoot.split("/"), "BOARD.md");
  if (existsSync2(boardPath) && lstatSync(boardPath).isFile() && itemIds.size > 0) {
    const board = readFileSync2(boardPath, "utf8");
    const rowIds = new Set(
      [...board.matchAll(/^\|\s*([a-z][a-z0-9-]+)\s*\|/gm)].map((x) => x[1]).filter((x) => x !== "id")
    );
    for (const id of itemIds) if (!rowIds.has(id)) warn(`${coordinationRoot}/BOARD.md is missing a row for item "${id}" (derived index is stale)`);
    for (const id of rowIds) if (!itemIds.has(id)) warn(`${coordinationRoot}/BOARD.md row "${id}" has no item record (derived index is stale)`);
  } else if (!existsSync2(boardPath) && itemIds.size > 0) {
    warn(`${coordinationRoot}/BOARD.md is absent though coordination items exist (derived index missing)`);
  }
  return { errors, warnings, migrations };
}
function findCycle(deps) {
  const WHITE = 0, GRAY = 1, BLACK = 2;
  const color = /* @__PURE__ */ new Map();
  const stack = [];
  let found = null;
  const visit = (n) => {
    if (found) return;
    color.set(n, GRAY);
    stack.push(n);
    for (const d of deps.get(n) || []) {
      if (!deps.has(d)) continue;
      const c = color.get(d) || WHITE;
      if (c === GRAY) {
        found = [...stack.slice(stack.indexOf(d)), d];
        return;
      }
      if (c === WHITE) {
        visit(d);
        if (found) return;
      }
    }
    color.set(n, BLACK);
    stack.pop();
  };
  for (const n of deps.keys()) if ((color.get(n) || WHITE) === WHITE) {
    visit(n);
    if (found) break;
  }
  return found;
}
function report(root, res) {
  const rel = root === process.cwd() ? "." : root;
  for (const m of res.migrations) console.log(`  \u2191 migration: ${m}`);
  for (const w of res.warnings) console.log(`  ! ${w}`);
  for (const e of res.errors) console.log(`  \u2717 ${e}`);
  if (res.errors.length === 0) {
    console.log(`\u2713 workspace healthy \u2014 claimable (${rel})${res.warnings.length ? ` \u2014 ${res.warnings.length} warning(s)` : ""}`);
    return 0;
  }
  console.log(`\u2717 workspace not claimable: ${res.errors.length} error(s)${res.migrations.length ? `, migration required` : ""} (${rel})`);
  return 1;
}
var SEVERITY_MARK = { refusal: "\u2717", unverified: "?", note: "\u2713" };
var VERDICT = {
  clear: "\u2713 clear \u2014 no legacy/pack conflict on this host; a pack install may proceed",
  blocked: "\u2717 blocked \u2014 do NOT install packs here until the steps above are done and re-checked",
  unknown: "? unknown \u2014 the install state could not be verified, so it is NOT treated as clear"
};
var migrationExitCode = (status) => status === "clear" ? 0 : status === "blocked" ? 2 : 3;
var terminalText = (value) => String(value).replace(/[\x00-\x1f\x7f-\x9f\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, "?");
var jsonText = (value) => JSON.stringify(value, null, 2).replace(/[\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
function migrationInventory(report2) {
  if (!report2.host?.records) return [];
  return [...report2.host.records.values()].map((record) => {
    const enabledStates = record.entries.map((entry) => entry.enabled);
    const enabled = enabledStates.length && enabledStates.every((state) => state === true) ? true : enabledStates.some((state) => state === false) ? false : null;
    return {
      name: record.name,
      presence: record.presence,
      versions: [...new Set(record.entries.map((entry) => entry.version).filter(Boolean))].sort(),
      enabled,
      provenances: [...record.provenances].sort()
    };
  }).sort((left, right) => left.name.localeCompare(right.name));
}
function reportRegistry({ env, json = false }) {
  const registry = loadWorkspaceRegistry(env);
  if (!registry.ok) {
    console.error(`workspace registry: ${registry.reason}`);
    return 1;
  }
  if (json) {
    console.log(jsonText({
      path: registry.path,
      kai_home: defaultKaiHome(env),
      workspaces: registry.entries
    }));
    return 0;
  }
  console.log(`kai workspace registry \u2014 ${registry.path}`);
  if (!registry.entries.length) {
    console.log("  (empty)");
    return 0;
  }
  for (const entry of registry.entries) {
    console.log(`  ${entry.project_root} -> ${entry.workspace_root} (${entry.workspace_id})`);
  }
  return 0;
}
function reportMigration({ home, root, json = false, rollback = false }) {
  const res = migrationReport({ home, root, rollback });
  if (json) {
    const output = {
      status: res.status,
      codes: res.codes,
      home: res.home,
      root: res.root,
      rollback: res.rollback,
      findings: res.findings,
      steps: res.steps,
      notices: res.notices,
      workspace: res.workspace,
      plugins: migrationInventory(res)
    };
    console.log(jsonText(output));
    return migrationExitCode(res.status);
  }
  console.log(`kai migration doctor (read-only) \u2014 host ${terminalText(res.home)}`);
  console.log(`  workspace ${terminalText(root ?? "(not inspected)")}
`);
  for (const f of res.findings) console.log(`  ${SEVERITY_MARK[f.severity]} ${terminalText(f.message)}`);
  if (res.steps.length) {
    console.log("\n  remediation \u2014 run these yourself; this check changed nothing:");
    res.steps.forEach((s, i) => console.log(`    ${i + 1}. ${terminalText(s)}`));
  }
  for (const n of res.notices) console.log(`
  ! ${terminalText(n)}`);
  console.log(`
${VERDICT[res.status]}`);
  return migrationExitCode(res.status);
}
var registryWait = new Int32Array(new SharedArrayBuffer(4));
function processIsAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch (error) {
    return error.code !== "ESRCH";
  }
}
function recoverDeadRegistryLock(lockPath) {
  let owner;
  try {
    owner = JSON.parse(readFileSync2(lockPath, "utf8"));
  } catch {
    return false;
  }
  if (typeof owner.token !== "string" || processIsAlive(owner.pid)) return false;
  const claimPath = `${lockPath}.reclaim-${owner.token.replace(/[^a-z0-9.-]/gi, "_")}`;
  let claim;
  try {
    claim = openSync(claimPath, "wx");
  } catch {
    return false;
  }
  try {
    let current;
    try {
      current = JSON.parse(readFileSync2(lockPath, "utf8"));
    } catch {
      return false;
    }
    if (current.token !== owner.token || processIsAlive(current.pid)) return false;
    unlinkSync(lockPath);
    return true;
  } catch {
    return false;
  } finally {
    closeSync(claim);
    rmSync(claimPath, { force: true });
  }
}
function withRegistryLock(env, action) {
  const path = registryPath(env);
  const lockPath = `${path}.lock`;
  const ownerToken = `${process.pid}:${randomUUID()}`;
  mkdirSync(dirname2(path), { recursive: true });
  const deadline = Date.now() + 5e3;
  let lock;
  while (Date.now() < deadline) {
    try {
      lock = openSync(lockPath, "wx");
      writeFileSync(lock, `${JSON.stringify({ pid: process.pid, token: ownerToken })}
`);
      break;
    } catch (error) {
      if (error.code !== "EEXIST") return { ok: false, reason: `cannot lock workspace registry: ${error.message}` };
      if (recoverDeadRegistryLock(lockPath)) continue;
      Atomics.wait(registryWait, 0, 0, 50);
    }
  }
  if (lock === void 0) return { ok: false, reason: `workspace registry is busy: ${lockPath}` };
  try {
    return action();
  } finally {
    closeSync(lock);
    try {
      const currentOwner = JSON.parse(readFileSync2(lockPath, "utf8"));
      if (currentOwner.token === ownerToken) unlinkSync(lockPath);
    } catch {
    }
  }
}
function writeRegistryUnlocked(entries, env = process.env) {
  const path = registryPath(env);
  mkdirSync(dirname2(path), { recursive: true });
  const next = `${path}.${process.pid}.${randomUUID()}.tmp`;
  const body = { schema_version: 1, workspaces: entries };
  writeFileSync(next, `${JSON.stringify(body, null, 2)}
`);
  const deadline = Date.now() + 2e3;
  try {
    while (true) {
      try {
        renameSync(next, path);
        return path;
      } catch (error) {
        if (!["EPERM", "EACCES", "EBUSY"].includes(error.code) || Date.now() >= deadline) throw error;
        sleepSync(25);
      }
    }
  } finally {
    if (existsSync2(next)) rmSync(next, { force: true });
  }
}
function writeRegistry(entries, env = process.env) {
  return withRegistryLock(env, () => ({ ok: true, path: writeRegistryUnlocked(entries, env) }));
}
function sleepSync(milliseconds) {
  Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, milliseconds);
}
function adoptWorkspace({ root, projectRoot, env = process.env }) {
  root = resolve(root);
  projectRoot = resolve(projectRoot);
  const checked = checkWorkspace(root, { allowUnregisteredExternal: true });
  if (checked.errors.length) {
    return { ok: false, reason: `workspace is invalid: ${checked.errors[0]}` };
  }
  const manifest = readWorkspaceManifest(root).manifest;
  if (manifest.storage_mode !== "external") {
    return { ok: false, reason: "only external workspaces need machine-local registry adoption" };
  }
  const project = manifest.projects.find(
    (candidate) => normalized(resolvedProjectPath(root, candidate.path)) === normalized(projectRoot)
  );
  if (!project) {
    return { ok: false, reason: `manifest does not bind project "${projectRoot}"` };
  }
  return withRegistryLock(env, () => {
    const registry = loadWorkspaceRegistry(env);
    if (!registry.ok) return registry;
    const canonicalProjectRoot = canonicalPath(projectRoot);
    const canonicalWorkspaceRoot = canonicalPath(root);
    const retained = registry.entries.filter(
      (entry) => normalized(entry.project_root) !== normalized(canonicalProjectRoot)
    );
    retained.push({
      project_root: canonicalProjectRoot,
      workspace_root: canonicalWorkspaceRoot,
      workspace_id: manifest.workspace_id
    });
    retained.sort((left, right) => left.project_root.localeCompare(right.project_root));
    return { ok: true, path: writeRegistryUnlocked(retained, env) };
  });
}
function forgetWorkspace({ projectRoot, env = process.env }) {
  projectRoot = resolve(projectRoot);
  return withRegistryLock(env, () => {
    const registry = loadWorkspaceRegistry(env);
    if (!registry.ok) return registry;
    const retained = registry.entries.filter(
      (entry) => normalized(entry.project_root) !== normalized(projectRoot)
    );
    if (retained.length === registry.entries.length) {
      return { ok: false, reason: `project "${projectRoot}" is not registered` };
    }
    return { ok: true, path: writeRegistryUnlocked(retained, env) };
  });
}
function selfTest() {
  const fx = join2(REPO_ROOT, "test", "fixtures");
  let failed = 0;
  const ok = (condition, message, details = []) => {
    if (condition) console.log(`\u2713 self-test: ${message}`);
    else {
      failed++;
      console.log(`\u2717 self-test: ${message}`);
      details.forEach((detail) => console.log(`    ${detail}`));
    }
  };
  const good = checkWorkspace(join2(fx, "repo-workspace"));
  ok(good.errors.length === 0, "healthy schema-3 shared fixture passes", good.errors);
  const bad = checkWorkspace(join2(fx, "broken-workspace"));
  const badText = bad.errors.join("\n");
  ok(
    /migration .*required/i.test(badText) && /requires a non-null change_ref/i.test(badText) && /unknown item/i.test(badText),
    "broken fixture reports migration, item, and dependency failures",
    bad.errors
  );
  const concurrency = checkWorkspace(join2(fx, "concurrency-workspace"));
  const concurrencyText = concurrency.errors.join("\n");
  ok(
    /has no token/i.test(concurrencyText) && /has no version_at_grant/i.test(concurrencyText) && /strictly less/i.test(concurrencyText) && /stale-work recovery signal/i.test(concurrency.warnings.join("\n")),
    "coordination lease integrity still fails closed",
    [...concurrency.errors, ...concurrency.warnings]
  );
  const example = checkWorkspace(join2(REPO_ROOT, "examples", "e2e-feature-delivery"));
  ok(example.errors.length === 0, "end-to-end schema-3 example is claimable", example.errors);
  const publicationTemplates = ["decision.md", "spec.md", "report.md"].map((name) => ({
    name,
    fm: frontmatter(readFileSync2(join2(REPO_ROOT, "plugins", "kai-core", "templates", "publication", name), "utf8"))
  }));
  ok(
    publicationTemplates.every(({ fm }) => fm && scalar(fm, "item") === "<work-item-id>"),
    "publication templates declare the owning work item",
    publicationTemplates.filter(({ fm }) => !fm || scalar(fm, "item") !== "<work-item-id>").map(({ name }) => name)
  );
  const tmpRoot = mkdtempSync(join2(tmpdir(), "kai-schema3-"));
  try {
    const publicationWorkspace = join2(tmpRoot, "publication-workspace");
    cpSync(join2(fx, "repo-workspace"), publicationWorkspace, { recursive: true });
    const publicationItem = join2(publicationWorkspace, ".kai", "state", "items", "sample-api.md");
    const originalItem = readFileSync2(publicationItem, "utf8");
    const publicationItemText = (target) => originalItem.replace(
      "artifact_target: null",
      [
        "artifact_expectation: owed",
        "artifact_class: design",
        "completion_authority: principal-product-manager",
        "validity_owner: principal-swe-architect",
        `artifact_target: ${target}`
      ].join("\n")
    );
    writeFileSync(
      publicationItem,
      publicationItemText("project:fixture:docs/kai/reports/sample-api.md")
    );
    const missingPublication = checkWorkspace(publicationWorkspace);
    ok(
      /does not exist for item state "in-review"/i.test(missingPublication.errors.join("\n")),
      "review-stage items cannot claim missing published targets",
      missingPublication.errors
    );
    const publishedAsset = join2(publicationWorkspace, "docs", "kai", "reports", "sample-api.md");
    mkdirSync(dirname2(publishedAsset), { recursive: true });
    writeFileSync(publishedAsset, [
      "---",
      "asset_id: sample-api",
      "asset_class: design",
      "item: sample-api",
      "produced_by: principal-swe-architect",
      "created: 2026-08-31",
      "revision: 2",
      "disposition:",
      "  status: published",
      "completion:",
      "  authority: principal-product-manager",
      "  verdict: pending",
      "  revision_at_verdict: 1",
      "validity:",
      "  status: provisional",
      "  owner: principal-swe-architect",
      "---",
      "",
      "# Sample API",
      ""
    ].join("\n"));
    const unacceptedPublication = checkWorkspace(publicationWorkspace);
    ok(
      /not accepted and published|accepted revision does not match/i.test(unacceptedPublication.errors.join("\n")),
      "a public target is rejected until its current revision is accepted",
      unacceptedPublication.errors
    );
    writeFileSync(publishedAsset, [
      "---",
      "asset_id: sample-api",
      "asset_class: design",
      "item: sample-api",
      "produced_by: principal-swe-architect",
      "created: 2026-08-31",
      "revision: 2",
      "disposition:",
      "  status: published",
      "completion:",
      "  authority: principal-product-manager",
      "  verdict: accepted",
      "  revision_at_verdict: 2",
      "validity:",
      "  status: current",
      "  owner: principal-swe-architect",
      "---",
      "",
      "# Sample API",
      ""
    ].join("\n"));
    const acceptedPublication = checkWorkspace(publicationWorkspace);
    ok(
      acceptedPublication.errors.length === 0,
      "an accepted current project-qualified revision remains claimable",
      acceptedPublication.errors
    );
    writeFileSync(publishedAsset, readFileSync2(publishedAsset, "utf8").replace(
      "item: sample-api",
      "item: another-item"
    ));
    const mismatchedAssetItem = checkWorkspace(publicationWorkspace);
    ok(
      /owned by item "another-item", not "sample-api"/i.test(mismatchedAssetItem.errors.join("\n")),
      "a published asset remains bound to the item that claims it",
      mismatchedAssetItem.errors
    );
    writeFileSync(publishedAsset, readFileSync2(publishedAsset, "utf8").replace(
      "item: another-item",
      "item: sample-api"
    ));
    writeFileSync(publishedAsset, readFileSync2(publishedAsset, "utf8").replace(
      "  authority: principal-product-manager",
      "  authority: principal-swe-architect"
    ));
    const mismatchedAuthority = checkWorkspace(publicationWorkspace);
    ok(
      /completion\.authority .* does not match work item declaration/i.test(mismatchedAuthority.errors.join("\n")),
      "published acceptance must come from the work item declared authority",
      mismatchedAuthority.errors
    );
    writeFileSync(publishedAsset, readFileSync2(publishedAsset, "utf8").replace(
      "  authority: principal-swe-architect",
      "  authority: principal-product-manager"
    ));
    writeFileSync(publishedAsset, readFileSync2(publishedAsset, "utf8").replace(
      "  status: current",
      "  status: invalidated"
    ));
    const invalidatedPublication = checkWorkspace(publicationWorkspace);
    ok(
      /validity is not current/i.test(invalidatedPublication.errors.join("\n")),
      "an invalidated public revision is no longer claimable",
      invalidatedPublication.errors
    );
    writeFileSync(publishedAsset, readFileSync2(publishedAsset, "utf8").replace(
      "  status: invalidated",
      "  status: current"
    ));
    writeFileSync(
      publicationItem,
      publicationItemText("project:fixture:reports/sample-api.md")
    );
    const escapedPublication = checkWorkspace(publicationWorkspace);
    ok(
      /escapes project .* publication_root/i.test(escapedPublication.errors.join("\n")),
      "project-qualified artifact targets cannot bypass the configured publication root",
      escapedPublication.errors
    );
    writeFileSync(
      publicationItem,
      publicationItemText("docs/kai/reports/sample-api.md")
    );
    const unqualifiedPublication = checkWorkspace(publicationWorkspace);
    ok(
      /unqualified project path/i.test(unqualifiedPublication.errors.join("\n")),
      "public artifact targets cannot bypass project qualification",
      unqualifiedPublication.errors
    );
    const preInitWorkspace = join2(tmpRoot, "pre-init-schema4-workspace");
    cpSync(join2(fx, "repo-workspace"), preInitWorkspace, { recursive: true });
    const preInitManifestPath = join2(preInitWorkspace, ".kai", "manifest.json");
    writeFileSync(preInitManifestPath, `${JSON.stringify({
      ...JSON.parse(readFileSync2(preInitManifestPath, "utf8")),
      schema_version: 4
    }, null, 2)}
`);
    const preInitInspect = checkWorkspace(preInitWorkspace, { intent: "inspect" });
    ok(
      preInitInspect.errors.length === 0 && /coordination database does not exist yet/i.test(preInitInspect.warnings.join("\n")),
      "a scaffolded schema-4 workspace with no store is an inspect condition, not an error",
      [
        ...preInitInspect.errors.map((e) => `error: ${e}`),
        ...preInitInspect.warnings.map((w) => `warning: ${w}`)
      ]
    );
    const preInitCoordinate = checkWorkspace(preInitWorkspace, { intent: "coordinate" });
    ok(
      preInitCoordinate.errors.some((e) => /coordination database is missing/i.test(e)),
      "coordinated writes still refuse a schema-4 workspace with no store",
      preInitCoordinate.errors
    );
    const incompleteWorkspace = join2(tmpRoot, "incomplete-workspace");
    cpSync(join2(fx, "repo-workspace"), incompleteWorkspace, { recursive: true });
    rmSync(join2(incompleteWorkspace, ".kai", "CONVENTIONS.md"));
    mkdirSync(join2(incompleteWorkspace, "kai", "personal"), { recursive: true });
    writeFileSync(join2(incompleteWorkspace, "kai", "personal", "inbox.md"), "# Legacy inbox\n");
    mkdirSync(join2(incompleteWorkspace, "kai", "initiatives", "orphaned"), { recursive: true });
    writeFileSync(join2(incompleteWorkspace, "kai", "initiatives", "orphaned", "northstar.md"), "# Legacy initiative\n");
    const incomplete = checkWorkspace(incompleteWorkspace);
    ok(
      /missing required path ".kai\/CONVENTIONS.md"/i.test(incomplete.errors.join("\n")) && /retired schema-2 root "kai\/personal"/i.test(incomplete.errors.join("\n")) && /retired schema-2 root "kai\/initiatives"/i.test(incomplete.errors.join("\n")),
      "schema-3 validation rejects incomplete and split-brain layouts",
      incomplete.errors
    );
    const malformedWorkspace = join2(tmpRoot, "malformed-workspace");
    cpSync(join2(fx, "repo-workspace"), malformedWorkspace, { recursive: true });
    const malformedManifestPath = join2(malformedWorkspace, ".kai", "manifest.json");
    const malformedManifest = JSON.parse(readFileSync2(malformedManifestPath, "utf8"));
    malformedManifest.state = null;
    malformedManifest.areas = {};
    writeFileSync(malformedManifestPath, `${JSON.stringify(malformedManifest, null, 2)}
`);
    rmSync(join2(malformedWorkspace, ".kai", "state", "items"), { recursive: true });
    writeFileSync(join2(malformedWorkspace, ".kai", "state", "items"), "not a directory\n");
    const malformed = checkWorkspace(malformedWorkspace);
    ok(
      /"state" must be exactly ".kai\/state"/i.test(malformed.errors.join("\n")) && /"areas" must be an array/i.test(malformed.errors.join("\n")) && /path ".kai\/state\/items" must be a directory/i.test(malformed.errors.join("\n")),
      "malformed schema-3 roots and path types fail as validation errors",
      malformed.errors
    );
    const scalarManifestWorkspace = join2(tmpRoot, "scalar-manifest-workspace");
    cpSync(join2(fx, "repo-workspace"), scalarManifestWorkspace, { recursive: true });
    writeFileSync(join2(scalarManifestWorkspace, ".kai", "manifest.json"), "null\n");
    const scalarManifest = checkWorkspace(scalarManifestWorkspace);
    ok(
      /manifest\.json must contain a JSON object/i.test(scalarManifest.errors.join("\n")),
      "valid JSON scalars fail as manifest validation errors",
      scalarManifest.errors
    );
    const scalarManifestProject = join2(tmpRoot, "scalar-manifest-project");
    const scalarManifestEnv = { KAI_HOME: join2(tmpRoot, "scalar-manifest-home") };
    mkdirSync(scalarManifestProject, { recursive: true });
    writeRegistry([{
      project_root: scalarManifestProject,
      workspace_root: scalarManifestWorkspace,
      workspace_id: "scalar-manifest-workspace"
    }], scalarManifestEnv);
    const scalarResolution = resolveWorkspaceRoot({ cwd: scalarManifestProject, env: scalarManifestEnv });
    ok(
      !scalarResolution.ok && /must contain a JSON object/i.test(scalarResolution.reason),
      "registry discovery rejects scalar external manifests without throwing",
      [scalarResolution.reason]
    );
    const malformedExternalWorkspace = join2(tmpRoot, "malformed-external-workspace");
    cpSync(join2(fx, "external-workspace"), malformedExternalWorkspace, { recursive: true });
    const malformedExternalManifestPath = join2(malformedExternalWorkspace, ".kai", "manifest.json");
    const malformedExternalManifest = JSON.parse(readFileSync2(malformedExternalManifestPath, "utf8"));
    malformedExternalManifest.workspace_root = malformedExternalWorkspace;
    malformedExternalManifest.projects = [null];
    writeFileSync(malformedExternalManifestPath, `${JSON.stringify(malformedExternalManifest, null, 2)}
`);
    const malformedExternal = checkWorkspace(malformedExternalWorkspace, {
      env: { KAI_HOME: join2(tmpRoot, "malformed-external-home") }
    });
    ok(
      /projects\[0\] must be an object/i.test(malformedExternal.errors.join("\n")),
      "malformed external project entries fail without crashing registry validation",
      malformedExternal.errors
    );
    const repoLocalWorkspace = join2(tmpRoot, "repo-local-workspace");
    cpSync(join2(fx, "repo-workspace"), repoLocalWorkspace, { recursive: true });
    const repoLocalManifestPath = join2(repoLocalWorkspace, ".kai", "manifest.json");
    const repoLocalManifest = JSON.parse(readFileSync2(repoLocalManifestPath, "utf8"));
    repoLocalManifest.storage_mode = "repo-local";
    writeFileSync(repoLocalManifestPath, `${JSON.stringify(repoLocalManifest, null, 2)}
`);
    writeFileSync(join2(repoLocalWorkspace, ".gitignore"), [
      "!/.kai/",
      "!/.kai/**",
      "/.kai/manifest.json",
      "/.kai/state/BOARD.md",
      ""
    ].join("\n"));
    spawnSync("git", ["init", "--quiet", repoLocalWorkspace], { encoding: "utf8", windowsHide: true });
    const partiallyIgnored = checkWorkspace(repoLocalWorkspace);
    ok(
      /requires the entire \.kai\/ directory to be ignored/i.test(partiallyIgnored.errors.join("\n")),
      "repo-local mode rejects sentinel-only ignore rules",
      partiallyIgnored.errors
    );
    writeFileSync(join2(repoLocalWorkspace, ".gitignore"), "/.kai/\n");
    const fullyIgnored = checkWorkspace(repoLocalWorkspace);
    ok(
      fullyIgnored.errors.length === 0,
      "repo-local mode accepts a fully ignored private workspace",
      fullyIgnored.errors
    );
    const privateTargetWorkspace = join2(tmpRoot, "private-target-workspace");
    const outsidePrivateTarget = join2(tmpRoot, "outside-private-target");
    cpSync(join2(fx, "repo-workspace"), privateTargetWorkspace, { recursive: true });
    mkdirSync(outsidePrivateTarget, { recursive: true });
    symlinkSync(outsidePrivateTarget, join2(privateTargetWorkspace, ".kai", "state", "escaped-artifacts"), "junction");
    const privateTargetItem = join2(privateTargetWorkspace, ".kai", "state", "items", "sample-api.md");
    writeFileSync(
      privateTargetItem,
      readFileSync2(privateTargetItem, "utf8").replace(
        "artifact_target: null",
        "artifact_target: .kai/state/escaped-artifacts/sample-api.md"
      )
    );
    const escapedPrivateTarget = checkWorkspace(privateTargetWorkspace);
    ok(
      /artifact_target resolves outside the workspace/i.test(escapedPrivateTarget.errors.join("\n")),
      "private artifact targets cannot escape through state-tree links",
      escapedPrivateTarget.errors
    );
    const linkedPrivateWorkspace = join2(tmpRoot, "linked-private-workspace");
    const outsidePrivateLane = join2(tmpRoot, "outside-private-lane");
    cpSync(join2(fx, "repo-workspace"), linkedPrivateWorkspace, { recursive: true });
    mkdirSync(outsidePrivateLane, { recursive: true });
    symlinkSync(outsidePrivateLane, join2(linkedPrivateWorkspace, ".kai", "runs"), "junction");
    const linkedPrivate = checkWorkspace(linkedPrivateWorkspace);
    ok(
      /schema-3 path ".kai\/runs" resolves outside the workspace/i.test(linkedPrivate.errors.join("\n")),
      "private lanes cannot escape the workspace through a symbolic link or junction",
      linkedPrivate.errors
    );
    const danglingPrivateWorkspace = join2(tmpRoot, "dangling-private-workspace");
    const removedPrivateTarget = join2(tmpRoot, "removed-private-target");
    cpSync(join2(fx, "repo-workspace"), danglingPrivateWorkspace, { recursive: true });
    mkdirSync(removedPrivateTarget, { recursive: true });
    symlinkSync(removedPrivateTarget, join2(danglingPrivateWorkspace, ".kai", "review"), "junction");
    rmSync(removedPrivateTarget, { recursive: true });
    const danglingPrivate = checkWorkspace(danglingPrivateWorkspace);
    ok(
      /private workspace path ".kai\/review" is a symbolic link or junction/i.test(danglingPrivate.errors.join("\n")),
      "dangling private-lane links fail closed",
      danglingPrivate.errors
    );
    const nestedGitWorkspace = join2(tmpRoot, "nested-git-workspace");
    cpSync(join2(fx, "repo-workspace"), nestedGitWorkspace, { recursive: true });
    mkdirSync(join2(nestedGitWorkspace, ".kai", "runs", "cloned-evidence", ".git"), { recursive: true });
    const nestedGit = checkWorkspace(nestedGitWorkspace);
    ok(
      /private workspace path .* contains a nested Git repository/i.test(nestedGit.errors.join("\n")),
      "private lanes cannot hide independently tracked Git repositories",
      nestedGit.errors
    );
    const privatePublicationWorkspace = join2(tmpRoot, "private-publication-workspace");
    cpSync(join2(fx, "repo-workspace"), privatePublicationWorkspace, { recursive: true });
    const privateManifestPath = join2(privatePublicationWorkspace, ".kai", "manifest.json");
    const privateManifest = JSON.parse(readFileSync2(privateManifestPath, "utf8"));
    privateManifest.projects[0].publication_root = "./.KaI";
    writeFileSync(privateManifestPath, `${JSON.stringify(privateManifest, null, 2)}
`);
    const privatePublication = checkWorkspace(privatePublicationWorkspace);
    ok(
      /publication_root must be outside .kai/i.test(privatePublication.errors.join("\n")),
      "publication_root cannot alias the private .kai control tree",
      privatePublication.errors
    );
    const linkedPublicationWorkspace = join2(tmpRoot, "linked-publication-workspace");
    const outsidePublication = join2(tmpRoot, "outside-publication");
    cpSync(join2(fx, "repo-workspace"), linkedPublicationWorkspace, { recursive: true });
    mkdirSync(outsidePublication, { recursive: true });
    symlinkSync(outsidePublication, join2(linkedPublicationWorkspace, "docs"), "junction");
    const linkedPublication = checkWorkspace(linkedPublicationWorkspace);
    ok(
      /symbolic link or junction/i.test(linkedPublication.errors.join("\n")),
      "publication_root cannot escape the project through a symbolic link or junction",
      linkedPublication.errors
    );
    const overlappingProjectRoot = join2(tmpRoot, "overlapping-project");
    const overlappingWorkspaceRoot = join2(overlappingProjectRoot, "external-workspace");
    mkdirSync(overlappingProjectRoot, { recursive: true });
    cpSync(join2(fx, "external-workspace"), overlappingWorkspaceRoot, { recursive: true });
    const overlappingManifestPath = join2(overlappingWorkspaceRoot, ".kai", "manifest.json");
    const overlappingManifest = JSON.parse(readFileSync2(overlappingManifestPath, "utf8"));
    overlappingManifest.workspace_root = overlappingWorkspaceRoot;
    overlappingManifest.projects[0].path = overlappingProjectRoot;
    writeFileSync(overlappingManifestPath, `${JSON.stringify(overlappingManifest, null, 2)}
`);
    const overlapping = checkWorkspace(overlappingWorkspaceRoot, { allowUnregisteredExternal: true });
    ok(
      /overlaps the external workspace root/i.test(overlapping.errors.join("\n")),
      "external workspaces cannot be nested in or contain their bound projects",
      overlapping.errors
    );
    const projectRoot = join2(tmpRoot, "project");
    const workspaceRoot = join2(tmpRoot, "workspace");
    mkdirSync(projectRoot, { recursive: true });
    cpSync(join2(fx, "external-workspace"), workspaceRoot, { recursive: true });
    const manifestPath = join2(workspaceRoot, ".kai", "manifest.json");
    const manifest = JSON.parse(readFileSync2(manifestPath, "utf8"));
    manifest.workspace_root = workspaceRoot;
    manifest.projects[0].path = projectRoot;
    writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}
`);
    const env = { KAI_HOME: join2(tmpRoot, "home") };
    const unregistered = checkWorkspace(workspaceRoot, { env });
    ok(
      /--adopt/i.test(unregistered.errors.join("\n")),
      "an external workspace is not claimable before registry adoption",
      unregistered.errors
    );
    const adopted = adoptWorkspace({ root: workspaceRoot, projectRoot, env });
    ok(adopted.ok, "external workspace adoption writes the machine-local registry", [adopted.reason]);
    const registered = checkWorkspace(workspaceRoot, { env });
    ok(registered.errors.length === 0, "adopted external workspace validates its registry pairing", registered.errors);
    if (adopted.ok) {
      const selfPath = fileURLToPath2(import.meta.url);
      const cliEnv = { ...process.env, ...env };
      const registryCli = spawnSync(
        process.execPath,
        [selfPath, "--registry", "--json", "--kai-home", env.KAI_HOME],
        { encoding: "utf8", env: cliEnv, windowsHide: true }
      );
      let registryJson = null;
      try {
        registryJson = JSON.parse(registryCli.stdout);
      } catch {
        registryJson = null;
      }
      ok(
        registryCli.status === 0 && registryJson?.workspaces?.length === 1,
        "the registry CLI reports populated JSON without crashing",
        [registryCli.stderr, registryCli.stdout].filter(Boolean)
      );
      const resolvedCli = spawnSync(
        process.execPath,
        [selfPath],
        { cwd: projectRoot, encoding: "utf8", env: cliEnv, windowsHide: true }
      );
      ok(
        resolvedCli.status === 0 && /workspace healthy/i.test(resolvedCli.stdout),
        "the default doctor resolves a registered external workspace from the project",
        [resolvedCli.stderr, resolvedCli.stdout].filter(Boolean)
      );
      const registeredEntries = loadWorkspaceRegistry(env).entries;
      writeRegistry([...registeredEntries, {
        project_root: registeredEntries[0].project_root,
        workspace_root: join2(tmpRoot, "duplicate-workspace"),
        workspace_id: "duplicate-workspace"
      }], env);
      const duplicateBinding = checkWorkspace(workspaceRoot, { env });
      ok(
        /exactly one is required/i.test(duplicateBinding.errors.join("\n")),
        "duplicate external project bindings fail closed",
        duplicateBinding.errors
      );
      writeRegistry(registeredEntries, env);
      const concurrentHome = join2(tmpRoot, "concurrent-home");
      const concurrentEnv = { ...process.env, KAI_HOME: concurrentHome };
      const concurrentProjects = ["alpha", "beta"].map((name) => {
        const concurrentProject = join2(tmpRoot, `concurrent-project-${name}`);
        const concurrentWorkspace = join2(tmpRoot, `concurrent-workspace-${name}`);
        mkdirSync(concurrentProject, { recursive: true });
        cpSync(join2(fx, "external-workspace"), concurrentWorkspace, { recursive: true });
        const concurrentManifestPath = join2(concurrentWorkspace, ".kai", "manifest.json");
        const concurrentManifest = JSON.parse(readFileSync2(concurrentManifestPath, "utf8"));
        concurrentManifest.workspace_id = `concurrent-workspace-${name}`;
        concurrentManifest.workspace_root = concurrentWorkspace;
        concurrentManifest.projects[0].id = name;
        concurrentManifest.projects[0].path = concurrentProject;
        writeFileSync(concurrentManifestPath, `${JSON.stringify(concurrentManifest, null, 2)}
`);
        return { project: concurrentProject, workspace: concurrentWorkspace };
      });
      const concurrentLogs = [];
      for (const candidate of concurrentProjects) {
        const logPath = `${candidate.workspace}.log`;
        const log = openSync(logPath, "w");
        spawn(
          process.execPath,
          [selfPath, "--adopt", candidate.project, "--root", candidate.workspace],
          { env: concurrentEnv, stdio: ["ignore", log, log], windowsHide: true }
        );
        closeSync(log);
        concurrentLogs.push(logPath);
      }
      const concurrentDeadline = Date.now() + 15e3;
      let concurrentRegistry = { ok: true, entries: [] };
      while (Date.now() < concurrentDeadline) {
        concurrentRegistry = loadWorkspaceRegistry({ KAI_HOME: concurrentHome });
        if (concurrentRegistry.ok && concurrentRegistry.entries.length === concurrentProjects.length) break;
        sleepSync(25);
      }
      ok(
        concurrentRegistry.ok && concurrentRegistry.entries.length === concurrentProjects.length,
        "concurrent registry adoption preserves every project binding",
        [
          ...concurrentRegistry.ok ? concurrentRegistry.entries.map((entry) => JSON.stringify(entry)) : [concurrentRegistry.reason],
          ...concurrentLogs.flatMap((path) => {
            const output = existsSync2(path) ? readFileSync2(path, "utf8").trim() : "";
            return output ? [`${basename(path)}: ${output}`] : [];
          })
        ]
      );
      const staleEnv = { KAI_HOME: join2(tmpRoot, "stale-lock-home") };
      const staleRegistryPath = registryPath(staleEnv);
      mkdirSync(dirname2(staleRegistryPath), { recursive: true });
      const deadOwner = spawnSync(process.execPath, ["-e", "process.exit(0)"], { windowsHide: true });
      writeFileSync(`${staleRegistryPath}.lock`, `${JSON.stringify({
        pid: deadOwner.pid,
        token: "stale-owner-token"
      })}
`);
      const recoveredWrite = writeRegistry([], staleEnv);
      ok(
        recoveredWrite.ok && !existsSync2(`${staleRegistryPath}.lock`),
        "a registry mutation safely recovers a lock whose recorded owner exited",
        [recoveredWrite.reason].filter(Boolean)
      );
      const registry = loadWorkspaceRegistry(env);
      registry.entries[0].workspace_id = "mismatched-workspace";
      writeRegistry(registry.entries, env);
      const mismatched = checkWorkspace(workspaceRoot, { env });
      ok(
        /not paired|not registered/i.test(mismatched.errors.join("\n")),
        "registry and manifest workspace ids cannot drift silently",
        mismatched.errors
      );
      writeRegistry([{
        project_root: projectRoot,
        workspace_root: workspaceRoot,
        workspace_id: manifest.workspace_id
      }], env);
      const forgotten = forgetWorkspace({ projectRoot, env });
      ok(
        forgotten.ok && loadWorkspaceRegistry(env).entries.length === 0,
        "forget removes one project binding without deleting workspace state",
        [forgotten.reason]
      );
      const emptyRegistryCli = spawnSync(
        process.execPath,
        [selfPath, "--registry", "--kai-home", env.KAI_HOME],
        { encoding: "utf8", env: cliEnv, windowsHide: true }
      );
      ok(
        emptyRegistryCli.status === 0 && /\(empty\)/.test(emptyRegistryCli.stdout),
        "the registry CLI reports an empty registry",
        [emptyRegistryCli.stderr, emptyRegistryCli.stdout].filter(Boolean)
      );
      writeFileSync(registryPath(env), "{not-json\n");
      const malformedRegistryCli = spawnSync(
        process.execPath,
        [selfPath, "--registry", "--kai-home", env.KAI_HOME],
        { encoding: "utf8", env: cliEnv, windowsHide: true }
      );
      ok(
        malformedRegistryCli.status === 1 && /not valid JSON/i.test(malformedRegistryCli.stderr),
        "the registry CLI fails clearly on malformed registry data",
        [malformedRegistryCli.stderr, malformedRegistryCli.stdout].filter(Boolean)
      );
      writeFileSync(registryPath(env), `${JSON.stringify({
        schema_version: 1,
        workspaces: [{ project_root: null, workspace_root: workspaceRoot, workspace_id: manifest.workspace_id }]
      }, null, 2)}
`);
      const malformedEntryCli = spawnSync(
        process.execPath,
        [selfPath, "--registry", "--kai-home", env.KAI_HOME],
        { encoding: "utf8", env: cliEnv, windowsHide: true }
      );
      ok(
        malformedEntryCli.status === 1 && /missing string "project_root"/i.test(malformedEntryCli.stderr),
        "the registry CLI fails clearly on malformed registry entries",
        [malformedEntryCli.stderr, malformedEntryCli.stdout].filter(Boolean)
      );
    }
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
  if (!migrationSelfTest()) failed++;
  return failed === 0 ? 0 : 1;
}
var MIGRATION_CASES = [
  {
    label: "legacy monolith installed (direct), workspace scaffolded by it",
    home: "legacy-direct",
    workspace: "monolith",
    status: "blocked",
    expect: ["legacy-installed", "workspace-provenance-current"],
    forbid: ["coexistence", "nothing-installed"],
    steps: [/^copilot plugin uninstall kai$/, /copilot plugin list/, /confirm every legacy install tree/]
  },
  {
    label: "clean pack set (core + one department, marketplace), workspace already migrated",
    home: "packs-marketplace",
    workspace: "pack",
    status: "clear",
    expect: ["workspace-provenance-migrated"],
    forbid: ["legacy-installed", "workspace-provenance-stale"],
    noSteps: true,
    notices: [/start a new session/i]
  },
  {
    label: "legacy `kai` and `kai-core` installed together",
    home: "coexistence",
    status: "blocked",
    expect: ["coexistence", "legacy-installed"],
    steps: [/^copilot plugin uninstall kai$/]
  },
  {
    label: "department pack installed without kai-core",
    home: "partial-packs",
    status: "blocked",
    expect: ["partial-pack-set"],
    forbid: ["legacy-installed", "coexistence"],
    steps: [/copilot plugin install kai-core@kai-plugins/]
  },
  {
    label: "stale direct install tree left behind by an uninstall",
    home: "stale-direct",
    status: "blocked",
    expect: ["stale-install", "legacy-installed"],
    steps: [/remove each leftover install tree/]
  },
  {
    label: "same pack installed from both a direct source and the marketplace",
    home: "provenance-collision",
    status: "blocked",
    expect: ["provenance-collision"],
    steps: [/copilot plugin uninstall kai-core/]
  },
  {
    label: "provenance inferred from a cache path, plus an unidentifiable kai tree",
    home: "inferred-provenance",
    status: "unknown",
    expect: ["unknown-provenance"],
    forbid: ["nothing-installed"],
    noRefusal: true
  },
  {
    label: "host config truncated mid-write",
    home: "malformed-config",
    status: "unknown",
    expect: ["unreadable-metadata", "install-tree-unverified"],
    forbid: ["nothing-installed", "stale-install"],
    noRefusal: true,
    noSteps: true
  },
  {
    label: "host config parses but its entries are junk; workspace records an unknown plugin",
    home: "malformed-entries",
    workspace: "unrecognized",
    status: "unknown",
    expect: ["unreadable-metadata", "workspace-provenance-unknown"],
    noRefusal: true
  },
  {
    label: "settings.json is unreadable, so a config-enabled pack is not assumed enabled",
    home: "malformed-settings",
    status: "unknown",
    expect: ["enabled-state-unverified"],
    forbid: ["nothing-installed", "disabled-install"],
    noRefusal: true,
    noSteps: true
  },
  {
    label: "settings.json carries a non-boolean enabled state",
    home: "nonboolean-enabled-state",
    status: "unknown",
    expect: ["enabled-state-unverified"],
    forbid: ["nothing-installed", "disabled-install"],
    noRefusal: true,
    noSteps: true
  },
  {
    label: "same pack has two direct install trees",
    home: "same-source-collision",
    status: "blocked",
    expect: ["provenance-collision"],
    forbid: ["nothing-installed"]
  },
  {
    label: "Windows and macOS cache paths (case, separators, trailing slash) both resolve",
    home: "path-normalization",
    status: "clear",
    noSteps: true,
    noRefusal: true
  },
  {
    label: "nothing installed, and both surfaces were readable",
    home: "absent",
    status: "clear",
    expect: ["nothing-installed"],
    noSteps: true
  },
  {
    label: "host config has no installedPlugins list",
    home: "missing-installed-list",
    status: "unknown",
    expect: ["unreadable-metadata"],
    forbid: ["nothing-installed"],
    noRefusal: true
  },
  {
    label: "install directory is missing",
    home: "missing-install-dir",
    status: "unknown",
    expect: ["unreadable-install-tree"],
    forbid: ["nothing-installed"],
    noRefusal: true
  },
  {
    label: "install directory path is not a directory",
    home: "install-path-file",
    status: "unknown",
    expect: ["unreadable-install-tree"],
    forbid: ["nothing-installed"],
    noRefusal: true
  },
  {
    label: "symlinked install directory is followed and legacy leftovers remain blocked",
    home: "symlinked-install-dir",
    status: "blocked",
    expect: ["stale-install", "legacy-installed"],
    forbid: ["nothing-installed"]
  },
  {
    label: "kai-shaped tree declares a foreign plugin identity",
    home: "foreign-identity",
    status: "unknown",
    expect: ["unknown-provenance"],
    forbid: ["nothing-installed"],
    noRefusal: true
  },
  {
    label: "manifest-less legacy remnant with child content does not disappear",
    home: "manifestless-legacy-remnant",
    status: "unknown",
    expect: ["unknown-provenance"],
    forbid: ["nothing-installed"],
    noRefusal: true,
    noSteps: true
  },
  {
    label: "deep marketplace layout still reveals a stale kai install",
    home: "deep-marketplace-layout",
    status: "unknown",
    expect: ["install-tree-unverified"],
    forbid: ["nothing-installed", "stale-install"],
    noRefusal: true,
    noSteps: true
  },
  {
    label: "recorded marketplace and inferred bucket disagreement is unknown, not collision",
    home: "provenance-disagreement",
    status: "unknown",
    expect: ["provenance-disagreement"],
    forbid: ["provenance-collision"],
    noRefusal: true
  },
  {
    label: "dangling install link makes enumeration unknown",
    home: "dangling-install-link",
    status: "unknown",
    expect: ["unreadable-install-tree"],
    forbid: ["nothing-installed"],
    noRefusal: true
  },
  {
    label: "packs installed but the workspace still records the monolith",
    home: "packs-marketplace",
    workspace: "monolith",
    status: "blocked",
    expect: ["workspace-provenance-stale"],
    steps: [/set "plugin": "kai-core"/, /workspace-doctor\.mjs --root/]
  },
  {
    label: "config still lists the monolith after its files were removed",
    home: "incomplete-uninstall",
    status: "blocked",
    expect: ["incomplete-install", "legacy-installed"],
    forbid: ["stale-install"]
  },
  {
    label: "config and the install tree disagree about what is installed",
    home: "identity-mismatch",
    status: "blocked",
    expect: ["identity-mismatch"]
  },
  {
    label: "workspace migrated ahead of the host, legacy still installed",
    home: "legacy-direct",
    workspace: "pack",
    status: "blocked",
    expect: ["workspace-provenance-ahead", "legacy-installed"],
    steps: [/^copilot plugin uninstall kai$/],
    forbidSteps: [/set "plugin": "kai"/]
  },
  {
    label: "explicit rollback reverses a migrated workspace without uninstalling the restored monolith",
    home: "legacy-direct",
    workspace: "pack",
    rollback: true,
    status: "blocked",
    expect: ["legacy-rollback-restored", "workspace-provenance-ahead"],
    forbid: ["legacy-installed", "legacy-rollback-unverified", "coexistence"],
    steps: [/^edit .*set "plugin": "kai"/, /workspace-doctor\.mjs --root/],
    forbidSteps: [/^copilot plugin uninstall kai$/, /confirm no "kai" row/, /confirm every legacy install tree/]
  },
  {
    label: "completed rollback has matching monolith workspace provenance",
    home: "legacy-direct",
    workspace: "monolith",
    rollback: true,
    status: "clear",
    expect: ["legacy-rollback-restored", "workspace-provenance-current"],
    forbid: ["legacy-installed", "legacy-rollback-unverified", "workspace-provenance-ahead"],
    noSteps: true,
    noRefusal: true
  },
  {
    label: "rollback refuses a monolith whose install tree declares the pack identity",
    home: "identity-mismatch",
    workspace: "pack",
    rollback: true,
    status: "blocked",
    expect: ["identity-mismatch", "legacy-rollback-unverified", "workspace-provenance-ahead"],
    forbid: ["legacy-rollback-restored"],
    forbidSteps: [/set "plugin": "kai"/, /^copilot plugin uninstall kai$/]
  },
  {
    label: "rollback refuses duplicate monolith trees without uninstalling or reversing provenance",
    home: "duplicate-legacy",
    workspace: "pack",
    rollback: true,
    status: "blocked",
    expect: ["provenance-collision", "legacy-rollback-unverified", "workspace-provenance-ahead"],
    forbid: ["legacy-rollback-restored"],
    forbidSteps: [/set "plugin": "kai"/, /^copilot plugin uninstall kai/]
  },
  {
    label: "rollback refuses monolith provenance inferred from cache path",
    home: "inferred-legacy-provenance",
    workspace: "pack",
    rollback: true,
    status: "blocked",
    expect: ["unknown-provenance", "legacy-rollback-unverified", "workspace-provenance-ahead"],
    forbid: ["legacy-rollback-restored"],
    forbidSteps: [/set "plugin": "kai"/, /^copilot plugin uninstall kai/]
  },
  {
    label: "workspace manifest unreadable",
    home: "absent",
    workspace: "malformed",
    status: "unknown",
    expect: ["workspace-provenance-unreadable"],
    noRefusal: true
  }
];
function materializeHostFixtures(dest) {
  const fx = JSON.parse(readFileSync2(join2(REPO_ROOT, "test", "fixtures", "host-installs.json"), "utf8"));
  const write = (base, files) => {
    for (const [rel, content] of Object.entries(files)) {
      const target = resolve(base, ...rel.split("/").filter(Boolean));
      const fromBase = relative2(resolve(base), target);
      if (fromBase === ".." || fromBase.startsWith(`..${sep}`) || isAbsolute2(fromBase)) {
        throw new Error(`fixture path escapes its root: ${rel}`);
      }
      if (content === null) {
        mkdirSync(target, { recursive: true });
        continue;
      }
      mkdirSync(dirname2(target), { recursive: true });
      const text = Array.isArray(content) ? `${content.join("\n")}
` : `${JSON.stringify(content, null, 2)}
`;
      writeFileSync(target, text);
    }
  };
  const fixtureBase = (kind, name) => {
    if (!name || name === "." || name === ".." || /[\\/]/.test(name)) {
      throw new Error(`invalid ${kind} fixture name: ${name}`);
    }
    return join2(dest, kind, name);
  };
  for (const [name, files] of Object.entries(fx.homes)) write(fixtureBase("homes", name), files);
  for (const [name, files] of Object.entries(fx.workspaces)) write(fixtureBase("workspaces", name), files);
  const linkedStore = join2(dest, "linked-install-store");
  write(linkedStore, {
    "_direct/RubenSaucedo--kai/plugin.json": { name: "kai", version: "0.55.0" }
  });
  symlinkSync(linkedStore, join2(dest, "homes", "symlinked-install-dir", "installed-plugins"), "junction");
  symlinkSync(
    join2(dest, "missing-linked-install-store"),
    join2(dest, "homes", "dangling-install-link", "installed-plugins"),
    "junction"
  );
}
function snapshotTree(dir, prefix = "") {
  const out = [];
  for (const entry of readdirSync2(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const rel = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (lstatSync(join2(dir, entry.name)).isSymbolicLink()) out.push(`${rel}->${readlinkSync(join2(dir, entry.name))}`);
    else if (entry.isDirectory()) out.push(`${rel}/`, ...snapshotTree(join2(dir, entry.name), rel));
    else out.push(`${rel}:${readFileSync2(join2(dir, entry.name), "utf8")}`);
  }
  return out;
}
function migrationSelfTest() {
  let ok = true;
  const fail = (msg, detail = []) => {
    ok = false;
    console.log(`\u2717 ${msg}`);
    detail.forEach((d) => console.log(`    ${d}`));
  };
  const commented = parseJsonc('// managed\n{"a": 1, "url": "https://x/y" /* inline */}\n');
  if (!commented.ok || commented.value.a !== 1 || commented.value.url !== "https://x/y") {
    fail("self-test: commented host config was not parsed with its string values intact");
  }
  if (parseJsonc('{"installedPlugins": [').ok) fail("self-test: truncated host config parsed as valid");
  const tails = [
    ["C:\\Users\\dev\\.copilot\\installed-plugins\\_direct\\RubenSaucedo--kai", "_direct/RubenSaucedo--kai"],
    ["/Users/dev/.copilot/installed-plugins//kai-plugins/kai-engineering/", "kai-plugins/kai-engineering"],
    ["C:\\Users\\dev\\.copilot\\Installed-Plugins\\kai-plugins\\kai-core", "kai-plugins/kai-core"],
    ["/opt/elsewhere/kai-core", null]
  ];
  for (const [input, want] of tails) {
    if (installTreeTail(input) !== want) {
      fail(`self-test: cache path "${input}" normalized to ${JSON.stringify(installTreeTail(input))}, expected ${JSON.stringify(want)}`);
    }
  }
  if (normalizeHostPath("C:\\a\\\\b\\") !== "C:/a/b") fail("self-test: host path normalization did not collapse separators");
  if (migrationExitCode("clear") !== 0 || migrationExitCode("blocked") !== 2 || migrationExitCode("unknown") !== 3) {
    fail("self-test: migration verdict exit codes are not distinct");
  }
  const tmpRoot = mkdtempSync(join2(tmpdir(), "kai-migration-"));
  try {
    materializeHostFixtures(tmpRoot);
    const before = snapshotTree(tmpRoot).join("\n");
    const missingHome = migrationReport({ home: join2(tmpRoot, "homes", "no-such-home") });
    if (missingHome.status !== "unknown" || !missingHome.codes.includes("no-host-home")) {
      fail(`self-test: an uninspectable host home reported "${missingHome.status}" instead of unknown`);
    }
    let passed = 0;
    for (const c of MIGRATION_CASES) {
      const home = join2(tmpRoot, "homes", c.home);
      const root = c.workspace ? join2(tmpRoot, "workspaces", c.workspace) : null;
      const res = migrationReport({ home, root, rollback: c.rollback ?? false });
      const problems = [];
      if (res.status !== c.status) problems.push(`status "${res.status}", expected "${c.status}"`);
      for (const code of c.expect ?? []) if (!res.codes.includes(code)) problems.push(`missing finding "${code}"`);
      for (const code of c.forbid ?? []) if (res.codes.includes(code)) problems.push(`unexpected finding "${code}"`);
      for (const re of c.steps ?? []) {
        if (!res.steps.some((s) => re.test(s))) problems.push(`no remediation step matching ${re}`);
      }
      for (const re of c.forbidSteps ?? []) {
        if (res.steps.some((s) => re.test(s))) problems.push(`unexpected remediation step matching ${re}`);
      }
      for (const re of c.notices ?? []) {
        if (!res.notices.some((n) => re.test(n))) problems.push(`no notice matching ${re}`);
      }
      if (c.noSteps && res.steps.length) problems.push(`expected no remediation steps, got ${res.steps.length}`);
      if (c.noRefusal && res.findings.some((f) => f.severity === "refusal")) {
        problems.push("expected no refusal-severity finding");
      }
      if (problems.length) fail(`self-test: migration case "${c.label}"`, [...problems, `codes: ${res.codes.join(", ") || "(none)"}`]);
      else passed++;
    }
    if (passed === MIGRATION_CASES.length) {
      console.log(`\u2713 self-test: ${passed} migration scenarios verdict correctly (legacy, packs, coexistence, partial set, unreadable surfaces, stale/incomplete installs, provenance collision, unknown provenance, malformed metadata, path normalization)`);
    }
    const inventoryReport = migrationReport({
      home: join2(tmpRoot, "homes", "packs-marketplace"),
      root: join2(tmpRoot, "workspaces", "pack")
    });
    const inventory = migrationInventory(inventoryReport);
    const core = inventory.find((plugin) => plugin.name === "kai-core");
    if (core?.presence !== "installed" || core.enabled !== true || !core.versions.length || !core.provenances.includes("marketplace:kai-plugins")) {
      fail("self-test: migration JSON inventory does not expose safe core version, enabled-state, and provenance evidence");
    } else {
      console.log("\u2713 self-test: migration JSON inventory exposes version, enabled state, and provenance without cache paths");
    }
    const disabledInventory = migrationInventory(migrationReport({
      home: join2(tmpRoot, "homes", "packs-disabled")
    }));
    if (disabledInventory.find((plugin) => plugin.name === "kai-core")?.enabled !== false) {
      fail("self-test: an explicitly disabled core install is not exposed as disabled");
    } else {
      console.log("\u2713 self-test: migration JSON inventory exposes an explicitly disabled core install");
    }
    const disagreementReport = migrationReport({
      home: join2(tmpRoot, "homes", "packs-enabled-disagreement")
    });
    const disagreementCore = migrationInventory(disagreementReport).find((plugin) => plugin.name === "kai-core");
    if (disagreementReport.status !== "unknown" || !disagreementReport.codes.includes("enabled-state-unverified") || disagreementCore?.enabled !== null) {
      fail("self-test: disagreeing config/settings enabled state did not fail closed as unknown");
    } else {
      console.log("\u2713 self-test: disagreeing enabled-state surfaces fail closed as unknown");
    }
    const directNoOverride = migrationReport({
      home: join2(tmpRoot, "homes", "legacy-direct")
    });
    const directCoreState = directNoOverride.host.records.get("kai")?.entries[0]?.enabled;
    if (directCoreState !== true || directNoOverride.codes.includes("enabled-state-unverified")) {
      fail("self-test: a direct install with no settings override did not retain its managed config state");
    } else {
      console.log("\u2713 self-test: an empty settings override map preserves direct-install enabled state");
    }
    const absentSettings = migrationReport({
      home: join2(tmpRoot, "homes", "path-normalization")
    });
    if (absentSettings.codes.includes("enabled-state-unverified")) {
      fail("self-test: an absent settings file incorrectly invalidated managed config enabled state");
    } else {
      console.log("\u2713 self-test: an absent settings file falls back to managed config enabled state");
    }
    for (const home of ["malformed-settings", "nonboolean-enabled-state"]) {
      const report2 = migrationReport({ home: join2(tmpRoot, "homes", home) });
      const record = migrationInventory(report2).find((plugin) => plugin.name === "kai-core");
      if (record?.enabled !== null || !report2.codes.includes("enabled-state-unverified")) {
        fail(
          `self-test: "${home}" did not blank the config-declared enabled state it could not verify`,
          [`enabled: ${JSON.stringify(record?.enabled)}`, `codes: ${report2.codes.join(", ") || "(none)"}`]
        );
      } else {
        console.log(`\u2713 self-test: unverifiable settings (${home}) blank the config enabled state instead of trusting it`);
      }
    }
    if (snapshotTree(tmpRoot).join("\n") !== before) {
      fail("self-test: the migration check modified the host/workspace fixtures \u2014 it must be read-only");
    } else {
      console.log("\u2713 self-test: the migration check left every inspected file byte-identical (read-only)");
    }
  } finally {
    rmSync(tmpRoot, { recursive: true, force: true });
  }
  return ok;
}
var isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath2(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  const value = (flag) => {
    const i = argv.indexOf(flag);
    return i !== -1 && argv[i + 1] ? argv[i + 1] : null;
  };
  if (argv.includes("--self-test")) {
    process.exit(selfTest());
  } else if (argv.includes("--migration-check")) {
    const home = value("--home") ? resolve(value("--home")) : defaultHome();
    const rootArg = value("--root");
    const cwdIsWorkspace = existsSync2(join2(process.cwd(), ".kai", "manifest.json"));
    const root = rootArg ? resolve(rootArg) : cwdIsWorkspace ? process.cwd() : null;
    process.exit(reportMigration({
      home,
      root,
      json: argv.includes("--json"),
      rollback: argv.includes("--rollback")
    }));
  } else if (argv.includes("--registry")) {
    const env = value("--kai-home") ? { ...process.env, KAI_HOME: resolve(value("--kai-home")) } : process.env;
    process.exit(reportRegistry({ env, json: argv.includes("--json") }));
  } else if (value("--adopt")) {
    const root = value("--root");
    if (!root) {
      console.error("--adopt requires --root <external-workspace>");
      process.exit(1);
    }
    const env = value("--kai-home") ? { ...process.env, KAI_HOME: resolve(value("--kai-home")) } : process.env;
    const result = adoptWorkspace({ root, projectRoot: value("--adopt"), env });
    if (!result.ok) {
      console.error(`workspace adoption failed: ${result.reason}`);
      process.exit(1);
    }
    console.log(`workspace adopted in ${result.path}`);
    process.exit(0);
  } else if (value("--forget")) {
    const env = value("--kai-home") ? { ...process.env, KAI_HOME: resolve(value("--kai-home")) } : process.env;
    const result = forgetWorkspace({ projectRoot: value("--forget"), env });
    if (!result.ok) {
      console.error(`workspace removal failed: ${result.reason}`);
      process.exit(1);
    }
    console.log(`workspace binding removed from ${result.path}; workspace files were not deleted`);
    process.exit(0);
  } else if (argv.includes("--rollback")) {
    console.error("--rollback requires --migration-check");
    process.exit(1);
  } else {
    const resolvedWorkspace = resolveWorkspaceRoot({
      explicitRoot: value("--root"),
      cwd: process.cwd(),
      env: process.env
    });
    if (!resolvedWorkspace.ok) {
      console.error(`workspace-doctor: ${resolvedWorkspace.reason}`);
      process.exit(1);
    }
    process.exit(report(
      resolvedWorkspace.root,
      checkWorkspace(resolvedWorkspace.root, { env: process.env })
    ));
  }
}

export {
  checkWorkspace,
  adoptWorkspace,
  forgetWorkspace
};
