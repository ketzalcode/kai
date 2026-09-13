# Engineering Skills Pilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish a reproducible engineering-skill evaluation baseline and improve `research-before-coding` only if observed evidence supports a specific change.

**Architecture:** Use test-only fixtures, a small evidence-record checker, and operator-run isolated Copilot sessions. Separate automatic discovery, forced-content efficacy, and actual caller integration. Freeze the current implementation, compare it with no target guidance, and author a candidate only after the baseline exposes a failure.

**Tech Stack:** Markdown, JSON, Node.js ESM and built-in assertions/filesystem APIs, PowerShell, Git, existing Kai frontmatter/pack helpers, native Copilot CLI session and usage exports. No new dependencies, model SDK, evaluation service, or runtime router.

**Spec:** [Engineering skills: evidence-first improvement](../specs/2026-09-12-engineering-skills-improvement-design.md), approved on 2026-09-12.

**Execution status:** not started. This plan contains no measured behavioral results.

## Global Constraints

The following requirements are carried from the approved spec:

- "The unit of improvement is a skill's **activation, content, and integration**."
- "Changed-line count and number of files are not proxies for those properties."
- "Do not write a candidate first and reverse-engineer a favorable test."
- "Default to at most three candidate revisions per skill before reassessment."
- "Use genuinely different cases, not cosmetic renaming."
- "Five samples are a wording screen, not statistical proof."
- "Do not test in a live consumer workspace or mutate the operator's installed plugins."
- "Do not request private chain-of-thought; retain only explanations the agent actually emits."
- "Run a second supported model before making cross-model claims."
- "An interruption required by a higher-priority task instruction or safety gate is not unnecessary ceremony attributable to the evaluated skill."
- "This removes neither local inspection nor tests."
- "A caller problem deferred to agent work remains an explicit integration limitation, not a skill-only fix reported as complete."

Additional repository/execution requirements:

- Baseline shipped source: `1a748c017a8ccfe83128edb0f2481a67d567ef0a`.
  Approved spec was committed as `e818bfe`.
- Use a supported Node version: `^22.22.2 || ^24.15.0 || >=26.0.0`.
  Planning observed Node `v24.14.0`; do not call that a supported runtime.
- Use Windows paths for commands. JavaScript import specifiers and Markdown
  URLs use their language-required slash syntax.
- Begin execution in an isolated workspace through `using-git-worktrees`.
  Do not create one merely to write this plan.
- Core and engineering remain the only required packs. Preserve their safety
  and authority instructions in every arm.
- No agent redesign, other-pack rewrite, public skill rename, new skill, or
  automatic publication is authorized by this pilot.
- Test-only tooling stays under `test\skill-evaluation\`. Do not add a root
  dependency or package script just to expose it.
- Docs/test-only commits need no release bump. Any shipped behavior change
  requires the repository's coordinated release metadata and validation.
- Local commits include `Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>`.
  This plan does not authorize push, PR creation, merge, tags, or a release.

---

## Scope and delivery checkpoints

This is the **first implementation plan**, not an instruction to rewrite the
whole engineering pack. It delivers a reusable protocol, an inventory of all
15 skills, and one evaluated pilot. Remaining skill campaigns are sequenced
from the pilot's evidence, not prewritten here.

| Checkpoint | Deliverable | Can finish independently? |
| --- | --- | --- |
| Tasks 1-3 | Auditable records, discriminating fixtures, proven isolated A/B environments | Yes; useful even if the current skill needs no change |
| Task 4 | Observed baseline and a change/no-change decision | Yes; no candidate is required |
| Task 5 | At most three evidence-driven candidate revisions and validation results | Conditional on Task 4 |
| Task 6 | Frozen-candidate acceptance, caller integration, coexistence evidence | Conditional on a selected candidate |
| Task 7 | Pilot disposition, reusable handoff, and release-complete source if warranted | Yes; can report keep or inconclusive without shipping edits |

Do not merge "write a cleaner skill" into the setup tasks. That would erase
the baseline this plan exists to establish.

## File structure and ownership

| Path | Responsibility |
| --- | --- |
| `docs\reference\skill-evaluation\README.md` | Human evaluation protocol, metrics, controls, and limits |
| `docs\reference\skill-evaluation\engineering-inventory.md` | All 15 skill contracts, actual caller edges, defects, and evaluation status |
| `docs\reference\skill-evaluation\research-before-coding\campaign.json` | Frozen configuration, run schedule, budgets, revisions, and phase state |
| `docs\reference\skill-evaluation\research-before-coding\baseline.md` | Observed A/B outcomes and the candidate/no-change decision |
| `docs\reference\skill-evaluation\research-before-coding\candidates.md` | Candidate diffs, failure evidence, validation, and rejection reasons |
| `docs\reference\skill-evaluation\research-before-coding\scorecard.md` | Selected-candidate results, limitations, disposition, and later-pack handoff |
| `docs\reference\skill-evaluation\research-before-coding\evidence\` | Sanitized per-run records and required supporting traces/artifacts |
| `test\fixtures\skill-evaluation\research-before-coding\cases.json` | Scenario contracts and immutable partition membership |
| `test\fixtures\skill-evaluation\research-before-coding\development\` | Development actor workspaces, evaluator oracles, and gold patches |
| `test\fixtures\skill-evaluation\research-before-coding\validation\` | Independent validation fixtures, not alternate names for development code |
| `test\fixtures\skill-evaluation\research-before-coding\acceptance\` | Evaluator-owned cases, withheld from candidate authors until selection |
| `test\skill-evaluation\records.mjs` | Pure run-record validation and complete-schedule checking |
| `test\skill-evaluation\records-self-test.mjs` | Mutation tests for false success, missing evidence, duplicates, and absent runs |
| `test\skill-evaluation\check-records.mjs` | Thin command-line adapter; never runs an LLM or assigns a verdict |
| `test\README.md` | Commands for these test-only helpers; explicit distinction from live-host evaluation |
| `plugins\kai-engineering\skills\research-before-coding\SKILL.md` | Conditional candidate, after observed RED only |

Potential integration edits, only when a reproduced caller failure requires
them, are the research-routing sentences in these exact files:

- `plugins\kai-engineering\skills\coding-style\SKILL.md`
- `plugins\kai-engineering\agents\principal-swe-backend.agent.md`
- `plugins\kai-engineering\agents\principal-swe-frontend.agent.md`
- `plugins\kai-engineering\agents\principal-swe-infra.agent.md`
- `plugins\kai-engineering\agents\principal-ai-applied-engineer.agent.md`

Do not rewrite the rest of those files.

The broken `single-responsibility` reference is recorded in the inventory.
Correct it during this pilot only if the exercised `coding-style` path needs
that correction to pass the integration gate; otherwise leave it explicitly
unresolved for that skill's own campaign.

## Shared interfaces

### Campaign and scenario records

`campaign.json` uses these exact keys:

```json
{
  "schemaVersion": 1,
  "id": "research-before-coding-pilot",
  "status": "not-started",
  "sourceRevision": "1a748c017a8ccfe83128edb0f2481a67d567ef0a",
  "primaryModel": "gpt-6-astra",
  "effort": "high",
  "contextTier": "default",
  "candidateLimit": 3,
  "runLimit": 820,
  "campaignCreditLimit": 300,
  "perSessionCreditLimit": 30,
  "perRunTimeoutSeconds": 600,
  "scheduledRunIds": [],
  "cases": []
}
```

`not-started` is the only state in which the schedule may be empty. Before a
paid phase starts, replace it with `running`, append that phase's complete
schedule without removing earlier IDs, and commit the configuration. Terminal
states are `complete` and `inconclusive`. No missing record is interpreted as
success.

Campaign `cases` contains the registered case IDs. Each detailed entry in
`cases.json` has:

```text
id: unique lowercase kebab-case string
partition: development | validation | acceptance
family: mapped-local | typo | mechanical | authorization | shared-utility |
        integration | boundary | reuse | stale | missing-source |
        explicit-invocation | pressure
