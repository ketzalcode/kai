# Drop record: `kai-core-team-operating-rules`

The 15,897-character `kai-core-team-operating-rules` contract was loaded eagerly
by all 55 agents, costing roughly 28,800 tokens of context before any agent read
its task. Roughly two thirds of it was a 30-role cross-role ownership map that
nothing routes off — the Copilot CLI host routes work by reading each agent's
frontmatter `description`, never a central map.

Unlike the earlier splits in this refactor, this was a **rewrite, not a
re-partition**. The verbatim-copy constraint did not bind here. The replacement,
`kai-core-operating-rules` (3,408 chars), keeps only the rules that bind roles to
each other and to the human, stated as *kinds* and *obligations*. Wording was
compressed; obligations were not. Where a rule already had a canonical owner in
another skill, it was verified there and dropped here rather than duplicated.

## Section destinations

The source had 8 sections; every one has an explicit disposition below.

| # | Source section (lines) | Disposition |
| --- | --- | --- |
| 1 | `# Team Operating Rules` intro (7–20) | Rewritten as a short intro for `kai-core-operating-rules`. |
| 2 | `## Role taxonomy` (20–121) | **30-role map deleted.** Kept only what `director-*`, `principal-*`, `workflow-*`, `persona-*`, `instructor-*`, `eng-lead-*` (and the newer `<family>-<posture>-<scope>` postures) mean as *kinds*, plus "stay in your lane". |
| 3 | `## Initiative and scope` (121–142) | Para 1 (workspace root) → verified in `kai-core-workspace-paths`, dropped. Para 2 (ACTIVE.md north star) → verified in `kai-core-workspace-initiative`, dropped. Paras 3–4 (scope-discipline, design-grounding, ui-mockup) → deleted; these become per-agent routes in Tasks 7–9. |
| 4 | `## Acting-agent loop` (142–188) | **Moved to `kai-core-work-acting`** as a new `## The acting loop` section, placed immediately after `## Coordination surface`. Rewritten as a short ordered procedure that points at the owning section/skill for each detail, not a verbatim paste. |
| 5 | `## Engineering and verification` (188–213) | Test ownership + "QA is not a sink" → **kept, detaxonomised** in `kai-core-operating-rules`. DoD gate + `knowledge` ends at `completed` → verified in `kai-core-work-acting` (review routing) and `kai-core-work-item`, dropped. "Never label non-production work `shipped`" → **kept**. "Item completion does not freeze asset truth" → verified in `kai-core-asset-producing` (core rule + hard rule 1), dropped. |
| 6 | `## Communication` (213–226) | **Kept, compressed** in `kai-core-operating-rules`: route to `kai-core-peer-communication`; address roles not people; never grade your own scope/assessment/architecture/review/ship question as independent; `@operator` only for a decision no kai role owns. |
| 7 | `## Personal front door` (226–258) | **Deleted from the shared contract.** Every word describes one agent. It is Task 8 debt for `plugins/kai-core/agents/director-executive-assistant.agent.md` — see below. |
| 8 | `## Declaring what you inherit` (260–end) | **Deleted.** Eager `**Inherits:**` loading is exactly what this refactor removes; the machine-checkable contract moves to per-agent on-demand routes. |

## The 30-role ownership map that was deleted

The map assigned cross-role authority for 30 named roles. Nothing routed off it;
each role's *own* authority moves into that role's body (Tasks 7–9), and the
cross-role authority is simply deleted. The full roster the map named, recorded
here so nothing is lost silently:

```text
instructor-tutor
instructor-teacher
instructor-path-mentor
principal-engineer-career-mentor
workflow-product-explore
principal-product-marketing
principal-product-manager
principal-customer-success
workflow-support-triage
principal-growth
principal-data-analytics
workflow-experiment-review
principal-pricing-monetization
workflow-customer-feedback
principal-sales
principal-solutions-architect
principal-product-designer
principal-swe-* (frontend, backend, and other SWE roles)
principal-security
principal-privacy-compliance
principal-sre
principal-qa-ui
workflow-incident-response
eng-lead-technical-writing
principal-revenue-operations
principal-demand-generation
principal-partnerships
workflow-localization
principal-data-engineer
principal-brand-designer
```

The map's closing sentence "Do not collapse those judgments into the PM,
explorer, or director" is subsumed by the kept "stay in your lane" rule: each
role owns its lane and routes what it does not own as a proposal.

## Verify-then-drop evidence

For each obligation the amendment marked "verify, then drop", the sentence that
already carries it in the destination skill:

- **Workspace root** (`kai-core-workspace-paths`): "Session-state, temp
  directories, and an incidental agent cwd are never durable workspace roots."
  (Resolution section) plus "**Never invent an output path.** Resolve the
  workspace and target project before reading coordination state, dispatching
  work, or writing an artifact." (intro).
- **ACTIVE.md north star** (`kai-core-workspace-initiative`): "Before substantial
  work, read `.kai/state/ACTIVE.md`. Load only initiatives whose target matches
  the current project, repository, keywords, or operator goal." (Coordination and
  closure section).
- **`knowledge` ends at `completed`** (`kai-core-work-acting`, Review routing):
  "for `knowledge`, the named completion authority accepts the exact asset
  revision, the owning role clears the four `kai-core-asset-lifecycle`
  dimensions, and then moves the item to `completed`." Also
  (`kai-core-work-item`): "Research, plans, and product decisions complete
  without pretending they were deployed; product changes must follow the release
  path."
- **DoD gate** (`kai-core-work-acting`, Review routing): reviewers route to
  `workflow-ship` only when all `review_requirements` are satisfied, and
  "`workflow-ship` treats any unmatched required review as a DoD Gap."
- **Item completion does not freeze asset truth** (`kai-core-asset-producing`):
  core rule "Work-item completion remains historical truth even when an asset
  later becomes stale, invalidated, retired, or superseded," and hard rule 1
  "Work-item state and asset validity are independent."

All five were found. Nothing in this list was kept in `kai-core-operating-rules`.

## Kept, not dropped

- **Human gates** — the six irreversible external actions (commercial terms,
  contacting a prospect, residual risk, spend/send, publish, deploy) are kept
  verbatim as one list. They were stated only inside the 30-role map, so
  deleting the map without keeping them would have lost them.
- **Test ownership** — kept, but detaxonomised: the source named frontend,
  backend, and infra engineers; the replacement states the rule as "the agent
  that changes behaviour owns the automated tests that prove it," because a role
  list is what this task deletes.
- **Shipping honesty** — "Never label non-production work `shipped`" is kept.
- **Self-restraint** — "an assessor does not repair what it assessed" is kept as
  one sentence pointing at `kai-core-no-self-remediation` as the full contract.

## Task 8 debt

The `## Personal front door` section (source lines 226–258) describes exactly one
agent and must land verbatim in
`plugins/kai-core/agents/director-executive-assistant.agent.md` during Task 8.
It is reproduced here so Task 8 cannot lose it:

> `director-executive-assistant` is the operator's default starting point for
> **personal or unclear** intent — distinct from `director-chief-of-staff`, which
> drives team delivery and is invoked directly for a delivery request. A direct
> review, design, or exploration request goes straight to that specialist. It
> routes intent to the owning specialist (`persona-self` for drafting,
> `principal-engineer-career-mentor` for career, `instructor-path-mentor` for
> executing a certification/learning path, `director-chief-of-staff` for delivery,
> `workflow-weekly-pulse` for retrospective catch-up), consults real roles via
> `kai-core-executive-consultation`, packages pending operator decisions via
> `kai-core-decision-brief`, and assembles the forward "what needs you" agenda via
> `kai-core-personal-agenda`.
>
> Personal state resolves against the current Kai workspace. Every onboarded
> repository or durable folder contains its own ignored `.kai/personal/` lane,
> including `.kai/personal/identity/`, inbox, agenda, linked-workspace registry,
> consultation records, and decision records. Additional workspaces are optional
> read-only sources listed in the current workspace's `.kai/personal/workspaces.md`.
>
> It is **proactive-surface, never autonomous**: it reads team state read-only,
> writes private inbox/agenda/workspace-registry/consultation/decision records, and
> never answers a team thread, approves scope, sends a message, or deploys on the
> operator's behalf. Load-bearing peer answers are bridged into the authoritative
> item thread by the Chief of Staff or owning role. The operator presses every
> send, approve, and deploy button.
>
> Proactive *delivery* — pushing an update the moment a signal appears — is not
> something a declarative plugin can do itself. It requires an external runner
> (cron, Task Scheduler, a `schedule:` CI job) invoking `workflow-proactive-scan`
> on a cadence; the scan is read-only, deduplicates against a gitignored snapshot,
> and emits a notification for the runner to deliver — never acting. See the
> `kai-core-proactive-scan` skill and the plugin's `examples/proactive-runner/`.

## Notes

- The `tools` list (`[execute, read, search]`) was preserved exactly in
  `kai-core-operating-rules`.
- The 55 agents that still name the deleted skill will raise the validator error
  count. That is expected; Task 12 owns re-pointing every reference. No agent,
  script, or fixture was edited to reduce the count.
