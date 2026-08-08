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
kai/coordination/items/csv-export-ui.md             in-review, lease held by QA
kai/coordination/items/csv-export-scheduling.md     proposed, never built
kai/coordination/threads/csv-export-api.md          six handoffs, need to prod
kai/initiatives/INDEX.md
kai/initiatives/csv-export/artifacts/brief.md       the accepted need
kai/initiatives/csv-export/artifacts/decision.md    streaming vs. file, with the
                                                    rejected options and a
                                                    revisit trigger
```

Note what is **absent**: no `kai/library/` types, no `.kai/runs/` areas, no
personal sub-lanes. Lanes are created on first write, so this workspace only
contains lanes it actually used. The doctor reports it healthy anyway — an
absent lane is not a defect.

## The five things worth reading for

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
`csv-export-ui` is finished and self-reviewed, but its required independent
verification hasn't returned — so it sits at `in-review` with `next_role`
pointing at `principal-qa-ui` and a lease held against version 5. That is the
honest state, not a stalled one.

**5. `shipped` means a human shipped it.**
`csv-export-api` is `shipped` only because the operator deployed on 2026-03-04
*and* 24h of production verification is recorded. Without both it would have
stopped at `release-ready`. No agent deploys, and no agent awards itself
`shipped`.

## Try the same shape yourself

```text
Initialize this repository as a kai workspace.
Then: I need users to be able to export a saved report as CSV.
```

The front door (`director-chief-of-staff`) will route to the PM for the brief,
the architect for the decision, and engineering for implementation — producing
the same kind of records you see above.