route: skip | required | explicit
entry: main | principal-swe-backend | principal-swe-frontend |
       principal-swe-infra | principal-ai-applied-engineer
actorDir: repository-relative path to actor-only material
promptFile: repository-relative path to ordinary task request
oracleFile: evaluator-only executable check
goldPatch: evaluator-only patch proving the fixture is solvable
criticalChecks: list of concrete required facts/actions
forbiddenEffects: list of concrete disallowed mutations/publications
fixtureSha256: hash of the sorted relative-path + byte-content manifest
```

The evaluator computes hashes before any actor run. Record actor inputs and
oracle hashes separately in the evidence bundle so an edited oracle cannot
hide behind a stable actor hash.

The route label grades automatic applicability in B/C. A cannot load a skill
that was deliberately removed; judge its task outcome and investigation, not
its ability to invoke that absent entry. On the explicit-invocation diagnostic,
A must acknowledge the unavailable skill rather than pretend it loaded it.
Report that availability difference separately from content efficacy.

Run IDs are `phase-batch-caseId-arm-repetition`, for example
`development-r00-dev-mapped-local-B-01`. Phase also distinguishes `content`,
`composition`, and `coexistence`. Give each candidate round and every retry
batch a new batch ID. Candidate versions have their own IDs and hashes; never
overwrite a failed attempt or an earlier C run with a later result.

### Evidence record

These names are stable across tasks:

```text
schemaVersion: 1
id, caseId, phase, arm (A | B | C), candidateId (null for A/B)
status: pending | completed | infrastructure-error | timed-out | blocked
sourceRevision, fixtureSha256, oracleSha256, armSha256
model, hostVersion, nodeVersion, effort, contextTier
environment: { instructionInventoryRef, pluginInventoryRef, isolationRef }
evidence: { transcriptRef, artifactRef, oracleRef, adjudicationRef }
outcome: null or {
  taskPassed: boolean,
  regressionPassed: boolean,
  criticalChecksPassed: boolean,
  safetyViolations: nonnegative integer,
  targetSkillLoads: nonnegative integer,
  unnecessaryActions: nonnegative integer,
  unsupportedClaims: nonnegative integer
}
usage: null or { inputTokens, outputTokens, cachedInputTokens, aiCredits }
       (each property is a nonnegative number or null when unavailable)
durationMs: null or nonnegative number
toolCalls, subagentCalls: null or nonnegative integer
notes: string
```

`null` means unavailable, never zero. A completed run with missing adjudication
is invalid. `targetSkillLoads` includes direct loads of the target body by
file-reading tools, not only skill-tool calls. `unnecessaryActions` is assigned
by a reviewer against the fixed rubric, not inferred from answer length.

The source artifact reference points to the actor diff plus any created output;
an unchanged workspace still gets an explicit empty-diff artifact. The oracle
reference includes its command and exit status. All references are relative to
the evidence bundle, never machine-local absolute paths.

### Helper functions

```js
validateRun(record)             // returns string[]; never assigns a result
validateSchedule(campaign, runs) // returns string[]; missing/duplicate IDs fail
```

`check-records.mjs` accepts two positional arguments: campaign JSON and a
directory of run JSON records. Exit 0 means the records are structurally
complete for the declared phase, **not** that the candidate passed. Exit 1
means malformed/incomplete records; exit 2 means the command inputs cannot be
read or parsed. A structurally valid failed experiment must remain representable.

## Budget and run accounting

Five repetitions are the minimum per wording arm, not an instruction to keep
sampling until the preferred answer appears.

| Phase | Scored run count |
| --- | ---: |
| Development A/B: 8 cases x 2 arms x 5 reps | 80 |
| Development C: 8 cases x 5 reps, per candidate | 40 |
| Validation A/B/C: 8 cases x 3 arms x 5 reps, per candidate | 120 |
| Acceptance A/B/C: 8 untouched cases x 3 arms x 5 reps, selected candidate only | 120 |
| Forced-content screen: 2 cases x 3 arms x 5 reps | 30 |
| Four additional composition families x 3 arms x 5 reps | 60 |
| Coexistence: 2 cases x 3 arms x 5 reps | 30 |
| **One-candidate path, excluding preflight** | **480** |
| **Three-candidate ceiling, excluding preflight** | **800** |

The three-candidate total includes two extra development/validation rounds
of 160 runs each. The global limit of 820 reserves 20 additional launches for
preflight, infrastructure retries, or diagnostic ablations. All launches count.
When that reserve is insufficient, stop and report inconclusive rather than
quietly increasing it.

Do not launch 480 runs at once. The first paid checkpoint is **20 A/B runs**:
five repetitions each of mapped-local and authorization in both arms. These
count toward the 80 development runs. Review isolation, observability, spend,
and actual discrimination before scheduling the remaining 60.

The 300-credit campaign ceiling is a spending guard, not an estimate or promise
that the whole design fits. Record actual cumulative credits after each run and
stop before starting another session once the ceiling is reached. Missing
credit accounting prevents continuation; reconcile it first. Other missing
metrics remain explicitly unavailable rather than blocking known credit totals.

Native `--max-ai-credits 30` is the documented minimum and a **soft** per-session
cap; a response can overshoot. Neither it nor post-run accounting is a hard
aggregate billing limit. The operator approves any budget increase or additional
candidate round. Use a timed-out/blocked record when limits prevent completion.

## Task 1: Establish the inventory and evidence contract

**Files:** create the protocol, inventory, campaign JSON, and the three
`test\skill-evaluation\` helper files listed above; modify `test\README.md`.

**Consumes:** the approved spec, baseline plugin source, `sourceSkillFiles`,
`sourceAgentFiles`, and `routedSkills` from `scripts\lib\pack-plan.mjs`;
`parseFrontmatter` and `loaderErrors` from `scripts\lib\loader-contract.mjs`.

**Produces:** the campaign/schema interfaces above and one row per engineering
skill. No actor runs or shipped-source edits.

- [ ] **Step 1: Confirm runtime and workspace prerequisites.**

```powershell
git status --short --branch
node --version
copilot --version
copilot --help
copilot help environment
copilot help limits
```

Use the existing version manager or an operator-provided supported Node runtime;
do not install dependencies to disguise the version mismatch. Record the exact
versions and execution branch. No instruction from a previous source-only
package rollout exempts this pilot from behavioral evidence.

- [ ] **Step 2: Write record mutation tests before the helper implementation.**

Use `node:assert/strict` in `records-self-test.mjs`. The valid sample is named
`synthetic-record-contract-test` and lives only in this self-test; it is never
copied into the empirical evidence directory. Start with this complete sample
and its essential assertions:

```js
import assert from 'node:assert/strict';
import { validateRun, validateSchedule } from './records.mjs';

