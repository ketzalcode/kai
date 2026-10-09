#!/usr/bin/env node
import{createRequire as __cr}from'node:module';const require=__cr(import.meta.url);
import {
  HIERARCHY_KINDS,
  RECORD_KINDS,
  RuntimeError,
  cli_exports,
  validateHierarchySubject
} from "./runtime-core.mjs";

// src/core/coordinate.mjs
import { fileURLToPath, pathToFileURL } from "node:url";
import { isAbsolute, resolve } from "node:path";
var flags = {
  direct: [],
  inspect: ["deep"],
  status: [],
  context: ["kind", "id", "max-bytes", "recent-limit"],
  detail: ["kind", "id"],
  messages: ["kind", "id", "before-seq", "limit"],
  export: ["kind", "id"],
  hash: ["path"],
  apply: ["capability", "capture"],
  request: [],
  authorize: ["request", "tool-call"],
  capture: ["tool-call"],
  receipt: ["request", "tool-call"],
  prepare: [],
  delegate: ["capability"],
  claim: ["task", "capability"],
  capabilities: [],
  plan: ["kind", "id"]
};
var booleans = /* @__PURE__ */ new Set(["deep"]);
var inputVerbs = /* @__PURE__ */ new Set(["apply", "request", "capture", "prepare", "delegate"]);
var hierarchyVerbs = /* @__PURE__ */ new Set(["context", "messages", "export", "plan"]);
var invalid = (message) => {
  throw new RuntimeError("INVALID_INPUT", message);
};
function runtimeEntrypointPath() {
  const entrypoint = resolve(fileURLToPath(import.meta.url));
  const argvEntry = process.argv[1];
  if (!argvEntry) throw new Error("entrypoint verification requires process.argv[1]");
  const invoked = resolve(argvEntry);
  if (invoked !== entrypoint) {
    throw new Error(`entrypoint mismatch: ${invoked} !== ${entrypoint}`);
  }
  return entrypoint;
}
function withEntrypointReport(result, env, entrypoint) {
  if (env?.KAI_TEST_REPORT_COORDINATION_ENTRYPOINT !== "1") return result;
  return {
    ...result,
    entrypoint: entrypoint ?? resolve(fileURLToPath(import.meta.url))
  };
}
function parseArguments(argv) {
  const [verb, ...rest] = argv;
  if (!Object.hasOwn(flags, verb)) invalid(`unknown verb; expected ${Object.keys(flags).join(", ")}`);
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].startsWith("--") ? rest[i].slice(2) : "";
    if (!["root", ...flags[verb]].includes(key) || Object.hasOwn(options, key)) invalid(`unknown or duplicate option: ${rest[i]}`);
    if (booleans.has(key)) options[key] = true;
    else {
      const value = rest[++i];
      if (!value || value.startsWith("--")) invalid(`--${key} requires a value`);
      options[key] = value;
    }
  }
  if (options.root && !isAbsolute(options.root)) invalid("--root must be absolute");
  for (const key of ["max-bytes", "recent-limit", "before-seq", "limit"]) {
    if (options[key] !== void 0) {
      if (!/^\d+$/.test(options[key]) || !Number.isSafeInteger(Number(options[key]))) invalid(`--${key} requires an integer`);
      options[key] = Number(options[key]);
    }
  }
  if (options["max-bytes"] !== void 0 && (options["max-bytes"] < 1 || options["max-bytes"] > 24 * 1024)) invalid("--max-bytes must be 1..24576");
  if (options["recent-limit"] !== void 0 && options["recent-limit"] > 8) invalid("--recent-limit must be 0..8");
  if (hierarchyVerbs.has(verb)) {
    if (options.kind === void 0) invalid("--kind is required");
    if (options.id === void 0) invalid("--id is required");
    validateHierarchySubject({ kind: options.kind, id: options.id }, `${verb} subject`);
  }
  if (verb === "detail") {
    if (options.kind === void 0) invalid("--kind is required");
    if (options.id === void 0) invalid("--id is required");
    if (!RECORD_KINDS.has(options.kind) || (/* @__PURE__ */ new Set(["initiative", "item"])).has(options.kind)) {
      invalid("detail kind is unsupported");
    }
    if (HIERARCHY_KINDS.has(options.kind)) {
      validateHierarchySubject({ kind: options.kind, id: options.id }, "detail subject");
    }
  }
  if (verb === "claim") {
    if (options.task === void 0) invalid("--task is required");
    validateHierarchySubject({ kind: "task", id: options.task }, "claim Task");
  }
  return { verb, options };
}
async function readInput(stream) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of stream) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > 1024 * 1024) invalid("command input exceeds 1 MiB");
    chunks.push(chunk);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c))).toString("utf8");
}
async function runCLI(argv, { host, input, stdin = process.stdin, cwd = process.cwd(), env = process.env, entrypoint } = {}) {
  try {
    const { verb, options } = parseArguments(argv);
    if (verb === "direct") {
      return {
        exitCode: 0,
        result: withEntrypointReport({ ok: true, mode: verb, coordinationRequired: false }, env, entrypoint)
      };
    }
    let body;
    if (inputVerbs.has(verb)) {
      const text = input ?? await readInput(stdin);
      try {
        body = JSON.parse(text);
      } catch {
        invalid("stdin must contain exactly one JSON object");
      }
      if (!body || typeof body !== "object" || Array.isArray(body)) invalid("stdin must be a JSON object");
    }
    try {
      await import("node:sqlite");
    } catch (error) {
      if (error.code !== "ERR_UNKNOWN_BUILTIN_MODULE") throw error;
      throw new RuntimeError("UNSUPPORTED_HOST", "node:sqlite unavailable; use Node ^22.22.2, ^24.15.0 or >=26");
    }
    const { execute } = await Promise.resolve(cli_exports);
    const result = await execute({ verb, options, body, host, cwd, env });
    return { exitCode: 0, result: withEntrypointReport(result, env, entrypoint) };
  } catch (error) {
    const runtimeError = error instanceof RuntimeError || error?.name === "RuntimeError" && typeof error.code === "string" && /^[A-Z][A-Z_]+$/.test(error.code) && typeof error.message === "string" && typeof error.retryable === "boolean";
    if (!runtimeError) throw error;
    return {
      exitCode: error.retryable ? 2 : 1,
      result: withEntrypointReport({
        ok: false,
        code: error.code,
        message: error.message,
        retryable: error.retryable
      }, env, entrypoint)
    };
  }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const { exitCode, result } = await runCLI(process.argv.slice(2), { entrypoint: runtimeEntrypointPath() });
    process.stdout.write(`${JSON.stringify(result)}
`);
    if (exitCode) process.stderr.write(`${result.code}: ${result.message}
`);
    process.exitCode = exitCode;
  } catch (error) {
    process.stderr.write(`Internal failure: ${error.message}
`);
    process.exitCode = 1;
  }
}
export {
  parseArguments,
  runCLI
};
