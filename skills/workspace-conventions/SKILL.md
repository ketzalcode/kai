---
name: workspace-conventions
description: "The shared workspace contract every output-producing agent inherits. Owns WHERE agents put their work so nothing lands randomly: the four-root model (a gitignored working root for ephemeral/regenerable artifacts; a committed `knowledge/` root for durable work outcomes you distribute via git; a committed `initiatives/` root for standing intent — the north stars that steer weeks-to-months of work, scope-gated so they load only when pertinent; and a gitignored `self/` root for portable career/learning that's yours across any machine), the path grammar (`<root>/<area>/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/<artifact>`), slug + timestamp rules, the area registry, the zone-default table (which artifacts are local-only vs shareable) plus the --share/--local override, the initiative gating rule, the manifest format, the gitignore rules, and the knowledge-entry frontmatter schema. NOT a standalone trigger skill — it is invoked from inside any agent that writes a file, and materialized once per workspace by the workflow-workspace-init orchestrator. Agents read this instead of inventing their own paths."
tools: [bash, view, grep, glob]
---

# Workspace Conventions

This skill is the **shared contract** — the single source of truth for
*where* every agent in this plugin puts its work. It is the workspace
equivalent of `doc-review-rigor`: the dimension agents own *what* they
produce; this skill owns *where it lands* so the same answer is reached in
every workspace, every time.

It is **not** a standalone trigger skill. You don't invoke it directly. Any
agent that creates a file pulls it in to decide the destination, and the
`workflow-workspace-init` orchestrator materializes it once per workspace.

The rule is simple: **never invent an output path.** If you're about to
write a file, resolve its destination from this contract. If the contract
doesn't cover your case, stop and ask the operator — don't improvise a new
folder.

## The four roots

Work splits into four kinds of artifact, living in four roots with distinct
git behavior. Two axes explain why: **scope** (how broadly the artifact
applies) and **git** (whether it travels via `git pull`).

| Root | Holds | Git |
|------|-------|-----|
| `.ketzal/` (working) | ephemeral, regenerable, scratch | ignored |
| `knowledge/` | durable **work** outcomes for this workspace | committed (text) |
| `initiatives/` | standing **intent** — the north stars steering current work | committed (text) |
| `self/` | your portable **career/learning** — yours across any machine | ignored |

The boundary is **implicit by placement**: a Microsoft repo's `knowledge/`
is company-confidential by virtue of being that repo; a personal device's
`knowledge/` is your project's. `self/` is always yours and never
auto-commits into a work repo — so your cert notes never leak into company
git. No policy engine; the operator owns where things land and when to
graduate them up.

### Root 1 — the working root (ephemeral, gitignored)

Default `.ketzal/` (configurable — see *Root resolution*). Holds everything
**regenerable, heavy, or scratch**: raw captures (HAR, logs, screenshots,
traces), audio, intermediate drafts, per-run scratch. Nobody needs to
`git pull` your screenshots. This root is gitignored wholesale.

```
<repo-root>/.ketzal/
├─ CONVENTIONS.md        # human-readable copy of this contract
├─ manifest.json         # plugin version, scaffold date, resolved root, area registry
├─ qa/        eng/       product/    review/
├─ ai/        learn/     lessons/    pulse/
```

### Root 2 — the knowledge root (durable work, committed)

Always `knowledge/` (plain folder, **not** hidden, **not** gitignored).
Holds the **curated work outcomes worth distributing**: the findings,
decisions, reviews, and learnings other repos and people get when they
`git pull`. This is how work knowledge travels.

```
<repo-root>/knowledge/
├─ README.md             # the knowledge schema (types + frontmatter)
├─ reviews/              # promoted doc reviews
├─ dev-designs/          # eng decisions, architecture records, applied designs
├─ investigations/       # product strategy + deep analyses
├─ briefings/            # AI-landscape briefings (running 'what changed')
├─ qa-findings/          # promoted triage / persona reports
├─ lessons/              # team-shareable lessons (personal learning goes to self/)
├─ digests/              # weekly pulse digests
├─ learnings/            # atomic, reusable learnings
└─ playbooks/            # reusable how-tos
```

### Root 3 — the initiatives root (standing intent, committed)

