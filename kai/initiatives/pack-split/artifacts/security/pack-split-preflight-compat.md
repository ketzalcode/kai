# Security Assessment — pack-split-preflight-compat

**Mode:** CHANGE-REVIEW (independent-security)
**Scope/change_ref:** `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`
**Authorization:** read-only inspection of the local worktree at `C:\src\kai`; no shell in this
run, so nothing was executed, no active check was performed, and no implementation or release file
was edited.
**Sensitivity:** public open-source repository. No credentials, customer data, tenant identifiers,
private topology, or incident material is in scope or in this artifact.
**Verdict:** **CLEAR**

---

## Decision and scope

The decision this review supports: may `pack-split-preflight-compat` proceed past its
`independent-security` requirement at this exact ref, given that the item's whole purpose is a
**fail-closed trust boundary** — a generated department-pack agent that cannot reach a compatible
`kai-core` must refuse rather than degrade.

Reviewed, exactly:

1. every non-core generated pack agent refuses with exactly `KAI-CORE-MISSING` when the core probe
   is absent, its marker is invalid, or the contract version is skewed;
2. no fail-open path exists in the deterministic generated-body contract;
3. the canonical preflight is byte-pinned, directly follows the inherited-contract directive, and
   carries an explicit sole-exception clause that stops inherited-skill loading until the
   compatibility check passes;
4. core agents exclude the preflight, and core exclusively owns `kai-core-contract-v1`;
5. the probe returns exactly `KAI_CORE_READY` and `contract: 1`;
6. **N2** — the probe declares `tools: [view]` while its body forbids any tool call: acceptable
   least privilege, or a material concern?

**Deliberately excluded** (named so absence is not read as approval): the downstream
degraded-refusal block, the version-skew CI arm, cross-pack collision/namespace gating, migration,
committed pack trees, marketplace publication, empirical host gates, and any judgement about
whether CI is green on a pushed PR.

## Assets, data classes, actors, and trust boundaries

| | |
|---|---|
| **Primary asset** | The integrity of the durable coordination corpus (`kai/coordination/**`, `kai/initiatives/**`) and of any product change an agent makes on an operator's behalf. |
| **Secondary asset** | The truthfulness of the agent contract itself: an agent acting under partial or skewed rules is the harm, not a data breach. |
| **Data classes** | None sensitive. No secrets, credentials, tokens, PII, or telemetry are read, written, or transported by this change. Sole dependency `lectoria` is pinned to a full commit SHA and unchanged. |
| **Actors** | (a) the operator; (b) the Copilot host loading plugins; (c) a kai department-pack agent; (d) `kai-core`, the provider of the contract skills and of the probe; (e) any *other* plugin installed alongside kai. |
| **Trust boundary under test** | The department-pack ↔ core boundary: a department agent's rules live in another plugin. The preflight is the check that the boundary is *intact and version-compatible* before the agent acts. |
| **Explicitly NOT the boundary** | Authenticity. The probe answers "is a skill named `kai-core-contract-v1` present and does it report contract 1", not "is that skill genuinely core's". See R1. |
| **Shipped exposure at this ref** | **None.** `COMMITTED_PACKS` is `[]`, no `packs/` tree exists on disk, and the marketplace index still lists exactly one plugin (`kai`, `source: "."`). The injected preflight reaches no installed agent today; it exists in generator output, previews, and the CI pin. |

## Threat and abuse cases

| # | Abuse case | Prevention / detection at this ref | Residual |
|---|---|---|---|
| T1 | Core absent (department pack installed alone); agent proceeds on memory and corrupts coordination state or invents a contract | Block's refusal clause fires on "skill is unavailable"; the refusal explicitly forbids claiming work, taking a lease, writing workspace state, calling any other tool, and answering from memory | R2 (model-obeyed prose) |
| T2 | Version skew (core speaks a different contract); agent applies rules that no longer match | Refusal clause fires on "that exact contract line is not returned"; complement of the single continue clause | R2 |
| T3 | Silent drift between agents — some copies of the block demand a different version or omit refusal | Single canonical source file; byte-for-byte comparison against real generator output; exactly-one-copy assertion per department agent | none material |
| T4 | Fail-open introduced by a one-character edit (the finding that bounced the two prior refs) | The block now states the demanded version **once** and defines refusal as the complement; `validate-plugin.mjs:374–378` requires the set of demanded versions to be exactly `{CONTRACT_VERSION}` | R3 (future prose edits) |
| T5 | Preflight demoted below another injected block, so "before anything else" stops being true | `validate-plugin.mjs:416–424`: three bounds — after `**Inherits:**`, after the directive, and whitespace-only between the directive and the block | none material |
| T6 | A core agent carries the preflight and deadlocks on itself | Generator excludes `kind === 'core'`; validator asserts `copies === 0` for every `kai-core/` agent | none material |
| T7 | A department pack ships its own probe and self-certifies core presence | Skill→provider rule gives each skill exactly one provider; `kai-core-contract-v1: core` is an explicit reviewed override; `pack-preview --self-test` asserts no skill is provided by both core and a pack; validator asserts the probe materialises into `kai-core/` | R1 (a *third-party* plugin is a different case) |
| T8 | Probe is used as a capability or prompt-injection foothold, since it is the earliest instruction in a department session | Probe declares only `view` (read-only); body forbids any tool call and any restatement of kai rules; every agent that could carry the preflight already holds `view`, so marginal capability is zero — see the N2 decision | R1 |
| T9 | Refusal leaks environment detail to a caller | Refusal is exactly one token, "and nothing else"; success path is "never mention the check" | none |

