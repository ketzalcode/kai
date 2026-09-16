import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  sourceAgentFiles, sourceSkillFiles, materializePacks, collectReferences,
  agentRoutingErrors, agentProfileModelErrors, agentTaxonomyErrors, normalizeLF,
} from '../scripts/lib/pack-plan.mjs';
import {
  parseFrontmatter, parseToolList, stripQuotes, loaderErrors,
} from '../scripts/lib/loader-contract.mjs';

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
    id: entry.id, body, tools, knownSkills: availableSkills,
    knownAgents: new Set(agents.map(agent => agent.id)),
  }), [], `${entry.id}: core routes and bounded fallback`);
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
    for (const skill of ['coding-style', 'research-before-coding', 'pr-sizing']) {
      assert.ok(refs.some(ref => ref.from === entry.rel && ref.target === skill &&
        ref.firing.includes('loaded')), `${entry.id}: missing ${skill} route`);
    }
  }
}
for (const skill of [
  'coding-style', 'research-before-coding', 'onboard-to-codebase', 'pr-sizing', 'build-diagrams',
]) {
  assert.ok(refs.some(ref => ref.target === skill && ref.firing.includes('loaded')),
    `${skill}: an explicit engineering caller must exist`);
}
assert.ok(files.has('kai-revenue/agents/principal-solutions-architect.agent.md'),
  'pre-sales solution judgment must retain one provider in revenue');
assert.ok(!files.has('kai-engineering/agents/principal-solutions-architect.agent.md'));
console.log('engineering standalone discovery, loader, model, route and emission assertions passed');
