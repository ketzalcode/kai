---
type: work-item
id: area-plugins-m2-claim-surface-pin
title: Pin the claim surface before relaxing the load path — CLAIM_SKILLS, the --gate partition extension, standaloneBlockErrors(), and the partial-core skew arm
initiative: area-plugins
milestone: optional-core-contract
delivery_class: product-change
state: ready
resume_state: null
priority: 40
owner: null
next_role: principal-swe-infra
target: claim surface pin (CLAIM_SKILLS + --gate partition)
artifact_target: null
context_artifacts:
  - kai/coordination/threads/area-plugins-m2-decomposition.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/lib/degraded-block.txt
touches:
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - package.json
  - package-lock.json
  - CHANGELOG.md
depends_on:
  - item: area-plugins-m2-planpacks-prefix
    requires: shipped
  - item: area-plugins-m2-standalone-floor
    requires: shipped
  - item: area-plugins-taxonomy-round-3
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
  - role: principal-security
    kind: independent-security
completed_reviews: []
change_ref: null
version: 4
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2113
---

## Outcome

The no-false-claim guarantee's structural anchor exists in CI **before** the
relaxation that depends on it: the Claim-family procedures are mechanically
pinned core-only, and the linter that will govern the standalone block ships
ready but unused.

## Acceptance

- [ ] `CLAIM_SKILLS` is added to `scripts/lib/pack-plan.mjs` and **enumerates all
      14 members explicitly** — `kai-core-work-coordination`,
      `-peer-communication`, `-work-activity`, `-definition-of-done`,
      `-initiative-stewardship`, `-fleet-observation`, `-workspace-onboarding`,
      `-decision-brief`, `-executive-consultation`, `-personal-agenda`,
      `-proactive-scan`, `-pulse-digest`, `-pr-delivery`, `-issue-analysis` — with
      a comment stating that membership is a guarantee boundary, not a
      convenience list.
- [ ] `--gate partition` asserts **every** `CLAIM_SKILLS` member is provided by
      `core` and by **no** area, and that `workflow-workspace-init` and
      `kai-core-workspace-onboarding` are **co-located in `core`**. Both
      assertions are green on today's tree.
- [ ] `standaloneBlockErrors()` is added, modelled on `degradedBlockErrors()`,
      and **lands unused** — no block is wired to it in this item. It asserts, at
      minimum: names `` `kai-core` ``; only refuses / prohibits / offers the one
      remedy; carries **no** `KAI-CORE-MISSING` token; states **no** `contract:`
      version; restates no `coreContractLines()`; is size-budgeted; and carries
      exactly one install path, exactly one continue path, one prohibition per
      pinned disclaimer, the `once` instruction, the do-not-repeat prohibition,
      the no-retroactive-promotion prohibition, and the four forbidden path
      literals.
- [ ] A `partial-core` arm is added to `--gate version-skew`: core present, probe
      answers `contract: 1`, a Claim-family skill absent -> the degraded refusal
      still governs. **`degraded-block.txt` bytes are unchanged.**
- [ ] Every new assertion owes a **mutation case** in the `pack-preview`
      self-test; a rule with no mutation proving it is not landed.
- [ ] **This item is byte-neutral on `packs/`.** `pack-preview --check` reports
      byte parity and the diff contains zero changes under `packs/`.
- [ ] `--gate partition`, `--gate collision`, `--gate partial-install`,
      `--gate version-skew` and `--check` are all green; `npm test` green;
      `release-guard` passes with a forward version bump.
- [ ] No block file's bytes change; `evaluatePreflight` is untouched;
      `planPacks()` is untouched by this item.

## Evidence

- <Filled as work progresses: diff, gate output, self-test output, reviews.>

## Notes

**Release/version: planned `1.0.7`, inside `1.0.x`.**

