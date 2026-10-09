# Kai development system simplification

**Status:** Approved; implemented for the prepared 20.0.0 release
**Date:** 2026-10-08  
**Scope:** Kai contributor workflow, validation, tests, generated artifacts,
release automation, workspace compatibility, and active documentation

## Decision

Kai will use a development system proportionate to a three-package repository
of agents, skills, and small native-JavaScript tools.

The system will:

- support only the current workspace schema;
- reset and re-onboard old workspaces instead of migrating them;
- keep one executable authority for each product fact;
- use local, task-specific validation during development;
- run no pull-request or push CI;
- run one lean nightly workflow on Linux and one Node version;
- release automatically on Monday only from the exact SHA validated by the
  nightly workflow;
- use Superpowers selectively rather than for every repository edit;
- let the operator choose strong, lean, manual, no, or custom validation when
  Superpowers is used;
- retain behavioral tests for product-critical guarantees and real defects;
- delete duplicate schemas, prose validators, exhaustive historical
  permutations, and superseded process documentation.

This is a clean break. Compatibility machinery that exists only to preserve
older Kai installations or workspace schemas is not part of the target.

## Context

Schema 5 established the intended product:

- `kai-core`, `kai-engineering`, and `kai-creative` are the only shipped
  packages;
- `.kai/` is private operational state;
- `docs/kai/` is accepted, Git-suitable publication;
- Direction is operator-owned;
- Epic, Feature, Requirement, and Task define coordinated work;
- SQLite is the authority for coordinated state;
- generated consumer scripts run without checkout dependencies.

The development system grew beyond that product's scale:

- local `npm test` contains 42 serial commands and takes about 20 minutes on
  Windows;
- the required Windows CI leg takes 11 to 12 minutes;
- `tools/pack-preview.mjs --self-test` contains 246 assertions;
- the schema-5 pull request changed 223 files, with generated scripts and tests
  producing more changed lines than runtime source;
- publication, workspace, coordination, package, generated-output, and release
  facts are repeated across JavaScript, Markdown, fixtures, manifests, tests,
  and generated output;
- ordinary English is validated as though it were an executable schema;
- historical migration and recovery permutations are maintained even though
  Kai is an internally controlled plugin that can be reinstalled.

The repository needs strong product boundaries, not exhaustive process
machinery.

## Goals

1. Make a contract change require one authoritative edit and a small set of
   behavioral checks.
2. Keep local feedback under one minute for routine work.
3. Keep the complete nightly workflow under five minutes on Linux.
4. Eliminate per-PR CI consumption.
5. Preserve current product privacy, authority, package, and consumer
   guarantees.
6. Make validation proportional to the task and explicitly agreed with the
   operator.
7. Keep only active documentation and current contracts in the working tree.

## Non-goals

- Supporting schema 1, 2, 3, or 4 workspaces.
- Migrating records from an older `.kai/` database.
- Supporting coexistence with retired Kai package layouts.
- Proving every historical defect permutation on every change.
- Maintaining Linux and Windows CI parity.
- Automatically inferring whether prose is semantically correct.
- Replacing Superpowers with another workflow framework.
- Automatically choosing semantic version severity.

## Product guarantees to retain

The simplification must retain:

- the three-package dependency boundary: Core has no department dependency,
  and Engineering and Creative depend only on Core;
- `.kai/` privacy and `docs/kai/` accepted-publication separation;
- traversal, containment, and alias safety in the current implementation;
- SQLite authority, transaction integrity, optimistic versions, leases, and
  subject isolation;
- Direction ownership and exact revision binding;
- Epic, Feature, Requirement, and Task authority;
- clean consumer installation without checkout `node_modules`;
- generated entrypoints that execute from installed packages;
- pack-owned publication vocabulary;
- direct work remaining independent of Kai coordination;
- regression tests for defects that represent distinct current failure
  classes.

The project accepts that an untested platform-specific defect may escape. The
response is to file an issue, fix it, and add one focused regression when the
defect justifies permanent coverage.

## Workspace compatibility policy

### Current schema only

The installed plugin reads and writes only the current workspace schema. It
may read an old manifest's schema number to reject it, but it does not decode
historical records or inspect, migrate, repair, or write an old database.

When Kai encounters an unsupported `.kai/` manifest or database, it stops with
clear guidance to re-onboard the workspace. It does not attempt partial
recovery.

