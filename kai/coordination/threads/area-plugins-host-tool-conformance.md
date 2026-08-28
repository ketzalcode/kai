# Thread — area-plugins-host-tool-conformance

Append-only communication log mirroring
`kai/coordination/items/area-plugins-host-tool-conformance.md`. Never edited
after the fact — only appended. See `kai-core-work-coordination`.

Predecessor thread: `kai/coordination/threads/area-plugins-tool-allowlist-fix.md`
(the DIAGNOSIS of 2026-08-27-2138, which this item was created to act on).

---

## DESIGN 2026-08-27-2205 — principal-swe-infra

**Lease verified before any state-changing write.** Record read at start of pass:
`version: 1`, `lease.holder: principal-swe-infra`,
`lease.token: apx-probe-20260827-2200-p2`, `lease.version_at_grant: 1`,
`lease.expires: 2026-08-28-0100`. All four match the dispatch grant. **No
collision.** Re-verified immediately before the item write below.

**Clock note.** This session's own clock read `2026-08-27T21:57` at turn start;
the dispatch's lease clock reads `-2200`. Timestamps in this record follow the
lease clock so the sequence stays monotonic. Flagged rather than silently
reconciled.

**Environment limit, stated up front because it is also evidence.** No shell.
`node`, `npm`, `git`, `gh`, `copilot` cannot be executed. **The probe designed
here was not run and cannot be run by any role in this repo.** Every
execution-dependent statement is `reported` or `specified`. Only first-hand file
reads are `observed`.

**Files written this pass — three, and only three:**

- `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md` (the canonical design)
- `kai/coordination/threads/area-plugins-host-tool-conformance.md` (this file)
- `kai/coordination/items/area-plugins-host-tool-conformance.md` (state, below)

**No `agents/**`, `packs/**`, `skills/**`, `plugin.json`, `scripts/lib/loader-contract.mjs`,
or any existing script was edited**, per the dispatch STOP CONDITION. The item's
`touches` is narrowed below to exactly these three paths.

---

### 1. What the new evidence changes

The operator's documented vocabulary (§1.1 of the design, recorded verbatim
there) and the live CLI's warnings **disagree about the same system**: `edit` is
a documented PRIMARY alias and `Grep` a documented COMPATIBLE alias, and the live
binary warns on both spellings while the runtime keeps granting them.

That vindicates the prior diagnosis — warned set and broken set are disjoint —
and supplies the mechanism. It does **not** settle the question that decides the
fix, which is unchanged:

> Is the allowlist additive over a host-granted base set, or does it gate — and
> does the answer differ between a directly launched agent and a `task`-delegated
> one?

CHANGELOG 0.63.1 already proves the two launch paths differ for `skill`. If that
generalizes, deleting `create` from 49 agents strips file creation **on the
delegated path** even where the direct path base-grants it. **A probe that tests
only direct launch would measure the case that does not matter and miss the one
that does.** That is why the run matrix carries both launch modes on every row.

### 2. The probe, in brief

`scripts/host-tool-probe.mjs` (I/O shell) + `scripts/lib/tool-conformance.mjs`
(pure classification core). Specified in full — path, argv, output schema, exit
codes, eight named self-test assertions — in the design artifact §4.

- **Two channels that never merge.** CHANNEL A reads the host's validator
  warnings off stderr. CHANNEL B proves runtime grants by **out-of-band
  filesystem side effects** the harness verifies itself (unguessable nonces,
  sentinel writes, a hidden search needle, a shell-only value, a nested delegate
  report). An agent listing its own tools is a model-graded claim and is recorded
  **separately** as `self_reported`; where the two disagree, the disagreement is
  recorded and **not resolved by the harness**.
- **`warned AND granted` is a first-class result**, surfaced by name in
  `findings.warned_and_granted`. The single most important self-test assertion
  exists to prove the schema cannot collapse the two axes — that collapse is the
  defect that would otherwise repeat.
- **`unobserved` is never rendered as `absent`.** Silence is not evidence of
  denial. Same honesty rule `workspace-doctor --migration-check` already enforces
  with `unknown` never reported as `clear`; the probe reuses its `0/1/3` exit
  convention for the same reason.
- **Coverage:** all 7 primary aliases; each compatible-alias family in its own
  run; the 15–16 identifiers the repo declares today; and a deliberate bogus
  control (`kai-not-a-tool`, `zzz_bogus_42`) that must warn while a real tool
  declared alongside it still works — which is how "unrecognized names are
  ignored" becomes **measured on the live binary** rather than quoted.
  `--deep` adds one run per single identifier for clean attribution.
- **Safety.** Everything the host touches is a `mkdtemp` tree removed on exit: a
  throwaway plugin dir (never installed) and a scratch workspace **outside**
  `C:\src\kai`, so the probe agent cannot false-pass by reading the real
  `skills/*/SKILL.md` — the exact false-pass 0.63.1 called out. `--plan` prints
  the full run matrix and the exact `copilot` argv **without spawning anything**.
  Plan before apply. Read-only over the repo is proven by a before/after
  byte-snapshot assertion, not promised.
- **Redaction is a self-test assertion, not a habit.** The committed baseline is
  built from live CLI transcripts, which are exactly where an auth token or a
  user's absolute home path leaks into a public repo.

### 3. Where it lives, and the `packs/` check the dispatch demanded

**Checked, with evidence.** `scripts/` is mirrored into `packs/` **selectively and
by reference only**: `scripts/lib/pack-plan.mjs:869-872` matches top-level
`scripts/<name>.<ext>` **inside agent and skill bodies only**
(`collectReferences`, `:973`), and `planAssetClosure` (`:1172`) copies each
referenced entry point plus its import closure. On disk `packs/**/scripts/` holds
exactly 15 files, and `validate-plugin.mjs`, `pack-preview.mjs`,
`release-guard.mjs`, `host-contract.mjs`, `check-syntax.mjs` appear in **none** of
them — build-internal scripts stay out.

