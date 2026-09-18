// Task 2 — coordination authority and routing source-contract assertions.
//
// This checks the *documents* kai's team reads, not a runtime validator: Task 2
// unifies source authority/routing/template contracts only, and defers SQLite
// enforcement to a later task. Every assertion reads the exact shipped source
// text with readFileSync, following the pattern in
// `test/creative-core-contract-self-test.mjs` — never testing prose we did not
// actually read. The one exception is the review-gate fixture section below,
// which exercises the real, already-shipped `analyze()` export from
// `scripts/work-status.mjs` (its rule 6, "required review(s) unmet") instead
// of a test-only reimplementation — a reviewer found the previous version of
// this file invented its own `unmetReviews(requirements, installedRoles)`
// helper that proved only itself, and its `installedRoles` fixture happened
// to accept a design item whose completion authority was the producing
// `creative-lead-design` role itself. This version never treats the
// producing role as its own acceptor and never simulates runtime behavior
// that does not exist yet.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { analyze } from '../scripts/work-status.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const corePath = (...parts) => join(root, 'plugins', 'kai-core', ...parts);
const readRaw = (path) => readFileSync(path, 'utf8');

const paths = {
  director: corePath('agents', 'director-chief-of-staff.agent.md'),
  initiativeInit: corePath('agents', 'workflow-initiative-init.agent.md'),
  stewardship: corePath('skills', 'kai-core-initiative-stewardship', 'SKILL.md'),
  workItem: corePath('skills', 'kai-core-work-item', 'SKILL.md'),
  workActing: corePath('skills', 'kai-core-work-acting', 'SKILL.md'),
  workGranting: corePath('skills', 'kai-core-work-granting', 'SKILL.md'),
  scopeDiscipline: corePath('skills', 'kai-core-scope-discipline', 'SKILL.md'),
  designGrounding: corePath('skills', 'kai-core-design-grounding', 'SKILL.md'),
  assetClosing: corePath('skills', 'kai-core-asset-closing', 'SKILL.md'),
  definitionOfDone: corePath('skills', 'kai-core-definition-of-done', 'SKILL.md'),
  peerCommunication: corePath('skills', 'kai-core-peer-communication', 'SKILL.md'),
  design: join(root, 'plugins', 'kai-creative', 'agents', 'creative-lead-design.agent.md'),
};

const source = Object.fromEntries(
  Object.entries(paths).map(([key, path]) => [key, readRaw(path)]),
);

// --- Explicit scope/completion authority, no compulsory product-agent proxy ---

// Brief's own worked examples (kept literal so the interface stays exact):
assert.match(source.workItem, /scope_authority/);
assert.match(source.stewardship, /operator/);
assert.doesNotMatch(source.stewardship,
  /principal-product-manager acts as the standing steward/);
assert.match(source.design, /completion.authority|acceptance authority/i);

// The item record declares both authorities as concrete role or `operator`.
assert.match(source.workItem, /scope_authority.{0,300}completion_authority/s);
assert.match(source.workItem,
  /each name a concrete\s+current role or `operator`/);
assert.match(source.workItem,
  /neither is a standing proxy for a human owner/i);

// Required reviews retain `{role, kind}`; missing roles never become implicit
// waivers — a Gap still bounces the item, it is never silently relabeled Clear.
assert.match(source.workItem, /review_requirements[\s\S]{0,200}role:[\s\S]{0,80}kind:/);
assert.match(source.definitionOfDone, /any gap bounces the item/i);
assert.match(source.definitionOfDone, /no\s+dimension is skipped silently/i);

// Stewardship names an explicit owner with no compulsory default and no
// standing human-owner proxy.
assert.match(source.stewardship, /no compulsory default/i);
assert.match(source.stewardship, /no standing product-agent proxy/i);
assert.doesNotMatch(source.stewardship, /\*\*Default:\*\* `principal-product-manager`/);

// The DESIGN review-acceptance gate now names the item's declared authority,
// not a hard-coded product role.
assert.match(source.workActing,
  /declared\s+`completion_authority`[\s\S]{0,200}product-design-acceptance/);
assert.doesNotMatch(source.workActing,
  /`principal-product-manager` with kind `product-design-acceptance`/);

