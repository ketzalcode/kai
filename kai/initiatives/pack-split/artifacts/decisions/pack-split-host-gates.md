# Architecture Decision — how pinned pack identities reach the host-gate hosts

**Source:** `kai/coordination/items/pack-split-host-gates.md` (v4, `blocked`,
`resume_state: in-progress`) and its two open operator questions
`Q-pack-split-host-gates-01` / `-02`; direct dispatch to `principal-swe-architect`
asking whether a temporary non-`main` staging-marketplace branch plus
repository-controlled cloud setup steps can truthfully carry the gate, or whether
the gate must stay blocked pending enterprise managed settings.
**Date:** 2026-08-26 16:15 local
**Run:** principal-swe-architect
**Initiative:** pack-split (milestone `first-pack-extracted`)

**Decision (one line):** Neither — both framings rest on a **false binary**. The
gate is blocked by an over-strict prerequisite inside its own artifact, not by a
missing enterprise capability: GitHub documents *three* install mechanisms below
publication (direct `OWNER/REPO:PATH`, a local **directory** marketplace, and a
repository-level `.github/copilot/settings.json`), so the macOS arm runs today at
**zero** publication surface and the cloud arm reduces to **one bounded spike**.

> **Boundary.** This record decides a seam. It edits no implementation, release,
> coordination, or reliability file, runs no command, creates no work item, and
> publishes nothing. Reliability acceptance stays `principal-sre`'s; the
> acceptance wording and any main-branch behavior change stay the steward's. Both
> are routed below, not decided here.

---

## Context

Read for this ruling, at `C:\src\kai`:

- `kai/coordination/items/pack-split-host-gates.md` (v4) and its thread;
- `kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md`
  (the prepared gate — prerequisites, packets, abort criteria);
- `kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md`
  (Windows-verified cross-plugin semantics; the extraction/publication gate split);
- `kai/initiatives/pack-split/artifacts/reliability/pack-split-first-department-install.md`
  (the PASS proof via repeated `--plugin-dir`, ratified 2026-08-26-1516);
