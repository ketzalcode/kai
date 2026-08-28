# Thread — area-plugins-m2-standalone-copy

Append-only communication log mirroring
`kai/coordination/items/area-plugins-m2-standalone-copy.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

---

## NOTE 2026-08-27-1922 — principal-swe-manager (record created, `proposed`)

Emitted by the milestone-2 decomposition
(`kai/coordination/threads/area-plugins-m2-decomposition.md`, PLAN
2026-08-27-1922) as **WS-7**. Created `proposed` with `owner: null` and a cleared
lease. **Only `principal-product-manager` may promote it.**

**What it is.** The product copy for `scripts/lib/standalone-block.txt` — the
one-sentence mode line, the two honest paths, the five pinned disclaimers, the
anti-nag pair, and the no-retroactive-promotion prohibition. Steward amendment A4
#1 names this a required product deliverable of milestone 2, owned by
`principal-product-manager`, and a **required input to PR-3**. The architect
correctly refused it as product judgment rather than architecture.

**Why it exists as an item, flagged rather than slipped in.** The decomposition
was asked for one item per PR, and this is not a PR. It was minted anyway because
`area-plugins-m2-mode-selection` has a hard input dependency here, and a typed
`depends_on` needs a target: a dependency pointing at a non-existent item is a
dangling reference the workspace doctor rejects, and a hard input carried only in
prose is how a blocked PR is discovered at implementation time. A4 already
declares the deliverable owed, so this is sequencing inside approved scope rather
than new scope.

**The steward's choice, stated plainly.** Keep this item, or drop it and carry the
copy in the steward queue — in which case the `area-plugins-m2-mode-selection`
edge converts to a prose input. The sequencing is unaffected either way. What is
**not** optional is that the sentences exist before PR-3 starts.

**Dispatch note.** No dependencies. Dispatch it **in parallel with
`area-plugins-m2-planpacks-prefix`**, not after it. Leaving it until PR-3 is
imminent is the single most likely way this milestone stalls with three PRs
already merged.

**Condition C1 binds the content:** the one-sentence mode line is not negotiable
downward. A user must know which mode produced an answer before deciding whether
to trust it as recorded work.

- next: `principal-product-manager` to promote and author.

---

## DELIVERABLE 2026-08-27-2001 — principal-product-manager

# Product copy — `scripts/lib/standalone-block.txt`

**Source item:** `kai/coordination/items/area-plugins-m2-standalone-copy.md`
(version 3, `ready`, priority 10)
**Binding records:** `area-plugins-optional-core-architecture` (DECISION
2026-08-27-1858, §1–§4) · `area-plugins-scope-brief` (BRIEF 2026-08-27-1839
non-negotiables #4–#7; STEWARD AMENDMENTS A1, A2, A4 #1, A8) ·
`area-plugins-m2-decomposition` (PLAN 2026-08-27-1922, WS-7)
**Condition:** C1 — the one-sentence mode line is not negotiable downward.
**Consumer:** `area-plugins-m2-mode-selection` (WS-3), which byte-pins these
bytes. This record is the durable deliverable;
`kai/initiatives/area-plugins/` does not exist and cannot be created in this
session, so no artifact file was written and none was faked.

**Environment limit (2026-08-27-2001):** no shell in this session. Character
counts below were computed by hand from the delivered text and are stated as
approximate; infra should re-measure with `normalizeLF(block).length` before
setting a budget constant.

---

## 1. The copy, verbatim

File: `scripts/lib/standalone-block.txt`. LF endings, trailing newline, no BOM,
no leading blank line — same shape as `degraded-block.txt`. Everything between
the fences is the file.

```text
## Standalone mode — no `kai-core`

The mode selection above found no `kai-core`. This is not an error and not a
refusal: you can do the work, you just cannot record it. Say so once, then
work normally.

- Say once, in your first reply: "Standalone mode: `kai-core` is not installed,
  so I can do this work but not record it — install `kai-core` for durable
  workspace, coordination, and handoffs."
- Do not repeat it. A request that needs none of what is missing gets a normal
  answer, not a second notice.
- Tell the operator to install `kai-core` — `copilot plugin install
  kai-core@kai-plugins` — only when the request needs something listed below;
  name the one thing that is missing, then do the part you honestly can or stop.
- Continue in standalone mode otherwise. It is a real path, not a waiting room.
- Never create durable coordination: no items, no threads, no board, no queue.
- Never take, hold, or release a lease.
- Never hand work off, and never accept a handoff.
- Never write an initiative artifact.
- Never record a review, an approval, or a waiver.
- Never claim fleet visibility; nothing here sees another agent's session.
- Never call anything shipped, deployed, or verified.
- Never write a path containing `.kai` or `manifest.json`, or anything under
  `kai/coordination`, `kai/initiatives`, or `kai/library`.
- Never write state whose location you chose: what the user asked for goes where
  the user said, and scratch goes to the operating system temporary directory
  with its absolute path stated in the same reply.
- Never cite a file from an earlier standalone session as prior work, as
  evidence, or as a satisfied acceptance; it was never recorded state.
- Never treat a mid-session install as an upgrade; say "`kai-core` is installed
  now, but this session is still standalone — start a fresh session for full
  mode, and nothing from this one carries over."
- Never present sourcing or research here as grounded work: the shared grounding
  and source-evaluation skills ship with `kai-core`.
```

**Approximate size:** 2,038 characters, 34 lines, 16 bullets. See §6 — this does
**not** fit `DEGRADED_BLOCK_MAX = 1200`, and it must not be made to.

---

## 2. The one-sentence mode line (condition C1)

Delivered as a single sentence the agent says verbatim on its first reply:

> **Standalone mode: `kai-core` is not installed, so I can do this work but not
> record it — install `kai-core` for durable workspace, coordination, and
> handoffs.**

**Why these words and not fewer.** C1 requires the sentence to name the mode and
the upgrade. It carries exactly three things and nothing else:

1. **the mode** — "Standalone mode";
2. **the cause, stated as a fact rather than a fault** — "`kai-core` is not
   installed", which is also the tell that separates this from the other two
   paths (§4);
3. **the consequence and the upgrade in one clause** — "I can do this work but
   not record it — install `kai-core` for …".

The consequence clause is the part that makes C1 do its job. "Standalone mode,
install `kai-core` for more" names the mode and the upgrade and still leaves the
user unable to decide the only question that matters: *is this answer recorded
work?* C1's own justification is that the user must be able to answer that
before deciding whether to trust the reply. So "but not record it" is inside the
non-negotiable, not decoration on it. **If this sentence is shortened, that
clause is the one thing that may not be dropped.**

The upgrade is described as "durable workspace, coordination, and handoffs" —
three words, not the full seven-item disclaimer set. The full set lives in the
prohibitions where it belongs; a first-reply notice that recites seven losses is
the nagging the anti-nag rule exists to prevent.

---

## 3. The two honest paths (non-negotiable #5)

Exactly one of each, and they are the only two affirmative moves in the block.

| Path | Bullet | When it fires |
|---|---|---|
| **(a) install `kai-core`** | `Tell the operator to install \`kai-core\` — \`copilot plugin install kai-core@kai-plugins\` — only when the request needs something listed below; name the one thing that is missing, then do the part you honestly can or stop.` | Only when the request itself asks for a disclaimed capability. This is the architecture's rule §2.2, verbatim in behaviour: name the *specific* unavailable capability, offer the install once, then do the honest part or stop. |
| **(b) continue in standalone mode** | `Continue in standalone mode otherwise. It is a real path, not a waiting room.` | Every other request. |

