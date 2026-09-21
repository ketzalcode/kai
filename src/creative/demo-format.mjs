#!/usr/bin/env node
// demo-format — does this demo meet the format its placement demands?
//
// Why this exists
// ---------------
// The rest of the pipeline is mechanism: capture measures, zoom renders, narrate
// places. None of them has an opinion about whether the result is the right
// *shape* for where it is going. A three-minute walkthrough is right in a docs
// page and wrong as a social teaser; a 12 MB file is fine on a paid repository
// and simply will not upload to a free one.
//
// Two rules shape the whole file
// ------------------------------
// **1. The take is not the final timeline.** This was found the expensive way.
// The first version of this checker measured runtime from the take manifest, and
// on our own shipped demo the last measured step ends at 37.2s while the video
// is 50s long — thirteen seconds of tail the check could not see. It would have
// passed a 50-second demo off as a 37-second one. So anything about how long the
// viewer watches is measured from the **rendered file**, and a take alone is not
// enough to answer it.
//
// **2. A checker that silently skips is worse than no checker**, because it
// prints a clean pass over a demo it barely looked at. Every check declares the
// input it needs, anything that could not run is reported as skipped with the
// reason, and a run missing inputs is `INCOMPLETE` — never a pass.
//
// What it cannot do
// -----------------
// It cannot tell you the outcome was *visible*: readable at delivery size,
// unobscured, on screen long enough to register. It knows when a step the
// director marked arrived, which is a much weaker claim, and it says so at the
// point it makes it. It has no opinion on whether the demo is interesting.

import { readFileSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { parseScreenplay, parseTake } from './demo-capture.mjs';

// Placement profiles.
//
// These are **evidence-informed product defaults**, not scientific optima, and
// the distinction is load-bearing enough to state at the top of the file.
//
// The widely repeated "a demo must be under 60 seconds" is not supported by the
// evidence. Wistia's State of Video (13M videos, 79M viewing hours) puts the
// material engagement drop after roughly *five minutes*, and its software and
// technology cut performs best between 3 and 30 minutes. The sub-minute advice
// comes from completion benchmarks — around 65% of viewers finish a business
// video under a minute — which is an argument about teasers, not about teaching
// somebody a task.
//
// So a short target here is a choice about attention in a feed, not a finding
// that a longer demo is worse. The evidence supports the broad trade-off; it
// does not endorse these exact numbers, and nothing here may fail a demo purely
// for crossing one. Only `max_seconds`, which somebody actually declared, can.
//
// `muted` marks placements that autoplay without sound, where narration is a
// second channel and captions are not optional.
export const PLACEMENTS = {
  'social-teaser': { target: 25, cap: 45, maxBytes: null, muted: true, note: 'autoplays muted in a feed' },
  'landing-hero': { target: 40, cap: 60, maxBytes: null, muted: true, note: 'often autoplays, usually muted' },
  // Provenance: GitHub attachment limits observed 2026-08. Platform limits
  // change, so this is a portability target for Free repositories rather than a
  // permanent fact about GitHub.
  readme: { target: 60, cap: 90, maxBytes: 10 * 1024 * 1024, muted: false, note: 'GitHub Free caps video attachments at 10 MB (observed 2026-08)' },
  walkthrough: { target: 90, cap: 180, maxBytes: 100 * 1024 * 1024, muted: false, note: 'GitHub paid plans cap at 100 MB (observed 2026-08)' },
  'deep-walkthrough': { target: 300, cap: 1800, maxBytes: 100 * 1024 * 1024, muted: false, note: 'past five minutes by explicit intent' },
};

// Words per minute for the pre-synthesis forecast. 130 is a normal explainer
// pace; dense developer workflows read nearer 120. Both are rough: code, command
// names, acronyms, URLs and authored pauses all read slower than prose, and
// voices differ. This number plans. It never validates.
export const WPM = { default: 130, dense: 120 };

// Roughly this much of the timeline should be action the viewer watches rather
// than narration over it. Without it a "60-second demo" becomes 60 seconds of
// continuous talking with nothing to see.
export const HOLD_RESERVE = 0.15;

// Dead air at the end of a render — recorded tail after the last thing that
// happened. A little lets the result land; a lot is a demo that appears to have
// finished and then keeps playing.
export const TAIL_WARN = 3;

function fail(message) {
  throw new Error(message);
}

const round = (n) => Math.round(n * 100) / 100;
const mb = (bytes) => `${round(bytes / (1024 * 1024))} MB`;

// A check that could not run is a first-class result, never an absence. And
// "not applicable" is distinct from "input absent": one is a decision, the
// other is missing evidence.
const pass = (id, detail) => ({ id, status: 'pass', detail });
const warn = (id, detail) => ({ id, status: 'warn', detail });
const bad = (id, detail) => ({ id, status: 'fail', detail });
const skip = (id, needs) => ({ id, status: 'skipped', detail: `needs ${needs}` });
const na = (id, why) => ({ id, status: 'n/a', detail: why });

export function profileFor(screenplay) {
  if (!screenplay.placement) fail(`this screenplay declares no placement, so there is no format to check it against. Add "placement": one of ${Object.keys(PLACEMENTS).join(', ')}`);
  return PLACEMENTS[screenplay.placement];
}

// ------------------------------------------------------------------- checks

// Do the screenplay and the take describe the same demo? Without this the
// checker will happily combine a screenplay, a take and a render from three
// different revisions and report confidently on something that never existed.
export function checkProvenance(screenplay, take) {
  if (!take) return skip('provenance', 'a take manifest');
  const authored = new Set(screenplay.steps.map((s) => s.id));
  const recorded = new Set(take.steps.map((s) => s.id));
  const missing = [...authored].filter((id) => !recorded.has(id));
  const extra = [...recorded].filter((id) => !authored.has(id));
  if (missing.length || extra.length) {
    return bad('provenance', `the screenplay and the take are not the same revision${missing.length ? `; never recorded: ${missing.join(', ')}` : ''}${extra.length ? `; recorded but not authored: ${extra.join(', ')}` : ''}. Every number derived from them would describe a demo that does not exist.`);
  }
  const broken = take.steps.filter((s) => s.status !== 'ok');
  if (broken.length) {
    return bad('provenance', `the take recorded ${broken.map((s) => `"${s.id}" as ${s.status}`).join(', ')}. A demo built on a step that failed, or on a screen that never settled, is not a demo of the product working.`);
  }
  return pass('provenance', `${take.steps.length} steps, all ok, matching the screenplay`);
}

// Before a single paid call, is the script even the right size for the slot?
//
// This forecasts; it does not validate. Word counts at an assumed pace hide two
// things it cannot see: how a specific voice reads code, command names and URLs,
// and whether any *individual* line fits the states it describes. A total that
// fits can still contain a line that does not. `demo-narrate` answers that with
// measured durations, and that answer is the one that decides.
export function checkWordBudget(screenplay, { wpm = WPM.default } = {}) {
  const beats = screenplay.narration ?? [];
  // Not applicable rather than skipped: a silent demo is not withholding a
  // script, it has none. Calling that missing evidence would make every silent
  // demo permanently INCOMPLETE and hollow out the word.
  if (beats.length === 0) return na('word-budget', 'this demo has no narration, so there is no script to budget');
  const profile = profileFor(screenplay);

  const planned = screenplay.max_seconds ?? profile.target;
  const words = beats.reduce((total, beat) => total + beat.text.trim().split(/\s+/).filter(Boolean).length, 0);
  const speakable = planned * (1 - HOLD_RESERVE);
  const budget = Math.floor((speakable / 60) * wpm);

  const detail = `${words} words against a ${budget}-word guideline for a ${planned}s ${screenplay.placement}, at ${wpm} wpm with ${Math.round(HOLD_RESERVE * 100)}% reserved for action`;
  if (words > budget * 1.15) {
    return bad('word-budget', `${detail}. That is past what a pace estimate can be wrong by: cut about ${words - budget} words, or choose a longer placement. Feasibility is still unknown until synthesis measures it.`);
  }
  if (words > budget) {
    return warn('word-budget', `${detail}. Within the margin a pace estimate can be wrong by, so it may still fit. Feasibility is unknown until synthesis measures it.`);
  }
  return pass('word-budget', `${detail}. Planning forecast only — feasibility is unknown until synthesis, and a total that fits can still contain a line that does not.`);
}

// How long the viewer actually watches. Measured from the render, because the
// take ends at the last thing that happened, not at the last frame.
export function checkDuration(screenplay, render) {
  if (!render?.seconds) return skip('duration', 'a rendered video (the take is not the final timeline)');
  const profile = profileFor(screenplay);
  const seconds = render.seconds;

  // The only runtime number that may fail a demo, because it is the only one
  // somebody promised rather than a default this file chose.
  if (screenplay.max_seconds && seconds > screenplay.max_seconds) {
    return bad('duration', `${round(seconds)}s is over the ${screenplay.max_seconds}s this screenplay declares as its own limit`);
  }
  if (seconds > profile.cap) {
    return warn('duration', `${round(seconds)}s is past the ${profile.cap}s editorial cap for ${screenplay.placement}. That cap is a product default, not a platform fact — accept it deliberately, declare a longer placement, or set max_seconds to make the limit real.`);
  }
  if (seconds > profile.target) {
    return warn('duration', `${round(seconds)}s is over the ${profile.target}s target for ${screenplay.placement}, inside its ${profile.cap}s cap. The evidence supports the trade-off, not this exact number.`);
  }
  return pass('duration', `${round(seconds)}s, inside the ${profile.target}s target for ${screenplay.placement}`);
}

// A render that keeps playing after the demo has visibly finished reads as a
// mistake, and it is invisible to anything that only reads the take.
export function checkTail(take, render) {
  if (!take || !render?.seconds) return skip('tail', 'a take manifest and a rendered video');
  const lastEvent = Math.max(...take.steps.map((s) => s.end));
  const tail = render.seconds - lastEvent;
  if (tail < -0.5) {
    return bad('tail', `the render (${round(render.seconds)}s) is shorter than the recorded action (${round(lastEvent)}s); the end of the demo is missing`);
  }
  if (tail > TAIL_WARN) {
    return warn('tail', `${round(tail)}s of the render happens after the last recorded step (${round(lastEvent)}s of ${round(render.seconds)}s). Trim it, or hold something worth watching.`);
  }
  return pass('tail', `${round(tail)}s after the last recorded step`);
}

// Does the payoff arrive early enough to be seen?
//
// The honest scope: this knows *when a step the director marked began*,
// measured, as a fraction of the finished runtime. It does not know the result
// was readable, unobscured, or held long enough to register, and it cannot know
// whether the marked step is the outcome that was actually promised — a director
// can mark a convenient early screen. So arriving late is a finding; arriving
// early is not a guarantee, and the report says so either way.
export function checkArrival(screenplay, take, render) {
  if (!take || !render?.seconds) return skip('arrival', 'a take manifest and a rendered video');
  const declared = screenplay.steps.filter((s) => s.intends_to_show);
  if (declared.length === 0) return skip('arrival', 'a step marked intends_to_show');

  const measured = new Map(take.steps.map((s) => [s.id, s]));
  const total = render.seconds;
  const limits = { 'intended-outcome': 0.25, 'primary-action': 0.5 };
  const problems = [];

  for (const step of declared) {
    const m = measured.get(step.id);
    if (!m) { problems.push(`"${step.id}" is not in the take`); continue; }
    const at = m.start / total;
    if (at > limits[step.intends_to_show]) {
      problems.push(`the ${step.intends_to_show} ("${step.id}") does not begin until ${Math.round(at * 100)}% in (${round(m.start)}s of ${round(total)}s); aim for ${limits[step.intends_to_show] * 100}%`);
    }
  }

  return problems.length > 0
    ? warn('arrival', `${problems.join('; ')}. Move the setup later, cut it, or trim the tail.`)
    : pass('arrival', `${declared.map((s) => `${s.intends_to_show} "${s.id}"`).join(', ')} begin early enough. Arrival time only — that it was readable and unobscured is a review question, not a measurement.`);
}

// Not advice: a file over the limit does not upload at all.
export function checkSize(screenplay, render) {
  const profile = profileFor(screenplay);
  if (!profile.maxBytes) return na('size', `${screenplay.placement} has no published upload limit to check against`);
  if (!render?.bytes) return skip('size', 'a rendered video');
  const size = render.bytes;
  if (size > profile.maxBytes) {
    return bad('size', `${mb(size)} is over the ${mb(profile.maxBytes)} limit (${profile.note}). The upload is refused, not merely discouraged.`);
  }
  if (size > profile.maxBytes * 0.8) {
    return warn('size', `${mb(size)} is within ${mb(profile.maxBytes)} but close to it (${profile.note}); a slightly longer take would not fit`);
  }
  return pass('size', `${mb(size)}, inside the ${mb(profile.maxBytes)} limit (${profile.note})`);
}

// Where a video autoplays muted, a demo that only works with sound on does not
// work. Tracking captions in another issue does not make an uncaptioned demo
// acceptable in a feed today.
export function checkMutedComprehension(screenplay) {
  const profile = profileFor(screenplay);
  if (!profile.muted) return na('sound-off', `${screenplay.placement} does not autoplay muted`);
  const beats = screenplay.narration ?? [];
  if (screenplay.captions) return pass('sound-off', `captions declared (${typeof screenplay.captions === 'string' ? screenplay.captions : 'burned in'}), so the demo survives that it ${profile.note}`);
  if (beats.length > 0) {
    return bad('sound-off', `this demo carries ${beats.length} narration beat(s) and no captions, but it ${profile.note}. Most viewers would be shown a silent film of exactly the parts you chose to explain out loud.`);
  }
  return warn('sound-off', `no narration and no captions, and it ${profile.note}. The demo has to carry itself visually — check that what is on screen tells the story alone.`);
}

// A vertical cut of a desktop capture is not a vertical demo: the readable
// focal region moves, so the crop lands on whitespace or half a control.
export function checkFraming(screenplay, render) {
  if (!render?.width) return skip('framing', 'a rendered video');
  const { width, height } = render;
  const ratio = width / height;
  if (width % 2 !== 0 || height % 2 !== 0) return bad('framing', `${width}x${height} is odd in a dimension; h264 cannot encode it in yuv420p`);
  if (ratio < 1) {
    return warn('framing', `${width}x${height} is portrait. A vertical demo has to be composed vertically, not cropped from a desktop capture — the readable region moves, so a crop lands on whitespace or half a control.`);
  }
  // Metadata proves the frame is big, not that the text in it is legible once
  // embedded at a fraction of that size. Say only what is known.
  return pass('framing', `${width}x${height} (${round(ratio)}:1), landscape. Frame size only — legibility at embedded size is a review question.`);
}

export function probeRender(path, run = defaultProbe) {
  if (!path) return null;
  if (!existsSync(path)) fail(`${path} does not exist`);
  const out = run(path);
  if (!out) return null;
  const [width, height, duration] = out.trim().split(/[\r\n,]+/).map(Number);
  return {
    width: Number.isFinite(width) ? width : null,
    height: Number.isFinite(height) ? height : null,
    seconds: Number.isFinite(duration) ? duration : null,
    bytes: statSync(path).size,
  };
}

function defaultProbe(path) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'csv=p=0', path], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
}

