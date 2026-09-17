// Task 10B — source-contract assertions for the coordination runtime routes.
//
// Task 10A built the executable interface (`scripts/coordinate.mjs` plus the
// runtime library beside it). This file checks that the *shipped declarative
// sources* — the agents and skills a host actually loads — route to that
// interface instead of telling a role to hand-edit `.kai/state/items/<id>.md`
// or a thread file for coordinated work.
//
// Every assertion reads exact shipped source text with readFileSync, following
// `test/coordination-authority-self-test.mjs` and the creative/engineering
// contract tests. Nothing here executes the runtime: this is a documentation
// contract, and it deliberately makes no claim that a coordinated multi-role
// workflow has been measured end to end. The one measured native probe used a
// synthetic human-approval fixture, and peer model/effect observation returns
// UNSUPPORTED_HOST by design — so the sources must not promise otherwise, and
// the honesty block at the bottom asserts exactly that.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const packPath = (pack, ...parts) => join(root, 'plugins', pack, ...parts);
const coreSkill = (id) => packPath('kai-core', 'skills', id, 'SKILL.md');
const coreAgent = (id) => packPath('kai-core', 'agents', `${id}.agent.md`);
const read = (path) => readFileSync(path, 'utf8');

const skillPaths = {
  contract: coreSkill('kai-core-contract-v1'),
  workItem: coreSkill('kai-core-work-item'),
  workActing: coreSkill('kai-core-work-acting'),
  workGranting: coreSkill('kai-core-work-granting'),
  peerCommunication: coreSkill('kai-core-peer-communication'),
  workspacePaths: coreSkill('kai-core-workspace-paths'),
  workspaceInitiative: coreSkill('kai-core-workspace-initiative'),
  workspaceOnboarding: coreSkill('kai-core-workspace-onboarding'),
  initiativeStewardship: coreSkill('kai-core-initiative-stewardship'),
  scopeDiscipline: coreSkill('kai-core-scope-discipline'),
  assetProducing: coreSkill('kai-core-asset-producing'),
  assetClosing: coreSkill('kai-core-asset-closing'),
  definitionOfDone: coreSkill('kai-core-definition-of-done'),
  workActivity: coreSkill('kai-core-work-activity'),
  fleetObservation: coreSkill('kai-core-fleet-observation'),
};

const agentPaths = {
  director: coreAgent('director-chief-of-staff'),
  initiativeInit: coreAgent('workflow-initiative-init'),
  workspaceInit: coreAgent('workflow-workspace-init'),
  proactiveScan: coreAgent('workflow-proactive-scan'),
  selfCheck: coreAgent('workflow-self-check'),
  weeklyPulse: coreAgent('workflow-weekly-pulse'),
};

const docPaths = {
  workspaces: join(root, 'docs', 'workspaces.md'),
  hostCapabilities: join(root, 'docs', 'host-capabilities.md'),
  engineeringPackage: join(root, 'docs', 'reference', 'packages', 'kai-engineering.md'),
  creativePackage: join(root, 'docs', 'reference', 'packages', 'kai-creative.md'),
};

const source = Object.fromEntries(
  Object.entries({ ...skillPaths, ...agentPaths, ...docPaths })
    .map(([key, path]) => [key, read(path)]),
);

const domainAgents = ['kai-engineering', 'kai-creative'].flatMap((pack) => {
  const dir = packPath(pack, 'agents');
  return readdirSync(dir).filter((name) => name.endsWith('.agent.md')).sort()
    .map((name) => ({
      pack,
      id: name.slice(0, -'.agent.md'.length),
      body: read(join(dir, name)),
    }));
});

assert.equal(domainAgents.filter((a) => a.pack === 'kai-engineering').length, 13,
  'thirteen engineering agents are in scope');
assert.equal(domainAgents.filter((a) => a.pack === 'kai-creative').length, 3,
  'three creative agents are in scope');

// ---------------------------------------------------------------------------
// 1. The runtime command route exists where manual coordinated writes used to
//    live. `scripts/coordinate.mjs` and its real verbs are the interface; the
//    command envelope Task 10A actually validates is documented with it.
// ---------------------------------------------------------------------------

const RUNTIME_SCRIPT = /scripts\/coordinate\.mjs/;

for (const key of ['workGranting', 'workActing']) {
  assert.match(source[key], RUNTIME_SCRIPT,
    `${key}: names the actual runtime entry point`);
}

// The granting half owns the canonical route table, so it must name every verb
// a grantor actually uses, exactly as the CLI spells them.
for (const verb of ['inspect', 'apply', 'prepare', 'delegate', 'claim', 'plan',
  'request', 'authorize', 'capture', 'receipt', 'status', 'context']) {
  assert.match(source.workGranting, new RegExp(`\`${verb}\``),
    `work-granting: names the real \`${verb}\` verb`);
}

