# Documentation — Pack split: the locked five-pack partition

**Mode:** REFERENCE (authoritative partition record that gates migration PRs)
**Audience/job:** Engineers and reviewers on the `pack-split` initiative who need
one place to check whether an agent or skill belongs to `kai-core` or a department
pack, instead of re-deriving the boundary from `scripts/pack-preview.mjs` on each PR.
**Product version:** kai `0.57.0` (`.kai/manifest.json`), roster as on disk on
2026-08-24 — 56 agents, 50 skill directories.
**Accuracy basis:** The on-disk roster (`agents/*.agent.md` `**Inherits:**` lines and
`skills/*/SKILL.md`), the `PACKS` constant and `planPacks()`/`selfTest()` logic in
`scripts/pack-preview.mjs`, the editorial `CATEGORIES` table in
`scripts/generate-catalog.mjs`, and the committed decisions in
`kai/initiatives/pack-split/northstar.md` and `docs/proposals/pack-architecture.md`.
**Recommendation:** Needs-verification — the partition, the naming decision, and the
docs-only scope are `observed` and self-consistent; the eight orphan-skill **moves**
and the dependency-direction claim are recorded here for `principal-swe-architect`
(`independent-architecture`) to ratify before the owner closes the item.

---

## 1. Audience, job, and scope

### In scope (this lock records)

1. The five-pack **agent** partition: every one of the 56 agents assigned to exactly
   one owning pack — `core`, `engineering`, `product`, `gtm`, `personal`.
2. The **skill → single provider** assignment: every one of the 50 skill directories
   assigned to exactly one provider (core or a department), with the **core-shared**
   skills — the ones that must resolve across the plugin boundary — called out.
3. A **disposition** for each of the 9 skills that no agent inherits (the set the
   builder currently parks in core as a placeholder): an explicit keep-in-core or
   move decision with a one-line rationale.
4. The **naming decision** as it applies to skill identity: the owned-namespace
   `kai-core-*` prefix, the single version-pinned skill `kai-core-contract-v1`, and
   the rule that no taxonomy segment appears in a name.
5. The **dependency-direction** claim this partition depends on: core depends on
   nothing, no department pack depends on another, and shared skills resolve from
   core across the plugin boundary.

### Out of scope (named, not resolved — see §9)

Everything an *implementation* would decide: the generator, the preflight/compat
mechanics, the degraded-mode block, CI partition enforcement, the cross-pack
reference validator, non-markdown asset ownership, hooks, host gates, migration
doctor, and the staged release. Those belong to `pack-split-engineering-decomposition`
and the downstream milestones. This is a **knowledge** artifact: it changes no agent,
skill, script, or `plugin.json`, and moves no files.

### What this document is *not*

It is not authority to change the product. Where a disposition implies a future move
or rename, that move is a downstream engineering action, ratified here as intent, not
performed here.

---

## 2. How this partition was derived and verified

Two independent derivations agree, which is the basis for locking it:

- **Derivation A — roster replay.** Every `agents/*.agent.md` was enumerated (56
  files) and each mapped to its pack via the `PACKS` constant; every `**Inherits:**`
  line was read and each skill assigned to a provider by re-applying the exact rule in
  `planPacks()` — *a skill inherited by agents in more than one pack, or by any core
  agent, is provided by core; otherwise the single owning pack provides it; a skill no
  agent inherits is an orphan.* `[observed]`
- **Derivation B — the proposal's reported run.** `docs/proposals/pack-architecture.md`
  (§"Phase 2/3 results") independently reports the live
  `node scripts/pack-preview.mjs --all` output: "`kai-core-preview` (7 agents, 22 core
  skills + 9 unplaceable) plus engineering (20), product (9), gtm (11) and personal
  (9)… 56 of 56 agents assigned, no agent claimed twice, and no skill provided by both
  core and a pack." `[product-capability]`

The agent counts (7 / 20 / 9 / 11 / 9 = 56), the core-skill count (22), the orphan
count (9), and the orphan families (`demo-*`, `fleet-observation`, `onboard-to-codebase`,
three `review-*`) match between A and B.

