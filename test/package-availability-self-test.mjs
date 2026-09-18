// The package-availability contract, after incubation.
//
// The repository used to ship three default packages while retaining five more
// as validated "pre-release" source. That split is gone: the active partition
// and the default marketplace are now the same three packages, and the other
// five live under `incubator/` where nothing discovers, validates, emits, or
// installs them. These assertions exist so that claim stays true — an incubated
// package that quietly reappeared in the index, in the generated tree, or in the
// source collectors would otherwise be invisible until someone installed it.
import assert from 'node:assert/strict';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as packPlan from '../scripts/lib/pack-plan.mjs';
import { incubatedIds, incubatedPackageDirs } from '../scripts/lib/incubation-contract.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const published = ['kai-core', 'kai-engineering', 'kai-creative'];
const incubated = [
  'kai-assistant', 'kai-product', 'kai-marketing', 'kai-revenue', 'kai-learning',
];
const canonicalVersion = JSON.parse(readFileSync(join(root, 'plugin.json'), 'utf8')).version;
const mkt = JSON.parse(readFileSync(join(root, '.github', 'plugin', 'marketplace.json'), 'utf8'));

// --- the default index is the whole publishable partition -------------------
const policy = packPlan.marketplaceSurfacePolicy({ mkt, canonicalVersion, monolithName: 'kai' });
assert.deepEqual(policy.requiredPluginNames, published,
  'default installs must require only core, engineering, and creative');
assert.deepEqual([...policy.forbiddenPluginNames].sort(), ['kai'],
  'only the monolith is forbidden: no publishable-but-unpublished package is left');
assert.deepEqual(mkt.plugins.map(entry => entry.name), published);

const descriptors = packPlan.planManifests({ root, version: canonicalVersion });
assert.equal(descriptors.length, 3, 'the generator plans exactly the three shipping packages');
assert.deepEqual(descriptors.map(entry => entry.name).sort(), [...published].sort());
for (const entry of descriptors) {
  assert.doesNotMatch(entry.manifest.description, /^Pre-release \(in progress\): /,
    `${entry.name}: a shipping package carries no readiness prefix`);
}

const manifestsByName = new Map(descriptors.map(entry => [entry.name, entry.manifest]));
const manifestsBySource = new Map(descriptors.map(entry =>
  [`plugins/${entry.name}`, entry.manifest]));
const errorsFor = candidate => packPlan.marketplaceConsistencyErrors({
  mkt: candidate, canonicalVersion, marketName: 'kai-plugins', monolithName: 'kai',
  manifestsByName, manifestsBySource, ...policy,
});
assert.deepEqual(errorsFor(mkt), []);
for (const name of published) {
  assert.ok(errorsFor({ ...mkt, plugins: mkt.plugins.filter(entry => entry.name !== name) })
    .some(error => error.includes(`no entry named "${name}"`)),
  `${name}: removing a default package must fail marketplace validation`);
}

// --- incubated packages are absent from every active surface ----------------
const sourceAgents = packPlan.sourceAgentFiles(root);
const sourceSkills = packPlan.sourceSkillFiles(root);
const references = packPlan.collectReferences(root);
const emitted = packPlan.materializePacks({ root, version: canonicalVersion });

assert.deepEqual(packPlan.INCUBATED_PACKS.map(packPlan.packPluginName).sort(),
  [...incubated].sort(), 'the declared incubated set matches this contract');
assert.deepEqual(packPlan.PACK_ORDER.map(packPlan.packPluginName).sort(), [...published].sort(),
  'the active partition is exactly the three shipping packages');

for (const name of incubated) {
  const pack = name.slice('kai-'.length);
  const dir = join(root, 'incubator', name);

  assert.ok(existsSync(dir), `${name}: its source is preserved under incubator/`);
  assert.ok(!existsSync(join(root, 'plugins', name)),
    `${name}: exactly one location — it must not also have an active source tree`);
  for (const manifest of ['plugin.json', 'package.json', 'package-lock.json']) {
    assert.ok(!existsSync(join(dir, manifest)),
      `${name}: an incubated tree carries no ${manifest} — a manifest here is installable`);
  }

  assert.ok(!sourceAgents.some(entry => entry.pack === pack),
    `${name}: no agent of an incubated package is discovered as active source`);
  assert.ok(!sourceSkills.some(entry => entry.pack === pack),
    `${name}: no skill of an incubated package is discovered as active source`);
  assert.ok(!references.some(entry => entry.fromPack === pack),
    `${name}: an incubated body contributes no reference to the active corpus`);
  assert.ok(![...emitted.keys()].some(key => key.startsWith(`${name}/`)),
    `${name}: nothing from an incubated package is emitted into a generated pack`);
  assert.ok(!mkt.plugins.some(entry => entry.name === name),
    `${name}: an incubated package has no marketplace entry`);
  assert.ok(!packPlan.PACK_RUNTIME_DEPENDENCIES[pack],
    `${name}: an incubated package declares no runtime-dependency plan`);
}

// The ids still have to be *recognisable*, or a stale reference to an incubated
// role would stop being reported and silently become ordinary prose.
const agentShaped = packPlan.agentShapedPattern();
for (const id of packPlan.INCUBATED_AGENT_IDS) {
  assert.match(id, agentShaped,
    `${id}: an incubated agent id stays recognisable to the reference scanner`);
}
assert.ok(incubatedIds(root, 'agent').size > 0 && incubatedIds(root, 'skill').size > 0,
  'the incubation contract actually finds the moved components on disk');
assert.ok(incubatedPackageDirs(root).includes('kai-engineering'),
  'component-level incubation under an active package still resolves');

// --- validation surfaces follow the active partition ------------------------
assert.deepEqual(
  packPlan.runtimeDependencyMatrix().map(entry => entry.name).sort(),
  [...published].sort(),
  'the CI runtime matrix covers the shipping packages and nothing incubated',
);
const rollback = packPlan.marketplaceSurfacePolicy({
  mkt: { ...mkt, metadata: { ...mkt.metadata, installSurface: 'legacy-rollback' } },
  canonicalVersion, monolithName: 'kai',
});
assert.deepEqual(rollback.requiredPluginNames, ['kai']);
assert.deepEqual([...rollback.forbiddenPluginNames].sort(), [...published].sort());

// --- the guides open with an agent a default install actually supplies ------
for (const guide of ['README.md', join('docs', 'getting-started.md')]) {
  const firstUse = readFileSync(join(root, guide), 'utf8')
    .split('## First five minutes')[1]?.split(/\r?\n## /)[0] ?? '';
  const firstUseAgents = [...firstUse.matchAll(/^Ask ([a-z][a-z0-9-]+) /gm)]
    .map(match => match[1]);
  assert.ok(firstUseAgents.length > 0, `${guide}: first use must name a real directly callable agent`);
  for (const id of firstUseAgents) {
    const provider = sourceAgents.find(entry => entry.id === id);
    assert.ok(provider && published.includes(packPlan.packPluginName(provider.pack)),
      `${guide}: first-use agent ${id} must be supplied by a default package`);
  }
}

// --- the incubator index describes what is actually parked ------------------
const incubatorReadme = readFileSync(join(root, 'incubator', 'README.md'), 'utf8');
for (const name of readdirSync(join(root, 'incubator'), { withFileTypes: true })
  .filter(entry => entry.isDirectory()).map(entry => entry.name)) {
  assert.ok(incubatorReadme.includes(`\`${name}\``),
    `${name}: every incubator directory is accounted for in incubator/README.md`);
}

console.log('package availability, incubation isolation, and publication rejection assertions passed');