"…not a waiting room" is doing real work: without it, path (b) reads as *tolerate
the user until they install*, and the agent drifts back to nagging through tone
rather than through repetition. Non-negotiable #5 says the two paths are
**honest**, which means (b) has to be offered as a destination, not a delay.

The remedy bullet reuses degraded's exact opener — `Tell the operator to
install …` — so the one-remedy assertion is grammatically identical across both
blocks and a single lint clause covers both.

---

## 4. How a reader tells the three paths apart

This is the constraint the packet raised, and it is the one I would fail the copy
on if it were missed. The standalone block is a **third** path that must not
collide with or soften either existing refusal.

| | Trigger | What the user sees | Session continues? |
|---|---|---|---|
| **full** | `KAI_CORE_READY` and the exact expected contract line | nothing — never mentioned | yes, normally |
| **standalone** | no `kai-core` at all: skill unavailable, no marker, no version line | one sentence, once, saying **"`kai-core` is not installed"**, then a normal answer | **yes, for the whole session** |
| **degraded** | `kai-core` answered **and is compatible**, but its contracts are not loaded in this session | a refusal of the request *as coordinated work*, answered **single-shot** — one reply from what the request carries, then stop | **no — one reply** |
| **refuse (skew)** | marker present, incompatible version | exactly the `KAI-CORE-MISSING` token, nothing else | **no** |

**Three orthogonal tells, each mechanically checkable:**

1. **The token.** `KAI-CORE-MISSING` appears only on the skew path. The copy
   above does not contain it and must never be allowed to — that is already in
   the reused degraded lint clause.
2. **Two words that appear in exactly one block each.** `Refuse` and
   `single-shot` are degraded's identity. **Neither word appears anywhere in the
   standalone copy, and that is deliberate.** Standalone refuses *durable
   claims*, never *the request*. Conversely the standalone copy is the only one
   of the three containing the words `Standalone mode` and `not installed`.
3. **The cause is named to the user, differently in each case.** Standalone says
   *not installed*; degraded says *installed, answered, contracts not loaded*;
   skew says nothing but the token. A user reading the reply alone can tell which
   regime produced it — which is the whole point of C1.

**Routed to `principal-swe-infra` as a doc-review question, not legislated
here** (it is a lint decision in your lane): `standaloneBlockErrors()` could pin
tell #2 as two negative assertions — the block must **not** contain
`single-shot`, and no bullet may open with `Refuse`. That would make the
three-way distinction machine-enforced rather than a property of today's
wording. I recommend it; I am not adding it to this item's acceptance.

**Warning about a copy-paste hazard in the other direction.**
`degradedBlockErrors()` asserts `text.includes('single-shot')` and exactly one
`Refuse …` bullet. `standaloneBlockErrors()` is described as "modelled on"
degraded — if those two assertions are carried over unchanged, the standalone
block would be forced to claim it is single-shot and to refuse the request,
which is the exact opposite of standalone mode and would re-introduce the
fail-closed behaviour direction #4 relaxes. **Those two assertions are
degraded's alone and must not be inherited.**

---

## 5. Clause-by-clause map to the item's acceptance

| Acceptance line | Where it is satisfied |
|---|---|
| One-sentence mode line (C1) | bullet 1, quoted sentence — §2 |
| Two honest paths, exactly one each | bullets 3 and 4 — §3 |
| Five pinned disclaimers, one prohibition line each | no durable coordination (b5) · no fleet visibility (b10) · no leases (b6) · no handoffs (b7) · no shipped-state claims (b11) |
| The two named explicitly rather than folded in | no initiative artifacts (b8) · no review or approval records (b9) |
| Anti-nag pair | `Say once, in your first reply` (b1) + `Do not repeat it.` (b2) |
| No retroactive promotion | b14 — "Never cite a file from an earlier standalone session as prior work, as evidence, or as a satisfied acceptance; it was never recorded state." |
| One honest capability line | b16 — the shared grounding and source-evaluation skills ship with `kai-core` |
| Four forbidden path literals | b12 (`.kai`, `manifest.json`, `kai/coordination`, `kai/initiatives`, `kai/library`) + b13 (state whose location you chose) |
| Upgrade transition, fresh session, no import path | b15 — §7 |

**Deliberate register choices, so review does not read them as accidents.**

- Prohibitions open with **`Never`**, not degraded's `Do not`. Standalone's
  prohibitions are invariants that hold for the whole session; degraded's are
  instructions for one reply. Both openers are already in the permitted set, so
  this costs nothing and reads as a different kind of rule, which it is.
- The only `Do not` in the block is the anti-nag instruction, which genuinely is
  a one-behaviour instruction rather than an invariant.
- The bullet openers form a closed set of five: `Say once` · `Do not` · `Tell
  the operator to install` · `Continue in standalone mode` · `Never`. Three are
  already in `DEGRADED_OPENERS`; the two new ones map one-to-one onto the two
  new required clauses (the `once` instruction and path (b)). **The opener set
  and the clause set are the same set** — a lint that pins openers pins the
  contract for free.
- Two bullets (b6 at ~38 chars, b8 at ~36 chars) fall under the 40-character
  `DEGRADED_QUOTE_MIN`, so they are structurally incapable of tripping the
  restate-a-core-contract-line check. No line in the copy was lifted from any
  `kai-core-*` skill body; the wording is original throughout, specifically
  including the `shipped` prohibition, which was written *not* to reuse the
  inherits-block phrasing.

---

## 6. Size — the one thing this copy cannot satisfy on its own

**Approximately 2,038 characters against a `DEGRADED_BLOCK_MAX` of 1200.**

Stated plainly rather than buried: the degraded block carries **6** bullets
because it is a refusal, and its budget comment says a refusal needing more room
"has become the fallback contract it exists not to be." That reasoning is
correct **for a refusal** and does not transfer. The standalone block carries
**16 clauses that the architecture, the brief's non-negotiables #5–#7, and this
item's acceptance each independently require**. There is no arrangement of 16
required clauses inside 1200 characters that is also readable.

**Product position, and the line I am drawing:**

- `STANDALONE_BLOCK_MAX` is its own constant, derived from the required clause
  count, not copied from the refusal budget. **Recommended: 2400** — the
  delivered copy plus roughly 18% headroom, which is enough for a wording fix at
  review and not enough for a new capability. The number is infra's to set; the
  *derivation* is the product requirement.
- **If the budget is set at 1200, the copy does not fit and a required clause
  must be cut. That is a scope decision and it returns to me — it is not a
  formatting fix and must not be resolved by shortening the mode line.** C1 is
  not negotiable downward, and the seven disclaimers are non-negotiable #6
  restated. The compressible surface is the three-line intro (~160 characters)
  and nothing else.
- Raising `STANDALONE_BLOCK_MAX` later is a decision, not a formatting fix —
  same rule as the degraded constant, and it should carry the same comment.

---

## 7. Identity strings — the decision, and why

**Question:** should the copy hard-code an identity string at all, given that the
marketplace is `kai-plugins` today and becomes `kai` in milestone 3
(`surface-rename`)?

**Ruling: the copy carries exactly one identity span, and that span is declared
a generator-derived identity string under steward amendment A1.**

Grounding: `validate-plugin.mjs:861` already derives
`` `copilot plugin install ${packPluginName(pack)}@${MARKETPLACE}` `` and
asserts the literal downstream; `migration-doctor.mjs:56` holds
`MARKETPLACE = 'kai-plugins'`. **The plugin name `kai-core` is stable across the
entire initiative — only the `@<marketplace>` segment churns.** That asymmetry
decides the question:

1. **`kai-core` (backticked, 6 occurrences): hard-coded unconditionally.** It
   never renames, non-negotiable #2 forbids ever creating a plugin named `kai`,
   and the lint requires the literal anyway. Zero rename exposure.
2. **`copilot plugin install kai-core@kai-plugins`: present exactly once, and
   exempt under A1 as packaging rather than content.** It satisfies A1(i) — an
   install command mechanically derived from `packPluginName()` / `MARKETPLACE`
   — and A1(iii) — changing the marketplace segment changes no instruction,
   judgment, or persona. **A1(ii) is a requirement on WS-3, not on this copy:**
   the span must be covered by a CI check that derives the expected literal from
   those same constants. Whether infra templates the span at injection time or
   keeps the file static and asserts the derived literal against it is an
   implementation choice in infra's lane; the product requirement is only that
   **the milestone-3 rename cannot pass silently.** With the check, the rename
   turns CI red, one derived span updates to `kai-core@kai`, and no product
   decision reopens.
3. **No other identity string appears.** No area plugin names, no marketplace
   name outside that one span, no skill IDs. Skill IDs are additionally
   forbidden by the reused lint clause, which is why the capability line says
   "the shared grounding and source-evaluation skills" instead of naming the
   five.

**Two alternatives considered and rejected:**

- **Omit the invocation entirely** ("install `kai-core`", no command). Rejected:
  it leaves a user whose session has no core installed with a problem and no
  path out of it — precisely the failure `degradedBlockErrors()` already names,
  *"states the problem and withholds the one thing that fixes it."* The block is
  the only surface that user is guaranteed to see.
- **Hard-code it with no deriving check.** Rejected: that is exactly the
  `demo-narrate` shape A1 flags as failing (ii) — an unpinned identity literal
  that survives a fully green build — and it is the silent-stranding shape
  success measure #5 targets at zero. Adding a second instance of a known defect
  while an amendment is open about the first one is not a tradeoff, it is a
  regression.

---

## 8. The upgrade transition (non-negotiable #7)

Delivered inside b15 as the sentence the agent says, so it is byte-pinned rather
than left to the model:

> **"`kai-core` is installed now, but this session is still standalone — start a
> fresh session for full mode, and nothing from this one carries over."**

Three properties, each traceable to the architecture's §4 ruling:

- **Fresh session only.** The bullet opens `Never treat a mid-session install as
  an upgrade`, so the prohibition is the instruction and the sentence is what
  replaces it.
- **No import path is implied, in either direction.** "nothing from this one
  carries over" is a statement about durability, not an offer to migrate. The
  architecture ruled *against* an import path and the brief keeps durable
  standalone state parked; copy that said "I'll bring your files across" would
  unpark a deferred item by wording. It does not appear.
- **Prior files are not discarded and not promoted.** b14 governs what may be
  said about them afterwards: cited only as a file from an earlier standalone
  session, never as prior work, evidence, or a satisfied acceptance. b15 says
  nothing carries over; b14 says what that means when the file is still on disk.
  Together they are non-negotiable #7 with no gap between them.

Placement note for review: the transition sentence sits inside a `Never …`
bullet rather than in its own `Say …` bullet on purpose — a second `Say` bullet
would make "exactly one `Say once …`" ambiguous and put the mode-line assertion
at risk. If infra prefers it as its own clause, the sentence is unchanged and
the lint clause is yours to shape; the wording is the product deliverable, the
bullet arithmetic is not.

---

## 9. What stays the same

- **`degraded-block.txt` is untouched, byte for byte.** This copy does not
  soften it, does not overlap its wording, and deliberately omits both of its
  identifying words.
- **`KAI-CORE-MISSING` is untouched and unmentioned.** Its narrowed trigger
  (skew and degraded) is unchanged by anything here. The token does not appear
  in the copy.
- **Fail-closed is relaxed for loading, never for claims.** Nothing in this copy
  permits a lease, a handoff, a coordination or initiative artifact, a review or
  approval record, a fleet claim, or a `shipped` assertion. Every one is a
  separate prohibition line.
- **No new capability, no new surface, no new file beyond the one WS-3 already
  plans.** This item wrote sentences only: no `scripts/lib/*.txt` was created or
  edited, and nothing under `scripts/`, `packs/`, `plugin.json`, `agents/`,
  `skills/`, or `kai/initiatives/**` was touched.
- **The parallel sibling `area-plugins-migration-architecture` and its thread
  were not read for modification and not written.**

---

## 10. Scope classification of everything I considered and did not do

Per `kai-core-scope-discipline`, classified rather than silently dropped:

- **`Apply`** — the 16 clauses above. Every one is named in the architecture,
  the brief's non-negotiables, or this item's acceptance. Nothing was added.
- **`Defer` (PROPOSAL -> steward backlog)** — pinning the exact scratch
  convention `<os-tmp>/kai-standalone/<session-stamp>/` in the block. The
  architecture fixed the convention; the copy carries the *property* ("the
  operating system temporary directory", absolute path announced) and not the
  literal, because a literal directory name in a byte-pinned block is a string
  nobody derives and the property is what the guarantee needs. **Where the
  concrete convention is pinned — standalone block, the amended floor in WS-1,
  or nowhere — is an open placement question for `principal-swe-infra`.** Flagged
  here so it is not lost; not added to any acceptance by me.
- **`Defer`** — a `standalone` badge, banner, or status line beyond the single
  sentence. Adds a surface; C1 asks for one sentence and the anti-nag rule
  forbids the rest.
- **`Defer`** — copy for `mode-block.txt`. Not this item's deliverable and not
  requested; the mode block selects, it does not speak. If WS-3 finds it needs
  user-facing words, that returns to me as a new input rather than being drafted
  here on spec.
- **`Reject`** — softening any prohibition to "avoid" or "prefer not to". The
  prohibition set is the guarantee that replaced a mechanical refusal; hedged
  wording would make measure #2 unassertable.

---

## HANDOFF 2026-08-27-2001 — principal-product-manager -> principal-swe-infra

- did:       Authored the complete product copy for `scripts/lib/standalone-block.txt` (§1, verbatim and paste-ready) against every acceptance line on the item and conditions C1 / non-negotiables #5–#7. 16 clauses: the one-sentence mode line, the two honest paths, the five pinned disclaimers plus initiative-artifacts and review-records named explicitly, the anti-nag pair, the four forbidden path literals, the no-retroactive-promotion prohibition, the capability-loss disclosure, and the upgrade-transition sentence. Ruled the identity-string question (§7): `kai-core` hard-coded unconditionally since only the marketplace segment renames; the single install invocation declared a generator-derived identity string exempt under steward amendment A1, with A1(ii) — a deriving check — required of WS-3. Stated the three-way distinguishability of standalone / degraded / skew and the two words that separate them (§4). Wrote no production code; created and edited no file under `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`, or `kai/initiatives/**`; did not touch the parallel sibling `area-plugins-migration-architecture`.
- state:     in-review
- needs:     `doc-review` per the item's `review_requirements` — mechanical conformance to the clause set `standaloneBlockErrors()` must assert. **Three things need your ruling, all in your lane:** (a) **`STANDALONE_BLOCK_MAX`** — the copy is ~2,038 characters and does not fit `DEGRADED_BLOCK_MAX = 1200`; recommend 2400, derived from the required clause count (§6). If you set it at 1200 the copy loses a required clause, which is a scope decision that returns to me and is **not** resolved by shortening the mode line. (b) **Do not inherit degraded's `single-shot` assertion or its `exactly one Refuse …` assertion** — carrying them over would force the standalone block to claim it is single-shot and to refuse the request, which is the opposite of standalone mode (§4). (c) **A1(ii) coverage for the install invocation** — a CI check deriving the literal from `packPluginName('core')` + `MARKETPLACE`, so the milestone-3 rename cannot pass silently; template-at-injection or static-plus-assertion is your call (§7).
- artifacts: `kai/coordination/threads/area-plugins-m2-standalone-copy.md` (this record — the durable deliverable; the canonical `kai/initiatives/area-plugins/artifacts/` path cannot be created in this session); `kai/coordination/items/area-plugins-m2-standalone-copy.md` (version 4, `in-review`, lease cleared)
- evidence:  `scripts/lib/degraded-block.txt` and `preflight-block.txt` and `inherits-block.txt` read verbatim for register and clause shape; `pack-plan.mjs:580-663` — `DEGRADED_BLOCK_MAX = 1200`, `DEGRADED_QUOTE_MIN = 40`, `DEGRADED_OPENERS = [/^Do not\b/, /^Never\b/, /^Refuse\b/, /^Tell the operator to install\b/]`, `coreContractLines()`, and the six reusable assertions in `degradedBlockErrors()` including the skill-ID citation ban and the `` /`contract:/ `` ban; `validate-plugin.mjs:861` — the existing derive-and-assert precedent for install commands; `migration-doctor.mjs:56` — `MARKETPLACE = 'kai-plugins'`; `workspace-doctor.mjs:665` — the live `copilot plugin install kai-core@kai-plugins` literal. Copy verified by inspection to contain no `KAI-CORE-MISSING` token, no `` `contract: `` literal, no backticked skill ID, no line lifted from a `kai-core-*` skill body, and to name `` `kai-core` ``. Character counts are hand-computed and flagged as approximate — re-measure before setting the constant.
- questions: none blocking. The three in `needs` are review rulings, not blockers on the copy.
- next:      `principal-swe-infra` — `doc-review`. On approval this item goes `completed` and unblocks `area-plugins-m2-mode-selection`'s `requires: completed` edge. **If (a) forces a clause cut, return the item to `principal-product-manager` rather than trimming the copy in review** — the mode line and the seven disclaimers are steward lines, not wording preferences.

---

## REVIEW 2026-08-27-2015 — principal-swe-infra (`doc-review`)

**Verdict: `approved-with-conditions`.** **`satisfies_requirement: true`.**

**Bound to `DELIVERABLE 2026-08-27-2001` §1** — this item is `delivery_class:
knowledge` and `change_ref` is `null`, so the reviewed revision is that thread
entry's copy block, not a git object. No other revision is approved by this
record.

**Findings: P0 0 · P1 4 · P2 7.** Every P1 is a specification ruling that binds
`area-plugins-m2-mode-selection` (WS-3). **None requires an edit to the copy** —
the 34 delivered lines are approved as written, which is why `completed` is
truthful for this item.

**Environment limit.** No shell in this session. Nothing below was executed. Line
and character counts are **hand-computed (`reported`)**, never
machine-measured (`observed`); source line numbers and file contents were read
directly and are `observed`.

---

### Q1 ruling — the size budget

**Verification first, as instructed.**

| Claim | Verified |
|---|---|
| `DEGRADED_BLOCK_MAX` exists | **yes** — `scripts/lib/pack-plan.mjs:583`, value **1200** |
| It is enforced, not decorative | **yes** — `scripts/lib/pack-plan.mjs:630-633` inside `degradedBlockErrors()` |
| Enforcement reaches CI | **yes** — `scripts/validate-plugin.mjs:427-433` calls it against `degraded-block.txt` |
| The failure is proven by name | **yes** — `scripts/pack-preview.mjs:479-481` self-test arm |
| Raising it is a decision | **yes** — the comment at `pack-plan.mjs:581-582` says exactly that |

**The steward's reasoning is upheld; the steward's number is not.** 1200 does not
transfer — it was set for a **refusal**, and its own comment gives the reason
(*"a refusal that needs this much room has become the fallback contract it exists
not to be"*). The standalone block is not a refusal; it is a governed continuation
with 16 independently-required clauses. Reusing 1200 would be reusing a rationale
that does not apply to the artifact.

But **2400 is a hand-picked number with a rationale attached afterwards** —
"delivered copy plus roughly 18% headroom" is measured off the copy, so it would
drift every time the copy is reworded and it carries no information about scope.
The steward correctly said the *derivation* is the product requirement. Here it is.

**Ruling — `STANDALONE_BLOCK_MAX = 2880`, derived, in `scripts/lib/pack-plan.mjs`
beside `DEGRADED_BLOCK_MAX`:**

```js
// One clause costs about two lines at the 80-column width every block file
// already wraps to; the header gets the degraded block's own header size. The
// budget is therefore a function of STANDALONE_CLAUSES — the same table the
// linter iterates — so a clause added by decision moves it and a rewording
// never can. Raising the per-clause cost is a decision, not a formatting fix.
const STANDALONE_CLAUSE_COST = 160;
const STANDALONE_PROSE_ALLOWANCE = 320;
export const STANDALONE_BLOCK_MAX =
  STANDALONE_PROSE_ALLOWANCE + STANDALONE_CLAUSE_COST * STANDALONE_CLAUSES.length;
```

With `STANDALONE_CLAUSES.length === 16` that is **320 + 2560 = 2880**.

**Why this derivation and not the two obvious alternatives.**

- *Per-clause rate lifted from the degraded constant* (1200 / 6 bullets = 200 ×
  16 = **3200**) is also a true derivation, and I rejected it as too loose: it
  double-counts the header into every clause and leaves 57% headroom.
- *A per-bullet cap, summed* is the version I wanted, and it does not survive
  contact with the copy: four bullets (b1 196, b3 226, b13 209, b15 205 chars)
  already exceed two wrapped lines, so an enforced 160-per-bullet cap would fail
  the delivered text and a cap loose enough to pass it (240) yields a 4160
  ceiling. 160 stands as an **average allowance**, exactly as 200 is for degraded.

**Does the copy fit? Yes — with room, on either number.**

| | hand-count |
|---|---|
| Delivered copy, `normalizeLF(block).length` after `trimEnd()` | **2,035** |
| `STANDALONE_BLOCK_MAX` (this ruling) | 2,880 — **fits**, 845 spare (29%) |
| 2400 (steward's recommendation) | **fits**, 365 spare (15%) |
| `DEGRADED_BLOCK_MAX` 1200 | does not fit — correctly rejected |

My recount is **2,035**, three characters under the product's ~2,038; both are
hand-computed and the difference is immaterial at 845 characters of headroom.
`readBlock()` applies `trimEnd()` (`pack-plan.mjs:526-527`), so the file's
trailing newline never reaches the measurement — the number to compare is 34
lines of content plus 33 newlines.

**No required clause dies. Nothing returns to the steward.** The scope decision
the steward reserved is not triggered, so this item is not `blocked` and no
QUESTION is raised.

**The guard that makes "trim a clause to buy room" impossible is not the budget —
it is the clause table.** `standaloneBlockErrors()` asserts each of the 16 clauses
present by name; removing one goes red on the missing-clause arm before the
budget is ever consulted. As secondary reinforcement, cutting any of the twelve
clauses shorter than 160 characters *shrinks the budget faster than it shrinks the
content*, so it buys negative room. I state that as reinforcement, not as the
guarantee — for the four long clauses it does not hold, and the clause table is
what actually holds the line there.

**Instruction to WS-3, binding:** re-measure with
`normalizeLF(readFileSync(STANDALONE_BLOCK_REL, 'utf8')).trimEnd().length` before
pinning. If the machine measurement exceeds `STANDALONE_BLOCK_MAX`, **that is a
scope decision back to `principal-product-manager`** — do not trim a clause, do
not shorten the mode line, and do not raise the constant to fit. Given 845
characters of headroom against a deterministic hand count, this is not a live risk.

---

### Q2 ruling — `standaloneBlockErrors()`, and the trap

**Verification first.** Both assertions the steward flagged are real:

- `scripts/lib/pack-plan.mjs:616-618` — `if (!text.includes('single-shot'))` →
  *"does not say the session is single-shot — without that it reads as a pause,
  not a refusal"*.
- `scripts/lib/pack-plan.mjs:643-646` — `opening(/^Refuse\b/) !== 1` →
  *"must carry exactly one `Refuse …` instruction — the single-shot refusal is
  the whole block"*.

Inheriting either one forces the standalone block to claim single-shot and to
refuse the request. That is the fail-closed behaviour direction #4 relaxes, and
it would silently re-introduce it through a lint rule rather than through a
decision. **The steward's hazard is confirmed.** The accepted architecture already
excludes both from the reuse list (`area-plugins-optional-core-architecture.md`,
gate table row `degradedBlockErrors`) — this ruling makes that exclusion
mechanical instead of a reading.

**P1-2 — a third inheritance hazard the steward did not name, and it is the one
that actually breaks the build.** `DEGRADED_OPENERS`
(`scripts/lib/pack-plan.mjs:590`) is
`[/^Do not\b/, /^Never\b/, /^Refuse\b/, /^Tell the operator to install\b/]`.
Reused verbatim it does two wrong things at once:

1. **bullets 1 and 4 fail** — `Say once, in your first reply:` and `Continue in
   standalone mode otherwise.` are not in the set, so the "gives the affirmative
   instruction" arm (`pack-plan.mjs:637-642`) fires on the anti-nag instruction
   and on path (b) — the two clauses the architecture requires;
2. **it admits `Refuse`** — the one opener standalone must never carry.

So the opener set must be **replaced, not extended**.

**Specification for `area-plugins-m2-mode-selection` — implement exactly this.**

```js
// Standalone's own openers. Note what is absent: `Refuse` is degraded's, and a
// block that continues the session may not open a clause with it.
const STANDALONE_OPENERS = [
  /^Say once\b/,
  /^Do not\b/,
  /^Never\b/,
  /^Tell the operator to install\b/,
  /^Continue in standalone mode\b/,
];
```

**(A) Reuse from `degradedBlockErrors()` — 7 arms, semantics unchanged.**

| # | Assertion | Source line |
|---|---|---|
| A1 | must contain `` `kai-core` `` | `pack-plan.mjs:613-615` |
| A2 | must **not** contain `refusalToken` (`KAI-CORE-MISSING`) | `:619-623` |
| A3 | must **not** match `` /`contract:/ `` | `:624-627` |
| A4 | must **not** backtick any shipped skill/agent id | `:648-652` |
| A5 | must **not** restate a `coreContractLines()` line (≥ `DEGRADED_QUOTE_MIN` 40) | `:653-658` |
| A6 | must carry ≥1 bullet; every bullet opens with a permitted opener | `:635-642` (with `STANDALONE_OPENERS`) |
| A7 | size budget — same shape, `STANDALONE_BLOCK_MAX` | `:630-633` |

**(B) Do NOT inherit — 2 arms. Invert them into negative assertions.**

```js
if (text.includes('single-shot')) {
  errs.push('claims the session is single-shot — that is the degraded refusal\'s identity; '
    + 'standalone runs for the whole session, and two blocks that say the same thing are '
    + 'two blocks a user cannot tell apart');
}
if (bullets.some((b) => /^Refuse\b/.test(b))) {
  errs.push('refuses the request — standalone refuses durable claims, never the request; '
    + 'a `Refuse …` clause here is the fail-closed behaviour this block exists to replace');
}
```

The second is technically reachable through A6 once `Refuse` leaves the opener
set, but A6's message would say "affirmative instruction", which is the wrong
diagnosis for the most dangerous single edit anyone can make to this file. Keep
the named arm; it fires first and says what actually went wrong.

**These negatives live in `standaloneBlockErrors()`, not in a new shared
function, and `degradedBlockErrors()` is not touched.** The architecture pins it
*Unchanged — and generalised*; a cross-block disjointness helper would be a
second place to edit for one property and would drag `degraded-block.txt` into a
diff the decision says stays byte-for-byte identical.

**(C) New positive assertions — the 16-entry clause table.** One table, iterated
for both the presence checks and the budget, so the clause set and the budget can
never disagree:

```js
// Each entry is one required clause: what must be present, and one clause of
// budget. Adding an entry is a decision — it changes what the block guarantees
// and what it is allowed to cost, together.
const STANDALONE_CLAUSES = [ /* 16 entries, below */ ];
```

| # | id | Assertion (bullet-scoped unless noted) | Copy |
|---|---|---|---|
| 1 | `mode-line-once` | exactly one `/^Say once\b/` bullet, containing all of `Standalone mode`, `not installed`, `not record it`, `` `kai-core` `` | b1 |
| 2 | `no-repeat` | exactly one `/^Do not repeat it\b/` bullet | b2 |
| 3 | `install-path` | exactly one `/^Tell the operator to install\b/` bullet | b3 |
| 4 | `continue-path` | exactly one `/^Continue in standalone mode\b/` bullet | b4 |
| 5 | `no-durable-coordination` | a `Never` bullet containing `durable coordination` | b5 |
| 6 | `no-leases` | a `Never` bullet containing `lease` | b6 |
| 7 | `no-handoffs` | a `Never` bullet containing `handoff` | b7 |
| 8 | `no-initiative-artifacts` | a `Never` bullet containing `initiative artifact` | b8 |
| 9 | `no-review-records` | a `Never` bullet containing `review` and `approval` | b9 |
| 10 | `no-fleet-visibility` | a `Never` bullet containing `fleet visibility` | b10 |
| 11 | `no-shipped-claims` | a `Never` bullet containing `shipped` | b11 |
| 12 | `forbidden-path-literals` | a `Never` bullet containing **each** of `` `.kai` ``, `` `manifest.json` ``, `kai/coordination`, `kai/initiatives`, `kai/library` | b12 |
| 13 | `no-self-chosen-state` | a `Never` bullet containing `location you chose` | b13 |
| 14 | `no-retroactive-promotion` | a `Never` bullet containing `earlier standalone session` and `evidence` | b14 |
| 15 | `upgrade-transition` | a `Never` bullet containing `mid-session install` and `fresh session` | b15 |
| 16 | `capability-disclosure` | a bullet containing `grounding` and `source-evaluation` | b16 |

Fragment-level content pins are the repo's own idiom, not a new one — see the
`requiredText` list at `scripts/validate-plugin.mjs:886-908`. They are
discriminators, not sentences, so this is not prose duplicated into JS.

**Clause 1 is the C1 enforcement and is the highest-value line in the whole
spec.** Pinning the fragment `not record it` is what makes the steward's
non-negotiable mechanical: the clause the steward says lives *inside* C1 rather
than decorating it can no longer be dropped by a wording edit that still looks
like a mode line. Do not soften it to a check that the bullet merely exists.

**(D) Three-way distinguishability — the assertion matrix.** These are the
orthogonal tells, made checkable:

```
                          mode      standalone   degraded
 KAI-CORE-MISSING          yes         NO           NO      <- A2 (both)
 "single-shot"              -          NO          YES      <- B, inverted
 bullet opening "Refuse"    -         0 (B)        1 (deg)  <- opener sets differ
 "Standalone mode"          -         YES           -       <- clause 1
 "not installed"            -         YES           -       <- clause 1
 "Continue in standalone"   -         1             0       <- clause 4 / opener set
 "Tell the operator to
  install …"                -         1             1       <- SHARED BY DESIGN
