# Example: end-to-end feature delivery

A committed snapshot of a real kai workspace mid-flight. It shows one feature —
a CSV export — travelling from need to production, and one adjacent idea that
was deliberately *not* built.

This is a **fixture, not a template**: don't copy it into your repo. Read it to
see what the state you'll produce actually looks like, then run
`workflow-workspace-init` in your own workspace.

It is validated in CI:

```bash
node scripts/workspace-doctor.mjs --root examples/e2e-feature-delivery
# ✓ workspace healthy — claimable
```

## What's here

```text
.kai/manifest.json                                  schema 2, repository mode
kai/coordination/ACTIVE.md                          what the team is on
kai/coordination/BOARD.md                           derived index
kai/coordination/items/csv-export-api.md            shipped
kai/coordination/items/csv-export-ui.md             in-review, awaiting QA
kai/coordination/items/csv-export-scheduling.md     proposed, never built
kai/coordination/threads/csv-export-api.md          need -> prod, no skipped state
kai/coordination/threads/csv-export-ui.md           design review, QA pending
kai/initiatives/INDEX.md
kai/initiatives/csv-export/artifacts/brief.md       the accepted need
kai/initiatives/csv-export/artifacts/decision.md    streaming vs. file, with the
                                                    rejected options and a
                                                    revisit trigger
kai/initiatives/csv-export/artifacts/design-api.md  the endpoint design
kai/initiatives/csv-export/artifacts/design-ui.md   the approved UI design
kai/initiatives/csv-export/artifacts/ship-log.md    readiness verdict, deploy
                                                    handoff, production
                                                    verification
```

Note what is **absent**: no `kai/library/` types and no `.kai/runs/` areas. Those
two output-only lanes are created on first write, so this workspace contains
only the ones it actually used — and it used neither. The doctor reports it
healthy anyway; an absent output lane is not a defect. `kai/personal/` is absent
for a different reason: it is gitignored everywhere, so it never appears in a
committed snapshot even though onboarding does seed it.

The commit SHAs (`4f1c8ae`, `9b2d017`) belong to the fictional `reporting-service`
and `web` repositories this workspace describes; they do not resolve in the kai
repository. In a real workspace a `change_ref` resolves with `git show`.

## The six things worth reading for

**1. Scope was routed, not absorbed.**
While implementing the endpoint the backend engineer found that recurring
scheduling was nearly free. Free is not the test. Scheduling is a new
capability, so it went to `csv-export-scheduling` as a committed proposal for
`principal-product-manager` to decide. Read the "Why this is a proposal" section
there — the point is that nothing was lost *and* nothing was smuggled in.

**2. The engineer wrote the tests.**
`csv-export-api` cites `services/reporting/tests/export/` as the implementing
engineer's own unit and integration tests. QA appears later, doing independent
system verification. QA is not a sink for tests the author should have written.

**3. Reviews are bound to a revision.**
Both completed reviews on `csv-export-api` carry `change_ref: 4f1c8ae`, the same
SHA as the item. A review of an older ref does not count; a new commit
invalidates it and the reviewer runs again.

**4. `in-review` did not become `release-ready` by momentum.**
`csv-export-ui` is finished and its design-conformance review has returned, but
the required independent system verification hasn't — so it sits at `in-review`
with `next_role` pointing at `principal-qa-ui` and an unheld lease waiting to be
claimed. That is the honest state, not a stalled one.

**5. A net-new surface needs a designer, whether or not anyone asked.**
`csv-export-ui` adds a user-facing control, so the `kai-core-definition-of-done` design
sign-off sub-gate fires **from the diff**. It carries an approved
`design-ui.md` and a `principal-product-designer` conformance verdict bound to
`9b2d017`. Absent both, the only other legal path is an operator-recorded
waiver — never a self-declared "this one is minor".

**6. `shipped` means a human shipped it, and no state was skipped.**
`csv-export-api` walks `release-ready -> deploying -> production-verification ->
shipped`, one thread entry and one version bump each. It is `shipped` only
because the operator ran the deploy handoff in `ship-log.md` *and* the recorded
verification window closed clean. No agent deploys, and no agent awards itself
`shipped`.

## Try the same shape yourself

```text
Initialize this repository as a kai workspace.
Then: I need users to be able to export a saved report as CSV.
```

The front door (`director-chief-of-staff`) will route to the PM for the brief,
the architect for the decision, and engineering for implementation — producing
the same kind of records you see above.
