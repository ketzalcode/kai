# Engineering Scope — pack-split build & ship decomposition

**Source:** `kai/coordination/items/pack-split-engineering-decomposition.md` (ready, priority 10),
consuming the LOCKED partition at
`kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md`
(`independent-architecture` review RATIFIED against
`change_ref fd44f4fdf4a2b0c1e5e70f8369bd2a0b45a8224e`).
**Date:** 2026-08-24 20:11 local
**Run:** principal-swe-manager
**What we're building (one line):** the sized, sequenced, owned `proposed` work-item
graph that turns the `dependency-guarantees`, `first-pack-extracted`, and
`five-pack-split-shipped` milestones into independently-reviewable PR increments —
this record **builds nothing**.

> **Boundary.** This pass writes no agent, skill, script, `plugin.json`, CI, or
> marketplace change; creates no branch/commit/PR; merges/tags/releases nothing; and
> runs no external host gate. It produces this decomposition plus one `proposed` item
> record (and thread) per workstream. It **consumes** the locked partition and does
> not re-derive or alter it — any needed partition change is routed to the steward as
> a question, not decided here.

---

## Posture

The engineering read: **this is a build-tooling, packaging, prompt-contract, and
staged-release initiative — not a feature.** Almost all of it runs through one owner
(`principal-swe-infra`), which makes the critical path **long and highly serial**:
11 of 14 workstreams are dependency-blocked (`Sequence`), and the honest first
finding is that parallelism is scarce and the single-owner concentration is the real
delivery risk, not any one item's size. Where parallelism exists I have named it (the
migration doctor runs beside the first tree generation; the onboarding installer beside
the host gates; the contract-skill prose and migration-notice copy can be authored by
`principal-swe-backend`/`principal-technical-writer` off the critical path).

Risk and cost concentrate in three places:

1. **The foundation (`generator-gates`).** The steward's closure buckets folded the
   generator engine into `generated-pack-trees` and the multi-manifest gates into
   `crosspack-validator`. Built that way, three guarantee items would each re-implement
   the same multi-manifest plumbing, and two would balloon to XL. I **split out** one
   foundational item — harden `pack-preview.mjs` into the authoritative generator and
   make `validate-plugin.mjs` + `release-guard.mjs` iterate over N manifests — because
   every downstream guarantee sits on it and it is independently reviewable. It is the
   single first item to build.

2. **The load-bearing host unknown.** The proposal proved cross-plugin skill resolution
   on **Windows CLI only**; macOS, the cloud host, real install order, marketplace-vs-
   direct, and fresh sessions are unverified, and the northstar itself *defers* full
   macOS/cloud certification. I will **not** estimate the extraction through that fog: I
   front-load a time-boxed **Spike** (`host-semantics-spike`, operator-run on the
   throwaway `--all` preview) that gates the first real tree generation. If it fails,
   the whole extraction plan changes before anyone commits a tree.

3. **The flip (`release-12b`).** Publishing packs + retiring the published monolith +
   cutting `1.0.0` is the highest-blast-radius step and is operator-executed. It is
   gated hard on the host-gate evidence and staged so core+first-department flip alone,
   never five packs at once.

**Recommended before anyone writes code:** run the host-semantics spike in parallel
with the guarantee work, and get the steward's call on two scope questions below
(host-gate depth; whether to fold the spike into the gate). Everything else is
buildable as sequenced.

---

## Disposition summary

