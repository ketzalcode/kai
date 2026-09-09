# Drop record: `principal-security`

The `principal-security` agent body opened with the eager contract preamble the
five engineering assessors shared byte-for-byte: a nine-skill inheritance line,
a block quote ordering the agent to load every one of them before acting, and
the injected dependency-guard block. Task 9b replaced that preamble with inline,
on-demand routes — one route sentence placed at the exact instruction that needs
each contract — plus the split-skill re-pointing this wave carries. The body
shrank from **12,975** to **11,461** characters. No obligation was removed; every
dropped construct is accounted for below with its destination.

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
| The old id `kai-core-work-coordination` | split into `kai-core-work-acting` (local evidence draft) and `kai-core-work-item` (coordinated record), both routed at `## Workspace and output` |
| The old id `kai-core-asset-lifecycle` | superseded by `kai-core-asset-producing`, routed at the sanitized-brief publish step in `## Workspace and output` |

## The routes, each at its trigger

| Skill | Route home |
| --- | --- |
| `kai-core-contract-v1` | top of body, before the first other core skill |
| `kai-core-operating-rules` | `## Where you sit`, before holding ownership lines and routing out-of-lane decisions |
| `review-security-privacy` | `### 2. Map assets and trust`, as the document-review lens for a written design/PRD/proposal |
| `kai-core-scope-discipline` | after `## Verdict and finding severity`, so a product-scope tradeoff routes to `principal-product-manager` and risk acceptance to the operator |
| `kai-core-no-self-remediation` | `### 4. Evaluate controls and evidence`, before findings are written |
| `kai-core-peer-communication` | `### 5. Decide and route`, before a finding is routed to its owner |
| `kai-core-work-activity` | `### 6. Record formal review`, when the formal review run is recorded |
| `kai-core-workspace-paths` | `## Workspace and output`, to resolve the durable workspace root before writing evidence |
| `kai-core-work-acting` | `## Workspace and output`, before writing the local evidence draft under `.kai/runs/` |
| `kai-core-work-item` | `## Workspace and output`, to record the assessment against its coordinated item |
| `kai-core-asset-producing` | `## Workspace and output`, before publishing the sanitized brief as a durable artifact |

## The degraded-mode refusal

> If `kai-core` will not load I answer one security question at a time — a single
> threat read, control critique, or vulnerability triage reasoned from the
> authorized evidence already in front of me; I open no `.kai` assessment or
> evidence register, take no coordinated review or lease, and record no Kai
> activity or verdict; and I tell the operator to install or update `kai-core`
> before I can rejoin coordinated security work.

- **Fact 1** — continue only with direct, single-shot own-domain work: *"I answer
  one security question at a time — a single threat read, control critique, or
  vulnerability triage reasoned from the authorized evidence already in front of
  me."*
- **Fact 2** — no `.kai` state, no coordinated-work claim, no Kai activity: *"I
  open no `.kai` assessment or evidence register, take no coordinated review or
  lease, and record no Kai activity or verdict."*
- **Fact 3** — tell the operator to install or update core: *"I tell the operator
  to install or update `kai-core`."*

### Why this refusal is not the privacy refusal with a noun swapped

`principal-security` and `principal-privacy-compliance` inherit the identical
nine skills, so the lazy outcome is one refusal written twice. They are written
distinct on purpose, because the two roles fail on different objects:

- **What it reads.** Security reasons over *authorized evidence* — code, config,
  logs, architecture, a supplied advisory. Its degraded unit is a "threat read,
  control critique, or vulnerability triage." Privacy reasons over *descriptions
  and schemas it was handed*, never records, and its degraded unit is a
  "lawful-basis, retention, or obligation reading."
- **The named artifact it declines to open.** Security declines an *evidence
  register*; privacy declines a *data map*. These are the two roles' actual
  durable outputs, not interchangeable nouns.
- **What "rejoin" means.** Security rejoins *coordinated security work* and
  records no *verdict*; privacy rejoins *coordinated compliance work* and records
  no *determination*. A verdict (CLEAR/CONDITIONAL/BLOCK) and a determination
  (COMPLIANT/GAP) are different decisions with different owners.

## Lifecycle calls

- **`kai-core-asset-closing` — not added.** The agent *produces* the sanitized
  brief via `kai-core-asset-producing`; it never disposes of a kai asset's
  lifecycle. Its verdicts (CLEAR/CONDITIONAL/BLOCK) are judgments on *another*
  change's readiness, and acceptance/waiver of a BLOCK is explicitly the
  operator's call, not an asset-closing action this role takes.
- **`kai-core-work-granting` — not added.** The agent claims and records against
  an item (`kai-core-work-item`) but never grants a lease to another role.

## Notes and borderline calls

- The `## Hard rules`, verdict tables, and quality bar already carry the
  non-negotiables the old block quote gestured at (authorization first,
  no exploitation, no self-acceptance of residual risk, no self-review, secrets
  never in artifacts). Those bind unchanged; the routes did not have to re-state
  them.
- The refusal is written in-voice and does not match the frozen validator regex
  that still pins the old block-quote wording. Red is expected here; Task 10
  rewrites that check to a three-fact test.
