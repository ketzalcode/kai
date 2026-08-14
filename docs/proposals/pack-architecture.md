# Proposal: pack architecture (`kai-core` + department packs)

**Status:** proposal — no code moved yet
**Relates to:** #29 (positioning / optional plugin packs)
**Depends on:** v0.50.0, which published the `kai-plugins` marketplace

---

## TL;DR

Splitting kai into a shared `kai-core` plus installable department packs is
**technically viable with zero file duplication** — the host resolves skills
across plugin boundaries. That was the load-bearing unknown, and it is now
measured.

It is **not** cheap. The host gives us composition but **no dependency
integrity**: a missing pack degrades silently, with no error. So the work is
not "move files into folders" — it is building the dependency guarantees the
host does not provide.

Recommendation: **phase it.** Trim discovery metadata first (a real win that
is independent of the split), prove the risky host semantics with a
throwaway two-pack preview, and only then move agents — one department at a
time, keeping the monolith authoritative until the preview passes.

---

## What was measured

All findings below are empirical, run against the real host on Windows with
an isolated `COPILOT_HOME`. They are not inferred from documentation.

| # | Question | Result |
| --- | --- | --- |
| 1 | Can a plugin reference agents outside its own directory? | **No.** `"agents": "../../shared/agents"` loads **zero** agents, silently. In-directory control loaded fine. |
| 2 | Can an agent in plugin A load a skill from plugin B? | **Yes.** Verified with a `["skill"]`-only agent that could not read disk. |
| 3 | Does that depend on B actually being loaded? | **Yes.** Negative control without B returned the failure sentinel. |
| 4 | How does a missing dependency fail? | **Silently.** No host error, no warning. The probe only spoke up because it was scripted to. |
| 5 | Are agents namespaced? | **Yes** — `provider:provider-agent, consumer:probe-consumer`, one flat list assembled from all loaded plugins. |
| 6 | What happens when two plugins provide the same skill name? | **Both are exposed, namespace-qualified** (`alpha:probe-skill`, `beta:probe-skill`). Not silent, not arbitrary. |
| 7 | Is there a dependency mechanism in `plugin.json`? | **None found.** A `"dependencies"` key is accepted and ignored. |
| 8 | Can `--plugin-dir` be repeated? | **Yes** (host help: "can be used multiple times"). |

**Finding 2 is what makes the whole design possible.** Without it, every pack
would need physical copies of the shared skills, plus a generator and
byte-identity CI to stop them drifting. That entire class of work is off the
table.

**Finding 4 is what makes it expensive.** `kai-core` being absent does not
produce an error — the agent simply proceeds without its operating contract.

### Discovery-metadata cost today

| Item | Size |
| --- | --- |
| 56 agent descriptions | ~7.4k tokens |
| 49 skill descriptions | ~6.1k tokens |
| **Total, present every session** | **~13.5k tokens** |

Skill descriptions are the larger half. That matters: a user who installs
`kai-core` + `kai-engineering` still pays full price for every verbose
description inside those packs. **Splitting does not fix oversized prose.**

### How porous are "departments"?

Against a candidate five-pack partition (core / engineering / product / gtm /
personal), covering all 56 agents:

| Measure | Value |
| --- | --- |
| Agent-to-agent references | 363 |
| That cross a pack boundary | **195 (54%)** |

54% looks fatal. Classifying those 195 by intent changes the picture:

| Kind | Count | Share |
| --- | ---: | ---: |
| Real runtime dispatch ("delegate to", "invoke") | **8** | 4% |
| Ownership boundary ("not yours — that's X") | 19 | 10% |
| Orientation prose (role taxonomy, "where you sit") | 168 | 86% |

**Hard cross-pack dispatch is rare.** The graph is dominated by org-chart
prose — and roughly a quarter of all cross-pack edges come from `core` alone,
concentrated in the two directors' role-taxonomy tables.

> Caveat: this classification is a keyword heuristic over the nearest
> preceding heading. Treat the 8 / 19 / 168 split as indicative, not exact.
> The direction is clear; the precise numbers are not load-bearing.

