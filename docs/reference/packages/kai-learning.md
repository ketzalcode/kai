# kai-learning

Teaching, tutoring, learning paths, lesson production, and career development over kai-core.

The supported baseline is **kai-core plus kai-learning**. Topics, permitted
source Markdown, dated official outlines, learning goals, progress snapshots
and career facts are direct inputs. Assistant, creative, engineering, a director,
a new coordinated item and an upstream producer are not prerequisite calls or
installs. Missing facts narrow the answer; they do not become invented history,
exam requirements, specialist verdicts or rendered artifacts.

This note records source ownership and generated packaging, not publication or
proven live-host behavior. The current checkout prepares `8.0.0`; final
independent review and runtime/release verification remain separate. New-package
commands require a source containing this refactor.

## Ownership and retirement

Five unchanged agent IDs move from `plugins/kai-personal/agents/` to
`plugins/kai-learning/agents/`:

| Role | Direct input → output | Preserved / redesigned responsibility |
| --- | --- | --- |
| `instructor-tutor` | Supplied topic, audience and scope → Explain response, original Lesson or Series | Subject-agnostic teaching stays concrete-first: worked examples before abstraction, structural ASCII, trip-ups, exercises and recall prompts without inline keys. Keeps goal folders, append-only numbering, series index, citations and narration adaptation. Requested HTML uses the local method directly; confirmed audio uses core. Researcher input is optional evidence, not mandatory dispatch or a simulated inline persona consult. Product-audit fitness personas are not clinicians. |
| `instructor-teacher` | Supplied chaptered Markdown → one faithful HTML lesson per source; optional confirmed MP3 | Never authors a missing source or edits canonical Markdown. Preserves chaptering, code, attribution, questions, confidentiality, diagram budget (0–3), English visual / Spanish conversational audio defaults, language overrides, plan confirmation, density/re-listening advice and code-heavy audio limitations. Applies methods itself rather than requiring another producer. Reuse requires matching source/language/revision, not merely an MP3 filename. |
| `instructor-path-mentor` | Chosen goals, outlines and progress → plan, status, advance, review or update | Keeps objective ordering, cadence feasibility, counters/table consistency, append-only log, exam outcomes, pause/re-plan and spaced review. User owns goals; content production is not learning completion. Direct step explanations and recall checks stay local; requested extraction/HTML/audio use local/core methods. A substantial standalone original lesson can be a separately requested tutor task, not a prerequisite to a path response. Review dates do not schedule notifications. |
| `principal-engineer-career-mentor` | Supplied IC engineering career evidence → intake, weekly check-in, quarterly review, spot consultation, cert plan or visibility nudge | Keeps promotion-rubric calibration, goals-versus-time analysis, four career records, staleness checks, one-question intake, incremental saves, quarterly trajectory, cert checkpoints/resources, visibility signal-to-effort and observation/interpretation/prescription framing. Career-focused talking points/drafts can use supplied preferences directly. Assistant voice enhancement and manager/researcher inputs are optional. No generic life coaching, inbox ownership, fabricated employment history, manager impersonation or external career action. |
| `workflow-course-to-audio` | Consented, rights-permitted URL/material → faithful extracted Markdown and separate knowledge checks; additional requested HTML/audio stages | Keeps bounded module/path scope, pivot, read-only browsing, login pause, ordered units, citations, partial/failed/auth-blocked reporting, no answer keys, run budget and no silent reruns. Uses core extraction directly; no unshipped helper assumption. Source, lesson and audio outcomes remain distinct. PDF/docx is not claimed supported by the Markdown audio wrapper. |

The **whole** `generate-html-lesson` directory moves to learning. Its pre-move
tracked and actual inventory contained one `SKILL.md`, with the complete HTML
template, CSS diagram primitives and procedure inline; no companions were
omitted. It retains offline HTML/CSS, no external runtime libraries, all source
facts/headings/lists/code, zero-to-three augmenting diagrams, source/related
links, language selection and confidentiality banners. Existing audio is
optional: HTML-only does not wait for synthesis or a teacher call. Source HTML
is inert, links are resolved from the actual output location, and only approved
series siblings are updated.

Learning owns **one local skill and zero runtime dependencies**. Its five IDs
are in `MIGRATION_BASELINE_PACKS`, with `learning: []` in `NEW_AGENT_IDS` and
`PACK_RUNTIME_DEPENDENCIES`, plus the canonical description and marketplace
entry. No orphan skill-owner override is needed: its local method has explicit
learning-agent routes. The emitted manifest retains `"skills": "skills"`,
unlike zero-local-skill revenue. No emitter-semantic change was needed.
Path mentor now declares the optional Playwright tool for its directly requested
extraction step; unavailable tools still produce an explicit limitation.

