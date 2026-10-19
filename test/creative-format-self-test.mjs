import assert from 'node:assert/strict';
import test from 'node:test';
import { SCREENPLAY_SCHEMA, parseScreenplay } from '../src/creative/lib/screenplay.mjs';
import {
  CAPTION_REVIEW_SCHEMA,
  PLACEMENTS,
  checkDuration,
  checkMutedComprehension as inspectMutedComprehension,
  checkSize,
  parseCaptionReview,
  profileFor,
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

// --- issue #125: composable placement dimensions -------------------------

test('named presets remain valid and unchanged', () => {
  const screenplay = parseScreenplay(JSON.stringify(base));
  const profile = profileFor(screenplay);
  assert.equal(profile.target, PLACEMENTS['landing-hero'].target);
  assert.equal(profile.cap, PLACEMENTS['landing-hero'].cap);
  assert.equal(profile.muted, PLACEMENTS['landing-hero'].muted);
  assert.equal(profile.label, 'landing-hero');
});

test('an explicit dimension object represents a combination no preset bundles', () => {
  // A short teaser bound for a destination with a byte cap: no preset
  // combines a social-teaser's short target with a readme's upload limit.
  const screenplay = parseScreenplay(JSON.stringify({
    ...base,
    placement: { target: 20, cap: 30, maxBytes: 5 * 1024 * 1024, muted: true, note: 'short teaser embedded in a byte-capped doc' },
  }));
  const profile = profileFor(screenplay);
  assert.equal(profile.target, 20);
  assert.equal(profile.cap, 30);
  assert.equal(profile.maxBytes, 5 * 1024 * 1024);
  assert.equal(profile.muted, true);
});

test('explicit dimension object flows through checkDuration and checkSize using its own values', () => {
  const screenplay = parseScreenplay(JSON.stringify({
    ...base,
    placement: { target: 20, cap: 30, maxBytes: 5 * 1024 * 1024, muted: true, note: 'short teaser embedded in a byte-capped doc' },
  }));
  const duration = checkDuration(screenplay, { seconds: 35 });
  assert.equal(duration.status, 'warn');
  assert.match(duration.detail, /30s editorial cap/);
  const size = checkSize(screenplay, { bytes: 6 * 1024 * 1024 });
  assert.equal(size.status, 'fail');
  assert.match(size.detail, /5 MB limit/);
});

test('explicit dimension object rejects a missing target with a source-labeled refusal', () => {
  assert.throws(
    () => profileFor({ placement: { cap: 30, maxBytes: null, muted: true } }),
    /placement\.target must be a positive number of seconds — the editorial duration target/,
  );
});

test('explicit dimension object rejects a cap under its own target', () => {
  assert.throws(
    () => profileFor({ placement: { target: 40, cap: 30, maxBytes: null, muted: true } }),
    /placement\.cap must be a number of seconds at or past placement\.target/,
  );
});

test('explicit dimension object rejects a non-boolean muted flag, naming it a playback fact', () => {
  assert.throws(
    () => profileFor({ placement: { target: 20, cap: 30, maxBytes: null, muted: 'sometimes' } }),
    /playback-behavior fact/,
  );
});

test('explicit dimension object rejects a negative maxBytes, naming it a destination fact', () => {
  assert.throws(
    () => profileFor({ placement: { target: 20, cap: 30, maxBytes: -1, muted: false } }),
    /destination's published upload limit, a fact/,
  );
});

test('screenplay parsing still rejects an unknown placement name', () => {
  assert.throws(
    () => parseScreenplay(JSON.stringify({ ...base, placement: 'not-a-real-placement' })),
    /placement must be one of/,
  );
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
