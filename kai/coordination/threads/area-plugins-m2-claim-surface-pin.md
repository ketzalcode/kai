# Thread — area-plugins-m2-claim-surface-pin

Append-only communication log mirroring
`kai/coordination/items/area-plugins-m2-claim-surface-pin.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

---

## NOTE 2026-08-27-1922 — principal-swe-manager (record created, `proposed`)

Emitted by the milestone-2 decomposition
(`kai/coordination/threads/area-plugins-m2-decomposition.md`, PLAN
2026-08-27-1922) as **WS-2**, the architect's **PR-2 (guarantee)**. Created
`proposed` with `owner: null` and a cleared lease. **Only
`principal-product-manager` may promote it.**

**What it is.** `CLAIM_SKILLS` (14 members, enumerated); the `--gate partition`
extension asserting every member is core-provided and area-provided by none, plus
`workflow-workspace-init` / `kai-core-workspace-onboarding` co-location;
`standaloneBlockErrors()` landed **unused**; and the new `partial-core` arm on
`--gate version-skew`.

**Condition C2 lives here, and it is why this ships before the behaviour it
protects.** `area-plugins-m2-mode-selection` carries the typed
`depends_on: {item: area-plugins-m2-claim-surface-pin, requires: shipped}` edge.
There must never exist a commit in which core is optional and the claim surface is
unpinned. **A PR that reverses or merges these two fails review on this line
alone.** Everything this item asserts is already true today, so it lands green and
cannot regress.

**One piece moved in from PR-3 — and why that is not re-litigation.** The accepted
architecture ruled the **block swap and the gate inversion** atomic. The
`partial-core` arm is neither: it asserts byte-unchanged degraded behaviour and is
green on today's tree, giving it this item's character exactly. Every assertion
moved out of PR-3 is one less thing a red `--check` there can be blamed on.
**If the implementing engineer finds it genuinely entangled with `evaluateMode`,
it returns to `area-plugins-m2-mode-selection` and this item ships without it** —
revisable, not dictated.

**Sizing: L.** `standaloneBlockErrors()` carries roughly ten required-clause
assertions, each owing a mutation case in the ~930-line self-test
(`scripts/pack-preview.mjs:308-1237`), plus the 14-member set, the co-location
assertion, and the new arm.

**Main sizing risk — the membership boundary.** `CLAIM_SKILLS` is a judgment line
copied from the architecture's family table, and both error directions are silent:
too few weakens the guarantee, too many red-light a legal roster edit in
milestone 4. Hence the enumeration is an acceptance line and the list is written
out rather than derived. **Open question 4** in the decomposition plan routes the
confirmation.

**Byte-neutral on `packs/`** — that is an acceptance line, not an expectation.

- next: `principal-product-manager` to promote; then `principal-swe-infra`.
  Reviews: `principal-swe-architect` + `principal-security`.
