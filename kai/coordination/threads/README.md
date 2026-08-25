# Threads

One durable, **append-only** communication log per work item, named
`<item-id>.md`, mirroring `kai/coordination/items/<item-id>.md`. Nothing here is
ever edited or deleted after the fact — only appended. Full contract:
`kai-core-work-coordination`.

## Packet types

**HANDOFF** — every transfer between roles:

```markdown
## HANDOFF <YYYY-MM-DD-HHMM> — <from-role> -> <to-role>
- did:       <completed work or decision>
- state:     <state written to the item record>
- needs:     <next acceptance criteria>
- artifacts: <paths, diff, PR, reports>
- evidence:  <workspace-root-relative paths + source/tool + capture timestamp>
- questions: <open question IDs or "none">
- next:      <role and why>
```

A handoff with no `needs` or `next` is incomplete.

**QUESTION / ANSWER** — stable-ID blocking/non-blocking exchange:

```markdown
## QUESTION Q-<item-id>-<NN> <ts> — <from-role> -> @<to-role>
- status: open
- kind: fact | decision | reply | action
- blocking: yes | no
- context: <why this matters>
- ask: <one specific question>
- answer_by: <timestamp or "next-dispatch">
```

```markdown
## ANSWER Q-<item-id>-<NN> <ts> — <from-role> -> @<asker>
- status: answered
- answer: <answer in the role's lane>
- lane: in-lane | out-of-lane: <correct role>
- provenance: live-peer | durable-thread | operator
```

"Open" always means *no matching answered ANSWER packet exists for that
question ID* — never trust the original QUESTION's `status: open` after an
ANSWER has been appended. `@operator` is reserved for a `decision`, `reply`, or
`action` question that no kai role owns.

**COLLISION** — a role's verify step failed (its lease was lost or
overwritten); it stops before writing product state:

```markdown
## COLLISION <YYYY-MM-DD-HHMM> — <role> lost lease on <item-id>
- expected: holder=<self> token=<dispatched> version=<dispatched>
- observed: holder=<current> token=<current> version=<current>
- action:   stopped before writing product state; returned to grantor
```

**RECOVERY** — the grantor reclaims a stale lease only after reconciling
repository/thread state:

```markdown
## RECOVERY <YYYY-MM-DD-HHMM> — <grantor> -> <redispatched-role | @operator>
- reclaimed:   <item-id>
- stale_lease: holder=<prior> token=<prior-token> expired=<timestamp>
- observed:    <partial product/coordination work found, or "none">
- disposition: safe-to-resume | conflicting-partial-work (escalated to @operator)
- new_lease:   holder=<role> token=<fresh-token> version_at_grant=<n>   # safe-to-resume only
- state:       <lifecycle state written to the item record>
- next:        <role and why, or "@operator — awaiting conflict resolution">
```

**WAIVER** — a steward/operator-waived design-acceptance step:

```markdown
## WAIVER <YYYY-MM-DD-HHMM> — design-step waived on <item-id>
- kind:       product-design
- grantor:    <steward-role | @operator>
- reason:     <why the interaction change is safe without a design pass>
- applies_at: version <n>
- confirmed:  change_ref <SHA> | pending
- scope:      <what is waived; what still requires design if it changes>
- expires:    <revision/condition that voids the waiver, or "this change_ref only">
```

Anything decision-changing or cross-session lands on the thread even if it was
already answered live through a real-time peer channel.
