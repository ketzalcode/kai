[kai](../../../README.md) / [Docs](../../README.md) / [Reference](../agents-and-skills.md) / `kai-assistant`

# Package: `kai-assistant`

Pre-release / in progress source. This package is not part of the default marketplace surface; see [package availability](../package-availability.md).

Personal tasks, agendas, briefings, and user-voice drafts. Direct assistance
over `kai-core` — **not** organization routing.

## Install

The supported baseline is core plus this package. Use these commands only with
a marketplace source containing the eight-package refactor; browse and verify
availability first. Current `9.0.0` metadata is prepared source, not publication
or live-host verification:

```text
copilot plugin marketplace add RubenSaucedo/kai
copilot plugin marketplace browse kai-plugins
copilot plugin install kai-core@kai-plugins
copilot plugin install kai-assistant@kai-plugins
```

No other capability package is required, and no npm runtime dependency ships
with it (`dependencies: {}`). `kai-core` works on its own without this package
installed.

## Entry points

Both agents are invoked directly. Neither routes work to another agent, and
neither holds `agent`, `read_agent`, or `write_agent` tools.

| Agent | Ask it for | Not for |
| --- | --- | --- |
| `personal-assistant` | Your tasks, priorities, a briefing you asked for, an ordinary draft | Team delivery, dispatching specialists, sending anything |
| `persona-self` | Long-form or high-stakes writing in your voice — posts, design docs, PR narratives, sensitive replies | Writing as anyone but you; publishing |

## Methods

| Skill | Purpose |
| --- | --- |
| `personal-agenda` | The personal inbox and agenda: capture, lifecycle, waiting, snooze, recurrence, deduplication, ranking, and the two file schemas |
| `decision-brief` | A decision packaged from supplied evidence or a selected team record: options, tradeoffs, provenance, unresolved facts, sourced recommendation |
| `extract-writing-style` | Builds or refreshes the voice profile, on explicit request, from a consented corpus |
| `write-in-user-voice` | Applies supplied or approved stored preferences to a draft while preserving facts, claim strength, and uncertainty |

`personal-agenda` reads `kai-core-proactive-scan`'s **Operator signals** section
when — and only when — a team-aware agenda is requested. That is an
interpretation of existing records. It does not run the scan or ack phases, emit
a notification payload, or advance the delivery ledger.

## Private state

All of it lives in the ignored `.kai/personal/` lane of the selected Kai
workspace. Nothing here is committed or promoted to the publication root.

| Path | Written by |
| --- | --- |
| `.kai/personal/inbox.md` | `personal-agenda` — authoritative personal tasks |
| `.kai/personal/agenda.md` | `personal-agenda` — the derived ranked view |
| `.kai/personal/decisions/<d-YYYY-NNNN>.md` | `decision-brief` |
| `.kai/personal/identity/voice.md` | `extract-writing-style` |
| `.kai/personal/workspaces.md` | The linked-root registry, read when a linked root is explicitly requested |
| `.kai/personal/consultations/<c-*>.md` | **Nothing in this package.** Records written by the retired `kai-core-executive-consultation` remain readable history and are neither migrated nor deleted |

Stateful scenarios below assume a valid selected workspace. If it is absent,
the expected behavior is to report the missing persistence prerequisite and
offer a nonpersistent response — never to silently initialize a workspace or to
claim the task was stored.

## Scenario matrix

**Every row below is runtime unverified.** These are the acceptance scenarios
the package is written against, checked by reading the shipped instructions. No
agent was executed on a live host as part of this change, so none of these rows
is an observed result.

| Request | Expected behavior | Must not happen |
| --- | --- | --- |
| "Capture: renew certification Friday" | One personal inbox task with the supplied due date resolved honestly | Agent dispatch, team lease, claimed notification scheduling |
| "What are my personal priorities?" | Rank personal tasks using relevant dates and dependencies | Unrequested scan of all linked team roots |
| "Draft a short reply from these facts" without stored profile | Return a labeled supplied-preference/neutral draft | Workspace-init requirement, invented profile, specialist delegation |
| "Write this as me" with an approved voice profile | Direct voice-method use and facts preserved | Sending, publishing, or exposing unrelated private history |
| "Brief this team decision" with an answered QUESTION | Recognize the matching ANSWER and distinguish resolved from pending | Treating stale QUESTION status as an open decision |
| "Compare these supplied options" with a missing fact | Separate evidence, assumptions, and missing information | Invented role consensus or automatic consultation |
| Core scan with assistant absent | Interpret its records through the core signal section | Loading assistant skills or requiring the old director |

