import assert from 'node:assert/strict';
import {
  existsSync, readFileSync, mkdtempSync, mkdirSync, writeFileSync, rmSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  sourceAgentFiles, sourceSkillFiles, materializePacks, collectReferences,
} from '../scripts/lib/pack-plan.mjs';
import {
  incubatedIds, documentationReferenceExists,
} from '../scripts/lib/incubation-contract.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const keep = [
  'build-diagrams', 'coding-style', 'onboard-to-codebase',
  'pr-sizing', 'research-before-coding',
].sort();
const parked = [
  'doc-review-rigor', 'review-security-privacy', 'review-rollout-operability',
  'review-rationale', 'review-alternatives', 'review-risks-scope',
  'review-dependencies', 'review-performance-scale',
  'review-success-metrics', 'review-ux-accessibility',
];
const skills = sourceSkillFiles(root).filter(entry => entry.pack === 'engineering');
assert.deepEqual(skills.map(entry => entry.id).sort(), keep);
const codingStyleBody = readFileSync(
  join(root, 'plugins', 'kai-engineering', 'skills', 'coding-style', 'SKILL.md'),
  'utf8',
);
const prohibitedCodingStyleDirectives = [
  'single-responsibility',
  'research-before-coding',
  'Scan 2–3 nearby files',
  'Inline comments: ≤1 line',
  'docs: ≤2–3 lines',
];
assert.deepEqual(
  prohibitedCodingStyleDirectives.filter(directive => codingStyleBody.includes(directive)),
  [],
  'coding-style must remain context-only and avoid cross-skill or fixed-quota directives',
);
const agents = sourceAgentFiles(root);
assert.ok(!agents.some(entry => entry.id === 'workflow-doc-review'));
const retainedAgents = [
  'eng-lead-technical-writing', 'principal-ai-applied-engineer',
  'principal-ai-researcher', 'principal-data-engineer',
  'principal-privacy-compliance', 'principal-qa-ui', 'principal-security',
  'principal-solutions-architect', 'principal-sre', 'principal-swe-architect',
  'principal-swe-backend', 'principal-swe-frontend', 'principal-swe-infra',
  'principal-swe-manager', 'workflow-incident-response', 'workflow-issue-analysis',
  'workflow-localization', 'workflow-pull-request', 'workflow-ship',
].sort();
assert.deepEqual(agents.filter(entry => entry.pack === 'engineering')
  .map(entry => entry.id).sort(), retainedAgents);
for (const id of parked) {
  assert.ok(existsSync(join(root, 'incubator', 'kai-engineering', 'skills', id, 'SKILL.md')));
}
assert.ok(existsSync(join(root, 'incubator', 'kai-engineering', 'agents',
  'workflow-doc-review.agent.md')));
const files = materializePacks({ root, version: '9.9.9-foundation-test' });
for (const id of keep) assert.ok(files.has(`kai-engineering/skills/${id}/SKILL.md`));
for (const id of retainedAgents) assert.ok(files.has(`kai-engineering/agents/${id}.agent.md`));
for (const id of parked) {
  assert.ok([...files.keys()].every(key => !key.endsWith(`/skills/${id}/SKILL.md`)));
}
assert.ok([...files.keys()].every(key =>
  !key.endsWith('/agents/workflow-doc-review.agent.md') &&
  !key.split('/').includes('incubator')));
const forbidden = new Set([...parked, 'workflow-doc-review']);
assert.ok(collectReferences(root).every(ref => !forbidden.has(ref.target)));
for (const entry of [...sourceAgentFiles(root), ...sourceSkillFiles(root)]) {
  const body = readFileSync(entry.path, 'utf8');
  for (const id of forbidden) {
    assert.ok(!body.includes(id), `${entry.rel} still names inactive ${id}`);
  }
}

