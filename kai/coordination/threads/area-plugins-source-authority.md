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

## REVIEW 2026-08-31-1007 — principal-swe-architect

- kind: architecture-contract
- phase: implementation
- change_ref: `3cd1339`
- verdict: bounced
- blocker: The opening managed-region marker omitted its closing `-->`, which
  made Markdown renderers treat the dependency guard as a comment.
- important:
  - Generated cleanup could delete future skill companion files.
  - Validation did not prevent retired root source trees from reappearing.
  - One contributor-doc link still targeted root `skills/`.
  - Contributor docs did not explain the managed-region boundary.
- next: principal-swe-infra — remediate and re-run exact-ref review.

## REVIEW 2026-08-31-1040 — principal-swe-architect

- kind: architecture-contract
- phase: implementation
- change_ref: `c95a013`
- verdict: approved
- findings:
  - SOURCE_AUTHORITY PASS — 56 agents and 52 skills each have one plugin-local
    source; all 108 authored bodies match the pre-migration source after
    removing only the managed department guard.
  - MANAGED_REGION PASS — all 49 department guards use closed HTML-comment
    markers; core agents carry none; malformed and softened regions fail.
  - GENERATION_BOUNDARY PASS — complete sources are never generated, unknown
    files are reported but not deleted, skill companions are preserved, and
    stale routed scripts remain generator-owned.
  - READER_MIGRATION PASS — validator, catalog, inventory, reference analysis,
    previews, and planning all read plugin-local sources.
  - RELEASE_DOCS PASS — five-plugin membership and marketplace identity are
    unchanged; release surfaces agree on `2.1.0`.
- blockers: none
- important: none
- note: `--check` regeneration guidance is broad for an unknown-file failure;
  the `unexpected: <path>` diagnostic remains explicit and fail-closed.
- next: workflow-pull-request — open the source-authority release PR.
