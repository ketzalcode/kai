// The focus-plan compiler and renderer — `src/creative/demo-zoom.mjs`.
//
// Moved out of the command itself (#225). The checks are unchanged.
//
// Only the arithmetic is provable without a machine that has ffmpeg: the curve,
// the emitted filter expression, the argv, and the compile step that joins a
// declared screenplay to a measured take. What the renderer actually produces
// is still only knowable from a render, and this suite never claims otherwise.

import { parseScreenplay, parseTake } from '../src/creative/lib/screenplay.mjs';
import {
  parsePlan, weightAt, zoomAt, centerAt, buildFilter, buildArgs, quoteArg, printable,
  effectiveCenter, explain, overrunning, compile, gridArgs, reviewSampleTimes, reviewLegend,
} from '../src/creative/demo-zoom.mjs';

let checks = 0;
function ok(condition, label) {
  checks += 1;
  if (!condition) {
    console.error(`x ${label}`);
    process.exitCode = 1;
    throw new Error(`self-test failed: ${label}`);
  }
  console.log(`  ok ${label}`);
}

function rejects(text, fragment, label) {
  let message = '';
  try {
    parsePlan(text);
  } catch (error) {
    message = error.message;
  }
  ok(message.includes(fragment), `${label} (said: ${message || 'nothing, which is the bug'})`);
}

const VALID = JSON.stringify({
  source: 'a.mp4',
  output: 'b.mp4',
  focus: [{ start: 2, end: 6, x: 0.7, y: 0.3, zoom: 2.5, ease: 0.5 }],
});

