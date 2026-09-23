# kai-core skill portfolio — design review

**Date:** 2026-09-23
**Scope:** the 26 skills provided by `kai-core` at `plugins/kai-core/skills/`, at
repository version `16.0.0`.
**Status:** analysis only. No shipped skill, agent, manifest or tool was changed
in producing this document.

---

## 1. Summary

**Four things matter most.**

**1. Two skills in core have no route at all, and one of them is a
contributor tool that every consumer receives.** `kai-core-create-agent` and
`kai-core-fleet-observation` are the only two entries in
`SKILL_OWNER_OVERRIDES` (`tools/lib/pack-plan.mjs:293-296`) — the reviewed
disposition list for "skills with no loaded firing path". They survive
`validate-plugin.mjs`'s no-firing-path check only because both carry
`user-invocable: true`. `kai-core-create-agent` is a procedure for authoring
*kai's own agents*, complete with a `references/kai-repository.md` checklist for
"changing Kai itself". This repo already retired `workflow-self-check` for
exactly this reason, and said so in the code: *"audited kai's own plugin
inventory and only meant anything inside this repository, yet every consumer
received it"* (`tools/lib/pack-plan.mjs:205-211`). The same argument applies.

**2. The maintainer's `pr-delivery` hypothesis is right about the content and
blocked by one route.** The generated catalog already files
`kai-core-pr-delivery` under **"Engineering craft"** next to `pr-sizing`,
`coding-standards` and `build-diagrams` (`tools/generate-catalog.mjs:124-131`) —
the repo's own editorial judgment says it is an engineering skill. Its body's
"Where it sits" table names `pr-sizing`, `build-diagrams` and `workflow-ship`,
all engineering. Three of its four shipped routes are engineering agents. The
fourth is `director-chief-of-staff`, a **core** agent, and
`referenceErrors` (`tools/lib/pack-plan.mjs:1467-1477`) hard-fails any core body
that resolves to a department skill. So the move is correct but requires a
product decision first: does the director still route PR delivery? See §5.

**3. There is a live cross-pack dependency that CI cannot see.**
`kai-core-issue-analysis:139` says `Apply \`build-diagrams\`` —
`build-diagrams` is provided by **kai-engineering**. A `kai-core`-only install
routes to a skill it does not have. `collectReferences`
(`tools/lib/pack-plan.mjs:1374-1432`) collects agent→skill, agent→agent and
asset references, but for a skill it collects only the skill's *own*
user-invocable entry point and its *assets* — never the skills that skill
routes. So `referenceErrors`, the `partition` gate and the `partial-install`
gate are all blind to it. I verified this is the **only** such edge today by
running `routedSkills` over every shipped SKILL.md; that makes it a cheap fix
and a cheap gate to add.

**4. Core is a bucket, and its biggest files are the ones nobody reads.** The
two largest skills — `kai-core-work-granting` (565 lines) and
`kai-core-workspace-onboarding` (550 lines) — have **3** and **1** shipped
routes respectively. Meanwhile `kai-core-operating-rules` (79 lines) is routed
by 21 agents. Size is inversely correlated with use. Both large files are
multi-topic and both split cleanly along headings that already exist.

---

## 2. Per-skill table

"Routes" = imperative route sentences detected by the repository's own
`routedSkills()` parser, run over every agent and skill body in `plugins/` and
`incubator/`, with self-references removed. This is the same function
`agentRoutingErrors` and `collectReferences` use, so it is the repo's definition
of a route, not mine. "ship" counts only `plugins/`; "inc" counts `incubator/`.