**Why this ships before the behaviour it protects.** It asserts a property that
**already holds today**, so it lands green and cannot regress — and it puts the
mechanism in place before the relaxation that needs it. Condition **C2** makes the
ordering binding rather than advisory: there must never exist a commit in which
core is optional and the claim surface is unpinned. The downstream item
`area-plugins-m2-mode-selection` carries the typed
`depends_on: {item: area-plugins-m2-claim-surface-pin, requires: shipped}` edge
that encodes it. **A PR that reverses or merges these two fails review on this
line alone.**

**This item is the structural half of relaxation R1.** In a core-less session the
lease grammar, the handoff packet format, the `shipped` gate, the activity
ledger, the initiative machinery and the workspace-minting procedure are **not on
disk**, and `workflow-workspace-init` — the only agent that runs onboarding — is
a core agent that is not installed either. That is withheld capability, not a
request for good behaviour, and this gate is where it becomes mechanical.

**What moved in from PR-3, and why that is not re-litigation.** The accepted
architecture ruled the *block swap and the gate inversion* atomic. The
`partial-core` skew arm is neither: it asserts byte-unchanged degraded behaviour
and is green on today's tree, giving it this item's character exactly ("asserts a
property that already holds, lands green, cannot regress"). Every assertion moved
out of PR-3 is one less thing a red `--check` there can be blamed on. **If the
implementing engineer finds it genuinely entangled with `evaluateMode`, it returns
to `area-plugins-m2-mode-selection` and this item ships without it** — recorded as
revisable, not dictated (`kai/coordination/threads/area-plugins-m2-decomposition.md`,
PLAN 2026-08-27-1922).

**Sizing: L.** `standaloneBlockErrors()` carries roughly ten required-clause
assertions, each owing a mutation case in the ~930-line self-test
(`scripts/pack-preview.mjs:308-1237`), plus the 14-member set, the co-location
assertion, and the new arm.

**Main sizing risk — the membership boundary.** `CLAIM_SKILLS` is a judgment
line copied from the architecture's family table, and both error directions are
silent: too few members weakens the guarantee, too many red-light a legal roster
edit in milestone 4. That is why the enumeration is an acceptance line and why the
list is written out rather than derived.

**Reviews.** `principal-swe-architect` — it changes a gate and the generator's
constants. `principal-security` — this item *is* the no-false-claim guarantee's
mechanical anchor; the same surface carried an independent security review in
`pack-split-degraded-refusal` and `pack-split-preflight-compat`.

**Condition C3 travels with this milestone:** a substantiated false durability
claim from a standalone agent is a P0 that reopens BRIEF boundary #1 with
evidence.

### Steward promotion 2026-08-27-1944 (`principal-product-manager`)

`proposed -> ready`, priority **40**, version 1 -> 2, `owner: null`, lease
untouched and null. Recorded in
`kai/coordination/threads/area-plugins-scope-brief.md`, STEWARD AMENDMENT
2026-08-27-1944 (A8).

**This item is the load-bearing half of condition C2, seen from the upstream
side.** The typed edge that enforces C2 lives on
`area-plugins-m2-mode-selection` (`requires: shipped` on this item) — verified in
that item's frontmatter this pass, as a typed dependency and not as prose. **C2 is
not relaxable below the operator**, and neither the steward nor a reviewer may
merge, reverse, or overlap these two.

**The `CLAIM_SKILLS` enumeration is a product boundary, not a convenience list.**
It is the mechanism behind amended success measure #2(a). Adding or removing a
member changes what the product structurally cannot do in standalone mode, so a
membership change is a steward question, not an in-PR judgment. Confirm the 14
before the gate hardens around them (the manager's open question 4).

**The `partial-core` arm's move in from PR-3 is accepted as recorded**, including
its stated reversal path: if the implementing engineer finds it genuinely
entangled with `evaluateMode`, it returns to `area-plugins-m2-mode-selection` and
this item ships without it. That is revisable by engineering without a steward
round-trip.

**Acceptance is unchanged by this promotion**, including the byte-neutrality line
on `packs/` and the requirement that `standaloneBlockErrors()` lands **unused**.