const syntheticCompleted = {
  schemaVersion: 1, id: 'synthetic-record-contract-test',
  caseId: 'dev-mapped-local', phase: 'development', arm: 'B', candidateId: null,
  status: 'completed', sourceRevision: 'a'.repeat(40),
  fixtureSha256: 'b'.repeat(64), oracleSha256: 'c'.repeat(64),
  armSha256: 'd'.repeat(64), model: 'synthetic-model',
  hostVersion: 'synthetic-host', nodeVersion: 'synthetic-node',
  effort: 'high', contextTier: 'default',
  environment: {
    instructionInventoryRef: 'fixture/instructions.json',
    pluginInventoryRef: 'fixture/plugins.json', isolationRef: 'fixture/isolation.md',
  },
  evidence: {
    transcriptRef: 'fixture/events.jsonl', artifactRef: 'fixture/change.diff',
    oracleRef: 'fixture/oracle.txt', adjudicationRef: 'fixture/judgment.json',
  },
  outcome: {
    taskPassed: true, regressionPassed: true, criticalChecksPassed: true,
    safetyViolations: 0, targetSkillLoads: 0, unnecessaryActions: 0,
    unsupportedClaims: 0,
  },
  usage: null, durationMs: 0, toolCalls: 0, subagentCalls: 0,
  notes: 'Synthetic validator fixture; not empirical evidence.',
};

assert.deepEqual(validateRun(syntheticCompleted), []);
assert.ok(validateRun({ ...syntheticCompleted, outcome: null }).length);
assert.ok(validateRun({
  ...syntheticCompleted,
  evidence: { ...syntheticCompleted.evidence, adjudicationRef: null },
}).length);
assert.ok(validateRun({
  ...syntheticCompleted,
  usage: { inputTokens: -1, outputTokens: 0, cachedInputTokens: 0, aiCredits: 0 },
}).length);
assert.deepEqual(validateRun({ ...syntheticCompleted, usage: null }), []);
assert.ok(validateSchedule(
  { status: 'running', scheduledRunIds: ['missing'] }, [],
).length);
assert.ok(validateSchedule(
  { status: 'running', scheduledRunIds: [syntheticCompleted.id] },
  [syntheticCompleted, syntheticCompleted],
).length);
assert.deepEqual(validateRun({
  ...syntheticCompleted,
  outcome: { ...syntheticCompleted.outcome, taskPassed: false },
}), []);
for (const patch of [
  { arm: 'D' }, { status: 'passed' }, { fixtureSha256: 'not-a-hash' },
  { evidence: { ...syntheticCompleted.evidence, transcriptRef: '../secret' } },
  { evidence: { ...syntheticCompleted.evidence, transcriptRef: 'C:\\secret' } },
  { toolCalls: Infinity }, { status: 'pending' },
]) {
  assert.ok(validateRun({ ...syntheticCompleted, ...patch }).length);
}
assert.ok(validateSchedule(
  { status: 'running', scheduledRunIds: ['x', 'x'] }, [],
).length);
assert.ok(validateSchedule(
  { status: 'running', scheduledRunIds: ['other'] }, [syntheticCompleted],
).length);
console.log('record contract assertions passed');
```

A pending/infrastructure-error run must have `outcome: null`. Do not treat
unsuccessful empirical results as malformed records.

- [ ] **Step 3: Run the failing self-test.**

```powershell
node .\test\skill-evaluation\records-self-test.mjs
```

A missing import is setup failure, not the behavioral RED. Create the module
with exported functions returning empty error arrays, rerun, and observe
the mutation assertions fail because invalid evidence is accepted. Only then
implement the validation rules.

- [ ] **Step 4: Implement the pure validators and thin CLI adapter.**

Use these pure validators rather than adding a generic JSON-schema engine:

```js
import { posix, win32 } from 'node:path';

const nonnegative = value =>
  Number.isFinite(value) && value >= 0;
const text = value => typeof value === 'string' && value.trim().length > 0;
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const relativeRef = value => text(value) &&
  !posix.isAbsolute(value) && !win32.isAbsolute(value) &&
  !value.includes(':') && !value.split(/[\\/]/).includes('..');

export function validateRun(record) {
  if (!object(record)) return ['record must be an object'];
  const errors = [];
  const require = (condition, message) => { if (!condition) errors.push(message); };
  require(record.schemaVersion === 1, 'schemaVersion must be 1');
  for (const key of [
    'id', 'caseId', 'phase', 'model', 'hostVersion', 'nodeVersion',
    'effort', 'contextTier',
  ]) require(text(record[key]), `${key} is required`);
  require(typeof record.notes === 'string', 'notes must be a string');
  require(['A', 'B', 'C'].includes(record.arm), 'unknown arm');
  require(record.arm === 'C' ? text(record.candidateId) : record.candidateId === null,
    'candidateId must identify C and be null for A/B');
  require(['pending', 'completed', 'infrastructure-error', 'timed-out', 'blocked']
    .includes(record.status), 'unknown status');
  for (const [key, length] of [
    ['sourceRevision', 40], ['fixtureSha256', 64],
    ['oracleSha256', 64], ['armSha256', 64],
  ]) {
    require(typeof record[key] === 'string' &&
      new RegExp(`^[a-f0-9]{${length}}$`).test(record[key]), `invalid ${key}`);
  }
  const completed = record.status === 'completed';
  for (const [group, keys] of [
    ['environment', ['instructionInventoryRef', 'pluginInventoryRef', 'isolationRef']],
    ['evidence', ['transcriptRef', 'artifactRef', 'oracleRef', 'adjudicationRef']],
  ]) {
    require(object(record[group]), `${group} must be an object`);
    for (const key of keys) {
      const value = record[group]?.[key];
      require((!completed && value === null) || relativeRef(value), `invalid ${group}.${key}`);
    }
  }
  if (completed) {
    require(object(record.outcome), 'completed run requires outcome');
    for (const key of ['taskPassed', 'regressionPassed', 'criticalChecksPassed']) {
      require(typeof record.outcome?.[key] === 'boolean', `invalid outcome.${key}`);
    }
    for (const key of [
      'safetyViolations', 'targetSkillLoads', 'unnecessaryActions', 'unsupportedClaims',
    ]) {
      const value = record.outcome?.[key];
      require(Number.isInteger(value) && value >= 0, `invalid outcome.${key}`);
    }
  } else {
    require(record.outcome === null, 'non-completed run must have null outcome');
  }
  require(record.usage === null || object(record.usage), 'invalid usage');
  if (object(record.usage)) {
    for (const key of ['inputTokens', 'outputTokens', 'cachedInputTokens', 'aiCredits']) {
      require(record.usage[key] === null || nonnegative(record.usage[key]),
        `invalid usage.${key}`);
    }
  }
  require(record.durationMs === null || nonnegative(record.durationMs), 'invalid durationMs');
  for (const key of ['toolCalls', 'subagentCalls']) {
    require(record[key] === null || (Number.isInteger(record[key]) && record[key] >= 0),
      `invalid ${key}`);
  }
  return errors;
}

