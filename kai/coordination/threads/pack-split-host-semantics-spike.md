# Thread — pack-split-host-semantics-spike

Append-only communication log mirroring
`kai/coordination/items/pack-split-host-semantics-spike.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` **Spike** record. Front-loaded the load-bearing unknown — cross-plugin skill resolution / collision / fresh-session / hooks-firing on macOS + cloud, proven only on Windows CLI today. Gates `pack-split-generated-pack-trees`; runs in parallel with the dependency-guarantees work. Design `principal-swe-infra`; host runs **operator-executed**.
- state:     proposed
- needs:     Steward decision — keep as a separate gating spike (recommended) or fold into `pack-split-host-gates` as an early phased arm; then schedule the operator host session.
- artifacts: kai/coordination/items/pack-split-host-semantics-spike.md; kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md (WS#2, Scope negotiations)
- evidence:  docs/proposals/pack-architecture.md "Still not verified" (macOS/cloud/install-order/fresh-session) — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — decide spike-vs-fold; the manager cannot execute external host gates.

## HANDOFF 2026-08-25-1139 — principal-product-manager -> principal-swe-infra

- did:       Steward grooming pass. **Decision confirmed, not re-opened:** this stays a **separate
             gating spike** (the 2026-08-24 steward call), it is **not** folded into
             `pack-split-host-gates`, and host gates remain a **minimal smoke gate** rather than
             full macOS/cloud certification (which the northstar still `defers`). **Promoted
             `proposed -> ready`** at **priority 30** (version 1 -> 2,
             `next_role: principal-swe-infra`). Verified `pack-split-partition-lock` is
             `completed`. Made the acceptance command exact (`--all --out <dir>`) and added a
             provenance criterion — each answer marked **verified** or **unverified**, carried from
             this initiative's own ship-gate practice of labelling operator-attested checks as
             attested. Questions, time-box, and go/no-go gate untouched.
- state:     ready
- needs:     Two-part execution. (1) `principal-swe-infra` designs the probe + evidence template
             against a **throwaway** `node scripts/pack-preview.mjs --all --out <dir>` build —
             small, parallel-safe, no code change. (2) **`@operator` executes the macOS + one
             cloud host session**; no kai role can run an external host gate, so this item cannot
             reach `completed` without that session. That is a human scheduling dependency, named
             openly — not a `blocked` state and not a question parked on the record.
- artifacts: kai/coordination/items/pack-split-host-semantics-spike.md (v2);
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md
             (WS#2 + *Scope negotiations*); artifact target
             kai/initiatives/pack-split/artifacts/reliability/pack-split-host-semantics-spike.md
- evidence:  `COMMITTED_PACKS = []` in `scripts/lib/pack-plan.mjs` on `main`, and
             `pack-preview.mjs` refuses `--write` while it is empty — so this spike provably
             cannot commit a `packs/` tree, and the committed-unpublished non-negotiable is not at
             risk from it. `docs/proposals/pack-architecture.md` "Still not verified"
             (macOS / cloud / install-order / fresh-session) remains the open question set.
             Read 2026-08-25 from C:\src\kai.
- questions: none blocking. Scope boundary the steward is holding: promoting this does **not**
             move `first-pack-extracted` into `scope.current` (which stays
             `[dependency-guarantees]`), does **not** change its milestone, and does **not** make
             it a closure gate — `required_for_milestone` stays **false** and
             `pack-split-host-gates` remains the formal certification. Priority 30 keeps it behind
             both guarantee items on the shared `principal-swe-infra` owner.
- next:      principal-swe-infra — design the probe + evidence template; then `@operator` for the
             host session. A **bad answer stops the extraction**: re-open directors-in-core vs
             `kai-orchestrator` and the hooks-ownership mechanism with the steward + architect
             before any tree is committed.
