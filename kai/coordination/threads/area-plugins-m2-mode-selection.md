# Thread — area-plugins-m2-mode-selection

Append-only communication log mirroring
`kai/coordination/items/area-plugins-m2-mode-selection.md`. Never edited after the
fact — only appended. See `kai-core-work-coordination`.

---

## NOTE 2026-08-27-1922 — principal-swe-manager (record created, `proposed`)

Emitted by the milestone-2 decomposition
(`kai/coordination/threads/area-plugins-m2-decomposition.md`, PLAN
2026-08-27-1922) as **WS-3**, the architect's **PR-3 (behaviour)**. Created
`proposed` with `owner: null` and a cleared lease. **Only
`principal-product-manager` may promote it.**

**This is the milestone's one large diff, and its two dependencies are both
hard.**

1. `area-plugins-m2-claim-surface-pin` `requires: shipped` — **condition C2**, not
   relaxable below the operator. No commit may exist in which core is optional and
   the claim surface is unpinned.
2. `area-plugins-m2-standalone-copy` `requires: completed` — the block's sentences
   are published product copy under non-negotiable #5 and must not ship as a
   generator default (amendment A4 #1).

**Disposition: Slice — decomposed as far as it honestly goes.** Two pieces moved
*earlier* into `area-plugins-m2-claim-surface-pin` (`standaloneBlockErrors()` and
the `partial-core` arm); one is *deferred* to `area-plugins-m2-standalone-proof`
(`--gate partial-install` arm B). What remains is the block swap plus the gate
inversion, and **either half alone is a red build** — an architectural ruling this
decomposition did not reopen. It stays **XL** and is recorded as XL rather than
padded down.

**The sharpest unknown, recorded so review does not skim it.**
`contractPinErrors()` today pins the literal *"Do not load or apply any inherited
skill until this preflight passes."* (`scripts/lib/pack-plan.mjs:1592`). That
sentence retires here, because the block no longer overrides load order — it
selects which set loads. **The replacement literal is not fixed by the accepted
architecture.** It is an in-PR design call, and a weak choice silently loosens the
one check that catches the failure a fully green build can otherwise ship: every
generated agent refusing a healthy core, or accepting a skewed one. Treat it as a
reviewed decision, not a rename. Routed as **open question 3** in the plan.

**Figure correction carried from grounding.** This regenerates **49** non-core
agent bodies, not 51 (engineering 20 + gtm 11 + product 9 + personal 9, counted
from the committed tree; 51 is the *skill* count). No ruling changes — the
acceptance line says 49.

**Why three reviews.** `principal-swe-architect` (generator, block chain, two
gates); `principal-security` (this is the commit where core becomes optional, and
the claim surface is the subject); `principal-qa-ui` / `ui-system`, narrowly
scoped and genuinely load-bearing — CI can assert the block's *text*, but only an
exploratory pass over a built core-less preview tree can falsify whether an agent
says the mode line **once**, does **not** nag on a request touching none of the
disclaimed capabilities, and refuses a claim when asked for one. That is measure
#1's "100% of standalone entries present the two honest paths", and no gate in
this repo can make it. It does not require a published release — a `pack-preview`
build is enough.

**Condition C3 travels with this item:** a substantiated false durability claim
from a standalone agent is a P0 that reopens BRIEF boundary #1 with evidence.

- next: `principal-product-manager` to promote; then `principal-swe-infra`, but
  **not before both dependencies are satisfied**.
