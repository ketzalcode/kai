import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {existsSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';
import {
  COORDINATION_DATABASE,
  DIRECTION_PATH,
  PRIVATE_ROOT,
  PUBLICATION_ROOT,
  WORKSPACE_SCHEMA_VERSION,
  archivedArtifactDirectory,
  directionPath,
  privateArtifactDirectory,
  publicationDirectory,
} from '../src/core/lib/workspace-layout.mjs';

test('exports the schema-5 workspace constants exactly', () => {
  assert.equal(WORKSPACE_SCHEMA_VERSION, 5);
  assert.equal(PRIVATE_ROOT, '.kai');
  assert.equal(PUBLICATION_ROOT, 'docs/kai');
  assert.equal(DIRECTION_PATH, 'docs/kai/DIRECTION.md');
  assert.equal(COORDINATION_DATABASE, '.kai/core/runtime/coordination.sqlite');
});

test('private artifact directories require pack, type, id, and lifecycle', () => {
  assert.throws(
    () => privateArtifactDirectory({type: 'documentation', id: 'auth-boundary', lifecycle: 'drafts'}),
    /pack/i,
  );
  assert.throws(
    () => privateArtifactDirectory({pack: 'engineering', id: 'auth-boundary', lifecycle: 'drafts'}),
    /type/i,
  );
  assert.throws(
    () => privateArtifactDirectory({pack: 'engineering', type: 'documentation', lifecycle: 'drafts'}),
    /id/i,
  );
  assert.throws(
    () => privateArtifactDirectory({pack: 'engineering', type: 'documentation', id: 'auth-boundary'}),
    /lifecycle/i,
  );
});

test('private artifact directories only allow drafts evidence and scratch lifecycle segments', () => {
  assert.equal(
    privateArtifactDirectory({
      pack: 'engineering',
      type: 'documentation',
      subtype: 'architecture',
      id: 'auth-boundary',
      lifecycle: 'drafts',
    }),
    '.kai/engineering/documentation/architecture/auth-boundary/drafts',
  );
  assert.equal(
    privateArtifactDirectory({
      pack: 'engineering',
      type: 'documentation',
      subtype: 'architecture',
      id: 'auth-boundary',
      lifecycle: 'evidence',
    }),
    '.kai/engineering/documentation/architecture/auth-boundary/evidence',
  );
  assert.equal(
    privateArtifactDirectory({
      pack: 'engineering',
      type: 'documentation',
      subtype: 'architecture',
      id: 'auth-boundary',
      lifecycle: 'scratch',
    }),
    '.kai/engineering/documentation/architecture/auth-boundary/scratch',
  );
  assert.throws(
    () => privateArtifactDirectory({
      pack: 'engineering',
      type: 'documentation',
      subtype: 'architecture',
      id: 'auth-boundary',
      lifecycle: 'published',
    }),
    /drafts, evidence, or scratch/i,
  );
});

test('archive paths use the private archive route with optional subtype', () => {
  assert.equal(
    archivedArtifactDirectory({
      pack: 'engineering',
      type: 'documentation',
      subtype: 'architecture',
      id: 'auth-boundary',
    }),
    '.kai/engineering/archive/documentation/architecture/auth-boundary',
  );
  assert.equal(
    archivedArtifactDirectory({
      pack: 'creative',
      type: 'media',
      id: 'launch-cut',
    }),
    '.kai/creative/archive/media/launch-cut',
  );
});

test('publication paths mirror the private pack type subtype and id route without lifecycle', () => {
  assert.equal(
    publicationDirectory({
      pack: 'engineering',
      type: 'documentation',
      subtype: 'architecture',
      id: 'auth-boundary',
    }),
    'docs/kai/engineering/documentation/architecture/auth-boundary',
  );
  assert.equal(
    publicationDirectory({
      pack: 'core',
      type: 'reports',
      id: 'delivery-status',
    }),
    'docs/kai/core/reports/delivery-status',
  );
});

test('direction resolves only through the fixed direction path helper', () => {
  assert.equal(directionPath(), 'docs/kai/DIRECTION.md');
});

test('unsafe path segments fail before any path is derived', () => {
  const cases = [
    ['empty', '', /empty/i],
    ['dot', '.', /dot segment/i],
    ['dot-dot', '..', /dot-dot/i],
    ['absolute', '/absolute', /absolute/i],
    ['drive-relative', 'C:relative', /drive-relative/i],
    ['UNC', '\\\\server\\share', /UNC|share/i],
    ['mixed-separator', 'mixed\\slash/name', /mixed-separator/i],
    ['reserved-device', 'con', /reserved-device/i],
    ['trailing-dot', 'trailing.', /trailing-dot-space/i],
    ['trailing-space', 'trailing ', /trailing-dot-space/i],
  ];

  for (const [label, value, pattern] of cases) {
    assert.throws(
      () => publicationDirectory({pack: 'engineering', type: 'documentation', subtype: 'architecture', id: value}),
      pattern,
      label,
    );
  }
});

test('unknown pack namespaces fail without creating a fallback path', () => {
  const fallbackRoot = join(process.cwd(), 'docs', 'kai', 'marketing');
  assert.equal(existsSync(fallbackRoot), false);
  assert.throws(
    () => publicationDirectory({pack: 'marketing', type: 'reports', id: 'launch-status'}),
    /unknown pack namespace/i,
  );
  assert.equal(existsSync(fallbackRoot), false);
});

test('deriving workspace layout paths never creates directories', () => {
  const id = `layout-${randomUUID()}`;
  const privatePath = privateArtifactDirectory({
    pack: 'engineering',
    type: 'documentation',
    subtype: 'architecture',
    id,
    lifecycle: 'drafts',
  });
  const archivePath = archivedArtifactDirectory({
    pack: 'engineering',
    type: 'documentation',
    subtype: 'architecture',
    id,
  });
  const publicPath = publicationDirectory({
    pack: 'engineering',
    type: 'documentation',
    subtype: 'architecture',
    id,
  });

  for (const relativePath of [privatePath, archivePath, publicPath]) {
    assert.equal(existsSync(join(process.cwd(), relativePath)), false, `${relativePath} should not exist before derivation`);
  }

  assert.equal(privatePath.endsWith('/drafts'), true);
  assert.equal(archivePath.includes('/archive/'), true);
  assert.equal(publicPath.startsWith('docs/kai/engineering/'), true);

  for (const relativePath of [privatePath, archivePath, publicPath]) {
    assert.equal(existsSync(join(process.cwd(), relativePath)), false, `${relativePath} should not exist after derivation`);
  }
});
