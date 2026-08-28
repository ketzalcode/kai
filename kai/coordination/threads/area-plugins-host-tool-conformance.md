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