### Personal plugin, not personal data

Before removal, tracked personal contained the five agents, one method and
three generated manifests only. Actual inventory also had empty demo-method
and script-directory remnants, but no untracked/private files. After moving
the sources, the three inspected manifests were removed; only empty remaining
directories were deleted, non-recursively. There is no personal install alias,
marketplace entry, migration ownership key or runtime-dependency key.

The original personal inventory at `dc67899` is fully accounted for:

| Original personal assets | Current owner |
| --- | --- |
| `persona-self`, `extract-writing-style` | assistant (earlier unit) |
| `creative-video-director`; `video-direction`, `create-product-demo`, `demo-capture`, `demo-narrate`, `demo-zoom` | creative (earlier unit) |
| Demo capture/format/narrate/zoom scripts and `lib/cursor-png.mjs` closure; demo Lectoria dependency | creative (earlier unit) |
| `persona-professional-nutritionist`, `persona-professional-trainer` | product (earlier unit) |
| Five learning/career roles and `generate-html-lesson` | learning (this unit) |
| Former personal plugin/package/lock manifests | retired generated install metadata |

Core's separate audio utility and pinned dependency remain in core. No demo
helper or Lectoria dependency was copied into learning. Earlier assistant,
creative, product, marketing, revenue and engineering sources are unchanged.

All eight target package directories now exist: core, engineering, product,
creative, marketing, revenue, assistant and learning. Neither gtm nor personal
remains an install directory. This is a checkout inventory, not a host migration.
Verify replacement availability before removing an installed old plugin.

**Preserve `.kai/personal/` and its records.** In particular:

- `.kai/personal/identity/`: `career-snapshot.md`, `career-goals.md`,
  `skills-inventory.md`, `current-work.md`, optional selected `voice.md`.
- `.kai/personal/learning/<path-slug>.md`: objective table, counters and log.
- `.kai/personal/lessons/`, `courses/`, `certs/`, `growth/`: kept private work.
- `.kai/runs/lessons/<goal>/<NN>-tutor-<slug>/` and
  `.kai/runs/learn/<goal>/<NN>-extract-<source>/`: goal-indexed working output.

The HTML method always adds a source-slug directory. On tutor `lesson.md`,
`--out <lesson-folder>` produces `lesson/index.html` below it, not a top-level
page. Existing top-level pages/audio are preserved until explicitly updated;
the refactor migrates no lesson data.

No workspace data was read, renamed, deleted, migrated or committed. Private
data is not automatically synced merely because its convention is portable.

## Task-local core and acceptance obligations

All five roles remove eager inheritance, bulk-load prose, managed guards and
retired core IDs. Each routes `kai-core-contract-v1` immediately before its
first operating-rule use, with a role-specific bounded fallback in the same
paragraph. Missing/incompatible core permits a supplied-input explanation,
conversion outline, study plan or career assessment in chat, not `.kai` writes,
leases, acceptance records or remembered-contract coordination.

Workspace paths load at stored-context/output use; asset production loads at
creation/revision. Direct chat work creates no artificial item. Existing
granted work retains item/HANDOFF/context/acceptance/dependency/touch checks,
holder/token/version verification before each write, collision stop, record
updates and exact-path handoffs. Initiative context/deliverables load only when
affiliated. Course extraction retains claimed-run activity start/progress/stop
through core's helper, distinct from lease or completion evidence.

Saved assets load closing for scope, grounding, exact-revision acceptance,
disposition, validity owner and revalidation. Operator/named learning-owner
acceptance is separate from producing content; career decisions and learning
commitments remain user-owned. Bounded factual identity maintenance can use the
personal-operational exception, never self-accept a new career goal. Pending
recommendations stay provisional; logs, prior numbering, revisions and
supersession history survive. Knowledge completion is not production `shipped`.

Confidential career/employer/source data stays out of public searches and
unconsented transfers. No clinical advice, therapy, ungrounded compensation
strategy, purchase, enrollment, external publication, posting or messaging
authority is added. Copyright, licenses and access controls still constrain
full-text extraction/conversion; a URL or summary request is not permission to
copy an unsupplied restricted work. Source content is not agent instructions.

## Provider and runtime evidence