```

**The remedy opener is deliberately shared and is therefore not a tell.** One
remedy, stated once, grammatically identical in both blocks so a single arm
covers both — that was a correct product choice and it must not be turned into a
distinguisher by anyone trying to add a fourth tell.

---

### Also-review 1 — implementable as a byte-pinned block?

**Yes, with no change to the copy.** The delivered shape (LF, trailing newline,
no BOM, no leading blank line) is exactly what the injection path requires, and
I checked it against the mechanism rather than against the convention:

- `readBlock()` (`pack-plan.mjs:526-527`) applies `normalizeLF(...).trimEnd()`, so
  the trailing newline is stripped before any pin — harmless, and consistent with
  the other three files;
- `injectBlocks()` (`pack-plan.mjs:545-552`) prepends `''` per block, so a file
  **starting** with a blank line would double-space in 56 generated bodies. The
  copy starts with `## Standalone mode`. ✓
- `guaranteeBlockErrors()` counts with `body.split(block).length - 1`
  (`pack-plan.mjs:1656-1657`) — whole-block substring containment. The standalone
  text is not a substring of `degraded-block.txt` and shares no full line with it. ✓
- A BOM would survive `readFileSync(..., 'utf8')` and corrupt the first heading.
  The product specified no BOM; hold that in the committed file.

