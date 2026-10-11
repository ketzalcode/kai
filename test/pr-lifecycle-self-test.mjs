import assert from 'node:assert/strict';
import {existsSync, readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  sourceAgentFiles,
  sourceSkillFiles,
} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const readEntries = entries => new Map(entries.map(entry => [
  entry.id,
  readFileSync(entry.path, 'utf8').replace(/\r\n/g, '\n'),
]));
const agents = readEntries(sourceAgentFiles(root));
const skills = readEntries(sourceSkillFiles(root));
const readAgent = id => {
  assert.ok(agents.has(id), `active agent ${id} must exist`);
  return agents.get(id);
};
const readSkill = id => {
  assert.ok(skills.has(id), `active skill ${id} must exist`);
  return skills.get(id);
};

test('software lead is the single active PR integration owner', () => {
  assert.equal(agents.has('eng-lead-software'), true);
  assert.equal(agents.has('workflow-pull-request'), false);
  assert.equal(agents.has('eng-lead-architecture'), false);
  assert.equal(
    existsSync(join(
      root,
      'incubator',
      'kai-engineering',
      'agents',
      'eng-lead-architecture.agent.md',
    )),
    true,
  );

  const lead = readAgent('eng-lead-software');
  assert.match(lead, /Apply `kai-core-work-granting`/);
  assert.match(lead, /Apply `pr-sizing` after integration, when the complete diff exists/);
  assert.match(lead, /Apply `pr-delivery`/);
  assert.match(lead, /eng-reviewer-code/);
  assert.match(lead, /Never merge, deploy, tag, release/);
});

test('builders stop at implementation evidence handoff', () => {
  for (const id of ['eng-builder-software', 'eng-builder-platform']) {
    const body = readAgent(id);
    assert.doesNotMatch(body, /Apply `pr-sizing`/);
    assert.doesNotMatch(body, /Apply `pr-delivery`/);
    assert.match(body, /eng-lead-software/);
    assert.match(body, /changed-behavior tests|Tests for changed/);
  }
});

test('pr sizing uses the completed diff and reviewability boundaries', () => {
  const sizing = readSkill('pr-sizing');
  assert.match(sizing, /complete integrated diff/);
  assert.match(sizing, /four or five primary hand-authored files/);
  assert.match(sizing, /signal, not a cap/);
  assert.match(
    sizing,
    /Do not split solely because one part is client-side and another is server-side/,
  );
  assert.match(sizing, /independently valid and testable/);
});

test('pr delivery reads the shared description reference', () => {
  const delivery = readSkill('pr-delivery');
  assert.match(delivery, /references\/pr-description\.md/);
  assert.match(delivery, /opens and prepares/);
  assert.doesNotMatch(delivery, /opens and lands/);
  assert.match(
    delivery,
    /changed behavior, preserved behavior, scope boundary\/dependency, or evidence/,
  );

  const reference = readFileSync(join(
    root,
    'plugins',
    'kai-engineering',
    'skills',
    'pr-delivery',
    'references',
    'pr-description.md',
  ), 'utf8').replace(/\r\n/g, '\n');
  assert.match(
    reference,
    /When a fact is not settled,[\s\S]*Pending decision[\s\S]*Not applicable/,
  );
  assert.match(
    reference,
    /Include one small ASCII diagram only when it is materially clearer;[\s\S]*omit the[\s\S]*section when it adds no information\./,
  );
  assert.match(
    reference,
    /Add rollout and removal gates only when[\s\S]*those cases apply\./,
  );
  assert.match(reference, /^## Overview$/m);
  assert.match(reference, /^## Scoped architecture$/m);
  assert.match(reference, /^## Validation scenarios$/m);
  assert.match(reference, /^## Rollout and removal gates$/m);
  for (const scenario of [
    'Default/inactive',
    'Enabled success',
    'Compatibility/error',
    'Rollback',
  ]) {
    assert.match(reference, new RegExp(scenario.replace('/', '\\/')));
  }
});