**So the probe is not published to any pack, subject to one invariant that is one
careless sentence away from being violated:**

> **No `agents/**` or `skills/**` body may ever contain the literal string
> `scripts/host-tool-probe.mjs`.** Naming it in a shipped body turns it into a
> routed asset and publishes it. Document it in `test/README.md` and
> `docs/reference/plugin-structure.md`, which are not scanned.

**Two consequences stated plainly rather than glossed:**

1. `scripts/` is behavior-sensitive to `release-guard.mjs:20`, so the PR that adds
   the probe **must** carry a version bump + CHANGELOG + README status-stamp
   consistency. Correct, not an obstacle: `plugin.json` still ships the repo root,
   so a direct `OWNER/REPO` install copies the file (inert — only `agents/` and
   `skills/` load). It reaches no marketplace pack.
2. `check-syntax.mjs:39` collects every `.mjs` under `scripts/` recursively, so
   the new files enter a `node --check` gate the moment they exist.

Rejected alternatives: `test/` (release-guard-exempt but silently loses the parse
gate; no executable convention exists there) and a new top-level `tools/`
(invents a directory the repo does not have).

### 4. Ruling — `tools: ['*']` and omission vs least privilege: **both rejected**

Four reasons, in the design artifact §5 in full. The two that decide it:

- **`*` is not in the documented vocabulary**, and the documented rule is that
  unrecognized names are **ignored**. So `tools: ["*"]` most plausibly parses as
  one ignored unknown, leaving an **effectively empty declared allowlist** — and
  on the delegated path, where 0.63.1 established an agent receives *only* its
  declared tools, the plain reading is that it receives **nothing**. Rolling
  `['*']` across 56 agents is a plausible silent, total capability wipe on the
  path this repo actually runs on. `R1` in the run matrix exists solely to test
  this. Until it returns, the worst case is catastrophic and the best case is a
  quieter log.
- **Least privilege here is a designed boundary, not a slogan.**
  `validate-plugin.mjs:237-241` records `principal-ai-researcher` and
  `principal-ai-applied-engineer` as holding **no shell by design**. A wildcard
  erases that reviewed boundary and hands a shell to two agents documented as not
  having one. Omission additionally goes dark on `requires_tools` enforcement,
  the capability-loss disclosure rule, and any audit of what a dispatched agent
  may do inside a user's repository.

**On whether the loader contract should stop rejecting a missing `tools:` key and
an empty array — no. Keep both rejections; change only what they claim.** They
are correct as kai's *authoring* rules and wrong as statements about the host
(whose own built-in agent types carry no frontmatter at all). Reframe from *"the
host would reject this"* to *"kai requires an explicit, non-empty allowlist —
least privilege is declared, not inherited."* Comment-and-message only, zero
behaviour change, and it is what keeps the ruling above enforceable rather than
merely recommended. `*` is **not** added to `SUPPORTED_TOOLS`.

### 5. The loader-contract correction

`scripts/lib/loader-contract.mjs:3-4` claims to be *"the single source of truth
for how a Copilot host parses and accepts an agent/skill's frontmatter."* It
structurally cannot be, and that sentence is what turned an unmeasured list into a
CI-enforced certainty — the reason a 112-file rename looked reasonable.

**New finding this pass: the false claim ships.** `packs/kai-core/scripts/lib/
loader-contract.mjs` exists because `scripts/generate-catalog.mjs` is a
body-referenced asset and the contract is inside its import closure (`observed`:
`packs/kai-core/scripts/generate-catalog.mjs:23`). The sentence is **published
inside the `kai-core` plugin** that every department pack requires. That raises it
from a tidy-up to a correctness fix.

Exact replacement text for the header, the `SUPPORTED_TOOLS` preamble, and the
rejection message is in design artifact §6.2. **Coupled edit the next pass must
not miss:** `scripts/host-contract.mjs:179` asserts the rejection reason with
`re: /unsupported tool/i` — change the message without that regex and
`npm run host-contract` goes red. `observed`, not predicted.

**Ruling on `SUPPORTED_TOOLS` — labelled lint heuristic now, measured provenance
incrementally.** Calling it "measured-evidence-backed" today would be a false
claim of a different kind, because nothing has been measured yet. Ladder: (1)
label it a lint heuristic and stop the message asserting host behaviour — the
minimum, and not optional; (2) after the first probe run, annotate each entry
`measured: CLI <version>, <date>, <run>` or `assumed: never measured`, still a
comment, still zero behaviour change, but now a **dated** claim that can go stale
visibly; (3) fail `validate-plugin` on `assumed`/stale entries — **adds a gate,
`expands-scope`, PROPOSAL only**.

The third copy is **generated**, not a third source of truth: one hand edit, one
`pack-preview --write`, one `--check` parity run.

### 6. The follow-on replacement PR — specified, not executed

**Expand / migrate / contract**, because a single 214-file PR is unreviewable,
unrevertible in parts, and can be **green and wrong** (both halves regenerate from
the same root, so a mistaken root edit reproduces faithfully into the mirror and
byte parity is *satisfied* — parity proves the generator ran, not that the content
is right):

```text
PR-A1 EXPAND    SUPPORTED_TOOLS accepts BOTH spellings + the §6.2 correction
     (small)    + the probe + fixtures + package.json wiring + version/CHANGELOG.
                ZERO declaration changes.  0 agent bodies touched.
PR-A2 MIGRATE   56 root agents + 56 regenerated mirrors (112 files) + disclosure.
PR-A3 MIGRATE   51 root skills + 51 regenerated mirrors (102 files) + disclosure.
PR-A4 CONTRACT  remove retired spellings; only now can CI catch a regression.
```

Surface is **214** declaration files, not 112. Each step is independently green
and independently revertible.

**The branch is chosen by the probe, not by the documentation** — the two
disagree, which is the whole point:

