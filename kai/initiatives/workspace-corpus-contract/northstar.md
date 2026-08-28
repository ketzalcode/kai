---
type: initiative
title: Workspace corpus contract — audience-based storage, backlog, review, and archive
slug: workspace-corpus-contract
status: active
horizon: 2026-Q4
mission: Make the kai workspace corpus bounded, opt-out-able, and honest — one place for every kind of record, a real close-and-archive path, and a storage choice the operator makes rather than inherits.
vision: Every kai record has exactly one destination determined by its audience — agent/machine-facing state under `.kai/`, operator-facing attention and durable publication under `kai/` — with a storage-mode choice that is always explicit and never silently discarded on switch, exactly one backlog and one design destination per case, and a terminal initiative that verifiably leaves the live coordination surface.
workspace:
  mode: repository
  root: "."
  run_root: ".kai/runs"
  manifest: ".kai/manifest.json"
scope:
  repos: []
  targets:
    - skills/kai-core-workspace-conventions/SKILL.md
    - skills/kai-core-workspace-onboarding/SKILL.md
    - skills/kai-core-work-coordination/SKILL.md
    - skills/kai-core-initiative-stewardship/SKILL.md
    - skills/kai-core-personal-agenda/SKILL.md
    - skills/kai-core-scope-discipline/SKILL.md
    - skills/ui-mockup/SKILL.md
    - agents/principal-product-designer.agent.md
    - agents/principal-brand-designer.agent.md
    - agents/workflow-workspace-init.agent.md
    - scripts/workspace-doctor.mjs
    - kai/coordination/
    - kai/initiatives/README.md
    - kai/library/README.md
    - agents/ and skills/ references to kai/library/
    - .kai/manifest.json
    - .gitignore
  keywords:
    - workspace
    - corpus
    - audience
    - .kai
    - storage-mode
    - backlog
    - archive
    - design-output
    - publication
    - review
  current:
    - corpus-honesty
  out_of_scope:
    - Mock specifics — `options.html` shape, screenshot locations, and serving behavior — which remain `area-plugins-design-output-contract`'s call and are not re-decided by the architecture decision this initiative ratifies.
    - Initiative closure/archive mechanics beyond what the archive contract already states, which remain `area-plugins-initiative-archive`'s call for its own next brainstorm/decomposition pass.
    - Any path move, manifest/schema change, onboarding or doctor code change, backlog enforcement, or archive mechanic. This initiative's `corpus-honesty` milestone ratifies target architecture and decision records; implementation is each item's own named follow-on, not created by this milestone.
    - A per-lane hybrid storage mode for operational state (part-tracked, part-local). Deferred per requirement R4 in `area-plugins-workspace-storage-modes`'s thread — two modes stand until a concrete counter-case is produced. Explicit publication is not a hybrid mode: it moves an approved artifact out of the working corpus into a configured project publication root.
    - Version-bumping or otherwise shipping any change to a shipped plugin surface as part of this ratification.
  deferred:
    - Mock specifics (options.html, screenshots, serving behavior) -> owned by area-plugins-design-output-contract; its own DECISION already names the two real holes and is unchanged by this ratification.
    - Archive mechanics detail beyond the 13-section archive contract -> owned by area-plugins-initiative-archive for its own next brainstorm/decomposition pass.
    - Hybrid storage mode -> reopen trigger stated in area-plugins-workspace-storage-modes' thread R4 (a concrete case where the whole corpus is unacceptable to commit but the initiative record alone is acceptable).
