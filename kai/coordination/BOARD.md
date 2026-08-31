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
| pack-split-release-12c-4-gtm | Release 12c-4 — generate and publish kai-gtm, remove split scaffolding, finalize on 1.0.4 | pack-split | five-pack-split-shipped | 50 | shipped | principal-swe-infra | — | release-12c-3-engineering (shipped ✅ 2026-08-27) — met | — | 2026-08-27-1753 |
| pack-split-director-summary | Write the stable director closure summary for pack-split | pack-split | five-pack-split-shipped | 10 | completed | — | — | release-12c-4-gtm (shipped ✅ 2026-08-27) — met | — | 2026-08-27-1802 |
| area-plugins-scope-brief | PM scope brief — area-focused standalone plugins over an optional core | area-plugins | decisions-locked | 10 | completed | — | — | — | — | 2026-08-27-1839 |
| area-plugins-optional-core-architecture | Architecture — optional core, dual-path standalone/full mode, composability | area-plugins | decisions-locked | 10 | completed | — | — | scope-brief (completed ✅ 2026-08-27) — met | — | 2026-08-27-1906 |
| area-plugins-taxonomy-decision | Architecture — area plugin taxonomy, incl. creative-video-director placement | area-plugins | decisions-locked | 20 | completed | — | — | scope-brief (completed ✅ 2026-08-27) — met | — | 2026-08-27-1906 |
| area-plugins-migration-architecture | Architecture — marketplace rename, packs/ -> plugins/, v1.0.4 user migration | area-plugins | decisions-locked | 30 | completed | — | principal-product-manager | scope-brief, taxonomy-decision (completed ✅) — met | — | 2026-08-27-2228 |
| area-plugins-taxonomy-round-3 | Round-3 taxonomy — nine plugins, kai-directors + kai-project-management accepted | area-plugins | decisions-locked | 5 | completed | — | — | — | — | 2026-08-27-2225 |
| area-plugins-host-tool-conformance | P0 — live host-tool conformance probe (first implementation) | area-plugins | allowlist-repair | 1 | shipped | 4d71177 | — | — | — | 2026-08-28-0215 |
| area-plugins-tool-allowlist-fix | P0 — migrate tool declarations to portable aliases | area-plugins | allowlist-repair | 1 | production-verification | 4db3c90 | @operator | host-tool-conformance (shipped ✅ 2026-08-28) — met | interactive startup warning observation | 2026-08-28-0240 |
| area-plugins-surface-tree-rename | Rename the committed product tree from packs to plugins | area-plugins | surface-rename | 1 | in-review | principal-swe-infra | workflow-pull-request | — | — | 2026-08-31-0927 |
| area-plugins-m2-decomposition | Decompose optional-core-contract into sequenced shippable PRs | area-plugins | optional-core-contract | 10 | completed | — | director-chief-of-staff | optional-core-architecture (completed ✅), taxonomy-decision (completed ✅) — both met | — | 2026-08-27-1944 |
| area-plugins-m2-standalone-copy | Standalone-mode user-facing copy (C1 mode line, two paths, disclaimers) | area-plugins | optional-core-contract | 10 | completed | — | — | — | — | 2026-08-27-2015 |
| area-plugins-m2-planpacks-prefix | D3 — planPacks() prefix condition, asserted byte-neutral | area-plugins | optional-core-contract | 20 | ready | — | principal-swe-infra | migration-architecture (completed ✅ 2026-08-27) — **MET; executable, implementation withheld** | — | 2026-08-27-1944 |
| area-plugins-m2-standalone-floor | Name and pin the standalone operating floor | area-plugins | optional-core-contract | 30 | ready | — | principal-swe-infra | planpacks-prefix (ready) — **unmet** | — | 2026-08-27-1944 |
| area-plugins-m2-claim-surface-pin | CLAIM_SKILLS core-only + --gate partition extension (C2 predecessor) | area-plugins | optional-core-contract | 40 | ready | — | principal-swe-infra | standalone-floor, planpacks-prefix — **unmet** | — | 2026-08-27-1944 |
| area-plugins-m2-mode-selection | Three-way mode selection (full / standalone / refuse) | area-plugins | optional-core-contract | 50 | ready | — | principal-swe-infra | claim-surface-pin (requires **shipped** — C2) — **unmet**; standalone-copy (completed ✅) — met | — | 2026-08-27-1944 |
| area-plugins-m2-standalone-proof | Prove standalone behavior in preview and CI | area-plugins | optional-core-contract | 60 | ready | — | principal-swe-infra | mode-selection — **unmet** | — | 2026-08-27-1944 |
| area-plugins-m2-doctor-standalone | Doctor must stop reporting a core-less install as blocked (steward ruling (a)) | area-plugins | optional-core-contract | 70 | ready | — | principal-swe-infra | mode-selection — **unmet** | — | 2026-08-27-1944 |
| area-plugins-m2-docs-two-modes | Document the two modes and the upgrade transition | area-plugins | optional-core-contract | 80 | ready | — | principal-technical-writer | mode-selection, standalone-proof — **unmet** | — | 2026-08-27-1944 |
| area-plugins-taxonomy-round-2 | Second-round taxonomy — kai-directors, kai-project-management, full map | area-plugins | decisions-locked | 5 | completed | — | — | — | — | 2026-08-27-2140 |
| area-plugins-distributed-agents-proposal | Proposal framing — distributed multi-PC agent communication | area-plugins | decisions-locked | 90 | completed | — | — | — | — | 2026-08-27-2130 |
| area-plugins-readme-clarity | P0 — README/install clarity, planned against the final taxonomy | area-plugins | surface-rename | 90 | proposed | — | principal-technical-writer | final taxonomy — **unmet** | — | 2026-08-27-2125 |
| area-plugins-initiative-archive | P0 — initiative archive semantics | workspace-corpus-contract | corpus-honesty | 10 | proposed | — | principal-swe-infra | operator approval — **met** (2026-08-28); steward scope-acceptance — unmet | — | 2026-08-28-1344 |
| area-plugins-backlog-contract | P0 — one workspace + one initiative backlog destination | workspace-corpus-contract | corpus-honesty | 20 | proposed | — | principal-swe-infra | operator approval — **met** (2026-08-28); steward scope-acceptance — unmet | — | 2026-08-28-1344 |
| area-plugins-design-output-contract | P0 — canonical design/mock output paths | workspace-corpus-contract | corpus-honesty | 30 | proposed | — | principal-swe-infra | operator approval — **met** (2026-08-28); steward scope-acceptance — unmet | — | 2026-08-28-1344 |
| area-plugins-workspace-storage-modes | P0 — tracked / local-private workspace storage modes | workspace-corpus-contract | corpus-honesty | 40 | proposed | — | principal-swe-infra | operator approval — **met** (2026-08-28); steward scope-acceptance — unmet | — | 2026-08-28-1352 |
| asset-lifecycle-contract-release | Ship the universal asset lifecycle contract | asset-lifecycle-contract | contract-bound | 1 | in-review | principal-swe-infra | workflow-pull-request | — | — | 2026-08-28-1642 |
| asset-lifecycle-doctor-warnings | Add asset lifecycle doctor warnings and the derived catalog | asset-lifecycle-contract | enforcement-observable | 10 | ready | — | principal-swe-infra | contract-release (requires shipped) — unmet | — | 2026-08-28-1551 |
| asset-lifecycle-migration-enforcement | Reconcile legacy assets and enforce closure completeness | asset-lifecycle-contract | migration-complete | 20 | ready | — | principal-swe-infra | doctor-warnings (requires shipped) — unmet | — | 2026-08-28-1551 |
| area-plugins-fleet-observer-ux | Fleet-observer UX redesign — deferred until after the P0s | — | — | 900 | proposed | — | principal-product-manager | P0s + topology — **unmet** | — | 2026-08-27-2125 |

