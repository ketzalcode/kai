# Agent contract refactor — design

**Date:** 2026-09-04
**Scope:** 7 `kai-core` agents, 20 `kai-engineering` agents, the 4 heavy core contracts
**Status:** approved design, pending implementation plan

---

## Problem

Every kai agent declares one eager line naming the shared contracts it needs.
The host loads all of them on every invocation, whether or not the work touches
them. Measured across the 55 agents that still use that line, the mean load is
**~28,798 tokens before the agent reads its task**. The largest,
`director-chief-of-staff`, reaches ~41,649.

That budget is spent on contracts the agent will mostly not use, and it is
budget not spent on the work. GitHub's own guidance for custom agents is to keep
the always-loaded surface small and let detail load when it is needed; its
memory guidance states plainly that longer always-loaded files *"reduce
adherence"*. So this is a quality problem before it is a cost problem: an agent
cannot be made to reason better while most of its instruction budget is
committed before the task arrives.

### Where the weight actually is

| Source | Share of total eager load |
| --- | ---: |
| 4 core contracts — work coordination, asset lifecycle, operating rules, workspace conventions | **62%** |
| The other ~46 skills | 25% |
| Agent bodies | 13% |

Rewriting agent bodies alone would address 13% of the problem. **The contracts
are the lever**, and any body rewritten before they are split must be rewritten
again afterwards.

### The recurring defect

The same anti-pattern appears in at least four places: a central list of roles
that must be edited whenever a role is added, loaded by agents that never route
off it.

- `director-chief-of-staff` names 26 roles; 23 are already in a contract it
  loads on the same page.
- `director-executive-assistant` carries a 20-row routing table.
- The operating-rules contract names 30 roles, loaded by all 55 agents.
- The coordination contract hardcodes 27 per-role artifact paths, so a security
  role loads a brand role's output path on every run.

