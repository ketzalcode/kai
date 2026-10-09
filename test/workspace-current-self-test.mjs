import assert from 'node:assert/strict';
import {mkdtempSync, mkdirSync, readFileSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {test} from 'node:test';
import {
  WORKSPACE_CONTRACT,
  workspaceRootFromCoordinationDatabase,
} from '../src/core/lib/workspace-layout.mjs';

test('the workspace contract exposes only schema 5', () => {
  assert.equal(WORKSPACE_CONTRACT.schemaVersion, 5);
  assert.equal(Object.hasOwn(WORKSPACE_CONTRACT, 'legacyDatabase'), false);
});

test('only the current coordination database resolves a workspace root', () => {
  const root = join(tmpdir(), 'kai-current-root');
  assert.equal(
    workspaceRootFromCoordinationDatabase(join(root, '.kai', 'core', 'runtime', 'coordination.sqlite')),
    root,
  );
  assert.throws(
    () => workspaceRootFromCoordinationDatabase('C:\\repo\\.kai\\state\\coordination.sqlite'),
    /current workspace location/,
  );
});

test('an old manifest is rejected with re-onboarding guidance', () => {
  const root = mkdtempSync(join(tmpdir(), 'kai-old-workspace-'));
  mkdirSync(join(root, '.kai'), {recursive: true});
  writeFileSync(join(root, '.kai', 'manifest.json'), '{"schema_version":4}\n');
  const result = spawnSync(process.execPath, [
    fileURLToPath(new URL('../src/core/workspace-doctor.mjs', import.meta.url)),
    '--root', root, '--json',
  ], {encoding: 'utf8'});
  assert.notEqual(result.status, 0);
  assert.match(`${result.stdout}\n${result.stderr}`, /kai-core-workspace-reonboard/);
});

test('re-onboarding instructions preserve public docs and import no records', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /Preserve `docs\/kai\/`/);
  assert.match(skill, /Never import records/);
  assert.match(skill, /\/\.kai-retired-\*\//);
});
