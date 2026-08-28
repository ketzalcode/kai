---
type: work-item
id: area-plugins-host-tool-conformance
title: Live host-tool conformance probe — measure the real allowlist vocabulary and runtime grants
initiative: area-plugins
milestone: allowlist-repair
delivery_class: product-change
state: in-review
resume_state: null
priority: 1
owner: null
next_role: workflow-ship
target: A reproducible probe that measures what the live Copilot CLI accepts and grants, replacing hand-maintained guesswork
artifact_target: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md
context_artifacts:
  - kai/coordination/threads/area-plugins-tool-allowlist-fix.md
  - scripts/lib/loader-contract.mjs
  - scripts/host-contract.mjs
  - scripts/validate-plugin.mjs
  - CHANGELOG.md
touches:
  - kai/coordination/items/area-plugins-host-tool-conformance.md
  - kai/coordination/threads/area-plugins-host-tool-conformance.md
  - kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md
  - kai/initiatives/area-plugins/log.md
  - scripts/host-tool-probe.mjs
  - scripts/lib/tool-conformance.mjs
  - test/fixtures/host-tool-probe/**
  - scripts/lib/loader-contract.mjs
  - scripts/host-contract.mjs
  - packs/kai-core/scripts/lib/loader-contract.mjs
  - packs/*/plugin.json
  - packs/*/package.json
  - packs/*/package-lock.json
  - package.json
  - package-lock.json
  - plugin.json
  - .github/plugin/marketplace.json
  - CHANGELOG.md
  - README.md
  - test/README.md
  - docs/reference/plugin-structure.md
depends_on: []
waiting_on_questions: []
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    phase: design
    change_ref: null
    verdict: approved
    evidence: kai/coordination/threads/area-plugins-host-tool-conformance.md (REVIEW 2026-08-27-2245)
    record_revision: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md revised 2026-08-27-2245 at item version 3
    timestamp: 2026-08-27-2245
    satisfies_design_gate: true
    satisfies_requirement: false
    requires_exact_ref_confirmation: true
  - role: principal-swe-architect
    kind: independent-architecture
    phase: implementation
    change_ref: 4d711779408c8f675a740b5e243686d9e66a5ce4
    verdict: approved
    evidence: kai/coordination/threads/area-plugins-host-tool-conformance.md (REVIEW 2026-08-28-0112)
    record_revision: kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md revised 2026-08-28-0112
    timestamp: 2026-08-28-0112
    satisfies_design_gate: true
    satisfies_requirement: true
change_ref: 4d711779408c8f675a740b5e243686d9e66a5ce4
version: 13
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-28-0115
---

## Outcome

A probe that measures the live host's accepted allowlist vocabulary **and** the
actual runtime grants, so the repo stops asserting a tool contract it never
verified. This is the first implementation item; the warning-free replacement
follows from its evidence and not before.

## Acceptance

- [x] The documented vocabulary supplied by the operator is recorded verbatim as
      the baseline: primary aliases `execute`, `read`, `edit`, `search`,
      `agent`, `web`, `todo`; compatible aliases `shell` / `Bash` /
      `powershell`, `Read` / `NotebookRead`, `Edit` / `MultiEdit` / `Write`,
      `Grep` / `Glob`, `custom-agent` / `Task`; unrecognized names ignored.
      Official semantics are also recorded accurately: omission or
      `tools: ["*"]` enables all available tools, while `tools: []` disables
      all tools.
- [x] The probe distinguishes **accepted-by-validator** from
      **granted-at-runtime**, because the operator's live CLI warns on
      lowercase `create`, `edit`, and `grep` while runtime capability remains —
      that drift is the defect and the probe must be able to express it.
      **Satisfied structurally and proven by outcome:** the two channels stayed
      separate under measurement, and the validator channel reported
      `unobserved` rather than being collapsed into the runtime result or
      silently reported as clean. See the measurement record below.
- [x] The probe is reproducible, records `copilot --version`, and emits a
      machine-readable result a later PR can diff against.
      **Proven across two CLI versions** (`1.0.79` and `1.0.81`) via
      `host.copilot_version` plus the resolved executable path.
