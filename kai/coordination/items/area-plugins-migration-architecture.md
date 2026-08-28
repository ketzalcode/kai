---
type: work-item
id: area-plugins-migration-architecture
title: Architecture — marketplace rename, packs/ -> plugins/, and v1.0.4 user migration
initiative: area-plugins
milestone: decisions-locked
delivery_class: knowledge
state: completed
resume_state: null
priority: 30
owner: null
next_role: principal-product-manager
target: A safe, non-stranding migration from marketplace kai-plugins + packs/ + kai-personal to the new topology
artifact_target: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-migration-architecture.md
artifact_target_status: promoted 2026-08-27-2228 by principal-sre on approval; the thread remains the append-only audit trail including all three changes-requested verdicts
context_artifacts:
  - kai/coordination/threads/area-plugins-migration-architecture.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - kai/coordination/threads/area-plugins-taxonomy-decision.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - scripts/lib/migration-doctor.mjs
  - scripts/workspace-doctor.mjs
  - scripts/release-guard.mjs
  - scripts/validate-plugin.mjs
  - .github/plugin/marketplace.json
  - docs/reference/plugin-structure.md
  - test/fixtures/host-installs.json
touches:
  - kai/coordination/items/area-plugins-migration-architecture.md
  - kai/coordination/threads/area-plugins-migration-architecture.md
depends_on:
  - item: area-plugins-scope-brief
    requires: completed
  - item: area-plugins-taxonomy-decision
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-sre
    kind: independent-reliability
completed_reviews:
  - role: principal-sre
    kind: independent-reliability
    verdict: changes-requested
    evidence: kai/coordination/threads/area-plugins-migration-architecture.md (REVIEW 2026-08-27-1944)
    timestamp: 2026-08-27-1944
    change_ref: null
    record_revision: item version 6 / thread entry DECISION 2026-08-27-1922
    findings: P0 0, P1 4, P2 6
    satisfies_requirement: false
  - role: principal-sre
    kind: independent-reliability
    verdict: changes-requested
    evidence: kai/coordination/threads/area-plugins-migration-architecture.md (REVIEW 2026-08-27-2015)
    timestamp: 2026-08-27-2015
    change_ref: null
    record_revision: item version 10 / thread entry DECISION 2026-08-27-2001 (revision 2)
    findings: P0 0, P1 1, P2 5
    satisfies_requirement: false
  - role: principal-sre
    kind: independent-reliability
    verdict: changes-requested
    evidence: kai/coordination/threads/area-plugins-migration-architecture.md (REVIEW 2026-08-27-2042)
    timestamp: 2026-08-27-2042
    change_ref: null
    record_revision: item version 14 / thread entry DECISION 2026-08-27-2028 (revision 3)
    findings: P0 0, P1 1, P2 2
    satisfies_requirement: false
  - role: principal-sre
    kind: independent-reliability
    verdict: approved-with-conditions
    evidence: kai/coordination/threads/area-plugins-migration-architecture.md (REVIEW 2026-08-27-2228)
    timestamp: 2026-08-27-2228
    change_ref: null
    record_revision: item version 18 / thread entry DECISION 2026-08-27-2053 (revision 4)
    findings: P0 0, P1 0, P2 4
    conditions:
      - P2-8 — record the `HISTORY_APPEND_ONLY_PATHS ⊆ ban-scan coverage` invariant beside the constant; prefer a witness arm in the existing `release-guard.mjs --self-test` over a new gate
      - P2-9 — correct the "pure relaxation / nothing newly forbidden" summary to match properties 4 and 5; rule explicitly on `kai/coordination/threads/**`
      - P2-10 — resolve the JSON-object append shape for `test/fixtures/host-installs.json` before B-1 is authored
      - P2-11 — make `git revert -n <B-2 merge commit>` unambiguous about merge-commit parents
    conditions_bind: implementation of D15 in PR A-3 (principal-swe-infra owns the how); none reopens architecture, none gates the milestone
    satisfies_requirement: true
change_ref: null
version: 19
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2228
---

## Outcome

A decision record for renaming the marketplace `kai-plugins -> kai`, renaming
the generated tree `packs/ -> plugins/`, and moving existing `1.0.4` installs
onto the new topology without stranding anyone and without old and new plugin
identities coexisting.

## Acceptance

- [x] Host syntax is treated as fixed at `<plugin>@<marketplace>`, yielding
      `kai-engineering@kai`. No marketplace is named after an area and no
      plugin named `kai` is created.
- [x] Defines whether the marketplace rename is a new index, a renamed index,
      or a dual-publish window, and how a `1.0.4` user reaches the new one.
- [x] Defines the fate of `kai-personal` for users who have it installed:
      retired, superseded, or redirected — with the uninstall-first and
      coexistence-refused invariants preserved.
- [x] `scripts/lib/migration-doctor.mjs` (`MARKETPLACE`), `workspace-doctor`
      `--migration-check` classifications (`clear` / `blocked` / `unknown`),
      and provenance inference are updated to recognise both old and new
      identities during the transition.
- [x] The **derived** `legacy-rollback` forbidden set continues to cover every
      publishable identity, old and new. This was a late `pack-split` lesson
      and is an explicit acceptance line here.
- [x] `PACKS_DIR` stays the single source of truth for the tree name, and the
      hard-coded `packs/` literals that do not follow it are enumerated and
      fixed: `.github/workflows/validate.yml`, `scripts/release-guard.mjs`
      `BEHAVIOR_PREFIXES`, `docs/getting-started.md`,
      `docs/reference/plugin-structure.md`, `AGENTS.md`.
- [x] Historical records are explicitly excluded from rewriting: `CHANGELOG.md`,
      `kai/library/releases/**`, `kai/coordination/**`, `kai/initiatives/**`.
      *(Re-checked at revision 4. Satisfied by two mechanisms, not one: D7(a)'s
      ban-scan exemption keeps all four invisible to the checker that directs
      sweeps, and D15's `HISTORY_APPEND_ONLY_PATHS` — predicate `deleted == 0`,
      i.e. "may grow, may not be rewritten" — reds any sweep that reaches
      `CHANGELOG.md` or `kai/library/releases/**` anyway. Revision 3's single
      mechanism was unsatisfiable; see `DECISION 2026-08-27-2053`.)*
- [x] Sequencing states whether the marketplace rename and the folder rename
      ship together or separately, and why.

## Notes

The folder rename is largely mechanical; the marketplace rename is the one that
can strand a real installed user, so its sequencing carries the risk.

**Environment limit:** no shell in this session; record the decision in this
item's thread until the initiative directory exists.

## Steward ruling — 2026-08-27-1839 (principal-product-manager)

**HELD at `proposed`. Not promoted. Priority 30 unchanged.**

**Reason.** This item declares two typed dependencies:
`area-plugins-scope-brief requires: completed` (now **satisfied** — version 3,
lease null) and `area-plugins-taxonomy-decision requires: completed` (**not
satisfied** — that item was promoted to `ready` in this same pass and has not
been authored). Promoting to `ready` with an unsatisfied dependency would put a
non-executable item in the dispatch queue, which is exactly what the dependency
exists to prevent.

