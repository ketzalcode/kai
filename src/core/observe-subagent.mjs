// The observed half of fleet visibility.
//
// `kai-core-work-activity` (#96) is DECLARED: an agent chooses to report. That is enough
// to build a participation timeline, and not enough to trust one -- when the
// question is "why did no designer ever appear on this feature", a missing role
// means either "not consulted" or "consulted and forgot to log", and those two
// demand opposite responses. This file removes that ambiguity by recording what
// the host itself observed, which an agent cannot forget to emit.
//
// Deliberately narrow. It subscribes to subagent lifecycle only:
//
//   * NOT preToolUse / permissionRequest -- command preToolUse hooks are
//     fail-closed, so a crash here would DENY a user's tool call in a repository
//     that has nothing to do with kai. Post-hoc events only, always.
//   * NOT per-tool-call events -- measured at ~66ms per hook spawn, that is
//     13-33s of added latency per session, paid by every installer including one
//     who declines. Two spawns per subagent is noise.
//   * NOT the main agent -- that is the operator's own conversation, not an
//     employee working a Task.
//
// Two hard output rules, both load-bearing:
//
//   1. stdout stays EMPTY. The host parses a hook's stdout as a decision object,
//      and `subagentStop` honors `decision: "block"` and `modifiedResponse`. A
//      stray character here could force another turn or rewrite the response the
//      parent agent receives. An observer that alters what it observes is not an
//      observer.
//   2. It never throws and always exits 0. A visibility tool that breaks a
//      session costs more than the visibility is worth.
//
// Privacy: the payload's `response` is the FULL subagent reply and `cwd` is an
// absolute path containing a username. Neither is ever stored. `cwd` is used to
// locate the workspace and then discarded; `response` is reduced to a capped,
// path-scrubbed TLDR through the same `safeNote` boundary the declared log uses.

