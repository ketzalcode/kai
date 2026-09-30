// The exception report — `src/core/work-status.mjs`.
//
// Moved out of the command itself (#225): the assertions were gated on a
// `--self-test` argv string the bundler could not fold away, so every consumer
// downloaded them. The checks are unchanged.
//
// These run against the committed golden fixtures under `test/fixtures/
// work-status/` and the shipped example workspace, so the report's honesty
// contract — declared vs derived, and UNKNOWN rather than green — is asserted
// against real records rather than hand-built objects.

import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { collect, render, overlay } from '../src/core/work-status.mjs';

const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

function selfTest() {
  let failed = 0;
  const ok = (cond, msg) => { if (cond) console.log(`✓ self-test: ${msg}`); else { console.error(`✗ self-test: ${msg}`); failed++; } };
  const fixtures = join(REPO_ROOT, 'test', 'fixtures', 'work-status');
  const NOW = Date.UTC(2026, 2, 10, 12, 0);

  const healthy = collect(join(REPO_ROOT, 'examples', 'e2e-feature-delivery'), NOW);
  ok(healthy.ok && healthy.findings.length === 0,
    `the shipped example workspace reports no exception (${healthy.ok ? healthy.findings.length : healthy.reason} finding(s))`);

  const ex = collect(join(fixtures, 'exceptions'), NOW);
  const has = (section, re) => ex.findings.some((f) => f.section === section && re.test(f.headline));
  ok(ex.ok, 'exception fixture is readable');
  ok(has('needs-you', /open decision for the operator/), 'an open @operator question surfaces as NEEDS YOU');
  ok(has('needs-you', /waits on a human/), 'a release-ready item surfaces as NEEDS YOU');
  ok(has('integrity', /approved .* but the item is now at/), 'a review bound to a stale change_ref is an INTEGRITY failure');
  ok(has('blocked', /waits for .* to reach/), 'an unmet typed dependency is BLOCKED');
  ok(has('unknown', /lease held by .* expired/), 'an expired lease is UNKNOWN, not a confident state');
  ok(has('unknown', /no next_role and no lease holder/), 'active work with nobody to act next is UNKNOWN');
  ok(has('integrity', /no readable frontmatter/), 'an unparseable item is an INTEGRITY failure, not silently skipped');
  ok(ex.findings.every((f) => f.tier === 'declared' || f.tier === 'derived'),
    'every finding carries a confidence tier');

  // A live conflict in a durable thread must be visible in work-status, not
  // only to a caller that reads `parseThread` diagnostics directly.
  const conflict = ex.findings.filter((f) => f.item === 'thread-conflict' && f.section === 'integrity');
  ok(conflict.some((f) => /does not reconcile \(conflicting answer\)/.test(f.headline)),
    'a conflicting-answer thread diagnostic surfaces as a work-status INTEGRITY finding');
  ok(!conflict.some((f) => /hunter2/.test(f.headline) || /hunter2/.test(f.why)),
    'a surfaced thread diagnostic never echoes the raw answer text, only its fixed reason');

  // A finding must never point at a path outside the workspace, and must never
  // echo an absolute path (this output may be pasted into a public issue).
  ok(ex.findings.every((f) => !/^([A-Za-z]:|\/|\\\\)/.test(f.path)),
    'no finding exposes a machine-absolute path');

  const shipped = ex.findings.filter((f) => f.item === 'done-clean');
  ok(shipped.length === 0, 'a cleanly shipped item produces no finding');

  // A review iteration legitimately leaves the superseded review in the record.
  // Flagging it would make INTEGRITY fire on correctly reviewed work.
  ok(!ex.findings.some((f) => f.item === 'review-iterated' && f.section === 'integrity'),
    'a superseded review re-certified at the current ref is not an INTEGRITY failure');
  ok(has('unknown', /waiting_on_questions is set but the state is/),
    'an item naming blocking questions while not blocked is UNKNOWN');
  ok(!ex.findings.some((f) => f.item === 'question-not-blocked' && /no packet in the thread/.test(f.headline)),
    'a QUESTION packet written as a markdown heading is still found in the thread');
  ok(!('root' in ex) && typeof ex.workspace === 'string' && !/[\\/]/.test(ex.workspace),
    'the report never emits a machine-absolute root path');

  const rendered = render(ex);
  ok(/DECLARED, not verified live activity/.test(rendered), 'the rendered report states its honesty contract');
  ok(/Recorded state at/.test(rendered), 'the rendered report stamps revision and generation time');

  const empty = collect(join(fixtures, 'healthy'), NOW);
  ok(empty.ok && empty.findings.length === 0 && /Nothing needs you/.test(render(empty)),
    'a healthy fixture says nothing needs you');
  ok(empty.live === null, 'with no activity log there is no overlay at all');

  // The activity overlay (see the kai-core-work-activity skill). It must add exactly one
  // checkable fact and must cost nothing when the log is absent.
  const nowSec = Math.floor(NOW / 1000);
  const mkItems = [{ id: 'all-good', rel: '.kai/state/items/all-good.md', unparseable: false }];
  const absent = overlay(mkItems, { present: false, records: [], skipped: 0 }, NOW);
  ok(absent.findings.length === 0 && absent.live === null, 'an absent log produces no finding and no overlay');

  const live = overlay(mkItems, {
    present: true,
    skipped: 0,
    records: [
      { t: nowSec - 7200, e: 'start', role: 'principal-swe-backend', run: 'r1', item: 'all-good', next_report_by: nowSec - 1200 },
      { t: nowSec - 300, e: 'start', role: 'principal-qa-ui', run: 'r2', item: 'all-good', next_report_by: nowSec + 1800 },
    ],
  }, NOW);
  ok(live.findings.length === 1 && live.findings[0].tier === 'derived',
    'only a run past its own declared deadline is a finding, and it is derived');
  ok(/declared it would report/.test(live.findings[0].headline)
     && !/crash/i.test(live.findings[0].headline + live.findings[0].why),
    'the overlay reports a missed self-declared deadline, never a crash it cannot observe');
  ok(live.live.open === 2 && live.live.overdue === 1, 'open and overdue runs are counted separately');
  ok(live.findings.every((f) => !/^([A-Za-z]:|\/|\\\\)/.test(f.path)),
    'an overlay finding never exposes a machine-absolute path');

  const orphanRun = overlay(mkItems, {
    present: true,
    skipped: 0,
    records: [{ t: nowSec - 7200, e: 'start', role: 'principal-sre', run: 'r9', item: 'gone', next_report_by: nowSec - 60 }],
  }, NOW);
  ok(orphanRun.findings[0].path === '.kai/activity.jsonl',
    'a run naming an unknown item points at the log, not at a record that does not exist');

  const dupRuns = overlay(mkItems, {
    present: true,
    skipped: 0,
    records: [
      { t: nowSec - 7200, e: 'start', role: 'principal-swe-backend', run: 'r1', item: 'all-good', next_report_by: nowSec - 1200 },
      { t: nowSec - 7100, e: 'start', role: 'principal-swe-backend', run: 'r2', item: 'all-good', next_report_by: nowSec - 900 },
    ],
  }, NOW);
  ok(dupRuns.findings.length === 1 && /2 open runs/.test(dupRuns.findings[0].headline),
    'several overdue runs on one item collapse to one finding, not one each');

  console.log(failed === 0 ? '✓ work-status self-test: all checks passed' : `✗ work-status self-test: ${failed} failure(s)`);
  return failed === 0 ? 0 : 1;
}

process.exit(selfTest());
