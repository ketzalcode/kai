---
type: work-item
id: area-plugins-m2-mode-selection
title: Mode selection replaces the fail-closed preflight — mode-block + standalone-block in, preflight-block retired, skew and degraded refusals preserved
initiative: area-plugins
milestone: optional-core-contract
delivery_class: product-change
state: ready
resume_state: null
priority: 50
owner: null
next_role: principal-swe-infra
target: mode selection (three-way probe disposition)
artifact_target: null
context_artifacts:
  - kai/coordination/threads/area-plugins-m2-decomposition.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - kai/coordination/threads/area-plugins-m2-standalone-copy.md
  - scripts/lib/preflight-block.txt
  - scripts/lib/degraded-block.txt
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
touches:
  - scripts/lib/mode-block.txt
  - scripts/lib/standalone-block.txt
  - scripts/lib/preflight-block.txt
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
  - packs/kai-engineering/agents/
  - packs/kai-product/agents/
  - packs/kai-gtm/agents/
  - packs/kai-personal/agents/
  - package.json
  - package-lock.json
  - CHANGELOG.md
depends_on:
  - item: area-plugins-m2-claim-surface-pin
    requires: shipped
  - item: area-plugins-m2-standalone-copy
    requires: completed
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
  - role: principal-security
    kind: independent-security
  - role: principal-qa-ui
    kind: ui-system
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

Every one of the 49 generated non-core agents loads and works with no `kai-core`
installed, offering the two honest paths — while a **version-skewed** core and a
**degraded** session still fail closed with `KAI-CORE-MISSING`, byte for byte.

## Acceptance

- [ ] `scripts/lib/mode-block.txt` exists: same probe, same skill, same version
      pin, **three** dispositions — `KAI_CORE_READY` + `contract: 1` -> **full**;
      skill unavailable / no marker / no `contract:` line -> **standalone**;
      marker present with `contract: N != 1` -> **refuse**, reply exactly
      `KAI-CORE-MISSING` and stop.
- [ ] `scripts/lib/standalone-block.txt` exists and carries **verbatim** the copy
      completed in `area-plugins-m2-standalone-copy`. No generator default, no
      paraphrase.
- [ ] `scripts/lib/preflight-block.txt` is **deleted in this same PR** — the old
      file never coexists with the new ones.
- [ ] `MODE_BLOCK_REL` and `STANDALONE_BLOCK_REL` are added;
      `guaranteeBlocks()` returns three blocks.
- [ ] `guaranteeBlockErrors()` enforces the three-block contract: order
      **mode -> standalone -> degraded**, exactly one copy of each, contiguous,
      immediately after the inherits directive, and **core agents carry none of
      the three** — decided by pack *kind*, not by agent name, so the rule
      survives the milestone-4 taxonomy split untouched.
- [ ] `contractPinErrors()` is retargeted at `MODE_BLOCK_REL` and its pinned
      literal is replaced by a **mode-selection literal of equivalent strength**;
      the constant / block-prose / probe-body three-way pin still holds and still
      demands exactly one `contract:` version.
- [ ] `evaluatePreflight` becomes `evaluateMode`, returning
      `{ mode: 'full' | 'standalone' | 'refused', reply }`.
- [ ] `--gate version-skew` arms: `ready` -> `mode === 'full'` (**unchanged**);
      `skew` (`--contract 2`) -> `reply === REFUSAL` (**unchanged, byte for
      byte**); `no-core` -> **inverted**, asserts
      `mode === 'standalone' && reply !== REFUSAL`.
- [ ] `standaloneBlockErrors()` (landed unused by
      `area-plugins-m2-claim-surface-pin`) is **wired** and green over the real
      block.
- [ ] **Condition C1 is mechanically asserted:** the block carries the
      one-sentence mode line, the explicit `once` instruction, and the explicit
      do-not-repeat prohibition. The mode line is not negotiable downward.
- [ ] All 49 non-core agent bodies are regenerated **in this same PR**;
      `pack-preview --check` is green. (Counted from the committed tree:
      engineering 20 + gtm 11 + product 9 + personal 9.)
- [ ] `scripts/lib/degraded-block.txt` is **unchanged byte for byte**; only its
      entry condition is renamed.
- [ ] Every new or changed rule owes a **mutation case** in the `pack-preview`
      self-test.
- [ ] All five gates plus `--check` green; `npm test` green; `release-guard`
      passes with a forward version bump.
- [ ] Unchanged and verified so: `**Inherits:**` lines, `planPacks()`, `PACKS`,
      `CONTRACT_SKILL` / `CONTRACT_VERSION`, the `KAI-CORE-MISSING` token itself,
      `hooks.json` and `HOOKS_OWNER`, `providerCollisionErrors`,
      `namespaceErrors`, `PACKS_DIR`, the marketplace name, and all five plugin
      identities. **Zero identities created, renamed, or retired.**

## Evidence

- <Filled as work progresses: diff, gate output, `--check` output, self-test
  output, the QA standalone-session probe, reviews.>

## Notes

**Release/version: planned `1.0.8`, inside `1.0.x`. Size: XL.**