### Re-onboarding instead of migration

Kai will ship one `kai-core-workspace-reonboard` skill. The skill is an
operator-controlled reset procedure, not a data converter.

It performs this contract:

1. Resolve the project root and confirm that the operator intends to reset Kai
   private state.
2. Preserve `docs/kai/`, including Direction and accepted publications.
3. Add `/.kai-retired-*/` to Kai's managed `.gitignore` region when it is not
   already covered.
4. Rename the existing `.kai/` directory to an ignored, timestamped backup
   such as `.kai-retired-20261008T170000Z/`.
5. Confirm that the backup is outside the new `.kai/` path, is ignored by Git,
   and contains no tracked files.
6. Direct the operator to uninstall retired Kai packages and install the three
   current packages when package state is uncertain.
7. Run current workspace onboarding.
8. Create current private state lazily, only when coordinated work requires
   it.
9. Never import records from the retired SQLite database.
10. Leave deletion of the retired backup to the operator after inspection.

The skill must not stage, commit, or publish private state.

### Compatibility code to remove

Remove:

- `src/core/lib/coordination-runtime/migration*.mjs`;
- historical schema readers and write refusals that exist only to distinguish
  old schema versions;
- legacy workspace path constants and aliases;
- old-schema branches in workspace doctor, coordination CLI, activity, status,
  observation, context, reports, and host composition;
- `workspace-doctor --migration-check` and retired-package migration checks;
- `test/coordination-migration-self-test.mjs`;
- `test/coordination-schema5-migration-self-test.mjs`;
- old-schema fixtures and migration helpers;
- migration, rollback, abandon, recovery-journal, and historical-schema
  documentation.

Package installation and workspace re-onboarding replace these paths.

## Sources of authority

One fact has one edited authority. Generated copies are outputs, not additional
authorities.

### Workspace contract

`src/core/lib/workspace-layout.mjs` owns one structured
`WORKSPACE_CONTRACT` export containing:

- current schema version;
- `.kai/`, `docs/kai/`, Direction, and SQLite locations;
- manifest fields;
- current pack namespaces;
- placement and lifecycle names;
- typed private and publication path grammar inputs.

Workspace resolution, doctor, activity, observation, reports, tests, and
generated consumers import this contract. They do not repeat schema or path
literals.

`src/core/lib/workspace-path-safety.mjs` remains a separate security boundary
for current path containment, traversal, link, alias, and lifecycle checks.

### Coordination contract

One coordination registry owns:

- record and command kinds;
- states and transitions;
- relationships;
- command-to-subject mapping;
- command authority policy;
- allowed mutations;
- validator and handler registration keys.

Focused modules continue to own behavior:

- store owns SQLite transactions and snapshots;
- engines own command execution;
- evidence owns proof, review, and acceptance behavior;
- views own context, status, planning, and report data;
- host and CLI own adapters.

The registry consolidates declarations currently distributed across
`contract-primitives.mjs`, `contract.mjs`, `hierarchy-contract.mjs`,
`task-contract.mjs`, engine maps, evidence maps, and host maps. It must not
become a second runtime or a giant implementation module.

### Publication vocabulary

Each package owns one structured publication declaration:

```text
plugins/<pack>/publication.json
```

It contains the package's types, subtypes, formats, private/public placement,
and publication rules.

The build renders the declaration's reference table into the package's
publication skill and derives publication fixtures from the same declaration.
Narrative Markdown explains how to use the contract but is not parsed as the
contract.

### Package ownership

The three package directories are the ownership boundary. Agents and skills
are discovered from their location rather than repeated in a frozen active
roster.

Keep a small declaration for:

- `core`;
- `engineering`;
- `creative`;
- department-to-Core dependency;
- published package names.

Incubated directories remain outside active discovery and may not contain a
package manifest.

### Release version

`package.json` is the only edited version source. The build writes version
values into:

- root `plugin.json`;
- package manifests;
- marketplace metadata and entries;
- generated package metadata.

`CHANGELOG.md` remains manually authored. README has no enforced version
stamp.

## Build boundary

Use two commands:

```text
npm run build
npm run build:check
```

`build`:

1. validates structured source contracts;
2. renders publication and reference sections;
3. generates release metadata from `package.json`;
4. bundles consumer scripts;
5. writes generated outputs.

