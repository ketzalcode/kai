# Thread — area-plugins-workspace-storage-modes

Append-only communication log mirroring
`kai/coordination/items/area-plugins-workspace-storage-modes.md`. Never edited
after the fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-2113):** no agent in this session has a shell, so
`kai/initiatives/workspace-corpus-contract/` cannot be created. Until one
operator `mkdir` runs, **this thread is the durable record of the product
requirement.**

---

## DECISION 2026-08-27-2113 — principal-product-manager (steward) — PRODUCT REQUIREMENT AND HONESTY CONSTRAINT

Binding **product** requirement for operator concern **#6**. Per the operator's
own instruction, this record states *what must be true* and **routes the
mechanism to `principal-swe-infra`**. I do not design `.gitignore` blocks, doctor
internals, manifest schema, or migration commands here, and a reviewer should
treat any such specificity in a later record as infra's call, not mine.

### 0. Grounding — the opt-out already exists. That changes what the P0 is.

The operator's framing is *"kai creates a TRACKED `kai\` corpus; design an
explicit onboarding choice for repos that do not want to commit it."* Before
designing a choice, I checked whether one exists. It does, end to end:

| location | what exists today |
|---|---|
| `kai-core-workspace-conventions/SKILL.md:151,164,541-544` | `corpus_visibility: "committed" \| "local"` in the manifest schema; `local` keeps identical paths but ignores `/kai/` and `/.kai/` entirely. |
| `kai-core-workspace-onboarding/SKILL.md:301-330` | Detect-then-ask procedure; the answer is recorded **only when the operator gives it**, because "absence already means `committed`" and writing an unchosen value would make a guess indistinguishable from a decision. |
| `kai-core-workspace-onboarding/SKILL.md:467-490` | Under `local`, two extra ignore lines, and **every ignore verification inverts** and must be checked explicitly. |
| `workflow-workspace-init.agent.md:51,77,94,147,184` | Resolves the mode, reports how it was decided, and names the remote any inference came from. |
| `scripts/workspace-doctor.mjs:140-142,386-415` | Validates the value; under `local`, detects kai paths **still tracked by git**, unignored paths, and non-git worktrees — with self-tests, including that an *absent* value stays healthy. |
| `.kai/manifest.json` (this workspace) | `"corpus_visibility": "committed"` |

**So the P0 is not "build an opt-out."** It is narrower, sharper, and more
honest: **the choice is not always offered, and the switch is not safe.** Both
are real, both are grounded, and neither needs a new subsystem.

Five requirements. Each says whether today's implementation **already meets**,
**partially meets**, or **misses** it.

---

### R1 — The choice is always explicit. *(partially met)*

`kai-core-workspace-onboarding:301-330` step 4 reads: *"If the repository is
**private**, use `committed` and do not ask."*

That inference is the gap the operator felt. **Private is not a proxy for "the
team wants kai's records in their diffs."** A private repository with four
collaborators is exactly the case where an unexpected tracked `kai/` corpus turns
up in someone else's PR review — and where the person who ran onboarding was
never asked and does not remember choosing.

> **Requirement.** In every repository-mode onboarding, the storage mode is
> either **asked** or **reported as an inference the operator can reverse in one
> step**, naming the exact basis for the inference. A mode that is never surfaced
> is not a decision, it is a default wearing a decision's clothes.

Inference may stay for the private case — asking every private repo would be
nagging, and the current design's reasoning about not writing an unchosen value
is sound and should be preserved. What may not stay is inferring *silently*. The
onboarding report must state the mode, the basis, and the one-step reversal.

### R2 — Both branches state their real cost. Neither is the safe default. *(partially met)*

The existing skill already reframes the question well — *"The question is not
'public or private' — it is who the corpus is for"* — which is the right frame
and should be kept verbatim. What must be tightened is the **cost** half.

> **Requirement.** Both branches are presented with their real, named cost:
>
> - **`committed`** — coordination survives clones, machines, and collaborators.
>   **Cost:** every kai record appears in `git status`, in diffs, and in PR
>   reviews, and is published wherever the repository is published.
> - **`local`** — nothing kai writes leaves this checkout. **Cost:** a fresh
>   clone has no coordination state, no initiative history, and no board.
>   **Durable coordination narrows to one machine** — leases, handoffs,
>   dependency edges, and shipped-state evidence do not survive re-cloning and
>   are invisible to a second collaborator.

> **HONESTY CONSTRAINT (binding, not advisory).** **Neither branch may be
> presented as the safe, recommended, or default choice.** `local` is not
> "safer" — it trades team durability for privacy, and that trade must be named
> in the same breath as the privacy benefit. `committed` is not "correct" — it
> publishes the maintainer's working state. Any copy that leads with one option,
> pre-selects one, or describes only one option's cost violates this constraint
> and fails scope-acceptance.

