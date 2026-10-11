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