`build:check` performs the same calculation without modifying the tree and
fails on generated drift.

Generated scripts use stable names. Prefer one stable shared runtime module
with thin named entrypoints over content-hashed chunk names. Generated files
remain committed because marketplace installation consumes the package trees
without running a build.

The clean-consumer test remains the proof that installed packages need no
checkout dependencies.

## Repository onboarding and `AGENTS.md`

Plugin installation itself cannot modify the consumer repository. The first
workspace onboarding performs the repository-instruction step with explicit
operator consent.

Onboarding must:

1. Resolve the repository root.
2. Offer once to install Kai repository instructions.
3. If `AGENTS.md` exists, preserve all user-authored content and replace only
   Kai's marked managed region.
4. If `AGENTS.md` does not exist, create it with the managed region.
5. Never stage or commit `AGENTS.md` without separate authorization.

Kai ships one canonical managed block. It combines:

- communication style;
- the fast-ship development profile;
- selective Superpowers usage;
- the task-level validation agreement.

Replace the communication-only canonical block with one repository-instruction
block rather than adding overlapping managed regions.

The block is natural-language instruction for an agent. JavaScript validators
must not parse its wording as a schema. Validation may check only that the
canonical marked block can be installed without overwriting surrounding user
content.

## Fast-ship development profile

Kai's repository default is:

```md
## Development profile: fast-ship

- Use TDD locally for runtime behavior and real defect regressions.
- Before handoff, run the targeted test and the fast repository suite.
- Use the full Superpowers workflow only for architecture, risky cross-cutting
  refactors, uncertain defects, or explicit operator requests.
- Do not invoke workflow frameworks for prose, metadata, generated refreshes,
  or obvious bounded edits.
- CI provides nightly and release confidence, not per-PR approval.
```

This repository instruction overrides Superpowers' automatic invocation rule
for routine Kai work.

README explains the profile and points to `AGENTS.md`. `AGENTS.md` is the
binding contributor instruction because the host loads it; README alone is
not sufficient.

Consumer onboarding may install the same default. A repository can edit its
own user-authored instructions to choose another process. Kai does not validate
the repository's methodology choice.

## Human validation agreement

Whenever Superpowers is used, the design approval must include one explicit
human validation choice before an implementation plan is written.

### Validation levels

| Level | Required development evidence | PR or handoff statement |
| --- | --- | --- |
| Strong | TDD for changed logic, focused unit tests, relevant integration tests, build and clean-consumer checks | Tests added or updated; commands and results listed |
| Lean | TDD for changed logic, targeted test, fast smoke suite, build check only when relevant | Targeted evidence listed |
| Manual | Named manual scenarios with observed outcomes | Manual evidence and untested areas listed |
| None | No validation requested | Explicitly marked unverified; no passing or correctness claim |
| Custom | Exact operator-defined boundary | Exact agreed evidence and omissions listed |

The fast-ship default is **Lean**. Architecture and risky runtime changes
default to **Strong**, but the operator may select any level.

The choice is task-specific. It is not inferred permanently from the
repository profile.

The choice is recorded as natural language in the approved design or plan:

```md
## Validation agreement

Level: Manual

Evidence:
- Re-onboard a temporary repository with no AGENTS.md.
- Confirm AGENTS.md is created without being staged.
- Confirm existing user-authored AGENTS.md content is preserved.

Not verified:
- Windows behavior.
```

No validator enforces the wording or level. The final handoff and PR
description, when a PR is used, report the same agreement and actual evidence.

Manual validation is valid when deterministic tests would add little value,
including instruction quality, onboarding interaction, documentation,
generated presentation, and experiential flows.

Selecting `None` is valid. The agent may complete the change but must describe
it as unverified.

## Test strategy

### Local fast suite

`npm test` is the normal repository loop and must complete within 60 seconds
on the primary development machine.

It retains representative coverage for:

- current workspace layout and privacy;
- Direction parsing and hashing;
- current path containment and traversal;
- SQLite store, transactions, versions, and subject isolation;
- authority and lease behavior;
- one canonical Epic-to-Task lifecycle;
- one stale-Direction refusal;
- one conflicting-evidence refusal;
- package ownership, collision, and partial installation;
- generated consumer execution without checkout dependencies;
- syntax, frontmatter, references, and tool allowlists.