Skills partition far more cleanly. Six are inherited by agents in **all five**
packs — `team-operating-rules`, `workspace-conventions`, `work-coordination`,
`work-activity`, `peer-communication`, `no-self-remediation`. Those six are
precisely `kai-core`'s payload.

---

## Shape

```
NOW                          PROPOSED
 kai  (one plugin)            kai-core        contracts + onboarding
  56 agents                    ├── kai-engineering
  49 skills                    ├── kai-product
  ~13.5k tokens always         ├── kai-gtm
                               └── kai-personal
                              installed selectively, from kai-plugins

 shared skills:               shared skills:
   in the same plugin           in kai-core, loaded ACROSS the
                                plugin boundary — no duplication
```

---

## The central risk

> The host supports **composition** but not **dependency integrity**.

kai must supply the missing guarantees itself, and can only do so at prompt
level — which is a strong convention, not a hard boundary. Three concrete
consequences:

### 1. Silent contract loss (blocking, but bounded by "core is required")

An agent keeps its `**Inherits:** \`team-operating-rules\`` line while the
runtime supplies nothing. It runs, looks healthy, and ignores workspace
resolution, role boundaries, work claiming, and escalation.

**`kai-core` is a required dependency, not a choice.** It is never offered in
the selector; it rides along with every selection. Core depends on nothing,
everything depends on core. That makes core-missing an edge case rather than a
normal state — the same pattern any package ecosystem uses for a required
runtime.

It is not unreachable, though: a user can run
`copilot plugin install kai-engineering@kai-plugins` directly and bypass
onboarding entirely. So the state must still be handled, just not designed
around.

Two mitigations, in order:

1. A uniquely named `kai-core-contract-v1` skill returning a rigid marker,
   invoked as a **fail-closed preflight** written into each pack agent's own
   body (not into an inherited skill — that would be circular), pinned
   byte-for-byte in CI the way `inherits-block.txt` already is. Honest label:
   best-effort. The model can skip it.
2. A degraded-mode block shipped in every pack for when the preflight fails.

**The degraded block must be a refusal, not a fallback contract.** The
temptation is to have it mirror core's rules so agents keep working. That
recreates the duplication problem this whole design just escaped: a second copy
of the operating contract, in N packs, drifting from core silently and
invisibly, with the drift only surfacing as inconsistent behaviour.

Instead it states the *absence* of the contract and nothing else — roughly:

> You are running without `kai-core`. You have no coordination contract. Do
> single-shot work only. Do not claim work, take leases, or write workspace
> state. Tell the operator to install `kai-core`.

Because it restates no rules, it has nothing to drift from. It stays correct
for free as core evolves. And migration is trivial by construction: install
core later, the preflight passes, full behaviour resumes, nothing to change.

Precedent for the mechanics already exists in this repo — `inherits-block.txt`
is a canonical source duplicated into all 56 agents with a byte-for-byte CI
pin. The degraded block uses the same pattern: one canonical file under
`scripts/lib/`, copied per pack, pinned by CI.

### 2. Legacy collision (blocking)

If legacy `kai` and `kai-core` are both installed, both provide
`team-operating-rules`. Finding 6 means this surfaces as two visible,
qualified tools rather than a silent wrong-copy-wins — better than feared, but
an agent could still load the stale contract and pass its own preflight.

Mitigation: give core skills an owned-namespace prefix (`kai-core-*`) so
legacy `kai` cannot accidentally satisfy them. Plus a migration that uninstalls
legacy first — already required, since installing over a direct install leaves
**both** copies loaded.

### 3. Directors route to agents that may not exist (blocking)

`director-chief-of-staff` names 28 distinct roles; `director-executive-assistant`
names 20. A core-only install would ship a router whose majority of
destinations are not installed. Worse, chief-of-staff **writes leases before
dispatch** — a failed route could leave work claimed.

This is unresolved and gates the design. Either directors can reliably
enumerate the installed roster — which must be proven as a host contract, in
both CLI and cloud — or **directors do not belong in a minimal core** and
should ship as an optional `kai-orchestrator`.

---

## Does this deliver the stated goals?

