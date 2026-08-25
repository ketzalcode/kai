# Thread — pack-split-degraded-refusal

Append-only communication log mirroring
`kai/coordination/items/pack-split-degraded-refusal.md`. See `kai-core-work-coordination`.

## HANDOFF 2026-08-24-2011 — principal-swe-manager -> principal-product-manager

- did:       Created this `proposed` record. One canonical drift-proof refusal block (restates no rules) copied per pack, CI-pinned like `inherits-block.txt`. Size M. Owner `principal-swe-infra`; reviews `principal-swe-architect`/independent-architecture + `principal-security`/independent-security. Depends on `pack-split-preflight-compat` (shipped) — shared agent-body injection surface, sequenced not raced.
- state:     proposed
- needs:     Steward grooming + promotion when the milestone is groomed.
- artifacts: kai/coordination/items/pack-split-degraded-refusal.md; decomposition WS#5
- evidence:  scripts/lib/inherits-block.txt (the canonical-file + CI-pin precedent) — captured 2026-08-24 from C:\src\kai
- questions: none
- next:      principal-product-manager — groom milestone-by-milestone.

## HANDOFF 2026-08-25-1148 — principal-product-manager -> principal-swe-infra

- did:       Steward grooming pass (continuation of 2026-08-25-1139). **Promoted `proposed -> ready`**
             at **priority 20 -> 40** (v1 -> v2, `next_role: principal-swe-infra`, `owner` still null).
             Promoted **with its dependency unmet, deliberately**: `ready` is a steward commitment that
             requires `depends_on` to be *declared*, not resolved. Tightened acceptance on two
             finding-driven points only — named the authoritative copy path (`materializePacks` in
             `scripts/lib/pack-plan.mjs`, whose header defers **degraded-mode** guarantee-block
             injection to a downstream item, per the steward's 2026-08-24-2240 generator-gates
             correction), and **split** the bundled "local commands + CI green" criterion, because
             that exact bundling bounced `generator-gates` at the 2026-08-24-2244 DoD gate. Added
             `scripts/lib/pack-plan.mjs` to `touches`. No new requirement, no scope added, no
             architecture decision made or re-opened.