Behavior changes use a focused red/green test before `npm test`. Documentation,
metadata, generated refreshes, and mechanical edits use only the validation
agreed for the task.

### No pull-request CI

Remove `pull_request` and `push` validation triggers. Pull requests have no
required test status.

Branch protection may continue to require resolved conversations. It must not
require a per-PR workflow that no longer runs.

Local evidence in the handoff or PR description replaces automated per-PR
validation.

### Nightly Linux workflow

Run one scheduled workflow on Linux with Node 24:

```text
npm ci
npm test
npm run build:check
npm run consumer-install:self-test
npm run release-readiness
```

Schedule:

- every day at 05:00 UTC;
- manual dispatch remains available;
- no operating-system or Node-version matrix;
- target wall time is five minutes or less.

Nightly failures block the next automatic release but do not retroactively
block merged work.

### Automatic Monday release

Run the release workflow every Monday at 08:00 UTC.

It releases only when:

1. `main` differs from the latest release tag;
2. the latest nightly succeeded for the exact current `main` SHA;
3. `package.json` contains a version with no matching tag;
4. `CHANGELOG.md` contains the matching version section and comparison link;
5. generated output was clean in that nightly result.

When all conditions hold, the workflow creates tag `vX.Y.Z` and the matching
GitHub release from the changelog entry.

If `main` changes after the nightly, the release skips. If the current version
is already tagged, the release skips. A behavior-sensitive change without a
new version fails nightly release readiness; documentation-only changes may
remain unreleased.

The release workflow reuses the exact green-nightly result and does not rerun a
platform matrix.

## Test reduction

### Numeric targets

- test entrypoints: from about 48 to at most 15;
- test source: from about 28,000 lines to at most 8,000;
- pack-preview assertions: from 246 to at most 30;
- local loop: from about 20 minutes to at most 60 seconds;
- required PR validation: from 11 to 12 minutes to none;
- nightly Linux workflow: at most five minutes.

### Retain

Keep one focused regression for each distinct current defect class involving:

- package ownership or missing Core;
- private/public path escape;
- SQLite cross-subject leakage;
- unauthorized state transition;
- stale Direction;
- conflicting current evidence;
- generated import closure;
- clean consumer execution;
- generated drift.

Retain parser non-vacuity and one negative case for every structured declaration
that could otherwise accept an empty corpus.

### Consolidate

Consolidate:

- workspace layout, privacy, and Direction tests into a current-workspace
  contract suite;
- store, authority, and canonical lifecycle tests into a coordination core
  suite;
- package partition, collision, partial-install, version, generation, and
  consumer checks behind one pack/build boundary;
- shared temporary repository, SQLite, and generated-consumer fixtures;
- local and nightly command definitions in `package.json`, with workflows
  invoking those scripts rather than duplicating command lists.

### Delete

Delete:

- migration and historical-schema suites;
- wording, synonym, retired-noun, and sentence-adjacency tests;
- exhaustive report-rendering permutations;
- evidence permutations that prove the same authority rule;
- repeated command behavior through engine, CLI, context, status, and report
  when one behavioral boundary suffices;
- mutation cases for metadata that the build generates;
- full Node and operating-system matrices;
- commit-email policy tests;
- release-guard self-tests after release readiness has direct focused tests;
- fixtures for schemas and package layouts that current code no longer reads;
- browser and demo permutations that have no current product defect or release
  boundary to protect.

The implementation plan must map every existing test file to retain,
consolidate, or delete before editing the suite.

## Prose and policy validation

Documentation explains contracts. It is not an executable schema.

Remove validator functions and associated mutations that compile ordinary
English, including:

- active workspace language scans;
- Markdown coordination-authority combinations;
- Direction, Epic, Chief-of-Staff, stewardship, web-output, and direct-mode
  paragraph semantics;
- synonym matching;
- exact refusal prose beyond a small structured token when a token is a real
  host contract;
- immediate route sentence adjacency;
- retired vocabulary scans across explanatory documents.

Retain structural checks for:

- valid frontmatter;
- unique IDs;
- resolvable agent, skill, and script references;
- declared tool allowlists;
- package-local ownership;
- no forbidden cross-package dependency;
- one positive publication entrypoint for each durable producer;
- no direct bypass of the publication entrypoint;
- generated freshness.

