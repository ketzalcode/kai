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
