# Incubated engineering components

These components are inactive development drafts. In this checkout, they are
tracked here to preserve source and history, but they are not part of the active
source registrations or newly generated packs. Older installations are
unchanged until updated; this source change does not verify or claim their
removal from a live host.

Moving a component here is not approval to reintroduce it. Re-entry is tracked
in [#211](https://github.com/RubenSaucedo/kai/issues/211) and requires an
independent review of its responsibility, triggers, inputs, output contract,
consumer, stopping point, grounding rules, focused evidence, and operator
sign-off.

`eng-lead-architecture` is tracked separately in
[#249](https://github.com/ketzalcode/kai/issues/249). Its active trigger and
relationship to `eng-lead-software` require redesign before re-entry.

`eng-builder-platform` is also parked separately. Re-entry requires a
repository-learning design that grounds platform behavior in the target
repository's CI/CD, infrastructure, runtime, identity, and observability
conventions rather than generic platform advice.

`workflow-ship` remains inactive until it owns meaningful release authority or
executable release actions beyond recording state. Re-entry also needs measured
evidence that the capability should be an agent rather than an explicit skill
or host command.

`fleet-observation` is parked with its former hook and scripts because the host
does not emit lifecycle events for Kai custom agents. Re-entry requires observed
host support that makes absence and participation claims reliable.

| Component | Kind | Original path | Status |
| --- | --- | --- | --- |
| `workflow-doc-review` | agent | `plugins/kai-engineering/agents/workflow-doc-review.agent.md` | inactive |
| `eng-lead-architecture` | agent | `plugins/kai-engineering/agents/eng-lead-architecture.agent.md` | inactive; re-entry tracked by #249 |
| `eng-builder-platform` | agent | `plugins/kai-engineering/agents/eng-builder-platform.agent.md` | inactive; requires repository-learning redesign |
| `workflow-ship` | agent | `plugins/kai-engineering/agents/workflow-ship.agent.md` | inactive; requires meaningful release actions |
| `issue-analysis` | skill | `plugins/kai-core/skills/kai-core-issue-analysis/SKILL.md` | inactive; needs an active Engineering issue/feedback owner |
| `fleet-observation` | skill + hook/scripts | `plugins/kai-core/skills/kai-core-fleet-observation/SKILL.md` | inactive; current host cannot observe Kai agents |
| `doc-review-rigor` | skill | `plugins/kai-engineering/skills/doc-review-rigor/SKILL.md` | inactive |
| `review-security-privacy` | skill | `plugins/kai-engineering/skills/review-security-privacy/SKILL.md` | inactive |
| `review-rollout-operability` | skill | `plugins/kai-engineering/skills/review-rollout-operability/SKILL.md` | inactive |
| `review-rationale` | skill | `plugins/kai-engineering/skills/review-rationale/SKILL.md` | inactive |
| `review-alternatives` | skill | `plugins/kai-engineering/skills/review-alternatives/SKILL.md` | inactive |
| `review-risks-scope` | skill | `plugins/kai-engineering/skills/review-risks-scope/SKILL.md` | inactive |
| `review-dependencies` | skill | `plugins/kai-engineering/skills/review-dependencies/SKILL.md` | inactive |
| `review-performance-scale` | skill | `plugins/kai-engineering/skills/review-performance-scale/SKILL.md` | inactive |
| `review-success-metrics` | skill | `plugins/kai-engineering/skills/review-success-metrics/SKILL.md` | inactive |
| `review-ux-accessibility` | skill | `plugins/kai-engineering/skills/review-ux-accessibility/SKILL.md` | inactive |
