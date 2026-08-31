# Thread — area-plugins-surface-tree-rename

## DECISION 2026-08-31-0914 — operator -> principal-swe-infra

- decision: Rename the committed tree from `packs/` to `plugins/`.
- boundary: This change moves paths only. It does not yet delete root agents or
  skills, change plugin membership, rename the marketplace, or move the dogfood
  workspace.
- compatibility: The old repository subpath is intentionally not retained.
- next: principal-swe-infra — implement a content-neutral rename and prove
  generator parity.
