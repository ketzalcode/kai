# Thread — area-plugins-optional-core-architecture

Append-only communication log mirroring
`kai/coordination/items/area-plugins-optional-core-architecture.md`. Never
edited after the fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-1858):** no agent in this session has a shell,
so `kai/initiatives/area-plugins/` cannot be created and the canonical
`artifact_target`
(`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-optional-core-architecture.md`)
cannot yet be written. That target is recorded and unchanged. Until one operator
`mkdir` runs, **this thread is the durable record of the architecture
decision** — a real canonical coordination path, not a substitute workspace.
When the initiative directory exists, the decision artifact is transcribed from
the DECISION packet below without re-litigation.

---

## DECISION 2026-08-27-1858 — principal-swe-architect

# Architecture Decision — optional `kai-core`: mode selection replaces the fail-closed preflight

**Source:** `kai/coordination/items/area-plugins-optional-core-architecture.md`
(version 3, `ready`, priority 10) under the binding scope of
`kai/coordination/threads/area-plugins-scope-brief.md` (BRIEF 2026-08-27-1839).
**Date:** 2026-08-27 18:58 local
**Run:** principal-swe-architect
**Decision (one line):** The injected fail-closed preflight becomes a
**three-way mode selector** — full / standalone / refuse — and the refusal is
not deleted but **narrowed to version skew and degraded mode**, with the
no-false-claim guarantee re-based from *prompt refusal* onto a *structural
withholding of the claim procedures at the partition level*.

`kai/coordination/ACTIVE.md` reads "No initiatives are active" and no north
star exists yet, so no initiative context was loaded. The BRIEF packet is the
binding scope, per the dispatch.

---

## Context

Read this session from `C:\src\kai`, by file:

- `scripts/lib/pack-plan.mjs` — `CONTRACT_SKILL='kai-core-contract-v1'`,
  `CONTRACT_VERSION='1'`, `REFUSAL='KAI-CORE-MISSING'`, `PREFLIGHT_BLOCK_REL`,
  `DEGRADED_BLOCK_REL`, `CORE_SKILL_PREFIX='kai-core-'`, `HOOKS_OWNER='core'`,
  `PACKS` (56 agents / 5 packs), `planPacks()`, `partitionErrors()`,
  `namespaceErrors()`, `providerCollisionErrors()`, `contractPinErrors()`,
  `guaranteeBlockErrors()`, `degradedBlockErrors()`, `coreContractLines()`,
  `hooksAssignmentErrors()`, `availabilityErrors()`.
- `scripts/pack-preview.mjs` — `materializePacks()`, `injectBlocks()`,
  `evaluatePreflight()`, `buildAll()`, `checkCommitted()`, and
  `GATES = partition | collision | partial-install | version-skew`.
- `scripts/validate-plugin.mjs:243-247, 312-314, 390-445` — the byte-pins.
- `scripts/lib/preflight-block.txt`, `degraded-block.txt`,
  **`inherits-block.txt`**.
- `hooks.json` — `subagentStart` / `subagentStop` -> `observe-subagent.mjs`.
- `scripts/workspace-doctor.mjs:107-184, 1042` — `.kai/manifest.json` is the
  workspace sentinel.
- All 56 `agents/*.agent.md` `**Inherits:**` lines; all 51 `skills/*/SKILL.md`.

### The blocked decision

Non-negotiable #4 says no area agent may require core to load. The injected
`preflight-block.txt` makes every one of the 51 non-core agents reply exactly
`KAI-CORE-MISSING` and stop when core is absent. Deleting that block is the
obvious move and it is wrong: `KAI-CORE-MISSING` is the only mechanical thing
between a core-less session and an agent that claims it took a lease. The
decision is *what carries the guarantee instead*.

### Two findings that changed the answer

**Finding 1 — the standalone contract already exists and already ships.**
`scripts/lib/inherits-block.txt` is byte-pinned into **all 56 root agent
bodies** (`validate-plugin.mjs:312`), and its second sentence is already the
core-absent fallback:

> *"If one cannot be loaded, these non-negotiables still bind you: resolve a
> durable target workspace root before creating state, never Copilot
> session-state or a temp directory; stay in your lane…; keep coordinated work
> claimed, evidenced, and handed off…; never call something `shipped` that a
> human has not deployed and verified; and escalate to `@operator` only for a
> decision no kai role owns."*