- [x] `scripts/lib/loader-contract.mjs`'s false "single source of truth for how
      a Copilot host parses frontmatter" claim is corrected; `SUPPORTED_TOOLS`
      is re-grounded on measured evidence or explicitly labelled as a
      lint-only heuristic.
- [x] **No capability is stripped in this item.** No `agents/**` or `packs/**`
      body is edited here.
- [x] `tools: ['*']` and omission are evaluated against least privilege and a
      recommendation recorded.
- [x] The third copy of `SUPPORTED_TOOLS` in
      `packs/kai-core/scripts/lib/loader-contract.mjs` is accounted for.

### Acceptance status after the design pass (2026-08-27-2205)

Four of seven are truthfully satisfied. The three unchecked boxes describe a
**built, runnable probe and an applied source edit**, and this pass produced
neither — the dispatch STOP CONDITION forbade editing `loader-contract.mjs`, and
the session had no shell, so no script could be authored into gates it could not
run. Each is design-complete and specified to be implemented mechanically:

| box | status | where it is specified |
|---|---|---|
| 2 — validator vs runtime, non-collapsing | design-complete, not built | design §4.1, §4.2, §4.4 (`findings.warned_and_granted`); self-test assertion 1 exists solely to prove the two axes cannot merge |
| 3 — reproducible, records `copilot --version`, diffable | design-complete, not built | design §4.4 (`schema_version`, `probe_version`, `host` and channel-status blocks), §4.6 (versioned machine-report path), §4.7 (determinism assertion 7) |
| 4 — loader-contract correction | specified, not applied | design §6.2, including the coupled edit at `scripts/host-contract.mjs:179` |

Box 4 additionally gained a finding: the false claim is **published** inside
`kai-core` (`packs/kai-core/scripts/generate-catalog.mjs:23` pulls the contract
into the shipped import closure), so it is a correctness fix rather than a
tidy-up.

### Implementation status after the 2026-08-27-2251 pass

The probe, pure classifier, synthetic fixtures, package wiring, loader-contract
correction, release metadata, and expected generated pack updates are authored.
The current operator instruction added explicit-path offline `--update` and
`--check` modes; it did not authorize a committed live baseline or live-host CI.

This pass had no process-execution tool. `--self-test`, `--plan`, the live probe,
syntax checks, pack regeneration/parity, and `npm test` are therefore not run.
Because plan inspection is a hard precondition, no live command was attempted
and no findings or baseline were manufactured. The item remains blocked before
`in-review`; a shell-bearing continuation must run the gates, create a
`change_ref`, then route exact-ref conformance review to
`principal-swe-architect`.

## Notes

Grounded finding this replaces: infra measured itself as the test case —
declared `create`/`edit`/`grep`, was warned on all three, and used all three.
The genuinely absent capability was **shell**, which is not warned about. The
warned set and the broken set are disjoint, so a naive rename would have
stripped real capability from 49 agents to quiet a cosmetic log.

True surface is **214** declaration sites (56 root agents + 56 generated
mirrors + 51 + 51 skill files), not the 112 first assumed.

### Design review and implementation routing (2026-08-27-2245)

The revised design is **approved** and bound to the dated decision revision
with `change_ref: null`; no implementation exists yet. The design review does
not satisfy the eventual exact-ref product-change review, so
`satisfies_requirement: false` remains explicit until the implementation returns
with a real `change_ref`.

`Q-area-plugins-host-tool-conformance-01` is answered: the main shell-bearing
agent is authorized to plan and run the bounded probe. The operator-action
blocker is cleared, `waiting_on_questions` is empty, and the item is `ready`
for `principal-swe-infra`.

The implementation touch set is widened only for the approved first pass:
the probe and pure core, synthetic fixtures, package wiring, the
loader-contract wording correction plus coupled assertion/generated mirror,
and release metadata forced by existing gates. It reserves no `agents/**`,
`skills/**`, or declaration migration.

### Measurement executed — records-only reconciliation (director, 2026-08-28-0055)

The main agent implemented the probe in the working tree and **executed it**.
This entry reconciles the record to that evidence. It is records-only: no
script, manifest, agent, or skill was edited by this pass.

**Implementation defects found and fixed before measurement** — each one is the
kind that would have produced a confidently wrong result:

- Local `--plugin-dir` agents require **qualified** names
  `<ephemeral-plugin>:<agent>`; unqualified names exited `1`. The probe now
  qualifies selected, delegated, and helper agents. An unqualified run would
  have looked like a capability denial rather than a naming error.
- Outer CLI `--allow-all-tools` was added so **permission policy cannot
  masquerade as an inner agent-allowlist denial**. The scratch workspace stays
  isolated.
- `--copilot-entry <absolute versioned index.js>` was added because a PATH
  `.cmd` shim reported `1.0.79` externally while `spawnSync('copilot')` still
  resolved the active `1.0.81` executable. **Version attribution was wrong
  before this fix**; exact-version execution is now proven by
  `host.copilot_version` plus the resolved path.
- `--rows` added for bounded retries.

**Offline self-test: 11/11 passed.**

**Runtime channel — `observed`, on BOTH `1.0.79` and `1.0.81`:**

| row | result |
|---|---|
| `R2-primary` | valid, direct **and** delegated; exercised read / edit / create / search / execute / agent successfully |
| `R8-repo-current` | valid, direct **and** delegated; same capabilities exercised successfully |
| `R9-control` | valid; `read` and `search` worked, `write` / `execute` / `agent` did not — exactly consistent with only `read` plus bogus names being effective |

`R9-control` is the load-bearing runtime control: bogus names granted no tested
capability while the real `read` declaration remained effective. This
corroborates the documented **"unrecognized names are ignored"** rule, but does
not independently prove validator treatment: because the validator channel was
unobserved, `findings.bogus_ignored` correctly remains `null`.

**Validator channel — honestly `unobserved`.** Neither noninteractive prompt
path emitted validator warnings, *including for the bogus controls*. Prompt
mode cannot reproduce the interactive startup warning surface. This is recorded
as `unobserved`, **not** as "no warnings occur": the user-reported warning on
interactive startup **remains real and is not refuted by this run**. A run that
reported the validator channel clean because it could not see it would have
been the exact self-deception the two-channel design exists to prevent.

**Conclusion the evidence supports, and no more:** the official primary aliases
are **runtime-safe on both `1.0.79` and `1.0.81`**. Absence of interactive
warnings is **not** claimed.

**Exact reports (session files, not committed):**
`host-tool-probe-targeted-1.0.81.json` (current) and
`host-tool-probe-targeted-1.0.79.json` (retained), the latter launched through
`<redacted>/1.0.79/index.js` with the report self-identifying CLI `1.0.79`.
**No live baseline is committed** — the
design's separation of synthetic parser fixtures from live host evidence holds.

**Operational note:** full runs showed occasional model/delegated transcript
timeout and truncation. Bounded `--rows` retries collect the missing evidence
without relaunching the full matrix.

**Operator blocker cleared.** `Q-area-plugins-tool-allowlist-fix-01` is
answered by measurement; `waiting_on_questions` is empty and the item is no
longer `blocked`.

**Exact-ref review complete.** `principal-swe-architect` approved implementation
commit `4d711779408c8f675a740b5e243686d9e66a5ce4` at 2026-08-28-0112. The item is
`in-review`, the implementation review satisfies the declared requirement, and
`next_role` is `workflow-ship` for fresh PR-head CI and publication preparation.
This is not a shipped claim.

### Wildcard fact — status of the correction

`tools: ["*"]` is **documented and supported**: official GitHub documentation
states that omission or `tools: ["*"]` enables all available tools, `tools: []`
disables all tools, and unrecognized names are ignored.

This was already corrected in the decision artifact (§5 and the observed-source
block) during the 2026-08-27-2245 architecture review, which explicitly
"corrects the wildcard fact, keeps explicit enumeration as Kai's
least-privilege policy." **Kai's rejection of `["*"]` and omission stands — as
a deliberate least-privilege policy ruling, never as a claim that the host does
not recognize the token.**

One superseded statement survives in the append-only thread at
`kai/coordination/threads/area-plugins-host-tool-conformance.md:139`
("`*` is not in the documented vocabulary"), from the design pass that had no
web tool bound. It is **corrected in the same thread at line 422** and again
here. It is deliberately **not rewritten**: the thread is the audit trail, and
erasing a superseded claim would hide that the correction happened.