- `warning_free_spelling_exists: true` → **B1**, migrate (PR-A1..A4).
- `warning_free_spelling_exists: false` → **B2**, **PR-A1 only**, zero declaration
  changes; warnings documented as benign with evidence, CHANGELOG entry in the
  style of 0.49.1/0.63.1, upstream CLI bug filed.
- `delegation_differs: true` with the delegated path granting only declared tools
  → **B3**, migrate, every token **replaced never deleted**, any token with no
  accepted replacement is a hard stop to the steward.

**Said out loud because it changes what "warning-free" can mean:** if the live
binary warns on `edit`, a documented primary alias, there may be **no spelling
that is both warning-free and documented-correct**. B2 contradicts milestone 0's
committed Outcome ("the repeated runtime warnings … stop"), so it is a steward
re-scope, not something to write into a diff — PROPOSAL-2 on the predecessor
thread remains live and unanswered.

**Per-agent capability-loss disclosure rule** (design §7.3) binds whichever branch
runs: one row per agent per token; `replaced -> X` / `removed, retained (evidence:
<probe run id>)` / `removed, CAPABILITY LOST: <behaviour>`; any third-class row
stops the PR; every "granted anyway" claim cites a **`grant_delegated`** value,
not a `grant_direct` one. **CI cannot catch a capability loss here** —
`requires_tools` guards only `[bash, shell]` across six skills — so the disclosure
table is the only guard, and the PR body must say so.

**Ordering constraint against milestone 2's PR-3 (49-agent-body rewrite): binding
and unchanged.** Two whole-fleet rewrites must not be in flight together —
`pack-preview --check` is a single boolean over byte parity, and with two rewrites
red names the file but not the cause, while green-and-wrong is worse than red.
**Scheduling consequence:** under B2 this item touches zero agent bodies, the
collision dissolves, and milestone 2 unblocks early. Contingent on the probe, not
on preference.

### 7. Why the probe was specified rather than authored

Purely additive files, not on the STOP CONDITION's forbidden list — so the
argument for authoring now is real. It loses on three counts:

1. The moment the file exists it is inside three gates I cannot run —
   `check-syntax` (`node --check`, automatic under `scripts/`), `release-guard`
   (behavior path → version bump), and `npm test` once `--self-test` is wired in.
   Committing code into gates I cannot execute is "apply without a plan" with the
   labels swapped.
2. The self-test needs committed fixture transcripts, and a realistic transcript
   is a recording of a host I have never run. Fabricating one and asserting
   against it yields a self-test that proves my imagination is self-consistent.
3. `principal-swe-architect` independent-architecture review is owed on this
   design. A verdict that changes the run matrix or the schema after the code is
   written wastes the write.

The design is written to be implemented **mechanically**: exact paths, argv,
schema, exit codes, and eight named assertions. The fixtures come from a **real**
transcript the operator captures.

---

## PROPOSAL 2026-08-27-2205 — principal-swe-infra -> @operator / principal-product-manager

**PROPOSAL-4 — `--check` as a required CI gate is `expands-scope`.** It is the
only check that would have caught this defect before a user did, and it needs a
CLI binary and credentials in CI — a genuine cost `test/README.md` already books
as a follow-up under #33. Named, not built.

**PROPOSAL-5 — failing `validate-plugin` on `assumed` or stale `SUPPORTED_TOOLS`
provenance is `expands-scope`.** Step 3 of the §6.3 ladder. Adds a gate. Steps 1
and 2 are comments and are in scope; step 3 is the operator's call to fund.

**PROPOSAL-2 (carried forward, still open).** If the probe returns
`warning_free_spelling_exists: false`, the correct engineering answer is that the
warnings **do not stop** — which contradicts milestone 0's committed Outcome. That
is the steward's to re-scope, not mine to redefine in a diff. Recommended wording
unchanged: *"the tool-vocabulary contract stops asserting unverified host
behaviour, and the warnings are documented as benign with the evidence."*

**PROPOSAL-3 (carried forward, still open).** The surface is **214** declaration
files, not 112 — 51 root skills and 51 mirrors also declare the warned tokens. An
agent-only fix leaves half the declarations defective while the acceptance box
reads satisfied. Needs a steward decision on whether skills are in this item's
scope or a follow-on. PR-A3 in §6 above assumes they are; that assumption is not
mine to ratify.

---

## QUESTION Q-area-plugins-host-tool-conformance-01 2026-08-27-2205 — principal-swe-infra -> @operator
- status: open
- kind: action
- blocking: yes
- context: The design above is complete and reviewable, but four of the item's seven acceptance criteria cannot be truthfully checked without work no role in this repo can perform. The probe is **specified, not authored** (§7 above), and it **cannot be run** — no agent in this session has a shell, so `node`, `npm`, `git`, and `copilot` are all unavailable. Separately, the item cannot legally reach `in-review`: `kai-core-work-coordination` requires a `change_ref` SHA before that state, and a shell-less session cannot produce one — `workspace-doctor` rejects an `in-review` item with no `change_ref` (proven by its own `needs-ref.md` fixture). And no branch in §7.2 of the design may be selected without a live measurement: the documentation and the live binary disagree, which is precisely what is being measured, so the docs cannot be trusted over the binary.
- ask: Two things, in order. **(1) Authorize a shell-bearing pass** to author `scripts/host-tool-probe.mjs` + `scripts/lib/tool-conformance.mjs` exactly as specified in the design artifact §4, run `npm test` and `node scripts/check-syntax.mjs`, and produce the `change_ref` SHA this item needs. Nothing in that pass touches `agents/**`, `packs/**`, or any declaration. **(2) Then run `node scripts/host-tool-probe.mjs --plan` first and read the argv** — a live-host harness should be inspected before it spawns anything — and if it looks right, run `--run` and report: `copilot --version` verbatim, the resulting `findings` block, and any run marked `valid: false`. The three fields that decide everything downstream are **`findings.warning_free_spelling_exists`** (chooses B1 vs B2), **`findings.delegation_differs`** (chooses B3 and sets the capability-loss risk), and **`findings.bogus_ignored`** (confirms or refutes the documented "unrecognized names are ignored" rule on the live binary). If `--plan` reveals the CLI has no non-interactive mode that surfaces validator warnings on stderr, stop and report that instead — it is a design input, not a failure, and §9.1 of the artifact says what to do with it. **I will not select a branch or author a rename from the documentation alone.**
- answer_by: next-dispatch