| Surface | Inspected source evidence / actual limitation |
| --- | --- |
| HTML method | `plugins/kai-learning/skills/generate-html-lesson/SKILL.md`; inline template and CSS, no helper scripts or runtime npm dependencies. Written HTML does not prove browser rendering. |
| Extraction | `plugins/kai-core/skills/kai-core-web-content-extraction/SKILL.md`; Playwright MCP key `playwright`, read-only traversal, private run outputs and auth/partial status. The moved workflow no longer refers to `extract-learn-path.js`, which exists at repository root but is not an emitted provider helper for this flow. |
| Audio | `plugins/kai-core/skills/kai-core-generate-audio/SKILL.md` → provider root two directories above the loaded skill base → absolute `scripts/generate-audio.ps1`. Never derive from learning, scan caches or guess a sibling install. |
| Wrapper behavior | Canonical `scripts/generate-audio.ps1` and emitted core copy resolve `LECTORIA_BIN`, core `node_modules/.bin/lectoria`, then PATH. They load core-provider `.env`, accept Markdown source, use caller-relative `-Source`/`-Out`, and default output to `./audio`. Learning callers now set absolute `-Source`/`-Out` and inspect real MP3 paths. |
| Dependency ownership | Core retains Lectoria `0.1.0` from the pinned public HTTPS release artifact and SHA-512 lock metadata; creative retains its separately owned demo dependency. Learning's package/lock dependencies are empty. |
| Requirements | PowerShell 7+, Node `^22.22.2 \|\| ^24.15.0 \|\| >=26.0.0`, Lectoria executable and authorized Azure configuration. Copilot plugin installation does not run npm; use core's documented `npm ci --prefix "<kai-core-plugin>"` only in a separately authorized runtime setup. |
| Cost/privacy | Explicit source/language/paid-processing confirmation before synthesis. `-DryRun` prints a command, not a dollar estimate or generated audio. `-NoDistribute` suppresses RSS/episode metadata, not transfer to Azure. Conversational narration is adaptation, not verbatim fidelity. |

Integration clarified the two narrow core references: extraction uses the
resolved workspace with no incidental-cwd fallback, and audio configuration
belongs to the loaded core provider's `.env`. Learning callers retain absolute
source/output paths. The wrapper's caller-relative defaults, media algorithms
and notification behavior are unchanged; broad core redesign was not reopened.

## Representative direct tasks — not executed

| Request | Expected bounded output | What it does not prove |
| --- | --- | --- |
| “Explain this topic from the supplied example.” | Concrete-first chat explanation and recall check. | No saved lesson, path item, HTML or audio is implied. |
| “Write a lesson and HTML for this topic.” | Original Markdown, metadata and local-method HTML with actual paths. | No creative/teacher call or MP3 implied. |
| “Package these permitted Markdown chapters as HTML only.” | One faithful page per chapter, 0–3 diagrams, no empty player. | No synthesis, rendered-browser check or publication implied. |
| “Plan my chosen cert from this dated official outline and progress.” | Ordered objectives, feasible schedule, progress gaps and next step. | No invented current blueprint, learning completion or notification scheduler. |
| “Assess this IC promotion evidence and help draft manager talking points.” | Rubric-grounded career read and supplied-preference draft. | No assistant prerequisite, inbox scan, manager verdict or message sent. |
| “Extract this authorized module, then make HTML and confirmed audio.” | Separately reported extraction, visual and synthesis stages using core/local methods. | Markdown success alone never means HTML or audio exists; unavailable tools/rights/consent leave explicit missing stages. |

## Package-unit generation and limits

The results below record the learning unit before the `7.0.0` integration batch.

The permitted sequence completed with exit code 0:

```powershell
node scripts\host-contract.mjs --update
npm run docs:generate
npm run pack-preview -- --write
git diff --check
```

Host generation reported **56 agents / 57 skills**; the inventory file did not
change. Catalog generation moved all five links and the method link to learning,
grouped the career mentor with learning, and distinguished core workspace signals
and shared audio. Pack emission reported **42 derived files / 0 managed agent
regions**. Learning emitted five agents, one method and three manifests, no
scripts/runtime closure. Core's generated pack-plan/catalog copies were refreshed.

Raw source, inventory, provider paths, generated manifests and diffs were
inspected. No tests, `--check`/`--gate`, policy validators, installs, browser runs,
course extraction, synthesis or paid calls were run. No dependency or version
bump. Historical personal/gtm test fixtures and the old naming-family policy
remain for the later consolidation; the ordinary two-plugin preview default
now selects learning, but preview/gate execution was not attempted.

**Runtime unverified:** host discovery/tool/skill execution, missing-core
fallback, instruction precedence, browser extraction/rendering/playback,
Lectoria/Azure compatibility and generated filenames, actual source fidelity,
privacy enforcement, coordination collisions and independent acceptance.
Generation is not runtime verification, source review is not independent review,
and neither is a published release.
