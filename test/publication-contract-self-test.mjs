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
  publicationRoutingErrors,
  renderPublicationTable,
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

test('rendered tables match their managed skill region', () => {
  for (const pack of PACK_ORDER) {
    const contract = publicationContract(pack);
    const body = readFileSync(contract.skillPath, 'utf8');
    assert.equal(body.includes(renderPublicationTable(contract)), true);
  }
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

test('direct asset production outside a publication skill fails', () => {
  assert.match(publicationRoutingErrors({
    pack: 'engineering',
    id: 'bypass',
    body: 'Use `kai-core-asset-producing` now.',
    fm: {},
  }).join('\n'), /publication entrypoint|direct/i);
});

test('the shipped route corpus obeys positive publication ordering', () => {
  const entries = [
    ...sourceAgentFiles(root),
    ...sourceSkillFiles(root),
  ].map(entry => ({...entry, body: readFileSync(entry.path, 'utf8')}));
  assert.ok(entries.length >= 50, `expected a non-vacuous route corpus, found ${entries.length}`);
  const errors = entries.flatMap(entry =>
    publicationRoutingErrors(entry).map(message => `${entry.rel}: ${message}`));
  assert.deepEqual(errors, []);
});

test('each asset-production route requires an earlier owning publication route', () => {
  assert.match(publicationRoutingErrors({
    pack: 'engineering',
    id: 'reversed',
    body: [
      'Load `kai-core-asset-producing` to create the artifact.',
      'Load `engineering-workspace-publication` to validate publication.',
    ].join('\n'),
    fm: {'publication-entrypoint': 'engineering-workspace-publication'},
  }).join('\n'), /before|precede|earlier/i);

  assert.deepEqual(publicationRoutingErrors({
    pack: 'engineering',
    id: 'separated',
    body: [
      'Load `engineering-workspace-publication` to validate publication.',
      'Load `kai-core-workspace-paths` to resolve the destination.',
      'Load `kai-core-asset-producing` to create the artifact.',
    ].join('\n'),
    fm: {'publication-entrypoint': 'engineering-workspace-publication'},
  }), []);
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