// ------------------------------------------------------------------- report

export function checkAll(screenplay, { take = null, render = null, wpm = WPM.default } = {}) {
  const checks = [
    checkProvenance(screenplay, take),
    checkWordBudget(screenplay, { wpm }),
    checkDuration(screenplay, render),
    checkTail(take, render),
    checkArrival(screenplay, take, render),
    checkSize(screenplay, render),
    checkMutedComprehension(screenplay),
    checkFraming(screenplay, render),
  ];
  const skipped = checks.filter((c) => c.status === 'skipped');
  const failures = checks.filter((c) => c.status === 'fail');
  const warnings = checks.filter((c) => c.status === 'warn');

  // INCOMPLETE is its own state. A run that could not check runtime, size or
  // framing has not established that the demo fits anything, and calling that a
  // pass with warnings would manufacture confidence it has not earned.
  const status = failures.length > 0 ? 'FAIL'
    : skipped.length > 0 ? 'INCOMPLETE'
      : warnings.length > 0 ? 'PASS WITH WARNINGS'
        : 'PASS';

  return {
    placement: screenplay.placement,
    checks,
    status,
    ran: checks.length - skipped.length,
    total: checks.length,
    failures: failures.length,
    warnings: warnings.length,
    ok: failures.length === 0,
  };
}

