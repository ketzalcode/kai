#!/usr/bin/env node
// demo-status — artifact-backed stage status and safe resume for demo production.
//
// Why this exists
// ----------------
// An interrupted production leaves files on disk, but a file existing is not
// the same claim as a file being accepted. After a crash, "narration is
// complete" has to come from somewhere more durable than "the clip is still
// there" -- the clip could be half-written, or produced from a screenplay
// that was since edited. This tool persists a lean receipt each stage can
// record when it actually finishes, and on resume it recomputes the same
// identity (a content hash of the output and of every declared input) before
// ever calling a prior stage "complete" again.
//
// What this tool will not do
// ---------------------------
// Run any stage, mix any file, or retry anything. It only measures identity
// and reports status. In particular it never upgrades an uncertain or failed
// stage to "complete" on its own, and it never retries a paid operation --
// an "unknown" or "failed" stage is always returned to the operator to decide.

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';

export const RECEIPTS_SCHEMA = 'kai.demo-stage-receipts/v1';
export const DESCRIPTOR_SCHEMA = 'kai.demo-production-descriptor/v1';
const RECEIPT_STATUSES = new Set(['ok', 'failed']);
// Four states a stage can be reported in. "unknown" is deliberately distinct
// from both "complete" and "failed": it means a file exists but this tool has
// no verified receipt for it, so no claim about its acceptance can be made.
const REPORT_STATUSES = new Set(['complete', 'pending', 'stale', 'failed', 'unknown']);

function fail(message) {
  throw new Error(message);
}

function str(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be a non-empty string`);
  return value;
}

export function hashFile(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex').slice(0, 16);
}

// -------------------------------------------------------------------- descriptor

// What the operator declares matters for this production: one entry per
// pipeline stage, naming its output artifact and the inputs that output was
// built from. Declaring the pipeline is a human decision -- this tool never
// guesses which files belong to which stage.
export function parseDescriptor(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the production descriptor is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== DESCRIPTOR_SCHEMA) {
    fail(`the production descriptor must declare "schema": "${DESCRIPTOR_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  if (!Array.isArray(raw.stages) || raw.stages.length === 0) fail('the production descriptor must list at least one stage');
  const seen = new Set();
  return raw.stages.map((stage, i) => {
    const where = `stages[${i}]`;
    const name = str(stage.stage, `${where}.stage`);
    if (seen.has(name)) fail(`${where}.stage "${name}" is used twice; a stage name must be unique in a production`);
    seen.add(name);
    return {
      stage: name,
      output: str(stage.output, `${where}.output`),
      inputs: Array.isArray(stage.inputs) ? stage.inputs.map((p, j) => str(p, `${where}.inputs[${j}]`)) : [],
      optional: stage.optional === true,
    };
  });
}

// -------------------------------------------------------------------- receipts