// The exact invocation shape, not a paraphrase.
assert.match(source.workGranting,
  /node "<kai-plugin>\/scripts\/coordinate\.mjs" <verb> --root "<workspace-root>"/,
  'work-granting: shows the exact command form');

// The command envelope `apply` validates.
for (const field of ['operationId', 'recordKind', 'recordId', 'expectedVersion',
  'leaseToken']) {
  assert.match(source.workActing, new RegExp(`\\b${field}\\b`),
    `work-acting: documents the real \`${field}\` command field`);
}
assert.match(source.workActing, /COPILOT_AGENT_SESSION_ID/,
  'work-acting: binds the actor runId to the host-supplied context identity');

// The real command kinds replace the prose-only write instructions.
for (const kind of ['item.grant', 'item.update', 'item.transition',
  'item.handoff', 'question.open', 'question.answer']) {
  assert.match(source.workActing, new RegExp(kind.replace('.', '\\.')),
    `work-acting: routes ${kind} through the runtime`);
}
assert.match(source.workGranting, /item\.grant/, 'work-granting: grants via item.grant');
assert.match(source.workGranting, /attempt\.recover/,
  'work-granting: recovers through the real attempt.recover command');
assert.match(source.definitionOfDone, /review\.record/,
  'definition-of-done: review completion is a runtime review.record');
assert.match(source.assetProducing, /artifact\.register/,
  'asset-producing: registers artifacts through the runtime');
assert.match(source.assetClosing, /asset\.transition/,
  'asset-closing: disposition changes go through asset.transition');
assert.match(source.initiativeStewardship, /item\.promote/,
  'initiative-stewardship: promotion is a runtime command');

// The runtime refuses a lost lease or a stale version with typed codes; the
// contract must name them rather than describing a hand-written note only.
for (const code of ['VERSION_CONFLICT', 'LEASE_CONFLICT']) {
  assert.match(source.workActing, new RegExp(code),
    `work-acting: names the real ${code} refusal`);
}
assert.match(source.workGranting, /AUTHORITY_REQUIRED/,
  'work-granting: names the real authority refusal code');

