// The screenplay/take contract, tested where it now lives.
//
// These assertions came from `demo-capture.mjs --self-test`. #226 moved the
// parsers into `src/creative/lib/screenplay.mjs`, because three shipped
// commands read them and the fourth — the live-recording CLI — is parked under
// `incubator/`. The parsers are still shipped code, inlined into every creative
// entry point, so their checks had to keep running somewhere `npm test`
// reaches. The driver checks stayed with the driver and are dormant with it.
import assert from 'node:assert/strict';
import {
  SCREENPLAY_SCHEMA,
  TAKE_SCHEMA,
  QUIET_CAP,
  parseRegion,
  parseRect,
  parseScreenplay,
  parseTargets,
  missingTargets,
  estimateDuration,
  parseTake,
} from '../src/creative/lib/screenplay.mjs';

let checks = 0;
const ok = (condition, label) => {
  checks += 1;
  assert.ok(condition, label);
};
// The message fragment is asserted, not just the throw: a parser that refused
// everything for one reason would satisfy a bare `assert.throws` and tell an
// author nothing about what was actually wrong with their screenplay.
const rejects = (fn, fragment, label) => {
  checks += 1;
  assert.throws(fn, (error) => {
    assert.ok(String(error.message).includes(fragment),
      `${label}: expected a refusal mentioning "${fragment}", got: ${error.message}`);
    return true;
  }, label);
};

const VALID = JSON.stringify({
  schema: SCREENPLAY_SCHEMA,
  title: 'a demo',
  capture: { region: '0,0 1256x784', fps: 30 },
  steps: [
    { id: 'st-1', action: 'hold', seconds: 2, note: 'establish' },
    { id: 'st-2', action: 'click', target: 'issues-tab', settle: 4, emphasis: { anchor: 'center', zoom: 2 } },
    { id: 'st-3', action: 'type', target: 'title-input', text: 'hello', clear: true, emphasis: { anchor: 'leading', zoom: 2.2 } },
  ],
});

const plan = parseScreenplay(VALID);
ok(plan.steps.length === 3, 'a valid screenplay parses');
ok(plan.capture.region.w === 1256 && plan.capture.region.h === 784, 'a region string resolves to whole pixels');
ok(plan.steps[2].cps === 18, 'typing gets a default pace rather than instant text');
ok(plan.steps[1].emphasis.lead > 0, 'emphasis leads the action, so the zoom has arrived before the thing happens');

rejects(() => parseScreenplay('{'), 'not valid JSON', 'malformed JSON is refused');
rejects(() => parseScreenplay(JSON.stringify({ schema: 'other', title: 'x' })), 'must declare', 'a foreign schema is refused');
rejects(() => parseRegion('0,0 1255x784'), 'even in both dimensions', 'an odd capture dimension is refused before the take, not after');
rejects(() => parseRegion('nonsense'), 'must look like', 'an unparseable region is refused');

// The reason this contract exists: direction must not carry measurements.
rejects(() => parseScreenplay(JSON.stringify({
  schema: SCREENPLAY_SCHEMA, title: 'x', capture: { region: '0,0 100x100' },
  steps: [{ id: 's', action: 'click', target: 't', start: 4.2 }],
})), 'carries intent, not measurements', 'a screenplay that declares a source second is refused');
rejects(() => parseScreenplay(JSON.stringify({
  schema: SCREENPLAY_SCHEMA, title: 'x', capture: { region: '0,0 100x100' },
  steps: [{ id: 's', action: 'click', target: 't', x: 0.4 }],
})), 'carries intent, not measurements', 'a screenplay that declares a frame coordinate is refused');

rejects(() => parseScreenplay(JSON.stringify({
  schema: SCREENPLAY_SCHEMA, title: 'x', capture: { region: '0,0 100x100' },
  steps: [{ id: 'a', action: 'hold', seconds: 1 }, { id: 'a', action: 'hold', seconds: 1 }],
})), 'is used twice', 'a duplicate step id is refused, since a take is keyed by it');
rejects(() => parseScreenplay(JSON.stringify({
  schema: SCREENPLAY_SCHEMA, title: 'x', capture: { region: '0,0 100x100' },
  steps: [{ id: 'a', action: 'hold', seconds: 1, emphasis: { zoom: 2 } }],
})), 'nothing to anchor to', 'emphasis on a targetless hold is refused rather than silently centred');

