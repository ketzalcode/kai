# kai workspace conventions (rendered)

Authoritative skill: `kai-core-workspace-conventions`. If this rendered file ever
drifts from the skill, the skill wins. Schema version: **2**.

## Layout

```text
<workspace-root>/
├─ .kai/
│  ├─ manifest.json          # committed bootstrap + fixed root map (this repo: workspace_root ".")
│  ├─ CONVENTIONS.md         # this file
│  └─ runs/                  # ignored raw evidence + scratch (areas created on first use)
└─ kai/
   ├─ coordination/          # ACTIVE.md · BOARD.md · backlog.md · items/ · threads/
   ├─ initiatives/           # README.md · INDEX.md · <slug>/
   ├─ library/               # promoted, cross-initiative outcomes (text committed)
   └─ personal/              # ignored, workspace-local personal/assistant/identity state
```

## Placement model

Control plane vs working corpus:

- `.kai/` is the hidden control plane: `manifest.json` + `CONVENTIONS.md`
  (committed) and `runs/` (ignored, regenerable raw evidence).
- `kai/` is the visible working corpus humans browse: coordination, initiatives,
  library (committed text), and the gitignored `personal/` lane.

This repository is onboarded with `corpus_visibility: committed`, recorded
explicitly in the manifest (this is a public plugin-development repository and
the operator confirmed the working corpus is part of the project, not private
notes): `kai/coordination/`, `kai/initiatives/`, and textual `kai/library/` are
tracked so collaborators clone the working corpus. `.kai/runs/`,
`.kai/activity.jsonl`, `.kai/observed.jsonl`, `.kai/observer-consent`, and
`kai/personal/` stay ignored.

## Raw run grammar

```text
.kai/runs/<area>/<YYYY-MM-DD>/<NN>-<flavor>-<descriptor>/<artifact>
```

Areas: qa · eng · product · revenue · support · review · ship · incident · ai ·
learn · lessons · pulse · content. `learn`/`lessons` key by goal slug, `pulse`
by ISO week. Raw credentials, cookies, and browser state never leave
`.kai/runs/`.

## Initiative-owned artifacts

Initiative output defaults to `kai/initiatives/<slug>/artifacts/`:

| Artifact | Canonical default |
|---|---|
| Product surface map | `artifacts/product-map.md` |
| PM product brief | `artifacts/briefs/<item-id>.md` |
| Research memo | `artifacts/research/<item-id>.md` |
| Product design | `artifacts/designs/<item-id>.md` |
| Initiative decision / ADR | `artifacts/decisions/<item-id>.md` |
| Technical writing / docs | `artifacts/docs/<item-id>.md` |
| Marketing intelligence bundle | `artifacts/marketing/` |
| Content / creative pack | `artifacts/content/<item-id>/` |
| Security / reliability / compliance | `artifacts/{security,reliability,compliance}/<item-id>.md` |
| Growth / analytics / experiments | `artifacts/{growth,analytics,experiments}/<item-id>.md` |
| Data engineering / brand / localization | `artifacts/{data-engineering,brand,localization}/<item-id>.md` |

(Full table in the skill.) The item's `artifact_targets` list contains every
canonical workspace-root-relative path; an operator override must stay inside
this workspace and be recorded on the item.

## Promotion to the library

One-way: `.kai/runs/ -> kai/initiatives/<slug>/artifacts/ -> kai/library/<type>/`.
Promotion is steward-approved and recorded in the initiative `deliverables.md`.
Never write directly to `kai/library/` because a destination is unclear.

## Coordination authority

`kai/coordination/items/<id>.md` is authoritative; `BOARD.md` is a derived
index. See `kai-core-work-coordination`. `kai/coordination/ACTIVE.md` is the
operational focus pointer; `kai/initiatives/INDEX.md` is the permanent all-status
catalog. Removing a terminal initiative from `ACTIVE.md` must not make it
undiscoverable.
