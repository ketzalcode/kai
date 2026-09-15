import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const baseline = 'docs/reference/skill-evaluation/creative-baseline-2026-09-13';
const manifest = JSON.parse(readFileSync(join(root, baseline, 'manifest.json'), 'utf8')
  .replace(/^\uFEFF/, ''));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');

assert.equal(manifest.files.length, 20, 'the baseline keeps every captured log and stage mapping');
const names = new Set();
for (const entry of manifest.files) {
  assert.match(entry.path, /^[a-z0-9.-]+$/, 'baseline entries are local filenames');
  assert.ok(!names.has(entry.path), `duplicate baseline entry: ${entry.path}`);
  names.add(entry.path);
  const relative = `${baseline}/${entry.path}`;
  assert.equal(hash(readFileSync(join(root, relative))), entry.sha256,
    `${relative}: working bytes must match the captured evidence`);
  const indexed = execFileSync('git', ['show', `:${relative}`], { cwd: root });
  assert.equal(hash(indexed), entry.sha256,
    `${relative}: indexed bytes must match too; Git normalization is not evidence preservation`);
}

const attributes = execFileSync('git', [
  'check-attr', 'text', '--',
  `${baseline}/creative-baseline-stage-01.log`,
  'docs/reference/skill-evaluation/creative-foundation/grounding/current/SKILL.md',
], { cwd: root, encoding: 'utf8' }).trim().split(/\r?\n/);
assert.ok(attributes.every(line => line.endsWith(': text: unset')),
  'raw baseline and authoring evidence must bypass Git line-ending normalization');
console.log('creative evidence captured/indexed byte assertions passed');
