// Does this demo meet the format its placement demands? — `src/creative/demo-format.mjs`.
//
// Moved out of the checker itself (#225). The checker's whole point is that a
// silent skip is worse than no check, so the suite that proves it must keep
// running; only its address changed.

import { parseScreenplay, parseTake } from '../src/creative/lib/screenplay.mjs';
import {
  PLACEMENTS, WPM,
  checkProvenance, checkWordBudget, checkDuration, checkTail, checkArrival, checkSize,
  checkMutedComprehension, checkFraming, checkAll, formatReport,
} from '../src/creative/demo-format.mjs';

function selfTest() {
  let pass_ = 0;
  let failed = 0;
  const ok = (cond, label) => {
    if (cond) { pass_ += 1; console.log(`  ok ${label}`); } else { failed += 1; console.log(`  FAIL ${label}`); }
  };
  const rejects = (fn, needle, label) => {
    try { fn(); failed += 1; console.log(`  FAIL ${label} (nothing was refused)`); } catch (e) {
      if (String(e.message).includes(needle)) { pass_ += 1; console.log(`  ok ${label}`); } else { failed += 1; console.log(`  FAIL ${label}: ${e.message}`); }
    }
  };

  const play = (extra = {}) => JSON.stringify({
    schema: 'kai.demo-screenplay/v1',
    title: 't',
    placement: 'readme',
    capture: { region: '0,0 100x100' },
    steps: [
      { id: 'setup', action: 'navigate', url: 'https://x.test' },
      { id: 'act', action: 'click', target: 'a' },
      { id: 'result', action: 'hold', seconds: 2 },
    ],
    ...extra,
  });
  const sp = parseScreenplay(play());
  const take = (steps) => parseTake(JSON.stringify({
    schema: 'kai.demo-take/v1', take_id: 'k', recording: 'r.mp4', capture: { region: '0,0 100x100' }, steps,
  }));
  const whole = take([{ id: 'setup', start: 0, end: 10 }, { id: 'act', start: 10, end: 12 }, { id: 'result', start: 12, end: 30 }]);
  const render = (over = {}) => ({ width: 1256, height: 784, seconds: 32, bytes: 3 * 1024 * 1024, ...over });

  // --- the schema
  rejects(() => parseScreenplay(play({ placement: 'tiktok' })), 'placement must be one of', "an unknown placement is refused rather than defaulted, because a default would silently apply somebody else's caps");
  ok(sp.placement === 'readme' && sp.max_seconds === null, 'a declared placement survives parsing, and max_seconds stays absent unless declared');
  rejects(() => parseScreenplay(play({ steps: [{ id: 'a', action: 'hold', seconds: 1, intends_to_show: 'the good bit' }] })),
    'intends_to_show must be', 'an unrecognised intends_to_show is refused rather than ignored');
  ok(Object.keys(PLACEMENTS).length === 5 && ['social-teaser', 'landing-hero', 'readme', 'walkthrough', 'deep-walkthrough'].every((n) => PLACEMENTS[n]),
    'the profiles here cover exactly the placement names the schema accepts, so policy and schema cannot drift apart');
  rejects(() => checkAll(parseScreenplay(JSON.stringify({ schema: 'kai.demo-screenplay/v1', title: 't', capture: { region: '0,0 100x100' }, steps: [{ id: 'a', action: 'hold', seconds: 1 }] })), {}),
    'declares no placement', 'a screenplay with no placement is refused rather than checked against a guess');

  // --- the bug this file was rewritten for
  ok(checkDuration(sp, null).status === 'skipped', 'runtime is never taken from the take: the take ends at the last thing that happened, not at the last frame');
  ok(checkDuration(sp, { seconds: 50 }).detail.includes('50s'), 'runtime comes from the rendered file');
  ok(checkTail(whole, { seconds: 50 }).status === 'warn' && checkTail(whole, { seconds: 50 }).detail.includes('20s'),
    'a render that keeps playing long after the last recorded step is caught — our own shipped demo has 12.8s of it and nothing could see it');
  ok(checkTail(whole, { seconds: 20 }).status === 'fail', 'a render shorter than the recorded action fails: the end of the demo is missing');
  ok(checkTail(whole, null).status === 'skipped', 'tail needs both the take and the render, and says so rather than guessing');

  // --- INCOMPLETE is not a pass
  const bare = checkAll(sp, {});
  ok(bare.status === 'INCOMPLETE', 'with no take and no render the verdict is INCOMPLETE, not a pass with warnings');
  ok(bare.ok === true && bare.status !== 'PASS', 'the absence of failures is not the same as passing, and the two are reported separately');
  ok(formatReport(bare).includes('Missing evidence is not a pass'), 'an incomplete run says plainly that it did not establish anything');
  const marked = parseScreenplay(play({ steps: [
    { id: 'setup', action: 'navigate', url: 'https://x.test' },
    { id: 'act', action: 'click', target: 'a', intends_to_show: 'primary-action' },
    { id: 'result', action: 'hold', seconds: 2, intends_to_show: 'intended-outcome' },
  ] }));
  const early = take([{ id: 'setup', start: 0, end: 2 }, { id: 'act', start: 2, end: 4 }, { id: 'result', start: 4, end: 20 }]);
  ok(checkAll(sp, { take: whole, render: render() }).status === 'INCOMPLETE',
    'a demo that never declares its payoff stays INCOMPLETE even with every file present: the most important editorial property is unanswerable until somebody marks it');
  const full = checkAll(marked, { take: early, render: render() });
  ok(full.status.startsWith('PASS') && full.ran === full.total, 'a run with every input reports how many checks ran and passes on its own terms');
  ok(formatReport(full).includes('does not say the demo is good'), 'a pass states its own scope, so it cannot be read as an endorsement');

  // --- duration: only a declared limit may fail
  ok(checkDuration(sp, { seconds: 30 }).status === 'pass', 'a demo inside its target passes');
  ok(checkDuration(sp, { seconds: 75 }).status === 'warn', 'over target is a warning');
  ok(checkDuration(sp, { seconds: 200 }).status === 'warn', 'even past the editorial cap it is only a warning: the cap is a product default, not a platform fact');
  ok(checkDuration(parseScreenplay(play({ max_seconds: 45 })), { seconds: 60 }).status === 'fail',
    'a limit somebody actually declared does fail — that is the difference between a promise and a default');
  ok(checkDuration(sp, { seconds: 200 }).detail.includes('not a platform fact'), 'the cap warning carries its own provenance, so nobody mistakes a default for a finding');

  // --- size is not advice
  ok(checkSize(sp, render({ bytes: 11 * 1024 * 1024 })).status === 'fail', 'a README demo over 10 MB fails: GitHub Free refuses the upload outright');
  ok(checkSize(sp, render({ bytes: 11 * 1024 * 1024 })).detail.includes('refused'), 'the size failure says it is a hard limit, not a preference');
  ok(checkSize(sp, render({ bytes: 9 * 1024 * 1024 })).status === 'warn', 'close to the limit warns, because the next take would not fit');
  ok(checkSize(sp, render({ bytes: 3.32 * 1024 * 1024 })).status === 'pass', 'our real 50s render at 3.32 MB passes');
  ok(checkSize(parseScreenplay(play({ placement: 'social-teaser' })), render({ bytes: 999 * 1024 * 1024 })).status === 'n/a',
    'a placement with no published limit is not applicable rather than skipped: nothing is missing, there is simply no limit');
  ok(PLACEMENTS.readme.note.includes('2026-08'), 'the byte limit carries the date it was observed, because platform limits change');

  // --- provenance
  ok(checkProvenance(sp, take([{ id: 'other', start: 0, end: 1 }])).status === 'fail',
    'a screenplay and a take from different revisions are caught before any number derived from them is reported');
  ok(checkProvenance(sp, take([{ id: 'setup', start: 0, end: 1, status: 'unsettled' }, { id: 'act', start: 1, end: 2 }, { id: 'result', start: 2, end: 3 }])).status === 'fail',
    'a take containing a failed or unsettled step fails: that is not a demo of the product working');
  ok(checkProvenance(sp, whole).status === 'pass', 'a matching, clean take passes provenance');

  // --- arrival, and the limits of what it claims
  ok(checkArrival(sp, whole, render()).status === 'skipped', 'arrival is skipped when no step claims to be the payoff: guessing which one it is would be inventing intent');
  ok(checkArrival(marked, early, { seconds: 32 }).status === 'pass', 'a payoff on screen a fifth of the way in passes');
  ok(checkArrival(marked, early, { seconds: 32 }).detail.includes('review question'),
    'even passing, arrival refuses to claim the result was readable or unobscured — it only knows when the step began');
  ok(checkArrival(marked, take([{ id: 'setup', start: 0, end: 50 }, { id: 'act', start: 50, end: 52 }, { id: 'result', start: 52, end: 60 }]), { seconds: 62 }).status === 'warn',
    'a payoff held to the end is a warning, not a failure: the threshold is editorial and a director may have a reason');
  ok(checkArrival(marked, whole, null).status === 'skipped', 'arrival needs the render, because the percentage is of the finished runtime and not of the take');

  // --- word budget forecasts, it does not validate
  const wordy = parseScreenplay(play({ narration: [{ id: 'n1', text: Array(300).fill('word').join(' '), visual_span: { from_step: 'setup', through_step: 'result' } }] }));
  ok(checkWordBudget(wordy).status === 'fail', 'a script far beyond its slot is caught before a single paid call');
  ok(checkWordBudget(wordy).detail.includes('unknown until synthesis'), 'the pre-synthesis failure defers to the measured check rather than claiming to be it');
  const near = parseScreenplay(play({ narration: [{ id: 'n1', text: Array(115).fill('word').join(' '), visual_span: { from_step: 'setup', through_step: 'result' } }] }));
  ok(checkWordBudget(near).status === 'warn', 'just over budget is a warning, because a pace estimate is not accurate enough to fail on');
  const brief = parseScreenplay(play({ narration: [{ id: 'n1', text: 'Short line.', visual_span: { from_step: 'setup', through_step: 'result' } }] }));
  ok(checkWordBudget(brief).detail.includes('a total that fits can still contain a line that does not'),
    'a passing budget says what it cannot see: an aggregate hides a single line that will not fit its own span');
  ok(checkWordBudget(brief, { wpm: WPM.dense }).detail.includes('120 wpm'), 'a denser pace can be declared and is named in the result');
  ok(checkWordBudget(sp).status === 'n/a', 'a silent demo has nothing to budget: that is not applicable, not missing evidence, or every silent demo would be permanently INCOMPLETE');
  ok(checkWordBudget(parseScreenplay(play({ max_seconds: 20, narration: [{ id: 'n1', text: 'a b c', visual_span: { from_step: 'setup' } }] }))).detail.includes('20s'),
    'the budget is measured against the declared runtime when there is one, not against the placement default');

  // --- sound-off
  const teaser = (extra) => parseScreenplay(play({ placement: 'social-teaser', ...extra }));
  const oneBeat = [{ id: 'n1', text: 'x', visual_span: { from_step: 'setup' } }];
  ok(checkMutedComprehension(sp).status === 'n/a', 'a README demo is not judged on muted autoplay, because it does not autoplay muted');
  ok(checkMutedComprehension(teaser({ narration: oneBeat })).status === 'fail',
    'a narrated teaser with no captions fails: it autoplays muted, so most viewers get a silent film of the parts chosen for explanation');
  ok(checkMutedComprehension(teaser({ narration: oneBeat, captions: 'burned-in' })).status === 'pass', 'declaring captions clears it');
  ok(checkMutedComprehension(teaser({})).status === 'warn', 'an unnarrated teaser is warned rather than failed: it may genuinely carry itself visually');

  // --- framing
  ok(checkFraming(sp, render()).status === 'pass', 'our real render size passes framing');
  ok(checkFraming(sp, render()).detail.includes('legibility'), 'framing says only that the frame is big, never that the text in it is readable once embedded');
  ok(checkFraming(sp, render({ width: 1080, height: 1920 })).status === 'warn', 'a portrait render warns: a vertical demo must be composed, not cropped from a desktop capture');
  ok(checkFraming(sp, render({ width: 1255 })).status === 'fail', 'an odd dimension fails, because h264 cannot encode it in yuv420p');
  ok(checkFraming(sp, null).status === 'skipped', 'framing is skipped without a render rather than assumed from the capture region');

  console.log(`\ndemo-format self-test: ${pass_} checks passed${failed ? `, ${failed} FAILED` : ''}`);
  return failed === 0;
}

process.exit(selfTest() ? 0 : 1);