---

## HANDOFF 2026-08-27-2205 — principal-swe-infra -> principal-swe-architect / @operator

- did:       Wrote the canonical design at `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md`. Recorded the operator's documented tool vocabulary verbatim as the measurement baseline. Specified `scripts/host-tool-probe.mjs` + `scripts/lib/tool-conformance.mjs` in full — two non-collapsing measurement channels (validator warnings vs. filesystem-verified runtime grants), an 11-row run matrix run in **both** direct and `task`-delegated launch modes, a bogus control name, a machine-readable schema whose `findings.warned_and_granted` field exists specifically to express *warned AND granted*, a `0/1/3` exit convention where `unknown` is never success, a full CLI surface including a `--plan` mode that spawns nothing, and eight named self-test assertions runnable **offline with no CLI binary**. Checked the `packs/` mirroring question with evidence and stated both real consequences of living under `scripts/`. Ruled against `tools: ['*']` and omission, and ruled that the loader contract keeps rejecting a missing/empty `tools` while changing what that rejection *claims*. Specified the loader-contract correction including a coupled edit at `host-contract.mjs:179` and the finding that the false claim **ships inside `kai-core`**. Specified the follow-on replacement as a four-PR expand/migrate/contract sequence branching on the probe result, with the per-agent capability-loss disclosure rule and the binding PR-3 ordering constraint.
- state:     blocked
- needs:     **`principal-swe-architect`** for the declared `independent-architecture` review — this can and should proceed now, against the design, **before** anyone writes the probe; a verdict that changes the run matrix or the output schema after the code exists wastes the write. **`@operator`** for `Q-area-plugins-host-tool-conformance-01` (blocking): authorize a shell-bearing pass to author the probe, then run it. Separately, `principal-product-manager` (steward) still owns PROPOSAL-2 and PROPOSAL-3 from the predecessor thread; neither blocks the architect review, both block application.
- artifacts: `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md` (canonical design); this thread; `kai/coordination/items/area-plugins-host-tool-conformance.md` (v2, `blocked`, lease cleared, `touches` narrowed to the three files actually written).
- evidence:  **`observed`** — first-hand file reads at `C:\src\kai`: `scripts/lib/loader-contract.mjs:1-12,14-28,83-89,94`; `scripts/host-contract.mjs:26,175-182`; `scripts/lib/pack-plan.mjs:869-872,973,1073,1172`; `scripts/release-guard.mjs:20`; `scripts/check-syntax.mjs:39`; `scripts/validate-plugin.mjs:237-241,648-672,836-838`; `packs/**/scripts/` = 15 files with the five build-internal guards absent from all of them; `packs/kai-core/scripts/generate-catalog.mjs:23`; `package.json`; `plugin.json`; `.github/plugin/marketplace.json`; `test/README.md:41-45` and its host-backed-checks section; CHANGELOG `[0.49.1]` and `[0.63.1]`. **`reported`, not observed** — the documented alias vocabulary and the "unrecognized names are ignored" rule (no web tool bound this session); the live CLI's warnings on `create`/`edit`/`grep` with capability retained. **`not run`** — `npm test`, `pack-preview --check`/`--gate`, `validate-plugin`, `host-contract`, `release-guard`, `check-syntax`, and the probe itself. No shell.
- questions: `Q-area-plugins-host-tool-conformance-01` (open, blocking, kind `action`, -> `@operator`).
- next:      `principal-swe-architect` reviews the design now. `@operator` answers `Q-...-01`, which unblocks authoring the probe and producing a `change_ref`. Only then can the item move toward `in-review`, and only after a live run can a branch in §7.2 be selected. **Nothing in `agents/**` or `packs/**` is edited until that measurement exists** — and the milestone-2 PR-3 ordering constraint holds until the branch is known.

---

## NOTE 2026-08-27-2205 — principal-swe-infra — `touches` narrowed

The item's `touches` is narrowed from five paths to the **three actually
written** this pass. `scripts/host-contract.mjs` and
`scripts/lib/loader-contract.mjs` are removed.

**Consequence, stated because narrowing a reservation is not free:** those two
paths are no longer protected by this item's lease. The pass that applies the
§6.2 correction **must widen `touches` again before editing them**, and must
include `scripts/host-contract.mjs` (the `:179` regex coupling) and the
`packs/kai-core` regeneration in the same change. Parallel siblings
(`principal-swe-architect` on `area-plugins-taxonomy-round-3`,
`principal-product-manager` on the north star) touch none of these paths, so no
overlap is live today.

---

## DOD SELF-CHECK 2026-08-27-2205 — principal-swe-infra

`kai-core-definition-of-done`, six dimensions, run against **this design pass**
(not against the item, which is nowhere near release). Verdict: **BOUNCE — two
Gaps, both known and both owned.** Recorded rather than skipped, because a
dimension nobody ran is its own failure.

