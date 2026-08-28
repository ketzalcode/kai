# Thread — area-plugins-design-output-contract

Append-only communication log mirroring
`kai/coordination/items/area-plugins-design-output-contract.md`. Never edited
after the fact — only appended. See `kai-core-work-coordination`.

**Environment limit (2026-08-27-2113):** no agent in this session has a shell, so
`kai/initiatives/workspace-corpus-contract/` cannot be created. Until one
operator `mkdir` runs, **this thread is the durable record of the design-output
contract.**

---

## DECISION 2026-08-27-2113 — principal-product-manager (steward) — DESIGN-OUTPUT CONTRACT

Binding process contract for operator concern **#9**. Authored by the steward
because destination policy is a corpus and scope decision. **Interaction design
itself remains `principal-product-designer`'s** — nothing here touches how a
design is made, only where it lands.

### 0. Grounding — the paths already exist; what is missing is a hole and an enforcer

I checked what the designers are actually told before assuming they are told
nothing. Verified this session from `C:\src\kai`:

| source | what it already says |
|---|---|
| `skills/ui-mockup/SKILL.md:135-167` | Tier-0 ASCII lives inline in the design artifact. HTML drafts render to `.kai/runs/product/<YYYY-MM-DD>/<NN>-mockups-<target-slug>/options.html`; the human-reviewed mock is committed to `kai/initiatives/<slug>/artifacts/designs/<item-id>-mockups/options.html` and referenced from `.../designs/<item-id>.md`. Screenshots stay in the run folder. |
| `kai-core-workspace-conventions/SKILL.md:320,338` | Both paths again, as canonical `artifact_target` rows. |
| `principal-product-designer.agent.md:66` | Sets `artifact_target` to `kai/initiatives/<slug>/artifacts/designs/<item-id>.md`. |
| `principal-brand-designer.agent.md:153,157` | Ad-hoc to `.kai/runs/product/<date>/<NN>-brand-<slug>/brand-exploration.md`; initiative-owned to `kai/initiatives/<slug>/artifacts/brand/<item-id>.md`. |
| `.gitignore` | `/.kai/runs/` ignored, so the ad-hoc lane is already private. |

**So the honest finding is: the canonical paths are already defined and both
designers already follow them.** "Designers place mocks randomly" is not caused
by missing conventions. It is caused by **two real holes and zero enforcement**,
and those are what this contract fixes.

**Hole 1 — an unaffiliated durable design has no home.**
`kai-core-workspace-conventions` says unaffiliated durable work goes to
`kai/library/<type>/`. `kai/library/README.md:32-42` lists eleven types —
`reviews`, `dev-designs`, `investigations`, `briefings`, `qa-findings`,
`lessons`, `digests`, `learnings`, `releases`, `playbooks`, `content` — and
**none of them is design.** `dev-designs` is engineering/architecture decisions,
not product design. So a designer with a durable design and no initiative is
told to promote to a type that does not exist. **That is precisely the moment an
agent invents a path**, and no amount of restating the other rules fixes it.

**Hole 2 — binaries can enter the committed tree.** `.gitignore` excludes
`*.mp3`, `*.har`, `*.zip`, `audio/`, `raw/`, and `screenshots/` under
`kai/library/**`, and `**/storageState*.json` globally — but **nothing under
`kai/initiatives/**`.** `ui-mockup:166` says screenshots stay in the run folder;
that is prose, and a committed
`kai/initiatives/<slug>/artifacts/designs/<item-id>-mockups/screenshots/*.png`
would sail through today.

**Hole 3 — nothing validates placement.** No check anywhere notices an
`options.html` in the wrong place.

### 1. Three destinations, chosen by two questions

**Q1 — Is this bound to a work item in an initiative?**

If yes, it is **initiative-owned** and committed:

| output | canonical path |
|---|---|
| Product design decision | `kai/initiatives/<slug>/artifacts/designs/<item-id>.md` |
| Its mockups (HTML tiers) | `kai/initiatives/<slug>/artifacts/designs/<item-id>-mockups/options.html` |
| Brand / visual identity | `kai/initiatives/<slug>/artifacts/brand/<item-id>.md` |
| Product surface map | `kai/initiatives/<slug>/artifacts/product-map.md` |
| Design system | `kai/initiatives/<slug>/artifacts/design-system.md` |
| Design-system extract (observed visual facts) | `kai/initiatives/<slug>/artifacts/design-system-extract.md` |