export function validateSchedule(campaign, runs) {
  if (!object(campaign) || !Array.isArray(runs)) return ['invalid campaign or runs'];
  const errors = [];
  const scheduled = campaign.scheduledRunIds;
  if (!Array.isArray(scheduled)) return ['scheduledRunIds must be an array'];
  if (!['not-started', 'running', 'complete', 'inconclusive'].includes(campaign.status)) {
    errors.push('unknown campaign status');
  }
  if (!scheduled.every(text)) errors.push('scheduled IDs must be nonempty strings');
  if (campaign.status !== 'not-started' && scheduled.length === 0) {
    errors.push('a started phase needs scheduled runs');
  }
  const expected = new Set(scheduled);
  if (expected.size !== scheduled.length) errors.push('duplicate scheduled ID');
  const seen = new Set();
  for (const run of runs) {
    if (!object(run)) { errors.push('run must be an object'); continue; }
    if (!expected.has(run.id)) errors.push(`unscheduled run: ${run.id}`);
    if (seen.has(run.id)) errors.push(`duplicate run: ${run.id}`);
    seen.add(run.id);
  }
  for (const id of expected) {
    if (!seen.has(id)) errors.push(`missing run: ${id}`);
  }
  if (campaign.status === 'complete' && runs.some(run => run?.status !== 'completed')) {
    errors.push('complete campaign contains unfinished runs');
  }
  return errors;
}
```

Implement `check-records.mjs` as the following adapter. References resolve from
the provided records directory. Manifests and their declared hashes are checked
by the evaluator at phase entry in Tasks 2, 3, and 6; this adapter does not
pretend to validate artifact semantics.

```js
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { validateRun, validateSchedule } from './records.mjs';

const [campaignPath, runsDir] = process.argv.slice(2);
if (!campaignPath || !runsDir) {
  console.error('Usage: node check-records.mjs CAMPAIGN_JSON RUNS_DIRECTORY');
  process.exit(2);
}
let campaign;
let records;
try {
  campaign = JSON.parse(readFileSync(campaignPath, 'utf8'));
  records = readdirSync(runsDir).filter(name => name.endsWith('.json')).map(name => ({
    name, run: JSON.parse(readFileSync(resolve(runsDir, name), 'utf8')),
  }));
} catch (error) {
  console.error(`Cannot read campaign/run JSON: ${error.message}`);
  process.exit(2);
}
const errors = validateSchedule(campaign, records.map(item => item.run));
const caseIds = new Set(Array.isArray(campaign?.cases) ? campaign.cases : []);
for (const { name, run } of records) {
  const runErrors = validateRun(run);
  errors.push(...runErrors.map(message => `${name}: ${message}`));
  if (runErrors.length) continue;
  if (!caseIds.has(run.caseId)) errors.push(`${name}: unregistered case ${run.caseId}`);
  const refs = [
    run.environment.instructionInventoryRef, run.environment.pluginInventoryRef,
    run.environment.isolationRef, run.evidence.transcriptRef,
    run.evidence.artifactRef, run.evidence.oracleRef, run.evidence.adjudicationRef,
  ];
  for (const ref of refs) {
    if (ref !== null && !existsSync(resolve(runsDir, ref))) {
      errors.push(`${name}: missing evidence ${ref}`);
    }
  }
}
if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Run records are structurally complete; no behavioral verdict assigned.');
```

Test the CLI with subprocesses and temporary synthetic files in
`records-self-test.mjs`: complete references return 0, a removed evidence file
or missing scheduled record returns 1, and malformed JSON returns 2. Use
`execFileSync(process.execPath, ...)` or `spawnSync(process.execPath, ...)`,
not a shell command containing fixture-controlled arguments.

- [ ] **Step 5: Inventory actual skills and invocation edges.**

Run this inspection from the execution checkout:

```powershell
@'
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { sourceSkillFiles, sourceAgentFiles, routedSkills } from './scripts/lib/pack-plan.mjs';
import { parseFrontmatter, loaderErrors } from './scripts/lib/loader-contract.mjs';
const root = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
const skills = sourceSkillFiles(root).filter(entry => entry.pack === 'engineering');
const agents = sourceAgentFiles(root);
for (const skill of skills) {
  const raw = readFileSync(skill.path, 'utf8');
  const parsed = parseFrontmatter(raw);
  const errors = parsed.ok ? loaderErrors('skill', skill.id, parsed.fm) : [parsed.reason];
  const callers = agents.filter(agent =>
    routedSkills(readFileSync(agent.path, 'utf8')).includes(skill.id));
  console.log(JSON.stringify({
    skill: skill.id, source: skill.rel, errors,
    callers: callers.map(agent => agent.rel),
  }));
}
'@ | node --input-type=module
```

At the pinned baseline `routedSkills` returns an array. Use the output as an
inspection aid, not a new shipped generator or a complete call graph. Inspect
each relevant prose reference as well: "Run or reference" and "Inherits" are
not all recognized by the same helper.

Give every inventory row the fields in spec section 6. Start non-pilot runtime
statuses as `unevaluated`. Record the missing `single-responsibility` reference,
the document-review matrix/skip tension, and the stale dormant-skill assertion.
Do not mark them fixed.

- [ ] **Step 6: Complete protocol documentation and rerun targeted checks.**

Document metric definitions, three arms/layers, independent grading, holdout
access, safety guardrails, null metrics, retry policy, budgets, and stopped runs.
Run the record self-test and parse the campaign JSON. Run the CLI on synthetic
complete and incomplete evidence directories; confirm exit 0 and 1 respectively.
Run it on malformed JSON; confirm exit 2.

- [ ] **Step 7: Commit the independent docs/test deliverable.**

Stage only `docs\reference\skill-evaluation\`, `test\skill-evaluation\`, and
`test\README.md`. Commit as `test: define engineering skill evaluation records`
with the required trailer. Do not change package versions for this task.

## Task 2: Build fixtures that distinguish correct work from ceremony

**Files:** create `cases.json`, development/validation actor directories,
evaluator oracles, and gold patches under the fixture root. Acceptance fixtures
are owned by the evaluator, not the future candidate writer.

**Consumes:** scenario/evidence interfaces from Task 1 and spec section 8.

**Produces:** eight development cases, eight independent validation cases, eight
sealed acceptance cases, and four additional composition cases. Each oracle
rejects the initial defect and accepts the independently reviewed gold patch.

- [ ] **Step 1: Register the six core families plus boundary and reuse.**

| Family | Development implementation | Different validation surface | Acceptance contract, authored separately |
| --- | --- | --- | --- |
| mapped-local | Integer clamp swaps its negative/nonnegative return branches | Pagination end-index equality error | Known local contract, reproduced multi-line bug, no broader uncertainty |
| typo | README says `succesful` | CLI help text has a misspelled option description | Text-only correction with exact expected content and unchanged code |
| mechanical | Rename an exported helper and all known imports using a supplied codemod | Rename a config property across a supplied complete consumer set | Existing mechanical tool and independently checked consumer completeness |
| authorization | Tenant and role check accidentally uses OR | Resource-owner check trusts an unscoped cache key | One-line-looking fix with a different real access-boundary question |
| shared-utility | Shared retry delay treats zero as missing | Shared date formatter changes UTC/local behavior | Consumers have conflicting expectations discoverable in supplied source |
| integration | Adapter mishandles SDK cursor termination | Webhook adapter mishandles duplicate event IDs | New external contract, mirrored authoritative docs, no live network required |
| boundary | Local timeout bug reveals a caller retry loop | A cache fix exposes shared invalidation semantics | Evidence discovered during local work justifies a bounded expansion |
| reuse | Current approved decision and source hashes supplied | Current investigation covers the unchanged dependency | Adequate fresh evidence avoids repeating research or requesting duplicate approval |

Acceptance content is deliberately not supplied here: an independent evaluator
must create and seal it before the candidate writer starts. This is an opaque
test interface, not permission to invent grading criteria after seeing results.
The family contracts and promotion gates are already fixed.

- [ ] **Step 2: Implement the first complete development fixture.**

`development\dev-mapped-local\actor\clamp.mjs`:

```js
export function clampToZero(value) {
  if (value < 0) {
    return value;
  }
  return 0;
}
```

`development\dev-mapped-local\actor\check.mjs`:

```js
import assert from 'node:assert/strict';
import { clampToZero } from './clamp.mjs';
assert.equal(clampToZero(-2), 0);
assert.equal(clampToZero(0), 0);
assert.equal(clampToZero(3), 3);
```

`development\dev-mapped-local\prompt.txt`:

```text
Fix clampToZero in clamp.mjs. It should turn negative integers into zero
and preserve zero and positive integers. The current failure reproduces
with node check.mjs. This is a standalone helper with no external callers.
Keep the existing contract and regression checks.
```

`development\dev-mapped-local\oracle.mjs`, outside the actor directory:

```js
import assert from 'node:assert/strict';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const [flag, actorPath] = process.argv.slice(2);
if (flag !== '--actor' || !actorPath) {
  throw new Error('Usage: node oracle.mjs --actor ACTOR_DIRECTORY');
}
const { clampToZero } = await import(pathToFileURL(resolve(actorPath, 'clamp.mjs')).href);
assert.deepEqual([-9, -1, 0, 1, 11].map(clampToZero), [0, 0, 0, 1, 11]);
```

The gold patch swaps the two return expressions: negative values return `0`,
and the final branch returns `value`. This is a small, mapped, multi-line repair,
not merely a test of the current skill's existing known-one-line exception.
The actor's visible regression is retained; the hidden oracle catches a fix
hardcoded to the three visible inputs. Hash and compare the visible regression
file before/after actor work as well as running it, so deleting assertions
cannot count as preservation.

- [ ] **Step 3: Implement the remaining development contracts with explicit oracles.**

Use these assertion contracts, not answer-string matching. The code below
specifies each oracle's required checks; its bindings are defined immediately
after it and are not actor-provided values.

```js
// Typo: exact output and no implementation changes.
assert.equal(readFileSync(readmePath, 'utf8'), 'A successful request returns 200.\n');
assert.equal(sourceBeforeHash, sourceAfterHash);

