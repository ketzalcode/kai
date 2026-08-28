# Board

Derived index, regenerated from the authoritative `kai/coordination/items/*.md`
records by `director-chief-of-staff`. If a row here ever disagrees with its
item file, the item record wins and this table is refreshed — never edited by
hand as if it were the source of truth.

`✅` in the depends-on column marks a dependency **verified satisfied** on that
date. It records reconciliation only — it does **not** change the row's `state`,
and it does not make a `proposed` item executable. Only the steward promotes
`proposed -> ready`.

`ready` is a steward commitment, **not** a statement that an item can run now: a
`ready` row whose depends-on column is marked **unmet** must still fail the
director's dependency check at dispatch. *Executable* is derived at dispatch
time and is never stored on a record.

| id | title | initiative | milestone | priority | state | owner | next | depends-on | waiting-on | updated |
|----|-------|------------|-----------|----------|-------|-------|------|------------|------------|---------|
| pack-split-partition-lock | Lock the five-pack partition (authoritative docs) | pack-split | partition-lock | 10 | completed | — | — | — | — | 2026-08-24-1959 |
| pack-split-engineering-decomposition | Decompose the build & ship milestones into sequenced items | pack-split | dependency-guarantees | 10 | completed | — | director-chief-of-staff | partition-lock (completed) | — | 2026-08-24-2013 |
| pack-split-generator-gates | Harden generator + multi-manifest gates (foundation) | pack-split | dependency-guarantees | 10 | shipped | principal-swe-infra | — | partition-lock (completed) | — | 2026-08-25-1136 |
| pack-split-preflight-compat | Combined preflight + version-compat, CI byte-pinned | pack-split | dependency-guarantees | 10 | shipped | principal-swe-infra | — | generator-gates (shipped ✅ 2026-08-25) | — | 2026-08-25-1328 |
| pack-split-crosspack-validator | Cross-pack reference validator (3 firing paths + assets + hooks-once) | pack-split | dependency-guarantees | 20 | shipped | principal-swe-infra | — | generator-gates (shipped ✅ 2026-08-25) | — | 2026-08-25-1440 |
| pack-split-host-semantics-spike | Spike — host semantics before extraction | pack-split | first-pack-extracted | 30 | completed | principal-swe-infra | principal-product-manager | partition-lock (completed ✅ 2026-08-25) | — | 2026-08-26-1320 |
| pack-split-degraded-refusal | Canonical degraded-mode refusal block, CI-pinned | pack-split | dependency-guarantees | 40 | shipped | principal-swe-infra | — | preflight-compat (shipped ✅ 2026-08-25) | — | 2026-08-25-1612 |
| pack-split-ci-partition-checks | Real CI partition/collision/skew gates + namespace (fleet rename) | pack-split | dependency-guarantees | 50 | shipped | principal-swe-infra | — | preflight-compat (shipped ✅ 2026-08-25), crosspack-validator (shipped ✅ 2026-08-25) — both met | — | 2026-08-25-1751 |
| pack-split-generated-pack-trees | Generate committed-unpublished core + personal trees | pack-split | first-pack-extracted | 10 | shipped | principal-swe-infra | — | all 6 dependencies met ✅ 2026-08-26 | — | 2026-08-26-1443 |
| pack-split-migration-doctor | Migration doctor — uninstall-first, coexistence-refused, provenance | pack-split | first-pack-extracted | 40 | shipped | principal-swe-infra | — | generator-gates (shipped ✅ 2026-08-25) — met | — | 2026-08-26-1250 |
| pack-split-first-department | Prove kai-core + personal installs over the boundary | pack-split | first-pack-extracted | 10 | shipped | principal-swe-infra | — | generated-pack-trees (shipped ✅ 2026-08-26), migration-doctor (shipped ✅ 2026-08-26) — both met | — | 2026-08-26-1550 |
| pack-split-host-gates | Host gates — macOS + cloud + install-order evidence | pack-split | first-pack-extracted | 10 | completed | principal-swe-infra | — | first-department (shipped ✅ 2026-08-26), migration-doctor (shipped ✅ 2026-08-26) — both met | — | 2026-08-26-1806 |
| pack-split-pack-dependency-manifests | Define generated-pack dependency manifests and install semantics | pack-split | five-pack-split-shipped | 10 | shipped | principal-swe-infra | — | host-gates (completed ✅ 2026-08-26) — met | — | 2026-08-27-1155 |
| pack-split-onboarding-installer | Honest guided onboarding installer | pack-split | five-pack-split-shipped | 20 | shipped | principal-swe-infra | — | generated-pack-trees (shipped), migration-doctor (shipped), pack-dependency-manifests (shipped) — all met | — | 2026-08-27-1304 |
| pack-split-release-12a | Release 12a — migration notice on 0.x | pack-split | five-pack-split-shipped | 20 | shipped | principal-swe-infra | — | onboarding-installer (shipped ✅ 2026-08-27), migration-doctor (shipped ✅ 2026-08-26) — both met | — | 2026-08-27-1339 |
| pack-split-release-12b | Release 12b — minimal 1.0.0 flip (publish core+personal, retire monolith) | pack-split | five-pack-split-shipped | 20 | shipped | principal-swe-infra | — | host-gates (completed ✅ 2026-08-26), pack-dependency-manifests (shipped ✅ 2026-08-27), onboarding-installer (shipped ✅ 2026-08-27), release-12a (shipped ✅ 2026-08-27) — all met | — | 2026-08-27-1458 |
| pack-split-release-12c | Release 12c — SUPERSEDED umbrella: remaining departments + cleanup (decomposed into 12c-1..12c-4) | pack-split | five-pack-split-shipped | 20 | dropped | — | — | release-12b (shipped ✅ 2026-08-27) — met | — | 2026-08-27-1523 |
| pack-split-release-12c-1-hardening | Release 12c-1 — pre-publish surface hardening (rollback derivation, provenance reversal, fixtures, CI matrix) on 1.0.1 | pack-split | five-pack-split-shipped | 10 | shipped | principal-swe-infra | — | release-12b (shipped ✅ 2026-08-27) — met | — | 2026-08-27-1645 |
| pack-split-review-lens-binding | Decision — keep the three review lenses runtime-dispatched on workflow-doc-review | pack-split | five-pack-split-shipped | 20 | completed | — | — | — | — | 2026-08-27-1645 |
| pack-split-release-12c-2-product | Release 12c-2 — generate and publish kai-product (first three-pack publish) on 1.0.2 | pack-split | five-pack-split-shipped | 30 | shipped | principal-swe-infra | — | release-12c-1-hardening (shipped ✅ 2026-08-27) — met | — | 2026-08-27-1709 |
| pack-split-release-12c-3-engineering | Release 12c-3 — generate and publish kai-engineering, preserving runtime-dispatched review lenses, on 1.0.3 | pack-split | five-pack-split-shipped | 40 | shipped | principal-swe-infra | — | release-12c-2-product (shipped ✅ 2026-08-27), review-lens-binding (completed ✅ 2026-08-27) — both met | — | 2026-08-27-1736 |
| pack-split-release-12c-4-gtm | Release 12c-4 — generate and publish kai-gtm, remove split scaffolding, finalize on 1.0.4 | pack-split | five-pack-split-shipped | 50 | in-review | principal-swe-infra | workflow-ship | release-12c-3-engineering (shipped ✅ 2026-08-27) — met | — | 2026-08-27-1745 |

