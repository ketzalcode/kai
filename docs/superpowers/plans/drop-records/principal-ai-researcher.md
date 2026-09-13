# Drop record: `principal-ai-researcher`

The `principal-ai-researcher` agent body opened with an eager contract-loading
preamble followed by a managed dependency-guard block. Task 9a replaced both
with inline, on-demand routes — one route sentence placed at the exact
instruction that needs each contract — plus a `**Primary profile:** judgment`
line and an inline degraded-mode refusal in the researcher's own voice. The body
shrank from **23,854** to **22,563** characters. No obligation was removed;
every dropped construct is accounted for below with its destination.

## What was dropped, and where it went

| Dropped construct | Destination |
| --- | --- |
| The eager seven-skill contract line (old line 7) | deleted; each contract is now reached by an inline route (see the routing table below) |
| The "Load and apply every skill listed above" block quote | replaced by the inline degraded-mode refusal in the researcher's own voice, plus the `kai-core-contract-v1` route at the top of the body |
| The `## Core preflight — before anything else` block (managed guard) | its sole action — invoke `kai-core-contract-v1` first — became the `kai-core-contract-v1` route at the top of the body |
| The `## Degraded mode — no operating contract` block (managed guard) | replaced by the one-paragraph first-person refusal; it restates no rule, so nothing was lost |

The old eager line named the four now-deleted core contracts —
team-operating-rules, asset-lifecycle, workspace-conventions, and
work-coordination — plus their reader-split successors. Every successor a
researcher actually uses now has an inline route; the split ids it does not use
were dropped deliberately (see below).

## The eager skills, each now routed

| Skill | Route home |
| --- | --- |
| team-operating-rules (deleted id; superseded) | its universal rules now live in `kai-core-operating-rules`, routed at `## When to defer`, before the researcher hands work to another role |
| asset-lifecycle (deleted id; superseded) | split into `kai-core-asset-producing` (routed at the Workspace-contract paragraph, before writing the durable research artifact) and `kai-core-asset-closing` (routed at the covered-set / freshness-verdict step) |
| workspace-conventions (deleted id; superseded) | `kai-core-workspace-paths`, routed at the Workspace-contract paragraph, before resolving roots and writing state |
| work-coordination (deleted id; superseded) | split into `kai-core-work-acting` (routed at step 8, before the researcher writes durable state) and `kai-core-work-item` (routed at step 8, before it records the item and reports back) |

`kai-core-contract-v1` is not one of the eager skills. It was added at the top of
the body, before the first other core route, matching every migrated agent.

### Anchor rationale

- **`kai-core-work-acting`** anchors at **step 8 (Save and report back)** because
  that is the one point where the researcher writes durable state; work-acting
  governs verify-before-write on a held item, which is exactly that write.
- **`kai-core-work-item`** anchors at the same step, on the record-and-report
  clause, because that is where the item record is created and handed back.
- **`kai-core-asset-closing`** anchors at the **covered-set / freshness step**
  because a researcher's distinctive lifecycle act is issuing a freshness verdict
  over already-published research — a close-out judgement, not a fresh emission.

## The degraded-mode refusal

The old block quote and guard's degraded block carried the "if a contract
cannot be loaded" fallback. They were replaced with a short refusal in the
researcher's own first-person voice, stating the three required facts:

> If `kai-core` will not load I answer only as a lone reader-and-writer of a
> single briefing, reasoning from the sources in front of me; I open no `.kai`
> state, take no coordinated brief, and log no Kai activity; and I tell the
> operator to install or update `kai-core` before I can take briefed research
> back into the team's flow.

- **Fact 1** — continue only with direct, single-shot work in this role's own
  domain: *"I answer only as a lone reader-and-writer of a single briefing."*
- **Fact 2** — no `.kai` state, no coordinated work, no reported activity:
  *"I open no `.kai` state, take no coordinated brief, and log no Kai activity."*
- **Fact 3** — tell the operator to install or update core: *"I tell the operator
  to install or update `kai-core`."*

The guard's other non-negotiables were not lost: durable workspace root before
state and the reproducibility discipline already live in the Workspace-contract
paragraph and the agent's method steps; stay-in-lane routing lives in
`## When to defer`.

## Per-agent lifecycle calls

- **`kai-core-asset-closing`: added.** The researcher's covered-set / freshness
  work is a close-out verdict over existing published assets, so it genuinely
  needs the closing contract, not just the producing one.
- **`kai-core-work-granting`: not added.** The researcher takes a brief and
  reports back; it does not grant leases to other roles, so the granting contract
  has no instruction that needs it here.

## Notes and borderline calls

- Several prose cross-references still name the pre-split contract
  workspace-conventions as a bare `(see …)` mention. They do not route and raise
  no new validator error; the later reference-fix task owns re-pointing them.
- Validation is red by design at this point in the refactor.
