---
type: work-item
id: area-plugins-m2-doctor-standalone
title: SPIKE then fix — the migration doctor still ships "core is required, never optional" and blocks a legitimate standalone install
initiative: area-plugins
milestone: optional-core-contract
delivery_class: product-change
state: ready
resume_state: null
priority: 70
owner: null
next_role: principal-swe-infra
target: migration-doctor standalone classification
artifact_target: null
context_artifacts:
  - kai/coordination/threads/area-plugins-m2-decomposition.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - scripts/lib/migration-doctor.mjs
  - scripts/workspace-doctor.mjs
  - test/fixtures/host-installs.json
touches:
  - scripts/lib/migration-doctor.mjs
  - scripts/workspace-doctor.mjs
  - test/fixtures/host-installs.json
  - package.json
  - package-lock.json
  - CHANGELOG.md
depends_on:
  - item: area-plugins-m2-mode-selection
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
  - role: principal-sre
    kind: independent-reliability
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1944
---

## Outcome

The shipped doctor stops asserting *"core is required, never optional"*, and stops
telling a legitimate standalone user that their install is `blocked` — **or**, for
the classification half only, the honest reason it cannot is recorded and that half
is deliberately deferred to milestone 3 with a trigger. Per steward ruling A5
(2026-08-27-1944), the false assertion itself is not deferrable.

## Acceptance

- [ ] **Steward ruling A5 binds this item (2026-08-27-1944). Part (i) is
      unconditional and must ship inside milestone 2:** no shipped kai diagnostic
      asserts that `kai-core` is required. The remediation step
      `# core is required, never optional` is gone, and the `partial-pack-set`
      finding states **both** branches truthfully — a deliberate core-less install
      is a *supported standalone install*; a core install that failed is fixed by
      installing core.
- [ ] **Part (ii), the steward's default disposition:** a core-absent-**only**
      install is not reported as invalid. Mechanism is the Spike's and the
      architect's call — downgraded severity, a new status, or a distinguishing
      signal — and this line does not choose one. Defeasible **only** by a
      `principal-sre` `independent-reliability` BLOCK, which is not relabelable by
      this item, the steward, or a reviewer; on that verdict part (ii) escalates to
      the operator and its home becomes milestone 3 (`surface-rename`).
- [ ] **Spike first, time-boxed to one day.** Answer, in this item's thread, with
      evidence from `scripts/lib/migration-doctor.mjs` and the host fixtures:
      *can `--migration-check` distinguish a deliberate standalone install from a
      failed or partial core install using host state alone?* Both present
      identically — a department pack installed, no core.
- [ ] The spike's answer is written down **before** any code changes, along with
      which of the dispositions below it selects and why.
- [ ] **Then, per the answer:**
      - [ ] *Signal exists:* `partial-pack-set` is reclassified — the legitimate
            case is not reported as invalid, `blocked` preserved for the genuinely
            broken one — and every affected `MIGRATION_CASES` entry plus its host
            fixture is updated.
      - [ ] *No sound signal:* **the steward's fallback is already decided and this
            item does not bounce back for it** — the doctor reports the ambiguity
            truthfully rather than resolving it against the user. "Core absent and
            nothing else wrong" is a valid install after this milestone; a failed
            core install almost always leaves other evidence that already carries
            its own finding (`legacy-installed`, `coexistence`, `stale-install`,
            `provenance-collision`, `unreadable-metadata`,
            `install-tree-unverified`, `enabled-state-unverified`,
            `disabled-install`). Proceed on that basis, subject to the SRE review.
      - [ ] *Defer:* **available for part (ii) only.** The classification/status
            work may move to milestone 3 (`surface-rename`), whose acceptance
            already owns doctor classification correctness through the transition,
            with the deferral and its trigger recorded here. **Part (i) may not be
            deferred** — a false sentence is not a reliability trade.
- [ ] Whatever ships, `node scripts/workspace-doctor.mjs --self-test` is green and
      no migration case is weakened without a stated replacement signal. The
      `blocked` verdict for every genuinely-broken install is preserved, and
      `unknown` is still not a softer `clear`.
- [ ] `.kai/manifest.json`-absent handling is reviewed in the same pass: a
      core-less run must not be reported as an un-onboarded full-mode workspace
      when the two are distinguishable. **Review obligation, not a second milestone
      requirement.**
- [ ] `npm test` green and `release-guard` passes with a forward version bump.
      Part (i) changes `scripts/lib/migration-doctor.mjs`, a `release-guard`
      behaviour path, so **code ships and the terminal state is `shipped`** — the
      "nothing ships" branch is closed.
- [ ] No generated tree, block file, gate, or plugin identity changed.

## Evidence

- <Filled as work progresses: the spike answer, fixture diffs, self-test output,
  reviews.>

## Notes

**Size: M, pending spike — S if message-only, L if the doctor's status vocabulary
gains a third verdict. Release: planned `1.0.10` only if the spike returns code.**

**The finding this item exists for, with exact citations.** The accepted
architecture scoped this as "doc/UX only — `workspace-doctor` reports a core-less
run as `standalone` rather than 'not onboarded'". Grounding it found the real
contradiction one layer down and stronger:

- `scripts/lib/migration-doctor.mjs:736-741` emits a **`refusal`**-severity
  finding, `partial-pack-set`: *"…installed without `kai-core` — a department pack
  inherits its operating contract from core, and core missing does not raise a
  host error."* It appends the remediation step
  `copilot plugin install kai-core@kai-plugins   # core is required, never optional`.
- `scripts/workspace-doctor.mjs:661-666` pins that verdict as `status: blocked` in
  the self-test's `MIGRATION_CASES`.

That is **shipped, self-tested, user-visible copy asserting the exact proposition
this milestone exists to retire**, and it lives in a file the architecture
record's per-gate disposition table never reaches. It is a fourth encoding of
"core is required", alongside the preflight block, the skew refusal, and the
degraded refusal.

**Why it is a Spike and not an estimate.** Distinguishing *deliberate standalone*
from *core install failed* is not obviously decidable from host state — the two
look identical. Relaxing `partial-pack-set` to `clear` removes a signal that
currently catches a genuinely broken install; keeping `blocked` keeps a false
alarm for a legitimate user. Sizing through that fog would be guessing, and the
answer changes the size by an order of magnitude because the doctor's status
vocabulary is asserted across roughly thirty `MIGRATION_CASES`.

**`required_for_milestone` — routed as a question, now answered `true`.**
Milestone 2's written acceptance did not name the doctor, so `false` was faithful
to the text when this item was minted, and the manager deliberately did not settle
it by setting a flag. The steward ruled on 2026-08-27-1944: the acceptance gains
the line, and this flag is now `true` (see the ruling section below and STEWARD
AMENDMENT 2026-08-27-1944 A5 in
`kai/coordination/threads/area-plugins-scope-brief.md`). The question that was
routed — **does `optional-core-contract` close with its own doctor contradicting
its outcome statement?** — is answered **no**.

**Why this split away from the docs item.** It was one PR in the accepted plan.
Three reasons to separate: one owner each (infra vs. technical writer);
`release-guard`'s `BEHAVIOR_PREFIXES` (`scripts/release-guard.mjs:20`) covers
`scripts/` but exempts `docs/`, so this needs a version bump and the docs do not;
and decisively — **half of that PR was this spike**, and shipping it inside an item
labelled "doc/UX only, nothing else depends on it" would have buried an unsized
unknown.

**Reviews.** `principal-swe-architect` — the doctor's classification contract.
`principal-sre` / `independent-reliability` — this one genuinely earns it:
relaxing a `blocked` verdict removes a signal that today catches a broken install,
and that trade is a reliability judgment, not a mechanical one.

### Steward promotion + RULING 2026-08-27-1944 (`principal-product-manager`)

`proposed -> ready`, priority **70**, version 1 -> 2, `owner: null`, lease
untouched and null. **`required_for_milestone: false -> true`.** Full ruling:
`kai/coordination/threads/area-plugins-scope-brief.md`, STEWARD AMENDMENT
2026-08-27-1944 (A5).

**Ruling: (a) — milestone `optional-core-contract` does not close with its own
doctor saying the opposite of what it shipped.** The manager was right to route
this rather than settle it by flag, and right that the flag was faithful to the
acceptance as written. The acceptance was wrong, so I amended the acceptance.

**Verified from source myself before ruling, not from the summary:**
`scripts/lib/migration-doctor.mjs:736-741` (the `refusal` finding and the literal
`# core is required, never optional`), `scripts/workspace-doctor.mjs:661-666`
(`status: 'blocked'` pinned in `MIGRATION_CASES`). Two further facts I checked
that the plan does not state and the ruling rests on: `migration-doctor.mjs:869`
derives status from severity over exactly `blocked` / `unknown` / `clear` — there
is **no `standalone` status**, so "report it as standalone" is a vocabulary
change, which is why the Spike is honest; and the self-test's `steps` regex
matches the *command*, not the trailing comment, so **the false sentence is
removable without perturbing the case set**. That separability is what made
ruling (a) affordable and is why it splits into parts (i) and (ii).

**Why not the cheaper option.** *"core is required, never optional"* is not an
ambiguous verdict about one install; it is a flat statement about the product that
milestone 2 makes false. Ambiguity about the install is real and is what the Spike
is for. And the schedule argument was weaker than it looked: this item depends only
on `area-plugins-m2-mode-selection`, so it runs **in parallel with the docs item**
— required status adds a spike day, an S/L change and an SRE pass to a tail that
exists anyway, without deepening the critical path.

**Bounded, so this does not become a scope hole.** Both doctor files are already
explicit BRIEF `targets`. The ruling adds no gate, surface, step, field or
capability — it removes a statement the milestone itself falsifies. Everything
beyond that (marketplace-identity recognition through the rename, any wholesale
status-vocabulary redesign, the `.kai/manifest.json` question) stays where it
already lives, in milestone 3's acceptance or as a review obligation here.

**What stays the same:** `blocked` for every genuinely-broken install; `unknown`
is not a softer `clear`; no new status is mandated; no generated tree, block file,
gate arm, `hooks.json` owner or plugin identity changes; milestone 2 still ships on
the existing five identities under the existing marketplace name.

**Priority 70 — ahead of the docs item, and deliberately.** Its dependency set is
smaller (mode-selection only, versus mode-selection *and* standalone-proof) and its
tail is the longest in the milestone: spike -> disposition -> code -> two reviews.
It should start the moment its dependency clears.
