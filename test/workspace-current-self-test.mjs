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

test('the workspace contract exposes only schema 6 and separate runtime databases', () => {
  assert.equal(WORKSPACE_CONTRACT.schemaVersion, 6);
  assert.equal(
    WORKSPACE_CONTRACT.coordinationDatabase,
    '.kai/core/runtime/coordination.sqlite',
  );
  assert.equal(
    WORKSPACE_CONTRACT.projectDatabase,
    '.kai/project-management/runtime/project.sqlite',
  );
  assert.equal(Object.hasOwn(WORKSPACE_CONTRACT, 'legacyDatabase'), false);
});

test('this repository uses the current private workspace ignore block', () => {
  const gitignore = readFileSync(new URL('../.gitignore', import.meta.url), 'utf8');
  assert.match(gitignore, /managed by kai-core-workspace-onboarding/);
  assert.match(gitignore, /^\/\.kai\/$/m);
  assert.match(gitignore, /^\/\.kai-retired-\*\/$/m);
  assert.match(gitignore, /^\*\*\/storageState\*\.json$/m);
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
  assert.match(skill, /apply\s+`kai-core-workspace-paths`/i);
  assert.match(skill, /Before confirmation[\s\S]*links[\s\S]*junctions[\s\S]*aliases[\s\S]*network\s+paths[\s\S]*nested Git roots[\s\S]*non-canonical/i);
  assert.match(skill, /Immediately before the rename[\s\S]*repeat the same path-safety validation/i);
  assert.match(skill, /source and destination/i);
});

test('force re-onboarding requires a tracked-change preview and separate operator approval', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /`--force` is a request for the guarded force path, not approval/i);
  assert.match(skill, /exact tracked paths/i);
  assert.match(skill, /expected Git disposition/i);
  assert.match(skill, /explicit operator approval[\s\S]*after[\s\S]*preview/i);
  assert.match(skill, /repeat[\s\S]*tracking check/i);
  assert.match(skill, /git rm --cached -r -- \.kai/);
  assert.match(skill, /Verify `git ls-files -- \.kai` is empty\s+before onboarding/);
  assert.match(skill, /Apart from the approved index removal, never stage changes/);
  assert.match(skill, /Never\s+commit, push, or rewrite history/i);
  assert.match(skill, /git status --short/);
});

test('force re-onboarding relaxes only tracked legacy structure refusal', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /tracked legacy files and unsupported structure\s+inside the exact retirement source/i);
  assert.match(skill, /does not relax[\s\S]*path-safety[\s\S]*privacy[\s\S]*collision/i);
  assert.match(skill, /Do not open any file beneath the retired directory after the rename/);
  assert.match(skill, /Preserve `docs\/kai\/` byte-for-byte/);
});

test('re-onboarding initializes optional runtimes only when requested', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /Core onboarding creates no optional runtime/);
  assert.match(skill, /Project Management[\s\S]*only when the operator explicitly requested it/);
  assert.match(skill, /project\.mjs" init[\s\S]*--root "<workspace-root>"/);
  assert.match(skill, /workspace-doctor\.mjs"[\s\S]*coordinate\.mjs" inspect/);
  assert.match(skill, /Never infer optional package state from the\s+retired workspace/);
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

test('workspace onboarding loads acting immediately before mutation', () => {
  const onboarding = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md', import.meta.url),
    'utf8',
  );
  const approval = onboarding.indexOf('Obtain explicit approval');
  const acting = onboarding.indexOf('Apply `kai-core-work-acting`');
  const mutation = onboarding.indexOf('Run the confirmed standalone initializer');
  assert.ok(approval !== -1, 'onboarding must retain the approval gate');
  assert.ok(acting > approval, 'acting must load after approval');
  assert.ok(mutation > acting, 'acting must load immediately before the initializer mutation');
});

test('current runtime contains no executable historical compatibility branches', () => {
  const workStatus = readFileSync(
    new URL('../src/core/work-status.mjs', import.meta.url),
    'utf8',
  );
  const coordination = readFileSync(
    new URL('../src/core/lib/coordination.mjs', import.meta.url),
    'utf8',
  );
  const reportCapture = readFileSync(
    new URL('../src/core/lib/coordination-runtime/report-capture.mjs', import.meta.url),
    'utf8',
  );
  const reportSafety = readFileSync(
    new URL('../src/core/lib/coordination-runtime/report-safety.mjs', import.meta.url),
    'utf8',
  );
  const granting = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-work-granting/SKILL.md', import.meta.url),
    'utf8',
  );

  assert.doesNotMatch(workStatus, /\.kai\/state\/items|function readItems|function readThread/);
  assert.doesNotMatch(coordination, /Historical schema|Backward-compatible|function frontmatter|function parseThread/);
  assert.doesNotMatch(reportCapture, /store\.schemaVersion|item_id/);
  assert.doesNotMatch(reportSafety, /Legacy preview metadata/);
  assert.doesNotMatch(granting, /\bmigrat(?:e|ion)\b/i);
});
