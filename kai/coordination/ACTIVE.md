# Active initiatives

Operational focus pointer, not the permanent record. Each row names an
initiative `slug` currently receiving attention and, briefly, why. This file
lists only the current focus — `kai/initiatives/INDEX.md` is the permanent
all-status catalog, and removing a terminal initiative from this file must
never make it undiscoverable there.

| slug | why active |
|------|------------|
| pack-split | `partition-lock` **completed**; `pack-split-engineering-decomposition` **completed**. Focus is `dependency-guarantees`. The foundational item **`pack-split-generator-gates`** is **`shipped`** — `workflow-ship` ran CONFIRM-START and CONFIRM-COMPLETE **2026-08-25-1125**, walking `release-ready -> deploying -> production-verification -> shipped` (v13 -> v16, lease cleared, `next_role: null`). **The operator merged PR #152 at 2026-08-25T18:20:55Z** into merge commit `47aa0549f89b1733483dd6b662a4787d621c9430`, tagged and released **`v0.58.0`**; kai merged, tagged, released and published **nothing**. **Production verification PASSED** — 4 of 5 checks re-derived read-only here (`0.58.0` coherent across all six version locations + README `## Status` + `CHANGELOG [0.58.0]` and its compare link; `marketplace.json` still **exactly one** entry, `kai` at `source: "."`; **no `packs/` tree on `main`**, so the committed-unpublished non-negotiable holds in production; both `v0.58.0` and `v0.57.0` tag refs present), with the `main` CI conclusion (run `32883225913`, `success` at head `47aa0549…`) and the annotated-tag peels recorded as **operator-attested** because this environment has no shell and `api.github.com` returned 403 — corroborated by local refs/reflog all reading `47aa0549…`. Rollback was never invoked. The operator also restored the missing historical `v0.57.0` tag/release, retiring the dangling `[0.58.0]` compare link. **The one follow-up owed is now closed (reconciled 2026-08-25-1136):** the operator executed the outstanding `git mv`, so the ship record is filed at its canonical library home `kai/library/releases/2026-08-24/01-ship-pack-split-generator-gates/ship-record.md` (the pre-promotion path under `kai/initiatives/pack-split/artifacts/docs/` no longer exists); item v16 -> v17, still **`shipped`**, no code, release, or downstream change. **Milestone `dependency-guarantees` is still OPEN — 1 of 5 required items `shipped`.** **Steward grooming passes 2026-08-25-1139 and 2026-08-25-1148 (`principal-product-manager`): all five `dependency-guarantees` items are now `proposed -> ready`; none dispatched, no lease, no code touched.** **`ready` is a steward commitment, not a dispatch signal** — it requires `depends_on` to be *declared*, not resolved, so the last two entries below are `ready` **and deliberately not dispatchable**; the director's dependency check must still fail on them. Queue, in steward priority order: **(1) `pack-split-preflight-compat` — priority 10**, the top of the initiative (its sole dependency `generator-gates (shipped)` verified against the v17 record; ranked first because `degraded-refusal` depends on **it** at `shipped` and `ci-partition-checks` needs it for the version-skew arm); **(2) `pack-split-crosspack-validator` — priority 20**, dependency-satisfied and genuinely parallel-capable, though it shares the `principal-swe-infra` owner and overlaps `preflight-compat` on `scripts/lib/pack-plan.mjs`, `scripts/validate-plugin.mjs` and `.github/workflows/validate.yml`, so concurrency needs a **touch-conflict check at dispatch** — no dependency was added between them; **(3) `pack-split-host-semantics-spike` — priority 30**, promoted on the authority of the already-ratified decomposition (WS#2, "runs in parallel with the dependency-guarantees work") and the 2026-08-24 steward decision to keep it a separate gating spike. That promotion **does not** move `first-pack-extracted` into `scope.current` (still `[dependency-guarantees]`), does not change its milestone, and leaves `required_for_milestone: false` — `pack-split-host-gates` remains the formal certification and full macOS/cloud cert stays `deferred`. The spike needs an **`@operator` host session** (macOS + one cloud host) to reach `completed`; infra designs the probe, no kai role can run an external host gate. All three carry `owner: null` until the director grants a lease; **`next_role: principal-swe-infra`** on each. Acceptance was tightened only where recorded findings already required it (bundled local-vs-CI criteria split per the 2026-08-24-2244 DoD bounce; injection pointed at the authoritative `materializePacks` path per the 2026-08-24-2240 acceptance correction; exact `--all --out <dir>` command form). Then **promoted at 2026-08-25-1148, `ready` but NOT dispatchable:** **(4) `pack-split-degraded-refusal` — priority 40**, whose sole dependency `preflight-compat (requires: shipped)` is **unmet** — dependency type preserved, not weakened, because it shares the generated-agent-body injection surface with `preflight-compat` (WS#5: sequenced, not raced); acceptance now names `materializePacks` as the copy path on that file's own recorded authority (its header defers "(preflight, **degraded-mode**)" injection to downstream items), and keeps **both** the architecture and security reviews; **(5) `pack-split-ci-partition-checks` — priority 50**, the CI capstone, with **both** dependencies (`crosspack-validator`, `preflight-compat`, each `requires: shipped`) **unmet** and both types preserved; its rename criterion now names `scripts/lib/pack-plan.mjs` as the canonical partition source to update (verified on `main` — still maps `'fleet-observation': 'core'`), A5 untouched, and its **single** `independent-architecture` review deliberately **not** expanded with a security review. Both carry `owner: null` and `next_role: principal-swe-infra`. Priorities encode **reachability, not urgency** — the director dispatches from the top and the dependency check does the gating. **Deliberately not promoted:** `pack-split-migration-doctor` (dependency-satisfied but in `first-pack-extracted`, outside `scope.current` — the one-way valve stays shut regardless of readiness); `pack-split-generated-pack-trees` (five open dependencies) and the rest of `first-pack-extracted` / `five-pack-split-shipped`. Architect findings remain routed: A1–A3 → `generated-pack-trees`, A4 → `release-12b`, A5 → `ci-partition-checks`, A6 parked in the backlog. Non-blocking: **3** open questions remain (review-lens binding, first-department `shipped` semantics, director-availability completeness — the last is verified at `ci-partition-checks` acceptance and is deliberately kept out of `waiting_on_questions`). **Build update 2026-08-25-1157 (`principal-swe-infra`): `pack-split-preflight-compat` is `ready -> in-review`** (v2 -> v3, `owner: principal-swe-infra`, `next_role: principal-swe-architect`, no lease). The canonical `scripts/lib/preflight-block.txt` now exists and injection moved into the **authoritative** `materializePacks` (`scripts/lib/pack-plan.mjs`) for non-core agents only, with the preview refactored onto the shared functions, a byte-for-byte CI pin added to `scripts/validate-plugin.mjs`, catalog/inventory filed at **51 skills**, and `0.58.0 -> 0.59.0` bumped across all eight release locations. **It is NOT complete, NOT release-ready and NOT shipped, for two stated reasons:** the run had **no shell**, so `skills/kai-core-contract-v1/SKILL.md` could not be created (the file tool cannot make a directory) and **no command was run** — `npm test`, `validate-plugin`, `pack-preview --self-test`/`--check`, `host-contract`, `docs:check` are all still owed, and the suite **fails by design** until that skill lands. Nothing was branched, committed, pushed or opened as a PR; the changes sit **uncommitted on `main`**, so `change_ref` is `null` and **neither required review can bind yet**. Milestone `dependency-guarantees` remains **1 of 5 required items `shipped`** — this item moving to `in-review` changes nothing downstream: `degraded-refusal` and `ci-partition-checks` still require it at `shipped` and stay non-dispatchable. `pack-split-crosspack-validator` still overlaps it on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`, so the touch-conflict check at dispatch now matters more, not less. **Reconciliation 2026-08-25-1219 (`principal-swe-infra`, record-only — no implementation or release file touched; item v3 -> v4, still `in-review`): the blocker above is RESOLVED and every "no shell / nothing was run / fails by design" claim in the 2026-08-25-1157 build update is SUPERSEDED and stale.** The operator created `skills/kai-core-contract-v1/SKILL.md` with the exact body recorded in the item thread (verified by reading it) and ran verification: `pack-preview --self-test` **44 checks passed**, `--all` contract 1 preflight ready, `--all --no-core` and `--all --contract 2` each the **exact `KAI-CORE-MISSING`** token, `--check` passed (no committed packs configured), `validate-plugin` valid at **56 agents / 51 skills**, catalog check passed, host-contract self-test passed with the inventory matching, release-guard self-test passed, syntax check passed, and **full `npm test` passed**. Acceptance criteria 1–5 are now ticked on that evidence. **One command did fail and is recorded, not hidden:** an attempted `node scripts/generate-fixture.mjs` — a script that **does not exist in this repo** — failed on the missing file before any change, with no side effect; it is not part of `npm test` and not required by any acceptance criterion. The real generator `npm run docs:generate` succeeded, and the hand-edited `test/fixtures/inventory.json` was validated by the gate that owns it, `host-contract --self-test`. **Still NOT complete, NOT release-ready, NOT shipped.** The `validate`-green-on-the-pushed-PR criterion stays **unticked**: branch `kai/feat/29-preflight-compat` exists at `9d16e0751cc223f9bc9421cedbf0ac32b134b9c3` (`main` after PR #153) with **no commit on it** (reflog-verified), so `change_ref` is still `null` and **neither required review can bind** — `next_role` remains `principal-swe-architect` pending that binding, with `principal-security` after it at the same `change_ref`. Local green is evidence for acceptance, never a substitute for a review or for CI. Milestone `dependency-guarantees` is **still 1 of 5 required items `shipped`** — nothing here moved a milestone; `degraded-refusal` and `ci-partition-checks` still require this item at `shipped` and remain non-dispatchable. No pack trees, marketplace pack entries, degraded block, cross-pack validator, collision gates, migration logic, tag, release or publication were added. **Independent architecture review 2026-08-25-1231 (`principal-swe-architect`): CHANGES REQUIRED on `change_ref a15bd82310737abe550fe660f3677eb19f1c0da2`** — the item's first-ever ref, minted by the operator with `git stash create` over the staged 0.59.0 implementation and reviewed through the worktree on the operator's attested empty diff for all implementation/release files (this run had **no shell**; nothing was re-executed, so the green suite was input, **not** verdict). Item **v5 -> v6, still `in-review`**, lease cleared, `next_role: principal-swe-architect -> principal-swe-infra`. **`completed_reviews` is still `[]`, deliberately** — the `independent-architecture` requirement is **unmet**, and only reviews matching the current `change_ref` count, so a non-ratifying verdict must not sit in a list whose sole meaning is "satisfied at this ref"; **`principal-security` is NOT unblocked** and reviews the *next* ref, since both required reviews must bind the same one. **The seam was endorsed; two guards on it are incomplete, and both are silent under a fully green CI.** **A1** — the demanded contract version is the one semantic element of the canonical `preflight-block.txt` that is **not** pinned: the validator pins that the block names `CONTRACT_SKILL`, carries `REFUSAL` and carries the override sentence, but nothing pins the version, and the validator and preview each compare the *probe* against an independent bare `'1'`; flip one character so the block demands `2` and every gate stays green while every generated department agent refuses a healthy core. Presence-detection rides two shared constants; version-detection — the half this item is named for — rides prose nobody checks. **A2** — the generated-agent position check asserts two *lower* bounds only, and `injectPreflight`'s anchor returns the same index every call, so `pack-split-degraded-refusal`'s obvious composition lands its block **above** the preflight and still passes everything: a section headed "before anything else" that is no longer first. Both close inside files already in `touches` (one shared `CONTRACT_VERSION` constant plus two assertions) — **no new file, no new CI step, no new capability, no acceptance criterion added or raised** — and re-review is scoped to those diffs against a **new** ref. **Ruled clean and now settled: the pre-review ordering fix WORKS.** The heading claims primacy, the body names the earlier directive and overrides it, and the directive's fallback clause does not survive as a competing instruction — those non-negotiables are *constraints*, not permission to act, and the block separately forbids the exact actions they name; verified against the real shape of all **56** agents, each carrying exactly one `**Inherits:**` line *and* the verbatim blockquote, so the "directive above" reference never dangles. Also clean: core exclusion and core-owned probe placement asserted over **real generator output**; the probe restates no kai rule, so it cannot drift from core; the **nine ratified orphan dispositions are byte-identical** with `kai-core-contract-v1: core` added as the tenth, and `orphans === overrides` **plus** `unplaced === 0` is genuine set equality, not a count coincidence; the firing-path exemption is **derived from the block**, not hardcoded; LF handling is sound on a CRLF checkout; `0.59.0` is coherent across all eight release locations with the marketplace still **N=1** at `source: "."` and **no `packs/` tree**; and "no new CI step" is true — the workflow already runs `validate-plugin`, `--self-test` and `--check`. **Two findings routed rather than absorbed:** `degraded-refusal` must place its block **after** the preflight and must not resurrect the fallback-clause conflict the preflight just resolved; the probe's `tools: [view]` grant, on a body that forbids any tool call, is a least-privilege question routed to **`principal-security`** — capability acceptance is not architecture's to give. Non-blocking, recorded not fixed: `README.md:168` says "56 agents and 49 skills" against a true 51 (pre-existing, unguarded because `host-contract` scopes its count check to `## Status`). **Milestone `dependency-guarantees` is still 1 of 5 required items `shipped`** — a bounced review moves nothing downstream: `degraded-refusal` and `ci-partition-checks` still require this item at `shipped` and remain non-dispatchable, and `crosspack-validator` still overlaps it on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`, so the touch-conflict check at dispatch still applies. Nothing was committed, pushed, merged, tagged, released or published, and the review edited no implementation or release file. **Architecture re-review 2026-08-25-1241 (`principal-swe-architect`) on the corrected `change_ref 96b693a1f8742b24234c88e170a17ef747bf6830`: CHANGES REQUIRED again, on a strictly smaller surface** — item **v7 -> v8, still `in-review`**, lease cleared, `next_role: principal-swe-architect -> principal-swe-infra`, **`completed_reviews` still `[]`**, and **`principal-security` still NOT unblocked** (it reviews the ref that closes this, since both required reviews must bind the same one). Read through the worktree on the operator's attested byte-identity for all implementation/release files; **no shell**, nothing re-executed, the green suite treated as input rather than verdict. **A2 is CLOSED and verified:** `validate-plugin.mjs:416` computes the end of the inherited-contract blockquote and `:421–423` rejects any non-whitespace before the preflight, so the downstream `injectPreflight(injectPreflight(…))` inversion now fails loudly by name; the skipped-check branches are already hard errors at `:226`/`:291`, the wedge regression is still caught by the `:419` lower bound, and every generated agent satisfies the new bound today (valid at 56/51). **N1 is CLOSED** — `README.md:168` now reads 51 and agrees with `## Status`. **A1 is only PARTIALLY closed, and that is the whole of the return:** `CONTRACT_VERSION = '1'` landed correctly and both independent JS literals now use it (`validate-plugin.mjs:394`, `pack-preview.mjs:104`), but `preflight-block.txt` states the demanded version **twice** and `validate-plugin.mjs:374` is a presence test on the first occurrence only — the unpinned one sits in the **refusal** clause ("anything other than `1`"), so the residual fails **open**, not closed. The trigger is the contract bump this item exists to make safe: bump the constant to `'2'`, ship `kai-core-contract-v2`, update the continue clause and miss the refusal clause, and every gate stays green while the shipped block continues iff the value is `2` and stops iff it is anything other than `1` — a healthy v2 core trips both clauses (undefined fleet-wide behaviour) and a stale v1 core trips neither cleanly, so the block **admits the skewed core it exists to reject**. Fix is **one set-equality assertion in `scripts/validate-plugin.mjs`, ~3 lines**, passing today unchanged: the block must demand exactly one version and it must be `CONTRACT_VERSION`. **The bar was not raised and the ambiguity is partly the reviewer's** — the 2026-08-25-1231 Review section specified set equality over *every* backticked version literal while its HANDOFF summary compressed that to the singular, so what infra shipped is a fair reading of the summary; the ask is the assertion as originally written, nothing more. **No design change was requested in either round** — both sets of findings are holes in the *pin*, not in the seam, and everything ruled clean at `a15bd823…` was re-confirmed on this ref (ordering fix, anchor, core exclusion, probe ownership, orphan-override set equality at 10/10, derived firing-path exemption, LF on a CRLF checkout, `0.59.0` coherent across all eight locations with marketplace still N=1, "no new CI step" true). **No implementation scope moved between the two refs:** `COMMITTED_PACKS` still `[]`, no `packs/` tree, the probe skill byte-unchanged, the A1/A2 pass confined to its three files plus the one README line. Non-blocking: **N2** (`tools: [view]` on a probe body that forbids any tool call) stays routed to **`principal-security`**, undecided by architecture; **N3** recorded — `pack-preview`'s `contract === 1` is a mode selector, not a version demand, and it would fail *loudly* at a bump, so it is not a finding. **Milestone `dependency-guarantees` is still 1 of 5 required items `shipped`** — a second bounced review moves nothing downstream: `degraded-refusal` and `ci-partition-checks` still require this item at `shipped` and remain non-dispatchable, and `crosspack-validator` still overlaps it on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`, so the touch-conflict check at dispatch still applies. With A2 landed, `degraded-refusal`'s ordering constraint is now **mechanically enforced** rather than only routed. Nothing was committed, pushed, merged, tagged, released or published, and this re-review edited no implementation or release file. **Architecture review RATIFIED 2026-08-25-1248 (`principal-swe-architect`) on `change_ref 3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`** — item **v9 -> v10, still `in-review`**, lease cleared, `next_role: principal-swe-architect -> principal-security`, and **`completed_reviews` now carries `principal-swe-architect` / `independent-architecture` / `ratified` at this exact ref**, so that requirement is satisfied **for this ref only**; if the ref moves, the entry stops counting and both required reviews must re-bind together. Read through the worktree on the operator's attested byte-identity for all implementation/release files; **no shell**, nothing re-executed, the green `npm test` treated as input rather than verdict. **A1 is CLOSED, and closed more cheaply than the reviewer specified:** rather than adding an assertion to police two prose literals, infra **removed the second literal** — `scripts/lib/preflight-block.txt` now names the accepted version **once** (`contract: 1`) and defines refusal as the *complement* of the continue clause ("or that exact contract line is not returned"), so the fail-open pair the last round found ("continue iff `2`, stop iff anything other than `1`") is **structurally unconstructible**, not merely detected, and the bump-time trigger is gone because there is no second literal to miss. Verified: the block's other backticked tokens (`kai-core-contract-v1`, `KAI_CORE_READY`, `KAI-CORE-MISSING`) carry no version, the old "anything other than" clause survives nowhere under `scripts/`, and continue/refuse are exact complements — a skewed core returning `contract: 2` does not return the exact line, so it **stops**. The pin at `validate-plugin.mjs:374–378` extracts **every** backticked `contract:` demanded value and requires exactly one equal to the shared `CONTRACT_VERSION`: it passes today at `["1"]` and fails **by name** on a forgotten bump, a re-added second clause, a dropped version, or the original flipped-literal mutation, with no false positive on `kai-core-contract-v1`; generated bodies inherit the guarantee transitively through the byte-for-byte block comparison at `:405`. **A2 and every prior ruled-clean item were re-confirmed unchanged on this ref** — the adjacency guard (`:416–425`, both bounds) is byte-unchanged and the `injectPreflight(injectPreflight(…))` inversion still fails loudly; the prose edit stranded no gate (the pinned override sentence is still verbatim, `pack-preview`'s self-test anchors on the `## Core preflight` heading and `REFUSAL`, neither of which moved); `COMMITTED_PACKS` is still `[]` with no `packs/` tree; `skills/kai-core-contract-v1/SKILL.md` is byte-unchanged; `.github/workflows/validate.yml` is unchanged, so **"no new CI step" still holds**; `0.59.0` is coherent across all eight release locations with marketplace still **N=1** at `source: "."`; README `:34` and `:168` both read 56 agents / 51 skills (N1 stays closed); orphan/override set equality is still 10/10 with `unplaced === 0`; the firing-path exemption is still derived from the block; LF handling on a CRLF checkout still asserted. **Ratification is NOT completion:** the item is **not** `complete`, **not** `release-ready`, **not** `shipped`, and the CI-green-on-the-pushed-PR criterion stays **unticked** because only CI can supply that evidence. **`principal-security` is now unblocked on this same unchanged ref**, carrying two things architecture deliberately did not decide: **N2** — the probe's `tools: [view]` grant on a body that forbids any tool call (least-privilege acceptance is security's, not architecture's) — and the trust boundary itself, that a missing or skewed core must fail closed. Non-blocking and **recorded rather than routed**: **N4**, the pin matches `` `contract: N` `` forms, so a version stated as a bare backticked digit outside that form would escape it — nothing in the block has that shape today and the refusal clause no longer restates a version, so **no work was created**; it is a note for whoever performs the contract bump. **N3** unchanged. **Milestone `dependency-guarantees` is still 1 of 5 required items `shipped`** — a ratified architecture review moves nothing downstream: `degraded-refusal` and `ci-partition-checks` still require this item at `shipped` and remain non-dispatchable, and `crosspack-validator` still overlaps it on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`, so the touch-conflict check at dispatch still applies. Nothing was committed, pushed, merged, tagged, released or published, and this review edited no implementation or release file. |

