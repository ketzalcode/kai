---
type: work-item
id: area-plugins-tool-allowlist-fix
title: Migrate every tool-allowlist declaration across all 56 agents, all 51 skills, and their generated mirrors to the documented primary-alias vocabulary
initiative: area-plugins
milestone: allowlist-repair
delivery_class: product-change
state: production-verification
resume_state: null
priority: 1
owner: null
next_role: "@operator"
target: agent and skill frontmatter tool allowlists (root agents/ + skills/ + their generated mirrors) and the shared SUPPORTED_TOOLS contract
artifact_target: null
artifact_target_status: not-applicable — this is a product-change item, not knowledge work. The durable record is this item plus its thread. (Corrected 2026-08-28-0125: the prior "blocked-on-directory-creation" note is stale; kai/initiatives/area-plugins/ exists and carries northstar.md, backlog.md, log.md and artifacts/decisions/.)
context_artifacts:
  - kai/coordination/threads/area-plugins-tool-allowlist-fix.md
  - kai/coordination/threads/area-plugins-scope-brief.md
  - kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md
  - kai/initiatives/area-plugins/backlog.md
  - agents/principal-product-manager.agent.md
  - agents/creative-video-director.agent.md
  - scripts/lib/loader-contract.mjs
  - scripts/lib/pack-plan.mjs
  - scripts/pack-preview.mjs
  - scripts/validate-plugin.mjs
touches:
  - agents/
  - skills/
  - packs/
  - scripts/lib/loader-contract.mjs
  - scripts/validate-plugin.mjs
  - scripts/host-contract.mjs
  - test/fixtures/host-loader/
  - docs/host-capabilities.md
  - docs/workspaces.md
  - kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md
  - README.md
  - CHANGELOG.md
  - plugin.json
  - .github/plugin/marketplace.json
  - package.json
  - package-lock.json
depends_on: []
waiting_on_questions:
  - Q-area-plugins-tool-allowlist-fix-02
required_for_milestone: true
review_requirements:
  - role: principal-swe-architect
    kind: independent-architecture
completed_reviews:
  - role: principal-swe-architect
    kind: independent-architecture
    phase: implementation
    change_ref: f093c5a2678ee1ecf9c25a88015110a1fbd057cd
    verdict: changes-requested
    evidence: kai/coordination/threads/area-plugins-tool-allowlist-fix.md (REVIEW 2026-08-28-0112)
    timestamp: 2026-08-28-0112
    satisfies_requirement: false
    recorded_by: principal-product-manager (steward) 2026-08-28-0125 — the reviewer held no lease and did not edit this record; P0-1..P0-3 are adjudicated in the STEWARD RULING 2026-08-28-0125, P1-2/P1-3 and the four P2s remain open
  - role: principal-swe-architect
    kind: independent-architecture
    phase: implementation
    change_ref: 4db3c907142ea510b4d5ec7f02668029d616d1c2
    verdict: approved
    evidence: kai/coordination/threads/area-plugins-tool-allowlist-fix.md (REVIEW 2026-08-28-0207)
    timestamp: 2026-08-28-0207
    satisfies_requirement: true
change_ref: 4db3c907142ea510b4d5ec7f02668029d616d1c2
version: 9
lease:
  holder: null
  token: null
  version_at_grant: null
  acquired: null
  expires: null
updated: 2026-08-28-0240
---

## Outcome

**Amended 2026-08-28-0125 by steward ruling (scope-brief A28).** The superseded
wording — "the repeated runtime warnings … stop" — is preserved in the thread and
is not rewritten. It promised an outcome the evidence cannot support, and
shrinking the promise to fit the evidence is the honest move available.

Every kai declaration — agents and skills, root and generated mirror — uses the
documented primary-alias vocabulary plus explicit specialized Kai tools; the
replacement is **measured runtime-safe on live CLI `1.0.79` and `1.0.81`, direct
and delegated**; **no agent or skill loses a capability** (replacement, never
deletion); root and mirrors share one vocabulary with `pack-preview --check` byte
parity intact.

**Warning behaviour is claimed only at the precision each channel permits:**

- The reported warning spellings `create` and `grep` **no longer appear in any
  kai declaration** — `observed` by repo-wide search.
- `edit` is **retained deliberately**, on 55 of 56 agents and 29 of 51 skills,
  because it is the documented primary alias for the file-editing family. It may
  still warn.
- **Interactive-startup warning silence is `unobserved` and stays that way until
  the operator observes it after deployment.** Prompt mode structurally cannot
  reach that channel (decision §12.3), so no noninteractive proxy is required and
  none may be manufactured. This is `shipped`-gate evidence, not a merge gate.