// No shipped core source may still instruct a hand-edit of coordinated state.
//
// This is a corpus scan, not a list of phrases that happened to exist before
// this task's edits: it walks every line of every shipped source in scope,
// finds the ones that name a coordination Markdown path, and fails any line
// that pairs that path with a write verb without a prohibition on the same
// *clause* (not merely the same line). A *new* manual-write instruction added
// tomorrow trips it.
//
// Scoping the prohibition check to the clause, not the whole line, matters:
// a line like "If the runtime is not available, write `.kai/state/items/<id>.md`
// by hand." contains the word "not" — but it modifies "available", an
// unrelated earlier clause, and does not prohibit the write instruction that
// follows the comma. A line-wide prohibition check is fooled by that; a
// clause-wide one is not.
const COORDINATION_PATH =
  /\.kai\/state\/(?:items|threads)\b|(?:^|[^-\w`])BOARD\.md|`BOARD\.md`/;
const WRITE_VERB =
  /\b(?:writ(?:e|es|ing)|append(?:s|ed|ing)?|edit(?:s|ed|ing)?|hand-edit(?:s|ed|ing)?|hand-writ(?:e|es|ing|ten)|author(?:s|ed|ing)?|updat(?:e|es|ing)|creat(?:e|es|ing)|claim(?:s|ed|ing)?|fill(?:s|ed|ing)?\s+in|set(?:s|ting)?)\b/i;
const PROHIBITION =
  /\b(?:never|not|no|non-|cannot|can't|don't|doesn't|does not|must not|nothing|instead of|rather than|without|refus\w*|stop|avoid|other than|did not|prohibit\w*|forbid\w*|only by|only through|only with)\b/i;
const CLAUSE_SPLIT = /(?<=[,;])\s+/;

function findManualWriteLines(body) {
  const hits = [];
  for (const [index, line] of body.split(/\r?\n/).entries()) {
    if (!COORDINATION_PATH.test(line)) continue;
    for (const clause of line.split(CLAUSE_SPLIT)) {
      if (!COORDINATION_PATH.test(clause)) continue;
      if (!WRITE_VERB.test(clause)) continue;
      if (PROHIBITION.test(clause)) continue;
      hits.push(`${index + 1}: ${line.trim()}`);
      break;
    }
  }
  return hits;
}

// Regression fixture: a prohibition word sitting in an unrelated earlier
// clause of the same line must not shield a real hand-write instruction that
// follows it. This is exactly the shape the line-wide check missed.
assert.deepEqual(
  findManualWriteLines(
    'If the runtime is not available, write `.kai/state/items/<id>.md` by hand.',
  ),
  ['1: If the runtime is not available, write `.kai/state/items/<id>.md` by hand.'],
  'manual-write scan: an unrelated same-line prohibition must not shield a real hand-write instruction',
);
// And the clause-level check must still let a genuine same-clause prohibition
// through — it is the honest form, not a false positive.
assert.deepEqual(
  findManualWriteLines('Never hand-edit `.kai/state/items/<id>.md`.'),
  [],
  'manual-write scan: a real same-clause prohibition must not be flagged',
);

const manualWriteLines = [];
for (const [key, body] of Object.entries(source)) {
  for (const hit of findManualWriteLines(body)) {
    manualWriteLines.push(`${key}:${hit}`);
  }
}
assert.deepEqual(manualWriteLines, [],
  'no shipped source may instruct a manual coordinated file write');

// Directors and acting roles are told the file is not the write surface.
assert.match(source.director, RUNTIME_SCRIPT,
  'director: dispatches through the runtime, not a hand-written lease block');
// The real route, not the bare word "apply" — which matches unrelated prose
// such as "apply `kai-core-definition-of-done`".
assert.match(source.director, /coordinate\.mjs" apply\s+--root "<workspace-root>"/,
  'director: names the real apply command route');

// ---------------------------------------------------------------------------
// 2. `kai-core-contract-v1`'s two-line discovery response is unchanged, and
//    discovery is explicitly not permission to operate a schema-4 workspace.
// ---------------------------------------------------------------------------

assert.match(source.contract,
  /Report exactly these two lines to the calling agent, then stop:\n\n```text\nKAI_CORE_READY\ncontract: 1\n```\n/,
  'contract-v1: the exact two-line response block is unchanged');
assert.match(source.contract,
  /Nothing else\. No preamble, no summary, no tool call, and no restatement of any/,
  'contract-v1: the "nothing else" rule is unchanged');
assert.match(source.contract, /never reports a value other than `1`/,
  'contract-v1: still reports contract 1 only');
assert.doesNotMatch(source.contract, RUNTIME_SCRIPT,
  'contract-v1: the discovery probe must not gain a runtime command');
assert.match(source.contract,
  /(?:not|never)[\s\S]{0,120}permission to (?:operate|read or write)[\s\S]{0,120}schema[- ]4/i,
  'contract-v1: a successful probe is not permission to operate a schema-4 workspace');
assert.match(source.contract, /separate (?:runtime\/schema |schema )?preflight/i,
  'contract-v1: points at the separate runtime/schema preflight step');

// The preflight itself is a real command, owned by the granting contract.
assert.match(source.workGranting,
  /coordinate\.mjs" inspect --root/,
  'work-granting: the preflight is the real inspect command');

// ---------------------------------------------------------------------------
// 3. Direct single-shot use still needs no database, initiative or report tree.
// ---------------------------------------------------------------------------

const directPhrase =
  /no\s+(?:coordination\s+)?database,\s+no\s+initiative\s+and\s+no\s+report\s+tree|neither\s+a\s+coordination\s+database,\s+an\s+initiative,\s+nor\s+a\s+report\s+tree/i;

assert.match(source.workGranting, /`direct`/,
  'work-granting: names the direct-mode verb');
assert.match(source.workGranting, /coordinationRequired["']?\s*:\s*false/,
  'work-granting: quotes the real direct-mode result');

for (const key of ['workActing', 'scopeDiscipline', 'definitionOfDone']) {
  assert.match(source[key], directPhrase,
    `${key}: direct single-shot work needs no coordination tree`);
}

for (const agent of domainAgents) {
  assert.match(agent.body, directPhrase,
    `${agent.id}: an ordinary direct request needs no database, initiative or report tree`);
  assert.match(agent.body, RUNTIME_SCRIPT,
    `${agent.id}: coordinated work routes to the runtime command`);
  assert.doesNotMatch(agent.body, /hand-edit/,
    `${agent.id}: must not describe hand-editing coordinated state as normal`);
}

assert.match(source.engineeringPackage, directPhrase,
  'kai-engineering doc: direct use needs no coordination tree');
assert.match(source.creativePackage, directPhrase,
  'kai-creative doc: direct use needs no coordination tree');
assert.match(source.engineeringPackage, RUNTIME_SCRIPT,
  'kai-engineering doc: names the coordinated write route');
assert.match(source.creativePackage, RUNTIME_SCRIPT,
  'kai-creative doc: names the coordinated write route');

// A review verdict counts only when it is a real `review.record` command bound
// to the exact `change_ref` — a prior edit left a broken sentence fragment
// ("The `review.record` command bound to the exact `change_ref`.") that
// dropped this normative rule entirely.
assert.match(source.engineeringPackage,
  /review verdict counts only when it arrived as a `review\.record`\s+command\s+bound to the exact `change_ref`/,
  'kai-engineering doc: the review-verdict rule is a complete, normative sentence');

// ---------------------------------------------------------------------------
// 4. Schema 3 remains readable; coordinated writes refuse; migration is
//    explicit and offline, never an automatic upgrade.
// ---------------------------------------------------------------------------

for (const key of ['workGranting', 'workspaceInitiative', 'workspaceOnboarding']) {
  assert.match(source[key], /SCHEMA_MISMATCH/,
    `${key}: names the real schema refusal code`);
  assert.match(source[key], /schema[- ]?3[\s\S]{0,200}inspect-only/i,
    `${key}: schema 3 stays readable as inspect-only`);
}

assert.match(source.workspaceInitiative, /schema[- ]?4/i,
  'workspace-initiative: documents schema 4 beside the retained schema-3 shape');
assert.match(source.workspaceInitiative, /"schema_version": 3/,
  'workspace-initiative: the schema-3 manifest shape stays readable');
assert.match(source.workspaceOnboarding, /"schema_version": 4/,
  'workspace-onboarding: new workspaces are scaffolded at schema 4');

// `scripts/lib/coordination-runtime/cli.mjs` refuses every schema-3 read other
// than inspect/status/legacy ("schema 3 supports inspect/status/legacy only").
// The sources must name that exact set, not a longer one.
for (const key of ['workGranting', 'workspaceInitiative', 'workspaceOnboarding']) {
  assert.match(source[key], /`inspect`, `status` and `legacy`/,
    `${key}: names the real schema-3 verb set enforced by cli.mjs`);
}
assert.match(source.workspaces,
  /`schema_version: 3`[^|]*\|[^|]*`inspect`, `status`, `legacy` only/,
  'docs/workspaces: the schema-3 read column names the real verb set');

// A vague "readable through every/any read verb" claim would slip past the
// backticked-verb sentence scan below (it never names a forbidden verb, so
// there is nothing for that scan to catch). Ban the vague phrasing outright.
const VAGUE_SCHEMA3_CLAIM = /schema[- ]?3[\s\S]{0,160}\b(?:every|any|all)\b[\s\S]{0,20}read verb/i;
for (const [key, body] of Object.entries(source)) {
  assert.doesNotMatch(body, VAGUE_SCHEMA3_CLAIM,
    `${key}: must name the exact schema-3 verb set, not "every/any read verb"`);
}

// Corpus scan: any sentence that says what a schema-3 workspace still supports
// must not present a verb the runtime refuses there. Sentences that name a verb
// *as refused* are exactly the honest form, so they are excluded.
const SCHEMA3_SUPPORTED = new Set(['inspect', 'status', 'legacy']);
const READ_VERBS = ['inspect', 'status', 'context', 'detail', 'messages', 'export', 'legacy', 'hash'];
for (const [key, body] of Object.entries(source)) {
  const sentences = body.replace(/\r?\n/g, ' ').split(/(?<=[.|])\s+(?=[A-Z`*|-])/);
  for (const sentence of sentences) {
    if (!/schema[- ]?3/i.test(sentence)) continue;
    if (!/(?:stays? readable|still (?:work|read)|inspect-only|supports|answers)/i.test(sentence)) continue;
    if (/refus\w*|not (?:work|available)|never/i.test(sentence)) continue;
    for (const verb of READ_VERBS.filter((v) => !SCHEMA3_SUPPORTED.has(v))) {
      assert.ok(!new RegExp('`' + verb + '`').test(sentence),
        `${key}: schema 3 supports inspect/status/legacy only — \`${verb}\` is refused: ${sentence.trim()}`);
    }
  }
}