Tier-0 ASCII options produce **no files**; they live inline in the design
artifact's `## Options considered`. Unchanged from `ui-mockup`.

**Q2 — No initiative. Is this a throwaway exploration or a durable outcome?**

| case | canonical path | git |
|---|---|---|
| **Ad-hoc / private / in-progress** | `.kai/runs/product/<YYYY-MM-DD>/<NN>-<flavor>-<target-slug>/` where `<flavor>` is a registered area flavor (`mockups`, `brand`, `strategy`, …) | ignored |
| **Durable and worth reuse** | **`kai/library/designs/<YYYY-MM-DD>-<descriptor>/`** with library frontmatter | committed text |

`.kai/runs/product/` is **the only legal scratch destination for design work.**
Not "a" scratch destination — the only one.

**The `kai/library/designs/` row is the one addition this contract makes**, and I
am naming it as an addition rather than smuggling it in. Justification: without
it, "exactly one destination for every case" is false, and a contract with a
known hole trains people to route around it. It is one row in
`kai/library/README.md` and one lane created on first write, consistent with how
every other library type already works.

### 2. Never

- the calling agent's cwd, Copilot session-state, or any temp directory;
- a repository-root `design/`, `designs/`, `mockups/`, `mocks/`, or `ux/` folder;
- `docs/` — that is the technical writer's shipped documentation surface, not a
  design lane;
- a second `options.html` anywhere outside the `<item-id>-mockups/` folder;
- `kai/library/**` **before** the steward approves promotion (`kai/library/` is
  for promoted outcomes, never a first destination);
- any path chosen because the right one was unclear. See §5.

### 3. Binaries never enter the committed tree

Screenshots, screen recordings, `.har` captures, `storageState*.json`, design-tool
exports, and any other heavy binary stay in `.kai/runs/`. The committed artifact
**references them by exact run path** rather than carrying them.

