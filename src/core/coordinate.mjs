#!/usr/bin/env node
import {pathToFileURL} from 'node:url';
import {isAbsolute} from 'node:path';
import {RuntimeError} from './lib/coordination-runtime/contract.mjs';

const flags = {
  direct: [], inspect: ['deep'], status: [], context: ['item', 'max-bytes', 'recent-limit'],
  detail: ['kind', 'id'], messages: ['item', 'before-seq', 'limit'],
  export: ['item'], legacy: ['source', 'raw'], hash: ['path'],
  init: ['confirm', 'capability'], migrate: ['confirm', 'capability'],
  recover: ['confirm', 'action', 'capability'], rollback: ['confirm', 'capability'],
  repair: ['capability'], apply: ['capability', 'capture'],
  request: [], authorize: ['request', 'tool-call'], capture: ['tool-call'],
  receipt: ['request', 'tool-call'],
  prepare: [], delegate: ['capability'], claim: ['item', 'capability'],
  capabilities: [], plan: ['item'],
};
const booleans = new Set(['deep', 'raw', 'confirm']);
const inputVerbs = new Set(['apply', 'repair', 'request', 'capture', 'prepare', 'delegate']);
const invalid = message => { throw new RuntimeError('INVALID_INPUT', message); };

export function parseArguments(argv) {
  const [verb, ...rest] = argv;
  if (!Object.hasOwn(flags, verb)) invalid(`unknown verb; expected ${Object.keys(flags).join(', ')}`);
  const options = {};
  for (let i = 0; i < rest.length; i++) {
    const key = rest[i].startsWith('--') ? rest[i].slice(2) : '';
    if (!['root', ...flags[verb]].includes(key) || Object.hasOwn(options, key)) invalid(`unknown or duplicate option: ${rest[i]}`);
    if (booleans.has(key)) options[key] = true;
    else {
      const value = rest[++i];
      if (!value || value.startsWith('--')) invalid(`--${key} requires a value`);
      options[key] = value;
    }
  }
  if (options.root && !isAbsolute(options.root)) invalid('--root must be absolute');
  for (const key of ['max-bytes', 'recent-limit', 'before-seq', 'limit']) {
    if (options[key] !== undefined) {
      if (!/^\d+$/.test(options[key]) || !Number.isSafeInteger(Number(options[key]))) invalid(`--${key} requires an integer`);
      options[key] = Number(options[key]);
    }
  }
  if (options['max-bytes'] !== undefined && (options['max-bytes'] < 1 || options['max-bytes'] > 24 * 1024)) invalid('--max-bytes must be 1..24576');
  if (options['recent-limit'] !== undefined && options['recent-limit'] > 8) invalid('--recent-limit must be 0..8');
  return {verb, options};
}

async function readInput(stream) {
  let bytes = 0;
  const chunks = [];
  for await (const chunk of stream) {
    bytes += Buffer.byteLength(chunk);
    if (bytes > 1024 * 1024) invalid('command input exceeds 1 MiB');
    chunks.push(chunk);
  }
  return Buffer.concat(chunks.map(c => Buffer.from(c))).toString('utf8');
}

/** Trusted host is an in-memory object, never a path, module or serialized flag. */
export async function runCLI(argv, {host, input, stdin = process.stdin, cwd = process.cwd(), env = process.env} = {}) {
  try {
    const {verb, options} = parseArguments(argv);
    if (verb === 'direct') return {exitCode: 0, result: {ok: true, mode: verb, coordinationRequired: false}};
    let body;
    if (inputVerbs.has(verb)) {
      const text = input ?? await readInput(stdin);
      try { body = JSON.parse(text); } catch { invalid('stdin must contain exactly one JSON object'); }
      if (!body || typeof body !== 'object' || Array.isArray(body)) invalid('stdin must be a JSON object');
    }
    try { await import('node:sqlite'); }
    catch (error) {
      if (error.code !== 'ERR_UNKNOWN_BUILTIN_MODULE') throw error;
      throw new RuntimeError('UNSUPPORTED_HOST', 'node:sqlite unavailable; use Node ^22.22.2, ^24.15.0 or >=26');
    }
    const {execute} = await import('./lib/coordination-runtime/cli.mjs');
    const result = await execute({verb, options, body, host, cwd, env});
    return {exitCode: 0, result};
  } catch (error) {
    if (!(error instanceof RuntimeError)) throw error;
    return {exitCode: error.retryable ? 2 : 1, result: {
      ok: false, code: error.code, message: error.message, retryable: error.retryable,
    }};
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    const {exitCode, result} = await runCLI(process.argv.slice(2));
    process.stdout.write(`${JSON.stringify(result)}\n`);
    if (exitCode) process.stderr.write(`${result.code}: ${result.message}\n`);
    process.exitCode = exitCode;
  } catch (error) {
    process.stderr.write(`Internal failure: ${error.message}\n`);
    process.exitCode = 1;
  }
}
