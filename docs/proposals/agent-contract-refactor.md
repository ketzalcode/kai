# Agent contract refactor — kai-core + kai-engineering

**Status:** active
**Scope:** 7 `kai-core` agents, 20 `kai-engineering` agents, 26 `kai-core` skills
**Goal:** one agent shape, right-sized contracts, measurably better agent
accuracy — not a staged migration.

---

## Standing rules for this refactor

These are settled. Do not re-litigate them, and do not let tooling re-introduce
them as objections.

1. **This is a refactor, not a migration.** Optimize for the architecturally
   correct end state, not for a safe path that preserves the current one.
2. **The build may be red while the work is in flight.** A broken gate is not a
   blocker; it is expected mid-refactor.
3. **Tests may be disabled temporarily.** Existing tests, notes, and CI gates do
   not get a vote on the target design. They are rewritten to match the end
   state, at the end.
4. **No dual mode. No two shapes. No `v1` label.** Every agent ends in the same
   shape, so the shape *is* the contract. Delete the coexistence machinery
   rather than teaching it a second dialect.
5. **Rules kai invented are negotiable; rules the host imposes are not.** Drop
   or re-derive our own targets freely. Keep external constraints and make them
   obvious.
6. **The measure of success is agent accuracy and quality**, not file count or
   token count alone. Tokens are the means; better work is the end.

---

## Verified baseline

Measured on the tree at the time of writing. Recorded so it is not re-derived.

| | Value |
| --- | --- |
| Agents total / in scope | 56 / 27 |
| Agents already in the target shape | 1 (`eng-lead-technical-writing`, ~1,977 eager tokens) |
| Legacy mean eager load | ~28,798 tokens |
| `director-chief-of-staff` | ~41,649 tokens (largest) |
| `kai-engineering` mean | ~29,822 tokens |

**Where the eager tax actually lives**, across all 55 legacy agents:

| Source | Share |
| --- | ---: |
| 4 core skills — `work-coordination`, `asset-lifecycle`, `team-operating-rules`, `workspace-conventions` | **62%** |
| All other ~46 skills | 25% |
| Agent bodies | 13% |

**This sets the order: contracts before bodies.** Rewriting 27 agent bodies
addresses 13% of the load, and any body written before the contracts are split
must be written twice.

Top contracts by leverage (size × agents inheriting):

| Skill | Chars | Inheriting agents |
| --- | ---: | ---: |
| `kai-core-work-coordination` | 34,666 | 41 |
| `kai-core-asset-lifecycle` | 17,569 | 55 |
| `kai-core-team-operating-rules` | 15,897 | 55 |
| `kai-core-workspace-conventions` | 12,577 | 52 |
| `kai-core-fleet-observation` | 14,672 | **0** |

---

## Constraints that are real

- **30,000 characters per agent prompt — GitHub's cap, not ours.** Verified
  against GitHub's custom-agent documentation: over it, instructions are
  truncated or the agent fails to load. Keep this check and name it so its
  origin is unmistakable. It is also the argument *for* on-demand routing:
  identity plus every contract cannot fit in one body, so routing is the only
  shape that fits.
- **kai's own 20,000-character / 250-line body target is dropped.** Seven agents
  already exceed it, so it governs nothing. Re-derive a target from what
  refactored bodies actually need.

---

## Order of work

### 1. Settle the target shape *(in progress)*

- What replaces the eager `**Inherits:**` line.
- How the four heavy contracts decompose. Start with
  `kai-core-work-coordination`: 8,666 tokens across 41 agents, the single
  biggest lever.
- Decompose by **what an agent needs at one decision point**, not by topic. The
  unit is agent × task-path × contract, not a global always/situational label
  on a whole skill.

### 2. Split the contracts

The 62%. A contract an agent loads should be the part it needs, not a manual
that happens to contain it.

### 3. Rewrite the 27 bodies

Against the new contracts, in one shape, with routes at the instruction that
needs them — never hoisted into a manifest section, which would recreate the
eager block being removed.

### 4. Rewrite the gates for the single shape

Delete rather than teach a second dialect: `scripts/lib/inherits-block.txt`, the
assessor roster's `**Inherits:**` coupling, `requires_tools` line-scanning, the
migration baseline, and the identity-contract label itself.

**Keep exactly one new check:** proof that a declared route actually fires. With
on-demand routing a dead route is silent — the agent never loads the contract
and quietly does worse work, with nothing failing. That is the failure mode this
refactor exists to eliminate, and it is the one thing static analysis can catch.

---

## Corrections already made — do not reintroduce

Errors found and fixed during planning. Recorded so they are not repeated.

| Claim | Reality |
| --- | --- |
| `plugins/kai-core/scripts/` is a hand-maintained duplicate that has drifted | **False.** It is generated and gated by `pack-preview --check`. The apparent drift was CRLF normalization. No action needed. |
| A migration PR can change one agent body and nothing else | **False.** `release-guard.mjs` treats `plugins/` as behavior-sensitive, so any agent edit demands a version bump across five packs plus changelog and README. Batch the work; cut one release. |
| The assessor contract is independent of inheritance | **False.** `scripts/validate-plugin.mjs` reads `kai-core-no-self-remediation` off the literal `**Inherits:**` line for 11 agents, including `workflow-self-check`. Removing the line without rewriting the gate fails validation. |
| The 30,000-character cap is a kai rule | **False.** It is GitHub's host limit. |
| Route declarations are validated | **Partly false.** Any backticked skill mention currently counts as a route, while the firing-path parser requires an imperative form. Dead routes are possible today. |

---

## Open decisions

1. **How `kai-core-work-coordination` decomposes.** The lease/collision protocol
   is load-bearing for correctness and cannot be diluted; the rest may not need
   to travel with it.
2. **Whether the ownership model in `kai-core-team-operating-rules` shrinks.** It
   names 30 roles, 23 of which are duplicated in the director's own body.
3. **What replaces the missing-core guard.** Department packs can install without
   `kai-core`, and `plugin.json` has no dependency field to express it.
