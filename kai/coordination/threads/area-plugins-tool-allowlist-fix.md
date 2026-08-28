# Thread — area-plugins-tool-allowlist-fix

Append-only communication log mirroring
`kai/coordination/items/area-plugins-tool-allowlist-fix.md`. Never edited after
the fact — only appended. See `kai-core-work-coordination`.

---

## STEWARD PROMOTION 2026-08-27-2113 — principal-product-manager (steward)

Created and promoted **`proposed -> ready` in one pass** at explicit operator
direction (second revision, point 4: *"promote a bounded fix item — early,
independently shippable, NOT buried in the taxonomy rewrite"*). Priority **1** —
ahead of every other `area-plugins` item including `area-plugins-taxonomy-round-2`
at priority 5.

### Why this gets its own milestone rather than a line in someone else's PR

It is created as **milestone 0 `allowlist-repair`**, the new first milestone (see
scope-brief **A11**). Three reasons, and the third is the one that decides it:

1. **It is a live defect in shipped agents.** Users at `1.0.4` see
   `Unknown tool name in the tool allowlist: "create" / "edit" / "grep"` on
   repeat. Nothing about the area topology needs to be decided for that to be
   worth fixing.
2. **It is genuinely independent.** It needs no taxonomy answer, no optional-core
   contract, and no marketplace decision. It can ship against the stable,
   shipped five-plugin set with exactly one variable moving.
3. **It collides head-on with milestone 2's PR-3.** That PR rewrites the 49
   non-core agent bodies to swap the preflight block for the standalone block.
   This item touches **all 56** root bodies and **all 56** generated mirrors.
   Two whole-fleet rewrites in flight at once means a red `--check` cannot tell
   you which one broke byte parity — the exact attribution failure the
   initiative's phase order exists to prevent (BRIEF ordering ruling, reason 4;
   A3/S2 applied the same rule to the `planPacks()` fix).

**Stated plainly, because a steward should not oversell: this milestone serves
none of the five success measures.** It does not advance the mission. It is here
because it is broken and because it must not be in flight at the same time as
PR-3. That is a sufficient reason for a milestone and an insufficient reason to
pretend it is strategic.

### The milestone-1 carve-out this item depends on

Milestone 1 `decisions-locked` ends with *"No production code, manifest, or
marketplace change has been made"* — and A8 established that the first
production merge makes that line permanently unclaimable. This item **is**
production code, so rather than let it quietly falsify a milestone, scope-brief
**A11** amends the line with a three-clause topology-neutral carve-out.

**The PR must name all three clauses explicitly:**

1. topology-neutral — no `PACKS`, `PACK_ORDER`, `PACKS_DIR`, `MARKETPLACE`,
   `SKILL_OWNER_OVERRIDES`, plugin identity, or marketplace name changes;
2. no `scripts/lib/preflight-block.txt`, `degraded-block.txt`, or
   `inherits-block.txt` content changes;
3. green under the existing gates with `--check` byte parity re-established.

A change that cannot claim all three is not exempt and escalates to the steward.
This is not paperwork — it is what stops "one small fix" from becoming the
loophole through which milestone 1's bar quietly disappears.

### Two things the steward will hold this item to at acceptance

**1. Do not silently drop a capability.** The tempting fix is to delete every
rejected token and move on. If `"create"` is rejected and there is no accepted
equivalent, then some agent that writes new files has just lost the ability to
write new files, and it will discover that mid-task in front of a user. **Where a
rejected token has no accepted replacement, say so in the record and name the
capability at risk.** A capability change is a scope question and comes back to
me before it is applied.

**2. `reported` is not `observed`.** No agent in the authoring session has a
shell. A claim that the warnings are gone, made without running the host, is
`reported`. Label it. `shipped` still requires the operator to deploy and verify
(`kai-core-work-coordination`), and this item reaching `shipped` on a `reported`
absence would be exactly the false durability claim this initiative's honesty
non-negotiables exist to prevent, pointed inward.

### Grounded touch surface

Verified this session from `C:\src\kai` by search:

- All **56** root `agents/*.agent.md` carry a `tools:` line.
- All **56** generated `packs/*/agents/*.agent.md` carry one too — `kai-core` 7,
  `kai-engineering` 20, `kai-gtm` 11, `kai-product` 9, `kai-personal` 9.
- The tokens `"create"`, `"edit"`, `"grep"`, `"view"`, and `"glob"` all appear
  across those declarations, consistent with the reported warnings.
- **Touch surface: 112 files**, bound together by `pack-preview --check` byte
  parity. The generated half is not optional collateral — it is the half users
  actually install.

The **schema itself is not established** by this note. A parallel `research`
consultation is producing the current Copilot CLI custom-agent tool schema from
live evidence; consume its findings and cite them. Do not repair 112 files
against a remembered token list.

### Sequencing note for the director

While this item is open, any other work proposing to touch `agents/**` or
`packs/**/agents/**` routes through `principal-swe-manager` for sequencing.
`area-plugins-m2-mode-selection` is the known collision and is currently gated
behind two unmet dependencies, so no conflict is live today.

---

## HANDOFF 2026-08-27-2113 — principal-product-manager (steward) -> principal-swe-infra

- did:       Created `area-plugins-tool-allowlist-fix` and promoted it `proposed -> ready` at v1, priority 1, `owner: null`, all five lease fields null, in the new milestone 0 `allowlist-repair`. Wrote eight acceptance criteria covering live-evidence schema establishment, complete 112-file enumeration, portable replacement with explicit capability-loss disclosure, frontmatter-only body edits, regenerated trees with `--check` byte parity, the three-clause topology-neutral carve-out, honest `reported` vs `observed` labelling, and a considered (not assumed) regression guard. Recorded the binding sequencing constraint against milestone 2's PR-3.
- state:     ready
- needs:     `principal-swe-infra` picks this up on dispatch. Establish the schema from the parallel `research` consultation's live evidence before touching any file. Enumerate all 112 declarations and show the enumeration. If any rejected token has no accepted equivalent, **stop and route the capability question to the steward** rather than deleting it.
- artifacts: kai/coordination/items/area-plugins-tool-allowlist-fix.md (v1, `ready`); this thread; kai/coordination/threads/area-plugins-scope-brief.md (A11 — the milestone and the carve-out).
- evidence:  Read 2026-08-27 from `C:\src\kai`. `^tools:` matches 56 files under `agents/`; `^tools: .*"(create|edit|grep|view|glob)"` matches 56 files under `packs/*/agents/`, distributed 20 engineering / 11 gtm / 9 product / 9 personal / 7 core. Example declarations read verbatim: `agents/principal-product-manager.agent.md:4` — `tools: ["bash", "shell", "edit", "view", "grep", "glob", "ask_user", "skill"]`; `agents/creative-video-director.agent.md` — `tools: ["view", "edit", "create", "grep", "glob", "ask_user", "bash", "shell", "task", "read_agent", "write_agent", "skill"]`. No host was executed and no warning was observed by this role: the defect is `reported` from the operator, and the schema is not yet established.
- questions: none blocking. One flagged: if the accepted schema turns out to have no equivalent for a rejected token, that is a capability question for the steward, not an editorial one.
- next:      `principal-swe-infra` — implement, with `principal-swe-architect` on independent-architecture review. This must reach `shipped` before `area-plugins-m2-mode-selection` (milestone 2, PR-3) opens.

---

## DIAGNOSIS 2026-08-27-2138 — principal-swe-infra

Lease verified before any state-changing write: record `version: 2`,
`lease.holder: principal-swe-infra`, `lease.token: apx-tool-20260827-2130-n2`,
`lease.version_at_grant: 1` — all four match the dispatch grant. No collision.

**Environment limit, stated up front because it is also evidence.** This session
has **no shell**. `node`, `npm`, `git`, `gh` cannot be executed; `npm test` and
`pack-preview --check` were **not run**. Every execution claim below is
`reported`. Claims marked `observed` are first-hand reads of files on disk or
first-hand facts about this session's own bound toolset — nothing else.

**No `agents/**` or `packs/**` file was edited in this pass.** Per the dispatch
STOP CONDITION, and because the evidence below makes the naive fix the dangerous
one.

---

### 1. Verdict on the decisive question: **no capability loss from the allowlist. The warnings are cosmetic.** Confidence: **high.**

The dispatch asked whether the WARNED set and the CAPABILITY-LOSS set are
disjoint. They are. Both directions are settled by evidence, not inference.

**Direction 1 — a warned name is not a denied name. `observed`, first-hand.**

I am `principal-swe-infra`. My declaration, read from disk this session:

```
agents/principal-swe-infra.agent.md:4
tools: ["bash", "shell", "view", "edit", "create", "grep", "glob", "skill"]
```

My actually-bound toolset this session, read from my own function schema:

```
view, create, edit, grep, glob        <- 5 bound
bash, shell, skill                    <- 3 not bound
```

All three warned names — `create`, `edit`, `grep` — are **bound and working**. I
executed `view` and `grep` repeatedly to produce this record; they returned real
file content. `create` and `edit` are present in the schema, and the dispatch's
observation (i) independently confirms `create` executes and fails only with its
own legitimate `Parent directory does not exist`.

> If the warning indicated denial, a warned tool would be absent.
> All three warned tools are present and functional.
> ∴ **The warning does not indicate denial.**

**Direction 2 — the missing shell is not caused by the allowlist. `inferred`, high confidence.**

Two of the *unwarned* names, `bash` and `shell`, are absent despite both being
declared — the exact portable pair CHANGELOG 0.49.1 established and that
`validate-plugin.mjs:838-870` enforces in both directions. The dispatch's
observation (ii) is the clincher:

> If the allowlist caused the shell absence, an agent that declares **no**
> `tools:` key at all would be unaffected.
> Observation (ii): built-in agent types — which carry no kai frontmatter —
> also had no shell.
> ∴ **The allowlist did not cause the shell absence.**

Corroborating: this session runs under an `agency-plugin-<id>` session host
(`C:\Users\senrique\AppData\Local\agency\plugins\sessions\...`), and its own
environment banner advertises `Available tools: git, curl, gh` — a shell-oriented
statement — while binding no shell tool. That is an **environment/sandbox policy**,
not an allowlist outcome. It is a real defect and it is **a different defect**;
editing `tools:` cannot fix it. 0.49.1 already added `shell` to all 54 eligible
agents and this session still has no shell, which is direct evidence that the
declaration is not the lever.

**Consequence, and it inverts the obvious fix:** the tokens `create`/`edit`/`grep`
are *currently* harmless noise, but **removing them is the move that carries
capability risk**, not keeping them. See §4.

---

### 2. Complete enumeration

**Totals — `observed`, by file read from `C:\src\kai`:**

