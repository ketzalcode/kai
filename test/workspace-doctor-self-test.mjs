import assert from 'node:assert/strict';
import {mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {spawnSync} from 'node:child_process';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  checkWorkspace,
  initializeWorkspace,
} from '../src/core/workspace-doctor.mjs';

const doctor = fileURLToPath(new URL('../src/core/workspace-doctor.mjs', import.meta.url));

const direction = [
  '# Vision',
  'A composable private workspace.',
  '',
  '# Mission',
  'Coordinate exact work safely.',
  '',
  '# Current Goal',
  'Activate schema 5 by 2026-10-31.',
  '',
  '# Out of Scope',
  '- Historical record migration.',
  '',
].join('\n');

function manifest(overrides = {}) {
  return {
    plugin: 'kai-core',
    version: 'test',
    schema_version: 5,
    scaffolded: '2026-10-08',
    workspace_id: 'stable-workspace-id',
    placement: 'repo-local',
    workspace_root: '.',
    private_root: '.kai',
    direction: 'docs/kai/DIRECTION.md',
    projects: [{
      id: 'default',
      path: '.',
      publication_root: 'docs/kai',
    }],
    ...overrides,
  };
}

function workspace(run) {
  const root = mkdtempSync(join(tmpdir(), 'kai-current-doctor-'));
  try {
    spawnSync('git', ['init', '--quiet', root], {windowsHide: true});
    writeFileSync(join(root, '.gitignore'), '/.kai/\n/.kai-retired-*/\n');
    mkdirSync(join(root, 'docs', 'kai'), {recursive: true});
    writeFileSync(join(root, 'docs', 'kai', 'DIRECTION.md'), direction);
    return run(root);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
}

test('the standalone initializer requires explicit confirmation', () => workspace(root => {
  const result = initializeWorkspace({root, manifest: manifest()});
  assert.equal(result.ok, false);
  assert.equal(result.code, 'AUTHORITY_REQUIRED');
}));

test('a confirmed initialization creates a healthy schema-5 workspace', () => workspace(root => {
  const result = initializeWorkspace({root, manifest: manifest(), confirm: true});
  assert.equal(result.ok, true, result.reason);
  assert.equal(checkWorkspace(root).errors.length, 0);
  assert.equal(JSON.parse(readFileSync(join(root, '.kai', 'manifest.json'))).schema_version, 5);
}));

test('schema 5 rejects retired manifest aliases', () => workspace(root => {
  const result = initializeWorkspace({root, manifest: manifest(), confirm: true});
  assert.equal(result.ok, true, result.reason);
  const path = join(root, '.kai', 'manifest.json');
  const current = JSON.parse(readFileSync(path));
  writeFileSync(path, `${JSON.stringify({...current, runs: '.kai/runs'}, null, 2)}\n`);
  assert.match(checkWorkspace(root).errors.join('\n'), /unexpected key "runs"/i);
}));

test('unsupported manifests route to re-onboarding', () => workspace(root => {
  mkdirSync(join(root, '.kai'), {recursive: true});
  writeFileSync(join(root, '.kai', 'manifest.json'), '{"schema_version":4}\n');
  const result = checkWorkspace(root);
  assert.match(result.errors.join('\n'), /SCHEMA_MISMATCH/);
  assert.match(result.errors.join('\n'), /kai-core-workspace-reonboard/);
}));

test('doctor entrypoint preserves schema, recovery, and invalid-input taxonomy', () => {
  const cases = [
    {
      code: 'SCHEMA_MISMATCH',
      prepare(root) {
        mkdirSync(join(root, '.kai'), {recursive: true});
        writeFileSync(join(root, '.kai', 'manifest.json'), '{"schema_version":4}\n');
      },
    },
    {
      code: 'RECOVERY_REQUIRED',
      prepare(root) {
        const result = initializeWorkspace({root, manifest: manifest(), confirm: true});
        assert.equal(result.ok, true, result.reason);
        writeFileSync(join(root, '.kai', 'core', 'runtime', 'coordination.sqlite'), 'not sqlite\n');
      },
    },
    {
      code: 'INVALID_INPUT',
      prepare(root) {
        const result = initializeWorkspace({root, manifest: manifest(), confirm: true});
        assert.equal(result.ok, true, result.reason);
        const path = join(root, '.kai', 'manifest.json');
        const current = JSON.parse(readFileSync(path));
        writeFileSync(path, `${JSON.stringify({...current, runs: '.kai/runs'}, null, 2)}\n`);
      },
    },
  ];

  for (const {code, prepare} of cases) {
    workspace(root => {
      prepare(root);
      const json = spawnSync(process.execPath, [doctor, '--root', root, '--json'], {encoding: 'utf8'});
      assert.notEqual(json.status, 0, code);
      const result = JSON.parse(json.stdout);
      assert.equal(result.code, code);
      assert.match(result.errors.join('\n'), new RegExp(`^${code}:`, 'm'));

      const human = spawnSync(process.execPath, [doctor, '--root', root], {encoding: 'utf8'});
      assert.notEqual(human.status, 0, code);
      assert.match(human.stdout, new RegExp(`${code}:`));
    });
  }
});
