# Drop record: validator agent shape

Task 10 collapsed the plugin validator and generator from **two** agent shapes
into **one**. The legacy shape (an eager `**Inherits:**` declaration line plus a
generator-injected core-dependency guard region) and the opt-in "progressive"
shape (gated on an `**Identity contract:** kai-agent-v1` marker no agent ever
set) are both gone. Every agent now routes its contracts inline, and one checker
— `agentRoutingErrors` — validates all 56 agents.

This record lists every check and helper that was deleted, and where the
behaviour it enforced now lives (or why it is genuinely gone). The companion
`task-10-report.md` in `.superpowers/sdd/2026-09-04-agent-contract-refactor/`
carries the full before/after error reconciliation.

A rising validator count is the intended outcome: route validation now runs
against the 29 unmigrated out-of-scope agents for the first time.

## Files removed

| File | What it held | Disposition |
| --- | --- | --- |
| `scripts/lib/inherits-block.txt` | The verbatim eager-declaration directive block-quote pinned into legacy agents. | Deleted. The one shape forbids the eager line entirely, so there is nothing to pin. |
| `scripts/lib/preflight-block.txt` | The verbatim core-preflight block injected into department agents. | Deleted. Agents route the probe skill by name; the version pin survives in `contractPinErrors`. |
| `scripts/lib/degraded-block.txt` | The verbatim degraded-mode refusal injected into department agents. | Deleted. Each agent writes its own fallback; the three facts are checked per agent. |

## Deleted checks and helpers (`scripts/lib/pack-plan.mjs`)

| Symbol | What it enforced / did | Disposition |
| --- | --- | --- |
| `degradedBlockErrors` | Policed the shared degraded block: refusal budget, no affirmative instruction, names no shipped contract, restates no verbatim core line, unique refusal token, one contract-version literal, single-shot present, install remedy present. | **Deleted.** The block is gone. The load-bearing subset — continue single-shot, write no `.kai` state, tell the operator to install/update core — is enforced per agent by the three-facts check inside `agentRoutingErrors`. The block-shape rules (budget, verbatim-line, token reuse) policed a shared artifact that no longer exists and have no per-agent analogue. |
| `guaranteeBlockErrors` | Required each department agent to carry the preflight + degraded blocks, verbatim, contiguous, in order; forbade core agents from carrying them. | **Deleted.** "Route the probe first" and "state the fallback" are now per-agent in `agentRoutingErrors`. "Core carries no guard region" survives as a generated-surface check in the validator and a self-test. Contiguity/order of injected blocks is meaningless once nothing is injected. |
| `coreContractLines`, `DEGRADED_BLOCK_MAX`, `DEGRADED_QUOTE_MIN`, `DEGRADED_OPENERS` | Inputs used only by `degradedBlockErrors`. | **Deleted** with it. |
| `preflightBlock`, `degradedBlock`, `readBlock` | Read/returned the canonical block text from the `.txt` files. | **Deleted.** No canonical block; no files. |
| `guaranteeBlocks`, `guaranteeRegion`, `injectBlocks`, `injectPreflight`, `afterInheritsDirective` | Composed the guard region and injected it into an agent body at materialisation, after the eager declaration line. | **Deleted.** `materializePacks` now copies agent bodies verbatim — proven by a new self-test asserting each generated body is byte-identical to its source. |
| `PREFLIGHT_BLOCK_REL`, `DEGRADED_BLOCK_REL` | Paths to the block files. | **Deleted** with the files. |
| `ROLE_IDENTITY_CONTRACT` | The `kai-agent-v1` marker id that gated the progressive branch. | **Deleted.** The opt-in marker is retired; the one shape has no gate. |
| identity-marker arm of `agentIdentityContractErrors` | Required the `**Identity contract:**` marker line. | **Deleted.** The marker is retired. |
| identity-marker arm of `agentAuthoringReferenceErrors` | Required the authoring template to teach the marker. | **Deleted.** |

## Renamed checks (behaviour changed, not dropped)

