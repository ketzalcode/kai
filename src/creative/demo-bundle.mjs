#!/usr/bin/env node
// demo-bundle — assembling an editor-neutral, edit-ready handoff.
//
// Why this exists
// ----------------
// A finished render is not the only thing an operator needs to make a
// last-minute edit. The screenplay, the measured take it was cut from, the
// aligned narration stems, and any accepted music all already exist as
// separate files by the time a render is done; what is missing is a single
// place that names each one's role, says where it came from, and says
// plainly what is absent. Without that, a small change means reverse
// engineering the final video or searching internal work folders.
//
// What this tool will not do
// ---------------------------
// Produce or claim a native editor project (e.g. a Premiere or Final Cut
// export). That is a distinct, unverified capability and this tool never
// implies it exists. It also never silently includes an unaccepted music
// candidate, never promotes a draft bundle to "accepted" on its own, and
// never writes outside the destination directory it was given -- packaging
// does not authorize publication, and the bundle is typed private evidence
// until an operator says otherwise.

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, copyFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { basename, dirname, join, extname, resolve } from 'node:path';
import { parseScreenplay, parseTake, parseEditedTake, TAKE_SCHEMA as RAW_TAKE_SCHEMA, EDITED_TAKE_SCHEMA } from './lib/screenplay.mjs';

export const BUNDLE_SCHEMA = 'kai.demo-edit-bundle/v1';
const MUSIC_CUE_SCHEMA = 'kai.demo-music-cue/v1';
const MUSIC_ACCEPTANCE_SCHEMA = 'kai.demo-music-acceptance/v1';
const VARIANTS = new Set(['draft', 'accepted']);

function fail(message) {
  throw new Error(message);
}

function str(value, label) {
  if (typeof value !== 'string' || value.trim() === '') fail(`${label} must be a non-empty string`);
  return value;
}

// Same identity scheme as demo-music's cue hash: a stable fingerprint of the
// exact bytes an operator judged, so an acceptance cannot be stretched to
// cover a cue that was edited after the fact. Recomputed here rather than
// imported so this tool stays usable before #287's audition gate lands on
// the same base; the two must stay numerically identical, which the tests
// below pin against #287's own fixtures.
function cueHash(cueText) {
  return createHash('sha256').update(cueText.trim(), 'utf8').digest('hex').slice(0, 16);
}

function loadTake(takePath, sourceTakePath) {
  const text = readFileSync(takePath, 'utf8');
  let raw;
  try {
    raw = JSON.parse(text);
  } catch (error) {
    fail(`${takePath} is not valid JSON: ${error.message}`);
  }
  if (raw.schema === RAW_TAKE_SCHEMA) return { take: parseTake(text), schema: RAW_TAKE_SCHEMA, sourceTakeId: null };
  if (raw.schema === EDITED_TAKE_SCHEMA) {
    if (!sourceTakePath) fail(`${takePath} is an edited take (${EDITED_TAKE_SCHEMA}); bundling it needs the raw source take too, to record the edit's provenance`);
    const sourceTake = parseTake(readFileSync(sourceTakePath, 'utf8'));
    const edited = parseEditedTake(text, sourceTake);
    return { take: edited, schema: EDITED_TAKE_SCHEMA, sourceTakeId: sourceTake.take_id };
  }
  fail(`${takePath} must declare "schema": "${RAW_TAKE_SCHEMA}" or "${EDITED_TAKE_SCHEMA}", got ${JSON.stringify(raw.schema ?? null)}`);
}

// A music candidate may only enter a handoff bundle already judged against the
// actual narration, by the exact bytes an operator heard -- never a cue that
// merely decodes and measures cleanly. This mirrors #287's acceptance gate
// without depending on that branch's module.
function loadAcceptedMusic(cuePath, acceptancePath) {
  const cueText = readFileSync(cuePath, 'utf8');
  let cue;
  try {
    cue = JSON.parse(cueText);
  } catch (error) {
    fail(`${cuePath} is not valid JSON: ${error.message}`);
  }
  if (cue.schema !== MUSIC_CUE_SCHEMA) fail(`${cuePath} must declare "schema": "${MUSIC_CUE_SCHEMA}", got ${JSON.stringify(cue.schema ?? null)}`);
  str(cue.path, `${cuePath}.path`);
  str(cue.title, `${cuePath}.title`);
  str(cue.rights, `${cuePath}.rights`);

  const acceptanceText = readFileSync(acceptancePath, 'utf8');
  let acceptance;
  try {
    acceptance = JSON.parse(acceptanceText);
  } catch (error) {
    fail(`${acceptancePath} is not valid JSON: ${error.message}`);
  }
  if (acceptance.schema !== MUSIC_ACCEPTANCE_SCHEMA) fail(`${acceptancePath} must declare "schema": "${MUSIC_ACCEPTANCE_SCHEMA}", got ${JSON.stringify(acceptance.schema ?? null)}`);
  const hash = cueHash(cueText);
  if (acceptance.cue_hash !== hash) {
    fail(`${acceptancePath} accepted a different cue (recorded hash ${acceptance.cue_hash}) than ${cuePath} now contains (${hash}); the cue changed since it was judged, so this acceptance does not cover it`);
  }
  if (acceptance.auditioned !== 'speech+music') {
    fail(`${acceptancePath} recorded a "${acceptance.auditioned}" audition, which cannot judge fit against the narration; it is not sufficient to include this track in an edit-ready bundle`);
  }

  return { cue, cueText, cuePath, acceptance };
}

