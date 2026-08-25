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

### PROPOSAL — the generated-agent preflight pin is gated on a pack-name pattern a future pack could fall outside

Parked by `workflow-ship` at the 2026-08-25-1310 DoD gate for
`pack-split-preflight-compat`, from **security finding P2-S1** in the
`independent-security` review (CLEAR 2026-08-25-1257 at `change_ref
3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`). Non-blocking — it did **not** gate the
release, and it is **not** fixed in PR #154. Recorded here because the security review
deliberately created no item ("filing is the steward's call") and a finding that ships
unowned is a finding that gets lost.

```
PROPOSAL
  problem:          scripts/validate-plugin.mjs:404 selects generated bodies with
                    /^kai-[a-z]+\/agents\/.+\.agent\.md$/. All five current pack keys are
                    [a-z]+, so coverage today is complete — but a future key with a hyphen
                    or a digit (e.g. kai-customer-success) would not match, and that pack's
                    agents would silently skip the copy-count, position and adjacency
                    assertions that make the preflight guarantee real.
  proposed_change:  Widen to `kai-[a-z-]+`, or better, derive the expected key set from
                    PACK_ORDER / planManifests in scripts/lib/pack-plan.mjs so the pin
                    cannot drift from the partition it is pinning.
  friction_cost:    Small — one pattern or one derivation in a file the owning item already
                    touches. The cost of doing it *here* would have been re-opening a
                    twice-reviewed, twice-bounced trust-boundary file at the ship gate for
                    a case no shipped pack can reach.
  mission_tradeoff: This is a pin-COVERAGE gap, not a live fail-open: materializePacks still
                    injects on kind !== 'core', so a hyphenated pack's agents would still
                    carry the block — what is lost is verification, which only bites
                    alongside a second defect. The northstar's out_of_scope forbids adding
                    packs beyond the agreed five while the partition is locked, so the
                    trigger cannot fire without a partition change.
  scope_target:     pack-split-ci-partition-checks (dependency-guarantees) — it already owns
                    partition/namespace work, already touches scripts/validate-plugin.mjs,
                    and already depends on this item at `shipped`.
  owner:            principal-swe-infra
```

**What would change my mind (trigger to promote):** a sixth pack, any pack key that is not
`[a-z]+`, or the partition being re-opened for renaming (note `pack-split-ci-partition-checks`
already carries the `fleet-observation -> kai-core-fleet-observation` rename, so a key-shape
change is closer than it looks). Until then it rides into `ci-partition-checks` as a two-line
hardening, not as its own item.