The pack-split initiative is the current focus.

**Latest — 2026-08-25-1257 (`principal-security`).** `pack-split-preflight-compat`:
**independent security review CLEAR** at `change_ref 3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`,
the **same ref** architecture ratified — item **v10 -> v12** (v11 was the review lease grant),
still **`in-review`**, lease cleared, `next_role: principal-security -> workflow-ship`.
**Both required reviews are now satisfied at this one ref**; if the ref moves, both stop counting
and re-bind together. **P0 0 / P1 0 / P2 2**, neither release-blocking. **N2 DECIDED — the probe's
`tools: [view]` is ACCEPTED** as adequate least privilege: `tools: []` is rejected by the loader
contract, the repo's declared semantic is a ceiling not a grant, and marginal capability is
**zero** because all 56 agents already declare `view` (verified, not assumed). **P2-S1** the
generated-agent pin is gated on `/^kai-[a-z]+\/agents\//`, so a future hyphenated pack name would
silently escape it (complete coverage today; pin-coverage gap, not a live fail-open) — owner
`principal-swe-infra`, natural home `pack-split-ci-partition-checks`, **no item created**.
**P2-S2** the arms prove a JS re-implementation of the rule plus byte-identity of the instruction,
**not** that a model obeys it — nothing downstream may claim pack agents *refuse*, only that they
*carry a pinned fail-closed instruction*; empirical proof is owed by `pack-split-host-gates`.
Residual risks recorded, **none accepted**: **R1** the probe proves availability/compatibility,
**not authenticity** (a third-party plugin providing a same-named skill could satisfy or shadow it;
**zero shipped exposure** — `COMMITTED_PACKS` `[]`, no `packs/` tree, marketplace N=1) and **R2**
the control is instruction-level, not host-enforced — both are the operator's calls **at
publication**, not now. Read through the worktree on the operator's attested byte-identity; **no
shell**, nothing executed, green `npm test` treated as **input, not verdict**; the ref's loose
object was confirmed present in `.git/objects/` (existence only). **NOT complete, NOT
release-ready, NOT shipped** — the "`validate` green on the pushed PR" criterion stays **unticked**
and nothing is committed on `kai/feat/29-preflight-compat` (still `9d16e075…`), so the ship gate is
expected to bounce it back to `principal-swe-infra` for PR delivery; that is the correct mechanical
outcome, not a security objection. **Routing deviation recorded:** the dispatch suggested
`principal-product-manager`; `kai-core-work-coordination` → *Review routing* step 4 names
`workflow-ship` for a `product-change` item whose review requirements are all met, so that is what
was written — the steward keeps the acceptance call and can re-route cheaply. Milestone
`dependency-guarantees` unchanged at **1 of 5 required items `shipped`**; `degraded-refusal` and
`ci-partition-checks` still require this item at `shipped` and stay non-dispatchable, and
`crosspack-validator` still overlaps it on `scripts/lib/pack-plan.mjs` and
`scripts/validate-plugin.mjs`. No implementation or release file edited; nothing committed, pushed,
merged, tagged, released or published. Assessment:
`kai/initiatives/pack-split/artifacts/security/pack-split-preflight-compat.md`.