export function loadReceipts(path) {
  if (!existsSync(path)) return { schema: RECEIPTS_SCHEMA, stages: {} };
  let raw;
  try {
    raw = JSON.parse(readFileSync(path, 'utf8'));
  } catch (error) {
    fail(`${path} is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== RECEIPTS_SCHEMA) fail(`${path} must declare "schema": "${RECEIPTS_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  return raw;
}

// Records that a stage actually finished (successfully or not), keyed by the
// exact bytes it consumed and produced. A stage records its own receipt right
// after it runs; this tool never infers one from an existing file.
export function recordStage(receiptsPath, stageName, { output, inputs = [], status, note = '' }) {
  if (!RECEIPT_STATUSES.has(status)) fail(`status must be one of ${[...RECEIPT_STATUSES].join(', ')}, got ${JSON.stringify(status)}`);
  if (status === 'ok' && !existsSync(output)) fail(`cannot record "${stageName}" as ok: its declared output "${output}" does not exist`);
  for (const input of inputs) {
    if (!existsSync(input)) fail(`cannot record "${stageName}": its declared input "${input}" does not exist`);
  }

  const receipts = loadReceipts(receiptsPath);
  receipts.stages[stageName] = {
    status,
    output_hash: status === 'ok' ? hashFile(output) : null,
    input_hashes: Object.fromEntries(inputs.map((input) => [input, hashFile(input)])),
    recorded_at: new Date().toISOString(),
    note,
  };
  mkdirSync(dirname(receiptsPath) || '.', { recursive: true });
  writeFileSync(receiptsPath, JSON.stringify(receipts, null, 2));
  return receipts.stages[stageName];
}

// -------------------------------------------------------------------- report

// The actual safe-resume decision, per stage. Deliberately conservative: any
// ambiguity resolves to "unknown" or "stale", never to "complete".
export function computeStageStatus(descriptorStage, receipts) {
  const { stage, output, inputs, optional } = descriptorStage;
  const receipt = receipts.stages[stage];

  if (!existsSync(output)) {
    if (receipt?.status === 'failed') {
      // Recorded failure and still no output: still failed, not merely pending.
      const inputsMatch = inputsStillMatch(inputs, receipt);
      return { stage, status: inputsMatch ? 'failed' : 'pending', optional, reason: inputsMatch ? 'previously recorded as failed with unchanged inputs' : 'inputs changed since the recorded failure; ready to retry' };
    }
    return { stage, status: 'pending', optional, reason: optional ? 'optional stage, not yet attempted' : 'not yet produced' };
  }

  if (!receipt) {
    return { stage, status: 'unknown', optional, reason: 'the output file exists but no receipt was ever recorded for it; its acceptance cannot be verified' };
  }

  const missingInput = inputs.find((input) => !existsSync(input));
  if (missingInput) {
    return { stage, status: 'unknown', optional, reason: `input "${missingInput}" no longer exists, so this stage's correspondence cannot be reverified` };
  }

  const currentOutputHash = hashFile(output);
  const outputMatches = currentOutputHash === receipt.output_hash;
  const inputsMatch = inputsStillMatch(inputs, receipt);

  if (receipt.status === 'failed') {
    return { stage, status: inputsMatch ? 'failed' : 'pending', optional, reason: inputsMatch ? 'previously recorded as failed with unchanged inputs' : 'inputs changed since the recorded failure; ready to retry' };
  }
  if (outputMatches && inputsMatch) {
    return { stage, status: 'complete', optional, reason: 'output and every input hash match the recorded receipt' };
  }
  if (!outputMatches) {
    return { stage, status: 'unknown', optional, reason: 'the output file has changed since it was recorded as accepted; its current content is unverified' };
  }
  return { stage, status: 'stale', optional, reason: 'the recorded output still matches, but a declared input has changed since; it may need to be redone' };
}

function inputsStillMatch(inputs, receipt) {
  return inputs.every((input) => existsSync(input) && hashFile(input) === receipt.input_hashes?.[input]);
}

export function buildProductionReport(descriptor, receipts) {
  const stages = descriptor.map((stage) => computeStageStatus(stage, receipts));
  const pending = stages.filter((s) => s.status !== 'complete').map((s) => ({
    stage: s.stage,
    status: s.status,
    action: s.status === 'failed'
      ? `review the recorded failure for "${s.stage}" before deciding whether to retry; do not retry automatically`
      : s.status === 'unknown'
        ? `verify "${s.stage}" manually; an existing file is not proof it was accepted`
        : s.status === 'stale'
          ? `re-run "${s.stage}"; its inputs changed since it was last accepted`
          : `run "${s.stage}"`,
  }));
  return {
    schema: 'kai.demo-production-report/v1',
    stages,
    pending_operations: pending,
    all_complete: pending.filter((p) => !descriptor.find((d) => d.stage === p.stage)?.optional).length === 0,
  };
}

// -------------------------------------------------------------------- cli

function usage() {
  console.log(`demo-status — artifact-backed stage status and safe resume

  --record <stage-name> --output <path> [--input <path> ...] --status ok|failed [--note "<text>"] --receipts <receipts.json>
      Record that a stage actually finished, keyed by the content hash of its
      output and every declared input.

  --report <descriptor.json> --receipts <receipts.json>
      Print the current verified status of every declared stage: complete,
      pending, stale, failed, or unknown. Never retries anything itself.
`);
}

function flag(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

function allFlags(argv, name) {
  const out = [];
  argv.forEach((a, i) => { if (a === name && argv[i + 1]) out.push(argv[i + 1]); });
  return out;
}

function main(argv) {
  if (argv.includes('--record')) {
    const stageName = argv[argv.indexOf('--record') + 1];
    if (!stageName) fail('--record needs a stage name');
    const output = flag(argv, '--output') ?? fail('--record needs --output <path>');
    const inputs = allFlags(argv, '--input');
    const status = flag(argv, '--status') ?? fail('--record needs --status ok|failed');
    const note = flag(argv, '--note', '');
    const receiptsPath = flag(argv, '--receipts') ?? fail('--record needs --receipts <receipts.json>');
    const stored = recordStage(receiptsPath, stageName, { output, inputs, status, note });
    console.log(JSON.stringify(stored, null, 2));
    console.log(`\nrecorded "${stageName}" in ${receiptsPath}`);
    return 0;
  }

  if (argv.includes('--report')) {
    const descriptorPath = argv[argv.indexOf('--report') + 1];
    if (!descriptorPath) fail('--report needs <descriptor.json>');
    const receiptsPath = flag(argv, '--receipts') ?? fail('--report needs --receipts <receipts.json>');
    const descriptor = parseDescriptor(readFileSync(descriptorPath, 'utf8'));
    const receipts = loadReceipts(receiptsPath);
    const report = buildProductionReport(descriptor, receipts);
    console.log(JSON.stringify(report, null, 2));
    return 0;
  }

  usage();
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('demo-status.mjs')) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`demo-status: ${error.message}`);
    process.exit(1);
  }
}
