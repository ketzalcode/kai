---
type: work-item
id: area-plugins-host-tool-conformance
title: Live host-tool conformance probe — measure the real allowlist vocabulary and runtime grants
initiative: area-plugins
milestone: allowlist-repair
delivery_class: product-change
state: blocked
resume_state: null
priority: 1
owner: null
next_role: principal-swe-architect
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
depends_on: []
waiting_on_questions:
  - Q-area-plugins-host-tool-conformance-01
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: null
version: 2
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2205
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
- [ ] The probe distinguishes **accepted-by-validator** from
      **granted-at-runtime**, because the operator's live CLI warns on
      lowercase `create`, `edit`, and `grep` while runtime capability remains —
      that drift is the defect and the probe must be able to express it.
- [ ] The probe is reproducible, records `copilot --version`, and emits a
      machine-readable result a later PR can diff against.
- [ ] `scripts/lib/loader-contract.mjs`'s false "single source of truth for how
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
| 3 — reproducible, records `copilot --version`, diffable | design-complete, not built | design §4.4 (`host` block), §4.6 (`--update` / `--check`), §4.7 (determinism assertion 7) |
| 4 — loader-contract correction | specified, not applied | design §6.2, including the coupled edit at `scripts/host-contract.mjs:179` |

Box 4 additionally gained a finding: the false claim is **published** inside
`kai-core` (`packs/kai-core/scripts/generate-catalog.mjs:23` pulls the contract
into the shipped import closure), so it is a correctness fix rather than a
tidy-up.

## Notes

Grounded finding this replaces: infra measured itself as the test case —
declared `create`/`edit`/`grep`, was warned on all three, and used all three.
The genuinely absent capability was **shell**, which is not warned about. The
warned set and the broken set are disjoint, so a naive rename would have
stripped real capability from 49 agents to quiet a cosmetic log.

True surface is **214** declaration sites (56 root agents + 56 generated
mirrors + 51 + 51 skill files), not the 112 first assumed.

### Why `blocked` and not `in-review` (2026-08-27-2205)

The design is complete and reviewable, but `in-review` is not available and not
truthful:

1. **`change_ref` is required before `in-review`** (`kai-core-work-coordination`),
   and a shell-less session cannot produce a commit SHA. `workspace-doctor`
   rejects an `in-review` item with no `change_ref` — its own `needs-ref.md`
   fixture proves it. Setting `in-review` would break the doctor to look further
   along.
2. **Three acceptance boxes need work no role here can do**: authoring the probe
   into gates that cannot be run, and a live measurement only `@operator` can
   produce.
3. A blocking question is open — which is the literal definition of `blocked`.

`next_role` is `principal-swe-architect` because the declared
`independent-architecture` review can and should proceed **now, against the
design, before the probe is written**: a verdict that changes the run matrix or
the output schema after the code exists wastes the write. `@operator` is carried
in `waiting_on_questions`, not in `next_role`, because the two can proceed in
parallel.

`touches` is narrowed to the three files this pass actually wrote.
**`scripts/host-contract.mjs` and `scripts/lib/loader-contract.mjs` are no longer
reserved by this item** — the pass that applies the correction must widen
`touches` again before editing them.
