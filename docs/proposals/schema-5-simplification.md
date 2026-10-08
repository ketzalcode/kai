# Schema 5 simplification proposal

**Status:** Proposed after the schema-5 implementation  
**Scope:** Core runtime, pack contracts, build output, validation, migration,
testing, and release maintenance  
**Decision:** Keep the schema-5 product model. Reduce the number of places that
encode it.

## Executive summary

Schema 5 establishes the right product boundaries:

- `.kai/` is always private;
- `docs/kai/` contains accepted knowledge;
- Core, Engineering, and Creative own their namespaces;
- Direction remains operator-owned;
- coordinated work uses Epic -> Feature -> Requirement -> Task;
- SQLite is authoritative;
- direct work creates no Kai state;
- generated consumer scripts have no repository dependency.

The implementation is harder to change than those requirements justify. The
same fact is often encoded in Markdown, JavaScript validators, prose scanners,
mutation tests, generated bundles, manifests, and release text. A vocabulary
change therefore behaves like a repository-wide migration.

The schema-5 branch changed 220 files across 38 commits. Generated artifacts
accounted for more churn than runtime source, and tests changed more lines than
runtime source. The migration implementation grew beyond 4,400 lines and
needed repeated recovery redesigns. Later review rounds fixed English-language
matchers for adjacent sentences and synonyms rather than product behavior.

The target is a small set of authorities:

1. one executable workspace contract;
2. one executable coordination contract;
3. one structured publication declaration per pack;
4. SQLite as the only runtime record authority;
5. one build command and one edited version source;
6. an offline, one-way migration boundary;
7. behavioral tests at runtime and generated-consumer boundaries;
8. documentation that explains contracts without being parsed as a schema.

## Evidence from the schema-5 change

### Change amplification

The counts below measure files in the completed branch diff whose changed lines
mention each concept. They show footprint, not perfect causal attribution.

| Concept | File hits | Why it spreads |
| --- | ---: | --- |
| Schema version | 85 | Runtime admission, historical readers, fixtures, prose, generated scripts |
| Hierarchy and retired planning nouns | 161 | Contracts, engines, evidence, host, skills, agents, docs, migration |
| Paths and publication vocabulary | 144 | Layout, manifests, pack tables, validators, fixtures, docs |
| Producer classification and routing | 76 | Frontmatter on every source, route prose, validators, mutation tests |
| Release version | 11 | Package, lock, root/pack manifests, marketplace, README, changelog |

Some breadth is inherent. Typed subjects must reach the store and evidence
layers. Direction must reach hierarchy admission. Generated bundles must carry
the runtime. The avoidable part is independently restating those facts.

### Current scale

| Area | Approximate size |
| --- | ---: |
| Coordination runtime | 42 modules / 18,000 lines |
| Core source | 59 JavaScript modules / 24,000 lines |
| Tests | 48 JavaScript files / 28,000 lines |
| Tooling | 9 JavaScript files / 6,300 lines |
| Generated Core scripts | 19 files / 22,000 lines |
| Full `npm test` chain | 42 commands |
| Pack-preview self-test | 250 checks |

Large files identify the main pressure points:

| File | Approximate lines | Responsibility |
| --- | ---: | --- |
| `src/core/lib/coordination-runtime/migration-v5.mjs` | 4,400 | Inventory, conversion, locking, activation, rollback, audit, recovery |
| `test/coordination-schema5-migration-self-test.mjs` | 3,500 | Migration, interruption, rollback, corruption |
| `test/coordination-engine-self-test.mjs` | 2,600 | Task lifecycle and evidence scenarios |
| `tools/lib/pack-plan.mjs` | 2,400 | Pack model, prose parsing, routing, publication, release checks |
| `tools/pack-preview.mjs` | 1,800 | Build, preview, mutations, partition gates |

### Real defects found by valuable gates

The simplification must not remove the checks that found these problems:

- ESM import-cycle crashes across hierarchy and Task validators;
- cross-subject record, thread, and count leakage;
- stale-Direction handoff and evidence bypasses;
- conflicting current completion evidence being ignored;
- snapshot races and inherited-hold omissions;
- linked runtime parents, registry aliases, and legacy write admission;
- stale generated scripts and missing generated exports;
- cross-bundle error identity failures;
- clean consumers accidentally resolving checkout dependencies;
- backup drift, writer races, deletion authority, and incomplete rollback audit
  publication.

These tests exercise observable behavior, authority, privacy, corruption, or
the installed artifact. They earn their cost.

### Expensive checks with little product value

The following checks mostly enforce agreement among duplicate descriptions:

- scanning current documents for retired nouns and paths;
- matching coordination terminology across Markdown paragraphs;
- recognizing synonyms such as "previous" and "prior" in web-evaluation prose;
- requiring `durable-output-producer: false` on every non-producer;
- parsing immediate adjacency between two prose skill routes;
- comparing hand-written publication tables with hand-written JavaScript rows;
- requiring a README version stamp for every shipped behavior change;
- running the same pack-plan rules through several overlapping wrappers.

These gates make prose safer to compile but do not make the runtime safer.

## Current duplication

### Publication vocabulary has two authorities

Each pack's publication skill claims to own its vocabulary. The same rows are
hard-coded in `tools/lib/pack-plan.mjs`, which parses the Markdown table and
compares it with the JavaScript copy.

A new subtype therefore requires coordinated edits to:

- the skill table;
- the JavaScript expected rows;
- validator mutations;
- affected fixtures;
- generated output;
- explanatory docs.

Validation proves that two authorities agree. It does not remove the duplicate
authority.

### Agent prose is treated as an executable schema

Shipped agents and skills are correctly validated for structure and resolvable
routes. The validator goes further by compiling ordinary English:

- exact refusal wording;
- retired vocabulary;
- paragraph-level semantic combinations;
- web-evaluation ID descriptions;
- route adjacency.

This makes editorial changes behavior-sensitive even when the executable
contract is unchanged.

### Producer intent is stated twice

Every shipped source declares `durable-output-producer: true|false`. Producers
also load their pack publication skill immediately before asset production.
The validator exists to prove those two statements agree.

Negative metadata on 35 non-producers is checker input, not agent behavior.

### Runtime contracts are split by implementation history

Record kinds, command kinds, transitions, mutation fields, validators,
handlers, and authority checks are assembled across:

- `contract-primitives.mjs`;
- `contract.mjs`;
- `hierarchy-contract.mjs`;
- `task-contract.mjs`;
- `hierarchy-engine.mjs`;
- `task-engine.mjs`;
- host and evidence maps.

The modules are locally focused, but there is no single registry answering:
"What is this command, what record does it act on, who may perform it, and
which fields may it change?"

### Generated artifacts are validated too late

Source and committed plugin bundles are separate surfaces. During schema 5,
generated verification was intentionally deferred until the release task.
That release task found source/generated defects that earlier source tests
could not see.

Generated consumers are a primary product boundary. They should never be
stale across completed implementation steps.

### Release metadata is agreement among copies

Version parity is important. Manually editing package, lock, root plugin,
marketplace, three generated pack manifests, README, and changelog is not.

## Target architecture

### Authority map

```text
package.json
└─ version
   └─ build generates root, marketplace, and pack metadata

src/core/workspace-contract.mjs
├─ schema version
├─ manifest shape
├─ private/public roots
├─ placement modes
├─ pack namespaces
└─ path derivation inputs

src/core/coordination/schema.mjs
├─ record kinds
├─ command kinds
├─ states and transitions
├─ relationship shapes
├─ command -> subject mapping
├─ command -> authority policy
├─ allowed mutations
└─ validator/handler keys

plugins/<pack>/.../publication/contract.json
├─ types and subtypes
├─ formats
├─ privacy/publication rules
└─ generated publication-skill table

.kai/core/runtime/coordination.sqlite
└─ runtime records, events, operations, versions, evidence bindings
```

### Proposed source tree

```text
src/core/
├─ workspace-contract.mjs
├─ workspace-path-safety.mjs
├─ workspace.mjs
├─ direction.mjs
├─ coordination/
│  ├─ schema.mjs
│  ├─ store.mjs
│  ├─ engine.mjs
│  ├─ evidence.mjs
│  ├─ views.mjs
│  ├─ host.mjs
│  └─ historical-reader.mjs
└─ cli.mjs

tools/
├─ build.mjs
└─ migrations/
   └─ v4-to-v5/

plugins/
├─ kai-core/
├─ kai-engineering/
└─ kai-creative/
```

This is not a request for several giant files. It is a request to align files
with durable boundaries rather than the sequence in which schema 5 was built.

### Workspace contract

One executable module owns:

- schema version;
- `.kai`, `docs/kai`, Direction, and SQLite paths;
- manifest keys;
- repo-local and external placement;
- pack namespaces;
- lifecycle names;
- private and publication path derivation.

Workspace resolution, doctor, activity, observation, reports, migration, and
tests import it. No other module re-literalizes the current schema or roots.

Keep path safety separate. Windows case behavior, junctions, symlinks, UNC and
device paths, nested repositories, and external bindings are real privacy and
data-loss boundaries.

### Coordination contract

One registry owns record and command facts. Runtime modules remain separated
by behavior:

- store owns SQLite transactions and snapshots;
- engine owns command dispatch;
- evidence owns approval, artifact, and proof rules;
- views own status, context, planning, and report data;
- host owns native capabilities.

