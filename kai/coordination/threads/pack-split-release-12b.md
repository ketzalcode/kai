# Thread — pack-split-release-12b

Append-only communication log mirroring
`kai/coordination/items/pack-split-release-12b.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record — the minimal `1.0.0` flip: publish `kai-core` + `kai-personal`, retire the published monolith, cut `1.0.0`, only after host gates pass. Minimal = core + one department, not five at once. Size L; highest blast radius. Owner `principal-swe-infra` prepares/gates; **operator** publishes/tags/retires. Reviews `principal-sre`/independent-reliability + `principal-security`/independent-security. Hard-gated on `pack-split-host-gates` (completed); depends on `pack-split-release-12a` + `pack-split-onboarding-installer` (shipped).
- state:     proposed
- needs:     Steward grooming + promotion at the five-pack milestone; do not promote for dispatch until the host-gate evidence is green.
- artifacts: kai/coordination/items/pack-split-release-12b.md; decomposition WS#13
- evidence:  .github/plugin/marketplace.json (single monolith entry today); validate-plugin.mjs marketplace checks — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone; the flip is operator-executed and gated.
