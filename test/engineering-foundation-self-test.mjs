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
const normalizeContract = body => body.replace(/\s+/g, ' ').trim().toLowerCase();
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
const codingStyleDescription =
  codingStyleBody.match(/^description:\s*"([^"]+)"\r?$/m)?.[1] ?? '';
if (!/^Use when\b/.test(codingStyleDescription)
  || !/shared implementation defaults/i.test(codingStyleDescription)
  || !/repository conventions and task instructions/i.test(codingStyleDescription)
  || !/details unspecified/i.test(codingStyleDescription)) {
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
  const normalizedBody = normalizeContract(body);
  for (const clause of [
    'Apply `coding-style` as you write',
    'Apply `coding-style` when your applied design carries real',
    '≤1–2 lines',
  ]) {
    if (body.includes(clause)) codingStyleContractViolations.push(`${rel}: ${clause}`);
  }
  for (const [label, pattern] of [
    ['instruction precedence', /repository or task instructions/],
    ['shared-defaults route', /apply `coding-style` as shared implementation defaults/],
    ['proportionate documentation', /proportionate comments or documentation/],
  ]) {
    if (!pattern.test(normalizedBody)) codingStyleContractViolations.push(`${rel}: missing ${label}`);
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
const normalizedResearchBody = normalizeContract(researchBody);
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
for (const [label, pattern] of [
  ['unresolved-evidence trigger', /use when a code or design decision depends on unresolved evidence/],
  ['concise scoped answer', /concise, scoped answer/],
  ['finding evidence', /domain evidence to each material finding/],
  ['consequential follow-up', /consequential implications or unresolved gaps/],
  ['procedural evidence boundary', /guidance about conducting research is not domain evidence/],
  ['requested format', /requested report format/],
  ['direct invocation', /explicit user invocation/],
  ['caller continuation', /caller may continue.{0,30}independently authorized work/],
]) {
  if (!pattern.test(normalizedResearchBody)) {
    researchContractViolations.push(`skill: missing ${label}`);
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
  const normalizedBody = normalizeContract(body);
  for (const directive of [
    'Read 3–5',
    'scan 3–5',
    'Run `research-before-coding` before this sweep',
  ]) {
    if (body.includes(directive)) researchContractViolations.push(`${rel}: ${directive}`);
  }
  for (const [label, pattern] of [
    ['decision-relevant trigger', /unresolved decision-relevant evidence/],
    ['question-scoped route', /apply `research-before-coding` for that question/],
    ['authorized direct continuation',
      /continue the authorized work.{0,40}targeted reading and tests it requires/],
  ]) {
    if (!pattern.test(normalizedBody)) researchContractViolations.push(`${rel}: missing ${label}`);
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
const normalizedOnboardingBody = normalizeContract(onboardingBody);
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
const normalizedSizingBody = normalizeContract(sizingBody);
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
]) {
  if (sizingBody.includes(directive)) {
    sizingContractViolations.push(`skill: ${directive}`);
  }
}
for (const pattern of [
  /doesn't require another pr to land first to be useful.{0,50}feature flag/,
  /never ship a pr that requires another pr to land first.{0,80}feature flag/,
]) {
  if (pattern.test(normalizedSizingBody)) {
    sizingContractViolations.push(`skill: unwanted feature-flag independence obligation: ${pattern}`);
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
const diagramSkillPath = join(
  root, 'plugins', 'kai-engineering', 'skills', 'build-diagrams', 'SKILL.md',
);
const diagramCatalogPath = join(
  root, 'plugins', 'kai-engineering', 'skills', 'build-diagrams', 'references', 'catalog.md',
);
const diagramBody = readFileSync(diagramSkillPath, 'utf8');
const normalizedDiagramBody = normalizeContract(diagramBody);
const diagramContractViolations = [];
for (const directive of [
  'at least one diagram',
  'ASCII stays the default everywhere',
  'Prose-only structure',
]) {
  if (diagramBody.includes(directive)) {
    diagramContractViolations.push(`skill: ${directive}`);
  }
}
for (const [label, pattern] of [
  ['explicit request trigger', /explicitly requests? a diagram/],
  ['supported relationship trigger', /supported relationship/],
  ['no-diagram result', /return no diagram/],
  ['caller continuation', /caller continues.{0,80}authorized/],
  ['format precedence', /requested format.{0,80}takes precedence/],
  ['repository precedence', /repository constraints.{0,80}take precedence/],
  ['evidence boundary', /do not invent.{0,40}(relationship|architecture)/],
  ['renderer boundary', /do not claim.{0,40}render/],
  ['progressive catalog link', /references\/catalog\.md/],
]) {
  if (!pattern.test(normalizedDiagramBody)) {
    diagramContractViolations.push(`skill: missing ${label}`);
  }
}
if (!existsSync(diagramCatalogPath)) {
  diagramContractViolations.push('skill: missing references/catalog.md');
} else {
  const catalogBody = readFileSync(diagramCatalogPath, 'utf8');
  const normalizedCatalogBody = catalogBody.replace(/\s+/g, ' ').toLowerCase();
  for (const directive of ['at least one diagram', 'ASCII stays the default everywhere']) {
    if (catalogBody.includes(directive)) {
      diagramContractViolations.push(`catalog: ${directive}`);
    }
  }
  for (const marker of [
    'component / boundary',
    'sequence / flow',
    'data model',
    'state machine',
    'deployment / topology',
    'tree / hierarchy',
    'terminal-readable text',
    'mermaid',
    'inline svg',
  ]) {
    if (!normalizedCatalogBody.includes(marker)) {
      diagramContractViolations.push(`catalog: missing ${marker}`);
    }
  }
}
const diagramCallers = [
  'plugins/kai-engineering/agents/principal-swe-architect.agent.md',
  'plugins/kai-engineering/agents/principal-swe-backend.agent.md',
  'plugins/kai-engineering/agents/principal-swe-frontend.agent.md',
  'plugins/kai-engineering/agents/principal-swe-infra.agent.md',
  'plugins/kai-engineering/agents/workflow-issue-analysis.agent.md',
  'plugins/kai-engineering/agents/workflow-pull-request.agent.md',
];
for (const rel of diagramCallers) {
  const body = readFileSync(join(root, rel), 'utf8');
  const normalizedBody = normalizeContract(body);
  if (/at least\s+one diagram/i.test(body)) {
    diagramContractViolations.push(`${rel}: mandatory diagram quota`);
  }
  if (!/explicit (diagram|visual) request/.test(normalizedBody)) {
    diagramContractViolations.push(`${rel}: missing explicit-request trigger`);
  }
  if (!/(supported relationship|visual adds information|materially clearer)/.test(normalizedBody)) {
    diagramContractViolations.push(`${rel}: missing information-value trigger`);
  }
  if (!/(continues?|produce|write).{0,100}(without a diagram|without one|prose|artifact|narrative)/.test(normalizedBody)) {
    diagramContractViolations.push(`${rel}: missing no-diagram continuation`);
  }
  if (!codingStyleReferences.some(ref =>
    ref.from === rel &&
    ref.target === 'build-diagrams' &&
    ref.firing.includes('loaded'))) {
    diagramContractViolations.push(`${rel}: build-diagrams route is not discoverable`);
  }
}
const prDeliveryBody = readFileSync(
  join(root, 'plugins', 'kai-core', 'skills', 'kai-core-pr-delivery', 'SKILL.md'),
  'utf8',
);
const normalizedPrDeliveryBody = normalizeContract(prDeliveryBody);
for (const [label, pattern] of [
  ['explicit-request trigger', /explicit (diagram|visual) request/],
  ['information-value trigger', /(visual adds information|materially clearer visually)/],
  ['prose-sufficient structural continuation',
    /structur(e|al) or flow change.{0,120}prose.{0,80}(does not trigger|without a diagram)/],
  ['conditional body-template trigger',
    /the change at a glance.{0,120}explicit (diagram|visual) request.{0,120}(materially clearer|adds information)/],
]) {
  if (!pattern.test(normalizedPrDeliveryBody)) {
    diagramContractViolations.push(`kai-core-pr-delivery: missing ${label}`);
  }
}
for (const staleObligation of [
  /trigger: it alters a structure or flow/,
  /20-line routing change does/,
  /diagram it when the change alters a.{0,20}structure.{0,30}flow/,
]) {
  if (staleObligation.test(normalizedPrDeliveryBody)) {
    diagramContractViolations.push(`kai-core-pr-delivery: unconditional structural trigger: ${staleObligation}`);
  }
}
const htmlBlockDiagramBody = readFileSync(
  join(root, 'plugins', 'kai-creative', 'skills', 'html-block-diagrams', 'SKILL.md'),
  'utf8',
);
const normalizedHtmlBlockDiagramBody = normalizeContract(htmlBlockDiagramBody);
for (const staleAttribution of [
  /build-diagrams` owns diagrams.{0,20}in.{0,20}markdown.{0,80}ascii by default/,
  /same one-line caption rule `build-diagrams` applies to ascii/,
]) {
  if (staleAttribution.test(normalizedHtmlBlockDiagramBody)) {
    diagramContractViolations.push(`html-block-diagrams: stale build-diagrams attribution: ${staleAttribution}`);
  }
}
assert.deepEqual(
  diagramContractViolations,
  [],
  'build-diagrams and named callers must make visuals optional, grounded, and progressive',
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
assert.ok(files.has('kai-engineering/skills/build-diagrams/references/catalog.md'),
  'materializePacks must emit the build-diagrams catalog companion');
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
