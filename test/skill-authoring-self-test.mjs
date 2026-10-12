import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  agentTaxonomyErrors,
  collectReferences,
  hoistedSkillRouteErrors,
  referenceCycleErrors,
  sourceAgentFiles,
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
  assert.match(body, /\*\*Catalog:\*\*/);
  assert.match(body, /\*\*Instructions:\*\*/);
  assert.match(body, /\*\*Resources:\*\*/);
  assert.match(body, /Do not begin with a collected dependency list/);
  assert.doesNotMatch(body, /eng-nightshift|eng-lead-software/);
});

test('create-agent keeps roles focused and routes shared context just in time', () => {
  const body = skills.get('kai-core-create-agent');
  assert.ok(body, 'kai-core-create-agent must exist');
  assert.match(body, /^user-invocable:\s*true$/m);
  assert.ok(body.split('\n').length <= 130, 'create-agent must stay lean');
  assert.match(body, /An agent\s+is permanent context and coordination cost/);
  assert.match(body, /\*\*Catalog:\*\*/);
  assert.match(body, /\*\*Agent body:\*\*/);
  assert.match(body, /\*\*Task-local resources:\*\*/);
  assert.match(body, /invoke `kai-core-contract-v1`\s+immediately before that Core skill/);
  assert.match(body, /Do not add an `\*\*Inherits:\*\*` line/);
  assert.match(body, /A conditional route is still just in time/);
  assert.match(body, /Never create a\s+`workflow-\*` agent/);
});

test('active agents use responsibility identities rather than workflow prefixes', () => {
  assert.deepEqual(
    sourceAgentFiles(root).filter(entry => entry.id.startsWith('workflow-')),
    [],
  );
});

test('Core remains an agent-free skills and runtime package', () => {
  assert.deepEqual(
    sourceAgentFiles(root).filter(entry => entry.pack === 'core'),
    [],
  );
  assert.deepEqual(
    agentTaxonomyErrors({id: 'core-coordinator-delivery', pack: 'core'}),
    ['kai-core is an agent-free skills and runtime package'],
  );
});

test('authoring validation rejects collected Core preflight routes', () => {
  assert.deepEqual(hoistedSkillRouteErrors([
    '## PREPARE',
    '',
    'Apply `kai-core-operating-rules` before work. Apply',
    '`kai-core-workspace-paths`, `kai-core-work-task`, and',
    '`kai-core-work-granting` before interpreting the request.',
  ].join('\n')), [
    'collects 4 Core skill routes in one instruction; route each skill at the '
      + 'decision that needs it instead of eager preflight',
  ]);

  assert.deepEqual(hoistedSkillRouteErrors([
    '- Invoke `kai-core-contract-v1` immediately before coordination.',
    '- Apply `kai-core-workspace-paths` when resolving the workspace.',
    '- Apply `kai-core-work-acting` immediately before a state write.',
  ].join('\n')), []);

  assert.equal(hoistedSkillRouteErrors([
    '- Apply `kai-core-operating-rules`,',
    '  `kai-core-workspace-paths`, and `kai-core-work-granting` before work.',
  ].join('\n')).length, 1);
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
