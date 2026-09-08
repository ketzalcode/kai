# Drop record: `principal-ai-applied-engineer`

The `principal-ai-applied-engineer` agent body opened with an eager
contract-loading preamble followed by a managed dependency-guard block. Task 9a
replaced both with inline, on-demand routes — one route sentence placed at the
exact instruction that needs each contract — plus a `**Primary profile:**
judgment` line and an inline degraded-mode refusal in the agent's own voice. The
body shrank from **27,392** to **26,469** characters, well under GitHub's
**30,000-character** host limit (this agent is the largest of the six, so the
cap is called out explicitly). No obligation was removed; every dropped
construct is accounted for below.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager contract line (old line 7) | deleted; each contract is now reached by an inline route (see the routing table) |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal, plus the `kai-core-contract-v1` route at the top of the body |
| The `## Core preflight` guard block | its one action became the `kai-core-contract-v1` route at the top of the body |
| The `## Degraded mode` guard block | replaced by the one-paragraph first-person refusal; it restates no rule, so nothing was lost |

## The eager skills, each now routed

| Skill | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | `kai-core-operating-rules`, routed before handing a request to a sister role (`## When to defer` region) |
| asset-lifecycle (deleted id; superseded) | `kai-core-asset-producing`, routed at the Workspace-contract paragraph where durable asset metadata is stamped |
| workspace-conventions (deleted id; superseded) | `kai-core-workspace-paths`, routed at the Workspace-contract paragraph before resolving roots |
| work-coordination (deleted id; superseded) | split into `kai-core-work-acting` (routed where the promotion is written into a held item's durable state) and `kai-core-work-item` (routed in `## The delegation pattern`, before leaving a HANDOFF with FE/BE child items) |
| `coding-style` | routed where the applied design carries real code |
| `research-before-coding` | routed before the codebase-ownership sweep |
| `kai-core-scope-discipline` | routed before committing to a recommendation |
| `pr-sizing` | routed before breaking the work into FE-N / BE-N items |

`kai-core-contract-v1` was added at the top of the body, before the first other
core route.

### Anchor rationale

- **`kai-core-work-acting`** anchors at the **promotion-write** step because that
  is where this agent writes durable state into a held item; work-acting's
  lease-still-matches / verify-before-write discipline is exactly what that write
  needs, and the sentence is guarded by "when this run is coordinated."
- **`kai-core-work-item`** anchors in **`## The delegation pattern`**, before the
  HANDOFF, because that is where this agent defines the FE/BE child items — the
  one place it creates work-item records rather than consuming them.

## The degraded-mode refusal

> If `kai-core` will not load I stay a single-shot advisor, sketching one
> applied-AI recommendation from the request and code in front of me; I write no
> `.kai` state, accept no leased design item, and surface no Kai activity; and I
> tell the operator to install or update `kai-core` before I can feed a
> recommendation into coordinated delivery.

- **Fact 1** — single-shot own-domain work: *"I stay a single-shot advisor,
  sketching one applied-AI recommendation."*
- **Fact 2** — no `.kai` state, no leased work, no activity: *"I write no `.kai`
  state, accept no leased design item, and surface no Kai activity."*
- **Fact 3** — install/update remedy: *"I tell the operator to install or update
  `kai-core`."*

## Per-agent lifecycle calls

- **`kai-core-asset-closing`: not added.** This agent produces a proposal and
  promotes it; it does not issue a freshness/close-out verdict over existing
  published assets, so `kai-core-asset-producing` (which covers promotion and
  supersession) is the only lifecycle contract its instructions need.
- **`kai-core-work-granting`: not added.** It offers delegation and lets the
  director dispatch; it does not itself grant leases, so no instruction needs the
  granting contract.

## Notes and borderline calls

- The dispatch-offer prose retains a pre-existing `invoke `principal-swe-frontend``
  line. That is a situational agent dispatch, not a contract route, and appears
  in the parser's list only incidentally; it was unchanged by this task.
- Bare `(see …)` cross-references to the pre-split workspace-conventions contract
  were left verbatim; the later reference-fix task owns re-pointing them.
- Validation is red by design at this point in the refactor.