// The ready-state example declares both authorities as a named value, never
// leaves them both `null` on an item shown at `state: ready` — the field
// text says "declared before `ready`," so the worked example must not
// contradict its own rule.
{
  const readyExample = source.workItem.match(
    /scope_authority:\s*(\S+)\s*\ncompletion_authority:\s*(\S+)/);
  assert.ok(readyExample, 'work-item ready example declares scope_authority/completion_authority');
  assert.notEqual(readyExample[1], 'null',
    'ready example scope_authority must be a named authority, not null, on a state: ready item');
  assert.notEqual(readyExample[2], 'null',
    'ready example completion_authority must be a named authority, not null, on a state: ready item');
}

// A DESIGN item's completion authority can never be the producing designer
// itself: the designer that authored the artifact does not also accept it.
assert.match(source.workActing,
  /must never be `creative-lead-design` itself[\s\S]{0,200}cannot\s+accept its own design/,
  'work-acting: the producing designer cannot self-accept its own design');
assert.match(source.design,
  /never `creative-lead-design` itself[\s\S]{0,160}do not accept your own design/,
  'creative-lead-design: must not permit accepting its own design');

// --- Retired-role routing table: replace by responsibility, never a near-neighbour ---

const retiredIdentities = [
  'principal-swe-frontend', 'principal-swe-backend', 'principal-swe-applied-ai',
  'principal-swe-data', 'principal-swe-architect', 'principal-swe-manager',
  'principal-swe-*', 'principal-infra', 'principal-architect', 'principal-qa-ui',
  'principal-security', 'principal-sre', 'principal-privacy-compliance',
  'principal-product-manager',
];
const scopedForRetiredCheck = [
  'director', 'initiativeInit', 'stewardship', 'workItem', 'workActing',
  'workGranting', 'scopeDiscipline', 'designGrounding', 'assetClosing',
  'definitionOfDone', 'design',
];
for (const key of scopedForRetiredCheck) {
  for (const retired of retiredIdentities) {
    assert.doesNotMatch(source[key], new RegExp(retired.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')),
      `${key}: must not reference retired identity ${retired}`);
  }
}

// --- Supplied scoped evidence accepted by declared scope authority bypasses ---
// --- the compulsory map/PM-brief producer chain; missing facts are gaps.   ---

const directorProductRouting = source.director.match(
  /### Product discovery and design routing([\s\S]*?)### 4\. Reconcile outcomes/);
assert.ok(directorProductRouting, 'director product discovery section is present');

// A brief or inline outcome accepted by the declared scope authority is enough.
// Requiring an operator-approved brief would reject explicitly authorized roles.
assert.match(directorProductRouting[1],
  /sufficient supplied scoped evidence[\s\S]{0,180}(?:brief or inline\s+outcome|inline\s+outcome or brief)[\s\S]{0,180}declared `scope_authority`[\s\S]{0,120}(?:operator or\s+an explicitly\s+authorized role|explicitly\s+authorized role or\s+operator)/i,
  'director discovery: scoped evidence and an outcome accepted by declared scope authority are sufficient');
assert.doesNotMatch(directorProductRouting[1], /operator-approved\s+brief/i,
  'director discovery: must not require operator approval when scope_authority names another authorized role');
assert.match(directorProductRouting[1],
  /current product map or full PM artifact[\s\S]{0,140}neither is (?:mandatory|required)/i,
  'director discovery: neither a current map nor a full PM artifact is required');
assert.match(directorProductRouting[1],
  /Do not create or route a PM `BRIEF` knowledge item as a prerequisite[\s\S]{0,240}(?:accepted scope input|scope-authority-accepted input)/i,
  'director discovery: a PM-produced brief is not a prerequisite');
assert.match(directorProductRouting[1],
  /create\/route a\s+`creative-lead-design` item from[\s\S]{0,220}(?:accepted scope input|scope-authority-accepted input)[\s\S]{0,260}neither artifact is a mandatory dependency/i,
  'director design routing: design consumes accepted scoped inputs, not mandatory producer artifacts');
// The product-exploration producer was incubated, so there is no role to
// dispatch. What must stay true is that the gap is recorded and addressed to a
// real endpoint rather than routed to a name that no longer resolves, and that
// a missing producer never becomes a reason to install an incubated package.
assert.match(source.director,
  /requires new product discovery is recorded as a bounded\s+evidence gap addressed to the operator[\s\S]{0,200}never a reason to install an\s+incubated package or to invent a role name[\s\S]{0,140}never\s+substitutes for missing scope or completion approval/i,
  'director discovery: a discovery gap is recorded for the operator, not dispatched to a role that does not exist');

assert.match(source.director,
  /for missing\/stale product-surface facts, request only the specific\s+decision-relevant evidence from the addressed real role, and record an\s+unfilled product-discovery gap for the operator; never require installing an\s+incubated package, and recording a gap never substitutes for missing\s+scope or completion approval/i,
  'director reconciliation: missing facts use specific questions, then a recorded gap');
assert.doesNotMatch(source.director, /`workflow-product-explore`/,
  'director must not name the incubated product explorer at all');

const initiativeKnowledgeRouting = source.initiativeInit.match(
  /Exception for directly requested bounded knowledge work:([\s\S]*?)Set canonical artifact targets automatically:/);
assert.ok(initiativeKnowledgeRouting, 'initiative-init bounded knowledge section is present');

assert.match(initiativeKnowledgeRouting[1],
  /sufficient supplied scoped evidence[\s\S]{0,180}(?:brief or inline\s+outcome|inline\s+outcome or brief)[\s\S]{0,180}declared `scope_authority`[\s\S]{0,120}(?:operator or\s+an explicitly\s+authorized role|explicitly\s+authorized role or\s+operator)/i,
  'initiative-init: supplied scoped evidence and a scope-authority-accepted outcome are sufficient');
assert.match(initiativeKnowledgeRouting[1],
  /neither (?:a )?(?:current |full )?product map nor (?:a )?(?:full )?PM(?:-produced)? (?:brief|artifact|document)\s+is required/i,
  'initiative-init: neither a product map nor a PM-produced document is required');
assert.match(initiativeKnowledgeRouting[1],
  /missing decision-relevant fact[\s\S]{0,160}bounded (?:evidence )?gap/i,
  'initiative-init: a missing decision-relevant fact becomes a bounded gap');
assert.match(initiativeKnowledgeRouting[1],
  /product-discovery gap is recorded as a bounded\s+evidence gap for the operator to supply; no installed kai role produces a\s+product map/i,
  'initiative-init: a discovery gap is recorded for the operator, not seeded against a role that does not exist');
assert.doesNotMatch(source.initiativeInit, /`workflow-product-explore`/,
  'initiative-init must not name the incubated product explorer at all');
assert.match(initiativeKnowledgeRouting[1],
  /Do not seed a PM `BRIEF` knowledge item as a prerequisite/i,
  'initiative-init: must not seed a PM-produced brief prerequisite');
assert.doesNotMatch(initiativeKnowledgeRouting[1],
  /only a genuinely\s+missing map or brief seeds its own item/i,
  'initiative-init: absent completed artifacts must not trigger an unconditional producer chain');
assert.doesNotMatch(initiativeKnowledgeRouting[1], /as an existing completed artifact/i,
  'initiative-init: supplied scoped evidence need not be a completed artifact');
// The steward-handoff role boundary no longer offers a bare "explicit
// waiver" escape hatch around design acceptance.
assert.doesNotMatch(source.initiativeInit, /or explicit waiver/,
  'initiative-init: no bare "explicit waiver" bypass around design acceptance');
assert.match(source.initiativeInit,
  /completion_authority`?\s*accepts the exact revision[\s\S]{0,60}never the producing\s+designer/,
  'initiative-init: the role-boundary rule names the declared completion authority, never the producing designer, as acceptor');

// The current destinations from the routing table are the ones actually named.
assert.match(source.workItem, /eng-builder-software/);
assert.match(source.workItem, /eng-reviewer-code/);
assert.match(source.workItem, /eng-reviewer-quality/);
assert.match(source.designGrounding, /eng-builder-software/);
assert.match(source.scopeDiscipline,
  /eng-builder-software.{0,40}eng-builder-platform.{0,40}eng-lead-architecture/s);
assert.match(source.definitionOfDone, /eng-reviewer-security/);
assert.match(source.definitionOfDone, /eng-reviewer-reliability/);
assert.match(source.definitionOfDone, /eng-reviewer-privacy-compliance/);
assert.match(source.workGranting, /eng-reviewer-security/);
assert.match(source.workGranting, /eng-reviewer-reliability/);

// Manager decomposition is a supplied input or engineering `pr-sizing`, never
// a compulsory extra coordinator.
assert.match(source.stewardship, /pr-sizing/);
assert.match(source.stewardship, /never a\s+compulsory\s+(extra\s+)?coordinator/);

// --- Canonical QUESTION/ANSWER template unified across peer-communication and work-acting ---

const questionHeader = /QUESTION Q-<item-id>-<NN> <ts> — <from-role> -> @<to-role>/;
const answerHeader = /ANSWER Q-<item-id>-<NN> <ts> — <from-role> -> @<asker>/;
for (const key of ['workActing', 'peerCommunication']) {
  assert.match(source[key], questionHeader, `${key}: unified QUESTION header`);
  assert.match(source[key], answerHeader, `${key}: unified ANSWER header`);
  assert.match(source[key], /status:\s*answered/, `${key}: explicit status: answered on new ANSWERs`);
}
// Legacy parsing (a status-less ANSWER) is explicitly preserved, not silently
// dropped, in both places that now share the one packet shape.
assert.match(source.workActing, /legacy/i);
assert.match(source.peerCommunication, /legacy/i);
// The old, un-unified peer-communication-only `re:` field is gone from the
// canonical packet.
assert.doesNotMatch(source.peerCommunication, /^-\s*re:\s*<the question/m);

// --- Review-gate fixtures: core+engineering, core+creative, both, and a ---
// --- missing required reviewer, exercised through the real shipped     ---
// --- `analyze()` unmet-review rule (scripts/work-status.mjs rule 6)     ---

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
    lease: { holder: 'null', token: 'null', version_at_grant: 'null', acquired: 'null', expires: 'null' },
    dependsOn: [],
    questionIds: [],
    required: [],
    completed: [],
    ...overrides,
  };
}

const unmetFinding = (findings, id) => findings.find(
  (f) => f.item === id && f.section === 'integrity' && /required review\(s\) unmet/.test(f.headline));

const codeReview = { role: 'eng-reviewer-code', kind: 'independent-code' };
const qualityReview = { role: 'eng-reviewer-quality', kind: 'ui-system' };
const securityReview = { role: 'eng-reviewer-security', kind: 'independent-security' };
// The design item's completion authority is `operator` here, not the
// producing `creative-lead-design` role — the fixture only exercises a
// completion authority that a designer is actually permitted to name.
const designReview = { role: 'operator', kind: 'product-design-acceptance' };
const done = (r, changeRef) => ({ role: r.role, kind: r.kind, change_ref: changeRef });

// core+engineering: an engineering-only item's reviews are fully satisfiable.
{
  const item = fixtureItem({
    id: 'core-engineering',
    required: [codeReview, qualityReview],
    completed: [done(codeReview, 'abc1234'), done(qualityReview, 'abc1234')],
  });
  const findings = analyze([item], new Map(), Date.now());
  assert.equal(unmetFinding(findings, 'core-engineering'), undefined,
    'core+engineering: fully reviewed item reports no unmet review');
}

// core+creative: a design item's acceptance review is satisfiable by its
// declared (non-producing) completion authority alone.
{
  const item = fixtureItem({
    id: 'core-creative',
    required: [designReview],
    completed: [done(designReview, 'def5678')],
    changeRef: 'def5678',
  });
  const findings = analyze([item], new Map(), Date.now());
  assert.equal(unmetFinding(findings, 'core-creative'), undefined,
    'core+creative: design acceptance by its declared authority reports no unmet review');
}

// both installed: a cross-domain item satisfies every entry.
{
  const item = fixtureItem({
    id: 'core-both',
    required: [codeReview, designReview],
    completed: [done(codeReview, 'aaa0000'), done(designReview, 'aaa0000')],
    changeRef: 'aaa0000',
  });
  const findings = analyze([item], new Map(), Date.now());
  assert.equal(unmetFinding(findings, 'core-both'), undefined,
    'both domains installed: every required review satisfied reports no unmet review');
}

// missing required reviewer: an unmet role stays reported, never silently
// waived or dropped from the list — this is the real "unmet" path, not a
// test-only stand-in for it.
{
  const item = fixtureItem({
    id: 'core-missing-reviewer',
    required: [codeReview, securityReview],
    completed: [],
  });
  const findings = analyze([item], new Map(), Date.now());
  const finding = unmetFinding(findings, 'core-missing-reviewer');
  assert.ok(finding, 'a missing required reviewer produces a real unmet-review finding');
  assert.match(finding.headline, /2 required review\(s\) unmet/);
  assert.match(finding.why, /eng-reviewer-code \(independent-code\)/);
  assert.match(finding.why, /eng-reviewer-security \(independent-security\)/);
}

console.log('coordination authority self-test: all checks passed');