```
  generated area agent body (kai-personal / kai-product / kai-engineering / …)
  ┌──────────────────────────────────────────────────────────────────┐
  │ **Inherits:** …                                                  │
  │ > inherits-block.txt      (standalone contract FLOOR, WS-1)      │
  ├──────────────────────────────────────────────────────────────────┤
  │ mode-block.txt            probe -> full | standalone | refuse    │  contractPinErrors()
  ├──────────────────────────────────────────────────────────────────┤
  │ standalone-block.txt      NEW — this copy                        │  standaloneBlockErrors()
  ├──────────────────────────────────────────────────────────────────┤
  │ degraded-block.txt        unchanged, byte for byte               │  degradedBlockErrors()
  └──────────────────────────────────────────────────────────────────┘
     contiguous, in that order, exactly one copy each   <- guaranteeBlockErrors()
     core agents carry NONE of the three
```

**Exact file:** `scripts/lib/standalone-block.txt` — confirmed as the right name
under the `scripts/lib/*-block.txt` convention, and it is the path the accepted
architecture already names. WS-3 creates it; this review does not.

**Constant and export additions required in `scripts/lib/pack-plan.mjs`:**

| Addition | Site |
|---|---|
| `export const STANDALONE_BLOCK_REL = 'scripts/lib/standalone-block.txt';` | beside `DEGRADED_BLOCK_REL`, `:44` |
| `export const standaloneBlock = (root = REPO_ROOT) => readBlock(root, STANDALONE_BLOCK_REL);` | beside `degradedBlock`, `:531` |
| `guaranteeBlocks()` -> `[modeBlock(root), standaloneBlock(root), degradedBlock(root)]` | `:538` |
| `STANDALONE_OPENERS`, `STANDALONE_CLAUSES`, `STANDALONE_CLAUSE_COST`, `STANDALONE_PROSE_ALLOWANCE`, `STANDALONE_BLOCK_MAX`, `standaloneBlockErrors()` | the rules section, `:570-663` |
| `coreInstallCommand(marketplace)` — see also-review 3 | beside `packPluginName`, `:151` |
| `guaranteeBlockErrors({ files, mode, standalone, degraded, inheritsBlock })` — third block, order, contiguity | `:1643-1701` |
| `export const DEGRADED_BLOCK_MAX` — **unchanged at 1200** | `:583` |