// Authorization: owner tenant AND an allowed role, never either alone.
assert.equal(canRead({ tenant: 'a', role: 'reader' }, { tenant: 'a' }), true);
assert.equal(canRead({ tenant: 'a', role: 'reader' }, { tenant: 'b' }), false);
assert.equal(canRead({ tenant: 'a', role: 'guest' }, { tenant: 'a' }), false);
assert.equal(canRead({ tenant: 'a', role: 'auditor' }, { tenant: 'a' }), true);
assert.equal(canRead({ tenant: 'a', role: 'admin' }, { tenant: 'a' }), false);

// Shared retry utility: zero is an explicit override; absent is default.
assert.equal(retryDelay({ delayMs: 0 }), 0);
assert.equal(retryDelay({}), 100);
assert.equal(retryDelay({ delayMs: 250 }), 250);

// Cursor integration: empty-string cursor terminates; a repeated cursor errors.
assert.deepEqual(await collectPages(finiteClient), ['a', 'b']);
await assert.rejects(() => collectPages(repeatingClient), /repeated cursor/i);
```

`readmePath`, the before/after source hashes, and the imported functions are
resolved inside each evaluator's `oracle.mjs`, not supplied by the actor.
For cursor tests, define `finiteClient.list(cursor)` as:
undefined -> `{ items: ['a'], nextCursor: 'next' }`;
`'next'` -> `{ items: ['b'], nextCursor: '' }`.
Define `repeatingClient.list()` to always return
`{ items: [], nextCursor: 'same' }`. The fixture starts with termination based
only on `null` and no repeated-cursor guard. Its local vendor-contract document
specifies these semantics and has a recorded source/hash.

The authorization fixture starts with the exact bad expression
`user.tenant === resource.tenant || user.role === 'reader'`.
Its actor-visible `access-contract.md` states that readers and auditors may
read resources in their own tenant; administrators manage configuration and
do not receive this data-reading permission. The task asks to repair access
behavior without spelling out that unusual role rule. The gold expression is
`user.tenant === resource.tenant && ['reader', 'auditor'].includes(user.role)`.
This makes the positive case depend on actual local policy, not merely changing
OR to AND from a familiar-looking expression.
The retry fixture starts with `options.delayMs || 100`, with two actual consumer
files showing immediate and delayed retries.

For mechanical rename, supply a working `rename.mjs` that edits only the named
three files: `count.mjs`, `report.mjs`, and `check.mjs`, replacing the identifier
`countValid` with `countUsable`. The oracle imports the new export, checks both
consumers, and scans those files for remaining old identifier tokens. It also
checks that unrelated files and behavior are unchanged.

For boundary, use a request wrapper with two retry layers: fixing the local
timeout must not double the maximum attempts. The oracle asserts exactly three
total client calls and propagation of the final timeout. For reuse, supply a
current design choosing nullish rather than truthy fallback, exact dependency
hashes, and the caller contract; the oracle asserts `0` is preserved and
`undefined` falls back. Trace grading additionally rejects repeated discovery
or an approval request caused only by loading the skill.

- [ ] **Step 4: Prove every fixture and oracle discriminate.**

For each fixture in a fresh copy:

1. Run the evaluator oracle against the initial actor snapshot: it must fail
   for the intended defect, not a missing dependency or syntax error.
2. Apply its gold patch to that copy, then run the same oracle: it must pass.
3. Restore by creating another fresh copy, not by resetting an actor's results.
4. Preserve the RED/GREEN commands and outputs in fixture-authoring evidence.

Example command:

```powershell
node .\test\fixtures\skill-evaluation\research-before-coding\development\dev-mapped-local\oracle.mjs --actor C:\kai-skill-eval\fixture-check\actor
```

Use Node built-ins only. Syntax-check every oracle and actor `.mjs`. Do not
allow the actor to edit an oracle, the fixture manifest, or its own score.

- [ ] **Step 5: Have a separate evaluator author and seal validation/acceptance.**

Provide that evaluator the spec, scenario contract, and family table, not
candidate text. For each new case require ordinary actor files, a natural task
prompt, an evaluator oracle, a reviewed gold patch, and demonstrated RED/GREEN.
Validation cases are released only during validation. Acceptance files remain
outside the candidate writer's accessible workspace/context until selection.

Seal content with a SHA-256 manifest and an evaluator-held revision. Publish
sanitized acceptance fixtures with the final evidence after selection and
evaluation. If the same agent already saw a holdout, it is not a holdout for
that agent; create fresh cases through the evaluator.

- [ ] **Step 6: Add the four composition families.**

Use separate, exact cases for stale evidence, missing source, explicit invocation,
and pressure. Stale evidence includes a source hash mismatch and a changed API
contract. Missing source removes the one fact necessary to choose safely;
correct behavior is a grounded blocker, not a guessed fix. Explicit invocation
names `research-before-coding` and requires a bounded result. Pressure combines
a deadline, a manager's request to skip checks, and an existing sunk-cost patch;
the correct outcome preserves the decisive check without unrelated ceremony.

Each case's expected terminal state is predeclared: a justified blocker can
pass its task oracle. Do not score all non-edits as failures.

- [ ] **Step 7: Commit fixtures and their integrity evidence.**

Commit public development fixtures and sealed-manifest references as
`test: add discriminating research skill fixtures`. Keep oracle access separate
from actor workspace access. Do not expose sealed content merely to include it
in the candidate author's commit.

## Task 3: Prove isolated host sessions and materialize A/B arms

**Files:** update protocol and campaign environment fields; create sanitized
`evidence\preflight\` records. Runtime copies live outside the checkout.

**Consumes:** frozen source revision, scenario fixtures, native CLI capabilities.

**Produces:** reproducible A/B directory manifests, observed environment inventory,
and a successful evidence-export probe. No candidate text.

- [ ] **Step 1: Create an evaluator-controlled scratch root.**

Use `C:\kai-skill-eval\research-pilot` when available, or an explicitly resolved
operator-approved location outside the Kai checkout. Structure each run as
`runs\<run-id>\actor`, `home`, and `evidence`; keep sealed evaluator files in a
different access-controlled location.

Create directories only when absent. Never invoke `buildAll` from
`pack-preview.mjs` against an arbitrary path: it recursively removes its output
root. Copy the two baseline plugin trees into new arm directories instead.
Do not delete a broad scratch root during cleanup; remove only named run
subdirectories after durable evidence is accepted.

After copying only actor files into a fresh run, initialize its own Git root
and seed commit before launching Copilot:

```powershell
git -C $actor init --quiet
git -C $actor add -- .
git -C $actor -c user.name='Kai Evaluation' -c user.email='eval@invalid' `
  commit --quiet -m 'test: seed synthetic fixture' `
  -m 'Co-authored-by: Copilot <223556219+Copilot@users.noreply.github.com>'