| # | dimension | verdict | basis |
|---|---|---|---|
| 1 | **scope-true** | **Clear** | Three files written, all three in the item's `touches`. Nothing under `agents/**`, `packs/**`, `skills/**`, `plugin.json`, or any existing script was edited. Everything scope-expanding was routed as PROPOSAL-4 / PROPOSAL-5 and classified in design §8, not smuggled into a diff. |
| 2 | **verified** | **Gap** | Nothing was executed. `npm test`, `check-syntax`, `pack-preview --check`, and the probe itself were **not run** — no shell. The probe is specified, not built, so there is nothing to verify yet. **Owner:** a shell-bearing pass, gated on `Q-...-01` part (1). |
| 3 | **reviewed** | **Gap** | `review_requirements` names `principal-swe-architect` / `independent-architecture`; `completed_reviews` is empty. **Owner:** `principal-swe-architect`, and the review should run **now, on the design**, not after the code exists. |
| 4 | **shippable-safely** | **Clear (for this pass)** | The pass is three markdown files — blast radius nil, rollback is `git revert`. The *designed* rollout carries its own reversibility story proportional to a real blast radius: `--plan` before `--run`; temp-tree-only execution with nothing to roll back; a four-PR expand/migrate/contract sequence where each step is independently green and independently revertible; and the binding PR-3 ordering constraint that keeps two whole-fleet rewrites out of flight together. |
| 5 | **documented** | **Clear** | The canonical design is at the item's declared `artifact_target`; the working record is this thread; the decisions README already carries the row. **Not promoted to `kai/library/`** — deliberately, per `kai-core-workspace-conventions`: this is an initiative-local decision about one host's behaviour on one build, not a durable reusable pattern. Revisit after the probe returns real measurements. |
| 6 | **coordination-closed** | **Clear** | Item record current at v2, lease cleared on all five fields, `touches` narrowed to what was written, state and `next_role` truthful, HANDOFF on this thread, and the one open question is declared in `waiting_on_questions` rather than left implicit. Two carried-forward proposals (PROPOSAL-2, PROPOSAL-3) are restated here rather than dropped. |

**Both Gaps are why the item is `blocked` and not `in-review`.** Neither is
waivable: dimension 2 cannot be waived on a change whose entire purpose is to
replace assertion with measurement, and dimension 3 is a declared review
requirement. Nothing here is `release-ready`, and nothing here is `shipped` —
`shipped` still requires the operator to deploy and verify.

---

## ANSWER Q-area-plugins-host-tool-conformance-01 2026-08-27-2245 — @operator -> @principal-swe-infra
- status: answered
- answer: The main shell-bearing agent is authorized to run the probe. Route implementation to `principal-swe-infra`; no separate operator action is required to author, plan, or execute the bounded temp-directory probe. The implementation must still show `--plan` before `--run` and record the live result rather than selecting a migration branch from documentation.
- lane: in-lane
- provenance: operator (direct instruction, transcribed by `principal-swe-architect`)

---

## REVIEW 2026-08-27-2245 — principal-swe-architect · independent-architecture (design)

- kind: `independent-architecture`
- phase: design
- change_ref: null
- record_revision: `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md`, revised 2026-08-27-2245 while item version 3 was leased
- verdict: **APPROVED**
- disposition: **Reshape** — retain the two-channel/two-launch-mode probe, correct the wildcard rationale, make warning-channel observability explicit, separate synthetic fixtures from live evidence, and defer baseline drift commands until evidence creates the need
- satisfies_design_gate: true
- satisfies_change_ref_gate: false

**Lease verified before the design and thread writes:** item version `3`,
holder `principal-swe-architect`, token
`apx-htc-arch-20260827-2245-r1`, `version_at_grant: 2`,
`expires: 2026-08-27-2345`. Matched. No collision.

### Decision and forces

**Decision reviewed:** whether the proposed probe is the smallest trustworthy
seam for deciding a warning-free tool spelling without erasing deliberate
agent privilege boundaries.

- Validator acceptance and runtime grants are different facts; the observed
  warned-and-working case requires two independent fields.
- Direct and delegated custom-agent launch already differ for at least one
  capability, so either launch mode alone can produce a globally wrong answer.
- The probe runs against a live host and model; self-report cannot establish a
  grant, and warning silence cannot establish validator acceptance unless a
  deliberate bogus token proves that warnings were observable.
- Raw CLI output can contain credentials and absolute user paths. It is local
  evidence, not a fixture or a commit candidate.
- This item must measure before any 214-file declaration migration. It must not
  grow into a permanent certification service or a new CI gate.

### Review results

| surface | verdict | binding revision |
|---|---|---|
| Validator-warning vs runtime-grant channels | **Endorse** | Keep independent values and `warned_and_granted`; add channel status so a missing bogus-control warning makes validator results `unobserved`, never `silent`. |
| Direct and delegated launch matrix | **Endorse** | Run every default row in both modes. Run singleton `--deep` only for tokens a migration would change; those singleton results are mandatory before that diff. |
| Safety and redaction | **Endorse after Reshape** | Temp plugin/workspace remain outside the repo; report only redacted normalized data; retain raw transcripts only in temp/local ignored evidence. `--plan` precedes `--run`. This is architecture review, not security acceptance. |
| Machine-readable schema | **Endorse after Reshape** | Keep schema/probe versions, host identity, per-run validity, independent validator/grant axes, findings, caveats, and exit `3` for unknown. Add top-level channel observability and omit temp transcript paths from normalized output. |
| Fixture strategy | **Reshape** | Pure parser/classifier fixtures are minimal and synthetic. A live transcript is integration evidence, not a unit fixture, and is never committed. |
| Smallest implementation scope | **Reshape** | First pass is the two scripts, synthetic fixtures/self-test, package wiring, the already-accepted loader-contract wording correction and its coupled assertion/generated mirror, plus release metadata forced by existing gates. Defer `--update`, `--check`, a committed live baseline, CI host execution, and every declaration edit. |

### Factual correction

Official GitHub documentation explicitly states that omitting `tools` **or**
using `tools: ["*"]` enables all available tools; `tools: []` disables all
tools. `["*"]` is not an unrecognized token. Source opened during this review:
<https://docs.github.com/en/copilot/reference/custom-agents-configuration#tools>.

The revised decision still rejects wildcard and omission **for Kai** because
both are valid broad grants that erase explicit least-privilege intent and
automatically include current and future host/MCP tools. The prior rationale
was factually wrong; the policy conclusion remains correct.

