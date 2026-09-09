# Drop record: `principal-privacy-compliance`

The `principal-privacy-compliance` agent body opened with the eager contract
preamble the five engineering assessors shared byte-for-byte: a nine-skill
inheritance line, a block quote ordering the agent to load every one of them
before acting, and the injected dependency-guard block. Task 9b replaced that
preamble with inline, on-demand routes — one route sentence placed at the exact
instruction that needs each contract — plus the split-skill re-pointing this
wave carries. The body shrank from **13,236** to **11,793** characters. No
obligation was removed; every dropped construct is accounted for below with its
destination.

Routes live in the prose beside their trigger, never collected into a list (a
collected list is the eager pattern this refactor removes, and `AGENTS.md`
forbids it).

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager nine-skill contract line | deleted; each skill is now reached by an inline route (see the routing table) |
| The "load and apply every skill before acting" block quote | replaced by the degraded-mode refusal in the agent's own voice, plus the `kai-core-contract-v1` route at the top of the body |
| The injected `kai core dependency guard` block | deleted; its single obligation (probe core, then refuse in a bounded way) is now the top-of-body contract route plus the refusal |
| The old id `kai-core-team-operating-rules` | superseded by `kai-core-operating-rules`, routed at `## Where you sit` |
| The old id `kai-core-workspace-conventions` | superseded by `kai-core-workspace-paths`, routed at `## Workspace and output` |
| The old id `kai-core-work-coordination` | split into `kai-core-work-acting` (local analysis draft) and `kai-core-work-item` (coordinated record), both routed at `## Workspace and output` |
| The old id `kai-core-asset-lifecycle` | superseded by `kai-core-asset-producing`, routed at the sanitized-assessment publish step in `## Workspace and output` |

## The routes, each at its trigger

| Skill | Route home |
| --- | --- |
| `kai-core-contract-v1` | top of body, before the first other core skill |
| `kai-core-operating-rules` | `## Where you sit`, before holding ownership lines and routing out-of-lane decisions |
| `review-security-privacy` | `### 2. Map data and processing`, as the document-review lens for a written policy/notice/DPIA draft |
| `kai-core-scope-discipline` | after `## Verdict and finding severity`, so a product-scope tradeoff routes to `principal-product-manager` and legal risk acceptance to the operator and counsel |
| `kai-core-no-self-remediation` | `### 4. Evaluate controls and records`, before findings are written |
| `kai-core-peer-communication` | `### 5. Decide and route`, before routing a decision to its owner |
| `kai-core-work-activity` | `### 6. Record formal review`, when the formal review run is recorded |
| `kai-core-workspace-paths` | `## Workspace and output`, to resolve the durable workspace root before writing analysis |
| `kai-core-work-acting` | `## Workspace and output`, before writing the local analysis draft under `.kai/runs/` |
| `kai-core-work-item` | `## Workspace and output`, to record the assessment against its coordinated item |
| `kai-core-asset-producing` | `## Workspace and output`, before publishing the sanitized assessment or policy as a durable artifact |

## The degraded-mode refusal

> If `kai-core` will not load I answer one compliance question at a time — a lone
> lawful-basis, retention, or obligation reading drawn only from the descriptions
> and schemas I was handed; I open no `.kai` assessment or data map, take no
> coordinated review or lease, and record no Kai activity or determination; and I
> tell the operator to install or update `kai-core` before I can rejoin
> coordinated compliance work.

- **Fact 1** — continue only with direct, single-shot own-domain work: *"I answer
  one compliance question at a time — a lone lawful-basis, retention, or
  obligation reading drawn only from the descriptions and schemas I was handed."*
- **Fact 2** — no `.kai` state, no coordinated-work claim, no Kai activity: *"I
  open no `.kai` assessment or data map, take no coordinated review or lease, and
  record no Kai activity or determination."*
- **Fact 3** — tell the operator to install or update core: *"I tell the operator
  to install or update `kai-core`."*

### Why this refusal is not the security refusal with a noun swapped

The two roles inherit the identical nine skills, so the reviewer will put these
refusals side by side. They diverge on the object each role fails on:

- **What it reads.** Privacy reasons only over *descriptions and schemas it was
  handed* — categories and flows, never real personal data or records. Its
  degraded unit is a "lawful-basis, retention, or obligation reading." Security
  reasons over *authorized evidence* (code, config, logs) and its degraded unit
  is a "threat read, control critique, or vulnerability triage."
- **The named artifact it declines to open.** Privacy declines a *data map*;
  security declines an *evidence register*. Each is the role's real durable
  output, not a renamed copy of the other.
- **What "rejoin" means.** Privacy rejoins *coordinated compliance work* and
  records no *determination* (COMPLIANT/CONDITIONAL/GAP); security rejoins
  *coordinated security work* and records no *verdict* (CLEAR/CONDITIONAL/BLOCK).
  A legal/regulatory determination and a technical security verdict are decisions
  with different owners — privacy's ultimately sits with the operator and their
  counsel.

## Lifecycle calls

- **`kai-core-asset-closing` — not added.** The agent *produces* the sanitized
  assessment via `kai-core-asset-producing`; it never disposes of a kai asset's
  lifecycle. A GAP determination is a judgment on another change's readiness, and
  documented risk acceptance is explicitly the operator's and counsel's call, not
  an asset-closing action this role takes.
- **`kai-core-work-granting` — not added.** The agent claims and records against
  an item (`kai-core-work-item`) but never grants a lease to another role.

## Notes and borderline calls

- The `## Hard rules`, verdict tables, and compliance quality bar already carry
  the non-negotiables the old block quote gestured at (not legal advice, no real
  personal data ingested, cite the specific clause, no execution, no
  self-acceptance of legal risk, no self-review). Those bind unchanged; the
  routes did not have to re-state them.
- The refusal is written in-voice and does not match the frozen validator regex
  that still pins the old block-quote wording. Red is expected here; Task 10
  rewrites that check to a three-fact test.
