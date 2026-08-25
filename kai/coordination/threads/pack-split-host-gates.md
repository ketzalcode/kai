# Thread — pack-split-host-gates

Append-only communication log mirroring
`kai/coordination/items/pack-split-host-gates.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. Formal host-gate **evidence** (macOS + cloud + install-order + marketplace-vs-direct + fresh-session) on the real core+personal install; closes `completed`. Size L (cost is operator host-time). Owner `principal-swe-infra` designs; **operator** executes; review `principal-sre`/independent-reliability. Depends on `pack-split-first-department` + `pack-split-migration-doctor` (shipped). The hard gate before the `1.0.0` flip.
- state:     proposed
- needs:     Steward decision — confirm **minimal smoke gate**, not full macOS/cloud certification (which the northstar defers). See decomposition Scope negotiations.
- artifacts: kai/coordination/items/pack-split-host-gates.md; decomposition WS#10
- evidence:  northstar `deferred`: "Full macOS and cloud-host certification ... all evidence to date is Windows CLI" — captured 2026-08-24 from C:\src\kai
- questions: host-gate depth (minimal smoke vs full cert) — steward call
- next:      principal-product-manager — decide gate depth; the manager cannot execute external host gates.
