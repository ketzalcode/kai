# Thread — area-plugins-m2-docs-two-modes

Append-only communication log mirroring
`kai/coordination/items/area-plugins-m2-docs-two-modes.md`. Never edited after the
fact — only appended. See `kai-core-work-coordination`.

---

## NOTE 2026-08-27-1922 — principal-swe-manager (record created, `proposed`)

Emitted by the milestone-2 decomposition
(`kai/coordination/threads/area-plugins-m2-decomposition.md`, PLAN
2026-08-27-1922) as **WS-6**, the second child of the architect's **PR-5**.
Created `proposed` with `owner: null` and a cleared lease. **Only
`principal-product-manager` may promote it.**

**What it is.** `docs/getting-started.md` and `docs/reference/plugin-structure.md`
describe the two modes, the fresh-session-only upgrade with no import path, the
three-block chain, and **each changed gate's new assertion** — which is a
milestone-2 acceptance line in its own right, and the reason this item is
`required_for_milestone: true` despite carrying no release.

**No version bump.** `docs/` is exempt from `release-guard`'s `BEHAVIOR_PREFIXES`
(`scripts/release-guard.mjs:20`). `delivery_class: knowledge`; terminal state
`completed`. **Merging it is not shipping** — nothing here is deployed and
verified by a human, and it must never be described as shipped.

**Disposition: Sequence, and both edges are hard.** Documenting the two modes
before `area-plugins-m2-mode-selection` merges would describe behaviour that does
not exist — a false claim in published product surface. The
`area-plugins-m2-standalone-proof` edge exists because one acceptance line here is
"each changed gate's new assertion", and arm B is one of those assertions.

**One thing the docs must not do.** They make **no claim about the doctor's
verdict** unless `area-plugins-m2-doctor-standalone` has shipped. Until then the
shipped doctor still reports a core-less install as `blocked`, and documenting
otherwise would be the same defect this milestone is fixing, moved to a new file.

**Review.** `principal-swe-infra` / `doc-review` — the role that implemented the
behaviour verifies the docs describe what actually merged, which is the drift this
review exists to catch. Independent (writer authors, infra checks) and
proportional; a second architecture pass over prose would be ceremony.

- next: `principal-product-manager` to promote; then
  `principal-technical-writer`, once both dependencies are `shipped`.
