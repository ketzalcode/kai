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
import {inspectRuntime} from '../src/core/lib/coordination-runtime/inspection.mjs';
import {checkWorkspace} from '../src/core/workspace-doctor.mjs';

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

test('re-onboarding branches on placement and keeps external private state outside the project', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /Branch on the resolved manifest `placement`/);
  assert.match(skill, /For `repo-local`/);
  assert.match(skill, /For `external`/);
  assert.match(skill, /`<workspace-root>\/\.kai\/`/);
  assert.match(skill, /target project(?:'s)? `docs\/kai\/`/i);
  assert.match(skill, /never\s+create project-local `\.kai\/` state/i);
  assert.doesNotMatch(skill, /source: `<project>\/\.kai\/`/);
});

test('re-onboarding repeats the current path-safety contract before confirmation and rename', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /Load\s+`kai-core-workspace-paths`/);
  assert.match(skill, /Before confirmation[\s\S]*links[\s\S]*junctions[\s\S]*aliases[\s\S]*network\s+paths[\s\S]*nested Git roots[\s\S]*non-canonical/i);
  assert.match(skill, /Immediately before the rename[\s\S]*repeat the same path-safety validation/i);
  assert.match(skill, /source and destination/i);
});

test('current inspection responses expose no migration shim or initiative compatibility branch', () => {
  const root = mkdtempSync(join(tmpdir(), 'kai-current-shims-'));
  assert.equal(Object.hasOwn(checkWorkspace(root), 'migrations'), false);
  assert.equal(Object.hasOwn(inspectRuntime(root), 'migrations'), false);
  const store = readFileSync(
    new URL('../src/core/lib/coordination-runtime/store.mjs', import.meta.url),
    'utf8',
  );
  assert.doesNotMatch(store, /recordKind === 'initiative'/);
});