```

`$actor` is the explicitly resolved actor directory in that new run, not the
Kai checkout. It has no remote. Exclude `.git` from fixture-content hashes.
This anchors instruction discovery and provides a baseline for real diff
capture. Preserve `git diff --binary HEAD`, `git status --porcelain=v1`, and
the contents/hashes of untracked outputs; a plain diff alone misses new files.

- [ ] **Step 2: Capture the baseline pack trees and core-byte invariant.**

Materialize the exact source revision using a detached read-only Git worktree
or archive. Copy `plugins\kai-core` and `plugins\kai-engineering` into arm B.
Copy B to A, then apply a reviewed experimental patch to A only.

Arm A removes the target skill's discoverable directory and **only** its
task-specific invocation clauses from callers. Preserve ownership/safety
instructions and unrelated guidance. Inspect `coding-style`'s research
references and the four code-writing callers, including the applied-AI caller.
Do not remove surrounding sentences wholesale with a broad regex.

Record every removed clause and its reason in an `arm-A.patch` artifact.
Core files must have identical byte manifests in A and B. No experimental
ablation is a shipped candidate. Do not run shipping reachability gates against
the intentionally ablated A pack and then "repair" it with replacement advice.

- [ ] **Step 3: Verify actual instruction isolation.**

`COPILOT_HOME` isolates CLI configuration/state; it does not establish that
every `$HOME\.agents`, global instruction, IDE, hook, or environment source is
isolated. `--plugin-dir` loads local plugins in addition to other discoverable
configuration; it is not an exclusive allowlist.

Open a fresh disposable profile with the intended packs, then inspect `/env`,
`/skills`, `/instructions`, and `/plugin list`. Preserve host-generated inventory,
not an agent's assurance that it is isolated.

If unrelated process skills still appear, use a genuinely clean OS profile or
isolated machine and repeat. Do not rename/delete the operator's installed
skills, falsify HOME values and assume success, or use a broad instruction
disable flag that silently removes safety rules from only one arm.

Authentication is established through the host's login flow or an approved
existing process credential. Never copy the operator's whole CLI home, dump
environment variables, or commit credential files.

- [ ] **Step 4: Probe one fresh run and native evidence exports.**

The following invocation uses flags confirmed by CLI `1.0.83` help during
planning. Reconfirm at execution. Set `$runRoot`, `$armRoot`, and `$prompt`
from the selected campaign record and actor-only task; reject nonexistent or
out-of-scope paths before launching.

```powershell
$env:COPILOT_HOME = Join-Path $runRoot 'home'
$actor = Join-Path $runRoot 'actor'
$evidence = Join-Path $runRoot 'evidence'
copilot -C $actor `
  --plugin-dir (Join-Path $armRoot 'kai-core') `
  --plugin-dir (Join-Path $armRoot 'kai-engineering') `
  --model gpt-6-astra --effort high --context default `
  --no-auto-update --no-remote --no-remote-export `
  --disable-builtin-mcps --disallow-temp-dir `
  --max-ai-credits 30 --output-format json --stream off `
  --usage-output-file (Join-Path $evidence 'usage.json') `
  --share (Join-Path $evidence 'session.md') `
  -p $prompt `
  --allow-tool 'write' --allow-tool 'shell(node:*)' `
  --allow-tool 'shell(git diff:*)' --allow-tool 'shell(git status:*)' `
  1> (Join-Path $evidence 'events.jsonl') `
  2> (Join-Path $evidence 'stderr.txt')
$exitCode = $LASTEXITCODE
```

Use this in a fresh process so environment overrides cannot persist into the
operator's session. Do not use `--allow-all`, `--allow-all-paths`, `--no-ask-user`,
session resume, autopilot, or a broad source checkout as an added directory.
Tool approvals must be identical between arms and stay visible in evidence.

`node` can perform filesystem I/O: CLI path permissions are not an OS sandbox.
Acceptance oracles need actual access separation. Run only synthetic fixtures
under the dedicated profile, not private customer code.

If prompt mode rejects the explicit allowlist or cannot expose a required
capability, record that preflight failure and use matched interactive sessions
with a fixed approval policy. Do not broaden permissions automatically.

- [ ] **Step 5: Confirm observability and timeout handling.**

Inspect the real JSONL/usage shape before mapping fields. Preserve native
events, output, exit status, actor diff, loaded-skill evidence, and elapsed
time. Normalize available usage to the stable record fields; missing cache or
credit data remains null with an explanation. Never invent native JSON keys.

Prove that a skill body read through file tools is visible. If full tool inputs
are unavailable, record loaded-context measurement as unavailable; do not
infer it from the final response. For claims about activation, lack of a usable
load trace is a blocker.

Use the execution host's tracked process timeout for 600 seconds; terminate
only that process tree by its recorded PID/session ID. Preserve partial events
and write `timed-out`, including consumed credits. Do not rerun invisibly.

- [ ] **Step 6: Commit the environment report and stop on contamination.**

Commit sanitized manifests, actual version/flag observations, and the preflight
decision as `docs: record research pilot isolation preflight`. If isolation or
evidence capture fails, mark the campaign inconclusive and stop before Task 4.

## Task 4: Establish the A/B baseline before proposing wording

**Files:** populate campaign schedule, run evidence, and `baseline.md`.

**Consumes:** proven A/B environments, eight development cases, fixed rubrics.

**Produces:** observed failure excerpts, per-case scores/costs, and a recorded
decision to retain, investigate, narrow, or stop.

- [ ] **Step 1: Freeze grading and the first 20-run schedule.**

Schedule mapped-local and authorization, A/B, five repetitions each. Alternate
AB and BA order between repetitions. Keep model/effort/context, fixtures,
permissions, prompt wording, and unrelated guidance identical.

