# pack-split — deliverables

Index of promoted, durable outputs for this initiative. Required to be non-empty
at closure, with every milestone's `required_items` satisfied. Promotion is
one-way and steward-approved:
`.kai/runs/ -> kai/initiatives/pack-split/artifacts/ -> kai/library/<type>/`.

| deliverable | milestone | source item | artifact path | promoted to library | status |
|-------------|-----------|-------------|---------------|---------------------|--------|
| Locked five-pack partition (authoritative docs) | partition-lock | pack-split-partition-lock | kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md | — | completed / accepted |
| Engineering delivery decomposition (14-item build & ship plan) | dependency-guarantees | pack-split-engineering-decomposition | kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md | — | completed / accepted |
| Release record — pack generator + multi-manifest gates (`0.58.0`) | dependency-guarantees | pack-split-generator-gates | kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md | **promoted 2026-08-25** → kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md | **SHIPPED 2026-08-25** (`v0.58.0`, merge `47aa0549…`) |
| Release record — combined fail-closed preflight + version-compat (`0.59.0`) | dependency-guarantees | pack-split-preflight-compat | kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md | **promoted 2026-08-25** → kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md | **SHIPPED 2026-08-25** (`v0.59.0`, merge `67670525…`, production verification PASSED) |
| Release record — cross-pack reference validator, invoked assets, hooks-exactly-once (`0.60.0`) | dependency-guarantees | pack-split-crosspack-validator | kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md | **promoted 2026-08-25** → kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md | **SHIPPED 2026-08-25** (`v0.60.0`, merge `32a07a9a…`, `main` run `32902043562` success, production verification PASSED 7/7) |
| Release record — canonical degraded-mode refusal instruction, CI-pinned (`0.61.0`) | dependency-guarantees | pack-split-degraded-refusal | kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal/ship-record.md | **promoted 2026-08-25** → kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal/ship-record.md | **SHIPPED 2026-08-25** (`v0.61.0`, merge `680ca445…`, `main` run `32909692506` success, production verification PASSED 8/8) |
| Release record — four named CI partition gates + `kai-core-*` namespace enforcement (`0.62.0`) | dependency-guarantees | pack-split-ci-partition-checks | kai/library/releases/2026-08-25/04-ship-pack-split-ci-partition-checks/ship-record.md | **promoted 2026-08-25** → kai/library/releases/2026-08-25/04-ship-pack-split-ci-partition-checks/ship-record.md | **SHIPPED 2026-08-25** (`v0.62.0`, merge `b72453f1…`, `main` run `32916653342` success, production verification PASSED 9/9) |
| Host-semantics extraction-gate evidence | first-pack-extracted | pack-split-host-semantics-spike | kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md | — | completed 2026-08-26; conditional extraction GO |
| Migration-doctor release record (`0.63.0`) | first-pack-extracted | pack-split-migration-doctor | kai/library/releases/2026-08-26/01-ship-pack-split-migration-doctor/ship-record.md | **promoted 2026-08-26** → kai/library/releases/2026-08-26/01-ship-pack-split-migration-doctor/ship-record.md | **SHIPPED 2026-08-26**; security + reliability reviews complete |
| Generated committed-unpublished core + personal trees (`0.64.0`) | first-pack-extracted | pack-split-generated-pack-trees | kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md | **promoted 2026-08-26** → kai/library/releases/2026-08-26/02-ship-pack-split-generated-pack-trees/ship-record.md | **SHIPPED 2026-08-26** (`2eea0f04…`; production verification PASSED 6/6; no pack published) |
| Core + personal real-install proof | first-pack-extracted | pack-split-first-department | kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md | **promoted 2026-08-26** → kai/library/releases/2026-08-26/03-ship-pack-split-first-department/ship-record.md | **SHIPPED 2026-08-26** (PR #171; merge `9a800e4e…`; main run `33020918358` success; production verification PASSED 5/5; reviewed `change_ref 3b14dc6…` preserved; no publication/version bump) |
| Host-gate minimal-smoke evidence | first-pack-extracted | pack-split-host-gates | kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md | — | **COMPLETED 2026-08-26**; macOS + cloud PASS; SRE ratified `2634521…`; PR #174 merged as `b6db547c…`; main validation `33028413182` / `98375047081` succeeded; disposable consumer deleted after evidence preservation; host-gates GO; release 12b still NO-GO |

The **release record** for `pack-split-first-department` is closed at
`shipped`. `workflow-ship` deliberately restored its prior
`resume_state: release-ready`, then walked `deploying` and
`production-verification` before the terminal state. PR #171's required check
and exact-merge main check both succeeded. Read-only verification proved review
ancestry, byte-identical reliability evidence, canonical-record presence, zero
forbidden-path drift from `342cd8e…`, marketplace N=1 at `source: "."`, and
unchanged unpublished pack trees. The enabling release remains `v0.64.0`;
no version, tag, GitHub release, marketplace edit, or pack publication occurred.
`first-pack-extracted` now has all 4 of 4 typed requirements satisfied:
three product items are `shipped` and `pack-split-host-gates` is `completed`.
The bounded evidence records genuine GitHub-hosted Apple Silicon macOS PASS
and cloud PASS through a disposable default-branch consumer fixture. Host
session records bind `kai-personal:persona-self` to its nested core invocation;
SRE ratified exact `change_ref 2634521…`. Host-gates is GO. Release 12b remains
NO-GO for the downstream dependency-manifest, onboarding, and release-12a
chain. PR #174 merged to `main` as `b6db547c…`; main validation run
`33028413182`, job `98375047081`, succeeded, and the disposable consumer
repository was deleted after evidence preservation. The steward closed
`first-pack-extracted`, advanced scope to `five-pack-split-shipped`, and
promoted only `pack-split-pack-dependency-manifests`.

The **release record** for `pack-split-degraded-refusal` was written by `workflow-ship` at the
2026-08-25-1554 DoD gate — verdict **RELEASE-READY**, all six dimensions **Clear**, none waived —
and **closed at the 2026-08-25-1612 CONFIRM-START + CONFIRM-COMPLETE run (verdict SHIPPED)**.
It records a completed ship: the six-dimension evidence, including check run `contract`
**`97997128517`** (run **`32908330221`**, `conclusion: success`, 12s, `total_count: 1`) at PR head
**`75053e08551e6865df501e85d25888b19693af72`**, which closed the one criterion only CI could
close; the rollout and rollback plans; the operator deploy handoff with its abort criteria; and
the 8-check production verification, now **executed and PASSED 8 of 8**. The operator
squash-merged **PR #158** at **2026-08-25T23:12:06Z** into merge commit
**`680ca445a2616bc9bc1b972db6b40042c06abf6c`** — single parent `e679de9d…`, the exact PREPARE
base, so **no rebase** and both review bindings survive — then tagged and published **`v0.61.0`**
(annotated tag `e88857db…` peeling to that commit, release `376770741`, not draft, not
prerelease). The `main` `validate` run **`32909692506`** is `conclusion: success` at that
`head_sha`, job `contract` **`98001208870`** green in 16s with the two load-bearing steps —
`Validate plugin contract` and `Pack generator self-test` — among the 10 that ran.
**kai merged, tagged, released and published nothing**; every deployment action was the
operator's, and every production fact was re-derived read-only against the merge commit rather
than the worktree. **Rollback was never invoked.** `change_ref` stays at
`8d3ef4844988f4974e6bec8f406a7723dee4e942`, the object both reviews bind — deployment moves
state, not the reviewed ref. Its language remains constrained by the security review's
truth-binding, and the **published release note was read and holds it**: every generated
**department** agent **carries a pinned, correctly ordered refusal instruction** that cannot
drift from core — with no claim that any agent refuses, detects contract loss or degrades
gracefully, and none that a pack is generated, committed or published. Six PROPOSALs and one
blast-radius update were parked in the initiative backlog at the gate, so no reviewer finding
ships unowned. Because the record's move into its canonical directory rode the same records
commit as the merge, **no post-ship reconciliation is owed**.

The **release record** for `pack-split-ci-partition-checks` was written by `workflow-ship` at the
2026-08-25-1750 DoD gate — verdict **RELEASE-READY**, all six dimensions **Clear**, with
`principal-qa-ui`/UX-walk and the product-design step waived on the northstar's recorded line that
this initiative is a developer-facing packaging change with no user-facing interaction surface —
and **closed at the 2026-08-25-1751 CONFIRM-START + CONFIRM-COMPLETE run (verdict SHIPPED,
production verification PASSED 9 of 9)**. It now records a completed ship. The operator
squash-merged **PR #160** at **2026-08-26T00:50:07Z** into merge commit
**`b72453f1ed46393e77722995212920b9f8615c79`** — single parent `16493a303c…`, the branch's own
base, so **no rebase** — then tagged and published **`v0.62.0`** (annotated tag `cf91008b…`
peeling to that commit, release `376800860`, not draft, not prerelease). The `main` `validate` run
**`32916653342`** is `conclusion: success` at that `head_sha`, job `contract` **`98021655301`**
green in **15s**, with **the four new gates individually `success` as named steps in the `main`
run** and eleven substantive steps green in total; the `pull_request`-only release-guard is
correctly `skipped` on a push event, and `check-runs total_count: 1`.

**The binding was proven at the object level rather than attested.** The merge commit's complete
root tree is **byte-identical to the ratified `aca16e56…` on every top-level entry except `kai/`**
(coordination and library records) — so what runs in production is, byte-for-byte, what the
architecture review ratified, and the binding survived two head moves and a squash without anyone's
word for it. `change_ref` stays at `aca16e56…`: deployment moves state, not the reviewed ref.
Against base, only the eleven declared top-level entries moved, `agents` is identical
(`c0284f31…`, so no agent body changed and no new tool grant landed), and **`packs` is absent**
from the merge root tree, proven positively from a `truncated: false` listing. The published
**release note was read in full and holds the recorded language constraints**: it states the
breaking rename of a user-invocable skill with no alias ("Update direct invocations to the new
name"), says no pack tree is committed or published and the marketplace remains the monolithic
`kai` plugin, and re-introduces none of the host-resolution language the A2 finding removed.
**kai merged, tagged, released and published nothing**; every deployment action was the operator's
and every production fact was re-derived read-only against the merge commit rather than the
worktree. **Rollback was never invoked.** Because the record's move into its canonical directory
rode the same records commit as the merge — verified present at the merge SHA — **no post-ship
reconciliation is owed**. Three PROPOSALs parked at the gate remain open: **N4**, **N5** and the
ship gate's own **S1** on renaming a user-invocable skill without an alias — shipping closed none
of them. Milestone `dependency-guarantees` now has **5 of 5** required items `shipped`; that is a
count, not a closure, and declaring the milestone met is the **steward's** call, as is closing
decomposition **Open Question 4**. `pack-split-generated-pack-trees` moves from 4 of 6 to **5 of
6** dependencies met and stays `proposed` and non-dispatchable.

The **release record** for `pack-split-crosspack-validator` was written by `workflow-ship`
at the 2026-08-25-1435 DoD gate (verdict **RELEASE-READY**, all six dimensions Clear, none
waived) and **closed at the 2026-08-25-1440 CONFIRM-START + CONFIRM-COMPLETE run (verdict
SHIPPED)**. It now records a completed ship: the six-dimension evidence — including the
PR-side run `32900688907` / job `contract`, 11/11 steps `success`, which closed the one
criterion only CI could close — the rollout and rollback plans, the operator deploy handoff,
and the executed production verification. The operator squash-merged PR #156 at
2026-08-25T21:38:09Z into `32a07a9a56a6b244586f9048b6bb395e86e43020`; `main` run
**`32902043562`** concluded **`success`** at that exact head with `Validate plugin contract`
and `Pack generator self-test` both green — the steps the new cross-pack, asset-ownership and
hooks-assignment checks ride in — and annotated tag `v0.60.0` plus its published release peel
to the merge commit. Production verification **PASSED 7 of 7, every check re-derived
read-only** against the merge commit itself, including `COMMITTED_PACKS = []` with **no
`packs/` tree** proven positively from the root tree, marketplace still N=1, and the `agents`
and `skills` trees **byte-identical to base** — the validator landed without editing a single
shipped body. Rollback was never invoked, and the record was updated in place with the
deployment record and the executed verification. Its library promotion was already complete at
`kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md`, inside
the same records commit as the merge, so **no post-ship reconciliation is owed**.

The **release record** for `pack-split-preflight-compat` was written by `workflow-ship`
at the 2026-08-25-1310 DoD gate (verdict **RELEASE-READY**, all six dimensions Clear,
none waived). It records the six-dimension evidence — including GitHub Actions run
`32893764931` / job `contract`, `conclusion: success`, 11/11 steps on `ubuntu-latest`,
which closed the one criterion only CI could close — plus the rollout plan, the rollback
plan, the operator deploy handoff for merging PR #154 and cutting `v0.59.0`, and the
production-verification checks and evidence owed at CONFIRM-COMPLETE. **It is now
`shipped`** — `workflow-ship` ran CONFIRM-START + CONFIRM-COMPLETE at 2026-08-25-1328:
the operator squash-merged PR #154 into `67670525808be349466155b836a7fdbbe4dfb8b7`,
`main` run `32895404267` concluded **`success`** at that exact head, and annotated tag
`v0.59.0` plus its published release **peel to the merge commit**. Production
verification **PASSED** — five of six checks re-derived read-only against the merge
commit (version coherence across all eight locations, marketplace still exactly one
entry, `COMMITTED_PACKS = []` with **no `packs/` tree**, the probe skill present, the
tag peel), with only the per-job step breakdown left operator-attested after a **403**
on the jobs endpoint. Rollback was never invoked, and the record was updated in place
with the deployment record and the executed verification. Its library promotion is
**complete** at
`kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md`;
the move changed coordination records only.

The locked partition document is accepted and closes the `partition-lock`
milestone (its one required item, `pack-split-partition-lock`, reached
`completed` with the `independent-architecture` review ratified against
`change_ref fd44f4f…`). It stays an initiative artifact (not promoted to
`kai/library/`).

The engineering decomposition (accepted by the steward 2026-08-24) turns the
`dependency-guarantees`, `first-pack-extracted`, and `five-pack-split-shipped`
milestones into **14 sized/sequenced `proposed` work-item records** (12 required
IDs + 2 manager splits: `pack-split-generator-gates`, `pack-split-host-semantics-spike`).
It is a decision artifact (stays under `artifacts/decisions/`, not promoted to
library) — the durable *deliverables* it plans are produced as those items ship.

The **release record** for `pack-split-generator-gates` was written by
`workflow-ship` at the 2026-08-24-2252 DoD gate re-run (verdict RELEASE-READY, all
six dimensions Clear) and **closed at the 2026-08-25-1125 CONFIRM-COMPLETE run
(verdict SHIPPED)**. It now records a completed ship: the six-dimension evidence,
the rollout and rollback plans (rollback was never invoked), the deployment
evidence — PR #152 merged 2026-08-25T18:20:55Z into `47aa0549f89b1733483dd6b662a4787d621c9430`,
released as `v0.58.0` — and the executed production verification (version coherence
across all six locations, exactly one `kai` marketplace entry at `source: "."`, and
**no `packs/` tree on `main`**, all re-derived read-only; `main` CI conclusion and the
annotated-tag peels are recorded as operator-attested because this environment has no
shell and `api.github.com` returned 403).

**Promotion is complete (reconciled 2026-08-25-1136).** The record now lives at its
canonical home, `kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md`.
The operator executed the outstanding `git mv` from the pre-promotion path
`kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md`,
which no longer exists. The earlier gap was recorded rather than faked — `workflow-ship`
could not create directories in that environment — and it was a filing-location gap in a
durable record, never a production gap. The move changed no implementation, release
metadata, or verification fact, and `kai/` is not a `BEHAVIOR_PREFIX`, so no second version
bump was required.

`dependency-guarantees` is **CLOSED** as of the steward pass 2026-08-25-1803 — **5 of 5**
required items at `shipped` (`v0.58.0` → `v0.62.0`), each with a production ship record above.
Closure was taken on the acceptance lines, not the count: two of them were **narrowed** at
closure (the preflight and the refusal ship in every generated **department**-pack agent; CI
errors if a **core** agent carries either), and the uncovered core case stays open as backlog
proposal **A1**, bound as a promotion precondition on `pack-split-generated-pack-trees`.
`scope.current` advanced to **`first-pack-extracted`**, whose four required items
(`generated-pack-trees`, `migration-doctor`, `first-department`, `host-gates`) have produced **no
deliverable yet** — the next durable outputs owed are the host-semantics reliability record and
the migration doctor's release record.