const active = new Set(['principal-sre']);
const inactive = new Set(['workflow-doc-review']);
assert.equal(documentationReferenceExists('principal-sre', 'README.md', active, inactive), true);
for (const source of [
  'README.md', 'docs/getting-started.md', 'docs/reference/agents-and-skills.md',
  'docs/reference/skill-evaluation/README.md',
  'plugins/kai-core/agents/workflow-weekly-pulse.agent.md',
]) assert.equal(documentationReferenceExists('workflow-doc-review', source, active, inactive), false);
for (const source of [
  'docs/proposals/old-design.md', 'docs/superpowers/plans/old-plan.md',
  'docs/kai/reports/releases/old-release.md',
  'docs/reference/skill-evaluation/engineering-inventory.md',
  'docs/reference/skill-evaluation/research-before-coding/scorecard.md',
]) assert.equal(documentationReferenceExists('workflow-doc-review', source, active, inactive), true);
assert.equal(documentationReferenceExists('never-existed', 'docs/superpowers/old.md',
  active, inactive), false);
for (const id of parked) assert.ok(incubatedIds(root, 'skill').has(id));
assert.ok(incubatedIds(root, 'agent').has('workflow-doc-review'));
assert.throws(() => incubatedIds(root, 'unknown'), /unknown component kind/);

const scratch = mkdtempSync(join(root, '.kai-foundation-'));
try {
  const archived = join(scratch, 'incubator', 'kai-engineering');
  mkdirSync(join(archived, 'agents'), { recursive: true });
  mkdirSync(join(archived, 'skills', 'doc-review-rigor'), { recursive: true });
  const agentBody = '---\nname: workflow-doc-review\ndescription: fixture\ntools: [read]\n---\n';
  writeFileSync(join(archived, 'agents', 'workflow-doc-review.agent.md'), agentBody);
  writeFileSync(join(archived, 'skills', 'doc-review-rigor', 'SKILL.md'),
    '---\nname: doc-review-rigor\ndescription: fixture\n---\n');
  assert.deepEqual(sourceAgentFiles(scratch), []);
  assert.deepEqual(sourceSkillFiles(scratch), []);
  assert.ok(incubatedIds(scratch, 'agent').has('workflow-doc-review'));
  assert.ok(incubatedIds(scratch, 'skill').has('doc-review-rigor'));
  const live = join(scratch, 'plugins', 'kai-engineering', 'agents');
  mkdirSync(live, { recursive: true });
  writeFileSync(join(live, 'in-progress.workflow-doc-review.agent.md'), agentBody);
  assert.equal(sourceAgentFiles(scratch).length, 1,
    'a filename prefix does not exclude a file from the source collector');
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

const dispatchScratch = mkdtempSync(join(root, '.kai-foundation-dispatch-'));
try {
  const agentDir = join(dispatchScratch, 'plugins', 'kai-engineering', 'agents');
  const skillsDir = join(dispatchScratch, 'plugins', 'kai-engineering', 'skills');
  mkdirSync(agentDir, { recursive: true });
  for (const id of ['build-diagrams', 'pr-sizing']) {
    mkdirSync(join(skillsDir, id), { recursive: true });
    writeFileSync(join(skillsDir, id, 'SKILL.md'),
      `---\nname: ${id}\ndescription: fixture\n---\n`);
  }
  const backendPath = join(agentDir, 'principal-swe-backend.agent.md');
  writeFileSync(backendPath, `---
name: principal-swe-backend
description: fixture
tools: [read, skill]
---

Apply \`build-diagrams\` when a visual relationship matters.
Apply \`pr-sizing\` when work needs decomposition.

- **\`build-diagrams\`** — only when a visual relationship matters
- **\`pr-sizing\`** — only when work needs decomposition
`);
  const backendRel = 'plugins/kai-engineering/agents/principal-swe-backend.agent.md';
  const dispatched = collectReferences(dispatchScratch);
  for (const id of ['build-diagrams', 'pr-sizing']) {
    assert.ok(dispatched.some(ref =>
      ref.kind === 'skill' &&
      ref.target === id &&
      ref.from === backendRel &&
      ref.firing.includes('orchestrated')));
  }

  rmSync(join(skillsDir, 'pr-sizing'), { recursive: true, force: true });
  const missingSkill = collectReferences(dispatchScratch);
  assert.ok(!missingSkill.some(ref =>
    ref.kind === 'skill' &&
    ref.target === 'pr-sizing' &&
    ref.firing.includes('orchestrated')));
  assert.ok(missingSkill.some(ref =>
    ref.kind === 'skill' &&
    ref.target === 'pr-sizing' &&
    ref.firing.includes('loaded')));
} finally {
  rmSync(dispatchScratch, { recursive: true, force: true });
}

console.log('engineering foundation active-surface assertions passed');