Negative `durable-output-producer: false` metadata is removed. Absence means
non-producer.

## Documentation architecture

All active durable documentation lives under `docs/`, except root README,
CHANGELOG, and contributor `AGENTS.md`.

The target active set is:

```text
README.md
CHANGELOG.md
docs/
|-- architecture.md
|-- workspaces.md
|-- development-process.md
|-- designs/
|   `-- development-system-simplification.md
`-- reference/
    |-- plugin-structure.md
    `-- agents-and-skills.md
```

`docs/kai/` continues to demonstrate the product's accepted-publication model.
Keep current Direction and accepted assets that remain authoritative. Merge
still-current decisions into active architecture documentation before deleting
superseded decision files.

Delete:

- `.superpowers/` task reports and session artifacts;
- `docs/superpowers/plans/`;
- superseded schema-3 and schema-4 decisions;
- obsolete implementation plans;
- duplicated coordination acceptance documents;
- retired package and migration instructions;
- proposals replaced by this approved design;
- generated or historical reports with no current operational use.

Git history is the archive. Deprecated files do not remain in the active tree
solely to preserve history.

## Superpowers and methodology

Keep Superpowers installed and unchanged outside this repository. Kai's loaded
`AGENTS.md` instructions limit its use inside this repository.

Use the full Superpowers process for:

- architecture;
- contract or schema changes;
- risky cross-cutting refactors;
- defects whose cause is uncertain;
- tasks where the operator explicitly requests it.

Do not require it for:

- prose edits;
- metadata;
- generated refreshes;
- obvious bounded changes;
- mechanical cleanup.

TDD remains the preferred local method for runtime behavior and real defect
regressions. It is not mandatory for every file edit, and it does not require
running the entire historical suite before shipping.

Do not replace Superpowers with GSD during this simplification. GSD's
fast/quick/full tiers and opt-in TDD are useful ideas, but adopting another
large orchestration framework would add an unmeasured process and artifact
surface before Kai's own duplication is removed.

## Release metadata and contributor policy

Remove README version-stamp enforcement and commit-email checks from product
validation.

Release readiness checks only product release facts:

- version is valid and unreleased when behavior changed;
- changelog section and comparison link exist;
- generated metadata matches `package.json`;
- the nightly result belongs to the release SHA.

Repository policy that does not affect installed product correctness must not
be embedded in the product validation chain.

## Delivery phases

The implementation plan will decompose this design into independently
reviewable phases. The required order is:

1. Add the fast-ship and validation-agreement contributor instructions.
2. Replace PR CI with the Linux nightly and guarded Monday release schedule.
3. Establish lean package scripts and record the initial timing baseline.
4. Remove legacy workspace, package migration, and historical-schema code.
5. Add the re-onboarding skill and current-schema refusal guidance.
6. Reduce and consolidate tests.
7. Remove prose and duplicate policy validators.
8. Consolidate workspace, coordination, publication, package, build, and
   release authorities.
9. Stabilize generated consumer outputs.
10. Consolidate active documentation and delete superseded process artifacts.

Each phase must use the validation level approved for that phase. Strong
validation is not implied automatically.

## Exit criteria

The simplification is complete when:

- only the current workspace schema is present in runtime code;
- no migration, rollback, abandon, or historical-schema code or tests remain;
- a repository can be re-onboarded through one skill without importing old
  private state;
- onboarding creates `AGENTS.md` when absent and preserves user-authored
  content when present;
- the managed repository block defines fast-ship behavior and task-level
  validation choices;
- no pull-request or push CI runs;
- one Linux/Node 24 nightly completes in five minutes or less;
- a Monday release occurs only from the exact successful nightly SHA;
- `npm test` completes in 60 seconds or less;
- no more than 15 test entrypoints, 8,000 test lines, and 30 pack-preview
  assertions remain;
- documentation prose can be rewritten without changing JavaScript
  validators;
- a publication subtype has one edited authority;
- a version change edits `package.json` and `CHANGELOG.md`, then uses the build
  to refresh all copies;
- runtime source is the authority for generated consumer code;
- active durable documentation is under `docs/`;
- `.superpowers/`, superseded plans, migration guides, and deprecated schema
  documents are absent;
- handoffs and PR descriptions state the selected validation level, evidence,
  and unverified areas honestly.
