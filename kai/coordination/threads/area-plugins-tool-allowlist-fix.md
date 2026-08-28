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