**P2-6, while you are in `guaranteeBlockErrors()`.** The per-agent ladder at
`pack-plan.mjs:1670-1679` `continue`s on the first count failure. With two blocks
that hides one fault; with three it hides two. Report all three counts for an
agent before moving on — a regenerate that drops two blocks should not read as
one problem.

---

### Also-review 2 — fail-closed relaxed for LOADING, never for CLAIMS

**The copy holds the line. 7 of 7, one prohibition line each.** Checked clause by
clause against the architecture's "Not authorised" row (`Probe returns` table,
`standalone` row):

| Not authorised | Copy | Bullet |
|---|---|---|
| leases | `Never take, hold, or release a lease.` | b6 |
| handoffs | `Never hand work off, and never accept a handoff.` — both directions | b7 |
| coordination records | `Never create durable coordination: no items, no threads, no board, no queue.` | b5 |
| initiative artifacts | `Never write an initiative artifact.` | b8 |
| review records | `Never record a review, an approval, or a waiver.` — `waiver` is beyond the required set and correct | b9 |
| fleet claims | `Never claim fleet visibility; nothing here sees another agent's session.` | b10 |
| `shipped` | `Never call anything shipped, deployed, or verified.` | b11 |

**One bullet grants anything at all** — b4, `Continue in standalone mode
otherwise` — and what it grants is *continuing*, not *claiming*; it is bounded by
the word `standalone`, which the twelve prohibitions below it define. Nowhere does
the copy imply an agent may take a lease, hand off, or assert shipped state. b13
permits writing only where the user named plus announced temp scratch, which is
the architecture's ruling verbatim in behaviour. **No relaxation of a claim
appears anywhere in the 34 lines.**