### Review binding

This approval binds to the revised **design record**, with `change_ref: null`
because no implementation exists yet. It authorizes implementation to start.
It does **not** satisfy the product-change exact-ref gate: after
`principal-swe-infra` produces a `change_ref`, architecture review confirms that
the implementation conforms to this design before release routing.

---

## HANDOFF 2026-08-27-2245 — principal-swe-architect -> principal-swe-infra

- did:       Corrected the official `tools: ["*"]` semantics and approved the revised host-tool probe design. Bound the review to the dated design revision with no implementation ref. Closed the operator-action blocker from Q-01.
- state:     `ready` (written in item version 4 after this handoff); no implementation has started
- needs:     Implement only the first-pass scope in the approved review: preserve independent validator/runtime evidence; run direct and delegated arms; enforce bogus-control observability; use synthetic classifier fixtures; redact before persistence; print `--plan` before the authorized live `--run`; produce a machine-readable report and implementation `change_ref`. Do not edit any agent/skill declaration or choose B1/B2/B3 before live evidence.
- artifacts: `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md`; `kai/coordination/items/area-plugins-host-tool-conformance.md`; `kai/coordination/threads/area-plugins-host-tool-conformance.md`
- evidence:  GitHub Docs `Custom agents configuration#tools`, fetched 2026-08-27; canonical design sections 4–5 and architecture review above. No script, plugin behavior, agent body, skill body, or generated plugin tree was edited in this review; no command was run.
- questions: none
- next:      `principal-swe-infra` — implement the approved bounded probe and loader-contract correction, then return the exact implementation `change_ref` for conformance review.

---

## MEASUREMENT 2026-08-28-0055 — director-chief-of-staff (records-only reconciliation)

The main agent implemented the probe in the working tree and **executed it**.
This entry records the observed evidence. Records-only: no script, manifest,
agent, or skill was edited by this pass, and no claim below was executed by me —
each is `reported` from the main agent's run except where the report files
themselves are cited.

### Implementation defects fixed before measurement

Each would have produced a confidently wrong result rather than an obvious
failure, which is why they are recorded rather than folded into "it works now":

1. **Qualified agent names.** Local `--plugin-dir` agents require
   `<ephemeral-plugin>:<agent>`; unqualified names exited `1`. The probe now
   qualifies selected, delegated, and helper agents. Unqualified, this would
   have read as a capability denial rather than a naming error — a false
   negative pointing straight at the wrong conclusion.
2. **Outer `--allow-all-tools`.** Added so host permission policy cannot
   masquerade as an inner agent-allowlist denial. The scratch workspace remains
   isolated. Without it, the probe would have measured the permission prompt,
   not the allowlist.
3. **`--copilot-entry <absolute versioned index.js>`.** A PATH `.cmd` shim
   reported `1.0.79` externally while `spawnSync('copilot')` still resolved the
   active `1.0.81` executable — so **version attribution was wrong before this
   fix**. Exact-version execution is now proven by `host.copilot_version` plus
   the resolved path.
4. **`--rows`** for bounded retries.

**Offline self-test: 11/11 passed.**

### Runtime channel — `observed` on BOTH 1.0.79 and 1.0.81

| row | direct | delegated | capabilities |
|---|---|---|---|
| `R2-primary` | valid | valid | read / edit / create / search / execute / agent — all exercised successfully |
| `R8-repo-current` | valid | valid | same set, exercised successfully |
| `R9-control` | valid | — | `read` + `search` worked; `write` / `execute` / `agent` did not |

`R9-control` behaved exactly as "only `read` plus bogus names are effective"
predicts, which confirms the documented **"unrecognized names are ignored"**
rule against the live binary in both directions rather than accepting it from
documentation.

### Validator channel — `unobserved`, and deliberately not upgraded

Neither noninteractive prompt path emitted validator warnings, **including for
the bogus controls**. Prompt mode cannot reproduce the interactive startup
warning surface.

This is recorded as `unobserved` — **not** as "no warnings occur." The
user-reported interactive-startup warning **remains real and is not refuted by
this run**. The two-channel design exists precisely to stop a channel that
cannot see anything from being reported as clean, and here it did its job.

### What the evidence supports

The official primary aliases are **runtime-safe on both `1.0.79` and `1.0.81`**.
Absence of interactive warnings is **not** claimed. Branch selection (B1/B2/B3)
still requires the validator channel, which remains unobserved.

### Reports — retained, not committed

`host-tool-probe-targeted-1.0.81.json` (current) and
`host-tool-probe-targeted-1.0.79.json` (retained; launched through
`<redacted>/1.0.79/index.js`, report self-identifying CLI `1.0.79`). Both are
session files. **No live baseline is
committed**, preserving the design's separation of synthetic parser fixtures
from live host evidence.

Full runs showed occasional model/delegated transcript timeout and truncation;
bounded `--rows` retries collect the missing evidence without relaunching the
full matrix.

### Correction of a superseded statement in this thread

Line 139 of this thread states "`*` is not in the documented vocabulary." That
is **wrong** and was written during the design pass, which had no web tool
bound. Official documentation supports `tools: ["*"]` and omission as *enable
all available tools*, and `tools: []` as *disable all tools*. The architecture
review already corrected this at line 422 of this thread and in §5 of the
decision artifact.

**Kai's rejection of `["*"]` and omission stands unchanged** — as a deliberate
least-privilege policy for autonomously dispatched agents, never as a claim that
the host fails to recognize the token. Line 139 is **not rewritten**: this
thread is the audit trail, and deleting a superseded claim would conceal that
the correction happened.

### State

`blocked -> in-progress`; `Q-area-plugins-tool-allowlist-fix-01` answered by
measurement; `waiting_on_questions` empty. `change_ref` stays `null` because the
working tree is **uncommitted**, so the declared exact-ref architecture review
has nothing to bind to. `next_role: principal-swe-architect`, **dispatch gated
on the main agent producing a commit SHA**.