principles:
  non_negotiable:
    - "The boundary that decides a record's home is audience, not durability. `.kai/` is agent/machine-facing; `kai/` is operator-facing. A mechanism may not reclassify a record's home by durability alone — `.kai/` durability varies by storage mode, but its audience does not."
    - "Hidden does not mean ignored. Internal coordination under `.kai/` may remain tracked (committed) in team mode; it becomes local-only (ignored) in local mode. Ignored-ness is a property of the chosen storage mode, never of the leading dot alone."
    - "Three distinct, never-conflated destinations under `.kai/`: `.kai/state/` owns authoritative coordination, leases, threads, and internal task graphs; `.kai/runs/` owns ignored raw evidence; `.kai/archive/` owns inactive internal records swept out of the live coordination surface."
    - "`kai/review.md` is the ignored, generated, single-workspace operator attention front door. `kai/backlog.md` is the operator-facing P0/P1/next and parked-proposal authority. `kai/review/<item>/` is local/ignored pending review. The core-owned durable lanes are `<publication-root>/reports/`, `<publication-root>/specs/`, and `<publication-root>/decisions/`; provider-registered extensions such as `learning/` and `content/` may add domain outputs without redefining the core lanes. The root defaults to `kai/` only when the operator chooses a committed corpus."
    - "Publication moves text; it never copies it. No artifact is authoritative in both a review lane and a durable lane at the same time."
    - "Depth of durability follows the shape of the work: a spike produces no durable document; a bounded change stays in conversation or local review; architectural or multi-agent work commits an approved spec; an implementation plan is committed only when another session, agent, or reviewer actually depends on it."
    - "Local mode is honest single-checkout durability for `.kai/state/`, `.kai/archive/`, and the operator working surface, never a destructive-untracking recommendation. Switching modes requires an inventory, an explicit operator confirmation naming the exact record count affected, files remaining on disk in every direction, and a warning stated in both switch directions."
    - "A repository may configure its durable publication root to a project-native location; local mode has no implicit tracked publication root, and kai must not force a committed `kai/` corpus. Core defaults may be extended by a domain plugin (for example a future kai-learning), but an extension may never silently change a core default."
proposal_channel: kai/initiatives/workspace-corpus-contract/backlog.md
created: 2026-08-28
owner: principal-product-manager
related: [area-plugins]
success_measures:
  - measure: Every internal coordination record's placement matches its audience (agent/machine-facing vs operator-facing), not merely its current durability.
    baseline: "kai/coordination/ is committed and lives under the operator-facing kai/ tree today, even though its content — leases, threads, internal task graphs — is agent/machine-facing state. The audience boundary is documented by this ratification but not yet implemented."
    target: 100% of coordination/lease/thread/internal-task-graph records resolve under an agent-facing root once implemented; 100% of operator attention, backlog, and publication surfaces resolve under an operator-facing root; verified by a workspace-doctor check once built.
  - measure: A storage-mode switch never silently discards a durable record.
    baseline: "scripts/workspace-doctor.mjs:406 remediates a committed -> local switch with an unguarded `git rm --cached`, which followed literally removes the corpus from HEAD for every other clone while leaving it on the operator's own disk."
    target: both switch directions require explicit operator confirmation naming the exact record count affected before any destructive git step; 0 records lost across either direction, self-tested.
  - measure: No terminal initiative occupies the live coordination surface.
    baseline: "61% of kai/coordination/items/, 64% of kai/coordination/threads/, and 64% of BOARD.md rows belong to pack-split, which is shipped and already absent from ACTIVE.md."
    target: 0% of the live coordination surface belongs to an archived initiative, with 100% of swept records resolvable through a per-initiative resolution table.
  - measure: Exactly one destination exists for every deferred proposal and every design/mock output, and a doctor run can prove it.
    baseline: "Two backlog destinations and three design destinations are already documented (kai-core-workspace-conventions), but zero doctor checks validate either."
    target: at least one doctor check per contract catching prohibited backlog files, stray design/mock placement, and proposal_channel drift, each self-tested against an injected fixture.
