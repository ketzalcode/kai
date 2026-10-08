// The declared activity writer — `src/core/activity.mjs`.
//
// This suite used to live inside the command it tests, behind a `--self-test`
// flag. That flag was a runtime string, so no build-time constant could fold it
// away and every consumer downloaded the assertions with the command (#225).
// The checks are unchanged; only their address is.
//
// The concurrency section spawns real processes on purpose: each agent is a
// separate OS process, so single-threaded JS grants no mutual exclusion, and
// what makes the append safe is O_APPEND plus one write() per record.

import { resolve, join, dirname } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { existsSync, mkdtempSync, writeFileSync, rmSync, mkdirSync, symlinkSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { append, read, runs, buildRecord, safeNote, digest, LOG_REL } from '../src/core/lib/activity.mjs';
import { resolveWorkspaceRoot } from '../src/core/lib/workspace-resolve.mjs';
import { parseDuration } from '../src/core/activity.mjs';
import {closeStore, openStore} from '../src/core/lib/coordination-runtime/store.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function writeSchema5Manifest(root, workspaceId) {
  spawnSync('git', ['init', '--quiet', root], {windowsHide: true});
  writeFileSync(join(root, '.gitignore'), '/.kai/\n');
  mkdirSync(join(root, '.kai'), {recursive: true});
  mkdirSync(join(root, 'docs', 'kai'), {recursive: true});
  writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), [
    '# Vision',
    'A composable workspace.',
    '',
    '# Mission',
    'Coordinate exact work safely.',
    '',
    '# Current Goal',
    'Exercise typed activity.',
    '',
    '# Out of Scope',
    'Generic run lanes.',
    '',
  ].join('\n'));
  writeFileSync(join(root, '.kai', 'manifest.json'), `${JSON.stringify({
    plugin: 'kai-core',
    version: 'test',
    schema_version: 5,
    scaffolded: '2026-10-02',
    workspace_id: workspaceId,
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    direction: 'docs/kai/DIRECTION.md',
    projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
  })}\n`);
  const store = openStore({
    path: join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'),
    mode: 'create',
  });
  closeStore(store);
}