| # | Skill | Lines | What it does (one line) | Who actually routes it | Verdict |
|---|---|---:|---|---|---|
| 1 | `kai-core-asset-closing` | 170 | The verdicts over an existing asset: four-dimensional completion, acceptance authority, freshness, placement, initiative closure. | ship 10 (director, all 4 creative skills + 2 creative agents, `workflow-ship`, `workflow-incident-response`); inc 29 | keep, rename (`kai-core-asset-closing` → unchanged id, new family anchor) |
| 2 | `kai-core-asset-producing` | 296 | Pre-dispatch declaration, four orthogonal state machines, metadata, revision, supersession, migration for a durable asset. | ship 26 (all three packs); inc 33 | keep as is |
| 3 | `kai-core-content-grounding` | 139 | Claim-safety: every factual sentence in external content maps to a typed assertion in `product_context.json`. | ship 2 — `creative-lead-video`, `video-align-narration`. **Both kai-creative.** inc 3 (marketing) | **move to kai-creative** |
| 4 | `kai-core-contract-v1` | 27 | The install probe: reports that kai-core is present and which contract version it provides. | ship 25 (every pack agent's first action); inc 33 | keep as is — id is pinned by `CONTRACT_SKILL` |
| 5 | `kai-core-create-agent` | 142 (+315 in 4 reference files) | Procedure for authoring or refining one kai agent: taxonomy, contract template, 250-line budget, approved model policy, `references/kai-repository.md` checklist. | **ship 0, inc 0.** Reachable only via `user-invocable: true` + `SKILL_OWNER_OVERRIDES` | **remove from the shipped surface** (see §3.1) |
| 6 | `kai-core-definition-of-done` | 201 | The six-dimension release-readiness gate; design sign-off sub-gate; proportionality; "kai never deploys". | ship 2 — `director-chief-of-staff` (core), `workflow-ship` (eng) | keep, rename |
| 7 | `kai-core-design-grounding` | 274 | Grounds design work in the app's settled visual language: tokens, components, brand identity layer, implementation truth. | ship 4 — `creative-lead-design`, `mockups-ascii`, `mockups-html` (creative), `eng-builder-software` (eng) | keep in core, rename — genuinely two-department |
| 8 | `kai-core-fleet-observation` | 300 | Operator guide to the subagent watcher: reads `.kai/observed.jsonl` (host `seen`) beside `.kai/activity.jsonl` (agent `said`), and documents at length why absence proves nothing for kai's own roles. | **ship 0, inc 0.** `user-invocable` + override | **needs a decision** (see §3.2) |
| 9 | `kai-core-initiative-stewardship` | 226 | The steward's five duties: north-star state, backlog grooming, `ready` queue, coordination honesty, calling the initiative done. | ship 1 — `director-chief-of-staff`; inc 1 | keep, rename — but overlaps §3.5 |
| 10 | `kai-core-issue-analysis` | 239 | Ground an issue, test decisive assumptions, frame options, stop at the authorized decision owner. | ship 2 — `director-chief-of-staff` (core), `eng-advisor-investigation` (eng) | keep, **fix the `build-diagrams` route** |
| 11 | `kai-core-no-self-remediation` | 127 | The assessor write boundary: you may write your own evidence and report; you may not write the thing under review. | ship 7 — **all kai-engineering** (6 reviewers + `eng-advisor-investigation`); inc 9 | **needs a decision** (see §3.6) |
| 12 | `kai-core-operating-rules` | 79 | The universal rules: role kinds, staying in lane, test ownership, human-only gates, shipping honesty, `@operator`. | ship 21; inc 32 | keep as is — the smallest and most-used skill in core |
| 13 | `kai-core-peer-communication` | 189 | The QUESTION/ANSWER packet contract across inline consult, peer transport and durable item thread. | ship 14 (director + all engineering); inc 23 | keep, rename |
| 14 | `kai-core-pr-delivery` | 295 | Branch anchor ladder, conventional title, proportional PR body, version bump, pre-flight, protection-safe handoff. | ship 4 — `eng-builder-platform`, `eng-builder-software`, `workflow-pull-request` (eng) + `director-chief-of-staff` (core) | **move to kai-engineering** — conditional, see §5.2 |
| 15 | `kai-core-proactive-scan` | 262 | Two things: (a) how to read `.kai/state/` into six operator-signal kinds; (b) the scan/ack ledger contract an *external* runner drives. | ship 1 — `workflow-proactive-scan`; inc 2 | **split** (see §3.3) |
| 16 | `kai-core-pulse-digest` | 398 | Weekly catch-up digest: source adapters, privacy rules, prioritization, page shapes. | ship 1 — `workflow-weekly-pulse` | keep, rename — single-caller by design |
| 17 | `kai-core-scope-discipline` | 168 | Route anything scope-expanding to the backlog as a PROPOSAL rather than implementing it. | ship 8 — creative (3) + engineering (5). **No core agent routes it.** inc 12 | keep in core, rename — two-department |
| 18 | `kai-core-web-content-extraction` | 408 | Playwright plumbing to turn a website's readable text into clean markdown; marquee case is course/certification modules into `.kai/runs/learn/`. | ship 1 — `workflow-weekly-pulse`; inc 4 (learning, marketing, assistant) | **needs a decision** (see §3.4) |
| 19 | `kai-core-web-evaluation` | 313 | Playwright plumbing for live-product evaluation: login pause, screenshot discipline, priority scheme, report scaffold. | ship 1 — `eng-reviewer-quality`; inc 8 | **merge shared half with #18** (see §3.4) |
| 20 | `kai-core-work-acting` | 294 | Acting on granted work: verify-before-write, COLLISION, HANDOFF, QUESTION/ANSWER, review routing. | ship 21; inc 31 | keep as is |
| 21 | `kai-core-work-activity` | 135 | Append-only start/progress/stop/deadline/silence signals to `.kai/activity.jsonl`. | ship 21; inc 25 | keep, rename into the fleet family |
| 22 | `kai-core-work-granting` | **565** | Runtime command protocol, single-grantor leases, collision/stale recovery, lifecycle, touch-set reconciliation, RECOVERY and WAIVER records, dispatch, backlog, board. | ship 3 — `director-chief-of-staff`, `eng-advisor-investigation`, `eng-reviewer-code`; inc 13 | **split** (see §3.7) |
| 23 | `kai-core-work-item` | 171 | The durable work-item record: schema, field rules, Outcome/Acceptance/Evidence templates. | ship 19; inc 31 | keep as is |
| 24 | `kai-core-workspace-initiative` | 213 | Initiative artifact layout, coordination and closure, personal state, schema-3 manifest. | ship 3 — director, `workflow-initiative-init`, `workflow-workspace-init`; inc 29 | keep, rename — overlaps #9 |
| 25 | `kai-core-workspace-onboarding` | **550** | Two things: pack-install inspection/migration to the split surface, **and** workspace scaffold/manifest/gitignore/seed/validate. | ship 1 — `workflow-workspace-init` | **split** (see §3.7) |
| 26 | `kai-core-workspace-paths` | 243 | Workspace resolution, private `.kai` layout, publication, storage modes, run grammar, artifact path convention. | ship 26 — the most-routed skill in the repo; inc 33 | keep as is |

---

## 3. Findings

### 3.1 `kai-core-create-agent` is contributor tooling shipped to every consumer

- **0 routes, shipped or incubated.** Nothing in `plugins/` or `incubator/`
  names it in a route sentence. It exists in the partition only because
  `SKILL_OWNER_OVERRIDES` pins it to `core`
  (`tools/lib/pack-plan.mjs:294`) and `user-invocable: true` exempts it from
  `validate-plugin.mjs:404`'s no-firing-path error.
- **Its content is about this repository.** Step 7 says *"When changing Kai
  itself, load [the Kai repository checklist](references/kai-repository.md)"*.
  Step 5's budget table cites the "Authored agent body ≤ 250 lines" rule, which
  is a kai authoring convention. Step 6 says a different model *"requires
  updating that reference, the validator set, and their tests through review"* —
  instructions a consumer cannot act on.
- **The repo has already made this call once.** `RETIRED_CORE_AGENT_IDS`
  contains `workflow-self-check`, retired because it *"only meant anything
  inside this repository, yet every consumer received it"*
  (`tools/lib/pack-plan.mjs:205-211`).
- **It is the heaviest orphan.** 142 lines of SKILL.md plus four progressive
  reference files (`taxonomy.md` 106, `agent-template.md` 108, `taxonomy`-linked
  `kai-repository.md` 72, `model-selection.md` 29) = 457 lines shipped to every
  `kai-core` install for a capability no kai agent uses.

**Verdict: remove from the shipped surface.** It is real, useful, and belongs
with the repo's own contributor docs (`docs/reference/`, or `incubator/` if it
must keep the skill shape). *Caveat, stated plainly:* removing it touches
`tools/pack-preview.mjs` in four places (lines 474-480, 539-543, 1349-1355) and
`tools/validate-plugin.mjs`'s `agentAuthoringReferenceErrors` — those self-tests
assert the progressive references materialize into a preview. Removal is a real
code change in the generator's test surface, not just a file delete.

