#!/usr/bin/env node
// activity — the writer for the declared activity log.
//
// Agents are prompt documents with no runtime, so "reporting" has to be a
// command they can run. This is that command: one bounded append per call.
//
//   activity start    --root <ws> --role <r> --run <id> [--item <i>] --for 30m
//   activity progress --root <ws> --role <r> --run <id> --for 20m [--note "..."]
//   activity stop     --root <ws> --role <r> --run <id> --outcome handoff
//
// It reports *activity*, never *state*. State, verdicts, and reviews live on
// the coordination item and are rejected here by the shared library.
//
// Exits 0 on a successful append and 0 on a rejected one only when --quiet is
// set; otherwise a rejection exits 1 so a mistake in an agent's invocation is
// visible rather than silently dropping the signal.
//
// Node built-ins only; writes one gitignored file.

import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomBytes } from 'node:crypto';
import { append, read, runs, LOG_REL, FORBIDDEN_FIELDS } from './lib/activity.mjs';
import { resolveWorkspaceRoot } from './lib/workspace-resolve.mjs';

const DUR = /^(\d+)(s|m|h)$/;

export function parseDuration(v) {
  const m = DUR.exec(String(v || '').trim());
  if (!m) return null;
  const n = Number(m[1]);
  return m[2] === 's' ? n : m[2] === 'm' ? n * 60 : n * 3600;
}

export function parseArgs(argv) {
  const out = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith('--')) {
      const body = a.slice(2);
      // Support --key=value as well as --key value, so a flag the contract
      // rejects is still *seen* and reported rather than silently ignored.
      const eq = body.indexOf('=');
      if (eq !== -1) { out[body.slice(0, eq)] = body.slice(eq + 1); continue; }
      const key = body;
      const next = argv[i + 1];
      if (next === undefined || next.startsWith('--')) out[key] = true;
      else { out[key] = next; i++; }
    } else out._.push(a);
  }
  return out;
}

export function newRunId() {
  return randomBytes(5).toString('hex');
}

function main(argv) {
  const args = parseArgs(argv);
  const cmd = args._[0];
  if (!cmd || args.help) {
    console.log([
      'usage: activity <start|progress|stop|show> --root <workspace> --role <role> --run <id> [options]',
      '',
      `  writes ${LOG_REL} (gitignored, append-only)`,
      '',
      '  --for <30m|2h|90s>   when this run will report next (required for start/progress)',
      '  --item <item-id>     the coordination item this run serves',
      '  --outcome <handoff|done|blocked|abandoned>   required for stop',
      '  --note "<text>"      one short bounded line; paths are rejected',
      '  --new-run            print a fresh run id and exit',
    ].join('\n'));
    return 0;
  }

  if (args['new-run'] || cmd === 'new-run') {
    console.log(newRunId());
    return 0;
  }

  const resolved = resolveWorkspaceRoot({ explicitRoot: args.root, cwd: process.cwd() });
  if (!resolved.ok) {
    console.error(`activity: ${resolved.reason}`);
    return 1;
  }
  const root = resolved.root;

  if (cmd === 'show') {
    const log = read(root);
    if (!log.present) { console.log('activity: no log yet'); return 0; }
    const open = runs(log.records).filter((r) => r.open);
    if (!open.length) { console.log(`activity: ${log.records.length} record(s), no open run`); return 0; }
    for (const r of open) {
      const flag = r.overdue ? ' OVERDUE' : '';
      console.log(`  ${r.role}${r.item ? ` on ${r.item}` : ''} — run ${r.run}, silent ${Math.round((r.silent_for || 0) / 60)}m${flag}`);
    }
    return 0;
  }

  if (!['start', 'progress', 'stop'].includes(cmd)) {
    console.error(`activity: unknown command "${cmd}"`);
    return 1;
  }

  const input = { e: cmd, role: args.role, run: args.run, item: args.item, note: args.note };
  // The library rejects forbidden fields, but the CLI must reject the *flags*
  // too: an agent that reaches for `--state` should be told the boundary exists
  // rather than have the flag silently ignored.
  for (const k of Object.keys(args)) {
    if (FORBIDDEN_FIELDS.has(k.toLowerCase().replace(/-/g, '_'))) input[k.toLowerCase().replace(/-/g, '_')] = args[k];
  }
  if (cmd === 'stop') input.outcome = args.outcome;
  else {
    const secs = parseDuration(args.for);
    if (secs === null) { console.error('activity: --for is required for start/progress (e.g. --for 30m)'); return 1; }
    input.next_report_by = Math.floor(Date.now() / 1000) + secs;
  }

  const r = append(root, input);
  if (!r.ok) {
    if (args.quiet) return 0;
    console.error(`activity: not recorded — ${r.reason}`);
    return 1;
  }
  if (!args.quiet) console.log(`activity: ${cmd} recorded for ${r.record.role} (run ${r.record.run})`);
  return 0;
}

// --- cli -------------------------------------------------------------------
// Guarded: importing this module must not run the CLI or exit the process.
const isEntry = process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isEntry) {
  const argv = process.argv.slice(2);
  process.exit(main(argv));
}
