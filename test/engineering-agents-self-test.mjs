import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  sourceAgentFiles, sourceSkillFiles, materializePacks, collectReferences,
  agentRoutingErrors, agentProfileModelErrors, agentTaxonomyErrors, normalizeLF,
} from '../tools/lib/pack-plan.mjs';
import * as packPlan from '../tools/lib/pack-plan.mjs';
import {
  parseFrontmatter, parseToolList, stripQuotes, loaderErrors,
} from '../src/core/lib/loader-contract.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const expected = {
  'eng-advisor-investigation': 'gpt-5.6-sol',
  'eng-lead-architecture': 'gpt-5.6-sol',
  'eng-builder-software': 'claude-sonnet-5',
  'eng-builder-platform': 'claude-sonnet-5',
  'eng-reviewer-code': 'gpt-5.6-terra',
  'eng-reviewer-quality': 'gpt-5.6-terra',
  'eng-reviewer-security': 'gpt-5.6-terra',
  'eng-reviewer-reliability': 'gpt-5.6-terra',
  'eng-reviewer-privacy-compliance': 'claude-opus-5',
  'eng-lead-technical-writing': 'claude-opus-5',
  'workflow-pull-request': 'claude-sonnet-5',
  'workflow-ship': 'claude-sonnet-5',
  'workflow-incident-response': 'claude-sonnet-5',
};
const agents = sourceAgentFiles(root).filter(entry => entry.pack === 'engineering');
assert.deepEqual(agents.map(entry => entry.id).sort(), Object.keys(expected).sort(),
  'engineering discovery must expose the standalone roster, not retired identities');
assert.equal(typeof packPlan.publicationRoutingErrors, 'function',
  'engineering agent tests require the shared publication-routing validator');
const allSkills = sourceSkillFiles(root);
const availableSkills = new Set(allSkills
  .filter(entry => ['core', 'engineering'].includes(entry.pack)).map(entry => entry.id));
const refs = collectReferences(root).filter(ref => ref.fromPack === 'engineering');
for (const ref of refs.filter(ref => ref.kind === 'skill' && ref.firing.includes('loaded'))) {
  assert.ok(availableSkills.has(ref.target),
    `${ref.from} requires ${ref.target} outside core plus engineering`);
}
assert.deepEqual(refs.filter(ref => ref.kind === 'agent' &&
  ref.firing.some(firing => ['loaded', 'orchestrated'].includes(firing))), [],
  'standalone engineering must not dispatch another agent as an installation prerequisite');

const files = materializePacks({ root, version: '9.9.9-agent-test' });
const emittedAgents = [...files.keys()]
  .filter(key => /^kai-engineering\/agents\/.*\.agent\.md$/.test(key))
  .map(key => key.slice('kai-engineering/agents/'.length, -'.agent.md'.length)).sort();
assert.deepEqual(emittedAgents, Object.keys(expected).sort(),
  'the emitted plugin must match source discovery');
