import assert from 'node:assert/strict';
import test from 'node:test';
import { SCREENPLAY_SCHEMA, parseScreenplay } from '../src/creative/lib/screenplay.mjs';
import {
  CAPTION_REVIEW_SCHEMA,
  checkMutedComprehension as inspectMutedComprehension,
  parseCaptionReview,
} from '../src/creative/demo-format.mjs';

const renderHash = 'a'.repeat(64);
const checkMutedComprehension = (screenplay, options = {}) =>
  inspectMutedComprehension(screenplay, {render: {sha256: renderHash}, ...options});

const base = {
  schema: SCREENPLAY_SCHEMA,
  title: 'Issue list demo',
  placement: 'landing-hero',
  capture: { region: '0,0 1256x784', fps: 30 },
  steps: [
    { id: 'hold', action: 'hold', seconds: 2 },
    { id: 'click', action: 'click', target: 'issues-tab', settle: 4 },
  ],
};

const review = (overrides = {}) => ({
  schema: CAPTION_REVIEW_SCHEMA,
  reviewer: 'ana',
  method: 'contact-sheet',
  render_sha256: renderHash,
  captions_present: true,
  captions_readable: true,
  captions_clipped: false,
  captions_accurate: true,
  captions_cover_narration: true,
  opening_identifies_outcome: true,
  uninspected: [],
  ...overrides,
});

test('no captions and narration beats: fail, not a declaration pass', () => {
  const screenplay = parseScreenplay(JSON.stringify({
    ...base,
    narration: [{ id: 'n', text: 'hello', start_after: 'hold', visual_span: { from_step: 'hold', through_step: 'click' } }],
  }));
  const result = checkMutedComprehension(screenplay);
  assert.equal(result.status, 'fail');
});

test('captions declared, no review supplied: warn, not pass — declaration is not inspected proof', () => {
  const screenplay = parseScreenplay(JSON.stringify({ ...base, captions: true }));
  const result = checkMutedComprehension(screenplay);
  assert.equal(result.status, 'warn');
  assert.match(result.detail, /not inspected rendered proof/);
});

test('captions declared and reviewed clean: pass', () => {
  const screenplay = parseScreenplay(JSON.stringify({ ...base, captions: true }));
  const result = checkMutedComprehension(screenplay, { captionReview: review() });
  assert.equal(result.status, 'pass');
});

test('review finds captions absent despite declaration: fail, never reported as verified', () => {
  const screenplay = parseScreenplay(JSON.stringify({ ...base, captions: true }));
  const result = checkMutedComprehension(screenplay, { captionReview: review({ captions_present: false }) });
  assert.equal(result.status, 'fail');
  assert.match(result.detail, /found them absent/);
});

test('review finds captions clipped: fail', () => {
  const screenplay = parseScreenplay(JSON.stringify({ ...base, captions: true }));
  const result = checkMutedComprehension(screenplay, { captionReview: review({ captions_clipped: true }) });
  assert.equal(result.status, 'fail');
  assert.match(result.detail, /clipped or hidden/);
});

test('review finds opening does not identify outcome: fail', () => {
  const screenplay = parseScreenplay(JSON.stringify({ ...base, captions: true }));
  const result = checkMutedComprehension(screenplay, { captionReview: review({ opening_identifies_outcome: false }) });
  assert.equal(result.status, 'fail');
  assert.match(result.detail, /opening frames do not identify/);
});

test('review discloses an uninspected area: warn, still names what was confirmed', () => {
  const screenplay = parseScreenplay(JSON.stringify({ ...base, captions: true }));
  const result = checkMutedComprehension(screenplay, { captionReview: review({ uninspected: ['last 5 seconds'] }) });
  assert.equal(result.status, 'warn');
  assert.match(result.detail, /left uninspected: last 5 seconds/);
});

test('non-muted placement stays n/a regardless of review', () => {
  const screenplay = parseScreenplay(JSON.stringify({ ...base, placement: 'readme' }));
  const result = checkMutedComprehension(screenplay, { captionReview: review() });
  assert.equal(result.status, 'n/a');
});

test('parseCaptionReview rejects wrong schema', () => {
  assert.throws(() => parseCaptionReview(JSON.stringify({ ...review(), schema: 'nope' })), /schema/);
});

test('parseCaptionReview rejects unknown method', () => {
  assert.throws(() => parseCaptionReview(JSON.stringify({ ...review(), method: 'ai-vision' })), /method must be one of/);
});

test('parseCaptionReview rejects missing boolean fields', () => {
  const { captions_present, ...rest } = review();
  assert.throws(() => parseCaptionReview(JSON.stringify(rest)), /captions_present must be a boolean/);
});

test('parseCaptionReview keeps uninspected list and drops junk entries', () => {
  const parsed = parseCaptionReview(JSON.stringify(review({ uninspected: ['tail', '', 42, '  '] })));
  assert.deepEqual(parsed.uninspected, ['tail']);
});

test('a caption review for different render bytes never establishes verification', () => {
  const screenplay = parseScreenplay(JSON.stringify({...base, captions: true}));
  const result = checkMutedComprehension(screenplay, {captionReview: review({render_sha256: 'b'.repeat(64)})});
  assert.equal(result.status, 'warn');
  assert.match(result.detail, /not bound to this exact rendered file/);
});

test('subtitle metadata alone cannot verify rendered legibility', () => {
  const screenplay = parseScreenplay(JSON.stringify({...base, captions: true}));
  assert.equal(checkMutedComprehension(screenplay, {captionReview: review({method: 'subtitle-metadata'})}).status, 'warn');
});

test('uninspected clipping and narration coverage cannot default to verified', () => {
  for (const field of ['captions_clipped', 'captions_accurate', 'captions_cover_narration']) {
    const input = review();
    delete input[field];
    assert.throws(() => parseCaptionReview(JSON.stringify(input)), new RegExp(field));
  }
});
