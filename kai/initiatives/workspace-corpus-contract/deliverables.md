# workspace-corpus-contract — deliverables

Index of promoted, durable outputs for this initiative. Required to be
non-empty at closure, with every milestone's `required_items` satisfied.
Under the current schema-2 implementation, promotion is one-way and
steward-approved:
`.kai/runs/ -> kai/initiatives/workspace-corpus-contract/artifacts/ ->
kai/library/<type>/`. The ratified target replaces the final generic library
lane with the core-owned
`<publication-root>/{reports,specs,decisions}/` set plus registered domain
extensions such as `learning/` and `content/`; implementation and
link-preserving migration remain future work.

| deliverable | milestone | source item | artifact path | promoted to library | status |
|-------------|-----------|-------------|----------------|----------------------|--------|
| Initiative log (chronological, append-only) | — | — | `kai/initiatives/workspace-corpus-contract/log.md` | — | **EXISTS** — written 2026-08-28 on operator approval |
| North star (this initiative's thin core) | — | operator approval (steward split, `area-plugins` A10) | `kai/initiatives/workspace-corpus-contract/northstar.md` | — | **EXISTS** — written 2026-08-28; `status: active`, one milestone (`corpus-honesty`), four typed `required_items` |
| Backlog / proposal channel | — | — | `kai/initiatives/workspace-corpus-contract/backlog.md` | — | **EXISTS** — written 2026-08-28; nothing parked |
| Ratified audience-based workspace-corpus architecture (reconciles all four contracts) | `corpus-honesty` | operator approval, this materialization pass | `kai/initiatives/workspace-corpus-contract/artifacts/decisions/workspace-corpus-contract-architecture.md` | — | **ACCEPTED 2026-08-28** — target architecture only; no implementation |
| Workspace storage-modes product requirement (R1–R5, honesty constraint) | `corpus-honesty` | `area-plugins-workspace-storage-modes` | `kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-workspace-storage-modes.md` *(declared, owed)* | — | **proposed** (item state unchanged this pass) · durable record is `kai/coordination/threads/area-plugins-workspace-storage-modes.md`, `DECISION 2026-08-27-2113` |
| Initiative archive contract (13 sections) | `corpus-honesty` | `area-plugins-initiative-archive` | `kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-initiative-archive.md` *(declared, owed)* | — | **proposed** (item state unchanged this pass) · durable record is `kai/coordination/threads/area-plugins-initiative-archive.md`, `DECISION 2026-08-27-2113` |
| Backlog contract (10 sections) | `corpus-honesty` | `area-plugins-backlog-contract` | `kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-backlog-contract.md` *(declared, owed)* | — | **proposed** (item state unchanged this pass) · durable record is `kai/coordination/threads/area-plugins-backlog-contract.md`, `DECISION 2026-08-27-2113` |
| Design-output contract (9 sections) | `corpus-honesty` | `area-plugins-design-output-contract` | `kai/initiatives/workspace-corpus-contract/artifacts/decisions/area-plugins-design-output-contract.md` *(declared, owed)* | — | **proposed** (item state unchanged this pass) · durable record is `kai/coordination/threads/area-plugins-design-output-contract.md`, `DECISION 2026-08-27-2113` |

**Provenance note.** Every row above except the architecture decision is
"artifact owed" in the same sense `area-plugins` uses that phrase: the
decision is real and accepted into this initiative's scope, but its promoted
canonical copy under `artifacts/decisions/<item-id>.md` has not yet been
written. Transcribing each is a separate steward/owner pass — not a license
for anyone to re-open a decision — and is explicitly **not** part of this
materialization pass, which only creates the initiative workspace and the one
new reconciling architecture decision.

## Not yet produced

Named so the gaps are visible rather than discovered at closure.

- **`director-summary.md`** — required at closure alongside a non-empty
  `deliverables.md`. Not owed yet: this initiative just went `active`.
- Four per-item canonical decision artifacts (see provenance note above).
- Every implementation item each contract names as its own follow-on — none
  is created by this pass; each is the steward's call once a contract is
  promoted to `ready`.
