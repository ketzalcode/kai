# Incubated engineering components

These components are inactive development drafts. In this checkout, they are
tracked here to preserve source and history, but they are not part of the active
source registrations or newly generated packs. Older installations are
unchanged until updated; this source change does not verify or claim their
removal from a live host.

Moving a component here is not approval to reintroduce it. Re-entry requires an
independent review of its responsibility, triggers, inputs, output contract,
consumer, stopping point, grounding rules, focused evidence, and operator
sign-off.

Dedicated document review was declined in
[#211](https://github.com/ketzalcode/kai/issues/211): no current consumer needed
it beyond fast/deep code review and the artifact-only PR review guide. Its
`workflow-doc-review` agent and ten review skills were removed; Git history is
the archive. A new proposal needs fresh consumer evidence.

A dedicated architecture lead was declined in
[#249](https://github.com/ketzalcode/kai/issues/249). `engineering-investigation`
recommends a path from evidence, `software-development` applies architecture
principles and seeks design approval, and builders and `eng-lead-software`
stop for the named authority on expensive contract, data-ownership, or
boundary decisions. The parked agent was removed; a new proposal needs evidence
of a recurring decision that none of these owns.

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
| `eng-builder-platform` | agent | `plugins/kai-engineering/agents/eng-builder-platform.agent.md` | inactive; requires repository-learning redesign |
| `workflow-ship` | agent | `plugins/kai-engineering/agents/workflow-ship.agent.md` | inactive; requires meaningful release actions |
| `issue-analysis` | skill | `plugins/kai-core/skills/kai-core-issue-analysis/SKILL.md` | inactive; needs an active Engineering issue/feedback owner |
| `fleet-observation` | skill + hook/scripts | `plugins/kai-core/skills/kai-core-fleet-observation/SKILL.md` | inactive; current host cannot observe Kai agents |
