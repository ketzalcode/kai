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
  assert.match(gitignore, /^\/\.kai-migration-\*\/$/m);
  assert.doesNotMatch(gitignore, /\.kai-retired/);
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

test('re-onboarding reshapes durable content and rebuilds runtime state', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /Preserve every existing `docs\/kai\/` file/);
  assert.match(skill, /account for every source path exactly once/i);
  assert.match(skill, /durable knowledge and artifacts/i);
  assert.match(skill, /legacy `\.kai\/CONVENTIONS\.md` as durable candidate content/i);
  assert.match(skill, /project `AGENTS\.md`[\s\S]*outside Kai's managed region/i);
  assert.match(skill, /legacy initiative artifacts, decisions, briefs, and designs/i);
  assert.match(skill, /rebuild current Core runtime state/i);
  assert.match(skill, /Do not import historical leases/);
  assert.match(skill, /completed\s+coordination events/i);
  assert.match(skill, /delete the exact\s+temporary staging directory/i);
  assert.match(skill, /existing `\.kai-retired-\*`\s+directories[\s\S]*migration input/i);
  assert.match(skill, /Never create another retired directory/);
  assert.match(skill, /delete[\s\S]*every exact `\.kai-retired-\*` input[\s\S]*final managed ignore block without the\s+retired-path rule/i);
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
  assert.match(skill, /never creates? project-local `\.kai\/` state/i);
  assert.doesNotMatch(skill, /source: `<project>\/\.kai\/`/);
});

test('re-onboarding repeats the current path-safety contract before confirmation and rename', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /apply\s+`kai-core-workspace-paths`/i);
  assert.match(skill, /Before confirmation[\s\S]*links[\s\S]*junctions[\s\S]*aliases[\s\S]*network\s+paths[\s\S]*nested Git roots[\s\S]*non-canonical/i);
  assert.match(skill, /Immediately before mutation[\s\S]*repeat the same path-safety/i);
  assert.match(skill, /source,\s+staging, final private destinations, and public destinations/i);
});

test('force re-onboarding requires a tracked-change preview and separate operator approval', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /`--force` is a request[\s\S]*not approval/i);
  assert.match(skill, /exact tracked paths/i);
  assert.match(skill, /expected staged deletion/i);
  assert.match(skill, /explicit operator approval[\s\S]*after[\s\S]*preview/i);
  assert.match(skill, /repeat the same path-safety, tracking/i);
  assert.match(skill, /git rm --cached -r --ignore-unmatch -- \.kai \.kai-retired-\*/);
  assert.match(skill, /Verify `git ls-files -- \.kai \.kai-retired-\*` is empty\s+before initialization/);
  assert.match(skill, /Apart from the approved index removal, never stage\s+changes/);
  assert.match(skill, /Never\s+commit, push, or rewrite history/i);
  assert.match(skill, /git status --short/);
});

test('force re-onboarding relaxes only tracked legacy structure refusal', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /tracked\s+legacy files and unsupported structure\s+inside the exact migration source/i);
  assert.match(skill, /does not relax[\s\S]*path-safety[\s\S]*privacy[\s\S]*collision/i);
  assert.match(skill, /temporary staging directory/i);
  assert.match(skill, /Preserve every existing `docs\/kai\/` file byte-for-byte/);
});

test('re-onboarding initializes optional runtimes only when requested', () => {
  const skill = readFileSync(
    new URL('../plugins/kai-core/skills/kai-core-workspace-reonboard/SKILL.md', import.meta.url),
    'utf8',
  );
  assert.match(skill, /Initialize Project Management only when the operator explicitly requested/i);
  assert.match(skill, /project\.mjs" init[\s\S]*--root "<workspace-root>"/);
  assert.match(skill, /workspace-doctor\.mjs"[\s\S]*coordinate\.mjs" inspect/);
  assert.match(skill, /Never infer optional package state from the\s+source workspace/);
});

test('active workspace guidance contains no retired backup contract', () => {
  const paths = [
    '../AGENTS.md',
    '../.gitignore',
    '../README.md',
    '../docs/architecture.md',
    '../docs/workspaces.md',
    '../docs/kai/README.md',
    '../plugins/kai-core/skills/kai-core-workspace-paths/SKILL.md',
    '../plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md',
    '../plugins/kai-core/skills/kai-core-workspace-onboarding/references/workspace-initialization.md',
  ];
  for (const path of paths) {
    const content = readFileSync(new URL(path, import.meta.url), 'utf8');
    assert.doesNotMatch(content, /\.kai-retired|retired workspace backup/i, path);
  }
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