**The dependency is correct and stays.** This record must state the fate of
`kai-personal` and keep the **derived** `legacy-rollback` forbidden set
covering *every* publishable identity, old and new. It therefore cannot be
written until the taxonomy decision has produced the new identity list. This is
a real ordering constraint, not paperwork.

**Unblock condition.** The moment `area-plugins-taxonomy-decision` reaches
`completed`, this item returns to the steward for promotion `proposed -> ready`
at priority 30, `next_role: principal-swe-architect` unchanged. Nothing else is
required.

**Binding scope constraints from the brief** (`BRIEF 2026-08-27-1839` in
`kai/coordination/threads/area-plugins-scope-brief.md`), which bear directly on
this record's final acceptance line about rename sequencing:

- The scope brief **revised** the proposed phase order so that
  `surface-rename` ships *ahead of* `area-taxonomy-split`. The governing
  principle is that **no new plugin identity is published under a marketplace
  name or an operating contract already decided to change**. Concretely: the
  marketplace rename `kai-plugins -> kai` must complete **before** any new area
  identity is published, so `kai-learning`, `kai-assistant`, and `kai-wellness`
  are born at `@kai` and never re-point. Executing the rename against the
  stable, shipped `1.0.4` five-plugin set also keeps the derived
  `legacy-rollback` surface at five identities instead of eight.
- Whether `packs/ -> plugins/` and `kai-plugins -> kai` ship as one release or
  two remains **this record's call** — the brief does not pre-empt it. The one
  constraint: the folder move and the per-agent contract rewrite must not land
  in the same PR, because two whole-tree diffs over the same files are not
  independently reviewable or revertible.
- If the marketplace rename cannot be executed without a window in which old
  and new identities are both installed, stop — that is a non-negotiable
  bending and is critical operator boundary #4 in the brief. Same for any
  migration step requiring a manual user action we cannot detect or verify
  (boundary #5, undetectable stranding).

Lease and owner remain clear. This item is **not** dispatchable yet.

## Steward promotion — 2026-08-27-1906 (principal-product-manager)

**`proposed -> ready`. Priority 30 unchanged. `next_role:
principal-swe-architect` unchanged. Version 3, owner and lease left clear for
`director-chief-of-staff` to dispatch.**

**The hold condition is discharged.** Both declared dependencies are now
truthfully satisfied, checked against the records rather than assumed:

- `area-plugins-scope-brief requires: completed` — satisfied since
  2026-08-27-1839 (version 3, lease null).
- `area-plugins-taxonomy-decision requires: completed` — **satisfied
  2026-08-27-1906.** It passed its required `principal-product-manager`
  `scope-acceptance` review with verdict `approved` and moved `in-review ->
  completed` at version 6, lease null, one entry in `completed_reviews`.

That was the exact unblock condition recorded in the ruling above, and nothing
else was required. `area-plugins-optional-core-architecture` also reached
`completed` in the same pass; it is not a declared dependency of this item, but
its outputs are now stable inputs and its thread is added to
`context_artifacts`.

**The dependency did its job.** This record must state the fate of
`kai-personal` and keep the **derived** `legacy-rollback` set covering every
publishable identity. It could not be written before the identity list existed.
That list now exists and is fixed: **7 plugins** — `kai-core`,
`kai-engineering`, `kai-product`, `kai-gtm`, `kai-learning`, `kai-assistant`,
`kai-wellness` — with `kai-personal` dissolved and `creative-video-director`
merged into `kai-gtm`. `PACK_ORDER` and `COMMITTED_PACKS` stay derived from
`PACKS`, so the `legacy-rollback` set extends to the three new identities for
free; confirm that rather than re-derive it.

**Two routed inputs travel with this promotion.** Both come from the taxonomy
record and both bear on this item's no-stranding acceptance:

1. **The `kai-personal` string survives a fully green build.**
   `skills/demo-narrate/SKILL.md:65-147` hard-codes `<kai-personal-plugin>` in
   six invocation examples and in its `npm ci --prefix` guidance, and
   `skills/kai-core-workspace-onboarding/SKILL.md` lists `kai-personal` in the
   plugin table and the guided installer. The asset regex matches
   `scripts/demo-narrate.mjs` regardless of the plugin prefix in front of it, so
   **no gate catches either**. That is precisely the silent-stranding shape
   measure #5 targets at zero, and this record owns the sequencing of both prose
   fixes.
2. **A criterion-(ii) choice is yours to make, not the steward's.** The
   `STEWARD AMENDMENT 2026-08-27-1906` in
   `kai/coordination/threads/area-plugins-scope-brief.md` rules that
   generator-derived identity strings inside a skill body are **packaging, not
   content**, and are exempt from "no agent or skill body was rewritten" — but
   only when (i) the span is derived from `PACKS` / `PACK_ORDER` /
   `packPluginName()` / `MARKETPLACE`, (ii) a CI check derives the expected
   literal from those constants, and (iii) no instruction, judgment, persona,
   capability, procedure, or example semantics changes.
   `kai-core-workspace-onboarding` satisfies all three today via
   `validate-plugin.mjs:860`. **`demo-narrate` fails (ii)** — nothing derives or
   pins its literals. **Decide** whether to satisfy (ii) with a deriving check or
   to explicitly accept the unpinned string with a stated detection path. I
   deliberately did **not** legislate a new CI gate from the steward's chair;
   the choice sits inside your existing acceptance lines about stranding and
   `legacy-rollback` coverage. If you conclude neither option is safe, that is a
   QUESTION back to the steward, not an absorbed expansion.

**Binding scope constraints, restated and still in force.** The ordering ruling
in the BRIEF is unchanged by this pass: `surface-rename` ships **ahead of**
`area-taxonomy-split`, so the marketplace rename `kai-plugins -> kai` completes
before any new area identity is published and `kai-learning`, `kai-assistant`,
and `kai-wellness` are born at `@kai` and never re-point. Whether `packs/ ->
plugins/` and `kai-plugins -> kai` ship as one release or two remains **this
record's call**; the one constraint is that the folder move and the per-agent
contract rewrite must not land in the same PR. Critical operator boundaries #4
(coexistence window) and #5 (undetectable stranding) still apply — hit either
and stop rather than design around it.

**One note on the amended acceptance line.** Milestone 3's `surface-rename`
forces the same `kai-core-workspace-onboarding/SKILL.md` edit as milestone 4,
because the guided installer is derived over `MARKETPLACE` as well as
`PACK_ORDER`. The A1 exception is written initiative-wide for exactly that
reason, so this record may plan that edit without re-escalating it.

**Milestone status.** This is the last open item in `decisions-locked`. On its
completion all three typed required items in milestone 1 are `completed` and the
steward advances `scope.current` to `optional-core-contract`.

## Architect authoring — 2026-08-27-1922 (principal-swe-architect)

**`ready -> in-review`. Version 5. Lease cleared (all five fields null).
`next_role: principal-sre` per `review_requirements`
(`independent-reliability`). Not `completed` — the declared review has not run.**

All eight acceptance lines are satisfied by the `DECISION 2026-08-27-1922`
packet in `kai/coordination/threads/area-plugins-migration-architecture.md`,
which is the durable record while `kai/initiatives/area-plugins/` cannot be
created. Lease was re-verified against this packet immediately before the write:
holder `principal-swe-architect`, token `apx-mig-20260827-1915-d1`,
`version_at_grant` 3, record at version 4 — matched, no collision.

**The load-bearing rulings, so a reviewer does not have to reconstruct them:**

- **Layer separation is what the record turns on.** The marketplace rename is
  *source-layer*, the tree rename is *repo-layer*, and non-negotiable #9 binds
  the *identity layer* — which neither touches. That is why no coexistence
  window is needed and why **critical boundary #4 is not reached**.
- **Renamed index. Dual-publish rejected** because it would manufacture the
  `provenance-collision` it claims to prevent (the same five plugin names served
  by two sources).
- **`MARKETPLACE` splits into instruct-one / recognise-many.** `stale-source` is
  a `note`, so an un-re-pointed `1.0.4` host still reports `clear`. **Boundary
  #5 is not reached**: the stale source is detectable *and* the fix is
  verifiable.
- **`kai-personal` is retired**, through `LEGACY_PLUGIN` widened to an
  append-only `RETIRED_PACK_PLUGINS`; uninstall-first and coexistence-refused
  preserved verbatim.
- **A hole in the derived `legacy-rollback` set was found and closed.** It
  covers *current* publishable names, so `kai-personal` drops out of
  `forbiddenPluginNames` for both surfaces when `personal` leaves `PACKS`.
- **Two releases, folder first, seven PRs.** `.github/plugin/marketplace.json:2`
  in PR B-2 is the only irreversible byte — and the irreversible **act** is the
  operator publishing that index, not the merge.
- **R1 answered:** satisfy A1 criterion (ii) with a *derived provider-root
  placeholder rule*, not pinned literals. **R2 answered:** one derived
  literal-ban check inside the existing `validate-plugin.mjs` run — no new gate,
  step, or surface. It catches five sites, three of which no prior record named.

**Non-blocking NOTEs routed to `principal-product-manager` (steward)**, none of
which gate this review: `README.md` should join `targets`; A1's exception should
be read as scoped to a span's *character* rather than a directory, so the
identical defect in `scripts/demo-narrate.mjs:326` is covered;
`docs/proposals/**` proposed as a fifth history-exempt path.

**One operator action, no operator decision.** `PROBE-M` (host rename semantics,
unverifiable from this repo) gates the *publish* of PR B-2, not its merge, and
follows the precedent in
`kai/coordination/threads/pack-split-host-semantics-spike.md`. The architecture
is identical under every probe outcome. No pause is requested.

No production code was written; nothing under `scripts/`, `packs/`,
`plugin.json`, `agents/`, `skills/`, or `kai/initiatives/**` was touched, and
`kai/initiatives/area-plugins/` was not created.

## SRE review — 2026-08-27-1944 (principal-sre)

**`in-review -> ready`. Version 7. Lease cleared (all five fields null).
`next_role: principal-swe-architect`. Verdict `changes-requested` — P0 0,
P1 4, P2 6. The `independent-reliability` requirement is NOT discharged;
milestone `decisions-locked` stays open.**

Bound to `change_ref: null` (knowledge item, no commit) — specifically to the
**`DECISION 2026-08-27-1922` thread entry at record version 6**. Full review,
evidence register and reasoning are the `REVIEW 2026-08-27-1944` entry in
`kai/coordination/threads/area-plugins-migration-architecture.md`. Lease was
verified against the dispatch packet immediately before the write: holder
`principal-sre`, token `apx-mig-sre-20260827-1930-f1`, `version_at_grant` 5,
record at version 6 — matched, no collision.

**The architecture is not the problem and no redesign is requested.** Verified
against source and upheld: the three-layer separation and the "not an identity
change" claim (`provenance-collision` is keyed by plugin name and is therefore
marketplace-independent); the renamed-index mechanism and the dual-publish
rejection; `stale-source` as a `note` keeping status `clear` (filing every
healthy un-re-pointed host under `unverified` would make `clear` unreachable for
the whole installed base); "degraded and detectable, not stranded"; the D5
retirement hole and its one-list/three-consumer fix; R1 and R2 as genuinely
derived checks landing green in the `contract` job; and the steward's
M3-before-M4 ordering as the lower-risk sequence.

