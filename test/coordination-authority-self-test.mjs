// Schema-5 coordination authority source contract plus the retained
// work-status review-gap compatibility fixture.

import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {dirname, join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {analyze} from '../src/core/work-status.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const core = (...parts) => join(root, 'plugins', 'kai-core', ...parts);
const read = path => readFileSync(path, 'utf8');

const source = {
  director: read(core('agents', 'director-chief-of-staff.agent.md')),
  epicInit: read(core('agents', 'workflow-epic-init.agent.md')),
  hierarchy: read(core('skills', 'kai-core-work-hierarchy', 'SKILL.md')),
  stewardship: read(core('skills', 'kai-core-work-stewardship', 'SKILL.md')),
  task: read(core('skills', 'kai-core-work-task', 'SKILL.md')),
  workActing: read(core('skills', 'kai-core-work-acting', 'SKILL.md')),
  workGranting: read(core('skills', 'kai-core-work-granting', 'SKILL.md')),
  definitionOfDone: read(core('skills', 'kai-core-definition-of-done', 'SKILL.md')),
  peerCommunication: read(core('skills', 'kai-core-peer-communication', 'SKILL.md')),
  design: read(join(root, 'plugins', 'kai-creative', 'agents', 'creative-lead-design.agent.md')),
  runtimeContract: read(join(root, 'src', 'core', 'lib', 'coordination-runtime', 'contract.mjs')),
  runtimeEngine: read(join(root, 'src', 'core', 'lib', 'coordination-runtime', 'engine.mjs')),
};

// Live command maps have no schema-4 planning aliases.
{
  const validators = source.runtimeContract.match(
    /const commandValidators = new Map\(\[([\s\S]*?)\n\]\);/,
  );
  const handlers = source.runtimeEngine.match(
    /const handlers = new Map\(\[([\s\S]*?)\n\]\);/,
  );
  assert.ok(validators, 'runtime command validator map remains explicit');
  assert.ok(handlers, 'runtime command dispatcher map remains explicit');
  for (const [label, body] of [
    ['validator', validators[1]],
    ['dispatcher', handlers[1]],
  ]) {
    assert.doesNotMatch(body, /\['(?:initiative|item)\./,
      `live ${label} has no schema-4 planning command key`);
  }
}

for (const [id, body] of Object.entries({
  hierarchy: source.hierarchy,
  stewardship: source.stewardship,
  task: source.task,
  workActing: source.workActing,
  workGranting: source.workGranting,
  director: source.director,
})) {
  assert.match(body, /\.kai\/core\/runtime\/coordination\.sqlite/,
    `${id}: names the schema-5 store`);
  assert.match(body, /only\s+coordination\s+authority/i,
    `${id}: SQLite is the only coordination authority`);
}

assert.match(source.hierarchy, /scope_authority[\s\S]{0,300}completion_authority/);
assert.match(source.hierarchy, /owner keeps the record current|owner/i);
assert.match(source.stewardship,
  /suggestion[\s\S]{0,160}conversational[\s\S]{0,160}named authority/i);
assert.match(source.epicInit, /creates no record before\s+named authority approval/i);
assert.match(source.epicInit, /starts from the current Direction/i);
assert.match(source.director, /grants Tasks only[\s\S]{0,80}`task\.grant`/i);
assert.match(source.director,
  /cannot invent[\s\S]{0,200}Epic[\s\S]{0,80}Feature[\s\S]{0,80}Requirement[\s\S]{0,160}scope[\s\S]{0,80}priority[\s\S]{0,80}authorit[\s\S]{0,80}acceptance/i);

assert.match(source.task, /review\s+requirements/);
assert.match(source.workActing,
  /product-design acceptance[\s\S]{0,120}declared[\s\S]{0,80}`completion_authority`/i);
assert.match(source.workActing,
  /must never be `creative-lead-design` itself[\s\S]{0,200}cannot accept its own design/i);
assert.match(source.design,
  /never `creative-lead-design` itself[\s\S]{0,160}do not accept your own design/i);

for (const role of [
  'eng-reviewer-code',
  'eng-reviewer-quality',
  'eng-reviewer-security',
  'eng-reviewer-reliability',
  'eng-reviewer-privacy-compliance',
]) {
  assert.match(source.definitionOfDone, new RegExp(role));
}

assert.match(source.peerCommunication,
  /QUESTION Q-<task-id>-<NN> <ts> — <from-role> -> @<to-role>/);
assert.match(source.peerCommunication,
  /ANSWER Q-<task-id>-<NN> <ts> — <from-role> -> @<asker>/);
assert.match(source.peerCommunication, /status:\s*answered/);

for (const [id, body] of Object.entries(source)
  .filter(([id]) => !id.startsWith('runtime'))) {
  for (const retired of [
    'principal-product-manager',
    'principal-swe-frontend',
    'principal-swe-backend',
    'principal-swe-manager',
  ]) {
    assert.ok(!body.includes(retired), `${id}: must not name retired role ${retired}`);
  }
}

function fixtureItem(overrides) {
  return {
    id: 'fixture-item',
    unparseable: false,
    state: 'completed',
    owner: null,
    nextRole: null,
    changeRef: 'abc1234',
    version: 1,
    updated: '2026-01-01-0000',
    deliveryClass: 'product-change',
    lease: {holder: 'null', token: 'null', version_at_grant: 'null', acquired: 'null', expires: 'null'},
    dependsOn: [],
    questionIds: [],
    required: [],
    completed: [],
    ...overrides,
  };
}

const unmetFinding = (findings, id) => findings.find(
  finding => finding.item === id
    && finding.section === 'integrity'
    && /required review\(s\) unmet/.test(finding.headline),
);

const codeReview = {role: 'eng-reviewer-code', kind: 'independent-code'};
const qualityReview = {role: 'eng-reviewer-quality', kind: 'ui-system'};
const securityReview = {role: 'eng-reviewer-security', kind: 'independent-security'};
const designReview = {role: 'operator', kind: 'product-design-acceptance'};
const done = (review, changeRef) => ({
  role: review.role,
  kind: review.kind,
  change_ref: changeRef,
});

for (const fixture of [
  fixtureItem({
    id: 'core-engineering',
    required: [codeReview, qualityReview],
    completed: [done(codeReview, 'abc1234'), done(qualityReview, 'abc1234')],
  }),
  fixtureItem({
    id: 'core-creative',
    required: [designReview],
    completed: [done(designReview, 'def5678')],
    changeRef: 'def5678',
  }),
  fixtureItem({
    id: 'core-both',
    required: [codeReview, designReview],
    completed: [done(codeReview, 'aaa0000'), done(designReview, 'aaa0000')],
    changeRef: 'aaa0000',
  }),
]) {
  const findings = analyze([fixture], new Map(), Date.now());
  assert.equal(unmetFinding(findings, fixture.id), undefined,
    `${fixture.id}: current reviews satisfy the compatibility view`);
}

{
  const fixture = fixtureItem({
    id: 'core-missing-reviewer',
    required: [codeReview, securityReview],
    completed: [],
  });
  const finding = unmetFinding(analyze([fixture], new Map(), Date.now()), fixture.id);
  assert.ok(finding, 'a missing required reviewer remains an unmet-review finding');
  assert.match(finding.headline, /2 required review\(s\) unmet/);
  assert.match(finding.why, /eng-reviewer-code \(independent-code\)/);
  assert.match(finding.why, /eng-reviewer-security \(independent-security\)/);
}

console.log('coordination authority self-test: schema-5 authority checks passed');