// -------------------------------------------------------------------- manifest

// Pure assembly: reads and cross-checks every named input, and says what a
// human reviewing the bundle needs to know, but writes nothing. `writeBundle`
// is the only place files move.
export function buildBundleManifest({
  variant,
  screenplayPath,
  takePath,
  sourceTakePath = null,
  narrationPlanPath,
  renderPath,
  musicCuePath = null,
  musicAcceptancePath = null,
}) {
  if (!VARIANTS.has(variant)) fail(`variant must be one of ${[...VARIANTS].join(', ')}, got ${JSON.stringify(variant)}`);
  if (!existsSync(renderPath)) fail(`${renderPath} (the final render) does not exist`);

  const screenplay = parseScreenplay(readFileSync(screenplayPath, 'utf8'));
  const { take, schema: takeSchema, sourceTakeId } = loadTake(takePath, sourceTakePath);

  let plan;
  try {
    plan = JSON.parse(readFileSync(narrationPlanPath, 'utf8'));
  } catch (error) {
    fail(`${narrationPlanPath} is not valid JSON: ${error.message}`);
  }
  if (!plan.ok) {
    fail(`${narrationPlanPath} is a rejected narration plan (ok: false); a rejected placement is not ready to hand off. Resolve its rejections and re-place first.`);
  }
  if (!Array.isArray(plan.beats) || plan.beats.length === 0) fail(`${narrationPlanPath} places no narration beats`);
  for (const beat of plan.beats) {
    if (!existsSync(beat.path)) fail(`the narration plan names clip "${beat.path}" for beat "${beat.beat}", which does not exist`);
  }

  const missing = [];
  let music = null;
  if (musicCuePath || musicAcceptancePath) {
    if (!musicCuePath || !musicAcceptancePath) fail('supplying music needs both a cue and its acceptance; a cue with no recorded acceptance is not an included track');
    music = loadAcceptedMusic(musicCuePath, musicAcceptancePath);
    if (!existsSync(music.cue.path)) fail(`the music cue names "${music.cue.path}", which does not exist`);
  } else {
    missing.push({ component: 'music', reason: 'no accepted music track was supplied; the demo hands off narration-only' });
  }

  const timelineEnd = Math.max(...plan.beats.map((beat) => beat.end));

  return {
    schema: BUNDLE_SCHEMA,
    variant,
    native_export: {
      supported: false,
      note: 'This bundle does not produce or claim a native editor project (for example a Premiere or Final Cut project) export. It is an editor-neutral folder of aligned source files and a manifest.',
    },
    distribution: 'private',
    distribution_note: 'Packaging this bundle does not authorize publishing it. Treat its contents as the same typed private evidence the source assets already were.',
    render: { role: 'final-render', path: renderPath, variant },
    screenplay: { role: 'source-screenplay', path: screenplayPath, title: screenplay.title, placement: screenplay.placement },
    take: {
      role: 'source-take',
      path: takePath,
      schema: takeSchema,
      take_id: take.take_id ?? null,
      source_take_id: sourceTakeId,
    },
    narration: {
      role: 'aligned-narration',
      plan_path: narrationPlanPath,
      timeline_end_sec: timelineEnd,
      beats: plan.beats.map((beat) => ({
        id: beat.beat,
        path: beat.path,
        start: beat.start,
        end: beat.end,
        text: beat.text ?? null,
      })),
    },
    music: music ? {
      role: 'accepted-music',
      cue_path: music.cuePath,
      track_path: music.cue.path,
      title: music.cue.title,
      source: music.cue.source,
      rights: music.cue.rights,
      cue_hash: cueHash(music.cueText),
      accepted_by: music.acceptance.operator ?? null,
      accepted_at: music.acceptance.accepted_at ?? null,
    } : null,
    missing,
  };
}

// -------------------------------------------------------------------- write

