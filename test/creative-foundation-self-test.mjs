import assert from 'node:assert/strict';
import {
  mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  agentAuthoringReferenceErrors,
  agentProfileModelErrors,
  agentTaxonomyErrors,
  collectReferences,
  materializePacks,
  sourceAgentFiles,
  sourceSkillFiles,
} from '../scripts/lib/pack-plan.mjs';
import {
  documentationReferenceExists,
  incubatedIds,
} from '../scripts/lib/incubation-contract.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

assert.deepEqual(agentTaxonomyErrors({
  id: 'creative-lead-design', pack: 'creative',
}), []);
assert.ok(agentTaxonomyErrors({
  id: 'creative-lead-design', pack: 'engineering',
}).length > 0);
assert.ok(agentTaxonomyErrors({
  id: 'creative-boss-design', pack: 'creative',
}).length > 0);
assert.deepEqual(agentProfileModelErrors({
  id: 'creative-video-director', body: '', fm: {},
}), []);
assert.ok(agentProfileModelErrors({
  id: 'creative-lead-design', body: '', fm: {},
}).length > 0);

const taxonomy = readFileSync(join(
  root, 'plugins', 'kai-core', 'skills', 'kai-core-create-agent', 'references', 'taxonomy.md',
), 'utf8');
const modelSelection = readFileSync(join(
  root, 'plugins', 'kai-core', 'skills', 'kai-core-create-agent', 'references',
  'model-selection.md',
), 'utf8');
const authoringErrors = agentAuthoringReferenceErrors({ taxonomy, modelSelection });
assert.ok(!authoringErrors.some(error => error.startsWith('provider family rows')),
  `taxonomy provider rows must match the supported family set: ${authoringErrors.join('; ')}`);
assert.ok(!authoringErrors.some(error => error.includes('provider family `creative`')),
  `creative must map to kai-creative in the taxonomy reference: ${authoringErrors.join('; ')}`);

const preservedAgents = [
  'creative-video-director',
  'principal-brand-designer',
  'principal-product-designer',
];
const preservedSkills = [
  'create-product-demo',
  'demo-capture',
  'demo-narrate',
  'demo-zoom',
  'ui-mockup',
  'video-direction',
];
for (const id of preservedAgents) {
  const active = join(root, 'plugins', 'kai-creative', 'agents', `${id}.agent.md`);
  const inactive = join(root, 'incubator', 'kai-creative', 'agents', `${id}.agent.md`);
  assert.deepEqual(readFileSync(inactive), readFileSync(active),
    `${id} must be preserved byte-identically while its active source remains`);
  assert.ok(incubatedIds(root, 'agent').has(id));
}
for (const id of preservedSkills) {
  const active = join(root, 'plugins', 'kai-creative', 'skills', id, 'SKILL.md');
  const inactive = join(root, 'incubator', 'kai-creative', 'skills', id, 'SKILL.md');
  assert.deepEqual(readFileSync(inactive), readFileSync(active),
    `${id} must be preserved byte-identically while its active source remains`);
  assert.ok(incubatedIds(root, 'skill').has(id));
}

const activeAgents = sourceAgentFiles(root);
const activeSkills = sourceSkillFiles(root);
for (const id of preservedAgents) {
  assert.ok(activeAgents.some(entry => entry.pack === 'creative' && entry.id === id),
    `${id} must remain active until its replacement task`);
}
for (const id of preservedSkills) {
  assert.ok(activeSkills.some(entry => entry.pack === 'creative' && entry.id === id),
    `${id} must remain active until its replacement task`);
}
assert.ok([...activeAgents, ...activeSkills].every(entry => !entry.rel.includes('incubator')),
  'active collectors must not discover preserved incubator sources');

