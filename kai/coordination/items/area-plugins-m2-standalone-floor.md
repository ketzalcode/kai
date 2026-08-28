---
type: work-item
id: area-plugins-m2-standalone-floor
title: Name the standalone contract floor — amend inherits-block.txt, propagate to all 56 root bodies, add INHERITS_FLOOR_MAX
initiative: area-plugins
milestone: optional-core-contract
delivery_class: product-change
state: ready
resume_state: null
priority: 30
owner: null
next_role: principal-swe-infra
target: standalone contract floor (inherits-block)
artifact_target: null
context_artifacts:
  - kai/coordination/threads/area-plugins-m2-decomposition.md
  - kai/coordination/threads/area-plugins-optional-core-architecture.md
  - scripts/lib/inherits-block.txt
  - scripts/validate-plugin.mjs
  - skills/kai-core-workspace-conventions/SKILL.md
touches:
  - scripts/lib/inherits-block.txt
  - agents/
  - packs/kai-core/agents/
  - packs/kai-engineering/agents/
  - packs/kai-product/agents/
  - packs/kai-gtm/agents/
  - packs/kai-personal/agents/
  - scripts/lib/pack-plan.mjs
  - scripts/validate-plugin.mjs
  - scripts/pack-preview.mjs
  - package.json
  - package-lock.json
  - CHANGELOG.md
depends_on:
  - item: area-plugins-m2-planpacks-prefix
    requires: shipped
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-1944
---

## Outcome

The inline fallback that already ships in every agent body is promoted from an
incidental hedge to the **named, size-budgeted standalone contract floor**, with
the one clause that currently forbids standalone mode qualified — and behaviour
is unchanged in every mode that exists today.

## Acceptance

- [ ] `scripts/lib/inherits-block.txt` is amended in exactly two ways: the
      durable-root clause is **qualified to full mode**, and a standalone clause
      is added stating that standalone mode creates no such state at all. Nothing
      else in the block changes.
- [ ] All **56** root agent bodies (`agents/*.agent.md`) carry the amended
      directive verbatim; `scripts/validate-plugin.mjs:312-314` is green across all
      56 with no exceptions and no per-agent variance.
- [ ] `packs/` is regenerated in the **same PR** as the block change, and
      `pack-preview --check` reports byte parity — the block swap and the
      regeneration never land apart.
- [ ] `INHERITS_FLOOR_MAX` is added (modelled on `DEGRADED_BLOCK_MAX = 1200`) and
      enforced, so the floor can never grow into a second copy of core.
- [ ] The amended floor **restates no core contract line** — checked against
      `coreContractLines()`, the same drift guard `degradedBlockErrors()` uses.
- [ ] A self-test mutation case proves the budget bites: a floor over
      `INHERITS_FLOOR_MAX` fails.
- [ ] **Behaviour is unchanged in both live modes:** with core present nothing
      differs; with core absent the injected preflight still refuses. The floor is
      not yet reachable — that happens in `area-plugins-m2-mode-selection`.
- [ ] `skills/kai-core-workspace-conventions/SKILL.md` is **not** amended. The
      contradiction is a summarisation defect in one byte-pinned file, not an
      architectural conflict; the skill already scopes its prohibition to
      "coordinated or initiative work".
- [ ] `npm test` green; `release-guard` passes with a forward version bump.

## Evidence

- <Filled as work progresses: diff, `--check` output, validator run, test run,
  review.>

## Notes

**Release/version: planned `1.0.6`, inside `1.0.x`.**

**This is a reshape of shipped text, not a build.** `scripts/lib/inherits-block.txt`
is already byte-pinned into all 56 root agent bodies
(`scripts/validate-plugin.mjs:243-247, 312-314`) and its second sentence is
already the core-absent fallback. The operating floor ships today. What is
missing is a name, one qualified clause, and a size budget.

**The clause being fixed, verbatim from the accepted architecture.** The block
currently compresses the workspace-conventions rule to *"resolve a durable target
workspace root before creating state, never Copilot session-state or a temp
directory"* — unqualified, that forbids standalone mode outright. The amended
shape:

> *"…in full mode, resolve a durable target workspace root before creating
> coordinated or initiative state, never Copilot session-state or a temp
> directory; in standalone mode create no such state at all…"*

**Sizing: L, and the size is width, not depth.** One file of judgment, 56 files
of mechanical exactness, 56 regenerated bodies, one new constant, one mutation
case. The whole risk is a single body drifting by one character — which is
precisely what the byte-pin catches, so the failure mode is a red build rather
than a silent divergence. There is no cheaper version that leaves the floor
honest: the width is the pin doing its job.

**Second sizing risk.** The new clause must satisfy `INHERITS_FLOOR_MAX` **and**
the `coreContractLines()` drift guard simultaneously. If the budget and the
required clause set collide, the clause gets tighter — **the budget is not raised
silently.** Raising it is a change to the guard that stops the floor becoming a
second copy of core, and that goes back to the architect.

**Residual named by the architecture, carried here so it is not lost.** The
`kai-core-workspace-conventions` ephemeral escape points at `<cwd>/.kai/runs/`, a
path standalone must never use. The two never meet — that skill is core-provided,
so it does not load in a core-less session. **Trigger that reopens this:** any
change that makes `kai-core-workspace-conventions` reachable without core.

**Dependency is serialization, not correctness.** `area-plugins-m2-planpacks-prefix`
`requires: shipped` because both items regenerate `packs/`; concurrent PRs would
conflict across 56 generated files and make a red `--check` unattributable. The
steward may relax this edge if a second engineer is available and the two PRs are
merged strictly serially.

### Steward promotion 2026-08-27-1944 (`principal-product-manager`)

`proposed -> ready`, priority **30**, version 1 -> 2, `owner: null`, lease
untouched and null. Recorded in
`kai/coordination/threads/area-plugins-scope-brief.md`, STEWARD AMENDMENT
2026-08-27-1944 (A8).

**Ready, not runnable.** Two declared dependencies stand between this and
dispatch: the typed edge on `area-plugins-m2-planpacks-prefix` (`shipped`), and
through it the steward's frontier edge onto `area-plugins-migration-architecture`
(`completed`). Both are on-track pending dependencies, which is the normal
condition of a `ready` downstream item — not `blocked`.

**The serialization edge stands for now, and I am not relaxing it speculatively.**
The plan offers relaxation if a second engineer appears; capacity is
`principal-swe-manager`'s call to raise and mine to grant, and neither has
happened. Until then the edge is what keeps a red `--check` attributable across 56
regenerated bodies, which is worth more than a hypothetical parallel lane.

**L is accepted as honest width, not padding.** The clause is byte-pinned into all
56 root bodies by `scripts/validate-plugin.mjs:312-314`; the size is the pin doing
its job. **The `INHERITS_FLOOR_MAX` budget is not raised silently** — if the budget
and the required clause set collide, the clause gets tighter and any proposal to
raise the budget returns to the architect. That is a steward line: the budget is
what stops the floor becoming a second copy of core.

**Acceptance is unchanged by this promotion**, including the line that
`skills/kai-core-workspace-conventions/SKILL.md` is **not** amended.
