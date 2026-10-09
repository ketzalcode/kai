import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {
  cpSync,
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
const version = JSON.parse(readFileSync(join(root, 'plugin.json'), 'utf8')).version;
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
  assert.deepEqual(names(second), names(first));
  assert.ok(names(first).some(name => /\/scripts\/chunk-[A-Z0-9-]+\.mjs$/i.test(name)));
});

test('generated drift detection reports a changed committed file', async () => {
  const originalLog = console.log;
  console.log = () => {};
  let checkCommitted;
  try {
    ({checkCommitted} = await import('../tools/pack-preview.mjs'));
  } finally {
    console.log = originalLog;
  }

  const scratch = join(root, 'test', `.package-build-${randomUUID()}`);
  const copied = join(scratch, 'plugins');
  mkdirSync(scratch, {recursive: true});
  try {
    cpSync(join(root, 'plugins'), copied, {recursive: true});
    assert.equal(checkCommitted({root, base: copied, version}).ok, true);
    const manifest = join(copied, 'kai-core', 'plugin.json');
    writeFileSync(manifest, `${readFileSync(manifest, 'utf8')}\n`);
    const drifted = checkCommitted({root, base: copied, version});
    assert.equal(drifted.ok, false);
    assert.ok(drifted.drift.some(entry => entry.includes('kai-core/plugin.json')));
  } finally {
    rmSync(scratch, {recursive: true, force: true});
  }
});