- state:     ready
- needs:     **Nothing yet — this item is NOT dispatchable.** Its sole dependency
             `pack-split-preflight-compat` (`requires: shipped`) is `ready` at priority 10 and has not
             been dispatched, so the director's dependency check must continue to fail here. Do not
             grant a lease against this record until `preflight-compat` is `shipped`. The dependency
             type was **not** weakened to `in-review`/`release-ready` to make it move sooner: the two
             share the same generated-agent-body injection surface and both byte-pin from
             `scripts/validate-plugin.mjs` (WS#5 — sequenced, not raced).
- artifacts: kai/coordination/items/pack-split-degraded-refusal.md (v2);
             kai/initiatives/pack-split/artifacts/decisions/pack-split-engineering-decomposition.md (WS#5);
             kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md
- evidence:  `scripts/lib/pack-plan.mjs` on `main` — the `materializePacks` header reads "Guarantee-block
             injection (preflight, degraded-mode) and non-markdown asset routing are added by downstream
             items, not here", which is the recorded authority for naming that path here;
             `scripts/lib/inherits-block.txt` is the working canonical-file + CI byte-pin precedent.
             Read 2026-08-25 from C:\src\kai.
- questions: none blocking. One boundary to hold: this item ships the **fuller degraded-mode block**,
             not `preflight-compat`'s one-line refusal *token* — and the block must restate **no** core
             rules (northstar non-negotiable: refusal, not a fallback contract). Anything that grows
             past that routes to the steward as a scope question, not into the diff.
- next:      principal-swe-infra — build **after** `pack-split-preflight-compat` ships and the director
             dispatches; both `independent-architecture` and `independent-security` reviews must ratify
             the **same** `change_ref` before the ship gate.

## HANDOFF 2026-08-25-1518 — principal-swe-infra -> principal-swe-architect

- did:       Built the canonical degraded-mode refusal end-to-end. Self-granted the item at
             **2026-08-25-1452** (`ready -> in-progress`, v2 -> v3, token `7c41-2026-08-25-1452`,
             `version_at_grant: 2`) as the sole acting worker on it, dependency verified met —
             `pack-split-preflight-compat` is `shipped` (v17, `change_ref
             3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`, both reviews ratified). Now
             `in-progress -> in-review`, v3 -> v4, lease cleared.
             **(1)** New `scripts/lib/degraded-block.txt` (840 bytes): one heading, one paragraph
             of fact, five bullets — one `Refuse …` single-shot, three `Do not …`, one `Tell the
             operator to install \`kai-core\``. Names no skill, no agent, no contract version, and
             does not carry `KAI-CORE-MISSING`.
             **(2)** `scripts/lib/pack-plan.mjs`: `guaranteeBlocks()` defines the order once,
             `injectBlocks()` splices the ordered blocks in a **single** pass (a second injection
             would re-anchor and push the newer block above the preflight — the inversion the
             2026-08-25-1231 A2 finding named), `injectPreflight()` kept as the single-block form,
             and the **authoritative** `materializePacks` injects `[preflight, degraded]` into
             every non-core agent and neither into a core agent.
             **(3)** `scripts/validate-plugin.mjs`: byte-pin over real generator output — exact
             copy, exactly one per department agent, **zero** in every core agent, after the
             preflight with only whitespace between the two, preflight still first after the
             inherits directive; plus the no-coordination-rule rules on the canonical file, via
             the pure `degradedBlockErrors()`.
             **(4)** `scripts/pack-preview.mjs`: preview + self-test moved onto the shared
             helpers; new arms for injection order, on-disk presence across a **full `--all`
             build** (every department agent, every core agent), generator injection, 8 refusal-rule
             mutation arms, and a drift arm that softens the refusal inside a generated tree and
             catches it on that exact file, then restores it.
             **(5)** `0.60.0 -> 0.61.0` across all six version locations + CHANGELOG section and
             compare link + README stamp; inventory unchanged at **56 agents / 51 skills**.
- state:     in-review
- needs:     **Blocking, and the reason neither review can bind yet: this run had no shell, so
             ZERO commands were executed and no `change_ref` could be minted.** Owed:
             `node scripts/validate-plugin.mjs`, `node scripts/pack-preview.mjs --self-test`,
             `node scripts/pack-preview.mjs --check`, `node scripts/pack-preview.mjs --all --out
             <dir>`, and full `npm test`. Then a non-destructive ref —
             `git stash create` over the working tree (the ref this initiative used at
             `a15bd823…`/`96b693a1…`/`3383d7f2…`) or a commit on `kai/feat/29-degraded-refusal`,
             which **was not created**: no branch, commit, push, PR, merge, tag or release exists
             from this run. `change_ref` stays `null` until then, and only reviews matching the
             eventual ref count.
- artifacts: scripts/lib/degraded-block.txt (new); scripts/lib/pack-plan.mjs;
             scripts/validate-plugin.mjs; scripts/pack-preview.mjs; CHANGELOG.md; README.md;
             plugin.json; package.json; package-lock.json; .github/plugin/marketplace.json;
             kai/coordination/items/pack-split-degraded-refusal.md (v4)
- evidence:  Read 2026-08-25 from C:\src\kai before editing: `scripts/lib/preflight-block.txt` and
             the shipped pin at `scripts/validate-plugin.mjs` (the version set-equality and the
             directive-to-preflight adjacency bound), `scripts/lib/pack-plan.mjs`
             (`materializePacks`, `injectPreflight`, `afterInheritsDirective`),
             `scripts/pack-preview.mjs` (crosspack-validator arms as the pure-`*Errors` precedent),
             `docs/proposals/pack-architecture.md:147-168`, northstar non-negotiable "the
             degraded-mode block is a refusal, not a fallback contract". All file-state claims here
             are readable; **no claim in this packet rests on an executed check, because none ran.**
- questions: none blocking. Three things the architecture review should rule on, all recorded rather
             than absorbed: **(a)** the trigger boundary — preflight owns missing/skewed core with
             the exact token; this block owns "core answered, contract still absent", stated in its
             first sentence so the two never claim the same condition; **(b)** the one divergence
             from the ratified proposal text — `docs/proposals/pack-architecture.md:147` says the
             block ships "for when the preflight **fails**" and sketches "You are running without
             `kai-core`", wording that predates the shipped preflight now answering that exact case
             itself; either §147 is superseded or this block's trigger sentence changes, and that is
             architecture's call, not infra's (everything else in that section — refusal not
             fallback, restates no rules, canonical file + CI pin, trivial migration — is
             implemented as written); **(c)** one known residual —
             the bullet-shape rule reads each bullet's first line, so an affirmative sentence on a
             *wrapped continuation* line would pass that rule (it would still have to clear the
             citation, verbatim-quote and 1200-character budget rules). Closing it means forbidding
             wrapped bullets or sentence-splitting the block; both judged worse than the residual.
- next:      principal-swe-architect — `independent-architecture` (refusal-not-fallback, core
             exclusion, and the ordering against the shipped preflight). It **cannot bind until a
             `change_ref` exists**; `principal-security` reviews the same ref after it. Neither is
             waivable, and this item stays a blocker on milestone `dependency-guarantees`.

## HANDOFF 2026-08-25-1525 — @operator -> principal-swe-architect

- did:       Operator created `kai/feat/29-degraded-refusal`; full `npm test` passed at exit 0,
             `pack-preview --check` passed, and all five preview trees generated successfully.
             Temporary output was removed. Minted exact review binding
             `8d3ef4844988f4974e6bec8f406a7723dee4e942`.
- state:     in-review
- change_ref: `8d3ef4844988f4974e6bec8f406a7723dee4e942`
- needs:     Independent architecture review, followed by security at the same unchanged ref.
- next:      principal-swe-architect

## HANDOFF 2026-08-25-1516 — principal-swe-architect -> principal-security

- did:       `independent-architecture` review at `change_ref 8d3ef4844988f4974e6bec8f406a7723dee4e942`:
             **RATIFIED**. Item **v5 -> v6, still `in-review`**, lease `psa-2026-08-25-1525-dgr`
             **cleared**, `next_role: principal-swe-architect -> principal-security`, and
             `completed_reviews` now carries `principal-swe-architect` / `independent-architecture` /
             `ratified` at this exact ref — good **for this ref only**; if the ref moves the entry
             stops counting and both required reviews re-bind together. No acceptance criterion was
             ticked (owner's and DoD gate's job, not the reviewer's), no implementation or release
             file was edited, nothing was committed, pushed, merged, tagged or released.
             **The routed question (b) is DECIDED: `docs/proposals/pack-architecture.md:147` is
             SUPERSEDED by the shipped preflight contract; the block stands unchanged.** The force is
             reachability, not taste — the preflight's failure path is terminal and byte-pinned
             ("reply with exactly `KAI-CORE-MISSING` and nothing else"), so a block that fires "when
             the preflight fails" has no reachable place to run, would need the agent to emit prose
             the preflight forbids, would assert a falsehood after a passing preflight, and would
             leave the one state neither block covered — installed and compatible, contract not in
             session — uncovered. §147's clause described **install-level** absence, which the
             shipped preflight now answers itself; this block owns the **session-level** absence that
             survives it. Superseded: §147's trigger clause and §157's sketch opening (prefaced
             "roughly:"). Untouched and implemented as written: refusal-not-fallback,
             restates-no-rules, canonical file + CI pin, trivial migration — every claim the
             northstar lifted into a `non_negotiable`. A one-line §147 errata should ride whatever
             item next legitimately edits that proposal; it was deliberately **not** put into this
             ref's diff and **no item was created for it**.
             **(a) ENDORSED** — the boundary, the single ordered splice, the authoritative-path
             injection, the core exclusion in both directions, and the byte-pin over real generator
             output, all re-derived in code rather than taken from the handoff.
             **(c) residual ACCEPTED, and it is wider than stated** — the opener test is a *prefix*
             test, so a clause after the first escapes on the **same** line, not only on a wrapped
             continuation; the opening paragraph is not opener-checked at all. Accepted with the
             guarantee stated honestly: drift-prone failures (appended bullet, quoted core, grown
             block, missing/duplicated/misplaced copy) are mechanically impossible; a deliberately
             smuggled paraphrase is caught by review, not by machine. No code change asked for.
- state:     in-review
- change_ref: `8d3ef4844988f4974e6bec8f406a7723dee4e942`
- needs:     `principal-security` / `independent-security` on **this same unchanged ref**. Both
             required reviews must bind one `change_ref`. Two things travel to you undecided by
             architecture: **N1** — `P2-S1` (the `/^kai-[a-z]+\/agents\/.+\.agent\.md$/` gate at
             `validate-plugin.mjs:443`) now gates **two** guarantees, so a future pack key outside
             `[a-z]+` would escape the preflight pin *and* the refusal pin together (no such key
             exists today); and **the trust boundary itself** — this refusal's trigger is
             *model-evaluated* where the preflight's is *probe-evaluated*, so the mechanical pin is
             on presence, position, count and text, never on **firing**. Control acceptance is
             yours. Architecture's input, not a verdict: a misfire is directionally safe — a false
             refusal costs availability, not integrity.
- artifacts: kai/initiatives/pack-split/artifacts/decisions/pack-split-degraded-refusal.md (new —
             full decision record, boundary + condition-domain diagrams, options table);
             kai/coordination/items/pack-split-degraded-refusal.md (v6, `## Review — independent
             architecture (ratification), 2026-08-25-1516`); kai/coordination/BOARD.md;
             kai/coordination/ACTIVE.md; kai/initiatives/pack-split/log.md
- evidence:  Read through the worktree at `C:\src\kai` on the operator's attested byte-identity for
             all implementation and release files; this run had **no shell** and re-executed
             nothing, so the green `npm test` (exit 0), `--check`, and the five preview trees are
             **input, not verdict**. Re-derived in code: `pack-plan.mjs:244-258` (authoritative
             injection, core excluded), `:280-296` (order stated once, one splice — the A2 inversion
             is unconstructible), `:325-408` (`degradedBlockErrors`, budget, live-contract quote
             derivation); `validate-plugin.mjs:428-482` (byte-pin, counts, core zero, both adjacency
             bounds); `pack-preview.mjs:354-364, 396-416, 444-481, 540-553` (order, on-disk `--all`
             both directions, 8 mutation arms named, drift-on-that-exact-file). Also confirmed:
             `0.61.0` coherent across all six version locations + README `## Status` + dated
             CHANGELOG section and compare link; marketplace still **N=1** at `source: "."`; **no
             `packs/` tree**; `COMMITTED_PACKS` still `[]`; `validate.yml` unchanged and already
             running the three checks, so "no new CI step" is true.
- questions: none blocking. **A1 (new, non-blocking, DEFERRED with a named trigger):** core agents
             are excluded on an argument the re-scoped trigger no longer fully carries — "ships
             inside `kai-core`" is airtight for *install-level* absence (the §147 condition) but not
             for the *context-loading* absence this block now owns, to which a core agent is exposed
             exactly as a department agent is. Not fixed here: no core-only install exists yet, and
             covering core needs a **second** canonical block with its own pin (this block's first
             sentence would be false in an agent carrying no preflight) — a new file and a scope
             decision that belongs to the steward at triage, not to a reviewer's diff. **Reopen at
             `pack-split-generated-pack-trees`, or at the latest `pack-split-first-department`.**
             Routed to `principal-product-manager` as a proposal. **E1 (escalation, steward's
             call):** `northstar.md` says the block is "shipped in **every pack**"; it ships in every
             **department** pack (4 of 5) by the deliberate exclusion above, while this item's own
             acceptance ("every generated **pack agent**") is met exactly — whether the milestone
             line reads as satisfied or should be amended is milestone-acceptance interpretation, not
             architecture's to self-clear, and it does not block this ratification. **N2 (ship
             gate):** `pack-preview --check` returns early while `COMMITTED_PACKS` is empty
             (`pack-preview.mjs:281-283`) — it is **vacuous** for this item; the CI enforcement rides
             on `validate-plugin` and `--self-test`, so "`--check` passed" must not be read as
             proving injection. **N3 (recorded, not routed):** `injectPreflight` survives as an
             exported single-block helper with one self-test caller — inert, but an affordance for
             producing an agent with the preflight and not the refusal; a note for whoever next edits
             `pack-plan.mjs`, no work created.
- next:      principal-security — `independent-security` at
             `8d3ef4844988f4974e6bec8f406a7723dee4e942`. Milestone `dependency-guarantees` stays at
             **3 of 5** required items `shipped`; `pack-split-ci-partition-checks` still overlaps
             this item on `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and
             `scripts/pack-preview.mjs`, so its touch-conflict check at dispatch still applies.

## HANDOFF 2026-08-25-1540 — principal-security -> workflow-ship

- did:       `independent-security` review at `change_ref 8d3ef4844988f4974e6bec8f406a7723dee4e942`
             — the same unchanged ref architecture ratified: **CLEAR**. Self-granted the item at
             **2026-08-25-1540** as the sole acting worker (v6 -> v7, token
             `psec-2026-08-25-1540-dgr`, `version_at_grant: 6`, state left `in-review`), then
             **v7 -> v8, lease cleared**, `next_role: principal-security -> workflow-ship`, and
             `completed_reviews` now carries `principal-security` / `independent-security` /
             `clear` at this exact ref — so **both** required reviews are satisfied, **for this ref
             only**; if the ref moves both entries stop counting and both re-bind together.
             **P0: 0 — P1: 0 — P2: 4**, none blocking, none requiring a change at this ref, **no
             item created**, and **no residual risk accepted** (no control is waived, and nothing
             at this ref reaches an installed agent).
             **The boundary held, re-derived in code rather than taken from the handoff:** the
             refusal **cannot fail unsafe** — it orders after the preflight with both adjacency
             bounds pinned over real generator output (`validate-plugin.mjs:455-482`); it may carry
             neither `KAI-CORE-MISSING` nor a `` `contract:` `` literal (`pack-plan.mjs:360-371`),
             so it cannot emit a false compatibility verdict; every instruction is a refusal or a
             prohibition except the one install remedy, so a misfire **narrows** the agent; it
             grants no capability and touches no credential, endpoint or data path. Order stated
             once and spliced once (`:280-296`); injection and expectation use **independent keys**
             (`p.kind` vs the `kai-core/` prefix); the preflight copy-count is checked **first**, so
             a refusal-only agent fails by name; a softened refusal in a generated tree is caught on
             that exact file.
             **The routed trust-boundary question, answered honestly:** the preflight's trigger is
             an **observable artifact**, this one is **self-report**, and no "contracts are loaded"
             marker can exist at this layer — so effectiveness is **unknown and unmeasured, not
             high**. The dominant miss is a false negative (the body still *names* the contracts on
             its `**Inherits:**` line, so a model may believe it holds them), and that miss lands
             exactly where the operator stands today with no block at all: **the change cannot make
             that state worse.** False positives cost availability *and audit trail*, so
             "directionally safe" is right but not free; injection-triggered degradation is an
             availability vector, not an escalation, because the block only subtracts.
- state:     in-review
- change_ref: `8d3ef4844988f4974e6bec8f406a7723dee4e942`
- needs:     Ship gate. **Two truth constraints ride with it: (1)** `pack-preview --check` is
             **vacuous** for this item (`pack-preview.mjs:281-283`) — architecture's N2, confirmed
             independently, and no part of this verdict rests on it; **(2)** extending `P2-S2`, no
             ship record, changelog entry or release note may claim pack agents *refuse*, *degrade
             gracefully* or *detect* contract loss — the evidenced claim is that every generated
             department agent **carries a pinned, correctly ordered refusal instruction** that
             cannot drift from core. Expect a DoD bounce on the unticked local-command and
             CI-green-on-the-pushed-PR criteria: that is the correct mechanical outcome, not a
             security objection.
- artifacts: kai/initiatives/pack-split/artifacts/security/pack-split-degraded-refusal.md (new —
             full assessment: threat table T10-T18, controls D1-D13, residuals R4-R6, evidence
             register G1-G16); kai/coordination/items/pack-split-degraded-refusal.md (v8, `## Review
             — independent security, 2026-08-25-1540`); kai/coordination/BOARD.md;
             kai/coordination/ACTIVE.md; kai/initiatives/pack-split/log.md
- evidence:  Read-only through the worktree at `C:\src\kai`; **no shell** — nothing executed, no
             active check, no network call, no web search. Read directly:
             `scripts/lib/degraded-block.txt` (whole file), `pack-plan.mjs:244-268, 280-296,
             325-408`, `validate-plugin.mjs:376-484, 1191`, `pack-preview.mjs:331-560`,
             `.github/workflows/validate.yml`, `marketplace.json`, `package.json`, `CHANGELOG.md`.
             Confirmed **no shipped exposure**: `COMMITTED_PACKS` `[]`, no `packs/` tree,
             marketplace exactly one entry at `source: "."`. Ref object `8d3ef484…` present in
             `.git/objects/8d/` (**existence only**, not decoded — no shell to inflate it); `HEAD`
             on `kai/feat/29-degraded-refusal` at `e679de9d…` with **no commit on the branch**
             (reflog-verified), so the ref is unreachable — consistent with the `git stash create`
             object used three times before on this initiative. The operator's green `npm test`
             (exit 0), `--check` and five preview trees are **operator attestation — input, never
             verdict**; **if the worktree is not byte-identical to that object, this review does not
             bind**.
- questions: none blocking. Four P2s, all recorded and routed, **none creating work**: **P2-D1** —
             the exactness of the `KAI-CORE-MISSING` reply is now a **two-block** model judgement
             (the second block ends "Tell the operator to install `kai-core`", prose the agent must
             decide *not* to emit where only the token is allowed); it cannot emit a *false* token
             and is conditioned on a passing preflight, so the shape is noisy-but-correct, not
             fail-open — **concrete evidence owed downstream:** `pack-split-host-gates` should
             assert that an agent carrying **both** blocks replies with exactly the token and
             nothing else in **both** the `--no-core` and `--contract 2` builds. **P2-D2** — the
             refusal's prohibitions are narrower than the preflight's (no explicit bar on
             product-code edits, command execution or tool calls); a **coverage gap, not a
             regression**, since the counterfactual is no block at all — smallest fix is one extra
             `Do not …` bullet (~90 chars against ~360 of remaining budget), **not requested**
             because it moves a byte-pinned ratified file and re-binds both reviews. **P2-D3** — the
             only permitted remedy is install-shaped for a condition that is often a context-loading
             failure; the install/restart distinction survives in the **token** but not in the
             **remedy** — recovery guidance, not exploitability. **P2-D4 (= your A1)** — confirmed
             **no current exploitable integrity path**, correctly deferred; one input for the
             steward that architecture did not have to weigh: core is not a low-value remainder — it
             holds `director-chief-of-staff` (the lease grantor) and `workflow-workspace-init`, so
             when a core-only install becomes real the uncovered blast radius is **larger per agent**
             than in a department pack. Reopen trigger unchanged. **Carried, not re-filed:** `P2-S1`
             (your N1) confirmed — `validate-plugin.mjs:443` gates both guarantees on
             `/^kai-[a-z]+\/agents\/.+\.agent\.md$/`, all five keys match today. **Not a security
             finding, routed for accuracy:** the CHANGELOG headline says "every generated **pack**
             agent" while the body correctly scopes it to department agents — the same wording
             question as your **E1**, `principal-product-manager`'s call.
- next:      workflow-ship — prepare mode at `8d3ef4844988f4974e6bec8f406a7723dee4e942`. Milestone
             `dependency-guarantees` stays at **3 of 5** required items `shipped`; a CLEAR review is
             not a ship. `pack-split-ci-partition-checks` still overlaps this item on
             `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and
             `scripts/pack-preview.mjs`, so its touch-conflict check at dispatch still applies.

## HANDOFF 2026-08-25-1554 — workflow-ship -> @operator

- did:       **DoD gate run, all six dimensions — verdict RELEASE-READY.** Item **v8 -> v9**,
             `in-review -> release-ready`, `resume_state: null`, lease `null`,
             `next_role: workflow-ship -> "@operator"`; acceptance criteria **1–6 all ticked**,
             each against its own evidence source. **Nothing was merged, tagged, released,
             published or deployed, and no implementation or release file was edited.**
             **The one thing that closed since the security review is the one thing only CI
             could close.** `principal-security` correctly predicted a bounce on the unticked
             local-command and CI-green criteria — true when written, because no commit and no
             PR existed. The operator has since committed
             **`75053e08551e6865df501e85d25888b19693af72`**, pushed the branch and opened
             **PR #158** (open, `draft: false`, `mergeable: true`, `mergeable_state: clean`,
             1 commit, +2152/-100 across **17** files, base `e679de9d…` = current local `main`,
             so exactly one commit ahead with no divergence), and check run `contract`
             **`97997128517`** (run **`32908330221`**) completed **`conclusion: success`** in
             **12s** on that exact head, `total_count: 1` — the only check on the head, so no
             second red check hides behind it. Read here from `api.github.com`, not accepted on
             report. Its single annotation is a **warning** (Node-20 runner deprecation on
             `actions/checkout@v4` / `setup-node@v4`) — pre-existing, not a failure.
             **`change_ref` deliberately unchanged** at `8d3ef484…`: both reviews bind that
             object and `change_ref` moves only when the implementation changes. Head-vs-ref
             byte-identity is **operator-attested and not fully re-derivable here** (no shell —
             the stash object cannot be decoded), so it is converted into **deploy step 1**, a
             `git diff --exit-code` that fails closed; partial corroboration obtained by reading
             `scripts/lib/degraded-block.txt` at the PR head and matching it to the worktree copy
             both reviews were read from.
             **Truth constraints honoured, verbatim.** The record and the release note claim
             **carriage, order, count and text** — every generated department agent **carries a
             pinned, correctly ordered refusal instruction that cannot drift from core** — and
             never that an agent *refuses*, *detects* contract loss or *degrades gracefully*.
             `--check` is recorded as passing and **explicitly not counted** as evidence of
             injection or pinning (vacuous at `pack-preview.mjs:281-283`).
             **Nothing dropped:** six PROPOSALs parked in the initiative backlog (A1, E1,
             §147 errata, P2-D1, P2-D2, P2-D3), each with a named owner and reopen trigger,
             plus P2-S1/N1 + N3 recorded as a blast-radius update on the pin-pattern proposal
             already parked there rather than duplicated. **No item was created** — filing is
             the steward's.
- state:     release-ready
- change_ref: `8d3ef4844988f4974e6bec8f406a7723dee4e942`
- needs:     **Deployment, which is yours to run — kai does not deploy.** Exact steps, abort
             criteria, rollback and the 8-check production verification are in the ship record.
             In order: **(1)** `git diff --exit-code 8d3ef484… origin/kai/feat/29-degraded-refusal`
             over the ten implementation/release paths (must exit 0 — that is the whole review
             binding) and `git diff --name-only e679de9d… origin/kai/feat/29-degraded-refusal`
             (must be exactly 17 paths, none under `agents/`, `skills/`, `packs/`, `docs/`,
             `test/`, and no change to `.github/workflows/validate.yml`); **(2)** `mkdir -p` +
             `git mv` the ship record into
             `kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal/ship-record.md`,
             then commit the records — doing it in this commit avoids a post-ship reconciliation;
             **(3)** push and confirm `contract` green on the **final** head (run `32908330221`
             only proves `75053e08…`); **(4)** squash-merge PR #158 — **do not rebase**, it would
             void both bindings and the CI evidence; **(5)** watch `validate` on `main`;
             **(6)** tag `v0.61.0` and cut the release, with the release note constrained to
             carriage-not-firing and to "every generated **department** agent"; **(7)** return the
             deployment evidence here. Do not mark this item `shipped` by hand.
- artifacts: kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal.md (new — the
             ship record, pending its one-command move to
             `…/03-ship-pack-split-degraded-refusal/ship-record.md` in deploy step 2, because this
             environment cannot create directories);
             kai/coordination/items/pack-split-degraded-refusal.md (v9, `## Ship gate —
             2026-08-25-1554`); kai/initiatives/pack-split/backlog.md (seven parked PROPOSALs);
             kai/initiatives/pack-split/deliverables.md; kai/initiatives/pack-split/log.md;
             kai/coordination/BOARD.md; kai/coordination/ACTIVE.md
- evidence:  **No shell** — read / search / fetch / edit only. Re-derived read-only: PR #158
             metadata and the `contract` check run, conclusion, timing and annotation
             (`api.github.com`); the changed-file count with its first four and its last filename;
             `scripts/lib/degraded-block.txt` at the PR head (`raw.githubusercontent.com`); local
             refs and reflogs (`.git/HEAD`, `.git/refs/heads/**`, `.git/logs/refs/heads/**`,
             `.git/packed-refs` — `v0.60.0` present, so the `[0.61.0]` compare link is not
             dangling); and on disk `COMMITTED_PACKS = []` (`pack-plan.mjs:117`),
             `guaranteeBlocks` (`:280`) / `injectBlocks` (`:286`) / `materializePacks` (`:248`),
             the refusal pins (`validate-plugin.mjs:428-482`), all six version locations at
             `0.61.0`, and the absence of `packs/`. **Not fully re-derived:** 11 of 17 filenames
             rest on the count identity plus alphabetical boundaries — deploy step 1 converts that
             into a mechanical check. **Operator-attested:** head-vs-ref byte-identity and the
             local suite (`npm test` exit 0, `--check`, five preview trees) — re-checked at deploy
             steps 1 and 3, both fail-closed.
- questions: none blocking. Two open interpretations belong to `principal-product-manager` and are
             parked, not resolved here: **E1** — the northstar's `dependency-guarantees` line reads
             "shipped in **every pack**" while this ships in every **department** pack (4 of 5),
             the same wording question the CHANGELOG headline raises; and **A1** — whether core
             agents need their own second block once a core-only install becomes real. Neither
             blocks this release: the item's own acceptance is met exactly, and the milestone is
             not being declared met here.
- next:      @operator — deploy, then return the evidence for `workflow-ship` CONFIRM-START and
             CONFIRM-COMPLETE. Milestone `dependency-guarantees` stays at **3 of 5** required
             items `shipped`; `release-ready` is not `shipped`, so
             `pack-split-generated-pack-trees` is **not** cleared and
             `pack-split-ci-partition-checks` still overlaps this item on
             `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and
             `scripts/pack-preview.mjs`.

## NOTE 2026-08-25-1612 — workflow-ship claimed (self-grant)

- Lease **self-granted** at `version: 9` — token `wsh-2026-08-25-1612-dgr-confirm`,
  `holder: workflow-ship`, `version_at_grant: 9` — to run CONFIRM-START and CONFIRM-COMPLETE on
  the operator's deployment evidence. Sole acting worker: the item sat at `release-ready` with
  `next_role: "@operator"` and no competing lease, and the item version was unchanged since the
  `1554` PREPARE entry, so nothing was overwritten.
- Lease **cleared** at handoff below with the item at `version: 12`, `state: shipped`,
  `next_role: null`.

## HANDOFF 2026-08-25-1612 — workflow-ship -> (none: item closed)

- did:       **CONFIRM-START + CONFIRM-COMPLETE run on operator-supplied deployment evidence —
             verdict `SHIPPED`.** Walked **`release-ready` -> `deploying` (v10) ->
             `production-verification` (v11) -> `shipped` (v12)**; no state skipped, `shipped`
             **not** reached directly from `release-ready`, `resume_state` stayed `null`,
             `next_role: "@operator" -> null`, lease cleared. **kai merged, tagged, released and
             published nothing** — the operator executed every one of those actions; this run
             recorded them and re-derived the production facts read-only. **No rollback was
             invoked**, so the recorded abort/rollback path was never entered.
             **CONFIRM-START:** PR #158 squash-merged **2026-08-25T23:12:06Z** into merge commit
             **`680ca445a2616bc9bc1b972db6b40042c06abf6c`**, single parent
             `e679de9d41187614e9765e00ec3e20dafff9ec0c` — the exact PREPARE base, so **no rebase
             happened** and both review bindings survive the merge — signature
             `verified: true`; `main` `validate` run **`32909692506`** started 23:12:10Z.
             **CONFIRM-COMPLETE:** that run is `status: completed`, **`conclusion: success`**,
             `event: push`, `run_attempt: 1`, `head_sha` exactly the merge commit, 23:12:10Z ->
             23:12:29Z; job `contract` **`98001208870`** `success`, 23:12:12Z -> 23:12:28Z
             (**16s**), **10 substantive steps all green** including step 4 `Validate plugin
             contract` and step 8 `Pack generator self-test` — the two steps that carry this
             item's pins — with step 11 `Release-guard (--base --head)` correctly `skipped` on a
             `push` event. `check-runs` on the merge SHA reports `total_count: 1`, so no second
             red check hides behind it.
             **Production verification: 8 of 8 PASS**, each re-derived read-only against the
             merge commit itself rather than the local worktree — deployment start; deployment
             completion with the pins actually running; `0.61.0` coherent across all six version
             locations plus the README `## Status` stamp (56 agents / 51 skills) and the dated
             `## [0.61.0] - 2026-08-25` section with a **non-dangling** compare link (`v0.60.0` =
             `d5cd9590…` exists); marketplace still **exactly one** entry, `kai` at
             `source: "."`; `COMMITTED_PACKS = []` **and no `packs/` tree**, proven *positively*
             from the merge commit's complete root tree (`d4f95819…`, `"truncated": false`), not
             from a local glob; `scripts/lib/degraded-block.txt` present at the merge commit and
             identical to the reviewed copy; annotated tag `v0.61.0` (`e88857db…`) peeling to the
             merge commit with release `376770741` `draft: false` / `prerelease: false` published
             23:12:37Z; and **no agent or skill body changed** — the `agents` (`c0284f31…`) and
             `skills` (`2a4a7abc…`) subtrees are byte-identical between base and merge, as are
             `docs`, `examples`, `test`, `.kai`, `hooks.json`, `AGENTS.md` and
             **`.github/workflows` (`2fb1467c…`)**, so `validate.yml` was declared in `touches`
             and genuinely not changed and "no new CI step" is true in production.
             **The release note was read, not accepted on report, and it holds the security
             truth-binding:** it claims carriage and CI enforcement — "Every generated
             department-agent body now carries a canonical, byte-pinned degraded-mode refusal
             instruction after the core compatibility preflight" — and states the limits outright:
             "The trigger remains a model-evaluated instruction; this release does not claim
             measured refusal or graceful degradation", "No generated pack tree is committed or
             published, and the marketplace still exposes only the monolithic `kai` plugin." It
             says **department**, never "every pack", and claims **no model obedience**.
             **`change_ref` deliberately unchanged** at `8d3ef484…` — deployment moves state, not
             the reviewed implementation ref.
- state:     shipped
- change_ref: `8d3ef4844988f4974e6bec8f406a7723dee4e942`
- needs:     Nothing from this item. **What is proven is carriage, order, count and text** — the
             canonical block is on `main`, byte-identical to the reviewed copy, and the gates that
             pin it into every generated **department** agent ran green on the merge commit. What
             is **not** proven, and must not be claimed downstream, is that any agent *refuses*,
             *detects* contract loss or *degrades gracefully*: the trigger is model-evaluated
             self-report and is **unmeasured**. Concrete firing evidence stays owed at
             `pack-split-host-gates` (parked **P2-D1**).
- artifacts: kai/coordination/items/pack-split-degraded-refusal.md (v12, `shipped`, `## Ship
             confirm — CONFIRM-START + CONFIRM-COMPLETE, 2026-08-25-1612`);
             kai/library/releases/2026-08-25/03-ship-pack-split-degraded-refusal/ship-record.md
             (production verification executed + deployment record appended — already at its
             canonical library path, so **no post-ship `git mv` is owed**);
             kai/coordination/threads/pack-split-generated-pack-trees.md (dependency
             reconciliation NOTE, no field changed on that record); kai/coordination/BOARD.md;
             kai/coordination/ACTIVE.md; kai/initiatives/pack-split/deliverables.md;
             kai/initiatives/pack-split/log.md
- evidence:  **No shell** — read / search / fetch / edit only; nothing was executed. Re-derived
             from `api.github.com` and `raw.githubusercontent.com` at `680ca445…`: the merge
             commit and its parent and signature, run `32909692506`, job `98001208870` with its
             per-step conclusions, the merge SHA's `check-runs` (`total_count: 1`), the annotated
             tag object `e88857db…` and its peel, release `376770741` **with its published body
             read in full**, the merge and base **root trees** and the `.github` subtrees,
             `plugin.json`, `package.json`, `package-lock.json`, `marketplace.json`, `README.md`,
             `scripts/lib/degraded-block.txt` and `scripts/lib/pack-plan.mjs`
             (`COMMITTED_PACKS = []`) at the merge commit. Corroborated locally:
             `.git/refs/heads/main` = `680ca445…`; `.git/packed-refs` holds `v0.60.0` =
             `d5cd9590…`, so the `[0.61.0]` compare link is not dangling. **Operator-attested,
             not re-derived:** the exit status of deploy step 1's `git diff --exit-code` — now
             subsumed by production evidence, since the merge tree changed only declared paths
             and `agents/` + `skills/` are provably byte-identical.
- questions: none blocking. Two interpretations remain parked for
             `principal-product-manager` and are **not** resolved by this ship: **E1** — the
             northstar's `dependency-guarantees` line reads "shipped in **every pack**" while this
             shipped in every **department** pack (4 of 5); the item's own acceptance is met
             exactly and no milestone was declared met here. **A1** — whether core agents need
             their own second block once a core-only install becomes real (reopen at
             `pack-split-generated-pack-trees`, at the latest `pack-split-first-department`).
- next:      none — item closed (`next_role: null`). Milestone `dependency-guarantees` moves to
             **4 of 5** required items `shipped` and stays **OPEN**; only
             `pack-split-ci-partition-checks` remains. `pack-split-generated-pack-trees` goes
             **3 of 6 -> 4 of 6** dependencies met, stays `proposed` and outside `scope.current`.
             `pack-split-ci-partition-checks` was already dispatchable and still is — dispatch is
             the director's call, not this gate's — but its touch-conflict check on
             `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and
             `scripts/pack-preview.mjs` now applies against **landed `v0.61.0` surface**.

## NOTE 2026-08-25-1612 — workflow-ship: what SHIPPED does and does not mean here

- **Does:** record that the operator deployed `v0.61.0` to `main`, that the merge is green in
  production, that the canonical refusal block and its byte-pins are live on the default branch,
  and that the release is tagged and published against that exact commit.
- **Does not:** claim any agent *refuses*, *detects* contract loss or *degrades gracefully* — the
  trigger is model-evaluated self-report, its effectiveness is **unmeasured**, and the CI pin is
  on the text being present, unique, ordered and unaltered, never on a model obeying it. Does not
  claim any pack is generated, committed or published (`COMMITTED_PACKS = []`, no `packs/` tree,
  marketplace still N=1). Does not close milestone `dependency-guarantees`, promote or dispatch
  any item, or resolve **E1** / **A1**, which stay parked with `principal-product-manager`.
- **Consumers of the published `kai` plugin get `0.61.0` metadata and nothing behavioural** — all
  56 agents and 51 skills are byte-identical to `0.60.0`, proven by subtree identity, so the
  rollback residue the ship record described (a consumer holding a `0.61.0` copy) would have been
  behaviourally indistinguishable in any case. Rollback was never invoked.