A source walkthrough is useful, but it is not an execution. Treat the table as
the contract this package is supposed to meet, not as evidence it does.

## Responsibility disposition

| Responsibility | Disposition |
| --- | --- |
| Default entry point / unclear-intent routing / specialist dispatch | **Retired.** `director-executive-assistant` is deleted; nothing replaces it. The session chooses the agent. |
| Private role consultation (`kai-core-executive-consultation`) | **Retired.** Gaps are recorded as unresolved facts. General peer communication remains in `kai-core-peer-communication`, owned by the roles that coordinate. |
| Personal tasks, agenda, lifecycle, privacy rules | **Preserved and simplified** in `personal-agenda`. Team signals and cadence nudges became explicitly requested sources instead of defaults. |
| Decision briefing | **Preserved and broadened** in `decision-brief`: it now accepts an ordinary personal decision with no coordination item, and no longer consults roles or writes back to team state. |
| Voice application | **Shared locally.** `write-in-user-voice` is new and is loaded directly by both agents; `persona-self` no longer holds a private copy of the procedure, and an ordinary draft no longer hops through `persona-self`. |
| Voice extraction | **Moved** with its schema and opt-in sample selection; it now serves both agents and uses `kai-core-workspace-paths`. |
| Operator-signal authority | **Retained in core** (`kai-core-proactive-scan` → *Operator signals*). Core has no reverse dependency on this package. |
| Existing private records | **Retained, unmigrated, undeleted** — including consultation records from the retired method. |

## Known limitations

- **Naming-validator mismatch (deferred).** `personal-assistant` parses under the
  provider-family grammar in `scripts/lib/pack-plan.mjs` as family `personal`,
  posture `assistant`. Run against the shipped source, `agentTaxonomyErrors`
  reports three findings — family `personal-*` belongs to `kai-personal`, posture
  `assistant` is not one of `lead, builder, reviewer, operator, coordinator,
  advisor`, and the id is not `<family>-<posture>-<scope>` — and
  `agentProfileModelErrors` reports two: posture `assistant` allows no primary
  profile, and profile `judgment` would require frontmatter
  `model: "claude-opus-5"`. The id and frontmatter shipped here are the approved
  ones; the taxonomy was deliberately **not** rewritten to accept them. Expect
  `npm run validate` to be red on this agent until the taxonomy work lands.
  `agentRoutingErrors`, `agentPromptLimitErrors`, and the frontmatter loader
  contract all return clean for both agents.
- **Runtime unverified.** No agent, skill, or scenario in this package has been
  executed against a live host. The generation commands that ran are
  `node scripts/host-contract.mjs --update`, `npm run docs:generate`, and
  `npm run pack-preview -- --write`.
- **`session_store_sql` availability unverified.** `extract-writing-style`
  names `session_store_sql` as its primary source for a corpus extraction
  (`SKILL.md:4,176`), but neither `personal-assistant` nor `persona-self`
  grants that tool in its own `tools:` frontmatter. A skill's own `tools:`
  field is not proof the host actually grants the capability at either the
  agent or the skill boundary. This predates this fix and is not resolved by
  it: do not infer a successful history extraction, and do not add tools or
  run an extraction to settle it — confirm actual grant behavior on a live
  host as separate, approved follow-up work.
- **Deferred suites.** Baseline installs, the full validator, and the rest of
  `npm test` were deliberately not run for this change.
- **Cross-package referrals in core are descriptions, not dependencies.**
  `workflow-weekly-pulse` still *offers* to hand a post candidate to
  `persona-self` on the user's explicit go-ahead, exactly as it offers
  `principal-engineer-career-mentor`. With `kai-assistant` absent, that offer
  has no target; the pulse itself still renders. That degradation is not
  verified at runtime either.

---

**Next:** [Agents & skills](../agents-and-skills.md) ·
[Plugin structure](../plugin-structure.md) · [How kai works](../../how-kai-works.md)