Regenerated by `director-chief-of-staff` from the item records; if a row here
disagrees with its item file, the item record wins.

**Builder and review pass 2026-08-27-1745 — GTM `1.0.4` routed to
`workflow-ship`.** `pack-split-release-12c-4-gtm` moved
`ready -> in-progress -> in-review` (v2 -> v4), then both independent reviews
completed under serial reviewer leases (v4 -> v8). Implementation, SRE, and
architecture bind to exact ref
`1ad873725e62f53efd0c0005edd897e1672c915b`; both verdicts are **APPROVED**,
P0/P1/P2 = 0/0/0. Full `npm test` passed; five packs generated 139 files;
GTM is 11 agents/2 skills and the full partition is 56/51;
`COMMITTED_PACKS` aliases `PACK_ORDER`; the staged marketplace is exactly five
packs at `1.0.4`; rollback forbids all pack names and removes four departments
before core; no canonical root agent or skill body changed. The item remains
`in-review` for fresh final-head CI, operator merge, live probe, tag, and
release. The milestone remains open at 7/8; nothing is claimed shipped.

**Steward pass 2026-08-27-1736 (`principal-product-manager`) — engineering
reconciled; GTM is the sole ready final release.**
`pack-split-release-12c-3-engineering` remains truthfully `shipped`; its
fulfilled steward handoff is cleared. Its reviewed ref, approvals, operator
merge, successful final-head and exact-main CI, isolated four-pack marketplace
verification, annotated `v1.0.3`, public release, and canonical ship record
remain intact. `pack-split-release-12c-4-gtm` alone moved
`proposed -> ready` (v1 -> v2), priority 50, owner and lease clear, next
`principal-swe-infra`; its sole dependency is met. The accepted final-publish
scope and `1.0.4` are unchanged. The milestone remains open at 7/8; no GTM
implementation, dispatch, milestone closure, or initiative closure occurred.