| Disposition | Count |
|-------------|-------|
| Ship | 1 |
| Slice | 1 |
| Spike | 1 |
| Sequence | 11 |
| Split | 0 (the one split is materialized as the extracted `generator-gates` item; see WS#1) |
| Pushback | 0 (two scope questions raised instead — see *Scope negotiations*) |

14 workstreams total: the **12** steward-approved `required_items` IDs, plus **2**
manager splits for reviewability and de-risking (`generator-gates`, `host-semantics-spike`).

---

## Workstreams

### WS#1 — Generator hardening + multi-manifest gates (foundation)

- **Work-item ID:** `pack-split-generator-gates`
- **Milestone:** dependency-guarantees (proposed addition to `required_items`; see *Scope negotiations*)
- **What it is:** promote `scripts/pack-preview.mjs` from a throwaway-preview builder to
  the deterministic authoritative pack generator (stable ordering, per-pack `plugin.json`,
  asset-ownership + hooks-ownership routing hooks, LF normalization already present), and
  make `scripts/validate-plugin.mjs` and `scripts/release-guard.mjs` **iterate over N
  manifests** instead of assuming one root `plugin.json`: per-pack version agreement,
  marketplace index listing multiple plugins, and behavior-classification of the committed
  pack-tree directories.
- **Owner:** principal-swe-infra
- **Verification owner:** principal-swe-infra (self-tests + CI)
- **Review requirements:** principal-swe-architect / independent-architecture (generator
  determinism + the multi-manifest gate contract)
- **Size:** L (2 PR increments: (1) generator engine; (2) validate/release multi-manifest refactor)
- **Dependencies:** `pack-split-partition-lock` (completed)
- **Touches:** `scripts/pack-preview.mjs`, `scripts/validate-plugin.mjs`,
  `scripts/release-guard.mjs`, `.github/workflows/validate.yml`, `package.json` (scripts),
  possible new `scripts/lib/pack-plan.mjs` (shared `planPacks()` extraction)
- **Disposition:** Ship — unblocked, well-understood, build first.
- **Detail:** This is the extraction from the steward's descriptions: the "multi-manifest
  validate/release gates" folded into `crosspack-validator` and the "generator" folded into
  `generated-pack-trees` are the *same* foundation and belong in one reviewable item that
  ships before either. `release-guard.mjs`'s `BEHAVIOR_PREFIXES` (`agents/ skills/ scripts/`)
  must learn the committed pack-tree path (e.g. `packs/`) so a generated-tree change still
  demands a bump. Reuses the existing `inherits-block.txt`/`communication-style-block.md`
  CI-pin precedent as the model.
- **Risk / unknowns:** the multi-manifest refactor of a 50 KB validator is the size risk;
  if the marketplace multi-plugin schema differs from the single-plugin assumptions in
  `validate-plugin.mjs`, that expands. Contained by the architecture review.

### WS#2 — Host-semantics de-risk spike

- **Work-item ID:** `pack-split-host-semantics-spike`
- **Milestone:** first-pack-extracted (supporting; `required_for_milestone: false`)
- **What it is:** a time-boxed, operator-run investigation of the **unverified** host
  behaviours on the throwaway `node scripts/pack-preview.mjs --all` output: does an agent in
  pack A resolve a `kai-core-*` skill from core on **macOS** and on the **cloud host**; does
  collision / load-order behaviour hold under **real install** order and **marketplace-vs-
  direct**; does a **fresh session** load newly-installed plugins; and do `hooks.json` hooks
  fire **once** or per-plugin when multiple plugins ship them.
- **Owner:** principal-swe-infra (designs the probe + evidence template); **@operator**
  executes the host runs (I cannot execute external host gates)
- **Verification owner:** principal-swe-infra (records findings); principal-swe-architect consulted on implications
- **Review requirements:** none (spike/knowledge; findings reviewed informally by architect)
- **Size:** M (design is small; the cost is operator host-time)
- **Dependencies:** `pack-split-partition-lock` (completed). Runs **in parallel** with the
  dependency-guarantees work.
- **Touches:** an evidence artifact under `kai/initiatives/pack-split/artifacts/reliability/`
  (no code)
- **Disposition:** Spike — the answer changes the plan. Time-box: one operator host session.
  **Good answer** (resolution + collision + fresh-session hold on macOS + one cloud host,
  hooks fire once from core-only): proceed to `generated-pack-trees` as planned. **Bad answer**
  (cloud host does not resolve cross-plugin skills, or hooks double-fire): stop — re-open the
  `directors-in-core` vs `kai-orchestrator` question and the hooks-ownership mechanism with
  the steward and architect **before** any tree is committed.
- **Risk / unknowns:** this *is* the unknown. Front-loaded on purpose so failure is cheap.

### WS#3 — Cross-pack reference validator

- **Work-item ID:** `pack-split-crosspack-validator`
- **Milestone:** dependency-guarantees
- **What it is:** validate every cross-pack reference across **all three firing paths** —
  inherited (`**Inherits:**`), user-invoked (`/skills run`), and orchestrated (agent-to-agent
  dispatch) — plus **non-markdown asset** references (e.g. `scripts/demo-*.mjs`) and the rule
  that **`hooks.json` is assigned to exactly one pack**. Layered onto the multi-manifest
  validator from WS#1.
- **Owner:** principal-swe-infra
- **Verification owner:** principal-swe-infra (CI)
- **Review requirements:** principal-swe-architect / independent-architecture (firing-path
  coverage + reference correctness — the caveat the partition-lock review named)
- **Size:** L
- **Dependencies:** `pack-split-generator-gates` (shipped)
- **Touches:** `scripts/validate-plugin.mjs` (or new `scripts/validate-packs.mjs`),
  `.github/workflows/validate.yml`
- **Disposition:** Sequence — Ship-quality but blocked by WS#1 (needs the multi-manifest gate base).
- **Detail:** the "wired into the multi-manifest validate/release gates" clause of the
  steward's description is delivered here on top of WS#1. Runs in parallel with WS#4/#5.
- **Risk / unknowns:** the orchestrated firing path (agent-to-agent dispatch) has no static
  `**Inherits:**` anchor to grep; scoping how it is checked may need an architect call.

### WS#4 — Combined preflight + version-compat

- **Work-item ID:** `pack-split-preflight-compat`
- **Milestone:** dependency-guarantees
- **What it is:** materialize the `kai-core-contract-v1` skill as a **real** core skill
  (`skills/kai-core-contract-v1/SKILL.md`, today only script-synthesized by `contractSkill()`),
  and make the generator inject the combined **fail-closed preflight + version check** into
  each pack agent's own body, **byte-pinned in CI** exactly like `inherits-block.txt`.
- **Owner:** principal-swe-infra (generator injection + CI pin + contract skill)
- **Verification owner:** principal-swe-infra
- **Review requirements:** principal-swe-architect / independent-architecture (contract
  semantics); principal-security / independent-security (fail-closed refusal is a trust
  boundary — a missing/incompatible core must not silently degrade)
- **Size:** L
- **Dependencies:** `pack-split-generator-gates` (shipped)
- **Touches:** `skills/kai-core-contract-v1/SKILL.md` (new), `scripts/pack-preview.mjs`
  (`preflightBlock()`/`injectPreflight()` productionized), `scripts/lib/preflight-block.txt`
  (new canonical), `scripts/validate-plugin.mjs` (byte-pin), `.github/workflows/validate.yml`
- **Disposition:** Sequence — blocked by WS#1.
- **Detail:** "combined" = the probe and the `contract: 1` check are one injected block, so
  version skew and absence are one refusal path. Prototype already exists in `pack-preview.mjs`
  (self-test proves placement-after-inherits, single inherits line, exact refusal token).
- **Risk / unknowns:** low — the mechanism is proven in the preview; the work is productionizing
  + CI-pinning + the version-skew CI arm (co-delivered with WS#6).

### WS#5 — Degraded-mode refusal block

- **Work-item ID:** `pack-split-degraded-refusal`
- **Milestone:** dependency-guarantees
- **What it is:** one canonical refusal block (`scripts/lib/degraded-block.txt`) that restates
  **no** core rules — it states the *absence* of the contract and stops — copied into every pack
  agent by the generator and pinned byte-for-byte in CI.
- **Owner:** principal-swe-infra
- **Verification owner:** principal-swe-infra
- **Review requirements:** principal-swe-architect / independent-architecture (refusal-not-
  fallback: it must restate no rules, so it cannot drift); principal-security / independent-security
- **Size:** M (mirrors the `inherits-block.txt` canonical-file + CI-pin + generator-copy pattern)
- **Dependencies:** `pack-split-preflight-compat` (shipped) — shares the generator injection
  path and the same generated agent bodies (touch overlap), so it follows rather than races WS#4.
- **Touches:** `scripts/lib/degraded-block.txt` (new), `scripts/pack-preview.mjs` (injection),
  `scripts/validate-plugin.mjs` (byte-pin), `.github/workflows/validate.yml`
- **Disposition:** Sequence — blocked by WS#4 (shared agent-body injection surface).
- **Detail:** distinct from WS#4's one-line refusal *token*: this is the fuller shipped block
  the failed preflight points to. Kept a separate record because the steward's closure contract
  lists it separately, and its review lens (drift-proof refusal) is distinct.
- **Risk / unknowns:** low.

### WS#6 — CI partition checks + namespace enforcement (incl. forced rename)

- **Work-item ID:** `pack-split-ci-partition-checks`
- **Milestone:** dependency-guarantees
- **What it is:** wire the `--all` self-test plus **collision / partial-install / version-skew**
  arms as **real CI gates** (not just a self-test in `package.json`), and add the `kai-core-*`
  **namespace-prefix** enforcement for core-provided skills — which **forces the rename**
  `fleet-observation` → `kai-core-fleet-observation` (architect caveat **a**).
- **Owner:** principal-swe-infra
- **Verification owner:** principal-swe-infra
- **Review requirements:** principal-swe-architect / independent-architecture (namespace invariant
  + the rename + partition-CI coverage, incl. director availability membership-not-count)
- **Size:** L (CI wiring + namespace check + rename + the three test arms)
- **Dependencies:** `pack-split-crosspack-validator` (shipped), `pack-split-preflight-compat`
  (shipped, for the version-skew arm)
- **Touches:** `.github/workflows/validate.yml`, `scripts/validate-plugin.mjs` (namespace check),
  `scripts/pack-preview.mjs` (test arms), rename `skills/fleet-observation/` →
  `skills/kai-core-fleet-observation/`, `scripts/generate-catalog.mjs` (CATEGORIES line ~153),
  `test/fixtures/inventory.json`, docs referencing `fleet-observation`
  (`docs/getting-started.md`, `docs/workspaces.md`, `docs/reference/agents-and-skills.md`,
  `README.md`, `CHANGELOG.md`)
- **Disposition:** Sequence — the CI capstone of `dependency-guarantees`.
- **Detail:** the rename is **contained and low-risk** — `fleet-observation` is an orphan (no
  agent `**Inherits:**` it), so no inheritance references change; the blast radius is the skill
  dir + the catalog table + one test fixture + doc mentions. It rides with the namespace check
  because that check goes red until the rename lands. Must precede WS#7 so core's generated tree
  carries `kai-core-fleet-observation`.
- **Risk / unknowns:** low; the rename is mechanical and already sized by grep.

### WS#7 — Generate committed-unpublished pack trees (first department)

- **Work-item ID:** `pack-split-generated-pack-trees`
- **Milestone:** first-pack-extracted
- **What it is:** run the WS#1 generator from **root** to materialize the **committed-but-
  unpublished** `kai-core` + **first department (`personal`)** trees, realizing the explicit
  **asset-ownership rule** (architect caveat **c**): a non-markdown asset travels with the sole
  skill that invokes it — `scripts/demo-*.mjs` → `personal`; any asset invoked across >1 pack
  promotes to core; `hooks.json` + `scripts/observe-*.mjs` ship in **core only** (hooks exactly once).
- **Owner:** principal-swe-infra
- **Verification owner:** principal-swe-infra
- **Review requirements:** principal-swe-architect / independent-architecture (generate-not-move,
  asset-ownership determinism, hooks-in-core-only)
- **Size:** L
- **Dependencies:** `pack-split-generator-gates` (shipped), `pack-split-crosspack-validator`
  (shipped), `pack-split-preflight-compat` (shipped), `pack-split-degraded-refusal` (shipped),
  `pack-split-ci-partition-checks` (shipped), `pack-split-host-semantics-spike` (completed)
- **Touches:** new committed `packs/kai-core/` + `packs/kai-personal/`, `scripts/pack-preview.mjs`
  (asset/hooks ownership), `package.json` (test wiring for the pack dirs). Root `agents/`+`skills/`
  are **read, not moved**.
- **Disposition:** **Slice** — thin first increment = generate `kai-core` + `kai-personal` only,
  committed unpublished. **Deferred:** the `engineering`, `product`, `gtm` trees are generated
  one-at-a-time (each its own reviewable pass) ahead of their publication in WS#14 — honoring
  "generate/validate/prove one department at a time." `personal` is first because the proposal
  names it the most defensible first extraction and it is the department that **owns the demo
  assets**, so caveat (c) is resolved exactly where it is needed.
- **Detail:** because `engineering` is a **deferred** department, architect caveat **b** (bind
  the three review lenses on `workflow-doc-review`'s `**Inherits:**` line) is **not on the first-
  pack critical path** — it is resolved when the engineering tree is generated (see Open Questions).
- **Risk / unknowns:** the asset-ownership routing is new generator logic; contained by the
  architecture review and the WS#3 asset-reference validator.

### WS#8 — Migration doctor (uninstall-first, coexistence-refused, provenance migration)

- **Work-item ID:** `pack-split-migration-doctor`
- **Milestone:** first-pack-extracted
- **What it is:** extend `scripts/workspace-doctor.mjs` (which already carries a schema/migration
  ladder) to **verifiably uninstall legacy `kai` before any pack install**, **refuse coexistence**
  when both legacy `kai` and `kai-core` are detected, **migrate an existing `.kai` workspace's
  provenance**, and surface the **fresh-session notice** ("core installed; not active until a new
  session starts").
- **Owner:** principal-swe-infra
- **Verification owner:** principal-swe-infra
- **Review requirements:** principal-security / independent-security (legacy contract collision +
  uninstall-first/coexistence is a trust/safety boundary); principal-sre / independent-reliability
  (migration/provenance behavior, no partial-migration corruption)
- **Size:** L
- **Dependencies:** `pack-split-generator-gates` (shipped). Runs **in parallel** with WS#7
  (disjoint touches: `workspace-doctor.mjs` vs the generator/trees).
- **Touches:** `scripts/workspace-doctor.mjs`, `skills/kai-core-workspace-onboarding/SKILL.md`
  (fresh-session notice), test fixtures under `test/`
- **Disposition:** Sequence — blocked by WS#1 (needs the pack layout to detect coexistence).
- **Risk / unknowns:** detecting a legacy install reliably across hosts is partly a host question
  (informed by WS#2); the doctor logic itself is well-understood.

### WS#9 — Prove the first department installs over core

- **Work-item ID:** `pack-split-first-department`
- **Milestone:** first-pack-extracted
- **What it is:** prove a project can install **`kai-core` + `kai-personal`** from the committed-
  unpublished trees and its agents operate with the full contract resolved across the plugin
  boundary — with the migration doctor enforcing uninstall-first.
- **Owner:** principal-swe-infra (assembles the proof); **@operator** performs the real install
- **Verification owner:** principal-swe-infra (evidence); operator executes the install
- **Review requirements:** principal-swe-architect / independent-architecture (integration
  correctness — cross-boundary skill resolution on a real install)
- **Size:** M
- **Dependencies:** `pack-split-generated-pack-trees` (shipped), `pack-split-migration-doctor` (shipped)
- **Touches:** an evidence artifact under `kai/initiatives/pack-split/artifacts/reliability/`;
  possibly a staging marketplace source for the install (no public publish)
- **Disposition:** Sequence — blocked by WS#7 + WS#8.
- **Detail:** "shipped" here = the enabling changes are in a published `0.x` release **and** the
  install is verified by the operator against the committed trees — **distinct** from the public
  marketplace flip (WS#13). Flag to steward if a stricter `shipped` reading is intended.
- **Risk / unknowns:** operator-execution dependency; the cross-boundary resolution is de-risked
  by WS#2.

### WS#10 — Host gates (macOS + cloud + install-order evidence)

- **Work-item ID:** `pack-split-host-gates`
- **Milestone:** first-pack-extracted (**closes `completed`** — evidence record)
- **What it is:** the formal verification **evidence** that the real `kai-core` + `kai-personal`
  install behaves on **macOS**, on the **cloud host**, under **real install order**, **marketplace-
  vs-direct**, and across **fresh sessions**.
- **Owner:** principal-swe-infra (designs the gate + evidence record); **@operator** executes host runs
- **Verification owner:** principal-sre (reviews host/platform behavior); operator executes
- **Review requirements:** principal-sre / independent-reliability (host/platform behavior + operability)
- **Size:** L (cost is operator host-time; the deliverable is the evidence record)
- **Dependencies:** `pack-split-first-department` (shipped), `pack-split-migration-doctor` (shipped)
- **Touches:** evidence artifact under `kai/initiatives/pack-split/artifacts/reliability/` (no code)
- **Disposition:** Sequence — blocked by WS#9. Closes `completed` (knowledge/evidence).
- **Detail:** **scope question for the steward** — scoped as a **minimal smoke gate** (install-order
  + fresh-session + collision + cross-plugin resolution on macOS + one cloud host), **not** full
  certification (which the northstar explicitly *defers*). See *Scope negotiations*. This is the
  hard gate before the `1.0.0` flip (WS#13).
- **Risk / unknowns:** operator host availability; a bad result here blocks the flip by design.

### WS#11 — Honest guided onboarding installer

- **Work-item ID:** `pack-split-onboarding-installer`
- **Milestone:** five-pack-split-shipped
- **What it is:** the guided installer described honestly — show the exact pack set and commands,
  get explicit confirmation, **install core first**, **verify after every step, stop on first
  failure**, report partial state precisely, and **never claim unverified rollback**; plus the
  fresh-session caveat.
- **Owner:** principal-swe-infra (install-order/verify-gate semantics); prose co-authored by
  principal-technical-writer (off critical path)
- **Verification owner:** principal-swe-infra
- **Review requirements:** principal-swe-architect / independent-architecture (install-order
  correctness); principal-technical-writer / doc-review (honesty of the guided-installer prose)
- **Size:** M
- **Dependencies:** `pack-split-generated-pack-trees` (shipped), `pack-split-migration-doctor`
  (shipped). Runs **in parallel** with WS#10 (disjoint touches).
- **Touches:** `skills/kai-core-workspace-onboarding/SKILL.md`, `agents/workflow-workspace-init.agent.md`
- **Disposition:** Sequence — blocked by WS#7 + WS#8.
- **Risk / unknowns:** low — it is a prompt document; the discipline is honesty, not mechanism.

### WS#12 — Release 12a: migration notice (0.x)

- **Work-item ID:** `pack-split-release-12a`
- **Milestone:** five-pack-split-shipped
- **What it is:** ship a `0.x` monolith release carrying the **migration notice / deprecation
  warning** — the split is coming, here is how to migrate — **no packs published yet**.
- **Owner:** principal-swe-infra (release mechanics); **@operator** publishes; notice prose
  co-authored by principal-technical-writer
- **Verification owner:** principal-swe-infra
- **Review requirements:** principal-sre / independent-reliability (deprecation/rollout);
  principal-technical-writer / doc-review (notice accuracy)
- **Size:** M
- **Dependencies:** `pack-split-onboarding-installer` (shipped), `pack-split-migration-doctor` (shipped)
- **Touches:** `CHANGELOG.md`, `README.md`, `plugin.json` + `package.json` (**0.x** bump), the
  migration-notice content; `marketplace.json` unchanged (still monolith)
- **Disposition:** Sequence — blocked by WS#11. **Release/version: stays on `0.x`.**
- **Risk / unknowns:** low; operator-executed publish.

### WS#13 — Release 12b: the minimal 1.0.0 flip

- **Work-item ID:** `pack-split-release-12b`
- **Milestone:** five-pack-split-shipped
- **What it is:** the **flip** — publish `kai-core` + `kai-personal` to the `kai-plugins`
  marketplace (core never in the selector), **retire the published monolith `kai` plugin**, and
  cut **`1.0.0`** — **only after** the WS#10 host gates pass. Minimal = core + one department, not
  five at once.
- **Owner:** principal-swe-infra (release mechanics); **@operator** executes the marketplace
  publish + tag + monolith retirement (I do none of this)
- **Verification owner:** principal-swe-infra (pre-flip gate check); operator executes
- **Review requirements:** principal-sre / independent-reliability (highest blast radius: publish +
  monolith retirement); principal-security / independent-security (marketplace integrity, retiring
  the published monolith without a coexistence window)
- **Size:** L
- **Dependencies:** `pack-split-host-gates` (completed), `pack-split-release-12a` (shipped),
  `pack-split-onboarding-installer` (shipped)
- **Touches:** `.github/plugin/marketplace.json` (list `kai-core` + `kai-personal`, remove `kai`),
  `plugin.json` + `package.json` (**1.0.0**), the committed trees become published sources,
  `CHANGELOG.md`, `README.md`
- **Disposition:** Sequence — the gated flip. **Release/version: cuts `1.0.0` — reserved for exactly
  this step.**
- **Risk / unknowns:** the one true production-risk item. Guarded by the host-gate dependency, the
  security + reliability reviews, and operator execution.

### WS#14 — Release 12c: publish remaining departments + cleanup

- **Work-item ID:** `pack-split-release-12c`
- **Milestone:** five-pack-split-shipped
- **What it is:** generate (one-at-a-time) and publish the remaining `engineering`, `product`,
  `gtm` department packs, remove split scaffolding, and finalize on `1.0.x`.
- **Owner:** principal-swe-infra; **@operator** publishes each department pack
- **Verification owner:** principal-swe-infra
- **Review requirements:** principal-sre / independent-reliability (post-flip staged publish, no
  regression); principal-swe-architect / independent-architecture (each deferred tree, incl. the
  engineering review-lens binding from caveat **b**)
- **Size:** M (per-department generation is cheap/deterministic; the cost is staged publishing)
- **Dependencies:** `pack-split-release-12b` (shipped)
- **Touches:** `.github/plugin/marketplace.json` (add the three department packs), new committed
  `packs/kai-engineering|kai-product|kai-gtm/`, `plugin.json` + `package.json` (`1.0.x`), cleanup of
  scaffolding
- **Disposition:** Sequence — blocked by WS#13. **Release/version: `1.0.x`.** Publishes one
  department at a time, never all remaining in one step.
- **Risk / unknowns:** the engineering tree carries caveat (b) — resolve the review-lens binding
  before generating it.

---

## Critical path & sequencing

Driven by dependency and risk, spikes and foundation front-loaded. Parallel opportunities marked.

1. **WS#1 `generator-gates`** — the foundation every guarantee sits on; the single first build item.
2. **WS#2 `host-semantics-spike`** — start **immediately in parallel**; it gates WS#7 and its
   failure would rewrite the plan. Front-load the scariest unknown.
3. **WS#3 `crosspack-validator`** ∥ **WS#4 `preflight-compat`** — parallel once WS#1 ships
   (disjoint: validator script vs agent-body injection).
4. **WS#5 `degraded-refusal`** — follows WS#4 (shared agent-body injection surface).
5. **WS#6 `ci-partition-checks`** — capstone CI; needs WS#3 + WS#4; carries the forced fleet rename.
   → closes **`dependency-guarantees`** (with WS#1 added).
6. **WS#7 `generated-pack-trees`** (core + personal) ∥ **WS#8 `migration-doctor`** — parallel
   (disjoint: generator/trees vs `workspace-doctor.mjs`); WS#7 also needs WS#2 completed.
7. **WS#9 `first-department`** — prove core+personal installs; needs WS#7 + WS#8.
8. **WS#10 `host-gates`** ∥ **WS#11 `onboarding-installer`** — parallel; WS#10 needs WS#9,
   WS#11 needs WS#7+WS#8. → closes **`first-pack-extracted`** (WS#7/#8/#9 shipped, WS#10 completed).
9. **WS#12 `release-12a`** — migration notice on `0.x`; needs WS#11.
10. **WS#13 `release-12b`** — the `1.0.0` flip; **hard-gated on WS#10 host gates**; needs WS#12.
11. **WS#14 `release-12c`** — remaining departments + cleanup on `1.0.x`; needs WS#13.
    → closes **`five-pack-split-shipped`**.

This preserves the mandated revised sequence — decision/partition source → generator + multi-
manifest gates → cross-pack validator → combined preflight/compat → migration doctor → host gates →
department changes → onboarding → 12a → 12b → 12c — with **one deliberate refinement**, flagged
openly: **tree generation (WS#7) precedes the host gates (WS#10)** in dependency order, because a
host gate cannot install a department that has not been generated. The host **semantics** are still
de-risked *before* generation by the WS#2 spike; the host **gate evidence** (WS#10) certifies the
real install afterward. This splits "host gates" into an early de-risk and a late certification —
the honest topological reading of "prove the risky host semantics, and only then move agents."

---

## Versioning & closure semantics

| Group | Items | Version effect | Closure |
|-------|-------|----------------|---------|
| Groundwork tooling/guarantees | WS#1, #3, #4, #5, #6 | incremental **`0.x`** (each behavior PR bumps + changelog + README per `release-guard`) | `shipped` |
| First-pack generation/migration | WS#7, #8 | incremental **`0.x`** | `shipped` |
| First-pack proof | WS#9 | **`0.x`** (enabling changes) + operator install evidence | `shipped` |
| Host verification | WS#10 | none (evidence only) | **`completed`** |
| Onboarding | WS#11 | **`0.x`** | `shipped` |
| Migration notice | WS#12 | **`0.x`** | `shipped` (operator publish) |
| The flip | WS#13 | **`1.0.0`** — reserved for exactly this step | `shipped` (operator publish + retire monolith) |
| Remaining packs + cleanup | WS#14 | **`1.0.x`** | `shipped` (operator publish) |
| Spike | WS#2 | none | `completed` |

Rule preserved: **all groundwork ships on `0.x`; `1.0.0` is cut only at the WS#13 flip, only after
the WS#10 host gates pass.** Multiple groundwork items may batch into one `0.x` release; each behavior
PR still carries its own bump per the release-guard contract.

---

## Proposed milestone `required_items` mapping (for the steward)

The 12 steward-approved IDs are unchanged in bucket and closure state. **One addition proposed:**
add `pack-split-generator-gates` (`shipped`) to `dependency-guarantees`, because the guarantees are
not real without the multi-manifest gate + generator foundation, and closure should verify it.
`pack-split-host-semantics-spike` is left **supporting** (not a closure gate; WS#10 is the formal gate).

- **dependency-guarantees:** `pack-split-generator-gates` (shipped, *proposed add*),
  `pack-split-preflight-compat` (shipped), `pack-split-degraded-refusal` (shipped),
  `pack-split-crosspack-validator` (shipped), `pack-split-ci-partition-checks` (shipped).
- **first-pack-extracted:** `pack-split-generated-pack-trees` (shipped),
  `pack-split-migration-doctor` (shipped), `pack-split-host-gates` (completed),
  `pack-split-first-department` (shipped).  *(supporting: `pack-split-host-semantics-spike`.)*
- **five-pack-split-shipped:** `pack-split-onboarding-installer` (shipped),
  `pack-split-release-12a` (shipped), `pack-split-release-12b` (shipped),
  `pack-split-release-12c` (shipped).

---

## Scope negotiations (for the PM)

- **WS#10 (host-gates) depth.** Asked: "macOS + cloud + real install order + marketplace-vs-direct +
  fresh-session verification." Honest cost of *full* macOS/cloud **certification** is high (dedicated
  environments, matrix testing) — and the northstar's own `deferred` list already defers "full macOS
  and cloud-host certification." Cheaper alternative: scope WS#10 to a **minimal smoke gate** (install-
  order + fresh-session + collision + cross-plugin resolution on macOS + one cloud host) — enough
  confidence to flip, with full certification staying deferred. **PM decision needed:** confirm minimal
  smoke, not full cert. (If full cert is required for the first pack, that is a genuine Pushback — the
  cost outruns the value of a *first* department.)

- **WS#2 vs WS#10 (fold the spike?).** Asked implicitly by the sequence ("host gates" as one step).
  I split an **early de-risk spike** (WS#2, on the throwaway preview) from the **late certification**
  (WS#10, on the real trees). The spike costs one operator host session and can save the entire
  extraction investment if the cloud host fails. **PM decision needed:** keep WS#2 as a separate
  gating spike (recommended), or fold it into WS#10 as a phased early arm to avoid a second item.

---

## Open questions / decisions needed

1. **Review-lens binding (architect caveat b) — routed to `principal-swe-architect`, not guessed
   here.** Should `review-dependencies`, `review-performance-scale`, `review-success-metrics` be added
   to `workflow-doc-review`'s `**Inherits:**` line (it already inherits four sibling lenses and *names*
   these three in its body)? Binding makes them engineering-inherited (auto-placed per the partition)
   and fires them via inheritance; not binding keeps them body-composed and manually placed.
   **Manager recommendation:** bind, for consistency and automatic placement. **Consequence:** it is
   **not on the first-pack (`personal`) critical path** — it is only needed when the **engineering**
   tree is generated (deferred to WS#14), so it does not block anything now. Architect ratifies before
   the engineering tree is generated.

2. **Committed-tree location.** WS#1/#7 assume the committed-unpublished trees live at `packs/`
   (so `release-guard` behavior-classification and the marketplace `source` can point at them). Confirm
   `packs/` vs another root (e.g. `dist/`) — a one-line convention that the generator and both gates
   must agree on.

3. **`first-department` "shipped" semantics.** WS#9 reaches `shipped` via a `0.x` release + operator
   install evidence against the committed trees, **not** a public marketplace publish (that is WS#13).
   Confirm this reading of `shipped` for a committed-unpublished first department, or tighten it.

4. **Director availability in core.** The proposal resolved directors stay in core *conditionally*
   (resolve availability by **membership**, before leasing) and calls that work "partly landed." No
   `required_item` covers it. Confirm it is complete, or the steward adds an item — WS#6's partition CI
   is where a membership-not-count assertion would live.
