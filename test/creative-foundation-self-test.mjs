import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as packPlan from '../scripts/lib/pack-plan.mjs';
const {
  agentAuthoringReferenceErrors,
  agentProfileModelErrors,
  agentTaxonomyErrors,
  collectReferences,
  DISPATCHING_ROLES,
  materializePacks,
  NEW_AGENT_IDS,
  PACKS,
  RETIRED_CREATIVE_AGENT_IDS,
  RETIRED_CREATIVE_SKILL_IDS,
  SKILL_OWNER_OVERRIDES,
  sourceAgentFiles,
  sourceSkillFiles,
} = packPlan;
import { documentationReferenceExists } from '../scripts/lib/incubation-contract.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

const finalAgentIds = [
  'creative-lead-design',
  'creative-lead-video',
  'workflow-creative-demo-production',
];
const finalSkillIds = [
  'html-block-diagrams',
  'mockups-ascii',
  'mockups-html',
  'video-align-narration',
  'video-render-zoom',
];
const retiredAgentIds = [
  'creative-video-director',
  'principal-brand-designer',
  'principal-product-designer',
];
const retiredSkillIds = [
  'create-product-demo',
  'demo-capture',
  'demo-narrate',
  'demo-zoom',
  'ui-mockup',
  'video-direction',
];
assert.deepEqual(RETIRED_CREATIVE_AGENT_IDS?.slice().sort(), retiredAgentIds,
  'retired role references must resolve without archived source copies');
assert.deepEqual(RETIRED_CREATIVE_SKILL_IDS, retiredSkillIds,
  'retired method references must resolve without archived source copies');

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
assert.deepEqual(NEW_AGENT_IDS.creative, finalAgentIds);
assert.deepEqual(PACKS.creative, finalAgentIds);
assert.deepEqual(
  Object.entries(SKILL_OWNER_OVERRIDES)
    .filter(([, owner]) => owner === 'creative'),
  [],
  'all final creative methods have real active callers and need no orphan override',
);
assert.deepEqual(DISPATCHING_ROLES, ['director-chief-of-staff'],
  'the creative migration must not add dispatching authority');

const taxonomy = readFileSync(join(
  root, 'plugins', 'kai-core', 'skills', 'kai-core-create-agent', 'references', 'taxonomy.md',
), 'utf8');
const modelSelection = readFileSync(join(
  root, 'plugins', 'kai-core', 'skills', 'kai-core-create-agent', 'references',
  'model-selection.md',
), 'utf8');
const selfCheck = readFileSync(join(
  root, 'plugins', 'kai-core', 'agents', 'workflow-self-check.agent.md',
), 'utf8');
const normalizedSelfCheck = selfCheck.replace(/\s+/g, ' ');
const authoringErrors = agentAuthoringReferenceErrors({ taxonomy, modelSelection });
assert.ok(!authoringErrors.some(error => error.startsWith('provider family rows')),
  `taxonomy provider rows must match the supported family set: ${authoringErrors.join('; ')}`);
assert.ok(!authoringErrors.some(error => error.includes('provider family `creative`')),
  `creative must map to kai-creative in the taxonomy reference: ${authoringErrors.join('; ')}`);
assert.match(
  normalizedSelfCheck,
  /\*\*3\.2 Naming convention\.\*\* Existing legacy agents may still use `principal-\*` or `director-\*` during the staged migration\. Current creative durable roles use the provider-family\/posture\/scope contract in `kai-core-create-agent`\.(?![^.]*creative-video-director)/,
  'workflow-self-check must keep principal/director migration-only and treat creative as current without registering the retired video-director id',
);

for (const id of retiredAgentIds) {
  const active = join(root, 'plugins', 'kai-creative', 'agents', `${id}.agent.md`);
  assert.equal(existsSync(active), false, `${id} must be retired from active sources`);
}
for (const id of retiredSkillIds) {
  const active = join(root, 'plugins', 'kai-creative', 'skills', id, 'SKILL.md');
  assert.equal(existsSync(active), false, `${id} must be retired from active sources`);
}

const activeAgents = sourceAgentFiles(root);
const activeSkills = sourceSkillFiles(root);
assert.deepEqual(activeAgents.filter(entry => entry.pack === 'creative')
  .map(entry => entry.id).sort(), [...finalAgentIds].sort());
assert.deepEqual(activeSkills.filter(entry => entry.pack === 'creative')
  .map(entry => entry.id).sort(), [...finalSkillIds].sort());
assert.ok([...activeAgents, ...activeSkills].every(entry => !entry.rel.includes('incubator')),
  'active collectors must not discover preserved incubator sources');

const activeIds = new Set([...finalAgentIds, ...finalSkillIds]);
const inactiveIds = new Set([...RETIRED_CREATIVE_AGENT_IDS, ...RETIRED_CREATIVE_SKILL_IDS]);
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
  for (const id of inactiveIds) {
    assert.equal(documentationReferenceExists(
      id, source, activeIds, inactiveIds,
    ), false, `${source} must reject inactive reference ${id}`);
  }
}
for (const source of [
  'docs/proposals/old-design.md',
  'docs/superpowers/plans/old-plan.md',
  'docs/kai/reports/releases/old-release.md',
  'docs/reference/skill-evaluation/engineering-inventory.md',
  'docs/reference/skill-evaluation/research-before-coding/scorecard.md',
  'docs/reference/skill-evaluation/samples/diagrams/guide-current.md',
]) {
  assert.equal(documentationReferenceExists(
    'creative-video-director', source, activeIds, inactiveIds,
  ), true, `${source} must retain historical references to retired identifiers`);
}
for (const source of [
  'docs/reference/skill-evaluation/current.md',
  'docs/reference/skill-evaluation/samples/diagrams/guide-next.md',
]) {
  assert.equal(documentationReferenceExists(
    'creative-video-director', source, activeIds, inactiveIds,
  ), false, `${source} must not gain a broad evidence-directory exemption`);
}
assert.equal(documentationReferenceExists(
  'never-existed',
  'docs/superpowers/plans/old-plan.md',
  activeIds,
  inactiveIds,
), false);

const refs = collectReferences(root);
const retiredRefs = refs.filter(ref =>
  inactiveIds.has(ref.target) && ref.from.startsWith('plugins/'));
assert.deepEqual(retiredRefs, [], 'active plugin callers must not reference retired creative IDs');

const files = materializePacks({ root, version: '9.9.9-creative-foundation-test' });
for (const id of finalAgentIds) {
  assert.ok(files.has(`kai-creative/agents/${id}.agent.md`),
    `creative pack must emit agent ${id}`);
}
for (const id of finalSkillIds) {
  assert.ok(files.has(`kai-creative/skills/${id}/SKILL.md`),
    `creative pack must emit skill ${id}`);
}
for (const id of retiredAgentIds) {
  assert.equal(files.has(`kai-creative/agents/${id}.agent.md`), false,
    `creative pack must not emit retired agent ${id}`);
}
for (const id of retiredSkillIds) {
  assert.equal(files.has(`kai-creative/skills/${id}/SKILL.md`), false,
    `creative pack must not emit retired skill ${id}`);
}
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
for (const [skill, asset] of [
  ['video-align-narration', 'scripts/demo-narrate.mjs'],
  ['video-render-zoom', 'scripts/demo-zoom.mjs'],
]) {
  assert.ok(refs.some(ref =>
    ref.from === `plugins/kai-creative/skills/${skill}/SKILL.md`
    && ref.kind === 'asset'
    && ref.target === asset),
  `${skill} must emit its unchanged helper dependency ${asset}`);
}

console.log('creative foundation migration guard assertions passed');
