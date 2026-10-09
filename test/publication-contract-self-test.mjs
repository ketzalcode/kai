import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {test} from 'node:test';
import {
  PACK_ORDER,
  publicationContract,
  publicationRoutingErrors,
  renderPublicationTable,
} from '../tools/lib/pack-plan.mjs';

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