// A schema-4 workspace with no store is narrower still: cli.mjs answers
// `inspect` and refuses every other verb with SCHEMA_MISMATCH.
assert.match(source.director,
  /schema-4\s+workspace\s+with\s+no\s+store\s+answers\s+only\s+`inspect`/,
  'director: a storeless schema-4 workspace supports only inspect');
assert.doesNotMatch(source.director, /storeless workspace stays readable/i,
  'director: must not claim a storeless workspace is generally readable');

// `workflow-initiative-init` must carry the same corrected rule as the
// director — it previously said a storeless schema-4 workspace "stays
// readable" outright, conflating it with the narrower `inspect`-only answer.
assert.match(source.initiativeInit,
  /schema-4\s+workspace\s+with\s+no\s+store\s+answers\s+only\s+`inspect`/,
  'initiative-init: a storeless schema-4 workspace supports only inspect');
assert.doesNotMatch(source.initiativeInit,
  /or has no store, it stays readable/i,
  'initiative-init: must not claim a storeless workspace is generally readable');

// The window between scaffolding a schema-4 manifest and running the
// authorized `init` is expected, not a broken workspace.
assert.match(source.workspaceOnboarding,
  /expected[\s\S]{0,200}not a broken workspace/i,
  'workspace-onboarding: the pre-init window is named as expected, not broken');