The registry's authority policy is executable, not descriptive. For each
command it names the required actor or delegated scope, scope/completion
authority, self-acceptance restrictions, and permitted mutation fields.
Engine, evidence, host, generated reference tables, and authority tests consume
that one policy. Installing a role never grants authority by itself.

Historical `initiative` and `item` records move to a read-only adapter. They
are not members of the live schema-5 registry.

### Pack publication contract

Each shipped pack owns one structured declaration. The build renders its
Markdown table into the publication skill.

Validation checks:

- exactly one declaration per pack;
- safe path templates;
- pack-local namespace;
- supported formats;
- generated Markdown freshness.

Delete the second expected-row table from `pack-plan.mjs`.

### Producer routing

The pack publication skill becomes the single durable-output entrypoint and
loads or incorporates asset production. `kai-core-asset-producing` is not a
general producer route: only the three pack publication entrypoints may route
it directly.

A durable producer keeps one positive structured declaration naming its
pack-local publication entrypoint. Absence means non-producer. The validator
checks a non-empty live producer corpus, requires each declared producer to
route exactly that entrypoint, forbids direct asset-production routes from
other sources, and rejects cross-pack entrypoints. A mutation that removes the
entrypoint or introduces a direct bypass must fail.

Remove negative producer declarations and immediate-before adjacency parsing.
This preserves the approved publication boundary without compiling the
relative position of English sentences.

### Build and generated artifacts

Use one command:

```text
npm run build
```

It:

1. validates structured source contracts;
2. renders generated skill/reference tables;
3. generates metadata from the package version;
4. bundles consumer scripts;
5. verifies generated cleanliness.

Prefer stable generated names:

```text
plugins/kai-core/scripts/runtime.mjs
plugins/kai-core/scripts/coordinate.mjs
plugins/kai-core/scripts/workspace-doctor.mjs
```

Thin entrypoints should share one stable runtime bundle. Content-hashed chunks
create large delete/add diffs without improving this committed distribution
model.

Generated files remain committed if marketplace installation requires them.
They are never hand-edited. Source and generated black-box tests run in the
same implementation task.

### Version ownership

`package.json` is the only edited version source. The build writes:

- root `plugin.json`;
- marketplace versions;
- pack manifest versions;
- any generated catalog version.

`npm version` updates the lockfile. CHANGELOG remains manually authored.
Remove README status as an enforced release surface.

### Migration boundary

The current migration automates too many destructive recovery states inside
the live runtime.

Adopt a one-way, offline policy:

1. inspect the immediately previous schema read-only;
2. require quiescence, operator classification, Direction, and an external
   verified backup;
3. build a complete schema-5 workspace from immutable backup bytes in staging;
4. validate staging with the normal current validator;
5. open staged SQLite read-only;
6. switch one authority last;
7. before activation, discard or rerun staging;
8. after activation but before the first schema-5 event, rollback restores the
   verified backup;
9. after the first schema-5 event, automated rollback is unsupported and
   forward reconciliation is required.

Migration belongs under `tools/migrations/v4-to-v5/`, outside normal write
admission. Keep a small journal for the final switch, not a state machine that
reconciles every intermediate deletion and authority combination.

Schema 3 remains inspectable through a historical adapter. If necessary, users
migrate through the final schema-4-capable release rather than carrying every
historical writer in current Core.

## Test architecture

### Tier 1: fast contracts

Run on every change:

- workspace and path grammar;
- Direction parsing and hashing;
- coordination schema validation;
- store transaction and subject isolation;
- authority and transition checks;
- build structure and syntax.

### Tier 2: behavioral integration

Run canonical workflows:

- one complete hierarchy chain;
- one knowledge Task;
- one product/release Task;
- stale-Direction handoff;
- conflicting evidence;
- repo-local and external initialization;
- migration happy and refusal paths.

Avoid testing every rule again through every CLI, context, and report surface.

### Tier 3: generated consumers

Keep all four compositions:

- Core;
- Core plus Engineering;
- Core plus Creative;
- all packs.

Run the same smoke/lifecycle contract against source and generated Core. Keep:

- no checkout `node_modules`;
- pack-local imports;
- direct-work behavior;
- private/public first writes;
- invalid publication refusals;
- uninstall preservation;
- Windows/POSIX path decisions.

### Tier 4: slow and destructive

Run in slow CI, nightly, or release validation:

- exhaustive evidence/report combinations;
- crash injection;
- writer races;
- browser rendering;
- the full mutation matrix.

Retain mutations for parser non-vacuity, path/security refusal, authority
bypass, migration corruption, generated import closure, and build drift.
Delete mutations whose only purpose is preserving an explanatory sentence.

## Consolidation sequence

Each phase can ship independently and has a measurable checkpoint.

### Phase 0: freeze behavioral evidence