let durableProducers = 0;
for (const entry of agents) {
  const body = readFileSync(entry.path, 'utf8');
  assert.equal(files.get(`kai-engineering/agents/${entry.id}.agent.md`), normalizeLF(body),
    `${entry.id} must be emitted without a second prompt source`);
  const parsed = parseFrontmatter(body);
  assert.equal(parsed.ok, true, `${entry.id}: valid host frontmatter`);
  assert.equal(stripQuotes(parsed.fm.model), expected[entry.id],
    `${entry.id}: explicit approved profile model`);
  assert.deepEqual(loaderErrors('agent', entry.id, parsed.fm), []);
  assert.deepEqual(agentTaxonomyErrors(entry), []);
  assert.deepEqual(agentProfileModelErrors({ id: entry.id, body, fm: parsed.fm }), []);
  const tools = parseToolList(parsed.fm.tools);
  assert.ok(tools.includes('skill'), `${entry.id}: skill loading must be available`);
  assert.deepEqual(agentRoutingErrors({
    id: entry.id, pack: entry.pack, body, tools, knownSkills: availableSkills,
    knownAgents: new Set(agents.map(agent => agent.id)),
  }), [], `${entry.id}: core routes and bounded fallback`);
  assert.equal(packPlan.durableOutputProducerDeclaration({...entry, body}), true,
    `${entry.id}: engineering agents explicitly declare durable output production`);
  assert.deepEqual(packPlan.agentDirectOutputErrors({...entry, body}), [],
    `${entry.id}: direct output cannot become an unauthorized durable Kai artifact`);
  const publicationErrors = packPlan.publicationRoutingErrors({...entry, body});
  assert.deepEqual(publicationErrors, [],
    `${entry.id}: engineering publication route must immediately precede asset production`);
  durableProducers += 1;
  assert.ok(body.length <= 20_000, `${entry.id}: focused prompt budget`);
  if (entry.id.startsWith('eng-reviewer-') ||
    ['eng-advisor-investigation', 'eng-lead-technical-writing'].includes(entry.id)) {
    assert.ok(refs.some(ref => ref.from === entry.rel &&
      ref.target === 'kai-core-no-self-remediation' && ref.firing.includes('loaded')),
    `${entry.id}: assessment output must not become product remediation`);
  }
  if (entry.id === 'eng-advisor-investigation' || entry.id === 'eng-reviewer-code') {
    assert.ok(tools.includes('edit') && tools.includes('execute'),
      `${entry.id}: requested evidence and reviewer-owned coordination records need write tools`);
  }
  if (entry.id.startsWith('eng-builder-')) {
    assert.ok(tools.includes('edit') && tools.includes('execute'),
      `${entry.id}: implementation and its tests need edit and execution`);
    for (const skill of ['coding-standards', 'research-before-coding', 'pr-sizing']) {
      assert.ok(refs.some(ref => ref.from === entry.rel && ref.target === skill &&
        ref.firing.includes('loaded')), `${entry.id}: missing ${skill} route`);
    }
  }
}
assert.ok(durableProducers > 0,
  'engineering publication routing must inspect at least one declared durable producer');
const mutatedProducer = agents
  .map(entry => ({...entry, body: readFileSync(entry.path, 'utf8')}))
  .find(entry => packPlan.durableOutputProducerDeclaration(entry) === true);
assert.ok(mutatedProducer, 'engineering mutation needs one declared durable producer');
assert.ok(
  packPlan.publicationRoutingErrors({
    ...mutatedProducer,
    body: mutatedProducer.body
      .replace(
        /(?:Apply|Invoke|Load|Run)\s+(?:the\s+)?`engineering-workspace-publication`[^.]*\.\s*/gi,
        '',
      )
      .replace(
        /(?:Apply|Invoke|Load|Run)\s+(?:the\s+)?`kai-core-asset-producing`[^.]*\.\s*/gi,
        '',
      ),
  }).some(message => message.includes('declared durable-output producer')),
  'removing both engineering production routes must fail from the producer declaration',
);
assert.ok(
  packPlan.publicationRoutingErrors({
    ...mutatedProducer,
    body: mutatedProducer.body.replace(
      'durable-output-producer: true',
      'durable-output-producer: false',
    ),
  }).some(message => message.includes('declared non-producer')),
  'falsifying an engineering producer declaration must fail while routes remain',
);
for (const skill of [
  'coding-standards', 'research-before-coding', 'onboard-to-codebase', 'pr-sizing', 'build-diagrams',
  'pr-delivery',
]) {
  assert.ok(refs.some(ref => ref.target === skill && ref.firing.includes('loaded')),
    `${skill}: an explicit engineering caller must exist`);
}
// Pre-sales solution judgment moved to `kai-revenue`, which is now incubated —
// so no pack emits it. What must stay true is that engineering did not quietly
// reabsorb it while the owning package was parked.
assert.ok(!files.has('kai-engineering/agents/principal-solutions-architect.agent.md'),
  'engineering must not reabsorb pre-sales solution judgment from the incubated revenue package');
assert.ok(![...files.keys()].some(key => key.endsWith('principal-solutions-architect.agent.md')),
  'and no pack emits it at all while kai-revenue is incubated');
console.log(
  `engineering standalone discovery, loader, model, route and emission assertions passed `
  + `(agents=${agents.length}, durable producers=${durableProducers})`,
);
