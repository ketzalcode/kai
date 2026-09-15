import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import {
  existsSync, mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  agentAuthoringReferenceErrors,
  agentProfileModelErrors,
  agentTaxonomyErrors,
  collectReferences,
  DISPATCHING_ROLES,
  materializePacks,
  NEW_AGENT_IDS,
  PACKS,
  SKILL_OWNER_OVERRIDES,
  sourceAgentFiles,
  sourceSkillFiles,
} from '../scripts/lib/pack-plan.mjs';
import {
  documentationReferenceExists,
  incubatedIds,
} from '../scripts/lib/incubation-contract.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const normalizedHash = path => createHash('sha256')
  .update(readFileSync(path, 'utf8').replace(/\r\n/g, '\n'))
  .digest('hex');

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
  'video-create-narration',
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

const preservedHashes = new Map(Object.entries({
  'agents/creative-video-director.agent.md': '45053c55a874213b3382ae36155c004a7e017a394400265392f7310a9ae22420',
  'agents/principal-brand-designer.agent.md': 'f88e8ac47cc899b39ed78eadb06a657afcccc08ba770704c89f57a304ef70471',
  'agents/principal-product-designer.agent.md': '797e6ea9e081f7587fa93272819d3bdfb323154361c8aa299c4264105d2fe8dc',
  'skills/create-product-demo/SKILL.md': 'ad068fd1fa2b16f4d4c5e5b68302dc7cb816f844b87280c723408a22c7b8f484',
  'skills/demo-capture/SKILL.md': '1ad844256efbf8ae6f20ca02ca5f77f909489b84c981b9551e84320c58f8fae8',
  'skills/demo-narrate/SKILL.md': '6e2c320b319b2d42475caeaf1b00e4193ebab184f7c31201dff85c6afdc4295f',
  'skills/demo-zoom/SKILL.md': '6c05d7bd85fb7f285db2311a798cb901d274e30c1c7e00e7b9670637247068eb',
  'skills/ui-mockup/SKILL.md': 'a7e38df6f0ba2d8c84301cb86750a633a371f6b2e185aafb8b0e16dce3f57bdd',
  'skills/video-direction/SKILL.md': 'b3b0bdb7d4e3395e18944354315af12c4b5e89633e20ecd5ec9f170ba26d5fda',
}));
for (const id of retiredAgentIds) {
  const active = join(root, 'plugins', 'kai-creative', 'agents', `${id}.agent.md`);
  const inactive = join(root, 'incubator', 'kai-creative', 'agents', `${id}.agent.md`);
  assert.equal(existsSync(active), false, `${id} must be retired from active sources`);
  assert.equal(
    normalizedHash(inactive),
    preservedHashes.get(`agents/${id}.agent.md`),
    `${id} must retain its reviewed normalized source in the incubator`,
  );
  assert.ok(incubatedIds(root, 'agent').has(id));
}
for (const id of retiredSkillIds) {
  const active = join(root, 'plugins', 'kai-creative', 'skills', id, 'SKILL.md');
  const inactive = join(root, 'incubator', 'kai-creative', 'skills', id, 'SKILL.md');
  assert.equal(existsSync(active), false, `${id} must be retired from active sources`);
  assert.equal(
    normalizedHash(inactive),
    preservedHashes.get(`skills/${id}/SKILL.md`),
    `${id} must retain its reviewed normalized source in the incubator`,
  );
  assert.ok(incubatedIds(root, 'skill').has(id));
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
const inactiveIds = new Set([...retiredAgentIds, ...retiredSkillIds]);
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
  'docs/reference/skill-evaluation/creative-foundation-baseline-2026-09-13.md',
  'docs/reference/skill-evaluation/samples/diagrams/guide-current.md',
]) {
  assert.equal(documentationReferenceExists(
    'creative-video-director', source, activeIds, inactiveIds,
  ), true, `${source} must retain historical references to preserved sources`);
}
for (const source of [
  'docs/reference/skill-evaluation/creative-foundation/grounding/current/SKILL.md',
  'docs/reference/skill-evaluation/creative-foundation/grounding/candidate/SKILL.md',
  'docs/reference/skill-evaluation/creative-foundation/scope/current/SKILL.md',
  'docs/reference/skill-evaluation/creative-foundation/scope/candidate/SKILL.md',
  'docs/reference/skill-evaluation/creative-foundation/mockups-ascii/current/SKILL.md',
]) {
  assert.equal(documentationReferenceExists(
    'principal-product-designer', source, activeIds, inactiveIds,
  ), true, `${source} is an exact frozen authoring snapshot`);
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
  ['video-create-narration', 'scripts/demo-narrate.mjs'],
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