No new mechanism is needed for the operating floor. It needs **naming and one
clause amended** — the durable-root clause is exactly the contradiction the
packet flags (see #3).

**Finding 2 — `kai-core-*` is one prefix carrying three unrelated jobs.**
`planPacks()` sends any skill used by more than one pack, or by any core agent,
to `core`; `namespaceErrors()` then forces it to carry the `kai-core-` prefix.
So the prefix means *"provided by core"*, **not** *"is the operating
contract"*. Grounded split of the 24:

| Family | Members (grounded) | Standalone disposition |
|---|---|---|
| **Contract** — universal stance | `team-operating-rules` (all 56 agents), `workspace-conventions` (53), `scope-discipline`, `no-self-remediation` | Must survive core-absence -> carried inline by `inherits-block.txt` |
| **Claim** — durable-state machinery | `work-coordination`, `peer-communication`, `work-activity`, `definition-of-done`, `initiative-stewardship`, `fleet-observation`, `workspace-onboarding`, `decision-brief`, `executive-consultation`, `personal-agenda`, `proactive-scan`, `pulse-digest`, `pr-delivery`, `issue-analysis` | **Must NOT survive** — their absence *is* the new guarantee |
| **Capability** — shared craft | `web-evaluation`, `web-content-extraction`, `content-grounding`, `design-grounding`, `generate-audio` | Genuinely lost standalone -> **disclosed**, re-homing **deferred** |

The Claim family is the whole answer. In a core-less session those files are
not on disk. The agent does not possess the lease grammar, the handoff packet
format, the `shipped` gate, or the `.kai/manifest.json` minting procedure —
and `workflow-workspace-init`, the only agent that runs onboarding, is a core
agent that is not installed either. **That is a structural guarantee, not a
prompt-level one**, and it is what the relaxation is re-based onto.

---

## Diagram

**A. Boundary — what ships where, and where the seam moves.**

```text
                     BEFORE (1.0.4)                          AFTER (optional core)
  ┌──────────────────────────────────┐          ┌──────────────────────────────────┐
  │ kai-core  (HARD PREREQUISITE)    │          │ kai-core  (OPTIONAL UPGRADE)     │
  │ ┌──────────────────────────────┐ │          │ ┌──────────────────────────────┐ │
  │ │ CONTRACT family  (4 skills)  │ │          │ │ CONTRACT family  (4 skills)  │ │
  │ │ CLAIM    family (14 skills)  │ │          │ │ CLAIM    family (14 skills)  │ │  <-- pinned
  │ │ CAPABILITY fam.  (5 skills)  │ │          │ │ CAPABILITY fam.  (5 skills)  │ │      core-only
  │ │ kai-core-contract-v1 (probe) │ │          │ │ kai-core-contract-v1 (probe) │ │      by CLAIM_SKILLS
  │ │ hooks.json (fleet observer)  │ │          │ │ hooks.json (fleet observer)  │ │      in --gate partition
  │ └──────────────────────────────┘ │          │ └──────────────────────────────┘ │
  └───────────────▲──────────────────┘          └───────────────▲──────────────────┘
                  │ REQUIRED                                    │ OPTIONAL
   ═══════════════╪═══════════════════            ══════════════╪═══════════════════
     the seam ────┘                                 the seam ───┘  (same seam, now crossable)
                  │                                              │
  ┌───────────────┴──────────────────┐          ┌────────────────┴─────────────────┐
  │ kai-<area>                       │          │ kai-<area>                       │
  │  agents/ + area-local skills     │          │  agents/ + area-local skills     │
  │  injected: preflight  (REFUSE)   │          │  injected: mode-block  (SELECT)  │
  │            degraded   (REFUSE)   │          │            standalone-block      │
  │                                  │          │            degraded    (REFUSE)  │
  │  floor: inherits-block.txt       │          │  floor: inherits-block.txt       │
  │         (present, unnamed,       │          │         (NAMED standalone floor, │
  │          unreachable — the       │          │          reachable, +1 clause,   │
  │          refusal fires first)    │          │          size-budgeted)          │
  └──────────────────────────────────┘          └──────────────────────────────────┘
   core absent -> 0 of 51 agents usable          core absent -> 51 of 51 usable, 0 can claim
```

**B. Control flow — the block chain, before and after.**

```text
BEFORE                                    AFTER
──────                                    ─────
frontmatter                               frontmatter
**Inherits:** `kai-core-*` …              **Inherits:** `kai-core-*` …        (UNCHANGED)
> inherits-block.txt                      > inherits-block.txt                (+1 clause)
                                          
## Core preflight  (preflight-block)      ## Core mode  (mode-block)
  invoke kai-core-contract-v1               invoke kai-core-contract-v1
  ├ READY + contract:1 -> continue          ├ READY + contract:1 ──> FULL MODE
  ├ unavailable ───────> KAI-CORE-MISSING   ├ unavailable ────────> STANDALONE MODE   <-- RELAXED
  └ contract:N≠1 ──────> KAI-CORE-MISSING   └ contract:N≠1 ───────> KAI-CORE-MISSING  <-- PRESERVED
                                          
                                          ## Standalone mode  (standalone-block)   <-- NEW
                                            two honest paths + prohibition set
                                          
## Degraded mode  (degraded-block)        ## Degraded mode  (degraded-block)
  core answered, contract not in            core answered, contract not in
  session -> REFUSE                         session -> REFUSE                  (BYTES UNCHANGED)
```

**C. State — the three modes and the one-way upgrade.**

```text
                    ┌──────────────────────────────────────────────┐
   session start ──▶│  probe kai-core-contract-v1                   │
                    └───┬──────────────┬─────────────────┬──────────┘
                        │ absent       │ contract:1      │ contract:N≠1
                        ▼              ▼                 ▼
                 ┌─────────────┐  ┌──────────┐    ┌──────────────────┐
                 │ STANDALONE  │  │ FULL     │    │ REFUSE           │
                 │ • no state  │  │ • durable│    │ KAI-CORE-MISSING │
                 │   dir       │  │   root   │    │ (fail-closed,    │
                 │ • no claims │  │ • leases │    │  unchanged)      │
                 │ • no hooks  │  │ • hooks  │    └──────────────────┘
                 └──────┬──────┘  └──────────┘             ▲
                        │                                  │ core present but
     operator installs  │                       ┌──────────┴──────────┐
     kai-core           │                       │ contract not loaded │
                        ▼                       │ -> DEGRADED refusal │
                 ┌─────────────────┐            └─────────────────────┘
                 │ (session ends)  │   ✗ no in-session promotion
                 │ FRESH session   │   ✗ no import of prior temp files
                 │ -> FULL MODE    │   ✗ prior temp files are never evidence
                 └─────────────────┘
```

---

## Forces

1. **Load force (#4).** 51 of 51 non-core agents refuse today. Measure #1
   baseline is `0 of 4` department plugins usable standalone. The refusal buys
   its guarantee by making the product unusable — that trade is what the
   operator settled.
2. **Claim force (#6, binding reframing).** A running agent with no contract can
   assert "I took the lease / I handed off / this shipped." Nothing at runtime
   stops a sentence. Whatever replaces the refusal must make the *procedure*
   unavailable, not merely ask the model not to use it.
3. **Circularity force.** An agent that cannot reach core cannot reach a skill
   that tells it what to do about core. Already stated verbatim at
   `pack-preview.mjs` (~line 90). This kills "ship a `kai-standalone-contract`
   skill in every area" outright.
4. **Single-provider force (#8).** `providerCollisionErrors()` +
   `namespaceErrors()` make duplicate providers a build failure. Any design
   that vendors core skills into areas is red on arrival.
5. **Skew force.** A *skewed* core is **present**: its coordination skills load
   and may be wrong. Standalone's safety rests entirely on those files being
   absent. Skew and absence are therefore **not the same case** and must not
   get the same disposition.
6. **Drift force.** `degradedBlockErrors()` exists because an affirmative
   restatement of the contract silently drifts from it. Any new block must be a
   prohibition set, not a second copy of core.
7. **Identity force (#12, PM ordering ruling).** This milestone must create,
   rename, and retire **zero** plugin identities. Anything requiring a new
   plugin or a public skill rename is out of this milestone by construction.
8. **Honesty force (#5, #7).** Two paths, never a silent third; temp state is
   never presented as durable, never promoted, never counted as evidence.
9. **Nag force.** A one-shot "what's a good deadlift cue?" must not be
   interrupted by an install pitch, or the standalone path is worse than the
   refusal it replaced.

---

## Options considered

| # | Shape | Cost | Verdict |
|---|---|---|---|
| **0** | **Do nothing.** Keep the refusal. | Measure #1 stays at 0/4. | **Rejected** — contradicts settled direction #4. |
| **1** | **Delete the preflight.** | Free. Kills F2 outright: no mechanical barrier to a false claim, and skew (F5) silently fails open. | **Rejected** — the trust regression the BRIEF names. |
| **2** | **Ship a `kai-<area>-standalone-contract` skill in every area.** | Violates F3 (circularity: a skill can be missing too) and F4 (14 areas × one contract = the duplication #8 forbids; `namespaceErrors` fires the moment it is `kai-core-*`-shaped). | **Rejected.** |
| **3** | **Vendor the Contract-family skills into every area.** | Two providers per skill -> `providerCollisionErrors` + `namespaceErrors` red. Would need renaming 4 public skill IDs and re-planning the partition. Breaks F4 and F7. | **Rejected.** |
| **4** | **New shared `kai-base` plugin below every area.** | Structurally clean; makes core-the-contract and core-the-coordination separable. **Mints a new marketplace identity** -> violates F7 and the settled area set; operator boundary. | **Rejected for this milestone.** Recorded as the natural home if the Capability-family deferral ever unparks. |
| **5** | **Mode selection: reshape the probe's dispositions; name the existing inline floor; re-base the guarantee on the Claim-family partition.** | One new block, one reshaped block, one amended byte-pinned file, four constants, two gate arms. Zero new providers, zero new identities, zero duplicated contracts. | **CHOSEN.** |

Option 5 wins on F3/F4/F7 simultaneously — it is the only shape that adds no
provider and no identity, and it is the only one that turns F5 into a *feature*
(skew keeps its refusal) rather than a loose end.

---

## Decision

- **Disposition: Reshape.** (With **Endorse** on `degraded-block.txt`,
  `hooks.json` ownership, and the single-provider partition; **Defer** on
  Capability-family re-homing and the refusal-token rename.)

The current shape is *actively causing* the problem on the table — 0/4 areas
usable — so this is Reshape now, not Defer. The seam does not move: core still
owns the contract and the coordination machinery, areas still own their agents
and local skills. What changes is that **the seam becomes crossable in one
direction only**: an area may run without core, but the things core owns do not
become reachable, imitable, or claimable by doing so.

### 1. What replaces the injected fail-closed preflight

| Artifact | Disposition | Detail |
|---|---|---|
| `scripts/lib/preflight-block.txt` | **Retired, replaced** | -> `scripts/lib/mode-block.txt`. Same probe, same skill, same version pin, **three** dispositions instead of two. Old file deleted in the same PR that adds the new one. |
| `scripts/lib/degraded-block.txt` | **Unchanged, byte for byte** | Its case — *core answered and is compatible, and its contracts are still not in the session* — is still reachable and still unsafe. Only its entry condition is renamed (reached from *full mode*, not from *preflight passed*). `degradedBlockErrors()` unchanged. |
| `scripts/lib/standalone-block.txt` | **New** | The two honest paths + the prohibition set. Byte-pinned identically; linted by a new `standaloneBlockErrors()` modelled on `degradedBlockErrors()`. |
| `scripts/lib/inherits-block.txt` | **Amended (one clause)** | Promoted from incidental hedge to the **named standalone contract floor**. See #3. Stays byte-pinned in all 56 root bodies. |
| `CONTRACT_SKILL` / `CONTRACT_VERSION` | **Unchanged** | The probe is still required. Its job changes from *gate* to *mode selector*: it is the only mechanical way an area agent can know which mode it is in. |
| `REFUSAL = 'KAI-CORE-MISSING'` | **Retained; trigger narrowed** | Fires on **version skew** (F5) and on **degraded mode**. No longer fires on absence. |
| Byte-pins (`--check`, `guaranteeBlockErrors`, `contractPinErrors`) | **Retained, retargeted** | Three blocks instead of two; pins are strictly *more* load-bearing, not fewer. |
| Core-agents-forbidden rule | **Retained, generalised** | A core agent carries **none of the three** blocks. Mechanical by pack *kind*, not by agent name — so whichever pack an agent lands in under the taxonomy split, its block set follows automatically. |

**The probe's three answers and what each authorises:**

| Probe returns | Mode | Authorises |
|---|---|---|
| `KAI_CORE_READY` + `contract: 1` | **full** | Everything, exactly as today. Never mentioned to the user. |
| skill unavailable / no marker / no `contract:` line | **standalone** | Answer the request; write only where the user named. **Not** authorised: leases, handoffs, coordination records, initiative artifacts, review records, fleet claims, `shipped`. |
| marker present, `contract: N ≠ 1` | **refuse** | Nothing. Reply exactly `KAI-CORE-MISSING`, stop. **Unchanged.** |

The third row is the load-bearing preservation: an incompatible core is
*installed*, so its Claim-family skills are on disk and will load. The
structural argument that makes standalone safe does not hold, so the total
refusal stays.

### 2. The two honest paths — where, when, and the anti-nag rule

- **Where:** `standalone-block.txt`, **injected into every generated area agent
  body** by the existing `injectBlocks()` path. **Not** a new inheritable skill
  — F3 forbids it, and the codebase already documents that reasoning. **Not**
  both: a second copy in a skill is a second truth about one contract.
- **When:** exactly twice-bounded, and both bounds are lintable:
  1. **Once per session, on the first reply**, in **one sentence** naming the
     mode and the upgrade — nothing more. Never repeated.
  2. **Again only when the request itself asks for something standalone cannot
     do** (a claim, a lease, a handoff, a coordination or initiative artifact, a
     `shipped` assertion, fleet visibility). Then the agent names the *specific*
     unavailable capability and offers the install, once, and either does the
     part it honestly can or stops.
- **Anti-nag:** a request that touches none of the disclaimed capabilities gets
  the one-sentence mode line and then a normal answer. `standaloneBlockErrors()`
  asserts the block carries both an explicit `once` instruction and an explicit
  "do not repeat" prohibition, so the restraint is pinned rather than hoped for.

The one-sentence line is the honest minimum and is not negotiable downward: a
user must know which mode produced an answer before deciding whether to trust
it as recorded work.

### 3. Standalone state contract — and the workspace-conventions reconciliation

**Ruling: standalone mode has no state directory by default.** Stricter than
"temp only", and it is the smallest invariant that removes workspace
impersonation entirely:

> **Standalone never writes state whose location it chose.**

- Files the user explicitly asked for go where the user said. That is output,
  not state.
- When a task genuinely needs scratch, it goes to
  **`<os-tmp>/kai-standalone/<session-stamp>/`** (`%TEMP%\kai-standalone\…` on
  Windows), and the agent **announces the absolute path** in the same reply, so
  nothing is written somewhere the user cannot find.
- **Never** under the user's repository or cwd. **Never** a path segment named
  `.kai`. **Never** a `manifest.json`. **Never** `kai/coordination/**`,
  `kai/initiatives/**`, or `kai/library/**`.

**Disclaimer set** (each a separate prohibition line, each asserted present by
`standaloneBlockErrors()`): no durable coordination · no fleet visibility · no
leases · no handoffs · no shipped-state claims. Two more follow from the same
force and are named explicitly rather than folded in: **no initiative
artifacts** and **no review or approval records**.

**The `kai-core-workspace-conventions` contradiction — reconciled.**
The packet is right that a direct contradiction is stated. It is narrower than
it looks, and it lives in one file:

- The **skill** (`SKILL.md:29-30`) scopes its prohibition precisely: *"Copilot
  session-state, OS temp directories, and incidental agent cwds are never silent
  roots **for coordinated or initiative work**."* Standalone mode is, by
  construction, neither — it has no items, no leases, no initiatives. The skill
  also already carries an ephemeral escape (`SKILL.md:38-40`). **The skill is
  not in conflict and is not amended.**
- The **compressed restatement** in `inherits-block.txt` drops the qualifier:
  *"resolve a durable target workspace root before creating state, never Copilot
  session-state or a temp directory."* Unqualified, that forbids standalone
  mode. **This is a summarisation defect in a byte-pinned file, not an
  architectural conflict**, and the fix is one clause in one file:

  > *"…in full mode, resolve a durable target workspace root before creating
  > coordinated or initiative state, never Copilot session-state or a temp
  > directory; in standalone mode create no such state at all…"*

- **Residual, named:** the skill's ephemeral escape points at `<cwd>/.kai/runs/`,
  a path standalone must **not** use (it mints a half-workspace under `.kai/`).
  The two never meet — that skill is core-provided, so it is not loaded in
  standalone, and standalone does not exist when core is present. **Trigger that
  reopens this:** any change that makes `kai-core-workspace-conventions`
  reachable in a core-less session.

**The structural half of this guarantee** (the part that is not text): minting a
canonical workspace requires `kai-core-workspace-onboarding`, run by
`workflow-workspace-init`. **Both ship only in core.** In standalone the
procedure and the agent that runs it are equally absent. *Derived constraint on
the taxonomy record: those two must remain co-located in whichever pack provides
durable workspace capability — which is `core` by definition. Membership
decisions remain the taxonomy record's; this is a seam constraint on them.*

### 4. The upgrade transition

- **Activation:** installing core activates full mode **in a fresh session
  only.** The host resolves plugins at session start; a mid-session install is
  not observable, and even if it were, the first half of that session ran
  without the contract. No in-session promotion, ever.
- **Prior temp files: left in place.** Not discarded (user-hostile — they may
  want the file), not imported (implies durability and builds the promotion path
  #7 forbids).
- **How the agent may describe them:** only as *"a file from a previous
  standalone session at `<absolute path>`, which was never coordinated state."*
  It is never cited as prior work, never counted as evidence, never used to
  satisfy a done, review, or acceptance requirement, and never referenced from a
  coordination record.
- **Import path: deliberately out of scope, and stronger than deferred.** An
  import is precisely the retroactive promotion non-negotiable #7 forbids and
  sits inside the BRIEF's `deferred` "durable state for standalone mode",
  unparked only by operator boundary #7. **I do not unpark it.**
- **CI-assertable:** `standaloneBlockErrors()` asserts a prohibition on
  retroactive promotion; `contractPinErrors()` asserts the full-mode path
  contains no instruction to read a standalone scratch root.

### 5. Composability with several areas and no core

- **Unique skill IDs / exactly one provider: unchanged, and untouched on
  purpose.** Nothing in this decision adds a provider or an emitter. That is the
  single strongest reason options 2 and 3 were rejected —
  `providerCollisionErrors()` and `namespaceErrors()` are what stop the
  tempting bad fix ("just vendor the core skills"), and they keep doing it.
- **Generated-root determinism: unchanged.** `materializePacks()` still sorts
  keys, normalises LF, copies bodies verbatim from root, and `--check` still
  proves byte parity. The committed tree changes in *content* (every non-core
  agent body), not in *shape*.
- **`hooks.json`: stays core-only. Endorse — this is already right.**
  Forces: the hook is `subagentStart`/`subagentStop` -> `observe-subagent.mjs`,
  i.e. it *is* the fleet observer. Fleet visibility is exactly what standalone
  disclaims (#6). Two owners = double-fire per subagent; no owner = never runs.
  So the correct disposition is the current one, and its consequence is
  coherent rather than accidental. **Replacement guarantee for its silent
  absence:** it is no longer silent — `standalone-block.txt` names the loss of
  fleet visibility as one of its five pinned disclaimers.
  `hooksAssignmentErrors()` unchanged; `HOOKS_OWNER` is plugin-level, so it
  survives the taxonomy split untouched.
- **The `**Inherits:**` crux — the concrete answer.** Three sub-rulings:
  1. **The `**Inherits:**` line itself is UNCHANGED.** It is the truth about
     full mode, and it is the *input to `planPacks()`* — editing it re-plans the
     partition, which is a taxonomy change this milestone must not make (F7).
  2. **The inherits *directive* becomes explicitly conditional** — it already
     is (*"If one cannot be loaded, these non-negotiables still bind you…"*).
     This decision names that sentence the **standalone contract floor**, adds
     the one standalone-state clause from #3, and pins a size budget on it
     (`INHERITS_FLOOR_MAX`, modelled on `DEGRADED_BLOCK_MAX = 1200`) so it can
     never grow into a second copy of core (F6).
  3. **Areas vendor nothing. No contract is duplicated across packs.** The
     Contract family stays core-provided; standalone runs on the inline floor.
     The **Capability** family (`kai-core-web-evaluation`,
     `-web-content-extraction`, `-content-grounding`, `-design-grounding`,
     `-generate-audio`) is genuinely unavailable standalone — a real reduction
     in rigor for e.g. `persona-professional-nutritionist`, which inherits
     `kai-core-web-evaluation` and `kai-core-no-self-remediation` and would
     otherwise lose them without saying so. **Disposition: disclose, defer
     re-homing.** `standalone-block.txt` carries one honest line — *the shared
     grounding and source-evaluation skills ship with `kai-core`* — so the loss
     is stated rather than silent.
     **Deferral trigger:** re-home the Capability family out of the `kai-core-*`
     namespace only when (a) the area set has stopped moving after
     `migration-complete`, **and** (b) there is evidence a standalone area is
     materially wrong without one. It is deferred because it costs a **public
     skill-ID rename** across installed plugins — expensive to reverse, and F7
     forbids it in this milestone. Option 4 (`kai-base`) is its natural home if
     it ever unparks; that is an operator call, not mine.

### 6. Gate dispositions

| Gate / error family | Disposition | What it asserts afterwards |
|---|---|---|
| `--gate partition` | **Modified — extended** | Everything today (agent in exactly one pack; skill exactly one provider; every override still places something; `namespaceErrors` both directions; `availabilityErrors` on `DISPATCHING_ROLES`) **plus** the new backbone: every skill in `CLAIM_SKILLS` is provided by `core` and by no area, and `workflow-workspace-init` + `kai-core-workspace-onboarding` are co-located in `core`. This is where the no-false-claim guarantee is mechanically anchored. |
| `--gate collision` | **Unchanged** | Two packs never emit one id. Assertion identical — but far more load-bearing: it is what makes "just vendor the core skills into the area" a red build rather than a tempting shortcut. |
| `--gate partial-install` | **Modified — second arm added** | **Arm A (unchanged):** area + core, nothing else — every reference resolves, every invoked script travels with its pack, `hooks.json` has exactly one owner, `guaranteeBlockErrors` holds. **Arm B (new): area ALONE, no core** — (i) no generated area agent body references a file or script that ships only in core; (ii) every area agent carries exactly one mode block, one standalone block, one degraded block, contiguous and in that order; (iii) `hooks.json` is absent and that absence is named in the standalone block; (iv) every skill the area's agents can actually reach ships in the area; (v) the materialised area tree contains no `.kai`, `kai/coordination`, `kai/initiatives`, or `manifest.json` path. **Arm B is the gate that makes measure #1 provable** — today it is unprovable because the arm does not exist. |
| `--gate version-skew` | **Modified — one arm inverted, two preserved, one added** | `contractPinErrors()` unchanged in kind, retargeted at `MODE_BLOCK_REL`; the pinned literal `"Do not load or apply any inherited skill until this preflight passes."` is replaced by the mode-selection literal (the block no longer overrides load order — it decides which set loads). `evaluatePreflight()` -> `evaluateMode()` returning `{ mode: 'full' \| 'standalone' \| 'refused', reply }`. **Arms:** `ready` -> `mode === 'full'` (**unchanged**); `skew` (`--contract 2`) -> `reply === REFUSAL` (**unchanged — this is the preserved fail-closed**); `no-core` -> **inverted**, now asserts `mode === 'standalone' && reply !== REFUSAL`; **new `partial-core` arm** — core present, probe answers `contract: 1`, a Claim-family skill absent -> degraded refusal. |
| `--check` | **Unchanged in kind** | Still byte-parity of the committed tree against the generator. The tree's *content* changes wholesale (51 agent bodies), which is precisely what `--check` exists to make reviewable. **Constraint:** the block swap and the regeneration land in the same PR, or `--check` is red. |
| `contractPinErrors` | **Modified** | Same three-way pin (constant ↔ block prose ↔ probe body), retargeted at the mode block; one pinned literal swapped as above. Still the check that catches the one failure a green build can otherwise ship. |
| `guaranteeBlockErrors` | **Modified** | Three blocks, not two. Order `mode -> standalone -> degraded` is the contract: mode selects, standalone governs the absent case, degraded governs the present-but-unloaded case. Exactly one copy of each; contiguous; immediately after the inherits directive; **core agents carry none of the three**. |
| `degradedBlockErrors` | **Unchanged — and generalised** | Same rules on the same bytes. A sibling `standaloneBlockErrors()` reuses them (must name `` `kai-core` ``; may only refuse, prohibit, or offer the one remedy; must **not** carry the `REFUSAL` token; must **not** state a `contract:` version; size-budgeted; must not restate a core contract line via `coreContractLines()`) **plus** new required-clause assertions: exactly one "install `kai-core`" path, exactly one "continue in standalone mode" path, one prohibition per pinned disclaimer, the `once` instruction, the do-not-repeat prohibition, the no-retroactive-promotion prohibition, and the four forbidden path literals. |
| `availabilityErrors` | **Unchanged** | Its rule — role availability is decided by roster *membership*, never by a count — is already exactly right for standalone. `DISPATCHING_ROLES` is core-only today; **if the taxonomy moves a dispatching role out of `core`, that record re-evaluates this.** Not pre-empted here. |
| `providerCollisionErrors` | **Unchanged** | Load-bearing for the same reason as `--gate collision`. |
| `hooksAssignmentErrors` | **Unchanged** | Exactly one owner; owner stays `core`. Its "assigned to no pack" arm still fires if anyone tries to make hooks optional by removal. |
| `namespaceErrors` | **Unchanged** | Now doing double duty: it is what forbids an area from providing `kai-core-web-evaluation` as a shortcut. |
| `manifestParityErrors` / marketplace consistency | **Unchanged** | Lockstep versions; zero identities created, renamed, or retired in this milestone. |

**Nothing is retired without a replacement.** `preflight-block.txt` is the only
retirement, and its guarantee is redistributed across `mode-block.txt` (skew
refusal preserved), `standalone-block.txt` (prohibition set), `CLAIM_SKILLS` in
`--gate partition` (structural withholding), and `--gate partial-install` arm B
(filesystem proof).

### The fail-closed relaxation ledger (binding BRIEF requirement)

| # | What is relaxed | Replacement guarantee | Enforced by |
|---|---|---|---|
| **R1** | An area agent no longer refuses when core is **absent**. | **(a) Structural:** the procedures for leases, handoffs, activity, done/`shipped`, initiatives, fleet, and workspace minting ship **only in core** — a core-less session does not possess them, and `workflow-workspace-init` is not installed either. **(b) Textual, pinned:** `standalone-block.txt`'s prohibition set. **(c) Filesystem:** no state whose location the agent chose; no `.kai`, no `manifest.json`, no `kai/coordination\|initiatives\|library`. | (a) `--gate partition` (`CLAIM_SKILLS`) + `--gate collision`; (b) `standaloneBlockErrors()` + `guaranteeBlockErrors()` byte-pin; (c) `--gate partial-install` arm B |
| **R2** | The mode block no longer says *"Do not load or apply any inherited skill until this preflight passes."* | Mode selection decides **which** set loads. The degraded refusal still covers "core present, contract not in session" **byte-for-byte unchanged**, and a new `partial-core` skew arm proves it fires. The inherits directive's fallback becomes the **named, size-budgeted** standalone floor. | `contractPinErrors()`, `degradedBlockErrors()`, `--gate version-skew` `partial-core` arm, `INHERITS_FLOOR_MAX` |
| **R3** | `--gate version-skew`'s `no-core` arm no longer asserts `reply === REFUSAL`. | It asserts the **positive** property instead: `mode === 'standalone' && reply !== REFUSAL`. The `skew` arm's refusal is preserved verbatim. Coverage goes from 3 arms to 4. | `--gate version-skew` |
| **—** | **Not relaxed, explicitly:** version-skew refusal · degraded refusal · exactly one provider per skill · exactly one `hooks.json` owner · core's `kai-core-*` namespace · byte-parity `--check` · lockstep versions · core-agents-carry-no-blocks · roster-membership availability. | | |

### 7. Sequencing within milestone `optional-core-contract`

Five PRs. Each is independently shippable, individually revertible, and
lockstep-versioned. **Zero plugin identities are created, renamed, or retired
anywhere in this sequence** — so it lands cleanly before `surface-rename` and
before `area-taxonomy-split`, exactly as the PM ruled.

| PR | Change | Why it is separable | Revert |
|---|---|---|---|
| **1 — floor** | Amend `scripts/lib/inherits-block.txt` (qualify the durable-root clause, add the standalone-state clause); update the verbatim directive in all 56 root agent bodies; regenerate. Add `INHERITS_FLOOR_MAX`. | **Zero behaviour change when core is present**, and the refusal still fires when it is absent. One block, 56 mechanical sites, already CI-enforced for presence. | Revert one file + regenerate. |
| **2 — guarantee before behaviour** | Add `CLAIM_SKILLS`, extend `--gate partition` to assert core-only ownership + onboarding co-location. Add `standaloneBlockErrors()` (unused). | Asserts a property that **already holds today**, so it lands green and cannot regress. Ships the mechanism *before* the relaxation that needs it. | Revert the gate extension. |
| **3 — mode selection** *(atomic by necessity)* | Add `mode-block.txt` + `standalone-block.txt`; retire `preflight-block.txt`; add `MODE_BLOCK_REL` / `STANDALONE_BLOCK_REL`; `guaranteeBlocks()` returns three; update `guaranteeBlockErrors` + `contractPinErrors`; `evaluatePreflight` -> `evaluateMode`; invert the `no-core` arm; add the `partial-core` arm; regenerate. | The block swap and the gate inversion **cannot** be split — either alone is red. This is the one large diff, and PR-2 already forbids the wrong fix for anything it breaks. | Revert two blocks + constants + regenerate. Restores the refusal exactly. |
| **4 — standalone proof** | `--gate partial-install` arm B. | Proves measure #1 mechanically. Independently valuable and independently revertible. | Revert the arm. |
| **5 — surface** | `docs/getting-started.md`, `docs/reference/plugin-structure.md`: the two modes and the upgrade. `workspace-doctor`: report a core-less run as **`standalone`**, not "not onboarded" (today it errors — a false alarm for a legitimate standalone user). | Doc/UX only; nothing else depends on it. | Revert. |

Ordering logic: **floor -> guarantee -> behaviour -> proof -> surface.** The
mechanical guarantee (PR-2) is in place before the relaxation that depends on it
(PR-3), so there is never a commit in which core is optional and the claim
surface is unpinned.

### Domain work this implies

- **`principal-swe-infra`** — owns PRs 1–4: the generator, the block files, the
  constants, the gate arms, `standaloneBlockErrors()`, `CLAIM_SKILLS`, and the
  regeneration. The *how* is theirs.
- **`principal-technical-writer`** — owns PR-5's docs.
- **`principal-swe-manager`** — sizing and sequencing the five PRs into
  releases. This record fixes their **order and atomicity constraints**, not
  their scheduling.
- **`principal-product-manager`** — scope-acceptance on this record, and the
  final wording of the two honest paths (it is user-facing copy under
  non-negotiable #5, and the honesty budget is a product judgment, not mine).
- **`area-plugins-taxonomy-decision` (sibling, running now)** — inherits two
  seam constraints, **not** membership rulings: (a) block sets are mechanical by
  pack *kind*, so any agent leaving `core` acquires all three blocks exactly
  once, correctly, on its first move — the acquire-then-strip flip the PM
  identified is removed by contract-first ordering; (b)
  `workflow-workspace-init` and `kai-core-workspace-onboarding` stay
  co-located in the pack that provides durable workspace capability. Agent
  membership remains entirely theirs.

### What stays the same

`planPacks()` · every `**Inherits:**` line · `degraded-block.txt` bytes ·
`CONTRACT_SKILL` / `CONTRACT_VERSION` · the `KAI-CORE-MISSING` token ·
`HOOKS_OWNER = 'core'` · `CORE_SKILL_PREFIX` · `PACKS` / `PACK_ORDER` /
`SKILL_OWNER_OVERRIDES` / `PACK_RUNTIME_DEPENDENCIES` · `PACKS_DIR` ·
the marketplace name · all five plugin identities · lockstep versions ·
root `agents/` + `skills/` as the single source of truth.

### Reversibility

**Cheap.** No identity is minted, renamed, or retired; no public skill ID
changes; no data model moves. Every PR reverts to the prior byte-identical
committed tree by reverting its own files and regenerating. If the dual-path
contract is wrong, PR-3 reverts and the fail-closed refusal returns exactly as
it is today, on the same five identities.

**Consequence if wrong:** an area agent runs core-less and asserts a durable
outcome it did not produce. Detection is a user reading a claim and finding no
record. Blast radius is one session; there is no persistent corruption, because
standalone writes nothing whose location it chose.

**The one expensive-to-reverse thing in the neighbourhood** — re-homing the
Capability family out of the `kai-core-*` namespace — is exactly what is
**Deferred**, for that reason.

---

## Critical-boundary call

**No critical operator boundary is tripped by this record. Every open point is a
reversible engineering call, and I have made it.**

**TLDR:** BRIEF boundary #1 fires only *"if the no-false-claim guarantee cannot
be enforced by CI and must rest on prompt text alone."* It can be, and it does
not. Two of the three replacement mechanisms are **structural, not textual**:
the procedures for claiming durable state ship only in `kai-core`
(`CLAIM_SKILLS`, `--gate partition`), and the ability to mint a canonical
workspace requires a skill *and* an agent that are both core-only. In a
core-less session the agent does not have the lease grammar, the handoff packet
format, the `shipped` gate, or the onboarding procedure. That is withheld
capability, not a request for good behaviour. Boundary #1 is **not tripped**.

Boundary #7 (durable standalone state) is **not unparked**: I ruled *against*
an import path, which keeps standalone stateless by default.
Boundary #6 (core coherence) is **untouched** — no agent moves in this
milestone.
Nothing under `kai/initiatives/pack-split/**` is read or modified (boundary #8).

**The residual I am naming rather than accepting.** The guarantee's *shape*
changes and the PM should see it stated plainly at scope-acceptance:

```text
  TODAY                                    AFTER
  ─────                                    ─────
  space of possible outputs                space of possible outputs
  when core is absent:                     when core is absent:

    { "KAI-CORE-MISSING" }                   { any honest answer }
             │                                        │
    false-claim surface: EMPTY               false-claim surface: NON-EMPTY
    (by construction)                        but the claim PROCEDURES are
             │                               absent from disk, and the
    cost: 0 of 4 areas usable                prohibitions are byte-pinned
                                                      │
                                             cost: a model that ignores its
                                             own prompt can still type a
                                             false sentence — which is
                                             equally true of today's refusal
```

Today's guarantee is total because the permitted output set is a single string.
After the change it is non-empty, so "was that claim false?" becomes a judgment
over free text that no CI can decide. Both regimes are behavioural at the point
of utterance — today's refusal is *also* prompt text, and a model that ignores
`"reply exactly KAI-CORE-MISSING and nothing else"` was never mechanically
constrained either. What genuinely changes is the **blast radius of
disobedience**: today it produces work without a contract; after, it can produce
a false durability claim.

That trade is the settled direction #4 itself — today's strength is bought by
0/4 usability — so it is not mine to re-open, and I have made the replacement as
structural as the mechanism allows. **I do not accept this residual on the
operator's behalf.** It is routed to `principal-product-manager` at
scope-acceptance, who may escalate to the operator under boundary #1 if they
read the delta differently than I do.

---

## Open questions / escalations

None blocking. Three items routed, none requiring an answer before
implementation starts:

1. **-> `principal-product-manager` (scope-acceptance):** the residual above,
   stated for a deliberate accept-or-escalate rather than a silent pass.
2. **-> `principal-product-manager` (copy):** final wording of the two honest
   paths in `standalone-block.txt`. This record fixes the *structure*, the
   *timing*, the *anti-nag rule*, and the *five pinned disclaimers*; the
   sentences themselves are user-facing product copy.
3. **Deferred, with triggers recorded (no action now):**
   (a) re-homing the Capability family out of `kai-core-*` — trigger: the area
   set is stable after `migration-complete` **and** a standalone area is
   materially wrong without one; (b) renaming `KAI-CORE-MISSING` to something
   that reflects its narrowed trigger — cosmetic, reversible, and deliberately
   not bundled with a behaviour change; (c) the `kai-base` shared plugin
   (option 4) — operator only, since it mints an identity.

---

## HANDOFF 2026-08-27-1858 — principal-swe-architect -> principal-product-manager

- did:       Authored the optional-core architecture decision (DECISION packet above) against all eight required decision points and the item's eight acceptance lines. **Disposition: Reshape.** The injected fail-closed preflight becomes a three-way **mode selector** (full / standalone / refuse); `preflight-block.txt` is retired and replaced by `mode-block.txt` + a new `standalone-block.txt`; `degraded-block.txt` is unchanged byte-for-byte; `inherits-block.txt` is promoted to the **named standalone contract floor** with one amended clause and a size budget. `KAI-CORE-MISSING` is **retained**, with its trigger narrowed to version skew and degraded mode — because a skewed core is *present* and its coordination skills load, so standalone's safety argument does not hold there. The no-false-claim guarantee is re-based from prompt refusal onto a **structural withholding of the claim procedures**: a new `CLAIM_SKILLS` set asserted core-only in `--gate partition`, plus core-only co-location of `workflow-workspace-init` and `kai-core-workspace-onboarding`. Ruled standalone has **no state directory by default** ("never writes state whose location it chose"), reconciled the `kai-core-workspace-conventions` contradiction as a summarisation defect in one byte-pinned file rather than an architectural conflict, ruled the upgrade **fresh-session-only with no import path**, ruled `hooks.json` **stays core-only** (Endorse — it *is* the fleet observer, which standalone disclaims), gave a per-gate and per-error-family disposition table with **no retirement lacking a replacement**, and sequenced five reversible PRs (floor -> guarantee -> behaviour -> proof -> surface) that mint zero plugin identities. Three ASCII diagrams: boundary, control flow, mode state. Wrote no production code and touched nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `kai/initiatives/pack-split/`.
- state:     in-review
- needs:     `scope-acceptance` per the item's `review_requirements`. Three things to weigh: (a) the **critical-boundary call** — I find boundary #1 **not tripped**, because two of the three replacement mechanisms are structural rather than textual, and I have named the residual (the permitted-output space goes from a single string to non-empty) rather than accepting it; (b) the **fail-closed relaxation ledger** (R1–R3), which is the packet's binding requirement — confirm every relaxation carries a replacement and that "removed" appears nowhere; (c) final **user-facing copy** for the two honest paths, which is product judgment, not architecture. On acceptance, `area-plugins-optional-core-architecture` -> `completed` and milestone-2 implementation routes to `principal-swe-infra` (PRs 1–4) and `principal-technical-writer` (PR-5), sized by `principal-swe-manager`.
- artifacts: kai/coordination/threads/area-plugins-optional-core-architecture.md (this record — durable decision while `kai/initiatives/area-plugins/` cannot be created); kai/coordination/items/area-plugins-optional-core-architecture.md (version 4, `in-review`, lease cleared)
- evidence:  `inherits-block.txt` is byte-pinned into **all 56** root agent bodies (`scripts/validate-plugin.mjs:243-247, 312-314`) and already carries the core-absent fallback — the standalone floor exists today; `**Inherits:**` grep over `agents/` — 56/56 inherit `kai-core-team-operating-rules`, 53/56 inherit `kai-core-workspace-conventions`; `planPacks()` sends any skill used by >1 pack or by core to `core` and `namespaceErrors()` then forces the `kai-core-` prefix, so the prefix means "provided by core", not "is the contract" (`scripts/lib/pack-plan.mjs:395-430, 1527-1546`); the 24 `kai-core-*` skills split 4 contract / 14 claim / 5 capability / 1 probe; `hooks.json` = `subagentStart`+`subagentStop` -> `observe-subagent.mjs`, i.e. purely the fleet observer; `.kai/manifest.json` is the workspace sentinel (`scripts/workspace-doctor.mjs:107, 1042`); `kai-core-workspace-conventions/SKILL.md:29-30` scopes its temp-dir prohibition to "coordinated or initiative work" while `inherits-block.txt` drops that qualifier — the contradiction is in the restatement, not the rule; `GATES = partition|collision|partial-install|version-skew` (`scripts/pack-preview.mjs:1355-1359`); `gateSkew()` asserts `absent.reply === REFUSAL` — the one arm this decision inverts (`scripts/pack-preview.mjs:1341-1346`); `KAI-CORE-MISSING` appears in exactly one doc file (`docs/proposals/pack-architecture.md`), so the doc surface of the narrowing is small. All captured 2026-08-27 from `C:\src\kai` by file read.
- questions: none blocking. Three routed in "Open questions / escalations": the named residual on boundary #1 (for deliberate accept-or-escalate), the standalone-block copy (product judgment), and three recorded deferrals with triggers.
- next:      `principal-product-manager` — owns `scope-acceptance` on this item per `review_requirements`, and owns the BRIEF whose reframing this record was written against. The parallel sibling `area-plugins-taxonomy-decision` was not touched; it inherits two **seam** constraints from this record (block sets are mechanical by pack kind, so an agent leaving `core` acquires all three blocks once and correctly; and `workflow-workspace-init` + `kai-core-workspace-onboarding` stay co-located in the pack providing durable workspace capability) and **no membership ruling**.

---

## REVIEW 2026-08-27-1906 — principal-product-manager (scope-acceptance)

**Verdict: `approved`.**

**Record revision accepted:** the `DECISION 2026-08-27-1858` packet above, in
full, as the durable architecture decision. `change_ref: null` — this is a
`delivery_class: knowledge` item that produced no diff; the accepted revision is
identified by that thread entry's timestamp, not by a commit.

**Lease verified before writing:** item version `5`, holder
`principal-product-manager`, token `apx-oca-rev-20260827-1905-c1`,
`version_at_grant: 4`, `expires: 2026-08-27-2105`. All five fields match the
dispatch packet. No collision.

---

### 1. What I verified independently, and what I found

I do not accept an architecture record on its summary. Three claims in this
record are load-bearing — if any were false the disposition would change — so I
read the source myself rather than the packet's restatement of it.

| Claim | Verdict | What the source actually says |
|---|---|---|
| `inherits-block.txt` already carries the standalone operating floor, and already ships. | **TRUE** | Read `scripts/lib/inherits-block.txt` verbatim. Its second sentence is exactly the core-absent fallback: *"If one cannot be loaded, these non-negotiables still bind you: resolve a durable target workspace root before creating state…; stay in your lane…; keep coordinated work claimed, evidenced, and handed off…; never call something `shipped` that a human has not deployed and verified; and escalate to `@operator`…"* Byte-pinning confirmed at `scripts/validate-plugin.mjs:312-314`, which errors with *"missing the verbatim inherited-contract directive from scripts/lib/inherits-block.txt"* over every root agent body. **The floor is not being invented; it is being named.** That is the difference between this record and a redesign, and it is the single biggest reason the disposition is Reshape rather than Build. |
| The `kai-core-workspace-conventions` temp-dir contradiction is a summarisation defect in one file, not an architectural conflict. | **TRUE** | `skills/kai-core-workspace-conventions/SKILL.md:29-30` reads *"Copilot session-state, OS temp directories, and incidental agent cwds are never silent roots **for coordinated or initiative work**."* The qualifier is present in the skill and absent from the compressed restatement in `inherits-block.txt`. Standalone mode has no items, no leases, no initiatives — so the skill's rule does not reach it. The architect's narrowing is correct and the one-clause fix is the right size. |
| A skewed core is *present*, so standalone's structural safety argument does not hold there and the refusal must survive. | **TRUE, and it is the best call in the record** | This is the distinction I would have escalated on if it had been missed. Absence and skew are not the same failure; treating them the same is how a "make core optional" change quietly becomes "make the contract optional." Retaining `KAI-CORE-MISSING` for skew + degraded, rather than deleting the token, keeps a real fail-closed arm alive and keeps `--gate version-skew`'s `skew` arm asserting a refusal verbatim. |

I also confirmed the mechanism the *sibling* record depends on, because this
record claims `planPacks()` is unchanged and the sibling claims it must change:
`planPacks()` (`pack-plan.mjs:414-419`) assigns by consumer topology
(`packs.size > 1 || packs.has('core')`) while `namespaceErrors()` (`:1527-1546`)
judges by name. Both readings are correct and they are not in conflict — see the
taxonomy review, where that seam is the load-bearing finding. **This record's
"`planPacks()` stays the same" is true for milestone 2 *as scoped here*, and is
superseded by my sequencing ruling in the BRIEF amendment**, which moves the
sibling's one-condition prefix fix into this milestone. That is a steward
sequencing decision, not a defect in this record.

### 2. Scope classification — `kai-core-scope-discipline`

Classified every element against `mission`, `scope.current`
(`decisions-locked`), and the thirteen `non_negotiable` principles. Nothing here
is Deferred; the record is unusually disciplined about staying inside its own
milestone.

- **Within scope — `Apply`.** `mode-block.txt`, `standalone-block.txt`, the
  retirement of `preflight-block.txt`, `CLAIM_SKILLS`, `standaloneBlockErrors()`,
  `INHERITS_FLOOR_MAX`, `evaluatePreflight -> evaluateMode`, `--gate
  partial-install` arm B, the `partial-core` skew arm, and the
  `workspace-doctor` standalone classification. Every one lands inside a file
  already named in the BRIEF's `targets`, and every one is demanded by milestone
  2's own acceptance lines ("states which gates change and what each asserts
  afterwards"; "any place fail-closed is deliberately relaxed is named with its
  replacement guarantee"). New block files under `scripts/lib/` are the same
  artifact class as the two the BRIEF already names. **No new step, screen,
  field, surface, or capability is added**, and no plugin identity is created,
  renamed, or retired.
- **Correctly `Defer`red by the architect, and I am not unparking any of them.**
  Capability-family re-homing (costs a public skill-ID rename — expensive to
  reverse, correctly parked with a two-part trigger); the `KAI-CORE-MISSING`
  rename (cosmetic, correctly not bundled with a behaviour change); the
  `kai-base` shared plugin (mints an identity — operator only). The standalone
  **import path** is not merely deferred but ruled *against*, which is the right
  answer: an import is retroactive promotion, which non-negotiable #7 forbids
  outright. I endorse that refusal explicitly so it cannot be re-read later as
  an oversight.
- **The binding BRIEF requirement is met.** I checked the relaxation ledger line
  by line. Three relaxations (R1 area agents no longer refuse on absence; R2 the
  load-order sentence; R3 the inverted `no-core` arm), three replacement
  guarantees, each with a named enforcer. The word "removed" appears nowhere as
  a disposition; the single retirement (`preflight-block.txt`) is
  "Retired, **replaced**" with its guarantee redistributed across four
  mechanisms. This was the constraint most likely to be quietly failed. It was
  not.

### 3. The critical-boundary call — I concur

Boundary #1 fires only *"if the no-false-claim guarantee cannot be enforced by
CI and must rest on prompt text alone."* It does not. Two of the three
mechanisms are structural: the Claim-family procedures are absent from disk in a
core-less session, and minting a canonical workspace needs
`kai-core-workspace-onboarding` **and** `workflow-workspace-init`, both
core-only (`PACKS.core` confirmed by file read). A core-less agent does not
possess the lease grammar, the handoff packet format, the `shipped` gate, or the
onboarding procedure. **That is withheld capability, not a request for good
behaviour.** Boundary #1 is not tripped.

---

## DECISION 2026-08-27-1906 — principal-product-manager · the routed blast-radius residual

Recorded as an explicit, classified ruling because the architect deliberately
declined to self-clear it and a silent pass would have been a failure of this
review.

**The residual, stated as routed:** in standalone mode the permitted-output
space goes from the single string `KAI-CORE-MISSING` to non-empty, so the
**blast radius of disobedience worsens** — today a disobedient model produces
work without a contract; afterwards it can produce a false durability claim —
even though the claim *procedures* are structurally withheld.

**Ruling: ACCEPTED by the steward, with three binding conditions. Not escalated
to `@operator`.**

**Why accept rather than escalate.** Three reasons, strongest first.

1. **The boundary's own trigger is not met, and I wrote the boundary.**
   Boundary #1 is a conditional guard on *how* direction #4 is implemented —
   "if the guarantee must rest on prompt text alone." It is not a second veto
   over direction #4 itself. The guarantee does not rest on prompt text alone.
   Escalating anyway would be asking the operator to re-decide a settled
   direction, which my own BRIEF lists under `out_of_scope`
   ("re-litigating the ten operator-settled directions"). An escalation that
   the escalation criteria do not support is not caution; it is noise that
   makes the *real* boundaries cheaper to ignore later.
2. **The residual is a property of the settled direction, not of this design.**
   *Every* design that makes an area agent usable without core enlarges the
   permitted-output set from one string to non-empty. That enlargement **is**
   direction #4. The only shape that keeps the surface empty is Option 0 (keep
   the refusal), which the operator rejected, and which costs 0-of-4 areas
   usable. The architect did not choose this residual; he inherited it and then
   made the replacement as structural as the mechanism allows. There is no
   alternative design on the table that pays less for the same outcome — I
   checked the options table for one and there is not.
3. **The asymmetry runs the right way, and the failure is bounded.** After the
   change a lying model must *invent* the artifact shape rather than *follow*
   it, and it cannot produce the durable side effect: no `.kai` path, no
   `manifest.json`, no `kai/coordination|initiatives|library` write, no state
   whose location the agent chose. Blast radius is one session's text, with no
   persistent corruption and no contamination of the coordination record. That
   is a materially different failure from "a false lease exists in the
   workspace," which is the failure the refusal was actually protecting against.

**What I will not paper over.** Measure #2 changes character and the BRIEF must
say so. "Standalone never makes a false durability claim" was trivially true
only because standalone was unreachable; after the relaxation, *"was that claim
false?"* is a judgment over free text that no CI can decide. So measure #2 stops
being an assertion about outcomes and becomes an assertion about **mechanism
presence**. Stating that plainly is the honest move; leaving the measure's
wording untouched would let a mechanically-green build read as proof of
something it does not prove. Amended in the BRIEF this pass.

**Three binding conditions.** All three are already inside this record's own
plan, so they add no scope — they convert intent into something a reviewer can
fail a PR on.

- **C1 — the one-sentence mode line is not negotiable downward.** Every
  standalone session names its mode in the first reply. This is what converts an
  unverifiable output space into an *attributable* one: the user knows which
  regime produced the answer before deciding whether to trust it as recorded
  work. `standaloneBlockErrors()` must assert both the `once` instruction and
  the do-not-repeat prohibition, exactly as specified. The copy is mine and I
  own delivering it (see the follow-on below).
- **C2 — PR order is binding, not advisory.** PR-2 (`CLAIM_SKILLS`, the
  `--gate partition` extension, `standaloneBlockErrors()` landed unused) merges
  **before** PR-3 (mode selection). There must never exist a commit in which
  core is optional and the claim surface is unpinned. A PR that reverses or
  merges these two fails review on this line alone.
- **C3 — a substantiated false durability claim in standalone is a P0 that
  reopens boundary #1 with evidence.** I would rather the operator decide this
  with a real instance in hand than with my speculation. This is the reopen
  trigger, recorded so acceptance is revisable rather than final.

**What stays the same as a result of this ruling.** The skew refusal and the
degraded refusal, byte-for-byte. `CONTRACT_SKILL` / `CONTRACT_VERSION` and the
mandatory probe. The `KAI-CORE-MISSING` token. Exactly one provider per skill and
exactly one `hooks.json` owner. Core's `kai-core-*` namespace. Byte-parity
`--check`. Lockstep versions. Zero plugin identities created, renamed, or
retired in milestone 2. And standalone remains **stateless by default** — no
import path, now or as a "refinement."

---

### 4. Follow-ons I own, and what I am not doing

- **Product copy for `standalone-block.txt`** — the two honest paths and the
  five pinned disclaimers, plus the `packDescription()` string the sibling
  record flagged as false in both halves after this initiative. Both are
  user-facing published copy under non-negotiable #5, and both are mine, not the
  architect's and not the generator's default. **Named as required product
  deliverables of milestone 2 in the BRIEF amendment this pass**, with me as
  owner, so neither is silently skipped. This is not a blocker on this record:
  the architecture fixes the structure, timing, anti-nag rule, and disclaimer
  set; only the sentences are outstanding.
- **Not doing:** I am not redesigning the block chain, not re-opening the
  three-mode selector, not re-litigating `hooks.json` ownership, and not
  reinterpreting any gate disposition. Those are engineering calls the record
  made competently and inside scope.

---

## HANDOFF 2026-08-27-1906 — principal-product-manager -> (unassigned; director dispatches)

- did:       Recorded `scope-acceptance` **approved** on the `DECISION 2026-08-27-1858` packet. Verified the three load-bearing claims against source rather than accepting the summary — `inherits-block.txt` really does carry and ship the standalone floor, the `workspace-conventions` contradiction really is a one-file summarisation defect, and the skew-vs-absence distinction really is required. Confirmed the fail-closed relaxation ledger satisfies the BRIEF's binding constraint (three relaxations, three replacement guarantees, "removed" used nowhere). Concurred with the critical-boundary call. **Ruled on the routed residual: ACCEPTED, not escalated**, with three binding conditions (C1 mode line non-negotiable downward; C2 PR-2 before PR-3, never a commit where core is optional and the claim surface unpinned; C3 a substantiated false durability claim reopens boundary #1 with evidence). Moved the item `in-review -> completed` at version 6, cleared all five lease fields, set `next_role: null`, and appended the review to `completed_reviews`. Amended the BRIEF separately with the measure-#2 restatement, the derived-identity-string ruling, and the sequencing consequences.
- state:     completed
- needs:     Nothing from this item. Milestone 2 implementation is unblocked and routes to `principal-swe-infra` (PRs 1–4) and `principal-technical-writer` (PR-5), sized and sequenced by `principal-swe-manager`, who must also absorb the sibling record's byte-neutral `planPacks()` prefix fix into this milestone per the BRIEF amendment. Conditions C1–C3 travel with the work as acceptance criteria.
- artifacts: kai/coordination/threads/area-plugins-optional-core-architecture.md (this record); kai/coordination/items/area-plugins-optional-core-architecture.md (version 6, `completed`, lease null, one `completed_reviews` entry); kai/coordination/threads/area-plugins-scope-brief.md (STEWARD AMENDMENT 2026-08-27-1906)
- evidence:  `scripts/lib/inherits-block.txt` read verbatim — carries the core-absent fallback naming durable-root, lane, claimed/evidenced/handed-off, `shipped`, and `@operator` escalation; `scripts/validate-plugin.mjs:312-314` errors on any root agent body missing that verbatim directive; `skills/kai-core-workspace-conventions/SKILL.md:29-30` scopes the temp-dir prohibition to "coordinated or initiative work" and `:38-40` carries the ephemeral escape; `scripts/lib/pack-plan.mjs:414-419` (`packs.size > 1 || packs.has('core')`) vs `:1527-1546` (`namespaceErrors` bidirectional by name) — the prefix-vs-topology seam, real and confirmed; `PACKS.core` (`:63-69`) contains `workflow-workspace-init`, and `kai-core-workspace-onboarding` is core-provided by prefix, so the onboarding co-location the guarantee rests on holds today. All read 2026-08-27 from `C:\src\kai`.
- questions: none. The one routed decision was ruled on above rather than passed through.
- next:      `director-chief-of-staff` — reconcile the derived `kai/coordination/BOARD.md`, which carries no `area-plugins` rows at all today, and dispatch milestone-2 work. `kai/coordination/ACTIVE.md` still reads "No initiatives are active" and still cannot be corrected honestly until a north star exists; both remain outside this item's `touches` and were not edited.