> **Execution-transparency note.** The `--all` and `--self-test` console output in §8 was
> **reconstructed** by applying the script's algorithm to the on-disk roster; the live
> `node` process was **not** executed in this authoring environment (this role's toolset
> is read/write/search only, with no shell). The reconstruction is deterministic and
> cross-checked against Derivation B. As a review step, `principal-swe-architect` should
> run the two commands and confirm the output matches §8 bit-for-bit; that live run is
> the ratifying evidence.

---

## 3. Agent partition — all 56, by owning pack

Source: `PACKS` in `scripts/pack-preview.mjs`, cross-checked against the 56
`agents/*.agent.md` files on disk. `[observed]`

### 3.1 `core` — 7 (the org spine + workspace machinery; meaningful with no department installed)

| # | Agent |
|---|-------|
| 1 | `director-chief-of-staff` |
| 2 | `director-executive-assistant` |
| 3 | `workflow-initiative-init` |
| 4 | `workflow-proactive-scan` |
| 5 | `workflow-self-check` |
| 6 | `workflow-weekly-pulse` |
| 7 | `workflow-workspace-init` |

### 3.2 `engineering` — 20

| # | Agent | # | Agent |
|---|-------|---|-------|
| 1 | `principal-ai-applied-engineer` | 11 | `principal-swe-frontend` |
| 2 | `principal-ai-researcher` | 12 | `principal-swe-infra` |
| 3 | `principal-data-engineer` | 13 | `principal-swe-manager` |
| 4 | `principal-privacy-compliance` | 14 | `principal-technical-writer` |
| 5 | `principal-qa-ui` | 15 | `workflow-doc-review` |
| 6 | `principal-security` | 16 | `workflow-incident-response` |
| 7 | `principal-solutions-architect` | 17 | `workflow-issue-analysis` |
| 8 | `principal-sre` | 18 | `workflow-localization` |
| 9 | `principal-swe-architect` | 19 | `workflow-pull-request` |
| 10 | `principal-swe-backend` | 20 | `workflow-ship` |

### 3.3 `product` — 9

| # | Agent | # | Agent |
|---|-------|---|-------|
| 1 | `persona-ux-first-time-user` | 6 | `principal-product-strategist` |
| 2 | `principal-brand-designer` | 7 | `workflow-customer-feedback` |
| 3 | `principal-data-analytics` | 8 | `workflow-experiment-review` |
| 4 | `principal-product-designer` | 9 | `workflow-product-explore` |
| 5 | `principal-product-manager` | | |

### 3.4 `gtm` — 11

| # | Agent | # | Agent |
|---|-------|---|-------|
| 1 | `principal-customer-success` | 7 | `principal-product-marketing` |
| 2 | `principal-demand-generation` | 8 | `principal-revenue-operations` |
| 3 | `principal-growth` | 9 | `principal-sales` |
| 4 | `principal-linkedin-strategist` | 10 | `principal-seo` |
| 5 | `principal-partnerships` | 11 | `workflow-support-triage` |
| 6 | `principal-pricing-monetization` | | |

### 3.5 `personal` — 9 (= `PACK_AGENTS` in the script)

| # | Agent | # | Agent |
|---|-------|---|-------|
| 1 | `creative-video-director` | 6 | `persona-professional-trainer` |
| 2 | `instructor-path-mentor` | 7 | `persona-self` |
| 3 | `instructor-teacher` | 8 | `principal-engineer-career-mentor` |
| 4 | `instructor-tutor` | 9 | `workflow-course-to-audio` |
| 5 | `persona-professional-nutritionist` | | |

### 3.6 Roster diff — proof the partition covers disk exactly (not by eye)

| Check | Result | Basis |
|-------|--------|-------|
| Agent files on disk (`agents/*.agent.md`) | 56 | glob enumeration `[observed]` |
| Agents named in `PACKS` (7+20+9+11+9) | 56 | `PACKS` constant `[observed]` |
| On-disk files not claimed by any pack | 0 | every filename above maps to one pack `[observed]` |
| `PACKS` entries with no on-disk file | 0 | every `PACKS` id resolves to a file `[observed]` |
| Agents claimed by two packs | 0 | pack lists are pairwise disjoint `[observed]` |

This is the `selfTest()` invariant restated against disk: `unassigned = 0`,
`assigned == rosterSize == 56`, and `|set(all pack agents)| == 56`.

