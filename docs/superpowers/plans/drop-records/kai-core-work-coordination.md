# Drop record: `kai-core-work-coordination`

The 34,666-character `kai-core-work-coordination` contract was loaded eagerly by
41 agents, of which exactly one role can ever grant a lease. It was split along
the authority boundary into three skills so each reader loads only its own half,
and two passages were removed rather than relocated to a new skill.

## Section destinations

Every section of the original `SKILL.md` landed in exactly one place.

| Original section | Destination |
| --- | --- |
| Intro (`# Work Coordination`) | rewritten as a per-file intro in each new skill (the whole-file intro did not survive the split) |
| Why durable, per-item state | **removed** → `docs/how-kai-works.md` (rationale, not instruction — see below) |
| Coordination surface | `kai-core-work-acting` |
| Work-item record + Outcome / Acceptance / Evidence templates | `kai-core-work-item` (minus the 27-path artifact registry — see below) |
| BOARD.md | `kai-core-work-granting` |
| Lifecycle | `kai-core-work-granting` |
| `ready` vs `executable` | `kai-core-work-granting` |
| Claiming work safely (intro) | `kai-core-work-granting` |
| Single grantor | `kai-core-work-granting` |
| Verify before every state-changing write | `kai-core-work-acting` |
| Collision and stale-lease recovery | `kai-core-work-granting` |
| Multi-machine and cross-branch scope | `kai-core-work-granting` |
| Parallel work and collisions | `kai-core-work-granting` |
| Touch-set reconciliation | `kai-core-work-granting` |
| Review routing | `kai-core-work-acting` |
| HANDOFF packet | `kai-core-work-acting` |
| COLLISION record | `kai-core-work-acting` |
| RECOVERY record | `kai-core-work-granting` |
| Design-waiver record | `kai-core-work-granting` |
| QUESTION / ANSWER protocol | `kai-core-work-acting` |
| Dispatch responsibilities | `kai-core-work-granting` |
| Backlog | `kai-core-work-granting` |
| Hard rules | **split by reader**: rules binding a dispatched agent (claim/verify before acting, end every run with state + evidence + HANDOFF, close every asset through `kai-core-asset-lifecycle`) → `kai-core-work-acting`; the grantor's rules (per-item files are authoritative and `BOARD.md` is derived, parallelism controlled by dependencies and `touches`, `depends_on` typed, `shipped` requires confirmed production deployment, directors orchestrate / stewards prioritize / principals judge) → `kai-core-work-granting` |

## Removals (not relocated to a skill)

- **The 27-path artifact registry** (inside the `artifact_targets` field rule,
  ~3,122 chars) — replaced by the stated convention in `kai-core-work-item`:
  `.kai/state/initiatives/<slug>/artifacts/<domain>/<item-id>.md`, where
  `<domain>` is declared by the producing role, with exceptions named in
  `kai-core-workspace-paths`. Roles declare their own domain instead of the
  contract enumerating every path.
- **"Why durable, per-item state"** (1,004 chars) — rationale, not instruction.
  The text was folded into `docs/how-kai-works.md` (framing section, after the
  flows are introduced and before the personal-session paragraph) as the
  **Durable, per-item coordination state** paragraph.

## Cross-reference rewrites

Three prose cross-references pointed at a section that moved to the sibling
file. Each was replaced with: "The grantor's side of this protocol lives in
`kai-core-work-granting`."

- `kai-core-work-item`, `lease` field rule — was `(see *Claiming work safely*)`.
- `kai-core-work-acting`, Review routing — was `per *Single grantor*`.
- `kai-core-work-acting`, COLLISION record — was
  `(recover per *Collision and stale-lease recovery*)`.
