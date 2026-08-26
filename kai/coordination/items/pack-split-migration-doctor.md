---
type: work-item
id: pack-split-migration-doctor
title: Migration doctor — uninstall-first, coexistence-refused, workspace-provenance migration
initiative: pack-split
milestone: first-pack-extracted
delivery_class: product-change
state: in-progress
resume_state: null
priority: 40
owner: principal-swe-infra
next_role: principal-swe-infra
target: pack-split migration doctor (legacy uninstall + coexistence refusal)
artifact_target: null
context_artifacts:
  - kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
  - scripts/workspace-doctor.mjs
  - skills/kai-core-workspace-onboarding/SKILL.md
touches:
  - scripts/workspace-doctor.mjs
  - scripts/lib/migration-doctor.mjs
  - skills/kai-core-workspace-onboarding/SKILL.md
  - test/fixtures/
  - test/README.md
  - docs/getting-started.md
  - docs/reference/plugin-structure.md
  - CHANGELOG.md
  - README.md
  - package.json
  - package-lock.json
  - plugin.json
  - .github/plugin/marketplace.json
depends_on:
  - item: pack-split-generator-gates
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-security
    kind: independent-security
  - role: principal-sre
    kind: independent-reliability
completed_reviews: []
change_ref: null
version: 3
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-25-2140
---

## Outcome

`scripts/workspace-doctor.mjs` verifiably uninstalls legacy `kai` before any pack install, refuses
coexistence when both legacy `kai` and `kai-core` are detected, migrates an existing `.kai` workspace's
provenance, and surfaces the fresh-session notice — so no install ends with two copies of a core skill loaded.

## Acceptance

*Tightened by the steward at promotion 2026-08-25-1803 against `main` at `v0.62.0`. **One**
finding-driven change only, nothing added and no bar raised: the bundled "local commands + CI
green" criterion is **split**, because that exact bundling bounced `pack-split-generator-gates`
at the 2026-08-24-2244 DoD gate and has been split on every product-change item since — two
claims with two evidence sources cannot share one checkbox. Criteria 1-4 and the version-bump
criterion are unchanged from v1.*

- [ ] The doctor detects a legacy `kai` install and requires its uninstall before installing packs.
- [ ] Detected coexistence (legacy `kai` + `kai-core`) refuses rather than proceeds.
- [ ] An existing `.kai` workspace's provenance is migrated without corruption (idempotent; safe on partial).
- [ ] The fresh-session notice ("core installed; not active until a new session starts") is surfaced.
- [ ] `node scripts/workspace-doctor.mjs --self-test` and `npm test` pass **locally**.
- [ ] The `validate` workflow is **green on the pushed PR** at the reviewed `change_ref`.
- [ ] Version bumped on `0.x` with CHANGELOG + README stamp.

## Evidence

- **Implementation, uncommitted, on `main` in the working tree at `C:\src\kai`** (2026-08-25-2140,
  `principal-swe-infra`). No branch, no commit, no SHA — see the HANDOFF for why.
  - `scripts/lib/migration-doctor.mjs` (new) — the read-only evidence layer: host config +
    install-tree inventory, provenance classification, reconciliation, findings, remediation.
  - `scripts/workspace-doctor.mjs` — `--migration-check` mode, the `reportMigration` printer, the
    `plugin` closed-set change, and `migrationSelfTest()` wired into the existing `--self-test`.
  - `test/fixtures/host-installs.json` (new) — 13 host homes + 4 workspaces, materialized into a
    temp dir by the self-test.
  - Release metadata `0.62.0 -> 0.63.0`: `package.json`, `package-lock.json` (both version
    fields), `plugin.json`, `.github/plugin/marketplace.json` (`metadata.version` + the single
    `plugins[]` entry — still N=1, still `source: "."`, no pack entry), `CHANGELOG.md`
    (`## [0.63.0] - 2026-08-25` + compare link), `README.md` `## Status`.
  - Docs: `test/README.md` (the scenario matrix), `docs/getting-started.md` (when to run it),
    `docs/reference/plugin-structure.md` (the check table row),
    `skills/kai-core-workspace-onboarding/SKILL.md` (the `plugin` provenance paragraph).
- **Unverified — nothing was executed.** No `npm test`, no `--self-test`, no `node --check`, no
  `git` command of any kind. Every acceptance box therefore stays unchecked; the encoded proof
  exists but has never been run. See the HANDOFF for the exact blocker.
