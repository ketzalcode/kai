import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/core/lib/activity.mjs
import {
  appendFileSync,
  readFileSync as readFileSync3,
  existsSync as existsSync5,
  lstatSync as lstatSync3,
  mkdirSync as mkdirSync2,
  renameSync,
  statSync as statSync2
} from "node:fs";
import { join as join5, dirname as dirname6 } from "node:path";

// src/core/lib/workspace-layout.mjs
import { dirname as dirname2, posix as path, resolve as resolve2 } from "node:path";

// src/core/lib/workspace-path-safety.mjs
import { existsSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";

// src/core/lib/coordination.mjs
var TASK_LIFECYCLE = /* @__PURE__ */ new Set([
  "proposed",
  "ready",
  "in-progress",
  "in-review",
  "blocked",
  "completed",
  "release-ready",
  "deploying",
  "production-verification",
  "shipped",
  "dropped"
]);
var TASK_NEEDS_CHANGE_REF = /* @__PURE__ */ new Set([
  "in-review",
  "release-ready",
  "deploying",
  "production-verification",
  "shipped"
]);
var TASK_DEPENDENCY_STATES = /* @__PURE__ */ new Set([
  "in-review",
  "completed",
  "release-ready",
  "shipped"
]);
var TASK_TERMINAL_STATES = /* @__PURE__ */ new Set(["shipped", "completed", "dropped"]);
var TASK_OPERATOR_GATED_STATES = /* @__PURE__ */ new Set([
  "release-ready",
  "deploying",
  "production-verification"
]);
var TERMINAL = TASK_TERMINAL_STATES;
var OPERATOR_GATED = TASK_OPERATOR_GATED_STATES;
var isNull = (v) => v === void 0 || v === "" || v === "null" || v === "~" || v === "\u2014";
var unquote = (s) => {
  const t = (s ?? "").trim();
  return t.startsWith('"') && t.endsWith('"') || t.startsWith("'") && t.endsWith("'") ? t.slice(1, -1) : t;
};
function parseStamp(s) {
  const t = unquote(s);
  let mm = t.match(/^(\d{4})-(\d{2})-(\d{2})-(\d{2})(\d{2})$/);
  if (mm) return Date.UTC(+mm[1], +mm[2] - 1, +mm[3], +mm[4], +mm[5]);
  mm = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (mm) return Date.UTC(+mm[1], +mm[2] - 1, +mm[3]);
  const d = Date.parse(t);
  return Number.isNaN(d) ? null : d;
}

// src/core/lib/workspace-path-safety.mjs
var SHIPPED_PACK_NAMESPACES = /* @__PURE__ */ new Set(["core", "engineering", "creative"]);
var ACTIVE_ARTIFACT_LIFECYCLES = /* @__PURE__ */ new Set(["drafts", "evidence", "scratch"]);
var RESERVED_DEVICE_SEGMENT = /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i;
var DRIVE_RELATIVE_SEGMENT = /^[A-Za-z]:(?![\\/])/;
var DRIVE_ABSOLUTE_SEGMENT = /^[A-Za-z]:[\\/]/;
function badPath(p) {
  const t = unquote(p);
  if (isNull(t) || t === "[]") return null;
  const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/i.exec(t);
  const candidate = projectTarget ? projectTarget[2] : t;
  if (projectTarget && !candidate.trim()) return "project target with no relative path";
  const norm = candidate.replace(/\\/g, "/");
  if (t.startsWith("\\\\") || norm.startsWith("//")) return "UNC / share path";
  if (/^[A-Za-z]:\//.test(norm) || norm.startsWith("/")) return "machine-absolute path";
  if (t.includes(".../")) return "abbreviated `.../` path";
  if (norm.split("/").some((seg) => seg === "..")) return "path escaping the workspace root";
  if (/session-state/i.test(t)) return "session-state-relative path";
  return null;
}
function badWorkspaceSegment(value) {
  if (typeof value !== "string") return "non-string segment";
  if (value.length === 0) return "empty segment";
  if (value === ".") return "dot segment";
  if (value === "..") return "dot-dot segment";
  const normalizedValue = value.replace(/\\/g, "/");
  if (value.startsWith("\\\\") || normalizedValue.startsWith("//")) return "UNC / share segment";
  if (DRIVE_RELATIVE_SEGMENT.test(value) || DRIVE_RELATIVE_SEGMENT.test(normalizedValue)) return "drive-relative segment";
  if (value.startsWith("/") || value.startsWith("\\") || DRIVE_ABSOLUTE_SEGMENT.test(value) || DRIVE_ABSOLUTE_SEGMENT.test(normalizedValue)) {
    return "absolute segment";
  }
  if (normalizedValue.includes("/")) return "mixed-separator segment";
  if (/[:<>"|?*\x00-\x1f]/.test(value)) return "unsafe segment";
  if (RESERVED_DEVICE_SEGMENT.test(value)) return "reserved-device segment";
  if (/[. ]$/.test(value)) return "trailing-dot-space segment";
  return null;
}
function assertWorkspaceSegment(value, label = "segment") {
  const problem = badWorkspaceSegment(value);
  if (problem) throw new TypeError(`${label} must be a safe workspace segment (${problem})`);
  return value;
}
function assertShippedPackNamespace(value) {
  const pack = assertWorkspaceSegment(value, "pack");
  if (!SHIPPED_PACK_NAMESPACES.has(pack)) throw new TypeError(`unknown pack namespace "${pack}"`);
  return pack;
}
function assertArtifactLifecycle(value) {
  const lifecycle = assertWorkspaceSegment(value, "lifecycle");
  if (!ACTIVE_ARTIFACT_LIFECYCLES.has(lifecycle)) {
    throw new TypeError("lifecycle must be one of drafts, evidence, or scratch");
  }
  return lifecycle;
}
function canonicalPath(path4) {
  let existing = resolve(path4);
  const tail = [];
  while (!existsSync(existing)) {
    const parent = dirname(existing);
    if (parent === existing) break;
    tail.unshift(basename(existing));
    existing = parent;
  }
  const canonical = existsSync(existing) ? realpathSync.native(existing) : existing;
  return resolve(canonical, ...tail);
}
function exactPath(path4) {
  const requested = resolve(path4);
  const canonical = canonicalPath(path4);
  return process.platform === "win32" ? requested.toLowerCase() === canonical.toLowerCase() : requested === canonical;
}
function normalized(path4) {
  const value = canonicalPath(path4);
  return process.platform === "win32" ? value.toLowerCase() : value;
}
function resolvedProjectPath(root, projectPath) {
  return isAbsolute(projectPath) ? resolve(projectPath) : resolve(root, projectPath);
}
function escapesRoot(root, candidate) {
  const rel = relative(canonicalPath(root), canonicalPath(candidate));
  return rel === ".." || rel.startsWith(`..${sep}`) || isAbsolute(rel);
}
function inspectPrivateLanes(root, lanes = [".kai/runs", ".kai/review", ".kai/archive", ".kai/personal"]) {
  const gitRoots = [];
  const symbolicLinks = [];
  const unreadable = [];
  for (const lane2 of lanes) {
    const laneRoot = join(root, ...lane2.split("/"));
    let laneStat;
    try {
      laneStat = lstatSync(laneRoot);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      unreadable.push(`${lane2}: ${error.message}`);
      continue;
    }
    if (laneStat.isSymbolicLink()) {
      symbolicLinks.push(lane2);
      continue;
    }
    const pending = [laneRoot];
    while (pending.length) {
      const current = pending.pop();
      let entries;
      try {
        entries = readdirSync(current, { withFileTypes: true });
      } catch (error) {
        unreadable.push(`${relative(root, current).replace(/\\/g, "/")}: ${error.message}`);
        continue;
      }
      for (const entry of entries) {
        const path4 = join(current, entry.name);
        if (entry.name.toLowerCase() === ".git") {
          gitRoots.push(relative(root, current).replace(/\\/g, "/") || ".");
          continue;
        }
        if (entry.isSymbolicLink()) {
          symbolicLinks.push(relative(root, path4).replace(/\\/g, "/"));
          continue;
        }
        if (entry.isDirectory()) pending.push(path4);
      }
    }
  }
  return { gitRoots, symbolicLinks, unreadable };
}
function pathHasLink(root, candidate) {
  let current = resolve(root);
  const segments = relative(current, resolve(candidate)).split(sep).filter(Boolean);
  for (const segment of ["", ...segments]) {
    if (segment) current = join(current, segment);
    try {
      if (lstatSync(current).isSymbolicLink()) return true;
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  return false;
}

// src/core/lib/workspace-layout.mjs
var WORKSPACE_CONTRACT = Object.freeze({
  schemaVersion: 5,
  privateRoot: ".kai",
  publicationRoot: "docs/kai",
  directionPath: "docs/kai/DIRECTION.md",
  coordinationDatabase: ".kai/core/runtime/coordination.sqlite",
  packs: Object.freeze(["core", "creative", "engineering"]),
  lifecycles: Object.freeze(["drafts", "evidence", "scratch"])
});
var WORKSPACE_SCHEMA_VERSION = WORKSPACE_CONTRACT.schemaVersion;
var PRIVATE_ROOT = WORKSPACE_CONTRACT.privateRoot;
var PUBLICATION_ROOT = WORKSPACE_CONTRACT.publicationRoot;
var DIRECTION_PATH = WORKSPACE_CONTRACT.directionPath;
var COORDINATION_DATABASE = WORKSPACE_CONTRACT.coordinationDatabase;
function assertDerivedPath(relativePath, label) {
  const problem = badPath(relativePath);
  if (problem) throw new TypeError(`${label} must stay workspace-relative (${problem})`);
  return relativePath;
}
function safeRouteSegments(relativePath) {
  if (typeof relativePath !== "string" || relativePath.includes("\\")) {
    throw new TypeError("typed artifact route must use a workspace-relative POSIX path");
  }
  const problem = badPath(relativePath);
  if (problem) throw new TypeError(`typed artifact route must stay workspace-relative (${problem})`);
  const segments = relativePath.split("/");
  if (segments.some((segment) => segment.length === 0)) {
    throw new TypeError("typed artifact route cannot contain empty segments");
  }
  return segments;
}
function parsedRoute({ pack, type, subtype = null, id, lifecycle = null, members = [] }) {
  return {
    pack: assertShippedPackNamespace(pack),
    type: assertWorkspaceSegment(type, "type"),
    subtype: subtype === null ? null : assertWorkspaceSegment(subtype, "subtype"),
    id: assertWorkspaceSegment(id, "id"),
    lifecycle,
    members: members.map((member2, index) => assertWorkspaceSegment(member2, `member[${index}]`))
  };
}
function parseTypedArtifactRoute(relativePath) {
  const segments = safeRouteSegments(relativePath);
  if (segments[0] === PRIVATE_ROOT) {
    const route2 = segments.slice(1);
    const routes2 = [];
    if (ACTIVE_ARTIFACT_LIFECYCLES.has(route2[3])) {
      routes2.push(parsedRoute({
        pack: route2[0],
        type: route2[1],
        id: route2[2],
        lifecycle: assertArtifactLifecycle(route2[3]),
        members: route2.slice(4)
      }));
    }
    if (ACTIVE_ARTIFACT_LIFECYCLES.has(route2[4])) {
      routes2.push(parsedRoute({
        pack: route2[0],
        type: route2[1],
        subtype: route2[2],
        id: route2[3],
        lifecycle: assertArtifactLifecycle(route2[4]),
        members: route2.slice(5)
      }));
    }
    if (routes2.length === 0) {
      throw new TypeError(
        "typed private artifact route must contain pack, type, optional subtype, id, and lifecycle"
      );
    }
    return { path: relativePath, visibility: "private", routes: routes2 };
  }
  const publicRoot = PUBLICATION_ROOT.split("/");
  if (segments[0] !== publicRoot[0] || segments[1] !== publicRoot[1]) {
    throw new TypeError(`typed public artifact route must stay below ${PUBLICATION_ROOT}`);
  }
  const route = segments.slice(publicRoot.length);
  if (route.length < 3) {
    throw new TypeError("typed public artifact route must contain pack, type, optional subtype, and id");
  }
  const routes = [parsedRoute({
    pack: route[0],
    type: route[1],
    id: route[2],
    members: route.slice(3)
  })];
  if (route.length >= 4) {
    routes.push(parsedRoute({
      pack: route[0],
      type: route[1],
      subtype: route[2],
      id: route[3],
      members: route.slice(4)
    }));
  }
  return { path: relativePath, visibility: "public", routes };
}
function directionPath() {
  return assertDerivedPath(DIRECTION_PATH, "direction path");
}
function workspaceRootFromCoordinationDatabase(databasePath) {
  const absolute = resolve2(databasePath);
  let root = absolute;
  for (const _segment of COORDINATION_DATABASE.split("/")) root = dirname2(root);
  const candidate = resolve2(root, ...COORDINATION_DATABASE.split("/"));
  if ((process.platform === "win32" ? candidate.toLowerCase() : candidate) === (process.platform === "win32" ? absolute.toLowerCase() : absolute)) return root;
  throw new TypeError("coordination database path does not use the current workspace location");
}

// src/core/lib/workspace-git-privacy.mjs
import { spawnSync } from "node:child_process";

// src/core/lib/workspace-resolve.mjs
import { existsSync as existsSync2, readFileSync, realpathSync as realpathSync2 } from "node:fs";
import { homedir } from "node:os";
import {
  dirname as dirname3,
  isAbsolute as isAbsolute2,
  join as join2,
  parse as parsePath,
  relative as relative2,
  resolve as resolvePath,
  sep as sep2
} from "node:path";
var MANIFEST_REL = join2(".kai", "manifest.json");
var REGISTRY_FILE = "workspaces.json";
var SCHEMA5_MANIFEST_KEYS = Object.freeze([
  "plugin",
  "version",
  "schema_version",
  "scaffolded",
  "workspace_id",
  "placement",
  "workspace_root",
  "private_root",
  "direction",
  "projects"
]);
var SCHEMA5_PROJECT_KEYS = Object.freeze([
  "id",
  "path",
  "publication_root"
]);
var MAX_SEARCH_DEPTH = 64;
var PROJECT_ID = /^[a-z][a-z0-9-]*$/;
var WORKSPACE_ID = /^[a-z0-9][a-z0-9-]{7,}$/i;
function fail(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function isWithin(parent, candidate) {
  const rel = relative2(normalized(parent), normalized(candidate));
  return rel === "" || rel !== ".." && !rel.startsWith(`..${sep2}`) && !isAbsolute2(rel);
}
function hasManifest(dir) {
  return existsSync2(join2(dir, MANIFEST_REL));
}
function readJson(path4) {
  try {
    return { ok: true, value: JSON.parse(readFileSync(path4, "utf8")) };
  } catch (error) {
    return { ok: false, reason: `${path4} is not valid JSON: ${error.message}` };
  }
}
function defaultKaiHome(env = process.env) {
  return resolvePath(env.KAI_HOME || join2(homedir(), ".kai"));
}
function registryPath(env = process.env) {
  return join2(defaultKaiHome(env), REGISTRY_FILE);
}
function searchUpward(startDir) {
  if (nativeAbsolutePathProblem(startDir, {
    label: "workspace search root",
    requireExisting: true,
    requireCanonical: true
  })) return null;
  let dir = resolvePath(startDir);
  for (let depth = 0; depth < MAX_SEARCH_DEPTH; depth++) {
    if (hasManifest(dir)) return dir;
    const parent = dirname3(dir);
    if (parent === dir || parent === parsePath(dir).root) return null;
    dir = parent;
  }
  return null;
}
function readWorkspaceManifest(root) {
  const path4 = join2(resolvePath(root), MANIFEST_REL);
  if (!existsSync2(path4)) {
    return { ok: false, reason: `no ${MANIFEST_REL} in workspace root "${resolvePath(root)}"` };
  }
  const parsed = readJson(path4);
  if (!parsed.ok) return parsed;
  if (!parsed.value || typeof parsed.value !== "object" || Array.isArray(parsed.value)) {
    return { ok: false, reason: `${path4} must contain a JSON object` };
  }
  return { ok: true, path: path4, manifest: parsed.value };
}
function exactKeys(value, required2, label, errors) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    errors.push(`${label} must be an object`);
    return;
  }
  const expected = new Set(required2);
  for (const key2 of required2) {
    if (!Object.hasOwn(value, key2)) errors.push(`${label} missing required key "${key2}"`);
  }
  for (const key2 of Object.keys(value)) {
    if (!expected.has(key2)) errors.push(`${label} contains unexpected key "${key2}"`);
  }
}
function portableAbsoluteKind(value) {
  if (typeof value !== "string") return null;
  if (/^(?:\\\\|\/\/)/.test(value)) return "network";
  if (/^[A-Za-z]:[\\/]/.test(value)) return "windows";
  if (/^\//.test(value)) return "posix";
  return null;
}
function isNativeAbsolute(value) {
  const kind = portableAbsoluteKind(value);
  return isAbsolute2(value) && (process.platform === "win32" ? kind === "windows" : kind === "posix");
}
function usesCanonicalPhysicalPath(value) {
  return exactPath(value);
}
function nativeAbsolutePathProblem(value, {
  label = "path",
  requireExisting = false,
  requireCanonical = false
} = {}) {
  if (typeof value !== "string" || !value.trim()) return `${label} must be a native absolute path`;
  const kind = portableAbsoluteKind(value);
  if (kind === "network") return `${label} cannot use a UNC, device, or network path`;
  if (!kind || !isNativeAbsolute(value)) return `${label} must be a native absolute path`;
  if (requireExisting && !existsSync2(value)) return `${label} does not exist`;
  if (requireCanonical && (!usesCanonicalPhysicalPath(value) || pathHasLink(value, value))) {
    return `${label} cannot use links, junctions, or filesystem aliases`;
  }
  return null;
}
function validateSchema5Manifest(root, manifest, {
  env = process.env,
  allowUnregisteredExternal = false
} = {}) {
  root = resolvePath(root);
  const errors = [];
  exactKeys(manifest, SCHEMA5_MANIFEST_KEYS, ".kai/manifest.json", errors);
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    return { errors, projects: [] };
  }
  const rootKind = portableAbsoluteKind(root);
  if (rootKind === "network") errors.push("workspace root cannot use a UNC, device, or network path");
  else if (pathHasLink(root, root) || !usesCanonicalPhysicalPath(root)) {
    errors.push("workspace root cannot use a symbolic link, junction, or filesystem alias");
  }
  if (manifest.plugin !== "kai-core") errors.push('.kai/manifest.json "plugin" must be exactly "kai-core"');
  if (typeof manifest.version !== "string" || !manifest.version.trim()) {
    errors.push('.kai/manifest.json "version" must be a non-empty string');
  }
  if (manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    errors.push(`.kai/manifest.json "schema_version" must be ${WORKSPACE_SCHEMA_VERSION}`);
  }
  if (typeof manifest.scaffolded !== "string" || !/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(manifest.scaffolded)) {
    errors.push('.kai/manifest.json "scaffolded" must be an ISO date or timestamp');
  }
  if (typeof manifest.workspace_id !== "string" || !WORKSPACE_ID.test(manifest.workspace_id)) {
    errors.push('.kai/manifest.json "workspace_id" must be a stable UUID or UUID-like identifier');
  }
  if (!["repo-local", "external"].includes(manifest.placement)) {
    errors.push('.kai/manifest.json "placement" must be "repo-local" or "external"');
  }
  if (manifest.private_root !== PRIVATE_ROOT) {
    errors.push(`.kai/manifest.json "private_root" must be exactly "${PRIVATE_ROOT}"`);
  }
  if (manifest.direction !== DIRECTION_PATH) {
    errors.push(`.kai/manifest.json "direction" must be exactly "${DIRECTION_PATH}"`);
  }
  if (manifest.placement === "repo-local" && manifest.workspace_root !== ".") {
    errors.push('.kai/manifest.json repo-local "workspace_root" must be "."');
  }
  if (manifest.placement === "external") {
    const kind = portableAbsoluteKind(manifest.workspace_root);
    if (!kind || !isNativeAbsolute(manifest.workspace_root)) {
      errors.push('.kai/manifest.json external "workspace_root" must be a native absolute path');
    } else if (kind === "network") {
      errors.push('.kai/manifest.json external "workspace_root" cannot use a UNC, device, or network path');
    } else if (normalized(manifest.workspace_root) !== normalized(root)) {
      errors.push(`.kai/manifest.json external "workspace_root" does not match "${root}"`);
    }
  }
  const projects = [];
  if (!Array.isArray(manifest.projects) || manifest.projects.length === 0) {
    errors.push('.kai/manifest.json "projects" must contain at least one project binding');
  } else {
    const ids = /* @__PURE__ */ new Set();
    const roots = /* @__PURE__ */ new Set();
    for (const [index, project] of manifest.projects.entries()) {
      const label = `.kai/manifest.json projects[${index}]`;
      exactKeys(project, SCHEMA5_PROJECT_KEYS, label, errors);
      if (!project || typeof project !== "object" || Array.isArray(project)) continue;
      if (!PROJECT_ID.test(project.id || "")) errors.push(`${label}.id must be kebab-case`);
      else if (ids.has(project.id)) errors.push(`${label}.id "${project.id}" is duplicated`);
      else ids.add(project.id);
      try {
        assertSafeProjectPath(project);
      } catch (error) {
        errors.push(`${label}.path is unsafe: ${error.message}`);
      }
      const pathKind = portableAbsoluteKind(project.path);
      if (manifest.placement === "repo-local" && project.path !== ".") {
        errors.push(`${label}.path must be "." for repo-local placement`);
      }
      if (manifest.placement === "external" && (!pathKind || !isNativeAbsolute(project.path))) {
        errors.push(`${label}.path must be a native absolute path for external placement`);
      }
      if (pathKind === "network") errors.push(`${label}.path cannot use a UNC, device, or network path`);
      const publicationProblem = badPath(project.publication_root);
      const publicationRoot = typeof project.publication_root === "string" ? project.publication_root.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "") : "";
      if (!publicationRoot) errors.push(`${label}.publication_root is required`);
      else if (publicationProblem) errors.push(`${label}.publication_root is a ${publicationProblem}`);
      else if (publicationRoot.toLowerCase() === PRIVATE_ROOT || publicationRoot.toLowerCase().startsWith(`${PRIVATE_ROOT}/`)) {
        errors.push(`${label}.publication_root must be outside ${PRIVATE_ROOT}/`);
      } else if (publicationRoot !== "docs/kai") {
        errors.push(`${label}.publication_root must be exactly "docs/kai"`);
      }
      if (typeof project.path !== "string" || !project.path.trim() || pathKind === "network" || manifest.placement === "repo-local" && project.path !== "." || manifest.placement === "external" && !isNativeAbsolute(project.path)) {
        continue;
      }
      const projectRoot = resolvedProjectPath(root, project.path);
      const canonicalRoot = canonicalPath(projectRoot);
      if (!existsSync2(projectRoot)) errors.push(`${label}.path does not exist: "${projectRoot}"`);
      else if (pathHasLink(projectRoot, projectRoot) || !usesCanonicalPhysicalPath(projectRoot)) {
        errors.push(`${label}.path cannot use a symbolic link, junction, or filesystem alias`);
      }
      const rootKey = normalized(projectRoot);
      if (roots.has(rootKey)) errors.push(`${label}.path duplicates another project binding`);
      roots.add(rootKey);
      if (manifest.placement === "external" && (!escapesRoot(root, projectRoot) || !escapesRoot(projectRoot, root))) {
        errors.push(`${label}.path overlaps the external workspace root`);
      }
      const projectPrivateRoot = join2(projectRoot, ".kai");
      if (manifest.placement === "external" && (existsSync2(projectPrivateRoot) || pathHasLink(projectRoot, projectPrivateRoot))) {
        errors.push(`${label}.path must not contain project-local .kai state for external placement`);
      }
      const publicationRootAbsolute = resolvePath(projectRoot, ...publicationRoot.split("/").filter(Boolean));
      if (publicationRoot && (escapesRoot(projectRoot, publicationRootAbsolute) || pathHasLink(projectRoot, publicationRootAbsolute) || existsSync2(publicationRootAbsolute) && !usesCanonicalPhysicalPath(publicationRootAbsolute))) {
        errors.push(`${label}.publication_root escapes the configured project through a link or alias`);
      }
      projects.push({
        project,
        projectRoot: canonicalRoot,
        publicationRoot,
        publicationRootAbsolute
      });
    }
  }
  if (manifest.placement === "external" && !allowUnregisteredExternal) {
    const registry = loadWorkspaceRegistry(env);
    if (!registry.ok) errors.push(registry.reason);
    else {
      if (!registry.entries.some((entry) => entry.workspace_id === manifest.workspace_id && normalized(entry.workspace_root) === normalized(root))) {
        errors.push(`external workspace is not registered in "${registry.path}"`);
      }
      for (const { project, projectRoot } of projects) {
        const matches = registry.entries.filter((entry) => normalized(entry.project_root) === normalized(projectRoot));
        if (matches.length !== 1) {
          errors.push(`external project "${project.id}" requires exactly one registry binding`);
        } else if (matches[0].workspace_id !== manifest.workspace_id || normalized(matches[0].workspace_root) !== normalized(root)) {
          errors.push(`external project "${project.id}" is not paired with this workspace`);
        }
      }
    }
  }
  return { errors, projects };
}
function loadWorkspaceRegistryWithPolicy(env = process.env, {
  requireExisting = true,
  requireCanonical = true
} = {}) {
  const path4 = registryPath(env);
  if (!existsSync2(path4)) return { ok: true, path: path4, entries: [] };
  const parsed = readJson(path4);
  if (!parsed.ok) return parsed;
  if (parsed.value?.schema_version !== 1 || !Array.isArray(parsed.value.workspaces)) {
    return { ok: false, reason: `${path4} must contain schema_version 1 and a workspaces array` };
  }
  for (const [index, entry] of parsed.value.workspaces.entries()) {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      return { ok: false, reason: `${path4} workspaces[${index}] must be an object` };
    }
    for (const key2 of ["project_root", "workspace_root", "workspace_id"]) {
      if (typeof entry[key2] !== "string" || !entry[key2].trim()) {
        return { ok: false, reason: `${path4} workspaces[${index}] is missing string "${key2}"` };
      }
    }
    const projectProblem = nativeAbsolutePathProblem(entry.project_root, {
      label: `${path4} workspaces[${index}].project_root`,
      requireExisting,
      requireCanonical
    });
    const workspaceProblem = nativeAbsolutePathProblem(entry.workspace_root, {
      label: `${path4} workspaces[${index}].workspace_root`,
      requireExisting,
      requireCanonical
    });
    if (projectProblem || workspaceProblem) {
      return {
        ok: false,
        reason: projectProblem ?? workspaceProblem
      };
    }
  }
  return { ok: true, path: path4, entries: parsed.value.workspaces };
}
function loadWorkspaceRegistry(env = process.env) {
  return loadWorkspaceRegistryWithPolicy(env, {
    requireExisting: true,
    requireCanonical: true
  });
}
function loadWorkspaceRegistryForCleanup(env = process.env) {
  return loadWorkspaceRegistryWithPolicy(env, {
    requireExisting: false,
    requireCanonical: false
  });
}
function validateRegisteredWorkspace(entry, projectRoot) {
  if (!entry || typeof entry !== "object") {
    return { ok: false, reason: "workspace registry contains a non-object entry" };
  }
  for (const key2 of ["project_root", "workspace_root", "workspace_id"]) {
    if (typeof entry[key2] !== "string" || !entry[key2].trim()) {
      return { ok: false, reason: `workspace registry entry is missing "${key2}"` };
    }
  }
  const projectProblem = nativeAbsolutePathProblem(entry.project_root, {
    label: "workspace registry project_root",
    requireExisting: true,
    requireCanonical: true
  });
  const workspaceProblem = nativeAbsolutePathProblem(entry.workspace_root, {
    label: "workspace registry workspace_root",
    requireExisting: true,
    requireCanonical: true
  });
  if (projectProblem || workspaceProblem) return { ok: false, reason: projectProblem ?? workspaceProblem };
  if (normalized(entry.project_root) !== normalized(projectRoot)) {
    return { ok: false, reason: "workspace registry project path changed during resolution" };
  }
  const manifestResult = readWorkspaceManifest(entry.workspace_root);
  if (!manifestResult.ok) return manifestResult;
  const manifest = manifestResult.manifest;
  if (manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    return {
      ok: false,
      code: "SCHEMA_MISMATCH",
      reason: "workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard"
    };
  }
  if (manifest.placement !== "external") {
    return {
      ok: false,
      reason: `registered workspace manifest placement must be "external", found ${JSON.stringify(manifest.placement)}`
    };
  }
  if (manifest.workspace_id !== entry.workspace_id) {
    return {
      ok: false,
      reason: `workspace registry id "${entry.workspace_id}" does not match manifest id ${JSON.stringify(manifest.workspace_id)}`
    };
  }
  if (!Array.isArray(manifest.projects)) {
    return { ok: false, reason: "registered workspace manifest has no projects array" };
  }
  const bindsProject = manifest.projects.some((project) => {
    if (!project || typeof project.path !== "string") return false;
    const manifestProject = resolvedProjectPath(entry.workspace_root, project.path);
    return normalized(manifestProject) === normalized(projectRoot);
  });
  if (!bindsProject) {
    return {
      ok: false,
      reason: `workspace manifest "${manifestResult.path}" does not bind registered project "${projectRoot}"`
    };
  }
  return { ok: true, root: realpathSync2.native(entry.workspace_root) };
}
function findRegisteredWorkspace(cwd, env = process.env) {
  const cwdProblem = nativeAbsolutePathProblem(cwd, {
    label: "registry discovery cwd",
    requireExisting: true,
    requireCanonical: true
  });
  if (cwdProblem) return { ok: false, reason: cwdProblem };
  const registry = loadWorkspaceRegistry(env);
  if (!registry.ok) return registry;
  const matches = registry.entries.filter((entry) => isWithin(entry.project_root, cwd)).sort((left, right) => normalized(right.project_root).length - normalized(left.project_root).length);
  if (!matches.length) return { ok: true, root: null, registryPath: registry.path };
  const projectRoot = realpathSync2.native(matches[0].project_root);
  const duplicate = matches.filter(
    (entry) => normalized(entry.project_root) === normalized(projectRoot)
  );
  if (duplicate.length > 1) {
    return {
      ok: false,
      reason: `workspace registry has ${duplicate.length} entries for project "${projectRoot}"`
    };
  }
  const validated = validateRegisteredWorkspace(matches[0], projectRoot);
  if (!validated.ok) return validated;
  return { ok: true, root: validated.root, projectRoot, registryPath: registry.path };
}
function resolveWorkspaceRoot(opts = {}) {
  const { explicitRoot, cwd = process.cwd(), env = process.env } = opts;
  if (explicitRoot) {
    const problem = nativeAbsolutePathProblem(explicitRoot, {
      label: "explicit workspace root",
      requireExisting: true,
      requireCanonical: true
    });
    if (problem) return { ok: false, reason: problem };
    const root = resolvePath(explicitRoot);
    if (hasManifest(root)) return { ok: true, root, source: "explicit" };
    return {
      ok: false,
      reason: `no ${MANIFEST_REL} in explicit root "${root}" -- explicit roots are validated directly and never searched upward`
    };
  }
  const envRoot = env.KAI_WORKSPACE_ROOT;
  if (envRoot) {
    const problem = nativeAbsolutePathProblem(envRoot, {
      label: "KAI_WORKSPACE_ROOT",
      requireExisting: true,
      requireCanonical: true
    });
    if (problem) return { ok: false, reason: problem };
    const root = resolvePath(envRoot);
    if (!hasManifest(root)) {
      return { ok: false, reason: `KAI_WORKSPACE_ROOT "${root}" has no ${MANIFEST_REL}` };
    }
    return { ok: true, root, source: "env" };
  }
  const cwdProblem = nativeAbsolutePathProblem(cwd, {
    label: "workspace discovery cwd",
    requireExisting: true,
    requireCanonical: true
  });
  if (cwdProblem) return { ok: false, reason: cwdProblem };
  const found = searchUpward(cwd);
  if (found) return { ok: true, root: found, source: "search" };
  const registered = findRegisteredWorkspace(cwd, env);
  if (!registered.ok) return registered;
  if (registered.root) {
    return {
      ok: true,
      root: registered.root,
      source: "registry",
      projectRoot: registered.projectRoot
    };
  }
  return {
    ok: false,
    reason: `no kai workspace found from "${resolvePath(cwd)}"; no in-tree manifest or registry binding exists`
  };
}
function normalizePublicationRoot(publicationRoot) {
  if (typeof publicationRoot !== "string" || !publicationRoot.trim()) {
    fail("PATH_ESCAPE", "project publication_root is required");
  }
  const problem = badPath(publicationRoot);
  if (problem) fail("PATH_ESCAPE", `project publication_root must stay project-relative (${problem})`);
  const normalizedRoot = publicationRoot.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  if (!normalizedRoot) fail("PATH_ESCAPE", "project publication_root is required");
  if (normalizedRoot.toLowerCase() === ".kai" || normalizedRoot.toLowerCase().startsWith(".kai/")) {
    fail("PATH_ESCAPE", "project publication_root must stay outside .kai/");
  }
  return normalizedRoot;
}
function selectConfiguredProject(manifest, projectId) {
  if (!manifest || typeof manifest !== "object" || Array.isArray(manifest)) {
    throw new TypeError("workspace manifest must be an object");
  }
  if (!Array.isArray(manifest.projects) || manifest.projects.length === 0) {
    throw new TypeError("workspace manifest must declare at least one project");
  }
  if (projectId != null) {
    const matches = manifest.projects.filter((project) => project?.id === projectId);
    if (matches.length !== 1) throw new TypeError(`manifest project "${projectId}" must resolve exactly once`);
    return matches[0];
  }
  if (manifest.projects.length === 1) return manifest.projects[0];
  const defaults = manifest.projects.filter((project) => project?.id === "default");
  if (defaults.length === 1) return defaults[0];
  throw new TypeError("projectId is required when the manifest declares multiple projects");
}
function assertSafeProjectPath(project) {
  if (typeof project?.path !== "string" || !project.path.trim()) {
    fail("PATH_ESCAPE", "project path is required");
  }
  if (/^(\\\\|\/\/)/.test(project.path)) fail("PATH_ESCAPE", "project path cannot use a network share");
  if (/^[A-Za-z]:(?![\\/])/.test(project.path) || /^\\(?!\\)/.test(project.path) || process.platform === "win32" && isAbsolute2(project.path) && !/^[A-Za-z]:[\\/]/.test(project.path)) {
    fail("PATH_ESCAPE", "project path cannot depend on the current drive or working directory");
  }
}
function resolveConfiguredProject({ workspaceRoot: workspaceRoot2, manifest, projectId }) {
  const root = resolvePath(workspaceRoot2);
  const project = selectConfiguredProject(manifest, projectId);
  assertSafeProjectPath(project);
  const projectRoot = resolvedProjectPath(root, project.path);
  if (pathHasLink(projectRoot, projectRoot) || !exactPath(projectRoot)) {
    fail("PATH_ESCAPE", `project "${project.id ?? "configured"}" must resolve to its exact canonical path`);
  }
  if (normalized(projectRoot) !== normalized(root) && !escapesRoot(join2(root, ".kai"), projectRoot)) {
    fail("PATH_ESCAPE", "configured project cannot alias private workspace state");
  }
  const publicationRoot = normalizePublicationRoot(project.publication_root);
  const publicationRootAbsolute = resolvePath(projectRoot, ...publicationRoot.split("/"));
  if (escapesRoot(projectRoot, publicationRootAbsolute) || pathHasLink(projectRoot, publicationRootAbsolute) || !exactPath(publicationRootAbsolute)) {
    fail("PATH_ESCAPE", `project "${project.id ?? "configured"}" publication_root escapes the configured project`);
  }
  return {
    project,
    projectRoot,
    publicationRoot,
    publicationRootAbsolute,
    workspaceRoot: root
  };
}

// src/core/lib/workspace-git-privacy.mjs
function workspaceGit(root, args) {
  const env = Object.fromEntries(Object.entries(process.env).filter(([key2]) => !/^GIT_/i.test(key2)));
  return spawnSync("git", ["--no-pager", "-C", root, ...args], {
    encoding: "utf8",
    windowsHide: true,
    env: { ...env, GIT_OPTIONAL_LOCKS: "0" },
    maxBuffer: 16 * 1024 * 1024
  });
}
function inspectGitPrivacy(root, mode) {
  const errors = [], warnings = [], missing = [];
  const git = (args) => workspaceGit(root, args);
  const top = git(["rev-parse", "--show-toplevel"]);
  if (top.status !== 0) {
    if (mode !== "external") warnings.push(`placement "${mode}" is not inside a readable git work tree`);
    return { errors, warnings, missing, gitRoot: null };
  }
  const tracked = git(["ls-files", "-z", "--", ".kai"]);
  if (tracked.status !== 0) {
    errors.push("cannot inspect tracked private workspace state");
    return { errors, warnings, missing, gitRoot: canonicalPath(top.stdout.trim()) };
  }
  const paths = tracked.stdout.split("\0").filter(Boolean);
  if (paths.length) {
    errors.push(`placement "${mode}" has tracked private .kai path(s); these must be untracked: ${paths.join(", ")}`);
  }
  const ignored = (path4) => {
    const result = git(["check-ignore", "--no-index", "-q", "--", path4]);
    if (![0, 1].includes(result.status)) errors.push(`cannot inspect Git privacy for ${path4}`);
    return result.status === 0;
  };
  if (mode === "repo-local" || mode === "external") {
    if (!ignored(".kai/")) missing.push(".kai/");
  } else {
    errors.push(`placement must be "repo-local" or "external" (found ${JSON.stringify(mode)})`);
  }
  return { errors, warnings, missing, gitRoot: canonicalPath(top.stdout.trim()) };
}
function privateAdmission(root) {
  const result = readWorkspaceManifest(root);
  if (!result.ok) return { errors: [result.reason], admitted: [] };
  if (result.manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    return {
      errors: ["workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard"],
      admitted: []
    };
  }
  const privacy = inspectGitPrivacy(root, result.manifest.placement);
  const errors = [
    ...privacy.errors,
    ...privacy.missing.map((path4) => `private workspace path must be ignored: ${path4}`)
  ];
  if (result.manifest.placement === "repo-local" && !privacy.gitRoot) {
    errors.push("repo-local placement requires a readable Git work tree");
  }
  return { errors, admitted: [] };
}

// src/core/lib/coordination-runtime/workspace-guard.mjs
import { existsSync as existsSync3, lstatSync as lstatSync2 } from "node:fs";
import { dirname as dirname4, join as join4, resolve as resolve3 } from "node:path";

// src/core/lib/coordination-runtime/contract.mjs
import { createHash as createHash2 } from "node:crypto";

// src/core/lib/agent-model-policy.mjs
var ROLE_FAMILY_PACK = Object.freeze({
  core: "core",
  eng: "engineering",
  creative: "creative"
});
var ROLE_POSTURES = Object.freeze([
  "lead",
  "builder",
  "reviewer",
  "operator",
  "coordinator",
  "advisor"
]);
var ROLE_POSTURE_PROFILES = Object.freeze({
  lead: Object.freeze(["judgment", "technical-judgment"]),
  builder: Object.freeze(["execution"]),
  reviewer: Object.freeze(["review", "technical-review"]),
  operator: Object.freeze(["operations"]),
  coordinator: Object.freeze(["coordination"]),
  advisor: Object.freeze(["judgment", "technical-judgment", "advisory"])
});
var KIND_AGENT_PROFILES = Object.freeze({
  workflow: Object.freeze(["procedure"]),
  persona: Object.freeze(["simulation"]),
  instructor: Object.freeze(["teaching"])
});
var ROLE_PROFILE_MODELS = Object.freeze({
  judgment: "claude-opus-5",
  "technical-judgment": "gpt-5.6-sol",
  review: "claude-opus-5",
  "technical-review": "gpt-5.6-terra",
  execution: "claude-sonnet-5",
  operations: "claude-sonnet-5",
  coordination: "claude-sonnet-5",
  advisory: "claude-sonnet-5",
  procedure: "claude-sonnet-5",
  teaching: "claude-sonnet-5",
  simulation: "claude-sonnet-5"
});
var KIND_AGENT_FAMILIES = Object.freeze([
  "workflow",
  "persona",
  "instructor"
]);
function agentProfileModelErrors({ id, body, fm = {} }, legacyIds = /* @__PURE__ */ new Set()) {
  const [family, posture] = (id ?? "").split("-");
  const isDurableRole = family in ROLE_FAMILY_PACK && !legacyIds.has(id);
  const isNewKind = KIND_AGENT_FAMILIES.includes(family) && !legacyIds.has(id);
  if (!isDurableRole && !isNewKind) return [];
  const errors = [];
  const profiles = [...(body ?? "").matchAll(
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
    errors.push(`${isDurableRole ? `posture \`${posture}\`` : `kind \`${family}\``} requires primary profile ${(allowed ?? []).map((value) => `\`${value}\``).join(" or ") || "(none)"}, not \`${profile}\``);
  }
  const model = (fm.model ?? "").trim().replace(/^(['"])(.*)\1$/, "$2");
  if (!model) {
    errors.push(`new agent with profile \`${profile}\` must declare frontmatter model "${expected}"`);
  } else if (model !== expected) {
    errors.push(`primary profile \`${profile}\` requires frontmatter model "${expected}", not "${model}"`);
  }
  return errors;
}

// src/core/lib/coordination-runtime/host-schema.mjs
var MAX_OBSERVATIONS = 32;
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var fail2 = (code, message) => {
  throw new RuntimeError(code, message);
};
var invalid = (message) => fail2("INVALID_INPUT", message);
var clone = (value) => JSON.parse(canonicalJson(value));
var exact = (value, keys, label) => assertExactKeys(value, new Set(keys), label);
function text(value, label, max = 512) {
  assertNonEmptyString(value, label);
  if (Buffer.byteLength(value, "utf8") > max) invalid(`${label} exceeds ${max} bytes`);
}
var nullableText = (value, label) => {
  if (value !== null) text(value, label);
};
var uuid = (value, label) => {
  if (!UUID.test(value ?? "")) invalid(`${label} must be a UUID`);
};
var boolean = (value, label) => {
  if (typeof value !== "boolean") invalid(`${label} must be boolean`);
};
var member = (value, choices, label) => {
  if (!choices.includes(value)) invalid(`${label} is unsupported`);
};
var positive = (value, label) => {
  if (!Number.isSafeInteger(value) || value < 1) invalid(`${label} must be a positive safe integer`);
};
var measurement = (value, label, integer = false) => {
  if (value !== null && (typeof value !== "number" || !Number.isFinite(value) || value < 0 || integer && !Number.isSafeInteger(value))) invalid(`${label} is not a valid measurement`);
};
function validateCapabilities(value) {
  exact(value, ["peerDispatch", "resume", "modelOverride", "usage", "models", "efforts"], "capabilities");
  for (const key2 of ["peerDispatch", "resume", "modelOverride", "usage"]) boolean(value[key2], key2);
  for (const key2 of ["models", "efforts"]) {
    if (!Array.isArray(value[key2]) || new Set(value[key2]).size !== value[key2].length) invalid(`${key2} must be unique`);
    value[key2].forEach((entry) => text(entry, key2));
  }
}
function approvedProfileModel(role, profile) {
  const model = Object.hasOwn(ROLE_PROFILE_MODELS, profile ?? "") ? ROLE_PROFILE_MODELS[profile] : null;
  if (!model) invalid("role has no approved primary profile");
  const errors = agentProfileModelErrors({ id: role, body: `**Primary profile:** ${profile}`, fm: { model } });
  if (errors.length) invalid(errors.join("; "));
  return model;
}
function validateHostCommand(command2) {
  const p = command2.payload;
  const attempt = command2.kind.startsWith("attempt.");
  if (command2.recordKind !== (attempt ? "host-attempt" : "effect")) invalid("host command recordKind mismatch");
  uuid(command2.recordId, "host recordId");
  if (command2.kind.endsWith(".result")) {
    exact(p, attempt ? ["observationId"] : ["attemptId", "observationId"], "result payload");
    uuid(p.observationId, "observationId");
    if (!attempt) uuid(p.attemptId, "attemptId");
    positive(command2.expectedVersion, "result expectedVersion");
    if (command2.leaseToken !== null) invalid("host observations do not use acting leases");
    return;
  }
  if (command2.expectedVersion !== 0) invalid("host intent creation expects version 0");
  const common = ["taskId", "taskVersion", "createdAt"];
  exact(p, [...common, ...attempt ? ["target", "profile", "requestedModel", "effort", "independenceKey", "resumeFrom"] : ["attemptId", "intendedAction", "idempotencyKey", "external", "paid"]], "intent payload");
  text(p.taskId, "taskId");
  positive(p.taskVersion, "taskVersion");
  assertTimestamp(p.createdAt, "createdAt");
  if (attempt) {
    validateActor(p.target);
    for (const key2 of ["profile", "requestedModel", "independenceKey"]) text(p[key2], key2);
    nullableText(p.effort, "effort");
    if (p.resumeFrom !== null) uuid(p.resumeFrom, "resumeFrom");
  } else {
    uuid(p.attemptId, "attemptId");
    text(p.intendedAction, "intendedAction", 2048);
    nullableText(p.idempotencyKey, "idempotencyKey");
    boolean(p.external, "external");
    boolean(p.paid, "paid");
  }
}
var attemptFactKeys = [
  "status",
  "liveness",
  "sessionId",
  "actualRole",
  "actualProfile",
  "actualModel",
  "actualEffort",
  "inputTokens",
  "outputTokens",
  "cost",
  "usage",
  "durationMs",
  "response",
  "exitCode"
];
var effectFactKeys = ["outcome", "response"];
var pick = (value, keys) => Object.fromEntries(keys.map((key2) => [key2, value[key2] ?? null]));
function sanitizeFacts(raw, effect = false) {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) invalid("host facts must be an object");
  const facts = pick(raw, effect ? effectFactKeys : attemptFactKeys);
  if (!effect && facts.usage !== null) {
    const value = facts.usage;
    if (typeof value !== "object" || Array.isArray(value)) invalid("usage must be an object");
    facts.usage = pick(value, ["scope", "sessionId", "totalNanoAiu", "totalPremiumRequests"]);
  }
  if (!effect && facts.cost !== null) {
    const value = facts.cost;
    if (typeof value !== "object" || Array.isArray(value)) invalid("cost requires an explicit unit and scope");
    facts.cost = pick(value, ["amount", "currency", "scope", "sessionId"]);
  }
  return clone(facts);
}
function validateFacts(facts, source, effect) {
  exact(facts, effect ? effectFactKeys : attemptFactKeys, "observation facts");
  if (facts.response !== null) {
    if (typeof facts.response !== "string" || Buffer.byteLength(facts.response, "utf8") > 8192) {
      invalid("user-facing response must be at most 8192 bytes");
    }
  }
  if (effect) {
    member(facts.outcome, ["unknown", "succeeded", "not-applied"], "effect outcome");
    if (source !== "host" && facts.outcome !== "unknown") invalid("local timing cannot establish an external effect outcome");
    return;
  }
  member(facts.status, ["completed", "failed", "timeout", "acknowledgement-lost"], "host status");
  member(facts.liveness, ["stopped", "running", "unknown"], "host liveness");
  for (const key2 of ["sessionId", "actualRole", "actualProfile", "actualModel", "actualEffort"]) nullableText(facts[key2], key2);
  for (const key2 of ["inputTokens", "outputTokens"]) measurement(facts[key2], key2, true);
  measurement(facts.durationMs, "durationMs");
  if (facts.exitCode !== null && !Number.isSafeInteger(facts.exitCode)) invalid("exitCode must be an integer or null");
  if (facts.usage !== null) {
    const u = facts.usage;
    exact(u, ["scope", "sessionId", "totalNanoAiu", "totalPremiumRequests"], "usage");
    if (u.scope !== "session-cumulative" || u.sessionId === null || u.sessionId !== facts.sessionId) {
      invalid("usage checkpoints require the exact cumulative session identity");
    }
    measurement(u.totalNanoAiu, "totalNanoAiu", true);
    measurement(u.totalPremiumRequests, "totalPremiumRequests");
  }
  if (facts.cost !== null) {
    const c = facts.cost;
    exact(c, ["amount", "currency", "scope", "sessionId"], "cost");
    measurement(c.amount, "cost.amount");
    if (c.amount === null || !/^[A-Z]{3}$/.test(c.currency ?? "")) invalid("cost requires an observed currency amount");
    member(c.scope, ["attempt", "session-cumulative"], "cost.scope");
    if (c.scope === "attempt" ? c.sessionId !== null : c.sessionId === null || c.sessionId !== facts.sessionId) {
      invalid("cost session identity does not match its scope");
    }
  }
  if (source === "local") {
    if (!["timeout", "acknowledgement-lost"].includes(facts.status) || facts.liveness !== "unknown" || attemptFactKeys.filter((key2) => !["status", "liveness", "durationMs"].includes(key2)).some((key2) => facts[key2] !== null)) {
      invalid("local observations may only establish elapsed timing and uncertain acknowledgement/liveness");
    }
  }
}
function validateHostObservation(value, effect = false) {
  exact(value, ["observationId", "source", "capturedAt", "facts", "sessionConflicts"], "host observation");
  uuid(value.observationId, "observationId");
  member(value.source, ["host", "local"], "observation source");
  assertTimestamp(value.capturedAt, "capturedAt");
  if (!Array.isArray(value.sessionConflicts) || new Set(value.sessionConflicts).size !== value.sessionConflicts.length || effect && value.sessionConflicts.length !== 0) invalid("invalid observed session conflicts");
  value.sessionConflicts.forEach((id) => uuid(id, "session conflict attempt"));
  validateFacts(value.facts, value.source, effect);
}
var isTerminalObservation = (o) => o.source === "host" && o.facts.liveness === "stopped" && ["completed", "failed"].includes(o.facts.status);
function latestTerminalObservations(body) {
  const terminal2 = body.observations.filter(isTerminalObservation);
  const latest = Math.max(...terminal2.map((o) => Date.parse(o.capturedAt)));
  return terminal2.filter((o) => Date.parse(o.capturedAt) === latest);
}
function attemptSummary(body) {
  const gaps = /* @__PURE__ */ new Set();
  const terminal2 = [];
  for (const observation of body.observations) {
    const f = observation.facts;
    if (observation.sessionConflicts.length) gaps.add("SESSION_BOUNDARY_MISMATCH");
    if (f.actualModel === null) gaps.add("MODEL_UNKNOWN");
    else if (f.actualModel !== body.requested_model) gaps.add("MODEL_MISMATCH");
    for (const [actual, requested, label] of [
      ["actualEffort", "requested_effort", "EFFORT"],
      ["actualProfile", "profile", "PROFILE"]
    ]) {
      if (body[requested] !== null && f[actual] === null) gaps.add(`${label}_UNKNOWN`);
      else if (f[actual] !== null && body[requested] !== null && f[actual] !== body[requested]) gaps.add(`${label}_MISMATCH`);
    }
    if (f.actualRole !== null && f.actualRole !== body.target.role) gaps.add("ROLE_MISMATCH");
    if (body.context === "resume") {
      if (f.sessionId === null) gaps.add("SESSION_UNKNOWN");
      else if (f.sessionId !== body.resume_session_id) gaps.add("SESSION_MISMATCH");
    }
    if (f.exitCode !== null && f.exitCode !== 0) gaps.add("EXIT_FAILURE");
    if (f.status === "failed") gaps.add("HOST_FAILURE");
    if (f.liveness === "unknown") gaps.add("LIVENESS_UNKNOWN");
    if (f.status === "acknowledgement-lost") gaps.add("ACKNOWLEDGEMENT_LOST");
    if (f.status === "timeout") gaps.add("TIMEOUT");
    if (isTerminalObservation(observation)) terminal2.push(f);
  }
  let status = body.observations.length === 0 ? "intent" : "uncertain";
  if (terminal2.length) {
    const latest = latestTerminalObservations(body);
    status = latest[0].facts.status;
    if (gaps.has("EXIT_FAILURE")) status = "failed";
    if ([...gaps].some((gap3) => gap3.endsWith("_MISMATCH"))) status = "mismatched";
    const disagreement = terminal2.some((f) => f.status !== terminal2[0].status);
    const identities = ["sessionId", "actualModel", "actualRole", "actualProfile"];
    if (disagreement || identities.some((key2) => new Set(terminal2.map((f) => f[key2]).filter((v) => v !== null)).size > 1)) {
      gaps.add("CONFLICTING_RESULTS");
      status = "conflicting";
    }
    const current = body.observations.filter((o) => o.source === "host" && Date.parse(o.capturedAt) >= Date.parse(latest[0].capturedAt));
    if (current.some((o) => o.facts.liveness === "running")) {
      gaps.add("CONFLICTING_RESULTS");
      status = "conflicting";
    } else if (["completed", "failed"].includes(status) && current.some((o) => o.facts.liveness === "unknown")) {
      status = "uncertain";
    }
  }
  return { status, gaps: [...gaps].sort() };
}
function effectSummary(body) {
  const outcomes = new Set(body.observations.map((o) => o.facts.outcome).filter((o) => o !== "unknown"));
  const outcome = outcomes.size > 1 ? "conflicting" : [...outcomes][0] ?? "unknown";
  return { outcome, gaps: outcome === "conflicting" ? ["CONFLICTING_RESULTS"] : outcome === "unknown" ? ["EFFECT_OUTCOME_UNKNOWN"] : [] };
}
function validateHostRecord(body, label, effect = false) {
  const common = ["schema_version", "subject", "subject_version", "actor", "created_at", "observations", "gaps"];
  exact(body, [...common, ...effect ? ["effect_id", "attempt_id", "intended_action", "idempotency_key", "external", "paid", "outcome"] : [
    "attempt_id",
    "target",
    "agent_id",
    "profile",
    "requested_model",
    "requested_effort",
    "independence_key",
    "context",
    "resume_from",
    "resume_session_id",
    "capabilities",
    "settings",
    "status"
  ]], label);
  if (body.schema_version !== 1) invalid("host record schema_version must be 1");
  exact(body.subject, ["kind", "id"], "subject");
  if (body.subject.kind !== "task") invalid("host record subject must be a Task");
  text(body.subject.id, "subject.id");
  positive(body.subject_version, "subject_version");
  validateActor(body.actor);
  assertTimestamp(body.created_at, "created_at");
  uuid(body.attempt_id, "attempt_id");
  if (!Array.isArray(body.observations) || body.observations.length > MAX_OBSERVATIONS) invalid("observation bound exceeded");
  body.observations.forEach((o) => validateHostObservation(o, effect));
  if (new Set(body.observations.map((o) => o.observationId)).size !== body.observations.length) invalid("duplicate observation IDs");
  if (effect) {
    uuid(body.effect_id, "effect_id");
    text(body.intended_action, "intended_action", 2048);
    nullableText(body.idempotency_key, "idempotency_key");
    boolean(body.external, "external");
    boolean(body.paid, "paid");
  } else {
    validateActor(body.target);
    for (const key2 of ["agent_id", "profile", "requested_model", "independence_key"]) text(body[key2], key2);
    if (body.requested_model !== approvedProfileModel(body.target.role, body.profile)) {
      invalid("host record requested model must match its approved primary profile");
    }
    nullableText(body.requested_effort, "requested_effort");
    member(body.context, ["fresh-single-shot", "resume"], "context");
    nullableText(body.resume_session_id, "resume_session_id");
    if (body.resume_from !== null) uuid(body.resume_from, "resume_from");
    if (body.context === "resume" ? body.resume_from === null || body.resume_session_id === null : body.resume_from !== null || body.resume_session_id !== null) invalid("resume context identity mismatch");
    validateCapabilities(body.capabilities);
    assertExactKeys(body.settings, /* @__PURE__ */ new Set(["model", "effort"]), "settings", /* @__PURE__ */ new Set());
    if (Object.hasOwn(body.settings, "model") && (!body.capabilities.modelOverride || body.settings.model !== body.requested_model)) invalid("unsupported model override");
    if (Object.hasOwn(body.settings, "effort") && (body.settings.effort !== body.requested_effort || !body.capabilities.efforts.includes(body.settings.effort))) invalid("unsupported effort override");
    if (body.requested_effort !== null && body.settings.effort !== body.requested_effort) {
      invalid("host record must carry the supported requested effort");
    }
    if (!body.capabilities.models.includes(body.requested_model) || body.capabilities.modelOverride && body.settings.model !== body.requested_model) {
      invalid("host record must retain the available model and supported override");
    }
  }
  const summary = effect ? effectSummary(body) : attemptSummary(body);
  for (const [key2, value] of Object.entries(summary)) {
    if (canonicalJson(body[key2]) !== canonicalJson(value)) invalid(`host ${key2} does not match retained observations`);
  }
}
function validateHostMutation(command2, current, nextBody) {
  if (!Array.isArray(nextBody.observations)) invalid("host mutation requires an observations array");
  const result = command2.kind.endsWith(".result");
  if (!result) {
    if (current) invalid("host intent requires a missing record");
    if (nextBody.subject?.kind !== "task" || nextBody.subject.id !== command2.payload.taskId || nextBody.subject_version !== command2.payload.taskVersion || canonicalJson(nextBody.actor) !== canonicalJson(command2.actor) || nextBody.created_at !== command2.payload.createdAt || nextBody.observations.length !== 0) {
      invalid("host intent must preserve the command identity");
    }
    const fields2 = command2.kind === "attempt.start" ? {
      target: "target",
      profile: "profile",
      requestedModel: "requested_model",
      effort: "requested_effort",
      independenceKey: "independence_key",
      resumeFrom: "resume_from"
    } : {
      attemptId: "attempt_id",
      intendedAction: "intended_action",
      idempotencyKey: "idempotency_key",
      external: "external",
      paid: "paid"
    };
    for (const [payloadKey, bodyKey] of Object.entries(fields2)) {
      if (canonicalJson(command2.payload[payloadKey]) !== canonicalJson(nextBody[bodyKey])) {
        invalid(`host intent must preserve payload.${payloadKey}`);
      }
    }
    return;
  }
  if (!current) invalid("host result requires an existing intent");
  const allowed = /* @__PURE__ */ new Set(["observations", "gaps", command2.recordKind === "effect" ? "outcome" : "status"]);
  for (const key2 of /* @__PURE__ */ new Set([...Object.keys(current.body), ...Object.keys(nextBody)])) {
    if (!allowed.has(key2) && canonicalJson(current.body[key2]) !== canonicalJson(nextBody[key2])) {
      invalid(`host result cannot change ${key2}`);
    }
  }
  if (nextBody.observations.length < current.body.observations.length || nextBody.observations.length > current.body.observations.length + 1 || canonicalJson(nextBody.observations.slice(0, current.body.observations.length)) !== canonicalJson(current.body.observations) || !nextBody.observations.some((o) => o.observationId === command2.payload.observationId)) {
    invalid("host observations are append-only and bound to the command");
  }
}

// src/core/lib/coordination-runtime/hierarchy-contract.mjs
import { createHash } from "node:crypto";

// src/core/lib/coordination-runtime/schema.mjs
var frozen = (value) => Object.freeze(value);
var mutationRefused = () => {
  throw new TypeError("coordination schema collections are read-only");
};
var readonlyMap = (entries) => {
  const data = new Map(entries);
  Object.defineProperties(data, {
    set: { value: mutationRefused },
    delete: { value: mutationRefused },
    clear: { value: mutationRefused }
  });
  return frozen(data);
};
var readonlySet = (values) => {
  const data = new Set(values);
  Object.defineProperties(data, {
    add: { value: mutationRefused },
    delete: { value: mutationRefused },
    clear: { value: mutationRefused }
  });
  return frozen(data);
};
var record = (validator) => frozen({ validator });
var command = (subjectKind, authority, validator, handler, allowedMutations = []) => frozen({
  subjectKind,
  authority: frozen(authority),
  validator,
  handler,
  allowedMutations: frozen(allowedMutations)
});
var parentUpdateFields = /* @__PURE__ */ new Map([
  ["epic", [
    "title",
    "owner",
    "scope_authority",
    "completion_authority",
    "priority",
    "outcome",
    "acceptance",
    "direction_ref",
    "contribution",
    "scope_fit",
    "required_features",
    "optional_features",
    "updated_at"
  ]],
  ["feature", [
    "title",
    "owner",
    "scope_authority",
    "completion_authority",
    "priority",
    "outcome",
    "acceptance",
    "required_requirements",
    "optional_requirements",
    "depends_on_features",
    "updated_at"
  ]],
  ["requirement", [
    "title",
    "owner",
    "scope_authority",
    "completion_authority",
    "priority",
    "outcome",
    "acceptance",
    "required_tasks",
    "optional_tasks",
    "updated_at"
  ]]
]);
var taskUpdateFields = [
  "title",
  "priority",
  "next_role",
  "outcome",
  "acceptance",
  "artifact_expectation",
  "artifact_expectation_reason",
  "artifact_class",
  "durability",
  "validity_owner",
  "artifact_targets",
  "context_artifacts",
  "touches",
  "depends_on",
  "updated_at"
];
var records = readonlyMap([
  ["epic", record("hierarchy")],
  ["feature", record("hierarchy")],
  ["requirement", record("hierarchy")],
  ["task", record("task")],
  ["question", record("contract")],
  ["attempt", record("contract")],
  ["host-attempt", record("host")],
  ["artifact", record("contract")],
  ["asset", record("contract")],
  ["evidence", record("contract")],
  ["review", record("contract")],
  ["approval", record("contract")],
  ["effect", record("host")],
  ["message", record("contract")],
  ["grant", record("contract")]
]);
var commandEntries = /* @__PURE__ */ new Map();
for (const kind of ["epic", "feature", "requirement"]) {
  commandEntries.set(
    `${kind}.create`,
    command(kind, ["host"], "hierarchy", `${kind}.create`)
  );
  commandEntries.set(
    `${kind}.update`,
    command(kind, ["host", "named"], "hierarchy", `${kind}.update`, parentUpdateFields.get(kind))
  );
  commandEntries.set(
    `${kind}.activate`,
    command(kind, ["host"], "hierarchy", `${kind}.activate`, ["state", "updated_at"])
  );
  commandEntries.set(
    `${kind}.hold`,
    command(kind, ["named"], "hierarchy", `${kind}.hold`, ["hold", "updated_at"])
  );
  commandEntries.set(
    `${kind}.release`,
    command(kind, ["named"], "hierarchy", `${kind}.release`, ["hold", "updated_at"])
  );
  commandEntries.set(
    `${kind}.complete`,
    command(
      kind,
      ["host"],
      "hierarchy",
      `${kind}.complete`,
      ["state", "completion_disposition", "updated_at"]
    )
  );
}
commandEntries.set(
  "task.create",
  command("task", ["grant"], "task", "task.create")
);
commandEntries.set(
  "task.update",
  command("task", ["acting"], "task", "task.update", taskUpdateFields)
);
commandEntries.set(
  "task.promote",
  command("task", ["named"], "task", "task.promote", ["state", "updated_at"])
);
commandEntries.set(
  "task.grant",
  command(
    "task",
    ["grant"],
    "task",
    "task.grant",
    ["state", "resume_state", "producer_actor", "producing_actors", "next_role", "lease", "updated_at"]
  )
);
commandEntries.set(
  "task.transition",
  command(
    "task",
    ["acting", "named"],
    "task",
    "task.transition",
    ["state", "resume_state", "acceptance_actor", "next_role", "lease", "change_ref", "updated_at"]
  )
);
commandEntries.set(
  "task.handoff",
  command(
    "task",
    ["acting", "leased", "named"],
    "task",
    "task.handoff",
    ["state", "resume_state", "acceptance_actor", "next_role", "lease", "change_ref", "updated_at"]
  )
);
commandEntries.set(
  "task.restore",
  command(
    "task",
    ["host"],
    "task",
    "task.restore",
    ["state", "resume_state", "next_role", "recovery_hold", "updated_at"]
  )
);
commandEntries.set(
  "question.open",
  command(
    "hierarchy",
    ["acting", "grant"],
    "message",
    "question.open",
    ["state", "resume_state", "lease", "waiting_on_questions", "updated_at"]
  )
);
commandEntries.set(
  "question.answer",
  command(
    "hierarchy",
    ["actor", "grant", "host"],
    "message",
    "question.answer",
    ["state", "resume_state", "lease", "waiting_on_questions", "updated_at"]
  )
);
commandEntries.set(
  "attempt.recover",
  command(
    "task",
    ["grant", "host"],
    "recovery",
    "attempt.recover",
    [
      "state",
      "resume_state",
      "next_role",
      "lease",
      "producer_actor",
      "producing_actors",
      "recovery_hold",
      "updated_at"
    ]
  )
);
commandEntries.set(
  "attempt.start",
  command("task", ["host"], "host", "attempt.start")
);
commandEntries.set(
  "attempt.result",
  command(
    "task",
    ["host"],
    "host",
    "attempt.result",
    ["observations", "gaps", "status"]
  )
);
commandEntries.set(
  "effect.intent",
  command("task", ["host"], "host", "effect.intent")
);
commandEntries.set(
  "effect.result",
  command(
    "task",
    ["host"],
    "host",
    "effect.result",
    ["observations", "gaps", "outcome"]
  )
);
for (const kind of [
  "artifact.register",
  "asset.transition",
  "evidence.register",
  "review.record",
  "approval.record"
]) {
  commandEntries.set(kind, command(
    "hierarchy",
    ["acting", "leased", "named", "host"],
    "producer",
    kind
  ));
}
var commands = readonlyMap(commandEntries);
var COORDINATION_SCHEMA = frozen({ records, commands });
var RECORD_KINDS = readonlySet(records.keys());
var COMMAND_KINDS = readonlySet(commands.keys());
var HIERARCHY_KINDS = readonlySet(
  [...records].filter(([, declaration]) => declaration.validator === "hierarchy" || declaration.validator === "task").map(([kind]) => kind)
);
var PARENT_COMMAND_KINDS = readonlySet(
  [...commands].filter(([, declaration]) => declaration.validator === "hierarchy").map(([kind]) => kind)
);
var TASK_COMMAND_KINDS = readonlySet(
  [...commands].filter(([, declaration]) => declaration.validator === "task").map(([kind]) => kind)
);
var HOST_COMMAND_KINDS = readonlySet(
  [...commands].filter(([, declaration]) => declaration.validator === "host").map(([kind]) => kind)
);
function recordKind(kind) {
  return records.get(kind) ?? null;
}
function commandKind(kind) {
  return commands.get(kind) ?? null;
}

// src/core/lib/coordination-runtime/task-contract.mjs
var ITEM_DELIVERY_CLASSES = /* @__PURE__ */ new Set(["knowledge", "product-change", "operational"]);
var PROVENANCE_KINDS = /* @__PURE__ */ new Set(["live-peer", "durable-thread", "operator"]);
var TASK_BODY_FIELDS = /* @__PURE__ */ new Set([
  "schema_version",
  "id",
  "pack",
  "feature_id",
  "satisfies",
  "title",
  "delivery_class",
  "state",
  "resume_state",
  "scope_authority",
  "completion_authority",
  "producer_actor",
  "producing_actors",
  "acceptance_actor",
  "priority",
  "next_role",
  "outcome",
  "acceptance",
  "artifact_expectation",
  "artifact_expectation_reason",
  "artifact_class",
  "durability",
  "validity_owner",
  "artifact_targets",
  "context_artifacts",
  "touches",
  "depends_on",
  "lease",
  "recovery_hold",
  "waiting_on_questions",
  "review_requirements",
  "change_ref",
  "updated_at"
]);
var TASK_UPDATE_FIELDS = /* @__PURE__ */ new Set([
  "title",
  "priority",
  "next_role",
  "outcome",
  "acceptance",
  "artifact_expectation",
  "artifact_expectation_reason",
  "artifact_class",
  "durability",
  "validity_owner",
  "artifact_targets",
  "context_artifacts",
  "touches",
  "depends_on",
  "updated_at"
]);
function validateDependencies(value, label, { entryKey, typedKind = null } = {}) {
  if (!Array.isArray(value)) invalid2(`${label} must be an array`);
  const seen = /* @__PURE__ */ new Set();
  for (const [index, dependency] of value.entries()) {
    assertExactKeys(dependency, /* @__PURE__ */ new Set([entryKey, "requires"]), `${label}[${index}]`);
    assertNonEmptyString(dependency[entryKey], `${label}[${index}].${entryKey}`);
    if (typedKind !== null) parseTypedId(dependency[entryKey], typedKind, `${label}[${index}].${entryKey}`);
    if (!TASK_DEPENDENCY_STATES.has(dependency.requires)) {
      invalid2(`${label}[${index}].requires is unsupported`);
    }
    if (seen.has(dependency[entryKey])) {
      invalid2(`${label} contains duplicate ${entryKey} "${dependency[entryKey]}"`);
    }
    seen.add(dependency[entryKey]);
  }
}
function validateReviewRequirements(value, label) {
  if (!Array.isArray(value)) invalid2(`${label} must be an array`);
  const seen = /* @__PURE__ */ new Set();
  for (const [index, requirement] of value.entries()) {
    assertExactKeys(requirement, /* @__PURE__ */ new Set(["role", "kind"]), `${label}[${index}]`);
    assertNonEmptyString(requirement.role, `${label}[${index}].role`);
    assertNonEmptyString(requirement.kind, `${label}[${index}].kind`);
    const key2 = `${requirement.role}\0${requirement.kind}`;
    if (seen.has(key2)) invalid2(`${label} contains a duplicate requirement`);
    seen.add(key2);
  }
}
function validateLease(value, label) {
  if (value === null) return;
  assertExactKeys(value, /* @__PURE__ */ new Set([
    "holder",
    "token",
    "version_at_grant",
    "acquired_at",
    "expires_at"
  ]), label);
  validateActor(value.holder, `${label}.holder`);
  assertNonEmptyString(value.token, `${label}.token`);
  if (!Number.isSafeInteger(value.version_at_grant) || value.version_at_grant < 1) {
    invalid2(`${label}.version_at_grant must be a positive safe integer`);
  }
  assertTimestamp(value.acquired_at, `${label}.acquired_at`);
  assertTimestamp(value.expires_at, `${label}.expires_at`);
}
function validateTaskSatisfies(value, label, pack) {
  assertStringArray(value, label, { nonEmpty: true });
  for (const [index, id] of value.entries()) {
    const parsed = parseTypedId(id, "requirement", `${label}[${index}]`);
    if (parsed.pack !== pack) invalid2(`${label} must stay within the task pack`);
  }
}
function validateTaskBody(body, label = "task") {
  assertExactKeys(body, TASK_BODY_FIELDS, label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  for (const key2 of [
    "id",
    "title",
    "pack",
    "feature_id",
    "scope_authority",
    "completion_authority",
    "outcome"
  ]) {
    assertNonEmptyString(body[key2], `${label}.${key2}`);
  }
  if (!ITEM_DELIVERY_CLASSES.has(body.delivery_class)) {
    invalid2(`${label}.delivery_class is unsupported`);
  }
  if (!TASK_LIFECYCLE.has(body.state)) invalid2(`${label}.state is unsupported`);
  if (body.resume_state !== null && (!TASK_LIFECYCLE.has(body.resume_state) || body.resume_state === "blocked")) {
    invalid2(`${label}.resume_state is unsupported`);
  }
  if (!PACKS.has(body.pack)) invalid2(`${label}.pack is unsupported`);
  const taskId = parseTypedId(body.id, "task", `${label}.id`);
  if (taskId.pack !== body.pack) invalid2(`${label}.pack must match its typed id`);
  const featureId = parseTypedId(body.feature_id, "feature", `${label}.feature_id`);
  if (featureId.pack !== body.pack) {
    invalid2(`${label}.feature_id must stay within the task pack`);
  }
  validateTaskSatisfies(body.satisfies, `${label}.satisfies`, body.pack);
  validateNullableActor(body.producer_actor, `${label}.producer_actor`);
  if (!Array.isArray(body.producing_actors)) invalid2(`${label}.producing_actors must be an array`);
  body.producing_actors.forEach((entry, index) => validateActor(entry, `${label}.producing_actors[${index}]`));
  if (body.producer_actor && !body.producing_actors.some((entry) => entry.role === body.producer_actor.role && entry.runId === body.producer_actor.runId)) {
    invalid2(`${label}.producing_actors must retain the current producer`);
  }
  validateNullableActor(body.acceptance_actor, `${label}.acceptance_actor`);
  if (!Number.isSafeInteger(body.priority) || body.priority < 0) {
    invalid2(`${label}.priority must be a non-negative safe integer`);
  }
  assertNullableString(body.next_role, `${label}.next_role`);
  assertStringArray(body.acceptance, `${label}.acceptance`, { nonEmpty: true });
  if (!(/* @__PURE__ */ new Set(["owed", "none"])).has(body.artifact_expectation)) {
    invalid2(`${label}.artifact_expectation is unsupported`);
  }
  assertNullableString(body.artifact_expectation_reason, `${label}.artifact_expectation_reason`);
  for (const key2 of ["artifact_class", "durability", "validity_owner"]) {
    assertNullableString(body[key2], `${label}.${key2}`);
  }
  if (body.artifact_expectation === "none" && body.artifact_expectation_reason === null) {
    invalid2(`${label}.artifact_expectation_reason is required when no artifact is owed`);
  }
  if (body.artifact_expectation === "owed" && [body.artifact_class, body.durability, body.validity_owner].includes(null)) {
    invalid2(`${label} requires artifact class, durability, and validity owner`);
  }
  for (const key2 of ["artifact_targets", "context_artifacts", "touches", "waiting_on_questions"]) {
    assertStringArray(body[key2], `${label}.${key2}`);
  }
  validateDependencies(body.depends_on, `${label}.depends_on`, {
    entryKey: "task",
    typedKind: "task"
  });
  validateLease(body.lease, `${label}.lease`);
  if (body.recovery_hold !== null) {
    assertUuid(body.recovery_hold, `${label}.recovery_hold`);
    if (body.state !== "blocked" && body.state !== "dropped") {
      invalid2(`${label}.recovery_hold requires blocked or dropped state`);
    }
  }
  validateReviewRequirements(body.review_requirements, `${label}.review_requirements`);
  validateNullableSubject(body.change_ref, `${label}.change_ref`);
  assertTimestamp(body.updated_at, `${label}.updated_at`);
  if (body.acceptance_actor && body.producing_actors.some((entry) => entry.runId === body.acceptance_actor.runId)) {
    invalid2(`${label} cannot name its producing run as acceptance actor`);
  }
  if (body.producer_actor && body.producer_actor.role === body.completion_authority && body.review_requirements.some((requirement) => requirement.kind === "product-design-acceptance")) {
    invalid2(`${label} producing designer cannot be its completion authority`);
  }
  if (body.state === "blocked") {
    if (body.resume_state === null) invalid2(`${label}.resume_state is required while blocked`);
  } else if (body.resume_state !== null) {
    invalid2(`${label}.resume_state is only valid while blocked`);
  }
  if (body.lease !== null && body.lease.version_at_grant >= Number.MAX_SAFE_INTEGER) {
    invalid2(`${label}.lease.version_at_grant is invalid`);
  }
  return body;
  return body;
}
function validateCreate(command2, expectedKind, bodyValidator2) {
  if (command2.recordKind !== expectedKind) {
    invalid2(`${command2.kind} requires recordKind "${expectedKind}"`);
  }
  if (command2.expectedVersion !== 0) invalid2(`${command2.kind} requires version 0`);
  if (command2.leaseToken !== null) invalid2(`${command2.kind} cannot carry a lease token`);
  assertExactKeys(command2.payload, /* @__PURE__ */ new Set(["body"]), `${command2.kind} payload`);
  bodyValidator2(command2.payload.body, `${command2.kind} payload.body`);
  if (command2.payload.body.id !== command2.recordId) {
    invalid2(`${command2.kind} body id must match command.recordId`);
  }
}
function validateTaskLikeUpdate(command2, { commandKind: commandKind2, recordKind: recordKind2, fields: fields2 }) {
  if (command2.recordKind !== recordKind2) {
    invalid2(`${commandKind2} requires recordKind "${recordKind2}"`);
  }
  if (command2.expectedVersion < 1) {
    invalid2(`${commandKind2} requires an existing record version`);
  }
  if (Object.keys(command2.payload).length === 1 && Object.hasOwn(command2.payload, "title")) {
    assertNonEmptyString(command2.payload.title, `${commandKind2} payload.title`);
    return;
  }
  validateChangesPayload(command2, fields2, commandKind2);
}
function validateAtPayload(command2, kind, recordKind2, keys) {
  if (command2.recordKind !== recordKind2) invalid2(`${kind} requires recordKind "${recordKind2}"`);
  if (command2.expectedVersion < 1) invalid2(`${kind} requires an existing record version`);
  assertExactKeys(command2.payload, new Set(keys), `${kind} payload`);
}
function validateTaskLikePromote(command2, { kind, recordKind: recordKind2 }) {
  validateAtPayload(command2, kind, recordKind2, ["at"]);
  assertTimestamp(command2.payload.at, `${kind} payload.at`);
}
function validateTaskLikeGrant(command2, { kind, recordKind: recordKind2, actions }) {
  validateAtPayload(command2, kind, recordKind2, ["holder", "actions", "acquiredAt", "expiresAt"]);
  validateActor(command2.payload.holder, `${kind} payload.holder`);
  assertStringArray(command2.payload.actions, `${kind} payload.actions`, { nonEmpty: true });
  for (const action of command2.payload.actions) {
    if (!actions.has(action)) {
      invalid2(`${kind} payload.actions contains unsupported action "${action}"`);
    }
  }
  assertTimestamp(command2.payload.acquiredAt, `${kind} payload.acquiredAt`);
  assertTimestamp(command2.payload.expiresAt, `${kind} payload.expiresAt`);
  if (Date.parse(command2.payload.expiresAt) <= Date.parse(command2.payload.acquiredAt)) {
    invalid2(`${kind} payload.expiresAt must be after acquiredAt`);
  }
}
function validateTaskLikeTransition(command2, { kind, recordKind: recordKind2 }) {
  if (command2.recordKind !== recordKind2) invalid2(`${kind} requires recordKind "${recordKind2}"`);
  if (command2.expectedVersion < 1) invalid2(`${kind} requires an existing record version`);
  assertExactKeys(
    command2.payload,
    /* @__PURE__ */ new Set(["to", "at", "reason", "subject"]),
    `${kind} payload`,
    /* @__PURE__ */ new Set(["to", "at", "reason"])
  );
  if (!TASK_LIFECYCLE.has(command2.payload.to)) invalid2(`${kind} payload.to is unsupported`);
  assertTimestamp(command2.payload.at, `${kind} payload.at`);
  assertNonEmptyString(command2.payload.reason, `${kind} payload.reason`);
  if (Object.hasOwn(command2.payload, "subject")) {
    validateNullableSubject(command2.payload.subject, `${kind} payload.subject`);
  }
  if (command2.payload.to === "in-review" && (!Object.hasOwn(command2.payload, "subject") || command2.payload.subject === null)) {
    invalid2(`${kind} to in-review requires a subject`);
  }
}
function validateHandoffContent(content, label) {
  assertExactKeys(content, /* @__PURE__ */ new Set([
    "did",
    "needs",
    "assetState",
    "authority",
    "revalidation",
    "questions"
  ]), label);
  for (const key2 of ["did", "needs", "assetState", "authority", "revalidation"]) {
    assertNonEmptyString(content[key2], `${label}.${key2}`);
  }
  assertStringArray(content.questions, `${label}.questions`);
}
function validateTaskLikeHandoff(command2, { kind, recordKind: recordKind2 }) {
  if (command2.recordKind !== recordKind2) invalid2(`${kind} requires recordKind "${recordKind2}"`);
  if (command2.expectedVersion < 1) invalid2(`${kind} requires an existing record version`);
  const required2 = /* @__PURE__ */ new Set([
    "toRole",
    "state",
    "createdAt",
    "messageId",
    "parentId",
    "content",
    "artifactRefs",
    "evidenceRefs",
    "provenance"
  ]);
  assertExactKeys(
    command2.payload,
    /* @__PURE__ */ new Set([...required2, "subject"]),
    `${kind} payload`,
    required2
  );
  assertNonEmptyString(command2.payload.toRole, `${kind} payload.toRole`);
  if (command2.payload.state !== null && !TASK_LIFECYCLE.has(command2.payload.state)) {
    invalid2(`${kind} payload.state is unsupported`);
  }
  if (Object.hasOwn(command2.payload, "subject")) {
    validateNullableSubject(command2.payload.subject, `${kind} payload.subject`);
  }
  if (command2.payload.state === "in-review" && (!Object.hasOwn(command2.payload, "subject") || command2.payload.subject === null)) {
    invalid2(`${kind} to in-review requires a subject`);
  }
  assertTimestamp(command2.payload.createdAt, `${kind} payload.createdAt`);
  assertUuid(command2.payload.messageId, `${kind} payload.messageId`);
  if (command2.payload.parentId !== null) {
    assertUuid(command2.payload.parentId, `${kind} payload.parentId`);
  }
  validateHandoffContent(command2.payload.content, `${kind} payload.content`);
  assertStringArray(command2.payload.artifactRefs, `${kind} payload.artifactRefs`);
  assertStringArray(command2.payload.evidenceRefs, `${kind} payload.evidenceRefs`);
  if (!PROVENANCE_KINDS.has(command2.payload.provenance)) {
    invalid2(`${kind} payload.provenance is unsupported`);
  }
}
function validateTaskLikeRestore(command2, { kind, recordKind: recordKind2 }) {
  if (command2.recordKind !== recordKind2 || command2.expectedVersion < 1) {
    invalid2(`${kind} requires an existing ${recordKind2}`);
  }
  assertExactKeys(
    command2.payload,
    /* @__PURE__ */ new Set(["at", "recoveryApprovalId"]),
    `${kind} payload`,
    /* @__PURE__ */ new Set(["at"])
  );
  assertTimestamp(command2.payload.at, `${kind} payload.at`);
  if (Object.hasOwn(command2.payload, "recoveryApprovalId")) {
    assertUuid(command2.payload.recoveryApprovalId, `${kind} payload.recoveryApprovalId`);
  }
}
var taskCommandValidators = /* @__PURE__ */ new Map([
  ["task.create", (command2) => validateCreate(command2, "task", validateTaskBody)],
  ["task.update", (command2) => validateTaskLikeUpdate(command2, {
    commandKind: "task.update",
    recordKind: "task",
    fields: TASK_UPDATE_FIELDS
  })],
  ["task.promote", (command2) => validateTaskLikePromote(command2, {
    kind: "task.promote",
    recordKind: "task"
  })],
  ["task.grant", (command2) => validateTaskLikeGrant(command2, {
    kind: "task.grant",
    recordKind: "task",
    actions: /* @__PURE__ */ new Set([
      "task.update",
      "task.transition",
      "task.handoff",
      "question.open",
      "artifact.register",
      "asset.transition",
      "evidence.register",
      "review.record",
      "approval.record"
    ])
  })],
  ["task.transition", (command2) => validateTaskLikeTransition(command2, {
    kind: "task.transition",
    recordKind: "task"
  })],
  ["task.handoff", (command2) => validateTaskLikeHandoff(command2, {
    kind: "task.handoff",
    recordKind: "task"
  })],
  ["task.restore", (command2) => validateTaskLikeRestore(command2, {
    kind: "task.restore",
    recordKind: "task"
  })]
]);
function validateTaskCommand(command2) {
  if (!TASK_COMMAND_KINDS.has(command2.kind)) {
    invalid2(`unsupported command kind "${command2.kind}"`);
  }
  taskCommandValidators.get(command2.kind)(command2);
  return command2;
}
function validateTaskLikeCommandMutation(command2, current, nextBody, {
  updateCommand,
  updateFailure,
  allowedByKind
} = {}) {
  if (!isPlainObject(nextBody)) invalid2(`${command2.kind} must produce an object body`);
  if (command2.kind.endsWith(".create")) {
    if (current) invalid2(`${command2.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command2.payload.body)) {
      invalid2(`${command2.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid2(`${command2.kind} requires an existing record`);
  if (command2.kind === updateCommand) {
    const changes = Object.hasOwn(command2.payload, "changes") ? command2.payload.changes : { title: command2.payload.title };
    const expected = { ...current.body, ...changes };
    if (canonicalJson(nextBody) !== canonicalJson(expected)) invalid2(updateFailure);
    return nextBody;
  }
  assertChangedOnly(current, nextBody, allowedByKind.get(command2.kind), command2.kind);
  return nextBody;
}
function validateTaskCommandMutation(command2, current, nextBody) {
  return validateTaskLikeCommandMutation(command2, current, nextBody, {
    updateCommand: "task.update",
    updateFailure: "task.update may only apply the descriptive changes in its payload",
    allowedByKind: /* @__PURE__ */ new Map([
      ["task.promote", /* @__PURE__ */ new Set(["state", "updated_at"])],
      ["task.grant", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "producer_actor",
        "producing_actors",
        "next_role",
        "lease",
        "updated_at"
      ])],
      ["task.transition", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "acceptance_actor",
        "next_role",
        "lease",
        "change_ref",
        "updated_at"
      ])],
      ["task.handoff", /* @__PURE__ */ new Set([
        "state",
        "resume_state",
        "acceptance_actor",
        "next_role",
        "lease",
        "change_ref",
        "updated_at"
      ])],
      ["task.restore", /* @__PURE__ */ new Set(["state", "resume_state", "next_role", "recovery_hold", "updated_at"])]
    ])
  });
}

// src/core/lib/coordination-runtime/hierarchy-contract.mjs
var COMMON_PARENT_FIELDS = [
  "schema_version",
  "id",
  "title",
  "state",
  "completion_disposition",
  "owner",
  "scope_authority",
  "completion_authority",
  "priority",
  "outcome",
  "acceptance",
  "hold",
  "created_at",
  "updated_at"
];
var FEATURE_DEPENDENCY_REQUIRES = /* @__PURE__ */ new Set(["delivered"]);
var COMPOSITION_EDGES = Object.freeze({
  epic: {
    childKind: "feature",
    lists: ["required_features", "optional_features"],
    parentField: "epic_id",
    singleParent: true
  },
  feature: {
    childKind: "requirement",
    lists: ["required_requirements", "optional_requirements"],
    parentField: "feature_id",
    singleParent: true
  },
  requirement: {
    childKind: "task",
    lists: ["required_tasks", "optional_tasks"],
    parentField: null,
    singleParent: false
  }
});
var PARENT_STATES = /* @__PURE__ */ new Set(["proposed", "active", "completed"]);
var PARENT_DISPOSITIONS = Object.freeze({
  epic: /* @__PURE__ */ new Set(["achieved", "cancelled", "superseded"]),
  feature: /* @__PURE__ */ new Set(["delivered", "cancelled", "superseded"]),
  requirement: /* @__PURE__ */ new Set(["satisfied", "cancelled", "superseded"])
});
var PARENT_UPDATE_FIELDS = /* @__PURE__ */ new Map([
  ["epic", /* @__PURE__ */ new Set([
    "title",
    "owner",
    "scope_authority",
    "completion_authority",
    "priority",
    "outcome",
    "acceptance",
    "direction_ref",
    "contribution",
    "scope_fit",
    "required_features",
    "optional_features"
  ])],
  ["feature", /* @__PURE__ */ new Set([
    "title",
    "owner",
    "scope_authority",
    "completion_authority",
    "priority",
    "outcome",
    "acceptance",
    "required_requirements",
    "optional_requirements",
    "depends_on_features"
  ])],
  ["requirement", /* @__PURE__ */ new Set([
    "title",
    "owner",
    "scope_authority",
    "completion_authority",
    "priority",
    "outcome",
    "acceptance",
    "required_tasks",
    "optional_tasks"
  ])]
]);
function validateDirectionRef(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["path", "hash", "goal"]), label);
  assertNonEmptyString(value.path, `${label}.path`);
  if (!HEX_DIGEST.test(value.hash)) invalid2(`${label}.hash must be SHA-256`);
  assertNonEmptyString(value.goal, `${label}.goal`);
}
function validateHold(value, label) {
  if (value === null) return;
  assertExactKeys(value, /* @__PURE__ */ new Set([
    "reason",
    "set_by",
    "set_at",
    "release_condition",
    "basis_refs"
  ]), label);
  assertNonEmptyString(value.reason, `${label}.reason`);
  validateActor(value.set_by, `${label}.set_by`);
  assertTimestamp(value.set_at, `${label}.set_at`);
  assertNonEmptyString(value.release_condition, `${label}.release_condition`);
  assertStringArray(value.basis_refs, `${label}.basis_refs`);
}
function validatePackScopedIds(value, label, kind, pack = null) {
  assertStringArray(value, label);
  for (const [index, id] of value.entries()) {
    const parsed = parseTypedId(id, kind, `${label}[${index}]`);
    if (pack !== null && parsed.pack !== pack) invalid2(`${label} must stay within the ${pack} pack`);
  }
}
function assertDisjointLists(required2, optional, label) {
  const overlap = required2.find((id) => optional.includes(id));
  if (overlap) invalid2(`${label} required and optional child lists must not overlap`);
}
function validateFeatureDependencies(value, label) {
  if (!Array.isArray(value)) invalid2(`${label} must be an array`);
  const seen = /* @__PURE__ */ new Set();
  for (const [index, dependency] of value.entries()) {
    assertExactKeys(dependency, /* @__PURE__ */ new Set(["feature", "requires"]), `${label}[${index}]`);
    parseTypedId(dependency.feature, "feature", `${label}[${index}].feature`);
    if (!FEATURE_DEPENDENCY_REQUIRES.has(dependency.requires)) {
      invalid2(`${label}[${index}].requires is unsupported`);
    }
    if (seen.has(dependency.feature)) {
      invalid2(`${label} contains duplicate feature "${dependency.feature}"`);
    }
    seen.add(dependency.feature);
  }
}
function validateCommonParentBody(body, label, kind, extraFields) {
  assertExactKeys(body, /* @__PURE__ */ new Set([...COMMON_PARENT_FIELDS, ...extraFields]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  for (const key2 of ["id", "title", "owner", "scope_authority", "completion_authority", "outcome"]) {
    assertNonEmptyString(body[key2], `${label}.${key2}`);
  }
  if (kind === "epic") {
    parseEpicId(body.id, `${label}.id`);
  } else {
    assertNonEmptyString(body.pack, `${label}.pack`);
    const parsed = parseTypedId(body.id, kind, `${label}.id`);
    if (parsed.pack !== body.pack) invalid2(`${label}.pack must match its typed id`);
  }
  if (!PARENT_STATES.has(body.state)) invalid2(`${label}.state is unsupported`);
  if (body.state === "completed") {
    if (body.completion_disposition === null) {
      invalid2(`${label}.completed parents require a completion_disposition`);
    }
    if (!PARENT_DISPOSITIONS[kind].has(body.completion_disposition)) {
      invalid2(`${label}.completion_disposition is unsupported for ${kind}`);
    }
  } else if (body.completion_disposition !== null) {
    invalid2(`${label}.completion_disposition must be null until the parent is completed`);
  }
  if (!Number.isSafeInteger(body.priority) || body.priority < 0) {
    invalid2(`${label}.priority must be a non-negative safe integer`);
  }
  assertStringArray(body.acceptance, `${label}.acceptance`, { nonEmpty: true });
  validateHold(body.hold, `${label}.hold`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}
function validateEpicBody(body, label) {
  validateCommonParentBody(body, label, "epic", [
    "direction_ref",
    "contribution",
    "scope_fit",
    "required_features",
    "optional_features"
  ]);
  validateDirectionRef(body.direction_ref, `${label}.direction_ref`);
  assertNonEmptyString(body.contribution, `${label}.contribution`);
  assertNonEmptyString(body.scope_fit, `${label}.scope_fit`);
  validatePackScopedIds(body.required_features, `${label}.required_features`, "feature");
  validatePackScopedIds(body.optional_features, `${label}.optional_features`, "feature");
  assertDisjointLists(body.required_features, body.optional_features, `${label}.required_features`);
}
function validateFeatureBody(body, label) {
  validateCommonParentBody(body, label, "feature", [
    "pack",
    "epic_id",
    "required_requirements",
    "optional_requirements",
    "depends_on_features"
  ]);
  parseEpicId(body.epic_id, `${label}.epic_id`);
  validatePackScopedIds(body.required_requirements, `${label}.required_requirements`, "requirement", body.pack);
  validatePackScopedIds(body.optional_requirements, `${label}.optional_requirements`, "requirement", body.pack);
  assertDisjointLists(body.required_requirements, body.optional_requirements, `${label}.required_requirements`);
  validateFeatureDependencies(body.depends_on_features, `${label}.depends_on_features`);
}
function validateRequirementBody(body, label) {
  validateCommonParentBody(body, label, "requirement", [
    "pack",
    "feature_id",
    "required_tasks",
    "optional_tasks"
  ]);
  const feature = parseTypedId(body.feature_id, "feature", `${label}.feature_id`);
  if (feature.pack !== body.pack) invalid2(`${label}.feature_id must stay within the ${body.pack} pack`);
  validatePackScopedIds(body.required_tasks, `${label}.required_tasks`, "task", body.pack);
  validatePackScopedIds(body.optional_tasks, `${label}.optional_tasks`, "task", body.pack);
  assertDisjointLists(body.required_tasks, body.optional_tasks, `${label}.required_tasks`);
}
function resolveLookup(lookup5, kind, id) {
  if (!lookup5) return null;
  if (typeof lookup5 === "function") return lookup5(kind, id) ?? null;
  if (lookup5 instanceof Map) {
    if (lookup5.has(kind) && lookup5.get(kind) instanceof Map) {
      return lookup5.get(kind).get(id) ?? null;
    }
    const keyed = lookup5.get(`${kind}\0${id}`);
    if (keyed) return keyed;
    const byId = lookup5.get(id);
    if (byId?.kind === kind) return byId;
    return null;
  }
  if (isPlainObject(lookup5)) {
    if (lookup5[kind] && isPlainObject(lookup5[kind])) return lookup5[kind][id] ?? null;
    const keyed = lookup5[`${kind}\0${id}`];
    if (keyed) return keyed;
    const byId = lookup5[id];
    if (byId?.kind === kind) return byId;
  }
  return null;
}
function bodyValidator(kind) {
  if (kind === "epic") return validateEpicBody;
  if (kind === "feature") return validateFeatureBody;
  if (kind === "requirement") return validateRequirementBody;
  return validateTaskBody;
}
function contains(listA, listB, id) {
  return listA.includes(id) || listB.includes(id);
}
function validateHierarchyRecord(record2, lookup5 = null) {
  if (!isPlainObject(record2)) invalid2("record must be an object");
  assertExactKeys(record2, /* @__PURE__ */ new Set(["kind", "id", "subject", "version", "body"]), "record");
  if (!HIERARCHY_KINDS.has(record2.kind)) {
    invalid2(`unsupported hierarchy record kind "${record2.kind}"`);
  }
  assertNonEmptyString(record2.id, "record.id");
  if (record2.subject !== null) {
    invalid2(`${record2.kind} record envelope must have null subject`);
  }
  if (!Number.isSafeInteger(record2.version) || record2.version < 1) {
    invalid2("record.version must be a positive safe integer");
  }
  bodyValidator(record2.kind)(record2.body, `record ${record2.kind}/${record2.id} body`);
  if (record2.id !== record2.body.id) invalid2(`${record2.kind} record envelope must match body.id`);
  const resolve6 = (kind, id) => resolveLookup(lookup5, kind, id);
  if (record2.kind === "feature" && lookup5) {
    const epic = resolve6("epic", record2.body.epic_id);
    if (!epic) invalid2(`feature/${record2.id} must reference an existing epic`);
    if (!contains(epic.body.required_features, epic.body.optional_features, record2.id)) {
      invalid2(`feature/${record2.id} must appear in epic/${epic.id}`);
    }
  }
  if (record2.kind === "requirement" && lookup5) {
    const feature = resolve6("feature", record2.body.feature_id);
    if (!feature || feature.body.pack !== record2.body.pack) {
      invalid2(`requirement/${record2.id} must reference an existing same-pack feature`);
    }
    if (!contains(feature.body.required_requirements, feature.body.optional_requirements, record2.id)) {
      invalid2(`requirement/${record2.id} must appear in feature/${feature.id}`);
    }
  }
  if (record2.kind === "task" && lookup5) {
    const feature = resolve6("feature", record2.body.feature_id);
    if (!feature || feature.body.pack !== record2.body.pack) {
      invalid2(`task/${record2.id} must reference an existing same-pack feature`);
    }
    for (const requirementId of record2.body.satisfies) {
      const requirement = resolve6("requirement", requirementId);
      if (!requirement) invalid2(`task/${record2.id} must reference existing requirements in satisfies`);
      if (requirement.body.feature_id !== record2.body.feature_id) {
        invalid2(`task/${record2.id} must satisfy only requirements that belong to its feature`);
      }
      if (!contains(requirement.body.required_tasks, requirement.body.optional_tasks, record2.id)) {
        invalid2("requirement-task edges must agree bidirectionally");
      }
    }
  }
  return record2;
}
function validateParentCreate(command2, parentKind) {
  if (command2.recordKind !== parentKind) {
    invalid2(`${command2.kind} requires recordKind "${parentKind}"`);
  }
  if (command2.expectedVersion !== 0) invalid2(`${command2.kind} requires version 0`);
  if (command2.leaseToken !== null) invalid2(`${command2.kind} cannot carry a lease token`);
  assertExactKeys(command2.payload, /* @__PURE__ */ new Set(["body"]), `${command2.kind} payload`);
  bodyValidator(parentKind)(command2.payload.body, `${command2.kind} payload.body`);
  if (command2.payload.body.id !== command2.recordId) {
    invalid2(`${command2.kind} body id must match command.recordId`);
  }
}
function validateExistingParentCommand(command2, parentKind) {
  if (command2.recordKind !== parentKind) invalid2(`${command2.kind} requires recordKind "${parentKind}"`);
  if (command2.expectedVersion < 1) invalid2(`${command2.kind} requires an existing record version`);
  if (command2.leaseToken !== null) invalid2(`${command2.kind} cannot carry a lease token`);
}
function validateParentUpdate(command2, parentKind) {
  validateExistingParentCommand(command2, parentKind);
  assertExactKeys(command2.payload, /* @__PURE__ */ new Set(["at", "changes"]), `${command2.kind} payload`);
  assertTimestamp(command2.payload.at, `${command2.kind} payload.at`);
  validateChangesPayload(
    { ...command2, payload: { changes: command2.payload.changes } },
    PARENT_UPDATE_FIELDS.get(parentKind),
    command2.kind
  );
}
function validateAtPayload2(command2, parentKind, fields2, required2 = fields2) {
  validateExistingParentCommand(command2, parentKind);
  assertExactKeys(command2.payload, new Set(fields2), `${command2.kind} payload`, new Set(required2));
}
function validateParentActivate(command2, parentKind) {
  validateAtPayload2(command2, parentKind, ["at"]);
  assertTimestamp(command2.payload.at, `${command2.kind} payload.at`);
}
function validateParentHold(command2, parentKind) {
  validateAtPayload2(command2, parentKind, ["at", "reason", "releaseCondition", "basisRefs"]);
  assertTimestamp(command2.payload.at, `${command2.kind} payload.at`);
  assertNonEmptyString(command2.payload.reason, `${command2.kind} payload.reason`);
  assertNonEmptyString(command2.payload.releaseCondition, `${command2.kind} payload.releaseCondition`);
  assertStringArray(command2.payload.basisRefs, `${command2.kind} payload.basisRefs`);
}
function validateParentRelease(command2, parentKind) {
  validateAtPayload2(command2, parentKind, ["at", "reason", "conditionMet", "basisRefs"]);
  assertTimestamp(command2.payload.at, `${command2.kind} payload.at`);
  assertNonEmptyString(command2.payload.reason, `${command2.kind} payload.reason`);
  assertBoolean(command2.payload.conditionMet, `${command2.kind} payload.conditionMet`);
  assertStringArray(command2.payload.basisRefs, `${command2.kind} payload.basisRefs`);
}
function validateParentComplete(command2, parentKind) {
  validateAtPayload2(
    command2,
    parentKind,
    ["at", "disposition", "reason", "closureRef", "basisRefs"],
    ["at", "disposition", "reason", "basisRefs"]
  );
  assertTimestamp(command2.payload.at, `${command2.kind} payload.at`);
  assertNullableString(command2.payload.closureRef ?? null, `${command2.kind} payload.closureRef`);
  if (command2.payload.closureRef !== void 0 && !HEX_DIGEST.test(command2.payload.closureRef)) {
    invalid2(`${command2.kind} payload.closureRef must be SHA-256`);
  }
  assertNonEmptyString(command2.payload.reason, `${command2.kind} payload.reason`);
  if (!PARENT_DISPOSITIONS[parentKind].has(command2.payload.disposition)) {
    invalid2(`${command2.kind} payload.disposition is unsupported`);
  }
  assertStringArray(command2.payload.basisRefs, `${command2.kind} payload.basisRefs`);
  const successDisposition = (/* @__PURE__ */ new Map([
    ["epic", "achieved"],
    ["feature", "delivered"],
    ["requirement", "satisfied"]
  ])).get(parentKind);
  if (command2.payload.disposition === successDisposition && !Object.hasOwn(command2.payload, "closureRef")) {
    invalid2(`${command2.kind} payload.closureRef is required for successful completion`);
  }
}
function validateParentCommand(command2) {
  if (!PARENT_COMMAND_KINDS.has(command2.kind)) {
    invalid2(`unsupported command kind "${command2.kind}"`);
  }
  const [parentKind, action] = command2.kind.split(".");
  if (action === "create") validateParentCreate(command2, parentKind);
  else if (action === "update") validateParentUpdate(command2, parentKind);
  else if (action === "activate") validateParentActivate(command2, parentKind);
  else if (action === "hold") validateParentHold(command2, parentKind);
  else if (action === "release") validateParentRelease(command2, parentKind);
  else validateParentComplete(command2, parentKind);
  return command2;
}
function validateParentCommandMutation(command2, current, nextBody) {
  if (!isPlainObject(nextBody)) invalid2(`${command2.kind} must produce an object body`);
  if (command2.kind.endsWith(".create")) {
    if (current) invalid2(`${command2.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command2.payload.body)) {
      invalid2(`${command2.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid2(`${command2.kind} requires an existing record`);
  const [, action] = command2.kind.split(".");
  if (action === "update") {
    const expected = {
      ...current.body,
      ...command2.payload.changes,
      updated_at: command2.payload.at
    };
    if (canonicalJson(nextBody) !== canonicalJson(expected)) {
      invalid2(`${command2.kind} may only apply the changes in its payload`);
    }
    return nextBody;
  }
  const allowedByAction = /* @__PURE__ */ new Map([
    ["activate", /* @__PURE__ */ new Set(["state", "updated_at"])],
    ["hold", /* @__PURE__ */ new Set(["hold", "updated_at"])],
    ["release", /* @__PURE__ */ new Set(["hold", "updated_at"])],
    ["complete", /* @__PURE__ */ new Set(["state", "completion_disposition", "updated_at"])]
  ]);
  assertChangedOnly(current, nextBody, allowedByAction.get(action), command2.kind);
  return nextBody;
}
function closureIdentity(record2, label) {
  if (!isPlainObject(record2)) invalid2(`${label} must be an object`);
  if (!HIERARCHY_KINDS.has(record2.kind)) invalid2(`${label}.kind is unsupported`);
  assertNonEmptyString(record2.id, `${label}.id`);
  if (!Number.isSafeInteger(record2.version) || record2.version < 1) {
    invalid2(`${label}.version must be a positive safe integer`);
  }
  return {
    kind: record2.kind,
    id: record2.id,
    version: record2.version,
    disposition: record2.body?.completion_disposition ?? record2.completion_disposition ?? null
  };
}
function parentClosureRef(parent, requiredChildren) {
  const parentIdentity = closureIdentity(parent, "parent");
  if (!Array.isArray(requiredChildren)) invalid2("requiredChildren must be an array");
  const children = requiredChildren.map((record2, index) => closureIdentity(record2, `requiredChildren[${index}]`)).sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
  return createHash("sha256").update(canonicalJson({
    parent: {
      kind: parentIdentity.kind,
      id: parentIdentity.id,
      version: parentIdentity.version
    },
    requiredChildren: children.map((child) => ({
      kind: child.kind,
      id: child.id,
      version: child.version,
      disposition: child.disposition
    }))
  })).digest("hex");
}

// src/core/lib/coordination-runtime/contract.mjs
var REVIEW_VERDICTS = /* @__PURE__ */ new Set(["approved", "changes-requested", "blocked"]);
var APPROVAL_KINDS = /* @__PURE__ */ new Set([
  "scope",
  "completion",
  "operator-deploy-start",
  "operator-deploy-complete",
  "operator-recovery-resolution"
]);
var EVIDENCE_KINDS = /* @__PURE__ */ new Set([
  "dod-dimension",
  "deployment",
  "production-verification",
  "recovery-reconciliation",
  "parent-completion"
]);
var DOD_DIMENSIONS = /* @__PURE__ */ new Set([
  "scope-true",
  "verified",
  "reviewed",
  "shippable-safely",
  "documented",
  "coordination-closed"
]);
var QUESTION_KINDS = /* @__PURE__ */ new Set(["fact", "decision", "reply", "action"]);
var MESSAGE_KINDS = /* @__PURE__ */ new Set(["question", "answer", "handoff", "recovery"]);
var PROVENANCE_KINDS2 = /* @__PURE__ */ new Set(["live-peer", "durable-thread", "operator"]);
var RECOVERY_DISPOSITIONS = /* @__PURE__ */ new Set([
  "safe-to-resume",
  "conflicting-partial-work"
]);
function validateHierarchySubject(subject, label = "subject") {
  if (!isPlainObject(subject)) invalid2(`${label} must be an object`);
  assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "id"]), label);
  if (!HIERARCHY_KINDS.has(subject.kind)) invalid2(`${label}.kind is unsupported`);
  if (subject.kind === "epic") parseEpicId(subject.id, `${label}.id`);
  else parseTypedId(subject.id, subject.kind, `${label}.id`);
  return subject;
}
function subjectRef(subject, version) {
  validateHierarchySubject(subject);
  if (!Number.isSafeInteger(version) || version < 1) {
    invalid2("subject version must be a positive safe integer");
  }
  return `${subject.kind}/${subject.id}@${version}`;
}
function subjectEquals(left, right) {
  if (left === null || right === null || left === void 0 || right === void 0) return false;
  validateHierarchySubject(left, "left subject");
  validateHierarchySubject(right, "right subject");
  return left.kind === right.kind && left.id === right.id;
}
function relationshipBindings(record2) {
  const body = record2.body;
  if (record2.kind === "epic") {
    return [...body.required_features, ...body.optional_features].map((id) => ({ subject: { kind: "feature", id }, requiredState: null }));
  }
  if (record2.kind === "feature") {
    return [
      { subject: { kind: "epic", id: body.epic_id }, requiredState: null },
      ...[...body.required_requirements, ...body.optional_requirements].map((id) => ({ subject: { kind: "requirement", id }, requiredState: null })),
      ...body.depends_on_features.map((dependency) => ({
        subject: { kind: "feature", id: dependency.feature },
        requiredState: dependency.requires
      }))
    ];
  }
  if (record2.kind === "requirement") {
    return [
      { subject: { kind: "feature", id: body.feature_id }, requiredState: null },
      ...[...body.required_tasks, ...body.optional_tasks].map((id) => ({ subject: { kind: "task", id }, requiredState: null }))
    ];
  }
  return [
    { subject: { kind: "feature", id: body.feature_id }, requiredState: null },
    ...body.satisfies.map((id) => ({
      subject: { kind: "requirement", id },
      requiredState: null
    })),
    ...body.depends_on.map((dependency) => ({
      subject: { kind: "task", id: dependency.task },
      requiredState: dependency.requires
    }))
  ];
}
function criteriaRef(record2, lookup5) {
  if (!isPlainObject(record2) || !HIERARCHY_KINDS.has(record2.kind) || record2.id !== record2.body?.id) {
    invalid2("criteriaRef requires a hierarchy record");
  }
  const subject = validateHierarchySubject({ kind: record2.kind, id: record2.id });
  if (!Number.isSafeInteger(record2.version) || record2.version < 1) {
    invalid2("criteriaRef record version must be a positive safe integer");
  }
  const relationships = relationshipBindings(record2);
  if (relationships.length > 0 && typeof lookup5 !== "function") {
    invalid2("criteriaRef requires a relationship lookup");
  }
  const relationshipRefs = relationships.map(({ subject: relationship, requiredState }) => {
    const related = lookup5(relationship.kind, relationship.id);
    if (!related || related.kind !== relationship.kind || related.id !== relationship.id || !Number.isSafeInteger(related.version) || related.version < 1) {
      invalid2(`criteriaRef relationship ${relationship.kind}/${relationship.id} is missing`);
    }
    return {
      subject: subjectRef(relationship, related.version),
      required_state: requiredState
    };
  }).sort((left, right) => left.subject.localeCompare(right.subject) || String(left.required_state).localeCompare(String(right.required_state)));
  const fields2 = record2.kind === "task" ? [
    "outcome",
    "acceptance",
    "completion_authority",
    "review_requirements",
    "artifact_expectation",
    "artifact_expectation_reason",
    "artifact_class",
    "durability",
    "validity_owner",
    "artifact_targets"
  ] : ["outcome", "acceptance", "completion_authority"];
  const criteria = Object.fromEntries(fields2.map((key2) => [key2, record2.body[key2]]));
  if (record2.kind === "task" && record2.body.context_artifacts?.length) {
    criteria.context_artifacts = record2.body.context_artifacts;
  }
  return createHash2("sha256").update(canonicalJson({
    subject: subjectRef(subject, record2.version),
    criteria,
    relationships: relationshipRefs,
    immutable_subject: record2.kind === "task" ? record2.body.change_ref : null
  })).digest("hex");
}
function isProducingRun(task, actor) {
  return Array.isArray(task.producing_actors) && task.producing_actors.some((producer) => producer.runId === actor.runId);
}
function validateLease2(value, label) {
  if (value === null) return;
  assertExactKeys(value, /* @__PURE__ */ new Set([
    "holder",
    "token",
    "version_at_grant",
    "acquired_at",
    "expires_at"
  ]), label);
  validateActor(value.holder, `${label}.holder`);
  assertNonEmptyString(value.token, `${label}.token`);
  if (!Number.isSafeInteger(value.version_at_grant) || value.version_at_grant < 1) {
    invalid2(`${label}.version_at_grant must be a positive safe integer`);
  }
  assertTimestamp(value.acquired_at, `${label}.acquired_at`);
  assertTimestamp(value.expires_at, `${label}.expires_at`);
}
function validateQuestionBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "question_id",
    "subject",
    "asker",
    "recipient",
    "kind",
    "blocking",
    "status",
    "context",
    "ask",
    "answer_by",
    "opened_message_id",
    "answer_message_ids",
    "resolution"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  for (const key2 of ["question_id", "recipient", "context", "ask", "answer_by"]) {
    assertNonEmptyString(body[key2], `${label}.${key2}`);
  }
  validateActor(body.asker, `${label}.asker`);
  if (!QUESTION_KINDS.has(body.kind)) invalid2(`${label}.kind is unsupported`);
  assertBoolean(body.blocking, `${label}.blocking`);
  if (!(/* @__PURE__ */ new Set(["open", "answered"])).has(body.status)) {
    invalid2(`${label}.status is unsupported`);
  }
  assertUuid(body.opened_message_id, `${label}.opened_message_id`);
  assertStringArray(body.answer_message_ids, `${label}.answer_message_ids`);
  if (body.resolution !== null) {
    assertExactKeys(body.resolution, /* @__PURE__ */ new Set([
      "answer",
      "lane",
      "provenance",
      "message_id",
      "answered_at",
      "sender"
    ]), `${label}.resolution`);
    assertNonEmptyString(body.resolution.answer, `${label}.resolution.answer`);
    if (body.resolution.lane !== "in-lane") {
      invalid2(`${label}.resolution.lane must be "in-lane"`);
    }
    if (!PROVENANCE_KINDS2.has(body.resolution.provenance)) {
      invalid2(`${label}.resolution.provenance is unsupported`);
    }
    assertUuid(body.resolution.message_id, `${label}.resolution.message_id`);
    assertTimestamp(body.resolution.answered_at, `${label}.resolution.answered_at`);
    validateActor(body.resolution.sender, `${label}.resolution.sender`);
  }
}
function validateMessageBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "message_id",
    "subject",
    "thread_id",
    "parent_id",
    "sender_role",
    "sender_run",
    "recipient",
    "kind",
    "created_at",
    "basis_version",
    "payload",
    "artifact_refs",
    "evidence_refs",
    "provenance"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.message_id, `${label}.message_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  for (const key2 of ["thread_id", "sender_role", "sender_run", "recipient"]) {
    assertNonEmptyString(body[key2], `${label}.${key2}`);
  }
  if (body.parent_id !== null) assertUuid(body.parent_id, `${label}.parent_id`);
  if (!MESSAGE_KINDS.has(body.kind)) invalid2(`${label}.kind is unsupported`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  if (!Number.isSafeInteger(body.basis_version) || body.basis_version < 1) {
    invalid2(`${label}.basis_version must be a positive safe integer`);
  }
  if (body.thread_id !== subjectRef(body.subject, body.basis_version)) {
    invalid2(`${label}.thread_id must bind the exact subject version`);
  }
  if (body.kind === "question") {
    validateQuestionContent(body.payload);
  } else if (body.kind === "answer") {
    validateAnswerContent(body.payload);
  } else if (body.kind === "handoff") {
    validateHandoffContent2(body.payload);
  } else {
    assertExactKeys(body.payload, /* @__PURE__ */ new Set([
      "observed",
      "disposition",
      "staleLeaseToken",
      "newLeaseToken"
    ]), `${label}.payload`);
    assertNonEmptyString(body.payload.observed, `${label}.payload.observed`);
    if (!RECOVERY_DISPOSITIONS.has(body.payload.disposition)) {
      invalid2(`${label}.payload.disposition is unsupported`);
    }
    assertNonEmptyString(
      body.payload.staleLeaseToken,
      `${label}.payload.staleLeaseToken`
    );
    assertNullableString(
      body.payload.newLeaseToken,
      `${label}.payload.newLeaseToken`
    );
  }
  assertStringArray(body.artifact_refs, `${label}.artifact_refs`);
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`);
  if (!PROVENANCE_KINDS2.has(body.provenance)) invalid2(`${label}.provenance is unsupported`);
}
function validateReviewBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "review_id",
    "subject",
    "reviewer",
    "kind",
    "content_ref",
    "criteria",
    "criteria_ref",
    "supersedes",
    "verdict",
    "finding_refs",
    "evidence_refs",
    "created_at"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.review_id, `${label}.review_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (body.subject.kind !== "task") invalid2(`${label}.subject must be a Task`);
  validateActor(body.reviewer, `${label}.reviewer`);
  assertNonEmptyString(body.kind, `${label}.kind`);
  validateSubjectRef(body.content_ref, `${label}.content_ref`);
  assertStringArray(body.criteria, `${label}.criteria`, { nonEmpty: true });
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  validateSupersedes(body.supersedes, body.review_id, label);
  if (!REVIEW_VERDICTS.has(body.verdict)) invalid2(`${label}.verdict is unsupported`);
  assertStringArray(body.finding_refs, `${label}.finding_refs`);
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, { nonEmpty: true });
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateCriteriaRef(value, label) {
  if (typeof value !== "string" || !HEX_DIGEST.test(value)) {
    invalid2(`${label} must be a SHA-256 criteria reference`);
  }
}
function validateSupersedes(ids, ownId, label) {
  assertStringArray(ids, `${label}.supersedes`);
  for (const id of ids) {
    assertUuid(id, `${label}.supersedes entry`);
    if (id === ownId) invalid2(`${label} cannot supersede itself`);
  }
}
function validateDeploymentContext(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["environment", "environment_class", "deployment_id"]), label);
  assertNonEmptyString(value.environment, `${label}.environment`);
  if (value.environment_class !== "production") invalid2(`${label} must confirm a production environment`);
  assertNonEmptyString(value.deployment_id, `${label}.deployment_id`);
}
function validateApprovalBody(body, label) {
  const required2 = /* @__PURE__ */ new Set([
    "schema_version",
    "approval_id",
    "subject",
    "authority",
    "kind",
    "content_ref",
    "criteria_ref",
    "supersedes",
    "deployment",
    "recovery",
    "decision",
    "evidence_refs",
    "reason",
    "created_at"
  ]);
  assertExactKeys(body, /* @__PURE__ */ new Set([...required2, "provenance", "recorded_at_subject_version"]), label, required2);
  if (Object.hasOwn(body, "provenance")) validateDecisionProvenance(body.provenance, `${label}.provenance`);
  if (Object.hasOwn(body, "recorded_at_subject_version") && (!Number.isSafeInteger(body.recorded_at_subject_version) || body.recorded_at_subject_version < 1)) {
    invalid2(`${label}.recorded_at_subject_version must be a positive subject version`);
  }
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.approval_id, `${label}.approval_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  validateActor(body.authority, `${label}.authority`);
  if (!APPROVAL_KINDS.has(body.kind)) invalid2(`${label}.kind is unsupported`);
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  validateSupersedes(body.supersedes, body.approval_id, label);
  if (body.kind === "operator-recovery-resolution") {
    if (body.subject.kind !== "task") invalid2(`${label}.subject must be a Task for recovery resolution`);
    if (body.content_ref !== null) invalid2(`${label}.content_ref must be null for recovery resolution`);
    assertExactKeys(body.recovery, /* @__PURE__ */ new Set([
      "attempt_id",
      "stale_lease_token",
      "disposition",
      "resume_role"
    ]), `${label}.recovery`);
    assertUuid(body.recovery.attempt_id, `${label}.recovery.attempt_id`);
    assertNonEmptyString(body.recovery.stale_lease_token, `${label}.recovery.stale_lease_token`);
    if (body.recovery.disposition !== "safe-to-resume") {
      invalid2(`${label}.recovery.disposition must be safe-to-resume`);
    }
    assertNonEmptyString(body.recovery.resume_role, `${label}.recovery.resume_role`);
    if (body.recovery.resume_role === "operator") {
      invalid2(`${label}.recovery.resume_role cannot lease to operator`);
    }
  } else {
    if (body.subject.kind === "task") validateSubjectRef(body.content_ref, `${label}.content_ref`);
    else if (body.kind !== "completion" || body.content_ref !== null) {
      invalid2(`${label} parent subjects support completion approval without a content_ref`);
    }
    if (body.recovery !== null) invalid2(`${label}.recovery is only for recovery resolution`);
  }
  if (body.kind === "operator-deploy-start" || body.kind === "operator-deploy-complete") {
    if (body.subject.kind !== "task") invalid2(`${label}.subject must be a Task for deployment confirmation`);
    validateDeploymentContext(body.deployment, `${label}.deployment`);
  } else if (body.deployment !== null) {
    invalid2(`${label}.deployment is only for deployment confirmation`);
  }
  if (!(/* @__PURE__ */ new Set(["approved", "rejected"])).has(body.decision)) {
    invalid2(`${label}.decision is unsupported`);
  }
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, { nonEmpty: true });
  assertNonEmptyString(body.reason, `${label}.reason`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateEvidenceBody(body, label) {
  const required2 = /* @__PURE__ */ new Set([
    "schema_version",
    "evidence_id",
    "subject",
    "kind",
    "content_ref",
    "criteria_ref",
    "supersedes",
    "dimension",
    "outcome",
    "evidence_refs",
    "reason",
    "data",
    "created_at"
  ]);
  assertExactKeys(body, /* @__PURE__ */ new Set([...required2, "provenance"]), label, required2);
  if (Object.hasOwn(body, "provenance")) {
    assertExactKeys(body.provenance, /* @__PURE__ */ new Set(["tier", "capture"]), `${label}.provenance`);
    if (!(/* @__PURE__ */ new Set(["observed", "declared"])).has(body.provenance.tier)) invalid2(`${label}.provenance.tier is unsupported`);
    if (body.provenance.tier === "observed") validateCapture(body.provenance.capture);
    else if (body.provenance.capture !== null) invalid2("declared provenance cannot claim capture");
  }
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.evidence_id, `${label}.evidence_id`);
  validateSupersedes(body.supersedes, body.evidence_id, label);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (!EVIDENCE_KINDS.has(body.kind)) invalid2(`${label}.kind is unsupported`);
  validateNullableSubject(body.content_ref, `${label}.content_ref`);
  if (body.kind === "parent-completion") {
    if (body.subject.kind === "task") invalid2(`${label}.subject must be a parent hierarchy subject`);
    if (body.content_ref !== null) invalid2(`${label}.content_ref must be null for parent completion`);
  } else if (body.subject.kind !== "task") {
    invalid2(`${label}.subject must be a Task for execution evidence`);
  }
  if (body.kind === "recovery-reconciliation") {
    if (body.criteria_ref !== null) invalid2(`${label}.criteria_ref must be null for recovery`);
    if (body.supersedes.length > 0) invalid2(`${label} recovery reconciliation cannot supersede observations`);
  } else {
    validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  }
  if (body.kind === "recovery-reconciliation" && body.content_ref !== null) {
    invalid2(`${label}.content_ref must be null for recovery reconciliation`);
  }
  if (!(/* @__PURE__ */ new Set(["recovery-reconciliation", "parent-completion"])).has(body.kind) && body.content_ref === null) {
    invalid2(`${label}.content_ref is required`);
  }
  if (body.kind === "dod-dimension") {
    if (!DOD_DIMENSIONS.has(body.dimension)) invalid2(`${label}.dimension is unsupported`);
    if (!(/* @__PURE__ */ new Set(["clear", "waived", "gap"])).has(body.outcome)) {
      invalid2(`${label}.outcome is unsupported for a DoD dimension`);
    }
    if (body.outcome === "waived") assertNonEmptyString(body.reason, `${label}.reason`);
  } else {
    if (body.dimension !== null) invalid2(`${label}.dimension must be null`);
    if (!(/* @__PURE__ */ new Set(["passed", "failed"])).has(body.outcome)) {
      invalid2(`${label}.outcome is unsupported`);
    }
  }
  assertStringArray(body.evidence_refs, `${label}.evidence_refs`, { nonEmpty: true });
  assertNullableString(body.reason, `${label}.reason`);
  if (body.kind === "dod-dimension") {
    assertExactKeys(body.data, /* @__PURE__ */ new Set(), `${label}.data`);
  } else if (body.kind === "deployment") {
    assertExactKeys(
      body.data,
      /* @__PURE__ */ new Set(["environment", "deployment_id"]),
      `${label}.data`
    );
    assertNonEmptyString(body.data.environment, `${label}.data.environment`);
    assertNonEmptyString(body.data.deployment_id, `${label}.data.deployment_id`);
  } else if (body.kind === "production-verification") {
    assertExactKeys(body.data, /* @__PURE__ */ new Set(["environment", "deployment_id", "checks"]), `${label}.data`);
    assertNonEmptyString(body.data.environment, `${label}.data.environment`);
    assertNonEmptyString(body.data.deployment_id, `${label}.data.deployment_id`);
    assertStringArray(body.data.checks, `${label}.data.checks`, { nonEmpty: true });
  } else if (body.kind === "recovery-reconciliation") {
    assertExactKeys(body.data, /* @__PURE__ */ new Set([
      "stale_lease_token",
      "disposition",
      "observed"
    ]), `${label}.data`);
    assertNonEmptyString(
      body.data.stale_lease_token,
      `${label}.data.stale_lease_token`
    );
    if (!RECOVERY_DISPOSITIONS.has(body.data.disposition)) {
      invalid2(`${label}.data.disposition is unsupported`);
    }
    assertNonEmptyString(body.data.observed, `${label}.data.observed`);
  } else {
    assertExactKeys(body.data, /* @__PURE__ */ new Set(), `${label}.data`);
  }
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateGrantBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "grant_id",
    "subject",
    "actor",
    "actions",
    "record_kind",
    "record_id",
    "basis_ref",
    "lease_token",
    "issued_by",
    "created_at",
    "expires_at",
    "status"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.grant_id, `${label}.grant_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (body.subject.kind !== "task") invalid2(`${label}.subject must be a Task`);
  validateActor(body.actor, `${label}.actor`);
  assertStringArray(body.actions, `${label}.actions`, { nonEmpty: true });
  if (!RECORD_KINDS.has(body.record_kind)) invalid2(`${label}.record_kind is unsupported`);
  assertNonEmptyString(body.record_id, `${label}.record_id`);
  assertNonEmptyString(body.basis_ref, `${label}.basis_ref`);
  assertNonEmptyString(body.lease_token, `${label}.lease_token`);
  validateActor(body.issued_by, `${label}.issued_by`);
  assertTimestamp(body.created_at, `${label}.created_at`);
  assertTimestamp(body.expires_at, `${label}.expires_at`);
  if (!(/* @__PURE__ */ new Set(["active", "recovered", "revoked"])).has(body.status)) {
    invalid2(`${label}.status is unsupported`);
  }
}
function validateAttemptBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "attempt_id",
    "subject",
    "grantor",
    "stale_lease",
    "observed",
    "disposition",
    "recovery_evidence_ids",
    "new_lease",
    "created_at"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.attempt_id, `${label}.attempt_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (body.subject.kind !== "task") invalid2(`${label}.subject must be a Task`);
  validateActor(body.grantor, `${label}.grantor`);
  if (body.stale_lease === null) invalid2(`${label}.stale_lease is required`);
  validateLease2(body.stale_lease, `${label}.stale_lease`);
  assertNonEmptyString(body.observed, `${label}.observed`);
  if (!RECOVERY_DISPOSITIONS.has(body.disposition)) {
    invalid2(`${label}.disposition is unsupported`);
  }
  assertStringArray(
    body.recovery_evidence_ids,
    `${label}.recovery_evidence_ids`,
    { nonEmpty: true }
  );
  validateLease2(body.new_lease, `${label}.new_lease`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}
var ASSET_DISPOSITIONS = /* @__PURE__ */ new Set([
  "scratch",
  "draft",
  "working",
  "published",
  "personal",
  "archived",
  "retracted",
  "discarded"
]);
var ASSET_VALIDITIES = /* @__PURE__ */ new Set([
  "unknown",
  "provisional",
  "current",
  "stale",
  "expired",
  "superseded",
  "invalidated",
  "retired"
]);
var CLASSIFICATIONS = /* @__PURE__ */ new Set(["public", "internal", "confidential", "personal"]);
function validateCaptureReference(value, label) {
  if (typeof value !== "string" || !/^(host|artifact|evidence):[a-z0-9][a-z0-9._:-]*$/i.test(value)) {
    invalid2(`${label} must be a logical host/artifact/evidence reference, never a machine path`);
  }
}
function validateCapture(value) {
  assertExactKeys(value, /* @__PURE__ */ new Set([
    "source",
    "reference",
    "actor",
    "captured_at",
    "command",
    "exit_code",
    "checks",
    "classification",
    "command_digest"
  ]), "capture");
  validateCriteriaRef(value.command_digest, "capture.command_digest");
  if (value.source !== "host-command") invalid2("capture.source must be host-command");
  validateCaptureReference(value.reference, "capture.reference");
  validateActor(value.actor, "capture.actor");
  assertTimestamp(value.captured_at, "capture.captured_at");
  if (!Array.isArray(value.command) || value.command.length === 0) invalid2("capture.command is required");
  value.command.forEach((entry) => assertNonEmptyString(entry, "capture.command entry"));
  if (!Number.isSafeInteger(value.exit_code)) invalid2("capture.exit_code must be an integer");
  assertStringArray(value.checks, "capture.checks");
  if (!CLASSIFICATIONS.has(value.classification)) invalid2("capture.classification is unsupported");
  return value;
}
function validateDecisionProvenance(value, label) {
  assertExactKeys(value, /* @__PURE__ */ new Set(["source", "reference", "attributed_to", "captured_at"]), label);
  if (!(/* @__PURE__ */ new Set(["host-interaction", "attributed-supplied"])).has(value.source)) invalid2(`${label}.source is unsupported`);
  validateCaptureReference(value.reference, `${label}.reference`);
  assertNonEmptyString(value.attributed_to, `${label}.attributed_to`);
  assertTimestamp(value.captured_at, `${label}.captured_at`);
}
function validateOperatorDecision(value) {
  const keys = [
    "source",
    "reference",
    "attributed_to",
    "captured_at",
    "subject",
    "content_ref",
    "criteria_ref",
    "kind",
    "decision",
    "deployment",
    "recovery"
  ];
  assertExactKeys(value, new Set(keys), "operator decision");
  validateDecisionProvenance(Object.fromEntries(keys.slice(0, 4).map((key2) => [key2, value[key2]])), "operator decision provenance");
  validateHierarchySubject(value.subject, "operator decision subject");
  validateNullableSubject(value.content_ref, "operator decision content_ref");
  validateCriteriaRef(value.criteria_ref, "operator decision criteria_ref");
  if (!APPROVAL_KINDS.has(value.kind)) invalid2("operator decision kind is unsupported");
  if (!(/* @__PURE__ */ new Set(["approved", "rejected"])).has(value.decision)) invalid2("operator decision is unsupported");
  canonicalJson(value);
}
function operatorDecisionActor(provenance) {
  validateDecisionProvenance(provenance, "operator decision identity");
  return { role: "operator", runId: `human:${createHash2("sha256").update(canonicalJson(provenance)).digest("hex")}` };
}
function validateArtifactBody(body, label) {
  const required2 = /* @__PURE__ */ new Set([
    "schema_version",
    "artifact_id",
    "subject",
    "producer",
    "content_ref",
    "criteria_ref",
    "project_id",
    "run_directory",
    "snapshots",
    "manifest_path",
    "classification",
    "media_type",
    "title",
    "created_at"
  ]);
  assertExactKeys(body, /* @__PURE__ */ new Set([...required2, "input_basis"]), label, required2);
  if (body.input_basis !== void 0) {
    if (!Array.isArray(body.input_basis)) invalid2(`${label}.input_basis must be an array`);
    const references = /* @__PURE__ */ new Set();
    for (const basis of body.input_basis) {
      assertExactKeys(basis, /* @__PURE__ */ new Set(["reference", "digest"]), `${label}.input_basis entry`);
      assertNonEmptyString(basis.reference, `${label}.input reference`);
      validateCriteriaRef(basis.digest, `${label}.input digest`);
      if (references.has(basis.reference)) invalid2(`${label}.input_basis has duplicate references`);
      references.add(basis.reference);
    }
  }
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  assertUuid(body.artifact_id, `${label}.artifact_id`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  validateActor(body.producer, `${label}.producer`);
  validateSubjectRef(body.content_ref, `${label}.content_ref`);
  validateCriteriaRef(body.criteria_ref, `${label}.criteria_ref`);
  assertNullableString(body.project_id, `${label}.project_id`);
  assertNonEmptyString(body.run_directory, `${label}.run_directory`);
  if (!Array.isArray(body.snapshots)) invalid2(`${label}.snapshots must be an array`);
  for (const snapshot of body.snapshots) {
    assertExactKeys(snapshot, /* @__PURE__ */ new Set(["path", "digest", "snapshot_path"]), `${label}.snapshot`);
    assertNonEmptyString(snapshot.path, `${label}.snapshot.path`);
    assertNonEmptyString(snapshot.snapshot_path, `${label}.snapshot.snapshot_path`);
    validateCriteriaRef(snapshot.digest, `${label}.snapshot.digest`);
  }
  if (body.content_ref.kind === "git" !== (body.snapshots.length === 0)) invalid2(`${label} requires exact non-Git snapshots`);
  assertNullableString(body.manifest_path, `${label}.manifest_path`);
  if (body.content_ref.kind === "git" !== (body.manifest_path === null)) invalid2(`${label} requires non-Git manifest`);
  if (!CLASSIFICATIONS.has(body.classification)) invalid2(`${label}.classification is unsupported`);
  for (const key2 of ["media_type", "title"]) assertNonEmptyString(body[key2], `${label}.${key2}`);
  assertTimestamp(body.created_at, `${label}.created_at`);
}
function validateAssetBody(body, label) {
  assertExactKeys(body, /* @__PURE__ */ new Set([
    "schema_version",
    "asset_id",
    "subject",
    "artifact_id",
    "revision",
    "producer",
    "completion_authority",
    "validity_owner",
    "disposition",
    "validity",
    "target",
    "completion_approval_id",
    "input_asset_ids",
    "supersedes",
    "superseded_by",
    "history",
    "updated_at"
  ]), label);
  if (body.schema_version !== 1) invalid2(`${label}.schema_version must be 1`);
  for (const key2 of ["asset_id", "artifact_id"]) assertUuid(body[key2], `${label}.${key2}`);
  validateHierarchySubject(body.subject, `${label}.subject`);
  if (!Number.isSafeInteger(body.revision) || body.revision < 1) invalid2(`${label}.revision must be positive`);
  validateActor(body.producer, `${label}.producer`);
  assertNonEmptyString(body.completion_authority, `${label}.completion_authority`);
  assertNullableString(body.validity_owner, `${label}.validity_owner`);
  if (!ASSET_DISPOSITIONS.has(body.disposition) || !ASSET_VALIDITIES.has(body.validity)) invalid2(`${label} has unsupported state`);
  assertNonEmptyString(body.target, `${label}.target`);
  for (const key2 of ["completion_approval_id", "supersedes", "superseded_by"]) {
    if (body[key2] !== null) assertUuid(body[key2], `${label}.${key2}`);
  }
  assertStringArray(body.input_asset_ids, `${label}.input_asset_ids`);
  for (const id of body.input_asset_ids) assertUuid(id, `${label}.input_asset_ids entry`);
  if (!Array.isArray(body.history) || body.history.length === 0) invalid2(`${label}.history is required`);
  for (const entry of body.history) {
    assertExactKeys(entry, /* @__PURE__ */ new Set(["disposition", "validity", "target", "reason", "at", "at_subject_version"]), `${label}.history entry`);
    if (!Number.isSafeInteger(entry.at_subject_version) || entry.at_subject_version < 1) invalid2(`${label}.history subject version must be positive`);
    if (!ASSET_DISPOSITIONS.has(entry.disposition) || !ASSET_VALIDITIES.has(entry.validity)) invalid2(`${label} history has unsupported state`);
    assertNonEmptyString(entry.target, `${label}.history.target`);
    assertNonEmptyString(entry.reason, `${label}.history.reason`);
    assertTimestamp(entry.at, `${label}.history.at`);
  }
  assertTimestamp(body.updated_at, `${label}.updated_at`);
}
function validateProducerCommand(command2) {
  if (!HIERARCHY_KINDS.has(command2.recordKind) || command2.expectedVersion < 1) {
    invalid2(`${command2.kind} requires an existing hierarchy subject`);
  }
  if (command2.kind === "artifact.register") {
    const required2 = /* @__PURE__ */ new Set([
      "artifactId",
      "assetId",
      "subject",
      "projectId",
      "classification",
      "mediaType",
      "title",
      "inputAssetIds",
      "at"
    ]);
    assertExactKeys(command2.payload, /* @__PURE__ */ new Set([...required2, "recoveryLeaseToken"]), "artifact.register payload", required2);
    if (Object.hasOwn(command2.payload, "recoveryLeaseToken")) {
      assertNonEmptyString(command2.payload.recoveryLeaseToken, "artifact.register recoveryLeaseToken");
    }
    for (const key2 of ["artifactId", "assetId"]) assertUuid(command2.payload[key2], `artifact.register ${key2}`);
    validateSubjectRef(command2.payload.subject);
    assertNullableString(command2.payload.projectId, "artifact.register projectId");
    if (!CLASSIFICATIONS.has(command2.payload.classification)) invalid2("artifact.register classification is unsupported");
    for (const key2 of ["mediaType", "title"]) assertNonEmptyString(command2.payload[key2], `artifact.register ${key2}`);
    assertStringArray(command2.payload.inputAssetIds, "artifact.register inputAssetIds");
    for (const id of command2.payload.inputAssetIds) assertUuid(id, "artifact.register inputAssetIds entry");
    assertTimestamp(command2.payload.at, "artifact.register at");
  } else if (command2.kind === "asset.transition") {
    assertExactKeys(command2.payload, /* @__PURE__ */ new Set([
      "assetId",
      "disposition",
      "validity",
      "target",
      "approvalId",
      "supersedes",
      "reason",
      "at"
    ]), "asset.transition payload");
    assertUuid(command2.payload.assetId, "asset.transition assetId");
    for (const key2 of ["approvalId", "supersedes"]) {
      if (command2.payload[key2] !== null) assertUuid(command2.payload[key2], `asset.transition ${key2}`);
    }
    if (!ASSET_DISPOSITIONS.has(command2.payload.disposition) || !ASSET_VALIDITIES.has(command2.payload.validity)) invalid2("asset.transition state is unsupported");
    assertNullableString(command2.payload.target, "asset.transition target");
    assertNonEmptyString(command2.payload.reason, "asset.transition reason");
    assertTimestamp(command2.payload.at, "asset.transition at");
  } else {
    assertExactKeys(command2.payload, new Set(command2.kind === "evidence.register" ? ["body", "tier"] : ["body"]), `${command2.kind} payload`);
    const kind = command2.kind.split(".")[0];
    recordBodyValidators.get(kind)(command2.payload.body, `${command2.kind} body`);
    const subject = { kind: command2.recordKind, id: command2.recordId };
    if (!subjectEquals(command2.payload.body.subject, subject)) {
      invalid2(`${command2.kind} must bind the primary hierarchy subject`);
    }
    if (kind === "review" && command2.recordKind !== "task") {
      invalid2("review.record requires an existing Task");
    }
    if (kind === "approval" && command2.recordKind !== "task" && command2.payload.body.kind !== "completion") {
      invalid2("only completion approvals may bind parent hierarchy subjects");
    }
    if (kind === "evidence" && command2.recordKind !== "task" && command2.payload.body.kind !== "parent-completion") {
      invalid2("only parent-completion evidence may bind parent hierarchy subjects");
    }
    if (Object.hasOwn(command2.payload.body, "provenance")) invalid2("provenance is host-derived, not command input");
    if (Object.hasOwn(command2.payload.body, "recorded_at_subject_version")) invalid2("recorded subject version is runtime-derived");
    if (kind === "evidence" && !(/* @__PURE__ */ new Set(["observed", "declared"])).has(command2.payload.tier)) invalid2("evidence.register tier is unsupported");
  }
}
var recordBodyValidators = /* @__PURE__ */ new Map([
  ["question", validateQuestionBody],
  ["attempt", validateAttemptBody],
  ["host-attempt", validateHostRecord],
  ["evidence", validateEvidenceBody],
  ["review", validateReviewBody],
  ["approval", validateApprovalBody],
  ["message", validateMessageBody],
  ["grant", validateGrantBody],
  ["artifact", validateArtifactBody],
  ["asset", validateAssetBody],
  ["effect", (body, label) => validateHostRecord(body, label, true)]
]);
function validateAtPayload3(command2, kind, keys) {
  if (!HIERARCHY_KINDS.has(command2.recordKind)) invalid2(`${kind} requires a hierarchy recordKind`);
  if (command2.expectedVersion < 1) invalid2(`${kind} requires an existing record version`);
  assertExactKeys(command2.payload, new Set(keys), `${kind} payload`);
}
function validateHandoffContent2(content) {
  assertExactKeys(content, /* @__PURE__ */ new Set([
    "did",
    "needs",
    "assetState",
    "authority",
    "revalidation",
    "questions"
  ]), "task.handoff payload.content");
  for (const key2 of ["did", "needs", "assetState", "authority", "revalidation"]) {
    assertNonEmptyString(content[key2], `task.handoff payload.content.${key2}`);
  }
  assertStringArray(content.questions, "task.handoff payload.content.questions");
}
function validateMessagePayload(command2, kind, contentValidator) {
  validateAtPayload3(command2, kind, [
    ...kind === "question.open" ? ["questionId"] : [],
    ...kind === "question.answer" ? ["questionId"] : [],
    "messageId",
    "parentId",
    "recipient",
    "kind",
    "createdAt",
    "content",
    "artifactRefs",
    "evidenceRefs",
    "provenance"
  ]);
  if (kind === "question.open" || kind === "question.answer") {
    assertNonEmptyString(command2.payload.questionId, `${kind} payload.questionId`);
  }
  assertUuid(command2.payload.messageId, `${kind} payload.messageId`);
  if (command2.payload.parentId !== null) {
    assertUuid(command2.payload.parentId, `${kind} payload.parentId`);
  }
  assertNonEmptyString(command2.payload.recipient, `${kind} payload.recipient`);
  assertNonEmptyString(command2.payload.kind, `${kind} payload.kind`);
  const expectedKind = kind === "question.open" ? "question" : "answer";
  if (command2.payload.kind !== expectedKind) {
    invalid2(`${kind} payload.kind must be "${expectedKind}"`);
  }
  assertTimestamp(command2.payload.createdAt, `${kind} payload.createdAt`);
  contentValidator(command2.payload.content);
  assertStringArray(command2.payload.artifactRefs, `${kind} payload.artifactRefs`);
  assertStringArray(command2.payload.evidenceRefs, `${kind} payload.evidenceRefs`);
  if (!PROVENANCE_KINDS2.has(command2.payload.provenance)) {
    invalid2(`${kind} payload.provenance is unsupported`);
  }
}
function validateQuestionContent(content) {
  assertExactKeys(content, /* @__PURE__ */ new Set([
    "questionKind",
    "blocking",
    "context",
    "ask",
    "answerBy"
  ]), "question.open payload.content");
  if (!QUESTION_KINDS.has(content.questionKind)) {
    invalid2("question.open payload.content.questionKind is unsupported");
  }
  assertBoolean(content.blocking, "question.open payload.content.blocking");
  assertNonEmptyString(content.context, "question.open payload.content.context");
  assertNonEmptyString(content.ask, "question.open payload.content.ask");
  assertNonEmptyString(content.answerBy, "question.open payload.content.answerBy");
}
function validateAnswerContent(content) {
  assertExactKeys(
    content,
    /* @__PURE__ */ new Set(["status", "answer", "lane", "resolves"]),
    "question.answer payload.content",
    /* @__PURE__ */ new Set(["status", "answer", "lane"])
  );
  if (content.status !== "answered") {
    invalid2('question.answer payload.content.status must be "answered"');
  }
  assertNonEmptyString(content.answer, "question.answer payload.content.answer");
  if (content.lane !== "in-lane" && content.lane !== "out-of-lane") {
    invalid2("question.answer payload.content.lane is unsupported");
  }
  if (Object.hasOwn(content, "resolves")) {
    assertStringArray(content.resolves, "question.answer payload.content.resolves", { nonEmpty: true });
    for (const id of content.resolves) assertUuid(id, "question.answer payload.content.resolves entry");
    if (content.lane !== "in-lane") invalid2("out-of-lane answers cannot resolve contradictions");
  }
}
function validateRecover(command2) {
  validateAtPayload3(command2, "attempt.recover", [
    "attemptId",
    "observed",
    "disposition",
    "recoveryEvidenceIds",
    "redispatch",
    "createdAt",
    "expiresAt"
  ]);
  assertUuid(command2.payload.attemptId, "attempt.recover payload.attemptId");
  assertNonEmptyString(command2.payload.observed, "attempt.recover payload.observed");
  if (!RECOVERY_DISPOSITIONS.has(command2.payload.disposition)) {
    invalid2("attempt.recover payload.disposition is unsupported");
  }
  assertStringArray(
    command2.payload.recoveryEvidenceIds,
    "attempt.recover payload.recoveryEvidenceIds"
  );
  validateNullableActor(command2.payload.redispatch, "attempt.recover payload.redispatch");
  assertTimestamp(command2.payload.createdAt, "attempt.recover payload.createdAt");
  if (command2.payload.expiresAt !== null) {
    assertTimestamp(command2.payload.expiresAt, "attempt.recover payload.expiresAt");
  }
  if (command2.payload.disposition === "safe-to-resume") {
    if (command2.payload.redispatch === null !== (command2.payload.expiresAt === null)) {
      invalid2("safe recovery requires redispatch and expiresAt together, or neither");
    }
    if (command2.payload.expiresAt !== null && Date.parse(command2.payload.expiresAt) <= Date.parse(command2.payload.createdAt)) {
      invalid2("recovered lease expiresAt must be after createdAt");
    }
  } else if (command2.payload.redispatch !== null || command2.payload.expiresAt !== null) {
    invalid2("conflicting recovery cannot redispatch or set expiresAt");
  }
}
var commandValidatorKinds = /* @__PURE__ */ new Map([
  ["host", validateHostCommand],
  ["hierarchy", validateParentCommand],
  ["task", validateTaskCommand],
  ["producer", validateProducerCommand],
  ["message", (command2) => command2.kind === "question.open" ? validateMessagePayload(command2, "question.open", validateQuestionContent) : validateMessagePayload(command2, "question.answer", validateAnswerContent)],
  ["recovery", validateRecover]
]);
var commandValidators = new Map([
  ...[...COMMAND_KINDS].map((kind) => [
    kind,
    commandValidatorKinds.get(commandKind(kind).validator)
  ])
]);
function validateAuthority(authority) {
  assertExactKeys(authority, /* @__PURE__ */ new Set(["roles", "grants"]), "authority");
  assertStringArray(authority.roles, "authority.roles");
  if (authority.roles.includes("operator")) {
    invalid2("operator is a reserved endpoint, not an installed role");
  }
  if (!Array.isArray(authority.grants)) invalid2("authority.grants must be an array");
  for (const [index, grant] of authority.grants.entries()) {
    const label = `authority.grants[${index}]`;
    assertExactKeys(grant, /* @__PURE__ */ new Set([
      "actor",
      "actions",
      "recordKind",
      "recordId",
      "basisRef"
    ]), label);
    validateActor(grant.actor, `${label}.actor`);
    assertStringArray(grant.actions, `${label}.actions`, { nonEmpty: true });
    for (const action of grant.actions) {
      if (!COMMAND_KINDS.has(action)) {
        invalid2(`${label}.actions contains unsupported action "${action}"`);
      }
    }
    if (!RECORD_KINDS.has(grant.recordKind)) {
      invalid2(`${label}.recordKind is unsupported`);
    }
    assertNonEmptyString(grant.recordId, `${label}.recordId`);
    assertNonEmptyString(grant.basisRef, `${label}.basisRef`);
  }
  return authority;
}
function validateCommand(command2) {
  if (!isPlainObject(command2)) invalid2("command must be an object");
  assertExactKeys(command2, /* @__PURE__ */ new Set([
    "operationId",
    "kind",
    "actor",
    "recordKind",
    "recordId",
    "expectedVersion",
    "leaseToken",
    "payload"
  ]), "command");
  assertUuid(command2.operationId, "command.operationId");
  assertNonEmptyString(command2.kind, "command.kind");
  if (!COMMAND_KINDS.has(command2.kind)) {
    invalid2(`unsupported command kind "${command2.kind}"`);
  }
  validateActor(command2.actor, "command.actor");
  if (!RECORD_KINDS.has(command2.recordKind)) {
    invalid2(`unsupported record kind "${command2.recordKind}"`);
  }
  assertNonEmptyString(command2.recordId, "command.recordId");
  if (!Number.isSafeInteger(command2.expectedVersion) || command2.expectedVersion < 0) {
    invalid2("command.expectedVersion must be a non-negative safe integer");
  }
  if (command2.leaseToken !== null) {
    assertNonEmptyString(command2.leaseToken, "command.leaseToken");
  }
  if (!isPlainObject(command2.payload)) invalid2("command.payload must be an object");
  canonicalJson(command2.payload);
  commandValidators.get(command2.kind)(command2);
  return command2;
}
function validateCommandMutation(command2, current, nextBody) {
  if (!isPlainObject(nextBody)) invalid2(`${command2.kind} must produce an object body`);
  const declaration = commandKind(command2.kind);
  if (declaration.validator === "host") {
    validateHostMutation(command2, current, nextBody);
    return nextBody;
  }
  if (declaration.validator === "hierarchy") {
    validateParentCommandMutation(command2, current, nextBody);
    return nextBody;
  }
  if (declaration.validator === "task") {
    validateTaskCommandMutation(command2, current, nextBody);
    return nextBody;
  }
  if (command2.kind.endsWith(".create")) {
    if (current) invalid2(`${command2.kind} requires a missing record`);
    if (canonicalJson(nextBody) !== canonicalJson(command2.payload.body)) {
      invalid2(`${command2.kind} must create the supplied body exactly`);
    }
    return nextBody;
  }
  if (!current) invalid2(`${command2.kind} requires an existing record`);
  assertChangedOnly(
    current,
    nextBody,
    new Set(declaration.allowedMutations),
    command2.kind
  );
  return nextBody;
}
function validateRecord(record2) {
  if (!isPlainObject(record2)) invalid2("record must be an object");
  assertExactKeys(record2, /* @__PURE__ */ new Set([
    "kind",
    "id",
    "subject",
    "version",
    "body"
  ]), "record");
  if (!RECORD_KINDS.has(record2.kind)) {
    invalid2(`unsupported record kind "${record2.kind}"`);
  }
  const declaration = recordKind(record2.kind);
  if (declaration.validator === "hierarchy" || declaration.validator === "task") {
    validateHierarchyRecord(record2);
    return record2;
  }
  assertNonEmptyString(record2.id, "record.id");
  if (record2.subject !== null) {
    validateHierarchySubject(record2.subject, "record.subject");
  }
  if (!Number.isSafeInteger(record2.version) || record2.version < 1) {
    invalid2("record.version must be a positive safe integer");
  }
  const validator = recordBodyValidators.get(record2.kind);
  validator(record2.body, `record ${record2.kind}/${record2.id} body`);
  if ((/* @__PURE__ */ new Set([
    "question",
    "attempt",
    "host-attempt",
    "effect",
    "evidence",
    "review",
    "approval",
    "artifact",
    "asset",
    "message",
    "grant"
  ])).has(record2.kind) && (record2.subject === null || !subjectEquals(record2.subject, record2.body.subject))) {
    invalid2(`${record2.kind} record envelope subject must match body.subject`);
  }
  const identityKeys = /* @__PURE__ */ new Map([
    ["artifact", "artifact_id"],
    ["asset", "asset_id"],
    ["question", "question_id"],
    ["attempt", "attempt_id"],
    ["host-attempt", "attempt_id"],
    ["effect", "effect_id"],
    ["evidence", "evidence_id"],
    ["review", "review_id"],
    ["approval", "approval_id"],
    ["message", "message_id"],
    ["grant", "grant_id"]
  ]);
  const identityKey = identityKeys.get(record2.kind);
  if (identityKey && record2.id !== record2.body[identityKey]) {
    invalid2(`${record2.kind} record id must match body.${identityKey}`);
  }
  return record2;
}

// src/core/lib/direction.mjs
import { createHash as createHash3 } from "node:crypto";
import { readFileSync as readFileSync2 } from "node:fs";
import { basename as basename2, join as join3, posix as path2 } from "node:path";
var SECTION_ORDER = [
  ["Vision", "vision"],
  ["Mission", "mission"],
  ["Current Goal", "currentGoal"],
  ["Out of Scope", "outOfScope"]
];
var decoder = new TextDecoder("utf-8", { fatal: true });
function fail3(code, message) {
  const error = new Error(message);
  error.code = code;
  throw error;
}
function exactDirectionFile(publicationRoot) {
  return path2.join(publicationRoot, basename2(directionPath()));
}
function parseTopLevelSections(markdown) {
  const headings = [];
  let inFence = false;
  let fenceChar = null;
  let fenceSize = 0;
  const lines = markdown.matchAll(/.*?(?:\r\n|\n|\r|$)/g);
  for (const match of lines) {
    const line = match[0];
    const start = match.index ?? 0;
    if (!line && start === markdown.length) break;
    const content = line.replace(/[\r\n]+$/, "");
    const fence = /^[ \t]*(`{3,}|~{3,})/.exec(content);
    if (fence) {
      const marker = fence[1];
      if (!inFence) {
        inFence = true;
        fenceChar = marker[0];
        fenceSize = marker.length;
      } else if (marker[0] === fenceChar && marker.length >= fenceSize) {
        inFence = false;
        fenceChar = null;
        fenceSize = 0;
      }
      continue;
    }
    if (inFence) continue;
    const heading = /^# ([^\r\n]+?)\s*$/.exec(content);
    if (!heading) continue;
    headings.push({
      title: heading[1],
      bodyStart: start + line.length,
      start
    });
  }
  if (headings.length !== SECTION_ORDER.length) {
    fail3("INVALID_DIRECTION", "direction must contain exactly Vision, Mission, Current Goal, and Out of Scope once each");
  }
  const sections = {};
  for (const [index, [expectedTitle, key2]] of SECTION_ORDER.entries()) {
    if (headings[index].title !== expectedTitle) {
      fail3("INVALID_DIRECTION", "direction headings must appear exactly once in the required order");
    }
    const bodyEnd = headings[index + 1]?.start ?? markdown.length;
    const body = markdown.slice(headings[index].bodyStart, bodyEnd).trim();
    if (!body) fail3("INVALID_DIRECTION", `${expectedTitle} must have a non-empty body`);
    sections[key2] = body;
  }
  return sections;
}
function readDirection({ workspaceRoot: workspaceRoot2, manifest, projectId }) {
  const project = resolveConfiguredProject({ workspaceRoot: workspaceRoot2, manifest, projectId });
  const relativePath = exactDirectionFile(project.publicationRoot);
  const absolutePath = join3(project.projectRoot, ...relativePath.split("/"));
  let bytes;
  try {
    if (pathHasLink(project.projectRoot, absolutePath) || !exactPath(absolutePath)) {
      fail3("PATH_ESCAPE", `${relativePath} must resolve without symbolic link or junction aliases`);
    }
    bytes = readFileSync2(absolutePath);
  } catch (error) {
    if (error?.code === "ENOENT") fail3("DIRECTION_REQUIRED", `coordinated work requires ${relativePath}`);
    if (error?.code === "PATH_ESCAPE") throw error;
    throw error;
  }
  let markdown;
  try {
    markdown = decoder.decode(bytes);
  } catch {
    fail3("INVALID_DIRECTION", `${relativePath} must be valid UTF-8`);
  }
  const sections = parseTopLevelSections(markdown);
  return {
    path: relativePath,
    hash: createHash3("sha256").update(bytes).digest("hex"),
    goal: sections.currentGoal,
    sections,
    bytes
  };
}

// src/core/lib/coordination-runtime/workspace-guard.mjs
var fail4 = (code, message) => {
  throw new RuntimeError(code, message);
};
function readWorkspaceContract(root, {
  env = process.env
} = {}) {
  root = resolve3(root);
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail4("INVALID_INPUT", result.reason);
  const manifest = result.manifest;
  if (manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    fail4(
      "SCHEMA_MISMATCH",
      "workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard"
    );
  }
  if (pathHasLink(root, result.path)) fail4("INVALID_INPUT", "workspace manifest cannot traverse links");
  const validation = validateSchema5Manifest(root, manifest, { env });
  if (validation.errors.length) fail4("INVALID_INPUT", validation.errors.join("; "));
  try {
    readDirection({ workspaceRoot: root, manifest });
  } catch (error) {
    fail4(error.code ?? "INVALID_INPUT", error.message);
  }
  return manifest;
}
function assertWorkspaceWrite(path4, {
  privateCheck = true,
  requirePrivate = false,
  env = process.env
} = {}) {
  path4 = resolve3(path4);
  const runtime = dirname4(path4);
  const core = dirname4(runtime);
  const privateRoot = dirname4(core);
  const root = dirname4(privateRoot);
  const expected = resolve3(root, ...COORDINATION_DATABASE.split("/"));
  if ((process.platform === "win32" ? path4.toLowerCase() : path4) !== (process.platform === "win32" ? expected.toLowerCase() : expected)) {
    fail4(
      "INVALID_INPUT",
      "coordination writes require the exact current workspace database"
    );
  }
  const manifest = join4(root, ".kai", "manifest.json");
  if (!existsSync3(manifest)) fail4("RECOVERY_REQUIRED", "workspace coordination writes require a schema 5 manifest");
  if (pathHasLink(root, manifest) || !exactPath(manifest) || !lstatSync2(manifest).isFile()) {
    fail4("INVALID_INPUT", "coordination manifest must be an exact unlinked regular file");
  }
  const parsed = readWorkspaceContract(root, { env });
  if (!existsSync3(path4)) fail4("RECOVERY_REQUIRED", "schema-5 coordination database is missing");
  if (pathHasLink(root, path4) || !exactPath(path4) || !lstatSync2(path4).isFile()) {
    fail4("INVALID_INPUT", "coordination database must be the exact unlinked schema-5 regular file");
  }
  if (privateCheck && requirePrivate) {
    const privacy = inspectGitPrivacy(root, parsed.placement);
    const errors = [...privacy.errors, ...privacy.missing.map((name) => `private workspace path must be ignored: ${name}`)];
    if (parsed.placement === "repo-local" && !privacy.gitRoot) {
      errors.push("repo-local placement requires a readable Git work tree");
    }
    if (errors.length) fail4("INVALID_INPUT", errors.join("; "));
  }
}

// src/core/lib/coordination-runtime/store.mjs
import { existsSync as existsSync4, mkdirSync, statSync } from "node:fs";
import { dirname as dirname5 } from "node:path";
import { DatabaseSync } from "node:sqlite";
var SCHEMA_VERSION = 2;
var MESSAGE_SCHEMA_VERSION = 1;
var STORE_MODES = /* @__PURE__ */ new Set(["create", "read", "write"]);
var MESSAGE_COMMANDS = /* @__PURE__ */ new Set([
  "task.handoff",
  "question.open",
  "question.answer",
  "attempt.recover"
]);
var EVENTS_TABLE_SQL = `CREATE TABLE events (
  seq INTEGER PRIMARY KEY AUTOINCREMENT,
  operation_id TEXT NOT NULL,
  subject_kind TEXT,
  subject_id TEXT,
  payload TEXT NOT NULL CHECK (json_valid(payload)),
  event_kind TEXT GENERATED ALWAYS AS (json_extract(payload, '$.kind')) STORED NOT NULL,
  message_id TEXT GENERATED ALWAYS AS (
    CASE json_extract(payload, '$.kind')
      WHEN 'attempt.recover' THEN json_extract(payload, '$.payload.attemptId')
      WHEN 'question.open' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'question.answer' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'task.handoff' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'epic.message' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'feature.message' THEN json_extract(payload, '$.payload.messageId')
      WHEN 'requirement.message' THEN json_extract(payload, '$.payload.messageId')
    END
  ) STORED,
  approval_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'approval.record'
      THEN json_extract(payload, '$.payload.body.approval_id') END
  ) STORED,
  question_id TEXT GENERATED ALWAYS AS (
    CASE WHEN json_extract(payload, '$.kind') = 'question.open'
      THEN json_extract(payload, '$.payload.questionId') END
  ) STORED,
  thread_id TEXT,
  CHECK ((subject_kind IS NULL) = (subject_id IS NULL))
)`;
var REQUIRED_INDEX_SQL = [
  "CREATE INDEX records_by_subject ON records(kind, subject_kind, subject_id)",
  `CREATE INDEX records_by_question_status ON records(subject_kind, subject_id, json_extract(body, '$.status'))
    WHERE kind = 'question'`,
  `CREATE INDEX records_by_criteria ON records(kind, subject_kind, subject_id, json_extract(body, '$.criteria_ref'))`,
  `CREATE INDEX events_by_thread ON events(thread_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_message ON events(message_id, seq) WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_subject_messages ON events(subject_kind, subject_id, seq)
    WHERE message_id IS NOT NULL`,
  `CREATE INDEX events_by_subject_kind ON events(subject_kind, subject_id, event_kind, seq, question_id)`,
  `CREATE INDEX events_by_approval ON events(approval_id, seq) WHERE approval_id IS NOT NULL`
];
var REQUIRED_TRIGGER_SQL = [
  `CREATE TRIGGER events_capture_thread AFTER INSERT ON events
    WHEN NEW.message_id IS NOT NULL
    BEGIN
      UPDATE events SET thread_id = COALESCE(
        (SELECT json_extract(body, '$.thread_id') FROM records
          WHERE kind = 'message' AND id = NEW.message_id), NEW.thread_id, NEW.subject_id)
      WHERE seq = NEW.seq;
    END`,
  `CREATE TRIGGER messages_capture_thread AFTER INSERT ON records
    WHEN NEW.kind = 'message'
    BEGIN
      UPDATE events SET thread_id = json_extract(NEW.body, '$.thread_id')
      WHERE message_id = NEW.id;
    END`,
  `CREATE TRIGGER messages_update_thread AFTER UPDATE OF body ON records
    WHEN NEW.kind = 'message'
    BEGIN
      UPDATE events SET thread_id = json_extract(NEW.body, '$.thread_id')
      WHERE message_id = NEW.id;
    END`
];
var REQUIRED_TABLES = /* @__PURE__ */ new Set(["metadata", "records", "events", "operations"]);
var REQUIRED_COLUMNS = /* @__PURE__ */ new Map([
  ["metadata", [
    ["key", "TEXT", 0, null, 1],
    ["value", "TEXT", 1, null, 0]
  ]],
  ["records", [
    ["kind", "TEXT", 1, null, 1],
    ["id", "TEXT", 1, null, 2],
    ["subject_kind", "TEXT", 0, null, 0],
    ["subject_id", "TEXT", 0, null, 0],
    ["version", "INTEGER", 1, null, 0],
    ["body", "TEXT", 1, null, 0]
  ]],
  ["events", [
    ["seq", "INTEGER", 0, null, 1],
    ["operation_id", "TEXT", 1, null, 0],
    ["subject_kind", "TEXT", 0, null, 0],
    ["subject_id", "TEXT", 0, null, 0],
    ["payload", "TEXT", 1, null, 0],
    ["event_kind", "TEXT", 1, null, 0, 3],
    ["message_id", "TEXT", 0, null, 0, 3],
    ["approval_id", "TEXT", 0, null, 0, 3],
    ["question_id", "TEXT", 0, null, 0, 3],
    ["thread_id", "TEXT", 0, null, 0]
  ]],
  ["operations", [
    ["id", "TEXT", 0, null, 1],
    ["payload_digest", "TEXT", 1, null, 0],
    ["receipt", "TEXT", 1, null, 0]
  ]]
]);
var REQUIRED_TABLE_SQL = /* @__PURE__ */ new Map([
  [
    "metadata",
    "create table metadata(key text primary key,value text not null)"
  ],
  [
    "records",
    "create table records(kind text not null,id text not null,subject_kind text,subject_id text,version integer not null check(version>0),body text not null check(json_valid(body)),primary key(kind,id),check((subject_kind is null)=(subject_id is null)))"
  ],
  ["events", normalizeSchemaSql(EVENTS_TABLE_SQL)],
  [
    "operations",
    "create table operations(id text primary key,payload_digest text not null,receipt text not null check(json_valid(receipt)))"
  ]
]);
var SCHEMA = `
CREATE TABLE metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
CREATE TABLE records (
  kind TEXT NOT NULL, id TEXT NOT NULL,
  subject_kind TEXT, subject_id TEXT,
  version INTEGER NOT NULL CHECK (version > 0),
  body TEXT NOT NULL CHECK (json_valid(body)),
  PRIMARY KEY (kind, id),
  CHECK ((subject_kind IS NULL) = (subject_id IS NULL))
);
${EVENTS_TABLE_SQL};
CREATE TABLE operations (
  id TEXT PRIMARY KEY, payload_digest TEXT NOT NULL,
  receipt TEXT NOT NULL CHECK (json_valid(receipt))
);
${[...REQUIRED_INDEX_SQL, ...REQUIRED_TRIGGER_SQL].join(";\n")};
`;
function invalid3(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function recovery(message) {
  throw new RuntimeError("RECOVERY_REQUIRED", message);
}
function isSqliteError(error) {
  return error?.code === "ERR_SQLITE_ERROR" && Number.isInteger(error?.errcode);
}
function translateSqliteError(error) {
  if (error instanceof RuntimeError) return error;
  if (isSqliteError(error) && (error.errcode === 5 || error.errcode === 6)) {
    const busy = new RuntimeError("STORE_BUSY", "coordination store is busy", true);
    busy.cause = error;
    return busy;
  }
  return error;
}
function runSqlite(operation) {
  try {
    return operation();
  } catch (error) {
    throw translateSqliteError(error);
  }
}
function assertStore(store) {
  if (!store || typeof store !== "object" || !(store.database instanceof DatabaseSync)) {
    invalid3("store must be an open coordination store");
  }
  if (store.closed) invalid3("coordination store is closed");
}
function parseJson(text2, label) {
  try {
    return JSON.parse(text2);
  } catch {
    recovery(`${label} contains invalid JSON`);
  }
}
function validateStoreSubject(subject, label, {
  allowNull = true,
  allowUndefined = false
} = {}) {
  if (subject === void 0 && allowUndefined) return subject;
  if (subject === null && allowNull) return subject;
  if (!subject || typeof subject !== "object" || Array.isArray(subject)) {
    invalid3(`${label} must be a typed subject${allowNull ? " or null" : ""}`);
  }
  if (canonicalJson(Object.keys(subject).sort()) !== '["id","kind"]') {
    invalid3(`${label} must contain only kind and id`);
  }
  validateHierarchySubject(subject, label);
  return subject;
}
function decodeRecord(row, store = null) {
  if (!row) return null;
  const record2 = {
    kind: row.kind,
    id: row.id,
    subject: row.subject_kind === null ? null : { kind: row.subject_kind, id: row.subject_id },
    version: row.version,
    body: parseJson(row.body, `record ${row.kind}/${row.id}`)
  };
  try {
    return validateRecord(record2);
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "INVALID_INPUT") {
      recovery(`record ${row.kind}/${row.id} is malformed: ${error.message}`);
    }
    throw error;
  }
}
function recordProjection(store, alias = "") {
  const prefix = alias ? `${alias}.` : "";
  return `${prefix}kind, ${prefix}id, ${prefix}subject_kind, ${prefix}subject_id,
    ${prefix}version, ${prefix}body`;
}
function subjectFilter(store, subject, alias = "") {
  validateStoreSubject(subject, "record subject");
  const prefix = alias ? `${alias}.` : "";
  if (subject === null) {
    return {
      sql: `${prefix}subject_kind IS NULL AND ${prefix}subject_id IS NULL`,
      params: []
    };
  }
  return {
    sql: `${prefix}subject_kind = ? AND ${prefix}subject_id = ?`,
    params: [subject.kind, subject.id]
  };
}
function matchingSubjects(store, leftAlias, rightAlias) {
  return `${leftAlias}.subject_kind IS ${rightAlias}.subject_kind
    AND ${leftAlias}.subject_id IS ${rightAlias}.subject_id`;
}
function readSubjectRecord(store, kind, id, subject) {
  const filter = subjectFilter(store, subject);
  const row = runSqlite(() => store.database.prepare(`
    SELECT ${recordProjection(store)}
    FROM records
    WHERE kind = ? AND id = ? AND ${filter.sql}
  `).get(kind, id, ...filter.params));
  return decodeRecord(row, store);
}
function validateReceipt(receipt, operationId) {
  if (!receipt || typeof receipt !== "object" || Array.isArray(receipt) || receipt.ok !== true || receipt.operationId !== operationId || !Number.isSafeInteger(receipt.recordVersion) || !Number.isSafeInteger(receipt.eventSeq) || !receipt.data || typeof receipt.data !== "object" || Array.isArray(receipt.data)) {
    recovery(`operation ${operationId} has a malformed receipt`);
  }
  return receipt;
}
function normalizeSchemaSql(sql) {
  const literals = [];
  return sql.replace(/'(?:''|[^'])*'/g, (literal) => {
    literals.push(literal);
    return `@literal${literals.length - 1}@`;
  }).toLowerCase().replace(/["`\[\]]/g, "").replace(/\s+/g, " ").replace(/\s*([(),>])\s*/g, "$1").trim().replace(/@literal(\d+)@/g, (_, index) => literals[Number(index)]);
}
function validatePhysicalSchema(database, {
  columns,
  tableSql,
  indexSql,
  triggerSql
}) {
  for (const [table, expectedColumns] of columns) {
    const columns2 = runSqlite(() => database.prepare(`PRAGMA table_xinfo(${table})`).all());
    const actualColumns = columns2.map((column) => [
      column.name,
      column.type,
      column.notnull,
      column.dflt_value,
      column.pk,
      column.hidden
    ]);
    const expected = expectedColumns.map((column) => column.length === 5 ? [...column, 0] : column);
    if (canonicalJson(actualColumns) !== canonicalJson(expected)) {
      recovery(`coordination database table "${table}" has an unsupported column layout`);
    }
    const row = runSqlite(() => database.prepare(`
      SELECT sql FROM sqlite_master WHERE type = 'table' AND name = ?
    `).get(table));
    const normalizedSql = normalizeSchemaSql(row?.sql ?? "");
    if (normalizedSql !== tableSql.get(table)) {
      recovery(`coordination database table "${table}" has unsupported constraints`);
    }
  }
  for (const definition of [...indexSql, ...triggerSql]) {
    const [, type, name] = /^CREATE (INDEX|TRIGGER) (\w+)/.exec(definition);
    const row = runSqlite(() => database.prepare(
      "SELECT sql FROM sqlite_master WHERE type = ? AND name = ?"
    ).get(type.toLowerCase(), name));
    if (!row || normalizeSchemaSql(row.sql) !== normalizeSchemaSql(definition)) {
      recovery(`coordination database ${type.toLowerCase()} "${name}" is missing or unsupported`);
    }
  }
}
function validateSchema(database, expectedVersion) {
  const quickCheck = runSqlite(() => database.prepare("PRAGMA quick_check").get());
  if (!quickCheck || quickCheck.quick_check !== "ok") {
    recovery("coordination database integrity check failed");
  }
  const tableRows = runSqlite(() => database.prepare(`
    SELECT name FROM sqlite_master WHERE type = 'table'
  `).all());
  const tables = new Set(tableRows.map((row) => row.name));
  for (const table of REQUIRED_TABLES) {
    if (!tables.has(table)) recovery(`coordination database is missing table "${table}"`);
  }
  const metadata = runSqlite(() => database.prepare(
    "SELECT value FROM metadata WHERE key = 'schema_version'"
  ).get());
  if (!metadata) recovery("coordination database has no schema version");
  if (metadata.value !== String(expectedVersion)) {
    recovery(
      `coordination database schema ${JSON.stringify(metadata.value)} is unsupported; expected ${expectedVersion}`
    );
  }
  validatePhysicalSchema(database, {
    columns: REQUIRED_COLUMNS,
    tableSql: REQUIRED_TABLE_SQL,
    indexSql: REQUIRED_INDEX_SQL,
    triggerSql: REQUIRED_TRIGGER_SQL
  });
  const messageMetadata = runSqlite(() => database.prepare(
    "SELECT value FROM metadata WHERE key = 'message_schema_version'"
  ).get());
  if (!messageMetadata) recovery("coordination database has no message schema version");
  if (messageMetadata.value !== String(MESSAGE_SCHEMA_VERSION)) {
    recovery(
      `coordination message schema ${JSON.stringify(messageMetadata.value)} is unsupported; expected ${MESSAGE_SCHEMA_VERSION}`
    );
  }
}
function initializeSchema(database) {
  runSqlite(() => database.exec("BEGIN IMMEDIATE"));
  try {
    runSqlite(() => database.exec(SCHEMA));
    runSqlite(() => database.prepare(
      "INSERT INTO metadata (key, value) VALUES ('schema_version', ?)"
    ).run(String(SCHEMA_VERSION)));
    runSqlite(() => database.prepare(
      "INSERT INTO metadata (key, value) VALUES ('message_schema_version', ?)"
    ).run(String(MESSAGE_SCHEMA_VERSION)));
    runSqlite(() => database.exec("COMMIT"));
  } catch (error) {
    runSqlite(() => database.exec("ROLLBACK"));
    throw error;
  }
}
function openStoreConnection({
  path: path4,
  mode,
  expectedVersion,
  initialize = false
}) {
  if (typeof path4 !== "string" || path4.trim() === "") invalid3("store path must be a string");
  const existed = existsSync4(path4);
  if (!initialize && !existed) {
    recovery(`coordination database does not exist at ${path4}`);
  }
  if (initialize) mkdirSync(dirname5(path4), { recursive: true });
  let database;
  try {
    database = new DatabaseSync(path4, { readOnly: mode === "read" });
    runSqlite(() => database.exec("PRAGMA busy_timeout=1000"));
    const shouldInitialize = initialize && (!existed || statSync(path4).size === 0);
    if (shouldInitialize) initializeSchema(database);
    validateSchema(database, expectedVersion);
    return {
      database,
      path: path4,
      mode,
      schemaVersion: expectedVersion,
      closed: false
    };
  } catch (error) {
    try {
      database?.close();
    } catch {
    }
    const translated = translateSqliteError(error);
    if (translated instanceof RuntimeError) throw translated;
    throw new RuntimeError(
      "RECOVERY_REQUIRED",
      `cannot open coordination database: ${translated.message}`
    );
  }
}
function openStore({ path: path4, mode }) {
  if (!STORE_MODES.has(mode)) invalid3(`unsupported store mode "${mode}"`);
  return openStoreConnection({
    path: path4,
    mode,
    expectedVersion: SCHEMA_VERSION,
    initialize: mode === "create"
  });
}
function closeStore(store) {
  if (!store || typeof store !== "object" || store.closed) return;
  try {
    store.database.close();
  } finally {
    store.closed = true;
  }
}
function readRecord(store, kind, id) {
  assertStore(store);
  if (!RECORD_KINDS.has(kind)) invalid3(`unsupported record kind "${kind}"`);
  if (typeof id !== "string" || id === "") invalid3("record id must be a string");
  const row = runSqlite(() => store.database.prepare(`
    SELECT ${recordProjection(store)}
    FROM records
    WHERE kind = ? AND id = ?
  `).get(kind, id));
  return decodeRecord(row, store);
}
function listRecords(store, options2) {
  assertStore(store);
  if (!options2 || typeof options2 !== "object" || Array.isArray(options2) || Object.keys(options2).some((key2) => !["kind", "subject"].includes(key2))) {
    invalid3("record list options must contain only kind and subject");
  }
  const { kind, subject = void 0 } = options2;
  if (!RECORD_KINDS.has(kind)) invalid3(`unsupported record kind "${kind}"`);
  validateStoreSubject(subject, "record subject", {
    allowNull: true,
    allowUndefined: true
  });
  const rows = runSqlite(() => {
    if (subject === void 0) {
      return store.database.prepare(`
        SELECT ${recordProjection(store)}
        FROM records
        WHERE kind = ?
        ORDER BY id
      `).all(kind);
    }
    const filter = subjectFilter(store, subject);
    return store.database.prepare(`
      SELECT ${recordProjection(store)}
      FROM records
      WHERE kind = ? AND ${filter.sql}
      ORDER BY id
    `).all(kind, ...filter.params);
  });
  return rows.map((row) => decodeRecord(row, store));
}
function listAllRecords(store, { kind }) {
  return listRecords(store, { kind });
}
function readStoreSummary(store) {
  return readSnapshot(store, () => runSqlite(() => {
    const throughSeq2 = Number(store.database.prepare("SELECT COALESCE(MAX(seq), 0) AS seq FROM events").get().seq);
    const taskCount = Number(store.database.prepare("SELECT COUNT(*) AS count FROM records WHERE kind = 'task'").get().count);
    return { throughSeq: throughSeq2, taskCount };
  }));
}
var activeReadSnapshots = /* @__PURE__ */ new WeakSet();
function readSnapshot(store, read2) {
  assertStore(store);
  if (typeof read2 !== "function") invalid3("snapshot reader must be a function");
  if (activeReadSnapshots.has(store)) return read2();
  let inTransaction = false;
  try {
    runSqlite(() => store.database.exec("BEGIN DEFERRED"));
    inTransaction = true;
    activeReadSnapshots.add(store);
    const result = read2();
    if (result && typeof result.then === "function") invalid3("snapshot readers must be synchronous");
    runSqlite(() => store.database.exec("COMMIT"));
    inTransaction = false;
    return result;
  } catch (error) {
    if (inTransaction) {
      try {
        runSqlite(() => store.database.exec("ROLLBACK"));
      } catch (rollbackError) {
        const errors = [error, rollbackError];
        const closeError = invalidateStore(store);
        if (closeError) errors.push(closeError);
        const failure = new RuntimeError(
          "RECOVERY_REQUIRED",
          `read snapshot failed and rollback could not be confirmed: ${error.message}; rollback failed: ${rollbackError.message}`
        );
        failure.cause = new AggregateError(errors, "coordination read snapshot and rollback both failed");
        throw failure;
      }
    }
    throw error;
  } finally {
    activeReadSnapshots.delete(store);
  }
}
function referencedRecordId(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? { kind: match[1].toLowerCase(), id: match[2] } : null;
}
function readSubjectView(store, options2) {
  assertStore(store);
  if (!options2 || typeof options2 !== "object" || Array.isArray(options2) || Object.keys(options2).some((key2) => !["subject", "recentLimit"].includes(key2))) {
    invalid3("subject view options must contain only subject and recentLimit");
  }
  const { subject, recentLimit } = options2;
  validateStoreSubject(subject, "context subject", { allowNull: false });
  if (!Number.isSafeInteger(recentLimit) || recentLimit < 0 || recentLimit > 8) {
    invalid3("context recentLimit must be an integer from 0 through 8");
  }
  return readSnapshot(store, () => {
    const throughSeq2 = Number(runSqlite(() => store.database.prepare(
      "SELECT COALESCE(MAX(seq), 0) AS seq FROM events"
    ).get()).seq);
    const record2 = readRecord(store, subject.kind, subject.id);
    if (!record2) {
      return {
        throughSeq: throughSeq2,
        record: null,
        dependencies: [],
        questions: [],
        recoveryHold: null,
        approvals: [],
        recentMessages: [],
        latestHandoff: null,
        messageCount: 0,
        referencedDetails: []
      };
    }
    const dependencies2 = (record2.kind === "task" ? record2.body.depends_on : []).map((dependency) => ({
      dependency,
      record: readRecord(
        store,
        "task",
        dependency.task
      )
    }));
    const chronology = (column, id) => {
      const filter = subjectFilter(store, subject);
      const row = runSqlite(() => store.database.prepare(`
        SELECT seq FROM events WHERE ${column} = ? AND ${filter.sql} AND seq <= ?
        ORDER BY seq DESC LIMIT 1
      `).get(id, ...filter.params, throughSeq2));
      return row ? Number(row.seq) : null;
    };
    const eventFilter = subjectFilter(store, subject, "e");
    const missingQuestion = runSqlite(() => store.database.prepare(`
      SELECT e.question_id FROM events e
      LEFT JOIN records r ON r.kind = 'question' AND r.id = e.question_id
        AND ${matchingSubjects(store, "r", "e")}
      WHERE ${eventFilter.sql} AND e.event_kind = 'question.open' AND e.seq <= ?
        AND e.question_id IS NOT NULL AND r.id IS NULL
      LIMIT 1
    `).get(...eventFilter.params, throughSeq2));
    if (missingQuestion) {
      throw new RuntimeError("EVIDENCE_GAP", `question/${missingQuestion.question_id} referenced by an opening event is missing`);
    }
    const questionFilter = subjectFilter(store, subject);
    const questionRecords = runSqlite(() => store.database.prepare(`
      SELECT ${recordProjection(store)} FROM records INDEXED BY records_by_question_status
      WHERE kind = 'question' AND ${questionFilter.sql}
        AND json_extract(body, '$.status') = 'open'
    `).all(...questionFilter.params)).map((row) => decodeRecord(row, store));
    const questionsById = new Map(questionRecords.map((record3) => [record3.id, record3]));
    for (const id of record2.body.waiting_on_questions ?? []) {
      if (!questionsById.has(id)) {
        questionsById.set(id, readSubjectRecord(store, "question", id, subject));
      }
    }
    const questions = [...questionsById.values()].map((record3) => ({
      record: record3,
      eventSeq: record3 ? chronology("message_id", record3.body.opened_message_id) : null,
      openedMessage: record3 ? readSubjectRecord(store, "message", record3.body.opened_message_id, subject) : null,
      answerMessages: record3 ? record3.body.answer_message_ids.map((id) => readSubjectRecord(store, "message", id, subject)) : []
    }));
    const approvalFilter = subjectFilter(store, subject);
    const approvals = runSqlite(() => store.database.prepare(`
      SELECT ${recordProjection(store)} FROM records
      WHERE kind = 'approval' AND ${approvalFilter.sql}
        AND json_extract(body, '$.criteria_ref') = ?
    `).all(...approvalFilter.params, criteriaRef(record2, (kind, id) => readRecord(store, kind, id)))).map((row) => {
      const record3 = decodeRecord(row, store);
      return { record: record3, eventSeq: chronology("approval_id", record3.id) };
    });
    const recoveryHoldId = record2.body.recovery_hold ?? null;
    const recoveryHold2 = recoveryHoldId === null ? null : {
      record: readSubjectRecord(store, "attempt", recoveryHoldId, subject),
      eventSeq: chronology("message_id", recoveryHoldId),
      message: readSubjectRecord(store, "message", recoveryHoldId, subject)
    };
    const threadId = subjectRef(subject, record2.version);
    const recentMessages = messageRows(store, threadId, throughSeq2 + 1, recentLimit, subject).map((row) => ({ eventSeq: Number(row.seq), record: decodeMessageRow(row, store) })).reverse();
    const handoffFilter = subjectFilter(store, subject, "e");
    const handoffRow = runSqlite(() => store.database.prepare(`
      SELECT e.seq, e.message_id, ${recordProjection(store, "r")}
      FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
        AND ${matchingSubjects(store, "r", "e")}
      WHERE ${handoffFilter.sql}
        AND e.event_kind = 'task.handoff'
        AND json_extract(r.body, '$.basis_version') = ?
        AND e.seq <= ?
      ORDER BY e.seq DESC LIMIT 1
    `).get(...handoffFilter.params, record2.version, throughSeq2));
    const latestHandoff = handoffRow ? {
      eventSeq: Number(handoffRow.seq),
      record: decodeMessageRow(handoffRow, store)
    } : null;
    const messageCountFilter = subjectFilter(store, subject);
    const messageCount = Number(runSqlite(() => store.database.prepare(`
      SELECT COUNT(*) AS count FROM events
      WHERE thread_id = ? AND ${messageCountFilter.sql}
        AND message_id IS NOT NULL AND seq <= ?
    `).get(threadId, ...messageCountFilter.params, throughSeq2)).count);
    const references = new Set(record2.body.context_artifacts ?? []);
    for (const { record: record3 } of approvals) {
      record3.body.evidence_refs.forEach((reference) => references.add(reference));
    }
    for (const { record: record3 } of recentMessages) {
      if (!record3) continue;
      record3.body.artifact_refs.forEach((reference) => references.add(reference));
      record3.body.evidence_refs.forEach((reference) => references.add(reference));
    }
    if (latestHandoff?.record) {
      latestHandoff.record.body.artifact_refs.forEach((reference) => references.add(reference));
      latestHandoff.record.body.evidence_refs.forEach((reference) => references.add(reference));
    }
    for (const { openedMessage, answerMessages } of questions) {
      for (const message of [openedMessage, ...answerMessages]) {
        if (!message) continue;
        message.body.artifact_refs.forEach((reference) => references.add(reference));
        message.body.evidence_refs.forEach((reference) => references.add(reference));
      }
    }
    for (const id of recoveryHold2?.record?.body.recovery_evidence_ids ?? []) {
      references.add(`evidence:${id}`);
    }
    const referencedDetails = [];
    for (const reference of references) {
      const identity = referencedRecordId(reference);
      if (identity) {
        referencedDetails.push({
          reference,
          record: readRecord(store, identity.kind, identity.id)
        });
      }
    }
    return {
      throughSeq: throughSeq2,
      record: record2,
      dependencies: dependencies2,
      questions,
      recoveryHold: recoveryHold2,
      approvals,
      recentMessages,
      latestHandoff,
      messageCount,
      referencedDetails
    };
  });
}
function messageRows(store, threadId, beforeSeq, limit, subject = void 0) {
  const filter = subject === void 0 ? { sql: "1 = 1", params: [] } : subjectFilter(store, subject, "e");
  return runSqlite(() => store.database.prepare(`
    SELECT e.seq, e.message_id, ${recordProjection(store, "r")}
    FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
      AND ${matchingSubjects(store, "r", "e")}
    WHERE e.thread_id = ? AND ${filter.sql}
      AND e.message_id IS NOT NULL AND e.seq < ?
    ORDER BY e.seq DESC LIMIT ?
  `).all(threadId, ...filter.params, beforeSeq, limit));
}
function decodeMessageRow(row, store) {
  if (row.id === null) {
    throw new RuntimeError(
      "EVIDENCE_GAP",
      `message/${row.message_id} referenced by event ${row.seq} is missing`
    );
  }
  return decodeRecord(row, store);
}
function readMessagePage(store, {
  subject,
  threadId,
  basisVersion,
  beforeSeq = null,
  limit
}) {
  assertStore(store);
  validateStoreSubject(subject, "message subject", { allowNull: false });
  if (typeof threadId !== "string" || threadId !== subjectRef(subject, basisVersion)) {
    invalid3("message thread must bind the requested typed subject and basis version");
  }
  if (!Number.isSafeInteger(basisVersion) || basisVersion < 1) {
    invalid3("message basis version must be a positive safe integer");
  }
  if (beforeSeq !== null && (!Number.isSafeInteger(beforeSeq) || beforeSeq < 1)) {
    invalid3("message beforeSeq must be a positive safe integer or null");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > 100) {
    invalid3("message limit must be an integer from 1 through 100");
  }
  return readSnapshot(store, () => {
    const rows = messageRows(
      store,
      threadId,
      beforeSeq ?? Number.MAX_SAFE_INTEGER,
      limit + 1,
      subject
    );
    const messages = rows.map((row) => {
      const record2 = decodeMessageRow(row, store);
      if (record2.body.thread_id !== threadId || record2.body.basis_version !== basisVersion) {
        throw new RuntimeError(
          "EVIDENCE_GAP",
          `message/${record2.id} does not belong to ${threadId}`
        );
      }
      return { ...record2, eventSeq: Number(row.seq) };
    }).slice(0, limit);
    const hasMore = rows.length > limit;
    const nextCursor = hasMore ? {
      subject,
      threadId,
      basisVersion,
      beforeSeq: messages.at(-1).eventSeq
    } : null;
    return { messages, hasMore, nextCursor };
  });
}
function readOperationReceipt(store, command2) {
  assertStore(store);
  validateCommand(command2);
  const row = runSqlite(() => store.database.prepare(
    "SELECT payload_digest, receipt FROM operations WHERE id = ?"
  ).get(command2.operationId));
  if (!row) return null;
  if (row.payload_digest !== commandDigest(command2)) {
    throw new RuntimeError("OPERATION_CONFLICT", `operation ${command2.operationId} was already used with a different command`);
  }
  return validateReceipt(parseJson(row.receipt, `operation ${command2.operationId} receipt`), command2.operationId);
}
function readMessageOperation(store, messageId) {
  assertStore(store);
  if (typeof messageId !== "string" || messageId === "") {
    invalid3("message id must be a string");
  }
  const row = runSqlite(() => store.database.prepare(`
    SELECT e.operation_id, e.payload, o.receipt
    FROM events e
    JOIN operations o ON o.id = e.operation_id
    WHERE json_extract(e.payload, '$.payload.messageId') = ?
    ORDER BY e.seq
    LIMIT 1
  `).get(messageId));
  if (!row) return null;
  return {
    operationId: row.operation_id,
    event: parseJson(row.payload, `message/${messageId} event`),
    receipt: validateReceipt(
      parseJson(row.receipt, `operation ${row.operation_id} receipt`),
      row.operation_id
    )
  };
}
function writeRecord(database, record2) {
  const current = runSqlite(() => database.prepare(`
    SELECT version FROM records WHERE kind = ? AND id = ?
  `).get(record2.kind, record2.id));
  if (!current) {
    if (record2.version !== 1) {
      throw new RuntimeError(
        "VERSION_CONFLICT",
        `new record ${record2.kind}/${record2.id} must begin at version 1`
      );
    }
    runSqlite(() => database.prepare(`
      INSERT INTO records (kind, id, subject_kind, subject_id, version, body)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      record2.kind,
      record2.id,
      record2.subject?.kind ?? null,
      record2.subject?.id ?? null,
      record2.version,
      canonicalJson(record2.body)
    ));
    return;
  }
  if (record2.version !== current.version + 1) {
    throw new RuntimeError(
      "VERSION_CONFLICT",
      `record ${record2.kind}/${record2.id} expected next version ${current.version + 1}, received ${record2.version}`
    );
  }
  const outcome = runSqlite(() => database.prepare(`
    UPDATE records
    SET subject_kind = ?, subject_id = ?, version = ?, body = ?
    WHERE kind = ? AND id = ? AND version = ?
  `).run(
    record2.subject?.kind ?? null,
    record2.subject?.id ?? null,
    record2.version,
    canonicalJson(record2.body),
    record2.kind,
    record2.id,
    current.version
  ));
  if (outcome.changes !== 1) {
    throw new RuntimeError(
      "VERSION_CONFLICT",
      `record ${record2.kind}/${record2.id} changed during update`
    );
  }
}
function snapshotJson(value) {
  return JSON.parse(canonicalJson(value));
}
function invalidateStore(store) {
  let closeError;
  try {
    store.database.close();
  } catch (error) {
    closeError = error;
  } finally {
    store.closed = true;
  }
  return closeError;
}
function rollbackOperation(store, operationError) {
  try {
    runSqlite(() => store.database.exec("ROLLBACK"));
  } catch (rollbackError) {
    const errors = [operationError, rollbackError];
    const closeError = invalidateStore(store);
    if (closeError) errors.push(closeError);
    const failure = new RuntimeError(
      "RECOVERY_REQUIRED",
      `operation failed and rollback could not be confirmed: ${operationError.message}; rollback failed: ${rollbackError.message}`
    );
    failure.cause = new AggregateError(
      errors,
      "coordination operation and rollback both failed"
    );
    throw failure;
  }
}
function applyOperation(store, command2, mutate) {
  assertStore(store);
  if (store.mode === "read") invalid3("read-only coordination store cannot apply operations");
  assertWorkspaceWrite(store.path, { privateCheck: false });
  const internalCommand = snapshotJson(command2);
  validateCommand(internalCommand);
  if (typeof mutate !== "function") invalid3("operation mutate callback must be a function");
  const digest3 = commandDigest(internalCommand);
  let inTransaction = false;
  try {
    runSqlite(() => store.database.exec("BEGIN IMMEDIATE"));
    inTransaction = true;
    assertWorkspaceWrite(store.path);
    const receipt = readOperationReceipt(store, internalCommand);
    if (receipt) {
      runSqlite(() => store.database.exec("COMMIT"));
      inTransaction = false;
      return receipt;
    }
    const primaryBaseline = readRecord(
      store,
      internalCommand.recordKind,
      internalCommand.recordId
    );
    const actualVersion = primaryBaseline?.version ?? 0;
    if (actualVersion !== internalCommand.expectedVersion) {
      throw new RuntimeError(
        "VERSION_CONFLICT",
        `record ${internalCommand.recordKind}/${internalCommand.recordId} is version ${actualVersion}; expected ${internalCommand.expectedVersion}`
      );
    }
    const callbackCurrent = primaryBaseline === null ? null : snapshotJson(primaryBaseline);
    const primarySubject = primaryBaseline?.subject ?? (HIERARCHY_KINDS.has(internalCommand.recordKind) ? null : ["attempt.start", "effect.intent"].includes(internalCommand.kind) ? { kind: "task", id: internalCommand.payload.taskId } : null);
    const eventSubject = HIERARCHY_KINDS.has(internalCommand.recordKind) ? { kind: internalCommand.recordKind, id: internalCommand.recordId } : primarySubject;
    let eventSeq = 0;
    let appendedEvents = 0;
    let transactionAvailable = true;
    const requireTransaction = () => {
      if (!transactionAvailable) {
        invalid3("transaction methods are only available during mutate");
      }
    };
    const appendEvent = (payload) => {
      if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
        invalid3("event payload must be an object");
      }
      const outcome = runSqlite(() => store.database.prepare(`
        INSERT INTO events (operation_id, subject_kind, subject_id, payload)
        VALUES (?, ?, ?, ?)
      `).run(
        internalCommand.operationId,
        eventSubject?.kind ?? null,
        eventSubject?.id ?? null,
        canonicalJson(payload)
      ));
      appendedEvents += 1;
      eventSeq = Number(outcome.lastInsertRowid);
      return eventSeq;
    };
    const tx = {
      get(kind, id) {
        requireTransaction();
        return readRecord(store, kind, id);
      },
      list(kind, subject = void 0) {
        requireTransaction();
        return listRecords(store, { kind, subject });
      },
      put(record2) {
        requireTransaction();
        validateRecord(record2);
        if (record2.kind === internalCommand.recordKind && record2.id === internalCommand.recordId) {
          invalid3("mutate must return the primary record body instead of putting it");
        }
        writeRecord(store.database, record2);
      },
      appendEvent(payload) {
        requireTransaction();
        return appendEvent(payload);
      }
    };
    let nextBody;
    try {
      nextBody = mutate(callbackCurrent, tx);
    } finally {
      transactionAvailable = false;
    }
    if (nextBody && typeof nextBody.then === "function") {
      invalid3("operation mutate callback must be synchronous");
    }
    validateCommandMutation(internalCommand, primaryBaseline, nextBody);
    const unchangedPrimary = primaryBaseline !== null && !MESSAGE_COMMANDS.has(internalCommand.kind) && canonicalJson(nextBody) === canonicalJson(primaryBaseline.body);
    const primary = unchangedPrimary ? primaryBaseline : validateRecord({
      kind: internalCommand.recordKind,
      id: internalCommand.recordId,
      subject: primarySubject,
      version: internalCommand.expectedVersion + 1,
      body: nextBody
    });
    if (!unchangedPrimary) writeRecord(store.database, primary);
    if (appendedEvents === 0) {
      eventSeq = appendEvent({
        kind: internalCommand.kind,
        actor: internalCommand.actor,
        recordKind: internalCommand.recordKind,
        recordId: internalCommand.recordId,
        payload: internalCommand.payload
      });
    }
    const accepted2 = {
      ok: true,
      operationId: internalCommand.operationId,
      recordVersion: primary.version,
      eventSeq,
      data: { record: primary }
    };
    runSqlite(() => store.database.prepare(`
      INSERT INTO operations (id, payload_digest, receipt)
      VALUES (?, ?, ?)
    `).run(internalCommand.operationId, digest3, canonicalJson(accepted2)));
    runSqlite(() => store.database.exec("COMMIT"));
    inTransaction = false;
    return accepted2;
  } catch (error) {
    if (inTransaction) {
      rollbackOperation(store, error);
    }
    throw error;
  }
}

// src/core/lib/activity.mjs
var LOG_REL = ".kai/core/runtime/activity.jsonl";
var EVENTS = /* @__PURE__ */ new Set(["start", "progress", "stop"]);
var OUTCOMES = /* @__PURE__ */ new Set(["handoff", "done", "blocked", "abandoned"]);
var FORBIDDEN_FIELDS = /* @__PURE__ */ new Set([
  "state",
  "resume_state",
  "verdict",
  "review",
  "completed_reviews",
  "review_requirements",
  "change_ref",
  "version",
  "lease",
  "decision",
  "approved"
]);
var ROLE_RE = /^[a-z0-9-]{1,60}$/;
var TASK_RE = /^(?:core|engineering|creative):task:[a-z0-9]+(?:-[a-z0-9]+)*$/;
var RUN_RE = /^[a-z0-9]{6,16}$/;
var MAX_NOTE = 120;
var MAX_LINE = 1024;
var MAX_BYTES = 512 * 1024;
function digest(input) {
  let h1 = 2166136261, h2 = 16777619;
  const s = String(input);
  for (let i = 0; i < s.length; i++) {
    h1 = Math.imul(h1 ^ s.charCodeAt(i), 16777619) >>> 0;
    h2 = Math.imul(h2 + s.charCodeAt(i) + 1, 2246822507) >>> 0;
  }
  return (h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0")).slice(0, 12);
}
var ABSOLUTE = /(^|[\s"'(=])([A-Za-z]:[\\/]|\/(?:home|Users|root|mnt|var|tmp|etc)\b|\\\\|~[\\/])/;
function looksAbsolute(s) {
  return typeof s === "string" && ABSOLUTE.test(s);
}
function safeNote(note) {
  if (typeof note !== "string") return null;
  const flat = note.replace(/[\r\n\t]+/g, " ").replace(/\s{2,}/g, " ").trim();
  if (!flat) return null;
  if (looksAbsolute(flat)) return null;
  return flat.length > MAX_NOTE ? `${flat.slice(0, MAX_NOTE - 1)}~` : flat;
}
function buildRecord(input, now = Date.now()) {
  if (!input || typeof input !== "object") return { ok: false, reason: "record must be an object" };
  for (const k of Object.keys(input)) {
    if (FORBIDDEN_FIELDS.has(k)) {
      return { ok: false, reason: `field "${k}" belongs to the Task record, not the activity log` };
    }
  }
  const e = String(input.e || "").trim();
  if (!EVENTS.has(e)) return { ok: false, reason: `unknown event "${e}"` };
  const role = String(input.role || "").trim();
  if (!ROLE_RE.test(role)) return { ok: false, reason: "role must be a kebab-case role id" };
  const task = input.task == null ? null : String(input.task).trim();
  if (task !== null && !TASK_RE.test(task)) {
    return { ok: false, reason: 'task must be a typed "<pack>:task:<slug>" identity' };
  }
  const run = String(input.run || "").trim();
  if (!RUN_RE.test(run)) return { ok: false, reason: "run must be a short opaque id" };
  const nowSec = Math.floor(now / 1e3);
  const rec = {
    t: input.t != null ? Math.floor(Number(input.t)) : nowSec,
    src: "declared",
    e,
    role,
    run
  };
  if (!Number.isFinite(rec.t)) return { ok: false, reason: "t must be an epoch-seconds integer" };
  if (task) rec.task = task;
  if (e === "stop") {
    const outcome = String(input.outcome || "").trim();
    if (!OUTCOMES.has(outcome)) return { ok: false, reason: `unknown outcome "${outcome}"` };
    rec.outcome = outcome;
  }
  if (input.next_report_by != null) {
    const by = Math.floor(Number(input.next_report_by));
    if (!Number.isFinite(by)) return { ok: false, reason: "next_report_by must be an epoch-seconds integer" };
    rec.next_report_by = by;
  } else if (e !== "stop") {
    return { ok: false, reason: "start and progress must declare next_report_by" };
  }
  const note = safeNote(input.note);
  if (note) rec.note = note;
  const line = JSON.stringify(rec);
  if (line.length > MAX_LINE) return { ok: false, reason: "record exceeds the line bound" };
  if (looksAbsolute(line)) return { ok: false, reason: "record contains a filesystem path" };
  return { ok: true, record: rec, line };
}
function logPath(root) {
  return join5(root, LOG_REL);
}
function activityWorkspaceAdmission(root, env = process.env) {
  let store;
  try {
    const manifest = readWorkspaceContract(root, {
      env,
      versions: [WORKSPACE_SCHEMA_VERSION]
    });
    const privacy = inspectGitPrivacy(root, manifest.placement);
    const errors = [
      ...privacy.errors,
      ...privacy.missing.map((path4) => `private workspace path must be ignored: ${path4}`)
    ];
    if (manifest.placement === "repo-local" && !privacy.gitRoot) {
      errors.push("repo-local placement requires a readable Git work tree");
    }
    if (errors.length) return { ok: false, reason: errors.join("; ") };
    const database = join5(root, ...COORDINATION_DATABASE.split("/"));
    if (!existsSync5(database)) {
      return { ok: false, reason: `coordination database is missing at ${COORDINATION_DATABASE}` };
    }
    if (pathHasLink(root, database) || !exactPath(database) || !lstatSync3(database).isFile()) {
      return {
        ok: false,
        reason: `coordination database must be an exact unlinked regular file at ${COORDINATION_DATABASE}`
      };
    }
    store = openStore({ path: database, mode: "read" });
    return { ok: true, manifest };
  } catch (error) {
    return { ok: false, reason: `${error.code ?? "INVALID_INPUT"}: ${error.message}` };
  } finally {
    closeStore(store);
  }
}
function rotate(file) {
  try {
    if (!existsSync5(file)) return;
    if (statSync2(file).size < MAX_BYTES) return;
    renameSync(file, `${file}.1`);
  } catch {
  }
}
function append(root, input, now = Date.now(), env = process.env) {
  const built = buildRecord(input, now);
  if (!built.ok) return built;
  const admitted = activityWorkspaceAdmission(root, env);
  if (!admitted.ok) return admitted;
  const file = logPath(root);
  if (escapesRoot(root, file) || pathHasLink(root, file)) {
    return { ok: false, reason: "activity path traverses a link or escapes the workspace" };
  }
  try {
    mkdirSync2(dirname6(file), { recursive: true });
    rotate(file);
    appendFileSync(file, `${built.line}
`);
    return { ok: true, record: built.record };
  } catch (err) {
    return { ok: false, reason: `append failed: ${err.code || "unknown"}` };
  }
}
function readable(r) {
  if (!r || typeof r !== "object") return false;
  if (!EVENTS.has(r.e)) return false;
  if (typeof r.run !== "string" || !RUN_RE.test(r.run)) return false;
  if (typeof r.role !== "string" || !ROLE_RE.test(r.role)) return false;
  if (r.task != null && !(typeof r.task === "string" && TASK_RE.test(r.task))) return false;
  if (r.item != null) return false;
  if (r.next_report_by != null && !Number.isFinite(Number(r.next_report_by))) return false;
  if (r.outcome != null && !OUTCOMES.has(r.outcome)) return false;
  if (r.note != null && (typeof r.note !== "string" || r.note.length > MAX_NOTE || looksAbsolute(r.note))) return false;
  return Number.isFinite(Number(r.t));
}
function read(root) {
  const file = logPath(root);
  if (!existsSync5(file)) return { present: false, records: [], skipped: 0 };
  let raw;
  try {
    raw = readFileSync3(file, "utf8");
  } catch {
    return { present: false, records: [], skipped: 0 };
  }
  const records2 = [];
  let skipped = 0;
  for (const line of raw.split(/\r?\n/)) {
    if (!line.trim()) continue;
    try {
      const r = JSON.parse(line);
      if (readable(r)) records2.push(r);
      else skipped++;
    } catch {
      skipped++;
    }
  }
  return { present: true, records: records2, skipped };
}
function runs(records2, now = Date.now()) {
  const nowSec = Math.floor(now / 1e3);
  const byRun = /* @__PURE__ */ new Map();
  for (const r of records2) {
    let s = byRun.get(r.run);
    if (!s) {
      s = {
        run: r.run,
        role: r.role,
        task: r.task || null,
        started: null,
        last: null,
        deadline: null,
        stopped: null,
        outcome: null,
        events: 0
      };
      byRun.set(r.run, s);
    }
    s.events++;
    if (r.role) s.role = r.role;
    if (r.task) s.task = r.task;
    if (r.e === "start") s.started = r.t;
    if (r.e === "stop") {
      s.stopped = r.t;
      s.outcome = r.outcome || null;
    }
    if (s.last === null || r.t >= s.last) {
      s.last = r.t;
      if (r.next_report_by != null) s.deadline = r.next_report_by;
    }
  }
  const out = [];
  for (const s of byRun.values()) {
    s.open = s.stopped === null;
    s.overdue = s.open && s.deadline != null && s.deadline < nowSec;
    s.silent_for = s.open && s.last != null ? nowSec - s.last : null;
    out.push(s);
  }
  return out.sort((a, b) => (b.last || 0) - (a.last || 0));
}

// src/core/lib/coordination-runtime/evidence-content.mjs
import { createHash as createHash4 } from "node:crypto";
import {
  closeSync,
  fstatSync,
  fsyncSync,
  mkdirSync as mkdirSync3,
  openSync,
  readFileSync as readFileSync4,
  readSync,
  writeFileSync
} from "node:fs";
import { execFileSync } from "node:child_process";
import { dirname as dirname7, isAbsolute as isAbsolute3, join as join6, resolve as resolve4 } from "node:path";
function fail5(code, message) {
  throw new RuntimeError(code, message);
}
function durablePath(value) {
  if (typeof value !== "string" || !value.trim() || badPath(value)) {
    fail5("INVALID_INPUT", "a complete workspace-relative or project-qualified path is required");
  }
  const normalized2 = value.replaceAll("\\", "/");
  const qualifier = /^project:([a-z][a-z0-9-]*):(.*)$/.exec(normalized2);
  const path4 = qualifier ? qualifier[2] : normalized2;
  const parts = path4.split("/").filter((part) => part !== ".");
  if (parts.some((part) => !part || /[:<>"|?*\x00-\x1f]/.test(part) || /[. ]$/.test(part) || /^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(part))) {
    fail5("INVALID_INPUT", "path contains an unsafe or ambiguous segment");
  }
  return (qualifier ? `project:${qualifier[1]}:` : "") + parts.join("/");
}
function workspaceManifest(root) {
  if (typeof root !== "string" || !isAbsolute3(root)) fail5("INVALID_INPUT", "explicit absolute workspace root is required");
  if (/^(\\\\|\/\/)/.test(root)) fail5("UNSUPPORTED_HOST", "network workspaces are unsupported");
  if (process.platform === "win32" && !/^[a-z]:[\\/]/i.test(root)) {
    fail5("INVALID_INPUT", "workspace root requires an explicit drive, not the current drive");
  }
  const manifestPath = join6(root, ".kai", "manifest.json");
  if (pathHasLink(root, manifestPath) || escapesRoot(root, manifestPath)) {
    fail5("INVALID_INPUT", "workspace manifest cannot traverse a link");
  }
  const result = readWorkspaceManifest(root);
  if (!result.ok) fail5("INVALID_INPUT", result.reason);
  const m = result.manifest;
  if (m.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    fail5(
      "SCHEMA_MISMATCH",
      "workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard"
    );
  }
  const validation = validateSchema5Manifest(root, m);
  if (validation.errors.length) fail5("INVALID_INPUT", validation.errors.join("; "));
  return m;
}
function projectBinding(root, projectId) {
  const matches = workspaceManifest(root).projects.filter((project2) => project2.id === projectId);
  if (matches.length !== 1 || typeof matches[0].path !== "string" || !matches[0].path.trim()) {
    fail5("INVALID_INPUT", "project must have exactly one explicit workspace binding");
  }
  const project = matches[0];
  if (/^(\\\\|\/\/)/.test(project.path)) fail5("UNSUPPORTED_HOST", "network projects are unsupported");
  if (/^[a-z]:(?![\\/])/i.test(project.path) || /^\\(?!\\)/.test(project.path) || process.platform === "win32" && isAbsolute3(project.path) && !/^[a-z]:[\\/]/i.test(project.path)) {
    fail5("INVALID_INPUT", "project binding cannot depend on the current drive or working directory");
  }
  const projectRoot = resolvedProjectPath(root, project.path);
  if (pathHasLink(projectRoot, projectRoot)) fail5("INVALID_INPUT", "project root cannot be a link");
  return { project, projectRoot };
}
function assertWorkspacePath(root, relativePath) {
  const manifest = workspaceManifest(root);
  const path4 = durablePath(relativePath);
  const projectTarget = /^project:([a-z][a-z0-9-]*):(.*)$/.exec(path4);
  let base = root;
  let local = path4;
  if (projectTarget) {
    const { project, projectRoot } = projectBinding(root, projectTarget[1]);
    base = projectRoot;
    local = projectTarget[2];
    const publication = durablePath(project.publication_root);
    if (publication.startsWith("project:") || publication.toLowerCase() === ".kai" || publication.toLowerCase().startsWith(".kai/") || local !== publication && !local.startsWith(`${publication}/`)) {
      fail5("INVALID_INPUT", "public target escapes the declared project publication root");
    }
    if (normalized(base) !== normalized(root) && !escapesRoot(join6(root, ".kai"), base)) {
      fail5("INVALID_INPUT", "a project publication cannot alias private workspace state");
    }
    try {
      if (parseTypedArtifactRoute(local).visibility !== "public") {
        fail5("INVALID_INPUT", "project publications require a typed public artifact route");
      }
    } catch (error) {
      if (error instanceof RuntimeError) throw error;
      fail5("INVALID_INPUT", error.message);
    }
  } else {
    const runtimePath = path4 === COORDINATION_DATABASE || path4.startsWith(".kai/core/runtime/");
    const personalPath = /^\.kai\/(core|engineering|creative)\/[^/]+\/[^/]+\/personal(?:\/|$)/.test(path4);
    if (!runtimePath && !personalPath) {
      try {
        if (parseTypedArtifactRoute(path4).visibility !== "private") {
          fail5("INVALID_INPUT", "private references require a typed .kai artifact route");
        }
      } catch (error) {
        if (error instanceof RuntimeError) throw error;
        fail5("INVALID_INPUT", error.message);
      }
    }
  }
  const absolute = resolve4(base, ...local.split("/"));
  if (escapesRoot(base, absolute) || pathHasLink(base, absolute)) {
    fail5("INVALID_INPUT", "path escapes its root or traverses a symbolic link or junction");
  }
  if (!projectTarget) {
    const inspection = inspectPrivateLanes(root, [".kai"]);
    if (inspection.gitRoots.length || inspection.symbolicLinks.length || inspection.unreadable.length) {
      fail5("INVALID_INPUT", "private lanes contain nested Git roots, links, or unreadable directories");
    }
  }
  return absolute;
}
var safePath = assertWorkspacePath;
function pathPrivacy(root, path4) {
  assertWorkspacePath(root, path4);
  if (path4.startsWith("project:")) return "public";
  if (/\/personal(?:\/|$)/i.test(path4)) return "personal";
  return "internal";
}
function readExactFile(root, path4, read2) {
  const absolute = assertWorkspacePath(root, path4);
  let fd;
  try {
    fd = openSync(absolute, "r");
    const before = fstatSync(fd);
    if (!before.isFile() || before.nlink > 1) fail5("INVALID_INPUT", "evidence must be a regular unshared file");
    const { value, size } = read2(fd, before.size);
    const after = fstatSync(fd);
    if (before.size !== after.size || before.mtimeMs !== after.mtimeMs || size !== after.size) {
      fail5("EVIDENCE_GAP", "evidence changed while reading");
    }
    return value;
  } catch (error) {
    if (error instanceof RuntimeError) throw error;
    fail5("EVIDENCE_GAP", `referenced evidence is missing or unreadable: ${path4}`);
  } finally {
    if (fd !== void 0) closeSync(fd);
  }
}
function exactBytes(root, path4) {
  return readExactFile(root, path4, (fd) => {
    const bytes = readFileSync4(fd);
    return { value: bytes, size: bytes.length };
  });
}
var exactFile = exactBytes;
function exclusiveFile(root, path4, bytes) {
  const target = assertWorkspacePath(root, path4);
  mkdirSync3(dirname7(target), { recursive: true });
  const fd = openSync(target, "wx", 384);
  try {
    writeFileSync(fd, bytes);
    fsyncSync(fd);
  } finally {
    closeSync(fd);
  }
}
function scanExactFile(root, path4, consume = () => {
}) {
  return readExactFile(root, path4, (fd, expectedSize) => {
    const digest3 = createHash4("sha256");
    const buffer = Buffer.alloc(64 * 1024);
    let size = 0;
    while (size < expectedSize) {
      const count = readSync(fd, buffer, 0, Math.min(buffer.length, expectedSize - size), null);
      if (!count) break;
      const chunk = buffer.subarray(0, count);
      digest3.update(chunk);
      consume(chunk);
      size += count;
    }
    return { value: { digest: digest3.digest("hex"), size }, size };
  });
}
var hash = (bytes) => createHash4("sha256").update(bytes).digest("hex");
function hashArtifact({ root, relativePath }) {
  const path4 = durablePath(relativePath);
  return { kind: "sha256", digest: scanExactFile(root, path4).digest, path: path4 };
}
function orderedPaths(paths) {
  if (!Array.isArray(paths) || paths.length === 0) fail5("INVALID_INPUT", "bundle requires paths");
  const normalized2 = paths.map(durablePath).sort();
  if (new Set(normalized2.map((path4) => path4.toLowerCase())).size !== normalized2.length) {
    fail5("INVALID_INPUT", "bundle contains duplicate paths or case collisions");
  }
  return normalized2;
}
function hashBundle({ root, paths }) {
  const entries = orderedPaths(paths).map((path4) => {
    const artifact = hashArtifact({ root, relativePath: path4 });
    return { path: path4, digest: artifact.digest };
  });
  return { kind: "bundle-sha256", digest: hash(canonicalJson(entries)), entries };
}
function verifySubject(root, subject, projectId) {
  validateSubjectRef(subject);
  if (subject.kind === "git") {
    if (!/^[0-9a-f]{40}$/.test(subject.base) || !/^[0-9a-f]{40}$/.test(subject.head)) {
      fail5("INVALID_INPUT", "Git evidence requires full lowercase immutable commit IDs");
    }
    const { projectRoot } = projectBinding(root, projectId);
    try {
      const env = Object.fromEntries(Object.entries(process.env).filter(([key2]) => !/^GIT_/i.test(key2)));
      const git = (args) => execFileSync("git", ["--no-pager", "-C", projectRoot, ...args], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        env: { ...env, GIT_NO_REPLACE_OBJECTS: "1", GIT_OPTIONAL_LOCKS: "0", GIT_NO_LAZY_FETCH: "1", GIT_TERMINAL_PROMPT: "0" }
      }).trim();
      if (normalized(git(["rev-parse", "--show-toplevel"])) !== normalized(projectRoot)) {
        fail5("EVIDENCE_GAP", "selected project must itself be the Git root");
      }
      for (const object of [subject.base, subject.head]) {
        if (git(["rev-parse", "--verify", `${object}^{commit}`]) !== object) {
          fail5("EVIDENCE_GAP", "Git evidence does not resolve to the exact commit");
        }
      }
    } catch (error) {
      if (error instanceof RuntimeError) throw error;
      fail5("EVIDENCE_GAP", "Git evidence objects do not exist in the selected project");
    }
    return [];
  }
  if (projectId !== null) fail5("INVALID_INPUT", "non-Git subjects carry project-qualified paths, not projectId");
  const actual = subject.kind === "sha256" ? hashArtifact({ root, relativePath: subject.path }) : hashBundle({ root, paths: subject.entries.map((entry) => entry.path) });
  if (canonicalJson(actual) !== canonicalJson(subject)) {
    fail5("EVIDENCE_GAP", "referenced content or bundle manifest changed");
  }
  return subject.kind === "sha256" ? [{ path: subject.path, digest: subject.digest }] : subject.entries;
}
function retainFile(root, path4, bytes) {
  const absolute = assertWorkspacePath(root, path4);
  mkdirSync3(dirname7(absolute), { recursive: true });
  assertWorkspacePath(root, path4);
  try {
    writeFileSync(absolute, bytes, { flag: "wx" });
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    if (!exactBytes(root, path4).equals(Buffer.from(bytes))) {
      fail5("EVIDENCE_GAP", "retained snapshot already exists with different bytes");
    }
  }
}
function retainSubject(root, subject, projectId, runDirectory, artifactId) {
  const entries = verifySubject(root, subject, projectId);
  if (subject.kind === "git") return { snapshots: [], manifest_path: null };
  const base = `${runDirectory}/.evidence/${artifactId}`;
  const snapshots = entries.map((entry, index) => {
    const bytes = exactBytes(root, entry.path);
    if (hash(bytes) !== entry.digest) fail5("EVIDENCE_GAP", "source changed before snapshot");
    const snapshot_path = `${base}/${String(index).padStart(4, "0")}.bin`;
    retainFile(root, snapshot_path, bytes);
    return { ...entry, snapshot_path };
  });
  const manifest_path = `${base}/manifest.json`;
  retainFile(root, manifest_path, canonicalJson({ subject, snapshots }));
  verifySubject(root, subject, projectId);
  return { snapshots, manifest_path };
}
function verifyArtifact(root, artifact) {
  const entries = verifySubject(root, artifact.content_ref, artifact.project_id);
  if (canonicalJson(entries) !== canonicalJson(artifact.snapshots.map(({ path: path4, digest: digest3 }) => ({ path: path4, digest: digest3 })))) {
    fail5("EVIDENCE_GAP", "artifact snapshot manifest does not match its exact subject");
  }
  for (const snapshot of artifact.snapshots) {
    if (!snapshot.snapshot_path.startsWith(`${artifact.run_directory}/.evidence/${artifact.artifact_id}/`) || scanExactFile(root, snapshot.snapshot_path).digest !== snapshot.digest) {
      fail5("EVIDENCE_GAP", "retained snapshot is missing or changed");
    }
  }
  if (artifact.content_ref.kind !== "git") {
    if (artifact.manifest_path !== `${artifact.run_directory}/.evidence/${artifact.artifact_id}/manifest.json` || scanExactFile(root, artifact.manifest_path).digest !== hash(canonicalJson({
      subject: artifact.content_ref,
      snapshots: artifact.snapshots
    }))) {
      fail5("EVIDENCE_GAP", "retained manifest is missing or changed");
    }
  }
}
function verifyTarget(root, target, artifact) {
  if (artifact.content_ref.kind !== "sha256") {
    if (artifact.content_ref.kind === "bundle-sha256" && target.startsWith("project:") && artifact.content_ref.entries.some((entry) => !entry.path.startsWith("project:"))) {
      fail5("INVALID_INPUT", "public bundle manifests cannot expose private member references");
    }
    const manifest = artifact.content_ref.kind === "git" ? { project_id: artifact.project_id, subject: artifact.content_ref } : artifact.content_ref;
    if (scanExactFile(root, target).digest !== hash(canonicalJson(manifest))) {
      fail5("EVIDENCE_GAP", "canonical target must contain the exact immutable subject manifest");
    }
    return;
  }
  if (hashArtifact({ root, relativePath: target }).digest !== artifact.content_ref.digest) {
    fail5("EVIDENCE_GAP", "canonical target does not contain the accepted exact bytes");
  }
}

// src/core/lib/coordination-runtime/acceptance-verdicts.mjs
var contentEquals = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
function matchesAcceptance(body, record2, lookup5) {
  return subjectEquals(body.subject, { kind: record2.kind, id: record2.id }) && body.criteria_ref === criteriaRef(record2, lookup5) && (record2.kind === "task" ? contentEquals(body.content_ref, record2.body.change_ref) : body.content_ref === null);
}
function effectiveRecords(records2, idKey, scope, maySupersede) {
  const byId = new Map(records2.map((record2) => [record2[idKey], record2]));
  const replaced = /* @__PURE__ */ new Set();
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (record2) => {
    const id = record2[idKey];
    if (visiting.has(id)) fail5("EVIDENCE_GAP", "verdict supersession contains a cycle");
    if (visited.has(id)) return;
    visiting.add(id);
    for (const priorId of record2.supersedes) {
      const prior = byId.get(priorId);
      if (!prior || scope(prior) !== scope(record2)) {
        fail5("EVIDENCE_GAP", `${id} supersedes a missing or differently scoped verdict`);
      }
      if (!maySupersede(record2)) {
        fail5("AUTHORITY_REQUIRED", "a producing run cannot supersede an independent verdict");
      }
      if (replaced.has(priorId)) fail5("EVIDENCE_GAP", "verdict supersession has conflicting successors");
      visit(prior);
      replaced.add(priorId);
    }
    visiting.delete(id);
    visited.add(id);
  };
  records2.forEach(visit);
  return records2.filter((record2) => !replaced.has(record2[idKey]));
}
function effectiveReviews(reviews, record2, lookup5) {
  return effectiveRecords(
    reviews.filter((review) => matchesAcceptance(review, record2, lookup5)),
    "review_id",
    (review) => canonicalJson([review.reviewer.role, review.kind]),
    (review) => !isProducingRun(record2.body, review.reviewer)
  );
}
function effectiveApprovals(approvals, record2, lookup5) {
  const relevant = approvals.filter((approval) => approval.kind === "operator-recovery-resolution" ? subjectEquals(approval.subject, { kind: record2.kind, id: record2.id }) && approval.criteria_ref === criteriaRef(record2, lookup5) && approval.recovery.attempt_id === record2.body.recovery_hold : matchesAcceptance(approval, record2, lookup5));
  return effectiveRecords(
    relevant,
    "approval_id",
    (approval) => canonicalJson([approval.authority.role, approval.kind, approval.recovery?.attempt_id ?? null]),
    (approval) => approval.kind !== "completion" || record2.kind !== "task" || !isProducingRun(record2.body, approval.authority)
  );
}
function evidenceScope(record2) {
  return canonicalJson([
    record2.kind,
    record2.dimension,
    record2.data.environment ?? null,
    record2.data.deployment_id ?? null
  ]);
}
function effectiveEvidence(evidence, record2, lookup5) {
  return effectiveRecords(
    evidence.filter((body) => matchesAcceptance(body, record2, lookup5)),
    "evidence_id",
    evidenceScope,
    () => true
  );
}

// src/core/lib/coordination-runtime/evidence-context.mjs
import { isAbsolute as isAbsolute4, join as join7 } from "node:path";
var bindings = /* @__PURE__ */ new WeakMap();
var transactions = /* @__PURE__ */ new WeakMap();
var clone2 = (value) => JSON.parse(canonicalJson(value));
function bindEvidenceRuntime(store, options2) {
  assertExactKeys(options2, /* @__PURE__ */ new Set([
    "root",
    "authority",
    "runs",
    "verifyCapture",
    "verifyOperatorDecision"
  ]), "evidence runtime", /* @__PURE__ */ new Set(["root", "authority", "runs"]));
  workspaceManifest(options2.root);
  const database = COORDINATION_DATABASE;
  if (!store || store.closed || !isAbsolute4(store.path) || normalized(store.path) !== normalized(join7(options2.root, ...database.split("/")))) {
    fail5("INVALID_INPUT", "evidence workspace must be explicitly bound to this store");
  }
  assertWorkspacePath(options2.root, database);
  validateAuthority(options2.authority);
  if (!Array.isArray(options2.runs)) fail5("INVALID_INPUT", "approved run bindings must be an array");
  const actors = /* @__PURE__ */ new Set();
  const directories = /* @__PURE__ */ new Set();
  for (const run of options2.runs) {
    assertExactKeys(run, /* @__PURE__ */ new Set(["actor", "directory"]), "approved run");
    validateActor(run.actor);
    const directory = durablePath(run.directory);
    let route;
    try {
      const parsed = parseTypedArtifactRoute(directory);
      const completeRoutes = parsed.routes.filter((candidate) => candidate.members.length === 0);
      [route] = completeRoutes;
      if (parsed.visibility !== "private" || completeRoutes.length !== 1) {
        fail5("INVALID_INPUT", "approved run directory must be one complete typed private artifact route");
      }
    } catch (error) {
      if (error?.code) throw error;
      fail5("INVALID_INPUT", error.message);
    }
    if (directory !== run.directory || actors.has(canonicalJson(run.actor)) || directories.has(directory.toLowerCase())) {
      fail5("INVALID_INPUT", "approved run directories must be unique typed private artifact paths");
    }
    assertWorkspacePath(options2.root, `${directory}/.evidence/probe`);
    actors.add(canonicalJson(run.actor));
    directories.add(directory.toLowerCase());
  }
  for (const key2 of ["verifyCapture", "verifyOperatorDecision"]) {
    if (options2[key2] !== void 0 && typeof options2[key2] !== "function") {
      fail5("INVALID_INPUT", `${key2} must be a trusted host function`);
    }
  }
  bindings.set(store, {
    ...options2,
    root: normalized(options2.root),
    authority: clone2(options2.authority),
    runs: clone2(options2.runs)
  });
}
function bindEvidenceTransaction(store, tx) {
  transactions.set(tx, store);
  return tx;
}
function bindEvidenceReadView(tx, { root }) {
  workspaceManifest(root);
  bindings.set(tx, { root: normalized(root) });
  return tx;
}
function contextFor(storeOrTransaction) {
  const store = transactions.get(storeOrTransaction) ?? storeOrTransaction;
  const context = bindings.get(store);
  if (!context || store.closed) {
    fail5("AUTHORITY_REQUIRED", "bind the explicit workspace and host authority before evidence operations or acceptance");
  }
  workspaceManifest(context.root);
  return context;
}

// src/core/lib/coordination-runtime/input-basis.mjs
import { createHash as createHash5 } from "node:crypto";
var digest2 = (value) => createHash5("sha256").update(canonicalJson(value)).digest("hex");
var privacyRank = { public: 0, internal: 1, confidential: 2, personal: 3 };
function captureInputBasis(context, tx, references, seen = /* @__PURE__ */ new Set(), observe) {
  return [...new Set(references)].sort().map((reference) => {
    if (seen.has(reference)) fail5("EVIDENCE_GAP", "applicable inputs contain a cycle");
    const next = /* @__PURE__ */ new Set([...seen, reference]);
    const match = /^(artifact|asset|evidence):([0-9a-f-]+)$/i.exec(reference);
    if (!match) {
      const subject = hashArtifact({ root: context.root, relativePath: reference });
      observe?.({ subject, classification: pathPrivacy(context.root, subject.path) });
      return { reference, digest: digest2(subject) };
    }
    const [, kind, id] = match;
    const record2 = tx.get(kind, id);
    if (!record2) fail5("EVIDENCE_GAP", `applicable input ${reference} is missing`);
    if (kind === "artifact") {
      verifyArtifact(context.root, record2.body);
      observe?.(record2.body);
      if (record2.body.input_basis === void 0) {
        fail5("EVIDENCE_GAP", `applicable input ${reference} has unknown captured lineage; register a fresh explicit input basis`);
      }
      verifyInputBasis(context, tx, record2.body.input_basis, next, observe);
    } else if (kind === "asset") {
      captureInputBasis(context, tx, [
        `artifact:${record2.body.artifact_id}`,
        ...record2.body.input_asset_ids.map((id2) => `asset:${id2}`)
      ], next, observe);
    } else {
      captureInputBasis(context, tx, record2.body.evidence_refs, next, observe);
    }
    const owner = record2.subject ? tx.get(record2.subject.kind, record2.subject.id) : null;
    if (!owner) fail5("EVIDENCE_GAP", `applicable input ${reference} has no owning hierarchy subject`);
    return {
      reference,
      digest: digest2({
        record: record2,
        ownerCriteria: criteriaRef(owner, (kind2, id2) => tx.get(kind2, id2))
      })
    };
  });
}
function verifyInputBasis(context, tx, basis, seen = /* @__PURE__ */ new Set(), observe) {
  if (canonicalJson(captureInputBasis(context, tx, basis.map((b) => b.reference), seen, observe)) !== canonicalJson(basis)) {
    fail5("EVIDENCE_GAP", "applicable design/brief/input revision changed; register a fresh output basis and independent acceptance");
  }
}
function inputBasisCurrent(context, tx, basis) {
  try {
    verifyInputBasis(context, tx, basis);
    return true;
  } catch (error) {
    if (error.code !== "EVIDENCE_GAP") throw error;
    return false;
  }
}
function artifactInputReferences(item, inputAssetIds) {
  return [...item.context_artifacts ?? [], ...inputAssetIds.map((id) => `asset:${id}`)];
}

// src/core/lib/coordination-runtime/evidence-integrity.mjs
var contentEquals2 = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var bindsSubject = (record2, subject) => subjectEquals(record2?.subject, subject);
var lookup = (tx) => (kind, id) => tx.get(kind, id);
var positiveEvidenceOutcomes = /* @__PURE__ */ new Set(["clear", "waived", "passed"]);
function hasPublicSafeExcerptPath(root, path4) {
  if (pathPrivacy(root, path4) === "public") return true;
  try {
    const parsed = parseTypedArtifactRoute(path4);
    return parsed.visibility === "private" && parsed.routes.some((route) => route.lifecycle === "drafts");
  } catch {
    return false;
  }
}
function requirePositiveEffectiveEvidence(effective, record2) {
  const scoped = effective.filter((candidate) => evidenceScope(candidate) === evidenceScope(record2));
  if (!effective.some((candidate) => candidate.evidence_id === record2.evidence_id) || scoped.some((candidate) => !positiveEvidenceOutcomes.has(candidate.outcome))) {
    fail5(
      "EVIDENCE_GAP",
      "superseded or negative evidence, including conflicting scoped evidence, cannot establish acceptance"
    );
  }
}
function hasPublicationHistory(asset) {
  return asset.history.some((h) => ["published", "retracted"].includes(h.disposition) || h.target.startsWith("project:") && !h.target.endsWith(":@git") && h.validity === "current");
}
function verifyAssetContent(context, tx, asset) {
  const artifact = tx.get("artifact", asset.artifact_id);
  if (!bindsSubject(artifact, asset.subject)) fail5("EVIDENCE_GAP", "asset has no registered artifact");
  verifyArtifact(context.root, artifact.body);
  verifyInputBasis(context, tx, artifact.body.input_basis ?? []);
  const initial = artifact.body.content_ref.kind === "sha256" ? artifact.body.content_ref.path : artifact.body.manifest_path ?? `project:${artifact.body.project_id}:@git`;
  if (asset.target !== initial || asset.history.some((h) => ["working", "published"].includes(h.disposition))) {
    verifyTarget(context.root, asset.target, artifact.body);
  }
  return artifact.body;
}
function verifyRegisteredArtifact(context, tx, record2) {
  verifyInputBasis(context, tx, record2.body.input_basis ?? []);
  const assets = tx.list("asset", record2.subject).filter((asset) => asset.body.artifact_id === record2.id);
  if (assets.length === 0) verifyArtifact(context.root, record2.body);
  else assets.forEach((asset) => verifyAssetContent(context, tx, asset.body));
}
function parentReportArtifact(context, tx, parent, reference, approvalId = null) {
  const match = /^artifact:([0-9a-f-]+)$/i.exec(reference);
  if (!match) {
    fail5("EVIDENCE_GAP", "parent completion proof must reference persisted report artifacts");
  }
  const artifact = tx.get("artifact", match[1]);
  if (!bindsSubject(artifact, { kind: parent.kind, id: parent.id }) || artifact.body.classification !== "public" || !artifactBasisCurrent(context, tx, parent, artifact.body)) {
    fail5("EVIDENCE_GAP", "parent completion report artifact is missing, stale, or not public");
  }
  const paths = artifact.body.content_ref.kind === "git" ? [] : artifact.body.content_ref.kind === "sha256" ? [artifact.body.content_ref.path] : artifact.body.content_ref.entries.map((entry) => entry.path);
  if (paths.some((path4) => !hasPublicSafeExcerptPath(context.root, path4))) {
    fail5("EVIDENCE_GAP", "parent completion report artifact has no public safe-excerpt lane");
  }
  verifyRegisteredArtifact(context, tx, artifact);
  if (approvalId !== null) {
    const assets = tx.list("asset", artifact.subject).filter((record2) => record2.body.artifact_id === artifact.id && record2.body.validity === "current" && !(/* @__PURE__ */ new Set(["scratch", "draft", "discarded", "retracted"])).has(record2.body.disposition) && record2.body.completion_approval_id === approvalId);
    if (assets.length !== 1 || assets[0].body.history.at(-1).at_subject_version !== parent.version) {
      fail5(
        "EVIDENCE_GAP",
        "parent completion report artifact lacks one accepted current revision"
      );
    }
    verifyAssetContent(context, tx, assets[0].body);
  }
  return artifact.body;
}
function verifyParentCompletionEvidence(context, tx, parent, refs, { approvalId = null } = {}) {
  if (parent.kind === "task" || !Array.isArray(refs) || refs.length === 0 || refs.some((reference) => !/^artifact:([0-9a-f-]+)$/i.test(reference)) || new Set(refs).size !== refs.length) {
    fail5("EVIDENCE_GAP", "parent completion requires exact accepted report artifact proof");
  }
  return refs.map((reference) => parentReportArtifact(context, tx, parent, reference, approvalId));
}
function verifyParentCompletionApproval(context, tx, parent, refs, { approvalId = null } = {}) {
  if (parent.kind === "task" || !Array.isArray(refs) || refs.length === 0 || new Set(refs).size !== refs.length) {
    fail5("EVIDENCE_GAP", "parent completion approval requires persisted parent-completion evidence");
  }
  const evidenceRefs = refs.filter((reference) => /^evidence:([0-9a-f-]+)$/i.test(reference));
  const artifactRefs = refs.filter((reference) => /^artifact:([0-9a-f-]+)$/i.test(reference));
  if (evidenceRefs.length === 0 || artifactRefs.length === 0 || evidenceRefs.length + artifactRefs.length !== refs.length) {
    fail5(
      "EVIDENCE_GAP",
      "parent completion approval requires persisted evidence and explicit report artifacts"
    );
  }
  const effective = effectiveEvidence(
    tx.list("evidence", { kind: parent.kind, id: parent.id }).map((record2) => record2.body),
    parent,
    lookup(tx)
  );
  const evidenceArtifacts = /* @__PURE__ */ new Set();
  for (const reference of evidenceRefs) {
    const id = reference.slice("evidence:".length);
    const record2 = tx.get("evidence", id);
    if (!record2 || !subjectEquals(record2.subject, { kind: parent.kind, id: parent.id }) || record2.body.kind !== "parent-completion" || record2.body.outcome !== "passed" || record2.body.provenance?.tier !== "observed" || !effective.some((candidate) => candidate.evidence_id === id)) {
      fail5("EVIDENCE_GAP", "parent completion evidence is missing, stale, negative, or cross-subject");
    }
    requirePositiveEffectiveEvidence(effective, record2.body);
    for (const artifact of verifyParentCompletionEvidence(
      context,
      tx,
      parent,
      record2.body.evidence_refs,
      { approvalId }
    )) {
      evidenceArtifacts.add(artifact.artifact_id);
    }
  }
  for (const reference of artifactRefs) {
    const artifact = parentReportArtifact(context, tx, parent, reference, approvalId);
    if (!evidenceArtifacts.has(artifact.artifact_id)) {
      fail5(
        "EVIDENCE_GAP",
        "explicitly accepted report artifact is not part of the parent completion evidence"
      );
    }
  }
  return artifactRefs.map((reference) => reference.slice("artifact:".length));
}
function artifactBasisCurrent(context, tx, item, artifact) {
  return artifact.criteria_ref === criteriaRef(item, lookup(tx)) && (item.body.context_artifacts ?? []).every((ref) => artifact.input_basis?.some((b) => b.reference === ref)) && inputBasisCurrent(context, tx, artifact.input_basis ?? []);
}
function subjectArtifact(context, tx, item, subject, acceptingActor = null) {
  if (item.kind !== "task") fail5("INVALID_INPUT", "execution artifacts require a Task subject");
  const history = tx.list("artifact", { kind: "task", id: item.id }).filter((record2) => contentEquals2(record2.body.content_ref, subject));
  if (acceptingActor && (isProducingRun(item.body, acceptingActor) || history.some((record2) => record2.body.producer.runId === acceptingActor.runId))) {
    fail5("AUTHORITY_REQUIRED", "a producing run cannot independently accept its exact subject");
  }
  const candidates = history.filter((record2) => artifactBasisCurrent(context, tx, item, record2.body));
  if (candidates.length === 0) fail5("EVIDENCE_GAP", "exact current subject has no registered retained artifact");
  for (const candidate of candidates) verifyRegisteredArtifact(context, tx, candidate);
}
function verifyReferences(context, tx, item, refs, { recovery: recovery2 = false, positive: positive3 = true } = {}) {
  const artifacts = [];
  const visit = (ref, seen) => {
    const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(ref);
    if (!match || seen.has(ref)) fail5("EVIDENCE_GAP", "references must name registered acyclic artifact/evidence records");
    const [, kind, id] = match;
    const record2 = tx.get(kind, id);
    if (!bindsSubject(record2, { kind: item.kind, id: item.id })) {
      fail5("EVIDENCE_GAP", "referenced evidence is missing or belongs to another hierarchy subject");
    }
    if (kind === "artifact") {
      if (!recovery2 && record2.body.criteria_ref !== criteriaRef(item, lookup(tx))) {
        fail5("EVIDENCE_GAP", "artifact criteria changed");
      }
      verifyRegisteredArtifact(context, tx, record2);
      artifacts.push(record2.body);
    } else {
      if (!recovery2 && !matchesAcceptance(record2.body, item, lookup(tx))) fail5("EVIDENCE_GAP", "referenced evidence is not current");
      if (!recovery2 && positive3) {
        const effective = effectiveEvidence(
          tx.list("evidence", { kind: item.kind, id: item.id }).map((r) => r.body),
          item,
          lookup(tx)
        );
        requirePositiveEffectiveEvidence(effective, record2.body);
      }
      record2.body.evidence_refs.forEach((child) => visit(child, /* @__PURE__ */ new Set([...seen, ref])));
    }
  };
  refs.forEach((ref) => visit(ref, /* @__PURE__ */ new Set()));
  return artifacts;
}
function verifyVerdict(tx, item, verdict, actor = null) {
  const context = contextFor(tx);
  subjectArtifact(context, tx, item, verdict.content_ref, actor);
  verifyReferences(context, tx, item, [...verdict.evidence_refs, ...verdict.finding_refs ?? []]);
}

// src/core/lib/coordination-runtime/acceptance.mjs
function fail6(code, message) {
  throw new RuntimeError(code, message);
}
function taskOnly(record2, action) {
  if (record2.kind !== "task") fail6("INVALID_INPUT", `${action} requires a Task subject`);
}
function lookup2(tx) {
  return (kind, id) => tx.get(kind, id);
}
function bodies(tx, kind, record2) {
  return tx.list(kind, { kind: record2.kind, id: record2.id }).map((entry) => entry.body);
}
function requireReviews(tx, item) {
  taskOnly(item, "review requirements");
  const reviews = effectiveReviews(bodies(tx, "review", item), item, lookup2(tx));
  for (const requirement of item.body.review_requirements) {
    const matching = reviews.filter((review) => review.reviewer.role === requirement.role && review.kind === requirement.kind);
    if (matching.length === 0) {
      fail6("EVIDENCE_GAP", `task/${item.id} lacks current ${requirement.role} ${requirement.kind} review`);
    }
    const independent2 = matching.filter((review) => !isProducingRun(item.body, review.reviewer));
    if (independent2.length === 0) {
      fail6("AUTHORITY_REQUIRED", "a producing run cannot review its own subject");
    }
    if (independent2.some((review) => review.verdict !== "approved")) {
      fail6("EVIDENCE_GAP", `task/${item.id} has an unresolved negative ${requirement.kind} review`);
    }
    if (requirement.kind === "product-design-acceptance" && (requirement.role !== item.body.completion_authority || item.body.producing_actors.some((actor) => actor.role === requirement.role))) {
      fail6("AUTHORITY_REQUIRED", "product-design acceptance requires an independent completion authority");
    }
    independent2.forEach((review) => verifyVerdict(tx, item, review, review.reviewer));
  }
}
function completionApproval(tx, item) {
  const matching = effectiveApprovals(bodies(tx, "approval", item), item, lookup2(tx)).filter((approval) => approval.kind === "completion" && approval.authority.role === item.body.completion_authority);
  if (matching.length === 0) {
    fail6(
      "EVIDENCE_GAP",
      `${item.kind}/${item.id} lacks current completion-authority approval`
    );
  }
  if (item.kind !== "task") {
    if (matching.some((approval) => approval.decision !== "approved" || approval.recorded_at_subject_version !== item.version)) {
      fail6(
        "EVIDENCE_GAP",
        "an effective parent completion decision rejects or predates the current revision"
      );
    }
    const context = contextFor(tx);
    matching.forEach((approval) => verifyParentCompletionApproval(
      context,
      tx,
      item,
      approval.evidence_refs,
      { approvalId: approval.approval_id }
    ));
    return matching[0];
  }
  const independent2 = matching.filter((approval) => !isProducingRun(item.body, approval.authority));
  if (independent2.length === 0) fail6("AUTHORITY_REQUIRED", "a producing run cannot accept its own work");
  if (independent2.some((approval) => approval.decision !== "approved")) {
    fail6("EVIDENCE_GAP", "an effective completion decision rejects the current work");
  }
  independent2.forEach((approval) => verifyVerdict(tx, item, approval, approval.authority));
  return independent2[0];
}
function requireReleaseEvidence(tx, item) {
  taskOnly(item, "release evidence");
  const evidence = effectiveEvidence(bodies(tx, "evidence", item), item, lookup2(tx)).filter((record2) => record2.kind === "dod-dimension");
  for (const dimension of DOD_DIMENSIONS) {
    const matching = evidence.filter((record2) => record2.dimension === dimension);
    if (matching.length === 0 || matching.some((record2) => record2.outcome === "gap")) {
      fail6("EVIDENCE_GAP", `task/${item.id} lacks accepted ${dimension} evidence for its current criteria`);
    }
    matching.forEach((record2) => verifyVerdict(tx, item, record2));
  }
}
function requireOperatorApproval(tx, item, kind) {
  taskOnly(item, "deployment approval");
  const approvals = effectiveApprovals(bodies(tx, "approval", item), item, lookup2(tx)).filter((approval) => approval.kind === kind && approval.authority.role === "operator");
  if (approvals.length === 0 || approvals.some((approval) => approval.decision !== "approved")) {
    fail6("AUTHORITY_REQUIRED", `task/${item.id} lacks effective ${kind} operator confirmation`);
  }
  if (new Set(approvals.map((approval) => canonicalJson(approval.deployment))).size !== 1) {
    fail6("AUTHORITY_REQUIRED", "operator confirmations disagree about the production deployment");
  }
  approvals.forEach((approval) => verifyVerdict(tx, item, approval, approval.authority));
  return approvals[0];
}
function requireDeploymentEvidence(tx, item, kind) {
  taskOnly(item, "deployment evidence");
  const start = requireOperatorApproval(tx, item, "operator-deploy-start");
  const complete = requireOperatorApproval(tx, item, "operator-deploy-complete");
  if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment)) {
    fail6("AUTHORITY_REQUIRED", "deployment completion does not match the confirmed production start");
  }
  const evidence = effectiveEvidence(bodies(tx, "evidence", item), item, lookup2(tx)).filter((record2) => record2.kind === kind && record2.data.environment === start.deployment.environment && record2.data.deployment_id === start.deployment.deployment_id);
  if (evidence.length === 0 || evidence.some((record2) => record2.outcome !== "passed")) {
    fail6("EVIDENCE_GAP", `task/${item.id} lacks passed ${kind} evidence for the confirmed production deployment`);
  }
  evidence.forEach((record2) => verifyVerdict(tx, item, record2));
}
function recoveryResolution(tx, item, approvalId) {
  taskOnly(item, "recovery resolution");
  const approvals = effectiveApprovals(bodies(tx, "approval", item), item, lookup2(tx)).filter((approval2) => approval2.kind === "operator-recovery-resolution" && approval2.authority.role === "operator");
  const approval = approvals.find((candidate) => candidate.approval_id === approvalId);
  const attempt = tx.get("attempt", item.body.recovery_hold);
  if (!approval || approvals.some((candidate) => candidate.decision !== "approved") || new Set(approvals.map((candidate) => canonicalJson(candidate.recovery))).size !== 1 || attempt?.subject?.kind !== "task" || attempt.subject.id !== item.id || attempt.body.disposition !== "conflicting-partial-work" || attempt.body.stale_lease.token !== approval.recovery.stale_lease_token) {
    fail6("AUTHORITY_REQUIRED", "conflicting partial work requires exact persisted operator resolution");
  }
  return approval;
}

// src/core/lib/coordination-runtime/authority.mjs
function fail7(code, message) {
  throw new RuntimeError(code, message);
}
function sameActor(left, right) {
  return left?.role === right?.role && left?.runId === right?.runId;
}
function requireRoleAvailable(role, authority, label) {
  if (role !== "operator" && !authority.roles.includes(role)) {
    fail7("ROLE_UNAVAILABLE", `${label} role "${role}" is not available`);
  }
}
function requireActorAvailable(command2, authority) {
  requireRoleAvailable(command2.actor.role, authority, "actor");
}
function requirePolicy(command2, policy) {
  const declaration = commandKind(command2.kind);
  if (!declaration?.authority.includes(policy)) {
    fail7(
      "INVALID_INPUT",
      `${command2.kind} does not declare the ${policy} authority mechanism`
    );
  }
}
function hostGrantMatches(grant, command2, action) {
  return sameActor(grant.actor, command2.actor) && grant.actions.includes(action) && grant.recordKind === command2.recordKind && grant.recordId === command2.recordId && grant.basisRef === `${command2.recordKind}/${command2.recordId}@${command2.expectedVersion}`;
}
function hostGrantMatchesBasis(grant, command2, action, basisRef) {
  return sameActor(grant.actor, command2.actor) && grant.actions.includes(action) && grant.recordKind === command2.recordKind && grant.recordId === command2.recordId && grant.basisRef === basisRef;
}
function persistedGrantMatches(record2, command2, action) {
  const grant = record2.body;
  return grant.status === "active" && sameActor(grant.actor, command2.actor) && grant.actions.includes(action) && grant.record_kind === command2.recordKind && grant.record_id === command2.recordId && grant.lease_token === command2.leaseToken && Date.parse(grant.expires_at) > Date.now();
}
function hasHostActionGrant(command2, authority, action) {
  return authority.grants.some((grant) => hostGrantMatches(grant, command2, action));
}
function hasHostActionGrantForBasis(command2, authority, action, basisRef) {
  return authority.grants.some(
    (grant) => hostGrantMatchesBasis(grant, command2, action, basisRef)
  );
}
function requireActionGrant(tx, command2, authority, action) {
  requirePolicy(command2, "grant");
  requireActionGrantUnchecked(tx, command2, authority, action);
}
function requireActionGrantUnchecked(tx, command2, authority, action) {
  const allowed = hasHostActionGrant(command2, authority, action) || command2.leaseToken !== null && tx.list("grant", { kind: "task", id: command2.recordId }).some((record2) => persistedGrantMatches(record2, command2, action));
  if (!allowed) {
    fail7(
      "AUTHORITY_REQUIRED",
      `${command2.actor.role} lacks explicit ${action} authority for ${command2.recordKind}/${command2.recordId}`
    );
  }
}
function requireHostActionGrant(command2, authority, action) {
  requirePolicy(command2, "host");
  requireHostActionGrantUnchecked(command2, authority, action);
}
function requireHostActionGrantUnchecked(command2, authority, action) {
  if (!hasHostActionGrant(command2, authority, action)) {
    fail7(
      "AUTHORITY_REQUIRED",
      `${command2.actor.role} lacks trusted host ${action} authority for ${command2.recordKind}/${command2.recordId}`
    );
  }
}
function requireNamedAuthority(tx, command2, authority, action, role) {
  requirePolicy(command2, "named");
  if (command2.actor.role !== role) {
    fail7(
      "AUTHORITY_REQUIRED",
      `${action} requires declared authority "${role}", not "${command2.actor.role}"`
    );
  }
  requireHostActionGrantUnchecked(command2, authority, action);
}
function requireAnyNamedAuthority(tx, command2, authority, action, roles) {
  requirePolicy(command2, "named");
  const allowed = [...new Set(roles)];
  if (!allowed.includes(command2.actor.role)) {
    fail7(
      "AUTHORITY_REQUIRED",
      `${action} requires one of the declared authorities ${allowed.map((role) => `"${role}"`).join(", ")}, not "${command2.actor.role}"`
    );
  }
  requireHostActionGrantUnchecked(command2, authority, action);
}
function leaseIsLive(lease) {
  return lease !== null && Date.parse(lease.expires_at) > Date.now();
}
function requireLease(task, command2) {
  if (task.body.lease !== null && !leaseIsLive(task.body.lease)) {
    fail7("RECOVERY_REQUIRED", `task/${task.id} lease expired and must be reconciled`);
  }
  if (task.body.lease === null || !sameActor(task.body.lease.holder, command2.actor) || task.body.lease.token !== command2.leaseToken) {
    fail7("LEASE_CONFLICT", `command does not hold the current lease for task/${task.id}`);
  }
}
function requireLeasedActingAuthority(tx, task, command2, authority, action) {
  requirePolicy(command2, "leased");
  requireLease(task, command2);
  requireActionGrantUnchecked(tx, command2, authority, action);
}
function requireActingAuthority(tx, task, command2, authority, action) {
  requirePolicy(command2, "acting");
  if (task.body.lease === null) {
    requireHostActionGrantUnchecked(command2, authority, action);
    return;
  }
  requireLease(task, command2);
  requireActionGrantUnchecked(tx, command2, authority, action);
}

// src/core/lib/coordination-runtime/cli.mjs
var cli_exports = {};
__export(cli_exports, {
  execute: () => execute
});

// src/core/lib/coordination-runtime/native-host.mjs
var native_host_exports = {};
__export(native_host_exports, {
  createNativeHost: () => createNativeHost
});

// src/core/lib/coordination-runtime/native-discovery.mjs
var native_discovery_exports = {};
__export(native_discovery_exports, {
  copilotLaunch: () => copilotLaunch,
  discoverCopilot: () => discoverCopilot,
  discoveryRoots: () => discoveryRoots
});
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { existsSync as existsSync6, readFileSync as readFileSync5 } from "node:fs";
import { delimiter, dirname as dirname8, isAbsolute as isAbsolute5, join as join8, resolve as resolve5 } from "node:path";
import { fileURLToPath } from "node:url";
var fail8 = (message) => new RuntimeError("UNSUPPORTED_HOST", message);
var owners = /* @__PURE__ */ new Set(["kai-core", "kai-engineering", "kai-creative"]);
var options = (list) => (list ?? []).flatMap((entry) => entry.options ?? [entry]);
function discoveryRoots(here) {
  const ancestors = [];
  for (let dir = here, up = dirname8(dir); ; up = dirname8(dir = up)) {
    ancestors.push(dir);
    if (up === dir) break;
  }
  return {
    pluginRoot: ancestors.find((dir) => existsSync6(join8(dir, "agents"))) ?? resolve5(here, ".."),
    repoRoot: ancestors.find((dir) => existsSync6(join8(dir, "plugins"))) ?? resolve5(here, "..", "..")
  };
}
var HERE = dirname8(fileURLToPath(import.meta.url));
var { pluginRoot, repoRoot } = discoveryRoots(HERE);
function copilotLaunch(env = process.env) {
  const executable = env.KAI_COPILOT_EXECUTABLE || "copilot";
  const pluginDirs = (env.KAI_COPILOT_PLUGIN_DIRS ?? "").split(delimiter).filter(Boolean);
  if (pluginDirs.some((p) => !isAbsolute5(p) || !existsSync6(p))) throw fail8("KAI_COPILOT_PLUGIN_DIRS must contain existing absolute native provider directories");
  return { executable, pluginDirs, pluginArguments: pluginDirs.flatMap((path4) => ["--plugin-dir", path4]) };
}
async function discoverCopilot({ root, env = process.env, role }) {
  const { executable, pluginDirs, pluginArguments } = copilotLaunch(env);
  const child = spawn(executable, [
    "--acp",
    "--stdio",
    "--disable-builtin-mcps",
    "--available-tools=view,skill",
    ...pluginArguments
  ], { cwd: root, env, stdio: ["pipe", "pipe", "pipe"], windowsHide: true });
  const pending = /* @__PURE__ */ new Map();
  let id = 0, failure, closed = false;
  const exited = new Promise((resolveExit) => {
    child.once("close", () => {
      closed = true;
      resolveExit();
    });
  });
  function rejectAll(error) {
    failure = error;
    for (const waiter of pending.values()) {
      clearTimeout(waiter.timer);
      waiter.reject(error);
    }
    pending.clear();
  }
  child.on("error", (error) => rejectAll(fail8(`native executable cannot start (${error.code ?? "unknown"}); configure KAI_COPILOT_EXECUTABLE in trusted launch environment`)));
  child.on("exit", (code) => {
    if (pending.size) rejectAll(fail8(`metadata ACP exited before discovery (${code})`));
  });
  child.stdin.on("error", (error) => rejectAll(fail8(`metadata ACP input closed (${error.code})`)));
  child.stderr.resume();
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
  lines.on("line", (line) => {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      rejectAll(fail8("native ACP emitted non-JSON metadata"));
      return;
    }
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      clearTimeout(waiter.timer);
      if (message.error) waiter.reject(fail8(`native metadata ACP request failed (${message.error.code})`));
      else waiter.resolve(message.result);
    } else if (message.id !== void 0 && message.method) {
      child.stdin.write(`${JSON.stringify(message.method === "session/request_permission" ? { jsonrpc: "2.0", id: message.id, result: { outcome: { outcome: "cancelled" } } } : { jsonrpc: "2.0", id: message.id, error: { code: -32601, message: "Metadata-only client has no tools" } })}
`);
    }
  });
  const call = (method, params) => new Promise((resolveResult, reject) => {
    if (failure) {
      reject(failure);
      return;
    }
    const requestId = ++id;
    const timer = setTimeout(() => {
      pending.delete(requestId);
      reject(fail8(`metadata ACP timed out during ${method}`));
    }, 3e4);
    pending.set(requestId, { resolve: resolveResult, reject, timer });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params })}
`);
  });
  let result;
  try {
    const initialized = await call("initialize", { protocolVersion: 1, clientCapabilities: {} });
    if (initialized?.agentInfo?.version !== "1.0.85") {
      throw fail8(`native adapter measured only Copilot CLI 1.0.85; observed ${initialized?.agentInfo?.version ?? "unknown"}`);
    }
    const session = await call("session/new", { cwd: root, mcpServers: [] });
    const agentOption = session.configOptions?.find((o) => o.id === "agent" && o.category === "_agent" && o.type === "select");
    const modelIds = session.models?.availableModels?.map((m) => m.modelId);
    if (!agentOption || !Array.isArray(modelIds) || modelIds.some((m) => typeof m !== "string")) throw fail8("native host omitted measured agent/model metadata");
    const roster = options(agentOption.options).flatMap((entry) => {
      if (typeof entry.value !== "string") return [];
      const [owner, role2, extra] = entry.value.split(":");
      if (!owners.has(owner) || !role2 || extra) return [];
      return [{ id: entry.value, role: role2, model: null }];
    });
    if (new Set(roster.map((r) => r.role)).size !== roster.length) throw fail8("native host advertises ambiguous duplicate role identities");
    let prepared;
    if (role !== void 0) {
      const entry = roster.find((r) => r.role === role);
      if (!entry) throw new RuntimeError("ROLE_UNAVAILABLE", "requested preparation role is absent from the actual native roster");
      const selected = await call("session/set_config_option", { sessionId: session.sessionId, configId: "agent", value: entry.id });
      if (selected?.configOptions?.find((o) => o.id === "agent")?.currentValue !== entry.id) {
        throw fail8("native host did not confirm the exact requested agent selection");
      }
      prepared = { actor: { role, runId: session.sessionId }, agentId: entry.id };
    }
    const profiles = {};
    for (const entry of roster) {
      const [owner, role2] = entry.id.split(":");
      const candidates = [
        ...pluginDirs.map((dir) => join8(dir, "agents", `${role2}.agent.md`)),
        join8(pluginRoot, "agents", `${role2}.agent.md`),
        join8(repoRoot, "plugins", owner, "agents", `${role2}.agent.md`)
      ];
      const path4 = candidates.find((p) => existsSync6(p));
      if (!path4) continue;
      const text2 = readFileSync5(path4, "utf8");
      profiles[role2] = /\*\*Primary profile:\*\*\s*([a-z-]+)/.exec(text2)?.[1];
      entry.model = /^model:\s*"?([^"\r\n]+)"?/m.exec(text2)?.[1] ?? null;
      if (profiles[role2] === void 0) delete profiles[role2];
    }
    result = {
      host: { name: initialized.agentInfo.name, version: initialized.agentInfo.version },
      roster,
      profiles,
      capabilities: {
        peerDispatch: false,
        resume: false,
        modelOverride: session.configOptions.some((o) => o.id === "model"),
        usage: false,
        models: [...new Set(modelIds)],
        efforts: options(session.configOptions.find((o) => o.id === "reasoning_effort")?.options).map((o) => o.value).filter((v) => typeof v === "string")
      },
      advertised: {
        loadSession: initialized.agentCapabilities?.loadSession === true,
        sessionId: session.sessionId
      },
      modelPromptSent: false,
      ...prepared ? { prepared } : {}
    };
  } finally {
    for (const waiter of pending.values()) clearTimeout(waiter.timer);
    pending.clear();
    child.stdin.end();
    const timer = setTimeout(() => {
      if (!closed) child.kill();
    }, 3e3);
    await exited;
    clearTimeout(timer);
    lines.close();
  }
  return { ...result, transportClosed: closed };
}

// src/core/lib/coordination-runtime/native-host.mjs
import { randomUUID as randomUUID3, createHash as createHash7 } from "node:crypto";
import { existsSync as existsSync9 } from "node:fs";

// src/core/lib/coordination-runtime/native-receipts.mjs
import { createReadStream, existsSync as existsSync7, lstatSync as lstatSync4, openSync as openSync2, fstatSync as fstatSync2, closeSync as closeSync2 } from "node:fs";
import { join as join9, isAbsolute as isAbsolute6 } from "node:path";
import { createInterface as createInterface2 } from "node:readline";
var fail9 = (code, message) => {
  throw new RuntimeError(code, message);
};
var eventTypes = /* @__PURE__ */ new Set([
  "tool.execution_start",
  "tool.execution_complete",
  "session.start",
  "subagent.selected",
  "assistant.turn_start"
]);
var fields = (value, keys) => Object.fromEntries(keys.filter((k) => value?.[k] !== void 0).map((k) => [k, value[k]]));
function safeEvent(event) {
  const data = event.data ?? {};
  let selected;
  if (event.type === "session.start") selected = {
    ...fields(data, ["sessionId", "copilotVersion", "startTime"]),
    context: fields(data.context, ["cwd"])
  };
  else if (event.type === "subagent.selected") selected = fields(data, ["agentName"]);
  else if (event.type === "tool.execution_start") selected = {
    ...fields(data, ["toolCallId", "toolName"]),
    arguments: fields(
      data.arguments,
      data.toolName === "ask_user" ? ["message", "requestedSchema"] : data.toolName === "powershell" ? ["command", "mode"] : []
    )
  };
  else if (event.type === "tool.execution_complete") selected = {
    ...fields(data, ["toolCallId", "success"]),
    result: fields(data.result, ["content", "detailedContent"])
  };
  else selected = {};
  return { ...fields(event, ["id", "timestamp", "type", "agentId"]), data: selected };
}
function contextIdentity(env) {
  const id = env.COPILOT_AGENT_SESSION_ID;
  if (typeof id !== "string" || !/^[a-z0-9][a-z0-9-]{0,127}$/i.test(id)) {
    fail9("UNSUPPORTED_HOST", "COPILOT_AGENT_SESSION_ID is absent/invalid; read-only and direct work remain available");
  }
  return id;
}
async function* nativeEvents(env, types = ["tool.execution_start", "tool.execution_complete"]) {
  if (!Array.isArray(types) || types.some((t) => !eventTypes.has(t))) fail9("INVALID_INPUT", "native metadata types must be explicitly allowlisted");
  const sessionId = contextIdentity(env);
  const home = env.USERPROFILE || env.HOME;
  if (!home || !isAbsolute6(home)) fail9("UNSUPPORTED_HOST", "native session-state home is unavailable");
  const directory = join9(home, ".copilot", "session-state", sessionId);
  const path4 = join9(directory, "events.jsonl");
  if (!existsSync7(path4)) fail9("UNSUPPORTED_HOST", "this context has no standalone journal; use prepare, reserve/delegate, then launch the standalone --session-id context. Nested agent IDs are not mapped to parent journals");
  if (pathHasLink(home, path4) || !lstatSync4(path4).isFile() || lstatSync4(path4).nlink !== 1) {
    fail9("UNSUPPORTED_HOST", "native journal must be an unshared regular local file");
  }
  const stat = lstatSync4(path4);
  const fd = openSync2(path4, "r");
  const opened = fstatSync2(fd);
  if (opened.ino !== stat.ino || opened.dev !== stat.dev || opened.nlink !== 1 || !opened.isFile()) {
    closeSync2(fd);
    fail9("UNSUPPORTED_HOST", "native journal changed identity while opening");
  }
  if (opened.size === 0) {
    closeSync2(fd);
    return;
  }
  const stream = createReadStream(path4, { fd, encoding: "utf8", end: opened.size - 1 });
  const lines = createInterface2({ input: stream, crlfDelay: Infinity });
  let seq = 0;
  try {
    for await (const line of lines) {
      seq++;
      if (!types.some((type) => line.includes(type))) continue;
      let event;
      try {
        event = JSON.parse(line);
      } catch (error) {
        if (!(error instanceof SyntaxError)) throw error;
        continue;
      }
      if (!types.includes(event.type)) continue;
      yield { event: safeEvent(event), seq, sessionId };
    }
  } finally {
    lines.close();
    stream.destroy();
  }
}
async function readNativeTool({ env, toolCallId, toolNames, matchesStart }) {
  if (toolCallId === void 0) {
    if (typeof matchesStart !== "function") fail9("INVALID_INPUT", "receipt lookup requires a canonical issued request");
    const candidates = [];
    for await (const { event } of nativeEvents(env)) {
      if (event.type === "tool.execution_start" && toolNames.includes(event.data?.toolName) && matchesStart(event.data.arguments)) candidates.push(event.data.toolCallId);
    }
    if (candidates.length !== 1) fail9("AUTHORITY_REQUIRED", "canonical request must match one native interaction; use an exact --tool-call when disambiguation is needed");
    [toolCallId] = candidates;
  }
  if (typeof toolCallId !== "string" || !toolCallId || toolCallId.length > 256) fail9("INVALID_INPUT", "native --tool-call ID must be nonempty and bounded");
  let start, complete, starts = 0, completions = 0, startSeq, completeSeq, sessionId;
  for await (const frame of nativeEvents(env)) {
    const { event, seq } = frame;
    sessionId = frame.sessionId;
    const data = event.data;
    if (data?.toolCallId !== toolCallId) continue;
    if (event.agentId) {
      fail9("UNSUPPORTED_HOST", "this receipt belongs to a nested host agent; agentId is not a measured mapping to COPILOT_AGENT_SESSION_ID. Use a trusted host-owned identity/capture registry");
    }
    if (event.type === "tool.execution_start") {
      starts++;
      startSeq = seq;
      if (!toolNames.includes(data.toolName)) fail9("UNSUPPORTED_HOST", "native tool receipt type is not supported for this operation");
      start = { id: event.id, timestamp: event.timestamp, name: data.toolName, arguments: data.arguments };
    } else if (event.type === "tool.execution_complete") {
      completions++;
      completeSeq = seq;
      complete = {
        id: event.id,
        timestamp: event.timestamp,
        success: data.success,
        content: data.result?.content,
        detailedContent: data.result?.detailedContent
      };
    }
  }
  if (starts !== 1 || completions !== 1 || startSeq >= completeSeq) {
    fail9("AUTHORITY_REQUIRED", "native receipt requires exactly one ordered matching start and completion");
  }
  if (!start.timestamp || Number.isNaN(Date.parse(start.timestamp)) || !complete.timestamp || Number.isNaN(Date.parse(complete.timestamp)) || Date.parse(complete.timestamp) > Date.now() || Date.parse(start.timestamp) > Date.parse(complete.timestamp)) {
    fail9("EVIDENCE_GAP", "native completion has no valid capture timestamp");
  }
  return { sessionId, toolCallId, start, complete };
}
async function matchHumanDecision({ env, request, toolCallId }) {
  const receipt = await readNativeTool({ env, toolCallId, toolNames: ["ask_user"], matchesStart: (args) => args?.message === request.message && canonicalJson(args?.requestedSchema ?? null) === canonicalJson(request.requestedSchema) });
  const reply = `APPROVE ${request.nonce}`;
  if (receipt.complete.success !== true || receipt.start.arguments?.message !== request.message || canonicalJson(receipt.start.arguments?.requestedSchema ?? null) !== canonicalJson(request.requestedSchema) || receipt.complete.content !== `User responded: ${reply}` || receipt.complete.detailedContent !== `User responded:
decision: ${reply}` || Date.parse(receipt.start.timestamp) < Date.parse(request.createdAt) || Date.parse(receipt.complete.timestamp) > Date.parse(request.expiresAt)) {
    fail9("AUTHORITY_REQUIRED", "operator decision requires the exact visible nonce/scope/action and unconditional strict APPROVE reply; tool success alone is not approval");
  }
  return {
    source: "host-interaction",
    reference: `host:copilot:${receipt.sessionId}:${receipt.complete.id}`,
    attributed_to: "Operator",
    captured_at: receipt.complete.timestamp,
    requestNonce: request.nonce,
    toolCallId: receipt.toolCallId,
    sessionId: receipt.sessionId,
    startEventId: receipt.start.id,
    completeEventId: receipt.complete.id
  };
}

// src/core/lib/coordination-runtime/native-capabilities.mjs
import { createHash as createHash6, createHmac, randomBytes, randomUUID, timingSafeEqual } from "node:crypto";
import {
  closeSync as closeSync3,
  existsSync as existsSync8,
  fsyncSync as fsyncSync2,
  lstatSync as lstatSync5,
  openSync as openSync3,
  readFileSync as readFileSync6,
  renameSync as renameSync2,
  unlinkSync,
  writeFileSync as writeFileSync2
} from "node:fs";
import { basename as basename3, dirname as dirname9, join as join10 } from "node:path";
var lane = ".kai/core/runtime/host";
var fail10 = (code, message) => {
  throw new RuntimeError(code, message);
};
var kinds = /* @__PURE__ */ new Set(["requests", "capabilities", "captures", "preparations", "reservations"]);
var requireKind = (kind) => {
  if (!kinds.has(kind)) fail10("INVALID_INPUT", "unsupported native issuer record kind");
};
function nativeWriterTokenPath(root, id) {
  const canonical = canonicalPath(root);
  const digest3 = createHash6("sha256").update(canonical).digest("hex").slice(0, 12);
  return join10(dirname9(canonical), `.${basename3(canonical)}.${digest3}.native-writer-${id}.lock`);
}
function capabilityId(id) {
  if (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id)) {
    fail10("AUTHORITY_REQUIRED", "an issued capability/request UUID is required");
  }
  return id;
}
function key(root, create) {
  const name = `${lane}/key`;
  const present = existsSync8(safePath(root, name));
  const admission = privateAdmission(root, { admit: create && !present });
  if (admission.errors.length) fail10("INVALID_INPUT", admission.errors.join("; "));
  if (!present) {
    if (!create) fail10("AUTHORITY_REQUIRED", "no native capability issuer has been initialized");
    try {
      exclusiveFile(root, name, randomBytes(32));
    } catch (error) {
      if (error.code !== "EEXIST") throw error;
    }
  }
  const bytes = exactFile(root, name);
  if (bytes.length !== 32) fail10("AUTHORITY_REQUIRED", "invalid native issuer key");
  return bytes;
}
function signature(root, payload, create = false) {
  return createHmac("sha256", key(root, create)).update(canonicalJson(payload)).digest("hex");
}
function releaseWriterToken(token) {
  if (!existsSync8(token.path)) {
    fail10("RECOVERY_REQUIRED", "native writer admission token disappeared");
  }
  const stat = lstatSync5(token.path);
  if (!stat.isFile() || stat.nlink !== 1 || readFileSync6(token.path, "utf8") !== canonicalJson(token.value)) {
    fail10("RECOVERY_REQUIRED", "native writer admission token changed");
  }
  unlinkSync(token.path);
}
function acquireWriterToken(root) {
  const id = randomUUID();
  const path4 = nativeWriterTokenPath(root, id);
  const pending = `${path4}.pending-${randomUUID()}`;
  const value = {
    schema_version: 1,
    id,
    root,
    pid: process.pid,
    created_at: (/* @__PURE__ */ new Date()).toISOString()
  };
  const fd = openSync3(pending, "wx", 384);
  try {
    writeFileSync2(fd, canonicalJson(value));
    fsyncSync2(fd);
  } finally {
    closeSync3(fd);
  }
  try {
    renameSync2(pending, path4);
    return { path: path4, value };
  } catch (error) {
    if (existsSync8(pending)) unlinkSync(pending);
    throw error;
  }
}
function withWriterAdmission(root, write) {
  const token = acquireWriterToken(root);
  try {
    return write();
  } finally {
    releaseWriterToken(token);
  }
}
function writeIssued(root, kind, id, payload) {
  requireKind(kind);
  capabilityId(id);
  return withWriterAdmission(root, () => {
    const value = { payload, mac: signature(root, payload, true) };
    const name = `${lane}/${kind}/${id}.json`;
    if (existsSync8(safePath(root, name))) {
      if (canonicalJson(readIssued(root, kind, id)) !== canonicalJson(payload)) fail10("OPERATION_CONFLICT", "issued identity already has different content");
      return;
    }
    exclusiveFile(root, name, canonicalJson(value));
  });
}
function readIssued(root, kind, id) {
  requireKind(kind);
  capabilityId(id);
  const name = `${lane}/${kind}/${id}.json`;
  if (!existsSync8(safePath(root, name))) fail10("AUTHORITY_REQUIRED", `no issued ${kind} for this identity`);
  const bytes = exactFile(root, name);
  let value;
  try {
    value = JSON.parse(bytes);
  } catch (error) {
    if (!(error instanceof SyntaxError)) throw error;
    fail10("AUTHORITY_REQUIRED", "issued capability file is malformed");
  }
  if (!value?.payload || typeof value.mac !== "string" || !/^[a-f0-9]{64}$/.test(value.mac) || !timingSafeEqual(Buffer.from(value.mac, "hex"), Buffer.from(signature(root, value.payload), "hex"))) {
    fail10("AUTHORITY_REQUIRED", "capability was not issued by this workspace host");
  }
  return value.payload;
}

// src/core/lib/coordination-runtime/hierarchy-engine.mjs
import { basename as basename4, posix as path3 } from "node:path";
var PARENT_CONFIG = Object.freeze({
  epic: {
    childKind: "feature",
    requiredField: "required_features",
    optionalField: "optional_features",
    successDisposition: "achieved",
    childSuccessDisposition: "delivered"
  },
  feature: {
    childKind: "requirement",
    requiredField: "required_requirements",
    optionalField: "optional_requirements",
    successDisposition: "delivered",
    childSuccessDisposition: "satisfied"
  },
  requirement: {
    childKind: "task",
    requiredField: "required_tasks",
    optionalField: "optional_tasks",
    successDisposition: "satisfied",
    childSuccessDisposition: null
  }
});
var SCOPE_FIELDS = Object.freeze({
  epic: /* @__PURE__ */ new Set([
    "owner",
    "scope_authority",
    "completion_authority",
    "outcome",
    "acceptance",
    "direction_ref",
    "contribution",
    "scope_fit",
    "required_features",
    "optional_features"
  ]),
  feature: /* @__PURE__ */ new Set([
    "owner",
    "scope_authority",
    "completion_authority",
    "outcome",
    "acceptance",
    "required_requirements",
    "optional_requirements",
    "depends_on_features"
  ]),
  requirement: /* @__PURE__ */ new Set([
    "owner",
    "scope_authority",
    "completion_authority",
    "outcome",
    "acceptance",
    "required_tasks",
    "optional_tasks"
  ])
});
function fail11(code, message) {
  throw new RuntimeError(code, message);
}
function uniqueRecords(records2) {
  const unique2 = /* @__PURE__ */ new Map();
  for (const record2 of records2.filter(Boolean)) {
    unique2.set(`${record2.kind}\0${record2.id}`, record2);
  }
  return [...unique2.values()];
}
function relationshipVersion(record2, taskDisposition = null) {
  return {
    kind: record2.kind,
    id: record2.id,
    version: record2.version,
    state: record2.body.state,
    disposition: record2.kind === "task" ? taskDisposition ?? record2.body.state : record2.body.completion_disposition
  };
}
function relationshipVersions(records2) {
  return uniqueRecords(records2).map((record2) => relationshipVersion(record2)).sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id));
}
function directionBasis(direction) {
  return `direction:${direction.path}@${direction.hash}`;
}
function eventTime(command2, nextBody) {
  return command2.kind.endsWith(".create") ? nextBody.created_at : command2.payload.at;
}
function eventReason(command2) {
  if (typeof command2.payload.reason === "string") return command2.payload.reason;
  const action = command2.kind.split(".")[1];
  if (action === "create") return "Created the governed parent proposal.";
  if (action === "update") return "Updated the governed parent record.";
  return `Accepted the governed parent ${action} decision.`;
}
function appendMutationEvent(tx, current, nextBody, command2, related, { basisRefs = [], extra = {} } = {}) {
  const oldVersion = current?.version ?? 0;
  tx.appendEvent({
    kind: command2.kind,
    actor: command2.actor,
    at: eventTime(command2, nextBody),
    reason: eventReason(command2),
    recordKind: command2.recordKind,
    recordId: command2.recordId,
    oldVersion,
    newVersion: oldVersion + 1,
    changedFields: current === null ? Object.keys(nextBody).sort() : changedKeys(current.body, nextBody).sort(),
    basisRefs: [...new Set(basisRefs)],
    relationshipVersions: relationshipVersions(related),
    ...extra
  });
}
function workspaceRoot(store) {
  return workspaceRootFromCoordinationDatabase(store.path);
}
function configuredDirectionPath(project) {
  if (typeof project?.publication_root !== "string") return null;
  const publicationRoot = project.publication_root.replace(/\\/g, "/").replace(/^\.\//, "").replace(/\/+$/, "");
  return path3.join(publicationRoot, basename4(directionPath()));
}
function projectIdForDirectionRef(manifest, directionRef) {
  if (!directionRef || typeof directionRef.path !== "string") {
    fail11("EVIDENCE_GAP", "Epic Direction reference must name a configured project path");
  }
  const matches = Array.isArray(manifest.projects) ? manifest.projects.filter(
    (project) => configuredDirectionPath(project) === directionRef.path
  ) : [];
  if (matches.length !== 1) {
    fail11(
      "EVIDENCE_GAP",
      `Epic Direction path "${directionRef.path}" must match exactly one configured project`
    );
  }
  if (typeof matches[0].id !== "string" || !matches[0].id.trim()) {
    fail11("EVIDENCE_GAP", "the configured project matching the Epic Direction path needs an id");
  }
  return matches[0].id;
}
function currentDirectionForStore(store, directionRef) {
  const root = workspaceRoot(store);
  const result = readWorkspaceManifest(root);
  if (!result.ok) {
    fail11("EVIDENCE_GAP", `current Direction cannot be resolved: ${result.reason}`);
  }
  try {
    const projectId = projectIdForDirectionRef(result.manifest, directionRef);
    return readDirection({
      workspaceRoot: root,
      manifest: result.manifest,
      projectId
    });
  } catch (error) {
    fail11("EVIDENCE_GAP", `current Direction cannot be resolved: ${error.message}`);
  }
}
function exactDirectionRef(direction) {
  return {
    path: direction.path,
    hash: direction.hash,
    goal: direction.goal
  };
}
function assertDirectionAligned(epic, direction) {
  if (canonicalJson(epic.body.direction_ref) !== canonicalJson(exactDirectionRef(direction))) {
    fail11(
      "EVIDENCE_GAP",
      `epic/${epic.id} is not aligned to the current runtime-computed Direction`
    );
  }
}
function hasStaleDirection(tx, record2, resolveDirection) {
  try {
    const epic = epicAncestor(tx, record2);
    const direction = resolveDirection(epic.body.direction_ref);
    return canonicalJson(epic.body.direction_ref) !== canonicalJson(exactDirectionRef(direction));
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "EVIDENCE_GAP") return false;
    throw error;
  }
}
function requireActive(record2, label) {
  if (record2.body.state !== "active") {
    fail11("EVIDENCE_GAP", `${label} must be active`);
  }
}
function requireNoHold(record2, label) {
  if (record2.body.hold !== null) {
    fail11("EVIDENCE_GAP", `${label} is under an effective hold`);
  }
}
function featureDependencyRecords(tx, feature, { requireDelivered = false } = {}) {
  const dependencies2 = [];
  for (const dependency of feature.body.depends_on_features) {
    const upstream = tx.get("feature", dependency.feature);
    if (!upstream) {
      fail11(
        "INVALID_INPUT",
        `feature/${feature.id} references a missing dependency ${dependency.feature}`
      );
    }
    if (requireDelivered && (upstream.body.state !== "completed" || upstream.body.completion_disposition !== "delivered")) {
      fail11(
        "EVIDENCE_GAP",
        `feature/${dependency.feature} must be completed with delivered`
      );
    }
    dependencies2.push(upstream);
  }
  return dependencies2;
}
function assertNoFeatureDependencyCycle(tx, candidate) {
  const features = new Map(tx.list("feature").map((record2) => [record2.id, record2]));
  features.set(candidate.id, candidate);
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  function visit(id) {
    if (visiting.has(id)) {
      fail11("INVALID_INPUT", `feature dependency cycle detected at feature/${id}`);
    }
    if (visited.has(id)) return;
    const feature = features.get(id);
    if (!feature) return;
    visiting.add(id);
    for (const dependency of feature.body.depends_on_features) {
      if (!features.has(dependency.feature)) {
        fail11(
          "INVALID_INPUT",
          `feature/${feature.id} references a missing dependency ${dependency.feature}`
        );
      }
      visit(dependency.feature);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of features.keys()) visit(id);
}
function containsChild(parent, config, childId) {
  return parent.body[config.requiredField].includes(childId) || parent.body[config.optionalField].includes(childId);
}
function candidateLookup(tx, candidate) {
  return (kind, id) => kind === candidate.kind && id === candidate.id ? candidate : tx.get(kind, id);
}
function assertUniqueParentClaims(tx, parentKind, candidate) {
  const config = PARENT_CONFIG[parentKind];
  if (!config || parentKind === "requirement") return;
  const claims = /* @__PURE__ */ new Map();
  const parents = tx.list(parentKind).filter((record2) => record2.id !== candidate.id).concat(candidate);
  for (const parent of parents) {
    for (const childId of [
      ...parent.body[config.requiredField],
      ...parent.body[config.optionalField]
    ]) {
      const claimedBy = claims.get(childId);
      if (claimedBy && claimedBy !== parent.id) {
        fail11(
          "INVALID_INPUT",
          `${config.childKind}/${childId} must belong to exactly one ${parentKind}`
        );
      }
      claims.set(childId, parent.id);
    }
  }
}
function assertExistingChildrenAgree(tx, parent) {
  const config = PARENT_CONFIG[parent.kind];
  const listed = /* @__PURE__ */ new Set([
    ...parent.body[config.requiredField],
    ...parent.body[config.optionalField]
  ]);
  const related = [];
  if (parent.kind === "epic") {
    for (const child of tx.list("feature")) {
      if (child.body.epic_id === parent.id && !listed.has(child.id)) {
        fail11(
          "INVALID_INPUT",
          `feature/${child.id} must remain listed by epic/${parent.id}`
        );
      }
    }
    for (const id of listed) {
      const child = tx.get("feature", id);
      if (!child) continue;
      if (child.body.epic_id !== parent.id) {
        fail11(
          "INVALID_INPUT",
          `epic/${parent.id} references mismatched feature/${id}`
        );
      }
      related.push(child);
    }
  } else if (parent.kind === "feature") {
    for (const child of tx.list("requirement")) {
      if (child.body.feature_id === parent.id && !listed.has(child.id)) {
        fail11(
          "INVALID_INPUT",
          `requirement/${child.id} must remain listed by feature/${parent.id}`
        );
      }
    }
    for (const id of listed) {
      const child = tx.get("requirement", id);
      if (!child) continue;
      if (child.body.feature_id !== parent.id || child.body.pack !== parent.body.pack) {
        fail11(
          "INVALID_INPUT",
          `feature/${parent.id} references mismatched requirement/${id}`
        );
      }
      related.push(child);
    }
  } else {
    for (const child of tx.list("task")) {
      if (child.body.satisfies.includes(parent.id) && !listed.has(child.id)) {
        fail11(
          "INVALID_INPUT",
          `task/${child.id} must remain listed by requirement/${parent.id}`
        );
      }
    }
    for (const id of listed) {
      const child = tx.get("task", id);
      if (!child) continue;
      if (child.body.feature_id !== parent.body.feature_id || !child.body.satisfies.includes(parent.id)) {
        fail11(
          "INVALID_INPUT",
          `requirement/${parent.id} references mismatched task/${id}`
        );
      }
      related.push(child);
    }
  }
  return related;
}
function assertParentRelationships(tx, candidate) {
  validateHierarchyRecord(candidate, candidateLookup(tx, candidate));
  assertUniqueParentClaims(tx, candidate.kind, candidate);
  const related = assertExistingChildrenAgree(tx, candidate);
  if (candidate.kind === "feature") {
    assertNoFeatureDependencyCycle(tx, candidate);
    related.push(...featureDependencyRecords(tx, candidate));
    const epic = tx.get("epic", candidate.body.epic_id);
    if (!epic || !containsChild(epic, PARENT_CONFIG.epic, candidate.id)) {
      fail11(
        "INVALID_INPUT",
        `feature/${candidate.id} must appear in epic/${candidate.body.epic_id}`
      );
    }
    related.push(epic);
  } else if (candidate.kind === "requirement") {
    const feature = tx.get("feature", candidate.body.feature_id);
    if (!feature || !containsChild(feature, PARENT_CONFIG.feature, candidate.id)) {
      fail11(
        "INVALID_INPUT",
        `requirement/${candidate.id} must appear in feature/${candidate.body.feature_id}`
      );
    }
    related.push(feature);
  }
  return uniqueRecords(related);
}
function requireKnownParentRoles(body, authority) {
  for (const [label, role] of [
    ["owner", body.owner],
    ["scope authority", body.scope_authority],
    ["completion authority", body.completion_authority]
  ]) {
    requireRoleAvailable(role, authority, label);
  }
}
function requireAllowedAuthority(command2, authority, roles, message) {
  if (!roles.includes(command2.actor.role)) {
    fail11("AUTHORITY_REQUIRED", message);
  }
  requireHostActionGrant(command2, authority, command2.kind);
}
function parentContext(tx, record2) {
  if (record2.kind === "epic") return [];
  if (record2.kind === "feature") {
    return [tx.get("epic", record2.body.epic_id)].filter(Boolean);
  }
  return [tx.get("feature", record2.body.feature_id)].filter(Boolean);
}
function epicAncestor(tx, record2) {
  if (record2.kind === "epic") return record2;
  const feature = record2.kind === "feature" ? record2 : tx.get("feature", record2.body.feature_id);
  if (!feature) {
    fail11("EVIDENCE_GAP", `${record2.kind}/${record2.id} has no current Feature ancestor`);
  }
  const epic = tx.get("epic", feature.body.epic_id);
  if (!epic) {
    fail11("EVIDENCE_GAP", `feature/${feature.id} has no current Epic ancestor`);
  }
  return epic;
}
function directionForRecord(tx, record2, runtime) {
  const epic = epicAncestor(tx, record2);
  return runtime.direction(epic.body.direction_ref);
}
function assertAlignedAncestors(tx, record2, direction) {
  validateHierarchyRecord(record2);
  if (record2.kind === "epic") {
    assertDirectionAligned(record2, direction);
    return [];
  }
  const feature = record2.kind === "feature" ? record2 : tx.get("feature", record2.body.feature_id);
  if (!feature) {
    fail11(
      "EVIDENCE_GAP",
      `${record2.kind}/${record2.id} has no current Feature ancestor`
    );
  }
  requireActive(feature, `feature/${feature.id}`);
  requireNoHold(feature, `feature/${feature.id}`);
  const epic = tx.get("epic", feature.body.epic_id);
  if (!epic) {
    fail11("EVIDENCE_GAP", `feature/${feature.id} has no current Epic ancestor`);
  }
  requireActive(epic, `epic/${epic.id}`);
  requireNoHold(epic, `epic/${epic.id}`);
  assertDirectionAligned(epic, direction);
  const related = [feature, epic, ...featureDependencyRecords(tx, feature, {
    requireDelivered: true
  })];
  if (record2.kind === "requirement") {
    if (record2.body.feature_id !== feature.id || !containsChild(feature, PARENT_CONFIG.feature, record2.id)) {
      fail11(
        "INVALID_INPUT",
        `requirement/${record2.id} does not match feature/${feature.id}`
      );
    }
    return uniqueRecords(related.filter((entry) => entry.id !== record2.id));
  }
  if (record2.kind === "task") {
    if (record2.body.feature_id !== feature.id) {
      fail11("INVALID_INPUT", `task/${record2.id} does not match feature/${feature.id}`);
    }
    for (const requirementId of record2.body.satisfies) {
      const requirement = tx.get("requirement", requirementId);
      if (!requirement || requirement.body.feature_id !== feature.id || !containsChild(requirement, PARENT_CONFIG.requirement, record2.id)) {
        fail11(
          "INVALID_INPUT",
          `task/${record2.id} has an invalid Requirement relationship`
        );
      }
      requireActive(requirement, `requirement/${requirement.id}`);
      requireNoHold(requirement, `requirement/${requirement.id}`);
      related.push(requirement);
    }
    return uniqueRecords(related.filter((entry) => entry.id !== record2.id));
  }
  return uniqueRecords(related.filter((entry) => entry.id !== record2.id));
}
function taskTerminalState(task) {
  return task.body.delivery_class === "knowledge" ? "completed" : "shipped";
}
function closureChildIdentity(record2) {
  if (record2.kind !== "task") return record2;
  return {
    ...record2,
    body: {
      ...record2.body,
      completion_disposition: record2.body.state
    }
  };
}
function closureEligibility(tx, parent) {
  validateHierarchyRecord(parent);
  const config = PARENT_CONFIG[parent.kind];
  if (!config) fail11("INVALID_INPUT", `${parent.kind}/${parent.id} is not a parent record`);
  const requiredChildren = [];
  const related = [];
  const blockers = [];
  for (const id of parent.body[config.requiredField]) {
    const child = tx.get(config.childKind, id);
    if (!child) {
      blockers.push({
        kind: config.childKind,
        id,
        reason: `required ${config.childKind}/${id} is missing`
      });
      continue;
    }
    validateHierarchyRecord(child);
    requiredChildren.push(child);
    related.push(child);
    if (child.kind === "task") {
      const requiredState = taskTerminalState(child);
      if (child.body.state !== requiredState) {
        blockers.push({
          kind: child.kind,
          id: child.id,
          reason: `required task/${child.id} must reach terminal state ${requiredState}`
        });
      }
    } else if (child.body.state !== "completed" || child.body.completion_disposition !== config.childSuccessDisposition) {
      blockers.push({
        kind: child.kind,
        id: child.id,
        reason: `required ${child.kind}/${child.id} must complete with ${config.childSuccessDisposition}`
      });
    }
  }
  if (parent.kind === "feature") {
    for (const dependency of parent.body.depends_on_features) {
      const upstream = tx.get("feature", dependency.feature);
      if (!upstream) {
        blockers.push({
          kind: "feature",
          id: dependency.feature,
          reason: `dependency feature/${dependency.feature} is missing`
        });
        continue;
      }
      validateHierarchyRecord(upstream);
      related.push(upstream);
      if (upstream.body.state !== "completed" || upstream.body.completion_disposition !== "delivered") {
        blockers.push({
          kind: "feature",
          id: upstream.id,
          reason: `dependency feature/${upstream.id} must complete with delivered`
        });
      }
    }
  }
  const eligible = blockers.length === 0;
  const targetParent = {
    ...parent,
    version: parent.body.state === "completed" ? parent.version : parent.version + 1,
    body: {
      ...parent.body,
      state: "completed",
      completion_disposition: config.successDisposition
    }
  };
  return {
    eligible,
    blockers,
    requiredChildren,
    relationshipVersions: uniqueRecords(related).map((record2) => relationshipVersion(record2)).sort((left, right) => left.kind.localeCompare(right.kind) || left.id.localeCompare(right.id)),
    closureRef: eligible ? parentClosureRef(
      targetParent,
      requiredChildren.map(closureChildIdentity)
    ) : null
  };
}
function createCandidate(command2) {
  return {
    kind: command2.recordKind,
    id: command2.recordId,
    subject: null,
    version: 1,
    body: command2.payload.body
  };
}
function updateCandidate(current, body) {
  return { ...current, version: current.version + 1, body };
}
function requireProposalBody(body) {
  if (body.state !== "proposed" || body.completion_disposition !== null) {
    fail11("INVALID_INPUT", "new parent records must begin proposed without a completion disposition");
  }
  if (body.hold !== null) {
    fail11("INVALID_INPUT", "new parent proposals must record holds through the hold command");
  }
}
function handleEpicCreate(current, tx, command2, authority, runtime) {
  if (current !== null) fail11("VERSION_CONFLICT", `epic/${command2.recordId} exists`);
  const body = command2.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  requireAllowedAuthority(
    command2,
    authority,
    ["operator", body.scope_authority],
    "epic.create requires the operator or delegated Epic scope authority"
  );
  const direction = runtime.direction(body.direction_ref);
  const candidate = createCandidate(command2);
  assertDirectionAligned(candidate, direction);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command2, related, {
    basisRefs: [directionBasis(direction)]
  });
  return body;
}
function handleFeatureCreate(current, tx, command2, authority) {
  if (current !== null) fail11("VERSION_CONFLICT", `feature/${command2.recordId} exists`);
  const body = command2.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  requireAllowedAuthority(
    command2,
    authority,
    [body.owner, body.scope_authority],
    "feature.create requires the pack owner or delegated pack authority"
  );
  const epic = tx.get("epic", body.epic_id);
  if (!epic) fail11("EVIDENCE_GAP", `epic/${body.epic_id} does not exist`);
  requireActive(epic, `epic/${epic.id}`);
  const candidate = createCandidate(command2);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command2, related);
  return body;
}
function handleRequirementCreate(current, tx, command2, authority) {
  if (current !== null) fail11("VERSION_CONFLICT", `requirement/${command2.recordId} exists`);
  const body = command2.payload.body;
  requireProposalBody(body);
  requireKnownParentRoles(body, authority);
  const feature = tx.get("feature", body.feature_id);
  if (!feature) fail11("EVIDENCE_GAP", `feature/${body.feature_id} does not exist`);
  requireActive(feature, `feature/${feature.id}`);
  requireAllowedAuthority(
    command2,
    authority,
    [feature.body.owner, feature.body.scope_authority],
    "requirement.create requires the Feature owner or delegated pack authority"
  );
  const candidate = createCandidate(command2);
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, null, body, command2, related);
  return body;
}
function requireParentUpdateAuthority(tx, current, command2, authority, changes, runtime) {
  const changed = new Set(Object.keys(changes));
  const hasPriority = changed.delete("priority");
  const hasScope = [...changed].some((key2) => SCOPE_FIELDS[current.kind].has(key2));
  const hasDescription = [...changed].some((key2) => key2 === "title");
  if (current.kind === "epic") {
    if (hasPriority) {
      if (command2.actor.role === "operator") {
        requireHostActionGrant(command2, authority, command2.kind);
      } else {
        const direction = runtime.direction(current.body.direction_ref);
        if (!hasHostActionGrantForBasis(
          command2,
          authority,
          command2.kind,
          directionBasis(direction)
        )) {
          fail11(
            "AUTHORITY_REQUIRED",
            "Epic priority requires the operator or an explicit Current Goal steward grant"
          );
        }
      }
    }
    if (hasScope) {
      requireNamedAuthority(
        tx,
        command2,
        authority,
        command2.kind,
        current.body.scope_authority
      );
    }
  } else if (current.kind === "feature") {
    const epic = tx.get("epic", current.body.epic_id);
    if (!epic) fail11("EVIDENCE_GAP", `epic/${current.body.epic_id} does not exist`);
    if (hasPriority || hasScope) {
      requireAllowedAuthority(
        command2,
        authority,
        [epic.body.owner],
        "Feature scope and priority require the Epic steward"
      );
    }
  } else {
    const feature = tx.get("feature", current.body.feature_id);
    if (!feature) fail11("EVIDENCE_GAP", `feature/${current.body.feature_id} does not exist`);
    if (hasPriority || hasScope) {
      requireAllowedAuthority(
        command2,
        authority,
        [feature.body.owner],
        "Requirement scope and priority require the Feature owner"
      );
    }
  }
  if (hasDescription) {
    requireNamedAuthority(tx, command2, authority, command2.kind, current.body.owner);
  }
}
function handleParentUpdate(current, tx, command2, authority, runtime) {
  if (current.body.state === "completed") {
    fail11("INVALID_INPUT", `${current.kind}/${current.id} is completed and immutable`);
  }
  const changes = command2.payload.changes;
  requireParentUpdateAuthority(tx, current, command2, authority, changes, runtime);
  const next = {
    ...current.body,
    ...changes,
    updated_at: command2.payload.at
  };
  requireKnownParentRoles(next, authority);
  const candidate = updateCandidate(current, next);
  let basisRefs = [];
  if (current.kind === "epic" && Object.hasOwn(changes, "direction_ref")) {
    const direction = runtime.direction(candidate.body.direction_ref);
    assertDirectionAligned(candidate, direction);
    basisRefs = [directionBasis(direction)];
  }
  const related = assertParentRelationships(tx, candidate);
  appendMutationEvent(tx, current, next, command2, related, { basisRefs });
  return next;
}
function activationAuthority(tx, current, command2, authority) {
  if (current.kind === "epic") {
    requireAllowedAuthority(
      command2,
      authority,
      [current.body.scope_authority],
      "Epic activation requires its scope authority"
    );
    return;
  }
  if (current.kind === "feature") {
    const epic = tx.get("epic", current.body.epic_id);
    if (!epic) fail11("EVIDENCE_GAP", `epic/${current.body.epic_id} does not exist`);
    requireAllowedAuthority(
      command2,
      authority,
      [epic.body.owner],
      "Feature activation requires the Epic steward"
    );
    return;
  }
  const feature = tx.get("feature", current.body.feature_id);
  if (!feature) fail11("EVIDENCE_GAP", `feature/${current.body.feature_id} does not exist`);
  requireAllowedAuthority(
    command2,
    authority,
    [feature.body.owner],
    "Requirement activation requires the Feature owner"
  );
}
function handleParentActivate(current, tx, command2, authority, runtime) {
  if (current.body.state !== "proposed") {
    fail11("INVALID_INPUT", `${current.kind}.activate requires a proposed parent`);
  }
  requireNoHold(current, `${current.kind}/${current.id}`);
  requireKnownParentRoles(current.body, authority);
  activationAuthority(tx, current, command2, authority);
  const next = {
    ...current.body,
    state: "active",
    updated_at: command2.payload.at
  };
  const candidate = updateCandidate(current, next);
  const direction = directionForRecord(tx, candidate, runtime);
  const related = [
    ...assertParentRelationships(tx, candidate),
    ...assertAlignedAncestors(tx, candidate, direction)
  ];
  appendMutationEvent(tx, current, next, command2, related, {
    basisRefs: [directionBasis(direction)]
  });
  return next;
}
function requireOwnerOrScope(current, command2, authority) {
  requireAnyNamedAuthority(
    null,
    command2,
    authority,
    command2.kind,
    [current.body.owner, current.body.scope_authority]
  );
}
function handleParentHold(current, tx, command2, authority) {
  if (current.body.state === "completed") {
    fail11("INVALID_INPUT", "completed parents cannot be placed on hold");
  }
  if (current.body.hold !== null) {
    fail11("INVALID_INPUT", `${current.kind}/${current.id} already has a hold`);
  }
  requireOwnerOrScope(current, command2, authority);
  const next = {
    ...current.body,
    hold: {
      reason: command2.payload.reason,
      set_by: command2.actor,
      set_at: command2.payload.at,
      release_condition: command2.payload.releaseCondition,
      basis_refs: command2.payload.basisRefs
    },
    updated_at: command2.payload.at
  };
  appendMutationEvent(tx, current, next, command2, parentContext(tx, current), {
    basisRefs: command2.payload.basisRefs
  });
  return next;
}
function handleParentRelease(current, tx, command2, authority) {
  if (current.body.state === "completed") {
    fail11("INVALID_INPUT", "completed parents cannot release holds");
  }
  if (current.body.hold === null) {
    fail11("INVALID_INPUT", `${current.kind}/${current.id} has no hold to release`);
  }
  if (command2.payload.basisRefs.length === 0) {
    fail11("EVIDENCE_GAP", "hold release requires evidence basis references");
  }
  requireOwnerOrScope(current, command2, authority);
  const next = {
    ...current.body,
    hold: null,
    updated_at: command2.payload.at
  };
  appendMutationEvent(tx, current, next, command2, parentContext(tx, current), {
    basisRefs: command2.payload.basisRefs,
    extra: { releaseConditionMet: command2.payload.conditionMet }
  });
  return next;
}
function handleParentComplete(current, tx, command2, authority, runtime) {
  if (current.body.state !== "active") {
    fail11("INVALID_INPUT", `${current.kind}.complete requires an active parent`);
  }
  requireAllowedAuthority(
    command2,
    authority,
    [current.body.completion_authority],
    `${current.kind}.complete requires its declared completion authority`
  );
  const config = PARENT_CONFIG[current.kind];
  const successful = command2.payload.disposition === config.successDisposition;
  let related = parentContext(tx, current);
  let closureRef = null;
  let basisRefs = command2.payload.basisRefs;
  if (successful) {
    requireNoHold(current, `${current.kind}/${current.id}`);
    const direction = directionForRecord(tx, current, runtime);
    related = [
      ...related,
      ...assertParentRelationships(tx, current),
      ...assertAlignedAncestors(tx, current, direction)
    ];
    basisRefs = [...basisRefs, directionBasis(direction)];
    const eligibility = closureEligibility(tx, current);
    if (!eligibility.eligible) {
      fail11("EVIDENCE_GAP", eligibility.blockers[0].reason);
    }
    closureRef = eligibility.closureRef;
    if (command2.payload.closureRef !== closureRef) {
      fail11(
        "VERSION_CONFLICT",
        `${current.kind}/${current.id} closure reference does not match current child versions`
      );
    }
    related.push(...eligibility.requiredChildren);
    for (const version of eligibility.relationshipVersions) {
      const record2 = tx.get(version.kind, version.id);
      if (record2) related.push(record2);
    }
  } else if (Object.hasOwn(command2.payload, "closureRef")) {
    fail11(
      "INVALID_INPUT",
      "cancelled and superseded completion must not claim a successful closure reference"
    );
  }
  const next = {
    ...current.body,
    state: "completed",
    completion_disposition: command2.payload.disposition,
    updated_at: command2.payload.at
  };
  appendMutationEvent(tx, current, next, command2, related, {
    basisRefs,
    extra: {
      closureRef,
      disposition: command2.payload.disposition
    }
  });
  return next;
}
var parentHandlers = /* @__PURE__ */ new Map([
  ["epic.create", handleEpicCreate],
  ["epic.update", handleParentUpdate],
  ["epic.activate", handleParentActivate],
  ["epic.hold", handleParentHold],
  ["epic.release", handleParentRelease],
  ["epic.complete", handleParentComplete],
  ["feature.create", handleFeatureCreate],
  ["feature.update", handleParentUpdate],
  ["feature.activate", handleParentActivate],
  ["feature.hold", handleParentHold],
  ["feature.release", handleParentRelease],
  ["feature.complete", handleParentComplete],
  ["requirement.create", handleRequirementCreate],
  ["requirement.update", handleParentUpdate],
  ["requirement.activate", handleParentActivate],
  ["requirement.hold", handleParentHold],
  ["requirement.release", handleParentRelease],
  ["requirement.complete", handleParentComplete]
]);

// src/core/lib/coordination-runtime/task-engine.mjs
import { randomUUID as randomUUID2 } from "node:crypto";
var GRANTABLE_STATES = /* @__PURE__ */ new Set([
  "ready",
  "in-progress",
  "in-review",
  "release-ready",
  "deploying",
  "production-verification"
]);
var SHIP_STATES = /* @__PURE__ */ new Set([
  "release-ready",
  "deploying",
  "production-verification"
]);
var ALLOWED_TRANSITIONS = /* @__PURE__ */ new Map([
  ["proposed", /* @__PURE__ */ new Set(["dropped"])],
  ["ready", /* @__PURE__ */ new Set(["blocked", "dropped"])],
  ["in-progress", /* @__PURE__ */ new Set(["in-review", "blocked", "dropped"])],
  ["in-review", /* @__PURE__ */ new Set(["in-progress", "completed", "release-ready", "blocked", "dropped"])],
  ["release-ready", /* @__PURE__ */ new Set(["deploying", "blocked", "dropped"])],
  ["deploying", /* @__PURE__ */ new Set(["production-verification", "blocked", "dropped"])],
  ["production-verification", /* @__PURE__ */ new Set(["shipped", "blocked", "dropped"])],
  ["blocked", /* @__PURE__ */ new Set(["dropped"])],
  ["completed", /* @__PURE__ */ new Set()],
  ["shipped", /* @__PURE__ */ new Set()],
  ["dropped", /* @__PURE__ */ new Set()]
]);
function fail12(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}
function requireKnownTaskRoles(body, authority) {
  for (const [label, role] of [
    ["scope authority", body.scope_authority],
    ["completion authority", body.completion_authority],
    ["next role", body.next_role],
    ["producer", body.producer_actor?.role ?? null],
    ["acceptance actor", body.acceptance_actor?.role ?? null]
  ]) {
    if (role !== null) requireRoleAvailable(role, authority, label);
  }
  for (const requirement of body.review_requirements) {
    requireRoleAvailable(requirement.role, authority, "review requirement");
  }
}
function taskRecord(body, version = 1) {
  return {
    kind: "task",
    id: body.id,
    subject: null,
    version,
    body
  };
}
function assertCurrentAlignment(tx, task, runtime) {
  const feature = tx.get("feature", task.body.feature_id);
  if (!feature) {
    fail12("EVIDENCE_GAP", `task/${task.id} has no current Feature ancestor`);
  }
  const epic = tx.get("epic", feature.body.epic_id);
  if (!epic) {
    fail12("EVIDENCE_GAP", `feature/${feature.id} has no current Epic ancestor`);
  }
  return assertAlignedAncestors(tx, task, runtime.direction(epic.body.direction_ref));
}
function alignmentFailure(tx, task, runtime) {
  try {
    assertCurrentAlignment(tx, task, runtime);
    return null;
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "EVIDENCE_GAP") return error;
    throw error;
  }
}
function taskStateSatisfies(task, requirement) {
  if (requirement === "in-review") {
    return (/* @__PURE__ */ new Set([
      "in-review",
      "completed",
      "release-ready",
      "deploying",
      "production-verification",
      "shipped"
    ])).has(task.body.state);
  }
  if (requirement === "completed") {
    return task.body.delivery_class === "knowledge" && task.body.state === "completed";
  }
  if (requirement === "release-ready") {
    return task.body.delivery_class !== "knowledge" && (/* @__PURE__ */ new Set([
      "release-ready",
      "deploying",
      "production-verification",
      "shipped"
    ])).has(task.body.state);
  }
  return task.body.delivery_class !== "knowledge" && task.body.state === "shipped";
}
function dependencyStatus(tx, task) {
  const pending = [];
  const failed = [];
  for (const dependency of task.body.depends_on) {
    const upstream = tx.get("task", dependency.task);
    if (!upstream) {
      fail12(
        "EVIDENCE_GAP",
        `dependency task/${dependency.task} does not exist`
      );
    }
    if (upstream.body.state === "dropped") {
      failed.push(dependency.task);
    } else if (!taskStateSatisfies(upstream, dependency.requires)) {
      pending.push(dependency.task);
    }
  }
  return { pending, failed };
}
function assertNoDependencyCycle(tx, candidate) {
  const all = new Map(tx.list("task").map((record2) => [record2.id, record2.body]));
  all.set(candidate.id, candidate);
  const visiting = /* @__PURE__ */ new Set();
  const visited = /* @__PURE__ */ new Set();
  const visit = (id) => {
    if (visiting.has(id)) fail12("INVALID_INPUT", `dependency cycle includes task/${id}`);
    if (visited.has(id)) return;
    const task = all.get(id);
    if (!task) return;
    visiting.add(id);
    for (const dependency of task.depends_on) visit(dependency.task);
    visiting.delete(id);
    visited.add(id);
  };
  visit(candidate.id);
}
function touchPrefix(touch) {
  const normalized2 = touch.replaceAll("\\", "/").toLowerCase();
  const segments = normalized2.split("/");
  if (segments.includes("..") || normalized2.startsWith("/") || /^[a-z]:/.test(normalized2)) {
    return { prefix: "", wildcard: true };
  }
  const path4 = segments.filter((segment) => segment !== "" && segment !== ".").join("/");
  const wildcard = path4.search(/[*?[\]{}()!+@]/);
  return {
    prefix: wildcard === -1 ? path4 : path4.slice(0, wildcard),
    wildcard: wildcard !== -1 || normalized2.endsWith("/")
  };
}
function touchesOverlap(left, right) {
  for (const leftTouch of left) {
    for (const rightTouch of right) {
      const left2 = touchPrefix(leftTouch);
      const right2 = touchPrefix(rightTouch);
      if (left2.prefix === right2.prefix) return true;
      if ((left2.wildcard || right2.wildcard) && (left2.prefix.startsWith(right2.prefix) || right2.prefix.startsWith(left2.prefix))) return true;
    }
  }
  return false;
}
function requireNoTouchConflict(tx, task) {
  for (const other of tx.list("task")) {
    if (other.id === task.id || !leaseIsLive(other.body.lease)) continue;
    if (touchesOverlap(task.body.touches, other.body.touches)) {
      fail12(
        "LEASE_CONFLICT",
        `task/${task.id} touch set conflicts with active task/${other.id}`
      );
    }
  }
}
function requireNoOpenQuestions(task) {
  if (task.body.waiting_on_questions.length > 0) {
    fail12(
      "EVIDENCE_GAP",
      `task/${task.id} has unanswered blocking questions`
    );
  }
}
function requireImmutableSubject(task) {
  if (task.body.change_ref === null) {
    fail12("EVIDENCE_GAP", `task/${task.id} has no immutable change subject`);
  }
}
function requireTransition(tx, task, command2, authority, to) {
  const from = task.body.state;
  if (!ALLOWED_TRANSITIONS.get(from)?.has(to)) {
    fail12("INVALID_INPUT", `task lifecycle does not allow ${from} -> ${to}`);
  }
  if (task.body.lease !== null && !leaseIsLive(task.body.lease)) {
    fail12("RECOVERY_REQUIRED", `task/${task.id} lease expired and must be reconciled`);
  }
  if (to !== "blocked" && to !== "dropped") requireNoOpenQuestions(task);
  const dependencies2 = dependencyStatus(tx, task);
  if (dependencies2.failed.length > 0 && to !== "blocked" && to !== "dropped") {
    fail12(
      "RECOVERY_REQUIRED",
      `task/${task.id} has failed dependencies: ${dependencies2.failed.join(", ")}`
    );
  }
  if (dependencies2.pending.length > 0 && to !== "blocked" && to !== "dropped") {
    fail12(
      "EVIDENCE_GAP",
      `task/${task.id} has pending dependencies: ${dependencies2.pending.join(", ")}`
    );
  }
  if (to === "ready") {
    requireNamedAuthority(
      tx,
      command2,
      authority,
      "task.promote",
      task.body.scope_authority
    );
    return null;
  }
  if (to === "dropped") {
    requireNamedAuthority(
      tx,
      command2,
      authority,
      "task.transition",
      task.body.scope_authority
    );
    return null;
  }
  requireActingAuthority(tx, task, command2, authority, "task.transition");
  if (to === "in-review") {
    if (!sameActor(command2.actor, task.body.producer_actor)) {
      fail12("AUTHORITY_REQUIRED", "only the producing actor may submit its work for review");
    }
    requireImmutableSubject(task);
  }
  if (to === "completed") {
    if (task.body.delivery_class !== "knowledge") {
      fail12("INVALID_INPUT", "completed is reserved for knowledge Tasks");
    }
    requireImmutableSubject(task);
    requireReviews(tx, task);
    return completionApproval(tx, task);
  }
  if (to === "release-ready") {
    if (task.body.delivery_class === "knowledge") {
      fail12("INVALID_INPUT", "knowledge Tasks do not enter release-ready");
    }
    if (command2.actor.role !== "workflow-ship") {
      fail12("AUTHORITY_REQUIRED", "workflow-ship owns release readiness");
    }
    requireImmutableSubject(task);
    requireReviews(tx, task);
    const approval = completionApproval(tx, task);
    requireReleaseEvidence(tx, task);
    return approval;
  }
  if (to === "deploying") {
    if (command2.actor.role !== "workflow-ship") {
      fail12("AUTHORITY_REQUIRED", "workflow-ship owns deployment recording");
    }
    requireOperatorApproval(tx, task, "operator-deploy-start");
  }
  if (to === "production-verification") {
    if (command2.actor.role !== "workflow-ship") {
      fail12("AUTHORITY_REQUIRED", "workflow-ship owns deployment recording");
    }
    requireOperatorApproval(tx, task, "operator-deploy-complete");
    requireDeploymentEvidence(tx, task, "deployment");
  }
  if (to === "shipped") {
    if (command2.actor.role !== "workflow-ship") {
      fail12("AUTHORITY_REQUIRED", "workflow-ship owns shipment recording");
    }
    requireDeploymentEvidence(tx, task, "deployment");
    requireDeploymentEvidence(tx, task, "production-verification");
  }
  return null;
}
function transitionBody(tx, task, command2, authority, runtime, to, at) {
  if (to !== "blocked" && to !== "dropped" || hasStaleDirection(tx, task, runtime.direction)) {
    assertCurrentAlignment(tx, task, runtime);
  }
  const candidate = to === "in-review" ? {
    ...task,
    body: {
      ...task.body,
      change_ref: command2.payload.subject
    }
  } : task;
  const approval = requireTransition(tx, candidate, command2, authority, to);
  let nextRole = task.body.next_role;
  if (to === "in-progress") {
    nextRole = task.body.producer_actor?.role ?? task.body.next_role;
  } else if (to === "in-review") {
    nextRole = task.body.review_requirements[0]?.role ?? task.body.completion_authority;
  } else if (to === "release-ready") {
    nextRole = "operator";
  } else if (to === "deploying" || to === "production-verification") {
    nextRole = "workflow-ship";
  } else if (TASK_TERMINAL_STATES.has(to)) {
    nextRole = null;
  }
  retireLeaseGrants(tx, task, "revoked");
  return {
    ...task.body,
    state: to,
    resume_state: to === "blocked" ? task.body.state : null,
    acceptance_actor: approval?.authority ?? task.body.acceptance_actor,
    next_role: nextRole,
    change_ref: to === "in-review" ? command2.payload.subject : task.body.change_ref,
    lease: null,
    updated_at: at
  };
}
function putMessage(tx, task, command2, {
  messageId,
  parentId,
  recipient,
  kind,
  createdAt,
  content,
  artifactRefs,
  evidenceRefs,
  provenance
}, basisVersion = task.version + 1) {
  if (tx.get("message", messageId)) {
    fail12("OPERATION_CONFLICT", `message/${messageId} already exists`);
  }
  if (parentId !== null) {
    const parent = tx.get("message", parentId);
    if (!parent) fail12("INVALID_INPUT", `parent message/${parentId} does not exist`);
    if (!subjectEquals(parent.subject, { kind: task.kind, id: task.id })) {
      fail12("INVALID_INPUT", `parent message/${parentId} belongs to another hierarchy subject`);
    }
  }
  const body = {
    schema_version: 1,
    message_id: messageId,
    subject: { kind: task.kind, id: task.id },
    thread_id: subjectRef({ kind: task.kind, id: task.id }, basisVersion),
    parent_id: parentId,
    sender_role: command2.actor.role,
    sender_run: command2.actor.runId,
    recipient,
    kind,
    created_at: createdAt,
    basis_version: basisVersion,
    payload: content,
    artifact_refs: artifactRefs,
    evidence_refs: evidenceRefs,
    provenance
  };
  tx.put({
    kind: "message",
    id: messageId,
    subject: body.subject,
    version: 1,
    body
  });
  return body;
}
function handleTaskCreate(current, tx, command2, authority, runtime) {
  if (current !== null) fail12("VERSION_CONFLICT", `task/${command2.recordId} exists`);
  const body = command2.payload.body;
  if (body.state !== "proposed") {
    fail12("INVALID_INPUT", "new Tasks must begin proposed");
  }
  assertCurrentAlignment(tx, taskRecord(body), runtime);
  requireActionGrant(tx, command2, authority, "task.create");
  requireKnownTaskRoles(body, authority);
  if (body.producer_actor && sameActor(body.producer_actor, body.acceptance_actor)) {
    fail12("AUTHORITY_REQUIRED", "the producer cannot be the acceptance actor");
  }
  assertNoDependencyCycle(tx, body);
  return body;
}
function handleTaskUpdate(current, tx, command2, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireActingAuthority(tx, current, command2, authority, "task.update");
  const changes = Object.hasOwn(command2.payload, "changes") ? command2.payload.changes : { title: command2.payload.title };
  const next = { ...current.body, ...changes };
  const acceptedState = current.body.state === "blocked" ? current.body.resume_state : current.body.state;
  if ((TASK_TERMINAL_STATES.has(acceptedState) || SHIP_STATES.has(acceptedState)) && criteriaRef({ ...current, body: next }, (kind, id) => tx.get(kind, id)) !== criteriaRef(current, (kind, id) => tx.get(kind, id))) {
    fail12("INVALID_INPUT", "accepted criteria are frozen; record changed requirements as new work");
  }
  if (current.body.recovery_hold !== null && Object.hasOwn(changes, "next_role")) {
    fail12("AUTHORITY_REQUIRED", "operator resolution must release the recovery routing hold");
  }
  requireKnownTaskRoles(next, authority);
  assertNoDependencyCycle(tx, next);
  if (current.body.lease !== null && Object.hasOwn(changes, "touches")) {
    requireNoTouchConflict(tx, { ...current, body: next });
  }
  return next;
}
function handleTaskPromote(current, tx, command2, authority, runtime) {
  if (current.body.state !== "proposed") {
    fail12("INVALID_INPUT", "task.promote requires a proposed task");
  }
  assertCurrentAlignment(tx, current, runtime);
  requireKnownTaskRoles(current.body, authority);
  requireNamedAuthority(
    tx,
    command2,
    authority,
    "task.promote",
    current.body.scope_authority
  );
  dependencyStatus(tx, current);
  return {
    ...current.body,
    state: "ready",
    updated_at: command2.payload.at
  };
}
function createPersistedGrant(tx, task, command2, holder, actions, acquiredAt, expiresAt, token) {
  const grantId = randomUUID2();
  tx.put({
    kind: "grant",
    id: grantId,
    subject: { kind: "task", id: task.id },
    version: 1,
    body: {
      schema_version: 1,
      grant_id: grantId,
      subject: { kind: "task", id: task.id },
      actor: holder,
      actions,
      record_kind: "task",
      record_id: task.id,
      basis_ref: subjectRef({ kind: "task", id: task.id }, task.version),
      lease_token: token,
      issued_by: command2.actor,
      created_at: acquiredAt,
      expires_at: expiresAt,
      status: "active"
    }
  });
  return grantId;
}
function retireLeaseGrants(tx, task, status) {
  if (task.body.lease === null) return;
  for (const record2 of tx.list("grant", { kind: "task", id: task.id })) {
    if (record2.body.lease_token === task.body.lease.token && record2.body.status === "active") {
      tx.put({ ...record2, version: record2.version + 1, body: { ...record2.body, status } });
    }
  }
}
function withProducer(body, actor) {
  const history = [...body.producing_actors];
  for (const producer of [body.producer_actor, actor]) {
    if (producer && !history.some((previous) => sameActor(previous, producer))) history.push(producer);
  }
  return { producer_actor: actor, producing_actors: history };
}
function handleTaskGrant(current, tx, command2, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireActionGrant(tx, command2, authority, "task.grant");
  requireKnownTaskRoles(current.body, authority);
  if (current.body.recovery_hold !== null) {
    fail12("AUTHORITY_REQUIRED", "operator resolution is required before regrant");
  }
  if (current.body.lease !== null) {
    if (leaseIsLive(current.body.lease)) {
      fail12("LEASE_CONFLICT", `task/${current.id} already has a live lease`);
    }
    fail12(
      "RECOVERY_REQUIRED",
      `task/${current.id} has an expired lease that must be reconciled`
    );
  }
  if (!GRANTABLE_STATES.has(current.body.state)) {
    fail12("INVALID_INPUT", `task/${current.id} cannot be granted from ${current.body.state}`);
  }
  requireRoleAvailable(command2.payload.holder.role, authority, "lease holder");
  if (command2.payload.holder.role === "operator") {
    fail12("INVALID_INPUT", "operator is a reserved endpoint and cannot hold a lease");
  }
  if (current.body.next_role !== null && current.body.next_role !== command2.payload.holder.role) {
    fail12(
      "AUTHORITY_REQUIRED",
      `task/${current.id} is routed to ${current.body.next_role}`
    );
  }
  if (Date.parse(command2.payload.expiresAt) <= Date.now()) {
    fail12("INVALID_INPUT", "a new lease must expire in the future");
  }
  requireNoOpenQuestions(current);
  const dependencies2 = dependencyStatus(tx, current);
  if (dependencies2.failed.length > 0) {
    return {
      ...current.body,
      state: "blocked",
      resume_state: current.body.state,
      lease: null,
      updated_at: command2.payload.acquiredAt
    };
  }
  if (dependencies2.pending.length > 0) {
    fail12(
      "EVIDENCE_GAP",
      `task/${current.id} has pending dependencies: ${dependencies2.pending.join(", ")}`
    );
  }
  requireNoTouchConflict(tx, current);
  const token = randomUUID2();
  createPersistedGrant(
    tx,
    current,
    command2,
    command2.payload.holder,
    command2.payload.actions,
    command2.payload.acquiredAt,
    command2.payload.expiresAt,
    token
  );
  return {
    ...current.body,
    state: current.body.state === "ready" ? "in-progress" : current.body.state,
    ...current.body.state === "ready" || current.body.state === "in-progress" ? withProducer(current.body, command2.payload.holder) : {},
    next_role: command2.payload.holder.role,
    lease: {
      holder: command2.payload.holder,
      token,
      version_at_grant: current.version,
      acquired_at: command2.payload.acquiredAt,
      expires_at: command2.payload.expiresAt
    },
    updated_at: command2.payload.acquiredAt
  };
}
function handleTaskTransition(current, tx, command2, authority, runtime) {
  return transitionBody(
    tx,
    current,
    command2,
    authority,
    runtime,
    command2.payload.to,
    command2.payload.at
  );
}
function handleTaskHandoff(current, tx, command2, authority, runtime) {
  const staleDirection = hasStaleDirection(tx, current, runtime.direction);
  if (staleDirection) {
    requireLeasedActingAuthority(tx, current, command2, authority, "task.handoff");
    if (command2.payload.state !== null) {
      fail12(
        "AUTHORITY_REQUIRED",
        `Direction-stale task/${current.id} handoff must preserve execution state`
      );
    }
    if (!(/* @__PURE__ */ new Set([current.body.scope_authority, "operator"])).has(command2.payload.toRole)) {
      fail12(
        "AUTHORITY_REQUIRED",
        `Direction-stale task/${current.id} may hand off only to a safe owner`
      );
    }
  } else {
    requireActingAuthority(tx, current, command2, authority, "task.handoff");
  }
  if (current.body.recovery_hold !== null) {
    fail12("AUTHORITY_REQUIRED", "operator resolution is required before handoff");
  }
  requireRoleAvailable(command2.payload.toRole, authority, "handoff recipient");
  let next = current.body;
  if (command2.payload.state !== null) {
    next = transitionBody(
      tx,
      current,
      command2,
      authority,
      runtime,
      command2.payload.state,
      command2.payload.createdAt
    );
  } else if (!staleDirection) {
    const alignment = alignmentFailure(tx, current, runtime);
    if (alignment && !(/* @__PURE__ */ new Set([current.body.scope_authority, "operator"])).has(command2.payload.toRole)) {
      fail12(
        "AUTHORITY_REQUIRED",
        `Direction-stale task/${current.id} may hand off only to a safe owner`
      );
    }
  }
  putMessage(tx, current, command2, {
    messageId: command2.payload.messageId,
    parentId: command2.payload.parentId,
    recipient: command2.payload.toRole,
    kind: "handoff",
    createdAt: command2.payload.createdAt,
    content: command2.payload.content,
    artifactRefs: command2.payload.artifactRefs,
    evidenceRefs: command2.payload.evidenceRefs,
    provenance: command2.payload.provenance
  });
  retireLeaseGrants(tx, current, "revoked");
  return {
    ...next,
    next_role: command2.payload.toRole,
    lease: null,
    updated_at: command2.payload.createdAt
  };
}
function requireRestorationAuthority(task, command2, authority) {
  requireHostActionGrant(command2, authority, "task.restore");
  if (SHIP_STATES.has(task.body.resume_state) && command2.actor.role !== "workflow-ship") {
    fail12("AUTHORITY_REQUIRED", `workflow-ship must restore ${task.body.resume_state}`);
  }
}
function handleTaskRestore(current, tx, command2, authority, runtime) {
  assertCurrentAlignment(tx, current, runtime);
  requireRestorationAuthority(current, command2, authority);
  if (current.body.state !== "blocked" || current.body.resume_state === null) {
    fail12("INVALID_INPUT", "task.restore requires a blocked task with resume_state");
  }
  const resolution = current.body.recovery_hold !== null ? recoveryResolution(tx, current, command2.payload.recoveryApprovalId) : null;
  if (resolution) requireRoleAvailable(resolution.recovery.resume_role, authority, "recovery recipient");
  if (!resolution && command2.payload.recoveryApprovalId) {
    fail12("INVALID_INPUT", "task has no recovery hold to resolve");
  }
  if (current.body.lease !== null) {
    fail12("RECOVERY_REQUIRED", "the blocked reservation must be reconciled before restoration");
  }
  requireNoOpenQuestions(current);
  const dependencies2 = dependencyStatus(tx, current);
  if (dependencies2.failed.length > 0) {
    fail12(
      "RECOVERY_REQUIRED",
      `task/${current.id} still has failed dependencies`
    );
  }
  if (dependencies2.pending.length > 0) {
    fail12(
      "EVIDENCE_GAP",
      `task/${current.id} still has pending dependencies`
    );
  }
  if (TASK_NEEDS_CHANGE_REF.has(current.body.resume_state) && current.body.change_ref === null) {
    fail12(
      "EVIDENCE_GAP",
      `task/${current.id} cannot restore ${current.body.resume_state} without a change subject`
    );
  }
  return {
    ...current.body,
    state: current.body.resume_state,
    resume_state: null,
    recovery_hold: null,
    next_role: resolution?.recovery.resume_role ?? current.body.next_role,
    updated_at: command2.payload.at
  };
}
function handleQuestionOpen(current, tx, command2, authority, runtime) {
  const task = current.kind === "task";
  if (task) {
    assertCurrentAlignment(tx, current, runtime);
    requireActingAuthority(tx, current, command2, authority, "question.open");
  } else {
    requireActionGrant(tx, command2, authority, "question.open");
  }
  if (task && TASK_TERMINAL_STATES.has(current.body.state)) {
    fail12("INVALID_INPUT", "terminal Tasks cannot open questions");
  }
  if (command2.payload.kind !== "question") {
    fail12("INVALID_INPUT", 'question.open message kind must be "question"');
  }
  requireRoleAvailable(command2.payload.recipient, authority, "question recipient");
  if (command2.payload.recipient === "operator" && command2.payload.content.questionKind === "fact") {
    fail12(
      "AUTHORITY_REQUIRED",
      "fact questions must be addressed to the real role that owns the fact"
    );
  }
  if (tx.get("question", command2.payload.questionId)) {
    fail12(
      "OPERATION_CONFLICT",
      `question/${command2.payload.questionId} already exists`
    );
  }
  const message = putMessage(tx, current, command2, {
    messageId: command2.payload.messageId,
    parentId: command2.payload.parentId,
    recipient: command2.payload.recipient,
    kind: "question",
    createdAt: command2.payload.createdAt,
    content: command2.payload.content,
    artifactRefs: command2.payload.artifactRefs,
    evidenceRefs: command2.payload.evidenceRefs,
    provenance: command2.payload.provenance
  });
  const content = command2.payload.content;
  tx.put({
    kind: "question",
    id: command2.payload.questionId,
    subject: { kind: current.kind, id: current.id },
    version: 1,
    body: {
      schema_version: 1,
      question_id: command2.payload.questionId,
      subject: { kind: current.kind, id: current.id },
      asker: command2.actor,
      recipient: command2.payload.recipient,
      kind: content.questionKind,
      blocking: content.blocking,
      status: "open",
      context: content.context,
      ask: content.ask,
      answer_by: content.answerBy,
      opened_message_id: message.message_id,
      answer_message_ids: [],
      resolution: null
    }
  });
  if (!task || !content.blocking) {
    return { ...current.body, updated_at: command2.payload.createdAt };
  }
  retireLeaseGrants(tx, current, "revoked");
  const waiting = current.body.waiting_on_questions.includes(command2.payload.questionId) ? current.body.waiting_on_questions : [...current.body.waiting_on_questions, command2.payload.questionId];
  return {
    ...current.body,
    state: "blocked",
    resume_state: current.body.state === "blocked" ? current.body.resume_state : current.body.state,
    waiting_on_questions: waiting,
    lease: null,
    updated_at: command2.payload.createdAt
  };
}
function effectiveAnswers(tx, question, answerIds) {
  const answers = answerIds.map((id) => tx.get("message", id)?.body).filter((candidate) => candidate?.kind === "answer" && candidate.subject.kind === question.subject.kind && candidate.subject.id === question.subject.id && candidate.sender_role === question.body.recipient && candidate.recipient === question.body.asker.role && candidate.parent_id === question.body.opened_message_id && candidate.payload.status === "answered" && candidate.payload.lane === "in-lane");
  const replaced = new Set(answers.flatMap((answer) => answer.payload.resolves ?? []));
  return answers.filter((answer) => !replaced.has(answer.message_id));
}
function handleQuestionAnswer(current, tx, command2, authority, runtime) {
  const task = current.kind === "task";
  if (task) assertCurrentAlignment(tx, current, runtime);
  if (command2.payload.kind !== "answer") {
    fail12("INVALID_INPUT", 'question.answer message kind must be "answer"');
  }
  const question = tx.get("question", command2.payload.questionId);
  if (question?.subject?.kind !== current.kind || question.subject.id !== current.id) {
    fail12(
      "INVALID_INPUT",
      `question/${command2.payload.questionId} does not belong to task/${current.id}`
    );
  }
  if (command2.actor.role !== question.body.recipient) {
    fail12(
      "AUTHORITY_REQUIRED",
      `question/${question.id} is addressed to ${question.body.recipient}`
    );
  }
  if (command2.actor.role === "operator") {
    requireActionGrant(tx, command2, authority, "question.answer");
  } else {
    requireActorAvailable(command2, authority);
  }
  if (command2.payload.recipient !== question.body.asker.role) {
    fail12("INVALID_INPUT", "answer recipient must be the original asker");
  }
  if (command2.payload.parentId !== question.body.opened_message_id) {
    fail12("INVALID_INPUT", "answer parent must be the opening question message");
  }
  if (command2.payload.content.resolves) {
    requireHostActionGrant(command2, authority, "question.answer");
    const prior = effectiveAnswers(tx, question, question.body.answer_message_ids);
    const targets = new Set(command2.payload.content.resolves);
    if (targets.size !== prior.length || prior.some((answer) => !targets.has(answer.message_id))) {
      fail12("INVALID_INPUT", "explicit question resolution must address every effective prior answer");
    }
  }
  const message = putMessage(tx, current, command2, {
    messageId: command2.payload.messageId,
    parentId: command2.payload.parentId,
    recipient: command2.payload.recipient,
    kind: "answer",
    createdAt: command2.payload.createdAt,
    content: command2.payload.content,
    artifactRefs: command2.payload.artifactRefs,
    evidenceRefs: command2.payload.evidenceRefs,
    provenance: command2.payload.provenance
  });
  const answerIds = [...question.body.answer_message_ids, message.message_id];
  const answers = effectiveAnswers(tx, question, answerIds);
  const distinctAnswers = new Set(answers.map((answer) => answer.payload.answer.trim()));
  const resolved = distinctAnswers.size === 1;
  const resolvingMessage = resolved ? answers.at(-1) : null;
  tx.put({
    ...question,
    version: question.version + 1,
    body: {
      ...question.body,
      status: resolved ? "answered" : "open",
      answer_message_ids: answerIds,
      resolution: resolved ? {
        answer: resolvingMessage.payload.answer,
        lane: "in-lane",
        provenance: resolvingMessage.provenance,
        message_id: resolvingMessage.message_id,
        answered_at: resolvingMessage.created_at,
        sender: {
          role: resolvingMessage.sender_role,
          runId: resolvingMessage.sender_run
        }
      } : null
    }
  });
  if (!task || TASK_TERMINAL_STATES.has(current.body.state)) {
    return { ...current.body, updated_at: command2.payload.createdAt };
  }
  let waiting = current.body.waiting_on_questions;
  if (question.body.blocking) {
    if (resolved) {
      waiting = waiting.filter((id) => id !== question.id);
    } else if (!waiting.includes(question.id)) {
      waiting = [...waiting, question.id];
    }
  }
  const shouldBlock = question.body.blocking && !resolved;
  const releaseLease = shouldBlock && leaseIsLive(current.body.lease);
  if (releaseLease) retireLeaseGrants(tx, current, "revoked");
  return {
    ...current.body,
    state: shouldBlock ? "blocked" : current.body.state,
    resume_state: shouldBlock && current.body.state !== "blocked" ? current.body.state : current.body.resume_state,
    waiting_on_questions: waiting,
    lease: releaseLease ? null : current.body.lease,
    updated_at: command2.payload.createdAt
  };
}
function recoveryEvidence(tx, task, command2) {
  if (command2.payload.recoveryEvidenceIds.length === 0) {
    fail12("EVIDENCE_GAP", "lease expiry alone cannot authorize recovery");
  }
  for (const id of command2.payload.recoveryEvidenceIds) {
    const record2 = tx.get("evidence", id);
    if (record2?.subject?.kind !== "task" || record2.subject.id !== task.id || record2.body.kind !== "recovery-reconciliation" || record2.body.outcome !== "passed" || record2.body.data.stale_lease_token !== task.body.lease.token || record2.body.data.disposition !== command2.payload.disposition || record2.body.data.observed !== command2.payload.observed || Date.parse(record2.body.created_at) < Date.parse(task.body.lease.expires_at)) {
      fail12(
        "EVIDENCE_GAP",
        `evidence/${id} does not reconcile the stale lease and disposition`
      );
    }
  }
}
function handleAttemptRecover(current, tx, command2, authority, runtime) {
  requireActionGrant(tx, command2, authority, "attempt.recover");
  if (TASK_TERMINAL_STATES.has(current.body.state)) {
    fail12(
      "INVALID_INPUT",
      `task/${current.id} cannot recover a lease from ${current.body.state}`
    );
  }
  if (current.body.lease === null) {
    fail12("INVALID_INPUT", `task/${current.id} has no lease to recover`);
  }
  if (leaseIsLive(current.body.lease)) {
    fail12("LEASE_CONFLICT", `task/${current.id} lease has not expired`);
  }
  recoveryEvidence(tx, current, command2);
  if (tx.get("attempt", command2.payload.attemptId) || tx.get("message", command2.payload.attemptId)) {
    fail12(
      "OPERATION_CONFLICT",
      `attempt/${command2.payload.attemptId} already exists`
    );
  }
  const staleLease = current.body.lease;
  let newLease = null;
  let state = current.body.state;
  let resumeState = current.body.resume_state;
  let nextRole = current.body.next_role;
  let producing = {};
  let recoveryHold2 = current.body.recovery_hold;
  if (command2.payload.disposition === "safe-to-resume" && recoveryHold2 !== null) {
    fail12("AUTHORITY_REQUIRED", "operator resolution is required before recovery");
  }
  if (command2.payload.disposition === "safe-to-resume" && command2.payload.redispatch !== null) {
    assertCurrentAlignment(tx, current, runtime);
    requireNoOpenQuestions(current);
    const dependencies2 = dependencyStatus(tx, current);
    if (dependencies2.failed.length > 0) {
      fail12("RECOVERY_REQUIRED", `task/${current.id} has failed dependencies`);
    }
    if (dependencies2.pending.length > 0) {
      fail12("EVIDENCE_GAP", `task/${current.id} has pending dependencies`);
    }
    if (state === "blocked") {
      requireRestorationAuthority(current, command2, authority);
      state = resumeState;
      resumeState = null;
      if (!GRANTABLE_STATES.has(state)) {
        fail12("INVALID_INPUT", "blocked lease has no resumable work state");
      }
    }
    if (TASK_NEEDS_CHANGE_REF.has(state) && current.body.change_ref === null) {
      fail12("EVIDENCE_GAP", `task/${current.id} cannot resume ${state} without an immutable subject`);
    }
    requireRoleAvailable(command2.payload.redispatch.role, authority, "recovery recipient");
    if (command2.payload.redispatch.role === "operator") {
      fail12("INVALID_INPUT", "operator cannot receive a recovery lease");
    }
    if (Date.parse(command2.payload.expiresAt) <= Date.now()) {
      fail12("INVALID_INPUT", "a recovered lease must expire in the future");
    }
    requireNoTouchConflict(tx, current);
    const token = randomUUID2();
    newLease = {
      holder: command2.payload.redispatch,
      token,
      version_at_grant: current.version,
      acquired_at: command2.payload.createdAt,
      expires_at: command2.payload.expiresAt
    };
    createPersistedGrant(
      tx,
      current,
      command2,
      command2.payload.redispatch,
      ["task.update", "task.transition", "task.handoff", "question.open"],
      command2.payload.createdAt,
      command2.payload.expiresAt,
      token
    );
    nextRole = command2.payload.redispatch.role;
    if (state === "in-progress") {
      producing = withProducer(current.body, command2.payload.redispatch);
    }
  } else if (command2.payload.disposition === "conflicting-partial-work") {
    if (state !== "blocked") {
      resumeState = state;
      state = "blocked";
    }
    nextRole = "operator";
    recoveryHold2 = command2.payload.attemptId;
  }
  retireLeaseGrants(tx, current, "recovered");
  tx.put({
    kind: "attempt",
    id: command2.payload.attemptId,
    subject: { kind: "task", id: current.id },
    version: 1,
    body: {
      schema_version: 1,
      attempt_id: command2.payload.attemptId,
      subject: { kind: "task", id: current.id },
      grantor: command2.actor,
      stale_lease: staleLease,
      observed: command2.payload.observed,
      disposition: command2.payload.disposition,
      recovery_evidence_ids: command2.payload.recoveryEvidenceIds,
      new_lease: newLease,
      created_at: command2.payload.createdAt
    }
  });
  putMessage(tx, current, command2, {
    messageId: command2.payload.attemptId,
    parentId: null,
    recipient: command2.payload.redispatch?.role ?? (command2.payload.disposition === "conflicting-partial-work" ? "operator" : current.body.next_role ?? command2.actor.role),
    kind: "recovery",
    createdAt: command2.payload.createdAt,
    content: {
      observed: command2.payload.observed,
      disposition: command2.payload.disposition,
      staleLeaseToken: staleLease.token,
      newLeaseToken: newLease?.token ?? null
    },
    artifactRefs: [],
    evidenceRefs: command2.payload.recoveryEvidenceIds,
    provenance: "durable-thread"
  });
  return {
    ...current.body,
    state,
    resume_state: resumeState,
    next_role: nextRole,
    ...producing,
    recovery_hold: recoveryHold2,
    lease: newLease,
    updated_at: command2.payload.createdAt
  };
}
var taskHandlers = /* @__PURE__ */ new Map([
  ["task.create", handleTaskCreate],
  ["task.update", handleTaskUpdate],
  ["task.promote", handleTaskPromote],
  ["task.grant", handleTaskGrant],
  ["task.transition", handleTaskTransition],
  ["task.handoff", handleTaskHandoff],
  ["task.restore", handleTaskRestore],
  ["question.open", handleQuestionOpen],
  ["question.answer", handleQuestionAnswer],
  ["attempt.recover", handleAttemptRecover]
]);

// src/core/lib/coordination-runtime/engine.mjs
function fail13(code, message, retryable = false) {
  throw new RuntimeError(code, message, retryable);
}
var handlers = new Map([
  ...parentHandlers,
  ...taskHandlers
]);
function duplicateMessageReceipt(store, command2) {
  const messageId = command2.payload?.messageId;
  if (typeof messageId !== "string") return null;
  const existing = readMessageOperation(store, messageId);
  if (!existing) return null;
  const expectedEvent = {
    kind: command2.kind,
    actor: command2.actor,
    recordKind: command2.recordKind,
    recordId: command2.recordId,
    payload: command2.payload
  };
  if (canonicalJson(existing.event) !== canonicalJson(expectedEvent)) {
    fail13(
      "OPERATION_CONFLICT",
      `message/${messageId} was already used with different content`
    );
  }
  return existing.receipt;
}
function applyCommand(store, command2, authority) {
  validateCommand(command2);
  const handlerKey = commandKind(command2.kind).handler;
  if (!handlers.has(handlerKey)) {
    fail13("INVALID_INPUT", `${command2.kind} requires its dedicated evidence producer`);
  }
  validateAuthority(authority);
  requireActorAvailable(command2, authority);
  const duplicate = duplicateMessageReceipt(store, command2);
  if (duplicate) return duplicate;
  try {
    return applyOperation(store, command2, (current, tx) => {
      bindEvidenceTransaction(store, tx);
      const handler = handlers.get(handlerKey);
      return handler(current, tx, command2, authority, {
        direction: (directionRef) => currentDirectionForStore(store, directionRef)
      });
    });
  } catch (error) {
    if (command2.payload?.messageId && (error?.code === "VERSION_CONFLICT" || error?.code === "OPERATION_CONFLICT")) {
      const racedDuplicate = duplicateMessageReceipt(store, command2);
      if (racedDuplicate) return racedDuplicate;
    }
    throw error;
  }
}

// src/core/lib/coordination-runtime/evidence-assets.mjs
var DISPOSITION = /* @__PURE__ */ new Map([
  ["scratch", ["draft", "discarded"]],
  ["draft", ["working", "discarded"]],
  ["working", ["published", "archived"]],
  ["published", ["archived", "retracted"]],
  ["personal", ["archived", "discarded"]],
  ["archived", []],
  ["retracted", []],
  ["discarded", []]
]);
var VALIDITY = /* @__PURE__ */ new Map([
  ["unknown", ["provisional", "current", "stale", "superseded", "invalidated", "retired"]],
  ["provisional", ["current", "stale", "superseded", "invalidated", "retired"]],
  ["current", ["stale", "superseded", "invalidated", "retired"]],
  ["stale", ["current", "expired", "superseded", "invalidated", "retired"]],
  ["expired", ["superseded", "invalidated", "retired"]],
  ["superseded", []],
  ["invalidated", []],
  ["retired", []]
]);
var contentEquals3 = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var lookup3 = (tx) => (kind, id) => tx.get(kind, id);
var routeIdentity = (route) => [route.pack, route.type, route.subtype, route.id, route.members];
function typedRoute(path4, visibility) {
  const local = path4.replace(/^project:[a-z][a-z0-9-]*:/, "");
  try {
    const parsed = parseTypedArtifactRoute(local);
    if (parsed.visibility !== visibility) {
      fail5("INVALID_INPUT", `${visibility} placement requires a typed ${visibility} artifact route`);
    }
    return parsed;
  } catch (error) {
    if (error?.code) throw error;
    fail5("INVALID_INPUT", error.message);
  }
}
function subjectPack(item) {
  return item.kind === "epic" ? "core" : item.body.pack;
}
function artifactFor(context, tx, asset, verify = true) {
  if (verify) return verifyAssetContent(context, tx, asset);
  const artifact = tx.get("artifact", asset.artifact_id);
  if (artifact?.subject?.kind !== asset.subject.kind || artifact.subject.id !== asset.subject.id) {
    fail5("EVIDENCE_GAP", "asset has no registered artifact");
  }
  return artifact.body;
}
function accepted(context, tx, item, asset, artifact, approvalId) {
  if (item.kind === "task") requireReviews(tx, item);
  const approvals = effectiveApprovals(
    tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
    item,
    lookup3(tx)
  ).filter((a) => a.kind === "completion" && a.authority.role === item.body.completion_authority);
  const decision = approvals.find((a) => a.approval_id === approvalId);
  if (!decision || approvals.some((a) => a.decision !== "approved") || item.kind === "task" && isProducingRun(item.body, decision.authority) || decision.authority.runId === asset.producer.runId || artifact.criteria_ref !== criteriaRef(item, lookup3(tx)) || item.kind === "task" && (!contentEquals3(decision.content_ref, artifact.content_ref) || !decision.evidence_refs.includes(`artifact:${artifact.artifact_id}`))) {
    fail5("EVIDENCE_GAP", "asset acceptance requires an effective independent decision for these exact bytes and criteria");
  }
  if (item.kind === "task") {
    verifyVerdict(tx, item, decision, decision.authority);
  } else {
    const acceptedArtifacts = verifyParentCompletionApproval(
      context,
      tx,
      item,
      decision.evidence_refs
    );
    if (!acceptedArtifacts.includes(artifact.artifact_id)) {
      fail5(
        "EVIDENCE_GAP",
        "parent asset acceptance requires this exact report artifact in the completion proof"
      );
    }
  }
  return decision;
}
function inputsCurrent(context, tx, asset, seen = /* @__PURE__ */ new Set()) {
  if (seen.has(asset.asset_id)) fail5("EVIDENCE_GAP", "asset inputs contain a cycle");
  seen = /* @__PURE__ */ new Set([...seen, asset.asset_id]);
  return asset.input_asset_ids.every((id) => {
    const input = tx.get("asset", id)?.body;
    if (!input || input.validity !== "current" || input.superseded_by !== null || (/* @__PURE__ */ new Set(["scratch", "draft", "discarded", "retracted"])).has(input.disposition)) return false;
    const item = tx.get(input.subject.kind, input.subject.id);
    const artifact = artifactFor(context, tx, input);
    accepted(context, tx, item, input, artifact, input.completion_approval_id);
    return inputsCurrent(context, tx, input, seen);
  });
}
function moved(record2, changes, reason2, at, itemVersion) {
  const body = { ...record2.body, ...changes, updated_at: at };
  body.history = [...body.history, {
    disposition: body.disposition,
    validity: body.validity,
    target: body.target,
    reason: reason2,
    at,
    at_subject_version: itemVersion
  }];
  return { ...record2, version: record2.version + 1, body };
}
function applyAssetTransition({ context, tx, item, command: command2, authority }) {
  const p = command2.payload;
  const record2 = tx.get("asset", p.assetId);
  if (record2?.subject?.kind !== item.kind || record2.subject.id !== item.id) {
    fail5("EVIDENCE_GAP", "asset transition must bind the owning hierarchy subject");
  }
  const asset = record2.body;
  if (p.disposition !== asset.disposition && !DISPOSITION.get(asset.disposition).includes(p.disposition) || p.validity !== asset.validity && !VALIDITY.get(asset.validity).includes(p.validity)) {
    fail5("INVALID_INPUT", "asset disposition or validity transition is not allowed");
  }
  const personalDiscard = asset.disposition === "personal" && p.disposition === "discarded";
  if (p.disposition === "discarded" && (p.validity === "current" || !personalDiscard && p.approvalId !== null || asset.completion_approval_id !== null || asset.history.some((h) => (/* @__PURE__ */ new Set(["working", "published"])).has(h.disposition)))) {
    fail5("INVALID_INPUT", "accepted or team-facing working assets cannot be discarded");
  }
  if (personalDiscard) {
    const decisions = effectiveApprovals(
      tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
      item,
      lookup3(tx)
    ).filter((a) => a.kind === "scope" && a.authority.role === "operator");
    const consent = decisions.find((a) => a.approval_id === p.approvalId);
    if (command2.actor.role !== "operator" || !consent?.provenance || decisions.some((a) => a.decision !== "approved") || !consent.evidence_refs.includes(`artifact:${asset.artifact_id}`)) {
      fail5("AUTHORITY_REQUIRED", "discarding personal output requires persisted actual operator consent");
    }
  }
  if (command2.actor.runId !== asset.producer.runId && ![asset.validity_owner, item.body.completion_authority, item.body.scope_authority, "operator"].includes(command2.actor.role)) {
    fail5("AUTHORITY_REQUIRED", "asset changes require its producer, validity owner, or named authority");
  }
  const unchangedTarget = p.target === null || p.target === asset.target;
  const target = p.target ?? asset.target;
  const publishedBefore = hasPublicationHistory(asset);
  if (publishedBefore && !unchangedTarget) fail5("INVALID_INPUT", "published history remains at its canonical path");
  if (!unchangedTarget && !(item.body.artifact_targets ?? []).includes(target)) {
    fail5("AUTHORITY_REQUIRED", "target is not a declared item artifact target");
  }
  const publishing = p.disposition === "published" && asset.disposition !== "published";
  const metadataOnlyInvalidation = unchangedTarget && (/* @__PURE__ */ new Set(["stale", "expired", "invalidated", "retired"])).has(p.validity) && p.supersedes === null && p.approvalId === null && !publishing;
  const artifact = artifactFor(context, tx, asset, !metadataOnlyInvalidation);
  let validity = p.validity;
  const approvalId = personalDiscard ? asset.completion_approval_id : p.approvalId ?? asset.completion_approval_id;
  const publicTarget = target.startsWith("project:") && !(artifact.content_ref.kind === "git" && target === `project:${artifact.project_id}:@git`);
  if (publicTarget && !(metadataOnlyInvalidation && publishedBefore)) {
    if (artifact.classification !== "public" || validity !== "current" || asset.history.some((h) => h.disposition === "personal")) {
      fail5("INVALID_INPUT", "public placement requires current accepted public bytes; personal assets cannot promote");
    }
  }
  if (publishing && (!publicTarget || validity !== "current")) {
    fail5("INVALID_INPUT", "publication requires a current accepted project-qualified target");
  }
  if (publishing) {
    const privateSources = typedRoute(asset.target, "private").routes;
    const publicDestination = typedRoute(target, "public");
    const pack = subjectPack(item);
    const privateSource = privateSources.find((source) => source.lifecycle === "drafts" && source.pack === pack && publicDestination.routes.some((destination) => destination.pack === pack && canonicalJson(routeIdentity(destination)) === canonicalJson(routeIdentity(source))));
    if (asset.disposition !== "working" || asset.validity !== "current" || asset.completion_approval_id === null || !privateSource) {
      fail5(
        "INVALID_INPUT",
        "publication requires an accepted retained draft on the mirrored typed route for this hierarchy subject"
      );
    }
  }
  if (p.supersedes !== null && (validity !== "current" || !["working", "published", "archived"].includes(p.disposition))) {
    fail5("EVIDENCE_GAP", "supersession requires a current accepted durable successor");
  }
  if (p.approvalId !== null && !personalDiscard) {
    accepted(context, tx, item, asset, artifact, approvalId);
  }
  if (validity === "current" || publishing || p.supersedes !== null || publicTarget && !metadataOnlyInvalidation) {
    if ((/* @__PURE__ */ new Set(["stale", "unknown"])).has(asset.validity) && (p.approvalId === null || p.approvalId === asset.completion_approval_id)) {
      fail5("EVIDENCE_GAP", "revalidation requires a fresh explicit independent acceptance");
    }
    const operatorDecision2 = command2.actor.role === "operator" ? accepted(context, tx, item, asset, artifact, approvalId) : null;
    const applyingHumanDecision = operatorDecision2?.provenance && sameActor(operatorDecision2.authority, operatorDecisionActor(operatorDecision2.provenance));
    if ((isProducingRun(item.body, command2.actor) || asset.producer.runId === command2.actor.runId) && !applyingHumanDecision) {
      fail5("AUTHORITY_REQUIRED", "a producing run cannot close its own asset");
    }
    const decision = operatorDecision2 ?? accepted(context, tx, item, asset, artifact, approvalId);
    if ((/* @__PURE__ */ new Set(["stale", "unknown"])).has(asset.validity) && Date.parse(decision.created_at) < Date.parse(asset.history.at(-1).at)) {
      fail5("EVIDENCE_GAP", "revalidation cannot reuse acceptance recorded before the validity change");
    }
    if (!inputsCurrent(context, tx, asset)) {
      if (publicTarget || publishing || p.supersedes !== null) {
        fail5("EVIDENCE_GAP", "incomplete accepted inputs cannot publish or supersede");
      }
      validity = "provisional";
    }
  }
  if (p.validity === "superseded" && asset.superseded_by === null) {
    fail5("INVALID_INPUT", "supersession must be requested by the successor");
  }
  if (p.disposition === "working") {
    const route = typedRoute(target, "private").routes[0];
    if (route.pack !== subjectPack(item)) {
      fail5("INVALID_INPUT", "working assets require a typed private route owned by the hierarchy subject pack");
    }
  } else if (p.disposition === "personal" && !/\/personal(?:\/|$)/.test(target)) {
    fail5("INVALID_INPUT", "personal assets must remain in an explicitly personal typed path");
  }
  if (!metadataOnlyInvalidation && (target !== asset.target || publicTarget)) {
    assertWorkspacePath(context.root, target);
    verifyTarget(context.root, target, artifact);
  }
  if (p.supersedes !== null) {
    if (p.supersedes === asset.asset_id || asset.supersedes !== null && asset.supersedes !== p.supersedes) {
      fail5("EVIDENCE_GAP", "successor already has a different predecessor or supersedes itself");
    }
    const previous = tx.get("asset", p.supersedes);
    if (!previous || previous.body.superseded_by !== null || !VALIDITY.get(previous.body.validity).includes("superseded") || (/* @__PURE__ */ new Set(["retracted", "discarded"])).has(previous.body.disposition)) {
      fail5("EVIDENCE_GAP", "predecessor cannot be superseded or already has a conflicting successor");
    }
    const predecessorTask = previous.subject?.kind === "task" ? tx.get("task", previous.subject.id) : null;
    if (!predecessorTask || predecessorTask.body.recovery_hold !== null) fail5("RECOVERY_REQUIRED", "predecessor is under recovery hold");
    if (previous.subject.id !== item.id) {
      requireActingAuthority(tx, predecessorTask, {
        ...command2,
        recordId: predecessorTask.id,
        expectedVersion: predecessorTask.version,
        leaseToken: null
      }, authority, command2.kind);
      if (isProducingRun(predecessorTask.body, command2.actor)) fail5("AUTHORITY_REQUIRED", "predecessor production history requires independence");
    }
    const previousArtifact = artifactFor(context, tx, previous.body);
    if (previous.body.validity === "current") {
      accepted(
        context,
        tx,
        predecessorTask,
        previous.body,
        previousArtifact,
        previous.body.completion_approval_id
      );
    }
    tx.put(moved(previous, { validity: "superseded", superseded_by: asset.asset_id }, p.reason, p.at, predecessorTask.version));
  }
  tx.put(moved(record2, {
    disposition: p.disposition,
    validity,
    target,
    completion_approval_id: approvalId,
    supersedes: p.supersedes ?? asset.supersedes
  }, p.reason, p.at, item.version));
}

// src/core/lib/coordination-runtime/evidence.mjs
var clone3 = (value) => JSON.parse(canonicalJson(value));
var contentEquals4 = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var lookup4 = (tx) => (kind, id) => tx.get(kind, id);
function ordinaryAuthority(store, tx, item, command2, authority) {
  if (item.kind !== "task") {
    if (command2.leaseToken !== null) {
      fail5("LEASE_CONFLICT", "parent hierarchy evidence commands cannot carry a Task lease");
    }
    if (![item.body.owner, item.body.scope_authority, item.body.completion_authority].includes(command2.actor.role)) {
      fail5(
        "AUTHORITY_REQUIRED",
        "parent hierarchy evidence requires its owner or declared authority"
      );
    }
    requireHostActionGrant(command2, authority, command2.kind);
    return;
  }
  if (item.body.recovery_hold !== null) fail5("RECOVERY_REQUIRED", "operator recovery hold must be resolved first");
  if (item.body.lease === null && command2.leaseToken !== null) fail5("LEASE_CONFLICT", "command carries a retired lease");
  if (item.kind === "task" && hasStaleDirection(
    tx,
    item,
    (directionRef) => currentDirectionForStore(store, directionRef)
  )) {
    requireLeasedActingAuthority(tx, item, command2, authority, command2.kind);
  } else {
    requireActingAuthority(tx, item, command2, authority, command2.kind);
  }
}
function produce(store, command2, kind, authority, action) {
  validateCommand(command2);
  if (command2.kind !== kind) fail5("INVALID_INPUT", `producer requires ${kind}`);
  const context = contextFor(store);
  const trusted = clone3(authority ?? context.authority);
  validateAuthority(trusted);
  requireActorAvailable(command2, trusted);
  const input = clone3(command2);
  return applyOperation(store, input, (item, tx) => {
    bindEvidenceTransaction(store, tx);
    action({ context, item, tx, command: input, authority: trusted });
    return item.body;
  });
}
function putNew(tx, kind, id, item, body) {
  if (tx.get(kind, id)) fail5("VERSION_CONFLICT", `${kind}/${id} already exists; history is immutable`);
  tx.put(validateRecord({
    kind,
    id,
    subject: body.subject,
    version: 1,
    body
  }));
}
function currentBinding(body, item, tx, { recovery: recovery2 = false } = {}) {
  const expected = { kind: item.kind, id: item.id };
  if (!subjectEquals(body.subject, expected) || body.criteria_ref !== (recovery2 ? null : criteriaRef(item, lookup4(tx))) || !recovery2 && item.kind === "task" && !contentEquals4(body.content_ref, item.body.change_ref) || (!recovery2 && item.kind !== "task" || recovery2) && body.content_ref !== null) {
    fail5("EVIDENCE_GAP", "record must bind the current hierarchy subject, exact content, and criteria");
  }
}
function independent(item, actor) {
  if (isProducingRun(item.body, actor)) fail5("AUTHORITY_REQUIRED", "every producing run is excluded from independent acceptance");
}
function contentEntries(subject) {
  return subject.kind === "sha256" ? [{ path: subject.path, digest: subject.digest }] : subject.kind === "bundle-sha256" ? subject.entries : [];
}
function operatorDecision(context, command2) {
  const supplied = context.verifyOperatorDecision?.(clone3(command2)) ?? null;
  let proof;
  try {
    proof = clone3(supplied);
    validateOperatorDecision(proof);
  } catch (error) {
    if (!(error instanceof RuntimeError) || error.code !== "INVALID_INPUT") throw error;
    fail5("AUTHORITY_REQUIRED", "an actual host interaction or attributed supplied operator decision is required");
  }
  const body = command2.payload.body;
  for (const key2 of ["subject", "content_ref", "criteria_ref", "kind", "decision", "deployment", "recovery"]) {
    if (canonicalJson(proof[key2]) !== canonicalJson(body[key2])) {
      fail5("AUTHORITY_REQUIRED", "operator decision does not bind the exact approval claim");
    }
  }
  if (Date.parse(proof.captured_at) > Date.now()) fail5("AUTHORITY_REQUIRED", "operator decision cannot be future-dated");
  return Object.fromEntries(["source", "reference", "attributed_to", "captured_at"].map((key2) => [key2, proof[key2]]));
}
function registerArtifact(store, command2) {
  return produce(store, command2, "artifact.register", void 0, ({ context, item, tx, command: command3, authority }) => {
    const p = command3.payload;
    if (p.recoveryLeaseToken !== void 0) {
      if (item.kind !== "task") {
        fail5("INVALID_INPUT", "parent hierarchy artifacts do not support Task lease recovery");
      }
      requireNamedAuthority(tx, command3, authority, command3.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease) || item.body.lease.token !== p.recoveryLeaseToken || command3.leaseToken !== null) {
        fail5("RECOVERY_REQUIRED", "recovery artifacts require the exact expired lease and no acting lease");
      }
    } else {
      ordinaryAuthority(store, tx, item, command3, authority);
    }
    if (tx.get("artifact", p.artifactId) || tx.get("asset", p.assetId)) fail5("VERSION_CONFLICT", "artifact and asset identities must be new");
    const run = context.runs.find((run2) => sameActor(run2.actor, command3.actor));
    if (!run) fail5("AUTHORITY_REQUIRED", "actor has no approved producing run directory");
    const subjectPack2 = item.kind === "epic" ? "core" : item.body.pack;
    let runRoute;
    try {
      [runRoute] = parseTypedArtifactRoute(run.directory).routes;
    } catch (error) {
      fail5("INVALID_INPUT", error.message);
    }
    if (runRoute.pack !== subjectPack2) {
      fail5("INVALID_INPUT", "approved producing run pack must match the hierarchy subject pack");
    }
    const entries = contentEntries(p.subject);
    const sourcePaths = entries.map((entry) => entry.path);
    const registered = tx.list("artifact");
    const requirePrivacy = ({ subject, classification }) => {
      if (privacyRank[p.classification] < privacyRank[classification]) {
        fail5("INVALID_INPUT", "derived artifacts cannot downgrade applicable input privacy");
      }
      const selected = contentEntries(subject);
      const resolvedPrivacy = (entry) => {
        const privacy = pathPrivacy(context.root, entry.path);
        if (p.classification !== "public" || privacy !== "internal" || entry.path.startsWith("project:")) return privacy;
        try {
          return parseTypedArtifactRoute(entry.path).visibility === "private" ? "public" : privacy;
        } catch {
          return privacy;
        }
      };
      if (selected.some((entry) => privacyRank[p.classification] < privacyRank[resolvedPrivacy(entry)])) {
        fail5("INVALID_INPUT", "derived artifacts cannot downgrade resolved source privacy");
      }
      const paths = new Set(selected.map((e) => normalized(assertWorkspacePath(context.root, e.path))));
      for (const previous of registered) {
        if ((contentEquals4(subject, previous.body.content_ref) || contentEntries(previous.body.content_ref).some((prior) => selected.some((entry) => entry.digest === prior.digest) || paths.has(normalized(assertWorkspacePath(context.root, prior.path))))) && privacyRank[p.classification] < privacyRank[previous.body.classification]) {
          fail5("INVALID_INPUT", "a caller label cannot downgrade registered source privacy");
        }
      }
    };
    requirePrivacy({ subject: p.subject, classification: p.classification });
    for (const path4 of sourcePaths) {
      const localPath = path4.replace(/^project:[a-z][a-z0-9-]*:/, "");
      const personalPack = /^\.kai\/(core|engineering|creative)\/[^/]+\/[^/]+\/personal(?:\/|$)/.exec(localPath)?.[1];
      let pathPacks;
      try {
        pathPacks = personalPack ? /* @__PURE__ */ new Set([personalPack]) : new Set(parseTypedArtifactRoute(localPath).routes.map((route) => route.pack));
      } catch (error) {
        fail5("INVALID_INPUT", error.message);
      }
      if (!pathPacks.has(subjectPack2)) {
        fail5("INVALID_INPUT", "artifact source pack must match the hierarchy subject pack");
      }
      if (!path4.startsWith(`${run.directory}/`) && !(item.body.artifact_targets ?? []).includes(path4)) {
        fail5("AUTHORITY_REQUIRED", "artifact source is outside the approved run and declared targets");
      }
      if (path4.startsWith("project:") && p.classification !== "public" || pathPrivacy(context.root, path4) === "personal" && p.classification !== "personal") {
        fail5("INVALID_INPUT", "artifact classification conflicts with source privacy");
      }
    }
    const inputBasis = captureInputBasis(context, tx, artifactInputReferences(item.body, p.inputAssetIds), /* @__PURE__ */ new Set(), requirePrivacy);
    const retained = retainSubject(context.root, p.subject, p.projectId, run.directory, p.artifactId);
    putNew(tx, "artifact", p.artifactId, item, {
      schema_version: 1,
      artifact_id: p.artifactId,
      subject: { kind: item.kind, id: item.id },
      producer: command3.actor,
      content_ref: p.subject,
      criteria_ref: criteriaRef(item, lookup4(tx)),
      project_id: p.projectId,
      run_directory: run.directory,
      ...retained,
      classification: p.classification,
      media_type: p.mediaType,
      title: p.title,
      created_at: p.at,
      input_basis: inputBasis
    });
    const target = p.subject.kind === "sha256" ? p.subject.path : retained.manifest_path ?? `project:${p.projectId}:@git`;
    const disposition = sourcePaths.some((path4) => pathPrivacy(context.root, path4) === "personal") ? "personal" : "scratch";
    putNew(tx, "asset", p.assetId, item, {
      schema_version: 1,
      asset_id: p.assetId,
      subject: { kind: item.kind, id: item.id },
      artifact_id: p.artifactId,
      revision: 1,
      producer: command3.actor,
      completion_authority: item.body.completion_authority,
      validity_owner: item.body.validity_owner ?? item.body.completion_authority,
      disposition,
      validity: "provisional",
      target,
      completion_approval_id: null,
      input_asset_ids: p.inputAssetIds,
      supersedes: null,
      superseded_by: null,
      updated_at: p.at,
      history: [{
        disposition,
        validity: "provisional",
        target,
        reason: "Registered exact output",
        at: p.at,
        at_subject_version: command3.expectedVersion
      }]
    });
  });
}
function recordReview(store, command2) {
  return produce(store, command2, "review.record", void 0, ({ context, item, tx, command: command3, authority }) => {
    ordinaryAuthority(store, tx, item, command3, authority);
    const b = command3.payload.body;
    if (!sameActor(b.reviewer, command3.actor)) fail5("AUTHORITY_REQUIRED", "review actor must match the command");
    independent(item, command3.actor);
    currentBinding(b, item, tx);
    if (b.kind === "product-design-acceptance" && (command3.actor.role !== item.body.completion_authority || item.body.producing_actors.some((actor) => actor.role === command3.actor.role))) {
      fail5("AUTHORITY_REQUIRED", "product design acceptance requires an independent completion authority");
    }
    subjectArtifact(context, tx, item, b.content_ref, command3.actor);
    verifyReferences(context, tx, item, [...b.evidence_refs, ...b.finding_refs], { positive: b.verdict === "approved" });
    effectiveReviews([
      ...tx.list("review", { kind: item.kind, id: item.id }).map((r) => r.body),
      b
    ], item, lookup4(tx));
    putNew(tx, "review", b.review_id, item, b);
  });
}
function recordApproval(store, command2, authority) {
  return produce(store, command2, "approval.record", authority, ({ context, item, tx, command: command3, authority: authority2 }) => {
    const b = command3.payload.body;
    if (!sameActor(b.authority, command3.actor)) fail5("AUTHORITY_REQUIRED", "approval actor must match the command");
    if (item.kind !== "task") {
      requireNamedAuthority(tx, command3, authority2, command3.kind, item.body.completion_authority);
      if (b.kind !== "completion") fail5("INVALID_INPUT", "parent subjects support completion approval only");
      currentBinding(b, item, tx);
      if (command3.actor.role !== item.body.completion_authority) {
        fail5("AUTHORITY_REQUIRED", "parent completion approval requires its declared completion authority");
      }
      verifyParentCompletionApproval(context, tx, item, b.evidence_refs);
      const body2 = { ...b, recorded_at_subject_version: command3.expectedVersion };
      effectiveApprovals([
        ...tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
        body2
      ], item, lookup4(tx));
      putNew(tx, "approval", b.approval_id, item, body2);
      return;
    }
    const needsHuman = command3.actor.role === "operator" || item.body.artifact_class === "paid-media";
    let provenance;
    if (needsHuman) {
      requireHostActionGrant(command3, authority2, command3.kind);
      provenance = operatorDecision(context, command3);
    }
    const decisionActor = command3.actor.role === "operator" ? operatorDecisionActor(provenance) : command3.actor;
    independent(item, decisionActor);
    const recovery2 = b.kind === "operator-recovery-resolution";
    if (recovery2) {
      requireNamedAuthority(tx, command3, authority2, command3.kind, "operator");
      const attempt = tx.get("attempt", b.recovery.attempt_id);
      if (b.criteria_ref !== criteriaRef(item, lookup4(tx)) || item.body.recovery_hold !== b.recovery.attempt_id || attempt?.subject?.kind !== "task" || attempt.subject.id !== item.id || attempt.body.disposition !== "conflicting-partial-work" || attempt.body.stale_lease.token !== b.recovery.stale_lease_token) {
        fail5("AUTHORITY_REQUIRED", "operator recovery resolution requires the exact current conflicting attempt");
      }
      requireRoleAvailable(b.recovery.resume_role, authority2, "recovery resume");
    } else {
      if (command3.actor.role === "operator") {
        if (item.body.recovery_hold !== null || item.body.lease !== null && !leaseIsLive(item.body.lease)) {
          fail5("RECOVERY_REQUIRED", "ordinary operator decisions cannot bypass lease recovery");
        }
        if (command3.leaseToken !== null) fail5("LEASE_CONFLICT", "operator decisions do not borrow an execution lease");
        requireHostActionGrant(command3, authority2, command3.kind);
      } else {
        ordinaryAuthority(store, tx, item, command3, authority2);
      }
      currentBinding(b, item, tx);
      subjectArtifact(context, tx, item, b.content_ref, decisionActor);
      const role = b.kind === "completion" ? item.body.completion_authority : b.kind === "scope" ? item.body.scope_authority : "operator";
      if (command3.actor.role !== role) fail5("AUTHORITY_REQUIRED", "approval must come from its declared authority");
    }
    verifyReferences(context, tx, item, b.evidence_refs, { recovery: recovery2, positive: b.decision === "approved" });
    const body = {
      ...b,
      authority: decisionActor,
      recorded_at_subject_version: command3.expectedVersion,
      ...provenance ? { provenance } : {}
    };
    const effective = effectiveApprovals([
      ...tx.list("approval", { kind: item.kind, id: item.id }).map((r) => r.body),
      body
    ], item, lookup4(tx));
    const deployments = effective.filter((a) => a.deployment !== null && a.decision === "approved");
    if (new Set(deployments.map((a) => canonicalJson(a.deployment))).size > 1) {
      fail5("AUTHORITY_REQUIRED", "operator confirmations disagree about the production deployment");
    }
    putNew(tx, "approval", b.approval_id, item, body);
    if (recovery2 && b.decision === "approved") recoveryResolution(tx, item, b.approval_id);
  });
}
function registerEvidence(store, command2, capture) {
  return produce(store, command2, "evidence.register", void 0, ({ context, item, tx, command: command3, authority }) => {
    const b = command3.payload.body;
    const parentCompletion = b.kind === "parent-completion";
    const recovery2 = b.kind === "recovery-reconciliation";
    if (parentCompletion) {
      requireNamedAuthority(tx, command3, authority, command3.kind, item.body.completion_authority);
    } else if (recovery2) {
      requireNamedAuthority(tx, command3, authority, command3.kind, item.body.scope_authority);
      if (!item.body.lease || leaseIsLive(item.body.lease) || item.body.lease.token !== b.data.stale_lease_token) {
        fail5("RECOVERY_REQUIRED", "reconciliation must observe the exact expired lease");
      }
    } else {
      ordinaryAuthority(store, tx, item, command3, authority);
    }
    currentBinding(b, item, tx, { recovery: recovery2 });
    if (!recovery2 && item.kind === "task") {
      subjectArtifact(context, tx, item, b.content_ref, b.outcome === "waived" ? command3.actor : null);
    }
    const artifacts = parentCompletion ? verifyParentCompletionEvidence(context, tx, item, b.evidence_refs) : verifyReferences(context, tx, item, b.evidence_refs, { recovery: recovery2 });
    let observation = null;
    if (command3.payload.tier === "observed") {
      if (!context.verifyCapture) fail5("INVALID_INPUT", "agent paste or a source label is not observed capture");
      observation = clone3(context.verifyCapture(clone3(command3), capture));
      validateCapture(observation);
      const positive3 = (/* @__PURE__ */ new Set(["passed", "clear", "waived"])).has(b.outcome);
      if (observation.command_digest !== commandDigest(command3) || !sameActor(observation.actor, command3.actor) || positive3 && (observation.exit_code !== 0 || observation.checks.length === 0) || observation.captured_at !== b.created_at || Date.parse(observation.captured_at) > Date.now() || b.kind === "production-verification" && b.data.checks.some((check) => !observation.checks.includes(check))) {
        fail5("EVIDENCE_GAP", "capture does not cover this actor, result, time, and complete claimed checks");
      }
      const privacy = { public: 0, internal: 1, confidential: 2, personal: 3 };
      if (artifacts.some((a) => privacy[a.classification] < privacy[observation.classification])) {
        fail5("EVIDENCE_GAP", "captured confidential data requires equally private evidence storage");
      }
      if (recovery2 && Date.parse(observation.captured_at) < Date.parse(item.body.lease.expires_at)) {
        fail5("EVIDENCE_GAP", "recovery capture predates lease expiry");
      }
    } else if (!(/* @__PURE__ */ new Set(["gap", "failed"])).has(b.outcome) || recovery2) {
      fail5("EVIDENCE_GAP", "a declaration cannot establish observed success, waiver, or recovery");
    }
    if (b.outcome === "waived") {
      requireNamedAuthority(tx, command3, authority, command3.kind, item.body.completion_authority);
      independent(item, command3.actor);
      if (artifacts.some((a) => a.producer.runId === command3.actor.runId)) {
        fail5("AUTHORITY_REQUIRED", "a producing run cannot waive verification of its own supporting artifacts");
      }
    }
    if (b.kind === "deployment" || b.kind === "production-verification") {
      const start = requireOperatorApproval(tx, item, "operator-deploy-start");
      const complete = requireOperatorApproval(tx, item, "operator-deploy-complete");
      if (canonicalJson(start.deployment) !== canonicalJson(complete.deployment) || b.data.environment !== start.deployment.environment || b.data.deployment_id !== start.deployment.deployment_id) {
        fail5("AUTHORITY_REQUIRED", "capture must match the operator-confirmed production deployment");
      }
    }
    const body = { ...b, provenance: { tier: command3.payload.tier, capture: observation } };
    if (!recovery2) {
      effectiveEvidence([
        ...tx.list("evidence", { kind: item.kind, id: item.id }).map((r) => r.body),
        body
      ], item, lookup4(tx));
    }
    putNew(tx, "evidence", b.evidence_id, item, body);
  });
}
function transitionAsset(store, command2, authority) {
  return produce(store, command2, "asset.transition", authority, ({ context, item, tx, command: command3, authority: authority2 }) => {
    ordinaryAuthority(store, tx, item, command3, authority2);
    applyAssetTransition({ context, item, tx, command: command3, authority: authority2 });
  });
}

// src/core/lib/coordination-runtime/host.mjs
import { isAbsolute as isAbsolute7, join as join11 } from "node:path";

// src/core/lib/coordination-runtime/context.mjs
var DEFAULT_CONTEXT_MAX_BYTES = 24 * 1024;
var DEFAULT_CONTEXT_RECENT_LIMIT = 8;
var MAX_RECENT_LIMIT = 8;
var MAX_MESSAGE_PAGE = 100;
var MAX_EXCERPT_BYTES = 512;
var TERMINAL2 = /* @__PURE__ */ new Set(["completed", "shipped", "dropped"]);
var bindsSubject2 = (record2, subject) => subjectEquals(record2?.subject, subject);
function invalid4(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function gap(message) {
  throw new RuntimeError("EVIDENCE_GAP", message);
}
function assertNonEmptyString2(value, label) {
  if (typeof value !== "string" || value === "") invalid4(`${label} must be a string`);
}
function validateProjectionOptions(subject, maxBytes, recentLimit) {
  validateHierarchySubject(subject, "context subject");
  if (!Number.isSafeInteger(maxBytes) || maxBytes < 1) {
    invalid4("context maxBytes must be a positive safe integer");
  }
  if (!Number.isSafeInteger(recentLimit) || recentLimit < 0 || recentLimit > MAX_RECENT_LIMIT) {
    invalid4(`context recentLimit must be an integer from 0 through ${MAX_RECENT_LIMIT}`);
  }
}
function excerpt(value) {
  const source = typeof value === "string" ? value : canonicalJson(value);
  const sourceBytes = Buffer.byteLength(source, "utf8");
  if (sourceBytes <= MAX_EXCERPT_BYTES) {
    return { text: source, truncated: false };
  }
  const suffix = "\u2026";
  const suffixBytes = Buffer.byteLength(suffix, "utf8");
  let bytes = 0;
  let text2 = "";
  for (const character of source) {
    const characterBytes = Buffer.byteLength(character, "utf8");
    if (bytes + characterBytes + suffixBytes > MAX_EXCERPT_BYTES) break;
    text2 += character;
    bytes += characterBytes;
  }
  return { text: `${text2}${suffix}`, truncated: true };
}
function messageSummary(entry) {
  const message = entry.record.body;
  return {
    ref: `message:${entry.record.id}`,
    event_seq: entry.eventSeq,
    kind: message.kind,
    sender: { role: message.sender_role, runId: message.sender_run },
    recipient: message.recipient,
    parent_id: message.parent_id,
    basis_version: message.basis_version,
    created_at_declared: message.created_at,
    payload_excerpt: excerpt(message.payload),
    artifact_reference_count: message.artifact_refs.length,
    evidence_reference_count: message.evidence_refs.length
  };
}
function detailIdentity(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? { kind: match[1].toLowerCase(), id: match[2] } : null;
}
function unique(values) {
  return [...new Set(values)];
}
function currentDecisions(view, get) {
  const effective = effectiveApprovals(
    view.approvals.map(({ record: record2 }) => record2.body),
    view.record,
    get
  );
  const byId = new Map(view.approvals.map((entry) => [entry.record.id, entry]));
  return effective.map((body) => {
    const entry = byId.get(body.approval_id);
    if (!entry || entry.eventSeq === null) {
      gap(`approval/${body.approval_id} has no persisted event chronology`);
    }
    return {
      entry,
      summary: {
        ref: `approval:${body.approval_id}`,
        event_seq: entry.eventSeq,
        kind: body.kind,
        authority: body.authority,
        decision: body.decision,
        criteria_ref: body.criteria_ref,
        reason: body.reason,
        recovery: body.recovery,
        created_at_declared: body.created_at,
        evidence_verification: "not_performed"
      }
    };
  }).sort((left, right) => left.entry.eventSeq - right.entry.eventSeq);
}
function unresolvedQuestions(view) {
  const subject = { kind: view.record.kind, id: view.record.id };
  const waiting = new Set(view.record.body.waiting_on_questions ?? []);
  const terminal2 = TERMINAL2.has(view.record.body.state);
  return view.questions.map((entry) => {
    const question = entry.record;
    if (!question) gap("hierarchy subject references a missing question");
    if (!bindsSubject2(question, subject) || !terminal2 && question.body.status !== "open" || !terminal2 && waiting.has(question.id) && question.body.blocking !== true) {
      gap(`question/${question.id} is not unresolved for ${subject.kind}/${subject.id}`);
    }
    if (entry.eventSeq === null) {
      gap(`question/${question.id} has no persisted opening-message chronology`);
    }
    if (!entry.openedMessage || !bindsSubject2(entry.openedMessage, subject) || entry.openedMessage.body.message_id !== question.body.opened_message_id || entry.openedMessage.body.kind !== "question") {
      gap(`question/${question.id} references a missing opening message`);
    }
    for (const message of entry.answerMessages) {
      if (!bindsSubject2(message, subject) || message.body.kind !== "answer") {
        gap(`question/${question.id} references a missing answer message`);
      }
    }
    return {
      entry,
      summary: {
        ref: `question:${question.id}`,
        event_seq: entry.eventSeq,
        kind: question.body.kind,
        blocking: question.body.blocking,
        disposition: TERMINAL2.has(view.record.body.state) ? "historical-follow-up" : question.body.blocking ? "blocking" : "nonblocking",
        status: question.body.status,
        asker: question.body.asker,
        recipient: question.body.recipient,
        context: question.body.context,
        ask: question.body.ask,
        answer_by: question.body.answer_by,
        opened_message_ref: `message:${question.body.opened_message_id}`,
        answer_message_refs: question.body.answer_message_ids.map((id) => `message:${id}`)
      }
    };
  }).sort((left, right) => left.entry.eventSeq - right.entry.eventSeq || left.entry.record.id.localeCompare(right.entry.record.id));
}
function recoveryHold(view) {
  if (view.record.kind !== "task" || view.record.body.recovery_hold === null) return null;
  const entry = view.recoveryHold;
  const attempt = entry?.record;
  const subject = { kind: "task", id: view.record.id };
  if (!bindsSubject2(attempt, subject) || attempt.id !== view.record.body.recovery_hold || attempt.body.disposition !== "conflicting-partial-work") {
    gap(`task/${view.record.id} references a missing or mismatched recovery attempt`);
  }
  if (!entry.message || entry.eventSeq === null || !bindsSubject2(entry.message, subject) || entry.message.body.kind !== "recovery") {
    gap(`attempt/${attempt.id} references a missing recovery message or event`);
  }
  return {
    ref: `attempt:${attempt.id}`,
    message_ref: `message:${entry.message.id}`,
    event_seq: entry.eventSeq,
    observed: attempt.body.observed,
    disposition: attempt.body.disposition,
    stale_lease: attempt.body.stale_lease,
    grantor: attempt.body.grantor,
    created_at_declared: attempt.body.created_at,
    evidence_refs: attempt.body.recovery_evidence_ids.map((id) => `evidence:${id}`),
    required_resolution: {
      authority: "operator",
      kind: "operator-recovery-resolution",
      attempt_id: attempt.id,
      stale_lease_token: attempt.body.stale_lease.token,
      criteria_ref: view.criteriaRef,
      disposition: "safe-to-resume",
      scope: TERMINAL2.has(view.record.body.state) ? "before-restoration" : "before-resumption",
      release: "persist exact operator approval, then separately authorized task.restore",
      evidence_verification: "not_performed"
    }
  };
}
function dependencies(view) {
  return view.dependencies.map(({ dependency, record: record2 }) => {
    const dependencyId = dependency.task;
    if (!record2) {
      gap(`${view.record.kind}/${view.record.id} references missing dependency task/${dependencyId}`);
    }
    return {
      task_id: record2.id,
      task_version: record2.version,
      state: record2.body.state,
      resume_state: record2.body.resume_state ?? null,
      recovery_hold: record2.body.recovery_hold ?? null,
      requires: dependency.requires
    };
  });
}
function ensureMessage(entry, label, subject, version) {
  if (!entry?.record) gap(`${label} references a missing message`);
  const threadId = subjectRef(subject, version);
  if (!bindsSubject2(entry.record, subject) || entry.record.body.thread_id !== threadId) {
    gap(`${label} does not belong to ${threadId}`);
  }
  return entry;
}
function addReference(references, kind, id) {
  references.set(`${kind}:${id}`, { kind, id });
}
function selectedEvidenceReferences(view, questions, decisions, selectedMessages, latestHandoff) {
  const values = [
    ...view.record.body.context_artifacts ?? [],
    ...questions.flatMap(({ entry }) => [entry.openedMessage, ...entry.answerMessages].flatMap((message) => [
      ...message.body.artifact_refs,
      ...message.body.evidence_refs
    ])),
    ...(view.recoveryHold?.record?.body.recovery_evidence_ids ?? []).map((id) => `evidence:${id}`),
    ...decisions.flatMap(({ entry }) => entry.record.body.evidence_refs),
    ...latestHandoff ? [
      ...latestHandoff.record.body.artifact_refs,
      ...latestHandoff.record.body.evidence_refs
    ] : [],
    ...selectedMessages.flatMap(({ record: record2 }) => [
      ...record2.body.artifact_refs,
      ...record2.body.evidence_refs
    ])
  ];
  const details = new Map(view.referencedDetails.map((entry) => [entry.reference, entry.record]));
  for (const reference of unique(values)) {
    const identity = detailIdentity(reference);
    if (identity && !details.get(reference)) {
      gap(`${reference} is missing or is not readable in the context snapshot`);
    }
  }
  return unique(values);
}
function historyCursor(view, selectedMessages) {
  const remainingCount = view.messageCount - selectedMessages.length;
  if (remainingCount <= 0) return null;
  return {
    subject: { kind: view.record.kind, id: view.record.id },
    threadId: subjectRef(
      { kind: view.record.kind, id: view.record.id },
      view.record.version
    ),
    basisVersion: view.record.version,
    beforeSeq: selectedMessages.length > 0 ? selectedMessages[0].eventSeq : view.throughSeq + 1,
    remainingCount
  };
}
function packetFor(view, {
  questionEntries,
  recovery: recovery2,
  decisionEntries,
  dependencyEntries: dependencyEntries2,
  latestHandoff,
  selectedMessages
}) {
  const references = /* @__PURE__ */ new Map();
  for (const question of questionEntries) {
    addReference(references, "question", question.entry.record.id);
    addReference(references, "message", question.entry.record.body.opened_message_id);
    for (const id of question.entry.record.body.answer_message_ids) {
      addReference(references, "message", id);
    }
  }
  if (recovery2) {
    addReference(references, "attempt", view.recoveryHold.record.id);
    addReference(references, "message", view.recoveryHold.message.id);
  }
  for (const decision of decisionEntries) {
    addReference(references, "approval", decision.entry.record.id);
  }
  if (latestHandoff) addReference(references, "message", latestHandoff.record.id);
  for (const message of selectedMessages) {
    addReference(references, "message", message.record.id);
  }
  const artifactEvidenceReferences = selectedEvidenceReferences(
    view,
    questionEntries,
    decisionEntries,
    selectedMessages,
    latestHandoff
  );
  for (const reference of artifactEvidenceReferences) {
    const identity = detailIdentity(reference);
    if (identity) addReference(references, identity.kind, identity.id);
  }
  const cursor = historyCursor(view, selectedMessages);
  const referenceList = [...references.values()];
  const record2 = view.record;
  const subject = { kind: record2.kind, id: record2.id };
  const packet = {
    schema_version: 1,
    through_seq: view.throughSeq,
    subject: {
      kind: record2.kind,
      id: record2.id,
      version: record2.version,
      title: record2.body.title,
      state: record2.body.state,
      resume_state: record2.body.resume_state ?? null,
      recovery_hold: record2.body.recovery_hold ?? null,
      completion_disposition: record2.body.completion_disposition ?? null,
      outcome: record2.body.outcome
    },
    authority: {
      owner: record2.body.owner ?? null,
      scope_authority: record2.body.scope_authority,
      completion_authority: record2.body.completion_authority,
      acceptance_actor: record2.body.acceptance_actor ?? null,
      next_role: record2.body.next_role ?? null,
      lease: record2.body.lease == null ? null : {
        holder: record2.body.lease.holder,
        token: record2.body.lease.token,
        version_at_grant: record2.body.lease.version_at_grant,
        expires_at: record2.body.lease.expires_at
      }
    },
    revision: {
      subject_ref: subjectRef(subject, record2.version),
      subject_version: record2.version,
      criteria_ref: view.criteriaRef,
      change_ref: record2.body.change_ref ?? null,
      updated_at: record2.body.updated_at
    },
    acceptance: record2.body.acceptance,
    review_requirements: record2.body.review_requirements ?? [],
    artifact_obligations: {
      artifact_expectation: record2.body.artifact_expectation ?? null,
      artifact_expectation_reason: record2.body.artifact_expectation_reason ?? null,
      artifact_class: record2.body.artifact_class ?? null,
      durability: record2.body.durability ?? null,
      validity_owner: record2.body.validity_owner ?? null,
      artifact_targets: record2.body.artifact_targets ?? []
    },
    dependencies: dependencyEntries2,
    unresolved_questions: questionEntries.map(({ summary }) => summary),
    recovery_hold: recovery2,
    blockers: [
      ...questionEntries.filter(({ summary }) => summary.disposition === "blocking").map(({ summary }) => summary),
      ...recovery2 && !TERMINAL2.has(record2.body.state) ? [{ kind: "recovery-hold", ref: recovery2.ref, required_authority: "operator" }] : []
    ],
    decisions: decisionEntries.map(({ summary }) => summary),
    latest_handoff: latestHandoff ? messageSummary(latestHandoff) : null,
    selected_artifact_evidence_references: artifactEvidenceReferences,
    recent_messages: selectedMessages.map(messageSummary),
    references: referenceList,
    history_cursor: cursor
  };
  return {
    text: canonicalJson(packet),
    references: referenceList,
    historyCursor: cursor
  };
}
function projectContext(store, {
  subject,
  maxBytes = DEFAULT_CONTEXT_MAX_BYTES,
  recentLimit = DEFAULT_CONTEXT_RECENT_LIMIT
}) {
  validateProjectionOptions(subject, maxBytes, recentLimit);
  const view = readSubjectView(store, {
    subject,
    recentLimit
  });
  if (!view.record) gap(`${subject.kind}/${subject.id} does not exist`);
  const get = (kind, id) => readRecord(store, kind, id);
  view.criteriaRef = criteriaRef(view.record, get);
  const questionEntries = unresolvedQuestions(view);
  const recovery2 = recoveryHold(view);
  const decisionEntries = currentDecisions(view, get);
  const dependencyEntries2 = dependencies(view);
  const latestHandoff = view.latestHandoff === null ? null : ensureMessage(view.latestHandoff, "latest handoff", subject, view.record.version);
  const recent = view.recentMessages.map((entry, index) => ensureMessage(entry, `recent message ${index + 1}`, subject, view.record.version));
  const fixed = {
    questionEntries,
    recovery: recovery2,
    decisionEntries,
    dependencyEntries: dependencyEntries2,
    latestHandoff
  };
  let selectedMessages = [];
  let projection = packetFor(view, { ...fixed, selectedMessages });
  let bytes = Buffer.byteLength(projection.text, "utf8");
  if (bytes > maxBytes) {
    throw new RuntimeError(
      "CONTEXT_BUDGET",
      `Required context uses ${bytes} bytes; limit is ${maxBytes}`
    );
  }
  for (let count = 1; count <= recent.length; count += 1) {
    const candidateMessages = recent.slice(-count);
    const candidate = packetFor(view, { ...fixed, selectedMessages: candidateMessages });
    const candidateBytes = Buffer.byteLength(candidate.text, "utf8");
    if (candidateBytes > maxBytes) break;
    selectedMessages = candidateMessages;
    projection = candidate;
    bytes = candidateBytes;
  }
  return {
    throughSeq: view.throughSeq,
    text: projection.text,
    bytes,
    references: projection.references,
    historyCursor: projection.historyCursor
  };
}
function readDetail(store, { kind, id }) {
  assertNonEmptyString2(kind, "detail kind");
  assertNonEmptyString2(id, "detail id");
  const record2 = readRecord(store, kind, id);
  if (!record2) gap(`${kind}/${id} does not exist`);
  return record2;
}
function readMessages(store, {
  subject,
  threadId,
  basisVersion,
  beforeSeq = null,
  limit = 50
}) {
  validateHierarchySubject(subject, "message subject");
  assertNonEmptyString2(threadId, "message threadId");
  if (!Number.isSafeInteger(basisVersion) || basisVersion < 1) {
    invalid4("message basisVersion must be a positive safe integer");
  }
  if (threadId !== subjectRef(subject, basisVersion)) {
    invalid4("message threadId must bind the requested typed subject and basisVersion");
  }
  if (beforeSeq !== null && (!Number.isSafeInteger(beforeSeq) || beforeSeq < 1)) {
    invalid4("message beforeSeq must be a positive safe integer or null");
  }
  if (!Number.isSafeInteger(limit) || limit < 1 || limit > MAX_MESSAGE_PAGE) {
    invalid4(`message limit must be an integer from 1 through ${MAX_MESSAGE_PAGE}`);
  }
  return readMessagePage(store, {
    subject,
    threadId,
    basisVersion,
    beforeSeq,
    limit
  });
}

// src/core/lib/coordination-runtime/hierarchy-view.mjs
var PACK_ORDER = ["core", "creative", "engineering"];
var TERMINAL_TASK_STATES = /* @__PURE__ */ new Set(["completed", "shipped", "dropped"]);
var SHIP_STATES2 = /* @__PURE__ */ new Set(["release-ready", "deploying", "production-verification"]);
function invalid5(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function gap2(message) {
  throw new RuntimeError("EVIDENCE_GAP", message);
}
function validateInputs(direction, roles) {
  if (direction !== null && direction !== void 0) {
    if (!direction || typeof direction !== "object" || Array.isArray(direction) || typeof direction.path !== "string" || direction.path === "" || typeof direction.hash !== "string" || !/^[0-9a-f]{64}$/i.test(direction.hash) || typeof direction.goal !== "string" || direction.goal === "") {
      invalid5("hierarchy view direction must contain path, SHA-256 hash, and goal");
    }
  }
  if (!Array.isArray(roles) || roles.some((role) => typeof role !== "string" || role === "")) {
    invalid5("hierarchy view roles must be an array of installed role identities");
  }
}
function directionIdentity(direction) {
  return direction === null || direction === void 0 ? null : { path: direction.path, hash: direction.hash, goal: direction.goal };
}
function readerFor(store) {
  const byKind = /* @__PURE__ */ new Map();
  const bySubject = /* @__PURE__ */ new Map();
  const all = (kind) => {
    if (!byKind.has(kind)) byKind.set(kind, listAllRecords(store, { kind }));
    return byKind.get(kind);
  };
  const get = (kind, id) => {
    const loaded = byKind.get(kind);
    if (loaded) return loaded.find((record2) => record2.id === id) ?? null;
    return readRecord(store, kind, id);
  };
  const subjectRecords = (kind, subject) => {
    const key2 = `${kind}\0${subject.kind}\0${subject.id}`;
    if (!bySubject.has(key2)) bySubject.set(key2, listRecords(store, { kind, subject }));
    return bySubject.get(key2);
  };
  return { all, get, subjectRecords };
}
function recordSubject(record2) {
  return { kind: record2.kind, id: record2.id };
}
function parentConfig(record2) {
  if (record2.kind === "epic") {
    return {
      childKind: "feature",
      required: record2.body.required_features,
      optional: record2.body.optional_features
    };
  }
  if (record2.kind === "feature") {
    return {
      childKind: "requirement",
      required: record2.body.required_requirements,
      optional: record2.body.optional_requirements
    };
  }
  if (record2.kind === "requirement") {
    return {
      childKind: "task",
      required: record2.body.required_tasks,
      optional: record2.body.optional_tasks
    };
  }
  return null;
}
function childSuccessful(record2) {
  if (!record2) return false;
  if (record2.kind === "feature") {
    return record2.body.state === "completed" && record2.body.completion_disposition === "delivered";
  }
  if (record2.kind === "requirement") {
    return record2.body.state === "completed" && record2.body.completion_disposition === "satisfied";
  }
  if (record2.kind === "task") {
    return record2.body.delivery_class === "knowledge" ? record2.body.state === "completed" : record2.body.state === "shipped";
  }
  return record2.body.state === "completed";
}
function directChildren(reader, record2) {
  const config = parentConfig(record2);
  if (!config) return [];
  return [
    ...config.required.map((id) => ({
      required: true,
      record: reader.get(config.childKind, id),
      kind: config.childKind,
      id
    })),
    ...config.optional.map((id) => ({
      required: false,
      record: reader.get(config.childKind, id),
      kind: config.childKind,
      id
    }))
  ];
}
function featureFor(reader, record2) {
  if (record2.kind === "feature") return record2;
  if (record2.kind === "requirement" || record2.kind === "task") {
    return reader.get("feature", record2.body.feature_id);
  }
  return null;
}
function epicFor(reader, record2) {
  if (record2.kind === "epic") return record2;
  const feature = featureFor(reader, record2);
  return feature ? reader.get("epic", feature.body.epic_id) : null;
}
function ancestorRecords(reader, record2) {
  const ancestors = [];
  const epic = epicFor(reader, record2);
  const feature = featureFor(reader, record2);
  if (epic && epic.id !== record2.id) ancestors.push(epic);
  if (feature && feature.id !== record2.id) ancestors.push(feature);
  if (record2.kind === "task") {
    for (const id of [...record2.body.satisfies].sort()) {
      const requirement = reader.get("requirement", id);
      if (requirement) ancestors.push(requirement);
    }
  }
  return ancestors;
}
function relationshipGap(reader, record2) {
  if (record2.kind === "epic") return null;
  const feature = featureFor(reader, record2);
  if (!feature) {
    return `${record2.kind}/${record2.id} references a missing Feature`;
  }
  const epic = reader.get("epic", feature.body.epic_id);
  if (!epic || ![...epic.body.required_features, ...epic.body.optional_features].includes(feature.id)) {
    return `feature/${feature.id} is not composed by its current Epic`;
  }
  if (record2.kind === "feature") return null;
  if (record2.kind === "requirement") {
    if (![...feature.body.required_requirements, ...feature.body.optional_requirements].includes(record2.id)) {
      return `requirement/${record2.id} is not composed by feature/${feature.id}`;
    }
    return null;
  }
  for (const requirementId of record2.body.satisfies) {
    const requirement = reader.get("requirement", requirementId);
    if (!requirement || requirement.body.feature_id !== feature.id || ![...requirement.body.required_tasks, ...requirement.body.optional_tasks].includes(record2.id)) {
      return `task/${record2.id} has an invalid Requirement relationship`;
    }
  }
  return null;
}
function addReason(reasons, reason2) {
  const key2 = canonicalJson([
    reason2.code,
    reason2.attention,
    reason2.subject ?? null,
    reason2.message
  ]);
  if (!reasons.some((existing) => existing.key === key2)) reasons.push({ ...reason2, key: key2 });
}
function publicReasons(reasons) {
  return reasons.map(({ key: key2, ...reason2 }) => reason2);
}
function reason(code, attention, record2, message, source = "derived") {
  return {
    code,
    attention,
    subject: record2 ? recordSubject(record2) : null,
    message,
    source
  };
}
function installedRoleGaps(reader, record2, roles) {
  const installed = new Set(roles);
  const required2 = /* @__PURE__ */ new Map();
  const add = (role, responsibility) => {
    if (role === null || role === void 0 || role === "operator" || installed.has(role)) return;
    const responsibilities = required2.get(role) ?? /* @__PURE__ */ new Set();
    responsibilities.add(responsibility);
    required2.set(role, responsibilities);
  };
  if (record2.kind === "task") {
    add(record2.body.scope_authority, "scope-authority");
    add(record2.body.completion_authority, "completion-authority");
    add(record2.body.next_role, "next-role");
    for (const requirement of record2.body.review_requirements) {
      add(requirement.role, `review:${requirement.kind}`);
    }
  } else {
    add(record2.body.owner, "owner");
    add(record2.body.scope_authority, "scope-authority");
    add(record2.body.completion_authority, "completion-authority");
    if (record2.body.state === "proposed" && (record2.kind === "feature" || record2.kind === "requirement")) {
      add(activationRole(reader, record2), "activation-authority");
    }
  }
  return [...required2.entries()].map(([role, responsibilities]) => ({
    role,
    responsibilities: [...responsibilities].sort()
  })).sort((left, right) => left.role.localeCompare(right.role));
}
function directionIsStale(epic, direction) {
  return epic?.body.state !== "completed" && canonicalJson(epic?.body.direction_ref ?? null) !== canonicalJson(directionIdentity(direction));
}
function dependencyEntries(reader, record2) {
  if (record2.kind === "feature") {
    return record2.body.depends_on_features.map((dependency) => {
      const upstream = reader.get("feature", dependency.feature);
      return {
        kind: "feature",
        id: dependency.feature,
        requires: dependency.requires,
        record: upstream,
        satisfied: upstream?.body.state === "completed" && upstream.body.completion_disposition === "delivered"
      };
    });
  }
  if (record2.kind === "task") {
    return record2.body.depends_on.map((dependency) => {
      const upstream = reader.get("task", dependency.task);
      return {
        kind: "task",
        id: dependency.task,
        requires: dependency.requires,
        record: upstream,
        satisfied: upstream ? taskStateSatisfies(upstream, dependency.requires) : false
      };
    });
  }
  const feature = featureFor(reader, record2);
  return feature && feature.id !== record2.id ? dependencyEntries(reader, feature) : [];
}
function typedReference(reference) {
  const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
  return match ? { kind: match[1].toLowerCase(), id: match[2] } : null;
}
function currentCriteria(reader, record2) {
  try {
    return criteriaRef(record2, (kind, id) => reader.get(kind, id));
  } catch (error) {
    if (error instanceof RuntimeError && error.code === "INVALID_INPUT") return null;
    throw error;
  }
}
function currentApprovals(reader, record2) {
  const criteria = currentCriteria(reader, record2);
  if (criteria === null) return [];
  return effectiveApprovals(
    reader.subjectRecords("approval", recordSubject(record2)).map((entry) => entry.body),
    record2,
    (kind, id) => reader.get(kind, id)
  );
}
function reviewsSatisfied(reader, task) {
  if (task.body.review_requirements.length === 0) return true;
  const reviews = effectiveReviews(
    reader.subjectRecords("review", recordSubject(task)).map((entry) => entry.body),
    task,
    (kind, id) => reader.get(kind, id)
  );
  return task.body.review_requirements.every((requirement) => reviews.some((review) => review.reviewer.role === requirement.role && review.kind === requirement.kind && review.verdict === "approved"));
}
function parentReadyToClose(reader, record2) {
  const children = directChildren(reader, record2).filter((child) => child.required);
  return children.length === 0 || children.every((child) => child.record && childSuccessful(child.record));
}
function activationRole(reader, record2) {
  if (record2.kind === "epic") return record2.body.scope_authority;
  if (record2.kind === "feature") return epicFor(reader, record2)?.body.owner ?? null;
  if (record2.kind === "requirement") return featureFor(reader, record2)?.body.owner ?? null;
  return record2.body.scope_authority;
}
function nextAction(reader, record2) {
  if (record2.kind !== "task") {
    if (record2.body.state === "completed") return null;
    if (record2.body.state === "proposed") {
      return { kind: `${record2.kind}.activate`, role: activationRole(reader, record2) };
    }
    if (parentReadyToClose(reader, record2)) {
      return { kind: `${record2.kind}.complete`, role: record2.body.completion_authority };
    }
    return { kind: "advance-required-children", role: record2.body.owner };
  }
  if (TERMINAL_TASK_STATES.has(record2.body.state)) return null;
  if (record2.body.state === "proposed") {
    return { kind: "task.promote", role: record2.body.scope_authority };
  }
  if (record2.body.state === "blocked") {
    return { kind: "resolve-task-blockers", role: record2.body.next_role };
  }
  if (SHIP_STATES2.has(record2.body.state)) {
    return { kind: "human-production-action", role: "operator" };
  }
  return {
    kind: record2.body.lease === null ? "task.grant" : "continue-leased-task",
    role: record2.body.next_role
  };
}
function deriveAttentionInSnapshot(reader, record2, direction, roles) {
  validateHierarchySubject(recordSubject(record2), "attention subject");
  const reasons = [];
  const terminal2 = record2.kind === "task" ? TERMINAL_TASK_STATES.has(record2.body.state) : record2.body.state === "completed";
  if (!terminal2) {
    const invalidRelationship = relationshipGap(reader, record2);
    if (invalidRelationship) {
      addReason(reasons, reason(
        "missing-evidence",
        "blocked",
        record2,
        invalidRelationship
      ));
    }
    const epic = epicFor(reader, record2);
    if (!epic) {
      addReason(reasons, reason(
        "missing-evidence",
        "blocked",
        record2,
        `${record2.kind}/${record2.id} has no current Epic ancestor`
      ));
    } else if (directionIsStale(epic, direction)) {
      addReason(reasons, reason(
        "stale-direction",
        "blocked",
        epic,
        `epic/${epic.id} is not aligned to the current Direction`
      ));
    }
    const ancestors = ancestorRecords(reader, record2);
    for (const ancestor of ancestors) {
      if (ancestor.body.state !== "active") {
        addReason(reasons, reason(
          "inactive-ancestor",
          "blocked",
          ancestor,
          `${ancestor.kind}/${ancestor.id} is ${ancestor.body.state}, not active`,
          "declared"
        ));
      }
    }
    for (const candidate of [record2, ...ancestors]) {
      if (candidate.kind === "task" || candidate.body.hold === null) continue;
      const hold = candidate.body.hold;
      const human = candidate.body.owner === "operator" && candidate.body.scope_authority === "operator";
      addReason(reasons, reason(
        "hold",
        human ? "needs-human" : "blocked",
        candidate,
        hold.reason,
        "declared"
      ));
    }
    for (const dependency of dependencyEntries(reader, record2)) {
      if (dependency.satisfied) continue;
      addReason(reasons, reason(
        "unmet-dependency",
        "blocked",
        dependency.record ?? record2,
        dependency.record ? `${dependency.kind}/${dependency.id} must reach ${dependency.requires}` : `${dependency.kind}/${dependency.id} is missing`
      ));
    }
    const config = parentConfig(record2);
    if (config) {
      for (const child of directChildren(reader, record2).filter((entry) => entry.required)) {
        if (!child.record) {
          addReason(reasons, reason(
            "missing-evidence",
            "blocked",
            record2,
            `required ${child.kind}/${child.id} is missing`
          ));
        }
      }
    }
    if (record2.kind === "task") {
      if (record2.body.state === "blocked") {
        addReason(reasons, reason(
          "blocked",
          "blocked",
          record2,
          `task/${record2.id} records blocked lifecycle`,
          "declared"
        ));
      }
      for (const reference of record2.body.context_artifacts) {
        const identity = typedReference(reference);
        if (identity && !reader.get(identity.kind, identity.id)) {
          addReason(reasons, reason(
            "missing-evidence",
            "blocked",
            record2,
            `${reference} is not available`
          ));
        }
      }
      if (record2.body.recovery_hold !== null) {
        addReason(reasons, reason(
          "recovery-hold",
          "needs-human",
          record2,
          `task/${record2.id} requires exact operator recovery resolution`
        ));
      }
      if (record2.body.state === "in-review" && record2.body.completion_authority === "operator" && reviewsSatisfied(reader, record2) && !currentApprovals(reader, record2).some((approval) => approval.kind === "completion" && approval.authority.role === "operator" && approval.decision === "approved")) {
        addReason(reasons, reason(
          "human-approval",
          "needs-human",
          record2,
          `task/${record2.id} awaits operator completion approval`
        ));
      }
      if (SHIP_STATES2.has(record2.body.state)) {
        addReason(reasons, reason(
          "human-approval",
          "needs-human",
          record2,
          `task/${record2.id} awaits a human production action`
        ));
      } else if (record2.body.next_role === "operator") {
        addReason(reasons, reason(
          "operator-route",
          "needs-human",
          record2,
          `task/${record2.id} routes its next action to the operator`,
          "declared"
        ));
      }
    } else if (record2.body.state === "proposed" && activationRole(reader, record2) === "operator") {
      addReason(reasons, reason(
        "human-activation",
        "needs-human",
        record2,
        `${record2.kind}/${record2.id} requires operator activation`
      ));
    } else if (record2.body.state === "active" && parentReadyToClose(reader, record2) && record2.body.completion_authority === "operator") {
      addReason(reasons, reason(
        "human-approval",
        "needs-human",
        record2,
        `${record2.kind}/${record2.id} requires operator completion acceptance`
      ));
    }
    for (const question of reader.subjectRecords("question", recordSubject(record2))) {
      if (question.body.status !== "open" || question.body.blocking !== true) continue;
      addReason(reasons, reason(
        question.body.recipient === "operator" ? "operator-question" : "blocking-question",
        question.body.recipient === "operator" ? "needs-human" : "blocked",
        record2,
        `question/${question.id} is open for ${question.body.recipient}`,
        "declared"
      ));
    }
  }
  const visible = publicReasons(reasons);
  const value = visible.some((entry) => entry.attention === "needs-human") ? "needs-human" : visible.some((entry) => entry.attention === "blocked") ? "blocked" : "none";
  return {
    value,
    reasons: visible,
    staffing_gaps: terminal2 ? [] : installedRoleGaps(reader, record2, roles),
    next_action: nextAction(reader, record2)
  };
}
function statusNode(reader, record2, direction, roles, extra = {}) {
  const attention = deriveAttentionInSnapshot(reader, record2, direction, roles);
  return {
    kind: record2.kind,
    id: record2.id,
    version: record2.version,
    title: record2.body.title,
    priority: record2.body.priority,
    lifecycle: {
      state: record2.body.state,
      completion_disposition: record2.body.completion_disposition ?? null
    },
    attention,
    ...extra
  };
}
function taskNode(reader, task, direction, roles, required2) {
  return statusNode(reader, task, direction, roles, { required: required2 });
}
function requirementNode(reader, requirement, direction, roles, required2) {
  const tasks = directChildren(reader, requirement).map((child) => child.record ? taskNode(reader, child.record, direction, roles, child.required) : {
    kind: "task",
    id: child.id,
    required: child.required,
    missing: true
  });
  return statusNode(reader, requirement, direction, roles, {
    required: required2,
    rollup: {
      required: tasks.filter((task) => task.required).length,
      required_complete: tasks.filter((task) => task.required && !task.missing && childSuccessful(reader.get("task", task.id))).length,
      optional: tasks.filter((task) => !task.required).length,
      optional_complete: tasks.filter((task) => !task.required && !task.missing && childSuccessful(reader.get("task", task.id))).length
    },
    tasks
  });
}
function featureNode(reader, feature, direction, roles, required2) {
  const requirements = directChildren(reader, feature).map((child) => child.record ? requirementNode(reader, child.record, direction, roles, child.required) : {
    kind: "requirement",
    id: child.id,
    required: child.required,
    missing: true
  });
  return statusNode(reader, feature, direction, roles, {
    pack: feature.body.pack,
    required: required2,
    rollup: {
      required: requirements.filter((entry) => entry.required).length,
      required_complete: requirements.filter((entry) => entry.required && !entry.missing && childSuccessful(reader.get("requirement", entry.id))).length,
      optional: requirements.filter((entry) => !entry.required).length,
      optional_complete: requirements.filter((entry) => !entry.required && !entry.missing && childSuccessful(reader.get("requirement", entry.id))).length
    },
    requirements
  });
}
function throughSeq(store) {
  return Number(store.database.prepare(
    "SELECT COALESCE(MAX(seq), 0) AS seq FROM events"
  ).get().seq);
}
function hierarchyStatus(store, { direction, roles }) {
  validateInputs(direction, roles);
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const epics = reader.all("epic").map((epic) => {
      const features = directChildren(reader, epic).map((child) => child.record ? featureNode(reader, child.record, direction, roles, child.required) : {
        kind: "feature",
        id: child.id,
        required: child.required,
        missing: true
      });
      const packs = [...new Set(features.filter((feature) => !feature.missing).map((feature) => feature.pack))].sort((left, right) => PACK_ORDER.indexOf(left) - PACK_ORDER.indexOf(right) || left.localeCompare(right)).map((pack) => {
        const selected = features.filter((feature) => feature.pack === pack);
        return {
          pack,
          rollup: {
            required: selected.filter((feature) => feature.required).length,
            required_complete: selected.filter((feature) => feature.required && childSuccessful(reader.get("feature", feature.id))).length,
            optional: selected.filter((feature) => !feature.required).length,
            optional_complete: selected.filter((feature) => !feature.required && childSuccessful(reader.get("feature", feature.id))).length
          },
          features: selected
        };
      });
      return statusNode(reader, epic, direction, roles, {
        rollup: {
          required: features.filter((feature) => feature.required).length,
          required_complete: features.filter((feature) => feature.required && !feature.missing && childSuccessful(reader.get("feature", feature.id))).length,
          optional: features.filter((feature) => !feature.required).length,
          optional_complete: features.filter((feature) => !feature.required && !feature.missing && childSuccessful(reader.get("feature", feature.id))).length
        },
        packs
      });
    }).sort((left, right) => left.priority - right.priority || left.id.localeCompare(right.id));
    const records2 = [
      ...reader.all("epic"),
      ...reader.all("feature"),
      ...reader.all("requirement"),
      ...reader.all("task")
    ];
    return {
      schema_version: 1,
      through_seq: throughSeq(store),
      goal: {
        text: direction?.goal ?? null,
        path: direction?.path ?? null,
        hash: direction?.hash ?? null
      },
      totals: {
        records: records2.length,
        epics: reader.all("epic").length,
        features: reader.all("feature").length,
        requirements: reader.all("requirement").length,
        tasks: reader.all("task").length,
        terminal: records2.filter((record2) => record2.kind === "task" ? TERMINAL_TASK_STATES.has(record2.body.state) : record2.body.state === "completed").length
      },
      epics
    };
  });
}
function recordSummary(record2) {
  return {
    kind: record2.kind,
    id: record2.id,
    version: record2.version,
    title: record2.body.title,
    state: record2.body.state,
    completion_disposition: record2.body.completion_disposition ?? null,
    priority: record2.body.priority
  };
}
function contextChildren(reader, record2) {
  return directChildren(reader, record2).map((child) => ({
    ...child.record ? recordSummary(child.record) : {
      kind: child.kind,
      id: child.id,
      missing: true
    },
    required: child.required
  }));
}
function contextDependencies(reader, record2) {
  return dependencyEntries(reader, record2).map((dependency) => ({
    kind: dependency.kind,
    id: dependency.id,
    requires: dependency.requires,
    satisfied: dependency.satisfied,
    version: dependency.record?.version ?? null,
    state: dependency.record?.body.state ?? null,
    completion_disposition: dependency.record?.body.completion_disposition ?? null
  }));
}
function contextActiveHold(reader, record2) {
  const candidates = [];
  if (record2.kind !== "task") candidates.push(record2);
  if (record2.kind === "task") {
    for (const requirementId of [...record2.body.satisfies].sort()) {
      const requirement = reader.get("requirement", requirementId);
      if (requirement) candidates.push(requirement);
    }
  }
  const feature = featureFor(reader, record2);
  if (feature && feature.id !== record2.id) candidates.push(feature);
  const epic = epicFor(reader, record2);
  if (epic && epic.id !== record2.id) candidates.push(epic);
  const source = candidates.find((candidate) => candidate.body.hold !== null);
  return source ? { source: recordSubject(source), ...source.body.hold } : null;
}
function hierarchyContextExtras(reader, record2, direction, roles, basePacket) {
  const attention = deriveAttentionInSnapshot(reader, record2, direction, roles);
  return {
    direction: directionIdentity(direction),
    selected_record: record2,
    ancestors: ancestorRecords(reader, record2).map(recordSummary),
    direct_children: contextChildren(reader, record2),
    dependencies: contextDependencies(reader, record2),
    authorities: basePacket.authority,
    current_decisions: basePacket.decisions,
    active_hold: contextActiveHold(reader, record2),
    attention,
    next_allowed_action: attention.next_action
  };
}
function mergedProjection(projection, extras) {
  const packet = { ...JSON.parse(projection.text), ...extras };
  const text2 = canonicalJson(packet);
  return {
    throughSeq: projection.throughSeq,
    text: text2,
    bytes: Buffer.byteLength(text2, "utf8"),
    references: projection.references,
    historyCursor: projection.historyCursor
  };
}
function hierarchyContext(store, {
  subject,
  maxBytes = DEFAULT_CONTEXT_MAX_BYTES,
  recentLimit = DEFAULT_CONTEXT_RECENT_LIMIT,
  direction,
  roles
}) {
  validateInputs(direction, roles);
  validateHierarchySubject(subject, "context subject");
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const record2 = reader.get(subject.kind, subject.id);
    if (!record2) gap2(`${subject.kind}/${subject.id} does not exist`);
    const required2 = projectContext(store, {
      subject,
      maxBytes,
      recentLimit: 0
    });
    const requiredPacket = JSON.parse(required2.text);
    const extras = hierarchyContextExtras(reader, record2, direction, roles, requiredPacket);
    const requiredMerged = mergedProjection(required2, extras);
    if (requiredMerged.bytes > maxBytes) {
      throw new RuntimeError(
        "CONTEXT_BUDGET",
        `Required hierarchy context uses ${requiredMerged.bytes} bytes; limit is ${maxBytes}`
      );
    }
    const overhead = requiredMerged.bytes - required2.bytes;
    const projection = recentLimit === 0 ? required2 : projectContext(store, {
      subject,
      maxBytes: maxBytes - overhead,
      recentLimit
    });
    const merged = mergedProjection(projection, extras);
    if (merged.bytes > maxBytes) {
      throw new RuntimeError(
        "CONTEXT_BUDGET",
        `Required hierarchy context uses ${merged.bytes} bytes; limit is ${maxBytes}`
      );
    }
    return merged;
  });
}
function taskCandidates(reader, subject) {
  if (subject.kind === "task") {
    const task = reader.get("task", subject.id);
    return task ? [task] : [];
  }
  if (subject.kind === "requirement") {
    const requirement = reader.get("requirement", subject.id);
    return requirement ? directChildren(reader, requirement).map((child) => child.record).filter(Boolean) : [];
  }
  if (subject.kind === "feature") {
    return reader.all("task").filter((task) => task.body.feature_id === subject.id);
  }
  const featureIds = new Set(reader.all("feature").filter((feature) => feature.body.epic_id === subject.id).map((feature) => feature.id));
  return reader.all("task").filter((task) => featureIds.has(task.body.feature_id));
}
function exclusionReasons(task, attention, selected) {
  const reasons = [];
  const add = (code, message) => {
    if (!reasons.some((entry) => entry.code === code && entry.message === message)) {
      reasons.push({ code, message });
    }
  };
  if (selected.kind === "requirement" && !task.body.satisfies.includes(selected.id)) {
    add("relationship-invalid", `Task does not declare Requirement ${selected.id}`);
  }
  if (task.body.state === "proposed") add("proposed", "Task is still proposed");
  else if (!GRANTABLE_STATES.has(task.body.state)) {
    add(
      TERMINAL_TASK_STATES.has(task.body.state) ? "terminal" : "not-executable",
      `Task lifecycle ${task.body.state} is not executable`
    );
  }
  if (task.body.lease !== null) add("leased", "Task already has a lease");
  for (const entry of attention.reasons) {
    if (entry.attention === "blocked" || (/* @__PURE__ */ new Set(["hold", "stale-direction"])).has(entry.code)) {
      add(entry.code, entry.message);
    }
  }
  if (attention.value === "needs-human") {
    add("needs-human", "Only a human can perform the next action");
  }
  const actionRole = attention.next_action?.role ?? null;
  const blockingStaffing = attention.staffing_gaps.filter((staffing) => staffing.role === actionRole);
  if (blockingStaffing.length > 0) {
    add(
      "staffing-gap",
      `Missing installed role(s): ${blockingStaffing.map((gap3) => gap3.role).join(", ")}`
    );
  }
  return reasons;
}
function taskPlan(store, { subject, direction, roles }) {
  validateInputs(direction, roles);
  validateHierarchySubject(subject, "plan subject");
  return readSnapshot(store, () => {
    const reader = readerFor(store);
    const selected = reader.get(subject.kind, subject.id);
    if (!selected) gap2(`${subject.kind}/${subject.id} does not exist`);
    const tasks = [];
    const excluded = [];
    for (const task of taskCandidates(reader, subject).sort((left, right) => left.body.priority - right.body.priority || left.id.localeCompare(right.id))) {
      const attention = deriveAttentionInSnapshot(reader, task, direction, roles);
      const reasons = exclusionReasons(task, attention, selected);
      if (reasons.length > 0) {
        excluded.push({
          kind: "task",
          id: task.id,
          version: task.version,
          state: task.body.state,
          reasons
        });
        continue;
      }
      tasks.push({
        kind: "task",
        id: task.id,
        version: task.version,
        title: task.body.title,
        priority: task.body.priority,
        state: task.body.state,
        next_role: task.body.next_role,
        acceptance: task.body.acceptance,
        attention
      });
    }
    return {
      schema_version: 1,
      through_seq: throughSeq(store),
      subject,
      automatic: false,
      tasks,
      excluded
    };
  });
}

// src/core/lib/coordination-runtime/host-plan.mjs
function planHierarchy({ store, subject, direction, roles }) {
  return taskPlan(store, { subject, direction, roles });
}
function validateRoster(roster, profiles) {
  if (!Array.isArray(roster) || !isPlainObject(profiles)) fail2("INVALID_INPUT", "host roster/profiles are required");
  const ids = /* @__PURE__ */ new Set();
  for (const entry of roster) {
    assertExactKeys(entry, /* @__PURE__ */ new Set(["id", "role", "model"]), "roster entry");
    text(entry.id, "qualified host id");
    text(entry.role, "roster role");
    if (entry.model !== null) text(entry.model, "roster model");
    if (ids.has(entry.id)) fail2("INVALID_INPUT", "duplicate host agent id");
    ids.add(entry.id);
  }
}
function planDispatch({ task, roster, profiles, capabilities, request = {} }) {
  if (!task || typeof task.next_role !== "string") {
    fail2("ROLE_UNAVAILABLE", "Task has no next role");
  }
  if (!Array.isArray(roster) || roster.some((entry2) => !isPlainObject(entry2))) {
    fail2("INVALID_INPUT", "roster must be an array of entries");
  }
  const entries = roster.filter((entry2) => entry2.role === task.next_role);
  if (entries.length !== 1) fail2("ROLE_UNAVAILABLE", "exact next role must resolve to one qualified host ID");
  validateRoster(roster, profiles);
  validateCapabilities(capabilities);
  assertExactKeys(request, /* @__PURE__ */ new Set(["role", "profile", "model", "fallbackModel", "effort"]), "dispatch request", /* @__PURE__ */ new Set());
  const profile = profiles[task.next_role];
  const requiredModel = approvedProfileModel(task.next_role, profile);
  if (request.role !== void 0 && request.role !== task.next_role || request.profile !== void 0 && request.profile !== profile) {
    fail2("INVALID_INPUT", "requested role/profile is inconsistent with the installed role");
  }
  if (request.model !== void 0 && request.model !== requiredModel || request.fallbackModel !== void 0 && request.fallbackModel !== requiredModel || !capabilities.models.includes(requiredModel)) {
    fail2("MODEL_UNAVAILABLE", "required model is unavailable or requested fallback is outside approved policy");
  }
  const [entry] = entries;
  if (!capabilities.modelOverride && entry.model !== requiredModel) {
    fail2("MODEL_UNAVAILABLE", "host cannot guarantee the pinned model without a supported override");
  }
  const settings = {};
  if (capabilities.modelOverride) settings.model = requiredModel;
  if (request.effort !== void 0 && request.effort !== null) {
    if (!capabilities.efforts.includes(request.effort)) fail2("UNSUPPORTED_HOST", "requested effort override is unsupported");
    settings.effort = request.effort;
  }
  return {
    mode: capabilities.peerDispatch ? "peer-available" : "ordered-queue",
    automatic: false,
    queue: [{
      agentId: entry.id,
      role: task.next_role,
      profile,
      requestedModel: requiredModel,
      settings: clone(settings),
      context: "fresh-single-shot"
    }]
  };
}

// src/core/lib/coordination-runtime/host.mjs
var bindings2 = /* @__PURE__ */ new WeakMap();
var equal = (left, right) => canonicalJson(left) === canonicalJson(right);
var uncertainEffect = (body) => ["unknown", "conflicting"].includes(body.outcome);
var bindsTask = (record2, taskId) => record2?.subject?.kind === "task" && record2.subject.id === taskId;
function bindHostRuntime(store, options2) {
  assertExactKeys(options2, /* @__PURE__ */ new Set([
    "root",
    "authority",
    "roster",
    "profiles",
    "capabilities",
    "maxAttempts",
    "verifyObservation"
  ]), "host runtime", /* @__PURE__ */ new Set(["root", "authority", "roster", "profiles", "capabilities", "maxAttempts"]));
  workspaceManifest(options2.root);
  const database = COORDINATION_DATABASE;
  if (!store || store.closed || !isAbsolute7(store.path) || normalized(store.path) !== normalized(join11(options2.root, ...database.split("/")))) {
    fail2("INVALID_INPUT", "host workspace must be explicitly bound to this store");
  }
  assertWorkspacePath(options2.root, database);
  validateAuthority(options2.authority);
  validateRoster(options2.roster, options2.profiles);
  validateCapabilities(options2.capabilities);
  if (!Number.isSafeInteger(options2.maxAttempts) || options2.maxAttempts < 1 || options2.maxAttempts > 10) {
    fail2("INVALID_INPUT", "trusted maximum attempts must be from 1 through 10");
  }
  if (options2.verifyObservation !== void 0 && typeof options2.verifyObservation !== "function") {
    fail2("INVALID_INPUT", "verifyObservation must be a trusted host function");
  }
  const { verifyObservation, ...data } = options2;
  bindings2.set(store, { ...clone(data), verifyObservation });
}
function contextFor2(store, command2, kinds2) {
  const cmd = clone(command2);
  validateCommand(cmd);
  if (!kinds2.includes(commandKind(cmd.kind).handler)) {
    fail2("INVALID_INPUT", "incorrect host recording API for command kind");
  }
  const context = bindings2.get(store);
  if (!context || store.closed) fail2("AUTHORITY_REQUIRED", "bind the trusted host runtime before recording");
  workspaceManifest(context.root);
  requireActorAvailable(cmd, context.authority);
  requireHostActionGrant(cmd, context.authority, cmd.kind);
  return { context, cmd };
}
function actingTask(store, tx, command2, context, target) {
  const p = command2.payload;
  const task = tx.get("task", p.taskId);
  if (!task) fail2("EVIDENCE_GAP", "host intent requires an existing Task");
  if (task.version !== p.taskVersion) fail2("VERSION_CONFLICT", "host intent Task version is stale");
  const feature = tx.get("feature", task.body.feature_id);
  const epic = feature && tx.get("epic", feature.body.epic_id);
  if (!epic) fail2("EVIDENCE_GAP", "host intent requires current Task ancestors");
  assertAlignedAncestors(tx, task, currentDirectionForStore(store, epic.body.direction_ref));
  if (!GRANTABLE_STATES.has(task.body.state) || task.body.recovery_hold !== null || task.body.waiting_on_questions.length > 0) {
    fail2("RECOVERY_REQUIRED", "Task is not available for host execution");
  }
  if (target.role === "operator" || SHIP_STATES.has(task.body.state) && target.role !== "workflow-ship") {
    fail2("AUTHORITY_REQUIRED", "host execution cannot replace the shipping role or the operator");
  }
  requireHostActionGrant({
    ...command2,
    recordKind: "task",
    recordId: task.id,
    expectedVersion: task.version
  }, context.authority, command2.kind);
  if (task.body.lease !== null) requireLease(task, { ...command2, actor: target });
  else if (command2.leaseToken !== null) fail2("LEASE_CONFLICT", "host intent supplied a lease that no longer exists");
  return task;
}
function noUnresolvedEffects(tx, taskId) {
  if (tx.list("effect", { kind: "task", id: taskId }).some((record2) => uncertainEffect(record2.body))) {
    fail2("RECOVERY_REQUIRED", "effect outcome is unresolved; never automatically replay");
  }
}
function resumeContext(tx, context, command2, task, planned, previous) {
  const p = command2.payload;
  const sameRun = tx.list("host-attempt").filter((record2) => record2.body.target.runId === p.target.runId);
  if (p.resumeFrom === null) {
    if (sameRun.length) fail2("RECOVERY_REQUIRED", "fresh single-shot work requires a fresh host run");
    return { context: "fresh-single-shot", resume_from: null, resume_session_id: null };
  }
  if (!context.capabilities.resume) fail2("UNSUPPORTED_HOST", "host resume is unsupported");
  const prior = previous.find((record2) => record2.id === p.resumeFrom)?.body;
  if (!prior || prior.status !== "failed" || prior.subject_version !== task.version || prior.profile !== p.profile || prior.agent_id !== planned.agentId || prior.requested_model !== p.requestedModel || prior.requested_effort !== p.effort || prior.independence_key !== p.independenceKey || !sameActor(prior.target, p.target) || sameRun.some((record2) => !bindsTask(record2, task.id) || record2.body.profile !== p.profile || record2.body.target.role !== p.target.role || record2.body.independence_key !== p.independenceKey)) {
    fail2("RECOVERY_REQUIRED", "resume cannot cross Task, role, profile, run or independence boundaries");
  }
  const latest = latestTerminalObservations(prior);
  if (!latest.length || latest.some(({ facts }) => facts.status !== "failed" || !facts.sessionId || facts.actualModel !== p.requestedModel || p.effort !== null && facts.actualEffort !== p.effort)) {
    fail2("RECOVERY_REQUIRED", "resume requires verified stopped liveness, session and matching model/effort");
  }
  return { context: "resume", resume_from: p.resumeFrom, resume_session_id: latest[0].facts.sessionId };
}
function recordAttempt(store, command2) {
  const { context, cmd } = contextFor2(store, command2, ["attempt.start"]);
  return applyOperation(store, cmd, (_current, tx) => {
    const p = cmd.payload;
    const task = actingTask(store, tx, cmd, context, p.target);
    if (p.target.role !== task.body.next_role) fail2("INVALID_INPUT", "target must be the Task next role");
    const planned = planDispatch({
      task: task.body,
      roster: context.roster,
      profiles: context.profiles,
      capabilities: context.capabilities,
      request: { role: p.target.role, profile: p.profile, model: p.requestedModel, effort: p.effort }
    }).queue[0];
    if (["review", "technical-review"].includes(p.profile) && task.body.producing_actors.some((producer) => producer.runId === p.target.runId)) {
      fail2("RECOVERY_REQUIRED", "independent review cannot reuse a producing run");
    }
    if (p.resumeFrom !== null && !context.capabilities.resume) fail2("UNSUPPORTED_HOST", "host resume is unsupported");
    noUnresolvedEffects(tx, task.id);
    const previous = tx.list("host-attempt", { kind: "task", id: task.id });
    if (previous.length >= context.maxAttempts || previous.some((record2) => ["intent", "uncertain", "conflicting", "mismatched"].includes(record2.body.status) || record2.body.status === "completed" && record2.body.subject_version === task.version)) {
      fail2("RECOVERY_REQUIRED", "attempt is unresolved, already completed or bounded attempts exhausted; no automatic redispatch");
    }
    const resume = resumeContext(tx, context, cmd, task, planned, previous);
    return {
      schema_version: 1,
      attempt_id: cmd.recordId,
      subject: { kind: "task", id: task.id },
      subject_version: task.version,
      actor: cmd.actor,
      target: p.target,
      agent_id: planned.agentId,
      profile: p.profile,
      requested_model: p.requestedModel,
      requested_effort: p.effort,
      independence_key: p.independenceKey,
      ...resume,
      capabilities: clone(context.capabilities),
      settings: planned.settings,
      created_at: p.createdAt,
      status: "intent",
      observations: [],
      gaps: []
    };
  });
}
function verifiedObservation(context, cmd, handle) {
  const proof = context.verifyObservation?.(clone(cmd), handle);
  if (!proof || typeof proof.then === "function") fail2("EVIDENCE_GAP", "verified host capture is required; caller JSON is not observation");
  assertExactKeys(proof, /* @__PURE__ */ new Set([
    "commandDigest",
    "actor",
    "observationId",
    "attemptId",
    "effectId",
    "capturedAt",
    "source",
    "facts"
  ]), "host attestation");
  const effect = cmd.recordKind === "effect";
  if (proof.commandDigest !== commandDigest(cmd) || !sameActor(proof.actor, cmd.actor) || proof.observationId !== cmd.payload.observationId || proof.attemptId !== (effect ? cmd.payload.attemptId : cmd.recordId) || proof.effectId !== (effect ? cmd.recordId : null)) {
    fail2("EVIDENCE_GAP", "host capture does not cover this exact command, actor, attempt and effect");
  }
  const observation = {
    observationId: proof.observationId,
    source: proof.source,
    capturedAt: proof.capturedAt,
    facts: sanitizeFacts(proof.facts, effect),
    sessionConflicts: []
  };
  validateHostObservation(observation, effect);
  if (Date.parse(observation.capturedAt) > Date.now()) fail2("EVIDENCE_GAP", "host capture cannot be in the future");
  return observation;
}
function appendObservation(body, observation, effect) {
  if (Date.parse(observation.capturedAt) < Date.parse(body.created_at)) fail2("EVIDENCE_GAP", "capture predates intent");
  const existing = body.observations.find((entry) => entry.observationId === observation.observationId);
  if (existing && !equal(existing, observation)) fail2("OPERATION_CONFLICT", "observation ID already has different facts");
  if (!existing) {
    if (body.observations.length >= MAX_OBSERVATIONS) fail2("RECOVERY_REQUIRED", "observation limit reached; reconcile without replay");
    body.observations.push(observation);
  }
  return { ...body, ...effect ? effectSummary(body) : attemptSummary(body) };
}
function recordObservation(store, command2, handle, effect) {
  const { context, cmd } = contextFor2(store, command2, [effect ? "effect.result" : "attempt.result"]);
  const observation = verifiedObservation(context, cmd, handle);
  const receipt = applyOperation(store, cmd, (current, tx) => {
    if (!current) fail2("EVIDENCE_GAP", "observation requires a persisted intent");
    if (effect && (current.body.attempt_id !== cmd.payload.attemptId || !bindsTask(tx.get("host-attempt", current.body.attempt_id), current.subject?.id))) {
      fail2("EVIDENCE_GAP", "effect result must bind its exact persisted attempt");
    }
    const retained2 = current.body.observations.find((o) => o.observationId === observation.observationId);
    const sessionConflicts = retained2?.sessionConflicts ?? (effect ? [] : conflictingSessions(tx, current, observation));
    return appendObservation(current.body, { ...observation, sessionConflicts }, effect);
  });
  const retained = receipt.data.record.body.observations.find((o) => o.observationId === observation.observationId);
  if (!retained || !equal({ ...retained, sessionConflicts: [] }, observation)) {
    fail2("OPERATION_CONFLICT", "replayed operation has a different verified observation");
  }
  return receipt;
}
function conflictingSessions(tx, current, observation) {
  if (observation.source !== "host" || observation.facts.sessionId === null) return [];
  return tx.list("host-attempt").filter((record2) => record2.id !== current.id && record2.body.observations.some((o) => o.source === "host" && o.facts.sessionId === observation.facts.sessionId) && (current.body.context === "fresh-single-shot" || record2.subject?.kind !== current.subject?.kind || record2.subject?.id !== current.subject?.id || !sameActor(record2.body.target, current.body.target) || record2.body.profile !== current.body.profile || record2.body.independence_key !== current.body.independence_key)).map((record2) => record2.id).sort();
}
function recordHostResult(store, command2, observation) {
  return recordObservation(store, command2, observation, false);
}
function recordEffect(store, command2, observation) {
  if (command2?.kind === "effect.result") return recordObservation(store, command2, observation, true);
  const { context, cmd } = contextFor2(store, command2, ["effect.intent"]);
  return applyOperation(store, cmd, (_current, tx) => {
    const p = cmd.payload;
    const attempt = tx.get("host-attempt", p.attemptId);
    if (!bindsTask(attempt, p.taskId)) {
      fail2("EVIDENCE_GAP", "effect intent requires the exact persisted host attempt");
    }
    const task = actingTask(store, tx, cmd, context, attempt.body.target);
    if (attempt.body.subject_version !== task.version || attempt.body.status !== "intent") {
      fail2("RECOVERY_REQUIRED", "effect intent requires a current, unresolved execution intent");
    }
    noUnresolvedEffects(tx, task.id);
    if (tx.list("effect", { kind: "task", id: task.id }).some((record2) => p.idempotencyKey !== null && record2.body.idempotency_key === p.idempotencyKey)) {
      fail2("OPERATION_CONFLICT", "effect idempotency key is already retained; reconcile its result");
    }
    const body = {
      schema_version: 1,
      effect_id: cmd.recordId,
      attempt_id: p.attemptId,
      subject: { kind: "task", id: task.id },
      subject_version: task.version,
      actor: cmd.actor,
      intended_action: p.intendedAction,
      idempotency_key: p.idempotencyKey,
      external: p.external,
      paid: p.paid,
      created_at: p.createdAt,
      observations: []
    };
    return { ...body, ...effectSummary(body) };
  });
}

// src/core/lib/coordination-runtime/host-composition.mjs
var trustedHandlers = /* @__PURE__ */ new Map([
  ["artifact.register", { kind: "evidence", apply: (store, command2) => registerArtifact(store, command2) }],
  ["asset.transition", { kind: "evidence", apply: (store, command2) => transitionAsset(store, command2) }],
  ["evidence.register", {
    kind: "evidence",
    apply: (store, command2, options2) => registerEvidence(store, command2, options2.capture)
  }],
  ["review.record", { kind: "evidence", apply: (store, command2) => recordReview(store, command2) }],
  ["approval.record", { kind: "evidence", apply: (store, command2) => recordApproval(store, command2) }],
  ["attempt.start", { kind: "host", apply: (store, command2) => recordAttempt(store, command2) }],
  ["attempt.result", {
    kind: "host",
    apply: (store, command2, options2) => recordHostResult(store, command2, options2.capture)
  }],
  ["effect.intent", {
    kind: "host",
    apply: (store, command2, options2) => recordEffect(store, command2, options2.capture)
  }],
  ["effect.result", {
    kind: "host",
    apply: (store, command2, options2) => recordEffect(store, command2, options2.capture)
  }]
]);
function createTrustedEmbedding({
  identity,
  authorize,
  runs: runs2,
  verifyCapture,
  verifyOperatorDecision,
  verifyObservation,
  roster = [],
  profiles = {},
  capabilities,
  maxAttempts = 3
}) {
  if (typeof identity !== "function" || typeof authorize !== "function" || typeof runs2 !== "function") {
    throw new RuntimeError("INVALID_INPUT", "trusted embedding requires identity, authorize and runs functions");
  }
  return {
    async apply({ root, store, command: command2, options: options2 = {} }) {
      validateCommand(command2);
      const actual = identity();
      if (!actual || actual !== command2.actor.runId) {
        throw new RuntimeError("AUTHORITY_REQUIRED", "command actor must use the actual current host context ID");
      }
      const authority = await authorize({ root, store, command: command2, options: options2 });
      const approvedRuns = await runs2({ root, actor: command2.actor });
      if (!approvedRuns.every((run) => sameActor(run.actor, command2.actor))) {
        throw new RuntimeError("AUTHORITY_REQUIRED", "embedding must not relabel another producing context");
      }
      bindEvidenceRuntime(store, {
        root,
        authority,
        runs: approvedRuns,
        verifyCapture,
        verifyOperatorDecision
      });
      const handler = trustedHandlers.get(commandKind(command2.kind).handler);
      if (handler?.kind === "host") {
        bindHostRuntime(store, { root, authority, roster, profiles, capabilities, maxAttempts, verifyObservation });
      }
      if (handler) return handler.apply(store, command2, options2);
      return applyCommand(store, command2, authority);
    }
  };
}

// src/core/lib/coordination-runtime/native-context.mjs
var fail14 = (message) => {
  throw new RuntimeError("AUTHORITY_REQUIRED", message);
};
async function verifyNativeContext({ env, root, preparation, reservedAt }) {
  const id = contextIdentity(env);
  if (id !== preparation.actor.runId) fail14("prepared role belongs to another actual host context");
  let start, agent, firstModelAt;
  for await (const { event } of nativeEvents(env, ["session.start", "subagent.selected", "assistant.turn_start"])) {
    if (event.agentId) continue;
    if (event.type === "session.start") {
      if (start) fail14("standalone context has ambiguous session starts");
      start = {
        id: event.id,
        timestamp: event.timestamp,
        sessionId: event.data?.sessionId,
        version: event.data?.copilotVersion,
        cwd: event.data?.context?.cwd
      };
    } else if (event.type === "subagent.selected") {
      agent = event.data?.agentName;
    } else {
      if (!start || agent !== preparation.agentId) fail14("native model turn did not start in its prepared role");
      if (firstModelAt === void 0) firstModelAt = event.timestamp;
    }
  }
  if (!start || start.sessionId !== id || start.version !== "1.0.85" || typeof start.cwd !== "string" || normalized(start.cwd) !== normalized(root) || agent !== preparation.agentId) fail14("native session identity, workspace or selected agent does not match its preparation");
  if (!Number.isFinite(Date.parse(start.timestamp)) || Date.parse(start.timestamp) > Date.parse(firstModelAt) || !Number.isFinite(Date.parse(firstModelAt)) || !Number.isFinite(Date.parse(reservedAt)) || Date.parse(firstModelAt) < Date.parse(reservedAt) || Date.parse(firstModelAt) > Date.now()) {
    fail14("native model work must start after its persisted reservation/delegation");
  }
  return {
    sessionId: id,
    agentId: agent,
    firstModelAt,
    reservedAt,
    reference: `host:copilot:${id}:${start.id}`
  };
}

// src/core/lib/coordination-runtime/native-routing.mjs
var routingActions = /* @__PURE__ */ new Set([
  "task.grant",
  "task.promote",
  "task.update",
  "task.handoff",
  "question.open",
  "question.answer"
]);
var delegatedActions = /* @__PURE__ */ new Set(["question.answer", "task.handoff"]);
var parentGovernanceActions = new Set(PARENT_COMMAND_KINDS);
var fail15 = (message) => {
  throw new RuntimeError("AUTHORITY_REQUIRED", message);
};
function routingBasis(root, store, task) {
  return {
    criteria: criteriaRef(task, (kind, id) => readRecord(store, kind, id)),
    inputs: captureInputBasis(
      { root },
      { get: (kind, id) => readRecord(store, kind, id) },
      task.body.context_artifacts
    ),
    feature: task.body.feature_id,
    requirements: task.body.satisfies,
    scopeAuthority: task.body.scope_authority,
    touches: task.body.touches,
    dependencies: task.body.depends_on
  };
}
function requireRoutingScope(root, store, cap, command2 = null) {
  const scope = cap.request.scope;
  const task = readRecord(store, "task", scope.taskId);
  if (!task || canonicalJson(routingBasis(root, store, task)) !== canonicalJson(cap.request.routingBasis)) {
    fail15("coordinator/delegation criteria, inputs or work scope changed");
  }
  if (!command2) return task;
  if (command2.recordKind !== "task" || command2.recordId !== scope.taskId || !scope.actions.includes(command2.kind) || !routingActions.has(command2.kind)) fail15("bounded routing does not grant this domain action");
  if (command2.kind === "task.handoff" && (command2.payload.state !== null || command2.payload.subject !== void 0)) {
    fail15("bounded routing cannot supply a new subject or domain/acceptance transition");
  }
  if (command2.kind === "task.update" && Object.keys(command2.payload.changes ?? command2.payload).some((k) => !["next_role", "priority", "title", "updated_at"].includes(k))) {
    fail15("bounded routing cannot change requirements, inputs or product scope");
  }
  if (command2.kind === "question.answer") {
    const question = readRecord(store, "question", command2.payload.questionId);
    if (question?.subject?.kind !== "task" || question.subject.id !== task.id || question.body.recipient !== command2.actor.role || command2.actor.role === "operator" || command2.payload.content.resolves || scope.type === "delegation" && command2.payload.questionId !== scope.questionId) {
      fail15("bounded answer requires the exact addressed non-operator question; conflict resolution needs separate authority");
    }
  }
  return task;
}

// src/core/lib/coordination-runtime/native-host.mjs
var DATABASE = COORDINATION_DATABASE;
var fail16 = (code, message) => {
  throw new RuntimeError(code, message);
};
var hash2 = (value) => createHash7("sha256").update(canonicalJson(value)).digest("hex");
var exact2 = (value, keys, label) => assertExactKeys(value, new Set(keys), label);
var manifestHash = (root) => hash2(JSON.parse(exactFile(root, ".kai/manifest.json")));
var runActions = new Set([...COMMAND_KINDS].filter((k) => !PARENT_COMMAND_KINDS.has(k) && !k.startsWith("attempt.") && !k.startsWith("effect.") && k !== "task.create"));
var commandActions = (command2) => [command2.kind, ...command2.kind === "task.handoff" && command2.payload.state !== null ? ["task.transition"] : []];
function currentBasis(root, id) {
  const store = openStore({ path: safePath(root, DATABASE), mode: "read" });
  try {
    const task = readRecord(store, "task", id) ?? fail16("EVIDENCE_GAP", "run scope requires an existing Task");
    return taskBasis(root, store, task);
  } finally {
    closeStore(store);
  }
}
function taskBasis(root, store, task) {
  return {
    subject: task.body.change_ref,
    criteria: criteriaRef(task, (kind, id) => readRecord(store, kind, id)),
    inputs: captureInputBasis({ root }, { get: (kind, id) => readRecord(store, kind, id) }, task.body.context_artifacts)
  };
}
function commandBasis(root, store, command2) {
  const task = readRecord(store, "task", command2.recordId) ?? fail16("EVIDENCE_GAP", "command scope requires an existing Task");
  const changes = command2.kind === "task.update" ? command2.payload.changes : null;
  if (!changes || !Object.hasOwn(changes, "context_artifacts")) return taskBasis(root, store, task);
  if (command2.actor.role !== task.body.scope_authority) {
    fail16("AUTHORITY_REQUIRED", "prospective context replacement requires the actual scope owner decision");
  }
  const prospective = validateRecord({ ...task, body: { ...task.body, ...changes } });
  const tx = { get: (kind, id) => readRecord(store, kind, id) };
  const priorBasis = {
    subject: task.body.change_ref,
    criteria: criteriaRef(task, (kind, id) => readRecord(store, kind, id)),
    inputs: [],
    gaps: []
  };
  for (const reference of [...new Set(task.body.context_artifacts)].sort()) {
    try {
      priorBasis.inputs.push(...captureInputBasis({ root }, tx, [reference]));
    } catch (error) {
      if (!(error instanceof RuntimeError) || error.code !== "EVIDENCE_GAP") throw error;
      priorBasis.gaps.push({ reference, code: error.code, message: error.message });
    }
  }
  return { priorBasis, prospectiveBasis: taskBasis(root, store, prospective) };
}
function requestCommandBasis(root, command2) {
  const store = openStore({ path: safePath(root, DATABASE), mode: "read" });
  try {
    return commandBasis(root, store, command2);
  } finally {
    closeStore(store);
  }
}
function visibleRequest(payload) {
  const { nonce, createdAt, expiresAt, ...scope } = payload;
  return {
    ...payload,
    message: `Kai operator authorization
Workspace: ${payload.root}
Nonce: ${nonce}
Scope (exact canonical binding):
${canonicalJson(scope)}
Expires: ${expiresAt}
Approve only this actor, workspace, subject, criteria and action. Reply exactly APPROVE ${nonce} or DECLINE ${nonce}. Conditional/freeform replies do not authorize work.`,
    requestedSchema: { type: "object", properties: { decision: {
      type: "string",
      enum: [`APPROVE ${nonce}`, `DECLINE ${nonce}`]
    } }, required: ["decision"], additionalProperties: false }
  };
}
async function captureReceipt(env, request, toolCallId) {
  const receipt = await readNativeTool({
    env,
    toolCallId,
    toolNames: ["powershell"],
    matchesStart: (args) => args?.command === request.command
  });
  if (receipt.start.arguments?.command !== request.command || receipt.start.arguments.mode === "async" || Date.parse(receipt.start.timestamp) < Date.parse(request.createdAt) || receipt.complete.success !== true) {
    fail16("EVIDENCE_GAP", "capture requires the exact completed native command issued after its scoped intent; no automatic execution/retry");
  }
  return receipt;
}
function createNativeHost({ env = process.env, discover } = {}) {
  const identity = () => contextIdentity(env);
  const discovery = async (root, role) => discover ? discover({ root, role }) : (await Promise.resolve(native_discovery_exports)).discoverCopilot({ root, env, role });
  const ensureIdentity = (actor) => {
    validateActor(actor);
    if (actor.runId !== identity()) fail16("AUTHORITY_REQUIRED", "actor runId must match COPILOT_AGENT_SESSION_ID; role relabeling does not create independence");
  };
  function capability(root, id, currentContext = true) {
    const cap = readIssued(root, "capabilities", id);
    if (cap.request.root !== root || cap.request.workspaceManifest !== manifestHash(root) || Date.parse(cap.request.expiresAt) <= Date.now()) fail16("AUTHORITY_REQUIRED", "issued capability expired or workspace binding changed");
    if (currentContext && cap.request.requesterContext !== identity()) fail16("AUTHORITY_REQUIRED", "capability belongs to a different actual host context");
    return cap;
  }
  function preparation(root, actor) {
    const prepared = readIssued(root, "preparations", actor.runId);
    if (!sameActor(prepared.actor, actor) || prepared.root !== root || prepared.workspaceManifest !== manifestHash(root) || Date.parse(prepared.expiresAt) <= Date.now()) {
      fail16("AUTHORITY_REQUIRED", "native preparation actor, workspace or lifetime does not match");
    }
    return prepared;
  }
  async function delegatedContext(root, store, cap, command2) {
    const scope = cap.request.scope;
    const parent = capability(root, cap.parentCapability, false);
    if (parent.request.scope.type !== "coordination" || parent.request.scope.taskId !== scope.taskId || scope.actions.some((a) => !delegatedActions.has(a) || !parent.request.scope.actions.includes(a))) {
      fail16("AUTHORITY_REQUIRED", "delegation is not a bounded subset of an actual coordinator grant");
    }
    requireRoutingScope(root, store, parent);
    requireRoutingScope(root, store, cap, command2);
    const prepared = preparation(root, scope.actor);
    const context = await verifyNativeContext({ env, root, preparation: prepared, reservedAt: cap.request.createdAt });
    return { prepared, context };
  }
  async function leaseContext(root, store, actor, taskId, token) {
    const task = readRecord(store, "task", taskId);
    const lease = task?.body.lease;
    const grant = lease && lease.token === token && sameActor(lease.holder, actor) && Date.parse(lease.expires_at) > Date.now() && listRecords(store, { kind: "grant", subject: { kind: "task", id: taskId } }).find((r) => sameActor(r.body.actor, actor) && r.body.lease_token === token && r.body.status === "active" && Date.parse(r.body.expires_at) > Date.now());
    if (!grant) fail16("AUTHORITY_REQUIRED", "the actual actor must hold a live persisted lease or bounded delegation");
    const reserved = readIssued(root, "reservations", token);
    if (reserved.taskId !== taskId || !sameActor(reserved.actor, actor) || reserved.leaseToken !== token) {
      fail16("AUTHORITY_REQUIRED", "native reservation is not bound to this persisted lease");
    }
    const prepared = preparation(root, actor);
    const context = await verifyNativeContext({ env, root, preparation: prepared, reservedAt: reserved.reservedAt });
    return { prepared, context, grant, leaseToken: token };
  }
  return {
    async capabilities({ root }) {
      return { discovery: await discovery(root) };
    },
    async prepare({ root, body }) {
      exact2(body, ["role"], "native preparation");
      if (typeof body.role !== "string" || !body.role || body.role === "operator") fail16("INVALID_INPUT", "prepare requires a non-operator native role");
      const requesterContext = identity();
      const catalog = await discovery(root, body.role);
      const actor = catalog.prepared?.actor;
      if (!actor || actor.role !== body.role || !catalog.roster.some((r) => r.id === catalog.prepared.agentId && r.role === actor.role) || catalog.modelPromptSent !== false || catalog.transportClosed !== true) {
        fail16("UNSUPPORTED_HOST", "host did not supply a metadata-only prepared native context");
      }
      const id = capabilityId(actor.runId);
      const prepared = {
        id,
        actor,
        agentId: catalog.prepared.agentId,
        root,
        workspaceManifest: manifestHash(root),
        requesterContext,
        catalog,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: new Date(Date.now() + 36e5).toISOString(),
        reserved: false
      };
      writeIssued(root, "preparations", id, prepared);
      const launch = copilotLaunch(env);
      return {
        preparation: prepared,
        discovery: catalog,
        launch: { executable: launch.executable, arguments: [`--session-id=${id}`, `--agent=${prepared.agentId}`, ...launch.pluginArguments] },
        instruction: "Metadata only; not permission to start model work. First persist task.grant or delegate to this actor. Then launch this standalone context in this workspace using these identity arguments and existing host permissions. Its first command should be claim. Native ACP metadata-only sessions are not promised to survive transport closure."
      };
    },
    async delegate({ root, store, body, options: options2 }) {
      exact2(body, ["actor", "taskId", "preparation", "actions", "questionId"], "role delegation");
      ensureIdentity(body.actor);
      const parent = capability(root, options2.capability);
      if (parent.request.scope.type !== "coordination" || !sameActor(parent.request.scope.actor, body.actor) || parent.request.scope.taskId !== body.taskId || !Array.isArray(body.actions) || !body.actions.length || new Set(body.actions).size !== body.actions.length || body.actions.some((a) => !delegatedActions.has(a) || !parent.request.scope.actions.includes(a))) {
        fail16("AUTHORITY_REQUIRED", "delegation requires an already-authorized coordinator and explicit bounded role-owned actions");
      }
      const task = requireRoutingScope(root, store, parent);
      const prepared = readIssued(root, "preparations", body.preparation);
      preparation(root, prepared.actor);
      if (prepared.requesterContext !== identity()) fail16("AUTHORITY_REQUIRED", "only the preparing coordinator can delegate this context");
      const question = body.questionId === null ? null : readRecord(store, "question", body.questionId);
      if (body.actions.includes("question.answer") && (question?.subject?.kind !== "task" || question.subject.id !== body.taskId || question.body.recipient !== prepared.actor.role || prepared.actor.role === "operator")) {
        fail16("AUTHORITY_REQUIRED", "answer delegation must bind the actual addressed role and question");
      }
      if (!body.actions.includes("question.answer") && body.questionId !== null) fail16("INVALID_INPUT", "question binding is only for an answer delegation");
      if (!question && ![task.body.next_role, task.body.scope_authority].includes(prepared.actor.role)) {
        fail16("AUTHORITY_REQUIRED", "handoff delegation must be assigned to the current routed role or scope owner");
      }
      const nonce = randomUUID3();
      const request = {
        nonce,
        root,
        workspaceManifest: manifestHash(root),
        requesterContext: prepared.actor.runId,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: new Date(Math.min(
          Date.parse(parent.request.expiresAt),
          Date.parse(prepared.expiresAt)
        )).toISOString(),
        routingBasis: parent.request.routingBasis,
        scope: {
          type: "delegation",
          actor: prepared.actor,
          taskId: body.taskId,
          actions: body.actions,
          questionId: body.questionId
        }
      };
      writeIssued(root, "capabilities", nonce, { request, parentCapability: options2.capability, catalog: prepared.catalog });
      return { capability: nonce, actor: prepared.actor, expiresAt: request.expiresAt, reservedAt: request.createdAt };
    },
    async claim({ root, store, options: options2 }) {
      const prepared = readIssued(root, "preparations", identity());
      preparation(root, prepared.actor);
      if (options2.capability) {
        const cap = capability(root, options2.capability);
        if (cap.request.scope.type !== "delegation" || cap.request.scope.taskId !== options2.task || !sameActor(cap.request.scope.actor, prepared.actor)) fail16("AUTHORITY_REQUIRED", "claim requires this prepared actor and exact delegated Task");
        const { context } = await delegatedContext(root, store, cap);
        return { actor: prepared.actor, context, actions: cap.request.scope.actions, leaseToken: null };
      }
      const lease = readRecord(store, "task", options2.task)?.body.lease;
      const bound = await leaseContext(root, store, prepared.actor, options2.task, lease?.token);
      return { actor: prepared.actor, context: bound.context, actions: bound.grant.body.actions, leaseToken: bound.leaseToken };
    },
    async request({ root, body }) {
      const requesterContext = identity();
      const payload = {
        nonce: randomUUID3(),
        root,
        workspaceManifest: manifestHash(root),
        requesterContext,
        createdAt: (/* @__PURE__ */ new Date()).toISOString(),
        expiresAt: new Date(Date.now() + 60 * 60 * 1e3).toISOString(),
        scope: body
      };
      if (body.type === "command") {
        exact2(body, ["type", "command"], "command request");
        validateCommand(body.command);
        ensureIdentity(body.command.actor);
        payload.subject = body.command.payload.body?.subject ?? body.command.payload.subject ?? null;
        payload.criteria = body.command.payload.body?.criteria_ref ?? null;
        payload.action = body.command.kind;
        if (body.command.recordKind === "task" && body.command.expectedVersion > 0) {
          Object.assign(payload, requestCommandBasis(root, body.command));
        }
      } else if (body.type === "coordination") {
        exact2(body, ["type", "actor", "taskId", "actions"], "coordination request");
        ensureIdentity(body.actor);
        if (body.actor.role === "operator" || !Array.isArray(body.actions) || !body.actions.length || new Set(body.actions).size !== body.actions.length || body.actions.some((a) => !routingActions.has(a))) {
          fail16("INVALID_INPUT", "coordination actions must be explicit non-operator routing actions, not acceptance");
        }
        const store = openStore({ path: safePath(root, DATABASE), mode: "read" });
        try {
          const task = readRecord(store, "task", body.taskId) ?? fail16("EVIDENCE_GAP", "coordination requires an existing Task");
          payload.routingBasis = routingBasis(root, store, task);
        } finally {
          closeStore(store);
        }
        payload.action = body.actions;
      } else if (body.type === "run") {
        exact2(body, ["type", "actor", "taskId", "actions"], "run request");
        ensureIdentity(body.actor);
        if (body.actor.role === "operator" || !Array.isArray(body.actions) || !body.actions.length || new Set(body.actions).size !== body.actions.length || body.actions.some((a) => !runActions.has(a))) {
          fail16("INVALID_INPUT", "run actions must be explicit supported Task actions for a non-operator");
        }
        Object.assign(payload, currentBasis(root, body.taskId), { action: body.actions });
      } else if (body.type === "capture") {
        exact2(body, ["type", "actor", "taskId", "command", "checks", "classification"], "capture request");
        ensureIdentity(body.actor);
        if (typeof body.command !== "string" || !body.command.trim() || Buffer.byteLength(body.command) > 32 * 1024 || !Array.isArray(body.checks) || body.checks.length > 64 || body.checks.some((c) => typeof c !== "string" || !c.trim() || c.length > 256) || new Set(body.checks).size !== body.checks.length || !CLASSIFICATIONS.has(body.classification) || body.taskId !== null && (typeof body.taskId !== "string" || !body.taskId)) {
          fail16("INVALID_INPUT", "capture needs an exact PowerShell command, bounded check labels, classification and taskId|null");
        }
        if (body.taskId !== null) Object.assign(payload, currentBasis(root, body.taskId));
        else {
          payload.subject = null;
          payload.criteria = null;
          payload.inputs = [];
        }
        const request2 = {
          ...payload,
          command: `# Kai capture ${payload.nonce}
${body.command}`,
          instruction: "Run this exact command once through the existing authorized native PowerShell tool. This request neither authorizes nor executes it. Then use receipt/capture with this request nonce; --tool-call is optional when known. Never replay an uncertain effect."
        };
        writeIssued(root, "requests", request2.nonce, request2);
        return { request: request2 };
      } else fail16("INVALID_INPUT", "request type must be command, run, coordination or capture");
      const request = visibleRequest(payload);
      writeIssued(root, "requests", request.nonce, request);
      return { request };
    },
    async receipt({ root, options: options2 }) {
      const request = readIssued(root, "requests", options2.request);
      if (request.root !== root || request.workspaceManifest !== manifestHash(root) || Date.parse(request.expiresAt) <= Date.now()) fail16("AUTHORITY_REQUIRED", "request expired or workspace changed");
      if (request.scope.type === "capture") {
        if (request.requesterContext !== identity()) fail16("AUTHORITY_REQUIRED", "capture receipt belongs to another context");
        const receipt2 = await captureReceipt(env, request, options2["tool-call"]);
        return { receipt: {
          toolCallId: receipt2.toolCallId,
          sessionId: receipt2.sessionId,
          startEventId: receipt2.start.id,
          completeEventId: receipt2.complete.id,
          capturedAt: receipt2.complete.timestamp
        } };
      }
      const receipt = await matchHumanDecision({ env, request, toolCallId: options2["tool-call"] });
      return { receipt };
    },
    async authorize({ root, options: options2 }) {
      const request = readIssued(root, "requests", options2.request);
      if (request.scope.type === "capture") fail16("INVALID_INPUT", "capture intents are not authorization requests");
      if (request.scope.type === "coordination" && request.scope.actions.some((action) => !routingActions.has(action))) {
        fail16("INVALID_INPUT", "coordination request contains unsupported routing actions; issue a new supported request");
      }
      if (request.root !== root || request.workspaceManifest !== manifestHash(root) || Date.parse(request.expiresAt) <= Date.now()) {
        fail16("AUTHORITY_REQUIRED", "request expired or workspace changed");
      }
      const receipt = await matchHumanDecision({ env, request, toolCallId: options2["tool-call"] });
      const actor = request.scope.command?.actor ?? request.scope.actor;
      let catalog;
      if (existsSync9(safePath(root, `.kai/core/runtime/host/capabilities/${request.nonce}.json`))) {
        const existing = readIssued(root, "capabilities", request.nonce);
        if (canonicalJson(existing.request) !== canonicalJson(request) || canonicalJson(existing.receipt) !== canonicalJson(receipt)) {
          fail16("OPERATION_CONFLICT", "this nonce already has a different issued decision receipt");
        }
        catalog = existing.catalog;
      } else catalog = await discovery(root);
      if (actor && actor.role !== "operator" && !catalog.roster.some((entry) => entry.role === actor.role)) {
        fail16("ROLE_UNAVAILABLE", "requested actor role is not in the actual host roster");
      }
      writeIssued(root, "capabilities", request.nonce, { request, receipt, catalog });
      return {
        capability: request.nonce,
        actor: actor ?? null,
        expiresAt: request.expiresAt,
        receipt: { reference: receipt.reference, captured_at: receipt.captured_at }
      };
    },
    async apply({ root, store, command: command2, options: options2 }) {
      ensureIdentity(command2.actor);
      const cap = options2.capability ? capability(root, options2.capability) : null;
      let catalog, grants = [];
      if (cap) {
        const scope = cap.request.scope;
        if (scope.type === "command") {
          if (canonicalJson(scope.command) !== canonicalJson(command2)) fail16("AUTHORITY_REQUIRED", "command capability does not cover these exact command bytes");
          if (cap.request.prospectiveBasis) {
            const priorReceipt = readOperationReceipt(store, command2);
            if (priorReceipt) return priorReceipt;
            if (canonicalJson(commandBasis(root, store, command2)) !== canonicalJson({
              priorBasis: cap.request.priorBasis,
              prospectiveBasis: cap.request.prospectiveBasis
            })) fail16("EVIDENCE_GAP", "prospective replacement or explicit prior basis gaps changed after decision");
          } else if (cap.request.inputs) {
            const current = readRecord(store, "task", command2.recordId);
            const basis = current && taskBasis(root, store, current);
            if (!basis || canonicalJson(basis.inputs) !== canonicalJson(cap.request.inputs)) fail16("EVIDENCE_GAP", "command capability applicable input basis changed");
          }
        } else if (scope.type === "run") {
          const task = readRecord(store, "task", scope.taskId);
          if (!sameActor(scope.actor, command2.actor) || command2.recordKind !== "task" || command2.recordId !== scope.taskId || commandActions(command2).some((action) => !scope.actions.includes(action)) || !task || canonicalJson(taskBasis(root, store, task)) !== canonicalJson({
            subject: cap.request.subject,
            criteria: cap.request.criteria,
            inputs: cap.request.inputs
          })) {
            fail16("AUTHORITY_REQUIRED", "run capability does not cover the actor, action, subject and current input criteria");
          }
          if (command2.kind === "approval.record" && task.body.artifact_class === "paid-media") {
            fail16("AUTHORITY_REQUIRED", "paid-media approval requires a command-specific actual human decision");
          }
        } else if (scope.type === "coordination" || scope.type === "delegation") {
          if (!sameActor(scope.actor, command2.actor)) fail16("AUTHORITY_REQUIRED", "routing capability belongs to a different role/context");
          requireRoutingScope(root, store, cap, command2);
          if (scope.type === "delegation") await delegatedContext(root, store, cap, command2);
        } else fail16("AUTHORITY_REQUIRED", "not an execution capability");
        catalog = cap.catalog;
        grants = [{
          actor: command2.actor,
          actions: commandActions(command2),
          recordKind: command2.recordKind,
          recordId: command2.recordId,
          basisRef: `${command2.recordKind}/${command2.recordId}@${command2.expectedVersion}`
        }];
        if (["attempt.start", "effect.intent"].includes(command2.kind)) grants.push({
          actor: command2.actor,
          actions: [command2.kind],
          recordKind: "task",
          recordId: command2.payload.taskId,
          basisRef: subjectRef({ kind: "task", id: command2.payload.taskId }, command2.payload.taskVersion)
        });
      } else {
        const bound = await leaseContext(root, store, command2.actor, command2.recordId, command2.leaseToken);
        if (commandActions(command2).some((a) => !bound.grant.body.actions.includes(a))) fail16("AUTHORITY_REQUIRED", "lease does not authorize the complete command");
        catalog = bound.prepared.catalog;
      }
      if (command2.kind === "task.grant") preparation(root, command2.payload.holder);
      let capture;
      if (options2.capture) capture = readIssued(root, "captures", options2.capture);
      const decision = () => {
        if (!cap || cap.request.scope.type !== "command" || command2.kind !== "approval.record") return null;
        const { source, reference, attributed_to, captured_at } = cap.receipt;
        const b = command2.payload.body;
        return { source, reference, attributed_to, captured_at, ...Object.fromEntries(
          ["subject", "content_ref", "criteria_ref", "kind", "decision", "deployment", "recovery"].map((k) => [k, b[k]])
        ) };
      };
      const embedding = createTrustedEmbedding({
        identity,
        authorize: () => ({ roles: catalog.roster.map((e) => e.role), grants }),
        runs: ({ actor }) => {
          const taskId = command2.recordKind === "task" ? command2.recordId : command2.payload.taskId ?? readRecord(store, command2.recordKind, command2.recordId)?.subject?.id;
          const task = taskId ? readRecord(store, "task", taskId) : null;
          return [{
            actor,
            directory: `.kai/${task?.body.pack ?? "core"}/reports/native-${hash2(actor).slice(0, 16)}/scratch`
          }];
        },
        verifyCapture: (c) => {
          if (!capture || capture.type !== "command" || !sameActor(capture.actor, c.actor) || capture.root !== root || capture.taskId !== c.recordId || canonicalJson(capture.subject) !== canonicalJson(c.payload.body.content_ref) || capture.criteria !== c.payload.body.criteria_ref || canonicalJson(capture.inputs) !== canonicalJson(taskBasis(root, store, readRecord(store, "task", c.recordId)).inputs)) {
            fail16("EVIDENCE_GAP", "no host-owned capture for this actor, Task, subject and current input criteria");
          }
          return { ...capture.proof, command_digest: commandDigest(c) };
        },
        verifyOperatorDecision: decision,
        verifyObservation: () => {
          fail16("UNSUPPORTED_HOST", "native terminal tool receipts do not prove peer model execution or external effect outcome; bind an actual host-owned observation registry through createTrustedEmbedding");
        },
        roster: catalog.roster,
        profiles: catalog.profiles,
        capabilities: catalog.capabilities
      });
      const result = await embedding.apply({ root, store, command: command2, options: options2 });
      const lease = command2.kind === "task.grant" && result.data.record.body.lease;
      if (lease) {
        const name = `.kai/core/runtime/host/reservations/${lease.token}.json`;
        if (!existsSync9(safePath(root, name))) writeIssued(root, "reservations", lease.token, {
          taskId: command2.recordId,
          actor: lease.holder,
          leaseToken: lease.token,
          operationId: command2.operationId,
          reservedAt: (/* @__PURE__ */ new Date()).toISOString()
        });
        else readIssued(root, "reservations", lease.token);
      }
      return result;
    },
    async plan({ root, store, taskId }) {
      const catalog = await discovery(root);
      const task = readRecord(store, "task", taskId) ?? fail16("EVIDENCE_GAP", "Task does not exist");
      return {
        ...planDispatch({ task: task.body, ...catalog }),
        gap: "No automatic peer dispatch or effect replay. For each queued native role: prepare, persist task.grant or delegate, then launch the standalone --session-id context with existing host permissions. Inspect claim before acting; metadata preparation alone does not authorize model work."
      };
    },
    async capture({ root, body, options: options2 }) {
      exact2(body, ["requestId"], "capture delivery");
      const request = readIssued(root, "requests", body.requestId);
      if (request.scope.type !== "capture" || request.root !== root || request.workspaceManifest !== manifestHash(root) || request.requesterContext !== identity() || Date.parse(request.expiresAt) <= Date.now()) fail16("AUTHORITY_REQUIRED", "capture request is not current for this workspace and host context");
      const receipt = await captureReceipt(env, request, options2["tool-call"]);
      const result = receipt.complete.content;
      if (typeof result !== "string" || Buffer.byteLength(result) > 1024 * 1024) fail16("EVIDENCE_GAP", "native command result is missing or exceeds 1 MiB; capture a bounded existing check");
      for (const line of result.split(/\r?\n/)) {
        let event;
        try {
          event = JSON.parse(line);
        } catch {
          continue;
        }
        if (typeof event?.type === "string" && /^(assistant|model|session|user)\./.test(event.type)) {
          fail16("UNSUPPORTED_HOST", "native model/event streams require an allowlisted host-owned observation adapter; command capture never retains reasoning/cache internals");
        }
      }
      const exit = /(?:^|\n)<shellId: [^\r\n<>]+ completed with exit code (-?\d+)>\s*$/.exec(result);
      if (!exit || !Number.isSafeInteger(Number(exit[1]))) {
        fail16("UNSUPPORTED_HOST", "native command is partial or has an unsupported completion format; inspect/reconcile it, never automatically replay");
      }
      const proof = {
        source: "host-command",
        reference: `host:copilot:${receipt.sessionId}:${receipt.complete.id}`,
        actor: request.scope.actor,
        captured_at: receipt.complete.timestamp,
        command: ["powershell", "-Command", receipt.start.arguments.command],
        exit_code: Number(exit[1]),
        checks: request.scope.checks,
        classification: request.scope.classification
      };
      const capture = {
        type: "command",
        root,
        actor: request.scope.actor,
        taskId: request.scope.taskId,
        subject: request.subject,
        criteria: request.criteria,
        inputs: request.inputs,
        proof,
        result,
        toolCallId: receipt.toolCallId,
        startEventId: receipt.start.id,
        completeEventId: receipt.complete.id
      };
      writeIssued(root, "captures", request.nonce, capture);
      return {
        capture: request.nonce,
        exitCode: proof.exit_code,
        capturedAt: proof.captured_at,
        capturedCommand: receipt.start.arguments.command,
        reference: proof.reference,
        classification: proof.classification,
        resultBytes: Buffer.byteLength(result)
      };
    }
  };
}

// src/core/lib/coordination-runtime/cli.mjs
import { existsSync as existsSync11 } from "node:fs";

// src/core/lib/coordination-runtime/inspection.mjs
import { existsSync as existsSync10 } from "node:fs";
function inspectRuntime(root, { env = process.env, intent = "coordinate" } = {}) {
  const result = { errors: [], warnings: [], runtime: null };
  if (!["inspect", "coordinate"].includes(intent)) {
    result.errors.push("workspace intent must be inspect or coordinate");
    return result;
  }
  let store;
  try {
    const current = readWorkspaceManifest(root);
    if (!current.ok) {
      result.errors.push(current.reason);
      return result;
    }
    if (current.manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
      result.errors.push(
        "workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard"
      );
      return result;
    }
    const validation = validateSchema5Manifest(root, current.manifest, { env });
    result.errors.push(...validation.errors);
    const privacy = inspectGitPrivacy(root, current.manifest.placement);
    result.errors.push(...privacy.errors, ...privacy.missing.map((path4) => `private workspace path must be ignored: ${path4}`));
    if (current.manifest.placement === "repo-local" && !privacy.gitRoot) {
      result.errors.push("repo-local placement requires a readable Git work tree");
    }
    result.warnings.push(...privacy.warnings);
    try {
      readDirection({ workspaceRoot: root, manifest: current.manifest });
    } catch (error) {
      result.errors.push(error.message);
    }
    if (result.errors.length) return result;
    const databasePath = safePath(root, COORDINATION_DATABASE);
    if (!existsSync10(databasePath)) {
      result.errors.push(`schema 5 coordination database is missing at ${COORDINATION_DATABASE}`);
      return result;
    }
    exactFile(root, COORDINATION_DATABASE);
    store = openStore({ path: databasePath, mode: "read" });
    result.runtime = readStoreSummary(store);
  } catch (error) {
    result.errors.push(error.message);
  } finally {
    closeStore(store);
  }
  return result;
}

// src/core/lib/coordination-runtime/report-safety.mjs
import { createHash as createHash8 } from "node:crypto";
var hash3 = (value) => createHash8("sha256").update(value).digest("hex");
var knownGap = (error) => error instanceof RuntimeError && ["EVIDENCE_GAP", "AUTHORITY_REQUIRED", "INVALID_INPUT"].includes(error.code);
var tokenKey = (key2) => /^token$|lease.*token$/i.test(key2);
function possibleBearerSuffix(text2, secret) {
  const prefix = secret.slice(0, Math.min(text2.length, secret.length - 1));
  const fallback = new Uint32Array(prefix.length);
  let matched = 0;
  for (let i = 1; i < prefix.length; i++) {
    while (matched && prefix[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (prefix[i] === prefix[matched]) matched++;
    fallback[i] = matched;
  }
  matched = 0;
  for (let i = text2.length - prefix.length; i < text2.length; i++) {
    while (matched && text2[i] !== prefix[matched]) matched = fallback[matched - 1];
    if (text2[i] === prefix[matched]) matched++;
  }
  return matched;
}
function redactPreview(preview, secrets, notice) {
  const text2 = preview.content;
  if (!secrets.size) return { content: text2, boundaryWithheldBytes: 0 };
  const patterns = new Set(secrets);
  if (preview.encoding === "latin1") {
    for (const secret of secrets) patterns.add(Buffer.from(secret.slice(0, text2.length + 1)).toString("latin1"));
  }
  const masked = new Uint8Array(text2.length);
  const mark = (start, end, flag) => {
    if (preview.encoding === "utf8") {
      if (/[\uDC00-\uDFFF]/.test(text2[start]) && /[\uD800-\uDBFF]/.test(text2[start - 1])) start--;
      if (/[\uD800-\uDBFF]/.test(text2[end - 1]) && /[\uDC00-\uDFFF]/.test(text2[end])) end++;
    }
    for (let i = start; i < end; i++) if (!masked[i]) masked[i] = flag;
  };
  let boundaryStart = text2.length;
  for (const secret of patterns) {
    let markedThrough = 0;
    for (let start = text2.indexOf(secret); start !== -1; start = text2.indexOf(secret, start + 1)) {
      mark(Math.max(start, markedThrough), start + secret.length, 1);
      markedThrough = start + secret.length;
      notice.occurrences++;
    }
    if (preview.previewState === "limited") {
      boundaryStart = Math.min(boundaryStart, text2.length - possibleBearerSuffix(text2, secret));
    }
  }
  let boundaryWithheldBytes = 0;
  if (boundaryStart < text2.length) {
    mark(boundaryStart, text2.length, 2);
    for (let start = 0; start < text2.length; ) {
      if (masked[start] !== 2) {
        start++;
        continue;
      }
      let end = start + 1;
      while (masked[end] === 2) end++;
      boundaryWithheldBytes += Buffer.byteLength(text2.slice(start, end), preview.encoding);
      start = end;
    }
    if (boundaryWithheldBytes) notice.boundaries++;
  }
  const parts = [];
  for (let start = 0; start < text2.length; ) {
    let end = start;
    let flags = 0;
    const withheld = !!masked[start];
    while (end < text2.length && !!masked[end] === withheld) flags |= masked[end++];
    parts.push(!withheld ? text2.slice(start, end) : flags & 2 ? "[withheld possible bearer-boundary]" : "[redacted bearer]");
    start = end;
  }
  return { content: parts.join(""), boundaryWithheldBytes };
}
function redaction(value) {
  const secrets = /* @__PURE__ */ new Set();
  const notice = { fields: 0, occurrences: 0, boundaries: 0 };
  const previews = new Set(value?.inspection?.artifactPreviews ?? []);
  function find(entry) {
    if (!entry || typeof entry !== "object") return;
    for (const [key2, child] of Object.entries(entry)) {
      if (tokenKey(key2) && typeof child === "string" && child) secrets.add(child);
      else find(child);
    }
  }
  find(value);
  function cleanText(entry, replaceKnown = true) {
    if (replaceKnown) for (const secret of secrets) entry = entry.replaceAll(secret, () => {
      notice.occurrences++;
      return "[redacted bearer]";
    });
    entry = entry.replace(/\bBearer\s+[A-Za-z0-9._~+/-]+=*/gi, () => {
      notice.occurrences++;
      return "[redacted bearer]";
    }).replace(/("(?:token|[^"]*lease[^"]*token)"\s*:\s*")([^"]+)(")/gi, (match, start, value2, end) => {
      if (value2 === "[redacted bearer]") return match;
      notice.occurrences++;
      return `${start}[redacted bearer]${end}`;
    });
    return entry;
  }
  function clean(entry) {
    if (typeof entry === "string") return cleanText(entry);
    if (Array.isArray(entry)) return entry.map(clean);
    if (!entry || typeof entry !== "object") return entry;
    const preview = previews.has(entry) && typeof entry.content === "string" ? redactPreview(entry, secrets, notice) : null;
    const result = Object.fromEntries(Object.entries(entry).filter(([key2]) => {
      if (!tokenKey(key2)) return true;
      notice.fields++;
      return false;
    }).map(([key2, child]) => [key2, preview && key2 === "content" ? cleanText(preview.content, false) : clean(child)]));
    if (preview?.boundaryWithheldBytes) {
      result.boundaryWithheldBytes = (entry.boundaryWithheldBytes ?? 0) + preview.boundaryWithheldBytes;
    }
    return result;
  }
  return { value: clean(value), notice };
}
function redactReport(value) {
  const result = redaction(value);
  const boundaries = (value.redactions?.boundaries ?? 0) + result.notice.boundaries;
  return { ...result.value, redactions: {
    fields: (value.redactions?.fields ?? 0) + result.notice.fields,
    occurrences: (value.redactions?.occurrences ?? 0) + result.notice.occurrences,
    ...boundaries || value.redactions?.boundaries !== void 0 ? { boundaries } : {}
  } };
}
var artifactPreviewLimits = Object.freeze({ perArtifactBytes: 64 * 1024, aggregateBytes: 1024 * 1024 });
var snapshotWarning = "Snapshot \u2014 not live. Recorded lifecycle is historical truth, not a new acceptance or shipping decision. Current proof checks and their gaps are listed; historical proof is not reaccepted. Files can change after generation.";

// src/core/lib/coordination-runtime/report-data.mjs
import { join as join12 } from "node:path";

// src/core/lib/coordination-runtime/report-capture.mjs
import { execFileSync as execFileSync2 } from "node:child_process";
function captureHistory(store, subject, version, throughSeq2, addGap) {
  const subjectColumn = store.schemaVersion === 1 ? "item_id" : "subject_id";
  const subjectKind = store.schemaVersion === 1 ? null : subject.kind;
  const subjectFilter2 = store.schemaVersion === 1 ? `e.${subjectColumn} = ?` : `e.subject_kind = ? AND e.${subjectColumn} = ?`;
  const statement = store.database.prepare(`
    SELECT e.seq, e.message_id, r.kind, r.id, r.subject_kind, r.subject_id,
      r.version, r.body
    FROM events e LEFT JOIN records r ON r.kind = 'message' AND r.id = e.message_id
    WHERE e.thread_id = ? AND ${subjectFilter2}
      AND e.message_id IS NOT NULL AND e.seq < ?
    ORDER BY e.seq DESC LIMIT 50
  `);
  const pages = [];
  let beforeSeq = throughSeq2 + 1;
  const threadId = subjectRef(subject, version);
  for (; ; ) {
    const rows = statement.all(
      threadId,
      ...subjectKind === null ? [subject.id] : [subjectKind, subject.id],
      beforeSeq
    );
    if (!rows.length) break;
    pages.push(rows.map((row) => {
      const ref = `message:${row.message_id}`;
      const entry = { ref, eventSeq: Number(row.seq) };
      if (row.id === null) {
        entry.gap = "Message referenced by this event is missing; no payload invented.";
      } else {
        const record2 = validateRecord({
          kind: row.kind,
          id: row.id,
          subject: row.subject_kind === null ? null : { kind: row.subject_kind, id: row.subject_id },
          version: row.version,
          body: JSON.parse(row.body)
        });
        if (!subjectEquals(record2.subject, subject) || record2.body.thread_id !== threadId || record2.body.basis_version !== version) {
          entry.gap = "Message subject/thread mismatches captured scope; content withheld.";
        } else entry.record = record2;
      }
      if (entry.gap) addGap(ref, entry.gap);
      return entry;
    }));
    beforeSeq = Number(rows.at(-1).seq);
    if (rows.length < 50) break;
  }
  return pages;
}
function captureArtifacts(root, artifacts, addGap) {
  let remaining = artifactPreviewLimits.aggregateBytes;
  return artifacts.flatMap((artifact) => {
    if (!artifact.snapshots?.length) return [];
    let artifactRemaining = artifactPreviewLimits.perArtifactBytes;
    let manifestError;
    try {
      if (artifact.manifest_path !== `${artifact.run_directory}/.evidence/${artifact.artifact_id}/manifest.json` || scanExactFile(root, artifact.manifest_path).digest !== hash3(canonicalJson({
        subject: artifact.content_ref,
        snapshots: artifact.snapshots
      }))) throw new RuntimeError("EVIDENCE_GAP", "Retained manifest/path does not match registered artifact.");
    } catch (error) {
      if (!knownGap(error)) throw error;
      manifestError = error;
    }
    return artifact.snapshots.map((snapshot, index) => {
      const preview = {
        ref: artifact.ref,
        index,
        path: snapshot.path,
        retainedPath: snapshot.snapshot_path,
        sourceDigest: snapshot.digest,
        sourceSize: null,
        status: artifact.status,
        encoding: "utf8",
        content: null,
        previewState: "unavailable",
        previewBytes: 0,
        omittedBytes: null,
        limitReasons: []
      };
      try {
        if (manifestError) throw manifestError;
        if (!snapshot.snapshot_path.startsWith(`${artifact.run_directory}/.evidence/${artifact.artifact_id}/`)) {
          throw new RuntimeError("EVIDENCE_GAP", "Retained path does not match registered artifact.");
        }
        const budget = Math.min(remaining, artifactRemaining);
        const prefix = Buffer.alloc(budget);
        const decoder2 = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true });
        let captured = 0;
        let binary = false;
        const classify = (chunk, stream) => {
          if (binary) return;
          try {
            binary = /[\x00-\x08\x0b\x0c\x0e-\x1f]/.test(decoder2.decode(chunk, { stream }));
          } catch (error) {
            if (error.code !== "ERR_ENCODING_INVALID_ENCODED_DATA") throw error;
            binary = true;
          }
        };
        const identity = scanExactFile(root, snapshot.snapshot_path, (chunk) => {
          captured += chunk.copy(prefix, captured, 0, Math.min(chunk.length, budget - captured));
          classify(chunk, true);
        });
        if (identity.digest !== snapshot.digest) throw new RuntimeError("EVIDENCE_GAP", "Retained bytes do not match registered digest.");
        classify(void 0, false);
        const bytes = prefix.subarray(0, captured);
        preview.encoding = binary ? "latin1" : "utf8";
        const content = binary ? bytes.toString("latin1") : new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(bytes, { stream: captured < identity.size });
        preview.sourceSize = identity.size;
        preview.previewBytes = Buffer.byteLength(content, preview.encoding);
        preview.omittedBytes = identity.size - preview.previewBytes;
        preview.previewState = !preview.omittedBytes ? "complete" : preview.previewBytes ? "limited" : "omitted";
        preview.content = preview.previewState === "omitted" ? null : content;
        if (identity.size > budget) {
          if (budget === artifactRemaining) preview.limitReasons.push("artifact-preview-budget");
          if (budget === remaining) preview.limitReasons.push("report-preview-budget");
        }
        if (preview.previewBytes < captured) preview.limitReasons.push("utf8-boundary");
        artifactRemaining -= preview.previewBytes;
        remaining -= preview.previewBytes;
      } catch (error) {
        if (!knownGap(error)) throw error;
        preview.gap = error.message;
        addGap(artifact.ref, `Inert preview unavailable: ${error.message}`);
      }
      return preview;
    });
  });
}
function captureChanges(root, artifacts, addGap) {
  const changes = [];
  const seen = /* @__PURE__ */ new Set();
  for (const artifact of artifacts) {
    if (artifact.content_ref.kind !== "git") {
      for (const entry of artifact.snapshots) changes.push({
        ref: artifact.ref,
        kind: "recorded-revision",
        path: entry.path,
        digest: entry.digest,
        status: artifact.status,
        provenance: "declared"
      });
      continue;
    }
    const key2 = canonicalJson([artifact.project_id, artifact.content_ref]);
    if (seen.has(key2)) continue;
    seen.add(key2);
    try {
      verifySubject(root, artifact.content_ref, artifact.project_id);
      const { projectRoot } = projectBinding(root, artifact.project_id);
      const env = Object.fromEntries(Object.entries(process.env).filter(([name]) => !/^GIT_/i.test(name)));
      const bytes = execFileSync2("git", [
        "--no-pager",
        "-C",
        projectRoot,
        "diff",
        "--no-ext-diff",
        "--no-textconv",
        "--no-renames",
        "--name-status",
        "-z",
        artifact.content_ref.base,
        artifact.content_ref.head,
        "--"
      ], {
        encoding: "utf8",
        windowsHide: true,
        stdio: ["ignore", "pipe", "pipe"],
        maxBuffer: 64 * 1024 * 1024,
        env: { ...env, GIT_NO_REPLACE_OBJECTS: "1", GIT_OPTIONAL_LOCKS: "0", GIT_TERMINAL_PROMPT: "0", GIT_NO_LAZY_FETCH: "1" }
      });
      const fields2 = bytes.split("\0");
      if (fields2.pop() !== "" || fields2.length % 2) throw new RuntimeError("EVIDENCE_GAP", "Malformed Git path listing.");
      for (let i = 0; i < fields2.length; i += 2) changes.push({
        ref: artifact.ref,
        kind: "git",
        projectId: artifact.project_id,
        ...artifact.content_ref,
        path: fields2[i + 1],
        status: fields2[i],
        provenance: "derived"
      });
    } catch (error) {
      if (error instanceof RuntimeError && !knownGap(error)) throw error;
      addGap(artifact.ref, `Git changed paths unavailable: ${error instanceof RuntimeError ? error.message : "read-only Git inspection failed"}`);
    }
  }
  return changes;
}

// src/core/lib/coordination-runtime/report-data.mjs
var bindsSubject3 = (record2, subject) => record2?.subject?.kind === subject.kind && record2.subject.id === subject.id;
var contentEquals5 = (left, right) => left !== null && right !== null && canonicalJson(left) === canonicalJson(right);
var terminal = /* @__PURE__ */ new Set(["completed", "shipped", "dropped"]);
var positive2 = (value) => ["approved", "clear", "waived", "passed"].includes(value);
var negativeValidity = /* @__PURE__ */ new Set(["stale", "expired", "superseded", "invalidated", "retired"]);
function excerpt2(value, limit = 512) {
  const text2 = typeof value === "string" ? value : JSON.stringify(value);
  if (Buffer.byteLength(text2) <= limit) return { text: text2, truncated: false };
  let result = "";
  let bytes = 0;
  for (const character of text2) {
    const size = Buffer.byteLength(character);
    if (bytes + size > limit - 3) break;
    result += character;
    bytes += size;
  }
  return { text: `${result}\u2026`, truncated: true };
}
function buildReport(store, { subject }) {
  if (!subject || typeof subject !== "object") throw new RuntimeError("INVALID_INPUT", "report subject is required");
  const root = workspaceRootFromCoordinationDatabase(store.path);
  const manifest = workspaceManifest(root);
  const database = COORDINATION_DATABASE;
  if (normalized(store.path) !== normalized(join12(root, ...database.split("/")))) {
    throw new RuntimeError("INVALID_INPUT", "report store must belong to the explicit workspace");
  }
  return readSnapshot(store, () => {
    const gaps = [];
    const gapKeys = /* @__PURE__ */ new Set();
    const addGap = (ref, message, severity = "gap", code = "EVIDENCE_GAP") => {
      const key2 = JSON.stringify([ref, message]);
      if (!gapKeys.has(key2)) {
        gapKeys.add(key2);
        gaps.push({ ref, code, severity, message });
      }
    };
    const check = (ref, action, severity = "gap") => {
      try {
        return { ok: true, value: action() };
      } catch (error) {
        if (!knownGap(error)) throw error;
        addGap(ref, error.message, severity, error.code);
        return { ok: false };
      }
    };
    const contextRead = check(`${subject.kind}:${subject.id}`, () => readSubjectView(store, {
      subject,
      recentLimit: 8
    }));
    const context = contextRead.value;
    const item = context?.record ?? readRecord(store, subject.kind, subject.id);
    if (!item) throw new RuntimeError("EVIDENCE_GAP", `${subject.kind}/${subject.id} does not exist`);
    const throughSeq2 = context?.throughSeq ?? Number(store.database.prepare(
      "SELECT COALESCE(MAX(seq), 0) AS seq FROM events"
    ).get().seq);
    const cache = /* @__PURE__ */ new Map();
    const recordsById = /* @__PURE__ */ new Map();
    const itemSubject = subject;
    const list = (kind, subject2 = void 0) => {
      const key2 = `${kind}\0${subject2 === void 0 ? "*" : canonicalJson(subject2)}`;
      if (!cache.has(key2)) {
        const records2 = listRecords(store, { kind, subject: subject2 });
        cache.set(key2, records2);
        records2.forEach((r) => recordsById.set(`${kind}\0${r.id}`, r));
      }
      return cache.get(key2);
    };
    const tx = bindEvidenceReadView({
      list,
      get: (kind, id) => {
        const key2 = `${kind}\0${id}`;
        if (!recordsById.has(key2)) recordsById.set(key2, readRecord(store, kind, id));
        return recordsById.get(key2);
      }
    }, { root });
    const body = item.body;
    const currentCriteria2 = check(
      "criteria",
      () => criteriaRef(item, (kind, id) => tx.get(kind, id))
    ).value ?? null;
    const artifacts = list("artifact", itemSubject).map((record2) => ({
      id: record2.id,
      ref: `artifact:${record2.id}`,
      version: record2.version,
      ...record2.body,
      status: bindsSubject3(record2, itemSubject) && currentCriteria2 !== null && record2.body.criteria_ref === currentCriteria2 && (item.kind !== "task" || contentEquals5(record2.body.content_ref, item.body.change_ref)) ? "current" : "historical",
      integrity: "not-rechecked",
      assets: []
    }));
    const assets = list("asset", itemSubject);
    const assetsByArtifact = /* @__PURE__ */ new Map();
    for (const asset of assets) {
      const entries = assetsByArtifact.get(asset.body.artifact_id) ?? [];
      entries.push(asset.body);
      assetsByArtifact.set(asset.body.artifact_id, entries);
    }
    for (const artifact of artifacts) {
      artifact.assets = assetsByArtifact.get(artifact.id) ?? [];
      if (artifact.status !== "current") continue;
      const basis = check(artifact.ref, () => artifactBasisCurrent({ root }, tx, item, artifact), "pending");
      if (!basis.ok || !basis.value) {
        artifact.status = "historical";
        artifact.integrity = "gap";
        addGap(artifact.ref, "Historical output basis is obsolete or incomplete; retained without reacceptance.", "pending");
        continue;
      }
      const verified = check(artifact.ref, () => {
        if (artifact.assets.length) artifact.assets.forEach((asset) => verifyAssetContent({ root }, tx, asset));
        else verifyArtifact(root, artifact);
      });
      artifact.integrity = verified.ok ? "verified" : "gap";
      for (const asset of artifact.assets) {
        if (negativeValidity.has(asset.validity)) {
          artifact.integrity = "gap";
          addGap(`asset:${asset.asset_id}`, `Current-subject asset validity is ${asset.validity}; not current proof.`);
        }
      }
    }
    const artifactIds = new Set(artifacts.map((a) => a.id));
    for (const asset of assets) {
      if (!artifactIds.has(asset.body.artifact_id)) {
        addGap(`asset:${asset.id}`, "Registered asset references a missing artifact.");
      }
    }
    const groups = [
      ["review", "review_id", effectiveReviews],
      ["approval", "approval_id", effectiveApprovals],
      ["evidence", "evidence_id", effectiveEvidence]
    ];
    const approvalChronology = new Map((context?.approvals ?? []).map((a) => [a.record.id, a.eventSeq]));
    const verdicts = {};
    for (const [kind, idKey, effectiveFn] of groups) {
      const records2 = list(kind, itemSubject);
      const result = check(`${kind}s`, () => effectiveFn(records2.map((r) => r.body), item, (recordKind2, id) => tx.get(recordKind2, id)));
      const effectiveIds = result.ok ? new Set(result.value.map((b) => b[idKey])) : null;
      verdicts[kind] = records2.map((record2) => {
        const b = record2.body;
        const recovery2 = b.kind === "operator-recovery-resolution";
        const current = currentCriteria2 !== null && (recovery2 ? b.criteria_ref === currentCriteria2 && b.recovery.attempt_id === body.recovery_hold : matchesAcceptance(b, item, (recordKind2, id) => tx.get(recordKind2, id)));
        const actor = b.reviewer ?? b.authority ?? null;
        const independent2 = actor === null ? null : (item.kind !== "task" || !isProducingRun(body, actor)) && !artifacts.some((a) => contentEquals5(a.content_ref, b.content_ref) && a.producer.runId === actor.runId);
        const status = !current ? "historical" : effectiveIds === null ? "conflict" : effectiveIds.has(record2.id) ? "current" : "superseded";
        const entry = {
          id: record2.id,
          ref: `${kind}:${record2.id}`,
          version: record2.version,
          ...b,
          status,
          independent: independent2,
          integrity: "not-rechecked",
          eventSeq: kind === "approval" ? approvalChronology.get(record2.id) ?? null : null
        };
        if (status === "historical") {
          addGap(entry.ref, "Historical proof is stale for the current criteria/subject; retained without reacceptance.", "pending");
        }
        if (status === "conflict") entry.integrity = "gap";
        if (status === "superseded") {
          const retained = check(entry.ref, () => verifyReferences(
            { root },
            tx,
            item,
            [...b.evidence_refs, ...b.finding_refs ?? []],
            { recovery: recovery2, positive: false }
          ), "pending");
          entry.integrity = retained.ok ? "verified" : "gap";
        }
        if (status !== "current") return entry;
        if (!positive2(b.verdict ?? b.decision ?? b.outcome)) {
          entry.integrity = "negative";
          addGap(entry.ref, `Current ${kind} records ${b.verdict ?? b.decision ?? b.outcome}; unresolved negative verdict.`);
          return entry;
        }
        const verified = check(entry.ref, () => {
          if (kind === "approval" && entry.eventSeq === null) {
            throw new RuntimeError("EVIDENCE_GAP", "Current approval is missing persisted decision chronology.");
          }
          if (recovery2) {
            recoveryResolution(tx, item, record2.id);
            verifyReferences({ root }, tx, item, b.evidence_refs, { recovery: true, positive: false });
          } else if (item.kind === "task") {
            verifyVerdict(tx, item, b, actor);
            if (artifacts.some((a) => a.status === "current" && a.integrity === "gap")) {
              throw new RuntimeError("EVIDENCE_GAP", "Current subject artifact or asset has an integrity/validity gap.");
            }
          } else {
            verifyReferences({ root }, tx, item, b.evidence_refs);
          }
        }, "broken-claim");
        entry.integrity = verified.ok ? "verified" : "gap";
        return entry;
      });
    }
    const decisions = verdicts.approval.sort((a, b) => (a.eventSeq ?? 0) - (b.eventSeq ?? 0));
    const reviews = verdicts.review;
    const evidence = verdicts.evidence;
    const completionClaims = decisions.filter((d) => d.status === "current" && d.kind === "completion" && d.decision === "approved");
    if (completionClaims.length) {
      const completion = check("completion", () => completionApproval(tx, item), "broken-claim");
      const requiredReviews = item.kind === "task" ? check("required-reviews", () => requireReviews(tx, item), "broken-claim") : { ok: true };
      if (!completion.ok || !requiredReviews.ok) {
        completionClaims.forEach((c) => {
          c.integrity = "gap";
        });
      }
    }
    if (terminal.has(body.state) && body.state !== "dropped" && !completionClaims.length) {
      addGap("completion", "Recorded terminal state retained; current completion proof is missing or stale.");
    }
    const recordedPhase = body.state === "blocked" ? body.resume_state : body.state;
    if (item.kind === "task" && ["release-ready", "deploying", "production-verification", "shipped"].includes(recordedPhase)) {
      check("completion", () => completionApproval(tx, item), "broken-claim");
      check("required-reviews", () => requireReviews(tx, item), "broken-claim");
      check("release-evidence", () => requireReleaseEvidence(tx, item), "broken-claim");
    }
    if (item.kind === "task" && ["deploying", "production-verification", "shipped"].includes(recordedPhase)) {
      check("deployment-start", () => requireOperatorApproval(tx, item, "operator-deploy-start"), "broken-claim");
    }
    if (item.kind === "task" && ["production-verification", "shipped"].includes(recordedPhase)) {
      check("deployment-complete", () => requireOperatorApproval(tx, item, "operator-deploy-complete"), "broken-claim");
      check("deployment", () => requireDeploymentEvidence(tx, item, "deployment"), "broken-claim");
    }
    if (item.kind === "task" && recordedPhase === "shipped") {
      check("production-verification", () => requireDeploymentEvidence(tx, item, "production-verification"), "broken-claim");
    }
    const criteria = body.acceptance.map((text2, index) => {
      const support = [
        ...reviews.filter((r) => r.criteria.includes(text2)),
        ...evidence.filter((e) => e.provenance?.tier === "observed" && e.provenance.capture.checks.includes(text2))
      ].filter((r) => ["current", "conflict"].includes(r.status));
      const bad = support.some((r) => ["gap", "negative"].includes(r.integrity));
      const good = support.filter((r) => r.integrity === "verified");
      return {
        id: `criterion-${index + 1}`,
        text: text2,
        criteriaRef: currentCriteria2,
        status: bad ? "gap" : good.length ? "verified" : "pending",
        verdictRefs: support.map((r) => r.ref),
        evidenceRefs: [...new Set(support.flatMap((r) => r.evidence_refs))],
        explanation: "Exact criterion text matched to review criteria or observed check labels; subject-level approval alone does not imply per-criterion coverage."
      };
    });
    const references = /* @__PURE__ */ new Set([
      ...body.context_artifacts ?? [],
      ...context?.referencedDetails.map((d) => d.reference) ?? []
    ]);
    for (const reference of references) {
      const match = /^(artifact|evidence):([0-9a-f-]+)$/i.exec(reference);
      if (!match) addGap(reference, "Reference is not a registered artifact/evidence identity; not linked.");
      else if (!tx.get(match[1].toLowerCase(), match[2])) addGap(reference, "Referenced record is missing.");
    }
    const questions = list("question", itemSubject).map((record2) => ({
      id: record2.id,
      ref: `question:${record2.id}`,
      version: record2.version,
      ...record2.body,
      disposition: terminal.has(body.state) ? "historical-follow-up" : record2.body.status === "answered" ? "addressed" : record2.body.blocking ? "blocking" : "nonblocking"
    }));
    const blockers = questions.filter((q) => q.disposition === "blocking");
    const questionsById = new Map(questions.map((q) => [q.id, q]));
    for (const id of body.waiting_on_questions ?? []) {
      const question = questionsById.get(id);
      if (!question || !terminal.has(body.state) && (question.status !== "open" || !question.blocking)) {
        addGap(`question:${id}`, "Required question is missing or no longer matches its blocking obligation.");
        if (!terminal.has(body.state) && !blockers.some((b) => b.ref === `question:${id}`)) {
          blockers.push({ ref: `question:${id}`, ask: "Restore missing question evidence before resolving this obligation." });
        }
      }
    }
    for (const entry of context?.questions ?? []) {
      if (entry.record && entry.eventSeq === null) {
        addGap(`question:${entry.record.id}`, "Question is missing persisted opening-message chronology.");
      }
    }
    for (const question of questions) {
      const opening = tx.get("message", question.opened_message_id);
      if (!bindsSubject3(opening, subject) || opening.body.kind !== "question") {
        addGap(question.ref, "Question opening message is missing or mismatched.");
      }
      for (const id of question.answer_message_ids) {
        const answer = tx.get("message", id);
        if (!bindsSubject3(answer, subject) || answer.body.kind !== "answer") {
          addGap(question.ref, "Question answer message is missing or mismatched.");
        }
      }
      if (question.status === "answered" && (!question.resolution || !question.answer_message_ids.includes(question.resolution.message_id))) {
        addGap(question.ref, "Question resolution does not name a retained answer message.");
      }
    }
    if (body.recovery_hold && !terminal.has(body.state)) {
      blockers.push({ ref: `attempt:${body.recovery_hold}`, kind: "recovery-hold", ask: "Operator resolution required before resumption." });
    }
    if (body.recovery_hold) {
      const attempt = tx.get("attempt", body.recovery_hold);
      if (!bindsSubject3(attempt, subject) || attempt.body.disposition !== "conflicting-partial-work") {
        addGap(`attempt:${body.recovery_hold}`, "Recovery hold attempt is missing or mismatched.");
      }
    }
    const dependencies2 = (context?.dependencies ?? (body.depends_on ?? []).map((dependency) => {
      const dependencyId = dependency.task;
      return { dependency, record: tx.get("task", dependencyId) };
    })).map(({ dependency, record: record2 }) => {
      const dependencyId = dependency.task;
      return {
        task: dependencyId,
        requires: dependency.requires,
        state: record2?.body.state ?? null,
        version: record2?.version ?? null,
        status: !record2 ? "missing" : record2.body.state === "dropped" ? "failed" : taskStateSatisfies(record2, dependency.requires) ? "satisfied" : "pending"
      };
    });
    for (const dependency of dependencies2) {
      if (dependency.status === "satisfied") continue;
      const ref = `task:${dependency.task}`;
      const ask = dependency.status === "pending" ? `Waiting for ${dependency.task}: recorded ${dependency.state}; requires ${dependency.requires}.` : dependency.status === "failed" ? `Dependency ${dependency.task} was dropped; recorded requirement ${dependency.requires} failed. Owner decision required.` : `Dependency ${dependency.task} is missing; restore evidence before resolving its requirement.`;
      addGap(ref, ask, dependency.status === "pending" ? "pending" : "gap");
      if (!terminal.has(body.state)) blockers.push({ ref, kind: "dependency", status: dependency.status, ask });
    }
    const attempts = [
      ...list("host-attempt", itemSubject).map((r) => ({ id: r.id, ref: `host-attempt:${r.id}`, type: "host", version: r.version, ...r.body })),
      ...list("attempt", itemSubject).map((r) => ({ id: r.id, ref: `attempt:${r.id}`, type: "recovery", version: r.version, ...r.body }))
    ];
    const effects = list("effect", itemSubject).map((r) => ({ id: r.id, ref: `effect:${r.id}`, version: r.version, ...r.body }));
    for (const attempt of attempts.filter((a) => a.type === "host")) {
      if (["intent", "uncertain", "conflicting", "mismatched"].includes(attempt.status)) {
        const message = `Host attempt is ${attempt.status}; reconcile liveness, model and outcome before further execution.`;
        addGap(attempt.ref, message);
        if (!terminal.has(body.state)) blockers.push({ ref: attempt.ref, ask: message });
      }
    }
    for (const effect of effects) {
      if (["unknown", "conflicting"].includes(effect.outcome)) {
        const message = `Recorded effect outcome is ${effect.outcome}; no safe retry is implied.`;
        addGap(effect.ref, message);
        if (!terminal.has(body.state)) blockers.push({ ref: effect.ref, ask: message });
      }
    }
    const rawMessages = (context?.recentMessages ?? []).filter(({ record: record2 }) => {
      const inScope = bindsSubject3(record2, subject) && record2.body.thread_id === subjectRef(subject, item.version);
      if (!inScope) addGap(`message:${record2.id}`, "Message subject/thread mismatches captured scope; content withheld.");
      return inScope;
    }).map(({ record: record2, eventSeq }) => ({
      id: record2.id,
      ref: `message:${record2.id}`,
      eventSeq,
      ...record2.body
    }));
    const acceptedReportArtifacts = new Set(decisions.filter((decision) => decision.status === "current" && decision.kind === "completion" && decision.decision === "approved" && decision.integrity === "verified").flatMap((decision) => decision.evidence_refs).filter((reference) => reference.startsWith("artifact:")).map((reference) => reference.slice("artifact:".length)));
    const acceptedApprovalIds = new Set(decisions.filter((decision) => decision.status === "current" && decision.kind === "completion" && decision.decision === "approved" && decision.integrity === "verified").map((decision) => decision.approval_id));
    const reportArtifacts = artifacts.filter((artifact) => artifact.classification === "public" && artifact.status === "current" && artifact.integrity === "verified" && acceptedReportArtifacts.has(artifact.id) && (item.kind === "task" || artifact.assets.some((asset) => asset.validity === "current" && acceptedApprovalIds.has(asset.completion_approval_id) && !(/* @__PURE__ */ new Set(["scratch", "draft", "discarded", "retracted"])).has(asset.disposition))));
    if (artifacts.length > reportArtifacts.length) {
      addGap("private-evidence", "Private evidence metadata and bytes were withheld from the report.", "pending");
    }
    const reportEvidence = evidence.filter((entry) => {
      const classification = entry.provenance?.capture?.classification ?? "public";
      if (classification === "public") return true;
      addGap(
        entry.ref,
        "Private evidence content was withheld; only an accepted public report artifact safe excerpt may be shown.",
        "pending"
      );
      return false;
    });
    const inspection = {
      subject,
      throughSeq: throughSeq2,
      messagePages: captureHistory(store, subject, item.version, throughSeq2, addGap),
      artifactPreviews: captureArtifacts(root, reportArtifacts, addGap)
    };
    inspection.previewBudget = {
      ...artifactPreviewLimits,
      capturedBytes: inspection.artifactPreviews.reduce((sum, preview) => sum + preview.previewBytes, 0)
    };
    const changes = captureChanges(root, reportArtifacts, addGap);
    const safe = redactReport({
      schema_version: 2,
      workspace: { id: manifest.workspace_id, root: normalized(root) },
      subject: {
        kind: item.kind,
        id: item.id,
        version: item.version,
        ...body,
        criteriaRef: currentCriteria2
      },
      decisions,
      criteria,
      artifacts: reportArtifacts,
      reviews,
      evidence: reportEvidence,
      questions,
      blockers,
      attempts,
      effects,
      changes,
      inspection,
      messages: rawMessages,
      gaps,
      throughSeq: throughSeq2,
      generatedAt: (/* @__PURE__ */ new Date()).toISOString(),
      snapshotWarning,
      integrity: {
        status: gaps.some((g) => g.severity !== "pending") ? "gap" : [...reviews, ...decisions, ...evidence].some((v) => v.integrity === "verified") ? "verified" : "pending",
        scope: "Current proof checks only; not an acceptance decision or coverage total."
      },
      obligations: {
        reviewRequirements: body.review_requirements ?? [],
        artifactExpectation: body.artifact_expectation ?? null,
        artifactReason: body.artifact_expectation_reason ?? null,
        artifactTargets: body.artifact_targets ?? [],
        dependencies: dependencies2
      },
      history: {
        totalMessages: context?.messageCount ?? null,
        shownMessages: rawMessages.length,
        cursor: !context ? {
          subject,
          threadId: subjectRef(subject, item.version),
          basisVersion: item.version,
          beforeSeq: throughSeq2 + 1,
          remainingCount: null
        } : context.messageCount > rawMessages.length ? {
          subject,
          threadId: subjectRef(subject, item.version),
          basisVersion: item.version,
          beforeSeq: rawMessages[0]?.eventSeq ?? throughSeq2 + 1,
          remainingCount: context.messageCount - rawMessages.length
        } : null,
        limitation: "Recent message excerpts only (512 UTF-8 bytes each). Full and older messages are captured in linked offline pages from this same database snapshot. Verdicts, artifact registry metadata and question records below are not truncated. Artifact content previews have separately disclosed byte budgets."
      }
    });
    safe.messages = safe.messages.map(({ payload, ...message }) => ({ ...message, payloadExcerpt: excerpt2(payload) }));
    return safe;
  });
}

// src/core/lib/coordination-runtime/cli.mjs
var fail17 = (code, message) => {
  throw new RuntimeError(code, message);
};
var reads = /* @__PURE__ */ new Set([
  "inspect",
  "status",
  "context",
  "detail",
  "messages",
  "export",
  "hash",
  "plan"
]);
var required = (options2, name) => options2[name] ?? fail17("INVALID_INPUT", `--${name} is required`);
var hierarchySubject = (options2) => validateHierarchySubject({
  kind: required(options2, "kind"),
  id: required(options2, "id")
});
async function installedRoles(host, root, env) {
  let selected = host;
  if (!selected) {
    const { createNativeHost: createNativeHost2 } = await Promise.resolve(native_host_exports);
    selected = createNativeHost2({ env });
  }
  if (!selected?.capabilities) return [];
  let result;
  try {
    result = await selected.capabilities({ root });
  } catch (error) {
    if (error instanceof RuntimeError && (/* @__PURE__ */ new Set(["ROLE_UNAVAILABLE", "UNSUPPORTED_HOST"])).has(error.code)) {
      return [];
    }
    throw error;
  }
  const roster = result?.discovery?.roster;
  if (!Array.isArray(roster)) return [];
  return [...new Set(roster.map((entry) => entry?.role).filter((role) => typeof role === "string" && role !== ""))].sort();
}
function hierarchyDirection(store) {
  const [epic] = listAllRecords(store, { kind: "epic" });
  return epic ? currentDirectionForStore(store, epic.body.direction_ref) : null;
}
async function execute({ verb, options: options2, body, host, cwd, env }) {
  const resolved = resolveWorkspaceRoot({ explicitRoot: options2.root, cwd, env });
  if (!resolved.ok) fail17(resolved.code ?? "INVALID_INPUT", resolved.reason);
  const { root } = resolved;
  const manifest = readWorkspaceContract(root, { env });
  const database = COORDINATION_DATABASE;
  const path4 = safePath(root, database);
  const base = { ok: true, mode: verb, root, schemaVersion: manifest.schema_version, storeExists: existsSync11(path4) };
  if (reads.has(verb)) {
    if (verb === "inspect") {
      let runtime = null;
      if (base.storeExists) {
        const store3 = openStore({ path: path4, mode: "read" });
        try {
          runtime = readStoreSummary(store3);
        } finally {
          closeStore(store3);
        }
      }
      return { ...base, runtime, ...options2.deep ? { inspection: inspectRuntime(root, { env, intent: "inspect" }) } : {} };
    }
    if (!base.storeExists) fail17("RECOVERY_REQUIRED", "coordination store is missing; use the standalone workspace initializer");
    const store2 = openStore({ path: path4, mode: "read" });
    try {
      const roles = ["status", "context", "plan"].includes(verb) ? await installedRoles(host, root, env) : [];
      if (verb === "status") {
        return readSnapshot(store2, () => ({
          ...base,
          status: hierarchyStatus(store2, {
            direction: hierarchyDirection(store2),
            roles
          })
        }));
      }
      if (verb === "context") {
        return readSnapshot(store2, () => ({
          ...base,
          context: hierarchyContext(store2, {
            subject: hierarchySubject(options2),
            maxBytes: options2["max-bytes"],
            recentLimit: options2["recent-limit"],
            direction: hierarchyDirection(store2),
            roles
          })
        }));
      }
      if (verb === "detail") {
        return readSnapshot(store2, () => ({
          ...base,
          record: readDetail(store2, {
            kind: required(options2, "kind"),
            id: required(options2, "id")
          })
        }));
      }
      if (verb === "messages") {
        return readSnapshot(store2, () => {
          const subject = hierarchySubject(options2);
          const record2 = readDetail(store2, subject);
          return {
            ...base,
            ...readMessages(store2, {
              subject,
              threadId: subjectRef(subject, record2.version),
              basisVersion: record2.version,
              beforeSeq: options2["before-seq"],
              limit: options2.limit
            })
          };
        });
      }
      if (verb === "hash") return { ...base, subject: hashArtifact({ root, relativePath: required(options2, "path") }) };
      if (verb === "export") {
        const subject = hierarchySubject(options2);
        return readSnapshot(store2, () => ({
          ...base,
          report: buildReport(store2, { subject })
        }));
      }
      if (verb === "plan") {
        return readSnapshot(store2, () => ({
          ...base,
          ...planHierarchy({
            store: store2,
            subject: hierarchySubject(options2),
            direction: hierarchyDirection(store2),
            roles
          })
        }));
      }
    } finally {
      closeStore(store2);
    }
  }
  if (verb === "apply") validateCommand(body);
  if (!base.storeExists) fail17("RECOVERY_REQUIRED", "coordination store is missing; use the standalone workspace initializer");
  assertWorkspaceWrite(path4, { requirePrivate: true, env });
  if (["request", "authorize", "receipt", "capture", "capabilities", "prepare"].includes(verb)) {
    const admitted = openStore({ path: path4, mode: "read" });
    closeStore(admitted);
  }
  if (!host) {
    const { createNativeHost: createNativeHost2 } = await Promise.resolve(native_host_exports);
    host = createNativeHost2({ env });
  }
  if (["request", "authorize", "receipt", "capture", "capabilities", "prepare"].includes(verb)) {
    return { ...base, ...await host[verb]({ root, body, options: options2 }) };
  }
  const store = openStore({ path: path4, mode: "write" });
  try {
    if (verb === "delegate") return { ...base, ...await host.delegate({ root, store, body, options: options2 }) };
    if (verb === "claim") return { ...base, ...await host.claim({ root, store, options: options2 }) };
    return await host.apply({ root, store, command: body, options: options2 });
  } finally {
    closeStore(store);
  }
}

// src/core/lib/pack-names.mjs
var PACK_ORDER2 = WORKSPACE_CONTRACT.packs;

// src/core/lib/coordination-runtime/contract-primitives.mjs
import { createHash as createHash9 } from "node:crypto";
var SUBJECT_KINDS = /* @__PURE__ */ new Set(["git", "sha256", "bundle-sha256"]);
var PACKS = new Set(WORKSPACE_CONTRACT.packs);
var UUID2 = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
var HEX_DIGEST = /^[0-9a-f]{64}$/i;
var GIT_OBJECT = /^[0-9a-f]{7,40}$/i;
var SLUG = "[a-z0-9]+(?:-[a-z0-9]+)*";
var EPIC_ID = new RegExp(`^epic:(?<slug>${SLUG})$`);
var PACK_PATTERN = WORKSPACE_CONTRACT.packs.join("|");
var TYPED_ID = new RegExp(`^(?<pack>${PACK_PATTERN}):(?<kind>feature|requirement|task):(?<slug>${SLUG})$`);
var RuntimeError = class extends Error {
  constructor(code, message, retryable = false) {
    super(message);
    this.name = "RuntimeError";
    this.code = code;
    this.retryable = retryable;
  }
};
function invalid2(message) {
  throw new RuntimeError("INVALID_INPUT", message);
}
function isPlainObject(value) {
  if (value === null || typeof value !== "object" || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}
function assertExactKeys(value, allowed, label, required2 = allowed) {
  if (!isPlainObject(value)) invalid2(`${label} must be an object`);
  for (const key2 of Object.keys(value)) {
    if (!allowed.has(key2)) invalid2(`${label} contains unknown field "${key2}"`);
  }
  for (const key2 of required2) {
    if (!Object.hasOwn(value, key2)) invalid2(`${label} is missing "${key2}"`);
  }
}
function assertNonEmptyString(value, label) {
  if (typeof value !== "string" || value.trim() === "") {
    invalid2(`${label} must be a non-empty string`);
  }
}
function assertNullableString(value, label) {
  if (value !== null) assertNonEmptyString(value, label);
}
function assertBoolean(value, label) {
  if (typeof value !== "boolean") invalid2(`${label} must be a boolean`);
}
function assertTimestamp(value, label) {
  assertNonEmptyString(value, label);
  if (Number.isNaN(Date.parse(value))) invalid2(`${label} must be an ISO-compatible timestamp`);
}
function assertUuid(value, label) {
  if (typeof value !== "string" || !UUID2.test(value)) invalid2(`${label} must be a UUID`);
}
function assertStringArray(value, label, { nonEmpty = false } = {}) {
  if (!Array.isArray(value) || nonEmpty && value.length === 0) {
    invalid2(`${label} must be ${nonEmpty ? "a non-empty" : "an"} array`);
  }
  for (const entry of value) assertNonEmptyString(entry, `${label} entry`);
  if (new Set(value).size !== value.length) invalid2(`${label} must not contain duplicates`);
}
function validateActor(actor, label = "actor") {
  assertExactKeys(actor, /* @__PURE__ */ new Set(["role", "runId"]), label);
  assertNonEmptyString(actor.role, `${label}.role`);
  assertNonEmptyString(actor.runId, `${label}.runId`);
}
function validateNullableActor(actor, label) {
  if (actor !== null) validateActor(actor, label);
}
function encodeCanonical(value, ancestors) {
  if (value === null) return "null";
  if (typeof value === "string" || typeof value === "boolean") return JSON.stringify(value);
  if (typeof value === "number") {
    if (!Number.isFinite(value)) invalid2("JSON numbers must be finite");
    return JSON.stringify(value);
  }
  if (typeof value !== "object") {
    invalid2(`unsupported JSON value type "${typeof value}"`);
  }
  if (ancestors.has(value)) invalid2("cyclic JSON values are not supported");
  ancestors.add(value);
  try {
    if (Array.isArray(value)) {
      for (let index = 0; index < value.length; index += 1) {
        if (!Object.hasOwn(value, index)) invalid2("sparse arrays are not supported");
      }
      return `[${value.map((entry) => encodeCanonical(entry, ancestors)).join(",")}]`;
    }
    if (!isPlainObject(value)) invalid2("JSON objects must use a plain object prototype");
    if (Object.getOwnPropertySymbols(value).length > 0) {
      invalid2("symbol-keyed JSON fields are not supported");
    }
    const keys = Object.keys(value).sort();
    return `{${keys.map((key2) => `${JSON.stringify(key2)}:${encodeCanonical(value[key2], ancestors)}`).join(",")}}`;
  } finally {
    ancestors.delete(value);
  }
}
function canonicalJson(value) {
  return encodeCanonical(value, /* @__PURE__ */ new WeakSet());
}
function commandDigest(command2) {
  return createHash9("sha256").update(canonicalJson(command2), "utf8").digest("hex");
}
function validateSubjectRef(subject, label = "subject") {
  if (!isPlainObject(subject)) invalid2(`${label} must be an object`);
  if (!SUBJECT_KINDS.has(subject.kind)) invalid2(`${label}.kind is unsupported`);
  if (subject.kind === "git") {
    assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "base", "head"]), label);
    if (!GIT_OBJECT.test(subject.base) || !GIT_OBJECT.test(subject.head)) {
      invalid2(`${label} git base/head must be immutable git object IDs`);
    }
  } else if (subject.kind === "sha256") {
    assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "digest", "path"]), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid2(`${label}.digest must be SHA-256`);
    assertNonEmptyString(subject.path, `${label}.path`);
  } else {
    assertExactKeys(subject, /* @__PURE__ */ new Set(["kind", "digest", "entries"]), label);
    if (!HEX_DIGEST.test(subject.digest)) invalid2(`${label}.digest must be SHA-256`);
    if (!Array.isArray(subject.entries) || subject.entries.length === 0) {
      invalid2(`${label}.entries must be a non-empty array`);
    }
    for (const [index, entry] of subject.entries.entries()) {
      assertExactKeys(entry, /* @__PURE__ */ new Set(["path", "digest"]), `${label}.entries[${index}]`);
      assertNonEmptyString(entry.path, `${label}.entries[${index}].path`);
      if (!HEX_DIGEST.test(entry.digest)) {
        invalid2(`${label}.entries[${index}].digest must be SHA-256`);
      }
    }
  }
  return subject;
}
function validateNullableSubject(subject, label) {
  if (subject !== null) validateSubjectRef(subject, label);
}
function parseEpicId(value, label) {
  const match = typeof value === "string" ? value.match(EPIC_ID) : null;
  if (!match) invalid2(`${label} must match "epic:<slug>"`);
  return match.groups;
}
function parseTypedId(value, expectedKind, label) {
  const match = typeof value === "string" ? value.match(TYPED_ID) : null;
  if (!match || match.groups.kind !== expectedKind) {
    invalid2(`${label} must match "<pack>:${expectedKind}:<slug>"`);
  }
  return match.groups;
}
function validateChangesPayload(command2, fields2, label) {
  assertExactKeys(command2.payload, /* @__PURE__ */ new Set(["changes"]), `${label} payload`);
  if (!isPlainObject(command2.payload.changes) || Object.keys(command2.payload.changes).length === 0) {
    invalid2(`${label} payload.changes must be a non-empty object`);
  }
  for (const key2 of Object.keys(command2.payload.changes)) {
    if (!fields2.has(key2)) invalid2(`${label} cannot change "${key2}"`);
  }
}
function changedKeys(before, after) {
  const keys = /* @__PURE__ */ new Set([...Object.keys(before), ...Object.keys(after)]);
  return [...keys].filter((key2) => canonicalJson(before[key2]) !== canonicalJson(after[key2]));
}
function assertChangedOnly(current, nextBody, allowed, label) {
  for (const key2 of changedKeys(current.body, nextBody)) {
    if (!allowed.has(key2)) invalid2(`${label} may not change "${key2}"`);
  }
}

export {
  RuntimeError,
  RECORD_KINDS,
  HIERARCHY_KINDS,
  validateHierarchySubject,
  defaultKaiHome,
  registryPath,
  readWorkspaceManifest,
  nativeAbsolutePathProblem,
  validateSchema5Manifest,
  loadWorkspaceRegistry,
  loadWorkspaceRegistryForCleanup,
  resolveWorkspaceRoot,
  inspectGitPrivacy,
  readDirection,
  openStore,
  closeStore,
  listAllRecords,
  readSnapshot,
  currentDirectionForStore,
  hierarchyStatus,
  cli_exports,
  TERMINAL,
  OPERATOR_GATED,
  isNull,
  parseStamp,
  exactPath,
  escapesRoot,
  inspectPrivateLanes,
  pathHasLink,
  WORKSPACE_SCHEMA_VERSION,
  COORDINATION_DATABASE,
  LOG_REL,
  FORBIDDEN_FIELDS,
  MAX_LINE,
  MAX_BYTES,
  digest,
  looksAbsolute,
  safeNote,
  activityWorkspaceAdmission,
  append,
  read,
  runs
};
