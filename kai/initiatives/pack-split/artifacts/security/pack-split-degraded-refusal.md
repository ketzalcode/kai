# Security Assessment — pack-split-degraded-refusal

**Mode:** CHANGE-REVIEW (`independent-security`)
**Scope/change_ref:** `8d3ef4844988f4974e6bec8f406a7723dee4e942`
**Authorization:** read-only inspection of the local worktree at `C:\src\kai`. This run had **no
shell**: nothing was executed, no active check was performed, no network call was made, and no
implementation or release file was edited.
**Sensitivity:** public open-source repository. No credentials, customer data, tenant identifiers,
private topology, or incident material is in scope or in this artifact.
**Verdict:** **CLEAR**

---

## Decision and scope

The decision this review supports: may `pack-split-degraded-refusal` pass its `independent-security`
requirement at this exact ref, given that the change adds a **second** guarantee block to every
generated department agent's own body — one that covers the state the fail-closed preflight cannot
see (core answered and is compatible, and the shared operating contract is still not in the session).

Reviewed, exactly:

1. the canonical refusal restates no operating rule and carries neither the preflight's
   `KAI-CORE-MISSING` token nor a contract-version literal;
2. it orders **after** the preflight, which remains the first executable instruction, with nothing
   wedged between the two;
3. exactly one verbatim copy in every generated **non-core** agent, **zero** in every core agent,
   asserted over real generator output in both directions;
4. the refusal is single-shot and prohibits claiming, leasing, handing off, recording reviews, and
   writing coordination/initiative state, giving only the install remedy;
5. the mechanical arms — byte-pin, adjacency, copy-count, no-rule mutation, on-disk `--all`, drift;
6. **the trust boundary itself**: a *model-evaluated* trigger sitting beneath a *probe-evaluated*
   one, and what that means for fail-open vs fail-unsafe (routed to me by architecture);
7. whether architecture's **A1** (core agents carry neither block) or **E1** (milestone wording)
   creates a **current exploitable integrity path**. Neither does — see *Findings*.