Always `initiatives/` (committed). Holds the **north stars** — the durable
objectives steering a project/feature/product over weeks to months — plus
any knowledge scoped to a single initiative. A workspace can hold several;
usually zero or one is the *active focus*. Unlike `knowledge/` (which is
retrospective — what we decided/learned), an initiative is **prospective** —
where we're driving. It loads **only when the current work is in its scope**
(see *North star — initiatives*).

```
<repo-root>/initiatives/
├─ README.md             # what an initiative is + the gating + lifecycle rules
├─ ACTIVE.md             # pointer: which initiative slug(s) are the current focus
└─ <initiative-slug>/
   ├─ northstar.md       # goal, non-goals, scope gate, success, status, horizon
   ├─ log.md             # append-only trail of decisions made under this initiative
   ├─ references.md      # links into knowledge/ + self/ this initiative draws on
   └─ …                  # initiative-scoped investigations/notes, operator's discretion
```

### Root 4 — the self root (portable career/learning, gitignored)

Always `self/` (gitignored). Holds your **portable growth** — certifications,
courses, lessons authored for your own skill-building, career reflections.
It's about *you*, not the workspace's work, so it never lands in a work
repo's git. On a personal device you can point it at a personal repo to
sync; on a company machine it stays local and yours.

```
<repo-root>/self/
├─ README.md             # what self/ is (portable, personal, gitignored)
├─ lessons/              # tutor/teacher learning material (personal default)
├─ courses/              # course-to-audio study outputs
├─ certs/                # certification study notes
└─ growth/               # career-mentor reflections, promotion-signal notes
```

A working draft can be **promoted** from `.ketzal/` into `knowledge/`,
`initiatives/`, or `self/` — that promotion is the "is this durable, and which
lane?" decision (see *Picking a zone*).

## Root resolution

To resolve the working root, in order:

1. **Git root.** Find the repository root (`git rev-parse --show-toplevel`).
   All four roots live directly under it.
2. **Manifest override.** If `<repo-root>/.ketzal/manifest.json` exists and
   sets a `"root"` value, use that name instead of `.ketzal` (a workspace
   may rename it — e.g. a Microsoft repo). The `knowledge/`, `initiatives/`,
   and `self/` roots keep their names regardless.
3. **Fallback.** No git root → use `<cwd>/.ketzal/`.

Agents reference the working root **abstractly** as `<working-root>` (the
resolved name) rather than hardcoding `.ketzal`, so a renamed root still
works.

## The path grammar

Inside the working root, every area follows one shape:

```
<working-root>/<area>/<target-slug>/<YYYY-MM-DD-HHMM>-<flavor>/<artifact>
```

- **`<area>`** — one of the registered areas (below).
- **`<target-slug>`** — what the work is *about*, kebab-cased (a feature
  name, doc name, repo, URL host). Derived from the target; stable across
  runs so a target's runs sit together.
- **`<YYYY-MM-DD-HHMM>`** — local 24-hour timestamp, e.g. `2026-06-27-1842`.
  This is the canonical format everywhere — not `<run>`, not `<timestamp>`.
- **`<flavor>`** — which agent/run produced it (`pm`, `ux`, `qa`, `arch`,
  `scope`, `strategy`, `doc`, …). Lets multiple agents share one target
  folder without colliding.
- **`<artifact>`** — the file (`triage.md`, `decision.md`, `review.md`, …).

Some areas use a lighter shape (no `<flavor>`, or a different second level)
— see the registry. Slug + timestamp rules are universal.

### Slug rules

- Lowercase, kebab-case, ASCII. Spaces and `/` → `-`. Strip trailing
  punctuation. For a URL target, use the host + first path segment.
- Stable: the *same* target produces the *same* slug, so its runs group.

## Area registry

| `<area>` | Owners | Second level | Flavors |
|----------|--------|--------------|---------|
| `qa` | qa-ui, product-manager, persona-* | `<target-slug>/<ts>-<flavor>/` | `pm`, `qa`, `ux`, `trainer`, `nutritionist` |
| `eng` | swe-architect, swe-manager | `<target-slug>/<ts>-<flavor>/` | `arch`, `scope` |
| `product` | product-strategist | `<target-slug>/<ts>-strategy/` | `strategy` |
| `review` | workflow-doc-review | `<doc-slug>/<ts>-doc/` | `doc` |
| `ai` | ai-researcher, ai-applied-engineer | `<slug>/<ts>-<flavor>/` | `research`, `applied` |
| `learn` | course-to-audio, teacher | `<source-slug>/<ts>/` | — (sub-tree) |
| `lessons` | engineer-tutor | `<tutor>/<theme>/<NN>_<slug>/` | — |
| `pulse` | weekly-pulse | `<YYYY-Www>/` | — |

