# Active initiatives

Operational focus pointer, not the permanent record. Each row names an
initiative `slug` currently receiving attention and, briefly, why. This file
lists only the current focus — `kai/initiatives/INDEX.md` is the permanent
all-status catalog, and removing a terminal initiative from this file must
never make it undiscoverable there.

| slug | why active |
|------|------------|
| pack-split | `partition-lock` **completed**; `pack-split-engineering-decomposition` **completed**. Focus is `dependency-guarantees`. The foundational item **`pack-split-generator-gates`** is **`release-ready`** — the `workflow-ship` DoD gate **re-ran 2026-08-24-2252 and passed all six dimensions**, closing the single dim-2 Gap from the 2026-08-24-2244 bounce on real evidence: GitHub Actions run `32814515790` job `contract` on `ubuntu-latest`, `conclusion: success`, **11/11 steps green**, including the PR-only real `release-guard --base/--head` gate that had never executed. Delivered as **PR #152** (head `4ed8f88…`, byte-identical to the ratified binding `457254b97…` for all implementation and release files). **`next_role: @operator` — the human presses merge; nothing is merged, tagged, released, published, or `shipped`.** Ship record at `kai/initiatives/pack-split/artifacts/docs/pack-split-generator-gates-ship-record.md` (library promotion pending an operator `mkdir`). Architect findings routed: A1–A3 → `generated-pack-trees`, A4 → `release-12b`, A5 → `ci-partition-checks`, A6 parked in the backlog. The other 12 records stay `proposed`; `pack-split-host-semantics-spike` recommended for parallel operator dispatch. The four dependents require this item at `shipped`, so they stay non-executable until the merge and production verification. Non-blocking: **3** open questions remain (review-lens binding, first-department `shipped` semantics, director-availability completeness) — the `packs/` committed-tree root is **confirmed**. |

The pack-split initiative is the current focus.
