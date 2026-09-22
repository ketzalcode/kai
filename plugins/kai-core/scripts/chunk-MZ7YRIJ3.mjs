import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  RuntimeError
} from "./chunk-VP4QXWCX.mjs";

// src/core/lib/coordination-runtime/native-discovery.mjs
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";
import { existsSync, readFileSync } from "node:fs";
import { delimiter, dirname, isAbsolute, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
var fail = (message) => new RuntimeError("UNSUPPORTED_HOST", message);
var owners = /* @__PURE__ */ new Set(["kai-core", "kai-engineering", "kai-creative"]);
var options = (list) => (list ?? []).flatMap((entry) => entry.options ?? [entry]);
function discoveryRoots(here) {
  const ancestors = [];
  for (let dir = here, up = dirname(dir); ; up = dirname(dir = up)) {
    ancestors.push(dir);
    if (up === dir) break;
  }
  return {
    pluginRoot: ancestors.find((dir) => existsSync(join(dir, "agents"))) ?? resolve(here, ".."),
    repoRoot: ancestors.find((dir) => existsSync(join(dir, "plugins"))) ?? resolve(here, "..", "..")
  };
}
var HERE = dirname(fileURLToPath(import.meta.url));
var { pluginRoot, repoRoot } = discoveryRoots(HERE);
function copilotLaunch(env = process.env) {
  const executable = env.KAI_COPILOT_EXECUTABLE || "copilot";
  const pluginDirs = (env.KAI_COPILOT_PLUGIN_DIRS ?? "").split(delimiter).filter(Boolean);
  if (pluginDirs.some((p) => !isAbsolute(p) || !existsSync(p))) throw fail("KAI_COPILOT_PLUGIN_DIRS must contain existing absolute native provider directories");
  return { executable, pluginDirs, pluginArguments: pluginDirs.flatMap((path) => ["--plugin-dir", path]) };
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
  child.on("error", (error) => rejectAll(fail(`native executable cannot start (${error.code ?? "unknown"}); configure KAI_COPILOT_EXECUTABLE in trusted launch environment`)));
  child.on("exit", (code) => {
    if (pending.size) rejectAll(fail(`metadata ACP exited before discovery (${code})`));
  });
  child.stdin.on("error", (error) => rejectAll(fail(`metadata ACP input closed (${error.code})`)));
  child.stderr.resume();
  const lines = createInterface({ input: child.stdout, crlfDelay: Infinity });
  lines.on("line", (line) => {
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      rejectAll(fail("native ACP emitted non-JSON metadata"));
      return;
    }
    const waiter = pending.get(message.id);
    if (waiter) {
      pending.delete(message.id);
      clearTimeout(waiter.timer);
      if (message.error) waiter.reject(fail(`native metadata ACP request failed (${message.error.code})`));
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
      reject(fail(`metadata ACP timed out during ${method}`));
    }, 3e4);
    pending.set(requestId, { resolve: resolveResult, reject, timer });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id: requestId, method, params })}
`);
  });
  let result;
  try {
    const initialized = await call("initialize", { protocolVersion: 1, clientCapabilities: {} });
    if (initialized?.agentInfo?.version !== "1.0.85") {
      throw fail(`native adapter measured only Copilot CLI 1.0.85; observed ${initialized?.agentInfo?.version ?? "unknown"}`);
    }
    const session = await call("session/new", { cwd: root, mcpServers: [] });
    const agentOption = session.configOptions?.find((o) => o.id === "agent" && o.category === "_agent" && o.type === "select");
    const modelIds = session.models?.availableModels?.map((m) => m.modelId);
    if (!agentOption || !Array.isArray(modelIds) || modelIds.some((m) => typeof m !== "string")) throw fail("native host omitted measured agent/model metadata");
    const roster = options(agentOption.options).flatMap((entry) => {
      if (typeof entry.value !== "string") return [];
      const [owner, role2, extra] = entry.value.split(":");
      if (!owners.has(owner) || !role2 || extra) return [];
      return [{ id: entry.value, role: role2, model: null }];
    });
    if (new Set(roster.map((r) => r.role)).size !== roster.length) throw fail("native host advertises ambiguous duplicate role identities");
    let prepared;
    if (role !== void 0) {
      const entry = roster.find((r) => r.role === role);
      if (!entry) throw new RuntimeError("ROLE_UNAVAILABLE", "requested preparation role is absent from the actual native roster");
      const selected = await call("session/set_config_option", { sessionId: session.sessionId, configId: "agent", value: entry.id });
      if (selected?.configOptions?.find((o) => o.id === "agent")?.currentValue !== entry.id) {
        throw fail("native host did not confirm the exact requested agent selection");
      }
      prepared = { actor: { role, runId: session.sessionId }, agentId: entry.id };
    }
    const profiles = {};
    for (const entry of roster) {
      const [owner, role2] = entry.id.split(":");
      const candidates = [
        ...pluginDirs.map((dir) => join(dir, "agents", `${role2}.agent.md`)),
        join(pluginRoot, "agents", `${role2}.agent.md`),
        join(repoRoot, "plugins", owner, "agents", `${role2}.agent.md`)
      ];
      const path = candidates.find((p) => existsSync(p));
      if (!path) continue;
      const text = readFileSync(path, "utf8");
      profiles[role2] = /\*\*Primary profile:\*\*\s*([a-z-]+)/.exec(text)?.[1];
      entry.model = /^model:\s*"?([^"\r\n]+)"?/m.exec(text)?.[1] ?? null;
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

export {
  discoveryRoots,
  copilotLaunch,
  discoverCopilot
};