function selfTest() {
  console.log('demo-zoom self-test');

  const plan = parsePlan(VALID);
  ok(plan.focus.length === 1, 'a valid plan parses');
  ok(plan.size.text === '1280x720' && plan.fps === 30, 'size and rate have defaults');

  rejects('{ not json', 'not valid JSON', 'a malformed plan names the parse error');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'a.mp4', focus: [] }),
    'must differ', 'rendering over the source is refused');
  rejects(JSON.stringify({ source: '-i evil', output: 'b.mp4', focus: [] }),
    'read as an ffmpeg option', 'a path that would smuggle an option is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4' }),
    'focus', 'a missing focus list is refused rather than assumed');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [{ start: 5, end: 2, x: 0.5, y: 0.5 }] }),
    'greater than start', 'a segment that ends before it starts is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [{ start: 0, end: 2, x: 1.4, y: 0.5 }] }),
    'within 0..1', 'a focus point outside the frame is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [{ start: 0, end: 2, x: 0.5, y: 0.5, zoom: 0.5 }] }),
    'may not be below 1', 'a zoom that shrinks the frame is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [{ start: 0, end: 1, x: 0.5, y: 0.5, ease: 0.9 }] }),
    'never reach', 'an ease too long for its segment is refused, with the reason');
  rejects(JSON.stringify({
    source: 'a.mp4', output: 'b.mp4',
    focus: [{ start: 0, end: 5, x: 0.5, y: 0.5 }, { start: 3, end: 8, x: 0.5, y: 0.5 }],
  }), 'two places at once', 'overlapping segments are refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', size: '1281x721', focus: [] }),
    'even dimensions', 'an odd output size is refused before the encoder rejects it');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', fps: 0, focus: [] }),
    'fps must be', 'a zero frame rate is refused');

  // The curve itself.
  const s = plan.focus[0];
  ok(weightAt(s, 1.99) === 0, 'the camera is untouched before a segment begins');
  ok(weightAt(s, 6.01) === 0, 'the camera is released after a segment ends');
  ok(weightAt(s, 2) === 0 && weightAt(s, 6) === 0, 'weight is zero exactly at both edges, so there is no jump');
  ok(Math.abs(weightAt(s, 4) - 1) < 1e-9, 'weight reaches a full 1 in the middle');
  ok(Math.abs(zoomAt(plan, 4) - 2.5) < 1e-9, 'zoom reaches the requested factor');
  ok(Math.abs(zoomAt(plan, 0) - 1) < 1e-9, 'zoom rests at 1 outside every segment');
  const monotonic = [2.1, 2.2, 2.3, 2.4, 2.5].map((t) => zoomAt(plan, t));
  ok(monotonic.every((v, i) => i === 0 || v > monotonic[i - 1]), 'the ramp is monotonic, so the zoom never stutters');
  const c = centerAt(plan, 4);
  ok(Math.abs(c.x - 0.7) < 1e-9 && Math.abs(c.y - 0.3) < 1e-9, 'the frame centres on the focus point at full zoom');
  const c0 = centerAt(plan, 0);
  ok(c0.x === 0.5 && c0.y === 0.5, 'the frame is centred when nothing is in focus');

  // Continuity: no step larger than a small epsilon anywhere on the timeline.
  let biggest = 0;
  for (let t = 0; t < 8; t += 0.01) {
    biggest = Math.max(biggest, Math.abs(zoomAt(plan, t + 0.01) - zoomAt(plan, t)));
  }
  ok(biggest < 0.05, `the zoom curve is continuous everywhere (largest step ${biggest.toFixed(4)})`);

  // The emitted expression.
  const filter = buildFilter(plan);
  ok(filter.startsWith('fps=30,'), 'the rate is forced before the zoom, so the filter clock matches real time');
  ok(filter.includes('force_original_aspect_ratio=decrease') && filter.includes('pad='),
    'the frame is fitted to the declared size, so a coordinate means the same thing on any source');
  ok(filter.includes('setsar=1'), 'pixels are square before the crop, so a non-square source cannot skew the zoom');
  ok(filter.includes('scale=2560:1440'), 'the zoom reads from a frame twice the output size, halving the smallest crop step');
  ok(filter.includes('s=1280x720'), 'the output size is still the declared one');
  ok(filter.includes('zoompan='), 'the zoom is a single pass, so there are no seams to resynchronise');
  ok(!filter.includes('/2)*2'), 'the crop origin is not coarsened to even pixels, which would enlarge each step rather than smooth it');
  ok(filter.includes('d=1'), 'one output frame per input frame');
  ok(filter.includes('s=1280x720'), 'the output size is pinned in the filter');
  ok(filter.includes('clip('), 'the crop origin is clamped, so a focus point near an edge cannot show padding');
  ok(!/\bif\(/.test(filter), 'the expression is a sum of weights rather than nested conditionals');
  ok(filter.includes('on/30'), 'time is derived from the frame index, the portable clock');

  // Touching segments. The end of an interval is exclusive precisely so two
  // adjacent hard cuts cannot both be active and add their zoom together.
  const touching = parsePlan(JSON.stringify({
    source: 'a.mp4', output: 'b.mp4',
    focus: [
      { start: 0, end: 2, x: 0.5, y: 0.5, zoom: 2, ease: 0 },
      { start: 2, end: 4, x: 0.5, y: 0.5, zoom: 3, ease: 0 },
    ],
  }));
  ok(Math.abs(zoomAt(touching, 2) - 3) < 1e-9,
    'where two hard-cut segments meet, only the second is active (a 2x and a 3x do not add to 4x)');
  ok(Math.abs(zoomAt(touching, 1) - 2) < 1e-9, 'a hard cut holds its own factor for its own span');
  ok(Math.abs(zoomAt(touching, 4) - 1) < 1e-9, 'the last segment releases at its end rather than one frame late');
  ok(buildFilter(touching).includes('gte(') && buildFilter(touching).includes('lt('),
    'the interval is half-open in the emitted expression too, not only in the model');

  // A well-formed plan can still be too large to hand to a process.
  const huge = {
    source: 'a.mp4', output: 'b.mp4',
    focus: Array.from({ length: 120 }, (_, i) => ({ start: i * 2, end: i * 2 + 1.5, x: 0.4, y: 0.6, zoom: 2, ease: 0.3 })),
  };
  let tooLong = '';
  try { buildFilter(parsePlan(JSON.stringify(huge))); } catch (error) { tooLong = error.message; }
  ok(tooLong.includes('command line'),
    'a plan whose filter would exceed what a command line can carry is refused with the reason, not left to fail inside spawn');

  // Clamping is disclosed rather than pretended away.
  ok(Math.abs(effectiveCenter(0.95, 2) - 0.75) < 1e-9, 'a point near an edge lands where the crop can actually reach');
  ok(Math.abs(effectiveCenter(0.5, 2) - 0.5) < 1e-9, 'a point with room to spare lands exactly where it was asked to');
  const edge = parsePlan(JSON.stringify({
    source: 'a.mp4', output: 'b.mp4', focus: [{ start: 0, end: 3, x: 0.95, y: 0.95, zoom: 2, ease: 0.5 }],
  }));
  ok(explain(edge).includes('lands on') && explain(edge).includes('0.75'),
    'the explanation shows where an edge shot really lands, instead of echoing the request back');
  ok(explain(edge).includes('too close to an edge'), 'the explanation says plainly that a shot was clamped');
  ok(explain(edge).includes('duration unknown'), 'an unknown source duration is declared rather than assumed fine');
  ok(explain(edge, 1).includes('past the end'), 'a segment running past the end of the source is called out');
  ok(!explain(edge, 10).includes('past the end'), 'a segment inside the source is not flagged');
  ok(overrunning(edge, null).length === 0, 'without a duration nothing is claimed about overrun either way');

  const empty = parsePlan(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', focus: [] }));
  ok(!buildFilter(empty).includes('zoompan'), 'a plan with no focus segments does not pretend to zoom');
  ok(buildFilter(empty).includes('fps='), 'a plan with no focus segments still normalises rate and size');

  const g = gridArgs('in.mp4', 3.5, 'out.png');
  ok(g[g.indexOf('-ss') + 1] === '3.5', 'the grid seeks to the requested time');
  ok(g.some((a) => a.includes('iw/10')), 'the grid rules the frame into tenths, matching the plan coordinates');
  const gridFilter = g[g.indexOf('-vf') + 1];
  ok(gridFilter.includes('force_original_aspect_ratio=decrease') && gridFilter.includes('pad='),
    'the grid is drawn on the same fitted frame the render produces, so measured coordinates transfer');
  ok(gridArgs('in.mp4', 0, 'out.png', '1920x1080')[g.indexOf('-vf') + 1].includes('1920:1080'),
    'the grid follows the declared output size rather than assuming one');
  let gridRefused = '';
  try { gridArgs('in.mp4', -1, 'out.png'); } catch (error) { gridRefused = error.message; }
  ok(gridRefused.includes('at or after zero'), 'a negative grid time is refused');

  const args = buildArgs(plan);
  ok(Array.isArray(args) && args.every((a) => typeof a === 'string'), 'ffmpeg is given an argv array, never a shell string');
  ok(args[args.length - 1] === 'b.mp4', 'the output path is the final argument');
  ok(args.includes('0:a?'), 'audio is carried through when present and not demanded when absent');
  ok(args.includes('aac'), 'audio is re-encoded rather than copied, which would fail on a container the codec cannot enter');
  const silent = buildArgs(plan, false);
  ok(!silent.includes('aac') && !silent.includes('-b:a'),
    'a source with no audio stream is given no audio encoder options, which would otherwise print an unused-AVOption warning');
  ok(silent.includes('0:a?'), 'a silent source still tolerates audio appearing, rather than refusing it');

  // --- compile: the join between declared intent and measured fact ----------
  const screenplay = parseScreenplay(JSON.stringify({
    schema: 'kai.demo-screenplay/v1',
    title: 'issue demo',
    capture: { region: '0,0 1256x784', fps: 30 },
    steps: [
      { id: 'st-1', action: 'click', target: 'new-issue', emphasis: { anchor: 'center', zoom: 2, lead: 1, hold: 0.5, ease: 0.4, label: 'the button' } },
      { id: 'st-2', action: 'type', target: 'title-input', text: 'hello', emphasis: { anchor: 'leading', zoom: 2.2, lead: 0.8, hold: 1, ease: 0.4, label: 'the title being typed' } },
    ],
  }));
  const take = parseTake(JSON.stringify({
    schema: 'kai.demo-take/v1', take_id: 'T1', recording: 'raw.mp4',
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [
      { id: 'st-1', start: 6.4, end: 6.7, rect: [1090, 190, 1230, 222] },
      { id: 'st-2', start: 12.9, end: 15.2, rect: [78, 254, 940, 282] },
    ],
  }));
  const compiled = compile(screenplay, take, { output: 'focused.mp4' });
  ok(compiled.plan.focus.length === 2, 'a screenplay and a take compile into one segment per emphasised step');
  ok(compiled.plan.source === 'raw.mp4', 'the compiled plan renders the recording the take actually produced');
  ok(compiled.plan.compiled_from.take_id === 'T1', 'a compiled plan is stamped with the take it came from, so it cannot silently render against another recording');
  ok(compiled.plan.fps === 30 && compiled.plan.size === '1256x784', 'the output frame and rate come from the take, not from a guess');

  const [button, typing] = compiled.plan.focus;
  ok(Math.abs(button.start - 5.4) < 0.001 && Math.abs(button.end - 7.2) < 0.001,
    'a segment starts a declared lead before the measured action and holds after it');

  // The failure that motivated all of this: centring the title field put the
  // text being typed outside the crop. `leading` has to frame the near edge.
  const half = 1 / (2 * 2.2);
  const textStart = 78 / 1256;
  ok(typing.x - half <= textStart, `the leading anchor keeps the left edge of the field in frame (visible from ${(typing.x - half).toFixed(3)}, field starts ${textStart.toFixed(3)})`);
  ok(typing.x < (78 + 940) / 2 / 1256, 'the leading anchor sits left of the field centre, which is where the text actually is');
  ok(Math.abs(button.x - (1090 + 1230) / 2 / 1256) < 0.001, 'a click is centred on the rectangle it clicked');

  // The other failure: a hand-typed segment framed the page after it navigated.
  ok(button.end < typing.start, 'compiled segments never overlap, so the camera is never asked to be in two places');
  parsePlan(JSON.stringify(compiled.plan));
  ok(true, 'a compiled plan passes the same validation as a hand-written one');

  const collide = compile(screenplay, parseTake(JSON.stringify({
    schema: 'kai.demo-take/v1', take_id: 'T2', recording: 'raw.mp4',
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [
      { id: 'st-1', start: 6.4, end: 6.7, rect: [1090, 190, 1230, 222] },
      { id: 'st-2', start: 7.0, end: 9.0, rect: [78, 254, 940, 282] },
    ],
  })));
  ok(collide.notes.some((n) => n.includes('overlapped')), 'overlapping lead-in and hold are split rather than refused, and the split is reported');
  parsePlan(JSON.stringify(collide.plan));
  ok(true, 'the split result is still renderable');

  const failed = compile(screenplay, parseTake(JSON.stringify({
    schema: 'kai.demo-take/v1', take_id: 'T3', recording: 'raw.mp4',
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [{ id: 'st-1', start: 6.4, end: 6.7, rect: [1090, 190, 1230, 222], status: 'failed' }],
  })));
  ok(failed.plan.focus.length === 0 && failed.notes.some((n) => n.includes('failed')),
    'a step the take recorded as failed is not zoomed into, because magnifying a mistake is worse than not zooming');

  const unrecorded = compile(screenplay, parseTake(JSON.stringify({
    schema: 'kai.demo-take/v1', take_id: 'T4', recording: 'raw.mp4',
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [{ id: 'st-1', start: 1, end: 2, rect: [10, 10, 20, 20] }],
  })));
  ok(unrecorded.notes.some((n) => n.includes('st-2')), 'an emphasised step the take never recorded is named, not silently dropped');

  // --- review ---------------------------------------------------------------
  const samples = reviewSampleTimes({ start: 4, end: 8 });
  ok(samples.length === 4, 'a review row samples four frames');
  ok(samples[0].at < 4 && samples[0].of === 'source', 'the first cell shows the source just before the camera moves');
  ok(samples[1].at === 6 && samples[2].at === 6,
    'the source and the render are sampled at the same instant, so the pair shows what the zoom did to it');
  ok(reviewSampleTimes({ start: 0, end: 1 })[0].at === 0, 'a segment at the very start does not sample a negative time');
  ok(reviewLegend(plan).includes('not evidence'), 'the legend refuses to let a contact sheet stand in for grounding');

  const spaced = parsePlan(JSON.stringify({
    source: 'my clips/a b.mp4', output: 'out dir/c.mp4',
    focus: [{ start: 0, end: 3, x: 0.5, y: 0.5 }],
  }));  const printed = printable(spaced);
  ok(printed.includes('"my clips/a b.mp4"'), 'a path with a space survives --print as one argument');
  ok(/-vf "/.test(printed), 'the filter is quoted in --print, so a shell cannot eat its parentheses');
  ok(quoteArg('simple.mp4') === 'simple.mp4', 'an ordinary path is not needlessly quoted');

  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', size: '00x00', focus: [] }),
    'too small', 'a zero-sized output is refused rather than failing inside the encoder');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', fps: 0.0000001, focus: [] }),
    'fps must be', 'a frame rate that would round to zero is refused');
  rejects(JSON.stringify({ source: 'a.mp4', output: 'b.mp4', crf: 100, focus: [] }),
    '0..51', 'a quality setting libx264 would reject is refused here, where the message is readable');

  const many = parsePlan(JSON.stringify({
    source: 'a.mp4', output: 'b.mp4',
    focus: [
      { start: 0, end: 3, x: 0.2, y: 0.2, zoom: 2, ease: 0.3 },
      { start: 5, end: 9, x: 0.8, y: 0.9, zoom: 3, ease: 0.3 },
    ],
  }));
  ok(Math.abs(zoomAt(many, 4) - 1) < 1e-9, 'the camera fully releases between two segments');
  ok(Math.abs(zoomAt(many, 7) - 3) < 1e-9, 'the second segment reaches its own factor independently');
  ok(explain(many).includes('2 segment(s)'), 'the explanation counts what will actually be rendered');

  console.log(`demo-zoom self-test: ${checks} checks passed`);
  return true;
}

process.exit(selfTest() ? 0 : 1);