*(Recorded below the table rather than appended to the `pack-split` row: that cell has grown past
this file's stated "briefly, why" purpose, and the authoritative state is the item record either
way. The row's own text still ends at the architecture ratification and is superseded by this
note.)*

**Latest — 2026-08-25-1310 (`workflow-ship`, PREPARE).** `pack-split-preflight-compat`:
**DoD gate verdict RELEASE-READY — all six dimensions Clear, none waived.** State
**`in-review` -> `release-ready`**, item **v12 -> v14** (v13 was the gate lease grant, token
`wsh-2026-08-25-1310-pfc-dod`, cleared after the write), `next_role: workflow-ship -> "@operator"`,
`resume_state` stays `null`. **This is a readiness stamp, NOT a ship stamp — the item is NOT
`shipped`.** PR **#154** is **open and unmerged** at head `d4145eed69681e20d2443a4242e687a9036bf557`
(base `main` `9d16e075…`; one implementation commit, reflog-verified); **no tag, no release,
nothing published**, and kai merged, tagged, released and published **nothing**.

**The bounce the 2026-08-25-1257 note predicted did not happen, because the evidence arrived —
that prediction is superseded, not waved away.** The operator committed, pushed and opened PR #154,
and the one unticked criterion ("`validate` green on the pushed PR") is now closed by GitHub Actions
run **32893764931**: workflow `validate`, event `pull_request`, `head_sha d4145eed…`,
`run_attempt: 1`, **`conclusion: success`**; job **`contract`** (`97951496629`) on `ubuntu-latest` /
Node 20, `20:10:09Z -> 20:10:23Z` (**14s**), **all 11 substantive steps `success`** — including the
new byte-pin (`Validate plugin contract`), the pack-generator self-test, the committed-tree check,
and the `pull_request`-only **real** `release-guard --base/--head` gate. Read from `api.github.com`
by the gate run, read-only — **not accepted on report**.

