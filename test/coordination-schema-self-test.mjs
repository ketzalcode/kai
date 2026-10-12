import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  COMMAND_KINDS,
  RECORD_KINDS,
  TASK_SUBJECT_KINDS,
} from '../src/core/lib/coordination-runtime/schema.mjs';
import {WORKSPACE_CONTRACT} from '../src/core/lib/workspace-layout.mjs';
import {
  PACK_ORDER,
  packageAgentInventory,
  planManifests,
} from '../tools/lib/pack-plan.mjs';

const root = join(fileURLToPath(new URL('.', import.meta.url)), '..');

test('install packages stay separate from schema-6 workspace packages', () => {
  assert.equal(WORKSPACE_CONTRACT.schemaVersion, 6);
  assert.deepEqual(WORKSPACE_CONTRACT.packs, [
    'core',
    'project-management',
    'creative',
    'engineering',
  ]);
  assert.deepEqual(PACK_ORDER, [
    'core',
    'contributor',
    'project-management',
    'engineering',
    'creative',
  ]);
  assert.deepEqual(packageAgentInventory(root).contributor, []);
  assert.deepEqual(packageAgentInventory(root)['project-management'], []);
  const manifests = planManifests({root, version: '23.0.0'});
  assert.equal(manifests.length, 5);
  assert.deepEqual(
    manifests.find(entry => entry.pack === 'contributor').agents,
    [],
  );
  assert.deepEqual(
    manifests.find(entry => entry.pack === 'project-management').agents,
    [],
  );
});

test('Core executable schema contains standalone Tasks and no planning records or commands', () => {
  assert.deepEqual([...TASK_SUBJECT_KINDS], ['task']);
  assert.deepEqual([...RECORD_KINDS].sort(), [
    'approval', 'artifact', 'asset', 'attempt', 'effect', 'evidence', 'grant',
    'host-attempt', 'message', 'question', 'review', 'task',
  ]);
  assert.equal(
    [...COMMAND_KINDS].some(kind =>
      /^(?:direction|epic|feature|requirement)\./.test(kind)),
    false,
  );
  assert.equal(
    [...RECORD_KINDS].some(kind =>
      new Set(['direction', 'epic', 'feature', 'requirement']).has(kind)),
    false,
  );
});

test('Core source and active skills do not retain planning runtime surfaces', () => {
  const forbidden = [
    'src/core/lib/direction.mjs',
    'src/core/lib/coordination-runtime/hierarchy-contract.mjs',
    'src/core/lib/coordination-runtime/hierarchy-engine.mjs',
    'src/core/lib/coordination-runtime/hierarchy-view.mjs',
    'plugins/kai-core/skills/kai-core-create-epic/SKILL.md',
    'plugins/kai-core/skills/kai-core-work-hierarchy/SKILL.md',
    'plugins/kai-core/skills/kai-core-work-stewardship/SKILL.md',
  ];
  for (const path of forbidden) {
    assert.throws(() => readFileSync(join(root, ...path.split('/'))), /ENOENT/);
  }
  const task = readFileSync(
    join(root, 'src', 'core', 'lib', 'coordination-runtime', 'task-contract.mjs'),
    'utf8',
  );
  assert.doesNotMatch(task, /\bfeature_id\b|\bsatisfies\b|\bpriority\b/);
  assert.match(task, /\bplanning_refs\b/);
});
