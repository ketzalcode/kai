---
type: work-item
id: area-plugins-m2-decomposition
title: Decompose milestone optional-core-contract into sequenced, independently shippable PRs
initiative: area-plugins
milestone: optional-core-contract
delivery_class: knowledge
state: completed
resume_state: null
priority: 10
owner: null
next_role: director-chief-of-staff
target: The PR-level delivery plan for the optional-core contract, sized and sequenced
artifact_target: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-m2-decomposition.md
artifact_target_status: blocked-on-directory-creation; durable record is this item's thread until the initiative directory exists
context_artifacts:
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - kai/coordination/threads/area-plugins-taxonomy-decision.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
touches:
  - kai/coordination/items/area-plugins-m2-decomposition.md
  - kai/coordination/threads/area-plugins-m2-decomposition.md
  - kai/coordination/items/area-plugins-m2-planpacks-prefix.md
  - kai/coordination/items/area-plugins-m2-standalone-copy.md
  - kai/coordination/items/area-plugins-m2-standalone-floor.md
  - kai/coordination/items/area-plugins-m2-claim-surface-pin.md
  - kai/coordination/items/area-plugins-m2-mode-selection.md
  - kai/coordination/items/area-plugins-m2-standalone-proof.md
  - kai/coordination/items/area-plugins-m2-doctor-standalone.md
  - kai/coordination/items/area-plugins-m2-docs-two-modes.md
  - kai/coordination/threads/area-plugins-m2-planpacks-prefix.md
  - kai/coordination/threads/area-plugins-m2-standalone-copy.md
  - kai/coordination/threads/area-plugins-m2-standalone-floor.md
  - kai/coordination/threads/area-plugins-m2-claim-surface-pin.md
  - kai/coordination/threads/area-plugins-m2-mode-selection.md
  - kai/coordination/threads/area-plugins-m2-standalone-proof.md
  - kai/coordination/threads/area-plugins-m2-doctor-standalone.md
  - kai/coordination/threads/area-plugins-m2-docs-two-modes.md
depends_on:
  - item: area-plugins-optional-core-architecture
    requires: completed
  - item: area-plugins-taxonomy-decision
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements: []
completed_reviews: []
change_ref: null
version: 4
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1944
---

## Outcome

The accepted optional-core architecture turned into sized, sequenced,
independently shippable work items — one per PR — with owners, dependencies,
touch sets, review requirements, and release versions, so the first
implementation item can be dispatched.

## Acceptance

- [x] The architect's five-PR shape (floor -> guarantee -> behaviour -> proof
      -> surface) is sized and sequenced, or revised with a stated reason.
      *Ordering confirmed; packing revised three ways with reasons — D3 first;
      the `partial-core` arm moved from PR-3 into PR-2; PR-5 split in two.*
- [x] Steward condition **C2** is expressed as a hard typed dependency: PR-2
      (`CLAIM_SKILLS` + the `--gate partition` extension) merges **before**
      PR-3 (mode selection), so no commit exists in which core is optional and
      the claim surface is unpinned.
      *`area-plugins-m2-mode-selection` carries
      `depends_on: {item: area-plugins-m2-claim-surface-pin, requires: shipped}`.*
- [x] The `planPacks()` prefix fix (**D3**) is placed inside this milestone as
      its own commit, sequenced with — never inside — PR-3, and its asserted
      byte-neutrality on today's tree is an acceptance line on its item.
      *`area-plugins-m2-planpacks-prefix`, sequenced first, with byte-neutrality
      and gate-neutrality as two separate acceptance lines.*
- [x] Each emitted item is independently shippable, reversible, and carries its
      own lockstep release version.
      *Six behaviour items at planned `1.0.5`–`1.0.10`; the two knowledge items
      carry none, with the reason recorded.*
- [x] Each emitted item declares `touches`, typed `depends_on`, acceptance,
      `delivery_class`, and `review_requirements`.
- [x] Emitted items are created `proposed` for the steward to promote; this
      decomposition promotes nothing itself.

## Evidence

- Durable plan: `kai/coordination/threads/area-plugins-m2-decomposition.md`
  (PLAN 2026-08-27-1922) — PR sequence, sizes, typed dependency graph with edge
  kinds, per-item "proves / does not touch / rollback / release", scope
  negotiations, open questions, and the named first implementation item.
- Eight `proposed` items, each with a matching thread, all `owner: null`,
  `version: 1`, lease fields all null:
  `area-plugins-m2-planpacks-prefix`, `area-plugins-m2-standalone-copy`,
  `area-plugins-m2-standalone-floor`, `area-plugins-m2-claim-surface-pin`,
  `area-plugins-m2-mode-selection`, `area-plugins-m2-standalone-proof`,
  `area-plugins-m2-doctor-standalone`, `area-plugins-m2-docs-two-modes`.
- **First implementation item: `area-plugins-m2-planpacks-prefix`**, owner
  `principal-swe-infra`, no unmet dependency.
  `area-plugins-m2-standalone-copy` (`principal-product-manager`) is also
  unblocked and should be dispatched in parallel.
