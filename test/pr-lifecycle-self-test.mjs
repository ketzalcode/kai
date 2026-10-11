import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  sourceAgentFiles,
  sourceSkillFiles,
} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readEntries = entries => new Map(entries.map(entry => [
  entry.id,
  readFileSync(entry.path, 'utf8').replace(/\r\n/g, '\n'),
]));
const agents = readEntries(sourceAgentFiles(root));
const skills = readEntries(sourceSkillFiles(root));
const readAgent = id => {
  assert.ok(agents.has(id), `active agent ${id} must exist`);
  return agents.get(id);
};
const readSkill = id => {
  assert.ok(skills.has(id), `active skill ${id} must exist`);
  return skills.get(id);
};

test('software lead is the single active PR integration owner', () => {
  assert.equal(agents.has('eng-lead-software'), true);
  assert.equal(agents.has('workflow-pull-request'), false);
  assert.equal(agents.has('eng-lead-architecture'), false);
  assert.equal(
    existsSync(join(
      root,
      'incubator',
      'kai-engineering',
      'agents',
      'eng-lead-architecture.agent.md',
    )),
    true,
  );

  const lead = readAgent('eng-lead-software');
  assert.match(lead, /Apply `kai-core-work-granting`/);
  assert.match(lead, /Apply `pr-sizing` after integration, when the complete diff exists/);
  assert.match(lead, /Apply `pr-delivery`/);
  assert.match(lead, /eng-reviewer-code/);
  assert.match(lead, /Never merge, deploy, tag, release/);
});

test('builders stop at implementation evidence handoff', () => {
  for (const id of ['eng-builder-software', 'eng-builder-platform']) {
    const body = readAgent(id);
    assert.doesNotMatch(body, /Apply `pr-sizing`/);
    assert.doesNotMatch(body, /Apply `pr-delivery`/);
    assert.match(body, /eng-lead-software/);
    assert.match(body, /changed-behavior tests|Tests for changed/);
  }
});

test('pr sizing uses the completed diff and reviewability boundaries', () => {
  const sizing = readSkill('pr-sizing');
  assert.match(sizing, /complete integrated diff/);
  assert.match(sizing, /four or five primary hand-authored files/);
  assert.match(sizing, /signal, not a cap/);
  assert.match(
    sizing,
    /Do not split solely because one part is client-side and another is server-side/,
  );
  assert.match(sizing, /independently valid and testable/);
});

test('pr delivery reads the shared description reference', () => {
  const delivery = readSkill('pr-delivery');
  assert.match(delivery, /references\/pr-description\.md/);
  assert.match(delivery, /opens and prepares/);
  assert.doesNotMatch(delivery, /opens and lands/);
  assert.match(
    delivery,
    /changed behavior, preserved behavior, scope boundary\/dependency, or evidence/,
  );

  const reference = readFileSync(join(
    root,
    'plugins',
    'kai-engineering',
    'skills',
    'pr-delivery',
    'references',
    'pr-description.md',
  ), 'utf8').replace(/\r\n/g, '\n');
  assert.match(
    reference,
    /When a fact is not settled,[\s\S]*Pending decision[\s\S]*Not applicable/,
  );
  assert.match(
    reference,
    /Include one small ASCII diagram only when caller flow, ownership, state, or/,
  );
  assert.match(
    reference,
    /dependency order is materially clearer visually;/,
  );
  assert.match(
    reference,
    /omit the section when it adds/,
  );
  assert.match(
    reference,
    /no information\./,
  );
  assert.match(
    reference,
    /Add rollout and removal gates only when[\s\S]*those cases apply\./,
  );
  assert.match(reference, /^## Overview$/m);
  assert.match(reference, /^## Scoped architecture$/m);
  assert.match(reference, /^## Validation scenarios$/m);
  assert.match(reference, /^## Rollout and removal gates$/m);
  for (const scenario of [
    'Default/inactive',
    'Enabled success',
    'Compatibility/error',
    'Rollback',
  ]) {
    assert.match(reference, new RegExp(scenario.replace('/', '\\/')));
  }
});

test('review requests route through the reviewer and internal review method', () => {
  const reviewer = readAgent('eng-reviewer-code');
  assert.match(reviewer, /Apply `pr-review`/);
  assert.match(reviewer, /Apply `pr-review-comments`/);

  const review = readSkill('pr-review');
  assert.doesNotMatch(review, /^user-invocable:\s*true$/m);
  assert.match(review, /Purpose:/);
  assert.match(review, /Changed behavior:/);
  assert.match(review, /Affected surfaces:/);
  assert.match(review, /Risk signals:/);
  assert.match(review, /specialist verdict/);
});

test('pr-review skips docs and metadata-only changes', () => {
  const review = readSkill('pr-review');
  assert.match(review, /documentation or metadata-only changes skip code-only lenses/);
});

test('pr-review routes assembled acceptance to quality', () => {
  const review = readSkill('pr-review');
  assert.match(review, /Route assembled UI, API, CLI, or system acceptance to quality when\s+applicable\./);
  assert.doesNotMatch(review, /assembled UI, API, CLI, or system behavior may require quality review/);
});

test('pr-review handles stacked PR parent revisions', () => {
  const review = readSkill('pr-review');
  assert.match(review, /review each slice against its real parent revision/);
  assert.match(review, /A changed PR head invalidates prior review comments and verdicts tied to the old revision/);
});

test('review comments return structured finding records', () => {
  const comments = readSkill('pr-review-comments');
  assert.match(comments, /^user-invocable:\s*true$/m);
  assert.match(comments, /Both draft and post-ready outputs include:/);
  assert.match(comments, /Finding: <stable finding identifier>/);
  assert.match(comments, /Location: <file and changed line, or general review>/);
  assert.match(comments, /Kind: <question \| change-request \| required-change>/);
  assert.match(comments, /Comment: <comment text>/);
  assert.match(comments, /Authorization: <supplied source or required>/);
  assert.match(comments, /There is no mandatory `Suggestion:` label/);
  assert.match(comments, /Without GitHub write authorization, return drafts/);
  assert.match(comments, /verify that the PR head still matches/);
});

test('review comments use tone rules for questions and required outcomes', () => {
  const comments = readSkill('pr-review-comments');
  assert.match(comments, /Uncertain intent/);
  assert.match(comments, /Ask a question only when intent, ownership, or the corrective choice is genuinely unresolved/);
  assert.match(comments, /Verified defect with corrective options/);
  assert.match(comments, /Required change/);
  assert.match(comments, /State a required outcome directly when evidence settles it/);
});

test('specialist reviewers share comment communication, not review judgment', () => {
  for (const id of [
    'eng-reviewer-security',
    'eng-reviewer-privacy-compliance',
    'eng-reviewer-reliability',
    'eng-reviewer-quality',
  ]) {
    const body = readAgent(id);
    assert.match(body, /Apply `pr-review-comments`/);
    assert.doesNotMatch(body, /Apply `pr-review`/);
  }
});
