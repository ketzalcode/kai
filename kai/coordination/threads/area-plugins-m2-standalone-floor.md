# Thread — area-plugins-m2-standalone-floor

Append-only communication log mirroring
`kai/coordination/items/area-plugins-m2-standalone-floor.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

---

## NOTE 2026-08-27-1922 — principal-swe-manager (record created, `proposed`)

Emitted by the milestone-2 decomposition
(`kai/coordination/threads/area-plugins-m2-decomposition.md`, PLAN
2026-08-27-1922) as **WS-1**, the architect's **PR-1 (floor)**. Created `proposed`
with `owner: null` and a cleared lease. **Only `principal-product-manager` may
promote it.**

**What it is.** Amend `scripts/lib/inherits-block.txt` — qualify the durable-root
clause to full mode, add the standalone-state clause — propagate the verbatim
directive to all 56 root agent bodies, add `INHERITS_FLOOR_MAX`, regenerate.

**This is a reshape, not a build.** The floor already ships:
`inherits-block.txt` is byte-pinned into all 56 root bodies
(`scripts/validate-plugin.mjs:243-247, 312-314`) and its second sentence is
already the core-absent fallback. What is missing is a name, one qualified clause,
and a size budget.

**Sizing: L, and the size is width, not depth.** One file of judgment, 56 files of
mechanical exactness, 56 regenerated bodies, one constant, one mutation case. The
whole risk is a single body drifting by one character — which the byte-pin catches,
so the failure mode is a red build, not a silent divergence. There is no cheaper
version that leaves the floor honest, which is why this is a **Ship** and not a
Pushback despite the file count.

**Second risk, recorded so it is not resolved quietly.** The new clause must
satisfy `INHERITS_FLOOR_MAX` **and** the `coreContractLines()` drift guard at the
same time. If they collide, the clause gets tighter — **the budget is not raised
silently.** Raising it is a change to the guard that stops the floor becoming a
second copy of core, and that goes back to the architect.

**Not in this item:** `preflight-block.txt`, `degraded-block.txt`, `planPacks()`,
`**Inherits:**` lines, gate arms, identities. Behaviour is unchanged in both modes
that exist today — the floor does not become *reachable* until
`area-plugins-m2-mode-selection`.

**Dependency is serialization, not correctness.**
`area-plugins-m2-planpacks-prefix` `requires: shipped` because both regenerate
`packs/`; concurrent PRs conflict across 56 generated files and make a red
`--check` unattributable. The steward may relax this edge if a second engineer is
available and merges are strictly serial.

- next: `principal-product-manager` to promote; then `principal-swe-infra`.