This is the same discipline the `area-plugins` initiative applies to standalone
mode: two honest paths, never a silent third, and never a path presented as the
one a sensible person picks.

### R3 — Switching modes must never silently discard durable records. *(missed — and this is the sharpest defect)*

`scripts/workspace-doctor.mjs:406` currently remediates a `committed -> local`
switch with:

> *"corpus_visibility is 'local' but N kai path(s) are tracked by git …;
> ignoring a path does not untrack it, so this state is still committable.
> Untrack them (`git rm --cached`) or record corpus_visibility 'committed'."*

The diagnosis is exactly right and the mechanism honesty is admirable — ignoring
is not untracking, and the doctor says so. **But `git rm --cached`, followed
literally and committed, removes the corpus from `HEAD` for every other clone.**
The operator's own instruction — *never silently discard durable records* — is
violated not by kai writing bad code, but by kai offering a destructive
operation as a tidy-up step. The files survive locally, which is precisely what
makes the loss quiet: the person who ran it still sees them.

> **Requirement.** Both switch directions have a documented, verified,
> non-destructive path:
>
> 1. **Enumerate before acting.** State exactly how many records will stop being
>    shared, which they are, and **who loses access** (collaborators, other
>    clones, CI).
> 2. **Explicit operator confirmation naming the count.** Not a yes/no on an
>    abstraction — a confirmation that names what is being unshared.
> 3. **No doctor remediation proposes a destructive git operation without that
>    confirmation.** A doctor may *diagnose* freely; a remediation step that
>    removes shared history must route through the confirmation.
> 4. **Files always remain on disk**, in every direction, in every case.
> 5. **`local -> committed` warns too**, in the opposite direction: previously
>    private records become published on the next push, and some of them
>    (`kai/coordination/threads/**` in particular) contain verbatim operator
>    conversation. That direction is *more* dangerous than the one the doctor
>    currently guards, and it is currently unguarded.

### R4 — Hybrid: **defer.** Two modes stand. *(steward ruling)*

The operator asked me to define tracked / local-private / hybrid *"if
justified."* My ruling is that hybrid is **not** justified now, and the reason is
the same constraint the operator set:

**A per-lane hybrid splits the record graph.** Item records reference initiative
artifacts and initiative artifacts reference item records; `deliverables.md`
points at `artifact_target`s; threads cite other threads across initiatives.
Commit `kai/initiatives/` while keeping `kai/coordination/` local and a fresh
clone gets an initiative whose every decision link dangles. That is a silent
durable-record loss wearing a tidier hat — the exact failure R3 exists to
prevent — and it is *harder* to detect than the `git rm --cached` case because
nothing errors; the links merely resolve to nothing on a machine that is not the
author's.

> **Deferred with a trigger.** Revisit if an operator produces a concrete case
> where the **entire** corpus is unacceptable to commit but the initiative record
> alone is acceptable — i.e. evidence that the binary choice forced `local` and
> cost them team durability they actually wanted. A preference for a smaller
> diff is not that evidence.

**And here is the finding that matters more than the mode.** The pressure toward
a hybrid is mostly *noise*, not *privacy*. Right now **61% of
`kai/coordination/items/`, 64% of `kai/coordination/threads/`, and 64% of
`BOARD.md`** belong to `pack-split`, an initiative that shipped and closed. A
maintainer looking at that and reaching for "keep coordination local" is
reacting to volume, not to publication.

**Therefore: `area-plugins-initiative-archive` (priority 10) is ranked ahead of
this item (priority 40) deliberately.** Fix the noise first and re-ask whether
anyone still wants a hybrid. If the archive lands and the pressure persists, the
trigger above fires with real evidence behind it. If it does not persist, kai
avoided a third storage mode it would have maintained forever.

### R5 — The doctor verifies whichever mode was chosen — in both directions. *(partially met)*

`workspace-doctor` verifies `local` thoroughly (`:386-415`): tracked-path drift,
unignored paths, and an explicit warning when git is unavailable so nothing is
claimed about what a remote would receive. That is good work and the inverse is
missing.

> **Requirement.** Under `committed`, the doctor must also verify the corpus is
> actually **tracked**. An operator who recorded `committed` but whose
> `.gitignore` excludes `/kai/` believes they have team durability and does not
> have it — and unlike the `local` drift case, **nothing tells them.** That is
> the more dangerous of the two drifts, because the belief it creates is
> "handoffs survive" rather than "records are private."

Absence of the field must keep meaning `committed` and must stay healthy, exactly
as the existing self-test at `:519` asserts. Do not turn an optional field into a
required one to make a check easier.