function assertEmptyOrReplace(destDir, replace) {
  if (!existsSync(destDir)) return;
  const entries = readdirSync(destDir);
  if (entries.length > 0 && !replace) {
    fail(`${destDir} already exists and is not empty; pass --replace to write into it anyway (existing files with the same bundle-relative name will be overwritten)`);
  }
}

// Copies every referenced file into a clearly-named, role-prefixed layout and
// writes the manifest with bundle-relative paths, so the folder is coherent on
// its own without the operator's original working directories.
export function writeBundle(manifest, destDir, { replace = false } = {}) {
  assertEmptyOrReplace(destDir, replace);
  mkdirSync(destDir, { recursive: true });
  mkdirSync(join(destDir, 'source'), { recursive: true });
  mkdirSync(join(destDir, 'narration'), { recursive: true });

  const written = [];
  const copy = (src, relDest) => {
    const dest = join(destDir, relDest);
    mkdirSync(dirname(dest), { recursive: true });
    copyFileSync(resolve(src), dest);
    written.push(relDest);
    return relDest;
  };

  const out = JSON.parse(JSON.stringify(manifest));
  out.render.path = copy(manifest.render.path, `render/final${extname(manifest.render.path) || '.mp4'}`);
  out.screenplay.path = copy(manifest.screenplay.path, `source/${basename(manifest.screenplay.path)}`);
  out.take.path = copy(manifest.take.path, `source/${basename(manifest.take.path)}`);
  out.narration.plan_path = copy(manifest.narration.plan_path, `source/${basename(manifest.narration.plan_path)}`);
  out.narration.beats = manifest.narration.beats.map((beat) => ({
    ...beat,
    path: copy(beat.path, `narration/${beat.id}${extname(beat.path) || '.wav'}`),
  }));
  if (manifest.music) {
    mkdirSync(join(destDir, 'music'), { recursive: true });
    out.music.cue_path = copy(manifest.music.cue_path, `music/${basename(manifest.music.cue_path)}`);
    out.music.track_path = copy(manifest.music.track_path, `music/${basename(manifest.music.track_path)}`);
  }

  const manifestPath = join(destDir, 'manifest.json');
  writeFileSync(manifestPath, JSON.stringify(out, null, 2));
  written.push('manifest.json');
  return { destDir, written, manifest: out };
}

// -------------------------------------------------------------------- cli

function usage() {
  console.log(`demo-bundle — assemble an editor-neutral edit-ready handoff

  --build --screenplay <screenplay.json> --take <take.json> [--source-take <raw_take.json>]
          --plan <narration-plan.json> --render <final.mp4>
          [--music <cue.json> --music-accept <acceptance.json>]
          --variant draft|accepted --out <bundle-dir> [--replace]
      Validate every input, copy it into a role-named folder layout, and write
      manifest.json. Refuses a rejected narration plan, a missing clip, an
      unaccepted or changed music cue, and an existing non-empty destination
      unless replacement is explicitly authorized. Does not produce a native
      editor project export.
`);
}

function flag(argv, name, fallback = null) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : fallback;
}

function main(argv) {
  if (argv.includes('--build')) {
    const screenplayPath = flag(argv, '--screenplay') ?? fail('--build needs --screenplay <screenplay.json>');
    const takePath = flag(argv, '--take') ?? fail('--build needs --take <take.json>');
    const sourceTakePath = flag(argv, '--source-take');
    const narrationPlanPath = flag(argv, '--plan') ?? fail('--build needs --plan <narration-plan.json>');
    const renderPath = flag(argv, '--render') ?? fail('--build needs --render <final.mp4>');
    const musicCuePath = flag(argv, '--music');
    const musicAcceptancePath = flag(argv, '--music-accept');
    const variant = flag(argv, '--variant') ?? fail('--build needs --variant draft|accepted');
    const out = flag(argv, '--out') ?? fail('--build needs --out <bundle-dir>');

    const manifest = buildBundleManifest({
      variant, screenplayPath, takePath, sourceTakePath, narrationPlanPath, renderPath, musicCuePath, musicAcceptancePath,
    });
    const result = writeBundle(manifest, out, { replace: argv.includes('--replace') });
    console.log(JSON.stringify(result.manifest, null, 2));
    console.log(`\nwrote ${result.written.length} file(s) to ${result.destDir}`);
    if (result.manifest.missing.length > 0) {
      console.log(`missing: ${result.manifest.missing.map((m) => `${m.component} (${m.reason})`).join('; ')}`);
    }
    return 0;
  }

  usage();
  return 2;
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('demo-bundle.mjs')) {
  try {
    process.exit(main(process.argv.slice(2)));
  } catch (error) {
    console.error(`demo-bundle: ${error.message}`);
    process.exit(1);
  }
}
