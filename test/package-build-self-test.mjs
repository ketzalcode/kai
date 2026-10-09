import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  PACK_ORDER,
  collectReferences,
  generatedRuntimeErrors,
  materializePacks,
  packPluginName,
  planManifests,
  sourceAgentFiles,
  sourceSkillFiles,
} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const version = packageJson.version;
const expectedPacks = ['core', 'creative', 'engineering'];
const buildCache = new Map();

function build(packs) {
  const key = [...packs].sort().join(',');
  if (!buildCache.has(key)) {
    buildCache.set(key, materializePacks({root, version, packs}));
  }
  return buildCache.get(key);
}

function emittedPacks(files) {
  return [...new Set([...files.keys()].map(key => key.split('/')[0]))].sort();
}

function expectedPluginNames(packs) {
  return packs.map(packPluginName).sort();
}

function assertInstall(files, packs) {
  assert.deepEqual(emittedPacks(files), expectedPluginNames(packs));
  for (const pack of packs) {
    const name = packPluginName(pack);
    assert.ok(files.has(`${name}/plugin.json`), `${name} emits its manifest`);
    assert.ok(
      [...files.keys()].some(key =>
        key.startsWith(`${name}/agents/`) || key.startsWith(`${name}/skills/`)),
      `${name} emits its declared capability surface`,
    );
  }
  assert.deepEqual(generatedRuntimeErrors(files, packs), []);
}

test('exactly three active packages are planned', () => {
  assert.deepEqual([...PACK_ORDER].sort(), expectedPacks);
  assert.deepEqual(
    planManifests({root, version}).map(entry => entry.name).sort(),
    expectedPluginNames(expectedPacks),
  );
});

test('package metadata uses package.json as the version authority', () => {
  const rootPlugin = JSON.parse(readFileSync(join(root, 'plugin.json'), 'utf8'));
  const marketplace = JSON.parse(readFileSync(
    join(root, '.github', 'plugin', 'marketplace.json'),
    'utf8',
  ));
  assert.equal(rootPlugin.version, packageJson.version);
  assert.equal(marketplace.metadata.version, packageJson.version);
  for (const plugin of marketplace.plugins) {
    assert.equal(plugin.version, packageJson.version);
  }
});

test('Core-only install is closed and loadable', () => {
  const files = build(['core']);
  assertInstall(files, ['core']);
  assert.ok(
    [...files.keys()].some(key => key.startsWith('kai-core/scripts/') && key.endsWith('.mjs')),
    'Core-only install emits its public executables',
  );
});

test('Core + Engineering install contains only those packages', () => {
  assertInstall(build(['core', 'engineering']), ['core', 'engineering']);
});

test('Core + Creative install contains only those packages', () => {
  assertInstall(build(['core', 'creative']), ['core', 'creative']);
});

test('all packages install as one closed generated surface', () => {
  assertInstall(build(expectedPacks), expectedPacks);
});

test('department packages do not depend on each other', () => {
  const owners = new Map([
    ...sourceAgentFiles(root).map(entry => [`agent:${entry.id}`, entry.pack]),
    ...sourceSkillFiles(root).map(entry => [`skill:${entry.id}`, entry.pack]),
  ]);
  const violations = collectReferences(root)
    .filter(reference => reference.fromPack && reference.kind !== 'asset')
    .map(reference => ({
      ...reference,
      targetPack: owners.get(`${reference.kind}:${reference.target}`) ?? null,
    }))
    .filter(reference =>
      reference.fromPack !== 'core'
      && reference.targetPack !== null
      && reference.targetPack !== 'core'
      && reference.targetPack !== reference.fromPack)
    .map(reference =>
      `${reference.fromPack}:${reference.from} -> ${reference.targetPack}:${reference.target}`);
  assert.deepEqual(violations, []);
});

test('generated executables reject external runtime imports', () => {
  const files = build(expectedPacks);
  assert.deepEqual(generatedRuntimeErrors(files), []);

  const mutated = new Map(files);
  const script = [...mutated.keys()].find(key =>
    key.startsWith('kai-core/scripts/') && key.endsWith('.mjs'));
  assert.ok(script, 'Core must emit a script to exercise the runtime-import gate');
  mutated.set(script, `${mutated.get(script)}\nimport "external-runtime-dependency";\n`);
  assert.match(
    generatedRuntimeErrors(mutated).map(error => error.msg).join('\n'),
    /external-runtime-dependency|bare module|Node built-ins/i,
  );
});

test('generated script filenames are stable for identical source', () => {
  const first = materializePacks({root, version, packs: expectedPacks});
  const second = materializePacks({root, version, packs: expectedPacks});
  const names = files => [...files.keys()]
    .filter(key => key.includes('/scripts/') && key.endsWith('.mjs'))
    .sort();
  const firstNames = names(first);
  assert.deepEqual(names(second), firstNames);
  const chunkFiles = firstNames.filter(name => /\/scripts\/chunk-[A-Z0-9-]+\.mjs$/i.test(name));
  const coreFiles = firstNames
    .filter(name => name.startsWith('kai-core/'))
    .map(name => name.slice('kai-core/'.length));
  const creativeFiles = firstNames
    .filter(name => name.startsWith('kai-creative/'))
    .map(name => name.slice('kai-creative/'.length));
  assert.deepEqual(chunkFiles, []);
  assert.ok(coreFiles.includes('scripts/runtime-core.mjs'));
  assert.ok(creativeFiles.includes('scripts/runtime-creative.mjs'));
});

test('generated drift detection reports a changed committed file', async () => {
  const {buildPlan, checkPlan, writePlan} = await import('../tools/build.mjs');
  const plan = buildPlan(root);
  assert.equal(checkPlan(root, plan).ok, true);
  assert.equal(JSON.parse(plan.get('plugin.json')).version, packageJson.version);
  const plannedMarketplace = JSON.parse(
    plan.get('.github/plugin/marketplace.json'),
  );
  assert.equal(plannedMarketplace.metadata.version, packageJson.version);
  for (const plugin of plannedMarketplace.plugins) {
    assert.equal(plugin.version, packageJson.version);
  }
  const scratch = join(root, 'test', `.package-build-${randomUUID()}`);
  mkdirSync(scratch, {recursive: true});
  try {
    writePlan(scratch, plan);
    assert.equal(checkPlan(scratch, plan).ok, true);
    const manifest = join(scratch, 'plugins', 'kai-core', 'plugin.json');
    writeFileSync(manifest, `${readFileSync(manifest, 'utf8')}\n`);
    const drifted = checkPlan(scratch, plan);
    assert.equal(drifted.ok, false);
    assert.ok(drifted.drift.some(entry =>
      entry.includes('plugins/kai-core/plugin.json')));

    writePlan(scratch, plan);
    const stale = join(scratch, 'plugins', 'kai-core', 'scripts', 'chunk-stale.mjs');
    writeFileSync(stale, 'export {};\n');
    const unexpected = checkPlan(scratch, plan);
    assert.equal(unexpected.ok, false);
    assert.ok(unexpected.drift.some(entry =>
      entry.includes('unexpected: plugins/kai-core/scripts/chunk-stale.mjs')));
  } finally {
    rmSync(scratch, {recursive: true, force: true});
  }
});