- **Host layout evidence (verified, one host only).** `$COPILOT_HOME/config.json` on Windows,
  read 2026-08-25 at `C:\Users\senrique\.copilot`: JSONC (opens with two `//` lines, so plain
  `JSON.parse` fails), `installedPlugins[]` carrying `name`/`marketplace`/`version`/`cache_path`/
  `enabled`/`source`/`source_sha`, `marketplace: ""` for a direct install, tree at
  `installed-plugins/_direct/<owner>--<repo>/`. **Unverified:** the marketplace bucket layout —
  never observed, so the doctor labels any non-`_direct` bucket *inferred* rather than asserting
  it. macOS and cloud layouts are equally unverified (that is `pack-split-host-semantics-spike`).

## Notes

- Runs in parallel with `pack-split-generated-pack-trees` (disjoint touches: `workspace-doctor.mjs`
  vs the generator/trees).
- Security review: legacy contract collision + uninstall-first/coexistence is a trust/safety boundary.
  Reliability review: provenance migration must not corrupt an existing workspace.
- Reliable cross-host legacy detection is informed by `pack-split-host-semantics-spike`.

### Implementation — 2026-08-25-2140 (`principal-swe-infra`)

**`ready -> in-progress`, `owner: null -> principal-swe-infra`, v2 -> v3. No lease taken**
(sole worker on a disjoint touch set; `holder` stays `null`, as on every prior infra item in
this initiative). `change_ref` stays `null` because **nothing was committed** — the
implementation exists only as uncommitted edits in the working tree on `main`.

**What the check reads, and where it stops.** It is one read of two surfaces and nothing else:

```text
  $COPILOT_HOME/                                   workspace root/
    config.json  (JSONC)                             .kai/manifest.json
      installedPlugins[]                               "plugin": kai | kai-core
        name / marketplace / cache_path                        │
             │                                                 │
             │  reconcile: metadata <-> disk                   │
             ▼                                                 │
    installed-plugins/                                         │
      _direct/<owner>--<repo>/plugin.json   (direct)           │
      <bucket>/<plugin>/plugin.json         (marketplace,      │
                                             inferred)         │
             │                                                 │
             └──────────────► findings ◄───────────────────────┘
                                 │
                    clear  │  blocked  │  unknown
                  (proceed)│ (refused) │ (not settled — never "clear")
```

Nothing crosses that boundary: no uninstall, no delete, no rewrite of the host config or
`.kai/manifest.json`. The self-test snapshots every fixture file before and after and requires
them byte-identical, so "read-only" is asserted rather than promised.

**Routine implementation choices, decided here (no architecture deviation).**

- **Opt-in `--migration-check`, not part of the default `doctor` run.** The default run
  validates a *workspace*; making it read the *host* would change what a green `doctor` means
  and would fail in environments that have no host home at all.
- **A separate `scripts/lib/migration-doctor.mjs`.** `workspace-doctor.mjs` keeps one CLI
  surface (`touches` names it, and `npm test` already runs its `--self-test`), while the
  evidence layer stays a pure module the self-test can drive case by case. Pack names are
  derived from `PACK_ORDER`/`packPluginName` in `pack-plan.mjs`, never restated — a sixth pack
  is detected without a second list.
- **Fixtures as one committed data file, not committed directories.** A host cache tree and an
  empty directory are not faithfully reproducible through a git checkout; the self-test
  materializes `test/fixtures/host-installs.json` into a temp dir and removes it.
- **No new CI step.** Coverage rides the existing `workspace-doctor --self-test`, which
  `npm test` and `.github/workflows/validate.yml` already run. No dependency was added
  (Node built-ins only).
- **`.kai/manifest.json` `"plugin"` widened from `kai` to the closed set `{kai, kai-core}`.**
  Required, not optional: the doctor previously hard-failed any workspace whose provenance had
  been migrated, so the migration it prescribes produced a workspace its own default run
  rejected. A third value is still an error. `schema_version` is **not** bumped and no ladder
  step was added — provenance is which plugin wrote the workspace, not which contract version.
- **`unknown` is a first-class verdict.** A missing host home, an unreadable config, a junk
  entry, an unidentifiable tree, or a provenance inferred from a cache path all report
  `unknown` with the evidence named, and `unknown` exits non-zero. There is no success-shaped
  fallback: "nothing is installed" is claimed only when both surfaces were readable and every
  entry classified.

