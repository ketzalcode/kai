import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';

const block = readFileSync(
  new URL('../src/core/lib/repository-instructions-block.md', import.meta.url),
  'utf8',
);
const agents = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
const onboarding = readFileSync(
  new URL('../plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md', import.meta.url),
  'utf8',
);

test('the canonical repository block has stable managed markers', () => {
  assert.match(block, /^<!-- >>> kai repository instructions /);
  assert.match(block, /<!-- <<< kai repository instructions <<< -->\s*$/);
});

test('Kai dogfoods the exact canonical block', () => {
  assert.equal(agents.includes(block.trim()), true);
});

test('onboarding covers absent and existing AGENTS.md without staging it', () => {
  assert.match(onboarding, /If `AGENTS\.md` does not exist, create it/);
  assert.match(onboarding, /replace only the marked Kai region/);
  assert.match(onboarding, /never stage or commit/i);
});