milestones:
  - id: corpus-honesty
    outcome: The audience-based workspace-corpus architecture — agent-facing `.kai/`, operator-facing `kai/`, explicit publication lanes, honest storage-mode switching, and archive mechanics — is ratified as the binding target design. Each of the four constituent product/process contracts (storage modes, initiative archive, backlog, design-output) is reconciled under this one boundary, with a named follow-on implementation item for each; nothing is implemented yet.
    acceptance:
      - "The architecture decision at kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md is accepted and states, for each of the four items' existing DECISION records, whether the audience boundary confirms it as written, extends it, or narrows it — naming every place explicitly rather than leaving reconciliation implicit."
      - "Each of the four items' own DECISION record remains the historical source in its coordination thread. This milestone supersedes only the archive, unaffiliated-backlog, and unaffiliated-durable-design destination paths named explicitly in the architecture decision's §13; no requirement, ruling, or number is otherwise changed."
      - "No path move, manifest/schema change, onboarding/doctor code change, mock placement, backlog enforcement, or archive mechanic is implemented under this milestone. A follow-on implementation item is named per contract, not created here."
      - "Mock specifics and archive-mechanics detail beyond what the existing design-output and archive contracts already state remain explicitly with their owning items, per scope.out_of_scope, not re-decided by this milestone."
    success_measures:
      - Every internal coordination record's placement matches its audience (agent/machine-facing vs operator-facing), not merely its current durability.
      - A storage-mode switch never silently discards a durable record.
      - No terminal initiative occupies the live coordination surface.
      - Exactly one destination exists for every deferred proposal and every design/mock output, and a doctor run can prove it.
    required_items:
      - item: area-plugins-workspace-storage-modes
        state: completed
      - item: area-plugins-initiative-archive
        state: completed
      - item: area-plugins-backlog-contract
        state: completed
      - item: area-plugins-design-output-contract
        state: completed
---

# Workspace corpus contract — audience-based storage, backlog, review, and archive

Thin core for the initiative. The four constituent contracts were authored by
the steward on 2026-08-27-2113 while this directory could not yet be created
(no session held a shell); they remain durable in
`kai/coordination/threads/area-plugins-{workspace-storage-modes,
initiative-archive, backlog-contract, design-output-contract}.md` and are
**not rewritten by this north star**. This file is the initiative's thin core,
not a replacement for those records.

## Why this is one initiative and not four items

All four contracts are the same defect wearing four hats: *kai documents
conventions it does not enforce and does not let the operator decline.* They
share targets (`skills/kai-core-workspace-conventions/SKILL.md`,
`scripts/workspace-doctor.mjs`), share one underlying success measure (a doctor
run can prove the corpus matches the operator's declared intent), and fixing
any one without the others leaves the pattern intact. See the steward's
`STEWARD AMENDMENT 2026-08-27-2113` (A10) in
`kai/coordination/threads/area-plugins-scope-brief.md` for the full split
rationale from `area-plugins`.

## What changed with this materialization pass (2026-08-28)

The operator explicitly approved **(a)** this initiative and **(b)** the
recommended audience-based workspace model — the reconciling frame that ties
the four independently-authored contracts together under one boundary
(`.kai/` agent/machine-facing, `kai/` operator-facing), described fully in
`artifacts/decisions/workspace-corpus-contract-architecture.md`. This pass:

- creates this directory and its canonical files (this north star, `log.md`,
  `backlog.md`, `deliverables.md`);
- writes the architecture decision reconciling the four contracts;
- flips this north star to `status: active` and removes the "awaiting operator
  go" language from `kai/initiatives/INDEX.md` and
  `kai/coordination/ACTIVE.md`;
- updates each of the four items' `artifact_target` from `null` (blocked on
  directory creation) to its now-real canonical path, and appends a pointer
  note to each item's thread — **without** rewriting any `DECISION`, `HANDOFF`,
  requirement, ruling, or number already recorded there.

**What this pass deliberately does not do:** promote any of the four items
from `proposed` to `ready` (that scope-acceptance promotion is the steward's
next pass); transcribe the four contracts' full text into their own canonical
artifact files (a separate mechanical pass, same as `area-plugins`'s "artifact
owed" rows); or implement any path move, schema change, onboarding/doctor
change, mock placement, backlog enforcement, or archive mechanic.

## Stewardship

Owner and steward: `principal-product-manager`. The steward's next pass is to
confirm this thin core, promote the items it accepts to `ready` with a
priority order, and open the scope-acceptance review each item's
`review_requirements` already names. Nothing here pre-empts that review — this
north star ratifies that the *work exists and is worth doing*, not that any
specific mechanism proposed downstream is accepted.