## Findings

**P0: 0 — P1: 0 — P2: 2.** Neither P2 blocks this item, and neither requires a change at this ref.

### P2-S1 — the generated-agent pin is gated on a pack-name pattern that a future pack could fall outside

`scripts/validate-plugin.mjs:404` selects the bodies to assert on with
`/^kai-[a-z]+\/agents\/.+\.agent\.md$/`. Pack directories are `packPluginName(pack)` = `kai-<key>`,
and all five current keys (`core`, `engineering`, `product`, `gtm`, `personal`) are `[a-z]+`, so
coverage today is complete — every generated agent is asserted on.

A future pack key containing a hyphen or digit (`kai-customer-success`, `kai-data-eng`) would not
match, and that pack's agents would **silently skip** the copy-count, position, and adjacency
assertions. This is a **pin-coverage** gap, not a live fail-open: the generator injects on
`p.kind !== 'core'`, so those agents would still carry the block — the loss is verification, which
matters only if a second defect appears at the same time.

- **Severity rationale:** no exploit path today, requires a partition extension that does not
  exist, and the partition is locked. Bounded hardening.
- **Smallest fix, if ever taken:** widen to `kai-[a-z-]+`, or derive the expected set from
  `PACK_ORDER`/`planManifests` instead of a literal pattern.
- **Owner:** `principal-swe-infra`, naturally folded into `pack-split-ci-partition-checks` (which
  already owns partition/namespace work and already touches this file). **No item is created by
  this review** — filing is the steward's call.

### P2-S2 — evidence gap: no host-run evidence that an agent carrying the block actually refuses

What the shipped gates prove is precise and narrower than "agents refuse":

- `evaluatePreflight` (`scripts/pack-preview.mjs:91–116`) is a **JS re-implementation** of the
  block's rule, evaluated against a built preview's probe file. The `--no-core` and `--contract 2`
  arms therefore prove that those builds genuinely omit/skew the probe and that a rule of that
  shape yields the exact token.
- The validator proves every generated department agent carries the **identical, correctly placed**
  instruction.

Neither is evidence that a model obeying that instruction refuses. That is an empirical host
claim, and it is already owned downstream by `pack-split-host-gates` (certification) and
`pack-split-host-semantics-spike` (macOS/cloud/install-order semantics).

- **Why it is not release-blocking here:** this item's acceptance is generation + byte-pin, not
  host behaviour, and I was explicitly scoped out of host empirical gates.
- **What it does bind:** no downstream record, changelog entry, or release note may state that
  pack agents *refuse*. The truthful claim is that they *carry a pinned fail-closed instruction*.
- **Owner:** `principal-swe-infra` for the gate design; **operator** for accepting the interim gap.

## Required controls and acceptance criteria

No control is required before this item proceeds. The controls below were **verified present** and
are recorded so a later change cannot quietly remove them.