**Deliberately excluded** (named so absence is not read as approval): empirical host behaviour
(owned by `pack-split-host-gates` / `pack-split-host-semantics-spike`), cross-plugin skill
resolution and authenticity (R1, unchanged from `preflight-compat`), committed pack trees,
marketplace publication, migration, CI status on a pushed PR, and the milestone-acceptance wording
question (steward's).

## Assets, data classes, actors, and trust boundaries

| | |
|---|---|
| **Primary asset** | Integrity of the durable coordination corpus (`kai/coordination/**`, `kai/initiatives/**`) and of any product change an agent makes on an operator's behalf. |
| **Secondary asset** | Truthfulness of the agent contract: an agent acting under *absent* rules while believing it holds them is the harm, not a data breach. |
| **Data classes** | None sensitive. No secrets, credentials, tokens, PII, or telemetry are read, written, or transported by this change. Dependencies are unchanged (`lectoria`, pinned to a full commit SHA). |
| **Actors** | (a) operator; (b) the Copilot host loading plugins and skills; (c) a department-pack agent; (d) `kai-core`; (e) any other installed plugin; (f) **untrusted in-context content** an agent reads while working (files, issue bodies, fetched pages). |
| **Boundary under test** | The *session-level* contract boundary: core is installed and compatible, but the inherited `kai-core-*` contracts are not in this session's context. Unlike the install-level boundary, **there is no observable marker** for it — no `KAI_CORE_READY` equivalent exists for "the rules are loaded". |
| **Explicitly NOT the boundary** | Install-level absence and version skew (the preflight owns those, terminally). Authenticity of the probe (R1, unchanged). |
| **Shipped exposure at this ref** | **None.** `COMMITTED_PACKS` is `[]` (`pack-plan.mjs:117`), there is no `packs/` tree on disk, and `.github/plugin/marketplace.json` lists exactly one plugin (`kai`, `source: "."`). Neither block reaches an installed agent today; they exist in generator output, previews, and the CI pin. |

## Threat and abuse cases

| # | Abuse case | Prevention / detection at this ref | Residual |
|---|---|---|---|
| T10 | Silent contract loss: core answers, contracts are absent, the agent claims work and writes coordination state on remembered rules | The refusal names the state and forbids claiming, leases, handoffs, recording reviews/approvals, and all coordination/initiative/workspace writes | **R4** (trigger is model-evaluated, unmeasured) |
| T11 | The new block **displaces** the preflight, so "before anything else" stops being true | Order stated once in `guaranteeBlocks()` (`pack-plan.mjs:280`); **one** splice in argument order (`:286`); validator pins preflight-first-after-the-directive **and** refusal-immediately-after-preflight, whitespace only between (`validate-plugin.mjs:455-482`) | none material |
| T12 | The two refusals are confused, so an operator cannot tell "install something" from "restart a session" | The block may not carry `KAI-CORE-MISSING` or any `` `contract:` `` literal (`pack-plan.mjs:360-371`); mutation arms prove both by name (`pack-preview.mjs:~470-480`) | **P2-D3** (the one permitted remedy is install-shaped) |
| T13 | The refusal grows into a second copy of the contract that drifts from core | `degradedBlockErrors`: only `Refuse`/`Do not`/`Never`/`Tell the operator to install` bullets; no backticked shipped skill/agent id; no ≥40-char line repeated from the **live** `kai-core-*` skills, re-derived at check time (`:337-348`); 1200-char budget | **R5** (shape check, not semantic — see below) |
| T14 | A generated agent ships the refusal **without** the preflight (a fail-open agent) | Every production path goes through `guaranteeBlocks`/`injectBlocks`; the validator checks the preflight count **first** and errors before it looks at the refusal, so a refusal-only agent fails CI by name | **N3** (`injectPreflight` survives as an exported affordance; inert) |
| T15 | Copy drift: a hand-edit softens the refusal inside a shipped tree | Byte-pin over real `materializePacks` output; regenerate-and-diff; a self-test arm softens `Refuse` -> `Consider refusing` inside a generated tree and catches it on that exact file (`pack-preview.mjs:~545-553`) | none material |
| T16 | A core agent silently carries a block whose first sentence is false there | Injection keyed on `p.kind !== 'core'` (`pack-plan.mjs:250-256`); validator keyed independently on the `kai-core/` directory prefix and asserts **zero** of each (`validate-plugin.mjs:445-454`) — two independent keys, so a mismatch fails loudly | **P2-D4 / A1** (coverage, not integrity — no core-only install exists) |
| T17 | **Prompt injection flips an agent into degraded mode** by asserting in-context that the contracts are not loaded | Not prevented (no mechanism at this layer). **Consequence is narrowing, not widening:** every instruction the block adds is a refusal or a prohibition, so an injected degradation costs availability and audit detail, never capability | **R6** |
| T18 | The second block dilutes the preflight's "reply with exactly `KAI-CORE-MISSING` and nothing else" in the core-absent state | The block's opening sentence conditions it on a **passing** preflight, and it is forbidden from carrying the token, so it cannot emit a false one | **P2-D1** (exactness is now a two-block model judgement; evidence owed by host gates) |

## Findings

**P0: 0 — P1: 0 — P2: 4.** None blocks this item and none requires a change at this ref.

### P2-D1 — the exactness of the `KAI-CORE-MISSING` reply is now a **two-block** model judgement

The preflight promises a machine-readable output: exactly one token, nothing else. Before this ref
an agent in the core-absent state read one block. It now reads two, and the second one ends with
"Tell the operator to install `kai-core`" — prose the agent must decide **not** to emit in exactly
the state where the preflight forbids emitting anything but the token.

What is already in place: the block is explicitly conditioned on a passing preflight ("The preflight
above proves `kai-core` answered and is compatible. If …"), and `degradedBlockErrors` forbids it from
carrying the token, so it cannot produce a *false* refusal signal. What is **not** in place is any
evidence that a model reading both blocks still replies with the token and nothing else.

- **Severity rationale:** unmeasurable at this layer, zero shipped exposure, and the failure shape is
  a noisy-but-correct refusal (extra prose alongside a correct token), not a fail-open.
- **Concrete acceptance criterion, owed downstream — not at this ref:** `pack-split-host-gates`
  should carry an arm asserting that a department agent carrying **both** blocks replies with
  exactly `KAI-CORE-MISSING` and nothing else in **both** the core-absent and the contract-skew
  builds (`pack-preview --all --no-core` / `--all --contract 2` produce the trees).
- **Owner:** `principal-swe-infra` (gate design), `@operator` (host run). **No item is created by
  this review**; folding it into `pack-split-host-gates`' acceptance is the steward's call.

### P2-D2 — the refusal's prohibition set is narrower than the preflight's

Preflight forbids: claim work, take a lease, write workspace state, **call any other tool**, answer
from memory. The refusal forbids: claim/lease/hand off/record a review; create or update **workspace
state, coordination records, initiative artifacts**; act on a remembered rule. It does **not**
explicitly name product-code edits, command execution, or tool calls — those are covered only by the
softer "reply once from what the request itself carries, then stop."

This is a **coverage gap, not a regression**: the counterfactual at this ref is *no block at all*, in
which a contract-less agent does all of the above **and** claims work and writes coordination state.
The change strictly reduces capability in the state it covers.

- **Severity rationale:** hardening. Requires the model to have entered degraded mode at all (R4)
  before it matters, and no attacker gains anything by it.
- **Smallest fix, if ever taken:** one additional prohibition bullet (a permitted `Do not …` opener),
  e.g. forbidding file edits and command execution beyond the single reply — ~90 characters against
  ~360 characters of remaining budget. It is **not** requested here: it moves a byte-pinned,
  architecture-ratified file, which re-binds **both** required reviews for a residual with no
  exploit path.
- **Owner:** `principal-swe-infra` with `principal-swe-architect` (block text is a ratified seam);
  scheduling is the steward's.

### P2-D3 — the only remedy the block may state is install-shaped, for a condition that may not be an install problem

`degradedBlockErrors` **requires** exactly one `Tell the operator to install …` bullet. Under the
re-scoped trigger the covered state is "core answered and is compatible, contracts not in session" —
which is a *context-loading* failure at least as often as a partial install. The decision record's
own force 3 is that the operator must be able to tell "install something" from "restart a session";
the block preserves that distinction in its **token** (it may not carry `KAI-CORE-MISSING`) but not
in its **remedy**.

- **Impact:** recovery guidance, not exploitability — it can extend the window in which an operator
  misdiagnoses a trust-boundary failure. No confidentiality, integrity, or privilege effect.
- **Fix, if ever taken:** widen the mandated remedy rule to admit a restart/reload remedy, or amend
  the bullet's tail. Same cost as P2-D2 (moves a pinned file), so it should ride the item that next
  legitimately reopens the block — the A1 trigger below.
- **Owner:** `principal-swe-architect` (seam) / `principal-product-manager` (scheduling).

### P2-D4 — core agents carry no refusal, and core holds the highest-impact writers (architecture's A1, security read)

Architecture deferred A1 with a named trigger. **Confirmed: it creates no current exploitable
integrity path** — `COMMITTED_PACKS` is `[]`, no `packs/` tree exists, the marketplace ships one
entry, the monolith injects neither block, so no agent anywhere is exposed to this gap today.

One security input for the steward's triage that architecture did not have to weigh: the core pack
is not a low-value remainder. It contains `director-chief-of-staff` — the **lease grantor**, the role
that writes item records, leases and the board — plus `workflow-workspace-init`, which scaffolds
workspace state. Those are precisely the roles whose uncontracted action damages the corpus most. So
when a core-only install becomes real the uncovered blast radius is **larger** per agent than in a
department pack, not smaller.

- **Not blocking, and no change asked for at this ref**, for architecture's stated reason: covering
  core needs a *second* canonical block with its own pin (this block's first sentence is false in an
  agent carrying no preflight) — a new file and a scope decision.
- **Reopen trigger (unchanged):** `pack-split-generated-pack-trees`, or at the latest
  `pack-split-first-department`. **Owner:** `principal-product-manager` at triage. **This review
  creates no item.**

### Carried forward, not re-filed — `P2-S1` blast radius (architecture's N1)

`validate-plugin.mjs:443` gates the generated-agent pin on `/^kai-[a-z]+\/agents\/.+\.agent\.md$/`.
Confirmed: it now gates **both** guarantees, so a future pack key outside `[a-z]+` would silently
skip the preflight pin *and* the refusal pin together. All five current keys (`core`, `engineering`,
`product`, `gtm`, `personal`) match, so coverage today is complete. This is the same P2 recorded at
`preflight-compat` with a wider blast radius — **not a new finding**, same owner
(`principal-swe-infra`), same smallest fix (widen to `kai-[a-z-]+` or derive the set from
`PACK_ORDER`/`planManifests`), and filing remains the steward's call.

## The trust boundary: model-evaluated trigger under a probe-evaluated one

Architecture routed this to me as a control-acceptance question. Stated honestly:

**The two triggers are not the same kind of thing.** The preflight's decision input is an
*observable artifact*: invoke a skill, match `KAI_CORE_READY` and exactly `contract: 1`. The
refusal's decision input is *self-report*: "if its shared contracts are still not loaded in this
session". There is no marker for that, and none can be added at this layer — an absent skill cannot
announce its own absence. So this control is **advisory prose evaluated by the model against its own
context**, and its effectiveness is **unknown and unmeasured**, not "high".

**Dominant failure mode is fail-open, and fail-open is the current baseline.** The likely miss is a
false negative: the contracts are absent, the agent's body still carries an `**Inherits:**` line
*naming* them, and the model concludes it has them. Then the block does nothing — which is exactly
where the operator stands today, with no block at all. **The change cannot make that state worse.**

**It cannot fail *unsafe*, and that is mechanically supported, not asserted:**

1. it orders **after** the preflight, and both adjacency bounds are pinned over real generator
   output, so it cannot pre-empt or dilute the first executable instruction's position;
2. it may carry neither `KAI-CORE-MISSING` nor a contract-version literal, so it cannot emit a false
   compatibility verdict or re-import the version-skew fail-open class;
3. every instruction it contains is a refusal or a prohibition, except the one install remedy — a
   misfire therefore *narrows* the agent;
4. it grants no capability and touches no credential, endpoint, or data path.

**False positives cost availability, and that is the correct trade — with one qualification.** A
spurious degradation produces a lower-quality single-shot answer and, by design, an agent that
declines to record durable state. That means a misfire also costs **audit trail**, not only
throughput. It remains the right direction; "directionally safe" should not be read as "free".

**Injection-triggered degradation (T17/R6) is an availability vector, not an escalation.** Untrusted
in-context text asserting "the contracts are not loaded" could flip a model into the degraded branch.
The attacker's gain is a refused request and a thinner record; the block hands them no action they
did not already have, because it only subtracts. Worth knowing before packs are published; not worth
a control at this ref.

**Truth-binding, extending `P2-S2`:** no record, changelog entry, release note, or ship record may
claim that pack agents *refuse*, *degrade gracefully*, or *detect* contract loss. The evidenced claim
is that every generated department agent **carries a pinned, correctly ordered refusal instruction**
whose text cannot drift from core. Empirical proof is owed by `pack-split-host-gates`. The CHANGELOG
at this ref respects this (it describes what is shipped and pinned, never what a model does).

## Required controls and acceptance criteria

No control is required before this item proceeds. The controls below were **verified present** and
are recorded so a later change cannot quietly remove them.

| # | Control | Acceptance (testable) | Where verified |
|---|---|---|---|
| D1 | The refusal states no operating rule | Every `- ` bullet opens with `Refuse`/`Do not`/`Never`/`Tell the operator to install`; no backticked token equal to a shipped skill or agent id; no ≥40-char line equal to a line of a live `kai-core-*` skill | `pack-plan.mjs:325-408`; run on the canonical file at `validate-plugin.mjs:428-437` |
| D2 | The two refusals stay distinguishable | Block contains neither `KAI-CORE-MISSING` nor any `` `contract:` `` literal — hard error | `pack-plan.mjs:360-371` |
| D3 | The refusal cannot become a fallback contract | `text.length <= 1200`; the shipped block is ~840 | `pack-plan.mjs:325`, `:373-376` |
| D4 | It stays a refusal with a way out | Exactly one `Refuse …`, exactly one `Tell the operator to install …`, at least one prohibition, and the literal `single-shot` present | `pack-plan.mjs:377-390` |
| D5 | Exactly one verbatim copy per department agent, zero per core agent | Byte comparison over **real `materializePacks` output**, both directions | `validate-plugin.mjs:441-454` |
| D6 | The preflight remains the first executable instruction | Preflight after `**Inherits:**`, after the directive, whitespace-only between directive end and block start | `validate-plugin.mjs:455-470` |
| D7 | The refusal is contiguous and second | `refusalAt >= preflightEnd` and whitespace-only between the two blocks | `validate-plugin.mjs:472-482` |
| D8 | Order is defined once, injected once | `guaranteeBlocks()` states `[preflight, degraded]`; `injectBlocks()` splices in a single pass, so the A2 inversion is unconstructible from the shared helper | `pack-plan.mjs:280-296` |
| D9 | Injection and expectation use independent keys | Generator keys on `p.kind !== 'core'`; validator keys on the `kai-core/` directory prefix — a mismatch in either direction is a named CI failure, not a silent skip | `pack-plan.mjs:250-256` vs `validate-plugin.mjs:445` |
| D10 | Missing canonical block is a hard failure | Falsy `degraded` ⇒ error, and generation stands down rather than crashing; any error ⇒ `process.exit(1)` | `validate-plugin.mjs:376-388`, `:428-430`, `:1191` |
| D11 | The rules fail **by name**, proven by mutation | 8 mutation arms over the shipped block (affirmative instruction, cited contract, lifted core line, preflight token, second version literal, over-budget, dropped single-shot, dropped remedy) | `pack-preview.mjs:~444-481` |
| D12 | The pin holds on disk, not only in memory | A full `--all` build is read back: every department agent carries the refusal once, after the preflight; no core agent carries either; a softened refusal in a generated tree is caught on that exact file | `pack-preview.mjs:~396-416`, `~545-553` |
| D13 | Gates run on every PR and push | `validate-plugin`, `pack-preview --self-test`, `--check` are steps in the `validate` workflow; `permissions: contents: read` | `.github/workflows/validate.yml` |

## Residual risk and decision owner

| # | Residual risk | Exposure at this ref | Decision owner |
|---|---|---|---|
| R4 | The trigger is **model-evaluated self-report** with no observable marker; effectiveness is unknown, and the dominant miss is a silent no-op equal to today's baseline. | Present by design; unavoidable at this layer. | **Operator** at publication; empirical evidence owed by `pack-split-host-gates`. |
| R5 | "Restates no rule" is a **shape** check: the opener test is a *prefix* test (a clause after the first escapes on the same line) and the opening paragraph is not opener-checked at all. Drift-prone failures are impossible; a deliberately smuggled paraphrase is caught by review, not by machine. **No marginal privilege**: anyone able to edit `degraded-block.txt` already controls every agent body in the repo, so this widens R3 in blast radius (two canonical files now), not in attacker capability. | No such clause exists at this ref — verified by reading the whole file. | **Repo review process**: both required reviews re-bind on any `change_ref` change. Accepted as stated by architecture; no change requested. |
| R6 | Untrusted in-context content can assert the degraded condition and flip a model into the refusal branch — availability and audit-trail cost, no capability gain. | None shipped. | **Operator** at publication. |
| R1, R2, R3 | Carried unchanged from `pack-split-preflight-compat`: authenticity vs availability at the probe boundary; instruction-level rather than host-enforced control; semantic integrity of a canonical file resting on human review. | None shipped. | **Operator** at publication / repo review process. |

**No residual risk is accepted by this review.** Recording a risk is not accepting it; acceptance is
the operator's, and **none is required for this item to proceed**, because no control is being
waived and nothing at this ref reaches an installed agent.

## Sanitized evidence register

All claims are `observed` in the local worktree unless marked otherwise. Nothing was executed.

| ID | Claim | Kind | Source |
|----|-------|------|--------|
| G1 | The canonical refusal is a heading, one conditional paragraph, and five bullets: one `Refuse … single-shot`, three `Do not …`, one `` Tell the operator to install `kai-core` ``. It names no skill or agent id, carries no `KAI-CORE-MISSING` and no `` `contract:` `` literal, and is ~840 characters against the 1200 budget. | observed | `scripts/lib/degraded-block.txt` (whole file) |
| G2 | Its first sentence conditions the whole block on a **passing** preflight, so the two blocks never claim the same condition. | observed | `scripts/lib/degraded-block.txt:3` |
| G3 | Order stated once; one splice in argument order; `injectPreflight` is the single-block form with one self-test caller. | observed | `scripts/lib/pack-plan.mjs:280-296` |
| G4 | The authoritative `materializePacks` injects both blocks into every non-core agent and neither into a core agent; core agent and skill bodies are copied verbatim. | observed | `scripts/lib/pack-plan.mjs:244-268` |
| G5 | `degradedBlockErrors` implements D1-D4; `coreContractLines` re-derives ≥40-char lines from the **live** `kai-core-*` skills at check time rather than a pinned list. | observed | `scripts/lib/pack-plan.mjs:325-408` |
| G6 | The pin runs over real generator output: exact bytes, exactly one each, zero of each in every `kai-core/` agent, preflight first after the directive, refusal contiguous and second. Preflight count is checked first, so a refusal-only agent fails by name. | observed | `scripts/validate-plugin.mjs:376-484` |
| G7 | The generated-agent pin is gated on `/^kai-[a-z]+\/agents\/.+\.agent\.md$/`; all five pack keys match today. | observed | `scripts/validate-plugin.mjs:443`; `scripts/lib/pack-plan.mjs:57-93`, `:121` |
| G8 | Self-test arms: injection order, on-disk `--all` in both directions, 8 named refusal-rule mutations, a softened-refusal drift arm on that exact file, and determinism/LF arms. | observed | `scripts/pack-preview.mjs:~331-560` |
| G9 | No shipped exposure: `COMMITTED_PACKS` is `[]`, no `packs/` directory exists, marketplace lists exactly one plugin (`kai`, `source: "."`) at `0.61.0`. | observed | `scripts/lib/pack-plan.mjs:117`; filesystem; `.github/plugin/marketplace.json` |
| G10 | No skill or agent is named exactly `kai-core`, so the block's own `` `kai-core` `` mention cannot trip the "names a shipped contract" rule; conversely, adding such an id later fails CI loudly. | observed | `skills/` listing; `agents/` roster in `pack-plan.mjs:57-91` |
| G11 | Gates run on every PR and push with `permissions: contents: read`; `npm test` runs `validate-plugin` and both `pack-preview` modes. | observed | `.github/workflows/validate.yml`; `package.json` `scripts.test` |
| G12 | Supply chain unchanged by this ref: one git dependency (`lectoria`) pinned to a full commit SHA; no new dependency; `0.61.0` coherent across the six version locations. | observed | `package.json`, `.github/plugin/marketplace.json`, `CHANGELOG.md:7`, `:2705` |
| G13 | The CHANGELOG entry describes what is shipped and pinned; it does not claim that agents refuse or detect contract loss. | observed | `CHANGELOG.md:7-48` |
| G14 | A git object named `8d3ef4844988f4974e6bec8f406a7723dee4e942` exists in this repository's loose object store. | verified-defensive | `.git/objects/8d/3ef4844988f4974e6bec8f406a7723dee4e942` present (existence only; content not decoded — no shell to inflate it) |
| G15 | `HEAD` is on `kai/feat/29-degraded-refusal` at `e679de9d41187614e9765e00ec3e20dafff9ec0c`, with no commit on the branch (reflog shows only the checkout from `main`). The reviewed ref is therefore unreachable from any ref — consistent with the `git stash create` object the coordination contract permits, and with the three prior refs on this initiative. | observed | `.git/HEAD`, `.git/refs/heads/kai/feat/29-degraded-refusal`, `.git/logs/HEAD:426-427` |
| G16 | The worktree is byte-identical to the ref for all implementation and release files; full `npm test` exited 0; `pack-preview --check` passed; five preview trees generated. | **reported** (operator attestation, HANDOFF 2026-08-25-1525) | item thread |

## Unknowns and exclusions

- **Not verified (no shell in this run):** byte-identity between the worktree and
  `8d3ef4844988f4974e6bec8f406a7723dee4e942`, and the green `npm test`. Both are **operator
  attestations**, treated as *input*, never as the basis of the verdict. My verdict rests on source
  read directly at the paths in the register. **If the worktree is not byte-identical to that
  object, this review does not bind** and must re-run against the true ref.
- **Not verified:** the object's type and tree (existence only — a zlib-compressed loose object
  cannot be decoded without a shell).
- **`pack-preview --check` is vacuous for this item** and no part of this verdict rests on it: it
  returns early while `COMMITTED_PACKS` is empty and `packs/` is absent (`pack-preview.mjs:281-283`).
  The mechanical enforcement rides on `validate-plugin` and `--self-test`. This confirms
  architecture's N2 independently.
- **Unknown, routed not resolved:** whether a model reading both blocks obeys either. Owned by
  `pack-split-host-gates` (see P2-D1) and `pack-split-host-semantics-spike`.
- **Not assessed, by scope:** empirical host behaviour, cross-plugin resolution/authenticity,
  committed pack trees, marketplace publication, migration, and CI status on a pushed PR.
- **Not a security finding, routed for accuracy:** the CHANGELOG headline reads "shipped in every
  generated **pack** agent" while the body correctly says department agents only and states the core
  exclusion. That is the same wording question as architecture's **E1** and belongs to
  `principal-product-manager` / the ship gate, not to this review.
- **Confirmed pre-existing, not routed here:** `.github/workflows/validate.yml` pins
  `node-version: '20'` while `package.json` `engines` requires `^22.22.2 || ^24.15.0 || >=26`. Not
  introduced by this ref; no security impact on the reviewed boundary.

## Run constraints and read log

**The `.kai/runs/` lane was deliberately not used, for the same reason as the `preflight-compat`
review.** That lane exists for evidence that must *not* become durable — exploit detail, private
topology, customer identity, secrets, incident material. **This review produced none of it:** the
target is a public repository, the change is generator prose plus a CI pin, and no credential,
token, PII, tenant identifier, or endpoint was read or produced. With nothing to segregate, a second
copy would only drift from this one.

Files opened, all read-only:

```
scripts/lib/degraded-block.txt           scripts/lib/preflight-block.txt
scripts/lib/pack-plan.mjs                scripts/validate-plugin.mjs
scripts/pack-preview.mjs                 skills/kai-core-contract-v1/ (listing)
.github/workflows/validate.yml           .github/plugin/marketplace.json
package.json                             CHANGELOG.md
AGENTS.md                                .kai/manifest.json  (schema_version 2 — current)
.git/HEAD  .git/refs/heads/kai/feat/29-degraded-refusal  .git/logs/HEAD
.git/objects/8d/  (directory listing; object existence only, not decoded)
kai/coordination/items|threads/pack-split-degraded-refusal.md
kai/coordination/items/{pack-split-preflight-compat,pack-split-ci-partition-checks,pack-split-host-gates}.md
kai/coordination/{ACTIVE,BOARD}.md
kai/initiatives/pack-split/artifacts/{decisions,security}/…
skills/kai-core-work-coordination/SKILL.md   skills/kai-core-workspace-conventions/SKILL.md
```

Nothing outside the repository was read, nothing was executed, and no web search was made — public
advisories add nothing to a boundary defined entirely by local prose and local pins. The only files
written by this review are this artifact, the item record, the thread, and the board/pointer/log
refreshes — **no implementation or release file was touched.**

**`scripts/activity.mjs` was not appended:** `kai-core-work-activity` writes through a shell this run
does not have. Per that skill a failed append is reported and dropped — never retried, never allowed
to gate the work. The initiative log was updated by hand, as prior runs on this item did.

## Handoffs

- **`workflow-ship`** — next role. Both `review_requirements` are now satisfied at this exact ref
  (`independent-architecture` ratified 2026-08-25-1516; `independent-security` CLEAR
  2026-08-25-1540), so a `product-change` item routes to the ship gate. Expect the DoD gate to bounce
  on the unticked criteria (local commands, `validate` green on the pushed PR) — that is the correct
  mechanical outcome, not a security objection. **Two truth constraints ride with it:** `--check` is
  vacuous for this item, and no ship record may claim agents *refuse* or *degrade gracefully*.
- **`principal-swe-infra`** — owns the `P2-S1` pin-coverage pattern (now two guarantees), the P2-D1
  host-gate arm design, and the block-text options behind P2-D2. None required at this ref.
- **`principal-swe-architect`** — P2-D2 and P2-D3 touch a ratified seam; if either is ever taken, it
  is a seam change, not an infra tidy-up.
- **`principal-product-manager`** — steward calls only: whether P2-S1/P2-D1 are filed against
  `pack-split-ci-partition-checks` / `pack-split-host-gates`, when A1 (P2-D4) reopens, and the E1
  milestone/changelog wording. **This review creates no item.**
- **`@operator`** — owns R1-R6 **at pack publication, not now**. **No risk acceptance is requested by
  this review**, because no control is being waived.