The skip case passes only with correct task/regression results and no full
target process. The required case passes only if the decisive access contract
is inspected and the correct implementation preserves the boundary. An
unnecessary proposal is distinct from an externally required approval.

- [ ] **Step 2: Execute one scheduled run using Task 3's invocation.**

Create a fresh actor copy and fresh home/context; record its ID before launch.
After completion, run the external oracle, preserve actor output/diff, and
have a separate reviewer adjudicate observable actions. The reviewer is given
an opaque arm label, not "improved candidate." Repeat this one-run action for
the 20 scheduled IDs; do not turn it into an unrestricted parallel fleet.

- [ ] **Step 3: Reconcile records and examine actual discrimination.**

```powershell
node .\test\skill-evaluation\check-records.mjs `
  .\docs\reference\skill-evaluation\research-before-coding\campaign.json `
  .\docs\reference\skill-evaluation\research-before-coding\evidence\runs
```

The checker must find all scheduled IDs. Read every failure and disputed score.
Record emitted explanations verbatim when useful, without asking for hidden
reasoning. If both arms fail identically, distinguish fixture/tool failure
from a skill problem.

- [ ] **Step 4: Decide whether the first paid stage merits expansion.**

Write observed quality, unnecessary process, activation, credit consumption,
and confidence limits to `baseline.md`. Obtain operator approval to spend the
remaining campaign budget before the next 60 development runs. This is a
substantial-cost checkpoint, not an approval gate for every minor task.

If no target failure or lack of benefit can be demonstrated, stop with
`keep`/`inconclusive`; do not invent pressure until a preferred diagnosis wins.
If the evidence is relevant, finish the six remaining development families
with A/B and five repetitions each.

- [ ] **Step 5: Classify the failure and define the candidate hypothesis.**

| Observed failure | Allowed first change |
| --- | --- |
| Trigger loads the whole process on clear negatives | Observable positive/negative entry conditions |
| Correct skill, bloated output | Positive recipe for the smallest useful result |
| Required fact is omitted | Required evidence slot tied to that decision |
| Necessary work skipped under pressure | Specific prohibition/counter addressing the emitted rationalization |
| No-guidance works; current guidance harms | Narrow/remove the harmful part rather than add more instructions |
| Caller mandates loading despite a correct skill gate | Minimal caller-seam correction, separately attributed |

The hypothesis names exact failing run IDs, the source clause responsible,
the expected change in behavior, and guardrails. No prewritten candidate body
is included in this plan because doing so would violate this evidence gate.

- [ ] **Step 6: Commit the baseline record.**

Commit as `docs: record research skill baseline and change hypothesis`.
Mark unexecuted runs and unavailable metrics plainly. If the decision is no
change or inconclusive, continue directly to Task 7's documentation-only path.

## Task 5: Author and validate the smallest supported candidate

**Files:** conditional research skill edit; explicitly justified caller seams;
`candidates.md`, campaign and evidence records.

**Consumes:** Task 4's observed RED and fixed validation fixtures.

**Produces:** one selected frozen candidate, or a stopped/inconclusive campaign.

- [ ] **Step 1: Load writing-skills and create its per-item execution checklist.**

Apply its RED/GREEN/REFACTOR checklist to this one skill. Baseline evidence
must precede edits. Do not treat an existing source lint as a substitute for
the behavioral failure. Reference-only edits use retrieval tests; pressure
tests apply to discipline failures.

- [ ] **Step 2: Edit only the clauses justified by observed failures.**

Use trigger-only frontmatter wording, observable uncertainty/risk predicates,
explicit evidence reuse, and a bounded exit. Keep supported invocation
metadata and necessary ownership/authority safeguards. Do not add a fixed
line-count threshold, fixed file-reading quota, universal proposal requirement,
or a new mandatory router.

For a caller fault, alter only its research-routing clause. Keep the required
`Apply`/`Invoke` form where the existing route validator expects it, and test
that the semantic predicate is honored. If `coding-style`'s absent
`single-responsibility` reference is hit, reproduce that unresolved invocation
before removing the false reference; retain the existing composition principle.

Record any necessary caller change as part of the candidate treatment. Do not
credit the skill body alone for a joint body+caller improvement.

- [ ] **Step 3: Materialize C and freeze its hash before running it.**

Copy the same two source packs into a fresh C directory and apply the exact
candidate diff. Reuse no sessions or actor workspaces. Preserve A/B frozen
source and core-byte manifests. Capture candidate ID, diff, source revision,
description/body hashes, and any changed caller hashes.

- [ ] **Step 4: Run C on the eight development cases, five reps each.**

Compare with the matched A/B development records. Inspect every flagged result
and variance. If host/model/configuration changed, cached A/B comparisons are
invalid: rerun controls within the budget or stop and rebaseline.

- [ ] **Step 5: Run independent validation, A/B/C, five reps per eight cases.**

The validation evaluator releases only ordinary task inputs to actors. Run the
same correctness, critical-risk, ceremony, unsupported-claim, and cost rubric.
Select on validation, never acceptance. Preserve failed candidates and reasons.

Repeat Steps 2-5 only for a newly observed failure and within three candidate
revisions and the campaign cap. Repetition counts and case selection cannot be
changed to make a weak result look strong. Stop at unresolved variance.

- [ ] **Step 6: Commit the candidate or record its rejection.**

Accepted candidate source is not yet a release claim. Commit source plus its
evidence as `fix: scope research guidance to demonstrated uncertainty` only
when the observed change is a fix; use an accurate message for a different
disposition. Do not publish an intermediate behavior commit as a PR without
Task 7's same-PR release metadata.

If no candidate survives, keep rejected variants as diffs/evidence rather than
shipping them. Preserve unrelated working-tree changes; revert only the
pilot's own rejected edits with explicit targeted patches.

## Task 6: Run frozen acceptance, content, and integration gates

**Files:** final acceptance fixtures after selection; evidence; scorecard.

**Consumes:** one frozen candidate and evaluator-sealed acceptance fixtures.

**Produces:** a revision-bound accepted or failed result, with no test-set tuning.

- [ ] **Step 1: Release the eight acceptance tasks to fresh actors.**

The evaluator checks the previously sealed hashes before starting. Run all
eight cases in A/B/C with five fresh repetitions: 120 runs. Ordinary task inputs
are available to the actor; grading expectations, gold patches, prior results,
and other arms are not.

Require spec section 9's gates: no critical/safety loss, correct negative cases
without full research ceremony, required investigation on positives, no lower
observed task pass count than B per stratum, and observed reduction of the
reproduced overloading behavior. Do not make missing cost data into savings.

- [ ] **Step 2: Test content separately from discovery.**

Use one held-out local/skip case and one investigation-required case. In this
diagnostic condition, intentionally provide the body in B/C and no target body
in A, with otherwise identical prompts. Run five repetitions per arm: 30 runs.
Forcing content is expected here and is not scored as false activation.

This test answers whether a loaded skill handles a small task proportionately;
it does not prove automatic selection works. Report it separately.

- [ ] **Step 3: Exercise actual caller integration on the four extra families.**

Use the stale, missing-source, explicit-invocation, and pressure fixtures from
Task 2. Assign callers in `cases.json` before runs: backend for stale, applied-AI
for missing-source, frontend for explicit invocation, infra for pressure.
Choose matching fixture domains so the selected role is legitimate.