const noAutomaticUpgrade =
  /(?:never|not|no) (?:an )?automatic(?:ally)?[\s\S]{0,80}(?:upgrade|migrat)/i;
for (const key of ['workspaceOnboarding', 'workspaceInitiative']) {
  assert.match(source[key], noAutomaticUpgrade,
    `${key}: migration is explicit, never an automatic upgrade`);
}
assert.match(source.workspaceOnboarding,
  /coordinate\.mjs" migrate[\s\S]{0,80}--confirm --capability/,
  'workspace-onboarding: the migration route is the real confirmed command');
assert.match(source.workspaceOnboarding,
  /coordinate\.mjs" init[\s\S]{0,80}--confirm --capability/,
  'workspace-onboarding: store creation is the real confirmed command');
assert.match(source.workspaces, /inspect-only/i,
  'docs/workspaces: schema 3 is documented as inspect-only');
assert.match(source.workspaces, /coordination\.sqlite/,
  'docs/workspaces: names the authoritative store');

// No command may quietly create the store.
assert.match(source.workGranting,
  /(?:no command|never)[\s\S]{0,120}(?:creates|initializes)[\s\S]{0,80}(?:database|store|SQLite)/i,
  'work-granting: reads never create the coordination store');

// ---------------------------------------------------------------------------
// 5. No source may claim a Markdown renderer. Nothing in `scripts/` renders
//    `BOARD.md`, `.kai/state/items/*.md` or `.kai/state/threads/*.md` from the
//    schema-4 store, so calling them "generated views" promised a refresh that
//    does not exist. Under schema 4 the store is the authority and a human
//    reads it through `status`, `detail`, `messages` and `export`. The legacy
//    Markdown is a retained historical import source that is no longer updated.
// ---------------------------------------------------------------------------

// `kai-core-fleet-observation` is the one legitimate exception: the observer
// TUI in `scripts/observe-watch.mjs` really does render, and really exists.
// `kai-core-definition-of-done` uses the word once about a shipped UI change
// displaying on screen, which is asserted exactly rather than waved through.
const RENDER_STEM = /\brender(?:s|ed|ing|ings|er|ers)?\b/i;
const renderAllowance = {
  fleetObservation: null,
  definitionOfDone: /verified \(it renders\)/,
  // kai-creative ships real media renderers (`video-render-zoom`,
  // `scripts/demo-zoom.mjs`, a browser renderer). Those are implemented — but
  // a bare mention of "video" or "zoom" anywhere on a line must not excuse an
  // unrelated render claim elsewhere on that same line (e.g. a claim that
  // `BOARD.md` renders). The loose terms only count when they sit within a
  // short distance of the render word they are meant to justify; the other
  // two idioms already name the render inline, so they need no proximity
  // check.
  creativePackage: {
    tight: /browser renderer|rendered fidelity|synthesis, mixing/i,
    near: /\b(?:video|zoom|cursor)\b/i,
    window: 30,
  },
};

function lineHasAllowedRender(line, allowance) {
  if (!allowance) return false;
  if (typeof allowance.test === 'function') return allowance.test(line);
  if (allowance.tight?.test(line)) return true;
  if (!allowance.near) return false;
  const stem = new RegExp(RENDER_STEM.source, 'gi');
  let match;
  while ((match = stem.exec(line))) {
    const start = Math.max(0, match.index - allowance.window);
    const end = Math.min(line.length, match.index + match[0].length + allowance.window);
    if (allowance.near.test(line.slice(start, end))) return true;
  }
  return false;
}

// Regression fixture: a video/zoom mention far from the actual render word on
// the line must not excuse an unrelated claim that coordination Markdown
// renders — this is exactly the shape the whole-line allowance check missed.
assert.equal(
  lineHasAllowedRender(
    'Video review happens after standup, and `BOARD.md` renders the operator queue.',
    renderAllowance.creativePackage,
  ),
  false,
  'render-claim scan: a distant video/zoom mention must not excuse an unrelated Markdown render claim',
);
// A genuine video render claim, with the term right beside the render word,
// must still pass.
assert.equal(
  lineHasAllowedRender(
    '`video-render-zoom` renders the requested focus window.',
    renderAllowance.creativePackage,
  ),
  true,
  'render-claim scan: a real video render claim tied closely to "video" must still pass',
);