### 3.2 `kai-core-fleet-observation` — 300 lines, 0 routes, and mostly caveats

Unlike #3.1, this one documents *shipped executables*:
`plugins/kai-core/scripts/observe-watch.mjs` (49 KB) and
`observe-subagent.mjs` (18 KB) are in the core pack, and the skill gives
consumer-side resolution paths (`$COPILOT_HOME/installed-plugins/**/scripts/`).
So it is not repo-only. But:

- A large share of the body is an argument that **the feature cannot observe
  kai's own agents**: *"delegations of that kind produce nothing in
  `observed.jsonl` — not a start, not a stop… an identical A/B in one session
  produced 4 events for a built-in `explore` and 0 for
  `kai:eng-builder-software`."* Peer model/effect observation *"is not
  implemented at all: that capability returns `UNSUPPORTED_HOST`."*
- Both log tiers are declared **non-authoritative**: *"A row here never advances
  lifecycle state, never satisfies a review, and never certifies a model
  invocation."*
- No agent routes it, so it only fires if an operator types it.

**Verdict: needs a decision from the maintainer.** The honest question is not
"which pack" but "is a 300-line guide to a read-only, host-blind, explicitly
non-authoritative log viewer worth 67 KB of shipped runtime in the substrate
pack every user installs?" If yes, keep it and make it the anchor of a `fleet-*`
family. If the answer is "it's a debugging aid for people building kai", it
belongs beside `create-agent`. I did not find evidence either way about real
operator usage — see §6.

### 3.3 `kai-core-proactive-scan` — what it actually does

In plain language: **it is two skills wearing one name.**

**Half one — reading the team's records for a human.** Given a `.kai/state/`
tree, it maps coordination facts to exactly six "operator signal" kinds: a
decision awaiting the operator, a question addressed to the operator, an action
only the operator can perform, an item sitting in `release-ready` (the deploy
gate), an item blocked on an open `@operator` question, and an overdue request
whose `answer_by` has passed. It then states the traps: an append-only thread's
original `status: open` is stale once an `ANSWER` exists; a `reply` is never
reinterpreted as a decision; `release-ready` is a gate, not a deployment; a
`proposed` item is steward work, not an operator signal; and a root that failed
to read is never treated as resolved. This half is pure interpretation and needs
no ledger, no outbox, no runner.

**Half two — the notification contract for an external runner.** kai is
"proactive-surface, never autonomous": *"kai is a declarative prompt plugin:
nothing in it wakes itself, watches for changes, or pushes a message."* So the
skill splits notification across a runtime boundary. kai owns a two-phase,
at-least-once protocol — `scan` reads, diffs against a gitignored ledger at
`.kai/personal/proactive/snapshot.json`, and emits an immutable payload to an
outbox; `ack` advances the ledger only for signals the runner *confirmed* it
delivered, and is idempotent. Signal identity is `<root-id>:<item-id>:<Q-id>`
with a SHA-256 over the signal's material fields only — deliberately **not**
over summaries, mtimes, leases, or `version`, because those change without the
operator-facing meaning changing and would cause spam. The external runner
(cron, Task Scheduler, a `schedule:` workflow — see `examples/proactive-runner/`)
supplies the heartbeat, the channel and the credentials; `channels.md` stores a
`secret_ref`, never a secret.

**Does it earn its place?** Half two does: it is a genuinely careful protocol,
it is the only thing that makes "proactive kai" honest rather than a lie, and it
has a working example runner in-repo. Half one earns its place too — but it is
being carried by the wrong file. Reading operator signals out of `.kai/state/`
is exactly what a `status`/briefing request needs, and it is sealed inside a
skill whose name, description and 60% of whose body are about notification
delivery. That is why `incubator/kai-assistant/skills/personal-agenda/SKILL.md`
references it three times: it wanted half one.

**Verdict: split.** Signal interpretation becomes its own small skill; the
ledger/outbox/ack protocol stays with `workflow-proactive-scan`.

### 3.4 The web/grounding cluster is not one cluster — it is two pairs, and only one pair overlaps

The maintainer grouped four skills. The evidence separates them.

**`content-grounding` and `design-grounding` do not overlap.** They share a word
and nothing else. `content-grounding` is claim safety — a per-sentence ledger
mapping factual spans to typed assertions in `product_context.json`, with a
treatment table (`plain-fact` / `attributed-claim` / `qualified` / `perspective`)
keyed on provenance. `design-grounding` is visual-language conformance — tokens,
component primitives, brand identity, implementation truth. Merging them would
produce one skill with two unrelated contracts. **Keep both.**

