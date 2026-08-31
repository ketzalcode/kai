# Thread — area-plugins-surface-tree-rename

## DECISION 2026-08-31-0914 — operator -> principal-swe-infra

- decision: Rename the committed tree from `packs/` to `plugins/`.
- boundary: This change moves paths only. It does not yet delete root agents or
  skills, change plugin membership, rename the marketplace, or move the dogfood
  workspace.
- compatibility: The old repository subpath is intentionally not retained.
- next: principal-swe-infra — implement a content-neutral rename and prove
  generator parity.

## REVIEW 2026-08-31-0927 — principal-swe-architect

- kind: architecture-contract
- phase: implementation
- change_ref: `178e4bba94b860ab179edda03259162bcce8e407`
- verdict: approved
- findings:
  - PATH_COMPLETENESS PASS — 140 base paths map one-to-one to 140 head paths.
  - CONTENT_NEUTRALITY PASS — all 108 agent and skill files are byte-identical.
  - GENERATOR_VALIDATION PASS — `PACKS_DIR` resolves to `plugins/`, generator
    parity is green, and all four named gates pass.
  - MARKETPLACE_CI PASS — marketplace sources and runtime dependency jobs use
    `plugins/`; names and membership are unchanged.
  - RELEASE_DOCS PASS — all release surfaces agree on `2.0.0`.
- blockers: none
- note: `required_items[].state: shipped` is the milestone's required terminal
  threshold, not a claim that the item is already shipped.
- next: workflow-pull-request — open the path-only release PR
