import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {sourceSkillFiles} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const entry = sourceSkillFiles(root).find(skill => skill.id === 'kai-core-feedback');
const body = entry
  ? readFileSync(entry.path, 'utf8').replace(/\r\n/g, '\n')
  : '';

test('kai-core-feedback is a lean user-invocable Core skill', () => {
  assert.ok(entry, 'kai-core-feedback must exist');
  assert.equal(entry.pack, 'core');
  assert.match(body, /^user-invocable:\s*true$/m);
  assert.match(body, /^argument-hint:\s*"what Kai got wrong or missed"$/m);
  assert.ok(body.split('\n').length <= 125, 'kai-core-feedback must stay lean');
});

test('kai-core-feedback creates one confirmed public labeled issue', () => {
  assert.match(body, /public GitHub issue/i);
  assert.match(body, /gh auth status/);
  assert.match(body, /gh issue list --repo ketzalcode\/kai/);
  assert.match(body, /gh issue comment <number> --repo ketzalcode\/kai/);
  assert.match(body, /--label kai-feedback/);
  assert.match(body, /Obtain explicit confirmation before the external\s+write/);
  assert.match(body, /gh issue create --repo ketzalcode\/kai/);
  assert.match(body, /--body-file/);
});

test('kai-core-feedback preserves evidence and privacy without success fallbacks', () => {
  for (const heading of [
    'Expected Kai behavior',
    'Observed behavior',
    'Minimal reproduction',
    'Impact',
    'Evidence',
    'Suggested direction',
  ]) {
    assert.match(body, new RegExp(`## ${heading}`));
  }
  assert.match(body, /Never include secrets, tokens,\s+personal data/);
  assert.match(body, /return the exact error plus the public-safe\s+title\/body draft/);
  assert.match(body, /do not silently create an\s+unlabeled issue/);
});

test('kai-core-feedback does not authorize automated remediation', () => {
  assert.doesNotMatch(body, /copilot-swe-agent|\/agents\/repos|create_pull_request/);
  assert.match(body, /never adds an auto-fix label, assigns an agent, starts a cloud\s+session/);
});