| # | Control | Acceptance (testable) | Where verified |
|---|---|---|---|
| C1 | Refusal is the exact complement of the continue clause | The block contains exactly one continue clause (`KAI_CORE_READY` **and** exactly `contract: 1`) and one refusal clause defined as absence of that exact line — no second independent version literal | `scripts/lib/preflight-block.txt` |
| C2 | Exactly one demanded version, pinned to the shared constant | `demandedVersions.length === 1 && demandedVersions[0] === CONTRACT_VERSION`, else hard error | `scripts/validate-plugin.mjs:374–378` |
| C3 | Probe name and refusal token come from shared constants | Block must name `` `kai-core-contract-v1` `` and carry `KAI-CORE-MISSING` | `validate-plugin.mjs:368–373` over `pack-plan.mjs:23–25` |
| C4 | Load-order override is pinned verbatim | Block must contain "Do not load or apply any inherited skill until this preflight passes." | `validate-plugin.mjs:379–381` |
| C5 | Probe is rigid | `^KAI_CORE_READY$` present and `^contract: (\S+)$` equals `CONTRACT_VERSION` | `validate-plugin.mjs:385–398` over `skills/kai-core-contract-v1/SKILL.md` |
| C6 | Exactly one verbatim copy per department agent, zero per core agent | Byte comparison over **real `materializePacks` output**, not a preview | `validate-plugin.mjs:402–414` |
| C7 | The preflight is the first executable instruction | After `**Inherits:**`; after the directive; whitespace-only between directive end and block start | `validate-plugin.mjs:416–424` |
| C8 | Core exclusively provides the probe | Probe materialises at `kai-core/skills/kai-core-contract-v1/SKILL.md`; no skill has two providers | `validate-plugin.mjs:427–429`; `pack-preview.mjs` self-test (`core ∩ local = ∅`) |
| C9 | Missing/empty canonical block is a hard failure | Falsy `preflight` ⇒ error; any error ⇒ `process.exit(1)` | `validate-plugin.mjs:363–366`, `:1083–1089` |
| C10 | The refusal forbids the state-changing actions a core-less agent could otherwise take | Refusal text names: claim work, take a lease, write workspace state, call any other tool, answer from memory | `scripts/lib/preflight-block.txt` |
| C11 | Gates actually run on every PR/push | `validate-plugin.mjs`, `pack-preview --self-test`, `--check` are steps in the `validate` workflow; `permissions: contents: read` | `.github/workflows/validate.yml` |

### Defense-in-depth worth naming

Injection is keyed on `p.kind` (`pack-plan.mjs:234`) while the validator's expectation is keyed on
the `kai-core/` directory prefix (`validate-plugin.mjs:406`). These are **independent keys**: a
kind/directory mismatch in either direction produces a named CI failure rather than a silent skip.
That is a genuine second control, not a coincidence, and should be preserved.

### N2 — DECISION: `tools: [view]` on the probe is **accepted** as adequate least privilege

Grounded in shipped host capability, not hypothetical escalation:

1. **`tools: []` is not expressible.** `loaderErrors` in `scripts/lib/loader-contract.mjs` rejects
   a skill with missing `tools`, a non-inline-array `tools`, **and** an empty inline array. Every
   skill must declare at least one host tool. The choice is not "none vs `view`".
2. **The repo's declared semantic is a ceiling, not a grant.** `scripts/validate-plugin.mjs`
   (Inherited-skill tool requirements) states it explicitly: *"A skill's `tools` is what that
   skill may use when loaded"*, and the design deliberately refuses to treat a skill's `tools` as
   a requirement on the agent — that is what the separate opt-in `requires_tools:` exists for.
   Under this semantic `[view]` bounds the probe; it grants nothing.
3. **Marginal capability is zero even under the opposite semantic.** All **56** agent files
   declare `view` in their `tools:` line (verified by reading every `^tools:` line under
   `agents/`). No agent that could carry the injected preflight gains a capability it did not
   already hold, so the ceiling-vs-grant ambiguity is **immaterial today** rather than merely
   unlikely.
4. **`view` is read-only.** The probe declares no `bash`/`shell`, no `create`/`edit`, no
   `web_fetch`/`web_search`, no `task`/`write_agent`. Even a fully subverted probe body cannot
   mutate state, execute, or exfiltrate through its declared set.
5. **The probe is inert in the shipped product at this ref.** It is not `user-invocable`, no agent
   inherits it, no `packs/` tree exists, and the monolith injects no preflight — which is exactly
   why the validator's firing-path check exempts it, derived from the block rather than hardcoded
   (`validate-plugin.mjs:474`).

**Not required, recorded as a watch condition:** `glob` would be a strictly narrower declaration
(path enumeration, no file contents). Changing it is **not** warranted here — it would move a
byte-pinned trust-boundary file for no measured risk reduction. The argument in (3) is
conditional on every preflight-carrying agent holding `view`; if a future agent ships **without**
`view` **and** the host turns out to treat skill `tools` as a grant, the probe would become a
genuine (read-only) capability expansion. Both halves of that condition belong to
`pack-split-host-semantics-spike`.

## Residual risk and decision owner

