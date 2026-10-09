import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);

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
import { existsSync, lstatSync, readdirSync, realpathSync } from "node:fs";
import { basename, dirname, isAbsolute, join, relative, resolve, sep } from "node:path";
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
function canonicalPath(path2) {
  let existing = resolve(path2);
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
function exactPath(path2) {
  const requested = resolve(path2);
  const canonical = canonicalPath(path2);
  return process.platform === "win32" ? requested.toLowerCase() === canonical.toLowerCase() : requested === canonical;
}
function normalized(path2) {
  const value = canonicalPath(path2);
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
  for (const lane of lanes) {
    const laneRoot = join(root, ...lane.split("/"));
    let laneStat;
    try {
      laneStat = lstatSync(laneRoot);
    } catch (error) {
      if (error.code === "ENOENT") continue;
      unreadable.push(`${lane}: ${error.message}`);
      continue;
    }
    if (laneStat.isSymbolicLink()) {
      symbolicLinks.push(lane);
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
        const path2 = join(current, entry.name);
        if (entry.name.toLowerCase() === ".git") {
          gitRoots.push(relative(root, current).replace(/\\/g, "/") || ".");
          continue;
        }
        if (entry.isSymbolicLink()) {
          symbolicLinks.push(relative(root, path2).replace(/\\/g, "/"));
          continue;
        }
        if (entry.isDirectory()) pending.push(path2);
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
import { dirname as dirname2, posix as path, resolve as resolve2 } from "node:path";
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
    members: members.map((member, index) => assertWorkspaceSegment(member, `member[${index}]`))
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

export {
  TASK_LIFECYCLE,
  TASK_NEEDS_CHANGE_REF,
  TASK_DEPENDENCY_STATES,
  TASK_TERMINAL_STATES,
  TERMINAL,
  OPERATOR_GATED,
  isNull,
  parseStamp,
  badPath,
  canonicalPath,
  exactPath,
  normalized,
  resolvedProjectPath,
  escapesRoot,
  inspectPrivateLanes,
  pathHasLink,
  WORKSPACE_CONTRACT,
  WORKSPACE_SCHEMA_VERSION,
  PRIVATE_ROOT,
  DIRECTION_PATH,
  COORDINATION_DATABASE,
  parseTypedArtifactRoute,
  directionPath,
  workspaceRootFromCoordinationDatabase
};