| Goal | Verdict |
| --- | --- |
| Different projects install different departments | **Yes** — a real benefit, now that packs stay small and share contracts. |
| Core keeps communication consistent | **Yes, given core is required.** Core is never optional and never in the selector, so the shared contract is present by construction. The residual risks are a direct install that bypasses onboarding, a version-incompatible core, and an agent skipping its preflight — all handled, none of them the normal path. |
| Contribution is easier and less fragile | **Not yet proven.** Duplication is gone, which helps a lot. But cross-pack references, qualified agent IDs, contract compatibility, several marketplace entries, and supported-combination testing are all new. This holds only if tooling hides the mechanics. |

---

## Plan

### Phase 0 — trim discovery metadata (do regardless)

Budget agent descriptions to ~250 chars and skill descriptions to ~180, moving
ownership detail and examples into agent bodies and the generated catalog.
Recoverable: roughly 6–9k tokens per session, at low risk, with no
restructuring. Re-measure afterwards, so savings that were really about prose
are not later credited to the split.

### Phase 1 — two-pack preview, no roster move

Throwaway `kai-core-preview` plus one narrow pack. Test the things that can
kill the design: missing core, wrong core version, duplicate skill names,
legacy `kai` installed alongside, partial install, and the fresh-session
requirement. Monolithic `kai` stays authoritative throughout.

**Status: done.** See "Phase 1 results" below. Built by
`scripts/pack-preview.mjs`. Outcome: the preflight holds on real agents, and
skill-name collision was found to be load-order dependent — which forces an
owned-namespace prefix on core skills.

### Phase 2 — prove roster enumeration

Establish whether an agent can reliably obtain the exact qualified
installed-agent set. This decides where directors live. Do not skip it.

**Status: passed at small scale** (test E). Directors may stay in core, on the
condition that they resolve availability *before* claiming work. Still unproven:
a full 56-agent roster, and the cloud host.

### Phase 3 — incremental migration

Land the pack manifest format, cross-pack validator, contract preflight,
collision tests, compatibility model, and a migration doctor. Then move **one**
department at a time.

**Do not move 56 agents and 49 skills in one PR.** That builds the maintenance
system before proving the host semantics it depends on.

### Versioning

Lockstep for the preview, because it is simple and the broken `autoUpdate`
(upstream `github/copilot-cli#4465`) makes skew routine. Longer term, split
into a per-pack semver plus a separate core **contract version**, so a core
patch does not force every pack to release.

**The split ships as `1.0.0`.** It is the only thing reserved for kai's major:
the install surface changes and core skill names change, which is breaking in
the literal semver sense rather than merely a large refactor. Two rules follow —
groundwork stays on `0.x` however substantial, because a consumer's install
command has not changed; and `1.0.0` waits on the Phase 3 gates below, since the
number reads as a stability promise and the split's failure modes are still
partly unmeasured. Recorded in `docs/reference/plugin-structure.md` →
**What `1.0.0` is reserved for**.

### Onboarding

A skill is a prompt document — it cannot render a real checked multi-select or
an atomic transaction. Describe it honestly as a **guided installer**: show the
exact pack set and commands, get explicit confirmation, install core first,
verify after every step, stop on first failure, report partial state precisely,
and never claim rollback that was not verified. It cannot repair a missing core
in the current session, because plugins load at session start:

> Core installed. This session still does not have it loaded — start a new
> session before invoking pack agents.

---

## Open questions

- Does skill collision behaviour hold across install order, marketplace vs
  direct, and fresh sessions? Only `--plugin-dir` ordering was tested.
- Does macOS and the cloud host behave the same? All measurements were Windows
  CLI.
- Would upstream add plugin dependency declarations? Worth asking — it would
  remove the largest risk here.

---

## Phase 1 results — the two-pack preview

Built by `scripts/pack-preview.mjs` from the **live roster**, not from toy
fixtures: `kai-core-preview` (the 10 shared skills the pack inherits, plus a
`kai-core-contract-v1` preflight skill) and `kai-personal-preview` (the 9 real
personal agents with a fail-closed preflight injected into each body, plus the 3
skills only they use). Nothing was moved in the shipped plugin.