---

## 4. Skill → single provider — all 50

Source: the `**Inherits:**` line of every agent, resolved through the `planPacks()`
rule. `[observed]` The 50 skill directories partition into **22 core-provided +
19 pack-owned + 9 orphan = 50**.

### 4.1 Core-provided skills — 22

Every one of these carries the `kai-core-*` prefix, and every `kai-core-*` skill on
disk is core-provided: **provider and prefix coincide exactly (22 = 22).** `[observed]`
They split by whether a *pack* agent inherits them.

**Core-shared — 15 (inherited across the plugin boundary; these are the skills that
must resolve from `kai-core` into a department pack):**

| Skill | Inherited by packs | Why core |
|-------|--------------------|----------|
| `kai-core-team-operating-rules` | core, engineering, product, gtm, personal | universal contract; every agent inherits it |
| `kai-core-workspace-conventions` | core, engineering, product, gtm, personal | inherited across all five packs |
| `kai-core-work-coordination` | core, engineering, product, gtm, personal | inherited across all five packs |
| `kai-core-work-activity` | core, engineering, product, gtm, personal | inherited across all five packs |
| `kai-core-peer-communication` | core, engineering, product, gtm, personal | inherited across all five packs |
| `kai-core-no-self-remediation` | core, engineering, product, gtm, personal | inherited across all five packs |
| `kai-core-definition-of-done` | core, engineering | a core agent inherits it |
| `kai-core-issue-analysis` | core, engineering | a core agent inherits it |
| `kai-core-pr-delivery` | core, engineering | a core agent inherits it |
| `kai-core-generate-audio` | core, personal | a core agent inherits it |
| `kai-core-web-content-extraction` | core, personal, gtm | a core agent inherits it |
| `kai-core-scope-discipline` | engineering, product, gtm | multi-pack, **no** core consumer — in core only to avoid cross-pack duplication |
| `kai-core-content-grounding` | personal, gtm | multi-pack, **no** core consumer — same reason |
| `kai-core-design-grounding` | product, engineering | multi-pack, **no** core consumer — same reason |
| `kai-core-web-evaluation` | personal, product, gtm, engineering | multi-pack, **no** core consumer — same reason |

The last four are the clearest illustration of the northstar principle *"shared skills
live once in core and resolve across the plugin boundary"*: no core role uses them, yet
they must live in core because more than one department does — putting them in any one
department would make the other departments depend on it.

