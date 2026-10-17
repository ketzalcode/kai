import assert from 'node:assert/strict';
import test, { after } from 'node:test';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import {
  CUE_SCHEMA,
  ACCEPTANCE_SCHEMA,
  parseMusicCue,
  parseMusicAcceptance,
  acceptCue,
  requireAcceptance,
  buildAuditionArgs,
  buildMusicMixArgs,
  buildPeakCheckArgs,
  assertSafeOutput,
} from '../src/creative/demo-music.mjs';

const fixtureDir = mkdtempSync(join(tmpdir(), 'demo-music-test-'));
after(() => rmSync(fixtureDir, { recursive: true, force: true }));
const trackPath = join(fixtureDir, 'candidate.wav');
writeFileSync(trackPath, 'candidate-track-bytes');
const cueJson = {
  schema: CUE_SCHEMA,
  path: trackPath,
  title: 'Quiet build',
  source: 'licensed',
  rights: 'Licensed under Acme Library terms #4821, cleared for product demos.',
  style: 'ambient',
  tempo_bpm: 92,
  energy: 'low',
  duration_sec: 45,
};
const cueText = JSON.stringify(cueJson);

const plan = {
  schema: 'kai.demo-narration-plan/v1',
  ok: true,
  rejections: [],
  beats: [
    {beat: 'n-1', path: 'n-1.wav', start: 0, end: 2, durationSec: 2, span: {start: 0, end: 3}, deferred: 0, text: 'hello'},
    {beat: 'n-2', path: 'n-2.wav', start: 3, end: 5, durationSec: 2, span: {start: 3, end: 6}, deferred: 0, text: 'world'},
  ],
};

test('music cue requires a non-empty rights statement', () => {
  assert.throws(() => parseMusicCue(JSON.stringify({...cueJson, rights: ''})), /rights must be a non-empty string/);
});

test('music cue rejects an unknown source', () => {
  assert.throws(() => parseMusicCue(JSON.stringify({...cueJson, source: 'downloaded'})), /source must be one of/);
});

test('music cue requires a measured duration', () => {
  const raw = {...cueJson};
  delete raw.duration_sec;
  assert.throws(() => parseMusicCue(JSON.stringify(raw)), /duration_sec must be a number/);
});

test('acceptance names the exact cue it judged, by content hash', () => {
  const acceptance = acceptCue(cueText, {operator: 'ruben', now: () => '2026-10-16T00:00:00Z'});
  assert.equal(acceptance.schema, ACCEPTANCE_SCHEMA);
  assert.equal(acceptance.auditioned, 'speech+music');
  assert.doesNotThrow(() => requireAcceptance(cueText, acceptance));

  const parsed = parseMusicAcceptance(JSON.stringify(acceptance));
  assert.equal(parsed.operator, 'ruben');
});

test('acceptance gate rejects a cue that changed after acceptance', () => {
  const acceptance = acceptCue(cueText, {operator: 'ruben'});
  const editedCueText = JSON.stringify({...cueJson, title: 'Quiet build (v2)'});
  assert.throws(() => requireAcceptance(editedCueText, acceptance), /it was not accepted/);
});

test('acceptance gate rejects a music-only audition as insufficient', () => {
  const acceptance = acceptCue(cueText, {operator: 'ruben', auditioned: 'music-only'});
  assert.throws(() => requireAcceptance(cueText, acceptance), /cannot judge fit against the narration/);
});

test('audition sample mixes narration and music and is not silently overwritable', () => {
  const cue = parseMusicCue(cueText);
  const args = buildAuditionArgs(plan, cue, {video: 'render.mp4', out: 'sample.mp4'});
  assert.equal(args[0], '-n');
  assert.ok(args.includes(trackPath));
  assert.ok(args.includes('n-1.wav'));
  assert.ok(args.includes('n-2.wav'));
  const filterArg = args[args.indexOf('-filter_complex') + 1];
  assert.match(filterArg, /afade=t=in/);
  assert.match(filterArg, /amix=inputs=2/);
});

test('audition refuses an output that aliases an input', () => {
  const cue = parseMusicCue(cueText);
  assert.throws(
    () => buildAuditionArgs(plan, cue, {video: 'render.mp4', out: trackPath}),
    /is the same as the music candidate/,
  );
});

test('replacing audio at the same cue path invalidates acceptance', () => {
  const acceptance = acceptCue(cueText, {operator: 'operator'});
  try {
    writeFileSync(trackPath, 'different-track-bytes');
    assert.throws(() => requireAcceptance(cueText, acceptance), /track bytes changed/);
  } finally {
    writeFileSync(trackPath, 'candidate-track-bytes');
  }
});

test('assertSafeOutput refuses an existing destination without --replace', () => {
  assert.throws(
    () => assertSafeOutput([{role: 'video input', path: 'test/creative-music-self-test.mjs'}], 'test/creative-music-self-test.mjs', false),
    /is the same as the video input/,
  );
});

// ----------------------------------------------------------------- mixing

test('music mix refuses an unaccepted cue', () => {
  const cue = parseMusicCue(cueText);
  const badAcceptance = acceptCue(JSON.stringify({...cueJson, title: 'Different track'}), {operator: 'ruben'});
  assert.throws(
    () => buildMusicMixArgs(plan, cue, cueText, badAcceptance, {video: 'render.mp4', out: 'scored.mp4'}),
    /it was not accepted/,
  );
});

test('music mix refuses a cue shorter than the narrated timeline', () => {
  const shortCueJson = {...cueJson, duration_sec: 3};
  const shortCueText = JSON.stringify(shortCueJson);
  const cue = parseMusicCue(shortCueText);
  const acceptance = acceptCue(shortCueText, {operator: 'ruben'});
  assert.throws(
    () => buildMusicMixArgs(plan, cue, shortCueText, acceptance, {video: 'render.mp4', out: 'scored.mp4'}),
    /shorter than the narrated timeline/,
  );
});

test('music mix ducks under every narrated beat, fades, and limits peak level', () => {
  const cue = parseMusicCue(cueText);
  const acceptance = acceptCue(cueText, {operator: 'ruben'});
  const args = buildMusicMixArgs(plan, cue, cueText, acceptance, {video: 'render.mp4', out: 'scored.mp4'});
  assert.equal(args[0], '-n');
  const filterArg = args[args.indexOf('-filter_complex') + 1];
  assert.match(filterArg, /afade=t=in:d=1\.5/);
  assert.match(filterArg, /afade=t=out:st=3\.5:d=1\.5/);
  assert.match(filterArg, /volume=-14dB:enable='between\(t,0,2\)'/);
  assert.match(filterArg, /volume=-14dB:enable='between\(t,3,5\)'/);
  assert.match(filterArg, /alimiter=limit=0\.95/);
});

test('music mix refuses to replace an existing output without authorization', () => {
  const cue = parseMusicCue(cueText);
  const acceptance = acceptCue(cueText, {operator: 'ruben'});
  assert.throws(
    () => buildMusicMixArgs(plan, cue, cueText, acceptance, {video: 'render.mp4', out: 'test/creative-music-self-test.mjs'}),
    /already exists/,
  );
});

test('peak check prints a read-only measurement command', () => {
  const args = buildPeakCheckArgs('scored.mp4');
  assert.deepEqual(args, ['-hide_banner', '-v', 'info', '-i', 'scored.mp4', '-af', 'astats=metadata=1:reset=1', '-f', 'null', '-']);
});