| Old | New | Change |
| --- | --- | --- |
| `progressiveSkillRoutingErrors` | `agentRoutingErrors` | Removed the opt-in marker guard so it runs for every agent. Re-pointed the `required` list to the live contract ids and dropped `kai-core-asset-producing` from it (an agent that produces no artifact should not route it). Relaxed the fallback check from three exact-wording regexes to a three-facts check. Added: the eager-declaration line is rejected outright, for every agent. |
| `agentIdentityContractErrors` | `agentProfileModelErrors` | Kept only the profile→model binding, keyed on the agent id's family/posture/kind — the sole reader of `**Primary profile:**`. The identity-marker half was deleted (above). |

## Changed, not renamed

- `syncGuaranteeRegion` — **inverted**: it used to insert a guard region; it now
  unconditionally removes any region (`return removeGuaranteeRegion(body)`). One
  shape means the generator never injects a guard, so the only sanctioned
  transform on a legacy region is to strip it.
- `removeGuaranteeRegion` — **kept unchanged**: still strips a legacy region and
  still throws on a duplicate or malformed region. This is how a stale
  out-of-scope guard is removed rather than edited around.
- `contractPinErrors` — dropped the dead block-content parameters and checks;
  kept the live probe pin (skill-name-vs-version, `KAI_CORE_READY` marker,
  `contract:` line). This was a live obligation buried with dead machinery.

## Validator wiring (`scripts/validate-plugin.mjs`)

- The two-branch agent loop (legacy branch keyed on the eager declaration line,
  progressive branch keyed on the marker) is replaced by one loop that calls
  `agentRoutingErrors` for every agent.
- The generated-surface guarantee section no longer gates on both blocks being
  present, no longer calls `degradedBlockErrors` or `guaranteeBlockErrors`, and
  keeps `contractPinErrors` (adjusted) plus the "no core agent carries a guard
  region" check.
- The skill-firing-path check now unions `routedSkills` with `declaredInherits`
  and dispatches. This corrected one HEAD false positive: `kai-core-decision-brief`
  is routed inline by `director-executive-assistant` and was wrongly reported as
  having no firing path by the old, route-blind check.

## Removals that are genuinely gone (no live analogue)

- The block-shape rules (refusal budget, verbatim-core-line, refusal-token
  reuse, contiguity/order of two injected blocks). They policed a shared
  injected artifact. Once nothing is injected and each agent writes its own
  fallback, these have no per-agent meaning.
- The requirement that an agent declare an eager contract-list line. The
  obligation is inverted: that line is now forbidden.

## PDS-5 debt for Task 12 (authoring template)

Two shipped authoring references still teach the retired identity marker and
must be updated by Task 12; this task deliberately did **not** touch them (the
rule forbids editing skills to improve a count):

- `plugins/kai-core/skills/kai-core-create-agent/references/agent-template.md`
- `plugins/kai-core/skills/kai-core-create-agent/references/taxonomy.md`

Both still instruct new agents to declare the versioned identity-contract marker
line that `agentProfileModelErrors` no longer reads and `agentRoutingErrors` no
longer requires. Until Task 12 re-points them, an author following the template
will add a line that is now inert body text. No validator check enforces the
marker any longer, so this is documentation drift, not a build break.

## Borderline calls

- **Migrated agents newly failing the fallback fact-regexes.** The brief's
  Step-3 item-4 regexes were implemented verbatim. Several already-migrated
  agents express the same facts in other words (for example "a single backend
  read or edit" rather than "single-shot", or "persist no `.kai` record" rather
  than "`.kai` state"), so they fail a check whose stated intent is "the three
  facts, in any phrasing". Not resolved here: the regexes are the settled spec
  and loosening them risks a vacuous check. Flagged for the coordinator in the
  task report.
- **Agent dispatches read as skill routes.** The `routes unknown skill` arm
  (pre-existing, preserved verbatim) reads a lowercase dispatch verb before a
  backticked agent id as a skill route, so a real agent dispatch fails as an
  unknown skill. Five such errors appear in migrated packs. Preserving the arm
  was the faithful choice; the fix (teach the checker the agent roster, or
  normalise director dispatch prose) is out of this task's scope and is flagged
  as a follow-up.
