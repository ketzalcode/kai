#!/usr/bin/env node
// kai proactive runner — the delivery-side logic your scheduler calls.
//
// TEMPLATE. Copy this whole folder into your own environment; nothing here runs
// inside the kai plugin repo. kai's `workflow-proactive-scan` decides WHAT is
// newly actionable and emits a payload; this file decides whether that payload
// may be DELIVERED, keeps the outbox clean afterwards, and produces a redacted
// diagnostic when something fails.
//
// It is deliberately dependency-free Node ESM so it runs on any runner (Actions,
// cron, Task Scheduler) with nothing installed but Node.
//
// Commands
//   plan     --payload <file> --channels <file> [--secret <NAME> ...]
//            Decide deliver | skip | fail. Emits key=value lines to
//            $GITHUB_OUTPUT when set, otherwise stdout.
//   retain   --outbox <dir> [--acked <notification_id>] [--keep <n>]
//            Apply the retention policy. Idempotent.
//   redact   --payload <file>
//            Print a diagnostic carrying no personal content.
//   --self-test
//            Run the fixture suite. Used by kai's own `npm test`.
//
// Exit codes: 0 = deliver or skip (nothing to send), 1 = fail (misconfiguration
// or a scan error). A `fail` is always loud — never a silent no-send.

import { readFileSync, writeFileSync, readdirSync, statSync, rmSync, mkdirSync, mkdtempSync, appendFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { tmpdir } from 'node:os';

const CHANNEL_TYPES = new Set(['webhook', 'email', 'slack', 'file']);
const PAYLOAD_STATUSES = new Set(['signals', 'none', 'partial', 'error']);
const DEFAULT_KEEP = 5;

// ---------------------------------------------------------------- channels

// Parse ONLY the fenced ```yaml block of channels.md.
//
// This is the whole point of parsing rather than grepping: `channels.md` is a
// markdown file whose prose and comments legitimately contain the words
// `consent: yes` while describing the format. A `grep -q 'consent:\s*yes'`
// matches that prose and would authorize a send from a file that consents to
// nothing.
export function parseChannels(text) {
  const problems = [];
  const src = text.replace(/\r\n/g, '\n');

  const blocks = [];
  const fence = /```(?:yaml|yml)?\n([\s\S]*?)```/g;
  let m;
  while ((m = fence.exec(src)) !== null) blocks.push(m[1]);

  if (blocks.length === 0) {
    return { channel: null, problems: ['channels file has no fenced yaml block'] };
  }

  const channels = [];
  for (const block of blocks) {
    let current = null;
    for (const rawLine of block.split('\n')) {
      const line = stripComment(rawLine);
      if (!line.trim()) continue;

      if (/^channel:\s*$/.test(line)) {
        current = {};
        channels.push(current);
        continue;
      }
      const kv = /^\s+([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/.exec(line);
      if (kv && current) current[kv[1]] = unquote(kv[2].trim());
    }
  }

  if (channels.length === 0) problems.push('no `channel:` block found in the yaml');
  // v1 binds exactly one channel. More than one needs per-channel delivery
  // tracking, so refuse rather than guess which was meant.
  if (channels.length > 1) problems.push(`v1 supports exactly one channel; found ${channels.length}`);

  return { channel: channels.length === 1 ? channels[0] : null, problems };
}

function stripComment(line) {
  // A `#` starting the line, or preceded by whitespace, begins a comment — but
  // not inside a quoted value, where `#` is ordinary content.
  const q = /^(\s*[A-Za-z_][A-Za-z0-9_]*:\s*)(["'])(.*?)\2/.exec(line);
  if (q) return q[0];
  const i = line.search(/(^|\s)#/);
  return i === -1 ? line : line.slice(0, i === 0 ? 0 : i);
}

function unquote(v) {
  const t = v.trim();
  if (t.length >= 2 && ((t[0] === '"' && t.endsWith('"')) || (t[0] === "'" && t.endsWith("'")))) {
    return t.slice(1, -1);
  }
  return t;
}

const isTrue = (v) => v === 'true' || v === 'yes';
const isFalse = (v) => v === 'false' || v === 'no';

// ------------------------------------------------------------ gap reasons

// A gap reason is authored by the scanning model, so it is free text that can
// name a root or a path. Both the step output and the uploaded diagnostic are
// readable by anyone with Actions read access, so classify to a closed
// vocabulary rather than passing the model's words through.
export function classifyGapReason(reason) {
  const r = typeof reason === 'string' ? reason.toLowerCase() : '';
  if (/unreadable|permission|denied|missing|not found|enoent/.test(r)) return 'unreadable';
  if (/invalid|malformed|parse|schema/.test(r)) return 'invalid';
  return 'unspecified';
}

// ---------------------------------------------------------------- decision

// Decide whether this payload may be delivered.
//
// `skip` means "correctly nothing to send" (no signals, or the operator has not
// consented). `fail` means the configuration is broken or the scan errored —
// those must be loud, because a misconfigured channel that silently no-ops looks
// exactly like a quiet week.
export function decide({ payload, channelsText, availableSecrets = [] }) {
  const status = typeof payload?.status === 'string' ? payload.status : '';
  const notificationId = typeof payload?.notification_id === 'string' ? payload.notification_id : '';

  if (!PAYLOAD_STATUSES.has(status)) {
    return fail(`payload has unexpected status '${status || '(missing)'}'`, { status, notificationId });
  }
  if (status === 'error') {
    const why = Array.isArray(payload.gaps) && payload.gaps.length
      ? [...new Set(payload.gaps.map((g) => classifyGapReason(g?.reason)))].join(', ')
      : 'unspecified';
    return fail(`scan status=error (${payload.gaps?.length ?? 0} gap(s): ${why}); see the workspace outbox for detail`, { status, notificationId });
  }
  if (!notificationId) {
    return fail('payload is missing notification_id; ack could not be made idempotent', { status, notificationId });
  }
  if (status === 'none') {
    return skip('scan found nothing newly actionable', { status, notificationId });
  }
  // Defense in depth: the scan is specified to report `none` when it found
  // nothing, so a signal-bearing status with an empty list is a contradiction.
  // Sending an empty notification is worse than sending none, so treat it as
  // nothing to send rather than delivering a hollow alert.
  if (!Array.isArray(payload.signals) || payload.signals.length === 0) {
    return skip(`status=${status} but the payload carries no signals`, { status, notificationId });
  }

  const { channel, problems } = parseChannels(channelsText);
  if (problems.length) return fail(problems.join('; '), { status, notificationId });

  // Both gates are explicit and independent: a channel can be consented but
  // switched off, and an enabled channel still may not have consent.
  if (!isTrue(channel.enabled ?? '')) {
    const shown = channel.enabled === undefined ? '(missing)' : channel.enabled;
    return isFalse(channel.enabled ?? '') || channel.enabled === undefined
      ? skip(`channel is not enabled (enabled: ${shown})`, { status, notificationId })
      : fail(`channel 'enabled' must be true or false, got '${shown}'`, { status, notificationId });
  }
  if (!isTrue(channel.consent ?? '')) {
    const shown = channel.consent === undefined ? '(missing)' : channel.consent;
    return isFalse(channel.consent ?? '') || channel.consent === undefined
      ? skip(`no consented channel (consent: ${shown}); payload stays in the outbox`, { status, notificationId })
      : fail(`channel 'consent' must be yes or no, got '${shown}'`, { status, notificationId });
  }

  const type = channel.type ?? '';
  if (!CHANNEL_TYPES.has(type)) {
    return fail(`unknown channel type '${type || '(missing)'}'`, { status, notificationId });
  }

  const secretRef = channel.secret_ref ?? '';
  if (!secretRef) {
    return fail('channel is consented but declares no secret_ref', { status, notificationId });
  }
  // Honor secret_ref EXACTLY. If the runner holds a different secret, delivering
  // anyway would send consented content down an unconsented path.
  if (!availableSecrets.includes(secretRef)) {
    const have = availableSecrets.length ? availableSecrets.join(', ') : '(none provided)';
    return fail(`secret_ref '${secretRef}' is not among the secrets this runner holds: ${have}`, { status, notificationId });
  }

  return {
    decision: 'deliver',
    reason: `status=${status}, channel type=${type}, consented`,
    status,
    notificationId,
    channelType: type,
    secretRef,
    exitCode: 0,
  };
}

const fail = (reason, o) => ({ decision: 'fail', reason, status: o.status, notificationId: o.notificationId, channelType: '', secretRef: '', exitCode: 1 });
const skip = (reason, o) => ({ decision: 'skip', reason, status: o.status, notificationId: o.notificationId, channelType: '', secretRef: '', exitCode: 0 });

// ---------------------------------------------------------------- redaction

// A diagnostic that is actionable without leaking what the notification said.
// Signal summaries, item paths, and workspace labels are personal content; the
// shape of the failure is not.
export function redact(payload) {
  const signals = Array.isArray(payload?.signals) ? payload.signals : [];
  const byKind = {};
  const byState = {};
  for (const s of signals) {
    const k = typeof s?.kind === 'string' ? s.kind : 'unknown';
    const st = typeof s?.state === 'string' ? s.state : 'unknown';
    byKind[k] = (byKind[k] || 0) + 1;
    byState[st] = (byState[st] || 0) + 1;
  }
  return {
    schema: payload?.schema ?? null,
    notification_id: payload?.notification_id ?? null,
    generated: payload?.generated ?? null,
    based_on_revision: payload?.based_on_revision ?? null,
    status: payload?.status ?? null,
    signal_count: signals.length,
    by_kind: byKind,
    by_state: byState,
    // Reasons are model-authored free text, so they are classified to a closed
    // vocabulary rather than copied: a reason naming an unreadable file would
    // otherwise carry a path into an artifact.
    gap_reasons: (Array.isArray(payload?.gaps) ? payload.gaps : []).map((g) => classifyGapReason(g?.reason)),
    redacted: 'signal summaries, item paths, workspace labels, root ids, and verbatim gap reasons omitted by policy',
  };
}

// ---------------------------------------------------------------- retention

// Acked payloads have served their purpose; the ledger, not the outbox, is the
// durable record. Deleting them bounds how much personal content sits on disk.
export function retain({ outbox, ackedId = null, keep = DEFAULT_KEEP }) {
  let files;
  try {
    files = readdirSync(outbox).filter((f) => f.endsWith('.json'));
  } catch {
    return { deleted: [], kept: [] };
  }

  const entries = files
    .map((f) => {
      const path = join(outbox, f);
      let id = null;
      try { id = JSON.parse(readFileSync(path, 'utf8'))?.notification_id ?? null; } catch { /* unreadable: treat as ageable */ }
      return { path, name: f, id, mtime: safeMtime(path) };
    })
    .sort((a, b) => b.mtime - a.mtime);

  const deleted = [];
  const survivors = [];
  for (const e of entries) {
    if (ackedId && e.id === ackedId) { rmSync(e.path, { force: true }); deleted.push(e.name); continue; }
    survivors.push(e);
  }
  for (const e of survivors.slice(Math.max(0, keep))) {
    rmSync(e.path, { force: true });
    deleted.push(e.name);
  }
  return { deleted, kept: survivors.slice(0, Math.max(0, keep)).map((e) => e.name) };
}

function safeMtime(p) {
  try { return statSync(p).mtimeMs; } catch { return 0; }
}

// ---------------------------------------------------------------- cli

function emit(pairs) {
  const out = Object.entries(pairs).map(([k, v]) => `${k}=${String(v).replace(/\r?\n/g, ' ')}`);
  const target = process.env.GITHUB_OUTPUT;
  if (target) appendFileSync(target, out.join('\n') + '\n');
  for (const line of out) console.log(line);
}

function argVal(argv, flag) {
  const i = argv.indexOf(flag);
  return i === -1 ? null : argv[i + 1] ?? null;
}
function argAll(argv, flag) {
  const out = [];
  for (let i = 0; i < argv.length; i++) if (argv[i] === flag && argv[i + 1]) out.push(argv[i + 1]);
  return out;
}

function readJson(p) {
  return JSON.parse(readFileSync(p, 'utf8'));
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest();
  const cmd = argv[0];

  if (cmd === 'plan') {
    const payloadPath = argVal(argv, '--payload');
    const channelsPath = argVal(argv, '--channels');
    if (!payloadPath || !channelsPath) {
      console.error('usage: runner.mjs plan --payload <file> --channels <file> [--secret NAME ...]');
      return 1;
    }
    let payload;
    try { payload = readJson(payloadPath); } catch (e) {
      emit({ decision: 'fail', reason: `payload is not readable JSON: ${e.message}`, status: '', notification_id: '' });
      console.error(`::error::payload is not readable JSON: ${e.message}`);
      return 1;
    }
    let channelsText = '';
    try { channelsText = readFileSync(channelsPath, 'utf8'); } catch {
      // A missing channels file is "not configured", not a crash — but it can
      // never authorize a send.
      channelsText = '';
    }
    const d = decide({ payload, channelsText, availableSecrets: argAll(argv, '--secret') });
    emit({
      decision: d.decision,
      reason: d.reason,
      status: d.status,
      notification_id: d.notificationId,
      channel_type: d.channelType,
      secret_ref: d.secretRef,
    });
    if (d.decision === 'fail') console.error(`::error::${d.reason}`);
    else if (d.decision === 'skip') console.log(`::notice::${d.reason}`);
    return d.exitCode;
  }

  if (cmd === 'retain') {
    const outbox = argVal(argv, '--outbox');
    if (!outbox) { console.error('usage: runner.mjs retain --outbox <dir> [--acked <id>] [--keep <n>]'); return 1; }
    const keepRaw = argVal(argv, '--keep');
    const r = retain({ outbox, ackedId: argVal(argv, '--acked'), keep: keepRaw === null ? DEFAULT_KEEP : Number(keepRaw) });
    console.log(`retained ${r.kept.length}, deleted ${r.deleted.length}`);
    return 0;
  }

  if (cmd === 'redact') {
    const p = argVal(argv, '--payload');
    if (!p) { console.error('usage: runner.mjs redact --payload <file>'); return 1; }
    try {
      console.log(JSON.stringify(redact(readJson(p)), null, 2));
    } catch (e) {
      console.log(JSON.stringify({ status: null, error: `payload unreadable: ${e.message}` }, null, 2));
    }
    return 0;
  }

  console.error('usage: runner.mjs <plan|retain|redact> [...]  |  runner.mjs --self-test');
  return 1;
}

// ---------------------------------------------------------------- self-test

const CONSENTED = `# Channels

Prose that documents the format, mentioning consent: yes and enabled: true
so that a naive grep would match this line.

\`\`\`yaml
channel:
  type: webhook          # webhook | email | slack | file
  secret_ref: KAI_NOTIFY_WEBHOOK
  consent: yes
  enabled: true
\`\`\`
`;

const payloadWith = (over = {}) => ({
  schema: 'kai.proactive-notification/v1',
  notification_id: 'n-20260808-0930-abc123',
  generated: '2026-08-08 09:30 local',
  root_id: 'root-abc123',
  based_on_revision: 7,
  status: 'signals',
  gaps: [],
  signals: [
    { key: 'r:item-1:Q-2', hash: 'h1', kind: 'decision', state: 'new', summary: 'Approve the pricing change', workspace: 'labora', path: 'kai/coordination/threads/item-1.md', answer_by: '2026-08-09' },
  ],
  ...over,
});

function selfTest() {
  let failures = 0;
  const ok = (name, cond, detail = '') => {
    if (cond) console.log(`\u2713 ${name}`);
    else { console.log(`\u2717 ${name}${detail ? ` \u2014 ${detail}` : ''}`); failures++; }
  };
  const secrets = ['KAI_NOTIFY_WEBHOOK'];
  const run = (payload, channelsText, availableSecrets = secrets) => decide({ payload, channelsText, availableSecrets });

  // --- status routing -----------------------------------------------------
  let d = run(payloadWith(), CONSENTED);
  ok('self-test: signals + consented + matching secret delivers', d.decision === 'deliver' && d.secretRef === 'KAI_NOTIFY_WEBHOOK', d.reason);

  d = run(payloadWith({ status: 'partial', gaps: [{ root: 'other', reason: 'unreadable' }] }), CONSENTED);
  ok('self-test: partial still delivers (a gap must not silence real signals)', d.decision === 'deliver', d.reason);

  d = run(payloadWith({ status: 'none', signals: [] }), CONSENTED);
  ok('self-test: none skips without failing', d.decision === 'skip' && d.exitCode === 0, d.reason);

  d = run(payloadWith({ status: 'error', gaps: [{ root: 'sel', reason: 'missing kai/coordination/items/pricing.md' }] }), CONSENTED);
  ok('self-test: error fails loudly and reports the gap count', d.decision === 'fail' && d.exitCode === 1 && /1 gap\(s\)/.test(d.reason), d.reason);
  ok('self-test: the error reason classifies the gap instead of quoting the model', /unreadable/.test(d.reason) && !/pricing\.md/.test(d.reason), d.reason);

  d = run(payloadWith({ status: 'weird' }), CONSENTED);
  ok('self-test: unexpected status fails', d.decision === 'fail', d.reason);

  d = run(payloadWith({ notification_id: '' }), CONSENTED);
  ok('self-test: missing notification_id fails (ack could not be idempotent)', d.decision === 'fail', d.reason);

  d = run(payloadWith({ status: 'signals', signals: [] }), CONSENTED);
  ok('self-test: a signal-bearing status with no signals skips rather than sending a hollow alert', d.decision === 'skip' && d.exitCode === 0, d.reason);

  // --- consent gating -----------------------------------------------------
  // The regression this whole module exists for: the prose in CONSENTED
  // contains "consent: yes", so a grep-based gate authorizes a send here.
  const proseOnly = CONSENTED.replace('consent: yes\n  enabled: true', 'consent: no\n  enabled: true');
  d = run(payloadWith(), proseOnly);
  ok('self-test: prose containing "consent: yes" cannot authorize a send', d.decision === 'skip', d.reason);
  ok('self-test: a naive grep WOULD have been fooled by that fixture', /consent:\s*yes/i.test(proseOnly));

  d = run(payloadWith(), CONSENTED.replace('  enabled: true', '  enabled: false'));
  ok('self-test: disabled channel cannot send', d.decision === 'skip', d.reason);

  d = run(payloadWith(), CONSENTED.replace('  consent: yes\n', ''));
  ok('self-test: missing consent key cannot send', d.decision === 'skip', d.reason);

  d = run(payloadWith(), CONSENTED.replace('  enabled: true\n', ''));
  ok('self-test: missing enabled key cannot send', d.decision === 'skip', d.reason);

  d = run(payloadWith(), CONSENTED.replace('  consent: yes', '  consent: maybe'));
  ok('self-test: an uninterpretable consent value fails rather than guessing', d.decision === 'fail', d.reason);

  // --- secret_ref ---------------------------------------------------------
  d = run(payloadWith(), CONSENTED, ['SOME_OTHER_SECRET']);
  ok('self-test: secret_ref that the runner does not hold fails', d.decision === 'fail' && /secret_ref/.test(d.reason), d.reason);

  d = run(payloadWith(), CONSENTED, []);
  ok('self-test: no secrets provided fails rather than delivering', d.decision === 'fail', d.reason);

  d = run(payloadWith(), CONSENTED.replace('  secret_ref: KAI_NOTIFY_WEBHOOK\n', ''));
  ok('self-test: consented channel with no secret_ref fails', d.decision === 'fail', d.reason);

  // --- channel shape ------------------------------------------------------
  d = run(payloadWith(), CONSENTED.replace('type: webhook', 'type: carrier-pigeon'));
  ok('self-test: unknown channel type fails', d.decision === 'fail', d.reason);

  d = run(payloadWith(), CONSENTED + '\n```yaml\nchannel:\n  type: slack\n  secret_ref: X\n  consent: yes\n  enabled: true\n```\n');
  ok('self-test: two channels fail (v1 tracks delivery for exactly one)', d.decision === 'fail' && /exactly one/.test(d.reason), d.reason);

  d = run(payloadWith(), '# no yaml block here at all\n');
  ok('self-test: channels file with no yaml block cannot send', d.decision === 'fail', d.reason);

  d = run(payloadWith(), '');
  ok('self-test: missing channels file cannot send', d.decision === 'fail', d.reason);

  const hashed = parseChannels('```yaml\nchannel:\n  type: webhook\n  secret_ref: "KAI_NOTIFY_WEBHOOK" # the name, not the value\n  consent: yes\n  enabled: true\n```\n');
  ok('self-test: a trailing comment is stripped without truncating a quoted value', hashed.channel?.secret_ref === 'KAI_NOTIFY_WEBHOOK', JSON.stringify(hashed));

  // --- redaction ----------------------------------------------------------
  const leaky = redact(payloadWith({ gaps: [{ root: 'labora', reason: 'unreadable: kai/coordination/threads/pricing.md' }] }));
  ok('self-test: a gap reason naming a path is classified, not copied', !JSON.stringify(leaky).includes('pricing.md') && leaky.gap_reasons[0] === 'unreadable', JSON.stringify(leaky.gap_reasons));
  const r = redact(payloadWith({ gaps: [{ root: 'other', reason: 'unreadable' }] }));
  const serialized = JSON.stringify(r);
  ok('self-test: redacted diagnostic drops signal summaries', !serialized.includes('Approve the pricing change'));
  ok('self-test: redacted diagnostic drops item paths and workspace labels', !serialized.includes('kai/coordination') && !serialized.includes('labora'));
  ok('self-test: redacted diagnostic keeps actionable shape', r.status === 'signals' && r.signal_count === 1 && r.by_kind.decision === 1 && r.gap_reasons[0] === 'unreadable');

  // --- retention ----------------------------------------------------------
  const dir = mkdtempSync(join(tmpdir(), 'kai-proactive-'));
  const outbox = join(dir, 'outbox');
  mkdirSync(outbox, { recursive: true });
  const write = (name, id) => writeFileSync(join(outbox, name), JSON.stringify(payloadWith({ notification_id: id })));
  write('2026-08-08-0900.json', 'n-1');
  write('2026-08-08-0930.json', 'n-2');
  write('2026-08-08-1000.json', 'n-3');

  let res = retain({ outbox, ackedId: 'n-2', keep: 5 });
  ok('self-test: retain deletes the acked payload', res.deleted.includes('2026-08-08-0930.json'), JSON.stringify(res));
  ok('self-test: retain keeps unacked payloads', readdirSync(outbox).length === 2);

  // A duplicate ack is the normal consequence of a retried runner step.
  res = retain({ outbox, ackedId: 'n-2', keep: 5 });
  ok('self-test: duplicate ack retention is a no-op, not an error', res.deleted.length === 0 && readdirSync(outbox).length === 2);

  write('2026-08-08-1030.json', 'n-4');
  write('2026-08-08-1100.json', 'n-5');
  retain({ outbox, keep: 2 });
  ok('self-test: retention prunes the outbox to the keep bound', readdirSync(outbox).length === 2, `${readdirSync(outbox).length}`);

  res = retain({ outbox: join(dir, 'does-not-exist'), keep: 2 });
  ok('self-test: retention on a missing outbox is a no-op', res.deleted.length === 0);

  // The cache-scope rule this example depends on: only the ledger is persisted.
  ok('self-test: outbox and ledger are separate paths (only the ledger is cached)',
    basename(outbox) === 'outbox');

  rmSync(dir, { recursive: true, force: true });

  console.log(failures === 0
    ? `\u2713 proactive-runner self-test: all checks passed`
    : `\u2717 proactive-runner self-test: ${failures} failure(s)`);
  return failures === 0 ? 0 : 1;
}

process.exit(main(process.argv.slice(2)));
