# Drop record: `kai-core-workspace-conventions`

The 12,577-character `kai-core-workspace-conventions` contract mixed two readers:
agents that only need to resolve a root and place a file, and agents that operate
inside an initiative and validate a `.kai` manifest. It was split by reader into
two skills so each loads only its own half. **No prose was dropped here** — every
one of the original's ten sections landed in exactly one of the two new files.
The whole-file intro paragraph did not survive the split; each new file carries
its own short intro instead.

This task also supplies the **artifact path convention** that replaces the
27-path registry deleted in the previous task. That registry's removal is
recorded in Task 3's drop record (`kai-core-work-coordination.md`); this task
does not remove it again — it states the convention the registry pointed callers
to via `kai-core-workspace-paths`.

## Section destinations

Every section of the original `SKILL.md` landed in exactly one place.

| Original section | Destination |
| --- | --- |
| Intro (`# Workspace Conventions`) | rewritten as a per-file intro in each new skill (the whole-file intro did not survive the split) |
| Resolution | `kai-core-workspace-paths` |
| Private workspace | `kai-core-workspace-paths` |
| Project publication | `kai-core-workspace-paths` |
| Storage modes | `kai-core-workspace-paths` |
| Run grammar | `kai-core-workspace-paths` |
| Agent checklist | `kai-core-workspace-paths` |
| Initiative artifacts | `kai-core-workspace-initiative` |
| Coordination and closure | `kai-core-workspace-initiative` |
| Personal state and linked workspaces | `kai-core-workspace-initiative` |
| Manifest | `kai-core-workspace-initiative` |

Relative source order is preserved within each file.

## New prose (not copied from the source)

Only three passages are new, exactly as allowed by the task brief:

- the short intro of `kai-core-workspace-paths`;
- the short intro of `kai-core-workspace-initiative`;
- the **Artifact path convention** section appended to `kai-core-workspace-paths`
  — the replacement for the deleted 27-path registry. It states the shape
  `.kai/state/initiatives/<slug>/artifacts/<domain>/<item-id>.md`, where
  `<domain>` is declared by the producing role, and names the only three
  departures (bundle output, de-identified signal, public incident report).

## Removals (not relocated to a skill)

None. No conventions prose was removed in this task. The 27-path artifact
registry was already removed in the previous task and is recorded in
`kai-core-work-coordination.md`; this task supplies its stated replacement.

## Cross-reference rewrites

None were required. No prose cross-reference in the copied sections pointed at a
section that landed in the sibling file.
