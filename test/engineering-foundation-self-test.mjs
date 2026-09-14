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
const codingStyleContractViolations = [];
const expectedCodingStyleDescription =
  'description: "Use when applying shared implementation defaults where repository conventions and task instructions leave appropriate details unspecified."';
if (!codingStyleBody.includes(expectedCodingStyleDescription)) {
  codingStyleContractViolations.push('coding-style description is not the shared-defaults trigger');
}
const codingStyleReferences = collectReferences(root);
for (const rel of [
  'plugins/kai-engineering/agents/principal-ai-applied-engineer.agent.md',
  'plugins/kai-engineering/agents/principal-swe-backend.agent.md',
  'plugins/kai-engineering/agents/principal-swe-frontend.agent.md',
  'plugins/kai-engineering/agents/principal-swe-infra.agent.md',
]) {
  const body = readFileSync(join(root, rel), 'utf8');
  const normalizedBody = body.replace(/\s+/g, ' ');
  for (const clause of [
    'Apply `coding-style` as you write',
    'Apply `coding-style` when your applied design carries real',
    '≤1–2 lines',
  ]) {
    if (body.includes(clause)) codingStyleContractViolations.push(`${rel}: ${clause}`);
  }
  for (const marker of [
    'repository or task instructions',
    'apply `coding-style` as shared implementation defaults',
    'proportionate comments or documentation',
  ]) {
    if (!normalizedBody.includes(marker)) codingStyleContractViolations.push(`${rel}: missing ${marker}`);
  }
  if (!codingStyleReferences.some(ref =>
    ref.from === rel &&
    ref.target === 'coding-style' &&
    ref.firing.includes('loaded'))) {
    codingStyleContractViolations.push(`${rel}: coding-style route is not discoverable`);
  }
}
assert.deepEqual(
  codingStyleContractViolations,
  [],
  'coding-style description and caller clauses must match the conditional shared-defaults contract',
);
const researchBody = readFileSync(
  join(root, 'plugins', 'kai-engineering', 'skills', 'research-before-coding', 'SKILL.md'),
  'utf8',
);
const normalizedResearchBody = researchBody.replace(/\s+/g, ' ').toLowerCase();
const researchContractViolations = [];
for (const directive of [
  'then propose, then\ncode',
  'Any code change beyond a one-line fix',
  'Trivial one-line changes',
  '## Module taxonomy',
  'Read 2–5 nearby files',
  'For small changes (≤1 file, ≤30 lines)',
  'pair with the `pr-sizing` skill',
  '### Step 6 — Then code',
  'implicit-or-explicit-approved',
  '**Always** state the module category',
]) {
  if (researchBody.includes(directive)) researchContractViolations.push(`skill: ${directive}`);
}
for (const marker of [
  'use when a code or design decision depends on unresolved evidence',
  'concise, scoped answer',
  'domain evidence to each material finding',
  'consequential implications or unresolved gaps',
  'guidance about conducting research is not domain evidence',
  'requested report format',
  'explicit user invocation',
  'the caller may continue its independently authorized work',
]) {
  if (!normalizedResearchBody.includes(marker)) {
    researchContractViolations.push(`skill: missing ${marker}`);
  }
}
const researchCallers = [
  'plugins/kai-engineering/agents/principal-ai-applied-engineer.agent.md',
  'plugins/kai-engineering/agents/principal-swe-backend.agent.md',
  'plugins/kai-engineering/agents/principal-swe-frontend.agent.md',
  'plugins/kai-engineering/agents/principal-swe-infra.agent.md',
];
for (const rel of researchCallers) {
  const body = readFileSync(join(root, rel), 'utf8');
  const normalizedBody = body.replace(/\s+/g, ' ');
  for (const directive of [
    'Read 3–5',
    'scan 3–5',
    'Run `research-before-coding` before this sweep',
  ]) {
    if (body.includes(directive)) researchContractViolations.push(`${rel}: ${directive}`);
  }
  for (const marker of [
    'unresolved decision-relevant evidence',
    'apply `research-before-coding` for that question',
    'continue the authorized work with the targeted reading and tests it requires',
  ]) {
    if (!normalizedBody.includes(marker)) researchContractViolations.push(`${rel}: missing ${marker}`);
  }
  if (!codingStyleReferences.some(ref =>
    ref.from === rel &&
    ref.target === 'research-before-coding' &&
    ref.firing.includes('loaded'))) {
    researchContractViolations.push(`${rel}: research route is not discoverable`);
  }
}
const issueAnalysisBody = readFileSync(
  join(root, 'plugins', 'kai-engineering', 'agents', 'workflow-issue-analysis.agent.md'),
  'utf8',
);
for (const staleClaim of ['zero** agents inheriting it', 'effectively dormant']) {
  if (issueAnalysisBody.includes(staleClaim)) {
    researchContractViolations.push(`workflow-issue-analysis: ${staleClaim}`);
  }
}
assert.deepEqual(
  researchContractViolations,
  [],
  'research must remain a bounded evidence handoff with conditional caller routes',
);
const onboardingBody = readFileSync(
  join(root, 'plugins', 'kai-engineering', 'skills', 'onboard-to-codebase', 'SKILL.md'),
  'utf8',
);
const normalizedOnboardingBody = onboardingBody.replace(/\s+/g, ' ').toLowerCase();
const onboardingContractViolations = [];
for (const [label, pattern] of [
  ['name', /^name: onboard-to-codebase\r?$/m],
  ['direct user invocation', /^user-invocable: true\r?$/m],
]) {
  if (!pattern.test(onboardingBody)) {
    onboardingContractViolations.push(`skill: invalid ${label}`);
  }
}
const onboardingDescription =
  onboardingBody.match(/^description:\s*"([^"]+)"\r?$/m)?.[1] ?? '';
