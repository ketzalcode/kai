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
import { createHash } from 'node:crypto';
import { parseScreenplay, parseTake, parseEditedTake, TAKE_SCHEMA as RAW_TAKE_SCHEMA, EDITED_TAKE_SCHEMA } from './lib/screenplay.mjs';

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
  const dropped = new Set(take.schema === EDITED_TAKE_SCHEMA ? take.dropped_steps : []);
  const missing = [...authored].filter((id) => !recorded.has(id) && !dropped.has(id));
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

// Measured minimum before a narration-free stretch between two spoken beats is
// worth flagging. Evidence-informed, not scientific: the feedback that prompted
// this check found 13.6s, 10.4s and 8.4s holds between beats noticeably inert.
// This is a ceiling for "worth a look", never proof that every second past it
// is unnecessary -- a hold can be exactly as long as the interaction or reading
// work it carries, and only a reviewer can judge that.
export const PACING_HOLD_WARN = 6;

// Flags measured narration-free stretches *between* placed beats, not before
// the first (operator-requested settling time is deliberately not a finding
// here) or after the last (that is `checkTail`'s job). It reads a narration
// placement plan -- the measured output of `demo-narrate --place` -- because
// only measured clip timing can say where the gaps actually are; a screenplay
// alone only has intent.
export function checkPacingHolds(plan, render) {
  if (!plan || !Array.isArray(plan.beats) || plan.beats.length === 0) {
    return skip('pacing', 'a narration placement plan (demo-narrate --place output) with at least one placed beat');
  }
  if (!render?.seconds) return skip('pacing', 'a rendered video (gaps are measured against the render, not the take)');
  if (plan.ok !== true || plan.beats.some((beat) => !Number.isFinite(beat.start)
    || !Number.isFinite(beat.end) || beat.start < 0 || beat.end <= beat.start || beat.end > render.seconds + 0.1)) {
    return bad('pacing', 'the narration plan is rejected or its measured beats do not fit this render; no pacing verification is possible');
  }

  const beats = [...plan.beats].sort((a, b) => a.start - b.start);
  const holds = [];
  for (let i = 1; i < beats.length; i++) {
    const gap = beats[i].start - beats[i - 1].end;
    if (gap > PACING_HOLD_WARN) {
      holds.push(`${round(gap)}s between "${beats[i - 1].beat}" (ends ${round(beats[i - 1].end)}s) and "${beats[i].beat}" (starts ${round(beats[i].start)}s)`);
    }
  }

  if (holds.length === 0) {
    return pass('pacing', `no narration-free stretch between placed beats exceeds ${PACING_HOLD_WARN}s`);
  }
  return warn('pacing', `${holds.length} narration-free hold(s) past ${PACING_HOLD_WARN}s: ${holds.join('; ')}. These are measured gaps outside narration clips, not proof every second was unnecessary -- judge each against the interaction or reading work it actually carries, then shorten or cut what is left over.`);
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

// A record of an operator or reviewer actually inspecting the *rendered*
// result for sound-off comprehension, as opposed to the screenplay merely
// declaring `captions: true`. Deliberately a manual-inspection record, not a
// computer-vision verdict: a contact sheet, a full watch, or deterministic
// subtitle-track metadata are all legitimate methods, and the issue explicitly
// asks for proportional review, not a new heavy dependency.
export const CAPTION_REVIEW_SCHEMA = 'kai.demo-caption-review/v1';
const CAPTION_REVIEW_METHODS = new Set(['contact-sheet', 'full-video', 'subtitle-metadata']);

export function parseCaptionReview(text) {
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`the caption review is not valid JSON: ${error.message}`);
  }
  if (raw.schema !== CAPTION_REVIEW_SCHEMA) {
    fail(`the caption review must declare "schema": "${CAPTION_REVIEW_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
  }
  if (typeof raw.reviewer !== 'string' || raw.reviewer.trim() === '') fail('reviewer must be a non-empty string');
  if (!CAPTION_REVIEW_METHODS.has(raw.method)) fail(`method must be one of ${[...CAPTION_REVIEW_METHODS].join(', ')}, got ${JSON.stringify(raw.method ?? null)}`);
  if (!/^[a-f0-9]{64}$/.test(raw.render_sha256 ?? '')) fail('render_sha256 must name the reviewed render SHA-256');
  for (const field of ['captions_present', 'captions_readable', 'captions_clipped', 'captions_accurate', 'captions_cover_narration', 'opening_identifies_outcome']) {
    if (typeof raw[field] !== 'boolean') fail(`${field} must be a boolean (what was actually observed), got ${JSON.stringify(raw[field] ?? null)}`);
  }
  return {
    schema: CAPTION_REVIEW_SCHEMA,
    reviewer: raw.reviewer,
    method: raw.method,
    render_sha256: raw.render_sha256,
    captions_present: raw.captions_present,
    captions_readable: raw.captions_readable,
    captions_clipped: raw.captions_clipped === true,
    captions_accurate: raw.captions_accurate,
    captions_cover_narration: raw.captions_cover_narration,
    opening_identifies_outcome: raw.opening_identifies_outcome,
    // Named gaps the reviewer did not look at — e.g. a reviewer who only
    // sampled a contact sheet should say so rather than implying full coverage.
    uninspected: Array.isArray(raw.uninspected) ? raw.uninspected.filter((v) => typeof v === 'string' && v.trim() !== '') : [],
    note: typeof raw.note === 'string' ? raw.note : '',
  };
}

// Where a video autoplays muted, a demo that only works with sound on does not
// work. A `captions: true` declaration is the screenplay's intent, not proof
// the rendered file actually shows legible captions or a silent-comprehensible
// opening; those are review questions this function will not answer on its
// own. It only reports "verified" once a caption review record says so.
export function checkMutedComprehension(screenplay, { captionReview = null, render = null } = {}) {
  const profile = profileFor(screenplay);
  if (!profile.muted) return na('sound-off', `${screenplay.placement} does not autoplay muted`);
  const beats = screenplay.narration ?? [];

  if (!screenplay.captions) {
    if (beats.length > 0) {
      return bad('sound-off', `this demo carries ${beats.length} narration beat(s) and no captions, but it ${profile.note}. Most viewers would be shown a silent film of exactly the parts you chose to explain out loud.`);
    }
    return warn('sound-off', `no narration and no captions, and it ${profile.note}. The demo has to carry itself visually — check that what is on screen tells the story alone.`);
  }

  const declared = typeof screenplay.captions === 'string' ? screenplay.captions : 'burned in';
  if (!captionReview) {
    return warn('sound-off', `captions declared (${declared}), but that is a screenplay declaration, not inspected rendered proof: it ${profile.note}. Supply a caption review (contact sheet, full watch, or subtitle metadata) confirming captions are actually present, readable, uncut, and that the silent opening identifies the task or outcome.`);
  }
  if (!render?.sha256 || captionReview.render_sha256 !== render.sha256) {
    return warn('sound-off', 'the caption review is not bound to this exact rendered file; inspect the current render before claiming verified captions');
  }
  if (!captionReview.captions_accurate || !captionReview.captions_cover_narration) {
    return bad('sound-off', 'the reviewed captions are inaccurate or do not cover the narration; a declaration does not establish sound-off comprehension');
  }

  if (!captionReview.captions_present) {
    return bad('sound-off', `captions were declared (${declared}), but the review (${captionReview.reviewer}, ${captionReview.method}) found them absent from the rendered file. A declaration is not proof; the render does not carry what it ${profile.note} requires.`);
  }
  if (!captionReview.captions_readable || captionReview.captions_clipped) {
    const defect = captionReview.captions_clipped ? 'clipped or hidden by composition' : 'present but not readable at the target placement';
    return bad('sound-off', `the review (${captionReview.reviewer}, ${captionReview.method}) found captions ${defect}; it ${profile.note} and an unreadable caption does not satisfy that.`);
  }
  if (!captionReview.opening_identifies_outcome) {
    return bad('sound-off', `the review (${captionReview.reviewer}, ${captionReview.method}) found the opening frames do not identify the task or outcome without audio; a viewer landing muted would not know what they are looking at before any caption appears.`);
  }
  if (captionReview.uninspected.length > 0) {
    return warn('sound-off', `captions verified present, readable, and uncut by ${captionReview.reviewer} (${captionReview.method}), and the opening identifies the outcome without audio; left uninspected: ${captionReview.uninspected.join(', ')}.`);
  }
  if (captionReview.method === 'subtitle-metadata') {
    return warn('sound-off', 'subtitle metadata cannot establish rendered readability, clipping, or the visible opening; visual inspection is still required');
  }
  return pass('sound-off', `captions verified present, readable, and uncut by ${captionReview.reviewer} (${captionReview.method}), and the opening frames identify the task/outcome without audio.`);
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
    sha256: createHash('sha256').update(readFileSync(path)).digest('hex'),
  };
}

function defaultProbe(path) {
  const r = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=width,height:format=duration', '-of', 'csv=p=0', path], { encoding: 'utf8' });
  return r.status === 0 ? r.stdout : null;
}

// ------------------------------------------------------------------- report

export function checkAll(screenplay, { take = null, render = null, wpm = WPM.default, captionReview = null, narrationPlan = null } = {}) {
  const checks = [
    checkProvenance(screenplay, take),
    checkWordBudget(screenplay, { wpm }),
    checkDuration(screenplay, render),
    checkTail(take, render),
    checkArrival(screenplay, take, render),
    (screenplay.narration ?? []).length > 0
      ? checkPacingHolds(narrationPlan, render)
      : na('pacing', 'this demo has no narration, so there are no narration gaps to measure'),
    checkSize(screenplay, render),
    checkMutedComprehension(screenplay, { captionReview, render }),
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

// ------------------------------------------------------------------------ cli

function flag(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

// A --take path may hold either a raw capture take or an edited take (cut from
// one). Accepting both here, not only the raw schema, is what lets a format
// check run against the timeline the production actually produced instead of
// forcing an adapter that relabels one as the other.
function loadTake(takePath, argv) {
  const text = readFileSync(takePath, 'utf8');
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`${takePath} is not valid JSON: ${error.message}`);
  }
  if (raw.schema === RAW_TAKE_SCHEMA) return parseTake(text);
  if (raw.schema === EDITED_TAKE_SCHEMA) {
    const sourcePath = flag(argv, '--source-take');
    if (!sourcePath) fail(`${takePath} is an edited take (${EDITED_TAKE_SCHEMA}); supply --source-take <raw_take.json> to verify it was cut from an actual recording`);
    const sourceTake = parseTake(readFileSync(sourcePath, 'utf8'));
    return parseEditedTake(text, sourceTake);
  }
  fail(`${takePath} must declare "schema": "${RAW_TAKE_SCHEMA}" or "${EDITED_TAKE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
}

function main(argv) {
  if (argv.includes('--placements')) {
    for (const [name, p] of Object.entries(PLACEMENTS)) {
      console.log(`  ${name.padEnd(17)} target ${String(p.target).padStart(4)}s   cap ${String(p.cap).padStart(4)}s   ${(p.maxBytes ? mb(p.maxBytes) : '-').padStart(9)}   ${p.muted ? 'muted' : '     '}  ${p.note}`);
    }
    console.log('\nEvidence-informed product defaults, not scientific optima. Only max_seconds, which you declare, can fail a demo on runtime.');
    return 0;
  }

  const consumed = new Set(['--take', '--video', '--wpm', '--source-take', '--caption-review', '--narration-plan']);
  const screenplayPath = argv.find((a, i) => !a.startsWith('-') && !consumed.has(argv[i - 1]));
  if (!screenplayPath) {
    console.log('demo-format — does this demo meet the format its placement demands?\n');
    console.log('  demo-format <screenplay.json> [--take take.json] [--source-take raw_take.json] [--video render.mp4] [--wpm 120] [--caption-review review.json] [--narration-plan plan.json]');
    console.log('  demo-format --placements');
    return 2;
  }

  const screenplay = parseScreenplay(readFileSync(screenplayPath, 'utf8'));
  const takePath = flag(argv, '--take');
  const planPath = flag(argv, '--narration-plan');
  const captionReviewPath = flag(argv, '--caption-review');
  const result = checkAll(screenplay, {
    take: takePath ? loadTake(takePath, argv) : null,
    render: probeRender(flag(argv, '--video')),
    wpm: Number(flag(argv, '--wpm', WPM.default)),
    narrationPlan: planPath ? JSON.parse(readFileSync(planPath, 'utf8')) : null,
    captionReview: captionReviewPath ? parseCaptionReview(readFileSync(captionReviewPath, 'utf8')) : null,
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