This is already the stated intent (`ui-mockup:166`, and the "promote the text,
not the binaries" rule) and it is already enforced under `kai/library/**`. The
gap is `kai/initiatives/**`. **Routed to `principal-swe-infra`:** extend the
managed `.gitignore` block from `kai-core-workspace-onboarding` to cover the same
binary patterns under `kai/initiatives/**`. I am stating the requirement, not
writing the glob.

### 4. Promotion stays one-way and steward-approved

```text
.kai/runs/  ->  kai/initiatives/<slug>/artifacts/  ->  kai/library/
```

Unchanged from `kai-core-workspace-conventions`. Two design-specific conditions:

- A mockup is promoted from a run folder to the committed tree **only after the
  human option pick is recorded** — `ui-mockup` already requires the
  `Human confirmation: <picked by operator | delegated>, <timestamp>` line, and
  this contract makes that line the promotion gate rather than a formality.
- Promotion to `kai/library/designs/` is steward-approved and recorded in the
  source initiative's `deliverables.md`, exactly as every other library promotion
  is.

### 5. Every design artifact is item-bound or run-bound. If neither, stop and ask.

The rule that actually prevents invention:

> If a designer cannot name either an `<item-id>` or a run folder, they do not
> choose a path. They stop and ask the steward for an item.

An unplaceable design is almost never a filing problem — it is a design running
ahead of a decision about whether the work exists. Inventing a path hides that;
asking surfaces it. This is the same discipline `kai-core-scope-discipline`
applies to findings, pointed at destinations.

### 6. Validation — routed to infra, specified here

`workspace-doctor` gains three checks:

1. **Stray mockups.** Any `options.html` outside
   `kai/initiatives/*/artifacts/designs/*-mockups/` or
   `.kai/runs/product/*/*/` is reported with the canonical destination it should
   have used.
2. **Committed binaries.** Any file with a binary extension under
   `kai/initiatives/*/artifacts/designs/**` or `.../brand/**` is reported.
3. **Designer `artifact_target` shape.** Any item whose `next_role` is
   `principal-product-designer` or `principal-brand-designer` and whose
   `artifact_target` does not match the canonical pattern for its kind is
   reported.

Same **warn-then-error** rollout as the backlog contract, for the same reason:
existing workspaces contain files we did not write.

### 7. Documentation shape — one authoritative statement, three pointers

Today the paths are stated in four places (`ui-mockup`,
`kai-core-workspace-conventions`, and both designer agents). Four statements is
three opportunities to drift.

- **`kai-core-workspace-conventions` is authoritative.** It already carries the
  canonical-path table; the three destinations and two questions go there.
- `ui-mockup`, `principal-product-designer`, and `principal-brand-designer`
  **point at it** instead of restating it.
- **Bounded edit rule for the two agent bodies:** the only permitted change is the
  placement pointer. No persona, judgment, procedure, example, or prose is
  redesigned. This is the same bounded-exception discipline as scope-brief A1,
  and a body edit that exceeds it is out of scope and escalates.

### 8. What this contract deliberately does not do

- **No new fidelity tiers, no mock-kit changes, no design-process changes.**
  `ui-mockup`'s options gate, human-confirmation requirement, and tier selection
  are untouched.
- **No new artifact types** beyond the one `kai/library/designs/` lane in §1.
- **No per-designer destinations.** Product design and brand design already have
  distinct initiative lanes (`designs/`, `brand/`); that is sufficient.
- **No enforcement of design *content*.** Whether a mock is good is the
  designer's judgment and the steward's acceptance — not a path check.

### 9. Success measure

> A designer never chooses a path, and a doctor run can find any design that
> landed off-contract.

Falsifiable: today the initiative-owned and ad-hoc paths are defined and followed
(**2 of 3 cases covered**), the unaffiliated-durable case has **no destination**,
and off-contract placement detection is **0 checks**. Target: 3 of 3 cases have
exactly one destination; stray-placement checks: 3; committed design binaries: 0.

---

## HANDOFF 2026-08-27-2113 — principal-product-manager (steward) -> director-chief-of-staff

- did:       Authored the binding **Design-output contract** (9 sections) after checking what the designers are actually told today rather than assuming the conventions were missing. Found that `ui-mockup:135-167`, `kai-core-workspace-conventions:320,338`, `principal-product-designer:66`, and `principal-brand-designer:153,157` already define and follow the initiative-owned and ad-hoc paths — so the fix is **not** more path documentation. Identified the three real holes: the unaffiliated-durable case has no destination at all because `kai/library/README.md:32-42` has no design type; the managed `.gitignore` covers heavy binaries under `kai/library/**` but not `kai/initiatives/**`; and nothing validates placement. Specified three destinations behind two questions, an explicit never-list, the binary rule, the promotion gate bound to `ui-mockup`'s existing human-confirmation line, the stop-and-ask rule that prevents invention at its actual trigger point, three doctor checks with a warn-then-error rollout, a one-authoritative-statement documentation shape with a bounded agent-body edit rule, and four non-goals. Named `kai/library/designs/` as the contract's one addition rather than smuggling it in. Created the item at `proposed`.
- state:     proposed (item not promoted — the `workspace-corpus-contract` split needs an operator go)
- needs:     Operator go/no-go on the split, then steward promotion, then implementation by `principal-swe-infra` with `principal-product-designer` on doc-review.
- artifacts: kai/coordination/items/area-plugins-design-output-contract.md (v1, `proposed`); this thread (the contract).
- evidence:  Read 2026-08-27 from `C:\src\kai`. `skills/ui-mockup/SKILL.md:98-104,133-167` ("Where mockups live", the two canonical paths, the reference line, the screenshots-stay-in-runs rule). `skills/kai-core-workspace-conventions/SKILL.md:318-320,338,370-394` (canonical artifact rows, the one-way promotion flow, library destinations). `agents/principal-product-designer.agent.md:7,47,66,95-97,126,151,184-185`. `agents/principal-brand-designer.agent.md:149-157`. `kai/library/README.md:30-42` — eleven types, none design. `.gitignore` — `/.kai/runs/` ignored; binary patterns scoped to `kai/library/**` only; `**/storageState*.json` global; nothing for `kai/initiatives/**`.
- questions: none.
- next:      `director-chief-of-staff` — put the split to the operator. On go: steward promotes, then `principal-swe-infra` implements; `principal-product-designer` reviews the placement pointers to confirm no design judgment was altered.
