# Drop record: `director-chief-of-staff`

The `director-chief-of-staff` agent body opened with an eager contract-loading
preamble: a ten-skill inheritance line and a block quote ordering the agent to
load every one of them before acting. Task 7 replaced that eager preamble with
inline, on-demand routes — one route sentence placed at the exact instruction
that needs each contract — plus a role-taxonomy simplification. The body shrank
from **25,268** to **22,980** characters. No obligation was removed; every
dropped construct is accounted for below with its destination.

This is the reference body Tasks 8 and 9 copy for the other 26 agents, so the
shape here is deliberate: routes live in the prose beside their trigger, never
collected into a list (a collected list is the eager pattern this refactor
removes, and `AGENTS.md` forbids it).

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager ten-skill contract line (old line 7) | deleted; each of the ten skills is now reached by an inline route (see the routing table below) |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal in the director's own voice, plus the `kai-core-contract-v1` route at the top of the body |
| The 26-role taxonomy bullet list (`## Role taxonomy`) | replaced by the coordination-authority paragraph + the roster-resolution sentence; the three role-kind lines (`director-*` / `principal-*` / `workflow-*`) were kept verbatim |
| The `## Contracts you inherit` section heading and its skill bullet list | deleted; its skills became inline routes |
| The issue-analysis gloss inside that section | folded into the `kai-core-issue-analysis` route sentence in `## Invocation modes` |
| The "authoritative work state is `.kai/state/items/<item-id>.md`" paragraph | relocated to `### 1. Load and reconcile`, beside the `kai-core-workspace-paths` route where the director reads state |

## The ten eager skills, each now routed

The old contract line named ten skills. Every one now has an inline route at the
instruction that needs it (bare mentions do not route; each sentence uses the
`Load`/`Invoke`/`Apply` + backticked-id form the parser accepts):

| Skill | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | its universal rules now split into `kai-core-operating-rules`, routed in `### 3. Dispatch real roles` before coordinating with another role |
| asset-lifecycle (deleted id; superseded) | split into `kai-core-asset-producing` (routed at the director-summary artifact write, `### 5`) and `kai-core-asset-closing` (routed at completion recording, `### 4`) |
| workspace-conventions (deleted id; superseded) | split into `kai-core-workspace-paths` (routed at `### 1`, before touching workspace state) and `kai-core-workspace-initiative` (routed at `### 1`, before reading initiative state) |
| work-coordination (deleted id; superseded) | split into `kai-core-work-granting` (routed at `### 2`, before granting a lease), `kai-core-work-item` (routed at `### 3`, before writing an item record), and `kai-core-work-acting` (routed at `### 1`, before the director writes durable state) |
| `kai-core-work-activity` | `### 5`, before returning the director report (status/activity reporting) |
| `kai-core-peer-communication` | `### 3. Dispatch real roles`, before addressing a peer |
| `kai-core-definition-of-done` | `### 4. Reconcile outcomes`, before the release gate |
| `kai-core-issue-analysis` | `## Invocation modes`, at the issue-intake path (gloss folded in) |
| `kai-core-pr-delivery` | `### 4. Reconcile outcomes`, before driving a finished change toward merge |
| `kai-core-initiative-stewardship` | `### 1. Load and reconcile`, before reading initiative status |

`kai-core-contract-v1` is not one of the ten. It was added at the top of the
body, before the first other core route, matching every migrated agent.

## The degraded-mode refusal

The old block quote carried the "if a contract cannot be loaded, these
non-negotiables still bind" fallback. It was replaced with a short refusal in
the director's own first-person voice, stating the three required facts:

> If `kai-core` is unavailable, I keep working only on direct, single-shot
> requests inside my own coordination domain; I create no `.kai` state, claim
> no coordinated work, and report no Kai activity; and I tell the operator to
> install or update `kai-core` before I can direct the team again.

- **Fact 1** — continue only with direct, single-shot work in this role's own
  domain: *"I keep working only on direct, single-shot requests inside my own
  coordination domain."*
- **Fact 2** — no `.kai` state, no claimed coordinated work, no reported Kai
  activity: *"I create no `.kai` state, claim no coordinated work, and report no
  Kai activity."*
- **Fact 3** — tell the operator to install or update core: *"I tell the
  operator to install or update `kai-core`."*

The old block quote's other non-negotiables were not lost. They already live in
the `## Hard rules` section and stop conditions: durable workspace root before
state → Hard rule 8; stay in lane / route outside work as a proposal → Hard
rules 1 and 3; keep coordinated work claimed, evidenced, handed off → Hard rules
2 and 7; never claim `shipped` before a human deploys → Hard rule 6; escalate to
`@operator` only for a decision no kai role owns → stop conditions +
`QUESTION ... -> @operator`.

## The role taxonomy

The 26-role bullet list enumerated who owns what across every installed pack.
That enumeration is a fact about the installed packs, not something the director
should recall, so it was replaced by:

1. the coordination-authority paragraph (the director owns dispatch,
   follow-through, reconciliation, escalation, status; the operator owns vision;
   the steward owns scope/priority; each specialist owns its own domain), and
2. the roster-resolution sentence, which sends the director to the roster before
   dispatching.

`### 2b. Resolve role availability` was kept intact — after the list is gone, it
is what tells the director which roles actually exist this session.

One narrow fact was intentionally not carried forward: the old list named the
initiative steward's default identity as `principal-product-manager`. The
coordinator's replacement paragraph drops the default-identity naming in favour
of roster resolution ("each specialist owns its own domain and says so in its
own definition"). The steward role is still referenced throughout the body and
is now resolved from the roster rather than assumed.

## Notes and borderline calls

- The dispatch packet's `required contracts:` line (inside a fenced code block)
  and three prose cross-references still name the pre-split contract
  `kai-core-work-coordination`. They sit inside code fences or are bare mentions,
  so they do not route and raise no new validator error. They were left verbatim
  per the copy-the-prose-verbatim constraint; the later reference-fix task owns
  re-pointing them to `kai-core-work-granting` / `kai-core-work-acting`.
- `workflow-initiative-init` and `workflow-ship` remain as `invoke`-form agent
  dispatches and therefore still appear in the parser's route list. They are
  agent dispatches, not contract routes, and were unchanged by this task.
- Validation is red by design at this point in the refactor. After the rewrite:
  `node scripts/validate-plugin.mjs` reports **435 error(s)** and
  `node scripts/pack-preview.mjs --self-test` reports **242 checks passed,
  7 FAILED**. The extra self-test failure versus the 243/6 baseline is the
  `progressiveSkillRoutingErrors` check, which still pins the old block-quote
  wording verbatim; Task 10 relaxes it to a three-fact check.