if (!/^Use when\b/.test(onboardingDescription)
  || !/explicitly requests? orientation/i.test(onboardingDescription)
  || !/repository or subsystem/i.test(onboardingDescription)
  || /\b(report|scan|refresh|return|write)\b/i.test(onboardingDescription)) {
  onboardingContractViolations.push('skill: description is not trigger-only');
}
for (const directive of [
  'First time entering a repo',
  'Returning to a repo after months away',
  'Exists and < 30 days old',
  'stale (>30 days)',
  'default to refresh after confirming',
  'map this repo across 8 dimensions',
  'Write to `.copilot/onboarding.md`',
  'One report per repo.',
]) {
  if (onboardingBody.includes(directive)) {
    onboardingContractViolations.push(`skill: ${directive}`);
  }
}
for (const [label, pattern] of [
  ['no first-entry or elapsed-time authorization',
    /first entry.{0,40}elapsed time.{0,60}does not authorize/],
  ['requested repository or subsystem scope',
    /requested repository or subsystem scope/],
  ['current grounded evidence reuse', /reuse current.{0,20}grounded evidence/],
  ['selective refresh after real changes',
    /refresh only facts affected.{0,20}real changes/],
  ['operator-note and requested-path preservation',
    /preserve operator notes.{0,100}requested paths/],
  ['unknown facts remain unknown', /not established.{0,30}keep it unknown/],
  ['cited map output', /return a cited map/],
  ['conditional durable output', /write a durable file only when/],
  ['narrow coding question exclusion', /ordinary narrow coding questions/],
]) {
  if (!pattern.test(normalizedOnboardingBody)) {
    onboardingContractViolations.push(`skill: missing ${label}`);
  }
}
assert.deepEqual(
  onboardingContractViolations,
  [],
  'onboarding must require an explicit orientation request and return a scoped evidence-aware map',
);
const sizingBody = readFileSync(
  join(root, 'plugins', 'kai-engineering', 'skills', 'pr-sizing', 'SKILL.md'),
  'utf8',
);
const normalizedSizingBody = sizingBody.replace(/\s+/g, ' ').toLowerCase();
const sizingContractViolations = [];
if (/^tools:\s*\[[^\]]*\bedit\b[^\]]*\]\r?$/m.test(sizingBody)) {
  sizingContractViolations.push('skill: edit authority');
}
const sizingDescription =
  sizingBody.match(/^description:\s*"([^"]+)"\r?$/m)?.[1] ?? '';