**The review binding held through delivery.** Both required reviews bind `change_ref
3383d7f2476f6ccdec5b4d3077783a13fe47eeb7`, and the operator attests the implementation/release files
at the PR head are byte-identical to it, so `change_ref` deliberately **stays** at the reviewed
object. That attestation is the one thing the gate could not re-derive (**no shell**), so it is
re-checked mechanically as **deploy step 1**, which fails closed. `api.github.com` also began
returning **403** mid-run, so the PR *file list* and a `contents/packs?ref=d4145eed…` 404 could not
be re-derived at the head; those claims are read from the checked-out tree at that head and are
re-verified on `main` at production verification. **Non-negotiables re-read, not asserted:**
`COMMITTED_PACKS = []`, **no `packs/` tree**, marketplace still **N=1** (`kai` at `source: "."`,
version-only `0.58.0 -> 0.59.0`), root still the single source of truth with the shipped monolith
injecting no preflight, `0.x` held; consumers who update get one **inert** 51st skill.

**Owed to the operator, in the ship record**
(`kai/library/releases/2026-08-25/01-ship-pack-split-preflight-compat/ship-record.md`): verify the
reviewed diff -> commit the readiness records and confirm `contract` green on the **final** head ->
squash-merge #154 -> watch `validate` on `main` -> tag and release `v0.59.0` -> return deployment
evidence for CONFIRM-START / CONFIRM-COMPLETE. The record promotion is complete. Rollback is clean
and recorded: pre-merge don't merge; post-merge one revert;
post-tag revert **plus** delete the tag and release. **Security P2-S2 binds the release notes:** no
claim that pack agents *refuse* — only that they *carry a byte-pinned fail-closed instruction*.
**P2-S1 is now a parked PROPOSAL** in `kai/initiatives/pack-split/backlog.md` (owner
`principal-swe-infra`, natural home `pack-split-ci-partition-checks`); the gate created **no item**
and accepted **no** residual risk. **Milestone `dependency-guarantees` is still OPEN — 1 of 5
required items `shipped`**: `degraded-refusal` and `ci-partition-checks` still require this item at
`shipped` and stay non-dispatchable, and `crosspack-validator` still overlaps it on
`scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`, so the touch-conflict check at
dispatch still applies. **Next: `@operator`**, then back to `workflow-ship`.