import { existsSync, mkdirSync, appendFileSync, readFileSync, writeFileSync, statSync, renameSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { digest, looksAbsolute, safeNote, MAX_LINE, MAX_BYTES } from './lib/activity.mjs';
import {
  readWorkspaceManifest,
  resolveWorkspaceRoot,
  validateSchema5Manifest,
} from './lib/workspace-resolve.mjs';
import {
  COORDINATION_DATABASE,
  WORKSPACE_SCHEMA_VERSION,
} from './lib/workspace-layout.mjs';
import {inspectGitPrivacy} from './lib/workspace-git-privacy.mjs';
import {readDirection} from './lib/direction.mjs';
import {escapesRoot, pathHasLink} from './lib/workspace-path-safety.mjs';

export const OBSERVED_REL = '.kai/core/runtime/observed.jsonl';
export const CONSENT_REL = '.kai/core/runtime/observer-consent';

// Mirrors the declared log's vocabulary so a viewer can merge the two streams
// without translating between them.
export const OBSERVED_EVENTS = new Set(['start', 'stop']);

// An agent name arrives from the host and is written to a file we later read and
// render, so it is constrained rather than trusted. Deliberately identical to
// the declared log's `ROLE_RE`: the two streams are meant to be merged, and a
// looser rule here would produce records a shared viewer silently drops.
const NAME_RE = /^[a-z0-9-]{1,60}$/;

// ---------------------------------------------------------------------------
// Workspace resolution
//
// The payload gives an absolute `cwd`, which is the ambient location the host
// reported. Unlike an operator's explicit --root, this was never asserted to
// already be the workspace root, so it is the one caller that legitimately
// searches upward for the manifest rather than being validated in place.
// `env` is injectable and defaults to real `process.env` for a general
// caller; the hook path below removes only `KAI_WORKSPACE_ROOT`, preserving
// `KAI_HOME` for external registry discovery. We search upward rather than
// writing beside `cwd` so a subagent spawned in a subdirectory still records
// to the workspace root above it -- and so the absolute path itself is never
// persisted.
// ---------------------------------------------------------------------------
export function findWorkspace(cwd, env = process.env) {
  if (typeof cwd !== 'string' || !cwd) return null;
  const r = resolveWorkspaceRoot({ cwd, env });
  return r.ok ? r.root : null;
}

function writableWorkspace(root, env) {
  const manifest = readWorkspaceManifest(root);
  if (!manifest.ok || manifest.manifest.schema_version !== WORKSPACE_SCHEMA_VERSION) {
    return {ok: false, reason: 'SCHEMA_MISMATCH: schema 3/4 workspaces are read-only'};
  }
  const validation = validateSchema5Manifest(root, manifest.manifest, {env});
  const privacy = inspectGitPrivacy(root, manifest.manifest.placement);
  const errors = [
    ...validation.errors,
    ...privacy.errors,
    ...privacy.missing.map(path => `private workspace path must be ignored: ${path}`),
  ];
  if (manifest.manifest.placement === 'repo-local' && !privacy.gitRoot) {
    errors.push('repo-local placement requires a readable Git work tree');
  }
  try { readDirection({workspaceRoot: root, manifest: manifest.manifest}); }
  catch (error) { errors.push(error.message); }
  const databasePath = join(root, ...COORDINATION_DATABASE.split('/'));
  if (!existsSync(databasePath)) {
    errors.push(`coordination database is missing at ${COORDINATION_DATABASE}`);
  }
  for (const path of [
    databasePath,
    join(root, OBSERVED_REL),
    join(root, CONSENT_REL),
  ]) {
    if (escapesRoot(root, path) || pathHasLink(root, path)) {
      errors.push('schema-5 runtime paths cannot traverse links or escape the workspace');
      break;
    }
  }
  return errors.length ? {ok: false, reason: errors.join('; ')} : {ok: true, manifest: manifest.manifest};
}

// ---------------------------------------------------------------------------
// Consent
//
// There is no host-level "installed but inactive": a plugin's hooks.json fires
// for everyone who installs it, from their next session. So consent cannot live
// in the host -- it has to be a gate inside this script, and the declined path
// has to be the cheapest one, because a user who never opted in still pays for
// every process spawn.
// ---------------------------------------------------------------------------
export function hasConsent(root) {
  return !!root && existsSync(join(root, CONSENT_REL));
}

// Summaries are a SECOND opt-in, on top of consent, and off by default.
//
// The reason is a real limit, not caution: the derived summary is scraped from
// prose a subagent wrote for its parent, not authored for a log. Unlike the
// declared log -- where an agent writes its own `--note` knowing it is being
// recorded, and can self-redact -- there is no redaction opportunity here. Path
// shapes are refused, but a token, an email address, or a customer name sitting
// in the first prose line would be stored verbatim. Participation alone answers
// the question the observer exists to answer, so participation alone is the
// default.
export function wantsSummary(root) {
  if (!root) return false;
  try {
    return /(^|\s)summary(\s|$)/m.test(readFileSync(join(root, CONSENT_REL), 'utf8'));
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// The TLDR
//
// `response` is written for the parent agent, not for a supervisor glancing at a
// board, and it is the single largest leak surface in the payload: full prose,
// often containing absolute paths, command output, and code.
//
// This is the DERIVED tier -- a deterministic reduction, never presented as if
// the agent authored a summary for us. A purpose-built declared TLDR is a
// separate open question (see issue #93); when one exists it should win, and be
// labeled as declared.
// ---------------------------------------------------------------------------
// A refusal and an absence look identical in the log unless the refusal says so.
// `safeNote` rejects exactly one thing -- path-shaped prose -- and that is the
// common shape of a subagent's opening sentence, because agents answer questions
// about a codebase. A user who opted into summaries and got nothing had no way
// to tell "withheld for your privacy" from "the feature is broken", and the
// second reading is the one people reached (#103).
//
// So the reason is recorded, never the text. `path` means a usable sentence
// existed and was refused; `no-prose` means the response offered no prose line
// at all. Neither reveals anything about the response beyond its shape.
export function tldrDetail(response) {
  if (typeof response !== 'string') return { tldr: null, withheld: 'no-prose' };
  let refused = false;
  for (const line of response.split(/\r?\n/)) {
    const t = line.trim();
    // Skip structure, fences, and headings -- they describe shape, not outcome.
    if (!t || /^[#>*\-=_`|]/.test(t)) continue;
    const safe = safeNote(t);
    // The walk continues past a refusal: a clean sentence often follows the one
    // that named a path, and stopping at the first would throw it away.
    if (safe) return { tldr: safe, withheld: null };
    refused = true;
  }
  return { tldr: null, withheld: refused ? 'path' : 'no-prose' };
}

export function tldrFrom(response) {
  return tldrDetail(response).tldr;
}

// ---------------------------------------------------------------------------
// Record construction
//
// A whitelist, not a copy-with-deletions: fields are named explicitly, so a
// payload field the host adds in a future release cannot silently start flowing
// into the log. Everything else in the payload is dropped on the floor.
// ---------------------------------------------------------------------------
export function buildObserved(event, payload, now = Date.now(), { summary = false } = {}) {
  if (!OBSERVED_EVENTS.has(event)) return { ok: false, reason: `unknown event "${event}"` };
  if (!payload || typeof payload !== 'object') return { ok: false, reason: 'payload must be an object' };

  const role = typeof payload.agentName === 'string' ? payload.agentName.trim() : '';
  if (!role || !NAME_RE.test(role)) return { ok: false, reason: 'payload has no usable agentName' };

  const derived = summary && event === 'stop' ? tldrDetail(payload.response) : { tldr: null, withheld: null };
  const rec = {
    t: Math.floor(now / 1000),
    src: 'observed',
    event,
    role,
    // A session id is an opaque host identifier; a digest is enough to group a
    // session's subagents and pair a start with its stop.
    session: payload.sessionId ? digest(payload.sessionId).slice(0, 12) : null,
    // Only `subagentStop` carries agentId. Without it, a start and a stop can be
    // paired only by (session, role) in order -- which is ambiguous when two
    // subagents of the same role run concurrently. The viewer must label that
    // ambiguity rather than resolve it by guessing.
    agent: typeof payload.agentId === 'string' && payload.agentId ? digest(payload.agentId).slice(0, 12) : null,
    tldr: derived.tldr,
  };
  // Only present when a summary was wanted and none could be stored. Absent
  // otherwise, so "no opt-in" stays visibly different from "opted in, withheld".
  if (derived.withheld) rec.tldr_withheld = derived.withheld;

  // Defense in depth. `safeNote` already rejects path-shaped text, but this is
  // the boundary that matters most in a public repository, so it is asserted on
  // the assembled record rather than trusted from the field that produced it.
  for (const [k, v] of Object.entries(rec)) {
    if (looksAbsolute(v)) return { ok: false, reason: `field "${k}" looks like an absolute path` };
  }

  const line = JSON.stringify(rec);
  if (line.length > MAX_LINE) return { ok: false, reason: 'record exceeds the single-line bound' };
  return { ok: true, record: rec, line };
}

// Same append-only discipline as the declared log: one sub-4KB write per record,
// which O_APPEND makes atomic across concurrent processes. Measured in #96 at
// 720/720 records intact across six writers.
function rotate(file) {
  try {
    if (statSync(file).size > MAX_BYTES) renameSync(file, `${file}.1`);
  } catch { /* absent, or another process rotated it first */ }
}

export function appendObserved(root, event, payload, now = Date.now(), opts = {}) {
  const built = buildObserved(event, payload, now, opts);
  if (!built.ok) return built;
  const file = join(root, OBSERVED_REL);
  if (escapesRoot(root, file) || pathHasLink(root, file)) {
    return {ok: false, reason: 'observed activity path traverses a link or escapes the workspace'};
  }
  try {
    mkdirSync(dirname(file), { recursive: true });
    rotate(file);
    appendFileSync(file, `${built.line}\n`);
  } catch (e) {
    return { ok: false, reason: `could not append: ${e.code || 'unknown'}` };
  }
  return built;
}

// ---------------------------------------------------------------------------
// Hook entry
// ---------------------------------------------------------------------------
function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

export function main(argv, stdinText, now = Date.now(), env = process.env) {
  const event = argv.find((a) => !a.startsWith('-')) || '';
  let payload;
  try {
    payload = JSON.parse(stdinText);
  } catch {
    return { ok: false, reason: 'payload was not JSON' };
  }
  // The hook's workspace/consent boundary is defined by where the subagent
  // ran, never by an unrelated operator override. Preserve KAI_HOME so external
  // registry discovery still works, but remove KAI_WORKSPACE_ROOT so ambient
  // tooling cannot redirect an observed event to another workspace.
  const resolverEnv = { ...env };
  delete resolverEnv.KAI_WORKSPACE_ROOT;
  const root = findWorkspace(payload && payload.cwd, resolverEnv);
  if (!root) return { ok: false, reason: 'no workspace root found' };
  const writable = writableWorkspace(root, resolverEnv);
  if (!writable.ok) return writable;
  if (!hasConsent(root)) return { ok: false, reason: 'observer not enabled for this workspace' };
  return appendObserved(
    root,
    event === 'subagentStart' ? 'start' : event === 'subagentStop' ? 'stop' : event,
    payload,
    now,
    { summary: wantsSummary(root) },
  );
}

const isEntry = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];

// ---------------------------------------------------------------------------
// Operator commands
//
// Consent is a file because the hook must be able to check it without a runtime,
// and because revoking it must be as easy as deleting something. There is no
// central registry and no daemon to stop.
// ---------------------------------------------------------------------------
function adminCli(argv) {
  const flag = (name) => {
    const i = argv.indexOf(`--${name}`);
    return i !== -1 && argv[i + 1] && !argv[i + 1].startsWith('-') ? argv[i + 1] : null;
  };
  const r = resolveWorkspaceRoot({ explicitRoot: flag('root'), cwd: process.cwd() });
  if (!r.ok) {
    console.error(`observe-subagent: ${r.reason}`);
    process.exit(2);
  }
  const root = r.root;
  const writable = writableWorkspace(root, process.env);
  if (!writable.ok) {
    console.error(`observe-subagent: ${writable.reason}`);
    process.exit(2);
  }
  const marker = join(root, CONSENT_REL);

  if (argv.includes('--enable')) {
    const summary = argv.includes('--with-summary');
    mkdirSync(dirname(marker), { recursive: true });
    writeFileSync(marker, `enabled ${new Date().toISOString()}\n${summary ? 'summary\n' : ''}`);
    console.log('Subagent observation ENABLED for this workspace.');
    console.log(`  marker:  ${CONSENT_REL}   (delete it to revoke)`);
    console.log(`  records: ${OBSERVED_REL}  (gitignored, local only)`);
    console.log('');
    console.log('Records who started and who finished, so the participation');
    console.log('sequence of a feature becomes checkable.');
    console.log('');
    if (summary) {
      console.log('Summaries: ON. A one-line summary is scraped from each reply.');
      console.log('It is capped and path-shapes are refused, but it is NOT');
      console.log('secret-scrubbed -- a token or an address in the first prose');
      console.log('line would be stored verbatim. Re-run without --with-summary');
      console.log('to record participation only.');
    } else {
      console.log('Summaries: off. Add --with-summary to also store a one-line');
      console.log('summary scraped from each reply (not secret-scrubbed).');
    }
    console.log('');
    console.log('Hook configuration is read when a session STARTS, so restart your');
    console.log('session before expecting anything to appear.');
    return;
  }

  if (argv.includes('--disable')) {
    if (existsSync(marker)) { rmSync(marker); console.log('Subagent observation DISABLED. Existing records are left in place.'); }
    else console.log('Subagent observation was not enabled.');
    return;
  }

  const on = hasConsent(root);
  const file = join(root, OBSERVED_REL);
  let count = 0;
  if (existsSync(file)) {
    try { count = readFileSync(file, 'utf8').split('\n').filter(Boolean).length; } catch { count = 0; }
  }
  console.log(`Subagent observation: ${on ? 'ENABLED' : 'disabled'}`);
  if (on) console.log(`Summaries: ${wantsSummary(root) ? 'ON (not secret-scrubbed)' : 'off'}`);
  console.log(`Observed records: ${count}`);
  if (!on) console.log('Enable with: npm run observe:enable');
}

if (isEntry) {
  const argv = process.argv.slice(2);
  if (argv.some((a) => ['--enable', '--disable', '--status'].includes(a))) {
    adminCli(argv);
  } else {
    // Everything is swallowed. stdout stays empty and the exit code stays 0 no
    // matter what happened, because this process sits in the path of a real
    // subagent's completion.
    try {
      main(argv, readStdin());
    } catch { /* never let an observer break the thing it observes */ }
    process.exit(0);
  }
}