const activeIds = new Set(['creative-lead-design']);
const inactiveIds = new Set(['creative-video-director', 'ui-mockup']);
assert.equal(documentationReferenceExists(
  'creative-lead-design', 'README.md', activeIds, inactiveIds,
), true);
for (const source of [
  'README.md',
  'docs/getting-started.md',
  'docs/reference/agents-and-skills.md',
  'docs/reference/skill-evaluation/README.md',
  'plugins/kai-creative/agents/creative-lead-design.agent.md',
]) {
  assert.equal(documentationReferenceExists(
    'creative-video-director', source, activeIds, inactiveIds,
  ), false, `${source} must reject inactive agent references`);
}
for (const source of [
  'docs/proposals/old-design.md',
  'docs/superpowers/plans/old-plan.md',
  'docs/kai/reports/releases/old-release.md',
  'docs/reference/skill-evaluation/engineering-inventory.md',
  'docs/reference/skill-evaluation/research-before-coding/scorecard.md',
  'docs/reference/skill-evaluation/creative-foundation-baseline-2026-09-13.md',
  'docs/reference/skill-evaluation/samples/diagrams/guide-current.md',
]) {
  assert.equal(documentationReferenceExists(
    'creative-video-director', source, activeIds, inactiveIds,
  ), true, `${source} must retain historical references to preserved sources`);
}
for (const source of [
  'docs/reference/skill-evaluation/creative-foundation/current.md',
  'docs/reference/skill-evaluation/samples/diagrams/guide-next.md',
]) {
  assert.equal(documentationReferenceExists(
    'creative-video-director', source, activeIds, inactiveIds,
  ), false, `${source} must not gain a broad evidence-directory exemption`);
}
assert.equal(documentationReferenceExists(
  'never-existed',
  'docs/reference/skill-evaluation/creative-foundation-baseline-2026-09-13.md',
  activeIds,
  inactiveIds,
), false);

const scratch = mkdtempSync(join(root, '.kai-creative-foundation-'));
try {
  const fixtures = [
    ['kai-engineering', 'workflow-doc-review', 'doc-review-rigor'],
    ['kai-creative', 'creative-video-director', 'ui-mockup'],
  ];
  for (const [owner, agent, skill] of fixtures) {
    const base = join(scratch, 'incubator', owner);
    mkdirSync(join(base, 'agents'), { recursive: true });
    mkdirSync(join(base, 'skills', skill), { recursive: true });
    writeFileSync(join(base, 'agents', `${agent}.agent.md`), `${agent}\n`);
    writeFileSync(join(base, 'skills', skill, 'SKILL.md'), `${skill}\n`);
  }
  mkdirSync(join(scratch, 'incubator', 'kai-creative', 'skills', 'missing-body'),
    { recursive: true });
  writeFileSync(
    join(scratch, 'incubator', 'kai-creative', 'agents', 'unknown.txt'),
    'not an agent source\n',
  );

  assert.deepEqual([...incubatedIds(scratch, 'agent')].sort(), [
    'creative-video-director',
    'workflow-doc-review',
  ]);
  assert.deepEqual([...incubatedIds(scratch, 'skill')].sort(), [
    'doc-review-rigor',
    'ui-mockup',
  ]);
  assert.ok(!incubatedIds(scratch, 'skill').has('missing-body'));
  assert.throws(() => incubatedIds(scratch, 'unknown'), /unknown component kind/);

  const activeAgentDir = join(scratch, 'plugins', 'kai-creative', 'agents');
  const activeSkillDir = join(scratch, 'plugins', 'kai-creative', 'skills', 'active-mockup');
  mkdirSync(activeAgentDir, { recursive: true });
  mkdirSync(activeSkillDir, { recursive: true });
  writeFileSync(join(activeAgentDir, 'creative-lead-design.agent.md'), 'active agent\n');
  writeFileSync(join(activeSkillDir, 'SKILL.md'), 'active skill\n');
  assert.deepEqual(sourceAgentFiles(scratch).map(entry => entry.id), ['creative-lead-design']);
  assert.deepEqual(sourceSkillFiles(scratch).map(entry => entry.id), ['active-mockup']);
} finally {
  rmSync(scratch, { recursive: true, force: true });
}

const files = materializePacks({ root, version: '9.9.9-creative-foundation-test' });
for (const asset of [
  'scripts/demo-capture.mjs',
  'scripts/demo-format.mjs',
  'scripts/demo-narrate.mjs',
  'scripts/demo-zoom.mjs',
  'scripts/lib/cursor-png.mjs',
]) {
  const emitted = files.get(`kai-creative/${asset}`);
  assert.ok(emitted, `creative pack must preserve helper dependency ${asset}`);
  assert.equal(emitted, readFileSync(join(root, ...asset.split('/')), 'utf8')
    .replace(/\r\n/g, '\n'));
}
assert.ok(collectReferences(root).some(ref =>
  ref.from === 'plugins/kai-creative/skills/demo-narrate/SKILL.md'
  && ref.kind === 'asset'
  && ref.target === 'scripts/demo-narrate.mjs'));

console.log('creative foundation migration guard assertions passed');
