import assert from 'node:assert/strict';
import {execFileSync, spawnSync} from 'node:child_process';
import {
  copyFileSync,
  mkdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, join} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureParent = join(root, '.release-readiness-test-work');
const packageNames = ['kai-core', 'kai-engineering', 'kai-creative'];

function runGit(cwd, args) {
  return execFileSync('git', args, {cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe']});
}

function writeJson(path, value) {
  mkdirSync(dirname(path), {recursive: true});
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeReleaseInputs(repository, version, marketplaceNames = packageNames) {
  writeJson(join(repository, 'package.json'), {name: 'release-fixture', version});
  writeJson(join(repository, 'plugin.json'), {name: 'release-fixture', version});
  writeJson(join(repository, '.github', 'plugin', 'marketplace.json'), {
    metadata: {version},
    plugins: marketplaceNames.map(name => ({name, version})),
  });
  for (const name of packageNames) {
    writeJson(join(repository, 'plugins', name, 'plugin.json'), {name, version});
  }
  writeFileSync(join(repository, 'CHANGELOG.md'), [
    '# Changelog',
    '',
    `## [${version}] - 2026-10-08`,
    '',
    '- Candidate release.',
    '',
    '## [1.0.0] - 2026-10-07',
    '',
    '- Baseline release.',
    '',
  ].join('\n'));
}

function createRepository(name, marketplaceNames = packageNames) {
  const repository = join(fixtureParent, `${name}-${process.pid}`);
  rmSync(repository, {recursive: true, force: true});
  mkdirSync(join(repository, 'tools', 'lib'), {recursive: true});
  copyFileSync(
    join(root, 'tools', 'release-readiness.mjs'),
    join(repository, 'tools', 'release-readiness.mjs'),
  );
  copyFileSync(
    join(root, 'tools', 'lib', 'release.mjs'),
    join(repository, 'tools', 'lib', 'release.mjs'),
  );
  mkdirSync(join(repository, 'src'), {recursive: true});
  writeFileSync(join(repository, 'src', 'behavior.mjs'), 'export const value = 1;\n');
  writeReleaseInputs(repository, '1.0.0');

  runGit(repository, ['init', '--initial-branch=main']);
  runGit(repository, ['config', 'user.name', 'Release Test']);
  runGit(repository, ['config', 'user.email', 'release-test@example.invalid']);
  runGit(repository, ['config', 'core.autocrlf', 'false']);
  runGit(repository, ['config', 'core.safecrlf', 'false']);
  runGit(repository, ['add', '.']);
  runGit(repository, ['commit', '-m', 'baseline']);
  runGit(repository, ['tag', 'v1.0.0']);

  writeReleaseInputs(repository, '2.0.0', marketplaceNames);
  writeFileSync(join(repository, 'src', 'behavior.mjs'), 'export const value = 2;\n');
  runGit(repository, ['add', '.']);
  runGit(repository, ['commit', '-m', 'candidate']);
  return repository;
}

function runReadiness(repository) {
  return spawnSync(
    process.execPath,
    ['tools/release-readiness.mjs', '--base', 'v1.0.0', '--head', 'HEAD', '--json'],
    {cwd: repository, encoding: 'utf8'},
  );
}

test('release readiness reads all release inputs from the selected head ref', () => {
  const repository = createRepository('selected-ref');
  try {
    writeReleaseInputs(repository, '1.0.0');

    const result = runReadiness(repository);

    assert.equal(result.status, 0, result.stderr || result.stdout);
    const readiness = JSON.parse(result.stdout);
    assert.equal(readiness.ok, true);
    assert.match(readiness.notes, /Candidate release/);
  } finally {
    rmSync(repository, {recursive: true, force: true});
  }
});

test('release readiness fails when an expected marketplace package entry is missing', () => {
  const repository = createRepository(
    'missing-marketplace-entry',
    packageNames.filter(name => name !== 'kai-creative'),
  );
  try {
    const result = runReadiness(repository);

    assert.equal(result.status, 1, result.stderr || result.stdout);
    const readiness = JSON.parse(result.stdout);
    assert.equal(readiness.ok, false);
    assert.match(readiness.errors.join('\n'), /marketplace\.kai-creative/);
  } finally {
    rmSync(repository, {recursive: true, force: true});
  }
});

process.on('exit', () => {
  rmSync(fixtureParent, {recursive: true, force: true});
});