| # | Residual risk | Exposure at this ref | Decision owner |
|---|---|---|---|
| R1 | The boundary proves **availability and compatibility, not authenticity**. Any plugin installed alongside kai that provides a skill named `kai-core-contract-v1` could satisfy or shadow the probe, and the probe is the earliest instruction in a department session. A *compromised core* is not a widening (core already supplies the operating rules — that is total compromise either way); a *third-party same-named skill* is. | **None shipped.** No packs committed or published; nothing installs a department pack today. | **Operator**, at pack publication. Technical unknowns are owned by `pack-split-host-semantics-spike` (cross-plugin resolution, collision, load order); gating by `pack-split-crosspack-validator` / `pack-split-ci-partition-checks`. |
| R2 | The control is **instruction-level, not host-enforced**. Byte-pinning and position-pinning are the strongest mechanical guarantees available at this layer; obedience is model behaviour. | Present by design; unavoidable at this layer. | **Operator** (risk acceptance); empirical evidence owed by `pack-split-host-gates`. |
| R3 | The canonical block's **semantic** integrity rests on human review of one file. CI pins four properties (probe name, refusal token, exactly one version literal equal to the constant, the override sentence); it cannot prove the absence of a *future* fail-open clause added elsewhere in the prose. | No such clause exists at this ref — verified by reading the whole file. | **Repo review process**: both required reviews re-bind on any `change_ref` change, which is the control. No change requested. |

**No residual risk is accepted by this review.** Recording a risk is not accepting it; acceptance
is the operator's, and none is required for this item to proceed.

## Sanitized evidence register

All claims are `observed` in the local worktree unless marked otherwise. Nothing was executed.

| ID | Claim | Kind | Source |
|----|-------|------|--------|
| E1 | Continue and refusal clauses are exact complements over a single version literal; refusal forbids claiming work, leases, workspace writes, other tool calls, and answering from memory | observed | `scripts/lib/preflight-block.txt` (whole file) |
| E2 | Probe returns exactly `KAI_CORE_READY` / `contract: 1`, forbids any tool call and any restatement of kai rules, declares `tools: [view]`, is not `user-invocable` | observed | `skills/kai-core-contract-v1/SKILL.md` |
| E3 | Shared constants `CONTRACT_SKILL` / `CONTRACT_VERSION` / `REFUSAL`; core-only override for the probe; injection excludes `kind === 'core'`; anchor walks the whole directive | observed | `scripts/lib/pack-plan.mjs:23–25`, `:92`, `:222–258`, `:265–272` |
| E4 | Canonical-block pins C2–C4; probe pins C5; generated-body pins C6–C8; missing block is a hard error; any error exits 1 | observed | `scripts/validate-plugin.mjs:363–429`, `:474`, `:1083–1089` |
| E5 | Root agents must carry exactly one `**Inherits:**` line as the first body line and the verbatim directive, both hard errors — so the position checks always have a real anchor and the "no anchor" branch is unreachable for shipped agents | observed | `scripts/validate-plugin.mjs:276–293` |
| E6 | `evaluatePreflight` re-implements the block's rule in JS; three arms (ready / no-core / contract 2); skew synthesis exists | observed | `scripts/pack-preview.mjs:91–128`, `:331–378` |
| E7 | Skill `tools` is required and non-empty by the loader contract; `SUPPORTED_TOOLS` allowlist | observed | `scripts/lib/loader-contract.mjs` |
| E8 | All 56 agent files declare `view` | observed | `agents/*.agent.md`, `^tools:` lines |
| E9 | No shipped exposure: no `packs/` directory; `COMMITTED_PACKS` is `[]`; marketplace lists exactly one plugin, `kai` at `source: "."` | observed | filesystem; `scripts/lib/pack-plan.mjs`; `.github/plugin/marketplace.json` |
| E10 | Supply chain unchanged: one git dependency, `lectoria`, pinned to a full commit SHA; both lock version fields at `0.59.0`; no new dependency | observed | `package.json`, `package-lock.json:3,9,11,1211` |
| E11 | Gates run on every PR and push with `permissions: contents: read` | observed | `.github/workflows/validate.yml` |
| E12 | Probe registered in the host-discoverable inventory fixture | observed | `test/fixtures/inventory.json:77` |
| E13 | A git object named `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7` exists in this repository's object store | verified-defensive | `.git/objects/33/83d7f2…` present (read-only existence check; content not decoded) |
| E14 | The ref is unreachable from any ref and absent from the reflog — consistent with the `git stash create` object the coordination contract permits, and consistent with the prior two refs on this item | observed | `.git/HEAD`, `.git/refs/heads/kai/feat/29-preflight-compat` (= `9d16e075…`), `.git/logs/HEAD` |
| E15 | The worktree is byte-identical to the ref for all implementation/release files, and full `npm test` passed | **reported** (operator attestation) | HANDOFF 2026-08-25-1245 / operator dispatch |