for (const [key, body] of Object.entries(source)) {
  if (key === 'fleetObservation') continue;
  const allowance = renderAllowance[key];
  const offending = body.split(/\r?\n/)
    .map((line, index) => ({ line: line.trim(), index }))
    .filter(({ line }) => RENDER_STEM.test(line))
    .filter(({ line }) => !lineHasAllowedRender(line, allowance));
  assert.deepEqual(offending.map(({ line, index }) => `${key}:${index + 1}: ${line}`), [],
    `${key}: must not claim a Markdown renderer that no code implements`);
}

const REGENERATION = /\bre-?generat\w*/i;
const GENERATED_VIEW = /\bgenerated\b[^.\n]{0,40}\bviews?\b/i;
for (const [key, body] of Object.entries(source)) {
  assert.doesNotMatch(body, REGENERATION,
    `${key}: must not claim coordination Markdown is regenerated`);
  assert.doesNotMatch(body, GENERATED_VIEW,
    `${key}: must not label coordination Markdown a generated view`);
}

// The same scan over the 16 domain agents, narrowed to lines that actually talk
// about coordination state: their domain craft legitimately discusses UI and
// media rendering, and banning the word outright would fail on that instead.
for (const agent of domainAgents) {
  const offending = agent.body.split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => /\.kai\/state|BOARD\.md/.test(line))
    .filter((line) => RENDER_STEM.test(line) || REGENERATION.test(line) || GENERATED_VIEW.test(line));
  assert.deepEqual(offending, [],
    `${agent.id}: must not claim a renderer for coordination Markdown`);
  assert.match(agent.body, /retained pre-schema-4 history/,
    `${agent.id}: names the retained Markdown for what it is`);
}

// What replaces the claim: the store is authoritative, the reads are real
// commands, and `status` is what the cross-item board was for.
assert.match(source.workItem,
  /authoritative record[\s\S]{0,200}coordination\.sqlite/i,
  'work-item: the authoritative record is the runtime store');
assert.match(source.workGranting,
  /`status`[\s\S]{0,200}cross-item|cross-item[\s\S]{0,200}`status`/i,
  'work-granting: `status` is the cross-item view BOARD.md used to describe');

const HISTORICAL_SOURCE = /historical\s+import\s+source/i;
for (const key of ['workItem', 'workActing', 'workGranting', 'workspacePaths',
  'workspaceInitiative', 'workspaces']) {
  assert.match(source[key], HISTORICAL_SOURCE,
    `${key}: legacy coordination Markdown is a retained historical import source`);
}
const NO_LONGER_UPDATED = /no\s+longer\s+updated/i;
for (const key of ['workActing', 'workGranting', 'workspacePaths', 'workspaces']) {
  assert.match(source[key], NO_LONGER_UPDATED,
    `${key}: says the retained Markdown is no longer updated`);
}

const registeredArtifact = /registered artifact/i;
for (const key of ['assetProducing', 'workspaceInitiative']) {
  assert.match(source[key], registeredArtifact,
    `${key}: authored briefs, designs and rationale stay registered artifacts`);
}
assert.match(source.assetProducing,
  /(?:brief|design|decision)[\s\S]{0,240}registered artifact/i,
  'asset-producing: authored material is registered, not derived');

// ---------------------------------------------------------------------------
// 6. Activity and observer logs stay optional, non-authoritative participation
//    signals. They cannot advance lifecycle state or certify a model call.
// ---------------------------------------------------------------------------

for (const key of ['workActivity', 'fleetObservation']) {
  assert.match(source[key], /non-authoritative/i,
    `${key}: the log is explicitly non-authoritative`);
  assert.match(source[key],
    /(?:cannot|never)[\s\S]{0,140}(?:advance|change)[\s\S]{0,60}lifecycle/i,
    `${key}: the log cannot advance lifecycle state`);
  assert.match(source[key],
    /(?:cannot|never)[\s\S]{0,140}certif(?:y|ies)[\s\S]{0,80}model/i,
    `${key}: the log cannot certify a model invocation`);
}
assert.match(source.workActivity, /optional/i,
  'work-activity: participation reporting stays optional');

// ---------------------------------------------------------------------------
// 7. Honesty: no untested coordinated workflow, no promised automatic dispatch,
//    no peer model/effect observation.
// ---------------------------------------------------------------------------

assert.match(source.workGranting, /UNSUPPORTED_HOST/,
  'work-granting: names the real unsupported-host refusal');
assert.match(source.workGranting,
  /peer model\/effect observation[\s\S]{0,200}UNSUPPORTED_HOST/i,
  'work-granting: peer model/effect observation is unsupported, not promised');