**Builder pass 2026-08-27-1716 (`principal-swe-infra`) — engineering routed
to independent review.** `pack-split-release-12c-3-engineering` moved
`ready -> in-progress -> in-review` (v3 -> v5), with owner
`principal-swe-infra`, lease clear, and `next_role: principal-sre`.
`change_ref` is exactly `27804defe2f5f7fa16c2f5373884691203d21974`.
The existing SRE and architecture requirements remain independent and bind to
that ref. Full `npm test` passed at its working content; the generated
four-pack slice and 1.0.3 surfaces match scope. **DO NOT BIND** is preserved:
zero diff to the root `workflow-doc-review` body and the three named review-lens
override entries relative to pre-implementation main. No approval, final-head
CI, merge, tag, release, publication, or milestone closure is claimed.

**Steward pass 2026-08-27-1709 (`principal-product-manager`) — two item rows
changed and five release-chain rows reconciled.** `pack-split-release-12c-2-product`
remains truthfully `shipped`; its fulfilled PM handoff is cleared.
`pack-split-release-12c-3-engineering` alone moved `proposed -> ready` at
priority 40 with `next_role: principal-swe-infra`, owner and lease clear. Both
dependencies are met. The settled **DO NOT BIND** decision remains authoritative:
the three lenses stay runtime-dispatched, and acceptance retains zero-diff
checks for the canonical `workflow-doc-review` body and all three named
`SKILL_OWNER_OVERRIDES` entries. `pack-split-release-12c-4-gtm` remains
`proposed`; nothing was dispatched or implemented.

**Steward pass 2026-08-27-1523 (`principal-product-manager`) — five rows edited,
pending the director's next regeneration.** The 12c decomposition is accepted and
the queue is reopened. `pack-split-release-12c-1-hardening` `proposed -> ready`
at **priority 10** (`next_role: principal-swe-infra`) — the single executable head
of the initiative; `pack-split-review-lens-binding` `proposed -> ready` at
priority 20 (`next_role: principal-swe-architect`), **parallel and touch-disjoint**
from `12c-1` (a decision artifact under `kai/initiatives/` against scripts,
fixtures and CI), so both may hold leases at once. `pack-split-release-12c`
`proposed -> dropped` (v4) as superseded by its four children — it holds no
`change_ref`, no reviews and no production state, and
`five-pack-split-shipped.required_items` no longer names it. `12c-2`/`12c-3` rows
re-stamp their depends-on columns against the promoted upstreams and stay
`proposed` with unmet dependencies — the steward promotes each in the pass that
follows its predecessor's ship, so **`ready` stays an executable queue, not a wish
list**. The `12c-2` row also carries a recorded steward decision (department order
`product -> engineering -> gtm`, confirmed against the records). Milestone
`five-pack-split-shipped` is now **4 of 8** typed required items. No
implementation, generated tree, marketplace, version, tag, release, or
publication state changed, and nothing was dispatched.

