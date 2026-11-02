import assert from 'node:assert/strict';
import test from 'node:test';
import { checkCaptureMode } from '../src/creative/demo-format.mjs';

test('a recorded capture mode passes with no note required', () => {
  const result = checkCaptureMode({ capture_mode: 'recorded', capture_mode_note: null });
  assert.equal(result.status, 'pass');
});

test('a replay capture mode warns and surfaces the justifying note', () => {
  const result = checkCaptureMode({
    capture_mode: 'replay',
    capture_mode_note: 'live recording unavailable; operator approved a labelled replay',
  });
  assert.equal(result.status, 'warn');
  assert.match(result.detail, /"replay"/);
  assert.match(result.detail, /operator approved a labelled replay/);
  assert.match(result.detail, /never be presented as a recording/);
});

test('an illustration capture mode warns and names itself', () => {
  const result = checkCaptureMode({
    capture_mode: 'illustration',
    capture_mode_note: 'conceptual mockup, no live product behind it',
  });
  assert.equal(result.status, 'warn');
  assert.match(result.detail, /"illustration"/);
});
