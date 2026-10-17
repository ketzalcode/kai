import assert from 'node:assert/strict';
import test, {after} from 'node:test';
import { mkdtempSync, writeFileSync, existsSync, readFileSync, rmSync } from 'node:fs';
import {spawnSync} from 'node:child_process';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createHash } from 'node:crypto';
import { SCREENPLAY_SCHEMA, TAKE_SCHEMA, EDITED_TAKE_SCHEMA } from '../src/creative/lib/screenplay.mjs';
import { BUNDLE_SCHEMA, buildBundleManifest, writeBundle } from '../src/creative/demo-bundle.mjs';

function cueHash(cueText) {
  return createHash('sha256').update(cueText.trim(), 'utf8').digest('hex').slice(0, 16);
}

const fixtureDirs = [];
after(() => fixtureDirs.forEach((dir) => rmSync(dir, {recursive: true, force: true})));
function makeFixture() {
  const dir = mkdtempSync(join(tmpdir(), 'demo-bundle-test-'));
  fixtureDirs.push(dir);
  const screenplayPath = join(dir, 'screenplay.json');
  const takePath = join(dir, 'take.json');
  const planPath = join(dir, 'plan.json');
  const renderPath = join(dir, 'render.mp4');
  const clip1 = join(dir, 'n-1.wav');
  const clip2 = join(dir, 'n-2.wav');

  writeFileSync(screenplayPath, JSON.stringify({
    schema: SCREENPLAY_SCHEMA,
    title: 'Behavioral demo',
    capture: { region: '0,0 1256x784', fps: 30 },
    steps: [
      { id: 'hold', action: 'hold', seconds: 2 },
      { id: 'click', action: 'click', target: 'issues-tab', settle: 4 },
    ],
    narration: [
      {id: 'n-1', text: 'hello', visual_span: {from_step: 'hold'}},
      {id: 'n-2', text: 'world', visual_span: {from_step: 'click'}},
    ],
  }));
  writeFileSync(takePath, JSON.stringify({
    schema: TAKE_SCHEMA,
    take_id: 'take-1',
    recording: 'raw.mp4',
    capture: { region: [0, 0, 1256, 784], fps: 30 },
    steps: [
      { id: 'hold', start: 0, end: 2, status: 'ok' },
      { id: 'click', start: 2, end: 6, status: 'ok' },
    ],
  }));
  writeFileSync(clip1, 'clip-1');
  writeFileSync(clip2, 'clip-2');
  writeFileSync(planPath, JSON.stringify({
    schema: 'kai.demo-narration-plan/v1',
    take_id: 'take-1',
    recording: 'raw.mp4',
    ok: true,
    rejections: [],
    beats: [
      { beat: 'n-1', path: clip1, start: 0, end: 2, durationSec: 2, text: 'hello' },
      { beat: 'n-2', path: clip2, start: 2.5, end: 5, durationSec: 2.5, text: 'world' },
    ],
  }));
  writeFileSync(renderPath, 'render-bytes');
  writeFileSync(join(dir, 'raw.mp4'), 'raw-recording-bytes');

  return { dir, screenplayPath, takePath, planPath, renderPath, clip1, clip2 };
}

function makeMusic(dir) {
  const trackPath = join(dir, 'track.wav');
  writeFileSync(trackPath, 'music-bytes');
  const cuePath = join(dir, 'cue.json');
  const cueJson = {
    schema: 'kai.demo-music-cue/v1',
    path: trackPath,
    title: 'Quiet build',
    source: 'licensed',
    rights: 'Licensed under Acme Library terms #4821.',
    duration_sec: 45,
  };
  const cueText = JSON.stringify(cueJson);
  writeFileSync(cuePath, cueText);
  const acceptancePath = join(dir, 'acceptance.json');
  writeFileSync(acceptancePath, JSON.stringify({
    schema: 'kai.demo-music-acceptance/v1',
    cue_hash: cueHash(cueText),
    track_hash: createHash('sha256').update(readFileSync(trackPath)).digest('hex'),
    operator: 'ruben',
    auditioned: 'speech+music',
    accepted_at: '2026-10-16T00:00:00Z',
  }));
  return { cuePath, acceptancePath };
}