**Manager pass 2026-08-27-1508 (`principal-swe-manager`) — five rows added, one
row edited, pending the director's next regeneration.** `pack-split-release-12c`
was decomposed into `12c-1..12c-4` plus one knowledge decision; its row is now
the **umbrella** (title and `next_role` updated, v3) and **must not be
dispatched** — it cannot represent four releases under a forward-only lifecycle
or four reviewed refs under a one-`change_ref` review binding. The five new rows
are **all `proposed`**: none is promoted, and adding them changes no state. **The
`ready` queue is still empty** — accurate, not a stall; the next action is a
steward pass (retype `five-pack-split-shipped.required_items` to the four release
children, then promote), not a dispatch. *(Superseded 2026-08-27-1523: the retype
and both promotions are done; the queue is no longer empty.)* When promoted, the
two items with no unmet dependency are `pack-split-release-12c-1-hardening` and
`pack-split-review-lens-binding`; the four release rows share nearly identical
touch sets (`scripts/lib/pack-plan.mjs`, the marketplace, every version surface)
and are strictly serial — there is no parallelism to recover between them. No
implementation, generated tree, marketplace, version, tag, release, or
publication state changed.

**Steward pass 2026-08-27-1458 (`principal-product-manager`) — two rows edited
to match the records, pending the director's next regeneration.**
`pack-split-release-12b` `ready` -> `shipped` (v15): the row was three states
stale after the `release-ready -> deploying -> production-verification ->
shipped` walk, flagged in the ship record's §Follow-ups; the fulfilled
`next_role` handoff is now discharged to `—`. `pack-split-release-12c` stays
`proposed` (v2) with `next_role: principal-swe-manager` for a sizing pass — its
dependency is met and it fits scope, but the record cannot represent three
staged department publishes under a forward-only lifecycle and a one-ref review
binding. **The `ready` queue is empty**; that is accurate, not a stall. The next
action is a slicing decision, not a dispatch, and the director must not treat
12c's satisfied dependency as executability. No implementation, marketplace,
version, tag, release, or publication state changed.

**Steward pass 2026-08-27-1337 (`principal-product-manager`).**
All four typed dependencies were verified at their required terminal states.
`pack-split-release-12b` alone moved `proposed -> ready` (v4 -> v5), priority
20, owner/lease clear, next `principal-swe-infra`. It is dependency-satisfied
and executable at dispatch subject to the normal touch-conflict recheck.
Release 12c remains proposed and unmodified; no implementation or release
action occurred.

**Builder pass 2026-08-25-2140 (`principal-swe-infra`) — one row edited to match the record.**
`pack-split-migration-doctor` `ready -> in-progress` (v2 -> v3, `owner: principal-swe-infra`, **no
lease**). The implementation is complete in the working tree and **uncommitted**: that session had
no shell, so there is **no branch, no commit, no SHA, and no test or CI run**. `change_ref` stays
`null`, so **neither required review can bind yet**. The row is `in-progress`, not `in-review`,
for exactly that reason. The live `ready` queue is unchanged:
`pack-split-host-semantics-spike` (30, `@operator` host session needed).

**Steward pass 2026-08-25-1803 (`principal-product-manager`) — two rows edited to match the
records, pending the director's next regeneration.** `pack-split-migration-doctor`
`proposed -> ready` (priority 20 -> 40, `next_role: principal-swe-infra`, v1 -> v2) and
`pack-split-generated-pack-trees` re-dated (v2 -> v3, still `proposed`, deliberately not
promoted). `northstar.scope.current` advanced `dependency-guarantees -> first-pack-extracted`
after that milestone closed 5 of 5 required items `shipped`. The live `ready` queue is
`pack-split-host-semantics-spike` (30, `@operator` host session needed) then
`pack-split-migration-doctor` (40, dependency met and dispatchable); their touch sets are
disjoint. Every other `first-pack-extracted` and `five-pack-split-shipped` row stays `proposed`.

