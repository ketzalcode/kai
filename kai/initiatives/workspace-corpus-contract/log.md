# workspace-corpus-contract — steering log

Append-only. Newest entries at the bottom. Each entry records a steering
decision or state change, not routine work (routine work lives on item
threads).

## 2026-08-27-2113 — initiative proposed (steward split from area-plugins)

`principal-product-manager` (steward of `area-plugins`) admitted the
operator's nine additional P0 concerns from the 2026-08-27-2113 second
revision and **split** four of them into a new, proposed initiative: workspace
storage modes, initiative archive semantics, the backlog contract, and the
design-output contract. None of the four targets `area-plugins`' surfaces
(`plugin.json`, the generated pack tree, the marketplace). The steward
authored a binding product/process **DECISION** for each in its coordination
thread — `area-plugins-workspace-storage-modes`, `area-plugins-initiative-
archive`, `area-plugins-backlog-contract`, `area-plugins-design-output-
contract` — and created all four items at `proposed`, `owner: null`, cleared
leases. No session in that chain held a shell, so this directory could not be
created; the four threads were the durable record. Full rationale:
`STEWARD AMENDMENT 2026-08-27-2113` (A10) in
`kai/coordination/threads/area-plugins-scope-brief.md`.

**Needed before this initiative could go live:** an operator go/no-go on
starting a second initiative, per `kai-core-initiative-stewardship` — starting
an initiative is an operator decision, never a steward one.

## 2026-08-28 — initiative materialized and ratified (operator approval)

The operator explicitly approved **(a)** this initiative and **(b)** the
recommended audience-based workspace model — a reconciling architecture that
ties the four contracts above together under one boundary: `.kai/` is
agent/machine-facing, `kai/` is operator-facing.

**Workspace (resolved and confirmed before writing):**

- mode: repository
- root: `.` (git repository root `C:\src\kai`)
- run_root: `.kai/runs`; manifest: `.kai/manifest.json`
- `kai/initiatives/workspace-corpus-contract/` created with `artifacts/decisions/`
  (the only artifact lane written this pass — no lane is pre-created without a
  writer).

**Written this pass:**

- `northstar.md` — thin core, `status: active`, mission and vision carried
  from the steward's 2026-08-27-2113 split description, one milestone
  (`corpus-honesty`) with a non-empty typed `required_items` mapping over the
  four existing decision items.
- `backlog.md`, `deliverables.md` (this file's siblings) — seeded empty.
- `artifacts/decisions/workspace-corpus-contract-architecture.md` — the
  ratified architecture decision. It reconciles the four items' independently
  authored `DECISION 2026-08-27-2113` records under the audience boundary,
  stating for each whether the boundary confirms, extends, or narrows it. It
  rewrites none of them.

**Updated, minimally, and not rewritten:**

- Each of the four items' `artifact_target` moved from `null`
  ("blocked-on-directory-creation") to its now-real canonical path under this
  initiative's `artifacts/decisions/`. The canonical transcription of each
  item's full decision text is **not** done this pass — it is a separate
  mechanical promotion pass, same as `area-plugins`'s "artifact owed" rows —
  so the binding requirement remains each item's thread `DECISION`, cited from
  its (still `null`-content, path-only) artifact stub.
- Each item's thread received one short, append-only pointer note recording
  this pass, dated 2026-08-28. No `DECISION`, `HANDOFF`, requirement, ruling,
  or number in any of the four threads was edited.
- `kai/initiatives/INDEX.md` and `kai/coordination/ACTIVE.md` updated: this
  initiative is `active`, no longer "awaiting operator go".

**Explicitly not done this pass** (per the operator's instruction and this
initiative's own `out_of_scope`): no path move, manifest/schema change,
onboarding/doctor code change, mock placement, backlog enforcement, or archive
mechanic. No item was promoted from `proposed` to `ready` — that
scope-acceptance promotion is the steward's next pass, not this
materialization pass. No shipped plugin surface was version-bumped.

**Handoff:** to `principal-product-manager` as steward — confirm the thin
core, decide priority order across the four items, and open each item's
named `review_requirements`.

## 2026-08-28 — architecture seams closed (main-agent correction)

The first materialized decision correctly established the audience boundary
but left five reconciliation questions open. The operator asked to finish the
contract before returning to mocks and initiative closure, so the core
architecture questions were closed in the decision rather than delegated:

- the live machine-state root is exactly `.kai/state/`;
- storage mode governs the working corpus, while explicit publication uses an
  independently configured publication root and is never silently unpublished;
- `kai/backlog.md` is one `Now` / `Next` / `Parked` authority surface;
- `kai/library/` becomes legacy read-only history after migration;
- `kai/review.md` is workspace-scoped, while `kai/personal/agenda.md` remains
  the private cross-workspace agenda.

Only mock mechanics and initiative closure mechanics remain deliberately
deferred, matching the operator's requested sequence.

## 2026-08-28 — independent review reconciliation

A second independent pressure test found no boundary reversal, but caught
record-level contradictions. Revision 3 corrected them:

- the three superseded contract paths are named honestly rather than described
  as unchanged;
- ACTIVE, BOARD, and coordination README have target homes under `.kai/state/`;
- the four founding items are knowledge items with decision acceptance, while
  named follow-ons own implementation;
- the library map covers all eleven current types and has no dependency on an
  unpublished plugin;
- publication-root registration, review ignore rules, and typed dependency
  order have named owners;
- the initiative summaries and declared artifact targets are reconciled.