**Core-internal — 7 (provided by core, inherited only by core's own agents):**

| Skill | Inherited by (core agents only) |
|-------|----------------------------------|
| `kai-core-initiative-stewardship` | `director-chief-of-staff` |
| `kai-core-decision-brief` | `director-executive-assistant` |
| `kai-core-executive-consultation` | `director-executive-assistant` |
| `kai-core-personal-agenda` | `director-executive-assistant`, `workflow-proactive-scan` |
| `kai-core-workspace-onboarding` | `workflow-workspace-init` |
| `kai-core-proactive-scan` | `workflow-proactive-scan` |
| `kai-core-pulse-digest` | `workflow-weekly-pulse` |

### 4.2 Pack-owned skills — 19 (inherited by exactly one pack, not by core)

| Pack | Count | Skills |
|------|-------|--------|
| `engineering` | 11 | `build-diagrams`, `coding-style`, `doc-review-rigor`, `pr-sizing`, `research-before-coding`, `review-alternatives`, `review-rationale`, `review-risks-scope`, `review-rollout-operability`, `review-security-privacy`, `review-ux-accessibility` |
| `product` | 3 | `html-block-diagrams`, `product-exploration`, `ui-mockup` |
| `gtm` | 2 | `linkedin-content`, `product-marketing-intelligence` |
| `personal` | 3 | `extract-writing-style`, `generate-html-lesson`, `video-direction` |

### 4.3 Orphan skills — 9 (inherited by no agent → not placeable by inheritance)

`create-product-demo`, `demo-capture`, `demo-narrate`, `demo-zoom`,
`fleet-observation`, `onboard-to-codebase`, `review-dependencies`,
`review-performance-scale`, `review-success-metrics`.

Confirmed by grep: none of these nine appears on any `**Inherits:**` line in
`agents/`. `[observed]` The builder currently sweeps all nine into the core preview
plugin (`buildAll` writes `[...plan.core, ...plan.orphans]` into `kai-core-preview`) —
which the proposal itself flags as *"a placeholder, not a decision."* §5 turns each
into a decision.

---

## 5. Orphan-skill dispositions (the decisions this lock ratifies)

These nine are the only skills the mechanical rule cannot place, so each needs a human
decision. The rule for the decision: a skill belongs in **core** only if it is
cross-cutting and meaningful with no department installed; otherwise it belongs in the
**one department that owns its domain**, even though no agent inherits it today.
`[inferred — proposed for architect ratification]`

| Orphan skill | Disposition | One-line rationale |
|--------------|-------------|--------------------|
| `create-product-demo` | **move → `personal`** | Directs the demo toolchain that personal's `creative-video-director` drives from its body (which names this skill); no consumer outside personal. |
| `demo-capture` | **move → `personal`** | Capture stage of that same toolchain; referenced by `creative-video-director` and by personal-owned `video-direction`. |
| `demo-narrate` | **move → `personal`** | Narration stage of that toolchain; named repeatedly in `creative-video-director`'s body. |
| `demo-zoom` | **move → `personal`** | Focus/zoom render stage of that toolchain; referenced by `creative-video-director` and `video-direction`. |
| `fleet-observation` | **keep in `core`** | Operator-facing observability of the whole kai subagent fleet ("which roles did or did not participate"); cross-cutting and meaningful with no department installed. |
| `onboard-to-codebase` | **move → `engineering`** | User-invocable engineering-craft report (map an unfamiliar repo's stack/architecture); catalogued under *Engineering craft*, useful only where engineering is installed. |
| `review-dependencies` | **move → `engineering`** | Doc-review lens named in engineering's `workflow-doc-review` body; sibling of the six engineering-owned review lenses. |
| `review-performance-scale` | **move → `engineering`** | Doc-review lens named in `workflow-doc-review`'s body; sibling of the engineering-owned review lenses. |
| `review-success-metrics` | **move → `engineering`** | Doc-review lens named in `workflow-doc-review`'s body; sibling of the engineering-owned review lenses. |

**Disposition summary:** keep-in-core **1** (`fleet-observation`); move **8** —
`personal` +4 (the demo toolchain), `engineering` +4 (`onboard-to-codebase` and the
three unbound review lenses). Grounding for the moves is in the grep of agent and skill
bodies: `creative-video-director` names the four demo skills (agent lines 92, 118, 123,
199, 207, 274) and `workflow-doc-review` names the three orphan review lenses (agent
lines 95, 97, 98). `[observed]`

**Provider totals — today (by inheritance) vs. as ratified by this lock:**

| Provider | Today: inherited | Today: orphans parked | **Ratified total** |
|----------|------------------|-----------------------|--------------------|
| `core` | 22 | 9 (placeholder) | **23** (22 + `fleet-observation`) — plus the new `kai-core-contract-v1` |
| `engineering` | 11 | — | **15** (+`onboard-to-codebase`, +3 review lenses) |
| `product` | 3 | — | **3** |
| `gtm` | 2 | — | **2** |
| `personal` | 3 | — | **7** (+4 demo skills) |
| **On-disk total** | | | **50** (23+15+3+2+7) |

Two ratification caveats for the architect, both *flagged, not decided here*:

- **`fleet-observation` prefix.** If kept in core, it is the one core-provided skill
  without the `kai-core-*` prefix, which breaks the "provider == prefix" invariant in
  §4.1. Renaming it to `kai-core-fleet-observation` is a downstream rename (a behaviour
  change), not this docs lock.
- **Three review lenses vs. the Inherits line.** `workflow-doc-review` names
  `review-dependencies`, `review-performance-scale`, and `review-success-metrics` in its
  body but not on its `**Inherits:**` line. Whether to add them to the Inherits line
  (which would make them engineering-inherited rather than orphan, placing them
  automatically) is a downstream engineering-content decision.

---

## 6. Naming decision (skill identity)

Grounded in the northstar non-negotiables and `docs/proposals/pack-architecture.md`
§"Legacy collision", and consistent with `scripts/generate-catalog.mjs`. `[observed]`

1. **Owned-namespace `kai-core-*` prefix.** Core skills carry the `kai-core-*` prefix so
   a legacy `kai` monolith cannot accidentally satisfy a core dependency (host Finding 6:
   two plugins providing the same skill name are *both* exposed, namespace-qualified —
   so a distinct name is the defence). All 22 core-provided skills already carry it, and
   the set of `kai-core-*` skills equals the set of core-provided skills. `[observed]`
2. **Exactly one version-pinned skill: `kai-core-contract-v1`.** This is the fail-closed
   preflight probe — a uniquely named skill returning a rigid `KAI_CORE_READY` /
   `contract: 1` marker that each pack agent invokes as its first action. It is the
   *only* skill whose name carries a version segment (`-v1`); version skew is meant to be
   detectable by the name. It is not one of the 50 on-disk skill directories today — the
   preview synthesises it (`contractSkill()` in `scripts/pack-preview.mjs`), and the
   shipped `kai-core` will materialise it. Per-pack semver stays in lockstep with this
   one contract version (northstar: "Per-pack independent semver … lockstep for now").
   `[observed]` / `[product-capability]`
3. **No taxonomy segment in a name.** A skill's name encodes *identity and ownership*
   only — `kai-core-work-coordination`, never `kai-core-workspace-work-coordination` and
   never `core.workspace.work-coordination`. Classification (the human-readable grouping,
   e.g. "Workspace & scope", "Engineering craft") lives in the editorial `CATEGORIES`
   table in `scripts/generate-catalog.mjs`, and pack membership lives in `PACKS` /
   the generated pack trees — deliberately *not* in the name or even in frontmatter.
   `generate-catalog.mjs` states the reason explicitly: adding a `category:` key to the
   files "would widen the host-loader contract for a docs-only concern." `[observed]`

---

## 7. Dependency direction (the claim this partition rests on)

The northstar's first non-negotiable: *"everything depends on core and core depends on
nothing."* This lock ratifies three concrete, checkable statements.

1. **Core depends on nothing.** Every skill inherited by a core agent is core-provided:
   the 7 core agents inherit only `kai-core-*` skills, all 22 of which are in the
   core-provided set (§4.1). No core agent reaches a pack-owned or orphan skill.
   Therefore `kai-core` needs no department to function. `[observed]` — architect to
   confirm against `change_ref`.
2. **No department pack depends on another.** By the `planPacks()` rule, any skill
   inherited by agents in more than one pack is promoted to core; so a pack agent can
   only inherit (a) a core-provided skill or (b) its own pack's local skill — never
   another pack's local skill. Roster-verified: no `engineering` agent inherits a
   `product`/`gtm`/`personal` local skill, and symmetrically for the others. The
   dependency graph among departments is empty. `[observed]` — architect to confirm.
3. **Shared skills resolve from core across the plugin boundary.** The 15 core-shared
   skills (§4.1) are inherited by department-pack agents but provided by `kai-core`, in a
   different plugin. Host Finding 2 (measured, Windows CLI) confirms an agent in plugin A
   *can* load a skill from plugin B, and Finding 3 confirms it fails if B is absent —
   which is why the preflight (§6.2) and the degraded-mode refusal exist. This is
   `[product-capability]` (measured in the proposal); making it *fail-closed and
   CI-enforced* is downstream (`dependency-guarantees`), not part of this lock.

Direction, therefore: **`department pack → kai-core`, and never `pack → pack` or
`core → pack`.** Statements 1 and 2 are provable from the roster now; statement 3 is
measured and hardened downstream.

---

## 8. Reconstructed script evidence

Reconstructed from `planPacks()`/`selfTest()` applied to the on-disk roster (see the
transparency note in §2). `<tmp>` denotes a throwaway `--out` directory (e.g. under
`.kai/runs/`); the generated tree is evidence only, never a deliverable.

### 8.1 `node scripts/pack-preview.mjs --all --out <tmp>`

```text
  kai-core-preview              7 agents  <tmp>/kai-core-preview
  kai-engineering-preview      20 agents  <tmp>/kai-engineering-preview
  kai-product-preview           9 agents  <tmp>/kai-product-preview
  kai-gtm-preview              11 agents  <tmp>/kai-gtm-preview
  kai-personal-preview          9 agents  <tmp>/kai-personal-preview

core skills: 22 (+9 inherited by nobody)
  engineering owns 11: build-diagrams, coding-style, doc-review-rigor, pr-sizing, research-before-coding, review-alternatives, review-rationale, review-risks-scope, review-rollout-operability, review-security-privacy, review-ux-accessibility
  product owns 3: html-block-diagrams, product-exploration, ui-mockup
  gtm owns 2: linkedin-content, product-marketing-intelligence
  personal owns 3: extract-writing-style, generate-html-lesson, video-direction

unplaceable by inheritance: create-product-demo, demo-capture, demo-narrate, demo-zoom, fleet-observation, onboard-to-codebase, review-dependencies, review-performance-scale, review-success-metrics
```

### 8.2 `node scripts/pack-preview.mjs --self-test`

```text
  ok the universal contract is planned into core, never into the pack
  ok and it is not also duplicated into the pack, which is the whole point
  ok a pack that owns no skills of its own would not be testing anything
  ok core and pack skill sets are disjoint: a skill has exactly one provider
  ok the preflight lands after the inherits directive, not before it
  ok injection does not duplicate the inherits line CI pins to exactly one
  ok the agent carries the exact refusal token the test asserts on
  ok frontmatter still opens the file and endings are uniform LF, so the host can load it
  ok an agent without an inherits line still gets the preflight rather than silently skipping it
  ok the contract skill reports the version it was built with, so skew is testable
  ok every agent belongs to a pack (unassigned: none)
  ok the partition covers the roster exactly: 56 of 56
  ok no agent is claimed by two packs, which would make its home ambiguous
  ok the universal contract is provided by core in the full partition too
  ok no skill is provided by both core and a pack: exactly one provider each
  ok skills no agent inherits are reported separately, not silently defaulted into a pack

pack-preview self-test: 16 checks passed
```

Result: **PASS (16/16).** Key numbers: 5 plugins (7/20/9/11/9 agents = 56);
**22** core-provided skills; pack-owned 11/3/2/3; **9** orphans. The
`principal-swe-architect` review should re-run both commands against `change_ref` and
confirm this output.

---

## 9. Downstream / out of scope for this lock

Named so nothing is silently dropped; **none is resolved here.** Owning items are the
typed `required_items` in the northstar milestones; the sizing/sequencing of items not
yet created is the `principal-swe-manager` decomposition pass, gated on this item.

| Downstream concern | Owning item | Milestone |
|--------------------|-------------|-----------|
| The overall engineering decomposition (sizing, sequencing, parallelization) | `pack-split-engineering-decomposition` | (gated on this item) |
| All three skill firing paths — inheritance, direct `/skills run`, skill-to-skill composition | `pack-split-engineering-decomposition` → guarantee items | `dependency-guarantees` |
| Non-markdown asset ownership (e.g. `scripts/demo-*.mjs`, `scripts/demo-format.mjs` that the personal demo skills call; audio assets) | `pack-split-generated-pack-trees` / decomposition | `first-pack-extracted` |
| Hooks fire exactly once across composed plugins | `pack-split-engineering-decomposition` | `dependency-guarantees` |
| Script-path validity across the plugin boundary | `pack-split-crosspack-validator` | `dependency-guarantees` |
| Combined fail-closed preflight + version-compat (`kai-core-contract-v1`) | `pack-split-preflight-compat` | `dependency-guarantees` |
| Degraded-mode refusal block (restates no rules) | `pack-split-degraded-refusal` | `dependency-guarantees` |
| Actual CI partition checks (enforce this document) | `pack-split-ci-partition-checks` | `dependency-guarantees` |
| Multi-manifest / release gates; generated department trees | `pack-split-generated-pack-trees` | `first-pack-extracted` |
| Workspace-provenance migration; uninstall-first / coexistence-forbidden | `pack-split-migration-doctor` | `first-pack-extracted` |
| Host gates (macOS + cloud + real install order + fresh sessions) | `pack-split-host-gates` | `first-pack-extracted` |
| Director availability resolution ("can directors enumerate the installed roster", or split them into `kai-orchestrator") | availability-resolution work (partly landed) | `dependency-guarantees` |
| Staged `12a/12b/12c` release, marketplace flip, `1.0.0` cut | `pack-split-release-12a/-12b/-12c` | `five-pack-split-shipped` |

**If ratification finds the partition itself must change** (an agent in the wrong pack,
or a skill that cannot live where §5 places it), that is a partition change — stop and
raise it to the steward (`principal-product-manager`) as a question, rather than editing
it downstream.

---

## 10. Accuracy and consistency check, and reconciliations

| Item | Finding |
|------|---------|
| Agent count | 56 on disk = 56 in `PACKS` = self-test `56 of 56`. Consistent. `[observed]` |
| Core-skill count | 22 computed = 22 reported by the proposal's `--all`. Consistent. `[observed]` |
| Orphan set | 9 computed = 9 reported; families match (`demo-*`, `fleet-observation`, `onboard-to-codebase`, 3 `review-*`). Consistent. `[observed]` |
| **Skill count: 50 vs 49** | On-disk roster = **50** skill directories (`[observed]`). The proposal's Shape diagram and discovery-cost table say "49 skills / ~13.5k tokens" — the **earlier measured baseline**. The proposal's own Phase 2/3 section is internally consistent at 50 (22 core + 9 orphan + 19 pack-local). **Live governs: 50.** The `~13.5k` token figure is cited as a historical baseline, not re-measured here. |
| `kai-core-contract-v1` not on disk | Correct — it is script-synthesised today and materialised by the shipped core; the 50 on-disk skills exclude it. `[observed]` |
| Naming vs marketing/public claims | No public/marketing claim is created or altered; this is a developer-facing packaging record. Consistent. |

---

## 11. Open verifications and owner handoffs

- **`principal-swe-architect` (`independent-architecture`)** — ratify against
  `change_ref`: (a) the eight orphan **moves** and the one keep-in-core in §5; (b) the
  dependency-direction claims 1–3 in §7; (c) re-run §8's two commands and confirm the
  output. This is the item's single required review.
- **Steward (`principal-product-manager`)** — only if ratification surfaces a needed
  partition change (§9), as a question; otherwise the owner accepts and moves the item to
  `completed`.
- **Operator** — publishing/merge is out of this role's hands; this artifact is a
  reviewable knowledge record, not a live-docs publish.

---

## 12. Information architecture and publish path

- **Lives at:** `kai/initiatives/pack-split/artifacts/docs/pack-split-partition-lock.md`
  — the initiative's docs artifact lane. It is the `partition-lock` milestone's required
  knowledge deliverable.
- **Discovered via:** the initiative `deliverables.md` index (promoted at closure by the
  owner) and the milestone's `required_items`.
- **Relationship to shipped docs:** this is an *internal initiative record*, not a
  customer-facing docs-site page. It does not belong in `docs/reference/` and is not a
  candidate for the help center. If any of it later becomes user-facing (e.g. a
  "why kai-core is required" explainer), that is a separate HOW-TO/CONCEPT authored at
  release, routed to the operator to publish — not this record.
- **Localization:** none; internal English record. No translation is routed.

---

## 13. Coverage, unknowns, and owner

- **Coverage:** all five acceptance criteria are addressed — §3 (56 agents by pack) and
  §4 (every skill by provider, core-shared called out); §3.6/§4/§8 (self-test invariant
  demonstrated by disk diff); §5 (every orphan dispositioned with rationale); §6 (naming
  decision); §1/§9 (documentation-only, no behaviour changed).
- **Unknowns (all downstream, none blocking this lock):** live host gates on
  macOS/cloud/real-install-order (`unknown` here → `pack-split-host-gates`); a
  dispatch-probe stronger than roster introspection (`unknown` → deferred in northstar).
- **Owner:** `principal-technical-writer` authored; `principal-product-manager` owns and
  accepts; `principal-swe-architect` ratifies.

---

### Recommendation

**Needs-verification.** The record is accurate and internally consistent against the
on-disk roster and the script logic, and the partition is corroborated by the proposal's
independent run. It is ready for `principal-swe-architect` to ratify the orphan-skill
dispositions (§5) and the dependency-direction claims (§7) and to confirm §8 against a
live run — after which the owner can move the item to `completed`.