## Unknowns and exclusions

- **Not verified (no shell in this run):** byte-identity between the worktree and
  `3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`, and the green `npm test`. Both are **operator
  attestations** and were treated as *input*, not as the basis of the verdict. My verdict rests on
  source I read directly at the paths in the register. **If the worktree is not byte-identical to
  that object, this review does not bind** and must re-run against the true ref.
- **Not verified:** the object type/tree of the change_ref (existence only — I cannot decode a
  zlib-compressed loose object without a shell).
- **Not assessed, by scope:** degraded-refusal, the version-skew CI arm, cross-pack collision and
  namespace gating, migration, committed pack trees, marketplace publication, empirical host gates,
  and CI status on a pushed PR.
- **Unknown, routed not resolved:** whether the Copilot host treats a skill's `tools` as a ceiling
  or a grant, and how it resolves same-named skills across plugins. Immaterial at this ref (all 56
  agents hold `view`; nothing is published), owned by `pack-split-host-semantics-spike`.
- **Not a finding, recorded so it is not rediscovered as one:** the probe now ships inside the
  monolith and is reachable only by explicit dispatch (no inheritance, not `user-invocable`). A
  spurious load in a monolith session would emit two lines and stop — a robustness/UX wrinkle with
  no confidentiality, integrity, or privilege impact. Not attacker-controlled. No change requested.

## Run constraints and read log

**The `.kai/runs/` lane was deliberately not used, and that is stated rather than silently
skipped.** That lane exists for evidence that must *not* become durable — exploit detail, private
topology, customer identity, secrets, incident material. **This review produced none of it:** the
target is a public repository, the change touches generator prose, a CI pin, and a probe skill, and
no credential, token, PII, tenant identifier, or endpoint was read or produced. With nothing to
segregate, a second copy would only drift from this one. (Mechanically, this run also had no shell
and the file tool creates one directory level per write, so the dated run path could not be made
without leaving placeholder files behind — but the reason above stands on its own.)

Files opened, all read-only:

```
scripts/lib/preflight-block.txt          scripts/lib/inherits-block.txt
scripts/lib/pack-plan.mjs                scripts/lib/loader-contract.mjs
scripts/validate-plugin.mjs              scripts/pack-preview.mjs
skills/kai-core-contract-v1/SKILL.md     agents/*.agent.md  (all 56 `tools:` lines)
.github/workflows/validate.yml           .github/plugin/marketplace.json
package.json  package-lock.json          test/fixtures/inventory.json
.kai/manifest.json                       (schema_version 2 — current contract)
.git/HEAD  .git/refs/heads/kai/feat/29-preflight-compat  .git/logs/HEAD  .git/packed-refs
.git/objects/33/83d7f2476f6ccdec5b4d3077783a13fe47eeb7   (existence only; not decoded)
kai/coordination/items|threads/pack-split-preflight-compat.md
kai/coordination/{ACTIVE,BOARD}.md       kai/initiatives/pack-split/log.md
skills/kai-core-work-coordination/SKILL.md  skills/kai-core-workspace-conventions/SKILL.md  AGENTS.md
```

Nothing outside the repository was read. Nothing was executed. The only files written by this
review are this artifact, the item record, the thread, and the board/pointer/log refreshes — **no
implementation or release file was touched.**

**`scripts/activity.mjs` was not appended:** `kai-core-work-activity` writes through a shell this
run does not have. Per that skill a failed append is reported and dropped — never retried, never
allowed to gate the work. The initiative log was updated by hand, as prior runs on this item did.

## Handoffs

- **`workflow-ship`** — next role. All `review_requirements` are satisfied at this exact ref
  (`independent-architecture` ratified 2026-08-25-1248; `independent-security` CLEAR
  2026-08-25-1257), so `kai-core-work-coordination` → *Review routing* step 4 routes a
  `product-change` item to the ship gate. Expect the DoD gate to bounce on the unticked
  "`validate` green on the pushed PR" criterion — that is the correct mechanical outcome, not a
  security objection.
- **`principal-swe-infra`** — owns P2-S1 (pin-coverage pattern) and the gate design behind P2-S2.
  Neither is required at this ref.
- **`principal-product-manager`** — steward call on whether P2-S1 is filed against
  `pack-split-ci-partition-checks` or dropped. This review creates no item.
- **`@operator`** — owns R1 and R2 at publication, not now. **No risk acceptance is requested by
  this review**, because no control is being waived.