---

### Explicitly routed to `principal-swe-infra` — mechanism, not mine

- The managed `.gitignore` block's shape under each mode.
- Manifest schema changes, if any.
- Doctor check implementation, self-tests, and severity levels.
- The switch procedure: what command or workflow performs it, how the
  confirmation is captured, how the enumeration is produced.
- Whether the `committed` tracked-verification is an error or a warning.

I am not qualified to choose those and will not pre-empt them. If a mechanism
cannot satisfy a requirement above, **return it to the steward as a QUESTION** —
do not solve it by weakening the requirement, and above all do not satisfy R2 by
picking a default for the operator.

### What this requirement deliberately does not do

- **No new storage mode.** R4.
- **No change to what `local` and `committed` mean.** The definitions at
  `kai-core-workspace-conventions:151,541-544` stand.
- **No change to `.kai/runs/` or `kai/personal/`**, which are ignored under both
  modes and stay that way.
- **No automatic mode switching**, ever, under any diagnosis.
- **No retroactive re-classification** of an existing workspace's recorded mode.

### Success measure

> Every kai workspace's storage mode was chosen or knowingly inherited, matches
> what git actually does, and can be changed without losing a record.

Falsifiable: today the mode is silently inferred in the private-remote case
(**R1 partial**), the `committed` direction is unverified (**R5 partial**), and
the documented switch path is a destructive git command with no confirmation
(**R3 missed**). Target: modes surfaced in 100% of repository-mode onboardings;
drift detected in both directions; destructive switch steps behind explicit
count-naming confirmation: 100%; records lost in a mode switch: **0**.

---

## HANDOFF 2026-08-27-2113 — principal-product-manager (steward) -> director-chief-of-staff

- did:       Authored the binding **product requirement (R1–R5) and honesty constraint** for workspace storage modes, and **routed every mechanism to `principal-swe-infra`** per the operator's instruction. Grounded it first, which materially narrowed the P0: `corpus_visibility: committed | local` already exists across the conventions skill, the onboarding skill, `workflow-workspace-init`, and `workspace-doctor` (14 references with self-tests), so the work is not "build an opt-out" but "make the choice explicit, the tradeoff honest, and the switch safe." Identified the sharpest defect — `workspace-doctor.mjs:406` remediates a mode switch with `git rm --cached`, which followed literally removes the corpus from `HEAD` for every other clone while leaving it on the author's disk, i.e. a durable-record loss that is invisible to the person who caused it. **Ruled hybrid modes DEFERRED** with a concrete reopen trigger, on the grounds that a per-lane hybrid dangles the record graph on any machine but the author's, and recorded the cross-item finding that the pressure toward a hybrid is mostly archive noise (61–64% of the live coordination surface is a shipped initiative) — which is why the archive item is ranked priority 10 and this one priority 40. Created the item at `proposed`.
- state:     proposed (item not promoted — the `workspace-corpus-contract` split needs an operator go)
- needs:     Operator go/no-go on the split, then steward promotion, then a decision record from `principal-swe-infra` answering R1–R5 with named mechanisms.
- artifacts: kai/coordination/items/area-plugins-workspace-storage-modes.md (v1, `proposed`); this thread (the product requirement).
- evidence:  Read 2026-08-27 from `C:\src\kai`. `skills/kai-core-workspace-conventions/SKILL.md:145-165,541-544`. `skills/kai-core-workspace-onboarding/SKILL.md:292-330` (detect-then-ask, incl. step 4's private-implies-committed inference) and `:460-513` (the inverted `local` verification and the deliberate non-reconciliation of the field). `agents/workflow-workspace-init.agent.md:51,77,94,147,184`. `scripts/workspace-doctor.mjs:140-142,386-415,519-559` (validation, `local` drift detection incl. the `git rm --cached` remediation at `:406`, and the self-test asserting an absent value stays healthy). `.kai/manifest.json` — `"corpus_visibility": "committed"`. `.gitignore` — the managed block, with `/.kai/runs/` and `/kai/personal/` ignored under both modes. Noise figures for the R4 finding: 23 of 38 item records, 23 of 36 threads, 23 of 36 `BOARD.md` rows are `pack-split`.
- questions: none blocking. One flagged for infra rather than the operator: whether `committed`-mode tracked-verification (R5) is an error or a warning is a mechanism call, but if it is made a warning, say why in the record — a silent belief that handoffs survive when they do not is the more dangerous drift.
- next:      `director-chief-of-staff` — put the split to the operator. On go: steward promotes, then `principal-swe-infra` authors the mechanism record against R1–R5, with the steward on scope-acceptance. The honesty constraint in R2 is the acceptance line most likely to fail; it is not negotiable downward.
