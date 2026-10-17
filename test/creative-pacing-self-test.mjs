import assert from 'node:assert/strict';
import test from 'node:test';
import { PACING_HOLD_WARN, checkPacingHolds, checkAll } from '../src/creative/demo-format.mjs';
import {parseScreenplay, SCREENPLAY_SCHEMA} from '../src/creative/lib/screenplay.mjs';

const plan = (beats) => ({ schema: 'kai.demo-narration-plan/v1', beats, ok: true });

test('no plan: skipped, not a silent pass', () => {
  const result = checkPacingHolds(null, { seconds: 60 });
  assert.equal(result.status, 'skipped');
});

test('plan with no render: skipped', () => {
  const result = checkPacingHolds(plan([{ beat: 'a', start: 0, end: 2 }]), null);
  assert.equal(result.status, 'skipped');
});

test('a single beat has no interior gap to flag: pass', () => {
  const result = checkPacingHolds(plan([{ beat: 'a', start: 0, end: 2 }]), { seconds: 30 });
  assert.equal(result.status, 'pass');
});

test('gaps between beats under the threshold: pass', () => {
  const result = checkPacingHolds(plan([
    { beat: 'a', start: 0, end: 2 },
    { beat: 'b', start: 4, end: 6 },
  ]), { seconds: 30 });
  assert.equal(result.status, 'pass');
});

test('a narration-free hold past the threshold: warn, names both beats and the measured gap', () => {
  const result = checkPacingHolds(plan([
    { beat: 'intro', start: 0, end: 2 },
    { beat: 'payoff', start: 16, end: 18 },
  ]), { seconds: 30 });
  assert.equal(result.status, 'warn');
  assert.match(result.detail, /14s between "intro" \(ends 2s\) and "payoff" \(starts 16s\)/);
  assert.match(result.detail, /not proof every second was unnecessary/);
});

test('multiple holds are all named, not just the first', () => {
  const result = checkPacingHolds(plan([
    { beat: 'a', start: 0, end: 1 },
    { beat: 'b', start: 1 + 13.6, end: 1 + 13.6 + 1 },
    { beat: 'c', start: 1 + 13.6 + 1 + 11.4, end: 1 + 13.6 + 1 + 11.4 + 1 },
  ]), { seconds: 60 });
  assert.equal(result.status, 'warn');
  assert.match(result.detail, /2 narration-free hold\(s\)/);
  assert.match(result.detail, /13\.6s between "a"/);
  assert.match(result.detail, /11\.4s between "b"/);
});

test('a gap before the first beat (settling time) is never a finding', () => {
  const result = checkPacingHolds(plan([
    { beat: 'only', start: 20, end: 22 },
  ]), { seconds: 30 });
  assert.equal(result.status, 'pass');
});

test('unordered beats are sorted by start before gaps are measured', () => {
  const result = checkPacingHolds(plan([
    { beat: 'late', start: 20, end: 22 },
    { beat: 'early', start: 0, end: 2 },
  ]), { seconds: 30 });
  assert.equal(result.status, 'warn');
  assert.match(result.detail, /between "early" \(ends 2s\) and "late" \(starts 20s\)/);
});

test('PACING_HOLD_WARN is the documented 6s default', () => {
  assert.equal(PACING_HOLD_WARN, 6);
});

test('a rejected or malformed plan cannot report verified pacing', () => {
  assert.equal(checkPacingHolds({...plan([{beat: 'a', start: 0, end: 2}]), ok: false}, {seconds: 30}).status, 'fail');
  assert.equal(checkPacingHolds(plan([{beat: 'a', start: 0, end: 40}]), {seconds: 30}).status, 'fail');
});

test('silent demos do not acquire an impossible missing-narration check', () => {
  const screenplay = parseScreenplay(JSON.stringify({
    schema: SCREENPLAY_SCHEMA, title: 'Silent demo', placement: 'readme',
    capture: {region: '0,0 100x100'},
    steps: [{id: 'a', action: 'hold', seconds: 2}],
  }));
  const result = checkAll(screenplay, {render: {seconds: 2, width: 100, height: 100, bytes: 1000}});
  assert.equal(result.checks.find((check) => check.id === 'pacing').status, 'n/a');
});