**P2-3 — the deferred scratch literal, which the product routed to me as an open
placement question. Ruling: the literal stays out of every byte-pinned block.**
The copy carries the *property* ("the operating system temporary directory",
absolute path announced) and that is correct and sufficient there.
`<os-tmp>/kai-standalone/<session-stamp>/` goes to `docs/` and, if it needs
mechanical force, to `workspace-doctor`'s standalone report — the only surface
that can actually observe a directory and say whether the convention was followed.
It does **not** go into the amended `inherits-block.txt` floor: that block is
injected into all 56 root bodies and is the tightest budget in the system
(`INHERITS_FLOOR_MAX`), and a path literal nothing derives and nothing checks is
the exact unpinned-identity-string shape amendment A1 exists to stop.

---

### Also-review 3 — the A1(ii) mechanism, concretely

**P1-3, and this is the finding that would have made the check useless.** The
copy wraps the install invocation across a line break — line 12 ends
`` `copilot plugin install `` and line 13 opens `` kai-core@kai-plugins` ``. The
existing precedent at `scripts/validate-plugin.mjs:855-861` matches its derived
command with a raw `onboarding.indexOf(command)`. Applied here **that check would
find nothing, report nothing, and pass forever** — an A1(ii) check that can never
fail is strictly worse than no check, because it retires the concern.

