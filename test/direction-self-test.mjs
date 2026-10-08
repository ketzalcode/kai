import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
import {
  mkdirSync, rmSync, symlinkSync, writeFileSync,
} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {readDirection, requireDirection} from '../src/core/lib/direction.mjs';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const scratchRoot = join(repoRoot, '.superpowers', 'direction-self-test');
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const code = expected => error => error?.code === expected;

function withWorkspace(fn) {
  mkdirSync(scratchRoot, {recursive: true});
  const root = join(scratchRoot, randomUUID());
  mkdirSync(root, {recursive: true});
  try {
    return fn(root);
  } finally {
    rmSync(root, {recursive: true, force: true});
  }
}

function write(root, relativePath, contents) {
  const absolute = join(root, ...relativePath.split('/'));
  mkdirSync(dirname(absolute), {recursive: true});
  writeFileSync(absolute, contents);
  return absolute;
}

function manifest(overrides = {}) {
  return {
    direction: 'docs/kai/DIRECTION.md',
    projects: [{id: 'default', path: '.', publication_root: 'docs/kai'}],
    ...overrides,
  };
}

function validDirection({goal = 'Ship the schema 5 direction binding.'} = {}) {
  return Buffer.from(`---
owner: operator
updated: 2026-10-06
---

# Vision

Keep coordinated work bound to operator-owned direction.

# Mission

Help contributors act inside exact project constraints.

# Current Goal

  ${goal}
    With preserved indentation on later lines.

# Out of Scope

- Generating or overwriting direction content.
`, 'utf8');
}

test('reads exact direction bytes, trims only outer goal whitespace, and ignores heading lookalikes in code fences', () => withWorkspace((root) => {
  const bytes = Buffer.from(`---
owner: operator
updated: 2026-10-06
---

\`\`\`md
# Vision
fake
# Mission
fake
# Current Goal
fake
# Out of Scope
fake
\`\`\`

# Vision

Keep coordinated work bound to operator-owned direction.

# Mission

Help contributors act inside exact project constraints.

# Current Goal

  Bind direction to exact project bytes.
    Preserve this indented continuation.

# Out of Scope

- Rewriting operator content.
`, 'utf8');
  write(root, 'docs/kai/DIRECTION.md', bytes);

  const result = readDirection({workspaceRoot: root, manifest: manifest()});

  assert.equal(result.path, 'docs/kai/DIRECTION.md');
  assert.equal(result.hash, hash(bytes));
  assert.equal(result.bytes.equals(bytes), true);
  assert.equal(result.goal, 'Bind direction to exact project bytes.\n    Preserve this indented continuation.');
  assert.deepEqual(result.sections, {
    vision: 'Keep coordinated work bound to operator-owned direction.',
    mission: 'Help contributors act inside exact project constraints.',
    currentGoal: 'Bind direction to exact project bytes.\n    Preserve this indented continuation.',
    outOfScope: '- Rewriting operator content.',
  });
}));

test('duplicate, missing, empty, reordered, or code-fence-only sections are INVALID_DIRECTION', () => withWorkspace((root) => {
  const cases = new Map([
    ['duplicate', `# Vision

One.

# Mission

Two.

# Current Goal

Three.

# Out of Scope

Four.

# Vision

Again.
`],
    ['missing', `# Vision

One.

# Mission

Two.

# Out of Scope

Four.
`],
    ['empty', `# Vision

One.

# Mission

Two.

# Current Goal

   

# Out of Scope

Four.
`],
    ['reordered', `# Mission

Two.

# Vision

One.

# Current Goal

Three.

# Out of Scope

Four.
`],
    ['code fence only', `\`\`\`md
# Vision
One.
# Mission
Two.
# Current Goal
Three.
# Out of Scope
Four.
\`\`\`
`],
  ]);

  for (const [label, contents] of cases) {
    write(root, 'docs/kai/DIRECTION.md', Buffer.from(contents, 'utf8'));
    assert.throws(
      () => readDirection({workspaceRoot: root, manifest: manifest()}),
      code('INVALID_DIRECTION'),
      label,
    );
  }
}));

test('hashes exact UTF-8 bytes without normalizing line endings', () => withWorkspace((root) => {
  const crlfBytes = Buffer.from(
    '# Vision\r\n\r\nOne.\r\n\r\n# Mission\r\n\r\nTwo.\r\n\r\n# Current Goal\r\n\r\nThree.\r\n\r\n# Out of Scope\r\n\r\nFour.\r\n',
    'utf8',
  );
  const lfBytes = Buffer.from(
    '# Vision\n\nOne.\n\n# Mission\n\nTwo.\n\n# Current Goal\n\nThree.\n\n# Out of Scope\n\nFour.\n',
    'utf8',
  );
  write(root, 'docs/kai/DIRECTION.md', crlfBytes);

  const result = readDirection({workspaceRoot: root, manifest: manifest()});

  assert.equal(result.hash, hash(crlfBytes));
  assert.notEqual(result.hash, hash(lfBytes));
}));

test('uses the configured project publication root and direction file', () => withWorkspace((root) => {
  write(root, 'apps/site/publication/DIRECTION.md', validDirection({goal: 'Ship the site direction binding.'}));

  const result = readDirection({
    workspaceRoot: root,
    manifest: manifest({
      projects: [
        {id: 'default', path: '.', publication_root: 'docs/kai'},
        {id: 'site', path: 'apps/site', publication_root: 'publication'},
      ],
    }),
    projectId: 'site',
  });

  assert.equal(result.path, 'publication/DIRECTION.md');
  assert.equal(result.goal, 'Ship the site direction binding.\n    With preserved indentation on later lines.');
}));

test('missing coordinated direction is DIRECTION_REQUIRED', () => withWorkspace((root) => {
  assert.throws(
    () => readDirection({workspaceRoot: root, manifest: manifest()}),
    code('DIRECTION_REQUIRED'),
  );
}));

test('direct traversal, junction escape, and case alias escape are PATH_ESCAPE', () => withWorkspace((root) => {
  write(root, 'docs/kai/DIRECTION.md', validDirection());
  assert.throws(
    () => readDirection({
      workspaceRoot: root,
      manifest: manifest({projects: [{id: 'default', path: '.', publication_root: '../outside'}]}),
    }),
    code('PATH_ESCAPE'),
  );

  const outside = join(root, 'outside-publication');
  mkdirSync(outside, {recursive: true});
  write(root, 'outside-publication/DIRECTION.md', validDirection({goal: 'Escaped through a junction.'}));
  symlinkSync(outside, join(root, 'linked-publication'), 'junction');
  assert.throws(
    () => readDirection({
      workspaceRoot: root,
      manifest: manifest({projects: [{id: 'default', path: '.', publication_root: 'linked-publication'}]}),
    }),
    code('PATH_ESCAPE'),
  );

  write(root, '.kai/DIRECTION.md', validDirection({goal: 'Private alias should not count.'}));
  assert.throws(
    () => readDirection({
      workspaceRoot: root,
      manifest: manifest({projects: [{id: 'default', path: '.', publication_root: '.KaI'}]}),
    }),
    code('PATH_ESCAPE'),
  );
}));

test('requireDirection with coordinated false returns early without touching the filesystem', () => {
  const guardedManifest = new Proxy({}, {
    get() {
      throw new Error('manifest should not be read');
    },
  });

  assert.equal(
    requireDirection({
      workspaceRoot: join(repoRoot, '.superpowers', 'does-not-need-to-exist'),
      manifest: guardedManifest,
      projectId: 'default',
      coordinated: false,
    }),
    null,
  );
});
