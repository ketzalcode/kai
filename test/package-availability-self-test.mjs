import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as packPlan from '../scripts/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const published = ['kai-core', 'kai-engineering', 'kai-creative'];
const prerelease = [
  'kai-assistant', 'kai-product', 'kai-marketing', 'kai-revenue', 'kai-learning',
];
const canonicalVersion = JSON.parse(readFileSync(join(root, 'plugin.json'), 'utf8')).version;
const mkt = JSON.parse(readFileSync(join(root, '.github', 'plugin', 'marketplace.json'), 'utf8'));
const policy = packPlan.marketplaceSurfacePolicy({ mkt, canonicalVersion, monolithName: 'kai' });
assert.deepEqual(policy.requiredPluginNames, published,
  'default installs must require only core, engineering, and creative');
assert.deepEqual([...policy.forbiddenPluginNames].sort(), ['kai', ...prerelease].sort(),
  'in-progress packages must not leak into the default marketplace');
assert.deepEqual(mkt.plugins.map(entry => entry.name), published);

const descriptors = packPlan.planManifests({ root, version: canonicalVersion });
assert.equal(descriptors.length, 8, 'pre-release source remains generated and validated');
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
for (const name of prerelease) {
  const manifest = manifestsByName.get(name);
  assert.ok(manifest, `${name}: retain its original owning package and identity`);
  assert.match(manifest.description, /^Pre-release \(in progress\): /);
  assert.equal(manifest.version, canonicalVersion,
    'readiness labels do not fork the lockstep source-version policy');
  assert.ok(errorsFor({
    ...mkt,
    plugins: [...mkt.plugins, { ...manifest, source: `./plugins/${name}` }],
  }).some(error => error.includes(`entry "${name}" is not part of the published install surface`)),
  `${name}: accidental default publication must fail`);
}

const sourceAgents = packPlan.sourceAgentFiles(root);
const sourceSkills = packPlan.sourceSkillFiles(root);
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
const references = packPlan.collectReferences(root);
const emitted = packPlan.materializePacks({ root, version: canonicalVersion });
for (const name of prerelease) {
  const pack = name.slice('kai-'.length);
  assert.ok(sourceAgents.some(entry => entry.pack === pack),
    `${name}: unpublished does not mean removed from source validation`);
  assert.ok(references.some(entry => entry.fromPack === pack),
    `${name}: its dependency/reference failures must remain visible`);
  assert.ok(emitted.has(`${name}/plugin.json`));
  for (const entry of [...sourceAgents, ...sourceSkills].filter(entry => entry.pack === pack)) {
    assert.equal(emitted.get(entry.rel.slice('plugins/'.length)),
      packPlan.normalizeLF(readFileSync(entry.path, 'utf8')),
      `${entry.rel}: preserve source in its existing package`);
  }
}
assert.deepEqual(
  packPlan.runtimeDependencyMatrix().map(entry => entry.name).sort(),
  [...published, ...prerelease].sort(),
  'pre-release status must not remove retained packages from runtime validation',
);
const rollback = packPlan.marketplaceSurfacePolicy({
  mkt: { ...mkt, metadata: { ...mkt.metadata, installSurface: 'legacy-rollback' } },
  canonicalVersion, monolithName: 'kai',
});
assert.deepEqual(rollback.requiredPluginNames, ['kai']);
assert.deepEqual([...rollback.forbiddenPluginNames].sort(), [...published, ...prerelease].sort());
console.log('package availability, pre-release retention, and publication rejection assertions passed');
