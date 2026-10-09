import assert from 'node:assert/strict';
import test from 'node:test';
import {
  QUIET_CAP,
  SCREENPLAY_SCHEMA,
  TAKE_SCHEMA,
  estimateDuration,
  missingTargets,
  parseRect,
  parseScreenplay,
  parseTake,
  parseTargets,
} from '../src/creative/lib/screenplay.mjs';

const screenplay = {
  schema: SCREENPLAY_SCHEMA,
  title: 'Behavioral demo',
  capture: {region: '0,0 1256x784', fps: 30},
  steps: [
    {id: 'hold', action: 'hold', seconds: 2},
    {id: 'click', action: 'click', target: 'issues-tab', settle: 4},
    {id: 'type', action: 'type', target: 'title-input', text: 'hello', clear: true},
  ],
};

test('valid screenplay defaults remain executable', () => {
  const parsed = parseScreenplay(JSON.stringify(screenplay));
  assert.equal(parsed.steps.length, 3);
  assert.equal(parsed.steps[2].cps, 18);
  assert.ok(estimateDuration(parsed) > QUIET_CAP);
});

test('screenplay rejects source measurements', () => {
  assert.throws(() => parseScreenplay(JSON.stringify({
    ...screenplay,
    steps: [{id: 'click', action: 'click', target: 'issues-tab', start: 4.2}],
  })), /intent, not measurements/);
});

test('screenplay rejects duplicate step identities', () => {
  assert.throws(() => parseScreenplay(JSON.stringify({
    ...screenplay,
    steps: [
      {id: 'same', action: 'hold', seconds: 1},
      {id: 'same', action: 'hold', seconds: 1},
    ],
  })), /used twice/);
});

test('target validation names the unresolved target', () => {
  const parsed = parseScreenplay(JSON.stringify(screenplay));
  const targets = parseTargets(JSON.stringify({
    'issues-tab': [80, 136, 150, 162],
  }));
  assert.deepEqual(missingTargets(parsed, targets), ['title-input']);
  assert.throws(() => parseRect([10, 10, 5, 20], 'target'), /x1 > x0/);
});

test('take parsing preserves measured timing and normalized pointer telemetry', () => {
  const take = parseTake(JSON.stringify({
    schema: TAKE_SCHEMA,
    take_id: 'take-1',
    recording: 'raw.mp4',
    capture: {region: [0, 0, 1256, 784], fps: 30},
    steps: [{id: 'click', start: 4.02, end: 4.33, rect: [80, 136, 150, 162]}],
    pointer: {
      samples: [
        {t: 1, x: 628, y: 392, visible: true},
        {t: 2, x: 0, y: 0, visible: false},
      ],
      clicks: [1.5],
    },
  }));
  assert.equal(take.steps[0].start, 4.02);
  assert.equal(take.steps[0].rect.x0, 80);
  assert.deepEqual(
    {x: take.pointer.track[0].x, y: take.pointer.track[0].y},
    {x: 0.5, y: 0.5},
  );
  assert.equal(take.pointer.track[1].visible, false);
});

test('take parsing rejects reversed timing', () => {
  assert.throws(() => parseTake(JSON.stringify({
    schema: TAKE_SCHEMA,
    take_id: 'take-1',
    recording: 'raw.mp4',
    capture: {region: [0, 0, 10, 10]},
    steps: [{id: 'click', start: 5, end: 2}],
  })), /ends before it starts/);
});