**Steward pass 2026-08-26-1558 (`principal-product-manager`).**
`first-pack-extracted` is open at 3/4: three required product items are
`shipped`; `pack-split-host-gates` is `ready`, priority 10, lease clear, and is
the sole executable item. The downstream proposed chain is
`pack-dependency-manifests -> onboarding-installer -> release-12a ->
release-12b -> release-12c`; dependency manifests are now a typed `shipped`
milestone requirement. No downstream item was promoted while
`scope.current` remains `first-pack-extracted`.

**Director dispatch 2026-08-26-1607 (`principal-swe-infra`).**
The sole executable item was leased serially, dispatched, and handed back
`blocked` with its lease clear. The canonical minimal-smoke artifact and exact
macOS/cloud packets are prepared. `Q-pack-split-host-gates-01` requests a real
macOS run; `Q-pack-split-host-gates-02` asks whether an already-authorized
managed cloud source exists. Release 12b is NO-GO. No pack was published and
marketplace topology remains unchanged.

**Evidence binding 2026-08-26-1702 (`principal-swe-infra`).**
The macOS arm passed on run `33024791572`; Q-01 is answered. Cloud task
`7160810a-a4e1-43eb-bc97-d6f8e2f53aad` / run `33024086802` provisioned no
plugin and is indeterminate; Q-03 is answered without inferring
default-branch-only behavior or direct-spec rejection. The item remains
`blocked` at v11, resumes `in-progress`, lease clear, `change_ref: null`, and
waits only on `Q-pack-split-host-gates-04`: operator authorization for one
disposable default-branch consumer-repository fixture with a positive control.
Release 12b remains NO-GO; packs remain unpublished.

**Consumer cloud proof 2026-08-26-1740 (`principal-swe-infra`).**
The operator authorized Q-04 and the private disposable consumer fixture loaded
the marketplace control plus both direct Kai packs (`3/3`). Independent cloud
tasks invoked the core contract in the parent and through a successful child
task. The item resumed `blocked -> in-progress` at v12 with no waiting question.
Selected-agent arguments are absent from exported host events and repository
hooks did not fire; that limitation is recorded for SRE. The next step is a
commit-bound evidence revision and independent reliability review. Release 12b
remains NO-GO.

**Review routing 2026-08-26-1745 (`principal-swe-infra`).**
The canonical evidence is committed at
`c4d0b376542116c0e13fbb50e4d1ae17eeea653e`. The item is `in-review` at v13
and routes to `principal-sre` for the exact selected-agent telemetry judgment
and release 12b recommendation. No waiting question remains; the fixture stays
private only through review.

**SRE correction pass 2026-08-26-1752.**
SRE returned changes required at `c4d0b376…`: exact child identity, cloud
source pin, and stale macOS positive assertions. Later-ingested cloud session
records now name `kai-personal:persona-self` in the task arguments and bracket
its nested core invocation. GitHub history binds the cloud source to Kai
`fe562b936…` / pack `0.64.0`, and the macOS packet now matches the retained
contract output. The item is back `in-progress` at v14 until the corrected
evidence receives a new `change_ref` and SRE re-review.

**SRE re-review routing 2026-08-26-1758.**
Corrected evidence is commit-bound at
`263452126179dd9f3a61183903a26a90c4d6b1c1`. The item is `in-review` at v15,
routes to `principal-sre`, and retains release 12b NO-GO until ratification.

**Host-gate completion 2026-08-26-1805.**
SRE ratified exact `change_ref`
`263452126179dd9f3a61183903a26a90c4d6b1c1` with P0/P1/P2 `0/0/0`. The
knowledge item is `completed` at v16. Host-gates is GO; release 12b remains
NO-GO for the downstream dependency-manifest, onboarding, and release-12a
chain.

**Steward transition 2026-08-26-1806 (`principal-product-manager`).**
PR #174 is merged to `main` at `b6db547c…`; main validation run
`33028413182` / job `98375047081` succeeded, and the disposable consumer
repository was deleted after evidence preservation. `first-pack-extracted`
closed at 4/4 and `scope.current` advanced to `five-pack-split-shipped`.
`pack-split-pack-dependency-manifests` alone moved `proposed -> ready` (v2 ->
v3), priority 10, owner/lease clear, next `principal-swe-infra`; its host-gate
dependency is met. All later items remain proposed. Release 12b remains NO-GO.
