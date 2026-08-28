# area-plugins — deliverables

Index of promoted, durable outputs for this initiative. Required to be non-empty
at closure, with every milestone's `required_items` satisfied. Promotion is
one-way and steward-approved:
`.kai/runs/ -> kai/initiatives/area-plugins/artifacts/ -> kai/library/<type>/`.

**Provenance note, and it applies to most rows below.** From 2026-08-27-1816
until 2026-08-27-2153 no agent in this session had a shell, so
`kai/initiatives/area-plugins/` could not be created. Several items therefore
reached `completed` with a **declared but unwritten** `artifact_target`, and
their durable record is the append-only coordination thread. Those rows are
marked `artifact owed` — the decision is real and accepted; only its promoted
canonical copy is missing. Transcribing them is a separate steward/owner pass,
not a licence for anyone to re-open the decision.

| deliverable | milestone | source item | artifact path | promoted to library | status |
|-------------|-----------|-------------|---------------|---------------------|--------|
| Initiative log (chronological, append-only) | — | — | `kai/initiatives/area-plugins/log.md` | — | **EXISTS** — written by `director-chief-of-staff` 2026-08-27; six entries through the 2153 main-agent override |
| North star (this initiative's thin core) | — | `area-plugins-scope-brief` | `kai/initiatives/area-plugins/northstar.md` | — | **EXISTS** — written by the steward 2026-08-27-2210; `status: active`, nine-plugin target, six milestones |
| Backlog / proposal channel | — | — | `kai/initiatives/area-plugins/backlog.md` | — | **EXISTS** — written by the steward 2026-08-27-2210; five parked proposals |
| Decision-artifact index | — | — | `kai/initiatives/area-plugins/artifacts/decisions/README.md` | — | **EXISTS** — written by `director-chief-of-staff` 2026-08-27 |
| Product scope brief (BRIEF 1839 + amendments A1–A21) | `decisions-locked` | `area-plugins-scope-brief` | `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-scope-brief.md` | — | **COMPLETED** (item v3) · **artifact owed** — durable record is `kai/coordination/threads/area-plugins-scope-brief.md`, now the largest record in the corpus |
| Optional-core architecture (dual-path contract, standalone floor, claim surface) | `decisions-locked` | `area-plugins-optional-core-architecture` | `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-optional-core-architecture.md` | — | **COMPLETED** (item v6, accepted 2026-08-27-1906) · **artifact owed** — durable record is `kai/coordination/threads/area-plugins-optional-core-architecture.md` |
| Round-1 area taxonomy | `decisions-locked` | `area-plugins-taxonomy-decision` | `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-decision.md` | — | **COMPLETED** (item v6) · **SUPERSEDED-FINAL** by round 2, and round 2 by round 3 · **artifact owed** · kept as history, never rewritten |
| Round-2 area taxonomy (seven plugins; both new plugins declined) | `decisions-locked` | `area-plugins-taxonomy-round-2` | `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-2.md` | — | **COMPLETED** (item v4, accepted 2026-08-27-2138) · **SUPERSEDED** by round 3 per the 2153 override · **artifact owed** · its `CATEGORIES`, weld and router-inheritance evidence is round 3's input |
| Round-3 area taxonomy (nine plugins; the two overrides) | `decisions-locked` | `area-plugins-taxonomy-round-3` | `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-taxonomy-round-3.md` | — | **COMPLETED** (item v4) · **ARTIFACT WRITTEN** — the first canonical decision artifact in this initiative to actually exist on disk, not `artifact owed`. Accepted by `principal-product-manager` `scope-acceptance` **2026-08-27-2240** (approved), bound to `DECISION 2026-08-27-2215` since a knowledge item has no `change_ref`. Supplies all four OWED north-star items: the nine-plugin skill map (56/51), the **six**-case fracture set (`kai-core-personal-agenda` shown **not** to be one), the one-sentence jobs, and the **`CLAIM_SKILLS`-unchanged-at-14** ruling. Steward amended `kai-project-management`'s job sentence; steward finding **F-1** attached to N7 |
| Host-tool conformance probe (measured allowlist vocabulary + runtime grants) | `allowlist-repair` | `area-plugins-host-tool-conformance` | `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md` | — | **ARTIFACT WRITTEN** this turn by `principal-swe-infra` — indexed here by the steward for completeness. **Item state is not this file's to assert** and was deliberately not read or edited during the round-3 acceptance (out of the steward's `touches` set); `director-chief-of-staff` reconciles it. **First implementation of the initiative.** |
| Migration architecture (marketplace rename, `kai-personal` fate, doctor recognition, `legacy-rollback` coverage) | `decisions-locked` | `area-plugins-migration-architecture` | `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-migration-architecture.md` | — | **IN-REVIEW** (item v17) — three `principal-sre` reliability passes returned `changes-requested` (0P0/4P1, 0P0/1P1, 0P0/1P1); a **fourth** is owed. Gates the entire milestone-2 code chain via the A8 typed edge |
| Tool-allowlist diagnosis (214 declaration sites; warned set vs broken set disjoint) | `allowlist-repair` | `area-plugins-tool-allowlist-fix` | *(none declared)* | — | **BLOCKED** (item v3, `resume_state: ready`) on `Q-area-plugins-tool-allowlist-fix-01` to `@operator`. Durable record is `kai/coordination/threads/area-plugins-tool-allowlist-fix.md` — the enumeration of all 56 root agents, 56 mirrors, 51 + 51 skill files, and the third `SUPPORTED_TOOLS` copy |
| Milestone-2 engineering decomposition (eight typed items, PR order, conditions C1–C3) | `optional-core-contract` | `area-plugins-m2-decomposition` | `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-m2-decomposition.md` | — | **COMPLETED** (item v4, PLAN 2026-08-27-1922, steward ruling 1944) · **artifact owed** |
| Standalone-mode copy (`standalone-block.txt` two honest paths + five pinned disclaimers) | `optional-core-contract` | `area-plugins-m2-standalone-copy` | *(none declared)* | — | **COMPLETED** (item v6) — product-owned copy deliverable per A4; durable record is `kai/coordination/threads/area-plugins-m2-standalone-copy.md`. Required input to milestone 2 PR-3 |
| Distributed multi-PC agents — security proposal | `decisions-locked` | `area-plugins-distributed-agents-proposal` | `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-distributed-agents-proposal.md` | **externalised** → GitHub issue #192 | **COMPLETED** (item v2) · `required_for_milestone: false` · **proposal-only** — `external_ref: https://github.com/RubenSaucedo/kai/issues/192`. **No implementation scope enters this initiative** and no milestone may depend on it |