**`web-evaluation` and `web-content-extraction` genuinely overlap.** They share
eight section titles verbatim: `When to apply`, `Hard rules`, `Folder layout`,
`Zone, gitignore & promotion`, `Login pause pattern`, `Run budget`,
`Anti-patterns`, `Output contract`. I diffed those sections line-by-line: almost
no lines are byte-identical, which is worse, not better — the same protocol has
been **written twice and has already drifted**. The login pause is the clearest
case:

- `web-evaluation`: screenshot as `00-login-pause.png`; interactive mode posts a
  verbatim block, waits, verifies via snapshot.
- `web-content-extraction`: snapshot as `raw/00-login-pause.md`; the *same*
  verbatim block with reworded surrounding prose; headless mode writes
  `Status: blocked-by-auth`.

Same rule, two texts, two filenames, two half-specified headless behaviours.
Ditto `Zone, gitignore & promotion` — both say "`workflow-workspace-init`
gitignores the run root wholesale, promote the markdown not the binaries", in
different words with different paths (`qa/` vs `.kai/runs/learn/`).

**`web-content-extraction` also has a shipped-vs-incubated problem.** Its
description leads with *"course modules, certification units"*; its run root is
`.kai/runs/learn/`; its outputs are `module.md`, `questions.md` with a
"Knowledge-check / quiz detection" section. That is the **kai-learning**
product, which is incubated. Its four incubated referrers are learning,
marketing and assistant. Its **one** shipped referrer is
`workflow-weekly-pulse`, which the pulse agent itself describes as needing only
*"the gist, not the full text"*. So 408 lines of course-extraction machinery
ship in core to serve one caller that wants a fraction of it.

**Verdict:** extract the shared Playwright session contract (run root, zone and
promotion, login pause, run budget, output contract) into one skill both route;
keep the two output schemas separate and much smaller. Whether the
course/certification half should ship at all while kai-learning is incubated is
a **maintainer decision**.

### 3.5 Overlap inside the work/initiative/asset families

I checked the three clusters the maintainer named. Two are fine; two have a real
seam.

**The five `work-*` skills are well-factored.** `work-item` is the record
schema, `work-granting` is the grantor's side, `work-acting` is the holder's
side, `work-activity` is the activity log. The split is by *actor and object*,
not by topic, and the route counts confirm it: `work-acting`, `work-activity`
and `work-item` are routed by ~20 agents each (everyone acts), while
`work-granting` is routed by 3 (almost nobody grants). **No merge.**

**`asset-producing` / `asset-closing` / `definition-of-done` are three different
gates, correctly separated.** `asset-producing` governs an artifact's lifecycle
(disposition, validity, revision, supersession). `asset-closing` governs the
verdict over an existing artifact (four-dimensional completion, acceptance
authority, freshness, promotion). `definition-of-done` governs whether *work*
may move to `in-review` / `release-ready` / `shipped` — six dimensions, blast
radius, "kai never deploys". `asset-closing` explicitly defers to it: *"Its
production safety and operability dimensions…"*. Different objects, different
authorities. **No merge.** I would, however, note that `asset-producing` (296 L,
26 routes) and `asset-closing` (170 L, 10 routes) are always routed together by
all seven creative bodies — worth watching, not worth merging now.

**The real seam is initiative state.** Three skills touch it:
`kai-core-workspace-initiative` (artifact layout, coordination and closure,
manifest), `kai-core-initiative-stewardship` (north star, backlog, `ready`
queue, calling it done), and `kai-core-work-granting`'s `## Backlog` and
`## The cross-item view` / `# Board` sections. `initiative-stewardship` says the
backlog→board promotion is *"the one-way valve, opened only here"*, while
`work-granting` also carries a `## Backlog` section. Both are routed by
`director-chief-of-staff`. This is where a maintainer should look for genuine
duplicated authority — I did not read both bodies in full enough to assert they
contradict each other, only that they claim adjacent ground (see §6).

### 3.6 `kai-core-no-self-remediation` is routed exclusively by engineering

All 7 shipped routes are kai-engineering: the six `eng-reviewer-*` agents plus
`eng-advisor-investigation` (and `eng-lead-technical-writing`). Zero core, zero
creative. By the "usage" test it looks like an engineering skill.

**But the body is written as a role-kind contract, not a domain contract.** It
is about *assessors* in general: *"the needed constraint is not whether you may
write. It is where"*. `kai-core-operating-rules` — the universal skill 21 agents
route — already defines role kinds including assessors, so the two are the same
concept at two levels of detail. And `director-chief-of-staff:322-327` requires
*"a `creative-lead-design` conformance verdict"* — a creative agent issuing an
assessment verdict, which is precisely the situation this contract governs, yet
`creative-lead-design` does not route it.

**Verdict: needs a decision.** My reading is that the missing creative route is
a gap, not evidence for a move: it is a core role-kind contract that creative
should also route. Moving it to engineering would make that gap permanent,
because `referenceErrors` forbids creative from reaching an engineering skill.
The maintainer should decide whether `creative-lead-design`'s conformance
verdict is an assessment in this sense. If yes → keep in core and add the route.
If no → move to kai-engineering (clean, 0 blockers today).

### 3.7 Two skills are too big to hold in context, and both split along existing headings

**`kai-core-work-granting` — 565 lines, 3 shipped routes.** Its own heading
structure names four separable topics:

| Sections | Topic | Who needs it |
|---|---|---|
| `## Runtime routes` (6 subsections incl. "Direct single-shot work needs none of this") | How to talk to `scripts/coordinate.mjs` | anyone touching coordinated state |
| `## Claiming work safely`, `## Lifecycle`, `## Parallel work and collisions`, `## Touch-set reconciliation` | Leases and lifecycle | the single grantor |
| `## RECOVERY record`, `## Design-waiver record` | Two append-only record formats | the grantor, rarely |
| `## Dispatch responsibilities`, `## Backlog`, `## The cross-item view` / `# Board` | Dispatch and the board | the grantor / director |

The first block is the one that is *not* about granting at all — it is the
runtime protocol, and `kai-core-work-acting` has its own `## The runtime route`
section covering the same surface from the other side.

**`kai-core-workspace-onboarding` — 550 lines, 1 shipped route.** It contains
two unrelated procedures behind one name:

- `## Pack installation mode` (Inspect / Plan and confirm / Execute / Report) —
  migrating a user from the legacy `kai` monolith to the split pack surface.
  This is a **one-time migration tool**.
- `## Workspace inputs` through `## Result` — scaffold, manifest, coordination
  store, schema-3→4 migration, git rules for three storage modes with two
  embedded managed blocks, seed files, communication style, validate.

The install-migration half is temporary by construction (it exists because
`LEGACY_PLUGIN = 'kai'` still exists); the scaffold half is permanent. Binding
them means every workspace repair loads the migration procedure.

### 3.8 The uncaught cross-pack route (bug)

Stated in §1.3. Concretely:

```
plugins/kai-core/skills/kai-core-issue-analysis/SKILL.md:139
  Apply `build-diagrams` for an explicit diagram request or when a supported
  relationship would be materially clearer visually.
```

`build-diagrams` is `plugins/kai-engineering/skills/build-diagrams/`.
`kai-core-issue-analysis` is routed by `director-chief-of-staff`, a **core**
agent, so a `kai-core`-only install reaches this line and routes to nothing.
`kai-core-pr-delivery` has the same sentence about `build-diagrams` but escapes
detection entirely because it is bold-wrapped (`**\`build-diagrams\`**`) —
`routedSkills` returns `[]` for it. That is a second, quieter instance of the
same problem.

I verified by running the repository's own `routedSkills` over all 36 shipped
SKILL.md files: `kai-core-issue-analysis → kai-engineering/build-diagrams` is
the only detected cross-boundary skill→skill route. The other four skill→skill
routes (all from kai-creative into kai-core, plus two core→core) are legal.

---

## 4. Proposed grouping

### 4.1 The `kai-core-` prefix — it cannot be dropped, and here is why

**Short answer: keep it. Put the family in the segment after it.**

The constraint is real and is enforced in both directions by
`namespaceErrors` (`tools/lib/pack-plan.mjs:1856-1879`):

