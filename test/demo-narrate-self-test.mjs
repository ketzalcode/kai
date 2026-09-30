// Placing measured speech against a measured recording — `src/creative/demo-narrate.mjs`.
//
// Moved out of the command itself (#225). The checks are unchanged.
//
// `round` is re-declared here rather than exported from the module: it is a
// formatting helper the assertions use to express an expected value, not part
// of the behaviour under test. `MIN_GAP` and `TAKE_SCHEMA` are exported,
// because both are contract facts a caller can legitimately read.

import { parseScreenplay, parseTake } from '../src/creative/lib/screenplay.mjs';
import {
  MIN_GAP, TAKE_SCHEMA,
  textHash, parseNarrationTake, place, buildMixArgs,
} from '../src/creative/demo-narrate.mjs';

const round = (n) => Math.round(n * 1000) / 1000;

function selfTest() {
  let pass = 0;
  let failed = 0;
  const ok = (cond, label) => {
    if (cond) { pass += 1; console.log(`  ok ${label}`); } else { failed += 1; console.log(`  FAIL ${label}`); }
  };
  const rejects = (fn, needle, label) => {
    try { fn(); failed += 1; console.log(`  FAIL ${label} (nothing was refused)`); } catch (e) {
      if (String(e.message).includes(needle)) { pass += 1; console.log(`  ok ${label}`); } else { failed += 1; console.log(`  FAIL ${label}: ${e.message}`); }
    }
  };

  const play = (narration) => JSON.stringify({
    schema: 'kai.demo-screenplay/v1',
    title: 't',
    capture: { region: '0,0 100x100' },
    steps: [
      { id: 'open', action: 'click', target: 'a' },
      { id: 'fill', action: 'type', text: 'hello', target: 'a' },
      { id: 'save', action: 'click', target: 'a' },
      { id: 'result', action: 'hold', seconds: 4 },
    ],
    narration,
  });

  const takeJson = (over = {}) => JSON.stringify({
    schema: 'kai.demo-take/v1',
    take_id: 'k',
    recording: 'r.mp4',
    capture: { region: '0,0 100x100' },
    steps: [
      { id: 'open', start: 0, end: 2 },
      { id: 'fill', start: 2, end: 10 },
      { id: 'save', start: 10, end: 14 },
      { id: 'result', start: 14, end: 22 },
      ...(over.extra ?? []),
    ].map((s) => ({ ...s, ...(over.status?.[s.id] ? { status: over.status[s.id] } : {}) })),
  });

  const narrTake = (clips) => JSON.stringify({ schema: TAKE_SCHEMA, provider: 'external', clips });

  // --- the authoring rule: a beat may not carry numbers nobody can know yet
  for (const forbidden of ['start', 'end', 'seconds', 'duration', 'offset']) {
    rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open' }, [forbidden]: 1 }])),
      'carries intent, not measurements',
      `a beat declaring "${forbidden}" is refused, because neither speech length nor UI readiness is knowable while writing`);
  }
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x' }])), 'visual_span is required', 'a beat with no visual span is refused: nothing could decide whether it fits');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'nope' } }])), 'not a step in this screenplay', 'a beat spanning a step that does not exist is refused');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'save', through_step: 'open' } }])), 'runs backwards', 'a span that runs backwards is refused');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open' }, start_after: 'save' } ])), 'outside the beat', 'a beat cannot wait for a step it does not cover');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open', through_step: 'save' }, start_after: 'save' }])), 'the instant it must be finished', 'waiting for the last step of your own span is refused: no clip is short enough to fit, so it is an authoring error rather than an overrun');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open' }, start_after: 'open' }])), 'no time in which to speak', 'a one-step beat that also waits for that step to finish is refused while writing, not as a mystifying overrun later');
  rejects(() => parseScreenplay(play([
    { id: 'n1', text: 'x', visual_span: { from_step: 'fill' } },
    { id: 'n2', text: 'y', visual_span: { from_step: 'open' } },
  ])), 'in the order it is heard', 'beats authored out of order are refused rather than silently resequenced');
  rejects(() => parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'open' } }, { id: 'n1', text: 'y', visual_span: { from_step: 'fill' } }])), 'used twice', 'a duplicated beat id is refused: a narration take is keyed by it');

  const sp = parseScreenplay(play([
    { id: 'n1', text: 'First we open the form.', visual_span: { from_step: 'open', through_step: 'fill' } },
    { id: 'n2', text: 'Then we save it.', visual_span: { from_step: 'save', through_step: 'result' }, start_after: 'save' },
  ]));
  ok(sp.narration.length === 2, 'a screenplay with no narration is still valid, and one with beats carries them');
  ok(parseScreenplay(play(undefined)).narration.length === 0, 'narration is optional: a silent demo is a legitimate demo');
  ok(parseScreenplay(play([{ id: 'n1', text: 'x', visual_span: { from_step: 'fill' } }])).narration[0].visual_span.through_step === 'fill',
    'through_step defaults to from_step, so a beat covering one state need not say it twice');

  // --- placement against measured states
  const take = parseTake(takeJson());
  const good = place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'n1.mp3', durationSec: 4 },
    { beat: 'n2', path: 'n2.mp3', durationSec: 2 },
  ])));
  ok(good.ok && good.beats.length === 2, 'two beats that fit their measured spans are placed');
  ok(good.beats[0].start === 0, 'a beat with no start_after begins when its first state begins');
  ok(good.beats[1].start === 14, 'a beat gated on a step begins when that step is *over*, so it never claims a result before it is visible');

  const shifted = place(parseScreenplay(play([
    { id: 'n1', text: 'a', visual_span: { from_step: 'open', through_step: 'result' } },
    { id: 'n2', text: 'b', visual_span: { from_step: 'open', through_step: 'result' } },
  ])), take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a.mp3', durationSec: 3 },
    { beat: 'n2', path: 'b.mp3', durationSec: 3 },
  ])));
  ok(shifted.ok && shifted.beats[1].start === round(3 + MIN_GAP), 'a second beat waits for the first to finish speaking rather than talking over it');
  ok(shifted.beats[1].deferred > 0, 'how far a line drifted from its earliest honest position is reported, not hidden');

  // --- the refusals
  const long = place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'n1.mp3', durationSec: 30 },
    { beat: 'n2', path: 'n2.mp3', durationSec: 2 },
  ])));
  ok(!long.ok && long.rejections[0].reason === 'overruns-span', 'a line longer than the states it describes is rejected, not fitted by slowing the video');
  ok(/cut about \d+ words/.test(long.rejections[0].detail), 'the rejection says how many words to cut, because "too long" is not something an author can act on');
  ok(place(parseScreenplay(play([{ id: 'n1', text: 'a', visual_span: { from_step: 'open', through_step: 'fill' } }])), take, parseNarrationTake(narrTake([{ beat: 'n1', path: 'a', durationSec: 15 }]))).rejections[0].detail.includes('extend through_step to "result"'), 'when a later state does stay on screen long enough, the rejection names the smallest span that would work instead of only telling the author to cut');
  ok(long.rejections[0].detail.includes('will not slow the recording'), 'the rejection states the thing it refuses to do, so nobody goes looking for the option');

  ok(place(sp, parseTake(takeJson({ status: { open: 'failed' } })), parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a', durationSec: 1 }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).rejections.some((r) => r.reason === 'step-failed'), 'narrating over a step the driver recorded as failed is refused');
  ok(place(sp, parseTake(takeJson({ status: { open: 'unsettled' } })), parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a', durationSec: 1 }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).rejections.some((r) => r.reason === 'step-unsettled'), 'a screen that never settled cannot be said to have reached the described state');
  ok(place(sp, take, parseNarrationTake(narrTake([{ beat: 'n1', path: 'a', durationSec: 1 }]))).rejections.some((r) => r.reason === 'no-clip'),
    'a partial synthesis is rejected rather than rendered with a silent gap');
  ok(place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', status: 'failed', reason: 'auth' }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).rejections.some((r) => r.reason === 'clip-failed'), 'a failed clip is not treated as silence');
  ok(place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a', durationSec: 1, text_sha256: 'deadbeefdeadbeef' }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).rejections.some((r) => r.reason === 'stale-text'), 'a clip synthesised from words the screenplay no longer carries is rejected, because it would play the old line');
  ok(place(sp, parseTake(JSON.stringify({
    schema: 'kai.demo-take/v1', take_id: 'k', recording: 'r.mp4', capture: { region: '0,0 100x100' },
    steps: [{ id: 'other', start: 0, end: 5 }],
  })), parseNarrationTake(narrTake([{ beat: 'n1', path: 'a', durationSec: 1 }]))).rejections.some((r) => r.reason === 'unrecorded-step'),
    'a screenplay placed against a take from a different demo is rejected');
  ok(place(sp, take, parseNarrationTake(narrTake([
    { beat: 'n1', path: 'a', durationSec: 1, text_sha256: textHash('First we open the form.') }, { beat: 'n2', path: 'b', durationSec: 1 },
  ]))).ok, 'a hash matching the current words places normally');

  rejects(() => parseNarrationTake(JSON.stringify({ schema: 'other', clips: [] })), 'must declare', 'a foreign narration take schema is refused');
  rejects(() => parseNarrationTake(narrTake([{ beat: 'n1', path: 'a', durationSec: 1 }, { beat: 'n1', path: 'b', durationSec: 1 }])), 'spoken once', 'two clips for one beat are refused');

  // --- mixing
  const args = buildMixArgs(good, { video: 'in.mp4', out: 'out.mp4' });
  ok(args.includes('-c:v') && args[args.indexOf('-c:v') + 1] === 'copy', 'the video is copied, so re-narrating in another language cannot change a frame of what was recorded');
  ok(args.join(' ').includes('adelay=14000:all=1'), 'a clip is delayed to its measured position, in milliseconds, on every channel');
  ok(args.join(' ').includes('normalize=0'), 'amix does not normalise, which would divide every clip level by the number of beats');
  ok(!args.includes('-shortest'), 'the output is not truncated to the shorter stream: placement already guarantees the narration fits inside measured steps, so -shortest could only ever cut the end off the demo');
  rejects(() => buildMixArgs({ ...good, ok: false }, { video: 'a', out: 'b' }), 'was rejected', 'a rejected plan cannot be mixed');
  rejects(() => buildMixArgs(good, { video: '-evil', out: 'b' }), 'read as an option', 'a filename that would be read as an option is refused');
  console.log(`\ndemo-narrate self-test: ${pass} checks passed${failed ? `, ${failed} FAILED` : ''}`);
  return failed === 0;
}

process.exit(selfTest() ? 0 : 1);
