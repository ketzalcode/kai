# Drop record: `eng-lead-technical-writing`

`eng-lead-technical-writing` is the repo's one already-migrated agent. It already
had the target shape — a `kai-core-contract-v1` route and a degraded-mode refusal
at the top of `## Kai standards` — so this task did **not** rewrite it wholesale.
It applied exactly the three fixes the brief specified. The body grew from
**7,729** to **7,931** characters: distributing a broken hoisted list into real
route sentences costs a few characters, and that is the correct trade — success
here is that the routes actually fire, not that the body shrinks.

## The evidence: its six routes were dead

Before this task, the whole point of the strict parser can be read off this one
agent. Its `## Kai standards` section carried a hoisted route inventory:

> Load the rest only where the work calls for it: `<id>` before joining
> coordinated work or routing to another role, `<id>` before touching workspace
> state, …

The verb `Load` sits adjacent to "the rest", not to any backticked id, so the
parser attributes the route to nothing. Run against the pre-task body,
`routedSkills` returned:

```json
["kai-core-contract-v1"]
```

**All six of the listed routes were dead** — a hoisted inventory that *looks*
like it wires up six contracts and wires up none. That empirical result is the
justification for building a parser strict enough to reject the eager pattern
instead of rewarding its appearance.

## The three fixes

1. **Deleted the `**Identity contract:** `kai-agent-v1`` line.** Task 10 owns the
   versioned-identity contract; the standalone declaration line is removed here.

2. **Un-hoisted the dead route list** and distributed its targets into the
   instructions that need them, in the accepted `Apply`/`Invoke` + backticked-id
   form. The list is gone.

3. **Re-pointed every target at a live id**, per the brief's map. No deleted id
   remains in the body.

## Where each of the six went (and the split-skill re-pointing)

| Listed target (old) | Live route | New home |
| --- | --- | --- |
| team-operating-rules (deleted id) | `kai-core-operating-rules` | `## Verify before you publish`, before routing a fact you don't own to its owner |
| workspace-conventions (deleted id) | `kai-core-workspace-paths` | `## Kai standards`, before touching workspace state for exploratory/coordinated work |
| work-coordination (deleted id) | `kai-core-work-acting` | `## Kai standards`, before keeping raw material under `.kai/runs/` |
| work-coordination (deleted id) | `kai-core-work-item` | `## Kai standards`, before claiming or handing off the item |
| asset-lifecycle (deleted id) | `kai-core-asset-producing` | `## Kai standards`, before creating the initiative draft as a durable artifact |
| `kai-core-work-activity` (kept) | `kai-core-work-activity` | `## Finish with a verdict`, when the run's verdict is recorded |
| `kai-core-scope-discipline` (kept) | `kai-core-scope-discipline` | `## Kai standards`, before changing the agreed scope of a document |

`kai-core-peer-communication` was also dead as a bare mention before this task;
it is now routed at `## Verify before you publish`, to record load-bearing
confirmations rather than assume an owner agreed. That brings the live route set
to the seven-skill matrix plus the two universals (`kai-core-contract-v1`,
`kai-core-operating-rules`).

`routedSkills` after the fixes:

```json
["kai-core-operating-rules","kai-core-peer-communication","kai-core-contract-v1","kai-core-workspace-paths","kai-core-work-acting","kai-core-work-item","kai-core-asset-producing","kai-core-scope-discipline","kai-core-work-activity"]
```

All nine ids the matrix requires now fire; none did before except
`kai-core-contract-v1`.

## The degraded-mode refusal — kept

The brief instructed keeping the first `## Kai standards` paragraph. Its refusal
already states the three required facts and already matches the frozen validator
wording, so it was left verbatim:

> If core is unavailable or incompatible, continue only with direct, single-shot
> documentation work; do not create `.kai` state, claim coordinated work, or
> report Kai activity. State the limitation once and tell the operator to install
> or update `kai-core`.

- **Fact 1** — continue only with direct, single-shot own-domain work: *"continue
  only with direct, single-shot documentation work."*
- **Fact 2** — no `.kai` state, no coordinated-work claim, no Kai activity: *"do
  not create `.kai` state, claim coordinated work, or report Kai activity."*
- **Fact 3** — tell the operator to install or update core: *"tell the operator to
  install or update `kai-core`."*

## Lifecycle calls

- **`kai-core-asset-closing` — not added.** Not in this agent's matrix. It
  prepares documentation via `kai-core-asset-producing` and hands the decision to
  `@operator`; it never publishes, merges, or closes an asset's lifecycle itself
  ("`Ready` means ready for the operator's decision. It never means published.").
- **`kai-core-work-granting` — not added.** Not in the matrix; the agent claims
  and hands off an item (`kai-core-work-item`) but grants no lease.

## Notes and borderline calls

- The two paragraphs after the old route list (the run/draft paths and the
  "never publish, merge, or send to customers" scope discipline) were kept; the
  scope-discipline route now sits with the latter.
- The char count rose rather than fell. That is expected: six real route
  sentences carry more text than one broken hoisted clause, and the task's
  success criterion is firing routes, not token count.
