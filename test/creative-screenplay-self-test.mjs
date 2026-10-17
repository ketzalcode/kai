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
import {
  TAKE_SCHEMA as NARRATION_TAKE_SCHEMA,
  parseNarrationTake,
  place,
} from '../src/creative/demo-narrate.mjs';

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

test('screenplay defaults to a recorded capture mode', () => {
  const parsed = parseScreenplay(JSON.stringify(screenplay));
  assert.equal(parsed.capture_mode, 'recorded');
  assert.equal(parsed.capture_mode_note, null);
});

test('a non-recorded capture mode requires a justifying note', () => {
  assert.throws(() => parseScreenplay(JSON.stringify({
    ...screenplay,
    capture_mode: 'replay',
  })), /capture_mode_note/);
});

test('an explained replay or illustration capture mode parses and keeps the note', () => {
  const replay = parseScreenplay(JSON.stringify({
    ...screenplay,
    capture_mode: 'replay',
    capture_mode_note: 'live recording unavailable; operator approved a labelled replay of the real response',
  }));
  assert.equal(replay.capture_mode, 'replay');
  assert.match(replay.capture_mode_note, /operator approved/);

  const illustration = parseScreenplay(JSON.stringify({
    ...screenplay,
    capture_mode: 'illustration',
    capture_mode_note: 'conceptual mockup, no live product behind it',
  }));
  assert.equal(illustration.capture_mode, 'illustration');
});

test('screenplay rejects an unknown capture mode', () => {
  assert.throws(() => parseScreenplay(JSON.stringify({
    ...screenplay,
    capture_mode: 'staged',
    capture_mode_note: 'whatever',
  })), /capture_mode must be one of/);
});

test('take parsing preserves measured timing and normalized pointer telemetry', () => {
  const take = parseTake(JSON.stringify({
    schema: TAKE_SCHEMA,
    take_id: 'take-1',
    recording: 'raw.mp4',
    capture: {region: [0, 0, 1256, 784], fps: 30},
    steps: [{id: 'click', start: 4.02, end: 4.33, status: 'ok', rect: [80, 136, 150, 162]}],
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

test('take parsing rejects missing and unknown step statuses', () => {
  const take = {
    schema: TAKE_SCHEMA,
    take_id: 'take-1',
    recording: 'raw.mp4',
    capture: {region: [0, 0, 10, 10]},
    steps: [{id: 'click', start: 1, end: 2}],
  };

  assert.throws(() => parseTake(JSON.stringify(take)), /status must be one of ok, failed, unsettled, got null/);
  take.steps[0].status = 'unknown';
  assert.throws(() => parseTake(JSON.stringify(take)), /status must be one of ok, failed, unsettled, got "unknown"/);
});

test('narration placement rejects failed or unsettled interior states', () => {
  const parsedScreenplay = parseScreenplay(JSON.stringify({
    schema: SCREENPLAY_SCHEMA,
    title: 'Interior state validation',
    capture: {region: '0,0 10x10'},
    steps: [
      {id: 'a', action: 'hold', seconds: 1},
      {id: 'b', action: 'hold', seconds: 1},
      {id: 'c', action: 'hold', seconds: 1},
    ],
    narration: [{
      id: 'n-1',
      text: 'The result is ready.',
      visual_span: {from_step: 'a', through_step: 'c'},
      start_after: 'b',
    }],
  }));
  const narrationTake = parseNarrationTake(JSON.stringify({
    schema: NARRATION_TAKE_SCHEMA,
    clips: [{beat: 'n-1', status: 'ok', path: 'n-1.wav', durationSec: 1}],
  }));

  for (const status of ['failed', 'unsettled']) {
    const take = parseTake(JSON.stringify({
      schema: TAKE_SCHEMA,
      take_id: `take-${status}`,
      recording: 'raw.mp4',
      capture: {region: [0, 0, 10, 10]},
      steps: [
        {id: 'a', start: 0, end: 3, status: 'ok'},
        {id: 'b', start: 3, end: 6, status},
        {id: 'c', start: 6, end: 10, status: 'ok'},
      ],
    }));
    const plan = place(parsedScreenplay, take, narrationTake);
    assert.equal(plan.ok, false);
    assert.equal(plan.rejections[0].reason, `step-${status}`);
    assert.match(plan.rejections[0].detail, /step "b"/);
  }
});

test('narration placement rejects unrecorded interior states', () => {
  const parsedScreenplay = parseScreenplay(JSON.stringify({
    schema: SCREENPLAY_SCHEMA,
    title: 'Missing interior state validation',
    capture: {region: '0,0 10x10'},
    steps: [
      {id: 'a', action: 'hold', seconds: 1},
      {id: 'b', action: 'hold', seconds: 1},
      {id: 'c', action: 'hold', seconds: 1},
    ],
    narration: [{
      id: 'n-1',
      text: 'The result is ready.',
      visual_span: {from_step: 'a', through_step: 'c'},
    }],
  }));
  const take = parseTake(JSON.stringify({
    schema: TAKE_SCHEMA,
    take_id: 'take-missing-interior',
    recording: 'raw.mp4',
    capture: {region: [0, 0, 10, 10]},
    steps: [
      {id: 'a', start: 0, end: 3, status: 'ok'},
      {id: 'c', start: 6, end: 10, status: 'ok'},
    ],
  }));
  const narrationTake = parseNarrationTake(JSON.stringify({
    schema: NARRATION_TAKE_SCHEMA,
    clips: [{beat: 'n-1', status: 'ok', path: 'n-1.wav', durationSec: 1}],
  }));

  const plan = place(parsedScreenplay, take, narrationTake);
  assert.equal(plan.ok, false);
  assert.equal(plan.rejections[0].reason, 'unrecorded-step');
  assert.match(plan.rejections[0].detail, /"b"/);
});