test('bundle manifest assembles render, screenplay, take, and narration with no music disclosed as missing', () => {
  const fx = makeFixture();
  const manifest = buildBundleManifest({
    variant: 'draft',
    screenplayPath: fx.screenplayPath,
    takePath: fx.takePath,
    narrationPlanPath: fx.planPath,
    renderPath: fx.renderPath,
  });
  assert.equal(manifest.schema, BUNDLE_SCHEMA);
  assert.equal(manifest.variant, 'draft');
  assert.equal(manifest.native_export.supported, false);
  assert.equal(manifest.distribution, 'private');
  assert.equal(manifest.narration.beats.length, 2);
  assert.equal(manifest.narration.timeline_end_sec, 5);
  assert.equal(manifest.music, null);
  assert.deepEqual(manifest.missing, [{ component: 'music', reason: 'no accepted music track was supplied; the demo hands off narration-only' }]);
});

test('bundle manifest requires a variant', () => {
  const fx = makeFixture();
  assert.throws(() => buildBundleManifest({
    screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath,
  }), /variant must be one of/);
});

test('bundle manifest refuses a rejected narration plan', () => {
  const fx = makeFixture();
  writeFileSync(fx.planPath, JSON.stringify({ schema: 'kai.demo-narration-plan/v1', ok: false, rejections: ['n-1 overlaps'], beats: [] }));
  assert.throws(() => buildBundleManifest({
    variant: 'draft', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath,
  }), /rejected narration plan/);
});

test('bundle manifest refuses a missing render file', () => {
  const fx = makeFixture();
  assert.throws(() => buildBundleManifest({
    variant: 'draft', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: join(fx.dir, 'missing.mp4'),
  }), /does not exist/);
});

test('bundle manifest refuses a music cue supplied without its acceptance', () => {
  const fx = makeFixture();
  const { cuePath } = makeMusic(fx.dir);
  assert.throws(() => buildBundleManifest({
    variant: 'draft', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath,
    musicCuePath: cuePath,
  }), /cue with no recorded acceptance/);
});

test('bundle manifest refuses a music-only audition as insufficient for inclusion', () => {
  const fx = makeFixture();
  const { cuePath, acceptancePath } = makeMusic(fx.dir);
  const acceptance = JSON.parse(readFileSync(acceptancePath, 'utf8'));
  writeFileSync(acceptancePath, JSON.stringify({ ...acceptance, auditioned: 'music-only' }));
  assert.throws(() => buildBundleManifest({
    variant: 'draft', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath,
    musicCuePath: cuePath, musicAcceptancePath: acceptancePath,
  }), /cannot judge fit against the narration/);
});

test('bundle manifest refuses an acceptance for a cue that changed afterward', () => {
  const fx = makeFixture();
  const { cuePath, acceptancePath } = makeMusic(fx.dir);
  const cueJson = JSON.parse(readFileSync(cuePath, 'utf8'));
  writeFileSync(cuePath, JSON.stringify({ ...cueJson, title: 'Quiet build (v2)' }));
  assert.throws(() => buildBundleManifest({
    variant: 'draft', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath,
    musicCuePath: cuePath, musicAcceptancePath: acceptancePath,
  }), /the cue changed since it was judged/);
});

test('bundle manifest includes an accepted music track with its provenance', () => {
  const fx = makeFixture();
  const { cuePath, acceptancePath } = makeMusic(fx.dir);
  const manifest = buildBundleManifest({
    variant: 'accepted', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath,
    musicCuePath: cuePath, musicAcceptancePath: acceptancePath,
  });
  assert.equal(manifest.missing.length, 0);
  assert.equal(manifest.music.title, 'Quiet build');
  assert.equal(manifest.music.accepted_by, 'ruben');
});

test('writeBundle copies every file into a role-named layout and writes a self-contained manifest', () => {
  const fx = makeFixture();
  const { cuePath, acceptancePath } = makeMusic(fx.dir);
  const manifest = buildBundleManifest({
    variant: 'accepted', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath,
    musicCuePath: cuePath, musicAcceptancePath: acceptancePath,
  });
  const destDir = join(fx.dir, 'bundle-out');
  const result = writeBundle(manifest, destDir);
  assert.ok(existsSync(join(destDir, 'manifest.json')));
  assert.ok(existsSync(join(destDir, 'render', 'final.mp4')));
  assert.ok(existsSync(join(destDir, 'narration', 'clips', 'n-1.wav')));
  assert.ok(existsSync(join(destDir, 'narration', 'clips', 'n-2.wav')));
  assert.ok(existsSync(join(destDir, 'source', 'recording.mp4')));
  assert.ok(existsSync(join(destDir, 'music', 'acceptance.json')));
  assert.ok(existsSync(join(destDir, 'music', 'track.wav')));
  const written = JSON.parse(readFileSync(join(destDir, 'manifest.json'), 'utf8'));
  assert.equal(written.render.path, 'render/final.mp4');
  assert.equal(written.narration.beats[0].path, 'narration/clips/n-1.wav');
});