if (!/^Use when\b/.test(sizingDescription)
  || !/authorized (change|work)/i.test(sizingDescription)
  || !/(decomposition|more than one)/i.test(sizingDescription)
  || /\b(hours?|files?|lines?|words?)\b/i.test(sizingDescription)) {
  sizingContractViolations.push('skill: description is not a proportional trigger');
}
for (const directive of [
  'larger than a few hours',
  'spans multiple files',
  'Single-file changes',
  'Bug fixes constrained to one function',
  '15–30 minutes',
  'three or more distinct concerns',
  'Files: ...',
  'never mix a refactor with a feature',
  'Confirm before starting',
  'Execute one at a time',
  'requires another PR to land first to be useful',
  'feature flag',
]) {
  if (sizingBody.includes(directive)) {
    sizingContractViolations.push(`skill: ${directive}`);
  }
}
for (const [label, pattern] of [
  ['authorized-scope input', /authorized scope/],
  ['proportional decomposition', /proportional delivery decomposition/],
  ['one-slice result', /one coherent.{0,50}no split/],
  ['ordered proposal output', /ordered proposal/],
  ['proposal-only boundary', /stop after.{0,30}proposal/],
  ['affected-behavior tests', /tests stay with the affected behavior/],
  ['small feature refactor', /necessary small refactor.{0,80}feature/],
  ['standalone useful refactor', /independently useful or risk-reducing refactor/],
  ['dependent landed increments', /may depend on earlier landed increments/],
  ['compatibility and safety', /compatibility and safety/],
  ['preparatory increment boundary', /preparatory increment.{0,100}final user feature/],
  ['authorized caller continuation',
    /caller may continue.{0,60}independently authorized implementation/],
  ['authority neutrality', /sizing neither grants nor withdraws.{0,30}authority/],
  ['plan-only preservation', /plan-only request remains plan-only/],
]) {
  if (!pattern.test(normalizedSizingBody)) {
    sizingContractViolations.push(`skill: missing ${label}`);
  }
}
const sizingCallers = [
  'plugins/kai-engineering/agents/principal-ai-applied-engineer.agent.md',
  'plugins/kai-engineering/agents/principal-swe-backend.agent.md',
  'plugins/kai-engineering/agents/principal-swe-frontend.agent.md',
  'plugins/kai-engineering/agents/principal-swe-infra.agent.md',
];
for (const rel of sizingCallers) {
  const body = readFileSync(join(root, rel), 'utf8');
  const normalizedBody = body.replace(/\s+/g, ' ').toLowerCase();
  for (const [label, pattern] of [
    ['conditional predicate', /if the authorized work needs decomposition/],
    ['pre-implementation timing', /apply `pr-sizing` before implementation/],
    ['one-delivery exclusion', /one coherent delivery.{0,30}does not require sizing/],
  ]) {
    if (!pattern.test(normalizedBody)) {
      sizingContractViolations.push(`${rel}: missing ${label}`);
    }
  }
  for (const directive of [
    'Apply `pr-sizing` before you break the work down',
    'Apply `pr-sizing` to keep the change one reviewable slice',
    'Apply `pr-sizing` so the change stays one reviewable slice',
    'Apply `pr-sizing` so the change stays small',
  ]) {
    if (body.includes(directive)) {
      sizingContractViolations.push(`${rel}: ${directive}`);
    }
  }
  if (!codingStyleReferences.some(ref =>
    ref.from === rel &&
    ref.target === 'pr-sizing' &&
    ref.firing.includes('loaded'))) {
    sizingContractViolations.push(`${rel}: pr-sizing route is not discoverable`);
  }
}
assert.deepEqual(
  sizingContractViolations,
  [],
  'pr-sizing must return proportional delivery proposals from conditional caller routes',
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