Regenerated by `director-chief-of-staff` from the item records; if a row here
disagrees with its item file, the item record wins.

**Director pass 2026-08-28-1352 — `workspace-corpus-contract` materialized; operator approval
reconciled; still `proposed`, not dispatchable.**
The operator explicitly approved the initiative and the recommended
audience-based workspace model. `kai/initiatives/workspace-corpus-contract/`
now exists (`northstar.md` `status: active`, `log.md`, `backlog.md`,
`deliverables.md`, and the ratified architecture decision at
`artifacts/decisions/workspace-corpus-contract-architecture.md`). The four
rows above move from `milestone: —` to `corpus-honesty` and their depends-on
column changes from "operator split go/no-go — unmet" to "operator approval —
met"; a new, narrower dependency, steward scope-acceptance, is now the
blocker. **`state` is unchanged (`proposed`) on all four** — this pass
reconciles metadata against the four item records, none of which was
promoted. No path move, schema change, doctor/onboarding change, mock
placement, backlog enforcement, or archive mechanic was implemented.

**Director pass 2026-08-28-0055 — host-tool probe executed; records-only reconciliation.**
The main agent implemented the probe in the working tree and ran it.
`area-plugins-host-tool-conformance` moved `blocked -> in-progress` and
`area-plugins-tool-allowlist-fix` moved `blocked -> ready`; the operator blocker
`Q-area-plugins-tool-allowlist-fix-01` is cleared on both. No script, manifest, agent, or skill
was edited by this pass.

**Runtime channel `observed` on CLI `1.0.79` and `1.0.81`:** `R2-primary` and `R8-repo-current`
valid direct *and* delegated, exercising read/edit/create/search/execute/agent; `R9-control`
confirmed the documented unrecognized-names-are-ignored rule against the live binary. Offline
self-test 11/11. **Validator channel is honestly `unobserved`** — prompt mode cannot reproduce the
interactive startup warning surface, so the user-reported warning stands unrefuted and **no
declaration migration or branch selection is authorized on this evidence**. No live baseline was
committed.

