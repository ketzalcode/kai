import assert from 'node:assert/strict';
import {test} from 'node:test';
import {
  evaluateReleaseReadiness,
  extractReleaseNotes,
} from '../tools/lib/release.mjs';

const changelog = [
  '# Changelog',
  '',
  '## [20.0.0] - 2026-10-08',
  '',
  '### Changed',
  '',
  '- Simplified Kai development.',
  '',
  '## [19.0.0] - 2026-10-07',
  '',
  '- Previous release.',
].join('\n');

const generatedVersions = {
  'plugin.json': '20.0.0',
  'marketplace.metadata': '20.0.0',
  'marketplace.kai-core': '20.0.0',
  'marketplace.kai-engineering': '20.0.0',
  'marketplace.kai-creative': '20.0.0',
  'plugins/kai-core/plugin.json': '20.0.0',
  'plugins/kai-engineering/plugin.json': '20.0.0',
  'plugins/kai-creative/plugin.json': '20.0.0',
};

const evaluate = (overrides = {}) => evaluateReleaseReadiness({
  changedFiles: ['src/core/workspace-doctor.mjs'],
  currentVersion: '20.0.0',
  latestVersion: '19.0.0',
  changelog,
  generatedVersions,
  ...overrides,
});

test('docs-only changes need no version bump', () => {
  const result = evaluate({
    changedFiles: ['README.md', 'docs/architecture.md'],
    currentVersion: '19.0.0',
  });
  assert.deepEqual(result, {
    ok: true, release: false, reason: 'no-release-needed', errors: [], notes: '',
  });
});

test('behavior changes require a forward package version', () => {
  assert.match(evaluate({currentVersion: '19.0.0'}).errors.join('\n'), /forward version/);
});

test('README changes are not required', () => {
  assert.equal(evaluate().ok, true);
});

test('generated versions must all equal package.json', () => {
  const result = evaluate({generatedVersions: {...generatedVersions, 'plugin.json': '19.0.0'}});
  assert.match(result.errors.join('\n'), /plugin\.json has 19\.0\.0/);
});

test('all expected generated version keys are required', () => {
  for (const key of Object.keys(generatedVersions)) {
    const missing = {...generatedVersions};
    delete missing[key];
    assert.match(
      evaluate({generatedVersions: missing}).errors.join('\n'),
      new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${key} must be required`,
    );
  }
});

test('release notes contain only the selected version section', () => {
  assert.equal(
    extractReleaseNotes(changelog, '20.0.0'),
    '### Changed\n\n- Simplified Kai development.',
  );
});

test('an already tagged version is not release-ready', () => {
  assert.match(evaluate({latestVersion: '20.0.0'}).errors.join('\n'), /forward version/);
});