The pack composition is itself a finding: **core is bigger than the six
universal contracts.** A 9-agent personal pack pulls 10 skills from core,
because shared utilities (`generate-audio`, `web-evaluation`, `content-grounding`,
`web-content-extraction`) are inherited across departments just like the
operating contracts are.

| # | Test | Result |
| --- | --- | --- |
| A | Core present, contract 1 | Preflight fired, resolved across the plugin boundary, agent proceeded normally |
| B | **Core absent** | Agent replied with the exact refusal token and did nothing else |
| C | Core present, contract **2** | Refused — version skew detected |
| D | **Legacy `kai` + `kai-core-preview`, both providing `team-operating-rules`** | Agent bound to **`kai:team-operating-rules`** — the *legacy* copy — while its preflight passed |
| D2 | Same set, core listed first | Bound to `kai-core-preview:team-operating-rules` |
| E | Roster enumeration | Agent listed the exact qualified IDs of all installed agents, and correctly answered **NO** for an agent that was not installed |

### What these change

**The preflight works, and it works on the hard case.** Test B is the one that
mattered: a *real* agent, with its full tool grants, asked to "teach me how
binary search works" — something it could trivially have answered from memory.
It refused. The earlier evidence for this was a probe restricted to a single
tool, which proved much less.

**Skill collision is load-order dependent, and that is now blocking.** Tests D
and D2 differ only in the order the plugins were listed, and the agent bound to
a different copy of the operating contract each time. During migration, whether
a pack agent gets the new contract or a stale one would depend on load order the
user neither controls nor sees — and the preflight does **not** catch it, because
core is present and answers correctly while a *different* plugin supplies the
rules.

> **Decision: core skills must carry an owned-namespace prefix**
> (`kai-core-team-operating-rules` rather than `team-operating-rules`), so a
> legacy `kai` install cannot satisfy a pack agent's inheritance by accident.
> Renaming is what removes the ambiguity; ordering luck is not a mitigation.
>
> **Revised while executing it.** This decision was first recorded as
> *contract-versioned* names — a `-v1` suffix on every core skill. Measured,
> that is wrong: it makes every contract bump a rename of all 22 skills and
> ~1,000 mentions, so the version would be re-litigated in the most expensive
> identifier in the system. The prefix alone removes the collision. **Exactly
> one skill carries a version — `kai-core-contract-v1`, the preflight probe**,
> which exists to be version-pinned. The other names never change again.
>
> For the same reason there is **no taxonomy segment** in the name
> (`kai-core-<space>-<skill>`). Classification is the most volatile attribute a
> skill has, and the name is the most expensive place to keep it; it belongs in
> frontmatter, grouping the generated catalog. Forcing a four-way taxonomy onto
> the 22 core skills produced 12 genuinely arguable cases, because the axes are
> not parallel — normative force, subject matter, mechanism, and procedural
> shape are different questions about the same document.
>
> **Landed** in the monolith ahead of the split: 22 skill directories renamed,
> 345 inheritance references re-resolved, ~1,000 mentions rewritten. Doing it
> first means the split itself is a pure file move rather than a rename and a
> move in one unreviewable PR.

**Directors can stay in core — conditionally.** Test E answers the Phase 2 gate:
an agent *can* determine the installed roster and does not invent availability
for a missing role. So a director can build the available-role set before
routing. The condition is that it must do so **before** claiming work or writing
a lease, which `director-chief-of-staff` currently does not — it leases first.

Caveats on E: this is the model reading an injected tool list, not a structured
inventory API. It was tested with 9 pack agents, not 56, so truncation under a
full roster is unproven, and the cloud host was not tested at all.

---

## Phase 2/3 results — the full five-pack split, whole roster

`scripts/pack-preview.mjs --all` now materialises **all six plugins** from the
live roster: `kai-core-preview` (7 agents, 22 core skills + 9 unplaceable) plus
engineering (20), product (9), gtm (11) and personal (9). The partition is
enforced in the self-test: 56 of 56 agents assigned, no agent claimed twice, and
no skill provided by both core and a pack.