None of these is the routing surface. The host already routes on each agent's
`description`, which carries its own disambiguation (*"Not campaign demand gen
(...)"*). These lists are documentation that drifts, in a place that costs
tokens on every invocation.

---

## Goals

1. Cut the always-loaded surface so an agent's budget goes to its task.
2. One agent shape, so the shape is the contract.
3. Delete every central list nothing routes off.
4. Keep the safety and correctness properties that are real.

## Non-goals

- No behavioral test suite. None exists; this refactor does not build one.
- No staged migration, no dual mode, no compatibility labels.
- No change to the host's routing. Discovery stays the agent `description`.
- The other three department packs are out of scope for this pass.

---

## Decisions

| # | Question | Decision |
| --- | --- | --- |
| 1 | How does an agent declare the contracts it loads? | **Inline prose routes, strictly parsed.** Readable authoring, but an imperative form at a real decision point, enforced. |
| 2 | How do the heavy contracts decompose? | **By reader.** The contract boundary follows the authority boundary. |
| 3 | How are artifact paths expressed? | **Convention plus exceptions.** One stated convention; each role declares its own domain; only genuine exceptions remain central. |
| 4 | What happens when core is absent? | **Probe plus inline refusal.** Keep the presence probe; each agent states its own refusal where it routes core. |
| 5 | Where does role authority live? | **It mostly does not.** Keep universal human gates and each role's own boundary; delete the cross-role map. |

### Why decision 5 is a deletion

The 30-role ownership map exists to answer "who owns what". Nothing routes off
it — routing is the host's. Reading it, only two things are load-bearing, and
neither is an org chart:

- **Human gates.** Six clauses gate irreversible external actions on a person:
  only the operator accepts commercial terms, contacts prospects, accepts
  residual risk, spends or sends, and publishes. An agent taking any of those
  alone is a real harm, and nothing else prevents it.
- **Self-restraint.** Stay inside your own lane; an assessor does not repair
  what it just assessed, because a quietly fixed finding is a finding that never
  reproduces.

Both survive as short universal rules. The other 30 role descriptions do not.

---

## Target architecture

### The contract set

Decomposed by who needs the section, not by topic.

| Today | Becomes | Loaded by | Target |
| --- | --- | --- | ---: |
| work coordination (34.7k chars, 41 agents) | **acting** — verify before write, collision record, handoff packet, question/answer | every dispatched agent | ~4k |
| | **granting** — single grantor, lifecycle, recovery, dispatch duties, touch-set reconciliation, board | the director alone | ~14k |
| | **item record** — the record schema and field rules | anything writing an item | ~6k |
| | *removed* — the 27-path registry becomes one convention line; the durability rationale moves to docs | nobody at runtime | ~4k |
| operating rules (15.9k chars, 55 agents) | **operating rules** — universal restraint plus the human gates | every agent | ~3k |
| | *removed* — the 30-role ownership map | nobody | — |
| asset lifecycle (17.6k chars, 55 agents) | **producing** — the core rule, pre-dispatch declaration, universal metadata, revision and supersession | any agent producing an asset | ~7k |
| | **closing** — completion verdict and authority, freshness, placement and promotion, close transaction, closure sweep | completion authorities and the director | ~7k |
| workspace conventions (12.6k chars, 52 agents) | **paths** — resolution, private workspace, project publication, storage modes, run grammar, the agent checklist | any agent touching workspace state | ~6k |
| | **initiative layout** — initiative artifacts, coordination and closure, manifest | the director and initiative roles | ~5k |

The governing observation: **41 agents currently load the grant protocol, and
exactly one role can ever grant.** A worker needs to verify its own lease and
record a collision. It does not need to know how leases are issued, recovered,
or reconciled.

### The artifact path convention

The 27-entry path registry is replaced by one stated rule: an item's asset lands
at `.kai/state/initiatives/<slug>/artifacts/<domain>/<item-id>.md`, where
`<domain>` is declared by the producing role in its own body. Only genuine
departures stay in the contract — bundle directories that hold several files,
de-identified signal paths whose location carries a privacy meaning, and
incident reports that publish to a project path instead. Adding a role stops
requiring an edit to a core contract.

### The agent shape

```
frontmatter   name, description, tools (including skill), model
identity      what this role is; its single boundary; its profile
judgment      how it does the work
routes        "Invoke <contract> before writing durable state"
              imperative, at the decision point, never hoisted into a list
artifact      its own output path, by the stated convention
refusal       one line, in its own words, where it routes core
```

No eager contract line. No version label: with a single shape there is nothing
to distinguish, and a label invites a second dialect.

A hoisted list of routes is forbidden. Collecting routes into a manifest
section recreates the eager block this replaces, with worse ergonomics.

### Why prose routes need a strict parser

Route declarations are currently validated by treating any backticked skill
mention as a route, while the firing-path parser requires an imperative. The two
disagree, so a line saying a contract should *not* be used can satisfy
validation, and a route can be dead — the agent never loads the contract, and
nothing fails.

Under on-demand loading that failure is silent and produces exactly the outcome
this refactor exists to prevent: an agent doing lower-quality work for a reason
no one can see. One parser, requiring an imperative at a decision point, is the
single check worth keeping.

---

## Sequence

| # | Step | Rationale |
| --- | --- | --- |
| 1 | Split the four heavy contracts | 62% of the load; bodies written earlier would be written twice |
| 2 | Rewrite the 7 `kai-core` bodies, director included | core sets the pattern the departments copy |
| 3 | Rewrite the 20 `kai-engineering` bodies | mechanical once the shape is proven |
| 4 | Rewrite the gates for a single shape | remove the eager-line checks, the assessor roster's dependence on that line, tool-requirement line scanning, the duplicated dependency guards, and the migration baseline |
| 5 | One batched release | the release gate treats any shipped-surface change as a release; one bump covers the refactor |

A red build is expected during steps 1–4. Static checks are re-enabled and
rewritten in step 4, against the end state rather than the state being removed.

**The director migrates with core, not last.** Staged migrations put the highest-
blast-radius role last to gather evidence from the safer ones. A clean break has
no legacy fleet to stay compatible with, so that evidence is not available and
would not transfer. The director's split defines the acting/granting boundary
every other agent routes against, so it comes first, not last.

---

## Success criteria

**Measured.**

- Eager load per agent, before and after.
- Every agent body inside the 30,000-character host cap. This is GitHub's limit,
  not a kai target: over it, instructions are truncated or the agent fails to
  load. Two in-scope bodies are already close.
- Every declared route parses as a real imperative.

**Judged by the operator.** Run a small set of representative tasks — a director
dispatch, an assessor review, a builder change — against rewritten agents and
compare the output to today's. The accuracy claim belongs to the human, not to
the refactor.

**Explicitly not verified.** That no agent lost a rule it needed. A rewrite of 27
bodies can silently drop a constraint, and no automated check would catch it.
Mitigation is a per-agent record of what each body dropped and where it went,
reviewable independently of the diff.

---

## Risks

| Risk | Mitigation |
| --- | --- |
| A rewritten agent silently loses a rule | per-agent record of dropped content and its destination |
| A route is declared but never fires | strict imperative parser, added in step 4 |
| Bodies grow past the host cap while adding route prose | measured per agent; two in-scope bodies already need to shrink |
| The refactor stalls half-done, leaving two shapes | scope capped at two packs; the shape is not labelled, so a partial state is visibly wrong rather than quietly tolerated |
| Contracts are split too finely and routing prose costs more than it saves | split by reader, not by moment; four contracts, not fourteen |

---

## Out of scope, deliberately

- **Fleet observation contract.** Currently loaded by no agent. It is intended
  for use, so it is left untouched rather than removed, and wired up in separate
  work.
- The `kai-gtm`, `kai-product`, and `kai-personal` packs — the same treatment,
  after this pass proves the shape.
- The generated pack tree, which is already produced and gated correctly.