test('bundle rejects changed music bytes and unsafe narration filenames', () => {
  const fx = makeFixture();
  const {cuePath, acceptancePath} = makeMusic(fx.dir);
  writeFileSync(join(fx.dir, 'track.wav'), 'replaced-track');
  const options = {variant: 'draft', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath};
  assert.throws(() => buildBundleManifest({...options, musicCuePath: cuePath, musicAcceptancePath: acceptancePath}), /track bytes changed/);
  const plan = JSON.parse(readFileSync(fx.planPath, 'utf8'));
  plan.beats[0].beat = '../../outside';
  writeFileSync(fx.planPath, JSON.stringify(plan));
  assert.throws(() => buildBundleManifest(options), /filename-safe/);
});

test('bundle refuses a plan from another take or screenplay revision', () => {
  const fx = makeFixture();
  const plan = JSON.parse(readFileSync(fx.planPath, 'utf8'));
  const options = {variant: 'draft', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath};
  writeFileSync(fx.planPath, JSON.stringify({...plan, take_id: 'other-take'}));
  assert.throws(() => buildBundleManifest(options), /different recordings/);
  plan.beats[0].text = 'unapproved new words';
  writeFileSync(fx.planPath, JSON.stringify(plan));
  assert.throws(() => buildBundleManifest(options), /stale or unrelated text/);
});

test('an edited bundle includes the raw take and source footage it needs', () => {
  const fx = makeFixture();
  const source = JSON.parse(readFileSync(fx.takePath, 'utf8'));
  const editedPath = join(fx.dir, 'edited-take.json');
  writeFileSync(editedPath, JSON.stringify({...source, schema: EDITED_TAKE_SCHEMA, take_id: 'edit-1', source_take_id: source.take_id}));
  const plan = JSON.parse(readFileSync(fx.planPath, 'utf8'));
  writeFileSync(fx.planPath, JSON.stringify({...plan, take_id: 'edit-1'}));
  const manifest = buildBundleManifest({
    variant: 'draft', screenplayPath: fx.screenplayPath, takePath: editedPath,
    sourceTakePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath,
  });
  const dest = join(fx.dir, 'edited-bundle');
  const result = writeBundle(manifest, dest);
  assert.equal(result.manifest.take.source_path, 'source/raw-take.json');
  assert.ok(existsSync(join(dest, result.manifest.take.source_path)));
  assert.ok(existsSync(join(dest, result.manifest.take.raw_recording_path)));
});

const mediaAvailable = spawnSync('ffmpeg', ['-version'], {encoding: 'utf8'}).status === 0
  && spawnSync('ffprobe', ['-version'], {encoding: 'utf8'}).status === 0;
test('bundle exports a full-length aligned narration stem with silence through the tail', {skip: !mediaAvailable}, () => {
  const fx = makeFixture();
  for (const [clip, duration] of [[fx.clip1, 2], [fx.clip2, 2.5]]) {
    const result = spawnSync('ffmpeg', ['-y', '-v', 'error', '-f', 'lavfi', '-i', `sine=frequency=800:duration=${duration}`, clip], {encoding: 'utf8'});
    assert.equal(result.status, 0, result.stderr);
  }
  const manifest = buildBundleManifest({variant: 'draft', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath});
  const dest = join(fx.dir, 'aligned-bundle');
  const result = writeBundle(manifest, dest, {renderDurationSec: 8});
  const stem = join(dest, result.manifest.narration.aligned_stem);
  const probe = spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', stem], {encoding: 'utf8'});
  assert.equal(probe.status, 0, probe.stderr);
  assert.ok(Math.abs(Number(probe.stdout.trim()) - 8) < 0.01);
  assert.equal(result.manifest.narration.timeline_end_sec, 8);
});

test('writeBundle refuses a non-empty existing destination without --replace', () => {
  const fx = makeFixture();
  const manifest = buildBundleManifest({
    variant: 'draft', screenplayPath: fx.screenplayPath, takePath: fx.takePath, narrationPlanPath: fx.planPath, renderPath: fx.renderPath,
  });
  const destDir = join(fx.dir, 'bundle-out-2');
  writeBundle(manifest, destDir);
  assert.throws(() => writeBundle(manifest, destDir), /already exists and is not empty/);
  assert.doesNotThrow(() => writeBundle(manifest, destDir, { replace: true }));
});