**What fails review is the operability wrapper around the one irreversible act.**
Three of the four P1s share a single root cause:
`docs/reference/plugin-structure.md` — which defines both the publication model
and the emergency rollback runbook — is absent from the record's evidence
register.

**Must change before this record is locked:**

1. **P1-1 — `PROBE-M` gates a step that does not exist.**
   `docs/reference/plugin-structure.md:208` states the marketplace **serves the
   default branch**; `:124-126` and `AGENTS.md:101-103` state Copilot loads the
   plugin from the repo; release step 4 (`:191-193`) probes "every newly
   published pack" **on the exact merge commit**. Merging B-2 *is* publishing —
   "merge, sit, and publish" is not an available sequence, and PROBE-M as placed
   would run after the point of no return, inverting the boundary-#5 protection
   D9 relies on. Re-rule PROBE-M as a **merge prerequisite** for B-2 and re-test
   D9's critical-boundary call against the corrected model.
2. **P1-2 — no recovery runbook for the irreversible act.** The `pack-split`
   equivalent (`docs/reference/plugin-structure.md:206-243`: ordered steps,
   derived forbidden set, uninstall order departments-before-`kai-core`, absence
   proof, verification) has **no counterpart here** — recovery is one sentence
   in D8. Author one, and rule how recovery commands express the marketplace
   token, since `:227,231` (`install kai@kai-plugins`) become
   provenance-dependent after B-2.
3. **P1-3 — R2's ban conflicts with the recovery runbook.** `docs/reference/`
   is not in `RENAME_EXEMPT_PREFIXES` and `docs/**` is in R2's scanned surface,
   so at milestone 4 the ban turns red on
   `docs/reference/plugin-structure.md:228` — the line instructing an operator to
   uninstall `kai-personal` first. Rule the recovery-prose carve-out **before**
   `RETIRED_PACK_PLUGINS` gains its first entry.
4. **P1-4 — a recognition predicate outside the doctor.**
   `skills/kai-core-workspace-onboarding/SKILL.md:123,144` assert "Its only
   provenance must be `marketplace:kai-plugins`" and are **not** pinned by the
   deriving check (`scripts/validate-plugin.mjs:884-907` pins no provenance
   string), so D6 row 14's claim that A1 criterion (ii) is satisfied for that
   file is over-broad. Swept to a single value, the installer would call
   `blocked` a host the doctor calls `clear`. Extend D4's
   instruct-one/recognise-many rule to prose predicates and pin the
   recognise-many form.

**Six P2s** should be answered or explicitly accepted in the same pass: R2's
path match shape under-matching `RubenSaucedo/kai:packs/…` and `"./packs/…"`;
`RETIRED_PACK_PLUGINS` append-only being unenforced; the `contract` job's
*required* status being `reported` rather than `observed`; PROBE-M lacking an
answer-to-outcome decision rule, time box and escalation owner; the unenumerated
19th site at `scripts/workspace-doctor.mjs:665`; and the compound
un-re-pointed-then-retired state (routed to `area-taxonomy-split`, non-blocking
here).

