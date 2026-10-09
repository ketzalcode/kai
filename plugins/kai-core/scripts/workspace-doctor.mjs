#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
  closeStore,
  defaultKaiHome,
  exactPath,
  inspectGitPrivacy,
  inspectPrivateLanes,
  loadWorkspaceRegistry,
  loadWorkspaceRegistryForCleanup,
  nativeAbsolutePathProblem,
  openStore,
  pathHasLink,
  readDirection,
  readWorkspaceManifest,
  registryPath,
  resolveWorkspaceRoot,
  validateSchema5Manifest
} from "./runtime-core.mjs";

// src/core/workspace-doctor.mjs
import {
  closeSync,
  existsSync,
  lstatSync,
  mkdirSync,
  openSync,
  readFileSync,
  readdirSync,
  renameSync,
  rmSync,
  unlinkSync,
  writeFileSync
} from "node:fs";
import { createHash, randomUUID } from "node:crypto";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";
var README_CONTENT = [
  "# Kai",
  "",
  "Accepted Kai knowledge belongs below this directory. Private runtime state stays in `.kai/`.",
  ""
].join("\n");
var UNSUPPORTED_SCHEMA = "workspace schema is unsupported; reinstall Kai and run kai-core-workspace-reonboard";
var FORBIDDEN_ROOTS = [
  ".kai/state",
  ".kai/runs",
  ".kai/review",
  ".kai/archive",
  ".kai/personal",
  ".kai/areas",
  ".kai/shared"
];
function schema5WorkspaceValidation(root, manifest, {
  env = process.env,
  allowUnregisteredExternal = false,
  requireActivated = true
} = {}) {
  const errors = [];
  const warnings = [];
  const shape = validateSchema5Manifest(root, manifest, { env, allowUnregisteredExternal });
  errors.push(...shape.errors);
  if (shape.errors.length) return { errors, warnings, projects: shape.projects };
  const privacy = inspectGitPrivacy(root, manifest.placement);
  errors.push(...privacy.errors);
  warnings.push(...privacy.warnings);
  if (manifest.placement === "repo-local" && !privacy.gitRoot) {
    errors.push("repo-local placement requires a readable Git work tree so .kai privacy can be verified");
  }
  for (const path of privacy.missing) {
    errors.push(`placement "${manifest.placement}" requires the entire .kai/ directory to be ignored (missing ${path})`);
  }
  if (manifest.placement === "external") {
    for (const { projectRoot } of shape.projects) {
      if (existsSync(join(projectRoot, ".kai"))) {
        errors.push(`external project "${projectRoot}" must not contain a .kai directory`);
      }
    }
  }
  try {
    readDirection({ workspaceRoot: root, manifest });
  } catch (error) {
    errors.push(`${error.code ?? "INVALID_DIRECTION"}: ${error.message}`);
  }
  const privateRoot = join(root, ".kai");
  if (!existsSync(privateRoot)) {
    if (requireActivated) errors.push('schema-5 workspace is missing required directory ".kai"');
  } else if (!lstatSync(privateRoot).isDirectory() || pathHasLink(root, privateRoot) || !exactPath(privateRoot)) {
    errors.push('schema-5 private root ".kai" must be an exact unlinked directory');
  } else if (!requireActivated && readdirSync(privateRoot).length > 0) {
    errors.push("schema-5 initialization requires an absent or empty .kai directory");
  }
  for (const path of FORBIDDEN_ROOTS) {
    if (existsSync(join(root, ...path.split("/")))) {
      errors.push(`schema-5 workspace contains retired generic root "${path}"`);
    }
  }
  const lanes = inspectPrivateLanes(root, [".kai"]);
  for (const path of lanes.symbolicLinks) {
    errors.push(`private workspace path "${path}" is a symbolic link or junction`);
  }
  for (const path of lanes.gitRoots) {
    errors.push(`private workspace path "${path}" contains a nested Git repository`);
  }
  for (const detail of lanes.unreadable) {
    errors.push(`private workspace path is unreadable: ${detail}`);
  }
  if (!requireActivated) return { errors, warnings, projects: shape.projects };
  const databasePath = join(root, ...COORDINATION_DATABASE.split("/"));
  let store;
  if (!existsSync(databasePath)) {
    errors.push(`RECOVERY_REQUIRED: schema-5 workspace is missing required store "${COORDINATION_DATABASE}"`);
  } else if (pathHasLink(root, databasePath) || !exactPath(databasePath) || !lstatSync(databasePath).isFile()) {
    errors.push(`RECOVERY_REQUIRED: schema-5 store "${COORDINATION_DATABASE}" must be an exact unlinked file`);
  } else {
    try {
      store = openStore({ path: databasePath, mode: "read" });
    } catch (error) {
      errors.push(`${error.code ?? "RECOVERY_REQUIRED"}: ${error.message}`);
    } finally {
      closeStore(store);
    }
  }
  const selected = shape.projects.length === 1 ? shape.projects[0] : shape.projects.find((project) => project.project.id === "default");
  if (!selected) {
    errors.push('schema-5 workspace with multiple projects requires one "default" project');
  } else {
    const readme = join(selected.publicationRootAbsolute, "README.md");
    if (!existsSync(readme)) {
      errors.push(`${selected.project.publication_root}/README.md is missing`);
    } else if (!lstatSync(readme).isFile() || pathHasLink(selected.projectRoot, readme) || !exactPath(readme)) {
      errors.push(`${selected.project.publication_root}/README.md must be an exact unlinked file`);
    }
  }
  return { errors, warnings, projects: shape.projects };
}
function initializeWorkspace({
  root,
  manifest,
  env = process.env,
  confirm = false
} = {}) {
  if (confirm !== true) {
    return {
      ok: false,
      code: "AUTHORITY_REQUIRED",
      reason: "workspace initialization requires explicit confirmation"
    };
  }
  const rootProblem = nativeAbsolutePathProblem(root, {
    label: "workspace initialization root",
    requireExisting: true,
    requireCanonical: true
  });
  if (rootProblem) return { ok: false, code: "INVALID_INPUT", reason: rootProblem };
  root = resolve(root);
  const manifestPath = join(root, ".kai", "manifest.json");
  if (existsSync(manifestPath)) {
    return { ok: false, code: "VERSION_CONFLICT", reason: ".kai/manifest.json already exists" };
  }
  const validation = schema5WorkspaceValidation(root, manifest, {
    env,
    requireActivated: false
  });
  if (validation.errors.length) {
    return { ok: false, code: "INVALID_INPUT", reason: validation.errors[0] };
  }
  const selected = validation.projects.length === 1 ? validation.projects[0] : validation.projects.find((project) => project.project.id === "default");
  if (!selected) {
    return { ok: false, code: "INVALID_INPUT", reason: 'multiple projects require one "default" project' };
  }
  const privateRoot = join(root, ".kai");
  const runtimeRoot = join(privateRoot, "core", "runtime");
  const databasePath = join(root, ...COORDINATION_DATABASE.split("/"));
  const readmePath = join(selected.publicationRootAbsolute, "README.md");
  const claimPath = join(privateRoot, ".initialize.json");
  const stagedManifest = join(privateRoot, `.manifest-${process.pid}-${randomUUID()}.tmp`);
  const createdPrivateRoot = !existsSync(privateRoot);
  const createdReadme = !existsSync(readmePath);
  let claimed = false;
  let createdDatabase = false;
  let wroteStagedManifest = false;
  let wroteReadme = false;
  let store;
  try {
    mkdirSync(privateRoot, { recursive: true });
    try {
      writeFileSync(claimPath, `${JSON.stringify({
        schema_version: 1,
        workspace_id: manifest.workspace_id,
        manifest_digest: createHash("sha256").update(JSON.stringify(manifest)).digest("hex")
      })}
`, { flag: "wx", mode: 384 });
    } catch (error) {
      if (error.code === "EEXIST") {
        throw Object.assign(new Error("workspace initialization is already in progress"), {
          code: "VERSION_CONFLICT"
        });
      }
      throw error;
    }
    claimed = true;
    const unexpected = readdirSync(privateRoot).filter((entry) => entry !== basename(claimPath));
    if (unexpected.length) {
      throw Object.assign(new Error(`workspace initialization found pre-existing private state: ${unexpected.join(", ")}`), {
        code: "VERSION_CONFLICT"
      });
    }
    mkdirSync(runtimeRoot, { recursive: true });
    writeFileSync(stagedManifest, `${JSON.stringify(manifest, null, 2)}
`, { flag: "wx", mode: 384 });
    wroteStagedManifest = true;
    store = openStore({ path: databasePath, mode: "create" });
    createdDatabase = true;
    closeStore(store);
    store = null;
    if (createdReadme) {
      mkdirSync(dirname(readmePath), { recursive: true });
      writeFileSync(readmePath, README_CONTENT, { flag: "wx" });
      wroteReadme = true;
    }
    const activated = schema5WorkspaceValidation(root, manifest, { env, requireActivated: true });
    if (activated.errors.length) {
      throw Object.assign(new Error(activated.errors.join("; ")), { code: "INVALID_INPUT" });
    }
    renameSync(stagedManifest, manifestPath);
    rmSync(claimPath, { force: true });
    return { ok: true, root, manifestPath, databasePath, readmePath };
  } catch (error) {
    closeStore(store);
    if (wroteStagedManifest) rmSync(stagedManifest, { force: true });
    if (createdDatabase) {
      for (const path of [
        `${databasePath}-wal`,
        `${databasePath}-shm`,
        `${databasePath}-journal`,
        databasePath
      ]) {
        rmSync(path, { force: true });
      }
    }
    if (wroteReadme) rmSync(readmePath, { force: true });
    if (claimed) rmSync(claimPath, { force: true });
    if (createdPrivateRoot && claimed) rmSync(privateRoot, { recursive: true, force: true });
    return { ok: false, code: error.code ?? "INVALID_INPUT", reason: error.message };
  }
}
function checkWorkspace(root, options = {}) {
  const rootProblem = nativeAbsolutePathProblem(root, {
    label: "workspace root",
    requireExisting: true,
    requireCanonical: true
  });
  if (rootProblem) return { errors: [rootProblem], warnings: [] };
  root = resolve(root);
  const result = readWorkspaceManifest(root);
  if (!result.ok) return { errors: [result.reason], warnings: [] };
  if (result.manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    return { errors: [`SCHEMA_MISMATCH: ${UNSUPPORTED_SCHEMA}`], warnings: [] };
  }
  const checked = schema5WorkspaceValidation(root, result.manifest, {
    env: options.env ?? process.env,
    allowUnregisteredExternal: options.allowUnregisteredExternal ?? false,
    requireActivated: true
  });
  return { errors: checked.errors, warnings: checked.warnings };
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
    owner = JSON.parse(readFileSync(lockPath, "utf8"));
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
    const current = JSON.parse(readFileSync(lockPath, "utf8"));
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
function registryLock(env, action) {
  const path = registryPath(env);
  const lockPath = `${path}.lock`;
  mkdirSync(dirname(path), { recursive: true });
  const token = `${process.pid}:${randomUUID()}`;
  const deadline = Date.now() + 5e3;
  let fd;
  while (Date.now() < deadline) {
    try {
      fd = openSync(lockPath, "wx");
      writeFileSync(fd, `${JSON.stringify({ pid: process.pid, token })}
`);
      break;
    } catch (error) {
      if (error.code !== "EEXIST") {
        return { ok: false, reason: `cannot lock workspace registry: ${error.message}` };
      }
      if (recoverDeadRegistryLock(lockPath)) continue;
      Atomics.wait(registryWait, 0, 0, 50);
    }
  }
  if (fd === void 0) return { ok: false, reason: `workspace registry is busy: ${lockPath}` };
  try {
    return action();
  } finally {
    closeSync(fd);
    try {
      const owner = JSON.parse(readFileSync(lockPath, "utf8"));
      if (owner.token === token) unlinkSync(lockPath);
    } catch {
    }
  }
}
function writeRegistryUnlocked(entries, env = process.env) {
  const path = registryPath(env);
  mkdirSync(dirname(path), { recursive: true });
  const next = `${path}.${process.pid}.${randomUUID()}.tmp`;
  writeFileSync(next, `${JSON.stringify({ schema_version: 1, workspaces: entries }, null, 2)}
`);
  const deadline = Date.now() + 2e3;
  try {
    while (true) {
      try {
        renameSync(next, path);
        return path;
      } catch (error) {
        if (!["EPERM", "EACCES", "EBUSY"].includes(error.code) || Date.now() >= deadline) {
          throw error;
        }
        Atomics.wait(registryWait, 0, 0, 25);
      }
    }
  } finally {
    rmSync(next, { force: true });
  }
}
function writeRegistry(entries, env = process.env) {
  return registryLock(env, () => ({ ok: true, path: writeRegistryUnlocked(entries, env) }));
}
function adoptWorkspace({ root, projectRoot, env = process.env }) {
  const rootProblem = nativeAbsolutePathProblem(root, {
    label: "external workspace root",
    requireExisting: true,
    requireCanonical: true
  });
  const projectProblem = nativeAbsolutePathProblem(projectRoot, {
    label: "external project root",
    requireExisting: true,
    requireCanonical: true
  });
  if (rootProblem || projectProblem) return { ok: false, reason: rootProblem ?? projectProblem };
  root = resolve(root);
  projectRoot = resolve(projectRoot);
  const checked = checkWorkspace(root, { allowUnregisteredExternal: true, env });
  if (checked.errors.length) return { ok: false, reason: `workspace is invalid: ${checked.errors[0]}` };
  const manifest = readWorkspaceManifest(root).manifest;
  if (manifest.placement !== "external") {
    return { ok: false, reason: "only external workspaces need machine-local registry adoption" };
  }
  const project = manifest.projects.find((candidate) => resolve(candidate.path) === projectRoot);
  if (!project) return { ok: false, reason: `manifest does not bind project "${projectRoot}"` };
  return registryLock(env, () => {
    const registry = loadWorkspaceRegistry(env);
    if (!registry.ok) return registry;
    const retained = registry.entries.filter((entry) => resolve(entry.project_root) !== projectRoot);
    retained.push({
      project_root: projectRoot,
      workspace_root: root,
      workspace_id: manifest.workspace_id
    });
    retained.sort((left, right) => left.project_root.localeCompare(right.project_root));
    return { ok: true, path: writeRegistryUnlocked(retained, env) };
  });
}
function forgetWorkspace({ projectRoot, env = process.env }) {
  const projectProblem = nativeAbsolutePathProblem(projectRoot, {
    label: "external project root",
    requireExisting: false,
    requireCanonical: true
  });
  if (projectProblem) return { ok: false, reason: projectProblem };
  projectRoot = resolve(projectRoot);
  return registryLock(env, () => {
    const registry = loadWorkspaceRegistryForCleanup(env);
    if (!registry.ok) return registry;
    const retained = registry.entries.filter((entry) => resolve(entry.project_root) !== projectRoot);
    if (retained.length === registry.entries.length) {
      return { ok: false, reason: `project "${projectRoot}" is not registered` };
    }
    return { ok: true, path: writeRegistryUnlocked(retained, env) };
  });
}
function jsonText(value) {
  return JSON.stringify(value, null, 2).replace(/[\u200b\u200e\u200f\u202a-\u202e\u2066-\u2069]/g, (character) => `\\u${character.charCodeAt(0).toString(16).padStart(4, "0")}`);
}
function reportDiagnostics(errors) {
  const diagnostics = errors.map((error) => {
    if (error.startsWith("SCHEMA_MISMATCH:") || error.startsWith("RECOVERY_REQUIRED:") || error.startsWith("INVALID_INPUT:")) {
      return error;
    }
    return `INVALID_INPUT: ${error}`;
  });
  const code = diagnostics.some((error) => error.startsWith("SCHEMA_MISMATCH:")) ? "SCHEMA_MISMATCH" : diagnostics.some((error) => error.startsWith("RECOVERY_REQUIRED:")) ? "RECOVERY_REQUIRED" : diagnostics.length ? "INVALID_INPUT" : null;
  return { code, diagnostics };
}
function report(root, result, json = false) {
  const { code, diagnostics } = reportDiagnostics(result.errors);
  if (json) {
    console.log(jsonText({
      ok: diagnostics.length === 0,
      code,
      root,
      errors: diagnostics,
      warnings: result.warnings
    }));
    return diagnostics.length ? 1 : 0;
  }
  for (const warning of result.warnings) console.log(`  ! ${warning}`);
  for (const error of diagnostics) console.log(`  \u2717 ${error}`);
  if (!diagnostics.length) {
    console.log(`\u2713 workspace healthy \u2014 claimable (${root === process.cwd() ? "." : root})`);
    return 0;
  }
  console.log(`\u2717 workspace not claimable: ${diagnostics.length} error(s)`);
  return 1;
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
  for (const entry of registry.entries) {
    console.log(`  ${entry.project_root} -> ${entry.workspace_root} (${entry.workspace_id})`);
  }
  if (!registry.entries.length) console.log("  (empty)");
  return 0;
}
var isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  const value = (flag) => {
    const index = argv.indexOf(flag);
    return index !== -1 && argv[index + 1] ? argv[index + 1] : null;
  };
  if (argv.includes("--initialize")) {
    const root = value("--root");
    if (!root || !argv.includes("--confirm")) {
      console.error("--initialize requires --root <workspace> and --confirm");
      process.exit(1);
    }
    let manifest;
    try {
      manifest = JSON.parse(readFileSync(0, "utf8"));
    } catch (error) {
      console.error(`workspace initialization failed: stdin must contain one manifest JSON object (${error.message})`);
      process.exit(1);
    }
    const result = initializeWorkspace({ root, manifest, env: process.env, confirm: true });
    if (!result.ok) {
      console.error(`workspace initialization failed: ${result.code}: ${result.reason}`);
      process.exit(1);
    }
    console.log(`workspace initialized at ${result.root}`);
    process.exit(0);
  }
  if (argv.includes("--registry")) {
    const env = value("--kai-home") ? { ...process.env, KAI_HOME: resolve(value("--kai-home")) } : process.env;
    process.exit(reportRegistry({ env, json: argv.includes("--json") }));
  }
  if (value("--adopt")) {
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
  }
  if (value("--forget")) {
    const env = value("--kai-home") ? { ...process.env, KAI_HOME: resolve(value("--kai-home")) } : process.env;
    const result = forgetWorkspace({ projectRoot: value("--forget"), env });
    if (!result.ok) {
      console.error(`workspace removal failed: ${result.reason}`);
      process.exit(1);
    }
    console.log(`workspace binding removed from ${result.path}; workspace files were not deleted`);
    process.exit(0);
  }
  const resolved = resolveWorkspaceRoot({
    explicitRoot: value("--root"),
    cwd: process.cwd(),
    env: process.env
  });
  if (!resolved.ok) {
    console.error(`workspace-doctor: ${resolved.reason}`);
    process.exit(1);
  }
  process.exit(report(
    resolved.root,
    checkWorkspace(resolved.root, { env: process.env }),
    argv.includes("--json")
  ));
}
export {
  adoptWorkspace,
  checkWorkspace,
  forgetWorkspace,
  initializeWorkspace,
  writeRegistry
};
