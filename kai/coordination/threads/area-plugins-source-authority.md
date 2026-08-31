# Thread — area-plugins-source-authority

## DECISION 2026-08-31-0953 — operator -> principal-swe-infra

- decision: Make `plugins/<plugin>/agents` and `plugins/<plugin>/skills` the
  authoritative source and remove duplicate root trees.
- boundary: Preserve the five-plugin membership and marketplace identity. Do
  not begin the nine-plugin taxonomy split or optional-core behavior here.
- compatibility: No compatibility copy of root `agents/` or `skills/`.
- implementation: Reuse the partition planner as the shared source resolver;
  narrow generation to derived files and marked dependency-guard regions.
- next: principal-swe-infra — implement and prove source uniqueness.