| surface | files declaring `tools:` |
|---|---|
| root `agents/*.agent.md` | **56** |
| generated `packs/*/agents/*.agent.md` | **56** (eng 20, gtm 11, personal 9, product 9, core 7) |
| **agent subtotal (the item's stated 112)** | **112** |
| root `skills/*/SKILL.md` | **51** |
| generated `packs/*/skills/*/SKILL.md` | **51** |
| **total files declaring a tool allowlist** | **214** |

**Enumeration finding the item does not yet carry:** the surface is **214 files,
not 112.** All 51 root skills and their 51 mirrors also declare `tools:`, and
they declare the same three warned tokens — e.g.
`skills/kai-core-work-coordination/SKILL.md:4 tools: [bash, shell, view, edit, create, grep, glob]`,
`skills/coding-style/SKILL.md:4 tools: [view, grep, glob, edit]`,
`skills/kai-core-contract-v1/SKILL.md:4 tools: [view]`. Whether the host applies
the same allowlist parse to a skill is **unverified** — but any fix scoped to
agents only would leave half the declarations untouched, and the item's
acceptance would be claimable while the condition persisted. Flagged for the
steward; not silently absorbed into scope.

**Third mirror, easy to miss:** `packs/kai-core/scripts/lib/loader-contract.mjs`
is a generated copy of `scripts/lib/loader-contract.mjs` and carries its own
`SUPPORTED_TOOLS` (line 14). Any edit to the contract is a **two-file** edit
bound by the same byte-parity gate.

#### 2a. All 56 root agents — exact declared arrays (`observed`, line 4 of each)

```
creative-video-director            ["view","edit","create","grep","glob","ask_user","bash","shell","task","read_agent","write_agent","skill"]
director-chief-of-staff            ["bash","shell","view","edit","create","grep","glob","ask_user","task","read_agent","write_agent","skill"]
director-executive-assistant       ["bash","shell","view","edit","create","grep","glob","ask_user","task","read_agent","write_agent","skill"]
instructor-path-mentor             ["view","edit","create","grep","glob","ask_user","bash","shell","web_search","skill"]
instructor-teacher                 ["bash","shell","edit","view","grep","glob","ask_user","skill"]
instructor-tutor                   ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","skill"]
persona-professional-nutritionist  ["playwright","bash","shell","edit","create","view","ask_user","skill"]
persona-professional-trainer       ["playwright","bash","shell","edit","create","view","ask_user","skill"]
persona-self                       ["view","edit","create","grep","glob","ask_user","bash","shell","skill"]
persona-ux-first-time-user         ["playwright","bash","shell","edit","create","view","ask_user","skill"]
principal-ai-applied-engineer      ["web_search","web_fetch","view","edit","create","glob","grep","ask_user","skill"]
principal-ai-researcher            ["web_search","web_fetch","view","edit","create","glob","grep","ask_user","skill"]
principal-brand-designer           ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-customer-success         ["bash","shell","view","edit","create","grep","glob","ask_user","skill"]
principal-data-analytics           ["bash","shell","view","edit","create","grep","glob","ask_user","skill"]
principal-data-engineer            ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-demand-generation        ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-engineer-career-mentor   ["view","edit","create","grep","glob","ask_user","bash","shell","web_search","skill"]
principal-growth                   ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-linkedin-strategist      ["view","edit","create","grep","glob","ask_user","bash","shell","task","read_agent","write_agent","skill"]
principal-partnerships             ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-pricing-monetization     ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-privacy-compliance       ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-product-designer         ["playwright","bash","shell","view","create","edit","grep","glob","ask_user","skill"]
principal-product-manager          ["bash","shell","edit","view","grep","glob","ask_user","skill"]
principal-product-marketing        ["playwright","bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-product-strategist       ["bash","shell","edit","view","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-qa-ui                    ["playwright","bash","shell","edit","create","view","grep","glob","ask_user","skill"]
principal-revenue-operations       ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-sales                    ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-security                 ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-seo                      ["playwright","bash","shell","edit","create","view","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-solutions-architect      ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-sre                      ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-swe-architect            ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
principal-swe-backend              ["bash","shell","view","edit","create","grep","glob","skill"]
principal-swe-frontend             ["bash","shell","view","edit","create","grep","glob","skill"]
principal-swe-infra                ["bash","shell","view","edit","create","grep","glob","skill"]
principal-swe-manager              ["bash","shell","edit","create","view","grep","glob","ask_user","skill"]
principal-technical-writer         ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
workflow-course-to-audio           ["playwright","bash","shell","edit","view","ask_user","skill"]
workflow-customer-feedback         ["bash","shell","view","edit","create","grep","glob","ask_user","skill"]
workflow-doc-review                ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
workflow-experiment-review         ["bash","shell","view","edit","create","grep","glob","ask_user","skill"]
workflow-incident-response         ["bash","shell","view","edit","create","grep","glob","ask_user","task","read_agent","write_agent","web_search","web_fetch","skill"]
workflow-initiative-init           ["bash","shell","view","edit","create","grep","glob","ask_user","skill"]
workflow-issue-analysis            ["bash","shell","view","grep","glob","ask_user","web_search","web_fetch","skill"]
workflow-localization              ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
workflow-proactive-scan            ["bash","shell","view","edit","create","grep","glob","skill"]
workflow-product-explore           ["playwright","bash","shell","view","edit","grep","glob","ask_user","skill"]
workflow-pull-request              ["bash","shell","view","edit","create","grep","glob","ask_user","skill"]
workflow-self-check                ["bash","shell","edit","view","grep","glob","ask_user","skill"]
workflow-ship                      ["bash","shell","view","edit","create","grep","glob","ask_user","web_search","web_fetch","skill"]
workflow-support-triage            ["bash","shell","view","edit","create","grep","glob","ask_user","skill"]
workflow-weekly-pulse              ["bash","shell","view","edit","create","grep","glob","ask_user","web_fetch","web_search","skill"]
workflow-workspace-init            ["bash","shell","view","edit","create","grep","glob","ask_user","skill"]
```

#### 2b. All 56 generated mirrors — `tools:` line byte-identical to root (`observed`)

Every mirror's line 4 was read and compared against its root counterpart. **All
56 match exactly**, so the arrays above are the complete enumeration for both
halves. Mirror paths, grouped by pack:

- `packs/kai-core/agents/` (7): director-chief-of-staff, director-executive-assistant, workflow-initiative-init, workflow-proactive-scan, workflow-self-check, workflow-weekly-pulse, workflow-workspace-init
- `packs/kai-engineering/agents/` (20): principal-ai-applied-engineer, principal-ai-researcher, principal-data-engineer, principal-privacy-compliance, principal-qa-ui, principal-security, principal-solutions-architect, principal-sre, principal-swe-architect, principal-swe-backend, principal-swe-frontend, principal-swe-infra, principal-swe-manager, principal-technical-writer, workflow-doc-review, workflow-incident-response, workflow-issue-analysis, workflow-localization, workflow-pull-request, workflow-ship
- `packs/kai-gtm/agents/` (11): principal-customer-success, principal-demand-generation, principal-growth, principal-linkedin-strategist, principal-partnerships, principal-pricing-monetization, principal-product-marketing, principal-revenue-operations, principal-sales, principal-seo, workflow-support-triage
- `packs/kai-personal/agents/` (9): creative-video-director, instructor-path-mentor, instructor-teacher, instructor-tutor, persona-professional-nutritionist, persona-professional-trainer, persona-self, principal-engineer-career-mentor, workflow-course-to-audio
- `packs/kai-product/agents/` (9): persona-ux-first-time-user, principal-brand-designer, principal-data-analytics, principal-product-designer, principal-product-manager, principal-product-strategist, workflow-customer-feedback, workflow-experiment-review, workflow-product-explore

**Required step this session cannot perform (`reported`, not `observed`):** the
mirrors are byte-derived from root. Any root `tools:` edit must be followed by
regeneration (`pack-preview`) or `pack-preview --check` byte parity fails. That
command was **not run**.

#### 2c. Frequency table — every declared identifier across the 56 root agents

| identifier | agents declaring | warned by host? |
|---|---:|---|
| `view` | 56 | no |
| `skill` | 56 | no |
| `edit` | 55 | **YES** |
| `bash` | 54 | no |
| `shell` | 54 | no |
| `grep` | 52 | **YES** |
| `glob` | 52 | no |
| `ask_user` | 52 | no |
| `create` | 49 | **YES** |
| `web_search` | 28 | no |
| `web_fetch` | 25 | no |
| `playwright` | 9 | no |
| `task` | 5 | no |
| `read_agent` | 5 | no |
| `write_agent` | 5 | no |
| `session_store_sql` | 0 (skills only) | n/a |

Where the three warned names do **not** appear:

- **`edit` absent (1):** `workflow-issue-analysis`.
- **`create` absent (7):** `instructor-teacher`, `principal-product-manager`,
  `principal-product-strategist`, `workflow-course-to-audio`,
  `workflow-issue-analysis`, `workflow-product-explore`, `workflow-self-check`.
- **`grep` absent (4):** `persona-professional-nutritionist`,
  `persona-professional-trainer`, `persona-ux-first-time-user`,
  `workflow-course-to-audio`. (`glob` is absent on exactly the same 4.)

`bash`/`shell` are absent on exactly 2 — `principal-ai-applied-engineer` and
`principal-ai-researcher` — which reproduces CHANGELOG 0.49.1's "54 of 56"
figure and confirms the portable-pair rule is intact repo-wide.

**The shape that matters:** `view` (56) and `glob` (52) are *not* warned while
`edit` (55), `grep` (52) and `create` (49) are. The split does not follow
frequency, does not follow pack, and does not follow the file-tool family. It
follows something in the host, which is §3.

---

### 3. Root cause

The repo's contract and the live host disagree because **they are describing two
different things, and the contract claims to describe both.**

```
  DECLARED (frontmatter)                    HOST                                  THIS SESSION
  ----------------------                    ----                                  ------------
  agents/principal-swe-infra.agent.md
  tools: ["bash","shell","view","edit",
          "create","grep","glob","skill"]
            |
            v
   +--------------------------+
   |   ALLOWLIST VALIDATOR    |   vocabulary V_a
   |   name in V_a  -> accept |
   |   name not in  -> WARN   |----> 'Unknown tool name in the tool
   +--------------------------+       allowlist: "create" / "edit" / "grep"'
            |
            |  warned names are NOT denied   <-- observed
            v
   +--------------------------+
   |  RUNTIME TOOL REGISTRY   |   vocabulary V_r
   |  x  environment policy   |   (sandbox decides shell/MCP/web)
   +--------------------------+
            |
            v
   BOUND:   view  create  edit  grep  glob      <-- all 3 warned names PRESENT
   UNBOUND: bash  shell  skill                  <-- none of them warned

   SUPPORTED_TOOLS (scripts/lib/loader-contract.mjs:14)
     = a hand-maintained union of V_a and V_r, with no link to either.
       CI proves agents agree with THIS LIST. Nothing proves the list
       agrees with the HOST.
```

**Most probable cause (`inferred`, moderate-to-high confidence):** the host keeps
a separate **allowlist validator vocabulary** (`V_a`, what the frontmatter parser
recognises) and **runtime tool registry** (`V_r`, what gets bound). `create`,
`edit` and `grep` are absent from `V_a` but present in `V_r` and granted
regardless of the declaration — most likely because the file/content tools are a
**base set granted to every custom agent**, so the allowlist was never meant to
name them. That single mechanism explains all four observations: the three
warnings, the three grants, the silence on `view`/`glob`, and the silence on
`bash`/`shell`.

**Second candidate, not excluded:** the allowlist **fails open** — unknown names
are dropped from the filter rather than denied, and a default toolset is bound.
Indistinguishable from the base-set theory using repo evidence alone. Both yield
the same consequence, which is why the consequence is high-confidence while the
mechanism is not.

**`SUPPORTED_TOOLS` is stale — but that is a symptom, not the cause.** It was
built empirically (0.49.1 measured `bash` vs `shell` on Windows; 0.63.1 added
`skill` after measuring delegated agents) and never re-measured. CHANGELOG 0.49.1
records that an agent declaring `bash` received `view, skill, sql` **and nothing
else** — no `create`/`edit`/`grep`/`glob`. So on that older build the file tools
were *not* base-granted. Either the host changed between then and now, or that
agent's declaration differed. **I cannot reconstruct which**, and I am not going
to pretend otherwise. It does not change the current verdict: what governs the
current fix is the current binding, and the current binding is first-hand.

**The load-bearing defect in the contract is a comment, not a list.**
`scripts/lib/loader-contract.mjs:3-4` says it is *"the single source of truth for
how a Copilot host parses and accepts an agent/skill's frontmatter."* It is not,
and it structurally cannot be — it is a source of truth for **what this repo
declares**. That sentence is what turned an unverified list into a CI-enforced
certainty and is the reason a 112-file rename looked reasonable. Fixing it is two
lines. It is **not in this item's `touches`**, so I did not write it — see
PROPOSAL-1.

---

### 4. The portable replacement, and how it gets verified before it ships

**Neither branch may be applied on current evidence.** The gap is narrow and
specific: I know what is *bound*; I do not know what `V_a` *accepts*.

#### Branch A — the three names are genuinely invalid in the current CLI

Applies **only** if the operator verification (§8) shows that omitting the tokens
**removes** the tools.

- The tokens are load-bearing. Replace, never delete.
- **Blocked until the accepted names are known.** No rename may be authored from
  memory. `Q-...-01` step 4 is what supplies them; if it yields no accepted name
  for a token, that token is a **capability-loss disclosure** (§5), which is a
  scope question for the steward, not an editorial one.
- Sequence, once names are known: root `agents/**` (56) -> regenerate mirrors ->
  `pack-preview --check` -> `--gate partition|collision|partial-install|version-skew`
  -> `validate-plugin` -> `release-guard`. Then the **same** decision for the 102
  skill declarations (§2), which is a separate steward call.
- `SUPPORTED_TOOLS` and its `packs/kai-core` mirror update in the same PR, or CI
  rejects the corrected agents.

#### Branch B — the names are valid-but-warned / cosmetic *(what current evidence favours)*

Applies if the verification shows the tools are bound **regardless** of declaration.

- **Change nothing in `agents/**` or `packs/**`.** 112 files stay untouched.
- Rationale: the tokens are already inert. Deleting them buys a quieter log and
  **spends real capability risk** — `SUPPORTED_TOOLS` and the shipped agents are
  consumed by more than this one host (the older CLI in 0.49.1 *did* gate on the
  allowlist, and 0.63.1 proved a `task`-delegated agent receives **only** its
  declared tools). Strip `create` from 49 agents and, on any surface that still
  gates, 49 agents silently lose file creation. **The naive fix is more dangerous
  than the defect it fixes.**
- What ships instead is small and honest: correct the false "single source of
  truth" comment (PROPOSAL-1) and record the measured behaviour in the CHANGELOG
  the way 0.49.1 and 0.63.1 did, so the next engineer does not re-litigate this.
- The warnings remain. **That is the recommendation, and it is a scope change to
  the item's stated Outcome** ("the repeated runtime warnings ... stop"), so it
  goes to the steward rather than into a diff — see PROPOSAL-2.

**Recommendation: Branch B, pending verification.** Every first-hand observation
this session points at it. It is not certain enough to skip §8.

---

### 5. Capability-loss disclosure rule (binding on whoever applies either branch)

The item requires that removing a rejected token must not silently strip an
ability. A blind `sed` over 112 files cannot satisfy that, because it produces
one diff and zero statements about 56 agents. The rule:

1. **Per-agent, per-token, never fleet-wide.** For each of the 56 agents, list
   each token being changed and state one of: `replaced -> <accepted name>` /
   `removed, capability retained (base-granted, evidence: <ref>)` /
   `removed, CAPABILITY LOST: <what this agent can no longer do>`.
2. **Any row in the third class stops the PR.** It routes to the steward before
   application, per the steward's standing instruction. It is not a diff comment.
3. **Name the agent's affected behaviour, not the tool.** "`principal-swe-infra`
   can no longer write a new IaC module" — not "`create` removed".
4. **`requires_tools` is checked first.** `validate-plugin.mjs:648-672` fails any
   agent that inherits a skill whose `requires_tools` names a tool the agent
   omits. Six skills declare `requires_tools`, all `[bash, shell]`, so the three
   warned tokens are unconstrained by that gate today — meaning **CI will not
   catch a capability loss here.** The disclosure table is the only guard.
   (`observed`: `skills/{create-product-demo,demo-zoom,demo-capture,demo-narrate,kai-core-fleet-observation,kai-core-work-activity}/SKILL.md:5`.)
5. **The 0.63.1 rule is the precedent and the warning.** `skill` had to be
   declared explicitly because a `task`-delegated agent receives **only** its
   declared tools. Any token removed under a "the host grants it anyway"
   assumption must be checked against the delegated path too, not just the
   directly-launched one.

---

### 6. Sequencing

**The constraint stands as the steward wrote it: this item is `shipped` before
`area-plugins-m2-mode-selection` (milestone 2, PR-3) opens.** The infra reason:

- `pack-preview --check` is a **single boolean over byte parity** for 56
  generated files. With one whole-fleet rewrite in flight, red names the broken
  file *and* the cause. With two, it names the file only.
- Worse than red is **green-and-wrong**: both halves regenerate from the same
  root, so a mistaken root edit reproduces faithfully into the mirror and byte
  parity is *satisfied*. Parity proves the generator ran, not that the content is
  right. Two concurrent rewrites remove the only remaining attribution signal.
- The merge surface is **112 hand-resolved conflicted files**. A mis-resolution
  that regenerates cleanly passes every gate in the repo. No test in `test/`
  catches it.

**Consequence of the verdict the steward should see:** if Branch B holds, this
item stops being a whole-fleet rewrite — it touches zero agent bodies. **The
collision with PR-3 dissolves and milestone 2 unblocks earlier than planned.**
That is a real scheduling gain and it is contingent on §8, not on preference. If
Branch A holds, the ordering is unchanged and binding.

---

### 7. CI implication — the gate is green on a configuration the host complains about

`SUPPORTED_TOOLS` is enforced per entry by `loaderErrors`
(`scripts/lib/loader-contract.mjs:94`), by `validate-plugin.mjs:650`, and by
`host-contract.mjs` including a dedicated `unsupported-tool.agent.md` rejection
fixture. `test/README.md:41-45` states the intent plainly: *"so a shipped agent
never silently loses a capability."*

**That guarantee does not hold, and the failure is structural.** The gate proves
agents agree with **a hand-maintained list**. Nothing proves the list agrees with
the **host**. It is a claim about an external system with no evidence link to
that system — so it can only ever be as fresh as the last time someone measured,
and nothing makes staleness visible. This defect reached users at `1.0.4` with CI
fully green, and was found by a **user reading log noise**. That is the finding:
the class is not "three wrong names", it is **an unfalsifiable assertion wearing
a CI gate's uniform**.

Three ways to close it, cheapest first. All three add a gate or change a
contract, so under `kai-core-scope-discipline` all three are `expands-scope` and
are **proposals, not commits** — consistent with acceptance box 8's own
"adding a gate is not automatically in scope".

1. **Stop the false claim (zero cost, highest value).** Amend the
   `loader-contract.mjs:3-4` header so it states what it is: the source of truth
   for what this repo *declares*, and a **dated, measured** record of host
   behaviour — not the source of truth for host parsing. Two lines, two files
   (root + `packs/kai-core` mirror). This is PROPOSAL-1.
2. **Make staleness visible (low cost).** Annotate each `SUPPORTED_TOOLS` entry
   with how and when it was verified (`measured, CLI vX.Y, YYYY-MM-DD` vs
   `assumed`) and fail `validate-plugin` if any entry is `assumed` or if the
   newest verification predates the CLI version the repo claims to target. This
   converts an unfalsifiable list into a dated claim that can go stale *loudly*.
   It still does not talk to the host.
3. **Actually close the loop (real cost).** A host-backed conformance job that
   launches the real CLI with a probe agent declaring every name in
   `SUPPORTED_TOOLS`, captures stderr, and fails on any `Unknown tool name` line.
   This is the **only** check that would have caught this defect before a user
   did. It needs a CLI binary and credentials in CI — a genuine cost, and
   `test/README.md` already books model-graded/host-backed scenarios as a
   deliberate follow-up. Proposal, not a unilateral add.

Honest bottom line: **only (3) prevents recurrence.** (1) and (2) stop the repo
from *believing* it is protected, which is the more urgent error.

---

### 8. The exact operator verification that settles it

Recorded as `Q-area-plugins-tool-allowlist-fix-01` below. It is one controlled
A/B on a **throwaway agent outside the repo** — it changes no committed file, so
it carries no rollback burden.

---

## PROPOSAL 2026-08-27-2138 — principal-swe-infra -> @operator / principal-product-manager

**PROPOSAL-1 — correct the "single source of truth" comment.**
`scripts/lib/loader-contract.mjs:3-4` claims authority over host parsing that no
file in this repo can hold. That sentence is the root of the false confidence
that made a 112-file rename look safe. Two lines, two files (root +
`packs/kai-core/scripts/lib/loader-contract.mjs`), zero behaviour change.
**Classified `expands-scope`:** `scripts/lib/loader-contract.mjs` is not in this
item's `touches`. Not written. Needs a steward call to add it to scope.

**PROPOSAL-2 — Branch B changes the item's Outcome, so the steward must re-scope
it.** The item's Outcome says the warnings *stop*. If verification confirms
Branch B, the correct engineering answer is that they **do not stop** — they are
inert, and silencing them costs capability risk across 49-55 agents on any
surface that gates. That contradicts the committed Outcome. Per
`kai-core-scope-discipline` this is not mine to redefine in a diff; it returns to
`principal-product-manager` as steward. **Recommended re-scope:** Outcome becomes
"the tool-vocabulary contract stops asserting unverified host behaviour, and the
warnings are documented as benign with the evidence" — which is honest, and
smaller.

**PROPOSAL-3 — the surface is 214 files, not 112.** 51 root skills + 51 mirrors
also declare the warned tokens. Any agent-only fix leaves half the declarations
in the reported-defective state while the acceptance box reads satisfied. Needs a
steward decision on whether skills are in scope for this item or a follow-on.
Not absorbed unilaterally.

---

## QUESTION Q-area-plugins-tool-allowlist-fix-01 2026-08-27-2138 — principal-swe-infra -> @operator
- status: open
- kind: action
- blocking: yes
- context: The repo's `SUPPORTED_TOOLS` says `create`/`edit`/`grep` are valid; the live host warns they are not; and this session **observed all three bound and working** while the unwarned `bash`/`shell` were absent. Warned set and capability-loss set are disjoint. What remains unknown is the one thing that decides the fix: **is the allowlist additive over an always-granted base set, or does it gate?** If additive, removing the tokens is safe but pointless (Branch B). If gating, the tokens are load-bearing and removing them silently strips file creation from up to 49 agents (Branch A). No agent in this session has a shell, so I cannot run this. Applying either branch without it is the repo-wide bad edit the research consultation warned against, and with `npm test` unrunnable here nothing would catch it.
- ask: Run this A/B on a **throwaway agent outside `C:\src\kai`** (no committed file changes, nothing to roll back) and report the four outputs verbatim: **(1)** `copilot --version` — pins which CLI build the verdict covers. **(2)** Create a scratch agent whose frontmatter omits all three warned names, e.g. `tools: ["bash", "shell", "skill"]`, launch it, and ask it to list every tool it can actually call. **Does it still have `view`/`create`/`edit`/`grep`/`glob`?** YES => allowlist is additive over a base set => **Branch B**, change nothing in the 112 files. NO => the allowlist gates => **Branch A**, the tokens are load-bearing and must be replaced, never deleted. **(3)** In that same run, paste the exact `Unknown tool name in the tool allowlist: ...` lines emitted, to confirm the warned set on this build is exactly `{create, edit, grep}` and nothing else. **(4)** Only if (2) is NO: whatever the host will state as its accepted vocabulary — a hint printed alongside the warning, `copilot help`, or the current custom-agent docs page with its URL and access date. Branch A cannot be authored without it and **I will not guess replacement names.**
- answer_by: next-dispatch

---

## HANDOFF 2026-08-27-2138 — principal-swe-infra -> @operator

- did:       Produced the grounded diagnosis with **no edit to any `agents/**` or `packs/**` file**, per the dispatch STOP CONDITION. Settled the decisive question in both directions: warned names are bound and working (first-hand, this session), and the shell absence cannot be allowlist-caused (built-in agents carrying no `tools:` key lost it too). Enumerated all 112 agent declarations in full with exact arrays and verified all 56 mirrors byte-match root; found the true surface is **214 files** (51 root skills + 51 skill mirrors also declare the warned tokens) and a **third mirror** of the contract at `packs/kai-core/scripts/lib/loader-contract.mjs`. Built the identifier frequency table. Located the root cause in a two-vocabulary host and, more importantly, in `loader-contract.mjs:3-4` claiming an authority no repo file can hold. Defined both fix branches, the per-agent capability-disclosure rule, the sequencing constraint, and three CI options. Raised one blocking operator question and three proposals.
- state:     blocked
- needs:     `@operator` to run `Q-area-plugins-tool-allowlist-fix-01` — a four-part A/B on a throwaway agent outside the repo. Part (2) alone decides Branch A vs Branch B. Separately, `principal-product-manager` (steward) owns PROPOSAL-2 (Branch B contradicts the committed Outcome) and PROPOSAL-3 (102 skill declarations in or out of scope). Neither proposal blocks the operator run; both block application.
- artifacts: this thread entry (the durable record — `kai/initiatives/area-plugins/` does not exist and cannot be created without a shell); `kai/coordination/items/area-plugins-tool-allowlist-fix.md` at v3, `blocked`, lease cleared.
- evidence:  **`observed`** (first-hand file reads + this session's own bound toolset): 56 root `agents/*.agent.md` and 56 `packs/*/agents/*.agent.md` each declare `tools:` at line 4, arrays enumerated in §2a, all 56 mirrors byte-identical to root; 51 root + 51 mirrored `SKILL.md` also declare `tools:`; frequency table §2c; `principal-swe-infra` declares 8 tools and this session bound exactly `view, create, edit, grep, glob` — the three warned names present and functional, `bash`/`shell`/`skill` absent; `grep` and `view` executed successfully throughout; six skills declare `requires_tools`, all `[bash, shell]` (`SKILL.md:5`); enforcement at `loader-contract.mjs:14,94`, `validate-plugin.mjs:650,648-672,838-870`, `host-contract.mjs` `unsupported-tool.agent.md` fixture; `test/README.md:41-45`; CHANGELOG 0.49.1 (`bash`->`view, skill, sql` on Windows) and 0.63.1 (delegated agents receive only declared tools). **`reported`, not observed:** the warning text itself (never seen by me — no host log access), dispatch observation (i) `create` working, dispatch observation (ii) built-in agents lacking shell. **Not run:** `npm test`, `pack-preview --check`, any gate, `node`, `git`, `gh` — this session has no shell.
- questions: `Q-area-plugins-tool-allowlist-fix-01` (open, blocking, kind `action`, -> `@operator`).
- next:      `@operator` answers `Q-...-01`. Then `principal-swe-infra` resumes and applies the indicated branch — **Branch B (change nothing in the 112 files) is what current evidence favours**, and it needs the steward's PROPOSAL-2 ruling before it can be called done, because it contradicts the item's committed Outcome. `principal-swe-architect` independent-architecture review still applies to whatever ships. The PR-3 ordering constraint holds until the branch is known; under Branch B it dissolves and milestone 2 unblocks early.

---

## REVIEW 2026-08-28-0112 — principal-swe-architect · independent-architecture (exact ref)

- **verdict:** **CHANGES REQUESTED** — P0 **3** / P1 **4** / P2 **4**
- **change_ref reviewed:** `f093c5a2678ee1ecf9c25a88015110a1fbd057cd`
  (`.git/refs/heads/fix/area-plugin-tool-aliases`), branch
  `fix/area-plugin-tool-aliases`, branched from `main` at `71ee251`, single
  commit `fix(host): use portable tool aliases` (`.git/logs/HEAD:535-536`).
- **satisfies_requirement:** `false` — `review_requirements[0]` stays open.
- **zero code changes are requested in the 214 declaration files.** The
  structural call is right; what is missing is authorization, an efficacy check,
  and the records the initiative's own rules make binding.

### Disposition: Endorse the shape, block the ship

One declaration vocabulary, primary aliases for the mapped families, specialized
names left explicit, mirrors byte-derived from root, both contract copies moved
together. That is the smallest structure that resolves the vocabulary drift, and
I would not reshape it. The blockers below are about whether this may ship, not
about how it is built.

### The seam this turns on

```text
                 DECLARATION VOCABULARY            HOST
  agents/*.agent.md:4   ──┐                 ┌── validator channel  (startup warnings)
  skills/*/SKILL.md:4   ──┤   tools: [...]  │      status: UNOBSERVED
                          ├───────────────► ┤
  packs/**/ (generated) ──┘                 └── runtime channel    (granted tools)
                          │                        status: OBSERVED 1.0.79 / 1.0.81
                          │
             SUPPORTED_TOOLS (2 copies, hand-synced)
             scripts/lib/loader-contract.mjs:15-24
             packs/kai-core/scripts/lib/loader-contract.mjs:15-24

  retired here:  bash shell view create grep glob task web_search web_fetch
  RETAINED here: edit   <-- one of the three names the host was reported to warn on
```

The change is measured against the right-hand channel and shipped for its
effect on the left-hand one. That gap is P0-1 and P0-2.

### P0-1 — `edit` survives the migration, and `edit` is one of the warned names

The item's Outcome is that
`Unknown tool name in the tool allowlist: "create" / "edit" / "grep"` **stops**
(`kai/coordination/items/area-plugins-tool-allowlist-fix.md`, Outcome). Scope
brief **A23** records the operator's live CLI warning on lowercase `create`,
`edit` **and** `grep` *"even though `edit` and `Grep` are documented aliases"*
(`kai/coordination/threads/area-plugins-scope-brief.md:1807-1812`).

The migrated vocabulary drops `create` and `grep` and **keeps `edit`**, which is
now declared by 55 of 56 agents and ~30 skills. If the host's warning behaviour
is unchanged, the user-visible symptom persists on nearly the whole fleet after a
214-file diff. `CHANGELOG.md:14-16` labels warning silence "unverified", which is
honest but understates it: on the initiative's own recorded evidence this change
is **predicted not to silence the warnings**.

**Ask (Spike, ~1 minute, no code):** launch any kai agent interactively on the
migrated tree and read the startup warnings — the validator channel prompt mode
structurally cannot reach (decision §12.3). Then record the result under
acceptance box 7 with its observation method. If `edit` still warns, milestone
0's amended Outcome is unmet and that is a steward re-scope (PROPOSAL-2 again),
not a reviewer's call.

### P0-2 — the migration is authored against a stop condition recorded three times

The conformance decision states, at §12.4: *"no §7.2 branch (B1/B2/B3) may be
selected and no declaration migration may be authored on this evidence"* —
because `findings.warning_free_spelling_exists` is `null`
(`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md`
§12.2-12.4). The same sentence is repeated by the director handoff
(`kai/coordination/threads/area-plugins-host-tool-conformance.md:559`), by infra
(`:320`), and by my own prior review (`:693`, `:717`). Steward ruling **A23**
permits the fix only *"via a replacement proven safe by the probe"*
(`area-plugins-scope-brief.md:1817-1820`) — the probe proved **runtime safety**,
which this change has, and did not prove the warning outcome, which this change
needs.

`f093c5a` **is** that declaration migration. Either the operator lifted the stop
condition — in which case it must be recorded here as an answer with provenance —
or it stands violated. A reviewer cannot self-clear a stop condition the steward
wrote and a prior architecture review re-asserted.

### P0-3 — steward-parked P5 scope was applied without a promotion record

`kai/initiatives/area-plugins/backlog.md:188-238` parks the **102 skill
declarations and the third `SUPPORTED_TOOLS` copy** as **PROPOSAL P5**, with the
2026-08-27-2210 grooming pass concluding *"Stays parked until the probe
reports"* and *"Nothing is promoted this pass. The one-way valve stays closed."*
(`:254-261`). A23 repeats the deferral (`area-plugins-scope-brief.md:1841-1849`).

`f093c5a` changes all 102 skill sites and both contract copies. The probe
reporting **fires P5's trigger**; it does not **promote** P5 — that is the
steward's act, and no promotion record exists. Two corroborating signals: the
item is still `version: 4` with `touches:` naming only `agents/`, `packs/`,
`scripts/validate-plugin.mjs`, `CHANGELOG.md`, `package.json`,
`package-lock.json` (`items/area-plugins-tool-allowlist-fix.md:24-30`) — neither
`skills/**` nor `scripts/lib/loader-contract.mjs` — and P5's trigger text says
the probe's evidence *"decides whether the 102 skill sites carry the same defect
at all"*, which it never measured.

Note the mirror copy at `packs/kai-core/scripts/lib/loader-contract.mjs` is
forced collateral of any root contract edit under byte parity, so it is not an
independent scope choice. `skills/**` is.

### P1

1. **Item lifecycle bypassed.** `state: ready`, `owner: null`, all five lease
   fields null, `change_ref: null`, `completed_reviews: []`
   (`items/area-plugins-tool-allowlist-fix.md:8,11,37,38`), and this thread
   carries no implementation handoff — yet the implementation is committed. Per
   `kai-core-work-coordination` the item should be `in-review` at the ref, under
   a held lease. I did not edit it: no lease, and a CHANGES REQUESTED verdict
   completes nothing.
2. **Carve-out clause 3 is unclaimed and unverified.** The three-clause
   topology-neutral carve-out must be named explicitly in the PR, and clause 3
   requires **observed** green gates with `--check` byte parity re-established.
   Nothing in the durable record claims a run. See "What I could not verify".
3. **The binding capability-loss disclosure table is missing.** Design §7.3 makes
   it mandatory for whichever branch runs and states plainly that *"CI cannot
   catch a capability loss here … the disclosure table is the only guard, and the
   PR body must say so"*
   (`threads/area-plugins-host-tool-conformance.md:236-243`). Remedy is cheap: my
   verification below is the equivalent content for all 107 root files and can be
   transcribed.
4. **Expand → migrate → contract collapsed into one commit.** §7.2 specified
   PR-A1..A4 so each step is independently green and revertible, with the
   retired spellings removed only at A4. Here the contract step lands with the
   migration, so there is no window in which both vocabularies validate: any
   in-flight branch whose declarations predate `f093c5a` now fails
   `validate-plugin` after merge, and reverting the vocabulary costs a second
   214-file diff. Defensible as an operator preference — but the four-step shape
   existed for this reason and the deviation should be stated, not absorbed.

### P2

1. `docs/host-capabilities.md:16` still names the peer sub-agent tool as
   `` `task` ``; the declaration alias is now `agent`.
2. `test/fixtures/host-loader/invalid/*` still declare retired tokens
   (`view`, `grep`), so four of five fixtures now fail for an unintended extra
   reason and `unsupported-tool.agent.md:4` no longer isolates `teleport`. The
   self-test still passes because `scripts/host-contract.mjs:194` matches with
   `errs.some(re)`. Cheap fix: `view`→`read`, `grep`→`search`.
3. **Regression guard still absent** (item box 8). Nothing binds
   `SUPPORTED_TOOLS` to measured host behaviour, so this defect class can return
   silently — exactly how it reached users at 1.0.4 with CI green. `todo` is now
   in the vocabulary with zero declarers, which is the same shape of drift in
   miniature.
4. **Cited evidence is unretrievable.** `CHANGELOG.md:11-13` cites live 1.0.79 /
   1.0.81 probes whose JSON is session-only by ratified design. Cite decision
   §12.2 in the record so a reader has a durable landing place.

### What I verified first-hand (`observed`, file reads at `C:\src\kai`)

1. **Mapping, all 56 root agents** (`agents/*.agent.md:4`) against two
   independent pre-change baselines — this thread's §2a enumeration and the
   separately-installed pre-change plugin copy. Every array is the
   order-preserving, de-duplicated image of its predecessor under
   `bash|shell→execute`, `view→read`, `edit|create→edit`, `grep|glob→search`,
   `task→agent`, `web_search|web_fetch→web`. **Zero drops, zero additions.**
2. **Specialized capabilities preserved exactly where they were present:**
   `ask_user` 52→52, `skill` 56→56, `playwright` 9→9, `read_agent`/`write_agent`
   5→5 (creative-video-director, director-chief-of-staff,
   director-executive-assistant, principal-linkedin-strategist,
   workflow-incident-response), `session_store_sql` 1→1
   (`skills/extract-writing-style/SKILL.md:4`). None was folded into a family
   alias.
3. **All 51 root skills** map the same way; `requires_tools:` is exactly six
   files, each `[bash, shell]` → `[execute]`
   (`skills/{create-product-demo,demo-capture,demo-narrate,demo-zoom,kai-core-fleet-observation,kai-core-work-activity}/SKILL.md:5`).
4. **The inheritance requirement stays closed.** `validate-plugin.mjs:657-672`
   demands every agent inheriting a `requires_tools` skill declare each named
   tool; every agent that held the `bash`+`shell` pair now declares `execute`, so
   no new violation is introduced.
5. **Mirror parity at the declaration line:** 107 generated files under
   `packs/*/{agents,skills}` (56 + 51) plus the six `requires_tools:` lines are
   identical to their roots, including quoting style and element order.
   `packs/kai-core/scripts/lib/loader-contract.mjs:15-24` matches
   `scripts/lib/loader-contract.mjs:15-24`.
6. **Loader validation now rejects the retired aliases.** `SUPPORTED_TOOLS` =
   `{execute, read, edit, search, agent, web, todo, ask_user, skill, read_agent,
   write_agent, session_store_sql, playwright}`; all nine retired spellings are
   absent, so `loaderErrors()` rejects them for agents and skills and
   `validate-plugin.mjs:650` rejects them in `requires_tools`. Repo-wide search:
   **no** `tools:`/`requires_tools:` line under `agents/`, `skills/`, `packs/`,
   `examples/`, `scripts/` carries a retired spelling.
7. **Topology neutrality corroborated** (not diff-proven): `pack-plan.mjs:49`
   `PACKS_DIR`, `:63` `PACKS` (core 7 / engineering 20 / product 9 / gtm 11 /
   personal 9 — matching on-disk mirror counts), `:99` `PACK_ORDER`, `:104`
   `SKILL_OWNER_OVERRIDES` — same line numbers the steward cited on
   2026-08-27-2210, membership unchanged from the locked partition.
   `plugin.json:2` `kai`; `.github/plugin/marketplace.json:2` `kai-plugins`; five
   pack identities unchanged. `scripts/lib/{preflight,degraded,inherits}-block.txt`
   contain no tool-vocabulary token at all, so the migration strands nothing
   there.
8. **Release metadata is consistently 1.0.6:** `package.json:3`, `plugin.json:4`,
   `marketplace.json:9,17,40,63,86,109`, all five packs'
   `package.json`/`plugin.json`/`package-lock.json`, `README.md:38`,
   `CHANGELOG.md:7` with the `:3104` compare link.

### What I could not verify — stated, not assumed

This session has **no shell**: `git`, `node`, `npm` are unavailable to it.
Therefore the **commit diff itself was not read**. Acceptance item 3 ("each of
the 214 files differs only in `tools:` and, for six skills, `requires_tools:`")
and the byte-parity half of item 4 are **unverified** by this review; my claim is
bounded to *every `tools:`/`requires_tools:` line in the 214 files is in the
migrated vocabulary, and every mirror line equals its root*. **Not run and not
claimed:** `pack-preview --check`, `--gate partition|collision|partial-install|version-skew`,
`validate-plugin`, `release-guard`, `npm test`. HEAD matches the reviewed ref by
ref-file read; `git status` cleanliness is unverified.

### What must happen before this ships

1. Operator/steward: record the authorization that lifts the §12.4 stop
   condition, **or** stand it up and stop.
2. Steward: promote P5 (or narrow the commit to agents), and widen the item's
   `touches` to the surface actually changed.
3. Implementer: the §7.3 capability-loss disclosure table, the three carve-out
   clauses named explicitly, and **observed** gate output including
   `--check` byte parity.
4. Operator: the one interactive launch that answers P0-1.
5. Then re-dispatch this review at the same ref; items 1-3 are records and item 4
   is an observation, so a records-only re-check is expected to close it.

---

## HANDOFF 2026-08-28-0112 — principal-swe-architect -> @operator / principal-product-manager (steward)

- did:       Independent-architecture review of `f093c5a` bound to the exact ref. Verified the alias mapping for all 56 root agents and 51 root skills against two independent pre-change baselines, specialized-capability preservation, six `requires_tools` migrations, declaration-line parity across all 107 generated mirrors, both `SUPPORTED_TOOLS` copies, the `requires_tools` inheritance closure, topology/identity constants, and 1.0.6 release metadata. Edited no implementation file, no item frontmatter, and ran no command.
- state:     CHANGES REQUESTED — P0 3 / P1 4 / P2 4; `satisfies_requirement: false`; the item's `review_requirements[0]` stays open.
- needs:     **@operator** — (a) the recorded authorization that lifts the conformance decision's §12.4 stop condition, and (b) one interactive launch on the migrated tree to see whether `edit` still warns (P0-1). **principal-product-manager (steward)** — promote backlog P5 or narrow the commit to agents, and widen the item's `touches` (P0-3). **principal-swe-infra** — the §7.3 capability-loss disclosure table, the three carve-out clauses named, and observed gate output including `--check` (P1-2, P1-3); the four P2s are cheap and optional-before-ship.
- artifacts: this thread entry (the durable review record). `kai/coordination/items/area-plugins-tool-allowlist-fix.md` **not edited** — no lease held, and a CHANGES REQUESTED verdict completes no requirement.
- evidence:  `observed` — first-hand file reads at `C:\src\kai` at HEAD `f093c5a2678ee1ecf9c25a88015110a1fbd057cd`, enumerated in the review above. `reported` — the live 1.0.79/1.0.81 probe results (session-only JSON, summarized in decision §12.2) and the operator's original warning text. **Not run:** `npm test`, `pack-preview --check`, any `--gate`, `validate-plugin`, `release-guard`, `git`, `node` — this session has no shell, so the commit diff was not read and no gate result is claimed.
- questions: none new; P0-2 needs an operator answer with provenance, P0-3 a steward ruling.
- next:      `@operator` / steward on P0-1..P0-3, then `principal-swe-infra` on P1-2/P1-3, then re-dispatch this review at the same ref. The milestone-2 PR-3 ordering constraint still holds — this item is not `shipped`, and `shipped` still requires operator deployment and verification.

---

## STEWARD RULING 2026-08-28-0125 — principal-product-manager (steward)

Adjudicating the CHANGES REQUESTED review of
`f093c5a2678ee1ecf9c25a88015110a1fbd057cd`. The three P0s were routed to
`@operator` and to me; I answer all three.

**What this ruling does NOT do, stated first so it cannot be misread.** It does
not clear P1-2 (carve-out clauses named + **observed** gate output including
`--check` byte parity), P1-3 (the §7.3 capability-loss disclosure table), or any
of the four P2s. Those belong to `principal-swe-infra` and remain open.
`review_requirements[0]` stays unmet, the recorded review verdict stays
`changes-requested`, and `satisfies_requirement` stays `false`. A steward may
lift a scope stop; a steward may not mark an engineering review satisfied.

### Verified first-hand before ruling (`observed` — file reads at `C:\src\kai`)

I did not take the reviewer's word for the load-bearing facts.

- `.git/refs/heads/fix/area-plugin-tool-aliases` reads
  `f093c5a2678ee1ecf9c25a88015110a1fbd057cd`. The ref exists and matches.
- `scripts/lib/loader-contract.mjs:15-24` — `SUPPORTED_TOOLS` is
  `{execute, read, edit, search, agent, web, todo, ask_user, skill, read_agent,
  write_agent, session_store_sql, playwright}`. All nine retired spellings
  absent.
- Repo-wide search of root `agents/*.agent.md`: **zero** declarations carry
  `create`, `grep`, `view`, `glob`, `bash`, `shell`, or `task`.
- **55 of 56** root agents declare `edit`. **29 of 51** root skills declare
  `edit`. All **51** root skills carry a `tools:` line. All **six**
  `requires_tools:` lines read `[execute]`.

**P0-1's premise is confirmed, not merely alleged.** `edit` — one of the three
names the operator's live CLI was reported to warn on — survives on nearly the
whole fleet, by design.

**Not run and not claimed by this pass:** `npm test`, `pack-preview --check`,
any `--gate`, `validate-plugin`, `release-guard`, `git`, `node`. This session has
no shell; the commit diff was not read.

---

### P0-2 — the §12.4 stop condition is **LIFTED**, on recorded operator authority

The stop reads: *"no §7.2 branch (B1/B2/B3) may be selected and no declaration
migration may be authored on this evidence"*, because
`findings.warning_free_spelling_exists` is `null`.

**Provenance of the lift, recorded as the reviewer demanded.** The operator, in
session, after brainstorming the area-plugin architecture: *"Yes I like that,
lets use actually 'plugins' for the folder naming I wanted to suggest that
also, the rest I like. Please proceed"* — then explicitly directed that the tool
warnings be fixed and that the work proceed one by one; and the implementation
sequence recorded **after the probe shipped as v1.0.5** directs migrating the
root agents and skills **while preserving capabilities**. That instruction was
given *downstream* of the evidence that raised the stop, not in ignorance of it.

**Why this is a lift and not a bypass.** Four reasons, and the third decides it.

1. **A23 — my own ruling — conditioned the fix on a replacement "proven safe by
   the probe."** *Safe*, not *effective*. The probe closed the safety question
   on both `1.0.79` and `1.0.81`, direct **and** delegated (decision §12.2).
   `f093c5a` replaces and never deletes: zero drops, zero additions,
   specialized capabilities preserved 1:1. A23's actual condition is met.
2. **A23's constraint 1 — "no `agents/**` or `packs/**` body is edited before it
   reports" — is satisfied.** The probe reported and shipped first, as
   `[1.0.5]`. The sequencing this milestone exists to enforce held.
3. **The stop is structurally unliftable by engineering.** Decision §12.3 is
   explicit: prompt mode cannot reproduce the interactive startup warning
   surface. No further measurement any agent can run will produce
   `warning_free_spelling_exists`. Only an operator, on an interactive launch,
   can see that channel — and only *after* an install. A gate that can only be
   cleared by observing the deployed result of the change it blocks is a
   deadlock, and holding a correct, capability-safe, revertible change inside it
   would be process theatre, not restraint.
4. **The residual risk actually being accepted is bounded and is the operator's
   to accept.** It is **efficacy** (a warning may persist), not **safety**
   (capability loss) — the latter was measured and closed. Only the operator may
   accept residual risk; the operator did, by direction, with the evidence on the
   record.

**The lift is bounded to this.** It authorizes the declaration migration to the
documented primary aliases. It authorizes nothing about topology, identity,
marketplace, or the milestone-1 bar, all of which remain governed by the A11
three-clause carve-out that P1-2 still owes.

---

### P0-1 — the Outcome was wrong. **AMENDED, not waived.** No warning-free claim is invented.

The reviewer is right that `CHANGELOG.md`'s "unverified" understates it. On this
initiative's own recorded evidence the change is **predicted not to silence the
`edit` warning**. I am not going to let that sit under a hedge.

**The arithmetic, stated plainly.** Three names were reported warned:

| reported warned name | after `f093c5a` | status |
|---|---|---|
| `create` | folded into `edit`; **zero declarations remain** | `observed` — repo-wide search |
| `grep` | replaced by `search`; **zero declarations remain** | `observed` — repo-wide search |
| `edit` | **retained deliberately** on 55/56 agents and 29/51 skills | may still warn — `unobserved` |

Two of the three warning spellings are eliminated as a matter of fact I checked
myself. The third is retained **because it is the documented primary alias for
the file-editing family**. That is not an oversight in the diff; it is the
correct spelling.

**The ruling that matters most, and it is a pre-commitment against a bad reflex:
if `edit` still warns after install, the disposition is NOT another declaration
change.** Re-spelling `edit` to chase a quiet log would mean declaring an
undocumented name to satisfy a validator that disagrees with its own
documentation — which is precisely the defect this milestone exists to end. The
disposition is §7.2 **B2 applied to the residue**: document the benign drift with
its evidence, the way `0.49.1` and `0.63.1` were documented, and file the bug
upstream against the CLI. That is a follow-on, not a reopening of this item.

**Amended Outcome** (carried into the item record and into scope-brief **A28**);
the superseded wording is left in the record above, not rewritten:

1. Every kai declaration — agents and skills, root and generated mirror — uses
   the documented primary-alias vocabulary plus explicit specialized Kai tools,
   **measured runtime-safe on live CLI `1.0.79` and `1.0.81`, direct and
   delegated**.
2. **No capability is lost.** Replacement, never deletion.
3. Root and mirrors share one vocabulary and `--check` byte parity holds.
4. **Warning behaviour is recorded at the precision the channels permit, and no
   further.** `create` and `grep` are eliminated from the source — `observed`.
   Interactive-startup warning silence is **`unobserved` and remains so**: it is
   evidence for the `shipped` gate, collected by the operator after deployment,
   and it is **not** a merge-gate condition. **No noninteractive proxy for it is
   required, because none is possible.**
5. A residual `edit` warning does not falsify this item; it routes to B2
   documentation plus an upstream report.

**What this costs, named rather than buried.** Milestone 0's original promise
was "the warnings stop." It now promises "the declarations are correct, capability
is intact, and two of three warning spellings are gone." That is a smaller
promise. It is the one the evidence supports, and shrinking the promise to fit
the evidence is the honest move available — the alternatives were to claim a
silence nobody has seen, or to block indefinitely on an observation that cannot
be made until after we ship.

---

### P0-3 — backlog **P5(a) is PROMOTED** into this item. **P5(b) stays parked.**

The reviewer is right that the probe *firing* P5's trigger is not the same as me
*promoting* it, and that no promotion record existed. It exists now.

**P5(a) — the 102 skill declaration sites (51 root + 51 mirrors): PROMOTED into
`area-plugins-tool-allowlist-fix`.** Four grounds:

1. The operator's post-probe implementation sequence **names skills explicitly**.
2. The trigger fired: the probe reported, and its runtime evidence covers the
   replacement vocabulary wherever it is declared — a skill's `tools:` line is
   parsed by the same loader as an agent's.
3. The north star's milestone-0 acceptance **already names 214 declaration sites
   as the complete surface**, "not the 112 first assumed." Migrating 112 of 214
   would leave half the surface defective while an acceptance box read satisfied.
4. **Part of it was never an independent scope choice.** Agents dropped the
   `bash`+`shell` pair for `execute`; `validate-plugin.mjs:657-672` requires every
   agent inheriting a `requires_tools` skill to declare each named tool, so the
   six `requires_tools:` lines had to move in the same change or the gate goes
   red. And once `SUPPORTED_TOOLS` retires the old spellings, `loaderErrors()`
   rejects them for skills as well as agents.

**P5(b) — deriving the third `SUPPORTED_TOOLS` copy instead of hand-syncing it:
STAYS PARKED.** It is a mechanism addition and `expands-scope` on its face.
`f093c5a` does not do it — it edits both copies in lockstep, which is forced
collateral of byte parity, exactly as the reviewer noted. Promoting (a) does not
open (b), and nobody may cite this ruling to do so.

**The valve moved once, deliberately, and by the only role that may move it.**

---

### Deviations I am recording rather than absorbing

- **P1-4 — expand/migrate/contract collapsed into one commit.** §7.2 specified
  PR-A1..A4 so each step is independently green and revertible. `f093c5a` lands
  all four at once, so there is no window in which both vocabularies validate:
  any in-flight branch whose declarations predate it fails `validate-plugin`
  after merge, and reverting the vocabulary costs a second 214-file diff. The
  four-step shape existed for a reason and the deviation is real. I accept it as
  consistent with the operator's "proceed one by one" pacing at the *item*
  granularity, and I record the cost rather than pretending it was free. The
  change remains revertible as one commit, and lockstep versioning holds.
- **`shipped` is not near.** Verification is unrun, the disclosure table is
  unwritten, and the interactive observation is uncollected. Nothing in this
  ruling advances this item toward `shipped`.

### Item record changes made by this pass

`state: ready -> in-review` · `change_ref: null -> f093c5a…` ·
`next_role: principal-swe-infra` · `version: 4 -> 5` · `touches` widened to the
authorized surface · the `changes-requested` review recorded in
`completed_reviews` with `satisfies_requirement: false` · Outcome amended ·
acceptance boxes 1, 2 and 7 rewritten to the truth · the stale
`artifact_target_status` corrected (`kai/initiatives/area-plugins/` exists).

**`in-review` here means "implementation is committed at a bound ref and
verification is outstanding." It does not mean the review passed.** It did not.

### Steward findings for the director (not blockers on this item)

1. `kai/coordination/BOARD.md:48-49` is stale on both milestone-0 rows — it shows
   this item `ready` with an unmet dependency, and shows
   `area-plugins-host-tool-conformance` as `in-progress` when its record is
   `in-review` at `4d71177`. BOARD is derived and reconciled by
   `director-chief-of-staff`; I did not hand-edit it.
2. The north star requires `area-plugins-host-tool-conformance` to reach
   `shipped` for milestone 0 to close, but the probe already released as
   `[1.0.5]` while its item sits `in-review` with `next_role: workflow-ship`.
   That gap is `workflow-ship`'s to close with real deployment evidence; it is
   not mine to assert.

---

## HANDOFF 2026-08-28-0125 — principal-product-manager (steward) -> principal-swe-infra

- did:       Adjudicated the CHANGES REQUESTED review at `f093c5a`. **P0-2 lifted** the conformance decision's §12.4 measure-before-migrate stop on recorded operator authority, with provenance and bounds. **P0-1 amended** the item Outcome and milestone-0 acceptance to what the evidence supports — `create` and `grep` eliminated (`observed`), interactive warning silence `unobserved` and deferred to post-install operator observation, and a standing pre-commitment that a residual `edit` warning routes to B2 documentation plus an upstream report rather than to another declaration change. **P0-3 promoted backlog P5(a)** (102 skill declaration sites) into this item and **kept P5(b)** (deriving the third `SUPPORTED_TOOLS` copy) parked. Widened `touches`, set `state: in-review` with `change_ref: f093c5a…`, recorded the `changes-requested` verdict, and corrected the stale `artifact_target_status`.
- state:     in-review — implementation committed at a bound ref; **one required review is unmet and verification is unrun.** Not approved, not `release-ready`, not `shipped`.
- needs:     `principal-swe-infra`, under a lease granted by the director: (1) **P1-3** — the §7.3 capability-loss disclosure table, per agent and per token, in the PR body, with the "CI cannot catch a capability loss here" sentence stated explicitly; the reviewer's verification block is the equivalent content for all 107 root files and may be transcribed. (2) **P1-2** — name all three A11 carve-out clauses explicitly and produce **observed** output for `pack-preview --check`, `--gate partition|collision|partial-install|version-skew`, `validate-plugin`, `host-contract --self-test`, `release-guard`, `npm test`. (3) The four **P2s** are now in `touches` and are cheap: `docs/host-capabilities.md:16` `task`->`agent`; `test/fixtures/host-loader/invalid/*` `view`->`read`, `grep`->`search` so `unsupported-tool.agent.md:4` isolates `teleport` again; the box-8 regression-guard sentence; and cite decision §12.2 in place of the session-only probe JSON. **If any tracked file changes, update `change_ref` and re-dispatch the architecture review against the new ref** — the recorded review is bound to `f093c5a` and does not survive it.
- artifacts: this thread entry (durable ruling). `kai/coordination/items/area-plugins-tool-allowlist-fix.md` (v5). `kai/initiatives/area-plugins/backlog.md` (P5 promotion record). `kai/coordination/threads/area-plugins-scope-brief.md` (A28). `kai/initiatives/area-plugins/northstar.md` (milestone-0 outcome + acceptance). `kai/initiatives/area-plugins/log.md`.
- evidence:  `observed` — first-hand file reads this pass: the branch ref file equals `f093c5a…`; `SUPPORTED_TOOLS` carries the migrated vocabulary with all nine retired spellings absent; zero root agents declare a retired token; 55/56 root agents and 29/51 root skills declare `edit`; all 51 root skills carry `tools:`; all six `requires_tools:` lines are `[execute]`. `reported` — the probe's `1.0.79`/`1.0.81` runtime results (decision §12.2), the operator's original warning text, and the operator's authorization quoted above. **Not run:** every gate, `git`, `node`, `npm`; the commit diff was not read.
- questions: none blocking. One **owed observation**, and it is the operator's alone: after this deploys, launch a kai agent interactively and read the startup warnings. That is `shipped`-gate evidence for acceptance box 7. It is not required before merge and no substitute for it may be manufactured.
- next:      `principal-swe-infra` on P1-2, P1-3 and the P2s, then re-dispatch `principal-swe-architect` at the ref that then obtains. The milestone-2 PR-3 ordering constraint stands: `area-plugins-m2-mode-selection` does not open while this item is open.

---

## IMPLEMENTATION EVIDENCE 2026-08-28-0140 — principal-swe-infra

**Exact implementation ref before record-only corrections:** `f093c5a2678ee1ecf9c25a88015110a1fbd057cd`.

**Capability-loss disclosure. CI cannot catch a capability loss here; this table is the only guard.**
Each retired token is replaced by its documented primary family alias. A row marked `none` means the replacement token is present after migration; no row deletes a capability without replacement.

| root declaration | field | retired token -> replacement | capability loss |
|---|---|---|---|
| `agents/creative-video-director.agent.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search`, `bash->execute`, `shell->execute`, `task->agent` | none |
| `agents/director-chief-of-staff.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `task->agent` | none |
| `agents/director-executive-assistant.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `task->agent` | none |
| `agents/instructor-path-mentor.agent.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search`, `bash->execute`, `shell->execute`, `web_search->web` | none |
| `agents/instructor-teacher.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `agents/instructor-tutor.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web` | none |
| `agents/persona-professional-nutritionist.agent.md` | `tools` | `bash->execute`, `shell->execute`, `create->edit`, `view->read` | none |
| `agents/persona-professional-trainer.agent.md` | `tools` | `bash->execute`, `shell->execute`, `create->edit`, `view->read` | none |
| `agents/persona-self.agent.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search`, `bash->execute`, `shell->execute` | none |
| `agents/persona-ux-first-time-user.agent.md` | `tools` | `bash->execute`, `shell->execute`, `create->edit`, `view->read` | none |
| `agents/principal-ai-applied-engineer.agent.md` | `tools` | `web_search->web`, `web_fetch->web`, `view->read`, `create->edit`, `glob->search`, `grep->search` | none |
| `agents/principal-ai-researcher.agent.md` | `tools` | `web_search->web`, `web_fetch->web`, `view->read`, `create->edit`, `glob->search`, `grep->search` | none |
| `agents/principal-brand-designer.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-customer-success.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/principal-data-analytics.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/principal-data-engineer.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-demand-generation.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-engineer-career-mentor.agent.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search`, `bash->execute`, `shell->execute`, `web_search->web` | none |
| `agents/principal-growth.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-linkedin-strategist.agent.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search`, `bash->execute`, `shell->execute`, `task->agent` | none |
| `agents/principal-partnerships.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-pricing-monetization.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-privacy-compliance.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-product-designer.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/principal-product-manager.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `agents/principal-product-marketing.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-product-strategist.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-qa-ui.agent.md` | `tools` | `bash->execute`, `shell->execute`, `create->edit`, `view->read`, `grep->search`, `glob->search` | none |
| `agents/principal-revenue-operations.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-sales.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-security.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-seo.agent.md` | `tools` | `bash->execute`, `shell->execute`, `create->edit`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-solutions-architect.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-sre.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-swe-architect.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/principal-swe-backend.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/principal-swe-frontend.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/principal-swe-infra.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/principal-swe-manager.agent.md` | `tools` | `bash->execute`, `shell->execute`, `create->edit`, `view->read`, `grep->search`, `glob->search` | none |
| `agents/principal-technical-writer.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/workflow-course-to-audio.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read` | none |
| `agents/workflow-customer-feedback.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/workflow-doc-review.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/workflow-experiment-review.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/workflow-incident-response.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `task->agent`, `web_search->web`, `web_fetch->web` | none |
| `agents/workflow-initiative-init.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/workflow-issue-analysis.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/workflow-localization.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/workflow-proactive-scan.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/workflow-product-explore.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `agents/workflow-pull-request.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/workflow-self-check.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `agents/workflow-ship.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `agents/workflow-support-triage.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `agents/workflow-weekly-pulse.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_fetch->web`, `web_search->web` | none |
| `agents/workflow-workspace-init.agent.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/build-diagrams/SKILL.md` | `tools` | `view->read`, `grep->search`, `glob->search` | none |
| `skills/coding-style/SKILL.md` | `tools` | `view->read`, `grep->search`, `glob->search` | none |
| `skills/create-product-demo/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/create-product-demo/SKILL.md` | `requires_tools` | `bash->execute`, `shell->execute` | none |
| `skills/demo-capture/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/demo-capture/SKILL.md` | `requires_tools` | `bash->execute`, `shell->execute` | none |
| `skills/demo-narrate/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/demo-narrate/SKILL.md` | `requires_tools` | `bash->execute`, `shell->execute` | none |
| `skills/demo-zoom/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/demo-zoom/SKILL.md` | `requires_tools` | `bash->execute`, `shell->execute` | none |
| `skills/doc-review-rigor/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/extract-writing-style/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read` | none |
| `skills/generate-html-lesson/SKILL.md` | `tools` | `view->read`, `grep->search`, `glob->search`, `create->edit` | none |
| `skills/html-block-diagrams/SKILL.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/kai-core-content-grounding/SKILL.md` | `tools` | `view->read`, `grep->search`, `glob->search` | none |
| `skills/kai-core-contract-v1/SKILL.md` | `tools` | `view->read` | none |
| `skills/kai-core-decision-brief/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/kai-core-definition-of-done/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/kai-core-design-grounding/SKILL.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/kai-core-executive-consultation/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/kai-core-fleet-observation/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `skills/kai-core-fleet-observation/SKILL.md` | `requires_tools` | `bash->execute`, `shell->execute` | none |
| `skills/kai-core-generate-audio/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read` | none |
| `skills/kai-core-initiative-stewardship/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `skills/kai-core-issue-analysis/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/kai-core-no-self-remediation/SKILL.md` | `tools` | `view->read`, `grep->search`, `glob->search` | none |
| `skills/kai-core-peer-communication/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `skills/kai-core-personal-agenda/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/kai-core-pr-delivery/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/kai-core-proactive-scan/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/kai-core-pulse-digest/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/kai-core-scope-discipline/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `skills/kai-core-team-operating-rules/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `skills/kai-core-web-content-extraction/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read` | none |
| `skills/kai-core-web-evaluation/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read` | none |
| `skills/kai-core-work-activity/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `skills/kai-core-work-activity/SKILL.md` | `requires_tools` | `bash->execute`, `shell->execute` | none |
| `skills/kai-core-work-coordination/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/kai-core-workspace-conventions/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search` | none |
| `skills/kai-core-workspace-onboarding/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/linkedin-content/SKILL.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search`, `bash->execute`, `shell->execute` | none |
| `skills/onboard-to-codebase/SKILL.md` | `tools` | `view->read`, `grep->search`, `glob->search`, `bash->execute`, `shell->execute` | none |
| `skills/pr-sizing/SKILL.md` | `tools` | `view->read`, `grep->search`, `glob->search` | none |
| `skills/product-exploration/SKILL.md` | `tools` | `view->read` | none |
| `skills/product-marketing-intelligence/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `create->edit`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/research-before-coding/SKILL.md` | `tools` | `view->read`, `grep->search`, `glob->search`, `bash->execute`, `shell->execute` | none |
| `skills/review-alternatives/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/review-dependencies/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/review-performance-scale/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/review-rationale/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/review-risks-scope/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/review-rollout-operability/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/review-security-privacy/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/review-success-metrics/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/review-ux-accessibility/SKILL.md` | `tools` | `bash->execute`, `shell->execute`, `view->read`, `grep->search`, `glob->search`, `web_search->web`, `web_fetch->web` | none |
| `skills/ui-mockup/SKILL.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search` | none |
| `skills/video-direction/SKILL.md` | `tools` | `view->read`, `create->edit`, `grep->search`, `glob->search`, `bash->execute`, `shell->execute` | none |

Disclosure total: 113 changed declaration fields across 107 root files; every retired token has its replacement and capability loss is zero. Generated mirrors are derived from these roots and were checked separately.

**Milestone-1 A11 carve-out — all three clauses claimed explicitly:**

1. **Topology is unchanged:** no edit to `PACKS`, `PACK_ORDER`, `PACKS_DIR`, `MARKETPLACE`, or `SKILL_OWNER_OVERRIDES`.
2. **Identity is unchanged:** no plugin name, plugin identity, marketplace name, agent ownership, or skill ownership changes.
3. **Injected contracts are unchanged:** `scripts/lib/preflight-block.txt`, `scripts/lib/degraded-block.txt`, and `scripts/lib/inherits-block.txt` are byte-unchanged.

**Observed verification at the working tree containing the P2 corrections:**

- `node scripts/validate-plugin.mjs` — valid, 56 agents and 51 skills.
- `node scripts/host-contract.mjs --self-test` — 56 agents and 51 skills lint cleanly; inventory and malformed fixtures pass.
- `node scripts/pack-preview.mjs --gate partition` — clean.
- `node scripts/pack-preview.mjs --gate collision` — clean.
- `node scripts/pack-preview.mjs --gate partial-install` — clean.
- `node scripts/pack-preview.mjs --gate version-skew` — clean.
- `node scripts/pack-preview.mjs --check` — committed packs match the generator.
- `node scripts/release-guard.mjs --base origin/main` — behavior change is bumped and release-noted.
- `npm test` — exit 0.
- Diff verifier — all 214 changed root/mirror agent and skill files differ only in `tools:` or the six `requires_tools:` lines.
- Repo-wide declaration search — zero retired family spellings remain.

**Regression guard:** `SUPPORTED_TOOLS` now contains the primary and specialized vocabulary only, and `loaderErrors()` rejects every retired spelling in both agent and skill declarations. The malformed fixtures now use accepted aliases for their non-target fields, so each fixture isolates the intended defect.

**Warning evidence:** runtime capability preservation is `observed` in the canonical host-tool conformance decision §12.2 for CLI 1.0.79 and 1.0.81, direct and delegated. Interactive startup warning silence remains `unobserved` by design (§12.3) and is an operator post-install observation, not a merge claim.

---

## REVIEW 2026-08-28-0141 — principal-swe-architect · independent-architecture (exact ref, re-review after remediation)

- **verdict:** **APPROVED** — P0 **0** / P1 **1** / P2 **4**
- **change_ref reviewed:** `9b98143c7b7ac46bdd0db88f9cf51ee5956da030`
  (`.git/refs/heads/fix/area-plugin-tool-aliases`; `.git/HEAD` →
  `refs/heads/fix/area-plugin-tool-aliases`). `.git/logs/HEAD` records the branch
  from `main` at `71ee251`, then `f093c5a` *fix(host): use portable tool aliases*,
  then `9b98143` *docs(review): resolve alias migration findings*.
- **satisfies_requirement:** `true` — **bound to `9b98143` and to no other ref.**
  The item record still names `f093c5a`; see P1-1. If a tracked file changes
  again, this approval does not travel with it.
- **Disposition: Endorse.** Zero code changes requested. The prior review
  endorsed the shape and blocked the ship on authorization, an efficacy claim,
  and missing records. The steward lifted and amended what was hers to lift and
  amend; `principal-swe-infra` produced the disclosure, the carve-out claim, the
  gate evidence, and the four P2 corrections. Nothing structural is left open.

### The seam, at this ref

```text
                 DECLARATION VOCABULARY                     HOST
  agents/*.agent.md:4    ──┐                     ┌── validator channel (startup warnings)
  skills/*/SKILL.md:4    ──┤  tools: [...]       │      status: UNOBSERVED — post-install,
  (+6 requires_tools:)     ├────────────────────►┤              operator-only (§12.3)
  packs/**/ (107 mirrors)──┘                     └── runtime channel  (granted capability)
                           │                            status: OBSERVED 1.0.79 / 1.0.81
                           │                                    direct + delegated (§12.2)
             SUPPORTED_TOOLS — 2 copies, lockstep, byte-identical
             scripts/lib/loader-contract.mjs:15-24
             packs/kai-core/scripts/lib/loader-contract.mjs:15-24
                           │
                           └── loaderErrors() now REJECTS: bash shell view create
                               grep glob task web_search web_fetch
                               ACCEPTS: execute read edit search agent web todo
                                        + ask_user skill read_agent write_agent
                                          session_store_sql playwright
```

Unchanged from the prior review: the change is measured against the right-hand
channel and ships for its effect on the left-hand one. What changed is that the
record now says exactly that, in the item Outcome, acceptance box 7, `CHANGELOG`
and `README`, instead of promising a silence nobody has seen.

### Prior findings — disposition verified at this ref

| # | prior finding | disposition | evidence checked this pass |
|---|---|---|---|
| P0-1 | `edit` survives; Outcome promised the warnings stop | **Resolved by amendment, not by claim.** | Item Outcome + acceptance box 7 carry three separately-labelled claims; `CHANGELOG.md:11-17` says warning silence "remains unverified because prompt mode does not expose that startup channel"; `README.md:41-44` says the same. No warning-free claim anywhere. |
| P0-2 | migration authored against §12.4's stop | **Lifted by the steward on recorded operator authority, with bounds** (`STEWARD RULING 2026-08-28-0125`, scope-brief A28). Not a reviewer's call to re-litigate; I verify only that it is recorded, provenanced and bounded — it is. | Residual: the stop still reads absolute in the artifact it lives in — P2-3. |
| P0-3 | P5 scope applied without promotion | **Resolved.** | `kai/initiatives/area-plugins/backlog.md:245-320` carries the P5(a) promotion and keeps P5(b) parked; item `touches` now names `skills/`, `scripts/lib/loader-contract.mjs`, `scripts/host-contract.mjs`, `test/fixtures/host-loader/`, `docs/host-capabilities.md`. |
| P1-1 | item lifecycle bypassed | **Partly resolved.** `state: in-review`, `change_ref` set, `changes-requested` recorded with `satisfies_requirement: false`. Still open: `change_ref` names the superseded ref and no lease covered the remediation pass — see P1-1 below. |
| P1-2 | carve-out unclaimed, gates unrun | **Resolved.** All three A11 clauses named explicitly in the 0140 evidence block; ten commands reported green. `reported`, corroborated below. |
| P1-3 | §7.3 capability-loss table missing | **Resolved.** 113 rows = 56 agents + 51 skills + 6 `requires_tools`, per file and per field, with the mandated sentence *"CI cannot catch a capability loss here; this table is the only guard."* I recounted the rows: complete, no file omitted. |
| P1-4 | expand→migrate→contract collapsed | **Recorded as an accepted deviation with its cost stated** (steward, 0125). Consistent with what I found: one revertible commit, lockstep versioning, no dual-vocabulary window. |
| P2-1 | `docs/host-capabilities.md:16` said `task` | **Fixed.** Now `` (`agent` / `write_agent` / `read_agent`) ``. |
| P2-2 | fixtures failed for extra reasons | **Fixed.** `unsupported-tool.agent.md:4` is `[read, teleport]` → isolates `teleport`; `tools-not-array.skill.md:4` scalar `read`; `name-mismatch`/`skill-key-on-agent` `[read]`; `argument-hint-array` `[read, search]`. Each fixture now yields exactly its target error under `INVALID_FIXTURES` (`scripts/host-contract.mjs:174-199`). |
| P2-3 | regression guard | **Resolved as dispositioned.** The cheap guard is real and I read it: `SUPPORTED_TOOLS` holds only primary + specialized names, `loaderErrors()` (`loader-contract.mjs:88-92`) rejects retired spellings for agents *and* skills, `validate-plugin.mjs:650` rejects them in `requires_tools`. The guard kai still does **not** have — contract-vs-host conformance — is named honestly and parked, not pretended. |
| P2-4 | evidence cited to session-only JSON | **Fixed.** `CHANGELOG.md:14-16` cites the conformance decision §12.2 as the durable landing place. |

### What I verified first-hand this pass (`observed` — file reads at `C:\src\kai`, HEAD `9b98143`)

1. **All 56 root agent declarations** re-read at `agents/*.agent.md:4` and mapped
   against the pre-change baseline enumerated in this thread's §2a. Every array
   is the order-preserving, de-duplicated image of its predecessor under
   `bash|shell→execute`, `view→read`, `edit|create→edit`, `grep|glob→search`,
   `task→agent`, `web_search|web_fetch→web`. **Zero drops, zero token additions.**
2. **All 51 root skill declarations** map the same way against the independently
   installed pre-change tree at
   `C:\Users\senrique\.copilot\installed-plugins\_direct\RubenSaucedo--kai\skills`
   (a `0.64.0` snapshot — older than the merge base, so corroborating rather than
   authoritative, and it agrees row-for-row with the 113-row table's retired-token
   column). `requires_tools:` is exactly six files, each `[execute]`.
3. **Specialized tools remain explicit, none folded into a family alias:**
   `skill` 56/56 agents, `ask_user` 52/56 agents + 13/51 skills, `playwright`
   9 agents + 5 skills, `read_agent`/`write_agent` 5/5 agents,
   `session_store_sql` 1 (`skills/extract-writing-style/SKILL.md:4`).
4. **Mirror parity at every declaration site:** `grep '^(tools|requires_tools):'`
   under `packs/` returns **113 matches across 107 files** — 56 agents + 51 skills
   + 6 `requires_tools:` — and each equals its root line including quoting style
   and element order. `packs/kai-core/scripts/lib/loader-contract.mjs:15-24`
   equals `scripts/lib/loader-contract.mjs:15-24`. Mirrors still carry their
   injected preflight block (checked `packs/kai-engineering/agents/principal-swe-infra.agent.md:1-30`).
5. **No retired spelling survives anywhere.** Repo-wide search for a
   `tools:`/`requires_tools:`/`allowed-tools:` line containing
   `bash|shell|view|create|grep|glob|task|web_search|web_fetch` returns **two**
   hits, both historical quotations inside coordination threads
   (`area-plugins-tool-allowlist-fix.md:148`, `pack-split-preflight-compat.md:111`).
   Zero under `agents/`, `skills/`, `packs/`, `test/`, `examples/`, `scripts/`.
6. **The `requires_tools` inheritance closure holds.** `validate-plugin.mjs:656-670`
   demands every agent inheriting a `requires_tools` skill declare each named
   tool. The only two agents without `execute` — `principal-ai-applied-engineer`,
   `principal-ai-researcher` — inherit none of the six (`**Inherits:**` lines read).
   `principal-swe-infra` inherits `kai-core-work-activity` and declares `execute`.
7. **A11 carve-out, clause by clause.** Clause 1: `pack-plan.mjs:49` `PACKS_DIR`,
   `:63` `PACKS` (core 7 / engineering 20 / product 9 / gtm 11 / personal 9 —
   matching on-disk mirror counts), `:99` `PACK_ORDER`, `:104`
   `SKILL_OWNER_OVERRIDES` — same identifiers at the same line numbers cited
   before the change. Clause 2: `plugin.json:2` `kai`,
   `.github/plugin/marketplace.json:2` `kai-plugins`, five pack names unchanged;
   `validate-plugin.mjs:680-682` still pins `kai-plugins`/`kai`. Clause 3:
   `scripts/lib/{preflight,degraded,inherits}-block.txt` contain **no**
   tool-vocabulary token at all, so the migration had nothing to strand there.
8. **Validator rejects retired aliases** — read, not assumed:
   `SUPPORTED_TOOLS` = `{execute, read, edit, search, agent, web, todo, ask_user,
   skill, read_agent, write_agent, session_store_sql, playwright}` in both copies;
   all nine retired spellings absent. Only these two copies exist repo-wide
   (`grep SUPPORTED_TOOLS **/*.mjs`), so the hand-sync surface did not grow.
9. **Release metadata is lockstep `1.0.6`:** `package.json:3`, `plugin.json:4`,
   `marketplace.json:9,17,40,63,86,109`, all five packs'
   `package.json`/`plugin.json`/`package-lock.json`, root `package-lock.json:3,9`,
   `README.md:38`, `CHANGELOG.md:7` with the `:3105` compare link.
10. **Gate preconditions I could check independently all hold**, which is why I
    find the reported green runs credible: golden `test/fixtures/inventory.json`
    counts 56/51 and carries no tool names (host-contract inventory is insensitive
    to this migration); README status stamp says 56 agents / 51 skills;
    `[1.0.6]` section + compare link exist (release hygiene); every declaration
    is in `SUPPORTED_TOOLS` (validate-plugin); every mirror declaration equals its
    root (`--check` parity at the only lines this change touches); each malformed
    fixture isolates one error (`--self-test`).

### What remains `reported`, stated rather than absorbed

This session has **no shell** — `git`, `node`, `npm` are not bound to it.
Therefore:

- **The commit diff was not read.** The claim *"all 214 changed root/mirror files
  differ only in `tools:` or the six `requires_tools:` lines"* is `reported` from
  `principal-swe-infra`'s diff verifier. My independent bound is: every
  `tools:`/`requires_tools:` line in all 214 files is in the migrated vocabulary,
  every mirror line equals its root, and the mirrors' injected blocks are intact.
- **No gate was run by me.** `validate-plugin`, `host-contract --self-test`, the
  four `pack-preview --gate`s, `pack-preview --check`, `release-guard`, `npm test`
  are `reported` green at 0140 and corroborated only as in point 10 above.
- **PR-body content is unverifiable from here.** Acceptance requires the three
  carve-out clauses and the disclosure table in the PR body; both exist in this
  thread and are transcribable, but no PR was read.
- **`git status` cleanliness is unverified.** HEAD matches the reviewed ref by
  ref-file read.

### P1 — one finding, records-only

**P1-1 — the item record is still bound to the superseded ref.**
`kai/coordination/items/area-plugins-tool-allowlist-fix.md` carries
`change_ref: f093c5a…` and `completed_reviews[0].change_ref: f093c5a…` at
`version: 5`, while the implementation under review — including the four P2
corrections in `docs/host-capabilities.md` and `test/fixtures/host-loader/invalid/*`
— is `9b98143`. The steward's own 0125 handoff set this precondition: *"If any
tracked file changes, update `change_ref` and re-dispatch the architecture review
against the new ref."* The re-dispatch happened; the `change_ref` update did not.
Related: no lease covered the 0140 remediation pass (all five lease fields null)
and no `HANDOFF` block closes it — this thread ends at the evidence entry.

**This is not a code defect and needs no further architecture pass.** It is the
bookkeeping that makes this approval attach to the right commit. Until a
lease-holding role sets `change_ref: 9b98143…` and records this verdict, the item
record asserts a `changes-requested` review against a commit that no longer
describes the tree. Owner: `director-chief-of-staff` / `principal-product-manager`
under a lease. I hold none and did not edit the record.

### P2 — four, all non-blocking, none requiring a code change to the migration

**P2-1 — the disclosure table guards one direction only; the widenings are
undisclosed. Disclosed here, so the gap is closed by publication, not by a diff.**
Every row correctly reads `capability loss: none`. But collapsing a family onto
its primary alias *broadens* authority wherever a declaration previously held
only part of the family, and the documented vocabulary makes the finer grain
inexpressible (A23: primary aliases only; the compatible aliases that would
preserve it — `Write`, `Grep`, `Glob` — carry unknown validator behaviour, which
is exactly what this milestone refuses to bet on). Derived from the implementer's
own retired-token column plus the post-change declarations:

- **File family — 16 declarations gain create authority** (held `edit`, never
  `create`; now hold `edit`, which covers both): agents `instructor-teacher`,
  `principal-product-manager`, `principal-product-strategist`,
  `workflow-course-to-audio`, `workflow-product-explore`, `workflow-self-check`;
  skills `build-diagrams`, `coding-style`, `extract-writing-style`,
  `kai-core-content-grounding`, `kai-core-initiative-stewardship`,
  `kai-core-web-content-extraction`, `kai-core-web-evaluation`,
  `onboard-to-codebase`, `pr-sizing`, `product-exploration`.
- **Web family — 3 agents gain fetch authority** (held `web_search` only):
  `instructor-path-mentor`, `instructor-tutor`, `principal-engineer-career-mentor`.
- **No widening on `execute`** (`bash`+`shell` were always paired, 54/54),
  **none on `search`** (`grep` and `glob` absent on exactly the same declarations),
  **none on `read`/`agent`**.
- **The one deliberate read-only design survives intact:** `workflow-issue-analysis`
  held neither `create` nor `edit` and still declares no file-write token — the
  design `validate-plugin.mjs:620-623` exists to protect.

On the measured hosts the practical delta is likely zero (unrecognized names are
ignored and the file tools appear base-granted), so this is a change to *declared*
least privilege, not to observed behaviour. **No code change requested** — the
alternative is inventing undocumented spellings, which is the defect being fixed.
The acceptance call ("is a 19-declaration widening of declared authority
acceptable?") is the steward's, and `principal-security` is the role to opine if
the operator wants a control judgment. I do not accept residual risk here.

**P2-2 — two live prose references still name retired spellings.**
`docs/workspaces.md:90` ("Copilot CLI's background `task`/`write_agent`
messaging") is the same defect class as the fixed `host-capabilities.md:16`, and
`scripts/validate-plugin.mjs:616` says a skill's procedure is *"impossible without
`bash`"* where the contract now says `execute`. Both are cosmetic.
`docs/proposals/pack-architecture.md:459-461` also names `task` and should be left
alone — it is a historical proposal record. Neither live file is in this item's
`touches`; **do not widen this item for them.** File as a follow-on nit.

**P2-3 — the lifted stop is not annotated where the stop lives.**
`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md`
§12.4 still reads *"no declaration migration may be authored on this evidence"*
with no cross-reference to the 0125 lift. The lift is durable in this thread,
scope-brief A28 and `northstar.md:487` — but a reader who opens the canonical
decision sees an unlifted stop and a shipped migration. One sentence with a
pointer fixes it. Steward's artifact, steward's edit.

**P2-4 — thread/board hygiene.** No `HANDOFF` block closes the 0140 remediation
pass (see P1-1), and `BOARD.md:48-49` still shows this item `ready` with an unmet
dependency and `host-tool-conformance` `in-progress`. BOARD is derived and
reconciled by `director-chief-of-staff`; the steward already recorded it at 0125.
Restated here only so this review's counts are complete.

### Why this is APPROVED rather than held

Three things had to be true, and each is now checkable rather than asserted.
**The vocabulary is one vocabulary** — 214 declaration sites, two contract copies,
one set of names, with retired spellings rejected by the guard rather than merely
absent. **Capability was replaced, never deleted** — 113 disclosed fields, zero
drops, zero token additions, specialized tools 1:1, and the one agent designed
not to write still cannot write. **The claim matches the evidence** — the item
promises what the runtime channel measured and explicitly refuses to promise what
only an interactive launch can show. That last one is the real remediation: the
prior block was never about the diff, it was about a record that promised a
silence nobody had observed. Shrinking the promise to fit the evidence closed it.

What I am **not** clearing: `shipped`. That still needs the operator to deploy
and read the startup warnings, and a residual `edit` warning routes to §7.2 B2
documentation plus an upstream report — not to another declaration change.

---

## HANDOFF 2026-08-28-0141 — principal-swe-architect -> director-chief-of-staff / principal-product-manager (steward)

- did:       Re-ran the independent-architecture review bound to `9b98143c7b7ac46bdd0db88f9cf51ee5956da030`. Re-verified all 56 root agent and 51 root skill declarations against the pre-change baselines, the six `requires_tools:` migrations, declaration parity across all 107 generated mirrors, both `SUPPORTED_TOOLS` copies, the `requires_tools` inheritance closure, the 113-row disclosure table's completeness, all three A11 carve-out clauses, the four P2 corrections, lockstep `1.0.6` metadata, and the warning-claim wording in the item, `CHANGELOG` and `README`. Derived and disclosed the previously-unstated authority widenings. Edited no implementation file, no item frontmatter, and ran no command.
- state:     **APPROVED** — P0 0 / P1 1 / P2 4; `satisfies_requirement: true`, **bound to `9b98143` only**.
- needs:     **`director-chief-of-staff` / steward, under a lease** — record this approval on the item: `change_ref -> 9b98143c7b7ac46bdd0db88f9cf51ee5956da030`, append the `completed_reviews` entry (`principal-swe-architect` / `independent-architecture` / `implementation` / `approved` / `satisfies_requirement: true` / this thread entry), and reconcile `BOARD.md:48-49` (P1-1, P2-4). **Steward** — accept or route the P2-1 widening disclosure (19 declarations; `principal-security` if a control opinion is wanted) and annotate the conformance decision §12.4 with the 0125 lift (P2-3). **Follow-on, not this item** — `docs/workspaces.md:90` and `scripts/validate-plugin.mjs:616` retired-name prose (P2-2).
- artifacts: this thread entry (the durable review record). `kai/coordination/items/area-plugins-tool-allowlist-fix.md` **not edited** — no lease held.
- evidence:  `observed` — first-hand file reads at `C:\src\kai` at HEAD `9b98143…`, enumerated in the review above, plus the independently-installed `0.64.0` tree as a corroborating pre-change baseline. `reported` — the 0140 gate runs (`validate-plugin`, `host-contract --self-test`, four `pack-preview --gate`s, `pack-preview --check`, `release-guard`, `npm test`, the diff verifier) and the §12.2 probe results. **Not run:** every gate, `git`, `node`, `npm` — this session has no shell, so the commit diff was not read and no gate result is claimed as mine.
- questions: none blocking. One owed observation, still the operator's alone: after deployment, launch a kai agent interactively and read the startup warnings (acceptance box 7). No noninteractive proxy may be manufactured.
- next:      Record the approval against `9b98143`, then `workflow-pull-request` / `workflow-ship`. `shipped` requires operator deployment and verification. The milestone-2 PR-3 ordering constraint still stands: `area-plugins-m2-mode-selection` does not open while this item is open.

---

## RECORD CLOSURE 2026-08-28-0215 — director-chief-of-staff / steward

- Recorded the final independent-architecture approval against
  `4db3c907142ea510b4d5ec7f02668029d616d1c2`.
- Corrected the superseded 0140 disclosure for the final tree: the three
  search-only roles retain `web_search`; their final delta is **no token change**
  and no authority widening. The 16 `edit` declarations were also unchanged in
  token and never widened. Residual declared-authority widening is zero.
- Ratified `docs/workspaces.md` and the conformance decision §12.4 in this
  item's `touches`; both are directly coupled live documentation corrections.
- Reconciled `BOARD.md`. The `v1.0.5` probe item is `shipped`; this item is
  `in-review` and routes to `workflow-pull-request`.
- Final PR disclosure must be generated from the final tree, not copied from
  the superseded 0140 table's three `web_search->web` rows.

## HANDOFF 2026-08-28-0215 — director-chief-of-staff -> workflow-pull-request

- did: Final implementation and exact-ref architecture/security reviews are
  complete. P0/P1 implementation findings are closed. Full local validation
  passed. Release metadata is `1.0.6`.
- state: `in-review`
- needs: Open the PR with the A11 carve-out clauses, final capability mapping,
  exact validation evidence, and the honest interactive-warning caveat.
- change_ref: `4db3c907142ea510b4d5ec7f02668029d616d1c2`
- next: PR checks, merge, exact-main checks, tag/release `v1.0.6`, then operator
  interactive warning observation before marking this item `shipped`.

---

## RELEASE RECORD 2026-08-28-0240 — workflow-ship

| phase | transition | evidence |
|---|---|---|
| PREPARE | `in-review` v6 -> `release-ready` v7 | PR #195 exact head `ba7840e272e5e5f5a9bac69bb624197ce4216b0c`; all required checks passed |
| CONFIRM-START | `release-ready` v7 -> `deploying` v8 | PR #195 merged to main as `c23e752ca5f92b28657267d5c1ff0296fc0ff932` |
| CONFIRM-COMPLETE | `deploying` v8 -> `production-verification` v9 | exact-main workflow `33159065597` passed; public release `v1.0.6` targets main |

Rollback was not invoked. The release artifact is public and the implementation
is deployed through the marketplace source. This does **not** establish the
interactive validator result: prompt mode cannot expose that startup channel.

## QUESTION Q-area-plugins-tool-allowlist-fix-02 2026-08-28-0240 — workflow-ship -> @operator
- status: open
- kind: action
- blocking: yes
- context: `v1.0.6` is published and exact-main CI passed. The only unchecked
  acceptance criterion is the real interactive startup warning observation.
- ask: Update the installed Kai packs, launch one Kai agent interactively, and
  report whether warnings for `create`, `edit`, or `grep` remain. If only
  `edit` remains, the pre-agreed disposition is to document the benign host
  drift and file it upstream; do not change declarations again.
- answer_by: before `area-plugins-tool-allowlist-fix` can move from
  `production-verification` to `shipped`

## HANDOFF 2026-08-28-0240 — workflow-ship -> @operator

- did: PR #195 merged, exact-main CI passed, and `v1.0.6` was published.
- state: `production-verification`
- needs: one interactive launch after updating the installed packs; report the
  startup warning result.
- evidence: PR #195; main `c23e752`; workflow `33159065597`; release `v1.0.6`.
- next: answer `Q-area-plugins-tool-allowlist-fix-02`; the director then closes
  the item or records the residual `edit` drift and upstream issue.

---

## REVIEW 2026-08-28-0157 — principal-security · independent-security (exact ref, bounded to P2-1)

- **verdict:** **APPROVED** — **CONDITIONAL** in security terms — P0 **0** / P1 **0** / P2 **3**
- **change_ref reviewed:** `9b98143c7b7ac46bdd0db88f9cf51ee5956da030` (`.git/HEAD`
  → `refs/heads/fix/area-plugin-tool-aliases`; that ref file reads `9b98143c…`).
  Bound to this ref only.
- **Scope, bounded as dispatched:** the residual declared-authority widening in
  `REVIEW 2026-08-28-0141` P2-1 — the 16 file-family declarations and the 3
  web-family agents. **Everything else in this migration is explicitly excluded**
  and is not re-reviewed here: enumeration completeness, mirror parity, the A11
  carve-out, gate results, the §12.4 lift, the warning-claim wording, release
  metadata, and the four architecture P2s.
- **Authorization:** read-only. No command run, no gate run, no host probe, no
  network action against any kai or operator system. One public-documentation
  fetch (GitHub Docs, custom-agents configuration) carrying no repo content.
- **Zero implementation changes requested at this ref.** All three findings are
  records/ownership items belonging to other roles.
- **No local run directory was created.** This session has no shell to make one,
  and nothing in this assessment needs local-only handling — there is no secret,
  no customer data, no private topology and no exploit material in it. This
  thread section is the complete durable record.

### 1. The bounded conclusion, stated before the reasoning

**The dispatched question was "is a 19-declaration widening of declared authority
acceptable?" The honest answer is that it is not a 19-declaration widening.**

- **File family — 16 declarations, authority delta zero.** The token `edit` is
  **unchanged** in all 16. It was there before the migration and it is there
  after, same token, same position in the family. Nothing conferring file
  authority was added to any of the 16.
- **Web family — 3 agents, authority delta real.** `web_search` → `web` is a
  genuine broadening on the live binary, and it is the only item in the set that
  warrants a human acceptance.

So the set to accept is **3 declarations, not 19**, and the reason the other 16
are safe is not the reason P2-1 gives. That distinction is finding SEC-1 and it
matters more than it looks — an accepted risk recorded against the wrong
mechanism is a risk nobody can re-audit later.

### 2. What I verified first-hand (`observed` — file reads at `C:\src\kai`, HEAD `9b98143`)

1. **The 19 declarations at this ref.** Six file-family agents —
   `instructor-teacher`, `principal-product-manager`, `principal-product-strategist`,
   `workflow-course-to-audio`, `workflow-product-explore`, `workflow-self-check` —
   and ten skills — `build-diagrams`, `coding-style`, `extract-writing-style`,
   `kai-core-content-grounding`, `kai-core-initiative-stewardship`,
   `kai-core-web-content-extraction`, `kai-core-web-evaluation`,
   `onboard-to-codebase`, `pr-sizing`, `product-exploration`. Three web-family
   agents — `instructor-path-mentor`, `instructor-tutor`,
   `principal-engineer-career-mentor`. Line 4 of each read directly.
2. **`edit` is not in the retired-token column for any of the 16.** Cross-read the
   0140 disclosure table row by row for those files: each lists only
   `bash|shell|view|grep|glob → …`. `edit` passes through untouched. Combined
   with the post-change lines, the 16 declarations' file-family token is
   **byte-identical across this migration**.
3. **The write-less design holds.** `agents/workflow-issue-analysis.agent.md:4` is
   `["execute", "read", "search", "ask_user", "web", "skill"]` — no `edit`,
   confirmed independently of the architecture pass.
4. **All nine widened *agents* already declare `execute`** — the six file-family
   and the three web-family, checked individually. This is the fact that bounds
   the whole question, and it is why neither family's coarsening creates a
   capability the same declaration did not already reach.
5. **No second-order widening leaked in.** `web` appears on exactly **28** root
   agents, matching the pre-change `web_search` count of 28 — so no agent that
   held neither web token acquired one. `agent` on exactly **5**, matching the
   pre-change `task` count. `todo` on **0**. `execute` absent on exactly the two
   agents that lacked `bash`/`shell` before (`principal-ai-applied-engineer`,
   `principal-ai-researcher`) — both still `["web", "read", "edit", "search",
   "ask_user", "skill"]`, no shell acquired. `search` still absent on exactly the
   four that lacked `grep`/`glob`. The widening surface is closed at 19, and
   within it the only real item is 3.
6. **The declaration guards the dispatch names as retained are real, not assumed.**
   `scripts/lib/loader-contract.mjs` `loaderErrors()` rejects a missing `tools`
   key, a non-inline-array value, an empty array, and any token outside
   `SUPPORTED_TOOLS`. `SUPPORTED_TOOLS` is the seven primaries plus six
   specialized names — no `*`, no retired spelling. **Wildcard and omission
   remain structurally unavailable**, which is the control that actually carries
   least privilege here.
7. **The repo already knows tool tokens cannot express behavioural constraints,
   and already compensates.** `scripts/validate-plugin.mjs:569-604` pins eleven
   assessor roles to inherit `kai-core-no-self-remediation`, with the comment:
   *"a `tools` grant is a capability, so it cannot be expressed in frontmatter —
   one `edit` grant covers both sides of the line. Pinning the roster here is what
   stops the contract from silently falling off a role."* Two of the declarations
   in scope — `workflow-self-check` and `workflow-issue-analysis` — are on that
   roster and the pin is untouched by this change. **This is the strongest
   compensating control in the set and the correct pattern for anything the new
   coarse vocabulary can no longer say.**

### 3. Documentation, read first-hand this pass (`observed` — public GitHub Docs)

I opened the published tool-alias table directly rather than relying on the
transcription in decision §1.1. It agrees, and it adds three facts the thread did
not carry — each of which changes the analysis:

| documented fact | why it matters here |
|---|---|
| Primary aliases are exactly `execute`, `read`, `edit`, `search`, `agent`, `web`, `todo` | Confirms **no finer-grained primary alias exists**. The dispatch's premise holds. |
| `edit`'s compatible aliases are `Edit`, `MultiEdit`, `Write`, `NotebookEdit` — **aliases of one primary**, not narrower grants | `Write` is not a separate "create" tool. Declaring `Edit` without `Write` is **not documented to narrow anything**. Option C cannot express the grain it was proposed to preserve. |
| `web`'s purpose is stated as *"fetching content from URLs and performing a web search"*; compatible aliases `WebSearch`, `WebFetch` | One grant, two capabilities, **by design**. The web coarsening is inherent to the documented vocabulary, not an implementation choice. |
| **"All aliases are case insensitive"** | `Grep` and `grep` are the same alias — so the live binary warning on lowercase `grep` is genuine drift, and `Grep` would be expected to warn identically. Option C's candidates inherit the exact defect being fixed. |
| **"All unrecognized tool names are ignored"** | An ignored token grants nothing. A declaration that names an ignored token is not narrower — it only *reads* narrower. |
| `create`, `web_search`, `web_fetch` appear **nowhere** in the alias table | `create` was never a grant-conferring token under the published contract. |

### 4. Finding-by-finding: is this acceptable residual risk?

#### 4.1 File family — 16 declarations — **no widening occurred**

P2-1 frames these as *"held `edit`, never `create`; now hold `edit`, which covers
both."* Both halves of that sentence describe the same token. Under the review's
own premise — that `edit` covers the family — those 16 **already covered the
family before the migration**, because they already declared `edit` and still do.

Test it against every host model on the table:

| host model | pre-change grant for the 16 | post-change grant | delta |
|---|---|---|---|
| Published contract: `edit` is the family primary, `create` unrecognized → ignored | full edit family | full edit family | **none** |
| Live binary: both `edit` and `create` are warned, i.e. outside its validator vocabulary | whatever the runtime base-grants | same | **none** |
| Hypothetical: host honours a narrow lowercase `create` distinct from `edit` | edit-only | edit-only (no `create` added) | **none** |

There is no reading in which those 16 gained authority, because **no token was
added to them**. What changed is that 49 *sibling* declarations stopped naming
`create`. The 16 look coarser only in comparison. That is a property of the
frequency table, not of the declarations.

**Security consequence: none. Not a finding.** And the corollary matters for the
record: *the finer grain was never held*, so it cannot have been lost, and no
option — A, B or C — could have preserved it.

The ten skills in this set are the same story with an extra bound: a skill's
`tools:` is what the skill may use once loaded into an agent that already holds
its own allowlist, so a skill declaration cannot exceed its host agent. Five of
the ten (`extract-writing-style`, `kai-core-initiative-stewardship`,
`kai-core-web-content-extraction`, `kai-core-web-evaluation`,
`onboard-to-codebase`) declare `execute` in their own right; the other five
(`build-diagrams`, `coding-style`, `kai-core-content-grounding`, `pr-sizing`,
`product-exploration`) hold `edit` and nothing more dangerous. Unchanged either
way.

#### 4.2 Web family — 3 agents — **the one real widening. P2. Acceptable, with a named accepter.**

This one is real, and it is real for a reason the architecture review did not
have: **the live binary's validator does *not* warn on `web_search` or
`web_fetch`** — only on `create`, `edit`, `grep` (`reported`, operator, §1.2). A
name the validator accepts is a name it distinguishes. So on the live binary the
finer grain here was expressible and was in fact being expressed:
`instructor-path-mentor`, `instructor-tutor` and `principal-engineer-career-mentor`
declared search and not fetch. Post-change they declare `web`, which the
documentation defines as fetch **and** search. **Declared authority broadens.**

The threat this touches is the one worth naming plainly: **`web_fetch` on an agent
that can also read local files is an egress and exfiltration channel, and an
SSRF-adjacent one** — content is read, encoded into a URL, and sent outbound;
internal or link-local addresses may be reachable depending on host behaviour.
Prompt injection from fetched content is the realistic initiator. That is exactly
the abuse case a search-only grant partially withholds.

Why it is nonetheless **P2 and acceptable**, with each mitigation labelled:

1. **All three already declare `execute`** (`observed`). The probe harness itself
   uses `execute` to write files via `node -e` (`reported`, decision §4.2), and
   the working environment provides `curl`. Arbitrary outbound egress was already
   inside these agents' declared authority. The new token adds a *more convenient*
   path, not a *new* one. (`inferred`, medium-high confidence, basis: probe §4.2
   plus environment tooling.)
2. **The host permission layer sits above the allowlist and is untouched.** The
   probe had to add outer `--allow-all-tools` precisely because *"host permission
   policy could masquerade as an inner agent-allowlist denial"* (`reported`,
   §12.1 defect 2). In ordinary operator use the declaration is the inner of at
   least two gates; this change moves the inner one only.
3. **Blast radius is the right shape.** All three are `kai-personal` mentoring
   roles — no credential handling, no production authority, no
   `read_agent`/`write_agent` transport, no `agent` delegation token. They hold
   `execute`, `read`, `edit`, `search`, `ask_user`, `web`, `skill` and nothing
   else. The roles that *do* handle sensitive material — `principal-security`,
   `principal-privacy-compliance` — held both web tokens before and gained
   nothing.
4. **Fleet baseline is unchanged.** 25 agents already legitimately held fetch and
   54 hold shell. Three more declared-fetch agents does not change the fleet's
   exposure class.
5. **Agents run only when selected or delegated**, and every other explicit bound
   on these three is retained (`observed`, item 5 above).
6. **No documented alternative exists.** `web` is one grant by published design.
   `WebSearch`/`WebFetch` are aliases of that same primary, not narrower grants.

**Residual risk: three `kai-personal` agents hold a declared web-fetch grant they
did not previously declare. I do not accept it.** It is the steward's or the
operator's call, and it should be recorded as a three-declaration acceptance with
the mechanism above, not folded into a nineteen-declaration one.

### 5. The three options, compared on control grounds

| | **A — accept coarse documented primaries** *(what ships at this ref)* | **B — retain warned/retired legacy spellings** | **C — undocumented/compatible spellings** |
|---|---|---|---|
| Expresses the finer grain? | No — and for the file family there was never any grain to lose | **Only apparently.** `create` and `edit` are both in the live binary's *warned* set; an ignored token grants nothing | **Probably not at all.** `Write`/`Edit`/`MultiEdit` are documented aliases of one primary; nothing says they narrow it |
| Documented? | Yes, entirely | `create`/`web_search`/`web_fetch` appear nowhere in the published table | Documented as aliases — but **not** as narrower grants; behaviour `unknown` |
| Measured runtime-safe? | Yes — `R2-primary` valid direct and delegated on `1.0.79` and `1.0.81` (`reported`, §12.2) | Yes for the runtime, but it is the configuration the host complains about | **No.** The `R5 edit-family` and `R6 search-family` rows were specified and are **not** in the §12.2 results |
| Capability-loss exposure | None — replacement, never deletion; disclosed in 113 rows | **Real.** `R9-control` shows undeclared write/execute/agent were *denied*; keeping ignored tokens risks the §7.3 hard stop if the host tightens | **Real and unmeasured**, on the same mechanism |
| Effect on the record's honesty | Coarse **and accurate** | **Fine-looking and false** — a least-privilege claim with no enforcement behind it | Unknowable |
| Passes the guard at this ref | Yes | No — `loaderErrors()` rejects retired spellings | Yes only if `SUPPORTED_TOOLS` is widened to admit unmeasured names |

**Option B is the worst of the three on security grounds, not the safest.** Its
appeal is that the declarations keep looking narrow. But `create` is unrecognized
under the published contract and warned by the live binary, so retaining it
preserves the *appearance* of least privilege while the host enforces nothing —
and a control that is believed and not enforced is worse than a coarse control
that is accurately described. It also re-admits the exact defect class the guard
now rejects, and risks genuine capability loss if the host ever tightens to its
published vocabulary.

**Option C pays unmeasured capability-loss risk for a least-privilege gain that
is unprovable.** Aliases are documented case-insensitive, and the live binary
already warns on `grep` — so `Grep` should be expected to warn identically. There
is no security upside worth that bet.

**Option A is the recommended disposition.** It is the only option that is
documented, measured runtime-safe on both CLI versions, compatible with the
retained guard, and — decisively — the only one whose record is *true*. The
controls that actually carry least privilege here survive it intact: explicit
non-empty arrays, wildcard and omission forbidden, retired spellings rejected,
the assessor-roster contract pin, and the unchanged host permission layer.

### 6. Findings

**P0 — none.** No cross-boundary break, no secret exposure, no privilege
escalation path, nothing to route to `workflow-incident-response`.

**P1 — none.** Nothing here is release-blocking. The one real widening is bounded
by a capability the same declarations already hold.

**P2-SEC-1 — the widening disclosure overstates the delta 19:3, and attributes the
16 to the wrong mechanism.** P2-1 records *"16 declarations gain create
authority"* on the premise that `edit` covers both — but those 16 declared `edit`
before the migration and declare the same token after. There is no delta. P2-1
also grounds its downgrade in *"the file tools appear base-granted"*, while the
sharpest evidence row, `R9-control`, shows the opposite for the write family:
declaring `read` plus two bogus names left **write, execute and agent
unavailable** (search was still granted). Write is gated, not base-granted. The
16 are safe because **their token never changed**, not because writes are free.
Accepting a phantom sixteen buries the one that matters and sets a precedent
("we accepted an authority widening") against a mechanism that never occurred.
**Owner:** `principal-swe-architect` (its finding) or the steward when recording
acceptance. **Records-only; no code change.**

**P2-SEC-2 — the one real widening has no named accepter and no note in the
contract.** Three `kai-personal` agents move from a validator-recognized
search-only declaration to `web` (fetch + search). Acceptable per §4.2, but it
needs (a) an explicit three-declaration acceptance by the steward or operator,
and (b) one comment line beside `SUPPORTED_TOOLS` in
`scripts/lib/loader-contract.mjs` naming the two families whose grain is now
inexpressible — **`edit` covers create/write; `web` covers fetch *and* search** —
so the next author does not read a coarse token as a narrow one. That file
already carries the *"lint heuristic, not a host allowlist"* caveat; this belongs
in the same place. **Explicitly a follow-on, not a change at this ref** — editing
it now would invalidate the architecture approval and re-trigger mirror parity for
a comment. **Owner:** steward (acceptance) + `principal-swe-infra` (the comment,
as a follow-on).

**P2-SEC-3 — a coarse token cannot express a no-write posture, and the repo's only
working answer to that is already in `validate-plugin.mjs`.** Worth stating
plainly so nobody cites the wrong thing as a control: `workflow-issue-analysis`'s
"cannot write" design is a **declared posture, not an enforced boundary** — it
declares `execute`, and `execute` writes files (the probe harness does exactly
that). That is **pre-existing and unchanged at this ref** — it held `bash`/`shell`
before — and is out of this item's scope; I raise it only because the coarsened
vocabulary makes it easier to mistake a token for a boundary. If the steward wants
declared least privilege to be *enforceable* after this coarsening, the pattern is
the existing assessor-roster pin (`validate-plugin.mjs:569-604`), not a new tool
token: a small pinned list asserting that named read-only roles must not declare
`edit`, ~15 lines, offline, no host needed. **`expands-scope` — a proposal to the
steward, not something I add or require.**

### 7. What I did not review, and what I do not decide

- **Excluded by dispatch and not re-reviewed:** enumeration completeness, mirror
  byte parity, gate results, the A11 carve-out, the §12.4 lift, release metadata,
  the warning-claim wording, and architecture P1-1 / P2-1..P2-4 dispositions.
- **`reported`, not verified by me:** every gate run, the diff verifier, the
  113-row table's per-file accuracy beyond the 19 rows I cross-read, the §12.2
  probe results, and the operator's original warning text. This session has no
  shell; **the commit diff was not read** and no command was run.
- **`unknown`:** whether the host enforces a skill's `tools:` list at all;
  whether `web` is base-granted (the probe records the web family as
  `not-testable` without `--allow-network`); whether any compatible alias narrows
  its primary; and the validator channel, which remains `unobserved`.
- **I do not accept residual risk, and this review does not clear `shipped`.**
  The interactive startup-warning observation remains owed by the operator and is
  untouched by this pass.

---

## HANDOFF 2026-08-28-0157 — principal-security -> principal-product-manager (steward) / director-chief-of-staff

- did:       Bounded independent-security review at `9b98143c7b7ac46bdd0db88f9cf51ee5956da030`, scoped to the `REVIEW 2026-08-28-0141` P2-1 residual authority widening only. Verified the 19 declarations first-hand, cross-read them against the 0140 disclosure table's retired-token column, checked for second-order widening across `web`/`agent`/`todo`/`execute`/`search` (none), read the declaration guards and the assessor-roster pin, and opened the published GitHub tool-alias table directly. Compared the three dispositions on control grounds. **Edited no implementation file, no item record, and ran no command.**
- state:     **APPROVED** — security verdict **CONDITIONAL**, conditions records-only — P0 **0** / P1 **0** / P2 **3**. **Zero implementation changes requested at this ref.** Recommended disposition: **Option A — accept the coarse documented primary aliases.** Corrected scope of the acceptance: **3 declarations, not 19.**
- needs:     **Steward** — (1) record the acceptance as a **three-declaration** web-family widening (`instructor-path-mentor`, `instructor-tutor`, `principal-engineer-career-mentor`) with the mechanism in §4.2, **not** as nineteen; the 16 file-family declarations kept an unchanged `edit` token and have no delta (SEC-1). (2) Accept or route that residual risk — **`principal-security` does not accept it** (SEC-2). (3) Optionally rule on the pinned no-write guard proposal (SEC-3, `expands-scope`). **`principal-swe-infra`, follow-on** — one comment line beside `SUPPORTED_TOOLS` naming the two coarsened families; **not at this ref.** **`principal-swe-architect`** — SEC-1 corrects P2-1's count and its stated basis.
- artifacts: this thread section is the complete durable record. No local run directory was created — this session has no shell to make one, and nothing in the assessment requires local-only handling (no secret, no customer data, no private topology, no exploit material). `kai/coordination/items/area-plugins-tool-allowlist-fix.md` **not edited** — no lease held.
- evidence:  `observed` — file reads at `C:\src\kai` at HEAD `9b98143…` (the 19 declarations, `workflow-issue-analysis`, `SUPPORTED_TOOLS` and `loaderErrors()`, the assessor roster pin, and the `web`/`agent`/`todo`/`execute`/`search` counts), plus the published GitHub custom-agents tool-alias table fetched this pass. `reported` — the 0140 disclosure table, the §12.2/§12.1 probe records, and the operator's warning text. `inferred` — that retained `execute` already subsumes file creation and outbound egress for the widened agents (medium-high; basis: probe §4.2 and available environment tooling). **Not run:** every gate, `git`, `node`, `npm`; the commit diff was not read.
- questions: none blocking. One decision is owed and it is not mine: whether the three-agent web-fetch widening is accepted.
- next:      Steward records the corrected three-declaration acceptance, then the existing `workflow-pull-request` / `workflow-ship` path. **This review does not clear `shipped`** — the interactive startup-warning observation remains the operator's alone, and the milestone-2 PR-3 ordering constraint is untouched by this pass.

---

## REVIEW 2026-08-28-0207 — principal-swe-architect · independent-architecture (exact ref, final)

- **verdict:** **APPROVED** — P0 **0** / P1 **2** / P2 **3**
- **change_ref reviewed:** `4db3c907142ea510b4d5ec7f02668029d616d1c2`
  (`.git/HEAD` → `refs/heads/fix/area-plugin-tool-aliases`; that ref file reads
  `4db3c907…`). `.git/logs/HEAD:535-538` records the branch from `main` at
  `71ee251`, then `f093c5a` *fix(host): use portable tool aliases*, `9b98143`
  *docs(review): resolve alias migration findings*, `4db3c90` *fix(host):
  preserve search-only web access*. Three commits on the branch.
- **satisfies_requirement:** `true` — **bound to `4db3c90`.** One bounded
  carry-forward is stated below so a records-only fix does not force a fourth
  exact-ref pass; anything outside that bound voids this approval.
- **Disposition: Endorse.** Zero implementation changes requested. `4db3c90`
  resolves the only real finding either prior review left open, and it resolves
  it by *not changing three declarations* rather than by seeking a human
  acceptance for changing them. That is the smaller structural move and it is
  the right one.

### 1. The headline answer to the dispatch

**Residual declared-authority widening at this ref is zero.** Not "acceptable" —
**zero**. There is no acceptance for the steward to record and no residual risk
for anyone to hold, because the widening was removed rather than accepted.

`principal-security`'s SEC-1 correction is **accepted in full, and it corrects my
own prior finding.** My `REVIEW 2026-08-28-0141` P2-1 was **half wrong**: the
16 file-family declarations never widened, because their `edit` token was
byte-unchanged across the migration — I derived a delta from a frequency table
rather than from the declarations, and 49 *siblings* dropping `create` is not
16 declarations gaining anything. The web-family half was right, and it is the
half `4db3c90` closes. The corrected count was 3; the count at this ref is 0.

### 2. What changed since `9b98143`, and why the shape is right

| force | option at `9b98143` | option at `4db3c90` |
|---|---|---|
| 3 `kai-personal` agents declared search-only web | migrate to `web` → declares fetch+search | **retain `web_search`** → declares search only |
| Who accepts the broadening? | nobody — `principal-security` explicitly declined (SEC-2) and the steward had not ruled | **no acceptance needed** |
| Capability delta vs `main` | search→search+fetch (declared) | **zero, in both directions** |
| Cost | a residual-risk record that must be re-audited later | one legacy name stays in the vocabulary |
| Reversible? | yes | yes — 6 declaration lines + 2 contract copies |

The cheapest resolution of a risk nobody would accept is to stop creating it.
Preserving three lines is a smaller structural change than migrating them and
then carrying a permanent acceptance record against them, so this is the shape
I endorse.

**The cost is real and I am not hiding it:** kai's vocabulary now has a third
tier. That tier is *smaller* than the alternative, and it is better evidenced
than the vocabulary at `9b98143` was — see §4.6.

### 3. The seam, at this ref

```text
            KAI DECLARATION VOCABULARY — SUPPORTED_TOOLS, 14 names, 2 copies
            scripts/lib/loader-contract.mjs:15-24  ==  packs/kai-core/…:15-24
            ┌────────────────────────────────────────────────────────────┐
            │ tier 1  documented primary aliases                         │
            │         execute read edit search agent web todo            │
            │         status: measured (R2-primary, 1.0.79 + 1.0.81,     │
            │                 direct + delegated)                        │
            ├────────────────────────────────────────────────────────────┤
            │ tier 2  specialized names, absent from the published       │
            │         alias table, retained because they are real        │
            │         ask_user  skill  read_agent  write_agent           │
            │         session_store_sql  playwright                      │
            ├────────────────────────────────────────────────────────────┤
            │ tier 3  retained legacy NARROW name    ◄── new at 4db3c90  │
            │         web_search        (web_fetch stays REJECTED)       │
            │         status: launch-safe in R8; grant not-testable      │
            └────────────────────────────────────────────────────────────┘
                    ‖  set-equal to REPO_TOOLS in scripts/lib/tool-conformance.mjs
                    ‖  = the R8-repo-current probe row, valid on both CLI builds
                    ▼
        loaderErrors()  REJECTS  bash shell view create grep glob task web_fetch
                        ACCEPTS  the 14 above — no wildcard, no omission, no empty
```

```text
  WEB FAMILY — the whole of the change at this ref

  pre-change (main @ 71ee251)                    at 4db3c907
  ─────────────────────────────────              ────────────────────────────────
  agents: 28 declare web_search
      ├── 25 also declare web_fetch  ──────────►  25 declare  web    (fetch+search)
      └──  3 declare search only     ──────────►   3 declare  web_search  UNCHANGED
      (0 declare web_fetch alone → rejecting web_fetch strands nothing)
  skills: 13 declare both           ──────────►  13 declare  web
  mirrors: 25 + 3 agents, 13 skills ──────────►  identical to their roots
                                                ────────────────────────────────
                                                declared-authority delta: ZERO
```

### 4. What I verified first-hand (`observed` — file reads at `C:\src\kai`, HEAD `4db3c907`)

1. **Ref binding.** `.git/refs/heads/fix/area-plugin-tool-aliases` =
   `4db3c907142ea510b4d5ec7f02668029d616d1c2`; `.git/HEAD` points at it;
   reflog shows the three-commit branch above.
2. **The three preserved declarations, line 4 of each root and each mirror,
   byte-equal pairs:**
   `agents/instructor-path-mentor.agent.md` and
   `agents/principal-engineer-career-mentor.agent.md` =
   `["read", "edit", "search", "ask_user", "execute", "web_search", "skill"]`;
   `agents/instructor-tutor.agent.md` =
   `["execute", "read", "edit", "search", "ask_user", "web_search", "skill"]`.
   Each is the exact order-preserving, de-duplicated image of its `main`
   predecessor (thread §2a lines 231/233/245) under
   `view→read`, `create→edit`, `grep|glob→search`, `bash|shell→execute`,
   **`web_search→web_search`**. Zero drops, zero additions, zero re-ordering.
3. **The web family partitions exactly, and I checked the partition by name, not
   by count.** The 25 root agents declaring `web` at this ref are *precisely* the
   25 that declared `web_fetch` on `main` (thread §2a plus the `web_fetch | 25`
   frequency row at line 317). The 3 declaring `web_search` are precisely the 3
   that had `web_search` without `web_fetch`. 25 + 3 = 28 = the pre-change
   `web_search` count. **No agent held `web_fetch` without `web_search`**, so
   rejecting `web_fetch` from the vocabulary strands no declaration and no
   fetch-only agent silently gained search.
4. **Skills are untouched by this commit and correct.** 13 root skills declare
   `web` — exactly the 13 whose disclosure rows carry both `web_search` and
   `web_fetch`. **Zero skills retain `web_search`**, which is right: none was
   search-only. 13 skill mirrors match (2 `kai-core`, 10 `kai-engineering`,
   1 `kai-gtm`).
5. **All 214 declaration sites still present and in-vocabulary.** `^tools:` /
   `^requires_tools:` across `agents/`, `skills/`, `packs/` resolves to **214
   files** — 56 root agents + 51 root skills + 56 agent mirrors + 51 skill
   mirrors — carrying 214 `tools:` lines plus 12 `requires_tools: [execute]`
   lines (6 root + 6 mirror). Repo-wide search for a
   `tools:`/`requires_tools:`/`allowed-tools:` line containing
   `bash|shell|view|create|grep|glob|task|web_fetch` under `agents/`, `skills/`,
   `packs/`, `test/`, `examples/` returns **zero**. `web_search` returns exactly
   **six** — the three roots and their three mirrors.
6. **The vocabulary now equals a measured probe row.** `SUPPORTED_TOOLS` (14
   names) is set-equal to `REPO_TOOLS` in `scripts/lib/tool-conformance.mjs:15-23`
   — i.e. exactly the `R8-repo-current` matrix row, recorded **valid, direct and
   delegated, on both `1.0.79` and `1.0.81`** with capabilities exercised
   (decision §12.2). At `9b98143` the 13-name set matched **no** measured row.
   This commit therefore *improves* the binding between the guard and the
   evidence, which is the opposite of what a re-admitted legacy name usually
   does, and it is the strongest single reason I endorse rather than defer.
   `tool-conformance.mjs` is **not** mirrored into `packs/` (`packs/**/lib/*.mjs`
   is six files, none of them it), so the hand-sync surface is still two copies,
   not three.
7. **Both `SUPPORTED_TOOLS` copies are byte-identical**, including comment text
   and element order (`scripts/lib/loader-contract.mjs:13-25` ==
   `packs/kai-core/scripts/lib/loader-contract.mjs:13-25`). The guard still
   rejects a missing `tools` key, a non-inline array, an empty array and any
   out-of-vocabulary token; wildcard and omission remain structurally
   unavailable.
8. **Specialized least privilege is preserved and unmoved.** `workflow-issue-analysis`
   is `["execute", "read", "search", "ask_user", "web", "skill"]` — still no
   file-write token, the design `validate-plugin.mjs:620-623` exists to protect.
   Spot-checked file-family declarations `instructor-teacher`,
   `principal-product-manager`, `workflow-self-check`, `skills/build-diagrams`,
   `skills/pr-sizing` — all still carry the same unchanged `edit`, no `create`
   equivalent added anywhere. `playwright`, `session_store_sql`,
   `read_agent`/`write_agent`, `ask_user`, `skill` are untouched by this commit.
9. **`requires_tools` inheritance closure holds trivially for the delta** — all
   three changed agents declare `execute`, so no inherited-skill requirement can
   be broken by this commit regardless of what they inherit.
10. **The two P2-2 prose fixes landed and are correct.**
    `docs/workspaces.md:90` now reads *"Copilot CLI's background
    `agent`/`write_agent` messaging"*; `scripts/validate-plugin.mjs:616` now reads
    *"impossible without `execute`"*. `docs/proposals/pack-architecture.md` is
    correctly left alone as a historical record.
11. **P2-3 landed.** The conformance decision §12.4 now carries *"Superseded
    stop, 2026-08-28"* naming scope-brief A28 and the steward ruling, and
    restating that interactive warning silence stays post-install operator
    evidence. A reader who opens the canonical decision no longer sees an
    unlifted stop beside a shipped migration.
12. **Packs and version metadata remain aligned.** Lockstep `1.0.6` across
    `package.json:3`, `plugin.json:4`, `.github/plugin/marketplace.json` (all six
    version fields), and all five packs' `package.json` / `plugin.json` /
    `package-lock.json`. `CHANGELOG.md` `[1.0.6]` section present with its
    `:3106` compare link. No pack carries its own `README.md`/`CHANGELOG.md` and
    `pack-plan` mirrors neither `docs/` nor `CHANGELOG.md`, so the prose edits in
    this commit cannot disturb mirror parity. No new version was minted, which is
    right — `1.0.6` is unreleased and this is a fix inside it.
13. **A11 carve-out still clean at this ref.** This commit touches no `PACKS`,
    `PACK_ORDER`, `PACKS_DIR`, `MARKETPLACE`, `SKILL_OWNER_OVERRIDES`, plugin
    identity, marketplace name, or any of the three injected contract blocks
    (`preflight`/`degraded`/`inherits`-`block.txt` contain no tool token at all).
14. **Test fixtures unchanged and still isolating.**
    `unsupported-tool.agent.md` = `[read, teleport]` — and `teleport` is still
    outside the widened vocabulary, so adding `web_search` did not defuse the
    fixture. `tools-not-array` scalar `read`; `name-mismatch` and
    `skill-key-on-agent` `[read]`; `argument-hint-array` `[read, search]`.

### 5. Warning claims — still honest, with one exception

The three separately-labelled warning claims are intact and **unaffected** by
this commit: `create` and `grep` appear in zero kai declarations (`observed`,
re-checked above); `edit` is retained deliberately and may still warn;
interactive-startup silence remains `unobserved` and operator-owned. `web_search`
is **not** in the operator's reported warned set (`create`/`edit`/`grep`), so
retaining it introduces no new warning claim and cannot falsify the existing
ones. `CHANGELOG.md:16-17` and `README.md:44` still say silence is unverified
because prompt mode does not expose that channel. Nothing here overclaims.

**The exception is a vocabulary claim, not a warning claim** — `README.md:41-42`,
see P1-2(c).

### 6. What remains `reported`, stated rather than absorbed

This session has **no shell**; `git`, `node` and `npm` are not bound to it.

- **The commit diff was not read.** My independent bound is the state of the
  tree: every declaration in all 214 files is in the migrated vocabulary, every
  mirror line equals its root, the web family partitions exactly by name against
  the `main` baseline, and both contract copies are identical.
- **No gate was run by me.** `validate-plugin`, `host-contract --self-test`, the
  four `pack-preview --gate`s, `pack-preview --check`, `release-guard` and
  `npm test` at this ref are `reported` green **by the dispatch packet only** —
  see P1-1, because unlike `9b98143` there is *no durable evidence entry in this
  thread for `4db3c907`*. The preconditions I can check independently all hold:
  every token is in `SUPPORTED_TOOLS`; the malformed fixtures still isolate their
  target errors; both mirrors of the changed files equal their roots; the golden
  inventory counts (56/51) are unmoved because no entry was added or removed;
  release metadata is lockstep with a compare link. That is why I find the
  reported greens credible — not a substitute for them.
- **PR-body content is unverifiable from here**, including whether the disclosure
  table carried into it has been corrected for the three rows in P1-2(a).
- **`git status` cleanliness is unverified.** HEAD matches the reviewed ref by
  ref-file read.

### 7. P1 — two, both records-only, neither requiring a code change

**P1-1 — the item record is now two commits stale, and this ref has no evidence
entry at all.** `kai/coordination/items/area-plugins-tool-allowlist-fix.md` still
carries `change_ref: f093c5a…` and a single `completed_reviews` entry with
`verdict: changes-requested` / `satisfies_requirement: false` against that same
superseded commit, at `version: 5`. Neither the `9b98143` **APPROVED**
(architecture, 0141) nor the `9b98143` **APPROVED/conditional** (security, 0157)
verdict was ever recorded, so `review_requirements[0]` still reads unmet against a
commit that no longer describes the tree. Separately, **this thread contains no
`IMPLEMENTATION EVIDENCE` block and no `HANDOFF` for the `4db3c907` pass** — the
gate runs, the preserved-declaration rationale, and the two out-of-`touches`
edits exist only in the dispatch packet. No lease covered either the `9b98143` or
the `4db3c907` remediation pass (all five lease fields null). `BOARD.md:48-49`
still shows this item `ready` with an unmet dependency.
**Owner:** `director-chief-of-staff` / `principal-product-manager` under a lease.
I hold none and edited no frontmatter.

**P1-2 — three durable claims now contradict the tree.** All three were true at
`9b98143` and were falsified by `4db3c907`; each is a one-line correction.

- **(a) The 113-row disclosure table.** Rows 1100, 1102 and 1114 of this thread
  read `web_search->web` for `instructor-path-mentor`, `instructor-tutor` and
  `principal-engineer-career-mentor`. At this ref that mapping did not happen.
  The `capability loss: none` column is still correct, but the table is the
  item's *only* guard against a capability change — acceptance box 3 says so in
  the mandated sentence — and a guard that misdescribes three of its rows is not
  a guard. **The same three rows are in the PR body** and must be corrected
  there too.
- **(b) The item Outcome.** It asserts every declaration *"uses the documented
  primary-alias vocabulary plus explicit specialized Kai tools."* `web_search` is
  neither: it is absent from the published alias table (decision §1.1) and it is
  not a specialized Kai tool. The honest amendment is a third clause — *plus one
  retained legacy narrow name, `web_search`, on three agents, to avoid a
  declared-authority widening nobody accepted*. `CHANGELOG.md:13-14` files it
  under "Specialized Kai tools", which is the same mislabel one layer down.
- **(c) `README.md:41-42`** — *"Agents and skills now use the documented primary
  aliases for shell, file, search, delegation, and web capabilities."* False for
  3 of the 28 web-capable agents. The `CHANGELOG` states the exception; the
  user-facing README does not. This is the one place a reader is told something
  the tree disproves.

**Bounded carry-forward, so a prose fix does not cost a fourth exact-ref pass.**
This approval binds to `4db3c907`. It **also carries** to a successor ref whose
only difference from `4db3c907` is confined to `README.md` prose, `CHANGELOG.md`
prose, `kai/coordination/**` and `kai/initiatives/**`. **Any** change to a
declaration line, a generated mirror, `scripts/**`, `test/**`, `docs/**`, or any
manifest/version file **voids it** and requires a fresh exact-ref review. I am
not waiving the exact-ref discipline; I am stating its boundary precisely so
records honesty and review economy do not fight each other.

### 8. P2 — three, none blocking

**P2-1 — two files were edited outside the item's declared `touches`, with
correct content and no recorded authority.** `docs/workspaces.md` and
`kai/initiatives/area-plugins/artifacts/decisions/area-plugins-host-tool-conformance.md`
appear in neither `touches` nor `context_artifacts` as writable targets, and
`REVIEW 2026-08-28-0141` routed both away from this item explicitly —
*"do not widen this item for them; file as a follow-on nit"* (P2-2) and
*"Steward's artifact, steward's edit"* (P2-3). Both edits are one line, both are
correct, and both close open findings, so **I recommend ratification, not
reversion** — reverting costs more than it protects. But the ratification is the
steward's, not mine and not the implementer's: name both paths in `touches` when
recording the ref. Flagging it because absorbing scope quietly is the pattern
P0-3 was raised about earlier in this same item, at a larger size.

**P2-2 — the contract file encodes an asymmetry it does not explain.**
`SUPPORTED_TOOLS` now admits `web_search` and rejects `web_fetch`. That is the
right asymmetry — narrow name in, broad legacy name out, and nothing is stranded
because no declaration ever held fetch alone — but nothing beside the set says
so. A future author declaring `web_fetch` gets *"not in kai's tool vocabulary"*
with no hint the answer is `web`, and a future tidier may "finish the migration"
by folding `web_search` into `web`, silently re-creating the widening this commit
removed. `principal-security`'s SEC-2(b) asked for one comment line naming the
coarsened families; at this ref it needs a second clause naming the retained
narrow one. Two comment lines, beside the existing *"lint heuristic, not a host
allowlist"* caveat. **Follow-on, not at this ref** — touching that file
re-triggers mirror parity and voids the carry-forward in §7.

**P2-3 — `web_search`'s grant is `inferred`, not `observed`, and the residue
needs a named trigger.** `tool-conformance.mjs` classifies the whole web family
`not-testable` without `--allow-network`, so what §12.2 establishes for
`R8-repo-current` is that a declaration *containing* `web_search` launches valid
and does not disturb the other grants on both CLI builds — not that `web_search`
grants web search. Under the published *"unrecognized names are ignored"* rule
it may grant nothing, in which case those three agents have no declared web
capability. **That is residue, not regression: it was equally true on `main`, and
this commit is the option that adds no new unknown.** The contract file's header
caveat already covers it and the `// search-only web access` comment is intent in
the same idiom as `// session store`, so no correction is required — but the
trigger should be recorded with the shipped-gate observation: *if the operator
finds these three cannot search the web post-install, the disposition is `web`
plus a recorded three-declaration acceptance* (`principal-security` §4.2 supplies
the mechanism and the mitigations). Owner: steward, alongside the existing
post-install warning observation.

### 9. Carried findings — final disposition

| # | origin | disposition at `4db3c907` |
|---|---|---|
| P0-1 / P0-2 / P0-3 | 0112 | **Closed** at `9b98143`, re-verified unmoved here (§4.10–4.13, §5). |
| P1-1 (0141) item lifecycle | 0141 | **Still open, and worse** — now two commits stale. Restated as P1-1. |
| P1-2 / P1-3 / P1-4 | 0112 | **Closed** at `9b98143`. The 113-row table needs three row corrections — P1-2(a). |
| P2-1 (19-declaration widening) | 0141 | **Closed, and my framing corrected.** The 16 never widened (SEC-1, accepted in full); the 3 are resolved by preservation. **Residual widening: zero.** |
| P2-2 retired-name prose | 0141 | **Fixed** — `docs/workspaces.md:90`, `validate-plugin.mjs:616`. Authority to touch the first is P2-1 above. |
| P2-3 unannotated §12.4 stop | 0141 | **Fixed** — §12.4 carries the supersede note. Authority is P2-1 above. |
| P2-4 thread/board hygiene | 0141 | **Still open**, folded into P1-1. |
| SEC-1 (19:3 correction) | 0157 | **Accepted and closed here.** My P2-1's file-family half was wrong; stated plainly in §1. |
| SEC-2 (3-declaration acceptance) | 0157 | **Moot — no acceptance is owed.** The widening was removed, not accepted. The comment-line half survives as P2-2. |
| SEC-3 (pinned no-write guard) | 0157 | **Untouched and still parked** — `expands-scope`, steward's ruling, not this item. |

### 10. Why this is APPROVED

Three things had to be true and each is checkable at this ref rather than
asserted. **The vocabulary is still one vocabulary, and it is now better
evidenced than it was** — 14 names, two byte-identical copies, retired spellings
rejected by the guard, and the set is exactly the `R8-repo-current` row measured
valid on both CLI builds. **Capability was replaced, never deleted, and now never
broadened either** — 214 declaration sites intact, the web family partitions
exactly by name against the `main` baseline, specialized tools 1:1, the write-less
agent still cannot write, and the declared-authority delta is zero in both
directions. **The claim still matches the evidence on the channel that matters** —
the warning claims are unchanged and honest; the one place the tree now
outruns the record is a vocabulary sentence in `README`, which is P1-2(c) and a
one-line fix.

What I am **not** clearing: `shipped`. That still needs the operator to deploy and
read the startup warnings, a residual `edit` warning still routes to §7.2 B2 plus
an upstream report rather than another declaration change, and the milestone-2
PR-3 ordering constraint is untouched by this pass.

---

## HANDOFF 2026-08-28-0207 — principal-swe-architect -> director-chief-of-staff / principal-product-manager (steward)

- did:       Final independent-architecture review bound to `4db3c907142ea510b4d5ec7f02668029d616d1c2`. Verified the three preserved `web_search` declarations and their mirrors against the `main` baseline token-by-token; proved the web family partitions exactly by name (25 `web` = the 25 that held `web_fetch`; 3 `web_search` = the 3 that held it alone; 0 held `web_fetch` alone, so rejecting it strands nothing); re-counted all 214 declaration sites and confirmed zero retired spellings repo-wide; confirmed both `SUPPORTED_TOOLS` copies byte-identical and set-equal to the measured `R8-repo-current` probe row; re-checked specialized least privilege and the write-less agent; confirmed the `docs/workspaces.md` and `validate-plugin.mjs` prose fixes and the §12.4 supersede annotation; confirmed lockstep `1.0.6` across all packs and manifests, the A11 carve-out, and the malformed fixtures. Accepted `principal-security`'s SEC-1 correction of my own prior P2-1 in full. Edited no implementation file, no item frontmatter, and ran no command.
- state:     **APPROVED** — P0 **0** / P1 **2** / P2 **3**; `satisfies_requirement: true`, bound to `4db3c907` with the bounded carry-forward in §7. **Residual declared-authority widening: zero.** Zero implementation changes requested.
- needs:     **`director-chief-of-staff` / steward, under a lease** — (1) set `change_ref -> 4db3c907142ea510b4d5ec7f02668029d616d1c2` and append the three missing `completed_reviews` entries (architecture 0141 `approved`@`9b98143`, security 0157 `approved`@`9b98143`, architecture 0207 `approved`@`4db3c907` / `satisfies_requirement: true`); (2) reconcile `BOARD.md:48-49` (P1-1). **Steward** — (3) correct the three `web_search->web` rows in the 113-row table here **and in the PR body**, amend the item Outcome's vocabulary sentence and `CHANGELOG.md:13-14` to name `web_search` as a retained legacy narrow name rather than a specialized Kai tool, and fix `README.md:41-42` (P1-2); (4) ratify the two out-of-`touches` edits by naming `docs/workspaces.md` and the conformance decision in `touches` (P2-1); (5) record the P2-3 trigger alongside the post-install warning observation. **`principal-swe-infra`, follow-on, NOT at this ref** — two comment lines beside `SUPPORTED_TOOLS` naming the coarsened families and the retained narrow one (P2-2). **`principal-security`** — SEC-1 accepted; SEC-2 is moot, nothing is owed for acceptance.
- artifacts: this thread entry is the durable review record. `kai/coordination/items/area-plugins-tool-allowlist-fix.md` **not edited** — no lease held. No run directory created; nothing here needs local-only handling.
- evidence:  `observed` — first-hand file reads at `C:\src\kai` at HEAD `4db3c907…`, enumerated in §4, plus `.git/refs`, `.git/HEAD` and `.git/logs/HEAD:535-538` for the ref binding and branch shape. `reported` — every gate at this ref (`validate-plugin`, `host-contract --self-test`, four `pack-preview --gate`s, `pack-preview --check`, `release-guard`, `npm test`), from the dispatch packet only, since no evidence block exists in this thread for `4db3c907`; also the 0140 disclosure table beyond the rows I cross-read, and the §12.2 probe results. `inferred` — that `web_search` confers search-only web access (medium confidence; the probe classifies the web family `not-testable`, so R8 establishes launch-safety and non-interference, not the grant). **Not run:** every gate, `git`, `node`, `npm` — this session has no shell, so the commit diff was not read and no gate result is claimed as mine.
- questions: none blocking. No acceptance decision is owed on authority widening, because there is none at this ref.
- next:      Steward/CoS record the ref and the three verdicts under a lease and close the P1-2 record corrections, then the existing `workflow-pull-request` / `workflow-ship` path. **This review does not clear `shipped`** — the interactive startup-warning observation remains the operator's alone, and the milestone-2 PR-3 ordering constraint (this item `shipped` before PR-3 opens) is untouched by this pass.
