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
  assert.match(
    block,
    /^<!-- >>> kai repository instructions \(managed by kai-core-workspace-onboarding\) >>> -->/,
  );
  assert.match(block, /<!-- <<< kai repository instructions <<< -->\s*$/);
});

test('Kai dogfoods the exact canonical block', () => {
  assertExactManagedRegion(agents);
});

test('the canonical block defines lean development without Superpowers', () => {
  assert.match(block, /Kai keeps direct work direct/);
  assert.match(block, /Use the current checkout for a small, isolated change when it is safe/);
  assert.match(block, /`<git-root>\/\.worktrees\/<short-name>`/);
  assert.match(block, /Never create a sibling top-level worktree folder/);
  assert.match(block, /focused TDD/);
  assert.match(block, /targeted automated checks\s+and named manual scenarios/);
  assert.match(block, /proportionate validation/);
  assert.doesNotMatch(block, /Superpowers/);
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
  assert.match(onboarding, /If\s+`AGENTS\.md` does not exist, create it/);
  assert.match(onboarding, /replace\s+only\s+the\s+marked\s+Kai\s+region/);
  assert.match(onboarding, /never stage or commit/i);
});