| # | Test | Result |
| --- | --- | --- |
| F | Enumeration at the **full 56-agent roster**, all six plugins installed | **All 56 listed**, correctly qualified. Nothing missing, nothing invented. |
| F2 | The model's own `COUNT=` of that same list | **Wrong, twice: 55 and 53**, while listing 56 both times |
| G | **Core alone**, asked for work only a department can do | Named `principal-security` as owner and reported `AVAILABLE=no` |
| H | Control: same question, engineering **installed** | `AVAILABLE=yes` |
| H2 | Core + engineering, asked for **GTM** work | `AVAILABLE=no` |

### What these change

**The Phase 2 gate is closed, and truncation was the wrong thing to fear.** At
56 agents across five plugins the host exposes every agent and the enumeration
is complete — verified by diffing the returned ids against the roster on disk,
not by eye.

**But a model-computed count is not trustworthy, and that is a design
constraint.** The same call that listed all 56 ids reported `COUNT=55` on one
run and `COUNT=53` on another. The list is reliable; arithmetic over it is not.

> **Decision: availability logic must test membership, never counts.** "Is
> `principal-security` in the installed set?" is sound. "Are all N roles
> present?", "how many engineers do I have?", or any quorum rule computed by an
> agent is not. This rules out a whole class of dispatch heuristics.

**Core alone is genuinely usable, and the control proves it.** G on its own
would be a false pass if the director simply always answered "no" — H is the
control that rules that out: the identical question returns `AVAILABLE=yes` once
engineering is installed, and H2 returns `no` for a department that is absent.
The director resolves against the real installed set rather than a fixed answer
or its own role taxonomy.

That is the strongest evidence so far for keeping directors in core. The
condition from Phase 1 stands unchanged: resolve availability **before**
claiming work or taking a lease.

### Still not verified

- macOS and the cloud host — everything above is Windows CLI.
- Collision under real **install** order, marketplace-vs-direct, and fresh
  sessions; only `--plugin-dir` order has been tested.
- The 9 skills no agent inherits (`demo-*`, `fleet-observation`,
  `onboard-to-codebase`, three `review-*`) are parked in core by the builder,
  which is a placeholder, not a decision.
## Availability resolution — how a director learns a role is missing

The Phase 2 tests showed core alone routes honestly. Making that a rule in
`director-chief-of-staff` surfaced three host behaviours that the design now
depends on, each found by a test that failed first.

**The check must precede the lease.** The agent previously listed "the host
cannot dispatch the required role" as a *stop condition* — reached after the
lease is written. Availability is now a runtime gate in selection.

**The item is not mutated.** Marking it `blocked` would record a session fact in
durable state, where it goes stale the moment the operator installs the pack.
The gap is reported, not stored.

**The roster must be read, not recalled.** This is the finding that cost the
most. Asked "is `principal-security` available?" with the engineering pack
*installed*, the director answered **no** — confidently, and with a plausible
account of having checked. The same session, asked to enumerate the agent types
its `task` tool accepts, listed `kai-engineering:principal-security` correctly.
The roster is visible; the model just doesn't consult it unless the instruction
says to. So the agent text names the `task` tool's accepted agent types as the
authoritative list.

**Match the role segment, not the id.** The host qualifies an installed agent as
`<plugin>:<role>`; items name the bare role. A whole-string comparison matches
nothing and reports every role missing.

**A test artifact worth recording.** The false negative reproduced only under a
rigidly formatted prompt ("reply with exactly three lines"). Under an
open-ended question the same agent consulted the roster and answered correctly
in both arms. Output-format pressure can suppress a verification step the
instructions require — so an availability check that must survive terse prompts
should not rely on the model choosing to look. A dispatch-probe that fails
observably would be stronger than introspection, and remains open.

### Both arms, real host, Windows CLI

| Arm | Installed | Result |
| --- | --- | --- |
| A | core only | declines, names `principal-security`, leaves the item, refuses `security-review` as a substitute |
| B | core + engineering | staffs it, dispatches by qualified id |

Arm B is the control: without it, an agent that always declines would pass.