const targets = parseTargets(JSON.stringify({ 'issues-tab': [80, 136, 150, 162], 'title-input': [78, 254, 940, 282] }));
ok(targets.size === 2, 'a targets file resolves rectangles');
ok(missingTargets(plan, targets).length === 0, 'a screenplay whose targets all resolve is ready to record');
const short = parseTargets(JSON.stringify({ 'issues-tab': [80, 136, 150, 162] }));
ok(missingTargets(plan, short)[0] === 'title-input', 'an unresolved target is named before the take, not after');
rejects(() => parseRect([10, 10, 5, 20], 'r'), 'x1 > x0', 'an inside-out rectangle is refused');

const seconds = estimateDuration(plan);
ok(seconds > 14 && seconds < 20,
  `a take duration is estimated from the screenplay, quiet wait included (${seconds.toFixed(1)}s)`);

const typeOnly = parseScreenplay(JSON.stringify({
  schema: SCREENPLAY_SCHEMA, title: 't', capture: { region: '0,0 100x100' },
  steps: [{ id: 'a', action: 'type', target: 'f', text: 'abcdefgh', cps: 16, settle: 0 }],
}));
ok(estimateDuration(typeOnly) > QUIET_CAP,
  'the estimated duration budgets the measured quiet wait, so the recorder cannot stop before the last step');

ok(parseTake(JSON.stringify({
  schema: TAKE_SCHEMA, take_id: 't', recording: 'r.mp4', capture: { region: [0, 0, 10, 10] },
  steps: [{ id: 'a', start: 1, end: 2, status: 'unsettled' }],
})).steps[0].status === 'unsettled', 'an unsettled status survives the manifest round trip');

const take = parseTake(JSON.stringify({
  schema: TAKE_SCHEMA, take_id: 't1', recording: 'raw.mp4',
  capture: { region: [0, 0, 1256, 784], fps: 30 },
  steps: [{ id: 'st-2', start: 4.02, end: 4.33, rect: [80, 136, 150, 162] }],
  pointer: { samples: [{ t: 1, x: 628, y: 392, visible: true }, { t: 2, x: 0, y: 0, visible: false }], clicks: [1.5] },
}));
ok(take.pointer.track[0].x === 0.5 && take.pointer.track[0].y === 0.5,
  'pointer samples are normalised against the capture region, so a plan survives a change of render size');
ok(take.pointer.track[1].visible === false, 'a hidden pointer sample stays hidden through the manifest');
ok(parseTake(JSON.stringify({
  schema: TAKE_SCHEMA, take_id: 't1', recording: 'raw.mp4',
  capture: { region: [0, 0, 100, 100] }, steps: [{ id: 'a', start: 1, end: 2 }],
})).pointer === null, 'a take without pointer telemetry yields no track, rather than one inferred from the rects');
ok(take.steps[0].start === 4.02, 'a take manifest carries measured seconds');
ok(take.steps[0].rect.x0 === 80, 'a take manifest carries the rectangle actually acted on');
rejects(() => parseTake(JSON.stringify({
  schema: TAKE_SCHEMA, take_id: 't', recording: 'r.mp4',
  capture: { region: [0, 0, 10, 10] }, steps: [{ id: 'a', start: 5, end: 2 }],
})), 'ends before it starts', 'a take step that ends before it starts is refused');

// Counted, because "every assertion passed" is also true of no assertions: this
// file exists to carry checks across a module move, and a silent loss of half
// of them is exactly the failure it has to be able to report.
assert.equal(checks, 25, 'the screenplay contract is covered by every check that moved out of demo-capture');
console.log(`creative screenplay/take contract assertions passed (${checks} checks)`);
