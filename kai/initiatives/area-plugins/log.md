# Initiative log — area-plugins

Chronological, append-only. Earlier entries are never rewritten.

## 2026-08-27-1816 — Intake (director-chief-of-staff)

Operator authorized the post-split refactor from the shipped v1.0.4 five-pack
topology to area-focused standalone plugins over an **optional** `kai-core`, and
approved proceeding without pauses except for an unresolved critical
architecture decision.

Workspace resolved to `C:\src\kai` (repository mode, north star root `.`).

Grounded from source before any record was written: `PACKS_DIR = 'packs'`
(`scripts/lib/pack-plan.mjs`), `MARKETPLACE = 'kai-plugins'`
(`scripts/lib/migration-doctor.mjs`), five plugins live at lockstep `1.0.4` with
`installSurface: packs`, the nine `personal` agents, the four `demo-*` entries in
`SKILL_OWNER_OVERRIDES`, `director-executive-assistant` sitting in `core`, and
the byte-pinned `KAI-CORE-MISSING` preflight plus degraded refusal.

`creative-video-director` was found to be the **sole** referencer of
`create-product-demo`, `demo-capture`, `demo-narrate`, and `demo-zoom`, so those
four skills follow its placement — collapsing a would-be second decision.

`pack-split` remains `shipped` and closed. Lineage is `related: [pack-split]`.

## 2026-08-27-1839 — Scope accepted (principal-product-manager)

Steward authored the scope, ruled the ordering risk, and revised the phase
order so that `optional-core-contract` lands before the taxonomy split and the
renames: no new plugin identity is published under a marketplace name or an
operating contract already decided to change. Added the binding reframing that
**fail-closed is relaxed for loading, never for claims**.

## 2026-08-27-1906 — Milestone-1 decisions accepted

Optional-core architecture and round-1 taxonomy both accepted after the steward
verified their load-bearing claims against source rather than on summary.

## 2026-08-27-2042 — Migration architecture, three reliability reviews

`principal-sre` returned `changes-requested` three times (0P0/4P1, 0P0/1P1,
0P0/1P1). Each pass found a real, narrower defect; the record converged rather
than churned. Still `in-review`.

## 2026-08-27-2115 — Operator second revision

Nine additional P0 concerns admitted. The steward **split the initiative**:
archive, backlog, design-output, and storage-mode concerns moved to a proposed
`workspace-corpus-contract` initiative because they touch none of this
initiative's targets. Infra proved the tool-allowlist warnings were **cosmetic**
on the measured host, stopping a 112-file rename before it shipped.

## 2026-08-27-2153 — Main-agent override; nine-plugin target (this entry)

The main agent reviewed the director report and **overrode two director/steward
recommendations**, with reasons recorded in
`artifacts/decisions/area-plugins-taxonomy-round-3.md`:

1. **`kai-directors` ACCEPTED** as an executive routing layer rather than a
   department, with an explicit, bounded exception to department standalone
   semantics.
2. **`kai-project-management` ACCEPTED** as a product boundary, seeded from the
   current *core coordination* workflows rather than from the mechanically
   welded engineering release workflows.

Official GitHub documentation for the Copilot CLI tool vocabulary was supplied
(observed 2026-08-27), superseding the repo's `SUPPORTED_TOOLS` guesswork and
proving **validator/runtime drift** on the operator's live CLI. A live host-tool
conformance probe becomes the first implementation item; no capability is
stripped before it reports.

GitHub issue **#192** records the distributed multi-PC agents proposal as an
external, implementation-free proposal.
