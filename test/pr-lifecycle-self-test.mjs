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
  assert.match(lead, /explicit multi-builder request/);
  assert.match(
    lead,
    /Review is optional unless the operator explicitly requests it/,
  );
  assert.doesNotMatch(lead, /A changed revision requires fresh review/);
  assert.match(lead, /blocking authority gap/);
  assert.match(lead, /operator\/owning authority/);
  assert.match(lead, /Never merge, deploy, tag, release/);
});

test('builders stop at implementation evidence handoff', () => {
  assert.equal(agents.has('eng-builder-frontend'), true);
  assert.equal(agents.has('eng-builder-backend'), true);
  assert.equal(agents.has('eng-builder-software'), false);
  assert.equal(agents.has('eng-builder-platform'), false);
  assert.equal(
    existsSync(join(
      root,
      'incubator',
      'kai-engineering',
      'agents',
      'eng-builder-platform.agent.md',
    )),
    true,
  );

  for (const id of ['eng-builder-frontend', 'eng-builder-backend']) {
    const body = readAgent(id);
    assert.doesNotMatch(body, /Apply `pr-sizing`/);
    assert.doesNotMatch(body, /Apply `pr-delivery`/);
    assert.match(body, /eng-lead-software/);
    assert.match(body, /changed-behavior tests|Tests for changed/);
    assert.match(body, /Apply `software-development`/);
    assert.match(body, /Apply `coding-standards`/);
  }

  const frontend = readAgent('eng-builder-frontend');
  assert.match(frontend, /Apply `frontend-coding-standards`/);
  assert.doesNotMatch(frontend, /Apply `backend-coding-standards`/);

  const backend = readAgent('eng-builder-backend');
  assert.match(backend, /Apply `backend-coding-standards`/);
  assert.doesNotMatch(backend, /Apply `frontend-coding-standards`/);
});

test('active engineering agents require explicit invocation', () => {
  for (const id of [
    'eng-builder-frontend',
    'eng-builder-backend',
    'eng-lead-software',
    'eng-reviewer-code',
    'eng-lead-technical-writing',
    'workflow-nightshift',
  ]) {
    assert.match(readAgent(id), /^disable-model-invocation:\s*true$/m);
  }
});

test('software development scales process and stops at evidence handoff', () => {
  const development = readSkill('software-development');
  assert.match(development, /^user-invocable:\s*true$/m);
  assert.match(
    development,
    /feature, fix, refactor, or behavior change/,
  );
  assert.match(development, /Do not use for review-only, PR merge/);
  assert.match(development, /Apply `coding-standards`/);
  assert.match(development, /Clear bounded change/);
  assert.match(development, /Material ambiguity/);
  assert.match(development, /Architecture or risky cross-cutting change/);
  assert.match(development, /Defect with uncertain cause/);
  assert.match(development, /strict red\/green/);
  assert.match(development, /Stabilize uncertain design before expanding tests/);
  assert.match(development, /named manual scenarios/);
  assert.match(development, /targeted tests by default/);
  assert.match(development, /evidence handoff/);
  assert.match(
    development,
    /Do not automatically start review, PR delivery,\s+merge, release, or deployment/,
  );
});

test('pr sizing uses the completed diff and reviewability boundaries', () => {
  const sizing = readSkill('pr-sizing');
  assert.match(sizing, /tools: \[execute, read, search\]/);
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
  assert.doesNotMatch(delivery, /principal-swe-\*/);
  assert.match(
    delivery,
    /\| Is the code correct and well-designed\? \| `eng-reviewer-code` \|/,
  );
  assert.match(
    delivery,
    /changed behavior, preserved behavior, scope boundary\/dependency, or evidence/,
  );
  assert.match(delivery, /rollout plan only when the change\s+has one/);
  assert.doesNotMatch(delivery, /rollout\/removal gates/);
  assert.doesNotMatch(delivery, /Verification names the command/);
  assert.match(delivery, /explicit merge instruction on an existing PR/);
  assert.match(
    delivery,
    /live draft, mergeability, required check, required review,\s+unresolved conversation/,
  );
  assert.match(delivery, /report the merge commit/);
  assert.match(
    delivery,
    /Do not restart review, testing, planning, or PR preparation solely because merge was requested/,
  );
  assert.match(delivery, /returns to `software-development`/);

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
    /CI owns commands, pass\/fail status, changing\s+counts, and revision-bound review results/,
  );
  assert.match(
    reference,
    /Do not add a separate\s+validation-results summary/,
  );
  assert.match(
    reference,
    /Include this section only when the PR has an actual rollout plan/,
  );
  assert.match(
    reference,
    /A removal, version change, or deferred follow-up by\s+itself does not trigger this section/,
  );
  assert.match(reference, /^## Overview$/m);
  assert.match(reference, /^## Scoped architecture$/m);
  assert.match(reference, /^## Validation scenarios$/m);
  assert.match(reference, /^## Rollout plan$/m);
  assert.doesNotMatch(reference, /^## Rollout and removal gates$/m);
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
  assert.match(review, /report relevant defects directly/);
  assert.doesNotMatch(
    review,
    /eng-reviewer-(security|privacy-compliance|reliability|quality)/,
  );
  assert.match(reviewer, /Do not spawn another reviewer/);
});

test('pr-review skips docs and metadata-only changes', () => {
  const review = readSkill('pr-review');
  assert.match(review, /documentation or metadata-only changes skip code-only lenses/);
});

test('pr-review keeps relevant risk lenses in one general review', () => {
  const review = readSkill('pr-review');
  assert.match(
    review,
    /security, privacy, reliability, accessibility, localization, and\s+assembled acceptance/,
  );
  assert.doesNotMatch(review, /Route .* to .*owner/);
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

test('specialist and incident agents are removed from the active surface', () => {
  for (const id of [
    'eng-advisor-investigation',
    'eng-reviewer-security',
    'eng-reviewer-privacy-compliance',
    'eng-reviewer-reliability',
    'eng-reviewer-quality',
    'workflow-incident-response',
    'workflow-ship',
  ]) {
    assert.equal(agents.has(id), false);
  }
  assert.equal(
    existsSync(join(
      root,
      'incubator',
      'kai-engineering',
      'agents',
      'workflow-ship.agent.md',
    )),
    true,
  );
});

test('README overview reflects the released engineering surface', () => {
  const readme = readFileSync(join(root, 'README.md'), 'utf8')
    .replace(/\r\n/g, '\n');
  const overview = readme.slice(0, readme.indexOf('\n## Install'));

  assert.match(overview, /lean, quality-first suite of specialized agents and skills/);
  assert.match(overview, /Kai keeps direct work direct/);
  assert.match(overview, /agent-to-agent software collaboration/);
  assert.match(overview, /\|\s*6 agents\s*\|/);
  assert.match(overview, /\|\s*13 skills\s*\|/);
  assert.match(
    overview,
    /\| `kai-engineering` \| 6 \/ 13 \| Frontend and backend implementation, bounded unattended delivery, selective review, technical writing, and explicit delivery \|/,
  );
  assert.doesNotMatch(overview, /eng-builder-software|workflow-ship|eng-reviewer-quality/);
});