New area? Add a row here first, then use it. Never spin up an unregistered
area folder.

**Area-less agents.** Not every agent owns an area. The **builder/reviewer
engineers** (`swe-frontend`, `swe-backend`, `swe-infra`) are hands-on: they
edit code and return findings to chat. They write **no standalone file** —
when a reviewer, the architect, or `workflow-doc-review` solicits their
feedback, it **folds into that caller's artifact** (`decision.md`,
`review.md`). Never create a `frontend/` / `backend/` / `infra/` folder for
them.

**The personal/career lane.** The career agents (`engineer-tutor`,
`course-to-audio`, `career-mentor`) draft in the `.ketzal/learn` and
`.ketzal/lessons` areas, but their durable output **graduates to `self/`,
not `knowledge/`** — personal growth is yours, not the workspace's work
(team-relevant lessons can still `--share` into `knowledge/lessons/`). The
`persona-self` agent reads its intimate voice profile from the separate,
gitignored `.persona-self/` store and writes no standalone output.

## Picking a zone

Each artifact has a **default zone** by type. Raw, regenerable, or heavy →
ephemeral. Curated, durable, worth-sharing → knowledge. The operator can
override per run with `--share` (force into `knowledge/`) or `--local`
(keep in the working root only).

**The rubric.** Default to **knowledge** only when the artifact is a
*durable work decision or decision-input meant to be inherited* — something
another repo or teammate should `git pull` and build on (an architecture
decision, a scoped delivery plan, a strategy catalog of prioritized bets, a
doc review of a shipping argument). Default to **local** for
*observational, exploratory, or surface-snapshot* output whose value decays
with the moment (a QA report on what's broken right now, a persona's
friction walk, a private weekly digest). Send *personal growth* (lessons you
authored to learn, cert study, career notes) to **self/** — it's yours, not
the workspace's. Send *standing intent* (a north star steering weeks of
work) to **initiatives/**. When in doubt, **local** — promotion is one
`--share` away, but you can't quietly un-share committed history.

| Area / artifact | Default zone | If promoted, lands in |
|-----------------|--------------|-----------------------|
| qa: HAR, logs, zip, screenshots, traces | **ephemeral** | — (never) |
| qa: `triage.md`, persona/QA reports | **local** (situational snapshot) | `knowledge/qa-findings/` (only with `--share`) |
| eng: `decision.md`, `plan.md` | **knowledge** | `knowledge/dev-designs/` |
| product: `catalog.md` | **knowledge** | `knowledge/investigations/` |
| review: `review.md` | **knowledge** | `knowledge/reviews/` |
| ai: `briefing.md` | **knowledge** | `knowledge/briefings/` |
| ai: `design.md` | **knowledge** | `knowledge/dev-designs/` |
| initiatives: `northstar.md`, `log.md` | **initiatives** (committed intent) | — (lives in `initiatives/`) |
| learn: `raw/`, `audio/`, `*.mp3` | **ephemeral** | — (never) |
| learn/lessons: lesson markdown, `narration.md`, `index.html` | **self** (personal growth) | `knowledge/lessons/` (only with `--share`, when team-relevant) |
| growth: career-mentor reflections | **self** (personal) | — (stays in `self/`) |
| lessons: shared curricula | **self** by default | `knowledge/lessons/` (with `--share`) |
| pulse: raw sources | **ephemeral** | — (never) |
| pulse: weekly digest | **ephemeral** (privacy-first) | `knowledge/digests/` (only with `--share`) |

**How promotion works.** Produce the working draft in the working root
first (cheap, local, can be messy). If its default zone is knowledge — or
the operator passed `--share` — copy the curated text artifact into the
matching `knowledge/<type>/<slug>/` path, add the frontmatter (below), and
commit *that* copy. The working-root copy stays as the scratch/source.

**Zone is not gitignore.** Even inside the knowledge root, **binaries and
heavy regenerables stay ignored** (`*.mp3`, `*.har`, `*.zip`, `audio/`,
`raw/`, screenshots). The knowledge zone commits **text** — markdown,
small assets, structured data — not megabytes of audio. A shared lesson
commits its markdown + HTML; its audio regenerates on demand.

## North star — initiatives

A **initiative** is a north star: a durable objective steering a
project/feature/product over weeks to months. It's the answer to "what are
we driving toward right now?" — and it exists so agents pull the same
strategic context across many sessions instead of re-deriving it each time.

Crucially, an initiative loads **only when pertinent**. This is the steering-file
inclusion-mode pattern (Kiro `.kiro/steering/`, Cursor rules): standing
context that activates on a scope match, not on every turn. Side
investigations and unrelated features never trigger it, so they stay clean.

### The gating rule (every steering agent inherits this)

Before substantial work on a project/feature, glance at `initiatives/ACTIVE.md`
(the O(1) check — it names the focus initiative slug(s)). Then:

1. **Match scope.** Open the active initiative's `northstar.md` and read its
   `scope:` (repos / target-slugs / keywords). Load the initiative **only if**
   the current target matches — its repo, a listed target-slug, a keyword,
   or the user's stated goal lines up.
2. **Otherwise, load nothing.** If the work is a side investigation, a
   different feature, or the user flagged it quick/unrelated → operate
   context-free. An initiative you don't load can't pollute unrelated work.
3. **When loaded, steer toward it.** Frame proposals, prioritization, and
   scoping toward the north star. Note in your output which initiative it
   served, and stamp `initiative: <slug>` in the frontmatter of any promoted
   knowledge so the decision trail links back to the objective.
4. **Ambiguous? Ask once.** If you can't tell whether the work belongs to a
   initiative, ask the operator rather than guessing.

### Initiative frontmatter (`northstar.md`)

```yaml
---
type: initiative
title: <human title>
slug: <kebab-slug>
status: active        # active | paused | shipped | archived
horizon: <e.g. 2026-Q3>
scope:
  repos: []           # repo names this initiative governs
  targets: []         # target-slugs (features/components) in scope
  keywords: []        # words in a request that signal this initiative
created: <YYYY-MM-DD>
owner: <operator>
related: []           # knowledge/ + self/ slugs this initiative draws on
---
```

`ACTIVE.md` is a thin pointer — a list of the currently-active initiative
slug(s) and one line each on why. Lifecycle: an initiative moves
`active → paused → shipped → archived`; `log.md` is the append-only trail of
decisions made under it. The `initiatives/README.md` (written by the init
workflow) holds the full schema.

## Knowledge-entry frontmatter

Every file promoted into `knowledge/` carries frontmatter so entries are
findable and cross-link into a graph:

```yaml
---
type: <reviews|dev-designs|investigations|briefings|qa-findings|lessons|digests|learnings|playbooks>
title: <human title>
slug: <kebab-slug>
created: <YYYY-MM-DD>
source: <what produced it — agent name + working-root run path>
target: <what it's about — feature/doc/repo/url>
related: []      # slugs of other knowledge entries this links to
---
```

The `knowledge/README.md` (written by the init workflow) holds the full
schema. Keep `related` honest — link only what's genuinely connected.

## manifest.json

Written once by `workflow-workspace-init`, read by agents to resolve the
root and confirm the workspace is scaffolded:

```json
{
  "plugin": "kai",
  "version": "<plugin version at scaffold time>",
  "scaffolded": "<YYYY-MM-DD>",
  "root": ".ketzal",
  "knowledge": "knowledge",
  "initiatives": "initiatives",
  "self": "self",
  "areas": ["qa", "eng", "product", "review", "ai", "learn", "lessons", "pulse"]
}
```

If an agent runs and the manifest is **missing**, that means the workspace
was never onboarded. Note it to the operator and suggest running
`workflow-workspace-init` — then fall back to defaults (`.ketzal/`,
`knowledge/`, `initiatives/`, `self/`) so work isn't blocked.

## How an agent uses this contract

1. Resolve `<working-root>` (git root + manifest override).
2. **Check for an active initiative** (`initiatives/ACTIVE.md`). If the current
   target matches its `scope`, load it and steer toward it; otherwise work
   context-free (see *North star — initiatives*).
3. Build the working path from the grammar + the area registry.
4. Write the working draft there.
5. Look up the artifact's **default zone**; honor any `--share` / `--local`.
6. If knowledge: copy the curated text into `knowledge/<type>/<slug>/`, add
   frontmatter (stamp `initiative:` if one was loaded), and commit that copy.
   If personal growth: graduate into `self/`. If standing intent: it lives
   in `initiatives/`.
7. Never create folders outside this contract. Unsure → ask the operator.