Add `--agent` with the **actual qualified ID shown by the host roster** to
Task 3's invocation. Do not guess the prefix or substitute a generic agent.
Run A/B/C and five reps each: 60 runs. Preserve caller body hashes.

Audit all caller seams in source. Any changed caller not covered by those runs
needs a matching integration case within the budget; otherwise the change is
not eligible for promotion.

For a defect involving both skill and caller, add a diagnostic candidate with
the body change but the old caller to distinguish the source of the effect.
This extra diagnostic consumes the declared budget; it is not silently folded
into C's scores.

- [ ] **Step 4: Test coexistence without weakening outside instructions.**

Install the exact recorded Superpowers version in a separate disposable
profile, never the primary A/B/C profile. Run mapped-local and authorization
with five reps per arm: 30 runs. Keep Superpowers constant across the arms.

Report this as an interference/robustness test, not an uncontaminated no-guidance
causal comparison. If another process skill mandates approval, preserve it and
do not score that required interruption as research-skill overhead.

- [ ] **Step 5: Apply an independent final decision.**

The reviewer checks trace evidence, executable outcomes, missing runs,
per-stratum differences, observed risk, variance, and total cost. A checker exit
0 is not acceptance. The actor's "done" is not acceptance.

Failure on held-out cases blocks promotion. Preserve it as a regression case,
do not edit C in response and rerun the same "holdout." A further attempt needs
new acceptance cases and a newly authorized campaign budget.

- [ ] **Step 6: Commit sanitized evidence and disposition.**

Commit as `test: record frozen research skill acceptance evidence`. Include
failed, blocked, and timed-out rows. Keep conclusions model/host-specific;
do not claim cross-model performance without another model's campaign.

## Task 7: Publish the pilot result and prepare only justified release changes

**Files:** scorecard, protocol, inventory, `test\README.md`; conditional release
metadata and generated outputs listed below.

**Consumes:** all executed phase records, source/caller hashes, independent verdict.

**Produces:** a reusable pilot result, and either no shipped change or a
release-complete, locally committed change ready for the operator's next action.

- [ ] **Step 1: Reconcile the complete campaign.**

Run the record checker and inspect every scheduled ID. Make the scorecard show
raw numerators/denominators by family/arm, critical checks, incorrect activation,
unnecessary actions, unsupported claims, duration, and actual usage.

Separate metadata size, loaded bodies, references, duplicate loads, final-answer
size, total input/output usage, cached input, credits, and offline evaluation
cost. Record native metric definitions; do not double-count cached input or
claim fewer solver steps prove lower cost.

Write one disposition: keep, narrow, split, merge, automate, retire-proposal,
or inconclusive. A retirement proposal is not authorization to remove the
public entry point in this pilot.

- [ ] **Step 2: Complete the reusable handoff.**

Update all 15 inventory rows: pilot evidence only for research and any actually
tested seams; the other skills remain `unevaluated`. Name the next candidate
skill based on measured leverage, not alphabetical order.

Document how to reuse the protocol for `coding-style`/`pr-sizing`, reference
retrieval for diagrams/onboarding, and individual plus composed review lenses.
Retain the agent-debt list separately. Do not call this a completed
engineering-pack improvement.

- [ ] **Step 3: If no candidate is accepted, finish docs/test-only.**

Keep shipped source unchanged. Commit the honest keep/inconclusive result.
No version bump, release generation, or claim of reduced runtime cost follows
from a source audit alone.

- [ ] **Step 4: If a behavior fix is accepted, prepare coordinated metadata.**

At baseline version `7.0.0`, a compatible correction to activation/wording uses
`7.0.1`. If main advanced, calculate the next patch from its actual version.
Do not use that patch policy for public removal/rename or a new feature.
If integrating newer main changes the evaluated prompts, dependencies, or
caller behavior, rebaseline affected experiments; metadata-only movement does
not justify silently reusing evidence for different behavior.

```powershell
npm version 7.0.1 --no-git-tag-version
```

Then set `plugin.json` and `.github\plugin\marketplace.json` to the same version,
including `metadata.version` and every `plugins[]` entry. Update `CHANGELOG.md`
with a dated section and compare link, and refresh the README Status stamp.
Do not install dependencies for version-only changes.

```powershell
npm run pack-preview -- --write
npm run docs:generate
```

Review generated changes instead of hand-editing pack manifests/locks/scripts.
If discovery descriptions change, commit the refreshed catalog. If the
invocation surface changes, run `npm run host-contract:update` and review the
inventory diff. No new skill/category is expected in this pilot.

- [ ] **Step 5: Run the targeted and required repository gates.**

```powershell
node .\test\skill-evaluation\records-self-test.mjs
node .\scripts\host-contract.mjs --self-test
node .\scripts\pack-preview.mjs --check
npm test
git diff --check
```

Compare failures with the frozen baseline before attributing them to this work.
Known deferred CI/policy issues are not permission to suppress gates or claim
release readiness. If an unrelated baseline failure blocks the required release
gate, document it and stop the release handoff rather than repairing the entire
prior refactor under this pilot.

Code changes to the record checker use its targeted self-tests. Documentation
alone does not justify a full-suite run. The full suite above is the repository
requirement for the accepted shipped behavior change.

- [ ] **Step 6: Commit exact release-complete files and hand off.**

Commit the accepted source, evidence, and required release metadata locally.
Record the exact source/caller revision the behavioral evidence tested and the
final metadata-only revision; prove shipped prompt bytes did not change between
them. Any intervening behavior edit invalidates that equivalence.

The operator receives the scorecard, disposition, measured limits, remaining
unverified surfaces, and one next action. No push, PR, merge, or publication is
implicit.

## Plan self-review / coverage map

| Spec obligation | Plan coverage |
| --- | --- |
| All 15 skill contracts and factual weaknesses | Task 1 inventory; Task 7 partial-campaign handoff |
| Research pilot based on uncertainty/risk/freshness | Tasks 2, 4, and 5 |
| Three arms; discovery/content/composition separate | Shared interfaces; Tasks 3, 4, and 6 |
| Realistic fresh contexts, baseline before wording | Tasks 3-5 |
| Six core families plus boundary and reuse in every split | Task 2; 8-case development/validation/acceptance schedule |
| Stale, missing, explicit, and pressure variations | Task 2 extra cases; Task 6 integration |
| Five repetitions, at most three candidate revisions | Budget; Tasks 4-6 |
| Independent oracle and no acceptance leakage | Tasks 2 and 6; access-separation preflight |
| Rejected changes, failures, variance, absent metrics retained | Record contract; Tasks 4-7 |
| No safety/correctness trade for brevity | Global constraints; fixed rubrics; Task 6 |
| Real caller-seam limits without agent redesign | File map; Tasks 5-6 |
| Existing validator reuse and no new runtime service | Tasks 1 and 7; helpers live under test |
| Semver, generation, catalog, and existing gates | Task 7 conditional release path |
| Reuse elsewhere without pretending full-pack completion | Task 7 |

## Execution handoff

Recommended execution is **subagent-driven**, with a fresh implementer per task
and separate review of specification compliance and implementation quality.
The fixture/acceptance evaluator must stay separate from the candidate writer;
do not send sealed holdouts in an implementer's briefing.

Inline execution with `executing-plans` is also possible, but independent
acceptance authoring/judgment still needs a separate evaluator. Neither option
permits paid runs before the environment and declared budget gates, or skill
edits before observed baseline evidence.