- **If `edit` still warns post-install, that does not falsify this item and does
  not reopen the migration.** Re-spelling `edit` would mean declaring an
  undocumented name to quiet a validator that disagrees with its own
  documentation — the exact defect this milestone exists to end. The disposition
  is §7.2 **B2 applied to the residue**: document the benign drift with its
  evidence and file the bug upstream, as a follow-on.


## Acceptance

- [x] **Schema established from live evidence, not memory.** Satisfied
      2026-08-28-0125. The documented vocabulary is recorded verbatim in
      scope-brief **A23** and decision §1.1 (official GitHub documentation,
      observed 2026-08-27 by the operator), and the accepted-name behaviour is
      measured against the running host on `1.0.79` and `1.0.81` in decision
      §12.2. Observation date and method are stated there. **Bounded honestly:
      the *runtime* channel is `observed`; the *validator* channel is
      `unobserved` and, per §12.3, unreachable noninteractively.**
- [x] **Complete enumeration.** Every declaration is located across the true
      surface of **214** sites — 56 root `agents/*.agent.md` + 56 generated agent
      mirrors + 51 root `skills/*/SKILL.md` + 51 skill mirrors — not the 112
      first assumed. The enumeration is shown in full in the thread, with file,
      current `tools:` value, and which tokens are rejected; it is not sampled
      and not summarised as a count. (Amended from 112 to 214 on 2026-08-28-0125
      with the promotion of backlog P5(a); the north star's milestone-0
      acceptance already named 214 as the complete surface.)
- [x] **A portable replacement is defined and applied.** For each rejected token,
      the record names the accepted equivalent. Where a rejected token has **no**
      accepted equivalent, the record says so explicitly and states what
      capability the agent loses; it does not drop the token silently. A
      capability loss that changes what an agent can do is a scope question and
      returns to the steward before it is applied.
      **Satisfied 2026-08-28-0140.** The mapping
      (`bash|shell`->`execute`, `view`->`read`, `edit|create`->`edit`,
      `grep|glob`->`search`, `task`->`agent`, `web_search|web_fetch`->`web`,
      specialized names left explicit) is applied and verified order-preserving
      with zero drops and zero additions across all 56 root agents and all 51
      root skills. The thread carries the full 113-row, per-file/per-field
      capability-loss disclosure and the required sentence: **CI cannot catch a
      capability loss here; this table is the only guard.** The same table is
      carried into the PR body.
- [x] **No agent or skill body changes beyond its frontmatter `tools:` line (and,
      for the six skills that carry one, `requires_tools:`).** Every other
      span of every touched file is byte-identical. This is the same bounded
      discipline as the A1 generator-derived exception and is verified the same
      way — **by diff, not by assertion**. Satisfied 2026-08-28-0140 by a
      programmatic before/after diff over all 214 changed root and mirror files.
- [x] **Generated trees regenerated and byte parity re-established.**
      `pack-preview --check` is green; `--gate partition`, `--gate collision`,
      `--gate partial-install`, and `--gate version-skew` are green;
      `validate-plugin` and `release-guard` pass. All named commands were
      observed green at 2026-08-28-0140; exact output is transcribed in the
      thread.
- [x] **Topology-neutral, per the milestone-1 carve-out in scope-brief A11.** The
      change alters no `PACKS`, `PACK_ORDER`, `PACKS_DIR`, `MARKETPLACE`,
      `SKILL_OWNER_OVERRIDES`, plugin identity, or marketplace name, and alters
      no `scripts/lib/preflight-block.txt`, `degraded-block.txt`, or
      `inherits-block.txt` content. **The PR names all three carve-out clauses
      explicitly** — a change that cannot claim all three is not exempt and
      escalates to the steward. All three clauses are named in the thread and
      the PR body: topology unchanged, identity/ownership unchanged, and all
      three injected contract blocks byte-unchanged.
- [ ] **The warning outcome is recorded at the precision each channel permits.**
      **Rewritten 2026-08-28-0125 — the old box demanded an absence nobody can
      see before shipping.** Three separable claims, each with its own label:
      (a) `create` and `grep` appear in **zero** kai declarations — `observed` by
      repo-wide search, satisfied today; (b) `edit` is retained deliberately as
      the documented primary alias and **may still warn** — stated, not hidden;
      (c) whether any interactive-startup warning remains is **`unobserved`** and
      is collected by the **operator after deployment**, by launching a kai agent
      interactively and reading the startup warnings. (c) is `shipped`-gate
      evidence, **not** a merge gate, and **no noninteractive proxy for it may be
      invented** — prompt mode structurally cannot reach that channel
      (decision §12.3). A residual `edit` warning routes to §7.2 **B2**
      (document the drift, file upstream); it does not reopen this migration.
