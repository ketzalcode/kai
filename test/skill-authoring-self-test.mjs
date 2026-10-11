import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  collectReferences,
  referenceCycleErrors,
  sourceSkillFiles,
} from '../tools/lib/pack-plan.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const skills = new Map(sourceSkillFiles(root).map(entry => [
  entry.id,
  readFileSync(entry.path, 'utf8').replace(/\r\n/g, '\n'),
]));

test('create-skill keeps reusable resources caller-agnostic and lean', () => {
  const body = skills.get('kai-core-create-skill');
  assert.ok(body, 'kai-core-create-skill must exist');
  assert.match(body, /^user-invocable:\s*true$/m);
  assert.ok(body.split('\n').length <= 130, 'create-skill must stay lean');
  assert.match(body, /The caller may know the resource\. The resource must not know its caller\./);
  assert.match(body, /search both directions/i);
  assert.match(body, /move genuinely shared behavior\s+into a third lower-level skill C/i);
  assert.match(body, /immutable admission or accepted basis/);
  assert.match(body, /append-only observations or checkpoints/);
  assert.match(body, /final read-only projection or report/);
  assert.doesNotMatch(body, /eng-nightshift|eng-lead-software/);
});

test('the active agent and skill reference graph is acyclic', () => {
  assert.deepEqual(referenceCycleErrors(collectReferences(root)), []);
});

test('reference cycles report the complete caller-resource loop', () => {
  const refs = [
    {
      from: 'plugins/kai-engineering/agents/example-agent.agent.md',
      kind: 'skill',
      target: 'example-skill',
    },
    {
      from: 'plugins/kai-engineering/skills/example-skill/SKILL.md',
      kind: 'agent',
      target: 'example-agent',
    },
  ];
  const errors = referenceCycleErrors(refs);
  assert.equal(errors.length, 1);
  assert.match(
    errors[0].msg,
    /agent:example-agent -> skill:example-skill -> agent:example-agent/,
  );
  assert.match(errors[0].msg, /resource must not route back to its caller/);
});
