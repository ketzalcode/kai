# Thread — pack-split-migration-doctor

Append-only communication log mirroring
`kai/coordination/items/pack-split-migration-doctor.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Extend `scripts/workspace-doctor.mjs` for verifiable uninstall-first of legacy `kai`, coexistence refusal, existing-`.kai` workspace-provenance migration, and the fresh-session notice. Size L. Owner `principal-swe-infra`; reviews `principal-security`/independent-security (legacy contract collision, trust boundary) + `principal-sre`/independent-reliability (provenance migration safety). Depends on `pack-split-generator-gates` (shipped); parallel with `pack-split-generated-pack-trees`.
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-migration-doctor.md; decomposition WS#8
- evidence:  scripts/workspace-doctor.mjs already carries schema_version + migrations[] ladder — captured 2026-08-24 from C:\src\kai
- questions: none (cross-host legacy detection informed by the host-semantics spike)
- next:      principal-product-manager — groom milestone-by-milestone.

## NOTE 2026-08-25-1125 — workflow-ship: dependency satisfied, but still blocked on scope

- `pack-split-generator-gates` reached **`shipped`** at 2026-08-25-1125 (PR #152 merged
  2026-08-25T18:20:55Z, merge commit `47aa0549f89b1733483dd6b662a4787d621c9430`, released
  `v0.58.0`). This item's **sole** `depends_on` entry is therefore **satisfied**.
- **Still NOT executable — and the reason is scope, not dependencies.** This item sits in
  milestone `first-pack-extracted`, which is **outside**
  `northstar.scope.current: [dependency-guarantees]`. Dependency satisfaction does not
  override the scope gate. It also remains `proposed`.
- `workflow-ship` reconciles dependencies only; it did not promote, dispatch, or
  re-prioritize, and changed no field on this record.
- For the steward: pulling this item forward would require a `scope.current` change, which
  is a `principal-product-manager` decision on the northstar, not a ship-gate one.
