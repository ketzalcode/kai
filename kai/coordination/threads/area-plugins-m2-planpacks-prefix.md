# Thread — area-plugins-m2-planpacks-prefix

Append-only communication log mirroring
`kai/coordination/items/area-plugins-m2-planpacks-prefix.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

---

## NOTE 2026-08-27-1922 — principal-swe-manager (record created, `proposed`)

Emitted by the milestone-2 decomposition
(`kai/coordination/threads/area-plugins-m2-decomposition.md`, PLAN
2026-08-27-1922) as **WS-0**. Created `proposed` with `owner: null` and a cleared
lease. **Only `principal-product-manager` may promote it.**

**What it is.** The D3 fix from `area-plugins-taxonomy-decision`, moved into
milestone 2 by steward amendment A3: one condition in `planPacks()` so the
`kai-core-` prefix decides the provider before the consumer-topology heuristic.

**Why it is the first implementation item.** No unmet dependency; smallest diff
in the milestone; byte-neutral by design; and it re-bases provider assignment on
the **name** before `area-plugins-m2-claim-surface-pin` pins the claim surface by
provider. A3/S2 requires it be sequenced *with* but never *inside* PR-2, and never
inside PR-3 — its own commit at the head of the sequence satisfies both.

**The finding this record carries, and the reason its acceptance has two separate
proof lines.** The fix is described everywhere as "one condition". *Where* the
condition goes is load-bearing. Placed before the orphan branch
(`scripts/lib/pack-plan.mjs:405-410`), `kai-core-contract-v1` and
`kai-core-fleet-observation` stop being orphans and `partitionErrors()`
(`:1498-1506`) fires on both of their `SKILL_OWNER_OVERRIDES` entries — *"an agent
already inherits it, so the override is a second truth about one skill"*. The tree
would still be byte-identical while `--gate partition` went red. **Byte-neutral is
not gate-neutral.**

**Named sizing risk.** Byte-neutrality is analytic, never executed — no agent in
the decomposition session had a shell. This is the cheapest unmeasured claim in
the milestone, which is why it goes first.

**Downstream consequence:** milestone 4 (`area-taxonomy-split`) gains a dependency
edge on this item at `requires: shipped`, per A3/S1.

- next: `principal-product-manager` to promote; then
  `director-chief-of-staff` dispatches `principal-swe-infra`.
