# Initiative index

Permanent all-status catalog — every initiative ever started stays
discoverable here, including terminal ones removed from
`kai/coordination/ACTIVE.md`. Rows are added on initiative creation and
missing rows are re-added from `kai/initiatives/*/northstar.md` on a later
onboarding pass, without replacing hand-edited rows.

| slug | status | workspace | summary | deliverables | updated |
|------|--------|-----------|---------|--------------|---------|
| pack-split | shipped | `.` (repository) | `kai/initiatives/pack-split/director-summary.md` | `kai/initiatives/pack-split/deliverables.md` | 2026-08-27 |
| area-plugins | active | `.` (repository) | v1.0.4 five-pack topology -> **nine** area-focused standalone plugins over an optional `kai-core`. Re-scoped by the operator's 2026-08-27-2113 second revision and **split** (four workspace/corpus concerns moved to `workspace-corpus-contract`), then **reopened from seven to nine** by the main agent's 2026-08-27-2153 override accepting `kai-directors` and `kai-project-management`. **North star now exists** at `kai/initiatives/area-plugins/northstar.md`; the append-only decision history remains `kai/coordination/threads/area-plugins-scope-brief.md` (BRIEF + A1–A26) | `kai/initiatives/area-plugins/deliverables.md` | 2026-08-27 |
| workspace-corpus-contract | active | `.` (repository) | Make the kai workspace corpus bounded, opt-out-able, and honest: one destination per record kind, a real close-and-archive path, and a storage choice the operator makes rather than inherits. **Steward-proposed 2026-08-27-2113 (scope-brief A10); operator approved the initiative and the recommended audience-based workspace model 2026-08-28.** North star now exists at `kai/initiatives/workspace-corpus-contract/northstar.md`; the ratified target architecture (agent-facing `.kai/` vs. operator-facing `kai/`, reconciling all four founding contracts) is `kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md`. The four founding contracts remain authoritative, unmodified, in `kai/coordination/threads/area-plugins-{initiative-archive,backlog-contract,design-output-contract,workspace-storage-modes}.md` | `kai/initiatives/workspace-corpus-contract/deliverables.md` | 2026-08-28 |
| asset-lifecycle-contract | active | `.` (repository) | Separate work execution from generated-asset disposition, validity, supersession, freshness, and initiative closure. Operator approved implementation on 2026-08-28; the first milestone binds one universal contract to all 56 agents before doctor/catalog enforcement and legacy reconciliation. | `kai/initiatives/asset-lifecycle-contract/deliverables.md` | 2026-08-28 |

**Note on ID prefixes.** The four `workspace-corpus-contract` items carry an
`area-plugins-` ID prefix because the operator assigned those IDs while the
concerns were still inside `area-plugins`. An item ID is a stable identifier;
**membership is the `initiative:` field, not the prefix.** Each record states
this in an `id_provenance` line.

**Note on the unaffiliated item.** `area-plugins-fleet-observer-ux` is
`proposed` with `initiative: null` — a product-surface redesign belonging to
neither initiative, deferred with a trigger per scope-brief A15. It has no
INDEX row because it is an item, not an initiative.
