# Thread — pack-split-generated-pack-trees

Append-only communication log mirroring
`kai/coordination/items/pack-split-generated-pack-trees.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. **Slice:** generate committed-unpublished `kai-core` + `kai-personal` trees from root (generate-not-move), realizing architect caveat (c) asset-ownership (demo-*.mjs -> personal; hooks + observe-*.mjs -> core only, hooks exactly once). Deferred: engineering/product/gtm trees generated one-at-a-time in `pack-split-release-12c`. Size L. Owner `principal-swe-infra`; review `principal-swe-architect`/independent-architecture. Depends on all four dependency-guarantee items + `pack-split-generator-gates` (shipped) + `pack-split-host-semantics-spike` (completed).
- state:     proposed
- needs:     Steward grooming + promotion; confirm committed-tree location `packs/` (Open Question 2).
- artifacts: kai/coordination/items/pack-split-generated-pack-trees.md; decomposition WS#7
- evidence:  scripts/pack-preview.mjs buildAll() + PACKS.personal; hooks.json -> observe-subagent.mjs; scripts/demo-*.mjs invoked by creative-video-director + video-direction — captured 2026-08-24 from C:\src\kai
- questions: architect caveat (b) review-lens binding is NOT on this (personal) critical path — resolve before the engineering tree is generated (12c)
- next:      principal-product-manager — groom milestone-by-milestone; personal-first honors "one department at a time".

## NOTE 2026-08-24-2240 — principal-product-manager (steward) — carry-forward from `pack-split-generator-gates` acceptance

- Item version 1 -> 2. State stays `proposed`; `next_role` unchanged
  (`principal-product-manager`) — this is grooming of a not-yet-promoted record, not a promotion.
  No lease was needed or taken (lease was and remains null).
- **Committed-tree root `packs/` CONFIRMED** (decomposition Open Question 2 **closed**). The
  `needs` line above — "confirm committed-tree location `packs/`" — is now satisfied: existing
  evidence was sufficient (the accepted decomposition, this item's own `touches`, and the ratified
  implementation's `PACKS_DIR`/`BEHAVIOR_PREFIXES`). `dist/` rejected as signalling uncommitted
  build output. Recorded in Notes; do not re-litigate.
- **Architect findings A1–A3 added as acceptance criteria**, from the `independent-architecture`
  review ratified 2026-08-24-2231 at `change_ref 457254b973fb58b129332ffaa609fb5febfdd412`. All
  three were non-blocking there and are unreachable until a committed tree exists — which is this
  item — so this is their smallest correct home:
  **A1** guard `checkCommitted`'s walk on `existsSync(base)` so the first state this item enters
  (slice selected, `packs/` still absent) prints the `--write` guidance instead of an ENOENT stack
  trace; the gate already fails closed, so this is guidance not correctness.
  **A2** stop treating every file under `packs/` as generator output — a stray `.DS_Store` /
  `Thumbs.db` would fail a contributor's local `--check`/`npm test` while CI stays green.
  **A3** pin `packs/** text eol=lf` in `.gitattributes` when the first tree lands, matching the
  existing `scripts/**` and `test/fixtures/**` pins. `.gitattributes` added to `touches`.
- **A4 cross-reference (owned by `pack-split-release-12b`, not here).** Marketplace publication is
  currently outside release enforcement. Committing the first tree here is precisely what turns the
  unpublished→published flip into a pure `marketplace.json` edit that release-guard exempts. The
  trees land **unpublished** by contract so nothing is published by this item, but if publication
  becomes possible before `12b` runs, raise it to the steward rather than absorbing the guard here.
- Dependencies are unchanged and still unmet: this item requires `pack-split-generator-gates` at
  `shipped`, which it is **not** — that item is `in-review`, accepted and routed to `workflow-ship`,
  with nothing committed, pushed, merged, or released. This item is not executable.

## NOTE 2026-08-25-1125 — workflow-ship: 1 of 6 dependencies satisfied; still blocked

- **Correcting the last line above, which is now out of date.**
  `pack-split-generator-gates` reached **`shipped`** at 2026-08-25-1125 — PR #152 merged
  2026-08-25T18:20:55Z, merge commit `47aa0549f89b1733483dd6b662a4787d621c9430`, released
  `v0.58.0`, production verification passed. That dependency is **satisfied**.
- **This item remains NOT executable.** It has **six** dependencies and five are still
  open: `pack-split-crosspack-validator`, `pack-split-preflight-compat`,
  `pack-split-degraded-refusal`, `pack-split-ci-partition-checks` (all required at
  `shipped`) and `pack-split-host-semantics-spike` (required at `completed`). All five are
  `proposed`. It is additionally in `first-pack-extracted`, outside
  `northstar.scope.current`.
- `workflow-ship` reconciles dependencies only; it did not promote, dispatch, or
  re-prioritize, and changed no field on this record.
- **Now unblocked for the A1–A3 work when this item eventually runs:** the `packs/` root is
  live in production — `BEHAVIOR_PREFIXES` on `main` at `v0.58.0` includes `packs/`, so a
  committed tree here will require a bump + CHANGELOG + README. Confirmed at production
  verification: **no `packs/` tree exists on `main`**, so this item still owns creating the
  first one, and A1 (`checkCommitted` ENOENT before the `--write` hint) is still reachable
  exactly as described.