assert.match(source.workGranting, /automatic[^.]{0,40}false/i,
  'work-granting: the planner queue is explicitly not automatic dispatch');
assert.match(source.workGranting,
  /(?:ordered queue|plan)[\s\S]{0,300}(?:a human|the operator|an operator)[\s\S]{0,120}launch/i,
  'work-granting: something outside the runtime still launches each role');

const forbiddenClaims = [
  /automatic(?:ally)? dispatch(?:es|ed)? (?:the |each )?(?:next )?role/i,
  /verified end[- ]to[- ]end/i,
  /proven in production/i,
];
for (const [key, body] of Object.entries(source)) {
  for (const claim of forbiddenClaims) {
    assert.doesNotMatch(body, claim,
      `${key}: must not claim an untested coordinated workflow`);
  }
}

assert.match(source.hostCapabilities, /coordinate\.mjs/,
  'docs/host-capabilities: names the runtime entry point');
assert.match(source.hostCapabilities,
  /peer model\/effect observation[\s\S]{0,200}UNSUPPORTED_HOST/i,
  'docs/host-capabilities: records the measured unsupported capability');
assert.match(source.hostCapabilities,
  /synthetic[\s\S]{0,120}(?:human )?approval/i,
  'docs/host-capabilities: the measured probe used a synthetic approval fixture');
// The probe under-claimed in the first pass: the launched worker really did run
// both exact canonical commands, and both environment identity and the CLI
// receipt matched (`native-permission-report.md`). Record that, and only that.
assert.match(source.hostCapabilities,
  /(?:ran|executed)[\s\S]{0,160}both\s+exact[\s\S]{0,200}command/i,
  'docs/host-capabilities: records that the worker actually ran both commands');
assert.match(source.hostCapabilities,
  /(?:CLI\s+)?receipt[\s\S]{0,160}match/i,
  'docs/host-capabilities: records the genuine CLI receipt match');
assert.doesNotMatch(source.hostCapabilities,
  /did not measure a live worker command receipt/i,
  'docs/host-capabilities: must not under-claim the measured receipt');

// ---------------------------------------------------------------------------
// 8. Core workflow agents that touch coordinated state carry the same route.
// ---------------------------------------------------------------------------

for (const key of ['director', 'initiativeInit', 'workspaceInit']) {
  assert.match(source[key], RUNTIME_SCRIPT,
    `${key}: routes coordinated state through the runtime command`);
}
assert.match(source.proactiveScan, /read-only|inspect/i,
  'proactive-scan: stays a read-only reader of coordinated state');
// `messages` requires `--item`; cli.mjs fails INVALID_INPUT without it.
assert.doesNotMatch(source.proactiveScan, /status\|messages\s*\n?\s*--root/,
  'proactive-scan: must not show `messages` without its required --item');
assert.match(source.proactiveScan, /messages --item/,
  'proactive-scan: `messages` carries the required --item argument');
assert.match(source.selfCheck,
  /(?:never|not)[\s\S]{0,120}(?:open|create)[\s\S]{0,60}item/i,
  'self-check: still never opens a coordinated item itself');
assert.match(source.weeklyPulse, /(?:read-only|does not (?:write|change))/i,
  'weekly-pulse: remains a reader of coordinated state');

// ---------------------------------------------------------------------------
// 9. Independent acceptance is a runtime guarantee under schema 4, not a
//    contract-only rule awaiting later work. `evidence.mjs` calls
//    `independent()` from `review.record`, `approval.record` and the waiver
//    path, and `review.record` additionally binds a `product-design-acceptance`
//    to the declared completion authority while excluding every producing role.
// ---------------------------------------------------------------------------

assert.doesNotMatch(source.workActing, /left to later work/i,
  'work-acting: schema-4 independence is enforced today, not deferred to later work');
assert.match(source.workActing,
  /runtime enforces this[\s\S]{0,400}`review\.record`[\s\S]{0,200}`approval\.record`[\s\S]{0,300}AUTHORITY_REQUIRED/,
  'work-acting: names the real commands and refusal that enforce independent acceptance');
assert.match(source.workActing,
  /producing_actors[\s\S]{0,400}`completion_authority`/,
  'work-acting: records that product-design-acceptance excludes producing roles');

// ---------------------------------------------------------------------------
// 10. The human-authorization ladder is followable. `matchHumanDecision`
//     (native-receipts.mjs) matches an `ask_user` tool call whose
//     `message` is byte-equal to the issued request, whose `requestedSchema`
//     is canonically equal, and whose reply is exactly the strict APPROVE
//     string. A chat-typed "approved" produces no receipt at all.
// ---------------------------------------------------------------------------