- `kai/initiatives/pack-split/northstar.md` (non-negotiables, `deferred` list);
- `kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md`
  (WS#9/WS#10, *Scope negotiations*);
- `kai/coordination/items/pack-split-release-12b.md` (the A4 publication-enforcement debt);
- `.github/plugin/marketplace.json` (**N=1**, `kai` at `source: "."`) and
  `.github/workflows/` (only `validate.yml` — **no** `copilot-setup-steps.yml`).

**The state.** Every acceptance line except the host arms is already discharged.
What is missing is *persistent, real* install evidence on a second OS and on a
cloud host. The prepared artifact asserts two prerequisites that produce the
deadlock:

1. its abort criteria fire if "**the public marketplace still lacks either pack
   identity**" — so the gate demands publication in order to authorize
   publication; and
2. its cloud packet asserts "the cloud run **must** use Agent Plugins managed
   settings" — an enterprise capability this account has no evidenced access to.

**External facts I verified** (current official documentation, not inference):

| Fact | Source |
| --- | --- |
| `copilot plugin install OWNER/REPO:PATH/TO/PLUGIN` installs a plugin from a **subdirectory** of a repository — a first-class, persistent install spec. | [CLI plugin reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-plugin-reference) |
| `copilot plugin marketplace add SOURCE` accepts `owner/repo`, **`owner/repo#ref`**, a URL, **or a local path**. | same |
| **In Copilot cloud agent, you install plugins declaratively via the *repository's* `.github/copilot/settings.json` `enabledPlugins`, and register non-default marketplaces via `extraKnownMarketplaces` in the same file.** Enterprise managed settings are *an* additional path, not the only one. | [About plugins](https://docs.github.com/en/copilot/concepts/agents/about-plugins) |
| `.github/copilot/settings.json` is a documented **repository** settings scope; `enabledPlugins` is "declarative plugin auto-install", keys are plugin **specs**; `extraKnownMarketplaces` sources are `directory` / `git` / `github`. | [CLI config-dir reference](https://docs.github.com/en/copilot/reference/copilot-cli-reference/cli-config-dir-reference) |
| `copilot-setup-steps.yml` **will not trigger unless present on the default branch**; it pre-installs *tools and dependencies* in the Actions-powered ephemeral environment. Cloud agent runs **Ubuntu x64 / Windows 64-bit only — never macOS**. | [Configure the development environment](https://docs.github.com/en/copilot/how-tos/copilot-on-github/customize-copilot/customize-cloud-agent/customize-the-agent-environment) |
| Directory-source marketplaces load path-sourced plugins **live from their real directory** (no fetch-and-copy). | CLI plugin reference |
| Known open defect: repo-level `enabledPlugins` may not auto-install outside an interactive session in a trusted folder. | [github/copilot-cli#2249](https://github.com/github/copilot-cli/issues/2249) |

Fact 3 is the one that moves the decision: the artifact's cloud prerequisite is
**factually over-narrow against current documentation**.

## Diagram

```text
BEFORE — one binary, both ends unreachable

   packs/kai-core, packs/kai-personal  (committed on main, unpublished)
                    │
        ┌───────────┴────────────┐
        │                        │
   "publish to                "enterprise
    marketplace"           managed settings"
        │                        │
        ✗ forbidden by           ✗ no evidenced access
          northstar +              (Q-02 waits on the
          release 12b              operator, forever)
        │                        │
        └───────────┬────────────┘
                    ▼
              GATE BLOCKED
   abort clause: "public marketplace still lacks
    either pack identity"  ← circular: publication
    is the thing this gate exists to authorize


AFTER — a publication-surface ladder; take the lowest rung per arm

   rung 0  --plugin-dir              (already PASSED, not persistent)
   rung 1  install OWNER/REPO:PATH   ← macOS: direct + order + fresh session
   rung 2  marketplace add <local dir>← macOS: marketplace + collision arms
   ─────────── zero publication surface above this line ───────────
   rung 3  .github/copilot/settings.json on a THROWAWAY BRANCH
                                     ← cloud: SPIKE (branch-scope unknown)
   ─────────── limited public ref surface above this line ─────────
   rung 4  marketplace add owner/repo#ref  (staging branch index)
   rung 5  copilot-setup-steps.yml on main (default-branch config change)
   rung 6  packs in main .github/plugin/marketplace.json  = RELEASE 12b


AFTER — the seam, drawn

   ┌──────────────── RubenSaucedo/kai (public) ────────────────┐
   │  main                                                      │
   │   ├─ packs/kai-core      ─────────┐  rung 1: direct spec   │
   │   ├─ packs/kai-personal  ─────────┤  (default branch tip)  │
   │   └─ .github/plugin/marketplace.json  N=1  ← UNTOUCHED     │
   │  throwaway branch (never merged)                           │
   │      └─ .github/copilot/settings.json ──┐ rung 3           │
   └──────────────────────────────────────────┼────────────────┘
                    │                         │
       ┌────────────┴──────────┐              │
       ▼                       ▼              ▼
  macOS host             macOS host      Copilot cloud agent
  direct install     local-dir marketplace  (Ubuntu/Windows)
  (persistent,          (marketplace           host-issued
   isolated HOME)        provenance +          run identity +
                         collision arm)        plugin inventory
       └──────────┬────────────┘                    │
                  ▼                                 ▼
        acceptance lines 1–4 satisfied      "one cloud host" —
        with NO repo change at all           GO/NO-GO from spike
```

## Forces

1. **Circularity, and it is self-inflicted.** The artifact aborts if the public
   marketplace lacks the pack identities. The gate authorizes publication. A gate
   that requires its own output as an input can never fire. This clause is in
   **infra's own artifact**, not in the item's `Acceptance` — so the acceptance is
   *not* the thing that is over-constrained.
2. **A false prerequisite is currently costing an indefinite block.** Q-02 asks
   the operator to confirm an enterprise managed source. Documentation says the
   cloud agent takes `enabledPlugins` from the *repository's* settings file. The
   question is waiting on a capability the design does not need.
3. **Publication is a one-way, irreversible act with no mechanical guard yet.**
   The A4 criteria (`release-guard` classifying `.github/plugin/marketplace.json`
   as behavior-sensitive; `validate-plugin` asserting entry↔`plugin.json` name
   agreement) are **owed by release 12b and do not exist today**. Any artifact
   that diverges that exact file on a branch is one merge away from publishing
   with no bump, no CHANGELOG, and no README stamp — precisely the escape A4
   exists to close.
4. **Default-branch config is a shipped surface, not a test fixture.**
   `copilot-setup-steps.yml` and `.github/copilot/settings.json` on `main` change
   behavior for every contributor and every cloud task in this repository.
   `enabledPlugins` on `main` would auto-install the packs alongside the legacy
   `kai` monolith — manufacturing exactly the coexistence state the shipped
   migration doctor refuses. "Temporary" is a promise, not a mechanism.
5. **Host identity is not fungible.** A GitHub Actions runner executing Copilot
   CLI is a *Linux CLI* host. The Copilot cloud agent is a different runtime with
   a different plugin-loading path and host-issued run identity. The artifact
   already rejects generic-subagent/local-VM substitution; a CI runner wearing a
   cloud badge is the same substitution with better optics.
6. **Fidelity ladder is real but shallow.** Direct install and a directory
   marketplace exercise *provenance* (`_direct/` vs `{marketplace}/{plugin}/`)
   and therefore the collision/`provenance-collision` arm and the "no stale legacy
   copy" arm. They do **not** exercise GitHub fetch-and-copy for a marketplace
   source. **No acceptance line names GitHub-source marketplace fetch.**
7. **Reversibility is asymmetric.** Rungs 1–2 leave zero repository state: undo is
   `copilot plugin uninstall` plus deleting an isolated `COPILOT_HOME`. Rung 3 is
   one branch deletion. Rungs 4–5 leave public refs and default-branch history
   that survive their own "cleanup" commit.
8. **macOS can never be the cloud arm.** Cloud agent is Ubuntu/Windows only. The
   two arms are structurally independent and must not be collapsed.

## Decision point 1 — how pinned pack identities reach the macOS arm

- **Disposition: Reshape.**

Keep the goal (persistent, real, pinned install evidence on macOS). Replace the
"publish or stay blocked" binary with the **lowest rung that satisfies each
acceptance line**:

- **Direct arm** — `copilot plugin install RubenSaucedo/kai:packs/kai-core` and
  `…:packs/kai-personal`, in both orders, into two fresh isolated `COPILOT_HOME`
  roots. This is a documented, *persistent* install and covers install-order,
  fresh-session activation, cross-plugin resolution, the npm/`node_modules`
  inventory line, and the direct half of marketplace-vs-direct.
- **Marketplace arm** — `copilot plugin marketplace add <local directory>` where
  that directory holds a **run-local** `marketplace.json` listing the two pack
  identities against the disposable pinned clone. Documented, zero public
  surface, and it lands installs under `installed-plugins/{marketplace}/{plugin}/`,
  which is what the collision and provenance arms actually read.
- **Collision arm** — install one identity from both provenances and require the
  migration doctor's `provenance-collision`, as already designed.

**Pinning correction infra must make:** a direct `OWNER/REPO:PATH` spec resolves
the repository's **default branch**, so the gate cannot demand a historical
`9a800e4e…` that `main` may have moved past. Re-pin to *"`main`'s tip SHA
recorded at run start"* and prove the pin by **byte comparison** — SHA-256 of the
installed `plugin.json` against that revision's `packs/*/plugin.json`. Pin by
verification, not by hope.

## Decision point 2 — how pinned pack identities reach the cloud arm

- **Disposition: Spike.** Time-box: one operator cloud task.

**Question:** does Copilot cloud agent honor `.github/copilot/settings.json`
`enabledPlugins` read from the **branch the task runs on**, and does an
`enabledPlugins` key accept a **direct** `OWNER/REPO:PATH` spec (or does it
require an `extraKnownMarketplaces` entry)?

**Method:** a throwaway branch — never merged, deleted after — carrying only
`.github/copilot/settings.json`; assign one cloud task pinned to that branch;
export the host run identity and the host's plugin inventory.

**What each answer implies:**

| Answer | Implication |
| --- | --- |
| Branch-scoped **and** direct spec accepted | Cloud arm passes at rung 3. No publication, no marketplace edit, no `main` change. Gate closes; `principal-sre` reviews. |
| Branch-scoped, but a marketplace entry is required | `extraKnownMarketplaces` with a **`directory`** source is unavailable in the cloud sandbox, so this becomes a `github` source at a ref → rung 4. Do **not** proceed: return to the steward, because that diverges `.github/plugin/marketplace.json` while A4 has no guard (Force 3). |
| **Default-branch-scoped only** | The cloud arm cannot be reached without a `main` behavior change. **Stop.** This is a steward call, not infra's and not architecture's (see escalation E1). |
| Honored but does not auto-install (defect #2249) | Record it as a **product-relevant host finding** — it directly threatens the shipped onboarding installer's cloud story — and route to the steward. Do not paper over it with a manual install inside the task. |

**Domain work this implies (handoffs, not how-to):**

- `principal-swe-infra` — owns the artifact correction and the packets: strike
  the circular abort clause; replace "must use Agent Plugins managed settings"
  with "host-installed pack identities via a documented repository- **or**
  enterprise-controlled declarative mechanism, evidenced by host-exported plugin
  inventory"; re-pin to run-time `main` tip with checksum proof; rewrite the
  macOS packets to rungs 1–2; **withdraw `Q-pack-split-host-gates-02` as posed**
  (its premise is falsified) and re-ask it as the rung-3 spike. Keep every
  existing rejection (no generic subagent, no local VM, no `--plugin-dir` as
  persistent evidence, no model-authored identity) — those are all correct.
- `@operator` — executes both host arms; `Q-01` stays valid in intent, its
  command packet does not.
- `principal-sre` — independent reliability acceptance is unchanged and
  **unaffected by this record**; nothing here self-clears that review.
- `principal-product-manager` (steward) — owns escalation E1 below and any
  library promotion of this record.

**What stays the same — deliberately not touched:**

- `.github/plugin/marketplace.json` — still **N=1**, `kai` at `source: "."`.
- `main` — no `copilot-setup-steps.yml`, no `.github/copilot/settings.json`, no
  version bump, no tag, no release.
- Pack trees stay committed and **unpublished**; release 12b stays **NO-GO**.
- The item's `Acceptance` block — unchanged, and it does **not** need changing to
  execute this path.
- The artifact's abort criteria for credential leakage, identity, and
  provenance-indistinguishability — all correct, all retained.

**Reversibility:** rungs 1–2 are free to undo (uninstall + delete an isolated
home). Rung 3 is one branch deletion, and the branch is never merged. The
recommendation deliberately declines every rung whose undo requires rewriting
public history or retracting a published identity.

## Options considered

Each option is scored on the six axes requested: **PUB** (testing-source
publication surface), **ID** (managed plugin identity), **HOST** (host identity
truthfulness), **REPRO**, **ROLLBACK**, **ACC** (satisfies existing acceptance
*without* changing it).

### A — Stay blocked until the operator supplies enterprise managed settings

- PUB: none. ID: enterprise-managed (strongest, if it existed). HOST: genuine.
  REPRO: n/a. ROLLBACK: n/a. ACC: satisfied only if the capability appears.
- **Fails on the premise.** Documentation says the cloud agent installs plugins
  from the repository's own `.github/copilot/settings.json`. Blocking on a
  capability the design does not require is an unbounded stall with no trigger,
  and it holds the sole committed queue head hostage to an account upgrade.
- **NO-GO** as a standing position. Legitimate only as the *fallback* if the
  rung-3 spike returns "default-branch-scoped only" **and** the steward declines
  a `main` change.

### B — Pinned staging-marketplace branch (`owner/repo#ref`) for the macOS arms

- PUB: **limited public ref** — reachable only by explicitly adding that ref,
  never by `marketplace add RubenSaucedo/kai` (which resolves the default
  branch). ID: real marketplace-provenance identity, ref-pinned. HOST: genuine
  macOS. REPRO: good — the ref is immutable if never force-pushed. ROLLBACK:
  branch deletion, but the public ref existed and may have been fetched/cached.
  ACC: satisfies the marketplace arm without changing acceptance.
- Honest verdict on the question as asked: **it is truthful.** A ref-pinned
  staging index is not "publication" in any sense the northstar's non-negotiable
  means — it is not the release index, not the default branch, and not
  discoverable by an ordinary `marketplace add`.
- It is nonetheless the **wrong call today**, on two forces: (i) rung 2 — a local
  directory marketplace — resolves the *same* force at *zero* public surface, and
  the cheapest architecture is the one you did not add; (ii) the branch's payload
  is a divergent `.github/plugin/marketplace.json`, the exact file whose
  release-enforcement guard (A4) **does not exist yet** — creating a
  merge-to-publish hazard before the guard that catches it.
- **NO-GO now.** Reopens if — and only if — an acceptance line is read to require
  **GitHub-source marketplace fetch** fidelity that a directory marketplace
  cannot supply, *and* A4's `release-guard` classification has landed first.

### C — Temporary default-branch `copilot-setup-steps.yml` installing the packs

- PUB: none of the packs, but a **default-branch behavior change** to the
  repository. ID: **unverified** — setup steps install tools into the Actions
  environment; the documented cloud-agent plugin path is
  `.github/copilot/settings.json`, not a CLI install in the setup runner. HOST:
  genuine cloud agent. REPRO: good while merged. ROLLBACK: a second `main` commit
  — the change is in permanent history and was live for every cloud task and code
  review in between. ACC: only if the unverified load assumption holds.
- Worst of both: it **ships a config change to `main` to obtain test evidence**,
  and it rests on an assumption that, if false, leaves the change shipped and the
  evidence unobtained. It also fires for Copilot **code review**, which reuses
  `copilot-setup-steps.yml` by default — blast radius wider than the one task.
- **NO-GO.** Rung 3 obtains the same evidence with a documented mechanism and a
  branch that is never merged.

### D — A standard GitHub Actions runner with Copilot CLI as "the cloud host"

- PUB: none. ID: whatever the workflow installs — fine. HOST: **false**. A
  CI runner running the CLI is a Linux CLI host, not the Copilot cloud agent
  runtime; it produces an Actions run ID, not a cloud-agent run identity, and it
  exercises the CLI's plugin loader, not the cloud agent's. REPRO: excellent.
  ROLLBACK: trivial. ACC: **does not** satisfy "one cloud host" without
  redefining what that phrase means.
- This is the same identity substitution the artifact already rejects for local
  VMs and generic subagents, with a CI badge on it. Recording it as `cloud/`
  evidence would make the gate's central claim untrue.
- **NO-GO as the cloud arm.** It would be *honest* as a separately-labeled
  `linux-ci/` arm — but that is **additive work beyond the committed minimal
  smoke gate**, so it is not endorsed into implementation here; it is offered to
  the steward in E1 as one of the fallbacks.

### E — Publication-surface ladder: rungs 1–2 for macOS, rung-3 spike for cloud — **RECOMMENDED**

- PUB: **zero** for the macOS arms; one never-merged branch for the cloud spike.
  ID: real, host-installed, pinned pack identities in both arms — direct provenance
  and marketplace provenance both exercised. HOST: genuine macOS; genuine cloud
  agent with host-issued run identity. REPRO: pinned by SHA-256 byte comparison of
  installed `plugin.json` against the recorded revision, on both arms. ROLLBACK:
  uninstall + delete isolated home; delete branch. ACC: satisfies every acceptance
  line **without changing acceptance**, conditional on the spike for the cloud arm.
- **GO.**

### Do-nothing (leave the artifact as written and wait on Q-01/Q-02)

- Q-01 is executable but its packet stops at capability probes and explicitly
  holds the persistent-install arm; Q-02's premise is falsified. So do-nothing is
  option A with extra steps: the item stays `blocked`, `first-pack-extracted`
  stays open at 3 of 4, and the entire downstream valve
  (`pack-dependency-manifests → onboarding-installer → 12a → 12b → 12c`) stays shut.
- **NO-GO.**

## Is the acceptance over-constrained or circular?

**The item's `Acceptance` is neither.** Every line is satisfiable by option E as
written, with the single conditional noted below. Do not amend it.

**The circularity is in the artifact**, at
`kai/initiatives/pack-split/artifacts/reliability/pack-split-host-gates.md`, in
two places:

1. abort criterion — "*the public marketplace still lacks either pack identity*";
2. cloud prerequisite — "*The cloud run **must** use Agent Plugins managed
   settings*".

**Owner who must change them: `principal-swe-infra`** — it authored the artifact,
the artifact is the item's `artifact_target` and its only `touches` entry, and
both clauses are design choices about *method*, not acceptance criteria. **Why:**
(1) makes the gate require its own output as an input, which is unsatisfiable by
construction; (2) contradicts current official documentation, which puts the
cloud-agent plugin-install control plane in the *repository*. No steward action
is required to unblock the macOS arm, and none is required to run the spike.

## Open questions / escalations

**E1 — steward decision, only if the spike returns "default-branch-scoped only."**
Route to `principal-product-manager`. If the cloud agent honors
`.github/copilot/settings.json` **only** from the default branch, then "one cloud
host" cannot be reached without a `main` behavior change, and that is a
scope-expanding, publication-adjacent call no engineering role should make alone.
Three options, with consequences:

- **(i) Accept a second-host arm that is not the cloud agent** — an honestly
  labeled Linux-CLI arm — and record "cloud-agent composition" as still
  unverified, joining the northstar's existing `deferred` line. *Consequence:* the
  1.0.0 flip ships without cloud-agent composition evidence; the onboarding
  installer's cloud story stays unproven.
- **(ii) Authorize a reviewed `main` change** adding `.github/copilot/settings.json`
  with the two pack identities. *Consequence:* this is a **shipped behavior
  change** requiring the normal release path, and it auto-installs the packs
  alongside legacy `kai` for every contributor in this repository — colliding with
  the coexistence refusal the migration doctor enforces. My read is that this
  contradicts the "committed **unpublished**" non-negotiable in substance even
  though it edits no marketplace file.
- **(iii) Defer the cloud arm to release 12b/12c** with a named trigger, closing
  `host-gates` on the macOS arm alone. *Consequence:* requires the steward to
  narrow the acceptance line, and `principal-sre` to re-scope its reliability
  review accordingly.

**E2 — non-blocking, routed not decided.** If the spike surfaces
github/copilot-cli#2249 behavior (declared-but-not-auto-installed plugins), that
is a **host defect with product consequences** for the shipped onboarding
installer, not a gate failure. Record it; route to the steward. Do not work
around it by hand-installing inside the cloud task — that would restore the
identity substitution this decision exists to prevent.

**E3 — carried forward, unchanged.** A4 (`release-guard` classifying
`.github/plugin/marketplace.json` as behavior-sensitive, and `validate-plugin`
asserting marketplace-entry ↔ `plugin.json` name agreement) remains owed by
`pack-split-release-12b`. This decision **increases** its urgency: option B
becomes available the moment that guard lands, and stays hazardous until it does.

**Promotion.** Library promotion of this record to
`kai/library/dev-designs/` is steward-approved per `kai/library/README.md`; it is
not claimed here.

---

## Amendment — branch null is indeterminate; use a default-branch consumer fixture

**Date:** 2026-08-26 17:02 local
**Evidence:** macOS run `33024791572`; cloud task
`7160810a-a4e1-43eb-bc97-d6f8e2f53aad`; cloud run `33024086802`
**Consultation:** read-only `principal-swe-architect` (Opus 5)

### TLDR

The macOS arm passed. The branch-scoped cloud spike did not provision any
plugin and is **indeterminate**, not a pass and not evidence of
default-branch-only behavior or direct-spec rejection.

Run one smaller, discriminating experiment: a disposable consumer repository
outside `RubenSaucedo/kai`, with its **default branch** carrying both direct Kai
pack specs plus one known-good plugin from a default-registered marketplace.
Require host-side install and provider evidence. Do not change Kai `main`, add a
temporary Kai marketplace, or defer the cloud arm before this experiment.

### Before / after

The branch fixture had no positive control; the consumer fixture separates host
provisioning failure from Kai direct-spec support.

```text
BEFORE

  Kai non-default branch
    settings: core + personal
              |
              v
       cloud task: 2 bash calls
              |
              +-- 0 installs / 0 provider events
              |
              v
        INDETERMINATE

AFTER

  Kai main packs                 default marketplace
    core + personal                  known-good control
          |                                |
          +-----------+--------------------+
                      v
       consumer repo DEFAULT branch settings
                      |
                      v
              one read-only cloud task
                      |
       +--------------+--------------+
       |              |              |
    all 3          control only     nothing
    PASS           direct specs     provisioning/
                   unsupported      control defect
```

### Evidence that changed the decision

- macOS run
  [`33024791572`](https://github.com/RubenSaucedo/kai/actions/runs/33024791572),
  job `98363497414`, passed on genuine GitHub-hosted Apple Silicon macOS.
  Direct installs in both orders and the directory marketplace bound
  `kai-personal:persona-self` to `kai-core-contract-v1` from `kai-core`
  `0.64.0`; installed manifests match source; collision and refusal probes
  passed.
- Cloud task
  [`7160810a-a4e1-43eb-bc97-d6f8e2f53aad`](https://github.com/RubenSaucedo/kai/tasks/7160810a-a4e1-43eb-bc97-d6f8e2f53aad)
  selected base `kai/chore/pack-split-host-gates-cloud-spike`; its generated
  head and base were both
  `fb04975c2969e1aca463d148b6cb1784966e20b9`.
- Host run
  [`33024086802`](https://github.com/RubenSaucedo/kai/actions/runs/33024086802),
  job `98361210602`, succeeded, but the task made only two bash calls. There
  were zero plugin discovery/install events, zero `skill.invoked` events, and
  zero `persona-self` dispatches.
- The task saw `.github/copilot/settings.json`, but the null has no positive
  control and no host-side plugin-root evidence. It cannot distinguish
  branch-scope behavior, direct-spec rejection, or a provisioning/control-plane
  defect.

### Amended decision

Pending operator authorization, create one disposable consumer repository
outside `RubenSaucedo/kai`. On its default branch:

1. add `.github/copilot/settings.json` with
   `RubenSaucedo/kai:packs/kai-core`,
   `RubenSaucedo/kai:packs/kai-personal`, and one verified plugin from a
   default-registered marketplace;
2. run one read-only genuine cloud task;
3. require host-side installed-plugin inventory, plugin-root evidence, and
   provider events for the control and Kai plugins; and
4. preserve only sanitized identity/result evidence.

Outcomes are binding:

| Outcome | Decision |
| --- | --- |
| All three install | Cloud arm passes; route the evidence revision to `principal-sre`. |
| Control installs; Kai specs do not | Direct subdirectory specs are unsupported in cloud settings; route to the steward/publication-dependent fallback. |
| Nothing installs | Record a host provisioning/control-plane defect and route accordingly. |

Creating and deleting the external repository is an operator authorization
boundary, tracked as `Q-pack-split-host-gates-04`. No repository was created by
this amendment.

### Rejected alternatives

- **Temporary `.github/copilot/settings.json` on Kai `main`: rejected.** It
  auto-installs core/personal beside legacy `kai`, activates duplicate
  hooks/coexistence, leaves persistent host state, and contradicts the
  committed-unpublished boundary.
- **Temporary marketplace index on Kai `main`: rejected.** It is a wider,
  publication-adjacent change and circularly uses the surface this gate exists
  to authorize.
- **Immediate deferral: rejected.** Keep it only as fallback after the
  consumer-repository experiment produces a discriminating result.

Release 12b remains **NO-GO**. Acceptance and required milestone states are
unchanged.

## Executed consumer-fixture outcome — 2026-08-26

The operator authorized `Q-pack-split-host-gates-04`. Private disposable
repository `RubenSaucedo/kai-pack-host-gate-consumer` placed the approved
fixture on its default branch at
`7d80b4b12942eb0acce972e1e83c36f88023fde6`:

- `spark@copilot-plugins` as the default-marketplace positive control;
- `RubenSaucedo/kai:packs/kai-core`; and
- `RubenSaucedo/kai:packs/kai-personal`.

The discriminating result is **all three install**. Cloud run `33026579996`
resolved and loaded all three plugins and invoked `kai-core-contract-v1`.
Cloud run `33026682808` then recorded a successful `task` lifecycle with the
nested child invoking `kai-core-contract-v1`. A repeat, run `33027220466`,
persisted an exact task prompt requiring
`kai-personal:persona-self`, forbidding built-in substitution, and requiring
the nested core invocation; the same task/skill/success sequence occurred.

This closes the architecture question: a consumer repository's default-branch
`.github/copilot/settings.json` accepts direct subdirectory plugin specs beside
a default-marketplace plugin. No Kai `main` setting, Kai marketplace entry, pack
publication, or release metadata change is required.

The first reliability review found that exported Actions events alone did not
causally bind the selected child. Cloud session storage subsequently ingested
the missing host records for session
`410d2bc8-30e7-401a-ad12-13233c09a1f2`: the `task` request names
`kai-personal:persona-self`, and host-authored begin/end markers bracket that
subagent's nested `kai-core-contract-v1` invocation. This closes the identity
gap without relying on final model text. GitHub history also binds the mutable
direct specs to Kai `main` revision
`fe562b9364256b159d7016d8bdc79d989bc7e3a3` at the cloud resolution
timestamps. The disposable repository must remain only through evidence review
and then be deleted.