---

## HANDOFF 2026-08-28-0055 — director-chief-of-staff -> principal-swe-architect (gated)

- did:       Records-only reconciliation of the executed probe. Recorded four pre-measurement implementation fixes, the 11/11 offline self-test, the observed runtime results across two CLI versions, and the honestly-unobserved validator channel. Cleared the operator blocker on this item and on `area-plugins-tool-allowlist-fix`. Re-asserted the wildcard correction and left the superseded line 139 intact as audit history. No script, manifest, agent, or skill was edited.
- state:     in-progress (not `in-review` — no `change_ref` exists yet)
- needs:     **Exact-ref architecture conformance review**, confirming the implemented probe matches the approved design. Blocked until the main agent commits the working tree and a `change_ref` SHA exists; the recorded design review carries `satisfies_requirement: false` and `requires_exact_ref_confirmation: true`, so it cannot stand in for this.
- artifacts: `kai/coordination/items/area-plugins-host-tool-conformance.md` (v9); `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md`; `kai/initiatives/area-plugins/log.md`
- evidence:  `reported` from the main agent's run — the two session reports, the 11/11 offline self-test, and the per-row runtime outcomes. `observed` by this pass — only the coordination records themselves. Nothing was executed here; no gate, `npm test`, or parity check has been run in any director session.
- questions: none blocking.
- next:      `principal-swe-architect`, on the commit SHA. The validator channel remains `unobserved`, so **no B1/B2/B3 branch may be selected and no declaration migration authored** on this evidence alone.

---

## EVIDENCE ADDENDUM 2026-08-27-2245 — principal-swe-architect

The architecture review was grounded directly in the current seams, not only
the submitted design:

- `scripts/lib/loader-contract.mjs:1-17,75-99` — the external-host
  source-of-truth claim, hand-maintained vocabulary, and Kai's current
  missing/empty/unsupported checks.
- `scripts/host-contract.mjs:1-17,175-199` — explicitly a deterministic host
  mirror, plus the `/unsupported tool/i` fixture coupling.
- `scripts/validate-plugin.mjs:237-241,648-672,836-838` — the two intentional
  no-shell agents, `requires_tools` enforcement, and shared allowlist seam.
- `scripts/lib/pack-plan.mjs:869-872,973` — only top-level script references in
  shipped agent/skill bodies enter asset closure.
- `scripts/release-guard.mjs:17-27` and `package.json` — `scripts/` is already
  behavior-sensitive and the existing test chain is the right home for the
  offline self-test.

All were file reads. No executable validation was run because this review
changed records only.

---

## IMPLEMENTATION 2026-08-27-2251 — principal-swe-infra

**Lease:** self-granted from item version 4 as
`htc-20260827-2251-i1`; the current holder/token/version were re-read during the
pass. No competing lease or overlapping in-progress item was observed.

### Authored

- Added `scripts/host-tool-probe.mjs` and the pure
  `scripts/lib/tool-conformance.mjs`.
- Added synthetic fixtures under `test/fixtures/host-tool-probe/`. No live
  transcript or baseline is committed.
- Added deterministic machine JSON, explicit validator/runtime channels,
  direct/delegated rows R0-R9, optional singleton `--deep` rows, bogus-control
  observability, side-effect-backed grants, redaction before persistence,
  fail-closed `0/1/3` exits, and repository-content snapshots around live runs.
- The live harness creates one throwaway plugin and workspace per invocation
  under the OS temp root, uses `--plugin-dir` without installing anything,
  strips credential-bearing environment variables, and removes scratch state
  unless `--keep-temp` is explicit.
- Added `--plan`, `--run`, `--self-test`, and the operator-requested offline,
  explicit-path `--update` / `--check` modes. The last two postdate the 2245
  architecture review and must be included in exact-ref conformance review.
  They create no default baseline and do not run the host.
- Corrected `SUPPORTED_TOOLS` to a Kai lint heuristic, changed the coupled
  malformed-fixture assertion, and updated its generated `kai-core` mirror.
- Wired the offline self-test into `package.json` / full `npm test`; updated
  test/reference documentation; bumped `1.0.4 -> 1.0.5` across root,
  marketplace, lockfile, and expected generated pack surfaces; added CHANGELOG
  and README status entries.

### Static evidence observed in this pass

- `agents/**` and `skills/**` contain no reference to
  `scripts/host-tool-probe.mjs`; no declaration file was edited.
- No `1.0.4` version remains in root/marketplace/pack JSON version fields.
- Marketplace metadata plus all five plugin entries report `1.0.5`.
- The only generated copy of `loader-contract.mjs` remains under
  `packs/kai-core/scripts/lib/`, matching the root correction.
- The fixture directory contains synthetic classifier inputs only; no captured
  host transcript or live baseline exists.

### Execution blocker

This session exposes repository read/write/search tools but no process runner.
It cannot execute `node`, `npm`, `git`, or `copilot`. Therefore:

- `node scripts/host-tool-probe.mjs --self-test` — **not run**.
- `node scripts/host-tool-probe.mjs --plan` — **not run**; exact argv was not
  runtime-inspected.
- Live `--run` — **not attempted**, because the required plan-first check could
  not happen. No login, credential, or isolation safety rule was weakened.
- `node scripts/pack-preview.mjs --write`, `--check`, and `--gate all` —
  **not run**. The expected generated files are present but not generator-proven.
- `node scripts/check-syntax.mjs`, targeted host-contract validation, and full
  `npm test` — **not run**.
- No git `change_ref` can be produced while the requested changes remain
  uncommitted and this session has no git runner.

No live finding exists. In particular,
`warning_free_spelling_exists`, `delegation_differs`, and `bogus_ignored` remain
unknown; no B1/B2/B3 migration branch was selected.

---

## HANDOFF 2026-08-27-2251 — principal-swe-infra -> principal-swe-infra / principal-swe-architect