**Ruling — derive, collapse, then assert, exactly once.** The repo already solves
this one line later: `validate-plugin.mjs:864-865` builds
`onboardingProse = onboarding.replace(/\s+/g, ' ')` for precisely this reason.

In `scripts/lib/pack-plan.mjs`:

```js
// The one identity span the standalone block carries. Derived, never typed: the
// milestone-3 marketplace rename has to turn CI red here instead of stranding a
// user on an install command that no longer resolves.
export const coreInstallCommand = (marketplace) =>
  `copilot plugin install ${packPluginName('core')}@${marketplace}`;
```

`marketplace` is a **parameter, not an import**. `MARKETPLACE` lives in
`scripts/lib/migration-doctor.mjs:56`, and that module already imports
`pack-plan.mjs` at `:44` — importing back would close a cycle.
`validate-plugin.mjs` already imports both (`:37-48`) and composes them the same
way at `:855-861`, so the caller passes it.

In `standaloneBlockErrors({ block, installCommand, ... })`:

```js
const prose = text.replace(/\s+/g, ' ');
const found = prose.split(installCommand).length - 1;
if (found !== 1) {
  errs.push(`must carry \`${installCommand}\` exactly once (found ${found}) — the literal is derived `
    + 'from packPluginName() and MARKETPLACE, so a marketplace rename fails here instead of leaving '
    + 'a core-less user an install command that no longer resolves');
}
```

Whitespace-collapsing is the right mechanism and not merely the convenient one:
it survives **any** future re-wrap of the block, where an unbroken-literal check
would make the byte-pin brittle to reflow. WS-3 may instead re-wrap lines 12–14
so the command sits unbroken — it fits inside 80 columns and costs no character
of the clause — but that is an optional simplification, not a requirement, and it
is a formatting change in WS-3's lane rather than a clause cut.

**Two self-test arms in `scripts/pack-preview.mjs`, alongside the existing
refusal arms at `:456-500`. The second one is the arm that literally proves
A1(ii):**

```js
ok(standaloneErrors(standalone.replace('kai-plugins', 'kai'))
  .some((m) => /exactly once/.test(m)),
'the block drifting off the derived install literal fails by name');

ok(standaloneBlockErrors({ block: standalone, installCommand: coreInstallCommand('kai'), /* … */ })
  .some((m) => /exactly once/.test(m)),
'a marketplace rename with the block unchanged fails by name — milestone 3 cannot pass silently');
```

**The `kai-core` hard-coding is upheld without conditions.** I re-derived the
asymmetry rather than taking it: `packPluginName` (`pack-plan.mjs:151`) is
`pack === 'core' ? 'kai-core' : \`kai-${pack}\``, so only the `@<marketplace>`
segment can churn; and reused arm A4 requires the literal anyway. Zero rename
exposure on the six backticked occurrences. I also confirmed no skill or agent is
named exactly `kai-core` — the 24 core skills are all `kai-core-*` — so A4 cannot
misfire on the remedy word itself.

**P1-4 — a consequence of bullet 12 that nobody has named, routed forward.**
`--gate partial-install` arm B item (v) requires the materialised area tree to
contain no `.kai`, `kai/coordination`, `kai/initiatives`, or `manifest.json`
path. Every area agent body now legitimately contains all four **as prohibition
text**. Arm B must scan generated **keys**, not generated **bodies** — a content
scan goes red on the one block that exists to forbid them, and the obvious "fix"
would be to weaken bullet 12. Flagged here rather than written into
`area-plugins-m2-standalone-proof`, which I did not touch.

---

### Also-review 4 — `KAI-CORE-MISSING` collision

**No collision, no softening. Confirmed by reading, then by mechanism.**

- `REFUSAL = 'KAI-CORE-MISSING'` (`scripts/lib/pack-plan.mjs:26`) does not appear
  in the copy — checked across all 34 lines — and reused arm A2 makes that
  mechanical rather than a property of today's wording.