**No operator decision is required.** PROBE-M remains an operator *action*;
P1-1 changes when it must run, not who runs it — the architecture is still
identical under every probe outcome. One optional operator *verification* is
recommended (P2-3): confirm `contract` is a required status check on `main`.

A re-review by `principal-sre` is required after the amended DECISION entry;
this review does not carry forward. No production code was written; nothing
under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or
`kai/initiatives/**` was touched, and `kai/initiatives/area-plugins/` was not
created.

## Architect revision — 2026-08-27-2001 (principal-swe-architect)

**`ready -> in-review`. Version 9. Lease cleared (all five fields null).
`next_role: principal-sre` for **re-review**. The `independent-reliability`
requirement is still NOT discharged — the existing `completed_reviews` entry
(`changes-requested`, `satisfies_requirement: false`) is left in place, not
deleted. Milestone `decisions-locked` stays open until the re-review verdict
lands.**

All four P1 findings resolved and all six P2s answered with mechanisms in
`DECISION 2026-08-27-2001` in
`kai/coordination/threads/area-plugins-migration-architecture.md`, appended as a
new dated entry. **Nothing above it was rewritten**; the entry carries an
amendments index naming every superseded span of the 1922 packet, so the delta is
reviewable without re-reading the whole record. Lease was re-verified against the
dispatch packet immediately before this write: holder `principal-swe-architect`,
token `apx-mig-fix-20260827-1952-g1`, `version_at_grant` 7, record at version 8 —
matched, no collision.

**Root cause, accepted.** `docs/reference/plugin-structure.md` was absent from the
1922 evidence register. It is now read, cited by line, and added to
`context_artifacts`. It is the file that defines both the publication model and
the emergency rollback runbook — architecture, not procedure.

**The four resolutions:**

- **P1-1 — `PROBE-M` is now a merge prerequisite of B-2.** Merging B-2 *is*
  publishing (`plugin-structure.md:208,126,192,204`; `AGENTS.md:101-103,131`), so
  "merge, sit, and publish" is struck. I took the **re-place** option, not the
  restructure option: making the merge separable would require a staging surface
  this repo does not have, and building one is a new capability. Re-placing
  exposed a second defect — the probe targeted a *branch* of this repo, which by
  the same fact is not a probe surface — so **PROBE-M′ runs against a throwaway
  scratch remote's own default branch**. Same operator action, now executable.
  **D9 re-tested:** boundary #5 still NOT reached, but now *because* the gate
  precedes the irreversible act where before it followed it.
- **P1-2 — `RECOVERY-M` authored.** Detection signal and threshold, seven ordered
  steps, owner, one-working-day bound, verification from two homes (re-pointed and
  not), the wedged-host branch, and an explicit prohibition on the adjacent
  layer-2 runbook (no uninstall order, no monolith, no `--rollback`). Recovery
  works by **inverting `MARKETPLACE_ALIASES`** — recognise-many is what makes the
  rename recoverable at all. Token question ruled the same way as D4 and grounded
  in shipped code: uninstall/list steps carry no token
  (`migration-doctor.mjs:633,655,719,720`), exactly one step does (`:740`), so
  recovery commands **normalise** and never branch on population. The runbook
  lands in **B-1**, before the point of no return.
- **P1-3 — recovery-prose carve-out ruled.** R2 splits into two banned sets with
  two carve-out policies: retired identities are legal inside a marker-delimited
  block (reusing the existing `managedBlock` convention at
  `validate-plugin.mjs:930-933`), while `MARKETPLACE_ALIASES` and the tree-prefix
  ban still apply **inside** it — so `:227,231`'s `@kai-plugins` is still swept
  while `:228-229`'s uninstall order survives. R2 is not weakened. Unbalanced or
  empty marked blocks are errors, so the carve-out cannot rot into a silencer.
- **P1-4 — the agent-procedure layer named, and the predicate relocated.** The
  three-layer model described artifacts, not readers. D4's rule now binds prose
  predicates; the predicate at `SKILL.md:123,144` moves to the doctor rather than
  being re-pinned as a literal, with three entries in the **existing**
  required/forbidden text loop — including a derived forbidden clause that closes
  the class, not just the two spans. D6 row 14's over-broad "(ii) satisfied" is
  corrected, and the installer edit moves from B-2 to **B-1**, where it is
  behaviour-neutral and self-arming.

**Six P2s, all accepted with mechanisms, none waved through:** path match
broadened to `(^|[^A-Za-z0-9_-])<dir>/` and A-5's proof claim corrected as
previously overstated; append-only enforced by a mutation-proved witness arm; the
`contract` job's *required* status downgraded to `reported` throughout, with the
operator verification command named and its consequence stated; PROBE-M given a
fail-closed answer-to-outcome truth table, time box, hold state and escalation
owner; the 19th site (`scripts/workspace-doctor.mjs:665`) enumerated; the
compound-state guard (`SKILL.md:61-64`) routed to `area-taxonomy-split` with a
pinning requirement, its ordering half resolved as **observed**.