- did:       Authored the bounded probe implementation, classifier, synthetic fixtures, explicit offline baseline modes, loader-contract correction, package wiring, documentation, `1.0.5` release surfaces, and expected generated pack updates. Left all changes uncommitted.
- state:     `blocked` (item version 8, lease cleared); implementation exists but has no executable verification or `change_ref`
- needs:     A shell-bearing `principal-swe-infra` continuation must run `npm run host-tool-probe:self-test`, then `npm run host-tool-probe:plan` and inspect every exact argv. Only if that plan is isolated and noninteractive may it run `npm run host-tool-probe`; stop on login/credential exposure. Then run `node scripts/pack-preview.mjs --write`, `npm run pack-preview:check`, `npm run pack-preview:gate`, targeted syntax/host-contract checks, and full `npm test`. Record the redacted live findings without committing a transcript/baseline, create the implementation SHA after the main agent approves the uncommitted diff, and route that exact ref to `principal-swe-architect`.
- artifacts: `scripts/host-tool-probe.mjs`; `scripts/lib/tool-conformance.mjs`; `test/fixtures/host-tool-probe/`; `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md`; this thread; item version 8
- evidence:  Static file reads/searches listed in the implementation record above. All executable checks and the live result are explicitly `not run`; no live fixture was committed.
- questions: none — this is an execution-capability blocker, not a decision for `@operator`
- next:      shell-bearing `principal-swe-infra` for plan-first verification and a change ref; then `principal-swe-architect` for the required exact-ref implementation conformance review

---

## REVIEW 2026-08-28-0112 — principal-swe-architect · independent-architecture (implementation)

- kind: `independent-architecture`
- phase: implementation
- change_ref: `4d711779408c8f675a740b5e243686d9e66a5ce4`
- verdict: **APPROVED**
- disposition: **Endorse**
- findings: P0 `0`, P1 `0`, P2 `2` — both record-only corrections applied; no implementation revision requested
- satisfies_design_gate: true
- satisfies_change_ref_gate: true
- satisfies_requirement: true

**Lease verified before every durable write:** item version `10`, holder
`principal-swe-architect`, token `htc-arch-20260828-0058-r2`,
`version_at_grant: 9`. No collision.

### Decision and forces

**Decision reviewed:** whether exact commit
`4d711779408c8f675a740b5e243686d9e66a5ce4` implements the approved bounded
host-tool evidence seam without widening agent privilege, mutating the repo, or
claiming an unobserved warning fix.

- Permission policy must not masquerade as an inner allowlist denial.
- Direct and delegated custom-agent launches must both be measured.
- Validator observations and runtime side effects must remain independent.
- Exact CLI version attribution must survive launcher-shim substitution.
- Live transcripts may contain credentials and user paths and must not become
  committed fixtures or baselines.
- This item must not alter any agent/skill declaration or select a migration
  branch while validator warnings remain unobserved.

### Conformance and trust-boundary result

Source inspection found the required qualified
`<ephemeral-plugin>:<agent>` names, outer `--allow-all-tools`, OS-temp plugin and
workspace materialization, direct/delegated loops, absolute
`--copilot-entry`, bounded `--rows`, deterministic JSON, synthetic offline
fixtures, explicit opt-in network probing, credential-variable filtering,
redaction before persistence, transcript non-retention, and repository-content
snapshots. Child-process argv is fixed and passed with `shell: false`; caller
paths are explicit local CLI capabilities rather than model-controlled input.
No command-injection or implicit path-escape route was found.

The exact branch ref and HEAD resolve to the reviewed SHA. No live report or
baseline is committed, package/marketplace/pack versions read `1.0.5`, and the
root/generated loader-contract wording matches. Full `npm test` before the
commit, including generated parity, is **reported operator evidence** and was
not rerun by this reviewer.

The runtime reports are classified narrowly: R2 and R8 exercised
read/edit/create/search/execute/agent in direct and delegated launches on
`1.0.79` and `1.0.81`; R9 exercised only read/search and did not exercise
write/execute/agent. Validator warnings remained `unobserved`; no warning fix,
warning-free spelling, or migration branch is claimed.

### P2 corrections applied

1. Durable records had copied an absolute user-home path from session evidence.
   Canonical item/decision records now use
   `<redacted>/1.0.79/index.js`, preserving version attribution without
   environment disclosure.
2. The records said R9 independently confirmed ignored-name semantics despite
   `findings.bogus_ignored: null`, and called R8 a 15-name set despite listing
   16. R9 is now runtime corroboration only, and R8 is counted as 16.

`tools: ["*"]` is officially supported as an all-tools grant. Kai's rejection
is correctly retained as least-privilege policy, not parser compatibility.

---

## HANDOFF 2026-08-28-0112 — principal-swe-architect -> workflow-ship / main agent
- did:       Approved exact-ref architecture conformance for `4d711779408c8f675a740b5e243686d9e66a5ce4`; applied two record-only P2 corrections; changed no implementation code.
- state:     `in-review`; required implementation review complete at the exact `change_ref`
- needs:     Open/update the PR, run fresh required CI at the PR head, verify only records changed after the reviewed ref, then prepare publication. Do not claim shipped before human deployment/publication and verification.
- artifacts: `kai/coordination/items/area-plugins-host-tool-conformance.md`; `kai/coordination/threads/area-plugins-host-tool-conformance.md`; `kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md`; `kai/initiatives/area-plugins/log.md`
- evidence:  source inspection at workspace root `C:\src\kai`; branch ref `fix/192-host-tool-conformance` -> `4d711779408c8f675a740b5e243686d9e66a5ce4`; prior full `npm test` is reported operator evidence, not rerun here
- questions: none
- next:      `workflow-ship` / main agent — PR-head CI and publication preparation; initiative summary `kai/initiatives/area-plugins/log.md`, deliverable index `kai/initiatives/area-plugins/deliverables.md`