- No `` `contract: `` literal appears; the word `contract` does not occur in the
  copy at all, so arm A3 is satisfied with margin.
- The copy never mentions version skew, so it cannot narrow, soften, or overlap
  the skew arm. The architecture's retained trigger (skew + degraded) is untouched.
- No line of the copy is a verbatim `coreContractLines()` line — I checked the
  longest candidates, including `Never call anything shipped, deployed, or
  verified.` (53 chars, over the 40-char `DEGRADED_QUOTE_MIN`), against the 24
  `kai-core-*` skills. No match; the `shipped` prohibition was deliberately
  written not to reuse the inherits-block phrasing, and that held.
- `degraded-block.txt` shares no full line with the copy and neither is a
  substring of the other, so the three-block occurrence counting is unambiguous.

---

### Findings index

| # | Sev | Finding | Evidence |
|---|---|---|---|
| P1-1 | P1 | `single-shot` and one-`Refuse` assertions confirmed present; must **not** be inherited — invert both | `scripts/lib/pack-plan.mjs:616-618`, `:643-646` |
| P1-2 | P1 | `DEGRADED_OPENERS` reused verbatim fails bullets 1 and 4 and admits `Refuse`; replace with `STANDALONE_OPENERS` | `scripts/lib/pack-plan.mjs:590`, `:637-642` |
| P1-3 | P1 | Derived install literal is wrapped across lines 12→13; a raw `indexOf` check can never fire. Collapse whitespace first | `DELIVERABLE 2026-08-27-2001` §1 b3; `scripts/validate-plugin.mjs:855-861` vs `:864-865` |
| P1-4 | P1 | `--gate partial-install` arm B (v) must scan generated keys, not bodies — bullet 12 puts all four literals in every area agent | `area-plugins-optional-core-architecture.md` gate table; `DELIVERABLE 2026-08-27-2001` §1 b12 |
| P2-1 | P2 | 2400 is hand-picked; replaced with a derivation off `STANDALONE_CLAUSES.length` | `scripts/lib/pack-plan.mjs:581-583` |
| P2-2 | P2 | Recount 2,035 vs stated ~2,038; both hand-computed, immaterial. Re-measure before pinning | `pack-plan.mjs:526-527` (`trimEnd()`) |
| P2-3 | P2 | Scratch-directory literal placement ruled: docs + `workspace-doctor`, never a byte-pinned block | `area-plugins-optional-core-architecture.md` §3; `DELIVERABLE 2026-08-27-2001` §10 |
| P2-4 | P2 | File shape verified against `injectBlocks`/`readBlock`, not just convention — no leading blank line, no BOM | `scripts/lib/pack-plan.mjs:526-527`, `:545-552` |
| P2-5 | P2 | The shared `Tell the operator to install …` opener is **not** a distinguishing tell; do not make it one | `scripts/lib/pack-plan.mjs:590`; `DELIVERABLE 2026-08-27-2001` §3 |
| P2-6 | P2 | `guaranteeBlockErrors()` early-`continue` hides 2 of 3 block faults per agent | `scripts/lib/pack-plan.mjs:1670-1679` |
| P2-7 | P2 | b12 carries **five** path literals under an acceptance line that says "four"; assert the five literals, never a count of four | `DELIVERABLE 2026-08-27-2001` §1 b12; item Acceptance |

---

### Conditions (all bind `area-plugins-m2-mode-selection`; none alters the copy)

1. `STANDALONE_BLOCK_MAX` is **derived** per the Q1 ruling. `DEGRADED_BLOCK_MAX`
   stays 1200 and `degraded-block.txt` stays byte-for-byte unchanged.
2. `standaloneBlockErrors()` implements section (A)+(B)+(C)+(D) as specified. The
   two degraded identity assertions are **inverted**, never inherited.
3. The install literal is derived from `packPluginName('core')` + `MARKETPLACE`,
   matched against a whitespace-collapsed block, asserted **exactly once**, with
   both self-test arms.
4. Re-measure the block before pinning. Over budget returns to
   `principal-product-manager` as a scope decision — never a trim, never a
   constant raised to fit.

### Scope classification of what I did not do

- **`expands-scope`, not built** — a cross-block `blockIdentityErrors()` helper.
  Cleaner in isolation, but it drags `degraded-block.txt` into a diff the accepted
  architecture pins as unchanged. Negatives go in `standaloneBlockErrors()`.
- **`expands-scope`, not built** — an enforced per-bullet cap. It fails four
  delivered bullets and a cap loose enough to pass them yields a useless ceiling.
- **Rejected** — an eighth disclaimer for activity records. Already inside b5's
  "durable coordination", and the disclaimer set is fixed at 5+2 by decision.
- **Not touched** — `scripts/`, `packs/`, `plugin.json`, `agents/`, `skills/`,
  `scripts/lib/*.txt`, `kai/initiatives/**`, and the parallel sibling
  `area-plugins-migration-architecture` and its thread.

---

## HANDOFF 2026-08-27-2015 — principal-swe-infra -> none (item complete)

- did:       Performed the declared `doc-review` on `DELIVERABLE 2026-08-27-2001` §1 and ruled the two routed implementation questions. **Q1:** verified `DEGRADED_BLOCK_MAX = 1200` exists (`pack-plan.mjs:583`) and is enforced (`:630-633`, `validate-plugin.mjs:427-433`, self-test `pack-preview.mjs:479-481`); upheld the steward's reasoning that it does not transfer, rejected 2400 as hand-picked, and ruled `STANDALONE_BLOCK_MAX = STANDALONE_PROSE_ALLOWANCE + STANDALONE_CLAUSE_COST * STANDALONE_CLAUSES.length` = 320 + 160×16 = **2880**, derived from the same clause table the linter iterates. Hand-recounted the copy at **2,035** characters — it fits, with 845 spare, and fits 2400 too. **No required clause dies; nothing returns to the steward.** **Q2:** verified both trap assertions (`:616-618` `single-shot`, `:643-646` exactly-one-`Refuse`), ruled them inverted rather than inherited, and found a third hazard the steward did not name — `DEGRADED_OPENERS` (`:590`) fails bullets 1 and 4 and admits `Refuse`, so the opener set must be replaced. Specified `standaloneBlockErrors()` in full: 7 reused arms, 2 inverted arms, a 16-entry clause table, and the three-way distinguishability matrix. Ruled the A1(ii) mechanism, catching that the derived install literal is wrapped across lines 12→13 and that the existing raw-`indexOf` precedent would produce a check that can never fail. Wrote no production code and created no `scripts/lib/*.txt`.
- state:     completed
- needs:     nothing. The four conditions bind `area-plugins-m2-mode-selection` (WS-3) and are specified here so WS-3 does not re-derive the trap.
- artifacts: `kai/coordination/threads/area-plugins-m2-standalone-copy.md` (REVIEW 2026-08-27-2015 — this entry); `kai/coordination/items/area-plugins-m2-standalone-copy.md` (version 6, `completed`, lease cleared, `completed_reviews` populated)
- evidence:  `scripts/lib/pack-plan.mjs:26` (`REFUSAL`), `:151` (`packPluginName`), `:44`/`:531`/`:538` (block wiring), `:526-527` (`readBlock` + `trimEnd`), `:545-552` (`injectBlocks`), `:581-583` (`DEGRADED_BLOCK_MAX` + its "raising it is a decision" comment), `:586` (`DEGRADED_QUOTE_MIN`), `:590` (`DEGRADED_OPENERS`), `:608-663` (`degradedBlockErrors`, all arms), `:1643-1701` (`guaranteeBlockErrors`); `scripts/validate-plugin.mjs:427-433` (enforcement), `:855-861` (derive-and-assert precedent), `:864-865` (whitespace-collapse precedent), `:886-908` (fragment-pin precedent); `scripts/pack-preview.mjs:456-500` (self-test arms); `scripts/lib/migration-doctor.mjs:44`/`:56` (import direction + `MARKETPLACE`); `scripts/lib/degraded-block.txt`, `preflight-block.txt`, `inherits-block.txt` read verbatim; `kai/coordination/threads/area-plugins-optional-core-architecture.md` §1-§3, §5, gate table, relaxation ledger. **All counts are hand-computed and `reported` — no shell in this session, so nothing here was executed or `observed` by measurement.**
- questions: none. Q1 did not force a scope decision, so no QUESTION was classified and `waiting_on_questions` stays empty.
- next:      none. `state: completed`, `next_role: null` — this clears `area-plugins-m2-mode-selection`'s `depends_on: {item: area-plugins-m2-standalone-copy, requires: completed}` edge.