- Grounded from source this session in `C:\src\kai`:
  `scripts/lib/pack-plan.mjs:405-419` and `:1498-1506` (the D3 placement
  constraint — byte-neutral is not gate-neutral); `:104-119`; `:1592` (the
  pinned literal WS-3 must replace); `scripts/validate-plugin.mjs:312-314`;
  `scripts/pack-preview.mjs:308-1237` and `:1334`;
  `scripts/release-guard.mjs:20-30`;
  `scripts/lib/migration-doctor.mjs:736-741` and
  `scripts/workspace-doctor.mjs:661-666` (the shipped `partial-pack-set`
  refusal); `packs/*/agents/` counted 20+11+9+9+7 = 56, so **49** non-core
  generated bodies rather than the 51 the accepted record states.
- Wrote no production code; modified nothing under `scripts/`, `packs/`,
  `plugin.json`, `agents/`, `skills/`, `kai/initiatives/**`, or the parallel
  sibling's records.

## Notes

**Promotion basis.** This item is sequencing *within already-approved scope*,
not new scope. The steward pre-authorized it in the accepted scope brief —
`kai/coordination/threads/area-plugins-scope-brief.md`, steward amendment
2026-08-27-1906: *"Sizing and release packing go to `principal-swe-manager`."*
The steward's scope gate is preserved where it matters: everything this item
emits is `proposed` and only the steward may promote it.

**Environment limit (director, 2026-08-27-1915):** no shell in this session, so
`kai/initiatives/area-plugins/` cannot be created. Record the plan in this
item's thread; the canonical `artifact_target` is materialized after one
operator `mkdir`.

### Manager close-out 2026-08-27-1922 (`principal-swe-manager`)

Lease re-verified against the dispatch packet immediately before this write —
holder `principal-swe-manager`, token `apx-m2d-20260827-1916-e1`,
`version_at_grant` 1, item `version` 2, expiry `2026-08-27-2216` — all matched,
so no `COLLISION` was recorded. State `ready -> completed`, version 2 -> 3,
lease cleared, `next_role: principal-product-manager`.

**Two things the steward must decide, neither of which this item settled.**

1. **Scope negotiation — the doctor.** `scripts/lib/migration-doctor.mjs:736-741`
   ships a `refusal`-severity `partial-pack-set` verdict whose remediation step
   reads `# core is required, never optional`, pinned as `blocked` by the
   self-test at `scripts/workspace-doctor.mjs:661-666`. It is a fourth encoding
   of "core is required" that the accepted architecture's disposition table never
   reaches. `area-plugins-m2-doctor-standalone` is marked
   `required_for_milestone: false`, which is faithful to milestone 2's acceptance
   **as written**; whether that acceptance should gain it is the steward's call,
   not something to settle by setting a flag.
2. **`area-plugins-m2-standalone-copy` is the one emitted item that is not a
   PR.** It was minted so `area-plugins-m2-mode-selection` could type its hard
   copy input rather than narrate it — a `depends_on` pointing at a non-existent
   item is a dangling reference. A4 already declares the deliverable owed with the
   steward as owner, so this is sequencing inside approved scope; the steward may
   keep it or fold it into their own queue.

**Proposed milestone `required_items` mapping** (non-empty, typed, for the
steward to accept or amend): `area-plugins-m2-planpacks-prefix` (`shipped`),
`area-plugins-m2-standalone-copy` (`completed`),
`area-plugins-m2-standalone-floor` (`shipped`),
`area-plugins-m2-claim-surface-pin` (`shipped`),
`area-plugins-m2-mode-selection` (`shipped`),
`area-plugins-m2-standalone-proof` (`shipped`),
`area-plugins-m2-docs-two-modes` (`completed`).
`area-plugins-m2-doctor-standalone` is deliberately absent pending decision 1.
Milestone 4 (`area-taxonomy-split`) gains one dependency edge:
`area-plugins-m2-planpacks-prefix` at `requires: shipped`, per A3/S1.

No item was promoted, no lease was granted, no dispatch occurred, and no
milestone or initiative closure is claimed here.

### Steward close note 2026-08-27-1944 (`principal-product-manager`)

**Not reopened — this item stays `completed`.** Version 3 -> 4 and
`next_role: principal-product-manager -> director-chief-of-staff` only, because
the two decisions it routed are now answered and leaving it pointed at the steward
would show stale state on the board. No acceptance line, evidence line, or note
above is altered.

Both routed decisions are ruled, in
`kai/coordination/threads/area-plugins-scope-brief.md` (STEWARD AMENDMENT
2026-08-27-1944, A5–A9) and mirrored in this item's thread (STEWARD RULING
2026-08-27-1944):

1. **The doctor — ruled (a).** Milestone 2's acceptance gains the doctor
   reconciliation and `area-plugins-m2-doctor-standalone` is
   `required_for_milestone: true`, bounded to the contradiction, with the Spike's
   fallback pre-decided and `principal-sre`'s reliability verdict left
   un-relabelable.
2. **WS-7 — ruled: it stays its own item**, and is promoted to the top of the
   queue at priority 10.

The **proposed milestone `required_items` mapping is accepted with the doctor
added — eight typed entries** (A7). All eight emitted items are promoted
`proposed -> ready` at steward priorities 10–80; the whole production-code chain
carries one added steward edge on its head
(`area-plugins-m2-planpacks-prefix -> area-plugins-migration-architecture`,
`requires: completed`), because `scope.current` is still `decisions-locked` and
milestone 1's acceptance still claims no production code has been made. The
figure correction to **49** non-core generated agent bodies is confirmed
independently and carried as A6.