**`touches` reconciled, not expanded** (same discipline as the steward's promotion pass): four
paths this item's own criteria already imply are now declared — `scripts/lib/migration-doctor.mjs`
(the module behind the CLI named in `touches`), and `test/README.md`, `docs/getting-started.md`,
`docs/reference/plugin-structure.md` (where a new check has to be documented). No new capability,
no new gate, no pack published: `COMMITTED_PACKS` is still empty and the marketplace index still
lists exactly one plugin.

**Review requirements — a discrepancy to settle, not to resolve unilaterally.** The dispatching
instruction asked for **architecture + security** review at the same exact ref. This record's
`review_requirements` are **`principal-security` / independent-security** and **`principal-sre` /
independent-reliability**. The record is authoritative and was **not** edited: neither review was
dropped, and no architecture review was added. Whether an architecture review is additionally
required is a steward/director call. Either way **none of them can bind yet** — every review
must cite an exact `change_ref`, and there is none.

### Steward promotion — 2026-08-25-1803 (`principal-product-manager`)

**`proposed -> ready`, priority 20 -> 40, `next_role: principal-product-manager ->
principal-swe-infra`, version 1 -> 2.** No lease taken (lease was and stays `null`); nothing
dispatched, no branch, no commit, no code, no CI, no marketplace change.

- **Why it is promotable now, and only now.** Its sole `depends_on` entry —
  `pack-split-generator-gates (requires: shipped)` — has been satisfied since 2026-08-25
  (`v0.58.0`), but the item sits in `first-pack-extracted`, which was **outside**
  `scope.current` and therefore behind the one-way valve regardless of readiness (recorded in
  this thread by `workflow-ship` at 2026-08-25-1125). That valve opened in this same pass:
  `dependency-guarantees` closed 5 of 5 `shipped` and **`scope.current` advanced to
  `first-pack-extracted`**. Dependency satisfaction did not promote this item; the scope change
  did.
- **Why priority 40 — behind the spike, not ahead of it.** `principal-swe-infra` is still the
  initiative's single-owner bottleneck. `pack-split-host-semantics-spike` (priority 30) keeps
  the lead because it **gates** `pack-split-generated-pack-trees` and its answer can rewrite the
  extraction plan, and because its completion is `@operator` host-time rather than infra time.
  This item is the parallel arm: decomposition **WS#8** runs it alongside **WS#7**, and both
  must ship before `pack-split-first-department`.
- **Touch-conflict check (steward's hypothesis; the director re-runs it at dispatch).**
  Disjoint from the spike, which touches only its own artifact under
  `artifacts/reliability/`. Disjoint from `generated-pack-trees` (`packs/**`,
  `scripts/pack-preview.mjs`, `.gitattributes`) by design — WS#8 owns `workspace-doctor.mjs`,
  WS#7 owns the generator. **`touches` was reconciled at promotion**, not expanded: the six
  release-metadata paths this item's own version-bump criterion already implies
  (`CHANGELOG.md`, `README.md`, `package.json`, `package-lock.json`, `plugin.json`,
  `.github/plugin/marketplace.json`) are now declared, so a concurrent release would collide
  **visibly** instead of silently. `marketplace.json` is a **version stamp only** — this item
  adds no pack entry and publishes nothing.
- **No dependency was added on the spike.** The `Notes` line above stands as written:
  cross-host legacy detection is *informed* by the spike, not gated on it, exactly as
  decomposition WS#8 declares. Adding one would be a DAG change the ratified plan does not
  support. If the spike returns a **bad** answer, that is a steward + architect matter for
  `generated-pack-trees`, and it reaches this item only if the detection mechanism itself is
  invalidated — raise it rather than absorbing it.
- **Evidence-basis discipline carries here.** Any claim this item makes about behaviour on a
  host nobody ran must be labelled the way this initiative has labelled operator-attested
  evidence since the `generator-gates` ship gate: **verified** (observed on a host) or
  **unverified**. That is existing practice, not a new criterion.
- **Unchanged, deliberately:** the outcome, criteria 1-4, `delivery_class: product-change`,
  `required_for_milestone: true`, `milestone: first-pack-extracted`, `owner: null` (the
  director grants the lease), and **both** required reviews —
  `principal-security` / `independent-security` and `principal-sre` /
  `independent-reliability`. Uninstall-first and coexistence-refusal are a trust boundary and a
  workspace-corruption risk; neither review was trimmed to make the queue move faster.
