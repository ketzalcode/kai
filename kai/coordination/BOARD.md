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
| pack-split-preflight-compat | Combined preflight + version-compat, CI byte-pinned | pack-split | dependency-guarantees | 10 | release-ready | principal-swe-infra | @operator | generator-gates (shipped ✅ 2026-08-25) | — | 2026-08-25-1310 |
| pack-split-crosspack-validator | Cross-pack reference validator (3 firing paths + assets + hooks-once) | pack-split | dependency-guarantees | 20 | ready | — | principal-swe-infra | generator-gates (shipped ✅ 2026-08-25) | — | 2026-08-25-1139 |
| pack-split-host-semantics-spike | Spike — macOS/cloud host semantics before extraction | pack-split | first-pack-extracted | 30 | ready | — | principal-swe-infra | partition-lock (completed ✅ 2026-08-25) | — | 2026-08-25-1139 |
| pack-split-degraded-refusal | Canonical degraded-mode refusal block, CI-pinned | pack-split | dependency-guarantees | 40 | ready | — | principal-swe-infra | preflight-compat (shipped — **unmet**, not dispatchable) | — | 2026-08-25-1148 |
| pack-split-ci-partition-checks | Real CI partition/collision/skew gates + namespace (fleet rename) | pack-split | dependency-guarantees | 50 | ready | — | principal-swe-infra | crosspack-validator (shipped — **unmet**), preflight-compat (shipped — **unmet**); not dispatchable | — | 2026-08-25-1148 |
| pack-split-generated-pack-trees | Generate committed-unpublished core + personal trees | pack-split | first-pack-extracted | 20 | proposed | — | principal-product-manager | generator-gates (shipped ✅ 2026-08-25), crosspack-validator, preflight-compat, degraded-refusal, ci-partition-checks (shipped); host-semantics-spike (completed) | — | 2026-08-24-2240 |
| pack-split-migration-doctor | Migration doctor — uninstall-first, coexistence-refused, provenance | pack-split | first-pack-extracted | 20 | proposed | — | principal-product-manager | generator-gates (shipped ✅ 2026-08-25) | — | 2026-08-24-2011 |
| pack-split-first-department | Prove kai-core + personal installs over the boundary | pack-split | first-pack-extracted | 20 | proposed | — | principal-product-manager | generated-pack-trees (shipped), migration-doctor (shipped) | — | 2026-08-24-2011 |
| pack-split-host-gates | Host gates — macOS + cloud + install-order evidence | pack-split | first-pack-extracted | 20 | proposed | — | principal-product-manager | first-department (shipped), migration-doctor (shipped) | — | 2026-08-24-2011 |
| pack-split-onboarding-installer | Honest guided onboarding installer | pack-split | five-pack-split-shipped | 20 | proposed | — | principal-product-manager | generated-pack-trees (shipped), migration-doctor (shipped) | — | 2026-08-24-2011 |
| pack-split-release-12a | Release 12a — migration notice on 0.x | pack-split | five-pack-split-shipped | 20 | proposed | — | principal-product-manager | onboarding-installer (shipped), migration-doctor (shipped) | — | 2026-08-24-2011 |
| pack-split-release-12b | Release 12b — minimal 1.0.0 flip (publish core+personal, retire monolith) | pack-split | five-pack-split-shipped | 20 | proposed | — | principal-product-manager | host-gates (completed), release-12a (shipped), onboarding-installer (shipped) | — | 2026-08-24-2240 |
| pack-split-release-12c | Release 12c — publish remaining departments + cleanup (1.0.x) | pack-split | five-pack-split-shipped | 20 | proposed | — | principal-product-manager | release-12b (shipped) | — | 2026-08-24-2011 |

Regenerated by `director-chief-of-staff` from the item records; if a row here
disagrees with its item file, the item record wins.