function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => { if (cond) console.log(`✓ self-test: ${msg}`); else { console.error(`✗ self-test: ${msg}`); failed++; } };
  const NOW = 1770000000000;
  const nowSec = Math.floor(NOW / 1000);
  const base = {
    e: 'start',
    role: 'principal-swe-backend',
    run: 'a1b2c3d4e5',
    task: 'engineering:task:export-audit',
    next_report_by: nowSec + 1800,
  };

  ok(buildRecord(base, NOW).ok, 'a well-formed start record is accepted');
  ok(LOG_REL === '.kai/core/runtime/activity.jsonl', 'activity uses the schema-5 core runtime path');

  // The boundary against the Task record is the whole point of this surface.
  for (const f of ['state', 'verdict', 'change_ref', 'version', 'lease']) {
    const bad = buildRecord({ ...base, [f]: 'x' }, NOW);
    ok(!bad.ok && /Task record/.test(bad.reason), `a record carrying "${f}" is rejected as Task state`);
  }
  ok(!buildRecord({...base, task: 'export-audit'}, NOW).ok,
    'an untyped Task identity is rejected');

  ok(!buildRecord({ ...base, e: 'thinking' }, NOW).ok, 'an event outside the closed vocabulary is rejected');
  ok(!buildRecord({ ...base, e: 'stop', outcome: 'great' }, NOW).ok, 'an outcome outside the closed vocabulary is rejected');
  ok(buildRecord({ ...base, e: 'stop', outcome: 'handoff' }, NOW).ok, 'a stop with a known outcome is accepted');
  ok(!buildRecord({ ...base, next_report_by: undefined }, NOW).ok,
    'a start with no declared deadline is rejected — silence must stay checkable');

  // Privacy: this file is gitignored but pasteable into a public issue.
  ok(safeNote('see C:\\Users\\someone\\repo\\x.ts') === null, 'a note containing a Windows path is dropped');
  ok(safeNote('see /home/someone/repo/x.ts') === null, 'a note containing a POSIX home path is dropped');
  const long = safeNote('x'.repeat(500));
  ok(long !== null && long.length <= 120, 'a long note is truncated to the bound');
  ok(safeNote('line one\nline two') === 'line one line two', 'a multi-line note is flattened to one line');
  const built = buildRecord({ ...base, note: 'refactoring the parser' }, NOW);
  ok(built.ok && !/[A-Za-z]:\\|\/home\//.test(built.line), 'no absolute path can reach a serialized record');
  ok(built.ok && built.record.src === 'declared', 'every record is tiered declared, matching work-status');
  ok(!('sid' in built.record) && !('cwd' in built.record), 'no session or directory identifier is recorded');

  ok(digest('abc') === digest('abc') && digest('abc') !== digest('abd'), 'the digest is stable and discriminating');
  ok(parseDuration('30m') === 1800 && parseDuration('2h') === 7200 && parseDuration('45s') === 45,
    'durations parse to seconds');
  ok(parseDuration('soon') === null, 'an unparseable duration is rejected rather than guessed');

  // Shared workspace resolver (src/core/lib/workspace-resolve.mjs): every CLI
  // that used to grow its own ad-hoc root logic defers to this one function.
  {
    const wsTmp = mkdtempSync(join(tmpdir(), 'kai-activity-ws-'));
    try {
      const withManifest = (...segments) => {
        const dir = join(wsTmp, ...segments);
        mkdirSync(join(dir, '.kai'), { recursive: true });
        writeFileSync(join(dir, '.kai', 'manifest.json'), '{}');
        return dir;
      };

      // explicit root
      const explicitWs = withManifest('explicit-ws');
      const explicitR = resolveWorkspaceRoot({ explicitRoot: explicitWs, cwd: wsTmp, env: {} });
      ok(explicitR.ok && explicitR.root === explicitWs && explicitR.source === 'explicit',
        'an explicit caller root resolves directly and wins over everything else');

      // upward discovery
      const searchWs = withManifest('search-ws');
      mkdirSync(join(searchWs, 'a', 'b', 'c'), { recursive: true });
      const searchR = resolveWorkspaceRoot({ cwd: join(searchWs, 'a', 'b', 'c'), env: {} });
      ok(searchR.ok && searchR.root === searchWs && searchR.source === 'search',
        'a cwd nested under the workspace resolves upward to the manifest that carries it');

      // explicit root is validated in place, never searched upward: naming a
      // non-workspace subdirectory of a real workspace must fail, not
      // silently retarget the ancestor that cwd search would have found.
      const explicitNested = resolveWorkspaceRoot({ explicitRoot: join(searchWs, 'a', 'b', 'c'), env: {} });
      ok(!explicitNested.ok && /never searched upward/.test(explicitNested.reason),
        'an explicit root naming a non-workspace subdirectory fails instead of resolving upward to its ancestor');

      // env override
      const envWs = withManifest('env-ws');
      const envR = resolveWorkspaceRoot({ cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: envWs } });
      ok(envR.ok && envR.root === envWs && envR.source === 'env',
        'KAI_WORKSPACE_ROOT is honored when no explicit root is given');
      const explicitBeatsEnv = resolveWorkspaceRoot({ explicitRoot: explicitWs, cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: envWs } });
      ok(explicitBeatsEnv.ok && explicitBeatsEnv.root === explicitWs,
        'an explicit root wins over KAI_WORKSPACE_ROOT, not merely over cwd');

      // invalid override
      const relativeEnv = resolveWorkspaceRoot({ cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: 'relative/path' } });
      ok(!relativeEnv.ok && /absolute/.test(relativeEnv.reason),
        'a relative KAI_WORKSPACE_ROOT is refused rather than resolved against an unstated base');
      const noManifestDir = join(wsTmp, 'no-manifest-here');
      mkdirSync(noManifestDir, { recursive: true });
      const unmanifestedEnv = resolveWorkspaceRoot({ cwd: wsTmp, env: { KAI_WORKSPACE_ROOT: noManifestDir } });
      ok(!unmanifestedEnv.ok && /manifest/.test(unmanifestedEnv.reason),
        'an absolute KAI_WORKSPACE_ROOT with no manifest.json is refused, not silently accepted');

      // missing workspace
      const emptyDir = join(wsTmp, 'nothing-here');
      mkdirSync(emptyDir, { recursive: true });
      const missing = resolveWorkspaceRoot({ cwd: emptyDir, env: {} });
      ok(!missing.ok && /manifest/.test(missing.reason),
        'a directory with no manifest anywhere upward reports a clear not-found, not a guess');

      // the one deliberate behavior change: a bare .git no longer counts
      const gitOnlyDir = join(wsTmp, 'git-only-repo');
      mkdirSync(join(gitOnlyDir, '.git'), { recursive: true });
      const gitOnly = resolveWorkspaceRoot({ cwd: gitOnlyDir, env: {} });
      ok(!gitOnly.ok, 'a bare .git with no .kai/manifest.json is no longer treated as a kai workspace');
    } finally {
      rmSync(wsTmp, { recursive: true, force: true });
    }
  }

  // Fold: open vs stopped vs overdue.
  const recs = [
    { t: nowSec - 3600, src: 'declared', e: 'start', role: 'r1', run: 'run1', next_report_by: nowSec - 1800 },
    { t: nowSec - 600, src: 'declared', e: 'start', role: 'r2', run: 'run2', next_report_by: nowSec + 1800 },
    { t: nowSec - 500, src: 'declared', e: 'stop', role: 'r2', run: 'run2', outcome: 'handoff' },
    { t: nowSec - 60, src: 'declared', e: 'start', role: 'r3', run: 'run3', next_report_by: nowSec + 600 },
  ];
  const folded = runs(recs, NOW);
  const byId = new Map(folded.map((r) => [r.run, r]));
  ok(byId.get('run1').open && byId.get('run1').overdue, 'a run silent past its own deadline is overdue');
  ok(!byId.get('run2').open && byId.get('run2').outcome === 'handoff', 'a stopped run is closed with its outcome');
  ok(byId.get('run3').open && !byId.get('run3').overdue, 'a run inside its deadline is open but not overdue');

  // Degradation: a corrupt line must never take the reader down.
  const parsed = (() => {
    const lines = ['{"e":"start","role":"r","run":"z1","t":1}', 'not json', '{"e":"start"', ''];
    let good = 0, bad = 0;
    for (const l of lines) { if (!l.trim()) continue; try { JSON.parse(l); good++; } catch { bad++; } }
    return { good, bad };
  })();
  ok(parsed.good === 1 && parsed.bad === 2, 'a partial write is a skipped line, not a parse failure');

  // Concurrency, measured rather than asserted. Each agent is a separate OS
  // process, so single-threaded JS grants no mutual exclusion; what makes this
  // safe is O_APPEND plus one write() per record. If that ever stops holding,
  // this is the test that catches it.
  const tmp = mkdtempSync(join(tmpdir(), 'kai-activity-'));
  try {
    const W = 6, N = 120;
    const worker = join(tmp, 'w.mjs');
    const libUrl = pathToFileURL(join(REPO_ROOT, 'src', 'core', 'lib', 'activity.mjs')).href;
    writeFileSync(worker, [
      `const { append } = await import(${JSON.stringify(libUrl)});`,
      'const [root, id] = process.argv.slice(2);',
      `for (let i = 0; i < ${N}; i++) {`,
      "  append(root, { e: 'progress', role: `worker-${id}`, run: `run${id}0000`, next_report_by: 9999999999, note: `tick ${i}` });",
      '}',
    ].join('\n'));

    const kids = [];
    for (let i = 0; i < W; i++) kids.push(spawnSync(process.execPath, [worker, tmp, String(i)], { encoding: 'utf8' }));
    ok(kids.every((k) => k.status === 0), 'every concurrent writer exited cleanly');

    const after = read(tmp);
    ok(after.present && after.records.length === W * N && after.skipped === 0,
      `${W} concurrent processes x ${N} appends produced ${after.records.length}/${W * N} intact records, ${after.skipped} corrupt`);
    const perWorker = new Set(after.records.map((r) => r.role));
    ok(perWorker.size === W, 'no writer was starved out by the others');

    // End-to-end through the CLI an agent actually invokes.
    const cli = join(REPO_ROOT, 'src', 'core', 'activity.mjs');
    const e2eRoot = mkdtempSync(join(tmpdir(), 'kai-activity-e2e-'));
    writeSchema5Manifest(e2eRoot, 'activity-e2e');
    const s1 = spawnSync(process.execPath, [cli, 'start', '--root', e2eRoot, '--role', 'principal-swe-backend',
      '--run', 'abc123def4', '--task', 'engineering:task:export-audit', '--for', '30m'], { encoding: 'utf8' });
    const s2 = spawnSync(process.execPath, [cli, 'stop', '--root', e2eRoot, '--role', 'principal-swe-backend',
      '--run', 'abc123def4', '--outcome', 'handoff'], { encoding: 'utf8' });
    ok(s1.status === 0 && s2.status === 0, 'the CLI records a start and a stop');
    const e2e = read(e2eRoot);
    ok(e2e.present && e2e.records.length === 2, 'both records land in the log');
    ok(runs(e2e.records).every((r) => !r.open), 'the run pairs and closes');

    // Unit regression: fabricated records in a test can silently certify a unit
    // the real writer never emits. These assertions go through the actual
    // append path, so a seconds/milliseconds mixup cannot pass again.
    const written = e2e.records[0];
    ok(Math.abs(written.t - Math.floor(Date.now() / 1000)) < 120,
      'a written record stamps epoch SECONDS, the same unit as next_report_by');
    const liveRoot = mkdtempSync(join(tmpdir(), 'kai-activity-live-'));
    writeSchema5Manifest(liveRoot, 'activity-live');
    spawnSync(process.execPath, [cli, 'start', '--root', liveRoot, '--role', 'principal-sre',
      '--run', 'aaaa1111bb', '--for', '30m'], { encoding: 'utf8' });
    const foldedLive = runs(read(liveRoot).records)[0];
    ok(foldedLive.silent_for >= 0 && foldedLive.silent_for < 120,
      `a just-written run reports a sane silence (${foldedLive.silent_for}s), not a unit-mismatched number`);
    ok(foldedLive.open && !foldedLive.overdue, 'a just-written run inside its window is open and not overdue');
    rmSync(liveRoot, { recursive: true, force: true });

    const badState = spawnSync(process.execPath, [cli, 'start', '--root', e2eRoot, '--role', 'r',
      '--run', 'abc123def4', '--for', '5m', '--state', 'shipped'], { encoding: 'utf8' });
    ok(badState.status === 1 && /Task record/.test(badState.stderr),
      'the CLI refuses to record Task state and says why');
    const badEq = spawnSync(process.execPath, [cli, 'start', '--root', e2eRoot, '--role', 'r',
      '--run', 'abc123def4', '--for', '5m', '--State=shipped'], { encoding: 'utf8' });
    ok(badEq.status === 1 && /Task record/.test(badEq.stderr),
      'the --Key=value form is seen and rejected too, not silently ignored');

    const invalidFirstWrite = mkdtempSync(join(tmpdir(), 'kai-activity-invalid-'));
    const invalid = append(invalidFirstWrite, {...base, task: '../../escape'}, NOW);
    ok(!invalid.ok && !existsSync(join(invalidFirstWrite, '.kai')),
      'failed first-write validation leaves no partial runtime tree');
    rmSync(invalidFirstWrite, {recursive: true, force: true});

    const linkedFirstWrite = mkdtempSync(join(tmpdir(), 'kai-activity-linked-'));
    const outsideFirstWrite = mkdtempSync(join(tmpdir(), 'kai-activity-outside-'));
    mkdirSync(join(linkedFirstWrite, '.kai'), {recursive: true});
    symlinkSync(outsideFirstWrite, join(linkedFirstWrite, '.kai', 'core'), 'junction');
    const linked = append(linkedFirstWrite, base, NOW);
    ok(!linked.ok && !existsSync(join(outsideFirstWrite, 'runtime', 'activity.jsonl')),
      'first-write path validation refuses a junction without writing through it');
    rmSync(linkedFirstWrite, {recursive: true, force: true});
    rmSync(outsideFirstWrite, {recursive: true, force: true});

    // The reader is a gate as well as the writer: the log is a plain file.
    const evilRoot = mkdtempSync(join(tmpdir(), 'kai-activity-evil-'));
    mkdirSync(join(evilRoot, '.kai'), { recursive: true });
    mkdirSync(join(evilRoot, '.kai', 'core', 'runtime'), {recursive: true});
    writeFileSync(join(evilRoot, ...LOG_REL.split('/')), [
      JSON.stringify({ t: 1, e: 'start', run: 'aaaa1111bb', role: '/home/alice/secret', next_report_by: 2 }),
      JSON.stringify({ t: 1, e: 'start', run: 'aaaa1111bb', role: 'ok-role', task: '../../etc/passwd' }),
      JSON.stringify({ t: 1, e: 'start', run: 'aaaa1111bb', role: 'ok-role', note: 'C:\\Users\\alice\\x.ts' }),
      JSON.stringify({ t: 1, e: 'start', run: 'aaaa1111bb', role: 'ok-role', next_report_by: 2 }),
    ].join('\n'));
    const evil = read(evilRoot);
    ok(evil.records.length === 1 && evil.skipped === 3,
      'a hand-written record carrying a path, a traversal, or a leaky note is skipped on READ, not just on write');
    rmSync(evilRoot, { recursive: true, force: true });
    rmSync(e2eRoot, { recursive: true, force: true });
  } finally {
    rmSync(tmp, { recursive: true, force: true });
  }

  console.log(failed === 0 ? '✓ activity self-test: all checks passed' : `✗ activity self-test: ${failed} failure(s)`);
  return failed === 0 ? 0 : 1;
}

process.exit(selfTest());
