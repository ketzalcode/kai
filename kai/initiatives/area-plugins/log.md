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

## 2026-08-28-0055 — Host-tool probe executed; records-only reconciliation

The main agent implemented `scripts/host-tool-probe.mjs` plus its pure
classifier in the working tree and **executed it**. This entry records the
evidence; the director pass was records-only and edited no script, manifest,
agent, or skill.

**Four defects were fixed before any result was trusted** — qualified
`<ephemeral-plugin>:<agent>` names (unqualified exited `1` and would have read
as a capability denial), outer `--allow-all-tools` (so permission policy could
not masquerade as an allowlist denial), `--copilot-entry` (a PATH `.cmd` shim
reported `1.0.79` while `spawnSync` resolved the active `1.0.81`, so **version
attribution was wrong**), and `--rows` for bounded retries. Offline self-test
**11/11**.

**Runtime channel is `observed` on both `1.0.79` and `1.0.81`.** `R2-primary`
and `R8-repo-current` were valid direct *and* delegated, exercising
read/edit/create/search/execute/agent successfully. `R9-control` behaved exactly
as "only `read` plus bogus names are effective" predicts, confirming the
documented unrecognized-names-are-ignored rule against the live binary.

**Validator channel is honestly `unobserved`.** No noninteractive prompt path
emitted warnings, including for bogus controls; prompt mode cannot reproduce the
interactive startup warning surface. The user-reported interactive warning
**remains real and is not refuted**. The two-channel design held: a channel that
could see nothing was not reported clean.

So the official primary aliases are runtime-safe on both versions, and **no
declaration migration or B1/B2/B3 branch may be selected** on this evidence
alone. No live baseline was committed.

The operator blocker `Q-area-plugins-tool-allowlist-fix-01` is cleared on both
`area-plugins-host-tool-conformance` and `area-plugins-tool-allowlist-fix`. The
conformance item stays **`in-progress`, not `in-review`**: the working tree is
uncommitted, so `change_ref` is `null` and the declared exact-ref architecture
review has nothing to bind to.

**Wildcard fact re-asserted:** `tools: ["*"]` and omission are documented and
supported (enable all available tools); `tools: []` disables all. Kai rejects
all three for its own entries as a **least-privilege policy**, never as a claim
that the host does not recognize the token. One superseded contrary statement
survives at
`kai/coordination/threads/area-plugins-host-tool-conformance.md:139` and is
deliberately left intact — it is corrected in the same thread at line 422 and
again in the item and decision artifact, and erasing it would hide that the
correction happened.

## 2026-08-28-0112 — Exact-ref host-tool architecture review approved

`principal-swe-architect` approved implementation commit
`4d711779408c8f675a740b5e243686d9e66a5ce4` with disposition **Endorse**.
The review found P0 `0`, P1 `0`, P2 `2`; both P2s were record-only and were
corrected without changing implementation code.

The approved shape uses qualified local-plugin agents, outer
`--allow-all-tools`, OS-temp isolation, direct/delegated channels, exact
`--copilot-entry`, bounded `--rows`, redaction, deterministic JSON, and offline
synthetic self-tests. No live baseline or report is committed, no declaration
migration is present, and version surfaces remain `1.0.5`.

The corrections remove an absolute user-home path from durable evidence and
narrow the R9 claim: read/search-only runtime behavior corroborates the
documented ignored-name rule, but with validator warnings unobserved,
`findings.bogus_ignored` remains `null`. The R8 set is also correctly counted
as 16 identifiers, not 15.

The item is `in-review`, exact-ref review is complete, and `next_role` is
`workflow-ship` / main agent for fresh PR-head CI and publication preparation.
Nothing is called shipped.