```js
// Core's owned namespace, in both directions: core may only provide `kai-core-*`
// names, and no department may claim one.
export function namespaceErrors({ core = [], local = {}, prefix = CORE_SKILL_PREFIX }) {
  for (const id of core) {
    if (id.startsWith(prefix)) continue;
    errs.push(`kai-core provides skill \`${id}\`, which does not carry the \`${prefix}*\` prefix — a `
      + 'legacy `kai` install provides that same bare name, so provider ownership is ambiguous; '
      + `rename it to \`${prefix}${id}\``);
  }
  …
}
```

And the constant's own comment (`tools/lib/pack-plan.mjs:35-38`):

> *Core's owned namespace. Duplicate exposure is not a guaranteed host contract;
> it has been measured on one host only (Windows 11, Copilot CLI 1.0.80). A
> prefix core alone may use removes that ambiguity; see namespaceErrors.*

**What would actually break if the prefix were dropped:**

1. **The `partition` CI gate fails immediately.**
   `.github/workflows/validate.yml:90-91` runs
   `node tools/pack-preview.mjs --gate partition`, which calls
   `namespaceErrors({ core: plan.core, local: plan.local })`
   (`tools/pack-preview.mjs:1434`). Every one of the 26 skills would be an
   error. `tools/validate-plugin.mjs:429` runs the same check, so `npm test`
   fails too.
2. **Two generator self-tests fail.** `tools/pack-preview.mjs:1034-1039` asserts
   the exact error text for both directions, using
   `kai-core-fleet-observation` as its fixture.
3. **The partition's ownership rule loses its input.**
   `tools/lib/pack-plan.mjs:525-529`: *"A `kai-core-*` name is core's own
   declaration of ownership, and namespaceErrors rejects any other provider for
   it. Usage can narrow to a single department — as it does whenever the other
   callers are retired or incubated — without transferring the contract out of
   core."* This is load-bearing right now: `kai-core-no-self-remediation` is
   routed only by engineering and `kai-core-content-grounding` only by creative,
   and the prefix is the only reason they stay in core rather than being
   auto-assigned to a department by usage.
4. **The real-world hazard is not hypothetical.**
   `src/core/lib/migration-doctor.mjs:51` declares `LEGACY_PLUGIN = 'kai'`, and
   `KAI_PLUGINS` includes it. The monolith is still an install the doctor
   detects and refuses (`legacy-installed`). A user with `kai` and `kai-core`
   both installed and a bare `workspace-paths` in each gets host-dependent
   resolution — and the repo has measured duplicate exposure on exactly one host.

**So: `kai-core-` is not redundant. It is a collision guard against a plugin
that still exists in the wild.** The grouping should therefore be
`kai-core-<family>-<name>`. The cost is id length, which is cosmetic; the
benefit is that `ls plugins/kai-core/skills` finally shows structure.

One exception: **`kai-core-contract-v1` keeps its id unchanged.** It is pinned
by `CONTRACT_SKILL` / `CONTRACT_VERSION` in `tools/lib/pack-plan.mjs:31-32` and
asserted by `contractPinErrors` and the `version-skew` gate; the version is part
of the name by design.

### 4.2 Seven families

| Family | What it is for | Count |
|---|---|---:|
| *(unprefixed)* | the install probe | 1 |
| `role-*` | how any kai role behaves, regardless of department | 4 |
| `work-*` | coordinated work over `.kai/state/` | 7 |
| `asset-*` | durable outputs a run leaves behind | 2 |
| `workspace-*` | where state lives, and getting a workspace there | 5 |
| `fleet-*` | what the fleet and the operator can see | 4 |
| `web-*` | Playwright plumbing | 3 |
| `ground-*` | evidence a claim must rest on | 1 |

### 4.3 Full id mapping

| Current id | Proposed id | Note |
|---|---|---|
| `kai-core-contract-v1` | `kai-core-contract-v1` | **unchanged** — pinned constant |
| `kai-core-operating-rules` | `kai-core-role-rules` | |
| `kai-core-scope-discipline` | `kai-core-role-scope` | |
| `kai-core-peer-communication` | `kai-core-role-peer-question` | |
| `kai-core-no-self-remediation` | `kai-core-role-assessor-boundary` | pending §3.6 |
| `kai-core-work-item` | `kai-core-work-item` | **unchanged** |
| `kai-core-work-acting` | `kai-core-work-acting` | **unchanged** |
| `kai-core-work-granting` | `kai-core-work-granting` | **split** → also `kai-core-work-runtime` + `kai-core-work-board` |
| — (new, from split) | `kai-core-work-runtime` | the `scripts/coordinate.mjs` protocol |
| — (new, from split) | `kai-core-work-board` | dispatch, backlog, cross-item board |
| `kai-core-definition-of-done` | `kai-core-work-readiness` | |
| `kai-core-initiative-stewardship` | `kai-core-work-stewardship` | |
| `kai-core-asset-producing` | `kai-core-asset-producing` | **unchanged** |
| `kai-core-asset-closing` | `kai-core-asset-closing` | **unchanged** |
| `kai-core-workspace-paths` | `kai-core-workspace-paths` | **unchanged** |
| `kai-core-workspace-initiative` | `kai-core-workspace-initiative` | **unchanged** |
| `kai-core-workspace-onboarding` | `kai-core-workspace-scaffold` | **split** |
| — (new, from split) | `kai-core-workspace-install` | legacy→pack migration, retirable |
| `kai-core-work-activity` | `kai-core-fleet-activity` | the `said` log's writer |
| `kai-core-fleet-observation` | `kai-core-fleet-observation` | **unchanged** — or removed, §3.2 |
| `kai-core-proactive-scan` | `kai-core-fleet-signals` | **split** — signal interpretation |
| — (new, from split) | `kai-core-fleet-notify` | scan/ack ledger + outbox for the runner |
| `kai-core-pulse-digest` | `kai-core-fleet-pulse` | |
| `kai-core-web-evaluation` | `kai-core-web-evaluation` | **unchanged**, shrunk |
| `kai-core-web-content-extraction` | `kai-core-web-extraction` | shrunk |
| — (new, from merge) | `kai-core-web-session` | shared run root, zone, login pause, budget |
| `kai-core-design-grounding` | `kai-core-ground-design` | |
| `kai-core-issue-analysis` | `kai-core-work-analysis` | it is intake for coordinated work |
| `kai-core-content-grounding` | **`content-grounding`**, provided by **kai-creative** | **moves out of core**; the prefix must be dropped, because `namespaceErrors` forbids a department holding a `kai-core-*` name |
| `kai-core-pr-delivery` | **`pr-delivery`**, provided by **kai-engineering** | **moves out of core**, conditional on D1; prefix dropped for the same reason |
| `kai-core-create-agent` | *(removed from shipped surface)* | §3.1 |

Net: 26 → 25 in core (26 − 3 moved/removed + 4 from splits − 2 merged into
`web-session`… see §5.3 for the exact arithmetic per option).

---

## 5. Cost and sequencing

### 5.1 What CI would and would not catch on a missed rename

I read the validator rather than assuming. This matters, because the answer is
**mixed**.

| Surface | Caught? | By what |
|---|---|---|
| Agent body routes a now-dead id | **yes** | `agentRoutingErrors` (`pack-plan.mjs:1027-1035`) + `referenceErrors` "resolves to no pack" |
| Agent body routes a department skill from core | **yes** | `referenceErrors` (`pack-plan.mjs:1467-1477`), run by the `partition` and `partial-install` gates |
| **Skill body routes a now-dead id** | **NO** | `collectReferences` never collects skill→skill routes (`pack-plan.mjs:1413-1430`) |
| **Skill body routes a department skill from core** | **NO** | same gap — this is live today, §3.8 |
| Skill exists with no route and no `user-invocable` | **yes** | `validate-plugin.mjs:399-404` |
| Renamed skill missing from `CATEGORIES` | **yes** | coverage enforced; `npm run docs:check` fails |
| `docs/reference/agents-and-skills.md` stale | **yes** | `generate-catalog.mjs --check` in `npm test` |
| `SKILL_OWNER_OVERRIDES` names a dead id | **yes** | explicit error: *"places `x`, which is not a skill on disk"* |
| Core provides a non-`kai-core-*` id, or a department claims one | **yes** | `namespaceErrors`, `partition` gate |
| `test/fixtures/inventory.json` stale | **yes** | `tools/host-contract.mjs --self-test` diffs the golden inventory (`--update` regenerates) |
| Other prose in `docs/` naming a dead skill id | **NO** | `validate-plugin.mjs:219-247` only scans agent-shaped tokens and tokens after the verb "inherit" |
| Retired id reappearing in an active body | **yes** | `RETIRED_CORE_SKILL_IDS` + `validate-plugin.mjs:260-268` |

**Two concrete consequences.** (a) Any rename **must** add the renamed id to
`RETIRED_CORE_SKILL_IDS` — that list is the mechanism that converts "silently
missed in prose" into a build failure, and it already holds the precedent
(`kai-core-workspace-conventions`). (b) The skill→skill blind spot should be
closed *before* any rename work starts, or the largest category of references
(skill bodies hold ~55% of all id mentions in `plugins/`) goes unchecked.

### 5.2 Reference counts per id

Raw textual mentions, counted with an exact-string scan. `plugins` includes the
skill's own SKILL.md, so treat these as upper bounds. `incubator` is listed
separately because incubated files must stay internally consistent but are not
shipped.

| Skill | plugins | tools | test | docs/reference | **shipped total** | incubator |
|---|---:|---:|---:|---:|---:|---:|
| `kai-core-workspace-paths` | 39 | 8 | 6 | 1 | **54** | 50 |
| `kai-core-work-acting` | 33 | 27 | 7 | 1 | **68** | 33 |
| `kai-core-contract-v1` | 31 | 17 | 6 | 1 | **55** | 35 |
| `kai-core-operating-rules` | 24 | 15 | 4 | 1 | **44** | 32 |
| `kai-core-asset-producing` | 33 | 4 | 2 | 1 | **40** | 33 |
| `kai-core-work-item` | 25 | 2 | 3 | 1 | **31** | 32 |
| `kai-core-work-activity` | 25 | 7 | 5 | 1 | **38** | 25 |
| `kai-core-workspace-initiative` | 9 | 5 | 4 | 1 | **19** | 42 |
| `kai-core-asset-closing` | 19 | 1 | 3 | 1 | **24** | 34 |
| `kai-core-peer-communication` | 19 | 1 | 5 | 1 | **26** | 25 |
| `kai-core-work-granting` | 23 | 4 | 4 | 1 | **32** | 14 |
| `kai-core-scope-discipline` | 21 | 1 | 7 | 1 | **30** | 16 |
| `kai-core-no-self-remediation` | 9 | 3 | 2 | 1 | **15** | 9 |
| `kai-core-web-evaluation` | 5 | 1 | 1 | 1 | **8** | 14 |
| `kai-core-create-agent` | 2 | 10 | 4 | 2 | **18** | 0 |
| `kai-core-definition-of-done` | 11 | 1 | 5 | 1 | **18** | 0 |
| `kai-core-design-grounding` | 5 | 1 | 6 | 1 | **13** | 5 |
| `kai-core-workspace-onboarding` | 7 | 5 | 4 | 1 | **17** | 0 |
| `kai-core-web-content-extraction` | 6 | 1 | 1 | 1 | **9** | 7 |
| `kai-core-pr-delivery` | 8 | 1 | 4 | 3 | **16** | 0 |
| `kai-core-proactive-scan` | 4 | 1 | 1 | 2 | **8** | 6 |
| `kai-core-pulse-digest` | 7 | 1 | 1 | 2 | **11** | 2 |
| `kai-core-content-grounding` | 3 | 1 | 3 | 1 | **8** | 4 |
| `kai-core-fleet-observation` | 1 | 4 | 4 | 1 | **10** | 0 |
| `kai-core-initiative-stewardship` | 3 | 1 | 3 | 1 | **8** | 1 |
| `kai-core-issue-analysis` | 3 | 1 | 1 | 1 | **6** | 0 |

**A full 26-skill rename touches roughly 600 shipped references plus ~420 in the
incubator** — call it ~1,000 edits. That is a mechanical but not trivial change,
and per repo policy it is a **breaking change with no aliases**: every consumer
with a customised agent, a personal skill, or a repo `AGENTS.md` that names a
kai-core skill id breaks on update, silently, with no redirect. It is also a
**major** version bump under the post-1.0 column in `AGENTS.md`.

The grouping is worth doing. It is not worth doing in one PR.

### 5.3 Clear wins — do these first, independently

| # | Change | Refs touched | Breaks | CI catches a miss? |
|---|---|---:|---|---|
| W1 | Fix `kai-core-issue-analysis:139` — stop routing `build-diagrams` from core (make it conditional prose, or move the diagram trigger into the engineering agents that need it) | 1 line | nothing | **no** — this is why it survived; fix W2 first or alongside |
| W2 | Extend `collectReferences` to collect skill→skill routes so the `partition`/`partial-install` gates see them | generator only | nothing shipped | n/a — this *is* the gate |
| W3 | **Move `kai-core-content-grounding` → `kai-creative/skills/content-grounding`** | 8 shipped (3 plugins, 1 tools, 3 test, 1 docs) + 4 incubator | nothing: both shipped routes are kai-creative; `referenceErrors` stays green; marketing is incubated and must be updated in place | **yes** — `referenceErrors`, `CATEGORIES` coverage, catalog diff, golden inventory |
| W4 | **Remove `kai-core-create-agent` from the shipped surface** | 18 shipped (mostly `tools/pack-preview.mjs`, 7 mentions) | the four generator self-tests in §3.1 must be rewritten | **yes** — `SKILL_OWNER_OVERRIDES` errors on a dead id |
| W5 | **Split `kai-core-workspace-onboarding`** into `-install` (migration) + `-scaffold` | 17 shipped | 1 route in `workflow-workspace-init`; sets up retiring the migration half later | **yes** for the agent route |
| W6 | **Merge the duplicated Playwright plumbing** of `web-evaluation` / `web-content-extraction` into one `kai-core-web-session` | 17 shipped combined | 2 shipped routes; 12 incubated referrers must be updated in place | partially — agent routes yes, skill routes not until W2 |

W1–W3 are small, independently shippable, and each fixes something demonstrably
wrong. W4–W6 are larger but carry no cross-pack risk.

### 5.4 Needs the maintainer to decide

| # | Question | Why it is not mine to call | Blocker if the answer is "yes, move/remove" |
|---|---|---|---|
| D1 | **Does `director-chief-of-staff` still route PR delivery?** Line 355: *"apply `kai-core-pr-delivery` before driving a finished change toward merge"*. | It is a product question about what the director owns, not a packaging question. | If the director keeps the route, `kai-core-pr-delivery` **cannot** move — `referenceErrors` forbids a core agent reaching an engineering skill. `kai-core-issue-analysis:140` also names it in a table (prose, not a route — safe either way). If the route is removed, the move is clean: 3 engineering routes, 16 shipped refs, and the catalog already files it as engineering craft. |
| D2 | **Is `kai-core-fleet-observation` an operator feature or a contributor tool?** | §3.2 — I found no usage evidence either way. | If contributor tool: removing it should also reconsider the 67 KB of `observe-*.mjs` in the core pack, which is a much bigger change than the skill. |
| D3 | **Should `kai-core-web-content-extraction` ship while kai-learning is incubated?** | Its design centre (`.kai/runs/learn/`, `module.md`, `questions.md`, quiz detection) serves an unshipped product; its one shipped caller wants "the gist". | Moving it to `incubator/kai-learning` leaves `workflow-weekly-pulse` with a dangling route — it would need a small replacement, which is exactly what `kai-core-web-session` (W6) would be. |
| D4 | **Is a `creative-lead-design` conformance verdict an assessment under `no-self-remediation`?** | §3.6. Governs whether the skill stays in core or moves to engineering. | Move to engineering permanently forecloses creative routing it. |
| D5 | **Accept a breaking rename of all 26 ids?** | ~1,000 edits, a major version bump, no alias layer by policy, and silent breakage for any consumer that named a skill id in their own agent or `AGENTS.md`. | If yes: sequence by family, one PR each, adding every old id to `RETIRED_CORE_SKILL_IDS` as you go. If no: the families can still be adopted as documentation structure in `CATEGORIES` at zero cost. |

### 5.5 Suggested order

1. **W2** (see the skill→skill edges) → **W1** (fix the one it reveals).
2. **W3** (`content-grounding` → creative). Smallest real move; proves the
   move-out-of-core path end to end.
3. **W4** (`create-agent` out) and **D2** (`fleet-observation` decision) — these
   two together determine whether `SKILL_OWNER_OVERRIDES` can be deleted
   entirely, which would be a genuine simplification of the generator.
4. **W5**, **W6**, then **§3.3** (split `proactive-scan`) and **§3.7** (split
   `work-granting`). These are content work, not packaging work.
5. **D1** → move `pr-delivery` if the answer allows.
6. **D5** last. Rename after the set of skills has stopped changing, one family
   per PR, each with its old ids added to `RETIRED_CORE_SKILL_IDS`.

Every step needs the `AGENTS.md` release ritual: bump `plugin.json`,
`package.json` and `.github/plugin/marketplace.json` together; dated
`CHANGELOG.md` entry plus its compare link; README `## Status` stamp; file new
ids in `CATEGORIES` and run `npm run docs:generate`; regenerate all pack
manifests with `npm run pack-preview -- --write`; `npm test`.

