# pack-split — backlog

Initiative-scoped deferred proposals. An expansion discovered inside pack-split
lands here (not in `kai/coordination/backlog.md`, which is for unaffiliated
proposals). The steward grooms this list. See `kai-core-initiative-stewardship`.

Nothing parked yet.

## Candidates noted at intake (not yet accepted)

These came out of the proposal's open questions and plan; they are recorded so
they are not lost. None is scheduled — the steward decides if and when any
becomes an item.

- Certify collision and roster-enumeration behaviour on macOS and the cloud host
  (all evidence to date is Windows CLI).
- Add a dispatch-probe that fails observably, stronger than the model reading its
  own roster (noted open in the proposal).
- Split versioning into per-pack semver plus a separate core contract version,
  once lockstep is no longer needed.
- Decide the permanent home of the 9 currently-unplaceable core skills beyond the
  `partition-lock` disposition (`demo-*`, `fleet-observation`,
  `onboard-to-codebase`, three `review-*`).
- Phase 0 metadata trimming as an independent, ship-on-`0.x` win (budget agent
  descriptions to ~250 chars, skills to ~180), re-measured so prose savings are
  not credited to the split.

## Grooming — 2026-08-24 (steward)

Reviewed all five candidates above against `scope.current` (`partition-lock`).
None fits the current milestone, so **all stay parked** — none is promoted:

- macOS / cloud-host certification and the observable dispatch-probe are already
  captured downstream as `pack-split-host-gates` under `first-pack-extracted`;
  revisit if the host-gate item needs them split out.
- Per-pack semver, the permanent orphan-skill home beyond the `partition-lock`
  disposition, and Phase 0 metadata trimming remain out of `partition-lock`
  scope. Phase 0 may be promoted independently on `0.x` if the steward chooses
  to bank the token win early; not scheduled now.

The one-way valve stays closed until a candidate fits `scope.current`.

## Parked proposals

### PROPOSAL — zero-skill pack generates a manifest pointing at a missing `skills/`

Parked by `principal-product-manager` (steward) 2026-08-24-2240, from architect finding **A6** in
the `pack-split-generator-gates` `independent-architecture` review (ratified 2026-08-24-2231 at
`change_ref 457254b973fb58b129332ffaa609fb5febfdd412`). Non-blocking; **not** fixed in that PR.

```
PROPOSAL
  problem:          `planManifests` in scripts/lib/pack-plan.mjs always sets
                    `manifest.skills = 'skills'`, but `materializePacks` only creates a
                    `skills/` directory when the pack owns >= 1 skill. A pack owning zero
                    skills would therefore generate a tree that fails validate's
                    `"skills" path ... does not exist` check.
  proposed_change:  Make the manifest's `skills` key conditional on the pack actually owning
                    at least one skill (or always emit the directory, even when empty).
  friction_cost:    A defensive branch plus a self-test arm for a state no pack can reach,
                    in the single machine-readable partition source that three downstream
                    guarantee items depend on. Adds surface to the most load-bearing file
                    in the initiative to guard a case the locked partition forbids.
  mission_tradeoff: Unreachable under the current thin core. All five locked departments own
                    >= 1 skill (23/15/3/2/7 = 50, ratified in the partition lock), and the
                    northstar's out_of_scope explicitly forbids "adding packs beyond the
                    agreed five once the partition is locked". Fixing it now spends
                    complexity on a scenario the non-negotiables rule out; it fails loudly
                    at generate time rather than shipping a silent defect, so deferring is
                    safe.
  scope_target:     Whichever milestone first proposes a sixth pack or a department that
                    owns zero skills; otherwise it never becomes work.
```

**What would change my mind (trigger to promote):** a sixth pack is proposed, the partition is
re-opened, or any re-partition leaves a department owning zero skills. Any of those makes this
reachable and it becomes a one-line fix in `pack-split-generated-pack-trees` or the then-current
generator item. Until then it stays parked — recorded so it is owned rather than remembered.