**Condition C2 is the first dependency and it is not relaxable below the
operator.** `area-plugins-m2-claim-surface-pin` must be `shipped` before this
merges. There must never exist a commit in which core is optional and the claim
surface is unpinned. **A PR that reverses or merges these two fails review on
this line alone.**

**Why it stays XL — decomposed as far as it honestly goes.** Two pieces were
already moved *earlier* into `area-plugins-m2-claim-surface-pin`
(`standaloneBlockErrors()` and the `partial-core` arm) and one was **deferred** to
`area-plugins-m2-standalone-proof` (`--gate partial-install` arm B). What remains
is the block swap plus the gate inversion, and **either half alone is a red
build** — an architectural ruling this decomposition did not reopen. This is the
one large diff in the milestone; every assertion moved out of it is one less thing
a red `--check` here can be blamed on.

**The sharpest unknown, named so review does not skim it.** `contractPinErrors()`
today pins the literal *"Do not load or apply any inherited skill until this
preflight passes."* (`scripts/lib/pack-plan.mjs:1592`). That sentence is
retired here because the block no longer overrides load order — it selects which
set loads. **The replacement literal is not fixed by the accepted architecture**;
it is an in-PR design call, and a weak choice silently loosens the one check that
catches the failure a fully green build can otherwise ship: every generated agent
refusing a healthy core, or accepting a skewed one. Treat the replacement as a
reviewed decision, not a rename.

**Why the skew refusal survives and the absence refusal does not.** A skewed core
is **present**: its Claim-family skills are on disk and will load. The structural
argument that makes standalone safe does not hold there, so the total refusal
stays. Absence and skew are not the same case and do not get the same disposition.

**Reviews, and why three.** `principal-swe-architect` — the generator, the block
chain, and two gates. `principal-security` — this is the commit where core becomes
optional; the claim surface is the subject. `principal-qa-ui` / `ui-system` —
narrowly scoped and genuinely load-bearing: CI can assert the block's *text*, but
only an exploratory pass over a built core-less preview tree can falsify whether an
agent actually says the mode line **once**, does **not** nag on a request that
touches none of the disclaimed capabilities, and refuses a claim when asked for
one. That is measure #1's "100% of standalone entries present the two honest
paths", and it is the one claim no gate in this repo can make. Scope it to a built
`pack-preview` tree; it does not require a published release.

**Reversibility is cheap and is the point.** Revert two block files plus the
constants and regenerate: the fail-closed refusal returns exactly as it is today,
on the same five identities. No identity is minted, renamed or retired; no public
skill ID changes; no data model moves.

**Consequence if wrong** (recorded, not hidden): an area agent runs core-less and
asserts a durable outcome it did not produce. Detection is a user reading a claim
and finding no record. Blast radius is one session's text — there is no persistent
corruption, because standalone writes nothing whose location it chose. **Condition
C3:** a substantiated instance is a P0 that reopens BRIEF boundary #1 with
evidence.

### Steward promotion 2026-08-27-1944 (`principal-product-manager`)

`proposed -> ready`, priority **50**, version 1 -> 2, `owner: null`, lease
untouched and null. Recorded in
`kai/coordination/threads/area-plugins-scope-brief.md`, STEWARD AMENDMENT
2026-08-27-1944 (A8).

**C2 verified as typed, which was my binding acceptance condition on the
decomposition.** `depends_on: {item: area-plugins-m2-claim-surface-pin, requires:
shipped}` is in this item's frontmatter — a machine-checkable edge the director's
*executable* predicate enforces at dispatch, not a sentence in a plan that a
hurried PR could read past. It is **not relaxable below the operator**, and the
prose reinforcement in the Notes is a restatement of the edge, never a substitute
for it.

**C1 verified as carried in both directions.** The copy item
(`area-plugins-m2-standalone-copy`) owes the one-sentence mode line with the
`once` instruction and the do-not-repeat prohibition; this item owes the
mechanical assertion that all three are present in the shipped block. Neither is
sufficient alone — that pairing is the point, and it is why the copy is a typed
`requires: completed` input rather than a prose note.

**The replacement pinned literal (the manager's open question 3) is an in-PR
architecture decision and stays there.** It is not product copy: it governs the
constant / block-prose / probe-body three-way pin, and the standard it must meet
is *equivalent strength*, which the acceptance already states. It does **not**
route to the steward. What routes to me is only this: if the replacement cannot
hold the pin at equivalent strength, that is a change to the guarantee, and it
comes back before it ships.

**The `principal-qa-ui` review is not ceremony and is not to be dropped for
schedule.** CI can assert the block's text; only an exploratory pass over a built
core-less preview tree can falsify whether an agent says the mode line **once**,
does not nag, and refuses a claim when asked for one. That is the *"100% of
standalone entries present the two honest paths"* half of measure #1, and it is
the one claim no gate in this repo can make.

**XL is accepted.** The decomposition already moved two pieces earlier and
deferred one later; what remains is atomic by the accepted architecture's ruling.
Acceptance is unchanged by this promotion, including the 49-body regeneration
line, which carries the corrected figure (A6).
