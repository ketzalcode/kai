import assert from 'node:assert/strict';
import {
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import {dirname, join} from 'node:path';
import {test} from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  PACK_ORDER,
  publicationContract,
  publicationDeclarationInventoryErrors,
  publicationRoutingErrors,
  sourceAgentFiles,
  sourceSkillFiles,
} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = join(root, 'test', '.publication-contract-case');

function withEngineeringContract(mutate, verify) {
  const contract = JSON.parse(readFileSync(
    join(root, 'plugins', 'kai-engineering', 'publication.json'),
    'utf8',
  ));
  mutate(contract);
  const declarationDir = join(fixtureRoot, 'plugins', 'kai-engineering');
  rmSync(fixtureRoot, {recursive: true, force: true});
  mkdirSync(declarationDir, {recursive: true});
  writeFileSync(
    join(declarationDir, 'publication.json'),
    `${JSON.stringify(contract, null, 2)}\n`,
  );
  try {
    verify();
  } finally {
    rmSync(fixtureRoot, {recursive: true, force: true});
  }
}

test('each shipped package has one valid publication declaration', () => {
  for (const pack of PACK_ORDER) {
    const contract = publicationContract(pack);
    assert.equal(contract.pack, pack);
    assert.ok(contract.entries.length > 0);
  }
});

test('publication inventory follows structured declarations', () => {
  const skills = sourceSkillFiles(root);
  assert.deepEqual(publicationDeclarationInventoryErrors(skills), []);
  assert.match(
    publicationDeclarationInventoryErrors(skills.filter(entry =>
      entry.id !== 'engineering-workspace-publication')).join('\n'),
    /kai-engineering.*engineering-workspace-publication/i,
  );
});

test('producer declarations must use their package entrypoint', () => {
  assert.deepEqual(publicationRoutingErrors({
    pack: 'engineering',
    id: 'producer',
    body: 'Use `engineering-workspace-publication` before production.',
    fm: {'publication-entrypoint': 'engineering-workspace-publication'},
  }), []);
  assert.match(publicationRoutingErrors({
    pack: 'engineering',
    id: 'foreign',
    body: 'Use `creative-workspace-publication`.',
    fm: {'publication-entrypoint': 'creative-workspace-publication'},
  }).join('\n'), /another pack|foreign/i);
});

test('non-producers need no negative declaration', () => {
  assert.deepEqual(publicationRoutingErrors({
    pack: 'engineering', id: 'reader', body: 'Read repository files.', fm: {},
  }), []);
});

test('the shipped route corpus obeys positive publication ordering', () => {
  const entries = [
    ...sourceAgentFiles(root),
    ...sourceSkillFiles(root),
  ].map(entry => ({...entry, body: readFileSync(entry.path, 'utf8')}));
  assert.ok(
    entries.some(entry =>
      /publication-entrypoint:/.test(entry.body)),
    'expected at least one shipped publication route',
  );
  const errors = entries.flatMap(entry =>
    publicationRoutingErrors(entry).map(message => `${entry.rel}: ${message}`));
  assert.deepEqual(errors, []);
});

test('publication declarations reject traversal and arbitrary roots', () => {
  withEngineeringContract(
    contract => {
      contract.entries[0].privateForm =
        '.kai/engineering/../core/features/<id>/{drafts,evidence,scratch}';
    },
    () => assert.throws(
      () => publicationContract('engineering', fixtureRoot),
      /privateForm.*traversal/i,
    ),
  );
  withEngineeringContract(
    contract => {
      contract.entries[0].privateForm =
        '.kai/engineering/..\\core\\features\\<id>';
    },
    () => assert.throws(
      () => publicationContract('engineering', fixtureRoot),
      /privateForm.*traversal/i,
    ),
  );
  withEngineeringContract(
    contract => {
      contract.entries[0].publicForm = 'published/features/<id>/';
    },
    () => assert.throws(
      () => publicationContract('engineering', fixtureRoot),
      /publicForm.*docs\/kai\/engineering/i,
    ),
  );
  withEngineeringContract(
    contract => {
      contract.entries[0].privateForm = 'C:\\kai\\engineering\\features\\<id>';
    },
    () => assert.throws(
      () => publicationContract('engineering', fixtureRoot),
      /privateForm/i,
    ),
  );
});

test('publication declarations reject Markdown and control-character injection', () => {
  for (const [field, value, expected] of [
    ['type', 'features|injected', /type.*safe slug/i],
    [
      'privateForm',
      '.kai/engineering/features/<id>/`injected',
      /privateForm.*backtick/i,
    ],
    [
      'publicForm',
      'docs/kai/engineering/features/<id>/|injected',
      /publicForm.*pipe/i,
    ],
    [
      'publicForm',
      'docs/kai/engineering/features/<id>/\ninjected',
      /publicForm.*control/i,
    ],
  ]) {
    withEngineeringContract(
      contract => {
        contract.entries[0][field] = value;
      },
      () => assert.throws(
        () => publicationContract('engineering', fixtureRoot),
        expected,
      ),
    );
  }
});
