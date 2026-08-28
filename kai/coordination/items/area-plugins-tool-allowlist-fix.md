---
type: work-item
id: area-plugins-tool-allowlist-fix
title: Repair every invalid tool-allowlist declaration across all 56 agents and their generated mirrors
initiative: area-plugins
milestone: allowlist-repair
delivery_class: product-change
state: blocked
resume_state: ready
priority: 1
owner: null
next_role: "@operator"
target: agent frontmatter tool allowlists (root agents/ + generated packs/*/agents/)
artifact_target: null
artifact_target_status: blocked-on-directory-creation; durable record is this item's thread until kai/initiatives/area-plugins/ exists
context_artifacts:
  - kai/coordination/threads/area-plugins-tool-allowlist-fix.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - agents/principal-product-manager.agent.md
  - agents/creative-video-director.agent.md
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
touches:
  - agents/
  - packs/
  - scripts/validate-plugin.mjs
  - CHANGELOG.md
  - package.json
  - package-lock.json
depends_on: []
waiting_on_questions: [Q-area-plugins-tool-allowlist-fix-01]
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews: []
change_ref: null
version: 3
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-27-2138
---

## Outcome

Every kai agent declares only tool names the Copilot CLI custom-agent schema
actually accepts; the repeated runtime warnings
`Unknown tool name in the tool allowlist: "create" / "edit" / "grep"` stop; the
committed generated trees are regenerated so `pack-preview --check` byte parity
holds; and no agent quietly loses a capability in the process.

## Acceptance

- [ ] **Schema established from live evidence, not memory.** The record cites the
      current Copilot CLI custom-agent tool schema — the accepted tool-name set
      and where it is documented — from the running host and current
      documentation, with the observation date and method. A parallel `research`
      consultation is producing this; consume its findings rather than
      re-deriving them.
- [x] **Complete enumeration.** Every invalid declaration is located across
      **all 56** root `agents/*.agent.md` and their **56** generated mirrors
      under `packs/*/agents/` (112 files). The enumeration is shown in full —
      file, current `tools:` value, which tokens are rejected — not sampled and
      not summarised as a count.
- [ ] **A portable replacement is defined and applied.** For each rejected token,
      the record names the accepted equivalent. Where a rejected token has **no**
      accepted equivalent, the record says so explicitly and states what
      capability the agent loses; it does not drop the token silently. A
      capability loss that changes what an agent can do is a scope question and
      returns to the steward before it is applied.
- [ ] **No agent body changes beyond its frontmatter `tools:` line.** Every other
      span of every touched file is byte-identical. This is the same bounded
      discipline as the A1 generator-derived exception and is verified the same
      way — by diff, not by assertion.
- [ ] **Generated trees regenerated and byte parity re-established.**
      `pack-preview --check` is green; `--gate partition`, `--gate collision`,
      `--gate partial-install`, and `--gate version-skew` are green;
      `validate-plugin` and `release-guard` pass.
- [ ] **Topology-neutral, per the milestone-1 carve-out in scope-brief A11.** The
      change alters no `PACKS`, `PACK_ORDER`, `PACKS_DIR`, `MARKETPLACE`,
      `SKILL_OWNER_OVERRIDES`, plugin identity, or marketplace name, and alters
      no `scripts/lib/preflight-block.txt`, `degraded-block.txt`, or
      `inherits-block.txt` content. **The PR names all three carve-out clauses
      explicitly** — a change that cannot claim all three is not exempt and
      escalates to the steward.
- [ ] **The warnings are gone, labelled honestly.** State the observation method.
      No agent in the authoring session has a shell, so an absence claimed
      without a run is `reported`, not `observed`, and the record must say which
      it is. `shipped` still requires operator deployment and verification.
- [x] **Regression guard considered, not assumed.** State whether
      `validate-plugin` can pin the accepted tool-name set so this defect cannot
      silently return. If a guard is cheap, add it; if it is not, say why and
      leave it — adding a gate is not automatically in scope.

## Sequencing constraint (steward, binding)

This item touches **all 56 agent bodies plus all 56 generated mirrors**. It
therefore collides head-on with `area-plugins-m2-mode-selection` (milestone 2,
PR-3), which rewrites the 49 non-core agent bodies to swap the preflight block
for the standalone block.

**Two whole-fleet rewrites must not be in flight at once.** This item ships
**first**, and it must be `shipped` before PR-3 opens. That ordering is the
entire reason milestone 0 exists: if both land together, a red `--check` cannot
tell you whether the tool-name repair or the block swap broke byte parity — the
same attribution discipline that produced the initiative's phase order.

Any other work proposing to touch `agents/**` or `packs/**/agents/**` while this
item is open must route through `principal-swe-manager` for sequencing.

## Evidence

- Grounded 2026-08-27 from `C:\src\kai` by file read: all 56 root
  `agents/*.agent.md` carry a `tools:` line; all 56 generated
  `packs/*/agents/*.agent.md` carry one too (`kai-engineering` 20,
  `kai-gtm` 11, `kai-product` 9, `kai-personal` 9, `kai-core` 7). The tokens
  `"create"`, `"edit"`, `"grep"`, `"view"`, `"glob"` all appear across those
  declarations, so the reported warnings are consistent with what is on disk.
- Filled as work progresses: schema citation, full enumeration, diff, gate runs,
  `--check` result, deployment run.

- **2026-08-27-2138 — `principal-swe-infra` diagnosis (no `agents/**` or
  `packs/**` file edited).** Full record in the thread. Six boxes remain
  unchecked and the reasons are recorded, not glossed:

  - **Box 1 (schema from live evidence) — NOT satisfied.** The accepted
    allowlist vocabulary is still unknown. What was established is the
    *granted* set on one host, which is a different thing and is not allowed to
    stand in for it.
  - **Box 2 (complete enumeration) — satisfied, and the surface is larger than
    stated.** All 56 root agents and all 56 mirrors enumerated with exact
    arrays; every mirror's `tools:` line byte-matches its root. Beyond the
    stated 112: **51 root `skills/*/SKILL.md` + 51 skill mirrors also declare
    the warned tokens, and `packs/kai-core/scripts/lib/loader-contract.mjs` is
    a third copy of `SUPPORTED_TOOLS`. True surface: 214 files.** Routed to the
    steward as PROPOSAL-3 rather than absorbed.
  - **Boxes 3-7 — NOT satisfied, deliberately.** No fix applied, so no diff, no
    regeneration, no `--check`, no carve-out claim, no warning-absence claim.
  - **Box 8 (regression guard considered) — satisfied.** Three options recorded
    with costs; all three are `expands-scope` and are proposals, not commits.
    Finding: `SUPPORTED_TOOLS` proves agents agree with a hand-maintained list
    and nothing proves the list agrees with the host, so this defect class
    reached users at `1.0.4` with CI green and was found by a user reading log
    noise. Only a host-backed conformance job would have caught it.

- **Verdict (`observed`, first-hand, high confidence): the warnings are cosmetic
  — no capability loss from the allowlist.** `principal-swe-infra` declares
  `["bash","shell","view","edit","create","grep","glob","skill"]` and this
  session bound exactly `view, create, edit, grep, glob`: all three warned names
  present and functional, while the *unwarned* `bash`/`shell` were absent. The
  warned set and the capability-loss set are disjoint. The missing shell is
  environmental, not allowlist-caused — built-in agent types carrying no `tools:`
  key lost it too, and 0.49.1 already added `shell` fleet-wide.
- **Therefore the naive fix is the dangerous one.** Deleting the tokens buys a
  quieter log and spends real risk: 0.63.1 proved a `task`-delegated agent
  receives *only* its declared tools, so on any surface that gates, stripping
  `create` silently removes file creation from 49 agents. Both branches are
  defined; **Branch B (change nothing in the 112 files) is what the evidence
  favours** and it contradicts this item's committed Outcome, so it returns to
  the steward as PROPOSAL-2.
- **Blocked on `Q-area-plugins-tool-allowlist-fix-01`** (`@operator`, kind
  `action`): a four-part A/B on a throwaway agent outside the repo. Part 2 —
  launch an agent declaring `["bash","shell","skill"]` and check whether it still
  has the file tools — decides Branch A vs Branch B on its own.
- **Not run, and not claimed:** `npm test`, `pack-preview --check`, any `--gate`,
  `validate-plugin`, `release-guard`, `node`, `git`, `gh`. This session has no
  shell; every execution claim would be `reported`, so none was made. The warning
  text itself was never seen by this role — it remains `reported` from the
  operator.
