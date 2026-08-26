# Thread — pack-split-migration-doctor

Append-only communication log mirroring
`kai/coordination/items/pack-split-migration-doctor.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Extend `scripts/workspace-doctor.mjs` for verifiable uninstall-first of legacy `kai`, coexistence refusal, existing-`.kai` workspace-provenance migration, and the fresh-session notice. Size L. Owner `principal-swe-infra`; reviews `principal-security`/independent-security (legacy contract collision, trust boundary) + `principal-sre`/independent-reliability (provenance migration safety). Depends on `pack-split-generator-gates` (shipped); parallel with `pack-split-generated-pack-trees`.
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-migration-doctor.md; decomposition WS#8
- evidence:  scripts/workspace-doctor.mjs already carries schema_version + migrations[] ladder — captured 2026-08-24 from C:\src\kai
- questions: none (cross-host legacy detection informed by the host-semantics spike)
- next:      principal-product-manager — groom milestone-by-milestone.

## NOTE 2026-08-25-1125 — workflow-ship: dependency satisfied, but still blocked on scope

- `pack-split-generator-gates` reached **`shipped`** at 2026-08-25-1125 (PR #152 merged
  2026-08-25T18:20:55Z, merge commit `47aa0549f89b1733483dd6b662a4787d621c9430`, released
  `v0.58.0`). This item's **sole** `depends_on` entry is therefore **satisfied**.
- **Still NOT executable — and the reason is scope, not dependencies.** This item sits in
  milestone `first-pack-extracted`, which is **outside**
  `northstar.scope.current: [dependency-guarantees]`. Dependency satisfaction does not
  override the scope gate. It also remains `proposed`.
- `workflow-ship` reconciles dependencies only; it did not promote, dispatch, or
  re-prioritize, and changed no field on this record.
- For the steward: pulling this item forward would require a `scope.current` change, which
  is a `principal-product-manager` decision on the northstar, not a ship-gate one.

## HANDOFF 2026-08-25-1803 — principal-product-manager -> principal-swe-infra

- did:       **Promoted `proposed -> ready`** (v1 -> v2, priority 20 -> 40,
             `next_role: principal-swe-infra`, `owner` stays `null`, no lease). The scope change
             the NOTE above named as the blocker happened in this pass: `dependency-guarantees`
             closed **5 of 5 required items `shipped`** and **`scope.current` advanced to
             `first-pack-extracted`**. The sole `depends_on` entry
             (`pack-split-generator-gates`, `requires: shipped`) was verified against the record
             — `state: shipped`, v17, `change_ref 457254b973fb…`, `v0.58.0`.
             **Acceptance tightened in exactly one place, on a recorded finding:** the bundled
             "local commands + CI green" criterion is **split** into a local-suite criterion and
             a `validate`-green-on-the-pushed-PR criterion, because that bundling bounced
             `generator-gates` at the 2026-08-24-2244 DoD gate. Criteria 1-4 and the version-bump
             criterion are untouched.
             **`touches` reconciled, not expanded:** the six release-metadata paths this item's
             own version-bump criterion already implies (`CHANGELOG.md`, `README.md`,
             `package.json`, `package-lock.json`, `plugin.json`,
             `.github/plugin/marketplace.json`) are now declared, so a concurrent release
             collides visibly. `marketplace.json` is a **version stamp only** — no pack entry,
             nothing published.
- state:     ready
- change_ref: null (nothing built, nothing committed)
- needs:     `director-chief-of-staff` to dispatch when capacity allows, then
             `principal-swe-infra` to build. **Queue order is deliberate:**
             `pack-split-host-semantics-spike` (priority 30) leads because it gates
             `pack-split-generated-pack-trees` and its completion is `@operator` host-time;
             this item is priority 40 and is the parallel arm (decomposition WS#8 ∥ WS#7).
             Touch sets are disjoint from both the spike (artifact only) and the trees item
             (`packs/**`, `scripts/pack-preview.mjs`, `.gitattributes`), so if a second infra
             capacity exists — or while the spike waits on an operator host session — they can
             run concurrently; **that is a capacity call at dispatch, not a DAG change**.
             **No dependency on the spike was added:** WS#8 declares cross-host legacy detection
             *informed* by it, not gated on it.
             Both required reviews stand — `principal-security` / `independent-security` and
             `principal-sre` / `independent-reliability`. Uninstall-first, coexistence-refusal
             and provenance migration are a trust boundary and a workspace-corruption risk;
             neither review was trimmed to make the queue move.
- artifacts: kai/coordination/items/pack-split-migration-doctor.md (v2, `### Steward promotion —
             2026-08-25-1803`) · kai/initiatives/pack-split/northstar.md (`scope.current`) ·
             kai/initiatives/pack-split/log.md · BOARD.md · ACTIVE.md
- evidence:  `kai/coordination/items/pack-split-generator-gates.md` (`state: shipped`, v17) ·
             the five `dependency-guarantees` item records, all `state: shipped` ·
             `kai/library/releases/2026-08-25/04-ship-pack-split-ci-partition-checks/ship-record.md`
             (`v0.62.0`, merge `b72453f1…`, production verification 9/9) ·
             `kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md`
             (WS#8, and the critical path's "WS#7 ∥ WS#8" line)
- questions: none. `waiting_on_questions` stays `[]`.
- next:      **principal-swe-infra** (via the director) — design and build. This steward pass
             wrote no code, ran no command, took no lease, and dispatched nothing.

## HANDOFF 2026-08-25-2140 — principal-swe-infra -> principal-swe-infra (blocked on a shell)

- did:       **Built the migration doctor end to end, in the working tree, uncommitted.**
             `ready -> in-progress`, `owner: null -> principal-swe-infra`, v2 -> v3, **no lease**
             (sole worker, disjoint touches — same as every prior infra item here).
             New `scripts/lib/migration-doctor.mjs`: reads `$COPILOT_HOME/config.json` (parsed as
             **JSONC** — the real file opens with two `//` lines, so plain `JSON.parse` fails on
             every host) and every tree under `installed-plugins/`, reconciles metadata against
             disk, and classifies legacy `kai`, `kai-core`, department packs, and direct vs
             marketplace provenance. `scripts/workspace-doctor.mjs` gains an opt-in
             `--migration-check` mode (+ `npm run doctor:migration`), the printer, and a
             16-case `migrationSelfTest()` inside the existing `--self-test`.
             **Fail-closed:** `clear` / `blocked` / `unknown`, exit 0 only for `clear`. Legacy
             `kai` present is a refusal with the exact uninstall + confirm steps; legacy+pack
             coexistence is a **refusal**, not a warning. **Read-only:** no uninstall, delete or
             rewrite anywhere, proven by a before/after byte-identical tree snapshot in the
             self-test. **`unknown` is never success:** missing home, unreadable config, junk
             entry, unidentifiable tree, or provenance inferred from a cache path all report
             `unknown` with the evidence named; "nothing is installed" is claimed only when both
             surfaces were readable and every entry classified.
             One contract change, and it was forced: `.kai/manifest.json` `"plugin"` is now the
             closed set `{kai, kai-core}` — the doctor previously rejected any workspace whose
             provenance had been migrated, i.e. the migration it prescribes produced a workspace
             its own default run failed. `schema_version` unchanged, no ladder step added.
             Release metadata `0.62.0 -> 0.63.0` across all six locations + `package-lock.json`.
             Packs stay unpublished: `COMMITTED_PACKS` empty, marketplace N=1, `source: "."`.
- state:     in-progress
- change_ref: **null — nothing was committed, so no review can bind.**
- needs:     **A shell. This session had none** — the only tools available were file read/write,
             grep and glob. Concretely, **none** of the following happened and none of it should
             be read into the record as done:
             **no branch** (`kai/feat/29-migration-doctor` does **not** exist; the edits sit
             uncommitted on `main`), **no commit and no SHA**, **`de036ba` was never resolved to
             a full SHA**, **`npm test` was not run**, **`workspace-doctor --self-test` was not
             run**, **`node --check` was not run on either new/edited script**, and **CI has not
             seen any of it**. The code was verified by careful manual review only. Treat every
             behavioural claim above as **unverified** until the suite runs.
             Next actor (`@operator`, or `principal-swe-infra` in a session with a shell), in
             order: (1) create `kai/feat/29-migration-doctor` from `main`, (2) run
             `node scripts/check-syntax.mjs`, then `node scripts/workspace-doctor.mjs --self-test`,
             then `npm test`, (3) fix whatever the suite finds — the 16-case matrix is the
             specification, and a case failing means the code is wrong, not the case, (4) commit
             and record the real SHA as `change_ref`, (5) then `in-progress -> in-review`.
             **No push, no PR, no merge, no tag, no release** was requested and none was done.
- artifacts: scripts/lib/migration-doctor.mjs (new) · scripts/workspace-doctor.mjs ·
             test/fixtures/host-installs.json (new) · test/README.md · docs/getting-started.md ·
             docs/reference/plugin-structure.md ·
             skills/kai-core-workspace-onboarding/SKILL.md · CHANGELOG.md · README.md ·
             package.json · package-lock.json · plugin.json · .github/plugin/marketplace.json ·
             kai/coordination/items/pack-split-migration-doctor.md (v3,
             `### Implementation — 2026-08-25-2140`)
- evidence:  **Verified (one host, Windows, 2026-08-25, `C:\Users\senrique\.copilot`):**
             `config.json` is JSONC; `installedPlugins[]` records `marketplace: ""` for a direct
             install; direct trees live at `installed-plugins/_direct/<owner>--<repo>/` and carry
             a real `plugin.json`. That is the ground truth the detector is built on.
             **Unverified:** the marketplace-bucket layout has **never been observed**, so any
             non-`_direct` bucket is labelled *inferred* and never asserted; macOS and cloud
             layouts are unverified (that is `pack-split-host-semantics-spike`, which this item
             is informed by and not gated on). Path normalization is covered by fixtures for
             Windows separators, a case-differing `Installed-Plugins`, doubled slashes and a
             trailing slash — encoded, not executed.
             **No acceptance box was ticked.** Criteria 1-4 have encoded proof that has never
             run; the local-suite and CI-green criteria are false by construction today.
- questions: **One, for the steward/director — not resolved here.** The dispatching instruction
             asked for **architecture + security** review at the same exact ref; this record's
             `review_requirements` are **`principal-security`/independent-security** and
             **`principal-sre`/independent-reliability**. The record is authoritative and was
             left untouched — nothing dropped, nothing added. If an architecture review is also
             wanted, the steward adds it to `review_requirements`; a builder does not add or
             remove its own reviewers. `waiting_on_questions` stays `[]` because this blocks the
             review step, not the build.
             **A second thing the reviewers should be told plainly:** the marketplace-install
             layout is inferred from one direct-install host. `principal-sre` should read the
             `unknown` verdict as the mitigation — the doctor refuses to call an unverified
             layout clean — and `principal-security` should confirm the report leaks nothing
             beyond paths the operator already owns (it prints install paths and plugin names,
             never file contents, tokens, or `source_sha` values).
- next:      **principal-swe-infra** in a session with a shell (or `@operator`) — branch, run the
             suite, commit, then hand to review at that exact ref.