**Latest — 2026-08-25-1328 (`workflow-ship`, CONFIRM-START + CONFIRM-COMPLETE).**
`pack-split-preflight-compat` is **`shipped`**. State walked
**`release-ready` -> `deploying` (v15) -> `production-verification` (v16) -> `shipped` (v17)** —
no state skipped — lease self-granted (`wsh-2026-08-25-1328-pfc-confirm`, `version_at_grant: 14`)
and cleared, `next_role: "@operator" -> null`, `resume_state` stays `null`, `change_ref`
**unchanged** at `3383d7f2…` (deployment moves state, not the reviewed implementation ref).
**The operator merged, tagged, released and published; kai did none of those, at any phase, and
no rollback was invoked.** PR **#154** squash-merged 2026-08-25T20:27:09Z into merge commit
`67670525808be349466155b836a7fdbbe4dfb8b7`; `main` `validate` run **32895404267** (`event: push`,
`run_attempt: 1`, `status: completed`, **`conclusion: success`**, `head_sha` exactly that merge
commit, `20:27:12Z -> 20:27:30Z`); annotated tag `v0.59.0` and release published 20:28:01Z.

**Production verification PASSED — five of six checks re-derived read-only against the merge
commit itself**, via `raw.githubusercontent.com` and the git-trees/tags APIs rather than the local
worktree, so a dirty checkout could not have produced a false pass: `0.59.0` coherent across all
eight version locations (compare link non-dangling — the API reports `v0.58.0 -> 47aa0549…`);
marketplace still **exactly one** entry, `kai` at `source: "."`; `COMMITTED_PACKS = []` and **no
`packs/` tree — proven positively**, because the merge commit's root tree lists `package-lock.json`,
`package.json`, `plugin.json` consecutively and `packs` sorts between the latter two in git's byte
ordering; `skills/kai-core-contract-v1/SKILL.md` present with the exact `KAI_CORE_READY` /
`contract: 1` marker; and the annotated tag object `338cfb04…` **peeled to the merge commit** via
the `tags` API — the peel that was left operator-attested at `v0.58.0` is genuinely re-derived
this time. The **one** claim resting on attestation is the per-job step breakdown
(`97956815622`, 16s) — the jobs endpoint returned **403** — and it is subsumed by the run-level
`success`, since a run cannot conclude `success` with a failing job. Limits recorded, not absorbed:
no shell, and every 403 was worked around with an equal-or-stronger read-only source rather than
downgraded to assertion. **Security P2-S2 held, checked by reading the published body:** the notes
claim generated department-agent bodies *carry a byte-pinned fail-closed instruction* and that the
**preview arms** emit `KAI-CORE-MISSING`; they do **not** claim a pack agent *refuses*, and they
state no `packs/` tree is committed and only the monolithic `kai` is exposed.

