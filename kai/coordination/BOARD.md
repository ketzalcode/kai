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
| pack-split-pack-dependency-manifests | Define generated-pack dependency manifests and install semantics | pack-split | five-pack-split-shipped | 10 | release-ready | principal-swe-infra | @operator | host-gates (completed ✅ 2026-08-26) — met | — | 2026-08-27-1150 |
| pack-split-onboarding-installer | Honest guided onboarding installer | pack-split | five-pack-split-shipped | 20 | proposed | — | principal-product-manager | generated-pack-trees (shipped), migration-doctor (shipped), pack-dependency-manifests (shipped — unmet) | — | 2026-08-26-1558 |
| pack-split-release-12a | Release 12a — migration notice on 0.x | pack-split | five-pack-split-shipped | 20 | proposed | — | principal-product-manager | onboarding-installer (shipped), migration-doctor (shipped) | — | 2026-08-24-2011 |
| pack-split-release-12b | Release 12b — minimal 1.0.0 flip (publish core+personal, retire monolith) | pack-split | five-pack-split-shipped | 20 | proposed | — | principal-product-manager | host-gates (completed ✅ 2026-08-26) — met; pack-dependency-manifests (shipped), release-12a (shipped), onboarding-installer (shipped) — unmet; NO-GO | — | 2026-08-26-1558 |
| pack-split-release-12c | Release 12c — publish remaining departments + cleanup (1.0.x) | pack-split | five-pack-split-shipped | 20 | proposed | — | principal-product-manager | release-12b (shipped) | — | 2026-08-24-2011 |

Regenerated by `director-chief-of-staff` from the item records; if a row here
disagrees with its item file, the item record wins.

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