**Acceptance re-checked against the revision — all eight still hold, and three are
better evidenced than at version 6.** Line 2 (rename mechanism and how a `1.0.4`
user reaches the new index) now includes the corrected gate placement and a
recovery path for the mechanism it names. Line 3 (`kai-personal`'s fate) is
unchanged in substance but its uninstall-first instruction is now protected from
the detection check that would have deleted it. Line 4 (doctor recognition across
old and new identities) now covers the agent-procedure layer as well as the
doctor, closing the layer disagreement the review found. Lines 1, 5, 6, 7 and 8
are unchanged and were upheld under independent verification.

**No operator decision is required, and none was manufactured.** The reviewer
recorded that none was needed; this revision does not create one. PROBE-M′ remains
an operator **action** — P1-1 changed only when it runs and what it points at. One
operator **verification** stands from P2-3 (`contract` as a required status check
on `main`); it was not run because this session has no shell, and it is named as
`reported` rather than asserted as fact throughout.

No production code was written. Nothing under `scripts/`, `packs/`,
`plugin.json`, `agents/`, `skills/`, or `docs/` was touched — including
`docs/reference/plugin-structure.md`, which was read as evidence and **not
edited**. `kai/initiatives/area-plugins/` was not created and no `mkdir` was
attempted. Milestone 1's acceptance holds: no production code, manifest, or
marketplace change has been made. No `area-plugins-m2-*` record was touched.

## SRE re-review — 2026-08-27-2015 (principal-sre)

**`in-review -> ready`. Version 11. Lease cleared (all five fields null).
`next_role: principal-swe-architect`. Verdict `changes-requested` — P0 0,
P1 1, P2 5. The `independent-reliability` requirement is NOT discharged
(`satisfies_requirement: false`); milestone `decisions-locked` stays open and
`area-plugins-m2-planpacks-prefix` remains gated.**

Bound to `change_ref: null` (knowledge item, no commit) — specifically to the
**`DECISION 2026-08-27-2001` revision entry at record version 10**, read with the
1922 packet it amends. Full review and evidence register are the
`REVIEW 2026-08-27-2015` entry in
`kai/coordination/threads/area-plugins-migration-architecture.md`. Lease verified
against the dispatch packet immediately before the write: holder `principal-sre`,
token `apx-mig-sre2-20260827-2005-h1`, `version_at_grant` 9, record at version 10
— matched, no collision. The prior `completed_reviews` entry is preserved; this
one is appended beside it.

**All four prior P1s are discharged, and the citation discipline under test is
now sound.** Roughly twenty new line citations were re-derived against source
rather than trusted; every one resolves, including the five `migration-doctor.mjs`
citations P1-2's ruling depends on. `MARKETPLACE` proved to occur at only
`:56,740,854`, making "exactly one token-carrying step" a complete enumeration
rather than a sample. R2 is verified **not weakened** by the carve-out, nothing
the prior review upheld was weakened anywhere, and **no production code,
manifest, or marketplace change has been made** — confirmed by inspection that
none of the design's constructs appears outside the two coordination files, and
that `marketplace.json:2,10,15` and `pack-plan.mjs:49` are unchanged.

**One new P1, in the material this revision added — the concentration risk the
dispatch asked to be assessed, in concrete form:**

1. **P1-5 — inverting `MARKETPLACE_ALIASES` arms R2's ban on `kai`, so
   `RECOVERY-M` cannot pass the gate it must merge through.** D12 derives
   `banned marketplace names = MARKETPLACE_ALIASES`, banned everywhere outside
   `RENAME_EXEMPT_PREFIXES` with no block exemption, matched as a word-bounded
   exact name. `RECOVERY-M` step 2 sets `MARKETPLACE_ALIASES = ['kai']`, and step
   3 merges that commit "through normal branch protection" — the `contract` job
   where R2 lives. But `kai` is simultaneously the monolith's plugin identity
   (`scripts/lib/migration-doctor.mjs:51`), the repo slug, and the ~19 `@kai`
   tokens B-2 creates by design, plus `plugin-structure.md:227,231`'s
   `install kai@…`. The recovery patch turns its own required gate red, inside a
   one-working-day bound, on the only recovery path for the only irreversible
   act. The finding holds under both readings of the match shape. D4's namespace
   hazard (`LEGACY_PLUGIN === 'kai'`) names this collision for code comparisons
   and is never carried into R2's prose ban.

**Required:** reconcile D11 step 2, D12's banned-set box and R2's match shape so
`RECOVERY-M` is demonstrably green — via an append-only retired-marketplace-names
list decoupled from the live alias array, a token-shape-anchored match, or an
explicit re-sweep carried in step 2 with its cost against the one-day bound. The
remedy is an architecture call and the review does not make it.

**Five P2s**, to be answered or explicitly accepted in the same pass: (1)
PROBE-M′ step 5 does not name which doctor build runs, and the B-1 build scores
outcome C by construction — fails safe, but blocks B-2 falsely; (2) D13's
forbidden clause closes the alias-shaped repetition, not the class — "unrepeatable"
should be downgraded as A-5's proof claim was; (3) `managedBlock()` is a
convention to extend, not a function to reuse — single-block `indexOf`, `#`-marker
syntax, versus multiple HTML-comment blocks in Markdown; (4) `RECOVERY-M` bounds
the decision but not the restoration, and step 3's re-probe is discretionary
under time pressure; (5) the `contract` required-check verification should move
ahead of B-2, because P1-5 makes recovery's behaviour depend on it.

**The architecture remains sound and no redesign is requested.** The gate is now
correctly placed ahead of the irreversible act, PROBE-M′ is executable and is
correctly not over-read (it generalizes to host resolution semantics, not to the
installed base — which the record says itself), and `RECOVERY-M` is a genuine
runbook with all seven properties. The remaining work is narrow: make the
recovery mechanism survive its own detection check.

**No operator decision is required.** One operator *verification* (P2-5) should
precede B-2. No human on-call obligation is assigned. Nothing was executed — no
shell in this session; `kai/initiatives/area-plugins/` was not created and no
`mkdir` attempted; no production code, `scripts/`, `packs/`, `plugin.json`,
`agents/`, `skills/` or `docs/` file was modified; `area-plugins-m2-standalone-copy`
and its thread were not touched.

## Architect revision — 2026-08-27-2028 (principal-swe-architect)

**`ready -> in-review`. Version 13. Lease cleared (all five fields null).
`next_role: principal-sre` for the final re-review. The `independent-reliability`
requirement is still NOT discharged — **both** `completed_reviews` entries
(`changes-requested`, `satisfies_requirement: false`) are preserved, neither
deleted. Milestone `decisions-locked` stays open until the re-review verdict
lands.**

The one P1 is resolved and all five P2s disposed in `DECISION 2026-08-27-2028` in
`kai/coordination/threads/area-plugins-migration-architecture.md`, appended as a
new dated entry. **Nothing above it was rewritten**; an amendments index names
every superseded span. Lease was re-verified against the dispatch packet
immediately before this write: holder `principal-swe-architect`, token
`apx-mig-fix2-20260827-2020-i1`, `version_at_grant` 11, record at version 12 —
matched, no collision. This was a **narrow corrective pass**: everything the
reviewer upheld across both reviews stands verbatim and nothing else was
redesigned.

**P1-5 — remedy: Decouple.** `MARKETPLACE_ALIASES` is ruled a **recognition set
only**; no enforcement surface may derive from it. R2's marketplace-name ban is
re-derived as `RETIRED_MARKETPLACE_NAMES \ { MARKETPLACE }` — an explicit reviewed
list beside `MARKETPLACE` at `scripts/lib/migration-doctor.mjs:56`, guarded by
`∩ KAI_PLUGINS = ∅` against the **existing** exported set at `:55`, which already
contains `kai` via `LEGACY_PLUGIN` (`:51`) and every `packPluginName()` output.
The subtraction is the load-bearing part: under recovery `MARKETPLACE` becomes
`kai-plugins`, the ban **empties itself**, and no list is edited under stress —
the correct behaviour is the default rather than a step, and it re-arms
automatically if the rename is retried. `kai` cannot enter the set in any
direction. The root cause is named plainly: a **historical** fact was derived from
a **current** array, which is D5's defect one layer up, and D4's namespace hazard
was bound to code comparisons and never carried into R2's prose ban.

**`RECOVERY-M` is shown green arm by arm** — marketplace ban empty, identity ban
satisfied by D12's marked block, path ban untouched by a layer-3 change, the
required derived pins (`validate-plugin.mjs:861,878,898-899`) red-until-re-derived
and therefore self-announcing, R1 unaffected, D7's changelog interaction flagged
for the implementer. **Step 2 now starts from `git revert <B-2 merge>` plus one
line**, so the prose sweep-back is mechanical and complete rather than remembered,
the recovery diff is B-2's diff read backwards, and zero identities move.

**Two rejected shapes, with reasons.** Token-shape anchoring does not resolve the
force (`@kai` is exactly what B-2 creates), would drop
`skills/kai-core-fleet-observation/SKILL.md:94`'s `kai-plugins/kai` out of R2's
coverage, and collides with D13's deliberate permission to name an alias as
recognised. Paying for the inversion with an incident-time re-sweep puts a
whole-tree diff on the critical path to satisfy a check that should not have
fired — rejected as the mechanism, adopted as a consequence.

**Five P2 dispositions.** PROBE-M′ step 5 names the **B-2 candidate build**, and a
run under any other build is **void, not outcome C**, so a build slip cannot fake
a boundary-#5 escalation. D13's "unrepeatable" is downgraded exactly as A-5's
proof claim was, and the reviewer's counterexample is closed by deriving the
forbidden phrase over `MARKETPLACE_NAMES` rather than aliases alone. "Nothing is
invented" is corrected — the `managedBlock` **convention** is reused, the **helper
is generalized**, named as bounded work in A-3. `RECOVERY-M` gains restoration
targets beside its decision bound (1 + 1 + 1 working days, two legs review-bound
and stated as targets, no rota created), and step 3's discretionary re-probe is
replaced by a default of *no probe* with a signal-keyed exception decided at
step 1. The `contract` required-status verification is promoted to a **B-2 merge
prerequisite** — still `reported`, not run, no shell.

**R2 verified not weakened.** The forward ban set is byte-identical
(`{kai-plugins}` under both derivations), the match shape is untouched, and the
two sites that would break first were re-read this session. One residual is named
rather than hidden: the docs half of the **reverse**-direction sweep is
runbook-enforced, not gate-enforced, because the string `kai` is unbannable. Its
blast radius is a loud first-use failure for a **new** installer, not a silent
stranding of an existing install. The symmetric positive rule is **deferred with
a trigger** (first real `RECOVERY-M` invocation, or a second marketplace rename)
rather than built inside a corrective pass.

**Acceptance re-checked against this revision — all eight still hold.** Line 2
(rename mechanism and how a `1.0.4` user reaches the new index) is strengthened:
its recovery path now passes its own gate. Line 5 (the derived `legacy-rollback`
forbidden set covering every publishable identity) is untouched — D14 changes the
*prose ban's* source, not `RETIRED_PACK_PLUGINS` or the forbidden-name derivation
that feeds `legacy-rollback`. Lines 1, 3, 4, 6, 7 and 8 are unchanged and were
upheld under independent verification across both reviews.

**No operator decision is required, and none was manufactured.** The reviewer
raised none. PROBE-M′ remains an operator **action**; P2-5 remains an operator
**verification**, now sequenced before B-2 because P1-5 made recovery's behaviour
depend on its answer, and `RECOVERY-M` step 3 is written to be correct under both
answers.

No production code was written. Nothing under `scripts/`, `packs/`,
`plugin.json`, `agents/`, `skills/`, or `docs/` was touched — every file cited
was read as evidence and not edited. `kai/initiatives/area-plugins/` was not
created and no `mkdir` was attempted. Milestone 1's acceptance holds: no
production code, manifest, or marketplace change has been made — `observed` to the
extent that no file outside `kai/coordination/**` carries any construct of this
design; "no uncommitted change anywhere in the tree" stays `reported`, because
this session has no shell. No `area-plugins-m2-*` record and nothing under
`kai/initiatives/pack-split/` was touched.

## Reliability re-review — 2026-08-27-2042 (principal-sre, final)

**`in-review -> ready`. Version 15. Lease cleared (all five fields null).
`next_role: principal-swe-architect`. Verdict NOT-READY / `changes-requested` —
P0 0, P1 1, P2 2, `satisfies_requirement: false`. The `independent-reliability`
requirement is NOT discharged. All three `completed_reviews` entries are
preserved; none deleted.**

Bound to **`DECISION 2026-08-27-2028` (revision 3)** — the newest dated DECISION
entry in the thread, appended after `REVIEW 2026-08-27-2015` — at item version 14.
Lease re-verified against the dispatch packet immediately before this write
(holder `principal-sre`, token `apx-mig-sre3-20260827-2030-j1`,
`version_at_grant` 13, record at version 14): matched, no collision. No shell this
session; nothing executed, and every claim requiring execution is `reported`.

**P1-5 is genuinely discharged, and the fix is the strongest work in this
record.** Every code anchor was re-derived from source rather than trusted —
`migration-doctor.mjs:51,55,56` and its five live `KAI_PLUGINS` consumers,
`validate-plugin.mjs:48` and the four `${MARKETPLACE}` pin spans at
`:861,878,898-899`, `pack-plan.mjs:63-92,99,151`. The self-emptying property holds
in both directions, and in the case the record does not test: adding `kai` to
`RETIRED_MARKETPLACE_NAMES` post-B-2 fires the entry guard rather than silently
emptying the forward ban. The guard's deliberate omission of `MARKETPLACE` is
right, not a hole. P1-5 was in fact **worse than the prior review scored it** —
six previously unnamed `marketplace add RubenSaucedo/kai` sites would also have
gone red, one inside the generator-derived installer skill, making the old scheme
mutually unsatisfiable. DECOUPLE leaves **no** enforcement gap: re-coupling was
tested and is impossible in any direction without recreating P1-5, which retires
both rejected alternatives on harder grounds than the record gives.

**The named residual is accepted.** Verified from source that a marketplace is
added **by repo slug** (`README.md:12,78,135`, `docs/getting-started.md:16,105`,
`kai-core-workspace-onboarding/SKILL.md:85`) with its name declared at
`marketplace.json:2` — so after recovery a stale `@kai` token names a marketplace
no host declares, cannot resolve, and cannot resolve to a third party. "Loud
first-use failure for a new installer, not silent stranding" is upgraded from
`inferred` to `observed`. The protected population is untouched in every branch,
the highest-traffic path is gate-enforced, and the residual exists only on the
non-default hand-authored branch. Correctly sized, correctly deferred.

**Nothing upheld across both prior reviews was weakened**, and no production
code, manifest, or marketplace change was made — confirmed by inspection that no
construct of this design appears outside `kai/coordination/**`, that
`marketplace.json:2` is still `"kai-plugins"`, and that `pack-plan.mjs:49` is
still `PACKS_DIR = 'packs'`.

**One new P1, in the same structural seam as P1-5, one door down — and in the
one arm the record's own green table did not verify.**

1. **P1-6 — D7's PR-level assertion is unsatisfiable, so `RECOVERY-M` and every
   mechanism PR are red.** D7(b) asserts `git diff --name-only --no-renames
   base...head` ∩ `RENAME_EXEMPT_PREFIXES` = ∅ *"regardless of intent"*, and that
   constant contains `CHANGELOG.md`, `scripts/lib/pack-plan.mjs` and
   `scripts/lib/migration-doctor.mjs`. But `release-guard.mjs`'s `evaluate()`
   **requires** `CHANGELOG.md` on every behaviour PR (`BEHAVIOR_PREFIXES` includes
   `scripts/`; `BEHAVIOR_FILES` includes `.github/plugin/marketplace.json`), and
   A-4 **must** edit `pack-plan.mjs` while B-2 **must** edit
   `migration-doctor.mjs`. Both rules run in the same required `contract` job
   (`validate.yml:31,43,66-68`). `RECOVERY-M` step 2's revert fails on all three
   counts. The D14 green table closes this arm with a *"release-notes carve-out
   already in D7"*; D7 was read in full and contains no such carve-out. Root cause
   is D14's own thesis with different nouns: one array carrying **ban-scan scope**
   and **history-immutability scope**, whose memberships must differ.

**Required:** make `RECOVERY-M` and every mechanism PR demonstrably satisfiable —
most directly by splitting the constant as D14 split the other one (a separate
`HISTORY_IMMUTABLE_PREFIXES` for the D7(b) assertion holding only the genuine
history roots, leaving `RENAME_EXEMPT_PREFIXES` untouched for R2's scan), then
re-running the green table's D7 row and stating which PRs the assertion binds. The
remedy is an architecture call and the review does not make it. Nothing else is
reopened.

**Two P2s.** (6) the six `marketplace add RubenSaucedo/kai` repo-slug sites are
still unenumerated and are exactly where the deferred positive rule will have to
decide whether a repo slug is a marketplace token; (7) the green table's pin row
says "red until the installer skill is re-derived", but step 2's revert restores it
and the pins come back green — the runbook tells a stressed operator to expect red
where they will see green.

**The architecture remains sound and no redesign is requested.** D0–D14, R1, R2,
the sequencing, the residual and the recovery runbook's shape all stand. The
remaining work is one seam, with a shape this record has already proven twice.

**No operator decision is required.** P2-5's `contract` required-status check
remains an operator *verification* and stays `reported`; PROBE-M′ remains an
operator *action*. No human on-call obligation is assigned.

**Milestone `decisions-locked` stays open.** `scope.current` does not advance to
`optional-core-contract`, and `area-plugins-m2-planpacks-prefix` — which carries a
typed edge on this item's `completed` state — remains gated. Nothing was executed;
`kai/initiatives/area-plugins/` was not created and no `mkdir` attempted; no
production, `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/` or `docs/`
file was modified; `kai/initiatives/pack-split/` and every `area-plugins-m2-*`
record were left untouched.

---

## Architect revision — 2026-08-27-2053 (principal-swe-architect, revision 4)

**`ready -> in-review`. Version 17. Lease cleared (all five fields null).
`next_role: principal-sre`. All three `completed_reviews` entries preserved;
none deleted, none altered.**

Lease re-verified against the dispatch packet immediately before this write
(holder `principal-swe-architect`, token `apx-mig-fix3-20260827-2045-k1`,
`version_at_grant` 15, record at version 16): **matched, no collision.** No shell
this session; nothing executed. Every CI outcome asserted is
`derived-from-source`, read from `scripts/release-guard.mjs` and
`.github/workflows/validate.yml`, never `observed`.

Appended `DECISION 2026-08-27-2053` (revision 4) to the thread. Append-only — no
prior DECISION, REVIEW or HANDOFF entry was altered. `kai/initiatives/area-plugins/`
was not created and no `mkdir` was attempted.

**P1-6 accepted in full; the reviewer was right and the "carve-out already in D7"
close was unsupported.** D7 was re-read in full (`thread:627-660`): the constant
is at `:635-642`, the assertion at `:652-655`, and *"regardless of intent"*
forecloses the carve-out I cited. The defect is **worse than scored**: because
`release-guard.evaluate()` makes `CHANGELOG.md` mandatory on every behaviour PR
(`release-guard.mjs:64-66`) and every PR in the plan touches a behaviour path
(`:20,21-26`), D7(b) was unsatisfiable for **all eight** PRs — A-1 through B-2 plus
the recovery patch — not five. Three further collisions the review did not
enumerate: A-3 could not land the rule at all (the constant is declared in
`pack-plan.mjs`), B-1 fails on a distinct `test/` arm (its fixture arms are
*added*, `thread:716`), and **`RECOVERY-M` step 2 fails a fourth, previously
unnamed way — a revert is anti-monotonic and `isForwardBump` (`:39-49`) rejects
the version downgrade a revert of B-2 produces.**

**D15 — the scopes are split, and D7 is not weakened.** `RENAME_EXEMPT_PREFIXES`
stays byte-for-byte unchanged as the **ban-scan scope** read by
`validate-plugin.mjs`. A new `HISTORY_APPEND_ONLY_PATHS` (`CHANGELOG.md`,
`kai/library/releases/`, `docs/proposals/`, `test/fixtures/host-installs.json`)
becomes the **immutability scope**, with a different predicate — **deleted-line
count == 0: these files may grow, they may not be rewritten** — which is the
acceptance line's own verb. It lives beside `evaluate()` in `release-guard.mjs`,
the function that already owns "what may a PR contain" and already computes the
diff (`:74-80`), so the rule requiring the changelog append and the rule
constraining it are now in the same function and cannot drift apart again. **No
new job, workflow step, script, module or import.** Every change to D7(b) is a
*relaxation*, and the only newly-permitted behaviour is *appending* — which no
rename sweep does.

**Four arm-by-arm confirmations demonstrated in the record:** (i) **A-4 merges**;
(ii) **B-2 merges**, and its sweep still cannot reach `docs/proposals/`, where
`pack-architecture.md:6,26,109,139` carries four live sweep-bait tokens;
(iii) **`RECOVERY-M` step 2 merges** with two added mechanical commands
(`git revert -n` plus one `git restore` of `CHANGELOG.md` / `plugin.json` /
`package.json` / `package-lock.json`; `README.md` deliberately excluded so the
prose sweep-back survives); (iv) **`CHANGELOG.md` and `kai/library/releases/**`
remain immutable to a rename sweep, protected twice** — D7(a) makes them invisible
to the checker that directs sweeps, and D15 reds any rewrite that reaches them
anyway. `kai/coordination/items/**` and `kai/initiatives/**` are deliberately
outside the new constant because they are mutable state machines — an append-only
rule over them would red this very pass — and keep the acceptance line's
protection through D7(a).

**Both P2s disposed.** P2-6: all six `marketplace add RubenSaucedo/kai` sites
enumerated (`README.md:12,78,135`, `docs/getting-started.md:16,105`,
`skills/kai-core-workspace-onboarding/SKILL.md:85`) plus four further repo-slug
shapes (`getting-started.md:180-184,195,200,215`), with the constraint recorded
that the deferred positive rule must key on **token shape, never command
position** — a repo slug is an address, the name is declared at
`marketplace.json:2` — or it recreates P1-5 against the generator-derived
installer skill. P2-7: the green table is reissued; the pins row now reads GREEN
by construction on the revert branch and red only on the hand-authored fallback,
with a new version/release-artifact row and a one-line operator summary.

**Nothing else reopened.** D0–D14, R1, R2, the two-release sequencing, PROBE-M as
the publish gate, and the named residual all stand untouched.

**Milestone 1's acceptance holds.** No production code, manifest, or marketplace
change was made — `.github/plugin/marketplace.json:2` still reads `"kai-plugins"`
and `pack-plan.mjs:49` still reads `PACKS_DIR = 'packs'`. No file under
`scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/` or `docs/` was modified;
all were read as evidence. `kai/initiatives/pack-split/` and every
`area-plugins-m2-*` record were left untouched.

**Definition-of-done self-check.** `independent-reliability` is a review
requirement I cannot self-discharge; the item goes to `in-review` for
`principal-sre`, not to `completed`. Milestone `decisions-locked` stays **open**,
`scope.current` does not advance, and `area-plugins-m2-planpacks-prefix` remains
gated on this item reaching `completed`. Nothing here is `shipped` — no human has
deployed or verified anything.

**No operator decision is required, and none was manufactured.** P2-5's `contract`
required-status check remains an operator *verification* and stays `reported`;
PROBE-M and PROBE-M′ remain operator *actions*. No human on-call obligation is
assigned.

---

## Reliability review — 2026-08-27-2228 (principal-sre, fourth and final-intent pass)

**`in-review -> completed`. Version 19. Lease cleared (all five fields null).
`next_role: principal-product-manager`. All three prior `completed_reviews`
entries preserved; a fourth appended.**

**Verdict: CONDITIONAL (`approved-with-conditions`) · P0 0 / P1 0 / P2 4 ·
`satisfies_requirement: true`.** Binds explicitly to **`DECISION 2026-08-27-2053`
(revision 4)** — the newest dated DECISION entry in the thread (`thread:3269`) —
at item version 18. Full reasoning in `REVIEW 2026-08-27-2228`.

Lease re-verified immediately before the write: holder `principal-sre`, token
`apx-mig-sre4-20260827-2240-r1`, `version_at_grant` 17 against record version 18
(the grant increments — not a collision). **Matched.** No shell this session;
`gh`, `node`, `npm` and `git` were not run, so every CI outcome is
`derived-from-source` and only first-hand file reads are `observed`.

**P1-6 is genuinely discharged.** Not read back from the record — every anchor was
re-derived from source and all eight PR arms were re-run independently against
`evaluate()` (`release-guard.mjs:52-71`). The unsatisfiability is gone: the
recovery patch merges, seven of eight PRs are unconditionally green, and B-1 is
conditionally green with a loud failure and a trivial fix (P2-10). The
`CHANGELOG.md` append is genuinely 0 deletions — verified from `CHANGELOG.md:1-7`
being newest-first — and `kai/library/releases/**` grows by whole new files (16
ship-records counted). `docs/proposals/pack-architecture.md:6,26,109,139` confirms
four live sweep-bait tokens and both protection legs.

**The `isForwardBump` finding holds.** Verified at `release-guard.mjs:39,44-47`
and `:61-63`: a revert of B-2 is anti-monotonic and would have been red on the
version check **even after D7(b) was fixed**. The architect found this themselves
and no reviewer had named it. The `git revert -n` + selective `git restore` recipe
satisfies every arm including the previously unevaluated version/release-artifact
arm, and excluding `README.md` from the restore is the correct subtle call —
`:67-69` requires only that it appear in the diff, so the prose sweep-back
survives.

**Citation discipline — the standard under test across all three prior passes —
holds.** Roughly two dozen anchors re-derived this session; **every one exact.**

**The "every change is a relaxation" claim was tested hard, and it splits.** The
*design* is safe: the new forbidden set is a strict subset of the old on the path
axis, the predicate is strictly weaker on retained paths, and **no rewrite of a
retained path is newly permitted**. The *summary* is inaccurate on two axes —
dropped paths newly permit rewriting (not only appending), and the binding axis
tightens from "the rename PRs" to "every pull request", contradicting "nothing
becomes newly forbidden anywhere". Every functional conclusion the summary supports
holds when re-derived independently, which is the distinction that keeps this a P2:
revision 3's defect broke a function; revision 4's imprecision mis-describes a
function that works.

**The mirror-image risk in question 4 is real and was found.**
`HISTORY_APPEND_ONLY_PATHS ⊆ ban-scan coverage` is an unenforced cross-list
invariant, and violating it would recreate P1-6 in the new pair. It fails
**loud-closed** where D14's divergence failed **silent-open**, and current
membership satisfies it, so it is P2 rather than P1 — severity follows the failure
direction, not the structural resemblance.

**Nothing upheld across the three prior reviews was weakened.** D7(a) /
`RENAME_EXEMPT_PREFIXES` byte-for-byte unchanged at `thread:635-642`; R2, D12's
marked block, D14's three banned sets and its entry guard untouched; the named
residual and its `observed` upgrade intact; the thread append-only across all seven
entries. The Historical-records acceptance annotation is **honest rather than
overclaimed** — it states plainly that D15 covers two of the four named paths while
all four keep D7(a) — and that honesty is what keeps the line satisfied given P2-9.

**No production, manifest or marketplace change.** Both constants appear only in
the two `kai/coordination/**` files; `marketplace.json:2` is still `"kai-plugins"`;
`pack-plan.mjs:49` is still `PACKS_DIR = 'packs'`; `release-guard.mjs` contains no
`--numstat` and no deleted-line predicate — **D15 is specified, not implemented**,
which is correct for a knowledge item. Milestone 1's acceptance holds.
`kai/initiatives/pack-split/` and every `area-plugins-m2-*` record untouched.

**Four P2 conditions ride with PR A-3's implementation, not with this record.**
None reopens architecture and none gates the milestone: P2-8 (state and self-test
the cross-list invariant), P2-9 (correct the relaxation summary; rule explicitly on
`kai/coordination/threads/**`, which is append-only by contract and would pass the
predicate), P2-10 (a JSON-object append is not a 0-deletion operation in the
general case — resolve before B-1 is authored), P2-11 (`git revert -n` needs
`-m <parent>` if B-2 lands as a true merge commit). `principal-swe-infra` owns the
*how*. **Standing condition:** the first real execution of D15's predicate is
A-3's CI run; if it contradicts any arm, that is a new reliability question, not a
discharged one.

**Definition-of-done self-check.** The `independent-reliability` review requirement
is **discharged** — it is the item's only review requirement, and it was reviewed
by a role that did not author the design. All eight acceptance lines are checked
with evidence. The artifact is promoted to
`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-migration-architecture.md`;
the thread stays the append-only audit trail including all three
`changes-requested` verdicts. Lease cleared, `owner: null`, version bumped.
**Nothing here is `shipped`** — no human has deployed or verified anything, no
release state moved (`workflow-ship` alone owns those transitions), the marketplace
publish remains an operator action, and no human on-call obligation is assigned.

**Milestone `decisions-locked` can now close.** That is the steward's call, not
mine. On closure, `area-plugins-m2-planpacks-prefix` and the milestone-2 chain are
unblocked.

**Two non-gating notes for the steward.** (1)
`kai/initiatives/area-plugins/artifacts/decisions/README.md` still lists this
decision as *"in review (4th reliability pass owed)"*; I deliberately did not edit
it, as it sits outside this item's declared `touches`. (2) `lease.acquired` read
`2240` while the session clock read `2227` — a ~13-minute skew, flagged rather than
silently reconciled.