Keep the current runtime and tests. Record the golden behavior set:

- private `.kai`;
- accepted `docs/kai`;
- Direction;
- hierarchy and Task gates;
- SQLite authority;
- three-pack composition;
- generated execution;
- cross-platform path behavior.

**Checkpoint:** source and generated consumer tests pass on Windows and Linux.

### Phase 1: collapse release and build authority

- make `package.json` the only edited version;
- generate root, marketplace, and pack metadata;
- introduce `npm run build` and `npm run build:check`;
- remove README status from release guard;
- emit stable runtime and entrypoint names.

**Delete:** manual version synchronization paths, overlapping parity mutations,
and hashed orphan-chunk checks after hashed chunks are removed.

**Checkpoint:** changing package version and CHANGELOG regenerates every release
surface; clean consumers pass.

### Phase 2: single-source publication vocabulary

- add one structured declaration per pack;
- generate the publication-skill table;
- make fixtures consume the declaration.

**Delete:** `PUBLICATION_ROWS`, row comparison, duplicate row mutations, and
hand-maintained tables.

**Checkpoint:** one temporary subtype edit updates runtime, skill, and fixture
output through the build; revert the temporary subtype afterward.

### Phase 3: stop compiling explanatory prose

- validate frontmatter, links, structured declarations, and generated
  freshness;
- move ordinary Markdown checks outside executable contract validation.

**Delete:** retired-noun scanning, paragraph semantics, web-evaluation synonym
matching, and their mutations.

**Checkpoint:** docs can be rewritten without changing JavaScript validators;
runtime and consumer behavior remain unchanged.

### Phase 4: simplify producer routing

- make each pack publication skill the durable-output entrypoint;
- remove negative producer declarations;
- remove route adjacency parsing;
- retain one positive structured entrypoint declaration per producer;
- allow only publication entrypoints to route asset production directly;
- keep non-vacuous missing-entrypoint, direct-bypass, and foreign-entrypoint
  mutations.

**Checkpoint:** every current producer still reaches publication and asset
production through its own pack entrypoint; a deliberately introduced direct
asset-production bypass fails validation; non-producers expose no durable-output
command path.

### Phase 5: consolidate executable contracts

- introduce the workspace contract;
- introduce the coordination registry;
- isolate historical decoding;
- make dispatcher, validators, and generated reference tables consume those
  authorities.

**Merge behind stable boundaries:** contract primitives and live contracts,
parent/Task handler registration, and hierarchy views.

**Delete:** duplicate command and authority sets, repeated path/version
literals, and live historical kinds.

**Checkpoint:** existing schema-5 stores return equivalent reads and canonical
lifecycle scenarios pass.

### Phase 6: quarantine and simplify migration

First move the current migration under `tools/migrations/v4-to-v5/` and remove
it from normal write admission. Freeze it while the support window is decided.

Then replace it with stage-from-backup plus a small final-switch journal.

After the support window, delete:

- automated abandon after destructive partial progress;
- automated rollback of active workspaces;
- migration writer-token draining;
- database abandon anchors;
- mutable/external/physical phase reconciliation;
- recovery paths that resume mid-deletion.

**Checkpoint:** happy path, refusal path, interrupted final switch, and
post-event no-rollback policy pass on Windows and Linux.

### Phase 7: collapse test and documentation tiers

- replace the 42-command serial script with named test tiers;
- run shared validators once;
- move slow report and crash matrices out of the fast loop;
- keep one current architecture guide and one workspace/migration guide.

**Delete:** wrappers without distinct boundaries, repeated fixture builders,
and superseded current docs.

**Checkpoint:** the PR tier is materially faster while release validation still
proves migration and generated distribution.

## Complexity to keep

Simplification must not remove:

- cross-platform canonical path and link safety;
- `.kai` privacy and accepted publication separation;
- exact Direction byte/hash binding and direct-work exemption;
- explicit Epic, Feature, Requirement, and Task meanings;
- Task leases, collisions, evidence, independent review, deployment,
  production verification, handoff, and recovery;
- SQLite transactions, snapshots, optimistic versions, and subject isolation;
- clean generated-consumer tests;
- verified external migration backup, inventory, and manifest-last activation.

The goal is not fewer safeguards. It is fewer independently edited
descriptions of the same safeguard.

## Success criteria

The simplification is complete when:

- changing the workspace schema has one executable edit plus migration and
  behavioral tests;
- changing a pack publication subtype has one source edit;
- changing release version has one edited metadata source;
- agent prose can be rewritten without JavaScript validator changes;
- source and generated consumer behavior are verified together;
- live coordination does not import historical migration writers;
- fast PR validation completes in minutes, with slow destructive coverage
  retained in release CI;
- the three installed packs preserve all schema-5 privacy, authority, and
  consumer guarantees.