**Milestone `dependency-guarantees` moves to 2 of 5 required items `shipped` — still OPEN.**
Dependents cleared strictly by the DAG, not generously: **`pack-split-degraded-refusal` is
unblocked** (this was its **sole** dependency) and is now dispatchable — though it still overlaps
`pack-split-crosspack-validator` on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs`,
so the **touch-conflict check at dispatch is not waived**, and its block must land **after** the
preflight (A2 enforces that mechanically now). **`pack-split-ci-partition-checks` stays blocked**
on `crosspack-validator` (still `ready`), one of two dependencies met.
`pack-split-generated-pack-trees` has two of six met and stays `proposed`, outside `scope.current`.
**No residual risk was accepted** — R1 (authenticity, the operator's call *at publication*, which
this release is not), R2 (owed by `pack-split-host-gates`) and R3 travel unchanged; **P2-S1 remains
a parked backlog PROPOSAL** and this run created **no item**. **Next: the director** — dispatch is
its call, not this gate's.

**Latest — 2026-08-25-1410 (`principal-swe-infra`, BUILD).** `pack-split-crosspack-validator` is
**`ready -> in-review`** (v2 -> v3, `owner: principal-swe-infra`, `next_role:
principal-swe-architect`, lease `null`, `change_ref` still `null`). Cross-pack reference validation
now exists in the working tree: one collector and one resolver in `scripts/lib/pack-plan.mjs`
(`declaredInherits`, `dispatchedRefs`, `assetRefs`, `collectReferences`, `referenceErrors`,
`planAssets`, `assetOwnershipErrors`, `hooksAssignmentErrors`, `packProviders`), resolving every
inherited, user-invoked and orchestrated reference — plus every invoked `scripts/*` asset — against
**what `materializePacks` actually emits**, not against a plan. `scripts/validate-plugin.mjs`
consumes them and its old inline firing-path regexes are **deleted**, so generator, preview and
validator cannot disagree about what a reference is. Assets are planned to a pack (sole invoker
keeps it, two or more promote to `kai-core`); `hooks.json` is assigned to exactly one pack
(`HOOKS_OWNER = 'core'`, WS#7's disposition) with zero/duplicate/foreign-script assignment failing
by name, and the declared owner unioned with any generated emitter so the duplicate arm fires the
day `generated-pack-trees` routes assets rather than silently doubling the observer per subagent.
`pack-preview --self-test` gained ~25 arms — pure mutation arms for each failure **plus live
anti-fail-open arms** asserting the real corpus populates all three firing paths, so a collector
that found nothing could not pass. **No new CI step:** the workflow already runs `validate-plugin`
and the pack self-test; only its header comment changed. Release bumped `0.59.0 -> 0.60.0` across
all eight locations with the dated CHANGELOG section, compare link and README stamp; inventory
untouched at **56 agents / 51 skills**, so no catalog or fixture regeneration — nothing about the
roster moved. **Architecture ambiguity resolved without inventing syntax:** the orchestrated path is
the bolded-backticked list-entry shape the roster (and the existing firing-path check) already uses;
"any backticked mention" was **rejected** because ~20 live editorial cross-links would become
dependencies they are not; dispatch entries are read from **agents only** (skills use that shape for
field definitions); and cross-department **agent** referrals are **deliberately permitted** while
cross-department **skill** references fail — a referral degrades to "that pack is not installed",
a missing skill breaks the body that named it. All four calls are routed to the required review, not
asserted as settled. **It is NOT complete, NOT release-ready and NOT shipped, for one stated
reason: this run had no shell and therefore ran nothing.** `npm test`,
`node scripts/validate-plugin.mjs`, `node scripts/pack-preview.mjs --self-test`, `--check` and
`--all --out <dir>` are **all owed**; every "resolves clean today" statement in the record comes
from **reading** the corpus with grep. No branch was created (`kai/feat/29-crosspack-validator`
does not exist), nothing is committed, pushed, opened as a PR, merged, tagged, released or
published — so `change_ref` is `null` and the required `independent-architecture` review **cannot
bind yet**. Acceptance criteria 1–3 are annotated **implemented-but-unrun** and stay unticked;
only the version-bump criterion is ticked, on evidence re-derivable by reading. `touches` was
extended (declared, not silent) with `scripts/pack-preview.mjs` and the six release files.
**Milestone `dependency-guarantees` is unchanged at 2 of 5 required items `shipped`** — moving to
`in-review` clears nothing: `pack-split-ci-partition-checks` still requires this item at `shipped`
and stays non-dispatchable, and `pack-split-degraded-refusal` (dispatchable since 2026-08-25-1328)
still overlaps it on `scripts/lib/pack-plan.mjs` and `scripts/validate-plugin.mjs` — that overlap is
now **live surface movement**, so whoever picks up `degraded-refusal` must read this diff first.

**Continuation — 2026-08-25-1420 (`@operator`).** Created branch
`kai/feat/29-crosspack-validator`; the item remains **in-review** and is now bound at
`cb5fd0290f1a8b7478b54e98bf24f1968aa58f09` (v4, architecture lease active). The previously owed
checks are complete: `pack-preview --self-test` **70/70**, `validate-plugin` **56 agents / 51
skills**, `pack-preview --all --out <session temp>` generated all five previews, and full
`npm test` exited 0; the temporary output was removed. Acceptance 1–4 and the version bump are
now satisfied. The pushed-PR CI criterion remains open. No implementation or release file changed
after the review binding.
`COMMITTED_PACKS` is still `[]`, there is no `packs/` tree, and the marketplace is still N=1.
**Next: `@operator`** for the branch/run/ref, then `principal-swe-architect`.

**Architecture review RATIFIED — 2026-08-25-1428 (`principal-swe-architect`) at `change_ref
cb5fd0290f1a8b7478b54e98bf24f1968aa58f09`.** `pack-split-crosspack-validator` is **v4 -> v5, still
`in-review`**, lease cleared, `next_role: principal-swe-architect -> workflow-ship`, and
`completed_reviews` now carries `principal-swe-architect` / `independent-architecture` / `ratified`
at this exact ref — good **for this ref only**, so if the ref moves the entry stops counting. It is
the item's **sole** required review, so the requirement is now satisfied and the ship gate is the
next stop. Read through the worktree on the operator's attested empty diff for all implementation
and release files; this run had **no shell** and re-executed nothing, so the 70-check self-test,
`validate-plugin` at 56/51, the five-pack preview and `npm test` exit 0 were treated as **input, not
verdict**. **All six contested design calls were endorsed — each on evidence re-derived in the
review rather than inherited from the build handoff.** The load-bearing one is call 6: references
resolve against `packProviders(materializePacks(...))` — **what a user installs** — not against a
plan, so a provider the generator would not copy is a CI failure today instead of a post-split
support ticket. Call 2 (dispatch read from **agents only**) was tested by enumerating **every**
dispatch-shaped list head in all 51 skills: 59 matches across 13 skills, **zero** naming a skill —
they are record-field schemas, lifecycle states, error strings, path templates, family globs, and
four *agent* ids in `kai-core-design-grounding` — so collecting skills would add ~55 false tokens for
zero coverage. Call 3 (cross-department **agent** referrals permitted, **skill** references fail) was
checked against the locked artifact rather than accepted: **partition-lock §7.2 is stated in terms of
*inherit***, so it binds **providers, not referrals**, and the offered one-line change to fail agent
refs must **not** be made — it would break 12+ live referrals and demand a re-routing plan this item
does not own. Calls 1, 4 and 5 hold: `DISPATCH_ENTRY` is the shape the pre-existing firing-path check
already used (no syntax invented, ~20 editorial cross-links correctly excluded); asset **planning
now / emission at WS#7** matches the decomposition, which names this validator as WS#7's containment;
and `HOOKS_OWNER = core` unioned with generated emitters fails closed in **all four** future states
that were traced. **Fail-open scan found no blocking gap:** the live anti-fail-open arms assert
**thresholds** (>100 inherited, >5 orchestrated-agent, >5 user-invoked, >=1 asset) plus four named
carries, so a collector that found nothing cannot pass; `declaredInherits`' single-line read is safe
because `validate-plugin.mjs:276–303` independently enforces exactly one first-line `**Inherits:**`
across all 56 agents; unplaced skills fail closed via `fromPack: null`; `packProviders`' `kai-` strip
is the **exact inverse** of `packPluginName`, so there is no provider-identity bug and **no new
future-pack-name assumption** (the known `/^kai-[a-z]+\/agents\//` one is pre-existing and already
parked as P2-S1 — sharing `generatedPacks` did not widen it). Scope verified independently: **no new
CI step** (the workflow already runs `validate-plugin`, `--self-test` and `--check`; the workflow
diff is header prose), `COMMITTED_PACKS` still `[]`, **no `packs/` tree**, marketplace still **N=1**
at `source: "."` and `0.60.0`. **Stated so a green check is not over-read:** given `planAssets`
output, two of `assetOwnershipErrors`' four arms are **structurally unreachable today** (the plan
defines ownership from the consumer set, so it cannot disagree with itself) — acceptance criterion 2
is satisfied by the **assignment**, pinned live at `generate-audio.ps1 -> core` /
`demo-zoom.mjs -> personal`, and those arms become load-bearing only when **WS#7 supplies an
independent owner source**. **Three constraints now bind `pack-split-generated-pack-trees`:** consume
`planAssets` / `HOOKS_OWNER` instead of re-deriving ownership (a second truth is the A5 defect class
and would be invisible), route hook scripts **by declaration** rather than by prose mention (today
`observe-subagent.mjs` is owned by core only because a core skill's prose invokes it — fail-closed,
but fragile as routing), and emit `hooks.json` into **core only**. **Four non-blocking observations
routed, none fixed here:** **N1** a dispatch entry naming a *deleted skill* is silently dropped
(skills classify by resolution, agents by shape) — not a cross-pack defect, identical in the monolith,
and unfixable by shape since skills have no family prefix; the cheap mitigation is widening the live
lens arm to all nine `workflow-doc-review` lenses -> `ci-partition-checks`. **N2** two "agent-shaped"
definitions now exist (`AGENT_REF` omits `creative`, `AGENT_SHAPED` is complete) -> with **A5** in
`ci-partition-checks`. **N3** `endsWith('/hooks.json')` counts any depth where `^[^/]+/hooks\.json$`
is the intent — unreachable today, fail-closed -> WS#7. **N4** hook-asset key-spaces differ and only
the first `${PLUGIN_ROOT}` path per command is read — fail-closed, one line. **N5** no separate
design artifact was opened: the item's `## Review` section is the initiative's convention for an
architecture review (only *security* reviews get an artifact file), which answers infra's standing
question. **One escalation, decided by nobody here:** cross-department **agent referral degradation
is unspecified** — 12+ referrals will survive the split with no defined behaviour when the sibling
pack is absent (WS#5 covers a missing **core**, not a missing **department**). Silent / named /
install-suggesting is a **product** call that would add a surface no committed item owns, so it is
routed to `principal-product-manager` as a **PROPOSAL for triage** — not a dependency, not an item,
not an acceptance criterion. **Ratification is not completion:** the item is **not** `complete`,
**not** `release-ready`, **not** `shipped`, and the **pushed-PR CI criterion stays unticked** — only
CI can supply it. **Milestone `dependency-guarantees` is unchanged at 2 of 5 required items
`shipped`** — `pack-split-ci-partition-checks` still needs this item at `shipped` and stays
non-dispatchable, and `pack-split-degraded-refusal` still overlaps it on `scripts/lib/pack-plan.mjs`
and `scripts/validate-plugin.mjs`, now as **live surface movement**, so that diff must be read rather
than assumed. Nothing was committed, pushed, merged, tagged, released or published, and this review
edited **no implementation or release file**. **Next: `workflow-ship`** — the DoD gate.

**DoD gate RELEASE-READY — 2026-08-25-1435 (`workflow-ship`, PREPARE).**
`pack-split-crosspack-validator` is **v5 -> v6, `in-review -> release-ready`**, lease `null`,
`resume_state: null`, `next_role: workflow-ship -> "@operator"`. **All six DoD dimensions Clear,
none waived** — and **it is NOT shipped**: kai merged nothing, tagged nothing, released nothing and
published nothing, and will not; the deploy steps are the operator's. *(Stamped `1435` to preserve
append-only ordering behind the `1428` ratification; session clock read 14:23.)* **The one open
criterion is closed on evidence read here, not reported:** acceptance criterion 5 is ticked on
**run `32900688907`** — workflow `validate`, event `pull_request`, `run_attempt: 1`,
`head_sha 0f3705e0b714f7d23a900296fb7c6f59d12148be`, base `630089bc…`, **`conclusion: success`**;
job **`contract`** (`97973596644`), `ubuntu-latest` / Node 20, **11/11 substantive steps `success`**,
21:22:54Z -> 21:23:10Z (**16s**) — the **same 11 steps** as the `0.59.0` run, which independently
confirms the "no new CI step" claim (the checks ride `Validate plugin contract` and `Pack generator
self-test`). **PR #156** *feat: validate cross-pack references* is **open, draft false,
`mergeable: true` / `mergeable_state: clean`, 1 commit, +1314 / −55 across 15 files**; head
`0f3705e…` (short SHA resolved from local refs, confirmed by the API), base `main` `630089bc…` which
is byte-identical to local `main` **and** `FETCH_HEAD`, so the branch is exactly **one commit ahead
with no divergence** — a squash merge is clean and **no rebase is needed** (a rebase would void both
the review binding and the CI evidence). **Non-negotiables re-read at the head commit:**
`COMMITTED_PACKS = []` and `HOOKS_OWNER = 'core'`; **eight of eight** version locations coherent at
`0.60.0` (four via `raw.githubusercontent.com` at `0f3705e…`, four from the PR patches) with the
`v0.59.0` tag present so the compare link is not dangling; marketplace still **N=1** at
`source: "."`; **no `packs/` tree**; root `agents/` and `skills/` **untouched** — the validator
landed without editing a single shipped body. **Dimension 4 was right-sized, not ritualised:** no
runtime, data, migration or publication change and all 56 agent / 51 skill bodies byte-unchanged, so
canary/flag/ring/runbook are **not applicable** and were deliberately not invented; the real blast
radius is this repo's CI, which now gates every future PR on cross-pack reference resolution, asset
ownership and hooks-exactly-once, with total reversibility (revert before tagging, or revert plus
tag/release deletion after). **Nothing from the review was dropped:** the architect's escalation —
**cross-department agent-referral degradation is unspecified** — is now a **parked PROPOSAL** in
`kai/initiatives/pack-split/backlog.md` for `principal-product-manager` triage, with its promote
trigger written down and deliberately **no** item, dependency or acceptance criterion created;
N1/N2 ride with **A5** into `ci-partition-checks`; N3/N4 plus the three binding constraints (consume
`planAssets` / `HOOKS_OWNER`, route hook scripts **by declaration**, emit `hooks.json` into **core
only**) ride into `generated-pack-trees`; **P2-S1** stays parked and was not widened; and the caveat
that **two of `assetOwnershipErrors`' four arms are structurally unreachable today** is carried
forward so nobody reads today's green as a guarantee it does not yet make. **Limits stated, not
papered over:** this run had **no shell**, so byte-identity between `cb5fd029…` and the PR head and
the local suite (70-check self-test, 56/51, five-pack preview, `npm test` exit 0) remain
**operator-attested** — both re-checked mechanically at deploy steps 1 and 3, which fail closed; and
`api.github.com` returned **403** partway through paging the PR file list, so 6 of 15 filenames were
re-derived directly and 9 rest on the declared `touches` plus count agreement, which deploy step 1
converts into a `git diff --name-only` check that fails on any extra path. **Ship record:**
`kai/library/releases/2026-08-25/02-ship-pack-split-crosspack-validator/ship-record.md` — at its canonical library path,
with the final move into `…/02-ship-pack-split-crosspack-validator/ship-record.md` as **deploy
step 2** (the file tool cannot create a directory without a shell), which keeps it inside the same
records commit so **no post-ship reconciliation is owed**, unlike the `0.58.0` record. **Milestone
`dependency-guarantees` is unchanged at 2 of 5 required items `shipped`** — `release-ready` is not
`shipped`: `pack-split-ci-partition-checks` still requires this item at `shipped` and stays
non-dispatchable, and `pack-split-degraded-refusal` still overlaps it on `scripts/lib/pack-plan.mjs`
and `scripts/validate-plugin.mjs` as **live surface movement**. **Next: `@operator`** — run the
recorded deploy steps (verify identity + file set, move the record, commit/push and re-check green,
squash-merge #156, watch `main`, tag and release `v0.60.0` claiming **CI validation only**), then
return the deployment evidence so `workflow-ship` can run CONFIRM-START and CONFIRM-COMPLETE.