## Not yet produced

Named so the gaps are visible rather than discovered at closure.

- **`director-summary.md`** — required at closure alongside a non-empty
  `deliverables.md`. The director owns it; it does not exist.
- **Milestone-3 (`surface-rename`) and milestone-4 (`area-taxonomy-split`)
  outputs** — no item records exist for either milestone, so no deliverable
  can. Both milestones carry `required_items: []`, which is a closure gate.
- **Milestone-5 README deliverable** — `area-plugins-readme-clarity` is
  `proposed`; it may be *drafted* once round 3 completes but must **not merge**
  before the new identities are published (A14).
- **Release records.** This initiative has shipped nothing. No entry under
  `kai/library/releases/**` belongs to `area-plugins`, and none may be created
  until an operator has deployed and verified a release. Every claim in this
  file is `reported`, never `observed` — no agent in this session has a shell.

## Sibling initiative

`workspace-corpus-contract` (four items, all `proposed`) is **not** indexed
here. It is a separate initiative awaiting operator go/no-go; its deliverables
belong to `kai/initiatives/workspace-corpus-contract/deliverables.md`, which
does not exist. The four items carry an `area-plugins-` ID prefix because the
operator assigned those IDs while the concerns were still inside this
initiative — **membership is the `initiative:` field, not the prefix.**