---

## 6. What I could not determine

- **Whether `kai-core-fleet-observation` or `kai-core-create-agent` are actually
  used by operators.** Both are `user-invocable: true`, and a `/skills run`
  invocation leaves no trace in this repository. I established that no *agent*
  routes them; I cannot establish that no *human* runs them.
- **Whether `kai-core-initiative-stewardship`'s backlog authority and
  `kai-core-work-granting`'s `## Backlog` section actually contradict each
  other.** I read both files' heading structures and the stewardship body's
  "one-way valve" claim, but I did not read `work-granting`'s 565 lines in full.
  I am asserting adjacency, not conflict.
- **Whether every `test/*.mjs` assertion on a skill id would fail on a rename.**
  I confirmed `tools/host-contract.mjs --self-test` diffs a golden inventory and
  `generate-catalog --check` diffs the catalog, and I counted id mentions in
  `test/`. I did not read each of the 24 self-tests in `npm test` to classify
  which mentions are assertions versus incidental strings.
- **The true cost of un-incubating a package later.** Several recommendations
  (W3, D3) are safe *given the current three-pack surface*. If kai-marketing or
  kai-learning ship later, `content-grounding` in kai-creative and a removed
  `web-content-extraction` both become problems, because
  `referenceErrors` forbids department→department. I flagged this but did not
  attempt to design for it, since the repo's own posture is that incubated
  packages are "not shipped, not discovered, not validated, not installable".
- **Whether the host actually resolves duplicate skill ids ambiguously.** The
  repo says it measured duplicate exposure on one host only (Windows 11, Copilot
  CLI 1.0.80) and treats it as unguaranteed. I took that comment at face value
  and did not test it.
- **I did not read in full:** `kai-core-work-granting`, `kai-core-work-acting`,
  `kai-core-workspace-onboarding`, `kai-core-pulse-digest`,
  `kai-core-asset-producing`, `kai-core-peer-communication`,
  `kai-core-scope-discipline`, `kai-core-operating-rules`. For those I read
  frontmatter, full heading structure, and the sections relevant to a specific
  claim. Every verdict above that depends on body content —
  `create-agent`, `fleet-observation`, `proactive-scan`, `pr-delivery`,
  `content-grounding`, `design-grounding`, `no-self-remediation`,
  `web-evaluation`, `web-content-extraction`, `issue-analysis` — rests on a full
  or substantial read of that file.
