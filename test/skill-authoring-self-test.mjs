import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import test from 'node:test';
import {fileURLToPath} from 'node:url';
import {
  loaderErrors,
  parseFrontmatter,
} from '../src/core/lib/loader-contract.mjs';
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
  const body = skills.get('kai-create-skill');
  assert.ok(body, 'kai-create-skill must exist');
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

test('development-design documents keep Markdown authoritative and Word readable', () => {
  const body = skills.get('development-design-documents');
  assert.ok(body, 'development-design-documents must exist');
  assert.match(body, /^user-invocable:\s*true$/m);
  assert.match(body, /Markdown is the content authority/i);
  assert.match(body, /Describe the full design before reporting current completion/i);
  assert.match(body, /Put volatile current-state tables near the end/i);
  assert.match(body, /Word document defaults/);
  assert.match(body, /Do not meet a page target by shrinking body text/i);

  const reference = readFileSync(
    join(
      root,
      'plugins',
      'kai-engineering',
      'skills',
      'development-design-documents',
      'references',
      'word-document-format.md',
    ),
    'utf8',
  );
  assert.match(reference, /A4, portrait/i);
  assert.match(reference, /Calibri 11 pt/i);
  assert.match(reference, /Place explanatory text after the image/i);
  assert.match(reference, /page count is observed, not estimated/i);
});

test('create-agent keeps roles focused and routes shared context just in time', () => {
  const body = skills.get('kai-create-agent');
  assert.ok(body, 'kai-create-agent must exist');
  assert.match(body, /^user-invocable:\s*true$/m);
  assert.ok(body.split('\n').length <= 130, 'create-agent must stay lean');
  assert.match(body, /An agent\s+is permanent context and coordination cost/);
  assert.match(body, /\*\*Catalog:\*\*/);
  assert.match(body, /\*\*Agent body:\*\*/);
  assert.match(body, /\*\*Task-local resources:\*\*/);
  assert.match(body, /invoke the Core skill directly at\s+that\s+boundary/i);
  assert.match(body, /Do not add an `\*\*Inherits:\*\*` line/);
  assert.match(body, /A conditional route is still just in time/);
  assert.match(body, /Never create a\s+`workflow-\*` agent/);
});

test('loader contract rejects malformed agent and skill frontmatter', () => {
  const cases = [
    ['skill', 'argument-hint-array', [
      'name: argument-hint-array',
      'description: malformed argument hint',
      'tools: [read]',
      'user-invocable: true',
      'argument-hint: [file, area]',
    ], /argument-hint.*inline array/i],
    ['skill', 'tools-not-array', [
      'name: tools-not-array',
      'description: malformed tools',
      'tools: read',
    ], /tools.*inline array/i],
    ['agent', 'unsupported-tool', [
      'name: unsupported-tool',
      'description: malformed tool',
      'tools: [read, teleport]',
    ], /not in kai's tool vocabulary/i],
    ['agent', 'skill-key-on-agent', [
      'name: skill-key-on-agent',
      'description: malformed agent affordance',
      'tools: [read]',
      'user-invocable: true',
    ], /skill-only/i],
    ['agent', 'model-array', [
      'name: model-array',
      'description: malformed model',
      'model: [gpt-5, claude]',
      'tools: [read]',
    ], /model.*quoted scalar string/i],
    ['agent', 'model-non-string', [
      'name: model-non-string',
      'description: malformed model',
      'model: true',
      'tools: [read]',
    ], /model.*quoted scalar string/i],
    ['agent', 'model-unapproved', [
      'name: model-unapproved',
      'description: malformed model',
      'model: "unreviewed-model"',
      'tools: [read]',
    ], /approved agent model set/i],
    ['agent', 'name-mismatch', [
      'name: a-different-name',
      'description: malformed identity',
      'tools: [read]',
    ], /name .* must equal/i],
    ['agent', 'disable-model-invocation-value', [
      'name: disable-model-invocation-value',
      'description: malformed invocation control',
      'tools: [read]',
      'disable-model-invocation: sometimes',
    ], /disable-model-invocation.*true.*false/i],
  ];

  for (const [kind, id, lines, expected] of cases) {
    const parsed = parseFrontmatter(['---', ...lines, '---', ''].join('\n'));
    assert.equal(parsed.ok, true, `${id} frontmatter must parse before validation`);
    assert.match(loaderErrors(kind, id, parsed.fm).join('\n'), expected, id);
  }
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
  assert.match(
    agentTaxonomyErrors({id: 'workflow-release', pack: 'engineering'}).join('\n'),
    /not supported/,
  );
  assert.match(
    agentTaxonomyErrors({id: 'principal-engineer-career-mentor', pack: 'engineering'})
      .join('\n'),
    /not supported/,
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
    '- Apply `kai-core-operating-rules` when coordination begins.',
    '- Apply `kai-core-workspace-paths` when resolving the workspace.',
    '- Record activity only after the run.',
  ].join('\n')), []);

  assert.equal(hoistedSkillRouteErrors([
    '- Apply `kai-core-operating-rules`,',
    '  `kai-core-workspace-paths`, and `kai-core-work-granting` before work.',
  ].join('\n')).length, 1);
});

test('the active agent and skill reference graph is acyclic', () => {
  assert.deepEqual(referenceCycleErrors(collectReferences(root)), []);
});

test('pre-implementation research composes a standalone Engineering investigation in one direction', () => {
  const refs = collectReferences(root);
  const research = 'plugins/kai-engineering/skills/research-before-coding/SKILL.md';
  const investigation = 'plugins/kai-engineering/skills/engineering-investigation/SKILL.md';
  assert.ok(refs.some(ref => ref.from === research
    && ref.kind === 'skill' && ref.target === 'engineering-investigation'
    && ref.firing.includes('loaded')));
  assert.ok(refs.some(ref => ref.from === investigation
    && ref.fromPack === 'engineering' && ref.kind === 'skill'
    && ref.target === 'engineering-investigation'
    && ref.firing.includes('user-invoked')));
  assert.deepEqual(refs.filter(ref => ref.from === investigation
    && ['research-before-coding', 'software-development'].includes(ref.target)), []);
  for (const from of [
    'plugins/kai-engineering/skills/pr-review/SKILL.md',
    'plugins/kai-engineering/skills/development-design-documents/SKILL.md',
    'plugins/kai-engineering/agents/eng-lead-technical-writing.agent.md',
  ]) {
    const targets = refs.filter(ref => ref.from === from && ref.kind === 'skill')
      .map(ref => ref.target);
    assert.ok(targets.includes('engineering-investigation'), from);
    assert.ok(!targets.includes('research-before-coding'), from);
  }
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