assert.match(source.workGranting, /`ask_user`/,
  'work-granting: names the actual host tool that carries a human decision');
assert.match(source.workGranting, /`requestedSchema`/,
  'work-granting: the issued requestedSchema must be passed through');
assert.match(source.workGranting, /verbatim/i,
  'work-granting: the returned message and schema are passed through verbatim');
assert.match(source.workGranting, /User responded: APPROVE <nonce>/,
  'work-granting: quotes the exact accepted reply the runtime matches');
assert.match(source.workGranting,
  /(?:typed|typing)[\s\S]{0,160}chat|chat[\s\S]{0,160}(?:typed|typing)/i,
  'work-granting: a chat-typed approval produces nothing');
for (const verb of ['init', 'migrate', 'recover', 'rollback', 'repair']) {
  assert.match(source.workGranting,
    new RegExp(`gate[\\s\\S]{0,400}\`${verb}\``),
    `work-granting: the human gate is named for ${verb}`);
}

// ---------------------------------------------------------------------------
// 11. `claim` is not a pure read. cli.mjs routes it through
//     assertWorkspaceWrite(requirePrivate:true) and opens the store in write
//     mode, so a workspace whose private Git exclusions drifted refuses it.
// ---------------------------------------------------------------------------

assert.doesNotMatch(source.workGranting, /acquires nothing and writes nothing/,
  'work-granting: `claim` is not documented as a pure read');
assert.match(source.workGranting,
  /`claim`[\s\S]{0,60}\|[\s\S]{0,400}(?:Git privacy|private Git)/i,
  'work-granting: `claim` names its Git-privacy precondition');

// ---------------------------------------------------------------------------
// 12. The cloud coding agent cannot create a coordination store: every write
//     path needs a capability, the only issuers are `authorize` and
//     `delegate`, and `authorize` -> matchHumanDecision -> readNativeTool ->
//     nativeEvents requires COPILOT_AGENT_SESSION_ID plus an existing
//     ~/.copilot/session-state/<id>/events.jsonl, else UNSUPPORTED_HOST.
// ---------------------------------------------------------------------------

assert.doesNotMatch(source.hostCapabilities,
  /schema-4 store\)\s*\|\s*✅\s*\|\s*✅/,
  'docs/host-capabilities: the cloud agent must not carry an unqualified checkmark for the runtime');
assert.match(source.hostCapabilities, /events\.jsonl/,
  'docs/host-capabilities: names the ask_user journal the gate depends on');
assert.match(source.hostCapabilities, /`ask_user`/,
  'docs/host-capabilities: names the tool whose receipt authorizes a store');
assert.match(source.hostCapabilities, /UNSUPPORTED_HOST[\s\S]{0,400}SCHEMA_MISMATCH|SCHEMA_MISMATCH[\s\S]{0,400}UNSUPPORTED_HOST/,
  'docs/host-capabilities: names the two refusals a journal-less host actually returns');
assert.match(source.workspaceOnboarding, /COPILOT_AGENT_SESSION_ID/,
  'workspace-onboarding: the init ladder names the required host session identity');
assert.match(source.workspaceOnboarding, /events\.jsonl/,
  'workspace-onboarding: the init ladder names the required ask_user journal');
assert.match(source.workspaceOnboarding, /UNSUPPORTED_HOST/,
  'workspace-onboarding: the init ladder names the refusal on a journal-less host');

// ---------------------------------------------------------------------------
// 13. The acceptance record is reachable, and reads as a permanent document
//     rather than a branch-local note.
// ---------------------------------------------------------------------------

const acceptanceRecord = read(join(root, 'docs', 'reference', 'coordination-acceptance.md'));
for (const [label, path, link] of [
  ['README', join(root, 'README.md'), 'docs/reference/coordination-acceptance.md'],
  ['CHANGELOG', join(root, 'CHANGELOG.md'), 'docs/reference/coordination-acceptance.md'],
  ['docs/workspaces', docPaths.workspaces, 'reference/coordination-acceptance.md'],
]) {
  assert.ok(read(path).includes(link),
    `${label}: links the coordination acceptance record at ${link}`);
}
for (const branchVoice of [/on this branch/i, /in this task/i, /this branch/i, /this task/i]) {
  assert.doesNotMatch(acceptanceRecord, branchVoice,
    'docs/reference/coordination-acceptance: permanent docs cannot say "this branch" or "this task"');
}
assert.match(acceptanceRecord, /FAILED/,
  'docs/reference/coordination-acceptance: still records the failed scenario');
assert.match(acceptanceRecord, /Not verified/,
  'docs/reference/coordination-acceptance: still records the unverified verdicts');

console.log('coordination source routing self-test: all checks passed');