export function formatReport(result) {
  const mark = { pass: 'ok  ', warn: 'warn', fail: 'FAIL', skipped: '--  ', 'n/a': 'n/a ' };
  const lines = result.checks.map((c) => `  ${mark[c.status]} ${c.id.padEnd(11)} ${c.detail}`);
  const skipped = result.checks.filter((c) => c.status === 'skipped');
  lines.push('');
  lines.push(`${result.status} — placement "${result.placement}", ${result.ran}/${result.total} checks ran${skipped.length ? `, ${skipped.length} could not (${skipped.map((c) => c.id).join(', ')})` : ''}.`);
  if (result.status === 'INCOMPLETE') lines.push('Missing evidence is not a pass. Supply the take and the render to check the rest.');
  if (result.status.startsWith('PASS')) lines.push('This says the demo fits its slot. It does not say the demo is good, or that what it points at was readable.');
  return lines.join('\n');
}

// ------------------------------------------------------------------ self-test

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

// ------------------------------------------------------------------------ cli

function flag(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

function main(argv) {
  if (argv.includes('--self-test')) return selfTest() ? 0 : 1;
  if (argv.includes('--placements')) {
    for (const [name, p] of Object.entries(PLACEMENTS)) {
      console.log(`  ${name.padEnd(17)} target ${String(p.target).padStart(4)}s   cap ${String(p.cap).padStart(4)}s   ${(p.maxBytes ? mb(p.maxBytes) : '-').padStart(9)}   ${p.muted ? 'muted' : '     '}  ${p.note}`);
    }
    console.log('\nEvidence-informed product defaults, not scientific optima. Only max_seconds, which you declare, can fail a demo on runtime.');
    return 0;
  }

  const consumed = new Set(['--take', '--video', '--wpm']);
  const screenplayPath = argv.find((a, i) => !a.startsWith('-') && !consumed.has(argv[i - 1]));
  if (!screenplayPath) {
    console.log('demo-format — does this demo meet the format its placement demands?\n');
    console.log('  demo-format <screenplay.json> [--take take.json] [--video render.mp4] [--wpm 120]');
    console.log('  demo-format --placements');
    console.log('  demo-format --self-test');
    return 2;
  }

  const screenplay = parseScreenplay(readFileSync(screenplayPath, 'utf8'));
  const takePath = flag(argv, '--take');
  const result = checkAll(screenplay, {
    take: takePath ? parseTake(readFileSync(takePath, 'utf8')) : null,
    render: probeRender(flag(argv, '--video')),
    wpm: Number(flag(argv, '--wpm', WPM.default)),
  });
  console.log(formatReport(result));
  return result.ok ? 0 : 1;
}

if (process.argv[1]?.endsWith('demo-format.mjs')) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`demo-format: ${error.message}`);
    process.exit(1);
  }
}
