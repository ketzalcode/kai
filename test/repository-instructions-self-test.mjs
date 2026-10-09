import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {
  CLOSE_REPOSITORY_INSTRUCTIONS,
  extractRepositoryInstructions,
} from '../tools/lib/repository-instructions.mjs';

const block = readFileSync(
  new URL('../src/core/lib/repository-instructions-block.md', import.meta.url),
  'utf8',
);
const agents = readFileSync(new URL('../AGENTS.md', import.meta.url), 'utf8');
const onboarding = readFileSync(
  new URL('../plugins/kai-core/skills/kai-core-workspace-onboarding/SKILL.md', import.meta.url),
  'utf8',
);

function assertExactManagedRegion(document, canonical = block) {
  assert.equal(extractRepositoryInstructions(document), canonical);
}

test('the canonical repository block has stable managed markers', () => {
  assert.match(block, /^<!-- >>> kai repository instructions /);
  assert.match(block, /<!-- <<< kai repository instructions <<< -->\s*$/);
});

test('Kai dogfoods the exact canonical block', () => {
  assertExactManagedRegion(agents);
});

test('the exact managed-region check rejects line-ending drift', () => {
  const differentLineEndings = block.includes('\r\n')
    ? block.replaceAll('\r\n', '\n')
    : block.replaceAll('\n', '\r\n');

  assert.throws(() => assertExactManagedRegion(differentLineEndings), {
    name: 'AssertionError',
  });
});

test('the exact managed-region check rejects boundary-byte drift', () => {
  const differentBoundary = block.replace(
    CLOSE_REPOSITORY_INSTRUCTIONS,
    `${CLOSE_REPOSITORY_INSTRUCTIONS} `,
  );

  assert.throws(() => assertExactManagedRegion(differentBoundary), {
    name: 'AssertionError',
  });
});

test('onboarding covers absent and existing AGENTS.md without staging it', () => {
  assert.match(onboarding, /If `AGENTS\.md` does not exist, create it/);
  assert.match(onboarding, /replace only the marked Kai region/);
  assert.match(onboarding, /never stage or commit/i);
});