- [x] **Regression guard considered, not assumed.** State whether
      `validate-plugin` can pin the accepted tool-name set so this defect cannot
      silently return. If a guard is cheap, add it; if it is not, say why and
      leave it — adding a gate is not automatically in scope. The cheap guard
      is active: `SUPPORTED_TOOLS` contains only the primary and specialized
      vocabulary, `loaderErrors()` rejects retired spellings for agents and
      skills, and malformed fixtures isolate their intended failure.

## Sequencing constraint (steward, binding)

This item touches **all 56 agent bodies, all 51 skill files, and all 107
generated mirrors** — 214 declaration sites after the 2026-08-28-0125 promotion
of backlog P5(a). It therefore collides head-on with
`area-plugins-m2-mode-selection` (milestone 2, PR-3), which rewrites the 49
non-core agent bodies to swap the preflight block for the standalone block.

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

- **2026-08-28-0140 — implementation verification.** Full 113-row capability
  disclosure and exact command results are recorded in the thread. All 214
  root/mirror declaration files differ only in `tools:` or the six
  `requires_tools:` lines; every retired token has its replacement; capability
  loss is zero; all four topology gates, `validate-plugin`, `host-contract`,
  `pack-preview --check`, `release-guard`, and full `npm test` passed. The only
  open acceptance is the explicitly post-install interactive warning
  observation.

- **2026-08-28-0240 — release deployment complete; production verification
  pending.** PR [#195](https://github.com/RubenSaucedo/kai/pull/195) passed
  exact-head CI and merged as
  `c23e752ca5f92b28657267d5c1ff0296fc0ff932`. Exact-main workflow
  [`33159065597`](https://github.com/RubenSaucedo/kai/actions/runs/33159065597)
  passed, and tag/release
  [`v1.0.6`](https://github.com/RubenSaucedo/kai/releases/tag/v1.0.6) is public.
  The lifecycle walked `in-review -> release-ready -> deploying ->
  production-verification` without treating publication as proof of the
  interactive warning channel. The remaining check belongs to `@operator`:
  update the installed packs, launch one Kai agent interactively, and report
  whether `create`, `edit`, or `grep` warnings remain.

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

- **2026-08-28-0125 — steward adjudication of the CHANGES REQUESTED review at
  `f093c5a2678ee1ecf9c25a88015110a1fbd057cd`.** Full ruling in the thread
  (`STEWARD RULING 2026-08-28-0125`). Summary of what it settled:

  - **P0-2 — the conformance decision's §12.4 measure-before-migrate stop is
    LIFTED**, on recorded operator authority given *after* the probe shipped as
    `[1.0.5]`, with provenance quoted in the ruling. It is a lift, not a bypass:
    A23 conditioned the fix on a replacement *proven safe* by the probe (met on
    both CLI versions, direct and delegated), A23's "probe reports first"
    constraint held, the stop is structurally unliftable by any further
    measurement (§12.3), and the residual risk accepted is **efficacy**, not
    **capability**. The lift is bounded to the declaration migration; it
    authorizes nothing about topology, identity, marketplace, or the A11
    carve-out.
  - **P0-1 — the Outcome is AMENDED, not waived.** No warning-free claim is
    invented and no impossible noninteractive proxy is required. See the amended
    Outcome above.
  - **P0-3 — backlog P5(a) (the 102 skill declaration sites) is PROMOTED** into
    this item; **P5(b) (deriving the third `SUPPORTED_TOOLS` copy) stays
    parked** as a mechanism addition. `touches` widened accordingly. Promotion
    record in `kai/initiatives/area-plugins/backlog.md`.
  - **P1-2, P1-3 and the four P2s are NOT cleared** and belong to
    `principal-swe-infra`. `review_requirements[0]` stays unmet.
  - **Deviation recorded, not absorbed:** §7.2's expand/migrate/contract
    (PR-A1..A4) collapsed into one commit, so no window exists in which both
    vocabularies validate. Accepted with its cost stated; the change is still
    revertible as a single commit and lockstep versioning holds.

- **Steward verification this pass (`observed`, first-hand file reads at
  `C:\src\kai`; no command run):** `.git/refs/heads/fix/area-plugin-tool-aliases`
  equals `f093c5a2678ee1ecf9c25a88015110a1fbd057cd`;
  `scripts/lib/loader-contract.mjs:15-24` carries the migrated `SUPPORTED_TOOLS`
  with all nine retired spellings absent; **zero** root agents declare `create`,
  `grep`, `view`, `glob`, `bash`, `shell` or `task`; **55/56** root agents and
  **29/51** root skills declare `edit`; all **51** root skills carry a `tools:`
  line; all **six** `requires_tools:` lines read `[execute]`. The commit diff was
  **not** read and no gate was run.

- **Owed before `shipped`, and owed by the operator alone:** one interactive
  launch on the deployed tree, reading the startup warnings. Nothing else can
  supply it.
