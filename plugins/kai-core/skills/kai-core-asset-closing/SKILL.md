---
name: kai-core-asset-closing
description: "Use when recording final asset disposition, validity, supersession, retraction, archival, or publication cleanup."
tools: [read, edit, execute, search]
---

# Asset closing

Close only an artifact already registered through the shared production
contract. SQLite at `.kai/core/runtime/coordination.sqlite` is the **only
coordination authority** for acceptance, disposition, validity, and
supersession.

## Re-read before closure

Verify:

- exact hierarchy subject and version;
- registered artifact and current asset revision;
- producer, completion authority, approval, and accepted hash;
- current input basis and required reviews/evidence;
- private source and mirrored public target;
- destination ownership and path safety;
- predecessor/successor references;
- current Task or parent closure criteria.

If any basis changed, refuse with the typed runtime error. Do not infer
acceptance from file existence or Git history.

## Disposition

Use `asset.transition` for every disposition or validity change.

- `published` requires one current accepted public revision.
- `archived` preserves provenance and accepted history.
- `retracted` preserves the public-history record and names the authority and
  rationale.
- `discarded` removes unaccepted working material only.
- `superseded` requires one current accepted successor and an explicit link.

Scratch is always removed at closure. Retained drafts and evidence move to the
typed private archive path. Private evidence never moves to the public tree.

## Freshness

Validity is independent from disposition. A published file may become stale,
expired, superseded, invalidated, or retired without pretending it was never
accepted. Revalidation records the new evidence and authority; it does not
overwrite the old decision.

## Hierarchy closure

Closing an asset does not close its Task, Requirement, Feature, or Epic.
Closing a hierarchy parent does not publish an asset automatically. Each
closure uses its own named authority and exact criteria reference.

No Markdown board, backlog, milestone, thread, Task, or hierarchy log is an
authority surface. Reports and exports are views over SQLite.