`area-plugins-host-tool-conformance` is deliberately **`in-progress`, not `in-review`**: the working
tree is uncommitted, so `change_ref` is `null` and the declared exact-ref architecture review has
nothing to bind to. Dispatch to `principal-swe-architect` is gated on a commit SHA.

**Director pass 2026-08-27-2245 — initiative artifacts materialized; nine-plugin taxonomy accepted;
milestone 1 closable.** 24 `area-plugins`-prefixed rows. Every lease is clear; no stale lease found.

The main agent **overrode two director/steward recommendations**, accepting `kai-directors` as an
executive routing layer with a bounded standalone exception, and `kai-project-management` seeded
from the core coordination workflows. Round 3 implemented the override and reconciled at
**56 agents / 51 skills**. Two round-2 mechanical findings were upheld and load-bearing: the
engineering weld held (`workflow-ship` / `workflow-pull-request` / `workflow-issue-analysis` stayed
in `kai-engineering`), which is the reason the nine-plugin map compiles at all.

`area-plugins-migration-architecture` reached `completed` after **four** independent reliability
reviews (0P0/4P1 -> 0P0/1P1 -> 0P0/1P1 -> 0P0/0P1, `satisfies_requirement: true`). Its four P2
conditions ride with PR A-3's implementation and reopen no architecture. Milestone
`decisions-locked` is now closable by the steward.

`area-plugins-m2-planpacks-prefix`'s dependency is **met** and it is executable — but implementation
is **withheld** under the main agent's standing instruction not to edit shipped plugin behavior yet.
`area-plugins-m2-claim-surface-pin`'s typed edge was re-pointed from the superseded round 2 to
round 3 by director reconciliation.

**Milestone order:** `allowlist-repair` -> `decisions-locked` -> `optional-core-contract` ->
`surface-rename` -> `area-taxonomy-split` -> `migration-complete`, with `allowlist-repair` led by the
live conformance probe rather than a rename.

**Recorded honestly:** every gate, byte-parity, and CI claim across this initiative is `reported`,
never `observed` — no shell has existed in any session, so nothing has been executed. Thirteen
enumerated checks must be `observed` green before `area-taxonomy-split` merges. `pack-split`'s 23
terminal rows above are the archive noise the `workspace-corpus-contract` proposal addresses.

**Steward pass 2026-08-27-1802 — initiative SHIPPED; closure complete.**
The steward re-read all 18 authoritative typed required-item records across
the four non-empty milestone mappings and verified terminal closure at 1/1,
5/5, 4/4, and 8/8. The non-empty director summary and deliverables index point
to the final `1.0.4` evidence and retain monolith retirement, parked proposals,
and evidence limits. `pack-split` moved `active -> shipped` and left
`ACTIVE.md`; its permanent index row now carries the exact summary and
deliverables paths. `pack-split-director-summary` remains `completed` at v5
with no next role, owner, lease, or waiting question. This pass changed records
only.

**Director pass 2026-08-27-1800 — closure summary completed; final steward
closure next.** `pack-split-director-summary` is `completed` at v4 with owner,
lease, and question list clear. The canonical summary records all four
milestone closures, the live five-pack `1.0.4` outcome, monolith retirement,
and retained backlog/evidence limits. It changes records only. The initiative
remains `active` until `principal-product-manager` verifies the closure
prerequisites and performs the final `active -> shipped` transition.

**Steward pass 2026-08-27-1753 — final milestone CLOSED; director summary is
the sole ready closure item.** The steward verified all eight authoritative
`five-pack-split-shipped` item records at `shipped`, then cleared the final
GTM item's fulfilled PM handoff (v14 -> v15, release facts unchanged).
Canonical ship record 08 proves exactly five live marketplace packs at
`1.0.4`; release 12b retains monolith-retirement evidence. The initiative
remains `active` because the required `director-summary.md` is absent.
`pack-split-director-summary` was created and steward-promoted
`proposed -> ready` (v1 -> v2), priority 10, owner/lease clear, next
`director-chief-of-staff`. No plugin behavior changed.

**Ship pass 2026-08-27-1750 — GTM `1.0.4` shipped; milestone closure remains
PM-owned.** `workflow-ship` ran retrospective PREPARE, CONFIRM-START, and
CONFIRM-COMPLETE. PR #190 merged as `049764c…`; final-head run `33130820714`
and exact-main run `33130883171` each passed six jobs. A fresh operator-provided
no-ref probe browsed exactly five packs, installed all at `1.0.4`, idempotently
updated GTM, and returned clear/enabled/marketplace-only doctor results.
Annotated `v1.0.4` and its public release target the merge. The item is
`shipped` at v14 and routes to `principal-product-manager`. The milestone has
8/8 typed requirements at terminal state, but neither milestone nor initiative
closure is claimed.

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
